// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.nest` (src/ifcopenshell-python's `ifcopenshell/api/nest/`
// package) -- a brand-new module, all 4 real files ported in one chunk (327 lines
// total): `assign_object`/`unassign_object` (the two "surgery" functions that actually
// manage `IfcRelNests`, structurally near-identical to the already-landed
// `api.aggregate`/`api.spatial` containment pair) and `change_nest`/`reorder_nesting`
// (two small standalone helpers, neither of which schema-branches for IFC2X3 the way
// `assignObject`/`unassignObject` do -- see each file's own header comment for the
// disclosed, verbatim-preserved IFC2X3 throw this causes).
//
// This module manages nesting -- physical parent/child attachment through a
// predetermined connection point (e.g. a faucet nested into a sink's predrilled hole),
// distinct from aggregation (whole/part) and containment (spatial location). No
// unported dependency of any kind (confirmed by reading all 4 real files: only
// `api.aggregate`/`api.spatial`/`api.owner`/`guid`/`util.element`, all already landed).
// Namespaced as `api.nest.assignObject`/etc., matching `util/index.ts`'s per-submodule
// convention.
export { assignObject } from "./assignObject";
export type { AssignObjectSettings } from "./assignObject";
export { unassignObject } from "./unassignObject";
export type { UnassignObjectSettings } from "./unassignObject";
export { changeNest } from "./changeNest";
export type { ChangeNestSettings } from "./changeNest";
export { reorderNesting } from "./reorderNesting";
export type { ReorderNestingSettings } from "./reorderNesting";
