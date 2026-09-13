// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.geometry` (src/ifcopenshell-python's
// `ifcopenshell/api/geometry/` package) -- **NOT a full port of that module**. Only
// `unassign_representation`/`remove_representation` are ported here, as a minimal,
// direct dependency of `api.context.removeContext`'s top-level-context branch (see
// `./unassignRepresentation.ts`'s own header comment for the full disclosure of why
// exactly these two, and not the rest of the module). `edit_object_placement` --
// `api.spatial`/`api.aggregate`'s own already-disclosed blocker (`TODOS.md`) -- and
// every other `api.geometry` function remain unported; a future `api.geometry` chunk
// should treat `unassignRepresentation`/`removeRepresentation` as already landed
// (reviewed against the real Python source, see each file's own header comment) rather
// than re-porting them from scratch. Namespaced per this project's `util/index.ts`
// per-submodule convention: `api.geometry.unassignRepresentation`/
// `api.geometry.removeRepresentation`.
export { removeRepresentation } from "./removeRepresentation";
export type { RemoveRepresentationSettings } from "./removeRepresentation";
export { unassignRepresentation } from "./unassignRepresentation";
export type { UnassignRepresentationSettings } from "./unassignRepresentation";
