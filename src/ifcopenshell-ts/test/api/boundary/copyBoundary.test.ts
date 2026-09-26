// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/boundary/test_copy_boundary.py`'s `TestCopyBoundary`/
// `TestCopyBoundaryIFC2X3` (real Python runs the same body against both IFC4 and
// IFC2X3, via multiple inheritance) -- both real test methods (`test_run`/
// `test_copying_connection_geometry`) ported verbatim. No schema divergence exists for
// any entity involved (confirmed against all 3 generated `.d.ts`s, see
// `../../../src/api/boundary/index.ts`'s own header comment), so this runs against
// every `AVAILABLE_SCHEMAS` entry -- strictly more coverage than real Python's own two
// classes, matching this module's sibling test files' established precedent.

import { describe, expect, test } from "vitest";
import { copyBoundary } from "../../../src/api/boundary/copyBoundary";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.boundary.copyBoundary (%s)", (schema) => {
	test("copies a boundary and regenerates its GlobalId", () => {
		const file = createTestFile(schema);
		const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });
		const boundary2 = copyBoundary(file, { boundary });
		expect(boundary2.isA("IfcRelSpaceBoundary")).toBe(true);
		expect(boundary2.get("GlobalId")).not.toBe(boundary.get("GlobalId"));
	});

	test("deep-copies the connection geometry, if any", () => {
		const file = createTestFile(schema);
		const geometry = file.createEntity("IfcConnectionSurfaceGeometry");
		const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });
		boundary.set("ConnectionGeometry", geometry);
		const boundary2 = copyBoundary(file, { boundary });
		const geometry2 = boundary2.get("ConnectionGeometry") as EntityInstance;
		expect(geometry2.isA("IfcConnectionSurfaceGeometry")).toBe(true);
		expect(geometry2.equals(geometry)).toBe(false);
	});
});
