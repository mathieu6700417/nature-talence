# Sources des lieux (data/lieux.json)

Méthode : Overpass API (OpenStreetMap, requêtes du 02/11/2026, rayon 1600-2000 m autour de 44.8065, -0.5880), Nominatim (adresses), site de la Ville de Talence, Wikipédia, communiqués et presse locale.
Distances : vol d'oiseau depuis le Forum des Halles (44.8065, -0.5880) jusqu'au centroïde OSM (`distance`) ; `distance_lisiere` = bord le plus proche du polygone OSM pour les grands sites. Les horaires généraux, l'accessibilité PMR et les descriptions viennent de la page « Parcs et espaces verts » de la Ville.

Sources communes
- Parcs et espaces verts (horaires, descriptions, accessibilité PMR) : https://www.talence.fr/decouvrir-talence/environnement/parcs-espaces-verts/
- Refuge LPO (Sourreil, Curvale, Triaire) : https://www.talence.fr/decouvrir-talence/environnement/refuge-lpo/
- Diagnostics LPO : https://www.talence.fr/wp-content/uploads/2025/01/Diagnostic-ecologique-LPO-parc-Sourreil.pdf ; https://www.talence.fr/wp-content/uploads/2025/01/Diagnostic-ecologique-LPO-parcs-triaire-et-Curvale.pdf ; fiches https://www.talence.fr/wp-content/uploads/2025/03/Parc-curvale.pdf , Parc-sourreil.pdf , Parc-triaire.pdf
- Jardins partagés : https://www.talence.fr/decouvrir-talence/environnement/jardins-partages/ (16 jardins dont 12 publics)
- Maison du développement durable : https://www.talence.fr/decouvrir-talence/environnement/mdd/
- Overpass : https://overpass-api.de/api/interpreter ; Nominatim : https://nominatim.openstreetmap.org

Limite générale : les essences d'arbres des parcs ne sont pas sourcées, sauf l'Orme du Caucase de Curvale ; les données d'arbres par rue et d'espèces sont traitées par d'autres agents. Les mentions « OSM » (bancs, eau potable, tables, aires de jeux) viennent de la cartographie collaborative, non vérifiées sur place.

