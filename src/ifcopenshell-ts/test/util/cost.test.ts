// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_cost.py` (src/ifcopenshell-python) -- that file is
// tiny (only `TestGetCostItemForProduct`, three cases, ported below verbatim in shape)
// and has NO coverage at all for the formula-language parser/serialiser, the
// value-aggregation functions, or most of the graph-traversal queries (confirmed by
// reading the whole file) -- everything else below is original coverage written
// directly against `cost.py`'s own source / `cost.ts`'s port, matching
// `util/element.ts`/`util/system.ts`'s established precedent for functions Python
// itself doesn't directly test.
//
// Python's own `TestGetCostItemForProduct` fixtures go through `ifcopenshell.api.cost
// .add_cost_schedule`/`add_cost_item`/`ifcopenshell.api.control.assign_control`/
// `ifcopenshell.api.root.create_entity`, none of which exist yet in this TS port
// (`api` is Phase 6+). Local fixture helpers below build the same underlying entity
// graphs directly (`file.createEntity(...)` + `.set(...)`), matching
// `test/util/constraint.test.ts`/`test/util/system.test.ts`'s own established pattern
// for this exact same gap. Only IFC4 is exercised (matching `test_cost.py`'s own
// `test.bootstrap.IFC4`-only scope) -- no test here loops across schema versions, so
// `AVAILABLE_SCHEMAS`/`ALL_SCHEMAS` gating doesn't apply (see `test/bootstrap.ts`'s own
// header comment for when that gating is actually needed).

import { describe, expect, test } from "vitest";
import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import * as subject from "../../src/util/cost";
import { createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header
// comment; `createTypedValue` matches `test/util/unit.test.ts`'s own established
// helper of the same name/shape byte-for-byte) ---

function createTypedValue(file: IfcFile, className: string, value: number | string): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	let variant: { kind: number; string_value?: unknown; double_value?: unknown };
	if (typeof value === "string") {
		variant = { kind: native.STRING, string_value: value };
	} else {
		variant = { kind: native.DOUBLE, double_value: value };
	}
	new NativeEntityInstance(handle._handle).set_attribute_value(0, variant);
	return new EntityInstance(handle._handle, file);
}

function money(file: IfcFile, value: number): EntityInstance {
	return createTypedValue(file, "IfcMonetaryMeasure", value);
}

function createCostSchedule(file: IfcFile): EntityInstance {
	return file.createEntity("IfcCostSchedule");
}

function createCostItem(file: IfcFile, name?: string): EntityInstance {
	const item = file.createEntity("IfcCostItem");
	if (name !== undefined) item.set("Name", name);
	return item;
}

function assignControl(
	file: IfcFile,
	relatingControl: EntityInstance,
	relatedObjects: EntityInstance[],
): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToControl");
	rel.set("RelatingControl", relatingControl);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

