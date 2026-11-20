import { View } from 'react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import { palette } from '@/theme';

export function FormActions({ title, pending, onSubmit, onCancel }: {
  title: string;
  pending: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  if (!onCancel) return <PrimaryButton title={title} loading={pending} onPress={onSubmit} />;

  return (
    <View className="gap-3 sm:flex-row">
      <View className="sm:flex-1">
        <PrimaryButton title={title} loading={pending} onPress={onSubmit}
          style={{ borderColor: 'transparent', borderWidth: 1.5 }} />
      </View>
      <View className="sm:flex-1">
        <PrimaryButton title="Cancelar" color={palette.white} pressedColor={palette.peach} textColor={palette.denim}
          style={{ borderColor: palette.denim, borderWidth: 1.5 }} disabled={pending} onPress={onCancel} />
      </View>
    </View>
  );
}
