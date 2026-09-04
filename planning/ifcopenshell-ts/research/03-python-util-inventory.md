# `ifcopenshell.util` Inventory — Research for IfcOpenShell-TS

Source: `src/ifcopenshell-python/ifcopenshell/util/` (14,434 lines across 28 top-level modules,
plus a `schema/` data directory and a `scripts/` dev-tooling directory).
Tests: `src/ifcopenshell-python/test/util/` (18 test files, ~230KB).

This document inventories every module in `ifcopenshell.util` — the **pure query/read/compute**
layer, as distinct from `ifcopenshell.api` (mutation layer, covered separately). For each module:
purpose, key public functions, and dependencies. Modules are grouped into three porting tiers.

---

## Tier summary

| Tier | Count | Modules |
|---|---|---|
| **A — Pure-data / graph-traversal (easy port)** | 15 | `attribute`, `classification`, `constraint`, `data`(partial), `date`, `element`, `file`, `pset`, `resource`, `schema`, `system`, `type`, `unit`, `doc`, `mvd_info` |
| **B — Numeric / geometric (medium-hard port)** | 7 | `placement`, `geolocation`, `shape`, `shape_builder`, `representation`, `alignment`, `cost` |
| **C — Niche / deferrable** | 6 + subdirs | `brick`, `fm`, `profiler`, `selector` (own section — high value but complex), `schema/` (data dir), `scripts/` (dev tooling) |

(`selector.py` is functionally a Tier-B/C hybrid — no numeric geometry, but it embeds a full
`lark` grammar/parser, so it's non-trivial to port; it gets its own section below because of its
high strategic value.)

---

## Tier A — Pure-data / graph-traversal modules

These walk IFC entity attributes/inverses (`IsDefinedBy`, `IsTypedBy`, `Decomposes`,
`ContainedInStructure`, etc.) and return plain values, dicts, sets, or lists. No linear algebra,
no external geometry kernel. All depend only on `ifcopenshell` core (the entity/attribute
introspection API) and Python stdlib. These are the highest-value, lowest-risk TS ports — their
logic is essentially "graph traversal + attribute lookup," which any TS binding of the
`ifcopenshell` core (WASM or native) can support identically.

### `attribute.py` (81 lines)
- Purpose: low-level attribute-type introspection on the schema (not on instances).
- Key functions: `get_primitive_type(attribute)` — resolve an IFC attribute's underlying
  primitive type (`"string"`, `"float"`, `"enum"`, `"entity"`, etc.); `get_enum_items(attribute)`;
  `get_select_items(attribute)`.
- Deps: `ifcopenshell.ifcopenshell_wrapper` (schema reflection) only.

### `classification.py` (99 lines)
- Purpose: query classification references (`IfcClassificationReference` /
  `IfcClassification`) attached to elements.
- Key functions: `get_references(element, should_inherit=True)` — set of classification refs,
  optionally inherited from type; `get_classification(reference)` — walk up to root
  `IfcClassification`; `get_inherited_references(reference)`; `get_classification_data(file)`.
- Deps: `ifcopenshell.util.element` only.

### `constraint.py` (111 lines)
- Purpose: `IfcConstraint`/`IfcMetric` (objectives, benchmarks) traversal — used for e.g. BCF/
  QA checks.
- Key functions: `get_constraints(product)`, `get_constrained_elements(constraint)`,
  `get_metrics(constraint)`, `get_metric_reference(metric, is_deep=True)`,
  `get_metric_constraints(...)`, `is_hard_constraint(metric)`, `is_attribute_locked(product, attr)`.
- Deps: `ifcopenshell` core only.

### `date.py` (270 lines)
- Purpose: convert between IFC's `IfcDuration`/date-time string representations (ISO 8601 /
  custom simple formats) and Python `datetime`/`timedelta`.
- Key functions: `timedelta2duration`, `ifc2datetime`, `readable_ifc_duration`, `datetime2ifc`
  (overloaded), `string_to_date`, `string_to_duration`, `parse_duration`, `canonicalise_time`.
- Deps: stdlib `datetime`/`re`, plus **`isodate`** and **`dateutil`** (both would need TS
  equivalents — e.g. `date-fns`/`luxon`/hand-rolled ISO-8601 duration parsing; no numeric/geometry
  concern, just string parsing — hence Tier A despite external deps).

