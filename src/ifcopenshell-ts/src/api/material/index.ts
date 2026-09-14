// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.material` (src/ifcopenshell-python's `ifcopenshell/api/
// material/` package, 26 real files, ~2585 lines total) -- a brand-new, large module,
// split across several chunks like `api.owner`/`api.pset` before it. THIS chunk
// (chunk 1) ports exactly 3 of those 26 files: `assign_material`/`unassign_material`/
// `copy_material` (see each file's own header comment for its full scope and disclosed
// quirks). Deliberately NOT ported in this chunk: `add_material`/`add_layer`/
// `add_profile`/`add_constituent`/`add_material_set`/`add_list_item`/`assign_profile`/
// every `edit_*` (`edit_assigned_material`/`edit_constituent`/`edit_layer`/
// `edit_layer_usage`/`edit_material`/`edit_profile`/`edit_profile_usage`)/every
// `remove_*` (`remove_constituent`/`remove_layer`/`remove_list_item`/
// `remove_material`/`remove_material_set`/`remove_profile`)/`reorder_set_item`/
// `set_shape_aspect_constituents` -- all separate, future `api.material` chunks.
//
// --- Why this chunk was prioritized ---
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
export { assignMaterial } from "./assignMaterial";
export type { AssignMaterialSettings } from "./assignMaterial";
export { unassignMaterial } from "./unassignMaterial";
export type { UnassignMaterialSettings } from "./unassignMaterial";
export { copyMaterial } from "./copyMaterial";
export type { CopyMaterialSettings } from "./copyMaterial";
