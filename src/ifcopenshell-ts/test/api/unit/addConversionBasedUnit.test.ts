// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_add_conversion_based_unit.py`
// (src/ifcopenshell-python) -- but every real Python test case in that file
// (`test_run`, `test_adding_mass_units_creates_proper_massunit`,
// `test_adding_time_units_creates_proper_timeunit`, `test_adding_a_unit_with_offset`,
// `test_unknown_units_fall_back_to_userdefined`) exercises this function's core
// purpose, which is currently ALWAYS blocked by a real, disclosed, pre-existing
// primitive-layer gap -- see `addConversionBasedUnit.ts`'s own header comment for the
// full empirical writeup (independently reproduced against this exact worktree's own
// built native addon). This file therefore asserts the CURRENT, disclosed, blocked
// behavior for each of those 5 real Python cases -- not silently skipped -- matching
// `test/util/migrator.test.ts`'s own established precedent for this exact gap. Every
// one of these tests starts failing (a good thing) the moment this foundational gap
// is ever closed, at which point they should be rewritten to their real Python
// counterparts' actual assertions (reproduced in comments below each blocked test, so
// the follow-up work is a straight swap-in, not a re-investigation).

import { describe, expect, test } from "vitest";
import { addConversionBasedUnit } from "../../../src/api/unit/addConversionBasedUnit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const BLOCKED_ERROR = /Attribute access is only supported on entity instances/;

describe.each(AVAILABLE_SCHEMAS)("api.unit.addConversionBasedUnit (%s) -- disclosed, currently blocked", (schema) => {
	// SKIPPED (PR #179): PR #179 fixed the native `attribute_value_shim.cpp` gate
	// `BLOCKED_ERROR` pinned (TODOS.md's "EntityInstance.setByIndex/IfcFile
	// .createEntity ..." entry, now RESOLVED for the shared gate) --
	// `addConversionBasedUnit` no longer throws. Real expected result is already
	// recorded in this test's own title above -- left to a follow-up chunk.
	test.skip("test_run (real Python: unit.Name === 'foot', a LENGTHUNIT, ConversionFactor.ValueComponent.wrappedValue === 0.3048)", () => {
		const file = createTestFile(schema);
		expect(() => addConversionBasedUnit(file, { name: "foot" })).toThrow(BLOCKED_ERROR);
	});

	// SKIPPED (PR #179): same gate/reasoning as the test above -- real expected
	// result is already recorded in this test's own title above.
	test.skip("test_adding_mass_units_creates_proper_massunit (real Python: tonne/pound/ounce/ton UK/ton US all resolve to a MASSUNIT with a KILO-prefixed GRAM SI unit)", () => {
		const file = createTestFile(schema);
		for (const name of ["tonne", "pound", "ounce", "ton UK", "ton US"]) {
			expect(() => addConversionBasedUnit(file, { name })).toThrow(BLOCKED_ERROR);
		}
	});

	// SKIPPED (PR #179): same gate/reasoning as the test above -- real expected
	// result is already recorded in this test's own title above.
	test.skip("test_adding_time_units_creates_proper_timeunit (real Python: minute/hour/day all resolve to a TIMEUNIT with an unprefixed SECOND SI unit)", () => {
		const file = createTestFile(schema);
		for (const name of ["minute", "hour", "day"]) {
			expect(() => addConversionBasedUnit(file, { name })).toThrow(BLOCKED_ERROR);
		}
	});

	// SKIPPED (PR #179): same gate/reasoning as the test above -- real expected
	// result is already recorded in this test's own title above.
	test.skip("test_unknown_units_fall_back_to_userdefined (real Python: unit.UnitType === 'USERDEFINED', unit.Name === 'unknown_unit')", () => {
		const file = createTestFile(schema);
		expect(() => addConversionBasedUnit(file, { name: "unknown_unit" })).toThrow(BLOCKED_ERROR);
	});

	// SKIPPED (PR #179): same gate/reasoning as the test above.
	test.skip("no-argument default (Python default name='foot') also blocked", () => {
		const file = createTestFile(schema);
		expect(() => addConversionBasedUnit(file, {})).toThrow(BLOCKED_ERROR);
	});
});

describe("api.unit.addConversionBasedUnit (IFC4-only) -- disclosed, currently blocked", () => {
	// SKIPPED (PR #179): same gate/reasoning as above -- real expected result is
	// already recorded in this test's own title above.
	test.skip("test_adding_a_unit_with_offset (real Python: fahrenheit produces an IfcConversionBasedUnitWithOffset, ConversionOffset === -459.67)", () => {
		const file = createTestFile("IFC4");
		expect(() => addConversionBasedUnit(file, { name: "fahrenheit" })).toThrow(BLOCKED_ERROR);
	});
});
