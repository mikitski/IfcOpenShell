// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_update_alignment_parameter_segment_tags.py`
// (src/ifcopenshell-python) -- unlike its sibling `updateKeyPointReferents.test.ts`,
// this file's own function has NO disclosed blocker at all (see
// `../../../src/api/alignment/updateAlignmentParameterSegmentTags.ts`'s own header
// comment: it never creates an `IfcReferent`/calls `api.pset.*`, only mutates plain
// `string | null` `StartTag`/`EndTag` attributes on already-real entities), so every
// real Python assertion is ported here with a real, passing, unblocked equivalent.
// Real Python's own fixtures build via `create`/`create_by_pi_method`
// (`_build_alignment`) or `create(..., include_geometry=False)` +
// `create_layout_segment` (not in this chunk's scope) -- this suite substitutes
// minimal, hand-rolled `IfcAlignment`/layout/segment fixtures reproducing the exact
// same segment-type sequences real Python's own tests use, so every ported numeric/
// string assertion (including the documented "xx" unfilled-lookup-table-entry
// regression, `test_cant_layout_boundary_tags`) is a faithful, real equivalent, not a
// placeholder.

import { describe, expect, test } from "vitest";
import { updateAlignmentParameterSegmentTags } from "../../../src/api/alignment/updateAlignmentParameterSegmentTags";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function alignmentAt(file: IfcFile, name = "TestAlignment"): EntityInstance {
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
			file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])),
		),
		null,
	);
}

function horizontalSegment(file: IfcFile, predefinedType: string, length: number): EntityInstance {
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
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function verticalSegment(
	file: IfcFile,
	predefinedType: string,
	startDistAlong: number,
	horizontalLength: number,
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentVerticalSegment",
		null,
		null,
		startDistAlong,
		horizontalLength,
		0.0,
		0.0,
		0.0,
		null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function cantSegment(
	file: IfcFile,
	predefinedType: string,
	startDistAlong: number,
	horizontalLength: number,
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentCantSegment",
		null,
		null,
		startDistAlong,
		horizontalLength,
		0.0,
		0.0,
		0.0,
		0.0,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function nestHorizontal(file: IfcFile, alignment: EntityInstance, segments: readonly EntityInstance[]): EntityInstance {
	const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);
	if (segments.length > 0) {
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [...segments]);
	}
	return horizontal;
}

function nestVertical(file: IfcFile, alignment: EntityInstance, segments: readonly EntityInstance[]): EntityInstance {
	const vertical = file.createEntity("IfcAlignmentVertical", guid.new());
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [vertical]);
	if (segments.length > 0) {
		file.createEntity("IfcRelNests", guid.new(), null, null, null, vertical, [...segments]);
	}
	return vertical;
}

function nestCant(file: IfcFile, alignment: EntityInstance, segments: readonly EntityInstance[]): EntityInstance {
	const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, null, null, null, null, null, 1.435);
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [cant]);
	if (segments.length > 0) {
		file.createEntity("IfcRelNests", guid.new(), null, null, null, cant, [...segments]);
	}
	return cant;
}

function tag(segment: EntityInstance, attr: "StartTag" | "EndTag"): string | null {
	return (segment.get("DesignParameters") as EntityInstance).get(attr) as string | null;
}

