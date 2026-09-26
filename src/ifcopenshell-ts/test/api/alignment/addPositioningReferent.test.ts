// This file was generated with the assistance of an AI coding tool.
//
// Real Python's own `test_add_positioning_referent.py` builds its fixture via
// `ifcopenshell.api.alignment.create` (not in this chunk's scope), and both of its own
// tests exercise the composite-curve branch, which real Python's own `Pset_Stationing
// .Station == 2000.0` assertion confirms works fully end to end THERE.
//
// **Reference-parity chunk 4 of 5 update (2026-09-25):** `TODOS.md`'s "EntityInstance
// .setByIndex/IfcFile.createEntity ..." gate (PR #179) is now fixed, and the
// `editPset`-new-property gate (`api.pset` chunk) was already flipped in chunk 2 of
// 5 -- so the no-representation (fallback placement) branch below now genuinely
// succeeds end to end and has been flipped to its real, verified assertion.
//
// The composite-curve branch, however, turned out to be MORE complicated than this
// file's own original pinning comment assumed: fixing the `IfcLengthMeasure`-
// construction gate un-blocks `IfcPointByDistanceExpression` construction, but the very
// next line, `updateFallbackPosition(file, objectPlacement)`, then reaches a SEPARATE,
// already-tracked, still-open primitive-layer gap -- `util/placement.ts`'s own
// `getAxis2placement` needs `ifcopenshell.geom` (not yet ported in this TS port) to
// resolve `IfcAxis2PlacementLinear.Location` when it's an `IfcPointByDistanceExpression`
// (no `Coordinates` attribute) -- see `TODOS.md`'s dedicated "`getAxis2placement`'s
// `IfcAxis2PlacementLinear` fallback needs `ifcopenshell.geom`" entry (`util.placement`
// chunk, 2026-09-11), already independently flagged as a real risk by
// `updateFallbackPosition.ts`'s own header comment. Confirmed EMPIRICALLY against this
// chunk's own freshly-built native addon: the composite-curve branch now throws
// `getAxis2placement: cannot resolve a non-Cartesian Location (
// IfcPointByDistanceExpression, no Coordinates attribute) without ifcopenshell.geom...`
// instead of the old, now-fixed `attribute_kind_of` error -- still blocked, just by a
// different, unrelated, already-disclosed gap. Left `test.skip`'d rather than forced to
// a fudged "succeeds" assertion -- see the test's own updated comment below.

import { describe, expect, test } from "vitest";
import { addPositioningReferent } from "../../../src/api/alignment/addPositioningReferent";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const GEOM_GAP_ERROR = /ifcopenshell\.geom/;

function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

function addAxisRepresentation(file: IfcFile, product: EntityInstance, items: readonly EntityInstance[]): void {
	const shapeRepresentation = file.createEntity("IfcShapeRepresentation", create3dContext(file), "Axis", "Curve2D", [
		...items,
	]);
	product.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]));
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

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.addPositioningReferent (IFC4X3)", () => {
	// Reference-parity chunk 4 of 5: STILL blocked, but no longer by the gate this file
	// used to pin -- see this file's own header comment for the full writeup. Fixing
	// the `IfcLengthMeasure` gate lets `IfcPointByDistanceExpression` construction
	// succeed, but `updateFallbackPosition`'s own `getAxis2placement` call then hits
	// the SEPARATE, already-tracked `ifcopenshell.geom` gap (`TODOS.md`'s dedicated
	// `getAxis2placement` entry) -- confirmed EMPIRICALLY, not assumed. Left skipped
	// (not flipped to a fudged "succeeds" assertion) until `ifcopenshell.geom` lands.
	test.skip("composite-curve branch: throws at the disclosed ifcopenshell.geom gap (not the now-fixed IfcLengthMeasure gap), before any IfcReferent is created", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [1, 2, 0]);
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
		const compositeCurve = file.createEntity("IfcCompositeCurve", [compositeCurveSegment], false);
		addAxisRepresentation(file, alignment, [compositeCurve]);

		expect(() => addPositioningReferent(file, "P.C.", alignment, 0.0, 100.0, alignment)).toThrow(GEOM_GAP_ERROR);

		// No side effect at all -- the throw happens before IfcLinearPlacement's own
		// CartesianPosition fallback is ever assigned, and before the
		// IfcReferent/IfcRelPositions are created.
		expect(file.byType("IfcReferent")).toHaveLength(0);
		expect(file.byType("IfcRelPositions")).toHaveLength(0);
	});

	// Reference-parity chunk 4 of 5: PR #179's `IfcLengthMeasure`-construction gate and
	// chunk 2 of 5's `editPset`-new-property gate are both now fixed, and this branch
	// (unlike the composite-curve branch above) never touches `updateFallbackPosition`
	// at all -- so it now succeeds end to end. Verified against this chunk's own
	// freshly-built native addon.
	test("no-representation (fallback placement) branch: builds a real IfcReferent, Pset_Stationing, and IfcRelPositions", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [10, 20, 0]);
		const segment = file.createEntity("IfcBuildingElementProxy", guid.new(), null, "Sign");

		const referent = addPositioningReferent(file, "P.C.", alignment, 0.0, 2000.0, segment);

		expect(referent.isA("IfcReferent")).toBe(true);
		expect(referent.get("Name")).toBe("P.C.");
		expect(referent.get("PredefinedType")).toBe("POSITION");
		expect(referent.get("ObjectPlacement")).not.toBeNull();
		expect((referent.get("ObjectPlacement") as EntityInstance).isA("IfcLocalPlacement")).toBe(true);
		const location = (
			((referent.get("ObjectPlacement") as EntityInstance).get("RelativePlacement") as EntityInstance).get(
				"Location",
			) as EntityInstance
		).get("Coordinates") as readonly number[];
		expect([...location]).toEqual([10, 20, 0]);

		const psets = file.byType("IfcPropertySet");
		expect(psets).toHaveLength(1);
		expect(psets[0].get("Name")).toBe("Pset_Stationing");
		const props = psets[0].get("HasProperties") as EntityInstance[];
		expect(props).toHaveLength(1);
		expect(props[0].get("Name")).toBe("Station");
		expect((props[0].get("NominalValue") as EntityInstance).getByIndex(0)).toBe(2000.0);

		expect(referent.get("Positions")).toHaveLength(1);
		const relPositions = file.byType("IfcRelPositions");
		expect(relPositions).toHaveLength(1);
		expect((relPositions[0].get("RelatingPositioningElement") as EntityInstance).equals(referent)).toBe(true);
		expect((relPositions[0].get("RelatedProducts") as EntityInstance[])[0].equals(segment)).toBe(true);
	});
});
