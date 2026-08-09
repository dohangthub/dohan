import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../lib/theme';

const isWeb = Platform.OS === 'web';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, isWeb ? 14 : 24);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#9A929B',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 3 },
        tabBarIconStyle: { marginTop: 4 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: theme.line,
          height: 56 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          // séparation/ombre au-dessus de la barre
          ...(isWeb
            ? ({ boxShadow: '0 -4px 24px rgba(60,20,50,0.08)' } as any)
            : {
                shadowColor: '#3A1330',
                shadowOpacity: 0.08,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: -4 },
                elevation: 14,
              }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="flame" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: 'Feed', tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="likes"
        options={{ title: 'Likes', tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Messages', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
