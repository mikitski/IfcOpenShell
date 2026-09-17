// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.geometry` (src/ifcopenshell-python's
// `ifcopenshell/api/geometry/` package). `api.geometry` is now FUNCTIONALLY COMPLETE for this
// port's scope: 29 of ~29 real files landed -- every real, portable file in this module has been
// ported. The ONE remaining real file, `add_representation.py`, imports `bpy`/`bmesh`/
// `mathutils` (Blender's own Python API) directly -- it is PERMANENTLY, GENUINELY out of scope
// for this Node-native-addon TS port (not a gap to track in `TODOS.md`; there is no TS/Node
// equivalent of a live Blender mesh-editing session to port it onto). 17 of its ~29 real files
// were ported first:
// `unassign_representation`/`remove_representation`
// (an earlier `api.context` chunk, minimal direct dependencies of
// `api.context.removeContext`'s top-level-context branch -- see
// `./unassignRepresentation.ts`'s own header comment), `assign_representation`/
// `map_representation` (a later chunk, see `./assignRepresentation.ts`'s own header
// comment for why these 2 were prioritized ahead of the rest of the module: they
// retroactively unblock real, disclosed throws in `api.type.mapTypeRepresentations` and
// `api.root.reassignClass`), `edit_object_placement` (see `./editObjectPlacement.ts`'s
// own header comment) -- this project's single most-cited disclosed blocker,
// retroactively unblocking real throws in `api.spatial.assignContainer`/
// `api.aggregate.assignObject`/`api.root.reassignClass`/`api.root.copyClass`/
// `api.system.assignPort` (see each file's own header comment and `TODOS.md` for
// exactly how far each was unblocked), a later chunk (8 files, ~499 lines, all
// verified to have no genuinely unported dependency): `add_footprint_representation`,
// `disconnect_element`/`connect_element` (an `IfcRelConnectsElements` pair,
// exact-class-matched, NOT subtype-inclusive -- see `./disconnectElement.ts`'s own
// header comment), `remove_boolean`, `connect_wall` (the one file in that chunk with
// real geometry math -- `numpy`/`util.shape_builder` imports verified fully portable
// via already-landed `gl-matrix`/`util/placement.ts`/`util/shapeBuilder.ts` helpers,
// see `./connectWall.ts`'s own header comment for the full matrix-math verification),
// `disconnect_path`/`connect_path` (an `IfcRelConnectsPathElements` pair,
// subtype-inclusive `isA(...)` checks -- a real, deliberate CONTRAST to
// `connect_element`/`disconnect_element`'s own exact-class matching, see
// `./disconnectPath.ts`'s own header comment), and `copy_representation` (calls this
// same module's own `unassignRepresentation`/`removeRepresentation`/
// `assignRepresentation`, all already landed) -- and, landed in THIS chunk (4 files,
// ~398 lines, ported in dependency order): `add_boolean` (only imports
// `ifcopenshell.util.element`, already landed -- see `./addBoolean.ts`'s own header
// comment for the 2 real, disclosed, verbatim-preserved Python-source quirks),
// `add_shape_aspect` (imports `ifcopenshell` only -- see `./addShapeAspect.ts`'s own
// header comment for its own `IfcShapeAspect` schema-shape verification and 3
// preserved quirks), `add_topology_representation` (imports `ifcopenshell` only --
// see `./addTopologyRepresentation.ts`'s own header comment), and `validate_type`
// (imports this same module's own `add_boolean`, landed earlier in this same chunk
// specifically so this file has no blocker at all, plus already-landed
// `util.representation.guessType` -- see `./validateType.ts`'s own header comment for
// a real, PRE-EXISTING, schema-agnostic blocker it inherits from `guessType` itself:
// any representation containing a bare, non-boolean `IfcCurve`/`IfcSurface` item
// throws on `.get("Dim")`, pinned by 2 dedicated regression tests rather than fixed or
// skipped), and (landed in a later chunk, 3 files) `clip_solid`/`clip_solid_bounded`
// (thin wrappers around the new `util/data.ts`'s `Clipping` class -- see
// `./clipSolid.ts`'s/`./clipSolidBounded.ts`'s own header comments for their shared,
// already-disclosed `BBIM_Boolean`-pset primitive-layer blocker) and
// `add_axis_representation` (imports only already-landed `util.unit`, no blocker --
// see `./addAxisRepresentation.ts`'s own header comment), and (landed in THIS chunk,
// alongside `util/data.ts`'s own `Clipping`) `add_wall_representation`/
// `add_slab_representation` (2 files, ~307 lines -- both only import already-landed
// `util.element`/`util.unit` plus this same chunk's own `util.data.Clipping`, fully
// self-contained, no `ShapeBuilder`/geometry-kernel dependency at all; see
// `./addWallRepresentation.ts`'s/`./addSlabRepresentation.ts`'s own header comments for
// their shared `apply_clippings`-LIFO-consumption pattern and 2 real, disclosed
// `clippings`/`booleans` ALIASING divergences between the two files), and (landed in a
// later chunk, 2 files, ~226 lines): `create_2pt_wall` (a plain function, no internal
// `Usecase` class -- wraps this same module's own `addWallRepresentation`/
// `editObjectPlacement`, see `./create2ptWall.ts`'s own header comment for a real,
// disclosed unit-mixing bug in its direction-vector math, preserved verbatim) and
// `add_mesh_representation` (the first `api.geometry` file that genuinely needs the FULL
// `util/shapeBuilder.ts` `ShapeBuilder` CLASS, not a small per-file duplicate -- its
// `facetedBrep`/`polygonalFaceSet` methods, both already fully functional -- see
// `./addMeshRepresentation.ts`'s own header comment for its 4 ported `assert`
// preconditions and its verified-unconditional `unit_scale` division), and (landed in
// THIS chunk) `add_profile_representation` (224 lines) -- the first `api.geometry` file
// to hit a REAL geometry-kernel dependency (`ifcopenshell.geom.create_shape` +
// `ifcopenshell.util.shape.get_x`/`get_y`, needed only for a narrow set of
// `cardinalPoint` values on a profile outside a 10-class closed-form allowlist -- see
// `./addProfileRepresentation.ts`'s own header comment and `TODOS.md` for the full
// writeup; a fundamentally different, architecturally out-of-scope kind of gap from
// every primitive-layer/unported-`util.*` blocker disclosed elsewhere in this module), and
// (landed in THIS chunk) `add_window_representation` (779 lines -- by far the largest
// `api.geometry` file yet, `api.geometry` now has 26 of ~29 real files landed) -- a
// parametric window-geometry generator (frame/lining/sash/glazing panels across 9
// "partitioning types"). No real Python test file exists for it. Hits TWO independent,
// severe blockers, both fully disclosed in `./addWindowRepresentation.ts`'s own header
// comment rather than silently worked around: (1) a genuine, verbatim-preserved upstream-
// Python evaluation-order BUG (not a TS-port gap) that crashes every real call omitting
// either `overallHeight`/`overallWidth` -- their own documented defaults -- before any
// geometry work even begins; (2) once both are supplied explicitly, the actual geometry
// work hits the SAME 2 pre-existing, already-tracked `util/shapeBuilder.ts`/
// `entityInstance.ts` primitive-layer gaps disclosed by that file's own header comment
// (`.profile()`'s `Dim`-DERIVED-attribute gap; `.rectangle()`'s `IfcLineIndex`/`IfcArcIndex`
// defined-type-creation gap) -- not new findings, just this project's most pervasive real-
// world call site for them so far (every `TargetView`/schema combination is blocked
// somewhere, traced precisely in that file's header comment), and (landed in THIS chunk)
// `add_door_representation` (675 lines) -- a parametric door-geometry generator (lining/
// threshold/casing/panel/handle solids across single/double-swing, double-door, and sliding
// `operation_type`s, plus an optional on-top "transom" window built via this same module's
// own `createIfcWindow`). Hits the SAME 2 blockers as `add_window_representation` (an
// independently-reverified, same-shaped upstream-Python evaluation-order bug with its own
// 2.0m/0.9m defaults; the same 2 `ShapeBuilder`/`entityInstance.ts` primitive-layer gaps) --
// see `./addDoorRepresentation.ts`'s own header comment and `TODOS.md` for the full writeup,
// including one genuinely NEW finding: its `PLAN_VIEW` + `ContextIdentifier === "Annotation"`
// sliding-door arrow-symbol sub-branch is actually UNBLOCKED today, on every schema (it never
// builds a closed curve and passes an explicit `representationType`, so neither gap is ever
// reached) -- the one real, working, non-throwing representation either of these 2 large
// parametric-geometry files can produce as of this chunk.
// and (landed in THIS chunk) `add_railing_representation` (646 lines) -- a parametric
// WALL_MOUNTED_HANDRAIL railing-geometry generator. UNLIKE `add_window_representation`/
// `add_door_representation`, real Python here has NO internal `Usecase` class at all -- it is
// already split (deliberately, per its own `__init__.py` comment: "the pilot for a
// 'pure-compute + IFC-wrap' split") into a pure-geometry compute function
// (`compute_wall_mounted_handrail_geometry`, ZERO `ifcopenshell.file` dependency, genuinely
// UNBLOCKED today) and a thin `ShapeBuilder`-based IFC-wrapping function
// (`add_railing_representation`, which -- unlike window/door's own "most real-world inputs are
// blocked" finding -- is blocked on LITERALLY EVERY input, on every schema, via
// `ShapeBuilder.createSweptDiskSolid`'s own unconditional `.get("Dim")` DERIVED-attribute-gap
// throw, called unconditionally at least once on every invocation with no code path around it).
// Also independently re-checked (and confirmed NOT present here, unlike window/door): the
// evaluation-order `Usecase.settings`-accessed-before-assignment bug does not apply, since this
// file has no `Usecase` class to have that bug in; its own default-resolution order is correct.
// A genuinely NEW, different bug was found instead: `addArcsOnTurningPoints`'s degenerate-fillet
// fallback only catches a `ZeroDivisionError`-shaped failure, not the `ValueError`
// `np_intersect_line_line` raises for near-parallel lines -- see
// `./addRailingRepresentation.ts`'s own header comment (finding 1) and `TODOS.md` for the full
// writeup of all 3 findings.
// and (landed in THIS chunk, the LAST portable file in this module) `regenerate_wall_representation`
// (646 lines) -- regenerates a standard (case) wall's body + axis representation, taking into
// account material-layer-set thicknesses/priorities and `IfcRelConnectsPathElements` connections
// (notches, butts, mitres) to other walls. Unlike every other file in this module, real Python
// implements this with an internal `Regenerator` CLASS (not a `Usecase` class -- explicitly
// checked, per this chunk's own required process, whether the `Usecase.settings`-accessed-before-
// assignment evaluation-order bug from `addWindowRepresentation`/`addDoorRepresentation` applies
// here: it does NOT, since `Regenerator` never uses that dict-settings pattern at all -- see
// `./regenerateWallRepresentation.ts`'s own header comment for the full trace). Every real
// invocation with a wall that has an `IfcMaterialLayerSet` throws while building the actual body
// solid, on EVERY schema, via the SAME 2 already-tracked `entityInstance.ts` primitive-layer gaps
// as `addWindowRepresentation`/`addDoorRepresentation`/`addRailingRepresentation` (matching
// `addRailingRepresentation`'s own "blocked on literally every input" finding, not window/door's
// own "most real-world inputs" one) -- but every pure layer/axis/connection-join computation this
// function performs (the bulk of its own real complexity) never touches `ShapeBuilder` at all and
// is genuinely, fully UNBLOCKED and independently tested today. Also found and disclosed: a REAL,
// severe, verbatim-preserved upstream-Python bug in `combine_layers` (attempts item-assignment on
// an immutable `PrioritisedLayer` namedtuple, crashing whenever a connection actually specifies
// `RelatingPriorities`/`RelatedPriorities` -- real IFC data, not a contrived edge case) -- see that
// file's own header comment (Finding 2) and `TODOS.md` for the full writeup of this and 3 further
// smaller quirks (a double-fetch of the `BBIM_Boolean` pset; a stale-iterator-reference quirk deep
// inside the mitre-join branch; a "same name, different value" `miny`/`maxy` shadowing trap in the
// original source).
//
// `api.geometry` is now FUNCTIONALLY COMPLETE for this port's scope -- every one of its ~29 real,
// portable Python files has been ported (reviewed against the real Python source, see each file's
// own header comment); only the permanently-Blender-only `add_representation.py` remains, by
// design, unported (see this file's own header comment above). Namespaced per this project's
// `util/index.ts` per-submodule convention:
// `api.geometry.addAxisRepresentation`/`api.geometry.addBoolean`/
// `api.geometry.addDoorRepresentation`/
// `api.geometry.addMeshRepresentation`/`api.geometry.addProfileRepresentation`/
// `api.geometry.addRailingRepresentation`/`api.geometry.computeWallMountedHandrailGeometry`/
// `api.geometry.addShapeAspect`/
// `api.geometry.addSlabRepresentation`/`api.geometry.addTopologyRepresentation`/
// `api.geometry.addWallRepresentation`/`api.geometry.addWindowRepresentation`/
// `api.geometry.assignRepresentation`/
// `api.geometry.addFootprintRepresentation`/`api.geometry.clipSolid`/
// `api.geometry.clipSolidBounded`/`api.geometry.connectElement`/
// `api.geometry.connectPath`/`api.geometry.connectWall`/`api.geometry.copyRepresentation`/
// `api.geometry.create2ptWall`/`api.geometry.disconnectElement`/
// `api.geometry.disconnectPath`/`api.geometry.editObjectPlacement`/
// `api.geometry.mapRepresentation`/`api.geometry.regenerateWallRepresentation`/
// `api.geometry.removeBoolean`/
// `api.geometry.removeRepresentation`/`api.geometry.unassignRepresentation`/
// `api.geometry.validateType`.
export { addAxisRepresentation } from "./addAxisRepresentation";
export type { AddAxisRepresentationSettings, Coord } from "./addAxisRepresentation";
export { addBoolean } from "./addBoolean";
export type { AddBooleanSettings } from "./addBoolean";
export {
	addDoorRepresentation,
	createIfcBox,
	createIfcDoorLining,
	doorLShapeCheck,
	SUPPORTED_DOOR_TYPES,
} from "./addDoorRepresentation";
export type {
	AddDoorRepresentationSettings,
	DoorLiningProperties,
	DoorPanelProperties,
	DoorType,
} from "./addDoorRepresentation";
export { addFootprintRepresentation } from "./addFootprintRepresentation";
export type { AddFootprintRepresentationSettings } from "./addFootprintRepresentation";
export { addMeshRepresentation } from "./addMeshRepresentation";
export type { AddMeshRepresentationSettings } from "./addMeshRepresentation";
export { addProfileRepresentation, CARDINAL_POINT_VALUES } from "./addProfileRepresentation";
export type {
	AddProfileRepresentationSettings,
	CardinalPoint,
	CardinalPointNumeric,
	CardinalPointString,
	Vec3,
} from "./addProfileRepresentation";
export {
	addRailingRepresentation,
	computeWallMountedHandrailGeometry,
	FilletDegenerateError,
} from "./addRailingRepresentation";
export type {
	AddRailingRepresentationSettings,
	ComputeWallMountedHandrailGeometryOptions,
	RailingSupport,
	TerminalType,
	WallMountedHandrailGeometry,
} from "./addRailingRepresentation";
export { addSlabRepresentation } from "./addSlabRepresentation";
export type { AddSlabRepresentationSettings } from "./addSlabRepresentation";
export { addWallRepresentation } from "./addWallRepresentation";
export type { AddWallRepresentationSettings } from "./addWallRepresentation";
export {
	addWindowRepresentation,
	createIfcWindow,
	createIfcWindowFrameSimple,
	DEFAULT_PANEL_SCHEMAS,
	windowLShapeCheck,
} from "./addWindowRepresentation";
export type {
	AddWindowRepresentationSettings,
	WindowLiningProperties,
	WindowPanelProperties,
	WindowType,
} from "./addWindowRepresentation";
export { addShapeAspect } from "./addShapeAspect";
export type { AddShapeAspectSettings } from "./addShapeAspect";
export { addTopologyRepresentation } from "./addTopologyRepresentation";
export type { AddTopologyRepresentationSettings } from "./addTopologyRepresentation";
export { assignRepresentation } from "./assignRepresentation";
export type { AssignRepresentationSettings } from "./assignRepresentation";
export { clipSolid } from "./clipSolid";
export type { ClipSolidSettings } from "./clipSolid";
export { clipSolidBounded } from "./clipSolidBounded";
export type { ClipSolidBoundedSettings } from "./clipSolidBounded";
export { connectElement } from "./connectElement";
export type { ConnectElementSettings } from "./connectElement";
export { connectPath } from "./connectPath";
export type { ConnectPathSettings } from "./connectPath";
export { connectWall } from "./connectWall";
export type { ConnectWallSettings } from "./connectWall";
export { copyRepresentation } from "./copyRepresentation";
export type { CopyRepresentationSettings } from "./copyRepresentation";
export { create2ptWall } from "./create2ptWall";
export type { Create2ptWallSettings } from "./create2ptWall";
export { disconnectElement } from "./disconnectElement";
export type { DisconnectElementSettings } from "./disconnectElement";
export { disconnectPath } from "./disconnectPath";
export type { DisconnectPathSettings } from "./disconnectPath";
export { editObjectPlacement } from "./editObjectPlacement";
export type { EditObjectPlacementSettings } from "./editObjectPlacement";
export { mapRepresentation } from "./mapRepresentation";
export type { MapRepresentationSettings } from "./mapRepresentation";
export { regenerateWallRepresentation } from "./regenerateWallRepresentation";
export type { RegenerateWallRepresentationSettings } from "./regenerateWallRepresentation";
export { removeBoolean } from "./removeBoolean";
export type { RemoveBooleanSettings } from "./removeBoolean";
export { removeRepresentation } from "./removeRepresentation";
export type { RemoveRepresentationSettings } from "./removeRepresentation";
export { unassignRepresentation } from "./unassignRepresentation";
export type { UnassignRepresentationSettings } from "./unassignRepresentation";
export { validateType } from "./validateType";
export type { ValidateTypeSettings } from "./validateType";
