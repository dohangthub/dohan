import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppState, api } from '../lib/api';
import { shadow, shadowSoft, theme } from '../lib/theme';

const PREMIUM = [
  { item: 'day', label: '1 jour', price: '300 FCFA' },
  { item: 'week', label: '1 semaine', price: '1 000 FCFA', best: true },
  { item: 'month', label: '1 mois', price: '3 000 FCFA' },
];

export default function Store() {
  const [state, setState] = useState<AppState | null>(null);
  const [pay, setPay] = useState('Wave');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.state().then(setState).catch(() => {}); }, []);

  async function buy(kind: 'pass' | 'boost', item: string) {
    if (busy) return;
    setBusy(true); setMsg('');
    const method = pay === 'Orange Money' ? 'om' : 'wave';
    const r = await api.payInit(kind, item, method, (state && state.me.phone) || '');
    setBusy(false);
    if (r?.simulated) { setMsg('✓ Activé (mode démo)'); setTimeout(() => router.back(), 1000); return; }
    if (r?.payment_url) { Linking.openURL(r.payment_url); router.back(); return; }
    setMsg('Une erreur est survenue, réessaie.');
  }

  const prem = state?.premium;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}><Ionicons name="chevron-back" size={26} color={theme.primary} /></Pressable>
        <Text style={styles.title}>Boutique</Text>
      </View>

      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {/* Moyen de paiement */}
        <Text style={styles.section}>Payer avec</Text>
        <View style={styles.payRow}>
          {['Wave', 'Orange Money'].map((m) => (
            <Pressable key={m} style={[styles.pay, pay === m && styles.paySel]} onPress={() => setPay(m)}>
              <Text style={[styles.payTxt, pay === m && { color: theme.primary }]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        {/* PREMIUM */}
        <LinearGradient colors={theme.pinkGrad} style={styles.hero}>
          <Ionicons name="diamond" size={26} color="#fff" />
          <Text style={styles.heroTitle}>Premium</Text>
          <Text style={styles.heroSub}>Vois qui t'a liké  ·  Likes illimités  ·  Mode incognito</Text>
        </LinearGradient>
        {prem ? <Text style={styles.activeNote}>✓ Ton Premium est actif</Text> : null}
        {PREMIUM.map((p) => (
          <Pressable key={p.item} style={[styles.row, p.best && styles.rowBest]} onPress={() => buy('pass', p.item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{p.label}{p.best ? '   ⭐ Le + choisi' : ''}</Text>
            </View>
            <Text style={styles.rowPrice}>{p.price}</Text>
          </Pressable>
        ))}

        {/* BOOST */}
        <Text style={[styles.section, { marginTop: 18 }]}>Booster mon profil</Text>
        <Pressable style={styles.boostRow} onPress={() => buy('boost', 'boost')}>
          <View style={styles.boostIcon}><Ionicons name="rocket" size={20} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Boost 1 heure</Text>
            <Text style={styles.rowSub}>Passe en tête, jusqu'à 5× plus de vues</Text>
          </View>
          <Text style={styles.rowPrice}>300 FCFA</Text>
        </Pressable>

        {busy ? <ActivityIndicator color={theme.primary} style={{ marginTop: 16 }} /> : null}
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        <Text style={styles.note}>Paiement sécurisé Wave / Orange Money via Unitech Pay.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.line, backgroundColor: '#fff' },
  back: { padding: 4 },
  title: { fontWeight: '800', color: theme.ink, fontSize: 17 },
  wrap: { padding: 18, gap: 10 },
  section: { fontSize: 13, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  payRow: { flexDirection: 'row', gap: 10 },
  pay: { flex: 1, borderWidth: 2, borderColor: theme.line, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  paySel: { borderColor: theme.primary, backgroundColor: theme.tint },
  payTxt: { fontWeight: '800', color: theme.ink },

  hero: { borderRadius: 20, padding: 20, alignItems: 'center', gap: 4, marginTop: 8 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.95)', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  activeNote: { color: theme.success, fontWeight: '800', textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: theme.line, borderRadius: 14, padding: 16, ...shadowSoft },
  rowBest: { borderColor: theme.primary, backgroundColor: theme.tint },
  rowLabel: { fontWeight: '800', color: theme.ink, fontSize: 15 },
  rowSub: { color: theme.muted, fontSize: 12, marginTop: 2 },
  rowPrice: { fontWeight: '800', color: theme.primary, fontSize: 15 },

  boostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadow },
  boostIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },

  msg: { textAlign: 'center', color: theme.primary, fontWeight: '700', marginTop: 8 },
  note: { textAlign: 'center', color: theme.muted, fontSize: 11, marginTop: 14 },
});
