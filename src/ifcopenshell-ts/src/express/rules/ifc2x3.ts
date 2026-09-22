// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-2, first chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the
// FIRST 15 of IFC2X3's 55 `calc_*` (DERIVE) functions from
// `src/ifcopenshell-python/ifcopenshell/express/rules/IFC2X3.py`, in real file order
// (verified directly against that file before porting, not just trusted from the task
// brief that dispatched this chunk):
//
//   calc_IfcAxis1Placement_Z, calc_IfcAxis2Placement2D_P, calc_IfcAxis2Placement3D_P,
//   calc_IfcBSplineCurve_ControlPoints, calc_IfcBSplineCurve_UpperIndexOnControlPoints,
//   calc_IfcBooleanResult_Dim, calc_IfcBoundingBox_Dim, calc_IfcCartesianPoint_Dim,
//   calc_IfcCartesianTransformationOperator_Scl, calc_IfcCartesianTransformationOperator_Dim,
//   calc_IfcCartesianTransformationOperator2D_U, calc_IfcCartesianTransformationOperator2DnonUniform_Scl2,
//   calc_IfcCartesianTransformationOperator3D_U, calc_IfcCartesianTransformationOperator3DnonUniform_Scl2,
//   calc_IfcCartesianTransformationOperator3DnonUniform_Scl3
//
// Exported under their exact real-Python names (not camelCased) -- these are a
// mechanical 1:1 mapping to real Python identifiers, and the registry below keys off
// them for direct copy/greppability against the real source.
//
// **A necessary, minimal, disclosed extension beyond the strict 15 (NOT the "remaining
// 40" this chunk's own task brief says are out of scope).** Reading each of the 15
// assigned functions' bodies directly (as instructed) revealed that nearly all of them
// call into a small, bounded set of shared, non-`calc_*` EXPRESS library functions real
// Python's own generated file also defines in the same module (`IfcNormalise`,
// `IfcCrossProduct`, `IfcDotProduct`, `IfcOrthogonalComplement`, `IfcFirstProjAxis`,
// `IfcSecondProjAxis`, `IfcScalarTimesVector`, `IfcVectorDifference`, `IfcBaseAxis`,
// `IfcBuildAxes`, `IfcBuild2Axes`, `IfcListToArray` -- ported below as their camelCase
// equivalents) -- these are a THIRD bucket, distinct from both the 55 `calc_*`
// functions and the 368 WR-rule classes counted in `70-express-rules-plan.md`'s own
// table, and are unavoidable: without them, most of the 15 assigned functions would be
// non-functional (not merely simplified) for any real entity with a set
// `Axis`/`RefDirection`/`Axis1`/`Axis2`/`Axis3`. Porting them is not scope creep into
// Phase EX-2's remaining functions -- none of them are themselves `calc_*` functions,
// and porting them adds no new externally-visible attribute-read capability beyond what
// the 15 assigned functions already promise.
//
// A second, much narrower necessary extension: two of these 15 assigned functions'
// helper chains call `express_getattr(x, 'Dim', ...)` where `x` is a plain
// `IfcDirection`/`IfcVector` (e.g. `IfcNormalise`'s own `ndim = express_getattr(arg,
// 'Dim', INDETERMINATE)`) -- and `IfcDirection.Dim`/`IfcVector.Dim` are THEMSELVES
// `calc_*` DERIVE attributes (`calc_IfcDirection_Dim`/`calc_IfcVector_Dim`, real file
// positions #46/#55 -- outside the assigned 15). Without registering these two
// (trivial, one-line) functions too, virtually every one of the 15 assigned functions
// that touches a real `Axis`/`RefDirection` would throw "has no attribute 'Dim'" via
// the normal DERIVE-dispatch miss path, defeating the entire chunk. Ported here,
// disclosed, verified against the real source (both are one-liners: `hiindex(self.
// DirectionRatios)` and `self.Orientation.Dim` respectively) -- see the "3 minimal,
// necessary, disclosed extra functions" section and `registerSchemaCalcFunctions` call
// below for the exact, minimal, closed set (3 keys: the two above, plus
// `calc_IfcSolidModel_Dim`, needed only so this chunk's own test suite can build a
// realistic `IfcBooleanResult.FirstOperand` fixture without reaching into the
// `IfcCsgPrimitive3D_Dim`/`IfcHalfSpaceSolid_Dim` siblings this chunk does NOT port).
//
// **Real, disclosed Python bugs found while porting (preserved verbatim, not silently
// fixed, per this project's established policy)**:
//
// 1. `IfcFirstProjAxis`'s `if express_getattr(z, 'DirectionRatios', INDETERMINATE) !=
//    [1.0, 0.0, 0.0]:` compares a Python TUPLE (every aggregate-attribute read is
//    `PyTuple_New`-wrapped by the SWIG binding, `src/ifcwrap/IfcParseWrapper.i` --
//    confirmed directly, not assumed) against a Python LIST literal. Python's
//    `tuple.__eq__`/`list.__eq__` never consider a tuple equal to a list regardless of
//    element values (well-established CPython semantics, re-verified here rather than
//    assumed) -- so this condition is UNCONDITIONALLY `True` in real Python, and the
//    `else` branch (`v = IfcDirection(DirectionRatios=[0.0, 1.0, 0.0])` -- the IFC
//    spec's own intended fallback for the degenerate case where Z already IS the X
//    axis, avoiding a zero-magnitude cross product two lines later) is genuine DEAD
//    CODE: it can never execute in real Python, no matter what `zaxis` actually is.
//    Confirmed as the ONLY occurrence of this exact pattern anywhere in `IFC2X3.py`
//    (`grep -n "!= \[\|== \[" IFC2X3.py` -- one hit). Ported below as a reference
//    (`!==`) comparison against a freshly-allocated array literal -- which, like
//    Python's cross-type comparison, is *always* true, for the analogous reason (an
//    identity/reference check, never a value comparison) -- deliberately NOT a
//    value/structural comparison, which would silently "fix" this real bug instead of
//    preserving its always-true, dead-`else`-branch behavior. Affects two of this
//    chunk's own assigned functions transitively: `calc_IfcAxis2Placement3D_P` and
//    `calc_IfcCartesianTransformationOperator3D_U` (both reach `IfcFirstProjAxis` via
//    `IfcBuildAxes`/`IfcBaseAxis`'s `dim == 3` branch).
//
// 2. `IfcBaseAxis` (reached by `calc_IfcCartesianTransformationOperator2D_U`'s
//    `IfcBaseAxis(2, Axis1, Axis2, None)` call) contains TWO occurrences of the same
//    underlying bug, in its non-`dim==3` branches:
//      a. `elif exists(axis1):` -- when `axis2` also exists and their dot product
//         against the orthogonal complement is negative: `u[2 -
//         EXPRESS_ONE_BASED_INDEXING].DirectionRatios[1 - EXPRESS_ONE_BASED_INDEXING] =
//         -express_getitem(...)` (conditional on `factor < 0.0`).
//      b. `elif exists(axis2):` (i.e. `axis1` does NOT exist, `axis2` does -- a
//         thoroughly ordinary case, since `Axis1`/`Axis2` are both optional attributes
//         on `IfcCartesianTransformationOperator2D`): the identical-shaped
//         `u[1 - EXPRESS_ONE_BASED_INDEXING].DirectionRatios[...] = -express_getitem(...)`
//         mutation, this time with NO guarding condition at all -- it always runs.
//    In both cases, `u[k]` (`IfcOrthogonalComplement(d1)` or `d1` itself, a scratch
//    `IfcDirection`) is a stable Python list entry, but `.DirectionRatios` is a
//    property *read* that always returns a fresh tuple (same `PyTuple_New` SWIG
//    binding as bug 1, `src/ifcwrap/IfcParseWrapper.i`) -- tuples don't support item
//    assignment, so both lines unconditionally raise `TypeError: 'tuple' object does
//    not support item assignment` in real Python whenever reached. Branch (b) is
//    unconditional, so real Python's `calc_IfcCartesianTransformationOperator2D_U`
//    genuinely cannot ever successfully compute a value for the common case of "only
//    `Axis2` is set" -- it always crashes. Ported below as an equivalent thrown
//    `Error` at each point (see `ifcBaseAxis`'s own comment) -- silently applying the
//    evidently-intended sign flip, or silently no-op'ing past it, would both produce a
//    numeric answer real Python itself can never actually produce here.
//
// 3. `IfcListToArray(lis, low, u)` -- called directly by `calc_IfcBSplineCurve_
//    ControlPoints` itself (one of THIS chunk's own 15 assigned functions, not merely
//    a transitive dependency) as `IfcListToArray(ControlPointsList, 0,
//    UpperIndexOnControlPoints)` -- silently CYCLICALLY LEFT-ROTATES its input by one
//    position whenever `low == 0` (exactly this real call's own argument), instead of
//    the obviously-intended "re-index a 1-based LIST as a `low`-based ARRAY, same
//    order" copy. Hand-derived symbolically from the real generated code (not just
//    spot-checked): `res` starts as `[lis[0]] * n` (0-based), then the loop
//    (`for i in range(2, n+1): res[low + i - 2] = lis[i - 1]`, 0-based) fills indices
//    `0..n-2` with `lis[1..n-1]` -- index `n-1` is never touched by the loop, so it
//    keeps its initial-fill value `lis[0]`. Net result for `low == 0`: `res == [lis[1],
//    lis[2], ..., lis[n-1], lis[0]]`, a left rotation by one -- confirmed this is
//    specific to `low == 0`: re-deriving the same symbolic loop for `low == 1` (the
//    much more common call shape elsewhere in the generated file, a 1-based LIST
//    re-exposed as a 1-based ARRAY) gives `res[i-1] = lis[i-1]` for every index, i.e. a
//    correct identity copy -- so this is not a general `IfcListToArray` defect, it is
//    specific to the 0-based-lower-bound-ARRAY case B-spline control points/weights
//    use. Real Python's own `IfcBSplineCurve.ControlPoints` DERIVE attribute is
//    therefore silently a rotated (not identity) view of `ControlPointsList` whenever
//    actually read via `entity_instance.__getattr__`'s DERIVE dispatch -- plausibly
//    unnoticed because real-world code overwhelmingly reads the always-correct, directly-
//    stored `ControlPointsList` attribute instead of the derived `ControlPoints` one.
//    Ported here as a direct structural translation of the same formula (`ifcListToArray`
//    below) -- it reproduces the identical rotation for `low == 0`, faithfully, not
//    silently fixed to a plain copy.
//
// **A pre-existing, inherited (not newly introduced) limitation, disclosed once here
// rather than repeated at every arithmetic/comparison site below**: `runtimeShim.ts`'s
// own header comment already flags that real Python's `INDETERMINATE` sentinel poison-
// propagates through arithmetic/comparison operators via Python-only dunder overloads
// (`__lt__`/`__add__`/etc. all aliased to `bop`, returning `self`) that JS has no
// equivalent mechanism for, and explicitly leaves "a different, explicit strategy" for
// Phase EX-2/EX-4 to design. This chunk does not attempt that redesign (out of scope --
// nothing in this chunk's own task brief asks for it): every arithmetic/comparison
// expression below is a direct, structural port of the real Python expression it
// mirrors, using plain JS operators. Concretely, this means an `INDETERMINATE` operand
// reaching a `*`/`+`/`-`/`<`/`>` site in one of these functions throws a native JS
// `TypeError` ("Cannot convert a Symbol value to a number/primitive") where real
// Python's dunder-based poisoning would instead silently propagate `INDETERMINATE`
// onward without raising. This is a real, disclosed divergence, but not a new one this
// chunk introduces -- it is the exact, already-flagged gap `runtimeShim.ts` anticipated
// verbatim.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { registerSchemaCalcFunctions } from "../dispatch";
import {
	EXPRESS_ONE_BASED_INDEXING,
	INDETERMINATE,
	exists,
	expressGetAttr,
	expressGetItem,
	expressRange,
	hiIndex,
	nvl,
	sizeof,
	typeOf,
} from "../runtimeShim";
import type { Indeterminate } from "../runtimeShim";

