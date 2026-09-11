// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_placement.py` (src/ifcopenshell-python, 42 lines) --
// that file covers only `TestGetStoreyElevationIFC4` (`test_run`/
// `test_getting_the_elevation_if_no_z_location`/`test_returning_0_as_a_fallback`, all
// ported verbatim below, class-scoped to IFC4 only in the real Python source, so this
// port uses `createTestFile("IFC4")` directly rather than `AVAILABLE_SCHEMAS`, matching
// Python's own real test scope). Every other test in this file is original coverage,
// written directly against `placement.py`'s own source / `placement.ts`'s port --
// matching `util/constraint.ts`'s established precedent for functions Python itself
// doesn't directly test, and per this chunk's own task brief's explicit instruction to
// pay special attention to a real, non-trivial nested-placement-hierarchy test that
// checks a final resolved world matrix *numerically* (the "nested placement
// composition order" describe block below), since that is exactly the kind of test
// that would catch a `mat4.multiply` argument-order or row/column-major regression --
// every expected matrix in that block was hand-derived independently (see its own
// comments) before being compared against this port's actual output, not reverse-
// engineered from whatever the implementation happened to produce.
//
// No `ifcopenshell.api.*` fixtures exist to port from for the non-`test_placement.py`
// coverage (`api.geometry.edit_object_placement`'s own test file,
// `test/api/geometry/test_edit_object_placement.py`, is a different, much-later-phase
// module -- see `placement.ts`'s own header comment for why its "decomposition/
// construction" functions are out of this chunk's scope entirely, not merely untested
// here). Local fixture helpers below build the underlying `IfcLocalPlacement`/
// `IfcAxis2Placement3D`/`IfcCartesianTransformationOperator3D`/`IfcMappedItem`/
// `IfcRepresentationMap` entity graphs directly (`file.createEntity(...)` + `.set(...)`),
// matching `test/util/element.test.ts`'s own established pattern for this exact same
// gap.
//
// The disclosed `ifcopenshell.geom` gap (`placement.ts`'s header comment,
// `getAxis2placement`'s `IfcAxis2PlacementLinear`-with-non-Cartesian-`Location` branch)
// is covered by a dedicated test guarded on `AVAILABLE_SCHEMAS.includes("IFC4X3")` --
// `IfcAxis2PlacementLinear`/`IfcPointByDistanceExpression` are IFC4X3-only EXPRESS
// types, so this genuinely cannot run under CI's current `SCHEMA_VERSIONS=4` (IFC4-only)
// build; it asserts the disclosed error is thrown, not silently skipped or faked.

