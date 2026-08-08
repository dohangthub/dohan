// Doxan MVP — logique front
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const EMOJIS = ['🙂','😎','🔥','🌺','🎧','📸','🌴','⚽','💃','☕','🦋','✨'];
let state = null;
let currentMatchId = null;
let topCard = null;

function grad(g) { return `linear-gradient(150deg, ${g[0]}, ${g[1]})`; }
function api(path, opts) {
  return fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts)).then(r => r.json());
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.add('hidden'), 1900);
}

// ---------- Navigation ----------
function show(screen) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + screen).classList.add('active');
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.screen === screen));
}
$$('.tab').forEach(t => t.addEventListener('click', () => {
  show(t.dataset.screen);
  if (t.dataset.screen === 'likes') renderLikes();
  if (t.dataset.screen === 'matches') renderMatches();
  if (t.dataset.screen === 'profile') fillProfile();
}));

// ---------- State ----------
async function refresh() {
  state = await api('/api/state');
  renderTop();
  renderDeck();
  renderLikesBanner();
  updateTabBadges();
}
function renderTop() {
  $('#premiumLabel').textContent = state.premium ? 'Gold ✓' : 'Premium';
  const a = $('#profileBtn');
  a.style.background = grad(state.me.grad); a.textContent = state.me.emoji;
}
function updateTabBadges() {
  const mt = $$('.tab')[2];
  mt.querySelector('.count')?.remove();
  if (state.matches.length) {
    const b = document.createElement('span'); b.className = 'count'; b.textContent = state.matches.length;
    mt.appendChild(b);
  }
}

// ---------- Deck / swipe ----------
function renderDeck() {
  const deck = $('#deck'); deck.innerHTML = '';
  if (!state.deck.length) {
    deck.innerHTML = `<div class="empty-deck"><div class="big">🌙</div><p>Plus personne pour l'instant !<br>Reviens plus tard ou élargis ta zone.</p></div>`;
    topCard = null; return;
  }
  // Render up to 3 stacked cards (top last for z-order)
  const slice = state.deck.slice(0, 3).reverse();
  slice.forEach((u, i) => {
    const isTop = i === slice.length - 1;
    const c = document.createElement('div');
    c.className = 'card';
    c.style.background = grad(u.grad);
    c.style.zIndex = i + 1;
    if (!isTop) c.style.transform = `scale(${1 - (slice.length - 1 - i) * 0.04}) translateY(${(slice.length - 1 - i) * 10}px)`;
    c.dataset.id = u.id;
    c.innerHTML = `
      <div class="emoji-bg">${u.emoji}</div>
      <div class="scrim"></div>
      <div class="stamp like">MATCH</div>
      <div class="stamp nope">NOPE</div>
      <div class="info">
        <div class="nm">${u.name}, ${u.age} ${u.online ? '<span class="dot"></span>' : ''}</div>
        <div class="meta">📍 ${u.city}</div>
        <div class="bio">${u.bio}</div>
        <div class="tags">${u.interests.map(t => `<span class="tag-pill">${t}</span>`).join('')}</div>
      </div>`;
    deck.appendChild(c);
    if (isTop) { topCard = c; enableDrag(c, u); }
  });
}

function enableDrag(card, user) {
  let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false;
  const likeStamp = card.querySelector('.stamp.like');
  const nopeStamp = card.querySelector('.stamp.nope');
  const start = (x, y) => { dragging = true; sx = x; sy = y; card.style.transition = 'none'; };
  const move = (x, y) => {
    if (!dragging) return;
    dx = x - sx; dy = y - sy;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`;
    likeStamp.style.opacity = Math.max(0, Math.min(1, dx / 90));
    nopeStamp.style.opacity = Math.max(0, Math.min(1, -dx / 90));
  };
  const end = () => {
    if (!dragging) return; dragging = false;
    card.style.transition = 'transform .35s ease, opacity .35s ease';
    if (dx > 100) doSwipe('like', user);
    else if (dx < -100) doSwipe('pass', user);
    else if (dy < -120) doSwipe('crush', user);
    else { card.style.transform = ''; likeStamp.style.opacity = 0; nopeStamp.style.opacity = 0; }
  };
  card.addEventListener('mousedown', e => start(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  window.addEventListener('mouseup', end);
  card.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  card.addEventListener('touchmove', e => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  card.addEventListener('touchend', end);
}

async function doSwipe(action, user) {
  if (!topCard) return;
  const card = topCard; topCard = null;
  card.classList.add(action === 'pass' ? 'gone-left' : action === 'crush' ? 'gone-up' : 'gone-right');
  const res = await api('/api/swipe', { method: 'POST', body: JSON.stringify({ targetId: user.id, action }) });
  if (res.error === 'limit') {
    toast('Limite de likes atteinte 😅');
    openPremium();
    setTimeout(refresh, 350);
    return;
  }
  state = res.state;
  if (res.match) { setTimeout(() => showMatch(res.user), 250); }
  setTimeout(() => { renderDeck(); renderLikesBanner(); updateTabBadges(); }, 340);
}

// Button controls
$$('.sbtn').forEach(b => b.addEventListener('click', () => {
  if (!topCard) return;
  const u = state.deck.find(x => x.id === topCard.dataset.id);
  if (u) doSwipe(b.dataset.act, u);
}));

// ---------- Likes banner + grid ----------
function renderLikesBanner() {
  const b = $('#likesBanner');
  if (state.likedYouCount > 0) {
    b.classList.add('show');
    b.innerHTML = `<span>💘 ${state.likedYouCount} personne(s) t'ont liké !</span><span>${state.premium ? 'Voir →' : 'Débloquer 👑'}</span>`;
  } else b.classList.remove('show');
}
$('#likesBanner').addEventListener('click', () => { show('likes'); renderLikes(); });

