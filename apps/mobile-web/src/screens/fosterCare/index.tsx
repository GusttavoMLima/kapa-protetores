import { FOSTER_CARE_FAQ } from '@kapa/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BedIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeading } from '@/components/layout/PageHeading';
import { BackLink } from '@/screens/animalManagement/components';
import { PrimaryChip } from '@/components/chips/primaryChip';
import { ResidentialAddressFields, residentialAddressSchema, type ResidentialAddress } from '@/components/forms/ResidentialAddressFields';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryInputText } from '@/components/inputText/primary';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';
import { palette } from '@/theme';
import { fetchMyFosterApplication, fosterStatusLabel, submitFosterApplication } from '@/services/fosterApplications';
import { FosterHomeDetails, fosterHomeQuestionKeys, fosterHomeQuestions } from './FosterHomeDetails';

const yesNoOptions = [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }] as const;

const statusPresentation = {
  pending: { icon: ClockIcon, background: 'bg-peach', text: 'text-orange-dark', color: palette.orangeDark },
  approved: { icon: CheckCircleIcon, background: 'bg-success-soft', text: 'text-success', color: palette.success },
  rejected: { icon: XCircleIcon, background: 'bg-danger-soft', text: 'text-danger', color: palette.danger },
};

export function FosterCareScreen() {
  const { user } = useAuth();
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-content self-center gap-4 px-5 pb-10 pt-3 md:px-10">
          <BackLink
            label="Apoie a Kapa"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/support');
            }}
          />
          <PageHeading
            eyebrow="APOIE A KAPA"
            title="Lar Temporário"
            description={FOSTER_CARE_FAQ.answer}
            icon={BedIcon}
          />
          {user && <FosterApplicationForm key={user.id} userId={user.id} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FosterApplicationForm({ userId }: { userId: string }) {
  const { signOut } = useAuth();
  const [availability, setAvailability] = useState('');
  const [homeNotes, setHomeNotes] = useState('');
  const [address, setAddress] = useState<ResidentialAddress>({
    postalCode: '', street: '', number: '', neighborhood: '', city: '',
  });
  const [homeAnswers, setHomeAnswers] = useState<Record<(typeof fosterHomeQuestionKeys)[number], boolean | null>>({
    hasOtherAnimals: null, hasPerimeterBarrier: null, hasSecureGate: null,
  });
  const queryClient = useQueryClient();
  const queryKey = ['foster-application', userId];
  const application = useQuery({
    queryKey,
    queryFn: fetchMyFosterApplication,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && failureCount < 3,
  });
  const submit = useMutation({
    mutationFn: submitFosterApplication,
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) void application.refetch();
    },
  });
  const { hasOtherAnimals, hasPerimeterBarrier, hasSecureGate } = homeAnswers;
  const parsedAddress = residentialAddressSchema.safeParse(address);
  const submission = availability.trim() && homeNotes.trim() && parsedAddress.success &&
    hasOtherAnimals !== null && hasPerimeterBarrier !== null && hasSecureGate !== null
    ? {
        availability: availability.trim(),
        homeNotes: homeNotes.trim(),
        homeAddress: `${parsedAddress.data.street}, ${parsedAddress.data.number} • ${parsedAddress.data.neighborhood}, ${parsedAddress.data.city} • CEP ${parsedAddress.data.postalCode}`,
        hasOtherAnimals, hasPerimeterBarrier, hasSecureGate,
      }
    : null;
  const sessionRejected = [application.error, submit.error].some(
    (error) => error instanceof ApiError && error.status === 401,
  );
  const status = application.data?.status;
  const presentation = status ? statusPresentation[status] : null;
  const StatusIcon = presentation?.icon;

  return (
    <View className="gap-4 rounded-2xl border border-line bg-card p-5">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          {StatusIcon && presentation ? (
            <View className={`size-11 items-center justify-center rounded-full ${presentation.background}`}>
              <StatusIcon size={24} weight="fill" color={presentation.color} />
            </View>
          ) : null}
          <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">
            Sua candidatura
          </Text>
        </View>
        {status && presentation && !sessionRejected && !application.isError ? (
          <View className={`rounded-full px-3 py-1.5 ${presentation.background}`}>
            <Text accessibilityLiveRegion="polite" className={`font-body-bold text-xs ${presentation.text}`}>
              {fosterStatusLabel[status]}
            </Text>
          </View>
        ) : null}
      </View>
      {sessionRejected ? (
        <>
          <Text accessibilityRole="alert" className="font-body text-danger">
            Entre novamente para consultar ou enviar sua candidatura.
          </Text>
          <PrimaryButton title="Entrar novamente" fullWidth={false} onPress={signOut} />
        </>
      ) : application.isPending ? (
        <Text accessibilityLiveRegion="polite" className="font-body text-ink-muted">Carregando candidatura…</Text>
      ) : application.isError ? (
        <>
          <Text accessibilityRole="alert" className="font-body text-danger">Não foi possível consultar a candidatura.</Text>
          <PrimaryButton title="Tentar novamente" fullWidth={false} onPress={() => void application.refetch()} />
        </>
      ) : application.data ? (
        <>
          <FosterHomeDetails application={application.data} />
        </>
      ) : (
        <>
          <PrimaryInputText
            label="Disponibilidade"
            placeholder="Quando você pode começar e por quanto tempo?"
            value={availability}
            onChangeText={setAvailability}
            maxLength={240}
            editable={!submit.isPending}
          />
          <ResidentialAddressFields
            title="Endereço da casa"
            description="Informe onde o animal será acolhido."
            address={address}
            onChange={(fields) => setAddress((previous) => ({ ...previous, ...fields }))}
            editable={!submit.isPending}
          />
          {fosterHomeQuestionKeys.map((key) => (
            <View key={key} className="gap-2">
              <Text className="font-body-medium text-sm text-ink">{fosterHomeQuestions[key]}</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={fosterHomeQuestions[key]} className="flex-row flex-wrap gap-2">
                {yesNoOptions.map(({ label, value }) => (
                  <PrimaryChip
                    key={label}
                    label={label}
                    selected={homeAnswers[key] === value}
                    onPress={() => setHomeAnswers((previous) => ({ ...previous, [key]: value }))}
                    disabled={submit.isPending}
                  />
                ))}
              </View>
            </View>
          ))}
          <PrimaryInputText
            label="Espaço de acolhimento"
            placeholder="Descreva onde o animal ficará e, se houver outros animais, quais são"
            value={homeNotes}
            onChangeText={setHomeNotes}
            multiline
            maxLength={2000}
            editable={!submit.isPending}
          />
          {submit.isError && (
            <Text accessibilityRole="alert" className="font-body text-danger">
              Não foi possível enviar a candidatura. Tente novamente.
            </Text>
          )}
          <PrimaryButton
            title="Enviar candidatura"
            disabled={!submission}
            loading={submit.isPending}
            onPress={() => { if (submission) submit.mutate(submission); }}
          />
        </>
      )}
    </View>
  );
}
