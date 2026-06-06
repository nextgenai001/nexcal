-- DropIndex
DROP INDEX "schedules_user_id_day_of_week_start_time_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "global_breaks" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "schedules_user_id_day_of_week_idx" ON "schedules"("user_id", "day_of_week");
