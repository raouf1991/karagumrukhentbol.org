import { createClient } from 'npm:@supabase/supabase-js@2';
import QRCode from 'npm:qrcode@1.5.4';
import { Resvg } from 'npm:@resvg/resvg-js@2.6.2';
import { Resend } from 'npm:resend@6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c] || c));

const fmt = (v: string) => new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(new Date(v));

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

async function fetchLogoDataUrl() {
  const response = await fetch('https://karagumrukhentbol.org/assets/club-logo.png');
  if (!response.ok) throw new Error('Kulüp logosu alınamadı.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  return `data:image/png;base64,${bytesToBase64(bytes)}`;
}

function cardSvg(data: {
  name: string;
  number: string;
  type: string;
  approvedAt: string;
  validUntil: string;
  qrSvg: string;
  logoDataUrl: string;
}) {
  const qr = data.qrSvg
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace('<svg', '<svg x="860" y="260" width="180" height="180"');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="650" viewBox="0 0 1100 650">
  <defs>
    <linearGradient id="r" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#e21b16"/><stop offset="1" stop-color="#7a0000"/>
    </linearGradient>
  </defs>
  <rect width="1100" height="650" rx="42" fill="#101010"/>
  <path d="M770 0H1100V650H920L680 0Z" fill="url(#r)" opacity=".9"/>
  <circle cx="155" cy="145" r="105" fill="#fff"/>
  <image href="${data.logoDataUrl}" x="65" y="55" width="180" height="180"/>
  <text x="300" y="115" fill="#fff" font-family="Arial, sans-serif" font-size="54" font-weight="800">KARAGÜMRÜK</text>
  <text x="300" y="170" fill="#e21b16" font-family="Arial, sans-serif" font-size="38" font-weight="800">HENTBOL SPOR KULÜBÜ</text>
  <text x="300" y="225" fill="#fff" font-family="Arial, sans-serif" font-size="28">ÜYELİK KARTI · MEMBERSHIP CARD</text>
  <text x="75" y="345" fill="#aaa" font-family="Arial, sans-serif" font-size="22">ÜYE ADI</text>
  <text x="75" y="385" fill="#fff" font-family="Arial, sans-serif" font-size="34" font-weight="700">${esc(data.name)}</text>
  <text x="75" y="455" fill="#aaa" font-family="Arial, sans-serif" font-size="22">ÜYELİK NUMARASI</text>
  <text x="75" y="495" fill="#fff" font-family="Arial, sans-serif" font-size="32" font-weight="700">${esc(data.number)}</text>
  <text x="470" y="345" fill="#aaa" font-family="Arial, sans-serif" font-size="22">ÜYELİK TÜRÜ</text>
  <text x="470" y="385" fill="#fff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${esc(data.type)}</text>
  <text x="470" y="455" fill="#aaa" font-family="Arial, sans-serif" font-size="22">KAYIT / GEÇERLİLİK</text>
  <text x="470" y="495" fill="#fff" font-family="Arial, sans-serif" font-size="24">${esc(fmt(data.approvedAt))} — ${esc(fmt(data.validUntil))}</text>
  ${qr}
  <rect y="560" width="1100" height="90" fill="#c80d09"/>
  <text x="75" y="618" fill="#fff" font-family="Arial, sans-serif" font-size="25">karagumrukhentbol.org</text>
  <text x="720" y="618" fill="#fff" font-family="Arial, sans-serif" font-size="24">Raouf Tarek · Kulüp Başkanı</text>
  </svg>`;
}

function emailHtml(d: {
  name: string;
  number: string;
  type: string;
  approvedAt: string;
  validUntil: string;
}) {
  return `<!doctype html><html><body style="margin:0;background:#ececec;font-family:Arial,sans-serif;color:#171717"><table width="100%" cellpadding="0" cellspacing="0" style="padding:25px 10px"><tr><td align="center"><table width="100%" style="max-width:680px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#111;padding:28px;text-align:center;border-bottom:5px solid #d50909"><img src="https://karagumrukhentbol.org/assets/club-logo.png" width="90"><h1 style="color:#fff;margin:12px 0 0">KARAGÜMRÜK HENTBOL</h1></td></tr><tr><td style="padding:34px"><div style="color:#c20d09;font-weight:800">ÜYELİK ONAYI</div><h2 style="font-size:32px">Üyelik Başvurunuz Onaylandı!</h2><p style="font-size:17px;line-height:1.7">Merhaba <strong>${esc(d.name)}</strong>,</p><p style="font-size:16px;line-height:1.7">Üyelik başvurunuz yönetimimiz tarafından onaylanmıştır. Karagümrük Hentbol ailesine hoş geldiniz.</p><div style="background:#f5f5f5;border-left:5px solid #d50909;padding:18px;margin:22px 0"><strong>Üyelik No:</strong> ${esc(d.number)}<br><strong>Tür:</strong> ${esc(d.type)}<br><strong>Geçerlilik:</strong> ${esc(fmt(d.approvedAt))} — ${esc(fmt(d.validUntil))}</div><img src="cid:membership-card" alt="Üyelik Kartı" style="width:100%;max-width:620px;border-radius:14px;display:block"><p style="margin-top:30px;font-size:16px;line-height:1.7">Dijital üyelik kartınız ayrıca bu e-postaya PNG dosyası olarak eklenmiştir.</p><div style="margin-top:36px"><div style="font-family:cursive;font-size:34px">Raouf Tarek</div><strong>Raouf Tarek</strong><br>Kulüp Başkanı / Club President</div></td></tr><tr><td style="background:#111;color:#ddd;padding:22px;text-align:center">info@karagumrukhentbol.org · karagumrukhentbol.org</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM_EMAIL') || 'Karagümrük Hentbol <info@karagumrukhentbol.org>';
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

    const body = await req.json();
    const id = String(body.id || '');
    const name = String(body.full_name || '').trim();
    const email = String(body.email || '').trim();
    const number = String(body.membership_number || '').trim();
    const type = String(body.membership_type || 'Yetişkin Üye');
    const approvedAt = String(body.approved_at || new Date().toISOString());
    const validUntil = String(body.valid_until || '');
    if (!name || !email || !number || !validUntil) throw new Error('Missing membership data.');

    const verifyUrl = `https://karagumrukhentbol.org/?membership=${encodeURIComponent(number)}`;
    const [qrSvg, logoDataUrl] = await Promise.all([
      QRCode.toString(verifyUrl, { type: 'svg', margin: 1, width: 180, color: { dark: '#111111', light: '#ffffff' } }),
      fetchLogoDataUrl(),
    ]);

    const svg = cardSvg({ name, number, type, approvedAt, validUntil, qrSvg, logoDataUrl });
    const pngBytes = new Resvg(svg, { fitTo: { mode: 'width', value: 1100 } }).render().asPng();
    const pngBase64 = bytesToBase64(pngBytes);

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: 'Karagümrük Hentbol Üyeliğiniz Onaylandı',
      html: emailHtml({ name, number, type, approvedAt, validUntil }),
      attachments: [{
        filename: `${number}-uyelik-karti.png`,
        content: pngBase64,
        contentType: 'image/png',
        contentId: 'membership-card',
      }],
    });
    if (error) throw new Error(error.message || 'Resend request failed.');

    if (id) {
      const url = Deno.env.get('SUPABASE_URL');
      const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (url && service) {
        await createClient(url, service)
          .from('membership_requests')
          .update({ approval_email_sent_at: new Date().toISOString() })
          .eq('id', id);
      }
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
