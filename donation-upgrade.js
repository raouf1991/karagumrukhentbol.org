(() => {
  const cfg = window.KH_SUPABASE || {};
  const tr = () => (localStorage.getItem('siteLang') || 'tr') === 'tr';
  const text = (a,b) => tr() ? a : b;

  function start(attempt=0){
    const section = document.getElementById('donate');
    if(!section || !cfg.url || !cfg.publishableKey) return;
    if(!window.supabase){ if(attempt<40) setTimeout(()=>start(attempt+1),250); return; }
    if(section.dataset.donationUpgraded==='1') return;
    section.dataset.donationUpgraded='1';
    const db = window.supabase.createClient(cfg.url,cfg.publishableKey);
    section.innerHTML = `<div class="container" style="display:grid;gap:24px">
      <div class="donate-box" style="display:block">
        <span class="section-kicker" data-tr="Birlikte daha güçlüyüz" data-en="Stronger together">Birlikte daha güçlüyüz</span>
        <h2 data-tr="Başkanımızdan Bağış Mesajı" data-en="A Donation Message from Our President">Başkanımızdan Bağış Mesajı</h2>
        <p style="font-size:18px;line-height:1.8" data-tr="Kulübümüze yaptığınız her katkı yalnızca maddi bir destek değildir. Her katkınız bir çocuğun ve gencin sporda kalmasına, kötü alışkanlıklardan uzaklaşmasına, disiplinli ve sağlıklı bir yaşam kurmasına yardımcı olur. Amacımız ülkesine ve toplumuna faydalı, güçlü ve sorumluluk sahibi bir genç nesil yetiştirmektir. Küçük ya da büyük her desteğiniz bu yolculuğun devam etmesini sağlar." data-en="Every contribution to our club is more than financial support. It helps a child or young person stay in sport, avoid harmful habits, and build a disciplined and healthy life. Our goal is to raise a strong and responsible generation that benefits society and the country. Every contribution, large or small, keeps this journey moving forward.">Kulübümüze yaptığınız her katkı yalnızca maddi bir destek değildir. Her katkınız bir çocuğun ve gencin sporda kalmasına, kötü alışkanlıklardan uzaklaşmasına, disiplinli ve sağlıklı bir yaşam kurmasına yardımcı olur. Amacımız ülkesine ve toplumuna faydalı, güçlü ve sorumluluk sahibi bir genç nesil yetiştirmektir. Küçük ya da büyük her desteğiniz bu yolculuğun devam etmesini sağlar.</p>
        <p><strong>Raouf Tarek</strong><br><span data-tr="Kulüp Başkanı" data-en="Club President">Kulüp Başkanı</span></p>
      </div>
      <form id="donationRequestForm" class="form-card" style="max-width:760px;margin:auto;width:100%">
        <h3 data-tr="Bağış Başvuru Formu" data-en="Donation Request Form">Bağış Başvuru Formu</h3>
        <input name="full_name" required placeholder="Ad Soyad / Full Name">
        <input name="email" type="email" required placeholder="E-posta / Email">
        <input name="phone" required placeholder="Telefon / Phone">
        <select name="donation_type" required><option value="">Bağış Türü / Donation Type</option><option value="cash">Nakdi / Cash</option><option value="in_kind">Ayni / In-kind</option></select>
        <div data-cash-fields style="display:none"><input name="amount" type="number" min="0" step="0.01" placeholder="Tutar / Amount"><select name="currency"><option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option></select></div>
        <div data-kind-fields style="display:none"><input name="item_name" placeholder="Bağışın türü / Donation item"><input name="quantity" type="number" min="1" placeholder="Miktar / Quantity"></div>
        <textarea name="notes" placeholder="Açıklama veya not / Description or note"></textarea>
        <label class="check"><input type="checkbox" required> <span data-tr="Kulübün benimle iletişime geçmesini kabul ediyorum" data-en="I agree that the club may contact me">Kulübün benimle iletişime geçmesini kabul ediyorum</span></label>
        <button class="btn btn-primary" type="submit" data-tr="Bağış Talebini Gönder" data-en="Send Donation Request">Bağış Talebini Gönder</button>
      </form>
    </div>`;
    const form=section.querySelector('#donationRequestForm');
    const type=form.elements.donation_type;
    const cash=form.querySelector('[data-cash-fields]'); const kind=form.querySelector('[data-kind-fields]');
    type.onchange=()=>{cash.style.display=type.value==='cash'?'grid':'none';kind.style.display=type.value==='in_kind'?'grid':'none';};
    form.addEventListener('submit',async e=>{
      e.preventDefault(); const btn=form.querySelector('button'); const old=btn.textContent; btn.disabled=true; btn.textContent=text('Gönderiliyor...','Sending...');
      try{const fd=new FormData(form); const payload={full_name:String(fd.get('full_name')||'').trim(),email:String(fd.get('email')||'').trim().toLowerCase(),phone:String(fd.get('phone')||'').trim(),donation_type:String(fd.get('donation_type')||''),amount:fd.get('amount')?Number(fd.get('amount')):null,currency:String(fd.get('currency')||'TRY'),item_name:String(fd.get('item_name')||'').trim()||null,quantity:fd.get('quantity')?Number(fd.get('quantity')):null,notes:String(fd.get('notes')||'').trim()||null,status:'new'}; const {error}=await db.from('donation_requests').insert(payload); if(error) throw error; form.reset(); cash.style.display=kind.style.display='none'; alert(text('Bağış talebiniz alındı. Kulübümüz sizinle iletişime geçecektir.','Your donation request was received. The club will contact you.'));}catch(err){alert(text('Talep gönderilemedi: ','Request could not be sent: ')+(err?.message||String(err)));}finally{btn.disabled=false;btn.textContent=old;}
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>start(),{once:true}); else start();
})();