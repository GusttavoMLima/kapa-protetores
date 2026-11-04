import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

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

  // const progressPercent = useSharedValue(
  //   Math.min(100, Math.round(((currentField + 1) / totalSteps) * 100)),
  // );

  // const progressStyle = useAnimatedStyle(() => ({
  //   width: interpolate(progressPercent, [], [])
  // }));

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.round(((currentField + 1) / totalSteps) * 100));
  }, [currentField, totalSteps]);

  if (!current) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="font-heading-bold text-2xl text-ink text-center mb-2">
          {completeTitle ?? 'Perfil Concluído!'}
        </Text>
        <Text className="font-body text-sm text-ink-muted text-center mb-4">
          {completeDescription ??
            'Suas preferências foram registradas com sucesso.'}
        </Text>
        <PrimaryButton
          size="sm"
          className="md:w-1/2"
          onPress={() => {
            if (onComplete) {
              onComplete();
            } else {
              router.replace('/');
            }
          }}
        >
          {completeButtonTitle ?? 'Ir para home'}
        </PrimaryButton>
      </View>
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
            <View
              className="h-full bg-orange rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

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
                      const IconComponent = option.icon;

                      return (
                        <Pressable
                          key={String(option.value)}
                          onPress={() =>
                            onChange(isSelected ? null : option.value)
                          }
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={option.label}
                          className={cn(
                            'flex-1 min-w-[100px] items-center justify-center p-4 rounded-2xl border-2 transition-all min-h-[110px]',
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
                                size={26}
                                weight={isSelected ? 'bold' : 'regular'}
                                color={
                                  isSelected
                                    ? palette.white
                                    : palette.orangeDark
                                }
                              />
                            </View>
                          ) : null}
                          <Text
                            className={cn(
                              'font-body-medium text-sm text-center',
                              isSelected
                                ? 'text-orange-dark font-bold'
                                : 'text-ink',
                            )}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
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
