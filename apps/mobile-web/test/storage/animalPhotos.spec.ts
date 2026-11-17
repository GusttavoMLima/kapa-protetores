import { ApiError, apiRequest } from '@/services/api';
import { uploadAnimalPhotos } from '@/storage/animals';

jest.mock('@/services/api', () => ({
  ...jest.requireActual('@/services/api'),
  apiRequest: jest.fn(),
}));

it('keeps only rejected photos available for retry and reports the API message', async () => {
  const request = jest.mocked(apiRequest);
  request
    .mockRejectedValueOnce(new ApiError('BadRequestError', 400, 'A foto deve ter no máximo 5 MB.'))
    .mockResolvedValueOnce({});

  const result = await uploadAnimalPhotos('animal-1', ['file:///capa.jpg', 'file:///rejeitada.jpg']);

  expect(result).toEqual({
    uploaded: 1,
    failures: [{ uri: 'file:///rejeitada.jpg', message: 'A foto deve ter no máximo 5 MB.' }],
  });
  expect(request).toHaveBeenCalledTimes(2);
  expect(request).toHaveBeenCalledWith('/animals/animal-1/photos', {
    method: 'POST',
    body: expect.any(FormData),
  });
});
