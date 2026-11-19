alter table public.connections add column last_reminded_at timestamptz;

create policy connections_recipient_accepted on public.connections
for select to authenticated
using (addressee_id = (select auth.uid()) and status = 'accepted');

CREATE OR REPLACE FUNCTION public.member_directory(search text DEFAULT NULL::text, participant text DEFAULT NULL::text, member_country text DEFAULT NULL::text, only_ids uuid[] DEFAULT NULL::uuid[], max_rows integer DEFAULT 60)
 RETURNS TABLE(id uuid, full_name text, job_title text, participant_type text, country text, city text, organisation text, is_following boolean, connection_status text, is_staff boolean, avatar_url text, is_verified boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare viewer uuid := auth.uid();
begin
  if viewer is null then raise exception 'Authentication required'; end if;
  if not (private.is_verified() or private.is_staff_role()) then raise exception 'An active subscription is required to browse members'; end if;

  return query
  select
    p.id,p.full_name,p.job_title,
    case
      when p.system_role in ('admin'::public.system_role,'super_admin'::public.system_role) then
        case
          when exists(select 1 from public.memberships mm where mm.user_id=p.id and mm.status='active'::public.membership_status and mm.membership_type_code='wtca') then 'wtc_association_member'
          else 'wtc_accra_member'
        end
      else coalesce(p.participant_type,p.requested_participant_type)::text
    end,
    p.country,p.city,
    coalesce(
      (select o.name from public.organization_members om join public.organizations o on o.id=om.organization_id where om.user_id=p.id order by om.created_at limit 1),
      case when p.system_role <> 'user'::public.system_role then 'World Trade Centre Accra' end
    ),
    exists(select 1 from public.follows f where f.follower_id=viewer and f.following_id=p.id),
    (select c.status::text from public.connections c where ((c.requester_id=viewer and c.addressee_id=p.id) or (c.addressee_id=viewer and c.requester_id=p.id and (c.staff_approved_at is not null or c.status='accepted'))) order by case c.status when 'accepted' then 3 when 'pending' then 2 else 1 end desc, c.updated_at desc, c.id limit 1),
    case when p.system_role in ('admin'::public.system_role,'super_admin'::public.system_role) then false else p.system_role <> 'user'::public.system_role end,
    p.avatar_url,
    p.verification_status='verified'::public.verification_status
  from public.profiles p
  where p.id<>viewer
    and private.is_participant(p.id)
    and (
      p.system_role not in ('admin'::public.system_role,'super_admin'::public.system_role)
      or exists(
        select 1 from public.memberships mm
        where mm.user_id=p.id and mm.status='active'::public.membership_status
          and mm.membership_type_code in ('wtc_accra','wtca')
      )
    )
    and (only_ids is null or p.id=any(only_ids))
    and (search is null or btrim(search)='' or p.full_name ilike '%'||btrim(search)||'%')
    and (
      participant is null or btrim(participant)=''
      or case
        when p.system_role in ('admin'::public.system_role,'super_admin'::public.system_role) then
          case when exists(select 1 from public.memberships mm where mm.user_id=p.id and mm.status='active'::public.membership_status and mm.membership_type_code='wtca')
            then 'wtc_association_member' else 'wtc_accra_member' end
        else coalesce(p.participant_type,p.requested_participant_type)::text
      end = participant
    )
    and (member_country is null or btrim(member_country)='' or p.country ilike '%'||btrim(member_country)||'%')
  order by (p.verification_status='verified'::public.verification_status) desc,p.full_name
  limit greatest(1,least(coalesce(max_rows,60),200));
end
$function$
;

create function public.remind_connection(connection_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  request public.connections%rowtype;
begin
  select c.* into request from public.connections c
  where c.id = connection_id and c.requester_id = (select auth.uid())
  for update;

  if not found or request.status <> 'pending' or request.staff_approved_at is null then
    raise exception 'Only the sender can remind the recipient of an approved, pending request.';
  end if;
  if greatest(request.staff_approved_at, request.last_reminded_at) > now() - interval '24 hours' then
    raise exception 'Wait 24 hours after approval or the last reminder before sending another.';
  end if;
  if not exists (select 1 from public.profiles p where p.id = request.requester_id and p.account_status = 'active') then
    raise exception 'Your account must be active to send a reminder.';
  end if;
  update public.connections set last_reminded_at = now() where id = request.id;
  perform private.notify_user(request.addressee_id, 'connection', 'Connection request reminder',
    'A member is waiting for your response to an approved connection request.',
    '/dashboard/network#request-' || request.id::text);
end;
$$;

revoke all on function public.remind_connection(uuid) from public, anon;
grant execute on function public.remind_connection(uuid) to authenticated;
