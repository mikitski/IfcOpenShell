// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `remove_list_item.py` (no `test_remove_list_item.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, exercising the
// real Python source's own disclosed behavior directly (see `../../../src/api/material
// /removeListItem.ts`'s own header comment): index-based removal (default index `0`),
// negative-index support, and the disclosed `RangeError` for an out-of-range index
// (Python's own `list.pop`'s `IndexError`, ported explicitly since JS array indexing
// wouldn't otherwise throw for this).

import { describe, expect, test } from "vitest";
import { addListItem } from "../../../src/api/material/addListItem";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { removeListItem } from "../../../src/api/material/removeListItem";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.removeListItem (%s)", (schema) => {
	test("removes the item at the default index (0)", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });
		const glass = addMaterial(file, { name: "GLZ01" });
		addListItem(file, { materialList, material: aluminium });
		addListItem(file, { materialList, material: glass });

		removeListItem(file, { materialList });

		expect((materialList.get("Materials") as EntityInstance[]).map((m) => m.identity())).toEqual([glass.identity()]);
	});

	test("removes the item at a given positive index", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });
		const glass = addMaterial(file, { name: "GLZ01" });
		addListItem(file, { materialList, material: aluminium });
		addListItem(file, { materialList, material: glass });

		removeListItem(file, { materialList, materialIndex: 1 });

		expect((materialList.get("Materials") as EntityInstance[]).map((m) => m.identity())).toEqual([
			aluminium.identity(),
		]);
	});

	test("supports a negative index, matching Python's list.pop", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });
		const glass = addMaterial(file, { name: "GLZ01" });
		addListItem(file, { materialList, material: aluminium });
		addListItem(file, { materialList, material: glass });

		removeListItem(file, { materialList, materialIndex: -1 });

		expect((materialList.get("Materials") as EntityInstance[]).map((m) => m.identity())).toEqual([
			aluminium.identity(),
		]);
	});

	test("throws a RangeError for an out-of-range index (Python's IndexError)", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });
		addListItem(file, { materialList, material: aluminium });

		expect(() => removeListItem(file, { materialList, materialIndex: 5 })).toThrow(RangeError);
		expect(() => removeListItem(file, { materialList, materialIndex: -5 })).toThrow(RangeError);
		// Verify the failed call left the list unchanged.
		expect((materialList.get("Materials") as EntityInstance[]).length).toBe(1);
	});
});
