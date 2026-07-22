const SUPABASE_URL = 'https://ukhnlbqjmulasfvgiqgn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nJDc_QBLF2IIr_we4PDJPQ_64YuLovu';
const SITE_URL = 'https://karagumrukhentbol.org';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function plainText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'tr';

    if (!id) return new Response('News id is required.', { status: 400 });

    const apiUrl = `${SUPABASE_URL}/rest/v1/news?id=eq.${encodeURIComponent(id)}&published=eq.true&select=*`;
    const response = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json'
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });

    if (!response.ok) return new Response('News could not be loaded.', { status: 502 });
    const rows = await response.json();
    const news = rows?.[0];
    if (!news) return new Response('News not found.', { status: 404 });

    const title = lang === 'en' ? (news.title_en || news.title_tr || '') : (news.title_tr || news.title_en || '');
    const body = lang === 'en' ? (news.body_en || news.body_tr || '') : (news.body_tr || news.body_en || '');
    const description = plainText(body).slice(0, 190) || 'Karagümrük Hentbol Spor Kulübü haberleri';
    const image = news.image_url || `${SITE_URL}/assets/club-logo.png`;
    const articleUrl = `${SITE_URL}/news.html?id=${encodeURIComponent(id)}`;
    const shareUrl = `${SITE_URL}/share/news?id=${encodeURIComponent(id)}&lang=${lang}`;

    const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | Karagümrük Hentbol</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(articleUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Karagümrük Hentbol Spor Kulübü">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:secure_url" content="${escapeHtml(image)}">
<meta property="og:url" content="${escapeHtml(shareUrl)}">
<meta property="og:locale" content="${lang === 'tr' ? 'tr_TR' : 'en_GB'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<style>body{margin:0;background:#111;color:#fff;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center;text-align:center;padding:24px;box-sizing:border-box}.box{max-width:720px}.box img{width:120px;height:120px;object-fit:contain;background:#fff;border-radius:50%}.box h1{font-size:34px;margin:22px 0}.box a{display:inline-block;background:#e10600;color:#fff;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:8px}</style>
</head>
<body>
<div class="box"><img src="${SITE_URL}/assets/club-logo.png" alt="Karagümrük Hentbol"><h1>${escapeHtml(title)}</h1><a href="${escapeHtml(articleUrl)}">${lang === 'tr' ? 'Haberi Aç' : 'Open News'}</a></div>
<script>location.replace(${JSON.stringify(articleUrl)});</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'public, max-age=300'
      }
    });
  }
};
