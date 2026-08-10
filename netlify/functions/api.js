/**
 * SenLove — API en Netlify Function (tout le backend, sans serveur Railway).
 * Route: /api/*  ->  /.netlify/functions/api/*  (voir netlify.toml)
 * Nécessite les variables d'env Netlify : SUPABASE_URL, SUPABASE_SECRET_KEY
 */
const crypto = require('crypto');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SECRET_KEY;
const ME = 'me';
const FREE_DAILY_LIKES = 10;

const DM_POLICY = { u2: 'requests', u5: 'requests', u8: 'verified' };
const VERIFIED = new Set(['u1', 'u2', 'u4', 'u6', 'u8', 'u10']);
const policyOf = (id) => DM_POLICY[id] || 'everyone';

const PHOTOS = {
  u1: '1494790108377-be9c29b29330', u2: '1534528741775-53994a69daeb',
  u3: '1544005313-94ddf0286df2', u4: '1517841905240-472988babdf9',
  u5: '1531123897727-8f129e1688ce', u6: '1524250502761-1ac6f2e30d43',
  u7: '1489424731084-a5d8b219a5bb', u8: '1508214751196-bcfd4ca60f91',
  u9: '1507003211169-0a1dd7228f2d', u10: '1506794778202-cad84cf45f1d',
  u11: '1519085360753-af0119f7cbe7', u12: '1508341591423-4347099e1f19',
};

