import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';
import { PrimaryInputText } from '@/components/inputText/primary';

export const residentialAddressSchema = z.object({
  postalCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'Informe um CEP válido.'),
  street: z.string().trim().min(3, 'Informe a rua.').max(120),
  number: z.string().trim().min(1, 'Informe o número.').max(20),
  neighborhood: z.string().trim().min(2, 'Informe o bairro.').max(120),
  city: z.string().trim().min(2, 'Informe a cidade.').max(120),
});

export type ResidentialAddress = z.infer<typeof residentialAddressSchema>;

const postalCodeResponse = z.object({
  erro: z.union([z.boolean(), z.literal('true')]).optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
});

export function ResidentialAddressFields({
  title = 'Endereço',
  description,
  address,
  onChange,
  errors,
  editable = true,
}: {
  title?: string;
  description?: string;
  address: ResidentialAddress;
  onChange: (fields: Partial<ResidentialAddress>) => void;
  errors?: Partial<Record<keyof ResidentialAddress, string>>;
  editable?: boolean;
}) {
  const [feedback, setFeedback] = useState('');
  const lookup = useRef<AbortController | null>(null);
  useEffect(() => () => lookup.current?.abort(), []);

  async function changePostalCode(value: string) {
    lookup.current?.abort();
    const digits = value.replace(/\D/g, '').slice(0, 8);
    onChange({ postalCode: digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits });
    if (digits.length !== 8) {
      setFeedback('');
      return;
    }
    const request = new AbortController();
    lookup.current = request;
    setFeedback('Buscando endereço...');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: request.signal });
      const result = postalCodeResponse.parse(await response.json());
      if (request.signal.aborted) return;
      if (!response.ok || result.erro) {
        setFeedback('CEP não encontrado. Confira os números e tente novamente.');
        return;
      }
      onChange({ street: result.logradouro ?? '', neighborhood: result.bairro ?? '', city: result.localidade ?? '' });
      setFeedback('Endereço preenchido. Confira o número da residência.');
    } catch {
      if (!request.signal.aborted) setFeedback('Não foi possível buscar o CEP agora. Preencha o endereço manualmente.');
    }
  }

  return (
    <View className="bg-white rounded-2xl border border-line p-5 gap-5">
      <Text accessibilityRole="header" className="font-heading-bold text-lg text-ink">{title}</Text>
      {description ? <Text className="font-body text-sm text-ink-muted">{description}</Text> : null}
      <View className="gap-1">
        <PrimaryInputText label="CEP" value={address.postalCode} onChangeText={(value) => void changePostalCode(value)} placeholder="00000-000" keyboardType="number-pad" erro={errors?.postalCode} editable={editable} />
        {feedback ? <Text accessibilityLiveRegion="polite" className="font-body text-xs text-ink-muted">{feedback}</Text> : null}
      </View>
      <PrimaryInputText label="Rua" value={address.street} onChangeText={(street) => onChange({ street })} placeholder="Nome da rua ou avenida" autoCapitalize="words" maxLength={120} erro={errors?.street} editable={editable} />
      <PrimaryInputText label="Número" value={address.number} onChangeText={(number) => onChange({ number })} placeholder="Ex.: 123" maxLength={20} erro={errors?.number} editable={editable} />
      <PrimaryInputText label="Bairro" value={address.neighborhood} onChangeText={(neighborhood) => onChange({ neighborhood })} placeholder="Seu bairro" autoCapitalize="words" maxLength={120} erro={errors?.neighborhood} editable={editable} />
      <PrimaryInputText label="Cidade" value={address.city} onChangeText={(city) => onChange({ city })} placeholder="Sua cidade" autoCapitalize="words" maxLength={120} erro={errors?.city} editable={editable} />
    </View>
  );
}
