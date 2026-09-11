// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_geolocation.py` (src/ifcopenshell-python, 497 lines) --
// `util/geolocation.ts`'s port. Every pure-math test class in the Python source is ported
// close to verbatim below (`TestXYZ2ENH`/`TestENH2XYZ`/`TestZ2E`/`TestLocal2Global`/
// `TestGlobal2Local`/`TestXAxis2Angle`/`TestAngle2XAxis`/`TestYAxis2Angle`/`TestAngle2YAxis`/
// `TestDMS2DDandDD2DMS`), since those need no `ifcopenshell.api.*` fixtures at all. The
// `auto_*`/`get_*` classes that DO need a real georeferenced `ifcopenshell.file`
// (`TestAutoXYZ2ENH`/`TestAutoENH2XYZ`/`TestAutoZ2E`/`TestAutoLocal2Global`/
// `TestAutoGlobal2Local`) build their fixtures directly via `file.createEntity(...)` +
// `.set(...)` (matching `util/placement.ts`'s own established pattern for this exact same
// gap -- Python's own fixtures go through `ifcopenshell.api.context`/`api.georeference`/
// `api.root`, none of which exist yet in this TS port, `api.*` being Phase 6+).
//
// Two real, disclosed, schema-version-gated cases, both confirmed against the generated
// `.d.ts` files (see `util/geolocation.ts`'s own header comment): `IfcMapConversionScaled`
// and `IfcRigidOperation` are both IFC4X3-only EXPRESS types (absent from IFC4/IFC2X3
// entirely), so `test_map_conversion_scaled`/`test_rigid_operation`'s TS counterparts below
// are gated on `AVAILABLE_SCHEMAS.includes("IFC4X3")`, per this project's established
// `AVAILABLE_SCHEMAS` skip-guard convention (`test/bootstrap.ts`) -- not silently skipped or
// asserted against a fake schema. Every other fixture below uses plain `IfcMapConversion`
// (available in IFC4 already, confirmed against `ifc4.d.ts`), so runs under CI's
// `SCHEMA_VERSIONS=4` build just fine, even though Python's own `TestAutoXYZ2ENH`/
// `TestAutoENH2XYZ` test classes happen to extend `test.bootstrap.IFC4X3` (a Python fixture-
// environment choice, not a real IFC4X3-only dependency for those specific cases).
//
// `createTypedValue` below (`IfcRigidOperation.FirstCoordinate`/`.SecondCoordinate`, both
// SELECT-typed and requiring a real wrapped `IfcLengthMeasure`/`IfcPlaneAngleMeasure`
// instance) is not a new finding -- it is the same disclosed, pre-existing Phase 2 gap
// workaround `test/util/unit.test.ts`/`test/util/element.test.ts` already established
// (`EntityInstance.setByIndex`/`.set()` on a standalone non-entity/simple-type instance
// throws, since the native `attribute_kind_of` lookup requires an entity; the lower-level
// `set_attribute_value` primitive has no such restriction), duplicated here per this
// project's "small per-file test helper" convention rather than imported from another
// test file.
//
// Beyond the direct Python port: `local2global`/`global2local`'s own "non-trivial
// composition order" test (this chunk's own task brief's explicit instruction, matching
// `util/placement.ts`'s own precedent) -- every one of `test_geolocation.py`'s own
// `local2global`/`global2local` cases uses either an identity input matrix or a
// 90-degree-aligned `x_axis_abscissa`/`x_axis_ordinate`, never a simultaneous non-identity
// input rotation *and* an arbitrary non-axis-aligned map rotation *and* a non-unit
// scale/factor all at once. The new case below (and its expected matrix entries) was
// computed two independent ways before being trusted -- a from-scratch pure-Python
// re-implementation with no numpy, and the real `gl-matrix` library exercising this exact
// logic in a disposable Node script -- see `util/geolocation.ts`'s own header comment for
// the full methodology; both agree to 1e-5 and are reproduced as a real Vitest assertion
// here, not just asserted from this file's own implementation.

import { mat4 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import * as subject from "../../src/util/geolocation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment) ---

/** See this file's header comment -- reused, disclosed Phase 2 gap workaround, not a new
 * finding (duplicated from `test/util/unit.test.ts`'s own helper of the same name/shape). */
function createTypedValue(file: IfcFile, className: string, value: number): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	new NativeEntityInstance(handle._handle).set_attribute_value(0, { kind: native.DOUBLE, double_value: value });
	return new EntityInstance(handle._handle, file);
}

interface Georeferencing {
	readonly context: EntityInstance;
	readonly conversion: EntityInstance;
	readonly crs: EntityInstance;
}