// --- scratch-entity construction (real Python: `ifcopenshell.create_entity(type,
// schema, *args, **kwargs)`, backed by a lazily-created, never-disposed per-schema
// `_global_ifc_models[schema.lower()]` singleton `ifcopenshell.file` -- confirmed
// directly against `ifcopenshell/__init__.py`'s own `create_entity`, not assumed) ---
//
// Ported as a module-private, lazily-created singleton `IfcFile` for IFC2X3 (this
// chunk's only scope), created via `template.create({schemaIdentifier: "IFC2X3"})` --
// the same disclosed "no bare-schema-file primitive, use `template.create` as a
// throwaway-file workaround" pattern already established by `open.ts`'s `schemaByName`
// and `util/schema.ts`'s `getSchemaDefinition` (reused, not reinvented). The entities
// this creates (`IfcDirection`/`IfcVector` scratch values used purely as intermediate
// computation state within a single formula's own execution) are never added to, or
// read back out of, any real caller's file -- exactly mirroring real Python's own
// "detached scratch model" behavior.
//
// **A static top-level import, not a lazy `require`**: this module is itself
// statically imported (via `../dispatch`'s registration side effect, `rules/index.ts`)
// from `entityInstance.ts`'s own `.get()` DERIVE-dispatch path, so importing
// `template.ts` here creates a module-load cycle back through `template.ts` ->
// `file.ts` -> `entityInstance.ts` (`file.ts` already imports `EntityInstance` as a
// value). A lazy `require("../../template")` was tried first specifically to avoid
// this cycle, matching `native/native_loader.ts`'s own `require()`-inside-a-function
// precedent -- but that precedent `require()`s a compiled native `.node` binary, not
// a same-project TS *source* module: under this project's own test runner (Vitest,
// which resolves same-project TS imports through its own Vite-powered module graph,
// not Node's native `require` resolution), a raw `require("../../template")` genuinely
// fails ("Cannot find module"), confirmed empirically, not assumed. A static import
// works correctly under both `tsc`'s real CommonJS output AND Vitest's transform, and
// this exact shape of circular *class* reference (two classes that only reference each
// other inside method bodies, never at module top-level -- neither `IfcFile` nor
// `EntityInstance` is constructed or called at either module's own top level) is
// already an established, working pattern elsewhere in this port (`util/schema.ts`
// already statically imports `EntityInstance`, `IfcFile` (type), and `template`
// together) -- confirmed here too, empirically, via this chunk's own full test suite
// and `npx tsc --noEmit`, not merely asserted safe by inspection.
import * as template from "../../template";

