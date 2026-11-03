import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  urlObservations, normaliser, rattacherLieu, apparier, chargerObservations, creditPhoto,
  normaliserLatin, texteDistance, direction, texteQuand, texteVers, distanceM,
} from '../js/observations.js';

// Réponse réelle de l'API (3 km, 21 oct. → 3 nov. 2026), anonymisée et réduite à 7 observations.
const brute = () => JSON.parse(readFileSync(new URL('./fixtures/inaturalist.json', import.meta.url), 'utf8'));
const DATE = '2026-11-03';
const FORUM = { lat: 44.8065, lon: -0.588 };

/** Point à `m` mètres du Forum vers le nord (dLat) et l'est (dLon). */
const decale = (nord, est) => ({
  lat: FORUM.lat + nord / 111320,
  lon: FORUM.lon + est / (111320 * Math.cos(FORUM.lat * Math.PI / 180)),
});

const LIEUX = [
  { id: 'parc-peixotto', nom: 'Parc Peixotto', lat: 44.8087, lon: -0.5899, vers: 'vers le parc Peixotto' },
  { id: 'bois-sourreil', nom: 'Bois Sourreil (parc Sourreil)', lat: 44.8095, lon: -0.5778 },
];

test('URL : 14 jours glissants, deux qualités, au moins le genre, noms français', () => {
  const u = new URL(urlObservations(DATE, 1.5));
  assert.equal(u.origin + u.pathname, 'https://api.inaturalist.org/v1/observations');
  assert.equal(u.searchParams.get('d1'), '2026-10-21');
  assert.equal(u.searchParams.get('d2'), DATE);
  assert.equal(u.searchParams.get('radius'), '1.5');
  assert.equal(u.searchParams.get('quality_grade'), 'research,needs_id');
  assert.equal(u.searchParams.get('hrank'), 'genus');
  assert.equal(u.searchParams.get('photos'), 'true');
  assert.equal(u.searchParams.get('captive'), 'false');
  assert.equal(u.searchParams.get('locale'), 'fr');
  assert.equal(u.searchParams.get('preferred_place_id'), '6753');
  assert.equal(new URL(urlObservations(DATE, 3)).searchParams.get('radius'), '3');
});

test('normaliser : filtrage (obscurcie, sans photo, rang trop haut, sans coordonnées) et dédoublonnage', () => {
  const r = brute();
  r.results.push(
    { ...r.results[0], id: 1, taxon: { ...r.results[0].taxon, id: 99, rank: 'family', name: 'Falconidae' } },
    { ...r.results[0], id: 2, taxon: { ...r.results[0].taxon, id: 98 }, photos: [] },
    { ...r.results[0], id: 3, taxon: { ...r.results[0].taxon, id: 97 }, geojson: null },
    null,
  );
  const obs = normaliser(r, DATE);
  const ids = obs.map((o) => o.id);
  assert.ok(!ids.includes(411141937), 'obscurcie écartée');
  assert.ok(!ids.some((i) => i <= 3), 'famille, sans photo, sans coordonnées écartées');
  // Deux rougegorges (28 et 24 oct.) : on garde le plus récent.
  const rg = obs.filter((o) => o.latin === 'Erithacus rubecula');
  assert.equal(rg.length, 1);
  assert.equal(rg[0].date, '2026-10-28');
  // Tri décroissant.
  assert.deepEqual(obs.map((o) => o.date), [...obs.map((o) => o.date)].sort().reverse());
  assert.equal(obs.length, 5);
});

test('normaliser : champs, grade, jours, genre', () => {
  const obs = normaliser(brute(), DATE);
  const faucon = obs.find((o) => o.id === 412371341);
  assert.equal(faucon.jours, 1);
  assert.equal(faucon.grade, 'confirmee');
  assert.equal(faucon.nomCommun, 'Faucon crécerelle');
  assert.equal(faucon.latin, 'Falco tinnunculus');
  assert.equal(faucon.genre, 'Falco');
  assert.equal(faucon.rang, 'species');
  assert.equal(faucon.taxonId, 472766);
  assert.equal(faucon.uri, 'https://www.inaturalist.org/observations/412371341');
  assert.ok(Math.abs(faucon.lat - 44.7989) < 0.001 && Math.abs(faucon.lon + 0.5667) < 0.001);
  assert.equal(faucon.precision, 4);
  const aedia = obs.find((o) => o.latin === 'Aedia');
  assert.equal(aedia.rang, 'genus');
  assert.equal(aedia.grade, 'en_cours');
  assert.equal(aedia.nomCommun, null);
  const hylurgus = obs.find((o) => o.latin === 'Hylurgus ligniperda');
  assert.equal(hylurgus.precision, null);
  for (const o of obs) {
    assert.ok(!('place_guess' in o) && !('user' in o), 'ni texte libre ni utilisateur');
    assert.ok(!JSON.stringify({ ...o, photo: null }).includes('observateur'), 'pseudo seulement dans le crédit');
  }
});

