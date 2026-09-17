// This file was generated with the assistance of an AI coding tool.
//
// Real Python's own `test_add_stationing_referent.py` builds its fixture via
// `ifcopenshell.api.alignment.create(..., include_vertical=True)` (not in this chunk's
// scope), and all 3 of its own tests exercise the composite-curve branch (on
// `get_basis_curve`) -- which works fully end to end in real Python, but is currently
// blocked in this port by 2 independent, already-disclosed primitive-layer gaps (see
// `../../../src/api/alignment/addPositioningReferent.ts`'s own header comment, reused
// verbatim by `../../../src/api/alignment/addStationingReferent.ts`'s own header
// comment, for the full writeup). This suite pins the CURRENT, disclosed, blocked
// behavior for both placement branches, PLUS an original test confirming
// `onBasisCurve`'s own curve-selection logic (`getBasisCurve` vs. `getCurve`) still
// runs correctly despite the blocker -- observable because the two curve choices hit
// DIFFERENT gaps (the basis curve is a real composite curve; the non-basis curve, in
// this fixture, deliberately is not).

import { describe, expect, test } from "vitest";
import { addStationingReferent } from "../../../src/api/alignment/addStationingReferent";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const BLOCKED_ERROR = "Attribute access is only supported on entity instances";

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
	test("composite basis-curve branch (default onBasisCurve): throws at the disclosed IfcLengthMeasure gap, before any IfcReferent is created", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [1, 2, 0]);
		addRepresentations(file, alignment, [
			{ identifier: "FootPrint", type: "Curve2D", items: [realCompositeCurve(file)] },
		]);

		expect(() => addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0)).toThrow(BLOCKED_ERROR);
		expect(file.byType("IfcReferent")).toHaveLength(0);
	});

	test("no-representation (fallback placement) branch: builds a real IfcReferent + empty Pset_Stationing, then throws at the disclosed editPset gap", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [5, 6, 0]);

		expect(() => addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0)).toThrow(BLOCKED_ERROR);

		const referents = file.byType("IfcReferent");
		expect(referents).toHaveLength(1);
		expect(referents[0].get("Name")).toBe("1+00.0");
		expect(referents[0].get("PredefinedType")).toBe("STATION");
		expect((referents[0].get("ObjectPlacement") as EntityInstance).isA("IfcLocalPlacement")).toBe(true);

		const psets = file.byType("IfcPropertySet");
		expect(psets).toHaveLength(1);
		expect(psets[0].get("Name")).toBe("Pset_Stationing");
		expect(psets[0].get("HasProperties")).toBeNull();

		// The blocked editPset call happens before getStationingNest/_sortNest ever runs.
		expect(file.byType("IfcRelNests")).toHaveLength(0);
	});

	test("onBasisCurve=false selects getCurve (not getBasisCurve) -- observable because the two curves hit DIFFERENT gaps in this fixture", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [0, 0, 0]);
		// FootPrint/Curve2D (the basis curve) is a real composite curve -- hits gap 1
		// immediately. Axis/Curve2D (get_curve) is a plain, non-composite IfcPolyline --
		// takes the fully-portable else branch, and only then hits gap 2 (editPset).
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
		// throws immediately at gap 1, no side effect.
		expect(() => addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0, null, null)).toThrow(BLOCKED_ERROR);
		expect(file.byType("IfcReferent")).toHaveLength(0);

		// onBasisCurve=false: resolves the Axis IfcPolyline instead -- NOT an
		// IfcCompositeCurve, so it takes the fallback-placement else branch, creates a
		// real IfcReferent, and only then throws at gap 2.
		expect(() => addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0, null, false)).toThrow(BLOCKED_ERROR);
		expect(file.byType("IfcReferent")).toHaveLength(1);
	});

	test("IncomingStation, when given, is added to the same (blocked) editPset call -- confirmed unreachable independently of Station", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [0, 0, 0]);

		expect(() => addStationingReferent(file, "1+00.0", alignment, 0.0, 100.0, 50.0)).toThrow(BLOCKED_ERROR);
		// Still only 1 referent, still an empty pset -- IncomingStation never gets
		// written either, since Station (inserted first) already throws.
		const psets = file.byType("IfcPropertySet");
		expect(psets[0].get("HasProperties")).toBeNull();
	});
});
