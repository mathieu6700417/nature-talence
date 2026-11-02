# Inventaire visuel de la végétation vue de la rue — synthèse

Date de l'analyse : 2 novembre 2026. Rayon : environ 1,5 km autour du Forum des Halles de Talence (44.8065, -0.5880).
Données détaillées : `inventaire-visuel.json`, avec 1 321 points localisés et 2 029 éléments.

## 1. Méthode et couverture

- **Source des images.** Panoramax est la seule source utilisée. Google Street View est exclu par ses conditions d'utilisation. Mapillary n'a pas été utilisé, faute de jeton d'accès sans compte.
  - L'API STAC recense **64 402 images** dans l'emprise (Panoramax couvre très bien Talence).
  - **Bordeaux Métropole** : 38 150 panoramas 360° sous Licence Ouverte Etalab 2.0, pris de 2019 à 2025, surtout en mai 2020, juin 2021 et septembre 2023.
  - **Contributeurs OSM** (trouyer, gitouche…) : photos frontales sous CC BY-SA 4.0, prises de 2018 à 2026, dont des séries d'avril 2024, 2025 et 2026 utiles pour les floraisons.
- **Échantillonnage.** Chaque image a été rattachée à la rue OSM la plus proche (à moins de 20 m).
  - Dans un rayon de 600 m : une image tous les 70 m environ, sur 50 des 54 rues.
  - De 600 m à 1,5 km : une image tous les 200 m sur les axes principaux, et une tous les 500 m environ sur les rues résidentielles (220 des 274 rues).
  - Compléments : 99 images aux abords de 11 parcs, et 45 images de printemps (mars-avril) dans le rayon de 600 m, pour les floraisons et l'essence des arbres d'alignement.
  - Le choix privilégie les saisons feuillées (avril à septembre) et les panoramas 360°. Pour ces panoramas, on a extrait deux vues perpendiculaires à la rue, à gauche et à droite, pour bien voir les jardins.
- **Images analysées : 903**, une par une. Environ 110 se sont révélées inexploitables : prises de nuit (images noires), floues, prises depuis un train, ou en contre-jour total. Une image montrant un intérieur privé (img470) a été écartée.
- **Années de prise de vue** : 2018 (34), 2019 (25), **2020 (299)**, 2021 (76), **2023 (273)**, 2024 (38), 2025 (122), 2026 (36).
- **Rues non couvertes dans le rayon de 600 m**, faute d'image Panoramax : rue Condorcet, rue Pierre Romain, impasse Roul, allée Samuel Paty (en partie). Entre 600 m et 1,5 km, 35 rues n'ont aucune image. Ce sont surtout des impasses et des allées de résidences.
- **Vues aériennes IGN** (ORTHOIMAGERY.ORTHOPHOTOS, WMS data.geopf.fr) : seulement pour un contrôle d'ensemble. On y voit la trame des jardins et les masses boisées de Peixotto, Margaut, Robespierre et du campus. Elles ne servent pas à identifier les essences.

### Lire une entrée du JSON

- `lat`/`lon` : position **estimée de l'élément**, pas celle de la caméra. Elle est calculée à partir de la position de la caméra, de l'azimut de la vue, de la position de l'élément dans l'image et de la distance estimée.
  - Précision réaliste : ±10-15 m pour un élément en bord de rue, davantage pour un arbre vu de loin (au-delà de 30 m).
  - `position_camera` donne le point de prise de vue.
- `repere` est construit pour être vérifiable sur place : rue, côté de la chaussée (au compas), distance approximative au croisement le plus proche, repère visuel (portail vert, muret…), distance et direction depuis le Forum. Il ne contient jamais de numéro de maison.
- `image_source_url` : l'image Panoramax (SD).
  - Pour les panoramas 360°, c'est l'image équirectangulaire complète. Pour une fiche, il vaut mieux ouvrir `image_page_url` (visionneuse Panoramax) et orienter la vue selon `direction_vue`, ou recadrer.
  - Crédit : `auteur` + `licence`. Pour Bordeaux Métropole, il faut citer « Bordeaux Métropole — Licence Ouverte Etalab 2.0 » ; pour les contributeurs, « pseudo (Panoramax) — CC BY-SA 4.0 ».
