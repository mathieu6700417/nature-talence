# Open data autour de Talence centre — synthèse de l'extraction

Date : 2026-11-03. Centre : Forum des Halles (44.8065, -0.5880). Rayon : 1 600 m.
Script : `scripts/extraire-open-data.py`, lancé avec `python3 -I scripts/extraire-open-data.py` (Python 3 standard, environ 50 s).
Spécification : `docs/spec-observations-open-data.md` §3.

## 1. Méthode

- **Bordeaux Métropole** : API Explore v2.1 de `opendata.bordeaux-metropole.fr`, sans clé. Filtre `within_distance(geo_point_2d, geom'POINT(-0.5880 44.8065)', 1600m)`, pagination par `offset` (100 par page), pause de 1,2 s entre requêtes, User-Agent explicite, 3 essais par page. Les polygones (`geo_shape`) sont écartés dès la lecture : seuls les centroïdes (`geo_point_2d`) sont gardés.
- **OpenStreetMap** : une requête Overpass (`overpass-api.de`, repli `overpass.kumi.systems`) avec `around:1600,44.8065,-0.5880`, sortie `out center tags`. Seuls quelques tags utiles sont conservés.
- **Traitement** : les réponses sont uniquement analysées comme du JSON, jamais exécutées. Le script écrit :
  - `data/sources/open-data.json` (brut filtré, 63 Ko) ;
  - `data/sources/points-squelette.json` (355 points candidats, avec le lieu le plus proche et sa distance, 91 Ko).
- **Curation à la main** : du squelette, on tire `data/points-interet.json` (91 points), avec dédoublonnage, regroupement des arbres et conifères par groupe, `repere` écrit à la main, `confiance`, `verifier` et `saison`. Les repères viennent des noms de rues OSM les plus proches et de l'inventaire Panoramax (`inventaire-visuel.json`) ; aucun numéro de maison.

## 2. Jeux utilisés et comptes obtenus (rayon 1 600 m)

| Jeu | Filtre | Obtenu | Usage |
|---|---|---|---|
| `tal_pointseaulibreacces` | tout | 8 | `eau_potable` |
| `tal_airesjeux` | tout | 15 | `aire_jeux` |
| `tal_jardinspartages` | tout | 9 | `jardin_partage`, `cueillette` |
| `ec_parc_s` | tout | 6 | descriptions : essences, eau, toilettes (lieux) |
| `to_hydro_s` | fossés ignorés | 15 | `bassin`, `point_eau`, `canal` |
| `ec_habitat_naturel_s` | enjeu fort ou moyen, plus vignes, prunelliers, peupliers | 85 (dont 21 retenus au squelette) | `prairie_fauche`, `chenaie`, `roseliere`, `haie_arboree`, `vigne`, `peupleraie`, `prairie_humide`, `fourre_prunellier` |
| `cr_objet_nature_p` | `classe='ARB' and ssclasse in ('CONI','AUTRE')` | 64 (54 conifères, 10 autres) | `conifere`, `arbre_autre` |
| `met_vegetation_urbaine` | tout | 151 mailles | `canopee` des lieux |
| `ri_icu_ifu_s` | `delta<=-3` | 35 mailles | `ilot_fraicheur`, `fraicheur` des lieux |
| OSM (Overpass) | arbres avec espèce ou genre, `nesting_site`, `water_well`, eau potable, fontaines, ruisseau, eau, zones humides, vignes, vergers, prairies, jardins familiaux, panneaux faune, rangées d'arbres avec espèce | 201 éléments | arbres, puits, fontaines, tour à hirondelles, etc. |

Tous les comptes de la spec §1.2 sont retrouvés à l'identique. Côté OSM, la spec annonçait 883 éléments : ce nombre incluait vraisemblablement les haies (60), rangées d'arbres sans espèce et bois, que le script n'interroge pas (§3.2 : « pas de point individuel »). Les 201 éléments retournés correspondent aux seuls tags du tableau.

Points curés par type (91 au total) : aires de jeux 15, arbres d'espèce 12, eau potable 11, jardins partagés 8, conifères 7, bassins 4, fontaines 4, îlots de fraîcheur 4, puits 4, arbres « autres » 2, chênaies 2, haies arborées 2, prairies de fauche 2, ruisseaux 2, et 1 chacun pour cueillette, étang, fourré à prunelliers, panneau faune, peupleraie, point d'eau, prairie, prairie humide, roselière, tour à hirondelles, vigne, zone humide. Confiance : 15 `certain`, 76 `probable` ; 53 points portent `verifier: true`.

## 3. Limites et surprises

- **Ruisseau d'Ars à 420 m au nord** (44.80942, -0.58480) : la spec le croyait à ciel ouvert, mais OSM le tague `tunnel=culvert` (busé). Il est gardé avec `verifier: true` et une note. Le tronçon de la rue Voltaire (1 066 m) est, lui, cartographié ouvert.
- **Robinet du parc du Couvent** : OSM le tague `drinking_water=no` ; il n'est donc pas repris en `eau_potable`, et le lieu le mentionne comme non potable.
- **Ville vs OSM** : le jeu de la Ville écrit « Felhman » (point d'eau) et « Felhmann » (aire de jeux) ; le lieu est nommé `parc-fehlmann`. « Parc du colonel Mol » dans le jeu, « rue du Colonel Moll » dans OSM.
- **Chantecler** : 7 000 m² dont 6 000 m² de sous-bois selon la Métropole, environ 1 ha selon OSM.
- **Peixotto** : le jeu `ec_parc_s` parle de « cygnes et canards » (texte de 2012) ; non confirmé, point `verifier`.
- **Fraîcheur et canopée** : les mailles de `ri_icu_ifu_s` sont filtrées à −3 °C ou moins (les autres ne sont pas téléchargées). Le bois de Thouars est trop loin pour que son centroïde tombe dans une maille du rayon : sa canopée (59 %) et sa fraîcheur (−5 °C) sont celles de la lisière nord-est, saisies à la main.
- **Rattachement `lieu`** : règle des 150 m au centroïde du lieu (centroïdes approximatifs : un parc peut avoir un périmètre plus large). Corrections manuelles : les points du bois de Thouars (lisière nord-est), les conifères du square Pineau, et `null` pour les objets situés sur la voirie (cascade du rond-point, fontaine de l'avenue Roul, place 14-18, tronçon busé de la rue Peydavant).
- **Absents** du rayon, comme dans la spec : ruches, hôtels à insectes, nichoirs (jeux `bor_abrisfaune`, `ec_entpa_p`, `ec_inv_protection_s` : 0), ainsi que `en_rpg_s` (0).
- **Non retenus** : robinets OSM doublonnant un point de la Ville à moins de 30 m, fossés, zones d'habitat à enjeu faible (sauf vignes, peupliers, prunelliers), deux tiers des chênaies et haies de Thouars et du campus ouest, `La Fourmilière` (accès non confirmé).
- Aucun point n'a été vu sur place : les `repere` s'appuient sur des noms de rues OSM et des images de rue de 2018 à 2026. La liste des vérifications est dans `docs/a-verifier-sur-le-terrain.md`, section 10.
- Aucune donnée privée n'est stockée (pas d'adresse postale, pas de nom de personne ; les jardins partagés sont cités par leur nom public).

## 4. Rejouer l'extraction

```
python3 -I scripts/extraire-open-data.py
```
Le script réécrit `open-data.json` et `points-squelette.json` ; `points-interet.json` (curé) n'est jamais écrasé. En cas d'échec d'une page, trois essais puis une ligne de journal ; si Overpass principal ne répond pas, le miroir est utilisé.
