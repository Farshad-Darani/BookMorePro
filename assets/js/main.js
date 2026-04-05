/* ============================================================
   MAIN.JS — BookMorePro
   Farshad Darani — farshad-darani.com
   ============================================================ */

'use strict';

// ============================================================
// LOADER
// ============================================================
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.style.cursor = 'none';
    initCursor();
    initHeroParticles();
    initGalaxyStars();
    initBarReveal();
    initWorkSlider();
    // Start hero counters shortly after loader finishes
    setTimeout(initHeroCounters, 200);
  }, 1400);
});

// ============================================================
// CUSTOM CURSOR — Spotlight
// ============================================================
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

  const interactives = document.querySelectorAll('a, button, [data-tilt], input, textarea, select, [role="button"]');
  interactives.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });
}

// ============================================================
// NAVIGATION — scroll state + active link
// ============================================================
(function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link, .mobile-menu__cta');
  const navLinks = document.querySelectorAll('.nav__link');
  const sections = document.querySelectorAll('section[id]');

  if (!nav) return;

  // Scroll → add .scrolled
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
    updateActiveLink();
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Active link on scroll
  function updateActiveLink() {
    let current = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      nav.classList.toggle('menu-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        nav.classList.remove('menu-open');
        document.body.style.overflow = '';
      });
    });
  }

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      nav.classList.remove('menu-open');
      document.body.style.overflow = '';
    }
  });
})();

