import type { ElementType } from 'react';
import { palette } from '@/theme';
import { CaretRightIcon } from 'phosphor-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

interface PrimaryMenuItemProps {
  label: string;
  icon: ElementType;
  iconColor?: string;
  iconBgColor?: string;
  onPress?: () => void;
  isDestructive?: boolean;
}

export const PrimaryMenuItem = ({
  label,
  icon: Icon,
  onPress,
  isDestructive = false,
  iconColor,
  iconBgColor,
}: PrimaryMenuItemProps) => {
  const safeIconColor = isDestructive
    ? palette.danger
    : (iconColor ?? palette.ink);
  const safeIconBg = isDestructive
    ? palette.dangerSoft
    : (iconBgColor ?? palette.peach);
  const textColor = isDestructive ? 'text-danger' : 'text-ink';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="w-full flex-row items-center justify-between p-3.5 rounded-xl bg-white active:bg-zinc-100 mb-2"
      style={{
        shadowColor: '#121212',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          style={{ backgroundColor: safeIconBg }}
          className="items-center justify-center size-10 md:size-12 rounded-full"
        >
          <Icon size={20} color={safeIconColor} weight="bold" />
        </View>
        <Text className={`font-body-medium text-base ${textColor}`}>
          {label}
        </Text>
      </View>

      {!isDestructive && (
        <CaretRightIcon size={18} color={palette.inkMuted} weight="bold" />
      )}
    </TouchableOpacity>
  );
};