### `element.py` (2009 lines — largest "core" module)
- Purpose: the single biggest general-purpose query surface: property sets, quantities, types,
  materials, styles, spatial containment, decomposition, aggregation, nesting, voids, groups,
  systems, shape aspects, and low-level entity mutation helpers (`copy`, `copy_deep`,
  `remove_deep`/`remove_deep2`, `replace_element`/`replace_attribute`) that are *technically*
  mutating but ship in `util` because they're graph-structural, not domain-mutating (the API layer
  wraps `remove_deep2`/`copy_deep` for actual element deletion/duplication).
- Key functions (representative, ~60 public functions total):
  - Psets/Qtos: `get_pset`, `get_psets`, `get_property_definition`, `get_quantity`,
    `get_quantities`, `get_property`, `get_properties`, `get_elements_by_pset`, `has_property`.
  - Type/material: `get_predefined_type`, `is_userdefined_type`, `get_type`, `get_types`,
    `get_material`, `get_materials`, `get_material_layers`, `get_material_profiles`, `get_styles`,
    `get_elements_by_material`, `get_elements_by_style`.
  - Spatial/structural graph: `get_container`, `get_referenced_structures`,
    `get_structure_referenced_elements`, `get_decomposition`, `get_grouped_by`, `get_groups`,
    `get_parent`, `get_aggregate`, `get_nest`, `get_parts`, `get_contained`, `get_components`,
    `get_openings`, `has_openings`, `get_filled_void`, `get_voided_element`, `get_adhered_element`.
  - Structural editing helpers: `copy`, `copy_deep`, `remove_deep`, `remove_deep2`,
    `batch_remove_deep2`/`unbatch_remove_deep2`, `replace_element`, `replace_attribute`.
- Deps: `ifcopenshell` core, `ifcopenshell.guid`, `ifcopenshell.util.representation` (for shape
  aspects). No numpy/geometry kernel. This is the anchor module — port early, most other util
  modules (and `selector.py`) depend on it.

### `file.py` (116 lines)
- Purpose: parse an IFC file's STEP **header** (`FILE_DESCRIPTION`/`FILE_NAME`/`FILE_SCHEMA`)
  without fully loading the model — useful for quick metadata probes, including inside `.ifczip`.
- Key: `IfcHeaderExtractor` class, `HeaderMetadata` TypedDict.
- Deps: stdlib `zipfile` only. Pure string/text parsing — trivial TS port (could even run on a
  raw buffer before invoking a full IFC parser).

### `pset.py` (249 lines)
- Purpose: property-set/quantity-set **templates** — the canonical "PSet_..."/"Qto_..." template
  definitions bundled per schema (bsDD-derived), plus applicability-string parsing
  (e.g. `"IfcWall, IfcSlab/PROVISIONFORVOID"`).
- Key: `PsetQto` class (loads `.ifc` template files via `pset/pset_definitions/qto_definitions`
  side data — actually loads a bundled `.ifc` file per schema — see `get_template`),
  `get_pset_template_type`, `ApplicableEntity` NamedTuple, `parse_applicable_entity`,
  `convert_applicable_entities_to_query` (bridges to `selector.py` query syntax).
- Deps: `ifcopenshell.util.schema`, `ifcopenshell.util.type`, stdlib `re`/`pathlib`/`lru_cache`.
  Loads bundled template `.ifc`/JSON data files (same category as `schema/` data dir below) —
  porting requires bundling/loading those data files in TS too, but the *logic* is pure.

### `resource.py` (171 lines)
- Purpose: construction/costing **resource** (`IfcConstructionResource`) productivity and cost
  rollups — used by 4D/5D scheduling tools.
- Key: `get_productivity`, `get_parent_productivity`, `get_unit_consumed`,
  `get_quantity_produced`, `get_total_quantity_produced`, `get_parametric_resource_products`,
  `get_task_assignments`, `get_resource_required_work`, `get_nested_resources`, `get_cost`,
  `get_quantity`, `get_parent_cost`.
- Deps: `ifcopenshell.util.cost`, `ifcopenshell.util.date`, `ifcopenshell.util.element`. No
  numeric/geometry; pure graph rollup + arithmetic on plain floats.

### `schema.py` (695 lines)
- Purpose: schema-level reflection and version-migration helpers — supertypes/subtypes,
  IFC-version fallback resolution, class reassignment (changing an instance's IFC class while
  preserving compatible attributes), and a full schema **`Migrator`** (upgrading/downgrading
  files between IFC2X3/IFC4/IFC4X3).
- Key: `get_fallback_schema`, `get_declaration`, `is_a`, `get_supertypes`, `get_subtypes`,
  `geometry_classes_introduced_after`, `ifc4_only_geometry_classes`, `reassign_class`,
  `BatchReassignClass`, `Migrator` (large class, ~380 lines).
