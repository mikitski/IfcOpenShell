// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.unit` (src/ifcopenshell-python's `ifcopenshell/api/
// unit/` package, 11 files, ~790 lines total) -- all 11 functions ported in one
// chunk, per the Phase 6 roadmap's Tier 1 `unit` entry. No geometry-kernel or other
// unported hard dependency anywhere in this module (every file only ever imports
// `ifcopenshell.util.element`/`ifcopenshell.util.unit`, both already fully ported).
//
// *** One real, load-bearing, pre-existing, already-disclosed primitive-layer gap
// (first surfaced by `util/migrator.ts`'s own header comment, finding 1) blocks two
// of these 11 functions from ever completing successfully as currently written:
// `addConversionBasedUnit` (entirely -- every branch needs a valued `IfcReal`) and
// `assignUnit`'s imperial-unit-synthesis branch only (its default/metric/explicit-
// `units` paths are fully unblocked). See `addConversionBasedUnit.ts`'s own header
// comment for the full empirical writeup (reproduced directly against this exact
// worktree's own built native addon) and each affected file's own dedicated "currently
// throws" regression test. The other 9 functions are fully functional. ***
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.unit.addSiUnit`/`api.unit.assignUnit`/etc.
export { addContextDependentUnit } from "./addContextDependentUnit";
export type { AddContextDependentUnitSettings } from "./addContextDependentUnit";
export { addConversionBasedUnit } from "./addConversionBasedUnit";
export type { AddConversionBasedUnitSettings } from "./addConversionBasedUnit";
export { addDerivedUnit } from "./addDerivedUnit";
export type { AddDerivedUnitSettings } from "./addDerivedUnit";
export { addMonetaryUnit } from "./addMonetaryUnit";
export type { AddMonetaryUnitSettings } from "./addMonetaryUnit";
export { addSiUnit } from "./addSiUnit";
export type { AddSiUnitSettings } from "./addSiUnit";
export { assignUnit } from "./assignUnit";
export type { AssignUnitSettings, UnitSynthesisSpec } from "./assignUnit";
export { editDerivedUnit } from "./editDerivedUnit";
export type { EditDerivedUnitSettings } from "./editDerivedUnit";
export { editMonetaryUnit } from "./editMonetaryUnit";
export type { EditMonetaryUnitSettings } from "./editMonetaryUnit";
export { editNamedUnit } from "./editNamedUnit";
export type { EditNamedUnitSettings } from "./editNamedUnit";
export { removeUnit } from "./removeUnit";
export type { RemoveUnitSettings } from "./removeUnit";
export { unassignUnit } from "./unassignUnit";
export type { UnassignUnitSettings } from "./unassignUnit";
