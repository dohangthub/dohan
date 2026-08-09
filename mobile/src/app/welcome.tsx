import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const V = { bg: '#FFFFFF', soft: '#F6F2FF', violet: '#7C3AED', violetLight: '#9B6DFF', ink: '#1C1630', muted: '#6E6690', line: '#EBE5F7' };
const GRAD = ['#9B6DFF', '#6D28D9'] as [string, string];

const CARDS = [
  { name: 'Awa, 24', city: 'Dakar', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=680&fit=crop&crop=faces&q=80' },
  { name: 'Moussa, 27', city: 'Dakar', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=680&fit=crop&crop=faces&q=80' },
  { name: 'Fatou, 27', city: 'Thiès', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=680&fit=crop&crop=faces&q=80' },
];
const FEATURES = [
  { icon: 'flame', title: 'Swipe & Match', text: 'Trouve ton crush près de chez toi, à Dakar comme ailleurs.' },
  { icon: 'newspaper', title: 'Feed social', text: 'Poste tes photos, découvre les gens par leur contenu, pas qu\'une photo.' },
  { icon: 'shield-checkmark', title: 'Profils vérifiés', text: 'Badge de vérification anti-arnaque. Tu sais à qui tu parles.' },
  { icon: 'chatbubbles', title: 'Tu contrôles tes DM', text: 'Toi seul décides qui peut t\'écrire. Fini le harcèlement.' },
] as const;
const STEPS = [
  { n: '1', title: 'Crée ton profil', text: 'Photo, bio, centres d\'intérêt — en 2 minutes.' },
  { n: '2', title: 'Découvre', text: 'Swipe, explore le feed, réagis, commente.' },
  { n: '3', title: 'Connecte-toi', text: 'Match, discute, rencontre. En vrai.' },
];
const PLANS = [
  { name: 'Gratuit', price: '0', unit: '', feats: ['Swipe (10 likes/jour)', 'Feed, posts, commentaires', 'Chat une fois matché'], cta: 'Commencer', highlight: false },
  { name: 'Premium', price: '1 000', unit: 'FCFA / sem', feats: ['Vois qui t\'a liké', 'Likes illimités', 'Mode incognito'], cta: 'Passer Premium', highlight: true },
  { name: 'Boost', price: '300', unit: 'FCFA', feats: ['En tête pendant 1h', 'Jusqu\'à 5× plus de vues', 'À l\'unité, quand tu veux'], cta: 'Booster', highlight: false },
];

function Logo({ size = 22, light }: { size?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LinearGradient colors={GRAD} style={{ width: size * 1.4, height: size * 1.4, borderRadius: size * 0.42, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="heart" size={size * 0.8} color="#fff" />
      </LinearGradient>
      <Text style={{ color: light ? '#fff' : V.ink, fontWeight: '900', fontSize: size }}>Sen<Text style={{ color: V.violet }}>Love</Text></Text>
    </View>
  );
}

export default function Welcome() {
  const { width } = useWindowDimensions();
  const wide = width > 900;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: V.bg }} showsVerticalScrollIndicator={false}>
      {/* NAV */}
      <View style={styles.nav}>
        <View style={[styles.navInner, { maxWidth: 1150 }]}>
          <Logo />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => router.push('/login')}><Text style={styles.navLink}>Se connecter</Text></Pressable>
            <Pressable style={styles.navCta} onPress={() => router.push('/signup')}><Text style={styles.navCtaTxt}>S'inscrire</Text></Pressable>
          </View>
        </View>
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <View style={[styles.orb, { top: -60, left: -80 }]} />
        <View style={[styles.orb, { bottom: -140, right: -60, width: 420, height: 420, backgroundColor: '#EDE6FF' }]} />
        <View style={[styles.heroInner, { maxWidth: 1150, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: wide ? 40 : 28 }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.badge}><Text style={styles.badgeTxt}>🇸🇳 N°1 de la rencontre au Sénégal</Text></View>
            <Text style={[styles.h1, { fontSize: wide ? 60 : 38 }]}>Rencontre.{'\n'}Partage.{'\n'}<Text style={{ color: V.violet }}>Aime.</Text></Text>
            <Text style={styles.heroSub}>
              L'app de rencontre + réseau social pensée pour Dakar. Swipe, poste, discute — en toute confiance, avec paiement Wave & Orange Money.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 26 }}>
              <Pressable style={styles.ctaPrimary} onPress={() => router.push('/signup')}>
                <Text style={styles.ctaPrimaryTxt}>S'inscrire gratuitement</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
              <Pressable style={styles.ctaGhost} onPress={() => router.push('/')}>
                <Text style={styles.ctaGhostTxt}>Découvrir l'app</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 26, marginTop: 30 }}>
              {[['10k+', 'membres'], ['4.8★', 'note'], ['100%', 'local']].map(([a, b]) => (
                <View key={b}><Text style={styles.statN}>{a}</Text><Text style={styles.statL}>{b}</Text></View>
              ))}
            </View>
          </View>

          <View style={[styles.cardsWrap, { height: wide ? 460 : 380 }]}>
            {CARDS.map((c, i) => (
              <View key={c.name} style={[styles.floatCard, {
                transform: [{ rotate: `${(i - 1) * 7}deg` }, { translateX: (i - 1) * (wide ? 70 : 54) }, { translateY: i === 1 ? -14 : 12 }],
                zIndex: i === 1 ? 3 : 1,
              }]}>
                <Image source={{ uri: c.img }} resizeMode="cover" style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} />
                {i === 1 ? <View style={styles.matchTag}><Ionicons name="heart" size={11} color="#fff" /><Text style={styles.matchTagTxt}>Match</Text></View> : null}
                <View style={{ position: 'absolute', bottom: 12, left: 12 }}>
                  <Text style={styles.floatName}>{c.name}</Text>
                  <Text style={styles.floatCity}>📍 {c.city}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* FEATURES (soft) */}
      <Section soft title="Bien plus qu'une app de rencontre" sub="Rencontre ET réseau social. Ce que Tinder et Insta ne font pas ensemble.">
        <View style={[styles.grid, { maxWidth: 1000 }]}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[styles.featCard, { width: wide ? '47%' : '100%' }]}>
              <View style={styles.featIcon}><Ionicons name={f.icon as any} size={22} color={V.violet} /></View>
              <Text style={styles.featTitle}>{f.title}</Text>
              <Text style={styles.featTxt}>{f.text}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* HOW */}
      <Section title="Comment ça marche" sub="3 étapes, 2 minutes.">
        <View style={[styles.grid, { maxWidth: 1000, justifyContent: 'center' }]}>
          {STEPS.map((s) => (
            <View key={s.n} style={[styles.step, { width: wide ? '30%' : '100%' }]}>
              <LinearGradient colors={GRAD} style={styles.stepN}><Text style={styles.stepNTxt}>{s.n}</Text></LinearGradient>
              <Text style={styles.featTitle}>{s.title}</Text>
              <Text style={[styles.featTxt, { textAlign: 'center' }]}>{s.text}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* PRICING (soft) */}
      <Section soft title="Des prix pensés pour le Sénégal" sub="Paie avec Wave ou Orange Money. Aucun engagement.">
        <View style={[styles.grid, { maxWidth: 1000, alignItems: 'stretch', justifyContent: 'center' }]}>
          {PLANS.map((p) => (
            <View key={p.name} style={[styles.planCard, { width: wide ? '30%' : '100%' }, p.highlight && styles.planHi]}>
              {p.highlight ? <View style={styles.planBadge}><Text style={styles.planBadgeTxt}>Populaire</Text></View> : null}
              <Text style={styles.planName}>{p.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginVertical: 6 }}>
                <Text style={styles.planPrice}>{p.price}</Text><Text style={styles.planUnit}>{p.unit}</Text>
              </View>
              {p.feats.map((ft) => (
                <View key={ft} style={styles.planFeat}><Ionicons name="checkmark-circle" size={16} color={V.violet} /><Text style={styles.planFeatTxt}>{ft}</Text></View>
              ))}
              <Pressable style={[styles.planBtn, p.highlight && styles.planBtnHi]} onPress={() => router.push('/signup')}>
                <Text style={[styles.planBtnTxt, p.highlight && { color: '#fff' }]}>{p.cta}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Section>

      {/* CTA BAND */}
      <View style={styles.ctaBandWrap}>
        <LinearGradient colors={GRAD} style={[styles.ctaBand, { maxWidth: 1000 }]}>
          <Text style={styles.ctaBandTitle}>Ton crush t'attend déjà.</Text>
          <Text style={styles.ctaBandSub}>Rejoins SenLove aujourd'hui — c'est gratuit.</Text>
          <Pressable style={styles.ctaBandBtn} onPress={() => router.push('/signup')}>
            <Text style={styles.ctaBandBtnTxt}>Créer mon compte</Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={[styles.footerInner, { maxWidth: 1150, flexDirection: wide ? 'row' : 'column', gap: wide ? 40 : 28 }]}>
          <View style={{ flex: wide ? 1.4 : undefined, gap: 12 }}>
            <Logo />
            <Text style={styles.footerTag}>Rencontrez. Partagez. Connectez-vous.{'\n'}Fait au Sénégal 🇸🇳</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              {['logo-instagram', 'logo-tiktok', 'logo-whatsapp', 'logo-facebook'].map((ic) => (
                <View key={ic} style={styles.social}><Ionicons name={ic as any} size={17} color={V.muted} /></View>
              ))}
            </View>
          </View>
          <FooterCol title="Produit" links={['Fonctionnalités', 'Premium', 'Boost', 'Télécharger']} />
          <FooterCol title="Entreprise" links={['À propos', 'Blog', 'Carrières', 'Contact']} />
          <FooterCol title="Légal" links={['Conditions', 'Confidentialité', 'Cookies', 'Sécurité']} />
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.copy}>© 2026 SenLove. Tous droits réservés.</Text>
          <Text style={styles.copy}>Dakar, Sénégal</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Section({ title, sub, children, soft }: { title: string; sub: string; children: React.ReactNode; soft?: boolean }) {
  return (
    <View style={[styles.section, soft && { backgroundColor: V.soft }]}>
      <Text style={styles.sTitle}>{title}</Text>
      <Text style={styles.sSub}>{sub}</Text>
      {children}
    </View>
  );
}
function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <View style={{ gap: 10, minWidth: 130 }}>
      <Text style={styles.footerColTitle}>{title}</Text>
      {links.map((l) => <Text key={l} style={styles.footerLink}>{l}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: V.line },
  navInner: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navLink: { color: V.ink, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 10 },
  navCta: { backgroundColor: V.violet, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  navCtaTxt: { color: '#fff', fontWeight: '800' },

  hero: { paddingHorizontal: 20, paddingTop: 44, paddingBottom: 64, alignItems: 'center', overflow: 'hidden' },
  orb: { position: 'absolute', width: 320, height: 320, borderRadius: 320, backgroundColor: '#F3ECFF' },
  heroInner: { width: '100%' },
  badge: { alignSelf: 'flex-start', backgroundColor: V.soft, borderWidth: 1, borderColor: V.line, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginBottom: 20 },
  badgeTxt: { color: V.violet, fontWeight: '700', fontSize: 13 },
  h1: { color: V.ink, fontWeight: '900', letterSpacing: -1 },
  heroSub: { color: V.muted, fontSize: 17, lineHeight: 26, marginTop: 18, maxWidth: 460 },
  ctaPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: V.violet, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14 },
  ctaPrimaryTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  ctaGhost: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: V.line },
  ctaGhostTxt: { color: V.ink, fontWeight: '800', fontSize: 15 },
  statN: { color: V.ink, fontWeight: '900', fontSize: 22 },
  statL: { color: V.muted, fontSize: 13 },

  cardsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 280 },
  floatCard: { position: 'absolute', width: 190, height: 260, borderRadius: 22, overflow: 'hidden', backgroundColor: '#EDE7FA', borderWidth: 4, borderColor: '#fff', shadowColor: '#2E1065', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  matchTag: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: V.violet, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  matchTagTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  floatName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  floatCity: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },

  section: { paddingHorizontal: 20, paddingVertical: 56, alignItems: 'center' },
  sTitle: { color: V.ink, fontWeight: '900', fontSize: 30, textAlign: 'center', letterSpacing: -0.5 },
  sSub: { color: V.muted, fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 30, maxWidth: 520 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'space-between' },
  featCard: { backgroundColor: '#fff', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: V.line, gap: 8, shadowColor: '#2E1065', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  featIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: V.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  featTitle: { color: V.ink, fontWeight: '800', fontSize: 18 },
  featTxt: { color: V.muted, fontSize: 15, lineHeight: 22 },
  step: { alignItems: 'center', gap: 8, padding: 12 },
  stepN: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepNTxt: { color: '#fff', fontWeight: '900', fontSize: 20 },

  planCard: { backgroundColor: '#fff', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: V.line, gap: 6, shadowColor: '#2E1065', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  planHi: { borderColor: V.violet, borderWidth: 2 },
  planBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: V.violet, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  planBadgeTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
  planName: { color: V.ink, fontWeight: '800', fontSize: 18 },
  planPrice: { color: V.ink, fontWeight: '900', fontSize: 34 },
  planUnit: { color: V.muted, fontSize: 14, marginBottom: 6 },
  planFeat: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  planFeatTxt: { color: V.muted, fontSize: 14, flex: 1 },
  planBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: V.line },
  planBtnHi: { backgroundColor: V.violet, borderColor: V.violet },
  planBtnTxt: { color: V.ink, fontWeight: '800' },

  ctaBandWrap: { paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' },
  ctaBand: { width: '100%', borderRadius: 28, padding: 44, alignItems: 'center', gap: 10 },
  ctaBandTitle: { color: '#fff', fontWeight: '900', fontSize: 30, textAlign: 'center' },
  ctaBandSub: { color: 'rgba(255,255,255,0.92)', fontSize: 16, textAlign: 'center' },
  ctaBandBtn: { backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 15, borderRadius: 14, marginTop: 8 },
  ctaBandBtnTxt: { color: V.violet, fontWeight: '900', fontSize: 15 },

  footer: { borderTopWidth: 1, borderTopColor: V.line, paddingTop: 44, alignItems: 'center', backgroundColor: V.soft },
  footerInner: { width: '100%', paddingHorizontal: 20 },
  footerTag: { color: V.muted, fontSize: 14, lineHeight: 21 },
  social: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: V.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  footerColTitle: { color: V.ink, fontWeight: '800', fontSize: 15, marginBottom: 2 },
  footerLink: { color: V.muted, fontSize: 14 },
  footerBottom: { width: '100%', maxWidth: 1150, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: V.line, marginTop: 36, paddingVertical: 20, paddingHorizontal: 20 },
  copy: { color: V.muted, fontSize: 13 },
});
