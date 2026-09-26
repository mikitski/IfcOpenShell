// This file was generated with the assistance of an AI coding tool.
//
// Real Python's own `test_update_key_point_referents.py` builds its fixture via
// `ifcopenshell.api.alignment.create`/`create_by_pi_method` (not in this chunk's
// scope). This suite builds minimal, hand-rolled `IfcAlignment`/layout/segment
// fixtures directly (matching this module's established fixture pattern), and is
// split into 2 groups:
//
// 1. Validation, the zero-real-segments early return, and `clear=true`'s own
//    referent-REMOVAL cleanup -- all FULLY PORTABLE and given full, real, passing
//    assertions, ported from (or, for `clear=true`, adapted from, since a hand-built
//    "pre-existing referents" fixture is needed to bypass the blocked creation path)
//    real Python's own `test_wrong_layout_type_raises_type_error`/
//    `test_not_nested_under_alignment_raises_value_error`/
//    `test_provided_rel_nests_with_wrong_relating_object_raises_type_error`/
//    `test_no_real_segments_produces_no_referents`/`test_clear_true_removes_old
//    _referents_and_psets`.
// 2. Every scenario with at least one REAL segment used to throw at one of 2
//    independent, already-disclosed primitive-layer gaps (see
//    `../../../src/api/alignment/updateKeyPointReferents.ts`'s own header comment for
//    the full writeup).
//
// **Reference-parity chunk 4 of 5 update (2026-09-25):** `TODOS.md`'s "EntityInstance
// .setByIndex/IfcFile.createEntity ..." gate (PR #179) is now fixed, and the
// `editPset`-new-property gate (`api.pset` chunk) was already flipped in chunk 2 of 5.
// The non-composite-curve scenarios below (this file's own hand-rolled layouts never
// attach an "Axis" representation to their alignment, so `getLayoutCurve` returns
// `null` and every key-point referent takes the fallback-placement branch) now succeed
// completely, creating one real `IfcReferent` PER key point (not just the first one)
// -- flipped to their real, verified assertions, confirmed against this chunk's own
// freshly-built native addon.
//
// The composite-curve scenario, however, turned out to be MORE complicated than this
// file's own original pinning comment assumed -- see
// `addPositioningReferent.test.ts`'s own detailed writeup of the same finding: fixing
// the `IfcLengthMeasure` gate un-blocks `IfcPointByDistanceExpression` construction,
// but `updateFallbackPosition`'s own `getAxis2placement` call then hits a SEPARATE,
// already-tracked, still-open `ifcopenshell.geom` gap (`TODOS.md`'s dedicated
// `getAxis2placement` entry). Left skipped rather than forced to a fudged "succeeds"
// assertion.

import { describe, expect, test } from "vitest";
import { updateKeyPointReferents } from "../../../src/api/alignment/updateKeyPointReferents";
import { addPset } from "../../../src/api/pset/addPset";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const GEOM_GAP_ERROR = /ifcopenshell\.geom/;

function alignmentAt(file: IfcFile, name: string, coordinates: readonly [number, number, number]): EntityInstance {
	return file.createEntity(
		"IfcAlignment",
		guid.new(),
		null,
		name,
		null,
		null,
		file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [...coordinates])),
		),
		null,
	);
}

function horizontalLine(file: IfcFile, length: number): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		0.0,
		0.0,
		0.0,
		length,
		null,
		"LINE",
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

