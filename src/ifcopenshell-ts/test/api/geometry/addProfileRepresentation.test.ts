// This file was generated with the assistance of an AI coding tool.
//
// Ports `test/api/geometry/test_add_profile_representation.py`'s real
// `TestAddProfileRepresentation.test_run` -- but its own fixture (`ShapeBuilder(self.
// file).profile(builder.rectangle((100, 100)))`) builds an `IfcArbitraryClosedProfileDef`
// (NOT an `IfcRectangleProfileDef`), which is OUTSIDE the 10-class allowlist
// `../../../src/api/geometry/addProfileRepresentation.ts`'s own `getX`/`getY` special-
// case -- so real Python's own `test_run`, called with `cardinal_point="bottom left"`/`1`,
// genuinely exercises the geometry-kernel path on EVERY schema, always (confirmed by
// reading `ifcopenshell.util.shape_builder.ShapeBuilder.profile`'s real source directly:
// it always returns `IfcArbitraryClosedProfileDef`, never a named parametric profile
// class). `test_run` is therefore ported below as a dedicated "throws the disclosed
// blocked error" test (`arbitraryProfile`, a hand-built `IfcArbitraryClosedProfileDef`
// via raw `file.createEntity` calls -- NOT `util/shapeBuilder.ts`'s own `ShapeBuilder`
// class, which has its own separate, already-disclosed, unrelated `rectangle()`/
// `IfcLineIndex` gap that would throw for a completely different reason on IFC4/IFC4X3;
// see that file's own header comment), run against `AVAILABLE_SCHEMAS` uniformly (no
// hardcoded `describe("... (IFC2X3)")`).
//
// Every other test below is original coverage, written directly against
// `add_profile_representation.py`'s real source, exercising the FULLY PORTED, non-
// blocked majority of this function: every named parametric profile class `getX`/`getY`
// special-cases (`IfcRectangleProfileDef`/`IfcCircleProfileDef`/`IfcEllipseProfileDef`/
// `IfcIShapeProfileDef`/`IfcAsymmetricIShapeProfileDef`/`IfcCShapeProfileDef`/
// `IfcLShapeProfileDef`/`IfcTShapeProfileDef`/`IfcUShapeProfileDef`/
// `IfcZShapeProfileDef`), every cardinal point that needs no kernel call at all
// (falsy/`null`, `"mid-depth centre"`, numeric `5`, and the unimplemented-upstream
// `"geometric centroid"`-and-beyond range), `clippings` (both the `Clipping`-object and
// existing-`IfcBooleanResult` forms, plus the never-aliases-the-caller's-array
// property), `placementZxAxes`, and unit-scale conversion of `depth`.
//
// One dedicated regression test pins the real, disclosed, PRE-EXISTING upstream-Python
// bug found while porting this file (see `addProfileRepresentation.ts`'s own header
// comment): `IfcAsymmetricIShapeProfileDef`'s `getX` reads `OverallWidth`, an IFC2X3-ONLY
// attribute name (renamed to `BottomFlangeWidth` in IFC4/IFC4X3's own real EXPRESS
// schema) -- so this profile class's `getX` (not `getY`) genuinely throws on IFC4/IFC4X3
// in real upstream Python too, not just in this port.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { CARDINAL_POINT_VALUES, addProfileRepresentation } from "../../../src/api/geometry/addProfileRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { Clipping } from "../../../src/util/data";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Matches `../geometry/addWallRepresentation.test.ts`'s own identical fixture. */
function bodyContext(file: IfcFile): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Body",
		targetView: "MODEL_VIEW",
		parent: model,
	});
}

/** IFC2X3 requires a real (non-null) `IfcAxis2Placement2D` on every parametric profile. */
function position2D(file: IfcFile): EntityInstance | null {
	if (file.schema !== "IFC2X3") return null;
	return file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0]), null);
}

function rectangleProfile(file: IfcFile, xDim: number, yDim: number): EntityInstance {
	return file.createEntity("IfcRectangleProfileDef", "AREA", null, position2D(file), xDim, yDim);
}

function circleProfile(file: IfcFile, radius: number): EntityInstance {
	return file.createEntity("IfcCircleProfileDef", "AREA", null, position2D(file), radius);
}

function ellipseProfile(file: IfcFile, semiAxis1: number, semiAxis2: number): EntityInstance {
	return file.createEntity("IfcEllipseProfileDef", "AREA", null, position2D(file), semiAxis1, semiAxis2);
}

