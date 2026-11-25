-- Reproducible academic dataset kept entirely in PostgreSQL.
create temporary table seed_clock on commit drop as
select today, extract(year from today)::int as year
from (select timezone('America/Sao_Paulo',now())::date as today) t;

create temporary table seed_campuses on commit drop as
select gen_random_uuid() as id,* from (values
  (1,'Colégio Horizonte','horizonte.example',320),
  (2,'Colégio Horizonte · Unidade Parque','parque.horizonte.example',185)
) as campus(number,name,domain,size);

insert into pies.schools(id,name,network,policy)
select id,name,'Rede Horizonte',jsonb_build_object(
  'year',year,'target',7,'attendance',75,'preschoolAttendance',60,'grading','weighted'
) from seed_campuses cross join seed_clock;

insert into pies.accounts(id,school,email,name,role,profile_label,profile_order)
select gen_random_uuid(), c.id, a.handle || '@' || c.domain,a.name,a.role,
  case when c.number=1 then a.label end, case when c.number=1 then a.position end
from seed_campuses c cross join (values
  ('secretaria','Administração escolar','secretaria','Secretaria',1),
  ('professora','Mariana Carvalho','professor','Professora',2),
  ('coordenacao','Camila Antunes','coordenacao','Coordenação',3),
  ('aluna','Ana Clara Martins','aluno','Aluna',4),
  ('responsavel','Patrícia Martins','responsavel','Responsável',5),
  ('rede','Juliano Campos','rede','Gestão de rede',6),
  ('larissa','Larissa Nogueira','professor',null,null),
  ('fernanda','Fernanda Lima','professor',null,null),
  ('daniel','Daniel Martins','aluno',null,null)
) a(handle,name,role,label,position)
where c.number=1 or a.role<>'rede';

create temporary table seed_groups on commit drop as
select c.id as school,c.number,g.number as group_number,g.section,g.shift,
  case when c.number=1 then 40 else 37 end as size
from seed_campuses c cross join (values
  (1,'6º ano A','Manhã'), (2,'6º ano B','Tarde'), (3,'7º ano A','Manhã'),
  (4,'7º ano B','Tarde'), (5,'8º ano A','Manhã'), (6,'8º ano B','Tarde'),
  (7,'9º ano A','Manhã'), (8,'9º ano B','Tarde')
) g(number,section,shift) where c.number=1 or g.number<=5;

create temporary table seed_classes on commit drop as
select gen_random_uuid() as id,g.school,g.group_number,g.section,g.shift,s.subject,s.handle,s.subject_number
from seed_groups g cross join (values
  (1,'Matemática','professora'),(2,'Língua Portuguesa','larissa'),(3,'Ciências','fernanda')
) s(subject_number,subject,handle);

insert into pies.classes(school,id,record)
select c.school,c.id,jsonb_build_object(
  'id',c.id,'name',section||' · '||subject,'section',section,'stage','Ensino Fundamental','subject',subject,
  'year',year,'shift',shift,'timetable',case subject_number when 1 then 'Segunda e quarta, 08:00' when 2 then 'Terça e quinta, 09:00' else 'Quarta e sexta, 10:00' end
)
from seed_classes c cross join seed_clock;

insert into pies.class_teachers
select c.school,c.id,a.id from seed_classes c join pies.accounts a
on a.school=c.school and split_part(a.email,'@',1)=c.handle;

