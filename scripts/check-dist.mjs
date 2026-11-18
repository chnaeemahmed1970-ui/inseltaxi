// Qualitätsprüfung des fertigen Builds (npm run build && npm run check):
// - tote interne Links und fehlende Anker
// - tel:/wa.me-Links im richtigen Format
// - Telefonnummer, Adresse und E-Mail überall identisch mit der Config
// - keine externen Ressourcen (Skripte, Styles, Bilder, Fonts)
// - jede Seite hat Title, Description, genau eine h1 und lang="de"
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site.config.json'), 'utf8'));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(dist);
const html = files.filter((f) => f.endsWith('.html'));
const errors = [];
const urlOf = (f) => '/' + path.relative(dist, f).replace(/index\.html$/, '').replace(/\\/g, '/');

const pages = new Map(html.map((f) => [urlOf(f), fs.readFileSync(f, 'utf8')]));
const exists = (p) => {
  const clean = decodeURIComponent(p.split('#')[0].split('?')[0]);
  if (pages.has(clean)) return true;
  return fs.existsSync(path.join(dist, clean)) && fs.statSync(path.join(dist, clean)).isFile();
};
const ids = (h) => new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

for (const [url, h] of pages) {
  if (!/<html lang="de">/.test(h)) errors.push(`${url}: lang="de" fehlt`);
  if (!/<title>[^<]{10,}<\/title>/.test(h)) errors.push(`${url}: Title fehlt/zu kurz`);
  if (!/<meta name="description" content="[^"]{50,}"/.test(h)) errors.push(`${url}: Description fehlt/zu kurz`);
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${url}: ${h1} h1-Überschriften`);

  for (const m of h.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const v = m[1].replace(/&amp;/g, '&');
    if (v.startsWith('tel:')) { if (v !== `tel:${site.telefon.e164}`) errors.push(`${url}: falscher tel-Link ${v}`); continue; }
    if (v.startsWith('https://wa.me/')) { if (!v.startsWith(`https://wa.me/${site.whatsapp.nummer}`)) errors.push(`${url}: falscher WhatsApp-Link ${v}`); continue; }
    if (v.startsWith('mailto:')) { if (!v.startsWith(`mailto:${site.email}`)) errors.push(`${url}: falscher mailto ${v}`); continue; }
    if (/^https?:\/\//.test(v)) continue; // externe Links (nur <a>) erlaubt, Ressourcen werden unten geprüft
    if (v.startsWith('#')) { if (v.length > 1 && !ids(h).has(v.slice(1))) errors.push(`${url}: Anker ${v} fehlt`); continue; }
    if (v.startsWith('/')) {
      if (!exists(v)) errors.push(`${url}: toter Link ${v}`);
      const anchor = v.split('#')[1];
      if (anchor && pages.has(v.split('#')[0].split('?')[0]) && !ids(pages.get(v.split('#')[0].split('?')[0])).has(anchor)) errors.push(`${url}: Anker ${v} fehlt`);
    }
  }
  // Externe Ressourcen (nicht Links) sind verboten
  for (const m of h.matchAll(/<(script|img|link|iframe|source|video|audio)\b[^>]*\s(?:src|href)="(https?:\/\/[^"]+)"/g)) {
    if (m[1] === 'link' && /rel="canonical"/.test(m[0])) continue;
    errors.push(`${url}: externe Ressource ${m[2]}`);
  }
  // Konsistenz: sichtbare Nummer
  const text = h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
  const shown = [...text.matchAll(/(?<![\d.,])0\d{3,4}[\s\u00a0]?\d{5,7}(?![\d.,])/g)].map((m) => m[0]);
  for (const s of shown) if (![site.telefon.anzeige, site.whatsapp.anzeige.replace(' ', '')].includes(s) && s.replace(/\s/g, '') !== site.whatsapp.anzeige.replace(/\s/g, '')) {
    if (!s.startsWith('0431') && !s.startsWith('04541 801')) errors.push(`${url}: abweichende Nummer ${s}`);
  }
  if (h.includes('Zittschower') && !h.includes(site.adresse.strasse)) errors.push(`${url}: abweichende Adresse`);
}

// CSS/JS-Dateien auf externe URLs prüfen
for (const f of files.filter((f) => /\.(css|js)$/.test(f))) {
  const c = fs.readFileSync(f, 'utf8');
  for (const m of c.matchAll(/url\((["']?)(https?:\/\/[^)"']+)/g)) errors.push(`${path.relative(dist, f)}: externe URL ${m[2]}`);
  for (const m of c.matchAll(/import\(["'](https?:\/\/[^"']+)/g)) errors.push(`${path.relative(dist, f)}: externer Import ${m[1]}`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} Problem(e):\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ ${pages.size} Seiten geprüft: keine toten Links, Kontaktdaten konsistent, keine externen Ressourcen.`);
