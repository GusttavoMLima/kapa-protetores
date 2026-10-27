import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import {
  ArrowLeftIcon,
  BroomIcon,
  CalendarBlankIcon,
  CarIcon,
  CheckCircleIcon,
  ClockIcon,
  HandHeartIcon,
  HeartIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import type { CommunityEventType, VolunteerAvailability } from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryCheckBox } from '@/components/checkboxs/primary';
import { PrimaryInputText } from '@/components/inputText/primary';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateVolunteerApplication,
  useMyVolunteerApplication,
} from '@/hooks/useVolunteerApplications';
import { palette } from '@/theme';
import { cn } from '@/utils/cn';

const volunteerFormSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  phone: z.string().trim().min(10, 'Informe um telefone com DDD.').max(20),
  areasOfInterest: z
    .array(z.enum(['care', 'cleaning', 'event', 'transport']))
    .min(1, 'Selecione pelo menos uma área de interesse.')
    .max(4),
  availability: z.enum(['weekdays', 'weekends', 'flexible'], {
    required_error: 'Selecione sua disponibilidade.',
  }),
  motivation: z
    .string()
    .trim()
    .min(10, 'Conte um pouco sobre sua motivação (mínimo 10 caracteres).')
    .max(500),
  acceptsTerms: z.boolean().refine((val) => val === true, {
    message: 'Confirme o termo de compromisso para enviar sua inscrição.',
  }),
});

type VolunteerFormData = z.infer<typeof volunteerFormSchema>;

const AREA_OPTIONS: readonly {
  value: CommunityEventType;
  label: string;
  description: string;
  icon: typeof HeartIcon;
}[] = [
  {
    value: 'care',
    label: 'Cuidados com os pets',
    description: 'Socialização, banho, escovação e carinho aos animais.',
    icon: HeartIcon,
  },
  {
    value: 'cleaning',
    label: 'Limpeza e organização',
    description: 'Apoio na higienização de baias e organização de insumos.',
    icon: BroomIcon,
  },
  {
    value: 'event',
    label: 'Feiras e eventos',
    description: 'Divulgação, recepção e apoio nas feiras de adoção.',
    icon: SparkleIcon,
  },
  {
    value: 'transport',
    label: 'Carona solidária',
    description: 'Transporte para consultas veterinárias ou eventos.',
    icon: CarIcon,
  },
];

const AVAILABILITY_OPTIONS: readonly {
  value: VolunteerAvailability;
  label: string;
}[] = [
  { value: 'weekdays', label: 'Durante a semana' },
  { value: 'weekends', label: 'Finais de semana' },
  { value: 'flexible', label: 'Horários flexíveis' },
];

export const VOLUNTEER_AREA_LABELS: Record<CommunityEventType, string> = {
  care: 'Cuidados com os pets',
  cleaning: 'Limpeza e organização',
  event: 'Feiras e eventos',
  transport: 'Carona solidária',
};

export const VOLUNTEER_AVAILABILITY_LABELS: Record<
  VolunteerAvailability,
  string
> = {
  weekdays: 'Durante a semana',
  weekends: 'Finais de semana',
  flexible: 'Horários flexíveis',
};

function handleNavigateBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(protected)/(tabs)/support');
  }
}