create temporary table seed_students on commit drop as
with names as (
  select given||' '||surname||' '||family as name,
    row_number() over(order by md5(given||':'||surname||':'||family),given,surname,family) as n
  from unnest(array['Maria','Lucas','Laura','Gabriel','Helena','Miguel','Alice','Arthur','Isabela','Bernardo',
    'Sofia','Heitor','Manuela','Theo','Julia','Davi','Cecília','Rafael','Heloísa','Samuel',
    'Beatriz','Lorenzo','Valentina','Pedro','Lívia','Nicolas','Luísa','Isaque','Camila','Enzo']) given
  cross join unnest(array['Oliveira','Almeida','Souza','Costa','Lima','Ribeiro','Pereira','Mendes','Vieira','Barbosa']) surname
  cross join unnest(array['Santos','Azevedo','Freitas','Gomes','Silva','Nogueira','Rocha','Pires']) family
), roster as (
  select g.*, seat, row_number() over(order by number,group_number,seat) as serial
  from seed_groups g cross join lateral generate_series(1,g.size) seat
), assigned as (
  select r.*,
    case when number=1 and group_number=5 then
      (array['Ana Clara Martins','Jorge Armando Von Doellinger','Leonardo dos Santos Magalhães','Daniele Todão Souza',
        'Davi Henrique Moreira Neves','Kaue Barbosa Luzia'])[seat]
    when number=1 and group_number=7 and seat=1 then 'Marina Almeida'
    when number=1 and group_number=1 and seat=1 then 'Daniel Martins' end as assigned_name
  from roster r
)
select gen_random_uuid() as id,a.school,a.group_number,a.seat,a.serial,
  coalesce(a.assigned_name,n.name) as name,
  (select b.id from pies.accounts b where b.school=a.school and b.role='aluno' and b.name=a.assigned_name) as account_id,
  (select b.id from pies.accounts b where b.school=a.school and b.role='responsavel'
    and a.assigned_name in ('Ana Clara Martins','Daniel Martins')) as guardian_id
from assigned a join names n on n.n=a.serial;

insert into pies.students(school,id,record)
select s.school,s.id,jsonb_build_object('id',s.id,'name',s.name,
  'registration',year||'-'||lpad(s.serial::text,4,'0'),'inep','','account',s.account_id)
from seed_students s cross join seed_clock order by serial;
insert into pies.student_guardians select school,id,guardian_id from seed_students where guardian_id is not null;

insert into pies.enrollments(school,id,record)
select s.school,e.id,jsonb_build_object('id',e.id,'studentId',s.id,'classId',c.id,
 'start',make_date(year,2,1),'end',null,'result','')
from seed_students s join seed_classes c using(school,group_number)
cross join seed_clock cross join lateral (select gen_random_uuid() as id where s.id is not null and c.id is not null) e;

create temporary table seed_periods on commit drop as
select gen_random_uuid() as id,c.id as school,t.number,t.number||'º bimestre' as name,
  (year||t.start_on)::date as start_on,(year||t.end_on)::date as end_on, today
from seed_campuses c cross join seed_clock cross join (values
 (1,'-02-01','-04-24'),(2,'-04-25','-07-10'),(3,'-07-27','-09-30'),(4,'-10-01','-12-22')
) t(number,start_on,end_on);
insert into pies.periods(school,id,record)
select school,id,jsonb_build_object('id',id,'name',name,'year',extract(year from start_on),'start',start_on,'end',end_on)
from seed_periods order by number;

create temporary table seed_assessments on commit drop as
select gen_random_uuid() as id,c.school,c.id as class_id,p.id as period_id,c.group_number,c.subject_number,
  gen.kind,gen.format,gen.due_on,gen.published_on,
  (case c.subject_number when 1 then array['Frações e proporcionalidade','Equações e padrões','Geometria e medidas','Estatística e leitura de gráficos']
    when 2 then array['Leitura e inferência','Crônica e ponto de vista','Argumentação e fontes','Produção e revisão textual']
    else array['Ecossistemas locais','Matéria e transformações','Corpo humano e saúde','Energia e sustentabilidade'] end)[p.number] as topic
from seed_classes c join seed_periods p using(school) cross join lateral (
  select 1,'Atividade em sala', p.start_on+7,p.start_on+4 where p.start_on+7 <= p.today
  union all select 2,'Prova',p.start_on+14,p.start_on+9 where p.start_on+14 <= p.today
  union all select 3,'Atividade de casa',least(p.today+7,p.end_on),greatest(p.today-2,p.start_on)
    where p.today between p.start_on and p.end_on
  union all select 4,'Trabalho de longo prazo',least(p.today+18,p.end_on),p.today
    where p.today between p.start_on and p.end_on
) gen(kind,format,due_on,published_on);

insert into pies.assessments(school,id,record)
select school,id,jsonb_build_object('id',id,'classId',class_id,'day',due_on,'published',published_on,
 'title',format||' · '||topic,'format',format,'instructions','Apresente sua estratégia para '||lower(topic)||' e justifique a resposta.',
 'material','Revise um exemplo estudado em aula e anote como você conferiu a resposta.','weight',case kind when 2 then 2 else 1 end,
 'reminderDays',case kind when 4 then 7 else 3 end,'recovery',false)
