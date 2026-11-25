-- Separate given names and surnames from the US Census aggregate tables.
-- They are paired here for the academic roster, without importing individual records.
-- https://www.census.gov/topics/population/genealogy/data/2020_names.html

-- Coordinate with the API's school version check before editing the roster.
select id from pies.schools where network = 'Rede Horizonte' order by id for update;

create temporary table pies_new_student_names (
  position integer primary key,
  given_name text not null unique,
  family_name text not null unique
) on commit drop;

insert into pies_new_student_names(position, given_name, family_name)
select position, given_name, family_name
from unnest(
  regexp_split_to_array(trim($given$William John Johnny Mary Theodore Colton Peyton Danny Anna Alice Michael Savannah Samuel Eli Chloe
Seth Bradley Mia Deanna Jonathan Joan Joseph Anne Theresa Brianna Derek Richard Crystal Christian
Levi Barry Marilyn Yvonne Natalie Charles Autumn Hannah Lily Aiden Allison April Tony Chelsea
Cynthia Ryan Rafael Keith Jacqueline Anthony Jeffery Tim Edward Marlene Alan Judith Tyler Amanda
Connor Sophia Amber Isaac Hayden Annie Eleanor Laura Ruby Norma Ella Noah Carolyn Nicole Stephen
Gloria Kyle Kristina Samantha Betty Tara Andre Harold Paige Margaret Troy Frederick Leah Sandra
James Wayne Louis Brenda Rachel Leo Gary Michele Naomi Joel Mason Beth Steven Melanie Julio Cindy
Jacob Kristen Cameron Calvin Veronica Dale Kaylee Walter Vanessa Judy Ethan Sean Hailey Zoe Audrey
Wanda Wendy Jack Taylor Janice Thomas Robin Brittany Ronald Kimberly Evan Aaron Lauren Ricardo
Andrea Rhonda Diego Jeff Jackie Vincent Addison Oliver Alex Alyssa Jill Teresa Alexis Randy Debra
Angel Jayden Jake Susan Max Cecilia Vivian Nick Mario Jeffrey Kathryn Lynn Jay Marcus Brett Glenn
Caroline Ruben Marvin Sharon Linda Bruce Deborah Dan Brandon Holly Sylvia Gail Joy Sam Denise
Lydia Dylan Kim Travis Sara Liam Henry Oscar Joyce Joanne Gabriella Ernest Frances Olivia Jeremy
Aidan Albert Larry Claudia Francis Carla Monica Helen Shirley Kathleen Shane Owen Todd Barbara
Lindsey Justin Christine George Donna Emily Don Eva Cole Elena Gina Gerald Jenny Billy Nathaniel
Matt Timothy Kelsey Edwin Laurie Carrie Willie Frank Stephanie Ruth Nancy Erika Alexander Jon
Destiny Shawn Debbie Brayden Andres Dorothy Grant Marcia Annette Jamie Sherry Kaitlyn Katherine
Greg Erica Tracy Sally Kelly Erin Darlene Ashley Stanley Heidi Christina Nicholas Grace Dana Julia
Emma Rodney Christopher Colin Tiffany Matthew Parker Megan Isaiah Nora Ava Lindsay Allen Martha
Lucas Sarah Sabrina Jane Molly Patrick Wesley Lillian Raymond Julie Joe Gabriel Erik Charlotte
Lois Adam Casey Nathan Peggy Marc Roy Dawn Jason Elaine Tammy Patricia Tamara Steve Benjamin Cathy
Curtis Evelyn Bonnie Eugene Russell Katie Lawrence Tina Ben Leonard Ann Tanya Riley Catherine
Pamela Paula Howard Jeremiah Bryce Melissa Virginia Derrick Avery Martin Gavin Devin Janet Eddie
Spencer Andrew Corey Clara Scott Madeline Sheila Cassandra Doris Robert Alison Brian Lee Joshua
Dean Jesse Irene Zachary Austin Diana Phyllis Wyatt Jackson David Rebecca Xavier Ellen Garrett
Miriam Douglas Heather Stacy Jimmy Bailey Rita Maureen Lisa Aubrey Mitchell Connie Philip Courtney
Jean Ray Lucy Cheryl Eric Adrian Craig Logan Luke Rose Madison Amy Lori Kenneth Victoria Karla
Gabrielle Mark Sonia Brent Phillip Omar Mike Sebastian Trevor Brooke Marco Blake Dennis Fred Ricky
Cody Joann Suzanne Josephine Tristan Michelle Arthur Kayla Mackenzie Chase Regina Renee Paul Vicki
Sydney Diane Hunter Carl Terry Gregory Valerie Haley Carol Jasmine Elijah Alexandra Jenna Claire
Rosemary Leslie Marissa Carson Josh Jennifer Katelyn Esther Dustin Ivan Abigail Dominic Caleb
Marie Alexa Edgar Kathy Sofia Morgan Danielle Jerry Donald Kristin Peter Amelia Randall Stacey
Bryan Bobby Elizabeth Jessica Harry Faith Jaime Melinda Shannon Shelby Carter Eileen Cory Anita
Tom Karen Colleen Terri Lorraine Ralph Isabella Angela Yolanda Chad Landon Jordan Beverly Julian
Kevin Norman Chris Jared Ian Roger Daniel Melvin Cesar$given$), '[[:space:]]+'),
  regexp_split_to_array(trim($family$Bennett Carter Brooks Parker Harmon Jensen Wu Deleon Quinn Little Avila Meyer Wells McGee
Velasquez McLaughlin Caldwell Cobb Haynes Molina Ward Townsend Sandoval Gallegos Ray Weaver Lewis
Ellis Moody Jackson Mullins Foster Griffith Cabrera McCormick Zamora White Doe Gill Austin Ball
Mitchell Guerrero Daniel Park Carpenter Horton Kelly Logan Anderson Osborne Bowman Mason Valdez
Mann Mendez Walters Alvarado Higgins Allen Bailey Gonzales Dean Frazier Moreno Byrd Person Wood
Howard Barker Brady Keller Washington Ochoa Adams Andrews Harris Graves Potter Sims Russell Santos
Moran Bush Jennings Maxwell Vasquez Strickland Rodgers Rivas Bradley Herrera Miles Andrade Shah
Brown Stephens Hanson Hodges Schwartz Fuller Leon Johnston Wheeler Hill Baldwin Hoffman Schmidt
Schultz Phillips Simpson Jacobs Le Johnson Manning Stewart Bell Blake Snyder Chandler Collins
Bauer Duran Huynh Gilbert Hayes Buchanan Hart Scott Rogers Walton Mueller Joseph Steele Kennedy
Oliver Estrada Williamson Alexander Paul Glover Ayala Santiago Wong Campos Cunningham Acosta Shaw
Blair Ali Swanson Newman Hudson Shelton Burton Hunter Howell Daniels McDaniel Fitzgerald Love
Moore French Bates Fowler Chapman Hamilton Elliott Fuentes Simon Watkins Weber Hampton Holmes
Willis Young Dixon Cohen Stanley Gordon Schroeder Hammond Charles Reed Mercado Ahmed Vaughn Norman
Harrison Cortez Jones Farmer Malone Lindsey Simmons West Castaneda Lara Davidson Tate Armstrong
Adkins Hansen Liu Villarreal Villanueva Reeves Gallagher Lowe Mills Calderon Espinoza Pena Dunn
Juarez Fletcher Pearson Page Hogan Lambert Neal Hunt Christensen Gibbs Yu Curtis Murphy Webb
Walker Watson Rice Davis Morgan Cardenas Franco Doyle Yoder Miller Cole Gross Hale Walsh Suarez
Thomas Guerra Fleming Barnett Francis Holt Patterson Serrano McCarthy Mejia Porter Lynch Clarke
Brewer Freeman Roberts Marshall Gray Day Peters Mack Patton Chang Henry Douglas Jenkins Wolfe
Warren Hardy Trujillo Norris Nelson Coleman Lawson Vega Ferguson Macias Sullivan Richards Ryan
Chavez Barton Barber Myers Morris Spencer Velazquez Hubbard Crawford Terry Grant Boyd Lloyd Knight
Cannon Murray Parsons Montgomery Tyler Gardner Flynn Robles Lin Martin Wade Parks Evans Bowers
Olson Sharp Cross Wagner Powell Salazar Reid Larson Hopkins Williams Hall Gregory Cox Rose Miranda
Kramer Floyd Robinson James Henderson Becker Webster Arnold Banks Riley Turner Price Rosales Chan
Harrington Griffin Barnes King Sherman McCoy Wolf Valencia Burns Tucker Fischer Reese Welch
Matthews Peterson Cervantes Figueroa Fox Franklin Bowen Stevens Dominguez Cook McKinney Dennis
Robertson Berry Garner Thornton Saunders Jimenez Goodman Pham Todd Goodwin Palmer Graham Rios
Carrillo Hawkins Lane Fields Pacheco May Woods Maldonado Green Lyons Wright Watts Navarro Craig
Aguirre McGuire Pope Benson Ramsey Hines Conner Hicks Smith McDonald Gibson Contreras Stone
Carroll Warner Luna Erickson Sparks Clark Bishop Garza Schneider Powers Hughes McBride Moss Colon
Taylor Morrison Garrett Burgess Campbell Carlson Wise Wallace Robbins Pineda Salinas Carr Ingram
Oconnor Rowe Richardson Butler Zimmerman Nichols Chambers Ibarra Lucas Marquez Kelley Harvey Curry
Pierce Reynolds Owens Orozco Hartman Baker Obrien Fisher Long Wilson Ross Ortega Munoz Solis
Camacho Montoya Escobar Nunez Waters Cooper Klein Cummings Duncan Perkins Thompson Edwards Leonard
Newton Harper Lawrence Delacruz Santana Salas Bryant Holland Sutton Huang Stevenson George Greene
Roman Dawson Padilla Payne Ford Frank Beck Casey Jordan Black Sanders Rhodes Burke Barrett Perry$family$), '[[:space:]]+')
) with ordinality as names(given_name, family_name, position);

