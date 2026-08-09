import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const V = { bg: '#0E0620', card: '#170B2E', violet: '#7C3AED', violetLight: '#A98BFF', ink: '#F4F0FF', muted: '#A79CC4', line: 'rgba(255,255,255,0.12)' };
const GRAD = ['#9B6DFF', '#6D28D9'] as [string, string];

export default function Login() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: V.bg }} contentContainerStyle={styles.wrap}>
      <Pressable onPress={() => router.push('/welcome')} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={V.violetLight} /><Text style={styles.backTxt}>Accueil</Text>
      </Pressable>

      <View style={styles.card}>
        <LinearGradient colors={GRAD} style={styles.logo}><Ionicons name="heart" size={22} color="#fff" /></LinearGradient>
        <Text style={styles.title}>Bon retour 👋</Text>
        <Text style={styles.sub}>Connecte-toi pour retrouver tes matchs.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="toi@email.com" placeholderTextColor="#6C5F8A" keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput style={styles.input} value={pwd} onChangeText={setPwd} placeholder="••••••••" placeholderTextColor="#6C5F8A" secureTextEntry />

        <Pressable style={styles.primary} onPress={() => router.replace('/')}>
          <Text style={styles.primaryTxt}>Se connecter</Text>
        </Pressable>

        <Text style={styles.or}>ou</Text>
        <Pressable style={styles.ghost} onPress={() => router.replace('/')}>
          <Text style={styles.ghostTxt}>Continuer sans compte</Text>
        </Pressable>

        <Text style={styles.footer}>Pas encore de compte ? <Text style={styles.link} onPress={() => router.push('/signup')}>S'inscrire</Text></Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
  back: { position: 'absolute', top: 18, left: 16, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backTxt: { color: V.violetLight, fontWeight: '700' },
  card: { width: '100%', maxWidth: 420, backgroundColor: V.card, borderRadius: 26, padding: 28, borderWidth: 1, borderColor: V.line, gap: 6 },
  logo: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { color: V.ink, fontWeight: '900', fontSize: 26 },
  sub: { color: V.muted, fontSize: 15, marginBottom: 12 },
  label: { color: V.muted, fontWeight: '700', fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#0E0620', borderWidth: 1, borderColor: V.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: V.ink, fontSize: 15 },
  primary: { backgroundColor: V.violet, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  primaryTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  or: { color: V.muted, textAlign: 'center', marginVertical: 12, fontSize: 13 },
  ghost: { borderWidth: 1.5, borderColor: V.line, borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  ghostTxt: { color: V.ink, fontWeight: '800' },
  footer: { color: V.muted, textAlign: 'center', marginTop: 18 },
  link: { color: V.violetLight, fontWeight: '800' },
});
