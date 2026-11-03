// Observations récentes des habitants via l'API iNaturalist (gratuite, sans clé, CORS ouvert).
// Spécification : docs/spec-observations-open-data.md, §2.
//
// Fonctions pures (testables sous Node) : `urlObservations`, `normaliser`, `rattacherLieu`,
// `apparier`, `texteQuand`, `normaliserLatin`.
// `chargerObservations` fait l'appel réseau (délai 8 s, rayon adaptatif 1,5 km → 3 km) et ne
// lève jamais : en cas d'échec, elle renvoie `{ disponible: false, observations: [] }`.
//
// Confidentialité : on n'utilise JAMAIS `place_guess` (texte libre de l'observateur, parfois
// une adresse) ni le pseudo de l'observateur, sauf dans le crédit d'une photo sous licence
// Creative Commons (exigé par la licence). Les observations aux coordonnées floues
// (précision > 500 m) n'ont pas de lieu affiché ; les observations obscurcies sont écartées.

import { TALENCE, ajouterJours } from './astro.js';

const API = 'https://api.inaturalist.org/v1/observations';
export const TIMEOUT_MS = 8000;
export const RAYON_PROCHE = 1.5;
export const RAYON_LARGE = 3;
/** En dessous de ce nombre d'observations (après filtrage) à 1,5 km, on élargit à 3 km. */
export const MIN_OBSERVATIONS = 5;
export const JOURS_FENETRE = 14;
/** Au-delà (en mètres), les coordonnées sont trop floues pour afficher un lieu. */
export const PRECISION_MAX = 500;
/** Distance maximale (m) pour rattacher une observation à un lieu connu. */
export const DISTANCE_LIEU = 250;

const RANGS_ESPECE = new Set(['species', 'subspecies', 'variety', 'hybrid']);
const RANGS_GARDES = new Set([...RANGS_ESPECE, 'genus']);

// ---------- Requête ----------

/** URL de l'API pour les 14 jours se terminant à `dateISO` (incluse), dans `rayon` km. */
export function urlObservations(dateISO, rayon = RAYON_PROCHE) {
  const p = new URLSearchParams({
    lat: String(TALENCE.lat),
    lng: String(TALENCE.lon),
    radius: String(rayon),
    d1: ajouterJours(dateISO, -(JOURS_FENETRE - 1)),
    d2: dateISO,
    quality_grade: 'research,needs_id',
    photos: 'true',
    captive: 'false',
    hrank: 'genus',
    per_page: '100',
    order_by: 'observed_on',
    order: 'desc',
    locale: 'fr',
    preferred_place_id: '6753', // France : noms communs français
  });
  return `${API}?${p}`;
}

// ---------- Normalisation ----------

const texte = (v) => (typeof v === 'string' ? v.trim() : '');

/** Nombre de jours entre deux dates ISO (b − a). */
function ecartJours(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** « cc-by-nc » → « CC BY-NC » ; « cc0 » → « CC0 ». */
export function libelleLicence(code) {
  const c = texte(code).toLowerCase();
  if (c === 'cc0') return 'CC0';
  return `CC ${c.replace(/^cc-?/, '').toUpperCase()}`;
}

/**
 * Crédit court d'une photo : « (c) pseudo, some rights reserved (CC BY-NC) » → « pseudo — CC BY-NC ».
 * Seul le pseudo (ou nom) cité par l'attribution est conservé, tronqué à 40 caractères.
 */
export function creditPhoto(attribution, code) {
  const licence = libelleLicence(code);
  let auteur = texte(attribution)
    .replace(/^\(c\)\s*/i, '')
    .replace(/^©\s*/, '')
    .split(',')[0]
    .replace(/\s*(some|no|all) rights reserved.*$/i, '')
    .replace(/\s*\(CC[^)]*\)\s*$/i, '')
    .trim();
  if (auteur.length > 40) auteur = `${auteur.slice(0, 39)}…`;
  return auteur ? `${auteur} — ${licence}` : licence;
}

