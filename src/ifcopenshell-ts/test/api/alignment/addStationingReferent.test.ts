// This file was generated with the assistance of an AI coding tool.
//
// Real Python's own `test_add_stationing_referent.py` builds its fixture via
// `ifcopenshell.api.alignment.create(..., include_vertical=True)` (not in this chunk's
// scope), and all 3 of its own tests exercise the composite-curve branch (on
// `get_basis_curve`) -- which works fully end to end in real Python. This suite instead
// uses a hand-rolled fixture (matching this module's own established pattern) split
// across both placement branches, PLUS an original test confirming `onBasisCurve`'s own
// curve-selection logic (`getBasisCurve` vs. `getCurve`) still runs correctly --
// observable because the two curve choices, in this fixture, hit DIFFERENT code paths
// (the basis curve is a real composite curve; the non-basis curve deliberately is not).
//
// **Reference-parity chunk 4 of 5 update (2026-09-25):** `TODOS.md`'s "EntityInstance
// .setByIndex/IfcFile.createEntity ..." gate (PR #179) is now fixed, and the
// `editPset`-new-property gate (`api.pset` chunk) was already flipped in chunk 2 of 5.
// The fallback-placement (non-composite-curve) branch is UNAFFECTED by either gap and
// now succeeds end to end -- flipped to its real, verified assertions below.
//
// The composite basis-curve branch, however, turned out to be MORE complicated than
// this file's own original pinning comment assumed -- see
// `addPositioningReferent.test.ts`'s own identical, more detailed writeup: fixing the
// `IfcLengthMeasure` gate un-blocks `IfcPointByDistanceExpression` construction, but
// `updateFallbackPosition`'s own `getAxis2placement` call then hits a SEPARATE,
// already-tracked, still-open `ifcopenshell.geom` gap (`TODOS.md`'s dedicated
// `getAxis2placement` entry) -- confirmed EMPIRICALLY against this chunk's own
// freshly-built native addon. The dedicated composite-curve regression test below is
// left skipped rather than forced to a fudged "succeeds" assertion; the
// `onBasisCurve=false` curve-selection test keeps its default-branch call as a real,
// verified assertion of the (still-blocked, but for the new reason) throw, since that
// fact is fully determined and not in question -- only the composite-curve branch
// itself remains genuinely unresolved.
//
// A SECOND, separate real Python test file also exists and touches this function --
// `test_add_stationing_to_alignment.py` (82 lines) -- but only indirectly, via
// `ifcopenshell.api.alignment.create(file, "TestAlignment", start_station=2000.0)`
// (`create()`'s own referent, plus a second, direct `add_stationing_referent(...)`
// call for a station equation). `create()`'s own freshly-created `IfcCompositeCurve`
// always starts with ZERO segments (the mandatory zero-length segment is only added by
// `create()`'s own trailing `_add_zero_length_segment` loop, which runs AFTER
// `add_stationing_referent`) -- so `add_stationing_referent`'s composite-curve/
// non-empty-segments check is never satisfied at this point, regardless of
// `include_geometry`, and it always takes the SAME fallback-placement branch this
// file's own "no-representation" test above already exercises (confirmed directly
// against `create.test.ts`'s own test asserting the identical error class/message for
// both `includeGeometry` values). Not independently reusable/distinctly testable here
// either, for the same already-disclosed reason -- no new `TODOS.md` entry needed.

import { describe, expect, test } from "vitest";
import { addStationingReferent } from "../../../src/api/alignment/addStationingReferent";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const GEOM_GAP_ERROR = /ifcopenshell\.geom/;

function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

function addRepresentations(
	file: IfcFile,
	product: EntityInstance,
	reps: ReadonlyArray<{ identifier: string; type: string; items: readonly EntityInstance[] }>,
): void {
	const shapeReps = reps.map((r) =>
		file.createEntity("IfcShapeRepresentation", create3dContext(file), r.identifier, r.type, [...r.items]),
	);
	product.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, shapeReps));
}

function realCompositeCurve(file: IfcFile): EntityInstance {
	const compositeCurveSegment = file.createEntity(
		"IfcCompositeCurveSegment",
		"CONTINUOUS",
		true,
		file.createEntity(
			"IfcLine",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
		),
	);
	return file.createEntity("IfcCompositeCurve", [compositeCurveSegment], false);
}

