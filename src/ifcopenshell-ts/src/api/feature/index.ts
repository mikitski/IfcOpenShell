// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.feature` (src/ifcopenshell-python's
// `ifcopenshell/api/feature/` package, 4 files / 438 lines) -- manages
// `IfcFeatureElement` (openings/projections/surface features that void, project from,
// or adhere to a host element) and `IfcFeatureElementSubtraction` fillings (e.g. a
// door/window filling an opening). `api.feature` is now fully ported:
// `add_feature`/`add_filling`/`remove_feature`/`remove_filling`, all 4 real files.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.feature.addFeature`/`.addFilling`/`.removeFeature`/`.removeFilling`.
//
// Two real, disclosed quirks/bugs carried over verbatim from real Python (see each
// file's own header comment for the full detail): `addFilling`'s created
// `IfcRelFillsElement` never gets an `IfcOwnerHistory` (a kwargs-only `create_entity`
// call that skips it entirely); `removeFeature`'s `IfcSurfaceFeature` non-IFC4 branch
// reads the wrong inverse attribute (`ProjectsElements` instead of
// `AdheresToElement`), a genuine upstream bug that crashes for any real IFC4X3 surface
// feature in real Python too.
//
// Retroactive unblock: RESOLVED in a small, focused follow-up chunk (matching this
// project's established "land the module, wire up the retroactive unblock separately"
// precedent -- see e.g. `api.grid`/`api.boundary` landing before `removeProduct.ts`
// was updated to use them): `src/ifcopenshell-ts/src/api/root/removeProduct.ts`'s
// disclosed, formerly-throwing blocker for an `IfcElement`'s `HasOpenings` cleanup
// (`TODOS.md`'s "`api.root.removeProduct` skips `HasOpenings`/`IfcGrid` axis cleanup"
// entry) is now wired up for real, calling this module's own `removeFeature`.
export { addFeature } from "./addFeature";
export type { AddFeatureSettings } from "./addFeature";
export { addFilling } from "./addFilling";
export type { AddFillingSettings } from "./addFilling";
export { removeFeature } from "./removeFeature";
export type { RemoveFeatureSettings } from "./removeFeature";
export { removeFilling } from "./removeFilling";
export type { RemoveFillingSettings } from "./removeFilling";
