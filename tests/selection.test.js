import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  choisir, autre, estEligible, estComplement, poidsDuJour, idsRecents, hacher, generateur, BONUS_DATEE, estPonctuel, BONUS_OBSERVEE,
} from '../js/selection.js';
import { conditionsAstro } from '../js/astro.js';
import { fiches as chargerFiches } from './aide.js';

const FICHES = chargerFiches();
const ids = (l) => l.map((f) => f.id);
const PLUIE = { pluie_recente: true, couvert: true, jours_courts: true };
const SANS_HISTO = { recalculer: false };

// Petite fabrique de fiches factices.
let n = 0;
const fiche = (o = {}) => ({
  id: `f${++n}`, categorie: 'animal', titre: 't', mois: [11], requiert: [], exclut: [], poids: 1, ...o,
});

test('éligibilité : mois, requiert, exclut', () => {
  const f = fiche({ mois: [3, 11], requiert: ['pluie_recente'], exclut: ['gel'] });
  assert.equal(estEligible(f, { pluie_recente: true }, '2026-11-02'), true);
  assert.equal(estEligible(f, { pluie_recente: true }, '2026-12-02'), false, 'hors saison');
  assert.equal(estEligible(f, {}, '2026-11-02'), false, 'condition requise absente');
  assert.equal(estEligible(f, { pluie_recente: true, gel: true }, '2026-11-02'), false, 'condition exclue');
  assert.equal(estEligible(fiche({ requiert: ['pluie_recente', 'vent'] }), { pluie_recente: true }, '2026-11-02'), false, 'TOUTES requises');
});

test('choisir : uniquement des fiches éligibles quand il y en a assez', () => {
  for (const d of ['2026-11-02', '2026-11-03', '2026-11-10', '2026-11-17']) {
    const r = choisir(FICHES, PLUIE, d, SANS_HISTO);
    assert.equal(r.length, 3);
    for (const f of r) assert.ok(estEligible(f, PLUIE, d), `${f.id} non éligible le ${d}`);
  }
});

test('déterminisme : même date → même tirage ; dates différentes → tirages variés', () => {
  const a = choisir(FICHES, PLUIE, '2026-11-02', { conditionsPour: conditionsAstro });
  const b = choisir(structuredClone(FICHES), PLUIE, '2026-11-02', { conditionsPour: conditionsAstro });
  assert.deepEqual(ids(a), ids(b));
  const vus = new Set();
  for (let j = 1; j <= 20; j++) choisir(FICHES, PLUIE, `2026-11-${String(j).padStart(2, '0')}`, SANS_HISTO).forEach((f) => vus.add(f.id));
  assert.ok(vus.size >= 8, `trop peu de variété : ${vus.size}`);
});

test('générateur pseudo-aléatoire stable', () => {
  const g1 = generateur(hacher('2026-11-02'));
  const g2 = generateur(hacher('2026-11-02'));
  for (let i = 0; i < 5; i++) assert.equal(g1(), g2());
});

test('diversité : 3 catégories différentes quand c\'est possible', () => {
  for (let j = 1; j <= 30; j++) {
    const d = `2026-11-${String(j).padStart(2, '0')}`;
    const r = choisir(FICHES, PLUIE, d, { conditionsPour: conditionsAstro });
    assert.equal(new Set(r.map((f) => f.categorie)).size, 3, `${d} : ${ids(r)}`);
  }
});

test('diversité : si une seule catégorie existe, on prend quand même 3 fiches', () => {
  const l = [fiche(), fiche(), fiche(), fiche()];
  assert.equal(choisir(l, {}, '2026-11-02', SANS_HISTO).length, 3);
});

test('spécificité du jour : une fiche « pleine lune » est très favorisée le jour J', () => {
  const pl = fiche({ id: 'pl', categorie: 'ciel', requiert: ['pleine_lune'], poids: 3 });
  const banales = Array.from({ length: 8 }, () => fiche({ categorie: 'ciel' }));
  assert.ok(poidsDuJour(pl, { pleine_lune: true }) > 3 * poidsDuJour(banales[0], {}));
  let gagne = 0;
  for (let j = 1; j <= 30; j++) {
    const r = choisir([pl, ...banales], { pleine_lune: true }, `2026-11-${String(j).padStart(2, '0')}`, { n: 1, recalculer: false });
    if (r[0].id === 'pl') gagne++;
  }
  // Poids 12 contre 8 × 1 → ≈ 60 % ; tirage uniforme ≈ 11 %.
  assert.ok(gagne >= 12, `pleine lune choisie seulement ${gagne}/30 fois`);
});

