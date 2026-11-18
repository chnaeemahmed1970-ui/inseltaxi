# Insel Taxi – Webseite

Webseite für **Insel Taxi**, Inhaber Naeem Ahmed, Ratzeburg · https://inseltaxi-ratzeburg.de

> **© Insel Taxi. Alle Rechte vorbehalten.** Dieses Repository ist nicht zur Weitergabe oder Wiederverwendung bestimmt.

---

## Inhalt

1. [Technik in Kürze](#technik-in-kürze)
2. [Lokal starten](#lokal-starten)
3. [Inhalte pflegen](#inhalte-pflegen)
4. [Veröffentlichen (Deployment) – Schritt für Schritt](#veröffentlichen-deployment--schritt-für-schritt)
5. [Google-Unternehmensprofil anlegen](#google-unternehmensprofil-anlegen)
6. [Qualitätsprüfung](#qualitätsprüfung)
7. [Vor dem Livegang prüfen / offene Aufgaben](#vor-dem-livegang-prüfen--offene-aufgaben)

---

## Technik in Kürze

- **Astro** (statischer Seitengenerator) + eigenes CSS + wenig Vanilla-JavaScript.
  *Warum Astro statt reinem HTML:* gemeinsame Bausteine (Header, Footer, Formular) und Daten aus JSON-Dateien (Firmendaten, Tarife, FAQ) an einer Stelle, trotzdem kommt am Ende reines HTML heraus. Kein Server, keine Datenbank, kein Backend.
- **Keine externen Anfragen:** Schriften, Icons und Skripte liegen lokal. Keine Cookies, kein Tracking, also kein Cookie-Banner nötig.
- **Effekte:** GSAP (lokal gebündelt) für Routenkarte und fahrendes Taxi, sonst CSS. Alles respektiert „Bewegung reduzieren“.
- **Design-System:** erzeugt mit dem Skill *ui-ux-pro-max*, siehe `design-system/insel-taxi/MASTER.md` (inkl. begründeter Anpassungen).
- **Sicherheits-Header:** werden beim Build automatisch erzeugt (`dist/.htaccess` für Apache, `dist/_headers`, `deploy/nginx-security-headers.conf`).

### Ordner

| Pfad | Inhalt |
|---|---|
| `src/data/site.config.json` | **Alle Firmendaten** (einzige Quelle: Telefon, WhatsApp, Adresse, USt-IdNr., IK, Behörde, Hoster) |
| `src/data/tarife.json` | Tarife, wörtlich aus der Kreisverordnung |
| `src/data/faq.json` | Häufige Fragen |
| `src/data/leistungen.json` | Leistungen und Fahrttypen des Formulars (inkl. Platzhaltertexte) |
| `src/data/ziele.json` | Ziele für Routenkarte und Ziel-Chips |
| `src/data/bewertungen.json` | Kundenbewertungen (leer = Block wird nicht angezeigt) |
| `src/pages/` | Seiten (jede Datei = eine Seite) |
| `src/components/` | Bausteine (Header, Formular, Karte, Flotte …) |
| `public/` | Logo, Schriften, Favicons, Tarif-PDF |
| `scripts/` | Build-Hilfen: Header, Prüfung, Favicons/OG-Bild |

## Lokal starten

Voraussetzung: [Node.js](https://nodejs.org) Version 20 oder neuer.

```bash
npm install
```

```bash
npm run dev
```

Dann im Browser `http://localhost:4321` öffnen. Fertige Webseite bauen und prüfen:

```bash
npm run build
```

```bash
npm run check
```

Das Ergebnis liegt im Ordner `dist/`.

## Inhalte pflegen

**Firmendaten ändern** (Telefon, Adresse, E-Mail …): nur `src/data/site.config.json` bearbeiten. Die Änderung wirkt überall (Header, Footer, Formular, Impressum, Datenschutz, Google-Daten).

**Tarife ändern:** Bei einer neuen Kreisverordnung `src/data/tarife.json` anpassen (Wortlaut exakt übernehmen) und das PDF in `public/downloads/` ersetzen (Dateiname in `tarife.json` → `pdf` anpassen).

**Bewertungen einfügen:** in `src/data/bewertungen.json` unter `eintraege` echte Bewertungen eintragen (Text unverändert, Name als „Vorname N.“, Quelle „Google-Bewertung“). Den Beispiel-Eintrag mit `_beispiel_format_nicht_anzeigen` löschen. Den Link zum Google-Profil in `site.config.json` → `googleProfilUrl` eintragen. Gesamtnote/Anzahl nur eintragen, wenn sie stimmen.

**Fahrzeugfotos einfügen:** Fotos (am besten 1600 × 700 px, als `.webp` oder `.avif`) nach `public/img/` legen, z. B. `suv.webp` und `grossraum.webp`. In `src/components/FleetPicker.astro` den Platzhalter `<div class="vcard__photo" …>` durch `<img src="/img/suv.webp" alt="Unser SUV …" width="1600" height="700" loading="lazy" />` ersetzen.

**FAQ ändern:** `src/data/faq.json`. Mit `"start": true` erscheint eine Frage auch auf der Startseite, über `tags` auf passenden Leistungsseiten.

**Logo ändern:** `public/img/logo.svg` ersetzen und danach Favicons und Vorschaubild neu erzeugen:

```bash
npm run assets
```

## Veröffentlichen (Deployment) – Schritt für Schritt

### 1. Hoster wählen (Ihre Entscheidung)

Alle Vorschläge: Server in Deutschland, Vertrag zur Auftragsverarbeitung (AVV) erhältlich, Apache mit `.htaccess` (die Sicherheits-Header funktionieren sofort), kostenloses SSL-Zertifikat.

| Anbieter | Standort | Passend, weil |
|---|---|---|
| **ALL-INKL.COM** (z. B. „Privat Plus“) | Deutschland | sehr einfach, deutscher Support, AVV online abschließbar |
| **Hetzner Webhosting** | Deutschland | günstig, schnell, AVV im Kundenportal |
| **netcup Webhosting** | Deutschland | günstig, AVV im Kundenportal |

*Meine Empfehlung für den einfachsten Start: ALL-INKL.COM.* Domain `inseltaxi-ratzeburg.de` dort registrieren oder umziehen.

### 2. Webseite bauen

```bash
npm install
```

```bash
npm run build
```

### 3. Hochladen

1. Im Kundenmenü des Hosters FTP-Zugangsdaten anlegen.
2. Ein FTP-Programm installieren, z. B. [FileZilla](https://filezilla-project.org) (kostenlos).
3. Mit den FTP-Daten verbinden und den **Inhalt** des Ordners `dist/` (nicht den Ordner selbst) in das Webverzeichnis der Domain hochladen. **Wichtig:** Die versteckte Datei `.htaccess` muss mit hochgeladen werden (in FileZilla: Menü „Server“ → „Anzeige versteckter Dateien erzwingen“).

### 4. HTTPS aktivieren

Im Kundenmenü für die Domain ein **Let’s-Encrypt-SSL-Zertifikat** aktivieren. Die `.htaccess` leitet dann automatisch alle Aufrufe auf `https://inseltaxi-ratzeburg.de` um (auch `www.`).

### 5. Nachtragen und prüfen

1. AVV mit dem Hoster abschließen.
2. Hoster in `src/data/site.config.json` → `hosting` eintragen (Name, Anschrift, Link zur Datenschutzerklärung, Löschfrist der Logfiles laut Hoster), neu bauen und hochladen.
3. Testen: Seite am Handy öffnen, „Anrufen“ und „WhatsApp“ antippen, Formular einmal absenden.
4. Optional: https://securityheaders.com und https://pagespeed.web.dev aufrufen und die Domain prüfen.

## Google-Unternehmensprofil anlegen

1. https://www.google.com/business aufrufen, mit einem Google-Konto anmelden.
2. Unternehmen „Insel Taxi“ anlegen, Kategorie **„Taxiunternehmen“**.
3. Daten **genau wie auf der Webseite** eintragen: Adresse Zittschower Weg 11a, 23909 Ratzeburg · Telefon 04541 802080 · Webseite https://inseltaxi-ratzeburg.de.
4. Öffnungszeiten: **24 Stunden geöffnet**, alle Tage.
5. Einzugsgebiet: Ratzeburg, Kreis Herzogtum Lauenburg, Hamburg, Lübeck, Schleswig-Holstein, Deutschland.
6. Leistungen hinzufügen (Flughafentransfer, Krankenfahrten, Kurierfahrten, Fernfahrten …), echte Fotos der Fahrzeuge hochladen.
7. Bestätigung (Postkarte/Video) abschließen.
8. Danach den Profil-Link in `site.config.json` → `googleProfilUrl` eintragen. Dann erscheint er auf der Webseite und in den strukturierten Daten.

## Qualitätsprüfung

`npm run check` prüft automatisch: tote Links und Anker, Format aller `tel:`/`wa.me`/`mailto:`-Links, identische Kontaktdaten auf allen Seiten, keine externen Ressourcen, Title/Description/genau eine h1 je Seite.

Ergebnisse der letzten Prüfung (lokal, ohne Server-Kompression):

- **Lighthouse mobil:** Performance 96–100, Barrierefreiheit 100, Best Practices 100, SEO 100 (Startseite, Tarife, Krankenfahrten, Kontakt, Datenschutz).
- 18 Seiten × 4 Breiten (375 / 768 / 1024 / 1440 px): keine Konsolenfehler, keine externen Requests, kein horizontales Scrollen.
- WhatsApp-Nachricht: Umlaute, Zeilenumbrüche, `&`, `%`, `#`, Anführungszeichen korrekt kodiert.
- Tastatur: Fokus immer sichtbar, nicht von Header/Sticky-Leiste verdeckt. „Bewegung reduzieren“: alle Inhalte sofort sichtbar.

## Vor dem Livegang prüfen / offene Aufgaben

**Bitte prüfen lassen (z. B. IHK oder Rechtsanwalt):**

- [ ] **Impressum und Datenschutzerklärung** sind sorgfältig erstellte Entwürfe, keine Rechtsberatung. Einmal prüfen lassen.
- [ ] **Datenschutz Abschnitt 8 „Krankenfahrten“:** Rechtsgrundlagen (Art. 9 Abs. 2 lit. h DSGVO, § 22 BDSG, § 302 SGB V) und ob ein Abrechnungsdienstleister eingesetzt wird.
- [ ] **Genehmigungsbehörde im Impressum:** Ich habe auf kreis-rz.de nur die allgemeine Anschrift der Kreisverwaltung gefunden (Am Markt 4, 23909 Ratzeburg, Zentrale 04541 801-010), keine eigene Anschrift des Fachdienstes Straßenverkehr. Bitte die genaue Anschrift und Telefonnummer des Fachdienstes bestätigen → `site.config.json` → `behoerde`.
- [ ] **Verbraucherstreitbeilegung:** Annahme „Kleinstunternehmen (≤ 10 Beschäftigte)“, deshalb nur kurzer Hinweis. Bitte bestätigen.
- [ ] **Berufsbezeichnung** „Taxiunternehmer“ steht wie gewünscht im Impressum (gesetzlich nicht zwingend).
- [ ] **Dashcams:** Auf Ihren Wunsch komplett von der Webseite entfernt. Hinweis: Werden Dashcams betrieben, gelten die Informationspflichten der DSGVO trotzdem (z. B. Hinweisschild im Fahrzeug). Bei Bedarf kann der Abschnitt wieder ergänzt werden.

**Von Ihnen zu liefern oder zu entscheiden:**

- [ ] Hoster auswählen, AVV abschließen, in `site.config.json` → `hosting` eintragen
- [ ] Echte Fahrzeugfotos (SUV, Großraumtaxi)
- [ ] Echte Bewertungen und Link zum Google-Profil
- [ ] Geo-Koordinaten der Adresse in `site.config.json` → `adresse.geo` (dann Marker auf der Karte und Geo-Daten für Google)
- [ ] Bestätigen: „SUV bis 6 Plätze“ = 6 **Fahrgäste**? (Die Seite rechnet: bis 6 Personen SUV, 7–8 Großraumtaxi.)
- [ ] Bestätigen: neue Leistungsseite **„Bahnhof, Hafen & Fähre“** passt zu Ihrem Angebot
- [ ] Bestätigen: Sammelrechnung für Firmen, Nachricht an Eltern bei Kinderfahrten (stehen so auf der Seite)
- [ ] Optional Phase 2: englische Kurzversion für Flughafengäste

## Gegenüber dem Auftrag verbessert

- WhatsApp-Formular in **WhatsApp-Chat-Optik** mit **Live-Vorschau** der Nachricht als Sprechblase
- **Start/Ziel tauschen** mit einem Tipp, Fehlerübersicht mit Sprung zum Feld, Rückmeldung nach dem Absenden
- **Live-Tarifanzeige:** zeigt auf der Tarifseite, ob gerade Tag- oder Nachttarif gilt (inkl. Feiertage in Schleswig-Holstein), mit 24-Stunden-Uhr. Kein Preisrechner.
- **„Kontakt speichern“** (vCard) für das Telefonbuch, gerade für ältere Menschen
- Zusätzliche Leistungsseite **Bahnhof, Hafen & Fähre**
- Routenkarte mit Pfeilen „ins Ausland“ und „ganz Deutschland“, Klick übernimmt das Ziel ins Formular
- Native Seitenübergänge ohne JavaScript, Sicherheits-Header mit automatisch berechneter CSP
- Tarif-PDF der Kreisverordnung zum Download
