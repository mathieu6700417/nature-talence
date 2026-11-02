// Lien « Y aller » : itinéraire à pied vers le point d'une fiche (pur, testable sous Node).
//  - iOS (iPhone, iPad, y compris iPadOS qui se déclare « Macintosh ») → Apple Plans
//  - Android → lien geo: (ouvre l'appli de cartes choisie par l'utilisateur)
//  - ailleurs → OpenStreetMap, itinéraire piéton (départ laissé vide : position à saisir/détectée)

/** Le point est-il exploitable (coordonnées numériques plausibles) ? */
export function pointValide(point) {
  return !!point && Number.isFinite(point.lat) && Number.isFinite(point.lon)
    && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180;
}

/**
 * Détecte la plateforme.
 * @param {{userAgent?:string, maxTouchPoints?:number}} nav typiquement `navigator`
 * @returns {'ios'|'android'|'autre'}
 */
export function plateforme(nav = {}) {
  const ua = nav.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Macintosh/i.test(ua) && (nav.maxTouchPoints || 0) > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'autre';
}

/**
 * URL d'itinéraire à pied vers (lat, lon), ou null si le point est invalide.
 * @param {{lat:number, lon:number}} point
 * @param {'ios'|'android'|'autre'} pf
 */
export function lienItineraire(point, pf = 'autre') {
  if (!pointValide(point)) return null;
  const ll = `${point.lat},${point.lon}`;
  if (pf === 'ios') return `https://maps.apple.com/?daddr=${ll}&dirflg=w`;
  if (pf === 'android') return `geo:${ll}?q=${ll}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=;${ll}`;
}
