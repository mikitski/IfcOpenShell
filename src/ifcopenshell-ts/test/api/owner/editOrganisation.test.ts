// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_edit_organisation.py` (src/ifcopenshell-python)
// -- the sole real Python test method ported (run against IFC2X3/IFC4/IFC4X3 there via
// multiple inheritance).

import { describe, expect, test } from "vitest";
import { editOrganisation } from "../../../src/api/owner/editOrganisation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.editOrganisation (%s)", (schema) => {
	test("editing an organisation", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");
		const attributes: Record<string, unknown> = {
			[schema !== "IFC2X3" ? "Identification" : "Id"]: "Identification",
			Name: "Name",
			Description: "Description",
		};
		editOrganisation(file, { organisation, attributes });
		for (const [attr, value] of Object.entries(attributes)) {
			expect(organisation.get(attr)).toBe(value);
		}
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.editOrganisation Transaction/undo-redo (%s)", (schema) => {
	test("undo reverts the edited attributes; redo reapplies them", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");

		file.beginTransaction();
		editOrganisation(file, { organisation, attributes: { Name: "Name", Description: "Description" } });
		file.endTransaction();

		expect(organisation.get("Name")).toBe("Name");
		expect(organisation.get("Description")).toBe("Description");

		file.undo();
		expect(organisation.get("Name")).toBeNull();
		expect(organisation.get("Description")).toBeNull();

		file.redo();
		expect(organisation.get("Name")).toBe("Name");
		expect(organisation.get("Description")).toBe("Description");
	});
});
