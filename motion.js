(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');
  let userPaused = false;
  let paused = reducedMotion.matches;
  let syncPhysics = () => {};

  function updateMotion() {
    paused = userPaused || reducedMotion.matches;
    document.body.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.replaceChildren(
      document.createTextNode(paused ? '모션 재생 ' : '모션 일시정지 '),
      Object.assign(document.createElement('span'), { textContent: paused ? '▷' : 'Ⅱ' })
    );
    toggle.lastChild.setAttribute('aria-hidden', 'true');
    toggle.disabled = reducedMotion.matches;
    if (reducedMotion.matches) {
      toggle.firstChild.textContent = '동작 줄이기 적용 중 ';
    }
    syncPhysics();
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    updateMotion();
  });
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();

  const marquee = document.querySelector('.marquee-group');
  const marqueeCopy = marquee.cloneNode(true);
  marqueeCopy.setAttribute('aria-hidden', 'true');
  marquee.parentElement.append(marqueeCopy);
  marquee.parentElement.classList.add('marquee-ready');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!paused) entry.target.classList.add('reveal-in');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .case, .lab-grid, .career, .preview-card, .principles article, .download-card')
      .forEach((element) => revealObserver.observe(element));

    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('offscreen', !entry.isIntersecting));
    }, { rootMargin: '100px' });
    document.querySelectorAll('.hero-visual, .specialties, .systems-playground')
      .forEach((element) => visibilityObserver.observe(element));
  }

  // One scheduled paint for scroll progress and the current navigation section.
  const progress = document.querySelector('.reading-progress span');
  const sections = [...document.querySelectorAll('#work, #motion-lab, #experience, #about, #downloads')];
  const navLinks = [...document.querySelectorAll('nav a')];
  let scrollScheduled = false;
  function updateScroll() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0})`;
    let current = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 180) current = `#${section.id}`;
    }
    for (const link of navLinks) {
      if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    scrollScheduled = false;
  }
  function queueScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(updateScroll);
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  updateScroll();

  // A small, independent web study of motion, not a recording of the game.
  const canvas = document.querySelector('#physics-canvas');
  const ctx = canvas?.getContext('2d');
  const shotButton = document.querySelector('#physics-shot');
  if (!ctx) return;
  shotButton.hidden = false;
  let width = 600;
  let height = 290;
  let radius = 11;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  const colors = ['#edf0dc', '#f5a36b', '#d9f184'];
  let balls = [];

  function reset() {
    balls = [
      { x: width * .24, y: height * .55, vx: 130, vy: -62 },
      { x: width * .58, y: height * .38, vx: -32, vy: 44 },
      { x: width * .74, y: height * .68, vx: -56, vy: -40 }
    ].map((ball, index) => ({ ...ball, color: colors[index], trail: [] }));
    elapsed = 0;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    radius = Math.max(8, Math.min(12, width / 40));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    reset();
    draw();
  }

  function simulate(dt) {
    elapsed += dt;
    const margin = 23 + radius;
    for (const ball of balls) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      const friction = Math.exp(-.15 * dt);
      ball.vx *= friction;
      ball.vy *= friction;
      if (ball.x < margin || ball.x > width - margin) {
        ball.x = Math.max(margin, Math.min(width - margin, ball.x));
        ball.vx *= -.95;
      }
      if (ball.y < margin || ball.y > height - margin) {
        ball.y = Math.max(margin, Math.min(height - margin, ball.y));
        ball.vy *= -.95;
      }
      if (Math.hypot(ball.vx, ball.vy) < .5) ball.vx = ball.vy = 0;
    }
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= radius * 2) continue;
        const nx = distance > .001 ? dx / distance : 1;
        const ny = distance > .001 ? dy / distance : 0;
        const overlap = (radius * 2 - distance) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const speed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (speed > 0) {
          a.vx -= speed * nx;
          a.vy -= speed * ny;
          b.vx += speed * nx;
          b.vy += speed * ny;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#b6d8990d';
    ctx.beginPath();
    for (let x = 24; x < width; x += 32) { ctx.moveTo(x, 20); ctx.lineTo(x, height - 20); }
    for (let y = 24; y < height; y += 32) { ctx.moveTo(20, y); ctx.lineTo(width - 20, y); }
    ctx.stroke();
    ctx.strokeStyle = '#b6d89945';
    ctx.strokeRect(22, 22, width - 44, height - 44);
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 22);
    ctx.lineTo(width / 2, height - 22);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const ball of balls) {
      const trail = ball.trail;
      for (let i = 1; i < trail.length; i++) {
        ctx.globalAlpha = (i / trail.length) * .45;
        ctx.strokeStyle = ball.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = `${ball.color}35`;
      ctx.lineWidth = 1;
      ctx.stroke();
      const gradient = ctx.createRadialGradient(ball.x - radius * .35, ball.y - radius * .4, 0, ball.x, ball.y, radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(.3, ball.color);
      gradient.addColorStop(1, `${ball.color}88`);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    ctx.font = '9px Consolas, monospace';
    ctx.fillStyle = '#a2b995';
    ctx.fillText('INPUT → MOTION → RESPONSE', 30, height - 8);
  }

  function tick(time) {
    frame = 0;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .04) : 1 / 60;
    lastTime = time;
    simulate(dt / 2);
    simulate(dt / 2);
    for (const ball of balls) {
      // Sample trails by simulated time, independent of the display refresh rate.
      if (Math.floor(elapsed * 40) !== Math.floor((elapsed - dt) * 40)) {
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 72) ball.trail.shift();
      }
    }
    draw();
    if (canRun() && balls.some((ball) => ball.vx || ball.vy)) frame = requestAnimationFrame(tick);
  }

  function canRun() { return visible && !paused && !document.hidden; }
  syncPhysics = () => {
    if (!canRun()) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    } else if (!frame) {
      frame = requestAnimationFrame(tick);
    }
  };

  function shoot(target) {
    if (!balls.length) return;
    const cue = balls[0];
    const dx = target ? target.x - cue.x : width * .6 - cue.x;
    const dy = target ? target.y - cue.y : height * .3 - cue.y;
    const length = Math.hypot(dx, dy) || 1;
    cue.vx = dx / length * 190;
    cue.vy = dy / length * 190;
    balls.forEach((ball) => { ball.trail = []; });
    if (paused) {
      // A discrete result keeps this interaction useful with reduced motion.
      for (let step = 0; step < 90; step++) {
        simulate(1 / 120);
        if (step % 3 === 0) balls.forEach((ball) => ball.trail.push({ x: ball.x, y: ball.y }));
      }
      draw();
    } else syncPhysics();
  }
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    shoot({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  });
  shotButton.addEventListener('click', () => {
    reset();
    shoot();
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      syncPhysics();
    }).observe(canvas);
  } else visible = true;
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-hidden', document.hidden);
    syncPhysics();
  });
  resize();
  syncPhysics();
})();
