import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { AnimalMedication } from '@/screens/animalCare/AnimalMedication';
import { apiRequest } from '@/services/api';

jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'volunteer-1', role: 'volunteer' } }),
}));

const request = jest.mocked(apiRequest);
const animal = {
  id: 'c000000000000000000000001',
  name: 'Amora',
  status: 'treating',
};

describe('AnimalMedication', () => {
  beforeEach(() => request.mockReset());

  function renderMedication() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    return render(
      <QueryClientProvider client={client}>
        <AnimalMedication animalId={animal.id} />
      </QueryClientProvider>,
    );
  }

  it.each([
    ['Orientação veterinária registrada', 'Orientação veterinária registrada'],
    [null, 'Medicação não informada'],
  ])('shows medication notes (%s) in the care section', async (medicationNotes, expected) => {
    request.mockResolvedValue({ ...animal, medicationNotes });
    const screen = await renderMedication();
    expect(await screen.findByText(expected)).toBeTruthy();
    expect(screen.getByText('Medicação em uso')).toBeTruthy();
    expect(request).toHaveBeenCalledWith(`/animals/care/${animal.id}`);
  });

  it('shows a load error separately from absent medication notes', async () => {
    request.mockRejectedValue(new Error('Forbidden'));
    const screen = await renderMedication();
    expect(await screen.findByText('Não foi possível consultar a medicação.')).toBeTruthy();
    expect(screen.queryByText('Medicação não informada')).toBeNull();
  });
});
