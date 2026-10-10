-- CreateTable
CREATE TABLE "tb_adopter_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferred_species" "Species",
    "preferred_gender" "Genders",
    "preferred_size" INTEGER,
    "preferred_energy" INTEGER,
    "preferred_kid_friendly" INTEGER,
    "preferred_noise" INTEGER,
    "preferred_age_stage" INTEGER,
    "lives_in_apartment" BOOLEAN,
    "has_other_pets" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_adopter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_adopter_profiles_user_id_key" ON "tb_adopter_profiles"("user_id");

-- CreateIndex
CREATE INDEX "tb_events_animalId_idx" ON "tb_events"("animalId");

-- CreateIndex
CREATE INDEX "tb_events_userId_type_idx" ON "tb_events"("userId", "type");

-- AddForeignKey
ALTER TABLE "tb_adopter_profiles" ADD CONSTRAINT "tb_adopter_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tb_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
