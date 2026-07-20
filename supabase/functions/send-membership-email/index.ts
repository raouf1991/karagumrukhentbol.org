const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] as string));

function emailTemplate(name: string, lang: 'tr' | 'en') {
  const isTr = lang !== 'en';
  const title = isTr ? 'Üyelik Başvurunuz Alındı' : 'Membership Application Received';
  const greeting = isTr ? `Merhaba ${escapeHtml(name)},` : `Hello ${escapeHtml(name)},`;
  const message = isTr
    ? 'Karagümrük Hentbol Spor Kulübü üyelik başvurunuz başarıyla alınmıştır. Başvurunuz şu anda değerlendirme aşamasındadır.'
    : 'Your Karagümrük Handball Sports Club membership application has been received successfully and is currently under review.';
  const followUp = isTr
    ? 'Değerlendirme tamamlandığında sizinle e-posta veya telefon yoluyla iletişime geçeceğiz.'
    : 'We will contact you by email or phone when the review is complete.';
  const thanks = isTr ? 'İlginiz için teşekkür ederiz.' : 'Thank you for your interest.';

  return `<!doctype html>
<html lang="${isTr ? 'tr' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#171717">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 14px 45px rgba(0,0,0,.12)">
        <tr><td style="background:#111111;padding:26px;text-align:center;border-bottom:5px solid #d50909">
          <img src="https://karagumrukhentbol.org/assets/club-logo.png" width="92" height="92" alt="Karagümrük Hentbol" style="display:block;margin:0 auto 14px;border-radius:50%;background:#fff">
          <div style="font-size:23px;font-weight:800;color:#fff;letter-spacing:.5px">KARAGÜMRÜK HENTBOL</div>
        </td></tr>
        <tr><td style="padding:34px 34px 24px">
          <div style="display:inline-block;background:#fde8e8;color:#b70707;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.7px">${isTr ? 'Başvuru Durumu' : 'Application Status'}</div>
          <h1 style="margin:18px 0 20px;font-size:30px;line-height:1.15;color:#111">${title}</h1>
          <p style="font-size:17px;line-height:1.7;margin:0 0 16px">${greeting}</p>
          <p style="font-size:16px;line-height:1.75;margin:0 0 16px">${message}</p>
          <div style="margin:24px 0;padding:18px 20px;border-left:5px solid #d50909;background:#f8f8f8;border-radius:8px">
            <strong style="display:block;color:#d50909;margin-bottom:6px">${isTr ? 'Durum: Değerlendiriliyor' : 'Status: Under Review'}</strong>
            <span style="font-size:15px;line-height:1.6">${followUp}</span>
          </div>
          <p style="font-size:16px;line-height:1.7;margin:0">${thanks}</p>
        </td></tr>
        <tr><td style="padding:22px 34px;background:#111;color:#cfcfcf;font-size:13px;line-height:1.6;text-align:center">
          Karagümrük Hentbol Spor Kulübü<br>
          <a href="https://karagumrukhentbol.org" style="color:#fff;text-decoration:none">karagumrukhentbol.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Karagümrük Hentbol <membership@karagumrukhentbol.org>';
    const clubNotificationEmail = Deno.env.get('CLUB_NOTIFICATION_EMAIL');
    if (!resendApiKey) throw new Error('RESEND_API_KEY is not configured.');

    const body = await req.json();
    const name = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const reason = String(body.reason || '').trim();
    const lang: 'tr' | 'en' = body.lang === 'en' ? 'en' : 'tr';

    if (name.length < 2 || name.length > 120) throw new Error('Invalid name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Invalid email.');

    const subject = lang === 'tr'
      ? 'Karagümrük Hentbol Üyelik Başvurunuz Alındı'
      : 'Karagümrük Handball Membership Application Received';

    const messages = [{
      from: fromEmail,
      to: [email],
      subject,
      html: emailTemplate(name, lang),
    }];

    if (clubNotificationEmail) {
      messages.push({
        from: fromEmail,
        to: [clubNotificationEmail],
        subject: `Yeni üyelik başvurusu: ${name}`,
        html: `<h2>Yeni üyelik başvurusu</h2><p><strong>Ad:</strong> ${escapeHtml(name)}</p><p><strong>E-posta:</strong> ${escapeHtml(email)}</p><p><strong>Telefon:</strong> ${escapeHtml(phone)}</p><p><strong>Neden:</strong><br>${escapeHtml(reason).replace(/\n/g, '<br>')}</p>`,
      });
    }

    const results = [];
    for (const message of messages) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Resend request failed.');
      results.push(data);
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
