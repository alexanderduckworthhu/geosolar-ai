# GeoSolar AI — Phase 0 dataset report

**Project:** GeoSolar AI — Swiss Rooftop Solar Potential Predictor  
**Course:** DIT323 Artificial Intelligence as a Service  
**Dataset:** *Eignung von Hausdächern für die Nutzung von Sonnenenergie* (Sonnendach.ch)  
**Publisher:** Swiss Federal Office of Energy (BFE / SFOE), with swisstopo (swissBUILDINGS3D) and MeteoSwiss radiation  
**Inspection date:** 2026-09-21  
**Rule:** every file size, layer name, column, statistic, and URL below was obtained by executing HTTP HEAD/GET, CKAN/STAC queries, or `pyogrio` against the downloaded FileGDB. Nothing is invented.

---

## 1. Official sources used

| Source | URL | What it provided |
| --- | --- | --- |
| opendata.swiss dataset | https://opendata.swiss/de/dataset/eignung-von-hausdachern-fur-die-nutzung-von-sonnenenergie | Canonical landing page (submission link) |
| CKAN API | https://ckan.opendata.swiss/api/3/action/package_show?id=eignung-von-hausdachern-fur-die-nutzung-von-sonnenenergie | 11 resources (WMS/WMTS, 3× GPKG, 3× GDB, map preview, REST API) |
| geo.admin.ch STAC collection | https://data.geo.admin.ch/api/stac/v1/collections/ch.bfe.solarenergie-eignung-daecher | `proj:epsg = 2056`; same six download assets |
| STAC item | https://data.geo.admin.ch/api/stac/v1/collections/ch.bfe.solarenergie-eignung-daecher/items/solarenergie-eignung-daecher | Exact asset hrefs + checksums |
| BFE data model PDF (v1.5, 2023-01-31) | https://pubdb.bfe.admin.ch/de/publication/download/9665 (saved as `data/docs/BFE_Sonnendach_Geodatenmodell_v1.5.pdf`, 20 pages) | Column meanings, `EIGNUNG_DACH` class codes, CRS, `STROMERTRAG` formula |
| GeoAdmin Identify (spot check only, not used as training data) | `api3.geo.admin.ch` Identify/Find | Confirmed live attributes align with the GDB model |

opendata.swiss `package_show` via `opendata.swiss/api/3/...` returned **403**; the same payload succeeded at `ckan.opendata.swiss/api/3/...`.

---

## 2. Available files (HTTP HEAD `Content-Length`)

All six vector downloads exist. CRS advertised by STAC: **EPSG:2056**. There **is** an annual (non-monthly) product, in both FileGDB and GeoPackage, plus a generalized variant of each.

| Asset (exact URL used) | Format | `Content-Length` (bytes) | GiB (bytes/1024³) | Downloaded? |
| --- | --- | --- | --- | --- |
| https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056.gdb.zip | FileGDB zip (annual roofs) | 1,398,008,884 | 1.302 | **No** (multi-GB class; not fetched without prior go-ahead) |
| https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056.gpkg.zip | GeoPackage zip (annual roofs) | 1,510,073,383 | 1.406 | No |
| https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_generalized.gdb.zip | FileGDB zip (annual, generalized) | 822,569,229 | 0.766 | **Yes** — SHA-256 `d5cabc1e55ac7b470e8a5905df866c915e464bdcb7d05f395aac3df11100afec` matches STAC `file:checksum` |
| https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_generalized.gpkg.zip | GeoPackage zip (annual, generalized) | 1,099,691,303 | 1.024 | No |
| https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_monthlydata.gdb.zip | FileGDB zip (monthly) | 5,130,251,907 | 4.778 | **No** |
| https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_monthlydata.gpkg.zip | GeoPackage zip (monthly) | 5,678,663,781 | 5.289 | **No** |

Last-Modified on the inspected zip (S3): `Wed, 19 Apr 2023 13:50:59 GMT`.

**Preference:** annual over monthly (monthly is 5+ GB and only needed for month tables). GeoPackage exists, but the smallest annual-related file is the **generalized FileGDB**, which was inspected.

Inner zip layout:

- top-level folder: `SOLKAT_DACH_generalisiert.gdb/`
- 47 files; uncompressed total **1,765,613,691** bytes
- main table `a00000009.gdbtable` = 1,593,382,559 bytes

