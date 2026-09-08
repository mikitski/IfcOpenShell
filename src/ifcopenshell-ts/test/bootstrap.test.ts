// This file was generated with the assistance of an AI coding tool.
import { describe, expect, test } from "vitest";
import { ALL_SCHEMAS, AVAILABLE_SCHEMAS, createTestFile } from "./bootstrap";

// A CI leg that builds the C++ core with a narrower `-DSCHEMA_VERSIONS` (see
// bootstrap.ts's own comment) has fewer of these available -- but at least one
// (IFC4) must always be, in every leg, or the fixture itself is broken.
test("at least one schema is available for testing in this build", () => {
	expect(AVAILABLE_SCHEMAS.length).toBeGreaterThan(0);
});

describe.each(AVAILABLE_SCHEMAS)("createTestFile(%s)", (schema) => {
	test("produces a valid, openable file in the requested schema", () => {
		const file = createTestFile(schema);
		expect(file.schema).toBe(schema);
	});
});

test("reports which schemas from the full set are unavailable in this build (informational)", () => {
	const unavailable = ALL_SCHEMAS.filter((schema) => !(AVAILABLE_SCHEMAS as readonly string[]).includes(schema));
	if (unavailable.length > 0) {
		console.warn(
			`Schemas not available in this build's C++ core, skipped: ${unavailable.join(", ")}. See test/bootstrap.ts's comment (ci-ifcopenshell-ts.yml currently builds -DSCHEMA_VERSIONS=4).`,
		);
	}
	expect(true).toBe(true);
});
