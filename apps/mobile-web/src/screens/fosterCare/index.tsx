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
import { PrimaryCheckBox } from '@/components/checkboxs/primary';
import { DateTimeField } from '@/components/inputDateTime';
import { ResidentialAddressFields, residentialAddressSchema, type ResidentialAddress } from '@/components/forms/ResidentialAddressFields';
import { PrimaryButton } from '@/components/buttons/primary';
import { FormSubmissionLoader } from '@/components/feedback/FormSubmissionLoader';
import { PrimaryInputText } from '@/components/inputText/primary';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';
import { palette } from '@/theme';
import {
  editFosterApplication, fetchMyFosterApplication, fosterStatusLabel, submitFosterApplication,
  type ApplicantFosterApplication, type FosterApplicationInput,
} from '@/services/fosterApplications';
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
  const [mode, setMode] = useState<{ kind: 'edit'; id: string } | { kind: 'new' } | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ['foster-application', userId];
  const application = useQuery({
    queryKey,
    queryFn: fetchMyFosterApplication,
    refetchOnMount: 'always',
    refetchInterval: ({ state }) => state.data?.availableUntil && !state.data.canSubmitNew ? 60_000 : false,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && failureCount < 3,
  });
  const submit = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: FosterApplicationInput }) =>
      id ? editFosterApplication(id, input) : submitFosterApplication(input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      setMode(null);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) void application.refetch();
    },
  });
  const latest = application.data;
  const editing = mode?.kind === 'edit' && latest?.id === mode.id && latest.canEdit ? latest : undefined;
  const showEditor = !latest || Boolean(editing) || (mode?.kind === 'new' && latest.canSubmitNew);
  const sessionRejected = [application.error, submit.error].some(
    (error) => error instanceof ApiError && error.status === 401,
  );
  const status = application.data?.status;
  const presentation = status ? statusPresentation[status] : null;
  const StatusIcon = presentation?.icon;

  return (
    <View className="gap-4 rounded-2xl border border-line bg-card p-5">
      <FormSubmissionLoader visible={submit.isPending} message={editing ? 'Salvando candidatura a lar temporário…' : 'Enviando candidatura a lar temporário…'} />
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
      ) : application.isError && !latest ? (
        <>
          <Text accessibilityRole="alert" className="font-body text-danger">Não foi possível consultar a candidatura.</Text>
          <PrimaryButton title="Tentar novamente" fullWidth={false} onPress={() => void application.refetch()} />
        </>
      ) : latest && !showEditor ? (
        <>
          <FosterHomeDetails application={latest} />
          {latest.canSubmitNew && (
            <Text className="font-body text-sm text-ink-muted">A disponibilidade desta candidatura terminou.</Text>
          )}
          <View className="flex-row flex-wrap gap-3">
            {latest.canEdit && (
              <PrimaryButton title="Editar candidatura" fullWidth={false} onPress={() => {
                submit.reset();
                setMode({ kind: 'edit', id: latest.id });
              }} />
            )}
            {latest.canSubmitNew && (
              <PrimaryButton title="Nova candidatura" fullWidth={false} onPress={() => {
                submit.reset();
                setMode({ kind: 'new' });
              }} />
            )}
          </View>
        </>
      ) : (
        <FosterApplicationEditor
          key={editing?.id ?? 'new'}
          initial={editing}
          pending={submit.isPending}
          error={submit.error}
          onSubmit={(input) => submit.mutate({ id: editing?.id, input })}
          onCancel={latest ? () => { setMode(null); submit.reset(); } : undefined}
        />
      )}
    </View>
  );
}

