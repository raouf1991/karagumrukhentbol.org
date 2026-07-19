const cfg=window.KH_SUPABASE||{};
const db=window.supabase?.createClient(cfg.url,cfg.publishableKey);
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2500)};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function session