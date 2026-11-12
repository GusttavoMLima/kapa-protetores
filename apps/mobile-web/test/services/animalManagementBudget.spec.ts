import { fetchShelterBudgetPrediction } from '@/services/animalManagement';
import { apiRequest } from '@/services/api';

jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }));

it('rejects malformed forecasts before the management screen can render them', async () => {
  jest.mocked(apiRequest).mockResolvedValueOnce([]);
  await expect(fetchShelterBudgetPrediction()).rejects.toThrow();
});

it('accepts a valid empty budget forecast', async () => {
  const empty = { count: 0, totalCost: 0 };
  const forecast = {
    totalPredictedBudget: 0, activeAnimalsCount: 0, averageCostPerAnimal: 0,
    bySpecies: { dog: empty, cat: empty, other: empty },
    byStatus: { rescued: empty, treating: empty, available: empty },
    animals: [],
  };
  jest.mocked(apiRequest).mockResolvedValueOnce(forecast);
  const signal = new AbortController().signal;
  await expect(fetchShelterBudgetPrediction(signal)).resolves.toEqual(forecast);
  expect(apiRequest).toHaveBeenCalledWith('/animals/management/budget-prediction', { signal });
});