// ============================================================
// HERO CANVAS PARTICLES
// ============================================================
function initHeroParticles() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  const COLORS = [
    'rgba(245, 166, 35,',   // gold
    'rgba(0, 194, 255,',    // cyan
    'rgba(124, 58, 237,',   // purple
  ];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 130;

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(245, 166, 35, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.opacity})`;
      ctx.fill();

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Bounce
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    animId = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    createParticles();
    if (animId) cancelAnimationFrame(animId);
    draw();
  }

  init();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });
}

// ============================================================
// GALAXY BUTTON STARS
// ============================================================
function initGalaxyStars() {
  const RANDOM = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  document.querySelectorAll('.galaxy-button .star').forEach(star => {
    star.style.setProperty('--angle',    RANDOM(0, 360));
    star.style.setProperty('--duration', RANDOM(6, 20));
    star.style.setProperty('--delay',    RANDOM(1, 10));
    star.style.setProperty('--alpha',    RANDOM(40, 90) / 100);
    star.style.setProperty('--size',     RANDOM(2, 6));
    star.style.setProperty('--distance', RANDOM(40, 200));
  });
}

// ============================================================
// BAR REVEAL — Scroll-triggered section label animation
// ============================================================
function initBarReveal() {
  const reveals = document.querySelectorAll('.bar-reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('animate')) {
        entry.target.classList.add('animate');
      }
    });
  }, { threshold: 0.4 });

  reveals.forEach(el => observer.observe(el));
}

// ============================================================
// WORK SLIDER — Infinite drag/touch horizontal carousel
// ============================================================
function initWorkSlider() {
  const slider  = document.getElementById('workSlider');
  const track   = document.getElementById('workTrack');
  if (!slider || !track) return;

  const origSlides = Array.from(track.querySelectorAll('.work-slide'));
  const dots    = Array.from(document.querySelectorAll('.work__dot'));
  const prevBtn = document.getElementById('workPrev');
  const nextBtn = document.getElementById('workNext');
  const GAP     = 24;
  const TOTAL   = origSlides.length;
  const CLONES  = 1; // 1 clone on each side is enough — avoids ordering issues

  // Prepend clone of the LAST real slide (appears left of first real slide)
  const prePre = origSlides[TOTAL - 1].cloneNode(true);
  prePre.setAttribute('aria-hidden', 'true');
  track.insertBefore(prePre, track.firstChild);

  // Append clone of the FIRST real slide (appears right of last real slide)
  const postPost = origSlides[0].cloneNode(true);
  postPost.setAttribute('aria-hidden', 'true');
  track.appendChild(postPost);

  const slides = Array.from(track.querySelectorAll('.work-slide'));
  let current  = CLONES; // index 1 = first real slide
  let startX   = 0;
  let isDragging  = false;
  let dragOffset  = 0;
  let justDragged = false;

  function slW()       { return slides[0].offsetWidth; }
  function centerOff() { return slider.offsetWidth / 2 - slW() / 2; }
  function realIdx(i)  { return (i - CLONES + TOTAL) % TOTAL; }

  function setPos(idx, anim) {
    track.style.transition = anim
      ? 'transform 0.6s cubic-bezier(0.4,0,0.2,1)'
      : 'none';
    track.style.transform = `translateX(${centerOff() - idx * (slW() + GAP)}px)`;
  }

  // Freeze / thaw individual slide transitions to prevent blink during silent snap
  function freezeSlides() {
    slides.forEach(s => {
      s.style.transition = 'none';
      s.querySelectorAll('.work-slide__phone, .work-slide__img').forEach(el => {
        el.style.transition = 'none';
      });
    });
  }
  function thawSlides() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      slides.forEach(s => {
        s.style.transition = '';
        s.querySelectorAll('.work-slide__phone, .work-slide__img').forEach(el => {
          el.style.transition = '';
        });
      });
    }));
  }

  function activate(idx, instant) {
    if (instant) freezeSlides();
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    dots.forEach((d, i)   => d.classList.toggle('active', i === realIdx(idx)));
    if (instant) thawSlides();
  }

  function goTo(idx) {
    current = idx;
    setPos(current, true);
    activate(current, false);
  }

  // When a clone slide finishes its transition, snap silently to the real counterpart
  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;
    if (current < CLONES) {
      current += TOTAL; setPos(current, false); activate(current, true);
    } else if (current >= CLONES + TOTAL) {
      current -= TOTAL; setPos(current, false); activate(current, true);
    }
  });

  // Mouse drag
  track.addEventListener('mousedown', e => {
    isDragging = true; startX = e.clientX; dragOffset = 0;
    track.style.transition = 'none';
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    dragOffset = e.clientX - startX;
    track.style.transform = `translateX(${centerOff() - current * (slW() + GAP) + dragOffset}px)`;
  });
  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    if (Math.abs(dragOffset) > 5) justDragged = true;
    if (dragOffset < -80)      goTo(current + 1);
    else if (dragOffset > 80)  goTo(current - 1);
    else                       goTo(current);
    dragOffset = 0;
  });
  track.addEventListener('click', e => {
    if (justDragged) { e.preventDefault(); justDragged = false; }
  }, true);

  // Touch
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX; dragOffset = 0;
  }, { passive: true });
  track.addEventListener('touchmove', e => {
    dragOffset = e.touches[0].clientX - startX;
    track.style.transform = `translateX(${centerOff() - current * (slW() + GAP) + dragOffset}px)`;
  }, { passive: true });
  track.addEventListener('touchend', () => {
    if (dragOffset < -60)      goTo(current + 1);
    else if (dragOffset > 60)  goTo(current - 1);
    else                       goTo(current);
    dragOffset = 0;
  });

  // Trackpad / mouse-wheel horizontal swipe
  // Accumulate deltaX across the stream of small trackpad events
  let wheelAccum  = 0;
  let wheelLocked = false;
  let wheelReset  = null;

  slider.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.5) return; // mostly vertical — ignore
    e.preventDefault();
    if (wheelLocked) return;

    wheelAccum += e.deltaX;
    clearTimeout(wheelReset);

    if (Math.abs(wheelAccum) >= 40) {
      wheelLocked = true;
      if (wheelAccum > 0) goTo(current + 1);
      else                goTo(current - 1);
      wheelAccum = 0;
      setTimeout(() => { wheelLocked = false; }, 750);
    } else {
      // Reset accumulator if gesture stalls
      wheelReset = setTimeout(() => { wheelAccum = 0; }, 200);
    }
  }, { passive: false });

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i + CLONES)));
  window.addEventListener('resize', () => setPos(current, false));

  goTo(CLONES);
}

// ============================================================
// COUNTER ANIMATION
// ============================================================
function initHeroCounters() {
  const counters = document.querySelectorAll('.hero__stat-num[data-count]');
  if (!counters.length) return;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el) {
    const target    = parseInt(el.dataset.count, 10);
    const from      = el.dataset.from ? parseInt(el.dataset.from, 10) : 0;
    const prefix    = el.dataset.prefix || '';
    const duration  = 1800;
    const countDown = from > target;
    let startTime   = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed        = timestamp - startTime;
      const progress       = Math.min(elapsed / duration, 1);
      const easedProgress  = easeOutQuart(progress);
      const value = countDown
        ? Math.round(from - easedProgress * (from - target))
        : Math.floor(easedProgress * target);
      el.textContent = prefix + value;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target;
    }
    requestAnimationFrame(step);
  }

  counters.forEach(animateCounter);
}

// ============================================================
// CARD TILT EFFECT (3D on hover — lerp smoothed)
// ============================================================
(function initTilt() {
  const cards = document.querySelectorAll('[data-tilt]');
  if (!cards.length) return;

  const lerp = (a, b, t) => a + (b - a) * t;
  const SPEED = 0.1;   // lower = smoother/slower catch-up
  const MAX   = 7;     // max tilt degrees

  cards.forEach((card) => {
    let targetX = 0, targetY = 0, targetTY = 0;
    let curX    = 0, curY    = 0, curTY    = 0;
    let rafId   = null;
    let hovered = false;

    function tick() {
      curX  = lerp(curX,  targetX,  SPEED);
      curY  = lerp(curY,  targetY,  SPEED);
      curTY = lerp(curTY, targetTY, SPEED);

      card.style.transform =
        `perspective(900px) rotateX(${curX}deg) rotateY(${curY}deg) translateY(${curTY}px)`;

      const settled = !hovered &&
        Math.abs(curX) < 0.05 &&
        Math.abs(curY) < 0.05 &&
        Math.abs(curTY) < 0.05;

      if (settled) {
        card.style.transform = '';
        rafId = null;
      } else {
        rafId = requestAnimationFrame(tick);
      }
    }

    function updateTarget(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      targetX  = ((y - rect.height / 2) / (rect.height / 2)) * -MAX;
      targetY  = ((x - rect.width  / 2) / (rect.width  / 2)) *  MAX;
      targetTY = -5;
    }

    card.addEventListener('mouseenter', (e) => {
      hovered = true;
      card.style.transition = 'none';
      updateTarget(e);
      if (!rafId) rafId = requestAnimationFrame(tick);
    });

    card.addEventListener('mousemove', (e) => updateTarget(e));

    card.addEventListener('mouseleave', () => {
      hovered  = false;
      targetX  = 0;
      targetY  = 0;
      targetTY = 0;
      if (!rafId) rafId = requestAnimationFrame(tick);
    });
  });
})();

// ============================================================
// PROCESS TIMELINE LINE ANIMATION
// ============================================================
(function initProcessLine() {
  const processSection = document.querySelector('.process');
  if (!processSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(processSection);
})();

// ============================================================
// PROCESS CONTENT BOX — fade-up on scroll into view
// ============================================================
(function initProcessContentAnim() {
  const box = document.querySelector('.process__content');
  if (!box) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  obs.observe(box);
})();

// ============================================================
// CONTACT FORM — client-side validation + feedback
// ============================================================
(function initContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');
  if (!form) return;

  // Record when the form was loaded — bots submit too fast
  const formLoadTime = Date.now();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check — if filled, silently reject
    const honeypot = form.querySelector('.form-honeypot');
    if (honeypot && honeypot.value) return;

    // Timing check — reject if submitted in under 3 seconds
    if (Date.now() - formLoadTime < 3000) return;

    // Basic validation
    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const message = form.querySelector('#message').value.trim();

    if (!name || !email || !message) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      form.querySelector('#email').focus();
      return;
    }

    // Update button state
    const btnSpan = submitBtn.querySelector('span');
    const originalText = btnSpan.textContent;
    btnSpan.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok !== false) {
        form.reset();
        if (successMsg) {
          successMsg.classList.add('show');
          setTimeout(() => successMsg.classList.remove('show'), 5000);
        }
      } else {
        // Fallback — open email client
        const subject = encodeURIComponent('Inquiry from BookMorePro.com');
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
        window.open(`mailto:info@bookmorepro.com?subject=${subject}&body=${body}`);
      }
    } catch {
      // Network error — open email client
      const subject = encodeURIComponent('Inquiry from BookMorePro.com');
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.open(`mailto:info@bookmorepro.com?subject=${subject}&body=${body}`);
    } finally {
      btnSpan.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
})();

// ============================================================
// SMOOTH SCROLL for anchor links
// ============================================================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

// ============================================================
// PARALLAX — hero orbs on scroll
// ============================================================
(function initParallax() {
  const orbGold = document.querySelector('.hero__orb--gold');
  const orbCyan = document.querySelector('.hero__orb--cyan');
  const orbPurple = document.querySelector('.hero__orb--purple');
  if (!orbGold) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (orbGold) orbGold.style.transform += ` translateY(${y * 0.25}px)`;
        if (orbCyan) orbCyan.style.transform += ` translateY(${y * -0.15}px)`;
        if (orbPurple) orbPurple.style.transform += ` translateY(${y * 0.18}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ============================================================
// PROCESS CHART CUT — fade + draw animation on scroll
// ============================================================
(function initChartCutAnim() {
  const charts = document.querySelectorAll('.process__chart-cut');
  const section = document.querySelector('.process');
  if (!charts.length || !section) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        charts.forEach(c => c.classList.add('is-visible'));
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  obs.observe(section);
})();

// ============================================================
// ABOUT STATS — fade-up + counter animation
// ============================================================
(function initAboutStats() {
  const row = document.querySelector('.about__stats-row');
  if (!row) return;

  function runCounter(el, target, suffix, duration) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      row.classList.add('is-visible');
      row.querySelectorAll('.about__stat-val').forEach((el, i) => {
        const raw = el.textContent.trim();
        const suffix = raw.replace(/[\d]/g, '');
        const target = parseInt(raw, 10);
        if (isNaN(target)) return;
        // stagger each counter slightly
        setTimeout(() => runCounter(el, target, suffix, 1200), i * 150);
      });
      obs.unobserve(row);
    });
  }, { threshold: 0.3 });

  obs.observe(row);
})();

