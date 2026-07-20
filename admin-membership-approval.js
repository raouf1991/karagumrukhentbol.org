(()=>{
  const cfg=window.KH_SUPABASE||{};
  let approvalDb=null,decorateTimer=null;
  const notify=(text,error=false)=>{const el=document.getElementById('toast');if(el){el.textContent=text;el.style.background=error?'#8b0000':'#111';el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000);}else alert(text);};
  const client=()=>{if(approvalDb)return approvalDb;if(!window.supabase||!cfg.url||!cfg.publishableKey)return null;approvalDb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return approvalDb;};
  const addOneYear=(date)=>{const d=new Date(date);d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10);};
  const fmt=(value)=>value?new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):'—';

  async function sendCard(db,row){
    const {error}=await db.functions.invoke('send-membership-approved-v2',{body:row});
    if(error)throw error;
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
    const {data,error}=await db.from('membership_requests').select('id,status,membership_number,membership_type,approved_at,valid_until,approval_email_sent_at,email').in('id',ids);
    if(error)return;
    const rows=new Map((data||[]).map(r=>[String(r.id),r]));
    selects.forEach(select=>{
      select.dataset.previous=select.value;
      const row=rows.get(String(select.dataset.id)),card=select.closest('.card');if(!row||!card)return;
      card.querySelector('.membership-meta')?.remove();
      card.querySelector('.membership-resend')?.remove();
      if(row.status==='accepted'&&row.membership_number){
        const meta=document.createElement('div');meta.className='membership-meta';meta.style.cssText='margin-top:12px;padding:12px;border-radius:9px;background:#f3f4f6;border-left:4px solid #d50909;line-height:1.65';
        meta.innerHTML=`<strong style="font-size:16px">Üyelik No: ${row.membership_number}</strong><br><span>Tür: ${row.membership_type||'Yetişkin Üye'}</span><br><span>Onay: ${fmt(row.approved_at)} · Geçerlilik: ${fmt(row.valid_until)}</span><br><span>E-posta: ${row.approval_email_sent_at?'Gönderildi '+fmt(row.approval_email_sent_at):'Gönderim bekliyor'}</span>`;
        card.appendChild(meta);
        const btn=document.createElement('button');btn.type='button';btn.className='btn dark membership-resend';btn.dataset.id=row.id;btn.style.marginTop='10px';btn.textContent='Üyelik Kartını Yeniden Gönder';btn.onclick=()=>resendMembership(btn);card.appendChild(btn);
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