test('photo : seulement sous licence CC, taille small, crédit court', () => {
  const obs = normaliser(brute(), DATE);
  const faucon = obs.find((o) => o.id === 412371341);
  assert.match(faucon.photo.url, /^https:\/\/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/\d+\/small\.jpg$/);
  assert.equal(faucon.photo.credit, 'observateur1 — CC BY-NC');
  assert.equal(faucon.photo.licence, 'CC BY-NC');
  // Rougegorge du 28 oct. : « all rights reserved » → aucune photo chargée.
  const rg = obs.find((o) => o.latin === 'Erithacus rubecula');
  assert.equal(rg.photo, null);
  assert.equal(creditPhoto('(c) Jean Dupont, some rights reserved (CC BY-SA)', 'cc-by-sa'), 'Jean Dupont — CC BY-SA');
  assert.equal(creditPhoto('(c) pseudo, no rights reserved (CC0)', 'cc0'), 'pseudo — CC0');
  assert.equal(creditPhoto('', 'cc-by'), 'CC BY');
});

test('lieu : lieu connu le plus proche (< 250 m), champ « vers » ou repli', () => {
  assert.equal(rattacherLieu({ lat: 44.8088, lon: -0.5901, precision: 10 }, LIEUX), 'vers le parc Peixotto');
  assert.equal(rattacherLieu({ lat: 44.8096, lon: -0.5779, precision: 10 }, LIEUX), 'vers le bois Sourreil');
  assert.equal(rattacherLieu({ lat: 44.8096, lon: -0.5779, precision: 10 }, new Map(LIEUX.map((l) => [l.id, l]))), 'vers le bois Sourreil', 'accepte une Map');
  assert.equal(texteVers({ nom: 'Cimetière de Talence' }), 'vers le cimetière de Talence');
  assert.equal(texteVers({ nom: 'Campus : domaine du Haut-Carré' }), 'vers le campus');
  assert.equal(texteVers({ nom: 'Butte Rosa Parks (Thouars)' }), 'vers la butte Rosa Parks');
  assert.equal(texteVers({ nom: 'Allée des Tilleuls' }), 'vers l\'allée des Tilleuls');
});

test('lieu : sinon distance arrondie à 100 m et direction sur 8 points depuis le Forum', () => {
  const nord = decale(640, 0);
  assert.equal(rattacherLieu({ ...nord, precision: 20 }, []), 'à 600 m vers le nord');
  const so = decale(-2380 / Math.SQRT2, -2380 / Math.SQRT2);
  assert.equal(rattacherLieu({ ...so, precision: null }, LIEUX), 'à 2,4 km vers le sud-ouest');
  assert.equal(rattacherLieu({ ...decale(0, 1200), precision: 5 }, []), 'à 1,2 km vers l\'est');
  assert.equal(rattacherLieu({ ...decale(0, -800), precision: 5 }, []), 'à 800 m vers l\'ouest');
  // Lieu à plus de 250 m : ignoré.
  const loin = decale(400, 0);
  assert.equal(rattacherLieu({ ...loin, precision: 5 }, [{ nom: 'Parc X', ...decale(700, 0), vers: 'vers X' }]), 'à 400 m vers le nord');
  assert.equal(texteDistance(950), '1 km');
  assert.equal(texteDistance(1049), '1 km');
  assert.equal(direction(0, 0, 1, 1), 'nord-est');
  assert.equal(direction(0, 0, -1, 0.1), 'sud');
  assert.ok(Math.abs(distanceM(44.8, -0.59, 44.81, -0.59) - 1112) < 5);
});

test('lieu : rien si la précision dépasse 500 m', () => {
  assert.equal(rattacherLieu({ lat: 44.8088, lon: -0.5901, precision: 546 }, LIEUX), null);
  assert.equal(rattacherLieu({ lat: 44.8088, lon: -0.5901, precision: 500 }, LIEUX), 'vers le parc Peixotto');
  const aedia = normaliser(brute(), DATE).find((o) => o.latin === 'Aedia');
  assert.equal(rattacherLieu(aedia, LIEUX), null, 'cas réel : 546 m');
});

test('texteQuand', () => {
  assert.equal(texteQuand(0), 'aujourd\'hui');
  assert.equal(texteQuand(1), 'hier');
  assert.equal(texteQuand(5), 'il y a 5 jours');
});

