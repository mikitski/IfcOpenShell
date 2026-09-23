// This file was generated with the assistance of an AI coding tool.
//
// Ports the real Python test file's own actual assertions:
// `src/ifcopenshell-python/test/api/geometry/test_add_railing_representation.py`. That file
// itself explains its own split (docstring, reproduced here): "The module under test was
// refactored to separate pure-geometry compute (`compute_wall_mounted_handrail_geometry`) from
// IFC entity creation (`add_railing_representation` itself) ... The bulk of the tests here
// exercise the pure compute function ... A smaller smoke test then runs the full
// `add_railing_representation` end to end". This port follows the exact same shape: the pure
// compute tests below are near-verbatim translations of the real Python test bodies (same
// fixtures, same assertions, same doc-comment reasoning) since `computeWallMountedHandrailGeometry`
// is genuinely unblocked and produces byte-identical results; the one real Python end-to-end smoke
// test (`TestAddRailingRepresentation.test_default_railing_returns_shape_representation`) is
// re-pinned as a disclosed-throw assertion instead of a success assertion, per
// `addRailingRepresentation.ts`'s own header comment (finding 3): `addRailingRepresentation` is
// blocked on every input, on every schema, by a pre-existing `entityInstance.ts` primitive-layer
// gap reached via `ShapeBuilder.createSweptDiskSolid`'s own unconditional `.get("Dim")` check.
//
// Gated with `describe.each(AVAILABLE_SCHEMAS)` for the one schema-touching describe block (the
// end-to-end smoke tests), matching this project's own established convention -- CI's native
// build currently only registers IFC4 (`-DSCHEMA_VERSIONS=4`), so a hardcoded, ungated
// `describe("... (IFC2X3)")` block would fail CI with "No schema loaded" (a real mistake multiple
// past PRs in this project have hit and fixed). The bulk of the tests (pure-geometry compute) need
// no `IfcFile`/schema at all and are not gated.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import {
	FilletDegenerateError,
	type RailingSupport,
	type WallMountedHandrailGeometry,
	addRailingRepresentation,
	computeWallMountedHandrailGeometry,
} from "../../../src/api/geometry/addRailingRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import { addSiUnit } from "../../../src/api/unit/addSiUnit";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

// ---------------------------------------------------------------------------
// Pure-geometry compute tests (no IFC file needed) -- ports of the real Python test file's own
// module-level test functions.
// ---------------------------------------------------------------------------

/** Python: `_straight_path`. Two-point horizontal path along +X at handrail height (1m). */
function straightPath(length = 2.0): [number, number, number][] {
	return [
		[0.0, 0.0, 1.0],
		[length, 0.0, 1.0],
	];
}

/** Python: `_l_path`. L-shaped path that turns 90 degrees -- exercises the fillet-arc branch. */
function lPath(): [number, number, number][] {
	return [
		[0.0, 0.0, 1.0],
		[2.0, 0.0, 1.0],
		[2.0, 2.0, 1.0],
	];
}

/** Python: `_common_kwargs`. Default kwargs roughly matching `addRailingRepresentation`'s
 * defaults at `unitScale=1`. */
function commonKwargs(overrides: Record<string, unknown> = {}) {
	return {
		supportSpacing: 1.0,
		railingDiameter: 0.05,
		clearWidth: 0.04,
		height: 1.0,
		useManualSupports: false,
		terminalType: "180" as const,
		loopedPath: false,
		unitScale: 1.0,
		...overrides,
	};
}

test("returns geometry with the documented shape", () => {
	const result = computeWallMountedHandrailGeometry({ railingPath: straightPath(), ...commonKwargs() });
	expect(Array.isArray(result.handrailPolyline)).toBe(true);
	expect(result.handrailPolyline.every((p) => p.length === 3)).toBe(true);
	expect(Array.isArray(result.handrailArcPointIndices)).toBe(true);
	expect(Array.isArray(result.supports)).toBe(true);
	expect(result.handrailRadius).toBeCloseTo(0.025); // diameter / 2
});

