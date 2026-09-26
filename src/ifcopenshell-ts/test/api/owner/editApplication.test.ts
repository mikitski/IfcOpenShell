// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_edit_application.py` (src/ifcopenshell-python)
// -- the sole real Python test method ported (run against IFC4/IFC2X3/IFC4X3 there via
// multiple inheritance).

import { describe, expect, test } from "vitest";
import { editApplication } from "../../../src/api/owner/editApplication";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.editApplication (%s)", (schema) => {
	test("editing an application", () => {
		const file = createTestFile(schema);
		const application = file.createEntity("IfcApplication");
		const organization = file.createEntity("IfcOrganization");
		const attributes = {
			ApplicationDeveloper: organization,
			Version: "v001",
			ApplicationFullName: "App Name",
			ApplicationIdentifier: "App Name",
		};
		editApplication(file, { application, attributes });
		expect((application.get("ApplicationDeveloper") as typeof organization).equals(organization)).toBe(true);
		expect(application.get("Version")).toBe("v001");
		expect(application.get("ApplicationFullName")).toBe("App Name");
		expect(application.get("ApplicationIdentifier")).toBe("App Name");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.editApplication Transaction/undo-redo (%s)", (schema) => {
	test("undo reverts the edited attributes; redo reapplies them", () => {
		const file = createTestFile(schema);
		const application = file.createEntity("IfcApplication");

		file.beginTransaction();
		editApplication(file, { application, attributes: { ApplicationFullName: "App Name" } });
		file.endTransaction();

		expect(application.get("ApplicationFullName")).toBe("App Name");

		file.undo();
		expect(application.get("ApplicationFullName")).toBeNull();

		file.redo();
		expect(application.get("ApplicationFullName")).toBe("App Name");
	});
});
