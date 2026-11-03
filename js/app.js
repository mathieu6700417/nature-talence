// Interface : charge les données, la météo, choisit 3 idées et les affiche.
//
// Paramètres d'URL (débogage / tests) :
//   ?date=2026-04-12              simule une autre date (lune, soleil, saison, tirage).
//                                 La météo est demandée pour ce jour ; hors de la fenêtre
//                                 d'Open-Meteo (≈ 3 mois passés / 2 semaines à venir) → mode dégradé.
//   ?meteo=pluie_recente,vent     force des conditions météo (aucun appel réseau) : les clés
//                                 listées sont vraies, les autres conditions météo fausses.
//                                 Les conditions astro (lune, jours courts…) peuvent aussi être forcées.
//   ?meteo=aucune                 météo « neutre » : aucune condition météo vraie.
//   ?meteo=hs                     simule une panne de l'API (mode dégradé).
//   ?inat=aucune                  pas d'appel à iNaturalist (ni badge ni bloc « Vu ces 14 derniers jours »).
//   ?inat=hs                      simule une panne d'iNaturalist (même effet, avec un console.warn).
//                                 Avec ?date ou ?meteo, l'appel iNaturalist a quand même lieu
//                                 (la fenêtre de 14 jours glisse avec la date simulée).
// Avec ?date ou ?meteo, l'historique local (anti-répétition) n'est pas modifié.
//
// Observations iNaturalist et asynchronisme : la requête part en parallèle de la météo. Une fois
// les données et la météo prêtes, on attend au plus GRACE_OBSERVATIONS_MS de plus : si les
// observations sont là (cas courant, ou cache de 6 h), elles favorisent le tirage. Sinon les
// cartes s'affichent tout de suite sans elles et, à l'arrivée des observations, on ajoute
// seulement les badges et le bloc, sans retirer les cartes : rien ne bouge sous les yeux du parent.

import { lune, soleil, conditionsAstro, conditionsJour, formatHeure, dateParis } from './astro.js';
import { chargerMeteo, CLES_METEO } from './meteo.js';
import { choisir, autre } from './selection.js';
import { chargerObservations, apparier, texteQuand } from './observations.js';
import { lienItineraire, plateforme, pointValide } from './itineraire.js';

const FICHIERS = ['animaux', 'plantes', 'ciel', 'sensoriel', 'insolite'];
const CLE_AGE = 'nature-talence.age';
const CLE_HISTORIQUE = 'nature-talence.historique';
const CLE_OBSERVATIONS = 'nature-talence.observations';
const DUREE_CACHE_OBSERVATIONS_MS = 6 * 3600 * 1000;
const GRACE_OBSERVATIONS_MS = 1200;
const MAX_LIGNES_OBSERVATIONS = 8;

/** Pictogramme d'un grand groupe iNaturalist (`iconic_taxon_name`). */
const PICTOS_GROUPES = {
  Aves: '🐦', Mammalia: '🦊', Reptilia: '🦎', Amphibia: '🐸', Actinopterygii: '🐟',
  Insecta: '🐞', Arachnida: '🕷️', Mollusca: '🐌', Animalia: '🐾', Plantae: '🌿', Fungi: '🍄',
};
const AGES = ['2-3', '3-5'];

const CATEGORIES = {
  animal: { nom: 'Animal', icone: '🐌' },
  plante: { nom: 'Plante', icone: '🌿' },
  ciel: { nom: 'Ciel', icone: '☁️' },
  sensoriel: { nom: 'Sens', icone: '👂' },
  insolite: { nom: 'Insolite', icone: '🔍' },
};

const $ = (id) => document.getElementById(id);

// ---------- Stockage local (toujours protégé : navigation privée, stockage bloqué…) ----------

function lireStockage(cle, defaut) {
  try {
    const v = localStorage.getItem(cle);
    return v == null ? defaut : JSON.parse(v);
  } catch {
    return defaut;
  }
}

