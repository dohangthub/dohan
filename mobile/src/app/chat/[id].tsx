import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/ui';
import { ChatMsg, User, api } from '../../lib/api';
import { theme } from '../../lib/theme';

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [ices, setIces] = useState<string[]>([]);
  const [text, setText] = useState('');
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    api.messages(id).then((d) => { setUser(d.user); setMsgs(d.messages); });
    api.state().then((s) => setIces(s.icebreakers));
  }, [id]);

  async function send() {
    const t = text.trim();
    if (!t || !id) return;
    setText('');
    setMsgs((m) => [...m, { from: 'me', text: t }]);
    const res = await api.send(id, t);
    if (res?.messages) setMsgs(res.messages);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={theme.primary} />
        </Pressable>
        {user ? (
          <View style={styles.peer}>
            <Avatar user={user} size={42} />
            <View>
              <Text style={styles.peerName}>{user.name}, {user.age}</Text>
              <Text style={styles.peerCity}>📍 {user.city}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroller}
          contentContainerStyle={styles.body}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
        >
          {msgs.length === 0 ? (
            <View style={[styles.bubble, styles.them]}>
              <Text style={styles.themText}>Vous avez matché ! 🎉 Lance la conversation 👇</Text>
            </View>
          ) : (
            msgs.map((m, i) => (
              <View key={i} style={[styles.bubble, m.from === 'me' ? styles.me : styles.them]}>
                <Text style={m.from === 'me' ? styles.meText : styles.themText}>{m.text}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Icebreakers */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iceRow}>
          {ices.map((t) => (
            <Pressable key={t} style={styles.ice} onPress={() => setText(t)}>
              <Text style={styles.iceText}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Écris un message..."
            placeholderTextColor="#C3BCC7"
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.line, backgroundColor: '#fff' },
  back: { padding: 4 },
  peer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  peerName: { fontWeight: '800', color: theme.ink, fontSize: 15 },
  peerCity: { color: theme.muted, fontSize: 12 },

  body: { padding: 16, gap: 8 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  them: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 5 },
  me: { alignSelf: 'flex-end', backgroundColor: theme.primary, borderBottomRightRadius: 5 },
  themText: { color: theme.ink, fontSize: 15 },
  meText: { color: '#fff', fontSize: 15 },

  iceRow: { gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  ice: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  iceText: { fontSize: 12, color: theme.ink },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: theme.ink },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
});
