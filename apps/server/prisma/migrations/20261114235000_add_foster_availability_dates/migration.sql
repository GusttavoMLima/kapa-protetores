BEGIN;

ALTER TABLE "tb_foster_applications"
    ALTER COLUMN "availability" DROP NOT NULL,
    ADD COLUMN "available_from" DATE,
    ADD COLUMN "available_until" DATE,
    ADD CONSTRAINT "tb_foster_applications_availability_check" CHECK (
        ("available_from" IS NULL AND "available_until" IS NULL AND "availability" IS NOT NULL)
        OR
        ("available_from" IS NOT NULL AND ("available_until" IS NULL OR "available_until" >= "available_from"))
    );

CREATE INDEX "tb_foster_applications_user_id_submitted_at_id_idx"
    ON "tb_foster_applications"("user_id", "submitted_at", "id");
DROP INDEX "tb_foster_applications_user_id_key";

COMMIT;
