// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_remove_surface_style.py`
// (src/ifcopenshell-python -- `TestRemoveSurfaceStyleIFC2X3(test.bootstrap.IFC2X3)` /
// `TestRemoveSurfaceStyleIFC4(test.bootstrap.IFC4, TestRemoveSurfaceStyleIFC2X3)`, real
// Python's own multiple-inheritance shape: the 3 base tests run on both IFC2X3 and
// IFC4, plus `test_removing_a_texture_style_with_all_of_its_coordinates`, which is
// IFC4+-only since `IfcTextureCoordinateGenerator.Maps` doesn't exist on IFC2X3 --
// confirmed against `ifc2x3.d.ts`'s genuinely empty `IfcTextureCoordinate {}`/no `Maps`
// on `IfcTextureCoordinateGenerator` either). This port additionally runs the 3 shared
// tests against IFC4X3 too (via `describe.each(AVAILABLE_SCHEMAS)`), matching
// `../material/removeMaterial.test.ts`'s own established precedent.
//
// Real Python's fixture is a genuinely blank `api.project.create_file(...)`, not
// `template.create()`'s pre-populated project -- see `./removeStyle.test.ts`'s own
// header comment for why this port uses `api.project.createFile` instead of
// `../../bootstrap.ts`'s `createTestFile` here (every one of these tests asserts
// `len(list(self.file)) == 0`, which only holds against a genuinely empty starting
// file).
//
// Two deliberate simplifications from the real Python source, both disclosed here
// rather than silently reproduced or silently dropped:
//
// 1. `test_removing_a_rendering_style` skips real Python's own `g =
//    ifcopenshell.file.from_string(self.file.to_string())` round trip (its own comment:
//    "we can remove entity_instances() without an ID if we create them afresh, but will
//    segfault if we load them stale", citing issue #2046) -- a Python-object-lifetime
//    workaround for a native memory-safety quirk specific to that binding's own stale
//    wrapper caching. This port's `EntityInstance` mints a fresh `Proxy` wrapper on
//    every access by design (`entityInstance.ts`'s own header comment,
//    `research/07-fresh-wrapper-per-access.md`), so there is no equivalent "stale
//    wrapper" object to segfault on in the first place -- this port calls
//    `removeSurfaceStyle` directly against the freshly-created style, with no file
//    round trip needed to exercise the same removal logic.
// 2. The rendering style is built with only `SurfaceColour`/`Transparency`/
//    `DiffuseColour`/`ReflectanceMethod` set (all either plain scalars or direct entity
//    references) -- `TransmissionColour`/`SpecularHighlight` (real Python:
//    `IfcNormalisedRatioMeasure(0.5)`/`IfcSpecularRoughness(0.5)`, both inline
//    defined-type SELECT values) are omitted, since materializing a standalone
//    defined-type value needs the same `createTypedValue` low-level workaround
//    `../pset/editPset.test.ts`/`../material/removeMaterial.test.ts` already established
//    for an unrelated, pre-existing gap -- incidental to this test's actual point
//    (verifying `removeSurfaceStyle`'s own entity-typed-attribute cleanup scan, already
//    fully exercised by `SurfaceColour`/`DiffuseColour`).

import { describe, expect, test } from "vitest";
import { createFile } from "../../../src/api/project/createFile";
import { removeSurfaceStyle } from "../../../src/api/style/removeSurfaceStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

function blankFile(schema: Schema): IfcFile {
	return createFile(undefined, { version: schema });
}

describe.each(AVAILABLE_SCHEMAS)("api.style.removeSurfaceStyle (%s)", (schema) => {
	test("removing a shading style", () => {
		const file = blankFile(schema);
		const colour = file.createEntity("IfcColourRgb", null, 1, 1, 1);
		const style = withAttrs(file, "IfcSurfaceStyleShading", { SurfaceColour: colour });

		removeSurfaceStyle(file, { style });

		expect([...file].length).toBe(0);
	});

	test("removing a texture style", () => {
		const file = blankFile(schema);
		const texture = file.createEntity("IfcImageTexture");
		const style = withAttrs(file, "IfcSurfaceStyleWithTextures", { Textures: [texture] });

		removeSurfaceStyle(file, { style });

		expect([...file].length).toBe(0);
	});

	test("removing a rendering style", () => {
		const file = blankFile(schema);
		const surfaceColour = file.createEntity("IfcColourRgb", null, 1, 1, 1);
		const diffuseColour = file.createEntity("IfcColourRgb", null, 1, 1, 1);
		const style = withAttrs(file, "IfcSurfaceStyleRendering", {
			SurfaceColour: surfaceColour,
			Transparency: 0.0,
			DiffuseColour: diffuseColour,
			ReflectanceMethod: "NOTDEFINED",
		});

		removeSurfaceStyle(file, { style });

		expect([...file].length).toBe(0);
	});
});

// --- `IfcTextureCoordinateGenerator.Maps` added in IFC4 -- IFC4+ only. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.style.removeSurfaceStyle (%s) -- IFC4+ only",
	(schema) => {
		test("removing a texture style with all of its coordinates", () => {
			const file = blankFile(schema);
			const texture = file.createEntity("IfcImageTexture");
			withAttrs(file, "IfcTextureCoordinateGenerator", { Maps: [texture] });
			const style = withAttrs(file, "IfcSurfaceStyleWithTextures", { Textures: [texture] });

			removeSurfaceStyle(file, { style });

			expect([...file].length).toBe(0);
		});
	},
);