- Deps: `ifcopenshell.ifcopenshell_wrapper` (schema reflection), stdlib `json`/`functools`. The
  `Migrator` involves nontrivial cross-schema attribute-mapping logic, driven by the JSON data
  files under `schema/` (see below) — logic itself is pure-data-driven, so still Tier A, but it's
  a larger lift than the one-liners elsewhere in this tier.

### `system.py` (155 lines)
- Purpose: MEP systems/zones/ports graph (`IfcSystem`, `IfcDistributionPort`, flow connections).
- Key: `is_assignable`, `get_system_elements`, `get_element_systems`, `get_element_zones`,
  `get_ports`, `get_connected_port`, `get_port_element`, `get_connected_to`, `get_connected_from`.
- Deps: `ifcopenshell` core only.

### `type.py` (81 lines)
- Purpose: schema-driven mapping between occurrence classes and their applicable type classes
  (e.g. `IfcWall` → `IfcWallType`), loaded from bundled JSON (`entity_to_type_map_*.json`).
- Key: `get_applicable_types(ifc_class, schema)`, `get_applicable_entities(ifc_type_class, schema)`.
- Deps: stdlib `json`/`os` + `ifcopenshell.util.schema`. Trivial port once JSON data is bundled.

### `unit.py` (973 lines)
- Purpose: comprehensive unit system — SI prefixes, unit assignment lookup, project/property
  unit resolution, unit conversion (including derived/named units, imperial/metric), unit-scale
  calculation for a whole file, human-readable length formatting (architectural feet-inches,
  fractional), and **whole-file unit conversion** (rewrites all length-typed attributes/points).
- Key functions (~25): `get_prefix`, `get_prefix_multiplier`, `get_unit_name`,
  `get_full_unit_name`, `get_unit_assignment`, `cache_units`/`clear_unit_cache`,
  `get_project_unit`, `get_property_unit`, `get_property_table_unit`, `get_unit_measure_class`,
  `get_measure_unit_type`, `get_unit_symbol`, `convert_unit`, `convert`, `calculate_unit_scale`,
  `format_length` (imperial feet/inches/fractions), `is_attr_type`,
  `iter_element_and_attributes_per_type`, `convert_file_length_units`.
- Deps: `ifcopenshell.ifcopenshell_wrapper`, stdlib `fractions.Fraction`/`math.pi`. All scalar
  arithmetic (ratios, prefix multipliers) — no vectors/matrices — so it's pure-data despite being
  the 3rd-largest module. `format_length`'s imperial fraction formatting is fiddly but is just
  scalar math + string building.

### `doc.py` (1123 lines)
- Purpose: **buildingSMART documentation database** access + a `DocExtractor` scraper that builds
  it (schema entity/attribute/predefined-type/pset/property doc lookups) from the bundled HTML
  spec docs (and, at build time, scrapes bsDD/spec sites live).