from seed_assessments order by due_on;

create temporary table seed_grades on commit drop as
select gen_random_uuid() as id,a.school,a.id as assessment_id,s.id as student_id,
 round(4.0+((s.serial*17 + a.subject_number*11 + a.kind*13 + extract(month from a.due_on)::int*7)%61)/10.0,1) as score,
 (array['Explique como conferiu o resultado.','Bom raciocínio. Desenvolva o exemplo final.','Retome o segundo item com o roteiro.'])[1+(s.serial%3)] as feedback
from seed_assessments a join seed_students s using(school,group_number)
where a.kind<=2;
insert into pies.grades(school,id,record)
select school,id,jsonb_build_object('id',id,'assessmentId',assessment_id,'studentId',student_id,'score',score,'feedback',feedback)
from seed_grades;

insert into pies.submissions(school,id,record)
select a.school,x.id,jsonb_build_object('id',x.id,'assessmentId',a.id,'studentId',s.id,'text',
 case a.subject_number when 1 then
   case when a.topic like 'Estatística%' then 'Organizei os valores 4, 6, 6, 8 e 11. A mediana e a moda são 6. A soma é 35, então a média é 7.'
   when a.topic like 'Frações%' then 'Usei o denominador comum 8. Transformei 1/2 em 4/8 e a soma com 3/8 deu 7/8.'
   when a.topic like 'Geometria%' then 'O retângulo tem lados de 8 cm e 5 cm. A área é 40 cm² e o perímetro é 26 cm.'
   else 'Em 3x + 5 = 20, subtraí 5 dos dois lados e dividi por 3. Encontrei x = 5 e conferi por substituição.' end
 when 2 then case when a.topic like 'Produção%' then 'Na revisão, acrescentei uma transição e cortei as frases repetidas. O último parágrafo retoma a ideia principal.'
   else 'A frase inicial apresenta minha interpretação. Usei dois trechos do texto e expliquei como sustentam a leitura.' end
 else case when a.topic like 'Energia%' then 'Comparei duas lâmpadas ligadas pelo mesmo tempo. A de 9 W consome menos que a de 60 W. Também compararia a iluminação.'
   else 'Escrevi minha hipótese e separei as observações da conclusão. Eu repetiria a medição para conferir o resultado.' end end,
 'completed',true,'submitted',to_char(a.published_on,'YYYY-MM-DD')||'T14:00:00Z')
from seed_assessments a join seed_students s using(school,group_number)
cross join lateral (select gen_random_uuid() as id where s.id is not null and a.id is not null) x
where a.kind<>2 and (s.seat between 2 and 8 or s.name='Marina Almeida');

create temporary table seed_lessons on commit drop as
select gen_random_uuid() as id,c.school,c.id as class_id,c.group_number,c.subject_number,
  p.id as period_id,(p.start_on+(n*6+c.subject_number)) as day,n
from seed_classes c join seed_periods p using(school) cross join generate_series(0,7) n
where p.start_on+(n*6+c.subject_number) <= least(p.end_on,p.today);
insert into pies.lessons(school,id,record)
select school,id,jsonb_build_object('id',id,'classId',class_id,'day',day,'slot',
 case subject_number when 1 then '08:00' when 2 then '09:00' else '10:00' end,
 'minutes',50,'topic',(array['Introdução e exemplos','Prática guiada','Exercícios em grupo','Revisão e correção'])[1+(n%4)],'revision',1)
from seed_lessons order by day;

insert into pies.attendance(school,lesson_id,student_id,status)
select l.school,l.id,s.id,case when (s.serial+extract(doy from day)::int+l.subject_number)%17=0 then 'Falta'
 when (s.serial+extract(doy from day)::int)%29=0 then 'Justificada' else 'Presente' end
from seed_lessons l join seed_students s using(school,group_number);

