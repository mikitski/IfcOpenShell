// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_group.py` (no `test_edit_group.py` counterpart
// -- confirmed by directory listing). Tests below are new, matching
// `../layer/editLayer.test.ts`'s/`../context/editContext.test.ts`'s identical shape
// for the identically-structured Python source.

import { describe, expect, test } from "vitest";
import { editGroup } from "../../../src/api/group/editGroup";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.group.editGroup (%s)", (schema) => {
	test("editing a group's attributes", () => {
		const file = createTestFile(schema);
		const group = file.createEntity("IfcGroup", null, null, "Name");

		editGroup(file, {
			group,
			attributes: { Description: "All furniture and joinery included in the unit" },
		});

		expect(group.get("Description")).toBe("All furniture and joinery included in the unit");
		expect(group.get("Name")).toBe("Name");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.group.editGroup Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const group = file.createEntity("IfcGroup", null, null, "Old");

		file.beginTransaction();
		editGroup(file, { group, attributes: { Name: "New", Description: "Updated" } });
		file.endTransaction();

		expect(group.get("Name")).toBe("New");
		expect(group.get("Description")).toBe("Updated");

		file.undo();
		expect(group.get("Name")).toBe("Old");
		expect(group.get("Description")).toBeNull();

		file.redo();
		expect(group.get("Name")).toBe("New");
		expect(group.get("Description")).toBe("Updated");
	});
});
