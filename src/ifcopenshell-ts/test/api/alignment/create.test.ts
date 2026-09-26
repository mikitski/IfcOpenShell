// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to real `test/api/alignment/test_create.py`, and its own former
// `test_create_stationing_referent_name_includes_alignment_name` (now DELETED by real
// upstream, see below).
//
// **Upstream sync, chunk 3 of 4 update (real upstream commit
// `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`)**: `create()` no longer auto-creates a
// stationing referent (see `../../../src/api/alignment/create.ts`'s own header comment
// for the full reasoning -- the automatic call used to run before the basis curve had
// any real segments, so it always produced a referent with the WRONG placement kind).
// Real upstream's own `test_create.py` diff DELETES
// `test_create_stationing_referent_name_includes_alignment_name` entirely (it tested a
// behavior that no longer exists) and adds two new assertions to `test_create()` itself:
// `get_stationing_nest(file, ali) is None` and "no `IfcReferent` at all among `ali`'s own
// nested components" -- both ported below, replacing this file's own former (pre-upstream-
// sync) assertions that a stationing referent WAS created.
import { describe, expect, test } from "vitest";
import { create } from "../../../src/api/alignment/create";
import { getCurve } from "../../../src/api/alignment/getCurve";
import { getStationingNest } from "../../../src/api/alignment/getStationingNest";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.create (IFC4X3)", () => {
	test("includeGeometry=true: real entity/layout/geometry construction, and NO stationing referent", () => {
		const file = createTestFile("IFC4X3");

		const alignment = create(file, "MyAlignment", false, false, true);

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

		// create() does not define stationing -- the alignment has no referent nest at
		// all (real Python: `test_create`'s own new assertions, added by the real
		// upstream stationing-rework commit).
		expect(getStationingNest(file, alignment)).toBeNull();
		expect(file.byType("IfcReferent")).toHaveLength(0);
		for (const n of nests) {
			for (const related of n.get("RelatedObjects") as EntityInstance[]) {
				expect(related.isA("IfcReferent")).toBe(false);
			}
		}
	});

	test("includeGeometry=false: no representation is created, and still no stationing referent", () => {
		const file = createTestFile("IFC4X3");

		const alignment = create(file, "A", false, false, false);

		expect(alignment.get("Representation")).toBeNull();
		expect(getStationingNest(file, alignment)).toBeNull();
		expect(file.byType("IfcReferent")).toHaveLength(0);
	});

	test("includeVertical/includeCant: real, portable layout creation, and still no stationing referent", () => {
		const file = createTestFile("IFC4X3");

		const alignment = create(file, "A", true, true, false);

		expect(alignment.isA("IfcAlignment")).toBe(true);
		expect(file.byType("IfcAlignmentHorizontal").length).toBe(1);
		expect(file.byType("IfcAlignmentVertical").length).toBe(1);
		const cants = file.byType("IfcAlignmentCant");
		expect(cants.length).toBe(1);
		expect(cants[0].get("RailHeadDistance")).toBe(1.0);

		expect(file.byType("IfcReferent")).toHaveLength(0);
	});
});
