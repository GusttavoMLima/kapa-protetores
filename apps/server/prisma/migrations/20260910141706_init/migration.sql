-- CreateEnum
CREATE TYPE "AdoptionStatus" AS ENUM ('pending', 'interviewing', 'approved', 'rejected', 'canceled');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('adopter', 'protector', 'admin', 'volunteer');

-- CreateEnum
CREATE TYPE "Conditions" AS ENUM ('healthy', 'injured', 'debilitated');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('dog', 'cat', 'other');

-- CreateEnum
CREATE TYPE "Genders" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('rescued', 'treating', 'available', 'adopted');

-- CreateEnum
CREATE TYPE "TriageStatus" AS ENUM ('yes', 'no', 'unknown');

-- CreateTable
CREATE TABLE "tb_users" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'protector',
    "rules" TEXT[],
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "avatar" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_animals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "gender" "Genders" NOT NULL,
    "weightKg" DECIMAL(65,30) NOT NULL,
    "age" INTEGER NOT NULL,
    "ageStage" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "kidFriendly" INTEGER NOT NULL,
    "noiseLevel" INTEGER NOT NULL,
    "apartmentFriendly" BOOLEAN NOT NULL,
    "otherPetFriendly" BOOLEAN NOT NULL,
    "healthCondition" "Conditions" NOT NULL,
    "castrated" "TriageStatus" NOT NULL,
    "vaccinated" BOOLEAN NOT NULL,
    "dewormed" "TriageStatus" NOT NULL,
    "rescuedAt" TIMESTAMP(3) NOT NULL,
    "place" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "observations" TEXT,
    "status" "AnimalStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_animal_photos" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" TEXT,

    CONSTRAINT "tb_animal_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_favorites" (
    "userId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_favorites_pkey" PRIMARY KEY ("userId","animalId")
);

-- CreateTable
CREATE TABLE "tb_adoptions" (
    "id" TEXT NOT NULL,
    "adopterId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "status" "AdoptionStatus" NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_adoptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "animalId" TEXT,
    "payload" JSONB,
    "emittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_animal_post" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_animal_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_community_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cep" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_community_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_community_event_volunteers" (
    "volunteerId" TEXT NOT NULL,
    "communityEventId" TEXT NOT NULL,

    CONSTRAINT "tb_community_event_volunteers_pkey" PRIMARY KEY ("volunteerId","communityEventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_users_email_key" ON "tb_users"("email");

-- CreateIndex
CREATE INDEX "tb_users_username_idx" ON "tb_users"("username");

-- CreateIndex
CREATE INDEX "tb_animals_status_idx" ON "tb_animals"("status");

-- CreateIndex
CREATE INDEX "tb_animals_species_idx" ON "tb_animals"("species");

-- CreateIndex
CREATE INDEX "tb_animals_species_status_idx" ON "tb_animals"("species", "status");

-- CreateIndex
CREATE INDEX "tb_animal_photos_animalId_idx" ON "tb_animal_photos"("animalId");

-- CreateIndex
CREATE INDEX "tb_favorites_userId_idx" ON "tb_favorites"("userId");

-- CreateIndex
CREATE INDEX "tb_favorites_animalId_idx" ON "tb_favorites"("animalId");

-- CreateIndex
CREATE INDEX "tb_adoptions_adopterId_idx" ON "tb_adoptions"("adopterId");

-- CreateIndex
CREATE INDEX "tb_adoptions_animalId_idx" ON "tb_adoptions"("animalId");

-- CreateIndex
CREATE INDEX "tb_adoptions_status_idx" ON "tb_adoptions"("status");

-- CreateIndex
CREATE INDEX "tb_events_type_idx" ON "tb_events"("type");

-- CreateIndex
CREATE INDEX "tb_events_userId_idx" ON "tb_events"("userId");

-- CreateIndex
CREATE INDEX "tb_animal_post_animalId_idx" ON "tb_animal_post"("animalId");

-- CreateIndex
CREATE INDEX "tb_community_event_volunteers_volunteerId_idx" ON "tb_community_event_volunteers"("volunteerId");

-- CreateIndex
CREATE INDEX "tb_community_event_volunteers_communityEventId_idx" ON "tb_community_event_volunteers"("communityEventId");

-- AddForeignKey
ALTER TABLE "tb_animal_photos" ADD CONSTRAINT "tb_animal_photos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "tb_animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_favorites" ADD CONSTRAINT "tb_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_favorites" ADD CONSTRAINT "tb_favorites_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "tb_animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_adoptions" ADD CONSTRAINT "tb_adoptions_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "tb_animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_adoptions" ADD CONSTRAINT "tb_adoptions_adopterId_fkey" FOREIGN KEY ("adopterId") REFERENCES "tb_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_events" ADD CONSTRAINT "tb_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_events" ADD CONSTRAINT "tb_events_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "tb_animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_animal_post" ADD CONSTRAINT "tb_animal_post_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "tb_animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_community_event_volunteers" ADD CONSTRAINT "tb_community_event_volunteers_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "tb_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_community_event_volunteers" ADD CONSTRAINT "tb_community_event_volunteers_communityEventId_fkey" FOREIGN KEY ("communityEventId") REFERENCES "tb_community_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