- Key runtime-facing functions: `get_db(version)`, `get_class_suggestions`, `get_entity_doc`,
  `get_attribute_doc`, `get_predefined_type_doc`, `get_property_set_doc`, `get_property_doc`,
  `get_type_doc`, `get_inverse_attributes`. `DocExtractor` (830+ lines) and `run_doc_api_examples`
  are **build-time-only** tooling (require `requests`/`bs4`/`lxml`/`markdown`, wrapped in a bare
  `try/except` import so they're optional at runtime).
- Deps at runtime: just `json`/`pathlib` reading a bundled `SchemaData` JSON per version (matches
  `schema/ifc4_entities.json` etc. shape). Deps at build-time: `requests`, `bs4`, `lxml`,
  `markdown` — **not worth porting**; instead, TS should consume the same generated JSON files.
- Tier note: runtime lookup functions are Tier A (trivial JSON lookups); the `DocExtractor`
  scraper itself is Tier C / not-a-porting-target (one-time data-generation tooling, keep in
  Python, just reuse its JSON output).

### `mvd_info.py` (341 lines)
- Purpose: parse/write the `ViewDefinition`/`ExchangeRequirement`/`Option`/`Comment` mini-language
  embedded in an IFC header's `FILE_DESCRIPTION` string (MVD — Model View Definition — info).
  Uses its own small `lark` grammar (`mvd_grammar`).
- Key: `MvdInfo` class (parse/serialize), `DictionaryHandler`, `AutoCommitList` (auto-persisting
  collection wrappers so edits to the parsed structure write back to the header string).
- Deps: `lark` (optional — guarded by `LARK_AVAILABLE` flag, falls back gracefully), stdlib `re`.
  Small, self-contained grammar; straightforward to port using any TS parser-combinator or even a
  hand-written recursive-descent parser given the grammar is tiny (see excerpt below).

---

## Tier B — Numeric / geometric modules (medium-hard port)

These require vector/matrix math (`numpy`) and, for the shape-facing ones, an actual mesh/
triangulation ("geometry" produced by `ifcopenshell.geom`) or a 2D geometry library (`shapely`).
Porting requires picking a JS/TS linear-algebra library (e.g. `gl-matrix`) and, for `shape.py`/
`shape_builder.py`, either a WASM build of the geometry kernel or a reimplementation of the
IFC representation-item interpreter.

### `placement.py` (240 lines)
- Purpose: convert IFC placement entities (`IfcAxis2Placement3D/2D`, `IfcLocalPlacement`,
  `IfcCartesianTransformationOperator3D`, `IfcMappedItem`) into 4x4 (or 3x3 homogeneous)
  transform matrices, and back (rotation-only matrix builder).
- Key: `a2p(origin, z, x)` — build matrix from origin/axis/refDirection; `get_axis2placement`;
  `get_local_placement` (walks `PlacementRelTo` chain, composing matrices); 
  `get_cartesiantransformationoperator3d`; `get_mappeditem_transformation`; `get_storey_elevation`;
  `rotation(angle, axis, is_degrees=True)`.
- Deps: **numpy** (`numpy.typing` for `MatrixType`). Pure 4x4 matrix algebra — no mesh/kernel
  dependency — so this is the **most portable of the geometric modules**: straightforward with
  `gl-matrix` or hand-rolled `Float64Array` math. Single highest-value Tier-B port.

### `geolocation.py` (693 lines)
- Purpose: georeferencing — DMS↔decimal-degrees, local↔map (easting/northing/height, "ENH")
  coordinate conversions via Helmert transformation (`IfcMapConversion`), WCS/true-north/grid-
  north angle handling, and "auto" variants that read the conversion parameters straight from the
  IFC file's `IfcCoordinateReferenceSystem`/`IfcMapConversion`.
- Key: `HelmertTransformation` NamedTuple, `dms2dd`/`dd2dms`, `xyz2enh`/`enh2xyz` (+ `auto_`
  variants), `get_helmert_transformation_parameters`, `get_crs`, `z2e`/`auto_z2e`,
  `local2global`/`global2local` (+ `auto_` variants), `xaxis2angle`/`yaxis2angle`/`angle2xaxis`/
  `angle2yaxis`, `get_grid_north`, `get_true_north`, `get_wcs`.
- Deps: `numpy`, stdlib `decimal.Decimal` (for precise DMS rounding), `ifcopenshell.util.element`,
  `ifcopenshell.util.placement`. Scalar/trig + small matrix ops — no mesh kernel — moderately
  portable; the main risk is float-precision parity with Python's `Decimal` rounding modes.

### `representation.py` (523 lines)
- Purpose: navigate `IfcShapeRepresentation`/`IfcRepresentationContext` — pick the "right"
  representation for a purpose (Body/Axis/Box/etc. + target view), resolve mapped
  representations/items, guess an item's geometry type, and compute a wall's 2D reference line.
- Key: `get_context`, `is_representation_of_context`, `get_representations_iter`,
  `get_representation`, `guess_type`, `resolve_representation`, `resolve_items`,
  `resolve_base_items`, `get_prioritised_contexts`, `get_part_of_product`, `get_item_shape_aspect`,
  `get_material_style`, `get_reference_line` (returns polyline points via numpy).
- Deps: `numpy`, `ifcopenshell.util.placement`, `ifcopenshell.util.shape`. Mostly graph traversal
  over representation entities (Tier-A-like) but a few functions (`get_reference_line`) do real
  2D vector math, and `guess_type` embeds IFC-representation-item type knowledge — hence Tier B.

### `shape.py` (754 lines)
- Purpose: **post-processed-geometry** query functions — everything here operates on
  `W.triangulation` (the C++ `ifcopenshell.geom` output: verts/faces/edges/normals/material IDs),
  not on IFC entities directly. Volume/area/bbox/centroid/elevation/side-area/footprint
  calculations, plus profile/extrusion introspection on the *source* representation.
- Key (~35 functions): `get_volume`, `get_x/y/z`, `get_max_xy`, `get_max_xyz`/`get_min_xyz`,
  `get_shape_matrix`, `get_bbox_centroid`, `get_vert_centroid`, `get_element_bbox_centroid`,
  `get_vertices`, `get_edges`, `get_faces`, `get_material_colors`, `get_normals`,
  `get_shape_material_styles`, `get_faces_material_style_ids`, `get_bottom/top_elevation`,
  `get_bbox`, `get_area_vf`, `get_area`, `get_side_area`, `get_max_side_area`, `get_top_area`,
  `get_footprint_area` (uses **shapely** polygon ops), `get_outer_surface_area`,
  `get_footprint_perimeter`, `get_profiles`, `get_extrusions`, `get_base_extrusions`,
  `get_total_edge_length`.
- Deps: **numpy**, **shapely** (`shapely.ops` for polygon boolean/union in footprint
  calculations), `ifcopenshell.util.element`/`placement`/`representation`. **Hard blocker**: this
  entire module assumes a triangulated mesh already exists — i.e. it assumes `ifcopenshell.geom`
  (the C++/OCC geometry kernel) has already run. A TS port needs either (a) a WASM build of the
  IfcOpenShell geometry kernel producing an equivalent triangulation struct, or (b) a separate JS
  mesh-processing library, before any of `shape.py`'s functions are meaningful. `get_footprint_area`
  additionally needs a 2D polygon library (shapely equivalent — e.g. `polygon-clipping`/`martinez`
  or a Turf.js-style library) for boolean union of footprint slices.

### `shape_builder.py` (2312 lines — largest module in `util`)
- Purpose: the opposite direction — a **parametric geometry authoring** toolkit (`ShapeBuilder`
  class) for constructing `IfcExtrudedAreaSolid`/polylines/circles/arcs/profiles programmatically
  (used heavily by `ifcopenshell.api.*` builders, e.g. door/window/railing generators). Includes a
  large numpy-vector-math helper library at module scope.
- Key module-level helpers: `V` (vector constructor), `np_normalized`, `np_matrix_normalized`,
  `np_lerp`, `np_to_3d`/`np_to_4d`/`np_to_4x4`, `np_apply_matrix`, `np_angle`/`np_angle_signed`,
  `np_translation_matrix`, `np_rotation_matrix`, `np_matrix_to_euler`, `np_normal`,
  `np_intersect_line_line`, `intersect_x_axis_2d`, `arc_to_polyline_points`,
  `polygonal_face_set_to_faceted_brep`. Then the `ShapeBuilder` class itself (huge — profile/
  polyline/circle/rectangle/extrusion/sweep/revolution builders, boolean clips, mirroring).
- Deps: **numpy** only (no shapely/OCC) — everything is done via IFC parametric-curve entities +
  vector math, not mesh boolean ops, which makes it more portable than `shape.py` despite being
  much bigger. Still substantial effort: it's the biggest single module and encodes a lot of IFC
  geometry-authoring domain knowledge (arc segmentation, sweep frames, Euler angle conventions).
  High value for anyone wanting to *author* geometry from TS (e.g. a web-based IFC editor), but
  lower priority than the pure-query modules for a first "read/query" oriented TS wrapper.

### `alignment.py` (111 lines)
- Purpose: small helper module for `IfcAlignment` (road/rail alignment) — despite the "curve
  math" flag in scope, this particular file is thin: it delegates the heavy lifting to
  `ifcopenshell.api.alignment`/geometry creation and mostly does housekeeping (adding a fallback
  `IfcLinearPlacement`'s `CartesianPosition`, ensuring segments have `Ifc(Curve)SegmentGeometry`,
  removing/padding zero-length segments) plus one pure function: `station_as_string(file, sta)`
  (chainage formatting, e.g. `12+345.678`, unit-aware).
- Deps: `math`, `ifcopenshell.util.unit`. Actual alignment curve math (clothoid/spiral evaluation
  etc.) lives in the C++ core / `ifcopenshell.api.alignment`, not here — so this module itself is
  low-effort, but it's not very useful standalone without the real curve-evaluation engine behind
  it. Classified Tier B mainly because it's meaningless without geometric infrastructure, not
  because the file itself is complex.

### `cost.py` (441 lines)
- Purpose: cost-schedule (5D) rollups — `IfcCostItem`/`IfcCostValue` tree traversal, formula
  evaluation (`CostValueUnserialiser` uses **lark** to parse/evaluate arithmetic formulas over
  quantity variables), applied-value calculation, cost aggregation up/down the cost-item tree.
- Key: `get_primitive_applied_value`, `get_total_quantity`, `calculate_applied_value`,
  `sum_child_root_elements`, `serialise_cost_value`/`unserialise_cost_value`,
  `get_cost_items_for_product`, `get_root_cost_items`, `get_all_nested_cost_items`,
  `get_cost_values`, `get_cost_schedule_types`, `get_cost_rate`, `CostValueUnserialiser` (lark
  grammar + `lark.Transformer` for formula evaluation).
- Deps: **lark** (grammar-based formula parser/evaluator — same porting concern as `selector.py`),
  `ifcopenshell.util.attribute`/`element`/`unit`/`doc`. Classified Tier B not for vector/matrix
  math (there is none) but because of the embedded formula-language parser — comparable effort to
  `selector.py`'s grammars. Value rollup logic itself (tree sums) is trivial once formulas parse.

---

## Tier C — Niche / deferrable modules

### `brick.py` (105 lines)
- Purpose: map IFC elements to **Brick Schema** (building-ontology) classes/relationships, for
  BMS/BAS integration — `get_brick_type`, `get_element_feeds` (traces MEP flow/feeds graph).
- Deps: `ifcopenshell.util.classification`/`element`/`system`, bundled `ifc4_to_brick.json`
  mapping table. Low usage outside BMS interoperability workflows — defer.

### `fm.py` (186 lines)
- Purpose: **Facilities Management** class-list helpers — COBie-relevant type/component classes
  (`get_cobie_types`, `get_cobie_components`) and FM-HEM (another FM data-exchange spec) class
  lists (`get_fmhem_types`, `get_fmhem_classes`). Mostly static class-name lists + simple filters.
- Deps: `ifcopenshell.util.attribute`, `ifcopenshell.ifcopenshell_wrapper`. Trivial code but niche
  domain (COBie/FM workflows) — low near-term priority, easy to port later if needed (it's mostly
  static lookup tables).

### `profiler.py` (35 lines)
- Purpose: a tiny dev-utility `Profiler` class wrapping `timeit` for ad-hoc call counting/timing
  during development. Not part of the public "wrapper API" surface at all — **skip porting**;
  use native TS/JS profiling tools instead.

### `schema/` (data directory, not code)
- Contains the bundled JSON schema-reflection data (`ifc{2x3,4,4x3}_{entities,properties,types}.json`,
  ~5.5MB total) plus `.ifc` pset template files (`Pset_IFC2X3.ifc`, `Pset_IFC4_ADD2.ifc`,
  `Pset_IFC4X3.ifc`) and `ifc_classes_suggestions.json`. This is **data**, consumed by `doc.py`,
  `pset.py`, `type.py`. For TS: these JSON files can likely be reused/bundled as-is (schema is
  schema regardless of language); the `.ifc` template files need an IFC parser to load once at
  build/init time (or could be pre-converted to JSON during a build step).

### `scripts/` (dev-tooling subdir)
- `sync_stub.py` (18KB) and `validate_stub.py` (10.8KB) — internal maintenance scripts (used in
  CI, per `test/util/scripts/test_validate_stub.py`) that presumably keep `.pyi` stub files or
  generated docs in sync with the schema/codebase. Not part of the runtime wrapper API — **not a
  porting target**; TS will have its own build tooling.

---

## `selector.py` — the IFC Query Selector Syntax (dedicated section)

`selector.py` (1298 lines) is IfcOpenShell's distinctive **text query language** for filtering
IFC elements, extracting values from them, and formatting those values — the same syntax exposed
throughout Bonsai/BlenderBIM's UI (e.g. spreadsheet exports, batch editing, "Selector" workbench)
and CLI tooling (IfcCSV, IfcPatch). It's implemented with **`lark`** (an EBNF-based parser
generator) via three separate grammars plus `lark.Transformer` visitor classes that turn parse
trees into executable filters/values.

