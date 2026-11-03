// Validation des données : points d'intérêt open data, lieux enrichis, références des fiches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lireDonnees = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url), 'utf8'));

const points = lireDonnees('points-interet.json');
const lieux = lireDonnees('lieux.json');
const fiches = ['animaux', 'plantes', 'ciel', 'sensoriel', 'insolite']
  .flatMap((c) => lireDonnees(`fiches-${c}.json`));

const FORUM = { lat: 44.8065, lon: -0.5880 };
const RAYON_MAX_M = 1700;

// Énumération fermée des types (spec-observations-open-data.md §3.2).
const TYPES = new Set([
  'eau_potable', 'fontaine', 'puits', 'aire_jeux', 'jardin_partage', 'cueillette',
  'bassin', 'point_eau', 'canal', 'prairie_fauche', 'chenaie', 'roseliere', 'haie_arboree',
  'vigne', 'peupleraie', 'friche', 'fourre_prunellier', 'prairie_humide', 'conifere',
  'arbre_autre', 'ilot_fraicheur', 'arbre_espece', 'tour_hirondelles', 'ruisseau', 'etang',
  'zone_humide', 'verger', 'prairie', 'panneau_nature',
]);
const SOURCES_UNIQUES_A_VERIFIER = new Set(['OpenStreetMap', 'cr_objet_nature_p']);
const NUMERO_DE_MAISON = /\b\d+\s*(bis|ter)?\s*,?\s*(rue|avenue|allée|cours|place)/i;

function distanceM(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

test('points-interet.json : un tableau non vide, entre 40 et 120 points', () => {
  assert.ok(Array.isArray(points));
  assert.ok(points.length >= 40 && points.length <= 120, `${points.length} points`);
});

test('points-interet.json : ids uniques, préfixés « pi- »', () => {
  const ids = points.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'ids en double');
  for (const id of ids) assert.match(id, /^pi-[a-z0-9-]+$/, id);
});

test('points-interet.json : types dans l\'énumération fermée', () => {
  for (const p of points) assert.ok(TYPES.has(p.type), `${p.id} : type « ${p.type} » inconnu`);
});

test('points-interet.json : champs obligatoires bien typés', () => {
  for (const p of points) {
    assert.equal(typeof p.nom, 'string', p.id);
    assert.ok(p.nom.length > 0, p.id);
    assert.equal(typeof p.repere, 'string', p.id);
    assert.ok(p.repere.length >= 20, `${p.id} : repère trop court`);
    assert.ok(['certain', 'probable'].includes(p.confiance), `${p.id} : confiance`);
    assert.equal(typeof p.verifier, 'boolean', p.id);
    assert.ok(p.source && p.source.jeu && p.source.ref && p.source.date, `${p.id} : source`);
    assert.ok(p.saison === null || (Array.isArray(p.saison)
      && p.saison.every((m) => Number.isInteger(m) && m >= 1 && m <= 12)), `${p.id} : saison`);
  }
});

test('points-interet.json : coordonnées à moins de 1,7 km du Forum, distance_m cohérente', () => {
  for (const p of points) {
    assert.equal(typeof p.lat, 'number', p.id);
    assert.equal(typeof p.lon, 'number', p.id);
    const d = distanceM(FORUM.lat, FORUM.lon, p.lat, p.lon);
    assert.ok(d <= RAYON_MAX_M, `${p.id} à ${Math.round(d)} m`);
    assert.ok(Math.abs(d - p.distance_m) <= 5, `${p.id} : distance_m ${p.distance_m} pour ${Math.round(d)} m`);
  }
});

test('points-interet.json : lieu null ou id existant dans lieux.json', () => {
  const ids = new Set(lieux.map((l) => l.id));
  for (const p of points) {
    assert.ok(p.lieu === null || ids.has(p.lieu), `${p.id} : lieu « ${p.lieu} » inconnu`);
  }
});

test('points-interet.json : verifier=true si confiance probable venant d\'OSM ou du PCRS seul', () => {
  for (const p of points) {
    if (p.confiance === 'probable' && SOURCES_UNIQUES_A_VERIFIER.has(p.source.jeu)) {
      assert.equal(p.verifier, true, `${p.id} : source ${p.source.jeu} seule`);
    }
    if (p.confiance === 'certain' && p.verifier === false) {
      assert.ok(p.source.jeu, p.id);
    }
  }
});

test('points-interet.json : aucun numéro de maison dans les repères', () => {
  for (const p of points) {
    assert.ok(!NUMERO_DE_MAISON.test(p.repere), `${p.id} : numéro de maison dans le repère`);
    if (p.acces) assert.ok(!NUMERO_DE_MAISON.test(p.acces), `${p.id} : numéro dans acces`);
  }
});

test('fiches[].point.pi : renseigné => existe dans points-interet.json', () => {
  const ids = new Set(points.map((p) => p.id));
  for (const f of fiches) {
    if (f.point && f.point.pi !== undefined && f.point.pi !== null) {
      assert.ok(ids.has(f.point.pi), `${f.id} : point.pi « ${f.point.pi} » inconnu`);
    }
  }
});

test('lieux.json : tout lieu a un champ « vers » commençant par « vers »', () => {
  for (const l of lieux) {
    assert.equal(typeof l.vers, 'string', `${l.id} : vers manquant`);
    assert.match(l.vers, /^vers /, `${l.id} : « ${l.vers} »`);
  }
});

test('lieux.json : ids uniques, canopée et fraîcheur plausibles, points existants', () => {
  assert.equal(new Set(lieux.map((l) => l.id)).size, lieux.length);
  const ids = new Set(points.map((p) => p.id));
  for (const l of lieux) {
    if (l.canopee !== undefined) assert.ok(l.canopee >= 0 && l.canopee <= 100, l.id);
    if (l.fraicheur !== undefined) assert.ok(l.fraicheur <= -3 && l.fraicheur >= -15, l.id);
    for (const pid of l.points ?? []) assert.ok(ids.has(pid), `${l.id} : point ${pid} inconnu`);
  }
});

test('lieux.json : cohérence lieux <-> points (points[] = points dont lieu = id)', () => {
  for (const l of lieux) {
    const attendus = points.filter((p) => p.lieu === l.id).map((p) => p.id).sort();
    assert.deepEqual([...(l.points ?? [])].sort(), attendus, l.id);
  }
});

test('lieux.json : lieux de référence conservés et parc-bel-air a de l\'eau', () => {
  const ids = new Set(lieux.map((l) => l.id));
  for (const id of ['parc-peixotto', 'parc-margaut', 'bois-sourreil', 'campus-haut-carre', 'bois-de-thouars']) {
    assert.ok(ids.has(id), id);
  }
  assert.equal(lieux.find((l) => l.id === 'parc-bel-air').eau, true);
});
