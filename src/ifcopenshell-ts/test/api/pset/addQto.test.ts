// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset/test_add_qto.py` (src/ifcopenshell-python). Real
// Python's `TestAddQto` (IFC4) runs 3 tests (object/type/context); `TestAddQtoIFC2X3`
// runs 1 more (project) confirming `IfcElementQuantity` is available and used unguarded
// on IFC2X3 too (see `../../../src/api/pset/addQto.ts`'s own header comment). All 4
// ported below, using `describe.each(AVAILABLE_SCHEMAS)` for the first 3 (which apply
// identically across all 3 schemas -- `IfcContext` doesn't exist on IFC2X3, but
// `IfcProject` there is itself a plain `IfcObject`, so the same "to a context" test body
// exercises the equivalent `IfcObject` branch there, matching `addPset.test.ts`'s own
// established reasoning for the identical situation) rather than duplicating a
// separate IFC2X3-only "to a project" test.
//
// Original coverage added beyond the real Python file: by-name dedup/reuse for both
// branches, the `MethodOfMeasurement` "BaseQuantities" heuristic, the unsupported-class
// silent-`undefined` return (confirmed asymmetric with `addPset`'s `TypeError` -- see
// header comment), and Transaction/undo-redo regression coverage.

import { describe, expect, test } from "vitest";
import { addQto } from "../../../src/api/pset/addQto";
import type { EntityInstance } from "../../../src/entityInstance";
import { getPsets } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.pset.addQto (%s)", (schema) => {
	test("adding a qto to an object", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		expect(qto.isA("IfcElementQuantity")).toBe(true);
		expect("Qto_WallBaseQuantities" in getPsets(element)).toBe(true);
	});

	test("adding a qto to a type object", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const qto = addQto(file, { product: element, name: "Custom_Qto" }) as EntityInstance;
		expect(qto.isA("IfcElementQuantity")).toBe(true);
		expect("Custom_Qto" in getPsets(element)).toBe(true);
	});

	test("adding a qto to a context (IfcProject, an IfcObject on IFC2X3)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcProject");
		const qto = addQto(file, { product: element, name: "Custom_Qto" }) as EntityInstance;
		expect(qto.isA("IfcElementQuantity")).toBe(true);
		expect("Custom_Qto" in getPsets(element)).toBe(true);
	});

	// --- Original coverage ---

	test("MethodOfMeasurement is set to BaseQuantities only for a *BaseQuantities name", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		expect(qto.get("MethodOfMeasurement")).toBe("BaseQuantities");

		const element2 = file.createEntity("IfcWall");
		const qto2 = addQto(file, { product: element2, name: "Custom_Qto" }) as EntityInstance;
		expect(qto2.get("MethodOfMeasurement")).toBeNull();
	});

	test("returns the existing qto for an object if one with this name already exists", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		const qto2 = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		expect(qto2.equals(qto)).toBe(true);
		expect(file.byType("IfcElementQuantity").length).toBe(1);
	});

	test("returns the existing qto for a type if one with this name already exists", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		const qto2 = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		expect(qto2.equals(qto)).toBe(true);
		expect(file.byType("IfcElementQuantity").length).toBe(1);
	});

	test("an unsupported product class returns undefined, unlike addPset's TypeError", () => {
		const file = createTestFile(schema);
		const point = file.createEntity("IfcCartesianPoint", [0, 0, 0]);
		expect(addQto(file, { product: point, name: "X" })).toBeUndefined();
		expect(file.byType("IfcElementQuantity").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.pset.addQto Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created qto and rel; redo re-creates them", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");

		file.beginTransaction();
		const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		file.endTransaction();
		const qtoId = qto.id();
		expect(file.byType("IfcElementQuantity").length).toBe(1);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);

		file.undo();
		expect(() => file.byId(qtoId)).toThrow();
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);

		file.redo();
		expect(file.byId(qtoId).isA("IfcElementQuantity")).toBe(true);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);
	});

	test("undo restores HasPropertySets on a type", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");

		file.beginTransaction();
		addQto(file, { product: wallType, name: "Custom_Qto" });
		file.endTransaction();
		expect((wallType.get("HasPropertySets") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(wallType.get("HasPropertySets")).toBeNull();

		file.redo();
		expect((wallType.get("HasPropertySets") as EntityInstance[]).length).toBe(1);
	});
});
