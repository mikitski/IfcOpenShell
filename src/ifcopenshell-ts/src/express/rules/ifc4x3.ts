// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-2, IFC4X3's first chunk (planning/ifcopenshell-ts/70-express-rules-plan.md
// §4, and its own 2026-09-23 correction note in §3): the FIRST 15 of IFC4X3_ADD2's 60
// `calc_*` (DERIVE) functions from
// `src/ifcopenshell-python/ifcopenshell/express/rules/IFC4X3_ADD2.py` -- deliberately
// `IFC4X3_ADD2.py`, NOT the base `IFC4X3.py` (65 functions) or any other revision file
// (`IFC4X3_ADD1.py`/`IFC4X3_TC1.py`) -- because this port's native core registers this
// schema's identifier as `IFC4X3_ADD2` specifically (`test/bootstrap.ts`'s own
// `SCHEMA_IDENTIFIERS` map, confirmed directly, see also this file's own "dispatch
// registry key" section below). `grep -c "^def calc_" IFC4X3_ADD2.py` confirmed 60, not
// 65, before porting. Real file order, line numbers re-verified directly against that
// file before porting (all 15 matched exactly, as given by this chunk's own dispatch:
// 5779/5811/5875/5910/5914/5944/5948/5952/5956/6008/6012/6186/6199/6555/6568):
//
//   calc_IfcAxis1Placement_Z, calc_IfcAxis2Placement2D_P, calc_IfcAxis2Placement3D_P,
//   calc_IfcBSplineCurve_UpperIndexOnControlPoints, calc_IfcBSplineCurve_ControlPoints,
//   calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots, calc_IfcBSplineSurface_UUpper,
//   calc_IfcBSplineSurface_VUpper, calc_IfcBSplineSurface_ControlPoints,
//   calc_IfcBSplineSurfaceWithKnots_KnotVUpper, calc_IfcBSplineSurfaceWithKnots_KnotUUpper,
//   calc_IfcBooleanResult_Dim, calc_IfcBoundingBox_Dim, calc_IfcCartesianPointList_Dim,
//   calc_IfcCartesianTransformationOperator_Scl
//
// **All 15 SHARE A NAME with an already-ported `rules/ifc4.ts` function** (this port's
// primary reuse/diff reference, per this chunk's own task brief) -- each independently
// diffed directly against BOTH real Python sources (`IFC4.py`/`IFC4X3_ADD2.py`) AND
// `ifc4.ts`'s own already-shipped port, not assumed from name overlap alone:
//
// - `IfcCrossProduct`, `IfcDotProduct`, `IfcOrthogonalComplement`, `IfcFirstProjAxis`,
//   `IfcBuildAxes`, `IfcBuild2Axes`, `IfcListToArray`, `IfcMakeArrayOfArray`,
//   `calc_IfcDirection_Dim`, `calc_IfcVector_Dim`, `calc_IfcSolidModel_Dim`, and all 15
//   of this chunk's own assigned `calc_*` bodies themselves: BYTE-IDENTICAL to `IFC4.py`
//   (confirmed by direct `diff`, function by function, not a name-overlap assumption;
//   `IfcSecondProjAxis`/`IfcBaseAxis` are ALSO byte-identical to `IFC4.py`, but not
//   ported here at all -- see this file's own "10 shared EXPRESS library helper
//   functions" section below for why).
// - `IfcNormalise`, `IfcScalarTimesVector`, `IfcVectorDifference`, `IfcPointListDim`:
//   identical EXCEPT for the real EXPRESS/schema-namespace string embedded in a
//   `typeof(...)` membership check (`'ifc4x3_add2.ifcvector'` / `'ifc4x3_add2.
//   ifccartesianpointlist2d'` / `'ifc4x3_add2.ifccartesianpointlist3d'`, vs. `IFC4.py`'s
//   own `'ifc4.ifcvector'` / `'ifc4.ifccartesianpointlist2d'` / `'ifc4.
//   ifccartesianpointlist3d'`) -- exactly the kind of genuine, schema-scoped difference
//   this chunk's own task brief anticipated. Ported below using the `'ifc4x3_add2.*'`
//   spelling, matching `runtimeShim.ts`'s own `typeOf()`, which lower-cases the REAL,
//   registered schema identifier a given instance actually belongs to
//   (`startDeclaration.schema().name().toLowerCase()` -- `ifc4x3_add2`, not `ifc4x3`)
//   into its returned set -- confirmed both by reading `typeOf`'s own implementation
//   AND empirically, against the real built addon (a scratch `IfcCartesianPoint` on an
//   `IFC4X3_ADD2`-schema file: `pt.declaration().schema().name()` returns the literal
//   string `"IFC4X3_ADD2"`).
//
// **The one function this port's assigned-15 list does NOT include that IFC4's own
// first chunk did: `calc_IfcCartesianPoint_Dim`.** Confirmed directly, not a porting
// omission: IFC4X3_ADD2 has no such function at all (`grep -n "^def calc_IfcCartesianPoint"
// IFC4X3_ADD2.py` -- no match; only `IfcCartesianPoint_CP2Dor3D`, a WHERE-rule class,
// out of Phase EX-2's scope). This is real schema evolution, exactly as this chunk's
// own dispatch brief anticipated: ADD2 consolidated the base schema's own per-subtype
// `IfcCartesianPoint.Dim`/`IfcPointOnCurve.Dim`/`IfcPointOnSurface.Dim` DERIVE formulas
// into one abstract-supertype formula, `calc_IfcPoint_Dim` (`IFC4X3_ADD2.py` line 9831,
// dispatching via its own new `IfcPointDim` helper, line 13742) -- NOT one of this
// chunk's own assigned 15, genuinely still unported after this chunk. `IfcCartesianPoint
// .Dim` therefore still throws "has no attribute 'Dim'" on IFC4X3 after this chunk (the
// DERIVE-dispatch supertype walk reaches `IfcPoint` looking for `calc_IfcPoint_Dim`,
// finds nothing registered, falls through) -- unaffected by this chunk, matching
// `editSurveyPoint.ts`'s own header comment, which already disclosed this exact
// still-blocked state and is left as-is (not touched by this chunk, since its own
// literal claim -- "still throws on IFC4X3 until a future chunk ports the same DERIVE
// formula for that schema" -- remains true; the FORMULA it means, `IfcCartesianPoint
// .Dim`, genuinely does not exist as a separate function on IFC4X3_ADD2 at all, so no
// "future chunk" can ever port it verbatim -- a future chunk would have to port
// `calc_IfcPoint_Dim` instead, a materially different fact this chunk does not attempt
// to correct, being out of this chunk's own narrow scope).
//
// **Dispatch registry key: `"IFC4X3_ADD2"`, NOT `"IFC4X3"` -- verified directly, not
// assumed from this chunk's own dispatching task brief (which suggested `"IFC4X3"`).**
// `dispatch.ts`'s `resolveDerivedAttribute` keys its per-schema registry lookup off
// `instance.declaration().schema().name()` -- the exact, raw, C++-core-registered
// identifier, with NO normalization step of any kind (confirmed by reading
// `resolveDerivedAttribute`'s own one-line schema-identifier extraction, and by reading
// the generated `schema_definition.name()` binding, a bare pass-through with no string
// transformation). `test/bootstrap.ts`'s own `SCHEMA_IDENTIFIERS` map and
// `attributeCache.ts`'s own header comment both independently confirm this port's
// IFC4X3 build registers the schema as `"IFC4X3_ADD2"`, and `runtimeShim.ts`'s
// `typeOf()` independently confirms the same fact a THIRD way (it lower-cases this
// exact same `declaration().schema().name()` value for its own membership-set keys,
// which is why this chunk's own `'ifc4x3_add2.ifcvector'` namespace strings above are
// spelled that way, not `'ifc4x3.ifcvector'`). Empirically re-verified directly against
// the real built addon before writing this file (not merely inferred from source):
// `template.create({ schemaIdentifier: "IFC4X3_ADD2" }).createEntity("IfcCartesianPoint",
// ...).declaration().schema().name()` returns the literal string `"IFC4X3_ADD2"`, while
// that same file's own `.schema` getter (the coarser, normalized property
// `bootstrap.ts`'s own `Schema` union/`AVAILABLE_SCHEMAS` type uses) returns `"IFC4X3"`.
// Registering this chunk's functions under the coarser `"IFC4X3"` string, as suggested,
// would silently make EVERY function in this file permanently unreachable from any real
// `EntityInstance.get()` call (a real instance's own `declaration().schema().name()` is
// always `"IFC4X3_ADD2"`, never `"IFC4X3"`, so `schemaRegistries.get("IFC4X3")` would
// always miss) -- confirmed this is not the case by this chunk's own end-to-end test
// (`test/express/rules/ifc4x3.test.ts`), which reads a DERIVED attribute through the
// normal `EntityInstance` property-access path on a real `createTestFile("IFC4X3")`
// fixture and asserts it resolves correctly.
//
// **The 10 shared EXPRESS library helper functions this chunk's own 15 assigned
// functions ACTUALLY, TRANSITIVELY need** -- a real dependency-closure computation done
// by tracing every one of the 15 assigned functions' own call graph directly (`grep`-
// verified, not assumed from IFC2X3/IFC4 chunk 1's own equivalent framing): `IfcNormalise`,
// `IfcCrossProduct`, `IfcDotProduct`, `IfcOrthogonalComplement`, `IfcFirstProjAxis`,
// `IfcScalarTimesVector`, `IfcVectorDifference`, `IfcBuildAxes`, `IfcBuild2Axes`,
// `IfcListToArray`. **Deliberately NOT ported here, unlike IFC2X3/IFC4's own chunk 1**:
// `IfcBaseAxis`/`IfcSecondProjAxis`. Both are real EXPRESS-library functions in
// `IFC4X3_ADD2.py` too, but neither is reachable from ANY of this chunk's own 15
// assigned functions' call graphs -- `IfcBaseAxis` is only ever called by
// `calc_IfcCartesianTransformationOperator2D_U`/`_3D_U` (and `IfcSecondProjAxis` is only
// ever called by `IfcBaseAxis` itself), and NEITHER of those two `calc_*` functions is
// one of this chunk's own assigned 15 (unlike IFC2X3/IFC4's own respective first
// chunks, whose own assigned-15 lists DID include `calc_IfcCartesianTransformationOperator2D_U`).
// Porting them anyway would have been unnecessary dead code within this module, not
// scope-appropriate faithfulness -- confirmed genuinely unreachable, not merely
// "unused for now," before this file's final draft (an earlier draft of this file
// mistakenly ported both, by blindly copying IFC2X3/IFC4 chunk 1's own 12-helper
// closure without re-deriving it for THIS chunk's own, different, 15-function set --
// caught and corrected during this chunk's own self-review, before dispatch). PLUS 2
// genuinely new ones this chunk's own assigned functions need that IFC2X3/IFC4 chunk 1
// did NOT (`IfcMakeArrayOfArray`, for `calc_IfcBSplineSurface_ControlPoints`;
// `IfcPointListDim`, for `calc_IfcCartesianPointList_Dim` -- both genuinely
// IFC4-and-later-only, confirmed absent from `IFC2X3.py` entirely, and both already
// ported once before, by IFC4's own SECOND chunk, not its first) -- ported fresh here
// rather than imported, for the same schema-scoped-scratch-entity reason `ifc4.ts`'s own
// header comment already establishes for its own equivalent helpers (`IfcPointListDim`'s
// `typeof(pointlist)` check needs THIS file's own `IFC4X3_ADD2`-scoped scratch-entity
// machinery to be meaningful for a real IFC4X3 instance) -- see `rules/ifc4.ts`'s own
// header comment for the full rationale, not repeated in full here.
//
// **Real, disclosed Python bugs -- all inherited, none genuinely new to this chunk**:
//
// 1. `IfcFirstProjAxis`'s dead-`else`-branch tuple-vs-list comparison bug -- shared with
//    IFC2X3's own disclosed bug 1 AND IFC4's own disclosed bug 1 (chunk 1's header
//    comments, both). Confirmed present, verbatim, in `IFC4X3_ADD2.py` too (byte-
//    identical function body, independently re-checked at its own real line, not
//    inferred from the byte-identical diff alone). Ported the same way: a reference
//    (`!==`) comparison against a freshly-allocated array literal.
//
// 2. `IfcListToArray(lis, low, u)`'s cyclic left-rotation for `low === 0` -- shared with
//    IFC2X3's own disclosed bug 3 AND IFC4's own disclosed bug 3. Confirmed present,
//    verbatim, at its own real `IFC4X3_ADD2.py` line (exactly how this chunk's own
//    `calc_IfcBSplineCurve_ControlPoints` calls it, `IfcListToArray(ControlPointsList, 0,
//    UpperIndexOnControlPoints)`). Ported the same way: a direct structural translation
//    reproducing the rotation.
//
// 3. `IfcMakeArrayOfArray`'s `res = [IfcListToArray(...)] * u1 - low1 + 1` operator-
//    precedence bug (`list * int` then `- int`, i.e. a `list` MINUS an `int`, which
//    Python's `list` defines no `__sub__` for) -- shared with IFC4's own SECOND chunk's
//    disclosed bug 1 (`rules/ifc4.ts`'s own second-chunk header comment) -- NOT one of
//    IFC2X3's own 3 disclosed bugs, since `IfcMakeArrayOfArray` doesn't exist in
//    `IFC2X3.py` at all. Confirmed present, verbatim, at its own real `IFC4X3_ADD2.py`
//    line (13674) -- byte-identical to `IFC4.py`'s own version. **Net effect, unchanged
//    from IFC4: `calc_IfcBSplineSurface_ControlPoints` can NEVER successfully compute a
//    value in real Python, for ANY structurally valid `IfcBSplineSurface`** -- ported as
//    an equivalent thrown `Error` at the same point, pinned with a dedicated test.
//
// (`IfcBaseAxis`'s own two tuple-mutation crashes -- IFC2X3's own disclosed bug 2/2b,
// IFC4's own disclosed bug 2/2b -- are NOT re-disclosed here: that function is not
// ported in this chunk at all, see above. `calc_IfcCartesianTransformationOperator2D_U`/
// `_3D_U` remain genuinely unported for IFC4X3 after this chunk, same as before it.)
//
// **The same pre-existing, inherited (not newly introduced) `INDETERMINATE`-poisoning-
// through-plain-JS-operators limitation `runtimeShim.ts`'s own header comment already
// flags** applies here identically -- not repeated in full, see `rules/ifc2x3.ts`'s own
// header comment for the complete disclosure. Every arithmetic/comparison expression
// below is a direct, structural port of the real Python expression it mirrors.
//
// **Cascading-test check performed, no functional cascading fix required.** Checked
// every existing "still throws for IFC4X3" test this project's own established
// precedent flagged as a recurring risk (`editSurveyPoint`, `guessType`
// (`util/representation.ts`), `shapeBuilder`, `addRailingRepresentation`,
// `editNamedUnit`) plus a broader repo-wide grep for this chunk's own 15 attribute
// names against every `IFC4X3`-mentioning test file. None of them read a DERIVE
// attribute this chunk newly resolves: `editSurveyPoint`/`shapeBuilder`/
// `addRailingRepresentation` are all still blocked by `IfcCurve.Dim`/`IfcSurface.Dim`/
// `IfcPlacement.Dim`/`IfcCartesianPoint.Dim` (none of which this chunk ports -- see
// above), and `editNamedUnit`/`test/express/rules/ifc2x3.test.ts`'s own DERIVE-dispatch-
// wiring test both key off `IfcSIUnit.Dimensions` (also not one of this chunk's own
// 15). Their own prose ("no `rules/ifc4x3.ts` module exists yet") is now technically
// stale (this file now exists), but their asserted, OBSERVABLE behavior is unchanged --
// re-verified directly against the real built addon, not assumed -- since `dispatch.ts`'s
// own per-schema registry lookup still misses for the specific attribute names those
// tests each exercise. A small, disclosed prose-only touch-up (not a logic/assertion
// change) is applied to each, matching this project's own documentation-accuracy
// discipline, without altering any test's own asserted behavior.

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
// header comment already establishes and justifies in full; not repeated here.
// Schema-scoped to the real, registered `IFC4X3_ADD2` identifier (NOT the coarser
// `"IFC4X3"` -- see this file's own header comment, "dispatch registry key" section) --
// deliberately NOT shared with `rules/ifc2x3.ts`'s/`rules/ifc4.ts`'s own separate
// `scratchFile` singletons, since a scratch `IfcDirection`/`IfcVector` must be
// constructed against the SAME schema as the real instance a `calc_*` formula is being
// evaluated for (`typeOf(...)` below reads back that schema's own lower-cased
// identifier).
import * as template from "../../template";

