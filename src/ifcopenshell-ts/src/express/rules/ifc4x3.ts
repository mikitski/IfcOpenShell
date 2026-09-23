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
