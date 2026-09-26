// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.material` (src/ifcopenshell-python's `ifcopenshell/api/
// material/` package, 26 real files, ~2585 lines total) -- a brand-new, large module,
// split across several chunks like `api.owner`/`api.pset` before it. Chunk 1 ported
// `assign_material`/`unassign_material`/`copy_material`. Chunk 2 ported 8 more:
// `add_material`/`add_material_set`/`add_layer`/`add_profile`/`add_constituent`/
// `add_list_item`/`edit_material`/`edit_assigned_material` (11 of 26 files total after
// chunk 2). Chunk 3 ported the entire `remove_*` family, 6 more files:
// `remove_material`/`remove_material_set`/`remove_layer`/`remove_profile`/
// `remove_constituent`/`remove_list_item` (17 of 26 files total after chunk 3). THIS
// chunk (chunk 4, the last) ports the final 8 files, COMPLETING the module (26/26
// files): `edit_layer`/`edit_constituent`/`reorder_set_item`/`edit_layer_usage`/
// `edit_profile`/`set_shape_aspect_constituents`/`assign_profile`/`edit_profile_usage`
// (the last being by far this chunk's largest and most complex file, 223 real lines).
//
// Every sibling `api.material` dependency this chunk's own 8 files need
// (`unassign_material`/`remove_material_set`/`add_material_set`/`add_constituent`/
// `assign_material`, all needed by `set_shape_aspect_constituents` alone) was already
// landed in an earlier chunk of this SAME module -- no cross-chunk ordering blocker.
// Two genuinely unported, OUTSIDE-`api.material` dependencies remain, each disclosed in
// its own file's header comment and a dedicated `TODOS.md` entry, and each throws a
// clear, loud, descriptive error only at the exact point it would actually be needed
// (never proactively, never before every otherwise-portable real behavior has run to
// completion): `edit_profile_usage.ts`'s `CardinalPoint`-change branch needs
// `ifcopenshell.geom`/`util.shape.getX`/`getY` (the same pre-existing geometry-kernel
// gap this project's very first `TODOS.md` entry already tracks); `set_shape_aspect
// _constituents.ts`'s final style-assignment loop needs `ifcopenshell.api.style
// .assign_item_style` (`api.style` has NO TS port of any kind -- a brand-new blocked
// module for this project, same treatment as `api.system`'s own entry for
// `../root/copyClass.ts`). `set_shape_aspect_constituents.ts` also discloses a real,
// verbatim-preserved upstream BUG (an `is_a("IfcMaterialConstituent")` check that
// should almost certainly read `"IfcMaterialConstituentSet"`, permanently disabling an
// intended "reuse an existing matching material set" optimisation) -- see that file's
// own header comment for the full writeup.
//
// `api.material` is now FULLY PORTED (26/26 files) -- every future `api.*` chunk that
// cited a real, disclosed `api.material` blocker (several already resolved
// retroactively across chunks 1-3, see those chunks' own header comments) can treat
// every function in this module as landed and reviewed.
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
export { assignProfile } from "./assignProfile";
export type { AssignProfileSettings } from "./assignProfile";
export { unassignMaterial } from "./unassignMaterial";
export type { UnassignMaterialSettings } from "./unassignMaterial";
export { copyMaterial } from "./copyMaterial";
export type { CopyMaterialSettings } from "./copyMaterial";
export { editAssignedMaterial } from "./editAssignedMaterial";
export type { EditAssignedMaterialSettings } from "./editAssignedMaterial";
export { editConstituent } from "./editConstituent";
export type { EditConstituentSettings } from "./editConstituent";
export { editLayer } from "./editLayer";
export type { EditLayerSettings } from "./editLayer";
export { editLayerUsage } from "./editLayerUsage";
export type { EditLayerUsageSettings } from "./editLayerUsage";
export { editMaterial } from "./editMaterial";
export type { EditMaterialSettings } from "./editMaterial";
export { editProfile } from "./editProfile";
export type { EditProfileSettings } from "./editProfile";
export { editProfileUsage } from "./editProfileUsage";
export type { EditProfileUsageSettings } from "./editProfileUsage";
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
export { reorderSetItem } from "./reorderSetItem";
export type { ReorderSetItemSettings } from "./reorderSetItem";
export { setShapeAspectConstituents } from "./setShapeAspectConstituents";
export type { SetShapeAspectConstituentsSettings } from "./setShapeAspectConstituents";
