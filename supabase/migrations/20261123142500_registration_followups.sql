create table if not exists public.registration_followups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  participant_type text not null,
  updated_at timestamptz not null default now()
);

alter table public.registration_followups enable row level security;
revoke all on public.registration_followups from anon, authenticated;
grant select, insert, update, delete on public.registration_followups to service_role;

create unique index if not exists outbound_emails_registration_reminder_once
  on public.outbound_emails (related_id)
  where kind = 'registration_followup' and status in ('queued', 'sent');
