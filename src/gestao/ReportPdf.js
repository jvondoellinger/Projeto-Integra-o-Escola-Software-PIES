import { jsPDF } from "jspdf";

const blue = "#163a72";
const ink = "#142c53";
const muted = "#465e7c";
const left = 16;
const right = 194;
const width = right - left;
const bottom = 273;
const lineHeight = 4.8;
const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function createReportPdf(school, reports) {
  const doc = new jsPDF({ format: "a4", compress: true, putOnlyUsedFonts: true });
  doc.setProperties({ title: "PIES | Boletins da turma", author: "PIES" });

  function text(
    value,
    x,
    y,
    { size = 10, color = ink, bold = false, align = "left" } = {},
  ) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(value, x, y, { align });
  }

  function header(report) {
    doc.setFillColor(blue);
    doc.rect(0, 0, 210, 58, "F");
    doc.setFillColor("#8ebcff");
    doc.rect(0, 56, 210, 2, "F");
    text("PIES.", left, 19, { size: 20, color: "#ffffff", bold: true });
    text("REGISTRO ACADÊMICO", right, 18, {
      size: 9,
      color: "#dce9ff",
      align: "right",
    });
    text("Boletins da turma", left, 35, {
      size: 24,
      color: "#ffffff",
      bold: true,
    });
    doc.setFontSize(11);
    const schoolLines = doc.splitTextToSize(school, width);
    text(schoolLines.slice(0, 2), left, 44, { size: 11, color: "#dce9ff" });

    doc.setFontSize(15);
    const classroomLines = doc.splitTextToSize(report.classroom, width);
    text(classroomLines, left, 70, { size: 15, bold: true });
    const metadataY = 75 + classroomLines.length * 6;
    doc.setFontSize(10);
    const periodLines = doc.splitTextToSize(report.period, width);
    text(periodLines, left, metadataY, { color: muted });
    let y = metadataY + periodLines.length * lineHeight + 3;
    const publication = report.publishedAt
      ? `Publicado em ${dateFormat.format(new Date(report.publishedAt))}`
      : "Boletins publicados";
    doc.setFillColor("#edf4ff");
    doc.roundedRect(left, y - 5, width, 13, 3, 3, "F");
    text(`${report.rows.length} estudante(s)`, left + 5, y + 3, { bold: true });
    text(publication, right - 5, y + 3, { color: muted, align: "right" });
    y += 15;

    doc.setFillColor(blue);
    doc.roundedRect(left, y, width, 11, 2, 2, "F");
    text("Estudante", left + 5, y + 7, { bold: true, color: "#ffffff" });
    text("Média", 150, y + 7, { bold: true, color: "#ffffff", align: "right" });
    text("Frequência", right - 5, y + 7, {
      bold: true,
      color: "#ffffff",
      align: "right",
    });
    return y + 12;
  }

  reports.forEach((report, reportIndex) => {
    if (reportIndex > 0) doc.addPage();
    let y = header(report);
    if (report.rows.length === 0)
      text("Nenhum boletim neste registro.", left + 5, y + 8, { color: muted });
    report.rows.forEach((row, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(row.name, 101);
      const height = Math.max(10, 5 + lines.length * lineHeight);
      if (y + height > bottom) {
        doc.addPage();
        y = header(report);
      }
      if (index % 2 === 0) {
        doc.setFillColor("#f1f6ff");
        doc.rect(left, y, width, height, "F");
      }
      text(lines, left + 5, y + 6.5);
      text(
        row.average == null ? "-" : numberFormat.format(row.average),
        150,
        y + 6.5,
        { align: "right" },
      );
      text(
        row.attendance == null
          ? "-"
          : `${numberFormat.format(row.attendance)}%`,
        right - 5,
        y + 6.5,
        { align: "right" },
      );
      y += height;
    });
  });

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor("#bfcee5");
    doc.line(left, 281, right, 281);
    text("PIES.  Gestão escolar", left, 287, { size: 9, color: muted });
    text(`Página ${page} de ${total}`, right, 287, {
      size: 9,
      color: muted,
      align: "right",
    });
  }
  return doc.output("blob");
}
