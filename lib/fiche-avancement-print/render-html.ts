import { permisCodeEnArabe } from "@/lib/api/categories-permis"
import { dnrLogoDataUri } from "./assets"
import {
  FICHE_AVANCEMENT_MARGIN_H_MM,
  FICHE_AVANCEMENT_MARGIN_V_MM,
  FICHE_AVANCEMENT_PRINT_FILL_RATIO,
  FICHE_AVANCEMENT_PRINT_MAX_SCALE,
  FICHE_AVANCEMENT_PRINT_MIN_SCALE,
} from "./constants"
import { ficheAvancementPrintApplyFitScript } from "./apply-fit-script"
import { ficheAvancementPrintStyles } from "./styles"
import type { FicheAvancementData, FicheCopieVariant } from "./types"
import {
  VERSO_CONTROLE_CHAPTERS_FORMATION,
  VERSO_CONTROLE_CHAPTERS_VEHICULE,
  VERSO_LOG_ROWS,
  VERSO_LOG_ROWS_VEHICULE,
  VERSO_MAX_CONTROLE_ROWS,
  VERSO_SUMMARY_COL_COUNT,
  VERSO_TOTAL_AR_FORMATION,
  VERSO_VOLUME_HOURS_FORMATION,
  VERSO_VOLUME_HOURS_VEHICULE,
  type VersoLogRow,
} from "./verso-data"

export type FicheAvancementPrintOptions = {
  /** PDF serveur : exécuter le fit avant capture Puppeteer */
  forPdf?: boolean
  /** Aperçu HTML : inclure le script de fit inline */
  runFitInline?: boolean
}

const FICHE_COPIES: FicheCopieVariant[] = ["vehicule", "formation-theorique"]
const EXAM_ROWS = Array.from({ length: 15 }, (_, i) => i + 1)

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function inlineDots(
  value: string,
  widthClass: string,
  valueClassName?: string,
): string {
  const filled = Boolean(value?.trim())
  const valueClass = ["fiche-data-value", valueClassName].filter(Boolean).join(" ")
  const inner = filled ? `<span class="${valueClass}">${escapeHtml(value)}</span>` : ""
  return `<span class="fiche-inline-dots ${widthClass}${filled ? " fiche-inline-dots--filled" : ""}">${inner}</span>`
}

function dotsFiller(value: string): string {
  const filled = Boolean(value?.trim())
  const inner = filled ? `<span class="fiche-data-value">${escapeHtml(value)}</span>` : ""
  return `<span class="fiche-dots-filler${filled ? " fiche-dots-filler--filled" : ""}">${inner}</span>`
}

function bilingualRow(labelFr: string, labelAr: string, value: string): string {
  return `<div class="fiche-info-row"><span class="fr">${labelFr}</span>${dotsFiller(value)}<span class="ar">${labelAr}</span></div>`
}

function renderHeaderLogo(): string {
  return `<div class="fiche-logo"><img src="${dnrLogoDataUri()}" alt="" /></div>`
}

