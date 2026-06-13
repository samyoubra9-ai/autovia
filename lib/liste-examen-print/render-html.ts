import type { ListeExamenDto } from "@/lib/api/mappers-liste-examen"
import { buildListeExamenPrintPages, type ListeExamenTableChunk } from "./pagination"
import { listeExamenMoniteurSlotCategorieLabel } from "./moniteur-categorie-label"
import { listeExamenPrintApplyFitScript } from "./apply-fit-script"
import { listeExamenPrintStyles } from "./styles"

export type ListeExamenPrintOptions = {
  /** Essai gratuit : aperçu à l'écran, impression désactivée */
  printBlocked?: boolean
}

function trialPrintBlockStyles(): string {
  return `
.trial-print-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  max-width: min(640px, calc(100vw - 24px));
  padding: 10px 16px;
  border-radius: 10px;
  background: #0f172a;
  color: #f8fafc;
  font: 600 14px/1.4 system-ui, sans-serif;
  text-align: center;
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.25);
}
@media print {
  body * { visibility: hidden !important; }
  .trial-print-banner,
  .trial-print-notice {
    visibility: visible !important;
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    color: #0f172a;
    font-size: 18px;
    text-align: center;
    padding: 24px;
  }
}
`
}

function trialPrintBlockScript(): string {
  return `
window.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "p") {
    e.preventDefault();
    alert("Impression désactivée pendant l'essai gratuit. Passez à un abonnement pour imprimer.");
  }
});
`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function pad2(n: number): string {
  return String(Number(n) || 0).padStart(2, "0")
}

function emptyCell(value: string | undefined | null, isEmptyRow: boolean): string {
  const t = value?.trim() ?? ""
  if (t) return escapeHtml(t)
  return isEmptyRow ? "&nbsp;" : ""
}

function cellValHtml(value: string | undefined | null, isEmptyRow: boolean): string {
  const inner = emptyCell(value, isEmptyRow)
  if (!inner || inner === "&nbsp;") return "&nbsp;"
  return `<span class="cell-val">${inner}</span>`
}

function renderNomCell(data: { nomListe?: string; prenomListe?: string; nomCompletAr?: string } | null): string {
  if (!data) return ""
  const nom = data.nomListe?.trim() ?? ""
  const prenom = data.prenomListe?.trim() ?? ""
  if (nom && prenom) {
    return `<span class="cell-nom-inner"><span class="cell-nom-n">${escapeHtml(nom)}</span><span class="cell-nom-p">${escapeHtml(prenom)}</span></span>`
  }
  if (nom || prenom) return escapeHtml(nom || prenom)
  return escapeHtml(data.nomCompletAr ?? "")
}

function renderChunkRows(chunk: ListeExamenTableChunk, keyPrefix: string): string {
  const safeRows = chunk.rows.length > 0 ? chunk.rows : [null]
  return safeRows
    .map((data, i) => {
      const isEmpty = !data
      const resultText = data?.resultatAr?.trim() || ""

      const vehicleCell =
        i === 0
          ? `<td rowspan="${safeRows.length}" class="rotated-cell">${
              chunk.vehicleLabel
                ? `<span class="rotated-text">${escapeHtml(chunk.vehicleLabel)}</span>`
                : ""
            }</td>`
          : ""

      const groupeCell =
        i === 0
          ? `<td rowspan="${safeRows.length}" class="side-merged-cell">${escapeHtml(chunk.groupeLabel)}</td>`
          : ""

      return `<tr class="${isEmpty ? "row-empty" : ""}">
        ${vehicleCell}
        <td class="cell-ordre"><span class="cell-val">${chunk.rowStartIndex + i + 1}</span></td>
        <td class="cell-centre">${cellValHtml(data?.numeroDossier, isEmpty)}</td>
        <td class="cell-nom">${isEmpty ? "&nbsp;" : renderNomCell(data)}</td>
        <td class="cell-centre">${cellValHtml(data?.dateNaissance, isEmpty)}</td>
        ${groupeCell}
        <td class="cell-centre">${cellValHtml(data?.natureExamenAr, isEmpty)}</td>
        <td class="cell-centre">${cellValHtml(data?.dateDernierExamen, isEmpty)}</td>
        <td class="cell-centre">${cellValHtml(resultText, isEmpty)}</td>
      </tr>`
    })
    .join("")
}

function tableHead(): string {
  return `<thead><tr>
    <th style="width:4%"></th>
    <th style="width:4%">رقم</th>
    <th style="width:12%">رقم التسجيل</th>
    <th style="width:31%">اللقب والاسم</th>
    <th style="width:11%">تاريخ الميلاد</th>
    <th style="width:5%"></th>
    <th style="width:11%">طبيعة الامتحان</th>
    <th style="width:11%">تاريخ آخر امتحان</th>
    <th style="width:7%">النتيجة</th>
  </tr></thead>`
}

export function renderListeExamenPrintHtml(
  liste: ListeExamenDto,
  _autoEcoleNom?: string,
  options: ListeExamenPrintOptions = {},
): string {
  const sections = liste.sections ?? []
  const pages = buildListeExamenPrintPages(sections)
  const stats = liste.stats ?? { code: 0, creneau: 0, circulation: 0, total: 0 }
  const inspecteur = liste.inspecteurNom?.trim() ?? ""
  const moniteur1Categorie = listeExamenMoniteurSlotCategorieLabel(
    liste.moniteur1Categorie,
    sections,
  )
  const moniteur2Categorie = listeExamenMoniteurSlotCategorieLabel(
    liste.moniteur2Categorie,
    sections,
  )
  const moniteur2Nom = liste.moniteur2Nom?.trim() ?? ""

  const pagesHtml = pages
    .map((page) => {
      const rowsHtml = page.chunks.map((c, ci) => renderChunkRows(c, `p${page.pageIndex}c${ci}`)).join("")

      const headerHtml = page.showOfficialHeader
        ? `<div class="top-header">الجمهورية الجزائرية الديمقراطية الشعبية<br/>وزارة الداخلية والجماعات المحلية والنقل</div>
        <div class="header-section">
          <div class="header-right">المندوبية الوطنية للأمن في الطرق<br/>المندوبية الولائية للأمن في الطرق<br/>ولاية : ${escapeHtml(liste.wilaya)}</div>
          <div class="header-left">ختم مدرسة تعليم السياقة</div>
        </div>
        <div class="main-title-container">
          <div class="main-title">قائمة المرشحين لإمتحان رخصة السياقة</div>
        </div>
        `
        : ""

      const examHtml = page.showExamDetails
        ? `<div class="exam-details-box">
          <div class="exam-details-row">
            <span>مركز الإمتحان: ${escapeHtml(liste.centreExamen)}</span>
            <span>تاريخ الإيداع: ${escapeHtml(liste.dateDepot)}</span>
            <span>تاريخ الإمتحان: ${escapeHtml(liste.dateExamen)}</span>
          </div>
          <div class="exam-details-bottom">اسم و لقب المفتش: ${inspecteur ? `${escapeHtml(inspecteur)} ` : ""}<span class="dots-fill"></span></div>
        </div>`
        : ""

      const bannerHtml = ""

      const footerHtml = page.showFooter
        ? `<div class="footer-layout footer-section">
          <div class="footer-right-side">
            <div class="trainers-info">
              <p>اسم ولقب الممرن الأول : ${escapeHtml(liste.moniteur1Nom?.trim() || "—")} مكلف: ${escapeHtml(moniteur1Categorie)}</p>
              ${moniteur2Nom ? `<p>اسم ولقب الممرن الثاني: ${escapeHtml(moniteur2Nom)} مكلف: ${escapeHtml(moniteur2Categorie)}</p>` : ""}
            </div>
            <table class="stats-table">
              <thead><tr>
                <th style="width:40%">طبيعة الامتحان</th>
                <th style="width:30%">عدد المرشحين الممتحنين</th>
                <th style="width:30%">عدد المرشحين الناجحين</th>
              </tr></thead>
              <tbody>
                <tr><td>قانون المرور</td><td>${pad2(stats.code)}</td><td></td></tr>
                <tr><td>المناورات</td><td>${pad2(stats.creneau)}</td><td></td></tr>
                <tr><td>السياقة</td><td>${pad2(stats.circulation)}</td><td></td></tr>
                <tr><td>المجموع</td><td>${pad2(stats.total)}</td><td></td></tr>
              </tbody>
            </table>
          </div>
          <div class="inspector-stamp-box">ختم وإمضاء المفتش</div>
        </div>`
        : ""

      const mainClass = page.showFooter ? "page-main page-main--footer" : "page-main"
      const pageClass = page.footerOnly ? "page page--footer-only" : "page"
      const tableHtml =
        page.chunks.length > 0
          ? `<table class="main-data-table">${tableHead()}<tbody>${rowsHtml}</tbody></table>`
          : ""

      return `<div class="${pageClass}">
        ${headerHtml}
        ${examHtml}
        <div class="${mainClass}">
          ${bannerHtml}
          <div class="sheet-bottom${page.showFooter ? " sheet-bottom--footer" : ""}">
            ${tableHtml}
            ${footerHtml}
          </div>
        </div>
      </div>`
    })
    .join("")

  const printBlocked = options.printBlocked === true
  const trialBanner = printBlocked
    ? `<div class="trial-print-banner" dir="ltr">Aperçu essai gratuit — impression désactivée. Passez à un abonnement pour imprimer.</div>
       <div class="trial-print-notice" aria-hidden>L'impression est désactivée pendant l'essai gratuit.</div>`
    : ""

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>Liste examen ${escapeHtml(liste.dateExamen)}</title>
  <style>${listeExamenPrintStyles()}${printBlocked ? trialPrintBlockStyles() : ""}</style>
</head>
<body>
  ${trialBanner}
  <div class="doc">${pagesHtml}</div>
  <script>${listeExamenPrintApplyFitScript()}${printBlocked ? trialPrintBlockScript() : ""}</script>
</body>
</html>`
}
