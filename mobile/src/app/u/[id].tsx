import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileSkeleton } from '../../components/Skeleton';
import { User, api, avatarUri } from '../../lib/api';
import { shadow, shadowSoft, theme } from '../../lib/theme';

const GENDER: Record<string, string> = { H: 'Homme', F: 'Femme', A: 'Autre' };

export default function PublicProfile() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<{ id: string; kind: string; body: string; photo?: string | null }[]>([]);
  const [menu, setMenu] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState('');

  const REASONS = ['Faux profil / arnaque', 'Photos inappropriées', 'Harcèlement / insultes', 'Spam / pub', 'Autre'];

  useEffect(() => {
    if (!id) return;
    api.user(id).then((d) => { setUser(d.user); setPosts(d.posts); }).catch(() => {});
  }, [id]);

  async function doBlock() { setMenu(false); if (user) await api.block(user.id); router.back(); }
  async function doReport(reason: string) {
    setReportOpen(false);
    if (user) await api.report(user.id, reason);
    setToast('Merci, signalement envoyé. Notre équipe va vérifier.');
    setTimeout(() => setToast(''), 2600);
  }

  if (!user) return <View style={styles.safe}><ProfileSkeleton /></View>;

  const photo = avatarUri(user);
  const genderLabel = user.gender ? GENDER[user.gender] : null;
  const hasBio = !!user.bio && user.bio !== 'Nouveau sur SenLove 👋';

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <View style={styles.hero}>
        {photo ? (
          <Image source={{ uri: photo }} resizeMode="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient colors={theme.pinkGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFill} />

        <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.heroBtn} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color="#fff" /></Pressable>
          <Pressable style={styles.heroBtn} onPress={() => setMenu(true)}><Ionicons name="ellipsis-horizontal" size={20} color="#fff" /></Pressable>
        </View>

        <View style={styles.heroInfo}>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{user.name}{user.age ? `, ${user.age}` : ''}</Text>
            {user.verified ? <Ionicons name="checkmark-circle" size={22} color="#fff" /> : null}
          </View>
          <View style={styles.pills}>
            {(user.city || user.region) ? <Pill icon="location" label={user.city || user.region!} /> : null}
            {genderLabel ? <Pill icon="person" label={genderLabel} /> : null}
            {user.verified ? <Pill icon="shield-checkmark" label="Vérifié" /> : null}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* À propos */}
        <View style={styles.card}>
          <Text style={styles.cardH}>À propos</Text>
          <Text style={hasBio ? styles.bio : styles.bioEmpty}>{hasBio ? user.bio : 'Pas encore de bio.'}</Text>
        </View>

        {/* Centres d'intérêt */}
        {user.interests?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardH}>Centres d'intérêt</Text>
            <View style={styles.tags}>
              {user.interests.map((t) => <View key={t} style={styles.tag}><Text style={styles.tagTxt}>{t}</Text></View>)}
            </View>
          </View>
        ) : null}

        {/* Publications */}
        <View style={styles.postsHead}>
          <Text style={styles.sectionH}>Publications</Text>
          <Text style={styles.count}>{posts.length}</Text>
        </View>
        {posts.length === 0 ? (
          <View style={styles.emptyPosts}><Text style={styles.emptyTxt}>Aucune publication pour l'instant.</Text></View>
        ) : (
          <View style={styles.grid}>
            {posts.map((p) => (
              <Pressable key={p.id} style={styles.tile} onPress={() => router.push(`/post/${p.id}`)}>
                {p.photo ? <Image source={{ uri: p.photo }} resizeMode="cover" style={styles.tileImg} />
                  : <View style={styles.tileText}><Text style={styles.tileTextBody} numberOfLines={5}>{p.body}</Text></View>}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Menu actions */}
      <Modal visible={menu} transparent animationType="slide" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <Pressable style={styles.action} onPress={() => { setMenu(false); setReportOpen(true); }}>
              <Ionicons name="flag-outline" size={20} color={theme.ink} /><Text style={styles.actionTxt}>Signaler {user.name}</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={doBlock}>
              <Ionicons name="ban-outline" size={20} color={theme.danger} /><Text style={[styles.actionTxt, { color: theme.danger }]}>Bloquer {user.name}</Text>
            </Pressable>
            <Pressable style={[styles.action, { justifyContent: 'center', borderBottomWidth: 0 }]} onPress={() => setMenu(false)}>
              <Text style={styles.cancelTxt}>Annuler</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Raisons de signalement */}
      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setReportOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Pourquoi signaler ?</Text>
              <Pressable hitSlop={10} onPress={() => setReportOpen(false)}><Ionicons name="close" size={22} color={theme.ink} /></Pressable>
            </View>
            {REASONS.map((r) => (
              <Pressable key={r} style={styles.action} onPress={() => doReport(r)}>
                <Text style={styles.actionTxt}>{r}</Text><Ionicons name="chevron-forward" size={18} color={theme.muted} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {toast ? <View style={styles.toast}><Text style={styles.toastTxt}>{toast}</Text></View> : null}
    </ScrollView>
  );
}

function Pill({ icon, label }: { icon: any; label: string }) {
  return <View style={styles.pill}><Ionicons name={icon} size={12} color="#fff" /><Text style={styles.pillTxt}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  hero: { height: 360, justifyContent: 'flex-end', backgroundColor: '#ddd' },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroInfo: { padding: 20 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName: { color: '#fff', fontWeight: '900', fontSize: 28 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  pillTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  body: { padding: 16, gap: 14, marginTop: -18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.bg },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8, ...shadowSoft },
  cardH: { color: theme.ink, fontWeight: '800', fontSize: 16 },
  bio: { color: theme.ink, fontSize: 15, lineHeight: 22 },
  bioEmpty: { color: theme.muted, fontSize: 15, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: theme.tint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  tagTxt: { color: theme.primaryDark, fontWeight: '700', fontSize: 13 },

  postsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionH: { fontSize: 13, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  count: { color: theme.muted, fontWeight: '800' },
  emptyPosts: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 22, alignItems: 'center', ...shadowSoft },
  emptyTxt: { color: theme.muted, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31.8%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', ...shadowSoft },
  tileImg: { width: '100%', height: '100%' },
  tileText: { flex: 1, padding: 8, alignItems: 'center', justifyContent: 'center' },
  tileTextBody: { fontSize: 12, color: theme.ink, textAlign: 'center' },

  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,40,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26, ...shadow },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: theme.line, marginBottom: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: theme.ink },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.line },
  actionTxt: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.ink },
  cancelTxt: { fontSize: 16, fontWeight: '800', color: theme.muted },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 40, backgroundColor: theme.ink, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16 },
  toastTxt: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 13.5 },
});
