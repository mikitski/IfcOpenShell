// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_remove_library.py` (src/ifcopenshell-python)
// -- both real Python test methods ported verbatim, including the second test's own
// bare, low-level entity construction (mirroring real Python's own
// `self.file.createIfcLibraryReference(ReferencedLibrary=library)` / `self.file.
// createIfcRelAssociatesLibrary(GlobalId="foo", RelatingLibrary=library)` calls, which
// deliberately leave `OwnerHistory` unset on the two extra `IfcRelAssociatesLibrary`
// rels -- irrelevant to what this test actually pins, which is `removeLibrary`'s own
// `RelatingLibrary is None` post-removal sweep on IFC2X3, per
// `../../../src/api/library/removeLibrary.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { removeLibrary } from "../../../src/api/library/removeLibrary";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.library.removeLibrary (%s)", (schema) => {
	test("removing a library", () => {
		const file = createTestFile(schema);
		const library = file.createEntity("IfcLibraryInformation");
		removeLibrary(file, { library });
		expect(file.byType("IfcLibraryInformation").length).toBe(0);
	});

	test("removing a library and all references", () => {
		const file = createTestFile(schema);
		let library: EntityInstance;
		let reference1: EntityInstance;

		if (schema !== "IFC2X3") {
			library = file.createEntity("IfcLibraryInformation");
			// IfcLibraryReference (IFC4+): Location(0), Identification(1), Name(2),
			// Description(3), Language(4), ReferencedLibrary(5).
			reference1 = file.createEntity("IfcLibraryReference", null, null, null, null, null, library);
			file.createEntity("IfcLibraryReference", null, null, null, null, null, library);
		} else {
			// IfcLibraryReference (IFC2X3): Location(0), ItemReference(1), Name(2).
			reference1 = file.createEntity("IfcLibraryReference");
			const reference2 = file.createEntity("IfcLibraryReference");
			// IfcLibraryInformation (IFC2X3): Name(0), Version(1), Publisher(2),
			// VersionDate(3), LibraryReference(4).
			library = file.createEntity("IfcLibraryInformation", null, null, null, null, [reference1, reference2]);
		}

		// IfcRelAssociatesLibrary: GlobalId(0), OwnerHistory(1, left unset -- see header
		// comment), Name(2), Description(3), RelatedObjects(4, left unset too -- real
		// Python's own `createIfcRelAssociatesLibrary(GlobalId=..., RelatingLibrary=...)`
		// only ever specifies these two kwargs), RelatingLibrary(5).
		file.createEntity("IfcRelAssociatesLibrary", "foo", null, null, null, null, library);
		file.createEntity("IfcRelAssociatesLibrary", "bar", null, null, null, null, reference1);

		removeLibrary(file, { library });

		expect(file.byType("IfcLibraryReference").length).toBe(0);
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.removeLibrary Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a fully-removed library and its references; redo removes them again", () => {
		const file = createTestFile(schema);
		let library: EntityInstance;
		if (schema !== "IFC2X3") {
			library = file.createEntity("IfcLibraryInformation");
			file.createEntity("IfcLibraryReference", null, null, null, null, null, library);
		} else {
			const reference = file.createEntity("IfcLibraryReference");
			library = file.createEntity("IfcLibraryInformation", null, null, null, null, [reference]);
		}
		const libraryId = library.id();

		file.beginTransaction();
		removeLibrary(file, { library });
		file.endTransaction();

		expect(() => file.byId(libraryId)).toThrow();
		expect(file.byType("IfcLibraryReference").length).toBe(0);

		file.undo();
		expect(file.byId(libraryId).isA("IfcLibraryInformation")).toBe(true);
		expect(file.byType("IfcLibraryReference").length).toBe(1);

		file.redo();
		expect(() => file.byId(libraryId)).toThrow();
		expect(file.byType("IfcLibraryReference").length).toBe(0);
	});
});
