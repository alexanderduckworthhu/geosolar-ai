# Maps

Country, city, and canton views in the GeoSolar alpine-dusk language (pine ground, copper high class, rectangular city frames). Same Sonnendach.ch roofs as the explorer. No fabricated points.

| File | |
| --- | --- |
| `switzerland_by_roofs.png` | Country silhouette from sampled roofs |
| `switzerland_by_roofs.gif` / `.mp4` | Class 1 → 5 reveal |
| `swiss_cities_roofs.png` | Eight rectangular city maps (Zürich … Sion) |
| `swiss_cities_roofs.gif` / `.mp4` | Same maps, classes appearing in order |
| `city_roof_aspect.png` | Slope vs aspect; south + moderate pitch = high class |
| `klasse_balance.png` | 10,071,755-roof class counts |
| `canton_irradiation.png` | Mean roof irradiation by canton |
| `canton_class4plus.png` | Share of class 4–5 roofs by canton |
| `canton_tour.gif` / `.mp4` | 26-canton tour, sunniest first |
| `region_tour.gif` / `.mp4` | Seven greater regions (BFS / NUTS-2) |
| `explorer_demo.gif` / `.mp4` | Live capture of the explorer (imagery under hexes and roofs) |

Regenerate:

```bash
./.venv/bin/python visuals/build_visuals.py --from-sample
./.venv/bin/python visuals/build_canton_map.py --from-cache
./.venv/bin/pip install playwright   # once, for the demo capture
./.venv/bin/python visuals/build_demo.py
```

`build_demo.py` records the running Leaflet app (installed Chrome, headless) so the walkthrough shows satellite, streets, and buildings under both views.