test('anti-répétition : rien des 7 jours précédents (recalcul sans météo) si le stock suffit', () => {
  const stock = ['animal', 'plante', 'ciel', 'sensoriel', 'insolite']
    .flatMap((categorie) => Array.from({ length: 8 }, () => fiche({ categorie })));
  const opts = { conditionsPour: () => ({}) };
  const aujourdhui = choisir(stock, {}, '2026-11-10', opts);
  const recents = idsRecents(stock, '2026-11-10', opts);
  assert.ok(recents.size >= 15);
  for (const f of aujourdhui) assert.ok(!recents.has(f.id), `${f.id} déjà proposé cette semaine`);
  // Les 7 tirages précédents (sans météo) sont bien ceux qu'on aurait affichés.
  const hier = choisir(stock, {}, '2026-11-09', { recalculer: false });
  for (const f of hier) assert.ok(recents.has(f.id));
});

test('anti-répétition : l\'historique local (fiches vues) est aussi évité', () => {
  const stock = Array.from({ length: 10 }, (_, i) => fiche({ categorie: ['animal', 'plante', 'ciel'][i % 3] }));
  const libre = choisir(stock, {}, '2026-11-10', SANS_HISTO);
  const historique = { '2026-11-09': ids(libre), '2026-11-10': ['ignoré-le-jour-même'] };
  const r = choisir(stock, {}, '2026-11-10', { recalculer: false, historique });
  for (const f of r) assert.ok(!ids(libre).includes(f.id));
  // Un historique de plus de 7 jours est ignoré.
  const vieux = choisir(stock, {}, '2026-11-10', { recalculer: false, historique: { '2026-11-01': ids(libre) } });
  assert.deepEqual(ids(vieux), ids(libre));
});

test('anti-répétition : si tout a été vu, on reprend des fiches récentes plutôt que rien', () => {
  const stock = [fiche({ categorie: 'animal' }), fiche({ categorie: 'plante' }), fiche({ categorie: 'ciel' })];
  const r = choisir(stock, {}, '2026-11-10', { historique: { '2026-11-09': ids(stock) } });
  assert.equal(r.length, 3);
});

test('pénurie : complément avec des fiches du mois sans condition météo', () => {
  const stock = [
    fiche({ id: 'elig', categorie: 'animal', requiert: ['pluie_recente'] }),
    fiche({ id: 'compl-exclu-gel', categorie: 'plante', exclut: ['gel'] }),
    fiche({ id: 'compl-astro', categorie: 'ciel', requiert: ['jours_courts'], exclut: ['gel'] }),
    fiche({ id: 'meteo-fausse', categorie: 'sensoriel', requiert: ['vent'] }),
    fiche({ id: 'astro-fausse', categorie: 'ciel', requiert: ['pleine_lune'] }),
    fiche({ id: 'hors-saison', categorie: 'insolite', mois: [5] }),
  ];
  const cond = { pluie_recente: true, gel: true, jours_courts: true };
  assert.equal(estComplement(stock[1], cond, '2026-11-02'), true);
  assert.equal(estComplement(stock[3], cond, '2026-11-02'), false);
  assert.equal(estComplement(stock[4], cond, '2026-11-02'), false);
  const r = choisir(stock, cond, '2026-11-02', SANS_HISTO);
  assert.deepEqual(ids(r).sort(), ['compl-astro', 'compl-exclu-gel', 'elig']);
  assert.equal(r[0].id, 'elig', 'les éligibles passent avant le complément');
});

test('mode dégradé (pas de météo) : les fiches qui requièrent la météo sont écartées', () => {
  const astro = conditionsAstro('2026-11-02');
  const r = choisir(FICHES, astro, '2026-11-02', { conditionsPour: conditionsAstro });
  assert.equal(r.length, 3);
  for (const f of r) assert.ok(!(f.requiert || []).some((c) => ['pluie_recente', 'vent'].includes(c)), f.id);
});

