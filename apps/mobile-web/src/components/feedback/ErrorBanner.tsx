import { Text, View } from 'react-native';

interface ErrorBannerProps {
  message?: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View className="w-full p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30">
      <Text className="text-xs font-semibold text-[#93000A] text-center">
        {message}
      </Text>
    </View>
  );
}
