// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_cost_item_quantity.py` (see
// `test/api/cost/` -- no `test_assign_cost_item_quantity.py`), only the docstring's
// own worked examples. This suite is written directly from the real source's own
// behavior -- BY FAR the largest and most complex file in this chunk (300 lines) --
// covering all three modes (no `propName`/`formula`, `propName`, `formula`), the
// `IfcSpatialElement` skip, and the hand-rolled formula parser/evaluator (see
// `../../../src/api/cost/assignCostItemQuantity.ts`'s own extensive header comment for
// the "ast/operator" investigation this pins).
//
// `CostQuantities` is IFC4+ only (see `./addCostItemQuantity.test.ts`'s own header
// comment), so this suite is gated to non-IFC2X3 schemas.
//
// `Pset_*`-based formula variables need a real `IfcPropertySingleValue.NominalValue`
// -- `api.pset.editPset` cannot build one from a plain scalar today (the identical,
// already 8-times-confirmed `TODOS.md` primitive-layer gap `./editCostValue.test.ts`
// also hits, per `editPset.ts`'s own header comment's "THIRD INDEPENDENT
// CONFIRMATION"). This suite's own local `addPsetProperty` fixture helper below builds
// the property directly with a RAW, unwrapped `NominalValue` instead (verified against
// `util/element.ts`'s own `getProperty`/`unwrapSelectValue`, which already handles an
// unwrapped bare primitive `NominalValue` fine) -- a pragmatic fixture-only workaround
// for `assignCostItemQuantity`'s own READ path, not a claim that `editPset` itself is
// unblocked.

import { beforeEach, describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { assignCostItemQuantity } from "../../../src/api/cost/assignCostItemQuantity";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addPset } from "../../../src/api/pset/addPset";
import { addQto } from "../../../src/api/pset/addQto";
import { editQto } from "../../../src/api/pset/editQto";
import { addResource } from "../../../src/api/resource/addResource";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

/** See this file's header comment -- a local fixture helper that bypasses
 * `editPset`'s own blocked wrapping by writing a RAW, unwrapped `NominalValue`
 * directly onto a freshly created `IfcPropertySingleValue`. */
