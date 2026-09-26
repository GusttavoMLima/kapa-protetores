import { Text, View } from 'react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import GoogleSvg from '@/../assets/google.svg';

interface GoogleAuthButtonProps {
  dividerText?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function GoogleAuthButton({
  dividerText = 'ou continue com',
  onPress,
  disabled = false,
}: GoogleAuthButtonProps) {
  return (
    <>
      <View className="flex-row items-center w-full px-5 my-5">
        <View className="flex-1 h-[1px] bg-border my-3" />
        <Text className="text-sm font-semibold text-ink-muted mx-4">
          {dividerText}
        </Text>
        <View className="flex-1 h-[1px] bg-border my-3" />
      </View>

      <PrimaryButton
        title="Google"
        color="#ffffff"
        pressedColor="#f7f7f7"
        textColor="#1C1C19"
        className="border-2 border-border"
        icon={<GoogleSvg width={24} height={24} />}
        onPress={onPress}
        disabled={disabled}
      />
    </>
  );
}
