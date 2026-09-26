// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk"): original, hand-rolled coverage for `ruleExecutor.ts`'s own 3-phase
// (file/type/entity) dispatch engine and `ruleDispatch.ts`'s own registry, matching this
// project's established convention for engine-layer code with no dedicated real Python
// test of its own (real Python's `rule_executor.run` is only ever exercised indirectly,
// through the full fixture-based `test/test_rules.py`, itself explicitly out of scope
// for this chunk -- see this chunk's own task brief). Every test below is built with
// SYNTHETIC rules registered directly via `registerSchemaRules`/`_clearSchemaRuleRegistryForTests`
// -- deliberately NOT `express/whereRules/ifc2x3.ts`'s own real 70 rules (tested
// separately, `test/express/whereRules/ifc2x3.test.ts`) -- so this file can construct
// minimal, deliberately-adversarial fixtures without any real rule's own logic
// interfering with what's being tested here.
//
// **Import hygiene, load-bearing for test isolation**: this file imports `ruleExecutor.
// ts`/`ruleDispatch.ts` DIRECTLY (never `../../src/express` or `../../src/index`, both
// of which side-effect-import `express/whereRules` and would register the real 70
// IFC2X3 rules into the very same schema identifier these tests use) -- confirmed this
// keeps the two test files independent: `vitest.config.ts`'s own `pool: "forks"` runs
// each test FILE in its own process-level module registry, so this file's own
// `_clearSchemaRuleRegistryForTests()` calls can never affect (or be affected by)
// `whereRules/ifc2x3.test.ts`'s own real-rule registrations, even if both happened to
// run concurrently.

