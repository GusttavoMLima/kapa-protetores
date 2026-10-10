import { AdopterProfileRouter } from '../../src/routes/AdopterProfileRouter';
import { AdopterProfileController } from '../../src/controllers/AdopterProfileController';

describe('AdopterProfileRouter', () => {
  it('should register all expected routes with correct paths and methods', () => {
    const mockController = {
      countAll: () => {},
      getAll: () => {},
      getMe: () => {},
      upsertMe: () => {},
      updateMe: () => {},
      deleteMe: () => {},
      getByPreferences: () => {},
      getByPreference: () => {},
      create: () => {},
      getByUserId: () => {},
      updateByUserId: () => {},
      upsert: () => {},
      deleteByUserId: () => {},
      getById: () => {},
      update: () => {},
      delete: () => {},
    } as unknown as AdopterProfileController;

    const adopterProfileRouter = new AdopterProfileRouter(mockController);

    const stack = adopterProfileRouter.router.stack as Array<{
      route?: { path: string; methods: Record<string, boolean> };
    }>;

    const registeredRoutes = stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route!.path,
        methods: Object.keys(layer.route!.methods),
      }));

    const paths = registeredRoutes.map((r) => r.path);

    expect(paths).toContain('/count');
    expect(paths).toContain('/all');
    expect(paths).toContain('/me');
    expect(paths).toContain('/preferences/search');
    expect(paths).toContain('/preference');
    expect(paths).toContain('/');
    expect(paths).toContain('/user/:id');
    expect(paths).toContain('/:id');

    // Verify /me supports GET, PUT, PATCH, DELETE
    const meRoutes = registeredRoutes.filter((r) => r.path === '/me');
    const meMethods = meRoutes.flatMap((r) => r.methods);
    expect(meMethods).toContain('get');
    expect(meMethods).toContain('put');
    expect(meMethods).toContain('patch');
    expect(meMethods).toContain('delete');
  });
});
