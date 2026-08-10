import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppState, api } from '../lib/api';
import { shadowSoft, theme } from '../lib/theme';

const POLICIES = [
  { key: 'everyone', label: 'Tout le monde' },
  { key: 'verified', label: 'Vérifiés' },
  { key: 'requests', label: 'Sur demande' },
] as const;
const GENDER: Record<string, string> = { H: 'Homme', F: 'Femme', A: 'Autre' };

function InfoRow({ icon, label, value, last }: { icon: any; label: string; value?: string | null; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <Ionicons name={icon} size={18} color={theme.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={value ? styles.infoValue : styles.infoEmpty}>{value || 'Non renseigné'}</Text>
    </View>
  );
}

export default function Settings() {
  const [state, setState] = useState<AppState | null>(null);
  const load = useCallback(() => { api.state().then(setState).catch(() => {}); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function verify() { const s = await api.verify(); if (s?.state) setState(s.state); }
  async function setPolicy(key: string) { const s = await api.saveProfile({ dmPolicy: key } as any); if (s?.state) setState(s.state); }

  if (!state) return <SafeAreaView style={styles.safe} edges={['top']} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={theme.primary} />
        </Pressable>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {/* Mes infos */}
        <View style={styles.secRow}>
          <Text style={styles.section}>Mes infos</Text>
          <Pressable onPress={() => router.push('/edit-profile')}><Text style={styles.editLink}>Modifier</Text></Pressable>
        </View>
        <View style={styles.card}>
          <InfoRow icon="happy-outline" label="Genre" value={GENDER[state.me.gender]} />
          <InfoRow icon="calendar-outline" label="Âge" value={state.me.age ? `${state.me.age} ans` : null} />
          <InfoRow icon="location-outline" label="Commune" value={state.me.city} />
          <InfoRow icon="call-outline" label="Téléphone" value={state.me.phone} last />
        </View>

        {/* Sécurité */}
        <Text style={styles.section}>Sécurité</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark" size={20} color={state.me.verified ? theme.success : theme.muted} />
              <View>
                <Text style={styles.rowLabel}>Profil vérifié</Text>
                <Text style={styles.rowSub}>Rassure et débloque plus de contacts</Text>
              </View>
            </View>
            {state.me.verified ? (
              <Text style={{ color: theme.success, fontWeight: '800' }}>Vérifié ✓</Text>
            ) : (
              <Pressable style={styles.smallBtn} onPress={verify}><Text style={styles.smallBtnTxt}>Vérifier</Text></Pressable>
            )}
          </View>
        </View>

        {/* Messages */}
        <Text style={styles.section}>Messages</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Qui peut t'écrire</Text>
          <View style={styles.segs}>
            {POLICIES.map((p) => {
              const active = (state.me.dmPolicy || 'everyone') === p.key;
              return (
                <Pressable key={p.key} style={[styles.seg, active && styles.segActive]} onPress={() => setPolicy(p.key)}>
                  <Text style={[styles.segTxt, active && { color: '#fff' }]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>C'est toi qui décides. « Sur demande » = tu acceptes avant de discuter.</Text>
        </View>

        <Pressable style={styles.resetRow} onPress={() => api.reset().then(load)}>
          <Ionicons name="refresh" size={18} color={theme.muted} />
          <Text style={styles.resetText}>Réinitialiser la démo</Text>
        </Pressable>
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
  section: { fontSize: 13, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  secRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  editLink: { color: theme.primary, fontWeight: '800', fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: theme.line },
  infoLabel: { flex: 1, color: theme.ink, fontWeight: '600', fontSize: 15 },
  infoValue: { color: theme.ink, fontWeight: '700', fontSize: 15 },
  infoEmpty: { color: theme.muted, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 10, ...shadowSoft },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: theme.ink },
  rowSub: { fontSize: 12, color: theme.muted, marginTop: 1 },
  smallBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  smallBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  segs: { flexDirection: 'row', gap: 8, marginTop: 2 },
  seg: { flex: 1, borderWidth: 1.5, borderColor: theme.line, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  segActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  segTxt: { fontSize: 12, fontWeight: '700', color: theme.muted },
  hint: { color: theme.muted, fontSize: 12, lineHeight: 17 },
  resetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 6 },
  resetText: { color: theme.muted, fontWeight: '700' },
});
