# Nature autour de Talence centre — spécification

Site statique (HTML/CSS/JS vanilla, modules ES, aucun build), publié sur GitHub Pages.
Chaque jour : **3 idées** de choses à observer dans la nature à pied (≈ 1,5 km) autour de
Talence centre (Forum des Halles, Peixotto, Chenes-Margaut, campus…), pour un parent et son tout-petit.

## Usage
- Le parent consulte le site **à la maison avant de sortir**. L'enfant ne regarde PAS l'écran :
  les photos servent au parent pour reconnaître la chose. Les fiches disent quoi faire **dehors**.
- Sélecteur d'âge **2-3 ans / 3-5 ans** (mémorisé en localStorage, défaut 2-3).
- Chaque fiche a aussi un volet **« Pour toi »** (adulte curieux qui apprend en même temps).
- Site **public** : aucune donnée perso (pas de prénom, pas d'âge précis, pas de « chez moi »).
  Ton : « autour de Talence centre », tutoiement du parent.

## Arborescence
```
index.html
css/style.css
js/app.js          UI
js/meteo.js        appel Open-Meteo + calcul des conditions
js/astro.js        phase de lune, lever/coucher (si pas fourni par l'API)
js/selection.js    moteur de choix (pur, testable sous Node)
js/observations.js observations récentes iNaturalist : requête, filtrage, lieu, appariement (pur sauf l'appel réseau)
data/lieux.json
data/points-interet.json   points open data curés (voir plus bas)
scripts/extraire-open-data.py   extraction hors ligne (python3 -I)
data/fiches-animaux.json
data/fiches-plantes.json
data/fiches-ciel.json
data/fiches-sensoriel.json
data/fiches-insolite.json
tests/*.test.js    node --test
```

## data/lieux.json
```json
[{
  "id": "parc-peixotto",
  "nom": "Parc Peixotto",
  "type": "parc | square | rue | campus | jardin | bois",
  "distance": "≈ 600 m",
  "description": "Une phrase : à quoi ressemble le lieu.",
  "elements": ["grand cèdre près du château", "pièce d'eau avec canards", "pelouse"],
  "lat": 44.80, "lon": -0.59
}]
```
Identifiant spécial `partout` = n'importe quelle rue/trottoir/jardin du quartier (pas dans le fichier).

Champs optionnels (certains lieux seulement) : `adresse`, `horaires`, `poussette`, `eau`, `aire_jeux`,
`bancs`, `notes`, `distance_lisiere` (bord du site le plus proche du Forum, pour les grands sites), et, issus
de l'open data (`data/sources/open-data-synthese.md`) :
- `vers` : **obligatoire pour tout lieu**, formule toute faite commençant par « vers » (« vers le parc
  Peixotto », « vers le campus du Haut-Carré »). Évite toute règle grammaticale côté site ; testé.
- `canopee` : % de canopée de la maille de 232 m qui contient le lieu (Métropole, `met_vegetation_urbaine`).
- `fraicheur` : écart de température minimal en °C (négatif) de la thermographie du 17 juin 2022 pour les
  mailles à −3 °C ou moins (`ri_icu_ifu_s`) ; absent si le lieu n'est pas dans une zone fraîche.
- `points` : ids des points de `data/points-interet.json` dont `lieu` est ce lieu (dérivé, testé).

## data/points-interet.json
Points curés issus de l'open data (Bordeaux Métropole, OpenStreetMap, PCRS), produits à partir de
`data/sources/points-squelette.json` par `scripts/extraire-open-data.py` puis relus à la main. Le site
ne contacte jamais ces portails. Rayon : 1 600 m autour du Forum (44.8065, -0.5880).
```json
[{
  "id": "pi-puits-peixotto",
  "type": "puits",
  "nom": "Puits du parc Peixotto",
  "lat": 44.80831, "lon": -0.59019,
  "distance_m": 265,
  "lieu": "parc-peixotto",
  "repere": "Dans le parc Peixotto, à une centaine de mètres de l'allée Peixotto…",
  "source": { "jeu": "OpenStreetMap", "ref": "node/1338095729", "url": "https://www.openstreetmap.org/node/1338095729", "date": "2026-11-03" },
  "autres_sources": ["…"],
  "confiance": "probable",
  "verifier": true,
  "saison": null,
  "acces": "…",
  "notes": "…"
}]
```
- `id` : `pi-…`, unique. `type` : énumération fermée (testée) : `eau_potable`, `fontaine`, `puits`,
  `aire_jeux`, `jardin_partage`, `cueillette`, `bassin`, `point_eau`, `canal`, `prairie_fauche`, `chenaie`,
  `roseliere`, `haie_arboree`, `vigne`, `peupleraie`, `friche`, `fourre_prunellier`, `prairie_humide`,
  `conifere`, `arbre_autre`, `ilot_fraicheur`, `arbre_espece`, `tour_hirondelles`, `ruisseau`, `etang`,
  `zone_humide`, `verger`, `prairie`, `panneau_nature`.
- `lat`/`lon` à moins de 1,7 km du Forum ; `distance_m` = vol d'oiseau depuis le Forum.
- `lieu` : id de `lieux.json` si le point est dans le lieu ou à moins de 150 m de son centre, sinon `null`.
- `repere` : écrit à la main (rue, côté, croisement, élément visible ; jamais de numéro de maison, testé).
- `source` : une source principale ; `autres_sources` (optionnel) : sources concordantes.
- `confiance` : `certain` (deux sources concordantes, ou Ville/PCRS + image Panoramax) ou `probable` (une
  seule source). `verifier` : `true` si OpenStreetMap ou PCRS seul (testé), ou si l'accès est douteux.
- `saison` : mois d'intérêt (liste 1-12) ou `null`. Les polygones ne sont jamais stockés (centroïde seulement).
- `acces` et `notes` : optionnels, texte libre (pas de donnée privée).

## Format d'une fiche (tableau JSON par fichier)
```json
{
  "id": "escargots-apres-pluie",
  "categorie": "animal | plante | ciel | sensoriel | insolite",
  "titre": "Les escargots sont de sortie",
  "lieux": ["partout", "parc-peixotto"],
  "ou": "Au pied des murets et sur les feuilles basses, côté ombre.",
  "point": {
    "lat": 44.8071, "lon": -0.5862,
    "repere": "Rue X, trottoir de gauche en venant du Forum, juste après le croisement avec la rue Y : le grand arbre au tronc blanc.",
    "photo_lieu": { "url": "https://…panoramax…", "credit": "Auteur — CC BY-SA 4.0", "source": "https://…" }
  },
  "mois": [3,4,5,6,9,10,11],
  "requiert": ["pluie_recente"],
  "exclut": ["gel"],
  "moment": null,
  "poids": 2,
  "reperes": "Pour toi, pour le reconnaître : coquille brune striée, 3 cm…",
  "enfant": {
    "2-3": { "mot": "escargot", "geste": "Poser le doigt à côté (pas dessus) et attendre qu'il sorte ses cornes.", "phrase": "Escargot, montre tes cornes !" },
    "3-5": { "mot": "les cornes / les yeux", "geste": "…", "phrase": "…" }
  },
  "adulte": {
    "nom": "Escargot petit-gris",
    "latin": "Cornu aspersum",
    "anecdote": "Fait surprenant et VRAI.",
    "pourquoi_maintenant": "Pourquoi on le voit à cette période / avec cette météo.",
    "confusion": "Comment le distinguer d'une espèce proche (ou null)."
  },
  "photo": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/.../480px-....jpg",
    "credit": "Auteur — CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File:....jpg"
  }
}
```
- `point` : l'endroit PRÉCIS où aller (obligatoire sauf fiches `partout` génériques, où il peut être null).
  `repere` doit permettre de retrouver l'endroit sans carte : rue, côté, croisement, élément visible
  (jamais de numéro de maison). `photo_lieu` (optionnelle, Panoramax/Mapillary libre) montre le coin.
  `pi` (optionnel) : id d'un point de `data/points-interet.json` sur lequel s'appuie la fiche
  (`"pi": "pi-puits-peixotto"`) ; testé par `tests/donnees.test.js` (le point doit exister). Une fiche
  qui s'appuie sur un point `verifier: true` porte elle aussi `verifier: true`.
  L'interface affiche un bouton « Y aller » (lien `geo:` sur Android, Apple Plans sur iOS,
  repli OpenStreetMap/Google Maps itinéraire à pied).
