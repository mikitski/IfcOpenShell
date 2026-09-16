// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/add_cost_value.py` (src/ifcopenshell-python, 105
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Creates a bare `IfcCostValue` and appends it to whichever
// list-valued attribute `parent` actually owns it from: `IfcCostItem.CostValues`,
// `IfcConstructionResource.BaseCosts`, or `IfcCostValue.Components` -- letting a single
// value be a top-level unit cost OR a sub-component of another value (real Python's own
// docstring: "price subcomponents by using the parent parameter").
//
// No branch matches (`parent` isn't any of the three) -- real Python's own `if`/`elif`/
// `elif` has no final `else`, so nothing is attached anywhere and the function simply
// returns the newly created, unattached `IfcCostValue`. Ported verbatim (no `else`
// throw added).
//
// --- `IfcCostItem.CostValues`/`IfcConstructionResource.BaseCosts` are IFC4+ only ---
//
// Confirmed against `ifc2x3.d.ts`: neither attribute exists there at all (IFC2X3's
// `IfcCostItem` has only `GlobalId`/`OwnerHistory`/`Name`/`Description`/`ObjectType`;
// IFC2X3's `IfcConstructionResource` has no `BaseCosts` either -- only a single
// `BaseQuantity: IfcMeasureWithUnit`). This function throws naturally the moment
// `parent.get(...)`/`parent.set(...)` is reached on IFC2X3 for those two branches, an
// unregistered attribute name -- no proactive guard added, matching real Python having
// none either. The `IfcCostValue.Components` branch has no such restriction (`Category`/
// `Components`/`ArithmeticOperator` are ALSO IFC4+-only on `IfcCostValue` itself,
// confirmed against `ifc2x3.d.ts` -- but that's `edit_cost_value_formula`'s/
// `assign_cost_value`'s territory to disclose, not this file's).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddCostValueSettings {
	/**
	 * A parent `IfcCostItem`, if specifying a price directly to a cost item, or a top-
	 * level price component. Alternatively, this can be set to an `IfcCostValue`, if
	 * specifying price subcomponents, or an `IfcConstructionResource`.
	 */
	parent: EntityInstance;
}

function addCostValueUsecase(file: IfcFile, settings: AddCostValueSettings): EntityInstance {
	const { parent } = settings;
	const value = file.createEntity("IfcCostValue");

	if (parent.isA("IfcCostItem")) {
		const values = [...((parent.get("CostValues") as EntityInstance[] | null) ?? []), value];
		parent.set("CostValues", values);
	} else if (parent.isA("IfcConstructionResource")) {
		const values = [...((parent.get("BaseCosts") as EntityInstance[] | null) ?? []), value];
		parent.set("BaseCosts", values);
	} else if (parent.isA("IfcCostValue")) {
		const values = [...((parent.get("Components") as EntityInstance[] | null) ?? []), value];
		parent.set("Components", values);
	}
	return value;
}

/**
 * Adds a new value or subvalue to a cost item (Python: `ifcopenshell.api.cost.add_cost_value`).
 *
 * A cost item's subtotal can be specified in two ways.
 *
 * Option 1 is by simply manually specifying the subtotal value, which represents the
 * full cost of that cost item. This option occurs when a cost item has no quantities
 * associated with it.
 *
 * Option 2 is by specifying a unit cost value of the cost item, which is then
 * multiplied by the associated quantity of the cost item, to give us the subtotal.
 * This option occurs when a cost item has quantities associated with it.
 *
 * For either option, the cost value may be specified as a single number, or as a sum
 * of subcomponents or formulas (e.g. multiplication by wastage factor, or adding taxes
 * or other adjustments).
 *
 * @returns The newly created `IfcCostValue`.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 *
 * // Option 1: This cost item will have a full cost of 42.0.
 * const item1 = api.cost.addCostItem(model, { costSchedule: schedule });
 * const value = api.cost.addCostValue(model, { parent: item1 });
 * api.cost.editCostValue(model, { costValue: value, attributes: { AppliedValue: 42.0 } });
 *
 * // A cost value may also be specified as the sum of its subcomponents.
 * const item2 = api.cost.addCostItem(model, { costSchedule: schedule });
 * const value2 = api.cost.addCostValue(model, { parent: item2 });
 * const subvalue1 = api.cost.addCostValue(model, { parent: value2 });
 * const subvalue2 = api.cost.addCostValue(model, { parent: value2 });
 * ```
 */
export const addCostValue = wrapUsecase("cost.add_cost_value", addCostValueUsecase);
