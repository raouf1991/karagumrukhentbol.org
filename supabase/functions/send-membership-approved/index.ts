import { createClient } from 'npm:@supabase/supabase-js@2';
import QRCode from 'npm:qrcode@1.5.4';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

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

const pdfSafe = (v = '') => String(v)
  .replaceAll('ğ', 'g').replaceAll('Ğ', 'G')
  .replaceAll('ş', 's').replaceAll('Ş', 'S')
  .replaceAll('ı', 'i').replaceAll('İ', 'I');

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function drawMemberPhoto(pdf: PDFDocument, page: any, photoUrl: string) {
  const candidates = [photoUrl, 'https://karagumrukhentbol.org/assets/club-logo.png'].filter(Boolean);
  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      const type = (response.headers.get('content-type') || '').toLowerCase();
      const image = type.includes('jpeg') || type.includes('jpg') || /\.jpe?g($|\?)/i.test(url)
        ? await pdf.embedJpg(buffer)
        : await pdf.embedPng(buffer);
      const box = { x: 44, y: 307, width: 116, height: 116 };
      const scale = Math.max(box.width / image.width, box.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      page.drawRectangle({ x: 39, y: 302, width: 126, height: 126, color: rgb(1, 1, 1) });
      page.drawImage(image, {
        x: box.x + (box.width - width) / 2,
        y: box.y + (box.height - height) / 2,
        width,
        height,
      });
      page.drawRectangle({ x: 39, y: 302, width: 126, height: 126, borderColor: rgb(0.88, 0.08, 0.06), borderWidth: 4 });
      return;
    } catch (_) {
      // Try the fallback image.
    }
  }
}

