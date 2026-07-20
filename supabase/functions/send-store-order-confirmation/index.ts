const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c] || c));

const money = (value: unknown) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY',
}).format(Number(value || 0));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM_EMAIL') || 'Karagümrük Hentbol <info@karagumrukhentbol.org>';
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

    const body = await req.json();
    const orderNumber = String(body.order_number || '').trim();
    const name = String(body.customer_name || '').trim();
    const email = String(body.customer_email || '').trim();
    const phone = String(body.customer_phone || '').trim();
    const address = String(body.delivery_address || '').trim();
    const city = String(body.city || '').trim();
    const paymentMethod = String(body.payment_method || 'bank_transfer');
    const note = String(body.note || '').trim();
    const total = Number(body.total_amount || 0);
    const items = Array.isArray(body.items) ? body.items : [];

    if (!orderNumber || !name || !email || !items.length) throw new Error('Missing order data.');

    const paymentLabels: Record<string, string> = {
      bank_transfer: 'Banka Havalesi',
      cash_on_delivery: 'Kapıda Ödeme',
      whatsapp: 'WhatsApp ile Onay',
    };

    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e5e5"><strong>${esc(item.name)}</strong><br><small style="color:#666">${esc([item.size, item.color].filter(Boolean).join(' · '))}</small></td>
        <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:center">${Number(item.quantity || 1)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:right">${money(item.line_total)}</td>
      </tr>`).join('');

    const html = `<!doctype html><html><body style="margin:0;background:#ececec;font-family:Arial,sans-serif;color:#171717">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:25px 10px"><tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#fff;border-radius:18px;overflow:hidden">
          <tr><td style="background:#111;padding:28px;text-align:center;border-bottom:5px solid #d50909">
            <img src="https://karagumrukhentbol.org/assets/club-logo.png" width="90" alt="Karagümrük Hentbol">
            <h1 style="color:#fff;margin:12px 0 0">KARAGÜMRÜK HENTBOL</h1>
          </td></tr>
          <tr><td style="padding:34px">
            <div style="color:#c20d09;font-weight:800">SİPARİŞ ONAYI</div>
            <h2 style="font-size:30px;margin-bottom:12px">Siparişinizi aldık, teşekkür ederiz!</h2>
            <p style="font-size:17px;line-height:1.7">Merhaba <strong>${esc(name)}</strong>,</p>
            <p style="font-size:16px;line-height:1.7">Kulübümüze verdiğiniz destek ve katkı için teşekkür ederiz. Siparişiniz başarıyla alınmış ve hazırlık sürecine aktarılmıştır.</p>
            <div style="background:#111;color:#fff;border-radius:14px;padding:20px;margin:24px 0">
              <div style="font-size:12px;color:#aaa">SİPARİŞ NUMARASI</div>
              <div style="font-size:24px;font-weight:800;margin-top:5px">${esc(orderNumber)}</div>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:12px;overflow:hidden">
              <tr style="background:#f4f4f4"><th style="padding:12px;text-align:left">Ürün</th><th style="padding:12px">Adet</th><th style="padding:12px;text-align:right">Tutar</th></tr>
              ${itemRows}
              <tr><td colspan="2" style="padding:15px;text-align:right;font-weight:800">Toplam</td><td style="padding:15px;text-align:right;font-weight:900;color:#c20d09">${money(total)}</td></tr>
            </table>
            <div style="margin-top:24px;background:#f7f7f7;border-left:4px solid #d50909;padding:16px;line-height:1.7">
              <strong>Ödeme:</strong> ${esc(paymentLabels[paymentMethod] || paymentMethod)}<br>
              <strong>Telefon:</strong> ${esc(phone)}<br>
              <strong>Teslimat adresi:</strong> ${esc(address)}${city ? ', ' + esc(city) : ''}${note ? `<br><strong>Not:</strong> ${esc(note)}` : ''}
            </div>
            <p style="font-size:16px;line-height:1.7;margin-top:24px">Siparişinizin durumu değiştikçe sizinle iletişime geçeceğiz. Karagümrük Hentbol ailesine verdiğiniz destek bizim için çok değerlidir.</p>
            <div style="margin-top:38px"><div style="font-family:cursive;font-size:34px">Raouf Tarek</div><strong>Raouf Tarek</strong><br>Kulüp Başkanı / Club President</div>
          </td></tr>
          <tr><td style="background:#111;color:#ddd;padding:22px;text-align:center">info@karagumrukhentbol.org · karagumrukhentbol.org</td></tr>
        </table>
      </td></tr></table>
    </body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Siparişiniz Alındı - ${orderNumber}`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Resend request failed.');

    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
