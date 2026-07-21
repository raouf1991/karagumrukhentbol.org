create extension if not exists pg_net with schema extensions;

create or replace function public.send_academy_application_email_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://ukhnlbqjmulasfvgiqgn.supabase.co/functions/v1/sent-academy-application-email',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'full_name', new.full_name,
      'email', new.email,
      'phone', new.phone,
      'age_group', new.age_group,
      'birth_date', new.birth_date,
      'height_cm', new.height_cm,
      'dominant_hand', new.dominant_hand,
      'gender', new.gender,
      'lang', 'tr',
      'email_only', true
    )
  );
  return new;
end;
$$;

drop trigger if exists academy_application_confirmation_email on public.academy_applications;

create trigger academy_application_confirmation_email
after insert on public.academy_applications
for each row
execute function public.send_academy_application_email_trigger();
