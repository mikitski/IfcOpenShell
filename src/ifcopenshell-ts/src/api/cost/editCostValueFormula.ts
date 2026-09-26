// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/edit_cost_value_formula.py` (src/ifcopenshell-python,
// 80 lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s
// own header comment). Parses a spreadsheet-like formula string (the mini-language
// documented on `util.cost`, e.g. `"5000 * 1.19"` or `"SUM(500) + 42"`) via the
// already-landed `util.cost.unserialiseCostValue`, then recursively writes the parsed
// shape onto `costValue` (and any nested `Components`), reusing existing sub-`IfcCostValue`
// entities positionally where `unserialiseCostValue`'s own `mapElementToResult` step
// already paired them, and creating new ones (via `./addCostValue.ts`) otherwise.
//
// --- `formula or {}` / `unserialiseCostValue` on an empty/falsy formula: a real,
//     disclosed no-op escape hatch, ported via `try`/`catch` ---
//
// Real Python: `self.settings = {"cost_value": cost_value, "formula": formula or {}}`
// -- an EMPTY dict `{}` is substituted for a falsy `formula` (`""`/`None`), which is
// then handed to `ifcopenshell.util.cost.unserialise_cost_value(dict_here, cost_value)`
// -- a call real Python's own bare `except: return` immediately swallows (Lark's
// `.parse()` rejects a non-`str` input). This port's `unserialiseCostValue` is typed to
// take a `string` (see `util/cost.ts`), so an empty/falsy `formula` is passed through
// as the literal empty string `""` instead of a dict-shaped stand-in -- this port's own
// hand-rolled recursive-descent parser (`CostValueUnserialiser`, `util/cost.ts`) also
// throws for `""` (no valid `operand` to parse), landing in the exact same `catch {
// return; }` no-op path as real Python's dict-shaped input does. Functionally
// equivalent (both "no formula" inputs no-op), even though the exact THING that fails
// to parse differs in shape (an empty dict vs. an empty string) -- disclosed here, not
// silently assumed identical.
//
// --- Recursive attribute application: `ifc.Category`/`ifc.ArithmeticOperator` are
//     ALWAYS unconditionally overwritten (including to `null`), never left alone ---
//
// Real Python's `ifc.Category = data["Category"] if "Category" in data else None` (and
// the identical shape for `ArithmeticOperator`) means every single call to this
// function REWRITES every visited `IfcCostValue`'s `Category`/`ArithmeticOperator` to
// whatever the freshly re-parsed formula says (`None` if the formula's parsed shape
// doesn't carry that key at this node), even for an existing, reused sub-`IfcCostValue`
// (`data.ifc` already set via `mapElementToResult`) -- there is no "leave previously-set
// Category alone" case. Ported verbatim via the same unconditional `.set(...)` calls
// below, not narrowed to only fire on a freshly created value.
//
// --- BLOCKED (disclosed, confirmed empirically): the `AppliedValue`-wrapping line hits
//     the already 6-times-confirmed `TODOS.md` primitive-layer gap -- see
//     `../../../src/api/cost/editCostValue.ts`'s own header comment for the full
//     writeup (this file is the SAME already-disclosed gap's SEVENTH confirmed
//     instance, an `UPDATE` to that one `TODOS.md` entry, not a new one) ---
//
// Every leaf `CostValueFormula` node this function's own recursion ever reaches with a
// truthy `AppliedValue` (i.e. every actual numeric formula operand -- `"5000 * 1.19"`
// parses into TWO such leaves, `"SUM(2)"` into one) hits `file.createEntity
// ("IfcMonetaryMeasure", data.AppliedValue)`, the identical blocked construction
// `editCostValue.ts`'s own `AppliedValue` branch already documents. In practice this
// means `edit_cost_value_formula`'s real end-to-end usefulness (actually WRITING a
// computed numeric value) is blocked for essentially every realistic formula today --
// only the `Category`/`ArithmeticOperator`-setting bookkeeping and the (re)use of
// already-`ifc`-paired existing sub-`IfcCostValue`s that need no NEW `AppliedValue`
// write run to completion. Ported completely and faithfully anyway; `applyCostValue`'s
// own call ordering (`ifc.set("Category", ...)`/`ifc.set("ArithmeticOperator", ...)`
// BEFORE the `AppliedValue` write, matching real Python's own statement order) means
// whatever's already been committed at the moment of the throw stays committed, exactly
// mirroring what real Python's own call ordering would also have already committed.
// `editCostValueFormula.test.ts` pins this CURRENT, disclosed, blocked behavior with a
// dedicated test (matching `editPset.test.ts`'s own established precedent), not
// silently skipped.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type CostValueFormula, unserialiseCostValue } from "../../util/cost";
import { wrapUsecase } from "../hooks";
import { addCostValue } from "./addCostValue";

