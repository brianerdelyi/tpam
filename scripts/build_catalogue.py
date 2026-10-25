#!/usr/bin/env python3
"""Generate catalogue/*.md from data/artworks.csv.  Usage: python3 scripts/build_catalogue.py"""
import csv, re, os
from collections import OrderedDict
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(root, "data", "artworks.csv"), encoding="utf-8")))
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
zones = OrderedDict()
for r in rows: zones.setdefault(r["zone"], []).append(r)
out = os.path.join(root, "catalogue"); os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.endswith(".md"): os.remove(os.path.join(out, f))
idx = ["# Toronto Public Art Map — Catalogue", "",
       "Generated from `data/artworks.csv`. Do not edit these pages by hand; edit the CSV and re-run `scripts/build_catalogue.py`.", "",
       "| Zone | Works |", "|---|---|"]
for z, items in zones.items():
    idx.append(f"| [{z}]({slug(z)}.md) | {len(items)} |")
idx += ["", f"**Total: {len(rows)} works.**", ""]
open(os.path.join(out, "README.md"), "w", encoding="utf-8").write("\n".join(idx))
for z, items in zones.items():
    L = [f"# {z}", "", f"[← Catalogue](README.md) · {len(items)} works", ""]
    subs = OrderedDict()
    for r in items: subs.setdefault(r["sub_zone"], []).append(r)
    for s, its in subs.items():
        L += [f"## {s}", ""]
        for r in its:
            L += [f"### {r['name']}", "",
                  f"- **ID:** {r['id']}",
                  f"- **Layer:** {r['layer']}",
                  f"- **Type:** {r['type']}",
                  f"- **Location:** {r['location_context']}" + (f" — {r['address']}" if r['address'] else ""),
                  f"- **Accessibility:** {r['accessibility']}",
                  f"- **Artist / attribution:** {r['artist_attribution'] or '—'}",
                  f"- **Verified:** {r['verified']}"]
            if r["lat"] and r["lng"]: L.append(f"- **Coordinates:** {r['lat']}, {r['lng']}")
            if r["source_url"]: L.append(f"- **Source:** {r['source_url']}")
            if r["description"]: L += ["", r["description"]]
            L.append("")
    open(os.path.join(out, slug(z) + ".md"), "w", encoding="utf-8").write("\n".join(L))
print("built", len(zones) + 1, "pages")