function nest(file: IfcFile, relatingObject: EntityInstance, relatedObjects: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelNests");
	rel.set("RelatingObject", relatingObject);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

interface CostValueOptions {
	name?: string;
	appliedValue?: number;
	category?: string;
	unitBasisValue?: number;
	unitBasisUnit?: EntityInstance;
}

function createCostValue(file: IfcFile, options: CostValueOptions = {}): EntityInstance {
	const cv = file.createEntity("IfcCostValue");
	if (options.name !== undefined) cv.set("Name", options.name);
	if (options.category !== undefined) cv.set("Category", options.category);
	if (options.appliedValue !== undefined) cv.set("AppliedValue", money(file, options.appliedValue));
	if (options.unitBasisValue !== undefined && options.unitBasisUnit) {
		const measureWithUnit = file.createEntity("IfcMeasureWithUnit");
		measureWithUnit.set("ValueComponent", createTypedValue(file, "IfcNumericMeasure", options.unitBasisValue));
		measureWithUnit.set("UnitComponent", options.unitBasisUnit);
		cv.set("UnitBasis", measureWithUnit);
	}
	return cv;
}

function createArithmeticCostValue(
	file: IfcFile,
	operator: "ADD" | "DIVIDE" | "MULTIPLY" | "SUBTRACT",
	components: EntityInstance[],
	category?: string,
): EntityInstance {
	const cv = file.createEntity("IfcCostValue");
	cv.set("ArithmeticOperator", operator);
	cv.set("Components", components);
	if (category !== undefined) cv.set("Category", category);
	return cv;
}

function createQuantityCount(file: IfcFile, name: string, value: number): EntityInstance {
	const q = file.createEntity("IfcQuantityCount");
	q.set("Name", name);
	q.set("CountValue", value);
	return q;
}

function createSiUnit(file: IfcFile, unitType: string, name: string): EntityInstance {
	const unit = file.createEntity("IfcSIUnit");
	unit.set("UnitType", unitType);
	unit.set("Name", name);
	return unit;
}

// --- get_primitive_applied_value ---

describe("util.cost getPrimitiveAppliedValue", () => {
	test("null/undefined applied value is 0", () => {
		expect(subject.getPrimitiveAppliedValue(null)).toBe(0.0);
		expect(subject.getPrimitiveAppliedValue(undefined)).toBe(0.0);
	});

	test("a bare number passes through unchanged", () => {
		expect(subject.getPrimitiveAppliedValue(42.5)).toBe(42.5);
	});

	test("a wrapped simple measure returns its wrappedValue", () => {
		const file = createTestFile("IFC4");
		expect(subject.getPrimitiveAppliedValue(money(file, 5000))).toBe(5000);
	});

	test("an IfcMeasureWithUnit returns its (unwrapped-by-this-port) ValueComponent -- see header comment quirk 1", () => {
		const file = createTestFile("IFC4");
		const measureWithUnit = file.createEntity("IfcMeasureWithUnit");
		measureWithUnit.set("ValueComponent", createTypedValue(file, "IfcNumericMeasure", 12));
		measureWithUnit.set("UnitComponent", createSiUnit(file, "LENGTHUNIT", "METRE"));
		// Faithfully preserved: the real Python source returns the raw ValueComponent
		// wrapper here, not its unwrapped scalar (see cost.ts's header comment).
		const result = subject.getPrimitiveAppliedValue(measureWithUnit);
		expect(result).toBeInstanceOf(EntityInstance);
	});

	test("an unrecognised entity type throws", () => {
		const file = createTestFile("IFC4");
		expect(() => subject.getPrimitiveAppliedValue(file.createEntity("IfcCostItem"))).toThrow();
	});
});

// --- get_total_quantity ---

describe("util.cost getTotalQuantity", () => {
	test("IfcCostItem with no CostQuantities returns null", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		expect(subject.getTotalQuantity(item)).toBeNull();
	});

	test("IfcCostItem sums CostQuantities' value at index 3", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		item.set("CostQuantities", [createQuantityCount(file, "A", 3), createQuantityCount(file, "B", 4)]);
		expect(subject.getTotalQuantity(item)).toBe(7);
	});

	test("IfcCostItem with a zero-value quantity still returns 0, not null (distinct from no quantities at all)", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		item.set("CostQuantities", [createQuantityCount(file, "A", 0)]);
		expect(subject.getTotalQuantity(item)).toBe(0);
	});

	test("IfcConstructionResource with no BaseQuantity defaults to 1.0", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getTotalQuantity(resource)).toBe(1.0);
	});

	test("IfcConstructionResource with a BaseQuantity reads its value at index 3", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		resource.set("BaseQuantity", createQuantityCount(file, "Q", 9));
		expect(subject.getTotalQuantity(resource)).toBe(9);
	});
});

// --- calculate_applied_value / sum_child_root_elements ---

