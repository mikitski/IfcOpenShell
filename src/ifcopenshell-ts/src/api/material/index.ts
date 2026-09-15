// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.material` (src/ifcopenshell-python's `ifcopenshell/api/
// material/` package, 26 real files, ~2585 lines total) -- a brand-new, large module,
// split across several chunks like `api.owner`/`api.pset` before it. Chunk 1 ported
// `assign_material`/`unassign_material`/`copy_material`. Chunk 2 ported 8 more:
// `add_material`/`add_material_set`/`add_layer`/`add_profile`/`add_constituent`/
// `add_list_item`/`edit_material`/`edit_assigned_material` (11 of 26 files total after
// chunk 2). THIS chunk (chunk 3) ports the entire `remove_*` family, 6 more files:
// `remove_material`/`remove_material_set`/`remove_layer`/`remove_profile`/
// `remove_constituent`/`remove_list_item` (17 of 26 files total so far). Deliberately
// NOT ported in this chunk: `assign_profile`/every remaining `edit_*`
// (`edit_constituent`/`edit_layer`/`edit_layer_usage`/`edit_profile`/
// `edit_profile_usage`)/`reorder_set_item`/`set_shape_aspect_constituents` -- all
// separate, future `api.material` chunks. Of this chunk's own 6 files, only
// `remove_material_set` has a genuine sibling `api.material` call (`unassign_material`,
// already landed in chunk 1) -- read in full and wired up directly, no blocker; the
// other 5 files' own docstring examples reference `add_layer`/`add_profile`/
// `add_constituent`/`add_list_item`/`edit_layer`, but those are documentation only, not
// real code inside the `remove_*` functions themselves. So no `TODOS.md` entry or
// loud-throw blocker was needed for this chunk either.
//
// --- Why chunk 1 was prioritized (retained from that chunk's own header comment) ---
//
// Three separate, already-merged chunks each disclosed a real, loud-throw blocker
// citing this exact module (which had NO TS port of any kind before this chunk):
//
// 1. `../type/assignType.ts`'s `mapMaterialUsages` helper -- needed `assignMaterial`
//    with `type: "<Class>Usage"` to map a newly-typed occurrence's material usage.
//    UNBLOCKED: `assignMaterial`'s own `IfcMaterialLayerSetUsage`/
//    `IfcMaterialProfileSetUsage` branches are fully, faithfully ported (see
//    `assignMaterial.ts`'s own header comment -- no blocked sibling call inside them),
//    so `assignType.ts`'s throw has been replaced with a real call. Its own
//    `assignType.test.ts` "throws the disclosed blocked error" test has been replaced
//    with the real Python `test_map_material_usages`/
//    `test_do_not_reassign_material_if_it_was_assigned_previously` assertions.
//
// 2. `../root/removeProduct.ts`'s `IfcRelAssociatesMaterial` inverse-cascade branch --
//    needed `unassignMaterial`. UNBLOCKED the same way: `removeProduct.ts`'s throw has
//    been replaced with a real call, and `removeProduct.test.ts`'s own disclosed-throw
//    test has been replaced with the real Python
//    `test_removing_material_associations_of_an_element` assertions.
//
// 3. `../root/copyClass.ts`'s `*Set` material-association branch -- needed
//    `copyMaterial`. As of this chunk starting, `copyClass.ts`/`reassignClass.ts`
//    (PR #92, branch `ts-api-root-completion`) had NOT yet landed in this worktree's
//    `v0.9.0` base (confirmed absent from `src/ifcopenshell-ts/src/api/root/` at chunk
//    start) -- so this wiring could not be done here. `copyMaterial` is a real,
//    exported function ready for that follow-up once PR #92 merges.
//
// Namespaced as `api.material.assignMaterial`/`.unassignMaterial`/`.copyMaterial`,
// matching `util/index.ts`'s per-submodule convention.
export { addConstituent } from "./addConstituent";
export type { AddConstituentSettings } from "./addConstituent";
export { addLayer } from "./addLayer";
export type { AddLayerSettings } from "./addLayer";
export { addListItem } from "./addListItem";
export type { AddListItemSettings } from "./addListItem";
export { addMaterial } from "./addMaterial";
export type { AddMaterialSettings } from "./addMaterial";
export { addMaterialSet } from "./addMaterialSet";
export type { AddMaterialSetSettings, MaterialSetType } from "./addMaterialSet";
export { addProfile } from "./addProfile";
export type { AddProfileSettings } from "./addProfile";
export { assignMaterial } from "./assignMaterial";
export type { AssignMaterialSettings } from "./assignMaterial";
export { unassignMaterial } from "./unassignMaterial";
export type { UnassignMaterialSettings } from "./unassignMaterial";
export { copyMaterial } from "./copyMaterial";
export type { CopyMaterialSettings } from "./copyMaterial";
export { editAssignedMaterial } from "./editAssignedMaterial";
export type { EditAssignedMaterialSettings } from "./editAssignedMaterial";
export { editMaterial } from "./editMaterial";
export type { EditMaterialSettings } from "./editMaterial";
export { removeConstituent } from "./removeConstituent";
export type { RemoveConstituentSettings } from "./removeConstituent";
export { removeLayer } from "./removeLayer";
export type { RemoveLayerSettings } from "./removeLayer";
export { removeListItem } from "./removeListItem";
export type { RemoveListItemSettings } from "./removeListItem";
export { removeMaterial } from "./removeMaterial";
export type { RemoveMaterialSettings } from "./removeMaterial";
export { removeMaterialSet } from "./removeMaterialSet";
export type { RemoveMaterialSetSettings } from "./removeMaterialSet";
export { removeProfile } from "./removeProfile";
export type { RemoveProfileSettings } from "./removeProfile";
