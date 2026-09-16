// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/resource/test_calculate_resource_work.py` (src/
// ifcopenshell-python). Real Python's own fixtures use
// `ifcopenshell.api.sequence.add_task`/`.assign_product`/`.assign_process` (`api
// .sequence` has no TS port of any kind -- this chunk's own disclosed, out-of-scope
// dependency, see `../../../src/api/resource/index.ts`'s header comment) AND
// `ifcopenshell.api.pset.add_pset`/`.edit_pset`/`.add_qto`/`.edit_qto` for the
// `EPset_Productivity`/`Qto_SlabBaseQuantities` setup.
//
// This port's already-landed `api.pset.editPset` throws ("Attribute access is only
// supported on entity instances") when asked to infer a primary-measure-type for a
// non-buildingSMART-standard property name like `EPset_Productivity`'s own
// `BaseQuantityConsumed` (confirmed empirically while writing this test, a pre-
// existing `api.pset` gap unrelated to this chunk, out of scope to fix here) --
// so, matching `test/util/element.test.ts`'s own established `addPset`/`addQto` local-
// fixture-helper precedent (built for the SAME reason: constructing psets/qtos
// directly, bypassing `api.pset`'s type-inference machinery entirely), this file
// builds the `IfcPropertySet`/`IfcElementQuantity` graph directly via
// `file.createEntity(...)` + `.set(...)` instead of going through `api.pset` at all.
// `util.resource.getProductivity`/`getTotalQuantityProduced` (this function's real
// dependencies, via `util.resource.getResourceRequiredWork`) only ever read
// `util.element.getPsets(...)`'s own resulting `{propertyName: rawValue}` dict --
// verified directly against that function's source -- so a bare-JS-primitive
// `NominalValue`/quantity value (not a wrapped `IfcLabel`/`IfcReal` instance) round-
// trips through it identically either way.
//
// Real Python's own comment: "resource module features relies on entities introduced
// in IFC4 therefore no IFC2X3 tests" -- matched here via `AVAILABLE_SCHEMAS.filter((s)
// => s !== "IFC2X3")`.
//
// --- Real, disclosed float-rendering divergence in tests 1/2, NOT a new finding ---
//
// Real Python asserts `"P2.0D"`/`"PT4.0H"` (a Python `float`'s own `str()`/f-string
// rendering always keeps a trailing `.0` for a whole-number result). This port's
// `util/resource.ts`'s own already-disclosed quirk 2 (see that file's header comment,
// cross-referenced from `TODOS.md`'s "EntityInstance.getByIndex/wrapValue collapse
// EXPRESS INTEGER vs. REAL" entry) means the IDENTICAL numeric computation renders as
// `"P2D"`/`"PT4H"` here instead -- the underlying VALUE is identical either way, only
// the string's decimal-point presence differs. This port's own two positive tests
// assert the ACTUAL (disclosed, already-known) rendering, not the real Python string
// literally -- test 4 (a genuinely non-whole-number result, `"PT0.5H"`) needs no such
// adaptation and asserts the real Python value verbatim.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { calculateResourceWork } from "../../../src/api/resource/calculateResourceWork";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

// --- local fixture helpers replacing the unported `api.sequence` and the buggy
// `api.pset` type-inference path, see header comment ---

function addPset(file: IfcFile, product: EntityInstance, name: string, properties: Record<string, unknown>): void {
	const pset = file.createEntity("IfcPropertySet");
	pset.set("Name", name);
	pset.set(
		"HasProperties",
		Object.entries(properties).map(([key, value]) => {
			const prop = file.createEntity("IfcPropertySingleValue");
			prop.set("Name", key);
			prop.set("NominalValue", value);
			return prop;
		}),
	);
	const rel = file.createEntity("IfcRelDefinesByProperties");
	rel.set("RelatedObjects", [product]);
	rel.set("RelatingPropertyDefinition", pset);
}

function addQto(file: IfcFile, product: EntityInstance, name: string, quantities: Record<string, number>): void {
	const qto = file.createEntity("IfcElementQuantity");
	qto.set("Name", name);
	qto.set(
		"Quantities",
		Object.entries(quantities).map(([key, value]) => {
			// A generic `IfcQuantityCount` suffices regardless of what the property name
			// suggests semantically -- `getTotalQuantityProduced` only reads index 0
			// (Name) and index 3 (the value slot), the same position across every
			// `IfcPhysicalSimpleQuantity` subtype. Matches `test/util/element.test.ts`'s
			// own `addQto` helper's identical shortcut.
			const quantity = file.createEntity("IfcQuantityCount");
			quantity.set("Name", key);
			quantity.setByIndex(3, value);
			return quantity;
		}),
	);
	const rel = file.createEntity("IfcRelDefinesByProperties");
	rel.set("RelatedObjects", [product]);
	rel.set("RelatingPropertyDefinition", qto);
}

