// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file existed for `create.py`'s own real caller-facing behavior
// in a way that was reusable when this file was first written -- real Python's own
// `test_create.py`/`test_create_stationing_referent_name_includes_alignment_name`
// presumed a fully functional `create()`, which was blocked at the time. Original test
// coverage was written here instead, pinning the real, portable prefix that ran before
// `addStationingReferent`'s own CONFIRMED unconditional throw.
//
// **Reference-parity chunk 4 of 5 update (2026-09-25):** `TODOS.md`'s "EntityInstance
// .setByIndex/IfcFile.createEntity ..." gate (PR #179) is now fixed, and the
// `editPset`-new-property gate (`api.pset` chunk) was already flipped in chunk 2 of 5.
// `create()` turns out to be UNCONDITIONALLY unaffected by the remaining, still-open
// `ifcopenshell.geom`/`getAxis2placement` gap (see `addPositioningReferent.test.ts`'s
// own detailed writeup of that gap) for a real, structural reason specific to this
// function: `_createGeometricRepresentation` creates its `IfcCompositeCurve` EMPTY
// (`Segments === []`) -- "this creates the geometric representation entity ... but does
// not populate the geometry" (`_createGeometricRepresentation.ts`'s own doc comment) --
// and `addStationingReferent`'s own composite-curve branch requires
// `curve.Segments.length > 0` to be taken at all. Since `addStationingReferent` is
// always called BEFORE `create()`'s own trailing `_addZeroLengthSegment` loop (which is
// what actually populates `Segments`), `addStationingReferent` ALWAYS takes the
// fallback-placement branch inside `create()`, for every combination of
// `includeVertical`/`includeCant`/`includeGeometry` -- confirmed EMPIRICALLY against
// this chunk's own freshly-built native addon for all 4 combinations, not assumed.
// `create()` therefore now succeeds completely, end to end, in every scenario -- all 3
// tests below are flipped to their real, verified assertions.
import { describe, expect, test } from "vitest";
import { create } from "../../../src/api/alignment/create";
import { getCurve } from "../../../src/api/alignment/getCurve";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.create (IFC4X3)", () => {
	test("includeGeometry=true: real entity/layout/geometry construction, plus a real stationing referent", () => {
		const file = createTestFile("IFC4X3");

		const alignment = create(file, "MyAlignment", false, false, true, 0.0);

		expect(alignment.isA("IfcAlignment")).toBe(true);
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

		// The composite curve is created empty by `_createGeometricRepresentation`, then
		// populated with exactly one zero-length segment by `create()`'s own trailing
		// `_addZeroLengthSegment` loop (real Python: `test_create`'s own
		// `assert len(curve.Segments) == 1`).
		const curve = getCurve(alignment);
		expect(curve?.isA("IfcCompositeCurve")).toBe(true);
		expect((curve?.get("Segments") as EntityInstance[]).length).toBe(1);

		// `addStationingReferent` is called unconditionally with `startStation`, and now
		// succeeds (real Python: `test_create_stationing_referent_name_includes
		// _alignment_name`'s own "<alignment name> <station>" naming convention).
		const referents = file.byType("IfcReferent");
		expect(referents).toHaveLength(1);
		expect(referents[0].get("Name")).toBe("MyAlignment 0+000.000");
		expect(elementUtil.getPset(referents[0], "Pset_Stationing", "Station")).toBe(0.0);
	});

	test("includeGeometry=false: no representation is created, but the same stationing referent still succeeds", () => {
		const file = createTestFile("IFC4X3");

		const alignment = create(file, "A", false, false, false, 0.0);

		expect(alignment.get("Representation")).toBeNull();

		const referents = file.byType("IfcReferent");
		expect(referents).toHaveLength(1);
		expect(referents[0].get("Name")).toBe("A 0+000.000");
		expect((referents[0].get("ObjectPlacement") as EntityInstance).isA("IfcLocalPlacement")).toBe(true);
	});

	test("includeVertical/includeCant: real, portable layout creation, plus a real stationing referent", () => {
		const file = createTestFile("IFC4X3");

		const alignment = create(file, "A", true, true, false, 0.0);

		expect(alignment.isA("IfcAlignment")).toBe(true);
		expect(file.byType("IfcAlignmentHorizontal").length).toBe(1);
		expect(file.byType("IfcAlignmentVertical").length).toBe(1);
		const cants = file.byType("IfcAlignmentCant");
		expect(cants.length).toBe(1);
		expect(cants[0].get("RailHeadDistance")).toBe(1.0);

		expect(file.byType("IfcReferent")).toHaveLength(1);
	});
});
