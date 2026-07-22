import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL='https://ukhnlbqjmulasfvgiqgn.supabase.co';
const SUPABASE_KEY='sb_publishable_nJDc_QBLF2IIr_we4PDJPQ_64YuLovu';
const SITE_URL='https://karagumrukhentbol.org';
const OUT_DIR='news';

const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=(v='')=>String(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const slugify=(v='')=>String(v).toLocaleLowerCase('tr-TR')
 .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
 .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90)||'haber';
const fileName=n=>`${slugify(n.title_tr||n.title_en)}-${n.id}.html`;

async function getNews(){
 const url=`${SUPABASE_URL}/rest/v1/news?published=eq.true&select=*&order=published_at.desc`;
 const r=await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
 if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);
 return r.json();
}

function page(n,all){
 const title=n.title_tr||n.title_en||'Haber';
 const body=n.body_tr||n.body_en||'';
 const desc=plain(body).slice(0,190)||'Karagümrük Hentbol Spor Kulübü haberleri';
 const image=n.image_url||`${SITE_URL}/assets/club-logo.png`;
 const canonical=`${SITE_URL}/news/${fileName(n)}`;
 const date=new Date(n.published_at||n.created_at||Date.now()).toLocaleDateString('tr-TR',{year:'numeric',month:'long',day:'numeric'});
 const related=all.filter(x=>x.id!==n.id).slice(0,3).map(x=>`<a class="card" href="/news/${fileName(x)}">${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.title_tr||x.title_en||'')}">`:''}<h3>${esc(x.title_tr||x.title_en||'')}</h3></a>`).join('');
 return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Karagümrük Hentbol</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Karagümrük Hentbol Spor Kulübü"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:secure_url" content="${esc(image)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:locale" content="tr_TR"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f3f4f6;color:#151515;font-family:Inter,Arial,sans-serif}.top{background:#111;color:#fff}.wrap{width:min(1040px,calc(100% - 32px));margin:auto}.nav{min-height:82px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:13px;color:#fff;text-decoration:none;font:800 24px 'Barlow Condensed',sans-serif}.brand img{width:62px;height:62px;object-fit:contain;background:#fff;border-radius:50%}.back{color:#fff;text-decoration:none;font-weight:700}.hero{background:linear-gradient(135deg,#111,#290000);padding:58px 0 105px;color:#fff}.kick{color:#ff423d;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hero h1{font:800 clamp(38px,7vw,74px)/1 'Barlow Condensed',sans-serif;margin:14px 0 20px;max-width:950px}.date{color:#ddd}.article{width:min(900px,calc(100% - 32px));margin:-62px auto 58px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 60px #0002}.cover{display:block;width:100%;max-height:560px;object-fit:cover}.content{padding:clamp(25px,5vw,56px)}.body{white-space:pre-wrap;font-size:18px;line-height:1.85}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:34px;padding-top:22px;border-top:1px solid #ddd}.btn{padding:13px 18px;border-radius:8px;text-decoration:none;font-weight:800}.red{background:#e10600;color:#fff}.black{background:#111;color:#fff}.related{padding-bottom:60px}.related h2{font:800 36px 'Barlow Condensed',sans-serif}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px #0001;color:#111;text-decoration:none}.card img{width:100%;height:170px;object-fit:cover}.card h3{font:700 24px 'Barlow Condensed',sans-serif;padding:16px;margin:0}@media(max-width:760px){.grid{grid-template-columns:1fr}.brand span{display:none}}</style></head><body><header class="top"><div class="wrap nav"><a class="brand" href="/"><img src="/assets/club-logo.png" alt="Karagümrük Hentbol"><span>KARAGÜMRÜK HENTBOL</span></a><a class="back" href="/#news">← Haberlere Dön</a></div></header><main><section class="hero"><div class="wrap"><span class="kick">Kulüpten Haberler</span><h1>${esc(title)}</h1><time class="date">${esc(date)}</time></div></section><article class="article">${n.image_url?`<img class="cover" src="${esc(n.image_url)}" alt="${esc(title)}">`:''}<div class="content"><div class="body">${esc(body)}</div><div class="actions"><a class="btn red" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(title+' '+canonical)}">WhatsApp’ta Paylaş</a><a class="btn black" href="${esc(canonical)}">Bağlantıyı Kopyala</a></div></div></article><section class="wrap related"><h2>Diğer Haberler</h2><div class="grid">${related}</div></section></main><script>document.querySelector('.black').addEventListener('click',async e=>{e.preventDefault();await navigator.clipboard.writeText(location.href);alert('Bağlantı kopyalandı.');});</script></body></html>`;
}

const news=await getNews();
await fs.rm(OUT_DIR,{recursive:true,force:true});
await fs.mkdir(OUT_DIR,{recursive:true});
for(const n of news)await fs.writeFile(path.join(OUT_DIR,fileName(n)),page(n,news),'utf8');
await fs.writeFile(path.join(OUT_DIR,'index.json'),JSON.stringify(news.map(n=>({id:n.id,url:`/news/${fileName(n)}`})),null,2),'utf8');
console.log(`Generated ${news.length} static news pages.`);
