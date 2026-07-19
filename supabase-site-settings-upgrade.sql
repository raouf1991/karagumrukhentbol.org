alter table public.site_settings
  add column if not exists club_title_tr text,
  add column if not exists club_title_en text,
  add column if not exists club_about_tr text,
  add column if not exists club_about_en text,
  add column if not exists founded_year text,
  add column if not exists club_slogan text,
  add column if not exists contact_phone text,
  add column if not exists contact_address text,
  add column if not exists whatsapp_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists youtube_url text,
  add column if not exists twitter_url text;

update public.site_settings
set
  club_title_tr = coalesce(club_title_tr, 'Karagümrük Ruhuyla'),
  club_title_en = coalesce(club_title_en, 'The Karagümrük Spirit'),
  club_about_tr = coalesce(club_about_tr, 'Kulübümüz, sporun birleştirici gücünü gençlere ulaştırmayı, disiplinli sporcular yetiştirmeyi ve hentbol kültürünü büyütmeyi hedefler.'),
  club_about_en = coalesce(club_about_en, 'Our club aims to bring the unifying power of sport to young people, develop disciplined athletes and grow handball culture.'),
  founded_year = coalesce(founded_year, '2017'),
  contact_address = coalesce(contact_address, 'İstanbul, Türkiye')
where id = 1;