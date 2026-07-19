alter table public.matches
  add column if not exists opponent_logo_url text,
  add column if not exists ticket_url text;
