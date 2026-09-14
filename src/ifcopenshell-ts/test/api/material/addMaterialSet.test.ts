// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/material/test_add_material_set.py`
// (src/ifcopenshell-python, 44 lines) -- `TestAddMaterialSetIFC2X3` (2 tests:
// `test_add_layer_set`/`test_add_list`) and `TestAddMaterialSetIFC4` (subclassing
// IFC2X3 via multiple inheritance for those 2 shared tests, plus its own 2 extra
// IFC4+-only tests: `test_add_profile_set`/`test_add_constituent_set`). Real Python's
// own test suite never exercises IFC4X3 at all -- this port additionally runs the
// shared IFC2X3+ tests against IFC4X3 too (via `describe.each(AVAILABLE_SCHEMAS)`,
// already CI-safe per `../../bootstrap.ts`), matching `./assignMaterial.test.ts`'s own
// header comment's identical reasoning; `ifc4x3.d.ts` confirms identical attribute
// shapes to `ifc4.d.ts` for every entity this function constructs.
//
// A few extra own tests beyond real Python's own 4 (the default `set_type`, and the
// `name || "Unnamed"` empty-string quirk shared with `./addMaterial.test.ts`) are
// added for completeness -- disclosed here, not claimed as ported from Python.

import { describe, expect, test } from "vitest";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

// --- Shared across IFC2X3/IFC4/IFC4X3 -- real Python: `TestAddMaterialSetIFC2X3` ---

describe.each(AVAILABLE_SCHEMAS)("api.material.addMaterialSet (%s)", (schema) => {
	test("test_add_layer_set", () => {
		const file = createTestFile(schema);
		const material = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });

		expect(material.get("LayerSetName")).toBe("Unnamed");
		expect(material.isA("IfcMaterialLayerSet")).toBe(true);
	});

	test("test_add_list", () => {
		const file = createTestFile(schema);
		const material = addMaterialSet(file, { setType: "IfcMaterialList" });

		expect(material.isA("IfcMaterialList")).toBe(true);
	});

	test("an explicit empty name also falls back to 'Unnamed'", () => {
		const file = createTestFile(schema);
		const material = addMaterialSet(file, { name: "", setType: "IfcMaterialLayerSet" });

		expect(material.get("LayerSetName")).toBe("Unnamed");
	});
});

// --- IFC4/IFC4X3-only: entities added in IFC4. Real Python: `TestAddMaterialSetIFC4`'s
// own extra tests. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.addMaterialSet (%s) -- IFC4+ only",
	(schema) => {
		test("test_add_profile_set", () => {
			const file = createTestFile(schema);
			const material = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });

			expect(material.get("Name")).toBe("Unnamed");
			expect(material.isA("IfcMaterialProfileSet")).toBe(true);
		});

		test("test_add_constituent_set", () => {
			const file = createTestFile(schema);
			const material = addMaterialSet(file, { setType: "IfcMaterialConstituentSet", name: "Window" });

			expect(material.get("Name")).toBe("Window");
			expect(material.isA("IfcMaterialConstituentSet")).toBe(true);
		});

		test("defaults to an IfcMaterialConstituentSet named 'Unnamed' when no settings are given", () => {
			const file = createTestFile(schema);
			const material = addMaterialSet(file, {});

			expect(material.isA("IfcMaterialConstituentSet")).toBe(true);
			expect(material.get("Name")).toBe("Unnamed");
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.addMaterialSet Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created set; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		addMaterialSet(file, { setType: "IfcMaterialLayerSet", name: "GYP-ST-GYP" });
		file.endTransaction();

		expect(file.byType("IfcMaterialLayerSet").length).toBe(1);

		file.undo();
		expect(file.byType("IfcMaterialLayerSet").length).toBe(0);

		file.redo();
		expect(file.byType("IfcMaterialLayerSet").length).toBe(1);
		expect(file.byType("IfcMaterialLayerSet")[0].get("LayerSetName")).toBe("GYP-ST-GYP");
	});
});