describe("util.cost calculateAppliedValue", () => {
	test("a plain (no category, no arithmetic) cost value returns its primitive applied value", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createCostValue(file, { appliedValue: 500 });
		expect(subject.calculateAppliedValue(item, cv)).toBe(500);
	});

	test("ADD sums all component values", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createArithmeticCostValue(file, "ADD", [
			createCostValue(file, { appliedValue: 100 }),
			createCostValue(file, { appliedValue: 25 }),
			createCostValue(file, { appliedValue: 5 }),
		]);
		expect(subject.calculateAppliedValue(item, cv)).toBe(130);
	});

	test("SUBTRACT reduces left-to-right", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createArithmeticCostValue(file, "SUBTRACT", [
			createCostValue(file, { appliedValue: 100 }),
			createCostValue(file, { appliedValue: 30 }),
		]);
		expect(subject.calculateAppliedValue(item, cv)).toBe(70);
	});

	test("MULTIPLY multiplies left-to-right", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createArithmeticCostValue(file, "MULTIPLY", [
			createCostValue(file, { appliedValue: 5000 }),
			createCostValue(file, { appliedValue: 1.19 }),
		]);
		expect(subject.calculateAppliedValue(item, cv)).toBeCloseTo(5950, 6);
	});

	test("DIVIDE by zero is skipped (Python's `except ZeroDivisionError: pass`), not Infinity/NaN", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createArithmeticCostValue(file, "DIVIDE", [
			createCostValue(file, { appliedValue: 100 }),
			createCostValue(file, { appliedValue: 0 }),
			createCostValue(file, { appliedValue: 4 }),
		]);
		expect(subject.calculateAppliedValue(item, cv)).toBe(25);
	});

	test("Category '' (falsy but not null) returns 0.0", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createCostValue(file, { category: "" });
		expect(subject.calculateAppliedValue(item, cv)).toBe(0.0);
	});

	test("Category '*' (SUM) with no nested children falls back to the primitive applied value", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createCostValue(file, { category: "*", appliedValue: 42 });
		expect(subject.calculateAppliedValue(item, cv)).toBe(42);
	});

	test("Category '*' (SUM) with nested children sums the children's applied cost, weighted by quantity", () => {
		const file = createTestFile("IFC4");
		const schedule = createCostSchedule(file);
		const parent = createCostItem(file, "Parent");
		assignControl(file, schedule, [parent]);
		const child1 = createCostItem(file, "Child1");
		const child2 = createCostItem(file, "Child2");
		nest(file, parent, [child1, child2]);
		child1.set("CostValues", [createCostValue(file, { appliedValue: 100 })]);
		child1.set("CostQuantities", [createQuantityCount(file, "count", 2)]);
		child2.set("CostValues", [createCostValue(file, { appliedValue: 50 })]);
		child2.set("CostQuantities", [createQuantityCount(file, "count", 3)]);

		const cv = createCostValue(file, { category: "*" });
		// 2*100 + 3*50 = 350
		expect(subject.calculateAppliedValue(parent, cv)).toBe(350);
	});

	test("Category with a name filters sumChildRootElements to only that category, weighted by UnitBasis", () => {
		const file = createTestFile("IFC4");
		const schedule = createCostSchedule(file);
		const parent = createCostItem(file, "Parent");
		assignControl(file, schedule, [parent]);
		const child = createCostItem(file, "Child");
		nest(file, parent, [child]);
		const unit = createSiUnit(file, "LENGTHUNIT", "METRE");
		child.set("CostValues", [
			createCostValue(file, { category: "material", appliedValue: 10, unitBasisValue: 2, unitBasisUnit: unit }),
			createCostValue(file, { category: "labour", appliedValue: 1000 }),
		]);
		child.set("CostQuantities", [createQuantityCount(file, "count", 4)]);

		const materialCv = createCostValue(file, { category: "material" });
		// UnitBasis halves the effective quantity: (4 / 2) * 10 = 20
		expect(subject.calculateAppliedValue(parent, materialCv)).toBe(20);
	});
});

describe("util.cost getAssignedRateCostItem", () => {
	test("returns the IfcCostItem RelatingControl assigned via IfcRelAssignsToControl", () => {
		const file = createTestFile("IFC4");
		const rateItem = createCostItem(file, "Rate");
		const item = createCostItem(file, "Item");
		assignControl(file, rateItem, [item]);
		expect(subject.getAssignedRateCostItem(item)?.identity()).toBe(rateItem.identity());
	});

	test("returns null when no cost-item assignment exists", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file, "Item");
		expect(subject.getAssignedRateCostItem(item)).toBeNull();
	});

	test("sumChildRootElements uses the assigned rate item's CostValues, not the child's own", () => {
		const file = createTestFile("IFC4");
		const schedule = createCostSchedule(file);
		const parent = createCostItem(file, "Parent");
		assignControl(file, schedule, [parent]);
		const child = createCostItem(file, "Child");
		nest(file, parent, [child]);
		const rateItem = createCostItem(file, "Rate");
		assignControl(file, rateItem, [child]);
		rateItem.set("CostValues", [createCostValue(file, { appliedValue: 7 })]);
		child.set("CostQuantities", [createQuantityCount(file, "count", 3)]);

		const cv = createCostValue(file, { category: "*" });
		expect(subject.calculateAppliedValue(parent, cv)).toBe(21);
	});
});

// --- serialise / unserialise round trips ---

describe("util.cost serialiseCostValue / serialiseAppliedValue", () => {
	test("a plain applied value serialises to its bare number", () => {
		const file = createTestFile("IFC4");
		const cv = createCostValue(file, { appliedValue: 5000 });
		expect(subject.serialiseCostValue(cv)).toBe("5000");
	});

	test("no category/value at all serialises to '0'", () => {
		const file = createTestFile("IFC4");
		const cv = file.createEntity("IfcCostValue");
		expect(subject.serialiseCostValue(cv)).toBe("0");
	});

	test("a '*' category serialises as SUM(...)", () => {
		const file = createTestFile("IFC4");
		const cv = createCostValue(file, { category: "*", appliedValue: 500 });
		expect(subject.serialiseCostValue(cv)).toBe("SUM(500)");
	});

	test("a named category serialises as CATEGORY(...)", () => {
		const file = createTestFile("IFC4");
		const cv = createCostValue(file, { category: "material", appliedValue: 500 });
		expect(subject.serialiseCostValue(cv)).toBe("material(500)");
	});

	test("ADD components join with '+', outer parens stripped at the top level", () => {
		const file = createTestFile("IFC4");
		const cv = createArithmeticCostValue(file, "ADD", [
			createCostValue(file, { appliedValue: 5000 }),
			createCostValue(file, { appliedValue: 1000 }),
		]);
		expect(subject.serialiseCostValue(cv)).toBe("5000+1000");
	});

	test("a nested uncategorised group inside an outer operator keeps its own parens", () => {
		const file = createTestFile("IFC4");
		const inner = createArithmeticCostValue(file, "ADD", [
			createCostValue(file, { appliedValue: 5000 }),
			createCostValue(file, { appliedValue: 300 }),
		]);
		const outer = createArithmeticCostValue(file, "MULTIPLY", [inner, createCostValue(file, { appliedValue: 1.19 })]);
		expect(subject.serialiseCostValue(outer)).toBe("(5000+300)*1.19");
	});

	test("serialiseAppliedValue returns '?' for a non-IfcMonetaryMeasure applied value", () => {
		const file = createTestFile("IFC4");
		expect(subject.serialiseAppliedValue(createTypedValue(file, "IfcNumericMeasure", 5))).toBe("?");
	});
});

