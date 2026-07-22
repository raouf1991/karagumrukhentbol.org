(()=>{
 const cfg=window.KH_SUPABASE||{};
 const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function run(){
  const grid=document.getElementById('newsGrid');
  if(!grid||!cfg.url||!cfg.publishableKey)return setTimeout(run,400);
  try{
   const index=await fetch('/news/index.json?v='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():[]);
   const map=new Map(index.map(x=>[String(x.id),x.url]));
   if(!window.supabase)return setTimeout(run,400);
   const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
   const {data}=await db.from('news').select('id,title_tr,title_en,body_tr,body_en,image_url,published_at,created_at').eq('published',true).order('published_at',{ascending:false}).limit(6);
   if(!data?.length)return;
   const lang=localStorage.getItem('siteLang')||'tr';
   grid.innerHTML=data.map(n=>{const title=lang==='tr'?(n.title_tr||n.title_en||''):(n.title_en||n.title_tr||'');const body=lang==='tr'?(n.body_tr||n.body_en||''):(n.body_en||n.body_tr||'');const url=map.get(String(n.id))||`news.html?id=${encodeURIComponent(n.id)}`;const short=body.length>180?body.slice(0,180).trim()+'…':body;return `<a href="${esc(url)}" style="color:inherit;text-decoration:none;display:block"><article class="news-card" style="cursor:pointer;height:100%">${n.image_url?`<img class="news-image" src="${esc(n.image_url)}" alt="${esc(title)}">`:'<div class="news-image"></div>'}<div class="news-body"><time>${new Date(n.published_at||n.created_at||Date.now()).toLocaleDateString(lang==='tr'?'tr-TR':'en-GB')}</time><h3>${esc(title)}</h3><p>${esc(short)}</p><strong style="display:inline-block;margin-top:12px;color:#e10600">${lang==='tr'?'Devamını Oku':'Read More'} →</strong></div></article></a>`}).join('');
  }catch(e){console.error('Static news links:',e);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,700),{once:true});else setTimeout(run,700);
})();
