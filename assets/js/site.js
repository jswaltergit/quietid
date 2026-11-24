/* QuietID — site behaviour: page-load motion, scroll reveals, counters, mobile menu, Plans dropdown, hero scan demo */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Page load: start the hero sequence once fonts are ready (or after 600ms, whichever is first). */
  var loaded = false;
  var go = function () { if (!loaded) { loaded = true; root.classList.add('qid-loaded'); } };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  setTimeout(go, 600);

  /* Scroll reveals: tag groups, stagger siblings, reveal as they enter the viewport. */
  var groups = [
    ['.qid-exposed__intro', 'up', 0], ['.qid-record', 'scale', 0], ['.qid-record__row', 'up', 90],
    ['.qid-section__head', 'up', 0], ['.qid-step', 'up', 140],
    ['.qid-dash-wrap__copy', 'up', 0], ['.qid-dash', 'scale', 0], ['.qid-dash-wrap__copy li', 'up', 90],
    ['.qid-plan', 'up', 130], ['.qid-plans__all', 'up', 0], ['.qid-steps__more', 'up', 0],
    ['.qid-biz__grid > div', 'up', 0], ['.qid-biz__list li', 'right', 90],
    ['.qid-faq-grid > div:first-child', 'up', 0], ['.qid-faq details', 'up', 70],
    ['.qid-close h2', 'up', 0], ['.qid-close .qid-scan', 'up', 0], ['.qid-footer__top > div', 'up', 80],
    /* interior pages */
    ['.qid-feature', 'up', 90], ['.qid-split__copy', 'up', 0], ['.qid-mock', 'scale', 0], ['.qid-checks li', 'up', 70],
    ['.qid-points li', 'up', 110], ['.qid-tile', 'up', 120], ['.qid-proof > div', 'up', 100],
    ['.qid-band__copy', 'up', 0], ['.qid-form', 'scale', 0], ['.qid-compare-wrap', 'up', 0],
    ['.qid-process > li', 'up', 0], ['.qid-timeline li', 'up', 140], ['.qid-limits > div', 'up', 120],
    ['.qid-principles li', 'up', 120], ['.qid-story__mark', 'scale', 0], ['.qid-person', 'up', 90],
    ['.qid-photo-wrap', 'scale', 0], ['.qid-photo', 'scale', 0], ['.qid-focus__copy', 'up', 0]
  ];
  var tagged = [];
  groups.forEach(function (g) {
    var els = Array.prototype.slice.call(document.querySelectorAll(g[0]));
    els.forEach(function (el, n) {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', g[1]);
      if (g[2]) el.style.setProperty('--qid-delay', (n * g[2]) + 'ms');
      tagged.push(el);
    });
  });
  var counted = function (el) {
    var to = parseFloat(el.getAttribute('data-count-to'));
    var from = parseFloat(el.getAttribute('data-count-from') || '0');
    if (reduce) { el.textContent = to.toLocaleString('en-US'); return; }
    var t0 = null, dur = 1600;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = from; requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window) || reduce) {
    tagged.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.querySelectorAll('[data-count-to]').forEach(counted);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    tagged.forEach(function (el) { io.observe(el); });
  }

  /* Mobile menu: full-screen overlay. Locks page scroll; closes on link tap, Escape, or widening past mobile. */
  var header = document.querySelector('.qid-header');
  var toggle = document.querySelector('.qid-menu-toggle');
  if (header && toggle) {
    var label = toggle.querySelector('.qid-visually-hidden');
    var mobile = window.matchMedia('(max-width: 920px)');
    var setMenu = function (open) {
      header.setAttribute('data-menu', open ? 'open' : 'closed');
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Close Menu' : 'Menu';
      root.classList.toggle('qid-menu-open', open);
    };
    toggle.addEventListener('click', function () { setMenu(header.getAttribute('data-menu') !== 'open'); });
    header.addEventListener('click', function (e) {
      if (header.getAttribute('data-menu') === 'open' && e.target.closest('.qid-nav a, .qid-header__actions a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.getAttribute('data-menu') === 'open') { setMenu(false); toggle.focus(); }
    });
    var onWidth = function () { if (!mobile.matches) setMenu(false); };
    if (mobile.addEventListener) mobile.addEventListener('change', onWidth); else if (mobile.addListener) mobile.addListener(onWidth);
  }

  document.querySelectorAll('.qid-nav__group').forEach(function (group) {
    var btn = group.querySelector('.qid-nav__parent');
    function set(open) {
      group.setAttribute('data-open', String(open));
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      set(group.getAttribute('data-open') !== 'true');
    });
    document.addEventListener('click', function (e) { if (!group.contains(e.target)) set(false); });
    group.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
  });

  /* Demo and contact forms: no backend yet, so show the thank-you state in place. */
  document.querySelectorAll('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('is-sent');
      var done = form.querySelector('.qid-form__done');
      if (done) { done.setAttribute('tabindex', '-1'); done.focus(); }
    });
  });

  /* Login: placeholder until it hands off to the QuietID account system. */
  var login = document.querySelector('[data-demo-login]');
  if (login) login.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!login.querySelector('.qid-account__msg')) {
      var m = document.createElement('p'); m.className = 'qid-account__msg'; m.setAttribute('role', 'status');
      m.textContent = 'Login connects to the QuietID account system at launch.';
      login.appendChild(m);
    }
  });

  /* Pricing: monthly / annual toggle (prices are placeholders until confirmed). */
  var billing = document.querySelector('[data-billing]');
  if (billing) billing.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    billing.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    var label = b.getAttribute('data-period') === 'annual' ? 'Billed annually' : 'Billed monthly';
    document.querySelectorAll('[data-period-label]').forEach(function (l) { l.textContent = label; });
  });

  /* Sign up: scan > results > plan > account > done, on one page. Prefills from the scan forms elsewhere. */
  var stepper = document.querySelector('[data-stepper]');
  if (stepper) {
    var steps = stepper.querySelectorAll('[data-step]');
    var marks = stepper.querySelectorAll('.qid-progress li');
    var current = 1;
    var show = function (n, focus) {
      current = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === n); });
      marks.forEach(function (m, i) {
        m.classList.toggle('is-done', i + 1 < n);
        m.classList.toggle('is-current', i + 1 === n);
        if (i + 1 === n) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current');
      });
      stepper.querySelector('.qid-progress').style.display = n > 4 ? 'none' : '';
      if (focus) { var h = stepper.querySelector('[data-step="' + n + '"] h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
    };
    var params = new URLSearchParams(location.search);
    var scanForm = stepper.querySelector('.qid-scan');
    ['first', 'last', 'state'].forEach(function (k) {
      var v = params.get(k), f = scanForm && scanForm.elements[k];
      if (v && f) f.value = v;
    });
    var plan = params.get('plan');
    if (plan) { var r = stepper.querySelector('input[name="plan"][value="' + plan + '"]'); if (r) r.checked = true; }
    var syncPlan = function () {
      var c = stepper.querySelector('input[name="plan"]:checked');
      stepper.querySelector('[data-plan-name]').textContent = c ? c.parentNode.querySelector('strong').textContent : 'Individual';
    };
    stepper.querySelectorAll('input[name="plan"]').forEach(function (r) { r.addEventListener('change', syncPlan); });
    syncPlan();
    if (scanForm) scanForm.addEventListener('submit', function (e) { e.preventDefault(); show(2, true); });
    stepper.querySelectorAll('[data-next]').forEach(function (b) { b.addEventListener('click', function () { show(current + 1, true); }); });
    stepper.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { show(current - 1, true); }); });
    var acct = stepper.querySelector('form[data-step="4"]');
    if (acct) acct.addEventListener('submit', function (e) { e.preventDefault(); show(5, true); });
    show(params.get('first') && params.get('last') && params.get('state') ? 2 : 1, false);
  }

  /* Hero: two illustrative profiles. J. Ellis: scan finds the listings, then QuietID files removals and they clear.
     Then it cycles once to a second adult, where one listing is no longer visible and another is still pending,
     and settles there (no loop). Reduced motion shows that final frame. */
  var panel = document.querySelector('.qid-exposure');
  if (!panel) return;
  var rows = Array.prototype.slice.call(panel.querySelectorAll('.qid-row'));
  var allRows = rows;
  var count = panel.querySelector('[data-count]');
  var status = panel.querySelector('[data-status]');
  var bar = panel.querySelector('[data-progress]');
  var nameEl = panel.querySelector('.qid-exposure__name');
  var DONE = 'No Longer Visible';
  var profiles = [
    { name: nameEl ? nameEl.textContent : '', rows: rows.map(function (r) {
        return { site: r.querySelector('.qid-row__site').textContent, label: r.querySelector('.qid-row__data small').textContent, value: r.querySelector('[data-redact]').textContent };
      }), outcome: rows.map(function () { return 'gone'; }), end: "Gone Quiet. We'll Keep Watching." },
    { name: 'R. Moreno, Silver Spring, MD', rows: [
        { site: 'Whitepages', label: 'Home Address', value: '27 W••• Ave, Silver Spring' },
        { site: 'Spokeo', label: 'Cell Phone', value: '(555) 555-0187' },
        { site: 'BeenVerified', label: 'Email', value: 'r.moreno@example.com' },
        { site: 'Radaris', label: 'Household', value: 'A. Moreno, L. Moreno' }
      ], outcome: ['gone', 'pending', 'gone', 'pending'], end: '2 Pending. Still Checking.' }
  ];
  var cur = 0;
  var timers = [];
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
  var setCount = function (n) {
    count.textContent = n;
    count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump');
  };
  var chip = function (row, kind, label) {
    var c = row.querySelector('.qid-chip');
    c.className = 'qid-chip qid-chip--' + kind; c.textContent = label;
  };
  var redactNow = function (row) {
    var el = row.querySelector('[data-redact]');
    var w = el.getBoundingClientRect().width;
    el.innerHTML = '<span class="qid-bar" style="width:' + Math.round(Math.min(w || 100, 100)) + 'px"></span>';
  };
  var scramble = function (row, done) {
    var el = row.querySelector('[data-redact]');
    var text = el.textContent, glyphs = '#%&@$*/\\<>?';
    var frames = 9, f = 0;
    var tick = function () {
      f += 1;
      var keep = Math.max(0, text.length - Math.ceil(text.length * f / frames));
      var out = '';
      for (var k = 0; k < text.length; k++) {
        out += (k < keep || text[k] === ' ') ? text[k] : glyphs[(k * 7 + f * 3) % glyphs.length];
      }
      el.textContent = out;
      if (f < frames) later(tick, 45); else { redactNow(row); done(); }
    };
    tick();
  };
  /* Phones and tablets (home hero): two listings show at a time; the list slides to keep the active one in view. */
  var win = panel.querySelector('.qid-exposure__window');
  var windowed = function () { return !!win && window.matchMedia('(max-width: 920px)').matches; };
  var fitWindow = function () {
    if (!win) return;
    if (!windowed() || allRows.length < 3) { win.style.removeProperty('--qid-win'); win.style.setProperty('--qid-shift', '0px'); return; }
    win.style.setProperty('--qid-win', (allRows[2].offsetTop - allRows[0].offsetTop + 1) + 'px');
  };
  var showFrom = function (i, jump) {
    if (!windowed()) return;
    fitWindow();
    i = Math.max(0, Math.min(i, allRows.length - 2));
    if (jump) { win.classList.add('is-jump'); }
    win.style.setProperty('--qid-shift', -(allRows[i].offsetTop - allRows[0].offsetTop) + 'px');
    if (jump) { void win.offsetWidth; win.classList.remove('is-jump'); }
  };
  window.addEventListener('resize', function () { fitWindow(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWindow);
  var load = function (p) {
    var pr = profiles[p];
    if (nameEl) nameEl.textContent = pr.name;
    rows.forEach(function (r, n) {
      var d = pr.rows[n];
      r.querySelector('.qid-row__site').textContent = d.site;
      r.querySelector('.qid-row__data small').textContent = d.label;
      r.querySelector('[data-redact]').textContent = d.value;
    });
  };
  var reset = function (p) {
    timers.forEach(clearTimeout); timers = [];
    cur = p; load(p);
    fitWindow(); if (win) showFrom(0, true);
    panel.setAttribute('data-phase', 'idle');
    rows.forEach(function (r) { r.className = 'qid-row'; chip(r, 'exposed', 'Exposed'); });
    count.textContent = '0'; status.textContent = 'Ready to Scan';
    bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = '';
  };
  var settle = function (p) {
    /* the final frame of a profile, without animation */
    var pr = profiles[p], left = 0;
    load(p); fitWindow();
    rows.forEach(function (r, n) {
      if (pr.outcome[n] === 'gone') { r.className = 'qid-row is-found is-removed'; chip(r, 'removed', DONE); redactNow(r); }
      else { r.className = 'qid-row is-found'; chip(r, 'pending', 'Pending'); left += 1; }
    });
    panel.setAttribute('data-phase', 'done');
    count.textContent = left; bar.style.width = '100%';
    status.textContent = pr.end;
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settle(profiles.length - 1);
    return;
  }

  var run = function (p) {
    reset(p);
    var pr = profiles[p];
    /* Only animate the listings that are showing (phones show fewer). */
    var rows = allRows.filter(function (r) { return r.offsetParent !== null; });
    var t = 500, found = 0;
    later(function () {
      panel.setAttribute('data-phase', 'scan');
      status.textContent = 'Searching People-Search Sites';
      bar.style.transition = 'width 2.6s linear'; bar.style.width = '100%';
    }, t);
    rows.forEach(function (r, n) {
      if (n >= 2) later(function () { showFrom(n - 1); }, t + 500 + n * 550 - 60);
      later(function () {
        r.classList.add('is-found'); found += 1; setCount(found);
        status.textContent = 'Found on ' + r.querySelector('.qid-row__site').textContent;
      }, t + 500 + n * 550);
    });
    t += 500 + rows.length * 550 + (windowed() ? 900 : 500);
    later(function () {
      panel.setAttribute('data-phase', 'remove');
      status.textContent = 'Filing Removal Requests';
      showFrom(0);
    }, t);
    t += windowed() ? 900 : 400;
    var pageGap = 0;
    rows.forEach(function (r, n) {
      /* phones: after each pair is cleared, slide up to the next pair */
      if (windowed() && n >= 2 && n % 2 === 0) { later(function () { showFrom(n); }, t + n * 900 + pageGap + 200); pageGap += 800; }
      var at = t + n * 900 + pageGap;
      var idx = allRows.indexOf(r);
      later(function () { chip(r, 'pending', 'Removing'); }, at);
      if (pr.outcome[idx] === 'pending') {
        later(function () { chip(r, 'pending', 'Pending'); }, at + 600);
        return;
      }
      later(function () {
        scramble(r, function () {
          chip(r, 'removed', DONE); r.classList.add('is-removed');
          found -= 1; setCount(found);
        });
      }, at + 300);
    });
    t += rows.length * 900 + pageGap + 500;
    later(function () {
      panel.setAttribute('data-phase', 'done');
      status.textContent = pr.end;
    }, t);
    /* cycle once to the next profile, then settle */
    if (p + 1 < profiles.length) later(function () { run(p + 1); }, t + 3500);
  };

  var started = false;
  var start = function () { if (!started) { started = true; run(0); } };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { start(); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(panel);
  } else { start(); }
})();

/* Who We Protect headers: line the box's top up with the top of the intro paragraph (desktop) */
(function () {
  var heroes = document.querySelectorAll('.qid-page-hero--image');
  if (!heroes.length) return;
  function align() {
    heroes.forEach(function (h) {
      var card = h.querySelector('.qid-hero-card'), lede = h.querySelector('.qid-page-hero__lede');
      if (!card || !lede) return;
      if (window.innerWidth <= 920) { card.style.marginTop = ''; return; }
      var m = parseFloat(card.style.marginTop) || 0;
      var d = lede.getBoundingClientRect().top - card.getBoundingClientRect().top;
      card.style.marginTop = Math.max(0, m + d) + 'px';
    });
  }
  align();
  window.addEventListener('resize', align);
  window.addEventListener('load', align);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
  /* re-measure once the entrance animations (which move both elements) have finished */
  heroes.forEach(function (h) { h.addEventListener('animationend', align); });
  setTimeout(align, 1600);
})();
