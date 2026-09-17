// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_vertical_layout.py` -- see
// `./getHorizontalLayout.test.ts`'s own header comment (identical rationale/fixture
// pattern, different target class).

import { describe, expect, test } from "vitest";
import { getVerticalLayout } from "../../../src/api/alignment/getVerticalLayout";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getVerticalLayout (IFC4X3)", () => {
	test("returns the nested IfcAlignmentVertical", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		nest(file, alignment, [horizontal, vertical]);

		expect(getVerticalLayout(alignment)?.equals(vertical)).toBe(true);
	});

	test("returns null when no IfcAlignmentVertical is nested", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nest(file, alignment, [horizontal]);

		expect(getVerticalLayout(alignment)).toBeNull();
	});
});
