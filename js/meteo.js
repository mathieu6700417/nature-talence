// Météo du jour via Open-Meteo (gratuit, sans clé) + calcul des conditions.
// `calculerConditions` est pure (testable sous Node avec un JSON de fixture) ;
// `chargerMeteo` fait l'appel réseau (timeout ~6 s) et ne lève jamais : en cas d'échec,
// elle renvoie `{ disponible: false }` (mode dégradé décrit dans SPEC.md).

import { TALENCE, ajouterJours, formatHeure, conditionsJour } from './astro.js';

export const CLES_METEO = [
  'pluie_recente', 'pluie_aujourdhui', 'sec', 'vent', 'gel',
  'froid', 'chaud', 'soleil', 'couvert', 'brouillard',
];

const API = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 6000;

/** Codes météo WMO → résumé français + emoji. */
export function resumeMeteo(code) {
  if (code === 0) return { texte: 'Grand soleil', emoji: '☀️' };
  if (code === 1) return { texte: 'Plutôt ensoleillé', emoji: '🌤️' };
  if (code === 2) return { texte: 'Soleil et nuages', emoji: '⛅' };
  if (code === 3) return { texte: 'Ciel couvert', emoji: '☁️' };
  if (code === 45 || code === 48) return { texte: 'Brouillard', emoji: '🌫️' };
  if (code >= 51 && code <= 57) return { texte: 'Bruine', emoji: '🌦️' };
  if (code >= 61 && code <= 67) return { texte: 'Pluie', emoji: '🌧️' };
  if (code >= 71 && code <= 77) return { texte: 'Neige', emoji: '🌨️' };
  if (code >= 80 && code <= 82) return { texte: 'Averses', emoji: '🌦️' };
  if (code === 85 || code === 86) return { texte: 'Averses de neige', emoji: '🌨️' };
  if (code >= 95) return { texte: 'Orages', emoji: '⛈️' };
  return { texte: 'Temps variable', emoji: '🌥️' };
}

function estPluvieux(code) {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
}

/** "2026-11-02T17:32" → minutes depuis minuit (heure locale fournie par l'API). */
function minutesDe(isoHeure) {
  const [h, m] = isoHeure.slice(11, 16).split(':').map(Number);
  return h * 60 + m;
}

const somme = (arr) => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

/**
 * Calcule les conditions météo d'un jour à partir d'une réponse Open-Meteo.
 * @param {object} data réponse JSON (daily + hourly, timezone Europe/Paris)
 * @param {string} dateISO jour visé, "AAAA-MM-JJ" (doit figurer dans data.daily.time)
 * @param {number} [heureRef] heure locale de référence (0-23) pour la fenêtre « pluie récente »
 *   (en pratique : l'heure actuelle ; 9 h par défaut pour une date simulée)
 * @returns {{conditions: object, affichage: object}}
 */
export function calculerConditions(data, dateISO, heureRef = 9) {
  const daily = data?.daily;
  const i = daily?.time?.indexOf(dateISO) ?? -1;
  if (i < 0) throw new Error(`Date ${dateISO} absente de la réponse météo`);

  const code = daily.weather_code[i];
  const tmax = daily.temperature_2m_max[i];
  const tmin = daily.temperature_2m_min[i];
  const pluieJour = daily.precipitation_sum[i] ?? 0;
  const rafales = daily.wind_gusts_10m_max[i] ?? 0;
  const coucher = daily.sunset?.[i] ? minutesDe(daily.sunset[i]) : null;
  const lever = daily.sunrise?.[i] ? minutesDe(daily.sunrise[i]) : null;

  // Pluie récente : cumul horaire sur les 36 h précédant l'heure de référence.
  let pluie36h;
  const hourly = data.hourly;
  const ref = `${dateISO}T${String(heureRef).padStart(2, '0')}:00`;
  const j = hourly?.time?.indexOf(ref) ?? -1;
  if (j >= 0 && Array.isArray(hourly.precipitation)) {
    pluie36h = somme(hourly.precipitation.slice(Math.max(0, j - 36), j));
  } else {
    // Repli : cumul de la veille + aujourd'hui (journalier).
    pluie36h = somme(daily.precipitation_sum.slice(Math.max(0, i - 1), i + 1));
  }

  // Sec : moins de 1 mm sur les 3 jours précédents.
  const pluie3j = somme(daily.precipitation_sum.slice(Math.max(0, i - 3), i));

  const conditions = {
    pluie_recente: pluie36h >= 1,
    pluie_aujourdhui: pluieJour >= 2,
    sec: pluie3j < 1,
    vent: rafales >= 35,
    gel: tmin <= 0,
    froid: tmax <= 9,
    chaud: tmax >= 25,
    soleil: code >= 0 && code <= 2,
    couvert: code === 3 || estPluvieux(code),
    brouillard: code === 45 || code === 48,
    ...(coucher != null ? conditionsJour(coucher) : {}),
  };

  return {
    conditions,
    affichage: {
      ...resumeMeteo(code),
      code,
      tmin: Math.round(tmin),
      tmax: Math.round(tmax),
      pluie: Math.round(pluieJour * 10) / 10,
      rafales: Math.round(rafales),
      coucherMinutes: coucher,
      coucher: coucher != null ? formatHeure(coucher) : null,
      lever: lever != null ? formatHeure(lever) : null,
    },
  };
}

/** URL Open-Meteo pour un jour donné (3 jours d'historique inclus). */
export function urlMeteo(dateISO, { lat = TALENCE.lat, lon = TALENCE.lon } = {}) {
  const p = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max,sunrise,sunset',
    hourly: 'precipitation',
    timezone: 'Europe/Paris',
    start_date: ajouterJours(dateISO, -3),
    end_date: dateISO,
  });
  // NB : start_date/end_date équivaut à past_days=3 + aujourd'hui, et permet aussi
  // de simuler une date proche (?date=…) ; hors de la fenêtre de l'API → mode dégradé.
  return `${API}?${p}`;
}

/**
 * Charge la météo. Ne lève jamais.
 * @returns {Promise<{disponible:true, conditions, affichage} | {disponible:false, erreur:string}>}
 */
export async function chargerMeteo(dateISO, heureRef, { fetchFn = globalThis.fetch } = {}) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), TIMEOUT_MS);
  try {
    const rep = await fetchFn(urlMeteo(dateISO), { signal: ctrl?.signal });
    if (!rep.ok) throw new Error(`HTTP ${rep.status}`);
    const data = await rep.json();
    return { disponible: true, ...calculerConditions(data, dateISO, heureRef) };
  } catch (e) {
    return { disponible: false, erreur: e?.name === 'AbortError' ? 'délai dépassé' : String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}
