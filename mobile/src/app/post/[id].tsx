import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/ui';
import { Comment, REACTIONS, api } from '../../lib/api';
import { shadow, theme } from '../../lib/theme';

function summary(c: Comment) {
  const map: Record<string, number> = { ...(c.reactions || {}) };
  const entries = Object.entries(map).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return { emojis: entries.slice(0, 3).map(([e]) => e), total: entries.reduce((s, [, n]) => s + n, 0) };
}

export default function PostComments() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [reactFor, setReactFor] = useState<Comment | null>(null);

  const load = useCallback(() => {
    if (id) api.comments(id).then((d) => setComments(d.comments)).catch(() => {});
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function send() {
    const t = text.trim();
    if (!t || !id) return;
    setText('');
    const parent = replyTo?.id;
    setReplyTo(null);
    await api.addComment(id, t, parent);
    load();
  }
  function like(c: Comment) {
    setComments((cs) => cs.map((x) => (x.id === c.id ? { ...x, likes: x.likes + 1 } : x)));
    api.likeComment(c.id).catch(() => {});
  }
  function react(c: Comment, emoji: string) {
    setReactFor(null);
    setComments((cs) => cs.map((x) => (x.id === c.id
      ? { ...x, reactions: { ...x.reactions, [emoji]: (x.reactions[emoji] || 0) + 1 } } : x)));
    api.reactComment(c.id, emoji).catch(() => {});
  }

  const top = comments.filter((c) => !c.parentId);
  const repliesOf = (cid: string) => comments.filter((c) => c.parentId === cid);

  const renderComment = (c: Comment, isReply = false) => {
    const s = summary(c);
    return (
      <View key={c.id} style={[styles.cRow, isReply && styles.reply]}>
        <Avatar user={c.author} size={isReply ? 32 : 38} />
        <View style={{ flex: 1 }}>
          <View style={styles.bubble}>
            <View style={styles.cNameRow}>
              <Text style={styles.cName}>{c.author.name}{c.author.age ? `, ${c.author.age}` : ''}</Text>
              {c.author.verified ? <Ionicons name="checkmark-circle" size={13} color={theme.primary} /> : null}
            </View>
            <Text style={styles.cBody}>{c.body}</Text>
          </View>
          <View style={styles.cActions}>
            <Pressable onPress={() => like(c)}><Text style={styles.cAction}>❤️ {c.likes || 0}</Text></Pressable>
            <Pressable onPress={() => setReactFor(c)}><Text style={styles.cAction}>😊 Réagir</Text></Pressable>
            {!isReply ? <Pressable onPress={() => setReplyTo(c)}><Text style={styles.cAction}>Répondre</Text></Pressable> : null}
            {s.total > 0 ? <Text style={styles.cReacts}>{s.emojis.join('')} {s.total}</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={theme.primary} />
        </Pressable>
        <Text style={styles.title}>Commentaires</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.list}>
          {top.length === 0 ? (
            <Text style={styles.empty}>Aucun commentaire. Lance la discussion 👇</Text>
          ) : (
            top.map((c) => (
              <View key={c.id} style={{ gap: 8 }}>
                {renderComment(c)}
                {repliesOf(c.id).map((r) => renderComment(r, true))}
              </View>
            ))
          )}
          <View style={{ height: 12 }} />
        </ScrollView>

        {replyTo ? (
          <View style={styles.replyBar}>
            <Text style={styles.replyTxt}>Réponse à <Text style={{ fontWeight: '800' }}>{replyTo.author.name}</Text></Text>
            <Pressable onPress={() => setReplyTo(null)}><Ionicons name="close" size={16} color={theme.muted} /></Pressable>
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={text} onChangeText={setText}
            placeholder={replyTo ? 'Ta réponse...' : 'Ajoute un commentaire...'} placeholderTextColor="#C3BCC7"
            onSubmitEditing={send} returnKeyType="send" />
          <Pressable style={styles.send} onPress={send}><Ionicons name="send" size={18} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!reactFor} transparent animationType="fade" onRequestClose={() => setReactFor(null)}>
        <Pressable style={styles.reactBackdrop} onPress={() => setReactFor(null)}>
          <View style={styles.reactBar}>
            {REACTIONS.map((e) => (
              <Pressable key={e} style={{ paddingHorizontal: 4 }} onPress={() => reactFor && react(reactFor, e)}>
                <Text style={{ fontSize: 30 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.line, backgroundColor: '#fff' },
  back: { padding: 4 },
  title: { fontWeight: '800', color: theme.ink, fontSize: 17 },
  list: { padding: 14, gap: 14 },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 40 },

  cRow: { flexDirection: 'row', gap: 10 },
  reply: { marginLeft: 40 },
  bubble: { backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadow, shadowOpacity: 0.05 },
  cNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  cName: { fontWeight: '800', color: theme.ink, fontSize: 14 },
  cBody: { color: theme.ink, fontSize: 15, lineHeight: 20 },
  cActions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 6, paddingTop: 6 },
  cAction: { color: theme.muted, fontWeight: '700', fontSize: 13 },
  cReacts: { color: theme.muted, fontSize: 13, fontWeight: '600' },

  replyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F1EBFF' },
  replyTxt: { color: theme.ink, fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: theme.ink },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },

  reactBackdrop: { flex: 1, backgroundColor: 'rgba(20,8,18,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  reactBar: { flexDirection: 'row', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, ...shadow },
});
