// Moteur de choix des idées du jour. Pur : pas de DOM, pas de réseau, pas d'horloge.
// Importable sous Node (tests) comme dans le navigateur.
//
// Règles :
//  1. Éligibilité : mois courant ∈ fiche.mois (ou date dans fiche.dates si présent), toutes les conditions de `requiert` vraies,
//     aucune de `exclut` vraie.
//     Fiche datée : seule une plage EN COURS de ≤ 7 jours (JOURS_PONCTUEL) est un « événement
//     ponctuel » : poids ×BONUS_DATEE, exemptée d'anti-répétition, et TOUJOURS retenue le jour J
//     (avant la diversité des catégories ; au-delà de n le même jour, plages les plus courtes
//     d'abord). Une plage plus longue (ex. Saturne visible 4 mois) n'est qu'une restriction de
//     saison : poids normal, anti-répétition normale.
//  2. Tirage pondéré : poids = fiche.poids (1-3) × « spécificité du jour » (produit des
//     raretés des conditions requises, vraies aujourd'hui : pleine lune, pluie récente…
//     c'est le moment ou jamais).
//  3. Trois catégories différentes si possible.
//  4. Déterministe : la graine est la date (recharger la page donne la même chose).
//  5. Anti-répétition sur 7 jours (voir `idsRecents`) : les fiches récentes ne sont reprises
//     que si le reste ne suffit pas — sauf les fiches « du jour » (condition rare vraie),
//     seulement pénalisées.
//  6. Pénurie : si moins de 3 fiches éligibles, on complète avec des fiches du mois sans
//     condition météo (on ignore alors leur `exclut`).

/** Conditions qui dépendent de la météo (absentes/fausses en mode dégradé). */
export const CONDITIONS_METEO = [
  'pluie_recente', 'pluie_aujourdhui', 'sec', 'vent', 'gel',
  'froid', 'chaud', 'soleil', 'couvert', 'brouillard',
];

/**
 * Rareté d'une condition (multiplicateur de poids quand une fiche la REQUIERT et qu'elle
 * est vraie). 1 = banal. Une fiche qui exige la pleine lune passe devant les autres le
 * jour J, car elle ne sera plus valable dans deux jours.
 */
export const RARETE = {
  pleine_lune: 4,
  brouillard: 3,
  gel: 3,
  pluie_recente: 2.5,
  vent: 2,
  chaud: 1.5,
  pluie_aujourdhui: 1.5,
  lune_visible_soir: 1.5,
  lune_visible_matin: 1.5,
  froid: 1.2,
  sec: 1,
  soleil: 1,
  couvert: 1,
  jours_longs: 1,
  jours_courts: 1,
};

export const JOURS_ANTI_REPETITION = 7;

// ---------- Utilitaires ----------

function moisDe(dateISO) { return Number(dateISO.slice(5, 7)); }