const AUTOREPLIES = [
  "Haha t'es marrant toi 😄", 'Waaw ça me dit bien 🔥', 'On se capte ce weekend alors ?',
  "J'avoue, moi aussi j'adore ça !", 'Nangadef ? 😊', 'Tu fais quoi de beau ce soir ?', 'Trop mignon comme message 🥰',
];
const ICEBREAKERS = [
  'Plutôt sunset aux Almadies ou soirée à Ngor ? 🌅',
  "C'est quoi ton spot thiéb préféré à Dakar ? 😋",
  'Décris-moi ton weekend parfait 👀', 'Team café ou team ataya ? ☕',
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function sb(method, pathQuery, body, extraPrefer) {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
  const prefer = [];
  if (method === 'POST' || method === 'PATCH') prefer.push('return=representation');
  if (extraPrefer) prefer.push(extraPrefer);
  if (prefer.length) headers.Prefer = prefer.join(',');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathQuery}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) { const e = new Error('supabase'); e.status = res.status; e.data = data; throw e; }
  return data;
}
async function storage(method, pathQuery, body, contentType) {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  if (contentType) headers['Content-Type'] = contentType;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/${pathQuery}`, { method, headers, body });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) { const e = new Error('storage'); e.status = res.status; e.data = data; throw e; }
  return data;
}

function pubUser(u) {
  return {
    id: u.id, name: u.name, age: u.age, city: u.city, gender: u.gender,
    bio: u.bio, interests: u.interests || [], grad: u.grad, emoji: u.emoji, online: u.online,
    photo: u.photo || null,
    verified: u.id === ME ? !!u.verified : VERIFIED.has(u.id),
    dmPolicy: u.id === ME ? (u.dm_policy || 'everyone') : policyOf(u.id),
  };
}

const DAKAR = new Set(['Dakar-Plateau', 'Médina', 'Grand Yoff', 'Parcelles Assainies', 'Yoff', 'Almadies', 'Ngor', 'Ouakam', 'Point E / Mermoz', 'Grand Dakar', 'Liberté / HLM', 'Pikine', 'Guédiawaye', 'Rufisque', 'Keur Massar', 'Dakar']);
const regionOf = (c) => (DAKAR.has(c) ? 'Dakar' : c);
function deckScore(u, me) {
  let s = 0;
  if (u.likes_me) s += 100;                              // réciprocité (matchs instantanés)
  if (me && me.city) {
    if (u.city === me.city) s += 40;                     // même commune
    else if (regionOf(u.city) === regionOf(me.city)) s += 20; // même région
  }
  if (u.online) s += 25;                                 // activité récente
  if (VERIFIED.has(u.id) || u.verified) s += 15;         // vérifié
  if (u.bio && u.bio.length > 15) s += 8;                // profil complet
  const mine = new Set(((me && me.interests) || []).map((x) => String(x).toLowerCase()));
  const common = ((u.interests) || []).filter((x) => mine.has(String(x).toLowerCase())).length;
  s += common * 12;                                      // intérêts communs
  s += Math.min(10, u.seq || 0);                         // boost nouveaux
  return s;
}

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
    me: { ...pubUser(me), phone: (me && me.phone) || null }, deck, matches, premium,
    credits: (me && me.credits) || 0,
    premiumUntil: (me && me.premium_until) || null,
    boostActive: !!(me && me.boost_until && new Date(me.boost_until).getTime() > now),
    likesLeft: premium ? null : Math.max(0, FREE_DAILY_LIKES - (me ? me.likes_used : 0)),
    likedYouCount: likedYou.length, likedYou: premium ? likedYou.map(pubUser) : [], icebreakers: ICEBREAKERS,
  };
}
const PASS_DAYS = { day: 1, week: 7, month: 30 };
const PASS_PRICES = { day: 300, week: 1000, month: 3000 };
const BOOST_PRICE = 300;
const CREDIT_PACKS = { small: 500, medium: 1000, large: 2000 };
const BOOST_COST = 200;

// ---------- Paiement Unitech Pay ----------
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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const J = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  // Normalise le chemin -> '/state', '/feed', '/comments'...
  let route = (event.path || '').replace('/.netlify/functions/api', '');
  if (route.startsWith('/api')) route = route.slice(4);
  if (!route.startsWith('/')) route = '/' + route;
  const method = event.httpMethod;
  const q = event.queryStringParameters || {};
  let b = {}; try { b = event.body ? JSON.parse(event.body) : {}; } catch { b = {}; }

  try {
    if (route === '/state' && method === 'GET') return J(200, await getState());

    if (route === '/profile' && method === 'POST') {
      const patch = {};
      if (b.name) patch.name = String(b.name).slice(0, 30);
      if (b.age) patch.age = Math.max(18, Math.min(80, parseInt(b.age) || 25));
      if (b.city) patch.city = String(b.city).slice(0, 30);
      if (b.gender && ['H', 'F', 'A'].includes(b.gender)) patch.gender = b.gender;
      if (b.bio !== undefined) patch.bio = String(b.bio).slice(0, 200);
      if (b.emoji) patch.emoji = String(b.emoji).slice(0, 4);
      if (Array.isArray(b.interests)) patch.interests = b.interests.slice(0, 6);
      if (b.photo !== undefined) patch.photo = b.photo || null;
      if (b.phone !== undefined) patch.phone = String(b.phone).slice(0, 30);
      if (b.dmPolicy && ['everyone', 'verified', 'requests'].includes(b.dmPolicy)) patch.dm_policy = b.dmPolicy;
      if (Object.keys(patch).length) await sb('PATCH', `profiles?id=eq.${ME}`, patch);
      return J(200, { ok: true, state: await getState() });
    }

    if (route === '/swipe' && method === 'POST') {
      const [u] = await sb('GET', `profiles?id=eq.${b.targetId}&select=*`);
      if (!u) return J(404, { error: 'introuvable' });
      const action = b.action === 'crush' ? 'crush' : b.action === 'pass' ? 'pass' : 'like';
      const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
      const isPrem = me.premium || (me.premium_until && new Date(me.premium_until).getTime() > Date.now());
      if (action !== 'pass' && !isPrem && me.likes_used >= FREE_DAILY_LIKES) return J(402, { error: 'limit' });
      await sb('POST', 'swipes?on_conflict=actor_id,target_id', { actor_id: ME, target_id: u.id, action }, 'resolution=merge-duplicates');
      if (action !== 'pass' && !isPrem) await sb('PATCH', `profiles?id=eq.${ME}`, { likes_used: me.likes_used + 1 });
      let match = false;
      if (action !== 'pass') {
        const likesBack = u.likes_me || action === 'crush' || Math.random() < 0.55;
        if (likesBack) {
          const existing = await sb('GET', `matches?user_a=eq.${ME}&user_b=eq.${u.id}&select=id`);
          if (!existing.length) await sb('POST', 'matches?on_conflict=user_a,user_b', { user_a: ME, user_b: u.id }, 'resolution=merge-duplicates');
          match = true;
        }
      }
      return J(200, { ok: true, match, user: pubUser(u), state: await getState() });
    }

    if (route === '/messages' && method === 'GET') {
      const [m] = await sb('GET', `matches?id=eq.${q.matchId}&select=*`);
      if (!m) return J(404, { error: 'introuvable' });
      const [u] = await sb('GET', `profiles?id=eq.${m.user_b}&select=*`);
      const msgs = await sb('GET', `messages?match_id=eq.${q.matchId}&order=created_at.asc&select=*`);
      return J(200, { user: pubUser(u), messages: msgs.map((x) => ({ from: x.sender === ME ? 'me' : 'them', text: x.body })) });
    }
    if (route === '/messages' && method === 'POST') {
      const [m] = await sb('GET', `matches?id=eq.${b.matchId}&select=*`);
      if (!m) return J(404, { error: 'introuvable' });
      const text = String(b.text || '').slice(0, 500).trim();
      if (!text) return J(400, { error: 'vide' });
      await sb('POST', 'messages', { match_id: m.id, sender: ME, body: text });
      await sb('POST', 'messages', { match_id: m.id, sender: m.user_b, body: pick(AUTOREPLIES) });
      const msgs = await sb('GET', `messages?match_id=eq.${m.id}&order=created_at.asc&select=*`);
      return J(200, { ok: true, messages: msgs.map((x) => ({ from: x.sender === ME ? 'me' : 'them', text: x.body })) });
    }

    if (route === '/premium' && method === 'POST') { await sb('PATCH', `profiles?id=eq.${ME}`, { premium: true }); return J(200, { ok: true, state: await getState() }); }
    if (route === '/verify' && method === 'POST') { await sb('PATCH', `profiles?id=eq.${ME}`, { verified: true }); return J(200, { ok: true, state: await getState() }); }

    if (route === '/buy-pass' && method === 'POST') {
      const days = PASS_DAYS[b.plan] || 1;
      await sb('PATCH', `profiles?id=eq.${ME}`, { premium_until: new Date(Date.now() + days * 86400000).toISOString() });
      return J(200, { ok: true, state: await getState() });
    }
    if (route === '/buy-credits' && method === 'POST') {
      const amount = CREDIT_PACKS[b.pack] || 0;
      if (!amount) return J(400, { error: 'pack inconnu' });
      const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
      await sb('PATCH', `profiles?id=eq.${ME}`, { credits: (me.credits || 0) + amount });
      return J(200, { ok: true, state: await getState() });
    }
    if (route === '/boost' && method === 'POST') {
      const [me] = await sb('GET', `profiles?id=eq.${ME}&select=*`);
      if ((me.credits || 0) < BOOST_COST) return J(402, { error: 'insufficient', need: BOOST_COST });
      await sb('PATCH', `profiles?id=eq.${ME}`, { credits: me.credits - BOOST_COST, boost_until: new Date(Date.now() + 3600000).toISOString() });
      return J(200, { ok: true, state: await getState() });
    }

    // Initier un paiement Unitech Pay
    if (route === '/pay/init' && method === 'POST') {
      const kind = b.kind, item = b.item, payMethod = b.method === 'om' ? 'om' : 'wave';
      const amount = priceOf(kind, item);
      if (!amount) return J(400, { error: 'article inconnu' });
      if (!UNITECH_KEY) { await fulfill(kind, item); return J(200, { ok: true, simulated: true, state: await getState() }); }
      const data = await unitechCreate(payMethod, amount, b.phone || '', `SenLove ${kind} ${item}`);
      if (!data || !data.success || !data.data) return J(502, { error: 'paiement', detail: data });
      await sb('POST', 'orders', { reference: data.data.reference, user_id: ME, kind, item, amount, method: payMethod, status: 'pending' });
      return J(200, { ok: true, payment_url: data.data.payment_url, reference: data.data.reference });
    }

    // Webhook Unitech (signature HMAC-SHA256, secret = clé API)
    if (route === '/webhook/unitech' && method === 'POST') {
      const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
      const sig = (event.headers || {})['x-unitechpay-signature'];
      const expected = UNITECH_KEY ? crypto.createHmac('sha256', UNITECH_KEY).update(raw).digest('hex') : '';
      if (!UNITECH_KEY || !sig || sig !== expected) return J(401, { error: 'signature invalide' });
      let p = {}; try { p = JSON.parse(raw); } catch {}
      const ev = String(p.event || ''); const st = String(p.status || '').toLowerCase();
      const success = /success|complet/i.test(ev) || st === 'completed' || st === 'success';
      const failed = /fail|expir|cancel/i.test(ev);
      if (success) {
        let order = null;
        if (p.reference) [order] = await sb('GET', `orders?reference=eq.${encodeURIComponent(p.reference)}&select=*`);
        if (!order) { const pend = await sb('GET', `orders?user_id=eq.${ME}&status=eq.pending&order=created_at.desc&limit=1&select=*`); order = pend[0]; }
        if (order && order.status !== 'completed') {
          await fulfill(order.kind, order.item);
          await sb('PATCH', `orders?reference=eq.${encodeURIComponent(order.reference)}`, { status: 'completed' });
        }
      } else if (failed && p.reference) {
        await sb('PATCH', `orders?reference=eq.${encodeURIComponent(p.reference)}`, { status: 'failed' });
      }
      return J(200, { ok: true });
    }

    if (route === '/reset' && method === 'POST') {
      await sb('DELETE', `matches?user_a=eq.${ME}`);
      await sb('DELETE', `swipes?actor_id=eq.${ME}`);
      await sb('PATCH', `profiles?id=eq.${ME}`, { premium: false, likes_used: 0, verified: false, dm_policy: 'everyone', credits: 0, premium_until: null, boost_until: null });
      return J(200, { ok: true, state: await getState() });
    }

    // ---- FEED ----
    if (route === '/feed' && method === 'GET') {
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
      return J(200, { posts: out });
    }
    if (route === '/post' && method === 'POST') {
      const kind = b.kind === 'photo' ? 'photo' : 'text';
      const body = String(b.body || '').slice(0, 500).trim();
      if (!body && kind !== 'photo') return J(400, { error: 'vide' });
      await sb('POST', 'posts', { author_id: ME, kind, body, photo: b.photo || null, likes: 0 });
      return J(200, { ok: true });
    }
    if (route === '/upload' && method === 'POST') {
      const m = String(b.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return J(400, { error: 'image invalide' });
      const contentType = m[1];
      const buf = Buffer.from(m[2], 'base64');
      const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const name = `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
      await storage('POST', `object/posts/${name}`, buf, contentType);
      return J(200, { ok: true, url: `${SUPABASE_URL}/storage/v1/object/public/posts/${name}` });
    }
    if (route === '/feed/like' && method === 'POST') {
      const [p] = await sb('GET', `posts?id=eq.${b.postId}&select=likes`);
      if (!p) return J(404, { error: 'introuvable' });
      const likes = (p.likes || 0) + 1; await sb('PATCH', `posts?id=eq.${b.postId}`, { likes });
      return J(200, { ok: true, likes });
    }
    if (route === '/feed/react' && method === 'POST') {
      const emoji = String(b.emoji || '').slice(0, 8);
      const [p] = await sb('GET', `posts?id=eq.${b.postId}&select=reactions`);
      if (!p) return J(404, { error: 'introuvable' });
      const r = p.reactions || {}; r[emoji] = (r[emoji] || 0) + 1;
      await sb('PATCH', `posts?id=eq.${b.postId}`, { reactions: r });
      return J(200, { ok: true, reactions: r });
    }

    // ---- COMMENTAIRES ----
    if (route === '/comments' && method === 'GET') {
      const rows = await sb('GET', `comments?post_id=eq.${q.postId}&order=id.asc&select=*`);
      const profs = await sb('GET', 'profiles?select=*');
      const byId = {}; profs.forEach((u) => (byId[u.id] = u));
      const out = rows.map((c) => ({
        id: String(c.id), parentId: c.parent_id ? String(c.parent_id) : null,
        body: c.body, likes: c.likes || 0, reactions: c.reactions || {},
        author: pubUser(byId[c.author_id] || { id: c.author_id, name: '?', age: 0, grad: ['#ccc', '#999'], emoji: '👤', interests: [] }),
        createdAt: c.created_at,
      }));
      return J(200, { comments: out });
    }
    if (route === '/comment' && method === 'POST') {
      const body = String(b.body || '').slice(0, 500).trim();
      if (!body) return J(400, { error: 'vide' });
      const row = { post_id: b.postId, author_id: ME, body };
      if (b.parentId) row.parent_id = b.parentId;
      await sb('POST', 'comments', row);
      return J(200, { ok: true });
    }
    if (route === '/comment/like' && method === 'POST') {
      const [c] = await sb('GET', `comments?id=eq.${b.commentId}&select=likes`);
      if (!c) return J(404, { error: 'introuvable' });
      const likes = (c.likes || 0) + 1; await sb('PATCH', `comments?id=eq.${b.commentId}`, { likes });
      return J(200, { ok: true, likes });
    }
    if (route === '/comment/react' && method === 'POST') {
      const emoji = String(b.emoji || '').slice(0, 8);
      const [c] = await sb('GET', `comments?id=eq.${b.commentId}&select=reactions`);
      if (!c) return J(404, { error: 'introuvable' });
      const r = c.reactions || {}; r[emoji] = (r[emoji] || 0) + 1;
      await sb('PATCH', `comments?id=eq.${b.commentId}`, { reactions: r });
      return J(200, { ok: true, reactions: r });
    }

    // ---- DM (drague depuis le feed) ----
    if (route === '/dm' && method === 'POST') {
      const [u] = await sb('GET', `profiles?id=eq.${b.authorId}&select=id`);
      if (!u) return J(404, { error: 'introuvable' });
      const [me] = await sb('GET', `profiles?id=eq.${ME}&select=verified`);
      const policy = policyOf(b.authorId);
      if (policy === 'verified' && !(me && me.verified)) return J(200, { ok: false, status: 'verified_only' });
      if (policy === 'requests') return J(200, { ok: true, status: 'pending' });
      let ex = await sb('GET', `matches?user_a=eq.${ME}&user_b=eq.${b.authorId}&select=id`);
      if (!ex.length) {
        await sb('POST', 'matches?on_conflict=user_a,user_b', { user_a: ME, user_b: b.authorId }, 'resolution=merge-duplicates');
        ex = await sb('GET', `matches?user_a=eq.${ME}&user_b=eq.${b.authorId}&select=id`);
      }
      return J(200, { ok: true, status: 'open', matchId: String(ex[0].id) });
    }

    if (route === '/health' && method === 'GET') {
      try { await sb('GET', 'profiles?select=id&limit=1'); return J(200, { ok: true, supabase: 'connected' }); }
      catch (e) { return J(500, { ok: false, error: e.data }); }
    }

    return J(404, { error: 'route inconnue', route });
  } catch (e) {
    return J(500, { error: 'server', detail: e.data || e.message });
  }
};