let scratchFile: IfcFile | undefined;
function getScratchFile(): IfcFile {
	if (!scratchFile) {
		scratchFile = template.create({ schemaIdentifier: "IFC4X3_ADD2" });
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

/** Python: `IfcNormalise` (`IFC4X3_ADD2.py`) -- see this file's own header comment on the `'ifc4x3_add2.ifcvector'` namespace-string difference vs. `IFC4.py`'s own `'ifc4.ifcvector'`. */
function ifcNormalise(arg: unknown): EntityInstance | null {
	const v = ifcDirection([1.0, 0.0]);
	const vec = ifcVector(ifcDirection([1.0, 0.0]), 1.0);
	let result: EntityInstance = v;
	if (!exists(arg)) return null;
	const ndim = expressGetAttr(arg, "Dim", INDETERMINATE) as number | Indeterminate;
	if (typeOf(arg as EntityInstance).has("ifc4x3_add2.ifcvector")) {
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
		if (typeOf(arg as EntityInstance).has("ifc4x3_add2.ifcvector")) {
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

/** Python: `IfcOrthogonalComplement` (`IFC4X3_ADD2.py`) -- byte-identical to `IFC4.py`'s own. */
function ifcOrthogonalComplement(vec: unknown): EntityInstance | null {
	if (!exists(vec) || expressGetAttr(vec, "Dim", INDETERMINATE) !== 2) return null;
	const ratios = expressGetAttr(vec, "DirectionRatios", INDETERMINATE);
	return ifcDirection([
		-(expressGetItem(ratios, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number),
		expressGetItem(ratios, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number,
	]);
}

/** Python: `IfcCrossProduct` (`IFC4X3_ADD2.py`) -- byte-identical to `IFC4.py`'s own. */
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

/** Python: `IfcDotProduct` (`IFC4X3_ADD2.py`) -- byte-identical to `IFC4.py`'s own. */
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

/** Python: `IfcScalarTimesVector` (`IFC4X3_ADD2.py`) -- see this file's own header comment on the `'ifc4x3_add2.ifcvector'` namespace-string difference vs. `IFC4.py`'s own `'ifc4.ifcvector'`. */
function ifcScalarTimesVector(scalar: unknown, vec: unknown): EntityInstance | null {
	if (!exists(scalar) || !exists(vec)) return null;
	let v: unknown;
	let mag: number;
	if (typeOf(vec as EntityInstance).has("ifc4x3_add2.ifcvector")) {
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

/** Python: `IfcVectorDifference` (`IFC4X3_ADD2.py`) -- see this file's own header comment on the `'ifc4x3_add2.ifcvector'` namespace-string difference vs. `IFC4.py`'s own `'ifc4.ifcvector'`. */
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
	if (typeOf(arg1 as EntityInstance).has("ifc4x3_add2.ifcvector")) {
		mag1 = expressGetAttr(arg1, "Magnitude", INDETERMINATE) as number;
		vec1 = expressGetAttr(arg1, "Orientation", INDETERMINATE);
	} else {
		mag1 = 1.0;
		vec1 = arg1;
	}
	let mag2: number;
	let vec2: unknown;
	if (typeOf(arg2 as EntityInstance).has("ifc4x3_add2.ifcvector")) {
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

/** Python: `IfcFirstProjAxis` (`IFC4X3_ADD2.py`) -- byte-identical to `IFC4.py`'s own; see this file's own header comment, bug 1. */
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

/** Python: `IfcBuildAxes` (`IFC4X3_ADD2.py`) -- byte-identical to `IFC4.py`'s own. */
function ifcBuildAxes(axis: unknown, refdirection: unknown): unknown[] {
	const d1 = nvl(ifcNormalise(axis), ifcDirection([0.0, 0.0, 1.0]));
	const d2 = ifcFirstProjAxis(d1, refdirection);
	return [d2, expressGetAttr(ifcNormalise(ifcCrossProduct(d1, d2)), "Orientation", INDETERMINATE), d1];
}

/** Python: `IfcBuild2Axes` (`IFC4X3_ADD2.py`) -- byte-identical to `IFC4.py`'s own. */
function ifcBuild2Axes(refdirection: unknown): unknown[] {
	const d = nvl(ifcNormalise(refdirection), ifcDirection([1.0, 0.0]));
	return [d, ifcOrthogonalComplement(d)];
}

/**
 * Python: `IfcListToArray` (`IFC4X3_ADD2.py`) -- byte-identical to `IFC4.py`'s own; see
 * this file's own header comment, disclosed bug #2: for `low === 0` (exactly how
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

/**
 * Python: `IfcMakeArrayOfArray` (`IFC4X3_ADD2.py` line 13669) -- byte-identical to
 * `IFC4.py`'s own; see this file's own header comment, disclosed bug #3 (shared with
 * `rules/ifc4.ts`'s own second-chunk disclosed bug 1, genuinely absent from IFC2X3):
 * `res = [IfcListToArray(...)] * u1 - low1 + 1` is `(list * int) - int` in real Python,
 * which unconditionally raises `TypeError: unsupported operand type(s) for -: 'list'
 * and 'int'` -- Python lists define no `__sub__`, and none of this function's own
 * preceding guards can prevent the line from being reached with a real list. Net
 * effect: `calc_IfcBSplineSurface_ControlPoints` (this chunk's own caller, below) can
 * NEVER successfully compute a value in real Python, for ANY structurally valid
 * `IfcBSplineSurface`. Ported as an equivalent thrown `Error` at the same point,
 * pinned with a dedicated test.
 */
function ifcMakeArrayOfArray(lis: unknown, low1: number, u1: number, low2: number, u2: number): unknown[] | null {
	if (u1 - low1 + 1 !== (sizeof(lis) as number)) return null;
	const firstRow = expressGetItem(lis, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	if (u2 - low2 + 1 !== (sizeof(firstRow) as number)) return null;
	throw new Error(
		"IfcMakeArrayOfArray: real Python's own generated formula raises " +
			"TypeError(\"unsupported operand type(s) for -: 'list' and 'int'\") at this exact " +
			"point (res = [IfcListToArray(...)] * u1 - low1 + 1, a list-int operator-precedence " +
			"bug) -- unconditionally, for any structurally valid input -- see rules/ifc4x3.ts's " +
			"own header comment, disclosed bug #3, for the full citation.",
	);
}

/**
 * Python: `IfcPointListDim` (`IFC4X3_ADD2.py` line 13753) -- see this file's own header
 * comment on the `'ifc4x3_add2.ifccartesianpointlist2d'`/`'ifc4x3_add2.
 * ifccartesianpointlist3d'` namespace-string difference vs. `IFC4.py`'s own `'ifc4.*'`
 * spellings. Used by `calc_IfcCartesianPointList_Dim` below.
 */
function ifcPointListDim(pointlist: unknown): number | null {
	if (typeOf(pointlist as EntityInstance).has("ifc4x3_add2.ifccartesianpointlist2d")) return 2;
	if (typeOf(pointlist as EntityInstance).has("ifc4x3_add2.ifccartesianpointlist3d")) return 3;
	return null;
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

export function calc_IfcBSplineCurve_UpperIndexOnControlPoints(self: EntityInstance): unknown {
	const controlpointslist = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	return (sizeof(controlpointslist) as number) - 1;
}

export function calc_IfcBSplineCurve_ControlPoints(self: EntityInstance): unknown {
	const controlpointslist = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	const upperindexoncontrolpoints = expressGetAttr(self, "UpperIndexOnControlPoints", INDETERMINATE) as number;
	return ifcListToArray(controlpointslist, 0, upperindexoncontrolpoints);
}

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

export function calc_IfcBooleanResult_Dim(self: EntityInstance): unknown {
	const firstoperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	return expressGetAttr(firstoperand, "Dim", INDETERMINATE);
}

export function calc_IfcBoundingBox_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcCartesianPointList_Dim(self: EntityInstance): unknown {
	return ifcPointListDim(self);
}

export function calc_IfcCartesianTransformationOperator_Scl(self: EntityInstance): unknown {
	const scale = expressGetAttr(self, "Scale", INDETERMINATE);
	return nvl(scale, 1.0);
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

registerSchemaCalcFunctions("IFC4X3_ADD2", {
	"IfcAxis1Placement.Z": calc_IfcAxis1Placement_Z,
	"IfcAxis2Placement2D.P": calc_IfcAxis2Placement2D_P,
	"IfcAxis2Placement3D.P": calc_IfcAxis2Placement3D_P,
	"IfcBSplineCurve.UpperIndexOnControlPoints": calc_IfcBSplineCurve_UpperIndexOnControlPoints,
	"IfcBSplineCurve.ControlPoints": calc_IfcBSplineCurve_ControlPoints,
	"IfcBSplineCurveWithKnots.UpperIndexOnKnots": calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots,
	"IfcBSplineSurface.UUpper": calc_IfcBSplineSurface_UUpper,
	"IfcBSplineSurface.VUpper": calc_IfcBSplineSurface_VUpper,
	"IfcBSplineSurface.ControlPoints": calc_IfcBSplineSurface_ControlPoints,
	"IfcBSplineSurfaceWithKnots.KnotVUpper": calc_IfcBSplineSurfaceWithKnots_KnotVUpper,
	"IfcBSplineSurfaceWithKnots.KnotUUpper": calc_IfcBSplineSurfaceWithKnots_KnotUUpper,
	"IfcBooleanResult.Dim": calc_IfcBooleanResult_Dim,
	"IfcBoundingBox.Dim": calc_IfcBoundingBox_Dim,
	"IfcCartesianPointList.Dim": calc_IfcCartesianPointList_Dim,
	"IfcCartesianTransformationOperator.Scl": calc_IfcCartesianTransformationOperator_Scl,
	"IfcDirection.Dim": calc_IfcDirection_Dim,
	"IfcVector.Dim": calc_IfcVector_Dim,
	"IfcSolidModel.Dim": calc_IfcSolidModel_Dim,
});

// =============================================================================
// Phase EX-2, IFC4X3's second chunk (planning/ifcopenshell-ts/70-express-rules-plan.md
// §4): 15 more of IFC4X3_ADD2's 60 `calc_*` (DERIVE) functions from
// `IFC4X3_ADD2.py`, in real file order (line numbers re-verified directly against
// that file before porting, not just trusted from the task brief that dispatched
// this chunk -- all 15 matched exactly: 6572/6603/6616/6657/6681/6685/6910/6914/
// 6929/7303/7336/7441/7822/8248/8673):
//
//   calc_IfcCartesianTransformationOperator_Dim, calc_IfcCartesianTransformationOperator2D_U,
//   calc_IfcCartesianTransformationOperator2DnonUniform_Scl2, calc_IfcCartesianTransformationOperator3D_U,
//   calc_IfcCartesianTransformationOperator3DnonUniform_Scl2, calc_IfcCartesianTransformationOperator3DnonUniform_Scl3,
//   calc_IfcCompositeCurve_NSegments, calc_IfcCompositeCurve_ClosedCurve,
//   calc_IfcCompositeCurveOnSurface_BasisSurface, calc_IfcCsgPrimitive3D_Dim,
//   calc_IfcCurve_Dim, calc_IfcDerivedUnit_Dimensions, calc_IfcEdgeLoop_Ne,
//   calc_IfcFaceBasedSurfaceModel_Dim, calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem
//
// **`calc_IfcDirection_Dim` (`IFC4X3_ADD2.py` line 7455), sitting right between
// this chunk's own #12 and #13 in real file order, is deliberately EXCLUDED** --
// already ported in this file's own FIRST chunk (one of its "3 minimal, necessary,
// extra functions"), not re-ported here. Confirmed still registered under the same
// key from this chunk's own tests (an end-to-end regression, see the test file).
//
// **All 15 of this chunk's own assigned `calc_*` function BODIES are BYTE-IDENTICAL
// to `IFC4.py`'s own same-named versions** (confirmed by direct `diff`, function by
// function, not a name-overlap assumption -- verified with a real `diff` against
// both `IFC4X3_ADD2.py` and `IFC4.py` before writing this file, not merely read and
// eyeballed). All 15 also exist, byte-identical, in `IFC2X3.py` too, EXCEPT
// `calc_IfcCompositeCurveOnSurface_BasisSurface` (`IfcCompositeCurveOnSurface`/
// `IfcPcurve`/`IfcSurfaceCurve` all postdate IFC2X3 entirely -- confirmed absent,
// matching `ifc4.ts`'s own chunk-2 header comment's identical finding for the same
// function) -- cross-referenced against `rules/ifc2x3.ts`'s own chunk-2/3
// disclosures throughout, not re-derived from scratch.
//
// **The dependency closure re-derived from scratch for THIS chunk's own 15
// functions** (per this chunk's own task brief's explicit instruction -- not
// assumed to carry over from IFC2X3's/IFC4's own equivalent chunks' closures):
//
// - `IfcBaseAxis` (`IFC4X3_ADD2.py` line 13176) and `IfcSecondProjAxis` (line
//   13821) are BOTH now genuinely needed -- `calc_IfcCartesianTransformationOperator2D_U`/
//   `_3D_U` (this chunk's own #2/#4) call directly into `IfcBaseAxis`, and
//   `IfcBaseAxis`'s own `dim === 3` branch calls `IfcSecondProjAxis`. This chunk's
//   own FIRST chunk explicitly did NOT port either (neither was reachable from that
//   chunk's own 15 functions) -- both are ported fresh here. Both confirmed
//   BYTE-IDENTICAL to `IFC4.py`'s own versions (direct `diff`), which are in turn
//   byte-identical to IFC2X3's own (`rules/ifc4.ts`'s own chunk-1 header comment) --
//   so this chunk's own `ifcBaseAxis`/`ifcSecondProjAxis` mirror `rules/ifc4.ts`'s
//   own chunk-1 implementations directly, including preserving the SAME 2 disclosed
//   Python bugs (see below), NOT re-derived independently.
// - `IfcGetBasisSurface` (`IFC4X3_ADD2.py` line 13628, delegated to by
//   `calc_IfcCompositeCurveOnSurface_BasisSurface`) and `IfcDeriveDimensionalExponents`
//   (line 13516, delegated to by `calc_IfcDerivedUnit_Dimensions`) are also newly
//   needed. `IfcDeriveDimensionalExponents` is BYTE-IDENTICAL to `IFC4.py`'s own
//   version (confirmed by direct `diff`) -- ported fresh here (not imported from
//   `rules/ifc4.ts`) since it needs THIS file's own `getScratchFile()`, scoped to
//   the `IFC4X3_ADD2` schema, same reason this file's own first chunk's
//   `ifcDirection`/`ifcVector` aren't shared with `rules/ifc4.ts` either.
//   `IfcGetBasisSurface` is GENUINELY DIFFERENT from `IFC4.py`'s own version --
//   see below, its own dedicated writeup.
// - A new `ifcCurveDim` (delegated to by `calc_IfcCurve_Dim`, this chunk's own #11)
//   is GENUINELY DIFFERENT from both `IFC4.py`'s and `IFC2X3.py`'s own versions --
//   see below, its own dedicated writeup.
// - `IfcNormalise`/`IfcCrossProduct`/`IfcDotProduct`/`IfcOrthogonalComplement`/
//   `IfcFirstProjAxis`/`IfcScalarTimesVector`/`IfcVectorDifference`/`IfcBuildAxes`/
//   `IfcBuild2Axes`/`IfcListToArray` are ALL already ported in this file's own first
//   chunk and reused unchanged here (no new call sites need a different version) --
//   re-confirmed by direct `diff` against `IFC4X3_ADD2.py` before reuse, not merely
//   assumed still current (`IfcNormalise`/`IfcScalarTimesVector`/`IfcVectorDifference`
//   still carry the same `'ifc4x3_add2.ifcvector'`-namespace-string difference vs.
//   `IFC4.py` this file's own first-chunk header comment already disclosed; all
//   others remain byte-identical to `IFC4.py`).
//
// **`IfcCurveDim` (`IFC4X3_ADD2.py` line 13471) -- GENUINELY DIFFERENT from BOTH
// `IFC4.py`'s own version (10 branches: Line/Conic/Polyline/TrimmedCurve/
// CompositeCurve/BSplineCurve/OffsetCurve2D/OffsetCurve3D/Pcurve/IndexedPolyCurve)
// AND `IFC2X3.py`'s own (8 branches, no Pcurve/IndexedPolyCurve at all).** ADD2
// adds 6 MORE branches on top of IFC4's own 10, for curve types that postdate IFC4
// entirely: `IfcGradientCurve`/`IfcSegmentedReferenceCurve` (both constant `3`),
// `IfcOffsetCurveByDistances` (constant `3`), `IfcCurveSegment2D` (constant `2` --
// see its own dedicated finding below), `IfcPolynomialCurve` (a 2-vs-3 branch on
// `CoefficientsZ`/`Position.Dim`), and `IfcSpiral` (`Position.Dim`, an ABSTRACT
// entity -- confirmed via a real built addon, `IfcSpiral.is_abstract() === True`,
// so this branch matches any of its real concrete subtypes, e.g. `IfcClothoid`).
// Ported fresh below as a completely new, IFC4X3_ADD2-scoped `ifcCurveDim`, all 16
// branches, not reusing or extending `rules/ifc4.ts`'s own 10-branch copy. Same
// disclosed `!exists(curve)` upstream guard fix `rules/ifc2x3.ts`'s/`rules/ifc4.ts`'s
// own versions already establish (this port's `INDETERMINATE` sentinel is a plain,
// always-truthy JS `Symbol`, unlike real Python's `indeterminate_type.__bool__() ==
// False`) -- not a new fix invented here.
//
// **Genuinely new disclosed FINDING (not a crash-causing bug): `IfcCurveDim`'s own
// `'ifc4x3_add2.ifccurvesegment2d' in typeof(curve)` branch is permanently, unconditionally
// DEAD CODE.** Confirmed directly against a real built addon: `schema.declaration_by_name
// ("IfcCurveSegment2D")` raises `RuntimeError: Entity with name 'IfcCurveSegment2D' not
// found in schema 'IFC4X3_ADD2'` -- no such entity exists anywhere in the ADD2 schema, so
// `typeOf(curve)` (which only ever contains a real instance's own actual declared
// ancestor-type names) can never contain this string, and this branch's `return 2` can
// never execute for any real instance. Traced the provenance across every IFC4X3 schema
// revision this repo ships (`grep -n "ifccurvesegment2d" IFC4X3*.py`): `IfcCurveSegment2D`
// WAS a real, concrete entity as of `IFC4X3_RC1`/`RC2` (both have their own real
// `def IfcCurveSegment2D(*args, **kwargs)` convenience constructor) -- by `RC3` onward
// (RC3/RC4/TC1/ADD1/ADD2/the base `IFC4X3.py` release) the entity itself was renamed or
// consolidated away entirely (into today's `IfcCurveSegment`, one of `IfcSegment`'s
// exactly 2 concrete subtypes -- confirmed via `schema.declaration_by_name
// ("IfcSegment").as_entity().subtypes()` = `['IfcCompositeCurveSegment', 'IfcCurveSegment']`),
// but this ONE dispatch branch in the generated `IfcCurveDim` function was never
// removed, surviving unchanged all the way through to ADD2 (and the base `IFC4X3.py`
// too -- confirmed identical there as well). Ported below for full structural fidelity
// to the real generated source (same "port even genuinely unreachable branches
// faithfully" precedent this file's own first-chunk header comment already established
// for `IfcFirstProjAxis`'s dead `else`), pinned by a dedicated regression test proving
// it can never fire (not silently omitted).
//
// **`IfcGetBasisSurface` (`IFC4X3_ADD2.py` line 13628) -- GENUINELY DIFFERENT
// control-flow shape from `IFC4.py`'s own version, but the SAME 2 underlying real
// Python bugs, confirmed to have the SAME net observable effect for any real,
// schema-valid instance.** The difference: IFC4's own `Segments` attribute is typed
// `LIST OF IfcCompositeCurveSegment` (one concrete class), so `IfcGetBasisSurface`
// unconditionally recurses into `Segments[0].ParentCurve`/multiplies for `n > 1`
// with no type check at all. ADD2's own `IfcCompositeCurve.Segments` is typed `LIST
// OF IfcSegment` instead -- an ABSTRACT supertype ADD2 introduced with exactly 2
// concrete subtypes, confirmed via a real built addon:
// `schema.declaration_by_name("IfcSegment").as_entity().subtypes()` =
// `['IfcCompositeCurveSegment', 'IfcCurveSegment']` (both confirmed to still carry
// their own `ParentCurve` attribute) -- so ADD2's own generated formula gates each
// recursion/multiplication behind an explicit `'ifc4x3_add2.ifccurvesegment' in
// typeof(...)` / `'ifc4x3_add2.ifccompositecurvesegment' in typeof(...)` check
// (2 separate, structurally-duplicated `if` statements, not `elif`/`or` -- ported
// below the same way, 1:1, not collapsed into a single combined condition, matching
// this project's "port the real control flow exactly, even when a simplification
// would be behaviorally equivalent" discipline). Since these 2 checks are the
// schema's ONLY 2 concrete subtypes of the abstract `IfcSegment`, they are jointly
// exhaustive for any real, schema-valid `IfcCompositeCurveOnSurface` instance --
// meaning, empirically, this gating is always satisfied in practice, and the
// SAME 2 underlying bugs `rules/ifc4.ts`'s own chunk-2 header comment already
// disclosed fire with the SAME unconditional-in-practice frequency:
//
// 1. The `'ifc4x3_add2.ifcsurfacecurve' in typeof(c)` branch's own
//    `surfs = surfs + IfcAssociatedSurface(...)` raises `TypeError` (`list` + a
//    single `IfcSurface` value, not a list) the first time its own loop runs --
//    always, since `AssociatedGeometry` is still schema-mandatory `LIST [1:2]` on
//    ADD2 too (confirmed directly against the real built addon's own
//    `IfcSurfaceCurve.AssociatedGeometry` attribute type). Ported as an equivalent
//    thrown `Error` as soon as this branch is entered with a non-empty
//    `AssociatedGeometry` -- shares the SAME underlying bug as `rules/ifc4.ts`'s own
//    chunk-2 disclosed bug 2 (not a new bug), just reached via the same code shape.
// 2. The `'ifc4x3_add2.ifccompositecurveonsurface' in typeof(c)` branch's own `n > 1`
//    loop does `surfs = surfs * IfcGetBasisSurface(...)` -- `list * list`, also
//    unconditionally rejected by Python -- reached whenever a real
//    `IfcCompositeCurveOnSurface` has more than one segment (gated behind the same
//    2-concrete-subtype check described above, which -- per the schema fact just
//    confirmed -- always holds). Ported as an equivalent thrown `Error` at the same
//    point. Shares the SAME underlying bug as `rules/ifc4.ts`'s own chunk-2
//    disclosed bug 3 (not a new bug).
//
// `IfcAssociatedSurface` (`IFC4X3_ADD2.py` line 13172) is confirmed byte-identical
// to `IFC4.py`'s own -- not separately ported as its own TS function, same reason
// `rules/ifc4.ts`'s own chunk-2 header comment already gives: it is unreachable in
// every path bug 1 above leaves standing.
//
// **Real, disclosed Python bugs INHERITED (not newly introduced) by this chunk's
// own newly-ported `ifcBaseAxis`/`ifcSecondProjAxis`** -- shared with IFC2X3's own
// disclosed bug 2/2b AND IFC4's own disclosed bug 2/2b (both already-merged chunks'
// own header comments), confirmed present, verbatim, in `IFC4X3_ADD2.py` too (byte-
// identical function body, independently re-checked at ADD2's own real line 13176,
// not inferred from the byte-identical `diff` alone):
//
// 1. `IfcBaseAxis`'s tuple-mutation crash when `Axis1` AND `Axis2` are both set,
//    with a negative dot product against the orthogonal complement of the
//    normalised `Axis1`. Ported as an equivalent thrown `Error` at the same point.
// 1b. `IfcBaseAxis`'s SECOND, unconditional tuple-mutation crash when `Axis1` is
//    absent and `Axis2` is set (no guarding condition at all, unlike case 1 above).
//    Ported as an equivalent thrown `Error` at the same point.
//
// **No new real Python bugs found in this chunk's own 15 assigned functions
// themselves** (the CartesianTransformationOperator-family functions/`NSegments`/
// `ClosedCurve`/`CsgPrimitive3D.Dim`/`EdgeLoop.Ne`/`FaceBasedSurfaceModel.Dim`/
// `GeometricRepresentationSubContext.WorldCoordinateSystem` are all plain
// delegations/constants/comparisons with no branching of their own) -- every
// disclosed bug above lives in a shared dependency, not in one of the 15 themselves.
//
// **Genuinely new disclosed FINDING, empirically verified against the real built
// addon (not just reasoned from the dependency chain): `calc_IfcCartesianTransformationOperator_Dim`
// and MOST of `calc_IfcCurve_Dim`'s own branches currently resolve to
// `runtimeShim.INDETERMINATE` on IFC4X3, not a real number** -- a genuinely
// different, WORSE-resolved outcome than the same-named functions' own IFC4/IFC2X3
// tests, which get real numbers, because this port's IFC4X3 chunks have not yet
// ported the specific DERIVE dependency each one bottoms out on:
// `calc_IfcCartesianTransformationOperator_Dim` reads `LocalOrigin.Dim`, and
// `LocalOrigin` is ALWAYS a plain `IfcCartesianPoint` (confirmed via the real
// schema) -- but IFC4X3_ADD2 consolidated `IfcCartesianPoint.Dim` into
// `calc_IfcPoint_Dim` (an abstract-supertype formula, `IFC4X3_ADD2.py` line 9831),
// which is NOT one of either of this file's own 2 chunks' 30 functions and remains
// genuinely unported -- confirmed directly: `expressGetAttr`'s own `try/catch`
// (`runtimeShim.ts`) silently swallows the resulting "has no attribute 'Dim'" throw
// and returns the caller's own `INDETERMINATE` default, so
// `calc_IfcCartesianTransformationOperator_Dim` never throws, it just silently
// resolves to `INDETERMINATE` for every real instance. The SAME silent-fallback
// shape hits most of `ifcCurveDim`'s own branches too, EMPIRICALLY CONFIRMED against
// the real built addon for every branch (not assumed): `IfcLine` (`Pnt.Dim`),
// `IfcConic`/`IfcSpiral` (`Position.Dim`, itself blocked on the ALSO-still-unported
// `calc_IfcPlacement_Dim`), `IfcPolyline` (`Points[0].Dim`), `IfcCompositeCurve`
// (`Segments[0].Dim`, blocked on the ALSO-still-unported `calc_IfcCompositeCurveSegment_Dim`
// -- ported for IFC4 in ITS OWN chunk 2, but not one of either of THIS file's own 2
// chunks), and `IfcBSplineCurve` (`ControlPointsList[0].Dim`) ALL resolve to
// `INDETERMINATE`, empirically confirmed one by one. The ONLY `ifcCurveDim` branches
// that resolve to a REAL number today are the ones that either read a hardcoded
// constant with no further dependency (`IfcOffsetCurve2D`=2, `IfcOffsetCurve3D`=3,
// `IfcOffsetCurveByDistances`=3, `IfcGradientCurve`=3, `IfcSegmentedReferenceCurve`=3,
// `IfcPcurve`=3) or delegate into an attribute this file's own FIRST chunk already
// ported (`IfcIndexedPolyCurve` -> `Points.Dim` -> `calc_IfcCartesianPointList_Dim`,
// confirmed empirically to resolve correctly, e.g. `2` for an `IfcCartesianPointList2D`).
// A DIRECT, testable consequence for `IfcPolynomialCurve`: since `Position.Dim`
// always resolves to `INDETERMINATE` (not `2`), the branch's own `=== 2` comparison
// is always `false` regardless of `CoefficientsZ`, so `IfcPolynomialCurve.Dim`
// ALWAYS returns `3` on IFC4X3 today, empirically confirmed for both a `CoefficientsZ`-set
// and `CoefficientsZ`-unset fixture -- never `2`, even though real Python's own
// formula is genuinely conditional. None of this is a bug in this chunk's own code
// (`expressGetAttr`'s catch-and-default behavior is itself already an established,
// correct, previously-verified design, not something this chunk introduces or
// changes) -- it is a real, disclosed, CURRENT-STATE consequence of exactly which
// functions have and haven't been ported for IFC4X3 so far, expected to keep
// resolving further (to real numbers) as later IFC4X3 chunks port `calc_IfcPoint_Dim`/
// `calc_IfcPlacement_Dim`/`calc_IfcCompositeCurveSegment_Dim`. Pinned by dedicated
// regression tests asserting the CURRENT, real, empirically-confirmed `INDETERMINATE`
// outcomes (not the eventually-resolved values), matching this project's own
// "assert what real Python/this port ACTUALLY does today, not what it will do once
// more chunks land" precedent (e.g. `rules/ifc4.ts`'s own chunk-2 `calc_IfcCurve_Dim`
// test, before ITS OWN chunk 3 later resolved `IfcPlacement.Dim` for IFC4).
//
// **The same pre-existing, inherited (not newly introduced) `INDETERMINATE`-
// poisoning-through-plain-JS-operators limitation this file's own first-chunk
// header comment already flags** applies here identically -- not repeated in full.
//
// **Cascading-test check performed** (matching this chunk's own task brief's
// explicit instruction, and this file's own first-chunk precedent) -- run against the
// FULL suite, not just the previously-flagged recurring-risk list, since this
// re-check surfaced real cascades beyond that original list too:
//
// - **`shapeBuilder.ts`'s own `profile()`/`createSweptDiskSolid()`**: their IFC4X3
//   blocked-tests build a straight, non-closed, no-arc `IfcIndexedPolyCurve`-based
//   polyline -- `calc_IfcCurve_Dim`'s new `IfcIndexedPolyCurve` branch (delegating
//   into `calc_IfcCartesianPointList_Dim`, this file's own first chunk) now resolves
//   for IFC4X3 too, matching IFC4's own chunk-2 precedent exactly -- both now
//   complete successfully end-to-end. `shapeBuilder.test.ts`'s own IFC4X3-scoped
//   "DISCLOSED BLOCKED" tests are updated to assert the new, real, resolved success.
// - **`api.cogo.addSurveyPoint`**: reads `IfcGeometricRepresentationSubContext
//   .WorldCoordinateSystem` -- NOT one of this chunk's own 15, but already-ported for
//   IFC2X3/IFC4 in each schema's own earlier third chunk, and `IfcAnnotation
//   .PredefinedType`'s own IFC4X3-only schema constraint means IFC4X3 was always the
//   only schema this function could ever run on -- this chunk's OWN #15,
//   `calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem`, closes this
//   for real: `addSurveyPoint` now succeeds end-to-end, restoring real Python's own
//   test assertions. `addSurveyPoint.ts`/`.test.ts` and `TODOS.md`'s corresponding
//   entry are updated accordingly.
// - **`api.alignment._createOffsetCurveRepresentation`/`createAsOffsetCurve`**: read
//   `basisCurve.get("Dim")` where `basisCurve` is a realistic `IfcLine`/`IfcPolyline`
//   -- `calc_IfcCurve_Dim` now resolves this call (no more throw), but -- per this
//   header comment's own `INDETERMINATE`-cascade finding above -- it resolves to
//   `INDETERMINATE`, not a real number, so both functions now COMPLETE
//   SUCCESSFULLY but always take their own 2D branch, regardless of the real curve's
//   dimensionality -- a new, disclosed, current-state latent correctness gap
//   (silently wrong branch, not a crash), NOT this chunk's own concern to fix (fixing
//   it needs `calc_IfcPoint_Dim`, a future chunk's scope). Both files' own header
//   comments and test files are updated accordingly.
// - **`api.geometry.addRailingRepresentation`**: genuinely progresses further too
//   (`IfcIndexedPolyCurve.Dim`, reached first inside `createSweptDiskSolid`, now
//   resolves) but does NOT fully succeed -- it still throws, via the SAME
//   `IfcPlacement.Dim` dependency (`builder.circle(...)`'s own `IfcCircle.Dim` ->
//   `Position.Dim`) that also blocks IFC4 until IFC4's own THIRD chunk -- **NOT**, as
//   an earlier draft of this very paragraph incorrectly claimed before being
//   corrected by direct re-verification, still blocked by the unrelated
//   `IfcLineIndex`/`IfcArcIndex` gap (that gap was already fixed by PR #179, well
//   before this chunk). The observable symptom also changes: `TypeError: Cannot
//   convert a Symbol value to a string` (`ShapeBuilder.profile()`'s own pre-existing
//   error-message template literal choking on `runtimeShim.INDETERMINATE`), not the
//   original "has no attribute 'Dim'". `addRailingRepresentation.ts`'s own header
//   comment (UPDATE 3) and its test file's regex are updated accordingly.
// - **`util/representation.ts`'s `guessType`**: `Curve2D`/`Curve3D` (and the
//   `Dim`-independent `Curve` fallback) are now reachable for the SUBSET of
//   `IfcCurve` subtypes whose `.Dim` actually resolves to a real number today
//   (`IfcIndexedPolyCurve` plus every constant branch) -- NOT for a plain
//   `IfcLine`/`IfcPolyline`-based item, which still resolves to `INDETERMINATE` and
//   therefore still fails both comparisons, falling through further down the `elif`
//   chain exactly as Python's own control flow would. No existing test in that file
//   exercises IFC4X3 at all, so no test-fidelity fix was required there -- only a
//   disclosure addendum (UPDATE 3) to avoid a future reader overclaiming full
//   resolution.
// - **`editSurveyPoint`/`editNamedUnit`**: confirmed UNCHANGED for IFC4X3 --
//   `editSurveyPoint` is blocked by `IfcCartesianPoint.Dim`/`calc_IfcPoint_Dim` (not
//   this chunk's scope); `editNamedUnit`/`test/express/rules/ifc4x3.test.ts`'s own
//   DERIVE-dispatch-wiring test both key off `IfcSIUnit.Dimensions` (also not one of
//   this chunk's own 15).
//
// All of the above re-verified directly against the real built addon (not assumed
// from the dependency chain alone), including running the FULL `vitest run` suite
// end-to-end after every fix, not just the individually-touched files.
// =============================================================================

/** Python: `IfcSecondProjAxis` (`IFC4X3_ADD2.py` line 13821) -- byte-identical to `IFC4.py`'s own. */
function ifcSecondProjAxis(zaxis: unknown, xaxis: unknown, arg: unknown): unknown {
	const v = exists(arg) ? arg : ifcDirection([0.0, 1.0, 0.0]);
	let temp = ifcScalarTimesVector(ifcDotProduct(v, zaxis), zaxis);
	let yaxis: unknown = ifcVectorDifference(v, temp);
	temp = ifcScalarTimesVector(ifcDotProduct(v, xaxis), xaxis);
	yaxis = ifcVectorDifference(yaxis, temp);
	yaxis = ifcNormalise(yaxis);
	return expressGetAttr(yaxis, "Orientation", INDETERMINATE);
}

/**
 * Python: `IfcBaseAxis` (`IFC4X3_ADD2.py` line 13176) -- byte-identical to `IFC4.py`'s
 * own; see this section's own header comment, disclosed bugs 1/1b (inherited from
 * IFC2X3's/IFC4's own disclosed bug 2/2b, not newly introduced here).
 */
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
				// `TypeError: 'tuple' object does not support item assignment` -- ported
				// as an equivalent thrown error at the same point, rather than silently
				// applying the evidently-intended sign flip or no-op'ing past it (either
				// "fix" would produce a numeric answer real Python itself can never
				// actually produce here).
				throw new Error(
					"IfcBaseAxis: real Python's own generated formula raises " +
						"TypeError('tuple' object does not support item assignment) at this exact " +
						"point (Axis1 and Axis2 both set, with a negative dot product against the " +
						"orthogonal complement) -- see rules/ifc4x3.ts's own header comment (this " +
						"chunk's disclosed bug 1), for the full citation.",
				);
			}
		}
		return u;
	}
	if (exists(axis2)) {
		// Real Python's own generated code here unconditionally raises
		// `TypeError: 'tuple' object does not support item assignment` -- this branch
		// (axis1 absent, axis2 present) has no guarding condition at all, unlike the
		// `exists(axis1)` branch's `if factor < 0.0` -- it ALWAYS hits the buggy
		// mutation, so real Python can never successfully compute a value for this case.
		throw new Error(
			"IfcBaseAxis: real Python's own generated formula raises " +
				"TypeError('tuple' object does not support item assignment) at this exact " +
				"point (Axis1 absent, Axis2 set) -- unconditionally, every time this branch is " +
				"reached -- see rules/ifc4x3.ts's own header comment (this chunk's disclosed bug " +
				"1b), for the full citation.",
		);
	}
	return [ifcDirection([1.0, 0.0]), ifcDirection([0.0, 1.0])];
}

/**
 * Python: `IfcCurveDim` (`IFC4X3_ADD2.py` line 13471) -- the shared dispatch helper
 * `calc_IfcCurve_Dim` (below) delegates to; not itself a `calc_*` function. GENUINELY
 * DIFFERENT from both `rules/ifc2x3.ts`'s own (8 branches) and `rules/ifc4.ts`'s own
 * (10 branches) -- see this section's own header comment for the full 16-branch diff
 * writeup, including the permanently-dead `IfcCurveSegment2D` branch (genuinely new
 * disclosed finding, not a bug shared with any other schema's port).
 *
 * Same disclosed fix as `rules/ifc2x3.ts`'s/`rules/ifc4.ts`'s own `ifcCurveDim` (an
 * explicit `!exists(curve)` guard, absent from real Python's own source, needed here
 * because this port's `INDETERMINATE` sentinel is a plain, always-truthy JS `Symbol`).
 */
function ifcCurveDim(curve: unknown): unknown {
	if (!exists(curve)) return null;
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcline")) {
		return expressGetAttr(expressGetAttr(curve, "Pnt", INDETERMINATE), "Dim", INDETERMINATE);
	}
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcconic")) {
		return expressGetAttr(expressGetAttr(curve, "Position", INDETERMINATE), "Dim", INDETERMINATE);
	}
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcpolyline")) {
		return expressGetAttr(
			expressGetItem(expressGetAttr(curve, "Points", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"Dim",
			INDETERMINATE,
		);
	}
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifctrimmedcurve")) {
		return ifcCurveDim(expressGetAttr(curve, "BasisCurve", INDETERMINATE));
	}
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcgradientcurve")) return 3;
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcsegmentedreferencecurve")) return 3;
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifccompositecurve")) {
		return expressGetAttr(
			expressGetItem(expressGetAttr(curve, "Segments", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			"Dim",
			INDETERMINATE,
		);
	}
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcbsplinecurve")) {
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
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcoffsetcurve2d")) return 2;
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcoffsetcurve3d")) return 3;
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcoffsetcurvebydistances")) return 3;
	// Genuinely, permanently DEAD CODE -- see this section's own header comment for
	// the full provenance writeup: `IfcCurveSegment2D` is not a real entity anywhere
	// in `IFC4X3_ADD2`'s schema (confirmed against a real built addon), so
	// `typeOf(curve)` can never contain this string for any real instance. Ported
	// for structural fidelity to the real generated source anyway, pinned by a
	// dedicated regression test proving it can never fire.
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifccurvesegment2d")) return 2;
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcpolynomialcurve")) {
		if (
			!exists(expressGetAttr(curve, "CoefficientsZ", INDETERMINATE)) &&
			expressGetAttr(expressGetAttr(curve, "Position", INDETERMINATE), "Dim", INDETERMINATE) === 2
		) {
			return 2;
		}
		return 3;
	}
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcpcurve")) return 3;
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcindexedpolycurve")) {
		return expressGetAttr(expressGetAttr(curve, "Points", INDETERMINATE), "Dim", INDETERMINATE);
	}
	if (typeOf(curve as EntityInstance).has("ifc4x3_add2.ifcspiral")) {
		return expressGetAttr(expressGetAttr(curve, "Position", INDETERMINATE), "Dim", INDETERMINATE);
	}
	return null;
}

/**
 * Python: `IfcDeriveDimensionalExponents` (`IFC4X3_ADD2.py` line 13516) -- not
 * itself a `calc_*` function; byte-identical to `IFC4.py`'s own (confirmed by direct
 * diff) -- ported fresh here rather than imported, since it needs THIS file's own
 * `getScratchFile()`, scoped to the `IFC4X3_ADD2` schema (same reason this file's
 * own first chunk's `ifcDirection`/`ifcVector` aren't shared with `rules/ifc4.ts`
 * either).
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
 * Python: `IfcGetBasisSurface` (`IFC4X3_ADD2.py` line 13628) -- not itself a
 * `calc_*` function; delegated to by `calc_IfcCompositeCurveOnSurface_BasisSurface`
 * (below). GENUINELY DIFFERENT control-flow shape from `rules/ifc4.ts`'s own version
 * -- see this section's own header comment for the full writeup (ADD2's own
 * `IfcSegment` consolidation gates each recursion/multiplication behind an explicit
 * concrete-subtype check) -- but the SAME 2 underlying real Python bugs (shared with
 * `rules/ifc4.ts`'s own chunk-2 disclosed bugs 2/3, not new).
 */
function ifcGetBasisSurface(c: unknown): unknown[] {
	let surfs: unknown[] = [];
	if (typeOf(c as EntityInstance).has("ifc4x3_add2.ifcpcurve")) {
		surfs = [expressGetAttr(c, "BasisSurface", INDETERMINATE)];
	} else if (typeOf(c as EntityInstance).has("ifc4x3_add2.ifcsurfacecurve")) {
		const associatedGeometry = expressGetAttr(c, "AssociatedGeometry", INDETERMINATE);
		if ((sizeof(associatedGeometry) as number) > 0) {
			throw new Error(
				"IfcGetBasisSurface: real Python's own generated formula raises TypeError " +
					"(list + non-list, concatenating a plain list with a single IfcSurface value " +
					"returned by IfcAssociatedSurface) at this exact point (an IfcSurfaceCurve's " +
					"own AssociatedGeometry loop) -- unconditionally, every time this branch is " +
					"reached (AssociatedGeometry is schema-mandatory, LIST [1:2]) -- see " +
					"rules/ifc4x3.ts's own header comment (this chunk's disclosed bug 2) for the " +
					"full citation.",
			);
		}
	}
	if (typeOf(c as EntityInstance).has("ifc4x3_add2.ifccompositecurveonsurface")) {
		const segments = expressGetAttr(c, "Segments", INDETERMINATE);
		const n = sizeof(segments) as number;
		const firstSegment = expressGetItem(segments, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		if (typeOf(firstSegment as EntityInstance).has("ifc4x3_add2.ifccurvesegment")) {
			surfs = ifcGetBasisSurface(expressGetAttr(firstSegment, "ParentCurve", INDETERMINATE));
		}
		if (typeOf(firstSegment as EntityInstance).has("ifc4x3_add2.ifccompositecurvesegment")) {
			surfs = ifcGetBasisSurface(expressGetAttr(firstSegment, "ParentCurve", INDETERMINATE));
		}
		if (n > 1) {
			for (const i of expressRange(2, n + 1)) {
				const segment = expressGetItem(segments, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
				const bug3Message =
					"IfcGetBasisSurface: real Python's own generated formula raises TypeError " +
					"(list * list, multiplying two plain lists together) at this exact point " +
					"(an IfcCompositeCurveOnSurface with more than one segment) -- " +
					"unconditionally, every time this branch is reached -- see rules/ifc4x3.ts's " +
					"own header comment (this chunk's disclosed bug 3) for the full citation.";
				if (typeOf(segment as EntityInstance).has("ifc4x3_add2.ifccurvesegment")) {
					throw new Error(bug3Message);
				}
				if (typeOf(segment as EntityInstance).has("ifc4x3_add2.ifccompositecurvesegment")) {
					throw new Error(bug3Message);
				}
			}
		}
	}
	return surfs;
}

// --- the 15 assigned `calc_*` functions (exact real-Python names, file order) ---

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

export function calc_IfcFaceBasedSurfaceModel_Dim(_self: EntityInstance): unknown {
	return 3;
}

export function calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem(self: EntityInstance): unknown {
	const parentcontext = expressGetAttr(self, "ParentContext", INDETERMINATE);
	return expressGetAttr(parentcontext, "WorldCoordinateSystem", INDETERMINATE);
}

registerSchemaCalcFunctions("IFC4X3_ADD2", {
	"IfcCartesianTransformationOperator.Dim": calc_IfcCartesianTransformationOperator_Dim,
	"IfcCartesianTransformationOperator2D.U": calc_IfcCartesianTransformationOperator2D_U,
	"IfcCartesianTransformationOperator2DnonUniform.Scl2": calc_IfcCartesianTransformationOperator2DnonUniform_Scl2,
	"IfcCartesianTransformationOperator3D.U": calc_IfcCartesianTransformationOperator3D_U,
	"IfcCartesianTransformationOperator3DnonUniform.Scl2": calc_IfcCartesianTransformationOperator3DnonUniform_Scl2,
	"IfcCartesianTransformationOperator3DnonUniform.Scl3": calc_IfcCartesianTransformationOperator3DnonUniform_Scl3,
	"IfcCompositeCurve.NSegments": calc_IfcCompositeCurve_NSegments,
	"IfcCompositeCurve.ClosedCurve": calc_IfcCompositeCurve_ClosedCurve,
	"IfcCompositeCurveOnSurface.BasisSurface": calc_IfcCompositeCurveOnSurface_BasisSurface,
	"IfcCsgPrimitive3D.Dim": calc_IfcCsgPrimitive3D_Dim,
	"IfcCurve.Dim": calc_IfcCurve_Dim,
	"IfcDerivedUnit.Dimensions": calc_IfcDerivedUnit_Dimensions,
	"IfcEdgeLoop.Ne": calc_IfcEdgeLoop_Ne,
	"IfcFaceBasedSurfaceModel.Dim": calc_IfcFaceBasedSurfaceModel_Dim,
	"IfcGeometricRepresentationSubContext.WorldCoordinateSystem":
		calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem,
});
