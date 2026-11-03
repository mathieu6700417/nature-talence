# Nature autour de Talence centre

Site statique (HTML/CSS/JS vanilla, modules ES, sans build ni dépendance) : chaque jour,
**3 idées** de choses à observer à pied autour de Talence centre avec un tout-petit, choisies
selon la saison, la météo du jour (Open-Meteo), la lune et l'heure du coucher du soleil.
Le parent consulte la page avant de sortir ; les fiches disent quoi faire dehors.

## Lancer en local

```sh
python3 -m http.server 8000
# puis http://localhost:8000
```

Paramètres de débogage (détail en tête de `js/app.js`) :

- `?date=2026-11-24` : simule une autre date ;
- `?meteo=pluie_recente,vent` : force des conditions (sans appel réseau) ; `?meteo=aucune`, `?meteo=hs` (panne simulée).
- `?inat=aucune` : pas d'appel à iNaturalist ; `?inat=hs` : panne simulée (ni badge ni bloc d'observations).
  Les observations sont gardées 6 h en `localStorage` (`nature-talence.observations`) : vide-le pour forcer un nouvel appel.

## Tests

```sh
npm test   # node --test, aucune dépendance (Node ≥ 20)
```

Fixtures dans `tests/fixtures/` (fiches factices, réponse Open-Meteo factice, réponse iNaturalist
réelle du 3 novembre 2026 anonymisée et réduite dans `inaturalist.json`). Pour voir la page
avec les fixtures, copie `tests/fixtures/data/*` dans un **dossier à part** avec `index.html`,
`css/`, `js/` et `tests/fixtures/photo.svg` (ne pas écraser `data/`).

## Organisation

| fichier | rôle |
|---|---|
| `js/meteo.js` | appel Open-Meteo (timeout 6 s) + `calculerConditions` (pure) |
| `js/astro.js` | phase de lune (Meeus), lever/coucher du soleil (NOAA), conditions astro |
| `js/selection.js` | moteur de choix pur : `choisir`, `autre` (option `observations` : poids ×3) |
| `js/observations.js` | observations iNaturalist des 14 derniers jours (délai 8 s, rayon 1,5 → 3 km) : filtrage, lieu, appariement aux fiches (`adulte.taxons` ou `adulte.latin`) |
| `js/itineraire.js` | lien « Y aller » (Apple Plans / `geo:` / OpenStreetMap) |
| `js/app.js` | interface |
| `data/` | `lieux.json` et `fiches-*.json` |

Format des fiches et des lieux (dont `adulte.taxons`), liste des conditions météo/astro,
observations iNaturalist : voir [SPEC.md](SPEC.md).

## Crédits

Météo : [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Photos : [Wikimedia Commons](https://commons.wikimedia.org/),
auteur et licence sous chaque image. Observations : [iNaturalist](https://www.inaturalist.org/)
(observations de ses membres, licences indiquées sous chaque photo ; seules les photos sous licence
Creative Commons sont affichées).
