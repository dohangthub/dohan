import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridSkeleton } from '../../components/Skeleton';
import { Chip, PremiumPill, ScreenTitle } from '../../components/ui';
import { AppState, User, api, kmAway, photoUrl } from '../../lib/api';
import { shadow, theme } from '../../lib/theme';

const TABS = ['Tous', 'Récents', 'Proches'];

export default function Likes() {
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(() => { api.state().then(setState).catch(() => {}); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!state) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}><ScreenTitle title="Like You" /></View>
      <GridSkeleton />
    </SafeAreaView>
  );

  const premium = state.premium;
  const people = state.likedYou;
  const count = state.likedYouCount;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenTitle
          title="Like You"
          right={<Pressable onPress={() => router.push('/store')}><PremiumPill /></Pressable>}
        />
        <View style={styles.tabs}>
          {TABS.map((t, i) => (
            <Pressable key={t} onPress={() => setTab(i)}>
              <Chip label={`${t}${i === 0 ? ' ' + count : ''}`} active={tab === i} />
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {count === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={40} color={theme.primary} />
            <Text style={styles.lockTitle}>Personne ne t'a encore liké</Text>
            <Text style={styles.lockSub}>Continue à swiper — plus tu es actif, plus tu reçois de likes.</Text>
            <Pressable style={styles.unlockBtn} onPress={() => router.push('/')}>
              <Text style={styles.unlockText}>Aller swiper</Text>
            </Pressable>
          </View>
        ) : premium ? (
          people.map((u) => <RealTile key={u.id} user={u} />)
        ) : (
          <>
            {Array.from({ length: Math.min(Math.max(count, 2), 6) }).map((_, i) => <LockedTile key={i} />)}
            <View style={styles.lockCta}>
              <View style={styles.lockIconWrap}><Ionicons name="lock-closed" size={22} color="#fff" /></View>
              <Text style={styles.lockTitle}>{count} personne{count > 1 ? 's' : ''} t'{count > 1 ? 'ont' : 'a'} liké 💜</Text>
              <Text style={styles.lockSub}>
                Ces profils sont floutés car c'est réservé à Premium. Avec Premium, tu vois qui c'est et tu peux matcher tout de suite.
              </Text>
              <Pressable style={styles.unlockBtn} onPress={() => router.push('/store')}>
                <Ionicons name="diamond" size={16} color="#fff" />
                <Text style={styles.unlockText}>Voir qui m'a liké · Premium</Text>
              </Pressable>
              <Text style={styles.lockFrom}>À partir de 1 000 F</Text>
            </View>
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RealTile({ user }: { user: User }) {
  const [err, setErr] = useState(false);
  const uri = photoUrl(user, 400, 520);
  return (
    <View style={styles.tile}>
      {uri && !err ? (
        <Image source={{ uri }} onError={() => setErr(true)} resizeMode="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <LinearGradient colors={user.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.tileEmoji}>{user.emoji}</Text>
        </>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
      <View style={styles.tileInfo}>
        <Text style={styles.tileName}>{user.name}, {user.age}</Text>
        <Text style={styles.tileMeta}>{kmAway(user.id)} km</Text>
      </View>
    </View>
  );
}

function LockedTile() {
  return (
    <View style={styles.tile}>
      <LinearGradient colors={['#CFC7D2', '#B4AAB9']} style={StyleSheet.absoluteFill} />
      <Ionicons name="person" size={44} color="rgba(255,255,255,0.7)" style={styles.lockIcon} />
      <View style={styles.blurBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  pad: { paddingHorizontal: 18, paddingTop: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, paddingHorizontal: 18, paddingTop: 8 },
  tile: { width: '48%', aspectRatio: 3 / 4, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end', ...shadow },
  tileEmoji: { position: 'absolute', alignSelf: 'center', top: '24%', fontSize: 60 },
  tileInfo: { padding: 10 },
  tileName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  tileMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  lockIcon: { position: 'absolute', alignSelf: 'center', top: '30%' },
  blurBar: { position: 'absolute', bottom: 12, left: 10, width: '55%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },

  empty: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 26, alignItems: 'center', gap: 8, marginTop: 4, ...shadow },
  lockCta: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 22, alignItems: 'center', gap: 6, marginTop: 12, ...shadow },
  lockIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  lockTitle: { fontSize: 17, fontWeight: '800', color: theme.ink, textAlign: 'center' },
  lockSub: { color: theme.muted, textAlign: 'center', lineHeight: 20, fontSize: 13.5 },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 10 },
  unlockText: { color: '#fff', fontWeight: '800' },
  lockFrom: { color: theme.muted, fontSize: 12, fontWeight: '700', marginTop: 6 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,8,18,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 8, maxHeight: '88%' },
  storeSection: { fontSize: 13, fontWeight: '800', color: theme.ink, marginTop: 16, marginBottom: 8 },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: theme.line, borderRadius: 14, padding: 14, marginBottom: 8 },
  buyRowBest: { borderColor: theme.primary, backgroundColor: theme.tint },
  buyLabel: { fontWeight: '800', color: theme.ink, fontSize: 15 },
  buySub: { color: theme.muted, fontSize: 12, marginTop: 2 },
  buyPrice: { fontWeight: '800', color: theme.primary, fontSize: 15 },
  sheetX: { position: 'absolute', top: 16, right: 18, zIndex: 2 },
  sheetIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: theme.ink, textAlign: 'center', marginBottom: 4 },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featText: { fontSize: 15, color: theme.ink, fontWeight: '600' },
  payLabel: { color: theme.muted, fontWeight: '700', marginTop: 8, fontSize: 12 },
  payRow: { flexDirection: 'row', gap: 8 },
  pay: { flex: 1, borderWidth: 2, borderColor: theme.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  paySel: { borderColor: theme.primary, backgroundColor: '#F1EBFF' },
  payText: { fontWeight: '800', fontSize: 12, color: theme.ink },
  cta: { backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  demoNote: { textAlign: 'center', color: theme.muted, fontSize: 11 },
});
