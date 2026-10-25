#!/usr/bin/env python3
"""Build the static site into site/ from data/ and site-src/.
Usage: python3 scripts/build_site.py
The result is what gets published to the gh-pages branch."""
import csv, json, os, shutil

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, "site")

# fresh output directory
if os.path.isdir(out):
    shutil.rmtree(out)
os.makedirs(out)

# 1. static files
for name in os.listdir(os.path.join(root, "site-src")):
    shutil.copy(os.path.join(root, "site-src", name), os.path.join(out, name))

# 2. artworks.json (numbers for lat/lng where present)
def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None
works = []
with open(os.path.join(root, "data", "artworks.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        r["lat"], r["lng"] = num(r.get("lat")), num(r.get("lng"))
        r["verified"] = (r.get("verified", "").strip().lower() == "yes")
        works.append(r)
with open(os.path.join(out, "artworks.json"), "w", encoding="utf-8") as f:
    json.dump(works, f, ensure_ascii=False, separators=(",", ":"))

# 3. zones.json: resolve named corner points into coordinate lists
z = json.load(open(os.path.join(root, "data", "zones.json"), encoding="utf-8"))
P = z["points"]
zones = [{"zone": a["zone"], "short": a["short"], "color": a["color"], "description": a["description"],
          "coords": [P[k] for k in a["points"]]} for a in z["zones"]]
c = z["corridor"]
w0, w1 = P[c["from"][0]], P[c["from"][1]]
west = [(w0[0] + w1[0]) / 2, (w0[1] + w1[1]) / 2]
last = P[c["through"][-1]]
east = [last[0] + c["east_offset"][0], last[1] + c["east_offset"][1]]
corridor = {"label": c["label"], "color": c["color"], "coords": [west] + [P[k] for k in c["through"]] + [east]}
with open(os.path.join(out, "zones.json"), "w", encoding="utf-8") as f:
    json.dump({"zones": zones, "corridor": corridor}, f, ensure_ascii=False)

# 4. tell GitHub Pages not to run Jekyll
open(os.path.join(out, ".nojekyll"), "w").close()
print(f"built site/: {len(works)} works, {len(zones)} zones")
