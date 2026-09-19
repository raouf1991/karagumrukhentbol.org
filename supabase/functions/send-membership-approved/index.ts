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

  // ISO/IEC 7810 ID-1 bank-card ratio: 85.60 x 53.98 mm.
  // Each PDF page is exactly one card face at physical ATM/credit-card size.
  const mm = 72 / 25.4;
  const W = 85.60 * mm, H = 53.98 * mm;
  const black=rgb(0.025,0.027,0.03), red=rgb(0.88,0.025,0.03), white=rgb(1,1,1), gray=rgb(.70,.70,.70);

  let logo:any=null;
  try {
    const r=await fetch('https://karagumrukhentbol.org/assets/club-logo.png?v=20260919-card');
    if(r.ok) logo=await pdf.embedPng(await r.arrayBuffer());
  } catch(_){}

  const front=pdf.addPage([W,H]);
  front.drawRectangle({x:0,y:0,width:W,height:H,color:black});
  front.drawRectangle({x:0,y:0,width:W,height:4,color:red});
  front.drawRectangle({x:0,y:H-4,width:W,height:4,color:red});
  front.drawRectangle({x:W-4,y:0,width:4,height:H,color:red});
  front.drawRectangle({x:0,y:0,width:4,height:H,color:red});
  front.drawRectangle({x:W*.70,y:0,width:W*.30,height:H,color:rgb(.08,.01,.015),opacity:.88});
  front.drawRectangle({x:W*.70,y:0,width:3,height:H,color:red});
  if(logo) front.drawImage(logo,{x:12,y:H-43,width:32,height:32});
  front.drawText('KARAGUMRUK',{x:51,y:H-24,size:10.5,font:bold,color:white});
  front.drawText('HENTBOL SPOR KULUBU',{x:51,y:H-34,size:5.8,font:bold,color:white});

  // Member photo box
  if(data.photoUrl){
    try{
      const r=await fetch(data.photoUrl);
      if(r.ok){
        const buf=await r.arrayBuffer();
        const ct=(r.headers.get('content-type')||'').toLowerCase();
        const im=ct.includes('jpeg')||ct.includes('jpg')?await pdf.embedJpg(buf):await pdf.embedPng(buf);
        const x=12,y=48,bw=43,bh=55,sc=Math.max(bw/im.width,bh/im.height),iw=im.width*sc,ih=im.height*sc;
        front.drawRectangle({x:x-1.5,y:y-1.5,width:bw+3,height:bh+3,color:white});
        front.drawImage(im,{x:x+(bw-iw)/2,y:y+(bh-ih)/2,width:iw,height:ih});
        front.drawRectangle({x:x-2.5,y:y-2.5,width:3,height:bh+5,color:red});
      }
    }catch(_){}
  }

  front.drawText(pdfSafe(data.name).toUpperCase(),{x:63,y:88,size:11,font:bold,color:white});
  front.drawText('Uyelik No',{x:63,y:74,size:5,font:regular,color:gray});
  front.drawText(pdfSafe(data.number),{x:91,y:74,size:6.3,font:bold,color:white});
  front.drawText('Uyelik Turu',{x:63,y:62,size:5,font:regular,color:gray});
  front.drawText(pdfSafe(data.type),{x:91,y:62,size:6.3,font:bold,color:white});
  front.drawText('Gecerlilik',{x:63,y:50,size:5,font:regular,color:gray});
  front.drawText(pdfSafe(fmt(data.approvedAt))+' - '+pdfSafe(fmt(data.validUntil)),{x:91,y:50,size:5.4,font:regular,color:white});
  front.drawText('DAIMA DAHA',{x:12,y:16,size:8,font:bold,color:white});
  front.drawText('ILERI',{x:58,y:16,size:8,font:bold,color:red});

  const qr=await QRCode.toDataURL(data.verifyUrl,{margin:1,width:180,color:{dark:'#111111',light:'#ffffff'}});
  const qi=await pdf.embedPng(dataUrlToBytes(qr));
  front.drawRectangle({x:W-58,y:54,width:42,height:42,color:white});
  front.drawImage(qi,{x:W-55,y:57,width:36,height:36});
  front.drawText('QR ILE DOGRULA',{x:W-58,y:46,size:4.5,font:bold,color:white});
  front.drawText('KARAGUMRUK',{x:W-59,y:24,size:6.5,font:bold,color:white});
  front.drawText('HENTBOL SPOR KULUBU',{x:W-59,y:17,size:4.2,font:bold,color:white});

  const back=pdf.addPage([W,H]);
  back.drawRectangle({x:0,y:0,width:W,height:H,color:black});
  back.drawRectangle({x:0,y:0,width:W,height:4,color:red});
  back.drawRectangle({x:0,y:H-4,width:W,height:4,color:red});
  // diagonal red accents
  back.drawRectangle({x:0,y:0,width:8,height:H,color:rgb(.25,.01,.015),opacity:.7});
  back.drawRectangle({x:W-18,y:0,width:18,height:H,color:rgb(.22,.01,.015),opacity:.75});
  back.drawRectangle({x:W-15,y:0,width:4,height:H,color:red});
  if(logo) back.drawImage(logo,{x:(W-82)/2,y:(H-82)/2+8,width:82,height:82});
  back.drawText('DAIMA',{x:W-54,y:37,size:9,font:bold,color:white});
  back.drawText('DAHA',{x:W-54,y:27,size:9,font:bold,color:white});
  back.drawText('ILERI',{x:W-54,y:16,size:10,font:bold,color:red});
  back.drawText('www.karagumrukhentbol.org',{x:W/2-38,y:10,size:5.3,font:bold,color:white});
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