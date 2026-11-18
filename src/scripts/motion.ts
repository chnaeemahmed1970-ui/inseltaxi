// GSAP-Effekte, lokal gebündelt (kein CDN). Wird nur geladen, wenn Bewegung erlaubt ist.
// Presets nach ui-ux-pro-max (--domain gsap): Scroll Reveal "Standard", nur transform/opacity bzw. stroke-dashoffset.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initMotion() {
  gsap.registerPlugin(ScrollTrigger);

  // 1) Routen zeichnen sich beim Scrollen
  document.querySelectorAll<HTMLElement>('[data-routemap]').forEach((map) => {
    const routes = map.querySelectorAll<SVGPathElement>('[data-route]');
    const abroad = map.querySelectorAll<SVGPathElement>('[data-route-abroad]');
    const pins = map.querySelectorAll<HTMLElement>('.rmap__pin, .rmap__abroad-label');
    gsap.set(routes, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(abroad, { opacity: 0 });
    gsap.set(pins, { opacity: 0, scale: 0.6 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: map, start: 'top 75%', once: true } });
    tl.to(routes, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.07 })
      .to(pins, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)', stagger: 0.04 }, 0.35)
      .to(abroad, { opacity: 0.55, duration: 0.8, ease: 'power1.out' }, '-=0.4');
  });

  // 2) Dezenter Parallax im Hero
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const speed = Number(el.dataset.parallax || 0.15);
    gsap.to(el, {
      yPercent: speed * 100, ease: 'none',
      scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  // 3) Ein Taxi fährt beim Scrollen die Straße entlang (Ablauf in 3 Schritten)
  document.querySelectorAll<HTMLElement>('[data-road]').forEach((road) => {
    const car = road.querySelector<HTMLElement>('[data-road-car]');
    const line = road.querySelector<HTMLElement>('[data-road-line]');
    if (!car || !line) return;
    const vertical = () => getComputedStyle(road).getPropertyValue('--road-dir').trim() === 'v';
    ScrollTrigger.matchMedia({
      '(min-width: 900px)': () => {
        gsap.fromTo(car, { x: 0 }, {
          x: () => line.offsetWidth - car.offsetWidth, ease: 'none',
          scrollTrigger: { trigger: road, start: 'top 80%', end: 'bottom 45%', scrub: 0.6, invalidateOnRefresh: true },
        });
      },
      '(max-width: 899px)': () => {
        if (!vertical()) return;
        gsap.fromTo(car, { y: 0 }, {
          y: () => line.offsetHeight - car.offsetHeight, ease: 'none',
          scrollTrigger: { trigger: road, start: 'top 70%', end: 'bottom 60%', scrub: 0.6, invalidateOnRefresh: true },
        });
      },
    });
  });

  // 4) Zahlen/Striche, die sich zeichnen (z. B. Tarifkarten-Unterstreichung)
  document.querySelectorAll<SVGPathElement>('[data-draw]').forEach((p) => {
    gsap.fromTo(p, { strokeDasharray: 1, strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: p, start: 'top 85%', once: true },
    });
  });
}
