const cfg=window.KH_SUPABASE||{};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null;

function setStatus(text,isError=false){const el=$('#bootStatus');if(el){el.textContent=text;el.style.color=isError?'#a00000':'#444';}}
function setLoginError(text=''){const el=$('#loginError');if(el)el.textContent=text;}
function toast(text){const el=$('#toast');if(!el)return;el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2500);}
function withTimeout(promise,ms=15000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('İstek zaman aşımına uğradı.')),ms))]);}
function showLogin(){ $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden'); }

async function checkAdmin(){
  const {data,error}=await withTimeout(db.rpc('is_admin'));
  if(error) throw error;
  return data===true;
}

async function enterPanel(session){
  if(!session?.user){showLogin();return;}
  setStatus('Yönetici hesabı kontrol ediliyor...');
  const ok=await checkAdmin();
  if(!ok){await db.auth.signOut();showLogin();setLoginError('Bu hesap yönetici olarak tanımlı değil.');setStatus('Sistem hazır');return;}
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  $('#userEmail').textContent=session.user.email||'';
  setStatus('');
  await loadAll();
}

async function init(){
  try{
    if(!window.supabase) throw new Error('Supabase kütüphanesi yüklenemedi.');
    if(!cfg.url||!cfg.publishableKey) throw new Error('Supabase ayarları eksik.');
    db=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    setStatus('Sistem hazır');
    const {data,error}=await withTimeout(db.auth.getSession(),10000);
    if(error) throw error;
    if(data.session) await enterPanel(data.session); else showLogin();
  }catch(err){setLoginError(err.message||String(err));setStatus('Bağlantı hatası',true);showLogin();}
}

$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('#email').value.trim();
  const password=$('#password').value;
  const btn=e.currentTarget.querySelector('button[type="submit"]');
  setLoginError('');
  btn.disabled=true;btn.textContent='Giriş yapılıyor...';
  try{
    const {data,error}=await withTimeout(db.auth.signInWithPassword({email,password}),15000);
    if(error) throw error;
    await enterPanel(data.session);
  }catch(err){setLoginError('Giriş başarısız: '+(err.message||String(err)));}
  finally{btn.disabled=false;btn.textContent='Giriş Yap';}
});

$('#logout').addEventListener('click',async()=>{await db.auth.signOut();showLogin();setStatus('Sistem hazır');});
$('#refresh').addEventListener('click',()=>loadAll());
$$('.side [data-tab]').forEach(btn=>btn.addEventListener('click',()=>{$$('.tab').forEach(t=>t.classList.add('hidden'));$('#'+btn.dataset.tab).classList.remove('hidden');$('#pageTitle').textContent=btn.textContent.trim();}));