- `attention` : null ou une phrase courte de sécurité affichée en évidence (ex. « Très toxique : on
  regarde les fleurs, on ne touche pas, rien à la bouche. »). Obligatoire pour toute plante toxique,
  chenilles processionnaires, frelons, champignons, eau, etc. (voir data/sources/securite.json).
- `dates` : optionnel, liste de plages `[["2026-12-13","2026-12-15"], …]` pour les événements datés
  (ciel). Si présent, la fiche n'est éligible QUE dans ces plages (en plus de `requiert`/`exclut`) et
  elle n'est favorisée que si la plage EN COURS dure ≤ 7 jours (événement ponctuel) : poids ×6,
  exemptée d'anti-répétition, et toujours retenue parmi les 3 idées le jour J (avant la diversité
  des catégories ; s'il y en a plus de 3, les plages les plus courtes d'abord). Pour une plage plus
  longue (ex. « Saturne visible le soir » sur 4 mois) la date ne fait que restreindre la saison :
  poids normal (`poids`) et anti-répétition normale.
- `verifier` : true si l'élément ne repose que sur une image de rue ancienne ou une identification
  « probable » → l'interface affiche discrètement « à confirmer sur place ».
- `mois` : mois (1-12) où c'est observable à Talence. Ne pas mettre 12 mois par paresse.
- `poids` : 1 = banal, 2 = sympa, 3 = rare/magique (la sélection favorise un peu les 3 quand éligibles).
- `moment` : null, ou `"matin"`, `"journee"`, `"coucher_soleil"`, `"nuit"` (texte affiché : « Au coucher du soleil, vers {coucher} »).
- `requiert` : TOUTES ces conditions doivent être vraies ce jour-là. `exclut` : AUCUNE ne doit l'être.
- Pour `ciel`/`insolite` sans photo pertinente, `photo` peut être `null`.
- `adulte.taxons` : optionnel, liste de noms latins (`["Cornu aspersum", "Helix"]`) pour une fiche qui
  couvre plusieurs espèces ou un genre. S'il existe, il remplace `adulte.latin` pour l'appariement
  avec les observations iNaturalist (voir plus bas). Un nom d'un seul mot (ou « Genre sp. ») désigne
  un genre.

