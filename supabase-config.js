window.KH_SUPABASE = {
  url: 'https://ukhnlbqjmulasfvgiqgn.supabase.co',
  publishableKey: 'sb_publishable_nJDc_QBLF2IIr_we4PDJPQ_64YuLovu'
};

if (/\/admin(?:\.html)?$/.test(location.pathname) || location.pathname.endsWith('/admin.html')) {
  const approvalScript = document.createElement('script');
  approvalScript.src = 'admin-membership-approval.js?v=20260720-membership-card2';
  approvalScript.defer = true;
  document.head.appendChild(approvalScript);
}
