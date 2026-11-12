import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
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
import { ArrowLeftIcon, HeartIcon, PawPrintIcon } from 'phosphor-react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import { EligibilityNotice } from '@/components/feedback/EligibilityNotice';
import { isAdult, isValidPhone } from '@kapa/shared';
import { PrimaryInputText } from '@/components/inputText/primary';
import { ResidentialAddressFields, residentialAddressSchema } from '@/components/forms/ResidentialAddressFields';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { useCreateAdoption } from '@/hooks/useAdoptions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { palette } from '@/theme';

const adoptionApplicationSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  birthDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe sua data de nascimento.'),
  phone: z.string().trim().min(10, 'Informe um telefone com DDD.').max(20),
  ...residentialAddressSchema.shape,
  housingType: z.enum(['house', 'apartment', 'farm', 'rural'], {
    required_error: 'Selecione onde você mora.',
  }),
  housingSituation: z.enum(['own', 'rented', 'loaned'], {
    required_error: 'Selecione sua situação de moradia.',
  }),
  residenceProtection: z.enum(['yes', 'partial', 'no'], {
    required_error: 'Informe se a residência possui proteção.',
  }),
  hasChildren: z.enum(['yes', 'no'], {
    required_error: 'Informe se há crianças na residência.',
  }),
  childrenAges: z.string().trim().optional(),
  hasOtherPets: z.enum(['yes', 'no'], {
    required_error: 'Informe se já possui outros animais.',
  }),
  otherPetsDetails: z.string().trim().optional(),
  residentsAgree: z.enum(['yes', 'no'], {
    required_error: 'Informe se todos os moradores concordam.',
  }),
  freeStreetAccess: z.enum(['yes', 'no'], {
    required_error: 'Informe se o animal terá acesso à rua.',
  }),
  awareOfResponsibilities: z.enum(['yes', 'no'], {
    required_error: 'Confirme se está de acordo com as responsabilidades.',
  }),
}).superRefine((values, context) => {
  if (values.hasChildren === 'yes' && !values.childrenAges) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['childrenAges'], message: 'Informe as idades das crianças.' });
  }

  if (values.hasOtherPets === 'yes' && !values.otherPetsDetails) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['otherPetsDetails'], message: 'Informe quantos animais possui e quais são.' });
  }
});

type AdoptionApplicationFormData = z.infer<typeof adoptionApplicationSchema>;

type Choice = {
  value: string;
  label: string;
};

const housingOptions: Choice[] = [
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Apartamento' },
  { value: 'farm', label: 'Chácara' },
  { value: 'rural', label: 'Sítio' },
];

const housingSituationOptions: Choice[] = [
  { value: 'own', label: 'Própria' },
  { value: 'rented', label: 'Alugada' },
  { value: 'loaned', label: 'Cedida' },
];

const yesNoOptions: Choice[] = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
];