/** Première photo sous licence Creative Commons de l'observation, en taille « small », ou null. */
function photoLibre(photos) {
  for (const ph of Array.isArray(photos) ? photos : []) {
    const code = texte(ph?.license_code).toLowerCase();
    const url = texte(ph?.url);
    if (!code.startsWith('cc') || !/^https:\/\//.test(url)) continue;
    return {
      url: url.replace(/\/(square|thumb|medium|large|original)\.(jpe?g|png)(\?.*)?$/i, '/small.$2'),
      credit: creditPhoto(ph.attribution, code),
      licence: libelleLicence(code),
    };
  }
  return null;
}

/** Distance (m) entre deux points (haversine). */
export function distanceM(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Filtre et normalise une réponse de l'API (voir spec §2.3).
 * @param {object} reponse JSON de l'API
 * @param {string} [dateRef] date du jour « AAAA-MM-JJ » (pour `jours` ; défaut : date la plus récente)
 * @returns {object[]} observations dédoublonnées par taxon, de la plus récente à la plus ancienne
 */
export function normaliser(reponse, dateRef = null) {
  const brutes = Array.isArray(reponse?.results) ? reponse.results : [];
  const liste = [];
  for (const o of brutes) {
    if (!o || typeof o !== 'object' || o.obscured === true) continue;
    const coords = o.geojson?.coordinates;
    if (!Array.isArray(coords) || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) continue;
    const t = o.taxon;
    const latin = texte(t?.name);
    if (!t || !RANGS_GARDES.has(t.rank) || !latin || !Number.isFinite(t.id)) continue;
    if (!Array.isArray(o.photos) || o.photos.length === 0) continue;
    const date = texte(o.observed_on);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const uri = texte(o.uri);
    const [lon, lat] = coords;
    liste.push({
      id: o.id,
      uri: /^https:\/\/(www\.)?inaturalist\.org\//.test(uri) ? uri : `https://www.inaturalist.org/observations/${Number(o.id) || ''}`,
      date,
      jours: null,
      grade: o.quality_grade === 'research' ? 'confirmee' : 'en_cours',
      nomCommun: texte(t.preferred_common_name) || null,
      latin,
      rang: t.rank,
      genre: latin.split(/\s+/)[0],
      taxonId: t.id,
      groupe: texte(t.iconic_taxon_name) || null,
      lat,
      lon,
      precision: Number.isFinite(o.positional_accuracy) ? o.positional_accuracy : null,
      distance: Math.round(distanceM(TALENCE.lat, TALENCE.lon, lat, lon)),
      photo: photoLibre(o.photos),
    });
  }
  const ref = dateRef || liste.reduce((m, o) => (o.date > m ? o.date : m), '');
  for (const o of liste) o.jours = Math.max(0, ecartJours(o.date, ref));
  // Plus récente d'abord ; à égalité, la plus proche du Forum.
  liste.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.distance - b.distance));
  const vus = new Set();
  return liste.filter((o) => {
    if (vus.has(o.taxonId)) return false;
    vus.add(o.taxonId);
    return true;
  });
}

// ---------- Lieu ----------

const DIRECTIONS = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest'];

/** Direction (8 points) de B vu depuis A. */
export function direction(latA, lonA, latB, lonB) {
  const dy = latB - latA;
  const dx = (lonB - lonA) * Math.cos(((latA + latB) / 2) * Math.PI / 180);
  const cap = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360; // 0 = nord, 90 = est
  return DIRECTIONS[Math.round(cap / 45) % 8];
}

/** 640 → « 600 m » ; 2 380 → « 2,4 km ». */
export function texteDistance(m) {
  const arrondi = Math.round(m / 100) * 100;
  if (arrondi < 1000) return `${arrondi} m`;
  return `${String(arrondi / 1000).replace('.', ',')} km`;
}

const MASCULINS = new Set(['parc', 'bois', 'square', 'campus', 'cimetière', 'jardin', 'domaine', 'château', 'stade', 'chemin', 'cours', 'boulevard', 'quartier', 'verger', 'étang', 'ruisseau', 'bassin']);
const FEMININS = new Set(['butte', 'place', 'rue', 'allée', 'avenue', 'prairie', 'coulée', 'friche', 'mare', 'promenade']);

/**
 * « vers le parc Peixotto » : champ `vers` du lieu s'il existe, sinon repli simple à partir du
 * nom (sans parenthèse ni complément « et … » / « : … »), article choisi selon le premier mot.
 */
