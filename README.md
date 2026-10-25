# Toronto Public Art Map

A structured inventory of outdoor, publicly accessible (on foot or by bike) art, civic statuary and architectural art in downtown Toronto, organised by **zone** (geography), **sub-zone** (walkable precinct) and **layer** (art classification).

> Status: dataset v2.3 carried over from the earlier "Toronto Public Art Atlas". No coordinates yet, so it is not yet a map. See [Known issues](#known-issues-not-yet-fixed).

## Repository layout

| Path | What it is |
|---|---|
| `data/artworks.csv` | **Master dataset.** The single source of truth. |
| `catalogue/` | Browsable pages by zone, **generated** from the CSV. Don't edit by hand. |
| `scripts/build_catalogue.py` | Rebuilds `catalogue/` from the CSV. |
| `scripts/build_site.py`, `site-src/` | Build the website. |
| `data/zones.json` | Zone corner coordinates. |
| `maps/` | Zone maps (SVG, PNG, KML, interactive HTML). |
| `archive/` | Original working notes, kept for provenance. |

Rebuild the catalogue after editing the CSV: `python3 scripts/build_catalogue.py`

## Website

`site-src/` holds the hand-written page (map, filters, list). `scripts/build_site.py` combines it with `data/artworks.csv` and `data/zones.json` into `site/` (not committed). A GitHub Action (`.github/workflows/publish.yml`) rebuilds `site/` whenever `main` changes and publishes it to the `gh-pages` branch, which GitHub Pages serves. Never edit `gh-pages` by hand.

Preview locally: `python3 scripts/build_site.py && cd site && python3 -m http.server 8000`, then open http://localhost:8000 (the map tiles need a web server, so don't open the file directly).

Zone shapes are the corner points in `data/zones.json`. Works appear as markers on the map once their `lat` and `lng` are filled in `data/artworks.csv`.

## Zones

| Zone | Boundary |
|---|---|
| Downtown - Business Core | Front St → Queen St, Yonge → University |
| Downtown - Midtown | Queen St → Bloor St, University Ave → Jarvis St, except the Bloor Corridor, a loosely defined region along Bloor St that extends beyond those limits. Includes Nathan Phillips Square, Spirit Garden, Bloor Corridor, Queen's Park / UofT |
| Downtown - South & Waterfront | South of Front St, Bathurst St → Broadview Ave |
| Downtown - East | Yonge St → Broadview Ave, north to Bloor St, outside the Midtown area. Includes King East / St. Lawrence and Riverside (Queen East / Don Valley) |
| Downtown - West | University Ave → Bathurst St, Front St → Bloor St |

Zone boundaries are guidelines, not strict rules. Each work's zone is a curatorial choice, and some works sit outside the literal boundaries on purpose. Examples: Pillars of Justice (361 University Ave, north of Queen) in Business Core; Legends Row (40 Bay St, south of Front) in Business Core; Bitter Memories of Childhood (Exhibition Place, west of Bathurst) in South & Waterfront; works on University Ave itself in West; Time: And a Clock Part 3 (870 Queen St E, east of Broadview) in East.

Where zones overlap, Midtown takes precedence: between Queen and Bloor, and between University and Jarvis, a work belongs to Midtown rather than East or West. The Bloor Corridor is an exception to the east/west limits because Bloor is a major east-west street: art along it belongs to Midtown even outside University–Jarvis. Its extent is not fixed and may change, so membership is decided case by case, not by a coordinate rule.

## Layers

1. **Outdoor Sculptures** — contemporary and historic freestanding artworks: abstract works, public commissions, sculpture gardens.
2. **Civic Statuary** — monuments, memorials, cenotaphs, commemorative figures; political leaders, military and immigration memorials.
3. **Architectural Art** — art integrated into architecture: reliefs, mosaics, stained glass, carved facades, decorative bridges, landmark ornament. Buildings are included for their artistic fabric, not merely because they are notable.
4. **Temporal / Rotating** — seasonal installations, Nuit Blanche works, Waterfront Toronto temporary commissions, construction-hoarding art, temporary exhibits in public space. *(No entries yet.)*

## Sub-zones

| Zone | Sub-zone | Definition |
|---|---|---|
| Business Core | Financial Core (Bay–Yonge–Wellington) | Core skyscraper + plaza network (TD, Brookfield, Commerce Court) |
| Business Core | Union Station / Front Spine | Transit + civic arrival corridor |
| Business Core | King Street Corridor | Entertainment + public realm sculpture edge |
| Business Core | Yonge Street Edge | Vertical corridor linking south/north civic fabric |
| Business Core | Brookfield / TD Courtyard Network | Linked interior/exterior corporate plaza system |
| Business Core | Commerce Court / Bay Complex | Dense banking plaza cluster identity |
| Midtown | Nathan Phillips Square | Civic plaza + major sculpture field |
| Midtown | Spirit Garden | Indigenous commemorative installation system |
| Midtown | Queen’s Park / UofT | Legislative + academic statuary field |
| Midtown | Bloor Corridor | Cultural + institutional linear corridor; a region with a flexible extent |
| Midtown | St. Michael’s / St. Mary Edge | Campus-adjacent institutional micro-zone |
| South & Waterfront | Harbourfront / Queens Quay | Waterfront promenade + public art belt |
| South & Waterfront | Ireland Park / Immigration Axis | Immigration + arrival narrative zone |
| South & Waterfront | Exhibition Place Grounds | Large-scale civic event + memorial zone |
| South & Waterfront | Jack Layton Ferry Terminal Zone | Transit + civic memorial node |
| South & Waterfront | Blue Jays Way Civic Edge | Entertainment + stadium-adjacent civic art pocket |
| East | St. Lawrence Market District | Historic market + civic origin core |
| East | King East / Old Town Core | Early Toronto street grid + heritage zone |
| East | Corktown / Riverside Edge | Industrial + Don Valley edge zone |
| East | St. James Cathedral Precinct | Religious + civic institutional cluster |
| East | Queen East / Don River Interface | Transitional industrial-river corridor |
| West | Osgoode / Civic Justice Precinct | Courts + legal institutions |
| West | University Avenue Institutional Spine | Hospitals + civic administration corridor |
| West | AGO / Cultural Corridor | Museum + cultural institution cluster |
| West | Hospital District (UHN Zone) | Concentrated medical civic memory zone |
| West | Queen West Judicial Edge | Transitional civic-commercial art edge |

## Data model (`data/artworks.csv`)

`id`, `name`, `zone`, `sub_zone`, `accessibility`, `location_context` (plaza / courtyard / grounds; was "Plaza/Courtyard"), `address`, `lat`, `lng`, `layer`, `status`, `artist_attribution`, `description`, `source_url`, `verified` (`yes` / `no`).

Principles: zones = geography; sub-zones = lived urban districts; layers = cultural classification. Each work has exactly **one** layer: the primary reason it is on the map. All works are outdoors and reachable on foot or by bike.

## Known issues (not yet fixed)

Carried over unchanged from v2.3 on purpose; recorded here so they can be fixed deliberately.

- **Misplaced rows:** in a few rows (Immigrant Family, People Walking, Community, Time Parts 1–2, Adam Beck Memorial, Endless Bench) the street address sits in `location_context` and `address` holds only "Toronto, ON".
- **Time: And a Clock** is one work split across three sub-zones.
- **Accessibility** is "24/7" for every row and has not been checked.
- **No coordinates**, and Layers 3 and 4 are nearly empty.
- **Attributions are unverified** (`verified = no` everywhere). Some look doubtful and need checking against sources: Bitter Memories of Childhood, Equestrian Statue of Edward VII, Legends Row, Hours of the Day, Tembo.

## License

Code: MIT (`LICENSE`). Data: CC BY 4.0 (`LICENSE-DATA`).

## Contributing

Corrections and additions are welcome: open an issue or pull request with the artwork, the correction, and a source.
