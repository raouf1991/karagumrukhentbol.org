const cfg=window.KH_SUPABASE||{};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null;

function status(text,error=false){const el=$('#scriptStatus');if(el){el.textContent=text;el.style.color=error?'#a00000':'#666';}}
function loginError(text=''){const el=$('#loginError');if(el)el.textContent=text;}
function toast(text,error=false){const el=$('#toast');if(!el)return;el.textContent=text;el.style.background=error?'#8b0000':'#111';el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000);}
function showLogin(){ $('#loginView')?.classList.remove('hidden'); $('#appView')?.classList.add('hidden'); }
function showPanel(user){ $('#loginView')?.classList.add('hidden'); $('#appView')?.classList.remove('hidden'); $('#userEmail').textContent=user?.email||''; }
function withTimeout(promise,ms=15000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('İstek zaman aşımına uğradı.')),ms))]);}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
function emptyToNull(v){return v===''?null:v;}

async function init(){
  try{
    if(!window.supabase) throw new Error('Supabase kütüphanesi yüklenemedi.');
    if(!cfg.url||!cfg.publishableKey) throw new Error('Supabase bağlantı ayarları eksik.');
    db=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await withTimeout(db.auth.getSession(),10000);
    if(error) throw error;
    status('Sistem hazır');
    if(data.session?.user){showPanel(data.session.user);await loadAll();}else showLogin();
  }catch(err){showLogin();loginError(err.message||String(err));status('Bağlantı hatası',true);}
}

$('#loginForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('#loginButton');
  loginError('');
  btn.disabled=true;btn.textContent='Giriş yapılıyor...';
  try{
    const email=$('#email').value.trim();
    const password=$('#password').value;
    const {data,error}=await withTimeout(db.auth.signInWithPassword({email,password}),15000);
    if(error) throw error;
    if(!data.user) throw new Error('Kullanıcı bilgisi alınamadı.');
    showPanel(data.user);
    status('Giriş başarılı');
    await loadAll();
  }catch(err){loginError('Giriş başarısız: '+(err.message||String(err)));status('Sistem hazır');}
  finally{btn.disabled=false;btn.textContent='Giriş Yap';}
});

$('#logout')?.addEventListener('click',async()=>{await db.auth.signOut();showLogin();status('Sistem hazır');});
$('#refresh')?.addEventListener('click',loadAll);
$$('.side [data-tab]').forEach(btn=>btn.addEventListener('click',()=>{$$('.tab').forEach(t=>t.classList.add('hidden'));$('#'+btn.dataset.tab)?.classList.remove('hidden');$('#pageTitle').textContent=btn.textContent.trim();}));

