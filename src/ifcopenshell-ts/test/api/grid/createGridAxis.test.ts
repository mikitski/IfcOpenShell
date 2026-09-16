// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/grid/test_create_grid_axis.py`'s `TestCreateGridAxis`/
// `TestCreateGridAxisIFC2X3` (real Python runs the same body against both IFC4 and
// IFC2X3, via multiple inheritance -- see `test/bootstrap.ts`'s own header comment for
// why this project's `describe.each` achieves the same effect). No schema divergence
// exists for `IfcGridAxis`/`IfcGrid` (confirmed against all 3 generated `.d.ts`s, see
// `../../../src/api/grid/index.ts`'s own header comment), so this is run against every
// `AVAILABLE_SCHEMAS` entry -- strictly more coverage than real Python's own two
// classes, not a divergence, matching `test/api/geometry/editObjectPlacement.test.ts`'s
// own identical precedent for a schema-agnostic fixture.
//
// The `test_run` assertions (`AxisTag`/`SameSense`/`grid.UAxes == (axis,)` then
// `(axis, axis2)`) are ported directly below (as `.identity()`-keyed array
// comparisons, per this project's own established `EntityInstance` array-equality
// convention -- see e.g. `test/api/control/assignControl.test.ts`). Two additional
// cases not in the real Python test are added: the function's own documented defaults
// (`axisTag: "A"`, `sameSense: true`, `uvwAxes: "UAxes"`) and `VAxes`/`WAxes` routing,
// both directly from `create_grid_axis.py`'s own docstring/signature, not invented
// behavior.

import { describe, expect, test } from "vitest";
import { createGridAxis } from "../../../src/api/grid/createGridAxis";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.grid.createGridAxis (%s)", (schema) => {
	test("creates an IfcGridAxis and appends it to the grid's UAxes, in order", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");

		const axis = createGridAxis(file, { axisTag: "axis_tag", sameSense: true, uvwAxes: "UAxes", grid });
		expect(axis.get("AxisTag")).toBe("axis_tag");
		expect(axis.get("SameSense")).toBe(true);
		expect((grid.get("UAxes") as EntityInstance[]).map((a) => a.identity())).toEqual([axis.identity()]);

		const axis2 = createGridAxis(file, { axisTag: "axis_tag", sameSense: true, uvwAxes: "UAxes", grid });
		expect((grid.get("UAxes") as EntityInstance[]).map((a) => a.identity())).toEqual([
			axis.identity(),
			axis2.identity(),
		]);
	});

	test("defaults: axisTag 'A', sameSense true, uvwAxes 'UAxes'", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");

		const axis = createGridAxis(file, { grid });
		expect(axis.get("AxisTag")).toBe("A");
		expect(axis.get("SameSense")).toBe(true);
		expect((grid.get("UAxes") as EntityInstance[]).map((a) => a.identity())).toEqual([axis.identity()]);
	});

	test("routes to VAxes/WAxes when requested", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");

		const axisV = createGridAxis(file, { axisTag: "1", uvwAxes: "VAxes", grid });
		const axisW = createGridAxis(file, { axisTag: "P", uvwAxes: "WAxes", grid });

		expect((grid.get("VAxes") as EntityInstance[]).map((a) => a.identity())).toEqual([axisV.identity()]);
		expect((grid.get("WAxes") as EntityInstance[]).map((a) => a.identity())).toEqual([axisW.identity()]);
		// UAxes is untouched (still unset -- see `createGridAxis.ts`'s own header
		// comment for why a fresh IfcGrid reads this back as `null`, not `[]`).
		expect(grid.get("UAxes")).toBeNull();
	});

	test("AxisCurve is left unset on a freshly created axis", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");
		const axis = createGridAxis(file, { grid });
		expect(axis.get("AxisCurve")).toBeNull();
	});
});
