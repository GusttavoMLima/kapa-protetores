import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'phosphor-react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryInputText } from '@/components/inputText/primary';
import { saveVolunteer } from '@/storage/volunteers';
import { palette } from '@/theme';
import { styles } from './styles';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CadastroVoluntarioScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: 'success' | 'error'; message: string } | undefined
  >();

  const nomeError = attempted && !nome.trim() ? 'Informe o nome completo.' : undefined;
  const emailError =
    attempted && !emailPattern.test(email.trim())
      ? 'Informe um e-mail válido.'
      : undefined;
  const telefoneError =
    attempted && telefone.replace(/\D/g, '').length < 10
      ? 'Informe um telefone com DDD.'
      : undefined;

  function clearForm() {
    setNome('');
    setEmail('');
    setTelefone('');
    setCidade('');
    setObservacoes('');
    setAttempted(false);
  }

  async function handleSave() {
    setAttempted(true);
    setFeedback(undefined);
    if (!nome.trim() || !emailPattern.test(email.trim()) || telefone.replace(/\D/g, '').length < 10) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSaving(true);
    try {
      await saveVolunteer({
        id: newId(),
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        cidade: cidade.trim(),
        observacoes: observacoes.trim(),
        createdAt: new Date().toISOString(),
      });
      const firstName = nome.trim().split(/\s+/)[0];
      clearForm();
      setFeedback({ kind: 'success', message: `${firstName}, seu cadastro foi salvo.` });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch {
      setFeedback({ kind: 'error', message: 'Não foi possível salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Heart size={28} weight="fill" color={palette.orange} />
            </View>
            <Text style={styles.title}>Cadastrar voluntário</Text>
            <Text style={styles.subtitle}>Registre os dados básicos da pessoa voluntária.</Text>
          </View>

          {feedback ? (
            <View style={[styles.feedback, feedback.kind === 'error' && styles.feedbackError]} accessibilityLiveRegion="polite">
              <Text style={[styles.feedbackText, feedback.kind === 'error' && styles.feedbackErrorText]}>{feedback.message}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.section}>Seus dados</Text>
            <PrimaryInputText label="Nome completo" value={nome} onChangeText={setNome} placeholder="Seu nome" erro={nomeError} />
            <PrimaryInputText label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" erro={emailError} />
            <PrimaryInputText label="Telefone" value={telefone} onChangeText={setTelefone} placeholder="(00) 00000-0000" keyboardType="phone-pad" maxLength={16} erro={telefoneError} />
            <PrimaryInputText label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Onde você mora" />
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Informações adicionais</Text>
            <PrimaryInputText label="Observações" value={observacoes} onChangeText={setObservacoes} placeholder="Algo mais que a equipe deva saber" multiline />
          </View>

          <Text style={styles.privacy}>Os dados serão usados apenas para organizar o trabalho voluntário da Kapa.</Text>
          <PrimaryButton title="Cadastrar voluntário" loading={saving} onPress={() => void handleSave()} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
