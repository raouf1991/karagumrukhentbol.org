(() => {
  'use strict';
  const addLink = () => {
    const nav = document.querySelector('.main-nav');
    if (!nav || nav.querySelector('a[href="egitim-merkezi.html"]')) return;
    const link = document.createElement('a');
    link.href = 'egitim-merkezi.html';
    link.textContent = 'Eğitim Merkezi';
    link.setAttribute('data-tr', 'Eğitim Merkezi');
    link.setAttribute('data-en', 'Education Center');
    const academyLink = nav.querySelector('a[href="#academy"], a[href="index.html#academy"]');
    if (academyLink?.nextSibling) nav.insertBefore(link, academyLink.nextSibling);
    else nav.appendChild(link);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLink);
  else addLink();
})();