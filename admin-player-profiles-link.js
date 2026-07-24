(()=>{
  function loadEducationScript(){
    if(document.querySelector('script[data-education-admin-direct]')) return;
    const script=document.createElement('script');
    script.src='admin-education.js?v=20260724-direct3';
    script.defer=true;
    script.dataset.educationAdminDirect='1';
    document.head.appendChild(script);
  }

  function addLinks(){
    const side=document.querySelector('.side');
    if(!side) return;

    if(!side.querySelector('[data-player-profiles-link]')){
      const link=document.createElement('a');
      link.href='admin-player-profiles.html';
      link.dataset.playerProfilesLink='1';
      link.textContent='Oyuncu / Antrenör Profilleri';
      const playersBtn=side.querySelector('[data-tab="players"]');
      if(playersBtn) playersBtn.after(link); else side.appendChild(link);
    }

    if(!side.querySelector('[data-tab="education"]')){
      const button=document.createElement('button');
      button.type='button';
      button.dataset.tab='education';
      button.textContent='🎓 Eğitim Merkezi';
      const academyBtn=side.querySelector('[data-tab="academy"]');
      const profileLink=side.querySelector('[data-player-profiles-link]');
      if(academyBtn) side.insertBefore(button,academyBtn);
      else if(profileLink) profileLink.after(button);
      else side.appendChild(button);

      button.addEventListener('click',()=>{
        document.querySelectorAll('#appView .tab').forEach(tab=>tab.classList.add('hidden'));
        document.getElementById('education')?.classList.remove('hidden');
        const title=document.getElementById('pageTitle');
        if(title) title.textContent='Eğitim Merkezi';
      });
    }

    loadEducationScript();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addLinks);
  else addLinks();
  new MutationObserver(addLinks).observe(document.documentElement,{childList:true,subtree:true});
})();