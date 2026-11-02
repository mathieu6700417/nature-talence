# Synthèse des observations naturalistes autour de Talence centre

Données collectées le 2026-11-02. Centre : Forum des Halles ≈ 44.8065, -0.5880.

## Sources et méthode

- **iNaturalist API v1** (qualité « research grade » uniquement), noms français `locale=fr`.
  - Rayon 1,5 km : 4 864 observations, 728 espèces.
  - Rayon 3 km : 12 512 observations, 1 532 espèces. Ce rayon inclut le site INRA de Villenave-d'Ornon (très sur-prospecté), des quartiers de Bègles, Pessac et Bordeaux Saint-Genès : à utiliser comme complément, pas comme « Talence ».
  - Saisonnalité obtenue en interrogeant `species_counts` avec `month=1..12` (aux deux rayons).
  - Agrégation spatiale : 12 588 observations du rayon 3 km téléchargées avec coordonnées, rattachées à 7 zones de 170 à 450 m autour de lieux repérés par les `place_guess` et par grille de cellules d'environ 250 m. Les limites des zones sont des approximations.
- **GBIF** (occurrences PRESENT, boîte englobante ≈ 3 x 3 km, 16 260 données). Jeux de données présents : Oiseaux des Jardins (3 609), iNaturalist (3 192), CREPS de Bordeaux (crepsdebordeaux, iNaturalist opportuniste) (2 269), Pl@ntNet (1 435), eBird (1 051), SPIPOLL (689), Observatoire des Papillons des Jardins (641), Atlas de la nature de Bordeaux Métropole - flore 2013 (404), FAUNA / Faune-France, Projet 3B. Les champs `gbif_nb_obs_zone` et `gbif_mois` du JSON en sont issus (fusion par nom latin, sans dédoublonnage avec iNaturalist : GBIF contient aussi des copies d'iNaturalist, ne pas additionner).
- **Non accessibles** : INPN (page commune 404), Faune-Aquitaine (redirection, pas d'API ouverte), LPO Aquitaine. Leurs données arrivent en partie via GBIF (Faune-France, FAUNA). Aucun fichier « ABC Talence » exploitable trouvé ; l'Atlas de la nature de Bordeaux Métropole est présent via GBIF.

Fichier : `especes-observees.json` (448 entrées : insecte 157, plante 100, oiseau 93, arbre 25, araignée 19, mollusque 16, champignon 13, autre 7, mammifère 6, amphibien 5, reptile 4, lichen 3). Contenu : top 300 du rayon 1,5 km, tous les vertébrés et mollusques, les espèces « wow » pour enfant, les arbres/champignons/lichens (>= 3 obs), plus les oiseaux et plantes fortement vus sur GBIF mais absents d'iNaturalist (source indiquée « GBIF seul »). `mois_observes` = 1,5 km ; `mois_observes_3km` = 3 km ; `lieux_connus` = nombre d'observations par zone (rayon 1,5 km).

## Lieux riches (agrégation spatiale, rayon 1,5 km)

1. **Parc Peixotto** : plus forte densité (~840 obs dans une cellule de 250 m, ~600 avec ce nom explicite). Oiseaux (merle, rougegorge, mésanges, écureuil roux, hérisson, ragondin, canard colvert, gallinule), arbres, champignons, insectes.
2. **CREPS / campus sud, cours de la Libération** (≈ 44.800, -0.602) : ~820 obs plus ~410 dans la cellule voisine. Prairies, mares et friches : papillons (azuré, cuivré, souci, myrtil), libellules (ischnure, crocothémis, sympétrums), araignées-crabes, orchidées (ophrys abeille, sérapias), lézard des murailles, gambusies et carpes (plan d'eau).
3. **Nord Peixotto / rue Arnozan** (~640 obs) : continuité du parc, jardins, vieux arbres.
4. **Campus (Haut-Carré, Arts et Métiers, limite Pessac)** : ~560 obs, bords de pelouses et talus fleuris, lapins de garenne, thomises.
5. **Campus nord (Domaine universitaire)** : sous-bois, escargots et limaces, cloportes, cyclamens, champignons.
6. **Résidence Santillane** : jardin résidentiel (zoropse, stéatode noble, mésanges).
7. **Bois de Sourreil** (nord-est, ~110 obs) : petit bois ; coprins, gendarmes, argiope.

## Limites des données (biais)

- Pas de comptage standardisé : le nombre d'observations mesure l'intérêt des observateurs, pas l'abondance. Les espèces discrètes (chauves-souris, rapaces nocturnes, petits mammifères) sont sous-représentées ; les photogéniques (papillons, libellules, araignées) sur-représentées.
- Quelques observateurs très actifs dominent des zones (CREPS, Peixotto, INRA). Le pic de gobemouche noir (Aug-Sep) ou de pinson du nord (Oct-Jan) reflète en partie des sessions de suivi ou des événements ponctuels.
- Hiver peu couvert : décembre = 52 obs au rayon 1,5 km contre 659 en août (période mai-septembre = 70 % des données). Un trou en hiver ne signifie pas absence.
- Plantes ligneuses communes (platane, chêne, tilleul, marronnier, ginkgo) très peu notées car « évidentes » : s'appuyer sur les connaissances locales du terrain plutôt que sur ces comptages. Platane et ginkgo n'apparaissent pas dans le fichier alors qu'ils sont certainement présents.
- Perruches à collier, chauves-souris, martinets en vol : aucune ou presque observation « research grade » ; ne pas promettre.
- Le rattachement à un lieu se fait avec un rayon d'incertitude de 100-300 m ; certaines observations portent la coordonnée de l'adresse, pas du point précis.
- GBIF et iNaturalist se recoupent : ne pas additionner.

## Oiseaux (93 espèces)

**Les plus communs** (obs 1,5 km / 3 km ; GBIF, avec Oiseaux des Jardins et eBird, gonfle les mésanges, merle, tourterelle) : moineau domestique (220), merle noir (187), rougegorge familier (151), bergeronnette grise (114), rougequeue noir (114), canard colvert (117), pie bavarde (103), étourneau sansonnet (101), mésange charbonnière (89), pigeon biset (82), mésange bleue (71), pigeon ramier (69), pouillot véloce (63), chardonneret élégant (59), faucon crécerelle (54), orite à longue queue (53), pinson des arbres (52), verdier d'Europe (39), pic vert (36), fauvette à tête noire (33). Aussi : gallinule poule-d'eau (118 à 3 km), moineau friquet, grive musicienne, accenteur mouchet.

**Saisonnalité** (mois 3 km, 1 = janvier) :
- **Toute l'année** : merle, moineau, pie, étourneau, mésanges, pigeons, tourterelle turque, rougequeue noir, pic vert, crécerelle, colvert, gallinule.
- **Hivernants (octobre à mars, absents d'avril à septembre)** : pinson des arbres (pic octobre-novembre, quasi nul d'avril à septembre), pouillot véloce (hivernant/migrateur : octobre-mars, quasi nul de mai à août), tarin des aulnes (janvier-mars), grive mauvis (novembre-janvier), troglodyte et rougegorge nettement plus vus de septembre à décembre (rougegorge : pic octobre-novembre quand il redevient visible et chante, creux mai-août), choucas des tours (novembre-décembre).
- **Estivants / migrateurs** : martinet noir (avril à juillet, surtout mai), hirondelle rustique et de fenêtre (avril à août), rossignol philomèle (avril-mai), hypolaïs polyglotte (mai-septembre), gobemouche noir (passage août-septembre), gobemouche gris (septembre), rougequeue à front blanc (avril-septembre), faucon hobereau (août-septembre), torcol (avril et août).
- Chant intense : mars à mai (merle, rougegorge, fauvette, mésanges).
- **Wow pour enfant** : héron cendré (rares mais réguliers, parc et plans d'eau), faucon crécerelle (sur place dans le ciel), pic vert (rire sonore), orite à longue queue (petites boules en groupe), geai, écureuil, canards colvert et mandarin (octobre), gallinule, cormoran (automne), choucas.

## Mammifères (6 espèces, peu de données)

Écureuil roux (73 à 1,5 km ; Peixotto ; vu surtout août-novembre et janvier-mars), hérisson commun (8 ; avril-novembre, surtout crépuscule, jardins du parc), lapin de garenne (campus, pic juillet), ragondin (plans d'eau), rat surmulot, renard roux (5 obs à 3 km, octobre-novembre). Chauves-souris absentes du jeu de données : à ne pas promettre.

## Reptiles et amphibiens

- **Lézard des murailles** : 100 obs à 1,5 km (le plus commun hors oiseaux), de février à novembre, pic avril-septembre, murets et talus du campus/CREPS, rues sud de Peixotto. Absent décembre-janvier.
- Tarente de Maurétanie (juin-août, murs), tortue de Floride (plans d'eau, pas indigène), couleuvre verte et jaune (rare, juin).
- Amphibiens très rares ici : grenouille rieuse (juin-août, mare), rainette méridionale (printemps, automne), triton palmé et marbré (mars-avril), salamandre tachetée (janvier-février, octobre-décembre pluvieux). Observation tout-petit peu probable.

## Insectes (157 espèces : le groupe le plus diversifié)

**Les plus communs** : tircis (89 ; papillon brun des sous-bois), ischnure élégante (60 ; petite demoiselle bleue), abeille domestique (52), vulcain (40), frelon asiatique (28), piéride de la rave (23), cuivré commun (29), azuré commun (20), crocothémis écarlate (19 ; libellule rouge), sympétrum strié (47), belle-dame (21), graphosome d'Italie (18 ; punaise rayée rouge et noir), coccinelle asiatique (18), coccinelle à sept points (14), gendarme (15), moro-sphinx (16), souci (25), brun des pélargoniums (9 à 1,5 km, 31 à 3 km).

**Saisonnalité** :
- **Mars-avril** : premiers tircis, piérides, citron, abeilles domestiques, xylocopes, bourdons. Pas de papillons en décembre-janvier sauf rares.
- **Mai-juin** : pic des coccinelles (juin : 37 asiatiques, 26 à sept points), téléphore fauve (juin), cétoines (mai), grandes sauterelles vertes (mai-juin), lucane cerf-volant (juin, soirs chauds), moro-sphinx (juin), azuré (mai, août).
- **Juillet-août** : libellules (crocothémis juin-juillet, sympétrum de Fonscolombe juin-août), graphosomes (juillet-août), mante religieuse (août-septembre ; 13 obs, rare mais « wow »), scarabée rhinocéros (juillet), frelon asiatique (août-septembre, voir danger), cigale grise (juillet), brun des pélargoniums (août-septembre).
- **Septembre-octobre** : sympétrum strié (pic septembre : 33), vulcain et tircis tardifs, gendarmes, punaises, coccinelles de retour, frelons.
- **Novembre à février** : très peu d'insectes ; tircis rares (février-novembre), vulcain quelques-uns, brunettes hivernales.
- **Wow** : mante religieuse, lucane cerf-volant, grand capricorne (surtout GBIF : 33 obs, vieux chênes), cétoine dorée et funeste, scarabée rhinocéros, ver luisant, moro-sphinx (colibri), caloptéryx vierge (rare), libellule crocothémis, machaon, coccinelles, xylocope violet, bourdons, graphosome.

## Araignées et arachnides (19 espèces retenues)

Zoropse à pattes épineuses (jusqu'à 39 obs 3 km ; toute l'année, surtout juin-octobre, dans les maisons et jardins), thomise globuleuse (avril-juin), saltique sémaphore, argiope frelon (août-septembre, prairies du CREPS), stéatode noble (juin-septembre), pisaure admirable (avril-mai), araignée-crabe enflée (mai-juin). Rien en décembre-janvier.

## Mollusques (16 espèces)

Petit-gris (13 à 1,5 km ; avril-juin et après la pluie), escargot des bois (mai), clausilie, limaces (léopard, des caves). Zones : campus nord, Bois de Sourreil, talus du campus. Toute l'année après pluie, surtout printemps.

## Plantes et floraisons (100 plantes + 25 arbres)

**Les plus notées** : cyclamen de Naples (30, septembre-octobre : tapis rose sous les arbres, campus nord et sud), liseron des champs (mai-août), ophrys abeille (avril-mai : orchidée, talus et pelouses du campus), compagnon blanc (mai), achillée millefeuille, lamier pourpre (mars), coquelicot (avril-juin), chicorée amère (juin-octobre), pâquerette (janvier-mars, jusqu'en novembre), trèfle des prés, grande mauve, sérapias (avril-mai, orchidée rose), ficaire (février-mars, premières fleurs jaunes), véronique de Perse (février-mars), fragon, lierre (floraison septembre-novembre = nourriture des insectes d'automne).

**Calendrier des floraisons** :
- Janvier-février : pâquerette, lamier pourpre, véronique, primevère officinale, ficaire, laurier-tin (viburnum, GBIF), pittosporum (mars-mai, GBIF).
- Mars-avril : ficaire, pissenlit, ophrys, sérapias, coquelicot (fin avril), pavot somnifère.
- Mai-juin : coquelicot, robinier faux-acacia (avril-mai), compagnon blanc, mauve, liseron, achillée.
- Juillet-septembre : chicorée, datura, raisin d'Amérique (fruits violets, toxiques), sauge fausse-verveine, cyclamen (sept.-oct.), lierre.
- Octobre-décembre : cyclamen, fragon (baies rouges), gui (fructification, nov.-janv.), arbousier (fruits).
- **Arbres** : laurier-sauce, charme, noisetier (chatons février), robinier, marronnier d'Inde (fleurs avril ; marrons septembre-octobre), chêne pédonculé / rouge d'Amérique / vert (glands octobre), érable sycomore (samares), figuier (juin-octobre), aubépine, prunellier, arbousier. Platane, tilleul, ginkgo : présents mais quasi non documentés.

## Champignons et lichens

Peu de données mais très saisonnières : **octobre-novembre** pour presque tous (volvaire visqueuse, coprin pie, coprin chevelu, marasme des oréades, pholiote du peuplier), **clathre rouge** (doigts de sorcière ; avril puis automne, Peixotto), schizophylle commun (toute l'année, sur bois mort), fistuline hépatique (août-septembre, sur chêne : « langue de bœuf »), scléroderme (juin-août). Lichens (parmélies, xanthorie jaune) sur troncs et murs : visibles toute l'année, surtout comptés en novembre et avril-mai.

## Autres

Poissons du plan d'eau CREPS/Peixotto : gambusie, carpe commune, perche soleil, poisson-chat (avril-août). Cloportes (porcellion rugueux, philoscie), collemboles, scutigère véloce, mille-pattes : sous écorces et pierres, toute l'année après pluie.

## Espèces « wow » pour un tout-petit (réalistes ici)

| Espèce | Quand | Où |
|---|---|---|
| Écureuil roux | août-novembre, janvier-mars | Parc Peixotto |
| Canards, gallinule, poissons | toute l'année | Peixotto, plan d'eau du CREPS |
| Lézard des murailles | avril-septembre | murs du campus / CREPS |
| Escargots (petit-gris, des bois) | après la pluie, avril-juin | talus, campus nord |
| Coccinelles | mai-juin | prairies, campus |
| Papillons (tircis, vulcain, souci, piérides, azuré) | mars-octobre | lisières, prairies |
| Libellules (crocothémis, sympétrum, ischnure) | mai-septembre | plan d'eau CREPS |
| Bourdons, abeilles, xylocope | mars-septembre | fleurs de jardins |
| Pic vert, héron cendré, crécerelle | toute l'année | parcs, ciel |
| Hérisson | avril-novembre, crépuscule | Peixotto, jardins |
| Mante religieuse, lucane, ver luisant | août-septembre, juin | prairies, soirs d'été |
| Cyclamen, coquelicots, ophrys | sept.-oct., avril-juin, avril-mai | campus |
| Champignons (clathre, coprin) | octobre-novembre | Peixotto, Sourreil |
