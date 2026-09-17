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
// 2. Every scenario with at least one REAL segment throws at one of 2 independent,
//    already-disclosed primitive-layer gaps (see
//    `../../../src/api/alignment/updateKeyPointReferents.ts`'s own header comment for
//    the full writeup, confirmed EMPIRICALLY against this chunk's own built native
//    addon before writing this file) -- pinned here as dedicated regression tests
//    (one per gap), plus a test confirming the `relNests`-from-an-ancestor naming
//    override (real Python's own `test_rel_nests_from_ancestor_used_for_naming_and
//    _nesting`) still resolves correctly for the ONE referent that gets created before
//    the throw.

import { describe, expect, test } from "vitest";
import { updateKeyPointReferents } from "../../../src/api/alignment/updateKeyPointReferents";
import { addPset } from "../../../src/api/pset/addPset";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const BLOCKED_ERROR = "Attribute access is only supported on entity instances";

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

	describe("blocked by 2 independent, already-disclosed primitive-layer gaps (see updateKeyPointReferents.ts's own header comment)", () => {
		test("a real, non-composite-curve layout: creates ONE real IfcReferent (the P.O.B. marker) then throws at the disclosed editPset gap", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file, "A1", [0, 0, 0]);
			const horizontal = buildHorizontalLayout(file, alignment, [100.0, 50.0]);

			expect(() => updateKeyPointReferents(file, horizontal)).toThrow(BLOCKED_ERROR);

			const referents = file.byType("IfcReferent");
			expect(referents).toHaveLength(1);
			expect(referents[0].get("Name")).toBe("A1 0+000.000 (P.O.B.)");
			expect(referents[0].get("PredefinedType")).toBe("POSITION");
		});

		test("a real composite-curve layout: throws at the disclosed IfcLengthMeasure gap, before any IfcReferent is created", () => {
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

			expect(() => updateKeyPointReferents(file, horizontal)).toThrow(BLOCKED_ERROR);
			expect(file.byType("IfcReferent")).toHaveLength(0);
		});

		test("a rel_nests from an ancestor alignment names the (one, pre-throw) referent after the ancestor, not the direct parent", () => {
			const file = createTestFile("IFC4X3");
			const parent = alignmentAt(file, "A1", [0, 0, 0]);
			const child = file.createEntity("IfcAlignment", guid.new(), null, "Child of A1");
			file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);
			const childHorizontal = buildHorizontalLayout(file, child, [100.0]);

			const parentNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, parent, []);

			expect(() => updateKeyPointReferents(file, childHorizontal, parentNest)).toThrow(BLOCKED_ERROR);

			const referents = file.byType("IfcReferent");
			expect(referents).toHaveLength(1);
			expect(referents[0].get("Name")).toBe("A1 0+000.000 (P.O.B.)");
			expect((referents[0].get("Name") as string).includes("Child of")).toBe(false);
		});
	});
});
