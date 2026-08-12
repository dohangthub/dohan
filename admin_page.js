// HTML du back-office SenLove (exporté en string, servi par /admin).
module.exports = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SenLove · Admin</title>
<style>
  :root{--bg:#0f1020;--card:#191a2e;--line:#2a2b45;--ink:#eceaf5;--mut:#9a95b8;--vio:#7C3AED;--vio2:#9B6DFF;--grn:#38C793;--gold:#FF8A5B;--red:#E5484D;}
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  body{background:var(--bg);color:var(--ink);min-height:100vh}
  a{color:inherit}
  .wrap{max-width:1200px;margin:0 auto;padding:20px}
  header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
  .logo{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,var(--vio2),var(--vio));display:flex;align-items:center;justify-content:center;font-size:20px}
  h1{font-size:20px;font-weight:800}.sub{color:var(--mut);font-size:13px}
  .tabs{display:flex;gap:8px;margin:18px 0;flex-wrap:wrap}
  .tab{padding:9px 16px;border-radius:10px;background:var(--card);border:1px solid var(--line);color:var(--mut);cursor:pointer;font-weight:700;font-size:13px}
  .tab.on{background:var(--vio);border-color:var(--vio);color:#fff}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
  .kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
  .kpi .lbl{color:var(--mut);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
  .kpi .val{font-size:26px;font-weight:900;margin-top:6px}
  .kpi .hint{color:var(--mut);font-size:12px;margin-top:4px}
  .kpi.good .val{color:var(--grn)}.kpi.vio .val{color:var(--vio2)}.kpi.warn .val{color:var(--gold)}
  .sec{margin-top:22px}.sec h2{font-size:14px;color:var(--mut);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
  .bars{display:flex;flex-direction:column;gap:9px}
  .bar{display:flex;align-items:center;gap:10px;font-size:13px}
  .bar .name{width:130px;color:var(--mut);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bar .track{flex:1;height:12px;background:#23243c;border-radius:99px;overflow:hidden}
  .bar .fill{height:12px;background:linear-gradient(90deg,var(--vio2),var(--vio));border-radius:99px}
  .bar .n{width:44px;text-align:right;font-weight:800}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;color:var(--mut);font-weight:700;padding:8px 10px;border-bottom:1px solid var(--line);font-size:12px;text-transform:uppercase}
  td{padding:9px 10px;border-bottom:1px solid var(--line)}
  .tbl-wrap{overflow-x:auto}
  .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:800}
  .b-prem{background:rgba(124,58,237,.2);color:var(--vio2)}.b-ver{background:rgba(56,199,147,.18);color:var(--grn)}
  .b-ban{background:rgba(229,72,77,.18);color:var(--red)}.b-inc{background:rgba(255,138,91,.16);color:var(--gold)}
  .btn{border:1px solid var(--line);background:#20223a;color:var(--ink);padding:5px 10px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;margin:2px}
  .btn:hover{border-color:var(--vio)}
  .btn.red{color:var(--red);border-color:rgba(229,72,77,.4)}.btn.grn{color:var(--grn)}.btn.vio{color:var(--vio2)}
  .login{max-width:360px;margin:12vh auto;text-align:center}
  .login input{width:100%;padding:13px;border-radius:11px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:15px;margin:12px 0}
  .login button{width:100%;padding:13px;border-radius:11px;border:0;background:var(--vio);color:#fff;font-weight:800;font-size:15px;cursor:pointer}
  .muted{color:var(--mut)}.err{color:var(--red);font-size:13px;margin-top:8px}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:720px){.row2{grid-template-columns:1fr}}
  .refresh{margin-left:auto;color:var(--mut);font-size:12px;cursor:pointer}
  .search{padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:13px;margin-bottom:10px;width:240px;max-width:100%}
</style>
</head>
<body>
<div id="app"></div>
<script>
var KEY = localStorage.getItem('sladmin') || '';
var TAB = 'over';
var CACHE = {};
function el(id){return document.getElementById(id)}
function fmt(n){return (n||0).toLocaleString('fr-FR')}
function api(action, opts){return fetch('?action='+action+'&key='+encodeURIComponent(KEY), opts||{}).then(function(r){return r.json()})}
function post(action, data){return api(action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})})}

function loginView(msg){
  document.getElementById('app').innerHTML =
   '<div class="login"><div class="logo" style="margin:0 auto 14px">💜</div>'+
   '<h1>SenLove Admin</h1><p class="sub">Entre ta clé admin pour continuer</p>'+
   '<input id="k" type="password" placeholder="Clé admin" autofocus/>'+
   '<button onclick="doLogin()">Se connecter</button>'+
   (msg?'<div class="err">'+msg+'</div>':'')+'</div>';
  var i=el('k'); if(i) i.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});
}
function doLogin(){ KEY = el('k').value.trim(); localStorage.setItem('sladmin',KEY); boot(); }
function logout(){ localStorage.removeItem('sladmin'); KEY=''; loginView(); }

