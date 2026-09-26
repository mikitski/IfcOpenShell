// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/aggregate/test_unassign_object.py` (src/ifcopenshell-
// python) -- all 3 real Python test methods ported, adapted in one disclosed way: real
// Python's setup calls `ifcopenshell.api.aggregate.assign_object` to create the
// `IfcRelAggregates` precondition, but `assign_object` is NOT ported in this chunk
// (see `../../../src/api/aggregate/unassignObject.ts`'s own header comment for why --
// `assign_container`, the only caller this chunk needs `unassign_object` for, never
// calls `assign_object`). Test setup here instead creates the `IfcRelAggregates`
// directly via `file.createEntity(...)`, faithfully reproducing the exact relationship
// shape `assign_object` itself would produce (a single `IfcRelAggregates` with the
// given `RelatingObject`/`RelatedObjects`) -- the function under test
// (`unassignObject`) and its assertions are otherwise identical to the real Python
// test.

import { beforeEach, describe, expect, test } from "vitest";
import { unassignObject } from "../../../src/api/aggregate/unassignObject";
import { ownerSettings } from "../../../src/api/owner/settings";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { getAggregate } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

/** IfcRelAggregates: GlobalId(0), OwnerHistory(1), Name(2), Description(3), RelatingObject(4), RelatedObjects(5). See this file's header comment for why this replaces the unported `aggregate.assign_object` in test setup. */
function createAggregatesRel(
	file: ReturnType<typeof createTestFile>,
	relatingObject: EntityInstance,
	relatedObjects: readonly EntityInstance[],
): EntityInstance {
	return file.createEntity("IfcRelAggregates", guid.new(), null, null, null, relatingObject, [...relatedObjects]);
}

describe.each(AVAILABLE_SCHEMAS)("api.aggregate.unassignObject (%s)", (schema) => {
	test("unassigning an object", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement1 = file.createEntity("IfcBuilding");
		const subelement2 = file.createEntity("IfcBuilding");
		createAggregatesRel(file, element, [subelement1, subelement2]);

		unassignObject(file, { products: [subelement1, subelement2] });

		expect(getAggregate(subelement1)).toBeNull();
		expect(getAggregate(subelement2)).toBeNull();
	});

	test("the rel is kept if there are more decomposed elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement1 = file.createEntity("IfcBuilding");
		const subelement2 = file.createEntity("IfcBuilding");
		createAggregatesRel(file, element, [subelement1]);
		createAggregatesRel(file, element, [subelement2]);

		unassignObject(file, { products: [subelement1] });

		expect(file.byType("IfcRelAggregates").length).toBe(1);
	});

	test("the rel is purged if there are no more decomposed elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement = file.createEntity("IfcBuilding");
		createAggregatesRel(file, element, [subelement]);

		unassignObject(file, { products: [subelement] });

		expect(file.byType("IfcRelAggregates").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.aggregate.unassignObject Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the deleted IfcRelAggregates; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement = file.createEntity("IfcBuilding");
		const rel = createAggregatesRel(file, element, [subelement]);
		const relId = rel.id();

		file.beginTransaction();
		unassignObject(file, { products: [subelement] });
		file.endTransaction();

		expect(() => file.byId(relId)).toThrow();
		expect(getAggregate(subelement)).toBeNull();

		file.undo();
		expect(file.byId(relId).isA("IfcRelAggregates")).toBe(true);
		expect(getAggregate(subelement)?.equals(element)).toBe(true);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
		expect(getAggregate(subelement)).toBeNull();
	});
});
