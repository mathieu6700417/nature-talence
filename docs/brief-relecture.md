# Brief commun — relecture critique des fiches

Tu relis et CORRIGES directement un fichier `data/fiches-<categorie>.json` (228 fiches au total
réparties en 5 fichiers, un relecteur par fichier). Lis SPEC.md et docs/brief-redaction.md
(règles de rédaction) avant. Tu es exigeant : ce site sera utilisé tous les jours par un parent
avec son tout-petit ; une erreur factuelle ou un geste dangereux est inacceptable.

## À vérifier et corriger, fiche par fiche
1. **Sécurité** (priorité absolue) : tout geste proposé est-il sûr pour un enfant de 2-5 ans ?
   Rien à la bouche, pas de contact avec plantes toxiques/irritantes, champignons, chenilles,
   animaux sauvages, eau profonde, route. `attention` présent et juste quand il le faut
   (cf. data/sources/securite.json), mais pas de `attention` superflu sur une fiche anodine
   (sinon l'alerte perd son sens) — supprime ceux qui n'apportent rien.
2. **Exactitude** : nom, latin, anecdote, pourquoi_maintenant, confusion, mois. Vérifie les faits
   douteux par recherche web (Wikipédia FR/EN, INPN, Tela Botanica, LPO, IMCCE…). Tout fait non
   vérifiable → reformuler prudemment ou supprimer. Les `mois` doivent coller à
   data/sources/especes-observees.json et calendrier-local.md.
3. **Localisation** : `lieux` / `point` / `repere` cohérents avec data/lieux.json et
   data/sources/inventaire-visuel.json (vérifie lat/lon ≈ élément cité ; repère suivable sur place,
   sans numéro de maison). Accès public : ne jamais envoyer dans un lieu privé ou fermé
   (CREPS, jardin botanique universitaire, jardins privés : regarder depuis la rue seulement).
4. **`verifier`** : nouvelle règle, plus stricte que celle de la rédaction (trop de fiches marquées).
   `true` UNIQUEMENT si l'existence ou l'emplacement de l'élément est réellement incertain :
   identification « probable » sur une seule image, OU image unique antérieure à 2023, OU présence
   actuelle non confirmée (moutons, ferme itinérante, tour à hirondelles…). Sinon `false`.
   Les fiches « partout » et les espèces communes de parc → `false`.
5. **Photos** : télécharge CHAQUE miniature `photo.url` (et `point.photo_lieu.url`) dans
   un dossier temporaire hors du dépôt
   et REGARDE-LA avec l'outil Read. Elle doit montrer clairement la chose telle que le parent la
   verra à Talence (bonne espèce, bon stade : ex. marron dans sa bogue, glycine en fleur), sans
   personne identifiable. Sinon, trouve mieux sur Wikimedia Commons (API, licence libre, crédit
   auteur + licence, miniature 500 px car Commons n'accepte plus 480, HTTP 200) et regarde-la aussi.
6. **Textes enfant** : mot simple, geste concret, varié et sûr, phrase courte, rythmée et joyeuse à
   dire DEHORS. 2-3 ans ≠ 3-5 ans (le second compte, compare, cherche, se pose une question).
   Réécris les phrases plates ou trop longues.
7. **« Pour toi »** : doit surprendre un adulte curieux. Remplace les banalités par un fait vrai et
   frappant (vérifié).
8. **Doublons inter-catégories** : la liste de toutes les fiches (id + titre) est dans
   docs/index-fiches.txt. Si une de tes fiches fait doublon avec une fiche d'une autre catégorie,
   modifie l'angle de la tienne ou supprime-la (et dis-le dans ton rapport) ; ne touche jamais aux
   autres fichiers.

## Contraintes
- Ne modifie QUE ton fichier. Garde le format SPEC.md. Pas de commit.
- À la fin, vérifie par script : JSON valide, clés, conditions autorisées, ids de lieux existants,
  toutes les URL photo HTTP 200, couverture mensuelle (≥ 8 éligibles dont ≥ 4 sans `requiert`
  par mois pour les fiches non datées).
- Rapport final (< 40 lignes) : nombre de fiches modifiées / supprimées, erreurs factuelles
  corrigées (liste), problèmes de sécurité corrigés (liste), photos remplacées, `verifier`
  avant/après, points qui restent à vérifier SUR LE TERRAIN par le parent.
