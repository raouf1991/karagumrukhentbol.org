(()=>{
  const cfg=window.KH_SUPABASE||{};
  let approvalDb=null;
  const notify=(text,error=false)=>{const el=document.getElementById('toast');if(el){el.textContent=text;el.style.background=error?'#8b0000':'#111';el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4500);}else alert(text);};
  const client=()=>{if(approvalDb)return approvalDb;if(!window.supabase||!cfg.url||!cfg.publishableKey)return null;approvalDb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true}});return approvalDb;};
  const addOneYear=(date)=>{const d=new Date(date);d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10);};

  async function approveMembership(select){
    const db=client();if(!db)return notify('Supabase bağlantısı hazır değil.',true);
    const id=select.dataset.id;
    select.disabled=true;
    try{
      const {data:row,error:readError}=await db.from('membership_requests').select('*').eq('id',id).single();
      if(readError)throw readError;
      if(!confirm(`${row.full_name} için üyeliği onaylayıp dijital kartı e-posta ile göndermek istiyor musunuz?`)){select.value=row.status||'new';return;}
      let number=row.membership_number;
      if(!number){const {data,error}=await db.rpc('generate_membership_number');if(error)throw error;number=data;}
      const approvedAt=row.approved_at||new Date().toISOString();
      const validUntil=row.valid_until||addOneYear(approvedAt);
      const membershipType=row.membership_type||'Yetişkin Üye';
      const update={status:'accepted',membership_number:number,membership_type:membershipType,approved_at:approvedAt,valid_until:validUntil};
      const {error:updateError}=await db.from('membership_requests').update(update).eq('id',id);
      if(updateError)throw updateError;
      notify('Üyelik onaylandı, kart hazırlanıyor...');
      const {error:mailError}=await db.functions.invoke('send-membership-approved',{body:{id,...row,...update}});
      if(mailError)throw mailError;
      notify(`Üyelik kartı ${row.email} adresine gönderildi. No: ${number}`);
      select.value='accepted';
    }catch(error){console.error(error);notify('Onay veya kart gönderimi başarısız: '+(error.message||String(error)),true);select.value='reviewing';}
    finally{select.disabled=false;}
  }

  document.addEventListener('change',event=>{
    const select=event.target.closest?.('[data-status-table="membership_requests"]');
    if(!select||select.value!=='accepted')return;
    event.preventDefault();event.stopImmediatePropagation();
    approveMembership(select);
  },true);
})();
