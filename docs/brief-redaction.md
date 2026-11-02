# Brief commun — rédaction des fiches

Tu écris des fiches pour le site « Nature autour de Talence centre ». Lis d'abord **SPEC.md**
(format exact des fiches, conditions autorisées, champs `point`, `attention`, `dates`, `verifier`).

## Le lecteur et l'usage
- Un parent lit la fiche **chez lui avant de sortir**, sur son téléphone, en moins de 20 secondes.
- Son enfant a 2-3 ans (ou 3-5 ans avec le sélecteur). L'enfant **ne regarde pas l'écran** :
  les photos servent au parent pour reconnaître la chose. Tout ce qui est « pour l'enfant » se fait DEHORS.
- Le parent est un adulte curieux : le volet « Pour toi » doit lui apprendre quelque chose de vrai et
  de surprenant (pas de banalités type « les oiseaux chantent au printemps »).
- Site public : jamais de numéro de maison, de prénom, de « chez toi ». Tutoiement du parent.

## Sources locales OBLIGATOIRES (dans data/ et data/sources/)
- `data/lieux.json` (+ lieux-sources.md) : 17 lieux vérifiés, ids à utiliser dans `lieux`.
  Attention : « Parc Margaut » (pas « Chenes-Margaut »), réuni avec Peixotto en « Grand Peixotto-Margaut ».
- `data/sources/inventaire-visuel.json` (+ synthèse) : 1321 points de rue avec éléments, lat/lon de
  l'élément, `repere`, image Panoramax. N'utilise QUE les éléments `confiance` « certain » ou
  « probable » ; si « probable » ou image unique antérieure à 2024 → `verifier: true`.
- `data/sources/especes-observees.json` (+ synthèse) : 448 espèces réellement observées à 1,5 km/3 km,
  avec mois et lieux. Une fiche animal/plante sauvage doit porter sur une espèce présente dans ce
  fichier (ou banale et indiscutable en ville : pigeon, moineau, pissenlit…). `mois` doit refléter
  ces données + le calendrier (pas d'invention).
- `data/sources/calendrier-local.md`, `ciel-evenements.json`, `securite.json`, `arbres.json`.

## Exigences par fiche
- **Ancrage local** : `lieux` = ids réels ; `ou` concret ; `point` avec lat/lon et un `repere`
  qu'on peut suivre sur le terrain (rue, côté, croisement, élément visible), repris/adapté de
  l'inventaire visuel ou de lieux.json. `point: null` seulement pour les fiches vraiment « partout »
  (ex. pâquerettes sur n'importe quelle pelouse) — alors `ou` dit comment les trouver.
- `photo_lieu` : seulement si l'image Panoramax est une photo frontale (non 360°) qui montre bien
  l'endroit ; sinon omets `photo_lieu`.
- **Enfant** : mot simple (1-2 mots), geste concret et sûr, phrase courte et rythmée à dire ensemble.
  2-3 ans : nommer, montrer, toucher (si sûr), imiter, répéter. 3-5 ans : compter, comparer,
  chercher, raconter, petite question « pourquoi ». Varie les gestes (pas toujours « montre du doigt »).
- **Pour toi** : nom exact, latin, anecdote VRAIE et vérifiable, pourquoi maintenant (lié à la saison
  / la météo), confusion possible. Si tu n'es pas sûr d'un fait, ne l'écris pas.
- **Sécurité** : `attention` obligatoire dès qu'il y a un risque (voir securite.json). Laurier-rose,
  laurier-palme (feuilles/graines), if, troène, lierre (baies), arum, champignons, processionnaires,
  frelons, eau, tiques… Les gestes proposés doivent être sûrs (jamais « goûte », jamais toucher une
  chenille ou un champignon).
- **Conditions** : `requiert`/`exclut` uniquement avec les clés de SPEC.md. Utilise-les quand c'est
  pertinent (escargots → pluie_recente ; ombre → soleil ; feuilles qui volent → vent ; toiles
  perlées → brouillard ou matin…). Prévois aussi assez de fiches sans condition pour chaque mois.
- **Photo d'espèce** : Wikimedia Commons, URL de miniature 480 px vérifiée par requête HTTP (200),
  crédit « Auteur — Licence » tiré de l'API (extmetadata Artist/LicenseShortName, texte HTML nettoyé),
  `source` = page File:. Choisis une photo nette où l'on reconnaît la chose comme on la verra
  (ex. marron dans sa bogue, pas une planche botanique). Utilise un User-Agent dans curl.
- **Couverture de l'année** : pour TA catégorie, chaque mois doit avoir au moins 8 fiches éligibles
  dont au moins 4 sans condition météo. Vérifie-le par script à la fin et affiche le tableau.
- **Ids** : kebab-case, préfixés par ta catégorie (`ani-`, `pla-`, `ciel-`, `sens-`, `ins-`), uniques.
- **Qualité > quantité** : vise ~40 fiches. Pas deux fiches quasi identiques.

## Fin
- Écris uniquement ton fichier `data/fiches-<categorie>.json` (tableau JSON valide).
- Vérifie : JSON valide, toutes les clés obligatoires, conditions autorisées, ids de lieux existants,
  photos HTTP 200, tableau de couverture mensuelle.
- Pas de commit. Rapport final court : nombre de fiches, couverture par mois, fiches `verifier`,
  points douteux.
