// Chargement des fixtures pour les tests.
import { readFileSync } from 'node:fs';

const lire = (p) => {
  const t = readFileSync(new URL(`./fixtures/${p}`, import.meta.url), 'utf8').trim();
  return t ? JSON.parse(t) : [];
};

export const openMeteo = () => lire('open-meteo.json');
export const fiches = () => ['animaux', 'plantes', 'ciel', 'sensoriel', 'insolite']
  .flatMap((c) => lire(`data/fiches-${c}.json`));