function alignmentAt(file: IfcFile, coordinates: readonly [number, number, number]): EntityInstance {
	return file.createEntity(
		"IfcAlignment",
		guid.new(),
		null,
		"TestAlignment",
		null,
		null,
		file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [...coordinates])),
		),
		null,
	);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.addStationingReferent (IFC4X3)", () => {
	// Reference-parity chunk 4 of 5: STILL blocked, but no longer by the gate this file
	// used to pin -- see this file's own header comment. Left skipped (not flipped to a
	// fudged "succeeds" assertion) until `ifcopenshell.geom` lands.
	test.skip("composite basis-curve branch (default onBasisCurve): throws at the disclosed ifcopenshell.geom gap (not the now-fixed IfcLengthMeasure gap), before any IfcReferent is created", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [1, 2, 0]);
		addRepresentations(file, alignment, [
			{ identifier: "FootPrint", type: "Curve2D", items: [realCompositeCurve(file)] },
		]);

		expect(() => addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0)).toThrow(GEOM_GAP_ERROR);
		expect(file.byType("IfcReferent")).toHaveLength(0);
	});

	// Reference-parity chunk 4 of 5: PR #179's `IfcLengthMeasure`-construction gate and
	// chunk 2 of 5's `editPset`-new-property gate are both now fixed, and this branch
	// never touches `updateFallbackPosition` at all -- so it now succeeds end to end,
	// including the trailing `getStationingNest`/`_sortNest` bookkeeping. Verified
	// against this chunk's own freshly-built native addon.
	test("no-representation (fallback placement) branch: builds a real IfcReferent, Pset_Stationing, and stationing IfcRelNests", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [5, 6, 0]);

		const referent = addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0);

		expect(referent.isA("IfcReferent")).toBe(true);
		expect(referent.get("Name")).toBe("1+00.0");
		expect(referent.get("PredefinedType")).toBe("STATION");
		expect((referent.get("ObjectPlacement") as EntityInstance).isA("IfcLocalPlacement")).toBe(true);

		const psets = file.byType("IfcPropertySet");
		expect(psets).toHaveLength(1);
		expect(psets[0].get("Name")).toBe("Pset_Stationing");
		const props = psets[0].get("HasProperties") as EntityInstance[];
		expect(props).toHaveLength(1);
		expect(props[0].get("Name")).toBe("Station");
		expect((props[0].get("NominalValue") as EntityInstance).getByIndex(0)).toBe(100.0);

		const nests = file.byType("IfcRelNests");
		expect(nests).toHaveLength(1);
		expect((nests[0].get("RelatingObject") as EntityInstance).equals(alignment)).toBe(true);
		expect((nests[0].get("RelatedObjects") as EntityInstance[])[0].equals(referent)).toBe(true);
	});

	// The default (composite basis-curve) branch is still genuinely blocked by the
	// separate `ifcopenshell.geom` gap (see this file's own header comment), so its own
	// throw is a real, fully-determined, verified fact, not a guess -- keeping this
	// assertion active (rather than skipping the whole test) still lets the SECOND half
	// of this test demonstrate real, working `onBasisCurve=false` curve-selection
	// behavior (a plain, non-composite `IfcPolyline`, which never reaches either gap).
	test("onBasisCurve=false selects getCurve (not getBasisCurve): default hits the disclosed geom gap, false succeeds", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [0, 0, 0]);
		// FootPrint/Curve2D (the basis curve) is a real composite curve -- hits the
		// disclosed ifcopenshell.geom gap immediately. Axis/Curve2D (get_curve) is a
		// plain, non-composite IfcPolyline -- takes the fully-portable fallback branch.
		addRepresentations(file, alignment, [
			{ identifier: "FootPrint", type: "Curve2D", items: [realCompositeCurve(file)] },
			{
				identifier: "Axis",
				type: "Curve2D",
				items: [
					file.createEntity("IfcPolyline", [
						file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
						file.createEntity("IfcCartesianPoint", [100.0, 0.0]),
					]),
				],
			},
		]);

		// Default (on_basis_curve=None -> true): resolves the FootPrint composite curve,
		// throws at the disclosed geom gap, no side effect.
		expect(() => addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0, null, null)).toThrow(GEOM_GAP_ERROR);
		expect(file.byType("IfcReferent")).toHaveLength(0);

		// onBasisCurve=false: resolves the Axis IfcPolyline instead -- NOT an
		// IfcCompositeCurve, so it takes the fallback-placement branch and succeeds.
		const referent = addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0, null, false);
		expect(file.byType("IfcReferent")).toHaveLength(1);
		expect((referent.get("ObjectPlacement") as EntityInstance).isA("IfcLocalPlacement")).toBe(true);
	});

	// Reference-parity chunk 4 of 5: the `editPset` gate no longer throws, so
	// `IncomingStation` IS now reachable and is written alongside `Station`.
	test("IncomingStation, when given, is added to the same Pset_Stationing as Station", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [0, 0, 0]);

		addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0, 50.0);

		const psets = file.byType("IfcPropertySet");
		expect(psets).toHaveLength(1);
		const props = psets[0].get("HasProperties") as EntityInstance[];
		expect(props).toHaveLength(2);
		const byName = Object.fromEntries(
			props.map((p) => [p.get("Name"), (p.get("NominalValue") as EntityInstance).getByIndex(0)]),
		);
		expect(byName.Station).toBe(100.0);
		expect(byName.IncomingStation).toBe(50.0);
	});
});
