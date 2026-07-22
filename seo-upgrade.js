(()=>{
  const SITE='https://karagumrukhentbol.org/';
  const TITLE='Karagümrük Hentbol Spor Kulübü | Resmi Web Sitesi';
  const DESCRIPTION='Karagümrük Hentbol Spor Kulübü resmi web sitesi. Takım, maçlar, haberler, akademi, üyelik, mağaza ve kulüp duyuruları.';
  const IMAGE=SITE+'assets/club-logo.png';

  document.title=TITLE;

  const upsertMeta=(selector,attrs)=>{
    let el=document.head.querySelector(selector);
    if(!el){el=document.createElement('meta');document.head.appendChild(el);}
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  };
  const upsertLink=(rel,href)=>{
    let el=document.head.querySelector(`link[rel="${rel}"]`);
    if(!el){el=document.createElement('link');el.rel=rel;document.head.appendChild(el);}
    el.href=href;
  };

  upsertMeta('meta[name="description"]',{name:'description',content:DESCRIPTION});
  upsertMeta('meta[name="robots"]',{name:'robots',content:'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'});
  upsertMeta('meta[property="og:type"]',{property:'og:type',content:'website'});
  upsertMeta('meta[property="og:site_name"]',{property:'og:site_name',content:'Karagümrük Hentbol Spor Kulübü'});
  upsertMeta('meta[property="og:title"]',{property:'og:title',content:TITLE});
  upsertMeta('meta[property="og:description"]',{property:'og:description',content:DESCRIPTION});
  upsertMeta('meta[property="og:url"]',{property:'og:url',content:SITE});
  upsertMeta('meta[property="og:image"]',{property:'og:image',content:IMAGE});
  upsertMeta('meta[property="og:image:secure_url"]',{property:'og:image:secure_url',content:IMAGE});
  upsertMeta('meta[property="og:locale"]',{property:'og:locale',content:'tr_TR'});
  upsertMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
  upsertMeta('meta[name="twitter:title"]',{name:'twitter:title',content:TITLE});
  upsertMeta('meta[name="twitter:description"]',{name:'twitter:description',content:DESCRIPTION});
  upsertMeta('meta[name="twitter:image"]',{name:'twitter:image',content:IMAGE});
  upsertLink('canonical',SITE);
  upsertLink('manifest',SITE+'manifest.webmanifest');
  upsertLink('icon',IMAGE);

  const schema={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':['SportsOrganization','Organization'],
        '@id':SITE+'#organization',
        name:'Karagümrük Hentbol Spor Kulübü',
        alternateName:['Karagümrük Hentbol','Karagümrük Handball'],
        url:SITE,
        logo:{'@type':'ImageObject',url:IMAGE},
        image:IMAGE,
        sport:'Handball',
        foundingDate:'2017',
        email:'info@karagumrukhentbol.org',
        address:{'@type':'PostalAddress',addressLocality:'İstanbul',addressCountry:'TR'}
      },
      {
        '@type':'WebSite',
        '@id':SITE+'#website',
        url:SITE,
        name:'Karagümrük Hentbol Spor Kulübü',
        inLanguage:['tr-TR','en'],
        publisher:{'@id':SITE+'#organization'}
      },
      {
        '@type':'WebPage',
        '@id':SITE+'#webpage',
        url:SITE,
        name:TITLE,
        description:DESCRIPTION,
        isPartOf:{'@id':SITE+'#website'},
        about:{'@id':SITE+'#organization'},
        inLanguage:'tr-TR'
      }
    ]
  };
  let jsonLd=document.head.querySelector('script[data-kh-schema="home"]');
  if(!jsonLd){jsonLd=document.createElement('script');jsonLd.type='application/ld+json';jsonLd.dataset.khSchema='home';document.head.appendChild(jsonLd);}
  jsonLd.textContent=JSON.stringify(schema);
})();
