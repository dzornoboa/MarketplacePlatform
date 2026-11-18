alter table public.document_records
  add column extra_upload_request_id uuid unique references public.support_requests(id);

create index if not exists document_records_upload_owner_idx
  on public.document_records (owner_user_id);

create function private.enforce_document_upload_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_user_id is distinct from old.owner_user_id
      or new.extra_upload_request_id is distinct from old.extra_upload_request_id
      or new.object_path is distinct from old.object_path
      or new.size_bytes is distinct from old.size_bytes then
      raise exception 'Document ownership and file metadata cannot be changed.';
    end if;
    return new;
  end if;

  if new.size_bytes is null or new.size_bytes < 1 or new.size_bytes > 1048576 then
    raise exception 'Files must be 1 MB or smaller.';
  end if;

  if split_part(new.object_path, '/', 1) <> new.owner_user_id::text then
    raise exception 'The document must be stored under its owner.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_user_id::text, 0));
  if new.extra_upload_request_id is null then
    if (select count(*) from public.document_records where owner_user_id = new.owner_user_id) >= 5 then
      raise exception 'You can keep up to five self-service documents. Delete an old document or request an extra upload.';
    end if;
  else
    if (select auth.role()) is distinct from 'service_role'
      or new.access_scope <> 'private'
      or new.opportunity_id is not null or new.deal_room_id is not null then
      raise exception 'Extra uploads must be private and fulfilled by WTC Accra.';
    end if;

    update public.support_requests set status = 'resolved'
    where id = new.extra_upload_request_id
      and user_id = new.owner_user_id
      and category = 'extra_document'
      and status in ('open', 'in_progress');
    if not found then
      raise exception 'This extra upload request is no longer open.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_document_upload_limits() from public, anon, authenticated;

create trigger enforce_document_upload_limits
before insert or update of owner_user_id, extra_upload_request_id, object_path, size_bytes
on public.document_records
for each row execute function private.enforce_document_upload_limits();

update storage.buckets set file_size_limit = 1048576 where id = 'platform-documents';
