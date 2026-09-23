// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-2, IFC4's first chunk (planning/ifcopenshell-ts/70-express-rules-plan.md
// §4): the FIRST 15 of IFC4's 62 `calc_*` (DERIVE) functions from
// `src/ifcopenshell-python/ifcopenshell/express/rules/IFC4.py`, in real file order
// (line numbers re-verified directly against that file before porting, not just
// trusted from the task brief that dispatched this chunk -- all 15 matched exactly:
// 4949/4972/5027/5042/5046/5297/5310/5596/5613/5617/5648/5661/5702/5726/5730):
//
//   calc_IfcAxis1Placement_Z, calc_IfcAxis2Placement2D_P, calc_IfcAxis2Placement3D_P,
//   calc_IfcBSplineCurve_UpperIndexOnControlPoints, calc_IfcBSplineCurve_ControlPoints,
//   calc_IfcBooleanResult_Dim, calc_IfcBoundingBox_Dim, calc_IfcCartesianPoint_Dim,
//   calc_IfcCartesianTransformationOperator_Scl, calc_IfcCartesianTransformationOperator_Dim,
//   calc_IfcCartesianTransformationOperator2D_U, calc_IfcCartesianTransformationOperator2DnonUniform_Scl2,
//   calc_IfcCartesianTransformationOperator3D_U, calc_IfcCartesianTransformationOperator3DnonUniform_Scl2,
//   calc_IfcCartesianTransformationOperator3DnonUniform_Scl3
//
// **These are the exact same 15 function names IFC2X3's own chunk 1 ported**
// (`rules/ifc2x3.ts`) -- confirmed by direct diff of every one of these 15 real
// Python function bodies against `IFC2X3.py`'s own real source (not assumed from
// name overlap alone): all 15 are BYTE-IDENTICAL between `IFC2X3.py` and `IFC4.py`.
// Same for the 3 minimal extra dependencies below (`calc_IfcDirection_Dim`/
// `calc_IfcVector_Dim`/`calc_IfcSolidModel_Dim`, real IFC4.py lines 6432/11089/9834,
// also all byte-identical to their IFC2X3 counterparts).
//
// **The 12 shared EXPRESS library helper functions these 15 assigned functions
// transitively need** (`IfcNormalise`, `IfcCrossProduct`, `IfcDotProduct`,
// `IfcOrthogonalComplement`, `IfcFirstProjAxis`, `IfcSecondProjAxis`,
// `IfcScalarTimesVector`, `IfcVectorDifference`, `IfcBaseAxis`, `IfcBuildAxes`,
// `IfcBuild2Axes`, `IfcListToArray` -- see `rules/ifc2x3.ts`'s own header comment for
// why these are unavoidable, not scope creep) were each independently diffed against
// their own IFC2X3.py source (not just re-used from `ifc2x3.ts` unverified):
//
// - `IfcBaseAxis`, `IfcBuild2Axes`, `IfcBuildAxes`, `IfcCrossProduct`, `IfcDotProduct`,
//   `IfcFirstProjAxis`, `IfcListToArray`, `IfcOrthogonalComplement`, `IfcSecondProjAxis`:
//   BYTE-IDENTICAL to `IFC2X3.py`.
// - `IfcScalarTimesVector`, `IfcVectorDifference`: identical EXCEPT for the real
//   EXPRESS/schema namespace string embedded in a `typeof(...)` membership check
//   (`'ifc4.ifcvector' in typeof(vec)` vs. IFC2X3's own `'ifc2x3.ifcvector'`) --
//   exactly the kind of genuine, schema-scoped difference this chunk's own task brief
//   anticipated. Ported below using `'ifc4.ifcvector'`, matching `runtimeShim.ts`'s own
//   `typeOf()`, which always lower-cases the REAL schema identifier a given instance
//   actually belongs to (`ifc4`, not `ifc2x3`) into its returned set -- confirmed by
//   reading `typeOf`'s own implementation, not assumed.
// - `IfcNormalise`: same `'ifc4.ifcvector'`-vs-`'ifc2x3.ifcvector'` difference, PLUS one
//   purely cosmetic reordering: IFC4's generated source computes
//   `ndim = express_getattr(arg, 'Dim', INDETERMINATE)` separately, once inside EACH of
//   the `if`/`else` branches (identical expression, just duplicated), where IFC2X3's own
//   generated source computes it once, before the branch. Confirmed behaviorally
//   equivalent (not a formula change): `arg` is not reassigned between the two branch
//   entries in either version, so the expression evaluates to the same value regardless
//   of exactly where it's computed. Ported below in IFC2X3's own single-computation
//   shape (matching this file's own established style, not real IFC4.py's line-for-line
//   layout) -- a disclosed, deliberate simplification of a genuinely no-op code-
//   generator quirk, not a silent behavior change.
//
// **Real, disclosed Python bugs -- all 3 of IFC2X3's own already-disclosed bugs are
// present, verbatim, in IFC4's own generated source too** (independently re-verified
// against the real `IFC4.py` text at each bug's own real line, not assumed just
// because the function bodies diffed byte-identical above -- a byte-identical body
// necessarily carries an identical bug, but this was still checked directly rather
// than inferred):
//
// 1. `IfcFirstProjAxis`'s `if express_getattr(z, 'DirectionRatios', INDETERMINATE) !=
//    [1.0, 0.0, 0.0]:` -- tuple-vs-list comparison, unconditionally `True` in real
//    Python, making the `else` branch dead code. See `rules/ifc2x3.ts`'s own header
//    comment (bug 1) for the full citation; identical here. Ported the same way: a
//    reference (`!==`) comparison against a freshly-allocated array literal.
//
// 2. `IfcBaseAxis`'s two tuple-mutation crashes (`Axis1`+`Axis2` both set with a
//    negative dot product against the orthogonal complement; `Axis1` absent, `Axis2`
//    set -- unconditional). See `rules/ifc2x3.ts`'s own header comment (bug 2/2b) for
//    the full citation; identical here, confirmed by the byte-identical `IfcBaseAxis`
//    body above. Ported the same way: an equivalent thrown `Error` at each point.
//
// 3. `IfcListToArray(lis, low, u)` -- cyclic left-rotation for `low === 0` (exactly how
//    `calc_IfcBSplineCurve_ControlPoints` calls it). See `rules/ifc2x3.ts`'s own header
//    comment (bug 3) for the full derivation; identical here, confirmed by the
//    byte-identical `IfcListToArray` body above. Ported the same way: a direct
//    structural translation reproducing the rotation.
//
// **The same pre-existing, inherited (not newly introduced) `INDETERMINATE`-poisoning-
// through-plain-JS-operators limitation `runtimeShim.ts`'s own header comment already
// flags** applies here identically -- not repeated in full, see `rules/ifc2x3.ts`'s own
// header comment for the complete disclosure. Every arithmetic/comparison expression
// below is a direct, structural port of the real Python expression it mirrors.

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

