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
// skipped). Every other `api.geometry` function (`add_wall_representation`,
// `add_door_representation`, `clip_solid*`, `validate_csg`, etc.) remains unported; a
// future `api.geometry` chunk should treat all 17 of these as already landed (reviewed
// against the real Python source, see each file's own header comment) rather than
// re-porting them from scratch. Namespaced per this project's `util/index.ts`
// per-submodule convention: `api.geometry.addBoolean`/`api.geometry.addShapeAspect`/
// `api.geometry.addTopologyRepresentation`/`api.geometry.assignRepresentation`/
// `api.geometry.addFootprintRepresentation`/`api.geometry.connectElement`/
// `api.geometry.connectPath`/`api.geometry.connectWall`/
// `api.geometry.copyRepresentation`/`api.geometry.disconnectElement`/
// `api.geometry.disconnectPath`/`api.geometry.editObjectPlacement`/
// `api.geometry.mapRepresentation`/`api.geometry.removeBoolean`/
// `api.geometry.removeRepresentation`/`api.geometry.unassignRepresentation`/
// `api.geometry.validateType`.
export { addBoolean } from "./addBoolean";
export type { AddBooleanSettings } from "./addBoolean";
export { addFootprintRepresentation } from "./addFootprintRepresentation";
export type { AddFootprintRepresentationSettings } from "./addFootprintRepresentation";
export { addShapeAspect } from "./addShapeAspect";
export type { AddShapeAspectSettings } from "./addShapeAspect";
export { addTopologyRepresentation } from "./addTopologyRepresentation";
export type { AddTopologyRepresentationSettings } from "./addTopologyRepresentation";
export { assignRepresentation } from "./assignRepresentation";
export type { AssignRepresentationSettings } from "./assignRepresentation";
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
