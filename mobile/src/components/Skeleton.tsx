import { useEffect } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';

import { shadowSoft, theme } from '../lib/theme';

// Une seule animation partagée par tous les skeletons (synchro + performant)
const pulse = new Animated.Value(0.5);
let started = false;
function ensurePulse() {
  if (started) return;
  started = true;
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0.5, duration: 750, useNativeDriver: false }),
    ]),
  ).start();
}

const SK = '#E7E1F3';

export function Skeleton({ w = '100%', h = 14, r = 8, style }: { w?: DimensionValue; h?: DimensionValue; r?: number; style?: ViewStyle }) {
  useEffect(() => { ensurePulse(); }, []);
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: SK, opacity: pulse }, style]} />;
}

/* ---- Deck (accueil) ---- */
export function DeckSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <Skeleton style={{ flex: 1 }} w="100%" h="100%" r={26} />
      <View style={styles.actions}>
        <Skeleton w={58} h={58} r={29} />
        <Skeleton w={70} h={70} r={35} />
        <Skeleton w={58} h={58} r={29} />
      </View>
    </View>
  );
}

/* ---- Feed ---- */
export function FeedSkeleton() {
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 4, gap: 14 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <Skeleton w={44} h={44} r={22} />
            <View style={{ gap: 7 }}><Skeleton w={130} h={12} /><Skeleton w={90} h={10} /></View>
          </View>
          <Skeleton w="72%" h={12} />
          <Skeleton w="100%" h={210} r={16} />
          <Skeleton w={150} h={13} />
        </View>
      ))}
    </View>
  );
}

/* ---- Grille (Like You) ---- */
export function GridSkeleton() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 12, paddingTop: 8 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} w="47%" h={210} r={18} />)}
    </View>
  );
}

/* ---- Liste (Messages) ---- */
export function ListSkeleton() {
  return (
    <View style={{ padding: 14, gap: 14 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.row}>
          <Skeleton w={56} h={56} r={28} />
          <View style={{ gap: 8, flex: 1 }}><Skeleton w="45%" h={13} /><Skeleton w="72%" h={11} /></View>
        </View>
      ))}
    </View>
  );
}

/* ---- Profil ---- */
export function ProfileSkeleton() {
  return (
    <View style={{ padding: 18, gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 10, paddingTop: 24 }}>
        <Skeleton w={104} h={104} r={52} />
        <Skeleton w={150} h={16} />
        <Skeleton w={110} h={12} />
      </View>
      <Skeleton w="100%" h={92} r={18} />
      <Skeleton w="100%" h={230} r={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, paddingTop: 18 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 14, gap: 10, ...shadowSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

export { theme };
