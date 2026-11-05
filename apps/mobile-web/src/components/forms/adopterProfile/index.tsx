import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PrimaryCheckBox } from '@/components/checkboxs/primary';
import { PrimaryChip } from '@/components/chips/primaryChip';
import { PrimaryButton } from '@/components/buttons/primary';
import { cn } from '@/utils/cn';
import { palette } from '@/theme';
import {
  type AdopterProfileFormDataType,
  adopterProfileFormsConfig,
  adopterProfileSchema,
} from './model';
import { router } from 'expo-router';
import type { Icon } from 'phosphor-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const PROGRESS_ANIMATION_DURATION_MS = 250;
const STEP_TRANSITION_DURATION_MS = 240;
const STEP_SLIDE_OFFSET_PX = 18;
const COMPLETION_ENTRANCE_DURATION_MS = 320;
const COMPLETION_INITIAL_SCALE = 0.92;
const CARD_SELECTED_SCALE = 1.02;
const CARD_UNSELECTED_SCALE = 1;
const CARD_ICON_SIZE = 26;
const STEP_CONTENT_GAP = 24;
const COMPLETION_PADDING = 24;
const OPTION_CARD_MIN_WIDTH = 100;

const CARD_SPRING_CONFIG = {
  damping: 14,
  stiffness: 180,
};

export interface AdopterProfileFormsProps {
  currentField: number;
  onSubmit: (data: AdopterProfileFormDataType) => void | Promise<void>;
  onBack?: VoidFunction;
  onNext: VoidFunction;
  initialValues?: Partial<AdopterProfileFormDataType>;
  isSubmitting?: boolean;
  onComplete?: VoidFunction;
  completeTitle?: string;
  completeDescription?: string;
  completeButtonTitle?: string;
}

interface AnimatedOptionCardProps {
  label: string;
  isSelected: boolean;
  IconComponent?: Icon;
  onPress: VoidFunction;
}

function AnimatedOptionCard({
  label,
  isSelected,
  IconComponent,
  onPress,
}: AnimatedOptionCardProps) {
  const cardScale = useSharedValue(
    isSelected ? CARD_SELECTED_SCALE : CARD_UNSELECTED_SCALE,
  );

  useEffect(() => {
    cardScale.value = withSpring(
      isSelected ? CARD_SELECTED_SCALE : CARD_UNSELECTED_SCALE,
      CARD_SPRING_CONFIG,
    );
  }, [cardScale, isSelected]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View style={[styles.optionCardContainer, cardAnimatedStyle]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={label}
        className={cn(
          'items-center justify-center p-4 rounded-2xl border-2 min-h-[110px]',
          isSelected
            ? 'bg-orange-light/30 border-orange'
            : 'bg-white border-border active:bg-cream',
        )}
      >
        {IconComponent ? (
          <View
            className={cn(
              'w-12 h-12 rounded-full items-center justify-center mb-2',
              isSelected ? 'bg-orange' : 'bg-cream',
            )}
          >
            <IconComponent
              size={CARD_ICON_SIZE}
              weight={isSelected ? 'bold' : 'regular'}
              color={isSelected ? palette.white : palette.orangeDark}
            />
          </View>
        ) : null}
        <Text
          className={cn(
            'font-body-medium text-sm text-center',
            isSelected ? 'text-orange-dark font-bold' : 'text-ink',
          )}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface AnimatedCompletionViewProps {
  title?: string;
  description?: string;
  buttonTitle?: string;
  onComplete?: VoidFunction;
}

function AnimatedCompletionView({
  title,
  description,
  buttonTitle,
  onComplete,
}: AnimatedCompletionViewProps) {
  const completionOpacity = useSharedValue(0);
  const completionScale = useSharedValue(COMPLETION_INITIAL_SCALE);

  useEffect(() => {
    completionOpacity.value = withTiming(1, {
      duration: COMPLETION_ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    completionScale.value = withSpring(1, CARD_SPRING_CONFIG);
  }, [completionOpacity, completionScale]);

  const completionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: completionOpacity.value,
    transform: [{ scale: completionScale.value }],
  }));

  const handleCompletePress = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/');
    }
  };

  return (
    <Animated.View style={[styles.completionContainer, completionAnimatedStyle]}>
      <Text className="font-heading-bold text-2xl text-ink text-center mb-2">
        {title ?? 'Perfil Concluído!'}
      </Text>
      <Text className="font-body text-sm text-ink-muted text-center mb-4">
        {description ?? 'Suas preferências foram registradas com sucesso.'}
      </Text>
      <PrimaryButton
        size="sm"
        className="md:w-1/2"
        onPress={handleCompletePress}
      >
        {buttonTitle ?? 'Ir para home'}
      </PrimaryButton>
    </Animated.View>
  );
}