function renderRecto(data: FicheAvancementData, variant: FicheCopieVariant): string {
  const wilayaAr = data.wilayaLabel.trim() || "بجاية"
  const secondPillLabel =
    variant === "vehicule" ? "N°imat Vehicule:" : "Formation theorique:"
  const secondPillValue = variant === "vehicule" ? data.immatriculationVehicule : ""
  const docClass =
    variant === "formation-theorique"
      ? "fiche-document print-a4-sheet fiche-document--copie-2"
      : "fiche-document print-a4-sheet"
  const categorieHtml = data.categorieCiblee
    ? `<span class="fiche-cat-ciblee-value fiche-data-value fiche-data-value--categorie-ciblee">${escapeHtml(permisCodeEnArabe(data.categorieCiblee))}</span>`
    : ""

  const pillSecond =
    variant === "formation-theorique"
      ? `<div class="fiche-pill-box fiche-pill-box--formation-theorique"><span class="fiche-pill-formation-label">Formation theorique</span></div>`
      : `<div class="fiche-pill-box">${secondPillLabel} ${inlineDots(secondPillValue, "fiche-inline-dots--immat")}</div>`

  const photoHtml = data.photoUrl
    ? `<img src="${escapeHtml(data.photoUrl)}" alt="" />`
    : ""

  const examRows = EXAM_ROWS.map(
    (n) => `<tr>
      <td class="fiche-table-col-num">${String(n).padStart(2, "0")}</td>
      <td class="fiche-table-col-data fiche-table-col-data--empty"></td>
      <td class="fiche-table-col-data"><span class="fiche-date-placeholder">..../..../.......</span></td>
      <td class="fiche-table-col-data fiche-table-col-data--empty"></td>
      <td class="fiche-table-col-data fiche-table-col-data--empty"></td>
    </tr>`,
  ).join("")

  return `<div class="${docClass}" data-print-fill-a4 data-print-fill-ratio="1" data-print-max-scale="1.32" data-print-min-scale="0.62">
  <header class="fiche-header">
    ${renderHeaderLogo()}
    <div class="fiche-header-text">
      <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
      <h4>وزارة الداخلية والجماعات المحلية والنقل</h4>
      <h5>المندوبية الوطنية للأمن في الطرق &amp; المندوبية الولائية للأمن في الطرق لولاية <span class="fiche-data-value">${escapeHtml(wilayaAr)}</span></h5>
      <h4>بطاقة مدى تقدم دروس المترشح (المتابعة والمراقبة)</h4>
      <div class="fiche-title-fr">Fiche d&apos;avancement du candidat (suivi et contrôle)</div>
    </div>
    ${renderHeaderLogo()}
  </header>
  <div class="fiche-top-section">
    <div class="fiche-photo-box">${photoHtml}</div>
    <div class="fiche-top-right">
      <div class="fiche-depose-box">
        <div class="fiche-depose-row">
          <span class="fiche-depose-label">Déposé à l&apos;auto-école le :</span>
          ${inlineDots(data.dateDepotAutoEcole, "fiche-inline-dots--depose-value")}
        </div>
        <div class="fiche-depose-row">
          <span class="fiche-depose-label">N°d&apos;ins:</span>
          ${inlineDots(data.numeroInscription, "fiche-inline-dots--depose-value")}
        </div>
      </div>
      <div class="fiche-pill-container">
        <div class="fiche-pill-box">Le moniteur : ${inlineDots(data.moniteur, "fiche-inline-dots--moniteur")}</div>
        ${pillSecond}
        <div class="fiche-pill-box">Tél : ${inlineDots(data.telephone, "fiche-inline-dots--tel")}</div>
        <div class="fiche-pill-box">Groupage Sanguin: ${inlineDots(data.groupeSanguin, "fiche-inline-dots--sang", "fiche-data-value--groupe-sanguin")}</div>
        <div class="fiche-pill-box">Sexe : ${inlineDots(data.sexe, "fiche-inline-dots--sexe")}</div>
      </div>
    </div>
  </div>
  <div class="fiche-dwsr-section">
    <div class="fiche-dwsr-left">
      <div class="fiche-dwsr-box">
        <span>Dossier déposé à la DWSR le :</span>
        ${dotsFiller(data.dateDepotDwsr)}
        <span dir="rtl">: تاريخ إيداع الملف في المندوبية</span>
      </div>
      <div class="fiche-dwsr-box fiche-dwsr-box--inscription">
        <span>N° d&apos;inscription à la DWSR :</span>
        ${dotsFiller(data.numeroDossierDwsr)}
        <span dir="rtl">: رقم الملف في المندوبية</span>
      </div>
    </div>
    <div class="fiche-cat-ciblee">
      <span class="fiche-cat-ciblee-label">Catégorie<br />Ciblée:</span>
      ${categorieHtml}
    </div>
  </div>
  <section class="fiche-info-section">
    ${bilingualRow("Nom :", ": اللقب", data.nom)}
    ${bilingualRow("Prénom :", ": الإسم", data.prenom)}
    ${bilingualRow("Nom de jeune fille :", ": الإسم الأصلي للفتاة", data.nomJeuneFille)}
    <div class="fiche-date-lieu-row">
      <span class="fr">Date et lieu de naissance :</span>
      ${dotsFiller(data.dateNaissance)}
      <span class="fr">à</span>
      ${dotsFiller(data.lieuNaissance)}
      <span class="ar" style="direction: rtl">: تاريخ و مكان الازدياد</span>
    </div>
    ${bilingualRow("N° carte nationale d'identité :", ": بطاقة التعريف الوطنية", data.nin)}
    ${bilingualRow("Nationalité :", ": الجنسية", data.nationalite)}
    ${bilingualRow("Domicile :", ": العنوان", data.domicile)}
  </section>
  <section class="fiche-info-section">
    ${bilingualRow("N° de permis obtenu:", ": رقم الرخصة المتحصل عليها", data.numeroPermisObtenu)}
    ${bilingualRow("Date :", ": تاريخ", data.datePermisObtenu)}
    ${bilingualRow("Catégorie obtenu:", ": الأصناف المتحصل عليها", data.categoriesObtenues)}
  </section>
  <table class="fiche-table">
    <colgroup>
      <col class="fiche-table-col-num" />
      <col class="fiche-table-col-data" span="4" />
    </colgroup>
    <thead>
      <tr>
        <th class="fiche-table-col-num"></th>
        <th class="fiche-table-col-data">Examens<br /><span dir="rtl">الامتحانات</span></th>
        <th class="fiche-table-col-data">Dates &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span dir="rtl">تاريخ</span></th>
        <th class="fiche-table-col-data">Observations &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span dir="rtl">الملاحظات</span></th>
        <th class="fiche-table-col-data">Examinateurs<br /><span dir="rtl">الممتحنين</span></th>
      </tr>
    </thead>
    <tbody>${examRows}</tbody>
  </table>
</div>`
}