describe("util.cost CostValueUnserialiser / unserialiseCostValue", () => {
	test("a bare number parses to {AppliedValue}", () => {
		expect(new subject.CostValueUnserialiser().parse("5000")).toEqual({ AppliedValue: 5000 });
	});

	test("SUM(...) parses Category '*' (the sum alias, case-insensitively)", () => {
		expect(new subject.CostValueUnserialiser().parse("sum(500)")).toEqual({ Category: "*", AppliedValue: 500 });
		expect(new subject.CostValueUnserialiser().parse("SUM(500)")).toEqual({ Category: "*", AppliedValue: 500 });
	});

	test("a named category parses to {Category, AppliedValue}", () => {
		expect(new subject.CostValueUnserialiser().parse("material(500)")).toEqual({
			Category: "material",
			AppliedValue: 500,
		});
	});

	test("an arithmetic formula parses to {Components, ArithmeticOperator}", () => {
		expect(new subject.CostValueUnserialiser().parse("5000+1000")).toEqual({
			Components: [{ AppliedValue: 5000 }, { AppliedValue: 1000 }],
			ArithmeticOperator: "ADD",
		});
	});

	test("a parenthesised sub-group with no leading category name parses with an empty Category (omitted)", () => {
		expect(new subject.CostValueUnserialiser().parse("(5000+300)*1.19")).toEqual({
			Components: [
				{ Components: [{ AppliedValue: 5000 }, { AppliedValue: 300 }], ArithmeticOperator: "ADD" },
				{ AppliedValue: 1.19 },
			],
			ArithmeticOperator: "MULTIPLY",
		});
	});

	test("a category wrapping a sub-formula carries both Category and Components/ArithmeticOperator", () => {
		expect(new subject.CostValueUnserialiser().parse("SUM(5000+300)")).toEqual({
			Category: "*",
			Components: [{ AppliedValue: 5000 }, { AppliedValue: 300 }],
			ArithmeticOperator: "ADD",
		});
	});

	test("disclosed quirk: mixed operators at one level -- last operator wins (bug-compatible with real Python)", () => {
		expect(new subject.CostValueUnserialiser().parse("5+3-2")).toEqual({
			Components: [{ AppliedValue: 5 }, { AppliedValue: 3 }, { AppliedValue: 2 }],
			ArithmeticOperator: "SUBTRACT",
		});
	});

	test("throws for malformed input", () => {
		expect(() => new subject.CostValueUnserialiser().parse("material(500")).toThrow();
		expect(() => new subject.CostValueUnserialiser().parse("500))")).toThrow();
	});

	test("unserialiseCostValue attaches 'ifc' to the given entity and recurses into pre-existing Components positionally", () => {
		const file = createTestFile("IFC4");
		const child1 = createCostValue(file, { appliedValue: 1 });
		const child2 = createCostValue(file, { appliedValue: 2 });
		const parent = createArithmeticCostValue(file, "ADD", [child1, child2]);

		const result = subject.unserialiseCostValue("10+20", parent);
		expect(result.ifc?.identity()).toBe(parent.identity());
		expect(result.Components?.[0].ifc?.identity()).toBe(child1.identity());
		expect(result.Components?.[1].ifc?.identity()).toBe(child2.identity());
	});

	test("unserialiseCostValue does not attach 'ifc' beyond the pre-existing Components length (no mutation, purely positional pairing)", () => {
		const file = createTestFile("IFC4");
		const onlyChild = createCostValue(file, { appliedValue: 1 });
		const parent = createArithmeticCostValue(file, "ADD", [onlyChild]);

		const result = subject.unserialiseCostValue("10+20+30", parent);
		expect(result.Components).toHaveLength(3);
		expect(result.Components?.[0].ifc?.identity()).toBe(onlyChild.identity());
		expect(result.Components?.[1].ifc).toBeUndefined();
		expect(result.Components?.[2].ifc).toBeUndefined();
	});
});

