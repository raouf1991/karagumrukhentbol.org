create table if not exists public.tv_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  mode text not null default 'offline' check (mode in ('offline','recorded','live')),
  channel_title_tr text default 'Karagümrük Hentbol TV',
  programme_title_tr text,
  description_tr text,
  video_url text,
  poster_url text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  autoplay boolean not null default true,
  loop_video boolean not null default false,
  sync_as_live boolean not null default true,
  show_controls boolean not null default true,
  offline_title_tr text default 'Şu anda yayın bulunmuyor',
  offline_message_tr text default 'Yeni yayın programı yakında açıklanacaktır.',
  schedule_note_tr text default 'Yayın bilgileri yönetim panelinden güncellenir.',
  updated_at timestamptz not null default now()
);

alter table public.tv_settings enable row level security;

drop policy if exists "Public can view TV settings" on public.tv_settings;
create policy "Public can view TV settings"
on public.tv_settings for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can manage TV settings" on public.tv_settings;
create policy "Authenticated users can manage TV settings"
on public.tv_settings for all
to authenticated
using (true)
with check (true);

insert into public.tv_settings (id)
values (1)
on conflict (id) do nothing;
