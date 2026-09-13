// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/spatial/test_dereference_structure.py` (src/ifcopenshell-
// python) -- all 3 real Python test methods ported verbatim.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { dereferenceStructure } from "../../../src/api/spatial/dereferenceStructure";
import { referenceStructure } from "../../../src/api/spatial/referenceStructure";
import type { EntityInstance } from "../../../src/entityInstance";
import { getReferencedStructures } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.spatial.dereferenceStructure (%s)", (schema) => {
	test("removing a reference", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		referenceStructure(file, { products: [subelement, subelement2], relatingStructure: element });

		dereferenceStructure(file, { products: [subelement, subelement2], relatingStructure: element });

		expect(getReferencedStructures(subelement)).toEqual([]);
		expect(file.byType("IfcRelReferencedInSpatialStructure").length).toBe(0);
	});

	test("doing nothing if no reference", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");

		dereferenceStructure(file, { products: [subelement, subelement2], relatingStructure: element });

		expect(getReferencedStructures(subelement)).toEqual([]);
		expect(getReferencedStructures(subelement2)).toEqual([]);
	});

	test("updating the rel when a reference is removed with multiple elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement1 = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		const subelement3 = file.createEntity("IfcWall");
		referenceStructure(file, { products: [subelement1], relatingStructure: element });
		referenceStructure(file, { products: [subelement2, subelement3], relatingStructure: element });

		dereferenceStructure(file, { products: [subelement1, subelement2], relatingStructure: element });

		const relatedElements = (element.get("ReferencesElements") as EntityInstance[])[0].get(
			"RelatedElements",
		) as EntityInstance[];
		expect(relatedElements.length).toBe(1);
		expect(relatedElements[0].equals(subelement3)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.spatial.dereferenceStructure Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the deleted reference rel; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		referenceStructure(file, { products: [subelement], relatingStructure: element });
		const relId = (subelement.get("ReferencedInStructures") as EntityInstance[])[0].id();

		file.beginTransaction();
		dereferenceStructure(file, { products: [subelement], relatingStructure: element });
		file.endTransaction();

		expect(() => file.byId(relId)).toThrow();
		expect(getReferencedStructures(subelement)).toEqual([]);

		file.undo();
		expect(file.byId(relId).isA("IfcRelReferencedInSpatialStructure")).toBe(true);
		expect(getReferencedStructures(subelement).some((s) => s.equals(element))).toBe(true);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
		expect(getReferencedStructures(subelement)).toEqual([]);
	});

	test("undo restores a rewritten reference rel's RelatedElements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement1 = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		referenceStructure(file, { products: [subelement1, subelement2], relatingStructure: element });
		const relId = (subelement1.get("ReferencedInStructures") as EntityInstance[])[0].id();

		file.beginTransaction();
		dereferenceStructure(file, { products: [subelement1], relatingStructure: element });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedElements") as EntityInstance[]).length).toBe(1);

		file.undo();
		const restored = file.byId(relId).get("RelatedElements") as EntityInstance[];
		expect(restored.length).toBe(2);

		file.redo();
		expect((file.byId(relId).get("RelatedElements") as EntityInstance[]).length).toBe(1);
	});
});
