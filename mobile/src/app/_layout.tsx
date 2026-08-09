import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { theme } from '../lib/theme';

const isWeb = Platform.OS === 'web';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* Sur le web : enveloppe plein écran + cadre "téléphone" centré (max-width). */}
      <View style={{ flex: 1, backgroundColor: theme.bgWarm, alignItems: 'center' }}>
        <View
          style={[
            { flex: 1, width: '100%', backgroundColor: theme.bg },
            isWeb && {
              maxWidth: 430,
              // @ts-expect-error web-only style
              boxShadow: '0 10px 50px rgba(60,20,50,0.14)',
            },
          ]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="post/[id]" />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}
