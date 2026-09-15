// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `add_style.py` (no `test_add_style.py` counterpart --
// confirmed by directory listing of `src/ifcopenshell-python/test/api/style/`). Tests
// below are new, exercising real Python's own documented behavior (docstring/source)
// directly: the default `IfcSurfaceStyle` class, the unconditional `Side = "BOTH"`
// force (see `../../../src/api/style/addStyle.ts`'s own header comment), the `name`
// pass-through, and each of the other 3 style classes.

import { describe, expect, test } from "vitest";
import { addStyle } from "../../../src/api/style/addStyle";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.style.addStyle (%s)", (schema) => {
	test("adding a default surface style", () => {
		const file = createTestFile(schema);

		const style = addStyle(file, {});

		expect(style.isA()).toBe("IfcSurfaceStyle");
		expect(style.get("Name")).toBeNull();
		expect(style.get("Side")).toBe("BOTH");
	});

	test("adding a named surface style", () => {
		const file = createTestFile(schema);

		const style = addStyle(file, { name: "Grey Paint" });

		expect(style.get("Name")).toBe("Grey Paint");
		expect(style.get("Side")).toBe("BOTH");
	});

	test.each(["IfcCurveStyle", "IfcFillAreaStyle", "IfcTextStyle"])("adding a %s", (ifcClass) => {
		const file = createTestFile(schema);

		const style = addStyle(file, { ifcClass });

		expect(style.isA()).toBe(ifcClass);
		expect(style.get("Name")).toBeNull();
	});
});
