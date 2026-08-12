import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileSkeleton } from '../../components/Skeleton';
import { AppState, Post, api } from '../../lib/api';
import { shadow, shadowSoft, theme } from '../../lib/theme';

const GENDER: Record<string, string> = { H: 'Homme', F: 'Femme', A: 'Autre' };

export default function Account() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<AppState | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  const load = useCallback(() => {
    api.state().then(setState).catch(() => {});
    api.feed().then((d) => setMyPosts(d.posts.filter((p) => p.author.id === 'me'))).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!state || !state.me) return <View style={styles.safe}><ProfileSkeleton /></View>;

  const me = state.me;
  const interests = Array.isArray(me.interests) ? me.interests : [];
  const genderLabel = me.gender ? GENDER[me.gender] : null;
  const items = [!!me.photo, me.name !== 'Moi', !!me.gender, !!me.age, !!(me.city || me.region)];
  const pct = Math.round((items.filter(Boolean).length / items.length) * 100);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <View style={styles.hero}>
        {me.photo ? (
          <Image source={{ uri: me.photo }} resizeMode="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient colors={theme.pinkGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFill} />

        <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/settings')}><Ionicons name="settings-outline" size={20} color="#fff" /></Pressable>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/edit-profile')}><Ionicons name="create-outline" size={20} color="#fff" /></Pressable>
        </View>

        {!me.photo ? (
          <Pressable style={styles.addPhoto} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="camera" size={22} color="#fff" /><Text style={styles.addPhotoTxt}>Ajouter une photo</Text>
          </Pressable>
        ) : null}

        <View style={styles.heroInfo}>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{me.name === 'Moi' ? 'Ton profil' : me.name}{me.age ? `, ${me.age}` : ''}</Text>
            {me.verified ? <Ionicons name="checkmark-circle" size={22} color="#fff" /> : null}
          </View>
          <View style={styles.pills}>
            {(me.city || me.region) ? <Pill icon="location" label={me.city ? `${me.city}${me.region && me.region !== me.city ? ' · ' + me.region : ''}` : me.region!} /> : null}
            {genderLabel ? <Pill icon="person" label={genderLabel} /> : null}
            <Pill icon={state.premium ? 'diamond' : 'star'} label={state.premium ? 'Premium' : 'Gratuit'} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Complétion */}
        {pct < 100 ? (
          <Pressable style={styles.compCard} onPress={() => router.push('/edit-profile')}>
            <View style={styles.compRow}>
              <Text style={styles.compTitle}>Profil complété à {pct}%</Text>
              <Text style={styles.compLink}>Compléter →</Text>
            </View>
            <View style={styles.compTrack}><View style={[styles.compFill, { width: `${pct}%` }]} /></View>
            <Text style={styles.compHint}>Un profil complet = beaucoup plus de matchs ✨</Text>
          </Pressable>
        ) : null}

        {/* Premium — une seule carte claire */}
        {state.premium ? (
          <View style={styles.card}>
            <View style={styles.premTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardH}>👑 Premium actif</Text>
                <Text style={styles.premSub}>Likes illimités · tu vois qui t'a liké · profil mis en avant</Text>
              </View>
              <Pressable style={styles.premBtn} onPress={() => router.push('/store')}><Text style={styles.premBtnTxt}>Gérer</Text></Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/store')}>
            <LinearGradient colors={theme.pinkGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premCta}>
              <View style={styles.premCtaIcon}><Ionicons name="diamond" size={20} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premCtaTitle}>Passe Premium</Text>
                <Text style={styles.premCtaSub}>Vois qui t'a liké · likes illimités · profil boosté</Text>
              </View>
              <View style={styles.premCtaBtn}><Text style={styles.premCtaBtnTxt}>Voir</Text></View>
            </LinearGradient>
          </Pressable>
        )}

        {/* Centres d'intérêt */}
        <View style={styles.card}>
          <Text style={styles.cardH}>Centres d'intérêt</Text>
          {interests.length ? (
            <View style={styles.tags}>
              {interests.map((t) => <View key={t} style={styles.tag}><Text style={styles.tagTxt}>{t}</Text></View>)}
            </View>
          ) : (
            <Text style={styles.bioEmpty}>Ajoute tes centres d'intérêt pour matcher sur ce que tu aimes ✨</Text>
          )}
        </View>

        {/* Publications */}
        <View style={styles.postsHead}>
          <Text style={styles.sectionH}>Mes publications</Text>
          <Text style={styles.count}>{myPosts.length}</Text>
        </View>
        {myPosts.length === 0 ? (
          <Pressable style={styles.emptyPosts} onPress={() => router.push('/feed')}>
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
            <Text style={styles.emptyTxt}>Publie ta première photo dans le Feed</Text>
          </Pressable>
        ) : (
          <View style={styles.grid}>
            {myPosts.map((p) => (
              <Pressable key={p.id} style={styles.tile} onPress={() => router.push(`/post/${p.id}`)}>
                {p.photo ? <Image source={{ uri: p.photo }} resizeMode="cover" style={styles.tileImg} />
                  : <View style={styles.tileText}><Text style={styles.tileTextBody} numberOfLines={5}>{p.body}</Text></View>}
              </Pressable>
            ))}
          </View>
        )}

        <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="create-outline" size={18} color="#fff" /><Text style={styles.editBtnTxt}>Modifier mon profil</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Pill({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.pill}><Ionicons name={icon} size={12} color="#fff" /><Text style={styles.pillTxt}>{label}</Text></View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  hero: { height: 340, justifyContent: 'flex-end', backgroundColor: '#ddd' },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  addPhoto: { position: 'absolute', alignSelf: 'center', top: '40%', alignItems: 'center', gap: 6 },
  addPhotoTxt: { color: '#fff', fontWeight: '800' },
  heroInfo: { padding: 20 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName: { color: '#fff', fontWeight: '900', fontSize: 28 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  pillTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  body: { padding: 16, gap: 14, marginTop: -18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.bg },

  compCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8, borderWidth: 1, borderColor: theme.tint, ...shadowSoft },
  compRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compTitle: { color: theme.ink, fontWeight: '800', fontSize: 15 },
  compLink: { color: theme.primary, fontWeight: '800', fontSize: 13 },
  compTrack: { height: 8, borderRadius: 999, backgroundColor: theme.tint, overflow: 'hidden' },
  compFill: { height: 8, borderRadius: 999, backgroundColor: theme.primary },
  compHint: { color: theme.muted, fontSize: 12 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8, ...shadowSoft },
  cardH: { color: theme.ink, fontWeight: '800', fontSize: 16 },
  premTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premSub: { color: theme.muted, fontSize: 12, marginTop: 2 },
  premBtn: { backgroundColor: theme.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  premBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  premCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, ...shadow },
  premCtaIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  premCtaTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  premCtaSub: { color: 'rgba(255,255,255,0.95)', fontSize: 12, marginTop: 2, fontWeight: '600' },
  premCtaBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
  premCtaBtnTxt: { color: theme.primary, fontWeight: '900', fontSize: 13 },

  bio: { color: theme.ink, fontSize: 15, lineHeight: 22 },
  bioEmpty: { color: theme.muted, fontSize: 15, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: theme.tint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  tagTxt: { color: theme.primaryDark, fontWeight: '700', fontSize: 13 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: theme.line },
  infoLabel: { flex: 1, color: theme.ink, fontWeight: '600', fontSize: 15 },
  infoValue: { color: theme.ink, fontWeight: '700', fontSize: 15 },
  infoEmpty: { color: theme.muted, fontSize: 14 },

  postsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionH: { fontSize: 13, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  count: { color: theme.muted, fontWeight: '800' },
  emptyPosts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 22, ...shadowSoft },
  emptyTxt: { color: theme.muted, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31.8%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', ...shadowSoft },
  tileImg: { width: '100%', height: '100%' },
  tileText: { flex: 1, padding: 8, alignItems: 'center', justifyContent: 'center' },
  tileTextBody: { fontSize: 12, color: theme.ink, textAlign: 'center' },

  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, marginTop: 6, ...shadow },
  editBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
