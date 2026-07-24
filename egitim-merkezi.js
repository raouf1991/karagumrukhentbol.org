(() => {
  'use strict';

  const grid = document.getElementById('eduGrid');
  const filters = document.getElementById('eduFilters');
  const search = document.getElementById('eduSearch');
  const count = document.getElementById('eduCount');
  if (!grid || !filters || !search) return;

  const categories = [
    ['all','Tümü'],['hucum','Hücum'],['savunma','Savunma'],['kaleci','Kaleci'],
    ['kondisyon','Kondisyon'],['kurallar','Kurallar'],['video','Videolar'],['dokuman','Dokümanlar']
  ];

  const demoItems = [
    {id:'demo-1',title:'6:0 Savunma Sistemine Giriş',description:'Takım savunmasının temel yerleşimi, oyuncu görevleri ve doğru kayma prensipleri.',category:'savunma',type:'video',level:'Başlangıç',duration:'12 dakika',cover_url:'',video_url:'',files:[],published:true},
    {id:'demo-2',title:'Hızlı Hücum Temelleri',description:'Top kazanıldıktan sonra hızlı hücuma çıkış ve doğru koşu koridorları.',category:'hucum',type:'dokuman',level:'Orta',duration:'PDF',cover_url:'',video_url:'',files:[],published:true},
    {id:'demo-3',title:'Kaleci Ayak Çalışması',description:'Kaleciler için denge, pozisyon alma ve kısa mesafe reaksiyon çalışmaları.',category:'kaleci',type:'video',level:'Orta',duration:'18 dakika',cover_url:'',video_url:'',files:[],published:true}
  ];

  let items = [];
  let activeFilter = 'all';

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const typeLabel = type => type === 'video' ? '🎥 Video' : type === 'dokuman' ? '📄 Doküman' : '📚 Eğitim';
  const typeIcon = type => type === 'video' ? '▶' : type === 'dokuman' ? 'PDF' : '🎓';

  function renderFilters() {
    filters.innerHTML = categories.map(([value,label]) =>
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
    if (count) count.textContent = `${visible.length} içerik`;
    if (!visible.length) {
      grid.innerHTML = '<div class="edu-empty"><strong>İçerik bulunamadı.</strong>Arama kelimesini veya kategoriyi değiştirebilirsiniz.</div>';
      return;
    }

    grid.innerHTML = visible.map(item => {
      const cover = item.cover_url
        ? `<img src="${escapeHtml(item.cover_url)}" alt="${escapeHtml(item.title)}" loading="lazy">`
        : `<span>${typeIcon(item.type)}</span>`;
      const detailUrl = `egitim-detay.html?id=${encodeURIComponent(item.id)}`;
      return `<article class="edu-card">
        <a class="edu-cover" href="${detailUrl}" aria-label="${escapeHtml(item.title)}">${cover}<span class="edu-type">${typeLabel(item.type)}</span></a>
        <div class="edu-body">
          <div class="edu-meta"><span class="edu-level">${escapeHtml(item.level || 'Tüm seviyeler')}</span><span>•</span><span>${escapeHtml(item.duration || '')}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description || '')}</p>
          <div class="edu-actions"><a class="edu-action primary" href="${detailUrl}">Detayları Gör</a></div>
        </div>
      </article>`;
    }).join('');
  }

  async function loadItems() {
    try {
      if (!window.supabase || !window.KH_SUPABASE) throw new Error('Supabase unavailable');
      const client = window.supabase.createClient(window.KH_SUPABASE.url, window.KH_SUPABASE.publishableKey);
      const { data, error } = await client.from('education_posts').select('*').eq('published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
      if (error) throw error;
      items = Array.isArray(data) && data.length ? data : demoItems;
    } catch (error) {
      console.info('Eğitim Merkezi demo içerikleri gösteriliyor.', error?.message || error);
      items = demoItems;
    }
    renderItems();
  }

  search.addEventListener('input',renderItems);
  renderFilters();
  loadItems();
})();