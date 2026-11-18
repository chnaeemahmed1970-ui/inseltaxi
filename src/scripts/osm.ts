// Zwei-Klick-Lösung für die Karte: OpenStreetMap wird erst nach ausdrücklichem Klick geladen.
export function initOsm() {
  document.querySelectorAll<HTMLElement>('[data-osm]').forEach((box) => {
    const btn = box.querySelector<HTMLButtonElement>('[data-osm-load]');
    btn?.addEventListener('click', () => {
      const src = box.dataset.osm!;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = box.dataset.osmTitle || 'Karte';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
      box.querySelector('[data-osm-placeholder]')?.replaceWith(iframe);
      iframe.focus();
    });
  });
}
