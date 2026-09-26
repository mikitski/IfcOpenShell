// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/boundary/test_remove_boundary.py`'s `TestRemoveBoundary`/
// `TestRemoveBoundaryIFC2X3` (real Python runs the same body against both IFC4 and
// IFC2X3, via multiple inheritance) -- both real test methods (`test_run`/
// `test_removing_connection_geometry`) ported verbatim. No schema divergence exists
// for any entity involved, so this runs against every `AVAILABLE_SCHEMAS` entry,
// matching `./copyBoundary.test.ts`'s own identical precedent.
//
// `test_removing_connection_geometry` is the load-bearing regression test for the
// real, disclosed, EMPIRICALLY VERIFIED native inverse-index bug documented in
// `../../../src/api/boundary/removeBoundary.ts`'s own header comment: asserting the
// geometry is actually gone (not just orphaned with a stale inverse count) is exactly
// what would fail if the `removeDeep2`-`alsoConsider` workaround were ever regressed
// back to a literal `boundary.ConnectionGeometry = null` port of real Python.

import { describe, expect, test } from "vitest";
import { removeBoundary } from "../../../src/api/boundary/removeBoundary";
import { createEntity } from "../../../src/api/root/createEntity";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.boundary.removeBoundary (%s)", (schema) => {
	test("removes the boundary", () => {
		const file = createTestFile(schema);
		const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });
		removeBoundary(file, { boundary });
		expect(file.byType("IfcRelSpaceBoundary")).toHaveLength(0);
	});

	test("removing a boundary also removes its connection geometry", () => {
		const file = createTestFile(schema);
		const geometry = file.createEntity("IfcConnectionSurfaceGeometry");
		const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });
		boundary.set("ConnectionGeometry", geometry);
		removeBoundary(file, { boundary });
		expect(file.byType("IfcRelSpaceBoundary")).toHaveLength(0);
		expect(file.byType("IfcConnectionSurfaceGeometry")).toHaveLength(0);
	});
});
