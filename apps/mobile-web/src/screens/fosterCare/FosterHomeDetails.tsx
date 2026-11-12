import { Text, View } from 'react-native';
import type { FosterApplication } from '@/services/fosterApplications';

export const fosterHomeQuestions = {
  hasOtherAnimals: 'Há outros animais na casa?',
  hasPerimeterBarrier: 'O imóvel tem muro ou cerca em todo o perímetro?',
  hasSecureGate: 'O portão fecha completamente, sem vãos por onde o animal possa escapar?',
} as const;

export const fosterHomeQuestionKeys = [
  'hasOtherAnimals', 'hasPerimeterBarrier', 'hasSecureGate',
] as const satisfies readonly (keyof typeof fosterHomeQuestions)[];

type HomeDetails = Pick<FosterApplication,
  'availability' | 'homeAddress' | 'homeNotes' | (typeof fosterHomeQuestionKeys)[number]
>;

export function FosterHomeDetails({ application }: { application: HomeDetails }) {
  return (
    <View className="gap-4">
      <View className="gap-4 rounded-xl bg-cream p-4 md:flex-row">
        <View className="gap-1 md:flex-1">
          <Text className="font-body-bold text-xs uppercase text-denim">Disponibilidade</Text>
          <Text className="font-body leading-6 text-ink">{application.availability}</Text>
        </View>
        <View className="gap-1 md:flex-[2]">
          <Text className="font-body-bold text-xs uppercase text-denim">Endereço da casa</Text>
          <Text className="font-body leading-6 text-ink">{application.homeAddress ?? 'Não informado'}</Text>
        </View>
      </View>
      <View className="gap-3 rounded-xl border border-line p-4">
        <Text accessibilityRole="header" className="font-heading-bold text-base text-ink">Condições da casa</Text>
        {fosterHomeQuestionKeys.map((key) => {
          const answer = application[key];
          return (
            <View key={key} className="flex-row items-center justify-between gap-3 border-t border-line pt-3">
              <Text className="flex-1 font-body text-sm leading-5 text-ink">{fosterHomeQuestions[key]}</Text>
              <View className={`rounded-full px-3 py-1.5 ${answer === null ? 'bg-cream' : 'bg-peach'}`}>
                <Text className="font-body-medium text-xs text-denim">
                  {answer === null ? 'Não informado' : answer ? 'Sim' : 'Não'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <View className="gap-1 rounded-xl bg-cream p-4">
        <Text className="font-body-bold text-xs uppercase text-denim">Espaço de acolhimento</Text>
        <Text className="font-body leading-6 text-ink">{application.homeNotes}</Text>
      </View>
    </View>
  );
}
