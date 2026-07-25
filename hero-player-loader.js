(() => {
  const heroVisual = document.querySelector('.hero-visual');
  if (!heroVisual) return;

  const style = document.createElement('style');
  style.textContent = `
    .hero-visual.hero-player-art{height:560px;filter:none;isolation:isolate;overflow:hidden}
    .hero-visual.hero-player-art::before,.hero-visual.hero-player-art::after{display:none!important}
    .hero-player-art>.ball,.hero-player-art>.player-card,.hero-player-art>.partner-badge{display:none!important}
    .hero-player-picture{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;border:0;border-radius:0;box-shadow:none;z-index:2}
    @media(max-width:1000px){.hero-visual.hero-player-art{height:500px;max-width:760px}}
    @media(max-width:620px){.hero-visual.hero-player-art{height:390px}.hero-player-picture{object-position:55% center}}
  `;
  document.head.appendChild(style);

  const image = new Image();
  image.className = 'hero-player-picture';
  image.alt = 'Karagümrük Hentbol oyuncusu';
  image.decoding = 'async';
  image.onload = () => {
    heroVisual.querySelectorAll('.ball,.player-card,.partner-badge').forEach(element => element.remove());
    heroVisual.classList.add('hero-player-art');
    heroVisual.appendChild(image);
  };
  image.onerror = () => console.error('Homepage player image could not be loaded.');
  image.src = 'assets/hero-player-real.jpg?v=20260725-binary1';
})();