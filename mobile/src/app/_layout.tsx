import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { theme } from '../lib/theme';

const isWeb = Platform.OS === 'web';
// Ces routes s'affichent en pleine largeur (pas le cadre téléphone) : landing + auth
const FULL = ['/welcome', '/login', '/signup'];

export default function RootLayout() {
  const pathname = usePathname();
  const full = FULL.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const framed = isWeb && !full;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: full ? '#FFFFFF' : theme.bgWarm, alignItems: framed ? 'center' : 'stretch' }}>
        <View
          style={[
            { flex: 1, width: '100%', backgroundColor: full ? '#FFFFFF' : theme.bg },
            framed && {
              maxWidth: 430,
              // @ts-expect-error web-only style
              boxShadow: '0 10px 50px rgba(60,20,50,0.14)',
            },
          ]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: full ? '#FFFFFF' : theme.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="store" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}
