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
    <SafeAreaView className="flex-1" edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1 bg-cream"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="px-5 pb-8 gap-[18px]"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-[18px] gap-1.5">
            <Text className="text-[26px] font-extrabold text-ink">
              Cadastro de animal
            </Text>
            <Text className="text-[15px] leading-[22px] text-ink-muted">
              Registre um resgate agora, ainda no campo ou no abrigo.
            </Text>
          </View>

          {pendentes.length > 0 ? (
            <View className="bg-danger-soft rounded-2xl p-3.5 gap-1 border border-danger">
              <Text className="text-[15px] font-extrabold text-danger">
                Falta preencher
              </Text>
              {pendentes.map((item) => (
                <Text key={item} className="text-sm font-semibold text-danger">
                  • {item}
                </Text>
              ))}
            </View>
          ) : null}

          {sucesso ? (
            <View className="bg-success-soft rounded-2xl p-3.5 border border-success">
              <Text className="text-[15px] font-extrabold text-success">
                {sucesso}
              </Text>
            </View>
          ) : null}

          {erroSalvar ? (
            <View className="bg-danger-soft rounded-2xl p-3.5 gap-1 border border-danger">
              <Text className="text-[15px] font-extrabold text-danger">
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

          <View className="bg-card rounded-[20px] p-4 gap-3 border border-line">
            <Text className="text-base font-extrabold text-orange-dark">
              Quem é
            </Text>
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
            <Text className="text-[13px] font-bold text-ink">Espécie</Text>
            <PrimaryChipGroup
              value={especie}
              onChange={setEspecie}
              options={[
                { value: 'cao', label: 'Cão' },
                { value: 'gato', label: 'Gato' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
            <Text className="text-[13px] font-bold text-ink">Sexo</Text>
            <PrimaryChipGroup
              value={sexo}
              onChange={setSexo}
              options={[
                { value: 'macho', label: 'Macho' },
                { value: 'femea', label: 'Fêmea' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
            <Text className="text-[13px] font-bold text-ink">Porte</Text>
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

          <View className="bg-card rounded-[20px] p-4 gap-3 border border-line">
            <Text className="text-base font-extrabold text-orange-dark">
              Resgate
            </Text>
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
            <Text className="text-[13px] font-bold text-ink">
              Condição na chegada
            </Text>
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

          <View className="bg-card rounded-[20px] p-4 gap-3 border border-line">
            <Text className="text-base font-extrabold text-orange-dark">
              Saúde
            </Text>
            <Text className="text-[13px] font-bold text-ink">Castrado</Text>
            <PrimaryChipGroup
              value={castrado}
              onChange={setCastrado}
              options={[
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
            <Text className="text-[13px] font-bold text-ink">Vacinado</Text>
            <PrimaryChipGroup
              value={vacinado}
              onChange={setVacinado}
              options={[
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
                { value: 'nao_sei', label: 'Não sei' },
              ]}
            />
            <Text className="text-[13px] font-bold text-ink">Vermifugado</Text>
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

          <View className="bg-card rounded-[20px] p-4 gap-3 border border-line">
            <Text className="text-base font-extrabold text-orange-dark">
              Temperamento
            </Text>
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
            accessibilityRole="button"
            className={`bg-orange rounded-2xl py-4 items-center ${
              salvando ? 'opacity-55' : 'active:opacity-90'
            }`}
          >
            <Text className="text-white text-base font-extrabold">
              {salvando ? 'Salvando...' : 'Salvar cadastro'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
