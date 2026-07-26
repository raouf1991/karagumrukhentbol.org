window.KH_SUPABASE = {
  url: 'https://ukhnlbqjmulasfvgiqgn.supabase.co',
  publishableKey: 'sb_publishable_nJDc_QBLF2IIr_we4PDJPQ_64YuLovu'
};

const isMainAdmin = /\/admin(?:\.html)?$/.test(location.pathname) || location.pathname.endsWith('/admin.html');

if (isMainAdmin) {
  const loadAdminScript = (src, marker) => {
    if (document.querySelector(`script[data-admin-loader="${marker}"]`)) return;
    const script = document.createElement('script');
    script.src = `${src}${src.includes('?') ? '&' : '?'}cb=20260724-edu4`;
    script.defer = true;
    script.dataset.adminLoader = marker;
    document.head.appendChild(script);
  };

  loadAdminScript('admin-membership-approval.js?v=20260720-membership-card2', 'membership-approval');
  loadAdminScript('admin-player-profiles-link.js?v=20260724-edu4', 'player-profiles');
  loadAdminScript('admin-academy.js?v=20260721-sync3', 'academy');
  loadAdminScript('admin-donations.js?v=20260721-3', 'donations');
  loadAdminScript('admin-tickets.js?v=20260724-edu4', 'tickets');
  loadAdminScript('admin-education.js?v=20260724-edu4', 'education');
} else {
  const performanceScript = document.createElement('script');
  performanceScript.src = 'performance-upgrade.js?v=20260722-1';
  performanceScript.defer = true;
  document.head.appendChild(performanceScript);

  const educationNavScript = document.createElement('script');
  educationNavScript.src = 'education-nav.js?v=20260724-1';
  educationNavScript.defer = true;
  document.head.appendChild(educationNavScript);

  if (location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) {
    const heroPlayerScript = document.createElement('script');
    heroPlayerScript.src = 'hero-player-loader.js?v=20260725-binary1';
    heroPlayerScript.defer = true;
    document.head.appendChild(heroPlayerScript);

    const contactUpgradeScript = document.createElement('script');
    contactUpgradeScript.src = 'contact-upgrade.js?v=20260726-3';
    contactUpgradeScript.defer = true;
    document.head.appendChild(contactUpgradeScript);

    const seoUpgradeScript = document.createElement('script');
    seoUpgradeScript.src = 'seo-upgrade.js?v=20260722-1';
    seoUpgradeScript.defer = true;
    document.head.appendChild(seoUpgradeScript);

    const academyUpgradeScript = document.createElement('script');
    academyUpgradeScript.src = 'academy-upgrade.js?v=20260721-public-cors2';
    academyUpgradeScript.defer = true;
    document.head.appendChild(academyUpgradeScript);

    const donationUpgradeScript = document.createElement('script');
    donationUpgradeScript.src = 'donation-upgrade.js?v=20260721-1';
    donationUpgradeScript.defer = true;
    document.head.appendChild(donationUpgradeScript);

    const ticketUpgradeScript = document.createElement('script');
    ticketUpgradeScript.src = 'tickets-upgrade.js?v=20260722-1';
    ticketUpgradeScript.defer = true;
    document.head.appendChild(ticketUpgradeScript);

    const newsUpgradeScript = document.createElement('script');
    newsUpgradeScript.src = 'news-upgrade.js?v=20260722-1';
    newsUpgradeScript.defer = true;
    document.head.appendChild(newsUpgradeScript);

    const staticNewsLinksScript = document.createElement('script');
    staticNewsLinksScript.src = 'static-news-links.js?v=20260722-1';
    staticNewsLinksScript.defer = true;
    document.head.appendChild(staticNewsLinksScript);
  }
}