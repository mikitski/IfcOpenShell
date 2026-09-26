// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_add_surface_style.py`
// (src/ifcopenshell-python -- `TestAddSurfaceStyle(test.bootstrap.IFC4)`, also run
// under IFC2X3 via `TestAddSurfaceStyleIFC2X3(test.bootstrap.IFC2X3,
// TestAddSurfaceStyle)`). Real Python's own `Transparency` assertions are gated by
// `if self.file.schema != "IFC2X3"` -- `IfcSurfaceStyleShading.Transparency` doesn't
// exist on IFC2X3 at all (confirmed against `ifc2x3.d.ts`, added in IFC4) -- ported the
// same way below. Also run on IFC4X3 (not part of real Python's own test matrix, but
// nothing in `add_surface_style.py`/`edit_surface_style.py` is IFC4X3-specific).

import { describe, expect, test } from "vitest";
import { addSurfaceStyle } from "../../../src/api/style/addSurfaceStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function shadingAttrs(schema: Schema): Record<string, unknown> {
	const attrs: Record<string, unknown> = { SurfaceColour: { Name: "", Red: 1, Green: 1, Blue: 1 } };
	if (schema !== "IFC2X3") attrs.Transparency = 0.5;
	return attrs;
}

describe.each(AVAILABLE_SCHEMAS)("api.style.addSurfaceStyle (%s)", (schema) => {
	test("adding a surface style", () => {
		const file = createTestFile(schema);
		const style = file.createEntity("IfcSurfaceStyle");

		const result = addSurfaceStyle(file, {
			style,
			ifcClass: "IfcSurfaceStyleShading",
			attributes: shadingAttrs(schema),
		});

		expect(result.isA("IfcSurfaceStyleShading")).toBe(true);
		const colour = result.get("SurfaceColour") as EntityInstance;
		expect(colour.get("Red")).toBe(1);
		expect(colour.get("Green")).toBe(1);
		expect(colour.get("Blue")).toBe(1);
		if (schema !== "IFC2X3") {
			expect(result.get("Transparency")).toBe(0.5);
		}
		expect((style.get("Styles") as EntityInstance[])[0].equals(result)).toBe(true);
	});

	test("adding a rendering style", () => {
		const file = createTestFile(schema);
		const style = file.createEntity("IfcSurfaceStyle");

		const result = addSurfaceStyle(file, {
			style,
			ifcClass: "IfcSurfaceStyleRendering",
			attributes: shadingAttrs(schema),
		});

		expect(result.isA("IfcSurfaceStyleRendering")).toBe(true);
		const colour = result.get("SurfaceColour") as EntityInstance;
		expect(colour.get("Red")).toBe(1);
		expect(colour.get("Green")).toBe(1);
		expect(colour.get("Blue")).toBe(1);
		if (schema !== "IFC2X3") {
			expect(result.get("Transparency")).toBe(0.5);
		}
		expect((style.get("Styles") as EntityInstance[])[0].equals(result)).toBe(true);
	});

	test("not adding a style twice", () => {
		const file = createTestFile(schema);
		const style = file.createEntity("IfcSurfaceStyle");

		addSurfaceStyle(file, { style, ifcClass: "IfcSurfaceStyleRendering", attributes: shadingAttrs(schema) });
		const result = addSurfaceStyle(file, {
			style,
			ifcClass: "IfcSurfaceStyleRendering",
			attributes: shadingAttrs(schema),
		});

		const styles = style.get("Styles") as EntityInstance[];
		expect(styles).toHaveLength(1);
		expect(styles[0].equals(result)).toBe(true);
	});

	test("adding multiple styles of different types", () => {
		const file = createTestFile(schema);
		const style = file.createEntity("IfcSurfaceStyle");

		const result1 = addSurfaceStyle(file, {
			style,
			ifcClass: "IfcSurfaceStyleShading",
			attributes: shadingAttrs(schema),
		});
		const result2 = addSurfaceStyle(file, { style, ifcClass: "IfcSurfaceStyleWithTextures", attributes: {} });

		const styles = style.get("Styles") as EntityInstance[];
		expect(styles).toHaveLength(2);
		expect(styles.some((s) => s.equals(result1))).toBe(true);
		expect(styles.some((s) => s.equals(result2))).toBe(true);
	});

	test("shading and rendering are mutually exclusive when adding", () => {
		const file = createTestFile(schema);
		const style = file.createEntity("IfcSurfaceStyle");

		addSurfaceStyle(file, { style, ifcClass: "IfcSurfaceStyleShading", attributes: shadingAttrs(schema) });
		const result = addSurfaceStyle(file, {
			style,
			ifcClass: "IfcSurfaceStyleRendering",
			attributes: shadingAttrs(schema),
		});

		const styles = style.get("Styles") as EntityInstance[];
		expect(styles).toHaveLength(1);
		expect(styles[0].equals(result)).toBe(true);
	});
});
