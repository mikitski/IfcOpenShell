// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_edit_role.py` (src/ifcopenshell-python) --
// the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { editRole } from "../../../src/api/owner/editRole";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.editRole (%s)", (schema) => {
	test("editing a role", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		editRole(file, {
			role,
			attributes: { Role: "ARCHITECT", UserDefinedRole: "UserDefinedRole", Description: "Description" },
		});
		expect(role.get("Role")).toBe("ARCHITECT");
		expect(role.get("UserDefinedRole")).toBe("UserDefinedRole");
		expect(role.get("Description")).toBe("Description");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.editRole Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Role; redo re-applies the edit", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole", "ARCHITECT");

		file.beginTransaction();
		editRole(file, { role, attributes: { Role: "ENGINEER" } });
		file.endTransaction();

		expect(role.get("Role")).toBe("ENGINEER");

		file.undo();
		expect(role.get("Role")).toBe("ARCHITECT");

		file.redo();
		expect(role.get("Role")).toBe("ENGINEER");
	});
});
