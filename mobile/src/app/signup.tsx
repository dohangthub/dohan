import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '../lib/api';

const V = { bg: '#FFFFFF', card: '#FFFFFF', violet: '#7C3AED', violetLight: '#7C3AED', ink: '#1C1630', muted: '#6E6690', line: '#EBE5F7', field: '#F6F2FF' };
const GRAD = ['#9B6DFF', '#6D28D9'] as [string, string];

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try { await api.saveProfile({ name: name || 'Moi', phone } as any); } catch {}
    setBusy(false);
    router.replace('/');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: V.bg }} contentContainerStyle={styles.wrap}>
      <Pressable onPress={() => router.push('/welcome')} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={V.violetLight} /><Text style={styles.backTxt}>Accueil</Text>
      </Pressable>

      <View style={styles.card}>
        <LinearGradient colors={GRAD} style={styles.logo}><Ionicons name="heart" size={22} color="#fff" /></LinearGradient>
        <Text style={styles.title}>Crée ton compte</Text>
        <Text style={styles.sub}>2 minutes et tu es dans le game 🔥</Text>

        <Text style={styles.label}>Prénom</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor="#6C5F8A" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="toi@email.com" placeholderTextColor="#6C5F8A" keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Téléphone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+221 ..." placeholderTextColor="#6C5F8A" keyboardType="phone-pad" />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput style={styles.input} value={pwd} onChangeText={setPwd} placeholder="••••••••" placeholderTextColor="#6C5F8A" secureTextEntry />

        <Pressable style={styles.primary} onPress={submit}>
          <Text style={styles.primaryTxt}>{busy ? 'Création…' : 'S\'inscrire gratuitement'}</Text>
        </Pressable>
        <Text style={styles.terms}>En t'inscrivant, tu acceptes nos Conditions et notre Politique de confidentialité.</Text>

        <Text style={styles.footer}>Déjà un compte ? <Text style={styles.link} onPress={() => router.push('/login')}>Se connecter</Text></Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, paddingVertical: 50, gap: 16 },
  back: { position: 'absolute', top: 18, left: 16, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backTxt: { color: V.violetLight, fontWeight: '700' },
  card: { width: '100%', maxWidth: 420, backgroundColor: V.card, borderRadius: 26, padding: 28, borderWidth: 1, borderColor: V.line, gap: 4, shadowColor: '#2E1065', shadowOpacity: 0.08, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 6 },
  logo: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { color: V.ink, fontWeight: '900', fontSize: 26 },
  sub: { color: V.muted, fontSize: 15, marginBottom: 10 },
  label: { color: V.muted, fontWeight: '700', fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: V.field, borderWidth: 1, borderColor: V.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: V.ink, fontSize: 15 },
  primary: { backgroundColor: V.violet, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  primaryTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  terms: { color: V.muted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 17 },
  footer: { color: V.muted, textAlign: 'center', marginTop: 16 },
  link: { color: V.violetLight, fontWeight: '800' },
});