test('autre : jamais une fiche déjà affichée, catégorie préférée, déterministe, null si épuisé', () => {
  const r = choisir(FICHES, PLUIE, '2026-11-02', SANS_HISTO);
  const deja = ids(r);
  const a1 = autre(FICHES, PLUIE, '2026-11-02', deja, 'animal', SANS_HISTO);
  assert.ok(a1 && !deja.includes(a1.id));
  assert.equal(a1.categorie, 'animal');
  assert.equal(autre(FICHES, PLUIE, '2026-11-02', deja, 'animal', SANS_HISTO).id, a1.id);
  // On épuise tout.
  const vus = new Set(deja);
  for (let i = 0; i < 50; i++) {
    const f = autre(FICHES, PLUIE, '2026-11-02', [...vus], null, SANS_HISTO);
    if (!f) break;
    assert.ok(!vus.has(f.id));
    vus.add(f.id);
  }
  assert.equal(autre(FICHES, PLUIE, '2026-11-02', [...vus], null, SANS_HISTO), null);
});

test('autre : catégorie préférée épuisée → évite les catégories des autres cartes', () => {
  const stock = [
    fiche({ id: 'a1', categorie: 'animal' }), fiche({ id: 'p1', categorie: 'plante' }),
    fiche({ id: 'p2', categorie: 'plante' }), fiche({ id: 'c1', categorie: 'ciel' }),
  ];
  const f = autre(stock, {}, '2026-11-02', ['a1', 'p1'], 'animal', { ...SANS_HISTO, categoriesEvitees: ['plante'] });
  assert.equal(f.id, 'c1');
});

test('fiches mal formées ignorées sans planter', () => {
  const r = choisir([null, {}, { id: 'x' }, fiche()], {}, '2026-11-02', SANS_HISTO);
  assert.equal(r.length, 1);
});

test('moment ou jamais : la fiche pleine lune n\'est pas écartée le jour J parce que vue la veille', () => {
  const pl = fiche({ id: 'pl', categorie: 'ciel', requiert: ['pleine_lune'], poids: 3 });
  const stock = [pl, ...['animal', 'plante', 'ciel', 'sensoriel'].flatMap((categorie) =>
    Array.from({ length: 6 }, () => fiche({ categorie })))];
  // Le 23 (pleine lune à ±1 j), le recalcul « sans météo » la propose → elle est récente le 24.
  const opts = { conditionsPour: conditionsAstro };
  assert.ok(idsRecents(stock, '2026-11-24', opts).has('pl'));
  let vue = 0;
  for (const d of ['2026-11-23', '2026-11-24', '2026-11-25']) {
    if (ids(choisir(stock, conditionsAstro(d), d, opts)).includes('pl')) vue++;
  }
  assert.ok(vue >= 2, `pleine lune proposée ${vue}/3 jours seulement`);
  // Une fiche banale récente, elle, reste écartée.
  const banale = choisir(stock, {}, '2026-11-09', { recalculer: false });
  const r = choisir(stock, {}, '2026-11-10', { recalculer: false, historique: { '2026-11-09': ids(banale) } });
  for (const f of r) assert.ok(!ids(banale).includes(f.id));
});

test('dates : éligible uniquement dans les plages (bornes incluses), mois ignoré', () => {
  const f = fiche({ mois: [11], dates: [['2026-12-13', '2026-12-15'], ['2027-01-03', '2027-01-03']] });
  assert.equal(estEligible(f, {}, '2026-12-12'), false);
  assert.equal(estEligible(f, {}, '2026-12-13'), true);
  assert.equal(estEligible(f, {}, '2026-12-15'), true);
  assert.equal(estEligible(f, {}, '2026-12-16'), false);
  assert.equal(estEligible(f, {}, '2027-01-03'), true);
  assert.equal(estEligible(f, {}, '2026-11-14'), false, 'le mois seul ne suffit plus');
  assert.equal(estComplement(f, {}, '2026-11-14'), false);
  assert.equal(estEligible(fiche({ dates: [] }), {}, '2026-11-14'), true, 'plages vides = pas de dates');
  assert.equal(estEligible({ ...fiche({ dates: [['2026-12-13', '2026-12-15']] }), mois: undefined }, {}, '2026-12-14'), true);
});

