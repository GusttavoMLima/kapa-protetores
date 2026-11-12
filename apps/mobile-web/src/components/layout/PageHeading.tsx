import type { Icon } from 'phosphor-react-native';
import { PawPrintIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';
import { palette } from '@/theme';

interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: Icon;
}

export function PageHeading({ eyebrow = 'KAPA • CUIDADO QUE TRANSFORMA', title, description, icon: IconComponent = PawPrintIcon }: PageHeadingProps) {
  return (
    <View className="overflow-hidden rounded-2xl border border-line bg-peach p-5 md:p-8 gap-5">
      <View className="flex-row items-center justify-between gap-4">
        <Text className="flex-1 font-body-medium text-xs tracking-widest text-denim">{eyebrow}</Text>
        <View className="size-12 rounded-xl bg-white items-center justify-center">
          <IconComponent size={26} color={palette.denim} weight="duotone" />
        </View>
      </View>
      <View className="gap-3 max-w-form">
        <Text accessibilityRole="header" className="font-heading-bold text-2xl md:text-3xl text-ink">{title}</Text>
        <Text className="font-body text-base leading-6 text-ink-muted">{description}</Text>
      </View>
    </View>
  );
}
