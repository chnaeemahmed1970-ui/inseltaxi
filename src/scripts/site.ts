// Globale, leichte Interaktionen. Schwere Effekte (GSAP) werden nur bei Bedarf nachgeladen.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header-Schatten beim Scrollen + Desktop-Pille nach dem ersten Bildschirm
const header = document.querySelector<HTMLElement>('[data-header]');
const sticky = document.querySelector<HTMLElement>('[data-sticky-cta]');
const hero = document.querySelector<HTMLElement>('[data-hero]');
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 8);
    const threshold = hero ? hero.offsetTop + hero.offsetHeight * 0.6 : 320;
    sticky?.classList.toggle('is-visible', y > threshold);
    ticking = false;
  });
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile Navigation
const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
if (toggle && nav) {
  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
  });
  nav.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); });
  matchMedia('(min-width: 1120px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// Weiches Einblenden beim Scrollen
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (document.documentElement.classList.contains('motion-ok') && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

// Magnetische Buttons (nur Maus, nur wenn Bewegung erlaubt)
if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.18;
      const y = (e.clientY - r.top - r.height / 2) * 0.25;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Module nur laden, wenn die Seite sie braucht
if (document.querySelector('[data-request-form]')) import('./form').then((m) => m.initForms());
if (document.querySelector('[data-fleet]')) import('./fleet').then((m) => m.initFleet());
if (document.querySelector('[data-tarif-now]')) import('./tarif-now').then((m) => m.initTarifNow());
if (document.querySelector('[data-osm]')) import('./osm').then((m) => m.initOsm());
if (document.querySelector('[data-routemap]')) import('./routemap').then((m) => m.initRouteMap());
if (!reduce && document.querySelector('[data-gsap]')) {
  const start = () => import('./motion').then((m) => m.initMotion());
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 300);
}
