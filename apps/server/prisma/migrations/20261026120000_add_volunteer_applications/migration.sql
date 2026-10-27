-- CreateEnum
CREATE TYPE "VolunteerApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "tb_volunteer_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "VolunteerApplicationStatus" NOT NULL DEFAULT 'pending',
    "applicationData" JSONB NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_volunteer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tb_volunteer_applications_userId_idx" ON "tb_volunteer_applications"("userId");

-- CreateIndex
CREATE INDEX "tb_volunteer_applications_status_idx" ON "tb_volunteer_applications"("status");

-- CreateIndex
CREATE INDEX "tb_volunteer_applications_userId_status_idx" ON "tb_volunteer_applications"("userId", "status");

-- AddForeignKey
ALTER TABLE "tb_volunteer_applications" ADD CONSTRAINT "tb_volunteer_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
