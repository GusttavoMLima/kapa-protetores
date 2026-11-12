import { useState } from 'react';
import { Linking, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { CalendarBlankIcon, CaretDownIcon, CaretUpIcon, CheckIcon, ClipboardTextIcon, HouseIcon, MapPinIcon, ShieldCheckIcon, UserIcon, WhatsappLogoIcon, XIcon } from 'phosphor-react-native';
import type { Adoption, UpdateAdoptionStatusInput } from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { useUpdateAdoptionStatus } from '@/hooks/useAdoptions';
import { palette } from '@/theme';
import { AnimalThumbnail } from '../animalManagement/components';
import { DetailLine, DetailSection, RequestAction } from './components';
import { ContractPanel } from './ContractPanel';
import { buildWhatsAppUrl, formatRequestDate, statusLabels, statusStyles } from './model';

const housingLabels = { house: 'Casa', apartment: 'Apartamento', farm: 'Chácara', rural: 'Sítio' };
const situationLabels = { own: 'Própria', rented: 'Alugada', loaned: 'Cedida' };
const yesNo = { yes: 'Sim', no: 'Não' };

function Progress({ adoption }: { adoption: Adoption }) {
  if (adoption.status === 'rejected' || adoption.status === 'canceled') return null;
  const current = adoption.status === 'approved' ? 3 : adoption.status === 'pending' ? 0 : adoption.contractSentAt || adoption.signedContractUploadedAt ? 2 : 1;
  return <View accessibilityLabel={`Etapa atual: ${['Análise', 'Conversa', 'Contrato', 'Novo lar'][current]}`} className="flex-row gap-2">
    {['Análise', 'Conversa', 'Contrato', 'Novo lar'].map((label, index) => <View key={label} className="flex-1 gap-2">
      <View className={`h-1 rounded-full ${index <= current ? 'bg-orange' : 'bg-line'}`} />
      <View className="flex-col items-start md:flex-row md:items-center gap-1"><View className={`size-5 rounded-full items-center justify-center ${index <= current ? 'bg-peach' : 'bg-cream'}`}>{index < current ? <CheckIcon size={12} color={palette.denim} weight="bold" /> : <Text className="font-body-medium text-xs text-denim">{index + 1}</Text>}</View><Text className={`font-body-medium text-xs ${index <= current ? 'text-denim' : 'text-ink-muted'}`}>{label}</Text></View>
    </View>)}
  </View>;
}

export function RequestCard({ adoption, expanded, onToggle }: { adoption: Adoption; expanded: boolean; onToggle: () => void }) {
  const { mutate: update, isPending: busy } = useUpdateAdoptionStatus();
  const [note, setNote] = useState(adoption.adminNote ?? '');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string }>();
  const [confirmation, setConfirmation] = useState<'rejected' | 'approved' | null>(null);
  const application = adoption.application;
  const name = application?.fullName ?? adoption.adopter?.username ?? 'Família interessada';
  const animalName = adoption.animal?.name ?? 'um pet';
  const active = adoption.status === 'pending' || adoption.status === 'interviewing';
  const whatsappUrl = application ? buildWhatsAppUrl(application.phone, name, animalName) : null;

  function save(input: UpdateAdoptionStatusInput, message: string) {
    setFeedback(undefined);
    update({ id: adoption.id, ...input }, {
      onSuccess: () => { if (input.adminNote !== undefined) setNote(input.adminNote ?? ''); setConfirmation(null); setFeedback({ kind: 'success', message }); },
      onError: () => { setConfirmation(null); setFeedback({ kind: 'error', message: 'Não foi possível salvar a alteração. Tente novamente.' }); },
    });
  }

  return <View className={`overflow-hidden rounded-2xl border bg-white shadow-card ${expanded ? 'border-denim/30' : 'border-line'}`}>
    <View className="p-5 md:p-6 gap-4">
      <View className="flex-row items-start gap-4">
        {adoption.animal ? <AnimalThumbnail animal={adoption.animal} /> : <View className="size-16 rounded-lg bg-peach items-center justify-center"><UserIcon size={28} color={palette.denim} /></View>}
        <View className="flex-1 min-w-0 gap-1"><Text className="font-body-medium text-xs text-orange-dark">UM NOVO COMEÇO PARA {animalName.toLocaleUpperCase('pt-BR')}</Text><Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">{name}</Text><Text className="font-body text-sm text-ink-muted">Quer adotar {animalName}</Text></View>
      </View>
      <View className="flex-row flex-wrap items-center gap-3">
        <Text className={`rounded-full px-3 py-2 font-body-medium text-xs ${statusStyles[adoption.status]}`}>{statusLabels[adoption.status]}</Text>
        <View className="flex-row items-center gap-1.5"><CalendarBlankIcon size={15} color={palette.inkMuted} /><Text className="font-body text-xs text-ink-muted">Recebida em {formatRequestDate(adoption.appliedAt)}</Text></View>
        {application?.city ? <View className="flex-row items-center gap-1.5"><MapPinIcon size={15} color={palette.inkMuted} /><Text className="font-body text-xs text-ink-muted">{application.city}</Text></View> : null}
      </View>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`${expanded ? 'Recolher' : 'Analisar'} ficha de ${name}`} accessibilityState={{ expanded }}
        className={`min-h-12 flex-row items-center justify-between rounded-xl px-4 py-3 ${expanded ? 'bg-cream' : 'bg-peach hover:bg-cream'}`}>
        <View className="flex-row items-center gap-2"><ClipboardTextIcon size={19} color={palette.denim} /><Text className="font-body-medium text-sm text-denim">{expanded ? 'Recolher ficha' : active ? 'Analisar ficha' : 'Ver ficha e histórico'}</Text></View>
        {expanded ? <CaretUpIcon size={18} color={palette.denim} /> : <CaretDownIcon size={18} color={palette.denim} />}
      </Pressable>
    </View>

    {expanded ? <View className="border-t border-line p-5 md:p-6 gap-6">
      {!application ? <Text className="font-body text-sm text-ink-muted">Os dados desta ficha não estão disponíveis. Nenhuma alteração pode ser feita por esta tela.</Text> : <>
        <Progress adoption={adoption} />
        <View className="flex-col md:flex-row gap-4">
          <DetailSection title="Sobre a família" icon={UserIcon}>
            <DetailLine label="Nome completo" value={application.fullName} />
            <DetailLine label="Data de nascimento" value={application.birthDate.split('-').reverse().join('/')} />
            <DetailLine label="Celular / WhatsApp" value={application.phone} />
          </DetailSection>
          <DetailSection title="Um lugar para chamar de lar" icon={HouseIcon}>
            <DetailLine label="Endereço" value={`${application.street}, ${application.number} · ${application.neighborhood}`} />
            <DetailLine label="Cidade e CEP" value={`${application.city} · ${application.postalCode}`} />
            <DetailLine label="Moradia" value={`${housingLabels[application.housingType]} · ${situationLabels[application.housingSituation]}`} />
          </DetailSection>
        </View>
        <View className="flex-col md:flex-row gap-4">
          <DetailSection title="Convivência e rotina" icon={HouseIcon}>
            <DetailLine label="Residência protegida" value={application.residenceProtection === 'partial' ? 'Parcialmente' : yesNo[application.residenceProtection]} />
            <DetailLine label="Crianças em casa" value={`${yesNo[application.hasChildren]}${application.childrenAges ? ` · ${application.childrenAges}` : ''}`} />
            <DetailLine label="Outros animais" value={`${yesNo[application.hasOtherPets]}${application.otherPetsDetails ? ` · ${application.otherPetsDetails}` : ''}`} />
          </DetailSection>
          <DetailSection title="Compromissos com o cuidado" icon={ShieldCheckIcon}>
            <DetailLine label="Todos os moradores concordam" value={yesNo[application.residentsAgree]} />
            <DetailLine label="Animal terá acesso livre à rua" value={yesNo[application.freeStreetAccess]} />
            <DetailLine label="Ciente dos custos e responsabilidades" value={yesNo[application.awareOfResponsibilities]} />
          </DetailSection>
        </View>
        {active ? <View className="gap-3">
          <View className="gap-1"><Text className="font-heading-bold text-base text-ink">Anotações da equipe</Text><Text className="font-body text-xs text-ink-muted">Somente a equipe tem acesso a estas observações.</Text></View>
          <TextInput value={note} onChangeText={setNote} editable={!busy} multiline maxLength={2000} textAlignVertical="top" accessibilityLabel={`Anotação interna da solicitação de ${name}`} placeholder="Registre a conversa, dúvidas ou o próximo encontro…" placeholderTextColor={palette.inkMuted} className="min-h-24 rounded-xl border border-line bg-cream p-4 font-body text-sm text-ink" />
          <View className="self-start"><RequestAction label="Salvar anotação" disabled={busy || note === (adoption.adminNote ?? '')} onPress={() => save({ adminNote: note.trim() || null }, 'Anotação salva para a equipe.')} /></View>
        </View> : adoption.adminNote ? <DetailSection title="Anotações da equipe" icon={ClipboardTextIcon}><Text className="font-body text-sm leading-6 text-ink-muted">{adoption.adminNote}</Text></DetailSection> : null}

        {adoption.status === 'interviewing' ? <View className="gap-3"><RequestAction label="Abrir conversa no WhatsApp" icon={WhatsappLogoIcon} disabled={busy || !whatsappUrl} onPress={() => { if (whatsappUrl) void Linking.openURL(whatsappUrl).catch(() => setFeedback({ kind: 'error', message: 'Não foi possível abrir o WhatsApp.' })); }} />{!whatsappUrl ? <Text className="font-body text-xs text-danger">O telefone informado não permite abrir o WhatsApp. Confira o contato na ficha.</Text> : null}</View> : null}
        {adoption.status === 'interviewing' || adoption.status === 'approved' ? <ContractPanel adoption={adoption} busy={busy} onMarkSent={() => save({ contractSent: true }, 'Envio do contrato registrado.')} /> : null}

        {active ? <View className="gap-3 border-t border-line pt-5">
          <Text className="font-heading-bold text-base text-ink">{adoption.status === 'pending' ? 'O próximo passo é conhecer a família' : 'Tudo pronto para um novo começo?'}</Text>
          <Text className="font-body text-sm leading-6 text-ink-muted">{adoption.status === 'pending' ? 'Confira os dados antes de iniciar a conversa. A pré-aprovação ainda não conclui a adoção.' : 'A conclusão é liberada após anexar o contrato assinado pela família.'}</Text>
          <View className="flex-col md:flex-row gap-3"><View className="flex-1"><PrimaryButton title={adoption.status === 'pending' ? 'Pré-aprovar e iniciar contato' : 'Concluir adoção'} loading={busy} disabled={adoption.status === 'interviewing' && !adoption.signedContractUploadedAt} onPress={() => adoption.status === 'pending' ? save({ status: 'interviewing' }, 'Ficha pré-aprovada. Você já pode conversar com a família.') : setConfirmation('approved')} /></View><RequestAction label="Recusar ficha" icon={XIcon} destructive disabled={busy} onPress={() => setConfirmation('rejected')} /></View>
        </View> : null}
      </>}
      {feedback ? <Text accessibilityRole={feedback.kind === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite" className={`font-body-medium text-sm leading-6 rounded-xl p-4 ${feedback.kind === 'error' ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`}>{feedback.message}</Text> : null}
    </View> : null}

    <Modal visible={confirmation !== null} transparent animationType="fade" onRequestClose={() => { if (!busy) setConfirmation(null); }}>
      <View className="flex-1 items-center justify-center bg-denim/50 p-5"><View accessibilityViewIsModal className="w-full max-w-form rounded-2xl bg-white p-6 gap-5">
        <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">{confirmation === 'rejected' ? 'Recusar esta solicitação?' : 'Confirmar a adoção?'}</Text>
        <Text className="font-body text-base leading-6 text-ink-muted">{confirmation === 'rejected' ? `A ficha de ${name} para ${animalName} será marcada como recusada. Confira se a família já recebeu as orientações da equipe.` : `A adoção de ${animalName} por ${name} será concluída. Confira o contrato assinado antes de confirmar.`}</Text>
        <PrimaryButton title={confirmation === 'rejected' ? 'Confirmar recusa' : 'Confirmar adoção'} className={confirmation === 'rejected' ? 'bg-danger' : undefined} loading={busy} onPress={() => { if (confirmation) save({ status: confirmation }, confirmation === 'rejected' ? 'Ficha marcada como recusada.' : 'Adoção concluída. Um novo começo para essa família!'); }} />
        <RequestAction label="Voltar à análise" disabled={busy} onPress={() => setConfirmation(null)} />
      </View></View>
    </Modal>
  </View>;
}