test('nom latin normalisé', () => {
  assert.deepEqual(normaliserLatin('Cornu aspersum (O.F. Müller, 1774)'), { genre: 'cornu', binome: 'cornu aspersum' });
  assert.deepEqual(normaliserLatin('Tilia sp.'), { genre: 'tilia', binome: null });
  assert.deepEqual(normaliserLatin('Quercus spp.'), { genre: 'quercus', binome: null });
  assert.deepEqual(normaliserLatin('cf. Turdus merula'), { genre: 'turdus', binome: 'turdus merula' });
  assert.deepEqual(normaliserLatin('Platanus × hispanica'), { genre: 'platanus', binome: 'platanus hispanica' });
  assert.deepEqual(normaliserLatin("Prunus cerasifera 'Pissardii'"), { genre: 'prunus', binome: 'prunus cerasifera' });
  assert.deepEqual(normaliserLatin('Quercus robur L.'), { genre: 'quercus', binome: 'quercus robur' });
  assert.equal(normaliserLatin('—'), null);
  assert.equal(normaliserLatin(null), null);
});

const obsFactice = (o) => ({ id: o.latin, uri: 'https://www.inaturalist.org/observations/1', jours: 2, grade: 'confirmee', rang: 'species', distance: 300, lieuTexte: null, ...o });
const ficheFactice = (id, adulte) => ({ id, categorie: 'animal', titre: id, mois: [11], adulte });

test('appariement : espèce ↔ même binôme ; fiche au genre ↔ toute observation du genre', () => {
  const fiches = [
    ficheFactice('rougegorge', { latin: 'Erithacus rubecula' }),
    ficheFactice('tilleuls', { latin: 'Tilia sp.' }),
    ficheFactice('merle', { latin: 'Turdus merula' }),
    ficheFactice('platane', { latin: 'Platanus × hispanica' }),
    ficheFactice('sans-latin', { latin: null }),
    ficheFactice('sans-adulte', undefined),
  ];
  const obs = [
    obsFactice({ latin: 'Erithacus rubecula', jours: 3, lieuTexte: 'vers le parc Peixotto', grade: 'en_cours' }),
    obsFactice({ latin: 'Tilia cordata' }),
    obsFactice({ latin: 'Turdus', rang: 'genus' }),
    obsFactice({ latin: 'Turdus philomelos' }),
    obsFactice({ latin: 'Platanus × hispanica', rang: 'hybrid' }),
  ];
  const m = apparier(obs, fiches);
  assert.deepEqual([...m.keys()].sort(), ['platane', 'rougegorge', 'tilleuls']);
  assert.deepEqual(m.get('rougegorge'), {
    jours: 3, lieuTexte: 'vers le parc Peixotto', uri: 'https://www.inaturalist.org/observations/1', grade: 'en_cours',
    observationId: 'Erithacus rubecula', nomCommun: undefined, latin: 'Erithacus rubecula',
  });
  assert.ok(!m.has('merle'), 'une observation au genre n\'apparie jamais une fiche d\'espèce ; autre espèce du genre non plus');
});

test('appariement : observation au genre ↔ fiche au genre uniquement', () => {
  const fiches = [ficheFactice('tilleuls', { latin: 'Tilia sp.' }), ficheFactice('tilleul-argente', { latin: 'Tilia tomentosa' })];
  const m = apparier([obsFactice({ latin: 'Tilia', rang: 'genus' })], fiches);
  assert.deepEqual([...m.keys()], ['tilleuls']);
});

test('appariement : `adulte.taxons` prioritaire sur `latin`', () => {
  const f = ficheFactice('escargots', { latin: 'Cornu aspersum', taxons: ['Cepaea nemoralis', 'Helix'] });
  assert.ok(apparier([obsFactice({ latin: 'Cepaea nemoralis' })], [f]).has('escargots'));
  assert.ok(apparier([obsFactice({ latin: 'Helix pomatia' })], [f]).has('escargots'), 'genre de la liste');
  assert.ok(!apparier([obsFactice({ latin: 'Cornu aspersum' })], [f]).has('escargots'), 'latin ignoré quand taxons existe');
  // latin multiple « A ; B » sans taxons.
  const t = ficheFactice('tresors', { latin: 'Aesculus hippocastanum ; Quercus robur' });
  assert.ok(apparier([obsFactice({ latin: 'Quercus robur' })], [t]).has('tresors'));
});

