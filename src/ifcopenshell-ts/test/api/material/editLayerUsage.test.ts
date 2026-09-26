// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_layer_usage.py` (no `test_edit_layer_usage.py`
// counterpart -- confirmed by directory listing of `src/ifcopenshell-python/test/api/
// material/`). Tests below are new, exercising the real Python source's own disclosed
// behavior directly (see `../../../src/api/material/editLayerUsage.ts`'s own header
// comment): a plain, unconditional attribute setter loop. `IfcMaterialLayerSetUsage`
// exists on every schema (IFC2X3 included), so these tests run against every
// `AVAILABLE_SCHEMAS` entry. Fixture material below is created with no `category` --
// `IfcMaterial.Category` doesn't exist at all on IFC2X3 (see `../../../src/api
// /material/addMaterial.ts`'s own header comment: only `Name` is a real attribute
// there), and this file's one assertion doesn't depend on it, so it's simply omitted
// rather than schema-gated.

import { describe, expect, test } from "vitest";
import { addLayer } from "../../../src/api/material/addLayer";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { editLayerUsage } from "../../../src/api/material/editLayerUsage";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.editLayerUsage (%s)", (schema) => {
	test("edits the OffsetFromReferenceLine of a layer set usage", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet", name: "CON200" });
		const concrete = addMaterial(file, { name: "CON01" });
		addLayer(file, { layerSet, material: concrete });
		assignMaterial(file, { products: [wallType], material: layerSet });

		const wall = file.createEntity("IfcWall");
		const rel = assignMaterial(file, { products: [wall], type: "IfcMaterialLayerSetUsage" }) as EntityInstance;
		const usage = rel.get("RelatingMaterial") as EntityInstance;

		editLayerUsage(file, { usage, attributes: { OffsetFromReferenceLine: 200 } });

		expect(usage.get("OffsetFromReferenceLine")).toBe(200);
	});
});