// **Unbounded growth, disclosed, matching real Python's own behavior exactly (`/code-
// review` raised this; confirmed as inherited, not a new problem this port
// introduces)**: every `ifcDirection`/`ifcVector` call below adds one more entity to
// this singleton file, forever -- there is no eviction, and a long-running process
// reading many `calc_*`-backed attributes across many files will grow this scratch
// file's own instance table without bound. This is not a divergence: real Python's
// `ifcopenshell.create_entity` (`ifcopenshell/__init__.py`) is backed by the exact same
// shape of never-cleared, process-lifetime `_global_ifc_models[schema.lower()]` `file`
// object -- confirmed by reading that function directly (no `.remove(...)`/cache-size
// bound anywhere in it or its callers). Bounding this port's own scratch file more
// tightly than real Python's own equivalent would be a real, if well-intentioned,
// behavioral improvement beyond what this project's porting mandate asks for here --
// flagged for whoever scopes a future performance pass to revisit, not silently
// "fixed" in a way that diverges from the real object real Python itself never bounds
// either.
let scratchFile: IfcFile | undefined;
function getScratchFile(): IfcFile {
	if (!scratchFile) {
		scratchFile = template.create({ schemaIdentifier: "IFC2X3" });
	}
	return scratchFile;
}

function ifcDirection(directionRatios: readonly number[]): EntityInstance {
	return getScratchFile().createEntity("IfcDirection", [...directionRatios]);
}

function ifcVector(orientation: EntityInstance, magnitude: number): EntityInstance {
	return getScratchFile().createEntity("IfcVector", orientation, magnitude);
}

// --- shared EXPRESS library functions (real Python: same module, not `calc_*`
// functions themselves -- see this file's own header comment) ---