import { mat4, vec3 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/placement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header
// comment) ---

function direction(file: IfcFile, ratios: number[]): EntityInstance {
	return file.createEntity("IfcDirection", ratios);
}

function point(file: IfcFile, coords: number[]): EntityInstance {
	return file.createEntity("IfcCartesianPoint", coords);
}

function axis2Placement3D(file: IfcFile, location: number[], axis?: number[], refDirection?: number[]): EntityInstance {
	const placement = file.createEntity("IfcAxis2Placement3D", point(file, location));
	if (axis) placement.set("Axis", direction(file, axis));
	if (refDirection) placement.set("RefDirection", direction(file, refDirection));
	return placement;
}

function localPlacement(
	file: IfcFile,
	relativePlacement: EntityInstance,
	relTo: EntityInstance | null = null,
): EntityInstance {
	const lp = file.createEntity("IfcLocalPlacement");
	if (relTo) lp.set("PlacementRelTo", relTo);
	lp.set("RelativePlacement", relativePlacement);
	return lp;
}

function cartesianTransformationOperator3D(
	file: IfcFile,
	localOrigin: number[],
	opts: { axis1?: number[]; axis2?: number[]; axis3?: number[]; scale?: number } = {},
): EntityInstance {
	const op = file.createEntity("IfcCartesianTransformationOperator3D", null, null, point(file, localOrigin));
	if (opts.axis1) op.set("Axis1", direction(file, opts.axis1));
	if (opts.axis2) op.set("Axis2", direction(file, opts.axis2));
	if (opts.axis3) op.set("Axis3", direction(file, opts.axis3));
	if (opts.scale !== undefined) op.set("Scale", opts.scale);
	return op;
}

function cartesianTransformationOperator3DnonUniform(
	file: IfcFile,
	localOrigin: number[],
	opts: { axis1?: number[]; axis2?: number[]; axis3?: number[]; scale?: number; scale2?: number; scale3?: number } = {},
): EntityInstance {
	const op = file.createEntity("IfcCartesianTransformationOperator3DnonUniform", null, null, point(file, localOrigin));
	if (opts.axis1) op.set("Axis1", direction(file, opts.axis1));
	if (opts.axis2) op.set("Axis2", direction(file, opts.axis2));
	if (opts.axis3) op.set("Axis3", direction(file, opts.axis3));
	if (opts.scale !== undefined) op.set("Scale", opts.scale);
	if (opts.scale2 !== undefined) op.set("Scale2", opts.scale2);
	if (opts.scale3 !== undefined) op.set("Scale3", opts.scale3);
	return op;
}

/** Reads a `mat4`'s translation column as a plain 3-tuple, for terse assertions. */
function translationOf(matrix: subject.MatrixType): [number, number, number] {
	const t = vec3.create();
	mat4.getTranslation(t, matrix);
	return [t[0], t[1], t[2]];
}

/** Transforms a local point by `matrix`, for terse assertions. */
function transform(matrix: subject.MatrixType, p: [number, number, number]): [number, number, number] {
	const out = vec3.create();
	vec3.transformMat4(out, p, matrix);
	return [out[0], out[1], out[2]];
}

function expectClose(actual: readonly number[], expected: readonly number[], precision = 9): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < actual.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], precision);
	}
}

// --- ported from test_placement.py (`TestGetStoreyElevationIFC4`, IFC4-only in the
// real Python source -- see this file's header comment) ---

describe("util.placement getStoreyElevation", () => {
	test("test_run", () => {
		const file = createTestFile("IFC4");
		const storey = file.createEntity("IfcBuildingStorey");
		const placement = file.createEntity("IfcLocalPlacement");
		placement.set("RelativePlacement", file.createEntity("IfcAxis2Placement3D", point(file, [0.0, 0.0, 3.0])));
		storey.set("ObjectPlacement", placement);
		expect(subject.getStoreyElevation(storey)).toBe(3.0);
	});

	test("test_getting_the_elevation_if_no_z_location", () => {
		const file = createTestFile("IFC4");
		const storey = file.createEntity("IfcBuildingStorey");
		storey.set("Elevation", 3.0);
		expect(subject.getStoreyElevation(storey)).toBe(3.0);
	});

	test("test_returning_0_as_a_fallback", () => {
		const file = createTestFile("IFC4");
		const storey = file.createEntity("IfcBuildingStorey");
		expect(subject.getStoreyElevation(storey)).toBe(0.0);
		const building = file.createEntity("IfcBuilding");
		expect(subject.getStoreyElevation(building)).toBe(0.0);
	});
});

// --- a2p ---

describe("util.placement a2p", () => {
	test("identity orientation with a translation produces a pure translation matrix", () => {
		const m = subject.a2p([10, 20, 30], [0, 0, 1], [1, 0, 0]);
		expectClose(translationOf(m), [10, 20, 30]);
		// basis vectors unrotated
		expectClose(transform(m, [1, 0, 0]), [11, 20, 30]);
		expectClose(transform(m, [0, 1, 0]), [10, 21, 30]);
		expectClose(transform(m, [0, 0, 1]), [10, 20, 31]);
	});

	test("a 90-degree-about-Z orientation (RefDirection along +Y) rotates the local X axis", () => {
		// z stays (0,0,1); x is supplied as (0,1,0) -- a2p normalizes x/z independently
		// and derives y = normalize(cross(z, x)), so the resulting basis is X=(0,1,0),
		// Y=(-1,0,0), Z=(0,0,1) (hand-derived, see this test's own assertions below).
		const m = subject.a2p([0, 0, 0], [0, 0, 1], [0, 1, 0]);
		expectClose(transform(m, [1, 0, 0]), [0, 1, 0]);
		expectClose(transform(m, [0, 1, 0]), [-1, 0, 0]);
		expectClose(transform(m, [0, 0, 1]), [0, 0, 1]);
	});

	test("normalizes non-unit input vectors (matching numpy's np.linalg.norm division)", () => {
		const m = subject.a2p([0, 0, 0], [0, 0, 5], [3, 0, 0]);
		expectClose(transform(m, [1, 0, 0]), [1, 0, 0]);
		expectClose(transform(m, [0, 0, 1]), [0, 0, 1]);
	});
});

