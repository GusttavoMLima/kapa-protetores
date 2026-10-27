-- CreateEnum
CREATE TYPE "VolunteerAvailability" AS ENUM ('weekdays', 'weekends', 'flexible');

-- AlterTable
ALTER TABLE "tb_volunteer_applications"
DROP COLUMN "applicationData",
ADD COLUMN "fullName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN "areasOfInterest" "CommunityEventType"[],
ADD COLUMN "availability" "VolunteerAvailability" NOT NULL DEFAULT 'flexible',
ADD COLUMN "motivation" TEXT NOT NULL DEFAULT '',
ADD COLUMN "acceptsTerms" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable (remove temporary defaults used for migration safety)
ALTER TABLE "tb_volunteer_applications"
ALTER COLUMN "fullName" DROP DEFAULT,
ALTER COLUMN "phone" DROP DEFAULT,
ALTER COLUMN "availability" DROP DEFAULT,
ALTER COLUMN "motivation" DROP DEFAULT;
