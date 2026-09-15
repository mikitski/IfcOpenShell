// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `remove_layer.py` (no `test_remove_layer.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, exercising the
// real Python source's own disclosed behavior directly (see `../../../src/api/material
// /removeLayer.ts`'s own header comment): removing a layer drops it from its owning
// set's `MaterialLayers` list, `shouldRemoveMaterial` cascades via `removeDeep2` (so a
// material with OTHER remaining users survives even when the flag is set), and the
// default (`shouldRemoveMaterial: false`) always leaves the material alone.

import { describe, expect, test } from "vitest";
import { addLayer } from "../../../src/api/material/addLayer";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { removeLayer } from "../../../src/api/material/removeLayer";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.removeLayer (%s)", (schema) => {
	test("removes the layer from its layer set", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });
		const steel = addMaterial(file, { name: "ST01" });
		const layer1 = addLayer(file, { layerSet, material: gypsum });
		const layer2 = addLayer(file, { layerSet, material: steel });
		const layer3 = addLayer(file, { layerSet, material: gypsum });

		removeLayer(file, { layer: layer3 });

		expect(file.byType("IfcMaterialLayer").length).toBe(2);
		expect((layerSet.get("MaterialLayers") as EntityInstance[]).map((l) => l.identity())).toEqual([
			layer1.identity(),
			layer2.identity(),
		]);
	});

	test("does not remove the material by default", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });
		const layer = addLayer(file, { layerSet, material: gypsum });

		removeLayer(file, { layer });

		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("removes an orphaned material when shouldRemoveMaterial is true", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });
		const layer = addLayer(file, { layerSet, material: gypsum });

		removeLayer(file, { layer, shouldRemoveMaterial: true });

		expect(file.byType("IfcMaterial").length).toBe(0);
	});

	test("keeps a material with other users even when shouldRemoveMaterial is true", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });
		addLayer(file, { layerSet, material: gypsum });
		const layer2 = addLayer(file, { layerSet, material: gypsum });

		removeLayer(file, { layer: layer2, shouldRemoveMaterial: true });

		expect(file.byType("IfcMaterial").length).toBe(1);
	});
});
