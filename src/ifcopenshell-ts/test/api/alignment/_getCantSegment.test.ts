// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_get_cant_segment.py` on its own (a
// module-private helper, never directly tested by `test/api/alignment/*.py` --
// confirmed by reading the whole real test directory; its own caller,
// `_map_alignment_cant_segment`, is out of this chunk's scope). Original test
// coverage written here, gated to IFC4X3, exercising both real code paths (CT
// 4.1.4.4.1.1 "same alignment's own cant layout" and CT 4.1.4.4.1.2 "reusing
// horizontal layout via a child alignment's own cant layout") plus the disclosed
// quirks from `../../../src/api/alignment/_getCantSegment.ts`'s own header comment.

import { describe, expect, test } from "vitest";
import { _getCantSegment } from "../../../src/api/alignment/_getCantSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

function horizontalSegment(file: IfcFile, name: string): EntityInstance {
	const startPoint = file.createEntity("IfcCartesianPoint", [0, 0]);
	const designParameters = file.createEntity("IfcAlignmentHorizontalSegment", null, null, startPoint, 0, 0, 0, 100);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, name, null, null, null, null, designParameters);
}

function cantSegment(file: IfcFile, name: string): EntityInstance {
	const designParameters = file.createEntity("IfcAlignmentCantSegment", null, null, 0, 100, 0, null, 0, null);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, name, null, null, null, null, designParameters);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._getCantSegment (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignmentSegment", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(() => _getCantSegment(horizontal)).toThrow(
			new TypeError("Expected IfcAlignmentSegment but got IfcAlignmentHorizontal"),
		);
	});

	test("throws TypeError when DesignParameters is not IfcAlignmentHorizontalSegment", () => {
		const file = createTestFile("IFC4X3");
		const segment = cantSegment(file, "C1.1");

		expect(() => _getCantSegment(segment)).toThrow(
			new TypeError("Expect DesignParameter to be IfcAlignmentHorizontal but got IfcAlignmentCantSegment"),
		);
	});

	test("CT 4.1.4.4.1.1: finds the corresponding cant segment from the same alignment's own cant layout", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1", null, null, null, null, 1.5);
		// Horizontal and cant layouts are siblings in ONE `IfcRelNests`, matching real
		// alignment structure.
		nest(file, alignment, [horizontal, cant]);

		const hSeg0 = horizontalSegment(file, "H1.1");
		const hSeg1 = horizontalSegment(file, "H1.2");
		nest(file, horizontal, [hSeg0, hSeg1]);

		const cSeg0 = cantSegment(file, "C1.1");
		const cSeg1 = cantSegment(file, "C1.2");
		nest(file, cant, [cSeg0, cSeg1]);

		expect((_getCantSegment(hSeg0) as EntityInstance).equals(cSeg0)).toBe(true);
		expect((_getCantSegment(hSeg1) as EntityInstance).equals(cSeg1)).toBe(true);
	});

	test("CT 4.1.4.4.1.2: literal code path -- finds the cant layout when it's a sibling of child_alignment (child_alignment.Nests populated)", () => {
		// This constructs the fixture shape the CODE, taken completely literally,
		// actually needs (`child_alignment.Nests[0].RelatedObjects`, exactly like the
		// CT 4.1.4.4.1.1 branch's own `horizontal_layout.Nests[0]` a few lines above)
		// -- NOT the shape real Python's own `add_vertical_layout.py` actually
		// produces (see the next test, and `_getCantSegment.ts`'s own header comment,
		// quirk 5, for why those two are different).
		const file = createTestFile("IFC4X3");
		const parent = file.createEntity("IfcAlignment", guid.new(), null, "Parent");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		// No cant layout nested alongside horizontal in this rel.
		nest(file, parent, [horizontal]);

		const hSeg0 = horizontalSegment(file, "H1.1");
		nest(file, horizontal, [hSeg0]);

		const child = file.createEntity("IfcAlignment", guid.new(), null, "Child");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);

		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1", null, null, null, null, 1.5);
		// `child` and `cant` as SIBLINGS under a common (arbitrary) relating object --
		// i.e. `child.Nests[0].RelatedObjects` includes `cant`, matching the literal
		// code exactly.
		nest(file, parent, [child, cant]);

		const cSeg0 = cantSegment(file, "C1.1");
		nest(file, cant, [cSeg0]);

		expect((_getCantSegment(hSeg0) as EntityInstance).equals(cSeg0)).toBe(true);
	});

	test("CT 4.1.4.4.1.2: quirk -- crashes with a REALISTIC add_vertical_layout-shaped child alignment", () => {
		// `add_vertical_layout.py` (the one real file confirmed, by reading it
		// directly, to actually create a `child_alignment`) never nests
		// `child_alignment` itself as a `RelatedObject` anywhere -- it only
		// aggregates it (`IfcRelAggregates`) and nests things TO it
		// (`child_alignment.IsNestedBy`). Reproducing that exact, realistic shape
		// here (cant nested TO child, not alongside it) makes `child.Nests` an empty
		// array, so `_getCantSegment.ts`'s own `child_alignment.Nests[0]` access is
		// `undefined`, and `.get("RelatedObjects")` throws -- see
		// `_getCantSegment.ts`'s own header comment, quirk 5, for the full writeup of
		// this likely real, pre-existing upstream bug.
		const file = createTestFile("IFC4X3");
		const parent = file.createEntity("IfcAlignment", guid.new(), null, "Parent");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nest(file, parent, [horizontal]);

		const hSeg0 = horizontalSegment(file, "H1.1");
		nest(file, horizontal, [hSeg0]);

		const child = file.createEntity("IfcAlignment", guid.new(), null, "Child");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);

		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1", null, null, null, null, 1.5);
		// Cant is nested TO child (child.IsNestedBy), matching add_vertical_layout.py's
		// own real shape for a vertical layout -- NOT alongside child as a sibling.
		nest(file, child, [cant]);

		const cSeg0 = cantSegment(file, "C1.1");
		nest(file, cant, [cSeg0]);

		expect(() => _getCantSegment(hSeg0)).toThrow();
	});

	test("quirk: an unguarded IsDecomposedBy[0] crashes when no cant layout exists anywhere and the alignment has no child alignments", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nest(file, alignment, [horizontal]);

		const hSeg0 = horizontalSegment(file, "H1.1");
		nest(file, horizontal, [hSeg0]);

		// Real Python would raise `IndexError` reading `alignment.IsDecomposedBy[0]`
		// on an alignment with no `IfcRelAggregates` decomposing it at all -- see this
		// file's own header comment / `_getCantSegment.ts`'s own quirk 1 disclosure.
		expect(() => _getCantSegment(hSeg0)).toThrow();
	});
});