describe("util.cost serialise/unserialise round trips", () => {
	function roundTrip(file: IfcFile, cv: EntityInstance): void {
		const formula = subject.serialiseCostValue(cv);
		const reserialisedAfterParse = new subject.CostValueUnserialiser().parse(formula);
		// Re-serialise a *fresh* IfcCostValue built from the parsed shape and confirm it
		// produces the identical formula string -- proving the parse round-trips, without
		// needing `unserialiseCostValue`'s entity-mutation (it has none, see cost.ts's
		// header comment) to reconstruct one.
		const rebuilt = buildCostValueFromParsed(file, reserialisedAfterParse);
		expect(subject.serialiseCostValue(rebuilt)).toBe(formula);
	}

	function buildCostValueFromParsed(file: IfcFile, parsed: subject.CostValueFormula): EntityInstance {
		const cv = file.createEntity("IfcCostValue");
		if (parsed.Category !== undefined) cv.set("Category", parsed.Category);
		if (parsed.Components) {
			cv.set(
				"Components",
				parsed.Components.map((c) => buildCostValueFromParsed(file, c)),
			);
			if (parsed.ArithmeticOperator) cv.set("ArithmeticOperator", parsed.ArithmeticOperator);
		} else if (parsed.AppliedValue !== undefined && parsed.AppliedValue !== null) {
			cv.set("AppliedValue", money(file, parsed.AppliedValue));
		}
		return cv;
	}

	test("plain value", () => {
		const file = createTestFile("IFC4");
		roundTrip(file, createCostValue(file, { appliedValue: 5000 }));
	});

	test("SUM category", () => {
		const file = createTestFile("IFC4");
		roundTrip(file, createCostValue(file, { category: "*", appliedValue: 500 }));
	});

	test("named category", () => {
		const file = createTestFile("IFC4");
		roundTrip(file, createCostValue(file, { category: "material", appliedValue: 500 }));
	});

	test("ADD of two plain values", () => {
		const file = createTestFile("IFC4");
		roundTrip(
			file,
			createArithmeticCostValue(file, "ADD", [
				createCostValue(file, { appliedValue: 5000 }),
				createCostValue(file, { appliedValue: 1000 }),
			]),
		);
	});

	test("nested category-parenthesised sub-formula (SUM(5000+300)*1.19)", () => {
		const file = createTestFile("IFC4");
		const inner = createCostValue(file, {
			category: "*",
			appliedValue: undefined,
		});
		inner.set("ArithmeticOperator", "ADD");
		inner.set("Components", [
			createCostValue(file, { appliedValue: 5000 }),
			createCostValue(file, { appliedValue: 300 }),
		]);
		const outer = createArithmeticCostValue(file, "MULTIPLY", [inner, createCostValue(file, { appliedValue: 1.19 })]);
		roundTrip(file, outer);
	});

	test("plain uncategorised parenthesised sub-group", () => {
		const file = createTestFile("IFC4");
		const inner = createArithmeticCostValue(file, "ADD", [
			createCostValue(file, { appliedValue: 5000 }),
			createCostValue(file, { appliedValue: 300 }),
		]);
		const outer = createArithmeticCostValue(file, "MULTIPLY", [inner, createCostValue(file, { appliedValue: 1.19 })]);
		roundTrip(file, outer);
	});
});

// --- graph-traversal queries ---

// Python: `TestGetCostItemForProduct` (all three cases ported).
describe("util.cost getCostItemsForProduct", () => {
	test("run: a product assigned to a cost item is returned", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const schedule = createCostSchedule(file);
		const item1 = createCostItem(file);
		assignControl(file, schedule, [item1]);
		assignControl(file, item1, [element]);
		expect(subject.getCostItemsForProduct(element).map((e) => e.identity())).toEqual([item1.identity()]);
	});

	test("remove_cost_item: once the assignment is gone, nothing is returned", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const schedule = createCostSchedule(file);
		const item1 = createCostItem(file);
		assignControl(file, schedule, [item1]);
		const assignment = assignControl(file, item1, [element]);
		file.remove(assignment);
		expect(subject.getCostItemsForProduct(element)).toEqual([]);
	});

	test("no_assigned_cost_items: a product with no assignment at all returns nothing", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const schedule = createCostSchedule(file);
		createCostItem(file); // exists but is never assigned to `element`
		void schedule;
		expect(subject.getCostItemsForProduct(element)).toEqual([]);
	});
});

