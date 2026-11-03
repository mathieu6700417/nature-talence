# Spécification — Observations en direct (iNaturalist) et lieux enrichis par l'open data

Statut : **implémenté** le 2026-11-03 (A, B1, B2 : 17 fiches créées, 14 complétées ; voir git log). Décisions prises avec Mathieu par questions
une par une ; toutes les sources citées ont été interrogées le 2026-11-03 (chiffres ci-dessous).
Ce document complète SPEC.md ; en cas d'implémentation, les formats décrits ici seront reportés
dans SPEC.md et les briefs de docs/.

## 0. Résumé

Deux améliorations indépendantes, livrables séparément :

- **A. « Vu ces 14 derniers jours près d'ici »** : à l'ouverture, le site interroge l'API
  iNaturalist (gratuite, sans clé, CORS ouvert) pour les observations récentes autour du Forum
  des Halles. Deux effets : un **badge** sur les fiches du jour dont l'espèce vient d'être vue
  (et le moteur les favorise), et un **bloc séparé** sous les 3 idées qui liste ce que les
  voisins ont observé.
- **B. Lieux et points d'intérêt open data** : extraction hors ligne (script, résultats versionnés)
  depuis le portail open data de Bordeaux Métropole et OpenStreetMap, vers un nouveau fichier
  `data/points-interet.json`, un enrichissement de `data/lieux.json`, puis **15 à 25 nouvelles
  fiches** appuyées sur ces points (vigne, prairie de fauche, fontaine, puits, ruisseau, îlot de
  fraîcheur, conifères, catalpa, cueillette libre…), marquées « à confirmer » quand la source est
  OSM ou le PCRS seuls.

Décisions validées (questions une par une) :

| Question | Décision |
|---|---|
| Sources prioritaires | Observations en direct (iNaturalist) **et** lieux enrichis (open data) |
| Affichage des observations | Badge sur les fiches du jour **et** bloc séparé |
| Périmètre et fenêtre | Rayon adaptatif : 1,5 km, élargi à 3 km si moins de 5 observations ; 14 jours |
| Fiabilité | Observations confirmées (`research`) **et** en cours (`needs_id`) identifiées au moins au genre, avec photo ; mention « identification en cours » |
| Photos | Miniature de l'observateur seulement si licence Creative Commons, avec crédit et lien ; sinon photo Wikimedia de la fiche appariée ; sinon rien |
| Lieu affiché | Lieu connu le plus proche (< 250 m) sinon distance + direction depuis le Forum ; jamais le texte libre de l'observateur ; rien si coordonnées floues |
| Éléments open data | Faune aménagée, végétation et cultures, eau et confort (les trois) |
| Usage des données | Fichier de points + lieux enrichis + 15-25 nouvelles fiches |

Mathieu a précisé que le site est pour son usage privé : les choix de confidentialité ci-dessus
sont ceux recommandés, sans contrainte forte de sa part.

## 1. Vérifications faites le 2026-11-03

### 1.1 iNaturalist (API v1, `https://api.inaturalist.org/v1/observations`)

- En-tête `Access-Control-Allow-Origin: *` : appel possible depuis GitHub Pages, sans clé.
- Volume des 14 derniers jours (20 oct. → 3 nov. 2026), avec photo :

| Rayon | `research` seul | `research` + `needs_id` |
|---|---|---|
| 1,5 km | 6 | 17 |
| 3 km | 15 | 42 |

  Le rayon adaptatif et l'inclusion des `needs_id` sont donc nécessaires pour avoir du contenu.
- Champs utiles confirmés dans la réponse : `observed_on`, `quality_grade`, `obscured`,
  `geoprivacy`, `taxon_geoprivacy`, `positional_accuracy` (m), `geojson.coordinates` ([lon, lat]),
  `place_guess` (texte libre, parfois une rue précise : **ne jamais l'afficher**), `uri`,
  `taxon.name`, `taxon.rank`, `taxon.id`, `taxon.preferred_common_name` (en français avec
  `locale=fr&preferred_place_id=6753`), `photos[].license_code` (`cc-by-nc`… ou `null` = tous
  droits réservés), `photos[].attribution`, `photos[].url` (`…/square.jpg`, remplaçable par
  `small.jpg` 240 px ou `medium.jpg` 500 px).
- Exemples réels dans l'échantillon : faucon crécerelle (2 nov., Bègles), grue cendrée (29 oct.,
  route de Toulouse), tipule des prairies, marasme des oréades, un papillon identifié au genre.
- Conditions d'usage : pas de clé, mais limite recommandée de 1 requête/s et 10 000/jour :
  une requête par chargement, avec cache local de 6 h (voir 2.9).

