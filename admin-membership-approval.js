(()=>{
  const cfg=window.KH_SUPABASE||{};
  let approvalDb=null,decorateTimer=null;
  const notify=(text,error=false)=>{const el=document.getElementById('toast');if(el){el.textContent=text;el.style.background=error?'#8b0000':'#111';el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000);}else alert(text);};
  const client=()=>{if(approvalDb)return approvalDb;if(!window.supabase||!cfg.url||!cfg.publishableKey)return null;approvalDb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return approvalDb;};
  const addOneYear=(date)=>{const d=new Date(date);d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10);};
  const fmt=(value)=>value?new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):'—';
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function sendCard(db,row){
    const {error}=await db.functions.invoke('send-membership-approved-v3',{body:row});
    if(error)throw error;
  }

  function printMembership(row){
    const w=window.open('','_blank','width=850,height=900');
    if(!w)return notify('Yazdırma penceresi açılamadı. Tarayıcıda açılır pencerelere izin verin.',true);
    const statusText={new:'Yeni',reviewing:'İnceleniyor',accepted:'Kabul',rejected:'Red'}[row.status]||row.status||'—';
    w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Üyelik Başvurusu - ${esc(row.full_name)}</title><style>body{font-family:Arial,sans-serif;margin:35px;color:#111}.head{display:flex;align-items:center;gap:18px;border-bottom:4px solid #c81010;padding-bottom:18px;margin-bottom:24px}.head img{width:85px;height:85px;object-fit:contain}.photo{width:145px;height:180px;object-fit:cover;border-radius:10px;border:1px solid #ccc}.grid{display:grid;grid-template-columns:190px 1fr;gap:12px;margin-top:22px}.label{font-weight:700;color:#555}.box{border:1px solid #ddd;border-radius:10px;padding:18px;margin-top:22px}.footer{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.signature{font-family:cursive;font-size:28px}@media print{button{display:none}body{margin:18mm}}</style></head><body><div class="head"><img src="https://karagumrukhentbol.org/assets/club-logo.png"><div><h1 style="margin:0">Karagümrük Hentbol</h1><p style="margin:6px 0 0">Üyelik Başvuru Formu</p></div></div>${row.photo_url?`<img class="photo" src="${esc(row.photo_url)}" alt="Üye fotoğrafı">`:''}<div class="grid"><div class="label">Ad Soyad</div><div>${esc(row.full_name)}</div><div class="label">E-posta</div><div>${esc(row.email)}</div><div class="label">Telefon</div><div>${esc(row.phone||'—')}</div><div class="label">Başvuru Tarihi</div><div>${fmt(row.created_at)}</div><div class="label">Durum</div><div>${esc(statusText)}</div><div class="label">Üyelik Numarası</div><div>${esc(row.membership_number||'Henüz oluşturulmadı')}</div><div class="label">Üyelik Türü</div><div>${esc(row.membership_type||'—')}</div><div class="label">Onay Tarihi</div><div>${fmt(row.approved_at)}</div><div class="label">Geçerlilik</div><div>${fmt(row.valid_until)}</div></div><div class="box"><strong>Başvuru Nedeni</strong><p style="white-space:pre-wrap;line-height:1.6">${esc(row.reason||'—')}</p></div><div class="footer"><div><strong>Karagümrük Hentbol Spor Kulübü</strong><br>karagumrukhentbol.org</div><div style="text-align:center"><div class="signature">Raouf Tarek</div><strong>Kulüp Başkanı</strong></div></div><script>window.onload=()=>setTimeout(()=>window.print(),350)<\/script></body></html>`);
    w.document.close();
  }

  async function deleteMembership(button,row){
    const db=client();if(!db)return notify('Supabase bağlantısı hazır değil.',true);
    const accepted=row.status==='accepted'||!!row.membership_number;
    const warning=accepted
      ? `${row.full_name} adlı kabul edilmiş üyeyi kalıcı olarak silmek üzeresiniz. ${row.membership_number||'Üyelik numarası'} güvenlik ve kayıt düzeni için tekrar kullanılmayacaktır. Devam edilsin mi?`
      : `${row.full_name} adlı başvuru kalıcı olarak silinsin mi?`;
    if(!confirm(warning))return;
    button.disabled=true;
    try{
      const {data:deleted,error}=await db.from('membership_requests').delete().eq('id',row.id).select('id');
      if(error)throw error;
      if(!deleted||deleted.length===0)throw new Error('Kayıt silinmedi. Supabase DELETE yetkisi/policy eksik olabilir.');
      if(row.photo_url){
        try{const marker='/site-media/';const i=row.photo_url.indexOf(marker);if(i>=0){const path=decodeURIComponent(row.photo_url.slice(i+marker.length));await db.storage.from('site-media').remove([path]);}}catch(e){console.warn('Fotoğraf silinemedi',e);}
      }
      notify('Üyelik başvurusu kalıcı olarak silindi.');
      button.closest('.card')?.remove();
    }catch(error){notify('Başvuru silinemedi: '+(error.message||String(error)),true);button.disabled=false;}
  }

  async function approveMembership(select){
    const db=client();if(!db)return notify('Supabase bağlantısı hazır değil.',true);
    const id=select.dataset.id,previous=select.dataset.previous||'new';
    select.disabled=true;
    try{
      const {data:row,error:readError}=await db.from('membership_requests').select('*').eq('id',id).single();
      if(readError)throw readError;
      if(!confirm(`${row.full_name} için üyeliği onaylayıp dijital üyelik kartını ${row.email} adresine göndermek istiyor musunuz?`)){select.value=row.status||previous;return;}
      let number=row.membership_number;
      if(!number){const {data,error}=await db.rpc('generate_membership_number');if(error)throw error;number=data;}
      const approvedAt=row.approved_at||new Date().toISOString();
      const validUntil=row.valid_until||addOneYear(approvedAt);
      const membershipType=row.membership_type||'Yetişkin Üye';
      const update={status:'accepted',membership_number:number,membership_type:membershipType,approved_at:approvedAt,valid_until:validUntil};
      const {data:updated,error:updateError}=await db.from('membership_requests').update(update).eq('id',id).select('*').single();
      if(updateError)throw updateError;
      notify('Üyelik onaylandı, profesyonel kart hazırlanıyor...');
      await sendCard(db,updated);
      notify(`Üyelik kartı gönderildi. Üyelik No: ${number}`);
      select.value='accepted';select.dataset.previous='accepted';
      scheduleDecorate();
    }catch(error){console.error(error);notify('Onay veya kart gönderimi başarısız: '+(error.message||String(error)),true);select.value=previous;}
    finally{select.disabled=false;}
  }

  async function resendMembership(button){
    const db=client();if(!db)return notify('Supabase bağlantısı hazır değil.',true);
    button.disabled=true;const original=button.textContent;button.textContent='Gönderiliyor...';
    try{
      const {data:row,error}=await db.from('membership_requests').select('*').eq('id',button.dataset.id).single();
      if(error)throw error;
      if(row.status!=='accepted'||!row.membership_number)throw new Error('Üyelik henüz onaylanmamış veya üyelik numarası oluşmamış.');
      if(!confirm(`${row.full_name} için üyelik kartı ${row.email} adresine tekrar gönderilsin mi?`))return;
      await sendCard(db,row);
      notify(`Üyelik kartı ${row.email} adresine yeniden gönderildi.`);
      scheduleDecorate();
    }catch(error){console.error(error);notify('Kart yeniden gönderilemedi: '+(error.message||String(error)),true);}
    finally{button.disabled=false;button.textContent=original;}
  }

  async function decorateMembershipCards(){
    const db=client(),list=document.getElementById('membershipList');if(!db||!list)return;
    const selects=[...list.querySelectorAll('[data-status-table="membership_requests"]')];if(!selects.length)return;
    const ids=selects.map(s=>s.dataset.id).filter(Boolean);
    const {data,error}=await db.from('membership_requests').select('*').in('id',ids);
    if(error)return;
    const rows=new Map((data||[]).map(r=>[String(r.id),r]));
    selects.forEach(select=>{
      select.dataset.previous=select.value;
      const row=rows.get(String(select.dataset.id)),card=select.closest('.card');if(!row||!card)return;
      card.querySelector('.membership-meta')?.remove();
      card.querySelector('.membership-actions-extra')?.remove();
      const actions=document.createElement('div');actions.className='actions membership-actions-extra';actions.style.marginTop='10px';
      const printBtn=document.createElement('button');printBtn.type='button';printBtn.className='btn dark';printBtn.textContent='Başvuruyu Yazdır';printBtn.onclick=()=>printMembership(row);actions.appendChild(printBtn);
      if(row.status==='accepted'&&row.membership_number){
        const resend=document.createElement('button');resend.type='button';resend.className='btn dark membership-resend';resend.dataset.id=row.id;resend.textContent='Üyelik Kartını Yeniden Gönder';resend.onclick=()=>resendMembership(resend);actions.appendChild(resend);
      }
      const del=document.createElement('button');del.type='button';del.className='btn danger';del.textContent='Başvuruyu Sil';del.onclick=()=>deleteMembership(del,row);actions.appendChild(del);
      card.appendChild(actions);
      if(row.status==='accepted'&&row.membership_number){
        const meta=document.createElement('div');meta.className='membership-meta';meta.style.cssText='margin-top:12px;padding:12px;border-radius:9px;background:#f3f4f6;border-left:4px solid #d50909;line-height:1.65';
        meta.innerHTML=`${row.photo_url?`<img src="${esc(row.photo_url)}" alt="Üye fotoğrafı" style="width:76px;height:92px;object-fit:cover;border-radius:8px;float:right;margin-left:12px">`:''}<strong style="font-size:16px">Üyelik No: ${esc(row.membership_number)}</strong><br><span>Tür: ${esc(row.membership_type||'Yetişkin Üye')}</span><br><span>Onay: ${fmt(row.approved_at)} · Geçerlilik: ${fmt(row.valid_until)}</span><br><span>Fotoğraf: ${row.photo_url?'Var':'Yok'}</span><br><span>E-posta: ${row.approval_email_sent_at?'Gönderildi '+fmt(row.approval_email_sent_at):'Gönderim bekliyor'}</span><div style="clear:both"></div>`;
        card.insertBefore(meta,actions);
      }
    });
  }
  function scheduleDecorate(){clearTimeout(decorateTimer);decorateTimer=setTimeout(decorateMembershipCards,350);}

  document.addEventListener('focusin',event=>{const select=event.target.closest?.('[data-status-table="membership_requests"]');if(select)select.dataset.previous=select.value;},true);
  document.addEventListener('change',event=>{
    const select=event.target.closest?.('[data-status-table="membership_requests"]');
    if(!select||select.value!=='accepted')return;
    event.preventDefault();event.stopImmediatePropagation();approveMembership(select);
  },true);

  const observer=new MutationObserver(scheduleDecorate);
  const start=()=>{const list=document.getElementById('membershipList');if(list){observer.observe(list,{childList:true,subtree:true});scheduleDecorate();}else setTimeout(start,500);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();