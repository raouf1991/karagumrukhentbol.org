(() => {
  'use strict';

  const cfg = window.KH_SUPABASE || {};
  const MEDIA_BUCKET = 'site-media';
  let db;
  let editingId = null;
  let currentRows = [];

  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (text, error = false) => {
    const el = document.getElementById('toast');
    if (!el) return alert(text);
    el.textContent = text;
    el.style.background = error ? '#8b0000' : '#111';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3500);
  };

  function ensureUi() {
    const side = document.querySelector('.side');
    const main = document.querySelector('.main');
    if (!side || !main) return false;

    if (!side.querySelector('[data-tab="education"]')) {
      const button = document.createElement('button');
      button.dataset.tab = 'education';
      button.textContent = '🎓 Eğitim Merkezi';
      const academyButton = side.querySelector('[data-tab="academy"]');
      side.insertBefore(button, academyButton || side.querySelector('a'));
      button.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
        document.getElementById('education')?.classList.remove('hidden');
        const title = document.getElementById('pageTitle');
        if (title) title.textContent = 'Eğitim Merkezi';
        loadRows();
      });
    }

    if (!document.getElementById('education')) {
      const tab = document.createElement('div');
      tab.id = 'education';
      tab.className = 'tab hidden';
      tab.innerHTML = `
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
            <div><h2 style="margin-bottom:4px">Eğitim İçeriği Ekle</h2><p class="hint">Video, PDF ve diğer eğitim dosyalarını buradan yönetin.</p></div>
            <a class="btn dark" href="egitim-merkezi.html" target="_blank" rel="noopener">Sayfayı Aç</a>
          </div>
          <form id="educationForm" class="grid2">
            <div class="field full"><label>Başlık</label><input name="title" required></div>
            <div class="field full"><label>Açıklama</label><textarea name="description" required></textarea></div>
            <div class="field"><label>Kategori</label><select name="category"><option value="hucum">Hücum</option><option value="savunma">Savunma</option><option value="kaleci">Kaleci</option><option value="kondisyon">Kondisyon</option><option value="kurallar">Kurallar</option><option value="genel">Genel</option></select></div>
            <div class="field"><label>İçerik türü</label><select name="type"><option value="video">Video</option><option value="dokuman">Doküman</option><option value="egitim">Eğitim</option></select></div>
            <div class="field"><label>Seviye</label><select name="level"><option>Başlangıç</option><option>Orta</option><option>İleri</option><option>Tüm seviyeler</option></select></div>
            <div class="field"><label>Süre / bilgi</label><input name="duration" placeholder="Örn. 15 dakika veya 12 sayfa"></div>
            <div class="field"><label>Kapak görseli</label><input type="file" name="cover_file" accept="image/jpeg,image/png,image/webp"><span class="hint">JPG, PNG veya WEBP — en fazla 5 MB</span></div>
            <div class="field"><label>Video dosyası</label><input type="file" name="video_file" accept="video/mp4,video/webm,video/quicktime"><span class="hint">MP4, WEBM veya MOV — en fazla 250 MB</span></div>
            <div class="field full"><label>Video bağlantısı</label><input type="url" name="video_url" placeholder="YouTube, Vimeo veya doğrudan video bağlantısı"></div>
            <div class="field full"><label>Ek dosyalar</label><input type="file" name="attachment_files" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"><span class="hint">Birden fazla dosya seçebilirsiniz. Her dosya en fazla 50 MB.</span></div>
            <div class="field"><label>Sıralama</label><input type="number" name="sort_order" value="0"></div>
            <div class="field" style="align-content:center"><label><input type="checkbox" name="published" checked> Yayında</label></div>
            <input type="hidden" name="existing_cover_url">
            <input type="hidden" name="existing_video_url">
            <input type="hidden" name="existing_files">
            <div class="actions full"><button class="btn primary" type="submit">Eğitimi Kaydet</button><button id="educationCancel" class="btn dark hidden" type="button">Düzenlemeyi İptal Et</button></div>
          </form>
        </div>
        <div class="panel"><h2>Mevcut Eğitimler</h2><div id="educationList"><p>Yükleniyor...</p></div></div>`;
      main.appendChild(tab);
      document.getElementById('educationForm').addEventListener('submit', saveRow);
      document.getElementById('educationCancel').addEventListener('click', resetForm);
    }
    return true;
  }

  async function upload(file, folder, maxMb, allowedTypes) {
    if (!file || !file.size) return null;
    if (file.size > maxMb * 1024 * 1024) throw new Error(`${file.name}: dosya boyutu ${maxMb} MB sınırını aşıyor.`);
    if (allowedTypes && !allowedTypes.includes(file.type)) throw new Error(`${file.name}: desteklenmeyen dosya türü.`);
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'application/octet-stream' });
    if (error) throw new Error(`Dosya yüklenemedi: ${error.message}`);
    return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function saveRow(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Kaydediliyor...';
    try {
      const coverFile = form.elements.cover_file.files[0];
      const videoFile = form.elements.video_file.files[0];
      const attachments = [...form.elements.attachment_files.files];

      const coverUrl = await upload(coverFile, 'education/covers', 5, ['image/jpeg','image/png','image/webp']) || form.elements.existing_cover_url.value || null;
      const uploadedVideoUrl = await upload(videoFile, 'education/videos', 250, ['video/mp4','video/webm','video/quicktime']);
      const videoUrl = uploadedVideoUrl || form.elements.video_url.value.trim() || form.elements.existing_video_url.value || null;

      let files = [];
      try { files = JSON.parse(form.elements.existing_files.value || '[]'); } catch (_) { files = []; }
      for (const file of attachments) {
        const url = await upload(file, 'education/files', 50);
        files.push({ name: file.name, type: file.type || file.name.split('.').pop()?.toUpperCase() || 'Dosya', url });
      }

      const payload = {
        title: form.elements.title.value.trim(),
        description: form.elements.description.value.trim(),
        category: form.elements.category.value,
        type: form.elements.type.value,
        level: form.elements.level.value,
        duration: form.elements.duration.value.trim() || null,
        cover_url: coverUrl,
        video_url: videoUrl,
        files,
        published: form.elements.published.checked,
        sort_order: Number(form.elements.sort_order.value || 0)
      };

      const query = editingId ? db.from('education_posts').update(payload).eq('id', editingId) : db.from('education_posts').insert(payload);
      const { error } = await query;
      if (error) throw error;
      toast(editingId ? 'Eğitim güncellendi' : 'Eğitim eklendi');
      resetForm();
      await loadRows();
    } catch (error) {
      toast(error.message || String(error), true);
    } finally {
      submit.disabled = false;
      submit.textContent = editingId ? 'Değişiklikleri Kaydet' : 'Eğitimi Kaydet';
    }
  }

  async function loadRows() {
    const list = document.getElementById('educationList');
    if (!list || !db) return;
    list.innerHTML = '<p>Yükleniyor...</p>';
    const { data, error } = await db.from('education_posts').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) {
      list.innerHTML = `<div class="card"><strong>Tablo henüz hazır değil.</strong><p>${esc(error.message)}</p><small>Supabase içinde education_posts tablosu ve site-media yükleme izinleri gerekli.</small></div>`;
      return;
    }
    currentRows = data || [];
    if (!currentRows.length) {
      list.innerHTML = '<p>Henüz eğitim içeriği eklenmedi.</p>';
      return;
    }
    list.innerHTML = currentRows.map(row => `
      <div class="card">
        <strong>${esc(row.title)}</strong>
        ${row.cover_url ? `<img class="thumb" src="${esc(row.cover_url)}" alt="">` : ''}
        <p>${esc(row.description || '')}</p>
        <small>${esc(row.category || 'genel')} · ${esc(row.type || 'egitim')} · ${row.published ? 'Yayında' : 'Taslak'}</small>
        <div class="actions"><button class="btn dark" data-education-edit="${esc(row.id)}">Düzenle</button><button class="btn danger" data-education-delete="${esc(row.id)}">Sil</button></div>
      </div>`).join('');

    list.querySelectorAll('[data-education-edit]').forEach(btn => btn.addEventListener('click', () => editRow(btn.dataset.educationEdit)));
    list.querySelectorAll('[data-education-delete]').forEach(btn => btn.addEventListener('click', () => deleteRow(btn.dataset.educationDelete)));
  }

  function editRow(id) {
    const row = currentRows.find(item => String(item.id) === String(id));
    const form = document.getElementById('educationForm');
    if (!row || !form) return;
    editingId = row.id;
    form.elements.title.value = row.title || '';
    form.elements.description.value = row.description || '';
    form.elements.category.value = row.category || 'genel';
    form.elements.type.value = row.type || 'egitim';
    form.elements.level.value = row.level || 'Tüm seviyeler';
    form.elements.duration.value = row.duration || '';
    form.elements.video_url.value = row.video_url || '';
    form.elements.sort_order.value = row.sort_order || 0;
    form.elements.published.checked = !!row.published;
    form.elements.existing_cover_url.value = row.cover_url || '';
    form.elements.existing_video_url.value = row.video_url || '';
    form.elements.existing_files.value = JSON.stringify(Array.isArray(row.files) ? row.files : []);
    const submit = form.querySelector('button[type="submit"]');
    submit.textContent = 'Değişiklikleri Kaydet';
    document.getElementById('educationCancel').classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteRow(id) {
    if (!confirm('Bu eğitim içeriğini silmek istediğinizden emin misiniz?')) return;
    const { error } = await db.from('education_posts').delete().eq('id', id);
    toast(error ? error.message : 'Eğitim silindi', !!error);
    if (!error) loadRows();
  }

  function resetForm() {
    const form = document.getElementById('educationForm');
    if (!form) return;
    editingId = null;
    form.reset();
    form.elements.sort_order.value = 0;
    form.elements.published.checked = true;
    form.elements.existing_cover_url.value = '';
    form.elements.existing_video_url.value = '';
    form.elements.existing_files.value = '[]';
    form.querySelector('button[type="submit"]').textContent = 'Eğitimi Kaydet';
    document.getElementById('educationCancel').classList.add('hidden');
  }

  async function init() {
    if (!ensureUi()) return setTimeout(init, 300);
    if (!window.supabase || !cfg.url || !cfg.publishableKey) return;
    db = window.supabase.createClient(cfg.url, cfg.publishableKey, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await db.auth.getSession();
    if (data.session) loadRows();
    db.auth.onAuthStateChange((_event, session) => { if (session) loadRows(); });
  }

  init();
})();