/**
 * Synchronous theme bootstrap — runs inline in <head> before first paint.
 * Reads localStorage, sets data-theme on <html>, optionally syncs
 * a <meta name="theme-color"> with a CSS custom property.
 *
 * Usage (inline):
 *   <script is:inline src="/theme-bootstrap.js" data-meta-var="--color-bg"></script>
 *
 * The data-meta-var attribute is optional. When present, the script reads
 * that CSS variable and pushes its value into the theme-color meta tag.
 *
 * Also exposes window.__applyStoredTheme(doc) so ClientRouter can re-apply
 * the stored theme to the incoming document during astro:before-swap: the
 * inline bootstrap only runs on a full load, not on a page swap.
 */
(function () {
  function readTheme() {
    try {
      var theme = localStorage.getItem('muscu-theme') || 'dark';
      return theme === 'light' || theme === 'dark' ? theme : 'dark';
    } catch {
      return 'dark';
    }
  }

  function applyTheme(doc, theme) {
    doc.documentElement.setAttribute('data-theme', theme);
  }

  window.__applyStoredTheme = function (doc) {
    applyTheme(doc || document, readTheme());
  };

  applyTheme(document, readTheme());

  try {
    var script = document.currentScript;
    var metaVar = script && script.getAttribute('data-meta-var');
    if (metaVar) {
      var value = getComputedStyle(document.documentElement).getPropertyValue(metaVar).trim();
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta && value) meta.setAttribute('content', value);
    }
  } catch {
    /* localStorage unavailable (SSR / private mode) */
  }
})();
