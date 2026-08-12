import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Select } from '../components/Select';
import { Avatar } from '../components/ui';
import { AppState, api } from '../lib/api';
import { COMMUNES_BY_REGION, REGIONS, regionOf } from '../lib/communes';
import { INTERESTS, MAX_INTERESTS } from '../lib/interests';
import { pickImageDataUrl } from '../lib/pickImage';
import { shadow, theme } from '../lib/theme';

export default function EditProfile() {
  const [state, setState] = useState<AppState | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.state().then((s) => {
      setState(s);
      setName(s.me.name === 'Moi' ? '' : s.me.name);
      setPhone(s.me.phone || '');
      setInterests(Array.isArray(s.me.interests) ? s.me.interests : []);
      setGender((s.me as any).gender || '');
      setAge(s.me.age ? String(s.me.age) : '');
      setCity(s.me.city || '');
      setRegion(s.me.region || regionOf(s.me.city) || '');
    }).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

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

  async function save() {
    setSaving(true);
    try {
      await api.saveProfile({
        name: name || 'Moi', phone, interests,
        gender: gender || undefined, age: age || undefined,
        region: region || undefined, city: city || '',
      } as any);
    } catch {}
    setSaving(false);
    router.back();
  }

  if (!state) return <SafeAreaView style={styles.safe} edges={['top']} />;

  const hasPhoto = !!state.me.photo;
  const fields = [
    { key: 'photo', ok: hasPhoto },
    { key: 'prénom', ok: !!name.trim() },
    { key: 'genre', ok: !!gender },
    { key: 'âge', ok: !!age },
    { key: 'localisation', ok: !!(region || city) },
  ];
  const toggleInterest = (t: string) =>
    setInterests((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length < MAX_INTERESTS ? [...cur, t] : cur));
  const missing = fields.filter((f) => !f.ok).map((f) => f.key);
  const done = fields.length - missing.length;
  const complete = missing.length === 0;
  const pct = Math.round((done / fields.length) * 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={26} color={theme.primary} /></Pressable>
        <Text style={styles.title}>Modifier le profil</Text>
        <Pressable onPress={save} disabled={saving}><Text style={styles.save}>{saving ? '…' : 'OK'}</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {/* Bandeau de complétion */}
        {complete ? (
          <View style={styles.doneCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.doneTitle}>Profil complet 🎉</Text>
              <Text style={styles.doneSub}>Premium est débloqué et ton profil est mis en avant (boost actif).</Text>
            </View>
            <Pressable style={styles.doneBtn} onPress={() => router.push('/store')}><Text style={styles.doneBtnTxt}>Premium</Text></Pressable>
          </View>
        ) : (
          <View style={styles.todoCard}>
            <View style={styles.todoTop}>
              <Text style={styles.todoTitle}>Complète ton profil</Text>
              <Text style={styles.todoCount}>{done}/{fields.length}</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
            <Text style={styles.todoSub}>À remplir pour débloquer Premium & le boost 🚀 :</Text>
            <View style={styles.todoChips}>
              {missing.map((m) => (
                <View key={m} style={styles.todoChip}><Ionicons name="alert-circle" size={13} color={theme.gold} /><Text style={styles.todoChipTxt}>{m}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Photo */}
        <View style={styles.photoRow}>
          <Pressable onPress={changePhoto} style={styles.avatarWrap}>
            <Avatar user={state.me as any} size={92} />
            <View style={styles.camBadge}>{uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={15} color="#fff" />}</View>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={changePhoto}><Text style={styles.photoBtnTxt}>{hasPhoto ? 'Changer la photo' : 'Ajouter ta photo'}</Text></Pressable>
          {!hasPhoto ? <View style={styles.photoTodo}><Ionicons name="alert-circle" size={13} color={theme.gold} /><Text style={styles.photoTodoTxt}>Photo à ajouter</Text></View> : null}
          <Text style={styles.photoHype}>😍 Plus ta photo est belle, plus tu as de chances de matcher. Mets une vraie photo de toi bien nette.</Text>
        </View>

        <ReqLabel text="Prénom" ok={!!name.trim()} />
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor="#C3BCC7" />

        <View style={styles.rowFields}>
          <View style={{ flex: 1 }}>
            <ReqLabel text="Genre" ok={!!gender} />
            <View style={styles.seg}>
              {[['F', 'Femme'], ['H', 'Homme']].map(([g, l]) => (
                <Pressable key={g} style={[styles.segBtn, gender === g && styles.segOn]} onPress={() => setGender(g)}>
                  <Text style={[styles.segTxt, gender === g && { color: '#fff' }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ width: 84 }}>
            <ReqLabel text="Âge" ok={!!age} />
            <TextInput style={[styles.input, { textAlign: 'center' }]} value={age} onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 2))} placeholder="24" placeholderTextColor="#C3BCC7" keyboardType="number-pad" />
          </View>
        </View>

        <Select label={region ? 'Région' : 'Région · à compléter'} icon="location-outline" value={region} placeholder="Choisis ta région" options={REGIONS} onChange={(r) => { setRegion(r); setCity(''); }} />

        <Select
          label="Quartier / commune (optionnel)"
          icon="navigate-outline"
          value={city}
          placeholder={region ? 'Précise ton quartier' : "Choisis d'abord ta région"}
          options={region ? (COMMUNES_BY_REGION[region] || []) : []}
          onChange={setCity}
          disabled={!region}
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+221 ..." placeholderTextColor="#C3BCC7" keyboardType="phone-pad" />

        <Text style={styles.label}>Centres d'intérêt <Text style={{ color: theme.muted, fontWeight: '600' }}>· facultatif ({interests.length}/{MAX_INTERESTS})</Text></Text>
        <View style={styles.cities}>
          {INTERESTS.map((t) => {
            const on = interests.includes(t);
            return (
              <Pressable key={t} style={[styles.cityChipSm, on && styles.cityOn]} onPress={() => toggleInterest(t)}>
                <Text style={[styles.cityTxtSm, on && { color: '#fff' }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.saveBtn} onPress={save}><Text style={styles.saveBtnTxt}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text></Pressable>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ReqLabel({ text, ok }: { text: string; ok: boolean }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{text}</Text>
      {ok
        ? <Ionicons name="checkmark-circle" size={13} color={theme.success} />
        : <Text style={styles.todoMark}>à compléter</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EAF9F1', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#BEEBD4', marginBottom: 6 },
  doneTitle: { fontWeight: '900', color: theme.ink, fontSize: 15 },
  doneSub: { color: theme.muted, fontSize: 12.5, marginTop: 1, lineHeight: 17 },
  doneBtn: { backgroundColor: theme.success, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  doneBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  todoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: theme.tint, marginBottom: 6 },
  todoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todoTitle: { fontWeight: '900', color: theme.ink, fontSize: 16 },
  todoCount: { fontWeight: '900', color: theme.primary, fontSize: 15 },
  track: { height: 8, borderRadius: 999, backgroundColor: theme.tint, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999, backgroundColor: theme.primary },
  todoSub: { color: theme.muted, fontSize: 12.5, fontWeight: '600' },
  todoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  todoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E9', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  todoChipTxt: { color: '#C25A18', fontWeight: '800', fontSize: 12.5 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todoMark: { color: theme.gold, fontWeight: '800', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3 },
  photoTodo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoTodoTxt: { color: theme.gold, fontWeight: '800', fontSize: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.line, backgroundColor: '#fff' },
  back: { padding: 4 },
  title: { fontWeight: '800', color: theme.ink, fontSize: 17 },
  save: { color: theme.primary, fontWeight: '800', fontSize: 16, paddingHorizontal: 8 },
  wrap: { padding: 18, gap: 6 },
  photoRow: { alignItems: 'center', gap: 10, marginBottom: 8 },
  avatarWrap: { position: 'relative' },
  camBadge: { position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.bg },
  photoBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  photoBtnTxt: { color: theme.primary, fontWeight: '800' },
  label: { color: theme.muted, fontWeight: '800', fontSize: 12, marginTop: 12, marginBottom: 5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: theme.ink, fontSize: 15 },
  textarea: { height: 90, textAlignVertical: 'top' },
  rowFields: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  seg: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, borderWidth: 1.5, borderColor: theme.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  segOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  segTxt: { color: theme.ink, fontWeight: '700' },
  helper: { color: theme.muted, fontSize: 11.5, marginTop: 5, lineHeight: 16 },
  photoHype: { color: theme.primary, fontSize: 12.5, fontWeight: '700', textAlign: 'center', lineHeight: 18, paddingHorizontal: 8, marginTop: 2 },
  cities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { borderWidth: 1.5, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#fff' },
  cityChipSm: { borderWidth: 1.5, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff' },
  cityOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  cityTxt: { color: theme.ink, fontWeight: '700', fontSize: 13 },
  cityTxtSm: { color: theme.ink, fontWeight: '600', fontSize: 12.5 },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 22, ...shadow },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
