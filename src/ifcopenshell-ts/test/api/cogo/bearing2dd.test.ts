// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/cogo/test_bearing2dd.py` (src/ifcopenshell-python) --
// the one real Python test method's every assertion ported directly, verbatim (all
// success cases and all `ValueError` cases). No schema gating needed -- `bearing2dd`
// is pure string/number math with no `ifcopenshell.file`/entity dependency at all
// (confirmed by reading the real source completely -- see `bearing2dd.ts`'s own
// header comment), so this suite is NOT wrapped in `describe.each`/`AVAILABLE_SCHEMAS`
// like this module's other 3 test files, matching the real Python test file's own
// lack of any `IFC4X3_AVAILABLE`/`ifcopenshell.file` dependency.

import { describe, expect, test } from "vitest";
import { bearing2dd } from "../../../src/api/cogo/bearing2dd";

describe("api.cogo.bearing2dd", () => {
	test("bearing2dd", () => {
		expect(bearing2dd("N 45 15 22.5 E")).toBeCloseTo(44.743888875, 9);
		expect(bearing2dd("N 45 15 22.5 W")).toBeCloseTo(135.256111125, 9);
		expect(bearing2dd("S 45 15 22.5 W")).toBeCloseTo(224.743888875, 9);
		expect(bearing2dd("S 45 15 22.5 E")).toBeCloseTo(315.256111125, 9);

		expect(bearing2dd("n 45 15 22.5 e")).toBeCloseTo(44.743888875, 9);
		expect(bearing2dd("n 45 15 22.5 w")).toBeCloseTo(135.256111125, 9);
		expect(bearing2dd("s 45 15 22.5 w")).toBeCloseTo(224.743888875, 9);
		expect(bearing2dd("s 45 15 22.5 e")).toBeCloseTo(315.256111125, 9);

		expect(bearing2dd("N 90 E")).toBeCloseTo(0.0, 9);
		expect(bearing2dd("S 90 E")).toBeCloseTo(0.0, 9);

		expect(bearing2dd("N 90 W")).toBeCloseTo(180.0, 9);
		expect(bearing2dd("S 90 W")).toBeCloseTo(180.0, 9);

		expect(bearing2dd("N 30 W")).toBeCloseTo(120.0, 9);
		expect(bearing2dd("N 30 10 W")).toBeCloseTo(120.16666666666667, 9);

		// Python's literal `89.999722222222228` isn't representable as an IEEE-754
		// double either (`biome`'s `noPrecisionLoss` lint flags the equivalent JS
		// literal for the same reason) -- both round to the same nearest double,
		// `89.99972222222223`, used here verbatim; `toBeCloseTo`'s own tolerance makes
		// this a non-issue either way.
		expect(bearing2dd("N 00 00 1 E")).toBeCloseTo(89.99972222222223, 9);
		expect(bearing2dd("N 0 0 1 E")).toBeCloseTo(89.99972222222222, 9);
		expect(bearing2dd("N 00 00 1.0 E")).toBeCloseTo(89.99972222222222, 9);

		expect(() => bearing2dd("Bad String")).toThrow("Invalid bearing string");
		expect(() => bearing2dd("Very Bad String")).toThrow("Invalid bearing string");
		expect(() => bearing2dd("N 100 15 22.5 E")).toThrow("Invalid bearing string");
		expect(() => bearing2dd("N -45 15 22.5 E")).toThrow("Invalid bearing string");
		expect(() => bearing2dd("N 45 -15 22.5 E")).toThrow("Invalid bearing string");
		expect(() => bearing2dd("N 45 88 22.5 E")).toThrow("Invalid bearing string");
		expect(() => bearing2dd("N 45 15 -22.5 E")).toThrow("Invalid bearing string");
		expect(() => bearing2dd("N 45 15 99.5 E")).toThrow("Invalid bearing string");
	});
});
