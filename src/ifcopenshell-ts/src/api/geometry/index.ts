// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.geometry` (src/ifcopenshell-python's
// `ifcopenshell/api/geometry/` package) -- **NOT a full port of that module**. 17 of its
// ~29 real files are ported so far: `unassign_representation`/`remove_representation`
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
// `clippings`/`booleans` ALIASING divergences between the two files). Every other
// `api.geometry` function (`add_door_representation`, `validate_csg`, etc.) remains
// unported; a future `api.geometry` chunk should treat all 22 of these as already
// landed (reviewed against the real Python source, see each file's own header comment)
// rather than re-porting them from scratch. Namespaced per this project's
// `util/index.ts` per-submodule convention:
// `api.geometry.addAxisRepresentation`/`api.geometry.addBoolean`/
// `api.geometry.addShapeAspect`/`api.geometry.addSlabRepresentation`/
// `api.geometry.addTopologyRepresentation`/`api.geometry.addWallRepresentation`/
// `api.geometry.assignRepresentation`/`api.geometry.addFootprintRepresentation`/
// `api.geometry.clipSolid`/`api.geometry.clipSolidBounded`/
// `api.geometry.connectElement`/`api.geometry.connectPath`/`api.geometry.connectWall`/
// `api.geometry.copyRepresentation`/`api.geometry.disconnectElement`/
// `api.geometry.disconnectPath`/`api.geometry.editObjectPlacement`/
// `api.geometry.mapRepresentation`/`api.geometry.removeBoolean`/
// `api.geometry.removeRepresentation`/`api.geometry.unassignRepresentation`/
// `api.geometry.validateType`.
export { addAxisRepresentation } from "./addAxisRepresentation";
export type { AddAxisRepresentationSettings, Coord } from "./addAxisRepresentation";
export { addBoolean } from "./addBoolean";
export type { AddBooleanSettings } from "./addBoolean";
export { addFootprintRepresentation } from "./addFootprintRepresentation";
export type { AddFootprintRepresentationSettings } from "./addFootprintRepresentation";
export { addSlabRepresentation } from "./addSlabRepresentation";
export type { AddSlabRepresentationSettings } from "./addSlabRepresentation";
export { addWallRepresentation } from "./addWallRepresentation";
export type { AddWallRepresentationSettings } from "./addWallRepresentation";
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
export { disconnectElement } from "./disconnectElement";
export type { DisconnectElementSettings } from "./disconnectElement";
export { disconnectPath } from "./disconnectPath";
export type { DisconnectPathSettings } from "./disconnectPath";
export { editObjectPlacement } from "./editObjectPlacement";
export type { EditObjectPlacementSettings } from "./editObjectPlacement";
export { mapRepresentation } from "./mapRepresentation";
export type { MapRepresentationSettings } from "./mapRepresentation";
export { removeBoolean } from "./removeBoolean";
export type { RemoveBooleanSettings } from "./removeBoolean";
export { removeRepresentation } from "./removeRepresentation";
export type { RemoveRepresentationSettings } from "./removeRepresentation";
export { unassignRepresentation } from "./unassignRepresentation";
export type { UnassignRepresentationSettings } from "./unassignRepresentation";
export { validateType } from "./validateType";
export type { ValidateTypeSettings } from "./validateType";
