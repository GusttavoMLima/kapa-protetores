import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PawPrintIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminAdoptions,
  downloadSignedContract,
  openSignedContract,
  useUpdateAdoptionStatus,
  useUploadSignedContract,
} from '@/hooks/useAdoptions';
import { PrimaryButton } from '@/components/buttons/primary';
import { palette } from '@/theme';
import {
  buildContractWhatsAppUrl,
  openAdoptionContract,
  selectSignedContractPdf,
} from '@/utils/adoptionContract';
import { BackLink } from '../animalManagement/components';

const housingLabels = {
  house: 'Casa',
  apartment: 'Apartamento',
  farm: 'Chácara',
  rural: 'Sítio',
};
const situationLabels = { own: 'Própria', rented: 'Alugada', loaned: 'Cedida' };
const yesNo = { yes: 'Sim', no: 'Não' };

function buildWhatsAppUrl(phone: string, adopterName: string, animalName: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) return null;

  const message = `Olá, ${adopterName}! Somos da Kapa Protetores. Sua ficha para adoção de ${animalName} foi pré-aprovada e gostaríamos de continuar o processo com você.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function AdoptionRequestsScreen() {
  const { user } = useAuth();
  const { data: adoptions = [], isLoading, error } = useAdminAdoptions();
  const { mutate: updateStatus, isPending } = useUpdateAdoptionStatus();
  const { mutate: uploadSignedContract, isPending: isUploadingContract } =
    useUploadSignedContract();
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (user?.role !== 'admin') return <Redirect href="/(protected)/(tabs)" />;

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
    >
      <BackLink />
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
      {isLoading ? (
        <View className="py-16 items-center gap-3">
          <ActivityIndicator size="large" color={palette.orange} />
          <Text className="font-body text-ink-muted">
            Carregando solicitações...
          </Text>
        </View>
      ) : error ? (
        <View className="bg-white rounded-2xl border border-danger-soft p-5">
          <Text className="font-body-medium text-danger">
            Não foi possível carregar as solicitações.
          </Text>
        </View>
      ) : adoptions.length === 0 ? (
        <View className="bg-white rounded-2xl border border-line p-10 items-center gap-3">
          <PawPrintIcon size={44} color={palette.denim} />
          <Text className="font-heading-bold text-lg text-ink">
            Nenhuma ficha recebida ainda
          </Text>
          <Text className="font-body text-sm text-ink-muted text-center">
            Quando alguém demonstrar interesse em um pet, a ficha aparecerá
            aqui.
          </Text>
        </View>
      ) : (
        adoptions.map((adoption) => {
          const application = adoption.application;
          if (!application) return null;
          const statusLabel =
            adoption.status === 'approved'
              ? 'Adoção concluída'
              : adoption.status === 'interviewing'
                ? 'Em contato'
                : adoption.status === 'rejected'
                  ? 'Recusada'
                  : 'Em análise';
          const statusClass =
            adoption.status === 'approved'
              ? 'bg-success-soft text-success'
              : adoption.status === 'interviewing'
                ? 'bg-secondary-container text-denim'
              : adoption.status === 'rejected'
                ? 'bg-danger-soft text-danger'
                : 'bg-peach text-orange-dark';
          const note = notes[adoption.id] ?? adoption.adminNote ?? '';
          const animalName = adoption.animal?.name ?? 'o pet';
          const whatsappUrl = buildWhatsAppUrl(
            application.phone,
            application.fullName,
            animalName,
          );
          const contractWhatsAppUrl = buildContractWhatsAppUrl(
            application.phone,
            application.fullName,
            animalName,
          );
          const openContract = (printImmediately = false) => {
            const opened = openAdoptionContract(adoption, printImmediately);
            if (!opened) {
              Alert.alert(
                'Não foi possível abrir o contrato',
                'Verifique se o navegador permite abrir uma nova aba e tente novamente.',
              );
            }
          };
          const saveNote = () =>
            updateStatus({
              id: adoption.id,
              adminNote: note.trim() || null,
            });
          const reject = () =>
            updateStatus({ id: adoption.id, status: 'rejected' });
          const uploadContract = async () => {
            const file = await selectSignedContractPdf();
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
              Alert.alert('Arquivo muito grande', 'Envie um PDF de até 10 MB.');
              return;
            }
            uploadSignedContract(
              { id: adoption.id, file },
              {
                onError: () =>
                  Alert.alert(
                    'Não foi possível anexar o contrato',
                    'Confira se o arquivo é um PDF válido e tente novamente.',
                  ),
              },
            );
          };
          const downloadContract = async () => {
            try {
              const downloaded = await downloadSignedContract(
                adoption.id,
                adoption.signedContractFileName ?? 'contrato-assinado.pdf',
              );
              if (!downloaded) {
                Alert.alert(
                  'Download indisponível',
                  'Abra esta tela pelo navegador para baixar o contrato.',
                );
              }
            } catch {
              Alert.alert(
                'Não foi possível baixar o contrato',
                'Tente novamente em alguns instantes.',
              );
            }
          };
          const viewContract = async () => {
            try {
              const opened = await openSignedContract(adoption.id);
              if (!opened) {
                Alert.alert(
                  'Não foi possível abrir o contrato',
                  'Verifique se o navegador permite abrir uma nova aba e tente novamente.',
                );
              }
            } catch {
              Alert.alert(
                'Não foi possível abrir o contrato',
                'Tente novamente em alguns instantes.',
              );
            }
          };
          return (
            <View
              key={adoption.id}
              className="bg-white rounded-2xl border border-line p-6 gap-5"
            >
              <View className="flex-row items-start justify-between gap-4">
                <View className="gap-1 flex-1">
                  <Text className="font-heading-bold text-xl text-ink">
                    {application.fullName}
                  </Text>
                  <Text className="font-body text-sm text-ink-muted">
                    Quer adotar {adoption.animal?.name ?? 'um pet'}
                  </Text>
                </View>
                <Text
                  className={`font-body-bold text-xs px-3 py-2 rounded-full ${statusClass}`}
                >
                  {statusLabel}
                </Text>
              </View>
              <View className="bg-cream rounded-xl p-4 gap-1">
                <Text className="font-body-bold text-sm text-denim">
                  Contato
                </Text>
                <Text className="font-body text-sm text-ink">
                  {application.phone}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  Nascimento:{' '}
                  {application.birthDate.split('-').reverse().join('/')}
                </Text>
              </View>
              <View className="gap-1">
                <Text className="font-body-bold text-sm text-ink">
                  Endereço
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  {application.street}, {application.number} —{' '}
                  {application.neighborhood}, {application.city} · CEP{' '}
                  {application.postalCode}
                </Text>
              </View>
              <View className="bg-cream rounded-xl p-4 gap-2">
                <Text className="font-body-bold text-sm text-ink">
                  Moradia e rotina
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  Tipo de moradia: {housingLabels[application.housingType]}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  Situação da moradia:{' '}
                  {situationLabels[application.housingSituation]}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  Possui proteção:{' '}
                  {application.residenceProtection === 'partial'
                    ? 'Parcial'
                    : yesNo[application.residenceProtection]}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  Existem crianças: {yesNo[application.hasChildren]}
                  {application.childrenAges
                    ? ` (${application.childrenAges})`
                    : ''}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  Possui outros animais: {yesNo[application.hasOtherPets]}
                  {application.otherPetsDetails
                    ? ` (${application.otherPetsDetails})`
                    : ''}
                </Text>
              </View>
              <View className="bg-cream rounded-xl p-4 gap-2">
                <Text className="font-body-bold text-sm text-ink">
                  Responsabilidades
                </Text>
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
              {adoption.status === 'pending' || adoption.status === 'interviewing' ? (
                <View className="gap-2">
                  <Text className="font-body-bold text-sm text-ink">
                    Anotação interna
                  </Text>
                  <TextInput
                    value={note}
                    onChangeText={(value) =>
                      setNotes((current) => ({ ...current, [adoption.id]: value }))
                    }
                    placeholder="Ex.: Agendar conversa para sábado"
                    placeholderTextColor={palette.inkMuted}
                    multiline
                    maxLength={2000}
                    className="min-h-[96px] rounded-xl border border-line bg-white px-4 py-3 font-body text-sm text-ink"
                    accessibilityLabel="Anotação interna da solicitação"
                  />
                  <Pressable
                    className="self-start min-h-[44px] rounded-lg border border-denim px-4 py-3 items-center justify-center"
                    disabled={isPending}
                    accessibilityRole="button"
                    accessibilityLabel="Salvar anotação interna"
                    onPress={saveNote}
                  >
                    <Text className="font-body-bold text-sm text-denim">
                      Salvar anotação
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {adoption.status === 'pending' ? (
                <View className="gap-3">
                  <PrimaryButton
                    title="Pré-aprovar e iniciar contato"
                    loading={isPending}
                    onPress={() =>
                      updateStatus({ id: adoption.id, status: 'interviewing' })
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
                    onPress={reject}
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
              ) : adoption.status === 'interviewing' ? (
                <View className="gap-3">
                  <Pressable
                    className="w-full min-h-[52px] rounded-lg items-center justify-center border border-denim bg-white"
                    disabled={!whatsappUrl || isPending}
                    accessibilityRole="button"
                    accessibilityLabel="Entrar em contato pelo WhatsApp"
                    onPress={() => whatsappUrl && void Linking.openURL(whatsappUrl)}
                  >
                    <Text className="font-body-bold text-base text-denim">
                      Abrir conversa no WhatsApp
                    </Text>
                  </Pressable>
                  <View className="rounded-xl border border-line bg-cream p-4 gap-3">
                    <View className="gap-1">
                      <Text className="font-body-bold text-base text-ink">
                        Contrato de adoção
                      </Text>
                      <Text className="font-body text-sm text-ink-muted">
                        Documento preenchido automaticamente com os dados da ficha e do pet.
                      </Text>
                    </View>
                    <Pressable
                      className="min-h-[44px] self-start rounded-lg border border-denim px-4 py-3 items-center justify-center"
                      accessibilityRole="button"
                      accessibilityLabel="Visualizar contrato de adoção"
                      onPress={() => openContract()}
                    >
                      <Text className="font-body-bold text-sm text-denim">
                        Visualizar contrato
                      </Text>
                    </Pressable>
                    <Pressable
                      className="min-h-[44px] self-start rounded-lg border border-denim px-4 py-3 items-center justify-center"
                      accessibilityRole="button"
                      accessibilityLabel="Salvar contrato em PDF"
                      onPress={() => openContract(true)}
                    >
                      <Text className="font-body-bold text-sm text-denim">
                        Salvar como PDF
                      </Text>
                    </Pressable>
                    <Pressable
                      className="min-h-[44px] self-start rounded-lg border border-denim px-4 py-3 items-center justify-center"
                      disabled={!contractWhatsAppUrl}
                      accessibilityRole="button"
                      accessibilityLabel="Enviar mensagem sobre o contrato pelo WhatsApp"
                      onPress={() =>
                        contractWhatsAppUrl && void Linking.openURL(contractWhatsAppUrl)
                      }
                    >
                      <Text className="font-body-bold text-sm text-denim">
                        Enviar mensagem do contrato
                      </Text>
                    </Pressable>
                    <Text className="font-body text-xs text-ink-muted">
                      Após salvar, anexe o PDF na conversa do WhatsApp.
                    </Text>
                  </View>
                  {adoption.contractSentAt ? (
                    <View className="gap-3">
                      <View className="rounded-xl bg-secondary-container px-4 py-3 gap-1">
                        <Text className="font-body-bold text-sm text-denim">
                          Contrato enviado em {new Date(adoption.contractSentAt).toLocaleDateString('pt-BR')}
                        </Text>
                        <Text className="font-body text-sm text-ink-muted">
                          Anexe a versão assinada para liberar a conclusão da adoção.
                        </Text>
                      </View>
                      {adoption.signedContractUploadedAt ? (
                        <View className="rounded-xl bg-success-soft px-4 py-3 gap-2">
                          <Text className="font-body-bold text-sm text-success">
                            Contrato assinado anexado
                          </Text>
                          <Text className="font-body text-sm text-ink-muted">
                            {adoption.signedContractFileName ?? 'Arquivo PDF'} · {new Date(adoption.signedContractUploadedAt).toLocaleDateString('pt-BR')}
                          </Text>
                          <Pressable
                            className="self-start min-h-[40px] rounded-lg border border-success px-3 py-2 items-center justify-center"
                            accessibilityRole="button"
                            accessibilityLabel="Baixar contrato assinado"
                            onPress={() => void downloadContract()}
                          >
                            <Text className="font-body-bold text-sm text-success">
                              Baixar contrato assinado
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <PrimaryButton
                          title="Anexar contrato assinado (PDF)"
                          loading={isUploadingContract}
                          disabled={isPending}
                          onPress={() => void uploadContract()}
                        />
                      )}
                    </View>
                  ) : (
                    <PrimaryButton
                      title="Marcar contrato como enviado"
                      loading={isPending}
                      onPress={() => updateStatus({ id: adoption.id, contractSent: true })}
                    />
                  )}
                  <PrimaryButton
                    title="Concluir adoção"
                    loading={isPending}
                    disabled={!adoption.signedContractUploadedAt || isUploadingContract}
                    onPress={() => updateStatus({ id: adoption.id, status: 'approved' })}
                  />
                  {!adoption.signedContractUploadedAt ? (
                    <Text className="font-body text-xs text-ink-muted text-center">
                      Anexe o contrato assinado para concluir a adoção.
                    </Text>
                  ) : null}
                  <Pressable
                    className="w-full min-h-[52px] rounded-lg items-center justify-center bg-danger"
                    style={({ pressed }) => [
                      { backgroundColor: pressed ? '#8B1111' : '#BA1A1A' },
                      isPending ? { opacity: 0.55 } : null,
                    ]}
                    disabled={isPending}
                    accessibilityRole="button"
                    accessibilityLabel="Recusar ficha"
                    onPress={reject}
                  >
                    {isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text className="font-bold text-base text-white">Recusar ficha</Text>}
                  </Pressable>
                </View>
              ) : adoption.status === 'approved' && adoption.signedContractUploadedAt ? (
                <View className="rounded-xl border border-success bg-success-soft px-4 py-4 gap-2">
                  <Text className="font-body-bold text-base text-success">
                    Contrato assinado arquivado
                  </Text>
                  <Text className="font-body text-sm text-ink-muted">
                    {adoption.signedContractFileName ?? 'Arquivo PDF'} · anexado em{' '}
                    {new Date(adoption.signedContractUploadedAt).toLocaleDateString('pt-BR')}
                  </Text>
                  <Pressable
                    className="self-start min-h-[40px] rounded-lg border border-success px-3 py-2 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Visualizar contrato assinado"
                    onPress={() => void viewContract()}
                  >
                    <Text className="font-body-bold text-sm text-success">
                      Visualizar contrato assinado
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
