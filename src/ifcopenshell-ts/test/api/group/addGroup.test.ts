// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/group/test_add_group.py` (src/ifcopenshell-python) --
// both real Python test methods ported verbatim.

import { describe, expect, test } from "vitest";
import { addGroup } from "../../../src/api/group/addGroup";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.group.addGroup (%s)", (schema) => {
	test("no arguments", () => {
		const file = createTestFile(schema);
		const group = addGroup(file, {});
		expect(group.get("Name")).toBe("Unnamed");
		expect(group.get("Description")).toBeNull();
	});

	test("with name and description", () => {
		const file = createTestFile(schema);
		const group = addGroup(file, { name: "Name", description: "Description" });
		expect(group.get("Name")).toBe("Name");
		expect(group.get("Description")).toBe("Description");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.group.addGroup Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created group; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const group = addGroup(file, { name: "Unit 1A" });
		file.endTransaction();
		const id = group.id();

		expect(file.byType("IfcGroup").length).toBe(1);

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).get("Name")).toBe("Unit 1A");
	});
});
