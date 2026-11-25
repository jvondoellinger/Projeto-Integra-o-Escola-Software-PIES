create function public.pies_operation_exists(school_key uuid, actor uuid, operation_key text) returns boolean
language sql stable set search_path = ''
as $$ select exists(select 1 from pies.operations where school=school_key and account=actor and id=operation_key) $$;
revoke execute on function public.pies_operation_exists(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.pies_operation_exists(uuid,uuid,text) to service_role;
