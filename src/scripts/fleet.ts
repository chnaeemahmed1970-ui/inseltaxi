// Flotten-Wähler: hebt das passende Fahrzeug hervor und füllt die Sitzplatz-Grafik.
export function initFleet() {
  document.querySelectorAll<HTMLElement>('[data-fleet]').forEach((root) => {
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-count]')];
    const cards = [...root.querySelectorAll<HTMLElement>('[data-vehicle]')];
    const result = root.querySelector<HTMLElement>('[data-fleet-result]')!;

    const apply = (n: number) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.count) === n)));
      const best = n <= 6 ? 'suv' : n <= 8 ? 'grossraum' : 'both';
      cards.forEach((card) => {
        const seats = Number(card.dataset.seats);
        const id = card.dataset.vehicle;
        const fits = n <= seats;
        const match = best === 'both' || best === id;
        card.classList.toggle('is-match', match);
        card.classList.toggle('is-dim', !fits && best !== 'both');
        card.querySelector<HTMLElement>('[data-fit]')!.hidden = !match;
        card.querySelectorAll<SVGRectElement>('[data-seat]').forEach((s) => {
          s.classList.toggle('is-on', Number(s.dataset.seat) <= Math.min(n, seats));
        });
      });
      if (n <= 4) result.textContent = `Für ${n} ${n === 1 ? 'Person' : 'Personen'} passt unser SUV. Auch das Großraumtaxi ist möglich.`;
      else if (n <= 6) result.textContent = `Für ${n} Personen passt unser SUV mit bis zu 6 Plätzen. Bei viel Gepäck empfehlen wir das Großraumtaxi.`;
      else if (n <= 8) result.textContent = `Für ${n} Personen kommt unser Großraumtaxi mit bis zu 8 Plätzen.`;
      else result.textContent = 'Mehr als 8 Personen? Wir koordinieren mehrere Fahrzeuge, damit alle gemeinsam ankommen.';
    };
    buttons.forEach((b) => b.addEventListener('click', () => apply(Number(b.dataset.count))));
    // Pfeiltasten in der Auswahl
    root.querySelector('.fleet__counts')?.addEventListener('keydown', (e) => {
      const ke = e as KeyboardEvent;
      if (!['ArrowLeft', 'ArrowRight'].includes(ke.key)) return;
      const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0) return;
      const next = buttons[(i + (ke.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
      next.focus(); next.click(); e.preventDefault();
    });
    apply(4);
  });
}
