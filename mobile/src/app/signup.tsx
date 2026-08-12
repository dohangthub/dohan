import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '../lib/api';
import { COMMUNES_BY_REGION, REGIONS } from '../lib/communes';

const V = { bg: '#FFFFFF', violet: '#7C3AED', violetLight: '#9B6DFF', ink: '#1C1630', muted: '#6E6690', line: '#EBE5F7', field: '#F6F2FF' };
const GRAD = ['#9B6DFF', '#6D28D9'] as [string, string];
const TOTAL = 6;

export default function Signup() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'H' | 'F' | 'A' | ''>('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  const next = () => setStep((s) => Math.min(TOTAL - 1, s + 1));
  const back = () => (step === 0 ? router.push('/welcome') : setStep((s) => s - 1));

  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      await api.saveProfile({ name: name || 'Moi', gender: gender || undefined, age: age || undefined, region: region || undefined, city: city || undefined } as any);
    } catch {}
    setBusy(false);
    router.replace('/');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: V.bg }} contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      {/* En-tête : retour + progression */}
      <View style={styles.top}>
        <Pressable onPress={back} style={styles.back}><Ionicons name="chevron-back" size={26} color={V.violet} /></Pressable>
        <View style={styles.track}><View style={[styles.fill, { width: `${((step + 1) / TOTAL) * 100}%` }]} /></View>
        {step >= 3 ? <Pressable onPress={step === TOTAL - 1 ? finish : next}><Text style={styles.skip}>Plus tard</Text></Pressable> : <View style={{ width: 60 }} />}
      </View>

      <View style={styles.body}>
        {step === 0 && (
          <Step title="Crée ton compte" sub="Ça prend 1 minute, promis 🔥">
            <Field label="Email" value={email} onChange={setEmail} placeholder="toi@email.com" keyboard="email-address" />
            <Field label="Mot de passe" value={pwd} onChange={setPwd} placeholder="••••••••" secure />
            <Primary label="Continuer" onPress={next} disabled={!email.includes('@') || pwd.length < 4} />
          </Step>
        )}

        {step === 1 && (
          <Step title="Confirme ton email" sub={`On a envoyé un code à ${email || 'ton email'}.`}>
            <View style={styles.mailIcon}><Ionicons name="mail-open" size={30} color={V.violet} /></View>
            <Field label="Code à 4 chiffres" value={code} onChange={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))} placeholder="1234" keyboard="number-pad" center />
            <Primary label="Confirmer" onPress={next} disabled={code.length < 4} />
            <Pressable onPress={() => {}}><Text style={styles.linkC}>Renvoyer le code</Text></Pressable>
          </Step>
        )}

        {step === 2 && (
          <Step title="Comment tu t'appelles ?" sub="Ton prénom s'affichera sur ton profil.">
            <Field label="Prénom" value={name} onChange={setName} placeholder="Ton prénom" autoFocus />
            <Primary label="Continuer" onPress={next} disabled={!name.trim()} />
          </Step>
        )}

        {step === 3 && (
          <Step title="Je suis..." sub="Pour te proposer les bons profils.">
            <View style={{ gap: 12, marginTop: 6 }}>
              {[['F', 'Une femme', '👩'], ['H', 'Un homme', '👨'], ['A', 'Autre / Je préfère ne pas dire', '✨']].map(([g, lbl, emo]) => (
                <Pressable key={g} style={[styles.choice, gender === g && styles.choiceOn]} onPress={() => { setGender(g as any); setTimeout(next, 180); }}>
                  <Text style={{ fontSize: 22 }}>{emo}</Text>
                  <Text style={[styles.choiceTxt, gender === g && { color: V.violet }]}>{lbl}</Text>
                  {gender === g ? <Ionicons name="checkmark-circle" size={20} color={V.violet} /> : <View style={{ width: 20 }} />}
                </Pressable>
              ))}
            </View>
          </Step>
        )}

        {step === 4 && (
          <Step title="Ton âge" sub="Tu dois avoir 18 ans ou plus.">
            <Field label="Âge" value={age} onChange={(t) => setAge(t.replace(/\D/g, '').slice(0, 2))} placeholder="24" keyboard="number-pad" center />
            <Primary label="Continuer" onPress={next} disabled={!age || parseInt(age, 10) < 18} />
          </Step>
        )}

        {step === 5 && (
          <Step title="Tu es où ?" sub="Choisis ta région — pour rencontrer des gens près de toi.">
            <Text style={styles.miniLabel}>Région</Text>
            <View style={styles.cities}>
              {REGIONS.map((r) => (
                <Pressable key={r} style={[styles.cityChip, region === r && styles.cityChipOn]} onPress={() => { setRegion(r); setCity(''); }}>
                  <Text style={[styles.cityTxt, region === r && { color: '#fff' }]}>{r}</Text>
                </Pressable>
              ))}
            </View>

            {region ? (
              <>
                <Text style={styles.miniLabel}>Quartier / commune <Text style={{ color: V.muted, fontWeight: '600' }}>· optionnel</Text></Text>
                <View style={styles.cities}>
                  {(COMMUNES_BY_REGION[region] || []).map((c) => (
                    <Pressable key={c} style={[styles.cityChipSm, city === c && styles.cityChipOn]} onPress={() => setCity(city === c ? '' : c)}>
                      <Text style={[styles.cityTxtSm, city === c && { color: '#fff' }]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <Primary label={busy ? 'Création…' : 'Terminer 🎉'} onPress={finish} disabled={!region} />
          </Step>
        )}
      </View>
    </ScrollView>
  );
}

function Step({ title, sub, children }: any) {
  return (
    <View style={{ gap: 6 }}>
      <LinearGradient colors={GRAD} style={styles.logo}><Ionicons name="heart" size={20} color="#fff" /></LinearGradient>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
      <View style={{ height: 8 }} />
      {children}
    </View>
  );
}
function Field({ label, value, onChange, placeholder, secure, keyboard, autoFocus, center }: any) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, center && { textAlign: 'center', fontSize: 22, letterSpacing: 4 }]} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor="#B7ADD0" secureTextEntry={secure} keyboardType={keyboard} autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'} autoFocus={autoFocus}
      />
    </View>
  );
}
function Primary({ label, onPress, disabled }: any) {
  return (
    <Pressable style={[styles.primary, disabled && { opacity: 0.4 }]} onPress={disabled ? undefined : onPress} disabled={disabled}>
      <Text style={styles.primaryTxt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16 },
  back: { padding: 2 },
  track: { flex: 1, height: 6, borderRadius: 999, backgroundColor: V.field, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 999, backgroundColor: V.violet },
  skip: { color: V.muted, fontWeight: '700', width: 60, textAlign: 'right' },
  body: { flex: 1, justifyContent: 'center', maxWidth: 440, width: '100%', alignSelf: 'center', paddingVertical: 30 },

  logo: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { color: V.ink, fontWeight: '900', fontSize: 28, letterSpacing: -0.5 },
  sub: { color: V.muted, fontSize: 15, lineHeight: 22 },
  label: { color: V.muted, fontWeight: '700', fontSize: 12, marginTop: 14, marginBottom: 5 },
  input: { backgroundColor: V.field, borderWidth: 1, borderColor: V.line, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 15, color: V.ink, fontSize: 16 },
  primary: { backgroundColor: V.violet, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  primaryTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkC: { color: V.violet, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  mailIcon: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: V.field, alignItems: 'center', justifyContent: 'center', marginVertical: 10 },

  choice: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderColor: V.line, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 18 },
  choiceOn: { borderColor: V.violet, backgroundColor: V.field },
  choiceTxt: { flex: 1, color: V.ink, fontWeight: '800', fontSize: 16 },

  cities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 4 },
  cityChip: { borderWidth: 1.5, borderColor: V.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  cityChipSm: { borderWidth: 1.5, borderColor: V.line, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  cityChipOn: { backgroundColor: V.violet, borderColor: V.violet },
  cityTxt: { color: V.ink, fontWeight: '700' },
  cityTxtSm: { color: V.ink, fontWeight: '600', fontSize: 13 },
  miniLabel: { color: V.muted, fontWeight: '800', fontSize: 12, marginTop: 14 },
});
