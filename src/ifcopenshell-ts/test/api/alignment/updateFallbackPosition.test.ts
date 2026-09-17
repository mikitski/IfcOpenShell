// This file was generated with the assistance of an AI coding tool.
//
// Real Python's own `test_update_fallback_position.py` builds its fixture via
// `ifcopenshell.api.alignment.create_by_pi_method`/`get_basis_curve`, then places an
// `IfcAxis2PlacementLinear.Location` as a real `IfcPointByDistanceExpression` --
// neither of which is in this chunk's scope, and the latter would only re-exercise
// the ALREADY-DISCLOSED, unrelated `getAxis2placement` geometry-kernel gap (see
// `../../../src/api/alignment/updateFallbackPosition.ts`'s own header comment), not
// this function's own logic. This file instead builds an `IfcAxis2PlacementLinear`
// whose `Location` is a real `IfcCartesianPoint` (a valid, if for this module unusual,
// concrete `IfcPoint` subtype -- NOT a schema violation), exercising the exact same
// `a2p`/coordinate-extraction logic `update_fallback_position` itself always runs,
// with hand-picked, easy-to-verify-by-hand rotation/translation values. Gated to
// IFC4X3.

import { describe, expect, test } from "vitest";
import { updateFallbackPosition } from "../../../src/api/alignment/updateFallbackPosition";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** An `IfcAxis2PlacementLinear` with a `Location` set to a real `IfcCartesianPoint`
 * (see this file's own header comment for why this is a valid, not a hacked, fixture). */
function linearPlacementAt(
	file: IfcFile,
	origin: readonly [number, number, number],
	axis?: readonly [number, number, number],
	refDirection?: readonly [number, number, number],
): EntityInstance {
	const location = file.createEntity("IfcCartesianPoint", [...origin]);
	return file.createEntity(
		"IfcAxis2PlacementLinear",
		location,
		axis ? file.createEntity("IfcDirection", [...axis]) : null,
		refDirection ? file.createEntity("IfcDirection", [...refDirection]) : null,
	);
}

function approxEqual(actual: readonly number[], expected: readonly number[]): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], 10);
	}
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.updateFallbackPosition (IFC4X3)", () => {
	test("creates CartesianPosition/RefDirection/Axis from scratch when missing, and computes the correct fallback position", () => {
		const file = createTestFile("IFC4X3");
		// z-axis (Axis) = +X, x-axis (RefDirection) = +Y -- a real 90-degree rotation,
		// not the identity, so RefDirection/Axis extraction is actually exercised.
		const relativePlacement = linearPlacementAt(file, [10, 20, 30], [1, 0, 0], [0, 1, 0]);
		const lp = file.createEntity("IfcLinearPlacement", null, relativePlacement, null);

		expect(lp.get("CartesianPosition")).toBeNull();

		updateFallbackPosition(file, lp);

		const cartesianPosition = lp.get("CartesianPosition") as EntityInstance;
		expect(cartesianPosition).not.toBeNull();
		approxEqual((cartesianPosition.get("Location") as EntityInstance).get("Coordinates") as number[], [10, 20, 30]);
		approxEqual(
			(cartesianPosition.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
			[0, 1, 0],
		);
		approxEqual((cartesianPosition.get("Axis") as EntityInstance).get("DirectionRatios") as number[], [1, 0, 0]);
	});

	test("reuses (does not replace) an existing CartesianPosition/RefDirection/Axis, only updating their values", () => {
		const file = createTestFile("IFC4X3");
		const relativePlacement = linearPlacementAt(file, [5, 6, 7]);
		const lp = file.createEntity("IfcLinearPlacement", null, relativePlacement, null);

		const existingRefDirection = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
		const existingAxis = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
		const existingCartesianPosition = file.createEntity(
			"IfcAxis2Placement3D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]),
			existingAxis,
			existingRefDirection,
		);
		lp.set("CartesianPosition", existingCartesianPosition);

		updateFallbackPosition(file, lp);

		const cartesianPosition = lp.get("CartesianPosition") as EntityInstance;
		expect(cartesianPosition.equals(existingCartesianPosition)).toBe(true);
		expect((cartesianPosition.get("RefDirection") as EntityInstance).equals(existingRefDirection)).toBe(true);
		expect((cartesianPosition.get("Axis") as EntityInstance).equals(existingAxis)).toBe(true);
		approxEqual((cartesianPosition.get("Location") as EntityInstance).get("Coordinates") as number[], [5, 6, 7]);
		approxEqual(
			(cartesianPosition.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
			[1, 0, 0],
		);
		approxEqual((cartesianPosition.get("Axis") as EntityInstance).get("DirectionRatios") as number[], [0, 0, 1]);
	});
});