function renderLikes() {
  const grid = $('#likesGrid');
  if (!state.premium) {
    grid.innerHTML = state.likedYouCount
      ? Array.from({ length: state.likedYouCount }).map(() => tileLocked()).join('') +
        `<div class="lock-cta" style="grid-column:1/-1"><div class="big">👑</div><p><b>${state.likedYouCount} personnes</b> t'ont déjà liké.<br>Passe en Gold pour voir qui !</p><button class="primary" onclick="openPremium()">Débloquer</button></div>`
      : `<p class="empty-note">Personne ne t'a encore liké. Continue à swiper 🔥</p>`;
    return;
  }
  grid.innerHTML = state.likedYou.length
    ? state.likedYou.map(u => tile(u)).join('')
    : `<p class="empty-note">Personne ne t'a encore liké. Continue à swiper 🔥</p>`;
}
function tile(u) {
  return `<div class="mini" style="background:${grad(u.grad)}"><div class="emoji-bg">${u.emoji}</div><div class="scrim"></div><div class="cap">${u.name}, ${u.age}</div></div>`;
}
function tileLocked() {
  const g = ['#c9c0d3', '#a99fb8'];
  return `<div class="mini locked" style="background:${grad(g)}"><div class="emoji-bg">👤</div><div class="scrim"></div><div class="cap">? , ?</div></div>`;
}

// ---------- Matches ----------
function renderMatches() {
  const list = $('#matchesList');
  if (!state.matches.length) {
    list.innerHTML = `<p class="empty-note">Pas encore de match.<br>Va swiper pour trouver ton crush 🔥</p>`;
    return;
  }
  list.innerHTML = state.matches.map(m => `
    <div class="match-row" data-mid="${m.id}">
      <div class="avatar-sm" style="background:${grad(m.user.grad)}">${m.user.emoji}</div>
      <div class="txt">
        <div class="nm">${m.user.name}, ${m.user.age}</div>
        <div class="lm">${m.lastMessage || 'Vous avez matché ! Dis bonjour 👋'}</div>
      </div>
      ${!m.lastMessage ? '<span class="new-badge">NEW</span>' : ''}
    </div>`).join('');
  $$('.match-row').forEach(r => r.addEventListener('click', () => openChat(r.dataset.mid)));
}

// ---------- Chat ----------
async function openChat(matchId) {
  currentMatchId = matchId;
  const data = await api('/api/messages?matchId=' + matchId);
  const u = data.user;
  $('#chatName').textContent = `${u.name}, ${u.age}`;
  $('#chatCity').textContent = '📍 ' + u.city;
  const av = $('#chatAvatar'); av.style.background = grad(u.grad); av.textContent = u.emoji;
  renderChat(data.messages);
  // icebreakers
  $('#iceRow').innerHTML = state.icebreakers.map(t => `<button class="ice">${t}</button>`).join('');
  $$('#iceRow .ice').forEach(b => b.addEventListener('click', () => { $('#chatText').value = b.textContent; $('#chatText').focus(); }));
  show('chat');
  $('#screen-chat').classList.add('active');
}
function renderChat(msgs) {
  const body = $('#chatBody');
  if (!msgs.length) {
    body.innerHTML = `<div class="msg them">Vous avez matché ! 🎉 Lance la conversation 👇</div>`;
  } else {
    body.innerHTML = msgs.map(m => `<div class="msg ${m.from}">${escapeHtml(m.text)}</div>`).join('');
  }
  body.scrollTop = body.scrollHeight;
}
$('#chatForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('#chatText'); const text = input.value.trim();
  if (!text || !currentMatchId) return;
  input.value = '';
  const res = await api('/api/messages', { method: 'POST', body: JSON.stringify({ matchId: currentMatchId, text }) });
  renderChat(res.messages);
});
$('#chatBack').addEventListener('click', () => { show('matches'); renderMatches(); refresh(); });

