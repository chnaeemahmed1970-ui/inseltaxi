// WhatsApp-/E-Mail-Anfrageformular. Es wird nichts gespeichert und nichts übertragen,
// bevor die Nutzerin/der Nutzer in WhatsApp bzw. im E-Mail-Programm selbst auf Senden tippt.

type Fields = {
  typ: HTMLSelectElement; name: HTMLInputElement; start: HTMLInputElement; ziel: HTMLInputElement;
  asap: HTMLInputElement; datum: HTMLInputElement; zeit: HTMLInputElement; personen: HTMLInputElement; anmerkung: HTMLTextAreaElement;
};

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const LABELS: Record<string, string> = { name: 'Ihr Name', start: 'Start', ziel: 'Ziel', datum: 'Datum', zeit: 'Uhrzeit' };

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('[data-request-form]').forEach(setup);
  // Ziel aus der Routenkarte oder anderen Stellen übernehmen
  document.addEventListener('insel:set-ziel', (e: Event) => {
    const { ziel, typ } = (e as CustomEvent).detail ?? {};
    const form = document.querySelector<HTMLFormElement>('#anfrage[data-request-form]') ?? document.querySelector<HTMLFormElement>('[data-request-form]');
    if (!form) return;
    const zf = form.querySelector<HTMLInputElement>('[data-field="ziel"]')!;
    zf.value = ziel;
    zf.dispatchEvent(new Event('input', { bubbles: true }));
    if (typ) {
      const sel = form.querySelector<HTMLSelectElement>('[data-field="typ"]')!;
      sel.value = typ; sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    const next = form.querySelector<HTMLInputElement>('[data-field="start"]')!;
    setTimeout(() => (next.value ? form.querySelector<HTMLInputElement>('[data-field="name"]') : next)?.focus({ preventScroll: true }), 450);
  });
}

