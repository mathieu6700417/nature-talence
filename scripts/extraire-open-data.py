#!/usr/bin/env python3
"""Extraction hors ligne des données ouvertes autour du Forum des Halles de Talence.

Lancement : python3 -I scripts/extraire-open-data.py

Sources (voir docs/spec-observations-open-data.md §3.2) :
  - API Explore v2.1 du portail opendata.bordeaux-metropole.fr (sans clé) ;
  - OpenStreetMap via Overpass (sans clé).

Écrit :
  - data/sources/open-data.json         brut filtré (centroïdes seulement, aucun polygone) ;
  - data/sources/points-squelette.json  points candidats à curer à la main (repère, confiance).

Python 3 standard uniquement. Les réponses sont traitées comme des données non fiables :
elles sont seulement analysées (json), jamais exécutées.
"""
import json
import math
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
FORUM = (44.8065, -0.5880)  # (lat, lon)
RAYON_M = 1600
DATE = "2026-11-03"
UA = "nature-talence-extraction/1.0 (projet perso ; donnees ouvertes ; depot GitHub nature-talence)"
PAUSE_S = 1.2
BASE_BM = "https://opendata.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets"
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
CHAMPS_GEO = {"geo_shape", "geometry", "geom", "styleurl", "stylehash", "stylemaphash", "umap_options", "gx_media_links"}

journal = []


def distance_m(lat1, lon1, lat2, lon2):
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def requete(url, donnees=None, delai=90):
    corps = urllib.parse.urlencode(donnees).encode() if donnees else None
    req = urllib.request.Request(url, data=corps, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=delai) as rep:
        return json.loads(rep.read().decode("utf-8"))


def explore(jeu, where_sup=None):
    """Tous les enregistrements d'un jeu dans le rayon, par pagination offset."""
    where = f"within_distance(geo_point_2d, geom'POINT({FORUM[1]} {FORUM[0]})', {RAYON_M}m)"
    if where_sup:
        where += f" and {where_sup}"
    resultats, offset, total = [], 0, None
    while True:
        params = urllib.parse.urlencode({"where": where, "limit": 100, "offset": offset})
        url = f"{BASE_BM}/{jeu}/records?{params}"
        rep = None
        for essai in range(3):
            try:
                rep = requete(url)
                break
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
                print(f"  ! {jeu} offset {offset} essai {essai + 1} : {e}", file=sys.stderr)
                time.sleep(5)
        if rep is None:
            journal.append(f"{jeu} : échec à l'offset {offset}")
            break
        total = rep.get("total_count", total)
        lot = rep.get("results", [])
        for r in lot:
            for c in CHAMPS_GEO:
                r.pop(c, None)
        resultats += lot
        offset += 100
        time.sleep(PAUSE_S)
        if not lot or offset >= (total or 0):
            break
    print(f"{jeu} : {len(resultats)} / {total}")
    journal.append(f"{jeu} : {len(resultats)} enregistrements (total annoncé {total})")
    return resultats


def overpass(requete_ql):
    for url in OVERPASS:
        try:
            rep = requete(url, {"data": requete_ql}, delai=180)
            return rep.get("elements", [])
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            print(f"  ! Overpass {url} : {e}", file=sys.stderr)
            journal.append(f"Overpass {url} indisponible : {e}")
            time.sleep(10)
    return []


def centre(el):
    if el["type"] == "node":
        return el["lat"], el["lon"]
    c = el.get("center")
    return (c["lat"], c["lon"]) if c else (None, None)


def arrondi(x, n=5):
    return None if x is None else round(x, n)


def pt(rec):
    g = rec.get("geo_point_2d") or {}
    return arrondi(g.get("lat")), arrondi(g.get("lon"))


