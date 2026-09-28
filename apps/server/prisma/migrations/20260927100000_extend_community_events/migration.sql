CREATE TYPE "CommunityEventType" AS ENUM ('care', 'cleaning', 'event', 'transport');

ALTER TABLE "tb_community_events"
ADD COLUMN "type" "CommunityEventType" NOT NULL DEFAULT 'event',
ADD COLUMN "endAt" TIMESTAMP(3),
ADD COLUMN "location" VARCHAR(200),
ADD COLUMN "vacancies" INTEGER;