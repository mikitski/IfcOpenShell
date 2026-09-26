// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `copy_cost_item.py` (see `test/api/cost/` -- no
// `test_copy_cost_item.py`; `test_copy_cost_schedule.py` exercises it only
// transitively, per that file's own comment: "We don't check how well IfcCostItems
// are copied, it should be tested separately in test_copy_cost_item"). This suite is
// written directly from the real source's own behavior, including the disclosed
// return-type quirk (single entity vs. flat array) and the generic-inverse-attribute
// patching branch -- see `../../../src/api/cost/copyCostItem.ts`'s own extensive
// header comment.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { copyCostItem } from "../../../src/api/cost/copyCostItem";
import type { EntityInstance } from "../../../src/entityInstance";
import { getNest } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.copyCostItem (%s)", (schema) => {
	test("a leaf cost item (no nested children) returns a single copy", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo" });
		const item = addCostItem(file, { costSchedule: schedule });
		item.set("Name", "Original");

		const copy = copyCostItem(file, { costItem: item });

		expect(Array.isArray(copy)).toBe(false);
		const copied = copy as EntityInstance;
		expect(copied.isA("IfcCostItem")).toBe(true);
		expect(copied.equals(item)).toBe(false);
		expect(copied.get("Name")).toBe("Original");
		// The copy is also assigned to the same schedule -- the generic inverse-
		// attribute-patching branch appends it into the SAME IfcRelAssignsToControl.
		const hasAssignments = copied.get("HasAssignments") as EntityInstance[];
		expect(hasAssignments.some((a) => a.isA("IfcRelAssignsToControl"))).toBe(true);
	});

	test("a parent with nested children returns a flat array (root + every descendant)", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo" });
		const parent = addCostItem(file, { costSchedule: schedule });
		const child = addCostItem(file, { costItem: parent });

		const copy = copyCostItem(file, { costItem: parent });

		expect(Array.isArray(copy)).toBe(true);
		const copies = copy as EntityInstance[];
		expect(copies.length).toBe(2);
		const [newParent, newChild] = copies;
		expect(newParent.equals(parent)).toBe(false);
		expect(newChild.equals(child)).toBe(false);
		expect(getNest(newChild)?.equals(newParent)).toBe(true);
	});
});
