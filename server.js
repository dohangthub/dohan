/**
 * SenLove — MVP appli de rencontres (Dakar)
 * Serveur Node.js pur (zéro dépendance) + Supabase (API REST / PostgREST).
 * L'état est persisté dans Supabase. La clé SECRÈTE reste côté serveur.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- Chargement .env (mini loader zéro-dépendance) ----------
(function loadEnv() {
  try {
    const p = path.join(__dirname, '.env');
    if (!fs.existsSync(p)) return;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
})();

const PORT = process.env.PORT || 3000;
// Sert le build web Expo (mobile/dist) s'il existe, sinon le dossier public (dev/redirection)
const WEB_DIST = path.join(__dirname, 'mobile', 'dist');
const PUBLIC = fs.existsSync(path.join(WEB_DIST, 'index.html')) ? WEB_DIST : path.join(__dirname, 'public');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SECRET_KEY;
const ME = 'me';
const FREE_DAILY_LIKES = 5;

// Contrôle des DM (différenciateur sécurité) — politiques par profil, sans colonne DB
const DM_POLICY = { u2: 'requests', u5: 'requests', u8: 'verified' }; // les autres: 'everyone'
const VERIFIED = new Set(['u1', 'u2', 'u4', 'u6', 'u8', 'u10']);
function policyOf(id) { return DM_POLICY[id] || 'everyone'; }
// Réglages de "moi" (en mémoire, démo) : vérifié + qui peut m'écrire
let meState = { verified: false, dmPolicy: 'everyone' };

if (!SUPABASE_URL || !SB_KEY) {
  console.error('\n  ⚠️  SUPABASE_URL ou SUPABASE_SECRET_KEY manquant dans .env\n');
}

// ---------- Client Supabase REST ----------
async function sb(method, pathQuery, body, extraPrefer) {
  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
  };
  const prefer = [];
  if (method === 'POST' || method === 'PATCH') prefer.push('return=representation');
  if (extraPrefer) prefer.push(extraPrefer);
  if (prefer.length) headers.Prefer = prefer.join(',');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathQuery}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) { const e = new Error('supabase'); e.status = res.status; e.data = data; throw e; }
  return data;
}

// ---------- Supabase Storage (upload d'images) ----------
async function storage(method, pathQuery, body, contentType) {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  if (contentType) headers['Content-Type'] = contentType;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/${pathQuery}`, { method, headers, body });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) { const e = new Error('storage'); e.status = res.status; e.data = data; throw e; }
  return data;
}
async function ensureBucket() {
  try {
    await storage('POST', 'bucket', JSON.stringify({ id: 'posts', name: 'posts', public: true }), 'application/json');
    console.log('  🪣 Bucket Storage "posts" créé.');
  } catch (e) { /* existe déjà -> ignore */ }
}

// ---------- Données seed ----------
const GRADS = [
  ['#ff8a5b', '#ff4e73'], ['#5b8cff', '#7b5bff'], ['#12b886', '#0ca678'],
  ['#f6a609', '#ff6b6b'], ['#e64980', '#cc5de8'], ['#20c997', '#4dabf7'],
  ['#ffa94d', '#f76707'], ['#845ef7', '#5c7cfa'], ['#ff6b6b', '#f06595'],
];
const EMO = ['🌺', '🔥', '✨', '🌊', '🦋', '🌙', '💫', '🎧', '📸', '🌴', '☕', '🏝️'];
const SEED = [
  ['Awa', 24, 'Dakar', 'F', 'Étudiante en droit 📚 j\'adore rigoler, la plage & le thiéboudienne du dimanche.', ['Plage', 'Musique', 'Cuisine'], true],
  ['Fatou', 27, 'Dakar', 'F', 'Photographe freelance 📸 Toujours partante pour un sunset aux Almadies.', ['Photo', 'Voyage', 'Café'], true],
  ['Sokhna', 22, 'Thiès', 'F', 'Team foot le weekend ⚽ cherche quelqu\'un de drôle et vrai.', ['Sport', 'Séries', 'Danse'], false],
  ['Mariama', 25, 'Mbour', 'F', 'Coiffeuse 💇🏾‍♀️ souriante, gourmande, un peu trop bavarde 😅', ['Mode', 'Cuisine', 'Musique'], true],
  ['Ndeye', 23, 'Dakar', 'F', 'Danseuse afro 💃 la vie est trop courte pour s\'ennuyer.', ['Danse', 'Sortie', 'Voyage'], false],
  ['Aïcha', 26, 'Saint-Louis', 'F', 'Prof d\'anglais, fan de jazz et de longues discussions 🎷', ['Lecture', 'Musique', 'Café'], true],
  ['Bineta', 21, 'Rufisque', 'F', 'Make-up artist ✨ positive vibes only.', ['Mode', 'Photo', 'Séries'], false],
  ['Coumba', 28, 'Dakar', 'F', 'Entrepreneure 👛 j\'aime les gens ambitieux et marrants.', ['Business', 'Sport', 'Voyage'], true],
  ['Moussa', 27, 'Dakar', 'H', 'Ingénieur le jour, DJ le weekend 🎧 emmène-moi danser.', ['Musique', 'Sport', 'Voyage'], false],
  ['Cheikh', 25, 'Thiès', 'H', 'Basketteur 🏀 chill, drôle, mauvais cuisinier assumé.', ['Sport', 'Séries', 'Jeux'], true],
  ['Ibrahima', 29, 'Dakar', 'H', 'Développeur & foodie 🍜 je connais tous les bons spots de Dakar.', ['Tech', 'Cuisine', 'Ciné'], false],
  ['Modou', 24, 'Mbour', 'H', 'Surf & guitare 🎸 âme voyageuse.', ['Surf', 'Musique', 'Plage'], true],
];
function seedRows() {
  // Toutes les lignes DOIVENT avoir exactement les mêmes clés (contrainte insert groupé PostgREST)
  const me = {
    id: ME, seq: 0, name: 'Moi', age: 25, city: 'Dakar', gender: 'H',
    bio: 'Nouveau sur SenLove 👋', interests: ['Musique', 'Sport'],
    grad: ['#222', '#555'], emoji: '🙂', online: false, likes_me: false,
    is_me: true, premium: false, likes_used: 0,
  };
  const cands = SEED.map((r, i) => ({
    id: 'u' + (i + 1), seq: i + 1, name: r[0], age: r[1], city: r[2], gender: r[3],
    bio: r[4], interests: r[5],
    grad: GRADS[i % GRADS.length], emoji: EMO[i % EMO.length], online: (i % 2 === 0),
    likes_me: r[6], is_me: false, premium: false, likes_used: 0,
  }));
  return [me, ...cands];
}

