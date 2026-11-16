/* index-2 hero: the clip plays for a beat, holds on the phone, and the scan
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
  var PHONE = [.515, .405];                  /* phone centre in the mirrored frame at the hold */
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
  var measure = function () {
    var hb = hero.getBoundingClientRect(), vb = video.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + hb.width + ' ' + hb.height);
    var s = Math.max(vb.width / VW, vb.height / VH), rw = VW * s, rh = VH * s;
    var offX = vb.left - hb.left + (vb.width - rw) / 2, offY = vb.top - hb.top + (vb.height - rh) / 2;
    var cx = offX + PHONE[0] * rw, cy = offY + PHONE[1] * rh;
    var r = Math.max(.17 * rw, .3 * rh) * .46;
    var pb = panel.getBoundingClientRect();
    var copy = hero.querySelector('.qid-hero__copy .qid-scan');
    var clear = cx < (pb.left - hb.left) - 40 && cx > (copy ? copy.getBoundingClientRect().right - hb.left + 10 : 0);
    svg.style.opacity = clear ? '' : 0;
    geo = { hb: hb, cx: cx, cy: cy, r: r };
    [track, outer].forEach(function (c, n) { c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r * (n ? 1.16 : 1)); });
  };

  var arcPath = function (cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + r + ' ' + r + ' 0 0 0 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
  };

  var live = [], lastSpawn = 0;
  var draw = function (now) {
    if (!geo) measure();
    var g = geo, hb = g.hb, phase = svg.getAttribute('data-phase');
    var busy = phase === 'scan' || phase === 'remove';
    /* orbit: faster while working, slow drift otherwise */
    var speed = busy ? .0021 : .0008;
    var head = (now * speed) % (Math.PI * 2);
    if (reduce) head = -Math.PI / 4;
    var step = (SPAN / SEG) * Math.PI / 180;
    for (var i = 0; i < SEG; i++) segs[i].setAttribute('d', arcPath(g.cx, g.cy, g.r, head - i * step, head - (i + 1) * step - .004));

    /* curved data lines from the orbit to each listing as it's found */
    var ends = [];
    rows.forEach(function (row, n) {
      var rb = row.getBoundingClientRect();
      var tx = panel.getBoundingClientRect().left - hb.left - 2, ty = rb.top - hb.top + rb.height / 2;
      var ang = Math.atan2(ty - g.cy, tx - g.cx);
      var sx = g.cx + g.r * Math.cos(ang), sy = g.cy + g.r * Math.sin(ang);
      var dx = tx - sx;
      var d = 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'C' + (sx + dx * .45).toFixed(1) + ' ' + (sy + (ty - sy) * .05).toFixed(1) + ' ' + (tx - dx * .45).toFixed(1) + ' ' + ty.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1);
      var el = links[n];
      if (el.getAttribute('d') !== d) el.setAttribute('d', d);
      var state = row.classList.contains('is-removed') ? 'removed' : row.classList.contains('is-found') ? 'found' : 'off';
      if (el.getAttribute('data-state') !== state) el.setAttribute('data-state', state);
      if (state === 'found') ends.push(el);
    });

    /* round data packets flow along the live lines while scanning or removing */
    if (!reduce && busy && ends.length && now - lastSpawn > 120) {
      var path = ends[Math.floor(Math.random() * ends.length)];
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'qid-beam__packet'); c.setAttribute('r', 2.2);
      packetsG.appendChild(c);
      live.push({ el: c, path: path, born: now, dur: 800 + Math.random() * 400 });
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
  var holdAt = function () { if (video.currentTime >= HOLD) { video.pause(); video.currentTime = HOLD; return true; } return false; };
  var running = false;
  var loop = function (now) {
    if (!video.paused) holdAt();
    draw(now);
    if (running) requestAnimationFrame(loop);
  };
  var go = function () { if (!running) { running = true; requestAnimationFrame(loop); } };
  var stop = function () { running = false; };
  window.addEventListener('resize', function () { geo = null; });

  if (reduce) {
    video.removeAttribute('autoplay'); video.pause();
    var still = function () { try { video.currentTime = HOLD; } catch (e) {} geo = null; draw(0); };
    if (video.readyState >= 1) still(); else video.addEventListener('loadedmetadata', still, { once: true });
    window.addEventListener('resize', still);
    new MutationObserver(function () { draw(0); }).observe(panel, { attributes: true, subtree: true });
    return;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        go();
        if (video.currentTime < HOLD) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } else { stop(); }
    }).observe(hero);
  } else { go(); }
})();
