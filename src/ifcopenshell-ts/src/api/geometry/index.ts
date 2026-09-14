// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.geometry` (src/ifcopenshell-python's
// `ifcopenshell/api/geometry/` package) -- **NOT a full port of that module**. 4 of its
// ~29 real files are ported so far: `unassign_representation`/`remove_representation`
// (an earlier `api.context` chunk, minimal direct dependencies of
// `api.context.removeContext`'s top-level-context branch -- see
// `./unassignRepresentation.ts`'s own header comment) and, landed in this chunk,
// `assign_representation`/`map_representation` (see `./assignRepresentation.ts`'s own
// header comment for why these 2 were prioritized ahead of the rest of the module: they
// retroactively unblock real, disclosed throws in `api.type.mapTypeRepresentations` and
// `api.root.reassignClass`). `edit_object_placement` -- `api.spatial`/`api.aggregate`'s
// own already-disclosed blocker, and now ALSO `api.root.reassignClass`'s own
// still-partially-blocked `type_to_occurrence`-with-representations case (`TODOS.md`) --
// and every other `api.geometry` function (`add_wall_representation`,
// `add_door_representation`, `copy_representation`, `connect_*`, `clip_solid*`, etc.)
// remain unported; a future `api.geometry` chunk should treat all 4 of these as already
// landed (reviewed against the real Python source, see each file's own header comment)
// rather than re-porting them from scratch. Namespaced per this project's
// `util/index.ts` per-submodule convention: `api.geometry.assignRepresentation`/
// `api.geometry.mapRepresentation`/`api.geometry.unassignRepresentation`/
// `api.geometry.removeRepresentation`.
export { assignRepresentation } from "./assignRepresentation";
export type { AssignRepresentationSettings } from "./assignRepresentation";
export { mapRepresentation } from "./mapRepresentation";
export type { MapRepresentationSettings } from "./mapRepresentation";
export { removeRepresentation } from "./removeRepresentation";
export type { RemoveRepresentationSettings } from "./removeRepresentation";
export { unassignRepresentation } from "./unassignRepresentation";
export type { UnassignRepresentationSettings } from "./unassignRepresentation";
