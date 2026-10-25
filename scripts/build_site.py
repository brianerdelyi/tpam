#!/usr/bin/env python3
"""Build the static site into site/ from data/ and site-src/.
Usage: python3 scripts/build_site.py
The result is what gets published to the gh-pages branch.
Coordinates: data/artworks.csv is the master. Where its lat/lng are empty, the
site uses the coordinates in maps/artworks-mymaps.csv (matched on ID). The master is never modified."""
import csv, json, os, shutil

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, "site")

if os.path.isdir(out):
    shutil.rmtree(out)
os.makedirs(out)

for name in os.listdir(os.path.join(root, "site-src")):
    shutil.copy(os.path.join(root, "site-src", name), os.path.join(out, name))

def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None

fallback = {}
mm = os.path.join(root, "maps", "artworks-mymaps.csv")
if os.path.exists(mm):
    with open(mm, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            fallback[r.get("ID")] = (num(r.get("Latitude")), num(r.get("Longitude")))

works = []
with open(os.path.join(root, "data", "artworks.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        r["lat"], r["lng"] = num(r.get("lat")), num(r.get("lng"))
        if r["lat"] is None or r["lng"] is None:
            r["lat"], r["lng"] = fallback.get(r["id"], (None, None))
        r["verified"] = (r.get("verified", "").strip().lower() == "yes")
        works.append(r)
with open(os.path.join(out, "artworks.json"), "w", encoding="utf-8") as f:
    json.dump(works, f, ensure_ascii=False, separators=(",", ":"))

z = json.load(open(os.path.join(root, "data", "zones.json"), encoding="utf-8"))
P = z["points"]
zones = [{"zone": a["zone"], "short": a["short"], "color": a["color"], "description": a["description"],
          "coords": [P[k] for k in a["points"]]} for a in z["zones"]]
with open(os.path.join(out, "zones.json"), "w", encoding="utf-8") as f:
    json.dump({"zones": zones}, f, ensure_ascii=False)

cfg = json.load(open(os.path.join(root, "data", "site.json"), encoding="utf-8"))
with open(os.path.join(out, "config.json"), "w", encoding="utf-8") as f:
    json.dump({"my_maps_embed_url": cfg.get("my_maps_embed_url", "").strip()}, f)

open(os.path.join(out, ".nojekyll"), "w").close()
n = sum(1 for w in works if w["lat"] is not None)
print(f"built site/: {len(works)} works ({n} with coordinates), {len(zones)} zones")
