// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/grid/test_remove_grid_axis.py`'s `TestRemoveGridAxis`/
// `TestRemoveGridAxisIFC2X3` (real Python runs the same body against both IFC4 and
// IFC2X3, via multiple inheritance). Both real test methods
// (`test_removing_an_axis_removes_its_curve`/
// `test_removing_an_axis_preserves_shared_curve`) are ported verbatim below. No schema
// divergence exists for `IfcGridAxis`/`IfcGrid`/`IfcPolyline`/`IfcCartesianPoint`
// (confirmed against all 3 generated `.d.ts`s), so this runs against every
// `AVAILABLE_SCHEMAS` entry -- strictly more coverage than real Python's own two
// classes, matching this module's sibling test files' identical precedent.
//
// A third case, NOT in the real Python test suite, pins the real, disclosed Python bug
// documented in `../../../src/api/grid/removeGridAxis.ts`'s own header comment: calling
// `removeGridAxis` on an axis whose `AxisCurve` was never set crashes (an unguarded
// `remove_deep2(file, None)` call in real Python), rather than silently no-op-ing.

import { describe, expect, test } from "vitest";
import { createGridAxis } from "../../../src/api/grid/createGridAxis";
import { removeGridAxis } from "../../../src/api/grid/removeGridAxis";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.grid.removeGridAxis (%s)", (schema) => {
	test("removing an axis removes its curve", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");

		const axis = createGridAxis(file, { axisTag: "A", uvwAxes: "UAxes", grid });
		axis.set("AxisCurve", file.createEntity("IfcPolyline", [file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])]));
		const axis2 = createGridAxis(file, { axisTag: "B", uvwAxes: "UAxes", grid });
		axis2.set("AxisCurve", file.createEntity("IfcPolyline", [file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0])]));

		removeGridAxis(file, { axis: axis2 });

		expect((grid.get("UAxes") as EntityInstance[]).map((a) => a.identity())).toEqual([axis.identity()]);
		expect(file.byType("IfcGridAxis")).toHaveLength(1);
		// The curve should be removed since it was only used by the removed axis.
		expect(file.byType("IfcPolyline")).toHaveLength(1);
	});

	test("removing an axis preserves a shared curve", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");

		const sharedCurve = file.createEntity("IfcPolyline", [file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])]);
		const axis = createGridAxis(file, { axisTag: "A", uvwAxes: "UAxes", grid });
		axis.set("AxisCurve", sharedCurve);
		const axis2 = createGridAxis(file, { axisTag: "B", uvwAxes: "UAxes", grid });
		axis2.set("AxisCurve", sharedCurve);

		removeGridAxis(file, { axis: axis2 });

		expect((grid.get("UAxes") as EntityInstance[]).map((a) => a.identity())).toEqual([axis.identity()]);
		// The shared curve should be preserved since it's still used by axis.
		expect(() => file.byId(sharedCurve.id())).not.toThrow();
		expect((axis.get("AxisCurve") as EntityInstance).equals(sharedCurve)).toBe(true);
	});

	test("real, disclosed Python bug: removing an axis whose AxisCurve was never set crashes", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");
		const axis = createGridAxis(file, { axisTag: "A", uvwAxes: "UAxes", grid });

		expect(axis.get("AxisCurve")).toBeNull();
		expect(() => removeGridAxis(file, { axis })).toThrow();
	});
});
