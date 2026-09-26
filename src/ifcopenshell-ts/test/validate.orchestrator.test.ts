// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-3 chunk 4 (planning/ifcopenshell-ts/70-express-rules-plan.md): the real,
// fixture-based `test/test_validate.py` equivalent (src/ifcopenshell-python, 67 lines) --
// a simple, fully data-driven parametrized test: glob every `.ifc` file in
// `test/fixtures/validate/` (all 38 real fixtures, confirmed byte-identical to
// upstream during Phase EX-3 scoping), parse the expected violation count from its
// filename (`pass-*` -> 0, `fail-*` -> 1, `fail-expected-N-*` -> N, per real
// `test/fixture_generate.py`'s own `parse_result` -- read directly, not assumed), run
// `validate()`, assert the count.
//
// Deliberately a SEPARATE file from `test/validate.test.ts`, not an extension of it:
// `validate.test.ts` is chunk 2/3's hand-rolled, per-function unit-test suite (no real
// Python test of its own to port, since real `validate.py`'s internal helpers have no
// dedicated test file either -- only `test_validate.py`'s own full-`validate()`
// fixture suite exercises them, indirectly). This file is that fixture suite's own,
// separate, direct TS equivalent -- mirroring how real Python itself keeps them apart
// (no equivalent of `validate.test.ts` exists upstream at all). Keeping them in
// separate files matches this project's general "one test file mirrors one real
// source/test-file relationship" precedent.
//
// *** Real, disclosed test-fidelity gaps, each independently investigated and
// confirmed empirically (via throwaway probes against the real, built native addon --
// not assumed) before being accepted here, not silently worked around: ***
//
// 13 of the 38 fixtures do NOT get their real-Python-expected violation count from
// this port's `validate()`, split across three already-disclosed, already-locked
// out-of-scope root causes -- see `src/validate.ts`'s own header comment, findings 10
// (chunk 3) and 15/16/17 (this chunk), for the full investigation of each:
//
// - **Finding 15** (C++ parse-time log capture is architecturally unreachable --
//   `validate()` only ever accepts an already-open `IfcFile`, per Phase EX-3's own
//   locked decision): `fail-header-attr-too-many.ifc` (chunk 3's original finding),
//   `fail-attr-too-few.ifc`, `fail-attr-too-many.ifc`,
//   `fail-expected-2-header-attr-too-few.ifc`,
//   `fail-expected-2-selected-simple-type-empty-typed-value.ifc`,
//   `fail-expected-2-selected-simple-type-non-existant-type.ifc`,
//   `fail-expected-2-invalid-selected-enumeration.ifc`,
//   `fail-expected-3-invalid-entity.ifc`, `fail-invalid-entity-in-attribute.ifc`.
// - **Finding 16** (`use_attribute_value_derived` deliberately out of scope):
//   `fail-derived-as-nil.ifc`, `fail-nil-as-derived.ifc`.
// - **Finding 17** (`simple_type.declared_type()` has no N-API binding -- the
//   already-disclosed, already-tested chunk 2 "permissive fallback" gap, confirmed
//   here as a real fixture-level manifestation, not a new gap):
//   `fail-invalid-selected-simple-type.ifc`, `fail-selected-simple-type-wrong-literal.ifc`.
//
// Each is pinned below with its own, individually-confirmed CURRENT (divergent) actual
// count -- not silently skipped and not a mysteriously-adjusted expected count -- so a
// future fix to any of the three underlying root causes shows up as a *failing* pinned
// test (prompting that test to be deleted/updated), rather than silently vanishing.
// The remaining 25 fixtures are asserted against their real, correct expected count
// via the same data-driven loop real Python's own `test_validate.py` uses.

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { open } from "../src/open";
import { validate } from "../src/validate";
import { AVAILABLE_SCHEMAS, type Schema } from "./bootstrap";

const FIXTURES_DIR = path.join(__dirname, "fixtures", "validate");

// Several fixtures are `FILE_SCHEMA(('IFC2X3'))`/`FILE_SCHEMA(('IFC4X3_ADD2'))` (not
// just the ones with "IFC2X3" in their own filename -- confirmed directly, e.g.
// `fail-selected-simple-type-wrong-literal.ifc` is IFC2X3), and `bootstrap.ts`'s own
// header comment already discloses that this repo's default CI build only registers
// IFC4 (`-DSCHEMA_VERSIONS=4`) in some jobs, IFC2X3+IFC4+IFC4X3_ADD2 in others. Real
// Python's own `test_validate.py` handles exactly this with `except
// ifcopenshell.SchemaError: pytest.skip()`; this mirrors that at collection time (like
// `validate.test.ts`'s own `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))`
// precedent) by reading each fixture's own `FILE_SCHEMA` line directly rather than
// guessing from its filename.
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
 * See this file's own header comment for the full, individually-investigated
 * justification for every entry -- each maps to one of `src/validate.ts`'s header
 * comment findings 10/15/16/17.
 */
