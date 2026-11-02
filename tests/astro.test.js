import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lune, soleil, conditionsAstro, formatHeure, instantPhase, decalageParis } from '../js/astro.js';

// Dates de référence (IMCCE / NASA) : pleines lunes 2026-03-03 11:38 UTC (éclipse),
// 2026-08-28 04:18 UTC (éclipse), 2026-11-24 14:53 UTC ; nouvelle lune 2026-11-09 07:02 UTC.
const proche = (ms, isoUTC, toleranceH = 2) =>
  assert.ok(Math.abs(ms - Date.parse(isoUTC)) < toleranceH * 3600000, `${new Date(ms).toISOString()} ≠ ${isoUTC}`);

test('instants des phases (Meeus) à ±2 h', () => {
  proche(instantPhase(323.5), '2026-03-03T11:38Z');
  proche(instantPhase(329.5), '2026-08-28T04:18Z');
  proche(instantPhase(332.5), '2026-11-24T14:53Z');
  proche(instantPhase(332), '2026-11-09T07:02Z');
});

test('pleine lune le 2026-11-24', () => {
  const l = lune('2026-11-24');
  assert.equal(l.phase, 'pleine');
  assert.equal(l.nom, 'Pleine lune');
  assert.equal(l.emoji, '🌕');
  assert.ok(l.illumination > 0.98);
  assert.equal(conditionsAstro('2026-11-24').pleine_lune, true);
  assert.equal(conditionsAstro('2026-11-23').pleine_lune, true, '±1 jour');
  assert.equal(conditionsAstro('2026-11-25').pleine_lune, true, '±1 jour');
  assert.equal(conditionsAstro('2026-11-27').pleine_lune, false);
});

test('nouvelle lune le 2026-11-09 : lune invisible', () => {
  const l = lune('2026-11-09');
  assert.equal(l.phase, 'nouvelle');
  assert.ok(l.illumination < 0.02);
  const c = conditionsAstro('2026-11-09');
  assert.equal(c.lune_visible_soir, false);
  assert.equal(c.lune_visible_matin, false);
});

test('lune croissante → soir ; décroissante → matin', () => {
  const soir = conditionsAstro('2026-11-18'); // ≈ premier quartier + 1 j
  assert.equal(soir.lune_visible_soir, true);
  assert.equal(soir.lune_visible_matin, false);
  const matin = conditionsAstro('2026-11-30');
  assert.equal(matin.lune_visible_matin, true);
  assert.equal(matin.lune_visible_soir, false);
  assert.equal(lune('2026-11-30').croissante, false);
});

test('noms de phase en français', () => {
  assert.equal(lune('2026-11-13').nom, 'Premier croissant');
  assert.equal(lune('2026-12-01').nom, 'Dernier quartier');
});

test('soleil à Talence : jours courts en novembre, longs en juin', () => {
  const nov = soleil('2026-11-02');
  assert.ok(Math.abs(nov.coucher - (17 * 60 + 50)) < 10, formatHeure(nov.coucher));
  const juin = soleil('2026-06-21');
  assert.ok(juin.coucher > 21 * 60 + 40 && juin.coucher < 22 * 60 + 10, formatHeure(juin.coucher));
  assert.equal(conditionsAstro('2026-11-02').jours_courts, true);
  assert.equal(conditionsAstro('2026-06-21').jours_longs, true);
  assert.equal(conditionsAstro('2026-03-10').jours_longs, false);
  assert.equal(conditionsAstro('2026-03-10').jours_courts, false);
});

test('heure d\'été à Paris', () => {
  assert.equal(decalageParis(Date.parse('2026-03-29T00:59Z')), 1);
  assert.equal(decalageParis(Date.parse('2026-03-29T01:00Z')), 2);
  assert.equal(decalageParis(Date.parse('2026-10-25T00:59Z')), 2);
  assert.equal(decalageParis(Date.parse('2026-10-25T01:00Z')), 1);
});

test('format de l\'heure', () => {
  assert.equal(formatHeure(17 * 60 + 32), '17 h 32');
  assert.equal(formatHeure(8 * 60 + 5), '8 h 05');
});
