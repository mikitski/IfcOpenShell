// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_resource.py` (src/ifcopenshell-python) -- **that
// file does not exist** (confirmed: `src/ifcopenshell-python/test/util/` has no
// `test_resource.py` at all), matching `util.constraint`/`util.representation`'s own
// precedent for a module with zero pre-existing Python test coverage. Every test below
// is therefore original coverage written directly against `resource.py`'s own source /
// `resource.ts`'s port, not a port of an existing Python test.
//
// `resource.py` has no `api.*` fixture-building callers of its own to mirror (unlike
// `util.cost`'s test file, which at least had `api.cost.add_cost_schedule` etc. to draw
// fixture shape from) -- fixtures below build the underlying `IfcRelAssignsToProcess`/
// `IfcRelAssignsToProduct`/`IfcRelNests`/`IfcRelDefinesByProperties` entity graphs
// directly via `file.createEntity(...)` + `.set(...)`, matching `test/util/cost.test.ts`/
// `test/util/element.test.ts`'s own established pattern for this exact same "no `api`
// layer yet" gap. Only IFC4 is exercised (`resource.py` itself has no schema-version
// branches at all -- `IfcConstructionResource`/`IfcLaborResource`/etc. are IFC4+ classes
// with no IFC2X3 equivalent), matching `util.cost.test.ts`'s own IFC4-only scope -- no
// `AVAILABLE_SCHEMAS`/`ALL_SCHEMAS` gating needed here.
//
// This module has no mutating functions (see `resource.ts`'s own header comment) --
// no Transaction/undo-redo test is included for the same reason `util.pset`'s test
// suite omits one.

import { describe, expect, test } from "vitest";
import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import * as subject from "../../src/util/resource";
import { createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment) ---

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

function createConversionBasedUnit(file: IfcFile, name: string): EntityInstance {
	const unit = file.createEntity("IfcConversionBasedUnit");
	unit.set("Name", name);
	return unit;
}

function createSiUnit(file: IfcFile, unitType: string, name: string): EntityInstance {
	const unit = file.createEntity("IfcSIUnit");
	unit.set("UnitType", unitType);
	unit.set("Name", name);
	return unit;
}

interface CostValueOptions {
	appliedValue?: number;
	unitBasisUnit?: EntityInstance;
}

function createCostValue(file: IfcFile, options: CostValueOptions = {}): EntityInstance {
	const cv = file.createEntity("IfcCostValue");
	if (options.appliedValue !== undefined) cv.set("AppliedValue", money(file, options.appliedValue));
	if (options.unitBasisUnit) {
		const measureWithUnit = file.createEntity("IfcMeasureWithUnit");
		measureWithUnit.set("UnitComponent", options.unitBasisUnit);
		cv.set("UnitBasis", measureWithUnit);
	}
	return cv;
}

function buildProperties(file: IfcFile, properties: Record<string, unknown>): EntityInstance[] {
	return Object.entries(properties).map(([key, value]) => {
		const prop = file.createEntity("IfcPropertySingleValue");
		prop.set("Name", key);
		prop.set("NominalValue", value);
		return prop;
	});
}

function addPset(
	file: IfcFile,
	product: EntityInstance,
	name: string,
	properties: Record<string, unknown> = {},
): EntityInstance {
	const pset = file.createEntity("IfcPropertySet");
	pset.set("Name", name);
	pset.set("HasProperties", buildProperties(file, properties));
	const rel = file.createEntity("IfcRelDefinesByProperties");
	rel.set("RelatedObjects", [product]);
	rel.set("RelatingPropertyDefinition", pset);
	return pset;
}

function addQto(
	file: IfcFile,
	product: EntityInstance,
	name: string,
	quantities: Record<string, number> = {},
): EntityInstance {
	const qto = file.createEntity("IfcElementQuantity");
	qto.set("Name", name);
	qto.set(
		"Quantities",
		Object.entries(quantities).map(([key, value]) => {
			const quantity = file.createEntity("IfcQuantityCount");
			quantity.set("Name", key);
			quantity.set("CountValue", value);
			return quantity;
		}),
	);
	const rel = file.createEntity("IfcRelDefinesByProperties");
	rel.set("RelatedObjects", [product]);
	rel.set("RelatingPropertyDefinition", qto);
	return qto;
}

function createQuantityCount(file: IfcFile, name: string, value: number): EntityInstance {
	const q = file.createEntity("IfcQuantityCount");
	q.set("Name", name);
	q.set("CountValue", value);
	return q;
}

