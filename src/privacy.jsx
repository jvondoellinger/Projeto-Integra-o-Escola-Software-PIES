import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, X, Download, Trash2, Settings } from "lucide-react";
const CONSENT = "pies-privacy-v1";
export function readConsent() {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT));
    return v?.version === 1 && v.expires > Date.now() ? v : null;
  } catch {
    return null;
  }
}
export function saveConsent(functional) {
  const v = {
    version: 1,
    functional,
    updated: new Date().toISOString(),
    expires: Date.now() + 180 * 86400000,
  };
  try {
    localStorage.setItem(CONSENT, JSON.stringify(v));
    if (!functional) localStorage.removeItem("pies-preferences");
    return v;
  } catch {
    return v;
  }
}
export function CookieNotice({ consent, onSave, openPreferences, go }) {
  if (consent) return null;
  return (
    <section className="cookie-banner" aria-label="Privacidade e armazenamento">
      <span className="cookie-symbol">
        <ShieldCheck size={25} />
      </span>
      <div>
        <h2>Sua privacidade também importa.</h2>
        <p>
          Usamos armazenamento essencial para manter esta sessão e sua escolha
          de privacidade. Preferências de visualização são opcionais. Não usamos
          publicidade nem rastreadores.{" "}
          <button className="inline-link" onClick={() => go("Privacidade")}>
            Conheça o uso dos dados
          </button>
          .
        </p>
      </div>
      <div className="cookie-actions">
        <button className="button secondary" onClick={() => onSave(false)}>
          Somente essenciais
        </button>
        <button className="button" onClick={() => onSave(true)}>
          Aceitar preferências
        </button>
        <button className="inline-link" onClick={openPreferences}>
          Personalizar
        </button>
      </div>
    </section>
  );
}
export function CookieDialog({ open, onClose, consent, onSave }) {
  const ref = useRef(null),
    [functional, setFunctional] = useState(!!consent?.functional);
  useEffect(() => {
    if (open) {
      setFunctional(!!consent?.functional);
      ref.current.showModal();
    } else if (ref.current.open) ref.current.close();
  }, [open, consent]);
  return (
    <dialog
      ref={ref}
      className="cookie-dialog"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="section-title">
        <h2>Preferências de privacidade</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar preferências"
        >
          <X size={20} />
        </button>
      </div>
      <p>
        Você pode alterar sua escolha a qualquer momento pelo link Cookies no
        rodapé.
      </p>
      <div className="consent-option">
        <div>
          <strong>Essenciais</strong>
          <p>
            Dados escolares neste navegador; sua escolha de privacidade por até
            180 dias.
          </p>
        </div>
        <span className="badge green">Sempre ativos</span>
      </div>
      <label className="consent-option">
        <div>
          <strong>Preferências de visualização</strong>
          <p>
            Lembrar a densidade da tabela e a redução de movimento neste
            navegador.
          </p>
        </div>
        <input
          type="checkbox"
          checked={functional}
          onChange={(e) => setFunctional(e.target.checked)}
        />
      </label>
      <p className="caption">
        Sem cookies de anúncios, ferramentas analíticas ou conteúdo externo. A
        escolha não afeta o acompanhamento pedagógico.
      </p>
      <div className="form-actions">
        <button className="button secondary" onClick={() => onSave(false)}>
          Somente essenciais
        </button>
        <button className="button" onClick={() => onSave(functional)}>
          Salvar escolha
        </button>
      </div>
    </dialog>
  );
}
export function PrivacyPage({
  page,
  consent,
  openPreferences,
  toast,
  preferences,
  setPreferences,
  clearSession,
}) {
  const [requestType, setRequestType] = useState("Acesso aos dados"),
    [requestText, setRequestText] = useState("");
  function downloadRequest(e) {
    e.preventDefault();
    const content = `SOLICITAÇÃO SOBRE DADOS PESSOAIS\n\nTipo: ${requestType}\nData: ${new Date().toLocaleDateString("pt-BR")}\n\n${requestText}\n\nEncaminhar à administração da instituição por canal oficial. A instituição deve verificar a identidade e avaliar o pedido conforme a legislação aplicável.\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "solicitacao-de-privacidade.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast(
      "Documento gerado. Encaminhe pelo canal oficial da instituição. Nenhum pedido foi enviado.",
    );
  }
  if (page === "Configurações")
    return (
      <section className="panel legal">
        <h2>Seu espaço, do seu jeito</h2>
        <p>
          As alterações valem para esta sessão. Para lembrá-las nas próximas
          visitas, permita as preferências de visualização.
        </p>
        <label className="consent-option">
          <div>
            <strong>Visualização compacta</strong>
            <p>Reduzir o espaçamento das linhas da tabela.</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.compact}
            onChange={(e) =>
              setPreferences({ ...preferences, compact: e.target.checked })
            }
          />
        </label>
        <label className="consent-option">
          <div>
            <strong>Reduzir movimento</strong>
            <p>Desativar animações e transições da interface.</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                reducedMotion: e.target.checked,
              })
            }
          />
        </label>
        <button className="button secondary" onClick={openPreferences}>
          <Settings size={16} />
          Preferências de cookies
        </button>
        <hr />
        <h2>Dados deste navegador</h2>
        <p>
          Limpar remove avaliações, entregas, notas, planos e registros
          adicionados neste navegador. Os dados iniciais serão restaurados. Não
          há exclusão em servidores.
        </p>
        <button className="button secondary" onClick={clearSession}>
          <Trash2 size={16} />
          Limpar dados deste navegador
        </button>
      </section>
    );
  if (page === "Termos de uso")
    return (
      <article className="panel legal">
        <span className="badge green">
          Atualizado em 24 de novembro de 2026
        </span>
        <h2>Termos de uso do PIES</h2>
        <h3>Finalidade pedagógica</h3>
        <p>
          O PIES apoia o acompanhamento de aprendizagem, o planejamento de
          avaliações e a organização de intervenções. Os indicadores são
          evidências parciais e devem ser interpretados por educadores no
          contexto de cada estudante.
        </p>
        <h3>Responsabilidade no uso</h3>
        <p>
          Não use notas ou alertas para discriminar, rotular capacidades ou
          tomar decisões de alto impacto sem análise humana. Não insira dados
          sensíveis, documentos pessoais ou informações familiares
          desnecessárias em campos livres.
        </p>
        <h3>Arquivos e compartilhamento</h3>
        <p>
          Relatórios baixados ficam sob o cuidado de quem os exporta. Use canais
          institucionais autorizados, compartilhe o mínimo necessário e respeite
          as regras de guarda da instituição.
        </p>
        <h3>Limites desta aplicação</h3>
        <p>
          Avaliações, entregas e notas ficam neste navegador até a limpeza
          manual. Planos e observações ficam na sessão. Não há autenticação,
          sincronização entre dispositivos ou envio de solicitações. Fechar a
          sessão ou limpar o armazenamento pode remover alterações. O acesso a
          esta interface não comprova autorização institucional.
        </p>
        <h3>Antes do uso institucional</h3>
        <p>
          A instituição deve definir regras de acesso, responsabilidades, bases
          legais, prazos de retenção e canais de atendimento. A disponibilização
          deste frontend não atesta conformidade jurídica ou segurança de uma
          operação com dados pessoais.
        </p>
      </article>
    );
  return (
    <>
      <article className="panel legal">
        <span className="badge green">
          <ShieldCheck size={14} />
          Privacidade desde o primeiro passo
        </span>
        <h2>Seus dados merecem cuidado.</h2>
        <p>
          O PIES organiza informações educacionais para apoiar professores. Este
          aviso descreve o funcionamento desta interface e os cuidados
          necessários no uso institucional.
        </p>
        <h3>O que é tratado e para quê</h3>
        <p>
          Nome, turma, matrícula, frequência, resultados de atividades e
          observações pedagógicas são usados para acompanhar aprendizagem e
          planejar apoio. A interface não pede CPF, endereço, dados de saúde ou
          informações familiares.
        </p>
        <h3>Onde as informações ficam</h3>
        <p>
          Avaliações, entregas e notas ficam no armazenamento local deste
          navegador até a limpeza manual. Planos e observações ficam no
          armazenamento da sessão. Não são enviados a um servidor pela
          aplicação. Exportações são arquivos locais. Quem usa um dispositivo
          compartilhado deve limpar a sessão ao terminar.
        </p>
        <h3>Cookies e tecnologias semelhantes</h3>
        <p>
          Não criamos cookies HTTP nem utilizamos publicidade ou rastreamento.
          Usamos sessionStorage para planos e observações e localStorage para
          avaliações, entregas, notas e para lembrar sua escolha de privacidade
          por até 180 dias. Se você permitir, localStorage também guarda as
          preferências de visualização. É possível revogar essa permissão a
          qualquer momento.
        </p>
        <button className="button secondary" onClick={openPreferences}>
          Gerenciar preferências
        </button>
        <p className="caption">
          Escolha atual:{" "}
          {consent
            ? consent.functional
              ? "essenciais e preferências"
              : "somente essenciais"
            : "ainda não registrada"}
          .
        </p>
        <h3>Crianças, adolescentes e revisão humana</h3>
        <p>
          O acompanhamento deve respeitar o melhor interesse do estudante.
          Potencialidades e necessidades de apoio são observações revisáveis por
          professores. Não há diagnóstico clínico nem decisão automatizada sobre
          aprovação, acesso ou oportunidades.
        </p>
        <h3>Responsabilidades da instituição</h3>
        <p>
          No uso institucional, a escola deve identificar o controlador e o
          encarregado, informar os contatos oficiais, estabelecer as bases
          legais por finalidade e definir retenção e acesso. Consentimento para
          preferências do navegador não autoriza todo tratamento de dados
          escolares. Esses parâmetros dependem da operação da instituição e não
          são definidos por este frontend.
        </p>
        <h3>Seus direitos</h3>
        <p>
          Você pode solicitar confirmação de tratamento, acesso, correção,
          informações sobre compartilhamento e demais direitos aplicáveis,
          inclusive revisão de decisões automatizadas quando cabível. Pedidos de
          eliminação estão sujeitos às obrigações de guarda. A administração da
          instituição deve informar o canal oficial de atendimento e verificar a
          identidade do solicitante.
        </p>
        <h3>Fontes e orientações</h3>
        <p>
          <a
            href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"
            target="_blank"
            rel="noreferrer"
          >
            Lei Geral de Proteção de Dados Pessoais
          </a>{" "}
          ·{" "}
          <a
            href="https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais"
            target="_blank"
            rel="noreferrer"
          >
            Guia de cookies da ANPD
          </a>
        </p>
      </article>
      <section className="panel form-panel legal">
        <h2>Prepare uma solicitação</h2>
        <p>
          Gere um documento para encaminhar pelo canal oficial da instituição.
          Este formulário não envia dados nem abre um protocolo. Evite inserir
          documentos de identificação.
        </p>
        <form onSubmit={downloadRequest}>
          <label>
            Tipo de solicitação
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
            >
              {[
                "Acesso aos dados",
                "Correção de informações",
                "Informações sobre compartilhamento",
                "Eliminação de dados",
                "Revisão de decisão",
                "Outros direitos",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Descreva seu pedido
            <textarea
              rows={4}
              maxLength={1500}
              required
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
            />
          </label>
          <button className="button" type="submit">
            <Download size={16} />
            Gerar documento do pedido
          </button>
        </form>
      </section>
    </>
  );
}
