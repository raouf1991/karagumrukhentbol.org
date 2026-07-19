const news = [
  {date:'18.07.2026',tr:'Yeni sezon hazırlıkları başladı',en:'Pre-season preparations have begun',trText:'Takımımız yeni sezon için ilk antrenmanını gerçekleştirdi.',enText:'Our team held its first training session for the new season.'},
  {date:'15.07.2026',tr:'Akademi kayıtları açıldı',en:'Academy registration is open',trText:'Genç sporcular için yeni dönem başvuruları başladı.',enText:'Applications for the new academy term are now open.'},
  {date:'10.07.2026',tr:'Vitorra ile resmi iş birliği',en:'Official partnership with Vitorra',trText:'Vitorra, kulübümüzün resmi spor giyim partneri oldu.',enText:'Vitorra is now the club’s official sportswear partner.'}
];

const DEFAULT_SETTINGS = {
  clubLogoSize: 110,
  vitorraLogoWidth: 140,
  heroTitleSize: 88,
  heroMinHeight: 650,
  showPartnerBadge: true,
  showQuickLinks: true
};

let currentLang='tr';
const grid=document.getElementById('newsGrid');

function renderNews(){
  if(!grid) return;
  grid.innerHTML=news.map(n=>`<article class="news-card"><div class="news-image"></div><div class="news-body"><time>${n.date}</time><h3>${currentLang==='tr'?n.tr:n.en}</h3><p>${currentLang==='tr'?n.trText:n.enText}</p></div></article>`).join('');
}

function setLang(lang){
  currentLang=lang;
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-tr]').forEach(el=>{el.textContent=el.dataset[lang]});
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
  localStorage.setItem('siteLang',lang);
  renderNews();
}

function loadSiteSettings(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem('khSiteSettings')||'{}')}catch(e){saved={}}
  const s={...DEFAULT_SETTINGS,...saved};

  const clubLogo=document.querySelector('.brand img');
  if(clubLogo){
    clubLogo.style.width=`${s.clubLogoSize}px`;
    clubLogo.style.height=`${s.clubLogoSize}px`;
  }

  const vitorra=document.querySelector('.vitorra-mini');
  if(vitorra){
    vitorra.style.width=`${s.vitorraLogoWidth}px`;
    vitorra.style.height='auto';
    vitorra.style.objectFit='contain';
  }

  const heroTitle=document.querySelector('.hero h1');
  if(heroTitle) heroTitle.style.fontSize=`${s.heroTitleSize}px`;

  const hero=document.querySelector('.hero');
  const heroGrid=document.querySelector('.hero-grid');
  if(hero) hero.style.minHeight=`${s.heroMinHeight}px`;
  if(heroGrid) heroGrid.style.minHeight=`${s.heroMinHeight}px`;

  const partnerBadge=document.querySelector('.partner-badge');
  if(partnerBadge) partnerBadge.style.display=s.showPartnerBadge?'block':'none';

  const quickLinks=document.querySelector('.quick-links');
  if(quickLinks) quickLinks.style.display=s.showQuickLinks?'block':'none';
}

document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>setLang(btn.dataset.lang)));
const menuToggle=document.querySelector('.menu-toggle');
if(menuToggle) menuToggle.addEventListener('click',()=>document.querySelector('.main-nav')?.classList.toggle('open'));
document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();alert(currentLang==='tr'?'Form alındı. Supabase bağlantısı bir sonraki aşamada etkinleştirilecek.':'Form received. Supabase connection will be enabled in the next phase.')}));

loadSiteSettings();
setLang(localStorage.getItem('siteLang')||'tr');