// --- rotation() ---

describe("util.placement rotation", () => {
	test("90 degrees about X/Y/Z rotates known points as numpy's own formulas would", () => {
		expectClose(transform(subject.rotation(90, "X"), [0, 1, 0]), [0, 0, 1]);
		expectClose(transform(subject.rotation(90, "Y"), [0, 0, 1]), [1, 0, 0]);
		expectClose(transform(subject.rotation(90, "Z"), [1, 0, 0]), [0, 1, 0]);
	});

	test("isDegrees=false interprets the angle as radians", () => {
		expectClose(transform(subject.rotation(Math.PI / 2, "Z", false), [1, 0, 0]), [0, 1, 0]);
	});

	test("0 degrees is the identity matrix", () => {
		expect(Array.from(subject.rotation(0, "X"))).toEqual(Array.from(mat4.create()));
	});

	// Disclosed finding 3 (see placement.ts's header comment): Python's `rotation` has
	// no trailing `else` and implicitly returns `None` for an axis outside "X"/"Y"/"Z";
	// this port deliberately throws instead of silently returning the identity matrix
	// (a `/code-review`-caught fix -- silently returning a plausible-looking wrong
	// matrix would be worse than Python's own falsy `None`). Only reachable via an
	// explicit type bypass, since `axis`'s real type already excludes this at compile time.
	test("an axis outside X/Y/Z throws rather than silently returning the identity matrix", () => {
		expect(() => subject.rotation(90, "Q" as unknown as "X")).toThrow(/axis must be/);
	});
});

// --- getAxis2placement ---

describe("util.placement getAxis2placement", () => {
	test("IfcAxis2Placement3D with no Axis/RefDirection defaults to identity orientation", () => {
		const file = createTestFile("IFC4");
		const placement = axis2Placement3D(file, [1, 2, 3]);
		const m = subject.getAxis2placement(placement);
		expectClose(translationOf(m), [1, 2, 3]);
		expectClose(transform(m, [1, 0, 0]), [2, 2, 3]);
	});

	test("IfcAxis2Placement3D with an explicit rotated RefDirection", () => {
		const file = createTestFile("IFC4");
		const placement = axis2Placement3D(file, [0, 0, 0], [0, 0, 1], [0, 1, 0]);
		const m = subject.getAxis2placement(placement);
		expectClose(transform(m, [1, 0, 0]), [0, 1, 0]);
	});

	test("IfcAxis2Placement2D defaults to identity orientation and pads a 0 Z", () => {
		const file = createTestFile("IFC4");
		const placement = file.createEntity("IfcAxis2Placement2D", point(file, [5, 6]));
		const m = subject.getAxis2placement(placement);
		expectClose(translationOf(m), [5, 6, 0]);
	});

	test("IfcAxis2Placement2D with an explicit RefDirection", () => {
		const file = createTestFile("IFC4");
		const placement = file.createEntity("IfcAxis2Placement2D", point(file, [0, 0]));
		placement.set("RefDirection", file.createEntity("IfcDirection", [0, 1]));
		const m = subject.getAxis2placement(placement);
		expectClose(transform(m, [1, 0, 0]), [0, 1, 0]);
	});

	test("IfcAxis1Placement defaults Axis to +Z and always uses +X as RefDirection", () => {
		const file = createTestFile("IFC4");
		const placement = file.createEntity("IfcAxis1Placement", point(file, [7, 8, 9]));
		const m = subject.getAxis2placement(placement);
		expectClose(translationOf(m), [7, 8, 9]);
		expectClose(transform(m, [1, 0, 0]), [8, 8, 9]);
	});

	describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4X3"))(
		"IfcAxis2PlacementLinear with a non-Cartesian Location (%s)",
		(schemaName) => {
			test("throws the disclosed ifcopenshell.geom gap error, not a silent wrong answer", () => {
				const file = createTestFile(schemaName);
				// A minimal, schema-incomplete IfcPointByDistanceExpression is enough:
				// it has no `Coordinates` attribute at all (regardless of validity),
				// which is exactly the condition that trips Python's own geom fallback.
				const distancePoint = file.createEntity("IfcPointByDistanceExpression");
				const placement = file.createEntity("IfcAxis2PlacementLinear", distancePoint);
				expect(() => subject.getAxis2placement(placement)).toThrow(/ifcopenshell\.geom/);
			});
		},
	);
});

