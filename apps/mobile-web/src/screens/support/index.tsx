import { PrimaryCard } from '@/components/cards/primary';
import { PrimaryMenuItem } from '@/components/menuItems/primary';
import { palette } from '@/theme';
import {
  BedIcon,
  CaretDownIcon,
  CaretUpIcon,
  HandHeartIcon,
  HeartIcon,
  QrCodeIcon,
  QuestionIcon,
  ReceiptIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  View,
  Text,
  Platform,
  Pressable,
} from 'react-native';
import { FAQ_SUPPORT_ITEMS } from '@kapa/shared'

export function SupportScreen() {
  const [currentQuestion, setCurrentQuestion] = useState<number>();
  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.cream }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 20 }}
    >
      <View className="-mx-4 relative">
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1763718170991-baa67106743b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGRvZ3xlbnwwfHwwfHx8MA%3D%3D',
          }}
          className="w-full h-[12rem] md:h-[20rem] object-cover"
        />

        <View className="z-20 absolute bottom-4 left-4">
          <Text className="font-heading font-bold text-orange text-xl md:text-3xl">
            Apoie a Kapa
          </Text>
          <Text className="font-body text-base md:text-lg text-peach">
            Juntos transformamos vidas desde 2002.
          </Text>
        </View>

        <View className="absolute left-0 bottom-0 w-full h-full bg-[#12121260]" />
      </View>

      <View className="flex-row flex-wrap items-stretch gap-4">
        <PrimaryCard className="p-4 gap-2 w-full md:flex-1 md:w-auto">
          <View className="bg-orange-100 size-10 md:size-12 rounded-full flex items-center justify-center">
            <QrCodeIcon
              size={Platform.OS === 'web' ? 25 : 20}
              color={palette.orangeDark}
            />
          </View>
          <View>
            <Text className="font-heading font-bold text-orange-dark text-lg md:text-xl">
              Doar via PIX
            </Text>

            <Text className="font-body text-ink-muted font-medium text-lg">
              Ajude com qualquer valor
            </Text>
          </View>
        </PrimaryCard>
        <PrimaryCard className="p-4 gap-3 flex-1 min-w-[140px] justify-between">
          <View className="bg-blue-100 size-10 md:size-12 rounded-full flex items-center justify-center">
            <HandHeartIcon
              size={Platform.OS === 'web' ? 25 : 20}
              color={palette.denim}
              weight="bold"
            />
          </View>
          <View className="gap-1">
            <Text className="font-heading font-bold text-denim text-lg md:text-xl">
              Ser Voluntário
            </Text>

            <Text className="font-body text-ink-muted font-medium text-sm md:text-base">
              Doe seu tempo
            </Text>
          </View>
        </PrimaryCard>
        <PrimaryCard className="p-4 gap-3 flex-1 min-w-[140px] justify-between">
          <View className="bg-zinc-200 size-10 md:size-12 rounded-full flex items-center justify-center">
            <BedIcon
              size={Platform.OS === 'web' ? 25 : 20}
              color={'#71717B'}
              weight="bold"
            />
          </View>
          <View className="gap-1">
            <Text className="font-heading font-bold text-zinc-500 text-lg md:text-xl">
              Lar Temporário
            </Text>

            <Text className="font-body text-ink-muted font-medium text-sm md:text-base">
              Acolha com amor
            </Text>
          </View>
        </PrimaryCard>
      </View>

      <View className="bg-denim p-4 rounded-md max-w-lg mx-auto my-4">
        <Text className="flex gap-2 items-center text-lg md:text-xl font-heading font-bold text-cream">
          <HeartIcon color={palette.cream} weight="fill" /> 20 anos de História
        </Text>

        <View className="flex-row items-center justify-center w-full gap-2 md:gap-4 mt-3">
          <View className="flex-1">
            <Text className="font-body font-bold text-cream text-2xl md:text-3xl">
              5k+
            </Text>
            <Text className="font-body text-[#D2E4FF] md:text-lg">
              Animais resgatados e cuidados
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-body font-bold text-cream text-2xl md:text-3xl">
              3k+
            </Text>
            <Text className="font-body text-[#D2E4FF] md:text-lg">
              Adoções responsáveis realizadas
            </Text>
          </View>
        </View>
        <Text className="font-body text-[#D2E4FF] text-xs md:text-base mx-auto mt-4">
          Primeira ONG regularizada de Mogi-Guaçu
        </Text>
      </View>

      <PrimaryMenuItem
        label="Transparência"
        description="Veja nossos relatórios financeiros"
        labelColor="text-denim"
        icon={ReceiptIcon}
        iconColor={palette.ink}
        iconBgColor={palette.cream}
      />

      <View>
        <View className="flex-row items-center gap-2.5 my-4">
          <QuestionIcon weight="bold" color={palette.orangeDark} size={28} />
          <Text className="text-denim font-heading font-bold text-xl md:text-2xl">
            Dúvidas Frequentes
          </Text>
        </View>
        <View className="flex-col gap-4">
          {FAQ_SUPPORT_ITEMS.map((faq, index) => {
            const isCurrent = currentQuestion === index;

            return (
              <Pressable
                key={index}
                onPress={() =>
                  setCurrentQuestion(
                    currentQuestion === index ? undefined : index,
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={faq.question}
                accessibilityState={{ expanded: isCurrent }}
              >
                <PrimaryCard className="p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 font-heading font-medium text-ink text-base md:text-lg">
                      {faq.question}
                    </Text>
                    {isCurrent ? (
                      <CaretUpIcon
                        size={20}
                        color={palette.orangeDark}
                        weight="bold"
                      />
                    ) : (
                      <CaretDownIcon
                        size={20}
                        color={palette.inkMuted}
                        weight="bold"
                      />
                    )}
                  </View>
                  {isCurrent && (
                    <Text className="font-body text-ink-muted text-sm leading-relaxed mt-3 pt-3 border-t border-line/60">
                      {faq.answer}
                    </Text>
                  )}
                </PrimaryCard>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
