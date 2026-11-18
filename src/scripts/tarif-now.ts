// Zeigt live an, welche Tarifstufe gerade gilt (Tag oder Nacht/Sonn-/Feiertag).
// Kein Preisrechner: nur Orientierung, welche Zeile der amtlichen Tabelle aktuell zutrifft.
// Feiertage: gesetzliche Feiertage in Schleswig-Holstein.

function easterSunday(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export function holidaysSH(y: number): Map<string, string> {
  const e = easterSunday(y);
  const off = (n: number) => new Date(e.getFullYear(), e.getMonth(), e.getDate() + n);
  const list: [Date, string][] = [
    [new Date(y, 0, 1), 'Neujahr'],
    [off(-2), 'Karfreitag'],
    [off(1), 'Ostermontag'],
    [new Date(y, 4, 1), 'Tag der Arbeit'],
    [off(39), 'Christi Himmelfahrt'],
    [off(50), 'Pfingstmontag'],
    [new Date(y, 9, 3), 'Tag der Deutschen Einheit'],
    [new Date(y, 9, 31), 'Reformationstag'],
    [new Date(y, 11, 25), '1. Weihnachtstag'],
    [new Date(y, 11, 26), '2. Weihnachtstag'],
  ];
  // Ostersonntag und Pfingstsonntag sind Sonntage und damit ohnehin Nachttarif.
  return new Map(list.map(([d, n]) => [key(d), n]));
}

export function currentTariff(now = new Date()) {
  const h = now.getHours();
  const holiday = holidaysSH(now.getFullYear()).get(key(now));
  const sunday = now.getDay() === 0;
  const night = h >= 22 || h < 6;
  if (holiday) return { stufe: 'nacht', grund: `heute ist ${holiday} (Feiertag)` };
  if (sunday) return { stufe: 'nacht', grund: 'heute ist Sonntag' };
  if (night) return { stufe: 'nacht', grund: 'es ist zwischen 22 und 6 Uhr' };
  return { stufe: 'tag', grund: 'es ist werktags zwischen 6 und 22 Uhr' };
}

export function initTarifNow() {
  const el = document.querySelector<HTMLElement>('[data-tarif-now]');
  if (!el) return;
  const render = () => {
    const now = new Date();
    const t = currentTariff(now);
    const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    el.querySelector('[data-tn-text]')!.textContent =
      t.stufe === 'tag'
        ? `Jetzt (${time} Uhr) gilt der Tagtarif T1/T2, weil ${t.grund}.`
        : `Jetzt (${time} Uhr) gilt der Nacht-, Sonn- und Feiertagstarif T1N/T2N, weil ${t.grund}.`;
    el.dataset.stufe = t.stufe;
    el.hidden = false;
    document.querySelectorAll<HTMLElement>('[data-tarif-zeit]').forEach((row) => {
      row.classList.toggle('is-now', row.dataset.tarifZeit === t.stufe);
    });
  };
  render();
  setInterval(render, 60_000);
}
