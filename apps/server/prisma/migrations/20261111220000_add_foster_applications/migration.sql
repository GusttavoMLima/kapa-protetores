BEGIN;
CREATE TYPE "FosterApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TABLE "tb_foster_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "availability" VARCHAR(240) NOT NULL,
    "home_notes" VARCHAR(2000) NOT NULL,
    "status" "FosterApplicationStatus" NOT NULL DEFAULT 'pending',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tb_foster_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tb_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "tb_foster_applications_user_id_key" ON "tb_foster_applications"("user_id");
CREATE INDEX "tb_foster_applications_submitted_at_id_idx" ON "tb_foster_applications"("submitted_at", "id");
ALTER TABLE "tb_foster_applications" ENABLE ROW LEVEL SECURITY;
COMMIT;
