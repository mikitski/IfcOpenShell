// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_edit_reference.py` (src/ifcopenshell-python)
// -- the sole real Python test method ported, including its own `reference[1] ==
// "Identification"` positional-index assertion (Python's raw STEP-attribute indexing --
// position 1 is `Identification` on IFC4+/`ItemReference` on IFC2X3, both the same
// position, per `addReference.ts`'s own header comment), ported here via
// `.getByIndex(1)`.

import { describe, expect, test } from "vitest";
import { addLibrary } from "../../../src/api/library/addLibrary";
import { addReference } from "../../../src/api/library/addReference";
import { editReference } from "../../../src/api/library/editReference";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.library.editReference (%s)", (schema) => {
	test("editing a reference", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const isIfc2x3 = schema === "IFC2X3";

		const attributes: Record<string, unknown> = {
			Location: "Location",
			[isIfc2x3 ? "ItemReference" : "Identification"]: "Identification",
			Name: "Name",
		};
		if (!isIfc2x3) {
			attributes.Description = "Description";
			attributes.Language = "Language";
		}

		editReference(file, { reference, attributes });

		expect(reference.get("Location")).toBe("Location");
		// Position 1: IfcExternalReference's Identification (>IFC2X3) / ItemReference (IFC2X3).
		expect(reference.getByIndex(1)).toBe("Identification");
		expect(reference.get("Name")).toBe("Name");
		if (!isIfc2x3) {
			expect(reference.get("Description")).toBe("Description");
			expect(reference.get("Language")).toBe("Language");
		}
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.editReference Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });

		file.beginTransaction();
		editReference(file, { reference, attributes: { Location: "Location", Name: "Name" } });
		file.endTransaction();

		expect(reference.get("Location")).toBe("Location");
		expect(reference.get("Name")).toBe("Name");

		file.undo();
		expect(reference.get("Location")).toBeNull();
		expect(reference.get("Name")).toBeNull();

		file.redo();
		expect(reference.get("Location")).toBe("Location");
		expect(reference.get("Name")).toBe("Name");
	});
});
