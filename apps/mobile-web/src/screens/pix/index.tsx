import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeftIcon,
  BankIcon,
  CheckIcon,
  CopyIcon,
  HeartIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import { PrimaryCard } from '@/components/cards/primary';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryChip } from '@/components/chips/primaryChip';
import { palette } from '@/theme';

export const PIX_CONFIG = {
  keyType: 'CNPJ',
  keyValue: '12.345.678/0001-90',
  recipientName: 'Associação Kapa Protetores de Animais',
  bankName: 'Banco Cooperativo Sicredi / Cora SCD',
  city: 'São Paulo - SP',
  suggestedAmounts: [10, 25, 50, 100],
} as const;

export function PixScreen() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyPix = async () => {
    try {
      await Clipboard.setStringAsync(PIX_CONFIG.keyValue);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback para navegadores sem permissão de clipboard nativo
      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(PIX_CONFIG.keyValue);
        setCopied(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
      }
    }
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.cream }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 48,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between pt-2">
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) {
              router.back();
            } else {
              router.replace('/support');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          hitSlop={12}
          className="flex-row items-center gap-2 p-2 -ml-2 rounded-full active:bg-orange-100"
        >
          <ArrowLeftIcon size={24} color={palette.ink} weight="bold" />
          <Text className="font-heading font-bold text-ink text-base">
            Voltar
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-1.5 bg-peach px-3 py-1.5 rounded-full">
          <HeartIcon size={16} color={palette.orange} weight="fill" />
          <Text className="font-body text-xs font-semibold text-orange-dark">
            Apoio Direto
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="font-heading font-bold text-2xl md:text-3xl text-ink">
          Doar via PIX
        </Text>
        <Text className="font-body text-sm md:text-base text-ink-muted">
          100% da sua doação é convertida em ração, abrigo e atendimento
          veterinário para os animais resgatados.
        </Text>
      </View>

      <PrimaryCard className="p-4 gap-3 bg-white">
        <View className="flex-row items-center gap-2">
          <SparkleIcon size={18} color={palette.orange} weight="fill" />
          <Text className="font-heading font-semibold text-base text-ink">
            Escolha o valor da sua contribuição
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {PIX_CONFIG.suggestedAmounts.map((amount) => {
            const isSelected = selectedAmount === amount;
            return (
              <PrimaryChip
                key={amount}
                label={`R$ ${amount}`}
                selected={isSelected}
                onPress={() => setSelectedAmount(isSelected ? null : amount)}
              />
            );
          })}
        </View>

        {selectedAmount !== null && (
          <Text className="font-body text-xs text-orange-dark font-medium bg-peach/40 p-2 rounded-md">
            Com R$ {selectedAmount}, você ajuda a alimentar até{' '}
            {Math.max(1, Math.round(selectedAmount / 5))} animais por um dia!
          </Text>
        )}
      </PrimaryCard>

      <PrimaryCard className="p-4 gap-4 bg-white border border-peach/50">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-body text-xs uppercase tracking-wider text-ink-muted font-bold">
              Chave PIX Oficial ({PIX_CONFIG.keyType})
            </Text>
            <Text
              className="font-heading font-bold text-lg md:text-xl text-ink mt-0.5 select-all"
              selectable
            >
              {PIX_CONFIG.keyValue}
            </Text>
          </View>

          <View className="size-10 rounded-full bg-orange-100 items-center justify-center">
            <QrCodeIcon size={22} color={palette.orangeDark} weight="bold" />
          </View>
        </View>

        <PrimaryButton
          title={copied ? 'Chave Copiada com Sucesso!' : 'Copiar Chave PIX'}
          icon={
            copied ? (
              <CheckIcon size={20} color={palette.white} weight="bold" />
            ) : (
              <CopyIcon size={20} color={palette.white} weight="bold" />
            )
          }
          className={
            copied
              ? 'bg-success active:bg-success'
              : 'bg-orange active:bg-orange-dark'
          }
          color={copied ? palette.success : palette.orange}
          pressedColor={copied ? palette.success : palette.orangeDark}
          onPress={handleCopyPix}
          accessibilityLabel="Copiar chave PIX para a área de transferência"
        />
      </PrimaryCard>

      <PrimaryCard className="p-4 gap-3 bg-white">
        <View className="flex-row items-center gap-2">
          <ShieldCheckIcon size={20} color={palette.denim} weight="bold" />
          <Text className="font-heading font-semibold text-base text-denim">
            Confirme os dados antes de transferir
          </Text>
        </View>

        <View className="gap-2 pt-1 border-t border-peach/40">
          <View className="flex-row justify-between items-center py-1">
            <Text className="font-body text-xs text-ink-muted">Favorecido</Text>
            <Text className="font-body text-xs font-semibold text-ink text-right flex-1 ml-4">
              {PIX_CONFIG.recipientName}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-1">
            <Text className="font-body text-xs text-ink-muted">CNPJ</Text>
            <Text className="font-body text-xs font-semibold text-ink">
              {PIX_CONFIG.keyValue}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-1">
            <Text className="font-body text-xs text-ink-muted">
              Instituição
            </Text>
            <View className="flex-row items-center gap-1">
              <BankIcon size={14} color={palette.inkMuted} />
              <Text className="font-body text-xs font-semibold text-ink">
                {PIX_CONFIG.bankName}
              </Text>
            </View>
          </View>
        </View>
      </PrimaryCard>

      <PrimaryCard className="p-4 gap-2.5 bg-peach/30 border border-peach/60">
        <Text className="font-heading font-semibold text-sm text-orange-dark">
          Como doar pelo seu aplicativo bancário:
        </Text>
        <Text className="font-body text-xs text-ink-muted leading-relaxed">
          1. Toque em{' '}
          <Text className="font-bold text-ink">Copiar Chave PIX</Text> acima.
          {'\n'}
          2. Abra o aplicativo do seu banco ou carteira digital.{'\n'}
          3. Acesse a área <Text className="font-bold text-ink">PIX</Text> e
          selecione transferência por CNPJ.{'\n'}
          4. Cole a chave, confirme o nome da KAPA e finalize a doação.
        </Text>
      </PrimaryCard>
    </ScrollView>
  );
}
