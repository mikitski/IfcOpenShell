// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/cost/test_add_cost_item_quantity.py`'s `TestAddCostItemQuantity`
// (real Python runs this against IFC4 and IFC4X3 ONLY -- its own inline comment: "#
// CostQuantities was added to IfcCostItem in IFC4", never run against IFC2X3, gated
// here the same way with `describe.each(AVAILABLE_SCHEMAS.filter(...))` per this
// project's established discipline for avoiding "No schema loaded" CI failures).
//
// Real Python enumerates `IfcPhysicalSimpleQuantity`'s subtypes dynamically via schema
// introspection (`schema.declaration_by_name(...).as_entity().subtypes()`) -- this port
// has no equivalent schema-introspection primitive readily available, so the same
// subtypes are hardcoded instead, matching `util/unit.ts`'s own `QUANTITY_CLASS` union.
//
// --- Real, disclosed schema difference: `IfcQuantityNumber` is IFC4X3-only ---
//
// Confirmed against `ifc4.d.ts` (no `IfcQuantityNumber` interface at all) vs.
// `ifc4x3.d.ts` (has one) -- `IfcQuantityNumber` was only added in IFC4X3, unlike
// `util/unit.ts`'s own flat `QUANTITY_CLASS` union, which doesn't distinguish schema
// versions (matching real Python's own flat `Literal[...]` type hint, which has the
// exact same schema-blind limitation). `addCostItemQuantity` itself has no proactive
// guard against this either -- `file.createEntity("IfcQuantityNumber", ...)` simply
// throws naturally on IFC4 (an unregistered class name). This test's own quantity-type
// list is filtered per schema to avoid that, rather than working around it in the
// function under test.

import { describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostItemQuantity } from "../../../src/api/cost/addCostItemQuantity";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { QUANTITY_CLASS } from "../../../src/util/unit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const QUANTITY_TYPES: readonly QUANTITY_CLASS[] = [
	"IfcQuantityCount",
	"IfcQuantityLength",
	"IfcQuantityArea",
	"IfcQuantityVolume",
	"IfcQuantityWeight",
	"IfcQuantityTime",
];

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.addCostItemQuantity (%s)", (schema) => {
	test("adds every quantity type, auto-counting IfcQuantityCount from controlled objects", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		assignControl(file, { relatingControl: item, relatedObjects: [wall] });

		// `IfcQuantityNumber` is IFC4X3-only -- see this file's header comment.
		const quantityTypes =
			schema === "IFC4X3" ? [...QUANTITY_TYPES, "IfcQuantityNumber" as QUANTITY_CLASS] : QUANTITY_TYPES;

		const quantities: EntityInstance[] = [];
		for (const quantityType of quantityTypes) {
			const quantity = addCostItemQuantity(file, { costItem: item, ifcClass: quantityType });
			expect(quantity.isA(quantityType)).toBe(true);
			expect(quantity.get("Name")).toBe("Unnamed");
			if (quantityType === "IfcQuantityCount") {
				expect(quantity.getByIndex(3)).toBe(1);
			} else {
				expect(quantity.getByIndex(3)).toBe(0.0);
			}
			quantities.push(quantity);
		}
		const costQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(costQuantities.length).toBe(quantities.length);
		for (let i = 0; i < quantities.length; i++) {
			expect(costQuantities[i].equals(quantities[i])).toBe(true);
		}
	});
});