import { beforeEach, describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import {
	type RuleDefinition,
	_clearSchemaRuleRegistryForTests,
	registerSchemaRules,
} from "../../src/express/ruleDispatch";
import { executeRules } from "../../src/express/ruleExecutor";
import type { IfcFile } from "../../src/file";
import { settings } from "../../src/settings";
import * as template from "../../src/template";
import { directSubtypesOfTypeDeclarations } from "../../src/util/schema";

const SCHEMA = "IFC2X3";

beforeEach(() => {
	_clearSchemaRuleRegistryForTests();
});

/**
 * `test/bootstrap.ts`'s own `createTestFile` uses `template.create`'s DEFAULT,
 * non-`blank` template -- which bakes in a starter `IfcProject`/unit-assignment/
 * geometric-context/owner-history chain (see `template.ts`'s own header comment) --
 * genuinely present entities this file's own precise per-call-count assertions would
 * otherwise have to account for (confirmed empirically: several of that boilerplate's
 * own numeric attributes, e.g. unit conversion factors/precision, are themselves
 * `IfcLengthMeasure`-typed 0.0 values that a naive `createTestFile` would silently add
 * to every type-scope test's own observed values). `blank: true` gives a genuinely
 * entity-free file (just a HEADER section) so every count below reflects ONLY the
 * entities each test itself constructs.
 */
function blankFile(): IfcFile {
	return template.create({ schemaIdentifier: SCHEMA, blank: true });
}

function fileRule(ruleName: string, check: (f: IfcFile) => void): RuleDefinition {
	return { scope: "file", typeName: undefined, ruleName, check };
}

function entityRule(typeName: string, ruleName: string, check: (self: EntityInstance) => void): RuleDefinition {
	return { scope: "entity", typeName, ruleName, check };
}

function typeRule(typeName: string, ruleName: string, check: (self: unknown) => void): RuleDefinition {
	return { scope: "type", typeName, ruleName, check };
}

describe("executeRules -- file-scope dispatch", () => {
	test("runs a file-scope rule exactly once, called with the IfcFile itself", () => {
		const file = blankFile();
		file.createEntity("IfcWall");
		file.createEntity("IfcWall");

		let calls = 0;
		let receivedFile: unknown;
		registerSchemaRules(SCHEMA, [
			fileRule("WR1", (f) => {
				calls++;
				receivedFile = f;
			}),
		]);

		const violations = executeRules(file);
		expect(calls).toBe(1);
		expect(receivedFile).toBe(file);
		expect(violations).toEqual([]);
	});

	test("a thrown Error becomes exactly one returned violation", () => {
		const file = blankFile();
		registerSchemaRules(SCHEMA, [
			fileRule("WR1", () => {
				throw new Error("file rule violated");
			}),
		]);

		const violations = executeRules(file);
		expect(violations).toHaveLength(1);
		expect(violations[0].message).toContain("file rule violated");
	});

	test("a RangeError (this port's RecursionError analog) is silently skipped, not reported", () => {
		const file = blankFile();
		registerSchemaRules(SCHEMA, [
			fileRule("WR1", () => {
				throw new RangeError("Maximum call stack size exceeded");
			}),
		]);

		expect(executeRules(file)).toEqual([]);
	});
});

describe("executeRules -- entity-scope dispatch", () => {
	test("runs once per matching instance, never for non-matching instances", () => {
		const file = blankFile();
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		file.createEntity("IfcBeam");

		const seen: EntityInstance[] = [];
		registerSchemaRules(SCHEMA, [
			entityRule("IfcWall", "WR1", (self) => {
				seen.push(self);
			}),
		]);

		executeRules(file);
		expect(seen).toHaveLength(2);
		expect(seen.map((i) => i.id()).sort()).toEqual([wall1.id(), wall2.id()].sort());
	});

	test("one rule's own failure does not stop another rule from running (per-rule isolation)", () => {
		const file = blankFile();
		file.createEntity("IfcWall");

		let secondRuleRan = false;
		registerSchemaRules(SCHEMA, [
			entityRule("IfcWall", "WR1", () => {
				throw new Error("first rule always fails");
			}),
			entityRule("IfcWall", "WR2", () => {
				secondRuleRan = true;
			}),
		]);

		const violations = executeRules(file);
		expect(secondRuleRan).toBe(true);
		expect(violations).toHaveLength(1);
	});

	test("one instance's own violation does not stop the rule from running against the next instance", () => {
		const file = blankFile();
		file.createEntity("IfcWall");
		file.createEntity("IfcWall");

		let calls = 0;
		registerSchemaRules(SCHEMA, [
			entityRule("IfcWall", "WR1", () => {
				calls++;
				throw new Error("always violated");
			}),
		]);

		const violations = executeRules(file);
		expect(calls).toBe(2);
		expect(violations).toHaveLength(2);
	});
});

describe("executeRules -- type-scope dispatch", () => {
	test("fires for a plain (non-aggregate) attribute value of the exact declared type", () => {
		// `IfcVector.Magnitude` is declared `IfcLengthMeasure` (real EXPRESS schema) --
		// a direct, non-subtype, non-aggregate match.
		const file = blankFile();
		const direction = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
		file.createEntity("IfcVector", direction, 5.0);

		const seenValues: unknown[] = [];
		registerSchemaRules(SCHEMA, [
			typeRule("IfcLengthMeasure", "WR1", (self) => {
				seenValues.push(self);
			}),
		]);

		executeRules(file);
		expect(seenValues).toContain(5.0);
	});

	test("fires once per element for a value nested inside an aggregate attribute (LIST OF IfcLengthMeasure)", () => {
		// `IfcCartesianPoint.Coordinates` is `LIST [1:3] OF IfcLengthMeasure` -- a
		// genuinely nested-in-an-aggregate case.
		const file = blankFile();
		file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);

		const seenValues: unknown[] = [];
		registerSchemaRules(SCHEMA, [
			typeRule("IfcLengthMeasure", "WR1", (self) => {
				seenValues.push(self);
			}),
		]);

		executeRules(file);
		expect(seenValues.sort()).toEqual([1.0, 2.0, 3.0]);
	});

	test("a rule registered for a supertype type_declaration also fires for a subtype's own value (subtype-chain case)", () => {
		// Discover a real subtype pair directly from the schema, rather than assuming
		// one -- `IfcPositiveLengthMeasure`/`IfcNonNegativeLengthMeasure` are both real
		// `TYPE ... = IfcLengthMeasure;` subtypes in the real IFC2X3 EXPRESS schema, but
		// this test verifies that against the actual schema instead of hardcoding the
		// assumption.
		const file = blankFile();
		const schema = file.nativeFile.schema();
		const subtypes = directSubtypesOfTypeDeclarations(schema);
		expect(subtypes.get("IfcLengthMeasure")).toContain("IfcPositiveLengthMeasure");

		// `IfcCShapeProfileDef.Depth` is declared `IfcPositiveLengthMeasure`.
		const profile = file.createEntity("IfcCShapeProfileDef");
		(profile as unknown as { Depth: number }).Depth = 42;

		const seenValues: unknown[] = [];
		registerSchemaRules(SCHEMA, [
			typeRule("IfcLengthMeasure", "WR1", (self) => {
				seenValues.push(self);
			}),
		]);

		executeRules(file);
		expect(seenValues).toContain(42);
	});

	test("a type-scope violation is collected without stopping the per-instance walk", () => {
		const file = blankFile();
		file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);

		let calls = 0;
		registerSchemaRules(SCHEMA, [
			typeRule("IfcLengthMeasure", "WR1", () => {
				calls++;
				throw new Error("always violated");
			}),
		]);

		const violations = executeRules(file);
		expect(calls).toBe(3);
		expect(violations).toHaveLength(3);
	});

	test("never invoked for a null/unset attribute value (mirrors Python's own `if value is None: return`)", () => {
		const file = blankFile();
		// `IfcAxis1Placement.Axis` is optional (`IfcDirection`, not `IfcLengthMeasure`,
		// but demonstrates the general null-guard using an attribute genuinely left unset).
		const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
		file.createEntity("IfcAxis1Placement", location, null);

		let calls = 0;
		registerSchemaRules(SCHEMA, [
			typeRule("IfcDirection", "WR1", () => {
				calls++;
			}),
		]);

		executeRules(file);
		expect(calls).toBe(0);
	});
});

describe("executeRules -- global settings", () => {
	test("toggles unpackNonAggregateInverses/compareInstancesByValue on, and restores the prior values after (even with zero rules registered)", () => {
		const file = blankFile();
		settings.unpackNonAggregateInverses = false;
		settings.compareInstancesByValue = false;

		let observedDuring: { unpack: boolean; compare: boolean } | undefined;
		registerSchemaRules(SCHEMA, [
			fileRule("WR1", () => {
				observedDuring = {
					unpack: settings.unpackNonAggregateInverses,
					compare: settings.compareInstancesByValue,
				};
			}),
		]);

		executeRules(file);
		expect(observedDuring).toEqual({ unpack: true, compare: true });
		expect(settings.unpackNonAggregateInverses).toBe(false);
		expect(settings.compareInstancesByValue).toBe(false);
	});

	test("restores the prior settings even when a rule throws", () => {
		const file = blankFile();
		settings.unpackNonAggregateInverses = false;
		settings.compareInstancesByValue = false;
		registerSchemaRules(SCHEMA, [
			fileRule("WR1", () => {
				throw new Error("boom");
			}),
		]);

		executeRules(file);
		expect(settings.unpackNonAggregateInverses).toBe(false);
		expect(settings.compareInstancesByValue).toBe(false);
	});
});

describe("executeRules -- no rules registered for a schema", () => {
	test("returns an empty violation list, never throws", () => {
		const file = blankFile();
		file.createEntity("IfcWall");
		expect(executeRules(file)).toEqual([]);
	});
});