/** Builds a minimal `IfcGeometricRepresentationContext` + `IfcProjectedCRS` +
 * `IfcMapConversion`/`IfcMapConversionScaled`/`IfcRigidOperation` graph -- the same
 * underlying entities `ifcopenshell.api.context.add_context`/
 * `ifcopenshell.api.georeference.add_georeferencing` build, constructed directly since
 * neither `api` module exists yet in this TS port (see this file's header comment). */
function addGeoreferencing(
	file: IfcFile,
	ifcClass: "IfcMapConversion" | "IfcMapConversionScaled" | "IfcRigidOperation" = "IfcMapConversion",
): Georeferencing {
	// `createTestFile` (`template.ts`) already bakes a single default
	// `IfcGeometricRepresentationContext` (`ContextType="Model"`, an identity
	// `WorldCoordinateSystem`, and a default `TrueNorth` of `(0,1)`) into every file it
	// produces -- confirmed empirically (a disposable Node script against the real
	// template string, `template.ts`'s own `#11=IFCGEOMETRICREPRESENTATIONCONTEXT(...)`
	// literal). Unlike Python's own `test.bootstrap` (`ifcopenshell.api.project
	// .create_file()`, which starts genuinely bare -- Python's own test fixtures
	// explicitly call `ifcopenshell.api.context.add_context(self.file, "Model")`), this
	// TS port's `createTestFile` always has one. `getWcs`/`getCrs` both iterate *every*
	// `IfcGeometricRepresentationContext` in the file and can only unambiguously pick
	// "the" Model context when there is exactly one -- so this helper reuses that
	// existing default context rather than adding a second, ambiguous one (which is
	// also more realistic: a real IFC file has exactly one `Model` context, not two).
	const context = file.byType("IfcGeometricRepresentationContext", false)[0];

	const crs = file.createEntity("IfcProjectedCRS");
	crs.set("Name", "EPSG:7856");

	let conversion: EntityInstance;
	if (ifcClass === "IfcRigidOperation") {
		conversion = file.createEntity("IfcRigidOperation");
		conversion.set("FirstCoordinate", createTypedValue(file, "IfcPlaneAngleMeasure", 0));
		conversion.set("SecondCoordinate", createTypedValue(file, "IfcPlaneAngleMeasure", 0));
		conversion.set("Height", 0);
	} else {
		conversion = file.createEntity(ifcClass);
		conversion.set("Eastings", 0);
		conversion.set("Northings", 0);
		conversion.set("OrthogonalHeight", 0);
		if (ifcClass === "IfcMapConversionScaled") {
			conversion.set("FactorX", 1);
			conversion.set("FactorY", 1);
			conversion.set("FactorZ", 1);
		}
	}
	conversion.set("SourceCRS", context);
	conversion.set("TargetCRS", crs);
	return { context, conversion, crs };
}

/** `ifcopenshell.api.georeference.edit_wcs(file, x=.., y=.., z=..)` -- a translate-only
 * `WorldCoordinateSystem` (no rotation), matching every real Python test case's own usage
 * of `edit_wcs` (all pass only `x`/`y`/`z`, never a rotation axis). */
function setWcs(file: IfcFile, context: EntityInstance, x: number, y: number, z: number): void {
	const point = file.createEntity("IfcCartesianPoint", [x, y, z]);
	const placement = file.createEntity("IfcAxis2Placement3D", point);
	context.set("WorldCoordinateSystem", placement);
}

function expectAllClose(actual: readonly number[], expected: readonly number[], tol = 1e-6): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < actual.length; i++) {
		expect(Math.abs(actual[i] - expected[i])).toBeLessThan(tol);
	}
}

function eye4(): subject.MatrixType {
	return mat4.create();
}

// Python: `TestXYZ2ENH.test_converting_from_a_local_xyz_point_to_a_global_easting_northing_height`.
describe("geolocation.xyz2enh", () => {
	test("converting from a local xyz point to a global easting northing height", () => {
		expect(subject.xyz2enh(0, 0, 0, 0, 0, 0, 1, 0)).toEqual([0, 0, 0]);
		expect(subject.xyz2enh(0, 0, 0, 1, 2, 3, 1, 0)).toEqual([1, 2, 3]);
		expect(subject.xyz2enh(0, 0, 0, 1, 2, 3, 0, 1)).toEqual([1, 2, 3]);
		expectAllClose(subject.xyz2enh(1, 1, 0, 1, 2, 3, 1, 0), [2, 3, 3]);
		expectAllClose(subject.xyz2enh(1, 1, 0, 1, 2, 3, 1, 0, 2), [3, 4, 3]);
		expectAllClose(subject.xyz2enh(1, 1, 1, 1, 2, 3, 1, 0, 2, 2, 3, 4), [5, 8, 11]);
		expectAllClose(subject.xyz2enh(1, 1, 0, 1, 2, 3, 0, 1), [0, 3, 3]);
	});
});

