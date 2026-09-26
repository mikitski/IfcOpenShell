// This file was generated with the assistance of an AI coding tool.
//
// A real Python test file, `test/api/alignment/test_add_vertical_alignment.py` (83
// lines), DOES exist for `add_vertical_layout.py` -- this file's own previous header
// comment claimed otherwise; that claim was FALSE, corrected here after a dedicated
// re-verification pass (see `PROGRESS.md`'s "`api.alignment` test-fidelity backfill"
// entry, chunk 4/final of that item). Its own filename doesn't match the function name
// it tests (`add_vertical_layout`, not `add_vertical_alignment`), which is presumably
// why earlier chunks' own "read the whole real test directory" pass missed it. Its own
// fixture builds via `ifcopenshell.api.alignment.create(file, "A1",
// include_vertical=False)`, unconditionally blocked in this port (see
// `../../../src/api/alignment/create.ts`'s own header comment) -- not reusable as-is.
//
// Traced precisely (not just "out of scope"): catching `create()`'s own throw and
// recovering `file.byType("IfcAlignment")[0]` does NOT reproduce the real, fully-
// successful test's own starting shape either. `create()`'s `_createGeometricRepresentation`
// call (run BEFORE the throw, since `includeGeometry` defaults `true`) creates a real
// but EMPTY `IfcCompositeCurve` (the mandatory zero-length segment is only added by
// `create()`'s own trailing `_add_zero_length_segment` loop, which runs AFTER the
// throw) -- so `addStationingReferent`'s own composite-curve/non-empty-segments check
// is never satisfied, and it always takes its fallback-placement branch, creating a
// real `IfcReferent`+`Pset_Stationing` before throwing at the `editPset` gap, but
// NEVER reaching its own trailing nest-creation code -- so a recovered alignment's own
// `IsNestedBy` stays at 1 (just the layout nest), never the real test's own asserted 2
// (`# nests for layout and referents`). A literal port of the real test's own fixture
// and assertions therefore isn't a clean drop-in either way. Original test coverage
// written here instead, using a hand-built `IfcAlignment` with a real, empty
// "Axis"/"Curve2D" `IfcCompositeCurve` representation -- the exact shape `create()`'s
// own real, portable prefix produces, and the ONLY state this port's own currently-
// portable API surface can ever build a horizontal geometric representation into.
//
// THIS IS THE MOST IMPORTANT TEST FILE OF THIS CHUNK: `addVerticalLayout` is CONFIRMED
// genuinely fully functional end to end -- see
// `../../../src/api/alignment/addVerticalLayout.ts`'s own header comment for the full,
// carefully-verified trace. The tests below exercise BOTH the first-vertical-layout
// branch (IFC CT 4.1.4.4.1.1) and the second-vertical child-alignment-reuse branch
// (IFC CT 4.1.4.4.1.2) with real, passing, end-to-end assertions on every entity
// created -- not just disclosed-throw stubs -- PLUS a dedicated regression test for the
// one precise precondition this function needs to succeed (a parent alignment with a
// real basis curve already assigned).
//
// A subtlety independently verified while writing this suite: calling
// `addVerticalLayout` a SECOND time on the same parent does NOT throw when its own
// final `_addZeroLengthSegment` recursion reaches the shared horizontal composite curve
// a second time, even though that curve already got a real zero-length segment appended
// by the FIRST call's own identical recursion -- because `addZeroLengthSegment`'s own
// `hasZeroLengthSegment(layout)` early-return gate (checked BEFORE the
// `segments.length > 0` blocked-check) correctly recognizes the curve already ends in a
// zero-length segment and returns `false` (a no-op) rather than reaching the blocked
// branch. This is a real, load-bearing consequence of `addZeroLengthSegment.ts`'s own
// check ORDER (chunk 7), not something this file's own code does specially.

import { describe, expect, test } from "vitest";
import { addVerticalLayout } from "../../../src/api/alignment/addVerticalLayout";
import { getAxisSubcontext } from "../../../src/api/alignment/getAxisSubcontext";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/**
 * Builds a bare `IfcAlignment` with a real, portable, empty horizontal composite curve
 * ("Axis"/"Curve2D" representation) -- the ONLY state this port's own currently-portable
 * API surface can produce for a horizontal geometric representation (nothing that could
 * add real segments to it is portable yet). This is the exact precondition
 * `addVerticalLayout` needs to succeed -- see this file's own header comment.
 */