function nest(file: IfcFile, relatingObject: EntityInstance, relatedObjects: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelNests");
	rel.set("RelatingObject", relatingObject);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

function assignToProcess(file: IfcFile, resource: EntityInstance, process: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToProcess");
	rel.set("RelatedObjects", [resource]);
	rel.set("RelatingProcess", process);
	return rel;
}

function assignToProduct(file: IfcFile, process: EntityInstance, product: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToProduct");
	rel.set("RelatedObjects", [process]);
	rel.set("RelatingProduct", product);
	return rel;
}

// --- get_productivity / get_parent_productivity ---

describe("util.resource getProductivity / getParentProductivity", () => {
	test("a resource with no EPset_Productivity and no Nests returns null", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getProductivity(resource)).toBeNull();
		expect(subject.getParentProductivity(resource)).toBeNull();
	});

	test("a resource's own EPset_Productivity is returned directly", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		addPset(file, resource, "EPset_Productivity", { BaseQuantityConsumed: "PT8H" });
		const productivity = subject.getProductivity(resource);
		expect(productivity).toMatchObject({ BaseQuantityConsumed: "PT8H" });
	});

	test("should_inherit=true (the default) falls back to the parent's EPset_Productivity when the resource has none of its own", () => {
		const file = createTestFile("IFC4");
		const parent = file.createEntity("IfcLaborResource");
		const child = file.createEntity("IfcLaborResource");
		addPset(file, parent, "EPset_Productivity", { BaseQuantityConsumed: "PT4H" });
		nest(file, parent, [child]);
		expect(subject.getProductivity(child)).toMatchObject({ BaseQuantityConsumed: "PT4H" });
		expect(subject.getParentProductivity(child)).toMatchObject({ BaseQuantityConsumed: "PT4H" });
	});

	test("should_inherit=false does NOT fall back to the parent", () => {
		const file = createTestFile("IFC4");
		const parent = file.createEntity("IfcLaborResource");
		const child = file.createEntity("IfcLaborResource");
		addPset(file, parent, "EPset_Productivity", { BaseQuantityConsumed: "PT4H" });
		nest(file, parent, [child]);
		expect(subject.getProductivity(child, false)).toBeNull();
	});

	test("a parent with no EPset_Productivity of its own yields null via inheritance", () => {
		const file = createTestFile("IFC4");
		const parent = file.createEntity("IfcLaborResource");
		const child = file.createEntity("IfcLaborResource");
		nest(file, parent, [child]);
		expect(subject.getParentProductivity(child)).toBeNull();
		expect(subject.getProductivity(child)).toBeNull();
	});
});

// --- get_unit_consumed ---

describe("util.resource getUnitConsumed", () => {
	test("null productivity throws, matching real Python's unguarded AttributeError-on-None crash (disclosed finding 1)", () => {
		expect(() => subject.getUnitConsumed(null)).toThrow();
	});

	test("a productivity dict with no BaseQuantityConsumed key returns undefined", () => {
		expect(subject.getUnitConsumed({})).toBeUndefined();
	});

	test("an empty-string BaseQuantityConsumed returns undefined (falsy check, not a parse attempt)", () => {
		expect(subject.getUnitConsumed({ BaseQuantityConsumed: "" })).toBeUndefined();
	});

	test("a real IfcDuration string is parsed via ifc2datetime", () => {
		const result = subject.getUnitConsumed({ BaseQuantityConsumed: "PT8H" });
		expect(result).toEqual({ years: 0, months: 0, days: 0, hours: 8, minutes: 0, seconds: 0 });
	});
});

// --- get_quantity_produced / get_quantity_produced_name ---

describe("util.resource getQuantityProduced / getQuantityProducedName", () => {
	test('null productivity defaults to 0.0 / ""', () => {
		expect(subject.getQuantityProduced(null)).toBe(0.0);
		expect(subject.getQuantityProducedName(null)).toBe("");
	});

	test('a productivity dict with no matching key defaults to 0.0 / ""', () => {
		expect(subject.getQuantityProduced({})).toBe(0.0);
		expect(subject.getQuantityProducedName({})).toBe("");
	});

	test("a present-but-zero BaseQuantityProducedValue is returned as-is (dict.get semantics: key present wins over default)", () => {
		expect(subject.getQuantityProduced({ BaseQuantityProducedValue: 0 })).toBe(0);
	});

	test("a real value is returned directly", () => {
		expect(subject.getQuantityProduced({ BaseQuantityProducedValue: 12.5 })).toBe(12.5);
		expect(subject.getQuantityProducedName({ BaseQuantityProducedName: "Area" })).toBe("Area");
	});
});

