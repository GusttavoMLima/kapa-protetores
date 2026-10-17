import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { PawPrintIcon } from 'phosphor-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAdoptions, useUpdateAdoptionStatus } from '@/hooks/useAdoptions';
import { PrimaryButton } from '@/components/buttons/primary';
import { palette } from '@/theme';

const housingLabels = { house: 'Casa', apartment: 'Apartamento', farm: 'Chácara', rural: 'Sítio' };
const situationLabels = { own: 'Própria', rented: 'Alugada', loaned: 'Cedida' };
const yesNo = { yes: 'Sim', no: 'Não' };

export function AdoptionRequestsScreen() {
  const { user } = useAuth();
  const { data: adoptions = [], isLoading, error } = useAdminAdoptions();
  const { mutate: updateStatus, isPending } = useUpdateAdoptionStatus();
  if (user?.role !== 'admin') return <Redirect href="/(protected)/(tabs)" />;

  return <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}>
    <View className="items-center bg-white rounded-2xl border border-line px-5 py-6 gap-2">
      <View className="w-12 h-12 rounded-full bg-peach items-center justify-center">
        <PawPrintIcon size={26} color={palette.orange} weight="fill" />
      </View>
      <Text className="font-heading-bold text-3xl text-ink text-center">
        Solicitações de adoção
      </Text>
      <Text className="font-body text-base text-ink-muted text-center">
        Conheça as famílias interessadas e analise cada ficha com cuidado.
      </Text>
    </View>
    {isLoading ? <View className="py-16 items-center gap-3"><ActivityIndicator size="large" color={palette.orange} /><Text className="font-body text-ink-muted">Carregando solicitações...</Text></View>
      : error ? <View className="bg-white rounded-2xl border border-danger-soft p-5"><Text className="font-body-medium text-danger">Não foi possível carregar as solicitações.</Text></View>
        : adoptions.length === 0 ? <View className="bg-white rounded-2xl border border-line p-10 items-center gap-3"><PawPrintIcon size={44} color={palette.denim} /><Text className="font-heading-bold text-lg text-ink">Nenhuma ficha recebida ainda</Text><Text className="font-body text-sm text-ink-muted text-center">Quando alguém demonstrar interesse em um pet, a ficha aparecerá aqui.</Text></View>
          : adoptions.map((adoption) => {
            const application = adoption.application;
            if (!application) return null;
            const statusLabel = adoption.status === 'approved' ? 'Aprovada' : adoption.status === 'rejected' ? 'Recusada' : 'Pendente';
            const statusClass = adoption.status === 'approved' ? 'bg-success-soft text-success' : adoption.status === 'rejected' ? 'bg-danger-soft text-danger' : 'bg-peach text-orange-dark';
            return <View key={adoption.id} className="bg-white rounded-2xl border border-line p-6 gap-5">
              <View className="flex-row items-start justify-between gap-4"><View className="gap-1 flex-1"><Text className="font-heading-bold text-xl text-ink">{application.fullName}</Text><Text className="font-body text-sm text-ink-muted">Quer adotar {adoption.animal?.name ?? 'um pet'}</Text></View><Text className={`font-body-bold text-xs px-3 py-2 rounded-full ${statusClass}`}>{statusLabel}</Text></View>
              <View className="bg-cream rounded-xl p-4 gap-1"><Text className="font-body-bold text-sm text-denim">Contato</Text><Text className="font-body text-sm text-ink">{application.phone}</Text><Text className="font-body text-sm text-ink-muted">Nascimento: {application.birthDate.split('-').reverse().join('/')}</Text></View>
              <View className="gap-1"><Text className="font-body-bold text-sm text-ink">Endereço</Text><Text className="font-body text-sm text-ink-muted">{application.street}, {application.number} — {application.neighborhood}, {application.city} · CEP {application.postalCode}</Text></View>
              <View className="bg-cream rounded-xl p-4 gap-2">
                <Text className="font-body-bold text-sm text-ink">Moradia e rotina</Text>
                <Text className="font-body text-sm text-ink-muted">Tipo de moradia: {housingLabels[application.housingType]}</Text>
                <Text className="font-body text-sm text-ink-muted">Situação da moradia: {situationLabels[application.housingSituation]}</Text>
                <Text className="font-body text-sm text-ink-muted">Possui proteção: {application.residenceProtection === 'partial' ? 'Parcial' : yesNo[application.residenceProtection]}</Text>
                <Text className="font-body text-sm text-ink-muted">Existem crianças: {yesNo[application.hasChildren]}{application.childrenAges ? ` (${application.childrenAges})` : ''}</Text>
                <Text className="font-body text-sm text-ink-muted">Possui outros animais: {yesNo[application.hasOtherPets]}{application.otherPetsDetails ? ` (${application.otherPetsDetails})` : ''}</Text>
              </View>
              <View className="bg-cream rounded-xl p-4 gap-2">
                <Text className="font-body-bold text-sm text-ink">Responsabilidades</Text>
                <Text className="font-body text-sm text-ink-muted">
                  {'Moradores concordam: '}
                  {yesNo[application.residentsAgree]}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  {'Acesso livre à rua: '}
                  {yesNo[application.freeStreetAccess]}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  {'Ciente dos custos: '}
                  {yesNo[application.awareOfResponsibilities]}
                </Text>
              </View>
              {adoption.status === 'pending' ? (
                <View className="gap-3">
                  <PrimaryButton
                    title="Aprovar ficha"
                    loading={isPending}
                    onPress={() =>
                      updateStatus({ id: adoption.id, status: 'approved' })
                    }
                  />
                  <Pressable
                    className="w-full min-h-[52px] rounded-lg items-center justify-center bg-danger"
                    style={({ pressed }) => [
                      { backgroundColor: pressed ? '#8B1111' : '#BA1A1A' },
                      isPending ? { opacity: 0.55 } : null,
                    ]}
                    disabled={isPending}
                    accessibilityRole="button"
                    accessibilityLabel="Recusar ficha"
                    onPress={() =>
                      updateStatus({ id: adoption.id, status: 'rejected' })
                    }
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="font-bold text-base text-white">
                        Recusar ficha
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : null}
            </View>;
          })}
  </ScrollView>;
}
