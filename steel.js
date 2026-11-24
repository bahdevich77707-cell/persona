/* Живые «заливки» расплавленной стали на <canvas data-steel="pour|flow">.
   pour: из ковша льётся струя стали, внизу светящаяся лужа и искры.
   flow: горизонтальная полоса текущего расплавленного металла.
   Рисуется кодом, без видеофайлов. Останавливается, когда холст не виден. */
(function () {
  var canvases = document.querySelectorAll('canvas[data-steel]');
  if (!canvases.length || !window.requestAnimationFrame) return;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };

  function setup(cv) {
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var mode = cv.getAttribute('data-steel');
    var W = 0, H = 0, dpr = 1, visible = true, last = performance.now(), t = 0;
    var sparks = [], embers = [], blobs = [], crust = [], ripples = [];

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (mode === 'flow') {
        blobs = []; crust = [];
        for (var i = 0; i < Math.max(30, W / 18); i++) blobs.push({ x: rnd(0, W), y: rnd(-.35, .35), r: rnd(10, 46), s: rnd(50, 110), a: rnd(.15, .45) });
        for (var j = 0; j < Math.max(10, W / 70); j++) crust.push({ x: rnd(0, W), y: rnd(-.3, .3), r: rnd(14, 50), s: rnd(35, 70), a: rnd(.18, .4) });
      }
    }
    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { last = performance.now(); loop(last); } }).observe(cv);
    }

    /* ---------- pour ---------- */
    function geom() {
      var small = W < 720;
      var sx = small ? W * .74 : W / 2 + Math.min(W * .3, 430);
      var top = H * (small ? .2 : .17);
      var pool = H * .84;
      var k = Math.min(1.25, Math.max(.75, H / 600));
      return { sx: sx, top: top, pool: pool, k: k };
    }
    function streamX(g, p, y) {
      return g.sx - 34 * g.k * Math.pow(1 - p, 4) +
        Math.sin(y * .035 - t * 7) * 1.4 * p + Math.sin(y * .012 + t * 2.1) * 3 * p;
    }
    function streamPath(g, scale) {
      var L = [], R = [], step = 4;
      for (var y = g.top; y <= g.pool; y += step) {
        var p = (y - g.top) / (g.pool - g.top);
        var w = lerp(15, 7.5, Math.sqrt(p)) * g.k * scale * (1 + .08 * Math.sin(y * .05 - t * 9));
        var x = streamX(g, p, y);
        L.push([x - w, y]); R.push([x + w, y]);
      }
      ctx.beginPath();
      ctx.moveTo(L[0][0], L[0][1]);
      for (var i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
      for (var j = R.length - 1; j >= 0; j--) ctx.lineTo(R[j][0], R[j][1]);
      ctx.closePath();
    }

    function drawPour(dt) {
      var g = geom();
      var flick = .85 + .15 * Math.sin(t * 13) * Math.sin(t * 7.3);

      /* dark room with warm floor */
      ctx.globalCompositeOperation = 'source-over';
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#060505'); bg.addColorStop(.75, '#0d0806'); bg.addColorStop(1, '#170b05');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      /* heat glow */
      ctx.globalCompositeOperation = 'lighter';
      var gl = ctx.createRadialGradient(g.sx, g.pool, 10, g.sx, g.pool, H * 1.05);
      gl.addColorStop(0, 'rgba(255,140,40,' + (.55 * flick) + ')');
      gl.addColorStop(.25, 'rgba(220,80,20,' + (.22 * flick) + ')');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      var gs = ctx.createLinearGradient(g.sx - 140 * g.k, 0, g.sx + 140 * g.k, 0);
      gs.addColorStop(0, 'rgba(0,0,0,0)'); gs.addColorStop(.5, 'rgba(255,120,30,' + (.16 * flick) + ')'); gs.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gs; ctx.fillRect(0, g.top, W, g.pool - g.top);

      /* ladle */
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.translate(g.sx - 30 * g.k, g.top);
      ctx.rotate(-.42);
      ctx.scale(g.k, g.k);
      var lg = ctx.createLinearGradient(0, -170, 0, 20);
      lg.addColorStop(0, '#0b0908'); lg.addColorStop(.75, '#17110d'); lg.addColorStop(1, '#2a1a10');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(-6, 4); ctx.lineTo(300, 4); ctx.lineTo(320, -230); ctx.lineTo(-30, -230); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a2416'; ctx.fillRect(-14, -2, 330, 12);
      var rim = ctx.createLinearGradient(-14, 0, 316, 0); rim.addColorStop(0, 'rgba(255,170,70,.9)'); rim.addColorStop(.35, 'rgba(255,110,30,.35)'); rim.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = rim; ctx.fillRect(-14, -3, 330, 4);
      /* molten lip */
      ctx.globalCompositeOperation = 'lighter';
      var lip = ctx.createRadialGradient(4, 0, 1, 4, 0, 46);
      lip.addColorStop(0, 'rgba(255,250,220,1)'); lip.addColorStop(.35, 'rgba(255,190,70,.9)'); lip.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = lip; ctx.beginPath(); ctx.ellipse(4, 0, 46, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      /* stream: glow, body, core */
      ctx.globalCompositeOperation = 'lighter';
      ctx.save();
      ctx.shadowColor = 'rgba(255,120,30,.9)'; ctx.shadowBlur = 40 * g.k;
      streamPath(g, 2.1); ctx.fillStyle = 'rgba(255,90,20,.28)'; ctx.fill();
      ctx.restore();
      streamPath(g, 1);
      var sg = ctx.createLinearGradient(0, g.top, 0, g.pool);
      sg.addColorStop(0, '#ffd27a'); sg.addColorStop(.5, '#ffb347'); sg.addColorStop(1, '#ff8a2a');
      ctx.fillStyle = sg; ctx.fill();
      streamPath(g, .45); ctx.fillStyle = 'rgba(255,252,235,.95)'; ctx.fill();

      /* bright streaks running down the stream */
      for (var b = 0; b < 26; b++) {
        var ph = ((t * (.9 + (b % 5) * .07) + b / 26) % 1);
        var p = ph * ph;
        var y = lerp(g.top, g.pool, p);
        var x = streamX(g, p, y) + Math.sin(b * 12.9) * 3 * g.k;
        ctx.fillStyle = 'rgba(255,255,240,' + (.35 + .3 * Math.sin(b)) + ')';
        ctx.beginPath(); ctx.ellipse(x, y, 2.2 * g.k, (6 + 22 * p) * g.k, 0, 0, Math.PI * 2); ctx.fill();
      }

      /* pool */
      var rx = 190 * g.k, ry = 24 * g.k;
      var pg = ctx.createRadialGradient(g.sx, g.pool, 2, g.sx, g.pool, rx);
      pg.addColorStop(0, 'rgba(255,255,235,1)'); pg.addColorStop(.18, 'rgba(255,215,120,.95)');
      pg.addColorStop(.5, 'rgba(255,120,30,.7)'); pg.addColorStop(1, 'rgba(160,30,0,0)');
      /* molten puddle body: bright, slightly breathing */
      var pr = rx * (.62 + .03 * Math.sin(t * 3));
      var pb = ctx.createRadialGradient(g.sx, g.pool, 1, g.sx, g.pool, pr);
      pb.addColorStop(0, 'rgba(255,250,215,1)'); pb.addColorStop(.45, 'rgba(255,190,80,.95)'); pb.addColorStop(.85, 'rgba(240,100,25,.85)'); pb.addColorStop(1, 'rgba(200,60,10,0)');
      ctx.save(); ctx.translate(g.sx, g.pool); ctx.scale(1, ry / rx);
      ctx.fillStyle = pb; ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(g.sx, g.pool); ctx.scale(1, ry / rx);
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      /* ripples */
      if (Math.random() < dt * 3) ripples.push({ r: 10, a: .6 });
      for (var q = ripples.length - 1; q >= 0; q--) {
        var rp = ripples[q]; rp.r += 70 * dt * g.k; rp.a -= .45 * dt;
        if (rp.a <= 0) { ripples.splice(q, 1); continue; }
        ctx.strokeStyle = 'rgba(255,230,160,' + rp.a + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(g.sx, g.pool, rp.r, rp.r * ry / rx, 0, 0, Math.PI * 2); ctx.stroke();
      }
      /* splash crown */
      ctx.fillStyle = 'rgba(255,245,210,.9)';
      for (var c = 0; c < 7; c++) {
        var ang = Math.PI + (c / 6) * Math.PI;
        var hh = (8 + 8 * Math.abs(Math.sin(t * 9 + c * 1.7))) * g.k;
        ctx.beginPath(); ctx.ellipse(g.sx + Math.cos(ang) * 14 * g.k, g.pool - 2 + Math.sin(ang) * hh * .5, 2.4 * g.k, hh * .5, 0, 0, Math.PI * 2); ctx.fill();
      }

      /* sparks */
      var spawn = Math.min(14, Math.round(dt * 420 * (W < 720 ? .6 : 1)));
      for (var n = 0; n < spawn; n++) {
        var a = rnd(-Math.PI * .92, -Math.PI * .08), sp = rnd(160, 620) * g.k;
        sparks.push({ x: g.sx + rnd(-10, 10) * g.k, y: g.pool - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(.5, 1.6), age: 0, w: rnd(.8, 2.2) });
      }
      if (Math.random() < dt * 12) {
        var ps = rnd(.1, .9), py = lerp(g.top, g.pool, ps * ps);
        sparks.push({ x: streamX(g, ps * ps, py), y: py, vx: rnd(-160, 160), vy: rnd(-120, 40), life: rnd(.4, 1), age: 0, w: rnd(.6, 1.6) });
      }
      ctx.lineCap = 'round';
      for (var s = sparks.length - 1; s >= 0; s--) {
        var sk = sparks[s];
        sk.age += dt;
        if (sk.age > sk.life || sk.x < -20 || sk.x > W + 20) { sparks.splice(s, 1); continue; }
        var px = sk.x, py2 = sk.y;
        sk.vy += 720 * dt * g.k; sk.vx *= (1 - .6 * dt); sk.vy *= (1 - .3 * dt);
        sk.x += sk.vx * dt; sk.y += sk.vy * dt;
        if (sk.y > g.pool + 26 * g.k && sk.vy > 0) { sk.y = g.pool + 26 * g.k; sk.vy *= -.3; sk.vx *= .6; }
        var lf = 1 - sk.age / sk.life;
        var hue = 22 + 30 * lf, light = 52 + 40 * lf;
        ctx.strokeStyle = 'hsla(' + hue + ',100%,' + light + '%,' + Math.min(1, lf * 1.4) + ')';
        ctx.lineWidth = sk.w;
        ctx.beginPath(); ctx.moveTo(px - sk.vx * .018, py2 - sk.vy * .018); ctx.lineTo(sk.x, sk.y); ctx.stroke();
      }
      if (sparks.length > 420) sparks.splice(0, sparks.length - 420);

      /* floating embers in the hot air */
      if (embers.length < 40 && Math.random() < dt * 20) embers.push({ x: g.sx + rnd(-200, 200) * g.k, y: g.pool, vy: rnd(-30, -70), ph: rnd(0, 6), life: rnd(3, 7), age: 0, r: rnd(.8, 2) });
      for (var e = embers.length - 1; e >= 0; e--) {
        var em = embers[e]; em.age += dt;
        if (em.age > em.life) { embers.splice(e, 1); continue; }
        em.y += em.vy * dt; em.x += Math.sin(t * 1.5 + em.ph) * 12 * dt;
        ctx.fillStyle = 'rgba(255,160,60,' + (.7 * (1 - em.age / em.life)) + ')';
        ctx.beginPath(); ctx.arc(em.x, em.y, em.r, 0, Math.PI * 2); ctx.fill();
      }

      /* floor / mould rim */
      ctx.globalCompositeOperation = 'source-over';
      var fl = ctx.createLinearGradient(0, g.pool + 22 * g.k, 0, H);
      fl.addColorStop(0, 'rgba(30,16,8,.0)'); fl.addColorStop(.2, 'rgba(20,10,6,.9)'); fl.addColorStop(1, '#090605');
      ctx.fillStyle = fl; ctx.fillRect(0, g.pool + 22 * g.k, W, H);
    }

    /* ---------- flow ---------- */
    function drawFlow(dt) {
      var cy = H / 2, th = H * .62;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0a0605'; ctx.fillRect(0, 0, W, H);
      var bg = ctx.createLinearGradient(0, cy - th / 2, 0, cy + th / 2);
      bg.addColorStop(0, '#5a1405'); bg.addColorStop(.18, '#e0541a'); bg.addColorStop(.5, '#ffc45e');
      bg.addColorStop(.82, '#e0541a'); bg.addColorStop(1, '#5a1405');
      ctx.fillStyle = bg;
      ctx.beginPath();
      for (var x = 0; x <= W; x += 8) {
        var yy = cy - th / 2 + Math.sin(x * .02 + t * 1.3) * 2;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      for (var x2 = W; x2 >= 0; x2 -= 8) ctx.lineTo(x2, cy + th / 2 + Math.sin(x2 * .018 - t * 1.1) * 2);
      ctx.closePath(); ctx.fill();

      /* dark crust drifting on the surface */
      for (var c = 0; c < crust.length; c++) {
        var ck = crust[c]; ck.x += ck.s * dt; if (ck.x - ck.r > W) ck.x = -ck.r;
        ctx.fillStyle = 'rgba(70,18,5,' + ck.a + ')';
        ctx.beginPath(); ctx.ellipse(ck.x, cy + ck.y * th, ck.r * 1.8, ck.r * .35, 0, 0, Math.PI * 2); ctx.fill();
      }
      /* bright currents */
      ctx.globalCompositeOperation = 'lighter';
      for (var b = 0; b < blobs.length; b++) {
        var bl = blobs[b]; bl.x += bl.s * dt; if (bl.x - bl.r * 2 > W) bl.x = -bl.r * 2;
        var g2 = ctx.createRadialGradient(bl.x, cy + bl.y * th, 1, bl.x, cy + bl.y * th, bl.r * 2);
        g2.addColorStop(0, 'rgba(255,250,220,' + bl.a + ')'); g2.addColorStop(1, 'rgba(255,160,60,0)');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.ellipse(bl.x, cy + bl.y * th, bl.r * 2, bl.r * .45, 0, 0, Math.PI * 2); ctx.fill();
      }
      /* glow above and below the channel */
      var hg = ctx.createLinearGradient(0, 0, 0, H);
      hg.addColorStop(0, 'rgba(255,110,30,.18)'); hg.addColorStop(.5, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(255,110,30,.18)');
      ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);

      /* sparks popping from the surface */
      if (Math.random() < dt * (W / 90)) {
        var sx = rnd(0, W);
        for (var k = 0; k < 6; k++) sparks.push({ x: sx, y: cy - th * .4, vx: rnd(-90, 140), vy: rnd(-260, -90), life: rnd(.4, .9), age: 0, w: rnd(.7, 1.6) });
      }
      ctx.lineCap = 'round';
      for (var s = sparks.length - 1; s >= 0; s--) {
        var sk = sparks[s]; sk.age += dt;
        if (sk.age > sk.life) { sparks.splice(s, 1); continue; }
        var px = sk.x, py = sk.y;
        sk.vy += 600 * dt; sk.x += sk.vx * dt; sk.y += sk.vy * dt;
        var lf = 1 - sk.age / sk.life;
        ctx.strokeStyle = 'hsla(' + (25 + 25 * lf) + ',100%,' + (55 + 35 * lf) + '%,' + lf + ')';
        ctx.lineWidth = sk.w;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sk.x, sk.y); ctx.stroke();
      }
    }

    var running = false;
    function loop(now) {
      if (running) return;
      running = true;
      requestAnimationFrame(function step(n) {
        if (!visible || document.hidden) { running = false; return; }
        var dt = Math.min(.05, (n - last) / 1000); last = n; t += dt;
        if (mode === 'pour') drawPour(dt); else drawFlow(dt);
        requestAnimationFrame(step);
      });
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) { last = performance.now(); loop(); } });
    loop();
  }

  for (var i = 0; i < canvases.length; i++) { try { setup(canvases[i]); } catch (e) {} }
})();
