/* Декоративный слой поверх страницы, кликам не мешает.
   data-fx="hearts" на <body>: глянцевые сердечки плавают по всему экрану и «бьются».
   data-fx="snow": падающий снег. */
(function () {
  try {
    var kind = document.body.getAttribute('data-fx');
    if (!kind) return;

    var layer = document.createElement('div');
    layer.className = 'fx fx-' + kind;
    layer.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(layer, document.body.firstChild);

    var small = window.innerWidth < 720;
    var rnd = function (a, b) { return a + Math.random() * (b - a); };

    if (kind === 'snow') {
      var flakes = small ? 40 : 70;
      for (var s = 0; s < flakes; s++) {
        var f = document.createElement('span');
        var dur = rnd(9, 20);
        f.className = 'flake';
        f.textContent = Math.random() < .45 ? '❄︎' : '•';
        f.style.fontSize = rnd(8, 20) + 'px';
        f.style.opacity = rnd(.4, .9).toFixed(2);
        f.style.left = rnd(-2, 98) + 'vw';
        f.style.setProperty('--dx', rnd(-80, 80).toFixed(0) + 'px');
        f.style.animationDuration = dur.toFixed(1) + 's';
        f.style.animationDelay = (-rnd(0, dur)).toFixed(1) + 's';
        layer.appendChild(f);
      }
      return;
    }

    if (kind !== 'hearts') return;
    var palette = [
      ['#FF8FA3', '#E0244A'], ['#FFB199', '#F0523A'], ['#FFC6D9', '#E8508A'],
      ['#FFD3A8', '#F07A3A'], ['#FF9DB5', '#C9184A'], ['#FFC2B4', '#E8606A']
    ];
    var path = 'M12 21.6 10.3 20C4.2 14.5 0 10.8 0 6.3 0 2.7 2.8 0 6.4 0c2 0 4 .9 5.6 2.4C13.6.9 15.6 0 17.6 0 21.2 0 24 2.7 24 6.3c0 4.5-4.2 8.2-10.3 13.7L12 21.6z';
    var hearts = [];
    var n = small ? 12 : 20;
    var W = window.innerWidth, H = window.innerHeight;
    window.addEventListener('resize', function () { W = window.innerWidth; H = window.innerHeight; });

    for (var i = 0; i < n; i++) {
      var c = palette[i % palette.length];
      var id = 'hg' + i;
      var size = rnd(18, small ? 34 : 46);
      var el = document.createElement('span');
      el.className = 'heart';
      el.style.width = size + 'px';
      el.style.height = size * 22 / 24 + 'px';
      el.innerHTML =
        '<svg viewBox="0 0 24 22"><defs><radialGradient id="' + id + '" cx="35%" cy="30%" r="75%">' +
        '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></radialGradient></defs>' +
        '<path d="' + path + '" fill="url(#' + id + ')"/>' +
        '<ellipse cx="7" cy="6" rx="3" ry="1.8" fill="#fff" opacity=".55" transform="rotate(-30 7 6)"/></svg>';
      layer.appendChild(el);
      var speed = rnd(18, 45);              /* px в секунду */
      var dir = rnd(0, Math.PI * 2);
      hearts.push({
        el: el, size: size,
        x: rnd(0, W), y: rnd(0, H),
        vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed - 10,
        ph: rnd(0, Math.PI * 2), wob: rnd(.6, 1.4), amp: rnd(12, 34),
        beat: rnd(.8, 1.4), op: rnd(.7, .95)
      });
      el.style.opacity = hearts[i].op;
    }

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(.05, (now - last) / 1000);
      last = now;
      var t = now / 1000;
      for (var k = 0; k < hearts.length; k++) {
        var h = hearts[k];
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        var m = h.size + 40;
        if (h.x < -m) h.x = W + m; else if (h.x > W + m) h.x = -m;
        if (h.y < -m) h.y = H + m; else if (h.y > H + m) h.y = -m;
        var sx = Math.sin(t * h.wob + h.ph) * h.amp;
        var sy = Math.cos(t * h.wob * .8 + h.ph) * h.amp * .5;
        var rot = Math.sin(t * h.wob + h.ph) * 14;
        var p = Math.sin(t * h.beat * 4 + h.ph);
        var sc = 1 + (p > .6 ? (p - .6) * .35 : 0);
        h.el.style.transform = 'translate3d(' + (h.x + sx).toFixed(1) + 'px,' + (h.y + sy).toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  } catch (e) {}
})();
