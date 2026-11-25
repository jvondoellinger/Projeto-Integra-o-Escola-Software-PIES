create schema pies;
revoke all on schema pies from public, anon, authenticated;
grant usage on schema pies to service_role;

create table pies.schools (
  id uuid primary key,
  name text not null,
  network text not null,
  policy jsonb not null check (jsonb_typeof(policy) = 'object'),
  version bigint not null default 0 check (version >= 0)
);
create table pies.accounts (
  id uuid primary key,
  school uuid not null references pies.schools,
  email text not null unique check (email = lower(email)),
  name text not null,
  role text not null check (role in ('secretaria','professor','coordenacao','rede','aluno','responsavel')),
  active boolean not null default true,
  profile_label text,
  profile_order smallint,
  unique (school,id)
);
create table pies.sessions (
  token_hash text primary key,
  account uuid not null references pies.accounts on delete cascade,
  expires_at timestamptz not null
);
create table pies.operations (
  school uuid not null,
  account uuid not null,
  id text not null,
  committed_at timestamptz not null default now(),
  primary key (school,account,id),
  foreign key (school,account) references pies.accounts(school,id)
);

create function pies.entities() returns text[]
language sql immutable set search_path = ''
as $$ select array['classes','students','periods','enrollments','assessments','lessons',
  'grades','submissions','closures','events','cases','notices','receipts','justifications','audit']::text[] $$;
create function pies.iso_day(value text) returns date
language sql immutable strict set search_path = ''
as $$ select make_date(substr(value,1,4)::int,substr(value,6,2)::int,substr(value,9,2)::int) $$;

-- One row per domain record. Typed generated keys expose and constrain the
-- compatibility fields while preserving the existing domain payload shape.
do $$
declare entity text;
begin
  foreach entity in array pies.entities() loop
    execute format('create table pies.%I (
      school uuid not null references pies.schools on delete cascade,
      id uuid not null,
      position bigint generated always as identity,
      record jsonb not null check (jsonb_typeof(record) = ''object'' and record->>''id'' = id::text),
      primary key (school,id)
    )', entity);
    execute format('create index on pies.%I (school,position)', entity);
  end loop;
end $$;

alter table pies.students
  add column registration text generated always as (record->>'registration') stored not null,
  add column account_id uuid generated always as (nullif(record->>'account','')::uuid) stored,
  add unique (school,registration), add unique(school,account_id),
  add foreign key (school,account_id) references pies.accounts(school,id);
create unique index students_inep_idx on pies.students(school,(record->>'inep')) where nullif(record->>'inep','') is not null;
alter table pies.classes
  add column year smallint generated always as ((record->>'year')::smallint) stored not null,
  add check (year between 2000 and 2100);
alter table pies.periods
  add column start_on date generated always as (pies.iso_day(record->>'start')) stored not null,
  add column end_on date generated always as (pies.iso_day(record->>'end')) stored not null,
  add check (start_on <= end_on and extract(year from start_on) = extract(year from end_on));
alter table pies.enrollments
  add column class_id uuid generated always as ((record->>'classId')::uuid) stored not null,
  add column student_id uuid generated always as ((record->>'studentId')::uuid) stored not null,
  add column start_on date generated always as (pies.iso_day(record->>'start')) stored not null,
  add column end_on date generated always as (pies.iso_day(nullif(record->>'end',''))) stored,
  add foreign key (school,class_id) references pies.classes,
  add foreign key (school,student_id) references pies.students,
  add unique (school,class_id,student_id,start_on),
  add check (end_on >= start_on);
alter table pies.assessments
  add column class_id uuid generated always as ((record->>'classId')::uuid) stored not null,
  add column due_on date generated always as (pies.iso_day(record->>'day')) stored not null,
  add column published_on date generated always as (pies.iso_day(record->>'published')) stored not null,
  add foreign key (school,class_id) references pies.classes,
  add check (published_on <= due_on),
  add check (record->>'format' in ('Prova','Atividade em sala','Atividade de casa','Trabalho de longo prazo'));
alter table pies.lessons
  add column class_id uuid generated always as ((record->>'classId')::uuid) stored not null,
  add column day date generated always as (pies.iso_day(record->>'day')) stored not null,
  add column slot text generated always as (record->>'slot') stored not null,
  add foreign key(school,class_id) references pies.classes,
  add unique(school,class_id,day,slot);
