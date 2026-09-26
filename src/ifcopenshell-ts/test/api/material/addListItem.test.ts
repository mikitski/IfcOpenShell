// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `add_list_item.py` (no `test_add_list_item.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new. `IfcMaterialList`
// exists identically on every schema (see `../../../src/api/material/addListItem.ts`'s
// own header comment), so unlike `./addProfile.test.ts`/`./addConstituent.test.ts`,
// this runs across all of `AVAILABLE_SCHEMAS`, not just IFC4+ -- matching real
// Python's own primary intended use case (IFC2X3), while also confirming the function
// works identically on IFC4+ (where it's deprecated but not actually blocked).

import { describe, expect, test } from "vitest";
import { addListItem } from "../../../src/api/material/addListItem";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.addListItem (%s)", (schema) => {
	test("adds a material to an empty list", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });

		addListItem(file, { materialList, material: aluminium });

		expect((materialList.get("Materials") as EntityInstance[]).map((m) => m.identity())).toEqual([
			aluminium.identity(),
		]);
	});

	test("appends subsequent materials, preserving order and existing items", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });
		const glass = addMaterial(file, { name: "GLZ01" });

		addListItem(file, { materialList, material: aluminium });
		addListItem(file, { materialList, material: glass });

		expect((materialList.get("Materials") as EntityInstance[]).map((m) => m.identity())).toEqual([
			aluminium.identity(),
			glass.identity(),
		]);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.addListItem Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the appended material; redo re-appends it", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });

		file.beginTransaction();
		addListItem(file, { materialList, material: aluminium });
		file.endTransaction();

		expect((materialList.get("Materials") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect((materialList.get("Materials") as EntityInstance[] | null) ?? []).toHaveLength(0);

		file.redo();
		expect((materialList.get("Materials") as EntityInstance[]).length).toBe(1);
	});
});