/** Builds `alignment` -[Nests]-> `horizontal` -[Nests]-> `segments`, all real. */
function buildHorizontalLayout(
	file: IfcFile,
	alignment: EntityInstance,
	segmentLengths: readonly number[],
): EntityInstance {
	const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);
	if (segmentLengths.length > 0) {
		const segments = segmentLengths.map((length) => horizontalLine(file, length));
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, segments);
	}
	return horizontal;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.updateKeyPointReferents (IFC4X3)", () => {
	describe("fully portable", () => {
		test("throws TypeError for a layout that isn't IfcAlignmentHorizontal/Vertical/Cant", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file, "A1", [0, 0, 0]);

			expect(() => updateKeyPointReferents(file, alignment)).toThrow(
				new TypeError(
					"Expected entity type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant'], instead received IfcAlignment",
				),
			);
		});

		test("throws Error when layout is not nested under any IfcAlignment", () => {
			const file = createTestFile("IFC4X3");
			const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());

			expect(() => updateKeyPointReferents(file, horizontal)).toThrow(
				`IfcAlignmentHorizontal #${horizontal.id()} is not nested under an IfcAlignment.`,
			);
		});

		test("throws TypeError when the provided relNests.RelatingObject is not an IfcAlignment", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file, "A1", [0, 0, 0]);
			const horizontal = buildHorizontalLayout(file, alignment, []);
			const badNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, []);

			expect(() => updateKeyPointReferents(file, horizontal, badNest)).toThrow(
				new TypeError("Expected rel_nests.RelatingObject to be IfcAlignment, instead received IfcAlignmentHorizontal"),
			);
		});

		test("zero real segments: returns a new, empty IfcRelNests related to the alignment, no referents created", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file, "A1", [0, 0, 0]);
			const horizontal = buildHorizontalLayout(file, alignment, []);

			const nest = updateKeyPointReferents(file, horizontal);

			expect(nest.isA("IfcRelNests")).toBe(true);
			expect((nest.get("RelatingObject") as EntityInstance).equals(alignment)).toBe(true);
			expect(nest.get("RelatedObjects")).toEqual([]);
			expect(file.byType("IfcReferent")).toHaveLength(0);
		});

		test("clear=true removes pre-existing referents and their psets before regenerating (hand-built fixture, bypassing the blocked creation path)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file, "A1", [0, 0, 0]);
			const horizontal = buildHorizontalLayout(file, alignment, []);

			function buildReferent(name: string, station: number): EntityInstance {
				const referent = file.createEntity(
					"IfcReferent",
					guid.new(),
					null,
					name,
					null,
					null,
					file.createEntity(
						"IfcLocalPlacement",
						null,
						file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])),
					),
					null,
					"POSITION",
				);
				const pset = addPset(file, { product: referent, name: "Pset_Stationing" });
				pset.set("HasProperties", [file.createEntity("IfcPropertySingleValue", "Station", null, station, null)]);
				return referent;
			}

			const referent1 = buildReferent("A1 0+000.000 (P.O.B.)", 0.0);
			const referent2 = buildReferent("A1 0+100.000 (P.O.E.)", 100.0);
			const pset1 = (referent1.get("IsDefinedBy") as EntityInstance[])[0].get(
				"RelatingPropertyDefinition",
			) as EntityInstance;
			const pset2 = (referent2.get("IsDefinedBy") as EntityInstance[])[0].get(
				"RelatingPropertyDefinition",
			) as EntityInstance;
			const oldNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [referent1, referent2]);
			const oldIds = [referent1.id(), referent2.id(), pset1.id(), pset2.id()];

			const result = updateKeyPointReferents(file, horizontal, oldNest, true);

			expect(result.get("RelatedObjects")).toEqual([]);
			for (const id of oldIds) {
				expect(() => file.byId(id)).toThrow();
			}
		});
	});

	describe("real segments", () => {
		// Reference-parity chunk 4 of 5: this layout has no "Axis" representation at
		// all, so `getLayoutCurve` returns `null` and every key-point referent takes
		// the fully-portable fallback-placement branch -- now succeeds completely for
		// EVERY segment (P.O.B., the interior P.I., and P.O.E.), not just the first
		// one. Verified against this chunk's own freshly-built native addon.
		test("a real, non-composite-curve layout: creates one real IfcReferent per key point", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file, "A1", [0, 0, 0]);
			const horizontal = buildHorizontalLayout(file, alignment, [100.0, 50.0]);

			const nest = updateKeyPointReferents(file, horizontal);

			const referents = file.byType("IfcReferent");
			expect(referents).toHaveLength(3);
			expect(referents.map((r) => r.get("Name"))).toEqual([
				"A1 0+000.000 (P.O.B.)",
				"A1 0+100.000 (P.I.)",
				"A1 0+150.000 (P.O.E.)",
			]);
			expect(referents.every((r) => r.get("PredefinedType") === "POSITION")).toBe(true);
			expect(referents.every((r) => (r.get("ObjectPlacement") as EntityInstance).isA("IfcLocalPlacement"))).toBe(true);
			expect(nest.get("RelatedObjects") as EntityInstance[]).toHaveLength(3);
		});

		// Reference-parity chunk 4 of 5: STILL blocked, but no longer by the gate this
		// file used to pin -- see this file's own header comment for the full writeup.
		// Fixing the `IfcLengthMeasure` gate lets `IfcPointByDistanceExpression`
		// construction succeed, but `updateFallbackPosition`'s own `getAxis2placement`
		// call then hits the SEPARATE, already-tracked `ifcopenshell.geom` gap. Left
		// skipped (not flipped to a fudged "succeeds" assertion) until
		// `ifcopenshell.geom` lands.
		test.skip("a real composite-curve layout: throws at the disclosed ifcopenshell.geom gap (not the now-fixed IfcLengthMeasure gap), before any IfcReferent is created", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file, "A1", [0, 0, 0]);
			const horizontal = buildHorizontalLayout(file, alignment, [100.0, 50.0]);

			const context = file.createEntity(
				"IfcGeometricRepresentationContext",
				null,
				"Model",
				3,
				1.0e-5,
				file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0])),
			);
			const compositeCurveSegment = file.createEntity(
				"IfcCompositeCurveSegment",
				"CONTINUOUS",
				true,
				file.createEntity(
					"IfcLine",
					file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
					file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
				),
			);
			const compositeCurve = file.createEntity("IfcCompositeCurve", [compositeCurveSegment], false);
			const shapeRepresentation = file.createEntity("IfcShapeRepresentation", context, "Axis", "Curve2D", [
				compositeCurve,
			]);
			alignment.set(
				"Representation",
				file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]),
			);

			expect(() => updateKeyPointReferents(file, horizontal)).toThrow(GEOM_GAP_ERROR);
			expect(file.byType("IfcReferent")).toHaveLength(0);
		});

		// Real Python: `test_rel_nests_from_ancestor_used_for_naming_and_nesting`.
		// Reference-parity chunk 4 of 5: now succeeds completely -- both key-point
		// referents are named after the ancestor ("A1 "), not the child ("Child of
		// A1").
		test("a rel_nests from an ancestor alignment names every referent after the ancestor, not the direct parent", () => {
			const file = createTestFile("IFC4X3");
			const parent = alignmentAt(file, "A1", [0, 0, 0]);
			const child = file.createEntity("IfcAlignment", guid.new(), null, "Child of A1");
			file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);
			const childHorizontal = buildHorizontalLayout(file, child, [100.0]);

			const parentNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, parent, []);

			const result = updateKeyPointReferents(file, childHorizontal, parentNest);

			expect(result.equals(parentNest)).toBe(true);
			expect((result.get("RelatingObject") as EntityInstance).equals(parent)).toBe(true);
			const referents = file.byType("IfcReferent");
			expect(referents).toHaveLength(2);
			expect(referents.map((r) => r.get("Name"))).toEqual(["A1 0+000.000 (P.O.B.)", "A1 0+100.000 (P.O.E.)"]);
			expect(referents.every((r) => !(r.get("Name") as string).includes("Child of"))).toBe(true);
		});
	});
});
