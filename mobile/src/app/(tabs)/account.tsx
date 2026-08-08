import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/ui';
import { AppState, api } from '../../lib/api';
import { shadow, shadowSoft, theme } from '../../lib/theme';

const EMOJIS = ['🙂', '😎', '🔥', '🌺', '🎧', '📸', '🌴', '⚽', '💃', '☕', '🦋', '✨'];

export default function Account() {
  const [state, setState] = useState<AppState | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [emoji, setEmoji] = useState('🙂');
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    api.state().then((s) => {
      setState(s);
      setName(s.me.name === 'Moi' ? '' : s.me.name);
      setBio(s.me.bio === 'Nouveau sur Doxan 👋' ? '' : s.me.bio);
      setEmoji(s.me.emoji);
    }).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    const s = await api.saveProfile({ name: name || 'Moi', bio: bio || 'Nouveau sur Doxan 👋', emoji } as any);
    if (s?.state) setState(s.state);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  if (!state) return <SafeAreaView style={styles.safe} edges={['top']} />;
  const me = { ...state.me, emoji };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Avatar user={me as any} size={96} />
          <Text style={styles.name}>{name || 'Ton profil'}</Text>
          <View style={styles.statusRow}>
            {state.premium ? (
              <LinearGradient colors={theme.pinkGrad} style={styles.goldPill}>
                <Ionicons name="diamond" size={12} color="#fff" />
                <Text style={styles.goldText}>Doxan Gold</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.free}>Compte gratuit · {state.likesLeft} likes restants</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor="#C3BCC7" />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio}
            placeholder="Parle un peu de toi..." placeholderTextColor="#C3BCC7" multiline maxLength={200}
          />

          <Text style={styles.label}>Ton emoji</Text>
          <View style={styles.emojiRow}>
            {EMOJIS.map((e) => (
              <Pressable key={e} style={[styles.emojiBtn, emoji === e && styles.emojiSel]} onPress={() => setEmoji(e)}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.save} onPress={save}>
            <Text style={styles.saveText}>{saved ? 'Enregistré ✓' : 'Enregistrer'}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.resetRow} onPress={() => api.reset().then(load)}>
          <Ionicons name="refresh" size={18} color={theme.muted} />
          <Text style={styles.resetText}>Réinitialiser la démo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  wrap: { padding: 18, gap: 16 },
  head: { alignItems: 'center', gap: 8, paddingTop: 8 },
  name: { fontSize: 22, fontWeight: '800', color: theme.ink },
  statusRow: { marginTop: 2 },
  goldPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  goldText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  free: { color: theme.muted, fontWeight: '600' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 8, ...shadowSoft },
  label: { fontSize: 12, fontWeight: '800', color: theme.muted, marginTop: 8 },
  input: { borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.ink },
  textarea: { height: 84, textAlignVertical: 'top' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  emojiSel: { borderColor: theme.primary, backgroundColor: '#FFF0F5' },
  save: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14, ...shadow },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  resetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  resetText: { color: theme.muted, fontWeight: '700' },
});
