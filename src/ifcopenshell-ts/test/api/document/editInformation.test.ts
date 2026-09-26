// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_information.py` (no `test_edit_information.py`
// counterpart -- confirmed by directory listing). Tests below are new, matching
// `../classification/editClassification.test.ts`'s identical shape for the identically-
// structured Python source.

import { describe, expect, test } from "vitest";
import { addInformation } from "../../../src/api/document/addInformation";
import { editInformation } from "../../../src/api/document/editInformation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.editInformation (%s)", (schema) => {
	test("editing an information's attributes", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});
		const idAttribute = schema === "IFC2X3" ? "DocumentId" : "Identification";

		editInformation(file, { information, attributes: { [idAttribute]: "A-GA-6100", Name: "Overall Plan" } });

		expect(information.get(idAttribute)).toBe("A-GA-6100");
		expect(information.get("Name")).toBe("Overall Plan");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.editInformation Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});

		// `Purpose` (unlike `Location`) is declared on `IfcDocumentInformation` in all 3
		// schemas -- `Location` only exists there on IFC4+ (confirmed against `ifc2x3.d.ts`,
		// which has no such attribute on this class at all; IFC2X3's `IfcDocumentInformation`
		// simply has no document-location field).
		file.beginTransaction();
		editInformation(file, { information, attributes: { Name: "Overall Plan", Purpose: "For approval" } });
		file.endTransaction();

		expect(information.get("Name")).toBe("Overall Plan");
		expect(information.get("Purpose")).toBe("For approval");

		file.undo();
		expect(information.get("Name")).toBe("Unnamed");
		expect(information.get("Purpose")).toBeNull();

		file.redo();
		expect(information.get("Name")).toBe("Overall Plan");
		expect(information.get("Purpose")).toBe("For approval");
	});
});
