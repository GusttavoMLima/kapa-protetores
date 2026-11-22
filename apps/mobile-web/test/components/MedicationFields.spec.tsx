import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  createEmptyMedicationRecord,
  type MedicationRecord,
} from '@kapa/shared';
import { MedicationFields } from '@/components/forms/animal/MedicationFields';

function MedicationFormHarness({ showErrors = true }: { showErrors?: boolean }) {
  const [medications, setMedications] = useState<MedicationRecord[]>([
    createEmptyMedicationRecord(),
  ]);
  return (
    <MedicationFields
      medications={medications}
      onChange={setMedications}
      showErrors={showErrors}
    />
  );
}

describe('MedicationFields', () => {
  it('allows adding multiple medications, toggling continuous use, and removing items', async () => {
    await render(<MedicationFormHarness />);

    expect(screen.getByText('Medicamento 1')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByPlaceholderText('Ex.: Amoxicilina, Apoquel'),
      'Apoquel',
    );
    expect(screen.getByText('Informe a dose.')).toBeTruthy();
    expect(screen.getByText('Informe a frequência.')).toBeTruthy();
    expect(
      screen.getByText('Informe o período de uso ou marque uso contínuo.'),
    ).toBeTruthy();

    await fireEvent.changeText(
      screen.getByPlaceholderText('Ex.: 1 comprimido, 5 ml'),
      '16 mg',
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText('Ex.: A cada 12h, 1x ao dia'),
      '1x ao dia',
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Uso contínuo' }));
    expect(
      screen.queryByPlaceholderText('Ex.: 7 dias, até 20/12/2026'),
    ).toBeNull();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Adicionar medicamento' }),
    );
    expect(screen.getByText('Medicamento 2')).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Remover Medicamento 2' }),
    );
    expect(screen.queryByText('Medicamento 2')).toBeNull();
    expect(screen.getByDisplayValue('Apoquel')).toBeTruthy();
  });
});