export const AdopterProfileForms = ({
  currentField,
  onSubmit,
  onBack,
  onNext,
  initialValues,
  isSubmitting = false,
  onComplete,
  completeTitle,
  completeDescription,
  completeButtonTitle,
}: AdopterProfileFormsProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AdopterProfileFormDataType>({
    resolver: zodResolver(adopterProfileSchema),
    defaultValues: initialValues,
    values: initialValues as AdopterProfileFormDataType | undefined,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const totalSteps = adopterProfileFormsConfig.length;
  const current = adopterProfileFormsConfig[currentField];
  const isLastStep = currentField === totalSteps - 1;

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.round(((currentField + 1) / totalSteps) * 100));
  }, [currentField, totalSteps]);

  const animatedProgress = useSharedValue(progressPercent);

  useEffect(() => {
    animatedProgress.value = withTiming(progressPercent, {
      duration: PROGRESS_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  const stepOpacity = useSharedValue(1);
  const stepTranslateX = useSharedValue(0);
  const previousStepRef = useRef(currentField);

  useEffect(() => {
    const direction = currentField >= previousStepRef.current ? 1 : -1;
    previousStepRef.current = currentField;

    stepOpacity.value = 0;
    stepTranslateX.value = direction * STEP_SLIDE_OFFSET_PX;

    stepOpacity.value = withTiming(1, {
      duration: STEP_TRANSITION_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });

    stepTranslateX.value = withTiming(0, {
      duration: STEP_TRANSITION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentField, stepOpacity, stepTranslateX]);

  const stepTransitionStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateX: stepTranslateX.value }],
  }));

  if (!current) {
    return (
      <AnimatedCompletionView
        title={completeTitle}
        description={completeDescription}
        buttonTitle={completeButtonTitle}
        onComplete={onComplete}
      />
    );
  }

  return (
    <View className="flex-1 justify-between p-5 max-w-form w-full mx-auto">
      <View className="gap-6">
        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="font-body-medium text-xs text-orange-dark tracking-wide uppercase">
              Passo {currentField + 1} de {totalSteps}
            </Text>
            <Text className="font-body text-xs text-ink-muted">
              {progressPercent}%
            </Text>
          </View>
          <View className="h-2 w-full bg-border rounded-full overflow-hidden">
            <Animated.View
              testID="adopter-profile-progress-bar"
              style={[styles.progressBarFill, progressStyle]}
            />
          </View>
        </View>

        <Animated.View style={[styles.stepContent, stepTransitionStyle]}>
          <View className="gap-1.5">
            <Text className="font-heading-bold text-2xl text-ink leading-tight">
              {current.title}
            </Text>
            {current.description ? (
              <Text className="font-body text-sm text-ink-muted leading-relaxed">
                {current.description}
              </Text>
            ) : null}
          </View>

          <Controller
            control={control}
            name={current.name}
            render={({ field: { onChange, value } }) => {
              const fieldError = errors[current.name]?.message;

              return (
                <View className="gap-3">
                  {current.comp === 'card' && (
                    <View className="flex-row flex-wrap gap-3">
                      {current.options.map((option) => {
                        const isSelected = value === option.value;

                        return (
                          <AnimatedOptionCard
                            key={String(option.value)}
                            label={option.label}
                            isSelected={isSelected}
                            IconComponent={option.icon}
                            onPress={() =>
                              onChange(isSelected ? null : option.value)
                            }
                          />
                        );
                      })}
                    </View>
                  )}

                  {current.comp === 'checkbox' && (
                    <View className="gap-2.5">
                      {current.options.map((option) => {
                        const isSelected = value === option.value;

                        return (
                          <Pressable
                            key={String(option.value)}
                            onPress={() =>
                              onChange(isSelected ? null : option.value)
                            }
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
                            accessibilityLabel={option.label}
                            className={cn(
                              'flex-row items-center justify-between p-3.5 rounded-xl border transition-all min-h-[52px]',
                              isSelected
                                ? 'bg-orange-light/20 border-orange'
                                : 'bg-white border-border active:bg-cream',
                            )}
                          >
                            <PrimaryCheckBox
                              label={option.label}
                              checked={isSelected}
                              onChange={(checked) => {
                                onChange(checked ? option.value : null);
                              }}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {current.comp === 'chip' && (
                    <View className="flex-row flex-wrap gap-2.5">
                      {current.options.map((option) => {
                        const isSelected = value === option.value;

                        return (
                          <PrimaryChip
                            key={String(option.value)}
                            label={option.label}
                            selected={isSelected}
                            onPress={() =>
                              onChange(isSelected ? null : option.value)
                            }
                          />
                        );
                      })}
                    </View>
                  )}

                  {fieldError ? (
                    <Text className="font-body-medium text-xs text-danger mt-1">
                      {fieldError}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        </Animated.View>
      </View>

      <View className="pt-6 border-t border-line/60 flex-row gap-3 items-center mt-8">
        {currentField > 0 && onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao passo anterior"
            className="px-5 py-3 min-h-[48px] items-center justify-center rounded-xl border border-border bg-white active:bg-cream"
          >
            <Text className="font-body-medium text-sm text-ink-muted">
              Voltar
            </Text>
          </Pressable>
        ) : null}

        <View className="flex-1">
          <PrimaryButton
            title={isLastStep ? 'Concluir Perfil' : 'Avançar'}
            onPress={
              isLastStep ? handleSubmit((data) => onSubmit(data)) : onNext
            }
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  optionCardContainer: {
    flex: 1,
    minWidth: OPTION_CARD_MIN_WIDTH,
  },
  completionContainer: {
    flex: 1,
    padding: COMPLETION_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: palette.orange,
    borderRadius: 9999,
  },
  stepContent: {
    gap: STEP_CONTENT_GAP,
  },
});