export function texteVers(lieu) {
  if (texte(lieu?.vers)) return texte(lieu.vers);
  let nom = texte(lieu?.nom).replace(/\s*\([^)]*\)/g, '').split(/\s+et\s+|\s*:\s*/)[0].trim();
  if (!nom) return null;
  const premier = nom.split(/\s+/)[0].toLowerCase();
  nom = nom.charAt(0).toLowerCase() + nom.slice(1);
  if (/^[aeiouyéèêàâîôûh]/i.test(premier) && (MASCULINS.has(premier) || FEMININS.has(premier))) return `vers l'${nom}`;
  if (MASCULINS.has(premier)) return `vers le ${nom}`;
  if (FEMININS.has(premier)) return `vers la ${nom}`;
  return `vers ${lieu.nom.trim()}`;
}

/**
 * Texte de lieu d'une observation (spec §2.4) : lieu connu le plus proche (< 250 m), sinon
 * distance et direction depuis le Forum ; null si la précision dépasse 500 m.
 * @param {{lat:number, lon:number, precision:number|null}} obs
 * @param {object[]|Map} lieux contenu de data/lieux.json (tableau ou Map id → lieu)
 */
export function rattacherLieu(obs, lieux) {
  if (!obs || !Number.isFinite(obs.lat) || !Number.isFinite(obs.lon)) return null;
  if (Number.isFinite(obs.precision) && obs.precision > PRECISION_MAX) return null;
  const tous = lieux instanceof Map ? [...lieux.values()] : Array.isArray(lieux) ? lieux : [];
  let meilleur = null;
  let dMin = Infinity;
  for (const l of tous) {
    if (!l || !Number.isFinite(l.lat) || !Number.isFinite(l.lon)) continue;
    const d = distanceM(obs.lat, obs.lon, l.lat, l.lon);
    if (d < dMin) { dMin = d; meilleur = l; }
  }
  if (meilleur && dMin < DISTANCE_LIEU) {
    const t = texteVers(meilleur);
    if (t) return t;
  }
  const d = distanceM(TALENCE.lat, TALENCE.lon, obs.lat, obs.lon);
  if (d < 50) return 'tout près du Forum des Halles';
  return `à ${texteDistance(d)} vers le ${direction(TALENCE.lat, TALENCE.lon, obs.lat, obs.lon)}`
    .replace('vers le est', 'vers l\'est').replace('vers le ouest', 'vers l\'ouest');
}

/** 0 → « aujourd'hui », 1 → « hier », n → « il y a n jours ». */
export function texteQuand(jours) {
  if (!Number.isFinite(jours) || jours <= 0) return 'aujourd\'hui';
  if (jours === 1) return 'hier';
  return `il y a ${jours} jours`;
}

// ---------- Appariement ----------

const MOTS_VIDES = new Set(['sp', 'spp', 'cf', 'aff', 'x', '×', 'agg', 'gr', 'groupe']);

/**
 * Normalise un nom latin : { binome: "genre espèce" | null, genre } ou null.
 * Minuscules, parenthèses et cultivars retirés, « sp. », « spp. », « cf. », « × » ignorés,
 * deux premiers mots seulement (les auteurs sont donc ignorés).
 */
export function normaliserLatin(nom) {
  const mots = texte(nom).toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/['‘’"][^'‘’"]*['‘’"]/g, ' ')
    .split(/\s+/)
    .map((m) => m.replace(/\.$/, ''))
    .filter((m) => m && !MOTS_VIDES.has(m));
  if (!mots.length || !/^[a-zà-ÿ-]+$/.test(mots[0])) return null;
  const genre = mots[0];
  const espece = mots[1] && /^[a-zà-ÿ-]+$/.test(mots[1]) ? mots[1] : null;
  return { genre, binome: espece ? `${genre} ${espece}` : null };
}

/** Taxons d'une fiche : `adulte.taxons` s'il existe (prioritaire), sinon `adulte.latin` (« A ; B », « A et B »). */
export function taxonsFiche(fiche) {
  const ad = fiche?.adulte;
  if (!ad) return [];
  const sources = Array.isArray(ad.taxons) && ad.taxons.length
    ? ad.taxons
    : texte(ad.latin).split(/\s*;\s*|\s+et\s+|\s*,\s*/);
  return sources.map(normaliserLatin).filter(Boolean);
}

