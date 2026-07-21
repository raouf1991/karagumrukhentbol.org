(() => {
  const cfg = window.KH_SUPABASE || {};
  let academyDb = null;

  const tr = () => (localStorage.getItem('siteLang') || 'tr') === 'tr';
  const text = (turkish, english) => tr() ? turkish : english;

  function fieldHtml() {
    return `
      <label style="display:block;font-weight:700;margin:4px 0 2px" data-tr="Doğum Tarihi" data-en="Date of Birth">Doğum Tarihi</label>
      <input name="birth_date" type="date" required>
      <input name="height_cm" type="number" min="80" max="230" step="1" required placeholder="Boy (cm) / Height (cm)">
      <select name="dominant_hand" required>
        <option value="">Kullandığı El / Dominant Hand</option>
        <option value="right">Sağ / Right</option>
        <option value="left">Sol / Left</option>
        <option value="both">Her İki El / Both</option>
      </select>
      <select name="gender" required>
        <option value="">Cinsiyet / Gender</option>
        <option value="male">Erkek / Male</option>
        <option value="female">Kadın / Female</option>
      </select>`;
  }

  function prepareForm(form) {
    if (!form || form.dataset.academyUpgraded === '1') return;
    form.dataset.academyUpgraded = '1';
    const controls = form.querySelectorAll('input, select');
    if (controls[0]) controls[0].name = 'full_name';
    if (controls[1]) controls[1].name = 'email';
    if (controls[2]) controls[2].name = 'phone';
    if (controls[3]) controls[3].name = 'age_group';
    form.querySelector('button[type="submit"]')?.insertAdjacentHTML('beforebegin', fieldHtml());

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!academyDb) return alert(text('Bağlantı hazırlanıyor, tekrar deneyin.', 'Connection is being prepared, please try again.'));
      const button = form.querySelector('button[type="submit"]');
      const original = button?.textContent || '';
      if (button) { button.disabled = true; button.textContent = text('Gönderiliyor...', 'Sending...'); }
      try {
        const fd = new FormData(form);
        const payload = {
          full_name: String(fd.get('full_name') || '').trim(),
          email: String(fd.get('email') || '').trim().toLowerCase(),
          phone: String(fd.get('phone') || '').trim(),
          age_group: String(fd.get('age_group') || '').trim(),
          birth_date: String(fd.get('birth_date') || ''),
          height_cm: Number(fd.get('height_cm')),
          dominant_hand: String(fd.get('dominant_hand') || ''),
          gender: String(fd.get('gender') || ''),
          status: 'new'
        };

        // Do not request the inserted row back here. Public applicants have INSERT permission,
        // but not SELECT permission, and requesting RETURNING data causes an RLS failure.
        const { error } = await academyDb.from('academy_applications').insert(payload);
        if (error) throw error;

        const { error: mailError } = await academyDb.functions.invoke('sent-academy-application-email', {
          body: { ...payload, lang: tr() ? 'tr' : 'en' }
        });

        form.reset();
        if (mailError) {
          console.error('Academy confirmation email failed:', mailError);
          alert(text('Başvurunuz alındı ancak teşekkür e-postası gönderilemedi.', 'Your application was received, but the thank-you email could not be sent.'));
        } else {
          alert(text('Başvurunuz alındı. E-postanıza teşekkür mesajı gönderildi.', 'Your application was received. A thank-you email was sent to you.'));
        }
      } catch (error) {
        alert(text('Başvuru gönderilemedi: ', 'Application could not be sent: ') + (error?.message || String(error)));
      } finally {
        if (button) { button.disabled = false; button.textContent = original; }
      }
    }, true);
  }

  function start(attempt = 0) {
    const form = document.getElementById('academyForm');
    if (!form || !cfg.url || !cfg.publishableKey) return;
    if (!window.supabase) { if (attempt < 40) setTimeout(() => start(attempt + 1), 250); return; }
    academyDb = window.supabase.createClient(cfg.url, cfg.publishableKey);
    prepareForm(form);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => start(), { once: true });
  else start();
})();