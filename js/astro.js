// Astronomie locale (pur, sans DOM, importable sous Node).
// - Phases de la lune : algorithme de Jean Meeus (Astronomical Algorithms, ch. 49),
//   termes correctifs principaux → instants de nouvelle/pleine lune à ~1 h près.
// - Coucher/lever du soleil : algorithme NOAA simplifié (précision ~1-2 min).
// - Fuseau Europe/Paris calculé à la main (heure d'été : dernier dimanche de mars
//   → dernier dimanche d'octobre, à 01:00 UTC), pour rester pur et déterministe.

export const TALENCE = { lat: 44.8065, lon: -0.588 };

const RAD = Math.PI / 180;
const SYNODIQUE = 29.530588861;
const JOUR_MS = 86400000;

// ---------- Dates ----------

/** "2026-11-02" → { y, m, d } */
export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Nombre de jours depuis l'époque Unix pour une date civile (sans fuseau). */
function jourCivil(iso) {
  const { y, m, d } = parseISO(iso);
  return Math.round(Date.UTC(y, m - 1, d) / JOUR_MS);
}

/** Ajoute n jours à une date ISO (calendrier civil). */
export function ajouterJours(iso, n) {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function dernierDimanche(y, mois) { // mois 1-12
  const fin = new Date(Date.UTC(y, mois, 0)); // dernier jour du mois
  return fin.getUTCDate() - fin.getUTCDay();
}

/** Décalage UTC de Europe/Paris (en heures) à un instant UTC (ms). */
export function decalageParis(ms) {
  const y = new Date(ms).getUTCFullYear();
  const debut = Date.UTC(y, 2, dernierDimanche(y, 3), 1);
  const fin = Date.UTC(y, 9, dernierDimanche(y, 10), 1);
  return ms >= debut && ms < fin ? 2 : 1;
}

/** Date civile ISO à Paris d'un instant UTC (ms). */
export function dateParis(ms) {
  return new Date(ms + decalageParis(ms) * 3600000).toISOString().slice(0, 10);
}

/** "17 h 32" à partir de minutes depuis minuit. */
export function formatHeure(minutes) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')}`;
}

// ---------- Lune (Meeus ch. 49) ----------

function jdVersMs(jd) { return (jd - 2440587.5) * JOUR_MS; }

/**
 * Instant (ms UTC) de la phase k : k entier = nouvelle lune, k+0.5 = pleine lune.
 */
export function instantPhase(k) {
  const T = k / 1236.85;
  let jde = 2451550.09766 + SYNODIQUE * k + 0.00015437 * T * T
    - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * RAD;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * RAD;
  const pleine = Math.abs(k - Math.floor(k) - 0.5) < 1e-6;
  const c = pleine
    ? [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209]
    : [-0.4072, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208];
  jde += c[0] * Math.sin(Mp) + c[1] * E * Math.sin(M) + c[2] * Math.sin(2 * Mp)
    + c[3] * Math.sin(2 * F) + c[4] * E * Math.sin(Mp - M) + c[5] * E * Math.sin(Mp + M)
    + c[6] * E * E * Math.sin(2 * M)
    - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F)
    + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp)
    - 0.00017 * Math.sin(Om);
  return jdVersMs(jde);
}

const PHASES = {
  nouvelle: { nom: 'Nouvelle lune', emoji: '🌑' },
  premier_croissant: { nom: 'Premier croissant', emoji: '🌒' },
  premier_quartier: { nom: 'Premier quartier', emoji: '🌓' },
  gibbeuse_croissante: { nom: 'Lune gibbeuse croissante', emoji: '🌔' },
  pleine: { nom: 'Pleine lune', emoji: '🌕' },
  gibbeuse_decroissante: { nom: 'Lune gibbeuse décroissante', emoji: '🌖' },
  dernier_quartier: { nom: 'Dernier quartier', emoji: '🌗' },
  dernier_croissant: { nom: 'Dernier croissant', emoji: '🌘' },
};

/**
 * Lune pour une date ISO (évaluée à 21 h, heure de Paris : c'est le soir qu'on la regarde).
 * @returns {{age:number, illumination:number, croissante:boolean, phase:string, nom:string,
 *   emoji:string, joursAvantPleine:number, pleineLune:string, nouvelleLune:string}}
 */