---

## 3. Layers, CRS, geometry, row count

Inspected with `pyogrio.list_layers` / `pyogrio.read_info` on:

`/vsizip/data/raw/solarenergie-eignung-daecher_2056_generalized.gdb.zip/SOLKAT_DACH_generalisiert.gdb`

| Property | Value from file |
| --- | --- |
| Layers | **one:** `SOLKAT_CH_DACH` |
| Driver | OpenFileGDB |
| FID column | `OBJECTID` |
| Geometry column | `SHAPE` |
| Geometry type **in this generalized file** | **MultiPoint** (official model for the non-generalized product is polygon roofs) |
| CRS | **EPSG:2056** (CH1903+ / LV95) |
| Feature count | **10,071,755** |
| Total bounds (LV95 m) | E 2,486,036.618 – 2,833,432.315 ; N 1,075,238.380 – 1,295,317.736 |
| Attribute fields | 26 (listed below). No `SHAPE_Length` / `SHAPE_Area` columns on this layer. |

The BFE model (Table 2) also defines `SOLKAT_CH_DACH_MONAT`, `SOLKAT_CH_FASS`, `SOLKAT_CH_FASS_MONAT`. Those live in the **monthly** and **façade** products, not in this generalized roofs GDB.

`DF_UID` is unique for all 10,071,755 rows (`nunique = 10071755`).

---

## 4. Full column list (from the FileGDB + official PDF)

Meanings are from BFE *Dokumentation Geodatenmodell* v1.5 unless noted.  
Statistics: full scan of all **10,071,755** rows, `read_geometry=False`, via `training/_inspect_dataset.py`. Results also stored in `data/docs/inspection_stats.json`.

Missingness: only `GWR_EGID` has nulls. Integer/float/date fields have **0** missing. `SB_UUID` has **0** missing.

### 4.1 IDs / timestamps / junk for ML

| Column | dtype in file | Meaning | Missing | Min / median / max (or uniques) |
| --- | --- | --- | --- | --- |
| `DF_UID` | int32 | Roof-surface ID; join key to monthly table | 0% | 161,726 / 15,952,429 / 21,056,822 ; 10,071,755 unique |
| `DF_NUMMER` | int16 | Roof index **within** a building | 0% | 1 / 2 / 2,203 ; 2,203 unique values |
| `DATUM_ERSTELLUNG` | datetime64[ms] | When this roof was computed in Sonnendach.ch | 0% | 2015-11-18 … 2022-10-27 (median 2020-12-05) |
| `DATUM_AENDERUNG` | datetime64[ms] | Last change (same as creation on first insert) | 0% | 2015-11-18 … 2022-10-27 |
| `SB_UUID` | GUID/string | swissBUILDINGS3D 2.0 building UUID | 0% | (identifier) |
| `SB_DATUM_ERSTELLUNG` | datetime64[ms] | Building timestamp from swissBUILDINGS3D | 0% | 2008-03-19 … 2022-02-22 |
| `SB_DATUM_AENDERUNG` | datetime64[ms] | Building last-change from swissBUILDINGS3D | 0% | 2012-10-12 … 2022-02-22 |
| `GWR_EGID` | float64 (nulls) / Long Integer in the model | Federal building ID (GWR); optional | **2,007,606 (19.933%)** | 1 / 1,352,969 / 504,124,081 (on non-null rows) |

### 4.2 Geographic

There are **no latitude/longitude columns** and **no canton/municipality columns**. Location is only in `SHAPE` (EPSG:2056). Sample MultiPoint → WGS84 via `pyproj` `Transformer.from_crs(2056, 4326, always_xy=True)` (first 8 features):

| LV95 E | LV95 N | lon | lat |
| ---: | ---: | ---: | ---: |
| 2,676,475.806 | 1,253,998.446 | 8.452335 | 47.432343 |
| 2,676,471.400 | 1,254,000.110 | 8.452276 | 47.432359 |
| 2,676,472.562 | 1,254,002.464 | 8.452292 | 47.432380 |
| 2,676,555.727 | 1,253,996.099 | 8.453393 | 47.432313 |
| 2,676,553.646 | 1,253,997.031 | 8.453366 | 47.432322 |
| 2,672,499.396 | 1,220,466.616 | 8.394220 | 47.131214 |
| 2,672,500.458 | 1,220,466.564 | 8.394234 | 47.131213 |
| 2,672,501.473 | 1,220,466.251 | 8.394247 | 47.131211 |

