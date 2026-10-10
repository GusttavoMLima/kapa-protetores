import { memo } from 'react';
import { palette } from '@/theme';
import { HeartIcon } from 'phosphor-react-native';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';

interface PetCardProps {
  name: string;
  isFavorited?: boolean;
  imgUrl: string;
  characteristics?: string[];
  onPress?: () => void;
  onToggleFavorite?: () => void;
  className?: string;
}

const cardShadowStyle = Platform.select({
  web: { boxShadow: '0px 3px 8px rgba(18, 18, 18, 0.15)' } as const,
  android: { elevation: 3 },
  default: {
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});

export const PetCard = memo(
  ({
    name,
    characteristics = [],
    imgUrl,
    isFavorited = false,
    onPress,
    onToggleFavorite,
    className = '',
  }: PetCardProps) => {
    return (
      <TouchableOpacity
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
        className={`w-48 sm:w-60 bg-white rounded-xl overflow-hidden border border-line ${className} active:scale-[0.98]`}
        style={cardShadowStyle}
      >
        <View className="w-full h-40 relative bg-peach">
          <Image
            source={{ uri: imgUrl }}
            accessibilityLabel={`Foto de ${name}`}
            resizeMode="cover"
            className="w-full h-full"
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleFavorite}
            className="absolute top-2.5 right-2.5 bg-peach size-8 rounded-full items-center justify-center shadow-sm"
          >
            <HeartIcon
              size={18}
              weight={isFavorited ? 'fill' : 'bold'}
              color={palette.orange}
            />
          </TouchableOpacity>
        </View>

        <View className="p-3">
          <Text
            numberOfLines={1}
            className="font-heading-bold text-base sm:text-lg text-ink"
          >
            {name}
          </Text>

          {characteristics.length > 0 && (
            <Text
              numberOfLines={1}
              className="font-body text-xs sm:text-sm text-ink-muted mt-0.5"
            >
              {characteristics.join(' • ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.name === next.name &&
    prev.imgUrl === next.imgUrl &&
    prev.isFavorited === next.isFavorited &&
    prev.className === next.className &&
    prev.characteristics?.join(',') === next.characteristics?.join(','),
);

PetCard.displayName = 'PetCard';

