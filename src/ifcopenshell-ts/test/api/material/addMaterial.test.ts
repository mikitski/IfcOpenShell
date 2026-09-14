// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `add_material.py` (no `test_add_material.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, exercising the
// real Python source's own disclosed behavior directly (see `../../../src/api/material
// /addMaterial.ts`'s own header comment): the `name || "Unnamed"` truthiness fallback
// (including the explicit-empty-string case), and the real IFC2X3-vs-IFC4+
// `Category`/`Description` schema difference.

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.addMaterial (%s)", (schema) => {
	test("creates an IfcMaterial with the given name", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, { name: "CON01" });

		expect(material.isA("IfcMaterial")).toBe(true);
		expect(material.get("Name")).toBe("CON01");
	});

	test("defaults the name to 'Unnamed' when omitted", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, {});

		expect(material.get("Name")).toBe("Unnamed");
	});

	test("defaults the name to 'Unnamed' for an explicit empty string too", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, { name: "" });

		expect(material.get("Name")).toBe("Unnamed");
	});
});

// --- IFC4/IFC4X3-only: `Category`/`Description` don't exist on IFC2X3's own
// `IfcMaterial` declaration at all. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.addMaterial (%s) -- IFC4+ only",
	(schema) => {
		test("sets Category and Description when provided", () => {
			const file = createTestFile(schema);
			const material = addMaterial(file, { name: "CON01", category: "concrete", description: "Garage Slab" });

			expect(material.get("Category")).toBe("concrete");
			expect(material.get("Description")).toBe("Garage Slab");
		});

		test("leaves Category/Description unset when omitted", () => {
			const file = createTestFile(schema);
			const material = addMaterial(file, { name: "CON01" });

			expect(material.get("Category")).toBeNull();
			expect(material.get("Description")).toBeNull();
		});
	},
);

// --- IFC2X3-only: a truthy `category`/`description` throws, matching real Python's
// own unguarded `setattr` against a schema that has no such attribute at all. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))(
	"api.material.addMaterial (%s) -- IFC2X3 only",
	(schema) => {
		test("providing a category throws (not available in IFC2X3)", () => {
			const file = createTestFile(schema);
			expect(() => addMaterial(file, { name: "CON01", category: "concrete" })).toThrow();
		});

		test("providing a description throws (not available in IFC2X3)", () => {
			const file = createTestFile(schema);
			expect(() => addMaterial(file, { name: "CON01", description: "Garage Slab" })).toThrow();
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.addMaterial Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcMaterial; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		addMaterial(file, { name: "CON01" });
		file.endTransaction();

		expect(file.byType("IfcMaterial").length).toBe(1);

		file.undo();
		expect(file.byType("IfcMaterial").length).toBe(0);

		file.redo();
		expect(file.byType("IfcMaterial").length).toBe(1);
		expect(file.byType("IfcMaterial")[0].get("Name")).toBe("CON01");
	});
});