/**
 * Python's `Usecase.edit_cost_value(data, parent=None)`. Recursively applies a parsed
 * `CostValueFormula` node onto its already-paired `IfcCostValue` (`data.ifc`, attached
 * by `unserialiseCostValue`'s own `mapElementToResult` step), or a freshly created one
 * (via `addCostValue`, nested under `parent`) when no existing entity was paired.
 */
function applyCostValue(file: IfcFile, data: CostValueFormula, parent: EntityInstance | null = null): void {
	let ifc = data.ifc ?? null;
	if (!ifc) {
		// Python's `add_cost_value(self.file, parent=parent)` -- `parent` is only ever
		// actually `null` for the ROOT call, but the ROOT `data.ifc` is always already
		// set (to the original `costValue` passed into `unserialiseCostValue`, per that
		// function's own `mapElementToResult`), so this branch is only ever reached for
		// a genuinely NEW nested component, which always has a real `parent`.
		ifc = addCostValue(file, { parent: parent as EntityInstance });
	}

	if ("AppliedValue" in data) {
		if (data.AppliedValue) {
			ifc.set("AppliedValue", file.createEntity("IfcMonetaryMeasure", data.AppliedValue));
		} else {
			ifc.set("AppliedValue", null);
		}
	}
	ifc.set("Category", "Category" in data ? (data.Category ?? null) : null);
	ifc.set("ArithmeticOperator", "ArithmeticOperator" in data ? (data.ArithmeticOperator ?? null) : null);
	if ("Components" in data) {
		for (const component of data.Components ?? []) {
			applyCostValue(file, component, ifc);
		}
	}
}

export interface EditCostValueFormulaSettings {
	/** The `IfcCostValue` to set the values of. */
	costValue: EntityInstance;
	/** The formula following the language of `util.cost`. */
	formula: string;
}

function editCostValueFormulaUsecase(file: IfcFile, settings: EditCostValueFormulaSettings): void {
	let data: CostValueFormula;
	try {
		// See this file's header comment: a falsy `formula` is passed through as `""`,
		// which this port's own parser also throws on, landing in the same no-op path.
		data = unserialiseCostValue(settings.formula || "", settings.costValue);
	} catch {
		return;
	}
	applyCostValue(file, data);
}

/**
 * Sets a cost value based on a formula, similar to formulas in spreadsheets (Python:
 * `ifcopenshell.api.cost.edit_cost_value_formula`).
 *
 * Costs may be made up of many components (e.g. labour, material, waste factor, taxes,
 * etc). This can be easily represented in the form of a formula similar to what would
 * be used in spreadsheet applications.
 *
 * For more information, see `util.cost`.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * const value = api.cost.addCostValue(model, { parent: item });
 * api.cost.editCostValueFormula(model, { costValue: value, formula: "5000 * 1.19" });
 * ```
 */
export const editCostValueFormula = wrapUsecase("cost.edit_cost_value_formula", editCostValueFormulaUsecase);
