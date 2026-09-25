// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-5 (planning/ifcopenshell-ts/70-express-rules-plan.md, "final integration +
// test-fidelity backfill"): the real, fixture-based `test/test_rules.py` equivalent
// (src/ifcopenshell-python, 53 lines) -- a simple, fully data-driven parametrized test:
// glob every `.ifc` file in `test/fixtures/rules/` (all 138 real fixtures -- 112 IFC2X3,
// 18 IFC4, 8 IFC4X3_ADD2 -- confirmed byte-identical to upstream during this phase's own
// scoping), parse the expected violation count from its filename (`pass-*` -> 0,
// `fail-*` -> 1, `fail-expected-N-*` -> N, per real `test/fixture_generate.py`'s own
// `parse_result` -- read directly, not assumed), run the WHERE-rule engine, assert the
// count.
//
// **Design decision: drives `express/ruleExecutor.ts`'s `executeRules()` directly, not
// the new unified `validate(f, { rules: true })`.** Real `test_rules.py` itself calls
// `ifcopenshell.express.rule_executor.run(file, logger)` directly (not through
// `ifcopenshell.validate.validate`), so this is the more faithful mirror of that
// specific real test file -- and it isolates the WHERE-rule engine from `validate.ts`'s
// own base checks, so a base-check false positive/negative on one of these
// rule-focused fixtures (unlikely, but not something this file wants to have to
// disentangle) can't distort a count this suite is asserting purely about
// `executeRules()`. The new unification itself (`validate(f, { rules: true })` ==
// `validate(f)` + `executeRules(f)`) is exercised separately below, in its own small,
// targeted `describe` block, against a handful of these same real fixtures.
//
// Deliberately a separate file from `validate.orchestrator.test.ts` (which mirrors
// `test_validate.py`), matching how real Python itself keeps `test_rules.py`/
// `test_validate.py` as two separate top-level files in `test/`, not one merged suite --
// and named/placed the same way (`test/rules.orchestrator.test.ts`, alongside
// `test/validate.orchestrator.test.ts`, not nested under `test/express/`).
//
// *** Three real bugs found and fixed in this same PR, each discovered by this file's
// own empirical 138-fixture run (initially: 135/138 matched, 3 real mismatches) and
// each traced to its exact root cause via a byte-for-byte trace against real Python's
// own `indeterminate_type`/`express_getitem`/the generated rules module's own shadowed
// `range()` (confirmed by running real Python's own installed `ifcopenshell` package
// end to end against the 3 offending fixtures, not just reading source) before being
// fixed -- not silently pinned as "known divergences" the way `validate.orchestrator.
// test.ts`'s own 13 fixtures were: ***
//
// 1. `src/express/runtimeShim.ts`'s `expressGetItem` was missing the
//    `aggr === INDETERMINATE -> return INDETERMINATE` propagation guard that its own
//    sibling `expressGetAttr` already had -- it instead fell through to
//    `toIndexableSequence`, which threw `TypeError: value is not a sequence/aggregate:
//    Symbol(EXPRESS_INDETERMINATE)`. Fixed by adding the same guard (see that
//    function's own doc comment for the full writeup).
// 2. `src/express/rules/{ifc2x3,ifc4,ifc4x3}.ts`'s `ifcDotProduct` (all three
//    byte-identical copies) used raw `+=`/`*` arithmetic on values that can be
//    `INDETERMINATE`, throwing `TypeError: Cannot convert a Symbol value to a number`
//    instead of real Python's own silent poison-propagation-to-`INDETERMINATE`. Fixed
//    with an explicit `isIndeterminate` guard inside the summation loop (see that
//    function's own doc comment).
// 3. `src/express/whereRules/{ifc4,ifc4x3}.ts`'s `ifcConsecutiveSegments` (both
//    byte-identical copies) computed `hiIndex(segments) - 1 + 1` via raw arithmetic
//    before ever reaching `expressRange`, throwing the same Symbol-arithmetic
//    `TypeError` when `segments` is `INDETERMINATE`. Real Python's own generated rules
//    module shadows the builtin `range()` with one that treats any `INDETERMINATE`
//    bound as an immediately-empty range -- confirmed directly against real Python's
//    own `rule_compiler.py`-emitted `range` override, not assumed. Fixed with an
//    explicit early-return guard reproducing that same "empty range, loop body never
//    runs" outcome (see that function's own doc comment).
//
// Found via `fail-extrusion-dir-0.0-0.0-ifc4.ifc`, `pass-extrusion-dir-0.0-0.0-ifc2x3.ifc`,
// and `pass-poly-curve-no-segments-ifc4.ifc` respectively. All 138 fixtures pass with
// their real, correct expected count after these 3 fixes -- KNOWN_DIVERGENT_FIXTURES
// below is empty, unlike `validate.orchestrator.test.ts`'s own 13-entry list, but kept
// as a named, exported convention (not just deleted) so a future regression or a new
// vendored fixture that genuinely can't be reproduced has an established, precedented
// place to be pinned with a clear comment, matching this project's "never silently
// adjust an expected count" discipline.

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { executeRules } from "../src/express/ruleExecutor";
import "../src/express/whereRules";
import { open } from "../src/open";
import { validate } from "../src/validate";
import { AVAILABLE_SCHEMAS, type Schema } from "./bootstrap";

const FIXTURES_DIR = path.join(__dirname, "fixtures", "rules");

