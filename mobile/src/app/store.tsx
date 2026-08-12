import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppState, api } from '../lib/api';
import { shadow, shadowSoft, theme } from '../lib/theme';

const BENEFITS = [
  { icon: 'heart', title: 'Likes illimités', sub: 'Fini les 10 likes par jour' },
  { icon: 'eye', title: 'Vois qui t\'a liké', sub: 'Et matche direct, sans attendre' },
  { icon: 'rocket', title: 'Profil mis en avant', sub: 'Tu passes devant = beaucoup plus de vues' },
  { icon: 'shield-checkmark', title: 'Badge Premium', sub: 'Plus de confiance, plus de réponses' },
];

const PLANS = [
  { item: 'day', label: '1 jour', price: 1000, unit: '≈ 42 F / heure' },
  { item: 'week', label: '1 semaine', price: 3000, unit: '≈ 430 F / jour', tag: 'POPULAIRE' },
  { item: 'month', label: '1 mois', price: 8000, unit: '≈ 265 F / jour', tag: 'RECOMMANDÉ' },
];

export default function Store() {
  const [state, setState] = useState<AppState | null>(null);
  const [plan, setPlan] = useState('week');
  const [pay, setPay] = useState('Wave');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.state().then(setState).catch(() => {}); }, []);

  const selected = PLANS.find((p) => p.item === plan)!;
  const prem = state?.premium;

  async function buy() {
    if (busy) return;
    setBusy(true); setMsg('');
    const method = pay === 'Orange Money' ? 'om' : 'wave';
    const r = await api.payInit('pass', plan, method, (state && state.me.phone) || '');
    setBusy(false);
    if (r?.simulated) { setMsg('✓ Premium activé (mode démo)'); setTimeout(() => router.back(), 1100); return; }
    if (r?.payment_url) { Linking.openURL(r.payment_url); router.back(); return; }
    setMsg('Une erreur est survenue, réessaie.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}><Ionicons name="chevron-back" size={26} color={theme.primary} /></Pressable>
        <Text style={styles.title}>Premium</Text>
      </View>

      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <LinearGradient colors={theme.pinkGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroBadge}><Ionicons name="diamond" size={24} color="#fff" /></View>
          <Text style={styles.heroTitle}>SenLove Premium</Text>
          <Text style={styles.heroSub}>Rencontre plus de monde, plus vite.</Text>
        </LinearGradient>

        {prem ? (
          <View style={styles.activeCard}>
            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            <Text style={styles.activeTxt}>Ton Premium est actif. Profites-en 💜</Text>
          </View>
        ) : null}

        {/* CE QUE TU GAGNES */}
        <Text style={styles.section}>Ce que tu gagnes</Text>
        <View style={styles.card}>
          {BENEFITS.map((b, i) => (
            <View key={b.title} style={[styles.benefit, i < BENEFITS.length - 1 && styles.benefitBorder]}>
              <View style={styles.benefitIcon}><Ionicons name={b.icon as any} size={18} color={theme.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitSub}>{b.sub}</Text>
              </View>
              <Ionicons name="checkmark" size={18} color={theme.success} />
            </View>
          ))}
        </View>

        {!prem ? (
          <>
            {/* FORMULE */}
            <Text style={styles.section}>Choisis ta formule</Text>
            <View style={{ gap: 10 }}>
              {PLANS.map((p) => {
                const on = plan === p.item;
                return (
                  <Pressable key={p.item} style={[styles.plan, on && styles.planOn]} onPress={() => setPlan(p.item)}>
                    <View style={[styles.radio, on && styles.radioOn]}>{on ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}</View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.planTop}>
                        <Text style={styles.planLabel}>{p.label}</Text>
                        {p.tag ? <View style={[styles.tag, p.tag === 'RECOMMANDÉ' && styles.tagReco]}><Text style={styles.tagTxt}>{p.tag}</Text></View> : null}
                      </View>
                      <Text style={styles.planUnit}>{p.unit}</Text>
                    </View>
                    <Text style={[styles.planPrice, on && { color: theme.primary }]}>{p.price.toLocaleString('fr-FR')} F</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* PAIEMENT */}
            <Text style={styles.section}>Payer avec</Text>
            <View style={styles.payRow}>
              {['Wave', 'Orange Money'].map((m) => (
                <Pressable key={m} style={[styles.pay, pay === m && styles.paySel]} onPress={() => setPay(m)}>
                  <Text style={[styles.payTxt, pay === m && { color: theme.primary }]}>{m}</Text>
                </Pressable>
              ))}
            </View>

            {/* CTA UNIQUE */}
            <Pressable style={styles.cta} onPress={buy} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.ctaTxt}>Payer {selected.price.toLocaleString('fr-FR')} F · {pay}</Text>
              )}
            </Pressable>
            {msg ? <Text style={styles.msg}>{msg}</Text> : null}
            <Text style={styles.note}>Paiement sécurisé Wave / Orange Money · sans engagement, tu annules quand tu veux.</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.line, backgroundColor: '#fff' },
  back: { padding: 4 },
  title: { fontWeight: '800', color: theme.ink, fontSize: 17 },
  wrap: { padding: 18, gap: 10, paddingBottom: 40 },

  hero: { borderRadius: 22, padding: 22, alignItems: 'center', gap: 6 },
  heroBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.95)', fontSize: 14, textAlign: 'center', fontWeight: '600' },

  activeCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, padding: 14, ...shadowSoft },
  activeTxt: { color: theme.ink, fontWeight: '700', flex: 1 },

  section: { fontSize: 13, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 16, ...shadowSoft },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  benefitBorder: { borderBottomWidth: 1, borderBottomColor: theme.line },
  benefitIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontWeight: '800', color: theme.ink, fontSize: 15 },
  benefitSub: { color: theme.muted, fontSize: 12.5, marginTop: 1 },

  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: theme.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, backgroundColor: '#fff' },
  planOn: { borderColor: theme.primary, backgroundColor: theme.tint },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel: { fontWeight: '800', color: theme.ink, fontSize: 16 },
  tag: { backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  tagReco: { backgroundColor: theme.gold },
  tagTxt: { color: '#fff', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 },
  planUnit: { color: theme.muted, fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  planPrice: { fontWeight: '900', color: theme.ink, fontSize: 18 },

  payRow: { flexDirection: 'row', gap: 10 },
  pay: { flex: 1, borderWidth: 2, borderColor: theme.line, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  paySel: { borderColor: theme.primary, backgroundColor: theme.tint },
  payTxt: { fontWeight: '800', color: theme.ink },

  cta: { backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 14, ...shadow },
  ctaTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  msg: { textAlign: 'center', color: theme.primary, fontWeight: '800', marginTop: 10 },
  note: { textAlign: 'center', color: theme.muted, fontSize: 11.5, marginTop: 12, lineHeight: 16 },
});
