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

## Tests

```sh
npm test   # node --test, aucune dépendance (Node ≥ 20)
```

Fixtures dans `tests/fixtures/` (fiches factices, réponse Open-Meteo factice). Pour voir la page
avec les fixtures, copie `tests/fixtures/data/*` dans un **dossier à part** avec `index.html`,
`css/`, `js/` et `tests/fixtures/photo.svg` (ne pas écraser `data/`).

## Organisation

| fichier | rôle |
|---|---|
| `js/meteo.js` | appel Open-Meteo (timeout 6 s) + `calculerConditions` (pure) |
| `js/astro.js` | phase de lune (Meeus), lever/coucher du soleil (NOAA), conditions astro |
| `js/selection.js` | moteur de choix pur : `choisir`, `autre` |
| `js/itineraire.js` | lien « Y aller » (Apple Plans / `geo:` / OpenStreetMap) |
| `js/app.js` | interface |
| `data/` | `lieux.json` et `fiches-*.json` |

Format des fiches et des lieux, liste des conditions météo/astro : voir [SPEC.md](SPEC.md).

## Crédits

Météo : [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Photos : [Wikimedia Commons](https://commons.wikimedia.org/),
auteur et licence sous chaque image.