// --- getLocalPlacement, including the nested-hierarchy composition-order test ---

describe("util.placement getLocalPlacement", () => {
	test("undefined/null placement returns the identity matrix", () => {
		expect(Array.from(subject.getLocalPlacement())).toEqual(Array.from(mat4.create()));
		expect(Array.from(subject.getLocalPlacement(null))).toEqual(Array.from(mat4.create()));
	});

	test("a placement with no PlacementRelTo is its own axis2placement matrix", () => {
		const file = createTestFile("IFC4");
		const lp = localPlacement(file, axis2Placement3D(file, [1, 2, 3]));
		expectClose(translationOf(subject.getLocalPlacement(lp)), [1, 2, 3]);
	});

	// The critical test per this chunk's own task brief: a real, 3-level nested
	// placement hierarchy (site -> building -> storey) mixing translation AND
	// rotation, with every expected value hand-derived independently below (not
	// reverse-engineered from the implementation's own output) -- specifically
	// designed so that getting `mat4.multiply`'s argument order backwards (`local @
	// parent` instead of numpy's real `parent @ local`) produces a DIFFERENT,
	// distinguishable wrong answer, not one that happens to coincide by symmetry.
	describe("nested placement composition order (hand-derived expected matrices)", () => {
		// Level A ("site"): identity rotation, translated to (10,20,30).
		//   matrixA = translate(10,20,30).
		// Level B ("building"), relative to A: RefDirection=(0,1,0) with default
		// Axis=(0,0,1) rotates local +X to global +Y (a real 90-degree-about-Z
		// rotation, not just a translation), local origin at (1,2,3).
		//   matrixB_local columns: X=(0,1,0), Y=(-1,0,0), Z=(0,0,1), O=(1,2,3)
		//   (hand-derived: y = normalize(cross(z,x)) = normalize(cross((0,0,1),(0,1,0)))
		//   = normalize((-1,0,0)) = (-1,0,0)).
		//   Since matrixA has an identity rotation block, world_B = matrixA @
		//   matrixB_local simplifies to: rotation columns unchanged from matrixB_local,
		//   translation = matrixB_local's translation + matrixA's translation =
		//   (1+10, 2+20, 3+30) = (11,22,33).
		//   world_B rotation columns: X=(0,1,0), Y=(-1,0,0), Z=(0,0,1); translation
		//   =(11,22,33).
		// Level C ("storey"), relative to B: identity rotation locally, local origin
		// at (0,0,5).
		//   world_C rotation = world_B's rotation (unchanged, C adds no rotation).
		//   world_C translation = world_B.rotation @ (0,0,5) + world_B.translation
		//   = 5*worldB_Z_column + (11,22,33) = 5*(0,0,1) + (11,22,33) = (0,0,5)+(11,22,33)
		//   = (11,22,38).
		//
		// A backwards composition (`local @ parent` instead of `parent @ local`) would
		// instead give world_B.translation = R_B @ t_A + t_B = rotate((10,20,30) by
		// world_B's own rotation) + (1,2,3) = (10*(0,1,0)+20*(-1,0,0)+30*(0,0,1)) +
		// (1,2,3) = (-20,10,30) + (1,2,3) = (-19,12,33) -- a different, wrong answer
		// this test would catch.
		const file = createTestFile("IFC4");
		const siteLp = localPlacement(file, axis2Placement3D(file, [10, 20, 30]));
		const buildingLp = localPlacement(file, axis2Placement3D(file, [1, 2, 3], [0, 0, 1], [0, 1, 0]), siteLp);
		const storey = file.createEntity("IfcBuildingStorey");
		const storeyLp = localPlacement(file, axis2Placement3D(file, [0, 0, 5]), buildingLp);
		storey.set("ObjectPlacement", storeyLp);

		test("level A (site): pure translation", () => {
			expectClose(translationOf(subject.getLocalPlacement(siteLp)), [10, 20, 30]);
			expectClose(transform(subject.getLocalPlacement(siteLp), [1, 0, 0]), [11, 20, 30]);
		});

		test("level B (building): rotation composed with parent's translation", () => {
			const m = subject.getLocalPlacement(buildingLp);
			expectClose(translationOf(m), [11, 22, 33]);
			// rotation columns: local +X maps to world +Y direction (relative to the
			// translation), confirming the rotation survived the composition unchanged.
			expectClose(transform(m, [1, 0, 0]), [11, 23, 33]);
		});

		test("level C (storey): translation-only local placement combined through the rotated parent", () => {
			const m = subject.getLocalPlacement(storeyLp);
			expectClose(translationOf(m), [11, 22, 38]);
		});

		test("getStoreyElevation through the full nested chain reads the composed world Z", () => {
			expect(subject.getStoreyElevation(storey)).toBeCloseTo(38, 9);
		});
	});
});

