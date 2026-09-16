// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.control` (src/ifcopenshell-python's `ifcopenshell/api/
// control/` package, 2 real files, 174 lines total) -- a brand-new module (no TS port
// of any kind existed before this chunk), both functions ported in one chunk together
// with the also brand-new `api.drawing`/`api.pset_template` modules -- see the sibling
// `../drawing/index.ts`/`../pset_template/index.ts` for those.
//
// Assigns/unassigns a planning control or constraint (`IfcControl`, e.g. a
// `IfcWorkCalendar` or `IfcCostItem`) to/from a list of `IfcObjectDefinition`s via
// `IfcRelAssignsToControl`. Real Python's own docstring flags this as "an advanced
// topic" likely to be superseded by more specific usecase APIs in the future.
//
// --- Dependencies confirmed already landed (verified by reading each, not assumed) ---
//
// `api.owner` (`createOwnerHistory`/`updateOwnerHistory`), `guid`, `util.element`
// (`removeDeep2`). No `numpy`/`shape_builder`/`ifcopenshell.geom` import anywhere in
// this module (confirmed by reading both real files) -- no geometry-kernel blocker.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.control.assignControl`/`api.control.unassignControl`.
export { assignControl } from "./assignControl";
export type { AssignControlSettings } from "./assignControl";
export { unassignControl } from "./unassignControl";
export type { UnassignControlSettings } from "./unassignControl";
