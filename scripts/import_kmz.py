#!/usr/bin/env python3
"""Rebuild content/maps/assam.json from a KMZ with district polygons and river lines,
and print the positions of any point placemarks (e.g. Ahom sites) to copy into content/entities.json.

Usage: python3 scripts/import_kmz.py "Dist + Rivers (simplified).kmz"
"""
import io, os, sys, json, re, zipfile, xml.etree.ElementTree as ET
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kmz = sys.argv[1]
with zipfile.ZipFile(kmz) as z:
    kml = io.BytesIO(z.read(next(n for n in z.namelist() if n.endswith(".kml"))))
out_map = os.path.join(ROOT, "content", "maps", "assam.json")
ns = "{http://www.opengis.net/kml/2.2}"
root = ET.parse(kml).getroot()
tag = lambda e: e.tag.split("}")[-1]
fname = lambda f: (f.find(ns + "name").text if f.find(ns + "name") is not None else "")

def coords(el):
    pts = []
    for tok in (el.text or "").split():
        lon, lat = tok.split(",")[:2]
        pts.append((float(lat), float(lon)))
    return pts

def dp(pts, eps):   # Douglas-Peucker in degrees
    if len(pts) < 3: return pts
    (a, b), (c, d) = pts[0], pts[-1]
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        y, x = pts[i]
        den = ((c - a) ** 2 + (d - b) ** 2) ** 0.5 or 1e-12
        dist = abs((d - b) * (a - y) - (c - a) * (b - x)) / den
        if dist > best: best, idx = dist, i
    if best > eps:
        return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]

def dp_ring(pts, eps):   # a closed ring starts and ends on the same point, so simplify its two halves separately
    if len(pts) < 8: return pts
    m = len(pts) // 2
    return dp(pts[: m + 1], eps)[:-1] + dp(pts[m:], eps)

r4 = lambda pts: [[round(a, 3), round(b, 3)] for a, b in pts]
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower().split("/")[0].strip()).strip("-")
DISTRICT_AS = {'baksa': 'বাক্সা', 'barpeta': 'বৰপেটা', 'biswanath': 'বিশ্বনাথ', 'bongaigaon': 'বঙাইগাঁও', 'cachar': 'কাছাৰ', 'charaideo': 'চৰাইদেউ', 'chirang': 'চিৰাং', 'darrang': 'দৰং', 'dhemaji': 'ধেমাজি', 'dhubri': 'ধুবুৰী', 'dibrugarh': 'ডিব্ৰুগড়', 'dima-hasao': 'ডিমা হাছাও', 'goalpara': 'গোৱালপাৰা', 'golaghat': 'গোলাঘাট', 'hailakandi': 'হাইলাকান্দি', 'hojai': 'হোজাই', 'jorhat': 'যোৰহাট', 'kamrup-metro': 'কামৰূপ মহানগৰ', 'kamrup-rural': 'কামৰূপ', 'karbi-anglong': 'কাৰ্বি আংলং', 'karimganj': 'শ্ৰীভূমি', 'kokrajhar': 'কোকৰাঝাৰ', 'lakhimpur': 'লখিমপুৰ', 'majuli': 'মাজুলী', 'marigaon': 'মৰিগাঁও', 'nagaon': 'নগাঁও', 'nalbari': 'নলবাৰী', 'sibsagar': 'শিৱসাগৰ', 'sonitpur': 'শোণিতপুৰ', 'south-salmara-mancachar': 'দক্ষিণ শালমাৰা-মানকাচৰ', 'tinsukia': 'তিনিচুকীয়া', 'udalguri': 'ওদালগুৰি', 'west-karbi-anglong': 'পশ্চিম কাৰ্বি আংলং'}
DISTRICT_EN = {"sibsagar": "Sivasagar", "karimganj": "Sribhumi"}   # present-day names
RIVER_IDS = {"Dehing": "dihing", "Teok River": "teok", "Pachoni River": "pachoni", "Dhansiri(S)/Doyang": "dhansiri-south", "Puthimari/ Bornadi": "puthimari"}

folders = [e for e in root.iter() if tag(e) == "Folder"]
rivers, districts, sites, seen = {}, {}, {}, set()
for f in folders:
    name = fname(f)
    for p in [x for x in f if tag(x) == "Placemark"]:
        n = (p.find(ns + "name").text or "").strip()
        geoms = [e for e in p.iter() if tag(e) == "coordinates"]
        if name == "Assam Rivers" and not n.startswith("Line"):
            rid = RIVER_IDS.get(n, slug(n))
            pts = max((coords(g) for g in geoms), key=len)
            rivers[rid] = {"name": n, "pts": r4(dp(pts, 0.006))}
        elif name == "Assam Districts":
            if n.isupper() and n not in seen:
                seen.add(n)
                rings = [r4(dp_ring(coords(g), 0.008)) for g in geoms]
                districts[slug(n)] = {"name": DISTRICT_EN.get(slug(n), n.title()), "as": DISTRICT_AS.get(slug(n), n.title()), "rings": [r for r in rings if len(r) > 3]}
            elif not n.isupper() and geoms:
                sites[slug(n)] = coords(geoms[0])[0]
        elif name.startswith("Imporatnt Ahom Site") and geoms:
            sites[slug(n)] = coords(geoms[0])[0]
M = {"note": "Base map of Assam from 'Dist + Rivers (simplified).kmz' (districts and rivers, simplified). Points are [lat, lon]. The Patkai ridge is approximate.",
     "districts": districts, "rivers": rivers,
     "ridges": {"patkai": [[27.45, 96.35], [27.27, 96.17], [27.0, 95.85], [26.75, 95.55], [26.45, 95.25]]}}
json.dump(M, open(out_map, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(districts), "districts,", len(rivers), "rivers written to content/maps/assam.json")
print("Point placemarks (copy positions into content/entities.json as geo):")
for k, v in sites.items(): print(f"  {k}: [{v[0]:.4f}, {v[1]:.4f}]")
