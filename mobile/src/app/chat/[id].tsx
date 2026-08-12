import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { pickImageDataUrl } from '../../lib/pickImage';
import { theme } from '../../lib/theme';
import { Recorder, startRecording, voiceSupported } from '../../lib/voice';

const STARTERS = ['Salut 👋 ça va ?', 'Tu fais quoi ce weekend ?', 'On se capte autour d\'un café ? ☕', 'Raconte-moi un truc sur toi 😄'];

function playAudio(url: string) {
  if (Platform.OS === 'web' && typeof Audio !== 'undefined') {
    try { const a = new Audio(url); a.play(); } catch {}
  }
}

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [mediaMin, setMediaMin] = useState(5);
  const [msgsLeft, setMsgsLeft] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<Recorder | null>(null);
  const scroller = useRef<ScrollView>(null);

  const REASONS = ['Faux profil / arnaque', 'Photos inappropriées', 'Harcèlement / insultes', 'Spam / pub', 'Autre'];
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2600); };
  const scrollDown = () => setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);

  async function doBlock() { setMenu(false); if (user) await api.block(user.id); router.back(); }
  async function doReport(reason: string) {
    setReportOpen(false);
    if (user) await api.report(user.id, reason);
    flash('Merci, signalement envoyé. Notre équipe va vérifier.');
  }

  useEffect(() => {
    if (!id) return;
    api.messages(id).then((d) => { setUser(d.user); setMsgs(d.messages); setUnlocked(d.mediaUnlocked); setMediaMin(d.mediaMin || 5); setMsgsLeft(d.msgsLeft); });
  }, [id]);

  async function send() {
    const t = text.trim();
    if (!t || !id) return;
    if (msgsLeft === 0) { flash('Limite de messages du jour atteinte — passe Premium.'); router.push('/store'); return; }
    setText('');
    setMsgs((m) => [...m, { from: 'me', text: t, kind: 'text' }]);
    const res = await api.send(id, t);
    if (res?.error === 'msg_limit') { flash(res.message || 'Limite atteinte.'); setMsgsLeft(0); router.push('/store'); return; }
    if (res?.messages) setMsgs(res.messages);
    if (typeof res?.mediaUnlocked === 'boolean') setUnlocked(res.mediaUnlocked);
    if (res?.msgsLeft !== undefined) setMsgsLeft(res.msgsLeft);
    scrollDown();
  }

  async function sendMedia(kind: 'image' | 'audio', dataUrl: string) {
    if (!id) return;
    setUploading(true);
    try {
      const up = await api.upload(dataUrl);
      if (!up?.url) { flash('Échec de l\'envoi, réessaie.'); return; }
      const res = await api.sendMedia(id, kind, up.url);
      if (res?.error === 'locked') { flash(res.message || 'Pas encore débloqué.'); return; }
      if (res?.error === 'msg_limit') { flash(res.message || 'Limite atteinte.'); setMsgsLeft(0); router.push('/store'); return; }
      if (res?.messages) setMsgs(res.messages);
      if (typeof res?.mediaUnlocked === 'boolean') setUnlocked(res.mediaUnlocked);
      if (res?.msgsLeft !== undefined) setMsgsLeft(res.msgsLeft);
      scrollDown();
    } catch { flash('Échec de l\'envoi, réessaie.'); }
    finally { setUploading(false); }
  }

  async function onPickImage() {
    if (!unlocked) { flash(`📸 Photos & vocaux débloqués après ${mediaMin} messages échangés.`); return; }
    const dataUrl = await pickImageDataUrl();
    if (dataUrl) await sendMedia('image', dataUrl);
  }

  async function onMicPress() {
    if (!unlocked) { flash(`🎤 Photos & vocaux débloqués après ${mediaMin} messages échangés.`); return; }
    if (recording) {
      const rec = recRef.current; recRef.current = null; setRecording(false);
      const dataUrl = rec ? await rec.stop() : null;
      if (dataUrl) await sendMedia('audio', dataUrl);
      return;
    }
    if (!voiceSupported()) { flash('Micro non dispo sur cet appareil (bientôt sur l\'app mobile).'); return; }
    const rec = await startRecording();
    if (!rec) { flash('Micro refusé. Autorise l\'accès au micro.'); return; }
    recRef.current = rec; setRecording(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={theme.primary} />
        </Pressable>
        {user ? (
          <Pressable style={styles.peer} onPress={() => router.push(`/u/${user.id}`)}>
            <Avatar user={user} size={42} />
            <View>
              <Text style={styles.peerName}>{user.name}, {user.age}</Text>
              <Text style={styles.peerCity}>📍 {user.city || user.region} · voir le profil</Text>
            </View>
          </Pressable>
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
          <View style={[styles.bubble, styles.them]}>
            <Text style={styles.themText}>Vous avez matché ! 🎉 Lance la conversation 👇</Text>
          </View>
          {msgs.map((m, i) => {
            const mine = m.from === 'me';
            if (m.kind === 'image' && m.media) {
              return (
                <View key={i} style={[styles.mediaBubble, mine ? styles.meAlign : styles.themAlign]}>
                  <Image source={{ uri: m.media }} style={styles.msgImg} resizeMode="cover" />
                </View>
              );
            }
            if (m.kind === 'audio' && m.media) {
              return (
                <Pressable key={i} onPress={() => playAudio(m.media!)} style={[styles.bubble, styles.audioBubble, mine ? styles.me : styles.them]}>
                  <Ionicons name="play" size={16} color={mine ? '#fff' : theme.primary} />
                  <View style={styles.waveRow}>
                    {[10, 16, 8, 20, 12, 18, 9].map((h, k) => (
                      <View key={k} style={[styles.waveBar, { height: h, backgroundColor: mine ? 'rgba(255,255,255,0.75)' : theme.primary }]} />
                    ))}
                  </View>
                  <Text style={mine ? styles.meText : styles.themText}>vocal</Text>
                </Pressable>
              );
            }
            return (
              <View key={i} style={[styles.bubble, mine ? styles.me : styles.them]}>
                <Text style={mine ? styles.meText : styles.themText}>{m.text}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Suggestions de démarrage (uniquement au début) */}
        {msgs.length === 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.starterRow}>
            {STARTERS.map((t) => (
              <Pressable key={t} style={styles.starter} onPress={() => setText(t)}>
                <Text style={styles.starterText}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* Bandeau verrou média */}
        {!unlocked ? (
          <View style={styles.lockBar}>
            <Ionicons name="lock-closed" size={13} color={theme.muted} />
            <Text style={styles.lockTxt}>Photos & vocaux débloqués après {mediaMin} messages échangés</Text>
          </View>
        ) : null}

        {/* Compteur de messages gratuits (bas) */}
        {msgsLeft !== null && msgsLeft <= 5 ? (
          <Pressable style={styles.msgLeftBar} onPress={() => router.push('/store')}>
            <Ionicons name="chatbubble-ellipses" size={13} color={theme.gold} />
            <Text style={styles.msgLeftTxt}>
              {msgsLeft === 0 ? 'Limite du jour atteinte — ' : `Il te reste ${msgsLeft} message${msgsLeft > 1 ? 's' : ''} aujourd'hui · `}
              <Text style={{ fontWeight: '900', color: theme.primary }}>Premium = illimité</Text>
            </Text>
          </Pressable>
        ) : null}

        {/* Barre d'envoi en enregistrement */}
        {recording ? (
          <View style={styles.recBar}>
            <View style={styles.recDot} />
            <Text style={styles.recTxt}>Enregistrement… relâche pour envoyer</Text>
            <Pressable style={styles.recStop} onPress={onMicPress}><Ionicons name="stop" size={18} color="#fff" /></Pressable>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <Pressable style={styles.iconBtn} onPress={onPickImage} disabled={uploading}>
              <Ionicons name="image-outline" size={22} color={unlocked ? theme.primary : theme.muted} />
            </Pressable>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Écris un message..."
              placeholderTextColor="#C3BCC7"
              onSubmitEditing={send}
              returnKeyType="send"
            />
            {text.trim() ? (
              <Pressable style={styles.sendBtn} onPress={send}><Ionicons name="send" size={18} color="#fff" /></Pressable>
            ) : uploading ? (
              <View style={styles.sendBtn}><ActivityIndicator color="#fff" size="small" /></View>
            ) : (
              <Pressable style={styles.sendBtn} onPress={onMicPress}><Ionicons name="mic" size={20} color="#fff" /></Pressable>
            )}
          </View>
        )}
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

  meAlign: { alignSelf: 'flex-end' },
  themAlign: { alignSelf: 'flex-start' },
  mediaBubble: { maxWidth: '70%', borderRadius: 18, overflow: 'hidden' },
  msgImg: { width: 200, height: 200, borderRadius: 18, backgroundColor: theme.line },
  audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 150 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  waveBar: { width: 3, borderRadius: 2 },

  starterRow: { gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  starter: { backgroundColor: theme.tint, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  starterText: { fontSize: 13, color: theme.primaryDark, fontWeight: '700' },

  lockBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, backgroundColor: theme.bg },
  lockTxt: { color: theme.muted, fontSize: 11.5, fontWeight: '600' },
  msgLeftBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: '#FFF3E9' },
  msgLeftTxt: { color: '#C25A18', fontSize: 12, fontWeight: '700' },

  recBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: '#fff' },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.danger },
  recTxt: { flex: 1, color: theme.ink, fontWeight: '700', fontSize: 14 },
  recStop: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.danger, alignItems: 'center', justifyContent: 'center' },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: '#fff' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
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