// --- get_total_quantity_produced / get_parametric_resource_products ---

describe("util.resource getParametricResourceProducts", () => {
	test("a resource with no assignments has no parametric products", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getParametricResourceProducts(resource)).toEqual([]);
	});

	test("walks HasAssignments -> IfcRelAssignsToProcess -> RelatingProcess.HasAssignments -> IfcRelAssignsToProduct -> RelatingProduct", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const task = file.createEntity("IfcTask");
		const productA = file.createEntity("IfcBuildingElementProxy");
		const productB = file.createEntity("IfcBuildingElementProxy");
		assignToProcess(file, resource, task);
		assignToProduct(file, task, productA);
		assignToProduct(file, task, productB);
		expect(subject.getParametricResourceProducts(resource).map((e) => e.identity())).toEqual([
			productA.identity(),
			productB.identity(),
		]);
	});

	test("non-IfcRelAssignsToProcess/IfcRelAssignsToProduct assignments are ignored", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const task = file.createEntity("IfcTask");
		const product = file.createEntity("IfcBuildingElementProxy");
		// Irrelevant assignment on the resource itself.
		const controlRel = file.createEntity("IfcRelAssignsToControl");
		controlRel.set("RelatedObjects", [resource]);
		controlRel.set("RelatingControl", file.createEntity("IfcCostItem"));
		assignToProcess(file, resource, task);
		// Irrelevant assignment on the task.
		const otherRel = file.createEntity("IfcRelAssignsToControl");
		otherRel.set("RelatedObjects", [task]);
		otherRel.set("RelatingControl", file.createEntity("IfcCostItem"));
		assignToProduct(file, task, product);
		expect(subject.getParametricResourceProducts(resource).map((e) => e.identity())).toEqual([product.identity()]);
	});
});

describe("util.resource getTotalQuantityProduced", () => {
	function buildTwoProductResource(file: IfcFile, areaA: number, areaB: number) {
		const resource = file.createEntity("IfcLaborResource");
		const task = file.createEntity("IfcTask");
		const productA = file.createEntity("IfcBuildingElementProxy");
		const productB = file.createEntity("IfcBuildingElementProxy");
		addQto(file, productA, "Qto_BaseQuantities", { Area: areaA });
		addQto(file, productB, "Qto_BaseQuantities", { Area: areaB });
		assignToProcess(file, resource, task);
		assignToProduct(file, task, productA);
		assignToProduct(file, task, productB);
		return resource;
	}

	test('quantity_name_in_process === "Count" returns the number of parametric products', () => {
		const file = createTestFile("IFC4");
		const resource = buildTwoProductResource(file, 30, 70);
		expect(subject.getTotalQuantityProduced(resource, "Count")).toBe(2);
	});

	test("sums the named quantity across every parametric product's psets/qtos", () => {
		const file = createTestFile("IFC4");
		const resource = buildTwoProductResource(file, 30, 70);
		expect(subject.getTotalQuantityProduced(resource, "Area")).toBe(100);
	});

	test("a product missing the named quantity contributes 0", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const task = file.createEntity("IfcTask");
		const product = file.createEntity("IfcBuildingElementProxy");
		assignToProcess(file, resource, task);
		assignToProduct(file, task, product);
		expect(subject.getTotalQuantityProduced(resource, "Area")).toBe(0);
	});

	test("a matched property value that isn't numeric-convertible throws, matching Python's float(value) raising ValueError", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const task = file.createEntity("IfcTask");
		const product = file.createEntity("IfcBuildingElementProxy");
		addPset(file, product, "Pset_Custom", { Note: "not a number" });
		assignToProcess(file, resource, task);
		assignToProduct(file, task, product);
		expect(() => subject.getTotalQuantityProduced(resource, "Note")).toThrow();
	});
});

// --- get_task_assignments ---

describe("util.resource getTaskAssignments", () => {
	test("a resource with no IfcRelAssignsToProcess returns undefined", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getTaskAssignments(resource)).toBeUndefined();
	});

	test("returns the RelatingProcess of the first matching assignment", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const task = file.createEntity("IfcTask");
		assignToProcess(file, resource, task);
		expect(subject.getTaskAssignments(resource)?.identity()).toBe(task.identity());
	});
});

