// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `add_layer.py` (no `test_add_layer.py` counterpart --
// confirmed by directory listing of `src/ifcopenshell-python/test/api/material/`).
// Tests below are new, exercising the real Python source's own disclosed behavior
// directly (see `../../../src/api/material/addLayer.ts`'s own header comment): the
// default `0.1 / unit_scale` placeholder thickness (`../../bootstrap.ts`'s
// `createTestFile` template project has a plain, unprefixed METRE length unit, so
// `unit_scale` is exactly `1` -- verified directly, not assumed), list-append
// semantics onto `MaterialLayers`, and the real IFC2X3-vs-IFC4+ `Name` schema branch.

import { describe, expect, test } from "vitest";
import { addLayer } from "../../../src/api/material/addLayer";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.addLayer (%s)", (schema) => {
	test("adds a layer to an empty layer set with a placeholder thickness", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });

		const layer = addLayer(file, { layerSet, material: gypsum });

		expect(layer.isA("IfcMaterialLayer")).toBe(true);
		expect((layer.get("Material") as EntityInstance).equals(gypsum)).toBe(true);
		expect(layer.get("LayerThickness")).toBe(0.1);
		expect((layerSet.get("MaterialLayers") as EntityInstance[]).map((l) => l.identity())).toEqual([layer.identity()]);
	});

	test("appends subsequent layers, preserving order", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });
		const steel = addMaterial(file, { name: "ST01" });

		const layer1 = addLayer(file, { layerSet, material: gypsum });
		const layer2 = addLayer(file, { layerSet, material: steel });
		const layer3 = addLayer(file, { layerSet, material: gypsum });

		expect((layerSet.get("MaterialLayers") as EntityInstance[]).map((l) => l.identity())).toEqual([
			layer1.identity(),
			layer2.identity(),
			layer3.identity(),
		]);
	});
});

// --- IFC4/IFC4X3-only: `Name` doesn't exist on IFC2X3's own `IfcMaterialLayer`
// declaration at all. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.addLayer (%s) -- IFC4+ only", (schema) => {
	test("sets the layer's Name when provided", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });

		const layer = addLayer(file, { layerSet, material: gypsum, name: "Finish" });

		expect(layer.get("Name")).toBe("Finish");
	});

	test("leaves Name unset when omitted", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });

		const layer = addLayer(file, { layerSet, material: gypsum });

		expect(layer.get("Name")).toBeNull();
	});
});

// --- IFC2X3-only: `Name` isn't passed to `create_entity` at all on this schema (see
// `addLayer.ts`'s own header comment) -- a caller-supplied `name` is simply ignored,
// not thrown on. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))(
	"api.material.addLayer (%s) -- IFC2X3 only",
	(schema) => {
		test("a provided name is silently ignored, not thrown on", () => {
			const file = createTestFile(schema);
			const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
			const gypsum = addMaterial(file, { name: "PB01" });

			expect(() => addLayer(file, { layerSet, material: gypsum, name: "Finish" })).not.toThrow();
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.addLayer Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created layer; redo recreates it", () => {
		const file = createTestFile(schema);
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const gypsum = addMaterial(file, { name: "PB01" });

		file.beginTransaction();
		addLayer(file, { layerSet, material: gypsum });
		file.endTransaction();

		expect(file.byType("IfcMaterialLayer").length).toBe(1);
		expect((layerSet.get("MaterialLayers") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(file.byType("IfcMaterialLayer").length).toBe(0);
		expect((layerSet.get("MaterialLayers") as EntityInstance[] | null) ?? []).toHaveLength(0);

		file.redo();
		expect(file.byType("IfcMaterialLayer").length).toBe(1);
		expect((layerSet.get("MaterialLayers") as EntityInstance[]).length).toBe(1);
	});
});