This is a strong "signature feature" candidate for early TS porting because it's high-leverage
(single feature unlocking spreadsheet-like querying across a whole model) and self-contained
(depends only on other `util` modules, not the geometry kernel).

### 1. Filter grammar (`filter_elements_grammar`) → `filter_elements(file, query, elements=None)`
Selects a **set of elements** matching a query string. Grammar (`facet_list` separated by `+` for
intersection, `,` for union within a facet_list):

- **Instance filter**: a GlobalId literal — `1F$q0mSQz0OQjHNKlt2n_a` (with optional `!` negation).
- **Entity filter**: an IFC class name — `IfcWall`, `IfcWall, IfcSlab` (union), `! IfcWall`
  (negation, i.e. exclude).
- **Attribute filter**: `AttributeName<comparison><value>` — e.g. `Name=Wall-01`,
  `Name*=Wall` (contains), `OverallHeight>=3000`.
- **Type filter**: `type=IfcWallType` (filters by the element's `IfcWallType`/etc. relationship).
- **Material filter**: `material=Concrete`.
- **Property filter**: `Pset_WallCommon.FireRating=120` — pset (or regex/quoted pset name) `.`
  prop (or regex/quoted) `<comparison><value>`.
- **Classification filter**: `classification=Uniclass2015`.
- **Location filter**: `location=Level 1` (spatial container ancestry).
- **Group filter**: `group=MyGroup`.
- **Parent filter**: `parent=...`.
- **Query facet** (`query:`): arbitrary key-path comparison — `query:Name=Wall-01` etc. equivalent
  to attribute but via the `get_element_value` key-path mini-language (see below).
- **Comparisons**: `=`, `!=` (negated equals), `>=`, `<=`, `>`, `<`, `*=`/`!*=` (contains/not
  contains, i.e. substring or regex match), values can be `NULL`/`TRUE`/`FALSE`/quoted string/
  regex (`/.../`)/bare token, and numeric comparisons coerce to `Decimal`.
- Combinators: `,` = OR within a facet group; consecutive facet groups joined by `+` = AND
  (each subsequent group filters down the *previous* group's result set — i.e. left-to-right
  intersection/refinement), a trailing `+` allows continued mutation via `edit_in_place`.
- Regex support: pset/prop names, attribute values etc. can use `/regex/` instead of literal
  strings, matched via Python `re` (would map to JS `RegExp`).
- Implementation: `FacetTransformer(lark.Transformer)` walks the parse tree, each facet type
  builds a Python closure `filter_function(element) -> bool` and the transformer applies it over
  the working `elements` set (starting from `file.by_type(...)` if not seeded).

### 2. Key-path grammar (`get_element_grammar`) → `get_element_value(element, query)`
A **dotted key-path mini-language** for extracting a value out of an element, e.g.:
`"type.Name"`, `"Pset_WallCommon.FireRating"`, `"material.Name"`, `"storey.Elevation"`.
Special first-class keys recognized by `_get_element_value` (not literal IFC attributes):
`type`, `material`/`mat`, `materials`/`mats`, `profiles`, `styles`, `item`/`i`, `container`,
`space`, `storey`, `building`, `site`, `parent`, `types`/`occurrences`, `count`, `class`,
`predefined_type`, `id`, `classification`, `group`, `system`, `zone`, and positional/geolocated
keys `x`/`y`/`z`/`easting`/`northing`/`elevation`/`rotation_x`/`rotation_y`/`rotation_z` (these
last ones actually invoke `placement.get_local_placement` + `geolocation.auto_xyz2enh` +
`shape_builder.np_matrix_to_euler` — i.e. numeric dependencies leak into this "pure" module for
these specific keys). Otherwise falls through to real IFC attribute lookup, then pset/qto lookup
by name (supporting regex pset/prop names), with recursion over lists/sets/dicts (e.g. drilling
into nested `IfcComplexProperty`). This is the module's most intricate function (~150 lines) and
is reused by both `filter_elements`'s `query:` facet and the `format()` `{{...}}` variable
substitution.

### 3. Format grammar (`format_grammar`) → `format(query, element=None)`
An Excel-formula-like expression language for turning extracted values into display strings:
`round(x, step)`, `number(x, decimal_sep, thousands_sep)`, `int(x)`, `metric_length(x, precision,
decimals)`, `imperial_length(x, precision, [numerator_unit, denominator_unit, is_feet_only])`,
`lower`/`upper`/`title`, `concat(...)`, `substr(s, start, [len])`, `sort(list)`, `reverse(list)`,
`join(sep, list)`, `+`/`-`/`*`/`/` arithmetic, and `{{query_path}}` variable interpolation (which
internally calls `get_element_value`). Implemented via `FormatTransformer(lark.Transformer)`.

### 4. Value mutation: `set_element_value(...)` / `SetElementValueException`
The inverse of `get_element_value` — writes into an element following the same key-path syntax
(handles predefined-type setting, pset/prop creation via `ifcopenshell.api.pset`, etc.). This one
crosses into `ifcopenshell.api` territory (it imports `ifcopenshell.api.geometry` and
`ifcopenshell.api.pset`) — so it's technically a mutation function riding along in `util`; the
other researcher covering `ifcopenshell.api` should be aware `selector.py` also exposes this.

### Porting implications
- **Grammar**: `lark`'s EBNF needs a TS equivalent — options are hand-writing a recursive-descent
  parser (grammars are small/stable, ~120 lines total across 3 grammars), or using a JS parser
  generator (e.g. `nearley`, `ohm-js`, `peggy`) fed a translated grammar. Given the grammars are
  small and fixed, a hand-rolled parser is likely lower-risk than a new toolchain dependency.
- **Regex**: Python `re` patterns embedded in queries (`/pattern/`) map cleanly to JS `RegExp`
  with minor syntax caveats (lookbehind support, `\d`/`\w` equivalence is fine).
- **Decimal comparison**: uses Python `decimal.Decimal` for numeric value comparisons (exact
  decimal semantics); JS has no built-in equivalent — likely fine to use plain `Number` unless
  exact-decimal test parity matters, or pull in a small decimal library.
- `filter_elements` is pure Tier-A-equivalent complexity (once grammar exists) since it only
  calls into `element.py`/`classification.py`/`system.py`/`schema.py` — all Tier A. `format()`'s
  numeric functions are trivial once parsed. The real cost is entirely the grammar/parser, not
  the semantics.

---

## Testing conventions (`test/util/`)

- One `test_<module>.py` per module (18 files; `alignment`, `attribute`, `brick`, `classification`,
  `cost`, `date`, `element`, `file`, `geolocation`, `placement`, `pset`, `schema`, `selector`,
  `shape_builder`, `system`, `type`, `unit`, `unit_conversion`), plus a `scripts/` test subdir
  (`test_validate_stub.py`).
- Framework: **pytest**, using **class-based grouping** — one class per function/behavior under
  test, e.g. `class TestGetStoreyElevationIFC4(test.bootstrap.IFC4): def test_run(self): ...`.
- Fixture pattern: tests subclass mixins from `test/bootstrap.py` — `test.bootstrap.IFC4`,
  `IFC2X3`, `IFC4X3` — each providing an `autouse` pytest fixture that creates a fresh in-memory
  `self.file = ifcopenshell.api.project.create_file(version=...)` per test and resets
  `ifcopenshell.api.pre_listeners`/`post_listeners` and owner-history user/application stubs.
  This gives every test a clean, schema-specific IFC model to build fixtures into inline (e.g.
  `self.file.createIfcBuildingStorey()`).
- Convention: `import <module> as subject` then assert against `subject.<function>(...)`.
- Version-matrix testing: many behaviors are tested twice (once per `IFC4`/`IFC2X3` mixin class)
  to catch schema-version-dependent branches (seen in `type.py`, `unit.py` tests, etc.).
- Implication for TS: a similar "in-memory fresh file per test, version-parameterized fixture
  classes" pattern translates well to TS test frameworks (e.g. Vitest/Jest) — worth carrying the
  same fixture-mixin convention (e.g. a `withIfcVersion(version)` test helper).

---

## Porting priority suggestion

Rank near-term TS porting targets by (a) value/leverage for a first usable TS wrapper, (b) low
dependency risk (pure logic vs. needing a geometry kernel or new parser toolchain), and (c) how
many other modules/selector.py transitively depend on them:

1. **`element.py`** — the foundational query module (psets, types, materials, spatial graph,
   decomposition). Nearly everything else (`classification`, `system`, `brick`, `selector`,
   `resource`, `representation`) depends on it. Pure graph traversal over the core entity API —
   directly portable once the TS core binding exposes attribute/inverse access. Do this first.

2. **`selector.py`'s query/filter/format language** — the single highest-leverage *feature* to
   port (not just utility functions): gives TS users the same `"IfcWall, Name=Wall-01"` /
   `"Pset_WallCommon.FireRating=120"` filtering and `{{...}}` templated value extraction that
   Bonsai/BlenderBIM users already know. Main cost is re-implementing the three small `lark`
   grammars as hand-written parsers (~120 lines of grammar, well-tested via `test_selector.py`'s
   ~35KB of test cases) — everything downstream of parsing is Tier-A-equivalent logic.

3. **`placement.py`** — the best "give TS real 3D coordinates" win with the least risk: pure 4x4
   matrix math over `numpy`, trivially mapped to `gl-matrix`/`Float64Array`, no mesh/geometry
   kernel dependency, and it's a prerequisite for anything spatial (`geolocation.py`,
   `representation.py`'s reference-line, and the `x`/`y`/`z`/`rotation_*` keys in `selector.py`'s
   key-path language).

Honorable mentions for the *next* wave: `unit.py`, `type.py`, `classification.py`, `pset.py`
(round out the query surface cheaply — all Tier A); `geolocation.py` once `placement.py` lands
(georeferencing is a common downstream need). Defer `shape.py`/`shape_builder.py` until a decision
is made on the geometry-kernel story (WASM build of the C++ kernel vs. a separate JS mesh
library) — they're high-value but gated on that infrastructure choice, not on translation effort
alone. `brick.py`, `fm.py`, `profiler.py`, `doc.py`'s `DocExtractor`, and `scripts/` are low
priority / not real porting targets (niche domains, dev tooling, or better solved by reusing
Python-generated JSON data directly).
