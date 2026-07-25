(() => {
  const heroVisual = document.querySelector('.hero-visual');
  if (!heroVisual) return;

  const style = document.createElement('style');
  style.textContent = `
    .hero-visual.hero-player-art{height:560px;filter:none;isolation:isolate;overflow:visible}
    .hero-visual.hero-player-art::before,.hero-visual.hero-player-art::after{display:none!important}
    .hero-player-art>.ball,.hero-player-art>.player-card,.hero-player-art>.partner-badge{display:none!important}
    .hero-player-picture{position:absolute;inset:18px -70px 10px -25px;width:calc(100% + 95px);height:calc(100% - 28px);object-fit:cover;object-position:center;border-radius:24px;box-shadow:0 32px 90px rgba(0,0,0,.78);border:1px solid rgba(255,255,255,.12);z-index:2}
    .hero-player-art::after{display:block!important;content:"";position:absolute;inset:18px -70px 10px -25px;border-radius:24px;z-index:3;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.78) 0%,rgba(0,0,0,.25) 24%,transparent 47%),linear-gradient(0deg,rgba(0,0,0,.38),transparent 45%)}
    @media(max-width:1000px){.hero-visual.hero-player-art{height:500px;max-width:760px}.hero-player-picture,.hero-player-art::after{inset:8px 0;width:100%;height:calc(100% - 16px)}}
    @media(max-width:620px){.hero-visual.hero-player-art{height:390px}.hero-player-picture,.hero-player-art::after{inset:6px 0;height:calc(100% - 12px);border-radius:18px}.hero-player-picture{object-position:58% center}}
  `;
  document.head.appendChild(style);

  fetch('assets/hero-player.webp?v=20260725-4', { cache: 'reload' })
    .then(response => {
      if (!response.ok) throw new Error(`Hero artwork could not be loaded (${response.status})`);
      return response.text();
    })
    .then(base64 => {
      const cleanBase64 = base64.replace(/\s+/g, '');
      const image = new Image();
      image.className = 'hero-player-picture';
      image.alt = 'Karagümrük Hentbol 77 numaralı oyuncu';
      image.decoding = 'async';
      image.onload = () => {
        heroVisual.classList.add('hero-player-art');
        heroVisual.appendChild(image);
      };
      image.onerror = () => console.error('Hero artwork data could not be decoded.');
      image.src = `data:image/webp;base64,${cleanBase64}`;
    })
    .catch(error => console.error(error));
})();