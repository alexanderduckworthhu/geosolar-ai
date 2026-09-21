# Visuals

Export folder for class, LinkedIn, and portfolio. Every plotted point is a real Sonnendach.ch roof.

| File | Use |
| --- | --- |
| `switzerland_by_roofs.png` | Still hero. Country silhouette from 90,000 sampled roofs. |
| `switzerland_by_roofs.gif` / `.mp4` | Loop: class 1 → 5 reveal. LinkedIn / slides. |
| `swiss_cities_roofs.png` | Eight-city circular maps (Zürich … Sion). |
| `swiss_cities_roofs.gif` / `.mp4` | Same maps, classes appearing in order. |
| `city_roof_aspect.png` | Slope vs aspect; south + moderate pitch = high class. |
| `klasse_balance.png` | 10,071,755-roof class counts. |
| `canton_irradiation.png` | World Bank–style choropleth: mean roof MSTRAHLUNG by canton. |
| `canton_class4plus.png` | Same map, % class 4–5. |
| `canton_tour.gif` / `.mp4` | 26-canton tour, sunniest first, stats panel per canton. |
| `region_tour.gif` / `.mp4` | 7 greater regions (BFS / NUTS-2) with regional totals. |

Regenerate: `./.venv/bin/python visuals/build_visuals.py`
