-- Script SQL de seed para testes de integração com Testcontainers
INSERT INTO "tb_users" (
  "id",
  "username",
  "email",
  "password",
  "role",
  "rules",
  "latitude",
  "longitude",
  "createdAt"
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SeedUserSQL',
  'seed.sql@example.com',
  'hash-segura-123',
  'adopter',
  ARRAY['user:read:own', 'adopter:create'],
  -23.550520,
  -46.633308,
  NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "tb_adopter_profiles" (
  "id",
  "user_id",
  "preferred_species",
  "preferred_gender",
  "preferred_size",
  "preferred_energy",
  "preferred_kid_friendly",
  "preferred_noise",
  "preferred_age_stage",
  "lives_in_apartment",
  "has_other_pets",
  "created_at",
  "updated_at"
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'dog',
  'female',
  2,
  3,
  4,
  2,
  1,
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;
