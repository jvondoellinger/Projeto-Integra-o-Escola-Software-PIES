import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { ActionDialog, download, downloadFile, nameOf } from "./ui.jsx";

export function reportGroup(state, closure) {
  return {
    classroom: nameOf(state.classes, closure.classId),
    period: nameOf(state.periods, closure.periodId),
    publishedAt: closure.publishedAt,
    rows: closure.publicRows,
  };
}

export default function ReportDownload({
  school,
  reports,
  trigger = "Baixar boletins da turma",
  triggerClass = "school-secondary",
  includeGroup = false,
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function exportReport(format) {
    setError("");
    setPending(true);
    try {
      if (format === "csv") {
        const prefix = includeGroup ? ["turma", "periodo"] : [];
        download(
          includeGroup ? "boletins.csv" : "boletins-da-turma.csv",
          [...prefix, "estudante", "media", "frequencia"],
          reports.flatMap(({ classroom, period, rows }) =>
            rows.map(({ name, average, attendance }) => [
              ...(includeGroup ? [classroom, period] : []),
              name,
              average,
              attendance,
            ]),
          ),
        );
      } else {
        const { createReportPdf } = await import("./ReportPdf.js");
        downloadFile(
          includeGroup ? "boletins-pies.pdf" : "boletins-da-turma-pies.pdf",
          createReportPdf(school, reports),
        );
      }
      setOpen(false);
    } catch {
      setError("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="dialog"
        disabled={!reports.length}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Download size={16} aria-hidden="true" />
        {trigger}
      </button>
      <ActionDialog
        title="Baixar boletins"
        open={open}
        onDismiss={() => setOpen(false)}
      >
        {error && (
          <p role="alert" className="school-error">
            {error}
          </p>
        )}
        <div className="school-export-options" aria-busy={pending || undefined}>
          <button
            type="button"
            disabled={pending}
            onClick={() => exportReport("csv")}
          >
            <FileSpreadsheet size={21} aria-hidden="true" />
            <span>
              <strong>Baixar CSV</strong>
              <small>Para abrir em planilhas</small>
            </span>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => exportReport("pdf")}
          >
            <FileText size={21} aria-hidden="true" />
            <span>
              <strong>Baixar PDF</strong>
              <small>Boletim formatado para leitura e impressão</small>
            </span>
          </button>
        </div>
      </ActionDialog>
    </>
  );
}