// Same schema-identifier-from-`FILE_SCHEMA`-line approach as
// `validate.orchestrator.test.ts` (this file's own sibling, not imported from there --
// each fixture-suite file is kept self-contained, matching how the two real Python test
// files it mirrors are also independent of each other): most of these 138 fixtures'
// filenames DO already carry a schema hint (`-ifc2x3`/`-IFC4`/`-ifc4x3` suffixes), but
// not reliably enough to trust over actually reading each fixture's own `FILE_SCHEMA`
// line, and this repo's CI doesn't always register all 3 schemas (`bootstrap.ts`'s own
// `AVAILABLE_SCHEMAS` gap-disclosure comment).
const REGISTERED_IDENTIFIER_TO_SCHEMA: Record<string, Schema> = {
	IFC2X3: "IFC2X3",
	IFC4: "IFC4",
	IFC4X3_ADD2: "IFC4X3",
};

function requiredSchemaFor(fixturePath: string): Schema {
	const content = fs.readFileSync(fixturePath, "utf8");
	const match = content.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/);
	if (!match) {
		throw new Error(`Could not find FILE_SCHEMA in fixture: ${fixturePath}`);
	}
	const identifier = match[1];
	const schema = REGISTERED_IDENTIFIER_TO_SCHEMA[identifier];
	if (!schema) {
		throw new Error(`Unrecognized FILE_SCHEMA identifier '${identifier}' in fixture: ${fixturePath}`);
	}
	return schema;
}

/** Python: `fixture_generate.py`'s own `parse_result` (real source lines 35-44). */
function expectedViolationCount(filename: string): number {
	if (filename.startsWith("fail-")) {
		const match = filename.match(/^fail-expected-(\d+)/);
		return match ? Number(match[1]) : 1;
	}
	if (filename.startsWith("pass-")) {
		return 0;
	}
	throw new Error(`Fixture filename must start with 'fail-' or 'pass-': ${filename}`);
}

/**
 * See this file's own header comment -- every one of the 3 real, initially-found
 * mismatches was traced to an actual porting bug and fixed in this same PR, not pinned
 * here. Kept as an established, precedented (see `validate.orchestrator.test.ts`)
 * empty escape hatch for any future genuinely-unreproducible fixture, not deleted.
 */
const KNOWN_DIVERGENT_FIXTURES = new Set<string>([]);

const allFixtureFiles = fs
	.readdirSync(FIXTURES_DIR)
	.filter((name) => name.endsWith(".ifc"))
	.sort();

// Sanity check on this file's own bookkeeping, not on `executeRules()` itself.
describe("executeRules() fixture suite bookkeeping", () => {
	test("every KNOWN_DIVERGENT_FIXTURES entry names a real, still-vendored fixture", () => {
		const real = new Set(allFixtureFiles);
		for (const name of KNOWN_DIVERGENT_FIXTURES) {
			expect(real.has(name)).toBe(true);
		}
	});

	test("all 138 real, upstream-vendored fixtures are present (112 IFC2X3, 18 IFC4, 8 IFC4X3_ADD2)", () => {
		expect(allFixtureFiles).toHaveLength(138);
	});
});

describe("executeRules() -- real fixture suite (test_rules.py equivalent)", () => {
	const cleanFixtures = allFixtureFiles.filter((name) => !KNOWN_DIVERGENT_FIXTURES.has(name));

	for (const filename of cleanFixtures) {
		const fixturePath = path.join(FIXTURES_DIR, filename);
		const requiredSchema = requiredSchemaFor(fixturePath);
		test.skipIf(!AVAILABLE_SCHEMAS.includes(requiredSchema))(filename, () => {
			const expected = expectedViolationCount(filename);
			const file = open(fixturePath);
			const violations = executeRules(file);
			expect(violations.length).toBe(expected);
		});
	}
});

// Phase EX-5's own unification: `validate(f, { rules: true })` must fold `executeRules`'s
// own violations into the same returned array `validate(f)` alone already produces, with
// no double-counting or dropped violations either direction. Exercised against a handful
// of real fixtures above (rather than only synthetic ones) so this is checked against
// the same real EXPRESS WHERE-rule violations the rest of this file already verifies
// `executeRules()` reports correctly -- each of the 3 fixtures below was independently
// confirmed (via a throwaway probe against the real built addon, not assumed) to produce
// zero base-`validate()` violations of its own and exactly 1 `executeRules()` violation,
// so `combined.length` cleanly isolates the unification logic itself from any base-check
// interaction.
describe("validate(f, { rules: true }) -- Phase EX-5 unification", () => {
	const exemplars = [
		"fail-extrusion-dir-0.0-0.0-ifc4.ifc",
		"fail-axis2-anti-parallel-axes.ifc",
		"fail-2-projects-ifc2x3.ifc",
	] as const;

	for (const filename of exemplars) {
		const fixturePath = path.join(FIXTURES_DIR, filename);
		const requiredSchema = requiredSchemaFor(fixturePath);

		test.skipIf(!AVAILABLE_SCHEMAS.includes(requiredSchema))(
			`${filename}: validate(f, { rules: true }) === validate(f) concat executeRules(f)`,
			() => {
				const base = validate(open(fixturePath));
				const rules = executeRules(open(fixturePath));
				const combined = validate(open(fixturePath), { rules: true });

				expect(base).toHaveLength(0);
				expect(rules).toHaveLength(1);
				expect(combined).toHaveLength(base.length + rules.length);
			},
		);
	}

	{
		const fixturePath = path.join(FIXTURES_DIR, "fail-extrusion-dir-0.0-0.0-ifc4.ifc");
		const requiredSchema = requiredSchemaFor(fixturePath);
		test.skipIf(!AVAILABLE_SCHEMAS.includes(requiredSchema))(
			"options.rules omitted (or false) never runs executeRules() -- matches real Python's own express_rules=False default",
			() => {
				expect(validate(open(fixturePath))).toHaveLength(0);
				expect(validate(open(fixturePath), {})).toHaveLength(0);
				expect(validate(open(fixturePath), { rules: false })).toHaveLength(0);
			},
		);
	}
});
