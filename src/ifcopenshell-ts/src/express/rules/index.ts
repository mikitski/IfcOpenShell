// This file was generated with the assistance of an AI coding tool.
//
// Side-effect-only barrel: statically imports every ported per-schema `calc_*` rules
// module purely for its `registerSchemaCalcFunctions(...)` module-top-level call (see
// `../dispatch.ts`'s own header comment for why static registration, not real Python's
// dynamic `importlib.import_module`, is this port's schema-scoped substitute).
// `entityInstance.ts` imports this module for its side effect alone, so that reading a
// DERIVED attribute always has every ported schema's functions available, regardless of
// which module a particular caller happened to import first.
//
// Additive by design: IFC4X3's first chunk (`rules/ifc4x3.ts`, registered under the
// real, C++-core-registered `"IFC4X3_ADD2"` identifier -- see that file's own header
// comment) adds `import "./ifc4x3";` below -- nothing else in this barrel, `dispatch.ts`,
// or `entityInstance.ts` needed to change for it. A future chunk porting more of
// IFC4X3's own remaining `calc_*` functions adds to `rules/ifc4x3.ts` directly, not
// here.
import "./ifc2x3";
import "./ifc4";
import "./ifc4x3";