**Plan for the API:** never compute centroids in EPSG:4326. For this generalized file, take the MultiPoint coordinates already in EPSG:2056 and convert with `pyproj`. If Phase 1 instead uses the non-generalized polygon GDB, compute polygon centroids in EPSG:2056 first, then convert.

### 4.3 Roof-related (physical)

| Column | dtype | Meaning (official) | Missing | Min / median / max |
| --- | --- | --- | --- | --- |
| `FLAECHE` | float64 | Usable roof area [m²] = physical (tilted) roof area = max module area | 0% | 0.010002 / 37.055190 / 85,799.418477 |
| `AUSRICHTUNG` | int16 | Aspect [°]: north = −180, east = −90, south = 0, west = +90, north = +180 | 0% | −180 / −23 / 180 ; **361** unique (every integer degree) |
| `NEIGUNG` | int16 | Slope [°]; 0 = horizontal | 0% | 0 / 25 / 89 ; **90** unique (0–89; 90 not present) |
| `SB_OBJEKTART` | int16 | swissBUILDINGS3D object type, domain `SB_OBJEKTART` | 0% | 0 / 1 / 23 ; 23 distinct codes (see §4.6) |

### 4.4 Solar radiation / yield (derived energy quantities)

| Column | dtype | Meaning (official) | Missing | Min / median / max |
| --- | --- | --- | --- | --- |
| `MSTRAHLUNG` | int16 | Mean annual global irradiation on the roof [kWh/m²/year], shading included | 0% | 2 / 1,101 / 2,188 |
| `GSTRAHLUNG` | int32 | Mean annual global irradiation on the whole roof [kWh/year] | 0% | 0 / 38,522 / 110,252,253 |
| `STROMERTRAG` | int32 | PV electricity [kWh/year] = `0.2 * 0.8 * GSTRAHLUNG` (20% module, 80% PR) | 0% | 0 / 6,164 / 17,640,360 |
| `STROMERTRAG_SOMMERHALBJAHR` | int32 | PV [kWh] 1 Apr–30 Sep | 0% | 0 / 4,617 / 13,385,483 |
| `STROMERTRAG_WINTERHALBJAHR` | int32 | PV [kWh] 1 Oct–31 Mar | 0% | 0 / 1,490 / 4,254,877 |
| `WAERMEERTRAG` | int32 | Solar-thermal heat [kWh/year] for a demand-sized system | 0% | 0 / 4,546 / 2,349,547 |
| `DUSCHGAENGE` | int16 | Equivalent showers/day from heat yield | 0% | 0 / 11 / 5,549 |
| `DG_HEIZUNG` | int16 | Solar fraction of space heating [%] | 0% | 0 / 10 / 69 |
| `DG_WAERMEBEDARF` | int16 | Solar fraction of total heat demand [%] | 0% | 0 / 14 / 74 |
| `BEDARF_WARMWASSER` | int32 | Estimated DHW demand [kWh/year] from GWR | 0% | 0 / 3,840 / 24,436,060 |
| `BEDARF_HEIZUNG` | int32 | Estimated space-heat demand [kWh/year] from GWR | 0% | 0 / 17,351 / 74,289,045 |
| `FLAECHE_KOLLEKTOREN` | float64 | Collector area [m²] of the modelled thermal system | 0% | 0 / 16.664314 / 3,853.540919 |
| `VOLUMEN_SPEICHER` | int32 | Storage volume [l] of that thermal system | 0% | 0 / 1,300 / 231,800 |

**Measured identities on all 10,071,755 rows:**

- `GSTRAHLUNG == round(MSTRAHLUNG * FLAECHE)` for **100%** of rows (max abs error 0).
- `STROMERTRAG == round(0.16 * GSTRAHLUNG)` for **100%** of rows (matches the documented `0.2 * 0.8` formula).

### 4.5 Suitability / target candidate