function buildHorizontalAlignment(
	file: IfcFile,
	name: string,
): { alignment: EntityInstance; compositeCurve: EntityInstance } {
	const alignment = file.createEntity(
		"IfcAlignment",
		guid.new(),
		null,
		name,
		null,
		null,
		file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0])),
		),
	);
	const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
	const axisSubcontext = getAxisSubcontext(file);
	const representation = file.createEntity("IfcShapeRepresentation", axisSubcontext, "Axis", "Curve2D", [
		compositeCurve,
	]);
	assignRepresentation(file, { product: alignment, representation });
	return { alignment, compositeCurve };
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.addVerticalLayout (IFC4X3)", () => {
	test("throws when parentAlignment has no representation at all (the one precise precondition)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "Bare");

		expect(() => addVerticalLayout(file, alignment)).toThrow();
	});

	test("first vertical layout (IFC CT 4.1.4.4.1.1): fully functional end to end", () => {
		const file = createTestFile("IFC4X3");
		const { alignment, compositeCurve } = buildHorizontalAlignment(file, "MainAlignment");

		const verticalLayout = addVerticalLayout(file, alignment);

		expect(verticalLayout.isA()).toBe("IfcAlignmentVertical");

		// The vertical layout is nested directly to the parent alignment.
		const nests = alignment.get("IsNestedBy") as EntityInstance[];
		const verticalNest = nests.find((n) =>
			(n.get("RelatedObjects") as EntityInstance[]).some((o) => o.identity() === verticalLayout.identity()),
		);
		expect(verticalNest).toBeDefined();

		// The original "Axis"/"Curve2D" representation was renamed to "FootPrint"/"Curve2D",
		// and a new "Axis"/"Curve3D" representation was added, wrapping a fresh
		// IfcGradientCurve whose BaseCurve is the SAME original compositeCurve.
		const representations = (
			(alignment.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]
		).slice();
		expect(representations.length).toBe(2);
		const footprintRep = representations.find((r) => r.get("RepresentationIdentifier") === "FootPrint");
		const axis3dRep = representations.find(
			(r) => r.get("RepresentationIdentifier") === "Axis" && r.get("RepresentationType") === "Curve3D",
		);
		expect(footprintRep).toBeDefined();
		expect(axis3dRep).toBeDefined();
		expect((footprintRep?.get("Items") as EntityInstance[])[0].identity()).toBe(compositeCurve.identity());

		const gradientCurve = (axis3dRep?.get("Items") as EntityInstance[])[0];
		expect(gradientCurve.isA()).toBe("IfcGradientCurve");
		expect((gradientCurve.get("BaseCurve") as EntityInstance).identity()).toBe(compositeCurve.identity());

		// The vertical layout itself got a real zero-length IfcAlignmentSegment.
		const verticalSegmentNest = (verticalLayout.get("IsNestedBy") as EntityInstance[])[0];
		const verticalSegment = (verticalSegmentNest.get("RelatedObjects") as EntityInstance[])[0];
		const verticalDesignParameters = verticalSegment.get("DesignParameters") as EntityInstance;
		expect(verticalDesignParameters.isA()).toBe("IfcAlignmentVerticalSegment");
		expect(verticalDesignParameters.get("PredefinedType")).toBe("CONSTANTGRADIENT");

		// The gradient curve's own representation also got a real zero-length IfcCurveSegment.
		const gradientSegments = gradientCurve.get("Segments") as EntityInstance[];
		expect(gradientSegments.length).toBe(1);

		// The recursion into the ORIGINAL horizontal composite curve also succeeded, for
		// real, adding its OWN zero-length segment too.
		const compositeSegments = compositeCurve.get("Segments") as EntityInstance[];
		expect(compositeSegments.length).toBe(1);
	});

	test("second vertical layout (IFC CT 4.1.4.4.1.2, child-alignment-reuse): ALSO fully functional end to end", () => {
		const file = createTestFile("IFC4X3");
		const { alignment, compositeCurve } = buildHorizontalAlignment(file, "MainAlignment");

		const firstVertical = addVerticalLayout(file, alignment);
		const secondVertical = addVerticalLayout(file, alignment);

		expect(secondVertical.identity()).not.toBe(firstVertical.identity());

		// The parent alignment no longer directly nests EITHER vertical layout -- both were
		// moved to (or created directly under) child alignments.
		const parentNests = alignment.get("IsNestedBy") as EntityInstance[];
		for (const nest of parentNests) {
			for (const related of nest.get("RelatedObjects") as EntityInstance[]) {
				expect(related.isA("IfcAlignmentVertical")).toBe(false);
			}
		}

		// The parent alignment now aggregates exactly 2 child alignments (1 rel, merged).
		const aggregatesRels = alignment.get("IsDecomposedBy") as EntityInstance[];
		const aggregatesRel = aggregatesRels.find((r) => r.isA("IfcRelAggregates"));
		expect(aggregatesRel).toBeDefined();
		const children = aggregatesRel?.get("RelatedObjects") as EntityInstance[];
		expect(children.length).toBe(2);

		// One child nests the FIRST vertical layout (moved there); the other nests the
		// SECOND (created directly under it).
		const childOfFirst = children.find((c) =>
			(c.get("IsNestedBy") as EntityInstance[]).some((n) =>
				(n.get("RelatedObjects") as EntityInstance[]).some((o) => o.identity() === firstVertical.identity()),
			),
		);
		const childOfSecond = children.find((c) =>
			(c.get("IsNestedBy") as EntityInstance[]).some((n) =>
				(n.get("RelatedObjects") as EntityInstance[]).some((o) => o.identity() === secondVertical.identity()),
			),
		);
		expect(childOfFirst).toBeDefined();
		expect(childOfSecond).toBeDefined();
		expect(childOfFirst?.identity()).not.toBe(childOfSecond?.identity());

		// The parent's own "Axis"/"Curve3D" representation (created by the FIRST call) was
		// MOVED to childOfFirst -- the parent itself now only has the "FootPrint" one.
		const parentRepresentations = (
			(alignment.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]
		).slice();
		expect(parentRepresentations.length).toBe(1);
		expect(parentRepresentations[0].get("RepresentationIdentifier")).toBe("FootPrint");
		expect((childOfFirst?.get("ObjectPlacement") as EntityInstance).identity()).toBe(
			(alignment.get("ObjectPlacement") as EntityInstance).identity(),
		);

		const childOfFirstAxis3d = (
			(childOfFirst?.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]
		)[0];
		expect(childOfFirstAxis3d.get("RepresentationIdentifier")).toBe("Axis");
		expect(childOfFirstAxis3d.get("RepresentationType")).toBe("Curve3D");

		// childOfSecond has its OWN fresh "Axis"/"Curve3D" representation, whose gradient
		// curve's BaseCurve is the SAME shared original compositeCurve.
		const childOfSecondAxis3d = (
			(childOfSecond?.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]
		)[0];
		const secondGradientCurve = (childOfSecondAxis3d.get("Items") as EntityInstance[])[0];
		expect(secondGradientCurve.isA()).toBe("IfcGradientCurve");
		expect((secondGradientCurve.get("BaseCurve") as EntityInstance).identity()).toBe(compositeCurve.identity());

		// The second vertical layout also got its own real zero-length segment, and its
		// own gradient curve's representation did too.
		const secondVerticalSegmentNest = (secondVertical.get("IsNestedBy") as EntityInstance[])[0];
		expect((secondVerticalSegmentNest.get("RelatedObjects") as EntityInstance[]).length).toBe(1);
		expect((secondGradientCurve.get("Segments") as EntityInstance[]).length).toBe(1);

		// The shared original compositeCurve still has exactly 1 zero-length segment (the
		// one the FIRST call's own recursion added) -- the SECOND call's own identical
		// recursion into it hit `addZeroLengthSegment`'s `hasZeroLengthSegment` early
		// return and did NOT throw, and did NOT add a second one either (a true no-op).
		expect((compositeCurve.get("Segments") as EntityInstance[]).length).toBe(1);
	});
});