def main():
    brut = {"date": DATE, "centre": {"lat": FORUM[0], "lon": FORUM[1]}, "rayon_m": RAYON_M,
            "bordeaux_metropole": {}, "osm": {}}
    bm = brut["bordeaux_metropole"]

    # --- Bordeaux Métropole -------------------------------------------------------------
    bm["tal_pointseaulibreacces"] = [
        {"nom": r.get("name"), "lat": pt(r)[0], "lon": pt(r)[1]} for r in explore("tal_pointseaulibreacces")]
    bm["tal_airesjeux"] = [
        {"nom": r.get("name"), "lat": pt(r)[0], "lon": pt(r)[1]} for r in explore("tal_airesjeux")]
    bm["tal_jardinspartages"] = [
        {"nom": r.get("name"), "lat": pt(r)[0], "lon": pt(r)[1]} for r in explore("tal_jardinspartages")]
    bm["ec_parc_s"] = [
        {"nom": r.get("nom"), "descript": r.get("descript"), "service": r.get("service"), "milieu": r.get("milieu"),
         "lat": pt(r)[0], "lon": pt(r)[1]} for r in explore("ec_parc_s")]
    bm["to_hydro_s"] = [
        {"gid": r.get("gid"), "typea": r.get("typea"), "regime": r.get("regime"), "artifice": r.get("artifice"),
         "nom": r.get("nom"), "categorie": r.get("categorie"), "lat": pt(r)[0], "lon": pt(r)[1]}
        for r in explore("to_hydro_s")]
    bm["ec_habitat_naturel_s"] = [
        {"gid": r.get("gid"), "milieu": r.get("milieu"), "sous_milieu": r.get("sous_milieu"),
         "enjeu": r.get("enjeu_typo"), "eunis": r.get("code_eunis"), "lat": pt(r)[0], "lon": pt(r)[1]}
        for r in explore("ec_habitat_naturel_s")]
    bm["cr_objet_nature_p"] = [
        {"gid": r.get("gid"), "ssclasse": r.get("ssclasse"), "lat": pt(r)[0], "lon": pt(r)[1]}
        for r in explore("cr_objet_nature_p", "classe='ARB' and ssclasse in ('CONI','AUTRE')")]
    bm["met_vegetation_urbaine"] = [
        {"gid": r.get("gid"), "p_can": r.get("p_can"), "p_herb": r.get("p_herb"), "nb_arbre": r.get("nb_arbre"),
         "lat": pt(r)[0], "lon": pt(r)[1]} for r in explore("met_vegetation_urbaine")]
    bm["ri_icu_ifu_s"] = [
        {"gid": r.get("gid"), "delta": r.get("delta"), "lat": pt(r)[0], "lon": pt(r)[1]}
        for r in explore("ri_icu_ifu_s", "delta<=-3")]

    # --- OpenStreetMap (Overpass) -------------------------------------------------------
    a = f"(around:{RAYON_M},{FORUM[0]},{FORUM[1]})"
    ql = f"""[out:json][timeout:120];
(
  node["natural"="tree"]["species"]{a};
  node["natural"="tree"]["genus"]{a};
  node["natural"="tree"]["denotation"="natural_monument"]{a};
  nwr["man_made"="nesting_site"]{a};
  nwr["man_made"="water_well"]{a};
  nwr["amenity"="drinking_water"]{a};
  nwr["man_made"="water_tap"]{a};
  nwr["amenity"="fountain"]{a};
  way["waterway"="stream"]{a};
  nwr["natural"="water"]{a};
  nwr["natural"="wetland"]{a};
  nwr["landuse"~"^(vineyard|orchard|meadow|allotments)$"]{a};
  nwr["information"="board"]["board_type"="wildlife"]{a};
  way["natural"="tree_row"]["species"]{a};
  way["natural"="tree_row"]["genus"]{a};
);
out center tags;"""
    els = overpass(ql)
    print(f"Overpass : {len(els)} éléments")
    journal.append(f"Overpass : {len(els)} éléments")
    gardes = []
    garder = ("natural", "species", "genus", "denotation", "name", "man_made", "amenity", "waterway", "water",
              "landuse", "information", "board_type", "wikidata", "drinking_water", "access", "meadow", "crop",
              "leaf_type", "tourism", "intermittent", "tunnel", "culvert")
    for el in els:
        lat, lon = centre(el)
        if lat is None:
            continue
        gardes.append({"ref": f"{el['type']}/{el['id']}", "lat": arrondi(lat), "lon": arrondi(lon),
                       "tags": {k: v for k, v in el.get("tags", {}).items() if k in garder}})
    brut["osm"]["elements"] = gardes

    squelette = construire_squelette(bm, gardes)
    brut["comptes"] = {k: len(v) for k, v in bm.items()}
    brut["comptes"]["osm"] = len(gardes)
    ecrire_json(RACINE / "data/sources/open-data.json", brut)
    ecrire_json(RACINE / "data/sources/points-squelette.json", squelette)
    print(f"Squelette : {len(squelette)} points")
    for ligne in journal:
        print(" -", ligne)


def ecrire_json(chemin, obj):
    chemin.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    ko = chemin.stat().st_size / 1024
    print(f"écrit {chemin.relative_to(RACINE)} ({ko:.0f} Ko)")
    if chemin.name == "open-data.json" and ko >= 500:
        print("  ! plus de 500 Ko", file=sys.stderr)


def lieu_proche(lat, lon):
    try:
        lieux = json.loads((RACINE / "data/lieux.json").read_text(encoding="utf-8"))
    except OSError:
        return {}
    m = min(lieux, key=lambda x: distance_m(lat, lon, x["lat"], x["lon"]))
    return {"lieu_proche": m["id"], "distance_lieu_m": round(distance_m(lat, lon, m["lat"], m["lon"]))}