export function VolunteerScreen() {
  const { user, updateUserData } = useAuth();
  const isAlreadyVolunteerOrStaff =
    user?.role === 'volunteer' ||
    user?.role === 'protector' ||
    user?.role === 'admin';

  const {
    data: myApplication,
    isLoading,
    refetch,
  } = useMyVolunteerApplication(Boolean(user));
  const { mutateAsync: submitVolunteerApplication, isPending: isSubmitting } =
    useCreateVolunteerApplication();

  const [submissionError, setSubmissionError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isApproved =
    isAlreadyVolunteerOrStaff || myApplication?.status === 'approved';

  useEffect(() => {
    if (
      myApplication?.status === 'approved' &&
      user &&
      user.role === 'adopter' &&
      updateUserData
    ) {
      void updateUserData({ ...user, role: 'volunteer' });
    }
  }, [myApplication?.status, updateUserData, user]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: {
      fullName: user?.username ?? '',
      phone: '',
      areasOfInterest: [],
      availability: undefined,
      motivation: '',
      acceptsTerms: false,
    },
  });

  async function onSubmit(data: VolunteerFormData) {
    setSubmissionError('');
    try {
      await submitVolunteerApplication(data);
      setShowSuccessModal(true);
    } catch (error) {
      if (isAxiosError<{ message?: string; error?: string }>(error)) {
        setSubmissionError(
          error.response?.data?.message ??
            error.response?.data?.error ??
            'Não foi possível enviar sua inscrição. Tente novamente.',
        );
      } else {
        setSubmissionError(
          'Não foi possível enviar sua inscrição. Tente novamente.',
        );
      }
    }
  }

  if (isLoading && !isAlreadyVolunteerOrStaff) {
    return (
      <View className="flex-1 items-center justify-center bg-cream gap-3">
        <ActivityIndicator size="large" color={palette.orange} />
        <Text className="font-body text-sm text-ink-muted">
          Carregando informações de voluntariado...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="w-full max-w-form self-center px-5 md:px-10 pt-3 gap-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            className="min-h-12 self-start flex-row items-center gap-2 py-3 pr-4"
            onPress={handleNavigateBack}
          >
            <ArrowLeftIcon size={18} color={palette.denim} />
            <Text className="font-body-medium text-sm text-denim">Voltar</Text>
          </Pressable>

          {/* Hero Card */}
          <View className="bg-white rounded-2xl border border-line p-6 gap-3">
            <View className="size-12 rounded-full bg-peach items-center justify-center">
              <HandHeartIcon size={26} color={palette.orange} weight="fill" />
            </View>
            <Text className="font-heading-bold text-2xl md:text-3xl text-ink">
              Seja Voluntário na Kapa
            </Text>
            <Text className="font-body text-base leading-6 text-ink-muted">
              Doe seu tempo e carinho para transformar a rotina dos animais
              resgatados em Mogi-Guaçu.
            </Text>
          </View>

          {/* State 1: Approved Volunteer or Staff */}
          {isApproved ? (
            <View className="bg-white rounded-2xl border border-line p-6 gap-5">
              <View className="flex-row items-center gap-3">
                <View className="size-11 rounded-full bg-[#E8F3EE] items-center justify-center">
                  <CheckCircleIcon
                    size={24}
                    color={palette.success}
                    weight="fill"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-heading-bold text-lg text-ink">
                    Você faz parte do time de voluntários!
                  </Text>
                  <Text className="font-body text-sm text-ink-muted">
                    Seu perfil está habilitado para participar das ações da ONG.
                  </Text>
                </View>
              </View>

              <View className="rounded-xl bg-cream p-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <CalendarBlankIcon
                    size={20}
                    color={palette.denim}
                    weight="bold"
                  />
                  <Text className="font-body-bold text-sm text-denim">
                    Atividades semanais do abrigo
                  </Text>
                </View>
                <Text className="font-body text-sm text-ink-muted leading-5">
                  Confira o calendário de mutirões, feiras de adoção e cuidados
                  com os pets e inscreva-se nos horários disponíveis.
                </Text>
              </View>

              {user?.role === 'volunteer' ? (
                <PrimaryButton
                  title="Ver atividades disponíveis"
                  accessibilityLabel="Ver atividades disponíveis para voluntários"
                  onPress={() => router.push('/(protected)/(tabs)/activities')}
                />
              ) : (
                <PrimaryButton
                  title="Gerenciar atividades da semana"
                  accessibilityLabel="Gerenciar atividades da semana"
                  onPress={() => router.push('/(protected)/manage-activities')}
                />
              )}
            </View>
          ) : myApplication?.status === 'pending' ? (
            /* State 2: Pending Volunteer Application */
            <View className="bg-white rounded-2xl border border-line p-6 gap-5">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="size-11 rounded-full bg-peach items-center justify-center">
                    <ClockIcon
                      size={24}
                      color={palette.orangeDark}
                      weight="fill"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-heading-bold text-lg text-ink">
                      Solicitação em análise
                    </Text>
                    <Text className="font-body text-sm text-ink-muted">
                      A equipe da Kapa está avaliando sua ficha de voluntariado.
                    </Text>
                  </View>
                </View>
                <View className="rounded-full bg-peach px-3 py-1.5">
                  <Text className="font-body-bold text-xs text-orange-dark">
                    Pendente
                  </Text>
                </View>
              </View>

              <View className="bg-cream rounded-xl p-4 gap-3">
                <View className="gap-1">
                  <Text className="font-body-bold text-xs text-denim uppercase">
                    Candidato(a)
                  </Text>
                  <Text className="font-body text-sm text-ink">
                    {myApplication.application.fullName} ·{' '}
                    {myApplication.application.phone}
                  </Text>
                </View>

                <View className="gap-1">
                  <Text className="font-body-bold text-xs text-denim uppercase">
                    Disponibilidade
                  </Text>
                  <Text className="font-body text-sm text-ink">
                    {
                      VOLUNTEER_AVAILABILITY_LABELS[
                        myApplication.application.availability
                      ]
                    }
                  </Text>
                </View>

                <View className="gap-1.5">
                  <Text className="font-body-bold text-xs text-denim uppercase">
                    Áreas de interesse
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {myApplication.application.areasOfInterest.map((area) => (
                      <View
                        key={area}
                        className="rounded-full bg-peach px-3 py-1"
                      >
                        <Text className="font-body-medium text-xs text-denim">
                          {VOLUNTEER_AREA_LABELS[area]}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <PrimaryButton
                title="Atualizar status"
                onPress={() => void refetch()}
              />
            </View>
          ) : (
            /* State 3: Volunteer Application Form */
            <>
              {myApplication?.status === 'rejected' ? (
                <View className="rounded-2xl border border-danger bg-danger-soft p-4 gap-1">
                  <Text className="font-body-bold text-sm text-danger">
                    Sua solicitação anterior não pôde ser aprovada no momento.
                  </Text>
                  <Text className="font-body text-xs text-danger">
                    Você pode atualizar seus dados e enviar uma nova ficha abaixo.
                  </Text>
                </View>
              ) : null}

              {/* Dados de contato */}
              <View className="bg-white rounded-2xl border border-line p-5 gap-5">
                <Text className="font-heading-bold text-lg text-ink">
                  Seus dados de contato
                </Text>

                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, value } }) => (
                    <PrimaryInputText
                      label="Nome completo"
                      value={value}
                      onChangeText={onChange}
                      placeholder="Como devemos chamar você"
                      autoCapitalize="words"
                      erro={errors.fullName?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <PrimaryInputText
                      label="Telefone / WhatsApp com DDD"
                      value={value}
                      onChangeText={onChange}
                      placeholder="(19) 99999-9999"
                      keyboardType="phone-pad"
                      erro={errors.phone?.message}
                    />
                  )}
                />
              </View>

              {/* Áreas de interesse */}
              <View className="bg-white rounded-2xl border border-line p-5 gap-4">
                <View className="gap-1">
                  <Text className="font-heading-bold text-lg text-ink">
                    Como você gostaria de ajudar?
                  </Text>
                  <Text className="font-body text-sm text-ink-muted">
                    Selecione uma ou mais áreas em que você tem interesse em
                    atuar.
                  </Text>
                </View>

                <Controller
                  control={control}
                  name="areasOfInterest"
                  render={({ field: { onChange, value } }) => (
                    <View className="gap-3">
                      {AREA_OPTIONS.map((option) => {
                        const selected = value.includes(option.value);
                        const IconComponent = option.icon;

                        return (
                          <Pressable
                            key={option.value}
                            accessibilityRole="checkbox"
                            accessibilityLabel={option.label}
                            accessibilityState={{ checked: selected }}
                            onPress={() => {
                              const next = selected
                                ? value.filter((item) => item !== option.value)
                                : [...value, option.value];
                              onChange(next);
                            }}
                            className={cn(
                              'min-h-14 flex-row items-center gap-3.5 rounded-xl border p-4',
                              selected
                                ? 'border-orange bg-peach/60'
                                : 'border-line bg-white',
                            )}
                          >
                            <View
                              className={cn(
                                'size-10 rounded-full items-center justify-center',
                                selected ? 'bg-orange' : 'bg-peach',
                              )}
                            >
                              <IconComponent
                                size={20}
                                color={selected ? palette.white : palette.denim}
                                weight="fill"
                              />
                            </View>
                            <View className="flex-1 gap-0.5">
                              <Text className="font-heading-bold text-base text-ink">
                                {option.label}
                              </Text>
                              <Text className="font-body text-xs text-ink-muted">
                                {option.description}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                      {errors.areasOfInterest?.message ? (
                        <Text className="font-body-medium text-xs text-danger">
                          {errors.areasOfInterest.message}
                        </Text>
                      ) : null}
                    </View>
                  )}
                />
              </View>

              {/* Disponibilidade e Motivação */}
              <View className="bg-white rounded-2xl border border-line p-5 gap-5">
                <Text className="font-heading-bold text-lg text-ink">
                  Disponibilidade e motivação
                </Text>

                <Controller
                  control={control}
                  name="availability"
                  render={({ field: { onChange, value } }) => (
                    <View className="gap-2">
                      <Text className="font-body-bold text-sm text-ink">
                        Qual é sua principal disponibilidade?
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {AVAILABILITY_OPTIONS.map((option) => {
                          const selected = value === option.value;
                          return (
                            <Pressable
                              key={option.value}
                              accessibilityRole="radio"
                              accessibilityLabel={option.label}
                              accessibilityState={{ selected }}
                              onPress={() => onChange(option.value)}
                              className={cn(
                                'min-h-11 rounded-full border px-4 items-center justify-center',
                                selected
                                  ? 'bg-orange border-orange'
                                  : 'bg-white border-border',
                              )}
                            >
                              <Text
                                className={cn(
                                  'font-body-medium text-sm',
                                  selected ? 'text-white' : 'text-ink',
                                )}
                              >
                                {option.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {errors.availability?.message ? (
                        <Text className="font-body-medium text-xs text-danger">
                          {errors.availability.message}
                        </Text>
                      ) : null}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="motivation"
                  render={({ field: { onChange, value } }) => (
                    <PrimaryInputText
                      label="Por que você quer ser voluntário(a) na Kapa?"
                      value={value}
                      onChangeText={onChange}
                      placeholder="Conte se já teve contato com animais ou como pretende apoiar o abrigo"
                      multiline
                      erro={errors.motivation?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="acceptsTerms"
                  render={({ field: { onChange, value } }) => (
                    <PrimaryCheckBox
                      checked={value}
                      onChange={onChange}
                      label="Comprometo-me a respeitar as orientações de segurança e bem-estar animal da ONG Kapa Protetores."
                      error={errors.acceptsTerms?.message}
                    />
                  )}
                />
              </View>

              {submissionError ? (
                <Text className="font-body-medium text-sm text-danger text-center">
                  {submissionError}
                </Text>
              ) : null}

              <PrimaryButton
                title="Enviar inscrição de voluntariado"
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
              />
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-denim/50 p-5">
          <View
            accessibilityViewIsModal
            className="w-full max-w-form bg-white rounded-2xl p-6 gap-4"
          >
            <HandHeartIcon size={32} color={palette.orange} weight="fill" />
            <Text
              accessibilityRole="header"
              className="font-heading-bold text-xl text-ink"
            >
              Inscrição enviada!
            </Text>
            <Text className="font-body text-base text-ink-muted leading-6">
              Recebemos seu interesse em atuar como voluntário(a) na Kapa. Nossa
              equipe analisará sua ficha e liberará seu acesso às atividades da
              semana em breve.
            </Text>
            <PrimaryButton
              title="Entendi"
              onPress={() => setShowSuccessModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
