// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_edit_surface_style.py`
// (src/ifcopenshell-python -- `TestEditSurfaceStyle(test.bootstrap.IFC4)`, also run
// under IFC2X3 via `TestEditSurfaceStyleIFC2X3(test.bootstrap.IFC2X3,
// TestEditSurfaceStyle)`). `test_editing_texture_style` is NOT ported here -- it needs
// `api.style.addSurfaceTextures`, covered directly and more thoroughly by
// `addSurfaceTextures.test.ts` instead; this file focuses on `editSurfaceStyle`'s own
// three special-cased attribute-class handlers (see
// `../../../src/api/style/editSurfaceStyle.ts`'s own header comment). Also run on
// IFC4X3 (not part of real Python's own test matrix, but nothing in
// `edit_surface_style.py` is IFC4X3-specific -- `IfcColourRgb`/`IfcNormalisedRatioMeasure`
// are unchanged there).
//
// Three of real Python's own test cases (`test_editing_an_existing_colour_to_a_factor`,
// `test_editing_an_existing_factor_to_another_factor`,
// `test_editing_an_existing_factor_to_a_colour`) and both specular-highlight tests need
// a standalone, addressable `IfcNormalisedRatioMeasure`/`IfcSpecularExponent`/
// `IfcSpecularRoughness` value -- blocked by a genuine, already-disclosed
// primitive-layer gap (`EntityInstance.setByIndex`/`IfcFile.createEntity` cannot write
// an initial value into a freshly created simple/defined-type instance -- see
// `../../../src/api/style/editSurfaceStyle.ts`'s own header comment and `TODOS.md`).
// `test_editing_an_existing_factor_to_another_factor`/`test_editing_an_existing_factor
// _to_a_colour` cannot even be CONSTRUCTED as fixtures right now (their own setup needs
// the identical blocked `file.createEntity("IfcNormalisedRatioMeasure", 0.5)` call) --
// dropped entirely rather than left as misleading/uncompilable tests.
// `test_editing_an_existing_colour_to_a_factor` and both specular-highlight tests ARE
// constructible (their fixtures only need real `IfcColourRgb` entities, or no fixture
// at all) -- ported below as "throws the disclosed blocked error" regressions instead,
// matching `editPset.test.ts`'s own established precedent for this exact gap.

import { describe, expect, test } from "vitest";
import { editSurfaceStyle } from "../../../src/api/style/editSurfaceStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

const COLOUR_OR_FACTOR_ATTRS = [
	"DiffuseColour",
	"TransmissionColour",
	"DiffuseTransmissionColour",
	"ReflectionColour",
	"SpecularColour",
];

function renderingStyle(schema: Schema) {
	const file = createTestFile(schema);
	const colour = file.createEntity("IfcColourRgb", null, 0, 0, 0);
	const style = file.createEntity("IfcSurfaceStyleRendering", colour);
	return { file, style };
}

describe.each(AVAILABLE_SCHEMAS)("api.style.editSurfaceStyle (%s)", (schema) => {
	test("editing a shading style", () => {
		const file = createTestFile(schema);
		const colour = file.createEntity("IfcColourRgb", null, 0, 0, 0);
		const style = file.createEntity("IfcSurfaceStyleShading", colour);
		const attrs: Record<string, unknown> = { SurfaceColour: { Red: 1, Green: 1, Blue: 1 } };
		if (schema !== "IFC2X3") attrs.Transparency = 0.5;

		editSurfaceStyle(file, { style, attributes: attrs });

		expect((style.get("SurfaceColour") as EntityInstance).equals(colour)).toBe(true);
		expect(colour.get("Name")).toBeNull();
		expect(colour.get("Red")).toBe(1);
		expect(colour.get("Green")).toBe(1);
		expect(colour.get("Blue")).toBe(1);
		if (schema !== "IFC2X3") {
			expect(style.get("Transparency")).toBe(0.5);
		}
	});

	test.each(COLOUR_OR_FACTOR_ATTRS)("editing an empty %s colour-or-factor", (attribute) => {
		const { file, style } = renderingStyle(schema);

		editSurfaceStyle(file, { style, attributes: { [attribute]: { Red: 1, Green: 1, Blue: 1 } } });

		const colour = style.get(attribute) as EntityInstance;
		expect(colour.get("Name")).toBeNull();
		expect(colour.get("Red")).toBe(1);
		expect(colour.get("Green")).toBe(1);
		expect(colour.get("Blue")).toBe(1);
	});

	test.each(COLOUR_OR_FACTOR_ATTRS)("editing an existing %s colour to another colour", (attribute) => {
		const { file, style } = renderingStyle(schema);
		const colour = file.createEntity("IfcColourRgb", null, 0, 0, 0);
		style.set(attribute, colour);

		editSurfaceStyle(file, { style, attributes: { [attribute]: { Red: 1, Green: 1, Blue: 1 } } });

		expect(colour.get("Red")).toBe(1);
		expect(colour.get("Green")).toBe(1);
		expect(colour.get("Blue")).toBe(1);
		expect((style.get(attribute) as EntityInstance).equals(colour)).toBe(true);
	});

	// See this file's own header comment -- BLOCKED, a real, already-disclosed
	// primitive-layer gap (not specific to this function). The real, portable "remove
	// the old real-id colour" step still runs to completion first, matching real
	// Python's own order of operations.
	test.each(COLOUR_OR_FACTOR_ATTRS)(
		"editing an existing %s colour to a factor throws (blocked: needs a standalone IfcNormalisedRatioMeasure)",
		(attribute) => {
			const { file, style } = renderingStyle(schema);
			const colour = file.createEntity("IfcColourRgb", null, 0, 0, 0);
			const colourId = colour.id();
			style.set(attribute, colour);

			expect(() => editSurfaceStyle(file, { style, attributes: { [attribute]: 0.5 } })).toThrow(
				/IfcNormalisedRatioMeasure/,
			);

			expect(() => file.byId(colourId)).toThrow();
		},
	);

	// See this file's own header comment -- BLOCKED, same primitive-layer gap. No
	// prior mutation exists in real Python for either branch to preserve first, so
	// this throws immediately.
	test("editing a specular highlight as an exponent throws (blocked: needs a standalone IfcSpecularExponent)", () => {
		const { file, style } = renderingStyle(schema);

		expect(() =>
			editSurfaceStyle(file, { style, attributes: { SpecularHighlight: { IfcSpecularExponent: 2 } } }),
		).toThrow(/IfcSpecularExponent/);
	});

	test("editing a specular highlight as a roughness throws (blocked: needs a standalone IfcSpecularRoughness)", () => {
		const { file, style } = renderingStyle(schema);

		expect(() =>
			editSurfaceStyle(file, { style, attributes: { SpecularHighlight: { IfcSpecularRoughness: 0.5 } } }),
		).toThrow(/IfcSpecularRoughness/);
	});

	test("editing a lighting style", () => {
		const file = createTestFile(schema);
		const style = file.createEntity("IfcSurfaceStyleLighting");
		const attributes = [
			"DiffuseTransmissionColour",
			"DiffuseReflectionColour",
			"TransmissionColour",
			"ReflectanceColour",
		];

		editSurfaceStyle(file, {
			style,
			attributes: Object.fromEntries(attributes.map((a) => [a, { Red: 1, Green: 1, Blue: 1 }])),
		});

		for (const attribute of attributes) {
			const colour = style.get(attribute) as EntityInstance;
			expect(colour.get("Name")).toBeNull();
			expect(colour.get("Red")).toBe(1);
			expect(colour.get("Green")).toBe(1);
			expect(colour.get("Blue")).toBe(1);
		}
	});
});