// --- getCartesiantransformationoperator3d ---

describe("util.placement getCartesiantransformationoperator3d", () => {
	test("defaults to an identity-oriented, unscaled matrix with the given LocalOrigin as translation", () => {
		const file = createTestFile("IFC4");
		const op = cartesianTransformationOperator3D(file, [4, 5, 6]);
		const m = subject.getCartesiantransformationoperator3d(op);
		expectClose(translationOf(m), [4, 5, 6]);
		expectClose(transform(m, [1, 0, 0]), [5, 5, 6]);
	});

	test("a uniform Scale applies to all three axes", () => {
		const file = createTestFile("IFC4");
		const op = cartesianTransformationOperator3D(file, [0, 0, 0], { scale: 2 });
		const m = subject.getCartesiantransformationoperator3d(op);
		expectClose(transform(m, [1, 0, 0]), [2, 0, 0]);
		expectClose(transform(m, [0, 1, 0]), [0, 2, 0]);
		expectClose(transform(m, [0, 0, 1]), [0, 0, 2]);
	});

	// Disclosed finding 1 (see placement.ts's header comment): Scale uses a Python
	// truthy check, so an explicit Scale of exactly 0.0 is treated as *unset* and
	// falls back to the 1.0 default -- NOT an intentional zero-scale.
	test("an explicit Scale of exactly 0 is treated as unset (Python truthy-check quirk), not a real zero-scale", () => {
		const file = createTestFile("IFC4");
		const op = cartesianTransformationOperator3D(file, [0, 0, 0], { scale: 0 });
		const m = subject.getCartesiantransformationoperator3d(op);
		expectClose(transform(m, [1, 0, 0]), [1, 0, 0]);
	});

	test("IfcCartesianTransformationOperator3DnonUniform applies independent Scale2/Scale3", () => {
		const file = createTestFile("IFC4");
		const op = cartesianTransformationOperator3DnonUniform(file, [0, 0, 0], { scale: 2, scale2: 3, scale3: 4 });
		const m = subject.getCartesiantransformationoperator3d(op);
		expectClose(transform(m, [1, 0, 0]), [2, 0, 0]);
		expectClose(transform(m, [0, 1, 0]), [0, 3, 0]);
		expectClose(transform(m, [0, 0, 1]), [0, 0, 4]);
	});

	// Disclosed finding 1, the other half: unlike Scale1, Scale2/Scale3 use an
	// `is not None` check, so an explicit Scale2/Scale3 of exactly 0.0 IS honored as
	// a real zero-scale (a genuine, real difference from Scale1's own truthy check).
	test("an explicit Scale2 of exactly 0 IS honored as a real zero-scale, unlike Scale1", () => {
		const file = createTestFile("IFC4");
		const op = cartesianTransformationOperator3DnonUniform(file, [0, 0, 0], { scale: 2, scale2: 0 });
		const m = subject.getCartesiantransformationoperator3d(op);
		expectClose(transform(m, [1, 0, 0]), [2, 0, 0]);
		expectClose(transform(m, [0, 1, 0]), [0, 0, 0]);
		// Scale3 falls back to scale1 (2) since it was never given, matching Python's
		// `scale3 = inst.Scale3 if inst.Scale3 is not None else scale1`.
		expectClose(transform(m, [0, 0, 1]), [0, 0, 2]);
	});

	test("an Axis2 opposite the constructed Y axis mirrors (negates) the Y column", () => {
		const file = createTestFile("IFC4");
		// Axis1=(1,0,0), Axis3=(0,0,1) (both default) -> a2p's own constructed Y is
		// (0,1,0); supplying Axis2=(0,-1,0) is opposite of that, triggering the flip.
		const op = cartesianTransformationOperator3D(file, [0, 0, 0], { axis2: [0, -1, 0] });
		const m = subject.getCartesiantransformationoperator3d(op);
		expectClose(transform(m, [0, 1, 0]), [0, -1, 0]);
		// X and Z axes are unaffected by the Y-only mirror.
		expectClose(transform(m, [1, 0, 0]), [1, 0, 0]);
		expectClose(transform(m, [0, 0, 1]), [0, 0, 1]);
	});
});

