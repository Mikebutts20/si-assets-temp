/* ============================================================================
   SELF-INSURE — SHARED APP SCRIPT
   ----------------------------------------------------------------------------
   Vanilla JS, no framework, no build step. Loaded by every page.
   Provides:
     - nav active-state (by current filename)
     - smooth in-page scrolling for hash links
     - tab switching for client-app dashboards
     - currency / number formatting (always rounded)
     - reveal-on-scroll + bar-fill animation
     - Chart.js theming helpers (palette-locked)
   Chart.js 4.4.1 is loaded via CDN BEFORE this file on pages that chart.
   ============================================================================ */
(function () {
  'use strict';

  /* ── PALETTE (mirror of CSS tokens, for canvas/Chart.js) ── */
  var PALETTE = {
    bg:        '#08090c',
    surface:   '#0e1015',
    surface2:  '#141720',
    border:    'rgba(255,255,255,0.06)',
    text:      '#e8e6e1',
    secondary: '#9b978f',
    tertiary:  '#6b6760',
    gold:      '#c3aa82',
    goldDim:   'rgba(195,170,130,0.5)',
    goldFill:  'rgba(195,170,130,0.18)',
    positive:  '#7ab88f',
    posFill:   'rgba(122,184,143,0.18)',
    negative:  '#c47a72',
    negFill:   'rgba(196,122,114,0.18)',
    neutral:   '#8a9ab5',
    neutFill:  'rgba(138,154,181,0.18)'
  };

  /* ========================================================================
     FORMATTING — always rounded, never raw floats
     ===================================================================== */
  function fmtCurrency(n) {
    var a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e9) return s + '$' + round(a / 1e9, 1) + 'B';
    if (a >= 1e6) return s + '$' + round(a / 1e6, 1) + 'M';
    if (a >= 1e3) return s + '$' + Math.round(a / 1e3) + 'K';
    return s + '$' + Math.round(a);
  }
  function fmtCurrency0(n) { // whole-dollar, comma grouped
    return (n < 0 ? '-$' : '$') + Math.round(Math.abs(n)).toLocaleString('en-US');
  }
  function fmtNumber(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtPct(n, dp) { return round(n, dp == null ? 1 : dp) + '%'; }
  function fmtMult(n, dp) { return round(n, dp == null ? 1 : dp) + 'x'; }
  function round(n, dp) {
    var f = Math.pow(10, dp || 0);
    var v = Math.round(n * f) / f;
    return (dp ? v.toFixed(dp) : String(v));
  }

  /* ========================================================================
     NAV — active state by filename + smooth scroll for hash links
     ===================================================================== */
  function initNav() {
    var path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (path === '') path = 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      var target = href.split('#')[0];
      if (target === path || (path === 'index.html' && (target === '' || target === 'index.html'))) {
        if (!href.includes('#') || target === path) a.classList.add('active');
      }
    });
    // smooth scroll for same-page hash links
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var el = document.querySelector(id);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
      });
    });
  }

  /* ========================================================================
     TABS — client-app dashboard switching
     Markup contract:
       <button class="tab" data-tab="overview">…</button>
       <div class="tab-panel" data-panel="overview">…</div>
     Tab groups are scoped to the nearest [data-tab-group] ancestor (or document).
     ===================================================================== */
  function initTabs() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        var scope = tab.closest('[data-tab-group]') || document;
        scope.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        scope.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = scope.querySelector('.tab-panel[data-panel="' + key + '"]');
        if (panel) {
          panel.classList.add('active');
          // (re)draw any charts that were hidden while inactive
          panel.querySelectorAll('canvas[data-chart-rerender]').forEach(function (c) {
            if (c._selfInsureChart) c._selfInsureChart.resize();
          });
        }
      });
    });
  }

  /* ========================================================================
     REVEAL + BAR ANIMATION ON SCROLL
     ===================================================================== */
  function initReveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        // animate any width-driven fills inside
        e.target.querySelectorAll('[data-fill]').forEach(function (el) {
          el.style.width = el.getAttribute('data-fill') + '%';
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal, [data-fill-group]').forEach(function (el) { io.observe(el); });
    // stray fills not in a group
    var lone = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.width = e.target.getAttribute('data-fill') + '%';
        lone.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('[data-fill]').forEach(function (el) {
      if (!el.closest('[data-fill-group]') && !el.closest('.reveal')) lone.observe(el);
    });
  }

  /* ========================================================================
     CHART.JS THEMING
     ===================================================================== */
  function applyChartDefaults() {
    if (typeof window.Chart === 'undefined') return;
    var C = window.Chart;
    C.defaults.font.family = "'Inter', sans-serif";
    C.defaults.font.size = 11;
    C.defaults.font.weight = 400;
    C.defaults.color = PALETTE.tertiary;
    C.defaults.borderColor = PALETTE.border;
    C.defaults.plugins.legend.display = false;
    C.defaults.plugins.tooltip.backgroundColor = PALETTE.surface2;
    C.defaults.plugins.tooltip.borderColor = 'rgba(195,170,130,0.25)';
    C.defaults.plugins.tooltip.borderWidth = 1;
    C.defaults.plugins.tooltip.titleColor = PALETTE.text;
    C.defaults.plugins.tooltip.bodyColor = PALETTE.secondary;
    C.defaults.plugins.tooltip.titleFont = { family: "'EB Garamond', serif", size: 13, weight: '500' };
    C.defaults.plugins.tooltip.bodyFont = { family: "'Inter', sans-serif", size: 11 };
    C.defaults.plugins.tooltip.padding = 10;
    C.defaults.plugins.tooltip.cornerRadius = 2;
    C.defaults.plugins.tooltip.displayColors = false;
  }

  // shared axis/grid scaffold; merge overrides per chart
  function baseScales(opts) {
    opts = opts || {};
    return {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: PALETTE.tertiary, font: { size: 10 }, maxRotation: 0 },
        border: { display: false }
      },
      y: {
        grid: { color: PALETTE.border, drawBorder: false },
        ticks: {
          color: PALETTE.tertiary, font: { size: 10 },
          callback: opts.yCallback || undefined
        },
        border: { display: false },
        beginAtZero: opts.beginAtZero !== false
      }
    };
  }

  // mark the enclosing .chart-holder as rendered so its CSS fallback skeleton
  // (shown only when Chart.js is blocked / the CDN failed) is hidden once a chart paints.
  function markRendered(ctx) {
    if (!ctx || !ctx.closest) return;
    var holder = ctx.closest('.chart-holder');
    if (holder) holder.classList.add('chart-holder--rendered');
  }

  // resolve a series color keyword to {line, fill}
  function seriesColor(key) {
    switch (key) {
      case 'positive': return { line: PALETTE.positive, fill: PALETTE.posFill };
      case 'neutral':  return { line: PALETTE.neutral,  fill: PALETTE.neutFill };
      case 'negative': return { line: PALETTE.negative, fill: PALETTE.negFill };
      default:         return { line: PALETTE.gold,     fill: PALETTE.goldFill };
    }
  }

  /* Convenience factory: themed line chart.
     cfg = { canvas, labels, series:[{label,data,color,fill}], yCallback } */
  function lineChart(cfg) {
    if (typeof window.Chart === 'undefined') return null;
    var ctx = (typeof cfg.canvas === 'string') ? document.getElementById(cfg.canvas) : cfg.canvas;
    if (!ctx) return null;
    var datasets = cfg.series.map(function (s) {
      var col = seriesColor(s.color);
      return {
        label: s.label, data: s.data,
        borderColor: col.line,
        backgroundColor: s.fill ? col.fill : 'transparent',
        fill: !!s.fill,
        tension: 0.3, borderWidth: 2,
        pointRadius: 0, pointHoverRadius: 4,
        pointBackgroundColor: col.line, pointBorderColor: PALETTE.bg
      };
    });
    var chart = new window.Chart(ctx, {
      type: 'line',
      data: { labels: cfg.labels, datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: baseScales({ yCallback: cfg.yCallback }),
        plugins: { legend: { display: false } }
      }
    });
    ctx._selfInsureChart = chart;
    markRendered(ctx);
    return chart;
  }

  /* Convenience factory: themed bar chart.
     cfg = { canvas, labels, series:[{label,data,color}], stacked, yCallback } */
  function barChart(cfg) {
    if (typeof window.Chart === 'undefined') return null;
    var ctx = (typeof cfg.canvas === 'string') ? document.getElementById(cfg.canvas) : cfg.canvas;
    if (!ctx) return null;
    var datasets = cfg.series.map(function (s) {
      var col = seriesColor(s.color);
      return {
        label: s.label, data: s.data,
        backgroundColor: col.fill, borderColor: col.line,
        borderWidth: 1, borderRadius: 2, maxBarThickness: 46
      };
    });
    var sc = baseScales({ yCallback: cfg.yCallback });
    if (cfg.stacked) { sc.x.stacked = true; sc.y.stacked = true; }
    var chart = new window.Chart(ctx, {
      type: 'bar',
      data: { labels: cfg.labels, datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: sc,
        plugins: { legend: { display: false } }
      }
    });
    ctx._selfInsureChart = chart;
    markRendered(ctx);
    return chart;
  }

  /* Convenience factory: themed doughnut (e.g. use-of-funds, capital split). */
  function doughnutChart(cfg) {
    if (typeof window.Chart === 'undefined') return null;
    var ctx = (typeof cfg.canvas === 'string') ? document.getElementById(cfg.canvas) : cfg.canvas;
    if (!ctx) return null;
    var goldRamp = ['#c3aa82', '#9b8a6a', '#7ab88f', '#8a9ab5', '#6b6760', '#b89a78'];
    var chart = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: cfg.labels,
        datasets: [{
          data: cfg.data,
          backgroundColor: cfg.colors || goldRamp,
          borderColor: PALETTE.bg, borderWidth: 2, hoverOffset: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: cfg.cutout || '64%',
        plugins: { legend: { display: false } }
      }
    });
    ctx._selfInsureChart = chart;
    markRendered(ctx);
    return chart;
  }

  /* ── EXPOSE PUBLIC API ── */
  window.SelfInsure = {
    PALETTE: PALETTE,
    markRendered: markRendered,
    fmtCurrency: fmtCurrency,
    fmtCurrency0: fmtCurrency0,
    fmtNumber: fmtNumber,
    fmtPct: fmtPct,
    fmtMult: fmtMult,
    round: round,
    baseScales: baseScales,
    seriesColor: seriesColor,
    lineChart: lineChart,
    barChart: barChart,
    doughnutChart: doughnutChart
  };

  /* ── BOOTSTRAP ── */
  function boot() {
    initNav();
    initTabs();
    initReveal();
    applyChartDefaults();
    document.dispatchEvent(new CustomEvent('selfinsure:ready'));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
