import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { Icon } from 'phosphor-react-native';
import { palette } from '@/theme';

export function RequestAction({ label, onPress, icon: IconComponent, disabled = false, busy = false, destructive = false }: {
  label: string; onPress: () => void; icon?: Icon; disabled?: boolean; busy?: boolean; destructive?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl border px-4 py-3 ${destructive ? 'border-danger/30 bg-white' : 'border-line bg-white hover:bg-peach'} ${disabled || busy ? 'opacity-50' : 'active:opacity-70'}`}>
    {busy ? <ActivityIndicator size="small" color={palette.denim} /> : IconComponent ? <IconComponent size={18} color={destructive ? palette.danger : palette.denim} /> : null}
    <Text className={`font-body-medium text-sm text-center ${destructive ? 'text-danger' : 'text-denim'}`}>{label}</Text>
  </Pressable>;
}

export function DetailSection({ title, icon: IconComponent, children }: { title: string; icon: Icon; children: ReactNode }) {
  return <View className="flex-1 min-w-0 gap-4 rounded-xl bg-cream p-5">
    <View className="flex-row items-center gap-2"><IconComponent size={20} color={palette.denim} /><Text className="font-heading-bold text-base text-denim">{title}</Text></View>
    {children}
  </View>;
}

export function DetailLine({ label, value }: { label: string; value: string }) {
  return <View className="gap-1"><Text className="font-body text-xs text-ink-muted">{label}</Text><Text className="font-body-medium text-sm leading-5 text-ink">{value}</Text></View>;
}
