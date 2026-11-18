// Routenkarte: Ziel antippen -> wird ins Anfrageformular übernommen. Hover hebt die Route hervor.
export function initRouteMap() {
  document.querySelectorAll<HTMLElement>('[data-routemap]').forEach((map) => {
    const pins = [...map.querySelectorAll<HTMLButtonElement>('.rmap__pin')];
    const hot = (id: string | null) => {
      map.querySelectorAll<SVGPathElement>('[data-route]').forEach((p) => p.classList.toggle('is-hot', p.dataset.route === id));
    };
    pins.forEach((pin) => {
      const id = pin.dataset.routeId!;
      pin.addEventListener('pointerenter', () => hot(id));
      pin.addEventListener('pointerleave', () => hot(map.querySelector<HTMLElement>('.rmap__pin.is-active')?.dataset.routeId ?? null));
      pin.addEventListener('focus', () => hot(id));
      pin.addEventListener('click', () => {
        pins.forEach((p) => p.classList.toggle('is-active', p === pin));
        hot(id);
        document.dispatchEvent(new CustomEvent('insel:set-ziel', { detail: { ziel: pin.dataset.ziel, typ: pin.dataset.typ || undefined } }));
      });
    });
  });
}
