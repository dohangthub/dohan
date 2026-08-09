import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileSkeleton } from '../../components/Skeleton';
import { Avatar } from '../../components/ui';
import { AppState, Post, api } from '../../lib/api';
import { pickImageDataUrl } from '../../lib/pickImage';
import { shadow, shadowSoft, theme } from '../../lib/theme';

export default function Account() {
  const [state, setState] = useState<AppState | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  const load = useCallback(() => {
    api.state().then((s) => {
      setState(s);
      setName(s.me.name === 'Moi' ? '' : s.me.name);
      setPhone(s.me.phone || '');
      setBio(s.me.bio === 'Nouveau sur SenLove 👋' ? '' : s.me.bio);
      setGender((s.me as any).gender || '');
      setAge(s.me.age ? String(s.me.age) : '');
      setCity(s.me.city || '');
    }).catch(() => {});
    api.feed().then((d) => setMyPosts(d.posts.filter((p) => p.author.id === 'me'))).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    const s = await api.saveProfile({
      name: name || 'Moi', bio: bio || 'Nouveau sur SenLove 👋', phone,
      gender: gender || undefined, age: age || undefined, city: city || undefined,
    } as any);
    if (s?.state) setState(s.state);
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  }

  // Complétion du profil (motive à tout renseigner)
  const items = [
    { k: 'photo', ok: !!state?.me.photo, label: 'Ajoute une photo' },
    { k: 'bio', ok: !!bio.trim(), label: 'Écris ta bio' },
    { k: 'phone', ok: !!phone.trim(), label: 'Ajoute ton téléphone' },
    { k: 'city', ok: !!city, label: 'Indique ta ville' },
    { k: 'age', ok: !!age, label: 'Renseigne ton âge' },
  ];
  const done = items.filter((i) => i.ok).length;
  const pct = Math.round((done / items.length) * 100);
  const missing = items.filter((i) => !i.ok);

  async function changePhoto() {
    const dataUrl = await pickImageDataUrl();
    if (!dataUrl) return;
    setUploading(true);
    try {
      const up = await api.upload(dataUrl);
      if (up?.url) { const s = await api.saveProfile({ photo: up.url } as any); if (s?.state) setState(s.state); }
    } catch {}
    setUploading(false);
  }

  if (!state) return <SafeAreaView style={styles.safe} edges={['top']}><ProfileSkeleton /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.h1}>Mon profil</Text>
          <Pressable style={styles.gear} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={theme.ink} />
          </Pressable>
        </View>

        {/* En-tête profil */}
        <View style={styles.head}>
          <Pressable onPress={changePhoto} style={styles.avatarWrap}>
            <Avatar user={state.me as any} size={110} />
            <View style={styles.camBadge}>
              {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={17} color="#fff" />}
            </View>
          </Pressable>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name || 'Ton profil'}</Text>
            {state.me.verified ? <Ionicons name="shield-checkmark" size={18} color={theme.success} /> : null}
          </View>
          <Text style={styles.sub}>
            {state.premium ? '👑 Premium actif' : `Compte gratuit · ${state.likesLeft} likes restants`}
          </Text>
          <Pressable onPress={changePhoto}><Text style={styles.changePhoto}>Changer ma photo</Text></Pressable>
        </View>

        {/* Complétion du profil */}
        {pct < 100 ? (
          <View style={styles.compCard}>
            <View style={styles.compHead}>
              <Text style={styles.compTitle}>Profil complété à {pct}%</Text>
              <Text style={styles.compHint}>Un profil complet = plus de matchs ✨</Text>
            </View>
            <View style={styles.compTrack}><View style={[styles.compFill, { width: `${pct}%` }]} /></View>
            <View style={styles.compChips}>
              {missing.slice(0, 3).map((m) => (
                <Pressable key={m.k} style={styles.compChip} onPress={m.k === 'photo' ? changePhoto : undefined}>
                  <Ionicons name="add" size={13} color={theme.primary} />
                  <Text style={styles.compChipTxt}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Premium & Boost */}
        <View style={styles.premCard}>
          <View style={styles.premTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.premTitle}>{state.premium ? '👑 Premium actif' : 'Passe en Premium'}</Text>
              <Text style={styles.premSub}>Vois qui t'a liké · likes illimités</Text>
            </View>
            <Pressable style={styles.premBtn} onPress={() => router.push('/store')}>
              <Text style={styles.premBtnTxt}>{state.premium ? 'Gérer' : 'Découvrir'}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.boostRow} onPress={() => router.push('/store')}>
            <Ionicons name="rocket" size={16} color={theme.primary} />
            <Text style={styles.boostRowTxt}>{state.boostActive ? 'Boost actif ✓' : 'Booster mon profil · 300 FCFA'}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.muted} />
          </Pressable>
        </View>

        {/* Infos */}
        <View style={styles.card}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor="#C3BCC7" />

          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Genre</Text>
              <View style={styles.genderRow}>
                {[['F', 'Femme'], ['H', 'Homme']].map(([g, l]) => (
                  <Pressable key={g} style={[styles.genderBtn, gender === g && styles.genderOn]} onPress={() => setGender(g)}>
                    <Text style={[styles.genderTxt, gender === g && { color: '#fff' }]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ width: 90 }}>
              <Text style={styles.label}>Âge</Text>
              <TextInput style={[styles.input, { textAlign: 'center' }]} value={age} onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 2))} placeholder="24" placeholderTextColor="#C3BCC7" keyboardType="number-pad" />
            </View>
          </View>

          <Text style={styles.label}>Ville</Text>
          <View style={styles.cityWrap}>
            {['Dakar', 'Thiès', 'Saint-Louis', 'Rufisque', 'Mbour', 'Ziguinchor'].map((c) => (
              <Pressable key={c} style={[styles.cityChip, city === c && styles.cityChipOn]} onPress={() => setCity(c)}>
                <Text style={[styles.cityChipTxt, city === c && { color: '#fff' }]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Téléphone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+221 ..." placeholderTextColor="#C3BCC7" keyboardType="phone-pad" />
          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio}
            placeholder="Parle un peu de toi..." placeholderTextColor="#C3BCC7" multiline maxLength={200} />
          <Pressable style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveTxt}>{saved ? 'Enregistré ✓' : 'Enregistrer'}</Text>
          </Pressable>
        </View>

        {/* Mes posts */}
        <View style={styles.postsHead}>
          <Text style={styles.sectionH}>Mes publications</Text>
          <Text style={styles.postsCount}>{myPosts.length}</Text>
        </View>
        {myPosts.length === 0 ? (
          <Pressable style={styles.emptyPosts} onPress={() => router.push('/feed')}>
            <Ionicons name="add-circle-outline" size={26} color={theme.primary} />
            <Text style={styles.emptyPostsTxt}>Tu n'as rien publié. Poste dans le Feed ✨</Text>
          </Pressable>
        ) : (
          <View style={styles.grid}>
            {myPosts.map((p) => (
              <Pressable key={p.id} style={styles.tile} onPress={() => router.push(`/post/${p.id}`)}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} resizeMode="cover" style={styles.tileImg} />
                ) : (
                  <View style={styles.tileText}><Text style={styles.tileTextBody} numberOfLines={5}>{p.body}</Text></View>
                )}
                {p.commentCount > 0 ? (
                  <View style={styles.tileBadge}><Ionicons name="chatbubble" size={10} color="#fff" /><Text style={styles.tileBadgeTxt}>{p.commentCount}</Text></View>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
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
  camBadge: { position: 'absolute', right: -2, bottom: -2, width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.bg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  name: { fontSize: 22, fontWeight: '800', color: theme.ink },
  sub: { color: theme.muted, fontWeight: '600' },
  changePhoto: { color: theme.primary, fontWeight: '800', marginTop: 2 },
  compCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: theme.tint, ...shadowSoft },
  compHead: { gap: 2 },
  compTitle: { color: theme.ink, fontWeight: '800', fontSize: 15 },
  compHint: { color: theme.muted, fontSize: 12 },
  compTrack: { height: 8, borderRadius: 999, backgroundColor: theme.tint, overflow: 'hidden' },
  compFill: { height: 8, borderRadius: 999, backgroundColor: theme.primary },
  compChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  compChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.tint, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  compChipTxt: { color: theme.primary, fontWeight: '700', fontSize: 12 },
  rowFields: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, borderWidth: 1.5, borderColor: theme.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  genderOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  genderTxt: { color: theme.ink, fontWeight: '700' },
  cityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { borderWidth: 1.5, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  cityChipOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  cityChipTxt: { color: theme.ink, fontWeight: '700', fontSize: 13 },

  premCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12, ...shadowSoft },
  premTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premTitle: { color: theme.ink, fontWeight: '800', fontSize: 16 },
  premSub: { color: theme.muted, fontSize: 12, marginTop: 2 },
  premBtn: { backgroundColor: theme.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  premBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  boostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 12 },
  boostRowTxt: { flex: 1, color: theme.ink, fontWeight: '700', fontSize: 14 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 8, ...shadowSoft },
  label: { fontSize: 12, fontWeight: '800', color: theme.muted, marginTop: 8 },
  input: { borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.ink },
  textarea: { height: 84, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14, ...shadow },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  postsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionH: { fontSize: 13, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  postsCount: { color: theme.muted, fontWeight: '800' },
  emptyPosts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 22, ...shadowSoft },
  emptyPostsTxt: { color: theme.muted, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31.8%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', ...shadowSoft },
  tileImg: { width: '100%', height: '100%' },
  tileText: { flex: 1, padding: 8, alignItems: 'center', justifyContent: 'center' },
  tileTextBody: { fontSize: 12, color: theme.ink, textAlign: 'center' },
  tileBadge: { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  tileBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