function iShapeProfile(
	file: IfcFile,
	overallWidth: number,
	overallDepth: number,
	webThickness: number,
	flangeThickness: number,
): EntityInstance {
	return file.createEntity(
		"IfcIShapeProfileDef",
		"AREA",
		null,
		position2D(file),
		overallWidth,
		overallDepth,
		webThickness,
		flangeThickness,
	);
}

/** IFC2X3's own `OverallWidth`/`OverallDepth` (real, positional-order match). */
function asymmetricIShapeProfileIfc2x3(
	file: IfcFile,
	overallWidth: number,
	overallDepth: number,
	webThickness: number,
	flangeThickness: number,
): EntityInstance {
	return file.createEntity(
		"IfcAsymmetricIShapeProfileDef",
		"AREA",
		null,
		position2D(file),
		overallWidth,
		overallDepth,
		webThickness,
		flangeThickness,
	);
}

/** IFC4/IFC4X3's own real `BottomFlangeWidth`/`OverallDepth` (no `OverallWidth` attribute exists). */
function asymmetricIShapeProfileIfc4Plus(
	file: IfcFile,
	bottomFlangeWidth: number,
	overallDepth: number,
	webThickness: number,
	bottomFlangeThickness: number,
): EntityInstance {
	return file.createEntity(
		"IfcAsymmetricIShapeProfileDef",
		"AREA",
		null,
		null,
		bottomFlangeWidth,
		overallDepth,
		webThickness,
		bottomFlangeThickness,
	);
}

function cShapeProfile(
	file: IfcFile,
	depth: number,
	width: number,
	wallThickness: number,
	girth: number,
): EntityInstance {
	return file.createEntity("IfcCShapeProfileDef", "AREA", null, position2D(file), depth, width, wallThickness, girth);
}

function lShapeProfile(file: IfcFile, depth: number, width: number, thickness: number): EntityInstance {
	return file.createEntity("IfcLShapeProfileDef", "AREA", null, position2D(file), depth, width, thickness);
}

function tShapeProfile(
	file: IfcFile,
	depth: number,
	flangeWidth: number,
	webThickness: number,
	flangeThickness: number,
): EntityInstance {
	return file.createEntity(
		"IfcTShapeProfileDef",
		"AREA",
		null,
		position2D(file),
		depth,
		flangeWidth,
		webThickness,
		flangeThickness,
	);
}

function uShapeProfile(
	file: IfcFile,
	depth: number,
	flangeWidth: number,
	webThickness: number,
	flangeThickness: number,
): EntityInstance {
	return file.createEntity(
		"IfcUShapeProfileDef",
		"AREA",
		null,
		position2D(file),
		depth,
		flangeWidth,
		webThickness,
		flangeThickness,
	);
}

function zShapeProfile(
	file: IfcFile,
	depth: number,
	flangeWidth: number,
	webThickness: number,
	flangeThickness: number,
): EntityInstance {
	return file.createEntity(
		"IfcZShapeProfileDef",
		"AREA",
		null,
		position2D(file),
		depth,
		flangeWidth,
		webThickness,
		flangeThickness,
	);
}

/**
 * A hand-built `IfcArbitraryClosedProfileDef` (a closed rectangle curve) -- deliberately
 * NOT built via `util/shapeBuilder.ts`'s `ShapeBuilder` class, whose own `rectangle()`
 * throws on IFC4/IFC4X3 for a separate, unrelated, already-disclosed reason (see this
 * file's own header comment). Matches real Python's own fixture shape (an arbitrary,
 * non-parametric closed profile) closely enough to exercise the real, disclosed
 * geometry-kernel-blocked path uniformly across all 3 schemas.
 */
function arbitraryProfile(file: IfcFile, size: number): EntityInstance {
	const points: readonly [number, number][] = [
		[0.0, 0.0],
		[size, 0.0],
		[size, size],
		[0.0, size],
		[0.0, 0.0],
	];
	let curve: EntityInstance;
	if (file.schema === "IFC2X3") {
		curve = file.createEntity(
			"IfcPolyline",
			points.map((p) => file.createEntity("IfcCartesianPoint", [p[0], p[1]])),
		);
	} else {
		curve = file.createEntity(
			"IfcIndexedPolyCurve",
			file.createEntity(
				"IfcCartesianPointList2D",
				points.map((p) => [p[0], p[1]]),
			),
			null,
			null,
		);
	}
	return file.createEntity("IfcArbitraryClosedProfileDef", "AREA", null, curve);
}

