// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.cost` (src/ifcopenshell-python's `ifcopenshell/api/
// cost/` package, 20 real files, ~1720 lines total) -- a brand-new module (no TS port
// of any kind existed before this chunk). Manages cost schedules, cost breakdown
// structures (`IfcCostSchedule`/`IfcCostItem`), cost values/formulas
// (`IfcCostValue`), and parametric quantity take-off linking a cost item's own
// quantities (`IfcCostItem.CostQuantities`) to physical product quantities.
//
// Dependencies confirmed already landed (verified by reading every real file's own
// imports, not assumed): `api.control` (`assignControl`/`unassignControl`), `api.nest`
// (`assignObject`/`unassignObject`), `api.root` (`createEntity`), `guid` (only via
// `api.root.createEntity` internally -- no direct `ifcopenshell.guid` call site in any
// of these 20 files despite `add_cost_item.py` importing it, a dead import in the real
// source, see `./addCostItem.ts`'s own header comment), `util.cost`
// (`unserialiseCostValue`, for `./editCostValueFormula.ts`), `util.element`
// (`copy`/`copyDeep`/`removeDeep2`/`getPset`/`getPsets`), `util.resource`
// (`getCost`/`getParentCost`/`getQuantity`, for `./calculateCostItemResourceValue.ts`),
// `util.unit` (`getUnitMeasureClass`/`QUANTITY_CLASS`), `util.date` (only transitively,
// via the newly-ported `api.sequence.addDateTime` -- see below).
//
// One genuine, real-Python dependency on the otherwise entirely-unported
// `api.sequence` module: `./addCostSchedule.ts` calls `api.sequence.addDateTime` to
// stamp `IfcCostSchedule.UpdateDate` -- resolved by porting THAT ONE function ahead of
// the rest of `api.sequence` (40 files, ~4257 lines, still entirely unported) into a
// new, deliberately minimal `../sequence/` barrel. See `../sequence/index.ts`'s and
// `../sequence/addDateTime.ts`'s own header comments for the full scope/reasoning.
//
// --- The `ast`/`operator` formula-evaluation question (`./assignCostItemQuantity.ts`) ---
//
// Real Python's `assign_cost_item_quantity.py` (the largest and most complex file in
// this module, 300 lines) uses Python's `ast`/`operator` modules to parse and evaluate
// a small arithmetic-expression mini-language over a product's own Pset/Qto property
// values (e.g. `"Pset_ConcreteElementGeneral.ReinforcementVolumeRatio * NetVolume"`).
// After investigating the actual real-Python node/operator set in full (confirmed by
// reading the source directly, not assumed), this was determined NOT to be a blocker:
// the real grammar is small and closed (5 binary operators + unary minus + dotted names
// + number literals -- see `./assignCostItemQuantity.ts`'s own extensive header comment
// for the full investigation), matching `util/cost.ts`'s own already-established
// "hand-roll a small parser rather than reach for a library" precedent for a
// DIFFERENT, unrelated formula mini-language in this same API family
// (`edit_cost_value_formula.py`'s `Category`/`ArithmeticOperator`/`Components` formula
// language, ported via `util/cost.ts`'s `unserialiseCostValue`/`CostValueUnserialiser`
// -- NOT the same grammar as this one, despite both being called "formula" in their
// respective real Python source files). A small, local, hand-rolled recursive-descent
// tokenizer/parser/evaluator is ported instead, with disclosed divergences (parse-time
// vs. evaluate-time rejection of disallowed syntax) documented in that file.
//
// No other genuinely-unported dependency was found in any of these 20 files (confirmed
// by reading all of them in full, multiple times for the two largest/most complex --
// `assign_cost_item_quantity.py` and `copy_cost_item.py`).
//
// --- Schema differences found (confirmed against all 3 generated `.d.ts` files) ---
//
// IFC2X3's `IfcCostItem` has ONLY `GlobalId`/`OwnerHistory`/`Name`/`Description`/
// `ObjectType` -- no `CostValues`/`CostQuantities`/`PredefinedType` at all (added in
// IFC4). IFC2X3's `IfcCostValue` has no `Category`/`Components`/`ArithmeticOperator`
// either (`CostType` -- required, non-null -- replaces IFC4+'s dropped equivalent
// concept). IFC2X3's `IfcConstructionResource` has no `BaseCosts` (only a single
// `BaseQuantity: IfcMeasureWithUnit`, itself a different TYPE than IFC4+'s
// `IfcPhysicalQuantity`). None of this is proactively guarded anywhere in this port --
// every function throws naturally the moment an IFC2X3-absent attribute is touched,
// exactly matching real Python's own unguarded `AttributeError`, and matching real
// Python's own test suite (`test_add_cost_item_quantity.py`'s own inline comment:
// "CostQuantities was added to IfcCostItem in IFC4" -- that test only runs on IFC4/
// IFC4X3, never IFC2X3). `IfcCostSchedule.UpdateDate` is a real, EXPRESS-level entity-
// vs-string schema divergence (`IfcCalendarDate | IfcDateAndTime | IfcLocalTime` on
// IFC2X3 vs. a plain string on IFC4+) -- exactly why `api.sequence.addDateTime` itself
// branches on schema (see that file).
//
// --- Disclosed real Python quirks/bugs, ported verbatim (see each file's own header
//     comment for the full writeup) ---
//
// - `./copyCostItemValues.ts`: a genuine copy-paste bug -- `remove_cost_value` is
//   called with `source` (not `destination`) as its `parent` argument, harmless in the
//   common (unshared-value) case but a real potential crash for a shared value.
// - `./copyCostItem.ts`: a throwaway `IfcRelNests` shallow copy is created, mutated,
//   and then immediately unassigned-and-deleted by the very next two calls -- real,
//   wasted work, not an optimization opportunity this port silently takes.
// - `./assignCostValue.ts`: `CostValues` is a literal alias (not a deep copy) between
//   two cost items -- intentional per real Python's own docstring, but with a real,
//   disclosed consequence for `./removeCostValue.ts`'s own inverse-count branching.
// - `./removeCostItem.ts`: a parent's `IfcRelNests` shared by 2+ nested children is
//   never explicitly removed when the parent itself is removed (an unexercised-by-
//   real-Python's-own-test-suite latent gap, ported verbatim, not "fixed").
// - Three near-identical-but-subtly-different "recompute the auto-`IfcQuantityCount`"
//   implementations exist across this module (`./addCostItemQuantity.ts`'s module-level
//   version, `./assignCostItemQuantity.ts`'s own internal version, and
//   `./unassignCostItemQuantity.ts`'s own internal version) -- only ONE of the three
//   (`assignCostItemQuantity`'s) excludes `IfcConstructionResource` related objects
//   from the count. All three ported verbatim, none reconciled.
// - `./addCostValue.ts`'s `AppliedValue`/`UnitBasis` write in `./editCostValue.ts` calls
//   `util.element.removeDeep2` on an entity that's STILL forward-referenced at that
//   exact call site -- `removeDeep2`'s own default (`alsoConsider = []`) semantics
//   mean this call is very likely a silent no-op (the old entity is left orphaned
//   rather than purged) -- ported byte-for-byte anyway, matching the EXACT SAME
//   already-accepted call-order precedent in `../pset/editPset.ts`'s own
//   `EnumerationReference`-replacement branch, not a new pattern.
//
// Namespaced as `api.cost.addCostItem`/etc., matching `util/index.ts`'s per-submodule
// convention.
export { addCostItem } from "./addCostItem";
export type { AddCostItemSettings } from "./addCostItem";
export { addCostItemQuantity } from "./addCostItemQuantity";
export type { AddCostItemQuantitySettings } from "./addCostItemQuantity";
export { addCostSchedule } from "./addCostSchedule";
export type { AddCostScheduleSettings } from "./addCostSchedule";
export { addCostValue } from "./addCostValue";
export type { AddCostValueSettings } from "./addCostValue";
export { assignCostItemQuantity } from "./assignCostItemQuantity";
export type { AssignCostItemQuantitySettings } from "./assignCostItemQuantity";
export { assignCostValue } from "./assignCostValue";
export type { AssignCostValueSettings } from "./assignCostValue";
export { calculateCostItemResourceValue } from "./calculateCostItemResourceValue";
export type { CalculateCostItemResourceValueSettings } from "./calculateCostItemResourceValue";
export { copyCostItem } from "./copyCostItem";
export type { CopyCostItemSettings } from "./copyCostItem";
export { copyCostItemValues } from "./copyCostItemValues";
export type { CopyCostItemValuesSettings } from "./copyCostItemValues";
export { copyCostSchedule } from "./copyCostSchedule";
export type { CopyCostScheduleSettings } from "./copyCostSchedule";
export { editCostItem } from "./editCostItem";
export type { EditCostItemSettings } from "./editCostItem";
export { editCostItemQuantity } from "./editCostItemQuantity";
export type { EditCostItemQuantitySettings } from "./editCostItemQuantity";
export { editCostSchedule } from "./editCostSchedule";
export type { EditCostScheduleSettings } from "./editCostSchedule";
export { editCostValue } from "./editCostValue";
export type { EditCostValueSettings } from "./editCostValue";
export { editCostValueFormula } from "./editCostValueFormula";
export type { EditCostValueFormulaSettings } from "./editCostValueFormula";
export { removeCostItem } from "./removeCostItem";
export type { RemoveCostItemSettings } from "./removeCostItem";
export { removeCostItemQuantity } from "./removeCostItemQuantity";
export type { RemoveCostItemQuantitySettings } from "./removeCostItemQuantity";
export { removeCostSchedule } from "./removeCostSchedule";
export type { RemoveCostScheduleSettings } from "./removeCostSchedule";
export { removeCostValue } from "./removeCostValue";
export type { RemoveCostValueSettings } from "./removeCostValue";
export { unassignCostItemQuantity } from "./unassignCostItemQuantity";
export type { UnassignCostItemQuantitySettings } from "./unassignCostItemQuantity";