// --- scratch-entity construction -- same disclosed "no bare-schema-file primitive,
// use `template.create` as a throwaway-file workaround" pattern `rules/ifc2x3.ts`'s own
// header comment already establishes and justifies in full; not repeated here. Schema-
// scoped to `IFC4` (this module's only scope) via its own, separate module-private
// singleton -- deliberately NOT shared with `rules/ifc2x3.ts`'s own `scratchFile`, since
// a scratch `IfcDirection`/`IfcVector` must be constructed against the SAME schema as
// the real instance a `calc_*` formula is being evaluated for (`typeOf(...)` below reads
// back that schema's own lower-cased identifier).
import * as template from "../../template";

let scratchFile: IfcFile | undefined;
function getScratchFile(): IfcFile {
	if (!scratchFile) {
		scratchFile = template.create({ schemaIdentifier: "IFC4" });
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

/** Python: `IfcNormalise` (`IFC4.py`) -- see this file's own header comment on the one, disclosed, no-op cosmetic reordering vs. IFC2X3's own generated layout. */
function ifcNormalise(arg: unknown): EntityInstance | null {
	const v = ifcDirection([1.0, 0.0]);
	const vec = ifcVector(ifcDirection([1.0, 0.0]), 1.0);
	let result: EntityInstance = v;
	if (!exists(arg)) return null;
	const ndim = expressGetAttr(arg, "Dim", INDETERMINATE) as number | Indeterminate;
	if (typeOf(arg as EntityInstance).has("ifc4.ifcvector")) {
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
		if (typeOf(arg as EntityInstance).has("ifc4.ifcvector")) {
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

/** Python: `IfcOrthogonalComplement` (`IFC4.py`) -- byte-identical to IFC2X3's own. */
function ifcOrthogonalComplement(vec: unknown): EntityInstance | null {
	if (!exists(vec) || expressGetAttr(vec, "Dim", INDETERMINATE) !== 2) return null;
	const ratios = expressGetAttr(vec, "DirectionRatios", INDETERMINATE);
	return ifcDirection([
		-(expressGetItem(ratios, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number),
		expressGetItem(ratios, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number,
	]);
}

/** Python: `IfcCrossProduct` (`IFC4.py`) -- byte-identical to IFC2X3's own. */
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

/** Python: `IfcDotProduct` (`IFC4.py`) -- byte-identical to IFC2X3's own. */
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

/** Python: `IfcScalarTimesVector` (`IFC4.py`) -- see this file's own header comment on the `'ifc4.ifcvector'` namespace-string difference vs. IFC2X3's own `'ifc2x3.ifcvector'`. */
function ifcScalarTimesVector(scalar: unknown, vec: unknown): EntityInstance | null {
	if (!exists(scalar) || !exists(vec)) return null;
	let v: unknown;
	let mag: number;
	if (typeOf(vec as EntityInstance).has("ifc4.ifcvector")) {
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

/** Python: `IfcVectorDifference` (`IFC4.py`) -- see this file's own header comment on the `'ifc4.ifcvector'` namespace-string difference vs. IFC2X3's own `'ifc2x3.ifcvector'`. */
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
	if (typeOf(arg1 as EntityInstance).has("ifc4.ifcvector")) {
		mag1 = expressGetAttr(arg1, "Magnitude", INDETERMINATE) as number;
		vec1 = expressGetAttr(arg1, "Orientation", INDETERMINATE);
	} else {
		mag1 = 1.0;
		vec1 = arg1;
	}
	let mag2: number;
	let vec2: unknown;
	if (typeOf(arg2 as EntityInstance).has("ifc4.ifcvector")) {
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
 * Returns a fresh `[1.0, 0.0, 0.0]` array every call -- see `rules/ifc2x3.ts`'s own
 * doc comment on the identical helper there for the full rationale (avoiding a
 * spurious `tsc` TS2839 "always true" diagnostic on the deliberately-always-true
 * reference comparison this mirrors real Python's own always-`!=` tuple-vs-list bug).
 */
function freshUnitXDirectionRatios(): number[] {
	return [1.0, 0.0, 0.0];
}

/** Python: `IfcFirstProjAxis` (`IFC4.py`) -- byte-identical to IFC2X3's own; see this file's own header comment, bug 1. */
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

/** Python: `IfcSecondProjAxis` (`IFC4.py`) -- byte-identical to IFC2X3's own. */
function ifcSecondProjAxis(zaxis: unknown, xaxis: unknown, arg: unknown): unknown {
	const v = exists(arg) ? arg : ifcDirection([0.0, 1.0, 0.0]);
	let temp = ifcScalarTimesVector(ifcDotProduct(v, zaxis), zaxis);
	let yaxis: unknown = ifcVectorDifference(v, temp);
	temp = ifcScalarTimesVector(ifcDotProduct(v, xaxis), xaxis);
	yaxis = ifcVectorDifference(yaxis, temp);
	yaxis = ifcNormalise(yaxis);
	return expressGetAttr(yaxis, "Orientation", INDETERMINATE);
}

/** Python: `IfcBaseAxis` (`IFC4.py`) -- byte-identical to IFC2X3's own; see this file's own header comment, bug 2/2b. */
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
						"orthogonal complement) -- see rules/ifc4.ts's own header comment, " +
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
				"reached -- see rules/ifc4.ts's own header comment, disclosed bug #2b, for the " +
				"full citation.",
		);
	}
	return [ifcDirection([1.0, 0.0]), ifcDirection([0.0, 1.0])];
}

/** Python: `IfcBuildAxes` (`IFC4.py`) -- byte-identical to IFC2X3's own. */
function ifcBuildAxes(axis: unknown, refdirection: unknown): unknown[] {
	const d1 = nvl(ifcNormalise(axis), ifcDirection([0.0, 0.0, 1.0]));
	const d2 = ifcFirstProjAxis(d1, refdirection);
	return [d2, expressGetAttr(ifcNormalise(ifcCrossProduct(d1, d2)), "Orientation", INDETERMINATE), d1];
}

/** Python: `IfcBuild2Axes` (`IFC4.py`) -- byte-identical to IFC2X3's own. */
function ifcBuild2Axes(refdirection: unknown): unknown[] {
	const d = nvl(ifcNormalise(refdirection), ifcDirection([1.0, 0.0]));
	return [d, ifcOrthogonalComplement(d)];
}

/**
 * Python: `IfcListToArray` (`IFC4.py`) -- byte-identical to IFC2X3's own; see this
 * file's own header comment, disclosed bug #3: for `low === 0` (exactly how
 * `calc_IfcBSplineCurve_ControlPoints` below calls this), the real formula cyclically
 * left-rotates its input by one position rather than copying it in order. Ported as a
 * direct structural translation, faithfully reproducing the rotation.
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

registerSchemaCalcFunctions("IFC4", {
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