// Python: `TestENH2XYZ.test_converting_from_a_global_easting_northing_height_to_a_local_xyz_point`.
describe("geolocation.enh2xyz", () => {
	test("converting from a global easting northing height to a local xyz point", () => {
		expect(subject.enh2xyz(0, 0, 0, 0, 0, 0, 1, 0)).toEqual([0, 0, 0]);
		expect(subject.enh2xyz(1, 2, 3, 1, 2, 3, 1, 0)).toEqual([0, 0, 0]);
		expect(subject.enh2xyz(1, 2, 3, 1, 2, 3, 0, 1)).toEqual([0, 0, 0]);
		expectAllClose(subject.enh2xyz(2, 3, 3, 1, 2, 3, 1, 0), [1, 1, 0]);
		expectAllClose(subject.enh2xyz(3, 4, 3, 1, 2, 3, 1, 0, 2), [1, 1, 0]);
		expectAllClose(subject.enh2xyz(5, 8, 11, 1, 2, 3, 1, 0, 2, 2, 3, 4), [1, 1, 1]);
		expectAllClose(subject.enh2xyz(0, 3, 3, 1, 2, 3, 0, 1), [1, 1, 0]);
	});
});

// Python: `TestZ2E.test_converting_from_a_local_z_to_a_global_elevation`.
describe("geolocation.z2e", () => {
	test("converting from a local z to a global elevation", () => {
		expect(subject.z2e(0)).toBe(0);
		expect(subject.z2e(0, 0, 1, 1)).toBe(0);
		expect(subject.z2e(0, 2)).toBe(2);
		expect(subject.z2e(1, 2)).toBe(3);
		expect(subject.z2e(1000, 2, 0.001)).toBe(3);
		expect(subject.z2e(1000, 2, 0.001, 0.9)).toBeCloseTo(2.9, 9);
	});
});

// Python: `TestXAxis2Angle`/`TestAngle2XAxis`/`TestYAxis2Angle`/`TestAngle2YAxis`.
describe("geolocation angle helpers", () => {
	test("xaxis2angle", () => {
		// `math.degrees(math.atan2(0, 1)) * -1` is `-0.0` in real Python too (`-0.0 == 0`
		// is `True` there); JS's strict `toBe` (`Object.is`) distinguishes `-0`/`0`, so
		// `toBeCloseTo` (a numeric-closeness check, not identity) is used for this one
		// case instead of `toBe`.
		expect(subject.xaxis2angle(1, 0)).toBeCloseTo(0, 9);
		expect(subject.xaxis2angle(1, 1)).toBe(-45);
		expect(subject.xaxis2angle(-1, 1)).toBe(-135);
		expect(subject.xaxis2angle(1, -1)).toBe(45);
		expect(subject.xaxis2angle(-1, -1)).toBe(135);
		expect(subject.xaxis2angle(0.8660254, -0.5)).toBeCloseTo(30, 5);
	});

	test("angle2xaxis", () => {
		const a = Math.SQRT1_2; // Python: 0.707106781186 (this port uses the exact std-lib constant instead)
		expectAllClose(subject.angle2xaxis(0), [1, 0]);
		expectAllClose(subject.angle2xaxis(-45), [a, a]);
		expectAllClose(subject.angle2xaxis(-135), [-a, a]);
		expectAllClose(subject.angle2xaxis(45), [a, -a]);
		expectAllClose(subject.angle2xaxis(135), [-a, -a]);
	});

	test("yaxis2angle", () => {
		expect(subject.yaxis2angle(0, 1)).toBe(0);
		expect(subject.yaxis2angle(-0.5, 0.8660254)).toBeCloseTo(30, 5);
		expect(subject.yaxis2angle(1, 1)).toBe(-45);
		expect(subject.yaxis2angle(-1, 1)).toBe(45);
		expect(subject.yaxis2angle(1, -1)).toBe(-135);
		expect(subject.yaxis2angle(-1, -1)).toBe(135);
	});

	test("angle2yaxis", () => {
		const a = Math.SQRT1_2; // Python: 0.707106781186 (this port uses the exact std-lib constant instead)
		expectAllClose(subject.angle2yaxis(0), [0, 1]);
		expectAllClose(subject.angle2yaxis(-45), [a, a]);
		expectAllClose(subject.angle2yaxis(45), [-a, a]);
		expectAllClose(subject.angle2yaxis(-135), [a, -a]);
		expectAllClose(subject.angle2yaxis(135), [-a, -a]);
	});
});

