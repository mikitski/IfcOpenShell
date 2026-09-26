// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_sort_nest.py` on its own (a module-private
// helper, never directly tested by `test/api/alignment/*.py` -- confirmed by reading
// the whole real test directory). Original test coverage written here, gated to
// IFC4X3 (this module is effectively IFC4X3-only, per `../../../src/api/alignment
// /index.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { _sortNest } from "../../../src/api/alignment/_sortNest";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._sortNest (IFC4X3)", () => {
	test("sorts RelatedObjects in place by a numeric key, and returns the same nest", () => {
		const file = createTestFile("IFC4X3");
		const a = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "C");
		const b = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "A");
		const c = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "B");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "Alignment");
		const nest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [a, b, c]);

		const names: Record<number, string> = { [a.id()]: "C", [b.id()]: "A", [c.id()]: "B" };

		const result = _sortNest(nest, (item: EntityInstance) => names[item.id()]);

		expect(result.equals(nest)).toBe(true);
		const sortedNames = (nest.get("RelatedObjects") as EntityInstance[]).map((item) => names[item.id()]);
		expect(sortedNames).toEqual(["A", "B", "C"]);
	});

	test("stable sort: equal keys preserve relative order", () => {
		const file = createTestFile("IFC4X3");
		const a = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "first-of-1");
		const b = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "only-2");
		const c = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "second-of-1");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "Alignment");
		const nest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [a, b, c]);

		const keys: Record<number, number> = { [a.id()]: 1, [b.id()]: 2, [c.id()]: 1 };

		_sortNest(nest, (item: EntityInstance) => keys[item.id()]);

		const sortedNames = (nest.get("RelatedObjects") as EntityInstance[]).map((item) => item.get("Name") as string);
		expect(sortedNames).toEqual(["first-of-1", "second-of-1", "only-2"]);
	});
});
