// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage -- no real Python `test/api/owner/test_remove_application.py`
// exists (confirmed by directory listing: `remove_application.py` is the one function
// in this whole chunk with no ported real-Python test file at all). Shaped like this
// chunk's other, real-Python-backed `remove_*` tests below.

import { describe, expect, test } from "vitest";
import { removeApplication } from "../../../src/api/owner/removeApplication";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeApplication (%s)", (schema) => {
	test("removing an application", () => {
		const file = createTestFile(schema);
		const application = file.createEntity("IfcApplication");
		const applicationId = application.id();
		removeApplication(file, { application });
		expect(() => file.byId(applicationId)).toThrow();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeApplication Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed IfcApplication; redo removes it again", () => {
		const file = createTestFile(schema);
		const application = file.createEntity("IfcApplication", null, "v1", "Name", "Identifier");
		const applicationId = application.id();

		file.beginTransaction();
		removeApplication(file, { application });
		file.endTransaction();

		expect(() => file.byId(applicationId)).toThrow();

		file.undo();
		expect(file.byId(applicationId).isA("IfcApplication")).toBe(true);
		expect(file.byId(applicationId).get("Version")).toBe("v1");

		file.redo();
		expect(() => file.byId(applicationId)).toThrow();
	});
});
