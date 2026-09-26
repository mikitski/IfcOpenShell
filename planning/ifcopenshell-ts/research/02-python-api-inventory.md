# IfcOpenShell-TS Research: `ifcopenshell.api` Python Inventory

_Generated 2026-09-03 — research artifact for the IfcOpenShell-TS porting effort. Source: `src/ifcopenshell-python/ifcopenshell/api/` at commit `2c1d445d5` (branch `v0.9.0`)._

## Scope and method

This report inventories `ifcopenshell.api`, the "mutation" / write-operation half of the Python
wrapper's high-level API (its counterpart, `ifcopenshell.util`, the read/query half, is covered by a
separate research pass). It covers:

1. How `ifcopenshell.api.run(...)` and the modern function-call dispatch pattern work.
2. Every function in all 34 subpackages, with a one-line description sourced from each function's docstring.
3. Which subpackages depend on `numpy`, `ifcopenshell.util.*`, or the compiled geometry kernel (`ifcopenshell.geom`).
4. How `test/api/` is structured, to inform the shape of a TS test suite.
5. A rough porting-priority tier list (a suggestion for later design discussion, not a decision).

Counting method: functions were extracted by parsing each `.py` file's AST (not by hand), and cross-checked
against each subpackage's `__init__.py` `__all__` list to distinguish the **public API surface** from
private helpers (files/functions prefixed with `_`).

## Summary numbers

- **34 subpackages** under `ifcopenshell/api/`.
- **369 public API functions** (i.e. total of each subpackage's `__all__`), reachable as
  `ifcopenshell.api.<subpackage>.<function_name>(file, ...)`.
- **~450 total function definitions** in the source tree, the difference being private helper functions
  (leading underscore) — concentrated almost entirely in `alignment` (which alone has 42 public vs. ~100
  total defs — lots of internal geometry-evaluation helpers) and a handful of railing/door/window geometry
  helpers in `geometry`.
- **0 subpackages import `shapely` or call OpenCascade (`OCC`) directly.** Only 3 files anywhere in `api/`
  reference `ifcopenshell.geom` (the compiled geometry kernel) directly: `alignment/util.py` +
  2 alignment internals, `geometry/add_profile_representation.py`, and `material/edit_profile_usage.py`.
- **numpy** is used in 9 subpackages, almost always just for 4x4 matrix/vector math (placements, transforms,
  polyline point math) — not for anything numpy-specific that would be hard to replace with a small TS
  vector/matrix library (e.g. `gl-matrix`).
- Nearly every subpackage (31/34) depends on `ifcopenshell.util.*` helpers (mostly `ifcopenshell.util.element`,
  `.util.schema`, `.util.date`, `.util.unit`) for lookups, schema validation, and inverse-relationship
  cleanup — meaning `ifcopenshell.util` will need to be ported (or at least a meaningful subset of it)
  *before or alongside* `ifcopenshell.api`, not after.
## 1. Dispatch mechanism (`ifcopenshell/api/__init__.py`)

There are **two** dispatch patterns present in the codebase: a legacy string-based dispatcher
(`ifcopenshell.api.run(...)`) that is now explicitly deprecated, and the modern pattern of calling
subpackage functions directly. Understanding both — and the hook system that wraps the modern one — matters
for the TS design decision of whether to keep string dispatch at all.

### 1.1 `ifcopenshell.api.run(usecase_path, ifc_file=None, should_run_listeners=True, **settings)`

```python
def run(usecase_path, ifc_file=None, should_run_listeners=True, **settings):
    """This is deprecated and will be removed in a future version. Do not use this function."""
    usecase_function = CACHED_USECASES.get(usecase_path)
    if not usecase_function:
        importlib.import_module(f"ifcopenshell.api.{usecase_path}")
        module, usecase = usecase_path.split(".")
        usecase_function = getattr(getattr(ifcopenshell.api, module), usecase)
        CACHED_USECASES[usecase_path] = usecase_function
    if ifc_file:
        return usecase_function(ifc_file, should_run_listeners=should_run_listeners, **settings)
    return usecase_function(should_run_listeners=should_run_listeners, **settings)
    # --- unreachable code below (dead, kept for reference/back-compat docs) ---
```

Mechanics:
- `usecase_path` is a two-segment dotted string, e.g. `"pset.add_pset"` or `"root.create_entity"` —
  **always exactly `module.function`**, not deeper nesting (`ifcopenshell.api` itself is stripped).
- Resolution is `importlib.import_module("ifcopenshell.api." + module)` then `getattr` twice: once to
  get the submodule off the `ifcopenshell.api` package object, once to get the function off that submodule.
  Results are memoized in a module-level `CACHED_USECASES` dict keyed by the full path string, so this
  reflection only happens once per usecase path per process.
- No argument validation/coercion happens in `run()` itself — `**settings` is passed straight through as
  kwargs to the resolved function. Validation/coercion is the callee's job (typically via type hints +
  a `TypeError` when a bad kwarg is passed, see 1.3 below).
- There is dead code after the first `return` (an older class-based `Usecase(...).execute()` pattern with
  its own pre/post-listener calls) that is now unreachable — historically each usecase was a class with an
  `__init__`/`execute()` split; this was refactored to plain functions, and the class-based path was cut
  over but not deleted from `run()`. `extract_docs()` (further down in the same file, used for generating
  a node-graph / visual-scripting introspection UI, likely for Bonsai) still assumes the old
  `Usecase.__init__` / `Usecase.execute` class shape and would break on any module that has already been
  migrated to a plain function — i.e. `extract_docs` itself looks stale/only partially migrated.

### 1.2 The modern, preferred pattern: direct function calls

Every subpackage's `__init__.py` imports its functions directly and re-exports them, e.g.
`src/ifcopenshell-python/ifcopenshell/api/pset/__init__.py`:

```python
from .. import wrap_usecases
from .add_pset import add_pset
from .add_qto import add_qto
...
wrap_usecases(__path__, __name__)
__all__ = ["add_pset", "add_qto", ...]
```

So the documented/intended call style today is a normal typed function call:
`ifcopenshell.api.pset.add_pset(file, product=wall, name="Pset_WallCommon")` — no string dispatch, full
IDE autocomplete and type-checking. `run()` is a compatibility shim for old scripts and is explicitly
marked for removal.

### 1.3 The `wrap_usecase` / `wrap_usecases` hook system

This is the part that most affects a TS port. `wrap_usecases(path, name)` is called once at the bottom of
every subpackage `__init__.py`. It iterates the submodule's top-level callables (via `pkgutil.iter_modules`)
and replaces each one on the module object with a wrapped version from `wrap_usecase(usecase_path, usecase)`.
The wrapper does, in order, on every call:

1. **Pre-listeners.** If `should_run_listeners` (default `True`), calls every callback registered via
   `ifcopenshell.api.add_pre_listener(usecase_path, name, callback)` for this exact `usecase_path`, plus
   any registered under the wildcard key `"*"`. Callback signature: `(usecase_path, ifc_file, settings)`.
   `ifc_file` here is just `args[0]` — the wrapper assumes the file is always the first positional arg.
2. **Deprecated-argument remapping.** Looks up `usecase_path` in the module-level `ARGUMENTS_DEPRECATION`
   dict (currently empty in this snapshot, but the plumbing — `batching_argument_deprecation` and
   `renamed_arguments_deprecation` helpers — exists for renaming/restructuring kwargs across API-breaking
   changes while printing a `WARNING.` message and keeping old call sites working).
3. **Calls the real function** with `*args, **settings`.
4. **Friendlier `TypeError` on bad kwargs.** If the call raises `TypeError` whose message starts with the
   function's own name (i.e. Python's own "got an unexpected keyword argument" style error, not an error
   *inside* the function body), it re-raises a much more actionable message including the resolved
   signature and a pointer to `help(ifcopenshell.api.<usecase_path>)`. Errors raised *inside* the function
   body are left untouched and propagate normally.
5. **Post-listeners**, same mechanic as pre-listeners but after the call, and only if it didn't raise.

`wrapper.__signature__`, `__doc__`, and `__name__` are copied from the underlying function so introspection
(`help()`, `inspect.signature()`) still works transparently through the wrapper.

### 1.4 Listener/hook registration API

```python
ifcopenshell.api.add_pre_listener(usecase_path, name, callback)
ifcopenshell.api.add_post_listener(usecase_path, name, callback)
ifcopenshell.api.remove_pre_listener(usecase_path, name, callback)
ifcopenshell.api.remove_post_listener(usecase_path, name, callback)
ifcopenshell.api.remove_all_listeners()
```

`pre_listeners` / `post_listeners` are plain module-level dicts: `{usecase_path: {name: callback}}`. This
**is the entire extensibility surface** ifcopenshell.api itself provides — there is no undo/redo, no
transaction log, and no dirty-tracking built into `ifcopenshell.api` or core `ifcopenshell` itself.

### 1.5 No built-in undo/redo — it lives downstream, in Bonsai

Searched for it explicitly since the task called it out: **`ifcopenshell.api` has no transaction/undo
system.** The pre/post listener hooks above are a generic observer pattern with no opinion about undo.
Undo/redo is implemented entirely in the Bonsai Blender add-on (a separate package,
`src/bonsai/bonsai/tool/ifc.py` and related), which registers a post-listener (via
`ifcopenshell.api.add_post_listener`) that serializes each usecase call's `settings` (see
`serialise_settings()` in this same `__init__.py` — handles `entity_instance` → STEP id, `numpy.ndarray` →
list, etc., for a VCS/undo diff format) and pushes it onto its own undo stack, replaying it against the IFC
file on undo/redo. So: the hook points (`add_pre_listener`/`add_post_listener`) are core, but the undo
*implementation* is entirely a downstream consumer's responsibility. `serialise_settings()` is a fairly
strong hint of the payload shape (JSON-able settings dict, entity references by STEP id) that a Bonsai-like
consumer expects to build undo/redo or a VCS diff on top of.

