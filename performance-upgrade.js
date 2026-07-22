(()=>{
  const isAdmin=/\/admin(?:\.html)?$/.test(location.pathname)||location.pathname.endsWith('/admin.html');
  if(isAdmin)return;

  const optimizeImage=(img,index=0)=>{
    if(!img)return;
    img.decoding='async';
    if(index>1&&!img.hasAttribute('loading'))img.loading='lazy';
    if(index<=1&&!img.hasAttribute('fetchpriority'))img.fetchPriority='high';
    if(!img.hasAttribute('referrerpolicy')&&/^https?:\/\//.test(img.currentSrc||img.src||''))img.referrerPolicy='no-referrer-when-downgrade';
  };

  const optimizeAll=()=>{
    document.querySelectorAll('img').forEach((img,index)=>optimizeImage(img,index));
    document.querySelectorAll('iframe').forEach(frame=>{
      if(!frame.hasAttribute('loading'))frame.loading='lazy';
      frame.referrerPolicy='strict-origin-when-cross-origin';
    });
  };

  if('MutationObserver'in window){
    const observer=new MutationObserver(records=>{
      records.forEach(record=>record.addedNodes.forEach(node=>{
        if(node.nodeType!==1)return;
        if(node.matches?.('img'))optimizeImage(node,3);
        node.querySelectorAll?.('img').forEach(img=>optimizeImage(img,3));
        if(node.matches?.('iframe')&&!node.hasAttribute('loading'))node.loading='lazy';
      }));
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  const run=()=>{
    optimizeAll();
    document.documentElement.classList.add('kh-performance-ready');
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();

  if('requestIdleCallback'in window){
    requestIdleCallback(()=>{
      document.querySelectorAll('link[rel="preconnect"]').forEach(link=>link.crossOrigin='anonymous');
    },{timeout:1500});
  }
})();
