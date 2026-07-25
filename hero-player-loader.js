(() => {
  const heroVisual = document.querySelector('.hero-visual');
  if (!heroVisual) return;

  const style = document.createElement('style');
  style.textContent = `
    .hero-visual.hero-player-art{height:560px;filter:none;isolation:isolate;overflow:visible}
    .hero-visual.hero-player-art::before,.hero-visual.hero-player-art::after{display:none!important}
    .hero-player-art>.ball,.hero-player-art>.player-card,.hero-player-art>.partner-badge{display:none!important}
    .hero-player-picture{position:absolute;inset:18px -70px 10px -25px;width:calc(100% + 95px);height:calc(100% - 28px);object-fit:cover;object-position:center;border:0;border-radius:0;box-shadow:none;z-index:2}
    @media(max-width:1000px){.hero-visual.hero-player-art{height:500px;max-width:760px}.hero-player-picture{inset:8px 0;width:100%;height:calc(100% - 16px)}}
    @media(max-width:620px){.hero-visual.hero-player-art{height:390px}.hero-player-picture{inset:6px 0;width:100%;height:calc(100% - 12px);object-position:58% center}}
  `;
  document.head.appendChild(style);

  const image = new Image();
  image.className = 'hero-player-picture';
  image.alt = 'Karagümrük Hentbol 77 numaralı oyuncu';
  image.decoding = 'async';
  image.onload = () => {
    heroVisual.classList.add('hero-player-art');
    heroVisual.appendChild(image);
  };
  image.onerror = () => console.error('Final hero player artwork could not be loaded.');
  image.src = 'assets/hero-player-final.svg?v=20260725-final2';
})();