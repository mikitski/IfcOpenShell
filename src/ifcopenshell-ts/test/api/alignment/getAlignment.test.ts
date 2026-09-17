// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_get_alignment.py` (src/ifcopenshell-python).
// Real Python's own fixture builds each alignment via
// `ifcopenshell.api.alignment.create(file, "A1", include_vertical[i], include_cant[i])`
// -- not in this chunk's scope (a much larger, later chunk) -- so this port builds an
// equivalent alignment/horizontal/vertical/cant nesting shape directly via
// `file.createEntity`/`IfcRelNests`, then ports the real test's own assertions
// verbatim: for each of the 3 real `include_vertical`/`include_cant` combinations,
// `get_alignment(get_horizontal_layout(alignment)) == alignment`, and the same for
// `get_vertical_layout`/`get_cant_layout` whenever that layout is present. Gated to
// IFC4X3 (`describe.skipIf`, matching real Python's own `IFC4X3_AVAILABLE` guard).

import { describe, expect, test } from "vitest";
import { getAlignment } from "../../../src/api/alignment/getAlignment";
import { getCantLayout } from "../../../src/api/alignment/getCantLayout";
import { getHorizontalLayout } from "../../../src/api/alignment/getHorizontalLayout";
import { getVerticalLayout } from "../../../src/api/alignment/getVerticalLayout";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Builds a minimal `IfcAlignment` with the requested layouts nested to it, mirroring
 * the shape real Python's own (unported, later-chunk) `alignment.create` produces. */
function buildAlignment(file: IfcFile, includeVertical: boolean, includeCant: boolean): EntityInstance {
	const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
	const layouts: EntityInstance[] = [file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1")];
	if (includeVertical) layouts.push(file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1"));
	if (includeCant)
		layouts.push(file.createEntity("IfcAlignmentCant", guid.new(), null, "C1", null, null, null, null, 0));
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, layouts);
	return alignment;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getAlignment (IFC4X3)", () => {
	test.each([
		[false, false],
		[true, false],
		[true, true],
	])("include_vertical=%s, include_cant=%s", (includeVertical, includeCant) => {
		const file = createTestFile("IFC4X3");
		const alignment = buildAlignment(file, includeVertical, includeCant);
		expect(alignment).not.toBeNull();

		const horizontal = getHorizontalLayout(alignment) as EntityInstance;
		const vertical = getVerticalLayout(alignment);
		const cant = getCantLayout(alignment);

		expect(getAlignment(horizontal)?.equals(alignment)).toBe(true);
		if (includeVertical) {
			expect(getAlignment(vertical as EntityInstance)?.equals(alignment)).toBe(true);
		}
		if (includeCant) {
			expect(getAlignment(cant as EntityInstance)?.equals(alignment)).toBe(true);
		}
	});

	test("returns null for a layout not nested to anything", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(getAlignment(horizontal)).toBeNull();
	});
});