// ============================================================
// AI CHAT WIDGET
// ============================================================
function initChatWidget() {
  const widget   = document.getElementById('chat-widget');
  const fab      = document.getElementById('chat-fab');
  const closeBtn = widget && widget.querySelector('.chat-widget__close');
  const form     = document.getElementById('chat-form');
  const input    = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');

  if (!widget || !fab || !form || !input || !messages) return;

  let history  = [];
  let isOpen   = false;
  let isBusy   = false;

  function toggleChat(open) {
    isOpen = (open !== undefined) ? open : !isOpen;
    widget.classList.toggle('chat-widget--open', isOpen);
    fab.setAttribute('aria-expanded', String(isOpen));
    widget.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) setTimeout(() => input.focus(), 320);
  }

  fab.addEventListener('click', () => toggleChat());
  if (closeBtn) closeBtn.addEventListener('click', () => toggleChat(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat(false);
  });
  document.addEventListener('click', (e) => {
    if (isOpen && !widget.contains(e.target)) toggleChat(false);
  });

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function appendMessage(text, role) {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--' + (role === 'user' ? 'user' : 'ai');
    div.innerHTML = '<p>' + escapeHtml(text) + '</p>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--typing';
    div.id = 'chat-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('chat-typing');
    if (el) el.remove();
  }

  const sendBtn = form.querySelector('.chat-widget__send');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isBusy) return;

    input.value = '';
    appendMessage(text, 'user');
    history.push({ role: 'user', text });

    isBusy = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch('chat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-10) }),
      });
      const data = await res.json();
      removeTyping();
      const reply = data.reply || data.error || 'Sorry, something went wrong. Please try again.';
      appendMessage(reply, 'ai');
      if (data.reply) history.push({ role: 'model', text: data.reply });
    } catch {
      removeTyping();
      appendMessage('Network error — please check your connection and try again.', 'ai');
    } finally {
      isBusy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });
}

// ============================================================
// AOS INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      delay: 0,
    });
  }
  initChatWidget();
});