// Python: `TestDMS2DDandDD2DMS.test_dms2dd_and_dd2dms` -- verified byte-for-byte against a
// real Python 3 interpreter's own `decimal` module in this chunk's own investigation (see
// `util/geolocation.ts`'s header comment) before being trusted here.
describe("geolocation.dd2dms / dms2dd", () => {
	test("dd2dms/dms2dd round-trip, 3-tuple form", () => {
		const cases: ReadonlyArray<[number, readonly [number, number, number]]> = [
			[35.41, [35, 24, 36.0]],
			[-116.89, [-116, -53, -24.0]],
		];
		for (const [dd, dms] of cases) {
			expect(subject.dd2dms(dd)).toEqual(dms);
			expect(subject.dms2dd(dms[0], dms[1], dms[2])).toBe(dd);
		}
	});

	test("dd2dms/dms2dd round-trip, 4-tuple (microseconds) form", () => {
		const cases: ReadonlyArray<[number, readonly [number, number, number, number]]> = [
			[40.431389, [40, 25, 53, 400]],
			[-4.248056, [-4, -14, -53, -1600]],
			[-35.401389, [-35, -24, -5, -400]],
			[148.981667, [148, 58, 54, 1200]],
		];
		for (const [dd, dms] of cases) {
			expect(subject.dd2dms(dd, true)).toEqual(dms);
			expect(subject.dms2dd(dms[0], dms[1], dms[2], dms[3])).toBe(dd);
		}
	});

	// Regression test for a real bug this chunk's own `/code-review` pass found (see
	// `util/geolocation.ts`'s header comment, finding 1): `(1e-7).toString() === "1e-7"`
	// (JS's exponential notation for `|x| < 1e-6`) used to make `dd2dms` throw
	// (`BigInt("1e-7")` is a `SyntaxError`), where Python's `Decimal(str(1e-7))` succeeds.
	// Expected values cross-checked against a real Python 3 interpreter's own `decimal`
	// module running the exact same algorithm (see header comment methodology).
	test("dd2dms handles JS's exponential number notation for very small/large magnitudes", () => {
		expect(subject.dd2dms(1e-7)).toEqual([0, 0, 0.00036]);
		expect(subject.dd2dms(-2.3e-10)).toEqual([0, 0, -8.28e-7]);
		expect(subject.dd2dms(1.5e21)).toEqual([1500000000000000000000, 0, 0]);
	});
});

// Python: `TestLocal2Global.test_run`.
describe("geolocation.local2global", () => {
	test("test_run", () => {
		const m = eye4();
		let m2 = eye4();
		expectAllClose(Array.from(subject.local2global(m, 0, 0, 0, 1.0, 0.0)), Array.from(m2));

		m2[12] = 1;
		m2[13] = 2;
		m2[14] = 3;
		expectAllClose(Array.from(subject.local2global(m, 1, 2, 3, 1.0, 0.0)), Array.from(m2));

		m2[0] = 0;
		m2[1] = 1;
		m2[2] = 0;
		m2[4] = -1;
		m2[5] = 0;
		m2[6] = 0;
		expectAllClose(Array.from(subject.local2global(m, 1, 2, 3, 0.0, 1.0)), Array.from(m2));

		m[12] = 1;
		m[13] = 1;
		m[14] = 0;
		m2 = eye4();
		m2[12] = 2;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.local2global(m, 1, 2, 3, 1.0, 0.0)), Array.from(m2));

		m[12] = 1000;
		m[13] = 1000;
		m[14] = 0;
		m2[12] = 2;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.local2global(m, 1, 2, 3, 1.0, 0.0, 0.001)), Array.from(m2));

		m[12] = 1;
		m[13] = 1;
		m[14] = 0;
		m2[0] = 0;
		m2[1] = 1;
		m2[2] = 0;
		m2[4] = -1;
		m2[5] = 0;
		m2[6] = 0;
		m2[12] = 0;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.local2global(m, 1, 2, 3, 0.0, 1.0)), Array.from(m2));

		m[12] = 1;
		m[13] = 1;
		m[14] = 1;
		m2 = eye4();
		m2[12] = 5;
		m2[13] = 8;
		m2[14] = 11;
		expectAllClose(Array.from(subject.local2global(m, 1, 2, 3, 1.0, 0.0, 2, 2, 3, 4)), Array.from(m2));
	});

	// New coverage (no Python counterpart) -- see this file's header comment for the
	// two-independent-methods verification this specific case went through before being
	// trusted: every `local2global`/`global2local` case in `test_geolocation.py` itself
	// uses either an identity input matrix or a 90-degree-aligned map rotation, never a
	// simultaneous non-identity input rotation + arbitrary map rotation + non-unit scale.
	test("non-trivial composition order (non-identity input rotation + arbitrary map rotation + non-unit scale)", () => {
		const a = (30 * Math.PI) / 180;
		const local = eye4();
		local[0] = Math.cos(a);
		local[4] = -Math.sin(a);
		local[1] = Math.sin(a);
		local[5] = Math.cos(a);
		local[12] = 12.5;
		local[13] = -7.25;
		local[14] = 3.1;

		const params: [number, number, number, number, number, number, number, number, number] = [
			1000.25,
			2000.75,
			50.0,
			Math.cos((12 * Math.PI) / 180),
			Math.sin((12 * Math.PI) / 180),
			0.9996,
			1.0001,
			1.0001,
			1.0,
		];

		const g = subject.local2global(local, ...params);

		// Cross-checked two independent ways (a from-scratch pure-Python
		// re-implementation with no numpy, and the real `gl-matrix` library) --
		// see `util/geolocation.ts`'s header comment. Both agree to 1e-5.
		expect(g[0]).toBeCloseTo(0.743145, 5);
		expect(g[4]).toBeCloseTo(-0.669131, 5);
		expect(g[12]).toBeCloseTo(1013.980084, 5);
		expect(g[1]).toBeCloseTo(0.669131, 5);
		expect(g[5]).toBeCloseTo(0.743145, 5);
		expect(g[13]).toBeCloseTo(1996.258674, 5);
		expect(g[10]).toBeCloseTo(1.0, 5);
		expect(g[14]).toBeCloseTo(53.09876, 5);

		// And it round-trips back through `global2local`.
		const back = subject.global2local(g, ...params);
		expectAllClose(Array.from(back), Array.from(local), 1e-6);
	});
});

