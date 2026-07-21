(() => {
  const cfg = window.KH_SUPABASE || {};

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

  async function submitApplication(payload) {
    const response = await fetch(`${cfg.url}/functions/v1/sent-academy-application-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.publishableKey,
        Authorization: `Bearer ${cfg.publishableKey}`,
      },
      body: JSON.stringify({ ...payload, lang: tr() ? 'tr' : 'en' }),
    });

    let result = null;
    try { result = await response.json(); } catch (_) {}

    if (!response.ok || !result?.ok) {
      const error = new Error(result?.error || `Application service failed (${response.status})`);
      error.saved = Boolean(result?.saved);
      throw error;
    }

    return result;
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

      if (!cfg.url || !cfg.publishableKey) {
        return alert(text('Bağlantı hazırlanıyor, tekrar deneyin.', 'Connection is being prepared, please try again.'));
      }

      const button = form.querySelector('button[type="submit"]');
      const original = button?.textContent || '';
      if (button) {
        button.disabled = true;
        button.textContent = text('Gönderiliyor...', 'Sending...');
      }

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
        };

        await submitApplication(payload);
        form.reset();
        alert(text(
          'Başvurunuz alındı. E-postanıza teşekkür mesajı gönderildi.',
          'Your application was received. A thank-you email was sent to you.'
        ));
      } catch (error) {
        console.error('Academy application failed:', error);
        form.reset();
        if (error?.saved) {
          alert(text(
            'Başvurunuz kaydedildi ancak teşekkür e-postası gönderilemedi: ',
            'Your application was saved, but the thank-you email could not be sent: '
          ) + (error?.message || String(error)));
        } else {
          alert(text('Başvuru gönderilemedi: ', 'Application could not be sent: ') + (error?.message || String(error)));
        }
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = original;
        }
      }
    }, true);
  }

  function start() {
    const form = document.getElementById('academyForm');
    if (!form) return;
    prepareForm(form);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();