// ---------- Match modal ----------
function showMatch(u) {
  $('#matchThem').style.background = grad(u.grad); $('#matchThem').textContent = u.emoji;
  $('#matchMe').style.background = grad(state.me.grad); $('#matchMe').textContent = state.me.emoji;
  $('#matchText').textContent = `Toi et ${u.name} vous êtes plu 🔥`;
  $('#matchModal').classList.remove('hidden');
  $('#matchModal').dataset.mid = (state.matches.find(m => m.user.id === u.id) || {}).id || '';
}
$('#matchClose').addEventListener('click', () => $('#matchModal').classList.add('hidden'));
$('#matchChat').addEventListener('click', () => {
  const mid = $('#matchModal').dataset.mid;
  $('#matchModal').classList.add('hidden');
  if (mid) openChat(mid);
});

// ---------- Premium ----------
function openPremium() { $('#premiumModal').classList.remove('hidden'); }
window.openPremium = openPremium;
$('#premiumBtn').addEventListener('click', () => { if (state.premium) { show('likes'); renderLikes(); } else openPremium(); });
$('#premClose').addEventListener('click', () => $('#premiumModal').classList.add('hidden'));
$$('.pay').forEach(p => p.addEventListener('click', () => { $$('.pay').forEach(x => x.classList.remove('sel')); p.classList.add('sel'); }));
$$('.plan').forEach(p => p.addEventListener('click', async () => {
  const pay = $('.pay.sel');
  if (!pay) { toast('Choisis un moyen de paiement 💳'); return; }
  const res = await api('/api/premium', { method: 'POST', body: JSON.stringify({ plan: p.dataset.plan, method: pay.dataset.pay }) });
  state = res.state;
  $('#premiumModal').classList.add('hidden');
  toast('👑 Bienvenue dans Doxan Gold !');
  renderTop(); renderLikesBanner();
  show('likes'); renderLikes();
}));

// ---------- Profile ----------
function fillProfile() {
  $('#pName').value = state.me.name === 'Moi' ? '' : state.me.name;
  $('#pAge').value = state.me.age;
  const citySel = $('#pCity');
  const cities = ['Dakar', 'Thiès', 'Saint-Louis', 'Rufisque', 'Mbour', 'Ziguinchor'];
  citySel.innerHTML = cities.map(c => `<option ${c === state.me.city ? 'selected' : ''}>${c}</option>`).join('');
  $('#pBio').value = state.me.bio === 'Nouveau sur Doxan 👋' ? '' : state.me.bio;
  const av = $('#myAvatar'); av.style.background = grad(state.me.grad); av.textContent = state.me.emoji;
  const pick = $('#emojiPick');
  pick.innerHTML = EMOJIS.map(e => `<button class="${e === state.me.emoji ? 'sel' : ''}">${e}</button>`).join('');
  $$('#emojiPick button').forEach(b => b.addEventListener('click', () => {
    $$('#emojiPick button').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
    $('#myAvatar').textContent = b.textContent;
  }));
}
$('#saveProfile').addEventListener('click', async () => {
  const emoji = $('#emojiPick .sel')?.textContent || state.me.emoji;
  await api('/api/profile', { method: 'POST', body: JSON.stringify({
    name: $('#pName').value || 'Moi', age: $('#pAge').value, city: $('#pCity').value,
    bio: $('#pBio').value || 'Nouveau sur Doxan 👋', emoji,
  }) });
  toast('Profil enregistré ✓');
  await refresh();
});
$('#resetBtn').addEventListener('click', async () => {
  await api('/api/reset', { method: 'POST' });
  currentMatchId = null;
  toast('Démo réinitialisée 🔄');
  await refresh(); show('discover');
});
$('#profileBtn').addEventListener('click', () => { show('profile'); fillProfile(); });

function escapeHtml(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// ---------- Boot ----------
refresh();
