-- Nullable for existing accounts and Google sign-in. No invented defaults.
ALTER TABLE "tb_users"
  ADD COLUMN "birth_date" DATE,
  ADD COLUMN "phone" VARCHAR(20);
