// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_referent_names.py` (src/ifcopenshell-python)
// -- real Python's own fixture builds a full alignment via
// `ifcopenshell.api.alignment.create_by_pi_method` (not in this chunk's scope). This
// port builds minimal, hand-rolled `IfcAlignmentSegment`/`DesignParameters` fixtures
// directly, matching this module's established "can't reuse the real fixture, build an
// equivalent one instead" precedent. Ports every real lookup-table transition
// `test_referent_names.py`'s own `test_with_default_names`/`test_with_callbacks`
// exercises (`"P.O.B."`/`"P.C."`/`"P.T."`/`"P.O.E."` for horizontal,
// `"V.P.O.B."`/`"P.V.C."`/`"P.V.T."`/`"V.P.O.E."` for vertical, plus the callback
// override), and adds original coverage for the cant table and the 4 `TypeError`
// validation branches (none of which real Python's own test file exercises).
//
// **Real Python's own test suite does NOT reliably reset `register_referent_name
// _callback`'s module-level state between tests** -- `test_with_callbacks` only resets
// it (`register_referent_name_callback(None, None, None)`) at its own trailing line,
// with no `pytest` fixture teardown ensuring this runs even on an earlier failure (see
// `../../../src/api/alignment/_getSegmentStartPointLabel.ts`'s own header comment for
// the full writeup). This suite deliberately does NOT copy that fragility: an
// `afterEach` below unconditionally resets all 3 callbacks to `null`, so this port's
// own suite has no order-dependent flakiness regardless of test order or a mid-test
// failure.

