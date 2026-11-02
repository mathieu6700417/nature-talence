import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lienItineraire, plateforme, pointValide } from '../js/itineraire.js';
import { fiches } from './aide.js';

const P = { lat: 44.8071, lon: -0.5862, repere: 'Rue de test' };

test('plateforme : iOS, iPadOS, Android, autre', () => {
  assert.equal(plateforme({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }), 'ios');
  assert.equal(plateforme({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 }), 'ios');
  assert.equal(plateforme({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 }), 'autre');
  assert.equal(plateforme({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)' }), 'android');
  assert.equal(plateforme({ userAgent: 'Mozilla/5.0 (Windows NT 10.0)' }), 'autre');
  assert.equal(plateforme(undefined), 'autre');
});

test('liens d\'itinéraire à pied', () => {
  assert.equal(lienItineraire(P, 'ios'), 'https://maps.apple.com/?daddr=44.8071,-0.5862&dirflg=w');
  assert.equal(lienItineraire(P, 'android'), 'geo:44.8071,-0.5862?q=44.8071,-0.5862');
  const osm = new URL(lienItineraire(P, 'autre'));
  assert.equal(osm.hostname, 'www.openstreetmap.org');
  assert.equal(osm.searchParams.get('engine'), 'fossgis_osrm_foot');
  assert.equal(osm.searchParams.get('route'), ';44.8071,-0.5862');
});

test('point absent ou invalide → pas de lien', () => {
  assert.equal(pointValide(null), false);
  assert.equal(lienItineraire(null), null);
  assert.equal(lienItineraire({ repere: 'sans coordonnées' }), null);
  assert.equal(lienItineraire({ lat: '44.8', lon: -0.58 }), null);
  assert.equal(lienItineraire({ lat: 120, lon: -0.58 }), null);
});

test('fixtures : point null ou complet (lat, lon, repère)', () => {
  for (const f of fiches()) {
    assert.ok('point' in f, `${f.id} sans champ point`);
    if (f.point) {
      assert.ok(pointValide(f.point), f.id);
      assert.ok(f.point.repere?.length > 10, f.id);
    }
  }
});
