/* ============================================================================
   Self-Insure · app.js — shared engine
   Owns: shell render + active nav, theme toggle wiring, formatters, toast/modal/
   confirm, command palette, notifications, chart helpers (+ re-theme registry),
   the simulated account-aware assistant (dock + page), and flow helpers
   (pay sheet, file-a-claim). Exposes a clean window.SI API.

   Session-state keys (single registry):
     localStorage : si-theme, si-authed
     sessionStorage : si-chat, si-quote-draft, si-just-bound, si-session-overrides
   All screens read overrides ON TOP of SI.account via getState().
   ========================================================================== */
(function () {
  "use strict";
  var SI = window.SI = window.SI || {};
  var A = SI.account;

  /* =========================================================================
     0. SVG ICON SET (inline, currentColor)
     ====================================================================== */
  var ICONS = {
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    claim: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    spark: '<path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4L12 14.1l-3-3"/>',
    arrowRight: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    chevronRight: '<path d="M9 18l6-6-6-6"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7L22 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    rop: '<path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    home: '<path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21V12h6v9"/>',
    wallet: '<rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 9h20"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || '') + '</svg>';
  }
  SI.icon = icon;

  /* =========================================================================
     1. FORMATTERS
     ====================================================================== */
  function fmtCurrency0(n) {
    n = Math.round(Number(n) || 0);
    return "$" + n.toLocaleString("en-US");
  }
  function fmtCurrencyShort(n) {
    n = Number(n) || 0;
    if (Math.abs(n) >= 1000) {
      var k = n / 1000;
      return "$" + (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "K";
    }
    return "$" + Math.round(n);
  }
  function fmtPct(n, dec) { return (Number(n) || 0).toFixed(dec || 0) + "%"; }
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function parseISO(iso) { var p = String(iso).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(iso) { var d = parseISO(iso); return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
  function fmtDateShort(iso) { var d = parseISO(iso); return MONTHS[d.getMonth()] + " " + d.getDate(); }
  var TODAY = "2026-06-24"; // demo "now"
  function relTime(iso, time) {
    if (iso === TODAY) return "Today" + (time ? " · " + time : "");
    var d = parseISO(iso), now = parseISO(TODAY);
    var days = Math.round((now - d) / 86400000);
    if (days === 1) return "Yesterday" + (time ? " · " + time : "");
    if (days < 7) return days + " days ago";
    if (days < 30) return Math.round(days / 7) + " week" + (days >= 14 ? "s" : "") + " ago";
    if (days < 365) return Math.round(days / 30) + " month" + (days >= 60 ? "s" : "") + " ago";
    return fmtDate(iso);
  }
  SI.fmt = { currency0: fmtCurrency0, currencyShort: fmtCurrencyShort, pct: fmtPct, date: fmtDate, dateShort: fmtDateShort, relTime: relTime };

  /* =========================================================================
     2. SESSION STATE (overrides merged on top of SI.account)
     ====================================================================== */
  function readJSON(store, key, fallback) {
    try { var v = store.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function writeJSON(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch (e) {} }

  function getOverrides() { return readJSON(sessionStorage, "si-session-overrides", {}); }
  function setOverrides(o) { writeJSON(sessionStorage, "si-session-overrides", o); }
  function patchOverride(path, value) {
    var o = getOverrides(); o[path] = value; setOverrides(o);
    window.dispatchEvent(new CustomEvent("selfinsure:state", { detail: { path: path, value: value } }));
  }
  /* Merged view of mutable account facts. Screens should read getState(). */
  function getState() {
    var o = getOverrides();
    var b = A.billing;
    var state = {
      autopay: o.autopay != null ? o.autopay : b.autopay,
      paperless: o.paperless != null ? o.paperless : A.member.paperless,
      cadence: o.cadence || b.cadence,
      last4: o.last4 || b.paymentMethod.last4,
      profile: o.profile || null,
      extraPayments: o.extraPayments || [],   // session pay-ahead rows
      extraClaims: o.extraClaims || [],        // session-filed claims
      extraActivity: o.extraActivity || []     // session activity items (newest first)
    };
    return state;
  }
  SI.state = { get: getState, patch: patchOverride, overrides: getOverrides, addPayment: addPayment, addClaim: addClaim, addActivity: addActivity, nextPaymentId: nextPaymentId };

  /* Single source of truth for the next receipt id. Derives the next number off
     the TRUE max across canonical + session rows and zero-pads to 4 digits so the
     format never breaks (PMT-0067, PMT-0068 … PMT-0100) and the dock pay-sheet and
     page pay-sheet can never collide on the same id within a session. */
  function nextPaymentId() {
    var max = 0;
    SI.allPayments().forEach(function (p) {
      var m = /PMT-0*(\d+)/.exec(p.id || "");
      if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
    });
    return "PMT-" + String(max + 1).padStart(4, "0");
  }

  function addActivity(item) {
    var o = getOverrides(); o.extraActivity = o.extraActivity || []; o.extraActivity.unshift(item); setOverrides(o);
    window.dispatchEvent(new CustomEvent("selfinsure:activity", { detail: item }));
    refreshNotifBadge();
  }
  function addPayment(row) {
    var o = getOverrides(); o.extraPayments = o.extraPayments || []; o.extraPayments.unshift(row); setOverrides(o);
  }
  function addClaim(claim) {
    var o = getOverrides(); o.extraClaims = o.extraClaims || []; o.extraClaims.unshift(claim); setOverrides(o);
  }
  /* All activity newest-first = session items + canonical. */
  function allActivity() { return getState().extraActivity.concat(A.activity); }
  SI.allActivity = allActivity;
  SI.allClaims = function () { return getState().extraClaims.concat(A.claims); };
  SI.allPayments = function () { return getState().extraPayments.concat(A.billing.history); };

  /* =========================================================================
     3. NAV MODEL + SHELL RENDER
     ====================================================================== */
  var NAV = [
    { id: "dashboard", label: "Dashboard",        href: "dashboard.html", icon: "grid" },
    { id: "policy",    label: "Policy & coverage", href: "policy.html",    icon: "shield" },
    { id: "billing",   label: "Billing",           href: "billing.html",   icon: "card" },
    { id: "claims",    label: "Claims",            href: "claims.html",    icon: "claim", badge: true },
    { id: "documents", label: "Documents",         href: "documents.html", icon: "doc" },
    { id: "assistant", label: "Assistant",         href: "assistant.html", icon: "spark", dot: true }
  ];
  var NAV_SECONDARY = [
    { id: "intake",   label: "Get a quote", href: "intake.html",   icon: "plus", isNew: true },
    { id: "settings", label: "Settings",    href: "settings.html", icon: "settings" }
  ];
  var PAGE_TITLES = {
    "dashboard.html": "Dashboard", "policy.html": "Policy & coverage", "billing.html": "Billing & payments",
    "claims.html": "Claims", "documents.html": "Documents", "assistant.html": "Assistant",
    "settings.html": "Settings", "intake.html": "Get a quote", "underwriting.html": "AI underwriting"
  };
  function currentFile() {
    var p = location.pathname.split("/").pop();
    return p && p.indexOf(".html") > -1 ? p : "dashboard.html";
  }

  function navItemHTML(it, active) {
    var badge = "";
    if (it.badge && A.claims.length) badge = '<span class="nav-badge">' + A.claims.length + '</span>';
    if (it.dot) badge = '<span class="nav-dot" title="online"></span>';
    return '<a class="nav-item' + (active ? " active" : "") + (it.isNew ? " nav-new" : "") +
      '" href="' + it.href + '" data-nav="' + it.id + '">' +
      icon(it.icon, "nav-ico") + '<span class="lbl">' + it.label + '</span>' + badge + '</a>';
  }

  function renderShell() {
    if (document.querySelector(".app")) { wireShell(); return; } // page provided its own .app
    // If a page marks data-shell, build the whole frame around its [data-content].
    var contentEl = document.querySelector("[data-content]");
    if (!contentEl) return;
    // Pre-auth funnel pages (intake → underwriting) opt into a minimal shell:
    // brand lockup + theme toggle only, no member nav/avatar/policy/assistant.
    if (contentEl.getAttribute("data-shell") === "minimal") { renderMinimalShell(contentEl); return; }
    var inner = contentEl.innerHTML;
    var file = currentFile();
    var st = getState();
    var prof = st.profile || {};
    var fullName = prof.fullName || A.member.fullName;
    var initials = (prof.fullName ? prof.fullName.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase() : A.member.initials);

    var navHTML = NAV.map(function (it) { return navItemHTML(it, it.href === file); }).join("");
    var secHTML = NAV_SECONDARY.map(function (it) { return navItemHTML(it, it.href === file); }).join("");

    var shell =
      '<div class="app">' +
        '<aside class="sidebar" id="si-sidebar">' +
          '<a class="brand-lockup" href="dashboard.html" aria-label="Self-Insure home">' +
            '<span class="brand-monogram">SI</span>' +
            '<span class="brand-words"><span class="brand-name">Self-Insure</span>' +
            '<span class="brand-tag">the insurance that gives it back</span></span>' +
          '</a>' +
          '<nav class="nav" aria-label="Primary">' + navHTML + '</nav>' +
          '<div class="nav-section-label">Account</div>' +
          '<nav class="nav" aria-label="Secondary">' + secHTML + '</nav>' +
          '<div class="sidebar-spacer"></div>' +
          '<div class="member-chip">' +
            '<span class="avatar" id="si-side-avatar">' + initials + '</span>' +
            '<span class="mc-body"><span class="mc-name" id="si-side-name">' + fullName + '</span>' +
            '<span class="mc-sub">Policy ' + A.policy.number + '</span></span>' +
            '<button class="mc-signout" data-action="signout" aria-label="Sign out">' + icon("logout") + '</button>' +
          '</div>' +
        '</aside>' +
        '<div class="main">' +
          topbarHTML(file, initials) +
          '<main class="content' + (contentEl.getAttribute("data-wide") ? " content-wide" : "") + '" id="si-content">' + inner + '</main>' +
        '</div>' +
      '</div>' +
      '<div class="scrim" id="si-scrim"></div>';

    contentEl.outerHTML = shell;
    document.body.insertAdjacentHTML("beforeend", assistantHTML());
    document.body.insertAdjacentHTML("beforeend", '<div class="toast-stack" id="si-toasts" aria-live="polite"></div>');
    wireShell();
  }

  /* Minimal pre-auth shell for the public quote funnel: brand lockup + a theme
     toggle, no member nav/avatar/policy chip and no assistant dock. Keeps the
     funnel narrative honest (a prospect isn't Eleanor yet) while reusing the
     same design system, theme tokens, and toast surface. */
  function renderMinimalShell(contentEl) {
    var inner = contentEl.innerHTML;
    var wide = contentEl.getAttribute("data-wide") != null;
    var shell =
      '<div class="prefunnel">' +
        '<header class="prefunnel-bar">' +
          '<a class="brand-lockup" href="index.html" aria-label="Self-Insure home">' +
            '<span class="brand-monogram">SI</span>' +
            '<span class="brand-words"><span class="brand-name">Self-Insure</span>' +
            '<span class="brand-tag">the insurance that gives it back</span></span>' +
          '</a>' +
          '<div class="prefunnel-actions">' +
            '<a class="prefunnel-signin" href="index.html">Sign in</a>' +
            '<button class="icon-btn theme-toggle" data-action="theme" aria-label="Toggle theme" id="si-theme-btn"></button>' +
          '</div>' +
        '</header>' +
        '<main class="prefunnel-content' + (wide ? " content-wide" : "") + '" id="si-content">' + inner + '</main>' +
      '</div>';
    contentEl.outerHTML = shell;
    document.body.insertAdjacentHTML("beforeend", '<div class="toast-stack" id="si-toasts" aria-live="polite"></div>');
    // Wire only the theme toggle + generic data-action delegation; no member chrome.
    syncThemeIcon();
    document.addEventListener("click", function (e) {
      var actEl = e.target.closest("[data-action]");
      if (actEl) { doAction(actEl.getAttribute("data-action"), actEl); e.preventDefault(); e.stopPropagation(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closePop(); }
    });
    window.addEventListener("selfinsure:themechange", function () { syncThemeIcon(); setTimeout(retheme, 50); });
    document.dispatchEvent(new CustomEvent("selfinsure:ready"));
    SI._ready = true;
  }

  function topbarHTML(file, initials) {
    var unread = allActivity().filter(function (a) { return a.unread; }).length;
    return '<header class="topbar">' +
      '<button class="icon-btn menu-toggle" data-action="menu" aria-label="Menu">' + icon("menu") + '</button>' +
      '<h1 class="page-title">' + (PAGE_TITLES[file] || "Self-Insure") + '</h1>' +
      '<button class="cmd-search" data-action="cmdk" aria-label="Search">' + icon("search") +
        '<span>Search policy, claims, documents…</span><span class="kbd">⌘K</span></button>' +
      '<div class="topbar-right">' +
        '<button class="ask-ai-btn" data-action="assistant" aria-label="Ask Self-Insure AI">' +
          icon("spark") + '<span class="lbl">Ask AI</span></button>' +
        '<button class="icon-btn" data-action="notifs" aria-label="Notifications">' + icon("bell") +
          (unread ? '<span class="count" id="si-notif-count">' + unread + '</span>' : '') + '</button>' +
        '<button class="icon-btn theme-toggle" data-action="theme" aria-label="Toggle theme" id="si-theme-btn"></button>' +
        '<button class="avatar-btn" data-action="avatar" aria-label="Account menu"><span class="avatar">' + initials + '</span></button>' +
      '</div>' +
    '</header>';
  }

  /* =========================================================================
     4. THEME TOGGLE WIRING
     ====================================================================== */
  function syncThemeIcon() {
    var btn = document.getElementById("si-theme-btn");
    if (!btn) return;
    var mode = window.SITheme ? window.SITheme.get() : "dark";
    btn.innerHTML = icon(mode === "dark" ? "sun" : "moon");
  }
  function toggleTheme() {
    if (window.SITheme) window.SITheme.toggle();
    syncThemeIcon();
    setTimeout(retheme, 60);
  }

  /* =========================================================================
     5. TOAST / MODAL / CONFIRM
     ====================================================================== */
  function ensureToastStack() {
    var s = document.getElementById("si-toasts");
    if (!s) { s = document.createElement("div"); s.className = "toast-stack"; s.id = "si-toasts"; s.setAttribute("aria-live", "polite"); document.body.appendChild(s); }
    return s;
  }
  function toast(msg, tone, opts) {
    opts = opts || {}; tone = tone || "ai";
    var stack = ensureToastStack();
    var ic = tone === "warning" ? "alert" : tone === "danger" ? "alert" : tone === "info" ? "info" : "check";
    var el = document.createElement("div");
    el.className = "toast " + tone;
    el.innerHTML = '<span class="t-ico">' + icon(ic) + '</span><div class="t-body">' +
      (opts.title ? '<div class="t-title">' + opts.title + '</div>' : '') + '<div>' + msg + '</div></div>';
    stack.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () { el.classList.remove("show"); setTimeout(function () { el.remove(); }, 320); }, opts.duration || 3200);
  }

  var _modalEl = null;
  function openModal(node, opts) {
    opts = opts || {};
    closeModal();
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    var modal = document.createElement("div");
    modal.className = "modal" + (opts.wide ? " modal-wide" : "");
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    if (typeof node === "string") modal.innerHTML = node; else modal.appendChild(node);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    _modalEl = overlay;
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    overlay.addEventListener("click", function (e) {
      var c = e.target.closest("[data-close]"); if (c) closeModal();
    });
    requestAnimationFrame(function () { overlay.classList.add("open"); });
    var f = modal.querySelector("input,button,textarea,select"); if (f) setTimeout(function () { f.focus(); }, 60);
    return modal;
  }
  function closeModal() {
    if (!_modalEl) return;
    var el = _modalEl; _modalEl = null;
    el.classList.remove("open");
    setTimeout(function () { el.remove(); }, 220);
  }
  function confirmDialog(msg, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var node = document.createElement("div");
      node.innerHTML =
        '<div class="modal-head"><div class="modal-title">' + (opts.title || "Are you sure?") + '</div>' +
        '<button class="modal-close" data-close aria-label="Close">' + icon("x") + '</button></div>' +
        '<div class="modal-body"><p class="muted">' + msg + '</p></div>' +
        '<div class="modal-foot"><button class="btn btn-ghost" data-no>' + (opts.cancel || "Cancel") + '</button>' +
        '<button class="btn ' + (opts.danger ? "btn-danger-ghost" : "btn-primary") + '" data-yes>' + (opts.confirm || "Confirm") + '</button></div>';
      var m = openModal(node);
      m.querySelector("[data-yes]").addEventListener("click", function () { closeModal(); resolve(true); });
      m.querySelector("[data-no]").addEventListener("click", function () { closeModal(); resolve(false); });
    });
  }
  function route(href) { if (href) location.href = href; }

  SI.ui = { toast: toast, openModal: openModal, closeModal: closeModal, confirm: confirmDialog, route: route };

  /* =========================================================================
     6. POPOVERS: notifications + avatar menu + command palette
     ====================================================================== */
  var _pop = null;
  function closePop() { if (_pop) { _pop.classList.remove("open"); var p = _pop; _pop = null; setTimeout(function () { if (p && !p.classList.contains("open")) p.remove(); }, 160); } }
  function openPopover(html, anchor, cls) {
    closePop();
    var pop = document.createElement("div");
    pop.className = "popover " + (cls || "");
    pop.innerHTML = html;
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect();
    var w = pop.offsetWidth;
    pop.style.top = (r.bottom + 8 + window.scrollY) + "px";
    pop.style.left = Math.max(8, Math.min(r.right - w + window.scrollX, window.innerWidth - w - 8)) + "px";
    requestAnimationFrame(function () { pop.classList.add("open"); });
    _pop = pop;
    return pop;
  }

  function notifBadgeEl() { return document.getElementById("si-notif-count"); }
  function refreshNotifBadge() {
    var unread = allActivity().filter(function (a) { return a.unread; }).length;
    var el = notifBadgeEl();
    var btn = document.querySelector('[data-action="notifs"]');
    if (!btn) return;
    if (unread) {
      if (!el) { btn.insertAdjacentHTML("beforeend", '<span class="count" id="si-notif-count">' + unread + '</span>'); }
      else el.textContent = unread;
    } else if (el) { el.remove(); }
  }

  function openNotifs(anchor) {
    var items = allActivity().slice(0, 8).map(function (a) {
      var ico = a.icon === "check" ? "checkCircle" : a.icon === "claim" ? "claim" : a.icon === "card" ? "card" : a.icon === "rop" ? "rop" : "doc";
      return '<div class="notif-item' + (a.unread ? " unread" : "") + '" data-link="' + (a.link || "") + '">' +
        '<span class="notif-ico ' + (a.tone || "neutral") + '">' + icon(ico) + '</span>' +
        '<div class="notif-body"><div class="notif-title">' + a.title + '</div>' +
        '<div class="notif-text">' + a.body + '</div>' +
        '<div class="notif-time">' + relTime(a.date, a.time) + '</div></div></div>';
    }).join("");
    var html = '<div class="notif-panel">' +
      '<div class="notif-head"><span class="nh-title">Notifications</span>' +
      '<button data-mark-read>Mark all read</button></div>' +
      '<div class="notif-list">' + items + '</div></div>';
    var pop = openPopover(html, anchor, "");
    pop.style.minWidth = "340px";
    pop.querySelector("[data-mark-read]").addEventListener("click", function (e) {
      e.stopPropagation();
      // mark canonical + session unread = read for the session
      var o = getOverrides(); o.readAll = true; setOverrides(o);
      A.activity.forEach(function (a) { a.unread = false; });
      (o.extraActivity || []).forEach(function (a) { a.unread = false; }); setOverrides(o);
      pop.querySelectorAll(".notif-item.unread").forEach(function (n) { n.classList.remove("unread"); });
      refreshNotifBadge();
    });
    pop.querySelectorAll(".notif-item").forEach(function (n) {
      n.addEventListener("click", function () { var l = n.getAttribute("data-link"); if (l) route(l); });
    });
  }
  // apply persisted readAll on load
  (function () { if (getOverrides().readAll) { A.activity.forEach(function (a) { a.unread = false; }); } })();

  function openAvatarMenu(anchor) {
    var html =
      '<div class="menu-item" data-go="settings.html">' + icon("user") + 'Profile</div>' +
      '<div class="menu-item" data-go="settings.html">' + icon("settings") + 'Settings</div>' +
      '<div class="menu-item" data-id-card>' + icon("wallet") + 'ID card</div>' +
      '<div class="menu-sep"></div>' +
      '<div class="menu-item danger" data-action="signout">' + icon("logout") + 'Sign out</div>';
    var pop = openPopover(html, anchor);
    pop.querySelectorAll("[data-go]").forEach(function (m) { m.addEventListener("click", function () { route(m.getAttribute("data-go")); }); });
    var idc = pop.querySelector("[data-id-card]"); if (idc) idc.addEventListener("click", function () { closePop(); openIdCard(); });
    var so = pop.querySelector('[data-action="signout"]'); if (so) so.addEventListener("click", signOut);
  }

  /* Command palette */
  var CMDK = [
    { group: "Go to", label: "Dashboard", icon: "grid", href: "dashboard.html" },
    { group: "Go to", label: "Policy & coverage", icon: "shield", href: "policy.html" },
    { group: "Go to", label: "Billing & payments", icon: "card", href: "billing.html" },
    { group: "Go to", label: "Claims", icon: "claim", href: "claims.html" },
    { group: "Go to", label: "Documents", icon: "doc", href: "documents.html" },
    { group: "Go to", label: "Settings", icon: "settings", href: "settings.html" },
    { group: "Actions", label: "File a claim", icon: "claim", href: "claims.html#file" },
    { group: "Actions", label: "Pay now", icon: "dollar", act: "paySheet" },
    { group: "Actions", label: "View ID card", icon: "wallet", act: "idCard" },
    { group: "Actions", label: "Ask the assistant", icon: "spark", act: "assistant" },
    { group: "Actions", label: "Get a quote", icon: "plus", href: "intake.html" }
  ];
  function openCmdK() {
    var node = document.createElement("div");
    node.className = "cmdk-overlay";
    node.innerHTML = '<div class="cmdk" role="dialog" aria-label="Command palette">' +
      '<div class="cmdk-input">' + icon("search") + '<input type="text" placeholder="Search or jump to…" aria-label="Command search" /></div>' +
      '<div class="cmdk-list"></div></div>';
    document.body.appendChild(node);
    requestAnimationFrame(function () { node.classList.add("open"); });
    var input = node.querySelector("input");
    var list = node.querySelector(".cmdk-list");
    var active = 0, filtered = CMDK.slice();
    function run(it) { node.remove(); if (it.href) route(it.href); else if (it.act) doAction(it.act); }
    function render() {
      var html = "", lastGroup = "";
      filtered.forEach(function (it, i) {
        if (it.group !== lastGroup) { html += '<div class="cmdk-group-label">' + it.group + '</div>'; lastGroup = it.group; }
        html += '<div class="cmdk-item' + (i === active ? " active" : "") + '" data-i="' + i + '">' + icon(it.icon) + it.label +
          (it.href ? '<span class="hint">' + it.href.replace(".html", "") + '</span>' : '') + '</div>';
      });
      list.innerHTML = html || '<div class="cmdk-group-label">No matches</div>';
      list.querySelectorAll(".cmdk-item").forEach(function (el) { el.addEventListener("click", function () { run(filtered[+el.getAttribute("data-i")]); }); });
    }
    function filter() {
      var q = input.value.toLowerCase().trim();
      filtered = CMDK.filter(function (it) { return !q || it.label.toLowerCase().indexOf(q) > -1; });
      active = 0; render();
    }
    input.addEventListener("input", filter);
    node.addEventListener("keydown", function (e) {
      if (e.key === "Escape") node.remove();
      else if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
      else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) run(filtered[active]); }
    });
    node.addEventListener("click", function (e) { if (e.target === node) node.remove(); });
    render(); setTimeout(function () { input.focus(); }, 50);
  }

  /* =========================================================================
     7. SIGN OUT / AUTH (soft)
     ====================================================================== */
  function signOut() {
    try { localStorage.removeItem("si-authed"); } catch (e) {}
    route("index.html");
  }

  /* =========================================================================
     8. ID CARD + PAY SHEET (shared flows)
     ====================================================================== */
  function openIdCard() {
    var p = A.policy, m = A.member;
    var node = document.createElement("div");
    node.innerHTML =
      '<div class="modal-head"><div class="modal-title">Digital ID card</div>' +
      '<button class="modal-close" data-close aria-label="Close">' + icon("x") + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="id-card"><div class="id-glow"></div>' +
          '<div class="id-head"><div><div class="id-brand">Self-Insure</div>' +
          '<div class="id-sub">Proof of Insurance</div></div>' +
          '<div class="id-qr">' + qrSVG() + '</div></div>' +
          '<div class="id-row"><div><div class="id-k">Member</div><div class="id-v">' + m.fullName + '</div></div>' +
          '<div><div class="id-k">Policy</div><div class="id-v">' + p.number + '</div></div></div>' +
          '<div class="id-row"><div><div class="id-k">Form</div><div class="id-v">' + p.product + '</div></div>' +
          '<div><div class="id-k">Term</div><div class="id-v">' + fmtDateShort(p.termStart) + " " + parseISO(p.termStart).getFullYear() + " – " + fmtDateShort(p.termEnd) + " " + parseISO(p.termEnd).getFullYear() + '</div></div></div>' +
          '<div class="id-row"><div><div class="id-k">Property</div><div class="id-v">' + p.propertyAddress.line1 + ', ' + p.propertyAddress.city + ', ' + p.propertyAddress.state + '</div></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn btn-ghost" data-wallet>' + icon("wallet") + 'Add to wallet</button>' +
      '<button class="btn btn-ghost" data-email>' + icon("mail") + 'Email to me</button>' +
      '<button class="btn btn-primary" data-dl>' + icon("download") + 'Download PDF</button></div>';
    var m2 = openModal(node, { wide: true });
    m2.querySelector("[data-wallet]").addEventListener("click", function () { toast("Saved to your wallet."); });
    m2.querySelector("[data-email]").addEventListener("click", function () { toast("ID card emailed to " + A.member.email + "."); });
    m2.querySelector("[data-dl]").addEventListener("click", function () { downloadText("self-insure-id-card.txt", idCardText()); toast("Downloaded ID card."); });
  }
  function qrSVG() {
    // deterministic faux-QR. Cell fill comes from the shared --qr-ink token so this
    // and the inline mini-QR in policy.html can never diverge (fallback if unset).
    var ink = cssVar("--qr-ink") || "#0c0d10";
    var cells = "";
    for (var y = 0; y < 7; y++) for (var x = 0; x < 7; x++) {
      var on = ((x * 13 + y * 7 + x * y) % 3 === 0) || (x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4);
      if (on) cells += '<rect x="' + (x * 8) + '" y="' + (y * 8) + '" width="8" height="8" fill="' + ink + '"/>';
    }
    return '<svg viewBox="0 0 56 56" width="100%" height="100%">' + cells + '</svg>';
  }
  function idCardText() {
    var p = A.policy, m = A.member;
    return "SELF-INSURE — PROOF OF INSURANCE\n\nMember: " + m.fullName + "\nPolicy: " + p.number +
      "\nForm: " + p.product + "\nTerm: " + fmtDate(p.termStart) + " – " + fmtDate(p.termEnd) +
      "\nProperty: " + p.propertyAddress.line1 + ", " + p.propertyAddress.city + ", " + p.propertyAddress.state + " " + p.propertyAddress.zip +
      "\nStatus: ACTIVE\n";
  }

  function openPaySheet(amountOverride) {
    var st = getState();
    var amt = amountOverride != null ? amountOverride : A.billing.nextPaymentAmount;
    var node = document.createElement("div");
    node.innerHTML =
      '<div class="modal-head"><div class="modal-title">Make a payment</div>' +
      '<button class="modal-close" data-close aria-label="Close">' + icon("x") + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="field"><label for="pay-amt">Amount</label>' +
        '<input class="input" id="pay-amt" type="text" value="' + fmtCurrency0(amt) + '" /></div>' +
        '<div class="field" style="margin-bottom:4px"><div class="label">Payment method</div>' +
        '<div class="pill" style="height:auto;padding:9px 12px;border-radius:10px">' + icon("card") + ' Visa ending ' + st.last4 + '</div></div>' +
        '<p class="tiny muted-3" style="margin-top:10px">Your balance is $0 — this pays ahead and is applied to your next premium.</p>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button>' +
      '<button class="btn btn-primary" data-confirm>Confirm payment</button></div>';
    var m = openModal(node);
    m.querySelector("[data-confirm]").addEventListener("click", function (e) {
      var btn = e.currentTarget;
      btn.innerHTML = '<span class="spinner"></span>Processing…'; btn.disabled = true;
      setTimeout(function () {
        var raw = m.querySelector("#pay-amt").value.replace(/[^0-9.]/g, "");
        var paid = Math.round(parseFloat(raw) || amt);
        var id = nextPaymentId();
        addPayment({ id: id, date: TODAY, amount: paid, method: "Visa •" + st.last4, status: "Paid", kind: "payahead" });
        addActivity({ id: "ACT-" + Date.now(), icon: "card", tone: "neutral", date: TODAY, time: nowTime(), title: "Payment received", body: fmtCurrency0(paid) + " paid via Visa •" + st.last4 + ". Thank you.", link: "billing.html", unread: true });
        closeModal();
        toast(fmtCurrency0(paid) + " payment confirmed.", "ai", { title: "Payment received" });
        window.dispatchEvent(new CustomEvent("selfinsure:payment", { detail: { amount: paid } }));
      }, 1100);
    });
  }
  function nowTime() {
    var d = new Date(), h = d.getHours(), mm = ("0" + d.getMinutes()).slice(-2);
    var ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + mm + " " + ap;
  }

  function downloadText(filename, text) {
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 100);
  }
  SI.flows = { idCard: openIdCard, paySheet: openPaySheet, downloadText: downloadText, downloadClaimSummary: downloadClaimSummary };

  /* =========================================================================
     9. CHARTS (Chart.js helpers + re-theme registry)
     ====================================================================== */
  var _charts = [];
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function chartColors() {
    return { brand: cssVar("--brand"), ai: cssVar("--ai"), info: cssVar("--info"),
      gold: cssVar("--gold"), warning: cssVar("--warning"),
      text3: cssVar("--text-3"), text2: cssVar("--text-2"), border: cssVar("--border"),
      surface: cssVar("--surface"), aiTint: cssVar("--ai-tint") };
  }
  function rgba(hex, a) {
    hex = (hex || "").replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(hex, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function baseOpts(c) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: c.surface, borderColor: c.border, borderWidth: 1,
        titleColor: c.text2, bodyColor: cssVar("--text"), padding: 10, cornerRadius: 8, displayColors: false
      } },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.text3, font: { family: "Inter", size: 11 } }, border: { color: c.border } },
        y: { grid: { color: c.border, drawTicks: false }, ticks: { color: c.text3, font: { family: "Inter", size: 11 } }, border: { display: false } }
      }
    };
  }
  function registerChart(rec) { _charts.push(rec); return rec.chart; }
  function retheme() {
    if (!window.Chart) return;
    _charts.forEach(function (rec) {
      try { rec.chart.destroy(); } catch (e) {}
      rec.chart = rec.build();
    });
  }
  SI.charts = {
    register: registerChart, retheme: retheme, colors: chartColors, rgba: rgba, baseOpts: baseOpts, cssVar: cssVar,
    line: function (cfg) { return makeChart("line", cfg); },
    bar: function (cfg) { return makeChart("bar", cfg); },
    doughnut: function (cfg) { return makeChart("doughnut", cfg); }
  };
  function makeChart(type, cfg) {
    if (!window.Chart) return null;
    var canvas = typeof cfg.canvas === "string" ? document.getElementById(cfg.canvas) : cfg.canvas;
    if (!canvas) return null;
    function build() {
      var c = chartColors();
      var data = cfg.data(c, rgba);
      var opts = cfg.options ? cfg.options(baseOpts(c), c, rgba) : baseOpts(c);
      if (type === "doughnut") { opts.cutout = cfg.cutout || "68%"; delete opts.scales; }
      return new Chart(canvas.getContext("2d"), { type: type, data: data, options: opts });
    }
    var rec = { chart: build(), build: build };
    registerChart(rec);
    return rec.chart;
  }

  /* =========================================================================
     10. THE ASSISTANT ENGINE (dock + page; intent matching + streaming)
     ====================================================================== */
  function assistantHTML() {
    return '<button class="fab" id="si-fab" data-action="assistant" aria-label="Ask Self-Insure AI">' +
      icon("spark") + '<span class="fab-label">Ask Self-Insure AI</span></button>' +
      '<div class="dock" id="si-dock" role="dialog" aria-label="Self-Insure AI assistant">' +
        chatHead(true) +
        '<div class="chat-scroll" id="si-dock-scroll"></div>' +
        '<div class="chat-chips" id="si-dock-chips"></div>' +
        composerHTML("dock") +
      '</div>';
  }
  function chatHead(isDock) {
    return '<div class="chat-head">' +
      '<span class="spark">' + icon("spark") + '</span>' +
      '<div><div class="ch-title">Self-Insure AI</div>' +
      '<div class="ch-sub"><span class="dot"></span>online · powered by your policy data</div></div>' +
      '<div class="ch-actions">' +
      (isDock ? '<button class="icon-btn" data-dock-expand aria-label="Expand to full page">' + icon("expand") + '</button>' : '') +
      (isDock ? '<button class="icon-btn" data-dock-close aria-label="Close assistant">' + icon("x") + '</button>' : '') +
      '</div></div>';
  }
  function composerHTML(scope) {
    return '<form class="composer" data-composer="' + scope + '">' +
      '<textarea rows="1" placeholder="Ask about your policy, payment, or claim…" aria-label="Message Self-Insure AI"></textarea>' +
      '<button type="submit" class="send" aria-label="Send">' + icon("send") + '</button></form>';
  }

  /* --- intent matching --- */
  function normalize(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
  function matchIntent(text) {
    var q = " " + normalize(text) + " ";
    var best = null, bestScore = 0;
    (SI.intents || []).forEach(function (intent) {
      var score = 0, hits = 0;
      (intent.keywords || []).forEach(function (kw) {
        var k = normalize(kw);
        if (!k) return;
        if (q.indexOf(" " + k + " ") > -1) { score += k.split(" ").length * 2 + 1; hits++; }
        else if (q.indexOf(k) > -1) { score += k.split(" ").length; hits++; }
      });
      if (score > bestScore || (score === bestScore && best && hits > (best._hits || 0))) {
        best = intent; bestScore = score; intent._hits = hits;
      }
    });
    if (!best || bestScore < 2) {
      return (SI.intents || []).filter(function (i) { return i.fallback; })[0] || (SI.intents || [])[SI.intents.length - 1];
    }
    return best;
  }
  SI.matchIntent = matchIntent;

  /* --- transcript persistence --- */
  function getChat() { return readJSON(sessionStorage, "si-chat", []); }
  function setChat(arr) { writeJSON(sessionStorage, "si-chat", arr); }
  function pushChat(role, html) { var c = getChat(); c.push({ role: role, html: html }); setChat(c); }

  function mdBold(s) { return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }

  function cardHTML(card) {
    if (card.kind === "stat") {
      // tone maps to a value-color class: 'ai' (mint) or 'brand' (gold/near-black).
      // Default (no/other tone) keeps the neutral --brand value treatment.
      var toneCls = card.tone === "ai" ? " ai" : card.tone === "brand" ? " brand" : "";
      return '<div class="mini-card' + toneCls + '">' +
        '<div class="mc-label">' + card.label + '</div>' +
        '<div class="mc-value">' + card.value + '</div>' +
        (card.sub ? '<div class="mc-sub">' + card.sub + '</div>' : '') + '</div>';
    }
    if (card.kind === "contact") {
      return '<div class="mini-card contact">' +
        '<div class="row">' + icon("phone") + card.phone + '</div>' +
        '<div class="row">' + icon("mail") + card.email + '</div>' +
        '<div class="row">' + icon("clock") + card.hours + '</div></div>';
    }
    return "";
  }

  function chipHTML(chips) {
    if (!chips || !chips.length) return "";
    return chips.map(function (c, i) {
      return '<button class="chip" data-chip-action=\'' + JSON.stringify(c.action).replace(/'/g, "&#39;") + '\'>' + c.label + '</button>';
    }).join("");
  }

  /* Render persisted transcript into a surface (dock or page). */
  function renderTranscript(scrollEl, chipsEl) {
    var c = getChat();
    scrollEl.innerHTML = c.map(function (m) {
      if (m.role === "user") return '<div class="msg user"><div class="bubble">' + m.html + '</div></div>';
      return '<div class="msg ai"><span class="av">' + icon("spark") + '</span><div class="bubble">' + m.html + '</div></div>';
    }).join("");
    scrollEl.scrollTop = scrollEl.scrollHeight;
    // chips from the latest AI turn that carried them:
    if (chipsEl) {
      var last = null;
      for (var i = c.length - 1; i >= 0; i--) { if (c[i].role === "ai" && c[i].chips) { last = c[i].chips; break; } if (c[i].role === "user") break; }
      chipsEl.innerHTML = last ? chipHTML(last) : "";
      wireChips(chipsEl, scrollEl, chipsEl);
    }
  }

  function wireChips(container, scrollEl, chipsEl) {
    container.querySelectorAll("[data-chip-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action;
        try { action = JSON.parse(btn.getAttribute("data-chip-action")); } catch (e) { action = {}; }
        handleChipAction(action, btn.textContent, scrollEl, chipsEl);
      });
    });
  }
  function handleChipAction(action, label, scrollEl, chipsEl) {
    // A chip literally labelled "Download summary" must download the claim summary,
    // not silently navigate to the claims page. The intent declares it as a plain
    // {route:'claims.html'} chip; we honor the label here so the action matches the
    // words without needing to change the intent data. Any explicit
    // {open:'downloadClaimSummary'} action also resolves to the same flow below.
    if (action.open === "downloadClaimSummary" ||
        (action.route === "claims.html" && /^download summary$/i.test((label || "").trim()))) {
      downloadClaimSummary(); return;
    }
    if (action.route) { route(action.route); return; }
    if (action.open === "paySheet") { openPaySheet(); return; }
    if (action.open === "idCard") { openIdCard(); return; }
    if (action.open === "callback") { toast("Callback requested — someone will reach out today about CLM-31182.", "ai", { title: "Callback requested" }); return; }
    if (action.open === "emailSupport") { toast("Opening a message to help@self-insure.com…", "info"); return; }
    if (action.open === "fileClaim") { route("claims.html#file"); return; }
    if (action.send) { sendUserMessage(action.send, scrollEl, chipsEl); return; }
  }

  /* Download the canonical claim's summary straight from chat — mirrors the
     claims.html claimSummaryText() so a chip labelled "Download summary" truly
     downloads (no dead route). Reads CLM-31182 from SI.account. */
  function claimSummaryText(c) {
    var p = A.policy;
    return "SELF-INSURE — CLAIM SUMMARY\n\n" +
      "Claim:       " + c.id + "\n" +
      "Policy:      " + p.number + "\n" +
      "Type:        " + c.title + "\n" +
      "Filed:       " + (c.filedDisplay || (c.filedDate + " " + (c.filedTime || ""))) + "\n" +
      "Status:      " + c.status + "\n\n" +
      "Assessed damage:   " + fmtCurrency0(c.grossAmount) + "\n" +
      "Deductible:        " + fmtCurrency0(c.deductibleApplied) + "\n" +
      "Net payout:        " + fmtCurrency0(c.netPayout) + "\n" +
      "Funds timing:      " + (c.fundsTiming || "Same day") + "\n" +
      "Method:            " + (c.payoutMethod || "ACH to linked account") + "\n\n" +
      "Assessed by the Self-Insure AI model at " +
      Math.round((c.decisionConfidence || .97) * 100) + "% confidence.\n";
  }
  function downloadClaimSummary() {
    var c = (A.claims && A.claims[0]) || null;
    if (!c) { route("claims.html"); return; }
    downloadText(c.id + "-summary.txt", claimSummaryText(c));
    toast("Downloaded " + c.id + " summary.", "ai", { title: "Claim summary" });
  }

  /* --- the core send + stream --- */
  var _streaming = false;
  function sendUserMessage(text, scrollEl, chipsEl) {
    if (!text || _streaming) return;
    text = text.trim(); if (!text) return;
    // render user bubble + persist
    var userHTML = escapeHtml(text);
    pushChat("user", userHTML);
    appendBubble(scrollEl, "user", userHTML);
    if (chipsEl) chipsEl.innerHTML = "";
    // thinking
    var typing = document.createElement("div");
    typing.className = "msg ai";
    typing.innerHTML = '<span class="av">' + icon("spark") + '</span><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
    scrollEl.appendChild(typing); scrollEl.scrollTop = scrollEl.scrollHeight;
    _streaming = true;

    var intent = matchIntent(text);
    var answer = intent.answer(A);
    setTimeout(function () {
      typing.remove();
      streamAnswer(answer, intent, scrollEl, chipsEl);
    }, 520);
  }

  function streamAnswer(answer, intent, scrollEl, chipsEl) {
    var bubbleWrap = document.createElement("div");
    bubbleWrap.className = "msg ai";
    bubbleWrap.innerHTML = '<span class="av">' + icon("spark") + '</span><div class="bubble" aria-live="polite"><span class="stream"></span><span class="caret"></span></div>';
    scrollEl.appendChild(bubbleWrap);
    var streamEl = bubbleWrap.querySelector(".stream");
    var caret = bubbleWrap.querySelector(".caret");
    var i = 0, plain = answer;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var step = reduce ? plain.length : Math.max(1, Math.round(plain.length / 120));

    function tick() {
      i += step;
      streamEl.innerHTML = mdBold(escapeHtml(plain.slice(0, i)));
      scrollEl.scrollTop = scrollEl.scrollHeight;
      if (i < plain.length) { setTimeout(tick, reduce ? 0 : 16); }
      else { finishAnswer(); }
    }
    function finishAnswer() {
      if (caret) caret.remove();
      var fullHTML = mdBold(escapeHtml(plain));
      if (intent.cards) fullHTML += intent.cards.map(cardHTML).join("");
      bubbleWrap.querySelector(".bubble").innerHTML = fullHTML;
      // persist with chips metadata
      var c = getChat();
      c.push({ role: "ai", html: fullHTML, chips: intent.chips || null });
      setChat(c);
      _streaming = false;
      if (chipsEl) { chipsEl.innerHTML = chipHTML(intent.chips); wireChips(chipsEl, scrollEl, chipsEl); }
      // also reflect chips inside the page rail if present
      scrollEl.scrollTop = scrollEl.scrollHeight;
      window.dispatchEvent(new CustomEvent("selfinsure:assistant-answer", { detail: { intent: intent.id } }));
    }
    tick();
  }
  function appendBubble(scrollEl, role, html) {
    var el = document.createElement("div");
    el.className = "msg " + role;
    el.innerHTML = (role === "ai" ? '<span class="av">' + icon("spark") + '</span>' : "") + '<div class="bubble">' + html + '</div>';
    scrollEl.appendChild(el); scrollEl.scrollTop = scrollEl.scrollHeight;
  }
  function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* --- dock open/close + opener --- */
  function ensureOpener(scrollEl, chipsEl) {
    if (getChat().length) { renderTranscript(scrollEl, chipsEl); return; }
    var intent = (SI.intents || []).filter(function (i) { return i.id === "greeting_help"; })[0];
    if (!intent) return;
    var html = mdBold(escapeHtml(intent.answer(A)));
    pushChatWithChips("ai", html, intent.chips);
    renderTranscript(scrollEl, chipsEl);
  }
  function pushChatWithChips(role, html, chips) { var c = getChat(); c.push({ role: role, html: html, chips: chips || null }); setChat(c); }

  function openDock(seed) {
    var dock = document.getElementById("si-dock");
    var fab = document.getElementById("si-fab");
    if (!dock) return;
    dock.classList.add("open"); if (fab) fab.style.display = "none";
    var scroll = document.getElementById("si-dock-scroll");
    var chips = document.getElementById("si-dock-chips");
    if (!dock._wired) wireSurface(dock, scroll, chips, true);
    ensureOpener(scroll, chips);
    renderTranscript(scroll, chips);
    if (seed) { setTimeout(function () { sendUserMessage(seed, scroll, chips); }, 250); }
    var ta = dock.querySelector("textarea"); if (ta && !seed) setTimeout(function () { ta.focus(); }, 250);
  }
  function closeDock() {
    var dock = document.getElementById("si-dock"); var fab = document.getElementById("si-fab");
    if (dock) dock.classList.remove("open"); if (fab) fab.style.display = "";
  }
  SI.assistant = {
    open: openDock, close: closeDock, send: function (t) { openDock(t); },
    matchIntent: matchIntent, mountPage: mountAssistantPage, clear: function () { setChat([]); }
  };

  function wireSurface(rootEl, scrollEl, chipsEl, isDock) {
    rootEl._wired = true;
    var form = rootEl.querySelector("[data-composer]");
    if (form) {
      var ta = form.querySelector("textarea");
      ta.addEventListener("input", function () { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 110) + "px"; });
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); }
      });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = ta.value; ta.value = ""; ta.style.height = "auto";
        sendUserMessage(v, scrollEl, chipsEl);
      });
    }
    if (isDock) {
      var exp = rootEl.querySelector("[data-dock-expand]");
      if (exp) exp.addEventListener("click", function () { route("assistant.html"); });
      var cl = rootEl.querySelector("[data-dock-close]");
      if (cl) cl.addEventListener("click", closeDock);
    }
  }

  /* Full-page assistant: a page calls SI.assistant.mountPage(containerEl). */
  function mountAssistantPage(container) {
    container.innerHTML =
      chatHead(false) +
      '<div class="chat-scroll" id="si-page-scroll" style="flex:1"></div>' +
      '<div class="chat-chips" id="si-page-chips"></div>' +
      composerHTML("page");
    var scroll = container.querySelector("#si-page-scroll");
    var chips = container.querySelector("#si-page-chips");
    wireSurface(container, scroll, chips, false);
    ensureOpener(scroll, chips);
    renderTranscript(scroll, chips);
    return { scroll: scroll, chips: chips, send: function (t) { sendUserMessage(t, scroll, chips); } };
  }

  /* =========================================================================
     11. GLOBAL ACTION DELEGATION + WIRING
     ====================================================================== */
  function doAction(action, anchor) {
    switch (action) {
      case "theme": toggleTheme(); break;
      case "assistant": openDock(); break;
      case "notifs": openNotifs(anchor); break;
      case "avatar": openAvatarMenu(anchor); break;
      case "cmdk": openCmdK(); break;
      case "menu": toggleSidebar(); break;
      case "signout": signOut(); break;
      case "paySheet": openPaySheet(); break;
      case "idCard": openIdCard(); break;
    }
  }
  function toggleSidebar() {
    var sb = document.getElementById("si-sidebar"); var sc = document.getElementById("si-scrim");
    if (!sb) return; var open = sb.classList.toggle("open"); if (sc) sc.classList.toggle("open", open);
  }

  function wireShell() {
    syncThemeIcon();
    document.addEventListener("click", function (e) {
      var actEl = e.target.closest("[data-action]");
      if (actEl) {
        var act = actEl.getAttribute("data-action");
        // let plain nav links route naturally; everything else is handled
        doAction(act, actEl);
        if (act !== "signout") e.preventDefault();
        e.stopPropagation();
        return;
      }
      // close popovers on outside click
      if (_pop && !e.target.closest(".popover")) closePop();
    });
    // scrim closes drawer
    var sc = document.getElementById("si-scrim");
    if (sc) sc.addEventListener("click", function () { toggleSidebar(); });
    // keyboard: cmd/ctrl-k, slash
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); openCmdK(); }
      else if (e.key === "/" && !/input|textarea/i.test((e.target.tagName || ""))) { e.preventDefault(); openCmdK(); }
      else if (e.key === "Escape") { closePop(); }
    });
    // re-theme charts on system/manual theme change
    window.addEventListener("selfinsure:themechange", function () { syncThemeIcon(); setTimeout(retheme, 50); });
    // notif badge refresh on activity changes
    window.addEventListener("selfinsure:activity", refreshNotifBadge);
    refreshNotifBadge();
    // mark just-bound handled by dashboard; expose a ready event
    document.dispatchEvent(new CustomEvent("selfinsure:ready"));
    SI._ready = true;
  }

  /* =========================================================================
     12. BOOT
     ====================================================================== */
  function boot() {
    renderShell();
    // The minimal pre-auth shell self-wires and fires selfinsure:ready; don't double-boot.
    if (SI._ready) return;
    // login page (no shell) still gets theme icon wiring if present
    if (!document.querySelector(".app")) {
      var tb = document.getElementById("si-theme-btn");
      if (tb) { syncThemeIcon(); tb.addEventListener("click", toggleTheme); }
      document.dispatchEvent(new CustomEvent("selfinsure:ready"));
      SI._ready = true;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* expose nav model + misc for screens */
  SI.NAV = NAV;
  SI.PAGE_TITLES = PAGE_TITLES;
  SI.openCmdK = openCmdK;
})();