import { afterEach, describe, expect, test } from "vitest";
import {
	_getSegmentStartPointLabel,
	registerReferentNameCallback,
} from "../../../src/api/alignment/_getSegmentStartPointLabel";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function horizontalSegment(file: IfcFile, predefinedType: string): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		0.0,
		0.0,
		0.0,
		100.0,
		null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function verticalSegment(file: IfcFile, predefinedType: string): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentVerticalSegment",
		null,
		null,
		0.0,
		100.0,
		0.0,
		0.0,
		0.0,
		null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function cantSegment(file: IfcFile, predefinedType: string): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentCantSegment",
		null,
		null,
		0.0,
		100.0,
		0.0,
		0.0,
		0.0,
		0.0,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._getSegmentStartPointLabel (IFC4X3)", () => {
	afterEach(() => {
		registerReferentNameCallback(null, null, null);
	});

	describe("default (built-in lookup table) labels", () => {
		test("horizontal boundary labels: P.O.B./P.O.E.", () => {
			const file = createTestFile("IFC4X3");
			const line = horizontalSegment(file, "LINE");
			expect(_getSegmentStartPointLabel(null, line)).toBe("P.O.B.");
			expect(_getSegmentStartPointLabel(line, null)).toBe("P.O.E.");
		});

		test("horizontal transitions: LINE->CIRCULARARC is P.C., CIRCULARARC->LINE is P.T., LINE->LINE is P.I.", () => {
			const file = createTestFile("IFC4X3");
			const line1 = horizontalSegment(file, "LINE");
			const arc = horizontalSegment(file, "CIRCULARARC");
			const line2 = horizontalSegment(file, "LINE");

			expect(_getSegmentStartPointLabel(line1, arc)).toBe("P.C.");
			expect(_getSegmentStartPointLabel(arc, line2)).toBe("P.T.");
			expect(_getSegmentStartPointLabel(line1, line2)).toBe("P.I.");
		});

		test("vertical boundary labels: V.P.O.B./V.P.O.E.", () => {
			const file = createTestFile("IFC4X3");
			const grade = verticalSegment(file, "CONSTANTGRADIENT");
			expect(_getSegmentStartPointLabel(null, grade)).toBe("V.P.O.B.");
			expect(_getSegmentStartPointLabel(grade, null)).toBe("V.P.O.E.");
		});

		test("vertical transitions: CONSTANTGRADIENT->PARABOLICARC is P.V.C., PARABOLICARC->CONSTANTGRADIENT is P.V.T., CONSTANTGRADIENT->CONSTANTGRADIENT is P.V.I", () => {
			const file = createTestFile("IFC4X3");
			const g1 = verticalSegment(file, "CONSTANTGRADIENT");
			const parabola = verticalSegment(file, "PARABOLICARC");
			const g2 = verticalSegment(file, "CONSTANTGRADIENT");

			expect(_getSegmentStartPointLabel(g1, parabola)).toBe("P.V.C.");
			expect(_getSegmentStartPointLabel(parabola, g2)).toBe("P.V.T.");
			expect(_getSegmentStartPointLabel(g1, g2)).toBe("P.V.I");
		});

		test("cant boundary labels: C.P.O.B./C.P.O.E.", () => {
			const file = createTestFile("IFC4X3");
			const cant = cantSegment(file, "CONSTANTCANT");
			expect(_getSegmentStartPointLabel(null, cant)).toBe("C.P.O.B.");
			expect(_getSegmentStartPointLabel(cant, null)).toBe("C.P.O.E.");
		});

		test("cant CONSTANTCANT->CONSTANTCANT is the real, unfilled 'xx' placeholder (matching test_update_alignment_parameter_segment_tags.py's own documented regression)", () => {
			const file = createTestFile("IFC4X3");
			const c1 = cantSegment(file, "CONSTANTCANT");
			const c2 = cantSegment(file, "CONSTANTCANT");
			expect(_getSegmentStartPointLabel(c1, c2)).toBe("xx");
		});
	});

	describe("registerReferentNameCallback overrides", () => {
		test("a registered horizontal callback's output is used instead of the default lookup table", () => {
			const file = createTestFile("IFC4X3");
			registerReferentNameCallback(
				(prev, seg) => {
					if (prev === null && seg !== null) return "A";
					if (prev !== null && seg === null) return "Z";
					return "Q";
				},
				null,
				null,
			);

			const line1 = horizontalSegment(file, "LINE");
			const arc = horizontalSegment(file, "CIRCULARARC");

			expect(_getSegmentStartPointLabel(null, line1)).toBe("A");
			expect(_getSegmentStartPointLabel(line1, arc)).toBe("Q");
			expect(_getSegmentStartPointLabel(arc, null)).toBe("Z");
		});

		test("a registered vertical callback's output is used instead of the default lookup table, independent of the horizontal callback", () => {
			const file = createTestFile("IFC4X3");
			registerReferentNameCallback(null, () => "v-override", null);

			const grade = verticalSegment(file, "CONSTANTGRADIENT");
			expect(_getSegmentStartPointLabel(null, grade)).toBe("v-override");

			// horizontal is unaffected -- no horizontal callback was registered.
			const line = horizontalSegment(file, "LINE");
			expect(_getSegmentStartPointLabel(null, line)).toBe("P.O.B.");
		});

		test("registering null,null,null resets every callback back to default naming", () => {
			const file = createTestFile("IFC4X3");
			registerReferentNameCallback(() => "custom", null, null);
			registerReferentNameCallback(null, null, null);

			const line = horizontalSegment(file, "LINE");
			expect(_getSegmentStartPointLabel(null, line)).toBe("P.O.B.");
		});

		test("callback state does not leak between tests (this suite's own afterEach resets it)", () => {
			const file = createTestFile("IFC4X3");
			const line = horizontalSegment(file, "LINE");
			// If a previous test's callback registration leaked, this would return
			// whatever that callback produces instead of "P.O.B.".
			expect(_getSegmentStartPointLabel(null, line)).toBe("P.O.B.");
		});
	});

	describe("validation", () => {
		test("throws TypeError when prevSegment/segment are both given but have different isA() classes", () => {
			const file = createTestFile("IFC4X3");
			const line = horizontalSegment(file, "LINE");
			const notASegment = file.createEntity("IfcAlignmentHorizontal", guid.new());

			expect(() => _getSegmentStartPointLabel(line, notASegment)).toThrow(
				new TypeError(
					"Expected entity type to be the same type, instead received IfcAlignmentSegment and IfcAlignmentHorizontal",
				),
			);
		});

		test("throws TypeError when prevSegment.DesignParameters is not a recognized alignment-parameter-segment type", () => {
			const file = createTestFile("IFC4X3");
			const malformed = file.createEntity(
				"IfcAlignmentSegment",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]) as unknown as EntityInstance,
			);
			const line = horizontalSegment(file, "LINE");

			expect(() => _getSegmentStartPointLabel(malformed, line)).toThrow(
				new TypeError(
					"Expected prev_segment.DesignParameters type to be one of ['IfcAlignmentHorizontalSegment', 'IfcAlignmentVerticalSegment', 'IfcAlignmentCantSegment'], instead received IfcCartesianPoint",
				),
			);
		});

		test("throws TypeError when segment.DesignParameters is not a recognized alignment-parameter-segment type", () => {
			const file = createTestFile("IFC4X3");
			const line = horizontalSegment(file, "LINE");
			const malformed = file.createEntity(
				"IfcAlignmentSegment",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]) as unknown as EntityInstance,
			);

			expect(() => _getSegmentStartPointLabel(line, malformed)).toThrow(
				new TypeError(
					"Expected segment.DesignParameters type to be one of ['IfcAlignmentHorizontalSegment', 'IfcAlignmentVerticalSegment', 'IfcAlignmentCantSegment'], instead received IfcCartesianPoint",
				),
			);
		});
	});
});
