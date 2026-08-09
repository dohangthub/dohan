import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/ui';
import { AppState, api } from '../lib/api';
import { pickImageDataUrl } from '../lib/pickImage';
import { shadow, theme } from '../lib/theme';

const CITIES = ['Dakar', 'Thiès', 'Saint-Louis', 'Rufisque', 'Mbour', 'Ziguinchor'];

export default function EditProfile() {
  const [state, setState] = useState<AppState | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
        name: name || 'Moi', bio: bio || 'Nouveau sur SenLove 👋', phone,
        gender: gender || undefined, age: age || undefined, city: city || undefined,
      } as any);
    } catch {}
    setSaving(false);
    router.back();
  }

  if (!state) return <SafeAreaView style={styles.safe} edges={['top']} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={26} color={theme.primary} /></Pressable>
        <Text style={styles.title}>Modifier le profil</Text>
        <Pressable onPress={save} disabled={saving}><Text style={styles.save}>{saving ? '…' : 'OK'}</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={styles.photoRow}>
          <Pressable onPress={changePhoto} style={styles.avatarWrap}>
            <Avatar user={state.me as any} size={92} />
            <View style={styles.camBadge}>{uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={15} color="#fff" />}</View>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={changePhoto}><Text style={styles.photoBtnTxt}>Changer la photo</Text></Pressable>
        </View>

        <Text style={styles.label}>Prénom</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor="#C3BCC7" />

        <View style={styles.rowFields}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Genre</Text>
            <View style={styles.seg}>
              {[['F', 'Femme'], ['H', 'Homme']].map(([g, l]) => (
                <Pressable key={g} style={[styles.segBtn, gender === g && styles.segOn]} onPress={() => setGender(g)}>
                  <Text style={[styles.segTxt, gender === g && { color: '#fff' }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ width: 84 }}>
            <Text style={styles.label}>Âge</Text>
            <TextInput style={[styles.input, { textAlign: 'center' }]} value={age} onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 2))} placeholder="24" placeholderTextColor="#C3BCC7" keyboardType="number-pad" />
          </View>
        </View>

        <Text style={styles.label}>Ville</Text>
        <View style={styles.cities}>
          {CITIES.map((c) => (
            <Pressable key={c} style={[styles.cityChip, city === c && styles.cityOn]} onPress={() => setCity(c)}>
              <Text style={[styles.cityTxt, city === c && { color: '#fff' }]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Téléphone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+221 ..." placeholderTextColor="#C3BCC7" keyboardType="phone-pad" />

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio} placeholder="Parle un peu de toi..." placeholderTextColor="#C3BCC7" multiline maxLength={200} />

        <Pressable style={styles.saveBtn} onPress={save}><Text style={styles.saveBtnTxt}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text></Pressable>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
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
  cities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { borderWidth: 1.5, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#fff' },
  cityOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  cityTxt: { color: theme.ink, fontWeight: '700', fontSize: 13 },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 22, ...shadow },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