// --- getMappeditemTransformation ---

describe("util.placement getMappeditemTransformation", () => {
	test("composes the cartesian transformation operator with the mapping origin (cartOp first, per Python's `@` order)", () => {
		const file = createTestFile("IFC4");
		const mappingOrigin = axis2Placement3D(file, [1, 0, 0]);
		const repMap = file.createEntity("IfcRepresentationMap");
		repMap.set("MappingOrigin", mappingOrigin);
		const op = cartesianTransformationOperator3D(file, [0, 10, 0]);
		const mappedItem = file.createEntity("IfcMappedItem");
		mappedItem.set("MappingSource", repMap);
		mappedItem.set("MappingTarget", op);

		const m = subject.getMappeditemTransformation(mappedItem);
		expect(m).not.toBeNull();
		// numpy: `get_cartesiantransformationoperator3d(target) @ m4` where
		// `m4 = get_axis2placement(mappingOrigin)` -- the operator's translation
		// (0,10,0) is added AFTER the mapping-origin's own translation (1,0,0), since
		// the operator matrix is the LEFT/outer operand (`op @ originMatrix`, not
		// `originMatrix @ op`).
		expectClose(translationOf(m as subject.MatrixType), [1, 10, 0]);
	});

	test("returns null when MappingTarget is not an IfcCartesianTransformationOperator3D (Python's own unaddressed 2D TODO)", () => {
		const file = createTestFile("IFC4");
		const mappingOrigin = axis2Placement3D(file, [0, 0, 0]);
		const repMap = file.createEntity("IfcRepresentationMap");
		repMap.set("MappingOrigin", mappingOrigin);
		const op2d = file.createEntity("IfcCartesianTransformationOperator2D", null, null, point(file, [0, 0]));
		const mappedItem = file.createEntity("IfcMappedItem");
		mappedItem.set("MappingSource", repMap);
		mappedItem.set("MappingTarget", op2d);

		expect(subject.getMappeditemTransformation(mappedItem)).toBeNull();
	});
});
