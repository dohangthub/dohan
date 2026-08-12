import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridSkeleton } from '../../components/Skeleton';
import { ScreenTitle } from '../../components/ui';
import { AppState, User, api, kmAway, photoUrl } from '../../lib/api';
import { shadow, theme } from '../../lib/theme';

export default function Likes() {
  const [state, setState] = useState<AppState | null>(null);

  const load = useCallback(() => { api.state().then(setState).catch(() => {}); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!state) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}><ScreenTitle title="Qui t'a liké" /></View>
      <GridSkeleton />
    </SafeAreaView>
  );

  const premium = state.premium;
  const people = state.likedYou;
  const count = state.likedYouCount;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}><ScreenTitle title="Qui t'a liké" /></View>

      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {count === 0 ? (
          <View style={styles.card}>
            <Ionicons name="heart-outline" size={42} color={theme.primary} />
            <Text style={styles.cardTitle}>Personne ne t'a encore liké</Text>
            <Text style={styles.cardSub}>Ici tu verras les personnes qui ont flashé sur toi. Continue à swiper — plus tu es actif, plus tu reçois de likes.</Text>
            <Pressable style={styles.cta} onPress={() => router.push('/')}>
              <Ionicons name="flame" size={16} color="#fff" />
              <Text style={styles.ctaTxt}>Aller swiper</Text>
            </Pressable>
          </View>
        ) : premium ? (
          <>
            <Text style={styles.intro}>{count} personne{count > 1 ? 's' : ''} {count > 1 ? 'ont' : 'a'} flashé sur toi 💜 Like en retour = match direct.</Text>
            <View style={styles.grid}>{people.map((u) => <RealTile key={u.id} user={u} />)}</View>
          </>
        ) : (
          <>
            {/* Explication + CTA EN HAUT */}
            <LinearGradient colors={theme.pinkGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroIcon}><Ionicons name="heart" size={26} color="#fff" /></View>
              <Text style={styles.heroCount}>{count} personne{count > 1 ? 's' : ''} t'{count > 1 ? 'ont' : 'a'} liké</Text>
              <Text style={styles.heroSub}>Quelqu'un a flashé sur toi ! Passe en Premium pour voir qui c'est et matcher tout de suite.</Text>
              <Pressable style={styles.heroCta} onPress={() => router.push('/store')}>
                <Ionicons name="diamond" size={16} color={theme.primary} />
                <Text style={styles.heroCtaTxt}>Voir qui m'a liké</Text>
              </Pressable>
              <Text style={styles.heroFrom}>Premium à partir de 1 000 F</Text>
            </LinearGradient>

            {/* Aperçu flouté */}
            <Text style={styles.teaser}>Aperçu — flouté tant que tu n'es pas Premium</Text>
            <View style={styles.grid}>
              {Array.from({ length: Math.min(Math.max(count, 2), 6) }).map((_, i) => <LockedTile key={i} />)}
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
    <Pressable style={styles.tile} onPress={() => router.push(`/u/${user.id}`)}>
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
    </Pressable>
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
  wrap: { paddingHorizontal: 18, paddingTop: 6, gap: 12 },

  hero: { borderRadius: 22, padding: 22, alignItems: 'center', gap: 6, ...shadow },
  heroIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  heroCount: { color: '#fff', fontWeight: '900', fontSize: 21, textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.95)', fontSize: 14, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 26, paddingVertical: 13, borderRadius: 14, marginTop: 10 },
  heroCtaTxt: { color: theme.primary, fontWeight: '900', fontSize: 15 },
  heroFrom: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginTop: 4 },

  intro: { color: theme.ink, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  teaser: { color: theme.muted, fontSize: 12.5, fontWeight: '700', marginTop: 4 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 26, alignItems: 'center', gap: 8, marginTop: 6, ...shadow },
  cardTitle: { fontSize: 18, fontWeight: '800', color: theme.ink, textAlign: 'center' },
  cardSub: { color: theme.muted, textAlign: 'center', lineHeight: 20, fontSize: 13.5 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.primary, paddingHorizontal: 26, paddingVertical: 13, borderRadius: 14, marginTop: 8 },
  ctaTxt: { color: '#fff', fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tile: { width: '48%', aspectRatio: 3 / 4, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end', ...shadow },
  tileEmoji: { position: 'absolute', alignSelf: 'center', top: '24%', fontSize: 60 },
  tileInfo: { padding: 10 },
  tileName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  tileMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  lockIcon: { position: 'absolute', alignSelf: 'center', top: '30%' },
  blurBar: { position: 'absolute', bottom: 12, left: 10, width: '55%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
});
