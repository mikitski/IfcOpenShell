// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/structural/test_assign_to_building.py`
// (src/ifcopenshell-python) -- all 3 real test methods ported verbatim, extended from
// real Python's own IFC4/IFC2X3-only coverage to all of `AVAILABLE_SCHEMAS` including
// IFC4X3.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralAnalysisModel } from "../../../src/api/structural/addStructuralAnalysisModel";
import { assignToBuilding } from "../../../src/api/structural/assignToBuilding";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.assignToBuilding (%s)", (schema) => {
	test("creating a new relationship", () => {
		const file = createTestFile(schema);
		const model = addStructuralAnalysisModel(file, {});
		const building = createEntity(file, { ifcClass: "IfcBuilding" });

		const rel = assignToBuilding(file, { structuralAnalysisModel: model, building });

		expect(rel.isA("IfcRelServicesBuildings")).toBe(true);
		expect((rel.get("RelatingSystem") as EntityInstance).equals(model)).toBe(true);
		expect((rel.get("RelatedBuildings") as EntityInstance[]).some((b) => b.equals(building))).toBe(true);
	});

	test("adding a second building to an existing relationship", () => {
		const file = createTestFile(schema);
		const model = addStructuralAnalysisModel(file, {});
		const building1 = createEntity(file, { ifcClass: "IfcBuilding" });
		const building2 = createEntity(file, { ifcClass: "IfcBuilding" });

		const rel1 = assignToBuilding(file, { structuralAnalysisModel: model, building: building1 });
		const rel2 = assignToBuilding(file, { structuralAnalysisModel: model, building: building2 });

		expect(rel1.equals(rel2)).toBe(true);
		expect(file.byType("IfcRelServicesBuildings").length).toBe(1);
		const relatedBuildings = rel1.get("RelatedBuildings") as EntityInstance[];
		expect(relatedBuildings.some((b) => b.equals(building1))).toBe(true);
		expect(relatedBuildings.some((b) => b.equals(building2))).toBe(true);
	});

	test("does not duplicate an existing assignment", () => {
		const file = createTestFile(schema);
		const model = addStructuralAnalysisModel(file, {});
		const building = createEntity(file, { ifcClass: "IfcBuilding" });

		assignToBuilding(file, { structuralAnalysisModel: model, building });
		assignToBuilding(file, { structuralAnalysisModel: model, building });

		expect(file.byType("IfcRelServicesBuildings").length).toBe(1);
		const rels = file.byType("IfcRelServicesBuildings");
		expect((rels[0].get("RelatedBuildings") as unknown[]).length).toBe(1);
	});
});
