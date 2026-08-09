/**
 * SenLove — MVP appli de rencontres (Dakar)
 * Serveur Node.js pur (zéro dépendance) + Supabase (API REST / PostgREST).
 * L'état est persisté dans Supabase. La clé SECRÈTE reste côté serveur.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

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
const FREE_DAILY_LIKES = 10;

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
function pubUser(u) {
  return {
    id: u.id, name: u.name, age: u.age, city: u.city, gender: u.gender,
    bio: u.bio, interests: u.interests || [], grad: u.grad, emoji: u.emoji, online: u.online,
    photo: u.photo || null,
    verified: u.id === ME ? meState.verified : VERIFIED.has(u.id),
    dmPolicy: u.id === ME ? meState.dmPolicy : policyOf(u.id),
  };
}

// ---------- Algo de matching : score d'un candidat pour "moi" ----------
function deckScore(u, me) {
  let s = 0;
  if (u.likes_me) s += 100;                              // réciprocité (matchs instantanés) — levier #1
  if (me && me.city && u.city === me.city) s += 40;      // proximité (même ville)
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

  const deck = cands
    .filter((u) => !swipeMap[u.id])
    .map((u) => ({ u, sc: deckScore(u, me) }))
    .sort((a, b) => b.sc - a.sc || (a.u.seq || 0) - (b.u.seq || 0))
    .map((x) => pubUser(x.u));
  const likedYou = cands.filter((u) => u.likes_me && swipeMap[u.id] !== 'pass');

  const matchesRaw = await sb('GET', `matches?user_a=eq.${ME}&order=id.asc&select=*`);
  let msgsByMatch = {};
  if (matchesRaw.length) {
    const ids = matchesRaw.map((m) => m.id).join(',');
    const msgs = await sb('GET', `messages?match_id=in.(${ids})&order=created_at.asc&select=*`);
    msgs.forEach((m) => { (msgsByMatch[m.match_id] = msgsByMatch[m.match_id] || []).push(m); });
  }
  const matches = matchesRaw.map((m) => {
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
  };
}

// Tarifs / durées
const PASS_DAYS = { day: 1, weekend: 2, week: 7 };
const CREDIT_PACKS = { small: 500, medium: 1000, large: 2000 };
const BOOST_COST = 200;

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
    if (b.city) patch.city = String(b.city).slice(0, 30);
    if (b.bio !== undefined) patch.bio = String(b.bio).slice(0, 200);
    if (b.emoji) patch.emoji = String(b.emoji).slice(0, 4);
    if (Array.isArray(b.interests)) patch.interests = b.interests.slice(0, 6);
    if (b.photo !== undefined) patch.photo = b.photo || null;
    if (b.phone !== undefined) patch.phone = String(b.phone).slice(0, 30);
    if (b.dmPolicy && ['everyone', 'verified', 'requests'].includes(b.dmPolicy)) meState.dmPolicy = b.dmPolicy;
    if (Object.keys(patch).length) await sb('PATCH', `profiles?id=eq.${ME}`, patch);
    return json(res, 200, { ok: true, state: await getState() });
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
    const msgs = await sb('GET', `messages?match_id=eq.${id}&order=created_at.asc&select=*`);
    return json(res, 200, {
      user: pubUser(u),
      messages: msgs.map((x) => ({ from: x.sender === ME ? 'me' : 'them', text: x.body })),
    });
  }

  if (route === '/api/messages' && req.method === 'POST') {
    const b = await readBody(req);
    const [m] = await sb('GET', `matches?id=eq.${b.matchId}&select=*`);
    if (!m) return json(res, 404, { error: 'introuvable' });
    const text = String(b.text || '').slice(0, 500).trim();
    if (!text) return json(res, 400, { error: 'vide' });
    await sb('POST', 'messages', { match_id: m.id, sender: ME, body: text });
    await sb('POST', 'messages', { match_id: m.id, sender: m.user_b, body: pick(AUTOREPLIES) });
    const msgs = await sb('GET', `messages?match_id=eq.${m.id}&order=created_at.asc&select=*`);
    return json(res, 200, {
      ok: true,
      messages: msgs.map((x) => ({ from: x.sender === ME ? 'me' : 'them', text: x.body })),
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
