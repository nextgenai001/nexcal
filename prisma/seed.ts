// prisma/seed.ts
// NexCal v3.0 — Fresh seed for multi-tenant platform

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding NexCal v3.0...");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123456";
  const tenant1Password = process.env.SEED_TENANT1_PASSWORD || "tenant123456";
  const tenant2Password = process.env.SEED_TENANT2_PASSWORD || "tenant123456";

  // ─── Platform Admin ────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@nexcal.app" },
    update: {},
    create: {
      username: "admin",
      email: "admin@nexcal.app",
      hashedPassword: await bcrypt.hash(adminPassword, 12),
      name: "Platform Admin",
      role: "PLATFORM_ADMIN",
      timezone: "UTC",
    },
  });
  console.log(`✅ Platform Admin: ${admin.email}`);

  // ─── Demo Tenant 1: Tech Startup ────────────────────────────────────────────
  const tenant1 = await prisma.user.upsert({
    where: { email: "demo@acmecorp.com" },
    update: {},
    create: {
      username: "acmecorp",
      email: "demo@acmecorp.com",
      hashedPassword: await bcrypt.hash(tenant1Password, 12),
      name: "Acme Corp",
      role: "TENANT",
      businessName: "Acme Corporation",
      timezone: "America/New_York",
    },
  });
  console.log(`✅ Tenant 1: ${tenant1.email} (@${tenant1.username})`);

  // Event types for tenant 1
  const event1 = await prisma.eventType.upsert({
    where: { userId_slug: { userId: tenant1.id, slug: "30-min-demo" } },
    update: {},
    create: {
      userId: tenant1.id,
      slug: "30-min-demo",
      name: "30-Minute Product Demo",
      description: "A quick walkthrough of our platform features.",
      duration: 30,
      bufferTime: 10,
      color: "#6366f1",
      customFields: [
        { id: "full_name", label: "Full Name", type: "text", required: true },
        { id: "email", label: "Email Address", type: "email", required: true },
        { id: "phone", label: "Phone Number", type: "phone", required: false },
        { id: "company", label: "Company Name", type: "text", required: false },
        { id: "message", label: "What would you like to discuss?", type: "textarea", required: false },
      ],
    },
  });

  const event2 = await prisma.eventType.upsert({
    where: { userId_slug: { userId: tenant1.id, slug: "1hr-consultation" } },
    update: {},
    create: {
      userId: tenant1.id,
      slug: "1hr-consultation",
      name: "1-Hour Consultation",
      description: "Deep-dive consultation session for enterprise clients.",
      duration: 60,
      bufferTime: 15,
      color: "#8b5cf6",
      customFields: [
        { id: "full_name", label: "Full Name", type: "text", required: true },
        { id: "email", label: "Email Address", type: "email", required: true },
        { id: "phone", label: "Phone Number", type: "phone", required: true },
        { id: "company", label: "Company Name", type: "text", required: true },
        {
          id: "team_size",
          label: "Team Size",
          type: "select",
          required: false,
          options: ["1-10", "11-50", "51-200", "200+"],
        },
      ],
    },
  });

  // Schedules for tenant 1 (Mon-Fri, 9am-5pm ET)
  await prisma.schedule.deleteMany({ where: { userId: tenant1.id } });
  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    await prisma.schedule.create({
      data: {
        userId: tenant1.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
    });
  }

  // Sample bookings for tenant 1
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(14, 0, 0, 0); // 14:00 UTC = 10:00 ET

  await prisma.booking.create({
    data: {
      userId: tenant1.id,
      eventTypeId: event1.id,
      status: "CONFIRMED",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
      customerName: "Sarah Johnson",
      customerEmail: "sarah@example.com",
      customerPhone: "+1 555-0101",
      customFieldData: {
        company: "TechStartup Inc",
        message: "Interested in enterprise plan",
      },
      notes: "VIP lead from marketing campaign",
    },
  });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setUTCHours(16, 0, 0, 0); // 16:00 UTC = 12:00 ET

  await prisma.booking.create({
    data: {
      userId: tenant1.id,
      eventTypeId: event2.id,
      status: "PENDING",
      startTime: dayAfter,
      endTime: new Date(dayAfter.getTime() + 60 * 60 * 1000),
      customerName: "Michael Chen",
      customerEmail: "mchen@bigcorp.com",
      customerPhone: "+1 555-0202",
      customFieldData: { company: "BigCorp", team_size: "51-200" },
    },
  });

  console.log(
    `✅ Event types + schedules + bookings created for ${tenant1.username}`
  );

  // ─── Demo Tenant 2: Freelance Designer ─────────────────────────────────────
  const tenant2 = await prisma.user.upsert({
    where: { email: "hello@janedoe.design" },
    update: {},
    create: {
      username: "janedoe",
      email: "hello@janedoe.design",
      hashedPassword: await bcrypt.hash(tenant2Password, 12),
      name: "Jane Doe",
      role: "TENANT",
      businessName: "Jane Doe Design Studio",
      timezone: "Europe/London",
    },
  });
  console.log(`✅ Tenant 2: ${tenant2.email} (@${tenant2.username})`);

  // Event type for tenant 2
  const event3 = await prisma.eventType.upsert({
    where: { userId_slug: { userId: tenant2.id, slug: "discovery-call" } },
    update: {},
    create: {
      userId: tenant2.id,
      slug: "discovery-call",
      name: "Discovery Call",
      description: "30-minute chat to discuss your design project.",
      duration: 30,
      bufferTime: 5,
      color: "#ec4899",
      customFields: [
        { id: "full_name", label: "Full Name", type: "text", required: true },
        { id: "email", label: "Email Address", type: "email", required: true },
        {
          id: "project_type",
          label: "Project Type",
          type: "select",
          required: true,
          options: ["Logo Design", "Brand Identity", "Website Design", "Other"],
        },
        {
          id: "budget",
          label: "Budget Range",
          type: "select",
          required: false,
          options: ["< $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000+"],
        },
        {
          id: "message",
          label: "Tell me about your project",
          type: "textarea",
          required: true,
        },
      ],
    },
  });
  void event3; // suppress unused variable warning

  // Schedules for tenant 2 (Mon-Thu, 10am-4pm GMT)
  await prisma.schedule.deleteMany({ where: { userId: tenant2.id } });
  for (const dayOfWeek of [1, 2, 3, 4]) {
    await prisma.schedule.create({
      data: {
        userId: tenant2.id,
        dayOfWeek,
        startTime: "10:00",
        endTime: "16:00",
        isActive: true,
      },
    });
  }

  console.log(
    `✅ Event types + schedules created for ${tenant2.username}`
  );

  // ─── Audit Log: seed actions ────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        action: "USER_CREATED",
        actorId: admin.id,
        targetId: tenant1.id,
        metadata: { note: "seed" },
      },
      {
        action: "USER_CREATED",
        actorId: admin.id,
        targetId: tenant2.id,
        metadata: { note: "seed" },
      },
    ],
  });

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log(`👑 Platform Admin: admin@nexcal.app / ${adminPassword}`);
  console.log(
    `🏢 Tenant 1: demo@acmecorp.com / ${tenant1Password}  (@acmecorp)`
  );
  console.log(
    `🎨 Tenant 2: hello@janedoe.design / ${tenant2Password}  (@janedoe)`
  );
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("[NexCal Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