function shell(content){
  document.getElementById('app').innerHTML =
   '<div class="wrap"><header><div class="logo">💜</div><div><h1>SenLove — Admin</h1>'+
   '<div class="sub">Pilotage du SaaS</div></div><div class="refresh" onclick="render()">↻ Rafraîchir</div>'+
   '<button class="btn" style="margin-left:10px" onclick="logout()">Déconnexion</button></header>'+
   '<div class="tabs">'+
     tabBtn('over','Vue d\\'ensemble')+tabBtn('users','Utilisateurs')+tabBtn('reports','Signalements')+tabBtn('posts','Publications')+
   '</div><div id="content">'+content+'</div></div>';
}
function tabBtn(id,label){return '<div class="tab '+(TAB===id?'on':'')+'" onclick="go(\\''+id+'\\')">'+label+'</div>'}
function go(t){TAB=t;render()}

function kpi(lbl,val,hint,cls){return '<div class="kpi '+(cls||'')+'"><div class="lbl">'+lbl+'</div><div class="val">'+val+'</div>'+(hint?'<div class="hint">'+hint+'</div>':'')+'</div>'}
function barChart(rows,total){
  var max=Math.max(1,total||Math.max.apply(null,rows.map(function(r){return r[1]})));
  return '<div class="bars">'+rows.map(function(r){
    return '<div class="bar"><div class="name">'+r[0]+'</div><div class="track"><div class="fill" style="width:'+Math.round(r[1]/max*100)+'%"></div></div><div class="n">'+r[1]+'</div></div>';
  }).join('')+'</div>';
}

function overView(k){
  var a=k.acquisition,ac=k.activation,e=k.engagement,m=k.monetization,h=k.health;
  var cards=[
    kpi('Utilisateurs',fmt(a.total),'+'+a.new1+' aujourd\\'hui','vio'),
    kpi('Nouveaux 7j',fmt(a.new7),'30j : '+fmt(a.new30)),
    kpi('Profils complets',ac.completeRate+'%',fmt(ac.complete)+' / '+fmt(a.total),'good'),
    kpi('Vérifiés',fmt(ac.verified),fmt(ac.withPhoto)+' avec photo'),
    kpi('Matchs',fmt(e.matches),'+'+e.matches7+' sur 7j'),
    kpi('Messages',fmt(e.messages),'+'+e.messages7+' sur 7j'),
    kpi('Premium actifs',fmt(m.premiumActive),'Conversion '+m.conversion+'%','vio'),
    kpi('Revenu total',fmt(m.revenue)+' F','30j : '+fmt(m.revenue30)+' F','good'),
    kpi('ARPU',fmt(m.arpu)+' F','revenu / utilisateur'),
    kpi('Commandes payées',fmt(m.orders),'Wave '+fmt(m.wave)+' · OM '+fmt(m.om)),
    kpi('Signalements',fmt(h.reports),'à traiter',h.reports>0?'warn':''),
    kpi('Bannis',fmt(h.banned),'',h.banned>0?'warn':''),
  ].join('');
  var gender=[['Femmes',k.byGender.F],['Hommes',k.byGender.H],['Autre',k.byGender.A]];
  return '<div class="grid">'+cards+'</div>'+
    '<div class="sec row2">'+
      '<div><div class="card"><h2 style="margin-bottom:12px">Répartition par genre</h2>'+barChart(gender,k.byGender.F+k.byGender.H+k.byGender.A)+'</div></div>'+
      '<div><div class="card"><h2 style="margin-bottom:12px">Top régions</h2>'+barChart(k.byRegion)+'</div></div>'+
    '</div>';
}

function usersView(d){
  var rows=(d.users||[]).map(function(u){
    var tags=(u.premiumActive?'<span class="badge b-prem">Premium</span> ':'')+(u.verified?'<span class="badge b-ver">Vérifié</span> ':'')+(u.banned?'<span class="badge b-ban">Banni</span> ':'')+(!u.complete?'<span class="badge b-inc">Incomplet</span>':'');
    var isMe=u.is_me;
    var acts=isMe?'<span class="muted">— compte admin —</span>':(
      '<button class="btn vio" onclick="act(\\'premium\\',\\''+u.id+'\\',{on:'+(!u.premiumActive)+'})">'+(u.premiumActive?'Retirer Premium':'Offrir Premium')+'</button>'+
      '<button class="btn grn" onclick="act(\\'verify\\',\\''+u.id+'\\',{on:'+(!u.verified)+'})">'+(u.verified?'Dé-vérifier':'Vérifier')+'</button>'+
      (u.banned?'<button class="btn" onclick="act(\\'unban\\',\\''+u.id+'\\')">Débannir</button>':'<button class="btn red" onclick="act(\\'ban\\',\\''+u.id+'\\')">Bannir</button>')+
      '<button class="btn red" onclick="delUser(\\''+u.id+'\\',\\''+(u.name||'')+'\\')">Supprimer</button>'
    );
    return '<tr><td><b>'+(u.name||'?')+'</b>'+(u.age?', '+u.age:'')+'<br><span class="muted">'+(u.region||u.city||'—')+' · '+(u.gender||'?')+'</span></td>'+
      '<td>'+tags+'</td><td>'+acts+'</td></tr>';
  }).join('');
  return '<input class="search" id="usearch" placeholder="Rechercher un nom..." oninput="filterUsers(this.value)"/>'+
    '<div class="card tbl-wrap"><table><thead><tr><th>Utilisateur</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="ubody">'+rows+'</tbody></table></div>';
}
function filterUsers(q){
  q=(q||'').toLowerCase();
  var rows=(CACHE.users&&CACHE.users.users||[]).filter(function(u){return (u.name||'').toLowerCase().indexOf(q)>=0});
  el('ubody').innerHTML = usersView({users:rows}).split('<tbody id="ubody">')[1].split('</tbody>')[0];
}

function reportsView(d){
  if(!d.reports||!d.reports.length) return '<div class="card"><p class="muted">Aucun signalement. 🎉</p></div>';
  var rows=d.reports.map(function(r){
    return '<tr><td><b>'+r.targetName+'</b><br><span class="muted">'+(r.target)+'</span></td>'+
      '<td>'+(r.reason||'—')+'</td><td class="muted">'+(r.created_at||'').slice(0,10)+'</td>'+
      '<td><button class="btn red" onclick="resolveRep(\\''+r.id+'\\',\\''+r.target+'\\',true)">Bannir l\\'utilisateur</button>'+
      '<button class="btn" onclick="resolveRep(\\''+r.id+'\\',\\''+r.target+'\\',false)">Ignorer</button></td></tr>';
  }).join('');
  return '<div class="card tbl-wrap"><table><thead><tr><th>Signalé</th><th>Motif</th><th>Date</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function postsView(d){
  if(!d.posts||!d.posts.length) return '<div class="card"><p class="muted">Aucune publication.</p></div>';
  var rows=d.posts.map(function(p){
    var media=p.photo?'<img src="'+p.photo+'" style="width:46px;height:46px;border-radius:8px;object-fit:cover"/>':'<span class="muted">texte</span>';
    return '<tr><td>'+media+'</td><td><b>'+p.authorName+'</b></td><td>'+(p.body||'').slice(0,80)+'</td>'+
      '<td class="muted">❤ '+(p.likes||0)+'</td><td><button class="btn red" onclick="act(\\'delete_post\\',\\''+p.id+'\\')">Supprimer</button></td></tr>';
  }).join('');
  return '<div class="card tbl-wrap"><table><thead><tr><th></th><th>Auteur</th><th>Contenu</th><th></th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function act(action,id,data){ post(action,Object.assign({id:id},data||{})).then(function(r){ if(r&&r.error){alert('Erreur: '+r.error)} render(); }); }
function delUser(id,name){ if(confirm('Supprimer définitivement '+name+' ? Cette action est irréversible.')) act('delete_user',id); }
function resolveRep(reportId,target,ban){ post('resolve_report',{reportId:reportId,target:target,ban:ban}).then(render); }

function render(){
  shell('<div class="card"><p class="muted">Chargement…</p></div>');
  var map={over:'kpis',users:'users',reports:'reports',posts:'posts'};
  api(map[TAB]).then(function(d){
    if(d&&d.error==='unauthorized'){ return loginView('Clé invalide.'); }
    CACHE[TAB]=d;
    var html = TAB==='over'?overView(d):TAB==='users'?usersView(d):TAB==='reports'?reportsView(d):postsView(d);
    var c=el('content'); if(c) c.innerHTML=html;
  }).catch(function(){ var c=el('content'); if(c) c.innerHTML='<div class="card err">Erreur de chargement.</div>'; });
}
function boot(){ if(!KEY){loginView();return;} render(); }
boot();
</script>
</body>
</html>`;
