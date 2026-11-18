import site from '../data/site.config.json';
import data from '../data/leistungen.json';

export const telHref = `tel:${site.telefon.e164}`;
export const waHref = (text?: string) => `https://wa.me/${site.whatsapp.nummer}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const mailHref = `mailto:${site.email}`;
export const addressLine = `${site.adresse.strasse}, ${site.adresse.plz} ${site.adresse.ort}`;
export const BUSINESS_ID = `${site.url}/#unternehmen`;

export function businessJsonLd() {
  return {
    '@type': ['TaxiService', 'LocalBusiness'],
    '@id': BUSINESS_ID,
    name: site.firma,
    description: 'Taxiunternehmen aus Ratzeburg: Flughafentransfer, Krankenfahrten mit Direktabrechnung, Geschäftsfahrten, Kinder- und Kurierfahrten, Fernfahrten deutschlandweit und ins Ausland. Rund um die Uhr erreichbar.',
    url: site.url,
    logo: `${site.url}/img/logo.svg`,
    image: `${site.url}/img/og-insel-taxi.png`,
    telephone: site.telefon.e164,
    email: site.email,
    founder: { '@type': 'Person', name: site.inhaber },
    vatID: site.ustId,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.adresse.strasse,
      postalCode: site.adresse.plz,
      addressLocality: site.adresse.ort,
      addressRegion: 'Schleswig-Holstein',
      addressCountry: site.adresse.landCode,
    },
    ...(site.adresse.geo.lat ? { geo: { '@type': 'GeoCoordinates', latitude: site.adresse.geo.lat, longitude: site.adresse.geo.lng } } : {}),
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    }],
    areaServed: [
      { '@type': 'Country', name: 'Deutschland' },
      { '@type': 'Place', name: 'Europa' },
    ],
    paymentAccepted: site.zahlungsarten.join(', '),
    currenciesAccepted: 'EUR',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Leistungen',
      itemListElement: data.leistungen.map((l) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: l.titel, url: `${site.url}/leistungen/${l.slug}/` },
      })),
    },
    ...(site.googleProfilUrl ? { sameAs: [site.googleProfilUrl] } : {}),
  };
}

export function serviceJsonLd(name: string, description: string, path: string) {
  return {
    '@type': 'Service',
    name,
    description,
    url: `${site.url}${path}`,
    serviceType: name,
    provider: { '@id': BUSINESS_ID },
    areaServed: [{ '@type': 'Country', name: 'Deutschland' }, { '@type': 'Place', name: 'Europa' }],
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a.replace(/<[^>]+>/g, '') },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${site.url}${it.path}` })),
  };
}