## Observations récentes (iNaturalist)
Détail : [docs/spec-observations-open-data.md](docs/spec-observations-open-data.md), §2.
- À l'ouverture, en parallèle de la météo : observations des 14 derniers jours (date du jour incluse)
  à 1,5 km du Forum, élargi à 3 km s'il en reste moins de 5 après filtrage ; qualités `research` et
  `needs_id`, au moins au genre, avec photo, non obscurcies. Délai 8 s ; en cas d'échec, ni badge ni
  bloc, aucun message (`console.warn` seulement). Cache `localStorage` `nature-talence.observations`
  (clé `<date>|<rayon>`) valable 6 h.
- Appariement par nom latin normalisé (`adulte.taxons`, sinon `adulte.latin`) : observation à l'espèce
  ↔ fiche du même binôme ou fiche au genre ; observation au genre ↔ fiche au genre seulement. Une fiche
  appariée a un poids ×3 (`BONUS_OBSERVEE`) ; pas d'exemption d'anti-répétition ; l'éligibilité
  (saison, météo) ne change pas ; les événements ponctuels restent prioritaires.
- Interface : badge « 👀 Vu hier vers le parc Peixotto » sur les cartes appariées, bloc « Vu ces 14
  derniers jours près d'ici » (8 lignes au plus) sous les idées. Lieu = `lieux.json[].vers` du lieu
  connu le plus proche (< 250 m), sinon distance et direction depuis le Forum ; rien si la précision
  dépasse 500 m. Jamais `place_guess`, jamais de pseudo hors crédit photo. Photo de l'observateur
  seulement sous licence Creative Commons (crédit « pseudo — CC BY-NC »), sinon photo Wikimedia de la
  fiche appariée, sinon pictogramme.
- Débogage : `?inat=aucune` (désactivé), `?inat=hs` (panne simulée) ; avec `?date=`, la fenêtre glisse.

## Conditions calculées chaque jour (clés autorisées dans requiert/exclut)
| clé | définition |
|---|---|
| `pluie_recente` | précipitations des dernières 24-36 h ≥ 1 mm |
| `pluie_aujourdhui` | précipitations prévues aujourd'hui ≥ 2 mm |
| `sec` | < 1 mm sur les 3 derniers jours |
| `vent` | rafales max du jour ≥ 35 km/h |
| `gel` | température min du jour ≤ 0 °C |
| `froid` | température max du jour ≤ 9 °C |
| `chaud` | température max du jour ≥ 25 °C |
| `soleil` | code météo du jour 0-2 (dégagé / peu nuageux) |
| `couvert` | code météo du jour 3 ou pluie |
| `brouillard` | code météo 45/48 |
| `lune_visible_soir` | lune entre premier croissant et pleine (illumination ≥ 25 %, croissante ou pleine ±2 j) |
| `lune_visible_matin` | lune décroissante (illumination ≥ 25 %) — visible le matin |
| `pleine_lune` | pleine lune ±1 jour |
| `jours_longs` | coucher du soleil après 20 h 30 |
| `jours_courts` | coucher du soleil avant 18 h 30 |

Météo : Open-Meteo (gratuit, sans clé), Talence ≈ lat 44.8065, lon -0.5880,
`timezone=Europe/Paris`, `past_days=3`. Si l'API échoue : seules les conditions astronomiques
sont calculées, les fiches qui `requiert` une condition météo sont écartées, message discret.

## Photos
Wikimedia Commons uniquement, licence libre, crédit = auteur + licence. URL = miniature
`upload.wikimedia.org/.../thumb/.../480px-...` vérifiée (HTTP 200). Récupérer auteur/licence via
l'API `https://commons.wikimedia.org/w/api.php?action=query&titles=File:X&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480&format=json`.