async function loadAll(){await Promise.all([loadSettings(),loadNews(),loadMatches(),loadPlayers(),loadApplications('academy_applications','#academyList'),loadApplications('membership_requests','#membershipList'),loadSponsors(),loadCounts()]);}
async function loadCounts(){const [n,m,p,a,u]=await Promise.all([db.from('news').select('*',{count:'exact',head:true}),db.from('matches').select('*',{count:'exact',head:true}),db.from('players').select('*',{count:'exact',head:true}),db.from('academy_applications').select('*',{count:'exact',head:true}).eq('status','new'),db.from('membership_requests').select('*',{count:'exact',head:true}).eq('status','new')]);$('#countNews').textContent=n.count||0;$('#countMatches').textContent=m.count||0;$('#countPlayers').textContent=p.count||0;$('#countApps').textContent=(a.count||0)+(u.count||0);}
async function loadSettings(){const {data}=await db.from('site_settings').select('*').eq('id',1).maybeSingle();if(!data)return;const f=$('#settingsForm');Object.entries(data).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v??''});}
$('#settingsForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f));d.club_logo_size=Number(d.club_logo_size||110);d.updated_at=new Date().toISOString();const {error}=await db.from('site_settings').update(d).eq('id',1);toast(error?error.message:'Ayarlar kaydedildi');});
function listHtml(rows,render){return rows.length?rows.map(render).join(''):'<p>Kayıt yok.</p>'}
function bindDelete(){$$('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Silmek istediğinizden emin misiniz?'))return;const {error}=await db.from(b.dataset.delete).delete().eq('id',b.dataset.id);toast(error?error.message:'Silindi');if(!error)loadAll();});}
async function loadNews(){const {data=[]}=await db.from('news').select('*').order('published_at',{ascending:false});$('#newsList').innerHTML=listHtml(data,n=>`<div class="card"><strong>${esc(n.title_tr)}</strong><p>${esc(n.body_tr||'')}</p><button class="btn danger" data-delete="news" data-id="${n.id}">Sil</button></div>`);bindDelete();}
$('#newsForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f));d.published=f.elements.published.checked;d.published_at=new Date().toISOString();const {error}=await db.from('news').insert(d);toast(error?error.message:'Haber eklendi');if(!error){f.reset();loadNews();loadCounts();}});
async function loadMatches(){const {data=[]}=await db.from('matches').select('*').order('match_date',{ascending:false});$('#matchList').innerHTML=listHtml(data,m=>`<div class="card"><strong>${esc(m.opponent)}</strong><p>${new Date(m.match_date).toLocaleString('tr-TR')} · ${esc(m.venue||'')}</p><button class="btn danger" data-delete="matches" data-id="${m.id}">Sil</button></div>`);bindDelete();}
$('#matchForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f));d.match_date=new Date(d.match_date).toISOString();d.home_score=d.home_score===''?null:Number(d.home_score);d.away_score=d.away_score===''?null:Number(d.away_score);const {error}=await db.from('matches').insert(d);toast(error?error.message:'Maç eklendi');if(!error){f.reset();loadMatches();loadCounts();}});
async function loadPlayers(){const {data=[]}=await db.from('players').select('*').order('number');$('#playerList').innerHTML=listHtml(data,p=>`<div class="card"><strong>${esc(p.number??'')} ${esc(p.name)}</strong><p>${esc(p.position_tr||'')}</p><button class="btn danger" data-delete="players" data-id="${p.id}">Sil</button></div>`);bindDelete();}
$('#playerForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f));d.number=d.number===''?null:Number(d.number);d.active=f.elements.active.checked;const {error}=await db.from('players').insert(d);toast(error?error.message:'Oyuncu eklendi');if(!error){f.reset();loadPlayers();loadCounts();}});
async function loadApplications(table,target){const {data=[],error}=await db.from(table).select('*').order('created_at',{ascending:false});if(error){$(target).innerHTML='<p>'+esc(error.message)+'</p>';return;}$(target).innerHTML=listHtml(data,a=>`<div class="card"><strong>${esc(a.full_name)}</strong><p>${esc(a.email)} · ${esc(a.phone||'')}</p><p>${esc(a.age_group||a.reason||'')}</p><select data-status-table="${table}" data-id="${a.id}"><option value="new" ${a.status==='new'?'selected':''}>Yeni</option><option value="reviewing" ${a.status==='reviewing'?'selected':''}>İnceleniyor</option><option value="accepted" ${a.status==='accepted'?'selected':''}>Kabul</option><option value="rejected" ${a.status==='rejected'?'selected':''}>Red</option></select></div>`);$$('[data-status-table]').forEach(s=>s.onchange=async()=>{const {error}=await db.from(s.dataset.statusTable).update({status:s.value}).eq('id',s.dataset.id);toast(error?error.message:'Durum güncellendi');});}
async function loadSponsors(){const {data=[]}=await db.from('sponsors').select('*').order('sort_order');$('#sponsorList').innerHTML=listHtml(data,s=>`<div class="card"><strong>${esc(s.name)}</strong><p>${esc(s.website_url||'')}</p><button class="btn danger" data-delete="sponsors" data-id="${s.id}">Sil</button></div>`);bindDelete();}
$('#sponsorForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f));d.sort_order=Number(d.sort_order||0);d.active=true;const {error}=await db.from('sponsors').insert(d);toast(error?error.message:'Sponsor eklendi');if(!error){f.reset();loadSponsors();}});

init();