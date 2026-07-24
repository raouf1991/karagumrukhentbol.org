(() => {
  'use strict';

  const root = document.getElementById('detailRoot');
  if (!root) return;

  const demoItems = [
    {id:'demo-1',title:'6:0 Savunma Sistemine Giriş',description:'Takım savunmasının temel yerleşimi, oyuncu görevleri ve doğru kayma prensipleri.',category:'savunma',type:'video',level:'Başlangıç',duration:'12 dakika',cover_url:'',video_url:'',files:[],published:true,created_at:new Date().toISOString()},
    {id:'demo-2',title:'Hızlı Hücum Temelleri',description:'Top kazanıldıktan sonra hızlı hücuma çıkış ve doğru koşu koridorları.',category:'hucum',type:'dokuman',level:'Orta',duration:'PDF',cover_url:'',video_url:'',files:[],published:true,created_at:new Date().toISOString()},
    {id:'demo-3',title:'Kaleci Ayak Çalışması',description:'Kaleciler için denge, pozisyon alma ve kısa mesafe reaksiyon çalışmaları.',category:'kaleci',type:'video',level:'Orta',duration:'18 dakika',cover_url:'',video_url:'',files:[],published:true,created_at:new Date().toISOString()}
  ];

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const labelMap = {hucum:'Hücum',savunma:'Savunma',kaleci:'Kaleci',kondisyon:'Kondisyon',kurallar:'Kurallar',video:'Video',dokuman:'Doküman'};
  const typeLabel = type => type === 'video' ? '🎥 Video' : type === 'dokuman' ? '📄 Doküman' : '📚 Eğitim';
  const typeIcon = type => type === 'video' ? '▶' : type === 'dokuman' ? 'PDF' : '🎓';

  function normalizeVideoUrl(url = '') {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com')) {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (parsed.hostname === 'youtu.be') return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
      return url;
    } catch (_) { return url; }
  }

  function render(item) {
    document.title = `${item.title} | Eğitim Merkezi`;
    const files = Array.isArray(item.files) ? item.files : [];
    const video = normalizeVideoUrl(item.video_url || '');
    const cover = item.cover_url
      ? `<img src="${escapeHtml(item.cover_url)}" alt="${escapeHtml(item.title)}">`
      : `<span>${typeIcon(item.type)}</span>`;

    const mediaHtml = video
      ? (video.includes('youtube.com/embed') || video.includes('player.vimeo.com')
          ? `<iframe class="detail-player" src="${escapeHtml(video)}" title="${escapeHtml(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
          : `<video class="detail-video-file" controls preload="metadata" src="${escapeHtml(video)}"></video>`)
      : '';

    const filesHtml = files.length
      ? `<h3>İndirilebilir Dosyalar</h3><div class="detail-files">${files.map(file => `<div class="detail-file"><div><strong>${escapeHtml(file.name || 'Doküman')}</strong><br><small>${escapeHtml(file.type || 'Dosya')}</small></div><a class="btn btn-primary" href="${escapeHtml(file.url || '#')}" target="_blank" rel="noopener" download>İndir</a></div>`).join('')}</div>`
      : '';

    const publishedDate = item.created_at ? new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(item.created_at)) : '—';
    const category = labelMap[item.category] || item.category || 'Genel';

    root.innerHTML = `
      <section class="detail-hero"><div class="container">
        <div class="detail-breadcrumb"><a href="index.html">Ana Sayfa</a><span>›</span><a href="egitim-merkezi.html">Eğitim Merkezi</a><span>›</span><span>${escapeHtml(item.title)}</span></div>
        <div class="detail-hero-grid"><div>
          <span class="detail-kicker">${typeLabel(item.type)}</span>
          <h1>${escapeHtml(item.title)}</h1>
          <p class="detail-summary">${escapeHtml(item.description || '')}</p>
          <div class="detail-meta"><span class="detail-pill">${escapeHtml(item.level || 'Tüm seviyeler')}</span><span class="detail-pill">${escapeHtml(item.duration || 'Süre belirtilmedi')}</span><span class="detail-pill">${escapeHtml(category)}</span></div>
        </div><div class="detail-cover">${cover}</div></div>
      </div></section>
      <section class="detail-main"><div class="container detail-layout">
        <article class="detail-panel">
          <h2>Eğitim İçeriği</h2>
          <p>${escapeHtml(item.content || item.description || '')}</p>
          ${mediaHtml ? `<h3>Video</h3>${mediaHtml}` : ''}
          ${filesHtml}
          ${!mediaHtml && !filesHtml ? '<div class="detail-empty"><strong>İçerik yakında eklenecek.</strong><br>Bu eğitim şu anda önizleme olarak yayınlanmaktadır.</div>' : ''}
        </article>
        <aside class="detail-side"><h3>Eğitim Bilgileri</h3>
          <div class="detail-fact"><span>Tür</span><strong>${escapeHtml(typeLabel(item.type).replace(/^..\s?/u,''))}</strong></div>
          <div class="detail-fact"><span>Kategori</span><strong>${escapeHtml(category)}</strong></div>
          <div class="detail-fact"><span>Seviye</span><strong>${escapeHtml(item.level || 'Tüm seviyeler')}</strong></div>
          <div class="detail-fact"><span>Süre</span><strong>${escapeHtml(item.duration || '—')}</strong></div>
          <div class="detail-fact"><span>Yayın Tarihi</span><strong>${escapeHtml(publishedDate)}</strong></div>
          <a class="btn btn-primary detail-back" href="egitim-merkezi.html">Tüm Eğitimlere Dön</a>
        </aside>
      </div></section>`;
  }

  function renderError() {
    root.innerHTML = '<section class="detail-main"><div class="container"><div class="detail-panel detail-empty"><strong>Eğitim bulunamadı.</strong><br>İçerik kaldırılmış veya bağlantı hatalı olabilir.<br><br><a class="btn btn-primary" href="egitim-merkezi.html">Eğitim Merkezine Dön</a></div></div></section>';
  }

  async function load() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return renderError();

    const demo = demoItems.find(item => String(item.id) === String(id));
    if (demo) return render(demo);

    try {
      if (!window.supabase || !window.KH_SUPABASE) throw new Error('Supabase unavailable');
      const client = window.supabase.createClient(window.KH_SUPABASE.url, window.KH_SUPABASE.publishableKey);
      const { data, error } = await client.from('education_posts').select('*').eq('id', id).eq('published', true).single();
      if (error || !data) throw error || new Error('Not found');
      render(data);
    } catch (error) {
      console.info('Eğitim detayı yüklenemedi.', error?.message || error);
      renderError();
    }
  }

  load();
})();