(()=>{
  const NativeMutationObserver=window.MutationObserver;
  if(!NativeMutationObserver||window.__khMembershipDropdownFix)return;
  window.__khMembershipDropdownFix=true;

  window.MutationObserver=class extends NativeMutationObserver{
    observe(target,options={}){
      if(target?.id==='membershipList'){
        return super.observe(target,{...options,childList:true,subtree:false});
      }
      return super.observe(target,options);
    }
  };
})();
