import { BookOpen, GraduationCap, School, Users } from "lucide-react";
import React, { useState } from "react";
import {
  Form,
  Field,
  Panel,
  Table,
  Print,
  br,
  opts,
  nameOf,
  nowDate,
  download,
  parseCsv,
  grade,
  RecordCards,
  RecordCard,
} from "./ui.jsx";

export const roles = {
  secretaria: "Secretaria",
  professor: "Professor",
  coordenacao: "Coordenação",
  rede: "Gestão de rede",
  aluno: "Aluno",
  responsavel: "Responsável",
};
export const stages = [
  "Educação Infantil",
  "Ensino Fundamental",
  "Ensino Médio",
  "EJA",
  "Educação Profissional",
];
export function Accounts({ state, send, user }) {
  return (
    <>
      <Panel title="Contas da escola">
        <RecordCards limit={9}>
          {state.accounts.map((a) => (
            <RecordCard
              key={a.id}
              title={a.name}
              eyebrow={roles[a.role]}
              detail={a.email}
              icon={Users}
              tone={a.active ? "green" : "gold"}
              action={
                a.id === user.id || a.role === "rede"
                  ? undefined
                  : a.active
                    ? "Suspender"
                    : "Reativar"
              }
              onOpen={() => send("deactivate", { id: a.id, active: !a.active })}
            >
              <span className="school-pill">
                {a.active ? "Ativo" : "Suspenso"}
              </span>
            </RecordCard>
          ))}
        </RecordCards>
      </Panel>
      <Panel title="Criar conta">
        <Form onSubmit={(d) => send("account", d)}>
          <Field label="Nome" name="name" />
          <Field label="E-mail" name="email" type="email" />
          <Field
            label="Perfil"
            name="role"
            options={Object.entries(roles).filter(([r]) => r !== "rede")}
          />
          <Field
            label="Senha inicial"
            name="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
          />
        </Form>
      </Panel>
    </>
  );
}
export function Enrollment({ state, send }) {
  const [editing, setEditing] = useState(null),
    [movement, setMovement] = useState(null),
    [movementStudent, setMovementStudent] = useState(""),
    [document, setDocument] = useState(null),
    [preview, setPreview] = useState([]),
    [csvError, setCsvError] = useState(""),
    [filter, setFilter] = useState("");
  const visible = state.students.filter((x) =>
    `${x.name} ${x.registration}`
      .toLocaleLowerCase("pt-BR")
      .includes(filter.toLocaleLowerCase("pt-BR")),
  );
  const pupil = state.students.find((x) => x.id === document);
  const current = state.enrollments.filter((x) => !x.end);
  async function read(file) {
    setCsvError("");
    setPreview([]);
    if (!file) return;
    try {
      if (file.size > 300_000) throw Error("Escolha um CSV de até 300 KB.");
      setPreview(parseCsv(await file.text()));
    } catch (error) {
      setCsvError(error.message);
    }
  }
  return (
    <>
      <Panel title="Estudantes e vínculos">
        <label className="school-filter">
          Buscar estudante
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <RecordCards key={filter} limit={9}>
          {visible.map((s) => {
            const groups = [
              ...new Set(
                current
                  .filter((e) => e.studentId === s.id)
                  .map((e) => {
                    const c = state.classes.find((c) => c.id === e.classId);
                    return c?.section || c?.name || "—";
                  }),
              ),
            ];
            return (
              <RecordCard
                key={s.id}
                title={s.name}
                eyebrow={`Matrícula ${s.registration}`}
                detail={groups.join(", ") || "Sem turma ativa"}
                icon={GraduationCap}
              >
                <div className="school-actions">
                  <button onClick={() => setEditing(s)}>Editar vínculos</button>
                  <button onClick={() => setDocument(s.id)}>Documentos</button>
                  <button
                    onClick={() => {
                      setMovementStudent(s.id);
                      setMovement(null);
                      requestAnimationFrame(() =>
                        window.document
                          .querySelector("#situacao-matricula")
                          ?.scrollIntoView({ block: "start" }),
                      );
                    }}
                  >
                    Movimentações
                  </button>
                </div>
              </RecordCard>
            );
          })}
        </RecordCards>
      </Panel>
      {pupil && (
        <Panel
          className="print-target"
          title="Declaração e histórico de matrícula"
          subtitle={state.name}
        >
          <h3>
            {pupil.name} · matrícula {pupil.registration}
          </h3>
          <Table
            columns={["Turma", "Início", "Encerramento", "Situação"]}
            rows={state.enrollments
              .filter((e) => e.studentId === pupil.id)
              .map((e) => [
                e.id,
                nameOf(state.classes, e.classId),
                br(e.start),
                br(e.end),
                e.result || "Matriculado",
              ])}
          />
          <h3>Resultados publicados</h3>
          <Table
            columns={["Turma", "Período", "Média", "Frequência"]}
            rows={state.closures.flatMap((c) =>
              (c.publicRows || [])
                .filter((r) => r.studentId === pupil.id)
                .map((r) => [
                  c.id,
                  nameOf(state.classes, c.classId),
                  nameOf(state.periods, c.periodId),
                  grade(r.average),
                  r.attendance == null ? "—" : `${grade(r.attendance)}%`,
                ]),
            )}
          />
          <p className="school-caption">Emitido em {br(nowDate())}.</p>
          <Print />
          <button
            className="school-secondary school-no-print"
            onClick={() => setDocument(null)}
          >
            Fechar documento
          </button>
        </Panel>
      )}
      <div className="school-grid">
        <Panel
          title={
            editing ? "Editar estudante e vínculos" : "Cadastrar estudante"
          }
        >
          <Form
            key={editing?.id || "new"}
            onSubmit={async (d, f) => {
              if (
                await send("student", {
                  ...d,
                  id: editing?.id,
                  guardians: f.getAll("guardians"),
                })
              )
                setEditing(null);
            }}
          >
            <Field
              label="Nome do estudante"
              name="name"
              value={editing?.name}
            />
            <Field
              label="Número de matrícula"
              name="registration"
              value={editing?.registration}
            />
            <Field
              label="Identificador Inep"
              name="inep"
              value={editing?.inep}
              optional
            />
            <Field
              label="Conta do aluno"
              name="account"
              options={opts(
                state.accounts.filter((a) => a.role === "aluno" && a.active),
              )}
              value={editing?.account || ""}
              optional
            />
            <Field
              label="Responsáveis vinculados"
              name="guardians"
              options={opts(
                state.accounts.filter(
                  (a) => a.role === "responsavel" && a.active,
                ),
              )}
              value={editing?.guardians || []}
              multiple
              optional
            />
          </Form>
          {editing && (
            <button
              className="school-secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar edição
            </button>
          )}
        </Panel>
        <Panel title="Efetivar ou renovar matrícula">
          <Form button="Efetivar matrícula" onSubmit={(d) => send("enroll", d)}>
            <Field
              label="Estudante"
              name="studentId"
              options={opts(state.students)}
            />
            <Field
              label="Turma de destino"
              name="classId"
              options={opts(state.classes)}
            />
            <Field
              label="Início da matrícula"
              name="start"
              type="date"
              value={nowDate()}
            />
          </Form>
        </Panel>
      </div>
      <Panel title="Movimentação e situação final">
        <div id="situacao-matricula">
          <label className="school-filter">
            Estudante da movimentação
            <select
              value={movementStudent}
              onChange={(e) => {
                setMovementStudent(e.target.value);
                setMovement(null);
              }}
            >
              <option value="">Selecione</option>
              {state.students.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <RecordCards
          empty={
            movementStudent
              ? "Nenhuma matrícula encontrada."
              : "Escolha um estudante para ver seu histórico de matrículas."
          }
        >
          {state.enrollments
            .filter((e) => e.studentId === movementStudent)
            .map((e) => (
              <RecordCard
                key={e.id}
                title={nameOf(state.classes, e.classId)}
                eyebrow={e.result || "Matriculado"}
                detail={`${br(e.start)}${e.end ? " a " + br(e.end) : ""}`}
                icon={School}
                action={!e.end ? "Registrar situação" : undefined}
                onOpen={() => setMovement(e)}
              />
            ))}
        </RecordCards>
        {movement && (
          <div className="school-grid">
            <Form
              title={`Movimentar ${nameOf(state.students, movement.studentId)}`}
              button="Registrar movimentação"
              onSubmit={async (d) => {
                if (await send("move", { ...d, id: movement.id }))
                  setMovement(null);
              }}
            >
              <Field
                label="Data da movimentação"
                name="day"
                type="date"
                value={nowDate()}
              />
              <Field
                label="Motivo"
                name="result"
                options={[
                  "Transferido",
                  "Mudança de turma",
                  "Deixou de frequentar",
                  "Falecido",
                  "Cancelado",
                ]}
              />
              <Field
                label="Nova turma para mudança interna"
                name="to"
                options={opts(
                  state.classes.filter((c) => c.id !== movement.classId),
                )}
                optional
              />
            </Form>
            <Form
              title="Resultado final"
              button="Registrar resultado"
              onSubmit={async (d) => {
                if (await send("result", { ...d, id: movement.id }))
                  setMovement(null);
              }}
            >
              <Field
                label="Resultado"
                name="result"
                options={[
                  "Aprovado",
                  "Reprovado",
                  "Em andamento",
                  "Sem movimentação",
                ]}
              />
            </Form>
          </div>
        )}
      </Panel>
      <Panel title="Importar estudantes">
        <button
          className="school-secondary"
          onClick={() =>
            download(
              "modelo-estudantes.csv",
              ["nome", "matricula", "inep"],
              [["Luiza Lima", "2026001", ""]],
            )
          }
        >
          Baixar modelo CSV
        </button>
        <label className="school-filter">
          Arquivo CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => read(e.target.files[0])}
          />
        </label>
        {csvError && <p role="alert">{csvError}</p>}
        {preview.length > 0 && (
          <>
            <Table
              columns={["Nome", "Matrícula", "Inep"]}
              rows={preview.map((x, i) => [i, x.name, x.registration, x.inep])}
            />
            <Form
              button={`Importar ${preview.length} estudante(s)`}
              onSubmit={async (d) => {
                if (
                  await send("import", {
                    students: preview.map((x) => ({
                      ...x,
                      classId: d.classId,
                      start: d.start,
                    })),
                  })
                )
                  setPreview([]);
              }}
            >
              <Field
                label="Enturmar estudantes em"
                name="classId"
                options={opts(state.classes)}
                optional
              />
              <Field
                label="Início das matrículas"
                name="start"
                type="date"
                value={nowDate()}
              />
            </Form>
          </>
        )}
      </Panel>
    </>
  );
}
export function Classes({ state, send, office }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [shift, setShift] = useState("");
  const [subject, setSubject] = useState("");
  const subjects = [...new Set(state.classes.map((c) => c.subject))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
  const visible = state.classes.filter(
    (c) =>
      (!shift || c.shift === shift) &&
      (!subject || c.subject === subject) &&
      `${c.name} ${c.year}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <Panel title="Turmas e horários">
        <div className="school-filters">
          <label>
            Buscar por turma ou ano
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Turno da turma
            <select value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="">Todos os turnos</option>
              {[...new Set(state.classes.map((c) => c.shift))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Filtrar por disciplina
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Todas as disciplinas</option>
              {subjects.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="school-caption" aria-live="polite">
          {visible.length} de {state.classes.length} registros de turma e
          disciplina
        </p>
        <RecordCards
          key={search + shift + subject}
          limit={12}
          empty="Nenhuma turma corresponde aos filtros."
        >
          {visible.map((c) => (
            <RecordCard
              key={c.id}
              title={c.section || c.name}
              eyebrow={`${c.shift} · ${c.year}`}
              detail={c.subject}
              icon={BookOpen}
              tone={c.shift === "Manhã" ? "blue" : "green"}
              action={office ? "Editar turma" : undefined}
              onOpen={() => setEditing(c)}
            >
              <p className="record-detail school-pre">{c.timetable}</p>
              <p className="record-detail">
                {c.teachers.map((id) => nameOf(state.assignees, id)).join(", ")}
              </p>
            </RecordCard>
          ))}
        </RecordCards>
      </Panel>
      {office && (
        <Panel title={editing ? "Editar turma" : "Criar turma"}>
          <Form
            key={editing?.id || "new"}
            onSubmit={async (d, f) => {
              if (
                await send("class", {
                  ...d,
                  id: editing?.id,
                  teachers: f.getAll("teachers"),
                })
              )
                setEditing(null);
            }}
          >
            <Field label="Nome da turma" name="name" value={editing?.name} />
            <Field
              label="Etapa de ensino"
              name="stage"
              options={stages}
              value={editing?.stage}
              optional={!!editing}
              disabled={!!editing}
            />
            {editing && (
              <input type="hidden" name="stage" value={editing.stage} />
            )}
            <Field
              label="Componente curricular"
              name="subject"
              value={editing?.subject}
            />
            <Field
              label="Ano letivo"
              name="year"
              type="number"
              min={2000}
              max={2100}
              value={editing?.year || state.policy.year}
              readOnly={!!editing}
            />
            <Field
              label="Turno"
              name="shift"
              options={["Manhã", "Tarde", "Noite", "Integral"]}
              value={editing?.shift}
            />
            <Field
              label="Professor(es) da turma"
              name="teachers"
              options={opts(
                state.accounts.filter(
                  (a) => a.role === "professor" && a.active,
                ),
              )}
              value={editing?.teachers || []}
              multiple
            />
            <Field
              label="Horários das aulas"
              name="timetable"
              type="textarea"
              value={editing?.timetable}
              placeholder="Segunda, 08:00–08:50"
              optional
            />
          </Form>
          {editing && (
            <button
              className="school-secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar edição
            </button>
          )}
        </Panel>
      )}
    </>
  );
}
export function Reports({ state }) {
  const [classId, setClassId] = useState(""),
    [periodId, setPeriodId] = useState("");
  const selected = state.closures.filter(
    (c) =>
      (!classId || c.classId === classId) &&
      (!periodId || c.periodId === periodId) &&
      c.publicRows,
  );
  const census = state.enrollments.map((e) => {
    const student = state.students.find((s) => s.id === e.studentId);
    const c = state.classes.find((c) => c.id === e.classId);
    return [
      student.inep,
      student.registration,
      student.name,
      c.name,
      c.stage,
      c.year,
      e.start,
      e.end,
      e.result,
    ];
  });
  return (
    <>
      <Panel
        title="Preparação do Censo Escolar"
        subtitle="Conferência de matrícula inicial, rendimento e movimento para revisão pela secretaria."
      >
        <p>
          {census.length} vínculo(s) · {census.filter((r) => !r[0]).length} sem
          identificador Inep · {census.filter((r) => !r[8]).length} sem situação
          final registrada.
        </p>
        <div className="school-actions">
          <button
            onClick={() =>
              download(
                "conferencia-matricula-inicial.csv",
                [
                  "inep",
                  "matricula",
                  "estudante",
                  "turma",
                  "etapa",
                  "ano",
                  "inicio",
                ],
                census.map((r) => r.slice(0, 7)),
              )
            }
          >
            Exportar matrícula inicial
          </button>
          <button
            onClick={() =>
              download(
                "conferencia-situacao-aluno.csv",
                [
                  "inep",
                  "matricula",
                  "estudante",
                  "turma",
                  "etapa",
                  "ano",
                  "inicio",
                  "encerramento",
                  "situacao",
                ],
                census,
              )
            }
          >
            Exportar situação do aluno
          </button>
        </div>
        <p className="school-caption">
          Os CSVs são para conferência e integração com o sistema da rede. A
          transmissão é feita no Educacenso conforme o leiaute da coleta.
        </p>
      </Panel>
      <Panel title="Boletins publicados">
        <div className="school-filters">
          <label>
            Turma
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Todas</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Período
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
            >
              <option value="">Todos</option>
              {state.periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <RecordCards
          key={classId + periodId}
          limit={6}
          empty="Nenhum boletim publicado na seleção."
        >
          {selected.map((c) => (
            <RecordCard
              key={c.id}
              title={nameOf(state.classes, c.classId)}
              eyebrow={nameOf(state.periods, c.periodId)}
              detail={`${c.publicRows.length} boletins publicados`}
              icon={BookOpen}
              action="Baixar boletins da turma"
              onOpen={() =>
                download(
                  "boletins-da-turma.csv",
                  ["estudante", "media", "frequencia"],
                  c.publicRows.map((r) => [r.name, r.average, r.attendance]),
                )
              }
            />
          ))}
        </RecordCards>
        <button
          className="school-secondary"
          disabled={!selected.length}
          onClick={() =>
            download(
              "boletins.csv",
              ["turma", "periodo", "estudante", "media", "frequencia"],
              selected.flatMap((c) =>
                c.publicRows.map((r) => [
                  nameOf(state.classes, c.classId),
                  nameOf(state.periods, c.periodId),
                  r.name,
                  r.average,
                  r.attendance,
                ]),
              ),
            )
          }
        >
          Exportar boletins
        </button>
      </Panel>
      <Panel title="Registro de alterações">
        <RecordCards limit={6} empty="Nenhuma alteração registrada.">
          {state.audit.map((a) => {
            const action =
              {
                student: "Cadastro de estudante",
                enroll: "Matrícula",
                move: "Movimentação",
                result: "Resultado final",
                class: "Turma",
                lesson: "Diário de classe",
                grade: "Nota ou devolutiva",
                closure: "Fechamento",
                assessment: "Avaliação",
                case: "Acompanhamento",
                notice: "Comunicado",
                account: "Conta",
                deactivate: "Acesso",
                period: "Período",
                policy: "Regras escolares",
                event: "Calendário",
                decide: "Análise de justificativa",
                justify: "Justificativa",
                import: "Importação",
                submission: "Entrega",
              }[a.kind] || a.kind;
            return (
              <RecordCard
                key={a.id}
                title={action}
                eyebrow={new Date(a.at).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
                detail={a.account}
              >
                {(a.reason || a.action) && (
                  <p className="record-detail">{a.reason || a.action}</p>
                )}
              </RecordCard>
            );
          })}
        </RecordCards>
      </Panel>
    </>
  );
}
