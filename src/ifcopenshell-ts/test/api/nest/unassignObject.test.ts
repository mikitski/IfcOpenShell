// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/nest/test_unassign_object.py` (src/ifcopenshell-python).
// All 4 real Python test methods are ported. Real Python only runs this suite against
// IFC4/IFC2X3 -- extended to all of `AVAILABLE_SCHEMAS`, matching
// `./assignObject.test.ts`'s own established precedent.

import { beforeEach, describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/nest/assignObject";
import { unassignObject } from "../../../src/api/nest/unassignObject";
import { ownerSettings } from "../../../src/api/owner/settings";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { getNest } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.nest.unassignObject (%s)", (schema) => {
	test("unassigning an object", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelement1 = file.createEntity("IfcTask");
		const subelement2 = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [subelement1, subelement2], relatingObject: element });

		unassignObject(file, { relatedObjects: [subelement1, subelement2] });

		expect(getNest(subelement1)).toBeNull();
		expect(getNest(subelement2)).toBeNull();
	});

	test("the rel is kept if there are more nested elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelement2 = file.createEntity("IfcTask");
		const subelement1 = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [subelement1], relatingObject: element });
		assignObject(file, { relatedObjects: [subelement2], relatingObject: element });

		unassignObject(file, { relatedObjects: [subelement1] });

		expect(file.byType("IfcRelNests").length).toBe(1);
	});

	test("the rel is purged if there are no more nested elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelement = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [subelement], relatingObject: element });

		unassignObject(file, { relatedObjects: [subelement] });

		expect(file.byType("IfcRelNests").length).toBe(0);
	});

	test("maintain assignment order in related objects", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelements = Array.from({ length: 5 }, () => file.createEntity("IfcTask"));
		const rel = file.createEntity("IfcRelNests", guid.new(), null, null, null, element, [...subelements]);

		const originalOrder = [...subelements];
		// Unassign elements in some random order -- skip 1 element to make sure the rel
		// won't get removed.
		const removedIds = new Set<number>();
		for (const i of [0, 3, 2, 4]) {
			const subelement = subelements[i];
			unassignObject(file, { relatedObjects: [subelement] });
			removedIds.add(subelement.id());
			const expectedOrder = originalOrder.filter((o) => !removedIds.has(o.id()));
			const actual = rel.get("RelatedObjects") as EntityInstance[];
			expect(actual.map((o) => o.id())).toEqual(expectedOrder.map((o) => o.id()));
		}
	});
});