// Photos Unsplash (mêmes ids que côté app) pour construire les images des posts
const PHOTOS = {
  u1: '1494790108377-be9c29b29330', u2: '1534528741775-53994a69daeb',
  u3: '1544005313-94ddf0286df2', u4: '1517841905240-472988babdf9',
  u5: '1531123897727-8f129e1688ce', u6: '1524250502761-1ac6f2e30d43',
  u7: '1489424731084-a5d8b219a5bb', u8: '1508214751196-bcfd4ca60f91',
  u9: '1507003211169-0a1dd7228f2d', u10: '1506794778202-cad84cf45f1d',
  u11: '1519085360753-af0119f7cbe7', u12: '1508341591423-4347099e1f19',
};
function photoOf(id, w = 700, h = 800) {
  const pid = PHOTOS[id];
  return pid ? `https://images.unsplash.com/photo-${pid}?w=${w}&h=${h}&fit=crop&crop=faces&q=80` : null;
}

// Seed du feed : [author, kind, texte, likes]
const POST_SEED = [
  ['u1', 'photo', 'Journée plage 🌊☀️ #Dakar #Almadies', 34],
  ['u2', 'photo', 'Nouveau shooting 📸 vos avis les gens ?', 58],
  ['u5', 'photo', 'Répétition danse afro 💃🔥 ça donne quoi ?', 41],
  ['u7', 'photo', 'Make-up look du jour ✨ tuto bientôt', 63],
  ['u6', 'photo', 'Session jazz ce soir 🎷 qui vient ?', 27],
  ['u4', 'photo', 'Petit brushing du jour 💇🏾‍♀️', 22],
  ['u3', 'text', 'Team foot ce weekend, qui est chaud ? ⚽', 12],
  ['u8', 'text', 'Nouveau projet en approche 👀 restez connectés', 19],
];

let seeded = false;
async function ensurePostsSeed() {
  const rows = await sb('GET', 'posts?select=id&limit=1');
  if (!rows.length) {
    await sb('POST', 'posts', POST_SEED.map((p) => ({
      author_id: p[0], kind: p[1], body: p[2],
      photo: p[1] === 'photo' ? photoOf(p[0]) : null, likes: p[3],
    })));
    console.log('  🌱 Posts feed seed insérés.');
  }
}
async function ensureSeed() {
  const rows = await sb('GET', 'profiles?select=id&limit=1');
  if (!rows.length) {
    await sb('POST', 'profiles', seedRows());
    console.log('  🌱 Profils seed insérés dans Supabase.');
  }
  seeded = true;
  try { await ensurePostsSeed(); }
  catch (e) { console.error('  ⚠️ Table posts absente ? Exécute schema_feed.sql. (' + (e.status || '') + ')'); }
}

const AUTOREPLIES = [
  'Haha t\'es marrant toi 😄', 'Waaw ça me dit bien 🔥', 'On se capte ce weekend alors ?',
  'J\'avoue, moi aussi j\'adore ça !', 'Nangadef ? 😊', 'Tu fais quoi de beau ce soir ?',
  'Trop mignon comme message 🥰',
];
const ICEBREAKERS = [
  'Plutôt sunset aux Almadies ou soirée à Ngor ? 🌅',
  'C\'est quoi ton spot thiéb préféré à Dakar ? 😋',
  'Décris-moi ton weekend parfait 👀',
  'Team café ou team ataya ? ☕',
];
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

// ---------- Helpers HTTP ----------
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    let d = ''; req.on('data', (c) => (d += c));
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); } });
  });
}
function readRaw(req) {
  return new Promise((resolve) => {
    let d = ''; req.on('data', (c) => (d += c));
    req.on('end', () => resolve(d));
  });
}
function pubUser(u) {
  return {
    id: u.id, name: u.name, age: u.age, city: u.city, gender: u.gender,
    region: u.region || regionOf(u.city) || null,
    seeking: u.seeking || null,
    bio: u.bio, interests: u.interests || [], grad: u.grad, emoji: u.emoji, online: u.online,
    photo: u.photo || null,
    verified: u.id === ME ? meState.verified : VERIFIED.has(u.id),
    dmPolicy: u.id === ME ? meState.dmPolicy : policyOf(u.id),
  };
}

