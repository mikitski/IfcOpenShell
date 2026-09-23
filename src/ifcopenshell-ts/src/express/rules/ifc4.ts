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
	loIndex,
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

// =============================================================================
// Phase EX-2, IFC4's second chunk (planning/ifcopenshell-ts/70-express-rules-plan.md
// §4): 15 more of IFC4's 62 `calc_*` functions, in real file order (line numbers
// re-verified directly against `IFC4.py` before porting, not just trusted from the
// task brief that dispatched this chunk -- all 15 matched exactly:
// 5076/5080/5084/5088/5140/5144/5600/5964/5968/5983/5996/6290/6323/6418/6717):
//
//   calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots, calc_IfcBSplineSurface_UUpper,
//   calc_IfcBSplineSurface_VUpper, calc_IfcBSplineSurface_ControlPoints,
//   calc_IfcBSplineSurfaceWithKnots_KnotVUpper, calc_IfcBSplineSurfaceWithKnots_KnotUUpper,
//   calc_IfcCartesianPointList_Dim, calc_IfcCompositeCurve_NSegments,
//   calc_IfcCompositeCurve_ClosedCurve, calc_IfcCompositeCurveOnSurface_BasisSurface,
//   calc_IfcCompositeCurveSegment_Dim, calc_IfcCsgPrimitive3D_Dim, calc_IfcCurve_Dim,
//   calc_IfcDerivedUnit_Dimensions, calc_IfcEdgeLoop_Ne
//
// **6 of these 15 SHARE A NAME with an already-ported IFC2X3 function** -- each
// diffed directly against both real Python sources (`IFC2X3.py`/`IFC4.py`) AND
// `ifc2x3.ts`'s own already-shipped port, per this chunk's own task brief:
//
// - `calc_IfcCompositeCurve_NSegments` (`IFC2X3.py` line 4501 / `IFC4.py` line 5964),
//   `calc_IfcCompositeCurve_ClosedCurve` (4505 / 5968), `calc_IfcCompositeCurveSegment_Dim`
//   (4520 / 5996), `calc_IfcCsgPrimitive3D_Dim` (4671 / 6290), `calc_IfcDerivedUnit_Dimensions`
//   (4741 / 6418, including its own `IfcDeriveDimensionalExponents` dependency, real
//   source line 7711 / 11715), and `calc_IfcEdgeLoop_Ne` (5020 / 6717) are all
//   BYTE-IDENTICAL between `IFC2X3.py` and `IFC4.py` (confirmed by direct `diff`, not
//   name-overlap assumption) -- ported below closely mirroring `ifc2x3.ts`'s own
//   approach for each (`IfcDeriveDimensionalExponents` is still ported FRESH here, not
//   imported, since it needs THIS file's own `getScratchFile()`, scoped to the IFC4
//   schema -- schema-scoped scratch-entity construction, same reason chunk 1's own
//   `ifcDirection`/`ifcVector` aren't shared with `ifc2x3.ts` either).
//
// - `calc_IfcCurve_Dim` (`IFC2X3.py` line 4674 / `IFC4.py` line 6323) is GENUINELY
//   DIFFERENT: its own dispatch helper, `IfcCurveDim` (`IFC2X3.py` line 7684 / `IFC4.py`
//   line 11684), is byte-identical for its first 8 branches
//   (`IfcLine`/`IfcConic`/`IfcPolyline`/`IfcTrimmedCurve`/`IfcCompositeCurve`/
//   `IfcBSplineCurve`/`IfcOffsetCurve2D`/`IfcOffsetCurve3D`) but IFC4's own version adds
//   2 EXTRA branches for 2 curve types that postdate IFC2X3 entirely (`IfcPcurve` --
//   constant `3` -- and `IfcIndexedPolyCurve` -- `Points.Dim`, itself dispatching
//   through this very chunk's own `calc_IfcCartesianPointList_Dim`). Ported fresh below
//   as a new, IFC4-scoped `ifcCurveDim` (not imported from `ifc2x3.ts`, which has its
//   own separate, 8-branch-only copy) -- same disclosed `!exists(curve)` guard fix as
//   `ifc2x3.ts`'s own version (see that file's own doc comment for the full rationale,
//   not repeated here: this port's `INDETERMINATE` sentinel is a plain, always-truthy
//   JS `Symbol`, unlike real Python's `indeterminate_type.__bool__() == False`, so
//   `typeOf()` needs an explicit upstream guard `typeof()` doesn't).
//
// **The other 9 are genuinely IFC4-only** (no IFC2X3 equivalent at all -- confirmed
// directly: none of `IfcBSplineSurface`/`IfcBSplineSurfaceWithKnots`/
// `IfcCartesianPointList`/`IfcCompositeCurveOnSurface`/`IfcPcurve`/`IfcSurfaceCurve`/
// `IfcIndexedPolyCurve`, nor `IfcMakeArrayOfArray`/`IfcPointListDim`/`IfcGetBasisSurface`/
// `IfcAssociatedSurface` as bare identifiers, appear anywhere in `IFC2X3.py`) --
// `calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots`/`calc_IfcBSplineSurfaceWithKnots_KnotUUpper`/
// `calc_IfcBSplineSurfaceWithKnots_KnotVUpper` are trivial one-line `sizeof(...)` calls;
// `calc_IfcBSplineSurface_UUpper`/`_VUpper` are one-line `sizeof(...) - 1`/nested-`sizeof`
// calls; `calc_IfcCartesianPointList_Dim` and `calc_IfcCompositeCurveOnSurface_BasisSurface`
// each need one small new shared helper (`IfcPointListDim`/`IfcGetBasisSurface`, both
// ported below); `calc_IfcBSplineSurface_ControlPoints` needs a new helper too
// (`IfcMakeArrayOfArray`, real source line 11862) that itself reuses THIS FILE'S OWN
// already-ported `ifcListToArray` (chunk 1) -- no re-porting needed for that part.
//
// **3 real, disclosed Python bugs found in this chunk's own 9 IFC4-only functions/
// helpers -- all 3 are NEW findings, NOT shared with any of IFC2X3's own 3
// already-disclosed bugs (chunk 1's own header comment) or with each other's root
// cause (2 different bad-operator-precedence/type mistakes in 2 unrelated
// functions):**
//
// 1. `IfcMakeArrayOfArray` (real source line 11862, delegated to by
//    `calc_IfcBSplineSurface_ControlPoints`): `res = [IfcListToArray(...)] * u1 - low1
//    + 1` -- Python's own operator precedence (`*` binds tighter than binary `-`)
//    parses this as `([IfcListToArray(...)] * u1) - low1 + 1`, i.e. a `list` MINUS an
//    `int`. Python lists define no `__sub__`, so this unconditionally raises
//    `TypeError: unsupported operand type(s) for -: 'list' and 'int'` every time this
//    line is reached with a real list (which it always is -- `IfcListToArray`'s own
//    `None`-returning guard cannot fire for values `IfcMakeArrayOfArray`'s own 2
//    preceding guards already validated). **Net effect: `calc_IfcBSplineSurface_
//    ControlPoints` can NEVER successfully compute a value in real Python, for ANY
//    structurally valid `IfcBSplineSurface`** -- not a narrow edge case, an
//    unconditional crash on every real call. Ported as an equivalent thrown `Error` at
//    the same point, pinned with a dedicated test (see `ifcMakeArrayOfArray`'s own doc
//    comment below for the full citation).
//
// 2. `IfcGetBasisSurface` (real source line 11827, delegated to by `calc_
//    IfcCompositeCurveOnSurface_BasisSurface`)'s own `'ifc4.ifcsurfacecurve' in
//    typeof(c)` branch does `surfs = surfs + IfcAssociatedSurface(...)` inside a loop
//    -- `surfs` is a Python `list`, but `IfcAssociatedSurface(...)` (real source line
//    11355, a 1-line `return arg.BasisSurface` -- not separately ported as its own TS
//    function below since it is unreachable in every path this bug leaves standing,
//    see point 3) returns a single `IfcSurface` VALUE, not a list. `list + <non-list>`
//    unconditionally raises `TypeError` in real Python the first time this loop
//    actually runs -- which is always, since `AssociatedGeometry` is schema-mandatory
//    (`LIST [1:2]`, not enforced by this port's own attribute-write path, but true for
//    any well-formed real file). Ported as an equivalent thrown `Error` at the same
//    point.
//
// 3. The SAME `IfcGetBasisSurface`'s `'ifc4.ifccompositecurveonsurface' in typeof(c)`
//    branch's own `if n > 1` loop does `surfs = surfs * IfcGetBasisSurface(...)` --
//    `surfs` here is always the list-shaped result of the immediately-preceding
//    recursive `IfcGetBasisSurface(...)` call, so this is `list * list`, which Python
//    also rejects unconditionally (`TypeError: can't multiply sequence by non-int of
//    type 'list'`) -- reached whenever a real `IfcCompositeCurveOnSurface` has MORE
//    THAN ONE segment. (This loop body also indexes `Segments` with the hardcoded
//    constant `1` on every iteration instead of the loop variable `i` -- a second,
//    independent real bug -- but it is DEAD CODE in practice: the `list * list`
//    `TypeError` above fires first, on the very first extra-segment iteration, before
//    that indexing mistake could ever matter. Not separately reproduced here, same as
//    this file's own chunk-1-disclosed `IfcFirstProjAxis` dead-`else`-branch precedent,
//    bug #1.) Ported as an equivalent thrown `Error` at the same point. **Net effect on
//    `calc_IfcCompositeCurveOnSurface_BasisSurface`: succeeds (recursing into its
//    single segment's own `ParentCurve`) for a composite curve with exactly ONE
//    segment whose `ParentCurve` is anything OTHER than an `IfcSurfaceCurve`; throws
//    for 2+ segments (this bug) or a single segment whose `ParentCurve` is itself an
//    `IfcSurfaceCurve` (bug 2 above).**
//
// **Cascading test-fidelity fixes, required by porting `calc_IfcCurve_Dim` (this
// chunk) -- disclosed here, not silently left stale, matching this chunk's own task
// brief's explicit instruction to check for exactly this shape of regression (chunk
// 1's own precedent: `api.cogo.editSurveyPoint`'s test, for `IfcCartesianPoint.Dim`):**
//
// 1. `test/express/rules/ifc2x3.test.ts`'s own "an unported-for-THIS-SCHEMA
//    DERIVE-shaped attribute still throws" test (added by IFC2X3's own chunk 5) read
//    `IfcDerivedUnit.Dimensions` off an `IFC4` fixture specifically BECAUSE `rules/
//    ifc4.ts` didn't exist yet at all -- this chunk now registers exactly that key for
//    IFC4 (see above), so the read would silently start succeeding instead of
//    throwing. Swapped for `IfcSIUnit.Dimensions` (`IFC4.py` line 9552,
//    `calc_IfcSIUnit_Dimensions`) -- confirmed still genuinely unported for IFC4 by
//    this chunk (not one of its own 15, nor chunk 1's), matching `test/api/unit/
//    editNamedUnit.test.ts`'s own already-passing, unrelated "IFC4/IFC4X3: still
//    throws (no ported calc_IfcSIUnit_Dimensions for this schema yet)" assertion,
//    independently confirming the same fact from a different test file.
//
// 2. `test/util/representation.test.ts`'s own "Curve2D/Curve3D branches throw the
//    disclosed .Dim DERIVED-attribute error for a real IfcCurve" test (and this file's
//    own header comment, finding 5) used a bare `IfcLine` (no `Pnt` set) on an `IFC4`
//    fixture to pin `guessType`'s own `.Dim`-dependent branches as unconditionally
//    blocked -- `calc_IfcCurve_Dim` now resolves for IFC4 (this chunk), so the read no
//    longer throws: `Dim` resolves to `runtimeShim.INDETERMINATE` for a `Pnt`-unset
//    `IfcLine` (`expressGetAttr(null, 'Dim', INDETERMINATE)`, `runtimeShim.ts`'s own
//    established null-target behavior), which matches neither `=== 2` nor `=== 3`, so
//    `guessType` now falls through to the plain, `Dim`-independent `"Curve"` branch
//    instead of throwing. Test updated to assert the new, real, resolved behavior
//    (`"Curve"` for the degenerate case, `"Curve2D"`/`"Curve3D"` for real 2D/3D lines)
//    -- `representation.ts`'s own header comment (finding 5) updated the same way,
//    matching `editSurveyPoint.ts`'s own established precedent for this exact kind of
//    downstream-caller update. `Surface2D`/`Surface3D` remain genuinely blocked for
//    IFC4 (no `IfcSurface`-subtype `Dim` function ported by this chunk or chunk 1) --
//    unaffected, not touched.
//
// 3. `test/util/shapeBuilder.test.ts`'s own "profile: DISCLOSED BLOCKED (Dim
//    derived-attribute gap)" / "createSweptDiskSolid: DISCLOSED BLOCKED (Dim
//    derived-attribute gap)" tests (`describe.each(AVAILABLE_SCHEMAS.filter((s) => s
//    !== "IFC2X3"))`, so IFC4 AND IFC4X3 both) build a straight (`closed=false`, no
//    `arcPoints`) polyline, which on IFC4/IFC4X3 is a real `IfcIndexedPolyCurve` over
//    an `IfcCartesianPointList2D`/`3D` (`shapeBuilder.ts`'s own `polyline()`) -- once
//    `.Dim` resolves (`calc_IfcCurve_Dim`'s new `IfcIndexedPolyCurve` branch this
//    chunk adds, dispatching into `calc_IfcCartesianPointList_Dim`, also this chunk),
//    `ShapeBuilder.profile()`/`.createSweptDiskSolid()`'s own leading `Dim` guard no
//    longer throws for IFC4 -- both now complete successfully end-to-end (verified
//    directly against the real built addon, not assumed). IFC4X3 is UNCHANGED (no
//    `rules/ifc4x3.ts` module exists yet) -- still throws exactly as before. Split
//    into schema-conditional branches (`schema === "IFC4"` vs. `"IFC4X3"`), matching
//    `editSurveyPoint.test.ts`'s own established precedent for this exact shape of
//    partial, schema-scoped resolution.
// =============================================================================

