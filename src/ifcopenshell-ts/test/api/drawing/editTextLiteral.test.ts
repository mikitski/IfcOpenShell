// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/drawing/test_edit_text_literal.py` (src/ifcopenshell-
// python) -- `TestEditTextLiteral.test_run` ported verbatim, run against both IFC4 and
// IFC2X3 matching the real `TestEditTextLiteralIFC2X3` mixin.

import { describe, expect, test } from "vitest";
import { editTextLiteral } from "../../../src/api/drawing/editTextLiteral";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.drawing.editTextLiteral (%s)", (schema) => {
	test("run", () => {
		const file = createTestFile(schema);
		const text = file.createEntity("IfcTextLiteralWithExtent");

		editTextLiteral(file, {
			textLiteral: text,
			attributes: {
				Literal: "Literal",
				Path: "RIGHT",
				BoxAlignment: "middle",
			},
		});

		expect(text.get("Literal")).toBe("Literal");
		expect(text.get("Path")).toBe("RIGHT");
		expect(text.get("BoxAlignment")).toBe("middle");
	});
});