// ---------- Localisation : Région -> communes/quartiers ----------
const COMMUNES_BY_REGION = {
  'Dakar': ['Dakar-Plateau', 'Médina', 'Fann / Point E', 'Mermoz / Sacré-Cœur', 'Grand Dakar', 'Liberté / HLM', 'Grand Yoff', 'Ouakam', 'Ngor', 'Almadies', 'Yoff', 'Ouest Foire', 'Parcelles Assainies', 'Grand Médine', "Patte d'Oie", 'Hann / Bel-Air', 'Pikine', 'Guédiawaye', 'Thiaroye', 'Keur Massar', 'Malika', 'Yeumbeul', 'Rufisque', 'Bargny', 'Diamniadio', 'Sébikotane'],
  'Thiès': ['Thiès', 'Mbour', 'Saly', 'Tivaouane', 'Joal-Fadiouth', 'Pout', 'Khombole', 'Mékhé', 'Nguékhokh'],
  'Diourbel': ['Diourbel', 'Touba', 'Mbacké', 'Bambey', 'Ndoulo'],
  'Saint-Louis': ['Saint-Louis', 'Richard-Toll', 'Dagana', 'Podor', 'Mpal', 'Ross Béthio'],
  'Kaolack': ['Kaolack', 'Guinguinéo', 'Nioro du Rip', 'Kahone', 'Ndoffane'],
  'Ziguinchor': ['Ziguinchor', 'Bignona', 'Oussouye', 'Cap Skirring', 'Thionck-Essyl'],
  'Louga': ['Louga', 'Kébémer', 'Linguère', 'Dahra'],
  'Fatick': ['Fatick', 'Foundiougne', 'Gossas', 'Sokone', 'Passy', 'Diofior'],
  'Tambacounda': ['Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum'],
  'Kolda': ['Kolda', 'Vélingara', 'Médina Yoro Foulah'],
  'Matam': ['Matam', 'Ourossogui', 'Kanel', 'Ranérou', 'Thilogne'],
  'Kaffrine': ['Kaffrine', 'Koungheul', 'Malem Hodar', 'Birkelane'],
  'Kédougou': ['Kédougou', 'Salémata', 'Saraya'],
  'Sédhiou': ['Sédhiou', 'Bounkiling', 'Goudomp'],
};
const REGIONS_SET = new Set(Object.keys(COMMUNES_BY_REGION));
const REGION_OF_COMMUNE = {};
for (const [r, list] of Object.entries(COMMUNES_BY_REGION)) for (const c of list) REGION_OF_COMMUNE[c] = r;
const regionOf = (v) => (!v ? null : REGIONS_SET.has(v) ? v : (REGION_OF_COMMUNE[v] || v));

// ---------- Algo de matching : score d'un candidat pour "moi" ----------

// Qui l'utilisateur veut voir. Déduit du genre par défaut (hétéro), surchargeable via u.seeking.
function seekingOf(u) {
  if (u && (u.seeking === 'F' || u.seeking === 'H' || u.seeking === 'all')) return u.seeking;
  if (u && u.gender === 'H') return 'F';
  if (u && u.gender === 'F') return 'H';
  return 'all'; // 'A' / inconnu : ne filtre pas
}
// ---------- Messages : types + déblocage média/vocal après N échanges ----------
const MEDIA_MIN_MSGS = 5; // vocaux & médias débloqués après 5 messages échangés (les deux ayant parlé)
const FREE_DAILY_MSGS = 15; // messages/jour en gratuit ; illimité en Premium

// Masque les numéros de téléphone pour pousser au Premium (anti "on se donne le numéro et on quitte l'app").
// Robuste à l'obfuscation : masque toute séquence d'au moins 7 chiffres où chaque chiffre est séparé
// du suivant par ≤3 caractères quelconques (espaces, * . - / lettres, etc.). Ex: "77*333*44*67", "7 7 3 3 3 4 4".
const PHONE_RE = /\+?\d(?:[^\d\n]{0,3}\d){6,}/g;
function maskPhones(text) {
  if (!text) return text;
  return String(text).replace(PHONE_RE, '📵 numéro masqué — passe Premium pour le voir');
}
const mapMsg = (x, mask) => ({
  from: x.sender === ME ? 'me' : 'them',
  text: mask ? maskPhones(x.body || '') : (x.body || ''),
  kind: x.kind || 'text',
  media: x.media_url || null,
});
function mediaUnlocked(msgs) {
  const mine = msgs.filter((x) => x.sender === ME).length;
  const theirs = msgs.length - mine;
  return mine >= 1 && theirs >= 1 && msgs.length >= MEDIA_MIN_MSGS;
}
const isPremium = (me) => !!(me && (me.premium || (me.premium_until && new Date(me.premium_until).getTime() > Date.now())));
const todayStr = () => new Date().toISOString().slice(0, 10);

// Une photo réelle est requise pour apparaître dans l'accueil (anti "photo de chien/matelas" niveau 1).
// Les profils démo (u1..u12) mappent une photo Unsplash => considérés comme ayant une photo.
function hasPhoto(u) { return !!(u && (u.photo || PHOTOS[u.id])); }

// Profil complet : requis pour pouvoir passer Premium.
const DEFAULT_BIO = 'Nouveau sur SenLove 👋';
function profileMissing(me) {
  const miss = [];
  if (!me) return ['photo', 'prénom', 'genre', 'âge', 'localisation', 'bio'];
  if (!me.photo) miss.push('photo');
  if (!me.name || me.name === 'Moi') miss.push('prénom');
  if (!me.gender) miss.push('genre');
  if (!me.age) miss.push('âge');
  if (!me.region && !me.city) miss.push('localisation');
  if (!me.bio || me.bio === DEFAULT_BIO) miss.push('bio');
  return miss;
}
const profileComplete = (me) => profileMissing(me).length === 0;

