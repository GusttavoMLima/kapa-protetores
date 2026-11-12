import { fetchShelterBudgetPrediction } from '@/services/animalManagement';
import { apiRequest } from '@/services/api';

jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }));

it('rejects malformed forecasts before the management screen can render them', async () => {
  jest.mocked(apiRequest).mockResolvedValueOnce([]);
  await expect(fetchShelterBudgetPrediction()).rejects.toThrow();
});

it('accepts a valid empty budget forecast', async () => {
  const emptyBreakdown = {
    nutrition: 0,
    veterinary: 0,
    preventives: 0,
    hygiene: 0,
  };
  const empty = {
    count: 0,
    totalCost: 0,
    averageCost: 0,
    breakdown: emptyBreakdown,
  };
  const forecast = {
    totalPredictedBudget: 0,
    activeAnimalsCount: 0,
    averageCostPerAnimal: 0,
    byCategory: emptyBreakdown,
    bySpecies: { dog: empty, cat: empty, other: empty },
    bySize: { small: empty, medium: empty, large: empty },
    byStatus: { rescued: empty, treating: empty, available: empty },
    animals: [],
  };
  jest.mocked(apiRequest).mockResolvedValueOnce(forecast);
  const signal = new AbortController().signal;
  await expect(fetchShelterBudgetPrediction(signal)).resolves.toEqual(forecast);
  expect(apiRequest).toHaveBeenCalledWith('/animals/management/budget-prediction', { signal });
});
