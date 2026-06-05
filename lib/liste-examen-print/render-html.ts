import { permisCodeEnArabe } from "@/lib/api/categories-permis"
import type { ListeExamenDto } from "@/lib/api/mappers-liste-examen"
import {
  listeExamenContinuationContext,
  listeExamenContinuationTitle,
  listeExamenFirstPageMultiHint,
  listeExamenMultiPageLegalNotice,
  listeExamenPageLabel,
  listeExamenReferenceLine,
} from "./document-meta"
import { buildListeExamenPrintPages, type ListeExamenTableChunk } from "./pagination"
import { listeExamenPrintStyles } from "./styles"

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

function renderChunkRows(chunk: ListeExamenTableChunk, keyPrefix: string): string {
  const safeRows = chunk.rows.length > 0 ? chunk.rows : [null]
  return safeRows
    .map((data, i) => {
      const isEmpty = !data
      const rowNum = data
        ? String(data.ordre || i + 1).padStart(2, "0")
        : String(i + 1).padStart(2, "0")
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
        <td>${rowNum}</td>
        <td>${escapeHtml(data?.numeroDossier ?? "")}</td>
        <td class="cell-nom">${escapeHtml(data?.nomCompletAr ?? "")}</td>
        <td>${escapeHtml(data?.dateNaissance ?? "")}</td>
        ${groupeCell}
        <td>${escapeHtml(data?.natureExamenAr ?? "")}</td>
        <td>${escapeHtml(data?.dateDernierExamen ?? "")}</td>
        <td>${escapeHtml(resultText)}</td>
      </tr>`
    })
    .join("")
}

function tableHead(): string {
  return `<thead><tr>
    <th style="width:4%"></th>
    <th style="width:5%">الرقم</th>
    <th style="width:12%">رقم التسجيل</th>
    <th style="width:30%">اللقب والاسم</th>
    <th style="width:12%">تاريخ الميلاد</th>
    <th style="width:5%"></th>
    <th style="width:12%">طبيعة الامتحان</th>
    <th style="width:12%">تاريخ آخر امتحان</th>
    <th style="width:8%">النتيجة</th>
  </tr></thead>`
}

export function renderListeExamenPrintHtml(
  liste: ListeExamenDto,
  autoEcoleNom?: string,
): string {
  const sections = liste.sections ?? []
  const pages = buildListeExamenPrintPages(sections)
  const stats = liste.stats ?? { code: 0, creneau: 0, circulation: 0, total: 0 }
  const referenceLine = listeExamenReferenceLine(liste.referenceEnvoi)
  const totalPages = pages.length
  const firstPageHint = listeExamenFirstPageMultiHint(totalPages)
  const legal = listeExamenMultiPageLegalNotice(totalPages)
  const ecoleNom = autoEcoleNom?.trim() || liste.ecoleNomAr?.trim() || ""
  const inspecteur = liste.inspecteurNom?.trim() ?? ""

  const pagesHtml = pages
    .map((page) => {
      const rowsHtml = page.chunks.map((c, ci) => renderChunkRows(c, `p${page.pageIndex}c${ci}`)).join("")

      const headerHtml = page.showOfficialHeader
        ? `<div class="top-header">الجمهورية الجزائرية الديمقراطية الشعبية<br/>وزارة الداخلية والجماعات المحلية والنقل</div>
        <div class="header-section">
          <div class="header-right">المندوبية الوطنية للأمن في الطرق<br/>المندوبية الولائية للأمن في الطرق<br/>ولاية : ${escapeHtml(liste.wilaya)}</div>
          <div class="header-left">ختم مدرسة تعليم السياقة${ecoleNom ? `<span class="ecole-nom-ar">${escapeHtml(ecoleNom)}</span>` : ""}</div>
        </div>
        <div class="main-title-container">
          <div class="main-title">قائمة المرشحين لإمتحان رخصة السياقة</div>
          ${referenceLine ? `<p class="doc-reference">الرقم: ${escapeHtml(referenceLine)}</p>` : ""}
        </div>
        ${firstPageHint && page.pageIndex === 0 ? `<p class="first-page-hint">${escapeHtml(firstPageHint)}</p>` : ""}
        `
        : ""

      const examHtml = page.showExamDetails
        ? `<div class="exam-details-box">
          <div class="exam-details-row">
            <span>مركز الإمتحان: ${escapeHtml(liste.centreExamen)}</span>
            <span>تاريخ الإيداع: ${escapeHtml(liste.dateDepot)}</span>
            <span>تاريخ الإمتحان: ${escapeHtml(liste.dateExamen)}</span>
          </div>
          ${referenceLine ? `<div class="exam-details-reference">الرقم: ${escapeHtml(referenceLine)}</div>` : ""}
          <div class="exam-details-bottom">اسم و لقب المفتش: ${escapeHtml(inspecteur)}</div>
        </div>`
        : ""

      const bannerHtml = page.showContinuationBanner
        ? `<div class="continuation-banner">
          <p class="continuation-title">${escapeHtml(listeExamenContinuationTitle(page.pageIndex, totalPages))}</p>
          <p class="continuation-context">${escapeHtml(
            listeExamenContinuationContext({
              wilaya: liste.wilaya,
              centreExamen: liste.centreExamen,
              dateExamen: liste.dateExamen,
              referenceEnvoi: liste.referenceEnvoi,
            }),
          )}</p>
        </div>`
        : ""

      const footerHtml = page.showFooter
        ? `<div class="footer-layout footer-section">
          <div class="footer-right-side">
            <div class="trainers-info">
              <p>اسم ولقب الممرن الأول : ${escapeHtml(liste.moniteur1Nom?.trim() || "—")} مكلف: ${escapeHtml(permisCodeEnArabe(liste.moniteur1Categorie || "") || "—")}</p>
              <p>اسم ولقب الممرن الثاني: ${escapeHtml(liste.moniteur2Nom?.trim() || "—")} مكلف: ${escapeHtml(permisCodeEnArabe(liste.moniteur2Categorie || "") || "—")}</p>
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

      const metaHtml =
        totalPages > 1 && page.showFooter
          ? `<div class="page-footer-meta">
            <span class="page-indicator">${escapeHtml(listeExamenPageLabel(page.pageIndex, totalPages))}${page.showContinuationBanner ? " — تتمة" : ""}</span>
            ${legal ? `<span class="page-legal">${escapeHtml(legal)}</span>` : ""}
          </div>`
          : totalPages > 1 && !page.showFooter
            ? `<div class="page-footer-meta">
              <span class="page-indicator">${escapeHtml(listeExamenPageLabel(page.pageIndex, totalPages))}${page.showContinuationBanner ? " — تتمة" : ""}</span>
              ${legal ? `<span class="page-legal">${escapeHtml(legal)}</span>` : ""}
            </div>`
            : ""

      const mainClass = page.showFooter ? "page-main page-main--footer" : "page-main"

      return `<div class="page">
        ${headerHtml}
        ${examHtml}
        <div class="${mainClass}">
          ${bannerHtml}
          <div class="sheet-bottom${page.showFooter ? " sheet-bottom--footer" : ""}">
            <table class="main-data-table">${tableHead()}<tbody>${rowsHtml}</tbody></table>
            ${footerHtml}
          </div>
          ${metaHtml}
        </div>
      </div>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>Liste examen ${escapeHtml(liste.dateExamen)}</title>
  <style>${listeExamenPrintStyles()}</style>
</head>
<body>
  <div class="doc">${pagesHtml}</div>
</body>
</html>`
}