// Un profil Premium (ou boosté) est mis en avant dans le deck des autres — boost RÉEL, dure ce qui est payé.
function isBoosted(u) {
  const now = Date.now();
  return !!(u && (u.premium
    || (u.premium_until && new Date(u.premium_until).getTime() > now)
    || (u.boost_until && new Date(u.boost_until).getTime() > now)));
}
// Compatibilité de genre MUTUELLE : je le vois si son genre me correspond ET que je corresponds à sa recherche.
function genderMatch(me, u) {
  if (!me || !u) return true;
  const mySeek = seekingOf(me);
  if (mySeek !== 'all' && u.gender && u.gender !== mySeek) return false;
  const theirSeek = seekingOf(u);
  if (theirSeek !== 'all' && me.gender && me.gender !== theirSeek) return false;
  return true;
}
function deckScore(u, me) {
  let s = 0;
  if (u.likes_me) s += 100;                              // réciprocité (matchs instantanés) — levier #1
  if (isBoosted(u)) s += 60;                             // BOOST réel : les Premium remontent dans le deck
  const myReg = (me && (me.region || regionOf(me.city))) || null;
  const uReg = u.region || regionOf(u.city);
  if (me && me.city && u.city && me.city === u.city) s += 40;   // même commune / quartier
  else if (myReg && uReg && myReg === uReg) s += 20;            // même région
  if (u.online) s += 25;                                 // activité récente
  if (VERIFIED.has(u.id) || u.verified) s += 15;         // profil vérifié (confiance)
  if (u.bio && u.bio.length > 15) s += 8;                // profil complet
  const mine = new Set(((me && me.interests) || []).map((x) => String(x).toLowerCase()));
  const common = ((u.interests) || []).filter((x) => mine.has(String(x).toLowerCase())).length;
  s += common * 12;                                      // intérêts communs
  s += Math.min(10, u.seq || 0);                         // léger boost aux nouveaux
  return s;
}

// ---------- Etat agrégé ----------
async function getState() {
  const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
  const cands = await sb('GET', 'profiles?is_me=eq.false&order=seq.asc&select=*');
  const swipes = await sb('GET', `swipes?actor_id=eq.${ME}&select=target_id,action`);
  const swipeMap = {}; swipes.forEach((s) => (swipeMap[s.target_id] = s.action));
  const blocked = (me && me.blocked) || [];

  const deck = cands
    .filter((u) => !swipeMap[u.id] && !blocked.includes(u.id) && genderMatch(me, u) && hasPhoto(u))
    .map((u) => ({ u, sc: deckScore(u, me) }))
    .sort((a, b) => b.sc - a.sc || (a.u.seq || 0) - (b.u.seq || 0))
    .map((x) => pubUser(x.u));
  const likedYou = cands.filter((u) => u.likes_me && swipeMap[u.id] !== 'pass' && !blocked.includes(u.id) && genderMatch(me, u));

  const matchesRaw = await sb('GET', `matches?user_a=eq.${ME}&order=id.asc&select=*`);
  let msgsByMatch = {};
  if (matchesRaw.length) {
    const ids = matchesRaw.map((m) => m.id).join(',');
    const msgs = await sb('GET', `messages?match_id=in.(${ids})&order=created_at.asc&select=*`);
    msgs.forEach((m) => { (msgsByMatch[m.match_id] = msgsByMatch[m.match_id] || []).push(m); });
  }
  const matches = matchesRaw
    .filter((m) => !blocked.includes(m.user_b))
    .map((m) => {
      const u = cands.find((c) => c.id === m.user_b) || {};
      const list = msgsByMatch[m.id] || [];
      const last = list[list.length - 1];
      return { id: String(m.id), user: pubUser(u), lastMessage: last ? last.body : null, count: list.length };
    });

  const now = Date.now();
  const passActive = !!(me && me.premium_until && new Date(me.premium_until).getTime() > now);
  const premium = !!(me && (me.premium || passActive));
  return {
    me: { ...pubUser(me), phone: (me && me.phone) || null },
    deck, matches, premium,
    credits: (me && me.credits) || 0,
    premiumUntil: (me && me.premium_until) || null,
    boostActive: !!(me && me.boost_until && new Date(me.boost_until).getTime() > now),
    likesLeft: premium ? null : Math.max(0, FREE_DAILY_LIKES - (me ? me.likes_used : 0)),
    likedYouCount: likedYou.length,
    likedYou: premium ? likedYou.map(pubUser) : [],
    icebreakers: ICEBREAKERS,
    profileComplete: profileComplete(me),
    profileMissing: profileMissing(me),
    freeDailyLikes: FREE_DAILY_LIKES,
  };
}

// Tarifs / durées
// Premium (durées claires) + Boost direct
const PASS_DAYS = { day: 1, week: 7, month: 30 };
const PASS_PRICES = { day: 1000, week: 3000, month: 8000 };
const BOOST_PRICE = 300;
const CREDIT_PACKS = { small: 500, medium: 1000, large: 2000 };
const BOOST_COST = 200;

