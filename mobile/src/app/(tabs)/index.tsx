import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeckSkeleton, Skeleton } from '../../components/Skeleton';
import { SwipeDeck } from '../../components/SwipeDeck';
import { Avatar } from '../../components/ui';
import { AppState, User, api } from '../../lib/api';
import { shadow, theme } from '../../lib/theme';

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [match, setMatch] = useState<{ user: User; matchId: string } | null>(null);

  const load = useCallback(() => {
    api.state().then(setState).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onSwipe(u: User, action: 'like' | 'pass' | 'crush') {
    const res = await api.swipe(u.id, action);
    if (res?.error === 'limit') {
      router.push('/store');
      return;
    }
    if (res?.state) setState(res.state);
    if (res?.match) {
      const m = res.state.matches.find((x: any) => x.user.id === u.id);
      if (m) setMatch({ user: u, matchId: m.id });
    }
  }

  if (!state) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.brandRow}><Skeleton w={30} h={30} r={9} /><Skeleton w={90} h={20} /></View>
          <View style={{ flexDirection: 'row', gap: 10 }}><Skeleton w={40} h={40} r={20} /><Skeleton w={40} h={40} r={20} /></View>
        </View>
        <View style={styles.deckWrap}><DeckSkeleton /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <LinearGradient colors={theme.pinkGrad} style={styles.logo}>
            <Ionicons name="heart" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.brand}>Sen<Text style={{ color: theme.primary }}>Love</Text></Text>
        </View>
        <View style={styles.headerBtns}>
          <Pressable style={styles.circleBtn} onPress={() => api.reset().then(load)}>
            <Ionicons name="refresh" size={18} color={theme.ink} />
          </Pressable>
          <Pressable style={styles.circleBtn} onPress={() => router.push('/feed')}>
            <Ionicons name="options" size={18} color={theme.ink} />
          </Pressable>
        </View>
      </View>

      {!state.me.photo ? (
        <Pressable style={styles.nudge} onPress={() => router.push('/edit-profile')}>
          <View style={styles.nudgeIcon}><Ionicons name="camera" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nudgeTitle}>Ajoute ta photo pour apparaître</Text>
            <Text style={styles.nudgeSub}>Sans photo, tu n'es pas visible dans l'accueil des autres.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.primary} />
        </Pressable>
      ) : null}

      <View style={styles.deckWrap}>
        <SwipeDeck users={state.deck} onSwipe={onSwipe} onEmpty={load} />
      </View>

      {/* Match overlay */}
      {match ? (
        <View style={styles.overlay}>
          <LinearGradient colors={theme.pinkGrad} style={styles.matchCard}>
            <Text style={styles.matchTitle}>C'est un match ! 🎉</Text>
            <View style={styles.matchAvatars}>
              <Avatar user={state.me} size={78} />
              <Ionicons name="heart" size={30} color="#fff" style={{ marginHorizontal: 8 }} />
              <Avatar user={match.user} size={78} />
            </View>
            <Text style={styles.matchSub}>Toi et {match.user.name} vous êtes plu 🔥</Text>
            <Pressable
              style={styles.matchPrimary}
              onPress={() => { const id = match.matchId; setMatch(null); router.push(`/chat/${id}`); }}
            >
              <Text style={styles.matchPrimaryText}>Envoyer un message</Text>
            </Pressable>
            <Pressable onPress={() => setMatch(null)}>
              <Text style={styles.matchGhost}>Continuer à swiper</Text>
            </Pressable>
          </LinearGradient>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginBottom: 4, backgroundColor: theme.tint, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.line },
  nudgeIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  nudgeTitle: { fontWeight: '800', color: theme.ink, fontSize: 14 },
  nudgeSub: { color: theme.muted, fontSize: 12, marginTop: 1, lineHeight: 16 },
  logo: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 22, fontWeight: '800', color: theme.ink },
  headerBtns: { flexDirection: 'row', gap: 10 },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  deckWrap: { flex: 1, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 16 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,8,18,0.5)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  matchCard: { width: '100%', maxWidth: 380, borderRadius: 28, padding: 26, alignItems: 'center' },
  matchTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  matchAvatars: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  matchSub: { color: 'rgba(255,255,255,0.95)', marginBottom: 18 },
  matchPrimary: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 16, alignItems: 'center', width: '100%' },
  matchPrimaryText: { color: theme.primary, fontWeight: '800', fontSize: 15 },
  matchGhost: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', marginTop: 12 },
});