/** L'observation correspond-elle à l'un de ces taxons de fiche ? (spec §2.5) */
function correspond(obs, taxons) {
  const n = normaliserLatin(obs.latin);
  if (!n) return false;
  const especeObs = RANGS_ESPECE.has(obs.rang);
  return taxons.some((t) => {
    if (!t.binome) return t.genre === n.genre; // fiche au genre : toute observation de ce genre
    return especeObs && n.binome === t.binome; // fiche d'espèce : même binôme, observation à l'espèce
  });
}

/**
 * Apparie les observations aux fiches.
 * @param {object[]} observations sorties de `normaliser` (avec `lieuTexte` éventuel)
 * @param {object[]} fiches
 * @returns {Map<string, {jours, lieuTexte, uri, grade, observationId, nomCommun, latin}>}
 *   pour chaque fiche, l'observation la plus récente (à égalité, la plus proche du Forum)
 */
export function apparier(observations, fiches) {
  const res = new Map();
  const obs = Array.isArray(observations) ? observations : [];
  for (const f of Array.isArray(fiches) ? fiches : []) {
    if (!f?.id) continue;
    const taxons = taxonsFiche(f);
    if (!taxons.length) continue;
    let meilleure = null;
    for (const o of obs) {
      if (!o || !correspond(o, taxons)) continue;
      if (!meilleure || o.jours < meilleure.jours
        || (o.jours === meilleure.jours && (o.distance ?? Infinity) < (meilleure.distance ?? Infinity))) meilleure = o;
    }
    if (meilleure) {
      res.set(f.id, {
        jours: meilleure.jours,
        lieuTexte: meilleure.lieuTexte ?? null,
        uri: meilleure.uri,
        grade: meilleure.grade,
        observationId: meilleure.id,
        nomCommun: meilleure.nomCommun,
        latin: meilleure.latin,
      });
    }
  }
  return res;
}

// ---------- Réseau ----------

/**
 * Charge les observations (rayon adaptatif). Ne lève jamais.
 * Délai global de 8 s pour les deux requêtes éventuelles. Si la seconde requête (3 km) échoue,
 * on garde le résultat à 1,5 km.
 * @param {string} dateISO
 * @param {object} [options] { fetchFn, lieux, timeoutMs }
 * @returns {Promise<{disponible:boolean, rayon:number|null, elargi:boolean, observations:object[], erreur?:string}>}
 */
export async function chargerObservations(dateISO, { fetchFn = globalThis.fetch, lieux = [], timeoutMs = TIMEOUT_MS } = {}) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timer;
  const delai = new Promise((_, rejeter) => {
    timer = setTimeout(() => {
      ctrl?.abort();
      rejeter(Object.assign(new Error('délai dépassé'), { name: 'AbortError' }));
    }, timeoutMs);
  });
  const lire = async (rayon) => {
    const travail = (async () => {
      const rep = await fetchFn(urlObservations(dateISO, rayon), { signal: ctrl?.signal, headers: { Accept: 'application/json' } });
      if (!rep?.ok) throw new Error(`HTTP ${rep?.status}`);
      const data = await rep.json();
      if (!data || !Array.isArray(data.results)) throw new Error('réponse invalide');
      const obs = normaliser(data, dateISO).filter((o) => o.jours < JOURS_FENETRE);
      for (const o of obs) o.lieuTexte = rattacherLieu(o, lieux);
      return obs;
    })();
    return Promise.race([travail, delai]);
  };
  try {
    let observations = await lire(RAYON_PROCHE);
    let rayon = RAYON_PROCHE;
    if (observations.length < MIN_OBSERVATIONS) {
      try {
        const larges = await lire(RAYON_LARGE);
        if (larges.length >= observations.length) {
          observations = larges;
          rayon = RAYON_LARGE;
        }
      } catch (e) {
        if (e?.name === 'AbortError' && !observations.length) throw e;
        /* on garde le résultat à 1,5 km */
      }
    }
    return { disponible: true, rayon, elargi: rayon === RAYON_LARGE, observations };
  } catch (e) {
    return {
      disponible: false, rayon: null, elargi: false, observations: [],
      erreur: e?.name === 'AbortError' ? 'délai dépassé' : String(e?.message || e),
    };
  } finally {
    clearTimeout(timer);
  }
}