// Python: `TestGlobal2Local.test_run`.
describe("geolocation.global2local", () => {
	test("test_run", () => {
		const m = eye4();
		let m2 = eye4();
		expectAllClose(Array.from(subject.global2local(m2, 0, 0, 0, 1.0, 0.0)), Array.from(m));

		m2[12] = 1;
		m2[13] = 2;
		m2[14] = 3;
		expectAllClose(Array.from(subject.global2local(m2, 1, 2, 3, 1.0, 0.0)), Array.from(m));

		m2[0] = 0;
		m2[1] = 1;
		m2[2] = 0;
		m2[4] = -1;
		m2[5] = 0;
		m2[6] = 0;
		expectAllClose(Array.from(subject.global2local(m2, 1, 2, 3, 0.0, 1.0)), Array.from(m));

		m[12] = 1;
		m[13] = 1;
		m[14] = 0;
		m2 = eye4();
		m2[12] = 2;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.global2local(m2, 1, 2, 3, 1.0, 0.0)), Array.from(m));

		m[12] = 1000;
		m[13] = 1000;
		m[14] = 0;
		m2[12] = 2;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.global2local(m2, 1, 2, 3, 1.0, 0.0, 0.001)), Array.from(m));

		m[12] = 1;
		m[13] = 1;
		m[14] = 0;
		m2[0] = 0;
		m2[1] = 1;
		m2[2] = 0;
		m2[4] = -1;
		m2[5] = 0;
		m2[6] = 0;
		m2[12] = 0;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.global2local(m2, 1, 2, 3, 0.0, 1.0)), Array.from(m));

		m[12] = 1;
		m[13] = 1;
		m[14] = 1;
		m2 = eye4();
		m2[12] = 5;
		m2[13] = 8;
		m2[14] = 11;
		expectAllClose(Array.from(subject.global2local(m2, 1, 2, 3, 1.0, 0.0, 2, 2, 3, 4)), Array.from(m));
	});

	// Regression test for a real bug this chunk's own `/code-review` pass found (see
	// `util/geolocation.ts`'s header comment, finding 2): `mat4.invert`'s return value
	// used to be ignored entirely, so a singular (non-invertible) scale/factor matrix
	// (`scale=0` here) silently produced a plausible-looking wrong answer (built from an
	// untouched identity matrix) instead of failing loudly the way numpy's
	// `np.linalg.inv` would (`LinAlgError: Singular matrix`).
	test("throws a descriptive error for a singular scale/factor matrix, instead of silently substituting identity", () => {
		const m = eye4();
		expect(() => subject.global2local(m, 0, 0, 0, 1.0, 0.0, 0)).toThrow(/singular/);
	});
});

