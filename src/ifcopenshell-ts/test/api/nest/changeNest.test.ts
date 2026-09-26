// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `change_nest.py` (see `test/api/nest/` -- no
// `test_change_nest.py`). This suite is written directly from the real source's own
// behavior (reparent `item` to `newParent`, purging the old nest rel first) and pins
// the disclosed IFC2X3 throw quirk documented in `../../../src/api/nest/changeNest.ts`'s
// own header comment.

import { beforeEach, describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/nest/assignObject";
import { changeNest } from "../../../src/api/nest/changeNest";
import { ownerSettings } from "../../../src/api/owner/settings";
import type { EntityInstance } from "../../../src/entityInstance";
import { getNest } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.nest.changeNest (%s)", (schema) => {
	test("reparenting an item to a new parent", () => {
		const file = createTestFile(schema);
		const oldParent = file.createEntity("IfcTask");
		const newParent = file.createEntity("IfcTask");
		const sibling = file.createEntity("IfcTask");
		const item = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [item, sibling], relatingObject: oldParent });

		changeNest(file, { item, newParent });

		expect(getNest(item)?.equals(newParent)).toBe(true);
		expect(getNest(sibling)?.equals(oldParent)).toBe(true);
	});

	test("the old nest rel is purged when the item was its sole member", () => {
		const file = createTestFile(schema);
		const oldParent = file.createEntity("IfcTask");
		const newParent = file.createEntity("IfcTask");
		const item = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [item], relatingObject: oldParent });
		const oldRelId = (item.get("Nests") as EntityInstance[])[0].id();

		changeNest(file, { item, newParent });

		expect(() => file.byId(oldRelId)).toThrow();
		expect(getNest(item)?.equals(newParent)).toBe(true);
	});

	test("does nothing if the item has no current nest", () => {
		const file = createTestFile(schema);
		const newParent = file.createEntity("IfcTask");
		const item = file.createEntity("IfcTask");

		changeNest(file, { item, newParent });

		expect(getNest(item)).toBeNull();
	});
});

// See `../../../src/api/nest/changeNest.ts`'s own header comment (quirk #2): real
// Python reads `item.Nests` with no `file.schema == "IFC2X3"` branch anywhere in
// `change_nest.py`'s 42 lines, so this throws on IFC2X3 -- pinned here rather than
// silently working around it.
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.nest.changeNest IFC2X3 (unguarded Nests throw)", () => {
	test("throws on IFC2X3 -- item.get('Nests') is not a registered attribute for that schema", () => {
		const file = createTestFile("IFC2X3");
		const newParent = file.createEntity("IfcTask");
		const item = file.createEntity("IfcTask");

		expect(() => changeNest(file, { item, newParent })).toThrow();
	});
});