## parc-peixotto
- Sources : Ville (page parcs : jardins à la française XVIIIe, aire de jeux, toilettes, plan d'eau près de la MDD ; horaires 7h-21h / 7h-19h) ; https://fr.wikipedia.org/wiki/Ch%C3%A2teau_de_Peixotto ; https://fr.wikipedia.org/wiki/Talence (jardin botanique, accès réservé) ; https://www.talence.fr/decouvrir-talence/grands-projets/gpm/ ; https://www.talence.fr/parcpeixottotravaux/ ; OSM way 44014814 (23 bancs, 2 eau potable, 2 tables de pique-nique, 1 toilettes, aire de jeux 5-12 ans way 66519177, bac à sable way 884405551).
- Incertain : état des travaux (phases ; fermetures partielles) ; essences d'arbres et « arbres remarquables » non confirmés (non inclus) ; aucune mention de cèdre trouvée.

## parc-margaut
- Sources : https://www.talence.fr/decouvrir-talence/grands-projets/gpm/ (bassin à trois paliers, jardin devant le château, tapis vert) ; https://www.talence.fr/wp-content/uploads/2026/02/CP-Talence-Grand-Peixotto-Margaut-28.02.26.pdf ; https://www.bougerabordeaux.com/actu/news/grand-peixotto-margaut-a-talence-un-nouvel-ecrin-de-verdure-sapprete-a-ouvrir/ ; Ville (page parcs) ; Wikipédia Talence (école de musique au château Margaut) ; OSM way 230271091.
- Correction de nom : « Margaut » (pas « Chenes-Margaut »). Incertain : horaires précis post-travaux ; nombre de bancs non compté.

## parc-robespierre
- Sources : Ville (page parcs : tour à hirondelles, conseil municipal des enfants) ; OSM way 516618776 (3 bancs, clôturé).
- Incertain : accessibilité poussette ; horaires spécifiques.

## parc-du-couvent
- Sources : Ville (page parcs : chapelle, bancs, jardinage écologique, écosystèmes) ; OSM way 230271095 (6 bancs, robinet d'eau, croix).
- Incertain : accessibilité poussette ; l'espace n'est ouvert au public qu'en partie (formulation de la Ville).

## bois-sourreil
- Sources : Ville (page parcs et refuge LPO) ; diagnostic LPO 2021 (Sourreil.pdf : 23 oiseaux dont 6 nicheurs, 8 papillons de jour, pic vert, pic épeiche, sittelle torchepot, mésanges, roitelet à triple bandeau, tircis, bois mort, lierre, ronciers, tonte tardive) ; fiche https://www.talence.fr/wp-content/uploads/2025/03/Parc-sourreil.pdf ; Wikipédia Ruisseau d'Ars (dépression du ruisseau, canalisé) ; OSM way 230271092 (4 ha).
- Incertain : ouverture/entrée exacte ; orthographes variables (Sourreil/Soureilh) ; aucune aire de jeux ni banc confirmés.

## parc-bel-air
- Sources : Ville (page parcs : 3 900 m², 23 jardins partagés, verger d'une trentaine d'arbres fruitiers, aire de jeux, ateliers) ; OSM way 177852551 (5 bancs, 4 tables de pique-nique, aire de jeux) ; OSM way 620979368 « Le Jardin des Cultures » (allotments, ≈ 800 m).
- Incertain : accès aux parcelles de jardin partagé (réservées aux adhérents, à regarder de l'extérieur).

## parc-pagnol
- Sources : Ville (page parcs : Maison de la petite enfance, square tout-petits, ouvert en semaine seulement) ; Nominatim « 61 rue Lamartine Talence » → 44.8118, -0.5863.
- Incertain : périmètre du parc non cartographié ; aucun élément naturel détaillé ; aucune donnée d'eau/bancs.

## campus-haut-carre
- Sources : https://www.u-bordeaux.fr/actualites/leco-paturage-le-nouveau-parti-pris-de-luniversite-pour-lentretien-des-espaces-verts (moutons d'Ouessant au Haut-Carré, depuis le 28 mai 2024, présents toute l'année) ; https://www.sudouest.fr/gironde/talence/bordeaux-metropole-des-moutons-d-ouessant-nouveaux-residents-du-campus-20021621.php (ormes et peupliers, grillage) ; OSM way 44128045 (Domaine du Haut-Carré).
- Incertain : présence des moutons en nov. 2026 ; accès public ; dispositif annoncé initialement pour 2 ans. Le plan d'eau aménagé du campus (Wikipédia Ruisseau d'Ars : lac « avant le grand portail forgé », OSM way 228117105, ≈ 1,25 km) n'est pas inclus : localisation et commune (Talence/Pessac) non confirmées. Le parc du campus Montaigne (OSM way 34600974) est à ≈ 1,6-2 km de lisière et non retenu ; Parc Lavielle et éco-pâturage OSM (≈ 1,45-1,5 km) sont côté Pessac, non retenus.

## cimetiere-de-talence
- Sources : https://www.talence.fr/quotidien/etat-civil/cimetiere-municipal/ (horaires 8h-18h, « lieu de biodiversité préservée », qualité de végétalisation) ; OSM way 25870593 (2 points d'eau, 4 bancs, toilettes) ; Wikidata Q107440349.
- Incertain : essences d'arbres ; accessibilité poussette. Un second polygone (way 25870606) et les tombes du Commonwealth (way 520304186) sont plus loin (≈ 1 km).

## parc-du-chateau-des-arts
- Sources : Ville (page parcs : château néo-classique XIXe, en travaux, aire de jeux, volley libre) ; OSM way 863482897 (3 bancs, 2 tables, fontaine, eau potable).
- Incertain : étendue ouverte pendant les travaux.

## parc-cauderes
- Sources : Nominatim « parc Cauderes Talence » (44.8134, -0.5783) ; OSM way 875238371 (table, robinet), way 875238373 « Jardin partagé », way 875238374 (aire de jeux).
- Incertain : tout est issu d'OSM (note « TC_2020 ») ; absent de la page de la Ville.

## parc-colette
- Sources : Ville (page parcs : 5 000 m², toboggan, tyrolienne, cabane, balançoire araignée, tables, jardin familial, ferme itinérante) ; OSM way 492958251 (2 aires de jeux, abri).
- Incertain : dates de passage de la ferme itinérante (mars à octobre/novembre selon la Ville).

## parc-andre-curvale
- Sources : Ville (page parcs : parc ancien 1830, Orme du Caucase, mini-jeux) ; https://www.talence.fr/decouvrir-talence/environnement/refuge-lpo/ ; fiche Parc-curvale.pdf (Orme du Caucase planté vers 1850, arbre remarquable de France, 24 oiseaux) ; diagnostic LPO Triaire/Curvale (4 nichoirs dont 2 occupés par des mésanges charbonnières) ; OSM way 230271090 (horaires, chiens en laisse) et arbre OSM Zelkova carpinifolia.
- Incertain : adresse (Roustaing vs Suzon) ; type de jeux exact.

## parc-triaire
- Sources : Ville (page parcs et refuge LPO : 4 000 m², jardin partagé, zone boisée, jeux) ; fiche Parc-triaire.pdf (24 oiseaux dont 2 vulnérables UICN, 6 papillons, pelouses sèches, zone boisée à fermer) ; OSM way 521087798 (3 tables, agrès, aire de jeux) ; actualité Ville « Parc Triaire : intervention sur un tilleul » non utilisée.
- Incertain : essences d'arbres.

## bois-de-thouars
- Sources : Ville (page parcs : 60 ha, parcours de 4 km, étang, château, Néottie nid d'oiseau, sangliers, martin-pêcheur, aires de jeux et stations de sport) ; https://www.talence.fr/decouvrir-talence/environnement/ (rucher municipal de 6 ruches depuis 2012, page « le-rucher-de-thouars » aujourd'hui 404) ; OSM way 230240314 (bord le plus proche ≈ 1 453 m) ; https://www.talence.fr/decouvrir-talence/patrimoine/parcours-patrimoine/.
- Incertain : localisation du rucher (clôturé, non visitable a priori) ; fréquence réelle des observations (sanglier, martin-pêcheur).

## parc-chantecler
- Sources : Ville (page parcs : arbres centenaires, L'Inconnue) ; OSM way 230271089 (≈ 1 ha).
- Incertain : essences, bancs, aire de jeux (non confirmés).

## butte-rosa-parks-thouars
- Sources : Ville (page parcs : 1,2 ha, aire de jeux, bancs, brumisateurs, boîte à livres) ; OSM way 803015033.
- Incertain : fonctionnement des brumisateurs (été seulement).

## Écartés ou non retenus
- Eau Bourde : hors rayon (Bègles/Villenave, > 3 km). Ruisseau d'Ars : canalisé et souterrain en grande partie (Wikipédia), seul un tronçon ouvert est cartographié (≈ 0,5 km, étang Bonnefont : accès non confirmé).
- Étang Bonnefont (OSM way 34491726, ≈ 500 m), bassin OSM way 447406517, zone humide OSM way 1037153488 / réservoir way 35169513 (≈ 0,9 km), prairie OSM way 953995632 : nature et accès non confirmés.
- Place de la Victoire 14-18 (OSM way 34590060, ≈ 280 m, 14 bancs) : aucun élément nature sourcé. Jardin de la Passerelle (Nominatim, ≈ 1,4 km), Jardicoeur, La Fourmilière (potager étudiant OSM, ≈ 1 km, géré par l'association L'astragale et la Fourmi) : accès au public non confirmé. Aire de jeux OSM way 620979366 (2-6 ans, ≈ 630 m) : nom et lieu inconnus.
- Parcs de Pessac/Bègles/Bordeaux (Parc des Sœurs, Jardin d'Ars, Parc Lavielle) : hors commune.
- Parc de Thouars « butte » et Bois Lafitte (OSM forêt ≈ 1,1 km) : Bois Lafitte non documenté.

## Enrichissement par l'open data (2026-11-03)

Méthode : `scripts/extraire-open-data.py` (API Explore v2.1 de opendata.bordeaux-metropole.fr et Overpass, rayon 1 600 m) ; détail dans `data/sources/open-data-synthese.md`, points curés dans `data/points-interet.json`. Nouveaux champs : `vers` (formule toute faite pour « vers le parc Peixotto », pas de règle grammaticale côté site), `canopee` (% de canopée de la maille de 232 m qui contient le lieu, jeu `met_vegetation_urbaine`), `fraicheur` (écart de température minimal, en °C, de la thermographie du 17 juin 2022, jeu `ri_icu_ifu_s`, mailles à −3 °C ou moins seulement), `points` (ids de `points-interet.json` rattachés au lieu).
Pour `bois-de-thouars`, `canopee` (59 %, maille 44.7932, -0.5933) et `fraicheur` (−5 °C) sont ceux de la lisière nord-est, seule partie du bois dans le rayon de 1,6 km.

Corrections et ajouts, par lieu
- `parc-bel-air` : `eau` passe à `true` (point d'eau « Jardins de Bel Air », Ville, `tal_pointseaulibreacces`, 44.80185, -0.57969). L'ancienne valeur `false` était une erreur.
- `parc-margaut` : platanes de grande taille, magnolia près du château, toilettes à proximité, `eau` (Métropole, `ec_parc_s`). Espèce du magnolia à confirmer.
- `parc-du-couvent` : immenses platanes, chênes et marronniers, arbres fruitiers récents (Métropole, `ec_parc_s`) ; espace de libre cueillette 44.81044, -0.58392 (Ville, `tal_jardinspartages`, texte « prévu à la plantation » : à confirmer). Le robinet OSM voisin porte `drinking_water=no` : mentionné comme non potable.
- `parc-chantecler` : sous-bois de 6 000 m² (charmes, chênes) sur 7 000 m² (Métropole). Écart de surface avec OSM (≈ 1 ha) noté dans `notes`.
- `parc-peixotto` : `eau` et `aire_jeux` confirmés (Ville), bassin public (`to_hydro_s` + OSM), puits (OSM node/1338095729), cyprès chauve et peuplier noir (OSM, espèces), îlot de fraîcheur −4 °C au nord. Les « cygnes » viennent d'un texte de la Métropole de 2012 : à vérifier.
- `bois-sourreil` : îlot de fraîcheur −5 °C, canopée 39 %.
- `parc-cauderes` : aire de jeux et jardin partagé confirmés (Ville), catalpa et platanes (OSM, espèces).
- `parc-robespierre` : tour à hirondelles géolocalisée (OSM node/13705331043).
- `parc-andre-curvale` : zelkova classé en 2008, 4,45 m de circonférence (Métropole) ; jardin partagé confirmé.
- `parc-triaire` : aire de jeux confirmée ; Jardin de la Passerelle voisin.
- `campus-haut-carre` : prairies de fauche et chênaie-charmaie à enjeu fort (`ec_habitat_naturel_s`), bassin de rétention, conifères de l'ouest (PCRS), prairie « Éco-pâturage » (OSM way/1311451354), roselière et points d'eau naturels à l'ouest (accès à confirmer).
- `bois-de-thouars` : panneau faune (OSM node/9312581676), bassin de rétention (`to_hydro_s` gid 72368), prairie humide à souchet bai et chênaie à chêne tauzin (`ec_habitat_naturel_s`), îlot −5 °C. Tous à la lisière nord-est (≈ 1,5 km), ce qui confirme `distance_lisiere`.

Nouveaux lieux (sources open data seules, rien de vérifié sur place)
- `square-pineau` (44.8130, -0.5910, ≈ 750 m N) : point d'eau et aire de jeux (Ville, `tal_pointseaulibreacces`, `tal_airesjeux`), 8 conifères PCRS à côté. Adresse déduite de la rue OSM la plus proche.
- `bois-lafitte` (44.7972, -0.5844, ≈ 1,1 km S) : aire de jeux (Ville) et forêt OSM ; canopée 33 %. Coordonnées de l'aire de jeux ; périmètre du bois non cartographié ici.
- `parc-fehlmann` (44.8202, -0.5854, ≈ 1,55 km N, à la limite) : point d'eau, aire de jeux, jardin partagé (Ville ; le jeu écrit « Felhman »).
- Aires de jeux sans nouveau lieu (points `aire_jeux` seulement) : parc du colonel Mol (voisin de Caudérès), square Duguesclin, Clos Michelet, squares René Maran, de la Scierie, Jean Bouin, avenue Racine.