### 1.6 Owner/user hook (`ifcopenshell.api.owner.settings`)

A second, unrelated hook mechanism: `ifcopenshell.api.owner.settings` exposes two **monkey-patchable
module-level functions**, `get_user(ifc)` and `get_application(ifc)`, used internally by
`owner.create_owner_history` to populate `IfcOwnerHistory.OwningUser` / `OwningApplication` on every
created/edited entity. The documented usage pattern (see `test/bootstrap.py`) is literally reassigning the
function attribute: `ifcopenshell.api.owner.settings.get_user = lambda ifc: my_person_and_org`. There's also
`factory_reset()` / `restore()` to toggle between the monkey-patched version and the box-default
(`by_type("IfcPersonAndOrganization")`-based) version. This is a much simpler hook than the listener system
— just an overridable global function reference, not an event/observer pattern.

### 1.7 Open design question for IfcOpenShell-TS (not decided here)

A straight port has three real options, worth flagging explicitly for the design phase:

- **(a) Keep string dispatch** (`ifcopenshell.api.run("pset.add_pset", file, {...})`) for parity with the
  deprecated legacy pattern and for any future visual/no-code tooling akin to `extract_docs()`. Loses
  TS type-checking on arguments entirely unless paired with a big discriminated-union settings type.
- **(b) Drop string dispatch, use direct typed calls only** (`api.pset.addPset(file, {...})`), mirroring the
  *modern, recommended* Python pattern (§1.2) rather than the deprecated one. This is what the Python docs
  themselves now steer users toward, and is by far the more natural fit for TS/IDE ergonomics.
  If this is the winner, `ifcopenshell.api.run` need not be ported at all, or only as a thin best-effort
  compatibility shim.
- **(c) Hybrid**: typed calls as the primary surface, plus a thin optional string-keyed registry
  (`Map<string, Function>`) purely to support the pre/post listener hook system and any tooling that wants
  to enumerate/introspect usecases by name (e.g. a Bonsai-web-equivalent undo system, or a node-graph UI).

Separately, whatever is decided for dispatch, the **pre/post listener hook system (§1.3–1.4) is worth
porting on its own merits** regardless of dispatch style — it's simple (two dicts of callbacks keyed by
usecase path + a wildcard), it's exactly the seam a future web-based undo/redo or collaborative-editing
layer would hook into (the way Bonsai does today), and it's independent of the string-vs-typed-call
question. The owner-settings monkeypatch pattern (§1.6) needs a TS-idiomatic replacement (e.g. an injectable
config object or a settable module singleton) since JS doesn't support reassigning `export function` bindings
from outside the module the way Python allows reassigning a module attribute.
## 2. Subpackage inventory

Each entry: subpackage name, one-line purpose, function count (public / total incl. private helpers), dependency flags for the subpackage as a whole, then a table of every **public** function with a one-line description from its docstring. `util-dep` = imports `ifcopenshell.util.*` somewhere in the file; `numpy` = imports numpy; `geom-kernel` = touches the compiled `ifcopenshell.geom` geometry-processing engine directly.

### `ifcopenshell.api.aggregate` *(see Deep Dive, §3)*

Spatial/physical decomposition (IfcRelAggregates) -- parent/child whole-part hierarchy (project > site > building > storey, or element > part).

