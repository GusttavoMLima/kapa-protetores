import { type Href, router } from 'expo-router';
import { ArrowRightIcon } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

const LINK_ARROW_ICON_SIZE = 18;

export interface SecondaryCardProps {
  icon: {
    component: ReactNode;
    backgroundColor: string;
  };
  title: string;
  description: string;
  link: {
    label: string;
    href: Href;
    color: string;
  };
}

export function SecondaryCard({
  title,
  description,
  icon,
  link,
}: SecondaryCardProps) {
  const handlePress = () => {
    router.replace(link.href);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title} - ${link.label}`}
      className="bg-white border border-line rounded-2xl p-5 flex-col justify-between gap-4 w-[17.5rem] md:w-[20rem] shadow-card active:scale-[0.99]"
    >
      <View className="gap-3">
        <View
          className="rounded-xl size-12 flex items-center justify-center"
          style={{ backgroundColor: icon.backgroundColor }}
        >
          {icon.component}
        </View>
        <View className="gap-1.5">
          <Text className="font-heading-bold font-bold text-lg text-ink tracking-tight">
            {title}
          </Text>
          <Text className="font-body text-sm text-ink-muted leading-5">
            {description}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1.5 pt-1">
        <Text
          className="font-body-medium font-bold text-sm"
          style={{ color: link.color }}
        >
          {link.label}
        </Text>
        <ArrowRightIcon
          size={LINK_ARROW_ICON_SIZE}
          weight="bold"
          color={link.color}
        />
      </View>
    </Pressable>
  );
}