function renderVersoLogRows(rows: VersoLogRow[]): string {
  return rows
    .map(
      (row) => `<tr>
      <td class="col-dates">&nbsp;</td>
      ${
        row.chapter != null
          ? `<td class="col-chapitre${row.largeChapter ? " large-num" : ""}" rowspan="${row.chapterRowSpan ?? 1}">${escapeHtml(row.chapter)}</td>`
          : ""
      }
      <td class="col-thematique">${escapeHtml(row.theme)}</td>
      <td class="col-periode">1h</td>
      <td class="col-signature">&nbsp;</td>
    </tr>`,
    )
    .join("")
}

function renderVerso(variant: FicheCopieVariant): string {
  const isFormation = variant === "formation-theorique"
  const volumeHours = isFormation ? VERSO_VOLUME_HOURS_FORMATION : VERSO_VOLUME_HOURS_VEHICULE
  const totalAr = isFormation ? VERSO_TOTAL_AR_FORMATION : "30ساعة"
  const controleChapters = isFormation
    ? VERSO_CONTROLE_CHAPTERS_FORMATION
    : VERSO_CONTROLE_CHAPTERS_VEHICULE
  const logRows = isFormation ? VERSO_LOG_ROWS : VERSO_LOG_ROWS_VEHICULE
  const controlePadCount = Math.max(0, VERSO_MAX_CONTROLE_ROWS - controleChapters.length)
  const summarySlots = Array.from({ length: VERSO_SUMMARY_COL_COUNT }, (_, i) =>
    volumeHours[i] ?? { ch: "\u00a0", ar: "\u00a0" },
  )

  const controleRows = controleChapters
    .map(
      (ch) => `<tr>
      <td>${escapeHtml(ch)}</td>
      <td class="checkbox-cell">&nbsp;</td>
      <td class="checkbox-cell">&nbsp;</td>
      <td class="checkbox-cell">&nbsp;</td>
    </tr>`,
    )
    .join("")

  const controlePadRows = Array.from({ length: controlePadCount }, (_, i) => `<tr class="fiche-verso-controle-pad-row">
      <td>&nbsp;</td>
      <td class="checkbox-cell">&nbsp;</td>
      <td class="checkbox-cell">&nbsp;</td>
      <td class="checkbox-cell">&nbsp;</td>
    </tr>`).join("")

  const summaryColgroup = Array.from(
    { length: VERSO_SUMMARY_COL_COUNT },
    (_, i) => `<col class="fiche-verso-summary-data-col" />`,
  ).join("")

  const chRow = summarySlots
    .map((v, i) => `<td>${escapeHtml(v.ch)}</td>`)
    .join("")
  const hoursRow = summarySlots
    .map((v, i) => `<td class="text-arabic">${escapeHtml(v.ar)}</td>`)
    .join("")

  return `<div class="fiche-verso-html print-a4-sheet fiche-verso-html--${variant}" data-fiche-verso="${variant}" data-print-max-scale="1" data-print-min-scale="0.52">
  <div class="fiche-verso-document">
    <table class="fiche-verso-main-table">
      <colgroup>
        <col class="col-dates" />
        <col class="col-chapitre" />
        <col class="col-thematique" />
        <col class="col-periode" />
        <col class="col-signature" />
      </colgroup>
      <thead>
        <tr>
          <th class="col-dates">Dates</th>
          <th class="col-chapitre">N° Chapitre du programme</th>
          <th class="col-thematique">Thématique enseignées</th>
          <th class="col-periode">Période</th>
          <th class="col-signature">Signature du candidat</th>
        </tr>
      </thead>
      <tbody>${renderVersoLogRows(logRows)}</tbody>
    </table>
    <div class="fiche-verso-controle-header">Controle <span class="text-arabic">المراقبة</span></div>
    <table class="fiche-verso-controle-table">
      <colgroup>
        <col class="fiche-verso-controle-chap-col" />
        <col span="3" class="fiche-verso-controle-niveau-col" />
      </colgroup>
      <thead>
        <tr>
          <th rowspan="2" class="fiche-verso-controle-chap-col">N° du chapitre (programme<br />de formation pratique)</th>
          <th colspan="3" class="fiche-verso-controle-niveau-col">Niveau d&apos;apprentissage <span class="text-arabic">مستوى التحصيل</span></th>
        </tr>
        <tr>
          <th>débutant</th>
          <th>moyen</th>
          <th>Bonne maitrise</th>
        </tr>
      </thead>
      <tbody>${controleRows}${controlePadRows}</tbody>
    </table>
    <table class="fiche-verso-summary-table">
      <colgroup>
        <col class="fiche-verso-summary-label-col" />
        ${summaryColgroup}
      </colgroup>
      <tbody>
        <tr>
          <td class="fiche-verso-summary-label">N° chapitre du programme</td>
          ${chRow}
        </tr>
        <tr>
          <td class="fiche-verso-summary-label">Volume horaire <span class="text-arabic">الحجم الساعي</span></td>
          ${hoursRow}
        </tr>
        <tr>
          <td class="fiche-verso-summary-label">TOTAL <span class="text-arabic">المجموع</span></td>
          <td colspan="${VERSO_SUMMARY_COL_COUNT}" class="text-arabic fiche-verso-total-ar">${escapeHtml(totalAr)}</td>
        </tr>
      </tbody>
    </table>
    <div class="fiche-verso-flex-spacer" aria-hidden="true"></div>
    <div class="fiche-verso-footer-signature">
      <div class="text-arabic fiche-verso-footer-ar">امضاء الممرن</div>
      <div>signature du moniteur</div>
      <div class="fiche-verso-signature-box" aria-hidden="true"></div>
    </div>
  </div>
</div>`
}