| Column | dtype | Meaning (official) | Missing | Min / median / max |
| --- | --- | --- | --- | --- |
| `KLASSE` | int16 | Roof suitability class, domain `EIGNUNG_DACH`. Quote: *“Die Zuteilung zu den Klassen erfolgt in Abhängigkeit der MSTRAHLUNG.”* | 0% | 1 / 3 / 5 ; 5 unique values |

Official Table 6 (`EIGNUNG_DACH`):

| Code | Official German label | Official MSTRAHLUNG rule |
| ---: | --- | --- |
| 1 | gering | < 800 kWh/m²/year |
| 2 | mittel | ≥ 800 and < 1000 |
| 3 | gut | ≥ 1000 and < 1200 |
| 4 | sehr gut | ≥ 1200 and < 1400 |
| 5 | hervorragend | ≥ 1400 |

English equivalents used by the GeoAdmin Identify field `klasse_text` (class 4 example: `Very good`) and a direct translation of Table 6: 1 low, 2 medium, 3 good, 4 very good, 5 excellent. **Codes will be mapped using this official table**, not guessed.

**Boundary check:** applying the Table 6 inequalities as written disagrees on **24,256 rows (0.241%)**. Those rows are **only** the four integer thresholds, and they always take the *lower* class:

| Stored `KLASSE` | `MSTRAHLUNG` | Table 6 would assign | Count |
| ---: | ---: | ---: | ---: |
| 1 | 800 | 2 | 4,174 |
| 2 | 1000 | 3 | 6,400 |
| 3 | 1200 | 4 | 8,795 |
| 4 | 1400 | 5 | 4,887 |

So in the file, class is a deterministic function of `MSTRAHLUNG` with **upper-inclusive** bins (`≤ 800`, `801–1000`, `1001–1200`, `1201–1400`, `≥ 1401`). Either reading of the threshold still means: **`KLASSE` is computed from `MSTRAHLUNG`**.

### 4.6 `SB_OBJEKTART` unique values

Official Table 5 vs observed counts (N = 10,071,755):

| Code | Official meaning | Count | % |
| ---: | --- | ---: | ---: |
| 0 | Bruecke gedeckt | 1,493 | 0.015% |
| 1 | Gebaeude Einzelhaus | 8,741,152 | 86.789% |
| 2 | Hochhaus | 10,256 | 0.102% |
| 3 | Hochkamin | 1,576 | 0.016% |
| 4 | Turm | 14,379 | 0.143% |
| 5 | Kuehlturm | 120 | 0.001% |
| 6 | Lagertank | 575,775 | 5.717% |
| 7 | Lueftungsschacht | 151 | 0.001% |
| 8 | Offenes Gebaeude | 430,681 | 4.276% |
| 9 | Treibhaus | 41,853 | 0.416% |
| 10 | Im Bau | 19,930 | 0.198% |
| 11 | Kapelle | 27,451 | 0.273% |
| 12 | Sakraler Turm | 58,859 | 0.584% |
| 13 | Sakrales Gebaeude | 64,945 | 0.645% |
| 14 | **not in Table 5** (meaning unverified) | 293 | 0.003% |
| 15 | Flugdach | 20,631 | 0.205% |
| 16 | Unterirdisches Gebaeude | 2,727 | 0.027% |
| 17 | Mauer gross | 50,333 | 0.500% |
| 18 | Mauer gross gedeckt | 2,370 | 0.024% |
| 19 | Historische Baute | 651 | 0.006% |
| 20 | Gebaeude unsichtbar | 3,266 | 0.032% |
| 21 | Dachdetail (in Table 5) | **0 in this file** | — |
| 22 | Verbindungsbruecke | 2,407 | 0.024% |
| 23 | **not in Table 5** (meaning unverified) | 456 | 0.005% |

### 4.7 Fields seen in GeoAdmin Identify but **not** in this GDB

`building_id`, `klasse_text`, `finanzertrag`, `monate`, `a_param`, `b_param`, `c_param`, `heizgradtage`, `monats_ertrag`, `gs_serie_start`, `label`. These are API/monthly-join extras. **They will not be used as training columns.**

---

## 5. Column roles (summary)