async function createMembershipPdf(data: {
  name: string; number: string; type: string; approvedAt: string; validUntil: string; verifyUrl: string; photoUrl: string;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W=1012, H=638;
  const front=pdf.addPage([W,H]);
  const back=pdf.addPage([W,H]);
  const black=rgb(0.035,0.038,0.042), red=rgb(0.90,0.035,0.04), white=rgb(1,1,1), gray=rgb(.68,.68,.68);

  const logoUrl='https://karagumrukhentbol.org/assets/club-logo.png?v=20260919-card';
  let logo:any=null;
  try { const r=await fetch(logoUrl); if(r.ok){ const b=await r.arrayBuffer(); logo=await pdf.embedPng(b); } } catch(_){}

  // FRONT — approved black/red card
  front.drawRectangle({x:0,y:0,width:W,height:H,color:black});
  front.drawRectangle({x:0,y:0,width:18,height:H,color:red});
  front.drawRectangle({x:18,y:0,width:255,height:18,color:red});
  front.drawRectangle({x:760,y:0,width:252,height:18,color:red});
  front.drawRectangle({x:865,y:0,width:147,height:H,color:rgb(.11,.015,.02),opacity:.82});
  front.drawRectangle({x:820,y:0,width:12,height:H,color:red});
  front.drawRectangle({x:715,y:465,width:230,height:18,color:red,opacity:.85});
  if(logo) front.drawImage(logo,{x:52,y:482,width:112,height:112});
  front.drawText('KARAGUMRUK',{x:185,y:550,size:31,font:bold,color:white});
  front.drawText('HENTBOL SPOR KULUBU',{x:185,y:516,size:18,font:bold,color:white});
  front.drawText('DAIMA DAHA',{x:52,y:62,size:24,font:bold,color:white});
  front.drawText('ILERI',{x:221,y:62,size:24,font:bold,color:red});
  front.drawText('UYE',{x:245,y:414,size:12,font:bold,color:gray});
  front.drawText(pdfSafe(data.name).toUpperCase(),{x:245,y:370,size:31,font:bold,color:white});
  front.drawText('UYELIK NO',{x:245,y:306,size:12,font:bold,color:gray});
  front.drawText(pdfSafe(data.number),{x:245,y:269,size:24,font:bold,color:white});
  front.drawText('UYELIK TURU',{x:245,y:215,size:12,font:bold,color:gray});
  front.drawText(pdfSafe(data.type),{x:245,y:179,size:22,font:bold,color:white});
  front.drawText('GECERLILIK',{x:245,y:128,size:12,font:bold,color:gray});
  front.drawText(pdfSafe(fmt(data.approvedAt))+' - '+pdfSafe(fmt(data.validUntil)),{x:245,y:96,size:16,font:regular,color:white});
  await drawMemberPhoto(pdf,front,data.photoUrl);
  const qrDataUrl=await QRCode.toDataURL(data.verifyUrl,{margin:1,width:260,color:{dark:'#111111',light:'#ffffff'}});
  const qrImage=await pdf.embedPng(dataUrlToBytes(qrDataUrl));
  front.drawRectangle({x:874,y:250,width:116,height:116,color:white});
  front.drawImage(qrImage,{x:880,y:256,width:104,height:104});
  front.drawText('QR ILE',{x:891,y:216,size:12,font:bold,color:white});
  front.drawText('DOGRULA',{x:881,y:198,size:12,font:bold,color:white});
  front.drawText('www.karagumrukhentbol.org',{x:650,y:62,size:13,font:bold,color:white});

  // BACK — approved large crest / diagonal red identity
  back.drawRectangle({x:0,y:0,width:W,height:H,color:black});
  back.drawRectangle({x:0,y:0,width:W,height:18,color:red});
  back.drawRectangle({x:0,y:620,width:W,height:18,color:red});
  back.drawRectangle({x:0,y:0,width:170,height:638,color:rgb(.08,.08,.09),opacity:.7});
  back.drawRectangle({x:720,y:0,width:292,height:638,color:rgb(.08,.01,.015),opacity:.75});
  back.drawRectangle({x:72,y:0,width:16,height:638,color:red,opacity:.75});
  back.drawRectangle({x:790,y:0,width:16,height:638,color:red,opacity:.8});
  if(logo) back.drawImage(logo,{x:315,y:165,width:382,height:382});
  back.drawText('DAIMA',{x:820,y:150,size:28,font:bold,color:white});
  back.drawText('DAHA',{x:820,y:116,size:28,font:bold,color:white});
  back.drawText('ILERI',{x:820,y:80,size:32,font:bold,color:red});
  back.drawText('www.karagumrukhentbol.org',{x:376,y:55,size:16,font:bold,color:white});
  back.drawText('KARAGUMRUK HENTBOL SPOR KULUBU',{x:52,y:54,size:12,font:bold,color:white});
  return await pdf.save();
}

function emailHtml(d: { name: string; number: string; type: string; approvedAt: string; validUntil: string }) {
  const portalUrl = 'https://karagumrukhentbol.org/member-login.html';
  return `<!doctype html><html><body style="margin:0;background:#ececec;font-family:Arial,sans-serif;color:#171717"><table width="100%" cellpadding="0" cellspacing="0" style="padding:25px 10px"><tr><td align="center"><table width="100%" style="max-width:680px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#111;padding:28px;text-align:center;border-bottom:5px solid #d50909"><img src="https://karagumrukhentbol.org/assets/club-logo.png?v=20260919" width="110" style="border-radius:50%;background:#fff"><div style="margin:18px auto 6px;width:54px;height:4px;background:#e51619"></div><h1 style="color:#fff;margin:12px 0 0">KARAGÜMRÜK HENTBOL</h1></td></tr><tr><td style="padding:34px"><div style="color:#c20d09;font-weight:800">ÜYELİK ONAYI</div><h2 style="font-size:32px">Üyelik Başvurunuz Onaylandı!</h2><p style="font-size:17px;line-height:1.7">Merhaba <strong>${esc(d.name)}</strong>,</p><p style="font-size:16px;line-height:1.7">Üyelik başvurunuz yönetimimiz tarafından onaylanmıştır. Karagümrük Hentbol ailesine hoş geldiniz.</p><div style="background:#111;border-radius:16px;overflow:hidden;margin:24px 0;color:#fff"><div style="background:linear-gradient(135deg,#111 60%,#8d0000);padding:24px"><div style="font-size:12px;color:#aaa;letter-spacing:1px">DİJİTAL ÜYELİK KARTI</div><div style="font-size:25px;font-weight:800;margin-top:8px">${esc(d.name)}</div><table width="100%" style="margin-top:22px;color:#fff"><tr><td><small style="color:#aaa">ÜYELİK NO</small><br><strong>${esc(d.number)}</strong></td><td><small style="color:#aaa">TÜR</small><br><strong>${esc(d.type)}</strong></td></tr><tr><td colspan="2" style="padding-top:18px"><small style="color:#aaa">GEÇERLİLİK</small><br>${esc(fmt(d.approvedAt))} — ${esc(fmt(d.validUntil))}</td></tr></table></div><div style="background:#c80d09;padding:13px 24px;font-weight:700">Karagümrük Hentbol Spor Kulübü</div></div><p style="font-size:16px;line-height:1.7">Fotoğrafınızı içeren yazdırılabilir dijital üyelik kartınız bu e-postaya <strong>PDF</strong> olarak eklenmiştir.</p><div style="margin:30px 0;text-align:center"><a href="${portalUrl}" style="display:inline-block;background:#d50909;color:#fff;text-decoration:none;font-size:17px;font-weight:800;padding:15px 28px;border-radius:10px">Üye Paneline Giriş</a><p style="font-size:13px;color:#666;line-height:1.6;margin-top:12px">Kayıt sırasında kullandığınız e-posta adresini girin. Size güvenli giriş bağlantısı gönderilecektir.</p></div><div style="margin-top:36px"><div style="font-family:cursive;font-size:34px">Raouf Tarek</div><strong>Raouf Tarek</strong><br>Kulüp Başkanı / Club President</div></td></tr><tr><td style="background:#111;color:#ddd;padding:22px;text-align:center">info@karagumrukhentbol.org · karagumrukhentbol.org</td></tr></table></td></tr></table></body></html>`;
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
    const photoUrl = String(body.photo_url || '').trim();
    if (!name || !email || !number || !validUntil) throw new Error('Missing membership data.');

    const verifyUrl = `https://karagumrukhentbol.org/?membership=${encodeURIComponent(number)}`;
    const pdfBytes = await createMembershipPdf({ name, number, type, approvedAt, validUntil, verifyUrl, photoUrl });
    const payload = {
      from,
      to: [email],
      subject: 'Karagümrük Hentbol Üyeliğiniz Onaylandı',
      html: emailHtml({ name, number, type, approvedAt, validUntil }),
      attachments: [{ filename: `${number}-uyelik-karti.pdf`, content: bytesToBase64(pdfBytes), content_type: 'application/pdf' }],
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Resend request failed.');

    if (id) {
      const url = Deno.env.get('SUPABASE_URL');
      const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (url && service) await createClient(url, service).from('membership_requests').update({ approval_email_sent_at: new Date().toISOString() }).eq('id', id);
    }
    return new Response(JSON.stringify({ ok: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});