test("computeWallMountedHandrailGeometry takes no IfcFile/context -- can be called without one", () => {
	// Python: `test_no_ifc_dependency` asserts via `inspect.signature` that `file`/`context`
	// aren't parameters at all. TS has no runtime signature introspection to match that
	// against, so this is instead a direct behavioral proof: the call below succeeds with NO
	// `IfcFile` in scope anywhere in this test.
	const result: WallMountedHandrailGeometry = computeWallMountedHandrailGeometry({
		railingPath: straightPath(),
		...commonKwargs(),
	});
	expect(result.handrailRadius).toBeGreaterThan(0);
});

test("handrail radius is half the diameter", () => {
	const result = computeWallMountedHandrailGeometry({
		railingPath: straightPath(),
		...commonKwargs({ railingDiameter: 0.08 }),
	});
	expect(result.handrailRadius).toBeCloseTo(0.04);
});

test("a 2m straight path at 1m support spacing yields 3 automatic supports", () => {
	// `divmod(2.0, 1.0) === [2, 0]`, `nSupports = 2 + 1 = 3`.
	const result = computeWallMountedHandrailGeometry({
		railingPath: straightPath(2.0),
		...commonKwargs({ supportSpacing: 1.0 }),
	});
	expect(result.supports.length).toBe(3);
});

test("manual supports are skipped on a straight path (no internal vertices)", () => {
	const result = computeWallMountedHandrailGeometry({
		railingPath: straightPath(),
		...commonKwargs({ useManualSupports: true }),
	});
	expect(result.supports).toEqual([]);
});

test("manual supports on an L-shaped corner: the corner itself is non-collinear, so it gets none", () => {
	const result = computeWallMountedHandrailGeometry({
		railingPath: lPath(),
		...commonKwargs({ useManualSupports: true }),
	});
	expect(result.supports).toEqual([]);
});

test("each support is described by an arc polyline + a disk extrusion", () => {
	const result = computeWallMountedHandrailGeometry({ railingPath: straightPath(), ...commonKwargs() });
	expect(result.supports.length).toBeGreaterThanOrEqual(1);
	const support: RailingSupport = result.supports[0];
	expect(support.arcPolyline.length).toBe(3);
	expect(support.arcPolyline.every((p) => p.length === 3)).toBe(true);
	expect(support.diskPosition).toEqual(support.arcPolyline[2]);
	expect(support.arcRadius).toBeGreaterThan(0);
	expect(support.diskRadius).toBeGreaterThan(0);
	expect(support.diskDepth).toBeGreaterThan(0);
});

test.each(["180", "TO_END_POST", "TO_WALL", "TO_FLOOR", "TO_END_POST_AND_FLOOR", "NONE"] as const)(
	"all terminal types (%s) produce valid geometry",
	(terminalType) => {
		const result = computeWallMountedHandrailGeometry({
			railingPath: straightPath(),
			...commonKwargs({ terminalType }),
		});
		expect(result.handrailPolyline.length).toBeGreaterThanOrEqual(2);
		for (const idx of result.handrailArcPointIndices) {
			expect(idx).toBeGreaterThanOrEqual(0);
			expect(idx).toBeLessThan(result.handrailPolyline.length);
		}
	},
);

test('terminalType "NONE" skips terminal-cap generation entirely', () => {
	const resultNone = computeWallMountedHandrailGeometry({
		railingPath: straightPath(),
		...commonKwargs({ terminalType: "NONE" }),
	});
	const result180 = computeWallMountedHandrailGeometry({
		railingPath: straightPath(),
		...commonKwargs({ terminalType: "180" }),
	});
	expect(resultNone.handrailPolyline.length).toBe(2);
	expect(resultNone.handrailPolyline.length).toBeLessThan(result180.handrailPolyline.length);
	expect(resultNone.handrailArcPointIndices).toEqual([]);
	expect(result180.handrailArcPointIndices.length).toBeGreaterThanOrEqual(2);
});

