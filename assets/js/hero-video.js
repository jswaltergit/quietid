/* Home and Who We Protect headers: compact bar once the visitor scrolls */
(function () {
  var h = document.querySelector('.qid-header--overlay');
  if (!h) return;
  var set = function () { h.classList.toggle('is-scrolled', window.scrollY > 24); };
  set(); window.addEventListener('scroll', set, { passive: true });
})();

/* Home hero: the clip plays for a beat, holds on the phone, and the scan
   demo runs out of the device: a gradient orbit circles the phone and curved
   data lines reach each listing as it's found. */
(function () {
  var hero = document.querySelector('.qid-hero--video');
  if (!hero) return;
  var video = hero.querySelector('[data-hero-video]');
  var svg = hero.querySelector('[data-hero-beam]');
  var panel = hero.querySelector('.qid-exposure');
  if (!panel) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD = 1.1;                          /* seconds of footage before it holds */
  var CORNER = [.605, .27];                  /* phone's top-right corner in the mirrored frame at the hold */
  var ZOOM = .84;                            /* clip height as a share of the hero: lower = more zoomed out */
  var ORBIT = [.555, .37];                   /* orbit centre: over the phone's upper half */
  var VW = 1280, VH = 720;

  var track = svg.querySelector('[data-orbit-track]');
  var outer = svg.querySelector('[data-orbit-outer]');
  var arcG = svg.querySelector('[data-orbit-arc]');
  var linksG = svg.querySelector('[data-beam-links]');
  var packetsG = svg.querySelector('[data-beam-packets]');
  var rows = Array.prototype.slice.call(panel.querySelectorAll('.qid-row'));

  /* gradient arc: a comet of short segments, bright at the head, fading to nothing (like the mark) */
  var SEG = 36, SPAN = 200;
  var segs = [];
  for (var i = 0; i < SEG; i++) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'qid-orbit__seg');
    var k = 1 - i / SEG;
    p.setAttribute('stroke-opacity', (k * k).toFixed(3));
    p.setAttribute('stroke', i < 3 ? '#ffffff' : '#a9cfff');
    arcG.appendChild(p); segs.push(p);
  }
  var links = rows.map(function () {
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'qid-link'); path.setAttribute('stroke', 'url(#qid-link-grad)');
    linksG.appendChild(path);
    return path;
  });

  var setPhase = function () { svg.setAttribute('data-phase', panel.getAttribute('data-phase') || 'idle'); };
  setPhase(); new MutationObserver(setPhase).observe(panel, { attributes: true, attributeFilter: ['data-phase'] });

  var geo = null;
  var media = hero.querySelector('.qid-hero__media');
  var isMob = function () { return window.innerWidth <= 920; };
  if (isMob()) { video.removeAttribute('autoplay'); video.preload = 'none'; video.pause(); }
  var measure = function () {
    /* slide the scene so the phone's corner lands just left of the card, whatever the screen width */
    var desk = getComputedStyle(svg).display !== 'none' && window.innerWidth > 920;
    media.style.left = '0px'; media.style.width = ''; media.style.top = '';
    var hb = hero.getBoundingClientRect(), vb = video.getBoundingClientRect();
    if (desk) {
      /* show as much of the frame as possible: fit the clip to the hero's height (no extra zoom),
         slide it so the phone's corner lands just left of the card, and only widen it if the right edge would show */
      /* the clip sits a little smaller than the hero, anchored to the bottom, its top and left edges fading into navy */
      var Hh = hb.height * ZOOM, Wh = hb.width, want = panel.getBoundingClientRect().left - hb.left + 4;
      var w = Hh * VW / VH, left = want - CORNER[0] * w;
      left = Math.max(Math.min(left, .38 * Wh), Wh - w * 1.3);   /* the right edge may come in a little; it fades out */
      media.style.width = Math.round(w) + 'px'; media.style.left = Math.round(left) + 'px';
      /* lift the clip so the top of the phone lines up with the Q icon in the card's header */
      var rhFit = w * VH / VW, icon = panel.querySelector('.qid-exposure__radar');
      var top = hb.height - rhFit;
      if (icon) top = icon.getBoundingClientRect().top - hb.top + 4 - CORNER[1] * rhFit;
      top = Math.max(top, hb.height - rhFit - .16 * hb.height);   /* never float too far off the bottom */
      media.style.top = Math.round(Math.min(top, hb.height - rhFit)) + 'px';
      vb = video.getBoundingClientRect();
    } else if (isMob()) {
      /* phones and tablets: no video; the orbit sits in the open space just left of the card */
      var cb = panel.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + hb.width + ' ' + hb.height);
      /* centred on the card's top-left corner; may run up behind the headline a little */
      var kx0 = cb.left - hb.left, mr = Math.max(46, Math.min(cb.height * .34, kx0 * .7));
      geo = { hb: hb, cx: kx0, cy: cb.top - hb.top, r: mr, clear: true };
      return;
    }
    svg.setAttribute('viewBox', '0 0 ' + hb.width + ' ' + hb.height);
    var s = Math.max(vb.width / VW, vb.height / VH), rw = VW * s, rh = VH * s;
    var offX = vb.left - hb.left + (vb.width - rw) / 2, offY = vb.top - hb.top + (vb.height - rh) / 2;
    var cx = offX + ORBIT[0] * rw, cy = offY + ORBIT[1] * rh;
    var pb = panel.getBoundingClientRect();
    /* the orbit takes in the top of the phone; make sure the card's top-left corner sits inside it */
    var kx = pb.left - hb.left, ky = pb.top - hb.top;
    var r = Math.max(.15 * rw, Math.min(Math.hypot(kx - cx, ky - cy) + 34, .19 * rw));
    var copy = hero.querySelector('.qid-hero__copy .qid-hero__actions, .qid-hero__copy .qid-scan');
    var clear = window.innerWidth <= 920 ? true : cx < kx + 40 && cx > (copy ? copy.getBoundingClientRect().right - hb.left - 30 : 0);
    geo = { hb: hb, cx: cx, cy: cy, r: r, clear: clear };
  };
  var onAt = null;                         /* when the orbit switches on, as the footage comes to rest */
  var switchOn = function (now) { if (onAt === null) onAt = now; };
  var angle = -Math.PI / 2, curSpeed = 0, lastNow = null;

  var arcPath = function (cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + r + ' ' + r + ' 0 0 0 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
  };

  var live = [], lastSpawn = 0;
  var draw = function (now) {
    if (!geo) measure();
    var g0 = geo, hb = g0.hb, phase = svg.getAttribute('data-phase');
    var since = onAt === null ? -1 : now - onAt;
    svg.style.opacity = (since >= 0 && g0.clear) ? 1 : 0;
    var grow = since < 0 ? 0 : Math.min(1, since / 1100); grow = 1 - Math.pow(1 - grow, 3);
    var g = { cx: g0.cx, cy: g0.cy, r: g0.r * (.82 + .18 * grow) };
    [track, outer].forEach(function (c, n) { c.setAttribute('cx', g.cx); c.setAttribute('cy', g.cy); c.setAttribute('r', g.r * (n ? 1.16 : 1)); });
    var busy = phase === 'scan' || phase === 'remove';
    /* orbit: faster while working, slow drift otherwise */
    var dt = lastNow === null ? 16 : Math.min(64, now - lastNow); lastNow = now;
    var target = since < 0 ? 0 : (busy ? .0011 : .00045);
    curSpeed += (target - curSpeed) * Math.min(1, dt / 1200);   /* ease between speeds, never jump */
    angle += curSpeed * dt;
    var head = angle;
    if (reduce) head = -Math.PI / 4;
    var step = (SPAN / SEG) * Math.PI / 180;
    for (var i = 0; i < SEG; i++) segs[i].setAttribute('d', arcPath(g.cx, g.cy, g.r, head - i * step, head - (i + 1) * step - .004));

    /* curved data lines from the orbit to each listing as it's found */
    var ends = [];
    /* only lines to listings in view (phones scroll the list through a two-row window) */
    var winEl = panel.querySelector('.qid-exposure__window'), wr = winEl && winEl.getBoundingClientRect();
    var shown = rows.filter(function (r) {
      if (r.offsetParent === null) return false;
      if (!wr || !wr.height || window.innerWidth > 920) return true;
      var rr = r.getBoundingClientRect(), mid = rr.top + rr.height / 2;
      return mid > wr.top && mid < wr.bottom;
    });
    rows.forEach(function (row) {
      var n = shown.indexOf(row), el0 = links[rows.indexOf(row)];
      if (n < 0) { if (el0.getAttribute('data-state') !== 'off') el0.setAttribute('data-state', 'off'); return; }
      var rb = row.getBoundingClientRect();
      var tx = panel.getBoundingClientRect().left - hb.left - 2, ty = rb.top - hb.top + rb.height / 2;
      /* leave from the orbit's left side, spread evenly top to bottom, and ease across into the card's edge
         (lines run left to right and never loop below the card) */
      var N = shown.length, k = N > 1 ? n / (N - 1) : .5;
      var sy = g.cy + (-.5 + k) * 1.1 * g.r;
      var sx = g.cx - Math.sqrt(Math.max(0, g.r * g.r - (sy - g.cy) * (sy - g.cy)));
      var span = Math.max(40, tx - sx);
      var d = 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) +
        'C' + (sx + span * .45).toFixed(1) + ' ' + sy.toFixed(1) + ' ' +
        (tx - span * .45).toFixed(1) + ' ' + ty.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1);
      var el = el0;
      if (el.getAttribute('d') !== d) el.setAttribute('d', d);
      var state = row.classList.contains('is-removed') ? 'removed' : row.classList.contains('is-found') ? 'found' : 'off';
      if (el.getAttribute('data-state') !== state) el.setAttribute('data-state', state);
      if (state === 'found') ends.push(el);
    });

    /* round data packets flow along the live lines while scanning or removing */
    if (!reduce && busy && ends.length && now - lastSpawn > 260) {
      var path = ends[Math.floor(Math.random() * ends.length)];
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'qid-beam__packet'); c.setAttribute('r', 2.2);
      packetsG.appendChild(c);
      live.push({ el: c, path: path, born: now, dur: 1800 + Math.random() * 700 });
      lastSpawn = now;
    }
    live = live.filter(function (d) {
      var t = (now - d.born) / d.dur;
      if (t >= 1 || !d.path.isConnected) { d.el.remove(); return false; }
      var len = d.path.getTotalLength(), pt = d.path.getPointAtLength(len * (t * t * (3 - 2 * t)));
      d.el.setAttribute('cx', pt.x); d.el.setAttribute('cy', pt.y);
      d.el.setAttribute('opacity', (Math.sin(Math.PI * t)).toFixed(2));
      return true;
    });
  };

  /* the footage: play a beat, then hold on the phone */
  var holdAt = function (now) { if (video.currentTime >= HOLD) { video.pause(); video.currentTime = HOLD; switchOn(now); return true; } return false; };
  var running = false, started = performance.now();
  var loop = function (now) {
    if (!video.paused) { if (video.currentTime >= HOLD - .35) switchOn(now); holdAt(now); }
    else if (video.currentTime >= HOLD - .05 || now - started > (isMob() ? 900 : 2200)) switchOn(now);
    draw(now);
    if (running) requestAnimationFrame(loop);
  };
  var go = function () { if (!running) { running = true; requestAnimationFrame(loop); } };
  var stop = function () { running = false; };
  window.addEventListener('resize', function () {
    geo = null;
    /* widened from phone to desktop: start the footage that was skipped */
    if (!isMob() && !reduce && video.paused && video.currentTime < HOLD) {
      video.preload = 'auto'; var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
    }
  });
  panel.addEventListener('animationend', function () { geo = null; });

  if (reduce) {
    video.removeAttribute('autoplay'); video.pause();
    var still = function () { try { video.currentTime = HOLD; } catch (e) {} geo = null; onAt = -1000; draw(0); };
    if (video.readyState >= 1) still(); else video.addEventListener('loadedmetadata', still, { once: true });
    window.addEventListener('resize', still);
    new MutationObserver(function () { draw(0); }).observe(panel, { attributes: true, subtree: true });
    return;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        go();
        if (!isMob() && video.currentTime < HOLD) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } else { stop(); }
    }).observe(hero);
  } else { go(); }
})();