### 1.2 Open data Bordeaux Métropole (`https://opendata.bordeaux-metropole.fr`, API Explore v2.1)

- API sans clé, CORS ouvert, quota 50 000 requêtes/jour. L'autre portail (`data.bordeaux-metropole.fr`,
  WFS) exige une clé : on ne l'utilise pas. L'extraction se fait **hors ligne** (script), jamais
  depuis le navigateur.
- Jeux utiles, comptés dans un rayon de 1 600 m autour du Forum (44.8065, -0.5880) :

| Jeu (`dataset_id`) | Contenu | Dans 1,6 km |
|---|---|---|
| `tal_pointseaulibreacces` | Points d'eau en libre accès (Ville de Talence) | 8 : Jardins de Bel Air, square Felhman, parc Peixotto, cimetière, place Albert Thomas, place 14-18, parc Pineau, église Notre-Dame |
| `tal_airesjeux` | Aires de jeux talençaises | 15 (Peixotto, Felhmann, Duguesclin, colonel Mol, château des Arts, bois Lafitte, Pineau, Caudérès, Triaire, Clos Michelet, René Maran, la Scierie, av. Racine, Bel Air, Jean Bouin) |
| `tal_jardinspartages` | Jardins partagés talençais | 9, dont « Espace en libre cueillette prévu à la plantation de petits arbustes à fruits (budget participatif) » à 44.81044, -0.58392 et « La Pt'ite Friche » à 44.80922, -0.57490 |
| `ec_parc_s` | Espaces naturels ouverts au public, avec description | 6 : Margaut (platanes, magnolia), Couvent (immenses platanes, chênes, marronniers, arbres fruitiers récents), Chanteclerc (sous-bois 6 000 m², charme, chêne), Curval (zelkova 4,45 m de circonférence), Soureil, Peixotto (« cygnes et canards », texte de 2012) |
| `to_hydro_s` | Surfaces d'eau | 15 : bassin public Peixotto, bassin de rétention « B.R. eau Thouars » (44.79373, -0.59413), 4 points d'eau naturels côté campus ouest, bassin de rétention 44.80921, -0.59542, canal 44.80046, -0.57950, fossés au sud |
| `ec_habitat_naturel_s` | Habitats naturels (typologie EUNIS, enjeu) | 85 polygones ; enjeu FORT : prairies fauchées thermo-atlantiques calcaires (44.80923, -0.59644 et 44.80896, -0.59746 : campus Haut-Carré, 730-790 m O), chênaie-charmaie (44.80901, -0.59866), chênaies à chêne tauzin et prairie à souchet bai (44.793, -0.594 : Thouars, 1,5 km SO) ; MOYEN : roselières (44.80376, -0.60519, 1,4 km O), haies arborescentes de chênes (44.80062, -0.59911 ; 44.81355, -0.60135) ; vignes (44.81056, -0.60358, 1,3 km O), plantation de peupliers (44.80276, -0.60408), friches à bromes, fourrés à prunellier (44.79457, -0.57701, 1,6 km SE, Villenave) |
| `cr_objet_nature_p` | PCRS, objets nature ponctuels (précision centimétrique) | 2 842 : 2 421 arbres feuillus, **54 conifères**, 10 « autres », 357 bacs. Conifères groupés : 8 vers 44.812, -0.592 (690 m NO), 8 + 7 + 3 vers 44.805, -0.602/-0.604 (campus ouest), 3 + 3 vers 44.809/44.810, -0.588 (280-390 m N) |
| `cr_objet_nature_l` | PCRS, objets nature linéaires | 563 haies, 2 546 bordures d'espaces verts, talus, fossés |
| `met_vegetation_urbaine` | Mailles de 232 m : % canopée, % herbacé, nombre d'arbres | 151 mailles ; les plus boisées : 58,7 % (44.7932, -0.5933, Thouars), 38,9 % (44.8095, -0.5778, Sourreil) |
| `ri_icu_ifu_s` | Îlots de chaleur/fraîcheur (thermographie 2022, écart en °C) | 35 mailles à −3 °C ou moins ; −5 °C à Sourreil (44.80987, -0.57902) et Thouars (44.79539, -0.59600) ; −4 °C au nord de Peixotto (44.80929, -0.59010) |
| `en_rpg_s` | Registre parcellaire graphique | **0** à 1,6 km ; 7 parcelles de vigne à 3 km (Villenave). Inutile ici : les vignes viennent de `ec_habitat_naturel_s` et d'OSM |
| `bor_abrisfaune`, `ec_entpa_p`, `ec_inv_protection_s` | Nichoirs de Bordeaux, entrées d'espaces naturels, zonages | 0 dans le rayon |

### 1.3 OpenStreetMap (Overpass, rayon 1 600 m) : 883 éléments