/**
 * Python: `IfcCurveDim` (`IFC4.py` line 11684) -- the shared dispatch helper
 * `calc_IfcCurve_Dim` (below) delegates to; not itself a `calc_*` function (see this
 * section's own header comment). GENUINELY DIFFERENT from `ifc2x3.ts`'s own
 * `ifcCurveDim`: IFC4 adds 2 extra branches (`IfcPcurve` -- constant `3` --
 * and `IfcIndexedPolyCurve` -- `Points.Dim`) for 2 curve types that don't exist in
 * IFC2X3 at all; the other 8 branches are byte-identical to IFC2X3's own (see this
 * section's own header comment for the full diff citation).
 *
 * Same disclosed fix as `ifc2x3.ts`'s own `ifcCurveDim` (an explicit `!exists(curve)`
 * guard, absent from real Python's own source, needed here because this port's
 * `INDETERMINATE` sentinel is a plain, always-truthy JS `Symbol` rather than a real
 * Python object whose `__bool__` real Python's own `typeof()` relies on) -- see that
 * file's own doc comment for the full rationale, not repeated here.
 */
function ifcCurveDim(curve: unknown): unknown {
	if (!exists(curve)) return null;
	if (typeOf(curve as EntityInstance).has("ifc4.ifcline")) {
		return expressGetAttr(expressGetAttr(curve, "Pnt", INDETERMINATE), "Dim", INDETERMINATE);
	}
	if (typeOf(curve as EntityInstance).has("ifc4.ifcconic")) {
		return expressGetAttr(expressGetAttr(curve, "Position", INDETERMINATE), "Dim", INDETERMINATE);
	}
	if (typeOf(curve as EntityInstance).has("ifc4.ifcpolyline")) {
		return expressGetAttr(
			expressGetItem(expressGetAttr(curve, "Points", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"Dim",
			INDETERMINATE,
		);
	}
	if (typeOf(curve as EntityInstance).has("ifc4.ifctrimmedcurve")) {
		return ifcCurveDim(expressGetAttr(curve, "BasisCurve", INDETERMINATE));
	}
	if (typeOf(curve as EntityInstance).has("ifc4.ifccompositecurve")) {
		return expressGetAttr(
			expressGetItem(expressGetAttr(curve, "Segments", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"Dim",
			INDETERMINATE,
		);
	}
	if (typeOf(curve as EntityInstance).has("ifc4.ifcbsplinecurve")) {
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
	if (typeOf(curve as EntityInstance).has("ifc4.ifcoffsetcurve2d")) return 2;
	if (typeOf(curve as EntityInstance).has("ifc4.ifcoffsetcurve3d")) return 3;
	// --- the 2 branches genuinely NEW to IFC4 (see this section's own header comment) ---
	if (typeOf(curve as EntityInstance).has("ifc4.ifcpcurve")) return 3;
	if (typeOf(curve as EntityInstance).has("ifc4.ifcindexedpolycurve")) {
		return expressGetAttr(expressGetAttr(curve, "Points", INDETERMINATE), "Dim", INDETERMINATE);
	}
	return null;
}

/**
 * Python: `IfcDeriveDimensionalExponents` (`IFC4.py` line 11715) -- not itself a
 * `calc_*` function (see this section's own header comment); structurally
 * byte-identical to `IFC2X3.py`'s own version (confirmed by direct diff) -- ported
 * fresh here rather than imported, since it needs THIS file's own `getScratchFile()`,
 * scoped to the IFC4 schema (same reason chunk 1's own `ifcDirection`/`ifcVector`
 * aren't shared with `ifc2x3.ts` either).
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
 * Python: `IfcMakeArrayOfArray` (`IFC4.py` line 11862) -- not itself a `calc_*`
 * function; delegated to by `calc_IfcBSplineSurface_ControlPoints` (below). Genuinely
 * IFC4-only, no IFC2X3 equivalent (confirmed: neither this function nor
 * `IfcBSplineSurface`/`calc_IfcBSplineSurface_ControlPoints` appear anywhere in
 * `IFC2X3.py`).
 *
 * **Real, disclosed Python bug, NEW to this chunk** -- see this section's own header
 * comment, bug 1, for the full citation: real Python's own third statement, `res =
 * [IfcListToArray(...)] * u1 - low1 + 1`, unconditionally raises `TypeError` (a
 * `list` minus an `int`, due to Python's own `*`-before-`-` operator precedence)
 * every time this line is reached with a real list -- which is always, given the 2
 * guards immediately above already hold. Ported as an equivalent thrown `Error` at
 * the same point, reached only after both guards pass (matching real Python's own
 * exact control flow up to the crash).
 */
function ifcMakeArrayOfArray(lis: unknown, low1: number, u1: number, low2: number, u2: number): unknown[] | null {
	if (u1 - low1 + 1 !== (sizeof(lis) as number)) return null;
	const firstRow = expressGetItem(lis, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	if (u2 - low2 + 1 !== (sizeof(firstRow) as number)) return null;
	throw new Error(
		"IfcMakeArrayOfArray: real Python's own generated formula raises " +
			"TypeError(\"unsupported operand type(s) for -: 'list' and 'int'\") at this exact " +
			"point (`[IfcListToArray(...)] * u1 - low1 + 1` parses, by Python's own operator " +
			"precedence, as a list MULTIPLIED by an int, then that list result MINUS another " +
			"int -- lists define no __sub__) -- unconditionally, every time both preceding " +
			"size-validation guards pass -- see rules/ifc4.ts's own header comment (this " +
			"chunk's disclosed bug 1) for the full citation. This means " +
			"calc_IfcBSplineSurface_ControlPoints can never successfully compute a value in " +
			"real Python either.",
	);
}

/**
 * Python: `IfcPointListDim` (`IFC4.py` line 11935) -- not itself a `calc_*` function;
 * delegated to by `calc_IfcCartesianPointList_Dim` (below). Genuinely IFC4-only (no
 * IFC2X3 equivalent -- `IfcCartesianPointList`/`IfcCartesianPointList2D`/
 * `IfcCartesianPointList3D` don't exist in IFC2X3 at all). `pointlist` is always
 * `self` at the one real call site (`calc_IfcCartesianPointList_Dim(self): return
 * IfcPointListDim(self)`), i.e. always a genuine `EntityInstance` -- no `!exists()`
 * guard needed (unlike `ifcCurveDim`, which recurses onto a possibly-unset
 * attribute).
 */
function ifcPointListDim(pointlist: unknown): unknown {
	if (typeOf(pointlist as EntityInstance).has("ifc4.ifccartesianpointlist2d")) return 2;
	if (typeOf(pointlist as EntityInstance).has("ifc4.ifccartesianpointlist3d")) return 3;
	return null;
}

/**
 * Python: `IfcGetBasisSurface` (`IFC4.py` line 11827) -- not itself a `calc_*`
 * function; delegated to by `calc_IfcCompositeCurveOnSurface_BasisSurface` (below).
 * Genuinely IFC4-only (`IfcCompositeCurveOnSurface`/`IfcPcurve`/`IfcSurfaceCurve` all
 * postdate IFC2X3).
 *
 * **2 real, disclosed Python bugs, both NEW to this chunk** -- see this section's own
 * header comment, bugs 2 and 3, for the full citations:
 *
 * - The `'ifc4.ifcsurfacecurve' in typeof(c)` branch's real formula, `surfs = surfs +
 *   IfcAssociatedSurface(...)`, unconditionally raises `TypeError` (`list` + a single
 *   `IfcSurface` value, not a list) the first time its own loop runs -- which is
 *   always, since `AssociatedGeometry` is schema-mandatory (`LIST [1:2]`). Ported as
 *   an equivalent thrown `Error` as soon as that branch is entered with a non-empty
 *   `AssociatedGeometry` (`IfcAssociatedSurface` -- real source line 11355, a 1-line
 *   `return arg.BasisSurface` -- is not separately ported as its own TS function: it
 *   is unreachable in every path this bug leaves standing, since the `TypeError`
 *   above always fires first).
 * - The `'ifc4.ifccompositecurveonsurface' in typeof(c)` branch's own `n > 1` loop
 *   does `surfs = surfs * IfcGetBasisSurface(...)` -- `list * list`, also
 *   unconditionally rejected by Python -- reached whenever a real
 *   `IfcCompositeCurveOnSurface` has more than one segment. Ported as an equivalent
 *   thrown `Error` at the same point.
 */
function ifcGetBasisSurface(c: unknown): unknown[] {
	let surfs: unknown[] = [];
	if (typeOf(c as EntityInstance).has("ifc4.ifcpcurve")) {
		surfs = [expressGetAttr(c, "BasisSurface", INDETERMINATE)];
	} else if (typeOf(c as EntityInstance).has("ifc4.ifcsurfacecurve")) {
		const associatedGeometry = expressGetAttr(c, "AssociatedGeometry", INDETERMINATE);
		if ((sizeof(associatedGeometry) as number) > 0) {
			throw new Error(
				"IfcGetBasisSurface: real Python's own generated formula raises TypeError " +
					"(list + non-list, concatenating a plain list with a single IfcSurface value " +
					"returned by IfcAssociatedSurface) at this exact point (an IfcSurfaceCurve's " +
					"own AssociatedGeometry loop) -- unconditionally, every time this branch is " +
					"reached (AssociatedGeometry is schema-mandatory, LIST [1:2]) -- see " +
					"rules/ifc4.ts's own header comment (this chunk's disclosed bug 2) for the " +
					"full citation.",
			);
		}
	}
	if (typeOf(c as EntityInstance).has("ifc4.ifccompositecurveonsurface")) {
		const segments = expressGetAttr(c, "Segments", INDETERMINATE);
		const n = sizeof(segments) as number;
		const firstParentCurve = expressGetAttr(
			expressGetItem(segments, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"ParentCurve",
			INDETERMINATE,
		);
		surfs = ifcGetBasisSurface(firstParentCurve);
		if (n > 1) {
			throw new Error(
				"IfcGetBasisSurface: real Python's own generated formula raises TypeError " +
					"(list * list, multiplying two plain lists together) at this exact point " +
					"(an IfcCompositeCurveOnSurface with more than one segment) -- " +
					"unconditionally, every time this branch is reached -- see rules/ifc4.ts's " +
					"own header comment (this chunk's disclosed bug 3) for the full citation.",
			);
		}
	}
	return surfs;
}

// --- the 15 assigned `calc_*` functions (exact real-Python names, file order) ---

export function calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots(self: EntityInstance): unknown {
	const knots = expressGetAttr(self, "Knots", INDETERMINATE);
	return sizeof(knots);
}

export function calc_IfcBSplineSurface_UUpper(self: EntityInstance): unknown {
	const controlpointslist = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	return (sizeof(controlpointslist) as number) - 1;
}

export function calc_IfcBSplineSurface_VUpper(self: EntityInstance): unknown {
	const controlpointslist = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	const firstRow = expressGetItem(controlpointslist, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	return (sizeof(firstRow) as number) - 1;
}

export function calc_IfcBSplineSurface_ControlPoints(self: EntityInstance): unknown {
	const controlpointslist = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	const uupper = expressGetAttr(self, "UUpper", INDETERMINATE) as number;
	const vupper = expressGetAttr(self, "VUpper", INDETERMINATE) as number;
	return ifcMakeArrayOfArray(controlpointslist, 0, uupper, 0, vupper);
}

export function calc_IfcBSplineSurfaceWithKnots_KnotVUpper(self: EntityInstance): unknown {
	const vknots = expressGetAttr(self, "VKnots", INDETERMINATE);
	return sizeof(vknots);
}

export function calc_IfcBSplineSurfaceWithKnots_KnotUUpper(self: EntityInstance): unknown {
	const uknots = expressGetAttr(self, "UKnots", INDETERMINATE);
	return sizeof(uknots);
}

export function calc_IfcCartesianPointList_Dim(self: EntityInstance): unknown {
	return ifcPointListDim(self);
}

export function calc_IfcCompositeCurve_NSegments(self: EntityInstance): unknown {
	const segments = expressGetAttr(self, "Segments", INDETERMINATE);
	return sizeof(segments);
}

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

export function calc_IfcCompositeCurveOnSurface_BasisSurface(self: EntityInstance): unknown {
	return ifcGetBasisSurface(self);
}

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

export function calc_IfcDerivedUnit_Dimensions(self: EntityInstance): unknown {
	const elements = expressGetAttr(self, "Elements", INDETERMINATE);
	return ifcDeriveDimensionalExponents(elements);
}

export function calc_IfcEdgeLoop_Ne(self: EntityInstance): unknown {
	const edgelist = expressGetAttr(self, "EdgeList", INDETERMINATE);
	return sizeof(edgelist);
}

registerSchemaCalcFunctions("IFC4", {
	"IfcBSplineCurveWithKnots.UpperIndexOnKnots": calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots,
	"IfcBSplineSurface.UUpper": calc_IfcBSplineSurface_UUpper,
	"IfcBSplineSurface.VUpper": calc_IfcBSplineSurface_VUpper,
	"IfcBSplineSurface.ControlPoints": calc_IfcBSplineSurface_ControlPoints,
	"IfcBSplineSurfaceWithKnots.KnotVUpper": calc_IfcBSplineSurfaceWithKnots_KnotVUpper,
	"IfcBSplineSurfaceWithKnots.KnotUUpper": calc_IfcBSplineSurfaceWithKnots_KnotUUpper,
	"IfcCartesianPointList.Dim": calc_IfcCartesianPointList_Dim,
	"IfcCompositeCurve.NSegments": calc_IfcCompositeCurve_NSegments,
	"IfcCompositeCurve.ClosedCurve": calc_IfcCompositeCurve_ClosedCurve,
	"IfcCompositeCurveOnSurface.BasisSurface": calc_IfcCompositeCurveOnSurface_BasisSurface,
	"IfcCompositeCurveSegment.Dim": calc_IfcCompositeCurveSegment_Dim,
	"IfcCsgPrimitive3D.Dim": calc_IfcCsgPrimitive3D_Dim,
	"IfcCurve.Dim": calc_IfcCurve_Dim,
	"IfcDerivedUnit.Dimensions": calc_IfcDerivedUnit_Dimensions,
	"IfcEdgeLoop.Ne": calc_IfcEdgeLoop_Ne,
});
