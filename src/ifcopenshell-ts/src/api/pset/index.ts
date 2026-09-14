// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.pset` (src/ifcopenshell-python's `ifcopenshell/api/
// pset/` package) -- now a FULL port of that module, across 3 chunks. Chunk 1 added
// `add_pset`/`assign_pset`/`unassign_pset`/`unshare_pset` alongside the already-landed
// `remove_pset` (see `./removePset.ts`'s own header comment for why that one landed
// alone, ahead of chunk 1, as a minimal dependency of `api.group.removeGroup`). Chunk 2
// added `add_qto`/`edit_qto` (see `./editQto.ts`'s own header comment -- one of the more
// intricate functions in this module family, with a real disclosed Python bug). Chunk 3
// (this one) adds `edit_pset` (see `./editPset.ts`'s own header comment -- the single
// biggest file in the whole `api` package, with several further real, disclosed Python
// quirks of its own: `should_purge` semantics, a shared-property safety check, and a
// throwaway-probe-entity orphan-creation quirk in `cast_value_to_primary_measure_type`).
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.pset.addPset`, `api.pset.assignPset`, `api.pset.unassignPset`,
// `api.pset.unsharePset`, `api.pset.removePset`, `api.pset.addQto`, `api.pset.editQto`,
// `api.pset.editPset`.
export { addPset } from "./addPset";
export type { AddPsetSettings } from "./addPset";
export { assignPset } from "./assignPset";
export type { AssignPsetSettings } from "./assignPset";
export { unassignPset } from "./unassignPset";
export type { UnassignPsetSettings } from "./unassignPset";
export { unsharePset } from "./unsharePset";
export type { UnsharePsetSettings } from "./unsharePset";
export { removePset } from "./removePset";
export type { RemovePsetSettings } from "./removePset";
export { addQto } from "./addQto";
export type { AddQtoSettings } from "./addQto";
export { editQto, inferPropertyType } from "./editQto";
export type { ComplexQuantityValue, EditQtoSettings, QuantityValue } from "./editQto";
export { editPset, getPrimaryMeasureType, inferPrimaryMeasureType } from "./editPset";
export type { EditPsetSettings, PropertyPrimitive, PropertyValue, UnitWrappedPropertyValue } from "./editPset";