- **Arbres avec espèce : 127**, surtout un groupe au nord-est (44.812 à 44.820, -0.572 à -0.580 :
  tilleuls argentés et `Tilia × flavescens`, platanes, catalpas, magnolias, chêne vert, ifs, palmiers
  de Chine, arbre de Judée, micocoulier, érables) ; cyprès chauve et **peuplier noir** au parc
  Peixotto (44.80972, -0.58951) ; zelkova à Curvale ; 18 arbres au genre (platanes de Caudérès).
- **1 `man_made=nesting_site`** à 44.80893, -0.58335 (tour à hirondelles du parc Robespierre).
- Eau : 13 `drinking_water`, 6 `water_tap`, **4 puits** (`water_well` : 44.80831, -0.59019 au parc
  Peixotto ; 44.80949, -0.57209 ; 44.81601, -0.60312 ; 44.81545, -0.60041), 5 fontaines,
  **10 tronçons du ruisseau d'Ars à ciel ouvert** (dont 44.80942, -0.58480 à ≈ 420 m N et
  44.81043, -0.57567), étang Bonnefont (44.80878, -0.59364), 2 zones humides, bassins.
- Végétation : 4 vignes (dont Château La Mission Haut-Brion), 3 prairies (dont « Eco-pâturage »
  à 44.80719, -0.60668), 60 haies, 54 rangées d'arbres, 7 bois, 5 jardins familiaux.
- 1 panneau `board_type=wildlife` à 44.79339, -0.59298 (Thouars) ; 3 panneaux d'information.
- **Absents** du rayon : ruches, hôtels à insectes, nichoirs (aucun tag).

## 2. Amélioration A — « Vu ces 14 derniers jours près d'ici »

### 2.1 Comportement attendu

1. Au chargement, en parallèle de la météo, le site demande à iNaturalist les observations des
   14 derniers jours (date du jour incluse) dans un rayon de **1,5 km**. Si, après filtrage
   (2.3), il reste **moins de 5** observations, une seconde requête à **3 km** remplace la
   première ; le bloc indique alors « élargi à 3 km ».
2. Les observations sont appariées aux fiches (2.5). Les fiches appariées voient leur poids de
   tirage multiplié (2.6) et, si elles sont retenues, affichent un badge (2.7).
3. Sous les 3 idées, un bloc liste jusqu'à **8** espèces vues, une ligne par espèce (2.7).
4. En cas d'échec (réseau, délai > 8 s, réponse invalide, `?inat=hs`), ni badge ni bloc, aucun
   message d'erreur visible ; le reste de la page est inchangé.

### 2.2 Requête

```
https://api.inaturalist.org/v1/observations
  ?lat=44.8065&lng=-0.5880&radius=1.5          (puis radius=3 si < 5 résultats)
  &d1=<date-13 jours>&d2=<date>                (date = date du jour ou ?date=)
  &quality_grade=research,needs_id
  &photos=true&captive=false&hrank=genus
  &per_page=100&order_by=observed_on&order=desc
  &locale=fr&preferred_place_id=6753           (noms communs français ; 6753 = France)
```

Une seule page (100 résultats suffisent : 42 à 3 km sur 14 jours en novembre). Délai 8 s via
`AbortController`, comme la météo.

### 2.3 Filtrage et normalisation (fonction pure, testée sous Node)

Garder une observation seulement si :
- `obscured !== true` et `geojson.coordinates` présent ;
- `taxon.rank` ∈ {`species`, `subspecies`, `variety`, `hybrid`, `genus`} ;
- au moins une photo.

Normaliser en `{ id, uri, date, jours (0 = aujourd'hui), grade ('confirmee'|'en_cours'),
nomCommun (preferred_common_name ou null), latin (taxon.name), rang, genre (premier mot),
taxonId, lat, lon, precision (positional_accuracy ou null), photo: { url small.jpg, credit,
licence } | null }`.

- `photo` n'est renseignée que si `license_code` commence par `cc` (CC0, BY, BY-SA, BY-NC,
  BY-NC-SA, BY-ND, BY-NC-ND) ; crédit = `attribution` nettoyé (« (c) pseudo, some rights
  reserved (CC BY-NC) » → « pseudo — CC BY-NC »). Sinon `photo = null`.
- Dédoublonner par `taxonId`, garder l'observation la plus récente ; trier par date décroissante.

### 2.4 Rattachement à un lieu (fonction pure)

