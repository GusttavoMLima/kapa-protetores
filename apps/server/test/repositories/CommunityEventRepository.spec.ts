import { Prisma, type PrismaClient } from '@prisma/client';
import { CommunityEventRepository } from '../../src/repositories/CommunityEventRepository';

describe('CommunityEventRepository.signUp', () => {
  const start = new Date('2099-05-10T12:00:00Z');
  const end = new Date('2099-05-10T16:00:00Z');

  it.each([end, null])('checks the volunteer schedule before inserting (end: %s)', async (endAt) => {
    const transaction = {
      communityEvents: {
        findUnique: jest.fn().mockResolvedValue({ start_at: start, end_at: endAt, vacancies: 10 }),
      },
      communityEventVolunteers: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({ community_event_id: 'existing-event' }),
        create: jest.fn(),
      },
    };
    const runTransaction = jest.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction));
    const repository = new CommunityEventRepository({ $transaction: runTransaction } as unknown as PrismaClient);

    await expect(repository.signUp('volunteer', 'new-event')).rejects.toThrow('COMMUNITY_EVENT_SCHEDULE_CONFLICT');
    expect(runTransaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(transaction.communityEventVolunteers.findFirst).toHaveBeenCalledWith({
      where: {
        volunteer_id: 'volunteer',
        community_event: {
          start_at: endAt ? { lt: endAt } : { lte: start },
          OR: [{ end_at: { gt: start } }, { end_at: null, start_at: { gte: start } }],
        },
      },
      select: { community_event_id: true },
    });
    expect(transaction.communityEventVolunteers.create).not.toHaveBeenCalled();
  });
});