describe("util.cost getRootCostItems / getNestedCostItems / getAllNestedCostItems / getScheduleCostItems", () => {
	function buildTree(file: IfcFile) {
		const schedule = createCostSchedule(file);
		const root1 = createCostItem(file, "root1");
		const root2 = createCostItem(file, "root2");
		assignControl(file, schedule, [root1, root2]);
		const child1 = createCostItem(file, "child1");
		const grandchild = createCostItem(file, "grandchild");
		nest(file, root1, [child1]);
		nest(file, child1, [grandchild]);
		return { schedule, root1, root2, child1, grandchild };
	}

	test("getRootCostItems returns only the top-level items assigned to the schedule", () => {
		const file = createTestFile("IFC4");
		const { schedule, root1, root2 } = buildTree(file);
		expect(
			subject
				.getRootCostItems(schedule)
				.map((i) => i.identity())
				.sort(),
		).toEqual([root1.identity(), root2.identity()].sort());
	});

	test("getNestedCostItems (shallow) returns only direct children", () => {
		const file = createTestFile("IFC4");
		const { root1, child1 } = buildTree(file);
		expect(subject.getNestedCostItems(root1).map((i) => i.identity())).toEqual([child1.identity()]);
	});

	test("getNestedCostItems (isDeep=true) / getAllNestedCostItems returns the whole subtree", () => {
		const file = createTestFile("IFC4");
		const { root1, child1, grandchild } = buildTree(file);
		expect(subject.getNestedCostItems(root1, true).map((i) => i.identity())).toEqual([
			child1.identity(),
			grandchild.identity(),
		]);
		expect(Array.from(subject.getAllNestedCostItems(root1)).map((i) => i.identity())).toEqual([
			child1.identity(),
			grandchild.identity(),
		]);
	});

	test("getScheduleCostItems yields every root and nested cost item", () => {
		const file = createTestFile("IFC4");
		const { schedule, root1, root2, child1, grandchild } = buildTree(file);
		const all = Array.from(subject.getScheduleCostItems(schedule)).map((i) => i.identity());
		expect(new Set(all)).toEqual(new Set([root1, root2, child1, grandchild].map((i) => i.identity())));
	});
});

describe("util.cost getCostAssignmentsByType / getCostItemAssignments", () => {
	test("with no filter, returns everything assigned via Controls", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const wall = file.createEntity("IfcWall");
		assignControl(file, item, [wall]);
		expect(subject.getCostAssignmentsByType(item).map((e) => e.identity())).toEqual([wall.identity()]);
	});

	test("PRODUCT filters to IfcElement subtypes", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const wall = file.createEntity("IfcWall");
		const labour = file.createEntity("IfcLaborResource");
		assignControl(file, item, [wall, labour]);
		expect(subject.getCostAssignmentsByType(item, "PRODUCT").map((e) => e.identity())).toEqual([wall.identity()]);
	});

	test("RESOURCE filters to IfcResource subtypes", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const wall = file.createEntity("IfcWall");
		const labour = file.createEntity("IfcLaborResource");
		assignControl(file, item, [wall, labour]);
		expect(subject.getCostAssignmentsByType(item, "RESOURCE").map((e) => e.identity())).toEqual([labour.identity()]);
	});

	// `/code-review`-found bug (fixed): a `filterByType` value that isn't one of the
	// three recognised `FilterByType` literals must be used AS-IS as the `is_a(...)`
	// class-name filter (matching Python's own runtime behavior for this exact case --
	// its `FILTER_BY_TYPE` type hint isn't enforced at runtime either), not silently
	// treated as "no filter". `FilterByType | string` deliberately allows a caller to
	// bypass the compile-time-only literal-union restriction, exactly like a plain JS
	// caller (or Python itself) could.
	test("a filterByType value outside PRODUCT/RESOURCE/PROCESS is used directly as the IFC class filter, not treated as unfiltered", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const wall = file.createEntity("IfcWall");
		const labour = file.createEntity("IfcLaborResource");
		assignControl(file, item, [wall, labour]);
		expect(subject.getCostAssignmentsByType(item, "IfcLaborResource").map((e) => e.identity())).toEqual([
			labour.identity(),
		]);
		// An unrecognised, non-matching class name filters down to nothing at all --
		// the opposite of treating it as "no filter" (which would have returned both).
		expect(subject.getCostAssignmentsByType(item, "IfcNotARealClass")).toEqual([]);
	});

	test("getCostItemAssignments(isDeep=true) also includes nested cost items' own assignments", () => {
		const file = createTestFile("IFC4");
		const parent = createCostItem(file, "parent");
		const child = createCostItem(file, "child");
		nest(file, parent, [child]);
		const wallOnParent = file.createEntity("IfcWall");
		const wallOnChild = file.createEntity("IfcWall");
		assignControl(file, parent, [wallOnParent]);
		assignControl(file, child, [wallOnChild]);

		expect(subject.getCostItemAssignments(parent).map((e) => e.identity())).toEqual([wallOnParent.identity()]);
		expect(new Set(subject.getCostItemAssignments(parent, undefined, true).map((e) => e.identity()))).toEqual(
			new Set([wallOnParent.identity(), wallOnChild.identity()]),
		);
	});
});