async function queryOrThrow(builder){const res=await builder;if(res.error)throw res.error;return res.data||[];}
async function loadAll(){try{await Promise.all([loadSettings(),loadNews(),loadMatches(),loadPlayers(),loadApplications('academy_applications','#academyList'),loadApplications('membership_requests','#membershipList'),loadSponsors(),loadCounts()]);}catch(err){toast(err.message||String(err),true);}}
async function loadCounts(){const tables=['news','matches','players'];const results=await Promise.all(tables.map(t=>db.from(t).select('*',{count:'exact',head:true})));$('#countNews').textContent=results[0].count||0;$('#countMatches').textContent=results[1].count||0;$('#countPlayers').textContent=results[2].count||0;const [a,u]=await Promise.all([db.from('academy_applications').select('*',{count:'exact',head:true}).eq('status','new'),db.from('membership_requests').select('*',{count:'exact',head:true}).eq('status','new')]);$('#countApps').textContent=(a.count||0)+(u.count||0);}
async function loadSettings(){const {data,error}=await db.from('site_settings').select('*').eq('id',1).maybeSingle();if(error)throw error;if(!data)return;const f=$('#settingsForm');Object.entries(data).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v??''});}
$('#settingsForm')?.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(e.currentTarget);d.club_logo_size=Number(d.club_logo_size||110);d.updated_at=new Date().toISOString();const {error}=await db.from('site_settings').update(d).eq('id',1);if(error)toast(error.message,true);else toast('Ayarlar kaydedildi');});
function listHtml(rows,render){return rows.length?rows.map(render).join(''):'<p>Kayıt yok.</p>';}
function bindDelete(){$$('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Silmek istediğinizden emin misiniz?'))return;const {error}=await db.from(b.dataset.delete).delete().eq('id',b.dataset.id);if(error)toast(error.message,true);else{toast('Silindi');loadAll();}});}
async function loadNews(){const data=await queryOrThrow(db.from('news').select('*').order('published_at',{ascending:false}));$('#newsList').innerHTML=listHtml(data,n=>`<div class="card"><strong>${esc(n.title_tr)}</strong><p>${esc(n.body_tr||'')}</p><small>${n.published?'Yayında':'Taslak'}</small><div class="actions"><button class="btn danger" data-delete="news" data-id="${n.id}">Sil</button></div></div>`);bindDelete();}
$('#newsForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=formObject(f);d.published=f.elements.published.checked;d.published_at=new Date().toISOString();const {error}=await db.from('news').insert(d);if(error)toast(error.message,true);else{toast('Haber eklendi');f.reset();loadAll();}});
async function loadMatches(){const data=await queryOrThrow(db.from('matches').select('*').order('match_date',{ascending:false}));$('#matchList').innerHTML=listHtml(data,m=>`<div class="card"><strong>${esc(m.opponent)}</strong><p>${new Date(m.match_date).toLocaleString('tr-TR')} · ${esc(m.venue||'')}</p><small>${esc(m.status)}</small><div class="actions"><button class="btn danger" data-delete="matches" data-id="${m.id}">Sil</button></div></div>`);bindDelete();}
$('#matchForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=formObject(f);d.match_date=new Date(d.match_date).toISOString();d.home_score=emptyToNull(d.home_score)==null?null:Number(d.home_score);d.away_score=emptyToNull(d.away_score)==null?null:Number(d.away_score);const {error}=await db.from('matches').insert(d);if(error)toast(error.message,true);else{toast('Maç eklendi');f.reset();loadAll();}});
async function loadPlayers(){const data=await queryOrThrow(db.from('players').select('*').order('number'));$('#playerList').innerHTML=listHtml(data,p=>`<div class="card"><strong>${esc(p.number??'')} ${esc(p.name)}</strong><p>${esc(p.position_tr||'')}</p><small>${p.active?'Aktif':'Pasif'}</small><div class="actions"><button class="btn danger" data-delete="players" data-id="${p.id}">Sil</button></div></div>`);bindDelete();}
$('#playerForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=formObject(f);d.number=emptyToNull(d.number)==null?null:Number(d.number);d.active=f.elements.active.checked;const {error}=await db.from('players').insert(d);if(error)toast(error.message,true);else{toast('Oyuncu eklendi');f.reset();loadAll();}});
async function loadApplications(table,target){const data=await queryOrThrow(db.from(table).select('*').order('created_at',{ascending:false}));$(target).innerHTML=listHtml(data,a=>`<div class="card"><strong>${esc(a.full_name)}</strong><p>${esc(a.email)} · ${esc(a.phone||'')}</p><p>${esc(a.age_group||a.reason||'')}</p><select data-status-table="${table}" data-id="${a.id}"><option value="new" ${a.status==='new'?'selected':''}>Yeni</option><option value="reviewing" ${a.status==='reviewing'?'selected':''}>İnceleniyor</option><option value="accepted" ${a.status==='accepted'?'selected':''}>Kabul</option><option value="rejected" ${a.status==='rejected'?'selected':''}>Red</option></select></div>`);$$('[data-status-table]').forEach(s=>s.onchange=async()=>{const {error}=await db.from(s.dataset.statusTable).update({status:s.value}).eq('id',s.dataset.id);if(error)toast(error.message,true);else toast('Durum güncellendi');});}
async function loadSponsors(){const data=await queryOrThrow(db.from('sponsors').select('*').order('sort_order'));$('#sponsorList').innerHTML=listHtml(data,s=>`<div class="card"><strong>${esc(s.name)}</strong><p>${esc(s.website_url||'')}</p><div class="actions"><button class="btn danger" data-delete="sponsors" data-id="${s.id}">Sil</button></div></div>`);bindDelete();}
$('#sponsorForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=formObject(f);d.sort_order=Number(d.sort_order||0);d.active=true;const {error}=await db.from('sponsors').insert(d);if(error)toast(error.message,true);else{toast('Sponsor eklendi');f.reset();loadAll();}});

init();
