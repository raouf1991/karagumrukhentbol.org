(() => {
  const cfg = window.KH_SUPABASE || {};
  let academyAdminDb = null;
  let rendering = false;

  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const handLabel = v => ({ right:'Sağ', left:'Sol', both:'Her İki El' }[v] || v || '—');
  const genderLabel = v => ({ male:'Erkek', female:'Kadın' }[v] || v || '—');
  const dateLabel = v => v ? new Date(v + (String(v).length === 10 ? 'T00:00:00' : '')).toLocaleDateString('tr-TR') : '—';
  const statusLabel = v => v === 'accepted' ? 'Kabul' : 'Yeni';

  function printApplication(a) {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) return alert('Yazdırma penceresi açılamadı. Açılır pencerelere izin verin.');
    const applicationNo = `KH-AKA-${new Date(a.created_at || Date.now()).getFullYear()}-${String(a.id || '').slice(0, 8).toUpperCase()}`;
    win.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(applicationNo)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;background:#eee;color:#111}.sheet{width:210mm;min-height:297mm;margin:auto;background:#fff;padding:18mm}.head{display:flex;align-items:center;gap:18px;border-bottom:5px solid #c90808;padding-bottom:16px}.head img{width:90px;height:90px;object-fit:contain}.head h1{margin:0;font-size:26px}.head p{margin:6px 0;color:#555}.tag{margin-left:auto;background:#111;color:#fff;padding:10px 14px;border-radius:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px}.item{border:1px solid #ddd;border-radius:8px;padding:12px}.item strong{display:block;font-size:12px;color:#777;margin-bottom:5px}.full{grid-column:1/-1}.notes{height:170px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:55px;text-align:center}.line{border-top:1px solid #333;padding-top:8px}.footer{margin-top:35px;border-top:3px solid #c90808;padding-top:12px;color:#555;font-size:12px}@media print{body{background:#fff}.sheet{margin:0;width:auto;min-height:auto}}
    </style></head><body><main class="sheet"><div class="head"><img src="https://karagumrukhentbol.org/assets/club-logo.png"><div><h1>Karagümrük Hentbol Akademisi</h1><p>Akademi Başvuru Formu</p></div><div class="tag">${esc(statusLabel(a.status))}</div></div>
    <div class="grid">
      <div class="item"><strong>Başvuru No</strong>${esc(applicationNo)}</div><div class="item"><strong>Başvuru Tarihi</strong>${esc(new Date(a.created_at || Date.now()).toLocaleString('tr-TR'))}</div>
      <div class="item full"><strong>Ad Soyad</strong>${esc(a.full_name)}</div><div class="item"><strong>E-posta</strong>${esc(a.email)}</div><div class="item"><strong>Telefon</strong>${esc(a.phone)}</div>
      <div class="item"><strong>Doğum Tarihi</strong>${esc(dateLabel(a.birth_date))}</div><div class="item"><strong>Cinsiyet</strong>${esc(genderLabel(a.gender))}</div>
      <div class="item"><strong>Boy</strong>${esc(a.height_cm ? a.height_cm + ' cm' : '—')}</div><div class="item"><strong>Kullandığı El</strong>${esc(handLabel(a.dominant_hand))}</div>
      <div class="item full"><strong>Yaş Grubu</strong>${esc(a.age_group || '—')}</div><div class="item full notes"><strong>Antrenör Notları</strong></div>
    </div><div class="sign"><div class="line">Antrenör İmzası</div><div class="line">Kulüp Yetkilisi</div></div><div class="footer">Karagümrük Hentbol Spor Kulübü · info@karagumrukhentbol.org · karagumrukhentbol.org</div></main><script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  }

  async function acceptApplication(id) {
    if (!confirm('Bu başvuruyu kabul etmek istiyor musunuz?')) return;
    const { error } = await academyAdminDb.from('academy_applications').update({ status: 'accepted' }).eq('id', id);
    if (error) return alert('Kabul işlemi başarısız: ' + error.message);
    await renderAcademyApplications();
  }

  async function deleteApplication(id) {
    if (!confirm('Bu akademi başvurusu kalıcı olarak silinsin mi?')) return;
    const { error } = await academyAdminDb.from('academy_applications').delete().eq('id', id);
    if (error) return alert('Silme işlemi başarısız: ' + error.message);
    await renderAcademyApplications();
  }

  async function renderAcademyApplications() {
    const list = document.getElementById('academyList');
    if (!list || !academyAdminDb || rendering) return;
    rendering = true;
    try {
      const { data, error } = await academyAdminDb.from('academy_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      list.dataset.academyEnhanced = '1';
      list.innerHTML = (data || []).length ? data.map(a => `<div class="card" data-academy-card="${esc(a.id)}">
        <strong>${esc(a.full_name)}</strong>
        <p>${esc(a.email)} · ${esc(a.phone || '')}</p>
        <p>Doğum: ${esc(dateLabel(a.birth_date))} · Cinsiyet: ${esc(genderLabel(a.gender))}</p>
        <p>Boy: ${esc(a.height_cm ? a.height_cm + ' cm' : '—')} · El: ${esc(handLabel(a.dominant_hand))} · Yaş grubu: ${esc(a.age_group || '—')}</p>
        <small>Durum: <b>${esc(statusLabel(a.status))}</b> · ${esc(new Date(a.created_at || Date.now()).toLocaleString('tr-TR'))}</small>
        <div class="actions">
          <button class="btn dark" data-academy-print="${esc(a.id)}">Başvuruyu Yazdır</button>
          ${a.status === 'accepted' ? '<button class="btn primary" disabled>Kabul Edildi</button>' : `<button class="btn primary" data-academy-accept="${esc(a.id)}">Kabul Et</button>`}
          <button class="btn danger" data-academy-delete="${esc(a.id)}">Başvuruyu Sil</button>
        </div>
      </div>`).join('') : '<p>Akademi başvurusu yok.</p>';

      const byId = Object.fromEntries((data || []).map(a => [String(a.id), a]));
      list.querySelectorAll('[data-academy-print]').forEach(b => b.onclick = () => printApplication(byId[b.dataset.academyPrint]));
      list.querySelectorAll('[data-academy-accept]').forEach(b => b.onclick = () => acceptApplication(b.dataset.academyAccept));
      list.querySelectorAll('[data-academy-delete]').forEach(b => b.onclick = () => deleteApplication(b.dataset.academyDelete));
    } catch (error) {
      console.error(error);
    } finally {
      rendering = false;
    }
  }

  function start() {
    if (!window.supabase || !cfg.url || !cfg.publishableKey) return;
    academyAdminDb = window.supabase.createClient(cfg.url, cfg.publishableKey, { auth: { persistSession: true, autoRefreshToken: true } });
    const attempt = () => {
      const list = document.getElementById('academyList');
      if (!list) return setTimeout(attempt, 400);
      renderAcademyApplications();
      const observer = new MutationObserver(() => {
        if (!rendering && list.dataset.academyEnhanced !== '1') setTimeout(renderAcademyApplications, 50);
      });
      observer.observe(list, { childList: true, subtree: false, attributes: true, attributeFilter: ['data-academy-enhanced'] });
      setInterval(() => {
        if (document.getElementById('academy')?.classList.contains('hidden') === false) renderAcademyApplications();
      }, 5000);
    };
    attempt();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();