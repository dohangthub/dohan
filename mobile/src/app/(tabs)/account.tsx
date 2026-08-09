import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/ui';
import { AppState, Post, api } from '../../lib/api';
import { shadow, shadowSoft, theme } from '../../lib/theme';

const EMOJIS = ['🙂', '😎', '🔥', '🌺', '🎧', '📸', '🌴', '⚽', '💃', '☕', '🦋', '✨'];

export default function Account() {
  const [state, setState] = useState<AppState | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [emoji, setEmoji] = useState('🙂');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  const load = useCallback(() => {
    api.state().then((s) => {
      setState(s);
      setName(s.me.name === 'Moi' ? '' : s.me.name);
      setPhone(s.me.phone || '');
      setBio(s.me.bio === 'Nouveau sur SenLove 👋' ? '' : s.me.bio);
      setEmoji(s.me.emoji);
    }).catch(() => {});
    api.feed().then((d) => setMyPosts(d.posts.filter((p) => p.author.id === 'me'))).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    const s = await api.saveProfile({ name: name || 'Moi', bio: bio || 'Nouveau sur SenLove 👋', emoji, phone } as any);
    if (s?.state) setState(s.state);
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  }

  async function changePhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    setUploading(true);
    try {
      const a = r.assets[0];
      const up = await api.upload(`data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`);
      const s = await api.saveProfile({ photo: up.url } as any);
      if (s?.state) setState(s.state);
    } catch {}
    setUploading(false);
  }

  if (!state) return <SafeAreaView style={styles.safe} edges={['top']} />;
  const me = { ...state.me, emoji };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.topBar}>
          <Text style={styles.h1}>Mon profil</Text>
          <Pressable style={styles.gear} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={theme.ink} />
          </Pressable>
        </View>

        <View style={styles.head}>
          <Pressable onPress={changePhoto} style={styles.avatarWrap}>
            <Avatar user={me as any} size={104} />
            <View style={styles.camBadge}>
              {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={16} color="#fff" />}
            </View>
          </Pressable>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name || 'Ton profil'}</Text>
            {state.me.verified ? <Ionicons name="shield-checkmark" size={18} color={theme.success} /> : null}
          </View>
          <Text style={styles.free}>
            {state.premium ? '👑 SenLove Gold' : `Compte gratuit · ${state.likesLeft} likes restants`}
          </Text>
          <Pressable onPress={changePhoto}><Text style={styles.changePhoto}>Changer ma photo de profil</Text></Pressable>
        </View>

        {/* Infos */}
        <View style={styles.card}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor="#C3BCC7" />
          <Text style={styles.label}>Téléphone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+221 ..." placeholderTextColor="#C3BCC7" keyboardType="phone-pad" />
          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio}
            placeholder="Parle un peu de toi..." placeholderTextColor="#C3BCC7" multiline maxLength={200} />
          <Text style={styles.label}>Ton emoji</Text>
          <View style={styles.emojiRow}>
            {EMOJIS.map((e) => (
              <Pressable key={e} style={[styles.emojiBtn, emoji === e && styles.emojiSel]} onPress={() => setEmoji(e)}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveTxt}>{saved ? 'Enregistré ✓' : 'Enregistrer'}</Text>
          </Pressable>
        </View>

        {/* Mes posts */}
        <Text style={styles.sectionH}>Mes posts</Text>
        {myPosts.length === 0 ? (
          <Text style={styles.emptyPosts}>Tu n'as pas encore publié. Va dans le Feed pour poster ✨</Text>
        ) : (
          <View style={styles.grid}>
            {myPosts.map((p) => (
              <Pressable key={p.id} style={styles.tile} onPress={() => router.push(`/post/${p.id}`)}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} resizeMode="cover" style={styles.tileImg} />
                ) : (
                  <View style={styles.tileText}><Text style={styles.tileTextBody} numberOfLines={4}>{p.body}</Text></View>
                )}
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  wrap: { padding: 18, gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 26, fontWeight: '800', color: theme.ink },
  gear: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadowSoft },

  head: { alignItems: 'center', gap: 6 },
  avatarWrap: { position: 'relative' },
  camBadge: { position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRadius: 17, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.bg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  name: { fontSize: 22, fontWeight: '800', color: theme.ink },
  free: { color: theme.muted, fontWeight: '600' },
  changePhoto: { color: theme.primary, fontWeight: '800', marginTop: 2 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 8, ...shadowSoft },
  label: { fontSize: 12, fontWeight: '800', color: theme.muted, marginTop: 8 },
  input: { borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.ink },
  textarea: { height: 84, textAlignVertical: 'top' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  emojiSel: { borderColor: theme.primary, backgroundColor: '#F1EBFF' },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14, ...shadow },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  sectionH: { fontSize: 13, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyPosts: { color: theme.muted, textAlign: 'center', paddingVertical: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31.5%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', ...shadowSoft },
  tileImg: { width: '100%', height: '100%' },
  tileText: { flex: 1, padding: 8, alignItems: 'center', justifyContent: 'center' },
  tileTextBody: { fontSize: 12, color: theme.ink, textAlign: 'center' },
});
