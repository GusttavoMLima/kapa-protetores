ALTER TABLE "tb_foster_applications"
    ADD COLUMN "home_address" VARCHAR(500),
    ADD COLUMN "has_other_animals" BOOLEAN,
    ADD COLUMN "has_perimeter_barrier" BOOLEAN,
    ADD COLUMN "has_secure_gate" BOOLEAN;
