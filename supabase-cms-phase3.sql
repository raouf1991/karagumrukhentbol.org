alter table public.site_settings
  add column if not exists hero_eyebrow_tr text,
  add column if not exists hero_eyebrow_en text,
  add column if not exists vision_tr text,
  add column if not exists vision_en text,
  add column if not exists mission_tr text,
  add column if not exists mission_en text,
  add column if not exists goals_tr text,
  add column if not exists goals_en text,
  add column if not exists academy_title_tr text,
  add column if not exists academy_title_en text,
  add column if not exists academy_text_tr text,
  add column if not exists academy_text_en text,
  add column if not exists membership_title_tr text,
  add column if not exists membership_title_en text,
  add column if not exists membership_text_tr text,
  add column if not exists membership_text_en text,
  add column if not exists membership_conditions_tr text,
  add column if not exists membership_conditions_en text,
  add column if not exists donation_title_tr text,
  add column if not exists donation_title_en text,
  add column if not exists donation_text_tr text,
  add column if not exists donation_text_en text,
  add column if not exists maps_url text;

update public.site_settings
set
  hero_eyebrow_tr = coalesce(hero_eyebrow_tr, 'Sahada kalp, tribünde güç'),
  hero_eyebrow_en = coalesce(hero_eyebrow_en, 'Heart on the court, strength in the stands'),
  academy_title_tr = coalesce(academy_title_tr, 'Karagümrük Hentbol Akademisi'),
  academy_title_en = coalesce(academy_title_en, 'Karagümrük Handball Academy'),
  membership_title_tr = coalesce(membership_title_tr, 'Üyelik'),
  membership_title_en = coalesce(membership_title_en, 'Membership'),
  donation_title_tr = coalesce(donation_title_tr, 'Kulübe Destek Ol'),
  donation_title_en = coalesce(donation_title_en, 'Support the Club')
where id = 1;