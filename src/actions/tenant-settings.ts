"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { runTimezoneMigrationPipeline } from "@/lib/timezone-pipeline";

export async function updateTenantProfileAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const businessName = formData.get("businessName") as string;
    const timezone = formData.get("timezone") as string;
    const weekStart = parseInt(formData.get("weekStart") as string, 10);
    const dateFormat = formData.get("dateFormat") as string;
    
    if (!timezone) {
      throw new Error("Timezone is required");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        businessName,
        timezone,
        weekStart,
        dateFormat,
      },
    });

    revalidatePath("/user/settings");
    revalidatePath("/user/dashboard"); // since timezone is shown there
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