/* Home hero: a quiet field of blue data points drifting through the scene. */
(function () {
 if (!window.HTMLCanvasElement) return;
 /* every hero that wants the field, plus the closing scan sections */
 document.querySelectorAll('.qid-hero--video, .qid-page-hero--image, .qid-account--field, .qid-page-hero--field, .qid-close').forEach(function (hero) {
  var realMedia = hero.querySelector('.qid-hero__media, .qid-page-hero__media');
  var media = realMedia || hero.firstElementChild;
  if (!media) return;
  var cv = document.createElement('canvas');
  cv.className = 'qid-hero__field'; cv.setAttribute('aria-hidden', 'true');
  /* sits above the colour overlays (so it reads as light, not murk), below the orbit and the content */
  var beam = hero.querySelector('[data-hero-beam]');
  hero.insertBefore(cv, beam || (realMedia ? realMedia.nextSibling : hero.firstChild));
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, Z = 1;
  var homeHero = hero.classList.contains('qid-hero--video');
  var size = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    /* home, phones and tablets: a much finer field (smaller waves, smaller and denser points), as if seen from further back */
    Z = homeHero && window.innerWidth <= 920 ? 2.4 : 1;
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  /* a rolling surface of points in perspective, plus loose motes that rise and twinkle */
  var COLS = 170, ROWS = 30;
  var motes = [];
  for (var m = 0; m < 70; m++) motes.push({ x: Math.random(), y: Math.random(), s: .4 + Math.random() * 1.1, v: .004 + Math.random() * .01, p: Math.random() * 6.28 });
  var frame = function (t) {
    ctx.clearRect(0, 0, W, H);
    var horizon = H * .44, f = W * .55;
    var NR = Math.round(ROWS * Z), NC = Math.round(COLS * Z), zs = .16 / Z, xr = 15 / Math.max(1, Z * .55);
    for (var r = 0; r < NR; r++) {
      var z = 1 + r * zs - ((t * .00006 / Z) % zs);         /* the field slides slowly toward the viewer */
      var depth = 1 - r / NR;
      for (var c = 0; c < NC; c++) {
        var x = (c / (NC - 1) - .5) * xr;
        if (Z > 1 && Math.abs((x / z) * f) > W * .7) continue;  /* off screen: skip */
        var y = .62 + .26 / Z * Math.sin(x * .8 * Z + t * .00022) * Math.cos(z * 1.1 * Z - t * .00018);
        var sx = W * .6 + (x / z) * f, sy = horizon + (y / z) * f * (Z > 1 ? 1.45 : .9);
        if (sx < -4 || sx > W + 4 || sy > H + 4) continue;
        var a = .95 * Math.pow(depth, 1.3);
        var lift = .5 + .8125 * (y - .62) / (.26 / Z);                         /* crests catch more light */
        ctx.fillStyle = 'rgba(' + (lift > .7 ? '169,207,255' : '90,157,224') + ',' + Math.min(.95, a * (.65 + .55 * lift)).toFixed(3) + ')';
        var d = Math.max(Z > 1 ? .9 : 1, 3 / Math.sqrt(z) / Z);
        ctx.fillRect(sx - d / 2, sy - d / 2, d, d);
      }
    }
    motes.forEach(function (o) {
      var yy = ((o.y - t * o.v * .00003) % 1 + 1) % 1;
      var tw = .25 + .75 * Math.pow(Math.sin(o.p + t * .0012 * o.s), 2);
      ctx.fillStyle = 'rgba(169,207,255,' + (.6 * tw).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(o.x * W, yy * H, o.s, 0, 6.283); ctx.fill();
    });
  };
  size(); window.addEventListener('resize', size);
  if (reduce) { frame(0); window.addEventListener('resize', function () { frame(0); }); return; }
  var on = false, last = 0;
  var loop = function (t) {
    if (!on) return;
    if (t - last > 33) { frame(t); last = t; }               /* ~30fps is plenty for slow drift */
    requestAnimationFrame(loop);
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !on) { on = true; requestAnimationFrame(loop); } else if (!vis) on = false;
    }).observe(hero);
  } else { on = true; requestAnimationFrame(loop); }
 });
})();
