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
  const page = pdf.addPage([842, 530]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x:0,y:0,width:842,height:530,color:rgb(0.025,0.027,0.03) });
  page.drawRectangle({ x:0,y:0,width:842,height:18,color:rgb(0.88,0.03,0.035) });
  page.drawRectangle({ x:0,y:512,width:842,height:18,color:rgb(0.88,0.03,0.035) });
  page.drawRectangle({ x:610,y:18,width:232,height:494,color:rgb(0.10,0.012,0.015) });
  page.drawRectangle({ x:615,y:18,width:7,height:494,color:rgb(0.88,0.03,0.035) });
  try {
    const lr=await fetch('https://karagumrukhentbol.org/assets/club-logo.png?v=20260919');
    if(lr.ok){const li=await pdf.embedPng(await lr.arrayBuffer());page.drawImage(li,{x:38,y:386,width:104,height:104});}
  } catch(_){}
  page.drawText('KARAGUMRUK', {x:165,y:454,size:31,font:bold,color:rgb(1,1,1)});
  page.drawText('HENTBOL SPOR KULUBU', {x:165,y:421,size:18,font:bold,color:rgb(.92,.08,.08)});
  page.drawText('DIJITAL UYELIK KARTI', {x:165,y:394,size:12,font:bold,color:rgb(.72,.72,.72)});
  await drawMemberPhoto(pdf,page,data.photoUrl);
  const qrDataUrl=await QRCode.toDataURL(data.verifyUrl,{margin:1,width:240,color:{dark:'#111111',light:'#ffffff'}});
  const qrImage=await pdf.embedPng(dataUrlToBytes(qrDataUrl));
  page.drawRectangle({x:660,y:250,width:132,height:132,color:rgb(1,1,1)});
  page.drawImage(qrImage,{x:667,y:257,width:118,height:118});
  page.drawText('UYE', {x:190,y:330,size:11,font:bold,color:rgb(.55,.55,.55)});
  page.drawText(pdfSafe(data.name).toUpperCase(), {x:190,y:292,size:27,font:bold,color:rgb(1,1,1)});
  page.drawText('UYELIK NO', {x:190,y:238,size:11,font:bold,color:rgb(.55,.55,.55)});
  page.drawText(pdfSafe(data.number), {x:190,y:205,size:22,font:bold,color:rgb(1,1,1)});
  page.drawText('UYELIK TURU', {x:400,y:238,size:11,font:bold,color:rgb(.55,.55,.55)});
  page.drawText(pdfSafe(data.type), {x:400,y:205,size:19,font:bold,color:rgb(1,1,1)});
  page.drawText('GECERLILIK', {x:190,y:150,size:11,font:bold,color:rgb(.55,.55,.55)});
  page.drawText(pdfSafe(fmt(data.approvedAt))+'  -  '+pdfSafe(fmt(data.validUntil)), {x:190,y:119,size:15,font:regular,color:rgb(1,1,1)});
  page.drawText('DAIMA', {x:654,y:184,size:21,font:bold,color:rgb(1,1,1)});
  page.drawText('DAHA', {x:654,y:158,size:21,font:bold,color:rgb(1,1,1)});
  page.drawText('ILERI', {x:654,y:130,size:25,font:bold,color:rgb(.93,.08,.08)});
  page.drawText('QR ILE DOGRULA', {x:670,y:225,size:10,font:bold,color:rgb(.75,.75,.75)});
  page.drawText('www.karagumrukhentbol.org', {x:38,y:38,size:13,font:bold,color:rgb(1,1,1)});
  page.drawText('Raouf Tarek  |  Kulup Baskani', {x:630,y:38,size:11,font:bold,color:rgb(1,1,1)});
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