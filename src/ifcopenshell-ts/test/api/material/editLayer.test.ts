// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_layer.py` (no `test_edit_layer.py` counterpart
// -- confirmed by directory listing of `src/ifcopenshell-python/test/api/material/`).
// Tests below are new, exercising the real Python source's own disclosed behavior
// directly (see `../../../src/api/material/editLayer.ts`'s own header comment):
// `attributes` are applied via a plain setter loop, and `material` is only swapped when
// truthy (unlike `./editConstituent.test.ts`'s own unconditional-`Material` quirk).
// `IfcMaterialLayer` exists on every schema (IFC2X3 included), so these tests run
// against every `AVAILABLE_SCHEMAS` entry.

import { describe, expect, test } from "vitest";
import { addLayer } from "../../../src/api/material/addLayer";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { editLayer } from "../../../src/api/material/editLayer";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.editLayer (%s)", (schema) => {
	test("edits attributes on the layer", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01", category: "gypsum" });
		const layer = addLayer(file, { layerSet, material: gypsum });

		editLayer(file, { layer, attributes: { LayerThickness: 13 } });

		expect(layer.get("LayerThickness")).toBe(13);
	});

	test("swaps the Material when provided", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01", category: "gypsum" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const layer = addLayer(file, { layerSet, material: gypsum });

		editLayer(file, { layer, material: steel });

		expect((layer.get("Material") as EntityInstance).equals(steel)).toBe(true);
	});

	test("leaves Material unchanged when omitted", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01", category: "gypsum" });
		const layer = addLayer(file, { layerSet, material: gypsum });

		editLayer(file, { layer, attributes: { LayerThickness: 13 } });

		expect((layer.get("Material") as EntityInstance).equals(gypsum)).toBe(true);
	});

	test("is a no-op when neither attributes nor material are provided", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01", category: "gypsum" });
		const layer = addLayer(file, { layerSet, material: gypsum });
		const thicknessBefore = layer.get("LayerThickness");

		editLayer(file, { layer });

		expect(layer.get("LayerThickness")).toBe(thicknessBefore);
		expect((layer.get("Material") as EntityInstance).equals(gypsum)).toBe(true);
	});
});