def construire_squelette(bm, osm):
    pts = []

    def ajouter(type_, nom, lat, lon, jeu, ref, **extra):
        if lat is None or lon is None:
            return
        d = round(distance_m(FORUM[0], FORUM[1], lat, lon))
        if d > RAYON_M:
            return
        p = {"type": type_, "nom": nom, "lat": lat, "lon": lon, "distance_m": d,
             "source": {"jeu": jeu, "ref": ref, "date": DATE}}
        p.update(lieu_proche(lat, lon))
        p.update(extra)
        pts.append(p)

    for r in bm["tal_pointseaulibreacces"]:
        ajouter("eau_potable", r["nom"], r["lat"], r["lon"], "tal_pointseaulibreacces", r["nom"])
    for r in bm["tal_airesjeux"]:
        ajouter("aire_jeux", r["nom"], r["lat"], r["lon"], "tal_airesjeux", r["nom"])
    for r in bm["tal_jardinspartages"]:
        n = r["nom"] or ""
        t = "cueillette" if "cueillette" in n.lower() else "jardin_partage"
        ajouter(t, n, r["lat"], r["lon"], "tal_jardinspartages", n)
    for r in bm["to_hydro_s"]:
        ta = r["typea"] or ""
        if ta.startswith("FOSS"):
            continue
        t = {"BASSIN": "bassin", "CANAL": "canal", "POINT_D_EAU": "point_eau"}.get(ta)
        if t is None and "BASSIN" in ta:
            t = "bassin"
        if t:
            ajouter(t, r["nom"], r["lat"], r["lon"], "to_hydro_s", f"gid {r['gid']}",
                    details={"typea": ta, "regime": r["regime"], "artifice": r["artifice"],
                             "categorie": r["categorie"]})
    cartes = [
        ("prair", "prairie_fauche"), ("chênaie", "chenaie"), ("chenaie", "chenaie"), ("roselière", "roseliere"),
        ("roseliere", "roseliere"), ("haie", "haie_arboree"), ("vigne", "vigne"), ("peuplier", "peupleraie"),
        ("friche", "friche"), ("prunellier", "fourre_prunellier"),
    ]
    for r in bm["ec_habitat_naturel_s"]:
        sm = (r["sous_milieu"] or "").lower()
        if r["enjeu"] not in ("FORT", "MOYEN") and not any(k in sm for k in ("vigne", "prunellier", "peuplier")):
            continue
        t = next((v for k, v in cartes if k in sm), None)
        if "souchet" in sm or ("prair" in sm and "humide" in sm):
            t = "prairie_humide"
        elif t == "prairie_fauche" and "fauch" not in sm:
            t = None
        if t:
            ajouter(t, r["sous_milieu"], r["lat"], r["lon"], "ec_habitat_naturel_s", f"gid {r['gid']}",
                    details={"enjeu": r["enjeu"], "eunis": r["eunis"], "milieu": r["milieu"]})
    for r in bm["cr_objet_nature_p"]:
        ajouter("conifere" if r["ssclasse"] == "CONI" else "arbre_autre", None, r["lat"], r["lon"],
                "cr_objet_nature_p", f"gid {r['gid']}")
    for r in bm["ri_icu_ifu_s"]:
        ajouter("ilot_fraicheur", None, r["lat"], r["lon"], "ri_icu_ifu_s", f"gid {r['gid']}",
                details={"delta": r["delta"]})

    for e in osm:
        t = e["tags"]
        typ = None
        if t.get("natural") in ("tree", "tree_row"):
            typ = "arbre_espece"
        elif t.get("man_made") == "nesting_site":
            typ = "tour_hirondelles"
        elif t.get("man_made") == "water_well":
            typ = "puits"
        elif t.get("amenity") == "drinking_water" or t.get("man_made") == "water_tap":
            typ = "eau_potable"
        elif t.get("amenity") == "fountain":
            typ = "fontaine"
        elif t.get("waterway") == "stream":
            typ = "ruisseau"
        elif t.get("natural") == "water":
            typ = "etang"
        elif t.get("natural") == "wetland":
            typ = "zone_humide"
        elif t.get("landuse") == "vineyard":
            typ = "vigne"
        elif t.get("landuse") == "orchard":
            typ = "verger"
        elif t.get("landuse") == "meadow":
            typ = "prairie"
        elif t.get("landuse") == "allotments":
            typ = "jardin_partage"
        elif t.get("information") == "board":
            typ = "panneau_nature"
        if typ:
            ajouter(typ, t.get("name"), e["lat"], e["lon"], "OpenStreetMap", e["ref"], tags=t)
    pts.sort(key=lambda p: (p["type"], p["distance_m"]))
    return pts


if __name__ == "__main__":
    main()