- `ref_analyse` : identifiant interne de l'image analysée (imgNNN). Les images recadrées restent dans le scratchpad et ne sont pas versionnées.
- `confiance` : sur 2 029 éléments, 190 sont « certain », 695 « probable », 37 « genre seulement » et 1 107 « incertain ». **Dans une fiche, n'affirme une essence qu'au niveau « certain » ou « probable ».**

## 2. Les pépites (à vérifier sur place avant publication)

Les dates de prise de vue vont de 2020 à 2026 : un jardin privé a pu changer depuis.

| # | Quoi | Où (repère) | Saison | Image | Confiance |
|---|---|---|---|---|---|
| 1 | **Cascade d'eau sur un rocher** au centre d'un rond-point, entourée de genévriers rampants | Rond-point av. du Maréchal Leclerc / rue du Pr Arnozan / allée Peixotto, à environ 100 m au nord-ouest du Forum | toute l'année (si elle fonctionne) | img341 (2020), img347 (2023) | certain |
| 2 | **Glycine mauve sur le vieux mur du parc du Couvent**, sous un grand cèdre aux branches retombantes, avec lierre et magnolia grandiflora | Rue de Suzon, côté nord, entre la rue Peydavant et la rue Francisco Ferrer, à environ 560 m au nord-est | glycine en avril-mai, le reste toute l'année | img570, img793 (mai 2020) | glycine probable (grappes visibles), cèdre probable |
| 3 | **Marronniers d'Inde du parc Robespierre** : grandes feuilles « en main », marrons à ramasser | Angle rue Peydavant / rue Chambrelent, entrée du parc (allée beige, gabion) | fleurs en avril, marrons en septembre-octobre | img518, img777, img779 | certain/probable |
| 4 | **Énorme marronnier en fleurs** sur la pelouse d'une placette | Rue Blaise Pascal, entre la rue Parmentier et la rue Chambrelent, côté nord, à environ 310 m à l'est | « chandelles » blanches en avril | img507, img898 (avril 2024) | certain |
| 5 | **Marronniers en fleurs du parc Peixotto**, à côté des tables de pique-nique, avec pelouse et ifs taillés en cône devant le château | Allée Peixotto, côté sud, à environ 250 m au nord-ouest | avril | img861, img334, img859 (avril 2026) | certain |
| 6 | **Grand conifère conique au tronc roux**, identifié comme séquoia géant, visible du virage du tram | Cours de la Libération, côté ouest (clôture du campus), face à l'allée Peixotto | toute l'année | img760-762, img332, img335 | probable |
| 7 | **Séquoia à plusieurs troncs à écorce rousse et douce**, à toucher, au milieu d'un rond-point engazonné | Rue Jacques Chaban Delmas, près de la rue Pierre Curie (médiathèque), à environ 600 m au nord | toute l'année | img395 | probable (séquoia toujours vert plutôt que géant) |
| 8 | **Glycine qui envahit la grille** d'une petite maison ancienne à volets bleu-vert | Rue Frédéric Sévène, côté nord-est, juste après le rond-point Crespy, à environ 170 m à l'est | fleurs en avril-mai (absentes sur l'image) | img228 | probable |
| 9 | **Glycine en pleine floraison** sur une palissade en bois brun | Rue Camille Pelletan, angle rue du Haut Carré / rue Gutenberg, côté nord | avril | img833 (avril 2025) | probable (floraison nette) |
| 10 | **Deux lilas des Indes rose framboise** de part et d'autre de la rue, avec un grand cèdre et un jeune figuier | Rue Camille Pelletan, angle rue du Haut Carré | juillet-septembre | img327 (juillet 2025) | probable |
| 11 | **Cerisier du Japon à fleurs roses doubles** au-dessus d'un portail vert | Rue de Suzon, angle rue Lamartine, côté nord | avril | img868 (avril 2026) | probable |
| 12 | **Magnolia grandiflora** (grandes fleurs blanches en juin) à côté de la plaque « Rue de Suzon » sur le vieux mur, derrière les feux | Rue de Suzon, angle rue Bourges, côté sud, à environ 780 m au nord-est | fleurs en juin-juillet, feuilles vernissées toute l'année | img599 | certain |
| 13 | **Magnolia grandiflora en fleurs** et hortensias roses derrière un portail blanc | Rue du Commandant Charcot, près de la rue Clément Thomas | juin | img807, img249 | certain |
| 14 | **Grande glycine** (gousses en juin) sur le pilier d'un portail vert, au-dessus d'un muret en pierres plates | Rue Georges Bizet, près de la rue Charles Gounod, à environ 1,1 km au sud | avril-mai | img026 | probable |
| 15 | **Bananiers** qui dépassent des jardins | Rue Maurice Berteaux (portail blanc, maison en bois rouge), rue de Suzon (près de la rue Lamartine), place de l'Église, rue Paul Doumer, rue du Colonel Picard | été | img568, img564, img387, img741, img273 | probable |
| 16 | **Pins parasols** : pommes de pin et aiguilles au sol | Avenue Roul (un pin protégé par une petite clôture en bois), rue / résidence Frédéric Sévène, campus, rue André Gide, rue Camille Pelletan, rue de Pacaris | toute l'année | img092, img330, img241, img243, img324, img434, img150 | certain/probable |
| 17 | **Parc boisé avec muret moussu** | Impasse Suzon, angle allée des Foreurs | toute l'année | img585 | certain |
| 18 | **Grand chêne** à l'entrée d'un parc public avec pelouse et bancs | Rue Dourout, près de la rue Robespierre (derrière la clôture verte) | glands en automne | img553 | probable |
| 19 | **Poteaux électriques entièrement habillés de lierre** (des « poteaux-plantes ») | Impasse de la Fauvette, rue du Pr Arnozan, rue Jean Zubieta, route de Toulouse, impasse Duprat et Durand, rue Peydavant | toute l'année | img551, img523, img558, img269, img142, img534 | probable |
| 20 | **Vignes du vignoble** derrière une grille verte, à voir depuis la piste cyclable | Avenue de la Mission Haut-Brion, avenue de la Vieille Tour, à environ 1,3-1,5 km à l'ouest | raisins en septembre | img320, img321, img318 | certain/probable |
| 21 | **Liquidambars** déjà rouges en septembre, feuilles en étoile | Avenue du Dr Albert Schweitzer (terre-plein), rue de Suzon près de l'avenue Espeleta | automne | img308, img371 | probable |
| 22 | **Lauriers-roses en massif** sur un rond-point, à côté de sculptures en pierre dressées | Rue Peydavant, rond-point près de l'abribus « Peydavant » | juillet-août | img173 | probable |
| 23 | **Ginkgo** (feuilles en éventail, jaune d'or en novembre) | Angle cours de la Libération / av. Georges Clemenceau, près du feu et du bâtiment technique | automne | img109, img112 | probable |
| 24 | **Citronnier en pot chargé de citrons** | Impasse des Platanes | septembre | img159 | probable |
| 25 | **Néfliers du Japon (bibaciers)** : fruits orange au printemps | Rue Michel Montaigne près de la rue Blumerel (palissade bois brun) ; rue Clément Thomas (grille verte ouvragée) | fruits en mai-juin | img194, img806 | probable |

## 3. Par secteur : ce qu'un parent peut montrer

### Forum des Halles, Peixotto et Margaut (0-300 m)

- **À voir** : le rond-point à cascade (pépite 1), les grandes pelouses et les tables de pique-nique de l'allée Peixotto, les marronniers en fleurs en avril, les ifs taillés en cône devant le château, et un long muret en moellons le long de l'allée.
- **Bassin** : il longe l'allée côté Margaut (img862, avenue du Maréchal Leclerc). C'est cohérent avec le « nouveau plan d'eau » de `lieux.json`.
- **De l'autre côté du cours de la Libération** : le séquoia du campus (pépite 6) et un ginkgo au carrefour Clemenceau.
- **Rue Michel Slitinsky** : une rangée de petits arbres en boule le long du bâtiment, peut-être des cerisiers d'ornement (incertain).

### Rue Peydavant, parc Robespierre, Blaise Pascal, Chambrelent (150-500 m à l'est et au nord-est)

- **Le meilleur secteur pour les marronniers** : parc Robespierre, square Chambrelent et placette Blaise Pascal. Fleurs en avril, marrons de mi-septembre à octobre.
- **Rue Robespierre** : platanes à l'écorce en puzzle, peupliers d'Italie et un vieux tronc têtard « sculpture » (img541).
- **Rue Parmentier** : alignement de grands platanes sur une pelouse, et un saule pleureur à côté d'un abri en bois (img508, img515).
- **Rue Peydavant** : platanes probables, oliviers dans les jardins, un mur couvert de vigne vierge (rouge en octobre) et des hortensias bleus (img518, img534).

### Rue de Suzon, parc du Couvent, Lamartine, Maurice Berteaux (450-800 m au nord et au nord-est)

- **Le secteur le plus riche en jardins** : vieux murs du couvent (glycine, cèdres, magnolia, lierre), cerisier du Japon à l'angle de la rue Lamartine, bananier, palmiers de Chine, liquidambar et magnolia grandiflora à l'angle de la rue Bourges.
- **Rue Maurice Berteaux** : magnolia grandiflora, palmiers de Chine, bananier et prunier pourpre.
- **Rue Lamartine** : lilas des Indes en fleurs en été, grand massif de bambous, grande pelouse arborée avec un rocher blanc (img579).

### Rond-point Crespy, Frédéric Sévène, Verdeau, Antoine Carles, Jouis (150-650 m à l'est et au sud-est)

- **Glycine** de la grille près du rond-point Crespy (pépite 8).
- **Rue Frédéric Sévène** : une maison couverte de vigne vierge face à un catalpa (img231) ; grands cèdres du Liban (img237, img240) ; immense pin parasol à l'entrée de la résidence et vieux mur à lichens (img241, img243).
- **Rue Verdeau** : laurier-rose et deux arbres taillés en parasol plat. Ce sont plutôt des mûriers-platanes que des figuiers ; à vérifier.
- **Rue Antoine Carles et rue Blumerel** : glycine probable (img219), volubilis (ipomée), lilas des Indes, et pin parasol sur une pelouse publique.
- **Rue Jouis** : massif de bambous derrière une grille sur muret de pierre (img517).

### Sud proche : Mégret, Lasserre, Trémeuge, Place Peydavant (200-700 m au sud)

- **Rue de Mégret** : bosquet de marronniers sur une pelouse publique à barrière blanche, à environ 200 m du Forum (img105) ; vieux muret moussu ; une arche de lierre au-dessus d'une porte.
- **Avenue Georges Lasserre et rue de Trémeuge** : grands chênes isolés sur des pelouses de résidences, dont un chêne persistant très étalé (img078, img103, img104).
- **Rue Montesquieu et rue du Général Margueritte** : lauriers-roses (massif public sur une placette pavée, img204), lilas des Indes et olivier.

### Cours de la Libération et campus (ouest et sud-ouest)

- **Cours de la Libération** : alignement de **tulipiers de Virginie** (probable) dans la bande d'herbe entre la chaussée et la piste cyclable, vers les rues Marivaux et Pey-Berland (img005-009). On y voit aussi des arches végétales taillées, des peupliers d'Italie et un muret de soutènement moussu.
- **Près de l'avenue du Lycée** : arbres en fosse du genre *Prunus* (cerisiers d'ornement, déjà défleuris fin avril).
- **Mur en pierre blonde** dépassé par un cèdre et un pin parasol (img765, vers l'avenue Espeleta).
- **Avenue Roul et campus** : pins parasols sur les pelouses, et voie de tram engazonnée.
- **Avenue de l'Université** : rocaille de gros rochers sous un pin parasol, pelouse à pâquerettes (img065).

### Nord-ouest : Camille Pelletan, Haut Carré, Gutenberg, Fernand Izer (700 m-1,2 km)

- Glycine (avril), lilas des Indes (été) et marronniers en fleurs (avril).
- **Parc près de la place de l'Église** : grand pin, pelouse, arbres taillés en têtard (img386). Bananier et gros rochers sur le parvis (img387).
- **Rue Fernand Izer** : magnolia grandiflora derrière une clôture bleue à volutes et piliers roses (img438). C'est un repère facile.

### Est et sud-est : Clément Thomas, Charcot, Leysotte, Raymon Aron (700 m-1,4 km)

- Magnolias grandiflora en fleurs en juin (Charcot), néflier du Japon, pins, épicéa bleu.
- **Chemin de Leysotte** : friches à herbes hautes avec chênes et pins, palmier des Canaries (img260, img261).
- **Rue Raymon Aron** : très gros laurier-rose blanc à l'angle (img155).
- **Chemin de Bénédigues** : un vrai petit bois de robiniers en bord de chemin (img141, img143).

### Périphérie (1,2-1,5 km)

- **Sud-ouest, avenue de la Marne** : parc avec gros rochers à escalader, cèdre et robiniers (img014).
- **Avenue de Thouars** : rangée de peupliers d'Italie, et un pin taillé en nuages (un « bonsaï géant », img853).
- **Nord-est** : grands arbres derrière de vieux murs couverts de lierre au carrefour Roosevelt / Albert 1er / route de Toulouse (img747-749).

## 4. Ce qu'on voit « partout » (pour les fiches `partout`)

Fréquence = nombre d'éléments relevés dans l'inventaire, tous niveaux de confiance confondus.

- **Laurier-rose** : très fréquent (environ 100 relevés). Fleurs roses, blanches ou rouges de juin à septembre. Toxique : regarder sans toucher ni porter à la bouche.
- **Lierre** (environ 100) : sur les murs, les haies et surtout les poteaux. Fleurs en octobre, pleines d'insectes ; baies noires en hiver.
- **Cèdres** (environ 75, souvent dans les grands jardins anciens) et **pins parasols** (environ 40).
- **Haies de laurier-palme** (environ 60) et de **photinia** (environ 25, pousses rouges en avril).
- **Palmiers de Chine** (*Trachycarpus*, environ 40) et **cyprès** (d'Italie, de Provence) en colonne (environ 65).
- **Pruniers à feuilles pourpres** (environ 55) : fleurs rose pâle en février-mars, petites prunes en été.
- **Magnolias grandiflora** (16), **lilas des Indes** (environ 18, en fleurs de juillet à septembre), **bananiers** (6), **oliviers** (environ 25).
- **Glycines** (9, dont 7 probables) : à vérifier sur place en avril.
- **Murets et vieux murs de pierre moussus** : environ 50 relevés de type « muret » (et près de 100 mentions de murs au total), surtout rue de Suzon, cours de la Libération, avenue de la Vieille Tour, rue Frédéric Sévène et rue de Mégret.
- **Rares ou absents des images** : mimosa (aucun identifié), kaki (aucun), arbre de Judée (aucun), nichoirs ou nids (aucun visible à cette résolution). Figuiers : seulement 2 probables (rue du Commandant Charcot ; jeune figuier rue Camille Pelletan).

## 5. Croisement avec les autres sources

`arbres.json` (OSM et open data) et `lieux.json` ont été croisés avec l'inventaire.

**Ce que l'inventaire apporte**
- Pour l'essentiel, l'inventaire visuel **complète** ces sources : `arbres.json` compte 373 arbres OSM sans essence. L'inventaire en propose une pour le cours de la Libération (tulipiers probables, *Prunus* près de l'avenue du Lycée) et pour l'avenue Roul (pins parasols ; OSM n'y indique qu'un platane).
- Il complète aussi la rue Peydavant et le parc Robespierre (marronniers d'Inde et platanes, alors que `lieux.json` ne cite pas d'essence), ainsi que la rue de Suzon (cèdres, magnolia, glycine et liquidambar, en plus des tilleuls argentés et troènes du Japon de l'open data au stade Suzon, non vus ici).

**Ce que l'inventaire confirme**
- `lieux.json` / parc-margaut : le « plan d'eau » est confirmé, avec un bassin le long de l'allée (img862, avril 2026).

**Ce qui est absent des autres sources**
- La **cascade du rond-point Leclerc / Arnozan** ne figure ni dans `lieux.json` ni dans `arbres.json`. C'est un lieu nouveau, à 100 m du Forum.

**Points de vigilance (contradictions possibles)**
- *Parc Peixotto* : OSM y signale un **cyprès chauve**. Le grand conifère vu depuis le cours de la Libération (pépite 6) a été identifié comme **séquoia géant (probable)**, côté campus. Les deux peuvent coexister. Mais si l'arbre perd ses aiguilles et devient roux en novembre, c'est le cyprès chauve : à vérifier sur place.
- *Carrefour Roosevelt / route de Toulouse* : l'open data Bordeaux Métropole donne des **tilleuls** (flavescens et argentés) sur le boulevard Roosevelt. Les images montrent de « grands platanes (probables) » au carrefour, derrière un mur. Il peut s'agir d'arbres différents : on ne peut pas trancher, à vérifier.
- Les « platanes de 1914-1964 du parc Caudères » n'ont pas été vus : aucune image ne donne directement sur le parc.

## 6. Limites

- **Résolution et lumière.** Beaucoup de panoramas 360° de 2019-2021 sont en contre-jour ou surexposés. Plus de la moitié des éléments sont donc « incertain ». Les grands feuillus lointains (tilleul, érable, frêne, chêne) sont souvent indéterminés.
- **Ancienneté.** 37 % des images analysées datent de 2020 ou d'avant. Un arbre a pu être abattu, une haie arrachée, un jardin refait. Certaines dates EXIF de Bordeaux Métropole semblent fausses (feuillage d'été sur des images datées de novembre ou de janvier).
- **Contrôle des identifications.** Un contrôle par sondage du coordinateur sur 12 pépites a conduit à corriger 2 identifications :
  - img215 : un « figuier » est devenu « mûrier-platane ou figuier, incertain » ;
  - img228 : « glycine en fleurs, certain » est devenu « glycine probable, pas de fleurs visibles ».
  Les 10 autres pépites ont été confirmées (glycines rue de Suzon et rue Camille Pelletan, cerisier rue de Suzon, magnolia rue de Suzon, marronnier rue Blaise Pascal, séquoia rue Chaban Delmas, cascade, etc.). **Toute essence citée dans une fiche doit être vérifiée sur place au moins une fois.**
- **Ce qu'on ne voit pas depuis la rue** : l'intérieur des parcs (seulement leurs abords), les arrière-jardins, les petits détails (nids, nichoirs, insectes, fruits).
- **Positions.** La position GPS des images est précise à ±5 m ; la distance à l'élément est estimée à l'œil.
- **Données personnelles.** Aucun numéro de maison, aucune personne, aucune plaque, aucun nom de commerce privé ne figure dans les repères. Les images Panoramax sources sont floutées par la plateforme, mais il faut les revérifier avant de les utiliser comme photo de fiche, car des personnes peuvent apparaître.