test('dates : fortement favorisée et jamais écartée par l\'anti-répétition pendant sa plage', () => {
  const ev = fiche({ id: 'ev', categorie: 'ciel', dates: [['2026-12-13', '2026-12-15']], mois: [12] });
  assert.equal(poidsDuJour(ev, {}, '2026-12-14'), BONUS_DATEE);
  const stock = [ev, ...['animal', 'plante', 'ciel', 'sensoriel'].flatMap((categorie) =>
    Array.from({ length: 6 }, () => fiche({ categorie, mois: [12] })))];
  const opts = { conditionsPour: () => ({}) };
  const historique = { '2026-12-13': ['ev'], '2026-12-14': ['ev'] };
  assert.ok(idsRecents(stock, '2026-12-15', { ...opts, historique }).has('ev'), 'bien vue récemment');
  let vue = 0;
  for (const d of ['2026-12-13', '2026-12-14', '2026-12-15']) {
    if (ids(choisir(stock, {}, d, { ...opts, historique })).includes('ev')) vue++;
  }
  assert.ok(vue >= 2, `événement daté proposé ${vue}/3 jours`);
  assert.equal(ids(choisir(stock, {}, '2026-12-16', opts)).includes('ev'), false);
});

test('fixtures : champs attention, verifier, dates bien formés', () => {
  for (const f of FICHES) {
    assert.ok(f.attention === null || (typeof f.attention === 'string' && f.attention.length > 5), f.id);
    assert.equal(typeof f.verifier, 'boolean', f.id);
    if ('dates' in f) for (const p of f.dates) assert.match(p.join(' '), /^\d{4}-\d{2}-\d{2} \d{4}-\d{2}-\d{2}$/);
  }
});

test('dates : plage longue (> 7 jours) = poids normal, anti-répétition normale', () => {
  const sat = fiche({ id: 'sat', categorie: 'ciel', poids: 2, dates: [['2026-10-01', '2027-01-31']] });
  assert.equal(estPonctuel(sat, '2026-12-13'), false);
  assert.equal(poidsDuJour(sat, {}, '2026-12-13'), 2);
  assert.equal(estEligible(sat, {}, '2027-02-01'), false, 'éligible seulement dans sa plage');
  const ponct = fiche({ dates: [['2026-12-13', '2026-12-19']] });
  assert.equal(estPonctuel(ponct, '2026-12-13'), true, '7 jours = ponctuel');
  assert.equal(estPonctuel(fiche({ dates: [['2026-12-13', '2026-12-20']] }), '2026-12-13'), false, '8 jours');
  const stock = [sat, ...['animal', 'plante', 'sensoriel'].flatMap((categorie) =>
    Array.from({ length: 6 }, () => fiche({ categorie, mois: [12] })))];
  const opts = { conditionsPour: () => ({}) };
  const historique = { '2026-12-12': ['sat'], '2026-12-11': ['sat'] };
  assert.equal(ids(choisir(stock, {}, '2026-12-13', { ...opts, historique })).includes('sat'), false, 'récente : écartée');
  let vues = 0;
  for (let j = 1; j <= 28; j++) {
    const d = `2026-12-${String(j).padStart(2, '0')}`;
    if (ids(choisir(stock, {}, d, opts)).includes('sat')) vues++;
  }
  assert.ok(vues < 14, `plage longue pas sur-représentée (${vues}/28)`);
});

test('dates : l\'événement ponctuel gagne toujours contre la même catégorie', () => {
  const ev = fiche({ id: 'geminides', categorie: 'ciel', dates: [['2026-12-13', '2026-12-15']] });
  const sat = fiche({ id: 'sat', categorie: 'ciel', poids: 3, dates: [['2026-10-01', '2027-01-31']] });
  const stock = [sat, ev, ...['animal', 'plante', 'sensoriel', 'ciel'].flatMap((categorie) =>
    Array.from({ length: 6 }, () => fiche({ categorie, mois: [12] })))];
  for (const d of ['2026-12-13', '2026-12-14', '2026-12-15']) {
    for (const historique of [null, { [d]: [], '2026-12-12': ['geminides'] }]) {
      assert.ok(ids(choisir(stock, {}, d, { conditionsPour: () => ({}), historique })).includes('geminides'), d);
    }
  }
});

test('dates : plus de 3 événements ponctuels le même jour → plages les plus courtes d\'abord', () => {
  const mk = (id, fin) => fiche({ id, categorie: 'ciel', dates: [['2026-12-13', fin]] });
  const stock = [mk('e7', '2026-12-19'), mk('e1', '2026-12-13'), mk('e5', '2026-12-17'), mk('e2', '2026-12-14'), mk('e3', '2026-12-15')];
  const r = ids(choisir(stock, {}, '2026-12-13', { recalculer: false }));
  assert.deepEqual(r, ['e1', 'e2', 'e3']);
});

