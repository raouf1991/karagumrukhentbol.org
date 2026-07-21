(()=>{
  function addLink(){
    const side=document.querySelector('.side');
    if(!side||side.querySelector('[data-player-profiles-link]'))return;
    const link=document.createElement('a');
    link.href='admin-player-profiles.html';
    link.dataset.playerProfilesLink='1';
    link.textContent='Oyuncu / Antrenör Profilleri';
    const playersBtn=side.querySelector('[data-tab="players"]');
    if(playersBtn) playersBtn.after(link); else side.appendChild(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addLink);
  else addLink();
  new MutationObserver(addLink).observe(document.documentElement,{childList:true,subtree:true});
})();