alter table pies.grades
  add column assessment_id uuid generated always as ((record->>'assessmentId')::uuid) stored not null,
  add column student_id uuid generated always as ((record->>'studentId')::uuid) stored not null,
  add column score numeric generated always as ((record->>'score')::numeric) stored,
  add foreign key(school,assessment_id) references pies.assessments,
  add foreign key(school,student_id) references pies.students,
  add unique(school,assessment_id,student_id),
  add check (score between 0 and 10);
alter table pies.submissions
  add column assessment_id uuid generated always as ((record->>'assessmentId')::uuid) stored not null,
  add column student_id uuid generated always as ((record->>'studentId')::uuid) stored not null,
  add foreign key(school,assessment_id) references pies.assessments,
  add foreign key(school,student_id) references pies.students,
  add unique(school,assessment_id,student_id);
alter table pies.closures
  add column class_id uuid generated always as ((record->>'classId')::uuid) stored not null,
  add column period_id uuid generated always as ((record->>'periodId')::uuid) stored not null,
  add foreign key(school,class_id) references pies.classes,
  add foreign key(school,period_id) references pies.periods,
  add unique(school,class_id,period_id),
  add check(record->>'state' in ('Fechado','Publicado','Reaberto'));

do $$
declare entity text;
begin
  foreach entity in array array['events','notices','cases','justifications'] loop
    execute format('alter table pies.%I add column class_id uuid generated always as (nullif(record->>''classId'','''')::uuid) stored, add foreign key(school,class_id) references pies.classes', entity);
    execute format('create index on pies.%I(school,class_id)', entity);
  end loop;
end $$;
alter table pies.cases
  add column student_id uuid generated always as ((record->>'studentId')::uuid) stored not null,
  add foreign key(school,student_id) references pies.students;
alter table pies.justifications
  add column student_id uuid generated always as ((record->>'studentId')::uuid) stored not null,
  add column lesson_id uuid generated always as ((record->>'lessonId')::uuid) stored not null,
  add foreign key(school,student_id) references pies.students,
  add foreign key(school,lesson_id) references pies.lessons,
  add unique(school,lesson_id,student_id);
alter table pies.receipts
  add column notice_id uuid generated always as ((record->>'noticeId')::uuid) stored not null,
  add column account_id uuid generated always as ((record->>'accountId')::uuid) stored not null,
  add foreign key(school,notice_id) references pies.notices,
  add foreign key(school,account_id) references pies.accounts(school,id),
  add unique(school,notice_id,account_id);

create table pies.class_teachers (
  school uuid not null,
  class_id uuid not null,
  account_id uuid not null,
  primary key(school,class_id,account_id),
  foreign key(school,class_id) references pies.classes on delete cascade,
  foreign key(school,account_id) references pies.accounts(school,id)
);
create table pies.student_guardians (
  school uuid not null,
  student_id uuid not null,
  account_id uuid not null,
  primary key(school,student_id,account_id),
  foreign key(school,student_id) references pies.students on delete cascade,
  foreign key(school,account_id) references pies.accounts(school,id)
);
create table pies.attendance (
  school uuid not null,
  lesson_id uuid not null,
  student_id uuid not null,
  status text not null check (status in ('Presente','Falta','Justificada')),
  primary key(school,lesson_id,student_id),
  foreign key(school,lesson_id) references pies.lessons on delete cascade,
  foreign key(school,student_id) references pies.students
);

create index schools_network_idx on pies.schools(network,name);
create index accounts_school_idx on pies.accounts(school,name);
create index sessions_expiry_idx on pies.sessions(expires_at);
create index sessions_account_idx on pies.sessions(account);
create unique index quick_profiles_idx on pies.accounts(profile_order) where profile_label is not null;
create index periods_calendar_idx on pies.periods(school,start_on,end_on);
create index enrollment_student_idx on pies.enrollments(school,student_id,start_on);
create index enrollment_active_idx on pies.enrollments(school,class_id,student_id) where end_on is null;
create index assessments_calendar_idx on pies.assessments(school,class_id,due_on);
create index grades_student_idx on pies.grades(school,student_id,assessment_id);
create index submissions_student_idx on pies.submissions(school,student_id,assessment_id);
create index closures_period_idx on pies.closures(school,period_id);
create index receipts_account_idx on pies.receipts(school,account_id);
create index cases_student_idx on pies.cases(school,student_id);
create index justifications_student_idx on pies.justifications(school,student_id);
create index attendance_student_idx on pies.attendance(school,student_id,lesson_id);
create index teachers_account_idx on pies.class_teachers(school,account_id);
create index guardians_account_idx on pies.student_guardians(school,account_id);

create function pies.write_rows(school_key uuid, changes jsonb) returns void
language plpgsql set search_path = ''
as $$
declare entity text; rows jsonb; child_field text;
begin
  foreach entity in array pies.entities() loop
    rows := changes->entity;
    if rows is null or jsonb_array_length(rows) = 0 then continue; end if;
    child_field := case entity when 'classes' then 'teachers' when 'students' then 'guardians' when 'lessons' then 'attendance' else '' end;
    execute format('insert into pies.%I(school,id,record)
      select $1,(row->>''id'')::uuid,row - $3 from jsonb_array_elements($2) row
      on conflict(school,id) do update set record=excluded.record',entity)
    using school_key, rows, child_field;

    if entity = 'classes' then
      delete from pies.class_teachers where school=school_key and class_id in
        (select (x->>'id')::uuid from jsonb_array_elements(rows) x);
      insert into pies.class_teachers
      select school_key,(x->>'id')::uuid,teacher.value::uuid
      from jsonb_array_elements(rows) x
      cross join lateral jsonb_array_elements_text(x->'teachers') teacher;
    elsif entity = 'students' then
      delete from pies.student_guardians where school=school_key and student_id in
        (select (x->>'id')::uuid from jsonb_array_elements(rows) x);
      insert into pies.student_guardians
      select school_key,(x->>'id')::uuid,guardian.value::uuid
      from jsonb_array_elements(rows) x
      cross join lateral jsonb_array_elements_text(x->'guardians') guardian;
    elsif entity = 'lessons' then
      delete from pies.attendance where school=school_key and lesson_id in
        (select (x->>'id')::uuid from jsonb_array_elements(rows) x);
      insert into pies.attendance
      select school_key,(x->>'id')::uuid,(a->>'studentId')::uuid,a->>'status'
      from jsonb_array_elements(rows) x cross join lateral jsonb_array_elements(x->'attendance') a;
    end if;
  end loop;
end $$;

create function public.pies_snapshot(school_key uuid) returns jsonb
language plpgsql stable set search_path = ''
as $$
declare result jsonb; entity text; rows jsonb;
begin
  select to_jsonb(s) into result from pies.schools s where s.id=school_key;
  if result is null then return null; end if;
  foreach entity in array pies.entities() loop
    if entity = 'classes' then
      select jsonb_agg(c.record || jsonb_build_object('teachers',coalesce(
        (select jsonb_agg(t.account_id order by t.account_id) from pies.class_teachers t where t.school=c.school and t.class_id=c.id),'[]'::jsonb))
        order by c.position) into rows from pies.classes c where c.school=school_key;
    elsif entity = 'students' then
      select jsonb_agg(s.record || jsonb_build_object('guardians',coalesce(
        (select jsonb_agg(g.account_id order by g.account_id) from pies.student_guardians g where g.school=s.school and g.student_id=s.id),'[]'::jsonb))
        order by s.position) into rows from pies.students s where s.school=school_key;
    elsif entity = 'lessons' then
      select jsonb_agg(l.record || jsonb_build_object('attendance',coalesce(
        (select jsonb_agg(jsonb_build_object('studentId',a.student_id,'status',a.status) order by a.student_id)
          from pies.attendance a where a.school=l.school and a.lesson_id=l.id),'[]'::jsonb))
        order by l.position) into rows from pies.lessons l where l.school=school_key;
    else
      execute format('select jsonb_agg(record order by position) from pies.%I where school=$1',entity)
        into rows using school_key;
    end if;
    result := result || jsonb_build_object(entity,coalesce(rows,'[]'::jsonb));
  end loop;
  return result || jsonb_build_object('accounts',coalesce(
    (select jsonb_agg(to_jsonb(a) - 'profile_order' - 'profile_label' order by a.name) from pies.accounts a where a.school=school_key),'[]'::jsonb));
end $$;

create view pies.school_overview with (security_invoker=true) as
select s.id,s.name,s.network,
  (select count(*) from pies.classes c where c.school=s.id) as classes,
  (select count(distinct e.student_id) from pies.enrollments e where e.school=s.id and e.end_on is null) as students,
  (select count(*) from pies.closures c where c.school=s.id and c.record->>'state'='Publicado') as published,
  (select count(*) from pies.cases c where c.school=s.id and c.record->>'state'<>'Concluído') as "openCases"
from pies.schools s;
create function public.pies_network(network_name text) returns jsonb
language sql stable set search_path = ''
as $$ select coalesce(jsonb_agg(to_jsonb(s) - 'network' order by s.name),'[]'::jsonb)
from pies.school_overview s where s.network=network_name $$;

create function public.pies_profiles() returns jsonb
language sql stable set search_path = ''
as $$ select coalesce(jsonb_agg(jsonb_build_object('email',email,'label',profile_label) order by profile_order),'[]'::jsonb)
from pies.accounts where active and profile_label is not null $$;
create function public.pies_login(profile_email text, hashed_token text) returns jsonb
language plpgsql set search_path = ''
as $$
declare profile pies.accounts%rowtype;
begin
  select * into profile from pies.accounts where email=profile_email and active and profile_label is not null;
  if not found then return null; end if;
  delete from pies.sessions where expires_at <= now();
  insert into pies.sessions values(hashed_token,profile.id,now() + interval '8 hours');
  return to_jsonb(profile) - 'profile_order' - 'profile_label';
end $$;
create function public.pies_identity(hashed_token text) returns jsonb
language sql stable set search_path = ''
as $$ select (to_jsonb(a) - 'profile_order' - 'profile_label') || jsonb_build_object('network',s.network)
from pies.sessions t join pies.accounts a on a.id=t.account join pies.schools s on s.id=a.school
where t.token_hash=hashed_token and t.expires_at > now() and a.active $$;
create function public.pies_logout(hashed_token text) returns void
language sql set search_path = ''
as $$ delete from pies.sessions where token_hash=hashed_token $$;

create function public.pies_commit(school_key uuid, actor uuid, expected_version bigint,
  operation_key text, changes jsonb, next_policy jsonb, account_changes jsonb, hashed_token text)
returns text language plpgsql set search_path = ''
as $$
declare current_version bigint; edited jsonb;
begin
  select version into current_version from pies.schools where id=school_key for update;
  if not exists (
    select 1 from pies.accounts a join pies.sessions t on t.account=a.id
    where a.school=school_key and a.id=actor and a.active and t.token_hash=hashed_token and t.expires_at > now()
  ) then return 'unauthorized'; end if;
  if exists(select 1 from pies.operations where school=school_key and account=actor and id=operation_key)
    then return 'duplicate'; end if;
  if current_version <> expected_version then return 'conflict'; end if;

  for edited in select value from jsonb_array_elements(account_changes) loop
    insert into pies.accounts(id,school,email,name,role,active)
      values((edited->>'id')::uuid,school_key,edited->>'email',edited->>'name',edited->>'role',(edited->>'active')::boolean)
    on conflict(id) do update set active=excluded.active where pies.accounts.school=school_key;
    if not (edited->>'active')::boolean then
      delete from pies.sessions where account=(edited->>'id')::uuid;
    end if;
  end loop;
  perform pies.write_rows(school_key,changes);
  update pies.schools set policy=next_policy, version=version+1 where id=school_key;
  insert into pies.operations(school,account,id) values(school_key,actor,operation_key);
  return 'committed';
end $$;

revoke all on all tables in schema pies from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema pies to service_role;
grant usage,select on all sequences in schema pies to service_role;
revoke execute on all functions in schema pies from public,anon,authenticated;
grant execute on all functions in schema pies to service_role;
do $$
declare rpc regprocedure;
begin
  for rpc in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in ('pies_snapshot','pies_network','pies_profiles','pies_login','pies_identity','pies_logout','pies_commit')
  loop
    execute format('revoke execute on function %s from public,anon,authenticated',rpc);
    execute format('grant execute on function %s to service_role',rpc);
  end loop;
end $$;