function addPsetProperty(file: IfcFile, pset: EntityInstance, propName: string, value: number): void {
	const prop = file.createEntity("IfcPropertySingleValue");
	prop.set("Name", propName);
	prop.set("NominalValue", value);
	const hasProperties = [...((pset.get("HasProperties") as EntityInstance[] | null) ?? []), prop];
	pset.set("HasProperties", hasProperties);
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.assignCostItemQuantity (%s)", (schema) => {
	test("no propName/formula: assigns control and auto-counts, excluding IfcConstructionResource", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const slab = createEntity(file, { ifcClass: "IfcSlab" });
		const crew = addResource(file, { ifcClass: "IfcCrewResource" });

		assignCostItemQuantity(file, { costItem: item, products: [wall, slab, crew] });

		const controls = item.get("Controls") as EntityInstance[];
		expect(controls.length).toBe(1);
		expect((controls[0].get("RelatedObjects") as EntityInstance[]).length).toBe(3);

		const costQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(costQuantities.length).toBe(1);
		expect(costQuantities[0].isA("IfcQuantityCount")).toBe(true);
		// wall + slab count, crew (an IfcConstructionResource) is excluded.
		expect(costQuantities[0].getByIndex(3)).toBe(2);
	});

	test("IfcSpatialElement (not IfcSpace) is skipped entirely -- not even control-assigned", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const building = createEntity(file, { ifcClass: "IfcBuilding" });
		const space = createEntity(file, { ifcClass: "IfcSpace" });

		assignCostItemQuantity(file, { costItem: item, products: [building, space] });

		const controls = (item.get("Controls") as EntityInstance[] | null) ?? [];
		expect(controls.length).toBe(1);
		const relatedObjects = controls[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(space)).toBe(true);
	});

	test("propName mode: links to an existing named quantity on the product's own qto", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const slab = createEntity(file, { ifcClass: "IfcSlab" });
		const qto = addQto(file, { product: slab, name: "Qto_SlabBaseQuantities" });
		editQto(file, { qto, properties: { NetVolume: 42.0 } });

		assignCostItemQuantity(file, { costItem: item, products: [slab], propName: "NetVolume" });

		const costQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(costQuantities.length).toBe(1);
		expect(costQuantities[0].isA("IfcQuantityVolume")).toBe(true);
		expect(costQuantities[0].getByIndex(3)).toBe(42.0);

		// The parametric link is the SAME entity, not a copy -- editing the product's
		// own quantity later is reflected in the cost item too.
		editQto(file, { qto, properties: { NetVolume: 100.0 } });
		expect((item.get("CostQuantities") as EntityInstance[])[0].getByIndex(3)).toBe(100.0);
	});

	test("propName mode: a product whose first existing quantity name doesn't match is skipped", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const slab1 = createEntity(file, { ifcClass: "IfcSlab" });
		const qto1 = addQto(file, { product: slab1, name: "Qto_SlabBaseQuantities" });
		editQto(file, { qto: qto1, properties: { NetVolume: 1.0 } });
		assignCostItemQuantity(file, { costItem: item, products: [slab1], propName: "NetVolume" });

		const slab2 = createEntity(file, { ifcClass: "IfcSlab" });
		const qto2 = addQto(file, { product: slab2, name: "Qto_SlabBaseQuantities" });
		editQto(file, { qto: qto2, properties: { GrossVolume: 2.0 } });

		assignCostItemQuantity(file, { costItem: item, products: [slab2], propName: "GrossVolume" });

		// slab2's GrossVolume quantity is never added: the FIRST existing quantity's
		// own name ("NetVolume") doesn't match "GrossVolume", so slab2 is skipped.
		const costQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(costQuantities.length).toBe(1);
		expect(costQuantities[0].get("Name")).toBe("NetVolume");
	});

	test("formula mode: evaluates an arithmetic expression over Pset/Qto properties", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const qto = addQto(file, { product: wall, name: "Qto_WallBaseQuantities" });
		editQto(file, { qto, properties: { NetVolume: 10.0 } });
		const pset = addPset(file, { product: wall, name: "Pset_ConcreteElementGeneral" });
		addPsetProperty(file, pset, "ReinforcementVolumeRatio", 0.05);

		assignCostItemQuantity(file, {
			costItem: item,
			products: [wall],
			formula: "Pset_ConcreteElementGeneral.ReinforcementVolumeRatio * NetVolume",
			ifcClass: "IfcQuantityVolume",
		});

		const costQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(costQuantities.length).toBe(1);
		expect(costQuantities[0].isA("IfcQuantityVolume")).toBe(true);
		expect(costQuantities[0].get("Formula")).toBe("Pset_ConcreteElementGeneral.ReinforcementVolumeRatio * NetVolume");
		expect(costQuantities[0].getByIndex(3)).toBeCloseTo(0.5, 10);
		// A control relationship is also established.
		const controls = item.get("Controls") as EntityInstance[];
		expect((controls[0].get("RelatedObjects") as EntityInstance[])[0].equals(wall)).toBe(true);
	});

	test("formula mode: reuses the existing quantity with the same formula for a single-product call", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const qto = addQto(file, { product: wall, name: "Qto_WallBaseQuantities" });
		editQto(file, { qto, properties: { NetVolume: 10.0 } });

		assignCostItemQuantity(file, {
			costItem: item,
			products: [wall],
			formula: "NetVolume * 2",
			ifcClass: "IfcQuantityVolume",
		});
		const firstQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(firstQuantities.length).toBe(1);
		const firstQuantityId = firstQuantities[0].id();

		editQto(file, { qto, properties: { NetVolume: 20.0 } });
		assignCostItemQuantity(file, {
			costItem: item,
			products: [wall],
			formula: "NetVolume * 2",
			ifcClass: "IfcQuantityVolume",
		});

		const secondQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(secondQuantities.length).toBe(1);
		expect(secondQuantities[0].id()).toBe(firstQuantityId);
		expect(secondQuantities[0].getByIndex(3)).toBeCloseTo(40.0, 10);
	});

	test("formula mode: supports unary minus and exponentiation with correct precedence", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const qto = addQto(file, { product: wall, name: "Qto_WallBaseQuantities" });
		editQto(file, { qto, properties: { NetVolume: 2.0 } });

		// -2**2 == -(2**2) == -4, matching Python's own operator precedence.
		assignCostItemQuantity(file, {
			costItem: item,
			products: [wall],
			formula: "-NetVolume**2",
			ifcClass: "IfcQuantityVolume",
		});

		const costQuantities = item.get("CostQuantities") as EntityInstance[];
		expect(costQuantities[0].getByIndex(3)).toBe(-4);
	});

	test("formula mode: an unsupported expression throws at parse time", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const wall = createEntity(file, { ifcClass: "IfcWall" });

		expect(() => assignCostItemQuantity(file, { costItem: item, products: [wall], formula: "foo(1)" })).toThrow();
	});
});