| Role | Columns |
| --- | --- |
| Geographic | `SHAPE` (EPSG:2056 MultiPoint). Derived: `longitude`, `latitude` (EPSG:4326) |
| Roof-related | `FLAECHE`, `NEIGUNG`, `AUSRICHTUNG`, `SB_OBJEKTART` |
| Solar radiation / potential | `MSTRAHLUNG`, `GSTRAHLUNG`, `STROMERTRAG`, `STROMERTRAG_SOMMERHALBJAHR`, `STROMERTRAG_WINTERHALBJAHR`, `WAERMEERTRAG`, `DUSCHGAENGE`, `DG_HEIZUNG`, `DG_WAERMEBEDARF`, `FLAECHE_KOLLEKTOREN`, `VOLUMEN_SPEICHER` |
| Suitability / target | `KLASSE` |
| Building demand (GWR, not roof geometry) | `BEDARF_WARMWASSER`, `BEDARF_HEIZUNG`, `GWR_EGID` |
| IDs / junk | `OBJECTID`, `DF_UID`, `DF_NUMMER`, `SB_UUID`, `DATUM_*`, `SB_DATUM_*` |

No elevation column exists in this dataset. No weather/elevation APIs will be used.

---

## 6. Class balance (`KLASSE`)

| `KLASSE` | Official label | Count | Share |
| ---: | --- | ---: | ---: |
| 1 | gering | 1,540,592 | 15.296% |
| 2 | mittel | 2,132,008 | 21.168% |
| 3 | gut | 2,921,319 | **29.005%** |
| 4 | sehr gut | 2,625,455 | 26.068% |
| 5 | hervorragend | 852,381 | 8.463% |
| **Total** | | **10,071,755** | 100% |

Majority-class baseline accuracy if we always predict **3 / gut**: **29.005%** (`2,921,319 / 10,071,755`).

Classes are unbalanced but all five are well populated. Stratified sampling and a macro-F1 metric are appropriate.

---

## 7. Chosen ML target

**Classification of `KLASSE` (1–5), mapped to official labels gering / mittel / gut / sehr gut / hervorragend.**

This is option (a) in the assignment: a categorical suitability class already exists, with documented codes.

We will **not** train on `STROMERTRAG` / `MSTRAHLUNG` as the target for the student API: those are the official physics outputs, and using them as *inputs* would leak (next section). Predicting `KLASSE` from roof geometry + location is the legitimate “what a homeowner can type / click” problem.

---

## 8. Leakage analysis

Official statement: `KLASSE` is assigned **from `MSTRAHLUNG`**. File check: 100% of rows follow a deterministic `MSTRAHLUNG` → `KLASSE` mapping (24,256 rows sit on the 800/1000/1200/1400 boundaries with an inclusive-upper convention).

Further identities:

- `GSTRAHLUNG = round(MSTRAHLUNG × FLAECHE)` (100%)
- `STROMERTRAG = round(0.16 × GSTRAHLUNG)` (100%)

Therefore any radiation/yield column **is the target, or is an algebraic rewrite of the target**.

**Draft idea “solar_radiation as an input”: rejected.** If the user types `MSTRAHLUNG` (or `GSTRAHLUNG`), the model can recover `KLASSE` with a few if-statements (accuracy ≈ 100%). That is not machine learning and is not something a visitor knows without already running Sonnendach.ch.

