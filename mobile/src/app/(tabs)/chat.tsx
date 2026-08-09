import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListSkeleton } from '../../components/Skeleton';
import { Avatar, ScreenTitle } from '../../components/ui';
import { Match, api } from '../../lib/api';
import { shadowSoft, theme } from '../../lib/theme';

export default function ChatList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    api.state().then((s) => { setMatches(s.matches); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fresh = matches.filter((m) => !m.lastMessage);
  const convos = matches;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenTitle title="Messages" />
      </View>

      {!loaded ? (
        <ListSkeleton />
      ) : matches.length === 0 ? (
        <Text style={styles.empty}>Pas encore de match.{'\n'}Va swiper pour trouver ton crush 🔥</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {fresh.length ? (
            <View style={styles.freshWrap}>
              <Text style={styles.section}>Nouveaux matchs</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.freshRow}>
                {fresh.map((m) => (
                  <Pressable key={m.id} style={styles.freshItem} onPress={() => router.push(`/chat/${m.id}`)}>
                    <Avatar user={m.user} size={64} />
                    <Text style={styles.freshName} numberOfLines={1}>{m.user.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={[styles.section, styles.pad]}>Discussions</Text>
          {convos.map((m) => (
            <Pressable key={m.id} style={styles.row} onPress={() => router.push(`/chat/${m.id}`)}>
              <Avatar user={m.user} size={56} />
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{m.user.name}, {m.user.age}</Text>
                <Text style={styles.rowLast} numberOfLines={1}>
                  {m.lastMessage || 'Vous avez matché ! Dis bonjour 👋'}
                </Text>
              </View>
              {!m.lastMessage ? <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View> : null}
            </Pressable>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  pad: { paddingHorizontal: 18 },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 60, lineHeight: 22 },
  section: { fontSize: 13, fontWeight: '800', color: theme.muted, marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  freshWrap: { paddingLeft: 18, marginTop: 4 },
  freshRow: { gap: 14, paddingRight: 18, paddingBottom: 8 },
  freshItem: { alignItems: 'center', width: 68, gap: 4 },
  freshName: { fontSize: 12, fontWeight: '700', color: theme.ink },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 14, marginBottom: 8, padding: 10, borderRadius: 18,
    backgroundColor: '#fff', ...shadowSoft,
  },
  rowText: { flex: 1 },
  rowName: { fontWeight: '800', color: theme.ink, fontSize: 15 },
  rowLast: { color: theme.muted, fontSize: 13, marginTop: 2 },
  newBadge: { backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
