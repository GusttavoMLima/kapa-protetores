import { apiRequest } from '@/services/api';
import {
  editFosterApplication, fetchFosterApplications, fetchMyFosterApplication, reviewFosterApplication, submitFosterApplication,
} from '@/services/fosterApplications';

jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }));

const request = jest.mocked(apiRequest);
const input = {
  availableFrom: '2026-11-11', availableUntil: null, homeNotes: 'Quarto separado', homeAddress: 'Rua Teste, 10',
  hasOtherAnimals: false, hasPerimeterBarrier: true, hasSecureGate: true,
};
const saved = {
  ...input, availability: null, id: 'c000000000000000000000001', status: 'pending',
  submittedAt: '2026-11-11T12:00:00.000Z', updatedAt: '2026-11-11T12:00:00.000Z',
};

it('distinguishes no application from invalid server data', async () => {
  request.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...saved, hasSecureGate: 'yes' });
  await expect(fetchMyFosterApplication()).resolves.toBeNull();
  await expect(fetchMyFosterApplication()).rejects.toThrow();
  expect(request).toHaveBeenCalledWith('/foster-applications/mine');
});

it('submits the form and parses the saved application', async () => {
  const applicantView = { ...saved, canEdit: true, canSubmitNew: false };
  request.mockResolvedValueOnce(applicantView).mockResolvedValueOnce(applicantView);
  await expect(submitFosterApplication(input)).resolves.toEqual(applicantView);
  expect(request).toHaveBeenCalledWith('/foster-applications', { method: 'POST', body: JSON.stringify(input) });
  await expect(editFosterApplication(saved.id, input)).resolves.toEqual(applicantView);
  expect(request).toHaveBeenCalledWith(`/foster-applications/${saved.id}`, { method: 'PATCH', body: JSON.stringify(input) });
});

it('reads the staff page and sends a review decision to the selected application', async () => {
  const page = { items: [{ ...saved, applicant: { username: 'Maria', email: 'maria@example.com' } }], total: 21, pageSize: 20 };
  request.mockResolvedValueOnce(page).mockResolvedValueOnce({ status: 'approved' });
  await expect(fetchFosterApplications(2)).resolves.toEqual(page);
  await reviewFosterApplication(saved.id, 'approved');
  expect(request).toHaveBeenCalledWith('/foster-applications?page=2');
  expect(request).toHaveBeenCalledWith(`/foster-applications/${saved.id}/status`, {
    method: 'PATCH', body: JSON.stringify({ status: 'approved' }),
  });
});