// ---------- Paiement Unitech Pay (Wave / Orange Money) ----------
const UNITECH_KEY = process.env.UNITECH_API_KEY;
const UNITECH_BASE = 'https://api.unitech.sn/api';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://luminous-sunburst-21e305.netlify.app';
function priceOf(kind, item) {
  if (kind === 'pass') return PASS_PRICES[item] || 0;
  if (kind === 'boost') return BOOST_PRICE;
  return 0;
}
async function fulfill(kind, item) {
  if (kind === 'pass') {
    const days = PASS_DAYS[item] || 1;
    await sb('PATCH', `profiles?id=eq.${ME}`, { premium_until: new Date(Date.now() + days * 86400000).toISOString() });
  } else if (kind === 'boost') {
    await sb('PATCH', `profiles?id=eq.${ME}`, { boost_until: new Date(Date.now() + 3600000).toISOString() });
  }
}
async function unitechCreate(method, amount, phone, desc) {
  const action = method === 'om' ? 'create_orange_om' : 'create_wave_payment';
  const res = await fetch(`${UNITECH_BASE}?action=${action}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UNITECH_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount, customer_number: phone, description: desc,
      callback_success: `${PUBLIC_URL}/?paid=1`, callback_cancel: `${PUBLIC_URL}/?paid=0`,
    }),
  });
  return res.json();
}

// ---------- API ----------
async function api(req, res, url) {
  const route = url.pathname;

  if (route === '/api/state' && req.method === 'GET') {
    return json(res, 200, await getState());
  }

  if (route === '/api/profile' && req.method === 'POST') {
    const b = await readBody(req);
    const patch = {};
    if (b.name) patch.name = String(b.name).slice(0, 30);
    if (b.age) patch.age = Math.max(18, Math.min(80, parseInt(b.age) || 25));
    if (b.city !== undefined) patch.city = b.city ? String(b.city).slice(0, 40) : null;
    if (b.region !== undefined) patch.region = b.region ? String(b.region).slice(0, 30) : null;
    if (b.gender && ['H', 'F', 'A'].includes(b.gender)) patch.gender = b.gender;
    if (b.seeking && ['H', 'F', 'all'].includes(b.seeking)) patch.seeking = b.seeking;
    if (b.bio !== undefined) patch.bio = String(b.bio).slice(0, 200);
    if (b.emoji) patch.emoji = String(b.emoji).slice(0, 4);
    if (Array.isArray(b.interests)) patch.interests = b.interests.slice(0, 6);
    if (b.photo !== undefined) patch.photo = b.photo || null;
    if (b.phone !== undefined) patch.phone = String(b.phone).slice(0, 30);
    if (b.dmPolicy && ['everyone', 'verified', 'requests'].includes(b.dmPolicy)) meState.dmPolicy = b.dmPolicy;
    if (Object.keys(patch).length) await sb('PATCH', `profiles?id=eq.${ME}`, patch);
    return json(res, 200, { ok: true, state: await getState() });
  }

  if (route === '/api/block' && req.method === 'POST') {
    const b = await readBody(req);
    const target = String(b.target || b.targetId || '');
    if (target) {
      const [me] = await sb('GET', `profiles?id=eq.${ME}&select=blocked`);
      const cur = (me && me.blocked) || [];
      if (!cur.includes(target)) await sb('PATCH', `profiles?id=eq.${ME}`, { blocked: [...cur, target] });
    }
    return json(res, 200, { ok: true, state: await getState() });
  }

  if (route === '/api/unblock' && req.method === 'POST') {
    const b = await readBody(req);
    const target = String(b.target || b.targetId || '');
    if (target) {
      const [me] = await sb('GET', `profiles?id=eq.${ME}&select=blocked`);
      const cur = (me && me.blocked) || [];
      await sb('PATCH', `profiles?id=eq.${ME}`, { blocked: cur.filter((x) => x !== target) });
    }
    return json(res, 200, { ok: true, state: await getState() });
  }

  if (route === '/api/report' && req.method === 'POST') {
    const b = await readBody(req);
    const target = String(b.target || b.targetId || '');
    const reason = String(b.reason || '').slice(0, 300);
    if (target) await sb('POST', 'reports', { reporter: ME, target, reason });
    return json(res, 200, { ok: true });
  }

  if (route === '/api/swipe' && req.method === 'POST') {
    const b = await readBody(req);
    const cands = await sb('GET', `profiles?id=eq.${b.targetId}&select=*`);
    const u = cands[0];
    if (!u) return json(res, 404, { error: 'introuvable' });
    const action = b.action === 'crush' ? 'crush' : b.action === 'pass' ? 'pass' : 'like';

    const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
    const isPrem = me.premium || (me.premium_until && new Date(me.premium_until).getTime() > Date.now());
    if (action !== 'pass' && !isPrem && me.likes_used >= FREE_DAILY_LIKES) {
      return json(res, 402, { error: 'limit', message: 'Limite de likes atteinte' });
    }

    // upsert du swipe
    await sb('POST', 'swipes?on_conflict=actor_id,target_id',
      { actor_id: ME, target_id: u.id, action }, 'resolution=merge-duplicates');

    if (action !== 'pass' && !isPrem) {
      await sb('PATCH', `profiles?id=eq.${ME}`, { likes_used: me.likes_used + 1 });
    }

    let match = false;
    if (action !== 'pass') {
      const likesBack = u.likes_me || action === 'crush' || Math.random() < 0.55;
      if (likesBack) {
        const existing = await sb('GET', `matches?user_a=eq.${ME}&user_b=eq.${u.id}&select=id`);
        if (!existing.length) {
          await sb('POST', 'matches?on_conflict=user_a,user_b',
            { user_a: ME, user_b: u.id }, 'resolution=merge-duplicates');
        }
        match = true;
      }
    }
    return json(res, 200, { ok: true, match, user: pubUser(u), state: await getState() });
  }

  if (route === '/api/messages' && req.method === 'GET') {
    const id = url.searchParams.get('matchId');
    const [m] = await sb('GET', `matches?id=eq.${id}&select=*`);
    if (!m) return json(res, 404, { error: 'introuvable' });
    const [u] = await sb('GET', `profiles?id=eq.${m.user_b}&select=*`);
    const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
    const prem = isPremium(me);
    const msgs = await sb('GET', `messages?match_id=eq.${id}&order=created_at.asc&select=*`);
    const usedToday = me && me.msgs_date === todayStr() ? (me.msgs_used || 0) : 0;
    return json(res, 200, {
      user: pubUser(u),
      messages: msgs.map((x) => mapMsg(x, !prem)),
      mediaUnlocked: mediaUnlocked(msgs),
      mediaMin: MEDIA_MIN_MSGS,
      msgsLeft: prem ? null : Math.max(0, FREE_DAILY_MSGS - usedToday),
    });
  }

  if (route === '/api/messages' && req.method === 'POST') {
    const b = await readBody(req);
    const [m] = await sb('GET', `matches?id=eq.${b.matchId}&select=*`);
    if (!m) return json(res, 404, { error: 'introuvable' });
    const kind = ['image', 'audio'].includes(b.kind) ? b.kind : 'text';
    const text = String(b.text || '').slice(0, 500).trim();
    const media = String(b.media || '').slice(0, 400);
    if (kind === 'text' && !text) return json(res, 400, { error: 'vide' });
    if (kind !== 'text') {
      if (!media) return json(res, 400, { error: 'média manquant' });
      const existing = await sb('GET', `messages?match_id=eq.${m.id}&select=sender`);
      if (!mediaUnlocked(existing)) {
        return json(res, 403, { error: 'locked', message: `Débloqué après ${MEDIA_MIN_MSGS} messages échangés.` });
      }
    }
    // Limite de messages/jour en gratuit
    const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
    const prem = isPremium(me);
    if (!prem) {
      const usedToday = me && me.msgs_date === todayStr() ? (me.msgs_used || 0) : 0;
      if (usedToday >= FREE_DAILY_MSGS) {
        return json(res, 402, { error: 'msg_limit', message: `Tu as atteint ${FREE_DAILY_MSGS} messages aujourd'hui. Passe Premium pour discuter sans limite.` });
      }
      try { await sb('PATCH', `profiles?id=eq.${ME}`, { msgs_used: usedToday + 1, msgs_date: todayStr() }); } catch {} // no-op tant que la migration msgs_* n'est pas lancée
    }
    const row = { match_id: m.id, sender: ME, body: text };
    if (kind !== 'text') { row.kind = kind; row.media_url = media || null; } // colonnes requises seulement pour les médias
    await sb('POST', 'messages', row);
    await sb('POST', 'messages', { match_id: m.id, sender: m.user_b, body: pick(AUTOREPLIES) });
    const msgs = await sb('GET', `messages?match_id=eq.${m.id}&order=created_at.asc&select=*`);
    const usedNow = prem ? 0 : ((me && me.msgs_date === todayStr() ? (me.msgs_used || 0) : 0) + 1);
    return json(res, 200, {
      ok: true,
      messages: msgs.map((x) => mapMsg(x, !prem)),
      mediaUnlocked: mediaUnlocked(msgs),
      msgsLeft: prem ? null : Math.max(0, FREE_DAILY_MSGS - usedNow),
    });
  }

  if (route === '/api/premium' && req.method === 'POST') {
    await sb('PATCH', `profiles?id=eq.${ME}`, { premium: true });
    return json(res, 200, { ok: true, premium: true, state: await getState() });
  }

  // Acheter un PASS (premium temporaire) — paiement simulé Wave/OM
  if (route === '/api/buy-pass' && req.method === 'POST') {
    const b = await readBody(req);
    const days = PASS_DAYS[b.plan] || 1;
    const until = new Date(Date.now() + days * 86400000).toISOString();
    await sb('PATCH', `profiles?id=eq.${ME}`, { premium_until: until });
    return json(res, 200, { ok: true, state: await getState() });
  }

  // Acheter des CRÉDITS
  if (route === '/api/buy-credits' && req.method === 'POST') {
    const b = await readBody(req);
    const amount = CREDIT_PACKS[b.pack] || 0;
    if (!amount) return json(res, 400, { error: 'pack inconnu' });
    const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
    await sb('PATCH', `profiles?id=eq.${ME}`, { credits: (me.credits || 0) + amount });
    return json(res, 200, { ok: true, state: await getState() });
  }

  // Dépenser des crédits : BOOST 1h
  if (route === '/api/boost' && req.method === 'POST') {
    const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
    if ((me.credits || 0) < BOOST_COST) return json(res, 402, { error: 'insufficient', need: BOOST_COST });
    const until = new Date(Date.now() + 3600000).toISOString();
    await sb('PATCH', `profiles?id=eq.${ME}`, { credits: me.credits - BOOST_COST, boost_until: until });
    return json(res, 200, { ok: true, state: await getState() });
  }

  // Initier un paiement (pass ou crédits) via Unitech Pay
  if (route === '/api/pay/init' && req.method === 'POST') {
    const b = await readBody(req);
    const kind = b.kind, item = b.item, method = b.method === 'om' ? 'om' : 'wave';
    const amount = priceOf(kind, item);
    if (!amount) return json(res, 400, { error: 'article inconnu' });
    if (kind === 'pass') { // Premium réservé aux profils complets
      const [meNow] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
      const miss = profileMissing(meNow);
      if (miss.length) return json(res, 403, { error: 'profile_incomplete', missing: miss });
    }
    if (!UNITECH_KEY) { // repli démo (pas de clé configurée)
      await fulfill(kind, item);
      return json(res, 200, { ok: true, simulated: true, state: await getState() });
    }
    const data = await unitechCreate(method, amount, b.phone || '', `SenLove ${kind} ${item}`);
    if (!data || !data.success || !data.data) return json(res, 502, { error: 'paiement', detail: data });
    await sb('POST', 'orders', { reference: data.data.reference, user_id: ME, kind, item, amount, method, status: 'pending' });
    return json(res, 200, { ok: true, payment_url: data.data.payment_url, reference: data.data.reference });
  }

  // Webhook Unitech Pay (signature HMAC-SHA256, secret = clé API)
  if (route === '/api/webhook/unitech' && req.method === 'POST') {
    const raw = await readRaw(req);
    const sig = req.headers['x-unitechpay-signature'];
    const expected = UNITECH_KEY ? crypto.createHmac('sha256', UNITECH_KEY).update(raw).digest('hex') : '';
    if (!UNITECH_KEY || !sig || sig !== expected) return json(res, 401, { error: 'signature invalide' });
    let p = {}; try { p = JSON.parse(raw); } catch {}
    const ev = String(p.event || '');
    const st = String(p.status || '').toLowerCase();
    const success = /success|complet/i.test(ev) || st === 'completed' || st === 'success';
    const failed = /fail|expir|cancel/i.test(ev);
    if (success) {
      let order = null;
      if (p.reference) [order] = await sb('GET', `orders?reference=eq.${encodeURIComponent(p.reference)}&select=*`);
      if (!order) { // repli : dernière commande en attente
        const pend = await sb('GET', `orders?user_id=eq.${ME}&status=eq.pending&order=created_at.desc&limit=1&select=*`);
        order = pend[0];
      }
      if (order && order.status !== 'completed') {
        await fulfill(order.kind, order.item);
        await sb('PATCH', `orders?reference=eq.${encodeURIComponent(order.reference)}`, { status: 'completed' });
      }
    } else if (failed && p.reference) {
      await sb('PATCH', `orders?reference=eq.${encodeURIComponent(p.reference)}`, { status: 'failed' });
    }
    return json(res, 200, { ok: true });
  }

  if (route === '/api/reset' && req.method === 'POST') {
    await sb('DELETE', `matches?user_a=eq.${ME}`);   // cascade -> messages
    await sb('DELETE', `swipes?actor_id=eq.${ME}`);
    await sb('PATCH', `profiles?id=eq.${ME}`, { premium: false, likes_used: 0, credits: 0, premium_until: null, boost_until: null });
    meState = { verified: false, dmPolicy: 'everyone' };
    return json(res, 200, { ok: true, state: await getState() });
  }

  // ---- FEED (réseau social) ----
  if (route === '/api/feed' && req.method === 'GET') {
    const posts = await sb('GET', 'posts?order=id.desc&select=*');
    const profs = await sb('GET', 'profiles?select=*');
    const cmts = await sb('GET', 'comments?select=post_id');
    const cCount = {}; cmts.forEach((c) => (cCount[c.post_id] = (cCount[c.post_id] || 0) + 1));
    const byId = {}; profs.forEach((u) => (byId[u.id] = u));
    const out = posts.map((p) => ({
      id: String(p.id), kind: p.kind, body: p.body, photo: p.photo, likes: p.likes || 0,
      reactions: p.reactions || {}, commentCount: cCount[p.id] || 0,
      author: pubUser(byId[p.author_id] || { id: p.author_id, name: '?', age: 0, grad: ['#ccc', '#999'], emoji: '👤', interests: [] }),
      createdAt: p.created_at,
    }));
    return json(res, 200, { posts: out });
  }

  if (route === '/api/user' && req.method === 'GET') {
    const id = url.searchParams.get('id');
    const [u] = await sb('GET', `profiles?id=eq.${id}&select=*`);
    if (!u) return json(res, 404, { error: 'introuvable' });
    const posts = await sb('GET', `posts?author_id=eq.${id}&order=id.desc&select=*`);
    const out = posts.map((p) => ({ id: String(p.id), kind: p.kind, body: p.body, photo: p.photo, likes: p.likes || 0 }));
    return json(res, 200, { user: pubUser(u), posts: out });
  }

  if (route === '/api/post' && req.method === 'POST') {
    const b = await readBody(req);
    const kind = b.kind === 'photo' ? 'photo' : 'text';
    const body = String(b.body || '').slice(0, 500).trim();
    if (!body && kind !== 'photo') return json(res, 400, { error: 'vide' });
    await sb('POST', 'posts', { author_id: ME, kind, body, photo: b.photo || null, likes: 0 });
    return json(res, 200, { ok: true });
  }

  // Upload d'image -> Supabase Storage, renvoie l'URL publique
  if (route === '/api/upload' && req.method === 'POST') {
    const b = await readBody(req);
    const m = String(b.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return json(res, 400, { error: 'image invalide' });
    const contentType = m[1];
    const buf = Buffer.from(m[2], 'base64');
    const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const name = `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
    await storage('POST', `object/posts/${name}`, buf, contentType);
    return json(res, 200, { ok: true, url: `${SUPABASE_URL}/storage/v1/object/public/posts/${name}` });
  }

  if (route === '/api/feed/like' && req.method === 'POST') {
    const b = await readBody(req);
    const [p] = await sb('GET', `posts?id=eq.${b.postId}&select=likes`);
    if (!p) return json(res, 404, { error: 'introuvable' });
    const likes = (p.likes || 0) + 1;
    await sb('PATCH', `posts?id=eq.${b.postId}`, { likes });
    return json(res, 200, { ok: true, likes });
  }

  // Réaction emoji sur un post
  if (route === '/api/feed/react' && req.method === 'POST') {
    const b = await readBody(req);
    const emoji = String(b.emoji || '').slice(0, 8);
    const [p] = await sb('GET', `posts?id=eq.${b.postId}&select=reactions`);
    if (!p) return json(res, 404, { error: 'introuvable' });
    const r = p.reactions || {}; r[emoji] = (r[emoji] || 0) + 1;
    await sb('PATCH', `posts?id=eq.${b.postId}`, { reactions: r });
    return json(res, 200, { ok: true, reactions: r });
  }

  // ---- COMMENTAIRES ----
  if (route === '/api/comments' && req.method === 'GET') {
    const postId = url.searchParams.get('postId');
    const rows = await sb('GET', `comments?post_id=eq.${postId}&order=id.asc&select=*`);
    const profs = await sb('GET', 'profiles?select=*');
    const byId = {}; profs.forEach((u) => (byId[u.id] = u));
    const out = rows.map((c) => ({
      id: String(c.id), parentId: c.parent_id ? String(c.parent_id) : null,
      body: c.body, likes: c.likes || 0, reactions: c.reactions || {},
      author: pubUser(byId[c.author_id] || { id: c.author_id, name: '?', age: 0, grad: ['#ccc', '#999'], emoji: '👤', interests: [] }),
      createdAt: c.created_at,
    }));
    return json(res, 200, { comments: out });
  }

  if (route === '/api/comment' && req.method === 'POST') {
    const b = await readBody(req);
    const body = String(b.body || '').slice(0, 500).trim();
    if (!body) return json(res, 400, { error: 'vide' });
    const row = { post_id: b.postId, author_id: ME, body };
    if (b.parentId) row.parent_id = b.parentId;
    await sb('POST', 'comments', row);
    return json(res, 200, { ok: true });
  }

  if (route === '/api/comment/like' && req.method === 'POST') {
    const b = await readBody(req);
    const [c] = await sb('GET', `comments?id=eq.${b.commentId}&select=likes`);
    if (!c) return json(res, 404, { error: 'introuvable' });
    const likes = (c.likes || 0) + 1;
    await sb('PATCH', `comments?id=eq.${b.commentId}`, { likes });
    return json(res, 200, { ok: true, likes });
  }

  if (route === '/api/comment/react' && req.method === 'POST') {
    const b = await readBody(req);
    const emoji = String(b.emoji || '').slice(0, 8);
    const [c] = await sb('GET', `comments?id=eq.${b.commentId}&select=reactions`);
    if (!c) return json(res, 404, { error: 'introuvable' });
    const r = c.reactions || {}; r[emoji] = (r[emoji] || 0) + 1;
    await sb('PATCH', `comments?id=eq.${b.commentId}`, { reactions: r });
    return json(res, 200, { ok: true, reactions: r });
  }

  // DM direct depuis un post (drague) → crée/récupère la conversation
  if (route === '/api/dm' && req.method === 'POST') {
    const b = await readBody(req);
    const [u] = await sb('GET', `profiles?id=eq.${b.authorId}&select=id`);
    if (!u) return json(res, 404, { error: 'introuvable' });
    // Contrôle des DM du destinataire
    const policy = policyOf(b.authorId);
    if (policy === 'verified' && !meState.verified) {
      return json(res, 200, { ok: false, status: 'verified_only' });
    }
    if (policy === 'requests') {
      return json(res, 200, { ok: true, status: 'pending' });
    }
    let ex = await sb('GET', `matches?user_a=eq.${ME}&user_b=eq.${b.authorId}&select=id`);
    if (!ex.length) {
      await sb('POST', 'matches?on_conflict=user_a,user_b',
        { user_a: ME, user_b: b.authorId }, 'resolution=merge-duplicates');
      ex = await sb('GET', `matches?user_a=eq.${ME}&user_b=eq.${b.authorId}&select=id`);
    }
    return json(res, 200, { ok: true, status: 'open', matchId: String(ex[0].id) });
  }

  if (route === '/api/verify' && req.method === 'POST') {
    meState.verified = true;
    return json(res, 200, { ok: true, state: await getState() });
  }

  if (route === '/api/health' && req.method === 'GET') {
    try { await sb('GET', 'profiles?select=id&limit=1'); return json(res, 200, { ok: true, supabase: 'connected', seeded }); }
    catch (e) { return json(res, 500, { ok: false, status: e.status, error: e.data }); }
  }

  return json(res, 404, { error: 'route inconnue' });
}

// ---------- Statique (sert le build web Expo avec routage) ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
};
function safe(p) {
  const fp = path.join(PUBLIC, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  return fp.startsWith(PUBLIC) && fs.existsSync(fp) && fs.statSync(fp).isFile() ? fp : null;
}
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const candidates = [p];
  if (!path.extname(p)) {
    candidates.push(p + '.html');                       // /feed -> feed.html
    if (/^\/chat\/[^/]+$/.test(p)) candidates.push('/chat/[id].html'); // /chat/7 -> route dynamique
  }
  candidates.push('/index.html');                        // fallback SPA
  for (const c of candidates) {
    const fp = safe(c);
    if (fp) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      return res.end(fs.readFileSync(fp));
    }
  }
  res.writeHead(404); res.end('not found');
}

const server = http.createServer(async (req, res) => {
  // CORS (pour l'app Expo web servie sur un autre port)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/')) {
    try { return await api(req, res, url); }
    catch (e) {
      console.error('API error:', e.status || '', e.data || e.message);
      return json(res, 500, { error: 'server', detail: e.data || e.message, hint: 'As-tu exécuté schema.sql dans Supabase ?' });
    }
  }
  return serveStatic(req, res, url);
});

server.listen(PORT, async () => {
  console.log(`\n  💘 SenLove MVP : http://localhost:${PORT}`);
  try { await ensureSeed(); await ensureBucket(); console.log('  ✅ Supabase connecté.\n'); }
  catch (e) {
    console.error('  ❌ Supabase :', e.status || '', JSON.stringify(e.data || e.message));
    console.error('  👉 Vérifie l\'URL/clé et exécute schema.sql dans le SQL Editor.\n');
  }
});