create temporary table pies_student_renames on commit drop as
with seeded as (
  select student.school, student.id, student.account_id,
    row_number() over(order by student.registration, student.id) as position
  from pies.students student
  join pies.schools school on school.id = student.school
  where school.network = 'Rede Horizonte'
    and school.name in ('Colégio Horizonte', 'Colégio Horizonte · Unidade Parque')
    and student.registration ~ '^[0-9]{4}-[0-9]{4}$'
    and right(student.registration, 4) between '0001' and '0505'
    and student.record->>'name' not in (
      'Jorge Armando Von Doellinger', 'Leonardo dos Santos Magalhães',
      'Daniele Todão Souza', 'Davi Henrique Moreira Neves', 'Kaue Barbosa Luzia'
    )
)
select seeded.school, seeded.id, seeded.account_id,
  concat_ws(' ', names.given_name, names.family_name) as name
from seeded join pies_new_student_names names using(position);

do $$
begin
  if (select count(*) from pies_student_renames) <> 500 then
    raise exception 'A carga deve identificar exatamente 500 alunos para renomear.';
  end if;
end $$;

update pies.students student
set record = jsonb_set(student.record, '{name}', to_jsonb(rename.name))
from pies_student_renames rename
where student.school = rename.school and student.id = rename.id;

update pies.accounts account
set name = rename.name
from pies_student_renames rename
where account.school = rename.school and account.id = rename.account_id;

-- The labels of already issued report rows follow the corrected student name.
-- Scores, attendance, publication date and the original order are preserved.
with closure_rows as (
  select closure.school, closure.id, field.key,
    jsonb_agg(
      case when rename.name is null then student.value
        else jsonb_set(student.value, '{name}', to_jsonb(rename.name))
      end order by student.position
    ) as rows
  from pies.closures closure
  cross join lateral jsonb_each(closure.record) field
  cross join lateral jsonb_array_elements(
    case when field.key in ('rows', 'publicRows') and jsonb_typeof(field.value) = 'array'
      then field.value else '[]'::jsonb end
  ) with ordinality student(value, position)
  left join pies_student_renames rename
    on rename.school = closure.school and rename.id = (student.value->>'studentId')::uuid
  group by closure.school, closure.id, field.key
), patches as (
  select school, id, jsonb_object_agg(key, rows) as record
  from closure_rows
  group by school, id
)
update pies.closures closure
set record = closure.record || patches.record
from patches
where closure.school = patches.school and closure.id = patches.id;

update pies.schools school
set version = version + 1
where exists (select 1 from pies_student_renames rename where rename.school = school.id);
