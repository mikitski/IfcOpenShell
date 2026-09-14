// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_add_organisation.py` (src/ifcopenshell-python)
// -- the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { addOrganisation } from "../../../src/api/owner/addOrganisation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.addOrganisation (%s)", (schema) => {
	test("adding an organisation", () => {
		const file = createTestFile(schema);
		const org = addOrganisation(file, { identification: "Id", name: "Name" });
		expect(org.getByIndex(0)).toBe("Id");
		expect(org.get("Name")).toBe("Name");
	});

	test("adding an organisation with defaults", () => {
		const file = createTestFile(schema);
		const org = addOrganisation(file);
		expect(org.getByIndex(0)).toBe("APTR");
		expect(org.get("Name")).toBe("Aperture Science");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.addOrganisation Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcOrganization; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const org = addOrganisation(file, { identification: "AWB", name: "Architects Without Ballpens" });
		file.endTransaction();
		const orgId = org.id();

		expect(file.byType("IfcOrganization").length).toBeGreaterThan(0);

		file.undo();
		expect(() => file.byId(orgId)).toThrow();

		file.redo();
		expect(file.byId(orgId).isA("IfcOrganization")).toBe(true);
		expect(file.byId(orgId).get("Name")).toBe("Architects Without Ballpens");
	});
});