// --- get_resource_required_work ---

describe("util.resource getResourceRequiredWork", () => {
	function buildProductivityResource(
		file: IfcFile,
		options: { baseQuantityConsumed: string; baseQuantityProducedValue: number; baseQuantityProducedName: string },
		productAreas: number[],
	): EntityInstance {
		const resource = file.createEntity("IfcLaborResource");
		addPset(file, resource, "EPset_Productivity", {
			BaseQuantityConsumed: options.baseQuantityConsumed,
			BaseQuantityProducedValue: options.baseQuantityProducedValue,
			BaseQuantityProducedName: options.baseQuantityProducedName,
		});
		const task = file.createEntity("IfcTask");
		assignToProcess(file, resource, task);
		for (const area of productAreas) {
			const product = file.createEntity("IfcBuildingElementProxy");
			addQto(file, product, "Qto_BaseQuantities", { [options.baseQuantityProducedName]: area });
			assignToProduct(file, task, product);
		}
		return resource;
	}

	test("no productivity data returns undefined", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getResourceRequiredWork(resource)).toBeUndefined();
	});

	test("zero total quantity to produce returns undefined even with valid productivity data", () => {
		const file = createTestFile("IFC4");
		const resource = buildProductivityResource(
			file,
			{ baseQuantityConsumed: "PT8H", baseQuantityProducedValue: 10, baseQuantityProducedName: "Area" },
			[],
		);
		expect(subject.getResourceRequiredWork(resource)).toBeUndefined();
	});

	test('a "T"-separated (time-of-day) BaseQuantityConsumed produces an hours-based PT..H result, correctly normalizing Duration.hours into total seconds', () => {
		const file = createTestFile("IFC4");
		// 8 hours consumed per 10 units produced (2880s/unit); 100 units needed total ->
		// 288000s = 80h. This specifically exercises the Duration normalization finding
		// in resource.ts's header comment: a naive `time_consumed.seconds` read (without
		// `timedeltaDaysSeconds`'s day/intraday-second normalization) would read `0`
		// here instead of the correct `28800` (8h expressed as seconds), since `PT8H`
		// parses to `{hours: 8, seconds: 0, ...}`, not a pre-normalized `{seconds: 28800}`.
		const resource = buildProductivityResource(
			file,
			{ baseQuantityConsumed: "PT8H", baseQuantityProducedValue: 10, baseQuantityProducedName: "Area" },
			[40, 60],
		);
		expect(subject.getResourceRequiredWork(resource)).toBe("PT80H");
	});

	test('a plain-days (no "T") BaseQuantityConsumed produces a days-based P..D result -- also exercises the disclosed int/float f-string-rendering cosmetic divergence (finding 2: this port renders "P8D", real Python would render "P8.0D")', () => {
		const file = createTestFile("IFC4");
		// 2 days consumed per 5 units produced (0.4 days/unit); 20 units needed total ->
		// 8 days.
		const resource = buildProductivityResource(
			file,
			{ baseQuantityConsumed: "P2D", baseQuantityProducedValue: 5, baseQuantityProducedName: "Area" },
			[8, 12],
		);
		expect(subject.getResourceRequiredWork(resource)).toBe("P8D");
	});

	test('an all-zero "PT0S" BaseQuantityConsumed returns undefined, matching real Python\'s timedelta.__bool__ falsiness (disclosed finding 3) -- not a naive JS-object-is-always-truthy "PT0H"/"P0D"', () => {
		const file = createTestFile("IFC4");
		const resource = buildProductivityResource(
			file,
			{ baseQuantityConsumed: "PT0S", baseQuantityProducedValue: 10, baseQuantityProducedName: "Area" },
			[40, 60],
		);
		expect(subject.getResourceRequiredWork(resource)).toBeUndefined();
	});
});

// --- get_nested_resources ---

describe("util.resource getNestedResources", () => {
	test("a resource with no IsNestedBy has no nested resources", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getNestedResources(resource)).toEqual([]);
	});

	test("flattens RelatedObjects across every IsNestedBy relationship", () => {
		const file = createTestFile("IFC4");
		const parent = file.createEntity("IfcCrewResource");
		const childA = file.createEntity("IfcLaborResource");
		const childB = file.createEntity("IfcLaborResource");
		const childC = file.createEntity("IfcConstructionEquipmentResource");
		nest(file, parent, [childA, childB]);
		nest(file, parent, [childC]);
		expect(subject.getNestedResources(parent).map((e) => e.identity())).toEqual([
			childA.identity(),
			childB.identity(),
			childC.identity(),
		]);
	});
});