const KERNEL_BLOCKED_ERROR = /needs a real geometry kernel/;

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addProfileRepresentation (%s)", (schema) => {
	test("real Python's own test_run fixture (an arbitrary, non-parametric profile) hits the disclosed geometry-kernel blocker -- ported as a blocked-error pin, not a real assertion (see this file's header comment)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = arbitraryProfile(file, 100);

		// Real Python: representation.Items[0].Position.Location.Coordinates == (-50.0, 50.0, 0.0)
		// for both cardinal_point="bottom left" and cardinal_point=1 -- unreachable here
		// without a real geometry kernel to compute the arbitrary profile's own bounding
		// box, since `IfcArbitraryClosedProfileDef` is outside the 10-class allowlist.
		expect(() =>
			addProfileRepresentation(file, { context: body, profile, depth: 1000, cardinalPoint: "bottom left" }),
		).toThrow(KERNEL_BLOCKED_ERROR);
		expect(() => addProfileRepresentation(file, { context: body, profile, depth: 1000, cardinalPoint: 1 })).toThrow(
			KERNEL_BLOCKED_ERROR,
		);

		file.dispose();
	});

	test("the SAME arbitrary profile + cardinalPoint combination that doesn't need getX/getY (default, no offset) succeeds -- never throws proactively", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = arbitraryProfile(file, 100);

		const rep = addProfileRepresentation(file, { context: body, profile, depth: 1000 });
		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		expect(extrusion.isA("IfcExtrudedAreaSolid")).toBe(true);
		const location = (extrusion.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([0.0, 0.0, 0.0]);

		file.dispose();
	});

	test("an explicit null cardinalPoint places the profile at the origin (falsy check), even for an arbitrary profile", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = arbitraryProfile(file, 100);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: null });
		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		const location = (extrusion.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([0.0, 0.0, 0.0]);

		file.dispose();
	});

	test('cardinalPoint "mid-depth centre" (and its numeric form 5) never call getX/getY -- always the origin, even for an arbitrary profile', () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = arbitraryProfile(file, 100);

		for (const cardinalPoint of ["mid-depth centre" as const, 5 as const]) {
			const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint });
			const extrusion = (rep.get("Items") as EntityInstance[])[0];
			const location = (extrusion.get("Position") as EntityInstance).get("Location") as EntityInstance;
			expect(location.get("Coordinates")).toEqual([0.0, 0.0, 0.0]);
		}

		file.dispose();
	});

	test("cardinal points 10-19 (\"geometric centroid\" and beyond) resolve to the origin without needing the kernel -- real Python's own unimplemented '# TODO other cardinal points' fallback, ported verbatim", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = arbitraryProfile(file, 100);

		for (const cardinalPoint of [
			"geometric centroid" as const,
			"shear centre" as const,
			"top in line with the shear centre" as const,
			10 as const,
			19 as const,
		]) {
			const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint });
			const extrusion = (rep.get("Items") as EntityInstance[])[0];
			const location = (extrusion.get("Position") as EntityInstance).get("Location") as EntityInstance;
			expect(location.get("Coordinates")).toEqual([0.0, 0.0, 0.0]);
		}

		file.dispose();
	});

	test("CARDINAL_POINT_VALUES is the exact 1-based lookup table real Python's own get_args(CardinalPointString) produces", () => {
		expect(CARDINAL_POINT_VALUES).toHaveLength(19);
		expect(CARDINAL_POINT_VALUES[0]).toBe("bottom left");
		expect(CARDINAL_POINT_VALUES[4]).toBe("mid-depth centre");
		expect(CARDINAL_POINT_VALUES[18]).toBe("top in line with the shear centre");
	});

	test("an IfcRectangleProfileDef (allowlisted) fully resolves 'bottom left'/numeric 1, matching real Python's own test_run assertion shape", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 100, 100);

		for (const cardinalPoint of ["bottom left" as const, 1 as const]) {
			const rep = addProfileRepresentation(file, { context: body, profile, depth: 1000, cardinalPoint });
			expect(rep.isA("IfcShapeRepresentation")).toBe(true);
			expect(rep.get("RepresentationType")).toBe("SweptSolid");
			const item = (rep.get("Items") as EntityInstance[])[0];
			expect(item.isA("IfcExtrudedAreaSolid")).toBe(true);
			expect((item.get("SweptArea") as EntityInstance).equals(profile)).toBe(true);
			expect((item.get("ExtrudedDirection") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);
			expect(item.get("Depth")).toBe(1000);
			const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
			// Real Python: (-50.0, 50.0, 0.0).
			expect(location.get("Coordinates")).toEqual([-50.0, 50.0, 0.0]);
		}

		file.dispose();
	});

	test.each([
		["bottom left", [-50.0, 50.0, 0.0]],
		["bottom centre", [0.0, 50.0, 0.0]],
		["bottom right", [50.0, 50.0, 0.0]],
		["mid-depth left", [-50.0, 0.0, 0.0]],
		["mid-depth right", [50.0, 0.0, 0.0]],
		["top left", [-50.0, -50.0, 0.0]],
		["top centre", [0.0, -50.0, 0.0]],
		["top right", [50.0, -50.0, 0.0]],
	] as const)("cardinalPoint %s resolves to %j for a 100x100 rectangle profile", (cardinalPoint, expected) => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 100, 100);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual(expected);

		file.dispose();
	});

	test("IfcCircleProfileDef's getX/getY both return Radius * 2", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = circleProfile(file, 25);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "bottom left" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([-25.0, 25.0, 0.0]);

		file.dispose();
	});

	test("IfcEllipseProfileDef's getX/getY read SemiAxis1/SemiAxis2 * 2", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = ellipseProfile(file, 10, 20);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "bottom left" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([-10.0, 20.0, 0.0]);

		file.dispose();
	});

	test("IfcIShapeProfileDef's getX/getY read OverallWidth/OverallDepth directly", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = iShapeProfile(file, 200, 400, 10, 15);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "top right" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([100.0, -200.0, 0.0]);

		file.dispose();
	});

	test("IfcCShapeProfileDef's getX/getY read Width/Depth directly", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = cShapeProfile(file, 300, 150, 10, 50);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "mid-depth left" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([-75.0, 0.0, 0.0]);

		file.dispose();
	});

	test("IfcLShapeProfileDef's getX/getY read Width/Depth directly", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = lShapeProfile(file, 100, 80, 8);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "mid-depth right" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([40.0, 0.0, 0.0]);

		file.dispose();
	});

	test("IfcTShapeProfileDef's getX/getY read FlangeWidth/Depth directly", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = tShapeProfile(file, 200, 120, 8, 12);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "bottom centre" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([0.0, 100.0, 0.0]);

		file.dispose();
	});

	test("IfcUShapeProfileDef's getX/getY read FlangeWidth/Depth directly", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = uShapeProfile(file, 180, 70, 6, 10);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "top left" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([-35.0, -90.0, 0.0]);

		file.dispose();
	});

	test("IfcZShapeProfileDef's getX is (FlangeWidth * 2) - WebThickness, getY reads Depth directly", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		// FlangeWidth=60, WebThickness=8 -> X = 60*2 - 8 = 112.
		const profile = zShapeProfile(file, 150, 60, 8, 10);

		const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "bottom right" });
		const item = (rep.get("Items") as EntityInstance[])[0];
		const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(location.get("Coordinates")).toEqual([56.0, 75.0, 0.0]);

		file.dispose();
	});

	if (schema === "IFC2X3") {
		test("IfcAsymmetricIShapeProfileDef's getX reads the real IFC2X3-only OverallWidth attribute", () => {
			const file = createTestFile(schema);
			const body = bodyContext(file);
			const profile = asymmetricIShapeProfileIfc2x3(file, 220, 400, 10, 16);

			const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "bottom left" });
			const item = (rep.get("Items") as EntityInstance[])[0];
			const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
			expect(location.get("Coordinates")).toEqual([-110.0, 200.0, 0.0]);

			file.dispose();
		});
	} else {
		test("IfcAsymmetricIShapeProfileDef's getX throws a REAL, PRE-EXISTING upstream-Python AttributeError-equivalent on IFC4/IFC4X3 -- OverallWidth was renamed to BottomFlangeWidth, not a TS-port gap (see addProfileRepresentation.ts's own header comment)", () => {
			const file = createTestFile(schema);
			const body = bodyContext(file);
			const profile = asymmetricIShapeProfileIfc4Plus(file, 220, 400, 10, 16);

			// getY (OverallDepth) is genuinely fine on this schema -- only getX (OverallWidth)
			// is affected, matching real Python's own attribute-name divergence exactly.
			expect(() => addProfileRepresentation(file, { context: body, profile, cardinalPoint: "bottom left" })).toThrow(
				/has no attribute 'OverallWidth'/,
			);
			expect(() => addProfileRepresentation(file, { context: body, profile, cardinalPoint: "mid-depth left" })).toThrow(
				/has no attribute 'OverallWidth'/,
			);
			// A cardinal point that only needs getY (not getX) succeeds normally.
			const rep = addProfileRepresentation(file, { context: body, profile, cardinalPoint: "bottom centre" });
			const item = (rep.get("Items") as EntityInstance[])[0];
			const location = (item.get("Position") as EntityInstance).get("Location") as EntityInstance;
			expect(location.get("Coordinates")).toEqual([0.0, 200.0, 0.0]);

			file.dispose();
		});
	}

	test("depth is converted from SI via unit_scale (no project units set -> unit_scale defaults to 1, matching addSlabRepresentation.test.ts's own established precedent)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 10, 10);

		const rep = addProfileRepresentation(file, { context: body, profile, depth: 2.5 });
		const item = (rep.get("Items") as EntityInstance[])[0];
		expect(item.get("Depth")).toBeCloseTo(2.5);

		file.dispose();
	});

	test("placementZxAxes overrides the placement's Axis/RefDirection, defaulting to (0,0,1)/(1,0,0)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 10, 10);

		const defaultRep = addProfileRepresentation(file, { context: body, profile });
		const defaultItem = (defaultRep.get("Items") as EntityInstance[])[0];
		const defaultPlacement = defaultItem.get("Position") as EntityInstance;
		expect((defaultPlacement.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);
		expect((defaultPlacement.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([1.0, 0.0, 0.0]);

		const overriddenRep = addProfileRepresentation(file, {
			context: body,
			profile,
			placementZxAxes: [
				[0.0, 1.0, 0.0],
				[0.0, 0.0, 1.0],
			],
		});
		const overriddenItem = (overriddenRep.get("Items") as EntityInstance[])[0];
		const overriddenPlacement = overriddenItem.get("Position") as EntityInstance;
		expect((overriddenPlacement.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 1.0, 0.0]);
		expect((overriddenPlacement.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);

		file.dispose();
	});

	test("clippings apply an IfcBooleanClippingResult, switching RepresentationType to Clipping", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 10, 10);

		const clippings = [new Clipping({ location: [0.0, 0.0, 0.5], normal: [0.0, 0.0, 1.0] })];
		const rep = addProfileRepresentation(file, { context: body, profile, depth: 1.0, clippings });

		expect(rep.get("RepresentationType")).toBe("Clipping");
		const result = (rep.get("Items") as EntityInstance[])[0];
		expect(result.isA("IfcBooleanClippingResult")).toBe(true);
		expect(result.get("Operator")).toBe("DIFFERENCE");
		expect((result.get("FirstOperand") as EntityInstance).isA("IfcExtrudedAreaSolid")).toBe(true);

		file.dispose();
	});

	test("clippings never alias the caller's own array (a genuinely NEW list, unlike addWallRepresentation.ts's own booleans field)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 10, 10);

		const clippings = [new Clipping({ location: [0.0, 0.0, 0.5], normal: [0.0, 0.0, 1.0] })];
		addProfileRepresentation(file, { context: body, profile, clippings });
		expect(clippings).toHaveLength(1);

		file.dispose();
	});

	test("an existing IfcBooleanResult clipping is copied and chained via FirstOperand", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 10, 10);

		const raw = addProfileRepresentation(file, { context: body, profile, depth: 1.0 });
		const rawExtrusion = (raw.get("Items") as EntityInstance[])[0];
		const secondSolid = file.createEntity(
			"IfcExtrudedAreaSolid",
			rawExtrusion.get("SweptArea") as EntityInstance,
			null,
			file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
			1.0,
		);
		const existingClipping = file.createEntity("IfcBooleanClippingResult", "DIFFERENCE", rawExtrusion, secondSolid);

		const rep = addProfileRepresentation(file, { context: body, profile, depth: 1.0, clippings: [existingClipping] });
		const result = (rep.get("Items") as EntityInstance[])[0];
		// A COPY, not the same instance (`util.element.copy`, a shallow copy).
		expect(result.equals(existingClipping)).toBe(false);
		expect(result.isA("IfcBooleanClippingResult")).toBe(true);
		expect((result.get("SecondOperand") as EntityInstance).equals(secondSolid)).toBe(true);
		expect((result.get("FirstOperand") as EntityInstance).isA("IfcExtrudedAreaSolid")).toBe(true);
		expect((result.get("FirstOperand") as EntityInstance).equals(rawExtrusion)).toBe(false);

		file.dispose();
	});

	test("RepresentationIdentifier/ContextOfItems come from the given context", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const profile = rectangleProfile(file, 10, 10);

		const rep = addProfileRepresentation(file, { context: body, profile });
		expect((rep.get("ContextOfItems") as EntityInstance).equals(body)).toBe(true);
		expect(rep.get("RepresentationIdentifier")).toBe(body.get("ContextIdentifier"));

		file.dispose();
	});
});
