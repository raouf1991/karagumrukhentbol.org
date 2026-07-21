window.KH_SUPABASE = {
  url: 'https://ukhnlbqjmulasfvgiqgn.supabase.co',
  publishableKey: 'sb_publishable_nJDc_QBLF2IIr_we4PDJPQ_64YuLovu'
};

const isMainAdmin = /\/admin(?:\.html)?$/.test(location.pathname) || location.pathname.endsWith('/admin.html');

if (isMainAdmin) {
  const approvalScript = document.createElement('script');
  approvalScript.src = 'admin-membership-approval.js?v=20260720-membership-card2';
  approvalScript.defer = true;
  document.head.appendChild(approvalScript);

  const playerProfilesLinkScript = document.createElement('script');
  playerProfilesLinkScript.src = 'admin-player-profiles-link.js?v=20260721-1';
  playerProfilesLinkScript.defer = true;
  document.head.appendChild(playerProfilesLinkScript);

  const academyAdminScript = document.createElement('script');
  academyAdminScript.src = 'admin-academy.js?v=20260721-sync3';
  academyAdminScript.defer = true;
  document.head.appendChild(academyAdminScript);
} else if (location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) {
  const academyUpgradeScript = document.createElement('script');
  academyUpgradeScript.src = 'academy-upgrade.js?v=20260721-public-cors2';
  academyUpgradeScript.defer = true;
  document.head.appendChild(academyUpgradeScript);
}