// Python: `TestAutoXYZ2ENH` (extends `test.bootstrap.IFC4X3`, but only
// `test_map_conversion_scaled`/`test_rigid_operation` genuinely need IFC4X3-only entities
// -- see this file's header comment).
describe("geolocation.autoXyz2enh", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("no georeferencing", () => {
		const file = newFile();
		expect(subject.autoXyz2enh(file, 0, 0, 0)).toEqual([0, 0, 0]);
		expect(subject.autoXyz2enh(file, 1, 2, 3)).toEqual([1, 2, 3]);
	});

	test("map conversion", () => {
		const file = newFile();
		const { conversion } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);

		expect(subject.autoXyz2enh(file, 0, 0, 0)).toEqual([1, 2, 3]);
		expect(subject.autoXyz2enh(file, 1, 3, 5)).toEqual([2, 5, 8]);

		conversion.set("Scale", 0.001);
		expectAllClose(subject.autoXyz2enh(file, 1000, 1000, 0), [2, 3, 3]);
		expectAllClose(subject.autoXyz2enh(file, 1000, 1000, 0, false), [2000, 3000, 3000]);

		conversion.set("XAxisAbscissa", 0);
		conversion.set("XAxisOrdinate", 1);
		expectAllClose(subject.autoXyz2enh(file, 1000, 1000, 0), [0, 3, 3]);
	});

	test("map conversion with wcs", () => {
		const file = newFile();
		const { conversion, context } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);
		setWcs(file, context, 1, 2, 3);

		expectAllClose(subject.autoXyz2enh(file, 0, 0, 0), [0, 0, 0]);
		expectAllClose(subject.autoXyz2enh(file, 1, 2, 3), [1, 2, 3]);

		setWcs(file, context, 1, 1, 2);
		expectAllClose(subject.autoXyz2enh(file, 0, 0, 0), [0, 1, 1]);
		expectAllClose(subject.autoXyz2enh(file, 1, 2, 3), [1, 3, 4]);
	});

	describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4X3"))("%s-only entities", (schemaName) => {
		test("map conversion scaled", () => {
			const file = createTestFile(schemaName);
			const { conversion } = addGeoreferencing(file, "IfcMapConversionScaled");
			conversion.set("Eastings", 1);
			conversion.set("Northings", 2);
			conversion.set("OrthogonalHeight", 3);

			expect(subject.autoXyz2enh(file, 0, 0, 0)).toEqual([1, 2, 3]);
			expect(subject.autoXyz2enh(file, 1, 3, 5)).toEqual([2, 5, 8]);

			conversion.set("Scale", 0.001);
			expectAllClose(subject.autoXyz2enh(file, 1000, 1000, 0), [2, 3, 3]);

			conversion.set("FactorX", 0.9);
			conversion.set("FactorY", 0.9);
			expectAllClose(subject.autoXyz2enh(file, 1000, 1000, 0), [1.9, 2.9, 3]);
		});

		test("rigid operation", () => {
			const file = createTestFile(schemaName);
			const { conversion } = addGeoreferencing(file, "IfcRigidOperation");
			conversion.set("FirstCoordinate", createTypedValue(file, "IfcPlaneAngleMeasure", 1));
			conversion.set("SecondCoordinate", createTypedValue(file, "IfcPlaneAngleMeasure", 2));
			conversion.set("Height", 3);

			expect(subject.autoXyz2enh(file, 0, 0, 0)).toEqual([1, 2, 3]);
			expect(subject.autoXyz2enh(file, 1, 3, 5)).toEqual([2, 5, 8]);

			conversion.set("FirstCoordinate", createTypedValue(file, "IfcLengthMeasure", 1));
			conversion.set("SecondCoordinate", createTypedValue(file, "IfcLengthMeasure", 2));
			expect(subject.autoXyz2enh(file, 0, 0, 0)).toEqual([1, 2, 3]);
			expect(subject.autoXyz2enh(file, 1, 3, 5)).toEqual([2, 5, 8]);
		});
	});
});

// Python: `TestAutoENH2XYZ`.
describe("geolocation.autoEnh2xyz", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("no georeferencing", () => {
		const file = newFile();
		expect(subject.autoEnh2xyz(file, 0, 0, 0)).toEqual([0, 0, 0]);
		expect(subject.autoEnh2xyz(file, 1, 2, 3)).toEqual([1, 2, 3]);
	});

	test("map conversion", () => {
		const file = newFile();
		const { conversion } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);

		expect(subject.autoEnh2xyz(file, 1, 2, 3)).toEqual([0, 0, 0]);
		expect(subject.autoEnh2xyz(file, 2, 5, 8)).toEqual([1, 3, 5]);

		conversion.set("Scale", 0.001);
		expectAllClose(subject.autoEnh2xyz(file, 2, 3, 3), [1000, 1000, 0]);
		expectAllClose(subject.autoEnh2xyz(file, 2000, 3000, 3000, false), [1000, 1000, 0]);

		conversion.set("XAxisAbscissa", 0);
		conversion.set("XAxisOrdinate", 1);
		expectAllClose(subject.autoEnh2xyz(file, 0, 3, 3), [1000, 1000, 0]);
	});

	test("map conversion with wcs", () => {
		const file = newFile();
		const { conversion, context } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);
		setWcs(file, context, 1, 2, 3);

		expectAllClose(subject.autoEnh2xyz(file, 0, 0, 0), [0, 0, 0]);
		expectAllClose(subject.autoEnh2xyz(file, 1, 2, 3), [1, 2, 3]);

		setWcs(file, context, 1, 1, 2);
		expectAllClose(subject.autoEnh2xyz(file, 0, 1, 1), [0, 0, 0]);
		expectAllClose(subject.autoEnh2xyz(file, 1, 3, 4), [1, 2, 3]);
	});
});

