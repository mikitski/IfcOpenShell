// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/add_cost_item_quantity.py` (src/ifcopenshell-python,
// 90 lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s
// own header comment). Creates a new `IfcPhysicalSimpleQuantity` subtype
// (`IfcQuantityCount`/`IfcQuantityLength`/etc.) and appends it to
// `costItem.CostQuantities`.
//
// --- `quantity[3] = count` / `quantity[3] = 0.0`, ported via `setByIndex(3, ...)` ---
//
// Real Python's own inline comment: `# 3 IfcPhysicalSimpleQuantity Value` -- every
// `IfcPhysicalSimpleQuantity` subtype shares the same attribute layout (`Name`/
// `Description`/`Unit`/`<X>Value`/`Formula` on IFC4+, no `Formula` on IFC2X3), index 3
// is always that subtype's own `Value` field -- confirmed against `ifc4.d.ts`, matching
// `../resource/addResourceQuantity.ts`'s own identical, already-disclosed finding for
// this exact index (not re-derived from scratch here).
//
// --- `CostQuantities` is IFC4+ only, confirmed by reading `ifc2x3.d.ts` ---
//
// `IfcCostItem` on IFC2X3 has only `GlobalId`/`OwnerHistory`/`Name`/`Description`/
// `ObjectType` -- no `CostQuantities` attribute at all. This function throws naturally
// on IFC2X3 the moment `costItem.get("CostQuantities")`/`.set("CostQuantities", ...)`
// is reached (an unregistered attribute name), exactly matching real Python's own
// `AttributeError` for the same reason -- no proactive guard added here, matching real
// Python having none either. Real Python's own test (`test_add_cost_item_quantity.py`)
// only ever runs this against IFC4/IFC4X3, never IFC2X3, confirming this isn't an
// oversight on the Python side either.
//
// --- "This is a bold assumption" -- real Python's own inline comment, ported verbatim ---
//
// The `IfcQuantityCount` auto-count branch sums `rel.RelatedObjects.length` across
// EVERY `costItem.Controls` rel with no filtering of any kind (unlike
// `./assignCostItemQuantity.ts`'s OWN internal `update_cost_item_count`, which
// deliberately excludes `IfcConstructionResource` related objects from the same kind
// of count -- a real, disclosed asymmetry between the two functions, both preserved
// verbatim, not reconciled).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type { QUANTITY_CLASS } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddCostItemQuantitySettings {
	/** The `IfcCostItem` to add the quantity to. */
	costItem: EntityInstance;
	/** The type of quantity to add. Python default: `"IfcQuantityCount"`. */
	ifcClass?: QUANTITY_CLASS;
}

function addCostItemQuantityUsecase(file: IfcFile, settings: AddCostItemQuantitySettings): EntityInstance {
	const { costItem } = settings;
	const ifcClass = settings.ifcClass ?? "IfcQuantityCount";

	const quantity = file.createEntity(ifcClass, "Unnamed");
	// 3 IfcPhysicalSimpleQuantity Value -- see this file's header comment.
	if (ifcClass === "IfcQuantityCount") {
		let count = 0;
		for (const rel of costItem.get("Controls") as EntityInstance[]) {
			count += (rel.get("RelatedObjects") as EntityInstance[]).length;
		}
		quantity.setByIndex(3, count);
	} else {
		quantity.setByIndex(3, 0.0);
	}
	const quantities = [...((costItem.get("CostQuantities") as EntityInstance[] | null) ?? []), quantity];
	costItem.set("CostQuantities", quantities);
	return quantity;
}

/**
 * Adds a new quantity associated with a cost item (Python: `ifcopenshell.api.cost.add_cost_item_quantity`).
 *
 * Cost items calculate their subtotal by multiplying the sum of the cost item's
 * "values" by the sum of the cost item's "quantities". The quantities may be either
 * parametrically linked to quantities measured on physical product, or manually
 * specified.
 *
 * A cost item must not mix quantities of different types.
 *
 * If an `IfcQuantityCount` is used, this API automatically counts all products that
 * this cost item controls (see `api.control.assignControl`) and prefills that
 * quantity. For all other quantity types, the quantity is left as zero.
 *
 * @returns The newly created quantity entity.
 *
 * @example
 * ```ts
 * const chair = api.root.createEntity(model, { ifcClass: "IfcFurniture" });
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * api.control.assignControl(model, { relatingControl: item, relatedObjects: [chair] });
 *
 * // Because this is an IfcQuantityCount the count will be automatically set to "1" chair.
 * api.cost.addCostItemQuantity(model, { costItem: item, ifcClass: "IfcQuantityCount" });
 * ```
 */
export const addCostItemQuantity = wrapUsecase("cost.add_cost_item_quantity", addCostItemQuantityUsecase);
