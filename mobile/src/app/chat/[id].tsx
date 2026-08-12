import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
  const [menu, setMenu] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const scroller = useRef<ScrollView>(null);

  const REASONS = ['Faux profil / arnaque', 'Photos inappropriées', 'Harcèlement / insultes', 'Spam / pub', 'Autre'];

  async function doBlock() {
    setMenu(false);
    if (user) await api.block(user.id);
    router.back();
  }
  async function doReport(reason: string) {
    setReportOpen(false);
    if (user) await api.report(user.id, reason);
    setToast('Merci, signalement envoyé. Notre équipe va vérifier.');
    setTimeout(() => setToast(''), 2600);
  }

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
              <Text style={styles.peerCity}>📍 {user.city || user.region}</Text>
            </View>
          </View>
        ) : null}
        <Pressable style={styles.moreBtn} hitSlop={8} onPress={() => setMenu(true)}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.ink} />
        </Pressable>
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

      {/* Menu actions */}
      <Modal visible={menu} transparent animationType="slide" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <Pressable style={styles.action} onPress={() => { setMenu(false); setReportOpen(true); }}>
              <Ionicons name="flag-outline" size={20} color={theme.ink} />
              <Text style={styles.actionTxt}>Signaler {user?.name}</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={doBlock}>
              <Ionicons name="ban-outline" size={20} color={theme.danger} />
              <Text style={[styles.actionTxt, { color: theme.danger }]}>Bloquer {user?.name}</Text>
            </Pressable>
            <Pressable style={[styles.action, { justifyContent: 'center', borderBottomWidth: 0 }]} onPress={() => setMenu(false)}>
              <Text style={styles.cancelTxt}>Annuler</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Menu raisons de signalement */}
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
                <Text style={styles.actionTxt}>{r}</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.muted} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {toast ? <View style={styles.toast}><Text style={styles.toastTxt}>{toast}</Text></View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.line, backgroundColor: '#fff' },
  back: { padding: 4 },
  peer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moreBtn: { marginLeft: 'auto', padding: 8 },
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

  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,40,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: theme.line, marginBottom: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: theme.ink },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.line },
  actionTxt: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.ink },
  cancelTxt: { fontSize: 16, fontWeight: '800', color: theme.muted },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 40, backgroundColor: theme.ink, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16 },
  toastTxt: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 13.5 },
});