with marks as (
 select g.school,a.class_id,a.period_id,g.student_id,
   round(sum(g.score*a.kind)/sum(a.kind),2) average,
   jsonb_agg(jsonb_build_object('id',g.id,'assessmentId',a.id,'studentId',g.student_id,
     'title',a.format||' · '||a.topic,'score',g.score,'weight',a.kind,'recovery',false,'feedback',g.feedback,'day',a.due_on) order by a.due_on) marks
 from seed_grades g join seed_assessments a on a.id=g.assessment_id
 group by g.school,a.class_id,a.period_id,g.student_id
), presence as (
 select l.class_id,l.period_id,a.student_id,count(*)*50 minutes,
   round(count(*) filter (where a.status='Presente')*100.0/count(*),2) frequency
 from seed_lessons l join pies.attendance a on a.school=l.school and a.lesson_id=l.id
 group by l.class_id,l.period_id,a.student_id
), snapshots as (
 select m.school,m.class_id,m.period_id,jsonb_agg(jsonb_build_object('studentId',m.student_id,'name',s.name,
   'average',m.average,'attendance',a.frequency,'minutes',a.minutes,'marks',m.marks,'missing',0,
   'flags',case when m.average<7 then jsonb_build_array('Revisar recuperação') else '[]'::jsonb end) order by s.seat) rows
 from marks m join presence a using(class_id,period_id,student_id) join seed_students s on s.id=m.student_id
 join seed_periods p on p.id=m.period_id and p.end_on<p.today
 group by m.school,m.class_id,m.period_id
)
insert into pies.closures(school,id,record)
select s.school,x.id,jsonb_build_object('id',x.id,'classId',class_id,'periodId',period_id,
  'state','Publicado','rows',rows,'publicRows',rows,'publishedAt',now())
from snapshots s cross join lateral (select gen_random_uuid() as id where s.class_id is not null and s.period_id is not null) x;

insert into pies.events(school,id,record)
select c.school,x.id,jsonb_build_object('id',x.id,'classId',c.id,'title',
  case n when 1 then 'Plantão de dúvidas' when 2 then 'Encontro com as famílias' else 'Apresentação dos trabalhos' end,
  'kind',case when n=2 then 'Reunião' else 'Evento' end,'day',today+n+c.group_number,'time','15:00')
from seed_classes c cross join seed_clock cross join generate_series(1,3) n
cross join lateral (select gen_random_uuid() as id where c.id is not null and n>0) x
where c.subject_number=1;

insert into pies.notices(school,id,record)
select c.id,x.id,jsonb_build_object('id',x.id,'title',t.title,'body',t.body,'day',today-t.n,'classId',null)
from seed_campuses c cross join seed_clock cross join (values
  (1,'Plantão de dúvidas','Consulte a agenda da turma e traga as questões que quer revisar.'),
  (5,'Encontro com as famílias','A coordenação vai apresentar os próximos projetos do bimestre.'),
  (8,'Acompanhamento dos boletins','Os boletins publicados ficam disponíveis no portal escolar.'),
  (12,'Revisão das atividades','Confira os prazos e materiais na área de atividades.')
) t(n,title,body) cross join lateral (select gen_random_uuid() as id where c.id is not null and t.n>0) x;

insert into pies.cases(school,id,record)
select c.school,x.id,jsonb_build_object('id',x.id,'classId',c.id,'studentId',s.id,'title',
  'Acompanhamento de aprendizagem','action','Revisar a estratégia em uma atividade breve e registrar um retorno.',
  'owner',a.id,'ownerName',a.name,'due',today+c.group_number,'state','Em acompanhamento','result','')
from seed_classes c join seed_students s using(school,group_number)
join pies.accounts a on a.school=c.school and a.role='coordenacao' cross join seed_clock
cross join lateral (select gen_random_uuid() as id where s.id is not null and c.id is not null) x
where c.subject_number=1 and s.seat between 3 and 5;

insert into pies.justifications(school,id,record)
select l.school,x.id,jsonb_build_object('id',x.id,'classId',l.class_id,'lessonId',l.id,'studentId',a.student_id,
 'day',l.day,'reason','Consulta agendada no horário da aula.','state','Pendente','response','')
from seed_lessons l join pies.attendance a on a.school=l.school and a.lesson_id=l.id
join seed_students s on s.id=a.student_id cross join seed_clock
cross join lateral (select gen_random_uuid() as id where l.id is not null and a.student_id is not null) x
where a.status='Falta' and s.seat<=2 and l.day>=today-21;
