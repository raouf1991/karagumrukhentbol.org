const news = [
  {date:'18.07.2026',tr:'Yeni sezon hazırlıkları başladı',en:'Pre-season preparations have begun',trText:'Takımımız yeni sezon için ilk antrenmanını gerçekleştirdi.',enText:'Our team held its first training session for the new season.'},
  {date:'15.07.2026',tr:'Akademi kayıtları açıldı',en:'Academy registration is open',trText:'Genç sporcular için yeni dönem başvuruları başladı.',enText:'Applications for the new academy term are now open.'},
  {date:'10.07.2026',tr:'Vitorra ile resmi iş birliği',en:'Official partnership with Vitorra',trText:'Vitorra, kulübümüzün resmi spor giyim partneri oldu.',enText:'Vitorra is now the club’s official sportswear partner.'}
];
let currentLang='tr';
const grid=document.getElementById('newsGrid');
function renderNews(){grid.innerHTML=news.map(n=>`<article class="news-card"><div class="news-image"></div><div class="news-body"><time>${n.date}</time><h3>${currentLang==='tr'?n.tr:n.en}</h3><p>${currentLang==='tr'?n.trText:n.enText}</p></div></article>`).join('')}
function setLang(lang){currentLang=lang;document.documentElement.lang=lang;document.querySelectorAll('[data-tr]').forEach(el=>{el.textContent=el.dataset[lang]});document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));localStorage.setItem('siteLang',lang);renderNews()}
document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>setLang(btn.dataset.lang)));
document.querySelector('.menu-toggle').addEventListener('click',()=>document.querySelector('.main-nav').classList.toggle('open'));
document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();alert(currentLang==='tr'?'Form alındı. Supabase bağlantısı bir sonraki aşamada etkinleştirilecek.':'Form received. Supabase connection will be enabled in the next phase.')}));
setLang(localStorage.getItem('siteLang')||'tr');
