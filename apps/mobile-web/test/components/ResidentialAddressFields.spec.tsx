import { fireEvent, render } from '@testing-library/react-native';
import { ResidentialAddressFields } from '@/components/forms/ResidentialAddressFields';

const address = { postalCode: '', street: '', number: '', neighborhood: '', city: '' };

afterEach(() => jest.restoreAllMocks());

it('allows manual entry when the address service rejects the CEP', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true, json: async () => ({ erro: true }),
  } as Response);
  const onChange = jest.fn();
  const screen = await render(<ResidentialAddressFields address={address} onChange={onChange} />);
  const postalCode = screen.getByLabelText('CEP');
  await fireEvent.changeText(postalCode, '123');
  expect(fetchMock).not.toHaveBeenCalled();
  await fireEvent.changeText(postalCode, '12345678');
  expect(await screen.findByText(/CEP não encontrado/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Rua'), 'Rua das Flores');
  await fireEvent.changeText(screen.getByLabelText('Bairro'), 'Centro');
  await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Itapira');
  expect(onChange.mock.calls.map(([fields]) => fields)).toEqual([
    { postalCode: '123' }, { postalCode: '12345-678' }, { street: 'Rua das Flores' },
    { neighborhood: 'Centro' }, { city: 'Itapira' },
  ]);
});

it('keeps the form available when the address service fails', async () => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
  const screen = await render(<ResidentialAddressFields address={address} onChange={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText('CEP'), '12345678');
  expect(await screen.findByText(/Preencha o endereço manualmente/)).toBeTruthy();
  expect(screen.getByLabelText('Rua')).toBeEnabled();
});