| Feature (proposed name) | Source column | Type | Valid predictor? | Reason |
| --- | --- | --- | --- | --- |
| `longitude`, `latitude` | `SHAPE` → centroid/point in EPSG:2056 → `pyproj` to EPSG:4326 | numeric | **Yes** | Location is a cause of climate/radiation, not a copy of `KLASSE`. User can click a map. |
| `roof_area_m2` | `FLAECHE` | numeric | **Yes** | Physical area. `KLASSE` is per m² irradiation, not area. Tiny vs huge roofs can share a class. |
| `slope_deg` | `NEIGUNG` | numeric | **Yes** | Roof slope; a cause of irradiation, not computed from `KLASSE`. |
| `aspect_deg` | `AUSRICHTUNG` | numeric | **Yes** | Roof aspect (−180…180, south = 0). Same argument as slope. Optional deterministic encoding: `sin/cos` of aspect (circular). |
| `building_type` | `SB_OBJEKTART` | categorical | Optional / **weak** | Not derived from `KLASSE`, but 86.8% of rows are code 1, two codes are undocumented, and a web user will rarely know the swissBUILDINGS code. **Recommend omitting** from v1 to keep the form honest. |
| `solar_radiation` / `MSTRAHLUNG` | `MSTRAHLUNG` | numeric | **No — leaks** | Official parent of `KLASSE`. |
| `GSTRAHLUNG` | `GSTRAHLUNG` | numeric | **No — leaks** | Exact `MSTRAHLUNG × FLAECHE`. |
| `STROMERTRAG` (+ summer/winter) | those columns | numeric | **No — leaks** | Exact `0.16 × GSTRAHLUNG`; would also leak if used to *predict* class. |
| `WAERMEERTRAG`, `DUSCHGAENGE`, `DG_*`, `FLAECHE_KOLLEKTOREN`, `VOLUMEN_SPEICHER` | those columns | numeric | **No — leaks / not user-typed** | Thermal-system outputs that depend on the same radiation model. |
| `BEDARF_WARMWASSER`, `BEDARF_HEIZUNG` | those columns | numeric | **No** (not leakage of `KLASSE`, but unusable) | GWR heat-demand estimates, not roof geometry; a visitor cannot type a reliable kWh demand, and 0 is common. |
| `DF_UID`, `DF_NUMMER`, `SB_UUID`, `GWR_EGID`, dates | those columns | ID/date | **No** | Identifiers / processing timestamps. `GWR_EGID` is 19.9% missing. |

**Honest limit:** official `MSTRAHLUNG` also includes **shading** from DOM / neighbouring buildings / terrain. Those surfaces are **not** in this attribute table. A model using only area, slope, aspect, and lat/lon can learn the Swiss climate + typical roof geometry pattern, but **cannot reconstruct local shading**. Accuracy will therefore be below a trivial `MSTRAHLUNG` lookup, and that is intended.

---

## 9. Data usability for the API / web form

Every retained feature is typeable or map-clickable:

| Form field | Unit | How the user provides it |
| --- | --- | --- |
| Latitude | °, WGS84 | Leaflet click or typed |
| Longitude | °, WGS84 | Leaflet click or typed |
| Roof area | m² | Typed (hint from training min/max) |
| Slope | ° | Typed (0–89 observed) |
| Aspect | ° | Typed (−180…180, 0 = south) |

No elevation field (not in the data). No radiation field (leaks).

---

## 10. Sampling plan (full file is too large for a student laptop)

- **Population:** 10,071,755 roofs in the inspected generalized annual FileGDB.  
- **RAM/disk:** 16 GB RAM; unzipped table ~1.6 GB attributes. Training RandomForest on 10 M rows is unnecessary for this assignment and would bloat `model_pipeline.joblib`.  
- **There is no canton column.** Geographic spread must use LV95 coordinates, not cantons.

**Exact rule (to implement in `prepare_data.py` after approval):**

1. Read `SOLKAT_CH_DACH` **without loading unused yield columns**. Keep `KLASSE`, `FLAECHE`, `NEIGUNG`, `AUSRICHTUNG`, and `SHAPE`.
2. Parse each MultiPoint in EPSG:2056; convert E/N → lon/lat with `pyproj` (`always_xy=True`, EPSG:2056 → EPSG:4326). Do **not** reproject before extracting coordinates.
3. Drop a row only if `KLASSE` not in `{1,2,3,4,5}` or coordinates fail (expected: **0 drops** from class; GWR nulls are irrelevant because that column is unused).
4. Draw a sample of **n = 100,000** roofs (**0.993%** of 10,071,755) with `random_state=42`:
   - Target per class: `n_k = round(100000 * N_k / N)` using the full-file counts in §6.
   - If the rounded counts do not sum to 100,000, add/remove 1 from the largest class until they do.
   - Within each class, take a simple random sample without replacement (`pandas.DataFrame.sample(..., random_state=42)`). A class-stratified uniform sample of 100k from 10M is geographically wide; we do **not** use sequential `skip_features` (that order is spatially clustered — a skip subsample occupied only 42 of the 20 km grid cells).
