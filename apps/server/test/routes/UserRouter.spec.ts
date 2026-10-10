import { UserRouter } from '../../src/routes/UserRouter';
import { UserController } from '../../src/controllers/UserController';

describe('UserRouter Endpoints Coverage', () => {
  it('should define all 12 user routes with correct HTTP methods and paths', () => {
    const mockController = {
      countAll: () => {},
      getAll: () => {},
      register: () => {},
      signIn: () => {},
      userInfo: () => {},
      updateProfile: () => {},
      deleteMe: () => {},
      getProfile: () => {},
      updatePassword: () => {},
      getById: () => {},
      updateRole: () => {},
      deleteById: () => {},
    } as unknown as UserController;

    const userRouter = new UserRouter(mockController);
    const stack = userRouter.router.stack as Array<{
      route?: { path: string; methods: Record<string, boolean> };
    }>;
    const registered = stack.map((layer) => ({
      path: layer.route?.path,
      methods: layer.route?.methods,
    }));

    // Public routes
    expect(registered.some((r) => r.path === '/count' && r.methods?.get)).toBe(true);
    expect(registered.some((r) => r.path === '/create' && r.methods?.post)).toBe(true);
    expect(registered.some((r) => r.path === '/signin' && r.methods?.post)).toBe(true);

    // Admin collection route
    expect(registered.some((r) => r.path === '/all' && r.methods?.get)).toBe(true);

    // Authenticated user own routes
    expect(registered.some((r) => r.path === '/me' && r.methods?.get)).toBe(true);
    expect(registered.some((r) => r.path === '/me' && r.methods?.patch)).toBe(true);
    expect(registered.some((r) => r.path === '/me' && r.methods?.delete)).toBe(true);
    expect(registered.some((r) => r.path === '/me/profile' && r.methods?.get)).toBe(true);
    expect(registered.some((r) => r.path === '/me/password' && r.methods?.patch)).toBe(true);

    // Individual user routes
    expect(registered.some((r) => r.path === '/:id' && r.methods?.get)).toBe(true);
    expect(registered.some((r) => r.path === '/:id/role' && r.methods?.patch)).toBe(true);
    expect(registered.some((r) => r.path === '/:id/delete' || (r.path === '/:id' && r.methods?.delete))).toBe(true);
  });
});