describe("util.cost getCostValues", () => {
	test("returns id/label/name/category/appliedValue/unitData for each cost value", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = createCostValue(file, { name: "Rate", category: "material", appliedValue: 12.5 });
		item.set("CostValues", [cv]);

		const results = subject.getCostValues(item);
		expect(results).toHaveLength(1);
		expect(results[0].id).toBe(cv.id());
		expect(results[0].name).toBe("Rate");
		expect(results[0].category).toBe("material");
		expect(results[0].appliedValue).toBe(12.5);
		expect(results[0].label).toBe("12.50 = material(12.5)");
		expect(results[0].unitData).toEqual({ valueComponent: null, unitComponent: null, unitSymbol: "" });
	});

	test("includes unitData when UnitBasis is set", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const unit = createSiUnit(file, "LENGTHUNIT", "METRE");
		const cv = createCostValue(file, { appliedValue: 10, unitBasisValue: 2, unitBasisUnit: unit });
		item.set("CostValues", [cv]);

		const [result] = subject.getCostValues(item);
		expect(result.unitData.valueComponent).toBe(2);
		expect(result.unitData.unitComponent).toBe(unit.id());
		expect(result.unitData.unitSymbol).toBe("m");
	});
});

describe("util.cost getCostScheduleTypes", () => {
	test("returns every IfcCostScheduleTypeEnum item with a description, verified against the real schema", () => {
		const file = createTestFile("IFC4");
		const types = subject.getCostScheduleTypes(file);
		const names = types.map((t) => t.name).sort();
		// Cross-checked directly against `Ifc4-schema.cpp`'s own generated
		// `IfcCostScheduleTypeEnum` construction -- see cost.ts's header comment.
		expect(names).toEqual(
			[
				"BUDGET",
				"COSTPLAN",
				"ESTIMATE",
				"NOTDEFINED",
				"PRICEDBILLOFQUANTITIES",
				"SCHEDULEOFRATES",
				"TENDER",
				"UNPRICEDBILLOFQUANTITIES",
				"USERDEFINED",
			].sort(),
		);
		for (const type of types) {
			expect(typeof type.description).toBe("string");
			expect(type.description?.length).toBeGreaterThan(0);
		}
	});
});

describe("util.cost getProductQuantityNames", () => {
	test("intersects quantity names across all given elements, excluding 'id'", () => {
		const file = createTestFile("IFC4");
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");

		function assignQto(element: EntityInstance, quantities: EntityInstance[]): void {
			const qto = file.createEntity("IfcElementQuantity");
			qto.set("Name", "Qto_WallBaseQuantities");
			qto.set("Quantities", quantities);
			const rel = file.createEntity("IfcRelDefinesByProperties");
			rel.set("RelatedObjects", [element]);
			rel.set("RelatingPropertyDefinition", qto);
		}

		assignQto(wall1, [createQuantityCount(file, "Length", 1), createQuantityCount(file, "Width", 2)]);
		assignQto(wall2, [createQuantityCount(file, "Length", 3), createQuantityCount(file, "Height", 4)]);

		expect(subject.getProductQuantityNames([wall1, wall2])).toEqual(["Length"]);
	});

	test("an empty element list returns an empty list", () => {
		expect(subject.getProductQuantityNames([])).toEqual([]);
		expect(subject.getProductQuantityNames(null)).toEqual([]);
	});
});

