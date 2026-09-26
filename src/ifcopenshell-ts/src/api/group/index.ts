// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.group` (src/ifcopenshell-python's `ifcopenshell/api/
// group/` package, 6 files, ~360 lines total) -- all 6 functions ported in one chunk,
// per the Phase 6 roadmap. Manages `IfcGroup` via `IfcRelAssignsToGroup`: a generic,
// non-spatial grouping mechanism for arbitrary collections of products (e.g. a named
// "Unit 1A" collection of furniture) -- distinct from `api.system` (distribution
// systems), `api.spatial`/`api.aggregate` (hierarchical spatial decomposition), or
// `api.classification` (external classification references), per the real Python
// package's own module docstring.
//
// Structurally close to `api.layer`'s `assign`/`unassign` shape but rel-based (like
// `api.spatial`/`api.aggregate`) rather than a plain attribute rewrite: `assignGroup`/
// `unassignGroup` only ever look at `group.IsGroupedBy[0]`, the first pre-existing rel
// (a real, disclosed Python-source behavior, not something this port introduces -- see
// `assignGroup.ts`'s own header comment); `updateGroupProducts` is the one function
// that DOES walk every rel in `IsGroupedBy`, to preserve nested-group membership while
// purging the rest (see `updateGroupProducts.ts`'s own header comment).
//
// `remove_group.py` additionally calls `ifcopenshell.api.pset.remove_pset` -- `api.pset`
// as a whole is a future, much larger chunk (8 files/8 public functions, `edit_pset.py`
// alone the single biggest file in the whole `api` package, per `research/
// 02-api-layer.md`), but `remove_pset.py` itself (81 lines) is small and fully
// self-contained (only imports `ifcopenshell.util.element`), so it's ported alongside
// this chunk as a minimal, direct dependency -- see `../pset/index.ts`'s and
// `../pset/removePset.ts`'s own header comments for the full disclosure of that
// decision and scope.
//
// One noteworthy finding surfaced while porting this chunk (investigated, not
// assumed): `remove_group.py`'s own `IfcRelAssignsToGroup` cleanup only explicitly
// handles two of three possible "this rel references `group`" shapes -- the third
// (`group` nested alongside OTHER members inside another group's rel) needs no
// explicit branch at all, since `IfcFile.remove`'s own automatic aggregate-reference
// cleanup already splices `group` out of that rel correctly -- see `removeGroup.ts`'s
// own header comment for the full writeup.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.group.addGroup`/`api.group.assignGroup`/etc.
export { addGroup } from "./addGroup";
export type { AddGroupSettings } from "./addGroup";
export { assignGroup } from "./assignGroup";
export type { AssignGroupSettings } from "./assignGroup";
export { editGroup } from "./editGroup";
export type { EditGroupSettings } from "./editGroup";
export { removeGroup } from "./removeGroup";
export type { RemoveGroupSettings } from "./removeGroup";
export { unassignGroup } from "./unassignGroup";
export type { UnassignGroupSettings } from "./unassignGroup";
export { updateGroupProducts } from "./updateGroupProducts";
export type { UpdateGroupProductsSettings } from "./updateGroupProducts";