function FosterApplicationEditor({ initial, pending, error, onSubmit, onCancel }: {
  initial?: ApplicantFosterApplication;
  pending: boolean;
  error: Error | null;
  onSubmit: (input: FosterApplicationInput) => void;
  onCancel?: () => void;
}) {
  const [availableFrom, setAvailableFrom] = useState(initial?.availableFrom ?? '');
  const [availableUntil, setAvailableUntil] = useState(initial?.availableUntil ?? '');
  const [indefinite, setIndefinite] = useState(Boolean(initial?.availableFrom && !initial.availableUntil));
  const [homeNotes, setHomeNotes] = useState(initial?.homeNotes ?? '');
  const [replaceAddress, setReplaceAddress] = useState(!initial?.homeAddress);
  const [address, setAddress] = useState<ResidentialAddress>({
    postalCode: '', street: '', number: '', neighborhood: '', city: '',
  });
  const [homeAnswers, setHomeAnswers] = useState<Record<(typeof fosterHomeQuestionKeys)[number], boolean | null>>({
    hasOtherAnimals: initial?.hasOtherAnimals ?? null,
    hasPerimeterBarrier: initial?.hasPerimeterBarrier ?? null,
    hasSecureGate: initial?.hasSecureGate ?? null,
  });

  const parsedAddress = residentialAddressSchema.safeParse(address);
  const homeAddress = replaceAddress
    ? parsedAddress.success
      ? `${parsedAddress.data.street}, ${parsedAddress.data.number} • ${parsedAddress.data.neighborhood}, ${parsedAddress.data.city} • CEP ${parsedAddress.data.postalCode}`
      : null
    : initial?.homeAddress;
  const invalidPeriod = !indefinite && availableFrom && availableUntil && availableUntil < availableFrom;
  const { hasOtherAnimals, hasPerimeterBarrier, hasSecureGate } = homeAnswers;
  const submission = availableFrom && (indefinite || availableUntil) && !invalidPeriod && homeAddress && homeNotes.trim() &&
    hasOtherAnimals !== null && hasPerimeterBarrier !== null && hasSecureGate !== null
    ? {
        availableFrom, availableUntil: indefinite ? null : availableUntil,
        homeNotes: homeNotes.trim(), homeAddress,
        hasOtherAnimals, hasPerimeterBarrier, hasSecureGate,
      }
    : null;

  return (
    <View className="gap-4">
      <View className="gap-3">
        <Text accessibilityRole="header" className="font-heading-bold text-base text-ink">Disponibilidade</Text>
        <DateTimeField label="Quando pode começar" mode="date" value={availableFrom} onChange={setAvailableFrom} disabled={pending} />
        {!indefinite && (
          <DateTimeField label="Até quando pode acolher" mode="date" value={availableUntil} onChange={setAvailableUntil} disabled={pending}
            error={invalidPeriod ? 'A data final deve ser igual ou posterior à inicial.' : undefined} />
        )}
        <PrimaryCheckBox label="Prazo indeterminado" checked={indefinite} onChange={setIndefinite} disabled={pending} />
      </View>
      {initial?.homeAddress && (
        <View className="gap-2">
          <Text className="font-body text-sm text-ink">Endereço registrado: {initial.homeAddress}</Text>
          <PrimaryButton title={replaceAddress ? 'Manter endereço registrado' : 'Alterar endereço'} fullWidth={false}
            disabled={pending} onPress={() => setReplaceAddress((replace) => !replace)} />
        </View>
      )}
      {replaceAddress && (
        <ResidentialAddressFields
          title="Endereço da casa"
          description="Informe onde o animal será acolhido."
          address={address}
          onChange={(fields) => setAddress((previous) => ({ ...previous, ...fields }))}
          editable={!pending}
        />
      )}
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
                disabled={pending}
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
        editable={!pending}
      />
      {error && (
        <Text accessibilityRole="alert" className="font-body text-danger">
          {error instanceof ApiError && (error.status === 400 || error.status === 409) && error.responseMessage
            ? error.responseMessage
            : 'Não foi possível salvar a candidatura. Tente novamente.'}
        </Text>
      )}
      <PrimaryButton
        title={initial ? 'Salvar alterações' : 'Enviar candidatura'}
        disabled={!submission}
        loading={pending}
        onPress={() => { if (submission) onSubmit(submission); }}
      />
      {onCancel && <PrimaryButton title="Cancelar" fullWidth={false} disabled={pending} onPress={onCancel} />}
    </View>
  );
}