export function lune(iso) {
  const { y, m, d } = parseISO(iso);
  const tLocal = Date.UTC(y, m - 1, d, 21);
  const t = tLocal - decalageParis(tLocal) * 3600000;
  // k approximatif puis ajustement pour encadrer t.
  let k = Math.floor((t - instantPhase(0)) / (SYNODIQUE * JOUR_MS));
  while (instantPhase(k) > t) k--;
  while (instantPhase(k + 1) <= t) k++;
  const nl = instantPhase(k);
  const pl = instantPhase(k + 0.5);
  const nl2 = instantPhase(k + 1);
  const angle = t < pl
    ? Math.PI * (t - nl) / (pl - nl)
    : Math.PI + Math.PI * (t - pl) / (nl2 - pl);
  const illumination = (1 - Math.cos(angle)) / 2;
  const croissante = t < pl;
  const age = (t - nl) / JOUR_MS;

  // Écarts en jours civils (heure de Paris) avec les phases principales.
  const jour = jourCivil(iso);
  const ecart = (ms) => jourCivil(dateParis(ms)) - jour;
  const prochainePleine = t < pl ? pl : instantPhase(k + 1.5);
  const dernierePleine = t < pl ? instantPhase(k - 0.5) : pl;
  const ecartPleine = Math.min(Math.abs(ecart(prochainePleine)), Math.abs(ecart(dernierePleine)));
  const ecartNouvelle = Math.min(Math.abs(ecart(nl)), Math.abs(ecart(nl2)));
  const pq = (nl + pl) / 2;
  const dq = (pl + nl2) / 2;

  let phase;
  if (ecartNouvelle === 0) phase = 'nouvelle';
  else if (ecartPleine === 0) phase = 'pleine';
  else if (ecart(pq) === 0) phase = 'premier_quartier';
  else if (ecart(dq) === 0) phase = 'dernier_quartier';
  else if (t < pq) phase = 'premier_croissant';
  else if (t < pl) phase = 'gibbeuse_croissante';
  else if (t < dq) phase = 'gibbeuse_decroissante';
  else phase = 'dernier_croissant';

  return {
    age, illumination, croissante, phase,
    ...PHASES[phase],
    ecartPleine,
    joursAvantPleine: ecart(prochainePleine),
    pleineLune: dateParis(prochainePleine),
    nouvelleLune: dateParis(t - nl < nl2 - t ? nl : nl2),
  };
}

// ---------- Soleil (NOAA) ----------

/**
 * Lever et coucher du soleil (minutes depuis minuit, heure de Paris).
 * @returns {{lever:number, coucher:number}}
 */
export function soleil(iso, lat = TALENCE.lat, lon = TALENCE.lon) {
  const { y, m, d } = parseISO(iso);
  const midiUTC = Date.UTC(y, m - 1, d, 12);
  const jd = midiUTC / JOUR_MS + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
  const yv = Math.tan((eps / 2) * RAD) ** 2;
  const eqTemps = 4 / RAD * (yv * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD)
    + 4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
    - 0.5 * yv * yv * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl))
    - Math.tan(lat * RAD) * Math.tan(decl);
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / RAD;
  const midiSolaire = 720 - 4 * lon - eqTemps; // minutes UTC
  const off = decalageParis(midiUTC) * 60;
  return { lever: midiSolaire - 4 * H + off, coucher: midiSolaire + 4 * H + off };
}

// ---------- Conditions ----------

/** jours_longs / jours_courts à partir de l'heure du coucher (minutes). */
export function conditionsJour(coucherMinutes) {
  return {
    jours_longs: coucherMinutes > 20 * 60 + 30,
    jours_courts: coucherMinutes < 18 * 60 + 30,
  };
}

/** Conditions astronomiques du jour (toujours calculables, même hors ligne). */
export function conditionsAstro(iso) {
  const l = lune(iso);
  const s = soleil(iso);
  return {
    lune_visible_soir: (l.croissante && l.illumination >= 0.25) || l.ecartPleine <= 2,
    lune_visible_matin: !l.croissante && l.illumination >= 0.25,
    pleine_lune: l.ecartPleine <= 1,
    ...conditionsJour(s.coucher),
  };
}
