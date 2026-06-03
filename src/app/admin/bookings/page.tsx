import { getBookings } from "@/actions/admin-bookings";
import { BookingFilters, BookingTable } from "@/components/admin/booking-table";
import { auth } from "@/lib/auth";
import { getTranslator } from "@/lib/i18n/server";

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const [params, session, { t }] = await Promise.all([
    searchParams,
    auth(),
    getTranslator(),
  ]);
  const status = params.status || "ALL";
  const search = params.search || "";
  const isOwner = session?.user?.role === "OWNER";

  const bookings = await getBookings({
    status: status !== "ALL" ? status : undefined,
    search: search || undefined,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("admin.bookings.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("admin.bookings.subtitle", { count: bookings.length })}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <BookingFilters currentStatus={status} currentSearch={search} />
      </div>

      {/* Table */}
      <BookingTable bookings={bookings} isOwner={isOwner} />
    </div>
  );
}