function renderCopyPage(
  data: FicheAvancementData,
  variant: FicheCopieVariant,
  side: "recto" | "verso",
): string {
  const pageClass =
    side === "recto" ? "print-a4-page fiche-recto-page" : "print-a4-page fiche-verso-page"
  const inner = side === "recto" ? renderRecto(data, variant) : renderVerso(variant)
  return `<div class="${pageClass}" data-fiche-variant="${variant}">
  <div class="print-a4-viewport">${inner}</div>
</div>`
}

export function renderFicheAvancementPrintHtml(
  data: FicheAvancementData,
  options: FicheAvancementPrintOptions = {},
): string {
  const rectos = FICHE_COPIES.map((variant) => renderCopyPage(data, variant, "recto")).join("")
  const versos = FICHE_COPIES.map((variant) => renderCopyPage(data, variant, "verso")).join("")

  const fitScript =
    options.runFitInline && !options.forPdf
      ? `<script>${ficheAvancementPrintApplyFitScript()}</script>`
      : ""

  return `<!DOCTYPE html>
<html class="print-landscape-fiche" lang="ar" dir="ltr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Fiche d&apos;avancement — ${escapeHtml(data.prenom)} ${escapeHtml(data.nom)}</title>
<style>${ficheAvancementPrintStyles()}</style>
</head>
<body>
<div
  class="fiche-avancement-print-root"
  data-print-root
  data-print-active
  data-print-fit-a4
  data-print-multi-a4
  data-print-fiche-dual
  data-print-orientation="landscape"
  data-print-fill-priority="height"
  data-print-margin-v-mm="${FICHE_AVANCEMENT_MARGIN_V_MM}"
  data-print-margin-h-mm="${FICHE_AVANCEMENT_MARGIN_H_MM}"
  data-print-min-scale="${FICHE_AVANCEMENT_PRINT_MIN_SCALE}"
  data-print-fill-ratio="${FICHE_AVANCEMENT_PRINT_FILL_RATIO}"
  data-print-max-scale="${FICHE_AVANCEMENT_PRINT_MAX_SCALE}"
  dir="ltr"
  lang="ar"
>
  <div class="print-a4-stack fiche-print-stack">
    <div class="fiche-print-row fiche-print-row--rectos">${rectos}</div>
    <div class="fiche-print-row fiche-print-row--versos">${versos}</div>
  </div>
</div>
${fitScript}
</body>
</html>`
}