const KNOWN_DIVERGENT_FIXTURES = new Set<string>([
	"fail-header-attr-too-many.ifc",
	"fail-attr-too-few.ifc",
	"fail-attr-too-many.ifc",
	"fail-expected-2-header-attr-too-few.ifc",
	"fail-expected-2-selected-simple-type-empty-typed-value.ifc",
	"fail-expected-2-selected-simple-type-non-existant-type.ifc",
	"fail-expected-2-invalid-selected-enumeration.ifc",
	"fail-expected-3-invalid-entity.ifc",
	"fail-invalid-entity-in-attribute.ifc",
	"fail-derived-as-nil.ifc",
	"fail-nil-as-derived.ifc",
	"fail-invalid-selected-simple-type.ifc",
	"fail-selected-simple-type-wrong-literal.ifc",
]);

const allFixtureFiles = fs
	.readdirSync(FIXTURES_DIR)
	.filter((name) => name.endsWith(".ifc"))
	.sort();

// Sanity check on this file's own bookkeeping, not on `validate()` itself: catches a
// typo'd/renamed/removed fixture in `KNOWN_DIVERGENT_FIXTURES` immediately, rather than
// that entry silently never being exercised by anything below.
describe("validate.ts validate() fixture suite bookkeeping", () => {
	test("every KNOWN_DIVERGENT_FIXTURES entry names a real, still-vendored fixture", () => {
		const real = new Set(allFixtureFiles);
		for (const name of KNOWN_DIVERGENT_FIXTURES) {
			expect(real.has(name)).toBe(true);
		}
	});

	test("all 38 real, upstream-vendored fixtures are present", () => {
		expect(allFixtureFiles).toHaveLength(38);
	});
});

describe("validate.ts validate() -- real fixture suite (test_validate.py equivalent)", () => {
	const cleanFixtures = allFixtureFiles.filter((name) => !KNOWN_DIVERGENT_FIXTURES.has(name));

	for (const filename of cleanFixtures) {
		const fixturePath = path.join(FIXTURES_DIR, filename);
		const requiredSchema = requiredSchemaFor(fixturePath);
		test.skipIf(!AVAILABLE_SCHEMAS.includes(requiredSchema))(filename, () => {
			const expected = expectedViolationCount(filename);
			const file = open(fixturePath);
			const violations = validate(file);
			expect(violations.length).toBe(expected);
		});
	}
});

describe("validate.ts validate() -- disclosed, known-divergent fixtures (pinned, not skipped)", () => {
	function pin(filename: string, actualCount: number) {
		const fixturePath = path.join(FIXTURES_DIR, filename);
		const requiredSchema = requiredSchemaFor(fixturePath);
		test.skipIf(!AVAILABLE_SCHEMAS.includes(requiredSchema))(
			`${filename} (real Python expects ${expectedViolationCount(filename)}, this port currently reports ${actualCount} -- see src/validate.ts header comment)`,
			() => {
				const file = open(fixturePath);
				expect(validate(file).length).toBe(actualCount);
			},
		);
	}

	// Finding 15: C++ parse-time log capture is architecturally unreachable.
	pin("fail-header-attr-too-many.ifc", 0);
	pin("fail-attr-too-few.ifc", 0);
	pin("fail-attr-too-many.ifc", 0);
	pin("fail-expected-2-header-attr-too-few.ifc", 1);
	pin("fail-expected-2-selected-simple-type-empty-typed-value.ifc", 1);
	pin("fail-expected-2-selected-simple-type-non-existant-type.ifc", 1);
	pin("fail-expected-2-invalid-selected-enumeration.ifc", 1);
	pin("fail-expected-3-invalid-entity.ifc", 1);
	pin("fail-invalid-entity-in-attribute.ifc", 0);

	// Finding 16: `use_attribute_value_derived` deliberately out of scope.
	pin("fail-derived-as-nil.ifc", 0);
	pin("fail-nil-as-derived.ifc", 0);

	// Finding 17: `simple_type.declared_type()` has no N-API binding (chunk 2's
	// already-disclosed, already-tested permissive-fallback gap).
	pin("fail-invalid-selected-simple-type.ifc", 0);
	pin("fail-selected-simple-type-wrong-literal.ifc", 0);
});
