(()=>{
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function excerpt(text,max=150){const s=String(text||'').replace(/\s+/g,' ').trim();return s.length>max?s.slice(0,max).trimEnd()+'…':s;}
  function decorate(){
    const grid=document.getElementById('newsGrid');
    if(!grid||!Array.isArray(window.cmsNews)&&typeof cmsNews==='undefined')return;
    let items=[];
    try{items=typeof cmsNews!=='undefined'?cmsNews:(window.cmsNews||[]);}catch(_){items=window.cmsNews||[];}
    const cards=[...grid.querySelectorAll('.news-card')];
    cards.forEach((card,i)=>{
      const n=items[i];
      if(!n||card.dataset.newsLinked==='1')return;
      card.dataset.newsLinked='1';
      const lang=localStorage.getItem('siteLang')||'tr';
      const title=lang==='tr'?(n.title_tr||''):(n.title_en||n.title_tr||'');
      const body=lang==='tr'?(n.body_tr||''):(n.body_en||n.body_tr||'');
      const href=`news.html?id=${encodeURIComponent(n.id)}`;
      const img=card.querySelector('.news-image');
      const h3=card.querySelector('h3');
      const p=card.querySelector('p');
      if(p)p.textContent=excerpt(body);
      if(img){const a=document.createElement('a');a.href=href;a.setAttribute('aria-label',title);img.parentNode.insertBefore(a,img);a.appendChild(img);}
      if(h3){const a=document.createElement('a');a.href=href;a.textContent=h3.textContent;a.style.cssText='color:inherit;text-decoration:none';h3.textContent='';h3.appendChild(a);}
      const bodyBox=card.querySelector('.news-body')||card;
      const more=document.createElement('a');more.href=href;more.textContent=lang==='tr'?'Devamını Oku →':'Read More →';more.style.cssText='display:inline-block;margin-top:12px;color:#e10600;font-weight:800;text-decoration:none';bodyBox.appendChild(more);
      card.style.cursor='pointer';
      card.addEventListener('click',e=>{if(e.target.closest('a'))return;location.href=href;});
    });
  }
  const observer=new MutationObserver(decorate);
  function start(){const grid=document.getElementById('newsGrid');if(!grid)return setTimeout(start,250);observer.observe(grid,{childList:true,subtree:true});decorate();setTimeout(decorate,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();