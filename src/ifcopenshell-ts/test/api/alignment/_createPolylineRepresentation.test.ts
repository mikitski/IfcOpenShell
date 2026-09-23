// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `_create_polyline_representation.py`
// (confirmed by reading the whole real test directory). Original test coverage
// written here, gated to IFC4X3.
//
// **UPDATE (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/ifc4x3.ts`):**
// this file was previously independently BLOCKED by the pre-existing
// `entityInstance.ts` EXPRESS DERIVED-attribute gap, via `IfcCartesianPoint.Dim`
// (`points[0].Dim`) -- that chunk ports `calc_IfcPoint_Dim` for IFC4X3, closing this
// gap for real: `_createPolylineRepresentation` now runs to completion end-to-end for
// both 2D and 3D point lists, re-verified directly against the real built addon, not
// assumed. The former "REGRESSION -- blocked" test is replaced with 2 real,
// passing success tests below.

import { describe, expect, test } from "vitest";
import { _createPolylineRepresentation } from "../../../src/api/alignment/_createPolylineRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._createPolylineRepresentation (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignment", () => {
		const file: IfcFile = createTestFile("IFC4X3");
		const notAnAlignment = file.createEntity("IfcSite", guid.new());
		const point = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

		expect(() => _createPolylineRepresentation(file, notAnAlignment, [point])).toThrow(TypeError);
	});

	// **UPDATE (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/ifc4x3.ts`):
	// `calc_IfcPoint_Dim` is now ported -- `points[0].get("Dim")` (a plain
	// `IfcCartesianPoint`) now resolves to a real number instead of throwing, so this
	// function now runs to completion end-to-end -- re-verified directly against the
	// real built addon, not assumed. `_createPolylineRepresentation.ts`'s own header
	// comment is updated accordingly.
	test("2D points -> succeeds end-to-end, Curve2D representation (calc_IfcPoint_Dim ported, IFC4X3 chunk 3)", () => {
		const file: IfcFile = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [1.0, 1.0]),
		];

		_createPolylineRepresentation(file, alignment, points);

		const placement = alignment.get("ObjectPlacement") as EntityInstance;
		expect(placement.isA()).toBe("IfcLocalPlacement");
		const representation = alignment.get("Representation") as EntityInstance;
		const shapeRepresentation = (representation.get("Representations") as EntityInstance[])[0];
		expect(shapeRepresentation.get("RepresentationType")).toBe("Curve2D");
		expect(shapeRepresentation.get("RepresentationIdentifier")).toBe("Axis");
	});

	test("3D points -> succeeds end-to-end, Curve3D representation (calc_IfcPoint_Dim ported, IFC4X3 chunk 3)", () => {
		const file: IfcFile = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [1.0, 1.0, 1.0]),
		];

		_createPolylineRepresentation(file, alignment, points);

		const representation = alignment.get("Representation") as EntityInstance;
		const shapeRepresentation = (representation.get("Representations") as EntityInstance[])[0];
		expect(shapeRepresentation.get("RepresentationType")).toBe("Curve3D");
	});
});
