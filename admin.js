// ============================================================
//  SenLove — Back-office admin (KPIs + gestion). Module partagé
//  utilisé par la fonction Netlify (/admin) ET le serveur local.
//  Auth : clé ADMIN_KEY (variable d'env), envoyée en ?key=...
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SECRET_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY || 'senlove-admin-2026';
const DAY = 86400000;

async function sb(method, pathQuery, body, extraPrefer) {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
  const prefer = [];
  if (method === 'POST' || method === 'PATCH') prefer.push('return=representation');
  if (extraPrefer) prefer.push(extraPrefer);
  if (prefer.length) headers.Prefer = prefer.join(',');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathQuery}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) { const e = new Error('sb'); e.status = res.status; e.data = data; throw e; }
  return data || [];
}

const isComplete = (p) => !!(p && p.photo && p.name && p.name !== 'Moi' && p.gender && p.age && (p.region || p.city));
const isPrem = (p) => !!(p && (p.premium || (p.premium_until && new Date(p.premium_until).getTime() > Date.now())));

async function computeKpis() {
  const now = Date.now();
  const [profiles, orders, matches, messages, reports, posts] = await Promise.all([
    sb('GET', 'profiles?select=*'),
    sb('GET', 'orders?select=amount,status,method,created_at').catch(() => []),
    sb('GET', 'matches?select=created_at').catch(() => []),
    sb('GET', 'messages?select=created_at').catch(() => []),
    sb('GET', 'reports?select=id,created_at').catch(() => []),
    sb('GET', 'posts?select=id').catch(() => []),
  ]);
  const users = profiles.filter((p) => !p.is_me);          // vrais utilisateurs (hors compte démo "moi")
  const nOf = (arr, d) => arr.filter((x) => x.created_at && new Date(x.created_at).getTime() > now - d * DAY).length;
  const completed = orders.filter((o) => o.status === 'completed');
  const sum = (a) => a.reduce((s, o) => s + (o.amount || 0), 0);
  const total = users.length || 1;
  const premiumActive = users.filter(isPrem).length;
  const revenue = sum(completed);

  const byGender = { F: users.filter((u) => u.gender === 'F').length, H: users.filter((u) => u.gender === 'H').length, A: users.filter((u) => u.gender === 'A' || !u.gender).length };
  const regionMap = {};
  users.forEach((u) => { const r = u.region || u.city || 'Non renseignée'; regionMap[r] = (regionMap[r] || 0) + 1; });
  const byRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return {
    acquisition: { total: users.length, new1: nOf(users, 1), new7: nOf(users, 7), new30: nOf(users, 30) },
    activation: { complete: users.filter(isComplete).length, completeRate: Math.round(users.filter(isComplete).length / total * 100), withPhoto: users.filter((u) => u.photo).length, verified: users.filter((u) => u.verified).length },
    engagement: { matches: matches.length, matches7: nOf(matches, 7), messages: messages.length, messages7: nOf(messages, 7), posts: posts.length },
    monetization: {
      premiumActive, conversion: Math.round(premiumActive / total * 100),
      revenue, revenue30: sum(completed.filter((o) => o.created_at && new Date(o.created_at).getTime() > now - 30 * DAY)),
      arpu: Math.round(revenue / total), orders: completed.length,
      wave: sum(completed.filter((o) => o.method === 'wave')), om: sum(completed.filter((o) => o.method === 'om')),
    },
    health: { reports: reports.length, banned: users.filter((u) => u.banned).length },
    byGender, byRegion,
  };
}

function J(status, obj) {
  return { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(obj) };
}

// Cœur : router admin. method, query(obj), bodyStr.
async function handle(method, query, bodyStr) {
  const action = (query.action || '').toLowerCase();
  if (!action || action === 'page') {
    return { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: HTML };
  }
  if ((query.key || '') !== ADMIN_KEY) return J(401, { error: 'unauthorized' });
  let b = {}; try { b = bodyStr ? JSON.parse(bodyStr) : {}; } catch {}
  const id = String(b.id || query.id || '');

  try {
    if (action === 'kpis') return J(200, await computeKpis());

    if (action === 'users') {
      const list = await sb('GET', 'profiles?select=*&order=created_at.desc');
      return J(200, { users: list.map((p) => ({ ...p, complete: isComplete(p), premiumActive: isPrem(p) })) });
    }
    if (action === 'reports') {
      const reports = await sb('GET', 'reports?select=*&order=created_at.desc');
      const ids = [...new Set(reports.map((r) => r.target))].filter(Boolean);
      let names = {};
      if (ids.length) {
        const profs = await sb('GET', `profiles?id=in.(${ids.join(',')})&select=id,name`);
        profs.forEach((p) => (names[p.id] = p.name));
      }
      return J(200, { reports: reports.map((r) => ({ ...r, targetName: names[r.target] || r.target })) });
    }
    if (action === 'posts') {
      const posts = await sb('GET', 'posts?select=*&order=created_at.desc&limit=100');
      const ids = [...new Set(posts.map((p) => p.author_id))].filter(Boolean);
      let names = {};
      if (ids.length) { const profs = await sb('GET', `profiles?id=in.(${ids.join(',')})&select=id,name`); profs.forEach((p) => (names[p.id] = p.name)); }
      return J(200, { posts: posts.map((p) => ({ ...p, authorName: names[p.author_id] || p.author_id })) });
    }

    // --- Actions (POST) ---
    if (action === 'ban') { await sb('PATCH', `profiles?id=eq.${id}`, { banned: true }); return J(200, { ok: true }); }
    if (action === 'unban') { await sb('PATCH', `profiles?id=eq.${id}`, { banned: false }); return J(200, { ok: true }); }
    if (action === 'verify') { await sb('PATCH', `profiles?id=eq.${id}`, { verified: !!b.on }); return J(200, { ok: true }); }
    if (action === 'premium') {
      const patch = b.on ? { premium_until: new Date(Date.now() + 30 * DAY).toISOString() } : { premium: false, premium_until: null };
      await sb('PATCH', `profiles?id=eq.${id}`, patch); return J(200, { ok: true });
    }
    if (action === 'delete_user') {
      if (id === 'me') return J(400, { error: 'compte propriétaire protégé' });
      for (const q of [`swipes?actor_id=eq.${id}`, `swipes?target_id=eq.${id}`, `matches?user_a=eq.${id}`, `matches?user_b=eq.${id}`, `messages?sender=eq.${id}`, `posts?author_id=eq.${id}`, `reports?target=eq.${id}`]) {
        await sb('DELETE', q).catch(() => {});
      }
      await sb('DELETE', `profiles?id=eq.${id}`);
      return J(200, { ok: true });
    }
    if (action === 'delete_post') { await sb('DELETE', `posts?id=eq.${id}`); return J(200, { ok: true }); }
    if (action === 'resolve_report') {
      const rid = String(b.reportId || '');
      if (b.ban && b.target && b.target !== 'me') await sb('PATCH', `profiles?id=eq.${b.target}`, { banned: true });
      if (rid) await sb('DELETE', `reports?id=eq.${rid}`);
      return J(200, { ok: true });
    }
    return J(404, { error: 'action inconnue' });
  } catch (e) {
    return J(500, { error: 'server', detail: (e && e.data) || String(e) });
  }
}

const HTML = require('./admin_page.js');

module.exports = { handle, ADMIN_KEY };
