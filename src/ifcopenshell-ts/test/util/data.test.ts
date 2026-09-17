// This file was generated with the assistance of an AI coding tool.
//
// `test/util/test_data.py` does not exist anywhere in `src/ifcopenshell-python`
// (confirmed by a repo-wide search) -- `util/data.py` has no dedicated Python test file
// to port from, matching `util.constraint`'s/`util.representation`'s own established
// precedent for a module with no exact 1:1 Python test file (`PROGRESS.md`'s rows for
// those chunks). Every test below is therefore original coverage, written directly
// against `data.py`'s real source / `../../src/util/data.ts`'s own port.
//
// Covers `Clipping.parse`'s 4 accepted shapes (entity/`Clipping`/dict-with-location-and-
// normal/dict-with-matrix) and its real thrown-error conditions, plus `Clipping.apply`'s
// own geometry construction -- the `x_axis` arbitrary-vector-selection branch (both the
// "normal is close to +/-Z" and "normal is not close to Z" cases), unit-scale conversion
// (location only, never normal), and the `ifcFile: null` default-to-`firstOperand.file`
// path -- run against `AVAILABLE_SCHEMAS` since `util/data.ts`'s own header comment
// confirms every entity class `apply` constructs is identical across all 3 schemas
// (matching real Python's own `TestClipSolidIFC2X3` coverage of the same code path via
// `clip_solid`).

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import { Clipping } from "../../src/util/data";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("util.data.Clipping (%s)", (schema) => {
	describe("parse", () => {
		test("returns an IfcBooleanResult entity as-is", () => {
			const file = createTestFile(schema);
			const solid = file.createEntity("IfcExtrudedAreaSolid");
			const halfSpace = file.createEntity("IfcHalfSpaceSolid", file.createEntity("IfcPlane"), false);
			const boolResult = file.createEntity("IfcBooleanResult", "DIFFERENCE", solid, halfSpace);

			expect(Clipping.parse(boolResult)).toBe(boolResult);

			file.dispose();
		});

		test("throws for an entity of an unexpected IFC class", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");

			expect(() => Clipping.parse(wall)).toThrow(/unexpected IFC class/);

			file.dispose();
		});

		test("returns a Clipping instance as-is", () => {
			const clipping = new Clipping({ location: [0, 0, 3], normal: [0, 0, 1] });
			expect(Clipping.parse(clipping)).toBe(clipping);
		});

		test("parses a dict with location and normal", () => {
			const result = Clipping.parse({ location: [1, 2, 3], normal: [0, 0, 1] });
			expect(result).toBeInstanceOf(Clipping);
			const clipping = result as Clipping;
			expect(clipping.location).toEqual([1, 2, 3]);
			expect(clipping.normal).toEqual([0, 0, 1]);
			expect(clipping.type).toBe("IfcBooleanClippingResult");
			expect(clipping.operandType).toBe("IfcHalfSpaceSolid");
		});

		test("parses a dict with a matrix, deriving normal/location from columns 2/3", () => {
			// Row-major 4x4: identity rotation, translated to (10, 20, 30) -- column 2
			// (the Z axis) is [0,0,1], column 3 (the origin) is [10,20,30]. See
			// `../../src/util/data.ts`'s own header comment for the full column-slice
			// verification against `util/shapeBuilder.ts`'s own `createAxis2Placement3dFromMatrix`.
			const matrix = [
				[1, 0, 0, 10],
				[0, 1, 0, 20],
				[0, 0, 1, 30],
				[0, 0, 0, 1],
			];
			const result = Clipping.parse({ matrix });
			expect(result).toBeInstanceOf(Clipping);
			const clipping = result as Clipping;
			expect(clipping.normal).toEqual([0, 0, 1]);
			expect(clipping.location).toEqual([10, 20, 30]);
		});

		test("throws for a dict with an unexpected result type", () => {
			expect(() => Clipping.parse({ location: [0, 0, 0], normal: [0, 0, 1], type: "IfcBooleanResult" })).toThrow(
				/unexpected result type/,
			);
		});

		test("throws for a dict with an unexpected operand type", () => {
			expect(() =>
				Clipping.parse({ location: [0, 0, 0], normal: [0, 0, 1], operandType: "IfcCsgPrimitive3D" }),
			).toThrow(/unexpected operand type/);
		});

		test("throws for a dict missing both location/normal and matrix", () => {
			// biome-ignore lint/suspicious/noExplicitAny: deliberately malformed input.
			expect(() => Clipping.parse({} as any)).toThrow();
		});

		test("throws for a genuinely unexpected type (neither entity, Clipping, nor dict)", () => {
			// biome-ignore lint/suspicious/noExplicitAny: deliberately malformed input.
			expect(() => Clipping.parse(5 as any)).toThrow(/Unexpected clipping type provided/);
			// biome-ignore lint/suspicious/noExplicitAny: deliberately malformed input.
			expect(() => Clipping.parse("foo" as any)).toThrow(/Unexpected clipping type provided/);
			// biome-ignore lint/suspicious/noExplicitAny: deliberately malformed input.
			expect(() => Clipping.parse(null as any)).toThrow(/Unexpected clipping type provided/);
		});
	});

	describe("apply", () => {
		function makeExtrusion(file: ReturnType<typeof createTestFile>): EntityInstance {
			return file.createEntity("IfcExtrudedAreaSolid");
		}

		test("returns an IfcBooleanClippingResult wrapping an IfcHalfSpaceSolid", () => {
			const file = createTestFile(schema);
			const extrusion = makeExtrusion(file);
			const clipping = new Clipping({ location: [0, 0, 3], normal: [0, 0, 1] });

			const result = clipping.apply(file, extrusion, 1.0);

			expect(result.isA("IfcBooleanClippingResult")).toBe(true);
			expect(result.get("Operator")).toBe("DIFFERENCE");
			expect((result.get("FirstOperand") as EntityInstance).equals(extrusion)).toBe(true);
			const secondOperand = result.get("SecondOperand") as EntityInstance;
			expect(secondOperand.isA("IfcHalfSpaceSolid")).toBe(true);
			expect(secondOperand.get("AgreementFlag")).toBe(false);

			file.dispose();
		});

		test("the clipping plane's location matches (unit-scale applied to location, not normal)", () => {
			const file = createTestFile(schema);
			const extrusion = makeExtrusion(file);
			const clipping = new Clipping({ location: [0, 0, 2], normal: [0, 0, 1] });

			const result = clipping.apply(file, extrusion, 0.001); // mm project units

			const plane = (result.get("SecondOperand") as EntityInstance).get("BaseSurface") as EntityInstance;
			const position = plane.get("Position") as EntityInstance;
			const location = position.get("Location") as EntityInstance;
			expect(location.get("Coordinates")).toEqual([0, 0, 2000]);
			const axis = position.get("Axis") as EntityInstance;
			expect(axis.get("DirectionRatios")).toEqual([0, 0, 1]);

			file.dispose();
		});

		test("x_axis is derived via the [0,1,0] arbitrary vector when normal is close to +/-Z", () => {
			const file = createTestFile(schema);
			const extrusion = makeExtrusion(file);

			for (const normal of [
				[0, 0, 1],
				[0, 0, -1],
			] as const) {
				const clipping = new Clipping({ location: [0, 0, 0], normal });
				const result = clipping.apply(file, extrusion, 1.0);
				const plane = (result.get("SecondOperand") as EntityInstance).get("BaseSurface") as EntityInstance;
				const position = plane.get("Position") as EntityInstance;
				const refDirection = position.get("RefDirection") as EntityInstance;
				// cross(normal, [0,1,0]) normalized.
				const expected = normal[2] === 1 ? [-1, 0, 0] : [1, 0, 0];
				const actual = refDirection.get("DirectionRatios") as number[];
				expect(actual[0]).toBeCloseTo(expected[0], 9);
				expect(actual[1]).toBeCloseTo(expected[1], 9);
				expect(actual[2]).toBeCloseTo(expected[2], 9);
			}

			file.dispose();
		});

		test("x_axis is derived via the [0,0,1] arbitrary vector when normal is not close to Z", () => {
			const file = createTestFile(schema);
			const extrusion = makeExtrusion(file);
			const clipping = new Clipping({ location: [0, 0, 0], normal: [1, 0, 0] });

			const result = clipping.apply(file, extrusion, 1.0);

			const plane = (result.get("SecondOperand") as EntityInstance).get("BaseSurface") as EntityInstance;
			const position = plane.get("Position") as EntityInstance;
			const refDirection = position.get("RefDirection") as EntityInstance;
			// cross([1,0,0], [0,0,1]) = (0*1-0*0, 0*0-1*1, 1*0-0*0) = (0,-1,0), already unit length.
			expect(refDirection.get("DirectionRatios")).toEqual([0, -1, 0]);

			file.dispose();
		});

		test("defaults ifcFile to firstOperand.file when null", () => {
			const file = createTestFile(schema);
			const extrusion = makeExtrusion(file);
			const clipping = new Clipping({ location: [0, 0, 0], normal: [0, 0, 1] });

			const result = clipping.apply(null, extrusion, 1.0);

			expect(result.file).toBe(file);

			file.dispose();
		});
	});
});
