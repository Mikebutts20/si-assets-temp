/* ============================================================================
   Self-Insure · theme.js
   Theme bootstrap. MUST run synchronously in <head> BEFORE first paint so the
   correct theme is on <html> with no flash. Idempotent — safe to load twice.
   Resolves: localStorage 'si-theme' override > system preference.
   ========================================================================== */
(function () {
  var KEY = 'si-theme';
  var root = document.documentElement;

  function systemPref() {
    return (window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function resolve() {
    var s = stored();
    return (s === 'light' || s === 'dark') ? s : systemPref();
  }

  // Apply before paint.
  root.setAttribute('data-theme', resolve());

  // Expose a tiny theme API for app.js / settings to share.
  window.SITheme = {
    KEY: KEY,
    get: function () { return root.getAttribute('data-theme') || resolve(); },
    /* Explicit override ('light'|'dark'); persists + notifies. */
    set: function (mode) {
      if (mode !== 'light' && mode !== 'dark') return;
      try { localStorage.setItem(KEY, mode); } catch (e) {}
      this._apply(mode);
    },
    /* Clear override → follow OS live again. */
    clearOverride: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      this._apply(systemPref());
    },
    toggle: function () {
      this.set(this.get() === 'dark' ? 'light' : 'dark');
    },
    hasOverride: function () {
      var s = stored();
      return s === 'light' || s === 'dark';
    },
    system: systemPref,
    _apply: function (mode) {
      // Enable transition only for user-driven changes (not first paint).
      root.classList.add('theme-transition');
      root.setAttribute('data-theme', mode);
      window.clearTimeout(this._t);
      this._t = window.setTimeout(function () {
        root.classList.remove('theme-transition');
      }, 240);
      window.dispatchEvent(new CustomEvent('selfinsure:themechange', { detail: { mode: mode } }));
    }
  };

  // Follow OS live when there is no manual override.
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () {
      if (!window.SITheme.hasOverride()) {
        window.SITheme._apply(systemPref());
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();
