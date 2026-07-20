(()=>{
  const cfg=window.KH_SUPABASE||{};
  let approvalDb=null,decorateTimer=null;
  const notify=(text,error=false)=>{const el=document.getElementById('toast');if(el){el.textContent=text;el.style.background=error?'#8b0000':'#111';el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000);}else alert(text);};
  const client=()=>{if(approvalDb)return approvalDb;if(!window.supabase||!cfg.url||!cfg.publishableKey)return null;approvalDb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return approvalDb;};
  const addYears=(value,years=1)=>{const d=new Date(value||Date.now());d.setFullYear(d.getFullYear()+Number(years||1));return d.toISOString().slice(0,10);};
  const fmt=value=>value?new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):'—';
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function sendCard(db,row){const {error}=await db.functions.invoke('send-membership-approved-v3',{body:row});if(error)throw error;}

  function printMembership(row){
    const w=window.open('','_blank','width=850,height=900');if(!w)return notify('Yazdırma penceresi açılamadı.',true);
    const statusText={new:'Yeni',reviewing:'İnceleniyor',accepted:'Kabul',rejected:'Red'}[row.status]||row.status||'—';
    w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Üyelik Başvurusu</title><style>body{font-family:Arial;margin:35px;color:#111}.head{display:flex;align-items:center;gap:18px;border-bottom:4px solid #c81010;padding-bottom:18px;margin-bottom:24px}.head img{width:85px;height:85px;object-fit:contain}.photo{width:145px;height:180px;object-fit:cover;border-radius:10px;border:1px solid #ccc}.grid{display:grid;grid-template-columns:190px 1fr;gap:12px;margin-top:22px}.label{font-weight:700;color:#555}.box{border:1px solid #ddd;border-radius:10px;padding:18px;margin-top:22px}.footer{margin-top:50px;display:flex;justify-content:space-between}.signature{font-family:cursive;font-size:28px}@media print{body{margin:18mm}}</style></head><body><div class="head"><img src="https://karagumrukhentbol.org/assets/club-logo.png"><div><h1>Karagümrük Hentbol</h1><p>Üyelik Başvuru Formu</p></div></div>${row.photo_url?`<img class="photo" src="${esc(row.photo_url)}">`:''}<div class="grid"><div class="label">Ad Soyad</div><div>${esc(row.full_name)}</div><div class="label">E-posta</div><div>${esc(row.email)}</div><div class="label">Telefon</div><div>${esc(row.phone||'—')}</div><div class="label">Başvuru Tarihi</div><div>${fmt(row.created_at)}</div><div class="label">Durum</div><div>${esc(statusText)}</div><div class="label">Üyelik Numarası</div><div>${esc(row.membership_number||'Henüz oluşturulmadı')}</div><div class="label">Üyelik Türü</div><div>${esc(row.membership_type||'—')}</div><div class="label">Onay Tarihi</div><div>${fmt(row.approved_at)}</div><div class="label">Geçerlilik</div><div>${fmt(row.valid_until)}</div></div><div class="box"><strong>Başvuru Nedeni</strong><p>${esc(row.reason||'—')}</p></div><div class="footer"><div><strong>Karagümrük Hentbol Spor Kulübü</strong></div><div><div class="signature">Raouf Tarek</div><strong>Kulüp Başkanı</strong></div></div><script>onload=()=>setTimeout(()=>print(),350)<\/script></body></html>`);w.document.close();
  }

  async function deleteMembership(button,row){
    const db=client();if(!db)return notify('Supabase bağlantısı hazır değil.',true);
    const accepted=row.status==='accepted'||!!row.membership_number;
    if(!confirm(accepted?`${row.full_name} adlı kabul edilmiş üyeyi kalıcı olarak silmek üzeresiniz. Üyelik numarası tekrar kullanılmayacaktır. Devam edilsin mi?`:`${row.full_name} adlı başvuru kalıcı olarak silinsin mi?`))return;
    button.disabled=true;
    try{
      const {data:deleted,error}=await db.from('membership_requests').delete().eq('id',row.id).select('id');if(error)throw error;
      if(!deleted?.length)throw new Error('Kayıt silinmedi. DELETE yetkisi eksik olabilir.');
      if(row.photo_url){try{const marker='/site-media/',i=row.photo_url.indexOf(marker);if(i>=0)await db.storage.from('site-media').remove([decodeURIComponent(row.photo_url.slice(i+marker.length))]);}catch(e){console.warn(e)}}
      notify('Üyelik başvurusu kalıcı olarak silindi.');button.closest('.card')?.remove();
    }catch(error){notify('Başvuru silinemedi: '+(error.message||String(error)),true);button.disabled=false;}
  }

  async function approveMembership(select){
    const db=client();if(!db)return notify('Supabase bağlantısı hazır değil.',true);
    const id=select.dataset.id,previous=select.dataset.previous||'new';select.disabled=true;
    try{
      const {data:row,error:readError}=await db.from('membership_requests').select('*').eq('id',id).single();if(readError)throw readError;
      if(!confirm(`${row.full_name} için üyeliği onaylayıp dijital üyelik kartını ${row.email} adresine göndermek istiyor musunuz?`)){select.value=row.status||previous;return;}
      let number=row.membership_number;if(!number){const {data,error}=await db.rpc('generate_membership_number');if(error)throw error;number=data;}
      const approvedAt=row.approved_at||new Date().toISOString(),validUntil=row.valid_until||addYears(approvedAt,1),membershipType=row.membership_type||'Yetişkin Üye';
      const update={status:'accepted',membership_number:number,membership_type:membershipType,approved_at:approvedAt,valid_until:validUntil,member_portal_enabled:true};
      const {data:updated,error:updateError}=await db.from('membership_requests').update(update).eq('id',id).select('*').single();if(updateError)throw updateError;
      notify('Üyelik onaylandı, kart hazırlanıyor...');await sendCard(db,updated);notify(`Üyelik kartı gönderildi. Üyelik No: ${number}`);select.value='accepted';select.dataset.previous='accepted';scheduleDecorate();
    }catch(error){console.error(error);notify('Onay veya kart gönderimi başarısız: '+(error.message||String(error)),true);select.value=previous;}finally{select.disabled=false;}
  }

  async function resendMembership(button){
    const db=client();if(!db)return notify('Supabase bağlantısı hazır değil.',true);button.disabled=true;const original=button.textContent;button.textContent='Gönderiliyor...';
    try{const {data:row,error}=await db.from('membership_requests').select('*').eq('id',button.dataset.id).single();if(error)throw error;if(row.status!=='accepted'||!row.membership_number)throw new Error('Üyelik henüz onaylanmamış.');if(!confirm(`${row.full_name} için kart tekrar gönderilsin mi?`))return;await sendCard(db,row);notify(`Üyelik kartı ${row.email} adresine yeniden gönderildi.`);}
    catch(error){notify('Kart yeniden gönderilemedi: '+(error.message||String(error)),true);}finally{button.disabled=false;button.textContent=original;}
  }

  async function decorateMembershipCards(){
    const db=client(),list=document.getElementById('membershipList');if(!db||!list)return;const selects=[...list.querySelectorAll('[data-status-table="membership_requests"]')];if(!selects.length)return;
    const {data,error}=await db.from('membership_requests').select('*').in('id',selects.map(s=>s.dataset.id));if(error)return;const rows=new Map((data||[]).map(r=>[String(r.id),r]));
    selects.forEach(select=>{select.dataset.previous=select.value;const row=rows.get(String(select.dataset.id)),card=select.closest('.card');if(!row||!card)return;card.querySelector('.membership-meta')?.remove();card.querySelector('.membership-actions-extra')?.remove();const actions=document.createElement('div');actions.className='actions membership-actions-extra';const print=document.createElement('button');print.className='btn dark';print.textContent='Başvuruyu Yazdır';print.onclick=()=>printMembership(row);actions.appendChild(print);if(row.status==='accepted'&&row.membership_number){const resend=document.createElement('button');resend.className='btn dark';resend.dataset.id=row.id;resend.textContent='Üyelik Kartını Yeniden Gönder';resend.onclick=()=>resendMembership(resend);actions.appendChild(resend)}const del=document.createElement('button');del.className='btn danger';del.textContent='Başvuruyu Sil';del.onclick=()=>deleteMembership(del,row);actions.appendChild(del);card.appendChild(actions);if(row.status==='accepted'&&row.membership_number){const meta=document.createElement('div');meta.className='membership-meta';meta.style.cssText='margin-top:12px;padding:12px;border-radius:9px;background:#f3f4f6;border-left:4px solid #d50909;line-height:1.65';meta.innerHTML=`${row.photo_url?`<img src="${esc(row.photo_url)}" style="width:76px;height:92px;object-fit:cover;border-radius:8px;float:right">`:''}<strong>Üyelik No: ${esc(row.membership_number)}</strong><br>Tür: ${esc(row.membership_type||'Yetişkin Üye')}<br>Geçerlilik: ${fmt(row.valid_until)}<br>Üye portalı: ${row.member_portal_enabled?'Aktif':'Kapalı'}<div style="clear:both"></div>`;card.insertBefore(meta,actions)}});
  }
  function scheduleDecorate(){clearTimeout(decorateTimer);decorateTimer=setTimeout(decorateMembershipCards,350)}

  function ensureRenewalUi(){
    const side=document.querySelector('.side'),main=document.querySelector('.main');if(!side||!main)return;
    if(!side.querySelector('[data-tab="renewals"]')){const b=document.createElement('button');b.dataset.tab='renewals';b.textContent='Üyelik Yenilemeleri';const membership=side.querySelector('[data-tab="membership"]');membership?.after(b);b.onclick=()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.add('hidden'));document.getElementById('renewals')?.classList.remove('hidden');document.getElementById('pageTitle').textContent='Üyelik Yenilemeleri';loadRenewalsAdmin()}}
    if(!document.getElementById('renewals')){const tab=document.createElement('div');tab.id='renewals';tab.className='tab hidden';tab.innerHTML='<div class="panel"><h2>Üyelik Yenileme Talepleri</h2><div id="renewalList">Yükleniyor...</div></div>';main.appendChild(tab)}
  }

  async function loadRenewalsAdmin(){
    const db=client(),target=document.getElementById('renewalList');if(!db||!target)return;target.innerHTML='Yükleniyor...';
    const {data,error}=await db.from('membership_renewals').select('*').order('created_at',{ascending:false});if(error){target.innerHTML=`<p style="color:#a00000">${esc(error.message)}</p>`;return}
    target.innerHTML=(data||[]).length?(data||[]).map(r=>`<div class="card"><strong>${esc(r.membership_number)}</strong><p>${esc(r.member_email)}</p><p>Mevcut bitiş: ${fmt(r.current_valid_until)} · Talep: ${r.requested_years} yıl</p><p>Durum: ${esc({new:'Yeni',reviewing:'İnceleniyor',accepted:'Kabul',rejected:'Red'}[r.status]||r.status)}</p><div class="actions">${r.status!=='accepted'?`<button class="btn primary" data-renew-approve="${r.id}">Onayla ve Kart Gönder</button><button class="btn danger" data-renew-reject="${r.id}">Reddet</button>`:''}</div></div>`).join(''):'<p>Yenileme talebi yok.</p>';
    target.querySelectorAll('[data-renew-approve]').forEach(b=>b.onclick=()=>approveRenewal(b.dataset.renewApprove,b));target.querySelectorAll('[data-renew-reject]').forEach(b=>b.onclick=()=>rejectRenewal(b.dataset.renewReject,b));
  }

  async function approveRenewal(id,button){
    const db=client();if(!db)return;button.disabled=true;
    try{
      const {data:req,error}=await db.from('membership_renewals').select('*').eq('id',id).single();if(error)throw error;if(!confirm(`${req.membership_number} numaralı üyeliği ${req.requested_years} yıl yenilemek istiyor musunuz?`))return;
      const {data:member,error:mErr}=await db.from('membership_requests').select('*').eq('id',req.membership_request_id).single();if(mErr)throw mErr;
      const base=new Date(member.valid_until)>new Date()?member.valid_until:new Date().toISOString(),newValid=addYears(base,req.requested_years);
      const {data:updated,error:uErr}=await db.from('membership_requests').update({valid_until:newValid,status:'accepted',member_portal_enabled:true}).eq('id',member.id).select('*').single();if(uErr)throw uErr;
      const {error:rErr}=await db.from('membership_renewals').update({status:'accepted',reviewed_at:new Date().toISOString(),reviewed_by:(await db.auth.getUser()).data.user?.email||'',new_valid_until:newValid,updated_at:new Date().toISOString()}).eq('id',id);if(rErr)throw rErr;
      await sendCard(db,updated);notify(`Üyelik ${fmt(newValid)} tarihine kadar yenilendi ve kart gönderildi.`);loadRenewalsAdmin();
    }catch(e){notify('Yenileme onaylanamadı: '+(e.message||String(e)),true)}finally{button.disabled=false}
  }

  async function rejectRenewal(id,button){const db=client();if(!db||!confirm('Yenileme talebi reddedilsin mi?'))return;button.disabled=true;const {error}=await db.from('membership_renewals').update({status:'rejected',reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);notify(error?error.message:'Yenileme talebi reddedildi.',!!error);loadRenewalsAdmin()}

  document.addEventListener('focusin',e=>{const s=e.target.closest?.('[data-status-table="membership_requests"]');if(s)s.dataset.previous=s.value},true);
  document.addEventListener('change',e=>{const s=e.target.closest?.('[data-status-table="membership_requests"]');if(!s||s.value!=='accepted')return;e.preventDefault();e.stopImmediatePropagation();approveMembership(s)},true);
  const observer=new MutationObserver(scheduleDecorate);
  const start=()=>{ensureRenewalUi();const list=document.getElementById('membershipList');if(list){observer.observe(list,{childList:true,subtree:true});scheduleDecorate()}else setTimeout(start,500)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();