import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../lib/theme';

type Props = {
  label?: string;
  value?: string;
  placeholder?: string;
  options: readonly string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  icon?: any;
};

export function Select({ label, value, placeholder, options, onChange, disabled, icon }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => { if (!disabled) setOpen(true); }}
      >
        {icon ? <Ionicons name={icon} size={18} color={theme.muted} style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder || 'Choisir…'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{label || placeholder || 'Choisir'}</Text>
              <Pressable hitSlop={10} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={theme.ink} />
              </Pressable>
            </View>
            <FlatList
              data={options as string[]}
              keyExtractor={(x) => x}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <Pressable style={styles.opt} onPress={() => { onChange(item); setOpen(false); }}>
                    <Text style={[styles.optTxt, active && styles.optTxtActive]}>{item}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={theme.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.muted, fontWeight: '800', fontSize: 12, marginTop: 12, marginBottom: 5 },
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: theme.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  fieldDisabled: { backgroundColor: theme.bg, opacity: 0.6 },
  value: { flex: 1, color: theme.ink, fontSize: 15, fontWeight: '600' },
  placeholder: { color: '#B7ADD0', fontWeight: '400' },

  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,40,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26, maxHeight: '80%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: theme.line, marginBottom: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: theme.ink },
  opt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  optTxt: { fontSize: 16, color: theme.ink, fontWeight: '600' },
  optTxtActive: { color: theme.primary, fontWeight: '800' },
});
