import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const safe = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char] || char));

const handLabel = (value: string, lang: string) => ({
  right: lang === 'en' ? 'Right' : 'Sağ',
  left: lang === 'en' ? 'Left' : 'Sol',
  both: lang === 'en' ? 'Both' : 'Her İki El',
}[value] || value || '—');

const genderLabel = (value: string, lang: string) => ({
  male: lang === 'en' ? 'Male' : 'Erkek',
  female: lang === 'en' ? 'Female' : 'Kadın',
}[value] || value || '—');

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);

  try {
    const data = await req.json();
    const lang = data.lang === 'en' ? 'en' : 'tr';

    const application = {
      full_name: String(data.full_name || '').trim(),
      email: String(data.email || '').trim().toLowerCase(),
      phone: String(data.phone || '').trim(),
      age_group: String(data.age_group || '').trim(),
      birth_date: String(data.birth_date || '').trim(),
      height_cm: Number(data.height_cm),
      dominant_hand: String(data.dominant_hand || '').trim(),
      gender: String(data.gender || '').trim(),
      status: 'new',
    };

    if (!application.full_name || !application.email || !application.phone || !application.age_group) {
      throw new Error('Required application information is missing.');
    }
    if (!application.birth_date || !Number.isFinite(application.height_cm) || application.height_cm < 80 || application.height_cm > 230) {
      throw new Error('Birth date or height is invalid.');
    }
    if (!['right', 'left', 'both'].includes(application.dominant_hand)) throw new Error('Dominant hand is invalid.');
    if (!['male', 'female'].includes(application.gender)) throw new Error('Gender is invalid.');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM_EMAIL');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase server secrets are missing.');
    if (!apiKey || !from) throw new Error('Resend secrets are missing.');

    const adminDb = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: inserted, error: insertError } = await adminDb
      .from('academy_applications')
      .insert(application)
      .select('id, created_at')
      .single();

    if (insertError) throw new Error(`Application could not be saved: ${insertError.message}`);

    const subject = lang === 'en'
      ? 'Thank you for choosing Karagümrük Handball Academy'
      : 'Karagümrük Hentbol Akademisi’ni seçtiğiniz için teşekkürler';

    const intro = lang === 'en'
      ? 'We have received your application to Karagümrük Handball Academy successfully.'
      : 'Karagümrük Hentbol Akademisi başvurunuzu başarıyla aldık.';

    const review = lang === 'en'
      ? 'Our technical team will review your information and the club will contact you when necessary.'
      : 'Teknik ekibimiz bilgilerinizi değerlendirecek ve gerekli olduğunda kulübümüz sizinle iletişime geçecektir.';

    const html = `<!doctype html><html><body style="margin:0;background:#161616;font-family:Arial,sans-serif;color:#fff">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#161616;padding:24px 10px"><tr><td align="center">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#0d0d0d;border:1px solid #333;border-radius:18px;overflow:hidden">
        <tr><td style="padding:30px;text-align:center;border-bottom:5px solid #d50909"><img src="https://karagumrukhentbol.org/assets/club-logo.png" width="105" alt="Karagümrük Hentbol"><h1 style="margin:16px 0 0;font-size:34px">KARAGÜMRÜK HENTBOL</h1><p style="margin:8px 0;color:#e34b3f;font-weight:bold">${lang === 'en' ? 'ACADEMY APPLICATION' : 'AKADEMİ BAŞVURUSU'}</p></td></tr>
        <tr><td style="padding:34px"><h2 style="font-size:31px;margin:0 0 20px">${lang === 'en' ? 'Thank you, ' : 'Teşekkürler, '}${safe(application.full_name)}!</h2><p style="font-size:19px;line-height:1.7;color:#ddd">${intro}</p><p style="font-size:18px;line-height:1.7;color:#bbb">${review}</p>
          <table width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#191919;border-radius:12px;border:1px solid #333">
            <tr><td style="padding:14px;color:#999">${lang === 'en' ? 'Age Group' : 'Yaş Grubu'}</td><td style="padding:14px;text-align:right;font-weight:bold">${safe(application.age_group)}</td></tr>
            <tr><td style="padding:14px;color:#999">${lang === 'en' ? 'Date of Birth' : 'Doğum Tarihi'}</td><td style="padding:14px;text-align:right;font-weight:bold">${safe(application.birth_date)}</td></tr>
            <tr><td style="padding:14px;color:#999">${lang === 'en' ? 'Height' : 'Boy'}</td><td style="padding:14px;text-align:right;font-weight:bold">${safe(application.height_cm)} cm</td></tr>
            <tr><td style="padding:14px;color:#999">${lang === 'en' ? 'Dominant Hand' : 'Kullandığı El'}</td><td style="padding:14px;text-align:right;font-weight:bold">${safe(handLabel(application.dominant_hand, lang))}</td></tr>
            <tr><td style="padding:14px;color:#999">${lang === 'en' ? 'Gender' : 'Cinsiyet'}</td><td style="padding:14px;text-align:right;font-weight:bold">${safe(genderLabel(application.gender, lang))}</td></tr>
          </table>
          <p style="font-size:16px;color:#999">${lang === 'en' ? 'Please keep this email for your records.' : 'Lütfen bu e-postayı kayıtlarınız için saklayınız.'}</p>
          <div style="margin-top:36px"><div style="font-family:cursive;font-size:35px">Raouf Tarek</div><strong>Raouf Tarek</strong><br><span style="color:#bbb">Kulüp Başkanı / Club President</span></div>
        </td></tr>
        <tr><td style="padding:20px;text-align:center;background:#202020;color:#9ebdff">info@karagumrukhentbol.org · karagumrukhentbol.org</td></tr>
      </table></td></tr></table></body></html>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [application.email], subject, html }),
    });

    const emailResult = await emailResponse.json();
    if (!emailResponse.ok) {
      console.error('Academy email failed after application insert:', emailResult);
      return jsonResponse({
        ok: false,
        saved: true,
        application_id: inserted?.id,
        error: emailResult?.message || 'Application was saved, but email could not be sent.',
      }, 502);
    }

    return jsonResponse({ ok: true, saved: true, application_id: inserted?.id, email: emailResult });
  } catch (error) {
    console.error('Academy application error:', error);
    return jsonResponse({ ok: false, saved: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
});