function ajouterJours(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Hachage FNV-1a 32 bits d'une chaîne → graine. */
export function hacher(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function generateur(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vrai = (conditions, cle) => conditions?.[cle] === true;

// ---------- Éligibilité et poids ----------

/** Multiplicateur de poids d'une fiche datée (`dates`) pendant sa plage. */
export const BONUS_DATEE = 6;

/** Durée maximale (jours, bornes incluses) d'une plage pour compter comme événement ponctuel. */
export const JOURS_PONCTUEL = 7;

/** La fiche a-t-elle des plages de dates (`dates`: [["AAAA-MM-JJ","AAAA-MM-JJ"], …]) ? */
export function estDatee(fiche) {
  return Array.isArray(fiche?.dates) && fiche.dates.length > 0;
}

/**
 * Saison : si la fiche est datée, la date doit tomber dans une de ses plages (bornes incluses,
 * `mois` est alors ignoré) ; sinon le mois doit figurer dans `mois`.
 */
export function estDeSaison(fiche, dateISO) {
  if (estDatee(fiche)) {
    return fiche.dates.some((p) => Array.isArray(p) && typeof p[0] === 'string'
      && p[0] <= dateISO && dateISO <= (typeof p[1] === 'string' ? p[1] : p[0]));
  }
  return Array.isArray(fiche?.mois) && fiche.mois.includes(moisDe(dateISO));
}

/**
 * Durée (en jours, bornes incluses) de la plage de `dates` qui contient `dateISO` (la plus
 * courte si plusieurs), ou null si fiche non datée / hors plage.
 */
export function dureePlageEnCours(fiche, dateISO) {
  if (!estDatee(fiche)) return null;
  let min = null;
  for (const p of fiche.dates) {
    if (!Array.isArray(p) || typeof p[0] !== 'string') continue;
    const fin = typeof p[1] === 'string' ? p[1] : p[0];
    if (!(p[0] <= dateISO && dateISO <= fin)) continue;
    const d = Math.round((Date.parse(fin) - Date.parse(p[0])) / 86400000) + 1;
    if (min === null || d < min) min = d;
  }
  return min;
}

/** Événement ponctuel : fiche datée dont la plage en cours dure ≤ JOURS_PONCTUEL jours. */
export function estPonctuel(fiche, dateISO) {
  const d = dureePlageEnCours(fiche, dateISO);
  return d !== null && d <= JOURS_PONCTUEL;
}

/** La fiche est-elle valable ce jour (saison/dates + requiert + exclut) ? */
export function estEligible(fiche, conditions, dateISO) {
  if (!fiche || !estDeSaison(fiche, dateISO)) return false;
  if ((fiche.requiert || []).some((c) => !vrai(conditions, c))) return false;
  if ((fiche.exclut || []).some((c) => vrai(conditions, c))) return false;
  return true;
}

/**
 * Fiche de complément (pénurie) : du mois, sans condition météo requise, et dont les
 * conditions non météo (astro) requises sont vraies. Son `exclut` est ignoré.
 */
export function estComplement(fiche, conditions, dateISO) {
  if (!fiche || !estDeSaison(fiche, dateISO)) return false;
  const req = fiche.requiert || [];
  if (req.some((c) => CONDITIONS_METEO.includes(c))) return false;
  return req.every((c) => vrai(conditions, c));
}

/** Poids de tirage du jour = poids × spécificité (raretés des conditions requises). */
export function poidsDuJour(fiche, conditions, dateISO) {
  const base = Number.isFinite(fiche.poids) && fiche.poids > 0 ? fiche.poids : 1;
  let specificite = 1;
  for (const c of fiche.requiert || []) {
    if (vrai(conditions, c)) specificite *= RARETE[c] ?? 1;
  }
  return base * specificite * (estPonctuel(fiche, dateISO) ? BONUS_DATEE : 1);
}

/**
 * Une fiche est « du jour » si elle est un événement ponctuel en cours (plage ≤ 7 jours) ou si elle requiert une condition rare (rareté ≥ 2) vraie aujourd'hui.
 */
export function estDuJour(fiche, conditions, dateISO) {
  return estPonctuel(fiche, dateISO)
    || (fiche.requiert || []).some((c) => vrai(conditions, c) && (RARETE[c] ?? 1) >= 2);
}

/** Pénalité de poids d'une fiche « du jour » déjà vue récemment (au lieu de l'écarter). */
export const PENALITE_RECENTE = 4;

function tirerPondere(liste, conditions, rng, recents, dateISO) {
  // Événement ponctuel : jamais pénalisée pendant sa plage (événement ponctuel, à ne pas rater).
  const poids = liste.map((f) => poidsDuJour(f, conditions, dateISO)
    / (recents?.has(f.id) && !estPonctuel(f, dateISO) ? PENALITE_RECENTE : 1));
  const total = poids.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < liste.length; i++) {
    r -= poids[i];
    if (r < 0) return liste[i];
  }
  return liste[liste.length - 1];
}

/**
 * Paliers de candidats, du meilleur au pis-aller :
 *  éligibles non récentes → éligibles récentes → complément non récent → complément récent.
 * Exception « moment ou jamais » : une fiche du jour (pleine lune, brouillard, pluie récente…)
 * déjà vue récemment reste dans le premier palier, avec un poids divisé par PENALITE_RECENTE
 * (événement ponctuel : aucune pénalité pendant sa plage).
 * Sinon, le recalcul de la veille (où la pleine lune était déjà à ±1 jour) l'écarterait
 * précisément le jour où elle est la plus pertinente.
 */
function paliers(fiches, conditions, dateISO, recents, dejaPris) {
  const libres = fiches.filter((f) => f && f.id && !dejaPris.has(f.id));
  const elig = libres.filter((f) => estEligible(f, conditions, dateISO));
  const eligIds = new Set(elig.map((f) => f.id));
  const compl = libres.filter((f) => !eligIds.has(f.id) && estComplement(f, conditions, dateISO));
  const premier = (f) => !recents.has(f.id) || estDuJour(f, conditions, dateISO);
  return [
    elig.filter(premier),
    elig.filter((f) => !premier(f)),
    compl.filter((f) => !recents.has(f.id)),
    compl.filter((f) => recents.has(f.id)),
  ];
}

/**
 * Tire une fiche : premier palier non vide ; à l'intérieur, on préfère d'abord
 * `categoriePreferee`, puis une catégorie hors `categoriesEvitees`, puis n'importe laquelle.
 */
function tirerUne(tiers, conditions, rng, { categoriesEvitees = new Set(), categoriePreferee = null, recents = null, dateISO } = {}) {
  for (const palier of tiers) {
    if (!palier.length) continue;
    const pref = categoriePreferee ? palier.filter((f) => f.categorie === categoriePreferee) : [];
    const nouvelles = palier.filter((f) => !categoriesEvitees.has(f.categorie));
    const liste = pref.length ? pref : nouvelles.length ? nouvelles : palier;
    return tirerPondere(liste, conditions, rng, recents, dateISO);
  }
  return null;
}

/** Tirage de base (sans anti-répétition si `recents` est vide). */
function tirerJour(fiches, conditions, dateISO, recents, n) {
  const rng = generateur(hacher(`nature-talence|${dateISO}`));
  const choisies = [];
  const pris = new Set();
  const cats = new Set();
  // Événements ponctuels en cours : toujours retenus d'abord (plages les plus courtes en premier).
  const ponctuels = fiches
    .filter((f) => f && f.id && estPonctuel(f, dateISO) && estEligible(f, conditions, dateISO))
    .sort((a, b) => dureePlageEnCours(a, dateISO) - dureePlageEnCours(b, dateISO)
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, n);
  for (const f of ponctuels) {
    choisies.push(f);
    pris.add(f.id);
    cats.add(f.categorie);
  }
  for (let i = choisies.length; i < n; i++) {
    const f = tirerUne(paliers(fiches, conditions, dateISO, recents, pris), conditions, rng, {
      categoriesEvitees: cats,
      recents,
      dateISO,
    });
    if (!f) break;
    choisies.push(f);
    pris.add(f.id);
    cats.add(f.categorie);
  }
  return choisies;
}

// ---------- Anti-répétition ----------

/**
 * Identifiants à éviter aujourd'hui = union de deux sources :
 *  a) RECALCUL sans état : pour chacun des 7 jours précédents, on refait le tirage de ce
 *     jour-là en mode « sans météo » (conditions astro seules via `conditionsPour`, sans
 *     anti-répétition pour éviter la récursion). Marche partout (navigation privée,
 *     localStorage bloqué, nouvel appareil), identique pour tous les visiteurs.
 *  b) HISTORIQUE réel (facultatif) : { "AAAA-MM-JJ": [ids affichés] } tenu en localStorage
 *     par l'interface ; il capte ce que le recalcul ne peut pas deviner (fiches choisies
 *     grâce à la météo de ce jour-là, clics sur « Une autre idée »).
 * Le jour même n'est jamais pris en compte → le résultat du jour reste stable au rechargement.
 */
export function idsRecents(fiches, dateISO, options = {}) {
  const {
    historique = null,
    conditionsPour = null,
    jours = JOURS_ANTI_REPETITION,
    recalculer = true,
    n = 3,
  } = options;
  const recents = new Set();
  for (let k = 1; k <= jours; k++) {
    const jour = ajouterJours(dateISO, -k);
    if (recalculer) {
      const cond = conditionsPour ? conditionsPour(jour) : {};
      for (const f of tirerJour(fiches, cond, jour, new Set(), n)) recents.add(f.id);
    }
    const vus = historique?.[jour];
    if (Array.isArray(vus)) vus.forEach((id) => recents.add(id));
  }
  return recents;
}

// ---------- API publique ----------

/**
 * Choisit les idées du jour.
 * @param {object[]} fiches toutes les fiches
 * @param {object} conditions { pluie_recente: bool, …, pleine_lune: bool, … }
 * @param {string} dateISO "AAAA-MM-JJ"
 * @param {object} [options] { n=3, historique, conditionsPour, jours=7, recalculer=true }
 * @returns {object[]} jusqu'à n fiches (moins seulement si vraiment rien d'autre n'est possible)
 */
export function choisir(fiches, conditions, dateISO, options = {}) {
  const n = options.n ?? 3;
  const recents = idsRecents(fiches, dateISO, { ...options, n });
  return tirerJour(fiches, conditions, dateISO, recents, n);
}

/**
 * Propose une autre idée pour remplacer une carte.
 * @param {string[]} dejaAffichees ids déjà montrés aujourd'hui (jamais reproposés)
 * @param {string} [categorie] catégorie préférée (celle de la carte remplacée)
 * @param {object} [options] mêmes options que `choisir` + `categoriesEvitees` (catégories
 *   des autres cartes, évitées si la catégorie préférée est épuisée)
 * @returns {object|null}
 */
export function autre(fiches, conditions, dateISO, dejaAffichees = [], categorie = null, options = {}) {
  const recents = idsRecents(fiches, dateISO, options);
  const deja = new Set(dejaAffichees);
  const rng = generateur(hacher(`autre|${dateISO}|${[...deja].join(',')}`));
  return tirerUne(paliers(fiches, conditions, dateISO, recents, deja), conditions, rng, {
    categoriePreferee: categorie,
    categoriesEvitees: new Set(options.categoriesEvitees || []),
    recents,
    dateISO,
  });
}