function ecrireStockage(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* tant pis : le site fonctionne sans */
  }
}

// ---------- Paramètres ----------

function lireParametres() {
  const p = new URLSearchParams(location.search);
  const aujourdhui = dateParis(Date.now());
  let date = aujourdhui;
  const d = p.get('date');
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d))) date = d;
  const meteo = p.has('meteo') ? p.get('meteo').split(',').map((s) => s.trim()).filter(Boolean) : null;
  const inat = (p.get('inat') || '').trim().toLowerCase() || null;
  return { date, simulee: date !== aujourdhui, meteoForcee: meteo, aujourdhui, inat };
}

/** Heure actuelle à Paris (0-23), ou 9 h pour une date simulée. */
function heureReference(simulee) {
  if (simulee) return 9;
  try {
    return Number(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Paris' }).format(new Date()));
  } catch {
    return new Date().getHours();
  }
}

// ---------- Données ----------

async function lireTableau(url) {
  try {
    const rep = await fetch(url, { cache: 'no-cache' });
    if (!rep.ok) return [];
    const texte = (await rep.text()).trim();
    if (!texte) return [];
    const v = JSON.parse(texte);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function chargerDonnees() {
  const [lieux, ...listes] = await Promise.all([
    lireTableau('data/lieux.json'),
    ...FICHIERS.map((f) => lireTableau(`data/fiches-${f}.json`)),
  ]);
  const vus = new Set();
  const fiches = listes.flat().filter((f) => {
    const ok = f && typeof f.id === 'string' && f.titre && CATEGORIES[f.categorie]
      && (Array.isArray(f.mois) || Array.isArray(f.dates)) && !vus.has(f.id);
    if (ok) vus.add(f.id);
    return ok;
  });
  return { fiches, lieux: new Map(lieux.filter((l) => l?.id).map((l) => [l.id, l])) };
}

async function obtenirMeteo(params) {
  const { meteoForcee, date, simulee } = params;
  if (meteoForcee) {
    if (meteoForcee.includes('hs')) return { disponible: false, erreur: 'panne simulée' };
    const forcees = Object.fromEntries(meteoForcee.filter((k) => k !== 'aucune').map((k) => [k, true]));
    return { disponible: true, forcee: true, conditions: { ...Object.fromEntries(CLES_METEO.map((k) => [k, false])), ...forcees }, affichage: null };
  }
  return chargerMeteo(date, heureReference(simulee));
}

// ---------- Observations iNaturalist (cache 6 h) ----------

function lireCacheObservations(date) {
  const c = lireStockage(CLE_OBSERVATIONS, null);
  if (!c || typeof c !== 'object' || typeof c.cle !== 'string' || !Array.isArray(c.observations)) return null;
  const [d, rayon] = c.cle.split('|');
  const age = Date.now() - Number(c.horodatage);
  if (d !== date || !(age >= 0 && age < DUREE_CACHE_OBSERVATIONS_MS)) return null;
  const r = Number(rayon);
  return { disponible: true, rayon: r, elargi: r > 1.5, observations: c.observations, cache: true };
}

/** Observations du jour (cache, réseau ou désactivées). Ne rejette jamais. */
async function obtenirObservations(params, donneesP) {
  try {
    if (params.inat === 'aucune') return { disponible: false, observations: [] };
    if (params.inat === 'hs') {
      console.warn('iNaturalist : panne simulée (?inat=hs)');
      return { disponible: false, observations: [] };
    }
    const enCache = lireCacheObservations(params.date);
    if (enCache) return enCache;
    const { lieux } = await donneesP;
    const r = await chargerObservations(params.date, { lieux });
    if (r.disponible) {
      ecrireStockage(CLE_OBSERVATIONS, { cle: `${params.date}|${r.rayon}`, horodatage: Date.now(), observations: r.observations });
    } else {
      console.warn(`iNaturalist indisponible : ${r.erreur}`);
    }
    return r;
  } catch (e) {
    console.warn('iNaturalist :', e);
    return { disponible: false, observations: [] };
  }
}

const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
const lienInat = (uri) => (typeof uri === 'string' && uri.startsWith('https://www.inaturalist.org/') ? uri : null);
const photoInat = (url) => (typeof url === 'string'
  && /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\//.test(url) ? url : null);

// ---------- Construction du DOM ----------

/** Petit utilitaire : h('p', {class: 'x'}, 'texte', autreNoeud). Texte toujours échappé. */
function h(tag, attrs = {}, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const e of enfants.flat()) {
    if (e == null || e === false) continue;
    el.append(e instanceof Node ? e : document.createTextNode(String(e)));
  }
  return el;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const txt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function texteMoment(moment, coucher) {
  switch (moment) {
    case 'matin': return 'Plutôt le matin';
    case 'journee': return 'En journée';
    case 'coucher_soleil': return `Au coucher du soleil, vers ${coucher}`;
    case 'nuit': return `À la nuit tombée, après ${coucher}`;
    default: return null;
  }
}

function texteLieux(fiche, lieux) {
  const noms = (fiche.lieux || []).map((id) => {
    if (id === 'partout') return 'partout dans le quartier';
    const l = lieux.get(id);
    return l ? (l.distance ? `${l.nom} (${l.distance})` : l.nom) : null;
  }).filter(Boolean);
  if (!noms.length) return null;
  const t = noms.join(', ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Vignette (photo d'espèce ou du lieu) avec crédit ; disparaît si l'image ne charge pas. */
function vignette(photo, alt, classe) {
  if (!photo?.url) return null;
  return h('figure', { class: classe },
    h('img', {
      src: photo.url, alt, loading: 'lazy', decoding: 'async',
      onerror: (e) => e.target.closest('figure')?.remove(),
    }),
    photo.credit || photo.source
      ? h('figcaption', {},
        photo.source
          ? h('a', { href: photo.source, rel: 'noopener', target: '_blank' }, photo.credit || 'Source')
          : photo.credit)
      : null);
}

/** Bloc « point précis » : repère pour retrouver l'endroit, photo du coin, bouton « Y aller ». */
function blocPoint(fiche) {
  const p = fiche.point;
  if (!p || (!p.repere && !pointValide(p))) return null;
  const url = lienItineraire(p, plateforme(globalThis.navigator));
  return h('div', { class: 'point' },
    vignette(p.photo_lieu, `Photo de l'endroit : ${p.repere || fiche.titre}`, 'photo-lieu'),
    h('div', { class: 'point-texte' },
      p.repere ? h('p', { class: 'repere' }, h('span', { 'aria-hidden': 'true' }, '📍 '), p.repere) : null,
      url ? h('a', {
        class: 'y-aller', href: url,
        ...(url.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {}),
      }, h('span', { 'aria-hidden': 'true' }, '🚶 '), 'Y aller',
      h('span', { class: 'visuellement-cache' }, ` (itinéraire à pied vers « ${fiche.titre} »)`)) : null));
}

/** Badge « 👀 Vu hier vers le parc Peixotto · voir l'observation » d'une fiche appariée. */
function badgeVu(fiche, etat) {
  const v = etat.appariements?.get(fiche.id);
  if (!v) return null;
  const uri = lienInat(v.uri);
  return h('p', { class: 'vu' },
    h('span', { 'aria-hidden': 'true' }, '👀 '),
    `Vu ${texteQuand(v.jours)}${v.lieuTexte ? ` ${v.lieuTexte}` : ''}`,
    v.grade === 'en_cours' ? h('span', { class: 'vu-encours' }, ' · identification en cours') : null,
    uri ? [' · ', h('a', { href: uri, target: '_blank', rel: 'noopener' }, 'voir l\'observation',
      h('span', { class: 'visuellement-cache' }, ' sur iNaturalist'))] : null);
}

function carte(fiche, etat, index) {
  const cat = CATEGORIES[fiche.categorie];
  const idTitre = `titre-${index}`;
  const enfant = fiche.enfant?.[etat.age] || fiche.enfant?.['2-3'] || null;
  const ad = fiche.adulte || {};
  const lieux = texteLieux(fiche, etat.lieux);
  const moment = texteMoment(fiche.moment, etat.coucher);

  const photo = vignette(fiche.photo, ad.nom ? `Photo : ${ad.nom}` : `Photo : ${fiche.titre}`, 'photo');

  const pourToi = h('details', { class: 'pour-toi' },
    h('summary', {}, 'Pour toi'),
    h('div', { class: 'pour-toi-corps' },
      ad.nom || ad.latin
        ? h('p', { class: 'nom' }, ad.nom ? h('strong', {}, ad.nom) : null, ad.nom && ad.latin ? ' — ' : null,
          ad.latin ? h('i', { lang: 'la' }, ad.latin) : null)
        : null,
      ad.anecdote ? h('p', {}, ad.anecdote) : null,
      ad.pourquoi_maintenant ? [h('h4', {}, 'Pourquoi maintenant'), h('p', {}, ad.pourquoi_maintenant)] : null,
      ad.confusion ? [h('h4', {}, 'Ne pas confondre'), h('p', {}, ad.confusion)] : null));

  return h('article', { class: `carte cat-${fiche.categorie}`, 'aria-labelledby': idTitre, 'data-id': fiche.id },
    h('p', { class: 'pastille' }, h('span', { 'aria-hidden': 'true' }, cat.icone), ' ', cat.nom),
    h('h2', { id: idTitre, tabindex: '-1' }, fiche.titre),
    badgeVu(fiche, etat),
    fiche.attention ? h('p', { class: 'attention', role: 'note' },
      h('span', { class: 'attention-icone', 'aria-hidden': 'true' }, '⚠️'),
      h('span', {}, h('span', { class: 'visuellement-cache' }, 'Sécurité. '), fiche.attention)) : null,
    h('div', { class: 'carte-haut' },
      h('div', { class: 'ou' },
        h('h3', {}, 'Où'),
        lieux ? h('p', { class: 'lieux' }, lieux) : null,
        fiche.ou ? h('p', {}, fiche.ou) : null,
        moment ? h('p', { class: 'moment' }, h('span', { 'aria-hidden': 'true' }, '🕰️ '), moment) : null,
        fiche.verifier === true ? h('p', { class: 'a-verifier' }, 'À confirmer sur place.') : null),
      photo),
    blocPoint(fiche),
    fiche.reperes ? h('section', { class: 'reperes' }, h('h3', {}, 'Pour la reconnaître'), h('p', {}, fiche.reperes)) : null,
    enfant ? h('section', { class: 'enfant', 'aria-label': `Avec ton enfant, ${etat.age} ans` },
      h('h3', {}, `Avec ton enfant (${etat.age} ans)`),
      enfant.mot ? h('p', { class: 'mot' }, enfant.mot) : null,
      enfant.geste ? h('p', {}, h('span', { class: 'etiquette' }, 'Le geste'), enfant.geste) : null,
      enfant.phrase ? h('p', { class: 'phrase' }, h('span', { class: 'etiquette' }, 'À dire'), `« ${enfant.phrase} »`) : null)
      : null,
    pourToi,
    h('button', { type: 'button', class: 'autre', onclick: () => remplacer(etat, index) },
      h('span', { 'aria-hidden': 'true' }, '↻ '), 'Une autre idée',
      h('span', { class: 'visuellement-cache' }, ` à la place de « ${fiche.titre} »`)));
}

function afficherCartes(etat) {
  const main = $('idees');
  main.replaceChildren();
  if (!etat.cartes.length) {
    main.append(h('p', { class: 'vide' }, 'Pas d\'idée disponible aujourd\'hui… Sors quand même : il y a toujours une feuille, un oiseau ou une flaque à regarder.'));
  } else {
    etat.cartes.forEach((f, i) => main.append(carte(f, etat, i)));
  }
  main.setAttribute('aria-busy', 'false');
}

function remplacer(etat, index) {
  const actuelle = etat.cartes[index];
  const autres = etat.cartes.filter((_, i) => i !== index).map((f) => f.categorie);
  const f = autre(etat.fiches, etat.conditions, etat.date, [...etat.dejaAffichees], actuelle.categorie, {
    ...etat.optionsSelection,
    categoriesEvitees: autres,
  });
  if (!f) {
    $('annonce').textContent = 'Pas d\'autre idée pour aujourd\'hui.';
    const bouton = $('idees').children[index]?.querySelector('.autre');
    if (bouton) {
      bouton.disabled = true;
      bouton.textContent = 'Pas d\'autre idée aujourd\'hui';
    }
    return;
  }
  etat.cartes[index] = f;
  etat.dejaAffichees.add(f.id);
  memoriser(etat);
  const nouvelle = carte(f, etat, index);
  $('idees').children[index].replaceWith(nouvelle);
  $('annonce').textContent = `Nouvelle idée : ${f.titre}`;
  nouvelle.querySelector('h2').focus();
}

// ---------- Bloc « Vu ces 14 derniers jours près d'ici » ----------

/** Vignette 64 px : photo libre de l'observation, sinon photo Wikimedia d'une fiche appariée, sinon pictogramme. */
function vignetteObservation(o, etat) {
  const picto = () => h('span', { class: 'obs-picto', 'aria-hidden': 'true' }, PICTOS_GROUPES[o.groupe] || '🔍');
  const img = (src, alt) => h('img', {
    src, alt, width: '64', height: '64', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer',
    onerror: (e) => e.target.replaceWith(picto()),
  });
  const src = photoInat(o.photo?.url);
  if (src) return { image: img(src, ''), credit: o.photo.credit ? `Photo : ${o.photo.credit}` : null, source: null };
  const fiche = [...apparier([o], etat.fiches).keys()]
    .map((id) => etat.fiches.find((f) => f.id === id))
    .find((f) => typeof f?.photo?.url === 'string' && f.photo.url.startsWith('https://upload.wikimedia.org/'));
  if (fiche) {
    return {
      image: img(fiche.photo.url, ''),
      credit: `Photo d'illustration : ${fiche.photo.credit || 'Wikimedia Commons'}`,
      source: typeof fiche.photo.source === 'string' && fiche.photo.source.startsWith('https://') ? fiche.photo.source : null,
    };
  }
  return { image: picto(), credit: null, source: null };
}

function ligneObservation(o, etat) {
  const v = vignetteObservation(o, etat);
  const uri = lienInat(o.uri);
  const nom = o.nomCommun || o.latin;
  const details = [texteQuand(o.jours), o.lieuTexte].filter(Boolean).join(' · ');
  return h('li', { class: 'obs' },
    h('div', { class: 'obs-vignette' }, v.image),
    h('div', { class: 'obs-texte' },
      h('p', { class: 'obs-nom' },
        o.nomCommun ? h('strong', {}, o.nomCommun) : h('strong', {}, h('i', { lang: 'la' }, o.latin)),
        o.nomCommun ? [' ', h('i', { lang: 'la', class: 'obs-latin' }, o.latin)] : null),
      h('p', { class: 'obs-quand' },
        details.charAt(0).toUpperCase() + details.slice(1),
        o.grade === 'en_cours' ? h('span', { class: 'obs-encours' }, ' · identification en cours') : null),
      h('p', { class: 'obs-credit' },
        v.credit ? (v.source ? h('a', { href: v.source, target: '_blank', rel: 'noopener' }, v.credit) : v.credit) : null,
        v.credit && uri ? ' · ' : null,
        uri ? h('a', { href: uri, target: '_blank', rel: 'noopener' }, 'voir',
          h('span', { class: 'visuellement-cache' }, ` l'observation « ${nom} » sur iNaturalist`)) : null)));
}

function afficherObservations(etat) {
  const section = $('observations');
  if (!section) return;
  const r = etat.observations;
  const liste = (r?.disponible ? r.observations : []).slice(0, MAX_LIGNES_OBSERVATIONS);
  if (!liste.length) {
    section.hidden = true;
    section.replaceChildren();
    return;
  }
  section.replaceChildren(
    h('h2', { id: 'observations-titre' }, 'Vu ces 14 derniers jours près d\'ici'),
    h('p', { class: 'obs-sous-titre' }, r.elargi
      ? 'Observations des habitants sur iNaturalist, à moins de 3 km : trop peu d\'observations tout près.'
      : 'Observations des habitants sur iNaturalist, à moins de 1,5 km.'),
    h('ul', { class: 'obs-liste' }, liste.map((o) => ligneObservation(o, etat))));
  section.hidden = false;
  const n = r.observations.length;
  $('annonce').textContent = `${n} observation${n > 1 ? 's' : ''} récente${n > 1 ? 's' : ''} près d'ici.`;
}

/** Intègre les observations : appariement, option du moteur (pour « Une autre idée »). */
function integrerObservations(etat, r) {
  etat.observations = r?.disponible ? r : null;
  etat.appariements = etat.observations ? apparier(etat.observations.observations, etat.fiches) : new Map();
  etat.optionsSelection.observations = etat.appariements.size ? etat.appariements : null;
}

/** Observations arrivées après l'affichage : on ajoute badges et bloc, sans changer les cartes. */
function observationsTardives(etat, r) {
  integrerObservations(etat, r);
  for (const article of $('idees').querySelectorAll('article.carte')) {
    const fiche = etat.cartes.find((f) => f.id === article.dataset.id);
    if (!fiche || article.querySelector('.vu')) continue;
    const b = badgeVu(fiche, etat);
    if (b) article.querySelector('h2')?.after(b);
  }
  afficherObservations(etat);
}

// ---------- Historique (anti-répétition) ----------

function lireHistorique() {
  const hst = lireStockage(CLE_HISTORIQUE, {});
  return hst && typeof hst === 'object' && !Array.isArray(hst) ? hst : {};
}

function memoriser(etat) {
  if (!etat.enregistrer) return;
  const hst = lireHistorique();
  hst[etat.date] = [...etat.dejaAffichees];
  // On ne garde que les 14 dernières dates.
  const dates = Object.keys(hst).sort().slice(-14);
  ecrireStockage(CLE_HISTORIQUE, Object.fromEntries(dates.map((d) => [d, hst[d]])));
}

// ---------- En-tête ----------

function afficherEntete(etat, meteo) {
  $('date-du-jour').textContent = formatDate(etat.date);
  document.title = `${formatDate(etat.date)} — Nature autour de Talence centre`;

  const l = lune(etat.date);
  $('astro-ligne').replaceChildren(...[
    h('span', { 'aria-hidden': 'true' }, `${l.emoji} `), l.nom,
    l.phase === 'pleine' ? null : ` (${Math.round(l.illumination * 100)} %)`,
    ' · ', h('span', { 'aria-hidden': 'true' }, '🌇 '), `Coucher du soleil ${etat.coucher}`,
  ].filter((x) => x != null));

  const ligne = $('meteo-ligne');
  const avert = $('meteo-avertissement');
  if (!meteo.disponible) {
    ligne.textContent = 'Météo indisponible pour l\'instant.';
    avert.textContent = 'Les idées sont choisies sans tenir compte du temps : regarde par la fenêtre avant de sortir.';
    avert.hidden = false;
  } else if (meteo.forcee) {
    const vraies = Object.entries(meteo.conditions).filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' '));
    ligne.textContent = `Météo simulée : ${vraies.join(', ') || 'rien de particulier'}`;
  } else {
    const a = meteo.affichage;
    const c = meteo.conditions;
    const extras = [];
    if (c.gel) extras.push('gel');
    if (c.pluie_recente && !c.pluie_aujourdhui) extras.push('sol mouillé');
    if (c.pluie_aujourdhui) extras.push(`${String(a.pluie).replace('.', ',')} mm de pluie`);
    if (c.vent) extras.push(`rafales ${a.rafales} km/h`);
    ligne.replaceChildren(h('span', { 'aria-hidden': 'true' }, `${a.emoji} `),
      `${a.texte} · ${a.tmin} à ${a.tmax} °C${extras.length ? ` · ${extras.join(' · ')}` : ''}`);
  }
}

// ---------- Âge ----------

function initialiserAge(etat) {
  const sauve = lireStockage(CLE_AGE, '2-3');
  etat.age = AGES.includes(sauve) ? sauve : '2-3';
  for (const input of document.querySelectorAll('input[name="age"]')) {
    input.checked = input.value === etat.age;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      etat.age = input.value;
      ecrireStockage(CLE_AGE, etat.age);
      if (etat.cartes) afficherCartes(etat);
    });
  }
}

// ---------- Démarrage ----------

async function demarrer() {
  const params = lireParametres();
  const etat = { date: params.date, enregistrer: !params.simulee && !params.meteoForcee, cartes: null };
  initialiserAge(etat);

  const donneesP = chargerDonnees();
  const observationsP = obtenirObservations(params, donneesP); // ne rejette jamais
  const [donnees, meteo] = await Promise.all([donneesP, obtenirMeteo(params)]);
  // Courte attente supplémentaire au plus (voir l'en-tête) ; null = pas encore arrivées.
  const observations = await Promise.race([observationsP, attendre(GRACE_OBSERVATIONS_MS).then(() => null)]);

  // Conditions : astro (toujours) + météo (si disponible). ?meteo= peut aussi forcer l'astro.
  const astro = conditionsAstro(etat.date);
  const coucherMin = meteo.affichage?.coucherMinutes ?? soleil(etat.date).coucher;
  etat.coucher = formatHeure(coucherMin);
  etat.conditions = { ...astro, ...conditionsJour(coucherMin), ...(meteo.disponible ? meteo.conditions : {}) };
  if (params.meteoForcee) {
    for (const k of params.meteoForcee) if (k in astro) etat.conditions[k] = true;
  }

  etat.fiches = donnees.fiches;
  etat.lieux = donnees.lieux;
  etat.optionsSelection = {
    historique: lireHistorique(),
    conditionsPour: conditionsAstro, // recalcul « sans météo » des 7 jours précédents
  };
  integrerObservations(etat, observations);
  etat.cartes = choisir(etat.fiches, etat.conditions, etat.date, etat.optionsSelection);
  etat.dejaAffichees = new Set(etat.cartes.map((f) => f.id));
  // Si on a déjà demandé d'autres idées aujourd'hui, ne pas les reproposer.
  (etat.optionsSelection.historique[etat.date] || []).forEach((id) => etat.dejaAffichees.add(id));
  memoriser(etat);

  afficherEntete(etat, meteo);
  afficherCartes(etat);
  if (observations) afficherObservations(etat);
  else observationsP.then((r) => observationsTardives(etat, r)).catch((e) => console.warn('iNaturalist :', e));
}

demarrer().catch((e) => {
  console.error(e);
  const main = $('idees');
  main.setAttribute('aria-busy', 'false');
  main.replaceChildren(h('p', { class: 'vide' }, 'Oups, la page n\'a pas pu se charger. Réessaie dans un instant.'));
});