/** Python: `IfcNormalise` (`IFC2X3.py`). */
function ifcNormalise(arg: unknown): EntityInstance | null {
	const v = ifcDirection([1.0, 0.0]);
	const vec = ifcVector(ifcDirection([1.0, 0.0]), 1.0);
	let result: EntityInstance = v;
	if (!exists(arg)) return null;
	const ndim = expressGetAttr(arg, "Dim", INDETERMINATE) as number | Indeterminate;
	if (typeOf(arg as EntityInstance).has("ifc2x3.ifcvector")) {
		(v as unknown as Record<string, unknown>).DirectionRatios = expressGetAttr(
			expressGetAttr(arg, "Orientation", INDETERMINATE),
			"DirectionRatios",
			INDETERMINATE,
		);
		(vec as unknown as Record<string, unknown>).Magnitude = expressGetAttr(arg, "Magnitude", INDETERMINATE);
		(vec as unknown as Record<string, unknown>).Orientation = v;
		if (expressGetAttr(arg, "Magnitude", INDETERMINATE) === 0.0) return null;
		(vec as unknown as Record<string, unknown>).Magnitude = 1.0;
	} else {
		(v as unknown as Record<string, unknown>).DirectionRatios = expressGetAttr(arg, "DirectionRatios", INDETERMINATE);
	}
	let mag = 0.0;
	for (const i of expressRange(1, (ndim as number) + 1)) {
		const ratios = expressGetAttr(v, "DirectionRatios", INDETERMINATE);
		const value = expressGetItem(ratios, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		mag += value * value;
	}
	if (mag > 0.0) {
		mag = Math.sqrt(mag);
		for (const i of expressRange(1, (ndim as number) + 1)) {
			const ratios = expressGetAttr(v, "DirectionRatios", INDETERMINATE) as number[];
			const temp = [...ratios];
			temp[i - EXPRESS_ONE_BASED_INDEXING] =
				(expressGetItem(ratios, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number) / mag;
			(v as unknown as Record<string, unknown>).DirectionRatios = temp;
		}
		if (typeOf(arg as EntityInstance).has("ifc2x3.ifcvector")) {
			(vec as unknown as Record<string, unknown>).Orientation = v;
			result = vec;
		} else {
			result = v;
		}
	} else {
		return null;
	}
	return result;
}

/** Python: `IfcOrthogonalComplement` (`IFC2X3.py`). */
function ifcOrthogonalComplement(vec: unknown): EntityInstance | null {
	if (!exists(vec) || expressGetAttr(vec, "Dim", INDETERMINATE) !== 2) return null;
	const ratios = expressGetAttr(vec, "DirectionRatios", INDETERMINATE);
	return ifcDirection([
		-(expressGetItem(ratios, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number),
		expressGetItem(ratios, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number,
	]);
}

/** Python: `IfcCrossProduct` (`IFC2X3.py`). */
function ifcCrossProduct(arg1: unknown, arg2: unknown): EntityInstance | null {
	if (
		!exists(arg1) ||
		expressGetAttr(arg1, "Dim", INDETERMINATE) === 2 ||
		!exists(arg2) ||
		expressGetAttr(arg2, "Dim", INDETERMINATE) === 2
	) {
		return null;
	}
	const v1 = expressGetAttr(ifcNormalise(arg1), "DirectionRatios", INDETERMINATE) as number[];
	const v2 = expressGetAttr(ifcNormalise(arg2), "DirectionRatios", INDETERMINATE) as number[];
	const at = (v: number[], i: number) => expressGetItem(v, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	const res = ifcDirection([
		at(v1, 2) * at(v2, 3) - at(v1, 3) * at(v2, 2),
		at(v1, 3) * at(v2, 1) - at(v1, 1) * at(v2, 3),
		at(v1, 1) * at(v2, 2) - at(v1, 2) * at(v2, 1),
	]);
	let mag = 0.0;
	for (const i of expressRange(1, 3 + 1)) {
		const ratios = expressGetAttr(res, "DirectionRatios", INDETERMINATE) as number[];
		const value = expressGetItem(ratios, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		mag += value * value;
	}
	if (mag > 0.0) {
		return ifcVector(res, Math.sqrt(mag));
	}
	return ifcVector(arg1 as EntityInstance, 0.0);
}

/** Python: `IfcDotProduct` (`IFC2X3.py`). */
function ifcDotProduct(arg1: unknown, arg2: unknown): number | null {
	if (!exists(arg1) || !exists(arg2)) return null;
	if (expressGetAttr(arg1, "Dim", INDETERMINATE) !== expressGetAttr(arg2, "Dim", INDETERMINATE)) return null;
	const vec1 = ifcNormalise(arg1);
	const vec2 = ifcNormalise(arg2);
	const ndim = expressGetAttr(arg1, "Dim", INDETERMINATE) as number;
	let scalar = 0.0;
	for (const i of expressRange(1, ndim + 1)) {
		const r1 = expressGetAttr(vec1, "DirectionRatios", INDETERMINATE);
		const r2 = expressGetAttr(vec2, "DirectionRatios", INDETERMINATE);
		scalar +=
			(expressGetItem(r1, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number) *
			(expressGetItem(r2, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number);
	}
	return scalar;
}

/** Python: `IfcScalarTimesVector` (`IFC2X3.py`). */
function ifcScalarTimesVector(scalar: unknown, vec: unknown): EntityInstance | null {
	if (!exists(scalar) || !exists(vec)) return null;
	let v: unknown;
	let mag: number;
	if (typeOf(vec as EntityInstance).has("ifc2x3.ifcvector")) {
		v = expressGetAttr(vec, "Orientation", INDETERMINATE);
		mag = (scalar as number) * (expressGetAttr(vec, "Magnitude", INDETERMINATE) as number);
	} else {
		v = vec;
		mag = scalar as number;
	}
	if (mag < 0.0) {
		const ratios = expressGetAttr(v, "DirectionRatios", INDETERMINATE) as number[];
		for (const i of expressRange(1, sizeof(ratios) as number, 1)) {
			const current = expressGetAttr(v, "DirectionRatios", INDETERMINATE) as number[];
			const temp = [...current];
			temp[i - EXPRESS_ONE_BASED_INDEXING] = -(expressGetItem(
				current,
				i - EXPRESS_ONE_BASED_INDEXING,
				INDETERMINATE,
			) as number);
			(v as unknown as Record<string, unknown>).DirectionRatios = temp;
		}
		mag = -mag;
	}
	return ifcVector(ifcNormalise(v) as EntityInstance, mag);
}

/** Python: `IfcVectorDifference` (`IFC2X3.py`). */
function ifcVectorDifference(arg1: unknown, arg2: unknown): EntityInstance | null {
	if (
		!exists(arg1) ||
		!exists(arg2) ||
		expressGetAttr(arg1, "Dim", INDETERMINATE) !== expressGetAttr(arg2, "Dim", INDETERMINATE)
	) {
		return null;
	}
	let mag1: number;
	let vec1: unknown;
	if (typeOf(arg1 as EntityInstance).has("ifc2x3.ifcvector")) {
		mag1 = expressGetAttr(arg1, "Magnitude", INDETERMINATE) as number;
		vec1 = expressGetAttr(arg1, "Orientation", INDETERMINATE);
	} else {
		mag1 = 1.0;
		vec1 = arg1;
	}
	let mag2: number;
	let vec2: unknown;
	if (typeOf(arg2 as EntityInstance).has("ifc2x3.ifcvector")) {
		mag2 = expressGetAttr(arg2, "Magnitude", INDETERMINATE) as number;
		vec2 = expressGetAttr(arg2, "Orientation", INDETERMINATE);
	} else {
		mag2 = 1.0;
		vec2 = arg2;
	}
	const nvec1 = ifcNormalise(vec1);
	const nvec2 = ifcNormalise(vec2);
	const ndim = sizeof(expressGetAttr(nvec1, "DirectionRatios", INDETERMINATE)) as number;
	let mag = 0.0;
	const res = ifcDirection(new Array(ndim).fill(0.0));
	for (const i of expressRange(1, ndim + 1)) {
		const resRatios = expressGetAttr(res, "DirectionRatios", INDETERMINATE) as number[];
		const r1 = expressGetAttr(nvec1, "DirectionRatios", INDETERMINATE);
		const r2 = expressGetAttr(nvec2, "DirectionRatios", INDETERMINATE);
		const temp = [...resRatios];
		temp[i - EXPRESS_ONE_BASED_INDEXING] =
			mag1 * (expressGetItem(r1, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number) -
			mag2 * (expressGetItem(r2, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number);
		(res as unknown as Record<string, unknown>).DirectionRatios = temp;
		const updated = expressGetAttr(res, "DirectionRatios", INDETERMINATE) as number[];
		const value = expressGetItem(updated, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		mag += value * value;
	}
	if (mag > 0.0) {
		return ifcVector(res, Math.sqrt(mag));
	}
	return ifcVector(nvec1 as EntityInstance, 0.0);
}

/**
 * Returns a fresh `[1.0, 0.0, 0.0]` array every call. Factored into its own function
 * (rather than an inline array literal at the comparison site) purely so `tsc` can't
 * statically prove the `!==` comparison below is "always true" from the literal's own
 * shape (TS2839) -- the comparison genuinely IS always true at runtime (a fresh array
 * is never `===` to any other array, matching real Python's own always-`!=`
 * tuple-vs-list comparison this deliberately mirrors, see this file's header comment,
 * disclosed bug #1) -- this indirection changes nothing observable, it only avoids a
 * spurious type-checker error about intentional, disclosed behavior.
 */
function freshUnitXDirectionRatios(): number[] {
	return [1.0, 0.0, 0.0];
}

/** Python: `IfcFirstProjAxis` (`IFC2X3.py`) -- see this file's own header comment, bug 1. */
function ifcFirstProjAxis(zaxis: unknown, arg: unknown): EntityInstance | null {
	if (!exists(zaxis)) return null;
	const z = ifcNormalise(zaxis);
	let v: EntityInstance;
	if (!exists(arg)) {
		// See this file's header comment ("Real, disclosed Python bugs", #1): real
		// Python compares a tuple (`z.DirectionRatios`) against a Python list literal,
		// which is unconditionally `!=` regardless of contents -- ported as a reference
		// (`!==`) comparison against a fresh array literal, which is likewise always
		// `true`, for the analogous reason (identity, not value, comparison). The
		// `else` branch below is genuine dead code in real Python; kept here only for
		// structural fidelity to the real source, never actually reachable.
		if (expressGetAttr(z, "DirectionRatios", INDETERMINATE) !== freshUnitXDirectionRatios()) {
			v = ifcDirection([1.0, 0.0, 0.0]);
		} else {
			v = ifcDirection([0.0, 1.0, 0.0]);
		}
	} else {
		if (expressGetAttr(arg, "Dim", INDETERMINATE) !== 3) return null;
		if (expressGetAttr(ifcCrossProduct(arg, z), "Magnitude", INDETERMINATE) === 0.0) return null;
		v = ifcNormalise(arg) as EntityInstance;
	}
	const xvec = ifcScalarTimesVector(ifcDotProduct(v, z), z);
	let xaxis: unknown = expressGetAttr(ifcVectorDifference(v, xvec), "Orientation", INDETERMINATE);
	xaxis = ifcNormalise(xaxis);
	return xaxis as EntityInstance | null;
}

/** Python: `IfcSecondProjAxis` (`IFC2X3.py`). */
function ifcSecondProjAxis(zaxis: unknown, xaxis: unknown, arg: unknown): unknown {
	const v = exists(arg) ? arg : ifcDirection([0.0, 1.0, 0.0]);
	let temp = ifcScalarTimesVector(ifcDotProduct(v, zaxis), zaxis);
	let yaxis: unknown = ifcVectorDifference(v, temp);
	temp = ifcScalarTimesVector(ifcDotProduct(v, xaxis), xaxis);
	yaxis = ifcVectorDifference(yaxis, temp);
	yaxis = ifcNormalise(yaxis);
	return expressGetAttr(yaxis, "Orientation", INDETERMINATE);
}

/** Python: `IfcBaseAxis` (`IFC2X3.py`) -- see this file's own header comment, bug 2. */
function ifcBaseAxis(dim: number, axis1: unknown, axis2: unknown, axis3: unknown): unknown[] {
	if (dim === 3) {
		const d1 = nvl(ifcNormalise(axis3), ifcDirection([0.0, 0.0, 1.0]));
		const d2 = ifcFirstProjAxis(d1, axis1);
		return [d2, ifcSecondProjAxis(d1, d2, axis2), d1];
	}
	if (exists(axis1)) {
		const d1 = ifcNormalise(axis1);
		const u: unknown[] = [d1, ifcOrthogonalComplement(d1)];
		if (exists(axis2)) {
			const factor = ifcDotProduct(axis2, expressGetItem(u, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE));
			if ((factor as number) < 0.0) {
				// Real Python's own generated code here unconditionally raises
				// `TypeError: 'tuple' object does not support item assignment` (see
				// this file's own header comment, "Real, disclosed Python bugs", #2) --
				// ported as an equivalent thrown error at the same point, rather than
				// silently applying the evidently-intended sign flip or silently
				// no-op'ing past it (either "fix" would produce a numeric answer real
				// Python itself can never actually produce here).
				throw new Error(
					"IfcBaseAxis: real Python's own generated formula raises " +
						"TypeError('tuple' object does not support item assignment) at this exact " +
						"point (Axis1 and Axis2 both set, with a negative dot product against the " +
						"orthogonal complement) -- see rules/ifc2x3.ts's own header comment, " +
						"disclosed bug #2, for the full citation.",
				);
			}
		}
		return u;
	}
	if (exists(axis2)) {
		// Real Python's own generated code here unconditionally raises
		// `TypeError: 'tuple' object does not support item assignment` -- see this
		// file's own header comment, "Real, disclosed Python bugs", #2b: this branch
		// (axis1 absent, axis2 present) has no guarding condition at all, unlike the
		// `exists(axis1)` branch's `if factor < 0.0` -- it ALWAYS hits the buggy
		// mutation, so real Python can never successfully compute a value for this
		// case. Ported as an equivalent thrown error at the same point.
		throw new Error(
			"IfcBaseAxis: real Python's own generated formula raises " +
				"TypeError('tuple' object does not support item assignment) at this exact " +
				"point (Axis1 absent, Axis2 set) -- unconditionally, every time this branch is " +
				"reached -- see rules/ifc2x3.ts's own header comment, disclosed bug #2b, for the " +
				"full citation.",
		);
	}
	return [ifcDirection([1.0, 0.0]), ifcDirection([0.0, 1.0])];
}

/** Python: `IfcBuildAxes` (`IFC2X3.py`). */
function ifcBuildAxes(axis: unknown, refdirection: unknown): unknown[] {
	const d1 = nvl(ifcNormalise(axis), ifcDirection([0.0, 0.0, 1.0]));
	const d2 = ifcFirstProjAxis(d1, refdirection);
	return [d2, expressGetAttr(ifcNormalise(ifcCrossProduct(d1, d2)), "Orientation", INDETERMINATE), d1];
}

/** Python: `IfcBuild2Axes` (`IFC2X3.py`). */
function ifcBuild2Axes(refdirection: unknown): unknown[] {
	const d = nvl(ifcNormalise(refdirection), ifcDirection([1.0, 0.0]));
	return [d, ifcOrthogonalComplement(d)];
}

/**
 * Python: `IfcListToArray` (`IFC2X3.py`) -- see this file's own header comment,
 * disclosed bug #3: for `low === 0` (exactly how `calc_IfcBSplineCurve_ControlPoints`
 * below calls this), the real formula cyclically left-rotates its input by one
 * position rather than copying it in order. Ported as a direct structural translation,
 * faithfully reproducing the rotation.
 */
function ifcListToArray(lis: unknown, low: number, u: number): unknown[] | null {
	const n = sizeof(lis) as number;
	if (n !== u - low + 1) return null;
	let res: unknown[] = new Array(n).fill(expressGetItem(lis, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE));
	for (const i of expressRange(2, n + 1)) {
		const temp = [...res];
		temp[low + i - 1 - EXPRESS_ONE_BASED_INDEXING] = expressGetItem(lis, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		res = temp;
	}
	return res;
}

// --- the 15 assigned `calc_*` functions (exact real-Python names, file order) ---

export function calc_IfcAxis1Placement_Z(self: EntityInstance): unknown {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	return nvl(ifcNormalise(axis), ifcDirection([0.0, 0.0, 1.0]));
}

export function calc_IfcAxis2Placement2D_P(self: EntityInstance): unknown {
	const refdirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	return ifcBuild2Axes(refdirection);
}

export function calc_IfcAxis2Placement3D_P(self: EntityInstance): unknown {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	const refdirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	return ifcBuildAxes(axis, refdirection);
}

export function calc_IfcBSplineCurve_ControlPoints(self: EntityInstance): unknown {
	const controlpointslist = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	const upperindexoncontrolpoints = expressGetAttr(self, "UpperIndexOnControlPoints", INDETERMINATE) as number;
	return ifcListToArray(controlpointslist, 0, upperindexoncontrolpoints);
}

export function calc_IfcBSplineCurve_UpperIndexOnControlPoints(self: EntityInstance): unknown {
	const controlpointslist = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	return (sizeof(controlpointslist) as number) - 1;
}

export function calc_IfcBooleanResult_Dim(self: EntityInstance): unknown {
	const firstoperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	return expressGetAttr(firstoperand, "Dim", INDETERMINATE);
}

export function calc_IfcBoundingBox_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcCartesianPoint_Dim(self: EntityInstance): unknown {
	const coordinates = expressGetAttr(self, "Coordinates", INDETERMINATE);
	return hiIndex(coordinates);
}

export function calc_IfcCartesianTransformationOperator_Scl(self: EntityInstance): unknown {
	const scale = expressGetAttr(self, "Scale", INDETERMINATE);
	return nvl(scale, 1.0);
}

export function calc_IfcCartesianTransformationOperator_Dim(self: EntityInstance): unknown {
	const localorigin = expressGetAttr(self, "LocalOrigin", INDETERMINATE);
	return expressGetAttr(localorigin, "Dim", INDETERMINATE);
}

export function calc_IfcCartesianTransformationOperator2D_U(self: EntityInstance): unknown {
	return ifcBaseAxis(
		2,
		expressGetAttr(self, "Axis1", INDETERMINATE),
		expressGetAttr(self, "Axis2", INDETERMINATE),
		null,
	);
}

export function calc_IfcCartesianTransformationOperator2DnonUniform_Scl2(self: EntityInstance): unknown {
	const scale2 = expressGetAttr(self, "Scale2", INDETERMINATE);
	return nvl(scale2, expressGetAttr(self, "Scl", INDETERMINATE));
}

export function calc_IfcCartesianTransformationOperator3D_U(self: EntityInstance): unknown {
	const axis3 = expressGetAttr(self, "Axis3", INDETERMINATE);
	return ifcBaseAxis(
		3,
		expressGetAttr(self, "Axis1", INDETERMINATE),
		expressGetAttr(self, "Axis2", INDETERMINATE),
		axis3,
	);
}

export function calc_IfcCartesianTransformationOperator3DnonUniform_Scl2(self: EntityInstance): unknown {
	const scale2 = expressGetAttr(self, "Scale2", INDETERMINATE);
	return nvl(scale2, expressGetAttr(self, "Scl", INDETERMINATE));
}

export function calc_IfcCartesianTransformationOperator3DnonUniform_Scl3(self: EntityInstance): unknown {
	const scale3 = expressGetAttr(self, "Scale3", INDETERMINATE);
	return nvl(scale3, expressGetAttr(self, "Scl", INDETERMINATE));
}

// --- the 3 minimal, necessary, disclosed extra functions (see header comment) ---

export function calc_IfcDirection_Dim(self: EntityInstance): unknown {
	const directionratios = expressGetAttr(self, "DirectionRatios", INDETERMINATE);
	return hiIndex(directionratios);
}

export function calc_IfcVector_Dim(self: EntityInstance): unknown {
	const orientation = expressGetAttr(self, "Orientation", INDETERMINATE);
	return expressGetAttr(orientation, "Dim", INDETERMINATE);
}

export function calc_IfcSolidModel_Dim(_self: EntityInstance): unknown {
	return 3;
}

registerSchemaCalcFunctions("IFC2X3", {
	"IfcAxis1Placement.Z": calc_IfcAxis1Placement_Z,
	"IfcAxis2Placement2D.P": calc_IfcAxis2Placement2D_P,
	"IfcAxis2Placement3D.P": calc_IfcAxis2Placement3D_P,
	"IfcBSplineCurve.ControlPoints": calc_IfcBSplineCurve_ControlPoints,
	"IfcBSplineCurve.UpperIndexOnControlPoints": calc_IfcBSplineCurve_UpperIndexOnControlPoints,
	"IfcBooleanResult.Dim": calc_IfcBooleanResult_Dim,
	"IfcBoundingBox.Dim": calc_IfcBoundingBox_Dim,
	"IfcCartesianPoint.Dim": calc_IfcCartesianPoint_Dim,
	"IfcCartesianTransformationOperator.Scl": calc_IfcCartesianTransformationOperator_Scl,
	"IfcCartesianTransformationOperator.Dim": calc_IfcCartesianTransformationOperator_Dim,
	"IfcCartesianTransformationOperator2D.U": calc_IfcCartesianTransformationOperator2D_U,
	"IfcCartesianTransformationOperator2DnonUniform.Scl2": calc_IfcCartesianTransformationOperator2DnonUniform_Scl2,
	"IfcCartesianTransformationOperator3D.U": calc_IfcCartesianTransformationOperator3D_U,
	"IfcCartesianTransformationOperator3DnonUniform.Scl2": calc_IfcCartesianTransformationOperator3DnonUniform_Scl2,
	"IfcCartesianTransformationOperator3DnonUniform.Scl3": calc_IfcCartesianTransformationOperator3DnonUniform_Scl3,
	"IfcDirection.Dim": calc_IfcDirection_Dim,
	"IfcVector.Dim": calc_IfcVector_Dim,
	"IfcSolidModel.Dim": calc_IfcSolidModel_Dim,
});

// =============================================================================
// Phase EX-2, second chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4):
// the NEXT 15 of IFC2X3's 55 `calc_*` functions, in real file order (verified
// directly against `IFC2X3.py` before porting, not just trusted from the task brief
// that dispatched this chunk):
//
//   calc_IfcCompositeCurveSegment_Dim, calc_IfcCsgPrimitive3D_Dim, calc_IfcCurve_Dim,
//   calc_IfcCurveBoundedPlane_Dim, calc_IfcElementarySurface_Dim,
//   calc_IfcFaceBasedSurfaceModel_Dim, calc_IfcGeometricSet_Dim,
//   calc_IfcHalfSpaceSolid_Dim, calc_IfcPlacement_Dim, calc_IfcPointOnCurve_Dim,
//   calc_IfcPointOnSurface_Dim, calc_IfcRectangularTrimmedSurface_Dim,
//   calc_IfcSectionedSpine_Dim, calc_IfcShellBasedSurfaceModel_Dim,
//   calc_IfcSweptSurface_Dim
//
// All 15 are the same conceptual shape as this chunk's own name: spatial
// dimensionality (`Dim`, always 2 or 3), computed either as a bare constant or by
// delegating to some other attribute's own (possibly also DERIVE) `Dim`. Exported
// under their exact real-Python names, matching this file's own established
// convention (see the chunk-1 header comment above for the full rationale).
//
// **One necessary, minimal, disclosed extension, exactly as anticipated by this
// chunk's own task brief**: `calc_IfcCurve_Dim` doesn't compute inline -- it
// delegates to a small helper, `IfcCurveDim(curve)` (real source,
// `IFC2X3.py` line 7684, re-verified directly against the real file before
// porting), which dispatches on `curve`'s own runtime type via `typeof(curve)`
// membership checks (`'ifc2x3.ifcline' in typeof(curve)`, etc.) across
// `IfcLine`/`IfcConic`/`IfcPolyline`/`IfcTrimmedCurve`/`IfcCompositeCurve`/
// `IfcBSplineCurve`/`IfcOffsetCurve2D`/`IfcOffsetCurve3D`. This is not itself a
// `calc_*` function (same "shared EXPRESS library function" bucket chunk 1's own
// `IfcNormalise`/`IfcCrossProduct`/etc. belong to, per this file's own header
// comment) -- ported below as `ifcCurveDim`, using `typeOf(...).has(...)` for the
// `'x' in typeof(...)` membership check, matching this file's own already-
// established idiom for exactly this pattern (see `ifcNormalise`/`ifcCrossProduct`/
// `ifcScalarTimesVector`/`ifcVectorDifference` above, all of which already use
// `typeOf(...).has("ifc2x3.ifcvector")` the same way).
//
// **No new real Python bugs found in this chunk's own 15 assigned functions or
// their one helper.** Every one of them is a one- or two-line direct attribute
// delegation (`return N` for a bare dimensionality constant, or
// `express_getattr(express_getattr(self, 'X', INDETERMINATE), 'Dim', INDETERMINATE)`
// for a delegation to another entity's own `Dim`) -- re-read each of the 15 real
// function bodies plus `IfcCurveDim` directly against `IFC2X3.py` before porting
// (line numbers in this chunk's own task brief, re-verified rather than trusted:
// all matched exactly), and none of them touch the tuple/list-comparison or
// tuple-mutation patterns chunk 1's own disclosed bugs #1/#2 hinge on, nor
// `IfcListToArray`'s 0-based-lower-bound rotation bug #3. This chunk introduces no
// new disclosed divergences beyond the pre-existing, already-flagged
// `INDETERMINATE`-poisoning-through-plain-JS-operators gap this file's own header
// comment already covers once (not repeated here) -- none of these 15 functions'
// bodies perform arithmetic/comparison on a possibly-indeterminate value anyway
// (they're pure attribute reads and dispatch, no `*`/`+`/`<` anywhere), so that
// gap is not even reachable from this chunk's own code.
//
// This chunk's own test file (`test/express/rules/ifc2x3.test.ts`) also updates
// one PRE-EXISTING test from chunk 1 -- "an unported DERIVE-shaped attribute still
// throws" previously used `IfcCsgPrimitive3D.Dim` as its example of a real,
// not-yet-ported DERIVE attribute; this chunk now ports exactly that function, so
// the old example would silently start asserting the wrong thing (that dispatch
// still fails) instead of failing loudly. Swapped for `IfcCompositeCurve.NSegments`
// (`IFC2X3.py` line 4501, `calc_IfcCompositeCurve_NSegments` -- a real DERIVE
// attribute genuinely untouched by either chunk 1 or this chunk), confirmed via the
// same `grep -n "^def calc_"` sweep of `IFC2X3.py` this chunk used to verify its own
// 15 assigned functions' line numbers.
// =============================================================================

/**
 * Python: `IfcCurveDim` (`IFC2X3.py` line 7684) -- the shared dispatch helper
 * `calc_IfcCurve_Dim` (below) delegates to; not itself a `calc_*` function (see
 * this section's own header comment). Recurses once for `IfcTrimmedCurve`
 * (`IfcCurveDim(BasisCurve)`), matching the real Python's own direct recursive
 * call exactly.
 *
 * **Disclosed fix, found by an adversarial review pass on this chunk's own PR**:
 * an explicit `!exists(curve)` guard is added here, ABSENT from the real Python
 * source's own `IfcCurveDim` -- real Python needs no such guard because
 * `indeterminate_type` overrides `__bool__` to return `False` (confirmed by
 * reading `IFC2X3.py` directly: `class indeterminate_type: def __bool__(self):
 * return False`), so its own `typeof(inst)` (`if not inst: return
 * express_set([])`) already safely short-circuits for an indeterminate/`None`
 * `curve` before ever touching `inst.is_a(...)`. This port's `INDETERMINATE`
 * sentinel is a plain JS `Symbol` (always truthy), and `typeOf()`
 * (`runtimeShim.ts`, not touched by this chunk) only special-cases `null`/
 * `undefined` -- so, unlike real Python, `typeOf(INDETERMINATE as
 * EntityInstance)` here would fall through to `instance.declaration()` on a
 * `Symbol` and throw, rather than returning an empty set. Reachable via this
 * function's own `IfcTrimmedCurve` recursion (`ifcCurveDim(expressGetAttr(curve,
 * "BasisCurve", INDETERMINATE))`) whenever a real `IfcTrimmedCurve.BasisCurve`
 * is unset (`$`) -- schema-mandatory, but not something this port's own
 * attribute-write path enforces today, so a malformed/incomplete real file can
 * still reach it. Every other `typeOf(...)` call site already ported in this
 * file (chunk 1's `ifcNormalise`/`ifcCrossProduct`/`ifcDotProduct`/
 * `ifcScalarTimesVector`/`ifcVectorDifference`) already guards with its own
 * `exists(...)` check before ever calling `typeOf` -- this function is brought
 * in line with that same, already-established pattern, not a new one. Matches
 * real Python's own actual net behavior (`IfcCurveDim(INDETERMINATE)` falls
 * through every branch and returns `None`) exactly -- not a silent behavior
 * change, a bug fix restoring parity.
 */
function ifcCurveDim(curve: unknown): unknown {
	if (!exists(curve)) return null;
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifcline")) {
		return expressGetAttr(expressGetAttr(curve, "Pnt", INDETERMINATE), "Dim", INDETERMINATE);
	}
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifcconic")) {
		return expressGetAttr(expressGetAttr(curve, "Position", INDETERMINATE), "Dim", INDETERMINATE);
	}
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifcpolyline")) {
		return expressGetAttr(
			expressGetItem(expressGetAttr(curve, "Points", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"Dim",
			INDETERMINATE,
		);
	}
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifctrimmedcurve")) {
		return ifcCurveDim(expressGetAttr(curve, "BasisCurve", INDETERMINATE));
	}
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifccompositecurve")) {
		return expressGetAttr(
			expressGetItem(expressGetAttr(curve, "Segments", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"Dim",
			INDETERMINATE,
		);
	}
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifcbsplinecurve")) {
		return expressGetAttr(
			expressGetItem(
				expressGetAttr(curve, "ControlPointsList", INDETERMINATE),
				1 - EXPRESS_ONE_BASED_INDEXING,
				INDETERMINATE,
			),
			"Dim",
			INDETERMINATE,
		);
	}
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifcoffsetcurve2d")) return 2;
	if (typeOf(curve as EntityInstance).has("ifc2x3.ifcoffsetcurve3d")) return 3;
	return null;
}

// --- the 15 assigned `calc_*` functions (exact real-Python names, file order) ---

export function calc_IfcCompositeCurveSegment_Dim(self: EntityInstance): unknown {
	const parentcurve = expressGetAttr(self, "ParentCurve", INDETERMINATE);
	return expressGetAttr(parentcurve, "Dim", INDETERMINATE);
}

export function calc_IfcCsgPrimitive3D_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcCurve_Dim(self: EntityInstance): unknown {
	return ifcCurveDim(self);
}

export function calc_IfcCurveBoundedPlane_Dim(self: EntityInstance): unknown {
	const basissurface = expressGetAttr(self, "BasisSurface", INDETERMINATE);
	return expressGetAttr(basissurface, "Dim", INDETERMINATE);
}

export function calc_IfcElementarySurface_Dim(self: EntityInstance): unknown {
	const position = expressGetAttr(self, "Position", INDETERMINATE);
	return expressGetAttr(position, "Dim", INDETERMINATE);
}

export function calc_IfcFaceBasedSurfaceModel_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcGeometricSet_Dim(self: EntityInstance): unknown {
	const elements = expressGetAttr(self, "Elements", INDETERMINATE);
	return expressGetAttr(expressGetItem(elements, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), "Dim", INDETERMINATE);
}

export function calc_IfcHalfSpaceSolid_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcPlacement_Dim(self: EntityInstance): unknown {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	return expressGetAttr(location, "Dim", INDETERMINATE);
}

export function calc_IfcPointOnCurve_Dim(self: EntityInstance): unknown {
	const basiscurve = expressGetAttr(self, "BasisCurve", INDETERMINATE);
	return expressGetAttr(basiscurve, "Dim", INDETERMINATE);
}

export function calc_IfcPointOnSurface_Dim(self: EntityInstance): unknown {
	const basissurface = expressGetAttr(self, "BasisSurface", INDETERMINATE);
	return expressGetAttr(basissurface, "Dim", INDETERMINATE);
}

export function calc_IfcRectangularTrimmedSurface_Dim(self: EntityInstance): unknown {
	const basissurface = expressGetAttr(self, "BasisSurface", INDETERMINATE);
	return expressGetAttr(basissurface, "Dim", INDETERMINATE);
}

export function calc_IfcSectionedSpine_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcShellBasedSurfaceModel_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcSweptSurface_Dim(self: EntityInstance): unknown {
	const position = expressGetAttr(self, "Position", INDETERMINATE);
	return expressGetAttr(position, "Dim", INDETERMINATE);
}

registerSchemaCalcFunctions("IFC2X3", {
	"IfcCompositeCurveSegment.Dim": calc_IfcCompositeCurveSegment_Dim,
	"IfcCsgPrimitive3D.Dim": calc_IfcCsgPrimitive3D_Dim,
	"IfcCurve.Dim": calc_IfcCurve_Dim,
	"IfcCurveBoundedPlane.Dim": calc_IfcCurveBoundedPlane_Dim,
	"IfcElementarySurface.Dim": calc_IfcElementarySurface_Dim,
	"IfcFaceBasedSurfaceModel.Dim": calc_IfcFaceBasedSurfaceModel_Dim,
	"IfcGeometricSet.Dim": calc_IfcGeometricSet_Dim,
	"IfcHalfSpaceSolid.Dim": calc_IfcHalfSpaceSolid_Dim,
	"IfcPlacement.Dim": calc_IfcPlacement_Dim,
	"IfcPointOnCurve.Dim": calc_IfcPointOnCurve_Dim,
	"IfcPointOnSurface.Dim": calc_IfcPointOnSurface_Dim,
	"IfcRectangularTrimmedSurface.Dim": calc_IfcRectangularTrimmedSurface_Dim,
	"IfcSectionedSpine.Dim": calc_IfcSectionedSpine_Dim,
	"IfcShellBasedSurfaceModel.Dim": calc_IfcShellBasedSurfaceModel_Dim,
	"IfcSweptSurface.Dim": calc_IfcSweptSurface_Dim,
});