describe("util.cost getCostSchedule / getCostRate", () => {
	test("getCostSchedule finds the schedule directly assigned via IfcRelAssignsToControl", () => {
		const file = createTestFile("IFC4");
		const schedule = createCostSchedule(file);
		const item = createCostItem(file);
		assignControl(file, schedule, [item]);
		expect(subject.getCostSchedule(item)?.identity()).toBe(schedule.identity());
	});

	test("getCostSchedule recurses up through Nests when not directly assigned", () => {
		const file = createTestFile("IFC4");
		const schedule = createCostSchedule(file);
		const parent = createCostItem(file, "parent");
		assignControl(file, schedule, [parent]);
		const child = createCostItem(file, "child");
		nest(file, parent, [child]);
		expect(subject.getCostSchedule(child)?.identity()).toBe(schedule.identity());
	});

	test("getCostRate returns null when the cost item's own schedule is already a SCHEDULEOFRATES", () => {
		const file = createTestFile("IFC4");
		const schedule = createCostSchedule(file);
		schedule.set("PredefinedType", "SCHEDULEOFRATES");
		const item = createCostItem(file);
		assignControl(file, schedule, [item]);
		expect(subject.getCostRate(file, item)).toBeNull();
	});

	test("getCostRate finds a rate cost item (in a SCHEDULEOFRATES schedule) sharing the same CostValues", () => {
		const file = createTestFile("IFC4");
		const budgetSchedule = createCostSchedule(file);
		budgetSchedule.set("PredefinedType", "BUDGET");
		const item = createCostItem(file, "item");
		assignControl(file, budgetSchedule, [item]);

		const rateSchedule = createCostSchedule(file);
		rateSchedule.set("PredefinedType", "SCHEDULEOFRATES");
		const rateItem = createCostItem(file, "rate");
		assignControl(file, rateSchedule, [rateItem]);

		const sharedCostValue = createCostValue(file, { appliedValue: 10 });
		item.set("CostValues", [sharedCostValue]);
		rateItem.set("CostValues", [sharedCostValue]);

		expect(subject.getCostRate(file, item)?.identity()).toBe(rateItem.identity());
	});

	test("getCostRate returns null when no CostValues are shared with any SCHEDULEOFRATES item", () => {
		const file = createTestFile("IFC4");
		const budgetSchedule = createCostSchedule(file);
		budgetSchedule.set("PredefinedType", "BUDGET");
		const item = createCostItem(file, "item");
		assignControl(file, budgetSchedule, [item]);
		item.set("CostValues", [createCostValue(file, { appliedValue: 10 })]);
		expect(subject.getCostRate(file, item)).toBeNull();
	});
});

// --- Transaction/undo-redo regression ---
//
// See cost.ts's header comment: `unserialiseCostValue` itself does not mutate
// anything (it's a pure parser/mapper -- the real Python mutation this chunk's brief
// described lives in the unported `ifcopenshell.api.cost.edit_cost_value_formula`).
// This test proves the REAL end-to-end workflow -- parse a formula, then apply the
// *structural* part of the parsed result (`ArithmeticOperator` + wiring in the
// pre-existing component entities `unserialiseCostValue` positionally matched) onto a
// real `IfcCostValue` via the *existing* `EntityInstance.set()` -- undoes/redoes
// correctly inside a real `IfcFile` transaction, satisfying the brief's underlying
// intent (real mutation + undo/redo coverage for this module's formula round-trip).
//
// Deliberately does NOT also create a brand-new `IfcMonetaryMeasure` `AppliedValue`
// *inside* the transaction (the way `edit_cost_value_formula`'s real
// `Usecase.edit_cost_value` always does, via `self.file.createIfcMonetaryMeasure(...)`)
// -- doing so hits a real, already-disclosed, unrelated primitive-layer gap
// (`TODOS.md`'s "`EntityInstance.setByIndex`/`IfcFile.createEntity` cannot write an
// initial value into a freshly created simple/defined-type instance" entry) that also
// breaks `Transaction.unserialiseValue`'s redo-replay path for exactly this case
// (confirmed empirically while building this test: `file.redo()` throws "Attribute
// access is only supported on entity instances", the identical root cause that TODOS.md
// entry already documents for `Migrator.migrate`, now cross-referenced there as a second
// consequence of the same gap). Both `componentA`/`componentB` below have their
// `AppliedValue`s created up front, outside the transaction, so this test exercises only
// what's actually already working: reference/scalar attribute mutation via `.set()`.
describe("util.cost unserialiseCostValue-driven workflow: Transaction/undo-redo", () => {
	test("applying a parsed formula's structure onto a pre-existing IfcCostValue is fully undoable and redoable", () => {
		const file = createTestFile("IFC4");
		const item = createCostItem(file);
		const cv = file.createEntity("IfcCostValue");
		const componentA = createCostValue(file, { appliedValue: 5000 });
		const componentB = createCostValue(file, { appliedValue: 1.19 });
		item.set("CostValues", [cv]);
		const cvId = cv.id();

		file.beginTransaction();
		const parsed = subject.unserialiseCostValue("5000*1.19", cv);
		cv.set("ArithmeticOperator", parsed.ArithmeticOperator ?? null);
		cv.set("Components", [componentA, componentB]);
		file.endTransaction();

		const afterApply = file.byId(cvId);
		expect(afterApply.get("ArithmeticOperator")).toBe("MULTIPLY");
		expect(subject.calculateAppliedValue(item, afterApply)).toBeCloseTo(5950, 6);

		file.undo();
		const afterUndo = file.byId(cvId);
		expect(afterUndo.get("ArithmeticOperator")).toBeNull();
		expect(afterUndo.get("Components")).toBeNull();

		file.redo();
		const afterRedo = file.byId(cvId);
		expect(afterRedo.get("ArithmeticOperator")).toBe("MULTIPLY");
		expect(subject.calculateAppliedValue(item, afterRedo)).toBeCloseTo(5950, 6);
	});
});
