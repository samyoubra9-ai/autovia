import { LISTE_EXAMEN_PAGE_MARGIN_MM } from "./constants"

/** Script inline exécuté dans Puppeteer / HTML officiel — même logique que le zoom navigateur. */
export function listeExamenPrintApplyFitScript(): string {
  const margin = LISTE_EXAMEN_PAGE_MARGIN_MM
  return `(function(){
  var MIN_SCALE = 0.78;
  var marginMm = ${margin};
  function mmToPx(mm) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;height:' + mm + 'mm;width:1px;visibility:hidden';
    document.body.appendChild(probe);
    var h = probe.offsetHeight;
    probe.remove();
    return h;
  }
  var pageHeight = mmToPx(297 - marginMm * 2);
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
    var scale = (pageHeight / contentHeight) * 0.992;
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