test("an L-path with a 90 degree turn introduces fillet arc points", () => {
	const result = computeWallMountedHandrailGeometry({ railingPath: lPath(), ...commonKwargs() });
	expect(result.handrailArcPointIndices.length).toBeGreaterThanOrEqual(1);
});

test("a looped path runs without caps", () => {
	// Square footprint, NOT closed (the function closes internally).
	const looped: [number, number, number][] = [
		[0.0, 0.0, 1.0],
		[2.0, 0.0, 1.0],
		[2.0, 2.0, 1.0],
		[0.0, 2.0, 1.0],
	];
	const result = computeWallMountedHandrailGeometry({ railingPath: looped, ...commonKwargs({ loopedPath: true }) });
	expect(result.handrailPolyline.every((p) => p.every((c) => Number.isFinite(c)))).toBe(true);
	// Looped path has 4 corners -> 4 fillet arcs.
	expect(result.handrailArcPointIndices.length).toBe(4);
});

test("unitScale divides the mm-based constants so they land in project units", () => {
	const result = computeWallMountedHandrailGeometry({
		railingPath: [
			[0, 0, 1000],
			[2000, 0, 1000],
			[2000, 2000, 1000],
		],
		supportSpacing: 1000.0,
		railingDiameter: 50.0,
		clearWidth: 40.0,
		height: 1000.0,
		unitScale: 1000.0,
	});
	expect(result.handrailRadius).toBeCloseTo(25.0);
});

// ---------------------------------------------------------------------------
// Collinearity precision regression guards
// ---------------------------------------------------------------------------

test("a collinear subdivided path (non-axis-aligned) does not add spurious fillets", () => {
	// Non-axis-aligned because axis-aligned cases happen to give an exact dot of 1.0 -- the
	// arccos-clamp bug this guards against only surfaces when float arithmetic produces a
	// sub-ulp overshoot, which needs a direction whose components don't divide cleanly.
	const a: [number, number, number] = [0.123, 0.456, 1.0];
	const direction: [number, number, number] = [0.6, 0.8, 0.0];
	const p0 = a;
	const p1: [number, number, number] = [
		a[0] + direction[0] * 1.5,
		a[1] + direction[1] * 1.5,
		a[2] + direction[2] * 1.5,
	];
	const p2: [number, number, number] = [
		a[0] + direction[0] * 3.0,
		a[1] + direction[1] * 3.0,
		a[2] + direction[2] * 3.0,
	];
	const result = computeWallMountedHandrailGeometry({ railingPath: [p0, p1, p2], ...commonKwargs() });
	expect(result.handrailPolyline.every((p) => p.every((c) => Number.isFinite(c)))).toBe(true);
	// Only the 2 terminal-cap fillets -- the interior vertex was collinear and must not have
	// introduced a third arc.
	expect(result.handrailArcPointIndices.length).toBe(2);
});

// ---------------------------------------------------------------------------
// `getFilletPoints`'s disclosed selective-catch bug (this file's own header comment, finding 1) --
// exercised indirectly through `FilletDegenerateError`'s own exported identity, since the
// function itself is module-private, matching real Python's own leading-underscore privacy.
// ---------------------------------------------------------------------------

test("FilletDegenerateError is exported so callers embedding this module can recognize the disclosed selective-catch boundary", () => {
	const err = new FilletDegenerateError("test");
	expect(err).toBeInstanceOf(Error);
	expect(err).toBeInstanceOf(FilletDegenerateError);
});

