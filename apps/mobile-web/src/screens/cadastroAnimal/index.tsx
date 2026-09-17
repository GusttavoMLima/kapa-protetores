import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryInputText } from '@/components/inputText/primary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import { FotoPicker } from '@/components/photoPicker/profile';
import { saveAnimal } from '@/storage/animals';
import { PrimaryButton } from '@/components/buttons/primary';
import { palette } from '@/theme';
import { styles } from './styles';
import type {
  CondicaoChegada,
  Especie,
  Porte,
  Sexo,
  TriState,
  NivelEnergia,
  StatusAnimal,
  Temperamento,
  Humor,
  DoseRecord,
  DoseStatus,
} from '@/types/animal';
import { hojeBr } from '@kapa/shared/utils';

function novoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type DoseFieldProps = {
  label: string;
  dose: DoseRecord;
  erro?: string;
  onChange: (dose: DoseRecord) => void;
  onRemove?: VoidFunction;
};

function DoseField({ label, dose, erro, onChange, onRemove }: DoseFieldProps) {
  return (
    <View className="gap-2 py-1" style={styles.doseGroup}>
      <View className="flex-row items-center justify-between gap-3" style={styles.doseHeader}>
        <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>{label}</Text>
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remover ${label}`}
            onPress={onRemove}
            className="rounded-lg px-2 py-2 active:bg-danger-soft"
            style={styles.removeDose}
          >
            <Text className="font-body-medium text-xs leading-[14px] text-danger" style={styles.removeDoseText}>
              Remover
            </Text>
          </Pressable>
        ) : null}
      </View>
      <PrimaryChipGroup<DoseStatus>
        value={dose.status}
        onChange={(status) =>
          onChange({ status, data: status === 'sim' ? dose.data : undefined })
        }
        options={[
          { value: 'sim', label: 'Sim' },
          { value: 'nao', label: 'Não' },
        ]}
      />
      {dose.status === 'sim' ? (
        <PrimaryInputText
          label="Data da aplicação"
          value={dose.data ?? ''}
          onChangeText={(data) => onChange({ ...dose, data })}
          placeholder="DD/MM/AAAA"
          keyboardType="numeric"
          erro={erro}
        />
      ) : null}
    </View>
  );
}

export function CadastroAnimalScreen() {
  const [fotoUri, setFotoUri] = useState<string>();
  const [nome, setNome] = useState('');
  const [raca, setRaca] = useState('');
  const [especie, setEspecie] = useState<Especie>('cao');
  const [sexo, setSexo] = useState<Sexo>('macho');
  const [porte, setPorte] = useState<Porte>('medio');
  const [idadeAproximada, setIdadeAproximada] = useState('');
  const [peso, setPeso] = useState('');
  const [corPelagem, setCorPelagem] = useState('');
  const [dataResgate, setDataResgate] = useState(hojeBr);
  const [localResgate, setLocalResgate] = useState('');
  const [condicaoChegada, setCondicaoChegada] =
    useState<CondicaoChegada>('saudavel');
  const [castrado, setCastrado] = useState<TriState>('nao_sei');
  const [v10Doses, setV10Doses] = useState<DoseRecord[]>([{ status: 'nao' }]);
  const [vacinaRaivaDoses, setVacinaRaivaDoses] = useState<DoseRecord[]>([
    { status: 'nao' },
  ]);
  const [vermifugoDoses, setVermifugoDoses] = useState<DoseRecord[]>([
    { status: 'nao' },
  ]);
  const [temperamento, setTemperamento] = useState<Temperamento>('docil');
  const [nivelEnergia, setNivelEnergia] = useState<NivelEnergia>('moderado');
  const [compativelCriancas, setCompativelCriancas] = useState<TriState>('nao_sei');
  const [compativelAnimais, setCompativelAnimais] = useState<TriState>('nao_sei');
  const [compativelApartamento, setCompativelApartamento] = useState<TriState>('nao_sei');
  const [humor, setHumor] = useState<Humor>('tranquilo');
  const [publicacoes, setPublicacoes] = useState('');
  const [status, setStatus] = useState<StatusAnimal>('resgatado');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [sucesso, setSucesso] = useState<string>();
  const [erroSalvar, setErroSalvar] = useState<string>();
  const scrollRef = useRef<ScrollView>(null);

  const fotoErro =
    tentouSalvar && !fotoUri ? 'Adicione uma foto do animal.' : undefined;
  const nomeErro =
    tentouSalvar && !nome.trim() ? 'Preencha o nome do animal.' : undefined;
  const datasPendentes = [
    ...v10Doses.flatMap((dose, index) =>
      dose.status === 'sim' && !dose.data?.trim()
        ? [`data da ${index + 1}ª dose da V10`]
        : [],
    ),
    ...vacinaRaivaDoses.flatMap((dose, index) =>
      dose.status === 'sim' && !dose.data?.trim()
        ? [`data da ${index + 1}ª dose da vacina antirrábica`]
        : [],
    ),
    ...vermifugoDoses.flatMap((dose, index) =>
      dose.status === 'sim' && !dose.data?.trim()
        ? [`data da ${index + 1}ª dose do vermífugo`]
        : [],
    ),
  ];
  const pendentes = [
    ...(fotoErro ? ['foto do animal'] : []),
    ...(nomeErro ? ['nome'] : []),
    ...(tentouSalvar ? datasPendentes : []),
  ];

  function limpar() {
    setFotoUri(undefined);
    setNome('');
    setRaca('');
    setEspecie('cao');
    setSexo('macho');
    setPorte('medio');
    setIdadeAproximada('');
    setPeso('');
    setCorPelagem('');
    setDataResgate(hojeBr());
    setLocalResgate('');
    setCondicaoChegada('saudavel');
    setCastrado('nao_sei');
    setV10Doses([{ status: 'nao' }]);
    setVacinaRaivaDoses([{ status: 'nao' }]);
    setVermifugoDoses([{ status: 'nao' }]);
    setTemperamento('docil');
    setNivelEnergia('moderado');
    setCompativelCriancas('nao_sei');
    setCompativelAnimais('nao_sei');
    setCompativelApartamento('nao_sei');
    setHumor('tranquilo');
    setPublicacoes('');
    setStatus('resgatado');
    setObservacoes('');
    setTentouSalvar(false);
  }

  async function onSalvar() {
    const pendentesAgora = [
      ...(!fotoUri ? ['foto do animal'] : []),
      ...(!nome.trim() ? ['nome'] : []),
      ...datasPendentes,
    ];
    setTentouSalvar(true);
    setSucesso(undefined);
    setErroSalvar(undefined);

    if (pendentesAgora.length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSalvando(true);
    try {
      await saveAnimal({
        id: novoId(),
        nome: nome.trim() || 'Sem nome',
        raca: raca.trim(),
        especie,
        sexo,
        porte,
        peso: peso.trim(),
        idadeAproximada: idadeAproximada.trim(),
        corPelagem: corPelagem.trim(),
        dataResgate: dataResgate.trim() || hojeBr(),
        localResgate: localResgate.trim(),
        condicaoChegada,
        castrado,
        vacinado:
          v10Doses.some((dose) => dose.status === 'sim') ||
          vacinaRaivaDoses.some((dose) => dose.status === 'sim')
            ? 'sim'
            : 'nao',
        vermifugado: vermifugoDoses.some((dose) => dose.status === 'sim')
          ? 'sim'
          : 'nao',
        v10PrimeiraDose: v10Doses[0],
        v10SegundaDose: v10Doses[1],
        vacinaRaiva: vacinaRaivaDoses[0],
        v10Doses: v10Doses.map((dose) => ({
          ...dose,
          data: dose.data?.trim() || undefined,
        })),
        vacinaRaivaDoses: vacinaRaivaDoses.map((dose) => ({
          ...dose,
          data: dose.data?.trim() || undefined,
        })),
        vermifugoDoses: vermifugoDoses.map((dose) => ({
          ...dose,
          data: dose.data?.trim() || undefined,
        })),
        temperamento,
        nivelEnergia,
        compativelCriancas,
        compativelAnimais,
        compativelApartamento,
        humor,
        publicacoes: publicacoes.trim(),
        observacoes: observacoes.trim(),
        fotoUri,
        status,
        createdAt: new Date().toISOString(),
      });

      const nomeSalvo = nome.trim() || 'O animal';
      limpar();
      setSucesso(`${nomeSalvo} foi cadastrado.`);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch {
      setErroSalvar('Não deu para salvar. Tente novamente em instantes.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1 bg-cream"
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-form self-center gap-5 px-5 pb-8 pt-6" style={styles.content}>
          <View className="gap-1.5 pt-[18px]" style={styles.header}>
            <Text className="font-heading-bold text-2xl leading-[30px] text-ink" style={styles.title}>
              Cadastro de animal
            </Text>
            <Text className="font-body text-base leading-6 text-ink-muted" style={styles.subtitle}>
              Registre um resgate agora, ainda no campo ou no abrigo.
            </Text>
          </View>

          {pendentes.length > 0 ? (
            <View className="gap-1 rounded-2xl border border-danger bg-danger-soft p-3.5" style={[styles.feedback, styles.feedbackError]}>
              <Text className="font-body-medium text-[15px] leading-5 text-danger" style={styles.feedbackErrorText}>
                Falta preencher
              </Text>
              {pendentes.map((item) => (
                <Text key={item} className="font-body-medium text-sm leading-5 text-danger" style={styles.feedbackErrorText}>
                  • {item}
                </Text>
              ))}
            </View>
          ) : null}

          {sucesso ? (
            <View className="rounded-2xl border border-success bg-success-soft p-3.5" style={[styles.feedback, styles.feedbackSuccess]}>
              <Text className="font-body-medium text-[15px] leading-5 text-success" style={styles.feedbackSuccessText}>
                {sucesso}
              </Text>
            </View>
          ) : null}

          {erroSalvar ? (
            <View className="rounded-2xl border border-danger bg-danger-soft p-3.5" style={[styles.feedback, styles.feedbackError]}>
              <Text className="font-body-medium text-[15px] leading-5 text-danger" style={styles.feedbackErrorText}>
                {erroSalvar}
              </Text>
            </View>
          ) : null}

          <FotoPicker
            uri={fotoUri}
            erro={fotoErro}
            onChange={(uri) => {
              setFotoUri(uri);
              setSucesso(undefined);
            }}
          />

          <View className="gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm" style={styles.card}>
            <Text className="font-heading-medium text-xl leading-7 text-orange-dark" style={styles.section}>Quem é</Text>
            <PrimaryInputText
              label="Nome"
              value={nome}
              onChangeText={(texto) => {
                setNome(texto);
                setSucesso(undefined);
              }}
              placeholder="Como o animal vai ser chamado"
              erro={nomeErro}
            />
            <PrimaryInputText
              label="Raça"
              value={raca}
              onChangeText={setRaca}
              placeholder="Ex.: sem raça definida"
            />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Espécie</Text>
            <PrimaryChipGroup
              value={especie}
              onChange={setEspecie}
              options={[
                { value: 'cao', label: 'Cão' },
                { value: 'gato', label: 'Gato' },
              ]}
            />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Sexo</Text>
            <PrimaryChipGroup
              value={sexo}
              onChange={setSexo}
              options={[
                { value: 'macho', label: 'Macho' },
                { value: 'femea', label: 'Fêmea' },
              ]}
            />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Porte</Text>
            <PrimaryChipGroup
              value={porte}
              onChange={setPorte}
              options={[
                { value: 'pequeno', label: 'Pequeno' },
                { value: 'medio', label: 'Médio' },
                { value: 'grande', label: 'Grande' },
              ]}
            />
            <PrimaryInputText
              label="Idade aproximada"
              value={idadeAproximada}
              onChangeText={setIdadeAproximada}
              placeholder="Ex.: filhote, 2 anos, idoso"
            />
            <PrimaryInputText
              label="Peso"
              value={peso}
              onChangeText={setPeso}
              placeholder="Ex.: 12 kg"
              keyboardType="decimal-pad"
            />
            <PrimaryInputText
              label="Cor / pelagem"
              value={corPelagem}
              onChangeText={setCorPelagem}
              placeholder="Ex.: caramelo, preto e branco"
            />
          </View>

          <View className="gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm" style={styles.card}>
            <Text className="font-heading-medium text-xl leading-7 text-orange-dark" style={styles.section}>Resgate</Text>
            <PrimaryInputText
              label="Data do resgate"
              value={dataResgate}
              onChangeText={setDataResgate}
              placeholder="DD/MM/AAAA"
            />
            <PrimaryInputText
              label="Local do resgate"
              value={localResgate}
              onChangeText={setLocalResgate}
              placeholder="Rua, bairro ou ponto de referência"
            />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Condição na chegada</Text>
            <PrimaryChipGroup
              value={condicaoChegada}
              onChange={setCondicaoChegada}
              options={[
                { value: 'saudavel', label: 'Saudável' },
                { value: 'ferido', label: 'Ferido' },
                { value: 'debilitado', label: 'Debilitado' },
              ]}
            />
          </View>

          <View className="gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm" style={styles.card}>
            <Text className="font-heading-medium text-xl leading-7 text-orange-dark" style={styles.section}>Saúde</Text>
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Castrado</Text>
            <PrimaryChipGroup
              value={castrado}
              onChange={setCastrado}
              options={[
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
            {v10Doses.map((dose, index) => (
              <DoseField
                key={`v10-${index}`}
                label={`Vacina V10 — ${index + 1}ª dose`}
                dose={dose}
                onChange={(nextDose) =>
                  setV10Doses((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? nextDose : item,
                    ),
                  )
                }
                onRemove={
                  index >= 1
                    ? () =>
                        setV10Doses((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                    : undefined
                }
                erro={
                  tentouSalvar && dose.status === 'sim' && !dose.data?.trim()
                    ? 'Informe a data da aplicação.'
                    : undefined
                }
              />
            ))}
            <PrimaryButton
              title="Adicionar dose da V10"
              size="sm"
              fullWidth={false}
              color="transparent"
              textColor={palette.denim}
              onPress={() =>
                setV10Doses((current) => [...current, { status: 'nao' }])
              }
            />
            {vacinaRaivaDoses.map((dose, index) => (
              <DoseField
                key={`raiva-${index}`}
                label={`Vacina antirrábica — ${index + 1}ª dose`}
                dose={dose}
                onChange={(nextDose) =>
                  setVacinaRaivaDoses((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? nextDose : item,
                    ),
                  )
                }
                onRemove={
                  index >= 1
                    ? () =>
                        setVacinaRaivaDoses((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                    : undefined
                }
                erro={
                  tentouSalvar && dose.status === 'sim' && !dose.data?.trim()
                    ? 'Informe a data da aplicação.'
                    : undefined
                }
              />
            ))}
            <PrimaryButton
              title="Adicionar dose antirrábica"
              size="sm"
              fullWidth={false}
              color="transparent"
              textColor={palette.denim}
              onPress={() =>
                setVacinaRaivaDoses((current) => [
                  ...current,
                  { status: 'nao' },
                ])
              }
            />
            {vermifugoDoses.map((dose, index) => (
              <DoseField
                key={`vermifugo-${index}`}
                label={`Vermífugo — ${index + 1}ª dose`}
                dose={dose}
                onChange={(nextDose) =>
                  setVermifugoDoses((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? nextDose : item,
                    ),
                  )
                }
                onRemove={
                  index >= 1
                    ? () =>
                        setVermifugoDoses((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                    : undefined
                }
                erro={
                  tentouSalvar && dose.status === 'sim' && !dose.data?.trim()
                    ? 'Informe a data da aplicação.'
                    : undefined
                }
              />
            ))}
            <PrimaryButton
              title="Adicionar dose de vermífugo"
              size="sm"
              fullWidth={false}
              color="transparent"
              textColor={palette.denim}
              onPress={() =>
                setVermifugoDoses((current) => [
                  ...current,
                  { status: 'nao' },
                ])
              }
            />
          </View>

          <View className="gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm" style={styles.card}>
            <Text className="font-heading-medium text-xl leading-7 text-orange-dark" style={styles.section}>Temperamento</Text>
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Como o animal está</Text>
            <PrimaryChipGroup
              value={temperamento}
              onChange={setTemperamento}
              options={[
                { value: 'docil', label: 'Dócil' },
                { value: 'medroso', label: 'Medroso' },
                { value: 'sociavel', label: 'Sociável' },
                { value: 'agressivo', label: 'Agressivo' },
              ]}
            />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Nível de energia</Text>
            <PrimaryChipGroup
              value={nivelEnergia}
              onChange={setNivelEnergia}
              options={[
                { value: 'baixo', label: 'Baixo' },
                { value: 'moderado', label: 'Moderado' },
                { value: 'alto', label: 'Alto' },
              ]}
            />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Humor</Text>
            <PrimaryChipGroup
              value={humor}
              onChange={setHumor}
              options={[
                { value: 'tranquilo', label: 'Tranquilo' },
                { value: 'brincalhao', label: 'Brincalhão' },
                { value: 'assustado', label: 'Assustado' },
              ]}
            />
          </View>

          <View className="gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm" style={styles.card}>
            <Text className="font-heading-medium text-xl leading-7 text-orange-dark" style={styles.section}>Compatibilidade</Text>
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Com crianças</Text>
            <PrimaryChipGroup value={compativelCriancas} onChange={setCompativelCriancas} options={triStateOptions} />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Com outros animais</Text>
            <PrimaryChipGroup value={compativelAnimais} onChange={setCompativelAnimais} options={triStateOptions} />
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Para apartamento</Text>
            <PrimaryChipGroup value={compativelApartamento} onChange={setCompativelApartamento} options={triStateOptions} />
          </View>

          <View className="gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm" style={styles.card}>
            <Text className="font-heading-medium text-xl leading-7 text-orange-dark" style={styles.section}>Acompanhamento</Text>
            <Text className="font-body-medium text-sm leading-4 text-ink" style={styles.fieldLabel}>Status do animal</Text>
            <PrimaryChipGroup
              value={status}
              onChange={setStatus}
              options={[
                { value: 'resgatado', label: 'Resgatado' },
                { value: 'em_tratamento', label: 'Em tratamento' },
                { value: 'disponivel', label: 'Disponível' },
                { value: 'adotado', label: 'Adotado' },
              ]}
            />
            <PrimaryInputText
              label="Fotos e publicações"
              value={publicacoes}
              onChangeText={setPublicacoes}
              placeholder="Links ou referências de publicações sobre o animal"
              multiline
            />
            <PrimaryInputText
              label="Observações"
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Ferimentos, coleira, algo que a equipe precise saber"
              multiline
            />
          </View>

          <PrimaryButton
            title="Salvar cadastro"
            loading={salvando}
            onPress={() => void onSalvar()}
            size="lg"
          />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const triStateOptions = [
  { value: 'sim' as const, label: 'Sim' },
  { value: 'nao' as const, label: 'Não' },
  { value: 'nao_sei' as const, label: 'Não sei' },
];
