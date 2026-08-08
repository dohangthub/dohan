import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { User } from '../lib/api';
import { shadow, theme } from '../lib/theme';
import { PhotoCard } from './ui';

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 110;

type Action = 'like' | 'pass' | 'crush';

export function SwipeDeck({
  users,
  onSwipe,
  onEmpty,
}: {
  users: User[];
  onSwipe: (u: User, a: Action) => void;
  onEmpty?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  // Réinitialise quand une nouvelle pile arrive
  useEffect(() => {
    setIndex(0);
    position.setValue({ x: 0, y: 0 });
  }, [users]);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-9deg', '0deg', '9deg'],
  });
  const likeOpacity = position.x.interpolate({ inputRange: [20, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-120, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  const advance = (u: User, a: Action) => {
    onSwipe(u, a);
    position.setValue({ x: 0, y: 0 });
    setIndex((i) => {
      const next = i + 1;
      if (next >= users.length) onEmpty?.();
      return next;
    });
  };

  const forceSwipe = (a: Action) => {
    const u = users[index];
    if (!u) return;
    const toX = a === 'pass' ? -SCREEN_W * 1.3 : a === 'crush' ? 0 : SCREEN_W * 1.3;
    const toY = a === 'crush' ? -SCREEN_W * 1.3 : 0;
    Animated.timing(position, { toValue: { x: toX, y: toY }, duration: 240, useNativeDriver: false }).start(() =>
      advance(u, a),
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) forceSwipe('like');
        else if (g.dx < -SWIPE_THRESHOLD) forceSwipe('pass');
        else if (g.dy < -SWIPE_THRESHOLD) forceSwipe('crush');
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
      },
    }),
  ).current;

  const current = users[index];
  const next = users[index + 1];

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 54 }}>🌙</Text>
        <Text style={styles.emptyTitle}>Plus personne pour l'instant</Text>
        <Text style={styles.emptySub}>Reviens plus tard ou élargis ta zone.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.deck}>
        {next ? (
          <View style={[styles.cardHolder, { transform: [{ scale: 0.94 }, { translateY: 14 }] }]}>
            <PhotoCard user={next} badge="Potential Match" />
          </View>
        ) : null}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.cardHolder,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
        >
          <PhotoCard user={current} badge="Potential Match">
            <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
              <Text style={[styles.stampText, { color: theme.success }]}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
              <Text style={[styles.stampText, { color: theme.primary }]}>NOPE</Text>
            </Animated.View>
          </PhotoCard>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.btnSm]} onPress={() => forceSwipe('pass')}>
          <Ionicons name="close" size={28} color="#FF6B6B" />
        </Pressable>
        <Pressable style={[styles.btn, styles.btnLg]} onPress={() => forceSwipe('like')}>
          <Ionicons name="heart" size={34} color="#fff" />
        </Pressable>
        <Pressable style={[styles.btn, styles.btnSm]} onPress={() => forceSwipe('crush')}>
          <Ionicons name="star" size={24} color={theme.gold} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  deck: { flex: 1 },
  cardHolder: { ...StyleSheet.absoluteFillObject },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.ink },
  emptySub: { color: theme.muted, textAlign: 'center' },

  stamp: {
    position: 'absolute',
    top: 28,
    borderWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  stampLike: { left: 20, borderColor: theme.success, transform: [{ rotate: '-14deg' }] },
  stampNope: { right: 20, borderColor: theme.primary, transform: [{ rotate: '14deg' }] },
  stampText: { fontSize: 26, fontWeight: '900' },

  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, paddingTop: 18 },
  btn: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    ...shadow,
  },
  btnSm: { width: 58, height: 58 },
  btnLg: { width: 70, height: 70, backgroundColor: theme.primary },
});
