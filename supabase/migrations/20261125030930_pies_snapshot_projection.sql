-- Build the response in one pass using textual JSON and grouped attendance.
-- Published rows and their public snapshot are identical at this stage.
create function public.pies_snapshot_v2(school_key uuid) returns json
language sql stable set search_path = ''
as $$
with attendance_rows as materialized (
  select lesson_id,jsonb_agg(jsonb_build_object('studentId',student_id,'status',status) order by student_id) as rows
  from pies.attendance where school=school_key group by lesson_id
)
select json_build_object(
  'id',school.id,'name',school.name,'network',school.network,'policy',school.policy,'version',school.version,
  'classes',coalesce((
    select json_agg(c.record || jsonb_build_object('teachers',coalesce(
      (select jsonb_agg(account_id order by account_id) from pies.class_teachers t where t.school=c.school and t.class_id=c.id),'[]'::jsonb)) order by c.position)
    from pies.classes c where c.school=school_key),'[]'::json),
  'students',coalesce((
    select json_agg(s.record || jsonb_build_object('guardians',coalesce(
      (select jsonb_agg(account_id order by account_id) from pies.student_guardians g where g.school=s.school and g.student_id=s.id),'[]'::jsonb)) order by s.position)
    from pies.students s where s.school=school_key),'[]'::json),
  'lessons',coalesce((
    select json_agg(l.record || jsonb_build_object('attendance',coalesce(a.rows,'[]'::jsonb)) order by l.position)
    from pies.lessons l left join attendance_rows a on a.lesson_id=l.id where l.school=school_key),'[]'::json),
  'closures',coalesce((
    select json_agg(case when record->>'state'='Publicado' then record-'publicRows' else record end order by position)
    from pies.closures where school=school_key),'[]'::json),
  'accounts',coalesce((select json_agg(to_jsonb(a)-'profile_label'-'profile_order' order by a.name)
    from pies.accounts a where a.school=school_key),'[]'::json),
  'periods',coalesce((select json_agg(record order by position) from pies.periods where school=school_key),'[]'::json),
  'enrollments',coalesce((select json_agg(record order by position) from pies.enrollments where school=school_key),'[]'::json),
  'assessments',coalesce((select json_agg(record order by position) from pies.assessments where school=school_key),'[]'::json),
  'grades',coalesce((select json_agg(record order by position) from pies.grades where school=school_key),'[]'::json),
  'submissions',coalesce((select json_agg(record order by position) from pies.submissions where school=school_key),'[]'::json),
  'events',coalesce((select json_agg(record order by position) from pies.events where school=school_key),'[]'::json),
  'cases',coalesce((select json_agg(record order by position) from pies.cases where school=school_key),'[]'::json),
  'notices',coalesce((select json_agg(record order by position) from pies.notices where school=school_key),'[]'::json),
  'receipts',coalesce((select json_agg(record order by position) from pies.receipts where school=school_key),'[]'::json),
  'justifications',coalesce((select json_agg(record order by position) from pies.justifications where school=school_key),'[]'::json),
  'audit',coalesce((select json_agg(record order by position) from pies.audit where school=school_key),'[]'::json)
) from pies.schools school where school.id=school_key
$$;
revoke execute on function public.pies_snapshot_v2(uuid) from public,anon,authenticated;
grant execute on function public.pies_snapshot_v2(uuid) to service_role;

-- A denied request can be filed again. Other states still allow only one request per lesson and student.
alter table pies.justifications drop constraint justifications_school_lesson_id_student_id_key;
create unique index justifications_open_request_idx on pies.justifications(school,lesson_id,student_id)
where record->>'state'<>'Recusada';