const protectionOptions: Choice[] = [
  { value: 'yes', label: 'Sim, totalmente' },
  { value: 'partial', label: 'Parcialmente' },
  { value: 'no', label: 'Não' },
];

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: Choice[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="font-body-bold text-sm text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              className={cn(
                'min-h-11 rounded-full border px-4 items-center justify-center',
                selected
                  ? 'bg-orange border-orange'
                  : 'bg-white border-border',
              )}
              onPress={() => onChange(option.value)}
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
      {error ? <Text className="font-body-medium text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

function MissingPet() {
  return (
    <View className="flex-1 items-center justify-center bg-cream p-6 gap-4">
      <PawPrintIcon size={48} color={palette.denim} weight="duotone" />
      <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink text-center">
        Este pet não está disponível
      </Text>
      <PrimaryButton title="Voltar para os pets" fullWidth={false} onPress={() => router.replace('/adopet')} />
    </View>
  );
}

export function AdoptionApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: animals = [], isLoading, error } = useAdoptAnimals();
  const { user } = useAuth();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const { mutateAsync: createAdoption, isPending: isSubmitting } = useCreateAdoption();
  const animal = useMemo(
    () => animals.find((item) => item.id === id && item.status === 'available'),
    [animals, id],
  );
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<AdoptionApplicationFormData>({
    resolver: zodResolver(adoptionApplicationSchema),
    defaultValues: {
      fullName: user?.username ?? '',
      birthDate: user?.birthDate ?? '',
      phone: user?.phone ?? '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      postalCode: '',
      housingType: undefined,
      housingSituation: undefined,
      residenceProtection: undefined,
      hasChildren: undefined,
      childrenAges: '',
      hasOtherPets: undefined,
      otherPetsDetails: '',
      residentsAgree: undefined,
      freeStreetAccess: undefined,
      awareOfResponsibilities: undefined,
    },
  });
  const hasChildren = useWatch({ control, name: 'hasChildren' });
  useEffect(() => {
    setValue('birthDate', user?.birthDate ?? '');
    setValue('phone', user?.phone ?? '');
  }, [setValue, user?.birthDate, user?.phone]);
  const hasOtherPets = useWatch({ control, name: 'hasOtherPets' });

  const [postalCode, street, number, neighborhood, city] = useWatch({
    control, name: ['postalCode', 'street', 'number', 'neighborhood', 'city'],
  });

  async function submitApplication(data: AdoptionApplicationFormData) {
    if (!animal) return;
    setSubmissionError('');
    try {
      await createAdoption({ animalId: animal.id, application: data });
      setShowCompletionModal(true);
    } catch (error) {
      if (isAxiosError<{ message?: string; error?: string }>(error)) {
        setSubmissionError(
          error.response?.data?.message
            ?? error.response?.data?.error
            ?? 'Não foi possível enviar sua ficha agora. Tente novamente.',
        );
      } else {
        setSubmissionError('Não foi possível enviar sua ficha agora. Tente novamente.');
      }
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream gap-3">
        <ActivityIndicator size="large" color={palette.orange} />
        <Text className="font-body text-sm text-ink-muted">Carregando ficha de adoção...</Text>
      </View>
    );
  }

  if (error || !animal) return <MissingPet />;
  if (!isAdult(user?.birthDate) || !isValidPhone(user?.phone)) return <EligibilityNotice user={user} />;

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="w-full max-w-form self-center px-5 md:px-10 pt-3 gap-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para os detalhes do pet"
            className="min-h-12 self-start flex-row items-center gap-2 py-3 pr-4"
            onPress={() => router.back()}
          >
            <ArrowLeftIcon size={18} color={palette.denim} />
            <Text className="font-body-medium text-sm text-denim">Voltar para {animal.name}</Text>
          </Pressable>

          <View className="gap-2">
            <Text className="font-heading-bold text-3xl text-ink">Ficha de adoção</Text>
            <Text className="font-body text-base leading-6 text-ink-muted">
              Conte um pouco sobre você para ajudar o abrigo a conhecer a família do {animal.name}.
            </Text>
          </View>

          <View className="rounded-2xl bg-peach p-4 flex-row items-center gap-3">
            <View className="size-11 rounded-full bg-white items-center justify-center">
              <HeartIcon size={22} color={palette.orange} weight="fill" />
            </View>
            <View className="flex-1">
              <Text className="font-body-medium text-sm text-ink">Você está se candidatando para</Text>
              <Text className="font-heading-bold text-xl text-ink">{animal.name}</Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-line p-5 gap-5">
            <Text className="font-heading-bold text-lg text-ink">Seus dados</Text>
            <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => (
              <PrimaryInputText label="Nome completo" value={value} onChangeText={onChange} placeholder="Como você gostaria de ser chamado" autoCapitalize="words" erro={errors.fullName?.message} />
            )} />
            <Controller control={control} name="birthDate" render={({ field: { onChange, value } }) => (
              <PrimaryInputText label="Data de nascimento" value={value.split('-').reverse().join('/')} onChangeText={onChange} editable={false} />
            )} />
            <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
              <PrimaryInputText label="Telefone / WhatsApp com DDD" value={value} onChangeText={onChange} editable={false} placeholder="(00) 00000-0000" keyboardType="phone-pad" erro={errors.phone?.message} />
            )} />
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/(protected)/(adopter)/edit-profile')}><Text className="font-body-medium text-sm text-denim">Atualizar nascimento ou celular no perfil</Text></Pressable>
          <ResidentialAddressFields
            description="Essas informações ajudam o abrigo a conhecer melhor o local onde o animal vai morar."
            address={{ postalCode, street, number, neighborhood, city }}
            onChange={(fields) => {
              for (const field of residentialAddressSchema.keyof().options) {
                const value = fields[field];
                if (value !== undefined) setValue(field, value, { shouldDirty: true, shouldValidate: Boolean(errors[field]) });
              }
            }}
            errors={{
              postalCode: errors.postalCode?.message,
              street: errors.street?.message,
              number: errors.number?.message,
              neighborhood: errors.neighborhood?.message,
              city: errors.city?.message,
            }}
          />

          <View className="bg-white rounded-2xl border border-line p-5 gap-5">
            <Text className="font-heading-bold text-lg text-ink">Sua rotina e moradia</Text>
            <Controller control={control} name="housingType" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="Onde você mora?" options={housingOptions} value={value} onChange={onChange} error={errors.housingType?.message} />
            )} />
            <Controller control={control} name="housingSituation" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="Sua moradia é" options={housingSituationOptions} value={value} onChange={onChange} error={errors.housingSituation?.message} />
            )} />
            <Controller control={control} name="residenceProtection" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="A residência possui muros, portões ou telas de proteção?" options={protectionOptions} value={value} onChange={onChange} error={errors.residenceProtection?.message} />
            )} />
            <Controller control={control} name="hasChildren" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="Existem crianças na residência?" options={yesNoOptions} value={value} onChange={onChange} error={errors.hasChildren?.message} />
            )} />
            {hasChildren === 'yes' ? (
              <Controller control={control} name="childrenAges" render={({ field: { onChange, value } }) => (
                <PrimaryInputText label="Quais são as idades das crianças?" value={value ?? ''} onChangeText={onChange} placeholder="Ex.: 4 e 9 anos" erro={errors.childrenAges?.message} />
              )} />
            ) : null}
            <Controller control={control} name="hasOtherPets" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="Possui outros animais?" options={yesNoOptions} value={value} onChange={onChange} error={errors.hasOtherPets?.message} />
            )} />
            {hasOtherPets === 'yes' ? (
              <Controller control={control} name="otherPetsDetails" render={({ field: { onChange, value } }) => (
                <PrimaryInputText label="Quantos animais possui e quais são?" value={value ?? ''} onChangeText={onChange} placeholder="Ex.: 2 gatos e 1 cachorro" erro={errors.otherPetsDetails?.message} />
              )} />
            ) : null}
          </View>

          <View className="bg-white rounded-2xl border border-line p-5 gap-5">
            <Text className="font-heading-bold text-lg text-ink">Responsabilidades</Text>
            <Controller control={control} name="residentsAgree" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="Todos os moradores concordam com a adoção?" options={yesNoOptions} value={value} onChange={onChange} error={errors.residentsAgree?.message} />
            )} />
            <Controller control={control} name="freeStreetAccess" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="O animal terá acesso livre à rua?" options={yesNoOptions} value={value} onChange={onChange} error={errors.freeStreetAccess?.message} />
            )} />
            <Controller control={control} name="awareOfResponsibilities" render={({ field: { onChange, value } }) => (
              <ChoiceGroup label="Está ciente e de acordo com os custos e responsabilidades de cuidar de um animal?" options={yesNoOptions} value={value} onChange={onChange} error={errors.awareOfResponsibilities?.message} />
            )} />
          </View>

          {submissionError ? <Text className="font-body-medium text-sm text-danger text-center">{submissionError}</Text> : null}
          <PrimaryButton title="Enviar ficha" loading={isSubmitting} onPress={handleSubmit(submitApplication)} />
        </View>
      </ScrollView>

      <Modal visible={showCompletionModal} transparent animationType="fade" onRequestClose={() => setShowCompletionModal(false)}>
        <View className="flex-1 items-center justify-center bg-denim/50 p-5">
          <View accessibilityViewIsModal className="w-full max-w-form bg-white rounded-2xl p-6 gap-4">
            <HeartIcon size={32} color={palette.orange} weight="fill" />
            <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">Ficha preenchida!</Text>
            <Text className="font-body text-base text-ink-muted leading-6">
              Obrigado por contar um pouco sobre você e sobre seu interesse em {animal.name}. O abrigo analisará sua solicitação e entrará em contato pelo telefone informado.
            </Text>
            <PrimaryButton
              title="Ir para o início"
              onPress={() => {
                setShowCompletionModal(false);
                router.replace('/(protected)/(tabs)');
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
