import { Pressable, Text, View } from 'react-native';
import {
  createEmptyMedicationRecord,
  isMedicationRecordEmpty,
  validateMedicationRecord,
  type MedicationRecord,
} from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import { PrimaryInputText } from '@/components/inputText/primary';
import { palette } from '@/theme';

type MedicationUsageMode = 'periodo' | 'continuo';

type MedicationItemFieldProps = {
  index: number;
  medication: MedicationRecord;
  canRemove: boolean;
  showErrors?: boolean;
  disabled?: boolean;
  onChange: (next: MedicationRecord) => void;
  onRemove: VoidFunction;
};

function MedicationItemField({
  index,
  medication,
  canRemove,
  showErrors,
  disabled,
  onChange,
  onRemove,
}: MedicationItemFieldProps) {
  const title = `Medicamento ${index + 1}`;
  const fieldErrors = showErrors
    ? validateMedicationRecord(medication, false)
    : {};
  const usageMode: MedicationUsageMode = medication.continuousUse
    ? 'continuo'
    : 'periodo';

  return (
    <View className="gap-3 rounded-xl border border-line bg-cream/60 p-3.5">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-body-medium text-sm leading-4 text-ink">
          {title}
        </Text>
        {canRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remover ${title}`}
            disabled={disabled}
            onPress={onRemove}
            className="rounded-lg px-2 py-1.5 active:bg-danger-soft"
          >
            <Text className="font-body-medium text-xs leading-[14px] text-danger">
              Remover
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-col md:flex-row gap-3">
        <PrimaryInputText
          className="flex-1"
          label="Nome do medicamento"
          value={medication.name}
          onChangeText={(name) => onChange({ ...medication, name })}
          placeholder="Ex.: Amoxicilina, Apoquel"
          maxLength={120}
          editable={!disabled}
          erro={fieldErrors.name}
        />
        <PrimaryInputText
          className="flex-1"
          label="Dose"
          value={medication.dose}
          onChangeText={(dose) => onChange({ ...medication, dose })}
          placeholder="Ex.: 1 comprimido, 5 ml"
          maxLength={80}
          editable={!disabled}
          erro={fieldErrors.dose}
        />
      </View>

      <View className="flex-col md:flex-row gap-3">
        <PrimaryInputText
          className="flex-1"
          label="Frequência"
          value={medication.frequency}
          onChangeText={(frequency) => onChange({ ...medication, frequency })}
          placeholder="Ex.: A cada 12h, 1x ao dia"
          maxLength={80}
          editable={!disabled}
          erro={fieldErrors.frequency}
        />
      </View>

      <View className="gap-2">
        <Text className="font-body-medium text-sm leading-4 text-ink">
          Duração do tratamento
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={`Duração do ${title}`}
        >
          <PrimaryChipGroup<MedicationUsageMode>
            value={usageMode}
            disabled={disabled}
            onChange={(mode) =>
              onChange({
                ...medication,
                continuousUse: mode === 'continuo',
                period: mode === 'continuo' ? '' : medication.period ?? '',
              })
            }
            options={[
              { value: 'periodo', label: 'Período de uso' },
              { value: 'continuo', label: 'Uso contínuo' },
            ]}
          />
        </View>
      </View>

      {!medication.continuousUse ? (
        <PrimaryInputText
          label="Período de uso"
          value={medication.period ?? ''}
          onChangeText={(period) => onChange({ ...medication, period })}
          placeholder="Ex.: 7 dias, até 20/12/2026"
          maxLength={80}
          editable={!disabled}
          erro={fieldErrors.period}
        />
      ) : null}
    </View>
  );
}

export function MedicationFields({
  medications,
  onChange,
  showErrors,
  disabled,
  erro,
}: {
  medications: MedicationRecord[];
  onChange: (medications: MedicationRecord[]) => void;
  showErrors?: boolean;
  disabled?: boolean;
  erro?: string;
}) {
  const entries: MedicationRecord[] =
    medications.length > 0 ? medications : [createEmptyMedicationRecord()];

  return (
    <View className="gap-3">
      <View className="gap-0.5">
        <Text className="font-body-medium text-sm leading-4 text-ink">
          Medicamentos em uso
        </Text>
        <Text className="font-body text-xs text-ink-muted">
          Informe nome, dose, frequência e período (ou marque uso contínuo). Deixe em branco se o animal não estiver medicado.
        </Text>
      </View>

      {entries.map((medication, index) => {
        const canRemove =
          entries.length > 1 || !isMedicationRecordEmpty(medication);
        return (
          <MedicationItemField
            key={index}
            index={index}
            medication={medication}
            canRemove={canRemove}
            showErrors={showErrors}
            disabled={disabled}
            onChange={(nextMedication) =>
              onChange(
                entries.map((item, position) =>
                  position === index ? nextMedication : item,
                ),
              )
            }
            onRemove={() => {
              if (entries.length === 1) {
                onChange([createEmptyMedicationRecord()]);
                return;
              }
              onChange(entries.filter((_, position) => position !== index));
            }}
          />
        );
      })}

      {erro ? (
        <Text className="font-body text-xs text-danger">{erro}</Text>
      ) : null}

      <PrimaryButton
        title="Adicionar medicamento"
        size="sm"
        fullWidth={false}
        color="transparent"
        textColor={palette.denim}
        disabled={disabled || entries.length >= 20}
        onPress={() => onChange([...entries, createEmptyMedicationRecord()])}
      />
    </View>
  );
}
