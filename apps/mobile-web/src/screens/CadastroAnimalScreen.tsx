import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryInputText } from '@/components/inputText/primary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import { FotoPicker } from '@/components/photoPicker/profile';
import { saveAnimal } from '@/storage/animals';
import { palette } from '@/theme/colors';
import type {
  CondicaoChegada,
  Especie,
  Porte,
  Sexo,
  TriState,
} from '@/types/animal';
import { hojeBr } from '@kapa/shared/utils';

function novoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CadastroAnimalScreen() {
  const [fotoUri, setFotoUri] = useState<string>();
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<Especie>('cao');
  const [sexo, setSexo] = useState<Sexo>('nao_sei');
  const [porte, setPorte] = useState<Porte>('medio');
  const [idadeAproximada, setIdadeAproximada] = useState('');
  const [corPelagem, setCorPelagem] = useState('');
  const [dataResgate, setDataResgate] = useState(hojeBr);
  const [localResgate, setLocalResgate] = useState('');
  const [condicaoChegada, setCondicaoChegada] =
    useState<CondicaoChegada>('saudavel');
  const [castrado, setCastrado] = useState<TriState>('nao_sei');
  const [vacinado, setVacinado] = useState<TriState>('nao_sei');
  const [vermifugado, setVermifugado] = useState<TriState>('nao_sei');
  const [temperamento, setTemperamento] = useState('');
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
  const pendentes = [
    ...(fotoErro ? ['foto do animal'] : []),
    ...(nomeErro ? ['nome'] : []),
  ];

  function limpar() {
    setFotoUri(undefined);
    setNome('');
    setEspecie('cao');
    setSexo('nao_sei');
    setPorte('medio');
    setIdadeAproximada('');
    setCorPelagem('');
    setDataResgate(hojeBr());
    setLocalResgate('');
    setCondicaoChegada('saudavel');
    setCastrado('nao_sei');
    setVacinado('nao_sei');
    setVermifugado('nao_sei');
    setTemperamento('');
    setObservacoes('');
    setTentouSalvar(false);
  }

  async function onSalvar() {
    const pendentesAgora = [
      ...(!fotoUri ? ['foto do animal'] : []),
      ...(!nome.trim() ? ['nome'] : []),
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
        especie,
        sexo,
        porte,
        idadeAproximada: idadeAproximada.trim(),
        corPelagem: corPelagem.trim(),
        dataResgate: dataResgate.trim() || hojeBr(),
        localResgate: localResgate.trim(),
        condicaoChegada,
        castrado,
        vacinado,
        vermifugado,
        temperamento: temperamento.trim(),
        observacoes: observacoes.trim(),
        fotoUri,
        status: 'resgatado',
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
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Cadastro de animal</Text>
            <Text style={styles.subtitle}>
              Registre um resgate agora, ainda no campo ou no abrigo.
            </Text>
          </View>

          {pendentes.length > 0 ? (
            <View style={styles.aviso}>
              <Text style={styles.avisoTitulo}>Falta preencher</Text>
              {pendentes.map((item) => (
                <Text key={item} style={styles.avisoItem}>
                  • {item}
                </Text>
              ))}
            </View>
          ) : null}

          {sucesso ? (
            <View style={styles.ok}>
              <Text style={styles.okTexto}>{sucesso}</Text>
            </View>
          ) : null}

          {erroSalvar ? (
            <View style={styles.aviso}>
              <Text style={styles.avisoTitulo}>{erroSalvar}</Text>
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

          <View style={styles.card}>
            <Text style={styles.section}>Quem é</Text>
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
            <Text style={styles.fieldLabel}>Espécie</Text>
            <PrimaryChipGroup
              value={especie}
              onChange={setEspecie}
              options={[
                { value: 'cao', label: 'Cão' },
                { value: 'gato', label: 'Gato' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
            <Text style={styles.fieldLabel}>Sexo</Text>
            <PrimaryChipGroup
              value={sexo}
              onChange={setSexo}
              options={[
                { value: 'macho', label: 'Macho' },
                { value: 'femea', label: 'Fêmea' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
            <Text style={styles.fieldLabel}>Porte</Text>
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
              label="Cor / pelagem"
              value={corPelagem}
              onChangeText={setCorPelagem}
              placeholder="Ex.: caramelo, preto e branco"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Resgate</Text>
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
            <Text style={styles.fieldLabel}>Condição na chegada</Text>
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

          <View style={styles.card}>
            <Text style={styles.section}>Saúde</Text>
            <Text style={styles.fieldLabel}>Castrado</Text>
            <PrimaryChipGroup
              value={castrado}
              onChange={setCastrado}
              options={[
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
            <Text style={styles.fieldLabel}>Vacinado</Text>
            <PrimaryChipGroup
              value={vacinado}
              onChange={setVacinado}
              options={[
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
            <Text style={styles.fieldLabel}>Vermifugado</Text>
            <PrimaryChipGroup
              value={vermifugado}
              onChange={setVermifugado}
              options={[
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Temperamento</Text>
            <PrimaryInputText
              label="Como o animal está"
              value={temperamento}
              onChangeText={setTemperamento}
              placeholder="Dócil, medroso, sociável com outros animais..."
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

          <Pressable
            onPress={() => void onSalvar()}
            disabled={salvando}
            style={[styles.save, salvando && styles.saveDisabled]}
          >
            <Text style={styles.saveText}>
              {salvando ? 'Salvando...' : 'Salvar cadastro'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
  },
  header: {
    paddingTop: 18,
    gap: 6,
  },
  title: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  section: {
    color: palette.orangeDark,
    fontSize: 16,
    fontWeight: '800',
  },
  fieldLabel: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  save: {
    backgroundColor: palette.orange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.55,
  },
  saveText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  aviso: {
    backgroundColor: palette.dangerSoft,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: palette.danger,
  },
  avisoTitulo: {
    color: palette.danger,
    fontSize: 15,
    fontWeight: '800',
  },
  avisoItem: {
    color: palette.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  ok: {
    backgroundColor: palette.success,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.success,
  },
  okTexto: {
    color: palette.success,
    fontSize: 15,
    fontWeight: '800',
  },
});