// Python: `TestAutoZ2E`.
describe("geolocation.autoZ2e", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("no georeferencing", () => {
		const file = newFile();
		expect(subject.autoZ2e(file, 0)).toBe(0);
		expect(subject.autoZ2e(file, 1)).toBe(1);
	});

	test("map conversion", () => {
		const file = newFile();
		const { conversion } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);

		expect(subject.autoZ2e(file, 0)).toBe(3);
		expect(subject.autoZ2e(file, 5)).toBe(8);

		conversion.set("Scale", 0.001);
		expect(subject.autoZ2e(file, 0)).toBeCloseTo(3, 9);
		expect(subject.autoZ2e(file, 0, false)).toBeCloseTo(3000, 9);

		conversion.set("XAxisAbscissa", 0);
		conversion.set("XAxisOrdinate", 1);
		expect(subject.autoZ2e(file, 0)).toBeCloseTo(3, 9);
	});
});

// Python: `TestAutoLocal2Global`.
describe("geolocation.autoLocal2global", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("no georeferencing", () => {
		const file = newFile();
		const m = eye4();
		expectAllClose(Array.from(subject.autoLocal2global(file, m)), Array.from(m));
		m[12] = 1;
		m[13] = 2;
		m[14] = 3;
		expectAllClose(Array.from(subject.autoLocal2global(file, m)), Array.from(m));
	});

	test("map conversion", () => {
		const file = newFile();
		const { conversion } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);

		const m = eye4();
		let m2 = eye4();
		m2[12] = 1;
		m2[13] = 2;
		m2[14] = 3;
		expectAllClose(Array.from(subject.autoLocal2global(file, m)), Array.from(m2));

		conversion.set("Scale", 0.001);
		expectAllClose(Array.from(subject.autoLocal2global(file, m)), Array.from(m2));
		m2[12] = 1000;
		m2[13] = 2000;
		m2[14] = 3000;
		expectAllClose(Array.from(subject.autoLocal2global(file, m, false)), Array.from(m2));

		conversion.set("XAxisAbscissa", 0);
		conversion.set("XAxisOrdinate", 1);
		m[12] = 1000;
		m[13] = 1000;
		m[14] = 0;
		m2 = eye4();
		m2[0] = 0;
		m2[1] = 1;
		m2[2] = 0;
		m2[4] = -1;
		m2[5] = 0;
		m2[6] = 0;
		m2[12] = 0;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.autoLocal2global(file, m)), Array.from(m2));
	});

	test("map conversion with wcs", () => {
		const file = newFile();
		const { conversion, context } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);
		setWcs(file, context, 1, 2, 3);

		const m = eye4();
		const m2 = eye4();
		expectAllClose(Array.from(subject.autoLocal2global(file, m)), Array.from(m2));

		conversion.set("Scale", 0.001);
		setWcs(file, context, 1000, 1000, 2000);
		m[12] = 1000;
		m[13] = 2000;
		m[14] = 3000;
		m2[12] = 1;
		m2[13] = 3;
		m2[14] = 4;
		expectAllClose(Array.from(subject.autoLocal2global(file, m)), Array.from(m2));
	});
});

// Python: `TestAutoGlobal2Local`.
describe("geolocation.autoGlobal2local", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("no georeferencing", () => {
		const file = newFile();
		const m = eye4();
		expectAllClose(Array.from(subject.autoGlobal2local(file, m)), Array.from(m));
		m[12] = 1;
		m[13] = 2;
		m[14] = 3;
		expectAllClose(Array.from(subject.autoGlobal2local(file, m)), Array.from(m));
	});

	test("map conversion", () => {
		const file = newFile();
		const { conversion } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);

		const m = eye4();
		let m2 = eye4();
		m2[12] = 1;
		m2[13] = 2;
		m2[14] = 3;
		expectAllClose(Array.from(subject.autoGlobal2local(file, m2)), Array.from(m));

		conversion.set("Scale", 0.001);
		expectAllClose(Array.from(subject.autoGlobal2local(file, m2)), Array.from(m));
		m2[12] = 1000;
		m2[13] = 2000;
		m2[14] = 3000;
		expectAllClose(Array.from(subject.autoGlobal2local(file, m2, false)), Array.from(m));

		conversion.set("XAxisAbscissa", 0);
		conversion.set("XAxisOrdinate", 1);
		m[12] = 1000;
		m[13] = 1000;
		m[14] = 0;
		m2 = eye4();
		m2[0] = 0;
		m2[1] = 1;
		m2[2] = 0;
		m2[4] = -1;
		m2[5] = 0;
		m2[6] = 0;
		m2[12] = 0;
		m2[13] = 3;
		m2[14] = 3;
		expectAllClose(Array.from(subject.autoGlobal2local(file, m2)), Array.from(m));
	});

	test("map conversion with wcs", () => {
		const file = newFile();
		const { conversion, context } = addGeoreferencing(file);
		conversion.set("Eastings", 1);
		conversion.set("Northings", 2);
		conversion.set("OrthogonalHeight", 3);
		setWcs(file, context, 1, 2, 3);

		const m = eye4();
		const m2 = eye4();
		expectAllClose(Array.from(subject.autoGlobal2local(file, m2)), Array.from(m));

		conversion.set("Scale", 0.001);
		setWcs(file, context, 1000, 1000, 2000);
		m[12] = 1000;
		m[13] = 2000;
		m[14] = 3000;
		m2[12] = 1;
		m2[13] = 3;
		m2[14] = 4;
		expectAllClose(Array.from(subject.autoGlobal2local(file, m2)), Array.from(m));
	});
});