5. Write `data/processed/roofs_sample.csv` with columns  
   `latitude, longitude, roof_area_m2, slope_deg, aspect_deg, klasse`  
   plus a sidecar `data/processed/sample_manifest.json` recording n, `n_k`, seed, source URL, SHA-256 of the zip, and the exact counts drawn.

Optional robustness filter (only if you want it; **not** in the official model): drop `FLAECHE < 1` m² as geometry slivers. Default proposal: **keep all sizes**, because the official layer includes them (min area 0.010 m²).

---

## 11. Proposed model, preprocessing, evaluation, architecture

### Target

Multiclass classification: `klasse ∈ {1,2,3,4,5}` with official labels.

### Features (pipeline input names)

`latitude`, `longitude`, `roof_area_m2`, `slope_deg`, `aspect_deg`  
(all numeric; raw names preserved so FastAPI can pass a one-row DataFrame).

Optional inside the pipeline only (deterministic, not extra user fields): `aspect_sin`, `aspect_cos` from `aspect_deg`. Decision at implementation: include them if they improve macro-F1 on the held-out test set; they are not leakage.

### Model

`sklearn.pipeline.Pipeline` + `ColumnTransformer` + `RandomForestClassifier`:

- numeric: `SimpleImputer(strategy="median")` (defensive; current features have 0 missing)
- no scaling required for trees
- `RandomForestClassifier(n_estimators=100, max_depth=16, min_samples_leaf=5, n_jobs=-1, random_state=42, class_weight=None)`  
  Depth/trees kept modest so `model/model_pipeline.joblib` stays well under 100 MB (`joblib.dump(..., compress=3)`).

Why RF: nonlinear effects (south-facing steep roofs vs north-facing), no need for feature scaling, feature importances for the presentation, standard for this course level.

### Split and metrics

- `train_test_split(..., test_size=0.2, stratify=y, random_state=42)`
- **Baseline:** `DummyClassifier(strategy="most_frequent")` → expected accuracy **≈ 29.0%** on a stratified sample (same class mix as the full file).
- Test metrics written to `model/metrics.json` by training code (never hand-typed): accuracy, macro-F1, per-class precision/recall, confusion matrix, feature importances, train/test sizes, sklearn version, date, feature min/max from **training** fold only.
- Success criterion (qualitative): accuracy and macro-F1 clearly above the majority baseline; class 5 (8.5%) must not be ignored (hence macro-F1).

### Architecture (after approval)

```
geosolar-ai/
  data/raw/          # gitignored zip
  data/processed/    # roofs_sample.csv
  training/prepare_data.py   # GDB → sample CSV (documents every step)
  training/train_model.py    # CSV → model/model_pipeline.joblib + model/metrics.json
  app/main.py, app/schemas.py
  frontend/          # static HTML/CSS/JS, mounted at /app
```

FastAPI loads the **artifact once** (lifespan), never retrains. Frontend `POST /predict`. One `uvicorn` process serves API + `/docs` + `/app`.

---

## 12. Risks / things to double-check before Phase 1

1. Generalized geometry is **MultiPoint**, not polygons. Centroids of true roof polygons would require downloading `solarenergie-eignung-daecher_2056.gdb.zip` (**1,398,008,884 bytes**). Proposal: use the already-downloaded generalized points unless you want that extra 1.4 GB.
2. Tiny roofs exist (`FLAECHE` down to 0.01 m²). The form should still validate against training min/max.
3. `SB_OBJEKTART` codes 14 and 23 are undocumented; code 21 is documented but absent. Another reason to omit that field.
4. Shading is missing from the feature set (limitation, not a bug).
5. Training metrics must come from `model/metrics.json` after a real train run; this report contains **dataset** statistics only.

---

## 13. Decision summary

| Item | Decision |
| --- | --- |
| File to use | Annual **generalized** FileGDB already on disk (not monthly, not 5 GB) |
| Target | `KLASSE` (5-class suitability), official labels |
| Features | lat, lon, area, slope, aspect |
| Rejected | `MSTRAHLUNG` / any radiation or kWh yield (leakage) |
| Sample | 100,000 roofs, stratified by `KLASSE`, `random_state=42` |
| Model | RandomForestClassifier in one sklearn Pipeline |
| API | FastAPI loads `model_pipeline.joblib` only |

Reply **approved** in chat to start Phase 1.
