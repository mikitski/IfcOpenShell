// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/spatial/test_reference_structure.py` (src/ifcopenshell-
// python) -- all 3 real Python test methods ported verbatim.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { referenceStructure } from "../../../src/api/spatial/referenceStructure";
import type { EntityInstance } from "../../../src/entityInstance";
import { getStructureReferencedElements } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.spatial.referenceStructure (%s)", (schema) => {
	test("referencing a structure", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");

		referenceStructure(file, { products: [subelement, subelement2], relatingStructure: element });

		const referenced = getStructureReferencedElements(element);
		expect(referenced.size).toBe(2);
		expect([...referenced].some((e) => e.equals(subelement))).toBe(true);
		expect([...referenced].some((e) => e.equals(subelement2))).toBe(true);
	});

	test("doing nothing if the structure is already referenced", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		referenceStructure(file, { products: [subelement, subelement2], relatingStructure: element });
		const totalElements = [...file].length;

		referenceStructure(file, { products: [subelement, subelement2], relatingStructure: element });

		expect([...file].length).toBe(totalElements);
	});

	test("old relationships are updated if they still contain elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement1 = file.createEntity("IfcWall");
		referenceStructure(file, { products: [subelement1], relatingStructure: element });
		const subelement2 = file.createEntity("IfcWall");
		const subelement3 = file.createEntity("IfcWall");

		referenceStructure(file, { products: [subelement2, subelement3], relatingStructure: element });

		const rel = (subelement1.get("ReferencedInStructures") as EntityInstance[])[0];
		expect((rel.get("RelatedElements") as EntityInstance[]).length).toBe(3);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.spatial.referenceStructure Transaction/undo-redo (%s)", (schema) => {
	test("undo removes a freshly-created reference rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");

		file.beginTransaction();
		referenceStructure(file, { products: [subelement], relatingStructure: element });
		file.endTransaction();

		const relId = (subelement.get("ReferencedInStructures") as EntityInstance[])[0].id();
		expect(getStructureReferencedElements(element).size).toBe(1);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect(getStructureReferencedElements(element).size).toBe(0);

		file.redo();
		expect(file.byId(relId).isA("IfcRelReferencedInSpatialStructure")).toBe(true);
		expect(getStructureReferencedElements(element).size).toBe(1);
	});

	test("undo restores a rewritten reference rel's RelatedElements (merge case)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement1 = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		referenceStructure(file, { products: [subelement1], relatingStructure: element });
		const relId = (subelement1.get("ReferencedInStructures") as EntityInstance[])[0].id();

		file.beginTransaction();
		referenceStructure(file, { products: [subelement2], relatingStructure: element });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedElements") as EntityInstance[]).length).toBe(2);

		file.undo();
		expect((file.byId(relId).get("RelatedElements") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect((file.byId(relId).get("RelatedElements") as EntityInstance[]).length).toBe(2);
	});
});
