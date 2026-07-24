(() => {
  'use strict';

  const grid = document.getElementById('eduGrid');
  const filters = document.getElementById('eduFilters');
  const search = document.getElementById('eduSearch');
  const count = document.getElementById('eduCount');
  const modal = document.getElementById('eduModal');
  const modalContent = document.getElementById('eduModalContent');
  const closeModalButton = document.getElementById('eduClose');

  if (!grid || !filters || !search) return;

  const categories = [
    ['all', 'Tümü'],
    ['hucum', 'Hücum'],
    ['savunma', 'Savunma'],
    ['kaleci', 'Kaleci'],
    ['kondisyon', 'Kondisyon'],
    ['kurallar', 'Kurallar'],
    ['video', 'Videolar'],
    ['dokuman', 'Dokümanlar']
  ];

  const demoItems = [
    {
      id: 'demo-1', title: '6:0 Savunma Sistemine Giriş',
      description: 'Takım savunmasının temel yerleşimi, oyuncu görevleri ve doğru kayma prensipleri.',
      category: 'savunma', type: 'video', level: 'Başlangıç', duration: '12 dakika',
      cover_url: '', video_url: '', files: [], published: true
    },
    {
      id: 'demo-2', title: 'Hızlı Hücum Temelleri',
      description: 'Top kazanıldıktan sonra hızlı hücuma çıkış ve doğru koşu koridorları.',
      category: 'hucum', type: 'dokuman', level: 'Orta', duration: 'PDF',
      cover_url: '', video_url: '', files: [], published: true
    },
    {
      id: 'demo-3', title: 'Kaleci Ayak Çalışması',
      description: 'Kaleciler için denge, pozisyon alma ve kısa mesafe reaksiyon çalışmaları.',
      category: 'kaleci', type: 'video', level: 'Orta', duration: '18 dakika',
      cover_url: '', video_url: '', files: [], published: true
    }
  ];

  let items = [];
  let activeFilter = 'all';

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const typeLabel = type => type === 'video' ? '🎥 Video' : type === 'dokuman' ? '📄 Doküman' : '📚 Eğitim';
  const typeIcon = type => type === 'video' ? '▶' : type === 'dokuman' ? 'PDF' : '🎓';

  function renderFilters() {
    filters.innerHTML = categories.map(([value, label]) =>
      `<button class="edu-filter ${value === activeFilter ? 'active' : ''}" type="button" data-filter="${value}">${label}</button>`
    ).join('');

    filters.querySelectorAll('.edu-filter').forEach(button => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter || 'all';
        renderFilters();
        renderItems();
      });
    });
  }

  function filteredItems() {
    const query = search.value.trim().toLocaleLowerCase('tr');
    return items.filter(item => {
      const matchesFilter = activeFilter === 'all' || item.category === activeFilter || item.type === activeFilter;
      const haystack = `${item.title || ''} ${item.description || ''} ${item.category || ''}`.toLocaleLowerCase('tr');
      return matchesFilter && (!query || haystack.includes(query));
    });
  }

  function renderItems() {
    const visible = filteredItems();
    count.textContent = `${visible.length} içerik`;

    if (!visible.length) {
      grid.innerHTML = '<div class="edu-empty"><strong>İçerik bulunamadı.</strong>Arama kelimesini veya kategoriyi değiştirebilirsiniz.</div>';
      return;
    }

    grid.innerHTML = visible.map(item => {
      const cover = item.cover_url
        ? `<img src="${escapeHtml(item.cover_url)}" alt="${escapeHtml(item.title)}" loading="lazy">`
        : `<span>${typeIcon(item.type)}</span>`;
      return `<article class="edu-card">
        <div class="edu-cover">${cover}<span class="edu-type">${typeLabel(item.type)}</span></div>
        <div class="edu-body">
          <div class="edu-meta"><span class="edu-level">${escapeHtml(item.level || 'Tüm seviyeler')}</span><span>•</span><span>${escapeHtml(item.duration || '')}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description || '')}</p>
          <div class="edu-actions"><button class="edu-action primary" type="button" data-open="${escapeHtml(item.id)}">İçeriği Aç</button></div>
        </div>
      </article>`;
    }).join('');

    grid.querySelectorAll('[data-open]').forEach(button => {
      button.addEventListener('click', () => openItem(button.dataset.open));
    });
  }

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
    } catch (_) {
      return url;
    }
  }

  function openItem(id) {
    const item = items.find(entry => String(entry.id) === String(id));
    if (!item) return;

    const video = normalizeVideoUrl(item.video_url || '');
    const files = Array.isArray(item.files) ? item.files : [];
    const videoHtml = video
      ? `<h3>Video</h3><iframe class="edu-player" src="${escapeHtml(video)}" title="${escapeHtml(item.title)}" allowfullscreen></iframe>`
      : '';
    const filesHtml = files.length
      ? `<h3>Dosyalar</h3>${files.map(file => `<div class="edu-doc"><div><strong>${escapeHtml(file.name || 'Doküman')}</strong><br><small>${escapeHtml(file.type || '')}</small></div><a class="btn btn-primary" href="${escapeHtml(file.url || '#')}" target="_blank" rel="noopener" download>İndir</a></div>`).join('')}`
      : '';

    modalContent.innerHTML = `<span class="edu-kicker" style="color:#b11226">${typeLabel(item.type)}</span><h2 style="font-family:Barlow Condensed,sans-serif;font-size:2.7rem;margin:10px 45px 10px 0">${escapeHtml(item.title)}</h2><p style="line-height:1.7;color:#555">${escapeHtml(item.description || '')}</p>${videoHtml}${filesHtml}${!videoHtml && !filesHtml ? '<div class="edu-empty"><strong>İçerik yakında eklenecek.</strong>Bu eğitim kartı tasarım ve sistem önizlemesidir.</div>' : ''}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalContent.innerHTML = '';
  }

  async function loadItems() {
    try {
      if (!window.supabase || !window.KH_SUPABASE) throw new Error('Supabase unavailable');
      const client = window.supabase.createClient(window.KH_SUPABASE.url, window.KH_SUPABASE.publishableKey);
      const { data, error } = await client
        .from('education_posts')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      items = Array.isArray(data) && data.length ? data : demoItems;
    } catch (error) {
      console.info('Eğitim Merkezi demo içerikleri gösteriliyor.', error?.message || error);
      items = demoItems;
    }
    renderItems();
  }

  search.addEventListener('input', renderItems);
  closeModalButton?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

  renderFilters();
  loadItems();
})();