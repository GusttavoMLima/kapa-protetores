import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

interface TextButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

/** Botão secundário padrão (DESIGN.md): contorno denim de 1,5px, texto denim e alvo de toque de 48px. */
export function TextButton({ label, onPress, disabled = false, icon }: TextButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-12 px-4 py-3 rounded-md flex-row gap-2 items-center justify-center border-[1.5px] border-denim ${disabled ? 'opacity-40' : 'hover:bg-peach active:bg-peach'}`}
    >
      {icon}
      <Text className="font-body-medium text-sm text-denim">{label}</Text>
    </Pressable>
  );
}