**2 public functions** (2 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `assign_object` | Assigns object as an aggregate to the products | util-dep |
| `unassign_object` | Unassigns products from their aggregate | util-dep |

### `ifcopenshell.api.alignment`

Road/rail/infrastructure alignments (IFC4X3 civil): horizontal/vertical/cant layouts, PI-method layout, CSV import, curve-segment representation generation. Largest and most specialised subpackage.

**42 public functions** (100 total function defs incl. private helpers). Subpackage-level flags: geom-kernel, numpy, util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_positioning_referent` | Semantically defines the position of a product along an alignment by adding an IfcReferent to the alignment that defines the stationing system. |  |
| `add_stationing_referent` | Adds an IfcReferent to the alignment that defines the stationing system. | util-dep |
| `add_vertical_layout` | Adds a vertical layout to a previously created alignment. | util-dep |
| `add_zero_length_segment` | Adds a zero length segment to the end of a layout. | util-dep |
| `create` | Creates a new alignment with a horizontal layout. Optionally, vertical and cant layouts can be created as well. | util-dep |
| `create_as_offset_curve` | Creates a new IfcAlignment with an IfcOffsetCurveByDistances representation. |  |
| `create_as_polyline` | Creates a new IfcAlignment with an IfcPolyline representation. | util-dep |
| `create_by_pi_method` | Create an alignment using the PI layout method for both horizontal and vertical alignments. |  |
| `create_from_csv` | Creates an alignment from PI data stored in a CSV file. |  |
| `create_layout_segment` | Creates a new IfcAlignmentSegment using the IfcAlignmentParameterSegment design parameters. | numpy |
| `create_representation` | Creates the geometric representation of an alignment if it does not already exist. |  |
| `create_segment_representations` | Creates curve segment representations for the alignment for IFC CT 4.1.7.1.1.4. The alignment is expected to have representations | util-dep |
| `distance_along_from_station` | Given a station, returns the distance along the horizontal alignment. | util-dep |
| `get_alignment` | Returns the alignment that nests this layout |  |
| `get_alignment_layout_nest` | Searches for the IfcRelNest that contains IfcAlignmentHorizontal, IfcAlignmentVertical, or IfcAlignmentCant |  |
| `get_alignment_layouts` | Returns the layout alignments nested to this alignment |  |
| `get_alignment_segment_nest` | Searches for the IfcRelNest that contains IfcAlignmentSegment |  |
| `get_alignment_start_station` | Returns the start station of the alignment. The starting station is defined by the first nested IfcReferent. | util-dep |
| `get_axis_subcontext` | Returns the IfcGeometricRepresentationSubContext for Model, Axis, MODEL_VIEW. If one does not exist, it is created. | util-dep |
| `get_basis_curve` | Returns the basis curve for an alignment. This curve is the geometric representation that is used | util-dep |
| `get_cant_layout` | Returns the IfcAlignmentCant assocated with this alignment |  |
| `get_child_alignments` | Returns the aggregated child alignments to this alignment per CT 4.1.4.4.1.2 Alignment Layout - Reusing Horizontal Layout |  |
| `get_curve` | Returns the geometric representation curve for an alignment. | util-dep |
| `get_curve_segment` | Returns the IfcCurveSegment associated with the given alignment segment. If the curve segment does not exist, None is returned. |  |
| `get_curve_segment_transition_code` | Returns the IfcCurveSegment.Transition of segment based on a comparison of | numpy, geom-kernel |
| `get_horizontal_layout` | Returns the IfcAlignmentHorizontal assocated with this alignment |  |
| `get_layout` | Retrieves the layout to which an alignment segment belongs. |  |
| `get_layout_curve` | Returns the representation curve for the layout. This will be an IfcCompositeCurve, IfcGradientCurve, or IfcSegmentReferenceCurve |  |
| `get_layout_segments` | Returns the IfcAlignmentSegment nested to this alignment layout |  |
| `get_mapped_segments` | From an IfcAlignmentSegment, returns the related IfcCurveSegment. Typically the sequence has one entity, |  |
| `get_parent_alignment` | Returns the parent alignment. When multiple vertical alignments share a horizontal alignment |  |
| `get_stationing_nest` | Searches for the IfcRelNests that defines the alignment's stationing scheme. |  |
| `get_vertical_layout` | Returns the IfcAlignmentVertical assocated with this alignment |  |
| `has_zero_length_segment` | Returns true if the layout ends with a zero length segment. |  |
| `layout_horizontal_alignment_by_pi_method` | Appends IfcAlignmentHorizontalSegment to a previously defined IfcAlignmentHorizontal using the PI layout method. | util-dep |
| `layout_vertical_alignment_by_pi_method` | Appends IfcAlignmentVerticalSegment to a previously defined IfcAlignmentVertical using the PI layout method. |  |
| `name_segments` | Sets the IfcAlignmentSegment.Name attribute using a prefix and sequence number (e.g. "H1" for horizontal, "V1" for vertical, "C1" for cant) |  |
| `register_referent_name_callback` | Referents are created at the start of each horizontal, vertical, and cant segment by |  |
| `update_alignment_parameter_segment_tags` | Sets IfcAlignmentParameterSegment.StartTag (and, optionally, EndTag) for every segment |  |
| `update_end_point` | Updates the IfcGradientCurve.EndPoint and IfcSegmentedReferenceCurve.EndPoint. | numpy, util-dep |
| `update_fallback_position` | Updates the IfcLinearPlacement.CartesianPoint fallback position. | util-dep |
| `update_key_point_referents` | Creates IfcReferent key-point markers for every segment transition in an alignment layout. | util-dep |

### `ifcopenshell.api.attribute`

Generic direct-attribute editing on any IFC entity.

**1 public function** (1 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `edit_attributes` | Edit the attributes of a product | util-dep |

### `ifcopenshell.api.boundary`

IfcRelSpaceBoundary (2nd level) management for space boundary/energy analysis workflows.

**4 public functions** (4 total function defs incl. private helpers). Subpackage-level flags: numpy, util-dep.

| Function | Description | Flags |
|---|---|---|
| `assign_connection_geometry` | Create and assign a connection geometry to a space boundary relationship | numpy, util-dep |
| `copy_boundary` | Copies a space boundary | util-dep |
| `edit_attributes` | Modify the relationships of a space boundary relationship |  |
| `remove_boundary` | Removes a space boundary | util-dep |

### `ifcopenshell.api.classification`

IfcClassification / IfcClassificationReference systems (e.g. Uniclass, MasterFormat) and assigning them to products.

**6 public functions** (6 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_classification` | Adds a new classification system to the project | util-dep |
| `add_reference` | Adds a new classification reference and assigns it to the list of products | util-dep |
| `edit_classification` | Edits the attributes of an IfcClassification |  |
| `edit_reference` | Edits the attributes of an IfcClassificationReference |  |
| `remove_classification` | Removes an IfcClassification from the project and all references | util-dep |
| `remove_reference` | Removes a classification reference from the list of products | util-dep |

### `ifcopenshell.api.cogo`

Coordinate geometry survey points (IFC4X3 civil) -- bearings, survey point annotations.

**4 public functions** (4 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_survey_point` | Adds a single survey point to the model based on IFC Concept Template 4.1.7.1.2.5. | util-dep |
| `assign_survey_point` | Assigns a coordinate point to a survey point annotation |  |
| `bearing2dd` | Converts a quadrant bearing string to decimal degrees | util-dep |
| `edit_survey_point` | Edits the location of a previously defined survey point |  |

### `ifcopenshell.api.constraint`

IfcConstraint (metric benchmarks and objectives) assigned to products, e.g. performance/QA requirements.

**9 public functions** (9 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_metric` | Add a new metric benchmark |  |
| `add_metric_reference` | Adds a chain of references to a metric. The reference path is a string of the form "attribute.attribute.attribute" |  |
| `add_objective` | Add a new objective constraint |  |
| `assign_constraint` | Assigns a constraint to a list of products |  |
| `edit_metric` | Edit the attributes of a metric |  |
| `edit_objective` | Edit the attributes of a objective |  |
| `remove_constraint` | Remove a constraint (typically an objective) | util-dep |
| `remove_metric` | Remove a metric benchmark | util-dep |
| `unassign_constraint` | Unassigns a constraint from a list of products | util-dep |

### `ifcopenshell.api.context`

IfcGeometricRepresentationContext / SubContext management (Model/Plan, Body/Axis/Box, etc.) -- required scaffolding before any geometry can be added.

**3 public functions** (3 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_context` | Adds a new geometric representation context | util-dep |
| `edit_context` | Edits the attributes of an IfcGeometricRepresentationContext |  |
| `remove_context` | Removes an IfcGeometricRepresentationContext | util-dep |

### `ifcopenshell.api.control`

IfcRelAssignsToControl -- assigning planning controls/constraints (e.g. permits) to objects.

**2 public functions** (2 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `assign_control` | Assigns a planning control or constraint to a list of objects. |  |
| `unassign_control` | Unassigns a planning control or constraint to an object | util-dep |

### `ifcopenshell.api.cost`

IfcCostSchedule / IfcCostItem / IfcCostValue -- cost planning, cost item quantities tied parametrically to products, formula-based value calculation.

**20 public functions** (21 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_cost_item` | Add a new cost item |  |
| `add_cost_item_quantity` | Adds a new quantity associated with a cost item | util-dep |
| `add_cost_schedule` | Add a new cost schedule |  |
| `add_cost_value` | Adds a new value or subvalue to a cost item |  |
| `assign_cost_item_quantity` | Adds a cost item quantity that is parametrically connected to a product | util-dep |
| `assign_cost_value` | Assigns a cost value to a cost item from a schedule of rates |  |
| `calculate_cost_item_resource_value` | Calculates the total cost of all resources associated with a cost item | util-dep |
| `copy_cost_item` | Copies all cost items and related relationships | util-dep |
| `copy_cost_item_values` | Copies all cost values from one cost item to another | util-dep |
| `copy_cost_schedule` | Copy a cost schedule. | util-dep |
| `edit_cost_item` | Edits the attributes of an IfcCostItem |  |
| `edit_cost_item_quantity` | Edits the attributes of an IfcPhysicalQuantity |  |
| `edit_cost_schedule` | Edits the attributes of an IfcCostSchedule |  |
| `edit_cost_value` | Edits the attributes of an IfcCostValue | util-dep |
| `edit_cost_value_formula` | Sets a cost value based on a formula, similar to formulas in spreadsheets | util-dep |
| `remove_cost_item` | Removes a cost item | util-dep |
| `remove_cost_item_quantity` | Removes a quantity assigned to a cost item |  |
| `remove_cost_schedule` | Removes a cost schedule | util-dep |
| `remove_cost_value` | Removes a cost value |  |
| `unassign_cost_item_quantity` | Removes quantities of a cost item that are calculated on products |  |

### `ifcopenshell.api.document`

IfcDocumentInformation / IfcDocumentReference -- associating external documents/specs with products.

**8 public functions** (8 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_information` | Adds a new document information to the project |  |
| `add_reference` | Creates a new reference to a document to assign to products |  |
| `assign_document` | Assigns a document to a list of products | util-dep |
| `edit_information` | Edits the attributes of an IfcDocumentInformation |  |
| `edit_reference` | Edits the attributes of an IfcDocumentReference |  |
| `remove_information` | Removes a document information | util-dep |
| `remove_reference` | Remove a document reference | util-dep |
| `unassign_document` | Unassigns a document and an association to the list of products | util-dep |

### `ifcopenshell.api.drawing`

Drawing/annotation associations (mostly for Bonsai's 2D drawing generation feature) -- assigning annotation objects/text literals to products.

**3 public functions** (3 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `assign_product` | Associates a product and an object, typically for annotation |  |
| `edit_text_literal` | Edits the attributes of an IfcTextLiteral |  |
| `unassign_product` | Unassigns a product and an object (typically an annotation) | util-dep |

### `ifcopenshell.api.feature`

IfcFeatureElement (openings/voids, projections, surface features) -- voiding and filling relationships (e.g. door/window fills a wall opening).

**4 public functions** (4 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_feature` | Create a projecting, voiding, or surface feature in an element | util-dep |
| `add_filling` | Fill an opening with an element | util-dep |
| `remove_feature` | Permanently delete a feature element and its void or projection relationship. | util-dep |
| `remove_filling` | Remove a filling relationship | util-dep |

### `ifcopenshell.api.geometry` *(see Deep Dive, §3)*

Geometric representation authoring: shape representations, parametric element representations (wall/slab/door/window/railing), booleans, clipping, placement editing, wall connections. Second-largest and most complex subpackage; heavy numpy use, some direct ifcopenshell.geom kernel use.

**34 public functions** (50 total function defs incl. private helpers). Subpackage-level flags: geom-kernel, numpy, util-dep.

| Function | Description | Flags |
|---|---|---|
| `TERMINAL_TYPE` | Enum of railing handrail terminal-cap styles (used by add_railing_representation). |  |
| `RailingSupport` | Dataclass: pure-geometry description of one wall-mount support for a railing (used by add_railing_representation). |  |
| `WallMountedHandrailGeometry` | Dataclass: pure-geometry description of a wall-mounted handrail, decoupled from IFC entity creation (used by add_railing_representation). |  |
| `add_axis_representation` | Adds a new axis representation | util-dep |
| `add_boolean` | Adds a boolean operation to two or more representation items | util-dep |
| `add_door_representation` | Add a geometric representation for a door. | numpy, util-dep |
| `add_footprint_representation` | Adds a 2D footprint/plan representation (IfcShapeRepresentation, FootPrint type) for a product. | util-dep |
| `add_mesh_representation` | Add a mesh representation. | numpy, util-dep |
| `add_profile_representation` | Add profile representation. | geom-kernel, util-dep |
| `add_railing_representation` | Units are expected to be in IFC project units. | numpy, util-dep |
| `add_representation` | Add an IfcShapeRepresentation. | numpy, util-dep |
| `add_shape_aspect` | Adds a shape aspect to items that are part of a representation and product |  |
| `add_slab_representation` | Add a geometric representation for a slab. | util-dep |
| `add_topology_representation` | Adds an IfcTopologyRepresentation for a structural element | util-dep |
| `add_wall_representation` | Add a geometric representation for a wall. | util-dep |
| `add_window_representation` | units in usecase_settings expected to be in ifc project units | numpy, util-dep |
| `assign_representation` | Assigns an existing IfcShapeRepresentation to a product's IfcProductDefinitionShape. | util-dep |
| `clip_solid` | Clip a solid with a half-space plane, returning an IfcBooleanClippingResult. | util-dep |
| `clip_solid_bounded` | Clip a solid with a polygonally bounded half-space, returning an IfcBooleanClippingResult. | numpy, util-dep |
| `compute_wall_mounted_handrail_geometry` | Compute pure geometric data for a wall-mounted handrail. | numpy, util-dep |
| `connect_element` | Establishes an IfcRelConnectsElements relationship (e.g. wall-to-wall/column) with optional connection geometry. | util-dep |
| `connect_path` | Establishes an IfcRelConnectsPathElements relationship between two elements' axis/path curves. | util-dep |
| `connect_wall` | Connects two walls at a corner/junction and recalculates their body geometry to miter correctly. | numpy, util-dep |
| `copy_representation` | Copy a geometric representation from one element to another. | util-dep |
| `create_2pt_wall` | Create a wall between two points (p1 and p2). | numpy, util-dep |
| `disconnect_element` | Removes an IfcRelConnectsElements relationship between two elements. | util-dep |
| `disconnect_path` | There are two options to use this API method: | util-dep |
| `edit_object_placement` | Changes the object placement matrix of an element | numpy, util-dep |
| `map_representation` | Wraps a representation's items in an IfcMappedItem so it can be reused/shared via an IfcRepresentationMap. |  |
| `regenerate_wall_representation` | Regenerate the body representation of a wall taking into account connections. | numpy, util-dep |
| `remove_boolean` | Removes a boolean operation without deleting the operands | util-dep |
| `remove_representation` | Remove a representation. | util-dep |
| `unassign_representation` | Unassigns (removes) a representation from a product's IfcProductDefinitionShape. | util-dep |
| `validate_type` | Validates the RepresentationType of an IfcShapeRepresentation | util-dep |

### `ifcopenshell.api.georeference`

IfcMapConversion / IfcProjectedCRS / true north / WCS -- georeferencing a model to real-world coordinates.

**5 public functions** (5 total function defs incl. private helpers). Subpackage-level flags: numpy, util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_georeferencing` | Add empty georeferencing entities to a model | util-dep |
| `edit_georeferencing` | Edits the attributes of a map conversion, projected CRS, and true north | util-dep |
| `edit_true_north` | Edits the true north | util-dep |
| `edit_wcs` | Edits the WCS for all geometric contexts to a translation and rotation | numpy, util-dep |
| `remove_georeferencing` | Remove georeferencing data | util-dep |

### `ifcopenshell.api.grid`

IfcGrid / IfcGridAxis management, including generating axis curve geometry.

**3 public functions** (3 total function defs incl. private helpers). Subpackage-level flags: numpy, util-dep.

| Function | Description | Flags |
|---|---|---|
| `create_axis_curve` | Adds curve geometry to a grid axis to represent the axis extents | numpy, util-dep |
| `create_grid_axis` | Adds a new grid axis to a grid |  |
| `remove_grid_axis` | Removes a grid axis from a grid | util-dep |

### `ifcopenshell.api.group`

IfcGroup (arbitrary object grouping, e.g. zones, phases) assignment.

**6 public functions** (6 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_group` | Adds a new group |  |
| `assign_group` | Assigns products to a group |  |
| `edit_group` | Edits the attributes of an IfcGroup |  |
| `remove_group` | Removes a group | util-dep |
| `unassign_group` | Unassigns products from a group | util-dep |
| `update_group_products` | Sets a group products to be an explicit list of products | util-dep |

### `ifcopenshell.api.layer`

IfcPresentationLayerAssignment (CAD-style layers) for representation items.

**6 public functions** (6 total function defs incl. private helpers). Subpackage-level flags: none (pure data/graph manipulation).

| Function | Description | Flags |
|---|---|---|
| `add_layer` | Adds a new layer |  |
| `add_layer_with_style` | Adds a new layer with style |  |
| `assign_layer` | Assigns representation items or representations to a layer |  |
| `edit_layer` | Edits the attributes of an IfcPresentationLayerAssignment |  |
| `remove_layer` | Removes a layer |  |
| `unassign_layer` | Unassigns representation items or representations from a layer |  |

### `ifcopenshell.api.library`

IfcLibraryInformation / IfcLibraryReference -- external library (e.g. product catalog) references, and appending library assets into a project.

**8 public functions** (8 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_library` | Adds a new library to the project |  |
| `add_reference` | Adds a new reference to a library |  |
| `assign_reference` | Associates a list products with a library reference | util-dep |
| `edit_library` | Edits the attributes of an IfcLibraryInformation | util-dep |
| `edit_reference` | Edits the attributes of an IfcLibraryReference |  |
| `remove_library` | Removes a library | util-dep |
| `remove_reference` | Removes a library reference | util-dep |
| `unassign_reference` | Unassigns a product of products from a reference | util-dep |

### `ifcopenshell.api.material` *(see Deep Dive, §3)*

IfcMaterial / IfcMaterialConstituentSet / IfcMaterialLayerSet / IfcMaterialProfileSet -- material and composite-material assignment. Central, high-traffic subpackage with nontrivial internal object-graph management.

**25 public functions** (26 total function defs incl. private helpers). Subpackage-level flags: geom-kernel, util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_constituent` | Adds a new constituent to a constituent set |  |
| `add_layer` | Adds a new layer to a layer set | util-dep |
| `add_list_item` | Adds a new material in a list of materials |  |
| `add_material` | Adds a new material |  |
| `add_material_set` | Adds a new material set |  |
| `add_profile` | Add a new profile item to a profile set |  |
| `assign_material` | Assigns a material to the list of products | util-dep |
| `assign_profile` | Changes the profile curve of a material profile item in a profile set | util-dep |
| `copy_material` | Copies a material or material set | util-dep |
| `edit_assigned_material` | Edits the attributes of an IfcMaterial |  |
| `edit_constituent` | Edits the attributes of an IfcMaterialConstituent |  |
| `edit_layer` | Edits the attributes of an IfcMaterialLayer |  |
| `edit_layer_usage` | Edits the attributes of an IfcMaterialLayerSetUsage |  |
| `edit_material` | Edits the attributes of an IfcMaterial |  |
| `edit_profile` | Edits the attributes of an IfcMaterialProfile |  |
| `edit_profile_usage` | Edits the attributes of an IfcMaterialProfileSetUsage | geom-kernel, util-dep |
| `remove_constituent` | Removes a constituent from a constituent set | util-dep |
| `remove_layer` | Removes a layer from a layer set | util-dep |
| `remove_list_item` | Removes an item in an material list |  |
| `remove_material` | Removes a material | util-dep |
| `remove_material_set` | Removes a material set | util-dep |
| `remove_profile` | Removes a profile item from a profile set | util-dep |
| `reorder_set_item` | Reorders an item in a material set |  |
| `set_shape_aspect_constituents` | Assigns a material constituent set and sets styles based on shape aspects | util-dep |
| `unassign_material` | Removes any material relationship with the list of products | util-dep |

### `ifcopenshell.api.nest`

IfcRelNests generic parent/child nesting (distinct from aggregation) -- used for e.g. cost item hierarchies, alignment segment nesting.

**4 public functions** (4 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `assign_object` | Assigns objects as nested children to a parent host | util-dep |
| `change_nest` | Assigns a cost item to a new parent cost item | util-dep |
| `reorder_nesting` | Reorders an item in a nesting set |  |
| `unassign_object` | Unassigns related_objects from their nests. | util-dep |

### `ifcopenshell.api.owner`

IfcOwnerHistory / IfcPerson / IfcOrganization / IfcApplication / IfcActor -- authorship and ownership metadata, plus the settings module which is a monkey-patchable hook for the current user/application used by create_owner_history.

**24 public functions** (28 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_actor` | Adds a new actor |  |
| `add_address` | Add a new telecom or postal address to an organisation or person |  |
| `add_application` | Adds a new application |  |
| `add_organisation` | Adds a new organisation |  |
| `add_person` | Adds a new person |  |
| `add_person_and_organisation` | Adds a paired person and organisation |  |
| `add_role` | Adds and assigns a new role |  |
| `assign_actor` | Assigns an actor to an object |  |
| `create_owner_history` | Creates a new owner history indicating an element was added |  |
| `edit_actor` | Edits the attributes of an IfcActor |  |
| `edit_address` | Edits the attributes of an IfcAddress |  |
| `edit_application` | Edits the attributes of an IfcApplication |  |
| `edit_organisation` | Edits the attributes of an IfcOrganization |  |
| `edit_person` | Edits the attributes of an IfcPerson |  |
| `edit_role` | Edits the attributes of an IfcActorRole |  |
| `remove_actor` | Removes an actor | util-dep |
| `remove_address` | Removes an address |  |
| `remove_application` | Removes an application |  |
| `remove_organisation` | Remove an organisation |  |
| `remove_person` | Remove an person |  |
| `remove_person_and_organisation` | Removes a person and organisation |  |
| `remove_role` | Removes a role |  |
| `unassign_actor` | Unassigns an actor to an object | util-dep |
| `update_owner_history` | Updates the owner that is assigned to an object | util-dep |

### `ifcopenshell.api.profile`

IfcProfileDef (2D cross-section profiles: parameterized and arbitrary/polyline based) used by extruded solids, alignments, and material profile sets.

**6 public functions** (6 total function defs incl. private helpers). Subpackage-level flags: numpy, util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_arbitrary_profile` | Adds a new arbitrary polyline-based profile | numpy, util-dep |
| `add_arbitrary_profile_with_voids` | Adds a new arbitrary polyline-based profile with voids | numpy, util-dep |
| `add_parameterized_profile` | Adds a new parameterised profile |  |
| `copy_profile` | Copies a profile | util-dep |
| `edit_profile` | Edits the attributes of an IfcProfileDef |  |
| `remove_profile` | Removes a profile | util-dep |

### `ifcopenshell.api.project`

Project-level bootstrapping: create_file (blank IFC file), asset library appending, project declarations.

**4 public functions** (4 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `append_asset` | Appends an asset from a library into the active project | util-dep |
| `assign_declaration` | Declares the list of elements to the project | util-dep |
| `create_file` | Create a blank IFC model file object | util-dep |
| `unassign_declaration` | Unassigns a list of objects from a project or project library | util-dep |

### `ifcopenshell.api.pset` *(see Deep Dive, §3)*

Property sets and quantity sets (IfcPropertySet/IfcElementQuantity) -- the most common way to store arbitrary metadata on elements.

**8 public functions** (9 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_pset` | Adds a new property set to a product |  |
| `add_qto` | Adds a new quantity set to a product |  |
| `assign_pset` | Assign property set to provided elements. | util-dep |
| `edit_pset` | Edits a property set and its properties | util-dep |
| `edit_qto` | Edits a quantity set and its quantities | util-dep |
| `remove_pset` | Removes a property set from a product | util-dep |
| `unassign_pset` | Unassign property set from the provided elements. | util-dep |
| `unshare_pset` | Copy a shared pset as linked only to the provided elements. | util-dep |

### `ifcopenshell.api.pset_template`

IfcPropertySetTemplate / IfcSimplePropertyTemplate -- templates that define reusable pset schemas (used by pset.add_pset for typed properties).

**6 public functions** (6 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_prop_template` | Adds new property templates to a property set template | util-dep |
| `add_pset_template` | Adds a new property set template |  |
| `edit_prop_template` | Edits the attributes of an IfcSimplePropertyTemplate |  |
| `edit_pset_template` | Edits the attributes of an IfcPropertySetTemplate |  |
| `remove_prop_template` | Removes a property template | util-dep |
| `remove_pset_template` | Removes a property set template | util-dep |

### `ifcopenshell.api.resource`

IfcResource (construction resources: labor, crew, equipment, material) used in scheduling/costing, with usage/work calculation.

**12 public functions** (12 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_resource` | Add a new construction resource |  |
| `add_resource_quantity` | Adds a quantity to a resource | util-dep |
| `add_resource_time` | Adds the time that a resource is used for | util-dep |
| `assign_resource` | Assigns a resource to an object |  |
| `calculate_resource_usage` | Calculates the number of resources required to perform scheduled work on a task. | util-dep |
| `calculate_resource_work` | Calculates the work that a resource is used for | util-dep |
| `edit_resource` | Edits the attributes of an IfcResource |  |
| `edit_resource_quantity` | Edits the attributes of an IFC quantity |  |
| `edit_resource_time` | Edits the attributes of an IfcResourceTime | util-dep |
| `remove_resource` | Removes a resource and all relationships | util-dep |
| `remove_resource_quantity` | Removes the base quantity of a resource | util-dep |
| `unassign_resource` | Removes the relationship between a resource and object | util-dep |

### `ifcopenshell.api.root` *(see Deep Dive, §3)*

The most foundational subpackage: generic entity creation/class-reassignment/removal for any IFC "root" (globally-identifiable) entity. Used by nearly every other subpackage.

**4 public functions** (4 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `copy_class` | Copies a product | util-dep |
| `create_entity` | Create a new rooted product |  |
| `reassign_class` | Changes the class of a product | util-dep |
| `remove_product` | Removes a product | util-dep |

### `ifcopenshell.api.sequence`

IfcTask / IfcWorkSchedule / IfcWorkCalendar -- 4D scheduling: task sequencing, calendars, recurrence patterns, critical path calculation, baselines. Largest subpackage by function count after alignment.

**40 public functions** (40 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_date_time` | Add a new date time. | util-dep |
| `add_task` | Adds a new task |  |
| `add_task_time` | Adds a task time to a task |  |
| `add_time_period` | Adds a time period to a recurrence pattern | util-dep |
| `add_work_calendar` | Add a work calendar |  |
| `add_work_plan` | Add a new work plan |  |
| `add_work_schedule` | Add a new work schedule |  |
| `add_work_time` | Add either working times or holiday times to a calendar |  |
| `assign_lag_time` | Assign a lag time to a sequence relationship between tasks | util-dep |
| `assign_process` | Assigns an object as an input, control, or resource of a process |  |
| `assign_product` | Assigns a product to be produced as a result of a process |  |
| `assign_recurrence_pattern` | Define a time to recur at a particular interval | util-dep |
| `assign_sequence` | Assign a sequential relationship between tasks |  |
| `assign_work_plan` | Assigns a work schedule to a work plan |  |
| `calculate_task_duration` | Calculates the task duration based on resource usage | util-dep |
| `cascade_schedule` | Cascades start and end dates of tasks based on durations | util-dep |
| `copy_work_schedule` | Copy a work schedule. | util-dep |
| `create_baseline` | Creates a baseline for your Work Schedule | util-dep |
| `duplicate_task` | Duplicates a task in the project | util-dep |
| `edit_lag_time` | Edits the attributes of an IfcLagTime | util-dep |
| `edit_recurrence_pattern` | Edits the attributes of an IfcRecurrencePattern | util-dep |
| `edit_sequence` | Edits the attributes of an IfcRelSequence |  |
| `edit_task` | Edits the attributes of an IfcTask |  |
| `edit_task_time` | Edits the attributes of an IfcTaskTime | util-dep |
| `edit_work_calendar` | Edits the attributes of an IfcWorkCalendar |  |
| `edit_work_plan` | Edits the attributes of an IfcWorkPlan | util-dep |
| `edit_work_schedule` | Edits the attributes of an IfcWorkSchedule | util-dep |
| `edit_work_time` | Edits the attributes of an IfcWorkTime | util-dep |
| `recalculate_schedule` | Calculate the critical path and floats for a work schedule | util-dep |
| `remove_task` | Removes a task | util-dep |
| `remove_time_period` | Removes a time period |  |
| `remove_work_calendar` | Removes a work calendar | util-dep |
| `remove_work_plan` | Removes a work plan | util-dep |
| `remove_work_schedule` | Removes a work schedule | util-dep |
| `remove_work_time` | Removes a work time |  |
| `unassign_lag_time` | Removes any lag time in a sequence |  |
| `unassign_process` | Unassigns a process and object relationship | util-dep |
| `unassign_product` | Unassigns a product and object relationship | util-dep |
| `unassign_recurrence_pattern` | Unassigns a recurrence pattern |  |
| `unassign_sequence` | Removes a sequence relationship between tasks | util-dep |

### `ifcopenshell.api.spatial` *(see Deep Dive, §3)*

IfcRelContainedInSpatialStructure -- placing physical elements into spatial containers (site/building/storey/space).

**4 public functions** (4 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `assign_container` | Assigns products to be contained hierarchically in a space | util-dep |
| `dereference_structure` | Dereferences a list of products and space | util-dep |
| `reference_structure` | Denote that a list products is related to a list of spatial structures | util-dep |
| `unassign_container` | Unassigns a container from products. | util-dep |

### `ifcopenshell.api.structural`

Structural analysis model authoring (IfcStructuralAnalysisModel, loads, load cases/groups, boundary conditions, member connections) for FEA-style structural IFC.

**23 public functions** (23 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_structural_activity` | Adds a new structural activity |  |
| `add_structural_analysis_model` | Add a new structural analysis model |  |
| `add_structural_boundary_condition` | Adds a new structural boundary condition to a structural connection |  |
| `add_structural_load` | Adds a new structural load |  |
| `add_structural_load_case` | Adds a new load case, which is a collection of related load groups |  |
| `add_structural_load_group` | Adds a new load group, which is a collection of related loads |  |
| `add_structural_member_connection` | Relates a structural member and a structural connection |  |
| `assign_product` | Links an object to a product via IfcRelAssignsToProduct |  |
| `assign_structural_analysis_model` | Assigns a load or structural member to an analysis model |  |
| `assign_to_building` | Associates a structural analysis model with a building via IfcRelServicesBuildings | util-dep |
| `edit_structural_analysis_model` | Edits the attributes of an IfcStructuralAnalysisModel |  |
| `edit_structural_boundary_condition` | Edits the attributes of an IfcBoundaryCondition |  |
| `edit_structural_connection_cs` | Edits the coordinate system of a structural connection | util-dep |
| `edit_structural_item_axis` | Edits the coordinate system of a structural connection | util-dep |
| `edit_structural_load` | Edits the attributes of an IfcStructuralLoad |  |
| `edit_structural_load_case` | Edits the attributes of an IfcStructuralLoadCase |  |
| `remove_structural_analysis_model` | Removes an analysis model | util-dep |
| `remove_structural_boundary_condition` | Removes a condition from a connection, or an orphaned boundary condition |  |
| `remove_structural_connection_condition` | Removes a relationship between a connection and a condition | util-dep |
| `remove_structural_load` | Removes a structural load |  |
| `remove_structural_load_case` | Removes a structural load case | util-dep |
| `remove_structural_load_group` | Removes a structural load group | util-dep |
| `unassign_structural_analysis_model` | Removes a relationship between a structural element and the analysis model |  |

### `ifcopenshell.api.style`

IfcPresentationStyle / IfcSurfaceStyle -- visual styling (colors, textures) assigned to representation items or materials.

**13 public functions** (13 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_style` | Add a new presentation style |  |
| `add_surface_style` | Adds a new presentation item to a surface style |  |
| `add_surface_textures` | Add surface texture based on a Blender material definition or texture data. |  |
| `assign_item_style` | Assigns a style directly to a representation item |  |
| `assign_material_style` | Assigns a style to a material | util-dep |
| `assign_representation_styles` | Assigns a style directly to an object representation |  |
| `edit_presentation_style` | Edits the attributes of an IfcPresentationStyle |  |
| `edit_surface_style` | Edits the attributes of an IfcPresentationItem |  |
| `remove_style` | Removes a presentation style | util-dep |
| `remove_styled_representation` | Removes a styled representation |  |
| `remove_surface_style` | Removes a presentation item from a presentation style | util-dep |
| `unassign_material_style` | Unassigns a style to a material | util-dep |
| `unassign_representation_styles` | Unassigns styles directly assigned to an object representation |  |

### `ifcopenshell.api.system`

IfcSystem / IfcDistributionPort -- MEP-style distribution systems, ports, and port-to-port connections.

**12 public functions** (12 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_port` | Adds a new distribution port to an element |  |
| `add_system` | Add a new distribution system |  |
| `assign_flow_control` | Assigns to the flow element control element that either sense or control |  |
| `assign_port` | Assigns a port to an element | util-dep |
| `assign_system` | Assigns distribution elements to a system | util-dep |
| `connect_port` | Connects two ports together | util-dep |
| `disconnect_port` | Disconnects a port from any other port | util-dep |
| `edit_system` | Edits the attributes of an IfcSystem |  |
| `remove_system` | Removes a distribution system | util-dep |
| `unassign_flow_control` | Unassigns flow control element from the flow element. | util-dep |
| `unassign_port` | Unassigns a port to an element | util-dep |
| `unassign_system` | Unassigns list of products from a system |  |

### `ifcopenshell.api.type` *(see Deep Dive, §3)*

IfcTypeObject/IfcTypeProduct assignment -- linking occurrence objects to their defining type, and keeping occurrence representations mapped to the type's representation.

**3 public functions** (3 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `assign_type` | Assigns a type to occurrences of an object | util-dep |
| `map_type_representations` | Ensures that all occurrences has the same representation as the type |  |
| `unassign_type` | Unassigns a type from occurrences | util-dep |

### `ifcopenshell.api.unit`

IfcUnitAssignment -- SI/derived/conversion-based/monetary/context-dependent units and default project unit assignment.

**11 public functions** (11 total function defs incl. private helpers). Subpackage-level flags: util-dep.

| Function | Description | Flags |
|---|---|---|
| `add_context_dependent_unit` | Add a new arbitrary unit that can only be interpreted in a project specific context |  |
| `add_conversion_based_unit` | Add a conversion based unit | util-dep |
| `add_derived_unit` | Add a new Derive unit | util-dep |
| `add_monetary_unit` | Add a new currency |  |
| `add_si_unit` | Add a new SI unit | util-dep |
| `assign_unit` | Assign default project units | util-dep |
| `edit_derived_unit` | Edits the attributes of an IfcDerivedUnit |  |
| `edit_monetary_unit` | Edits the attributes of an IfcMonetaryUnit |  |
| `edit_named_unit` | Edits the attributes of an IfcNamedUnit |  |
| `remove_unit` | Remove a unit | util-dep |
| `unassign_unit` | Unassigns units as default units for the project |  |
## 3. Deep dive: `root`, `geometry`, `spatial`, `aggregate`, `material`, `pset`, `type`

These seven subpackages are called out because most other subpackages *depend on them* (they sit near the
root of the dependency graph — pun intended) and/or because their implementations do real "graph surgery"
(multi-step traversal and rewriting of the IFC object graph, not just single-relationship CRUD), which is
where a naive 1:1 port is most likely to hide bugs.

### `root` (4 functions, ~790 combined LOC — small function count, large individual functions)

The true foundation: almost every other subpackage's `add_*`/`create_*` function calls
`ifcopenshell.api.root.create_entity` internally (via `ifcopenshell.api.owner.create_owner_history` too, for
`IfcOwnerHistory`).

- `create_entity` (140 LOC): generates a GlobalId (`ifcopenshell.guid`), calls `owner.create_owner_history`,
  and — this is the tricky part — resolves **predefined type edge cases**: if the given `predefined_type`
  isn't a built-in enum value for the class, it must be stored as `"USERDEFINED"` plus the actual string
  moved to `ObjectType` (occurrences) or `ElementType`/`ProcessType` (types) depending on IFC class family,
  and some classes (`IfcDoorStyle`, `IfcWindowStyle`, etc.) need multiple defaulted mandatory attributes
  (`ParameterTakesPrecedence`, `Sizeable`, `OperationType`, `ConstructionType` all defaulted to
  `"NOTDEFINED"`/`False`) set at creation to keep the model schema-valid. This is schema-introspection-driven
  branching, not a simple field-copy — porting it well requires the same predefined-type/attribute-family
  lookup tables the Python version consults (via `ifcopenshell.util.schema`).
- `reassign_class` (236 LOC): swaps an entity's IFC class in place while preserving all relationships/attrs
  that carry over; cascades to the paired occurrence/type class when reassigning a type or an occurrence
  (IFC4+; IFC2X3 has narrower support because the class can't always be unambiguously derived).
- `remove_product` (223 LOC): a "smart delete" — removes an element plus every inverse relationship that
  would otherwise dangle: representations, placements, psets/qtos, material/type/containment/aggregation/
  nesting relationships, distribution ports, etc., without deleting the *shared* things those relationships
  point to (materials, types) unless nothing else references them.
- `copy_class` (193 LOC): deep-ish clone — duplicates placement, psets/qtos, nested ports, aggregate/
  containment membership, type assignment, voids, and material (including parametric material-set usages).

**Porting takeaway:** conceptually simple API surface (4 functions) but each one is a mini graph-traversal
algorithm over IFC's inverse-relationship web; a TS port needs the equivalent of `ifcopenshell.util.element`
(inverse lookup helpers) working correctly and comprehensively first, or these four functions become the
buggiest part of the whole port.

### `geometry` (30 files / 34 public functions — largest non-scheduling subpackage)

This is the geometry-*authoring* half (as opposed to `ifcopenshell.geom`, the geometry-*processing*/
tessellation kernel, which is a separate compiled C++ component not part of this Python package at all).
Three tiers of complexity here:

1. **Thin relationship/attribute wrappers** (low complexity): `assign_representation`,
   `unassign_representation`, `add_shape_aspect`, `remove_representation`, `remove_boolean`,
   `validate_type`, `map_representation` — CRUD on `IfcShapeRepresentation`/`IfcProductDefinitionShape`
   links, no coordinate math.
2. **Parametric shape builders** (medium-high complexity, numpy-heavy): `add_wall_representation`,
   `add_slab_representation`, `add_door_representation`, `add_window_representation`,
   `add_railing_representation`, `create_2pt_wall`, `regenerate_wall_representation`,
   `edit_object_placement`. These synthesize IFC geometry primitives (extruded solids, profile curves,
   Boolean-clipped solids) from high-level parameters (thickness, height, offsets) using 4x4 matrix math —
   `add_railing_representation.py` alone has ~14 private helper functions for computing fillet arcs, wall/
   floor/end-post caps, and support geometry along a path, all *pure geometry math* (no IFC calls) feeding
   into IFC entity construction. This is squarely "reimplement CAD-ish parametric geometry logic in TS",
   not "translate a database mutation" — it is the most CPU/algorithm-heavy code in the whole `api` package
   that is *not* delegated to the compiled kernel.
3. **Kernel-touching**: `add_profile_representation` imports `ifcopenshell.geom` directly (uses the kernel
   to validate/process a profile curve) — this one **cannot** be ported to pure TS without either a WASM
   build of the geometry kernel or a reimplementation of whatever specific kernel call it makes.

Also: `connect_wall`/`connect_element`/`connect_path`/`disconnect_*` manage `IfcRelConnects*`
relationships *and* trigger re-derivation of miter/junction geometry (`regenerate_wall_representation`),
i.e. geometry edits with relationship side effects — another multi-step case.

### `spatial` (4 functions, all relationship CRUD)

Simplest of the seven: `assign_container`/`unassign_container` manage
`IfcRelContainedInSpatialStructure` (one element has exactly one containing spatial structure — assigning
a new one silently removes/replaces the old one, which is the one piece of "surgery" here — check for and
remove any existing containment before creating the new one), `reference_structure`/`dereference_structure`
manage the weaker, multi-valued `IfcRelReferencedInSpatialStructure`. No geometry, no numpy. Good porting
target.

### `aggregate` (2 functions, smallest subpackage)

`assign_object` (160 LOC despite being "just" IfcRelAggregates): handles reassigning an object that's
already aggregated elsewhere (detach from old parent first), and validates against creating a cycle up
the spatial-decomposition tree isn't itself checked in code but *ordering* relative to spatial containment
is — the docstring notes aggregation and containment are mutually exclusive for the same object, so this
function's a good example of "simple relationship, non-trivial invariant". `unassign_object` (75 LOC) is
straightforward removal.

### `material` (25 files / 25 public functions)

Second-most relationally tangled subpackage after `root`. IFC has *four* different material relationship
shapes fanning out from a single `assign_material` entry point (single `IfcMaterial`,
`IfcMaterialConstituentSet`, `IfcMaterialLayerSet`, `IfcMaterialProfileSet`, each with their own
Set/SetUsage/Layer/Profile/Constituent sub-entities and their own add/edit/remove functions) — i.e. the
subpackage is really 4 parallel mini-APIs unified by one `assign_material`/`unassign_material` pair.
`copy_material` (with a private `_copy_material_with_inverses` helper) has to deep-clone whichever of the
four shapes is in use, including their inverse relationships. `edit_profile_usage` is the other subpackage
function that touches `ifcopenshell.geom` directly (profile-based material usage needs kernel validation).
`set_shape_aspect_constituents` cross-cuts into `style` (assigns styles based on shape aspects) — an example
of a function that's logically "material" but reaches into another subsystem.

### `pset` (8 files / 8 public functions)

Deceptively large individual files: `edit_pset.py` is the single biggest file in the entire `api` package
at 490 LOC, `edit_qto.py` is 244 LOC. The complexity isn't relationship graph traversal (it's mostly a leaf:
`IfcPropertySet`/`IfcElementQuantity` attached via `IfcRelDefinesByProperties`) — it's **IFC's very
elaborate property/quantity type system**: properties can be `IfcPropertySingleValue`,
`IfcPropertyEnumeratedValue`, `IfcPropertyListValue`, `IfcPropertyBoundedValue`,
`IfcPropertyTableValue`, `IfcPropertyReferenceValue`, or nested `IfcComplexProperty`; quantities can be
Length/Area/Volume/Count/Weight/Time and nested `IfcPhysicalComplexQuantity`; each `IfcValue` subtype
(`IfcText`, `IfcReal`, `IfcBoolean`, `IfcLabel`, ~15 more) needs correct STEP-type wrapping, and `edit_qto`
has an `infer_property_type` helper to guess the right quantity/value class from a raw Python value. This is
a wide, deep switch/dispatch over the IFC value-type hierarchy — mechanical to port but large in surface
area, and a prime candidate for TS discriminated unions / a codegen'd value-type table (which
`ifcopenshell-python`'s own express-schema-driven codegen may already provide a source of truth for).
`unshare_pset` is notable: psets can be *shared* by reference across multiple elements (a modeling-tool
optimization to save file size); this function detects sharing and clones a pset so an edit doesn't
silently affect other elements.

### `type` (3 functions)

- `assign_type`: links an occurrence (`IfcElement`, 319 LOC — largest file of this group) to its
  `IfcTypeObject`, and per docstring propagates the type's property sets/representation mapping.
- `map_type_representations`: ensures *all* occurrences of a type share the same (mapped) representation as
  the type — a fan-out operation over every occurrence, not a single-entity edit.
- `unassign_type`: detaches, straightforward.

**Porting takeaway across all seven:** `root`, `spatial`, `aggregate`, `type.unassign_type` are good early
targets (small, well-scoped, few external deps beyond `ifcopenshell.util.element`). `pset` is large but
*mechanically* large (type-table breadth, not algorithmic depth) — good for codegen-assisted porting.
`material` and `geometry`'s parametric builders are where real design decisions are needed: `material` for
modeling the four-shapes-one-API relationship graph faithfully in TS types, and `geometry`'s shape-builder
functions for whether to hand-port the numpy-based CAD math to TS/`gl-matrix` (feasible, since none of it
touches the compiled kernel except `add_profile_representation`) or defer them until a WASM geometry kernel
strategy is settled.
## 4. Dependency and porting-difficulty flags, in detail

### 4.1 `ifcopenshell.util.*` dependency

31 of 34 subpackages import `ifcopenshell.util.*` somewhere (only `attribute` — trivially small — plus a
couple of the very smallest CRUD subpackages have zero API files that need it, though even those often pull
it in transitively through `root`/`owner`). The most-imported util modules across the whole `api` tree are:

- `ifcopenshell.util.element` — inverse-relationship traversal (`get_container`, `get_psets`,
  `get_referenced_elements`, `remove_deep2`-style cleanup) — used constantly by `root`, `spatial`,
  `aggregate`, `material`, `type`, `feature`, `nest`.
- `ifcopenshell.util.schema` — IFC-version-aware predefined-type/attribute lookups (used heavily by `root`).
- `ifcopenshell.util.unit`, `ifcopenshell.util.placement` — unit conversion and 4x4 placement matrix math
  (used by `geometry`, `georeference`, `grid`, `alignment`).
- `ifcopenshell.util.date` — ISO8601 handling for `sequence` (task/calendar dates), `cost`.
- `ifcopenshell.util.classification`, `.util.doc`, `.util.cost`, `.util.resource` — narrower, subpackage-
  paired read helpers.

**Implication for porting sequencing:** `ifcopenshell.util` (the other researcher's subject) is not a
downstream/optional dependency of `ifcopenshell.api` — it's a prerequisite. At minimum,
`util.element`, `util.schema`, `util.unit`, and `util.placement` need working TS equivalents before `api.root`,
`api.geometry`, or `api.material` can be ported meaningfully, since those `api` functions call straight into
them for the graph-traversal and unit-conversion logic rather than reimplementing it inline.

### 4.2 `numpy` dependency (9 subpackages: `alignment`, `boundary`, `georeference`, `geometry`, `grid`,
`profile`, `alignment/util.py`, plus scattered use for placement/direction-vector math elsewhere)

All observed usage is 4x4 homogeneous-transform matrices, 3D point/vector arithmetic, and polyline point
arrays — nothing that depends on numpy's numerical-computing internals (no FFT, no linear solvers beyond
basic matrix multiply/inverse, no broadcasting tricks that don't have a trivial small-matrix TS equivalent).
This is **not a porting blocker** — a small TS vector/matrix library (`gl-matrix`, or a bespoke ~200-line
mat4/vec3 module) covers it. Flagged only so the design doc doesn't over-worry about "numpy" as a red flag;
it's a much smaller problem than the geometry-kernel dependency below.

### 4.3 Geometry kernel (`ifcopenshell.geom`) dependency — the real hard blocker

Only **3 files** in the entire `api` package import `ifcopenshell.geom` directly:

- `alignment/util.py`, `alignment/_add_segment_to_curve.py`, `alignment/_get_segment_endpoint.py` — used to
  evaluate/tessellate alignment curve segments (arcs, clothoids, parabolas) for representation generation
  and point-on-curve queries.
- `geometry/add_profile_representation.py` — validates/processes an `IfcProfileDef` through the kernel
  before wrapping it in a representation.
- `material/edit_profile_usage.py` — same, for profile-based material set usage.

`ifcopenshell.geom` itself is a thin Python binding over the compiled C++ geometry-processing engine
(tessellation, boolean ops, curve evaluation — built on Open Cascade under the hood, though `api/` never
touches OCC directly, only through this one binding layer). **No file in `api/` imports `shapely` or `OCC`
directly** — every geometry-kernel touchpoint funnels through `ifcopenshell.geom`.

Practical read for the TS port: the *vast majority* of `ifcopenshell.api` (369 of ~372 public functions,
i.e. everything except the handful above) needs **no compiled geometry kernel at all** — it's pure IFC
STEP-graph construction/mutation (create entities, set attributes, wire up relationships). Only alignment's
curve evaluation and two profile-validation call sites need either (a) a WASM build of the geometry kernel,
(b) a from-scratch TS reimplementation of the specific curve math involved (arcs/clothoids/parabolas for
alignment; profile validation is more just "does this profile self-intersect" style checking), or (c) being
deferred/stubbed until a broader "does IfcOpenShell-TS get a WASM geometry kernel" decision is made
elsewhere in the project. This is a small, well-isolated blocker, not a systemic one.

### 4.4 Full per-subpackage flag summary

| Subpackage | util-dep | numpy | geom-kernel | Notes |
|---|---|---|---|---|
| aggregate | yes | | | |
| alignment | yes | yes | **yes** | Largest subpackage; kernel dep in 3 files (curve eval) |
| attribute | yes | | | Trivial |
| boundary | yes | yes | | numpy for connection geometry points |
| classification | yes | | | |
| cogo | yes | | | |
| constraint | yes | | | |
| context | yes | | | |
| control | yes | | | |
| cost | yes | | | |
| document | yes | | | |
| drawing | yes | | | |
| feature | yes | | | |
| geometry | yes | yes | **yes** | Kernel dep in 1 file (`add_profile_representation`) |
| georeference | yes | yes | | numpy for WCS transform |
| grid | yes | yes | | numpy for axis curve geometry |
| group | yes | | | |
| layer | | | | No util-dep detected (self-contained) |
| library | yes | | | |
| material | yes | | **yes** | Kernel dep in 1 file (`edit_profile_usage`) |
| nest | yes | | | |
| owner | yes | | | |
| profile | yes | yes | | numpy for polyline profiles |
| project | yes | | | |
| pset | yes | | | Large files, wide IFC value-type surface |
| pset_template | yes | | | |
| resource | yes | | | |
| root | yes | | | Foundational; heavy `util.schema`/`util.element` use |
| sequence | yes | | | Largest subpackage by function count after alignment |
| spatial | yes | | | |
| structural | yes | | | |
| style | yes | | | |
| system | yes | | | |
| type | yes | | | |
| unit | yes | | | |
## 5. Test conventions (`test/api/`)

### 5.1 Layout

`test/api/` mirrors `ifcopenshell/api/` exactly: one directory per subpackage (34 directories, e.g.
`test/api/root/`, `test/api/pset/`, `test/api/geometry/`), each with `__init__.py` plus one
`test_<function_name>.py` file per API function (231 test files total, i.e. close to one test file per
public API function — not exhaustive 1:1 but close). Framework is **pytest**, run from
`src/ifcopenshell-python` (config in `pyproject.toml`).

### 5.2 Fixture pattern (`test/bootstrap.py`, 84 LOC)

Three small mixin classes, each an autouse pytest fixture that builds a **fresh blank IFC file** per test
via the real API (dogfooding `ifcopenshell.api.project.create_file`, not a hand-built fixture file):

```python
class IFC4:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.file: ifcopenshell.file = ifcopenshell.api.project.create_file()
        ifcopenshell.api.owner.settings.get_user = lambda ifc: (ifc.by_type("IfcPersonAndOrganization") or [None])[0]
        ifcopenshell.api.owner.settings.get_application = lambda ifc: (ifc.by_type("IfcApplication") or [None])[0]
        ifcopenshell.api.pre_listeners = {}
        ifcopenshell.api.post_listeners = {}
```

`IFC2X3` is the same shape but its `get_user`/`get_application` overrides *create* an
`IfcPersonAndOrganization`/`IfcApplication` on first call (since IFC2X3 raises if none exists — see §1.6),
using `ifc.create_entity(...)` directly rather than the API. `IFC4X3` exists for the newer schema (used
heavily by `alignment`/`cogo`/`structural` tests). Every listener dict is reset each test to avoid
cross-test leakage from the pre/post hook system (§1.4).

Test classes subclass one (sometimes two, for cross-schema parametrization) of these mixins:

```python
class TestCreateEntity(test.bootstrap.IFC4):
    def test_creating_a_simple_entity_with_automatic_global_id(self):
        wall = ifcopenshell.api.root.create_entity(self.file, ifc_class="IfcRailing", ...)
        assert wall.is_a() == "IfcRailing"
        ...

class TestCreateEntityIFC2X3(test.bootstrap.IFC2X3, TestCreateEntity):
    pass  # re-runs every test above, but against an IFC2X3 file
```

This "subclass with a second mixin to re-run the same test suite against a different schema version" pattern
is used pervasively — one canonical example file
(`test/api/root/test_create_entity.py`) both demonstrates the mixin and shows per-schema `if
self.file.schema != "IFC2X3":` branches for behavior that only exists in IFC4+.

### 5.3 Assertion style

- Directly asserts on live `ifcopenshell.entity_instance` attributes returned by the API call:
  `assert wall.is_a() == "IfcRailing"`, `assert element.PredefinedType == "USERDEFINED"`.
- Cross-checks IFC-graph side effects via `ifcopenshell.util.*` read helpers rather than re-deriving them
  manually, e.g. `test_add_pset.py`:
  `assert "Pset_WallCommon" in ifcopenshell.util.element.get_psets(element)` — i.e. api tests lean on util
  functions being correct, reinforcing that util must be ported early/in parallel (§4.1).
- No mocking framework: tests call real API functions against a real (in-memory) `ifcopenshell.file`, then
  assert on the resulting entity graph — essentially small integration tests rather than isolated unit
  tests, since IFC mutation is inherently graph-shaped and hard to test in isolation from the file object.
- Geometry-heavy tests (`test/api/geometry/test_edit_object_placement.py`) construct `numpy.array` 4x4
  matrices directly and assert with `numpy.array_equal(...)`, further confirming numpy's role is just
  matrix math, easily mirrored with array-equality assertions in a TS test (e.g. against a `Float32Array`/
  `number[16]` or a small matrix type).
- Multiple small `test_*` methods per file, one behavior/edge-case each (e.g. `test_add_pset.py` has 4
  methods: pset on a product, on a type object, on a material, on a profile — each a distinct branch in
  `add_pset`'s target-class handling).

### 5.4 Implication for an IfcOpenShell-TS test suite

A natural mirror in TS: a `createTestFile(schema: "IFC4"|"IFC2X3"|"IFC4X3")` helper equivalent to the
bootstrap mixins (built on the ported `project.createFile`, keeping the "dogfood the real API to build test
fixtures" property), one test file per ported function under a matching directory tree
(`test/api/<subpackage>/<function>.test.ts`), and integration-style assertions directly against the
resulting entity graph plus ported `util.*` read helpers — using something like Vitest's
`describe.each`/parametrized suites to reproduce the "same suite, multiple schema versions" subclassing
trick without needing actual class inheritance.
## 6. Porting priority suggestion

This is a rough tiering to inform (not decide) the IfcOpenShell-TS roadmap, based on: (a) how many other
subpackages/typical authoring workflows depend on it, (b) implementation complexity/graph-surgery depth
(§3), and (c) dependency flags (§4). Function counts are public-API counts from §2.

### Tier 0 — Prerequisite, before any `api` porting starts
Not part of `ifcopenshell.api` itself, but everything below assumes it exists:
- `ifcopenshell.util.element`, `.util.schema`, `.util.unit`, `.util.placement` (from the sibling
  `ifcopenshell.util` research pass) — nearly every Tier 1 function calls into these directly.
- The core `ifcopenshell.file`/`entity_instance` graph model itself (STEP-instance creation, attribute
  get/set, inverse-relationship indexing) — outside the scope of this report but the true foundation.

### Tier 1 — Foundational, low-complexity, high-value (port first)
Small function counts, mostly single-relationship CRUD, no numpy/geom-kernel, everything else depends on
them:
- **`root`** (4 fn) — needed before anything else can create entities. Complex *logic* despite few
  functions (§3), so budget real time here even though it's "first".
- **`project`** (4 fn) — `create_file` is the literal entry point of every workflow, including the test
  bootstrap pattern (§5.2).
- **`spatial`** (4 fn), **`aggregate`** (2 fn) — the two relationships every authoring workflow needs
  immediately after `root.create_entity` (build the spatial tree, place elements in it). Simple CRUD.
- **`owner`** (24 fn) — needed by `root.create_entity` (owner history) on every single entity creation;
  the `settings` monkeypatch hook (§1.6) needs an early TS-idiomatic design decision since it's on the
  critical path of *every* mutation.
- **`unit`** (11 fn), **`context`** (3 fn) — required scaffolding before geometry/quantities make sense;
  small and self-contained.
- **`pset`** (8 fn) — extremely high real-world usage frequency (the #1 way IFC data is authored/read in
  practice) despite large individual files; mechanical breadth (IFC value-type table) rather than
  algorithmic depth, and a good candidate for a generated/table-driven port rather than hand-translation.
- **`type`** (3 fn), **`classification`** (6 fn), **`group`** (6 fn), **`layer`** (6 fn),
  **`document`** (8 fn), **`library`** (8 fn), **`constraint`** (9 fn) — all simple
  assign/edit/unassign relationship CRUD around a single IFC relationship class, no geometry, no numpy.

### Tier 2 — Central but structurally tangled (port with care, budget extra design time)
Not individually huge, but the relationship graph they manage is genuinely more complex than plain CRUD:
- **`material`** (25 fn) — 4 parallel sub-shapes (material/constituent-set/layer-set/profile-set) behind
  one `assign_material` (§3); get the TS type modeling right here or every consumer downstream inherits the
  mess.
- **`feature`** (4 fn), **`nest`** (4 fn) — small function counts but nontrivial relationship semantics
  (voiding/filling; generic nesting reused by `cost`/`alignment`).
- **`style`** (13 fn), **`system`** (12 fn), **`resource`** (12 fn), **`profile`** (6 fn) — moderate size,
  domain-specific but not algorithmically hard (profile math is 2D polyline/parametric, no kernel dep
  except via `material.edit_profile_usage`).
- **`cost`** (20 fn) — cost-value formula evaluation (`edit_cost_value_formula`) is the one non-trivial
  piece; rest is schedule/item CRUD.

### Tier 3 — Domain-specific, high value but self-contained (port opportunistically / demand-driven)
Full, well-isolated subdomains that a given IfcOpenShell-TS consumer may or may not need at all:
- **`sequence`** (40 fn) — 4D scheduling (tasks/calendars/critical-path). Large but no geometry-kernel or
  numpy dependency; mechanically portable, just big. Good candidate to defer until a consumer actually
  needs 4D scheduling, since it's orthogonal to core BIM-authoring workflows.
- **`structural`** (23 fn) — FEA-model authoring, similarly large-but-orthogonal and audience-specific
  (structural engineers, not general BIM authoring).
- **`georeference`** (5 fn), **`grid`** (3 fn), **`boundary`** (4 fn), **`drawing`** (3 fn),
  **`control`** (2 fn), **`pset_template`** (6 fn) — small, self-contained, low urgency.

### Tier 4 — Geometry-heavy or geometry-kernel-blocked (defer until WASM kernel / geometry-math strategy
is settled)
- **`geometry`** (34 fn) — most functions are portable now (relationship CRUD, §3 tier 1), but the
  parametric shape-builder functions (`add_wall_representation`, `add_door_representation`,
  `add_window_representation`, `add_railing_representation`, `create_2pt_wall`,
  `regenerate_wall_representation`) are real CAD-math ports (numpy → TS vector/matrix math — feasible but
  substantial), and `add_profile_representation` specifically needs the geometry kernel. **Recommend
  splitting this subpackage's port into "relationship CRUD now" vs. "parametric builders later" rather than
  treating it as one atomic unit.**
- **`alignment`** (42 fn, ~100 incl. private helpers) — by far the largest and most specialized
  subpackage; road/rail civil-infrastructure authoring is a narrow (if important) audience, it has the
  deepest geometry-kernel dependency (curve/clothoid evaluation) of any subpackage, and the most private
  helper functions relative to public surface. Strong candidate for last, or for a separate
  `@ifcopenshell-ts/alignment` package entirely so it doesn't bloat the core bundle for the majority of
  consumers who never touch civil infrastructure.
- **`cogo`** (4 fn) — small, but exists only to support `alignment` workflows; naturally rides along
  with alignment's tier.

### Cross-cutting recommendation
Regardless of subpackage tiering, `ifcopenshell.api.owner.settings`'s monkeypatch hook (§1.6) and the
pre/post-listener system (§1.3–1.4) are both small, foundational, and touched by literally every mutation —
worth nailing down the TS-idiomatic equivalents (an injectable settings object; a typed
`Map<string, Set<Listener>>`) in Tier 0/1, not as an afterthought once dozens of subpackages already assume
a particular shape.
