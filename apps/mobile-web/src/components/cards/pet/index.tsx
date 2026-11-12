import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { palette } from '@/theme';
import { HeartIcon, PawPrintIcon } from 'phosphor-react-native';
import {
  Image,
  ImageLoadEventData,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const HEART_POP_SCALE = 1.32;
const HEART_REST_SCALE = 1;
const IMAGE_INITIAL_OPACITY = 0.85;
const IMAGE_FADE_DURATION_MS = 220;

const HEART_SPRING_CONFIG = {
  damping: 10,
  stiffness: 220,
};

interface PetCardProps {
  name: string;
  isFavorited?: boolean;
  imgUrl: string;
  characteristics?: string[];
  onPress?: () => void;
  onToggleFavorite?: () => void;
  className?: string;
}

const orientationCache = new Map<string, 'horizontal' | 'vertical'>();

function extractDimensions(
  event: NativeSyntheticEvent<ImageLoadEventData>,
): { width: number; height: number } | null {
  const nativeEvent = event.nativeEvent as unknown as {
    source?: { width?: number; height?: number };
    target?: { naturalWidth?: number; naturalHeight?: number };
  };

  const width =
    nativeEvent?.source?.width ?? nativeEvent?.target?.naturalWidth ?? 0;
  const height =
    nativeEvent?.source?.height ?? nativeEvent?.target?.naturalHeight ?? 0;

  if (width > 0 && height > 0) {
    return { width, height };
  }
  return null;
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

const styles = StyleSheet.create({
  backdropImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  foregroundImageWrapper: {
    width: '100%',
    height: '100%',
  },
  foregroundImage: {
    width: '100%',
    height: '100%',
  },
  heartIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const [orientations, setOrientations] = useState<
      Record<string, 'horizontal' | 'vertical'>
    >({});

    const heartScale = useSharedValue(HEART_REST_SCALE);
    const imageOpacity = useSharedValue(
      imgUrl && orientationCache.has(imgUrl) ? 1 : IMAGE_INITIAL_OPACITY,
    );
    const didMountRef = useRef(false);

    useEffect(() => {
      if (!didMountRef.current) {
        didMountRef.current = true;
        return;
      }

      heartScale.value = withSequence(
        withSpring(HEART_POP_SCALE, HEART_SPRING_CONFIG),
        withSpring(HEART_REST_SCALE, HEART_SPRING_CONFIG),
      );
    }, [heartScale, isFavorited]);

    const heartAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartScale.value }],
    }));

    const imageAnimatedStyle = useAnimatedStyle(() => ({
      opacity: imageOpacity.value,
    }));

    const handleImageLoad = useCallback(
      (event: NativeSyntheticEvent<ImageLoadEventData>) => {
        imageOpacity.value = withTiming(1, {
          duration: IMAGE_FADE_DURATION_MS,
          easing: Easing.out(Easing.quad),
        });

        const dims = extractDimensions(event);
        if (dims && imgUrl) {
          const next = dims.width >= dims.height ? 'horizontal' : 'vertical';
          orientationCache.set(imgUrl, next);
          setOrientations((prev) =>
            prev[imgUrl] === next ? prev : { ...prev, [imgUrl]: next },
          );
        }
      },
      [imageOpacity, imgUrl],
    );

    const imageError = Boolean(imgUrl) && failedUrl === imgUrl;
    const showImage = Boolean(imgUrl) && !imageError;
    const orientation = imgUrl
      ? (orientations[imgUrl] ?? orientationCache.get(imgUrl) ?? 'vertical')
      : 'vertical';
    const isHorizontal = orientation === 'horizontal';

    return (
      <View
        className={`w-48 sm:w-60 bg-white rounded-2xl overflow-hidden border border-line relative ${className}`}
        style={cardShadowStyle}
      >
        <TouchableOpacity
          activeOpacity={onPress ? 0.8 : 1}
          onPress={onPress}
          disabled={!onPress}
          className="w-full active:scale-[0.98]"
        >
          <View className="w-full h-52 sm:h-60 relative bg-peach items-center justify-center overflow-hidden">
            {showImage ? (
              <>
                {!isHorizontal && (
                  <Image
                    source={{ uri: imgUrl }}
                    resizeMode="cover"
                    blurRadius={14}
                    style={styles.backdropImage}
                    accessible={false}
                    importantForAccessibility="no"
                  />
                )}
                <Animated.View
                  style={[styles.foregroundImageWrapper, imageAnimatedStyle]}
                >
                  <Image
                    source={{ uri: imgUrl }}
                    accessibilityLabel={`Foto de ${name}`}
                    resizeMode={isHorizontal ? 'cover' : 'contain'}
                    style={styles.foregroundImage}
                    onLoad={handleImageLoad}
                    onError={() => setFailedUrl(imgUrl)}
                  />
                </Animated.View>
              </>
            ) : (
              <View
                className="w-full h-full items-center justify-center gap-2 bg-peach"
              >
                <PawPrintIcon size={44} color={palette.denim} weight="duotone" />
                <Text className="font-body text-sm text-ink-muted">Sem foto</Text>
              </View>
            )}
          </View>

          <View className="p-3.5 bg-white">
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

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(event) => {
            event?.stopPropagation?.();
            onToggleFavorite?.();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorited
              ? `Remover ${name} dos favoritos`
              : `Favoritar ${name}`
          }
          className="absolute top-2.5 right-2.5 z-10 bg-peach/95 size-8 rounded-full items-center justify-center shadow-sm"
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.heartIconContainer, heartAnimatedStyle]}
          >
            <HeartIcon
              size={18}
              weight={isFavorited ? 'fill' : 'bold'}
              color={palette.orange}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  },
  (prev, next) =>
    prev.name === next.name &&
    prev.imgUrl === next.imgUrl &&
    prev.isFavorited === next.isFavorited &&
    prev.className === next.className &&
    prev.onPress === next.onPress &&
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.characteristics?.join(',') === next.characteristics?.join(','),
);

PetCard.displayName = 'PetCard';

