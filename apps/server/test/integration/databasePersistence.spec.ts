/// <reference types="jest" />
import path from 'node:path';
import { setupTestDatabase, executeSqlFile, TestDatabaseContext } from '../helpers/postgresContainer';
import { UserRepository } from '../../src/repositories/UserRepository';
import { AdopterProfileRepository } from '../../src/repositories/AdopterProfileRepository';
import { User } from '../../src/models/User';
import { AdopterProfile } from '../../src/models/AdopterProfile';
import { UUID } from '../../src/domains/UUID';

// Aumenta o timeout do Jest para permitir a inicialização do contêiner e migrações
jest.setTimeout(60000);

describe('Database Persistence - Testcontainers (PostgreSQL) + Prisma + Scripts SQL', () => {
  let ctx: TestDatabaseContext;
  let userRepo: UserRepository;
  let profileRepo: AdopterProfileRepository;

  beforeAll(async () => {
    // 1. Inicializa PostgreSQL no Testcontainers e executa as migrações Prisma
    ctx = await setupTestDatabase();
    userRepo = new UserRepository(ctx.prisma);
    profileRepo = new AdopterProfileRepository(ctx.prisma);
  });

  afterAll(async () => {
    // Limpeza de recursos e desligamento do contêiner
    if (ctx) {
      await ctx.cleanup();
    }
  });

  describe('1. Schema & Execução de Scripts SQL no PostgreSQL', () => {
    it('deve ter aplicado todas as migrações e criado as tabelas públicas', async () => {
      const tables = await ctx.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;

      const tableNames = tables.map((t: { table_name: string }) => t.table_name);
      expect(tableNames).toContain('tb_users');
      expect(tableNames).toContain('tb_adopter_profiles');
      expect(tableNames).toContain('tb_animals');
      expect(tableNames).toContain('tb_events');
      expect(tableNames).toContain('tb_favorites');
    });

    it('deve executar script SQL externo (seed_test_data.sql) e persistir registros', async () => {
      const seedSqlPath = path.resolve(__dirname, '../fixtures/seed_test_data.sql');
      await executeSqlFile(ctx.prisma, seedSqlPath);

      // Validação via consulta SQL pura no contêiner
      const seededUsers = await ctx.prisma.$queryRaw<Array<{ id: string; email: string }>>`
        SELECT id, email FROM "tb_users" WHERE id = '00000000-0000-0000-0000-000000000001'
      `;
      expect(seededUsers.length).toBe(1);
      expect(seededUsers[0].email).toBe('seed.sql@example.com');

      // Validação via repositório de perfil de adotante
      const seededProfile = await profileRepo.findByUserId(
        UUID.create('00000000-0000-0000-0000-000000000001'),
      );
      expect(seededProfile).not.toBeNull();
      expect(seededProfile?.getPreferredSpecies()).toBe('dog');
      expect(seededProfile?.getLivesInApartment()).toBe(true);
    });

    it('deve verificar a existência de índices criados pelas migrações via pg_indexes', async () => {
      const indexes = await ctx.prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
      `;
      const indexNames = indexes.map((i: { indexname: string }) => i.indexname);

      expect(indexNames).toContain('tb_adopter_profiles_user_id_key');
      expect(indexNames).toContain('tb_events_animalId_idx');
      expect(indexNames).toContain('tb_events_userId_type_idx');
    });
  });

  describe('2. UserRepository - Persistência Real no PostgreSQL', () => {
    const testUserId = '11111111-1111-1111-1111-111111111111';

    it('deve criar e persistir um novo usuário com regras e coordenadas', async () => {
      const user = new User();
      user.setId(testUserId);
      user.setUsername('PostgresUser');
      user.setEmail('postgres.user@example.com');
      user.setPassword('hashed-pass-123');
      user.setRole('protector');
      user.setRules(['protector:read', 'protector:create', 'user:read:own']);
      user.setLatitude(-23.55052);
      user.setLongitude(-46.633308);

      const created = await userRepo.create(user);
      expect(created.getId().getValue()).toBe(testUserId);
      expect(created.getUsername()).toBe('PostgresUser');

      const found = await userRepo.findById(UUID.create(testUserId));
      expect(found).not.toBeNull();
      expect(found?.getEmail().toString()).toBe('postgres.user@example.com');
      expect(found?.getRole()).toBe('protector');
      expect(found?.getLatitude()).toBeCloseTo(-23.55052);
      expect(found?.getLongitude()).toBeCloseTo(-46.633308);
      expect([...found!.getRules()]).toContain('protector:create');
    });

    it('deve filtrar usuários por papel e por regras no banco de dados', async () => {
      const protectors = await userRepo.findAllByRole('protector');
      expect(protectors.some((u) => u.getId().getValue() === testUserId)).toBe(true);

      const hasRules = await userRepo.findAllByHasRules(['protector:create']);
      expect(hasRules.some((u) => u.getId().getValue() === testUserId)).toBe(true);
    });

    it('deve atualizar campos do usuário no PostgreSQL', async () => {
      const user = (await userRepo.findById(UUID.create(testUserId)))!;
      user.setUsername('UpdatedPostgresName');
      user.setAvatar('https://example.com/postgres-avatar.png');

      await userRepo.update(user);

      const updated = await userRepo.findById(UUID.create(testUserId));
      expect(updated?.getUsername()).toBe('UpdatedPostgresName');
      expect(updated?.getAvatar()?.toString()).toBe('https://example.com/postgres-avatar.png');
    });
  });

  describe('3. AdopterProfileRepository - Persistência Real & Filtros de Preferências', () => {
    const profileUserId = '22222222-2222-2222-2222-222222222222';
    const profileId = '33333333-3333-3333-3333-333333333333';

    beforeAll(async () => {
      // Cria o usuário pai para satisfazer a chave estrangeira
      const user = new User();
      user.setId(profileUserId);
      user.setUsername('AdopterCatLover');
      user.setEmail('adopter.cat@example.com');
      user.setRole('adopter');
      await userRepo.create(user);
    });

    it('deve criar um perfil de adotante vinculado à chave estrangeira tb_users(id)', async () => {
      const profile = new AdopterProfile();
      profile.setId(profileId);
      profile.setUserId(profileUserId);
      profile.setPreferredSpecies('cat');
      profile.setPreferredGender('female');
      profile.setPreferredSize(1);
      profile.setPreferredEnergy(2);
      profile.setPreferredKidFriendly(5);
      profile.setPreferredNoise(1);
      profile.setPreferredAgeStage(1);
      profile.setLivesInApartment(true);
      profile.setHasOtherPets(false);

      const created = await profileRepo.create(profile);
      expect(created.getId().getValue()).toBe(profileId);
      expect(created.getPreferredSpecies()).toBe('cat');
      expect(created.getLivesInApartment()).toBe(true);

      const found = await profileRepo.findByUserId(UUID.create(profileUserId));
      expect(found).not.toBeNull();
      expect(found?.getId().getValue()).toBe(profileId);
      expect(found?.getPreferredKidFriendly()).toBe(5);
    });

    it('deve realizar busca composta por preferências com findByPreferences no PostgreSQL', async () => {
      const matchingProfiles = await profileRepo.findByPreferences({
        preferredSpecies: 'cat',
        livesInApartment: true,
      });

      expect(matchingProfiles.length).toBeGreaterThanOrEqual(1);
      expect(matchingProfiles.some((p) => p.getUserId().getValue() === profileUserId)).toBe(true);

      const notMatching = await profileRepo.findByPreferences({
        preferredSpecies: 'dog',
        livesInApartment: true,
      });
      expect(notMatching.some((p) => p.getUserId().getValue() === profileUserId)).toBe(false);
    });

    it('deve atualizar as preferências do perfil no banco de dados', async () => {
      const profile = (await profileRepo.findById(UUID.create(profileId)))!;
      profile.setPreferredEnergy(5);
      profile.setHasOtherPets(true);

      await profileRepo.update(profile);

      const updated = await profileRepo.findById(UUID.create(profileId));
      expect(updated?.getPreferredEnergy()).toBe(5);
      expect(updated?.getHasOtherPets()).toBe(true);
    });
  });

  describe('4. Integridade e Restrições de Chaves no PostgreSQL', () => {
    const cascadeUserId = '44444444-4444-4444-4444-444444444444';
    const cascadeProfileId = '55555555-5555-5555-5555-555555555555';

    beforeAll(async () => {
      const user = new User();
      user.setId(cascadeUserId);
      user.setUsername('CascadeUser');
      user.setEmail('cascade@example.com');
      user.setRole('adopter');
      await userRepo.create(user);

      const profile = new AdopterProfile();
      profile.setId(cascadeProfileId);
      profile.setUserId(cascadeUserId);
      profile.setPreferredSpecies('dog');
      await profileRepo.create(profile);
    });

    it('deve rejeitar duplicidade de perfil para o mesmo usuário (Unique Constraint P2002)', async () => {
      const duplicateProfile = new AdopterProfile();
      duplicateProfile.setId(UUID.generate().getValue());
      duplicateProfile.setUserId(cascadeUserId);
      duplicateProfile.setPreferredSpecies('cat');

      await expect(profileRepo.create(duplicateProfile)).rejects.toMatchObject({
        code: 'P2002',
      });
    });

    it('deve propagar deleção em cascata (ON DELETE CASCADE) ao remover usuário pai', async () => {
      // Confirma que o perfil existe antes da deleção do usuário
      const beforeDelete = await profileRepo.findByUserId(UUID.create(cascadeUserId));
      expect(beforeDelete).not.toBeNull();

      // Remove o usuário no PostgreSQL
      await userRepo.deleteById(UUID.create(cascadeUserId));

      // O PostgreSQL deve ter removido em cascata o perfil vinculado
      const afterDelete = await profileRepo.findByUserId(UUID.create(cascadeUserId));
      expect(afterDelete).toBeNull();
    });
  });
});
