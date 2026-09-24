import { Tabs } from 'expo-router';
import {
  HouseIcon,
  PawPrintIcon,
  UserIcon,
  HeartIcon,
  CalendarBlankIcon,
} from 'phosphor-react-native';
import { palette } from '@/theme/colors';
import { DefaultHeader } from '@/components/header/default';
import { Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { user } = useAuth();
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

          height: 60,
          paddingBottom: 8,
          paddingTop: 8,

          shadowColor: '#121212',
          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: 0.15,
          shadowRadius: 10.9,

          elevation: 4,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'PlusJakartaSans-Medium',
        },

        tabBarShowLabel: Platform.OS === 'web' ? true : false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
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
          tabBarButton: user?.role === 'volunteer' ? undefined : () => null,
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
