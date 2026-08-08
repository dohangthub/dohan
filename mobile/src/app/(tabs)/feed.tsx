import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ScreenTitle } from '../../components/ui';
import { Post, api, kmAway } from '../../lib/api';
import { shadow, shadowSoft, theme } from '../../lib/theme';

export default function Feed() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState('');

  const load = useCallback(() => {
    api.feed().then((d) => setPosts(d.posts)).catch(() => setPosts([]));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  function like(p: Post) {
    if (liked[p.id]) return;
    setLiked((l) => ({ ...l, [p.id]: true }));
    setPosts((ps) => ps?.map((x) => (x.id === p.id ? { ...x, likes: x.likes + 1 } : x)) || null);
    api.likePost(p.id).catch(() => {});
  }

  async function message(p: Post) {
    const res = await api.dm(p.author.id);
    if (res?.matchId) router.push(`/chat/${res.matchId}`);
  }

  async function publish() {
    const t = draft.trim();
    if (!t) return;
    setCompose(false);
    setDraft('');
    await api.createPost(t);
    load();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenTitle
          title="Feed"
          right={
            <Pressable style={styles.composeBtn} onPress={() => setCompose(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          }
        />
      </View>

      {!posts ? (
        <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
      ) : posts.length === 0 ? (
        <Text style={styles.empty}>Aucun post pour l'instant.{'\n'}Sois le premier à publier ✨</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {posts.map((p) => (
            <View key={p.id} style={styles.card}>
              {/* Auteur */}
              <View style={styles.head}>
                <Avatar user={p.author} size={44} />
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{p.author.name}{p.author.age ? `, ${p.author.age}` : ''}</Text>
                    <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
                  </View>
                  <Text style={styles.meta}>📍 {p.author.city || 'Dakar'} · {kmAway(p.author.id)} km</Text>
                </View>
                {p.author.online ? <View style={styles.dot} /> : null}
              </View>

              {/* Contenu */}
              {p.body ? <Text style={styles.body}>{p.body}</Text> : null}
              {p.kind === 'photo' && p.photo ? (
                <Image source={{ uri: p.photo }} resizeMode="cover" style={styles.photo} />
              ) : null}

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable style={styles.action} onPress={() => like(p)}>
                  <Ionicons
                    name={liked[p.id] ? 'heart' : 'heart-outline'}
                    size={22}
                    color={liked[p.id] ? theme.primary : theme.ink}
                  />
                  <Text style={styles.actionTxt}>{p.likes}</Text>
                </Pressable>
                <View style={styles.action}>
                  <Ionicons name="chatbubble-outline" size={20} color={theme.ink} />
                </View>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.dmBtn} onPress={() => message(p)}>
                  <Ionicons name="paper-plane" size={15} color="#fff" />
                  <Text style={styles.dmTxt}>Message</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Composer un post */}
      <Modal visible={compose} transparent animationType="slide" onRequestClose={() => setCompose(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Pressable onPress={() => setCompose(false)}><Text style={styles.cancel}>Annuler</Text></Pressable>
              <Text style={styles.sheetTitle}>Nouveau post</Text>
              <Pressable onPress={publish}><Text style={styles.publish}>Publier</Text></Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Quoi de neuf ? Partage un truc..."
              placeholderTextColor="#C3BCC7"
              multiline
              autoFocus
              maxLength={500}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  pad: { paddingHorizontal: 18, paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 60, lineHeight: 22 },
  composeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', ...shadow },

  list: { paddingHorizontal: 14, gap: 14, paddingTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 14, gap: 10, ...shadowSoft },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontWeight: '800', color: theme.ink, fontSize: 15 },
  meta: { color: theme.muted, fontSize: 12, marginTop: 1 },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: theme.success, borderWidth: 2, borderColor: '#fff' },
  body: { color: theme.ink, fontSize: 15, lineHeight: 21 },
  photo: { width: '100%', height: 360, borderRadius: 16, backgroundColor: theme.line },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionTxt: { color: theme.ink, fontWeight: '700', fontSize: 13 },
  dmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  dmTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(20,8,18,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, minHeight: 260 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontWeight: '800', color: theme.ink, fontSize: 16 },
  cancel: { color: theme.muted, fontWeight: '600' },
  publish: { color: theme.primary, fontWeight: '800' },
  input: { fontSize: 16, color: theme.ink, minHeight: 140, textAlignVertical: 'top' },
});
