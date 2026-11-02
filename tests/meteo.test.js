import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculerConditions, resumeMeteo, urlMeteo, chargerMeteo } from '../js/meteo.js';
import { openMeteo } from './aide.js';

test('conditions météo du jour de la fixture (2026-11-02, 9 h)', () => {
  const { conditions: c, affichage: a } = calculerConditions(openMeteo(), '2026-11-02', 9);
  assert.equal(c.pluie_recente, true, '6 mm la veille au soir, dans les 36 h');
  assert.equal(c.pluie_aujourdhui, false, '0,4 mm < 2 mm');
  assert.equal(c.sec, false, '6 mm sur les 3 jours précédents');
  assert.equal(c.vent, true, 'rafales 42 km/h ≥ 35');
  assert.equal(c.gel, false);
  assert.equal(c.froid, false, 'max 13,4 °C');
  assert.equal(c.chaud, false);
  assert.equal(c.soleil, false);
  assert.equal(c.couvert, true, 'code 3');
  assert.equal(c.brouillard, false);
  assert.equal(c.jours_courts, true, 'coucher 17 h 50');
  assert.equal(c.jours_longs, false);
  assert.equal(a.coucher, '17 h 50');
  assert.equal(a.tmin, 6);
  assert.equal(a.tmax, 13);
  assert.equal(a.texte, 'Ciel couvert');
});

test('pluie récente : fenêtre de 36 h seulement', () => {
  // Au 2026-11-03 9 h (fictif), la pluie du 1er à 18-21 h est à plus de 36 h.
  const d = openMeteo();
  d.daily.time[3] = '2026-11-02';
  const { conditions } = calculerConditions(d, '2026-11-01', 6);
  assert.equal(conditions.pluie_recente, false, 'à 6 h le 1er, rien dans les 36 h précédentes');
  const soir = calculerConditions(d, '2026-11-02', 23).conditions;
  assert.equal(soir.pluie_recente, true);
});

test('sec, gel, froid, chaud, soleil, brouillard, pluie du jour', () => {
  const d = openMeteo();
  d.daily.precipitation_sum = [0, 0.3, 0.2, 5];
  d.daily.weather_code[3] = 45;
  d.daily.temperature_2m_min[3] = -1;
  d.daily.temperature_2m_max[3] = 8;
  d.daily.wind_gusts_10m_max[3] = 34.9;
  d.hourly.precipitation = d.hourly.precipitation.map(() => 0);
  let c = calculerConditions(d, '2026-11-02', 9).conditions;
  assert.equal(c.sec, true, '0,5 mm < 1 mm sur 3 jours');
  assert.equal(c.pluie_aujourdhui, true);
  assert.equal(c.pluie_recente, false);
  assert.equal(c.gel, true);
  assert.equal(c.froid, true);
  assert.equal(c.vent, false);
  assert.equal(c.brouillard, true);
  assert.equal(c.couvert, false);
  assert.equal(c.soleil, false);

  d.daily.weather_code[3] = 1;
  d.daily.temperature_2m_max[3] = 25;
  d.daily.sunset[3] = '2026-11-02T21:40';
  c = calculerConditions(d, '2026-11-02', 9).conditions;
  assert.equal(c.soleil, true);
  assert.equal(c.chaud, true);
  assert.equal(c.jours_longs, true);
  assert.equal(c.jours_courts, false);

  d.daily.weather_code[3] = 61;
  assert.equal(calculerConditions(d, '2026-11-02', 9).conditions.couvert, true, 'pluie → couvert');
});

test('date absente → erreur', () => {
  assert.throws(() => calculerConditions(openMeteo(), '2030-01-01'));
});

test('résumé météo en français', () => {
  assert.equal(resumeMeteo(0).texte, 'Grand soleil');
  assert.equal(resumeMeteo(63).texte, 'Pluie');
  assert.equal(resumeMeteo(95).texte, 'Orages');
});

test('URL Open-Meteo : 3 jours d\'historique, fuseau de Paris', () => {
  const u = new URL(urlMeteo('2026-11-02'));
  assert.equal(u.searchParams.get('start_date'), '2026-10-30');
  assert.equal(u.searchParams.get('end_date'), '2026-11-02');
  assert.equal(u.searchParams.get('timezone'), 'Europe/Paris');
  assert.match(u.searchParams.get('daily'), /wind_gusts_10m_max/);
});

test('chargerMeteo : échec réseau → mode dégradé sans exception', async () => {
  const r = await chargerMeteo('2026-11-02', 9, { fetchFn: async () => { throw new Error('hors ligne'); } });
  assert.equal(r.disponible, false);
  const r2 = await chargerMeteo('2026-11-02', 9, { fetchFn: async () => ({ ok: false, status: 500 }) });
  assert.equal(r2.disponible, false);
  const r3 = await chargerMeteo('2026-11-02', 9, { fetchFn: async () => ({ ok: true, json: async () => openMeteo() }) });
  assert.equal(r3.disponible, true);
  assert.equal(r3.conditions.vent, true);
});
