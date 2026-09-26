// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `reorder_nesting.py` (see `test/api/nest/` -- no
// `test_reorder_nesting.py`). This suite is written directly from the real source's
// own behavior and pins the two disclosed quirks documented in
// `../../../src/api/nest/reorderNesting.ts`'s own header comment: the unguarded IFC2X3
// throw, and the `oldIndex=0` falsy-default quirk.

import { beforeEach, describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/nest/assignObject";
import { reorderNesting } from "../../../src/api/nest/reorderNesting";
import { ownerSettings } from "../../../src/api/owner/settings";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.nest.reorderNesting (%s)", (schema) => {
	test("reorders an item using an explicit oldIndex/newIndex", () => {
		const file = createTestFile(schema);
		const parent = file.createEntity("IfcTask");
		const items = Array.from({ length: 3 }, () => file.createEntity("IfcTask"));
		const rel = assignObject(file, { relatedObjects: items, relatingObject: parent }) as EntityInstance;

		// Move the item at index 2 to index 0.
		reorderNesting(file, { item: items[2], oldIndex: 2, newIndex: 0 });

		const related = rel.get("RelatedObjects") as EntityInstance[];
		expect(related.map((o) => o.id())).toEqual([items[2].id(), items[0].id(), items[1].id()]);
	});

	test("resolves the item's own current index when oldIndex is omitted", () => {
		const file = createTestFile(schema);
		const parent = file.createEntity("IfcTask");
		const items = Array.from({ length: 3 }, () => file.createEntity("IfcTask"));
		const rel = assignObject(file, { relatedObjects: items, relatingObject: parent }) as EntityInstance;

		reorderNesting(file, { item: items[2], newIndex: 0 });

		const related = rel.get("RelatedObjects") as EntityInstance[];
		expect(related.map((o) => o.id())).toEqual([items[2].id(), items[0].id(), items[1].id()]);
	});

	test("does nothing if the item has no current nest", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcTask");

		// Should not throw.
		reorderNesting(file, { item, oldIndex: 0, newIndex: 1 });
	});

	// See `../../../src/api/nest/reorderNesting.ts`'s own header comment: real Python's
	// `if not old_index: old_index = ...` treats an EXPLICIT `oldIndex: 0` the exact
	// same as an omitted one, always re-resolving to `item`'s own actual index instead
	// of trusting the caller's literal `0`.
	test("an explicit oldIndex of 0 is silently overridden to the item's own actual index (disclosed quirk)", () => {
		const file = createTestFile(schema);
		const parent = file.createEntity("IfcTask");
		const items = Array.from({ length: 3 }, () => file.createEntity("IfcTask"));
		const rel = assignObject(file, { relatedObjects: items, relatingObject: parent }) as EntityInstance;

		// `items[2]` is genuinely at index 2, not 0. If the literal `oldIndex: 0` were
		// honored, this would pop `items[0]` (not `items[2]`) and reinsert it at index
		// 2, yielding `[items[1], items[2], items[0]]`. Instead, the falsy check
		// re-resolves `oldIndex` to `items[2]`'s own actual index (2) -- moving it to
		// `newIndex: 2` is then a no-op, leaving the list completely unchanged.
		reorderNesting(file, { item: items[2], oldIndex: 0, newIndex: 2 });

		const related = rel.get("RelatedObjects") as EntityInstance[];
		expect(related.map((o) => o.id())).toEqual(items.map((o) => o.id()));
	});
});

// See `../../../src/api/nest/reorderNesting.ts`'s own header comment: real Python
// reads `item.Nests` with no `file.schema == "IFC2X3"` branch anywhere in
// `reorder_nesting.py`'s 32 lines, so this throws on IFC2X3.
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.nest.reorderNesting IFC2X3 (unguarded Nests throw)", () => {
	test("throws on IFC2X3 -- item.get('Nests') is not a registered attribute for that schema", () => {
		const file = createTestFile("IFC2X3");
		const item = file.createEntity("IfcTask");

		expect(() => reorderNesting(file, { item, oldIndex: 0, newIndex: 1 })).toThrow();
	});
});
