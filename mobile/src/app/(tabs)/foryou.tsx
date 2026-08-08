import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoCard, ScreenTitle } from '../../components/ui';
import { User, api } from '../../lib/api';
import { shadow, theme } from '../../lib/theme';

export default function ForYou() {
  const [users, setUsers] = useState<User[]>([]);

  const load = useCallback(() => {
    api.state().then((s) => setUsers(s.deck)).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function like(u: User) {
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    const res = await api.swipe(u.id, 'like');
    if (res?.match) {
      const m = res.state.matches.find((x: any) => x.user.id === u.id);
      if (m) router.push(`/chat/${m.id}`);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenTitle title="Pour toi" right={<Text style={styles.count}>{users.length} profils</Text>} />
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {users.map((u) => (
          <View key={u.id} style={styles.cardBox}>
            <PhotoCard user={u} badge="Potential Match">
              <Pressable style={styles.like} onPress={() => like(u)}>
                <Ionicons name="heart" size={24} color="#fff" />
              </Pressable>
              <Text style={styles.bio} numberOfLines={2}>{u.bio}</Text>
            </PhotoCard>
          </View>
        ))}
        {users.length === 0 ? (
          <Text style={styles.empty}>Tu as tout vu 🎉 Reviens plus tard.</Text>
        ) : null}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  pad: { paddingHorizontal: 18, paddingTop: 8 },
  count: { color: theme.muted, fontWeight: '700' },
  list: { paddingHorizontal: 18, gap: 16, paddingBottom: 10 },
  cardBox: { height: 260 },
  like: {
    position: 'absolute', right: 16, bottom: 64,
    width: 50, height: 50, borderRadius: 25, backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  bio: { position: 'absolute', left: 18, right: 78, bottom: 18, color: 'rgba(255,255,255,0.9)', fontSize: 13, display: 'none' },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 40 },
});
