/* index-2 hero: track the phone in the video and project the scan demo out of it. */
(function () {
  var hero = document.querySelector('.qid-hero--video');
  if (!hero) return;
  var video = hero.querySelector('[data-hero-video]');
  var svg = hero.querySelector('[data-hero-beam]');
  var panel = hero.querySelector('.qid-exposure');
  var fill = svg.querySelector('[data-beam-fill]');
  var grad = svg.querySelector('[data-beam-grad]');
  var edgeA = svg.querySelector('[data-beam-edge="a"]');
  var edgeB = svg.querySelector('[data-beam-edge="b"]');
  var frame = svg.querySelector('[data-beam-frame]');
  var packets = svg.querySelector('[data-beam-packets]');
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Phone centre in the (mirrored) source frame, 0-1, sampled once a second over the 5.5s clip.
     The file plays the clip forward then backward, so the loop is 11s. */
  var K = [[.52, .37], [.49, .40], [.46, .40], [.43, .46], [.44, .55], [.45, .63], [.44, .70], [.44, .75], [.43, .84]];
  var VW = 1280, VH = 720;
  var phoneAt = function (t) {
    t = t % 11; if (t > 5.5) t = 11 - t;
    var i = Math.min(7, Math.floor(t)), f = t - i;
    f = f * f * (3 - 2 * f);
    return [K[i][0] + (K[i + 1][0] - K[i][0]) * f, K[i][1] + (K[i + 1][1] - K[i][1]) * f];
  };

  var setPhase = function () { svg.setAttribute('data-phase', panel.getAttribute('data-phase') || 'idle'); };
  if (panel) { setPhase(); new MutationObserver(setPhase).observe(panel, { attributes: true, attributeFilter: ['data-phase'] }); }

  var live = [];
  var spawn = function () {
    var r = document.createElementNS(NS, 'rect');
    r.setAttribute('class', 'qid-beam__packet'); r.setAttribute('rx', 1);
    packets.appendChild(r);
    live.push({ el: r, born: performance.now(), dur: 900 + Math.random() * 500, lane: Math.random() });
  };
  var lastSpawn = 0;

  var draw = function (now) {
    if (getComputedStyle(svg).display === 'none' || !panel) return;
    var hb = hero.getBoundingClientRect(), vb = video.getBoundingClientRect(), pb = panel.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + hb.width + ' ' + hb.height);
    var s = Math.max(vb.width / VW, vb.height / VH);
    var rw = VW * s, rh = VH * s;
    var offX = vb.left - hb.left + (vb.width - rw) / 2, offY = vb.top - hb.top + (vb.height - rh) / 2;
    var p = phoneAt(video.currentTime || 0);
    var cx = offX + p[0] * rw, cy = offY + p[1] * rh;
    var fw = .17 * rw, fh = .3 * rh;            /* phone footprint in the frame */
    /* the projection leaves the device's right edge and opens onto the card */
    var ex = cx + fw * .38, ey1 = cy - fh * .28, ey2 = cy + fh * .28;
    /* only show the projection when the device sits clear of the copy and the card */
    var copy = hero.querySelector('.qid-hero__copy .qid-scan');
    var clear = cx < (pb.left - hb.left) - 40 && cx > (copy ? copy.getBoundingClientRect().right - hb.left + 10 : 0);
    svg.style.opacity = clear ? 1 : 0;
    var px = pb.left - hb.left, py1 = pb.top - hb.top + 14, py2 = pb.bottom - hb.top - 14;
    var top = (ey1 + ey2) / 2, half = (ey2 - ey1) / 2;
    fill.setAttribute('points', [ex, ey1, px, py1, px, py2, ex, ey2].join(' '));
    grad.setAttribute('x1', ex); grad.setAttribute('y1', top); grad.setAttribute('x2', px); grad.setAttribute('y2', (py1 + py2) / 2);
    edgeA.setAttribute('x1', ex); edgeA.setAttribute('y1', ey1); edgeA.setAttribute('x2', px); edgeA.setAttribute('y2', py1);
    edgeB.setAttribute('x1', ex); edgeB.setAttribute('y1', ey2); edgeB.setAttribute('x2', px); edgeB.setAttribute('y2', py2);
    /* corner brackets around the device */
    var x0 = cx - fw / 2, x1 = cx + fw / 2, y0 = cy - fh / 2, y1 = cy + fh / 2, k = Math.min(fw, fh) * .18;
    frame.setAttribute('d', 'M' + x0 + ' ' + (y0 + k) + 'V' + y0 + 'H' + (x0 + k) + 'M' + (x1 - k) + ' ' + y0 + 'H' + x1 + 'V' + (y0 + k) +
      'M' + x1 + ' ' + (y1 - k) + 'V' + y1 + 'H' + (x1 - k) + 'M' + (x0 + k) + ' ' + y1 + 'H' + x0 + 'V' + (y1 - k));
    /* data packets travel from the device to the card while scanning or removing */
    var phase = svg.getAttribute('data-phase');
    if (!reduce && (phase === 'scan' || phase === 'remove') && now - lastSpawn > 140) { spawn(); lastSpawn = now; }
    live = live.filter(function (d) {
      var t = (now - d.born) / d.dur;
      if (t >= 1) { d.el.remove(); return false; }
      var e = t * t * (3 - 2 * t);
      var sy = ey1 + d.lane * (ey2 - ey1), tx = px, ty = py1 + d.lane * (py2 - py1);
      var x = ex + (tx - ex) * e, y = sy + (ty - sy) * e;
      var len = 10 + 14 * Math.sin(Math.PI * t), ang = Math.atan2(ty - sy, tx - ex) * 180 / Math.PI;
      d.el.setAttribute('x', x - len / 2); d.el.setAttribute('y', y - 1); d.el.setAttribute('width', len); d.el.setAttribute('height', 2);
      d.el.setAttribute('transform', 'rotate(' + ang + ' ' + x + ' ' + y + ')');
      d.el.setAttribute('opacity', (Math.sin(Math.PI * t) * .9).toFixed(2));
      return true;
    });
  };

  var running = false;
  var loop = function (now) { draw(now); if (running) requestAnimationFrame(loop); };
  var go = function () { if (!running) { running = true; requestAnimationFrame(loop); } };
  var stop = function () { running = false; };

  if (reduce) {
    video.removeAttribute('autoplay'); video.pause();
    var still = function () { draw(performance.now()); };
    still(); window.addEventListener('resize', still);
    if (panel) new MutationObserver(still).observe(panel, { attributes: true, subtree: true });
    return;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { go(); var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else { stop(); video.pause(); }
    }).observe(hero);
  } else { go(); }
})();