function assignProduct(file: IfcFile, relatingProduct: EntityInstance, relatedObject: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToProduct");
	rel.set("RelatedObjects", [relatedObject]);
	rel.set("RelatingProduct", relatingProduct);
	return rel;
}

function assignProcess(file: IfcFile, relatingProcess: EntityInstance, relatedObject: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToProcess");
	rel.set("RelatedObjects", [relatedObject]);
	rel.set("RelatingProcess", relatingProcess);
	return rel;
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.calculateResourceWork (%s)", (schema) => {
	test("calculating resource work based on a daily productivity rate", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		addPset(file, resource, "EPset_Productivity", {
			BaseQuantityConsumed: "P0.5D",
			BaseQuantityProducedName: "GrossVolume",
			BaseQuantityProducedValue: 5,
		});

		const slab = createEntity(file, { ifcClass: "IfcSlab" });
		addQto(file, slab, "Qto_SlabBaseQuantities", { GrossVolume: 20 });

		const task = file.createEntity("IfcTask");
		assignProduct(file, slab, task);
		assignProcess(file, task, resource);

		calculateResourceWork(file, { resource });

		// See this file's header comment: real Python asserts "P2.0D".
		expect((resource.get("Usage") as EntityInstance).get("ScheduleWork")).toBe("P2D");
	});

	test("calculating resource work based on an hourly productivity rate", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		addPset(file, resource, "EPset_Productivity", {
			BaseQuantityConsumed: "PT1H",
			BaseQuantityProducedName: "GrossVolume",
			BaseQuantityProducedValue: 5,
		});

		const slab = createEntity(file, { ifcClass: "IfcSlab" });
		addQto(file, slab, "Qto_SlabBaseQuantities", { GrossVolume: 20 });

		const task = file.createEntity("IfcTask");
		assignProduct(file, slab, task);
		assignProcess(file, task, resource);

		calculateResourceWork(file, { resource });

		// See this file's header comment: real Python asserts "PT4.0H".
		expect((resource.get("Usage") as EntityInstance).get("ScheduleWork")).toBe("PT4H");
	});

	test("no calculation if no productivity data available", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });

		const slab = createEntity(file, { ifcClass: "IfcSlab" });
		addQto(file, slab, "Qto_SlabBaseQuantities", { GrossVolume: 20 });

		const task = file.createEntity("IfcTask");
		assignProduct(file, slab, task);
		assignProcess(file, task, resource);

		calculateResourceWork(file, { resource });
		expect(resource.get("Usage")).toBeNull();

		addPset(file, resource, "EPset_Productivity", { BaseQuantityProducedName: "foo" });

		calculateResourceWork(file, { resource });
		expect(resource.get("Usage")).toBeNull();
	});

	test("calculating resource work based on a counted quantity", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		addPset(file, resource, "EPset_Productivity", {
			BaseQuantityConsumed: "PT1H",
			BaseQuantityProducedName: "Count",
			BaseQuantityProducedValue: 2,
		});

		const slab = createEntity(file, { ifcClass: "IfcSlab" });
		addQto(file, slab, "Qto_SlabBaseQuantities", { GrossVolume: 20 });

		// Real Python's own fixture also calls `assign_product(relating_product=slab,
		// related_object=resource)` here, directly onto the resource -- verified
		// against `util/resource.ts`'s `getParametricResourceProducts` to have no
		// effect on the outcome (it only ever reads `IfcRelAssignsToProcess`-shaped
		// `resource.HasAssignments`, never an `IfcRelAssignsToProduct` assigned
		// directly to the resource), so it's omitted here as a genuine no-op.
		const task = file.createEntity("IfcTask");
		assignProduct(file, slab, task);
		assignProcess(file, task, resource);

		calculateResourceWork(file, { resource });

		expect((resource.get("Usage") as EntityInstance).get("ScheduleWork")).toBe("PT0.5H");
	});
});
