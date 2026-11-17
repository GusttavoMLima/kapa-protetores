import { Pressable, Text, View } from 'react-native';
import type { DoseRecord, DoseStatus } from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import { PrimaryInputText } from '@/components/inputText/primary';
import { palette } from '@/theme';
import { parseAnimalDate } from '@/utils/animalDate';

type DoseFieldProps = {
  label: string;
  dose: DoseRecord;
  erro?: string;
  disabled?: boolean;
  onChange: (dose: DoseRecord) => void;
  onRemove?: VoidFunction;
};

function DoseField({ label, dose, erro, disabled, onChange, onRemove }: DoseFieldProps) {
  return (
    <View className="gap-2 py-1">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-body-medium text-sm leading-4 text-ink">{label}</Text>
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remover ${label}`}
            disabled={disabled}
            onPress={onRemove}
            className="rounded-lg px-2 py-2 active:bg-danger-soft"
          >
            <Text className="font-body-medium text-xs leading-[14px] text-danger">
              Remover
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel={label}>
        <PrimaryChipGroup<DoseStatus>
          value={dose.status}
          disabled={disabled}
          onChange={(status) =>
            onChange({ status, data: status === 'sim' ? dose.data : undefined })
          }
          options={[
            { value: 'sim', label: 'Sim' },
            { value: 'nao', label: 'Não' },
          ]}
        />
      </View>
      {dose.status === 'sim' ? (
        <PrimaryInputText
          label="Data da aplicação"
          value={dose.data ?? ''}
          onChangeText={(data) => onChange({ ...dose, data })}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          editable={!disabled}
          erro={erro}
        />
      ) : null}
    </View>
  );
}

export function DoseFields({ label, addLabel, doses, onChange, showErrors, disabled }: {
  label: string;
  addLabel: string;
  doses: DoseRecord[];
  onChange: (doses: DoseRecord[]) => void;
  showErrors?: boolean;
  disabled?: boolean;
}) {
  const entries: DoseRecord[] = doses.length ? doses : [{ status: 'nao' }];

  return (
    <View className="gap-2">
      {entries.map((dose, index) => (
        <DoseField
          key={index}
          label={`${label} — ${index + 1}ª dose`}
          dose={dose}
          disabled={disabled}
          onChange={(nextDose) => onChange(entries.map((item, position) => position === index ? nextDose : item))}
          onRemove={index > 0 ? () => onChange(entries.filter((_, position) => position !== index)) : undefined}
          erro={showErrors && dose.status === 'sim' && !parseAnimalDate(dose.data?.trim() ?? '')
            ? 'Informe uma data de aplicação válida (DD/MM/AAAA).'
            : undefined}
        />
      ))}
      <PrimaryButton
        title={addLabel}
        size="sm"
        fullWidth={false}
        color="transparent"
        textColor={palette.denim}
        disabled={disabled || entries.length >= 100}
        onPress={() => onChange([...entries, { status: 'nao' }])}
      />
    </View>
  );
}
