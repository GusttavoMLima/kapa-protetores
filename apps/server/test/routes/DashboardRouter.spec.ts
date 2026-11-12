import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { DashboardController } from '../../src/controllers/DashboardController';
import { ForbiddenError, UnauthorizedError } from '../../src/errors';
import { ErrorHandler } from '../../src/middlewares/ErrorHandler';
import type { AuthMiddleware } from '../../src/middlewares/AuthMiddleware';
import { DashboardRouter } from '../../src/routes/DashboardRouter';
import type { DashboardService } from '../../src/services/DashboardService';

describe('DashboardRouter', () => {
  const sampleSummary = {
    generatedAt: '2026-11-11T12:00:00.000Z',
    animals: {
      total: 2,
      activeInShelter: 2,
      byStatus: { rescued: 1, treating: 0, available: 1, adopted: 0 },
      bySpecies: { dog: 1, cat: 1, other: 0 },
      activeByCondition: { healthy: 2, injured: 0, debilitated: 0 },
      activeVaccinatedCount: 2,
      activeCastratedCount: 2,
      totalFavoritesCount: 5,
    },
    adoptions: {
      total: 1,
      byStatus: {
        pending: 1,
        interviewing: 0,
        approved: 0,
        rejected: 0,
        canceled: 0,
      },
      approvalRatePercent: 0,
    },
    volunteers: {
      pendingApplicationsCount: 1,
      approvedApplicationsCount: 2,
      rejectedApplicationsCount: 0,
      upcomingEventsCount: 1,
      upcomingVolunteerSignupsCount: 3,
      upcomingTotalVacancies: 5,
    },
    users: {
      totalActive: 4,
      deactivatedCount: 0,
      byRole: { adopter: 2, volunteer: 1, protector: 0, admin: 1 },
    },
    budgetPrediction: {
      totalPredictedBudget: 615.26,
      activeAnimalsCount: 2,
      averageCostPerAnimal: 307.63,
      byCategory: {
        nutrition: 442.99,
        veterinary: 0,
        preventives: 0,
        hygiene: 172.27,
      },
      bySpecies: {},
      bySize: {},
      byStatus: {},
      animals: [],
    },
    recentEvents: [],
  };

  async function withTestServer(
    role: 'unauthenticated' | 'adopter' | 'admin',
    run: (baseUrl: string, getSummary: jest.Mock) => Promise<void>,
  ): Promise<void> {
    const getSummary = jest.fn().mockResolvedValue(sampleSummary);
    const dashboardService = { getSummary } as unknown as DashboardService;
    const controller = new DashboardController(dashboardService);

    const authMiddleware = {
      authenticate: (req: Request, _res: Response, next: NextFunction) => {
        if (role === 'unauthenticated') {
          next(new UnauthorizedError('Authentication token is required.'));
          return;
        }
        req.user = {
          sub: 'user-1',
          role,
          email: 'staff@example.com',
          username: 'Staff',
          rules: [],
        };
        next();
      },
    } as unknown as AuthMiddleware;

    const managementAccess = (
      _req: Request,
      _res: Response,
      next: NextFunction,
    ) => {
      if (role !== 'admin') {
        next(new ForbiddenError('Insufficient permissions.'));
        return;
      }
      next();
    };

    const router = new DashboardRouter(
      controller,
      authMiddleware,
      managementAccess,
    );
    const app = express();
    app.use('/api/dashboard', router.router);
    app.use(ErrorHandler.handle);

    const server: Server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const { port } = server.address() as AddressInfo;

    try {
      await run(`http://127.0.0.1:${port}`, getSummary);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  it('rejects unauthenticated requests with 401', async () => {
    await withTestServer('unauthenticated', async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/dashboard/summary`);
      expect(res.status).toBe(401);
    });
  });

  it('rejects non-staff roles with 403', async () => {
    await withTestServer('adopter', async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/dashboard/summary`);
      expect(res.status).toBe(403);
    });
  });

  it('returns 200 with shelter dashboard summary for staff roles', async () => {
    await withTestServer('admin', async (baseUrl, getSummary) => {
      const res = await fetch(`${baseUrl}/api/dashboard/summary`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        data: { budgetPrediction: { totalPredictedBudget: number } };
      };
      expect(body.data.budgetPrediction.totalPredictedBudget).toBe(615.26);
      expect(getSummary).toHaveBeenCalledTimes(1);
    });
  });
});
