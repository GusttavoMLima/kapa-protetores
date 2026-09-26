import { router } from 'expo-router';
import { ArrowRightIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

export interface SecondaryCardProps {
  icon: {
    component: React.ReactNode;
    backgroundColor: string;
  };
  title: string;
  description: string;
  link: {
    label: string;
    href: string;
    color: string;
  };
}

export const SecondaryCard = (props: SecondaryCardProps) => {
  const { title, description, icon, link } = props;

  return (
    <View className="bg-[#F1EDE9] rounded-md p-4 flex flex-col gap-3.5 w-[17rem] md:w-[20rem]">
      <View
        className="rounded-full p-2 size-[2.75rem] flex items-center justify-center"
        style={{ backgroundColor: icon.backgroundColor }}
      >
        {icon.component}
      </View>
      <Text className="font-bold font-vietnam text-xl">{title}</Text>
      <Text className="font-regular font-body text-base text-[#6B6B6B]">
        {description}
      </Text>
      <Text
        className="font-bold font-body hover:underline flex items-center gap-1"
        onPress={() => router.replace(link.href)}
        style={{ color: link.color }}
      >
        {link.label}
        <ArrowRightIcon size={20} weight="bold" color={link.color} />
      </Text>
    </View>
  );
};
