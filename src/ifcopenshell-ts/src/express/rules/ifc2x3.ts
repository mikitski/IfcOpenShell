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
	isIndeterminate,
	loIndex,
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

/**
 * Exported (Phase EX-4 chunk 2, `planning/ifcopenshell-ts/70-express-rules-plan.md`):
 * `express/whereRules/ifc2x3.ts`'s own `IfcExtrudedAreaSolid_WR31` needs this exact
 * function (its own real-source body constructs a scratch `IfcDirection(DirectionRatios=
 * [0.0, 0.0, 1.0])` to dot-product against `ExtrudedDirection`) -- reused as-is rather
 * than re-derived, matching this file's own `ifcCrossProduct` precedent immediately
 * below (same rationale: "export narrowly once a second real consumer exists").
 */
export function ifcDirection(directionRatios: readonly number[]): EntityInstance {
	return getScratchFile().createEntity("IfcDirection", [...directionRatios]);
}

function ifcVector(orientation: EntityInstance, magnitude: number): EntityInstance {
	return getScratchFile().createEntity("IfcVector", orientation, magnitude);
}

/**
 * Python: bare `IfcLine(*args, **kwargs)` convenience constructor (`IFC2X3.py` line
 * 2523, `return ifcopenshell.create_entity('IfcLine', 'IFC2X3', *args, **kwargs)`) --
 * called with `Pnt=`/`Dir=` kwargs by `calc_IfcRevolvedAreaSolid_AxisLine`/`calc_
 * IfcSurfaceOfRevolution_AxisLine` below (Phase EX-2, fourth chunk). Attribute order
 * confirmed against `generated/ifc2x3.d.ts`'s own `IfcLine` interface (`Pnt:
 * IfcCartesianPoint; Dir: IfcVector;`) -- same "bare, bindingless scratch entity via
 * `getScratchFile().createEntity(...)`" pattern as `ifcDirection`/`ifcVector` above,
 * not a new mechanism.
 */