function label(t: string | null): string {
	return (t as string).split("(").slice(1).join("(").replace(/\)$/, "");
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"api.alignment.updateAlignmentParameterSegmentTags (IFC4X3)",
	() => {
		test("throws TypeError for a layout that isn't IfcAlignmentHorizontal/Vertical/Cant", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);

			expect(() => updateAlignmentParameterSegmentTags(file, alignment)).toThrow(
				new TypeError(
					"Expected entity type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant'], instead received IfcAlignment",
				),
			);
		});

		test("throws Error when layout is not nested under any IfcAlignment", () => {
			const file = createTestFile("IFC4X3");
			const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());

			expect(() => updateAlignmentParameterSegmentTags(file, horizontal)).toThrow(
				`IfcAlignmentHorizontal #${horizontal.id()} is not nested under an IfcAlignment.`,
			);
		});

		test("returns undefined (Python: None)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const horizontal = nestHorizontal(file, alignment, [horizontalSegment(file, "LINE", 100.0)]);

			expect(updateAlignmentParameterSegmentTags(file, horizontal)).toBeUndefined();
		});

		test("creates no IfcReferent or IfcRelNests beyond the segment nest itself", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const horizontal = nestHorizontal(file, alignment, [horizontalSegment(file, "LINE", 100.0)]);

			const relNestsBefore = file.byType("IfcRelNests").length;
			updateAlignmentParameterSegmentTags(file, horizontal);

			expect(file.byType("IfcReferent")).toHaveLength(0);
			expect(file.byType("IfcRelNests")).toHaveLength(relNestsBefore);
		});

		test("zero real segments (no segments at all): no-op, no tags set", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const horizontal = nestHorizontal(file, alignment, []);

			expect(updateAlignmentParameterSegmentTags(file, horizontal)).toBeUndefined();
		});

		test("a trailing zero-length segment is stripped -- its own tags are left untouched", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const real = horizontalSegment(file, "LINE", 100.0);
			const zeroLength = horizontalSegment(file, "LINE", 0.0);
			const horizontal = nestHorizontal(file, alignment, [real, zeroLength]);

			updateAlignmentParameterSegmentTags(file, horizontal, true);

			expect(label(tag(real, "StartTag"))).toBe("P.O.B.");
			expect(label(tag(real, "EndTag"))).toBe("P.O.E.");
			expect(tag(zeroLength, "StartTag")).toBeNull();
			expect(tag(zeroLength, "EndTag")).toBeNull();
		});

		test("single real segment produces only the boundary tags (label_end_tag=true)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const segment = horizontalSegment(file, "LINE", 100.0);
			const horizontal = nestHorizontal(file, alignment, [segment]);

			updateAlignmentParameterSegmentTags(file, horizontal, true);

			expect(label(tag(segment, "StartTag"))).toBe("P.O.B.");
			expect(label(tag(segment, "EndTag"))).toBe("P.O.E.");
		});

		test("EndTag is not labelled by default (label_end_tag omitted)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const segment = horizontalSegment(file, "LINE", 100.0);
			const horizontal = nestHorizontal(file, alignment, [segment]);

			updateAlignmentParameterSegmentTags(file, horizontal);

			expect(label(tag(segment, "StartTag"))).toBe("P.O.B.");
			expect(tag(segment, "EndTag")).toBeNull();
		});

		test("horizontal tag labels and adjacency across 7 alternating LINE/CIRCULARARC segments", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const types = ["LINE", "CIRCULARARC", "LINE", "CIRCULARARC", "LINE", "CIRCULARARC", "LINE"];
			const segments = types.map((t) => horizontalSegment(file, t, 100.0));
			const horizontal = nestHorizontal(file, alignment, segments);

			updateAlignmentParameterSegmentTags(file, horizontal, true);

			const startLabels = segments.map((s) => label(tag(s, "StartTag")));
			const endLabels = segments.map((s) => label(tag(s, "EndTag")));

			expect(startLabels).toEqual(["P.O.B.", "P.C.", "P.T.", "P.C.", "P.T.", "P.C.", "P.T."]);
			expect(endLabels).toEqual(["P.C.", "P.T.", "P.C.", "P.T.", "P.C.", "P.T.", "P.O.E."]);

			for (let i = 0; i < segments.length; i++) {
				expect(tag(segments[i], "StartTag")).not.toBeNull();
				expect(tag(segments[i], "EndTag")).not.toBeNull();
			}
			for (let i = 0; i < segments.length - 1; i++) {
				expect(tag(segments[i], "EndTag")).toBe(tag(segments[i + 1], "StartTag"));
			}
		});

		test("vertical tag labels and adjacency across 9 alternating CONSTANTGRADIENT/PARABOLICARC segments", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const types = [
				"CONSTANTGRADIENT",
				"PARABOLICARC",
				"CONSTANTGRADIENT",
				"PARABOLICARC",
				"CONSTANTGRADIENT",
				"PARABOLICARC",
				"CONSTANTGRADIENT",
				"PARABOLICARC",
				"CONSTANTGRADIENT",
			];
			let distAlong = 0.0;
			const segments = types.map((t) => {
				const s = verticalSegment(file, t, distAlong, 100.0);
				distAlong += 100.0;
				return s;
			});
			const vertical = nestVertical(file, alignment, segments);

			updateAlignmentParameterSegmentTags(file, vertical, true);

			const startLabels = segments.map((s) => label(tag(s, "StartTag")));
			const endLabels = segments.map((s) => label(tag(s, "EndTag")));

			expect(startLabels).toEqual([
				"V.P.O.B.",
				"P.V.C.",
				"P.V.T.",
				"P.V.C.",
				"P.V.T.",
				"P.V.C.",
				"P.V.T.",
				"P.V.C.",
				"P.V.T.",
			]);
			expect(endLabels).toEqual([
				"P.V.C.",
				"P.V.T.",
				"P.V.C.",
				"P.V.T.",
				"P.V.C.",
				"P.V.T.",
				"P.V.C.",
				"P.V.T.",
				"V.P.O.E.",
			]);

			for (let i = 0; i < segments.length - 1; i++) {
				expect(tag(segments[i], "EndTag")).toBe(tag(segments[i + 1], "StartTag"));
			}
		});

		test("cant layout boundary tags, including the real, documented 'xx' unfilled-lookup-table-entry regression", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const dp1 = cantSegment(file, "CONSTANTCANT", 0.0, 100.0);
			const dp2 = cantSegment(file, "CONSTANTCANT", 100.0, 50.0);
			const cant = nestCant(file, alignment, [dp1, dp2]);

			updateAlignmentParameterSegmentTags(file, cant, true);

			expect(label(tag(dp1, "StartTag"))).toBe("C.P.O.B.");
			expect(label(tag(dp2, "EndTag"))).toBe("C.P.O.E.");
			// CONSTANTCANT -> CONSTANTCANT is currently an unfilled "xx" placeholder in the
			// cant lookup table (_getSegmentStartPointLabel.ts) -- out of scope to fill in
			// here, matching real Python's own documented regression.
			expect(label(tag(dp1, "EndTag"))).toBe("xx");
			expect(label(tag(dp2, "StartTag"))).toBe("xx");
		});

		test("exact tag format matches '<station> (<label>)' via getAlignmentStartStation/_getKeyPointTag", () => {
			const file = createTestFile("IFC4X3");
			const alignment = alignmentAt(file);
			const segment = horizontalSegment(file, "LINE", 100.0);
			const horizontal = nestHorizontal(file, alignment, [segment]);

			updateAlignmentParameterSegmentTags(file, horizontal);

			expect(tag(segment, "StartTag")).toBe("0+000.000 (P.O.B.)");
		});
	},
);