// No dedicated Python test class for `getHelmertTransformationParameters`/`getCrs`/
// `getWcs`/`getGridNorth`/`getTrueNorth` in isolation (`test_geolocation.py` only exercises
// them indirectly through the `auto_*` functions above) -- original coverage matching
// `util/element.ts`/`util/schema.ts`'s own precedent for functions Python itself doesn't
// directly unit-test.
describe("geolocation georeferencing-entity readers", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getHelmertTransformationParameters returns null with no georeferencing", () => {
		const file = newFile();
		expect(subject.getHelmertTransformationParameters(file)).toBeNull();
	});

	test("getHelmertTransformationParameters reads a real IfcMapConversion", () => {
		const file = newFile();
		const { conversion } = addGeoreferencing(file);
		conversion.set("Eastings", 10);
		conversion.set("Northings", 20);
		conversion.set("OrthogonalHeight", 30);
		conversion.set("Scale", 0.5);

		const parameters = subject.getHelmertTransformationParameters(file);
		expect(parameters).not.toBeNull();
		expect(parameters?.e).toBe(10);
		expect(parameters?.n).toBe(20);
		expect(parameters?.h).toBe(30);
		expect(parameters?.scale).toBe(0.5);
		// XAxisAbscissa/XAxisOrdinate both unset (0/falsy) -- defaults to (1, 0).
		expect(parameters?.xaa).toBe(1.0);
		expect(parameters?.xao).toBe(0.0);
		expect(parameters?.factorX).toBe(1);
		expect(parameters?.factorY).toBe(1);
		expect(parameters?.factorZ).toBe(1);
	});

	test("getCrs returns null with no georeferencing, and the real IfcProjectedCRS info once present", () => {
		const file = newFile();
		expect(subject.getCrs(file)).toBeNull();

		addGeoreferencing(file);
		const crs = subject.getCrs(file);
		expect(crs).not.toBeNull();
		expect(crs?.Name).toBe("EPSG:7856");
	});

	// `createTestFile`'s own default context always has an identity `WorldCoordinateSystem`
	// (see `addGeoreferencing`'s own doc comment) -- so "no context at all" (Python's own
	// `get_wcs` docstring/`null`-return case) isn't reachable via this port's test
	// fixture; this test instead covers the identity baseline and a real edit on top of it.
	test("getWcs returns the file's default identity placement, and the real placement once WorldCoordinateSystem is set", () => {
		const file = newFile();
		expectAllClose(Array.from(subject.getWcs(file) as subject.MatrixType), Array.from(eye4()));

		const { context } = addGeoreferencing(file);
		setWcs(file, context, 5, 6, 7);
		const wcs = subject.getWcs(file);
		expect(wcs).not.toBeNull();
		expect(Array.from(wcs as subject.MatrixType).slice(12, 15)).toEqual([5, 6, 7]);
	});

	test("getGridNorth returns 0 with no georeferencing, and the real grid-north angle once present", () => {
		const file = newFile();
		expect(subject.getGridNorth(file)).toBe(0);

		const { conversion } = addGeoreferencing(file);
		conversion.set("XAxisAbscissa", 0);
		conversion.set("XAxisOrdinate", 1);
		expect(subject.getGridNorth(file)).toBeCloseTo(-90, 9);
	});

	// `createTestFile`'s own default context always has a default `TrueNorth` of `(0,1)`
	// (see `addGeoreferencing`'s own doc comment), which `yaxis2angle(0, 1)` happens to
	// map to `0` anyway -- so the baseline and the "no TrueNorth" case both read `0` here,
	// coincidentally; the real, distinguishing assertion is the edit below.
	test("getTrueNorth reflects the file's default TrueNorth direction, and a real edit on top of it", () => {
		const file = newFile();
		expect(subject.getTrueNorth(file)).toBe(0);

		const { context } = addGeoreferencing(file);
		expect(subject.getTrueNorth(file)).toBe(0);

		context.set("TrueNorth", file.createEntity("IfcDirection", [1, 1]));
		expect(subject.getTrueNorth(file)).toBe(-45);
	});
});
