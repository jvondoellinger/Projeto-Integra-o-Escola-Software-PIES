import React, { useEffect, useState } from "react";
import { ChevronRight, Ellipsis, House } from "lucide-react";
import { ActionDialog } from "./ui.jsx";

const shortcuts = {
  aluno: ["inicio", "atividades", "agenda", "familia"],
  responsavel: ["inicio", "familia", "agenda", "comunicados"],
  professor: ["inicio", "diario", "avaliacoes", "agenda"],
  coordenacao: ["inicio", "diario", "apoio", "agenda"],
  secretaria: ["inicio", "matriculas", "turmas", "agenda"],
  rede: ["inicio", "comunicados"],
};

const labels = {
  inicio: "Início",
  atividades: "Atividades",
  agenda: "Agenda",
  familia: "Boletins",
  diario: "Diário",
  avaliacoes: "Avaliações",
  apoio: "Apoio",
  matriculas: "Matrículas",
  turmas: "Turmas",
  comunicados: "Recados",
};

export default function MobileNavigation({
  areas,
  current,
  role,
  onNavigate,
  exit,
}) {
  const [expanded, setExpanded] = useState(false);
  const tabs = (shortcuts[role] || ["inicio"])
    .map((id) => areas.find(([area]) => area === id))
    .filter(Boolean);
  const otherAreas = areas.filter(
    ([id]) => !tabs.some(([tabId]) => tabId === id),
  );

  useEffect(() => {
    if (!expanded) return;
    const mobile = window.matchMedia("(max-width: 820px)");
    const close = () => setExpanded(false);
    mobile.addEventListener("change", close);
    window.addEventListener("hashchange", close);
    return () => {
      mobile.removeEventListener("change", close);
      window.removeEventListener("hashchange", close);
    };
  }, [expanded]);

  function openArea(id) {
    setExpanded(false);
    onNavigate(id);
    requestAnimationFrame(() => {
      document.getElementById("conteudo")?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      <nav className="school-mobile-nav" aria-label="Navegação móvel do PIES">
        {tabs.map(([id, , AreaIcon]) => {
          const Icon = id === "inicio" ? House : AreaIcon;
          return (
            <button
              key={id}
              type="button"
              aria-current={current === id ? "page" : undefined}
              onClick={() => onNavigate(id)}
            >
              <span className="school-tab-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              {labels[id]}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Mais áreas"
          aria-haspopup="dialog"
          aria-expanded={expanded}
          data-active={otherAreas.some(([id]) => id === current)}
          onClick={() => setExpanded(true)}
        >
          <span className="school-tab-icon" aria-hidden="true">
            <Ellipsis size={23} />
          </span>
          Mais
        </button>
      </nav>
      <ActionDialog
        title="Mais áreas"
        className="school-mobile-sheet"
        open={expanded}
        onDismiss={() => setExpanded(false)}
      >
        <nav className="school-sheet-areas" aria-label="Outras áreas do PIES">
          {otherAreas.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-current={current === id ? "page" : undefined}
              onClick={() => openArea(id)}
            >
              <Icon size={19} aria-hidden="true" />
              {label}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ))}
        </nav>
        <div className="school-sheet-footer">{exit}</div>
      </ActionDialog>
    </>
  );
}
