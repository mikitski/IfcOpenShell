// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `reorder_set_item.py` (no `test_reorder_set_item.py`
// counterpart -- confirmed by directory listing of `src/ifcopenshell-python/test/api/
// material/`). Tests below are new, exercising the real Python source's own disclosed
// behavior directly (see `../../../src/api/material/reorderSetItem.ts`'s own header
// comment): dispatch across all 4 real material-set classes, the real
// `list.pop`/`list.insert` reordering semantics (not a naive swap), and the real
// `else: raise ValueError(...)` fallback for an unrecognised set type.
// `IfcMaterialConstituentSet`/`IfcMaterialProfileSet` don't exist on IFC2X3 at all, so
// that describe block runs IFC4/IFC4X3 only; `IfcMaterialLayerSet`/`IfcMaterialList`
// run against every `AVAILABLE_SCHEMAS` entry. Fixture materials below are created
// with no `category` -- `IfcMaterial.Category` doesn't exist at all on IFC2X3 (see
// `../../../src/api/material/addMaterial.ts`'s own header comment: only `Name` is a
// real attribute there), and none of this file's assertions depend on it, so it's
// simply omitted rather than schema-gated (matching the IFC4/IFC4X3-only block below,
// which never used `category` either).

import { describe, expect, test } from "vitest";
import { addConstituent } from "../../../src/api/material/addConstituent";
import { addLayer } from "../../../src/api/material/addLayer";
import { addListItem } from "../../../src/api/material/addListItem";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile } from "../../../src/api/material/addProfile";
import { reorderSetItem } from "../../../src/api/material/reorderSetItem";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.reorderSetItem -- IfcMaterialList (%s)", (schema) => {
	test("reorders two list items", () => {
		const file = createTestFile(schema);
		const materialList = addMaterialSet(file, { setType: "IfcMaterialList" });
		const aluminium = addMaterial(file, { name: "AL01" });
		const glass = addMaterial(file, { name: "GLZ01" });
		addListItem(file, { materialList, material: aluminium });
		addListItem(file, { materialList, material: glass });

		reorderSetItem(file, { materialSet: materialList, oldIndex: 0, newIndex: 1 });

		expect((materialList.get("Materials") as EntityInstance[]).map((m) => m.identity())).toEqual([
			glass.identity(),
			aluminium.identity(),
		]);
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.material.reorderSetItem -- IfcMaterialLayerSet (%s)", (schema) => {
	test("reorders two layers, matching list.pop/list.insert semantics", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });
		const steel = addMaterial(file, { name: "ST01" });
		const layer1 = addLayer(file, { layerSet, material: gypsum });
		const layer2 = addLayer(file, { layerSet, material: steel });
		const layer3 = addLayer(file, { layerSet, material: gypsum });

		// Moving index 0 to index 1 in a 3-item list: pop index 0 leaves [layer2, layer3],
		// then insert at index 1 lands it between them, not at the very end.
		reorderSetItem(file, { materialSet: layerSet, oldIndex: 0, newIndex: 1 });

		expect((layerSet.get("MaterialLayers") as EntityInstance[]).map((l) => l.identity())).toEqual([
			layer2.identity(),
			layer1.identity(),
			layer3.identity(),
		]);
	});

	test("defaults oldIndex/newIndex to 0 (a no-op for a single-item set)", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });
		const layer = addLayer(file, { layerSet, material: gypsum });

		reorderSetItem(file, { materialSet: layerSet });

		expect((layerSet.get("MaterialLayers") as EntityInstance[]).map((l) => l.identity())).toEqual([layer.identity()]);
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.reorderSetItem -- IfcMaterialConstituentSet/IfcMaterialProfileSet (%s)",
	(schema) => {
		test("reorders two constituents", () => {
			const file = createTestFile(schema);
			const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
			const aluminium = addMaterial(file, { name: "AL01" });
			const glass = addMaterial(file, { name: "GLZ01" });
			const framing = addConstituent(file, { constituentSet, material: aluminium, name: "Framing" });
			const glazing = addConstituent(file, { constituentSet, material: glass, name: "Glazing" });

			reorderSetItem(file, { materialSet: constituentSet, oldIndex: 0, newIndex: 1 });

			expect((constituentSet.get("MaterialConstituents") as EntityInstance[]).map((c) => c.identity())).toEqual([
				glazing.identity(),
				framing.identity(),
			]);
		});

		test("reorders two profile items", () => {
			const file = createTestFile(schema);
			const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
			const p1 = addProfile(file, { profileSet, name: "P1" });
			const p2 = addProfile(file, { profileSet, name: "P2" });

			reorderSetItem(file, { materialSet: profileSet, oldIndex: 0, newIndex: 1 });

			expect((profileSet.get("MaterialProfiles") as EntityInstance[]).map((p) => p.identity())).toEqual([
				p2.identity(),
				p1.identity(),
			]);
		});

		test("throws for an unrecognised material set type", () => {
			const file = createTestFile(schema);
			const material = addMaterial(file, { name: "AL01" });

			expect(() => reorderSetItem(file, { materialSet: material })).toThrow(/Unexpected material set type/);
		});
	},
);
