// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/georeference/test_edit_wcs.py`'s `TestEditWCS` (IFC4-only, run
// against every `AVAILABLE_SCHEMAS` entry -- no schema divergence exists for
// `IfcGeometricRepresentationContext.WorldCoordinateSystem`/`IfcAxis2Placement3D`/
// `IfcAxis2Placement2D`, confirmed against all 3 generated `.d.ts`s, see
// `../../../src/api/georeference/editWcs.ts`'s own header comment).
//
// Real Python's fixture is genuinely blank -- see `./addGeoreferencing.test.ts`'s own
// header comment for why every test below calls `stripProjectBootstrap` first (so
// `editWcs`'s own `file.byType("IfcGeometricRepresentationContext", ...)` scan only ever
// sees the contexts each test itself creates, not `createTestFile`'s own pre-populated
// "Model" context too).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { editWcs } from "../../../src/api/georeference/editWcs";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getWcs } from "../../../src/util/geolocation";
import type { Schema } from "../../bootstrap";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

function identityMatrix(): number[] {
	// Column-major, matching `gl-matrix`'s own `mat4` layout (same convention
	// `util/geolocation.ts`'s own `getWcs` returns).
	// prettier-ignore
	return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

describe.each(AVAILABLE_SCHEMAS)("api.georeference.editWcs (%s)", (schema) => {
	test("resets the WCS to identity by default", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		addContext(file, { contextType: "Plan" });

		editWcs(file, {});

		const wcs = getWcsArray(file);
		expect(wcs).toEqual(identityMatrix());
	});

	test("translates the WCS", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		addContext(file, { contextType: "Plan" });

		editWcs(file, { x: 1, y: 2, z: 3 });

		const m = identityMatrix();
		m[12] = 1;
		m[13] = 2;
		m[14] = 3;
		expect(getWcsArray(file)).toEqual(m);
	});

	test("translates and rotates the WCS", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		addContext(file, { contextType: "Plan" });

		editWcs(file, { x: 1, y: 2, z: 3, rotation: 90 });

		const m = identityMatrix();
		m[12] = 1;
		m[13] = 2;
		m[14] = 3;
		// A 90-degree rotation about Z: X axis column -> (0, 1, 0), Y axis column -> (-1, 0, 0).
		m[0] = 0;
		m[1] = 1;
		m[4] = -1;
		m[5] = 0;
		const wcs = getWcsArray(file);
		for (let i = 0; i < 16; i++) {
			expect(wcs[i]).toBeCloseTo(m[i], 6);
		}
	});

	test("purges the old WCS placement when it becomes unreferenced", () => {
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });
		const oldWcs = model.get("WorldCoordinateSystem") as EntityInstance;

		editWcs(file, { x: 5, y: 0, z: 0 });

		expect(file.byType("IfcAxis2Placement3D").some((p) => p.identity() === oldWcs.identity())).toBe(false);
	});

	test("isSi: false leaves x/y/z in project units", () => {
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });

		editWcs(file, { x: 1000, y: 0, z: 0, isSi: false });

		const wcs = model.get("WorldCoordinateSystem") as EntityInstance;
		const location = wcs.get("Location") as EntityInstance;
		expect((location.get("Coordinates") as number[])[0]).toBe(1000);
	});
});

/** `util/geolocation.ts`'s `getWcs` returns a `gl-matrix`-shaped `MatrixType` (a
 * `Float32Array`-backed 4x4) -- converted to a plain `number[]` for `toEqual`. */
function getWcsArray(file: IfcFile): number[] {
	return Array.from(getWcs(file) as ArrayLike<number>);
}
