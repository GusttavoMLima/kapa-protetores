import { Redirect, Tabs } from 'expo-router';
import {
  HouseIcon,
  PawPrintIcon,
  UserIcon,
  HeartIcon,
  CalendarBlankIcon,
  HandHeartIcon,
} from 'phosphor-react-native';
import { palette } from '@/theme/colors';
import { DefaultHeader } from '@/components/header/default';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { canUseAdoption, isShelterStaff } from '@/navigation/access';

export default function TabLayout() {
  const { user, hasAdopterProfile, isCheckingProfile } = useAuth();
  const community = canUseAdoption(user?.role);

  if (user?.role === 'adopter') {
    if (hasAdopterProfile === false) {
      return <Redirect href="/(protected)/adopter-profile" />;
    }

    if (hasAdopterProfile === null && isCheckingProfile) {
      return (
        <View className="flex-1 items-center justify-center bg-cream">
          <ActivityIndicator size="large" color="#F18322" />
        </View>
      );
    }
  }

  return (
    <Tabs
      screenOptions={{
        header: () => <DefaultHeader />,

        tabBarActiveTintColor: palette.orange,
        tabBarInactiveTintColor: palette.inkMuted,

        tabBarStyle: {
          backgroundColor: palette.white,

          borderWidth: 0,
          borderTopWidth: 0,
          borderTopColor: 'transparent',

          height: 76,
          paddingBottom: 12,
          paddingTop: 8,

          ...Platform.select({
            web: {
              boxShadow: '0px -1px 11px rgba(18, 18, 18, 0.15)',
            } as const,
            default: {
              shadowColor: '#121212',
              shadowOffset: {
                width: 0,
                height: -1,
              },
              shadowOpacity: 0.15,
              shadowRadius: 10.9,
              elevation: 4,
            },
          }),
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'PlusJakartaSans-Medium',
        },

        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isShelterStaff(user?.role) ? 'Gestão' : 'Início',
          href: user?.role === 'adopter' ? null : '/',
          tabBarIcon: ({ color, size, focused }) => (
            <HouseIcon
              size={size}
              color={color.toString()}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="adopet"
        options={{
          title: 'Adotar',
          href: community ? '/adopet' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <PawPrintIcon
              size={size}
              color={color.toString()}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="support"
        options={{
          title: 'Apoiar',
          href: community ? '/support' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <HeartIcon
              size={size}
              color={color.toString()}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="activities"
        options={{
          title: 'Atividades',
          href: user?.role === 'volunteer' ? '/activities' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <CalendarBlankIcon
              size={size}
              color={color.toString()}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="volunteer"
        options={{
          title: 'Voluntariado',
          href: user?.role === 'adopter' ? '/(protected)/(tabs)/volunteer' : null,
          tabBarIcon: ({ color, size, focused }) => <HandHeartIcon size={size} color={color.toString()} weight={focused ? 'fill' : 'regular'} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <UserIcon
              size={size}
              color={color.toString()}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
