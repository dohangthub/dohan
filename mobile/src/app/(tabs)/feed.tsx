import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ScreenTitle } from '../../components/ui';
import { Post, REACTIONS, api, kmAway } from '../../lib/api';
import { shadow, shadowSoft, theme } from '../../lib/theme';

function reactSummary(p: Post) {
  const map: Record<string, number> = { ...(p.reactions || {}) };
  if (p.likes) map['❤️'] = (map['❤️'] || 0) + p.likes;
  const entries = Object.entries(map).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return { emojis: entries.slice(0, 3).map(([e]) => e), total: entries.reduce((s, [, n]) => s + n, 0) };
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dmInfo, setDmInfo] = useState<{ author: Post['author']; type: 'pending' | 'verified' } | null>(null);
  const [reactFor, setReactFor] = useState<Post | null>(null);

  const load = useCallback(() => {
    api.feed().then((d) => setPosts(d.posts)).catch(() => setPosts([]));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  function react(p: Post, emoji: string) {
    setReactFor(null);
    setPosts((ps) => ps?.map((x) => (x.id === p.id
      ? { ...x, reactions: { ...x.reactions, [emoji]: (x.reactions[emoji] || 0) + 1 } } : x)) || null);
    api.reactPost(p.id, emoji).catch(() => {});
  }

  async function message(p: Post) {
    const res = await api.dm(p.author.id);
    if (res?.status === 'open' && res.matchId) router.push(`/chat/${res.matchId}`);
    else if (res?.status === 'pending') setDmInfo({ author: p.author, type: 'pending' });
    else if (res?.status === 'verified_only') setDmInfo({ author: p.author, type: 'verified' });
  }
  async function verifyAndRetry() {
    const author = dmInfo?.author; setDmInfo(null);
    await api.verify(); if (!author) return;
    const res = await api.dm(author.id);
    if (res?.status === 'open' && res.matchId) router.push(`/chat/${res.matchId}`);
    else if (res?.status === 'pending') setDmInfo({ author, type: 'pending' });
  }

  async function pickImage() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true,
    });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    setUploading(true);
    try {
      const a = r.assets[0];
      const dataUrl = `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`;
      const up = await api.upload(dataUrl);
      setDraftPhoto(up.url);
    } catch {}
    setUploading(false);
  }

  async function publish() {
    const t = draft.trim();
    if (!t && !draftPhoto) return;
    setCompose(false);
    await api.createPost(t, draftPhoto);
    setDraft(''); setDraftPhoto(null);
    load();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenTitle title="Feed" right={
          <Pressable style={styles.composeBtn} onPress={() => setCompose(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>} />
      </View>

      {!posts ? (
        <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {posts.map((p) => {
            const rs = reactSummary(p);
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.head}>
                  <Avatar user={p.author} size={44} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{p.author.name}{p.author.age ? `, ${p.author.age}` : ''}</Text>
                      {p.author.verified ? <Ionicons name="checkmark-circle" size={15} color={theme.primary} /> : null}
                    </View>
                    <Text style={styles.meta}>📍 {p.author.city || 'Dakar'} · {kmAway(p.author.id)} km</Text>
                  </View>
                  {p.author.online ? <View style={styles.dot} /> : null}
                </View>

                {p.body ? <Text style={styles.body}>{p.body}</Text> : null}
                {p.kind === 'photo' && p.photo ? (
                  <Image source={{ uri: p.photo }} resizeMode="cover" style={styles.photo} />
                ) : null}

                {/* Résumé réactions + commentaires */}
                {(rs.total > 0 || p.commentCount > 0) ? (
                  <View style={styles.statsRow}>
                    {rs.total > 0 ? (
                      <View style={styles.reactPills}>
                        <Text style={styles.reactEmojis}>{rs.emojis.join('')}</Text>
                        <Text style={styles.statTxt}>{rs.total}</Text>
                      </View>
                    ) : <View />}
                    {p.commentCount > 0 ? (
                      <Text style={styles.statTxt}>{p.commentCount} commentaire{p.commentCount > 1 ? 's' : ''}</Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.actions}>
                  <Pressable style={styles.action} onPress={() => setReactFor(p)}>
                    <Ionicons name="heart-outline" size={22} color={theme.ink} />
                    <Text style={styles.actionTxt}>Réagir</Text>
                  </Pressable>
                  <Pressable style={styles.action} onPress={() => router.push(`/post/${p.id}`)}>
                    <Ionicons name="chatbubble-outline" size={20} color={theme.ink} />
                    <Text style={styles.actionTxt}>Commenter</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable style={styles.dmBtn} onPress={() => message(p)}>
                    <Ionicons name={p.author.dmPolicy === 'requests' ? 'lock-closed' : 'paper-plane'} size={14} color="#fff" />
                    <Text style={styles.dmTxt}>{p.author.dmPolicy === 'requests' ? 'Demander' : 'Message'}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {posts.length === 0 ? <Text style={styles.empty}>Aucun post. Sois le premier ✨</Text> : null}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Sélecteur de réaction */}
      <Modal visible={!!reactFor} transparent animationType="fade" onRequestClose={() => setReactFor(null)}>
        <Pressable style={styles.reactBackdrop} onPress={() => setReactFor(null)}>
          <View style={styles.reactBar}>
            {REACTIONS.map((e) => (
              <Pressable key={e} style={styles.reactBtn} onPress={() => reactFor && react(reactFor, e)}>
                <Text style={{ fontSize: 30 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Composer un post */}
      <Modal visible={compose} transparent animationType="slide" onRequestClose={() => setCompose(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Pressable onPress={() => setCompose(false)}><Text style={styles.cancel}>Annuler</Text></Pressable>
              <Text style={styles.sheetTitle}>Nouveau post</Text>
              <Pressable onPress={publish}><Text style={styles.publish}>Publier</Text></Pressable>
            </View>
            <TextInput style={styles.input} value={draft} onChangeText={setDraft}
              placeholder="Quoi de neuf ? Partage un truc..." placeholderTextColor="#C3BCC7" multiline maxLength={500} />
            {draftPhoto ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: draftPhoto }} resizeMode="cover" style={styles.preview} />
                <Pressable style={styles.previewX} onPress={() => setDraftPhoto(null)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : null}
            <Pressable style={styles.addPhoto} onPress={pickImage} disabled={uploading}>
              {uploading ? <ActivityIndicator color={theme.primary} />
                : <><Ionicons name="image" size={20} color={theme.primary} /><Text style={styles.addPhotoTxt}>Ajouter une photo</Text></>}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Résultat DM */}
      <Modal visible={!!dmInfo} transparent animationType="fade" onRequestClose={() => setDmInfo(null)}>
        <Pressable style={styles.modalCenter} onPress={() => setDmInfo(null)}>
          <View style={styles.infoCard}>
            {dmInfo?.type === 'pending' ? (
              <>
                <Ionicons name="paper-plane" size={34} color={theme.primary} />
                <Text style={styles.infoTitle}>Demande envoyée ✓</Text>
                <Text style={styles.infoSub}>{dmInfo.author.name} contrôle ses messages. Tu pourras discuter dès qu'elle accepte.</Text>
                <Pressable style={styles.infoBtn} onPress={() => setDmInfo(null)}><Text style={styles.infoBtnTxt}>Compris</Text></Pressable>
              </>
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={34} color={theme.primary} />
                <Text style={styles.infoTitle}>Réservé aux profils vérifiés</Text>
                <Text style={styles.infoSub}>{dmInfo?.author.name} n'accepte que les profils vérifiés. Vérifie ton profil pour lui écrire.</Text>
                <Pressable style={styles.infoBtn} onPress={verifyAndRetry}><Text style={styles.infoBtnTxt}>Vérifier mon profil</Text></Pressable>
                <Pressable onPress={() => setDmInfo(null)}><Text style={styles.infoCancel}>Plus tard</Text></Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  pad: { paddingHorizontal: 18, paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 60 },
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

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 2 },
  reactPills: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reactEmojis: { fontSize: 14 },
  statTxt: { color: theme.muted, fontSize: 13, fontWeight: '600' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionTxt: { color: theme.ink, fontWeight: '700', fontSize: 13 },
  dmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  dmTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },

  reactBackdrop: { flex: 1, backgroundColor: 'rgba(20,8,18,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  reactBar: { flexDirection: 'row', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, ...shadow },
  reactBtn: { paddingHorizontal: 4 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(20,8,18,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, minHeight: 280, gap: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontWeight: '800', color: theme.ink, fontSize: 16 },
  cancel: { color: theme.muted, fontWeight: '600' },
  publish: { color: theme.primary, fontWeight: '800' },
  input: { fontSize: 16, color: theme.ink, minHeight: 100, textAlignVertical: 'top' },
  previewWrap: { position: 'relative' },
  preview: { width: '100%', height: 200, borderRadius: 14, backgroundColor: theme.line },
  previewX: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addPhoto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: theme.line, borderRadius: 14, paddingVertical: 12 },
  addPhotoTxt: { color: theme.primary, fontWeight: '800' },

  modalCenter: { flex: 1, backgroundColor: 'rgba(20,8,18,0.5)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  infoCard: { backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', gap: 8, width: '100%', maxWidth: 340 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: theme.ink, marginTop: 4 },
  infoSub: { color: theme.muted, textAlign: 'center', lineHeight: 20 },
  infoBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', marginTop: 10, alignSelf: 'stretch' },
  infoBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  infoCancel: { color: theme.muted, fontWeight: '700', marginTop: 10 },
});