function ifcLine(pnt: unknown, dir: unknown): EntityInstance {
	return getScratchFile().createEntity("IfcLine", pnt, dir);
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

/**
 * Python: `IfcCrossProduct` (`IFC2X3.py`).
 *
 * Exported (Phase EX-4 chunk 1, `planning/ifcopenshell-ts/70-express-rules-plan.md`):
 * `express/whereRules/ifc2x3.ts`'s own `IfcAxis2Placement3D_WR4` needs this exact
 * function (its own real-source body calls `IfcCrossProduct(axis, refdirection)`
 * directly) -- reused as-is rather than re-derived, matching this project's
 * established "export narrowly once a second real consumer exists" precedent
 * (`util/schema.ts`'s own `entityName`/`getSchemaDefinition` header comments).
 */
export function ifcCrossProduct(arg1: unknown, arg2: unknown): EntityInstance | null {
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

/**
 * Python: `IfcDotProduct` (`IFC2X3.py`).
 *
 * Exported (Phase EX-4 chunk 2): `express/whereRules/ifc2x3.ts`'s own
 * `IfcExtrudedAreaSolid_WR31` needs this exact function, same "export narrowly once a
 * second real consumer exists" precedent as `ifcCrossProduct`/`ifcDirection` above.
 */
export function ifcDotProduct(arg1: unknown, arg2: unknown): number | null {
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

// =============================================================================
// Phase EX-2, third chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the
// NEXT 10 of IFC2X3's 55 `calc_*` functions, in real file order (verified directly
// against `IFC2X3.py` before porting -- line numbers re-checked against the dispatched
// task brief's own citations, not just trusted from it):
//
//   calc_IfcCompositeCurve_ClosedCurve (line 4505), calc_IfcEdgeLoop_Ne (line 5020),
//   calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem (line 5259),
//   calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension (line 5263),
//   calc_IfcGeometricRepresentationSubContext_TrueNorth (line 5267),
//   calc_IfcGeometricRepresentationSubContext_Precision (line 5271),
//   calc_IfcMaterialLayerSet_TotalThickness (line 5451),
//   calc_IfcTable_NumberOfCellsInRow (line 7004), calc_IfcTable_NumberOfHeadings
//   (line 7008), calc_IfcTable_NumberOfDataRows (line 7012)
//
// Exported under their exact real-Python names, matching this file's own established
// convention (see the chunk-1 header comment above for the full rationale).
//
// **One necessary, minimal, disclosed extension, NOT one of the assigned 10**:
// `calc_IfcCompositeCurve_ClosedCurve` itself reads `express_getattr(self, 'NSegments',
// INDETERMINATE)` -- `NSegments` is `IfcCompositeCurve`'s own sibling DERIVE attribute
// (`calc_IfcCompositeCurve_NSegments`, real source line 4501, immediately above
// `ClosedCurve` in the real file and NOT itself one of this chunk's assigned 10).
// Without it, `NSegments` would resolve via this port's own dispatch-miss path (a
// thrown "has no attribute" error), which `expressGetAttr`'s own `try/catch` (see
// `runtimeShim.ts`) silently swallows into `INDETERMINATE` -- and the very next line
// then does `nsegments - EXPRESS_ONE_BASED_INDEXING` as a bare arithmetic expression
// (this file's own established "direct structural port, plain JS operators" idiom, see
// this file's own header comment on the pre-existing INDETERMINATE-poisoning gap),
// which throws a native `TypeError` on a JS `Symbol` operand. Net effect: without
// porting `NSegments` too, `ClosedCurve` would be completely non-functional for every
// real `IfcCompositeCurve`, not merely degraded -- the exact same "necessary, minimal,
// disclosed extension" shape chunk 1's own header comment already established for
// `calc_IfcDirection_Dim`/`calc_IfcVector_Dim`. Ported here as `calc_
// IfcCompositeCurve_NSegments` (trivial one-liner: `sizeof(Segments)`), registered
// alongside the assigned 10 below. This means the "an unported DERIVE-shaped attribute
// still throws" test in this file's own test suite (previously using
// `IfcCompositeCurve.NSegments` as its example, per chunk 2's own header comment) is
// updated again in this chunk -- swapped for `IfcOrientedEdge.EdgeStart` (real source
// line 5611, `calc_IfcOrientedEdge_EdgeStart`), confirmed still genuinely unported by
// the same `grep -n "^def calc_"` sweep of `IFC2X3.py` this chunk used to verify its
// own 10 assigned functions' line numbers.
//
// **`calc_IfcMaterialLayerSet_TotalThickness` delegates to a helper, `IfcMlsTotalThickness`
// (real source line 7848, re-verified directly)** -- same "shared EXPRESS library
// function" bucket as chunk 1's `IfcNormalise`/etc. (not itself a `calc_*` function).
// Ported below as `ifcMlsTotalThickness`, a plain running-sum loop over
// `MaterialLayers[].LayerThickness` -- real Python's own local variable is confusingly
// named `max` (it shadows the Python builtin, and does NOT compute a maximum -- it is a
// running total, matching this chunk's own task brief's own advance note), renamed
// here to the descriptive `total`; purely a local-variable-naming choice, not a
// behavioral divergence.
//
// **`calc_IfcCompositeCurve_ClosedCurve`'s enum comparison**: real Python compares
// against the module-level constant `discontinuous = IfcTransitionCode.DISCONTINUOUS`
// (an `enum_namespace` proxy value, real source line 1473). This port's generated
// types declare `IfcTransitionCode` as a plain `string` (`generated/ifc2x3.d.ts`:
// `export type IfcTransitionCode = string`) -- confirmed no runtime `IfcTransitionCode`
// enum object exists anywhere in this port's `src/` (`enum_namespace` itself is one of
// the deliberately-not-ported boilerplate pieces `70-express-rules-plan.md` §3
// already flags) -- so `discontinuous` is ported as the plain string literal
// `"DISCONTINUOUS"`, exactly the wire-format value this port's own attribute-read path
// already produces for an `IfcTransitionCode`-typed attribute.
//
// **No new real Python bugs found in this chunk's own 10 assigned functions, their one
// necessary extra dependency (`NSegments`), or their one helper
// (`IfcMlsTotalThickness`).** Every one of the 10 assigned functions is a one- or
// two-line direct attribute delegation or a bare `sizeof`/array-filter -- re-read each
// body directly against `IFC2X3.py` before porting (line numbers re-verified, all
// matched exactly, per this project's absolute rule). `IfcMlsTotalThickness` is a plain
// running-sum loop with no defined-type construction or tuple-mutation involved (the
// two patterns chunk 1's own three disclosed bugs hinge on) -- confirmed by direct
// reading, not merely by the task brief's own risk assessment. This chunk introduces
// no new disclosed divergences beyond the pre-existing, already-flagged
// `INDETERMINATE`-poisoning-through-plain-JS-operators gap this file's own header
// comment already covers once (reachable here only via the `NSegments`-not-yet-set
// path already discussed above, not via any of the 10 assigned functions' own bodies,
// none of which perform arithmetic/comparison on a possibly-indeterminate value except
// `ClosedCurve`'s own `!==` against the `discontinuous` string, which -- like this
// file's own chunk-1-disclosed `IfcFirstProjAxis` tuple/list bug -- is a reference/
// type comparison, not arithmetic, so it does not hit the poisoning gap at all: an
// `INDETERMINATE` `Transition` would compare not-equal to `"DISCONTINUOUS"` and
// silently read as "closed", a real, disclosed divergence from Python's own dunder-
// based poisoning there too, but reachable only if a real file leaves the schema-
// mandatory `Transition` attribute unset, which this port's own attribute-write path
// does not enforce today -- same disclosed class of gap as `ifcCurveDim`'s own
// `!exists(curve)` guard rationale above, not a new one).
//
// **On `IfcDimensionalExponents`/defined-type construction (disclosed per this
// chunk's own task brief, not attempted here)**: `calc_IfcDerivedUnit_Dimensions`/
// `calc_IfcSIUnit_Dimensions` remain deliberately out of scope for this chunk. A
// search of this port's own `src/` for any existing support for constructing/
// mutating a defined-type value (e.g. `IfcDimensionalExponents`, a `SELECT`-free
// plain aggregate-of-INTEGER defined type) analogous to the already-known
// `IfcLineIndex`/`IfcArcIndex` gap found nothing resembling a working primitive for
// it -- this chunk did not need one for any of its own 10 assigned functions (none of
// them construct or mutate a defined-type value), so this is a secondhand
// observation from working in this area, not a verified finding backed by an actual
// attempted construction; left for whoever scopes the dedicated future chunk that
// picks up `calc_IfcDerivedUnit_Dimensions`/`calc_IfcSIUnit_Dimensions` to verify
// directly.
// =============================================================================

/** Python: `IfcMlsTotalThickness` (`IFC2X3.py` line 7848) -- not itself a `calc_*`
 * function (see this section's own header comment); real Python's own local variable
 * is named `max` but computes a running SUM, not a maximum (renamed here to `total`,
 * a naming choice only, not a behavioral change -- see header comment). */
function ifcMlsTotalThickness(layerset: unknown): unknown {
	const materialLayers = expressGetAttr(layerset, "MaterialLayers", INDETERMINATE);
	let total = expressGetAttr(
		expressGetItem(materialLayers, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
		"LayerThickness",
		INDETERMINATE,
	);
	if ((sizeof(materialLayers) as number) > 1) {
		for (const i of expressRange(2, (hiIndex(materialLayers) as number) + 1)) {
			total =
				(total as number) +
				(expressGetAttr(
					expressGetItem(materialLayers, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
					"LayerThickness",
					INDETERMINATE,
				) as number);
		}
	}
	return total;
}

// --- the 10 assigned `calc_*` functions (exact real-Python names, file order) ---

export function calc_IfcCompositeCurve_ClosedCurve(self: EntityInstance): unknown {
	const segments = expressGetAttr(self, "Segments", INDETERMINATE);
	const nsegments = expressGetAttr(self, "NSegments", INDETERMINATE) as number;
	return (
		expressGetAttr(
			expressGetItem(segments, nsegments - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"Transition",
			INDETERMINATE,
		) !== "DISCONTINUOUS"
	);
}

export function calc_IfcEdgeLoop_Ne(self: EntityInstance): unknown {
	const edgelist = expressGetAttr(self, "EdgeList", INDETERMINATE);
	return sizeof(edgelist);
}

export function calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem(self: EntityInstance): unknown {
	const parentcontext = expressGetAttr(self, "ParentContext", INDETERMINATE);
	return expressGetAttr(parentcontext, "WorldCoordinateSystem", INDETERMINATE);
}

export function calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension(self: EntityInstance): unknown {
	const parentcontext = expressGetAttr(self, "ParentContext", INDETERMINATE);
	return expressGetAttr(parentcontext, "CoordinateSpaceDimension", INDETERMINATE);
}

export function calc_IfcGeometricRepresentationSubContext_TrueNorth(self: EntityInstance): unknown {
	const parentcontext = expressGetAttr(self, "ParentContext", INDETERMINATE);
	return nvl(
		expressGetAttr(parentcontext, "TrueNorth", INDETERMINATE),
		expressGetItem(
			expressGetAttr(expressGetAttr(self, "WorldCoordinateSystem", INDETERMINATE), "P", INDETERMINATE),
			2 - EXPRESS_ONE_BASED_INDEXING,
			INDETERMINATE,
		),
	);
}

export function calc_IfcGeometricRepresentationSubContext_Precision(self: EntityInstance): unknown {
	const parentcontext = expressGetAttr(self, "ParentContext", INDETERMINATE);
	return nvl(expressGetAttr(parentcontext, "Precision", INDETERMINATE), 1);
}

export function calc_IfcMaterialLayerSet_TotalThickness(self: EntityInstance): unknown {
	return ifcMlsTotalThickness(self);
}

export function calc_IfcTable_NumberOfCellsInRow(self: EntityInstance): unknown {
	const rows = expressGetAttr(self, "Rows", INDETERMINATE);
	const firstRow = expressGetItem(rows, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	return hiIndex(expressGetAttr(firstRow, "RowCells", INDETERMINATE));
}

export function calc_IfcTable_NumberOfHeadings(self: EntityInstance): unknown {
	const rows = expressGetAttr(self, "Rows", INDETERMINATE) as unknown[];
	return sizeof(rows.filter((temp) => expressGetAttr(temp, "IsHeading", INDETERMINATE)));
}

export function calc_IfcTable_NumberOfDataRows(self: EntityInstance): unknown {
	const rows = expressGetAttr(self, "Rows", INDETERMINATE) as unknown[];
	return sizeof(rows.filter((temp) => !expressGetAttr(temp, "IsHeading", INDETERMINATE)));
}

// --- the 1 minimal, necessary, disclosed extra function (see header comment) ---

export function calc_IfcCompositeCurve_NSegments(self: EntityInstance): unknown {
	const segments = expressGetAttr(self, "Segments", INDETERMINATE);
	return sizeof(segments);
}

registerSchemaCalcFunctions("IFC2X3", {
	"IfcCompositeCurve.ClosedCurve": calc_IfcCompositeCurve_ClosedCurve,
	"IfcEdgeLoop.Ne": calc_IfcEdgeLoop_Ne,
	"IfcGeometricRepresentationSubContext.WorldCoordinateSystem":
		calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem,
	"IfcGeometricRepresentationSubContext.CoordinateSpaceDimension":
		calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension,
	"IfcGeometricRepresentationSubContext.TrueNorth": calc_IfcGeometricRepresentationSubContext_TrueNorth,
	"IfcGeometricRepresentationSubContext.Precision": calc_IfcGeometricRepresentationSubContext_Precision,
	"IfcMaterialLayerSet.TotalThickness": calc_IfcMaterialLayerSet_TotalThickness,
	"IfcTable.NumberOfCellsInRow": calc_IfcTable_NumberOfCellsInRow,
	"IfcTable.NumberOfHeadings": calc_IfcTable_NumberOfHeadings,
	"IfcTable.NumberOfDataRows": calc_IfcTable_NumberOfDataRows,
	"IfcCompositeCurve.NSegments": calc_IfcCompositeCurve_NSegments,
});

// =============================================================================
// Phase EX-2, fourth chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the
// LAST 9 of the 55 real `calc_*` functions this chunk's own dispatch identified as
// still unregistered after chunks 1-3's own 44 (line numbers re-verified directly
// against `IFC2X3.py` before porting, not just trusted from the task brief that
// dispatched this chunk -- all matched exactly):
//
//   calc_IfcOrientedEdge_EdgeStart (line 5611), calc_IfcOrientedEdge_EdgeEnd (line
//   5616), calc_IfcRationalBezierCurve_Weights (line 6176), calc_
//   IfcRevolvedAreaSolid_AxisLine (line 6518), calc_IfcSurfaceOfLinearExtrusion_
//   ExtrusionAxis (line 6843), calc_IfcSurfaceOfRevolution_AxisLine (line 6848),
//   calc_IfcStructuralLinearActionVarying_VaryingAppliedLoads (line 6688), calc_
//   IfcStructuralPlanarActionVarying_VaryingAppliedLoads (line 6701), calc_
//   IfcStructuralSurfaceMemberVarying_VaryingThickness (line 6790)
//
// Exported under their exact real-Python names, matching this file's own established
// convention (see the chunk-1 header comment above for the full rationale).
//
// **This chunk does NOT close out all 55 -- disclosed correction to this chunk's own
// dispatching task brief, which asserted it would.** `grep -n "^def calc_"
// IFC2X3.py | wc -l` is 55; chunks 1-3 registered 44 (verified directly by counting
// this file's own three prior `registerSchemaCalcFunctions` calls' keys, not merely
// trusted from their own header comments); this chunk's own 9 assigned functions
// bring the running total to 53. The remaining 2 -- `calc_IfcDerivedUnit_Dimensions`
// (line 4741, `return IfcDeriveDimensionalExponents(elements)`) and `calc_
// IfcSIUnit_Dimensions` (line 6541, `return
// IfcDimensionsForSiUnit(express_getattr(self, 'Name', INDETERMINATE))`) -- are NOT
// among this chunk's own assigned 9, and this chunk does not port them either: both
// require constructing/mutating an `IfcDimensionalExponents` DEFINED TYPE value (a
// SELECT-free plain aggregate-of-INTEGER), and chunk 3's own header comment already
// disclosed, after a direct search of this port's own `src/`, that no working
// primitive for constructing/mutating a defined-type value exists anywhere in this
// port yet (the same gap as the already-known `IfcLineIndex`/`IfcArcIndex` limitation)
// -- re-confirmed here, not just carried over uncritically: still no such primitive
// found. Porting either function properly would mean building that primitive first,
// which is out of this chunk's own assigned scope (9 named functions, not "whatever
// closes out the schema"). **So after this chunk, IFC2X3 has 53/55 `calc_*` functions
// ported, not 55/55** -- this chunk's own dispatching task brief's framing ("this is
// the LAST chunk needed to close out ALL of IFC2X3's 55 calc_* functions") is
// therefore not accurate as written, and this report says so plainly rather than
// silently completing the other 44 header comments' own implied "100% done" narrative.
// The 2 remaining functions are left for whoever scopes the dedicated future chunk
// that builds the defined-type-construction primitive first (as chunk 3's own header
// comment already anticipated).
//
// **3 new shared dependencies, all disclosed per this chunk's own task brief:**
//
// 1. `IfcBooleanChoose(b, choice1, choice2)` (real source line 7424, re-verified
//    directly: `if b: return choice1` / `else: return choice2`) -- delegated to by
//    `calc_IfcOrientedEdge_EdgeStart`/`_EdgeEnd`. Real Python's own `if b:` truthiness
//    check relies on `indeterminate_type.__bool__` returning `False` (confirmed
//    directly against `IFC2X3.py`'s own class definition, and empirically: a live
//    `IfcOrientedEdge` built with `Orientation` left unset resolves `.EdgeStart` to
//    `EdgeElement.EdgeEnd` -- the `else` branch -- against a real installed
//    `ifcopenshell` 0.8.4 interpreter, not just read from source) whenever `Orientation`
//    is unset/`$` -- schema-mandatory, but not enforced by this port's own
//    attribute-write path today, so a malformed/incomplete real file can still reach
//    it. This port's `INDETERMINATE` sentinel is a plain JS `Symbol`, always truthy
//    under JS's own rules -- ported below (`ifcBooleanChoose`) with an explicit
//    `isIndeterminate(b)` guard so an indeterminate `Orientation` is treated as falsy,
//    matching real Python's actual behavior exactly, not a naive `if (b)`.
//
// 2. `IfcAddToBeginOfList(ascalar, alist)` (real source line 7389, re-verified
//    directly) -- delegated to by all 3 `*Varying_Varying*` functions below.
//    **A genuine, real, verbatim Python bug, confirmed both by direct source reading
//    AND by live execution against a real installed `ifcopenshell` 0.8.4
//    interpreter (not merely inferred from the paraphrase)**: `result = result +
//    ascalar` (`result` starts as `[]`) only type-checks in Python when `ascalar`
//    is itself list-like. Tracing the real call sites' own schema attribute types
//    (`generated/ifc2x3.d.ts`, cross-checked against the real `.exp`-derived
//    declarations): `IfcStructuralLinearActionVarying.AppliedLoad`/
//    `IfcStructuralPlanarActionVarying.AppliedLoad` are single-valued
//    (`AppliedLoad: IfcStructuralLoad`, not an aggregate), and
//    `IfcStructuralSurfaceMemberVarying.Thickness` is a single optional `number`
//    (`Thickness: number | null`) -- so `ascalar` at every real call site is a bare
//    scalar (an `entity_instance` or a `float`), never a list/tuple. `express_getattr`
//    (this same file's real Python source, line 87: `return getattr(aggr, name,
//    default)`) does no wrapping -- confirmed by reading it directly. A bare
//    `[] + <scalar>` in Python raises `TypeError: can only concatenate list (not
//    "<type>") to list` unconditionally (list's own `__add__`/`__radd__` machinery
//    requires a list on both sides; neither `ifcopenshell.entity_instance` nor `float`
//    defines a `__radd__` that would rescue this). **Reproduced live**: constructing a
//    real `IfcStructuralLinearActionVarying` with a set `AppliedLoad` and reading
//    `.VaryingAppliedLoads` raises exactly `TypeError: can only concatenate list (not
//    "entity_instance") to list`; a real `IfcStructuralSurfaceMemberVarying` with a
//    set `Thickness` raises the analogous `TypeError: can only concatenate list (not
//    "float") to list` reading `.VaryingThickness` -- both against a real installed
//    `ifcopenshell` 0.8.4 interpreter. So `IfcAddToBeginOfList` -- and therefore all 3
//    of this chunk's own `*Varying_Varying*` DERIVE functions -- can NEVER
//    successfully compute a "real" prepended value in real Python: it only ever
//    returns a value (`alist`, unchanged) in the "`ascalar` doesn't exist" branch
//    (also reproduced live: an unset `AppliedLoad`/`Thickness` returns
//    `SubsequentAppliedLoads`/`SubsequentThickness` back unchanged, no crash). Ported
//    below (`ifcAddToBeginOfList`) as: return `alist` unchanged when `!exists(ascalar)`
//    (real Python's own working branch, faithfully reproduced); throw an equivalent
//    `Error` when `ascalar` exists (matching `ifcBaseAxis`'s own already-established
//    "equivalent thrown error at an unconditional real-Python crash point" precedent
//    from chunk 1, not silently "fixing" the prepend into something real Python can
//    never actually produce).
//
// 3. `IfcLine(*args, **kwargs)` (real source line 2523, a bare per-schema convenience
//    constructor, same "not itself a `calc_*` function" bucket as `IfcDirection`/
//    `IfcVector`) -- ported as `ifcLine(pnt, dir)` above (next to `ifcDirection`/
//    `ifcVector`), attribute order (`Pnt`, `Dir`) confirmed against `generated/
//    ifc2x3.d.ts`'s own `IfcLine` interface, exactly the same pattern already
//    established for `ifcDirection`/`ifcVector`.
//
// **No other new real Python bugs found in this chunk's own 9 assigned functions.**
// `calc_IfcOrientedEdge_EdgeStart`/`_EdgeEnd`, `calc_IfcSurfaceOfLinearExtrusion_
// ExtrusionAxis`, `calc_IfcRevolvedAreaSolid_AxisLine`, and `calc_
// IfcSurfaceOfRevolution_AxisLine` are direct, one-line structural translations with
// no tuple-mutation or defined-type construction involved -- re-read each body
// directly against `IFC2X3.py` before porting, all matched the task brief's own
// citations exactly. `calc_IfcRationalBezierCurve_Weights` reuses this file's own
// chunk-1 `ifcListToArray` helper UNCHANGED (not re-ported) -- it therefore also
// reproduces chunk 1's own already-disclosed bug #3 (the `low === 0` left-rotation)
// for this new call site too; this is not a NEW bug, just a new place the existing,
// already-pinned one is now reachable from (confirmed empirically: a live 4-control-
// point `IfcRationalBezierCurve` with `WeightsData=[1,2,3,4]` resolves `.Weights` to
// `[2,3,4,1]`, the same rotated shape, against a real installed `ifcopenshell` 0.8.4
// interpreter).
//
// This chunk's own test file (`test/express/rules/ifc2x3.test.ts`) also updates the
// same PRE-EXISTING "an unported DERIVE-shaped attribute still throws" test, again --
// chunk 3 swapped it to `IfcOrientedEdge.EdgeStart`, which this chunk now ports, so
// (per this chunk's own task brief's explicit instruction) it is swapped once more.
// Given this chunk's own finding above (2 real `calc_*` functions remain genuinely
// unported even after this chunk, not the 0 the task brief's framing assumed), the
// replacement is simply one of those 2: `IfcDerivedUnit.Dimensions` (confirmed
// genuinely unported, both before and after this chunk, by the same `grep -n
// "^def calc_"` sweep of `IFC2X3.py` used throughout this file, and by this chunk's
// own defined-type-construction-primitive-gap finding above).
// =============================================================================

/**
 * Python: `IfcBooleanChoose` (`IFC2X3.py` line 7424) -- not itself a `calc_*`
 * function (see this section's own header comment). Ported with an explicit
 * `isIndeterminate` guard (see header comment) so an indeterminate `b` is treated as
 * falsy, matching real Python's own `indeterminate_type.__bool__` behavior instead of
 * JS's default (a `Symbol` is always truthy).
 */
function ifcBooleanChoose(b: unknown, choice1: unknown, choice2: unknown): unknown {
	if (!isIndeterminate(b) && b) return choice1;
	return choice2;
}

/**
 * Python: `IfcAddToBeginOfList` (`IFC2X3.py` line 7389) -- see this section's own
 * header comment, disclosed bug #4 (confirmed both by direct source reading and by
 * live execution against a real installed `ifcopenshell` interpreter): real Python's
 * own `result = result + ascalar` unconditionally raises `TypeError` whenever
 * `ascalar` exists, at every one of this chunk's own real call sites (`ascalar` is
 * always a bare scalar there, never a list) -- ported as an equivalent thrown `Error`
 * at the same point, matching `ifcBaseAxis`'s own already-established "equivalent
 * thrown error at an unconditional real-Python crash point" precedent (chunk 1), not
 * silently "fixed" into a working prepend real Python itself can never actually
 * produce. The `!exists(ascalar)` branch (`result = alist`) is real Python's own only
 * actually-reachable code path, and is ported faithfully (a plain pass-through).
 */
function ifcAddToBeginOfList(ascalar: unknown, alist: unknown): unknown {
	if (!exists(ascalar)) return alist;
	// Real Python's own generated code here unconditionally raises `TypeError: can
	// only concatenate list (not "<type>") to list` on its very first statement in
	// this branch (`result = result + ascalar`, `result` a fresh `[]`) -- see this
	// file's own header comment, "Real, disclosed Python bugs", bug #4, for the full
	// citation (including a live repro against a real installed `ifcopenshell`
	// interpreter). Ported as an equivalent thrown error at the same point, rather
	// than silently prepending `ascalar` to `alist` (a numeric/list answer real
	// Python itself can never actually produce here).
	throw new Error(
		"IfcAddToBeginOfList: real Python's own generated formula raises " +
			"TypeError('can only concatenate list (not \"<type>\") to list') at this " +
			"exact point (a set scalar being prepended to a list, `result = result + " +
			"ascalar` on a fresh `[]`) -- see rules/ifc2x3.ts's own header comment, " +
			"disclosed bug #4, for the full citation (including a live repro against a " +
			"real installed ifcopenshell interpreter).",
	);
}

// --- the 9 assigned `calc_*` functions (exact real-Python names, file order) ---

export function calc_IfcOrientedEdge_EdgeStart(self: EntityInstance): unknown {
	const edgeelement = expressGetAttr(self, "EdgeElement", INDETERMINATE);
	const orientation = expressGetAttr(self, "Orientation", INDETERMINATE);
	return ifcBooleanChoose(
		orientation,
		expressGetAttr(edgeelement, "EdgeStart", INDETERMINATE),
		expressGetAttr(edgeelement, "EdgeEnd", INDETERMINATE),
	);
}

export function calc_IfcOrientedEdge_EdgeEnd(self: EntityInstance): unknown {
	const edgeelement = expressGetAttr(self, "EdgeElement", INDETERMINATE);
	const orientation = expressGetAttr(self, "Orientation", INDETERMINATE);
	return ifcBooleanChoose(
		orientation,
		expressGetAttr(edgeelement, "EdgeEnd", INDETERMINATE),
		expressGetAttr(edgeelement, "EdgeStart", INDETERMINATE),
	);
}

export function calc_IfcRationalBezierCurve_Weights(self: EntityInstance): unknown {
	const weightsdata = expressGetAttr(self, "WeightsData", INDETERMINATE);
	return ifcListToArray(weightsdata, 0, expressGetAttr(self, "UpperIndexOnControlPoints", INDETERMINATE) as number);
}

export function calc_IfcRevolvedAreaSolid_AxisLine(self: EntityInstance): unknown {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	return ifcLine(
		expressGetAttr(axis, "Location", INDETERMINATE),
		ifcVector(expressGetAttr(axis, "Z", INDETERMINATE) as EntityInstance, 1.0),
	);
}

export function calc_IfcSurfaceOfLinearExtrusion_ExtrusionAxis(self: EntityInstance): unknown {
	const extrudeddirection = expressGetAttr(self, "ExtrudedDirection", INDETERMINATE);
	const depth = expressGetAttr(self, "Depth", INDETERMINATE) as number;
	return ifcVector(extrudeddirection as EntityInstance, depth);
}

export function calc_IfcSurfaceOfRevolution_AxisLine(self: EntityInstance): unknown {
	const axisposition = expressGetAttr(self, "AxisPosition", INDETERMINATE);
	return ifcLine(
		expressGetAttr(axisposition, "Location", INDETERMINATE),
		ifcVector(expressGetAttr(axisposition, "Z", INDETERMINATE) as EntityInstance, 1.0),
	);
}

export function calc_IfcStructuralLinearActionVarying_VaryingAppliedLoads(self: EntityInstance): unknown {
	const subsequentappliedloads = expressGetAttr(self, "SubsequentAppliedLoads", INDETERMINATE);
	return ifcAddToBeginOfList(expressGetAttr(self, "AppliedLoad", INDETERMINATE), subsequentappliedloads);
}

export function calc_IfcStructuralPlanarActionVarying_VaryingAppliedLoads(self: EntityInstance): unknown {
	const subsequentappliedloads = expressGetAttr(self, "SubsequentAppliedLoads", INDETERMINATE);
	return ifcAddToBeginOfList(expressGetAttr(self, "AppliedLoad", INDETERMINATE), subsequentappliedloads);
}

export function calc_IfcStructuralSurfaceMemberVarying_VaryingThickness(self: EntityInstance): unknown {
	const subsequentthickness = expressGetAttr(self, "SubsequentThickness", INDETERMINATE);
	return ifcAddToBeginOfList(expressGetAttr(self, "Thickness", INDETERMINATE), subsequentthickness);
}

registerSchemaCalcFunctions("IFC2X3", {
	"IfcOrientedEdge.EdgeStart": calc_IfcOrientedEdge_EdgeStart,
	"IfcOrientedEdge.EdgeEnd": calc_IfcOrientedEdge_EdgeEnd,
	"IfcRationalBezierCurve.Weights": calc_IfcRationalBezierCurve_Weights,
	"IfcRevolvedAreaSolid.AxisLine": calc_IfcRevolvedAreaSolid_AxisLine,
	"IfcSurfaceOfLinearExtrusion.ExtrusionAxis": calc_IfcSurfaceOfLinearExtrusion_ExtrusionAxis,
	"IfcSurfaceOfRevolution.AxisLine": calc_IfcSurfaceOfRevolution_AxisLine,
	"IfcStructuralLinearActionVarying.VaryingAppliedLoads": calc_IfcStructuralLinearActionVarying_VaryingAppliedLoads,
	"IfcStructuralPlanarActionVarying.VaryingAppliedLoads": calc_IfcStructuralPlanarActionVarying_VaryingAppliedLoads,
	"IfcStructuralSurfaceMemberVarying.VaryingThickness": calc_IfcStructuralSurfaceMemberVarying_VaryingThickness,
});

// =============================================================================
// Phase EX-2, fifth chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the
// LAST 2 of IFC2X3's 55 `calc_*` functions -- `calc_IfcDerivedUnit_Dimensions`
// (`IFC2X3.py` line 4741) and `calc_IfcSIUnit_Dimensions` (line 6541), both
// re-verified directly against the real source before porting (exact line numbers
// confirmed, bodies match verbatim). **This chunk closes out IFC2X3: 55/55 `calc_*`
// functions now ported and registered** -- confirmed by summing this file's own 5
// `registerSchemaCalcFunctions` calls' key counts (18 + 15 + 11 + 9 + 2 = 55) and by
// the same `grep -n "^def calc_" IFC2X3.py | wc -l` sweep (55) every prior chunk in
// this file has used.
//
// **Chunk 4's own header comment claimed these 2 were blocked by a missing
// defined-type-construction primitive (the `EntityInstance.setByIndex`/
// `IfcFile.createEntity` "Attribute access is only supported on entity instances"
// gate, `TODOS.md`) -- that claim was WRONG, and this chunk re-confirms the
// correction empirically itself rather than trusting either chunk 4's own claim or
// the dispatching task brief's own correction of it.** `IfcDimensionalExponents` is
// NOT a defined type at all -- re-verified directly against `generated/ifc2x3.d.ts`
// (`export interface IfcDimensionalExponents { LengthExponent: number; ...}`, 7 plain
// `number` fields, no `SELECT`/union anywhere) and against the real IFC2X3 EXPRESS
// schema (`src/ifcparse/schemas/Ifc2x3-schema.cpp`) -- it is a genuine, ordinary
// ENTITY with 7 non-optional INTEGER attributes, exactly like `IfcCartesianPoint` or
// `IfcDirection` (both already constructed by this very file's own `ifcDirection`
// helper, chunk 1). Confirmed empirically against this chunk's own freshly-built
// native addon, not merely read from the `.d.ts`: `getScratchFile().createEntity(
// "IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 0)` succeeds and returns a real,
// addressable entity (non-zero `id()`), and mutating one of its attributes
// post-construction via the same Proxy-backed dot-assignment `ifcNormalise` above
// already uses for `IfcDirection`/`IfcVector` (`(result as unknown as
// Record<string, unknown>).LengthExponent = 5`) round-trips correctly through a
// subsequent `.get("LengthExponent")`/`.LengthExponent` read. Both are ordinary
// entity construction/mutation, already fully supported by this port's existing
// `IfcFile.createEntity`/`EntityInstance` Proxy `set` trap -- no different from the
// already-shipped `ifcDirection`/`ifcVector`/`ifcLine` helpers above, and completely
// unrelated to the real, still-open `IfcLineIndex`/`IfcArcIndex`-style
// defined-type-construction gap `TODOS.md` tracks (that gap is specific to
// constructing a standalone SIMPLE/DEFINED-TYPE value like a bare `IfcLabel`/
// `IfcLengthMeasure` by name, which routes through the native `attribute_kind_of`
// primitive's "Attribute access is only supported on entity instances" throw for a
// non-entity target -- `IfcDimensionalExponents` is a real entity, so it never
// reaches that gate at all). See `test/express/rules/ifc2x3.test.ts`'s own "chunk 5"
// `describe` block for the actual regression tests exercising this construction/
// mutation path end to end (not just this comment's own claim).
//
// **2 new shared dependencies, both disclosed per this chunk's own task brief:**
//
// 1. `IfcDeriveDimensionalExponents(unitelements)` (real source line 7711,
//    re-verified directly, byte-for-byte match) -- delegated to by
//    `calc_IfcDerivedUnit_Dimensions`. Constructs a fresh `IfcDimensionalExponents`
//    entity (all 7 exponents initialized to 0), then accumulates, for every element
//    of `unitelements` (an `IfcDerivedUnitElement[]`), `Exponent *
//    Unit.Dimensions.<X>Exponent` into the matching field of the result. `Unit` is
//    typed `IfcNamedUnit` on `IfcDerivedUnitElement` (confirmed against `generated/
//    ifc2x3.d.ts` -- a direct abstract-supertype reference, not a `SELECT`; the task
//    brief's own framing of it as "a SELECT type" doesn't match what the schema
//    actually declares, re-verified here rather than assumed from the brief). Reading
//    `.Dimensions` off whatever concrete subtype `Unit` actually is dispatches
//    correctly through the ordinary DERIVE-dispatch/plain-attribute machinery already
//    wired up by this project, with NO extra `calc_IfcNamedUnit_Dimensions` function
//    needed: confirmed directly against `IFC2X3.py` that no such function exists
//    (`IfcNamedUnit` does not itself declare `Dimensions` as DERIVE -- `generated/
//    ifc2x3.d.ts`'s own `IfcNamedUnit`/`IfcConversionBasedUnit` interfaces both list
//    `Dimensions: IfcDimensionalExponents` as a PLAIN stored attribute, inherited
//    as-is by `IfcConversionBasedUnit`; only `IfcSIUnit` and `IfcDerivedUnit`
//    re-declare it as DERIVE at their own subtype level, exactly the 2 functions this
//    chunk ports). So at runtime: a `IfcConversionBasedUnit` `Unit` resolves
//    `.Dimensions` via the ordinary FORWARD-attribute path (already fully working,
//    untouched by this chunk); an `IfcSIUnit`/`IfcDerivedUnit` `Unit` resolves it via
//    this chunk's own 2 newly-registered DERIVE functions -- including the
//    self-referential case where one `IfcDerivedUnitElement.Unit` is itself another
//    `IfcDerivedUnit` (ordinary recursion through the same dispatch mechanism, no
//    special-casing needed). Ported below as `ifcDeriveDimensionalExponents`.
//
// 2. `IfcDimensionsForSiUnit(n)` (real source line 7723, re-verified directly,
//    byte-for-byte match -- a 29-branch lookup table plus an `else` fallback of all
//    zeros) -- delegated to by `calc_IfcSIUnit_Dimensions`. `metre`/`square_metre`/
//    etc. are real Python's own `enum_namespace` module-level re-exports of
//    `IfcSIUnitName` enum labels (`IFC2X3.py` lines 1228-1257, e.g. `metre =
//    IfcSIUnitName.METRE`) -- every one of the 29 labels this function's own branches
//    reference was re-verified directly against those exact 29 assignment lines (not
//    assumed from a mechanical snake-to-upper-snake conversion): all 29 turned out to
//    be the straightforward uppercase conversion of their Python identifier
//    (`degree_celsius` -> `DEGREE_CELSIUS` included), so this port's own version below
//    is a plain chain of `n === "METRE"`/etc. string comparisons, matching this
//    project's established `IfcTransitionCode.DISCONTINUOUS` -> `"DISCONTINUOUS"`
//    string-literal convention (chunk 3's own header comment) rather than any kind of
//    enum-object reference. Ported below as `ifcDimensionsForSiUnit`.
//
// **No new real Python bugs found in either of this chunk's own 2 assigned
// functions or their 2 dependencies.** Both `calc_*` bodies are one-line
// pass-throughs to their respective helper; `IfcDeriveDimensionalExponents`'s 7
// parallel accumulation statements and `IfcDimensionsForSiUnit`'s 29-branch table are
// direct, mechanical structural translations with no tuple-mutation, no
// `INDETERMINATE`-poisoning arithmetic beyond this file's own already-disclosed,
// inherited "JS throws instead of silently propagating" gap (see this file's own
// header comment), and no other divergence from the real source found on direct
// re-reading.
//
// This chunk's own test file (`test/express/rules/ifc2x3.test.ts`) updates the same
// PRE-EXISTING "an unported DERIVE-shaped attribute still throws" test a FOURTH time
// -- but this time there is no remaining genuinely-unported IFC2X3 DERIVE attribute
// left to use as the example (this chunk closes out all 55), so the test's own
// example is changed in KIND, not just swapped to a new IFC2X3 attribute name: it now
// reads the identical `IfcDerivedUnit.Dimensions` attribute name chunk 4's own
// version of this test used, but off an `IFC4` fixture instead of an `IFC2X3` one --
// `calc_IfcDerivedUnit_Dimensions` exists in `IFC4.py` too (confirmed directly,
// `IFC4.py` line 6418) but no `rules/ifc4.ts` module exists in this port yet, so
// `dispatch.ts`'s per-schema registry has zero entries for `"IFC4"` and the read
// still throws "has no attribute" -- demonstrating the dispatch mechanism's own
// schema-scoping (§ `dispatch.ts`'s header comment) directly, rather than merely
// re-asserting "some attribute somewhere is still unported" once IFC2X3 itself has
// none left.
// =============================================================================

/**
 * Python: `IfcDeriveDimensionalExponents` (`IFC2X3.py` line 7711) -- not itself a
 * `calc_*` function (see this section's own header comment). Constructs a fresh
 * `IfcDimensionalExponents` entity (a genuine ENTITY, not a defined type -- see
 * header comment) via this file's own established `getScratchFile()` pattern, then
 * mutates it in place across the loop, matching real Python's own
 * `result.LengthExponent = ...` attribute reassignment exactly (ported via the same
 * Proxy-backed dot-assignment cast `ifcNormalise` above already uses for
 * `IfcDirection`/`IfcVector`, not `.set()` -- purely a style choice, both route
 * through the identical `EntityInstance.setByIndex` path).
 */
function ifcDeriveDimensionalExponents(unitelements: unknown): EntityInstance {
	const result = getScratchFile().createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 0);
	const mutable = result as unknown as Record<string, unknown>;
	for (const i of expressRange(loIndex(unitelements), (hiIndex(unitelements) as number) + 1)) {
		const element = expressGetItem(unitelements, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const exponent = expressGetAttr(element, "Exponent", INDETERMINATE) as number;
		const unitDimensions = expressGetAttr(expressGetAttr(element, "Unit", INDETERMINATE), "Dimensions", INDETERMINATE);
		mutable.LengthExponent =
			(expressGetAttr(result, "LengthExponent", INDETERMINATE) as number) +
			exponent * (expressGetAttr(unitDimensions, "LengthExponent", INDETERMINATE) as number);
		mutable.MassExponent =
			(expressGetAttr(result, "MassExponent", INDETERMINATE) as number) +
			exponent * (expressGetAttr(unitDimensions, "MassExponent", INDETERMINATE) as number);
		mutable.TimeExponent =
			(expressGetAttr(result, "TimeExponent", INDETERMINATE) as number) +
			exponent * (expressGetAttr(unitDimensions, "TimeExponent", INDETERMINATE) as number);
		mutable.ElectricCurrentExponent =
			(expressGetAttr(result, "ElectricCurrentExponent", INDETERMINATE) as number) +
			exponent * (expressGetAttr(unitDimensions, "ElectricCurrentExponent", INDETERMINATE) as number);
		mutable.ThermodynamicTemperatureExponent =
			(expressGetAttr(result, "ThermodynamicTemperatureExponent", INDETERMINATE) as number) +
			exponent * (expressGetAttr(unitDimensions, "ThermodynamicTemperatureExponent", INDETERMINATE) as number);
		mutable.AmountOfSubstanceExponent =
			(expressGetAttr(result, "AmountOfSubstanceExponent", INDETERMINATE) as number) +
			exponent * (expressGetAttr(unitDimensions, "AmountOfSubstanceExponent", INDETERMINATE) as number);
		mutable.LuminousIntensityExponent =
			(expressGetAttr(result, "LuminousIntensityExponent", INDETERMINATE) as number) +
			exponent * (expressGetAttr(unitDimensions, "LuminousIntensityExponent", INDETERMINATE) as number);
	}
	return result;
}

/**
 * Python: `IfcDimensionsForSiUnit` (`IFC2X3.py` line 7723) -- not itself a `calc_*`
 * function (see this section's own header comment). Each `IfcDimensionalExponents`
 * result is a fresh entity in this file's own shared scratch file, matching real
 * Python's own "construct a brand-new instance per call" behavior exactly (no
 * caching/interning in the real source either).
 */
function ifcDimensionsForSiUnit(n: unknown): EntityInstance {
	const file = getScratchFile();
	if (n === "METRE") return file.createEntity("IfcDimensionalExponents", 1, 0, 0, 0, 0, 0, 0);
	if (n === "SQUARE_METRE") return file.createEntity("IfcDimensionalExponents", 2, 0, 0, 0, 0, 0, 0);
	if (n === "CUBIC_METRE") return file.createEntity("IfcDimensionalExponents", 3, 0, 0, 0, 0, 0, 0);
	if (n === "GRAM") return file.createEntity("IfcDimensionalExponents", 0, 1, 0, 0, 0, 0, 0);
	if (n === "SECOND") return file.createEntity("IfcDimensionalExponents", 0, 0, 1, 0, 0, 0, 0);
	if (n === "AMPERE") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 1, 0, 0, 0);
	if (n === "KELVIN") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 1, 0, 0);
	if (n === "MOLE") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 1, 0);
	if (n === "CANDELA") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 1);
	if (n === "RADIAN") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 0);
	if (n === "STERADIAN") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 0);
	if (n === "HERTZ") return file.createEntity("IfcDimensionalExponents", 0, 0, -1, 0, 0, 0, 0);
	if (n === "NEWTON") return file.createEntity("IfcDimensionalExponents", 1, 1, -2, 0, 0, 0, 0);
	if (n === "PASCAL") return file.createEntity("IfcDimensionalExponents", -1, 1, -2, 0, 0, 0, 0);
	if (n === "JOULE") return file.createEntity("IfcDimensionalExponents", 2, 1, -2, 0, 0, 0, 0);
	if (n === "WATT") return file.createEntity("IfcDimensionalExponents", 2, 1, -3, 0, 0, 0, 0);
	if (n === "COULOMB") return file.createEntity("IfcDimensionalExponents", 0, 0, 1, 1, 0, 0, 0);
	if (n === "VOLT") return file.createEntity("IfcDimensionalExponents", 2, 1, -3, -1, 0, 0, 0);
	if (n === "FARAD") return file.createEntity("IfcDimensionalExponents", -2, -1, 4, 1, 0, 0, 0);
	if (n === "OHM") return file.createEntity("IfcDimensionalExponents", 2, 1, -3, -2, 0, 0, 0);
	if (n === "SIEMENS") return file.createEntity("IfcDimensionalExponents", -2, -1, 3, 2, 0, 0, 0);
	if (n === "WEBER") return file.createEntity("IfcDimensionalExponents", 2, 1, -2, -1, 0, 0, 0);
	if (n === "TESLA") return file.createEntity("IfcDimensionalExponents", 0, 1, -2, -1, 0, 0, 0);
	if (n === "HENRY") return file.createEntity("IfcDimensionalExponents", 2, 1, -2, -2, 0, 0, 0);
	if (n === "DEGREE_CELSIUS") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 1, 0, 0);
	if (n === "LUMEN") return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 1);
	if (n === "LUX") return file.createEntity("IfcDimensionalExponents", -2, 0, 0, 0, 0, 0, 1);
	if (n === "BECQUEREL") return file.createEntity("IfcDimensionalExponents", 0, 0, -1, 0, 0, 0, 0);
	if (n === "GRAY") return file.createEntity("IfcDimensionalExponents", 2, 0, -2, 0, 0, 0, 0);
	if (n === "SIEVERT") return file.createEntity("IfcDimensionalExponents", 2, 0, -2, 0, 0, 0, 0);
	return file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 0);
}

// --- the 2 assigned `calc_*` functions (exact real-Python names, file order) ---

export function calc_IfcDerivedUnit_Dimensions(self: EntityInstance): unknown {
	const elements = expressGetAttr(self, "Elements", INDETERMINATE);
	return ifcDeriveDimensionalExponents(elements);
}

export function calc_IfcSIUnit_Dimensions(self: EntityInstance): unknown {
	return ifcDimensionsForSiUnit(expressGetAttr(self, "Name", INDETERMINATE));
}

registerSchemaCalcFunctions("IFC2X3", {
	"IfcDerivedUnit.Dimensions": calc_IfcDerivedUnit_Dimensions,
	"IfcSIUnit.Dimensions": calc_IfcSIUnit_Dimensions,
});