Entrée : lat/lon de l'observation, `precision`, `data/lieux.json`.
- Si `precision > 500 m` : `lieuTexte = null` (coordonnées trop floues, rien n'est affiché).
- Sinon, lieu de `lieux.json` le plus proche à **moins de 250 m** : « vers le parc Sourreil »
  (`nom` du lieu, article contracté géré à la main : « vers le bois Sourreil », « vers le
  cimetière de Talence », « vers le campus du Haut-Carré »). Prévoir un champ optionnel
  `lieux.json[].vers` (« vers le parc Peixotto ») pour éviter les règles grammaticales.
- Sinon : distance depuis le Forum arrondie à 100 m et direction sur 8 points :
  « à 600 m vers le nord », « à 2,4 km vers le sud-ouest ».
- Jamais `place_guess`, jamais de pseudo hors crédit photo.

### 2.5 Appariement observation ↔ fiche (fonction pure)

- Nom latin d'une fiche : `adulte.latin`, normalisé (minuscules, deux premiers mots, suppression
  de « sp. », « spp. », « cf. », auteurs, « × » traité comme un mot vide). Nouveau champ
  optionnel `adulte.taxons: ["Cornu aspersum", "Helix"]` pour les fiches qui couvrent plusieurs
  espèces ou un genre ; s'il existe, il remplace `latin` pour l'appariement.
