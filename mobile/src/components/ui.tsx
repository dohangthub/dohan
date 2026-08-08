import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { User, kmAway, commonInterests } from '../lib/api';
import { shadow, shadowSoft, theme } from '../lib/theme';

/* ---------- Avatar rond (dégradé + emoji) ---------- */
export function Avatar({ user, size = 52 }: { user: User; size?: number }) {
  return (
    <LinearGradient
      colors={user?.grad || theme.pinkGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.44 }}>{user?.emoji}</Text>
    </LinearGradient>
  );
}

/* ---------- Chip verre dépoli (sur photo) ---------- */
export function GlassChip({ icon, label, tint }: { icon?: keyof typeof Ionicons.glyphMap; label: string; tint?: string }) {
  return (
    <View style={styles.glassChip}>
      {icon ? <Ionicons name={icon} size={12} color={tint || '#fff'} /> : null}
      <Text style={styles.glassChipText}>{label}</Text>
    </View>
  );
}

/* ---------- Chip clair (fond) ---------- */
export function Chip({ icon, label, active }: { icon?: keyof typeof Ionicons.glyphMap; label: string; active?: boolean }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      {icon ? <Ionicons name={icon} size={13} color={active ? '#fff' : theme.muted} /> : null}
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </View>
  );
}

/* ---------- Pill Premium ---------- */
export function PremiumPill() {
  return (
    <LinearGradient colors={theme.pinkGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premPill}>
      <Ionicons name="diamond" size={11} color="#fff" />
      <Text style={styles.premPillText}>Premium</Text>
    </LinearGradient>
  );
}

/* ---------- Carte photo (dégradé + emoji + overlay) ---------- */
export function PhotoCard({
  user,
  style,
  badge,
  compact,
  children,
}: {
  user: User;
  style?: ViewStyle;
  badge?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.photoCard, style]}>
      <LinearGradient colors={user.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Text style={[styles.photoEmoji, compact && { fontSize: 72 }]}>{user.emoji}</Text>
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} />

      {badge ? (
        <View style={styles.matchBadge}>
          <Ionicons name="heart" size={12} color="#fff" />
          <Text style={styles.matchBadgeText}>{badge}</Text>
        </View>
      ) : null}
      {user.online ? <View style={styles.onlineDot} /> : null}

      <View style={styles.photoInfo}>
        <Text style={[styles.photoName, compact && { fontSize: 16 }]} numberOfLines={1}>
          {user.name}, {user.age}
        </Text>
        <View style={styles.photoChips}>
          <GlassChip icon="location" label={`${kmAway(user.id)} km`} />
          <GlassChip icon="flash" label={`${commonInterests(user)} en commun`} />
        </View>
      </View>
      {children}
    </View>
  );
}

/* ---------- En-tête d'écran ---------- */
export function ScreenTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.screenTitleRow}>
      <Text style={styles.screenTitle}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  glassChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: theme.primary },
  chipText: { color: theme.muted, fontSize: 13, fontWeight: '700' },

  premPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  premPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  photoCard: {
    flex: 1,
    borderRadius: theme.radius,
    overflow: 'hidden',
    backgroundColor: '#ddd',
    justifyContent: 'flex-end',
    ...shadow,
  },
  photoEmoji: { position: 'absolute', alignSelf: 'center', top: '26%', fontSize: 128 },
  matchBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  matchBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    top: 20,
    right: 18,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.success,
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoInfo: { padding: 18, gap: 8 },
  photoName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  photoChips: { flexDirection: 'row', gap: 8 },

  screenTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: theme.ink },
});

export { shadow, shadowSoft };