test('observations : poids ×3 pour une fiche appariée, sans effet sur l\'éligibilité', () => {
  assert.equal(BONUS_OBSERVEE, 3);
  const f = fiche({ id: 'rg', poids: 2, requiert: ['pluie_recente'], mois: [11] });
  const obs = new Map([['rg', { jours: 1 }]]);
  assert.equal(poidsDuJour(f, { pluie_recente: true }, '2026-11-02', obs), 2 * 2.5 * 3);
  assert.equal(poidsDuJour(f, { pluie_recente: true }, '2026-11-02'), 2 * 2.5);
  assert.equal(poidsDuJour(f, { pluie_recente: true }, '2026-11-02', new Map()), 2 * 2.5);
  // Hors saison ou hors météo : une observation ne la rend pas éligible.
  const r = choisir([f, fiche({ categorie: 'plante' })], {}, '2026-11-02', { recalculer: false, observations: obs, n: 3 });
  assert.ok(!ids(r).includes('rg') || estComplement(f, {}, '2026-11-02'), 'requiert la pluie : jamais retenue sans pluie');
  assert.ok(!ids(choisir([fiche({ id: 'rg', mois: [5] })], {}, '2026-11-02', { recalculer: false, observations: obs })).includes('rg'));
});

test('observations : la fiche appariée est nettement plus souvent tirée (choisir et autre)', () => {
  const vue = fiche({ id: 'vue', categorie: 'animal' });
  const stock = [vue, ...Array.from({ length: 9 }, () => fiche({ categorie: 'animal' }))];
  const obs = new Map([['vue', { jours: 2 }]]);
  let avec = 0;
  let sans = 0;
  let autreAvec = 0;
  const N = 300;
  for (let j = 0; j < N; j++) {
    const d = new Date(Date.UTC(2026, 10, 1) + j * 86400000).toISOString().slice(0, 10);
    const m = { ...vue, mois: [Number(d.slice(5, 7))] };
    const s = stock.map((f) => ({ ...f, mois: m.mois }));
    if (choisir(s, {}, d, { n: 1, recalculer: false, observations: obs })[0].id === 'vue') avec++;
    if (choisir(s, {}, d, { n: 1, recalculer: false })[0].id === 'vue') sans++;
    if (autre(s, {}, d, [], 'animal', { recalculer: false, observations: obs })?.id === 'vue') autreAvec++;
  }
  // Poids 3 contre 9 × 1 → 25 % ; sans bonus 10 %.
  assert.ok(sans < 0.17 * N, `sans bonus : ${sans}/${N}`);
  assert.ok(avec > 0.18 * N && avec < 0.33 * N, `avec bonus : ${avec}/${N}`);
  assert.ok(autreAvec > 0.18 * N, `autre avec bonus : ${autreAvec}/${N}`);
});

test('observations : pas d\'exemption d\'anti-répétition, événements datés toujours prioritaires', () => {
  const vue = fiche({ id: 'vue', categorie: 'animal', poids: 3 });
  const stock = [vue, ...['animal', 'plante', 'ciel', 'sensoriel'].flatMap((categorie) =>
    Array.from({ length: 6 }, () => fiche({ categorie })))];
  const obs = new Map([['vue', { jours: 0 }]]);
  const historique = { '2026-11-09': ['vue'] };
  for (const d of ['2026-11-10', '2026-11-11', '2026-11-12']) {
    const r = choisir(stock, {}, d, { recalculer: false, historique, observations: obs });
    assert.ok(!ids(r).includes('vue'), `${d} : vue récemment, ne revient pas malgré l'observation`);
  }
  // Événement ponctuel : toujours retenu, même face à 3 fiches observées.
  const ev = fiche({ id: 'ev', categorie: 'ciel', dates: [['2026-12-13', '2026-12-15']] });
  const vues = ['a', 'b', 'c'].map((id) => fiche({ id: `vue-${id}`, categorie: 'ciel', mois: [12], poids: 3 }));
  const obs3 = new Map(vues.map((f) => [f.id, { jours: 0 }]));
  for (const d of ['2026-12-13', '2026-12-14', '2026-12-15']) {
    assert.ok(ids(choisir([...vues, ev], {}, d, { recalculer: false, observations: obs3 })).includes('ev'), d);
  }
});
