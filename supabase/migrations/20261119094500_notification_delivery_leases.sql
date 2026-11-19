alter table public.outbound_emails add column delivery_lease_until timestamptz;
alter table public.outbound_pushes add column delivery_lease_until timestamptz;
