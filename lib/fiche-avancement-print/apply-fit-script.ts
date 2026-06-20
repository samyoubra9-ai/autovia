import {
  FICHE_AVANCEMENT_MARGIN_H_MM,
  FICHE_AVANCEMENT_MARGIN_V_MM,
  FICHE_AVANCEMENT_PRINT_FILL_RATIO,
  FICHE_AVANCEMENT_PRINT_MAX_SCALE,
  FICHE_AVANCEMENT_PRINT_MIN_SCALE,
} from "./constants"

/**
 * Même logique que backdash/src/lib/print-a4.ts (applyPrintFitFicheDual + fitOneSheet).
 * Exécuté dans Puppeteer après emulateMediaType('print').
 */
export function ficheAvancementPrintApplyFitScript(): string {
  return `(function(){
  var A4_W = 210;
  var A4_H = 297;
  var MARGIN_V = ${FICHE_AVANCEMENT_MARGIN_V_MM};
  var MARGIN_H = ${FICHE_AVANCEMENT_MARGIN_H_MM};
  var GAP_MM = 2;
  var INSET_MM = 2;
  var ROOT_MIN_SCALE = ${FICHE_AVANCEMENT_PRINT_MIN_SCALE};
  var ROOT_FILL_RATIO = ${FICHE_AVANCEMENT_PRINT_FILL_RATIO};
  var ROOT_MAX_SCALE = ${FICHE_AVANCEMENT_PRINT_MAX_SCALE};
  var SHEET_SEL = '.print-a4-sheet';

  function mmToPx(mm) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;height:' + mm + 'mm;width:1px;visibility:hidden';
    document.body.appendChild(probe);
    var h = probe.offsetHeight;
    probe.remove();
    return h;
  }

  function mmToPxWidth(mm) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + mm + 'mm;height:1px;visibility:hidden';
    document.body.appendChild(probe);
    var w = probe.offsetWidth;
    probe.remove();
    return w;
  }

  function readSheetNumber(sheet, key, fallback) {
    var root = sheet.closest('[data-print-root]');
    var raw = sheet.dataset[key] || (root && root.dataset[key]);
    if (raw == null || raw === '') return fallback;
    var n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  function fitOneSheet(sheet, viewport, minScale, pageHeight, pageWidth, root) {
    sheet.style.setProperty('--print-fit-scale', '1');
    viewport.style.height = 'auto';
    viewport.style.maxHeight = '';
    viewport.style.overflow = '';

    var fillA4 = sheet.hasAttribute('data-print-fill-a4');
    var fillHeight = root && root.dataset.printFillPriority === 'height';
    var isDualFiche = root && root.hasAttribute('data-print-fiche-dual');
    var edgeSafety = isDualFiche ? 0.972 : 0.995;

    if (fillHeight && fillA4) {
      viewport.style.height = pageHeight + 'px';
      viewport.style.maxHeight = pageHeight + 'px';
    }

    void sheet.offsetHeight;

    var contentHeight = sheet.scrollHeight;
    var contentWidth = sheet.scrollWidth;
    var fillRatio = readSheetNumber(sheet, 'printFillRatio', ROOT_FILL_RATIO);
    var maxScaleUp = readSheetNumber(sheet, 'printMaxScale', ROOT_MAX_SCALE);
    var effectiveMinScale = readSheetNumber(sheet, 'printMinScale', minScale);
    var shrinkMinScale = readSheetNumber(sheet, 'printShrinkMinScale', 0);

    var shrinkHRaw = contentHeight > pageHeight ? (pageHeight / contentHeight) * edgeSafety : 1;
    var shrinkWRaw = contentWidth > pageWidth ? (pageWidth / contentWidth) * edgeSafety : 1;
    var shrinkH = shrinkMinScale > 0 && shrinkHRaw < 1 ? Math.max(shrinkMinScale, shrinkHRaw) : shrinkHRaw;
    var shrinkW = shrinkMinScale > 0 && shrinkWRaw < 1 ? Math.max(shrinkMinScale, shrinkWRaw) : shrinkWRaw;

    var scale = 1;
    if (fillHeight && fillA4 && contentHeight > 0 && contentWidth > 0) {
      scale = (pageHeight * fillRatio) / contentHeight;
      if (contentHeight > pageHeight) {
        scale = shrinkH;
      } else {
        scale = Math.min(maxScaleUp, scale);
      }
      if (contentWidth * scale > pageWidth) {
        var widthCap = shrinkW;
        var overflowRatio = (contentWidth * scale) / pageWidth;
        if (overflowRatio > 1.025) {
          scale = Math.min(scale, widthCap);
        }
      }
      if (contentHeight * scale <= pageHeight) {
        scale = Math.max(effectiveMinScale, scale);
      }
    } else if (shrinkH < 1 || shrinkW < 1) {
      scale = Math.min(shrinkH, shrinkW);
    } else if (fillA4 && contentHeight > 0 && contentWidth > 0) {
      var growH = (pageHeight * fillRatio) / contentHeight;
      var growW = (pageWidth * fillRatio) / contentWidth;
      scale = Math.min(maxScaleUp, growH, growW);
      if (scale < 1) scale = 1;
    }

    scale = Math.round(scale * 1000) / 1000;

    if (contentHeight > 0 && contentHeight * scale > pageHeight) {
      scale = Math.round((pageHeight / contentHeight) * edgeSafety * 1000) / 1000;
    }
    if (contentWidth > 0 && contentWidth * scale > pageWidth) {
      scale = Math.min(scale, Math.round((pageWidth / contentWidth) * edgeSafety * 1000) / 1000);
    }

    sheet.style.setProperty('--print-fit-scale', String(scale));

    if (fillHeight) {
      viewport.style.height = pageHeight + 'px';
      viewport.style.maxHeight = pageHeight + 'px';
    } else {
      viewport.style.height = Math.ceil(contentHeight * scale) + 'px';
      viewport.style.maxHeight = pageHeight + 'px';
    }
    viewport.style.overflow = isDualFiche ? 'visible' : 'hidden';

    return { scale: scale, contentHeight: contentHeight, contentWidth: contentWidth };
  }

  function equalizeVersoJournalHeights(row) {
    var documents = Array.prototype.slice.call(row.querySelectorAll('.fiche-verso-document'));
    var journals = Array.prototype.slice.call(row.querySelectorAll('.fiche-verso-main-table'));
    if (journals.length < 2) return;

    documents.forEach(function(doc) {
      doc.style.removeProperty('height');
      doc.style.removeProperty('min-height');
    });
    journals.forEach(function(table) {
      table.style.removeProperty('height');
      table.style.removeProperty('flex');
      Array.prototype.slice.call(table.querySelectorAll('tbody tr')).forEach(function(tr) {
        tr.style.removeProperty('height');
      });
    });
    void row.offsetHeight;

    var maxDocH = Math.round(Math.max.apply(null, documents.map(function(doc) {
      return doc.getBoundingClientRect().height;
    })));
    if (Number.isFinite(maxDocH) && maxDocH > 0) {
      documents.forEach(function(doc) {
        doc.style.height = maxDocH + 'px';
        doc.style.minHeight = maxDocH + 'px';
      });
    }

    var maxJournalH = Math.round(Math.max.apply(null, journals.map(function(table) {
      return table.getBoundingClientRect().height;
    })));
    if (!Number.isFinite(maxJournalH) || maxJournalH <= 0) return;

    var thead = journals[0] && journals[0].querySelector('thead');
    var theadH = thead ? Math.round(thead.getBoundingClientRect().height) : 0;
    var rowCount = (journals[0] && journals[0].querySelectorAll('tbody tr').length) || 30;
    var bodyH = Math.max(1, maxJournalH - theadH);
    var rowH = bodyH / rowCount;

    journals.forEach(function(table) {
      table.style.flex = '0 0 auto';
      table.style.height = maxJournalH + 'px';
      Array.prototype.slice.call(table.querySelectorAll('tbody tr')).forEach(function(tr) {
        tr.style.height = rowH + 'px';
      });
    });

    row.dataset.versoHeightsEqualized = '1';
  }

  var root = document.querySelector('[data-print-fiche-dual]');
  if (!root) return;

  root.setAttribute('data-print-active', '');

  var pageHeight = mmToPx(A4_W - MARGIN_V * 2);
  var pageWidth = mmToPxWidth(A4_H - MARGIN_H * 2);
  var gapPx = mmToPxWidth(GAP_MM);
  var insetPx = mmToPxWidth(INSET_MM) * 2;
  var halfWidth = Math.max(1, (pageWidth - gapPx) / 2 - insetPx);
  var fillHeight = root.dataset.printFillPriority === 'height';
  var lastScale = 1;

  Array.prototype.slice.call(root.querySelectorAll('.fiche-print-row')).forEach(function(row) {
    var fitted = [];
    Array.prototype.slice.call(row.querySelectorAll('.print-a4-page')).forEach(function(page) {
      var sheet = page.querySelector(SHEET_SEL);
      if (!sheet) return;
      var viewport = page.querySelector('.print-a4-viewport') || page;
      var result = fitOneSheet(sheet, viewport, ROOT_MIN_SCALE, pageHeight, halfWidth, root);
      fitted.push({ sheet: sheet, viewport: viewport, result: result });
      lastScale = result.scale;
    });

    if (fitted.length === 0) return;

    var unifiedScale = Math.min.apply(null, fitted.map(function(f) { return f.result.scale; }));
    fitted.forEach(function(f) {
      f.sheet.style.setProperty('--print-fit-scale', String(unifiedScale));
      if (fillHeight) {
        f.viewport.style.height = pageHeight + 'px';
        f.viewport.style.maxHeight = pageHeight + 'px';
      }
      f.viewport.style.overflow = 'visible';
    });

    if (row.classList.contains('fiche-print-row--versos')) {
      equalizeVersoJournalHeights(row);
    }
  });

  root.dataset.printScale = String(lastScale);
})();`
}