- Règles : observation au rang espèce (ou inférieur) ↔ fiche dont le nom normalisé est le même
  binôme, **ou** fiche dont le taxon est un genre égal au genre de l'observation. Observation au
  rang genre ↔ fiche dont le taxon est ce genre uniquement (jamais une fiche d'espèce).
- Résultat : `Map<ficheId, { jours, lieuTexte, uri, grade }>` (observation la plus récente et, à
  égalité, la plus proche).
- L'observation **ne rend pas éligible** une fiche hors saison ou hors météo : une espèce
  photographiée ne prouve pas le phénomène de la fiche (un chêne vu en février ne fait pas
  tomber des glands). Idée écartée.

### 2.6 Moteur de choix (`js/selection.js`)

- Nouvelle option `observations` (la Map ci-dessus) pour `choisir` et `autre`.
- `poidsDuJour` multiplié par `BONUS_OBSERVEE = 3` quand la fiche est dans la Map. Pas
  d'exemption d'anti-répétition (une observation reste « récente » 14 jours : exempter ferait
  revenir la même fiche chaque jour). Les événements datés gardent leur priorité absolue.
- Avec `?meteo=` ou `?date=`, l'appel iNaturalist a lieu (il est utile pour tester) mais
  `?inat=aucune` le désactive et `?inat=hs` simule une panne.

### 2.7 Interface (`js/app.js`, `index.html`, `css/style.css`)

- **Badge** sur une carte appariée, sous le titre : « 👀 Vu il y a 3 jours vers le parc Sourreil »
  (« aujourd'hui », « hier », « il y a N jours » ; sans lieu si `lieuTexte` est null), lien vers
  `uri` (« voir l'observation »), suffixe « identification en cours » si `grade = en_cours`.
- **Bloc** `<section id="observations">` après les cartes, avant le pied : titre « Vu ces 14
  derniers jours près d'ici », sous-titre « Observations des habitants sur iNaturalist, à moins
  de 1,5 km » (ou « … à moins de 3 km : trop peu d'observations tout près »). Liste de 8 lignes
  maximum : miniature 64 px (si `photo`, sinon photo Wikimedia de la fiche appariée, sinon un
  pictogramme de catégorie), nom commun en gras (ou latin), latin en italique, « hier · vers le
  parc Peixotto », « identification en cours » le cas échéant, lien « voir ». Le bloc est masqué
  (`hidden`) s'il n'y a rien à montrer.
- Pied de page : ajouter « Observations : iNaturalist (observations de ses membres, licences
  indiquées sous chaque photo) ».
- Accessibilité : la liste est un `<ul>` ; le badge est du texte, pas seulement une icône ;
  l'`aria-live` existant annonce « N observations récentes près d'ici » après chargement.

### 2.8 Photos et crédits

- Seules les photos sous licence Creative Commons sont affichées, avec crédit « pseudo — CC BY-NC »
  et lien vers l'observation (exigence des licences BY). Les photos sans licence ne sont jamais
  chargées (ni en miniature).
- Les miniatures viennent de `inaturalist-open-data.s3.amazonaws.com` (taille `small`), avec
  `loading="lazy"` et `referrerpolicy="no-referrer"`.

### 2.9 Cache, panne, débogage

- Cache `localStorage` clé `nature-talence.observations` : `{ cle: "<date>|<rayon>", horodatage,
  observations }`, valable **6 h** ; même protection try/catch que le stockage existant.
- `?inat=hs` : panne simulée ; `?inat=aucune` : désactivé ; `?date=` : la fenêtre glisse avec la
  date simulée (iNaturalist accepte les dates passées).
- Aucun message d'erreur visible ; `console.warn` seulement.

### 2.10 Fichiers, tests, critères d'acceptation

| Fichier | Changement |
|---|---|
| `js/observations.js` (nouveau) | `urlObservations(date, rayon)`, `normaliser(reponse)`, `rattacherLieu(obs, lieux)`, `apparier(observations, fiches)`, `chargerObservations(date, { fetchFn })` (ne lève jamais, rayon adaptatif) |
| `js/selection.js` | option `observations`, `BONUS_OBSERVEE` |
| `js/app.js` | appel en parallèle de la météo, badge, bloc, cache |
| `index.html`, `css/style.css` | section `observations`, styles du badge et de la liste, crédit |
| `tests/fixtures/inaturalist.json` (nouveau) | réponse réelle anonymisée (pseudos remplacés, `place_guess` vidé) : 6 observations dont une `needs_id`, une au genre, une obscurcie, une sans licence |
| `tests/observations.test.js` (nouveau) | filtrage, normalisation, crédit, lieu le plus proche / distance + direction, précision > 500 m, appariement espèce/genre, rayon adaptatif (< 5 → seconde requête), panne |
| `tests/selection.test.js` | une fiche appariée est favorisée (× 3) sans casser l'anti-répétition ni les événements datés |
| `SPEC.md`, `README.md` | champ `adulte.taxons`, paramètre `?inat=`, crédit |

Critères d'acceptation : `npm test` vert ; sur la page réelle, le bloc apparaît avec au moins une
observation (en novembre 2026 : 17 à 1,5 km) ; `?inat=hs` ne change rien d'autre que l'absence du
bloc ; aucune requête iNaturalist au rechargement dans les 6 h ; aucun `place_guess` ni pseudo
hors crédit dans le DOM.

## 3. Amélioration B — Lieux et points d'intérêt open data, nouvelles fiches

### 3.1 Principe

Extraction **hors ligne** par un script sans dépendance (`scripts/extraire-open-data.py`, Python 3
standard, lancé avec `-I`), résultats versionnés dans le dépôt. Le site ne fait aucun appel aux
portails open data. Rayon : 1 600 m autour du Forum (les lieux existants vont jusqu'à 1,9 km au
centroïde ; on garde ce qui est à moins de 1,6 km de **lisière**).

### 3.2 Sources et requêtes

Portail Bordeaux Métropole, API Explore v2.1 :
`GET https://opendata.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/<jeu>/records?where=within_distance(geo_point_2d, geom'POINT(-0.5880 44.8065)', 1600m)&limit=100&offset=…`
(pagination par `offset`, `select` pour alléger ; les polygones sont dans `geo_shape`, le centroïde
dans `geo_point_2d`).

| Jeu | Ce qu'on extrait | Type de point produit |
|---|---|---|
| `tal_pointseaulibreacces` | tout (11) | `eau_potable` |
| `tal_airesjeux` | nom, point | `aire_jeux` (enrichit `lieux.json`, pas de fiche) |
| `tal_jardinspartages` | nom, point | `jardin_partage`, `cueillette` (l'espace de libre cueillette) |
| `ec_parc_s` | nom, description, services | enrichit `lieux.json` (essences, eau, toilettes) |
| `to_hydro_s` | type, régime, naturel/artificiel, nom, centroïde | `bassin`, `point_eau`, `canal` (fossés ignorés) |
| `ec_habitat_naturel_s` | sous-milieu, enjeu, centroïde, polygone simplifié | `prairie_fauche`, `chenaie`, `roseliere`, `haie_arboree`, `vigne`, `peupleraie`, `friche`, `fourre_prunellier`, `prairie_humide` (zones urbanisées et pelouses ignorées) |
| `cr_objet_nature_p` | seulement `classe='ARB' and ssclasse in ('CONI','AUTRE')` (64 points) | `conifere`, `arbre_autre` (palmiers probables) |
| `met_vegetation_urbaine` | `p_can`, `nb_arbre`, centroïde | pas de point ; `lieux.json[].canopee` (% de la maille contenant le lieu) |
| `ri_icu_ifu_s` | mailles `delta <= -3` | `ilot_fraicheur` (regroupées par lieu : écart min) |

OpenStreetMap, Overpass (`https://overpass-api.de/api/interpreter`, `around:1600,44.8065,-0.5880`) :

| Tags | Type de point |
|---|---|
| `natural=tree` + `species` ou `genus` ou `denotation=natural_monument` | `arbre_espece` (nom latin, lat/lon) |
| `man_made=nesting_site` | `tour_hirondelles` |
| `man_made=water_well` | `puits` |
| `amenity=drinking_water`, `man_made=water_tap`, `amenity=fountain` | `eau_potable` (dédoublonné avec `tal_*` à 30 m), `fontaine` |
| `waterway=stream` (ruisseau d'Ars), `natural=water` (nommé ou > 200 m²), `natural=wetland` | `ruisseau`, `etang`, `zone_humide` |
| `landuse=vineyard`, `landuse=orchard`, `landuse=meadow`, `landuse=allotments` | `vigne`, `verger`, `prairie`, `jardin_partage` |
| `information=board` + `board_type=wildlife` | `panneau_nature` |
| `barrier=hedge`, `natural=tree_row` | pas de point individuel (trop nombreux) ; seulement les rangées avec `species`/`genus` |

Ruches, hôtels à insectes, nichoirs : aucun dans OSM ni en open data ; à repérer sur le terrain
(entrée « à vérifier ») plutôt qu'inventés.

### 3.3 Format de `data/points-interet.json`

```json
[{
  "id": "pi-puits-peixotto",
  "type": "puits",
  "nom": "Puits du parc Peixotto",
  "lat": 44.80831, "lon": -0.59019,
  "distance_m": 230,
  "lieu": "parc-peixotto",
  "repere": "Dans le parc, côté allée Peixotto, à une trentaine de mètres de l'entrée principale : margelle ronde en pierre.",
  "source": { "jeu": "OpenStreetMap", "ref": "node/1338095729", "url": "https://www.openstreetmap.org/node/1338095729", "date": "2026-11-03" },
  "confiance": "probable",
  "verifier": true,
  "saison": null,
  "notes": "Non visible sur Panoramax ; vérifier l'existence et l'accès."
}]
```

- `type` : valeur de la liste 3.2 (énumération fermée, testée).
- `lieu` : id de `lieux.json` si le point est à moins de 150 m du lieu ou dans son polygone,
  sinon `null`.
- `repere` : rédigé à la main (rue, côté, croisement, élément visible ; jamais de numéro de
  maison), à partir de l'inventaire visuel Panoramax quand une image existe.
- `confiance` : `certain` (deux sources concordantes, ou Ville/PCRS + image Panoramax),
  `probable` (une seule source). `verifier` : `true` si OSM ou PCRS seul.
- `saison` : mois d'intérêt (ex. prairie de fauche : [4,5,6]) ou `null`.
- Les polygones (habitats, vignes, eau) ne sont pas stockés ; seulement le centroïde et, si
  utile, un `acces` : « visible depuis le grillage du cours de la Libération ».

### 3.4 Enrichissement de `data/lieux.json`

Corrections et ajouts sourcés (mention de la source dans `data/lieux-sources.md`) :

- `parc-bel-air` : `eau: true` (point d'eau « Jardins de Bel Air » 44.80185, -0.57969, Ville). Erreur actuelle (`false`).
- `parc-margaut` : éléments « platanes de grande taille », « magnolia près du château » ; `eau: true` et toilettes à proximité (`ec_parc_s`).
- `parc-du-couvent` : « immenses platanes, chênes, marronniers », « arbres fruitiers plantés récemment » ; espace de **libre cueillette** (petits arbustes à fruits, budget participatif) à 44.81044, -0.58392, soit dans le parc ou à sa lisière.
- `parc-chantecler` : « sous-bois de 6 000 m² (charmes, chênes) sur 7 000 m² ».
- `parc-peixotto` : `eau` et `aire_jeux` confirmés (Ville), puits (OSM), peuplier noir et cyprès chauve (OSM, espèce), bassin public (`to_hydro_s`), îlot de fraîcheur −4 °C au nord ; « cygnes » (texte Métropole de 2012) **à vérifier**.
- `bois-sourreil` : îlot de fraîcheur **−5 °C**, le plus frais du rayon ; canopée 39 % de la maille.
- `parc-cauderes` : catalpa (OSM, espèce) et 5 platanes (genre) ; aire de jeux et jardin partagé confirmés (Ville).
- `parc-robespierre` : tour à hirondelles géolocalisée (44.80893, -0.58335).
- `parc-andre-curvale` : zelkova classé en 2008, 4,45 m de circonférence (Métropole) ; jardin partagé confirmé.
- `parc-triaire` : aire de jeux confirmée ; « Jardin de la passerelle » voisin (44.81817, -0.59221).
- `campus-haut-carre` : prairies de fauche et chênaie-charmaie à enjeu fort (centroïdes 3.2), 18 conifères à l'ouest, prairie « Eco-pâturage » (44.80719, -0.60668), roselières et plans d'eau naturels à l'ouest (accès à confirmer).
- `bois-de-thouars` : panneau faune (44.79339, -0.59298), bassin de rétention et prairie humide à souchet bai, chênaie à chêne tauzin, îlot −5 °C : tous à la lisière nord-est (≈ 1,5 km), ce qui confirme `distance_lisiere`.
- Nouveaux champs optionnels : `vers` (2.4), `canopee` (%), `fraicheur` (écart °C min de la maille), `points` (ids de points-interet rattachés, dérivable).
- **Nouveaux lieux** seulement s'ils ont au moins un élément nature sourcé : `square-pineau`
  (eau + jeux + 8 conifères PCRS à côté, 44.8130, -0.5910, ≈ 750 m N), `bois-lafitte` (bois OSM +
  aire de jeux 44.79717, -0.58441, ≈ 1,1 km S, canopée 33 %), `parc-fehlmann` (eau + jeux + jardin
  partagé, 44.8202, -0.5855, ≈ 1,55 km N, à la limite). Parc du colonel Mol, square Duguesclin,
  Clos Michelet, squares René Maran, de la Scierie, Jean Bouin : points `aire_jeux` seulement.

### 3.5 Nouvelles fiches (15 à 25)

Règles : un seul agent rédacteur (docs/brief-redaction.md), relecture ensuite (docs/brief-relecture.md).
Avant d'écrire, vérifier dans `docs/index-fiches.txt` qu'aucune fiche existante ne couvre le
sujet ; si oui, **compléter son `point`** avec le point d'intérêt plutôt que doubler (cas probables :
vignes, tour à hirondelles, moutons du campus, cyprès chauve, marronniers du Couvent, colverts).
Chaque fiche référence son point : `point.pi = "<id du point>"` (nouveau champ optionnel).
`verifier: true` dès que le point l'est.

Candidats, avec la donnée qui les justifie :

| Id proposé | Catégorie | Appui | Saison / condition |
|---|---|---|---|
| `sens-eau-froide-fontaine` | sensoriel | points d'eau Peixotto, place 14-18, square Pineau (Ville) | 5-9, `requiert: chaud` |
| `ins-puits-dans-la-ville` | insolite | 4 puits OSM, dont Peixotto | toute l'année, `verifier` |
| `ani-ruisseau-ars-a-ciel-ouvert` | animal | tronçons OSM à 420 m N et 1,1 km NE ; étang Bonnefont | 3-10, `exclut: sec` ; gerris, têtards à confirmer |
| `sens-ombre-fraiche-sourreil` | sensoriel | îlot −5 °C (thermographie 2022) | 6-9, `requiert: chaud` |
| `ins-bassin-thouars-herons` | insolite | bassin « B.R. eau Thouars » + prairie humide + eau libre (enjeu fort/moyen) | 3-10, `verifier` (accès) |
| `ins-tour-hirondelles` | insolite | `nesting_site` OSM + Ville | 5-8 ; si fiche existante, compléter |
| `ins-panneau-qui-habite-ici` | insolite | panneau faune de Thouars (OSM) | toute l'année |
| `ani-cygnes-peixotto` | animal | description Métropole (2012) | `verifier: true`, sinon abandonner |
| `pla-prairie-de-fauche-campus` | plante | habitats enjeu fort (campus Haut-Carré) | 4-6, depuis la clôture |
| `pla-charme-feuilles-plissees` | plante | chênaie-charmaie du campus ; sous-bois de Chantecler (Métropole) | 4-5 (feuilles neuves), 11-2 (feuilles mortes qui restent : marcescence) |
| `pla-roseaux-plumeaux` | plante | roselières 1,4 km O (enjeu moyen) | 9-2, `requiert: vent` possible |
| `pla-haie-de-chenes` | plante | haies arborescentes de chênes (enjeu moyen) | 9-11 (glands), 4-5 |
| `sens-cueillette-libre-suzon` | sensoriel | espace de libre cueillette (Ville, budget participatif) | 6-8, `verifier` (essences, existence) |
| `pla-conifere-qui-garde-ses-aiguilles` | plante | 54 conifères PCRS (groupes N et NO, 280-690 m) | 11-2 ; essence à confirmer sur place |
| `pla-catalpa-haricots-geants` | plante | catalpas OSM (Caudérès, et 6 au NE) | 6-7 (fleurs), 10-3 (gousses) |
| `pla-magnolia-fleurs-geantes` | plante | magnolia du parc Margaut (Métropole) | 6-7, fruits 9-10 ; espèce à confirmer |
| `pla-peuplier-qui-tremble` | plante | peuplier noir Peixotto (OSM, espèce) ; peupleraie 1,3 km O | 4-10, `requiert: vent` |
| `pla-tilleuls-parfum` | plante | alignements OSM au NE (Tilia tomentosa, × flavescens) | 6-7 ; vérifier l'absence de doublon |
| `pla-prunellier-fleurs-avant-feuilles` | plante | fourrés à prunellier 1,6 km SE (limite du rayon) | 3 (fleurs), 10 (prunelles) ; facultatif |
| `pla-vigne-mission-haut-brion` | plante | habitat « vignes » + OSM | compléter les fiches vigne existantes plutôt que doubler |
| `sens-sous-bois-lafitte` | sensoriel | bois OSM + aire de jeux (Ville) | 10-11 (feuilles), `verifier` (accès) |
| `ani-moutons-eco-paturage` | animal | prairie « Eco-pâturage » OSM | compléter la fiche existante si elle existe |

Pour chaque fiche : point précis + `repere` suivable (depuis l'inventaire Panoramax si une image
existe), photo Wikimedia vérifiée (HTTP 200), `attention` si nécessaire (eau : « on regarde
depuis le bord, main dans la main »), couverture mensuelle recalculée.

### 3.6 Fichiers, tests, critères d'acceptation

| Fichier | Changement |
|---|---|
| `scripts/extraire-open-data.py` (nouveau) | requêtes 3.2, écrit `data/sources/open-data.json` (brut filtré, < 500 Ko) et un squelette de points à compléter à la main (`repere`, `confiance`) |
| `data/sources/open-data-synthese.md` (nouveau) | méthode, jeux utilisés, comptes, limites, date |
| `data/points-interet.json` (nouveau) | points curés (3.3) |
| `data/lieux.json`, `data/lieux-sources.md` | 3.4 |
| `data/fiches-*.json` | 15-25 fiches, un seul rédacteur |
| `docs/a-verifier-sur-le-terrain.md`, `docs/index-fiches.txt` | nouveaux points à confirmer, index |
| `tests/donnees.test.js` (nouveau) | `points-interet.json` valide (types fermés, lat/lon dans le rayon, `lieu` existant, `verifier` cohérent avec `confiance`), `fiches[].point.pi` existant, `lieux[].vers` présent pour tout lieu |
| `SPEC.md` | format des points, champs `pi`, `vers`, `canopee`, `fraicheur`, `adulte.taxons` |

Critères d'acceptation : `npm test` vert ; chaque nouvelle fiche a un point et un repère ; la
couverture mensuelle par catégorie reste ≥ 8 fiches éligibles dont ≥ 4 sans condition météo ;
aucun numéro de maison ni donnée privée dans les repères.

### 3.7 Points à vérifier sur le terrain (à reporter dans docs/a-verifier-sur-le-terrain.md)

- Puits de Peixotto (existence, margelle visible) ; les 3 autres puits.
- Tronçon du ruisseau d'Ars à 420 m N (44.80942, -0.58480) : à ciel ouvert, visible depuis la rue ?
- Espace de libre cueillette près du parc du Couvent : planté ? quels arbustes ?
- Conifères du groupe nord (3 + 3 vers 44.809/44.810, -0.588) et du square Pineau : essences.
- Cygnes du bassin de Peixotto (texte de 2012).
- Square Pineau, bois Lafitte, parc Fehlmann : accès, horaires, intérêt nature réel.
- Prairies de fauche et chênaie-charmaie du campus : visibles depuis l'espace public ? fauche en juin ?
- Bassin de Thouars : accès au bord, garde-corps.

## 4. Ordre de réalisation (quand Mathieu décidera d'implémenter)

1. **B1 — extraction et données** (sous-agent sonnet) : script, `open-data.json`, synthèse,
   `points-interet.json` curé, `lieux.json` enrichi, test `donnees.test.js`.
2. **A — observations en direct** (sous-agent opus, en parallèle de B1) : module, moteur, interface,
   fixtures, tests.
3. **B2 — fiches** (sous-agent opus, après B1, rédacteur unique) puis **relecture** (sonnet).
4. Vérification par l'agent principal : `npm test`, page en local avec `?date=` et `?inat=hs`,
   capture d'écran, puis commit et publication (GitHub Pages), contrôle en production.

Ordre de grandeur : A ≈ 300 lignes de JS + tests ; B1 ≈ 200 lignes de Python + données ;
B2 = 15-25 fiches.

## 5. Hors périmètre (pistes gardées pour plus tard)

Open-Meteo Air Quality (pollens, UV, poussière du Sahara) et variables horaires (rosée, nuages du
soir, neige, direction du vent, pluie des 2 prochaines heures) ; archive Open-Meteo (première
gelée, cumul de chaleur) ; passages de l'ISS ; sons d'oiseaux (xeno-canto / Wikimedia Commons) ;
agenda local (`met_agenda` sur le même portail : 43 127 événements, à filtrer sur Talence) ;
horaires structurés des parcs vérifiés par le moteur ; `met_vegetation_urbaine` pour un
« quartier le plus arboré » ; `observation-meteorologique-historiques-bordeaux-metropole-synop`
pour les normales locales.
