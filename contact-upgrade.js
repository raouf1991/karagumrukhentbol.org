(() => {
  const contactSection = document.querySelector('#contact');
  if (!contactSection) return;

  const contactGrid = contactSection.querySelector('.contact-grid');
  const infoColumn = contactGrid?.firstElementChild;
  if (!infoColumn) return;

  const icon = (name) => {
    const icons = {
      mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
      phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.8 10 7.5 8.4 9.2c1.2 2.4 3 4.2 5.4 5.4l1.7-1.6 3.7 2.8-1 4c-.2.8-1 1.3-1.8 1.2C9.2 20 4 14.8 3 7.6c-.1-.8.4-1.6 1.2-1.8l3-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.4" cy="6.7" r="1" fill="currentColor"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4.2c-.8-.1-1.9-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.5V12H5v4h3.5v8h4.3v-8h3.6l.6-4h-4.2V9.9c0-1.2.4-1.9 1.2-1.9Z" fill="currentColor"/></svg>'
    };
    return icons[name] || '';
  };

  infoColumn.innerHTML = `
    <span class="section-kicker" data-tr="Bize ulaşın" data-en="Get in touch">Bize ulaşın</span>
    <h2 data-tr="İletişim" data-en="Contact">İletişim</h2>
    <div class="contact-links-modern">
      <a class="contact-item" href="mailto:info@karagumrukhentbol.org">
        <span class="contact-icon">${icon('mail')}</span>
        <span><small data-tr="E-posta" data-en="Email">E-posta</small><strong>info@karagumrukhentbol.org</strong></span>
      </a>
      <a class="contact-item" href="https://www.google.com/maps/search/?api=1&query=Cerrahpaşa+Mahallesi+Hekimoğlu+Ali+Paşa+Caddesi+No+53A+Fatih+İstanbul" target="_blank" rel="noopener noreferrer">
        <span class="contact-icon">${icon('map')}</span>
        <span><small data-tr="Adres" data-en="Address">Adres</small><strong>Cerrahpaşa Mah. Hekimoğlu Ali Paşa Cad. No: 53A, Fatih / İstanbul</strong></span>
      </a>
      <a class="contact-item" href="tel:+905444555303">
        <span class="contact-icon">${icon('phone')}</span>
        <span><small data-tr="Telefon" data-en="Phone">Telefon</small><strong>0544 455 53 03</strong></span>
      </a>
    </div>
    <div class="social-links-modern" aria-label="Sosyal medya bağlantıları">
      <a href="https://www.instagram.com/karagumrukhentbol/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${icon('instagram')}<span>Instagram</span></a>
      <a href="https://www.facebook.com/karagumrukhandball/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">${icon('facebook')}<span>Facebook</span></a>
    </div>
  `;

  const removeLegacyDetails = () => {
    infoColumn.querySelectorAll('.contact-details').forEach(el => el.remove());
    infoColumn.querySelectorAll(':scope > p').forEach(el => el.remove());
  };

  removeLegacyDetails();
  new MutationObserver(removeLegacyDetails).observe(infoColumn, { childList: true });

  const style = document.createElement('style');
  style.textContent = `
    #contact .contact-grid>div:first-child>p,
    #contact .contact-grid>div:first-child>.contact-details{display:none!important}
    .contact-links-modern{display:grid;gap:14px;margin-top:24px}
    .contact-item{display:flex;align-items:center;gap:14px;padding:15px 16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);text-decoration:none;color:#fff;border-radius:14px;transition:.22s ease}
    .contact-item:hover{transform:translateX(5px);border-color:rgba(239,55,35,.7);background:rgba(239,55,35,.08)}
    .contact-icon{width:46px;height:46px;display:grid;place-items:center;flex:0 0 46px;border-radius:12px;background:linear-gradient(135deg,#ef3723,#8f170e);box-shadow:0 10px 28px rgba(239,55,35,.25)}
    .contact-icon svg{width:24px;height:24px}
    .contact-item small{display:block;color:#ef6a5b;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
    .contact-item strong{display:block;color:#fff;font-size:15px;line-height:1.45;overflow-wrap:anywhere}
    .social-links-modern{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}
    .social-links-modern a{display:inline-flex;align-items:center;gap:9px;padding:11px 15px;border-radius:12px;color:#fff;text-decoration:none;font-weight:800;border:1px solid rgba(255,255,255,.12);background:#111820;transition:.22s ease}
    .social-links-modern a:hover{transform:translateY(-3px);border-color:#ef3723;background:#1a2028}
    .social-links-modern svg{width:21px;height:21px;color:#ef3723}
    @media(max-width:620px){.contact-item{align-items:flex-start}.contact-icon{width:42px;height:42px;flex-basis:42px}.social-links-modern a{flex:1;justify-content:center}}
  `;
  document.head.appendChild(style);
})();