// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_add_surface_textures.py`
// (src/ifcopenshell-python -- `TestAddSurfaceTexture(test.bootstrap.IFC4)` only --
// real Python's own `# TODO: add ifc2x3 tests after add_surface_textures will support
// ifc2x3` comment confirms IFC2X3 is untested upstream too, matching this file's own
// `add_surface_textures.py` early-return for IFC2X3 -- see
// `../../../src/api/style/addSurfaceTextures.ts`'s own header comment). Additionally
// covers this port's own disclosed `material` (Blender node-tree) throw, which has no
// real Python counterpart to port from (a permanent TS/Node scope boundary, not a gap
// in upstream's own test suite).

import { describe, expect, test } from "vitest";
import { addSurfaceTextures } from "../../../src/api/style/addSurfaceTextures";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function defaultTextureData(): Record<string, unknown>[] {
	return [
		{ Mode: "DIFFUSE", RepeatS: true, RepeatT: true, URLReference: "diffuse.jpg" },
		{ Mode: "NORMAL", RepeatS: false, RepeatT: false, URLReference: "normal.jpg" },
		{ Mode: "METALLICROUGHNESS", RepeatS: true, RepeatT: true, URLReference: "metallic_roughness.jpg" },
		{ Mode: "OCCLUSION", RepeatS: true, RepeatT: true, URLReference: "ambient_occlusion.jpg" },
	];
}

function compareTextureToData(texture: EntityInstance, data: Record<string, unknown>, uvMaps: EntityInstance[] = []) {
	for (const attribute of ["Mode", "RepeatS", "RepeatT", "URLReference"]) {
		expect(texture.get(attribute)).toBe(data[attribute] ?? null);
	}

	const uvMode = data.uv_mode ?? null;
	const isMappedBy = (texture.get("IsMappedBy") as EntityInstance[] | null) ?? [];
	if (uvMode === null) {
		expect(isMappedBy).toHaveLength(0);
	} else if (uvMode === "Generated") {
		expect(isMappedBy).toHaveLength(1);
		expect(isMappedBy[0].get("Mode")).toBe("COORD");
	} else if (uvMode === "Camera") {
		expect(isMappedBy).toHaveLength(1);
		expect(isMappedBy[0].get("Mode")).toBe("COORD-EYE");
	} else if (uvMode === "UV") {
		expect(isMappedBy).toHaveLength(uvMaps.length);
		for (const uvMap of uvMaps) {
			expect(isMappedBy.some((m) => m.equals(uvMap))).toBe(true);
		}
	}
}

describe("api.style.addSurfaceTextures (IFC4)", () => {
	test("adds surface textures from data", () => {
		const file = createTestFile("IFC4");
		const textureData = defaultTextureData();

		const textures = addSurfaceTextures(file, { textures: textureData });

		expect(textures).toHaveLength(textureData.length);
		textures.forEach((texture, i) => compareTextureToData(texture, textureData[i]));
	});

	test("adds surface textures from data with uv_mode", () => {
		const file = createTestFile("IFC4");
		const textureData = defaultTextureData();
		textureData[0].uv_mode = "Generated";
		textureData[1].uv_mode = "Camera";
		textureData[2].uv_mode = "UV";
		textureData[3].uv_mode = null;

		const textures = addSurfaceTextures(file, { textures: textureData });

		textures.forEach((texture, i) => compareTextureToData(texture, textureData[i]));
	});

	test("adds surface textures from data with uv_maps", () => {
		const file = createTestFile("IFC4");
		const textureData = defaultTextureData();
		textureData[0].uv_mode = "Generated";
		textureData[1].uv_mode = "Camera";
		textureData[2].uv_mode = "UV";
		textureData[3].uv_mode = null;

		const uvMaps = Array.from({ length: 5 }, () => {
			const generator = file.createEntity("IfcTextureCoordinateGenerator");
			generator.set("Maps", []);
			generator.set("Mode", "COORD");
			return generator;
		});

		const textures = addSurfaceTextures(file, { textures: textureData, uvMaps });

		textures.forEach((texture, i) => compareTextureToData(texture, textureData[i], uvMaps));
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.style.addSurfaceTextures (%s) -- schema-independent behavior", (schema) => {
	test("returns an empty list without creating anything when material is supplied as null/undefined and textures is omitted", () => {
		const file = createTestFile(schema);

		expect(addSurfaceTextures(file, {})).toEqual([]);
	});

	test("throws when material is supplied -- see this file's own header comment", () => {
		const file = createTestFile(schema);

		expect(() => addSurfaceTextures(file, { material: {} })).toThrow(/material.*no TS\/Node equivalent/);
	});
});

describe("api.style.addSurfaceTextures (IFC2X3)", () => {
	test("returns an empty list -- IFC2X3 texture support is not implemented (matches real Python's own disclosed early-return)", () => {
		const file = createTestFile("IFC2X3");

		const textures = addSurfaceTextures(file, { textures: defaultTextureData() });

		expect(textures).toEqual([]);
		expect(file.byType("IfcImageTexture").length).toBe(0);
	});
});
