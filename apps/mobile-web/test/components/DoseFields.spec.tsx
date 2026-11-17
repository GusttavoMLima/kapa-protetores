import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { DoseRecord } from '@kapa/shared';
import { DoseFields } from '@/components/forms/animal/DoseFields';

function History() {
  const [doses, setDoses] = useState<DoseRecord[]>([{ status: 'sim', data: '10/10/2026' }]);
  return <DoseFields label="Vacina V10" addLabel="Adicionar dose da V10" doses={doses} onChange={setDoses} showErrors />;
}

it('shows the saved dose and lets the user add a dated dose and remove it', async () => {
  await render(<History />);
  expect(screen.getByDisplayValue('10/10/2026')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Adicionar dose da V10' }));
  expect(screen.getByText('Vacina V10 — 2ª dose')).toBeTruthy();
  await fireEvent.press(screen.getAllByRole('radio', { name: 'Sim' })[1]);
  expect(screen.getByText('Informe uma data de aplicação válida (DD/MM/AAAA).')).toBeTruthy();

  await fireEvent.changeText(screen.getAllByLabelText('Data da aplicação')[1], '12/10/2026');
  expect(screen.getByDisplayValue('12/10/2026')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Remover Vacina V10 — 2ª dose' }));
  expect(screen.queryByDisplayValue('12/10/2026')).toBeNull();
  expect(screen.getByDisplayValue('10/10/2026')).toBeTruthy();
});
