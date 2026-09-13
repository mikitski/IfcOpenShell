// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/spatial/test_unassign_container.py` (src/ifcopenshell-
// python) -- all 4 real Python test methods ported verbatim.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import { unassignContainer } from "../../../src/api/spatial/unassignContainer";
import type { EntityInstance } from "../../../src/entityInstance";
import { getContainer } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.spatial.unassignContainer (%s)", (schema) => {
	test("unassigning a container", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement, subelement2], relatingStructure: element });

		unassignContainer(file, { products: [subelement, subelement2] });

		expect(file.byType("IfcRelContainedInSpatialStructure").length).toBe(0);
	});

	test("doing nothing if no container", () => {
		const file = createTestFile(schema);
		const subelement = file.createEntity("IfcWall");

		unassignContainer(file, { products: [subelement] });

		expect(getContainer(subelement)).toBeNull();
	});

	test("updating the rel when a container is removed with multiple elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement, subelement2], relatingStructure: element });

		unassignContainer(file, { products: [subelement] });

		const rel = file.byType("IfcRelContainedInSpatialStructure")[0];
		const relatedElements = rel.get("RelatedElements") as EntityInstance[];
		expect(relatedElements.length).toBe(1);
		expect(relatedElements[0].equals(subelement2)).toBe(true);
	});

	test("deleting the rel when a container is removed with no elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		unassignContainer(file, { products: [subelement] });

		expect(file.byType("IfcRelContainedInSpatialStructure").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.spatial.unassignContainer Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the deleted containment rel; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });
		const relId = (subelement.get("ContainedInStructure") as EntityInstance[])[0].id();

		file.beginTransaction();
		unassignContainer(file, { products: [subelement] });
		file.endTransaction();

		expect(() => file.byId(relId)).toThrow();
		expect(getContainer(subelement)).toBeNull();

		file.undo();
		expect(file.byId(relId).isA("IfcRelContainedInSpatialStructure")).toBe(true);
		expect(getContainer(subelement)?.equals(element)).toBe(true);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
		expect(getContainer(subelement)).toBeNull();
	});

	test("undo restores a rewritten rel's RelatedElements (multi-element case)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement, subelement2], relatingStructure: element });
		const rel = (subelement.get("ContainedInStructure") as EntityInstance[])[0];
		const relId = rel.id();

		file.beginTransaction();
		unassignContainer(file, { products: [subelement] });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedElements") as EntityInstance[]).length).toBe(1);

		file.undo();
		const restoredRelated = file.byId(relId).get("RelatedElements") as EntityInstance[];
		expect(restoredRelated.length).toBe(2);

		file.redo();
		expect((file.byId(relId).get("RelatedElements") as EntityInstance[]).length).toBe(1);
	});
});
