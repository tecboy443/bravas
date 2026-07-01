document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinksEl = document.getElementById('navLinks');
  const navScrim = document.getElementById('navScrim');
  const progressBar = document.getElementById('scrollProgress');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav background + scroll progress bar
  function onScroll(){
    nav.classList.toggle('scrolled', window.scrollY > 40);
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav drawer
  function closeMenu(){
    navToggle.classList.remove('open');
    navLinksEl.classList.remove('open');
    navScrim.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function openMenu(){
    navToggle.classList.add('open');
    navLinksEl.classList.add('open');
    navScrim.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  navToggle.addEventListener('click', () => {
    navLinksEl.classList.contains('open') ? closeMenu() : openMenu();
  });
  navScrim.addEventListener('click', closeMenu);
  navLinksEl.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  // nav itself (z-index above the scrim) can swallow taps on its empty area
  // or the logo while the drawer is open, so close it from here too.
  nav.addEventListener('click', (e) => {
    if (navLinksEl.classList.contains('open') && !navToggle.contains(e.target) && !navLinksEl.contains(e.target)) {
      closeMenu();
    }
  });

  // Active nav link tracking
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  const linkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const link = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (!link) return;
      navAnchors.forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  document.querySelectorAll('section[id]').forEach(s => linkObserver.observe(s));

  // Count-up stats
  function animateCount(el){
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    if (prefersReducedMotion) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(tick);
    }
  }
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  // Magnetic buttons (pointer devices only)
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  if (supportsHover && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- Lenis smooth scroll ----------
  // Skipped entirely under prefers-reduced-motion: cinematic deceleration
  // is itself a motion effect the user asked to avoid.
  const lenisAvailable = typeof window.Lenis === 'function';
  const lenis = (lenisAvailable && !prefersReducedMotion)
    ? new window.Lenis({ lerp: 0.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.5 })
    : null;

  // ---------- GSAP / ScrollTrigger / SplitText ----------
  const gsapAvailable = typeof window.gsap === 'object' && !!window.ScrollTrigger && !!window.SplitText;

  if (gsapAvailable) {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    if (!prefersReducedMotion) {
      // Heading line-mask reveal: h1 animates immediately (already in view
      // on load), every h2 animates once as it scrolls into view.
      const h1 = document.querySelector('h1.hero-title');
      if (h1) {
        const h1Split = SplitText.create(h1, { type: 'lines', mask: 'lines', accessible: true });
        gsap.from(h1Split.lines, { yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
      }

      document.querySelectorAll('h2').forEach(h2 => {
        const h2Split = SplitText.create(h2, { type: 'lines', mask: 'lines', accessible: true });
        gsap.from(h2Split.lines, {
          yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: h2, start: 'top 85%', once: true },
        });
      });

      // Card / stat / logo entrance: scale + fade in, staggered per group.
      document.querySelectorAll('.story-stats, .service-grid, .proof .wrap, .client-row').forEach(container => {
        gsap.from(container.children, {
          scale: 0.95, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: container, start: 'top 80%', once: true },
        });
      });

      // Quote-mark pulse: starts once the testimonial scrolls into view.
      const quoteMark = document.querySelector('.quote-mark');
      if (quoteMark) {
        ScrollTrigger.create({
          trigger: quoteMark,
          start: 'top 85%',
          once: true,
          onEnter: () => quoteMark.classList.add('pulse-active'),
        });
      }
    }
  }

  // Anchor links: smooth-scroll via Lenis when it's running, otherwise the
  // browser's native hash jump still works with zero JS involved.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (lenis && id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: -90 });
      }
    });
  });

  // Drive Lenis's own raf loop only when GSAP isn't present to do it via
  // gsap.ticker (avoids running two competing animation clocks).
  if (lenis && !gsapAvailable) {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
});