function setup(form: HTMLFormElement) {
  const q = <T extends Element>(n: string) => form.querySelector<T>(`[data-field="${n}"]`)!;
  const f: Fields = {
    typ: q('typ'), name: q('name'), start: q('start'), ziel: q('ziel'), asap: q('asap'),
    datum: q('datum'), zeit: q('zeit'), personen: q('personen'), anmerkung: q('anmerkung'),
  };
  const mode = form.dataset.mode as 'wa' | 'mail';
  const summary = form.querySelector<HTMLElement>('[data-summary]')!;
  const summaryList = form.querySelector<HTMLElement>('[data-summary-list]')!;
  const peopleHint = form.querySelector<HTMLElement>('[data-people-hint]')!;
  const preview = form.querySelector<HTMLElement>('[data-preview]')!;
  const touched = new Set<string>();

  // Datum frühestens heute
  const today = new Date();
  f.datum.min = isoDate(today);

  // Vorbelegung über URL (?typ=flughafen&ziel=…&start=…)
  const params = new URLSearchParams(location.search);
  const pTyp = params.get('typ');
  if (pTyp && [...f.typ.options].some((o) => o.value === pTyp)) f.typ.value = pTyp;
  if (params.get('ziel')) f.ziel.value = params.get('ziel')!.slice(0, 120);
  if (params.get('start')) f.start.value = params.get('start')!.slice(0, 120);

  // Platzhalter der Anmerkung passt sich dem Fahrttyp an
  const syncHint = () => {
    const opt = f.typ.selectedOptions[0];
    f.anmerkung.placeholder = opt?.dataset.hint ?? '';
  };
  f.typ.addEventListener('change', () => { syncHint(); update(); });
  syncHint();

  // Jetzt / so schnell wie möglich
  const syncAsap = () => {
    const on = f.asap.checked;
    if (on) {
      const now = new Date(Date.now() + 5 * 60_000);
      now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
      f.datum.value = isoDate(now);
      f.zeit.value = isoTime(now);
      clearError('datum'); clearError('zeit');
    }
    f.datum.disabled = on; f.zeit.disabled = on;
    update();
  };
  f.asap.addEventListener('change', syncAsap);

  // Personen-Stepper
  const clampPeople = () => {
    let n = parseInt(f.personen.value, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > 40) n = 40;
    return n;
  };
  const syncPeople = () => {
    const n = clampPeople();
    form.querySelector<HTMLButtonElement>('[data-step="-1"]')!.disabled = n <= 1;
    let html = '';
    if (n >= 9) html = `<strong>Mehr als 8 Personen?</strong> Kein Problem, wir koordinieren mehrere Fahrzeuge für Ihre Gruppe.`;
    else if (n >= 7) html = `<strong>Großraumtaxi:</strong> Für ${n} Personen schicken wir unser Großraumtaxi mit bis zu 8 Plätzen.`;
    else if (n >= 5) html = `Für ${n} Personen passt unser SUV mit bis zu 6 Plätzen. Bei viel Gepäck gern das Großraumtaxi.`;
    peopleHint.innerHTML = html;
    update();
  };
  form.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      f.personen.value = String(Math.min(40, Math.max(1, clampPeople() + Number(b.dataset.step))));
      syncPeople();
    }),
  );
  f.personen.addEventListener('change', () => { f.personen.value = String(clampPeople()); syncPeople(); });
  f.personen.addEventListener('input', syncPeople);
  syncPeople();

  // Start/Ziel tauschen
  const swap = form.querySelector<HTMLButtonElement>('[data-swap]');
  swap?.addEventListener('click', () => {
    [f.start.value, f.ziel.value] = [f.ziel.value, f.start.value];
    swap.classList.toggle('is-swapped');
    syncChips(); update();
  });

  // Ziel-Chips
  const chips = [...form.querySelectorAll<HTMLButtonElement>('[data-ziel-chip]')];
  const syncChips = () => chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.zielChip === f.ziel.value)));
  chips.forEach((c) => c.addEventListener('click', () => {
    f.ziel.value = c.dataset.zielChip!;
    if (/Flughafen/.test(f.ziel.value) && f.typ.value === 'alltag') { f.typ.value = 'flughafen'; syncHint(); }
    clearError('ziel'); syncChips(); update();
  }));
  f.ziel.addEventListener('input', syncChips);
  syncChips();

  // Validierung (bei Verlassen des Feldes, nach dem ersten Fehlversuch auch live)
  function validate(name: keyof typeof LABELS): string {
    const el = (f as any)[name] as HTMLInputElement;
    const v = el.value.trim();
    if (name === 'name') return v.length < 2 ? 'Bitte geben Sie Ihren Namen ein, damit wir Sie ansprechen können.' : '';
    if (name === 'start') return v.length < 2 ? 'Bitte geben Sie an, wo wir Sie abholen sollen.' : '';
    if (name === 'ziel') return v.length < 2 ? 'Bitte geben Sie Ihr Ziel ein. Ein Ort oder eine Adresse genügt.' : '';
    if (f.asap.checked) return '';
    if (name === 'datum') {
      if (!v) return 'Bitte wählen Sie ein Datum oder „Jetzt“.';
      if (v < isoDate(new Date())) return 'Das Datum liegt in der Vergangenheit. Bitte wählen Sie heute oder später.';
      return '';
    }
    if (name === 'zeit') {
      if (!v) return 'Bitte wählen Sie eine Uhrzeit oder „Jetzt“.';
      if (f.datum.value === isoDate(new Date())) {
        const [h, m] = v.split(':').map(Number);
        const t = new Date(); t.setHours(h, m, 0, 0);
        if (t.getTime() < Date.now() - 10 * 60_000) return 'Diese Uhrzeit ist heute schon vorbei. Für sofort nutzen Sie bitte „Jetzt“.';
      }
      return '';
    }
    return '';
  }
  function showError(name: string, msg: string) {
    const el = (f as any)[name] as HTMLInputElement;
    const err = form.querySelector<HTMLElement>(`#${el.id}-err`);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.hidden = !msg; err.querySelector('span')!.textContent = msg; }
  }
  function clearError(name: string) { showError(name, ''); }

  (Object.keys(LABELS) as (keyof typeof LABELS)[]).forEach((n) => {
    const el = (f as any)[n] as HTMLInputElement;
    el.addEventListener('blur', () => { if (el.value.trim() || touched.has(n)) { touched.add(n); showError(n, validate(n)); } });
    el.addEventListener('input', () => { if (touched.has(n)) showError(n, validate(n)); update(); });
    el.addEventListener('change', () => { if (touched.has(n)) showError(n, validate(n)); update(); });
  });
  f.anmerkung.addEventListener('input', update);

  function validateAll(): boolean {
    const errors: { id: string; label: string; msg: string }[] = [];
    (Object.keys(LABELS) as (keyof typeof LABELS)[]).forEach((n) => {
      touched.add(n);
      const msg = validate(n);
      showError(n, msg);
      if (msg) errors.push({ id: ((f as any)[n] as HTMLElement).id, label: LABELS[n], msg });
    });
    summaryList.innerHTML = '';
    if (errors.length) {
      for (const e of errors) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${e.id}`; a.textContent = `${e.label}: ${e.msg}`;
        a.addEventListener('click', (ev) => { ev.preventDefault(); document.getElementById(e.id)?.focus(); });
        li.append(a); summaryList.append(li);
      }
      summary.hidden = false;
      summary.focus();
      return false;
    }
    summary.hidden = true;
    return true;
  }

  // Nachricht bauen
  function whenText(): string {
    if (f.asap.checked) return 'Jetzt / so schnell wie möglich';
    if (!f.datum.value) return '';
    const [y, m, d] = f.datum.value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const wd = date.toLocaleDateString('de-DE', { weekday: 'short' });
    const ds = `${wd}, ${pad(d)}.${pad(m)}.${y}`;
    return f.zeit.value ? `${ds}, ${f.zeit.value} Uhr` : ds;
  }
  function buildMessage(): string {
    const lines = [
      'Hallo Insel Taxi, ich möchte eine Fahrt anfragen:',
      '',
      `Name: ${f.name.value.trim()}`,
      `Fahrttyp: ${f.typ.selectedOptions[0]?.textContent?.trim() ?? ''}`,
      `Von: ${f.start.value.trim()}`,
      `Nach: ${f.ziel.value.trim()}`,
      `Wann: ${whenText()}`,
      `Personen: ${clampPeople()}`,
    ];
    const note = f.anmerkung.value.trim();
    if (note) lines.push(`Anmerkung: ${note}`);
    lines.push('', 'Vielen Dank!');
    return lines.join('\n');
  }
  function update() { preview.textContent = buildMessage(); }
  update();

  function openUrl(url: string, newTab: boolean) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (newTab && !coarse) {
      const w = window.open(url, '_blank', 'noopener');
      if (w) return;
    }
    window.location.href = url;
  }
  const sendWa = () => openUrl(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(buildMessage())}`, true);
  const sendMail = () => {
    const subject = `Fahrtanfrage: ${f.typ.selectedOptions[0]?.textContent?.trim()}${f.ziel.value ? ` nach ${f.ziel.value.trim()}` : ''}`;
    openUrl(`mailto:${form.dataset.mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMessage())}`, false);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    mode === 'wa' ? sendWa() : sendMail();
  });
  form.querySelector('[data-send-mail]')?.addEventListener('click', () => { if (validateAll()) sendMail(); });
  form.querySelector('[data-send-wa]')?.addEventListener('click', () => { if (validateAll()) sendWa(); });
}
