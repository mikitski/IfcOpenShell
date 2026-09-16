// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/calculate_cost_item_resource_value.py` (src/
// ifcopenshell-python, 112 lines) -- part of this project's brand-new `api.cost` chunk
// (see `./index.ts`'s own header comment). Clears `costItem`'s existing cost values,
// then rebuilds one `IfcCostValue` per `IfcConstructionResource` that `costItem`
// controls (directly, or indirectly via a controlled `IfcTask`'s own `OperatesOn`
// resources), each as a `"{cost}*{quantity}"` formula applied via
// `./editCostValueFormula.ts`.
//
// --- `IfcTask.OperatesOn` -- a dynamic inverse attribute, not in the generated `.d.ts` ---
//
// Like `util/element.ts`'s own `DefinesOccurrence`/`PropertyDefinitionOf` precedent,
// `OperatesOn` (the inverse of `IfcRelAssignsToProcess.RelatingProcess`) is resolved
// entirely at runtime through `EntityInstance.get()`'s own dynamic attribute-category
// resolution -- it doesn't appear as a forward attribute in `ifc4.d.ts`'s
// `IfcTask`/`IfcProcess` interfaces, but `.get("OperatesOn")` still works correctly.
//
// --- `"{}*{}".format(cost, quantity)` -- Python `str()`-formatting a float, a known,
//     already-tracked divergence, not a new finding ---
//
// A JS template literal (`` `${cost}*${quantity}` ``) renders a whole-number `cost`
// (e.g. `42.0`) as `"42"`, not Python's `"42.0"` -- the exact same already-tracked
// int-vs-float `str()`-rendering divergence `util/cost.ts`'s own header comment (finding
// #2) and `TODOS.md` document for `serialiseAppliedValue`. Cosmetic only: this port's
// own hand-rolled cost-formula parser (`util/cost.ts`'s `CostValueUnserialiser`,
// consumed via `./editCostValueFormula.ts`) re-parses `"42"` as a plain `NUMBER` token
// fine, so the calculated `AppliedValue` round-trips to the identical numeric result --
// only the exact serialised formula *string* differs from what real Python would
// produce for a whole-number `cost`/`quantity`. Not re-filed as a new `TODOS.md` entry,
// cross-referenced to the existing one instead.
//
// --- BLOCKED (disclosed, transitively): every real call ultimately hits
//     `./editCostValueFormula.ts`'s own already-disclosed `AppliedValue`-wrapping
//     blocker ---
//
// This function's very last step, for every resource with a resolvable cost, calls
// `./editCostValueFormula.ts` with a genuine numeric `"{cost}*{quantity}"` formula --
// which (per that file's own header comment) hits the already 6-times-confirmed
// `TODOS.md` primitive-layer gap the moment it tries to materialize the computed
// `AppliedValue`. Ported completely and faithfully anyway: every step up to and
// including `addCostValue`/`costValue.set("Name", ...)` (real entities, unaffected)
// runs to completion before the throw. `calculateCostItemResourceValue.test.ts` pins
// this CURRENT, disclosed, blocked behavior with a dedicated test.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getCost, getParentCost, getQuantity } from "../../util/resource";
import { wrapUsecase } from "../hooks";
import { addCostValue } from "./addCostValue";
import { editCostValueFormula } from "./editCostValueFormula";
import { removeCostValue } from "./removeCostValue";

export interface CalculateCostItemResourceValueSettings {
	/** The `IfcCostItem` to calculate. */
	costItem: EntityInstance;
}

function calculateCostItemResourceValueUsecase(file: IfcFile, settings: CalculateCostItemResourceValueSettings): void {
	const { costItem } = settings;

	const existingCostValues = (costItem.get("CostValues") as EntityInstance[] | null) ?? [];
	for (const costValue of existingCostValues) {
		removeCostValue(file, { parent: costItem, costValue });
	}

	const resources: EntityInstance[] = [];
	for (const rel of (costItem.get("Controls") as EntityInstance[] | null) ?? []) {
		for (const relatedObject of rel.get("RelatedObjects") as EntityInstance[]) {
			if (relatedObject.isA("IfcConstructionResource")) {
				resources.push(relatedObject);
			} else if (relatedObject.isA("IfcTask")) {
				for (const rel2 of (relatedObject.get("OperatesOn") as EntityInstance[] | null) ?? []) {
					for (const relatedObject2 of rel2.get("RelatedObjects") as EntityInstance[]) {
						if (relatedObject2.isA("IfcConstructionResource")) {
							resources.push(relatedObject2);
						}
					}
				}
			}
		}
	}

	for (const resource of resources) {
		let [cost, unit] = getCost(resource);
		if (cost === null) {
			const parentCost = getParentCost(resource);
			if (parentCost) [cost, unit] = parentCost;
		}
		let quantity = getQuantity(resource);
		if (cost === null) continue;
		if (unit?.includes("day")) {
			// Assume an 8 hour working day -- TODO implement resource calendar (real
			// Python's own inline TODO, ported verbatim).
			quantity = quantity / 8;
		}
		const formula = `${cost}*${quantity}`;
		const costValue = addCostValue(file, { parent: costItem });
		costValue.set("Name", resource.get("Name"));
		editCostValueFormula(file, { costValue, formula });
	}
}

/**
 * Calculates the total cost of all resources associated with a cost item (Python:
 * `ifcopenshell.api.cost.calculate_cost_item_resource_value`).
 *
 * A cost item may have construction resources (e.g. equipment, material, etc)
 * assigned to it. Construction resources may be assigned directly to the cost item, or
 * assigned first to a task, and the task is then assigned to the cost item.
 *
 * The cost of a resource is calculated by the total sum of all of its base costs. If
 * no quantity is provided, that sum is considered to be the total cost. Otherwise, it
 * is considered to be a unit cost, and is then multiplied by the resource quantity.
 *
 * The final calculated cost is set as the cost item's value. Any previously existing
 * values are removed.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * const concrete = api.resource.addResource(model, {
 * 	ifcClass: "IfcConstructionMaterialResource",
 * 	parentResource: crew,
 * });
 * api.control.assignControl(model, { relatingControl: item, relatedObjects: [concrete] });
 *
 * const value = api.cost.addCostValue(model, { parent: concrete });
 * api.cost.editCostValue(model, { costValue: value, attributes: { AppliedValue: 42.0 } });
 * const quantity = api.resource.addResourceQuantity(model, { resource: concrete, ifcClass: "IfcQuantityVolume" });
 * api.resource.editResourceQuantity(model, { physicalQuantity: quantity, attributes: { VolumeValue: 200.0 } });
 *
 * // (42 * 200) = 8400 is our calculated cost.
 * api.cost.calculateCostItemResourceValue(model, { costItem: item });
 * ```
 */
export const calculateCostItemResourceValue = wrapUsecase(
	"cost.calculate_cost_item_resource_value",
	calculateCostItemResourceValueUsecase,
);
