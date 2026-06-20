import {
  listeExamenPrintablePageHeightMm,
  LISTE_EXAMEN_PRINT_MIN_SCALE,
  LISTE_EXAMEN_PRINT_SCALE_EDGE,
} from "./compute-print-scale"

/** Script inline exécuté dans le navigateur — zoom visuel avant impression. */
export function listeExamenPrintApplyFitScript(): string {
  const pageBodyMm = listeExamenPrintablePageHeightMm()
  return `(function(){
  var MIN_SCALE = ${LISTE_EXAMEN_PRINT_MIN_SCALE};
  var EDGE = ${LISTE_EXAMEN_PRINT_SCALE_EDGE};
  function mmToPx(mm) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;height:' + mm + 'mm;width:1px;visibility:hidden';
    document.body.appendChild(probe);
    var h = probe.offsetHeight;
    probe.remove();
    return h;
  }
  var pageHeight = mmToPx(${pageBodyMm});
  var doc = document.querySelector('.doc');
  if (!doc) return;
  doc.querySelectorAll('.page').forEach(function(shell) {
    shell.style.transform = '';
    shell.style.transformOrigin = '';
    shell.style.width = '';
    shell.style.height = '';
    shell.style.removeProperty('--liste-examen-print-scale');
    void shell.offsetHeight;
    var contentHeight = Math.max(shell.scrollHeight, shell.getBoundingClientRect().height);
    if (contentHeight <= pageHeight || contentHeight <= 0) return;
    var scale = (pageHeight / contentHeight) * EDGE;
    scale = Math.max(MIN_SCALE, Math.round(scale * 1000) / 1000);
    shell.style.setProperty('--liste-examen-print-scale', String(scale));
    shell.style.transform = 'scale(' + scale + ')';
    shell.style.transformOrigin = 'top center';
    shell.style.width = (100 / scale) + '%';
    shell.style.height = Math.ceil(contentHeight * scale) + 'px';
  });
  doc.classList.add('liste-examen-print-fit-active');
})();`
}

export {
  computeListeExamenPrintScale,
  listeExamenPrintablePageHeightMm,
  LISTE_EXAMEN_PRINT_MIN_SCALE,
  LISTE_EXAMEN_PRINT_SCALE_EDGE,
} from "./compute-print-scale"
