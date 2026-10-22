import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageLoadEventData,
  LayoutChangeEvent,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { colors } from '@/theme/colors';

export interface CarouselPhoto {
  id: string;
  photoUrl: string;
}

export interface PhotoCarouselProps {
  photos: CarouselPhoto[];
  height?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  dots?: boolean;
}

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 50,
};

const slideOrientationCache = new Map<string, 'horizontal' | 'vertical'>();

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

const styles = StyleSheet.create({
  backdropImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
});

function CarouselSlide({
  photoUrl,
  width,
  height,
}: {
  photoUrl: string;
  width: number;
  height: number;
}) {
  const [orientations, setOrientations] = useState<
    Record<string, 'horizontal' | 'vertical'>
  >({});

  const handleImageLoad = useCallback(
    (event: NativeSyntheticEvent<ImageLoadEventData>) => {
      const dims = extractDimensions(event);
      if (dims && photoUrl) {
        const next = dims.width > dims.height ? 'horizontal' : 'vertical';
        slideOrientationCache.set(photoUrl, next);
        setOrientations((prev) =>
          prev[photoUrl] === next ? prev : { ...prev, [photoUrl]: next },
        );
      }
    },
    [photoUrl],
  );

  const orientation = photoUrl
    ? (orientations[photoUrl] ??
      slideOrientationCache.get(photoUrl) ??
      'vertical')
    : 'vertical';
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      style={{ width, height }}
      className="relative items-center justify-center overflow-hidden bg-peach"
    >
      {!isHorizontal && (
        <Image
          source={{ uri: photoUrl }}
          style={[styles.backdropImage, { width, height }]}
          resizeMode="cover"
          blurRadius={18}
          accessible={false}
          importantForAccessibility="no"
        />
      )}
      <Image
        source={{ uri: photoUrl }}
        style={{
          width,
          height,
        }}
        resizeMode={isHorizontal ? 'cover' : 'contain'}
        onLoad={handleImageLoad}
        accessibilityLabel="Foto do animal"
      />
    </View>
  );
}

export function PhotoCarousel({
  photos,
  height = 360,
  autoPlay = false,
  autoPlayInterval = 4000,
  dots = false,
}: PhotoCarouselProps) {
  const { width: windowWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList<CarouselPhoto>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const programmaticScrollTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideWidth =
    containerWidth > 0 ? containerWidth : Math.max(windowWidth - 40, 1);
  const safeActiveIndex =
    photos.length > 0 ? Math.min(activeIndex, photos.length - 1) : 0;

  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth((prev) => (prev !== width ? width : prev));
    }
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= photos.length || slideWidth <= 0) return;

      isProgrammaticScrollRef.current = true;
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
      programmaticScrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 400);

      setActiveIndex(index);
      flatListRef.current?.scrollToOffset({
        offset: index * slideWidth,
        animated: true,
      });
    },
    [photos.length, slideWidth],
  );

  useEffect(() => {
    if (autoPlay && !isDragging && photos.length > 1 && slideWidth > 0) {
      intervalRef.current = setInterval(() => {
        const nextIndex = (safeActiveIndex + 1) % photos.length;
        scrollToIndex(nextIndex);
      }, autoPlayInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    autoPlay,
    isDragging,
    safeActiveIndex,
    photos.length,
    slideWidth,
    autoPlayInterval,
    scrollToIndex,
  ]);

  const updateIndexFromOffset = useCallback(
    (offsetX: number) => {
      if (slideWidth <= 0) return;
      const nextIndex = Math.round(offsetX / slideWidth);
      if (nextIndex >= 0 && nextIndex < photos.length) {
        setActiveIndex((prev) => (prev !== nextIndex ? nextIndex : prev));
      }
    },
    [photos.length, slideWidth],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScrollRef.current) return;
      updateIndexFromOffset(event.nativeEvent.contentOffset.x);
    },
    [updateIndexFromOffset],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isProgrammaticScrollRef.current = false;
      setIsDragging(false);
      updateIndexFromOffset(event.nativeEvent.contentOffset.x);
    },
    [updateIndexFromOffset],
  );

  const handleScrollBeginDrag = useCallback(() => {
    isProgrammaticScrollRef.current = false;
    setIsDragging(true);
  }, []);

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIsDragging(false);
      const targetOffsetX =
        event.nativeEvent.targetContentOffset?.x ??
        event.nativeEvent.contentOffset.x;
      updateIndexFromOffset(targetOffsetX);
    },
    [updateIndexFromOffset],
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<CarouselPhoto>[] }) => {
      if (isProgrammaticScrollRef.current) return;
      const firstVisible = viewableItems[0];
      if (firstVisible && typeof firstVisible.index === 'number') {
        setActiveIndex(firstVisible.index);
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CarouselPhoto>) => (
      <CarouselSlide
        photoUrl={item.photoUrl}
        width={slideWidth}
        height={height}
      />
    ),
    [slideWidth, height],
  );

  if (photos.length === 0) {
    return null;
  }

  return (
    <View
      onLayout={handleLayout}
      className="relative w-full overflow-hidden bg-peach"
      style={{ height }}
    >
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item: CarouselPhoto) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onViewableItemsChanged={handleViewableItemsChanged}
        getItemLayout={(
          _: ArrayLike<CarouselPhoto> | null | undefined,
          index: number,
        ) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        renderItem={renderItem}
      />

      {photos.length > 1 && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Foto anterior"
            disabled={safeActiveIndex === 0}
            onPress={() => scrollToIndex(safeActiveIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm"
            style={{ opacity: safeActiveIndex === 0 ? 0.4 : 1 }}
          >
            <CaretLeftIcon size={20} color={colors.secondary} weight="bold" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próxima foto"
            disabled={safeActiveIndex === photos.length - 1}
            onPress={() => scrollToIndex(safeActiveIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm"
            style={{ opacity: safeActiveIndex === photos.length - 1 ? 0.4 : 1 }}
          >
            <CaretRightIcon size={20} color={colors.secondary} weight="bold" />
          </Pressable>

          <View
            className={`absolute bottom-3 ${dots ? 'left-0 right-0' : 'right-4'} flex-row items-center justify-center gap-2`}
          >
            {dots ? (
              <View className="flex-row items-center gap-2 rounded-full bg-black/25 px-3 py-1.5">
                {photos.map((photo, index) => {
                  const isActive = index === safeActiveIndex;
                  return (
                    <Pressable
                      key={photo.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Ir para foto ${index + 1}`}
                      onPress={() => scrollToIndex(index)}
                      hitSlop={8}
                      className="h-2.5 rounded-full"
                      style={{
                        width: isActive ? 20 : 10,
                        backgroundColor: isActive ? colors.primary : colors.card,
                      }}
                    />
                  );
                })}
              </View>
            ) : (
              <View className="rounded-full bg-black/50 px-3 py-1">
                <Text className="font-body text-xs font-semibold text-white">
                  {safeActiveIndex + 1}/{photos.length}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}
