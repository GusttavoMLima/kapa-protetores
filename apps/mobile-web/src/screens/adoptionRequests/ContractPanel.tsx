import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { DownloadSimpleIcon, EyeIcon, FilePdfIcon, PrinterIcon, WhatsappLogoIcon } from 'phosphor-react-native';
import type { Adoption } from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { downloadSignedContract, openSignedContract, useUploadSignedContract } from '@/hooks/useAdoptions';
import { buildContractWhatsAppUrl, openAdoptionContract, selectSignedContractPdf } from '@/utils/adoptionContract';
import { palette } from '@/theme';
import { RequestAction } from './components';
import { formatRequestDate } from './model';

export function ContractPanel({ adoption, busy, onMarkSent }: { adoption: Adoption; busy: boolean; onMarkSent: () => void }) {
  const { mutate: upload, isPending: uploading } = useUploadSignedContract();
  const [feedback, setFeedback] = useState('');
  const [reading, setReading] = useState(false);
  const application = adoption.application;
  const disabled = busy || uploading || reading;
  const archived = Boolean(adoption.signedContractUploadedAt);

  function preview(print = false) {
    setFeedback('');
    if (!openAdoptionContract(adoption, print)) setFeedback('Não foi possível abrir o contrato. Permita novas abas no navegador e tente novamente.');
  }
  async function readSigned(download: boolean) {
    setFeedback(''); setReading(true);
    try {
      const opened = download ? await downloadSignedContract(adoption.id, adoption.signedContractFileName ?? 'contrato-assinado.pdf') : await openSignedContract(adoption.id);
      if (!opened) setFeedback('Abra esta tela pelo navegador e permita novas abas para acessar o PDF.');
    } catch { setFeedback('Não foi possível acessar o contrato. Tente novamente.'); }
    finally { setReading(false); }
  }
  async function attach() {
    setFeedback('');
    try {
      const file = await selectSignedContractPdf();
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { setFeedback('Envie um arquivo PDF de até 10 MB.'); return; }
      upload({ id: adoption.id, file }, { onError: () => setFeedback('Não foi possível anexar o contrato. Confira o PDF e tente novamente.') });
    } catch { setFeedback('Não foi possível selecionar o PDF. Tente novamente.'); }
  }
  const whatsappUrl = application ? buildContractWhatsAppUrl(application.phone, application.fullName, adoption.animal?.name ?? 'o pet') : null;
  return <View className="rounded-xl border border-line bg-white p-5 gap-4">
    <View className="flex-row items-center gap-3"><View className="size-11 rounded-xl bg-peach items-center justify-center"><FilePdfIcon size={24} color={palette.denim} /></View><View className="flex-1 gap-1"><Text className="font-heading-bold text-base text-ink">Contrato de adoção</Text><Text className="font-body text-xs leading-5 text-ink-muted">Do primeiro envio à assinatura, tudo no mesmo lugar.</Text></View></View>
    {archived ? <View className="rounded-xl bg-success-soft p-4 gap-2"><Text className="font-body-medium text-sm text-success">{adoption.status === 'approved' ? 'Contrato assinado arquivado' : 'Contrato assinado anexado'}</Text><Text className="font-body text-xs text-ink-muted">{adoption.signedContractFileName ?? 'Arquivo PDF'} · {formatRequestDate(adoption.signedContractUploadedAt ?? '')}</Text>
      <View className="flex-row flex-wrap gap-2"><RequestAction label="Visualizar contrato assinado" icon={EyeIcon} disabled={disabled} onPress={() => void readSigned(false)} /><RequestAction label="Baixar contrato assinado" icon={DownloadSimpleIcon} disabled={disabled} onPress={() => void readSigned(true)} /></View>
    </View> : adoption.status === 'interviewing' ? <>
      <Text className="font-body text-sm leading-5 text-ink-muted">O documento já vem preenchido com os dados da família e do pet.</Text>
      <View className="flex-row flex-wrap gap-2"><RequestAction label="Visualizar contrato" icon={EyeIcon} disabled={disabled} onPress={() => preview()} /><RequestAction label="Salvar como PDF" icon={PrinterIcon} disabled={disabled} onPress={() => preview(true)} /></View>
      <RequestAction label="Enviar mensagem do contrato" icon={WhatsappLogoIcon} disabled={disabled || !whatsappUrl} onPress={() => { if (whatsappUrl) void Linking.openURL(whatsappUrl).catch(() => setFeedback('Não foi possível abrir o WhatsApp.')); }} />
      <Text className="font-body text-xs leading-5 text-ink-muted">Salve o PDF e anexe na conversa do WhatsApp. A mensagem não envia o arquivo automaticamente.</Text>
      {adoption.contractSentAt ? <View className="rounded-xl bg-cream p-4 gap-3"><Text className="font-body-medium text-sm text-denim">Enviado em {formatRequestDate(adoption.contractSentAt)}</Text><Text className="font-body text-xs leading-5 text-ink-muted">Recebeu o documento assinado? Anexe o PDF para liberar a conclusão.</Text><PrimaryButton title="Anexar contrato assinado (PDF)" loading={uploading} disabled={busy || reading} onPress={() => void attach()} /></View> : <RequestAction label="Marcar contrato como enviado" disabled={disabled} onPress={onMarkSent} />}
    </> : <Text className="font-body text-sm text-ink-muted">Nenhum contrato assinado anexado.</Text>}
    {feedback ? <Text accessibilityRole="alert" className="font-body text-sm leading-5 text-danger">{feedback}</Text> : null}
  </View>;
}
