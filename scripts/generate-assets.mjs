// Erzeugt Favicons und das Open-Graph-Bild aus dem Logo.
// Aufruf: node scripts/generate-assets.mjs   (benötigt Playwright mit Chromium, nur für die Erstellung)
// Ergebnisse werden ins Repository eingecheckt, die Webseite selbst braucht Playwright nicht.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const site = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site.config.json'), 'utf8'));
const logo = fs.readFileSync(path.join(root, 'public/img/logo.svg'), 'utf8');
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'public/fonts', f)).toString('base64')}`;
const fontCss = `
@font-face{font-family:Lexend;font-weight:100 900;src:url(${font('lexend-latin-wght-normal.woff2')}) format('woff2')}
@font-face{font-family:Lexend;font-weight:100 900;src:url(${font('lexend-latin-ext-wght-normal.woff2')}) format('woff2');unicode-range:U+0100-02BA}
@font-face{font-family:'Source Sans 3';font-weight:200 900;src:url(${font('source-sans-3-latin-wght-normal.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0;padding:0}`;
const logoInline = logo.replace('<svg ', '<svg width="100%" height="100%" ');

const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(html, w, h, out, scale = 1) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}</style></head><body>${html}</body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: true, scale: scale === 1 ? 'css' : 'device' });
}

// 1) Favicons
const fav = (s, pad, bg) => `<div style="width:${s}px;height:${s}px;display:grid;place-items:center;background:${bg};border-radius:${bg === 'transparent' ? 0 : s * 0.22}px"><div style="width:${s - pad * 2}px;height:${s - pad * 2}px">${logoInline}</div></div>`;
await shot(fav(32, 1, 'transparent'), 32, 32, path.join(root, 'public/favicon-32.png'));
await shot(fav(180, 22, '#FFFFFF'), 180, 180, path.join(root, 'public/apple-touch-icon.png'));
await shot(fav(192, 24, '#FFFFFF'), 192, 192, path.join(root, 'public/img/icon-192.png'));
await shot(fav(512, 64, '#FFFFFF'), 512, 512, path.join(root, 'public/img/icon-512.png'));

// favicon.ico (PNG in ICO-Container, 32x32)
const png = fs.readFileSync(path.join(root, 'public/favicon-32.png'));
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
fs.writeFileSync(path.join(root, 'public/favicon.ico'), Buffer.concat([ico, png]));
fs.unlinkSync(path.join(root, 'public/favicon-32.png'));

// 2) Open-Graph-Bild 1200x630
const og = `
<div style="width:1200px;height:630px;background:#FFFAEB;position:relative;overflow:hidden;font-family:Lexend">
  <svg style="position:absolute;right:-40px;top:0" width="640" height="630" viewBox="0 0 640 630"><path d="M700 40 C 470 60 420 220 540 300 C 660 380 560 560 300 680" fill="none" stroke="#FDBE04" stroke-width="120" stroke-linecap="round" opacity=".35"/><path d="M700 40 C 470 60 420 220 540 300 C 660 380 560 560 300 680" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="26 22"/></svg>
  <div style="position:absolute;left:80px;top:80px;display:flex;align-items:center;gap:22px">
    <div style="width:84px;height:108px">${logoInline}</div>
    <div><div style="font-weight:800;font-size:46px;letter-spacing:-1.5px;color:#17181C">Insel Taxi</div><div style="font-family:'Source Sans 3';font-weight:600;font-size:26px;color:#464953">Ratzeburg · rund um die Uhr</div></div>
  </div>
  <div style="position:absolute;left:80px;top:250px;font-weight:800;font-size:84px;line-height:1.02;letter-spacing:-3px;color:#17181C">Pünktlich. Sauber.<br><span style="background:linear-gradient(transparent 58%,#FDBE04 0 92%,transparent 0)">Überall hin.</span></div>
  <div style="position:absolute;left:80px;bottom:62px;display:flex;gap:16px;font-family:'Source Sans 3';font-weight:700;font-size:28px">
    <span style="background:#FDBE04;color:#17181C;padding:12px 26px;border-radius:999px">${site.telefon.anzeige}</span>
    <span style="background:#17181C;color:#fff;padding:12px 26px;border-radius:999px">Flughafen · Krankenfahrten · Fernfahrten</span>
  </div>
  <div style="position:absolute;left:0;right:0;top:0;height:14px;background:conic-gradient(#17181C 25%,#FDBE04 0 50%,#17181C 0 75%,#FDBE04 0) 0 0/28px 28px"></div>
</div>`;
await shot(og, 1200, 630, path.join(root, 'public/img/og-insel-taxi.png'));

await browser.close();
console.log('Assets erzeugt.');
