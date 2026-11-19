CREATE OR REPLACE FUNCTION public.request_connection(addressee uuid, connection_intent text DEFAULT 'connect'::text, opportunity uuid DEFAULT NULL::uuid, note text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  requester uuid := auth.uid();
  intent_value public.connection_intent;
  connection_id uuid;
  existing public.connections%rowtype;
  requester_name text;
  requester_email text;
  addressee_name text;
  deal_title text := null;
  deal_summary text := null;
  deal_ref text := 'General Connection Request';
  staff_row record;
  email_subject text;
  email_body text;
begin
  if requester is null then raise exception 'Authentication required'; end if;
  perform private.assert_throttle('connection',20,3600);

  if not exists(
    select 1 from public.profiles p
    where p.id=requester
      and p.account_status='active'::public.account_status
      and p.profile_completed
  ) then
    raise exception 'Complete your profile before requesting a connection';
  end if;

  if addressee is null or addressee=requester then raise exception 'Choose another member to connect with'; end if;
  if connection_intent not in ('connect','invest','buy','partner') then raise exception 'Invalid connection type'; end if;
  intent_value := connection_intent::public.connection_intent;

  select c.* into existing
  from public.connections c
  where c.requester_id=requester
    and c.addressee_id=addressee
    and c.opportunity_id is not distinct from opportunity
  limit 1
  for update;

  if found and existing.status='accepted'::public.connection_status then
    raise exception 'You are already connected for this request';
  end if;
  if found and existing.status='pending'::public.connection_status then
    if existing.staff_approved_at is null then
      raise exception 'Your request is already processing with WTC Accra';
    else
      raise exception 'Your request was approved and is waiting for the recipient';
    end if;
  end if;

  select p.full_name into addressee_name
  from public.profiles p
  where p.id=addressee and private.is_participant(p.id);
  if addressee_name is null then raise exception 'That member is not available to connect with'; end if;

  select p.full_name,u.email into requester_name,requester_email
  from public.profiles p join auth.users u on u.id=p.id
  where p.id=requester;

  if opportunity is not null then
    select o.title,o.summary into deal_title,deal_summary
    from public.opportunities o
    where o.id=opportunity
      and o.status='published'::public.opportunity_status;
    if deal_title is null then raise exception 'That deal is not available'; end if;
    deal_ref := deal_title;
  end if;

  if existing.id is not null then
    update public.connections
    set status='pending'::public.connection_status,
        intent=intent_value,
        message=nullif(btrim(note),''),
        response_note=null,
        responded_at=null,
        staff_approved_at=null,
        staff_approved_by=null,
        staff_review_note=null,
        last_action_by=requester,
        last_action_role='user',
        last_action_at=now(),
        updated_at=now()
    where id=existing.id
    returning id into connection_id;
  else
    insert into public.connections(
      requester_id,addressee_id,opportunity_id,intent,message,status,
      staff_approved_at,staff_approved_by,last_action_by,last_action_role,last_action_at
    )
    values(
      requester,addressee,opportunity,intent_value,nullif(btrim(note),''),
      'pending'::public.connection_status,null,null,requester,'user',now()
    )
    returning id into connection_id;
  end if;

  if connection_id is null then raise exception 'The connection request could not be saved'; end if;

  email_subject := 'WTC Accra · '||initcap(connection_intent)||' Request: '||deal_ref;
  email_body :=
    'A monitored connection request has been raised on the WTC Accra Hub.'||chr(10)||chr(10)||
    'Request type: '||initcap(connection_intent)||chr(10)||
    'From: '||coalesce(requester_name,'Member')||' <'||coalesce(requester_email,'unknown')||'>'||chr(10)||
    'Requested counterpart: '||coalesce(addressee_name,'Member')||chr(10)||
    'Deal: '||coalesce(deal_title,'Not linked to a specific deal')||chr(10)||
    coalesce('Summary: '||deal_summary||chr(10),'')||
    coalesce('Message: '||nullif(btrim(note),'')||chr(10),'')||chr(10)||
    'Status: Processing. WTC Accra must approve this request before it is released to the recipient.';

  perform private.notify_user(
    requester,'connection','Connection Request Processing',
    'Your request was received and is waiting for WTC Accra approval.',
    '/dashboard/network'
  );

  insert into public.outbound_emails(to_email,to_user_id,subject,body,kind,related_id)
  values(requester_email,requester,email_subject,email_body,'connection',connection_id);

  for staff_row in
    select p.id,u.email,p.full_name,p.system_role
    from public.profiles p join auth.users u on u.id=p.id
    where p.system_role in ('trade_officer','verification_officer','admin','super_admin')
      and p.account_status='active'
  loop
    perform private.notify_user(
      staff_row.id,'deal',
      'Connection Approval Required: '||deal_ref,
      coalesce(requester_name,'A member')||' requested access to '||coalesce(addressee_name,'a member')||'.',
      '/admin/deals?section=connections'
    );
    insert into public.outbound_emails(to_email,to_user_id,subject,body,kind,related_id)
    values(staff_row.email,staff_row.id,email_subject,email_body,'connection',connection_id);
  end loop;

  perform private.write_audit(
    'connection.requested','connection',connection_id::text,
    jsonb_build_object(
      'intent',connection_intent,
      'opportunity',opportunity,
      'addressee',addressee,
      'workflow','staff_approval_required'
    )
  );

  return connection_id;
end
$function$
;