test('appariement : la plus récente, puis la plus proche', () => {
  const f = ficheFactice('tilleuls', { latin: 'Tilia sp.' });
  const obs = [
    obsFactice({ id: 'a', latin: 'Tilia cordata', jours: 4, distance: 100 }),
    obsFactice({ id: 'b', latin: 'Tilia platyphyllos', jours: 2, distance: 900 }),
    obsFactice({ id: 'c', latin: 'Tilia tomentosa', jours: 2, distance: 300 }),
  ];
  assert.equal(apparier(obs, [f]).get('tilleuls').observationId, 'c');
});

test('appariement sur la fixture réelle', () => {
  const obs = normaliser(brute(), DATE);
  const fiches = [
    ficheFactice('rougegorge', { latin: 'Erithacus rubecula' }),
    ficheFactice('faucon', { latin: 'Falco tinnunculus' }),
    ficheFactice('noctuelle', { latin: 'Aedia leucomelas' }),
  ];
  const m = apparier(obs, fiches);
  assert.equal(m.get('rougegorge').jours, 6);
  assert.equal(m.get('faucon').grade, 'confirmee');
  assert.ok(!m.has('noctuelle'), 'Aedia au genre ≠ fiche d\'espèce');
});

/** fetch factice : renvoie `reponses[rayon]` et note les rayons demandés. */
function fetchFactice(reponses, appels) {
  return async (url) => {
    const rayon = new URL(url).searchParams.get('radius');
    appels.push(rayon);
    const r = reponses[rayon];
    if (r instanceof Error) throw r;
    return { ok: true, status: 200, json: async () => r };
  };
}

test('rayon adaptatif : ≥ 5 à 1,5 km → une seule requête', async () => {
  const base = brute();
  const cinq = { results: [] };
  for (let i = 0; i < 5; i++) {
    cinq.results.push({ ...base.results[0], id: 100 + i, taxon: { ...base.results[0].taxon, id: 1000 + i } });
  }
  const appels = [];
  const r = await chargerObservations(DATE, { fetchFn: fetchFactice({ 1.5: cinq }, appels), lieux: LIEUX });
  assert.deepEqual(appels, ['1.5']);
  assert.equal(r.disponible, true);
  assert.equal(r.rayon, 1.5);
  assert.equal(r.elargi, false);
  assert.equal(r.observations.length, 5);
  assert.ok('lieuTexte' in r.observations[0]);
});

test('rayon adaptatif : < 5 après filtrage → seconde requête à 3 km qui remplace la première', async () => {
  const base = brute();
  const peu = { results: base.results.slice(0, 2) };
  const appels = [];
  const r = await chargerObservations(DATE, { fetchFn: fetchFactice({ 1.5: peu, 3: base }, appels), lieux: LIEUX });
  assert.deepEqual(appels, ['1.5', '3']);
  assert.equal(r.rayon, 3);
  assert.equal(r.elargi, true);
  assert.equal(r.observations.length, 5);
  // Seconde requête en panne → on garde le résultat à 1,5 km.
  const r2 = await chargerObservations(DATE, { fetchFn: fetchFactice({ 1.5: peu, 3: new Error('hors ligne') }, []) });
  assert.equal(r2.disponible, true);
  assert.equal(r2.rayon, 1.5);
  assert.equal(r2.observations.length, 2);
});

test('panne, HTTP 500, JSON invalide, délai : résultat vide sans exception', async () => {
  const vides = [
    async () => { throw new Error('hors ligne'); },
    async () => ({ ok: false, status: 500 }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError('JSON invalide'); } }),
    async () => ({ ok: true, json: async () => ({ pas: 'de results' }) }),
    async () => null,
  ];
  for (const fetchFn of vides) {
    const r = await chargerObservations(DATE, { fetchFn });
    assert.equal(r.disponible, false);
    assert.deepEqual(r.observations, []);
  }
  // Délai : un fetch qui ne répond jamais (mais respecte l'annulation).
  const lent = (url, { signal }) => new Promise((_, rejeter) => {
    signal?.addEventListener('abort', () => rejeter(Object.assign(new Error('annulé'), { name: 'AbortError' })));
  });
  const debut = Date.now();
  const r = await chargerObservations(DATE, { fetchFn: lent, timeoutMs: 50 });
  assert.equal(r.disponible, false);
  assert.equal(r.erreur, 'délai dépassé');
  assert.ok(Date.now() - debut < 1000);
  // Même un fetch qui ignore l'annulation ne bloque pas au-delà du délai.
  const sourd = () => new Promise(() => {});
  const r2 = await chargerObservations(DATE, { fetchFn: sourd, timeoutMs: 50 });
  assert.equal(r2.disponible, false);
});
