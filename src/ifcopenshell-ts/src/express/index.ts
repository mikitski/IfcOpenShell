// This file was generated with the assistance of an AI coding tool.
//
// Barrel for the new `express/` directory (mirrors real Python's `ifcopenshell.express`
// package location, not any single file in it -- see `runtimeShim.ts`'s own header
// comment for why). Flattened (`export *`) rather than namespaced per-file
// (`export * as runtimeShim from "./runtimeShim"`), matching how the generated Python
// rules call these helpers bare (`nvl(...)`, `usedin(...)`) in the same module scope
// they're defined in -- Phase EX-2/EX-4's own `express/rules/*.ts` files (not yet
// ported) are expected to import from here the same way.
export * from "./runtimeShim";