// --- get_cost / get_parent_cost ---

describe("util.resource getCost / getParentCost", () => {
	test("a resource with no BaseCosts returns [null, null]", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getCost(resource)).toEqual([null, null]);
	});

	test("sums BaseCosts' applied values via util/cost.ts's calculateAppliedValue", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		resource.set("BaseCosts", [
			createCostValue(file, { appliedValue: 100 }),
			createCostValue(file, { appliedValue: 25 }),
		]);
		expect(subject.getCost(resource)).toEqual([125, null]);
	});

	test("a UnitBasis whose UnitComponent is an IfcConversionBasedUnit sets the unit to its Name", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const hour = createConversionBasedUnit(file, "hour");
		resource.set("BaseCosts", [createCostValue(file, { appliedValue: 50, unitBasisUnit: hour })]);
		expect(subject.getCost(resource)).toEqual([50, "hour"]);
	});

	test("a UnitBasis whose UnitComponent is NOT an IfcConversionBasedUnit (e.g. a plain SI unit) leaves the unit null", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		resource.set("BaseCosts", [createCostValue(file, { appliedValue: 50, unitBasisUnit: metre })]);
		expect(subject.getCost(resource)).toEqual([50, null]);
	});

	test("only the FIRST truthy UnitBasis across BaseCosts is used, matching Python's next(...)", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const hour = createConversionBasedUnit(file, "hour");
		const day = createConversionBasedUnit(file, "day");
		resource.set("BaseCosts", [
			createCostValue(file, { appliedValue: 10 }),
			createCostValue(file, { appliedValue: 20, unitBasisUnit: hour }),
			createCostValue(file, { appliedValue: 30, unitBasisUnit: day }),
		]);
		expect(subject.getCost(resource)).toEqual([60, "hour"]);
	});

	test("getParentCost returns undefined for a resource with no Nests", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getParentCost(resource)).toBeUndefined();
	});

	test("getParentCost delegates to getCost of the first Nests' RelatingObject", () => {
		const file = createTestFile("IFC4");
		const parent = file.createEntity("IfcCrewResource");
		const child = file.createEntity("IfcLaborResource");
		parent.set("BaseCosts", [createCostValue(file, { appliedValue: 200 })]);
		nest(file, parent, [child]);
		expect(subject.getParentCost(child)).toEqual([200, null]);
	});
});

// --- get_quantity ---

describe("util.resource getQuantity", () => {
	test("no Usage and no BaseQuantity defaults to 1.0", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		expect(subject.getQuantity(resource)).toBe(1.0);
	});

	test("no Usage but a BaseQuantity reads its value at index 3", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		resource.set("BaseQuantity", createQuantityCount(file, "Q", 9));
		expect(subject.getQuantity(resource)).toBe(9);
	});

	test("a Usage with ScheduleWork converts the duration to hours via ifc2datetime", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const usage = file.createEntity("IfcResourceTime");
		usage.set("ScheduleWork", "PT10H");
		resource.set("Usage", usage);
		expect(subject.getQuantity(resource)).toBe(10);
	});

	test("a Usage with no ScheduleWork falls back to BaseQuantity, not treated as present", () => {
		const file = createTestFile("IFC4");
		const resource = file.createEntity("IfcLaborResource");
		const usage = file.createEntity("IfcResourceTime");
		usage.set("Name", "Some usage with no ScheduleWork set");
		resource.set("Usage", usage);
		resource.set("BaseQuantity", createQuantityCount(file, "Q", 4));
		expect(subject.getQuantity(resource)).toBe(4);
	});
});

// --- resourcesToQuantities (module-level constant, Python-API-surface parity) ---

describe("util.resource resourcesToQuantities", () => {
	test("matches Python's RESOURCES_TO_QUANTITIES literal", () => {
		expect(subject.resourcesToQuantities).toEqual({
			IfcCrewResource: ["IfcQuantityTime"],
			IfcLaborResource: ["IfcQuantityTime"],
			IfcSubContractResource: ["IfcQuantityTime"],
			IfcConstructionEquipmentResource: ["IfcQuantityTime"],
			IfcConstructionMaterialResource: [
				"IfcQuantityVolume",
				"IfcQuantityArea",
				"IfcQuantityLength",
				"IfcQuantityWeight",
			],
			IfcConstructionProductResource: ["IfcQuantityCount"],
		});
	});
});
