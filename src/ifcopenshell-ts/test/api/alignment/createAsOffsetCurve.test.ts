// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `create_as_offset_curve.py` (confirmed by
// reading the whole real test directory). Original test coverage written here, gated
// to IFC4X3.
//
// Every real invocation of `createAsOffsetCurve` currently throws inside the
// already-landed `_createOffsetCurveRepresentation` (chunk 6) -- either its own real,
// portable `offsets[i].isA()` type-check (a genuinely fully-portable, real assertion),
// or its own already-disclosed `IfcCurve.Dim` EXPRESS DERIVED-attribute gap (see
// `createAsOffsetCurve.ts`'s own header comment). Both tests below confirm the real
// `IfcAlignment` entity is ALREADY created in the file by the time either throw
// happens -- pinning that real orchestration logic (guid creation, entity
// construction) genuinely runs before the disclosed blocker, not that the whole
// function is a no-op stub.

import { describe, expect, test } from "vitest";
import { createAsOffsetCurve } from "../../../src/api/alignment/createAsOffsetCurve";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function dummyBasisCurve(file: IfcFile): EntityInstance {
	return file.createEntity("IfcPolyline", [
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
	]);
}

function pointByDistanceExpression(file: IfcFile, basisCurve: EntityInstance): EntityInstance {
	// Raw-number-at-construction technique for `IfcCurveMeasureSelect`-typed
	// `DistanceAlong` -- established since chunk 2.
	return file.createEntity("IfcPointByDistanceExpression", 0.0, null, null, null, basisCurve);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createAsOffsetCurve (IFC4X3)", () => {
	test("throws a real, portable TypeError for an invalid offsets element, with the IfcAlignment already created", () => {
		const file = createTestFile("IFC4X3");
		const notAnOffset = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
		const alignmentCountBefore = file.byType("IfcAlignment").length;

		expect(() => createAsOffsetCurve(file, "A1", [notAnOffset])).toThrow(
			/Expected IfcPointByDistanceExpression but got IfcCartesianPoint/,
		);

		expect(file.byType("IfcAlignment").length).toBe(alignmentCountBefore + 1);
		expect(file.byType("IfcAlignment")[alignmentCountBefore].get("Name")).toBe("A1");
	});

	test("throws the already-disclosed Dim gap for valid offsets, with the IfcAlignment already created", () => {
		const file = createTestFile("IFC4X3");
		const basisCurve = dummyBasisCurve(file);
		const offset = pointByDistanceExpression(file, basisCurve);
		const alignmentCountBefore = file.byType("IfcAlignment").length;

		expect(() => createAsOffsetCurve(file, "A2", [offset])).toThrow();

		expect(file.byType("IfcAlignment").length).toBe(alignmentCountBefore + 1);
	});

	test("real, CONFIRMED Python quirk: startStation is accepted but never used -- identical behavior regardless of its value", () => {
		const file1 = createTestFile("IFC4X3");
		const file2 = createTestFile("IFC4X3");
		const offset1 = pointByDistanceExpression(file1, dummyBasisCurve(file1));
		const offset2 = pointByDistanceExpression(file2, dummyBasisCurve(file2));

		let error1: unknown;
		let error2: unknown;
		try {
			createAsOffsetCurve(file1, "A", [offset1], 0.0);
		} catch (e) {
			error1 = e;
		}
		try {
			createAsOffsetCurve(file2, "A", [offset2], 12345.678);
		} catch (e) {
			error2 = e;
		}

		expect(error1).toBeInstanceOf(Error);
		expect(error2).toBeInstanceOf(Error);
		expect((error1 as Error).message).toBe((error2 as Error).message);
	});
});
