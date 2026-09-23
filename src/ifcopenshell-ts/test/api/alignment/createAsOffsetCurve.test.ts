// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `create_as_offset_curve.py` (confirmed by
// reading the whole real test directory). Original test coverage written here, gated
// to IFC4X3.
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND `calc_*`-porting chunk): a real
// invocation with a valid `offsets` list no longer throws.** See
// `createAsOffsetCurve.ts`'s own header comment for the full writeup:
// `_createOffsetCurveRepresentation`'s own `basisCurve.get("Dim")` read no longer
// throws for IFC4X3 (`calc_IfcCurve_Dim` is now ported there), so `createAsOffsetCurve`
// now completes successfully end-to-end for a valid `offsets` list, returning a real,
// aggregated `IfcAlignment` -- matching real Python's own success path. At that point,
// the representation built was always the 2D-shaped one regardless of the real curve's
// dimensionality, since `.Dim` itself resolved to `runtimeShim.INDETERMINATE` for a
// realistic basis curve -- a disclosed, then-current-state latent gap.
//
// **UPDATE AGAIN (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/
// ifc4x3.ts`): that latent gap is now closed for real** (`calc_IfcPoint_Dim` is now
// ported, `.Dim` resolves to the real dimensionality) -- see
// `_createOffsetCurveRepresentation.test.ts`'s own dedicated 2D/3D branch-selection
// tests for direct coverage of the fix itself; this file's own `dummyBasisCurve` fixture
// happens to be 2D, so its own assertions below were never sensitive to this gap
// either way and require no changes. An invalid `offsets` element still throws its own
// real, portable `TypeError` (unaffected by either update) -- that test below confirms
// the real `IfcAlignment` entity is ALREADY created in the file by the time that throw
// happens, pinning that real orchestration logic (guid creation, entity construction)
// genuinely runs before the type-check, not that the whole function is a no-op stub.

import { describe, expect, test } from "vitest";
import { createAsOffsetCurve } from "../../../src/api/alignment/createAsOffsetCurve";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function dummyBasisCurve(file: IfcFile): EntityInstance {
	return file.createEntity("IfcPolyline", [
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
	]);
}

function pointByDistanceExpression(file: IfcFile, basisCurve: EntityInstance): EntityInstance {
	// Raw-number-at-construction technique for `IfcCurveMeasureSelect`-typed
	// `DistanceAlong` -- established since chunk 2.
	return file.createEntity("IfcPointByDistanceExpression", 0.0, null, null, null, basisCurve);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createAsOffsetCurve (IFC4X3)", () => {
	test("throws a real, portable TypeError for an invalid offsets element, with the IfcAlignment already created", () => {
		const file = createTestFile("IFC4X3");
		const notAnOffset = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
		const alignmentCountBefore = file.byType("IfcAlignment").length;

		expect(() => createAsOffsetCurve(file, "A1", [notAnOffset])).toThrow(
			/Expected IfcPointByDistanceExpression but got IfcCartesianPoint/,
		);

		expect(file.byType("IfcAlignment").length).toBe(alignmentCountBefore + 1);
		expect(file.byType("IfcAlignment")[alignmentCountBefore].get("Name")).toBe("A1");
	});

	// **Was**: "throws the already-disclosed Dim gap for valid offsets" (any throw).
	// **Now**: genuinely unblocked -- see this file's own header comment.
	test("now genuinely unblocked for valid offsets: returns a real, aggregated IfcAlignment", () => {
		const file = createTestFile("IFC4X3");
		const basisCurve = dummyBasisCurve(file);
		const offset = pointByDistanceExpression(file, basisCurve);
		const alignmentCountBefore = file.byType("IfcAlignment").length;

		const alignment = createAsOffsetCurve(file, "A2", [offset]);

		expect(alignment.isA("IfcAlignment")).toBe(true);
		expect(alignment.get("Name")).toBe("A2");
		expect(file.byType("IfcAlignment").length).toBe(alignmentCountBefore + 1);
		// "The IfcAlignment is aggregated to IfcProject" (this file's own JSDoc) --
		// `createTestFile` provides a real IfcProject, so the `if (project)` branch runs.
		const project = file.byType("IfcProject")[0];
		const inverses = file.getInverse(project, true) as EntityInstance[];
		const aggregates = inverses.filter((rel) => rel.isA("IfcRelAggregates"));
		const relatedObjects = aggregates.flatMap((rel) => rel.get("RelatedObjects") as EntityInstance[]);
		expect(relatedObjects.some((o) => o.equals(alignment))).toBe(true);
	});

	// **Was**: "startStation is accepted but never used" pinned via IDENTICAL ERROR
	// MESSAGES (the only observable effect available while this function was fully
	// blocked). **Now genuinely unblocked** (see this file's own header comment) --
	// the SAME real Python quirk is now pinned more directly: 2 calls differing only
	// in `startStation` produce structurally IDENTICAL results (not just identical
	// error text).
	test("real, CONFIRMED Python quirk: startStation is accepted but never used -- identical results regardless of its value", () => {
		const file1 = createTestFile("IFC4X3");
		const file2 = createTestFile("IFC4X3");
		const offset1 = pointByDistanceExpression(file1, dummyBasisCurve(file1));
		const offset2 = pointByDistanceExpression(file2, dummyBasisCurve(file2));

		const alignment1 = createAsOffsetCurve(file1, "A", [offset1], 0.0);
		const alignment2 = createAsOffsetCurve(file2, "A", [offset2], 12345.678);

		const representation1 = (alignment1.get("Representation") as EntityInstance).get(
			"Representations",
		) as EntityInstance[];
		const representation2 = (alignment2.get("Representation") as EntityInstance).get(
			"Representations",
		) as EntityInstance[];
		expect(representation1[0].get("RepresentationType")).toBe(representation2[0].get("RepresentationType"));
		expect((representation1[0].get("Items") as EntityInstance[])[0].isA()).toBe(
			(representation2[0].get("Items") as EntityInstance[])[0].isA(),
		);
	});
});
