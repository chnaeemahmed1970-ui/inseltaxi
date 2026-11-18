// Nach dem Build: berechnet Hashes für Inline-Skripte und schreibt die Sicherheits-Header
// passend für den gewählten Hoster in den dist-Ordner:
//   dist/.htaccess  (Apache: all-inkl, IONOS, Strato, Hetzner Webhosting, netcup …)
//   dist/_headers   (Netlify-/Cloudflare-Pages-Format, z. B. für statichost.eu-ähnliche Dienste)
//   deploy/nginx-security-headers.conf (zum Einbinden in eine eigene nginx-Konfiguration)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const htmlFiles = walk(dist).filter((f) => f.endsWith('.html'));

const hashes = new Set();
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) {
    hashes.add(`'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://www.openstreetmap.org',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const headers = {
  'Content-Security-Policy': csp,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

// Apache .htaccess
const htaccess = `# Insel Taxi – automatisch erzeugt von scripts/postbuild.mjs. Nicht von Hand bearbeiten.
Options -Indexes
ErrorDocument 404 /404.html
AddDefaultCharset utf-8
AddType text/vcard .vcf
AddType font/woff2 .woff2
AddType image/svg+xml .svg

<IfModule mod_rewrite.c>
  RewriteEngine On
  # Immer HTTPS und ohne www
  RewriteCond %{HTTPS} !=on [OR]
  RewriteCond %{HTTP_HOST} ^www\\. [NC]
  RewriteRule ^ https://inseltaxi-ratzeburg.de%{REQUEST_URI} [L,R=301]
</IfModule>

<IfModule mod_headers.c>
${Object.entries(headers).map(([k, v]) => `  Header always set ${k} "${v}"`).join('\n')}
  <FilesMatch "\\.(js|css|woff2|png|svg|ico|webp|avif)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html|xml|txt|vcf)$">
    Header set Cache-Control "public, max-age=600, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/xml text/plain application/manifest+json
</IfModule>
`;
fs.writeFileSync(path.join(dist, '.htaccess'), htaccess);

// _headers (Netlify / Cloudflare Pages Format)
const hdr = `/*\n${Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n`;
fs.writeFileSync(path.join(dist, '_headers'), hdr);

// nginx
fs.mkdirSync(path.join(root, 'deploy'), { recursive: true });
const nginx = `# Insel Taxi – automatisch erzeugt von scripts/postbuild.mjs\n# In den server { } Block einbinden: include /pfad/zu/nginx-security-headers.conf;\n${Object.entries(headers).map(([k, v]) => `add_header ${k} "${v}" always;`).join('\n')}\nerror_page 404 /404.html;\nlocation /_astro/ { add_header Cache-Control "public, max-age=31536000, immutable"; }\n`;
fs.writeFileSync(path.join(root, 'deploy/nginx-security-headers.conf'), nginx);

console.log(`Sicherheits-Header geschrieben (${hashes.size} Inline-Skript-Hash(es), ${htmlFiles.length} HTML-Seiten).`);
