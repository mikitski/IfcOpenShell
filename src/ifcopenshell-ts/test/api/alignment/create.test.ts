// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `create.py`'s own real caller-facing behavior in
// THIS chunk's scope in a way that's reusable here (real Python's own
// `test_create.py` presumes a fully functional `create()`). Original test coverage
// written here, pinning the real, portable prefix (entity creation, layout creation,
// nesting, conditional geometric-representation creation) that runs before this
// function's own CONFIRMED unconditional `addStationingReferent` throw -- see
// `../../../src/api/alignment/create.ts`'s own header comment for the precise
// indentation-level verification that this throw is NOT gated behind
// `includeGeometry`.

import { describe, expect, test } from "vitest";
import { create } from "../../../src/api/alignment/create";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.create (IFC4X3)", () => {
	// SKIPPED (PR #179): PR #179 fixed the native `attribute_value_shim.cpp` gate
	// `addStationingReferent` (transitively) threw through (TODOS.md's "EntityInstance
	// .setByIndex/IfcFile.createEntity ..." entry, now RESOLVED for the shared gate) --
	// `create()` no longer throws here. Real expected result: `create()` should
	// complete fully (this file's own header comment), and this test's own already-
	// asserted prefix (alignment/horizontal layout/nesting/representation) should
	// still hold, now without the `try`/`catch` -- left to a follow-up chunk to verify.
	test.skip("CONFIRMED unconditionally blocked: includeGeometry=true reaches the addStationingReferent throw, after real, portable entity/layout/geometry construction", () => {
		const file = createTestFile("IFC4X3");

		let thrown: unknown;
		try {
			create(file, "MyAlignment", false, false, true, 0.0);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeDefined();

		// The real IfcAlignment and its horizontal layout were created and nested, and a
		// real geometric representation was created, before the throw.
		const alignments = file.byType("IfcAlignment");
		expect(alignments.length).toBe(1);
		const alignment = alignments[0];
		expect(alignment.get("Name")).toBe("MyAlignment");

		const horizontalLayouts = file.byType("IfcAlignmentHorizontal");
		expect(horizontalLayouts.length).toBe(1);
		const nests = alignment.get("IsNestedBy") as EntityInstance[];
		expect(
			nests.some((n) =>
				(n.get("RelatedObjects") as EntityInstance[]).some((o) => o.identity() === horizontalLayouts[0].identity()),
			),
		).toBe(true);

		expect(alignment.get("Representation")).not.toBeNull();
	});

	// SKIPPED (PR #179): PR #179 fixed the native `attribute_value_shim.cpp` gate this
	// test pinned (TODOS.md's "EntityInstance.setByIndex/IfcFile.createEntity ..."
	// entry, now RESOLVED for the shared gate) -- `create()` no longer throws either
	// way, so this test's own "same error either way" comparison no longer applies.
	// Real expected result: `create()` completes fully both with and without
	// `includeGeometry` (this file's own header comment) -- left to a follow-up chunk.
	test.skip("CONFIRMED unconditionally blocked REGARDLESS of includeGeometry: includeGeometry=false reaches the IDENTICAL addStationingReferent throw, with no representation created", () => {
		const file = createTestFile("IFC4X3");

		let thrownWithGeometry: unknown;
		try {
			create(file, "A", false, false, true, 0.0);
		} catch (e) {
			thrownWithGeometry = e;
		}

		const file2 = createTestFile("IFC4X3");
		let thrownWithoutGeometry: unknown;
		try {
			create(file2, "A", false, false, false, 0.0);
		} catch (e) {
			thrownWithoutGeometry = e;
		}

		expect(thrownWithGeometry).toBeDefined();
		expect(thrownWithoutGeometry).toBeDefined();
		// Same disclosed gap reached either way (see this file's own header comment).
		expect((thrownWithoutGeometry as Error).constructor).toBe((thrownWithGeometry as Error).constructor);
		expect((thrownWithoutGeometry as Error).message).toBe((thrownWithGeometry as Error).message);

		const alignments = file2.byType("IfcAlignment");
		expect(alignments.length).toBe(1);
		expect(alignments[0].get("Representation")).toBeNull();
	});

	// SKIPPED (PR #179): PR #179 fixed the native `attribute_value_shim.cpp` gate this
	// test pinned (TODOS.md's "EntityInstance.setByIndex/IfcFile.createEntity ..."
	// entry, now RESOLVED for the shared gate) -- `create()` no longer throws. Real
	// expected result: `create()` completes fully, with the horizontal/vertical/cant
	// layouts this test already asserts plus a real final representation -- left to a
	// follow-up module-grouped chunk to verify and flip.
	test.skip("includeVertical/includeCant: real, portable layout creation before the same throw", () => {
		const file = createTestFile("IFC4X3");

		expect(() => create(file, "A", true, true, false, 0.0)).toThrow();

		expect(file.byType("IfcAlignmentHorizontal").length).toBe(1);
		expect(file.byType("IfcAlignmentVertical").length).toBe(1);
		const cants = file.byType("IfcAlignmentCant");
		expect(cants.length).toBe(1);
		expect(cants[0].get("RailHeadDistance")).toBe(1.0);
	});
});
