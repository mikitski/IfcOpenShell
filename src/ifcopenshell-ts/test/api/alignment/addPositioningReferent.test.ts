// This file was generated with the assistance of an AI coding tool.
//
// Real Python's own `test_add_positioning_referent.py` builds its fixture via
// `ifcopenshell.api.alignment.create` (not in this chunk's scope), and both of its own
// tests exercise the composite-curve branch, which real Python's own `Pset_Stationing
// .Station == 2000.0` assertion confirms works fully end to end THERE -- but this port
// currently cannot reach that assertion at all, for either of this function's two
// branches, due to 2 independent, already-disclosed primitive-layer gaps (see
// `../../../src/api/alignment/addPositioningReferent.ts`'s own header comment for the
// full writeup, confirmed EMPIRICALLY against this chunk's own built native addon
// before writing this file). This suite instead pins the CURRENT, disclosed, blocked
// behavior for both branches -- a composite-curve `alignment` (no side effect at all)
// and a no-representation `alignment` (a real `IfcReferent`/`Pset_Stationing` shell IS
// created before the throw) -- matching this project's established
// `addConversionBasedUnit.test.ts`/`editPset.test.ts` precedent for pinning a
// currently-blocked function rather than skipping its test file outright.

import { describe, expect, test } from "vitest";
import { addPositioningReferent } from "../../../src/api/alignment/addPositioningReferent";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const BLOCKED_ERROR = "Attribute access is only supported on entity instances";

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
	test("composite-curve branch: throws at the disclosed IfcLengthMeasure gap, before any IfcReferent is created", () => {
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

		expect(() => addPositioningReferent(file, "P.C.", alignment, 0.0, 100.0, alignment)).toThrow(BLOCKED_ERROR);

		// No side effect at all -- real Python would materialize the IfcLengthMeasure
		// BEFORE creating the IfcLinearPlacement/IfcReferent/IfcRelPositions.
		expect(file.byType("IfcReferent")).toHaveLength(0);
		expect(file.byType("IfcRelPositions")).toHaveLength(0);
	});

	test("no-representation (fallback placement) branch: builds a real IfcReferent + empty Pset_Stationing, then throws at the disclosed editPset gap", () => {
		const file = createTestFile("IFC4X3");
		const alignment = alignmentAt(file, [10, 20, 0]);
		const segment = file.createEntity("IfcBuildingElementProxy", guid.new(), null, "Sign");

		expect(() => addPositioningReferent(file, "P.C.", alignment, 0.0, 2000.0, segment)).toThrow(BLOCKED_ERROR);

		// Unlike the composite-curve branch, real side effects DID already happen --
		// matching real Python's own identical non-transactional "no rollback on
		// exception" behavior.
		const referents = file.byType("IfcReferent");
		expect(referents).toHaveLength(1);
		const referent = referents[0];
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

		// addPset succeeded (a real, empty IfcPropertySet exists) but editPset never got
		// to write the Station property.
		const psets = file.byType("IfcPropertySet");
		expect(psets).toHaveLength(1);
		expect(psets[0].get("Name")).toBe("Pset_Stationing");
		expect(psets[0].get("HasProperties")).toBeNull();

		// The blocked editPset call happens before IfcRelPositions is ever created.
		expect(file.byType("IfcRelPositions")).toHaveLength(0);
	});
});