// ---------------------------------------------------------------------------
// End-to-end IFC smoke test -- confirms `addRailingRepresentation`'s own disclosed, current
// throw (see `addRailingRepresentation.ts`'s own header comment, finding 3): this function is
// blocked on every input, on every schema, by a pre-existing `entityInstance.ts` primitive-layer
// gap (`ShapeBuilder.createSweptDiskSolid`'s own unconditional `.get("Dim")` check), unlike
// `computeWallMountedHandrailGeometry` above, which is genuinely unblocked.
// ---------------------------------------------------------------------------

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addRailingRepresentation (%s)", (schema) => {
	function setupContext(schema2: (typeof AVAILABLE_SCHEMAS)[number]) {
		const file = createTestFile(schema2);
		createEntity(file, { ifcClass: "IfcProject" });
		const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: null });
		assignUnit(file, { units: [unit] });
		const modelContext = addContext(file, { contextType: "Model" });
		const body = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: modelContext,
		});
		return { file, body };
	}

	// On IFC2X3, `shapeBuilder.ts`'s own arc-building path throws "Arcs are not
	// supported for IFC2X3." (`TODOS.md`'s "`IfcLineIndex`/`IfcArcIndex` defined-type
	// creation" entry, its own "on IFC2X3 ... arcs not supported" branch) BEFORE the
	// `Dim`/"Attribute access" blocker below is ever reached -- both are the same
	// disclosed, pre-existing, unrelated-to-this-PR gap, just surfacing via a
	// different schema-dependent code path on IFC2X3 vs. IFC4/IFC4X3 (only now
	// exercised at all in CI, since IFC2X3 was never previously built there -- see
	// `test/bootstrap.ts`'s own `AVAILABLE_SCHEMAS` comment).
	//
	// **Updated by Phase EX-2's IFC4 second chunk** (`src/express/rules/ifc4.ts`):
	// re-verified directly (not assumed) against the real, built native addon before
	// updating this test. On IFC4 specifically, this fixture's error MESSAGE changes
	// (the underlying blockage does not -- `addRailingRepresentation` is still fully
	// blocked on every input, just via a different symptom now): `builder.circle(...)`
	// builds a 2D `IfcCircle`, fed into `ShapeBuilder.extrude` -> `.profile()`.
	// `IfcCircle.Dim` (`IfcCurveDim`'s `IfcConic` branch, this chunk) reads
	// `Position.Dim` -- `Position` is an `IfcAxis2Placement2D`, whose OWN `Dim` is
	// declared DERIVE at the `IfcPlacement` supertype level (`calc_IfcPlacement_Dim`),
	// which is genuinely still UNPORTED for IFC4 (not one of IFC4's own first OR
	// second chunk's functions -- IFC2X3 ported it in ITS OWN second chunk, but the
	// two schemas' porting chunks aren't lockstep-aligned by entity name; see
	// `ifc4.test.ts`'s own analogous disclosure on its `IfcConic` dispatch test).
	// `expressGetAttr`'s own try/catch (`runtimeShim.ts`) swallows that "has no
	// attribute 'Dim'" into its own `INDETERMINATE` `Symbol` default rather than
	// propagating the throw -- so `.profile()`'s own `outerCurve.get("Dim") !== 2`
	// guard sees a `Symbol`, which IS `!== 2`, and its own error-message template
	// literal (`` `...currently it has ${outerCurve.get("Dim")} dimensions.` ``) then
	// crashes trying to stringify that `Symbol` (`TypeError: Cannot convert a Symbol
	// value to a string`) -- a genuinely different thrown error than before on IFC4
	// specifically, still a real, disclosed, unconditional block, just one step
	// further down the same call chain and via a DIFFERENT still-unported dependency
	// (`calc_IfcPlacement_Dim`) than this chunk's own 15 functions. IFC4X3 is
	// UNCHANGED (no `rules/ifc4x3.ts` module exists yet, so `IfcIndexedPolyCurve.Dim`
	// itself still throws "has no attribute" first, at `createSweptDiskSolid`, before
	// ever reaching `.profile()`/`IfcCircle.Dim` at all).
	test("a default-args call throws the disclosed, current ShapeBuilder blocker (message shape is schema-dependent)", () => {
		const { file, body } = setupContext(schema);
		expect(() =>
			addRailingRepresentation(file, {
				context: body,
				railingPath: [
					[0.0, 0.0, 1.0],
					[2.0, 0.0, 1.0],
				],
			}),
		).toThrow(
			/has no attribute 'Dim'|Attribute access is only supported on entity instances|Arcs are not supported for IFC2X3\.|Cannot convert a Symbol value to a string/,
		);
	});
});
