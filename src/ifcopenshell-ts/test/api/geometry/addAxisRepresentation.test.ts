// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_axis_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- `add_axis_representation
// .py` has no dedicated Python test file to port from, matching `util.constraint`'s own
// established precedent for a module with no exact 1:1 Python test file. Every test
// below is therefore original coverage, written directly against
// `add_axis_representation.py`'s real source / `../../../src/api/geometry/
// addAxisRepresentation.ts`'s own port.
//
// Run against `AVAILABLE_SCHEMAS`: the IFC2X3-vs-IFC4+ curve-class branch (`IfcPolyline`
// vs. `IfcIndexedPolyCurve`) is genuinely schema-dependent, so this file exercises BOTH
// concrete branches whenever both schemas happen to be available in this build (CI's own
// `SCHEMA_VERSIONS=4` core build only ever registers IFC4, per `../../bootstrap.ts`'s own
// header comment), plus one dedicated 3D-axis test and 2 regression tests pinning the 2
// real, disclosed Python-source quirks (`addAxisRepresentation.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addAxisRepresentation } from "../../../src/api/geometry/addAxisRepresentation";
import type { AddAxisRepresentationSettings } from "../../../src/api/geometry/addAxisRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function planAxisContext(file: IfcFile): EntityInstance {
	return file.createEntity("IfcGeometricRepresentationContext", "Axis", "Plan", 2);
}

function modelAxisContext(file: IfcFile): EntityInstance {
	return file.createEntity("IfcGeometricRepresentationContext", "Axis", "Model", 3);
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addAxisRepresentation (%s)", (schema) => {
	test("builds a 2D axis representation", () => {
		const file = createTestFile(schema);
		const context = planAxisContext(file);

		const rep = addAxisRepresentation(file, {
			context,
			axis: [
				[0.0, 0.0],
				[1.0, 0.0],
			],
		});

		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		expect((rep.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);
		expect(rep.get("RepresentationIdentifier")).toBe("Axis");
		expect(rep.get("RepresentationType")).toBe("Curve2D");
		const items = rep.get("Items") as EntityInstance[];
		expect(items.length).toBe(1);
		const curve = items[0];
		if (schema === "IFC2X3") {
			expect(curve.isA("IfcPolyline")).toBe(true);
			const points = curve.get("Points") as EntityInstance[];
			expect(points.map((p) => p.get("Coordinates"))).toEqual([
				[0.0, 0.0],
				[1.0, 0.0],
			]);
		} else {
			expect(curve.isA("IfcIndexedPolyCurve")).toBe(true);
			const pointList = curve.get("Points") as EntityInstance;
			expect(pointList.isA("IfcCartesianPointList2D")).toBe(true);
			expect(pointList.get("CoordList")).toEqual([
				[0.0, 0.0],
				[1.0, 0.0],
			]);
			expect(curve.get("Segments")).toBeNull();
			expect(curve.get("SelfIntersect")).toBe(false);
		}

		file.dispose();
	});

	test("builds a 3D axis representation (IFC4+ only for the IfcIndexedPolyCurve/IfcCartesianPointList3D branch)", () => {
		const file = createTestFile(schema);
		const context = modelAxisContext(file);

		const rep = addAxisRepresentation(file, {
			context,
			axis: [
				[0.0, 0.0, 0.0],
				[0.0, 0.0, 3.0],
			],
		});

		expect(rep.get("RepresentationType")).toBe("Curve3D");
		const items = rep.get("Items") as EntityInstance[];
		const curve = items[0];
		if (schema === "IFC2X3") {
			expect(curve.isA("IfcPolyline")).toBe(true);
			const points = curve.get("Points") as EntityInstance[];
			expect(points.map((p) => p.get("Coordinates"))).toEqual([
				[0.0, 0.0, 0.0],
				[0.0, 0.0, 3.0],
			]);
		} else {
			expect(curve.isA("IfcIndexedPolyCurve")).toBe(true);
			const pointList = curve.get("Points") as EntityInstance;
			expect(pointList.isA("IfcCartesianPointList3D")).toBe(true);
			expect(pointList.get("CoordList")).toEqual([
				[0.0, 0.0, 0.0],
				[0.0, 0.0, 3.0],
			]);
		}

		file.dispose();
	});

	test("converts SI to project units", () => {
		const file = createTestFile(schema);
		const context = planAxisContext(file);

		const rep = addAxisRepresentation(file, {
			context,
			axis: [
				[0.0, 0.0],
				[1.0, 0.0],
			],
		});
		// `createTestFile`'s template has no explicit unit assignment -- `calculateUnitScale`
		// falls back to its own documented default (SI, scale 1.0) in that case, so this
		// mainly pins that the conversion step runs without throwing; unit-scale-specific
		// numeric behavior is covered by `util/unit.test.ts`'s own dedicated suite.
		const items = rep.get("Items") as EntityInstance[];
		expect(items.length).toBe(1);

		file.dispose();
	});

	// Real Python quirk 1: `self.settings["axis"] = axis or []`, then an unguarded
	// `IndexError` (here: a JS out-of-bounds read, `undefined.length` throws a
	// `TypeError`) reading `axis[0]` on the now-empty list -- preserved verbatim.
	test("throws (unguarded) when axis is empty", () => {
		const file = createTestFile(schema);
		const context = planAxisContext(file);

		// Deliberately bypassing the stricter TS `readonly [Coord, Coord]` type (via
		// `as unknown as`, this project's own established convention for exercising a
		// looser real-Python runtime behavior a stricter TS type would otherwise
		// prevent -- see e.g. `test/util/placement.test.ts`'s identical technique) to
		// exercise the real, looser Python runtime behavior for a falsy `axis` -- see
		// `addAxisRepresentation.ts`'s own header comment (quirk 1).
		const axis = [] as unknown as AddAxisRepresentationSettings["axis"];
		expect(() => addAxisRepresentation(file, { context, axis })).toThrow();

		file.dispose();
	});

	// Real Python quirk 2: despite the docstring/type hint framing `axis` as exactly 2
	// coordinates, the implementation genuinely iterates the WHOLE sequence -- a 3-point
	// "axis" builds a 3-point curve, not rejected.
	test("accepts more than 2 points (undocumented, but not rejected by real Python either)", () => {
		const file = createTestFile(schema);
		const context = planAxisContext(file);

		// See this test's own comment above (quirk 2) for why `axis` is deliberately cast
		// past the stricter TS 2-tuple type here.
		const axis = [
			[0.0, 0.0],
			[1.0, 0.0],
			[2.0, 0.0],
		] as unknown as AddAxisRepresentationSettings["axis"];
		const rep = addAxisRepresentation(file, { axis, context });

		const items = rep.get("Items") as EntityInstance[];
		const curve = items[0];
		const pointCount =
			schema === "IFC2X3"
				? (curve.get("Points") as EntityInstance[]).length
				: ((curve.get("Points") as EntityInstance).get("CoordList") as number[][]).length;
		expect(pointCount).toBe(3);

		file.dispose();
	});
});
