// Visitenkarte zum Speichern im Telefonbuch ("Nummer speichern"), erzeugt aus site.config.json.
import site from '../data/site.config.json';

export function GET() {
  const vcf = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${site.firma};;;`,
    `FN:${site.firma}`,
    `ORG:${site.firma}`,
    `TEL;TYPE=WORK,VOICE:${site.telefon.e164}`,
    `TEL;TYPE=CELL:+${site.whatsapp.nummer}`,
    `EMAIL;TYPE=WORK:${site.email}`,
    `ADR;TYPE=WORK:;;${site.adresse.strasse};${site.adresse.ort};;${site.adresse.plz};${site.adresse.land}`,
    `URL:${site.url}`,
    'NOTE:Taxi rund um die Uhr. Anrufen oder per WhatsApp anfragen.',
    'END:VCARD',
    '',
  ].join('\r\n');
  return new Response(vcf, { headers: { 'Content-Type': 'text/vcard; charset=utf-8' } });
}
