// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4, IFC4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the
// large chunk" -- WHERE-rule classes + `rule_executor.py`): the FIRST real batch of
// ported IFC4 WHERE-rule classes -- ALL 25 `SCOPE = 'type'` rules (real source lines
// 4322-4538, `IfcBoxAlignment_WR1` through `IfcTextTransformation_WR1`) PLUS the FIRST
// 75 `SCOPE = 'entity'` rules (real source lines 4547-5351, `IfcActorRole_WR1` through
// `IfcBuildingElementPartType_CorrectPredefinedType`) in
// `src/ifcopenshell-python/ifcopenshell/express/rules/IFC4.py` -- 100 rules total, real
// file order, both boundaries independently re-verified against real source with a
// small Python script matching `^class (\w+)` followed by its own `SCOPE = '(\w+)'`
// line (not trusted from the dispatching task brief's own citation alone; the script's
// own output: `IfcBuildingElementPartType_CorrectPredefinedType` is real-source
// position 75 of 652 entity-scope classes, `IfcBuildingElementProxy_HasObjectName`
// (line 5361) is position 76 -- confirmed excluded, reserved for chunk 2). Registered
// under `"IFC4"`, this port's own confirmed-correct schema identifier for this schema
// (`test/bootstrap.ts`'s `SCHEMA_IDENTIFIERS.IFC4 === "IFC4"`, no `_ADD2`-style wrinkle
// unlike IFC4X3).
//
// **Independently re-verified totals** (re-derived directly, not trusted from the
// dispatching task brief alone): `IFC4.py` has exactly 679 classes carrying their own
// `SCOPE = '...'` class attribute -- 652 `SCOPE = 'entity'`, 25 `SCOPE = 'type'`, 2
// `SCOPE = 'file'` -- matching `PROGRESS.md`'s own already-corrected Phase EX-4 IFC4
// figures exactly (a naive `grep -c "^class Ifc.*_WR"` badly undercounts IFC4, unlike
// IFC2X3, since most IFC4 rule classes have descriptive names, e.g.
// `IfcActuator_CorrectPredefinedType`, not a `_WRnn` numeric suffix).
//
// **Deliberately EXCLUDES the 2 `SCOPE = 'file'` rules** for IFC4 (`IfcRepresentation
// ContextSameWCS`/`IfcSingleProjectInstance`, real source lines 11332/11347, far later
// in the file, both byte-identical in shape to IFC2X3's own 2 file-scope rules already
// deferred there) -- matches IFC2X3's own chunk 1 precedent of not going out of
// file-order sequence to grab them early; a later chunk handles all 6 file-scope rules
// (2 per schema) together.
//
// =============================================================================
// Two dominant shared shapes, established here for reuse by every future IFC4 chunk
// (per this chunk's own task brief: roughly HALF of all 652 entity-scope rules use one
// of these two shapes across the whole file)
// =============================================================================
//
// **1. `_CorrectTypeAssigned` (`correctTypeAssigned` below)** -- 9 real occurrences in
// THIS chunk's own 75 entity-scope rules (`IfcActuator`/`IfcAirTerminal`/
// `IfcAirTerminalBox`/`IfcAirToAirHeatRecovery`/`IfcAlarm`/`IfcAudioVisualAppliance`/
// `IfcBeam`/`IfcBoiler`/`IfcBuildingElementPart`, all named `_CorrectTypeAssigned`), of
// the task brief's own reported ~102 across the full file. Real shape (e.g.
// `IfcActuator_CorrectTypeAssigned`, line 4567): `sizeof(IsTypedBy) == 0 or
// 'ifc4.ifcXXXtype' in typeof(IsTypedBy[1].RelatingType)`. **Cardinality independently
// re-verified, not assumed**: queried the real installed `ifcopenshell` Python
// interpreter's own schema introspection (`IfcObject.all_inverse_attributes()`) --
// `IsTypedBy` is a genuine `SET [0:1] OF IfcRelDefinesByType` INVERSE (`bound1() ==
// 0`, `bound2() == 1`). This does NOT match the `(-1, -1)` sentinel
// `settings.unpackNonAggregateInverses` special-cases for unpacking a single-valued
// inverse to a bare object (confirmed directly against `entityInstance.ts`'s own
// `bound1() === -1 && bound2() === -1` check, both call sites) -- so `IsTypedBy` stays
// a genuine 0-or-1-element array through this port's own attribute-read path even with
// that setting toggled on (as `ruleExecutor.ts` does for the whole rule-execution
// pass), exactly matching the compiled rule's own `express_getitem(istypedby, 0)`
// indexing. `correctTypeAssigned(self, expectedTypeName)` below takes just the bare
// `Ifc*Type` name (e.g. `"IfcActuatorType"`) and does the `ifc4.` prefix/lowercasing
// itself.
//
// **2. `_CorrectPredefinedType` (`correctPredefinedType` below)** -- 18 real
// occurrences in this chunk (of the task brief's own reported ~225 across the full
// file), in TWO real sub-shapes, both confirmed by reading every one of the 18 bodies
// directly:
//   - "occurrence" entities (`IfcActuator`, `IfcAirTerminal`, ... -- PredefinedType is
//     OPTIONAL): `not exists(PredefinedType) or PredefinedType != USERDEFINED or
//     (PredefinedType == USERDEFINED and exists(ObjectType))`.
//   - "*Type" entities (`IfcActuatorType`, `IfcAirTerminalType`, ... -- PredefinedType
//     is MANDATORY, no leading `not exists` disjunct): `PredefinedType != USERDEFINED
//     or (PredefinedType == USERDEFINED and exists(ElementType))`.
// This is the SAME semantic idea IFC2X3's own `userDefinedOrHasAttribute` helper
// (`whereRules/ifc2x3.ts`, module-private, NOT exported) already established, plus an
// extra leading `not exists(PredefinedType) or` disjunct for the "occurrence" shape.
// **Decision, disclosed**: ported a fresh, local `userDefinedOrHasAttribute`/
// `optionalUserDefinedOrHasAttribute` pair below rather than importing IFC2X3's
// unexported version -- (a) it is genuinely unexported there today (checked directly),
// so reusing it would require modifying `ifc2x3.ts` for a cross-SCHEMA-file
// dependency no prior chunk has ever established (every existing `whereRules/*.ts` ->
// `rules/*.ts` reuse, e.g. this file's own `ifcCrossProduct` import below, stays
// WITHIN the same schema); (b) keeping each schema's `whereRules/*.ts` free of a
// dependency on any OTHER schema's file matches this project's existing "one
// self-contained module per schema" precedent for this specific file family. This is
// a real, disclosed, small duplication (11 lines) -- flagged as a reasonable future
// factoring target (e.g. a schema-agnostic `express/whereRuleHelpers.ts`) but not
// worth doing unilaterally in this chunk, which does not touch `ifc2x3.ts` at all.
// **Escape-hatch attribute name**: confirmed exhaustive for this chunk's own 18
// occurrences -- only `ObjectType` (12x, all "occurrence" entities) and `ElementType`
// (6x, all "*Type" entities) appear; no `ProcessType`/`ResourceType` sighting yet in
// this chunk's own range (the task brief's own account of a 4-value total is expected
// to be confirmed/refuted by later chunks covering more of the file, not this one).
//
// =============================================================================
// Other repeated shapes found and factored in this chunk (beyond the two above,
// disclosed per this chunk's own task brief instruction to look for more)
// =============================================================================
//
// **`optionalAttrDimEquals`** (4 occurrences: `IfcAxis1Placement_AxisIs3D`,
// `IfcAxis2Placement2D_RefDirIs2D`, `IfcAxis2Placement3D_AxisIs3D`,
// `IfcAxis2Placement3D_RefDirIs3D`): `not exists(X) or X.Dim == N`, X and N varying.
// The exact same shape IFC2X3's own `IfcAxis1Placement_WR1` (`whereRules/ifc2x3.ts`
// chunk 1) already has, just not yet factored there (only one real occurrence existed
// in that chunk's own range) -- factored here since it already recurs 4 times within
// this single chunk alone.
//
// **`attrDimEquals`** (3 occurrences: `IfcAxis1Placement_LocationIs3D`,
// `IfcAxis2Placement2D_LocationIs2D`, `IfcAxis2Placement3D_LocationIs3D`): the
// mandatory-attribute analog of the above, `X.Dim == N` with no `exists` guard (real
// source never guards `Location`, which is mandatory on all 3 entities).
//
// **`ifcEdgeLoopBounds`** (2 occurrences: `IfcAdvancedFace_RequiresEdgeCurve`,
// `IfcAdvancedFace_ApplicableEdgeCurves`): both real rule bodies open with the
// IDENTICAL sub-comprehension `[bnds for bnds in Bounds if 'ifc4.ifcedgeloop' in
// typeof(bnds.Bound)]` before diverging on what they check about each qualifying
// bound's own oriented-edge list -- factored the shared prefix out, each rule keeps
// its own distinct trailing logic.
//
// **`ifcConstraintsParamBSpline`** (a rule-file-local EXPRESS-library helper, NOT a
// WHERE-rule class or a `calc_*` DERIVE function -- real source line 11404, confirmed
// absent from both `rules/ifc4.ts` (Phase EX-2's own DERIVE-function file, which never
// had reason to touch it) and `whereRules/ifc2x3.ts` (IFC2X3's own WHERE-rule chunks
// never reached the analogous B-spline rules in that schema's own file order yet)).
// Called by 3 rules in this chunk (`IfcBSplineCurveWithKnots_ConsistentBSpline`,
// `IfcBSplineSurfaceWithKnots_UDirectionConstraints`/`VDirectionConstraints`) -- ported
// below with plain JS arithmetic/loops (all 5 parameters are mandatory,
// always-defined numeric/aggregate attributes on every real call site here, so no
// `Tri`/indeterminacy handling is needed).
//
// **One existing `rules/ifc4.ts` helper newly exported this chunk**:
// `IfcAxis2Placement3D_AxisToRefDirPosition`'s own real source body calls
// `IfcCrossProduct(axis, refdirection).Magnitude` -- `rules/ifc4.ts`'s own
// already-ported, already-tested `ifcCrossProduct` (module-private there until this
// chunk) is reused as-is (now `export`ed, see that file's own updated doc comment),
// exactly mirroring `whereRules/ifc2x3.ts` chunk 1's own identical precedent for the
// exact same function.
//
// =============================================================================
// A real, verbatim-preserved upstream Python bug found in this chunk
// =============================================================================
//
// **`IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces` (real source line 4606) has its
// pass/fail logic INVERTED, confirmed empirically against a real installed
// `ifcopenshell` Python interpreter (0.8.4.post1), not assumed from reading alone.**
// Real body: `sizeof([vsh for vsh in Voids if sizeof([afs for afs in vsh.CfsFaces if
// not 'ifc4.ifcadvancedface' in typeof(afs)]) == 0]) == 0`. Read carefully: the INNER
// comprehension selects each void's own NON-advanced ("bad") faces, and the inner
// `sizeof(...) == 0` check means "this void has ZERO bad faces" -- i.e. the void IS
// fully compliant (every face IS an `IfcAdvancedFace`). The OUTER comprehension then
// collects every COMPLIANT void, and the outer `sizeof(...) == 0` asserts that the
// COUNT OF COMPLIANT VOIDS IS ZERO -- the exact opposite of what the rule's own name
// ("VoidsHaveAdvancedFaces") and every sibling rule's own analogous shape (e.g. this
// chunk's own `IfcAdvancedFace_RequiresEdgeCurve`/`ApplicableEdgeCurves`, both of
// which correctly wrap their own inner "is this bound compliant" check in an
// additional `not` before collecting into the outer list) would imply. The correct
// EXPRESS intent is almost certainly `SIZEOF(QUERY(vsh <* Voids | SIZEOF(QUERY(afs <*
// vsh.CfsFaces | NOT (...))) > 0)) = 0` (collect NON-compliant voids, require zero of
// THOSE) -- but the checked-in, real, compiled `IFC4.py` genuinely has `== 0` where
// `> 0` (or an extra `not`) would give the intended meaning. **Verified empirically**:
// a throwaway script (`ifcopenshell.file(schema="IFC4")`, minimal
// `IfcAdvancedBrepWithVoids` fixtures) confirmed a FULLY COMPLIANT instance (every
// void's every `CfsFaces` member a bare `IfcAdvancedFace`) raises `AssertionError`
// from this real rule, while a NON-compliant instance (a void containing a plain
// `IfcFace`) and an instance with an EMPTY `Voids` list both pass -- the rule is
// exercisable and genuinely backwards, not merely dead code. **Ported verbatim below,
// bug included, NOT "fixed"** -- per this project's established verbatim-translation
// mandate for real, confirmed upstream Python behavior (matching e.g. IFC2X3 chunk 2's
// `IfcFillAreaStyle_WR11`/`_WR13` and chunk 4's `IfcStructuredDimensionCallout_WR31`
// precedent of preserving a confirmed-real defect rather than silently correcting it).
//
// =============================================================================
// Registration-helper duplication (same disclosure IFC2X3's own chunk 1 already made)
// =============================================================================
//
// `entityRule`/`typeRule` below are unexported local functions in `whereRules/
// ifc2x3.ts` (checked directly) -- this file needs its own copies for the same reason
// `userDefinedOrHasAttribute` above does (no existing shared, schema-agnostic home for
// this file family's own small registration wrappers). Same disclosed, small
// duplication; same "reasonable future factoring target, not this chunk's job" call.
//
// **How to read a rule below**: identical strategy to `whereRules/ifc2x3.ts`'s own
// header comment (`Tri`, `pyAnd`/`pyOr`/`pyNot`, `triEq`/`triNe`/`triLt`/etc.,
// `assertWhereRule`) -- not re-explained here, see that file for the full writeup of
// WHY each rule is built the way it is. One IFC4-specific style note, confirmed by
// comparing every mandatory-vs-optional attribute read in this chunk against IFC2X3's
// own already-established convention: a MANDATORY attribute is read via
// `expressGetAttr` and used directly (optionally cast `as number`/`as string`/`as
// EntityInstance[]`), while an OPTIONAL one is always guarded by `exists(...)`/
// `pyOr(!exists(...), ...)` before use -- matching `whereRules/ifc2x3.ts`'s own
// `IfcIShapeProfileDef_WR1`-`WR3` precedent exactly.

import type { EntityInstance } from "../../entityInstance";
import { type RuleDefinition, registerSchemaRules } from "../ruleDispatch";
import { ifcCrossProduct, ifcDimensionalExponents, ifcDirection, ifcDotProduct } from "../rules/ifc4";
import {
	EXPRESS_ONE_BASED_INDEXING,
	ExpressSet,
	INDETERMINATE,
	type Tri,
	assertWhereRule,
	bLength,
	exists,
	expressGetAttr,
	expressGetItem,
	expressRange,
	hiIndex,
	isIndeterminate,
	pyAnd,
	pyNot,
	pyOr,
	sizeof,
	triEq,
	triGe,
	triGt,
	triLe,
	triLt,
	triNe,
	triXor,
	typeOf,
	usedIn,
} from "../runtimeShim";

// biome-ignore lint/suspicious/noExplicitAny: mirrors `RuleDefinition['check']`'s own deliberate `any` -- see that field's doc comment (`ruleDispatch.ts`).
function typeRule(typeName: string, ruleName: string, check: (self: any) => void): RuleDefinition {
	return { scope: "type", typeName, ruleName, check };
}

function entityRule(typeName: string, ruleName: string, check: (self: EntityInstance) => void): RuleDefinition {
	return { scope: "entity", typeName, ruleName, check };
}

/**
 * Python: `typeof(inst)` where `inst` may be `INDETERMINATE` -- see
 * `whereRules/ifc2x3.ts`'s own identical `typeOfAttr` doc comment for the full
 * rationale (ported here as its own local copy, same disclosed duplication as
 * `entityRule`/`typeRule` above).
 */
function typeOfAttr(value: unknown) {
	return isIndeterminate(value) ? typeOf(null) : typeOf(value as EntityInstance);
}

/**
 * Shared shape across `IfcActorRole_WR1` and the `_CorrectPredefinedType` "occurrence"
 * sub-shape (via `correctPredefinedType` below) -- Python: `X != USERDEFINED or (X ==
 * USERDEFINED and exists(Y))`. See this file's own header comment ("Registration-helper
 * duplication") for why this is a fresh local copy, not an import of IFC2X3's own
 * unexported `userDefinedOrHasAttribute`.
 */
function userDefinedOrHasAttribute(self: EntityInstance, enumAttrName: string, escapeAttrName: string): Tri {
	const value = expressGetAttr(self, enumAttrName, INDETERMINATE);
	return pyOr(triNe(value, "USERDEFINED"), () =>
		pyAnd(triEq(value, "USERDEFINED"), () => exists(expressGetAttr(self, escapeAttrName, INDETERMINATE))),
	);
}

/**
 * Python: `not exists(X) or (X != USERDEFINED or (X == USERDEFINED and exists(Y)))` --
 * `userDefinedOrHasAttribute` above, wrapped in an additional leading `not exists(X)
 * or` guard for an OPTIONAL enum attribute (`IfcAddress_WR1`'s own `Purpose`, and the
 * `_CorrectPredefinedType` "occurrence" sub-shape's own `PredefinedType`).
 */
function optionalUserDefinedOrHasAttribute(self: EntityInstance, enumAttrName: string, escapeAttrName: string): Tri {
	const value = expressGetAttr(self, enumAttrName, INDETERMINATE);
	return pyOr(!exists(value), () => userDefinedOrHasAttribute(self, enumAttrName, escapeAttrName));
}

/**
 * The `_CorrectPredefinedType` shared shape -- see this file's own header comment for
 * the full writeup of the two real sub-shapes this parameterizes over.
 * `predefinedTypeOptional` is `true` for "occurrence" entities (PredefinedType is
 * OPTIONAL, e.g. `IfcActuator`), `false` for "*Type" entities (PredefinedType is
 * MANDATORY, e.g. `IfcActuatorType`).
 */
function correctPredefinedType(self: EntityInstance, escapeAttrName: string, predefinedTypeOptional: boolean): Tri {
	return predefinedTypeOptional
		? optionalUserDefinedOrHasAttribute(self, "PredefinedType", escapeAttrName)
		: userDefinedOrHasAttribute(self, "PredefinedType", escapeAttrName);
}

/**
 * The `_CorrectTypeAssigned` shared shape -- see this file's own header comment for
 * the cardinality verification (`IsTypedBy` is a genuine `SET [0:1]`, never unpacked
 * by `settings.unpackNonAggregateInverses`). `expectedTypeName` is the bare `Ifc*Type`
 * class name (e.g. `"IfcActuatorType"`) -- this function lowercases and prefixes it
 * with the schema identifier itself, matching every real `typeof(...)` membership
 * check's own `'ifc4.<name>'` string shape.
 */
function correctTypeAssigned(self: EntityInstance, expectedTypeName: string): Tri {
	const isTypedBy = expressGetAttr(self, "IsTypedBy", INDETERMINATE);
	return pyOr(triEq(sizeof(isTypedBy), 0), () => {
		const relDefinesByType = expressGetItem(isTypedBy, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const relatingType = expressGetAttr(relDefinesByType, "RelatingType", INDETERMINATE);
		return typeOfAttr(relatingType).has(`ifc4.${expectedTypeName.toLowerCase()}`);
	});
}

/**
 * Shared shape (4 occurrences in this chunk) -- Python: `not exists(X) or X.Dim == N`.
 * See this file's own header comment.
 */
function optionalAttrDimEquals(self: EntityInstance, attrName: string, dim: number): Tri {
	const value = expressGetAttr(self, attrName, INDETERMINATE);
	return pyOr(!exists(value), () => triEq(expressGetAttr(value, "Dim", INDETERMINATE), dim));
}

/**
 * Shared shape (3 occurrences in this chunk) -- Python: `X.Dim == N`, `X` mandatory
 * (never guarded by `exists` in real source). See this file's own header comment.
 */
function attrDimEquals(self: EntityInstance, attrName: string, dim: number): Tri {
	return triEq(expressGetAttr(expressGetAttr(self, attrName, INDETERMINATE), "Dim", INDETERMINATE), dim);
}

/**
 * Shared shape (2 occurrences in this chunk): the identical leading sub-comprehension
 * both `IfcAdvancedFace_RequiresEdgeCurve` and `IfcAdvancedFace_ApplicableEdgeCurves`
 * open with -- `[bnds for bnds in Bounds if 'ifc4.ifcedgeloop' in typeof(bnds.Bound)]`.
 * See this file's own header comment.
 */
function ifcEdgeLoopBounds(self: EntityInstance): EntityInstance[] {
	const bounds = expressGetAttr(self, "Bounds", INDETERMINATE);
	const boundItems = isIndeterminate(bounds) ? [] : (bounds as EntityInstance[]);
	return boundItems.filter((bnds) => typeOfAttr(expressGetAttr(bnds, "Bound", INDETERMINATE)).has("ifc4.ifcedgeloop"));
}

/**
 * Python: `IfcConstraintsParamBSpline(degree, upknots, upcp, knotmult, knots)`
 * (`IFC4.py` line 11404) -- a rule-file-local EXPRESS-library helper. See this file's
 * own header comment for why it's ported fresh here. All 5 parameters are mandatory,
 * always-defined numeric/aggregate attributes on every real call site in this chunk --
 * ported with plain JS arithmetic/loops, no `Tri`/indeterminacy handling needed.
 */
function ifcConstraintsParamBSpline(
	degree: number,
	upKnots: number,
	upCp: number,
	knotMult: number[],
	knots: number[],
): boolean {
	let sum = expressGetItem(knotMult, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	for (let i = 2; i <= upKnots; i++) {
		sum += expressGetItem(knotMult, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	}
	if (degree < 1 || upKnots < 2 || upCp < degree || sum !== degree + upCp + 2) {
		return false;
	}
	let k = expressGetItem(knotMult, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	if (k < 1 || k > degree + 1) {
		return false;
	}
	for (let i = 2; i <= upKnots; i++) {
		const multI = expressGetItem(knotMult, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		const knotI = expressGetItem(knots, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		const knotPrev = expressGetItem(knots, i - 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		if (multI < 1 || knotI <= knotPrev) {
			return false;
		}
		k = multI;
		if (i < upKnots && k > degree) {
			return false;
		}
		if (i === upKnots && k > degree + 1) {
			return false;
		}
	}
	return true;
}

// =============================================================================
// SCOPE = 'type' rules (real source lines 4322-4538, all 25 in this schema).
// =============================================================================

// `IfcBoxAlignment_WR1` (line 4322).
const IfcBoxAlignment_WR1 = typeRule("IfcBoxAlignment", "WR1", (self: string) => {
	assertWhereRule(
		[
			"top-left",
			"top-middle",
			"top-right",
			"middle-left",
			"center",
			"middle-right",
			"bottom-left",
			"bottom-middle",
			"bottom-right",
		].includes(self.toLowerCase()),
		"IfcBoxAlignment must be one of the 9 documented box-alignment keywords (case-insensitive).",
	);
});

// `IfcCardinalPointReference_GreaterThanZero` (line 4331).
const IfcCardinalPointReference_GreaterThanZero = typeRule(
	"IfcCardinalPointReference",
	"GreaterThanZero",
	(self: number) => {
		assertWhereRule(self > 0, "IfcCardinalPointReference must be greater than 0.");
	},
);

// `IfcCompoundPlaneAngleMeasure_MinutesInRange` (line 4340): `self` is the raw `LIST
// [3:4] OF INTEGER` value (degrees/minutes/seconds[/microseconds]).
const IfcCompoundPlaneAngleMeasure_MinutesInRange = typeRule(
	"IfcCompoundPlaneAngleMeasure",
	"MinutesInRange",
	(self: number[]) => {
		const minutes = expressGetItem(self, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		assertWhereRule(
			Math.abs(minutes) < 60,
			"IfcCompoundPlaneAngleMeasure: minutes component's absolute value must be less than 60.",
		);
	},
);

// `IfcCompoundPlaneAngleMeasure_SecondsInRange` (line 4349).
const IfcCompoundPlaneAngleMeasure_SecondsInRange = typeRule(
	"IfcCompoundPlaneAngleMeasure",
	"SecondsInRange",
	(self: number[]) => {
		const seconds = expressGetItem(self, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		assertWhereRule(
			Math.abs(seconds) < 60,
			"IfcCompoundPlaneAngleMeasure: seconds component's absolute value must be less than 60.",
		);
	},
);

// `IfcCompoundPlaneAngleMeasure_MicrosecondsInRange` (line 4358): `sizeof(self) == 3 or
// abs(self[3]) < 1000000` -- the 4th (microseconds) component is optional (a 3-element
// list has none to check).
const IfcCompoundPlaneAngleMeasure_MicrosecondsInRange = typeRule(
	"IfcCompoundPlaneAngleMeasure",
	"MicrosecondsInRange",
	(self: number[]) => {
		const microseconds = expressGetItem(self, 4 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		assertWhereRule(
			self.length === 3 || Math.abs(microseconds) < 1000000,
			"IfcCompoundPlaneAngleMeasure: if a microseconds component is given, its absolute value must be less than 1,000,000.",
		);
	},
);

// `IfcCompoundPlaneAngleMeasure_ConsistentSign` (line 4367): all present components
// (degrees/minutes/seconds, and microseconds if a 4th is given) must share the same
// sign (or be zero).
const IfcCompoundPlaneAngleMeasure_ConsistentSign = typeRule(
	"IfcCompoundPlaneAngleMeasure",
	"ConsistentSign",
	(self: number[]) => {
		const degrees = expressGetItem(self, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		const minutes = expressGetItem(self, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		const seconds = expressGetItem(self, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
		const hasFour = self.length !== 3;
		const microseconds = hasFour ? (expressGetItem(self, 4 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number) : 0;
		assertWhereRule(
			(degrees >= 0 && minutes >= 0 && seconds >= 0 && (!hasFour || microseconds >= 0)) ||
				(degrees <= 0 && minutes <= 0 && seconds <= 0 && (!hasFour || microseconds <= 0)),
			"IfcCompoundPlaneAngleMeasure: degrees/minutes/seconds[/microseconds] components must share the same sign (or be zero).",
		);
	},
);

// `IfcDayInMonthNumber_ValidRange` (line 4376).
const IfcDayInMonthNumber_ValidRange = typeRule("IfcDayInMonthNumber", "ValidRange", (self: number) => {
	assertWhereRule(1 <= self && self <= 31, "IfcDayInMonthNumber must be in [1, 31].");
});

// `IfcDayInWeekNumber_ValidRange` (line 4385).
const IfcDayInWeekNumber_ValidRange = typeRule("IfcDayInWeekNumber", "ValidRange", (self: number) => {
	assertWhereRule(1 <= self && self <= 7, "IfcDayInWeekNumber must be in [1, 7].");
});

// `IfcDimensionCount_WR1` (line 4394).
const IfcDimensionCount_WR1 = typeRule("IfcDimensionCount", "WR1", (self: number) => {
	assertWhereRule(0 < self && self <= 3, "IfcDimensionCount must be in (0, 3].");
});

// `IfcFontStyle_WR1` (line 4403).
const IfcFontStyle_WR1 = typeRule("IfcFontStyle", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "italic", "oblique"].includes(self.toLowerCase()),
		"IfcFontStyle must be one of 'normal', 'italic', 'oblique' (case-insensitive).",
	);
});

// `IfcFontVariant_WR1` (line 4412).
const IfcFontVariant_WR1 = typeRule("IfcFontVariant", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "small-caps"].includes(self.toLowerCase()),
		"IfcFontVariant must be one of 'normal', 'small-caps' (case-insensitive).",
	);
});

// `IfcFontWeight_WR1` (line 4421).
const IfcFontWeight_WR1 = typeRule("IfcFontWeight", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "small-caps", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(
			self.toLowerCase(),
		),
		"IfcFontWeight must be one of the documented keyword/numeric-weight values (case-insensitive).",
	);
});

// `IfcHeatingValueMeasure_WR1` (line 4430).
const IfcHeatingValueMeasure_WR1 = typeRule("IfcHeatingValueMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcHeatingValueMeasure must be greater than 0.");
});

// `IfcMonthInYearNumber_ValidRange` (line 4439).
const IfcMonthInYearNumber_ValidRange = typeRule("IfcMonthInYearNumber", "ValidRange", (self: number) => {
	assertWhereRule(1 <= self && self <= 12, "IfcMonthInYearNumber must be in [1, 12].");
});

// `IfcNonNegativeLengthMeasure_NotNegative` (line 4448).
const IfcNonNegativeLengthMeasure_NotNegative = typeRule(
	"IfcNonNegativeLengthMeasure",
	"NotNegative",
	(self: number) => {
		assertWhereRule(self >= 0.0, "IfcNonNegativeLengthMeasure must be greater than or equal to 0.");
	},
);

// `IfcNormalisedRatioMeasure_WR1` (line 4457).
const IfcNormalisedRatioMeasure_WR1 = typeRule("IfcNormalisedRatioMeasure", "WR1", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 1.0, "IfcNormalisedRatioMeasure must be in [0, 1].");
});

// `IfcPHMeasure_WR21` (line 4466).
const IfcPHMeasure_WR21 = typeRule("IfcPHMeasure", "WR21", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 14.0, "IfcPHMeasure must be in [0, 14].");
});

// `IfcPositiveInteger_WR1` (line 4475).
const IfcPositiveInteger_WR1 = typeRule("IfcPositiveInteger", "WR1", (self: number) => {
	assertWhereRule(self > 0, "IfcPositiveInteger must be greater than 0.");
});

// `IfcPositiveLengthMeasure_WR1` (line 4484).
const IfcPositiveLengthMeasure_WR1 = typeRule("IfcPositiveLengthMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositiveLengthMeasure must be greater than 0.");
});

// `IfcPositivePlaneAngleMeasure_WR1` (line 4493).
const IfcPositivePlaneAngleMeasure_WR1 = typeRule("IfcPositivePlaneAngleMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositivePlaneAngleMeasure must be greater than 0.");
});

// `IfcPositiveRatioMeasure_WR1` (line 4502).
const IfcPositiveRatioMeasure_WR1 = typeRule("IfcPositiveRatioMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositiveRatioMeasure must be greater than 0.");
});

// `IfcSpecularRoughness_WR1` (line 4511).
const IfcSpecularRoughness_WR1 = typeRule("IfcSpecularRoughness", "WR1", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 1.0, "IfcSpecularRoughness must be in [0, 1].");
});

// `IfcTextAlignment_WR1` (line 4520).
const IfcTextAlignment_WR1 = typeRule("IfcTextAlignment", "WR1", (self: string) => {
	assertWhereRule(
		["left", "right", "center", "justify"].includes(self.toLowerCase()),
		"IfcTextAlignment must be one of 'left', 'right', 'center', 'justify' (case-insensitive).",
	);
});

// `IfcTextDecoration_WR1` (line 4529).
const IfcTextDecoration_WR1 = typeRule("IfcTextDecoration", "WR1", (self: string) => {
	assertWhereRule(
		["none", "underline", "overline", "line-through", "blink"].includes(self.toLowerCase()),
		"IfcTextDecoration must be one of the 5 documented decoration keywords (case-insensitive).",
	);
});

// `IfcTextTransformation_WR1` (line 4538).
const IfcTextTransformation_WR1 = typeRule("IfcTextTransformation", "WR1", (self: string) => {
	assertWhereRule(
		["capitalize", "uppercase", "lowercase", "none"].includes(self.toLowerCase()),
		"IfcTextTransformation must be one of 'capitalize', 'uppercase', 'lowercase', 'none' (case-insensitive).",
	);
});

// =============================================================================
// SCOPE = 'entity' rules (real source lines 4547-5351, the first 75 in this schema).
// =============================================================================

// `IfcActorRole_WR1` (line 4547): `Role != USERDEFINED or (Role == USERDEFINED and
// exists(UserDefinedRole))`.
const IfcActorRole_WR1 = entityRule("IfcActorRole", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "Role", "UserDefinedRole"),
		"IfcActorRole: if Role is USERDEFINED, UserDefinedRole must be given.",
	);
});

// `IfcActuator_CorrectPredefinedType` (line 4557).
const IfcActuator_CorrectPredefinedType = entityRule("IfcActuator", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcActuator: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcActuator_CorrectTypeAssigned` (line 4567).
const IfcActuator_CorrectTypeAssigned = entityRule("IfcActuator", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcActuatorType"),
		"IfcActuator: if IsTypedBy is given, its RelatingType must be an IfcActuatorType.",
	);
});

// `IfcActuatorType_CorrectPredefinedType` (line 4577).
const IfcActuatorType_CorrectPredefinedType = entityRule("IfcActuatorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcActuatorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcAddress_WR1` (line 4587): `not exists(Purpose) or (Purpose != USERDEFINED or
// (Purpose == USERDEFINED and exists(UserDefinedPurpose)))`.
const IfcAddress_WR1 = entityRule("IfcAddress", "WR1", (self) => {
	assertWhereRule(
		optionalUserDefinedOrHasAttribute(self, "Purpose", "UserDefinedPurpose"),
		"IfcAddress: if Purpose is given and USERDEFINED, UserDefinedPurpose must be given.",
	);
});

// `IfcAdvancedBrep_HasAdvancedFaces` (line 4597): `sizeof([afs for afs in
// Outer.CfsFaces if not IfcAdvancedFace in typeof(afs)]) == 0`.
const IfcAdvancedBrep_HasAdvancedFaces = entityRule("IfcAdvancedBrep", "HasAdvancedFaces", (self) => {
	const outer = expressGetAttr(self, "Outer", INDETERMINATE);
	const cfsFaces = expressGetAttr(outer, "CfsFaces", INDETERMINATE);
	const items = isIndeterminate(cfsFaces) ? [] : (cfsFaces as EntityInstance[]);
	const violating = items.filter((afs) => !typeOfAttr(afs).has("ifc4.ifcadvancedface")).length;
	assertWhereRule(violating === 0, "IfcAdvancedBrep: every Outer.CfsFaces member must be an IfcAdvancedFace.");
});

// `IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces` (line 4606): **a real,
// verbatim-preserved upstream Python bug -- see this file's own header comment for
// the full derivation and empirical confirmation.** The real, checked-in body
// literally requires the COUNT OF FULLY-COMPLIANT VOIDS (every `CfsFaces` member an
// `IfcAdvancedFace`) to be ZERO -- inverted from the rule's own evident intent.
const IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces = entityRule(
	"IfcAdvancedBrepWithVoids",
	"VoidsHaveAdvancedFaces",
	(self) => {
		const voids = expressGetAttr(self, "Voids", INDETERMINATE);
		const voidItems = isIndeterminate(voids) ? [] : (voids as EntityInstance[]);
		const compliantVoidCount = voidItems.filter((vsh) => {
			const cfsFaces = expressGetAttr(vsh, "CfsFaces", INDETERMINATE);
			const faceItems = isIndeterminate(cfsFaces) ? [] : (cfsFaces as EntityInstance[]);
			const nonAdvancedCount = faceItems.filter((afs) => !typeOfAttr(afs).has("ifc4.ifcadvancedface")).length;
			return nonAdvancedCount === 0;
		}).length;
		assertWhereRule(
			compliantVoidCount === 0,
			"IfcAdvancedBrepWithVoids: [verbatim upstream bug, preserved -- see this file's header comment] real IFC4.py literally requires that NO void have all-IfcAdvancedFace CfsFaces.",
		);
	},
);

// `IfcAdvancedFace_ApplicableSurface` (line 4616): `sizeof(['ifc4.ifcelementarysurface',
// 'ifc4.ifcsweptsurface', 'ifc4.ifcbsplinesurface'] * typeof(FaceSurface)) == 1`.
const IfcAdvancedFace_ApplicableSurface = entityRule("IfcAdvancedFace", "ApplicableSurface", (self) => {
	const faceSurface = expressGetAttr(self, "FaceSurface", INDETERMINATE);
	const count = typeOfAttr(faceSurface).multiply([
		"ifc4.ifcelementarysurface",
		"ifc4.ifcsweptsurface",
		"ifc4.ifcbsplinesurface",
	]).size;
	assertWhereRule(
		count === 1,
		"IfcAdvancedFace.FaceSurface must be exactly one of IfcElementarySurface/IfcSweptSurface/IfcBSplineSurface.",
	);
});

// `IfcAdvancedFace_RequiresEdgeCurve` (line 4625): for every `Bounds` member whose
// `Bound` is an `IfcEdgeLoop`, every oriented edge in that loop's `EdgeList` must have
// an `EdgeElement` that is an `IfcEdgeCurve`.
const IfcAdvancedFace_RequiresEdgeCurve = entityRule("IfcAdvancedFace", "RequiresEdgeCurve", (self) => {
	const violating = ifcEdgeLoopBounds(self).filter((elpfbnds) => {
		const loop = expressGetAttr(elpfbnds, "Bound", INDETERMINATE);
		const edgeList = expressGetAttr(loop, "EdgeList", INDETERMINATE);
		const edgeListItems = isIndeterminate(edgeList) ? [] : (edgeList as EntityInstance[]);
		const badEdgeCount = edgeListItems.filter(
			(oe) => !typeOfAttr(expressGetAttr(oe, "EdgeElement", INDETERMINATE)).has("ifc4.ifcedgecurve"),
		).length;
		return badEdgeCount !== 0;
	}).length;
	assertWhereRule(
		violating === 0,
		"IfcAdvancedFace: every IfcEdgeLoop bound's every oriented edge must reference an IfcEdgeCurve.",
	);
});

// `IfcAdvancedFace_ApplicableEdgeCurves` (line 4634): for every `Bounds` member whose
// `Bound` is an `IfcEdgeLoop`, every oriented edge's `EdgeElement.EdgeGeometry` must be
// exactly one of IfcLine/IfcConic/IfcPolyline/IfcBSplineCurve.
const IfcAdvancedFace_ApplicableEdgeCurves = entityRule("IfcAdvancedFace", "ApplicableEdgeCurves", (self) => {
	const violating = ifcEdgeLoopBounds(self).filter((elpfbnds) => {
		const loop = expressGetAttr(elpfbnds, "Bound", INDETERMINATE);
		const edgeList = expressGetAttr(loop, "EdgeList", INDETERMINATE);
		const edgeListItems = isIndeterminate(edgeList) ? [] : (edgeList as EntityInstance[]);
		const badEdgeCount = edgeListItems.filter((oe) => {
			const edgeElement = expressGetAttr(oe, "EdgeElement", INDETERMINATE);
			const edgeGeometry = expressGetAttr(edgeElement, "EdgeGeometry", INDETERMINATE);
			return (
				typeOfAttr(edgeGeometry).multiply(["ifc4.ifcline", "ifc4.ifcconic", "ifc4.ifcpolyline", "ifc4.ifcbsplinecurve"])
					.size !== 1
			);
		}).length;
		return badEdgeCount !== 0;
	}).length;
	assertWhereRule(
		violating === 0,
		"IfcAdvancedFace: every IfcEdgeLoop bound's every oriented edge's EdgeGeometry must be exactly one of IfcLine/IfcConic/IfcPolyline/IfcBSplineCurve.",
	);
});

// `IfcAirTerminal_CorrectPredefinedType` (line 4643).
const IfcAirTerminal_CorrectPredefinedType = entityRule("IfcAirTerminal", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcAirTerminal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcAirTerminal_CorrectTypeAssigned` (line 4653).
const IfcAirTerminal_CorrectTypeAssigned = entityRule("IfcAirTerminal", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcAirTerminalType"),
		"IfcAirTerminal: if IsTypedBy is given, its RelatingType must be an IfcAirTerminalType.",
	);
});

// `IfcAirTerminalBox_CorrectPredefinedType` (line 4663).
const IfcAirTerminalBox_CorrectPredefinedType = entityRule("IfcAirTerminalBox", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcAirTerminalBox: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcAirTerminalBox_CorrectTypeAssigned` (line 4673).
const IfcAirTerminalBox_CorrectTypeAssigned = entityRule("IfcAirTerminalBox", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcAirTerminalBoxType"),
		"IfcAirTerminalBox: if IsTypedBy is given, its RelatingType must be an IfcAirTerminalBoxType.",
	);
});

// `IfcAirTerminalBoxType_CorrectPredefinedType` (line 4683).
const IfcAirTerminalBoxType_CorrectPredefinedType = entityRule(
	"IfcAirTerminalBoxType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcAirTerminalBoxType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcAirTerminalType_CorrectPredefinedType` (line 4693).
const IfcAirTerminalType_CorrectPredefinedType = entityRule("IfcAirTerminalType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcAirTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcAirToAirHeatRecovery_CorrectPredefinedType` (line 4703).
const IfcAirToAirHeatRecovery_CorrectPredefinedType = entityRule(
	"IfcAirToAirHeatRecovery",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcAirToAirHeatRecovery: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcAirToAirHeatRecovery_CorrectTypeAssigned` (line 4713).
const IfcAirToAirHeatRecovery_CorrectTypeAssigned = entityRule(
	"IfcAirToAirHeatRecovery",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcAirToAirHeatRecoveryType"),
			"IfcAirToAirHeatRecovery: if IsTypedBy is given, its RelatingType must be an IfcAirToAirHeatRecoveryType.",
		);
	},
);

// `IfcAirToAirHeatRecoveryType_CorrectPredefinedType` (line 4723).
const IfcAirToAirHeatRecoveryType_CorrectPredefinedType = entityRule(
	"IfcAirToAirHeatRecoveryType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcAirToAirHeatRecoveryType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcAlarm_CorrectPredefinedType` (line 4733).
const IfcAlarm_CorrectPredefinedType = entityRule("IfcAlarm", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcAlarm: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcAlarm_CorrectTypeAssigned` (line 4743).
const IfcAlarm_CorrectTypeAssigned = entityRule("IfcAlarm", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcAlarmType"),
		"IfcAlarm: if IsTypedBy is given, its RelatingType must be an IfcAlarmType.",
	);
});

// `IfcAlarmType_CorrectPredefinedType` (line 4753).
const IfcAlarmType_CorrectPredefinedType = entityRule("IfcAlarmType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcAlarmType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcApproval_HasIdentifierOrName` (line 4763): `exists(Identifier) or exists(Name)`.
const IfcApproval_HasIdentifierOrName = entityRule("IfcApproval", "HasIdentifierOrName", (self) => {
	const identifier = expressGetAttr(self, "Identifier", INDETERMINATE);
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	assertWhereRule(exists(identifier) || exists(name), "IfcApproval: at least one of Identifier or Name must be given.");
});

// `IfcArbitraryClosedProfileDef_WR1` (line 4774): `OuterCurve.Dim == 2`.
const IfcArbitraryClosedProfileDef_WR1 = entityRule("IfcArbitraryClosedProfileDef", "WR1", (self) => {
	assertWhereRule(attrDimEquals(self, "OuterCurve", 2), "IfcArbitraryClosedProfileDef.OuterCurve.Dim must equal 2.");
});

// `IfcArbitraryClosedProfileDef_WR2` (line 4784): `not IfcLine in typeof(OuterCurve)`.
const IfcArbitraryClosedProfileDef_WR2 = entityRule("IfcArbitraryClosedProfileDef", "WR2", (self) => {
	const outerCurve = expressGetAttr(self, "OuterCurve", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(outerCurve).has("ifc4.ifcline"),
		"IfcArbitraryClosedProfileDef.OuterCurve must not be an IfcLine.",
	);
});

// `IfcArbitraryClosedProfileDef_WR3` (line 4794): `not IfcOffsetCurve2D in typeof(OuterCurve)`.
const IfcArbitraryClosedProfileDef_WR3 = entityRule("IfcArbitraryClosedProfileDef", "WR3", (self) => {
	const outerCurve = expressGetAttr(self, "OuterCurve", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(outerCurve).has("ifc4.ifcoffsetcurve2d"),
		"IfcArbitraryClosedProfileDef.OuterCurve must not be an IfcOffsetCurve2D.",
	);
});

// `IfcArbitraryOpenProfileDef_WR11` (line 4804): `IfcCenterLineProfileDef in typeof(self)
// or ProfileType == CURVE`.
const IfcArbitraryOpenProfileDef_WR11 = entityRule("IfcArbitraryOpenProfileDef", "WR11", (self) => {
	const profileType = expressGetAttr(self, "ProfileType", INDETERMINATE);
	assertWhereRule(
		pyOr(typeOfAttr(self).has("ifc4.ifccenterlineprofiledef"), () => triEq(profileType, "CURVE")),
		"IfcArbitraryOpenProfileDef: must be an IfcCenterLineProfileDef, or ProfileType must be CURVE.",
	);
});

// `IfcArbitraryOpenProfileDef_WR12` (line 4813): `Curve.Dim == 2`.
const IfcArbitraryOpenProfileDef_WR12 = entityRule("IfcArbitraryOpenProfileDef", "WR12", (self) => {
	assertWhereRule(attrDimEquals(self, "Curve", 2), "IfcArbitraryOpenProfileDef.Curve.Dim must equal 2.");
});

// `IfcArbitraryProfileDefWithVoids_WR1` (line 4823): `ProfileType == AREA`.
const IfcArbitraryProfileDefWithVoids_WR1 = entityRule("IfcArbitraryProfileDefWithVoids", "WR1", (self) => {
	const profileType = expressGetAttr(self, "ProfileType", INDETERMINATE);
	assertWhereRule(triEq(profileType, "AREA"), "IfcArbitraryProfileDefWithVoids.ProfileType must be AREA.");
});

// `IfcArbitraryProfileDefWithVoids_WR2` (line 4832): `sizeof([temp for temp in
// InnerCurves if temp.Dim != 2]) == 0`.
const IfcArbitraryProfileDefWithVoids_WR2 = entityRule("IfcArbitraryProfileDefWithVoids", "WR2", (self) => {
	const innerCurves = expressGetAttr(self, "InnerCurves", INDETERMINATE);
	const items = isIndeterminate(innerCurves) ? [] : (innerCurves as EntityInstance[]);
	const violating = items.filter((temp) => triNe(expressGetAttr(temp, "Dim", INDETERMINATE), 2) === true).length;
	assertWhereRule(violating === 0, "IfcArbitraryProfileDefWithVoids: every InnerCurves member must have Dim == 2.");
});

// `IfcArbitraryProfileDefWithVoids_WR3` (line 4842): `sizeof([temp for temp in
// InnerCurves if IfcLine in typeof(temp)]) == 0`.
const IfcArbitraryProfileDefWithVoids_WR3 = entityRule("IfcArbitraryProfileDefWithVoids", "WR3", (self) => {
	const innerCurves = expressGetAttr(self, "InnerCurves", INDETERMINATE);
	const items = isIndeterminate(innerCurves) ? [] : (innerCurves as EntityInstance[]);
	const violating = items.filter((temp) => typeOfAttr(temp).has("ifc4.ifcline")).length;
	assertWhereRule(violating === 0, "IfcArbitraryProfileDefWithVoids: no InnerCurves member may be an IfcLine.");
});

// `IfcAsymmetricIShapeProfileDef_ValidFlangeThickness` (line 4852): `not
// exists(TopFlangeThickness) or BottomFlangeThickness + TopFlangeThickness <
// OverallDepth`.
const IfcAsymmetricIShapeProfileDef_ValidFlangeThickness = entityRule(
	"IfcAsymmetricIShapeProfileDef",
	"ValidFlangeThickness",
	(self) => {
		const overallDepth = expressGetAttr(self, "OverallDepth", INDETERMINATE) as number;
		const bottomFlangeThickness = expressGetAttr(self, "BottomFlangeThickness", INDETERMINATE) as number;
		const topFlangeThickness = expressGetAttr(self, "TopFlangeThickness", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(topFlangeThickness), () =>
				triLt(bottomFlangeThickness + (topFlangeThickness as number), overallDepth),
			),
			"IfcAsymmetricIShapeProfileDef: if TopFlangeThickness is given, BottomFlangeThickness + TopFlangeThickness must be less than OverallDepth.",
		);
	},
);

// `IfcAsymmetricIShapeProfileDef_ValidWebThickness` (line 4864): `WebThickness <
// BottomFlangeWidth and WebThickness < TopFlangeWidth`.
const IfcAsymmetricIShapeProfileDef_ValidWebThickness = entityRule(
	"IfcAsymmetricIShapeProfileDef",
	"ValidWebThickness",
	(self) => {
		const bottomFlangeWidth = expressGetAttr(self, "BottomFlangeWidth", INDETERMINATE);
		const webThickness = expressGetAttr(self, "WebThickness", INDETERMINATE);
		const topFlangeWidth = expressGetAttr(self, "TopFlangeWidth", INDETERMINATE);
		assertWhereRule(
			pyAnd(triLt(webThickness, bottomFlangeWidth), () => triLt(webThickness, topFlangeWidth)),
			"IfcAsymmetricIShapeProfileDef.WebThickness must be less than both BottomFlangeWidth and TopFlangeWidth.",
		);
	},
);

// `IfcAsymmetricIShapeProfileDef_ValidBottomFilletRadius` (line 4876): `not
// exists(BottomFlangeFilletRadius) or BottomFlangeFilletRadius <= (BottomFlangeWidth -
// WebThickness) / 2.0`.
const IfcAsymmetricIShapeProfileDef_ValidBottomFilletRadius = entityRule(
	"IfcAsymmetricIShapeProfileDef",
	"ValidBottomFilletRadius",
	(self) => {
		const bottomFlangeWidth = expressGetAttr(self, "BottomFlangeWidth", INDETERMINATE) as number;
		const webThickness = expressGetAttr(self, "WebThickness", INDETERMINATE) as number;
		const bottomFlangeFilletRadius = expressGetAttr(self, "BottomFlangeFilletRadius", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(bottomFlangeFilletRadius), () =>
				triLe(bottomFlangeFilletRadius, (bottomFlangeWidth - webThickness) / 2.0),
			),
			"IfcAsymmetricIShapeProfileDef: if BottomFlangeFilletRadius is given, it must be at most half of (BottomFlangeWidth - WebThickness).",
		);
	},
);

// `IfcAsymmetricIShapeProfileDef_ValidTopFilletRadius` (line 4888): `not
// exists(TopFlangeFilletRadius) or TopFlangeFilletRadius <= (TopFlangeWidth -
// WebThickness) / 2.0`.
const IfcAsymmetricIShapeProfileDef_ValidTopFilletRadius = entityRule(
	"IfcAsymmetricIShapeProfileDef",
	"ValidTopFilletRadius",
	(self) => {
		const webThickness = expressGetAttr(self, "WebThickness", INDETERMINATE) as number;
		const topFlangeWidth = expressGetAttr(self, "TopFlangeWidth", INDETERMINATE) as number;
		const topFlangeFilletRadius = expressGetAttr(self, "TopFlangeFilletRadius", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(topFlangeFilletRadius), () => triLe(topFlangeFilletRadius, (topFlangeWidth - webThickness) / 2.0)),
			"IfcAsymmetricIShapeProfileDef: if TopFlangeFilletRadius is given, it must be at most half of (TopFlangeWidth - WebThickness).",
		);
	},
);

// `IfcAudioVisualAppliance_CorrectPredefinedType` (line 4900).
const IfcAudioVisualAppliance_CorrectPredefinedType = entityRule(
	"IfcAudioVisualAppliance",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcAudioVisualAppliance: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcAudioVisualAppliance_CorrectTypeAssigned` (line 4910).
const IfcAudioVisualAppliance_CorrectTypeAssigned = entityRule(
	"IfcAudioVisualAppliance",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcAudioVisualApplianceType"),
			"IfcAudioVisualAppliance: if IsTypedBy is given, its RelatingType must be an IfcAudioVisualApplianceType.",
		);
	},
);

// `IfcAudioVisualApplianceType_CorrectPredefinedType` (line 4920).
const IfcAudioVisualApplianceType_CorrectPredefinedType = entityRule(
	"IfcAudioVisualApplianceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcAudioVisualApplianceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcAxis1Placement_AxisIs3D` (line 4930): `not exists(Axis) or Axis.Dim == 3`.
const IfcAxis1Placement_AxisIs3D = entityRule("IfcAxis1Placement", "AxisIs3D", (self) => {
	assertWhereRule(optionalAttrDimEquals(self, "Axis", 3), "IfcAxis1Placement: if Axis is given, its Dim must equal 3.");
});

// `IfcAxis1Placement_LocationIs3D` (line 4940): `Location.Dim == 3`.
const IfcAxis1Placement_LocationIs3D = entityRule("IfcAxis1Placement", "LocationIs3D", (self) => {
	assertWhereRule(attrDimEquals(self, "Location", 3), "IfcAxis1Placement.Location.Dim must equal 3.");
});

// `IfcAxis2Placement2D_RefDirIs2D` (line 4953): `not exists(RefDirection) or
// RefDirection.Dim == 2`.
const IfcAxis2Placement2D_RefDirIs2D = entityRule("IfcAxis2Placement2D", "RefDirIs2D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "RefDirection", 2),
		"IfcAxis2Placement2D: if RefDirection is given, its Dim must equal 2.",
	);
});

// `IfcAxis2Placement2D_LocationIs2D` (line 4963): `Location.Dim == 2`.
const IfcAxis2Placement2D_LocationIs2D = entityRule("IfcAxis2Placement2D", "LocationIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "Location", 2), "IfcAxis2Placement2D.Location.Dim must equal 2.");
});

// `IfcAxis2Placement3D_LocationIs3D` (line 4976): `Location.Dim == 3`.
const IfcAxis2Placement3D_LocationIs3D = entityRule("IfcAxis2Placement3D", "LocationIs3D", (self) => {
	assertWhereRule(attrDimEquals(self, "Location", 3), "IfcAxis2Placement3D.Location.Dim must equal 3.");
});

// `IfcAxis2Placement3D_AxisIs3D` (line 4985): `not exists(Axis) or Axis.Dim == 3`.
const IfcAxis2Placement3D_AxisIs3D = entityRule("IfcAxis2Placement3D", "AxisIs3D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "Axis", 3),
		"IfcAxis2Placement3D: if Axis is given, its Dim must equal 3.",
	);
});

// `IfcAxis2Placement3D_RefDirIs3D` (line 4995): `not exists(RefDirection) or
// RefDirection.Dim == 3`.
const IfcAxis2Placement3D_RefDirIs3D = entityRule("IfcAxis2Placement3D", "RefDirIs3D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "RefDirection", 3),
		"IfcAxis2Placement3D: if RefDirection is given, its Dim must equal 3.",
	);
});

// `IfcAxis2Placement3D_AxisToRefDirPosition` (line 5005): `not exists(Axis) or not
// exists(RefDirection) or IfcCrossProduct(Axis, RefDirection).Magnitude > 0.0`.
const IfcAxis2Placement3D_AxisToRefDirPosition = entityRule("IfcAxis2Placement3D", "AxisToRefDirPosition", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	const refDirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis), () =>
			pyOr(!exists(refDirection), () =>
				triGt(expressGetAttr(ifcCrossProduct(axis, refDirection), "Magnitude", INDETERMINATE), 0.0),
			),
		),
		"IfcAxis2Placement3D: if both Axis and RefDirection are given, their cross product's Magnitude must be greater than 0.",
	);
});

// `IfcAxis2Placement3D_AxisAndRefDirProvision` (line 5016): `not exists(Axis) ^
// exists(RefDirection)`. Python operator precedence: `^` binds tighter than `not`, so
// this parses as `not (exists(Axis) ^ exists(RefDirection))` -- an XNOR: either both
// Axis and RefDirection are given, or neither is. `exists()` always returns a
// definite boolean, so this reduces to a plain equality check (same reduction as
// `whereRules/ifc2x3.ts`'s own `IfcAxis2Placement3D_WR5`).
const IfcAxis2Placement3D_AxisAndRefDirProvision = entityRule(
	"IfcAxis2Placement3D",
	"AxisAndRefDirProvision",
	(self) => {
		const axis = expressGetAttr(self, "Axis", INDETERMINATE);
		const refDirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
		assertWhereRule(
			exists(axis) === exists(refDirection),
			"IfcAxis2Placement3D: Axis and RefDirection must either both be given or both be omitted.",
		);
	},
);

// `IfcBSplineCurve_SameDim` (line 5032): `sizeof([temp for temp in ControlPointsList
// if temp.Dim != ControlPointsList[0].Dim]) == 0`.
const IfcBSplineCurve_SameDim = entityRule("IfcBSplineCurve", "SameDim", (self) => {
	const controlPointsList = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	const list = isIndeterminate(controlPointsList) ? [] : (controlPointsList as EntityInstance[]);
	const first = expressGetItem(list, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const firstDim = expressGetAttr(first, "Dim", INDETERMINATE);
	const violating = list.filter((temp) => triNe(expressGetAttr(temp, "Dim", INDETERMINATE), firstDim) === true).length;
	assertWhereRule(
		violating === 0,
		"IfcBSplineCurve: every ControlPointsList member must share the first member's Dim.",
	);
});

// `IfcBSplineCurveWithKnots_ConsistentBSpline` (line 5051):
// `IfcConstraintsParamBSpline(Degree, UpperIndexOnKnots, UpperIndexOnControlPoints,
// KnotMultiplicities, Knots)`.
const IfcBSplineCurveWithKnots_ConsistentBSpline = entityRule(
	"IfcBSplineCurveWithKnots",
	"ConsistentBSpline",
	(self) => {
		const degree = expressGetAttr(self, "Degree", INDETERMINATE) as number;
		const upperIndexOnControlPoints = expressGetAttr(self, "UpperIndexOnControlPoints", INDETERMINATE) as number;
		const knotMultiplicities = expressGetAttr(self, "KnotMultiplicities", INDETERMINATE) as number[];
		const knots = expressGetAttr(self, "Knots", INDETERMINATE) as number[];
		const upperIndexOnKnots = expressGetAttr(self, "UpperIndexOnKnots", INDETERMINATE) as number;
		assertWhereRule(
			ifcConstraintsParamBSpline(degree, upperIndexOnKnots, upperIndexOnControlPoints, knotMultiplicities, knots),
			"IfcBSplineCurveWithKnots: Degree/UpperIndexOnKnots/UpperIndexOnControlPoints/KnotMultiplicities/Knots must form a consistent B-spline (IfcConstraintsParamBSpline).",
		);
	},
);

// `IfcBSplineCurveWithKnots_CorrespondingKnotLists` (line 5065):
// `sizeof(KnotMultiplicities) == UpperIndexOnKnots`.
const IfcBSplineCurveWithKnots_CorrespondingKnotLists = entityRule(
	"IfcBSplineCurveWithKnots",
	"CorrespondingKnotLists",
	(self) => {
		const knotMultiplicities = expressGetAttr(self, "KnotMultiplicities", INDETERMINATE);
		const upperIndexOnKnots = expressGetAttr(self, "UpperIndexOnKnots", INDETERMINATE);
		assertWhereRule(
			triEq(sizeof(knotMultiplicities), upperIndexOnKnots),
			"IfcBSplineCurveWithKnots: sizeof(KnotMultiplicities) must equal UpperIndexOnKnots.",
		);
	},
);

// `IfcBSplineSurfaceWithKnots_UDirectionConstraints` (line 5094):
// `IfcConstraintsParamBSpline(UDegree, KnotUUpper, UUpper, UMultiplicities, UKnots)`.
const IfcBSplineSurfaceWithKnots_UDirectionConstraints = entityRule(
	"IfcBSplineSurfaceWithKnots",
	"UDirectionConstraints",
	(self) => {
		const uDegree = expressGetAttr(self, "UDegree", INDETERMINATE) as number;
		const uUpper = expressGetAttr(self, "UUpper", INDETERMINATE) as number;
		const uMultiplicities = expressGetAttr(self, "UMultiplicities", INDETERMINATE) as number[];
		const uKnots = expressGetAttr(self, "UKnots", INDETERMINATE) as number[];
		const knotUUpper = expressGetAttr(self, "KnotUUpper", INDETERMINATE) as number;
		assertWhereRule(
			ifcConstraintsParamBSpline(uDegree, knotUUpper, uUpper, uMultiplicities, uKnots),
			"IfcBSplineSurfaceWithKnots: UDegree/KnotUUpper/UUpper/UMultiplicities/UKnots must form a consistent B-spline (IfcConstraintsParamBSpline).",
		);
	},
);

// `IfcBSplineSurfaceWithKnots_VDirectionConstraints` (line 5106):
// `IfcConstraintsParamBSpline(VDegree, KnotVUpper, VUpper, VMultiplicities, VKnots)`.
const IfcBSplineSurfaceWithKnots_VDirectionConstraints = entityRule(
	"IfcBSplineSurfaceWithKnots",
	"VDirectionConstraints",
	(self) => {
		const vDegree = expressGetAttr(self, "VDegree", INDETERMINATE) as number;
		const vUpper = expressGetAttr(self, "VUpper", INDETERMINATE) as number;
		const vMultiplicities = expressGetAttr(self, "VMultiplicities", INDETERMINATE) as number[];
		const vKnots = expressGetAttr(self, "VKnots", INDETERMINATE) as number[];
		const knotVUpper = expressGetAttr(self, "KnotVUpper", INDETERMINATE) as number;
		assertWhereRule(
			ifcConstraintsParamBSpline(vDegree, knotVUpper, vUpper, vMultiplicities, vKnots),
			"IfcBSplineSurfaceWithKnots: VDegree/KnotVUpper/VUpper/VMultiplicities/VKnots must form a consistent B-spline (IfcConstraintsParamBSpline).",
		);
	},
);

// `IfcBSplineSurfaceWithKnots_CorrespondingULists` (line 5118):
// `sizeof(UMultiplicities) == KnotUUpper`.
const IfcBSplineSurfaceWithKnots_CorrespondingULists = entityRule(
	"IfcBSplineSurfaceWithKnots",
	"CorrespondingULists",
	(self) => {
		const uMultiplicities = expressGetAttr(self, "UMultiplicities", INDETERMINATE);
		const knotUUpper = expressGetAttr(self, "KnotUUpper", INDETERMINATE);
		assertWhereRule(
			triEq(sizeof(uMultiplicities), knotUUpper),
			"IfcBSplineSurfaceWithKnots: sizeof(UMultiplicities) must equal KnotUUpper.",
		);
	},
);

// `IfcBSplineSurfaceWithKnots_CorrespondingVLists` (line 5129):
// `sizeof(VMultiplicities) == KnotVUpper`.
const IfcBSplineSurfaceWithKnots_CorrespondingVLists = entityRule(
	"IfcBSplineSurfaceWithKnots",
	"CorrespondingVLists",
	(self) => {
		const vMultiplicities = expressGetAttr(self, "VMultiplicities", INDETERMINATE);
		const knotVUpper = expressGetAttr(self, "KnotVUpper", INDETERMINATE);
		assertWhereRule(
			triEq(sizeof(vMultiplicities), knotVUpper),
			"IfcBSplineSurfaceWithKnots: sizeof(VMultiplicities) must equal KnotVUpper.",
		);
	},
);

// `IfcBeam_CorrectPredefinedType` (line 5148).
const IfcBeam_CorrectPredefinedType = entityRule("IfcBeam", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBeam: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBeam_CorrectTypeAssigned` (line 5158).
const IfcBeam_CorrectTypeAssigned = entityRule("IfcBeam", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcBeamType"),
		"IfcBeam: if IsTypedBy is given, its RelatingType must be an IfcBeamType.",
	);
});

// `IfcBeamStandardCase_HasMaterialProfileSetUsage` (line 5168):
// `sizeof([temp for temp in usedin(self, 'ifc4.ifcrelassociates.relatedobjects') if
// IfcRelAssociatesMaterial in typeof(temp) and IfcMaterialProfileSetUsage in
// typeof(temp.RelatingMaterial)]) == 1`. **Retrofitted (Phase EX-4, IFC4 chunk 4) to call
// the new `hasSoleMaterialUsage` shared helper** -- this chunk's own `IfcMemberStandardCase_
// HasMaterialProfileSetUsage` is the 3rd real occurrence of this exact shape (this rule and
// chunk 3's own `IfcColumnStandardCase_HasMaterialProfileSetUsage` were each explicitly
// disclosed as "not yet a 3rd" at the time), crossing this project's own 3-occurrence
// factoring threshold -- see `hasSoleMaterialUsage`'s own doc comment (this chunk's section,
// below) for the full disclosure.
const IfcBeamStandardCase_HasMaterialProfileSetUsage = entityRule(
	"IfcBeamStandardCase",
	"HasMaterialProfileSetUsage",
	(self) => {
		assertWhereRule(
			hasSoleMaterialUsage(self, "ifc4.ifcmaterialprofilesetusage"),
			"IfcBeamStandardCase: must be associated with exactly one IfcRelAssociatesMaterial whose RelatingMaterial is an IfcMaterialProfileSetUsage.",
		);
	},
);

// `IfcBeamType_CorrectPredefinedType` (line 5177).
const IfcBeamType_CorrectPredefinedType = entityRule("IfcBeamType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcBeamType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcBlobTexture_SupportedRasterFormat` (line 5187): `RasterFormat.lower() in
// ['bmp', 'jpg', 'gif', 'png']`.
const IfcBlobTexture_SupportedRasterFormat = entityRule("IfcBlobTexture", "SupportedRasterFormat", (self) => {
	const rasterFormat = expressGetAttr(self, "RasterFormat", INDETERMINATE) as string;
	assertWhereRule(
		["bmp", "jpg", "gif", "png"].includes(rasterFormat.toLowerCase()),
		"IfcBlobTexture.RasterFormat must be one of 'bmp', 'jpg', 'gif', 'png' (case-insensitive).",
	);
});

// `IfcBlobTexture_RasterCodeByteStream` (line 5196): `blength(RasterCode) % 8 == 0`.
const IfcBlobTexture_RasterCodeByteStream = entityRule("IfcBlobTexture", "RasterCodeByteStream", (self) => {
	const rasterCode = expressGetAttr(self, "RasterCode", INDETERMINATE);
	const bitLength = sizeof(rasterCode) as number;
	assertWhereRule(bitLength % 8 === 0, "IfcBlobTexture.RasterCode's bit length must be a multiple of 8.");
});

// `IfcBoiler_CorrectPredefinedType` (line 5206).
const IfcBoiler_CorrectPredefinedType = entityRule("IfcBoiler", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBoiler: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBoiler_CorrectTypeAssigned` (line 5216).
const IfcBoiler_CorrectTypeAssigned = entityRule("IfcBoiler", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcBoilerType"),
		"IfcBoiler: if IsTypedBy is given, its RelatingType must be an IfcBoilerType.",
	);
});

// `IfcBoilerType_CorrectPredefinedType` (line 5226).
const IfcBoilerType_CorrectPredefinedType = entityRule("IfcBoilerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcBoilerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcBooleanClippingResult_FirstOperandType` (line 5236): `IfcSweptAreaSolid in
// typeof(FirstOperand) or IfcSweptDiscSolid in typeof(FirstOperand) or
// IfcBooleanClippingResult in typeof(FirstOperand)`.
const IfcBooleanClippingResult_FirstOperandType = entityRule("IfcBooleanClippingResult", "FirstOperandType", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	const types = typeOfAttr(firstOperand);
	assertWhereRule(
		types.has("ifc4.ifcsweptareasolid") ||
			types.has("ifc4.ifcsweptdiscsolid") ||
			types.has("ifc4.ifcbooleanclippingresult"),
		"IfcBooleanClippingResult.FirstOperand must be an IfcSweptAreaSolid, IfcSweptDiscSolid, or IfcBooleanClippingResult.",
	);
});

// `IfcBooleanClippingResult_SecondOperandType` (line 5246): `IfcHalfSpaceSolid in
// typeof(SecondOperand)`.
const IfcBooleanClippingResult_SecondOperandType = entityRule(
	"IfcBooleanClippingResult",
	"SecondOperandType",
	(self) => {
		const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
		assertWhereRule(
			typeOfAttr(secondOperand).has("ifc4.ifchalfspacesolid"),
			"IfcBooleanClippingResult.SecondOperand must be an IfcHalfSpaceSolid.",
		);
	},
);

// `IfcBooleanClippingResult_OperatorType` (line 5256): `Operator == DIFFERENCE`.
const IfcBooleanClippingResult_OperatorType = entityRule("IfcBooleanClippingResult", "OperatorType", (self) => {
	const operator = expressGetAttr(self, "Operator", INDETERMINATE);
	assertWhereRule(triEq(operator, "DIFFERENCE"), "IfcBooleanClippingResult.Operator must be DIFFERENCE.");
});

// `IfcBooleanResult_SameDim` (line 5266): `FirstOperand.Dim == SecondOperand.Dim`.
const IfcBooleanResult_SameDim = entityRule("IfcBooleanResult", "SameDim", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(firstOperand, "Dim", INDETERMINATE), expressGetAttr(secondOperand, "Dim", INDETERMINATE)),
		"IfcBooleanResult: FirstOperand.Dim must equal SecondOperand.Dim.",
	);
});

// `IfcBooleanResult_FirstOperandClosed` (line 5277): `not IfcTessellatedFaceSet in
// typeof(FirstOperand) or (exists(FirstOperand.Closed) and FirstOperand.Closed)`.
const IfcBooleanResult_FirstOperandClosed = entityRule("IfcBooleanResult", "FirstOperandClosed", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	assertWhereRule(
		pyOr(!typeOfAttr(firstOperand).has("ifc4.ifctessellatedfaceset"), () => {
			const closed = expressGetAttr(firstOperand, "Closed", INDETERMINATE);
			return pyAnd(exists(closed), () => closed as Tri);
		}),
		"IfcBooleanResult: if FirstOperand is an IfcTessellatedFaceSet, its Closed must be TRUE.",
	);
});

// `IfcBooleanResult_SecondOperandClosed` (line 5287): `not IfcTessellatedFaceSet in
// typeof(SecondOperand) or (exists(SecondOperand.Closed) and SecondOperand.Closed)`.
const IfcBooleanResult_SecondOperandClosed = entityRule("IfcBooleanResult", "SecondOperandClosed", (self) => {
	const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
	assertWhereRule(
		pyOr(!typeOfAttr(secondOperand).has("ifc4.ifctessellatedfaceset"), () => {
			const closed = expressGetAttr(secondOperand, "Closed", INDETERMINATE);
			return pyAnd(exists(closed), () => closed as Tri);
		}),
		"IfcBooleanResult: if SecondOperand is an IfcTessellatedFaceSet, its Closed must be TRUE.",
	);
});

// `IfcBoundaryCurve_IsClosed` (line 5301): `assert ClosedCurve is not False` -- no
// comparison at all, just a direct assertion of the (inherited, DERIVE) boolean.
const IfcBoundaryCurve_IsClosed = entityRule("IfcBoundaryCurve", "IsClosed", (self) => {
	const closedCurve = expressGetAttr(self, "ClosedCurve", INDETERMINATE);
	assertWhereRule(closedCurve as Tri, "IfcBoundaryCurve.ClosedCurve must not be FALSE.");
});

// `IfcBoxedHalfSpace_UnboundedSurface` (line 5313): `not IfcCurveBoundedPlane in
// typeof(BaseSurface)`.
const IfcBoxedHalfSpace_UnboundedSurface = entityRule("IfcBoxedHalfSpace", "UnboundedSurface", (self) => {
	const baseSurface = expressGetAttr(self, "BaseSurface", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(baseSurface).has("ifc4.ifccurveboundedplane"),
		"IfcBoxedHalfSpace.BaseSurface must not be an IfcCurveBoundedPlane.",
	);
});

// `IfcBuildingElement_MaxOneMaterialAssociation` (line 5322): `sizeof([temp for temp in
// HasAssociations if IfcRelAssociatesMaterial in typeof(temp)]) <= 1`.
const IfcBuildingElement_MaxOneMaterialAssociation = entityRule(
	"IfcBuildingElement",
	"MaxOneMaterialAssociation",
	(self) => {
		const hasAssociations = expressGetAttr(self, "HasAssociations", INDETERMINATE);
		const items = isIndeterminate(hasAssociations) ? [] : (hasAssociations as EntityInstance[]);
		const count = items.filter((temp) => typeOfAttr(temp).has("ifc4.ifcrelassociatesmaterial")).length;
		assertWhereRule(
			count <= 1,
			"IfcBuildingElement: at most one HasAssociations member may be an IfcRelAssociatesMaterial.",
		);
	},
);

// `IfcBuildingElementPart_CorrectPredefinedType` (line 5331).
const IfcBuildingElementPart_CorrectPredefinedType = entityRule(
	"IfcBuildingElementPart",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcBuildingElementPart: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcBuildingElementPart_CorrectTypeAssigned` (line 5341).
const IfcBuildingElementPart_CorrectTypeAssigned = entityRule(
	"IfcBuildingElementPart",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcBuildingElementPartType"),
			"IfcBuildingElementPart: if IsTypedBy is given, its RelatingType must be an IfcBuildingElementPartType.",
		);
	},
);

// `IfcBuildingElementPartType_CorrectPredefinedType` (line 5351).
const IfcBuildingElementPartType_CorrectPredefinedType = entityRule(
	"IfcBuildingElementPartType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcBuildingElementPartType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

registerSchemaRules("IFC4", [
	// SCOPE = 'type' (25)
	IfcBoxAlignment_WR1,
	IfcCardinalPointReference_GreaterThanZero,
	IfcCompoundPlaneAngleMeasure_MinutesInRange,
	IfcCompoundPlaneAngleMeasure_SecondsInRange,
	IfcCompoundPlaneAngleMeasure_MicrosecondsInRange,
	IfcCompoundPlaneAngleMeasure_ConsistentSign,
	IfcDayInMonthNumber_ValidRange,
	IfcDayInWeekNumber_ValidRange,
	IfcDimensionCount_WR1,
	IfcFontStyle_WR1,
	IfcFontVariant_WR1,
	IfcFontWeight_WR1,
	IfcHeatingValueMeasure_WR1,
	IfcMonthInYearNumber_ValidRange,
	IfcNonNegativeLengthMeasure_NotNegative,
	IfcNormalisedRatioMeasure_WR1,
	IfcPHMeasure_WR21,
	IfcPositiveInteger_WR1,
	IfcPositiveLengthMeasure_WR1,
	IfcPositivePlaneAngleMeasure_WR1,
	IfcPositiveRatioMeasure_WR1,
	IfcSpecularRoughness_WR1,
	IfcTextAlignment_WR1,
	IfcTextDecoration_WR1,
	IfcTextTransformation_WR1,
	// SCOPE = 'entity' (75)
	IfcActorRole_WR1,
	IfcActuator_CorrectPredefinedType,
	IfcActuator_CorrectTypeAssigned,
	IfcActuatorType_CorrectPredefinedType,
	IfcAddress_WR1,
	IfcAdvancedBrep_HasAdvancedFaces,
	IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces,
	IfcAdvancedFace_ApplicableSurface,
	IfcAdvancedFace_RequiresEdgeCurve,
	IfcAdvancedFace_ApplicableEdgeCurves,
	IfcAirTerminal_CorrectPredefinedType,
	IfcAirTerminal_CorrectTypeAssigned,
	IfcAirTerminalBox_CorrectPredefinedType,
	IfcAirTerminalBox_CorrectTypeAssigned,
	IfcAirTerminalBoxType_CorrectPredefinedType,
	IfcAirTerminalType_CorrectPredefinedType,
	IfcAirToAirHeatRecovery_CorrectPredefinedType,
	IfcAirToAirHeatRecovery_CorrectTypeAssigned,
	IfcAirToAirHeatRecoveryType_CorrectPredefinedType,
	IfcAlarm_CorrectPredefinedType,
	IfcAlarm_CorrectTypeAssigned,
	IfcAlarmType_CorrectPredefinedType,
	IfcApproval_HasIdentifierOrName,
	IfcArbitraryClosedProfileDef_WR1,
	IfcArbitraryClosedProfileDef_WR2,
	IfcArbitraryClosedProfileDef_WR3,
	IfcArbitraryOpenProfileDef_WR11,
	IfcArbitraryOpenProfileDef_WR12,
	IfcArbitraryProfileDefWithVoids_WR1,
	IfcArbitraryProfileDefWithVoids_WR2,
	IfcArbitraryProfileDefWithVoids_WR3,
	IfcAsymmetricIShapeProfileDef_ValidFlangeThickness,
	IfcAsymmetricIShapeProfileDef_ValidWebThickness,
	IfcAsymmetricIShapeProfileDef_ValidBottomFilletRadius,
	IfcAsymmetricIShapeProfileDef_ValidTopFilletRadius,
	IfcAudioVisualAppliance_CorrectPredefinedType,
	IfcAudioVisualAppliance_CorrectTypeAssigned,
	IfcAudioVisualApplianceType_CorrectPredefinedType,
	IfcAxis1Placement_AxisIs3D,
	IfcAxis1Placement_LocationIs3D,
	IfcAxis2Placement2D_RefDirIs2D,
	IfcAxis2Placement2D_LocationIs2D,
	IfcAxis2Placement3D_LocationIs3D,
	IfcAxis2Placement3D_AxisIs3D,
	IfcAxis2Placement3D_RefDirIs3D,
	IfcAxis2Placement3D_AxisToRefDirPosition,
	IfcAxis2Placement3D_AxisAndRefDirProvision,
	IfcBSplineCurve_SameDim,
	IfcBSplineCurveWithKnots_ConsistentBSpline,
	IfcBSplineCurveWithKnots_CorrespondingKnotLists,
	IfcBSplineSurfaceWithKnots_UDirectionConstraints,
	IfcBSplineSurfaceWithKnots_VDirectionConstraints,
	IfcBSplineSurfaceWithKnots_CorrespondingULists,
	IfcBSplineSurfaceWithKnots_CorrespondingVLists,
	IfcBeam_CorrectPredefinedType,
	IfcBeam_CorrectTypeAssigned,
	IfcBeamStandardCase_HasMaterialProfileSetUsage,
	IfcBeamType_CorrectPredefinedType,
	IfcBlobTexture_SupportedRasterFormat,
	IfcBlobTexture_RasterCodeByteStream,
	IfcBoiler_CorrectPredefinedType,
	IfcBoiler_CorrectTypeAssigned,
	IfcBoilerType_CorrectPredefinedType,
	IfcBooleanClippingResult_FirstOperandType,
	IfcBooleanClippingResult_SecondOperandType,
	IfcBooleanClippingResult_OperatorType,
	IfcBooleanResult_SameDim,
	IfcBooleanResult_FirstOperandClosed,
	IfcBooleanResult_SecondOperandClosed,
	IfcBoundaryCurve_IsClosed,
	IfcBoxedHalfSpace_UnboundedSurface,
	IfcBuildingElement_MaxOneMaterialAssociation,
	IfcBuildingElementPart_CorrectPredefinedType,
	IfcBuildingElementPart_CorrectTypeAssigned,
	IfcBuildingElementPartType_CorrectPredefinedType,
]);

// =============================================================================
// Phase EX-4, IFC4 chunk 2 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk" -- WHERE-rule classes + `rule_executor.py`): the NEXT 120 `SCOPE = 'entity'` rules,
// continuing directly from chunk 1's own last-ported rule with zero gap or overlap --
// `IfcBuildingElementProxy_HasObjectName` (real source line 5361) through
// `IfcDuctFitting_CorrectTypeAssigned` (line 6617) in `src/ifcopenshell-python/
// ifcopenshell/express/rules/IFC4.py`. **Independently re-verified, not trusted from the
// dispatching task brief's own citation alone**: re-ran the same `^class (\w+)` +
// `SCOPE = '(\w+)'`-matching approach chunk 1's own header comment describes, confirmed
// exactly 120 `SCOPE = 'entity'` classes in this range, `IfcBuildingElementPartType_
// CorrectPredefinedType` (chunk 1's own last rule, real source position 75 of 652) is
// immediately followed by `IfcBuildingElementProxy_HasObjectName` (position 76, this
// chunk's own first rule) with no gap, and this chunk's own last rule (`IfcDuctFitting_
// CorrectTypeAssigned`, position 195) is immediately followed by `IfcDuctFittingType_
// CorrectPredefinedType` (position 196, real source line 6627) -- explicitly excluded,
// reserved for chunk 3. IFC4 now stands at 220 of 679 total WHERE-rule classes (100 from
// chunk 1 + this chunk's own 120), all `SCOPE = 'entity'` (100/652 entity-scope from chunk
// 1's own 75, now 195/652).
//
// =============================================================================
// Shared shapes REUSED from chunk 1 (no new logic, just more call sites)
// =============================================================================
//
// **`correctTypeAssigned`** -- 23 occurrences in this chunk (`IfcBuildingElementProxy`
// through `IfcDuctFitting`). One quirk, disclosed: `IfcDoor_CorrectStyleAssigned` (real
// source line 6507) has the exact same body shape (`sizeof(IsTypedBy) == 0 or
// 'ifc4.ifcdoortype' in typeof(...)`) but its own real `RULE_NAME` is `'CorrectStyleAssigned'`,
// NOT the usual `'CorrectTypeAssigned'` -- registered below under its own real rule name
// (`entityRule("IfcDoor", "CorrectStyleAssigned", ...)`), confirmed directly against real
// source rather than assumed from the shape match alone.
//
// **`correctPredefinedType`** -- 52 occurrences in this chunk. **A new escape-attribute
// value, confirmed for the first time in this chunk**: `"ResourceType"` (4 occurrences --
// `IfcConstructionEquipmentResourceType`/`IfcConstructionMaterialResourceType`/
// `IfcConstructionProductResourceType`/`IfcCrewResourceType`, all "*Type" resource
// entities), alongside the already-established `"ObjectType"` (occurrence entities) and
// `"ElementType"` ("*Type" element entities) -- confirms chunk 1's own header-comment
// hypothesis ("`ProcessType`/`ResourceType` expected in later chunks").
//
// **`optionalAttrDimEquals`** -- 5 more occurrences (`IfcCartesianTransformationOperator2D_
// Axis1Is2D`/`Axis2Is2D`, `IfcCartesianTransformationOperator3D_Axis1Is3D`/`Axis2Is3D`/
// `Axis3Is3D`).
//
// **`userDefinedOrHasAttribute`** -- 2 more occurrences (`IfcConstraint_WR11`'s own
// `ConstraintGrade`/`UserDefinedGrade`, `IfcDerivedUnit_WR2`'s own `UnitType`/
// `UserDefinedType`).
//
// **A real, disclosed non-reuse**: `IfcCartesianTransformationOperator2D_DimEqual2`/
// `IfcCartesianTransformationOperator3D_DimIs3D` read `Dim == 2`/`Dim == 3` directly off
// `self` (a DERIVE attribute, `calc_IfcCartesianTransformationOperator_Dim`) -- NOT
// `attrDimEquals` (that helper checks a nested `self.<attr>.Dim`, not `self.Dim` itself).
// Written as bespoke one-liners instead of misusing that helper.
//
// =============================================================================
// New shared shapes factored in this chunk
// =============================================================================
//
// **`attrGreaterThanZero`** (4 occurrences: `IfcCartesianTransformationOperator_
// ScaleGreaterZero`'s own `Scl`, `IfcCartesianTransformationOperator2DnonUniform_
// Scale2GreaterZero`'s own `Scl2`, `IfcCartesianTransformationOperator3DnonUniform_
// Scale2GreaterZero`/`Scale3GreaterZero`'s own `Scl2`/`Scl3`) -- Python: `X > 0.0`, `X` a
// mandatory REAL attribute.
//
// **`allShareFirstAttr`** -- "every member of a list attribute shares the first member's
// own value at some other attribute" (Python: `sizeof([temp for temp in X if temp.Y !=
// X[0].Y]) == 0`). Chunk 1's own `IfcBSplineCurve_SameDim` already has this exact shape
// inlined (NOT retrofitted here, per this project's own "don't touch already-merged prior
// chunks" precedent); this chunk's own `IfcCompositeCurve_SameDim`/
// `IfcCompositeProfileDef_InvariantProfileType` are the 2nd and 3rd occurrences across the
// whole file -- meeting the 3-occurrence factoring threshold, factored here.
//
// **`containsSelfReference`** (2 occurrences: `IfcComplexProperty_WR21`,
// `IfcComplexPropertyTemplate_NoSelfReference`) -- Python: `sizeof([temp for temp in X if
// self == temp]) == 0`.
//
// **`definesTypeIsDoorTypeOrStyle`** (2 occurrences, byte-identical real bodies:
// `IfcDoorLiningProperties_WR35`, `IfcDoorPanelProperties_ApplicableToType`) -- Python:
// `exists(lambda: DefinesType[0]) and ('ifc4.ifcdoortype' in typeof(DefinesType[0]) or
// 'ifc4.ifcdoorstyle' in typeof(DefinesType[0]))`.
//
// **`uniquePropertyLikeNames`, plus its two real-named thin wrappers `ifcUniquePropertyName`/
// `ifcUniquePropertyTemplateNames`** (new rule-file-local EXPRESS helpers, real source lines
// 12139/12155) -- two real, distinct top-level Python functions with byte-identical bodies
// (confirmed directly): build an `express_set` union of every member's own `Name`, then
// check that set's size equals the list's own length (every member has a distinct Name).
// Called by `IfcComplexProperty_WR22`/`IfcComplexPropertyTemplate_UniquePropertyNames`
// respectively -- each ported rule calls its own real-named wrapper, not a merged function,
// keeping every call site a literal match of its real source.
//
// =============================================================================
// No new real upstream Python bugs found in this chunk's own 120 rules
// =============================================================================
//
// Every rule in this chunk was read directly against its own real source body (not assumed
// from name/shape alone); none exhibit chunk 1's own `IfcAdvancedBrepWithVoids_
// VoidsHaveAdvancedFaces`-style inverted double-negative or any other confirmed defect.
// `IfcCompositeCurve_CurveContinuous`'s own `discontinuous` bare-name reference (real
// Python's `enum_namespace`-exported lowercase alias for `IfcTransitionCode.DISCONTINUOUS`)
// is ported as the plain uppercase enum-member string `"DISCONTINUOUS"`, matching every
// other ported rule's own enum-comparison convention (e.g. chunk 1's `"USERDEFINED"`/
// `"AREA"`) -- a disclosed, mechanical substitution, not a behavior change.
// =============================================================================

/**
 * Shared shape (4 occurrences in this chunk) -- Python: `X > 0.0`, `X` a mandatory REAL
 * attribute read directly off `self`. See this file's own header comment.
 */
function attrGreaterThanZero(self: EntityInstance, attrName: string): Tri {
	return triGt(expressGetAttr(self, attrName, INDETERMINATE), 0.0);
}

/**
 * Shared shape -- Python: `sizeof([temp for temp in X if temp.Y != X[0].Y]) == 0` (every
 * member of list attribute `listAttrName` shares the first member's own `attrName` value).
 * See this file's own header comment for the 3-occurrence provenance (chunk 1's own
 * `IfcBSplineCurve_SameDim`, not retrofitted, plus this chunk's own 2 new call sites).
 */
function allShareFirstAttr(self: EntityInstance, listAttrName: string, attrName: string): boolean {
	const list = expressGetAttr(self, listAttrName, INDETERMINATE);
	const items = isIndeterminate(list) ? [] : (list as EntityInstance[]);
	const first = expressGetItem(items, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const firstValue = expressGetAttr(first, attrName, INDETERMINATE);
	const violating = items.filter(
		(item) => triNe(expressGetAttr(item, attrName, INDETERMINATE), firstValue) === true,
	).length;
	return violating === 0;
}

/**
 * Shared shape (2 occurrences in this chunk) -- Python: `sizeof([temp for temp in X if self
 * == temp]) == 0`. `self == temp` is a genuine entity-instance comparison (`triEq`, not a
 * bare `===` -- see `runtimeShim.ts`'s own header comment on why).
 */
function containsSelfReference(self: EntityInstance, listAttrName: string): boolean {
	const list = expressGetAttr(self, listAttrName, INDETERMINATE);
	const items = isIndeterminate(list) ? [] : (list as EntityInstance[]);
	const count = items.filter((temp) => triEq(self, temp) === true).length;
	return count === 0;
}

/**
 * Shared shape (2 occurrences, byte-identical real bodies) -- Python:
 * `exists(lambda: express_getitem(DefinesType, 0, INDETERMINATE)) and ('ifc4.ifcdoortype' in
 * typeof(...) or 'ifc4.ifcdoorstyle' in typeof(...))`. `DefinesType[0]` is re-evaluated
 * multiple times in the real generated body (never cached) -- ported the same way (`first()`
 * called multiple times) for literal fidelity, not just structural equivalence.
 */
function definesTypeIsDoorTypeOrStyle(self: EntityInstance): boolean {
	const first = () =>
		expressGetItem(expressGetAttr(self, "DefinesType", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	return exists(first) && (typeOfAttr(first()).has("ifc4.ifcdoortype") || typeOfAttr(first()).has("ifc4.ifcdoorstyle"));
}

/**
 * Python: `IfcUniquePropertyName(properties)` (real source line 12139) /
 * `IfcUniquePropertyTemplateNames(properties)` (line 12155) -- two real, distinct top-level
 * EXPRESS-library helper functions with byte-identical bodies (confirmed directly): build an
 * `express_set` union of every member's own `Name`, then check that set's size equals the
 * list's own length. See this file's own header comment.
 */
function uniquePropertyLikeNames(properties: unknown): boolean {
	const items = isIndeterminate(properties) ? [] : (properties as EntityInstance[]);
	let names = new ExpressSet<unknown>();
	for (const item of items) {
		names = names.plus(expressGetAttr(item, "Name", INDETERMINATE));
	}
	return names.size === items.length;
}

/** Python: `IfcUniquePropertyName` (line 12139) -- see `uniquePropertyLikeNames` above. */
function ifcUniquePropertyName(properties: unknown): boolean {
	return uniquePropertyLikeNames(properties);
}

/** Python: `IfcUniquePropertyTemplateNames` (line 12155) -- see `uniquePropertyLikeNames` above. */
function ifcUniquePropertyTemplateNames(properties: unknown): boolean {
	return uniquePropertyLikeNames(properties);
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 5361-6617, this chunk's own 120).
// =============================================================================

// `IfcBuildingElementProxy_HasObjectName` (line 5361): `exists(Name)`. **Retrofitted (Phase
// EX-4, IFC4 chunk 4) to call the new `attrExists` shared helper** -- this chunk's own
// `IfcProcedure_HasName`/`IfcProject_HasName`/`IfcPropertySet_ExistsName`/
// `IfcPropertySetTemplate_ExistsName` (4 more real occurrences of this exact bare
// `exists(X)` shape) cross this project's own 3-occurrence factoring threshold; see
// `attrExists`'s own doc comment (this chunk's section, below) for the full disclosure.
const IfcBuildingElementProxy_HasObjectName = entityRule("IfcBuildingElementProxy", "HasObjectName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcBuildingElementProxy.Name must be given.");
});

// `IfcBuildingElementProxy_CorrectPredefinedType` (line 5370).
const IfcBuildingElementProxy_CorrectPredefinedType = entityRule(
	"IfcBuildingElementProxy",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcBuildingElementProxy: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcBuildingElementProxy_CorrectTypeAssigned` (line 5380).
const IfcBuildingElementProxy_CorrectTypeAssigned = entityRule(
	"IfcBuildingElementProxy",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcBuildingElementProxyType"),
			"IfcBuildingElementProxy: if IsTypedBy is given, its RelatingType must be an IfcBuildingElementProxyType.",
		);
	},
);

// `IfcBuildingElementProxyType_CorrectPredefinedType` (line 5390).
const IfcBuildingElementProxyType_CorrectPredefinedType = entityRule(
	"IfcBuildingElementProxyType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcBuildingElementProxyType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcBurner_CorrectPredefinedType` (line 5400).
const IfcBurner_CorrectPredefinedType = entityRule("IfcBurner", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBurner: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBurner_CorrectTypeAssigned` (line 5410).
const IfcBurner_CorrectTypeAssigned = entityRule("IfcBurner", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcBurnerType"),
		"IfcBurner: if IsTypedBy is given, its RelatingType must be an IfcBurnerType.",
	);
});

// `IfcBurnerType_CorrectPredefinedType` (line 5420).
const IfcBurnerType_CorrectPredefinedType = entityRule("IfcBurnerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcBurnerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCShapeProfileDef_ValidGirth` (line 5430): `Girth < Depth / 2.0`.
const IfcCShapeProfileDef_ValidGirth = entityRule("IfcCShapeProfileDef", "ValidGirth", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE) as number;
	const girth = expressGetAttr(self, "Girth", INDETERMINATE);
	assertWhereRule(triLt(girth, depth / 2.0), "IfcCShapeProfileDef.Girth must be less than half of Depth.");
});

// `IfcCShapeProfileDef_ValidInternalFilletRadius` (line 5441): `not
// exists(InternalFilletRadius) or (InternalFilletRadius <= Width / 2.0 - WallThickness and
// InternalFilletRadius <= Depth / 2.0 - WallThickness)` -- same shape as chunk 1's own
// `IfcAsymmetricIShapeProfileDef_ValidBottomFilletRadius`/`ValidTopFilletRadius`, just with
// two conjoined bounds instead of one.
const IfcCShapeProfileDef_ValidInternalFilletRadius = entityRule(
	"IfcCShapeProfileDef",
	"ValidInternalFilletRadius",
	(self) => {
		const depth = expressGetAttr(self, "Depth", INDETERMINATE) as number;
		const width = expressGetAttr(self, "Width", INDETERMINATE) as number;
		const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE) as number;
		const internalFilletRadius = expressGetAttr(self, "InternalFilletRadius", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(internalFilletRadius), () =>
				pyAnd(triLe(internalFilletRadius, width / 2.0 - wallThickness), () =>
					triLe(internalFilletRadius, depth / 2.0 - wallThickness),
				),
			),
			"IfcCShapeProfileDef: if InternalFilletRadius is given, it must be at most half of (Width - WallThickness) and at most half of (Depth - WallThickness).",
		);
	},
);

// `IfcCShapeProfileDef_ValidWallThickness` (line 5454): `WallThickness < Width / 2.0 and
// WallThickness < Depth / 2.0`.
const IfcCShapeProfileDef_ValidWallThickness = entityRule("IfcCShapeProfileDef", "ValidWallThickness", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE) as number;
	const width = expressGetAttr(self, "Width", INDETERMINATE) as number;
	const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLt(wallThickness, width / 2.0), () => triLt(wallThickness, depth / 2.0)),
		"IfcCShapeProfileDef.WallThickness must be less than half of both Width and Depth.",
	);
});

// `IfcCableCarrierFitting_CorrectPredefinedType` (line 5466).
const IfcCableCarrierFitting_CorrectPredefinedType = entityRule(
	"IfcCableCarrierFitting",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcCableCarrierFitting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcCableCarrierFitting_CorrectTypeAssigned` (line 5476).
const IfcCableCarrierFitting_CorrectTypeAssigned = entityRule(
	"IfcCableCarrierFitting",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcCableCarrierFittingType"),
			"IfcCableCarrierFitting: if IsTypedBy is given, its RelatingType must be an IfcCableCarrierFittingType.",
		);
	},
);

// `IfcCableCarrierFittingType_CorrectPredefinedType` (line 5486).
const IfcCableCarrierFittingType_CorrectPredefinedType = entityRule(
	"IfcCableCarrierFittingType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcCableCarrierFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcCableCarrierSegment_CorrectPredefinedType` (line 5496).
const IfcCableCarrierSegment_CorrectPredefinedType = entityRule(
	"IfcCableCarrierSegment",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcCableCarrierSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcCableCarrierSegment_CorrectTypeAssigned` (line 5506).
const IfcCableCarrierSegment_CorrectTypeAssigned = entityRule(
	"IfcCableCarrierSegment",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcCableCarrierSegmentType"),
			"IfcCableCarrierSegment: if IsTypedBy is given, its RelatingType must be an IfcCableCarrierSegmentType.",
		);
	},
);

// `IfcCableCarrierSegmentType_CorrectPredefinedType` (line 5516).
const IfcCableCarrierSegmentType_CorrectPredefinedType = entityRule(
	"IfcCableCarrierSegmentType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcCableCarrierSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcCableFitting_CorrectPredefinedType` (line 5526).
const IfcCableFitting_CorrectPredefinedType = entityRule("IfcCableFitting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCableFitting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCableFitting_CorrectTypeAssigned` (line 5536).
const IfcCableFitting_CorrectTypeAssigned = entityRule("IfcCableFitting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCableFittingType"),
		"IfcCableFitting: if IsTypedBy is given, its RelatingType must be an IfcCableFittingType.",
	);
});

// `IfcCableFittingType_CorrectPredefinedType` (line 5546).
const IfcCableFittingType_CorrectPredefinedType = entityRule("IfcCableFittingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCableFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCableSegment_CorrectPredefinedType` (line 5556).
const IfcCableSegment_CorrectPredefinedType = entityRule("IfcCableSegment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCableSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCableSegment_CorrectTypeAssigned` (line 5566).
const IfcCableSegment_CorrectTypeAssigned = entityRule("IfcCableSegment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCableSegmentType"),
		"IfcCableSegment: if IsTypedBy is given, its RelatingType must be an IfcCableSegmentType.",
	);
});

// `IfcCableSegmentType_CorrectPredefinedType` (line 5576).
const IfcCableSegmentType_CorrectPredefinedType = entityRule("IfcCableSegmentType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCableSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCartesianPoint_CP2Dor3D` (line 5586): `hiindex(Coordinates) >= 2` -- `hiindex` is a
// real alias of `sizeof`/`expressLen` (`runtimeShim.ts`'s own `hiIndex = expressLen`), used
// here exactly as real Python's own generated body does.
const IfcCartesianPoint_CP2Dor3D = entityRule("IfcCartesianPoint", "CP2Dor3D", (self) => {
	const coordinates = expressGetAttr(self, "Coordinates", INDETERMINATE);
	assertWhereRule(triGe(sizeof(coordinates), 2), "IfcCartesianPoint.Coordinates must have at least 2 elements.");
});

// `IfcCartesianTransformationOperator_ScaleGreaterZero` (line 5603): `Scl > 0.0`.
const IfcCartesianTransformationOperator_ScaleGreaterZero = entityRule(
	"IfcCartesianTransformationOperator",
	"ScaleGreaterZero",
	(self) => {
		assertWhereRule(attrGreaterThanZero(self, "Scl"), "IfcCartesianTransformationOperator.Scl must be greater than 0.");
	},
);

// `IfcCartesianTransformationOperator2D_DimEqual2` (line 5621): `Dim == 2` -- reads `self`'s
// own (DERIVE, `calc_IfcCartesianTransformationOperator_Dim`) `Dim` attribute directly, NOT
// a nested `X.Dim` -- deliberately NOT `attrDimEquals` (that helper expects an attribute
// whose OWN `.Dim` is checked, not `self.Dim` itself).
const IfcCartesianTransformationOperator2D_DimEqual2 = entityRule(
	"IfcCartesianTransformationOperator2D",
	"DimEqual2",
	(self) => {
		assertWhereRule(
			triEq(expressGetAttr(self, "Dim", INDETERMINATE), 2),
			"IfcCartesianTransformationOperator2D.Dim must equal 2.",
		);
	},
);

// `IfcCartesianTransformationOperator2D_Axis1Is2D` (line 5630): `not exists(Axis1) or
// Axis1.Dim == 2`.
const IfcCartesianTransformationOperator2D_Axis1Is2D = entityRule(
	"IfcCartesianTransformationOperator2D",
	"Axis1Is2D",
	(self) => {
		assertWhereRule(
			optionalAttrDimEquals(self, "Axis1", 2),
			"IfcCartesianTransformationOperator2D: if Axis1 is given, its Dim must equal 2.",
		);
	},
);

// `IfcCartesianTransformationOperator2D_Axis2Is2D` (line 5639): `not exists(Axis2) or
// Axis2.Dim == 2`.
const IfcCartesianTransformationOperator2D_Axis2Is2D = entityRule(
	"IfcCartesianTransformationOperator2D",
	"Axis2Is2D",
	(self) => {
		assertWhereRule(
			optionalAttrDimEquals(self, "Axis2", 2),
			"IfcCartesianTransformationOperator2D: if Axis2 is given, its Dim must equal 2.",
		);
	},
);

// `IfcCartesianTransformationOperator2DnonUniform_Scale2GreaterZero` (line 5651): `Scl2 > 0.0`.
const IfcCartesianTransformationOperator2DnonUniform_Scale2GreaterZero = entityRule(
	"IfcCartesianTransformationOperator2DnonUniform",
	"Scale2GreaterZero",
	(self) => {
		assertWhereRule(
			attrGreaterThanZero(self, "Scl2"),
			"IfcCartesianTransformationOperator2DnonUniform.Scl2 must be greater than 0.",
		);
	},
);

// `IfcCartesianTransformationOperator3D_DimIs3D` (line 5665): `Dim == 3` -- same
// `self.Dim`-not-`attrDimEquals` note as `IfcCartesianTransformationOperator2D_DimEqual2`
// above.
const IfcCartesianTransformationOperator3D_DimIs3D = entityRule(
	"IfcCartesianTransformationOperator3D",
	"DimIs3D",
	(self) => {
		assertWhereRule(
			triEq(expressGetAttr(self, "Dim", INDETERMINATE), 3),
			"IfcCartesianTransformationOperator3D.Dim must equal 3.",
		);
	},
);

// `IfcCartesianTransformationOperator3D_Axis1Is3D` (line 5674): `not exists(Axis1) or
// Axis1.Dim == 3`.
const IfcCartesianTransformationOperator3D_Axis1Is3D = entityRule(
	"IfcCartesianTransformationOperator3D",
	"Axis1Is3D",
	(self) => {
		assertWhereRule(
			optionalAttrDimEquals(self, "Axis1", 3),
			"IfcCartesianTransformationOperator3D: if Axis1 is given, its Dim must equal 3.",
		);
	},
);

// `IfcCartesianTransformationOperator3D_Axis2Is3D` (line 5683): `not exists(Axis2) or
// Axis2.Dim == 3`.
const IfcCartesianTransformationOperator3D_Axis2Is3D = entityRule(
	"IfcCartesianTransformationOperator3D",
	"Axis2Is3D",
	(self) => {
		assertWhereRule(
			optionalAttrDimEquals(self, "Axis2", 3),
			"IfcCartesianTransformationOperator3D: if Axis2 is given, its Dim must equal 3.",
		);
	},
);

// `IfcCartesianTransformationOperator3D_Axis3Is3D` (line 5692): `not exists(Axis3) or
// Axis3.Dim == 3`.
const IfcCartesianTransformationOperator3D_Axis3Is3D = entityRule(
	"IfcCartesianTransformationOperator3D",
	"Axis3Is3D",
	(self) => {
		assertWhereRule(
			optionalAttrDimEquals(self, "Axis3", 3),
			"IfcCartesianTransformationOperator3D: if Axis3 is given, its Dim must equal 3.",
		);
	},
);

// `IfcCartesianTransformationOperator3DnonUniform_Scale2GreaterZero` (line 5706): `Scl2 > 0.0`.
const IfcCartesianTransformationOperator3DnonUniform_Scale2GreaterZero = entityRule(
	"IfcCartesianTransformationOperator3DnonUniform",
	"Scale2GreaterZero",
	(self) => {
		assertWhereRule(
			attrGreaterThanZero(self, "Scl2"),
			"IfcCartesianTransformationOperator3DnonUniform.Scl2 must be greater than 0.",
		);
	},
);

// `IfcCartesianTransformationOperator3DnonUniform_Scale3GreaterZero` (line 5716): `Scl3 > 0.0`.
const IfcCartesianTransformationOperator3DnonUniform_Scale3GreaterZero = entityRule(
	"IfcCartesianTransformationOperator3DnonUniform",
	"Scale3GreaterZero",
	(self) => {
		assertWhereRule(
			attrGreaterThanZero(self, "Scl3"),
			"IfcCartesianTransformationOperator3DnonUniform.Scl3 must be greater than 0.",
		);
	},
);

// `IfcChiller_CorrectPredefinedType` (line 5734).
const IfcChiller_CorrectPredefinedType = entityRule("IfcChiller", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcChiller: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcChiller_CorrectTypeAssigned` (line 5744).
const IfcChiller_CorrectTypeAssigned = entityRule("IfcChiller", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcChillerType"),
		"IfcChiller: if IsTypedBy is given, its RelatingType must be an IfcChillerType.",
	);
});

// `IfcChillerType_CorrectPredefinedType` (line 5754).
const IfcChillerType_CorrectPredefinedType = entityRule("IfcChillerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcChillerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcChimney_CorrectPredefinedType` (line 5764).
const IfcChimney_CorrectPredefinedType = entityRule("IfcChimney", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcChimney: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcChimney_CorrectTypeAssigned` (line 5774).
const IfcChimney_CorrectTypeAssigned = entityRule("IfcChimney", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcChimneyType"),
		"IfcChimney: if IsTypedBy is given, its RelatingType must be an IfcChimneyType.",
	);
});

// `IfcChimneyType_CorrectPredefinedType` (line 5784).
const IfcChimneyType_CorrectPredefinedType = entityRule("IfcChimneyType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcChimneyType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCircleHollowProfileDef_WR1` (line 5794): `WallThickness < Radius`.
const IfcCircleHollowProfileDef_WR1 = entityRule("IfcCircleHollowProfileDef", "WR1", (self) => {
	const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE);
	const radius = expressGetAttr(self, "Radius", INDETERMINATE);
	assertWhereRule(triLt(wallThickness, radius), "IfcCircleHollowProfileDef.WallThickness must be less than Radius.");
});

// `IfcCoil_CorrectPredefinedType` (line 5804).
const IfcCoil_CorrectPredefinedType = entityRule("IfcCoil", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCoil: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCoil_CorrectTypeAssigned` (line 5814).
const IfcCoil_CorrectTypeAssigned = entityRule("IfcCoil", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCoilType"),
		"IfcCoil: if IsTypedBy is given, its RelatingType must be an IfcCoilType.",
	);
});

// `IfcCoilType_CorrectPredefinedType` (line 5824).
const IfcCoilType_CorrectPredefinedType = entityRule("IfcCoilType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCoilType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcColumn_CorrectPredefinedType` (line 5834).
const IfcColumn_CorrectPredefinedType = entityRule("IfcColumn", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcColumn: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcColumn_CorrectTypeAssigned` (line 5844).
const IfcColumn_CorrectTypeAssigned = entityRule("IfcColumn", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcColumnType"),
		"IfcColumn: if IsTypedBy is given, its RelatingType must be an IfcColumnType.",
	);
});

// `IfcColumnStandardCase_HasMaterialProfileSetUsage` (line 5854): byte-identical shape to
// chunk 1's own `IfcBeamStandardCase_HasMaterialProfileSetUsage`. **Retrofitted (Phase EX-4,
// IFC4 chunk 4) to call the new `hasSoleMaterialUsage` shared helper** -- see that helper's
// own doc comment (this chunk's section, below) for the full disclosure of the 3rd/4th
// occurrence that crossed this project's own 3-occurrence factoring threshold.
const IfcColumnStandardCase_HasMaterialProfileSetUsage = entityRule(
	"IfcColumnStandardCase",
	"HasMaterialProfileSetUsage",
	(self) => {
		assertWhereRule(
			hasSoleMaterialUsage(self, "ifc4.ifcmaterialprofilesetusage"),
			"IfcColumnStandardCase: must be associated with exactly one IfcRelAssociatesMaterial whose RelatingMaterial is an IfcMaterialProfileSetUsage.",
		);
	},
);

// `IfcColumnType_CorrectPredefinedType` (line 5863).
const IfcColumnType_CorrectPredefinedType = entityRule("IfcColumnType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcColumnType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCommunicationsAppliance_CorrectPredefinedType` (line 5873).
const IfcCommunicationsAppliance_CorrectPredefinedType = entityRule(
	"IfcCommunicationsAppliance",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcCommunicationsAppliance: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcCommunicationsAppliance_CorrectTypeAssigned` (line 5883).
const IfcCommunicationsAppliance_CorrectTypeAssigned = entityRule(
	"IfcCommunicationsAppliance",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcCommunicationsApplianceType"),
			"IfcCommunicationsAppliance: if IsTypedBy is given, its RelatingType must be an IfcCommunicationsApplianceType.",
		);
	},
);

// `IfcCommunicationsApplianceType_CorrectPredefinedType` (line 5893).
const IfcCommunicationsApplianceType_CorrectPredefinedType = entityRule(
	"IfcCommunicationsApplianceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcCommunicationsApplianceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcComplexProperty_WR21` (line 5903): `sizeof([temp for temp in HasProperties if self ==
// temp]) == 0`.
const IfcComplexProperty_WR21 = entityRule("IfcComplexProperty", "WR21", (self) => {
	assertWhereRule(
		containsSelfReference(self, "HasProperties"),
		"IfcComplexProperty.HasProperties must not contain self.",
	);
});

// `IfcComplexProperty_WR22` (line 5913): `IfcUniquePropertyName(HasProperties)`.
const IfcComplexProperty_WR22 = entityRule("IfcComplexProperty", "WR22", (self) => {
	const hasProperties = expressGetAttr(self, "HasProperties", INDETERMINATE);
	assertWhereRule(
		ifcUniquePropertyName(hasProperties),
		"IfcComplexProperty.HasProperties: every member must have a distinct Name.",
	);
});

// `IfcComplexPropertyTemplate_UniquePropertyNames` (line 5923):
// `IfcUniquePropertyTemplateNames(HasPropertyTemplates)`.
const IfcComplexPropertyTemplate_UniquePropertyNames = entityRule(
	"IfcComplexPropertyTemplate",
	"UniquePropertyNames",
	(self) => {
		const hasPropertyTemplates = expressGetAttr(self, "HasPropertyTemplates", INDETERMINATE);
		assertWhereRule(
			ifcUniquePropertyTemplateNames(hasPropertyTemplates),
			"IfcComplexPropertyTemplate.HasPropertyTemplates: every member must have a distinct Name.",
		);
	},
);

// `IfcComplexPropertyTemplate_NoSelfReference` (line 5933): `sizeof([temp for temp in
// HasPropertyTemplates if self == temp]) == 0` -- same shape as `IfcComplexProperty_WR21`
// above (2nd occurrence, factored as `containsSelfReference`).
const IfcComplexPropertyTemplate_NoSelfReference = entityRule(
	"IfcComplexPropertyTemplate",
	"NoSelfReference",
	(self) => {
		assertWhereRule(
			containsSelfReference(self, "HasPropertyTemplates"),
			"IfcComplexPropertyTemplate.HasPropertyTemplates must not contain self.",
		);
	},
);

// `IfcCompositeCurve_CurveContinuous` (line 5943): `(not ClosedCurve and sizeof([temp for
// temp in Segments if temp.Transition == discontinuous]) == 1) or (ClosedCurve and
// sizeof([...]) == 0)` -- `discontinuous` is the bare, lowercase `IfcTransitionCode.
// DISCONTINUOUS` enum member real Python's `enum_namespace` re-exports at module scope
// (see this file's own header comment on why that mechanism isn't ported -- every other
// ported rule's enum comparisons already use the plain uppercase member-name string
// directly, e.g. `"USERDEFINED"`/`"AREA"`; same substitution here: `"DISCONTINUOUS"`).
// `ClosedCurve` is a DERIVE attribute (`calc_IfcCompositeCurve_ClosedCurve`, Phase EX-2) --
// `not ClosedCurve` uses `pyNot` per this file's own "how to read a rule" convention. The
// two branches share the identical filter predicate; computed once here (a disclosed,
// behavior-preserving simplification -- real Python's own generated body repeats the
// comprehension verbatim instead of caching it).
const IfcCompositeCurve_CurveContinuous = entityRule("IfcCompositeCurve", "CurveContinuous", (self) => {
	const segments = expressGetAttr(self, "Segments", INDETERMINATE);
	const items = isIndeterminate(segments) ? [] : (segments as EntityInstance[]);
	const closedCurve = expressGetAttr(self, "ClosedCurve", INDETERMINATE) as Tri;
	const discontinuousCount = items.filter(
		(temp) => triEq(expressGetAttr(temp, "Transition", INDETERMINATE), "DISCONTINUOUS") === true,
	).length;
	assertWhereRule(
		pyOr(
			pyAnd(pyNot(closedCurve), () => triEq(discontinuousCount, 1)),
			() => pyAnd(closedCurve, () => triEq(discontinuousCount, 0)),
		),
		"IfcCompositeCurve: an open curve must have exactly one DISCONTINUOUS-transition segment, a closed curve must have none.",
	);
});

// `IfcCompositeCurve_SameDim` (line 5954): `sizeof([temp for temp in Segments if temp.Dim !=
// Segments[0].Dim]) == 0` -- the same "every member shares the first member's own attribute
// value" shape as chunk 1's own `IfcBSplineCurve_SameDim` (not retrofitted there) and this
// chunk's own `IfcCompositeProfileDef_InvariantProfileType` below -- 3 occurrences across
// the file now (the 3-occurrence threshold this project's own task brief calls for),
// factored here as `allShareFirstAttr`.
const IfcCompositeCurve_SameDim = entityRule("IfcCompositeCurve", "SameDim", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "Segments", "Dim"),
		"IfcCompositeCurve: every Segments member must share the first member's Dim.",
	);
});

// `IfcCompositeCurveOnSurface_SameSurface` (line 5973): `sizeof(BasisSurface) > 0` --
// `BasisSurface` is the DERIVE attribute (`calc_IfcCompositeCurveOnSurface_BasisSurface` ->
// `IfcGetBasisSurface`, Phase EX-2 -- itself flagged as containing a real, disclosed
// upstream bug for some call shapes; this rule's own check is unaffected either way, a
// bare `sizeof(...) > 0`).
const IfcCompositeCurveOnSurface_SameSurface = entityRule("IfcCompositeCurveOnSurface", "SameSurface", (self) => {
	const basisSurface = expressGetAttr(self, "BasisSurface", INDETERMINATE);
	assertWhereRule(triGt(sizeof(basisSurface), 0), "IfcCompositeCurveOnSurface.BasisSurface must be non-empty.");
});

// `IfcCompositeCurveSegment_ParentIsBoundedCurve` (line 5986): `'ifc4.ifcboundedcurve' in
// typeof(ParentCurve)`.
const IfcCompositeCurveSegment_ParentIsBoundedCurve = entityRule(
	"IfcCompositeCurveSegment",
	"ParentIsBoundedCurve",
	(self) => {
		const parentCurve = expressGetAttr(self, "ParentCurve", INDETERMINATE);
		assertWhereRule(
			typeOfAttr(parentCurve).has("ifc4.ifcboundedcurve"),
			"IfcCompositeCurveSegment.ParentCurve must be an IfcBoundedCurve.",
		);
	},
);

// `IfcCompositeProfileDef_InvariantProfileType` (line 6000): `sizeof([temp for temp in
// Profiles if temp.ProfileType != Profiles[0].ProfileType]) == 0` -- see
// `IfcCompositeCurve_SameDim`'s own comment above for why this is factored as
// `allShareFirstAttr` (this is the 3rd of the 3 occurrences that met the threshold).
const IfcCompositeProfileDef_InvariantProfileType = entityRule(
	"IfcCompositeProfileDef",
	"InvariantProfileType",
	(self) => {
		assertWhereRule(
			allShareFirstAttr(self, "Profiles", "ProfileType"),
			"IfcCompositeProfileDef: every Profiles member must share the first member's ProfileType.",
		);
	},
);

// `IfcCompositeProfileDef_NoRecursion` (line 6010): `sizeof([temp for temp in Profiles if
// 'ifc4.ifccompositeprofiledef' in typeof(temp)]) == 0`.
const IfcCompositeProfileDef_NoRecursion = entityRule("IfcCompositeProfileDef", "NoRecursion", (self) => {
	const profiles = expressGetAttr(self, "Profiles", INDETERMINATE);
	const items = isIndeterminate(profiles) ? [] : (profiles as EntityInstance[]);
	const violating = items.filter((temp) => typeOfAttr(temp).has("ifc4.ifccompositeprofiledef")).length;
	assertWhereRule(violating === 0, "IfcCompositeProfileDef.Profiles must not contain another IfcCompositeProfileDef.");
});

// `IfcCompressor_CorrectPredefinedType` (line 6020).
const IfcCompressor_CorrectPredefinedType = entityRule("IfcCompressor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCompressor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCompressor_CorrectTypeAssigned` (line 6030).
const IfcCompressor_CorrectTypeAssigned = entityRule("IfcCompressor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCompressorType"),
		"IfcCompressor: if IsTypedBy is given, its RelatingType must be an IfcCompressorType.",
	);
});

// `IfcCompressorType_CorrectPredefinedType` (line 6040).
const IfcCompressorType_CorrectPredefinedType = entityRule("IfcCompressorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCompressorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCondenser_CorrectPredefinedType` (line 6050).
const IfcCondenser_CorrectPredefinedType = entityRule("IfcCondenser", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCondenser: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCondenser_CorrectTypeAssigned` (line 6060).
const IfcCondenser_CorrectTypeAssigned = entityRule("IfcCondenser", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCondenserType"),
		"IfcCondenser: if IsTypedBy is given, its RelatingType must be an IfcCondenserType.",
	);
});

// `IfcCondenserType_CorrectPredefinedType` (line 6070).
const IfcCondenserType_CorrectPredefinedType = entityRule("IfcCondenserType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCondenserType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcConstraint_WR11` (line 6080): `ConstraintGrade != USERDEFINED or (ConstraintGrade ==
// USERDEFINED and exists(UserDefinedGrade))` -- the mandatory-attribute
// `userDefinedOrHasAttribute` shape already established in this file (chunk 1).
const IfcConstraint_WR11 = entityRule("IfcConstraint", "WR11", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "ConstraintGrade", "UserDefinedGrade"),
		"IfcConstraint: if ConstraintGrade is USERDEFINED, UserDefinedGrade must be given.",
	);
});

// `IfcConstructionEquipmentResource_CorrectPredefinedType` (line 6090).
const IfcConstructionEquipmentResource_CorrectPredefinedType = entityRule(
	"IfcConstructionEquipmentResource",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcConstructionEquipmentResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcConstructionEquipmentResourceType_CorrectPredefinedType` (line 6100).
const IfcConstructionEquipmentResourceType_CorrectPredefinedType = entityRule(
	"IfcConstructionEquipmentResourceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ResourceType", false),
			"IfcConstructionEquipmentResourceType: if PredefinedType is USERDEFINED, ResourceType must be given.",
		);
	},
);

// `IfcConstructionMaterialResource_CorrectPredefinedType` (line 6110).
const IfcConstructionMaterialResource_CorrectPredefinedType = entityRule(
	"IfcConstructionMaterialResource",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcConstructionMaterialResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcConstructionMaterialResourceType_CorrectPredefinedType` (line 6120).
const IfcConstructionMaterialResourceType_CorrectPredefinedType = entityRule(
	"IfcConstructionMaterialResourceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ResourceType", false),
			"IfcConstructionMaterialResourceType: if PredefinedType is USERDEFINED, ResourceType must be given.",
		);
	},
);

// `IfcConstructionProductResource_CorrectPredefinedType` (line 6130).
const IfcConstructionProductResource_CorrectPredefinedType = entityRule(
	"IfcConstructionProductResource",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcConstructionProductResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcConstructionProductResourceType_CorrectPredefinedType` (line 6140).
const IfcConstructionProductResourceType_CorrectPredefinedType = entityRule(
	"IfcConstructionProductResourceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ResourceType", false),
			"IfcConstructionProductResourceType: if PredefinedType is USERDEFINED, ResourceType must be given.",
		);
	},
);

// `IfcController_CorrectPredefinedType` (line 6150).
const IfcController_CorrectPredefinedType = entityRule("IfcController", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcController: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcController_CorrectTypeAssigned` (line 6160).
const IfcController_CorrectTypeAssigned = entityRule("IfcController", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcControllerType"),
		"IfcController: if IsTypedBy is given, its RelatingType must be an IfcControllerType.",
	);
});

// `IfcControllerType_CorrectPredefinedType` (line 6170).
const IfcControllerType_CorrectPredefinedType = entityRule("IfcControllerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcControllerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCooledBeam_CorrectPredefinedType` (line 6180).
const IfcCooledBeam_CorrectPredefinedType = entityRule("IfcCooledBeam", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCooledBeam: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCooledBeam_CorrectTypeAssigned` (line 6190).
const IfcCooledBeam_CorrectTypeAssigned = entityRule("IfcCooledBeam", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCooledBeamType"),
		"IfcCooledBeam: if IsTypedBy is given, its RelatingType must be an IfcCooledBeamType.",
	);
});

// `IfcCooledBeamType_CorrectPredefinedType` (line 6200).
const IfcCooledBeamType_CorrectPredefinedType = entityRule("IfcCooledBeamType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCooledBeamType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCoolingTower_CorrectPredefinedType` (line 6210).
const IfcCoolingTower_CorrectPredefinedType = entityRule("IfcCoolingTower", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCoolingTower: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCoolingTower_CorrectTypeAssigned` (line 6220).
const IfcCoolingTower_CorrectTypeAssigned = entityRule("IfcCoolingTower", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCoolingTowerType"),
		"IfcCoolingTower: if IsTypedBy is given, its RelatingType must be an IfcCoolingTowerType.",
	);
});

// `IfcCoolingTowerType_CorrectPredefinedType` (line 6230).
const IfcCoolingTowerType_CorrectPredefinedType = entityRule("IfcCoolingTowerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCoolingTowerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCovering_CorrectPredefinedType` (line 6240).
const IfcCovering_CorrectPredefinedType = entityRule("IfcCovering", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCovering: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCovering_CorrectTypeAssigned` (line 6250).
const IfcCovering_CorrectTypeAssigned = entityRule("IfcCovering", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCoveringType"),
		"IfcCovering: if IsTypedBy is given, its RelatingType must be an IfcCoveringType.",
	);
});

// `IfcCoveringType_CorrectPredefinedType` (line 6260).
const IfcCoveringType_CorrectPredefinedType = entityRule("IfcCoveringType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCoveringType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCrewResource_CorrectPredefinedType` (line 6270).
const IfcCrewResource_CorrectPredefinedType = entityRule("IfcCrewResource", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCrewResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCrewResourceType_CorrectPredefinedType` (line 6280).
const IfcCrewResourceType_CorrectPredefinedType = entityRule("IfcCrewResourceType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ResourceType", false),
		"IfcCrewResourceType: if PredefinedType is USERDEFINED, ResourceType must be given.",
	);
});

// `IfcCurtainWall_CorrectPredefinedType` (line 6293).
const IfcCurtainWall_CorrectPredefinedType = entityRule("IfcCurtainWall", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCurtainWall: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCurtainWall_CorrectTypeAssigned` (line 6303).
const IfcCurtainWall_CorrectTypeAssigned = entityRule("IfcCurtainWall", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCurtainWallType"),
		"IfcCurtainWall: if IsTypedBy is given, its RelatingType must be an IfcCurtainWallType.",
	);
});

// `IfcCurtainWallType_CorrectPredefinedType` (line 6313).
const IfcCurtainWallType_CorrectPredefinedType = entityRule("IfcCurtainWallType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCurtainWallType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCurveStyle_MeasureOfWidth` (line 6326): `not exists(CurveWidth) or
// 'ifc4.ifcpositivelengthmeasure' in typeof(CurveWidth) or ('ifc4.ifcdescriptivemeasure' in
// typeof(CurveWidth) and CurveWidth == 'by layer')`.
const IfcCurveStyle_MeasureOfWidth = entityRule("IfcCurveStyle", "MeasureOfWidth", (self) => {
	const curveWidth = expressGetAttr(self, "CurveWidth", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(curveWidth), () =>
			pyOr(typeOfAttr(curveWidth).has("ifc4.ifcpositivelengthmeasure"), () =>
				pyAnd(typeOfAttr(curveWidth).has("ifc4.ifcdescriptivemeasure"), () => triEq(curveWidth, "by layer")),
			),
		),
		"IfcCurveStyle: if CurveWidth is given, it must be an IfcPositiveLengthMeasure, or an IfcDescriptiveMeasure equal to 'by layer'.",
	);
});

// `IfcCurveStyle_IdentifiableCurveStyle` (line 6336): `exists(CurveFont) or
// exists(CurveWidth) or exists(CurveColour)`.
const IfcCurveStyle_IdentifiableCurveStyle = entityRule("IfcCurveStyle", "IdentifiableCurveStyle", (self) => {
	const curveFont = expressGetAttr(self, "CurveFont", INDETERMINATE);
	const curveWidth = expressGetAttr(self, "CurveWidth", INDETERMINATE);
	const curveColour = expressGetAttr(self, "CurveColour", INDETERMINATE);
	assertWhereRule(
		exists(curveFont) || exists(curveWidth) || exists(curveColour),
		"IfcCurveStyle: at least one of CurveFont, CurveWidth, CurveColour must be given.",
	);
});

// `IfcCurveStyleFontPattern_VisibleLengthGreaterEqualZero` (line 6348):
// `VisibleSegmentLength >= 0.0`.
const IfcCurveStyleFontPattern_VisibleLengthGreaterEqualZero = entityRule(
	"IfcCurveStyleFontPattern",
	"VisibleLengthGreaterEqualZero",
	(self) => {
		const visibleSegmentLength = expressGetAttr(self, "VisibleSegmentLength", INDETERMINATE);
		assertWhereRule(
			triGe(visibleSegmentLength, 0.0),
			"IfcCurveStyleFontPattern.VisibleSegmentLength must be greater than or equal to 0.",
		);
	},
);

// `IfcDamper_CorrectPredefinedType` (line 6358).
const IfcDamper_CorrectPredefinedType = entityRule("IfcDamper", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDamper: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDamper_CorrectTypeAssigned` (line 6368).
const IfcDamper_CorrectTypeAssigned = entityRule("IfcDamper", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDamperType"),
		"IfcDamper: if IsTypedBy is given, its RelatingType must be an IfcDamperType.",
	);
});

// `IfcDamperType_CorrectPredefinedType` (line 6378).
const IfcDamperType_CorrectPredefinedType = entityRule("IfcDamperType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDamperType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDerivedProfileDef_InvariantProfileType` (line 6388): `ProfileType ==
// ParentProfile.ProfileType`.
const IfcDerivedProfileDef_InvariantProfileType = entityRule("IfcDerivedProfileDef", "InvariantProfileType", (self) => {
	const parentProfile = expressGetAttr(self, "ParentProfile", INDETERMINATE);
	assertWhereRule(
		triEq(
			expressGetAttr(self, "ProfileType", INDETERMINATE),
			expressGetAttr(parentProfile, "ProfileType", INDETERMINATE),
		),
		"IfcDerivedProfileDef.ProfileType must equal ParentProfile.ProfileType.",
	);
});

// `IfcDerivedUnit_WR1` (line 6398): `sizeof(Elements) > 1 or (sizeof(Elements) == 1 and
// Elements[0].Exponent != 1)`.
const IfcDerivedUnit_WR1 = entityRule("IfcDerivedUnit", "WR1", (self) => {
	const elements = expressGetAttr(self, "Elements", INDETERMINATE);
	assertWhereRule(
		pyOr(triGt(sizeof(elements), 1), () =>
			pyAnd(triEq(sizeof(elements), 1), () =>
				triNe(
					expressGetAttr(
						expressGetItem(elements, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
						"Exponent",
						INDETERMINATE,
					),
					1,
				),
			),
		),
		"IfcDerivedUnit: must have more than one Elements member, or exactly one whose Exponent is not 1.",
	);
});

// `IfcDerivedUnit_WR2` (line 6408): `UnitType != USERDEFINED or (UnitType == USERDEFINED
// and exists(UserDefinedType))` -- the mandatory-attribute `userDefinedOrHasAttribute`
// shape.
const IfcDerivedUnit_WR2 = entityRule("IfcDerivedUnit", "WR2", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "UnitType", "UserDefinedType"),
		"IfcDerivedUnit: if UnitType is USERDEFINED, UserDefinedType must be given.",
	);
});

// `IfcDirection_MagnitudeGreaterZero` (line 6422): `sizeof([tmp for tmp in DirectionRatios
// if tmp != 0.0]) > 0` -- `DirectionRatios` members are mandatory `REAL`s (never
// indeterminate when the list itself is non-empty), so a plain `!==` suffices.
const IfcDirection_MagnitudeGreaterZero = entityRule("IfcDirection", "MagnitudeGreaterZero", (self) => {
	const directionRatios = expressGetAttr(self, "DirectionRatios", INDETERMINATE);
	const items = isIndeterminate(directionRatios) ? [] : (directionRatios as number[]);
	const nonZeroCount = items.filter((tmp) => tmp !== 0.0).length;
	assertWhereRule(nonZeroCount > 0, "IfcDirection.DirectionRatios must have at least one non-zero component.");
});

// `IfcDiscreteAccessory_CorrectPredefinedType` (line 6436).
const IfcDiscreteAccessory_CorrectPredefinedType = entityRule(
	"IfcDiscreteAccessory",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcDiscreteAccessory: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcDiscreteAccessory_CorrectTypeAssigned` (line 6446).
const IfcDiscreteAccessory_CorrectTypeAssigned = entityRule("IfcDiscreteAccessory", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDiscreteAccessoryType"),
		"IfcDiscreteAccessory: if IsTypedBy is given, its RelatingType must be an IfcDiscreteAccessoryType.",
	);
});

// `IfcDiscreteAccessoryType_CorrectPredefinedType` (line 6456).
const IfcDiscreteAccessoryType_CorrectPredefinedType = entityRule(
	"IfcDiscreteAccessoryType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcDiscreteAccessoryType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcDistributionChamberElement_CorrectPredefinedType` (line 6466).
const IfcDistributionChamberElement_CorrectPredefinedType = entityRule(
	"IfcDistributionChamberElement",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcDistributionChamberElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcDistributionChamberElement_CorrectTypeAssigned` (line 6476).
const IfcDistributionChamberElement_CorrectTypeAssigned = entityRule(
	"IfcDistributionChamberElement",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcDistributionChamberElementType"),
			"IfcDistributionChamberElement: if IsTypedBy is given, its RelatingType must be an IfcDistributionChamberElementType.",
		);
	},
);

// `IfcDistributionChamberElementType_CorrectPredefinedType` (line 6486).
const IfcDistributionChamberElementType_CorrectPredefinedType = entityRule(
	"IfcDistributionChamberElementType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcDistributionChamberElementType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcDocumentReference_WR1` (line 6496): `exists(Name) ^ exists(ReferencedDocument)` --
// both operands are already-definite booleans (`exists()` never returns `Tri`), so this is
// a plain JS `!==` (matching chunk 1's own reduction precedent for `^` between two `exists()`
// calls, e.g. `IfcAxis2Placement3D_AxisAndRefDirProvision`) -- exactly one of the two must
// be given.
const IfcDocumentReference_WR1 = entityRule("IfcDocumentReference", "WR1", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	const referencedDocument = expressGetAttr(self, "ReferencedDocument", INDETERMINATE);
	assertWhereRule(
		exists(name) !== exists(referencedDocument),
		"IfcDocumentReference: exactly one of Name or ReferencedDocument must be given.",
	);
});

// `IfcDoor_CorrectStyleAssigned` (line 6507) (real `RULE_NAME` is `'CorrectStyleAssigned'`, not the usual `'CorrectTypeAssigned'` -- registered under its own real name, body shape is identical).
const IfcDoor_CorrectStyleAssigned = entityRule("IfcDoor", "CorrectStyleAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDoorType"),
		"IfcDoor: if IsTypedBy is given, its RelatingType must be an IfcDoorType.",
	);
});

// `IfcDoorLiningProperties_WR31` (line 6517): `not (exists(LiningDepth) and (not
// exists(LiningThickness)))` -- a plain implication, `LiningDepth` given implies
// `LiningThickness` given: `!exists(LiningDepth) or exists(LiningThickness)`.
const IfcDoorLiningProperties_WR31 = entityRule("IfcDoorLiningProperties", "WR31", (self) => {
	const liningDepth = expressGetAttr(self, "LiningDepth", INDETERMINATE);
	const liningThickness = expressGetAttr(self, "LiningThickness", INDETERMINATE);
	assertWhereRule(
		!exists(liningDepth) || exists(liningThickness),
		"IfcDoorLiningProperties: if LiningDepth is given, LiningThickness must be given.",
	);
});

// `IfcDoorLiningProperties_WR32` (line 6528): `not (exists(ThresholdDepth) and (not
// exists(ThresholdThickness)))` -- same implication shape as WR31 above.
const IfcDoorLiningProperties_WR32 = entityRule("IfcDoorLiningProperties", "WR32", (self) => {
	const thresholdDepth = expressGetAttr(self, "ThresholdDepth", INDETERMINATE);
	const thresholdThickness = expressGetAttr(self, "ThresholdThickness", INDETERMINATE);
	assertWhereRule(
		!exists(thresholdDepth) || exists(thresholdThickness),
		"IfcDoorLiningProperties: if ThresholdDepth is given, ThresholdThickness must be given.",
	);
});

// `IfcDoorLiningProperties_WR33` (line 6539): `(exists(TransomOffset) and
// exists(TransomThickness)) ^ (not exists(TransomOffset) and (not
// exists(TransomThickness)))` -- from first principles: let A = exists(TransomOffset), B =
// exists(TransomThickness). The expression is `(A && B) XOR (!A && !B)`, which is true
// exactly when A and B agree (both true, or both false) -- i.e. it reduces to `A === B`,
// the same XNOR reduction chunk 1's own `IfcAxis2Placement3D_AxisAndRefDirProvision`
// already established for a differently-shaped (but equivalent-intent) real source
// expression.
const IfcDoorLiningProperties_WR33 = entityRule("IfcDoorLiningProperties", "WR33", (self) => {
	const transomOffset = expressGetAttr(self, "TransomOffset", INDETERMINATE);
	const transomThickness = expressGetAttr(self, "TransomThickness", INDETERMINATE);
	assertWhereRule(
		exists(transomOffset) === exists(transomThickness),
		"IfcDoorLiningProperties: TransomOffset and TransomThickness must either both be given or both be omitted.",
	);
});

// `IfcDoorLiningProperties_WR34` (line 6550): `(exists(CasingDepth) and
// exists(CasingThickness)) ^ (not exists(CasingDepth) and (not exists(CasingThickness)))` --
// same XNOR reduction as WR33 above (`A === B`).
const IfcDoorLiningProperties_WR34 = entityRule("IfcDoorLiningProperties", "WR34", (self) => {
	const casingDepth = expressGetAttr(self, "CasingDepth", INDETERMINATE);
	const casingThickness = expressGetAttr(self, "CasingThickness", INDETERMINATE);
	assertWhereRule(
		exists(casingDepth) === exists(casingThickness),
		"IfcDoorLiningProperties: CasingDepth and CasingThickness must either both be given or both be omitted.",
	);
});

// `IfcDoorLiningProperties_WR35` (line 6561): `exists(lambda: DefinesType[0]) and
// ('ifc4.ifcdoortype' in typeof(DefinesType[0]) or 'ifc4.ifcdoorstyle' in
// typeof(DefinesType[0]))` -- byte-identical to `IfcDoorPanelProperties_ApplicableToType`
// below, factored as `definesTypeIsDoorTypeOrStyle`.
const IfcDoorLiningProperties_WR35 = entityRule("IfcDoorLiningProperties", "WR35", (self) => {
	assertWhereRule(
		definesTypeIsDoorTypeOrStyle(self),
		"IfcDoorLiningProperties: DefinesType[0] must be an IfcDoorType or IfcDoorStyle.",
	);
});

// `IfcDoorPanelProperties_ApplicableToType` (line 6570): byte-identical body to
// `IfcDoorLiningProperties_WR35` above -- see that rule's own comment.
const IfcDoorPanelProperties_ApplicableToType = entityRule("IfcDoorPanelProperties", "ApplicableToType", (self) => {
	assertWhereRule(
		definesTypeIsDoorTypeOrStyle(self),
		"IfcDoorPanelProperties: DefinesType[0] must be an IfcDoorType or IfcDoorStyle.",
	);
});

// `IfcDoorType_CorrectPredefinedType` (line 6579).
const IfcDoorType_CorrectPredefinedType = entityRule("IfcDoorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDoorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDraughtingPreDefinedColour_PreDefinedColourNames` (line 6589):
// `express_getattr(Name, 'lower', INDETERMINATE)() in [...]` -- real Python's own generic
// `getattr(obj, name, default)` resolving to the plain Python string's own bound `.lower()`
// method (since `Name` is a plain string here, not an `entity_instance`) and calling it --
// ported directly as `.toLowerCase()`, this port's own established equivalent for every
// other `self.toLowerCase()`-shaped type-scope rule (e.g. chunk 1's `IfcFontStyle_WR1`),
// just reading a named attribute first instead of taking the bare value as `self`.
const IfcDraughtingPreDefinedColour_PreDefinedColourNames = entityRule(
	"IfcDraughtingPreDefinedColour",
	"PreDefinedColourNames",
	(self) => {
		const name = expressGetAttr(self, "Name", INDETERMINATE) as string;
		assertWhereRule(
			["black", "red", "green", "blue", "yellow", "magenta", "cyan", "white", "by layer"].includes(name.toLowerCase()),
			"IfcDraughtingPreDefinedColour.Name must be one of the 9 documented colour keywords (case-insensitive).",
		);
	},
);

// `IfcDraughtingPreDefinedCurveFont_PreDefinedCurveFontNames` (line 6598): same
// `.lower()`-on-`Name` shape as `IfcDraughtingPreDefinedColour_PreDefinedColourNames` above,
// different keyword list.
const IfcDraughtingPreDefinedCurveFont_PreDefinedCurveFontNames = entityRule(
	"IfcDraughtingPreDefinedCurveFont",
	"PreDefinedCurveFontNames",
	(self) => {
		const name = expressGetAttr(self, "Name", INDETERMINATE) as string;
		assertWhereRule(
			["continuous", "chain", "chain double dash", "dashed", "dotted", "by layer"].includes(name.toLowerCase()),
			"IfcDraughtingPreDefinedCurveFont.Name must be one of the 6 documented curve-font keywords (case-insensitive).",
		);
	},
);

// `IfcDuctFitting_CorrectPredefinedType` (line 6607).
const IfcDuctFitting_CorrectPredefinedType = entityRule("IfcDuctFitting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDuctFitting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDuctFitting_CorrectTypeAssigned` (line 6617).
const IfcDuctFitting_CorrectTypeAssigned = entityRule("IfcDuctFitting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDuctFittingType"),
		"IfcDuctFitting: if IsTypedBy is given, its RelatingType must be an IfcDuctFittingType.",
	);
});

registerSchemaRules("IFC4", [
	IfcBuildingElementProxy_HasObjectName,
	IfcBuildingElementProxy_CorrectPredefinedType,
	IfcBuildingElementProxy_CorrectTypeAssigned,
	IfcBuildingElementProxyType_CorrectPredefinedType,
	IfcBurner_CorrectPredefinedType,
	IfcBurner_CorrectTypeAssigned,
	IfcBurnerType_CorrectPredefinedType,
	IfcCShapeProfileDef_ValidGirth,
	IfcCShapeProfileDef_ValidInternalFilletRadius,
	IfcCShapeProfileDef_ValidWallThickness,
	IfcCableCarrierFitting_CorrectPredefinedType,
	IfcCableCarrierFitting_CorrectTypeAssigned,
	IfcCableCarrierFittingType_CorrectPredefinedType,
	IfcCableCarrierSegment_CorrectPredefinedType,
	IfcCableCarrierSegment_CorrectTypeAssigned,
	IfcCableCarrierSegmentType_CorrectPredefinedType,
	IfcCableFitting_CorrectPredefinedType,
	IfcCableFitting_CorrectTypeAssigned,
	IfcCableFittingType_CorrectPredefinedType,
	IfcCableSegment_CorrectPredefinedType,
	IfcCableSegment_CorrectTypeAssigned,
	IfcCableSegmentType_CorrectPredefinedType,
	IfcCartesianPoint_CP2Dor3D,
	IfcCartesianTransformationOperator_ScaleGreaterZero,
	IfcCartesianTransformationOperator2D_DimEqual2,
	IfcCartesianTransformationOperator2D_Axis1Is2D,
	IfcCartesianTransformationOperator2D_Axis2Is2D,
	IfcCartesianTransformationOperator2DnonUniform_Scale2GreaterZero,
	IfcCartesianTransformationOperator3D_DimIs3D,
	IfcCartesianTransformationOperator3D_Axis1Is3D,
	IfcCartesianTransformationOperator3D_Axis2Is3D,
	IfcCartesianTransformationOperator3D_Axis3Is3D,
	IfcCartesianTransformationOperator3DnonUniform_Scale2GreaterZero,
	IfcCartesianTransformationOperator3DnonUniform_Scale3GreaterZero,
	IfcChiller_CorrectPredefinedType,
	IfcChiller_CorrectTypeAssigned,
	IfcChillerType_CorrectPredefinedType,
	IfcChimney_CorrectPredefinedType,
	IfcChimney_CorrectTypeAssigned,
	IfcChimneyType_CorrectPredefinedType,
	IfcCircleHollowProfileDef_WR1,
	IfcCoil_CorrectPredefinedType,
	IfcCoil_CorrectTypeAssigned,
	IfcCoilType_CorrectPredefinedType,
	IfcColumn_CorrectPredefinedType,
	IfcColumn_CorrectTypeAssigned,
	IfcColumnStandardCase_HasMaterialProfileSetUsage,
	IfcColumnType_CorrectPredefinedType,
	IfcCommunicationsAppliance_CorrectPredefinedType,
	IfcCommunicationsAppliance_CorrectTypeAssigned,
	IfcCommunicationsApplianceType_CorrectPredefinedType,
	IfcComplexProperty_WR21,
	IfcComplexProperty_WR22,
	IfcComplexPropertyTemplate_UniquePropertyNames,
	IfcComplexPropertyTemplate_NoSelfReference,
	IfcCompositeCurve_CurveContinuous,
	IfcCompositeCurve_SameDim,
	IfcCompositeCurveOnSurface_SameSurface,
	IfcCompositeCurveSegment_ParentIsBoundedCurve,
	IfcCompositeProfileDef_InvariantProfileType,
	IfcCompositeProfileDef_NoRecursion,
	IfcCompressor_CorrectPredefinedType,
	IfcCompressor_CorrectTypeAssigned,
	IfcCompressorType_CorrectPredefinedType,
	IfcCondenser_CorrectPredefinedType,
	IfcCondenser_CorrectTypeAssigned,
	IfcCondenserType_CorrectPredefinedType,
	IfcConstraint_WR11,
	IfcConstructionEquipmentResource_CorrectPredefinedType,
	IfcConstructionEquipmentResourceType_CorrectPredefinedType,
	IfcConstructionMaterialResource_CorrectPredefinedType,
	IfcConstructionMaterialResourceType_CorrectPredefinedType,
	IfcConstructionProductResource_CorrectPredefinedType,
	IfcConstructionProductResourceType_CorrectPredefinedType,
	IfcController_CorrectPredefinedType,
	IfcController_CorrectTypeAssigned,
	IfcControllerType_CorrectPredefinedType,
	IfcCooledBeam_CorrectPredefinedType,
	IfcCooledBeam_CorrectTypeAssigned,
	IfcCooledBeamType_CorrectPredefinedType,
	IfcCoolingTower_CorrectPredefinedType,
	IfcCoolingTower_CorrectTypeAssigned,
	IfcCoolingTowerType_CorrectPredefinedType,
	IfcCovering_CorrectPredefinedType,
	IfcCovering_CorrectTypeAssigned,
	IfcCoveringType_CorrectPredefinedType,
	IfcCrewResource_CorrectPredefinedType,
	IfcCrewResourceType_CorrectPredefinedType,
	IfcCurtainWall_CorrectPredefinedType,
	IfcCurtainWall_CorrectTypeAssigned,
	IfcCurtainWallType_CorrectPredefinedType,
	IfcCurveStyle_MeasureOfWidth,
	IfcCurveStyle_IdentifiableCurveStyle,
	IfcCurveStyleFontPattern_VisibleLengthGreaterEqualZero,
	IfcDamper_CorrectPredefinedType,
	IfcDamper_CorrectTypeAssigned,
	IfcDamperType_CorrectPredefinedType,
	IfcDerivedProfileDef_InvariantProfileType,
	IfcDerivedUnit_WR1,
	IfcDerivedUnit_WR2,
	IfcDirection_MagnitudeGreaterZero,
	IfcDiscreteAccessory_CorrectPredefinedType,
	IfcDiscreteAccessory_CorrectTypeAssigned,
	IfcDiscreteAccessoryType_CorrectPredefinedType,
	IfcDistributionChamberElement_CorrectPredefinedType,
	IfcDistributionChamberElement_CorrectTypeAssigned,
	IfcDistributionChamberElementType_CorrectPredefinedType,
	IfcDocumentReference_WR1,
	IfcDoor_CorrectStyleAssigned,
	IfcDoorLiningProperties_WR31,
	IfcDoorLiningProperties_WR32,
	IfcDoorLiningProperties_WR33,
	IfcDoorLiningProperties_WR34,
	IfcDoorLiningProperties_WR35,
	IfcDoorPanelProperties_ApplicableToType,
	IfcDoorType_CorrectPredefinedType,
	IfcDraughtingPreDefinedColour_PreDefinedColourNames,
	IfcDraughtingPreDefinedCurveFont_PreDefinedCurveFontNames,
	IfcDuctFitting_CorrectPredefinedType,
	IfcDuctFitting_CorrectTypeAssigned,
]);

// =============================================================================
// Phase EX-4, IFC4 chunk 3 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk" -- WHERE-rule classes + `rule_executor.py`): the NEXT 120 `SCOPE = 'entity'` rules,
// continuing directly from chunk 2's own last-ported rule with zero gap or overlap --
// `IfcDuctFittingType_CorrectPredefinedType` (real source line 6627) through `IfcLine_
// SameDim` (line 7852) in `src/ifcopenshell-python/ifcopenshell/express/rules/IFC4.py`.
// **Independently re-verified, not trusted from the dispatching task brief's own citation
// alone**: re-ran the same `^class (\w+)` + `SCOPE = '(\w+)'`-matching approach chunks 1/2's
// own header comments describe, confirmed exactly 120 `SCOPE = 'entity'` classes in this
// range -- `IfcDuctFitting_CorrectTypeAssigned` (chunk 2's own last rule, real source
// position 195 of 652) is immediately followed by `IfcDuctFittingType_CorrectPredefinedType`
// (position 196, this chunk's own first rule) with no gap, and this chunk's own last rule
// (`IfcLine_SameDim`, position 315) is immediately followed by `IfcLocalPlacement_WR21`
// (position 316, real source line 7863) -- explicitly excluded, reserved for chunk 4. IFC4
// now stands at 340 of 679 total WHERE-rule classes (100 from chunk 1 + 120 from chunk 2 +
// this chunk's own 120), all `SCOPE = 'entity'` (315/652 entity-scope so far).
//
// =============================================================================
// Shared shapes REUSED from chunks 1/2 (no new logic, just more call sites)
// =============================================================================
//
// **`correctTypeAssigned`** -- 27 occurrences in this chunk (`IfcDuctSegment` through
// `IfcLightFixture`).
//
// **`correctPredefinedType`** -- 59 occurrences in this chunk (29 "occurrence"-shape,
// `ObjectType`-escaped; 30 "*Type"-shape). **Both of the remaining two predicted
// escape-attribute values are sighted here for the first time, confirming chunk 1's own
// original 4-value hypothesis in full**: `"ProcessType"` (`IfcEventType_
// CorrectPredefinedType`, real source line 7052 -- 1 occurrence) and `"ResourceType"`
// (`IfcLaborResourceType_CorrectPredefinedType`, line 7782 -- 1 occurrence, alongside its
// own `IfcLaborResource_CorrectPredefinedType` "occurrence"-shape sibling at line 7772; like
// every other resource `*Type` entity, `IfcLaborResource` has no `_CorrectTypeAssigned`
// counterpart, matching chunk 2's own established resource-entity pattern). All 4
// escape-attribute values (`ObjectType`/`ElementType`/`ProcessType`/`ResourceType`) are now
// confirmed sighted across chunks 1-3.
//
// **`userDefinedOrHasAttribute`/`optionalUserDefinedOrHasAttribute`** -- 3 new occurrences
// in this chunk, all on attribute pairs OTHER than `PredefinedType`, generalizing this
// helper family beyond its original `_CorrectPredefinedType`-only motivation for the first
// time:
//   - `IfcEvent_CorrectTypeAssigned` (line 7041) -- **a real, disclosed `RULE_NAME`/body
//     mismatch**: despite its name, this rule's real body is NOT the `_CorrectTypeAssigned`
//     (`IsTypedBy`) shape at all -- it is `optionalUserDefinedOrHasAttribute` on
//     `EventTriggerType`/`UserDefinedEventTriggerType` (confirmed directly against real
//     source, not assumed from the rule/attribute name similarity alone).
//   - `IfcEventType_CorrectEventTriggerType` (line 7062) -- the mandatory-attribute analog
//     of the above, `userDefinedOrHasAttribute` on the same attribute pair. Together these
//     two mirror the exact same "occurrence entity has an optional escape-guarded attribute,
//     its `*Type` sibling has a mandatory one" pattern `PredefinedType` already has
//     elsewhere, just for `EventTriggerType` instead.
//   - `IfcGeometricRepresentationSubContext_UserTargetProvided` (line 7492) --
//     `userDefinedOrHasAttribute` on `TargetView`/`UserDefinedTargetView`.
//
// **`optionalAttrDimEquals`** -- 2 occurrences (`IfcFillAreaStyleHatching_PatternStart2D`'s
// own `PatternStart`, `_RefHatchLine2D`'s own `PointOfReferenceHatchLine`).
//
// **`attrDimEquals`** -- 1 occurrence (`IfcGridAxis_WR1`'s own `AxisCurve`).
//
// **`triXor`** -- its first real consumer, exactly as anticipated by the correction already
// recorded in that function's own `runtimeShim.ts` doc comment: `IfcGridAxis_WR2` (line
// 7561), a 3-way chained XOR over `sizeof(PartOfU/V/W) == 1`. See that rule's own inline
// comment below for the disclosed "odd count, not literally 'exactly one'" subtlety.
//
// **`ifcDirection`/`ifcDotProduct`** (`rules/ifc4.ts`, both newly `export`ed this chunk,
// exactly mirroring chunk 1's own identical `ifcCrossProduct`-export precedent) -- 1
// occurrence (`IfcExtrudedAreaSolid_ValidExtrusionDirection`, line 7085).
//
// =============================================================================
// New shared shapes factored in this chunk
// =============================================================================
//
// **`asList`** -- an aggregate-attribute-to-array coercion collapsing `INDETERMINATE` to
// `[]` before a `.filter()` call. The exact same shape `whereRules/ifc2x3.ts`'s own chunk 3
// already factored (as `asList` there too) for the identical reason (this chunk's own larger
// per-rule list-comprehension count) -- a fresh local copy here, not an import, per this
// file's own established "no cross-schema-file dependency" precedent. 5 occurrences in this
// chunk (`IfcFace_HasOuterBound`, `IfcFillAreaStyle_MaxOneColour`/`MaxOneExtHatchStyle`,
// `IfcGeometricCurveSet_NoSurfaces`, `IfcGeometricSet_ConsistentDim`), plus 1 more inside
// `ifcCorrectFillAreaStyle` below.
//
// **`attrSizeIsZero`** (3 occurrences: `IfcFeatureElementSubtraction_HasNoSubtraction`'s own
// `HasOpenings`, `_IsNotFilling`'s own `FillsVoids`, `IfcGeometricRepresentationSubContext_
// NoCoordOperation`'s own `HasCoordinateOperation`) -- Python: `sizeof(X) == 0`, `X` a
// mandatory inverse SET that must be empty. Crosses this project's own 3-occurrence
// factoring threshold.
//
// **6 new rule-file-local EXPRESS-library helpers** (real functions from `IFC4.py`'s own
// shared-helper section, none a WHERE-rule class or a `calc_*` DERIVE function, confirmed
// absent from both `rules/ifc4.ts` and `whereRules/ifc2x3.ts` -- each ported with a full doc
// comment citing its own real source line, see each function's own comment below for detail):
// `ifcLoopHeadToTail` (line 11855, `IfcEdgeLoop_IsContinuous`'s only caller),
// `ifcCorrectFillAreaStyle` (line 11588, byte-identical in shape to `whereRules/ifc2x3.ts`'s
// own already-ported version -- see that function's own doc comment for the shared
// `IfcColour`-is-a-SELECT-type dead-code finding, confirmed for IFC4 too),
// `ifcConsecutiveSegments` (line 11396), `ifcAssociatedSurface` (line 11355),
// `ifcTaperedSweptAreaProfiles` (line 12093), and `ifcUniqueQuantityNames` (line 12161 --
// a thin wrapper reusing chunk 2's own `uniquePropertyLikeNames`, since its real body is
// byte-identical in shape to `IfcUniquePropertyName`/`IfcUniquePropertyTemplateNames`,
// exactly matching that helper's own "one thin wrapper per real function name" precedent).
//
// =============================================================================
// No new real upstream Python bugs found in this chunk's own 120 rules
// =============================================================================
//
// Every rule in this chunk was read directly against its own real source body (not assumed
// from name/shape alone) -- the `IfcEvent_CorrectTypeAssigned` name/body mismatch above is a
// real, disclosed naming quirk (matching chunk 2's own analogous `IfcDoor_
// CorrectStyleAssigned` disclosure), not a logic bug: its real body is internally consistent
// and behaves exactly as its OWN shape (not its name) implies. `IfcGridAxis_WR2`'s chained
// XOR (see above) is a disclosed subtlety in what the check actually computes, not a defect
// either -- real Python computes exactly the same odd-count value this port does. No
// `IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces`-style inverted logic found anywhere in
// this chunk's own range.
// =============================================================================

/**
 * Shared shape (5+ occurrences in this chunk: `IfcFace_HasOuterBound`'s own `Bounds`,
 * `IfcFillAreaStyle_MaxOneColour`/`MaxOneExtHatchStyle`'s own `FillStyles`,
 * `IfcGeometricCurveSet_NoSurfaces`/`IfcGeometricSet_ConsistentDim`'s own `Elements`) --
 * an aggregate attribute read that must degrade to an empty array rather than propagate
 * `INDETERMINATE` into a `.filter()` call. Same exact shape (and same disclosed
 * "not previously needed until this chunk's own larger list-comprehension count"
 * rationale) as `whereRules/ifc2x3.ts`'s own already-established `asList` -- a fresh local
 * copy here, not an import, per this file family's established "no cross-schema-file
 * dependency" precedent (this file's own header comment already justifies this for
 * `entityRule`/`typeRule`/`userDefinedOrHasAttribute`).
 */
function asList<T = EntityInstance>(value: unknown): T[] {
	return isIndeterminate(value) ? [] : (value as T[]);
}

/**
 * New shared shape (3 occurrences: `IfcFeatureElementSubtraction_HasNoSubtraction`'s own
 * `HasOpenings`, `IfcFeatureElementSubtraction_IsNotFilling`'s own `FillsVoids`,
 * `IfcGeometricRepresentationSubContext_NoCoordOperation`'s own `HasCoordinateOperation`)
 * -- Python: `sizeof(X) == 0`, `X` a mandatory (never `exists`-guarded) inverse SET
 * attribute that must be empty. Crosses this project's own 3-occurrence factoring
 * threshold (the same bar chunk 2's own `allShareFirstAttr`/`containsSelfReference`
 * disclosures already established).
 */
function attrSizeIsZero(self: EntityInstance, attrName: string): Tri {
	return triEq(sizeof(expressGetAttr(self, attrName, INDETERMINATE)), 0);
}

/**
 * Python: `IfcLoopHeadToTail(aloop)` (real source line 11855):
 * ```python
 * def IfcLoopHeadToTail(aloop):
 *     p = True
 *     n = sizeof(express_getattr(aloop, 'EdgeList', INDETERMINATE))
 *     for i in range(2, n + 1):
 *         p = p and express_getattr(express_getitem(express_getattr(aloop, 'EdgeList', ...),
 *             i - 1 - EXPRESS_ONE_BASED_INDEXING, ...), 'EdgeEnd', ...) == express_getattr(
 *             express_getitem(express_getattr(aloop, 'EdgeList', ...), i - EXPRESS_ONE_BASED_INDEXING, ...),
 *             'EdgeStart', ...)
 *     return p
 * ```
 * A new rule-file-local EXPRESS-library helper -- not a WHERE-rule class or a `calc_*`
 * DERIVE function, confirmed absent from both `rules/ifc4.ts` and `whereRules/ifc2x3.ts`
 * (IFC2X3's own WHERE-rule chunks never reached its own `IfcEdgeLoop_WR2`-equivalent rule
 * yet). `p = p and (...)` is Python's own short-circuit chain -- ported via `pyAnd`'s own
 * lazy-thunk semantics, matching that function's own established short-circuit contract
 * exactly (real Python stops evaluating further comparisons once `p` is `False`; this port
 * does too, since `pyAnd`'s second argument is a thunk only invoked when the first operand
 * isn't already falsy).
 */
function ifcLoopHeadToTail(aloop: EntityInstance): Tri {
	const edgeList = expressGetAttr(aloop, "EdgeList", INDETERMINATE);
	const n = sizeof(edgeList) as number;
	let p: Tri = true;
	for (const i of expressRange(2, n + 1)) {
		const prevEdge = expressGetItem(edgeList, i - 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const curEdge = expressGetItem(edgeList, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const prevEnd = expressGetAttr(prevEdge, "EdgeEnd", INDETERMINATE);
		const curStart = expressGetAttr(curEdge, "EdgeStart", INDETERMINATE);
		p = pyAnd(p, () => triEq(prevEnd, curStart));
	}
	return p;
}

/**
 * Python: `IfcCorrectFillAreaStyle(styles)` (real source line 11588) -- **byte-identical in
 * shape to `whereRules/ifc2x3.ts`'s own already-ported `ifcCorrectFillAreaStyle`** (only the
 * `'ifc4.'` vs `'ifc2x3.'` namespace prefix differs; IFC4's own real body additionally has 4
 * dead pre-init lines -- `hatching = 0`/`tiles = 0`/`colour = 0`/`external = 0` -- all
 * unconditionally overwritten by the very next 4 lines, confirmed inert). **Same confirmed
 * dead-code finding as that file's own header comment**: `IfcColour` is a real IFC4
 * `select_type` too (verified directly against a real installed `ifcopenshell` Python
 * interpreter: `schema.declaration_by_name("IfcColour")` is a `select_type`, not an
 * `entity`) -- `typeOf()` never walks a SELECT's member list, so `colour` is always `0`
 * here (and in `IfcFillAreaStyle_MaxOneColour`'s own inline check above). Ported faithfully
 * (including the always-`0` `colour` branches), not "fixed."
 */
function ifcCorrectFillAreaStyle(styles: unknown): boolean {
	const items = asList(styles);
	const external = items.filter((style) => typeOfAttr(style).has("ifc4.ifcexternallydefinedhatchstyle")).length;
	const hatching = items.filter((style) => typeOfAttr(style).has("ifc4.ifcfillareastylehatching")).length;
	const tiles = items.filter((style) => typeOfAttr(style).has("ifc4.ifcfillareastyletiles")).length;
	const colour = items.filter((style) => typeOfAttr(style).has("ifc4.ifccolour")).length;
	if (external > 1) return false;
	if (external === 1 && (hatching > 0 || tiles > 0 || colour > 0)) return false;
	if (colour > 1) return false;
	if (hatching > 0 && tiles > 0) return false;
	return true;
}

/**
 * Python: `IfcConsecutiveSegments(segments)` (real source line 11396):
 * ```python
 * def IfcConsecutiveSegments(segments):
 *     result = True
 *     for i in range(1, hiindex(segments) - 1 + 1):
 *         if express_getitem(express_getitem(segments, i - EXPRESS_ONE_BASED_INDEXING, ...),
 *             hiindex(segments[i - EXPRESS_ONE_BASED_INDEXING]) - EXPRESS_ONE_BASED_INDEXING, ...) != express_getitem(
 *             express_getitem(segments, i + 1 - EXPRESS_ONE_BASED_INDEXING, ...), 1 - EXPRESS_ONE_BASED_INDEXING, ...):
 *             result = False
 *             break
 *     return result
 * ```
 * Each `segments` member is itself a small point-index aggregate (`IfcLineIndex`/
 * `IfcArcIndex`) -- checks that consecutive segments share their common point index (the
 * last index of segment `i` equals the first index of segment `i + 1`).
 */
function ifcConsecutiveSegments(segments: unknown): boolean {
	const n = hiIndex(segments) as number;
	for (const i of expressRange(1, n - 1 + 1)) {
		const segI = expressGetItem(segments, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const segI1 = expressGetItem(segments, i + 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const lastOfI = expressGetItem(segI, (hiIndex(segI) as number) - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const firstOfI1 = expressGetItem(segI1, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		if (lastOfI !== firstOfI1) {
			return false;
		}
	}
	return true;
}

/**
 * Python: `IfcAssociatedSurface(arg)` (real source line 11355):
 * ```python
 * def IfcAssociatedSurface(arg):
 *     surf = express_getattr(arg, 'BasisSurface', INDETERMINATE)
 *     return surf
 * ```
 */
function ifcAssociatedSurface(arg: unknown): unknown {
	return expressGetAttr(arg, "BasisSurface", INDETERMINATE);
}

/**
 * Python: `IfcTaperedSweptAreaProfiles(startarea, endarea)` (real source line 12093):
 * ```python
 * def IfcTaperedSweptAreaProfiles(startarea, endarea):
 *     result = False
 *     if 'ifc4.ifcparameterizedprofiledef' in typeof(startarea):
 *         if 'ifc4.ifcderivedprofiledef' in typeof(endarea):
 *             result = startarea == express_getattr(endarea, 'ParentProfile', INDETERMINATE)
 *         else:
 *             result = typeof(startarea) == typeof(endarea)
 *     elif 'ifc4.ifcderivedprofiledef' in typeof(endarea):
 *         result = startarea == express_getattr(endarea, 'ParentProfile', INDETERMINATE)
 *     else:
 *         result = False
 *     return result
 * ```
 * `typeof(startarea) == typeof(endarea)` is genuine `express_set` structural equality --
 * `ExpressSet.equals()` (already added by `whereRules/ifc2x3.ts` chunk 3, see that class's
 * own doc comment in `runtimeShim.ts`), not a bare `===` between two distinct `ExpressSet`
 * instances.
 */
function ifcTaperedSweptAreaProfiles(startArea: unknown, endArea: unknown): Tri {
	if (typeOfAttr(startArea).has("ifc4.ifcparameterizedprofiledef")) {
		if (typeOfAttr(endArea).has("ifc4.ifcderivedprofiledef")) {
			return triEq(startArea, expressGetAttr(endArea, "ParentProfile", INDETERMINATE));
		}
		return typeOfAttr(startArea).equals(typeOfAttr(endArea));
	}
	if (typeOfAttr(endArea).has("ifc4.ifcderivedprofiledef")) {
		return triEq(startArea, expressGetAttr(endArea, "ParentProfile", INDETERMINATE));
	}
	return false;
}

/**
 * Python: `IfcUniqueQuantityNames(properties)` (real source line 12161) -- **byte-identical
 * in shape to the already-ported `IfcUniquePropertyName`/`IfcUniquePropertyTemplateNames`**
 * (chunk 2's own `uniquePropertyLikeNames`, real source lines 12139/12155): build an
 * `express_set` union of every member's own `Name`, then check that set's size equals the
 * list's own length. A third real, distinct top-level Python function with the same
 * byte-identical body (confirmed directly) -- reuses `uniquePropertyLikeNames` via its own
 * thin, real-named wrapper, exactly matching chunk 2's own "each real Python function gets
 * its own thin wrapper for literal fidelity" precedent (`ifcUniquePropertyName`/
 * `ifcUniquePropertyTemplateNames` immediately above it).
 */
function ifcUniqueQuantityNames(quantities: unknown): boolean {
	return uniquePropertyLikeNames(quantities);
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 6627-7852, this chunk's own 120).
// =============================================================================

// `IfcDuctFittingType_CorrectPredefinedType` (line 6627).
const IfcDuctFittingType_CorrectPredefinedType = entityRule("IfcDuctFittingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDuctFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDuctSegment_CorrectPredefinedType` (line 6637).
const IfcDuctSegment_CorrectPredefinedType = entityRule("IfcDuctSegment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDuctSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDuctSegment_CorrectTypeAssigned` (line 6647).
const IfcDuctSegment_CorrectTypeAssigned = entityRule("IfcDuctSegment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDuctSegmentType"),
		"IfcDuctSegment: if IsTypedBy is given, its RelatingType must be an IfcDuctSegmentType.",
	);
});

// `IfcDuctSegmentType_CorrectPredefinedType` (line 6657).
const IfcDuctSegmentType_CorrectPredefinedType = entityRule("IfcDuctSegmentType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDuctSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDuctSilencer_CorrectPredefinedType` (line 6667).
const IfcDuctSilencer_CorrectPredefinedType = entityRule("IfcDuctSilencer", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDuctSilencer: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDuctSilencer_CorrectTypeAssigned` (line 6677).
const IfcDuctSilencer_CorrectTypeAssigned = entityRule("IfcDuctSilencer", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDuctSilencerType"),
		"IfcDuctSilencer: if IsTypedBy is given, its RelatingType must be an IfcDuctSilencerType.",
	);
});

// `IfcDuctSilencerType_CorrectPredefinedType` (line 6687).
const IfcDuctSilencerType_CorrectPredefinedType = entityRule("IfcDuctSilencerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDuctSilencerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEdgeLoop_IsClosed` (line 6697): `EdgeList[1].EdgeStart == EdgeList[Ne].EdgeEnd` --
// `Ne` is the DERIVE attribute `calc_IfcEdgeLoop_Ne` (`rules/ifc4.ts`, already ported in
// Phase EX-2).
const IfcEdgeLoop_IsClosed = entityRule("IfcEdgeLoop", "IsClosed", (self) => {
	const edgeList = expressGetAttr(self, "EdgeList", INDETERMINATE);
	const ne = expressGetAttr(self, "Ne", INDETERMINATE) as number;
	const firstEdge = expressGetItem(edgeList, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const lastEdge = expressGetItem(edgeList, ne - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(firstEdge, "EdgeStart", INDETERMINATE), expressGetAttr(lastEdge, "EdgeEnd", INDETERMINATE)),
		"IfcEdgeLoop: the first edge's EdgeStart must equal the Ne-th (last) edge's EdgeEnd.",
	);
});

// `IfcEdgeLoop_IsContinuous` (line 6708): `IfcLoopHeadToTail(self)`.
const IfcEdgeLoop_IsContinuous = entityRule("IfcEdgeLoop", "IsContinuous", (self) => {
	assertWhereRule(
		ifcLoopHeadToTail(self),
		"IfcEdgeLoop: EdgeList must be head-to-tail continuous (each edge's EdgeEnd must equal the next edge's EdgeStart).",
	);
});

// `IfcElectricAppliance_CorrectPredefinedType` (line 6721).
const IfcElectricAppliance_CorrectPredefinedType = entityRule(
	"IfcElectricAppliance",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcElectricAppliance: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcElectricAppliance_CorrectTypeAssigned` (line 6731).
const IfcElectricAppliance_CorrectTypeAssigned = entityRule("IfcElectricAppliance", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElectricApplianceType"),
		"IfcElectricAppliance: if IsTypedBy is given, its RelatingType must be an IfcElectricApplianceType.",
	);
});

// `IfcElectricApplianceType_CorrectPredefinedType` (line 6741).
const IfcElectricApplianceType_CorrectPredefinedType = entityRule(
	"IfcElectricApplianceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElectricApplianceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElectricDistributionBoard_CorrectPredefinedType` (line 6751).
const IfcElectricDistributionBoard_CorrectPredefinedType = entityRule(
	"IfcElectricDistributionBoard",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcElectricDistributionBoard: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcElectricDistributionBoard_CorrectTypeAssigned` (line 6761).
const IfcElectricDistributionBoard_CorrectTypeAssigned = entityRule(
	"IfcElectricDistributionBoard",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcElectricDistributionBoardType"),
			"IfcElectricDistributionBoard: if IsTypedBy is given, its RelatingType must be an IfcElectricDistributionBoardType.",
		);
	},
);

// `IfcElectricDistributionBoardType_CorrectPredefinedType` (line 6771).
const IfcElectricDistributionBoardType_CorrectPredefinedType = entityRule(
	"IfcElectricDistributionBoardType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElectricDistributionBoardType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElectricFlowStorageDevice_CorrectPredefinedType` (line 6781).
const IfcElectricFlowStorageDevice_CorrectPredefinedType = entityRule(
	"IfcElectricFlowStorageDevice",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcElectricFlowStorageDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcElectricFlowStorageDevice_CorrectTypeAssigned` (line 6791).
const IfcElectricFlowStorageDevice_CorrectTypeAssigned = entityRule(
	"IfcElectricFlowStorageDevice",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcElectricFlowStorageDeviceType"),
			"IfcElectricFlowStorageDevice: if IsTypedBy is given, its RelatingType must be an IfcElectricFlowStorageDeviceType.",
		);
	},
);

// `IfcElectricFlowStorageDeviceType_CorrectPredefinedType` (line 6801).
const IfcElectricFlowStorageDeviceType_CorrectPredefinedType = entityRule(
	"IfcElectricFlowStorageDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElectricFlowStorageDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElectricGenerator_CorrectPredefinedType` (line 6811).
const IfcElectricGenerator_CorrectPredefinedType = entityRule(
	"IfcElectricGenerator",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcElectricGenerator: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcElectricGenerator_CorrectTypeAssigned` (line 6821).
const IfcElectricGenerator_CorrectTypeAssigned = entityRule("IfcElectricGenerator", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElectricGeneratorType"),
		"IfcElectricGenerator: if IsTypedBy is given, its RelatingType must be an IfcElectricGeneratorType.",
	);
});

// `IfcElectricGeneratorType_CorrectPredefinedType` (line 6831).
const IfcElectricGeneratorType_CorrectPredefinedType = entityRule(
	"IfcElectricGeneratorType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElectricGeneratorType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElectricMotor_CorrectPredefinedType` (line 6841).
const IfcElectricMotor_CorrectPredefinedType = entityRule("IfcElectricMotor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcElectricMotor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcElectricMotor_CorrectTypeAssigned` (line 6851).
const IfcElectricMotor_CorrectTypeAssigned = entityRule("IfcElectricMotor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElectricMotorType"),
		"IfcElectricMotor: if IsTypedBy is given, its RelatingType must be an IfcElectricMotorType.",
	);
});

// `IfcElectricMotorType_CorrectPredefinedType` (line 6861).
const IfcElectricMotorType_CorrectPredefinedType = entityRule(
	"IfcElectricMotorType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElectricMotorType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElectricTimeControl_CorrectPredefinedType` (line 6871).
const IfcElectricTimeControl_CorrectPredefinedType = entityRule(
	"IfcElectricTimeControl",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcElectricTimeControl: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcElectricTimeControl_CorrectTypeAssigned` (line 6881).
const IfcElectricTimeControl_CorrectTypeAssigned = entityRule(
	"IfcElectricTimeControl",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcElectricTimeControlType"),
			"IfcElectricTimeControl: if IsTypedBy is given, its RelatingType must be an IfcElectricTimeControlType.",
		);
	},
);

// `IfcElectricTimeControlType_CorrectPredefinedType` (line 6891).
const IfcElectricTimeControlType_CorrectPredefinedType = entityRule(
	"IfcElectricTimeControlType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElectricTimeControlType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElementAssembly_CorrectPredefinedType` (line 6901).
const IfcElementAssembly_CorrectPredefinedType = entityRule("IfcElementAssembly", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcElementAssembly: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcElementAssembly_CorrectTypeAssigned` (line 6911).
const IfcElementAssembly_CorrectTypeAssigned = entityRule("IfcElementAssembly", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElementAssemblyType"),
		"IfcElementAssembly: if IsTypedBy is given, its RelatingType must be an IfcElementAssemblyType.",
	);
});

// `IfcElementAssemblyType_CorrectPredefinedType` (line 6921).
const IfcElementAssemblyType_CorrectPredefinedType = entityRule(
	"IfcElementAssemblyType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElementAssemblyType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElementQuantity_UniqueQuantityNames` (line 6931): `IfcUniqueQuantityNames(Quantities)`.
const IfcElementQuantity_UniqueQuantityNames = entityRule("IfcElementQuantity", "UniqueQuantityNames", (self) => {
	const quantities = expressGetAttr(self, "Quantities", INDETERMINATE);
	assertWhereRule(
		ifcUniqueQuantityNames(quantities),
		"IfcElementQuantity: every Quantities member must have a distinct Name.",
	);
});

// `IfcEngine_CorrectPredefinedType` (line 6941).
const IfcEngine_CorrectPredefinedType = entityRule("IfcEngine", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEngine: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEngine_CorrectTypeAssigned` (line 6951).
const IfcEngine_CorrectTypeAssigned = entityRule("IfcEngine", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcEngineType"),
		"IfcEngine: if IsTypedBy is given, its RelatingType must be an IfcEngineType.",
	);
});

// `IfcEngineType_CorrectPredefinedType` (line 6961).
const IfcEngineType_CorrectPredefinedType = entityRule("IfcEngineType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcEngineType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEvaporativeCooler_CorrectPredefinedType` (line 6971).
const IfcEvaporativeCooler_CorrectPredefinedType = entityRule(
	"IfcEvaporativeCooler",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcEvaporativeCooler: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcEvaporativeCooler_CorrectTypeAssigned` (line 6981).
const IfcEvaporativeCooler_CorrectTypeAssigned = entityRule("IfcEvaporativeCooler", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcEvaporativeCoolerType"),
		"IfcEvaporativeCooler: if IsTypedBy is given, its RelatingType must be an IfcEvaporativeCoolerType.",
	);
});

// `IfcEvaporativeCoolerType_CorrectPredefinedType` (line 6991).
const IfcEvaporativeCoolerType_CorrectPredefinedType = entityRule(
	"IfcEvaporativeCoolerType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcEvaporativeCoolerType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcEvaporator_CorrectPredefinedType` (line 7001).
const IfcEvaporator_CorrectPredefinedType = entityRule("IfcEvaporator", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEvaporator: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEvaporator_CorrectTypeAssigned` (line 7011).
const IfcEvaporator_CorrectTypeAssigned = entityRule("IfcEvaporator", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcEvaporatorType"),
		"IfcEvaporator: if IsTypedBy is given, its RelatingType must be an IfcEvaporatorType.",
	);
});

// `IfcEvaporatorType_CorrectPredefinedType` (line 7021).
const IfcEvaporatorType_CorrectPredefinedType = entityRule("IfcEvaporatorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcEvaporatorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEvent_CorrectPredefinedType` (line 7031).
const IfcEvent_CorrectPredefinedType = entityRule("IfcEvent", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEvent: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEvent_CorrectTypeAssigned` (line 7041): **a real, disclosed `RULE_NAME`/body
// mismatch** -- despite its name, this rule's real body is NOT the `_CorrectTypeAssigned`
// (`IsTypedBy`) shape at all. It is the `optionalUserDefinedOrHasAttribute` shape, on
// `EventTriggerType`/`UserDefinedEventTriggerType` (mirroring `IfcEvent`'s own OPTIONAL
// `EventTriggerType` attribute, the same "occurrence entity has an optional escape-guarded
// attribute" pattern `PredefinedType` has elsewhere): `not exists(EventTriggerType) or
// EventTriggerType != USERDEFINED or (EventTriggerType == USERDEFINED and
// exists(UserDefinedEventTriggerType))`. Confirmed directly against real source, not
// assumed from the rule/attribute name similarity alone.
const IfcEvent_CorrectTypeAssigned = entityRule("IfcEvent", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		optionalUserDefinedOrHasAttribute(self, "EventTriggerType", "UserDefinedEventTriggerType"),
		"IfcEvent: if EventTriggerType is given and USERDEFINED, UserDefinedEventTriggerType must be given.",
	);
});

// `IfcEventType_CorrectPredefinedType` (line 7052).
const IfcEventType_CorrectPredefinedType = entityRule("IfcEventType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ProcessType", false),
		"IfcEventType: if PredefinedType is USERDEFINED, ProcessType must be given.",
	);
});

// `IfcEventType_CorrectEventTriggerType` (line 7062): the MANDATORY-attribute analog of
// `IfcEvent_CorrectTypeAssigned` above (`IfcEventType.EventTriggerType` is mandatory, no
// leading `not exists` guard): `EventTriggerType != USERDEFINED or (EventTriggerType ==
// USERDEFINED and exists(UserDefinedEventTriggerType))`.
const IfcEventType_CorrectEventTriggerType = entityRule("IfcEventType", "CorrectEventTriggerType", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "EventTriggerType", "UserDefinedEventTriggerType"),
		"IfcEventType: if EventTriggerType is USERDEFINED, UserDefinedEventTriggerType must be given.",
	);
});

// `IfcExternalReference_WR1` (line 7073): `exists(Identification) or exists(Location) or
// exists(Name)`.
const IfcExternalReference_WR1 = entityRule("IfcExternalReference", "WR1", (self) => {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	const identification = expressGetAttr(self, "Identification", INDETERMINATE);
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	assertWhereRule(
		exists(identification) || exists(location) || exists(name),
		"IfcExternalReference: at least one of Identification, Location, or Name must be given.",
	);
});

// `IfcExtrudedAreaSolid_ValidExtrusionDirection` (line 7085): `IfcDotProduct(IfcDirection(
// DirectionRatios=[0.0, 0.0, 1.0]), ExtrudedDirection) != 0.0`. Reuses `rules/ifc4.ts`'s
// own `ifcDirection`/`ifcDotProduct` (both newly exported this chunk, same "no bare-schema
// scratch-entity primitive" pattern that file's own header comment already establishes --
// see this file's own header comment for the disclosure).
const IfcExtrudedAreaSolid_ValidExtrusionDirection = entityRule(
	"IfcExtrudedAreaSolid",
	"ValidExtrusionDirection",
	(self) => {
		const extrudedDirection = expressGetAttr(self, "ExtrudedDirection", INDETERMINATE);
		assertWhereRule(
			triNe(ifcDotProduct(ifcDirection([0.0, 0.0, 1.0]), extrudedDirection), 0.0),
			"IfcExtrudedAreaSolid.ExtrudedDirection must not be perpendicular to the Z axis (its dot product with [0,0,1] must not be 0).",
		);
	},
);

// `IfcExtrudedAreaSolidTapered_CorrectProfileAssignment` (line 7094):
// `IfcTaperedSweptAreaProfiles(SweptArea, EndSweptArea)`.
const IfcExtrudedAreaSolidTapered_CorrectProfileAssignment = entityRule(
	"IfcExtrudedAreaSolidTapered",
	"CorrectProfileAssignment",
	(self) => {
		const sweptArea = expressGetAttr(self, "SweptArea", INDETERMINATE);
		const endSweptArea = expressGetAttr(self, "EndSweptArea", INDETERMINATE);
		assertWhereRule(
			ifcTaperedSweptAreaProfiles(sweptArea, endSweptArea),
			"IfcExtrudedAreaSolidTapered: SweptArea/EndSweptArea must be a valid tapered-profile pair (matching IfcParameterizedProfileDef kinds, or an IfcDerivedProfileDef whose ParentProfile matches the other side).",
		);
	},
);

// `IfcFace_HasOuterBound` (line 7103): `sizeof([temp for temp in Bounds if
// 'ifc4.ifcfaceouterbound' in typeof(temp)]) <= 1`.
const IfcFace_HasOuterBound = entityRule("IfcFace", "HasOuterBound", (self) => {
	const bounds = asList(expressGetAttr(self, "Bounds", INDETERMINATE));
	const outerBoundCount = bounds.filter((temp) => typeOfAttr(temp).has("ifc4.ifcfaceouterbound")).length;
	assertWhereRule(outerBoundCount <= 1, "IfcFace: at most one Bounds member may be an IfcFaceOuterBound.");
});

// `IfcFan_CorrectPredefinedType` (line 7116).
const IfcFan_CorrectPredefinedType = entityRule("IfcFan", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFan: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFan_CorrectTypeAssigned` (line 7126).
const IfcFan_CorrectTypeAssigned = entityRule("IfcFan", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFanType"),
		"IfcFan: if IsTypedBy is given, its RelatingType must be an IfcFanType.",
	);
});

// `IfcFanType_CorrectPredefinedType` (line 7136).
const IfcFanType_CorrectPredefinedType = entityRule("IfcFanType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFanType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFastener_CorrectPredefinedType` (line 7146).
const IfcFastener_CorrectPredefinedType = entityRule("IfcFastener", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFastener: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFastener_CorrectTypeAssigned` (line 7156).
const IfcFastener_CorrectTypeAssigned = entityRule("IfcFastener", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFastenerType"),
		"IfcFastener: if IsTypedBy is given, its RelatingType must be an IfcFastenerType.",
	);
});

// `IfcFastenerType_CorrectPredefinedType` (line 7166).
const IfcFastenerType_CorrectPredefinedType = entityRule("IfcFastenerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFastenerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFeatureElementSubtraction_HasNoSubtraction` (line 7176): `sizeof(HasOpenings) == 0`.
const IfcFeatureElementSubtraction_HasNoSubtraction = entityRule(
	"IfcFeatureElementSubtraction",
	"HasNoSubtraction",
	(self) => {
		assertWhereRule(
			attrSizeIsZero(self, "HasOpenings"),
			"IfcFeatureElementSubtraction.HasOpenings must be empty (a feature-element-subtraction may not itself be voided).",
		);
	},
);

// `IfcFeatureElementSubtraction_IsNotFilling` (line 7185): `sizeof(FillsVoids) == 0`.
const IfcFeatureElementSubtraction_IsNotFilling = entityRule("IfcFeatureElementSubtraction", "IsNotFilling", (self) => {
	assertWhereRule(
		attrSizeIsZero(self, "FillsVoids"),
		"IfcFeatureElementSubtraction.FillsVoids must be empty (a feature-element-subtraction may not itself fill a void).",
	);
});

// `IfcFillAreaStyle_MaxOneColour` (line 7194): `sizeof([style for style in FillStyles if
// 'ifc4.ifccolour' in typeof(style)]) <= 1`. **Confirmed dead code, same finding as
// `ifcCorrectFillAreaStyle`'s own header comment below**: `IfcColour` is a real IFC4
// `select_type` (verified directly: `schema.declaration_by_name("IfcColour")` is a
// `select_type`, not an `entity`), so `typeOf()` (which only ever walks an ENTITY's own
// supertype chain, never a SELECT's member list) can never actually match it -- this count
// is unconditionally 0, and the check unconditionally passes. Ported faithfully anyway
// (matching real, checked-in `IFC4.py`), not silently dropped.
const IfcFillAreaStyle_MaxOneColour = entityRule("IfcFillAreaStyle", "MaxOneColour", (self) => {
	const fillStyles = asList(expressGetAttr(self, "FillStyles", INDETERMINATE));
	const colourCount = fillStyles.filter((style) => typeOfAttr(style).has("ifc4.ifccolour")).length;
	assertWhereRule(colourCount <= 1, "IfcFillAreaStyle: at most one FillStyles member may be an IfcColour.");
});

// `IfcFillAreaStyle_MaxOneExtHatchStyle` (line 7203): `sizeof([style for style in
// FillStyles if 'ifc4.ifcexternallydefinedhatchstyle' in typeof(style)]) <= 1`.
const IfcFillAreaStyle_MaxOneExtHatchStyle = entityRule("IfcFillAreaStyle", "MaxOneExtHatchStyle", (self) => {
	const fillStyles = asList(expressGetAttr(self, "FillStyles", INDETERMINATE));
	const extHatchCount = fillStyles.filter((style) =>
		typeOfAttr(style).has("ifc4.ifcexternallydefinedhatchstyle"),
	).length;
	assertWhereRule(
		extHatchCount <= 1,
		"IfcFillAreaStyle: at most one FillStyles member may be an IfcExternallyDefinedHatchStyle.",
	);
});

// `IfcFillAreaStyle_ConsistentHatchStyleDef` (line 7212): `IfcCorrectFillAreaStyle(FillStyles)`.
const IfcFillAreaStyle_ConsistentHatchStyleDef = entityRule("IfcFillAreaStyle", "ConsistentHatchStyleDef", (self) => {
	const fillStyles = expressGetAttr(self, "FillStyles", INDETERMINATE);
	assertWhereRule(
		ifcCorrectFillAreaStyle(fillStyles),
		"IfcFillAreaStyle: FillStyles must be a consistent combination (at most one IfcExternallyDefinedHatchStyle, not mixed with hatching/tiles/colour; at most one colour; not both hatching and tiles).",
	);
});

// `IfcFillAreaStyleHatching_PatternStart2D` (line 7221): `not exists(PatternStart) or
// PatternStart.Dim == 2` -- the `optionalAttrDimEquals` shape (chunk 1).
const IfcFillAreaStyleHatching_PatternStart2D = entityRule("IfcFillAreaStyleHatching", "PatternStart2D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "PatternStart", 2),
		"IfcFillAreaStyleHatching: if PatternStart is given, its Dim must equal 2.",
	);
});

// `IfcFillAreaStyleHatching_RefHatchLine2D` (line 7231): `not
// exists(PointOfReferenceHatchLine) or PointOfReferenceHatchLine.Dim == 2` -- the
// `optionalAttrDimEquals` shape (chunk 1).
const IfcFillAreaStyleHatching_RefHatchLine2D = entityRule("IfcFillAreaStyleHatching", "RefHatchLine2D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "PointOfReferenceHatchLine", 2),
		"IfcFillAreaStyleHatching: if PointOfReferenceHatchLine is given, its Dim must equal 2.",
	);
});

// `IfcFilter_CorrectPredefinedType` (line 7241).
const IfcFilter_CorrectPredefinedType = entityRule("IfcFilter", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFilter: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFilter_CorrectTypeAssigned` (line 7251).
const IfcFilter_CorrectTypeAssigned = entityRule("IfcFilter", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFilterType"),
		"IfcFilter: if IsTypedBy is given, its RelatingType must be an IfcFilterType.",
	);
});

// `IfcFilterType_CorrectPredefinedType` (line 7261).
const IfcFilterType_CorrectPredefinedType = entityRule("IfcFilterType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFilterType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFireSuppressionTerminal_CorrectPredefinedType` (line 7271).
const IfcFireSuppressionTerminal_CorrectPredefinedType = entityRule(
	"IfcFireSuppressionTerminal",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcFireSuppressionTerminal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcFireSuppressionTerminal_CorrectTypeAssigned` (line 7281).
const IfcFireSuppressionTerminal_CorrectTypeAssigned = entityRule(
	"IfcFireSuppressionTerminal",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcFireSuppressionTerminalType"),
			"IfcFireSuppressionTerminal: if IsTypedBy is given, its RelatingType must be an IfcFireSuppressionTerminalType.",
		);
	},
);

// `IfcFireSuppressionTerminalType_CorrectPredefinedType` (line 7291).
const IfcFireSuppressionTerminalType_CorrectPredefinedType = entityRule(
	"IfcFireSuppressionTerminalType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcFireSuppressionTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcFixedReferenceSweptAreaSolid_DirectrixBounded` (line 7301): `(exists(StartParam) and
// exists(EndParam)) or sizeof(['ifc4.ifcconic', 'ifc4.ifcboundedcurve'] * typeof(Directrix)) == 1`.
const IfcFixedReferenceSweptAreaSolid_DirectrixBounded = entityRule(
	"IfcFixedReferenceSweptAreaSolid",
	"DirectrixBounded",
	(self) => {
		const directrix = expressGetAttr(self, "Directrix", INDETERMINATE);
		const startParam = expressGetAttr(self, "StartParam", INDETERMINATE);
		const endParam = expressGetAttr(self, "EndParam", INDETERMINATE);
		const matchCount = typeOfAttr(directrix).multiply(["ifc4.ifcconic", "ifc4.ifcboundedcurve"]).size;
		assertWhereRule(
			pyOr(
				pyAnd(exists(startParam), () => exists(endParam)),
				() => triEq(matchCount, 1),
			),
			"IfcFixedReferenceSweptAreaSolid: StartParam and EndParam must both be given, or Directrix must be exactly one of IfcConic/IfcBoundedCurve.",
		);
	},
);

// `IfcFlowInstrument_CorrectPredefinedType` (line 7313).
const IfcFlowInstrument_CorrectPredefinedType = entityRule("IfcFlowInstrument", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFlowInstrument: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFlowInstrument_CorrectTypeAssigned` (line 7323).
const IfcFlowInstrument_CorrectTypeAssigned = entityRule("IfcFlowInstrument", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFlowInstrumentType"),
		"IfcFlowInstrument: if IsTypedBy is given, its RelatingType must be an IfcFlowInstrumentType.",
	);
});

// `IfcFlowInstrumentType_CorrectPredefinedType` (line 7333).
const IfcFlowInstrumentType_CorrectPredefinedType = entityRule(
	"IfcFlowInstrumentType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcFlowInstrumentType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcFlowMeter_CorrectPredefinedType` (line 7343).
const IfcFlowMeter_CorrectPredefinedType = entityRule("IfcFlowMeter", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFlowMeter: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFlowMeter_CorrectTypeAssigned` (line 7353).
const IfcFlowMeter_CorrectTypeAssigned = entityRule("IfcFlowMeter", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFlowMeterType"),
		"IfcFlowMeter: if IsTypedBy is given, its RelatingType must be an IfcFlowMeterType.",
	);
});

// `IfcFlowMeterType_CorrectPredefinedType` (line 7363).
const IfcFlowMeterType_CorrectPredefinedType = entityRule("IfcFlowMeterType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFlowMeterType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFooting_CorrectPredefinedType` (line 7373).
const IfcFooting_CorrectPredefinedType = entityRule("IfcFooting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFooting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFooting_CorrectTypeAssigned` (line 7383).
const IfcFooting_CorrectTypeAssigned = entityRule("IfcFooting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFootingType"),
		"IfcFooting: if IsTypedBy is given, its RelatingType must be an IfcFootingType.",
	);
});

// `IfcFootingType_CorrectPredefinedType` (line 7393).
const IfcFootingType_CorrectPredefinedType = entityRule("IfcFootingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFootingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFurniture_CorrectPredefinedType` (line 7403).
const IfcFurniture_CorrectPredefinedType = entityRule("IfcFurniture", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFurniture: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFurniture_CorrectTypeAssigned` (line 7413).
const IfcFurniture_CorrectTypeAssigned = entityRule("IfcFurniture", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFurnitureType"),
		"IfcFurniture: if IsTypedBy is given, its RelatingType must be an IfcFurnitureType.",
	);
});

// `IfcFurnitureType_CorrectPredefinedType` (line 7423).
const IfcFurnitureType_CorrectPredefinedType = entityRule("IfcFurnitureType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFurnitureType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcGeographicElement_CorrectPredefinedType` (line 7433).
const IfcGeographicElement_CorrectPredefinedType = entityRule(
	"IfcGeographicElement",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcGeographicElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcGeographicElement_CorrectTypeAssigned` (line 7443).
const IfcGeographicElement_CorrectTypeAssigned = entityRule("IfcGeographicElement", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcGeographicElementType"),
		"IfcGeographicElement: if IsTypedBy is given, its RelatingType must be an IfcGeographicElementType.",
	);
});

// `IfcGeographicElementType_CorrectPredefinedType` (line 7453).
const IfcGeographicElementType_CorrectPredefinedType = entityRule(
	"IfcGeographicElementType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcGeographicElementType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcGeometricCurveSet_NoSurfaces` (line 7463): `sizeof([temp for temp in Elements if
// 'ifc4.ifcsurface' in typeof(temp)]) == 0`.
const IfcGeometricCurveSet_NoSurfaces = entityRule("IfcGeometricCurveSet", "NoSurfaces", (self) => {
	const elements = asList(expressGetAttr(self, "Elements", INDETERMINATE));
	const surfaceCount = elements.filter((temp) => typeOfAttr(temp).has("ifc4.ifcsurface")).length;
	assertWhereRule(surfaceCount === 0, "IfcGeometricCurveSet: no Elements member may be an IfcSurface.");
});

// `IfcGeometricRepresentationContext_North2D` (line 7472): `not exists(TrueNorth) or
// hiindex(TrueNorth.DirectionRatios) == 2`.
const IfcGeometricRepresentationContext_North2D = entityRule("IfcGeometricRepresentationContext", "North2D", (self) => {
	const trueNorth = expressGetAttr(self, "TrueNorth", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(trueNorth), () => triEq(hiIndex(expressGetAttr(trueNorth, "DirectionRatios", INDETERMINATE)), 2)),
		"IfcGeometricRepresentationContext: if TrueNorth is given, its DirectionRatios must have exactly 2 elements.",
	);
});

// `IfcGeometricRepresentationSubContext_ParentNoSub` (line 7482): `not
// 'ifc4.ifcgeometricrepresentationsubcontext' in typeof(ParentContext)`.
const IfcGeometricRepresentationSubContext_ParentNoSub = entityRule(
	"IfcGeometricRepresentationSubContext",
	"ParentNoSub",
	(self) => {
		const parentContext = expressGetAttr(self, "ParentContext", INDETERMINATE);
		assertWhereRule(
			!typeOfAttr(parentContext).has("ifc4.ifcgeometricrepresentationsubcontext"),
			"IfcGeometricRepresentationSubContext.ParentContext must not itself be an IfcGeometricRepresentationSubContext.",
		);
	},
);

// `IfcGeometricRepresentationSubContext_UserTargetProvided` (line 7492): `TargetView !=
// USERDEFINED or (TargetView == USERDEFINED and exists(UserDefinedTargetView))` -- the
// `userDefinedOrHasAttribute` shape (mandatory variant), on `TargetView`/
// `UserDefinedTargetView` rather than `PredefinedType`.
const IfcGeometricRepresentationSubContext_UserTargetProvided = entityRule(
	"IfcGeometricRepresentationSubContext",
	"UserTargetProvided",
	(self) => {
		assertWhereRule(
			userDefinedOrHasAttribute(self, "TargetView", "UserDefinedTargetView"),
			"IfcGeometricRepresentationSubContext: if TargetView is USERDEFINED, UserDefinedTargetView must be given.",
		);
	},
);

// `IfcGeometricRepresentationSubContext_NoCoordOperation` (line 7503):
// `sizeof(HasCoordinateOperation) == 0`.
const IfcGeometricRepresentationSubContext_NoCoordOperation = entityRule(
	"IfcGeometricRepresentationSubContext",
	"NoCoordOperation",
	(self) => {
		assertWhereRule(
			attrSizeIsZero(self, "HasCoordinateOperation"),
			"IfcGeometricRepresentationSubContext.HasCoordinateOperation must be empty (a sub-context may not itself be map-conversion-coordinated).",
		);
	},
);

// `IfcGeometricSet_ConsistentDim` (line 7528): `sizeof([temp for temp in Elements if
// temp.Dim != Elements[1].Dim]) == 0`.
const IfcGeometricSet_ConsistentDim = entityRule("IfcGeometricSet", "ConsistentDim", (self) => {
	const elements = asList(expressGetAttr(self, "Elements", INDETERMINATE));
	const first = expressGetItem(elements, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const firstDim = expressGetAttr(first, "Dim", INDETERMINATE);
	const mismatchCount = elements.filter(
		(temp) => triNe(expressGetAttr(temp, "Dim", INDETERMINATE), firstDim) === true,
	).length;
	assertWhereRule(mismatchCount === 0, "IfcGeometricSet: every Elements member must share the same Dim as the first.");
});

// `IfcGrid_HasPlacement` (line 7542): `exists(ObjectPlacement)`.
const IfcGrid_HasPlacement = entityRule("IfcGrid", "HasPlacement", (self) => {
	assertWhereRule(
		exists(expressGetAttr(self, "ObjectPlacement", INDETERMINATE)),
		"IfcGrid.ObjectPlacement must be given.",
	);
});

// `IfcGridAxis_WR1` (line 7551): `AxisCurve.Dim == 2` -- the `attrDimEquals` shape (chunk 1).
const IfcGridAxis_WR1 = entityRule("IfcGridAxis", "WR1", (self) => {
	assertWhereRule(attrDimEquals(self, "AxisCurve", 2), "IfcGridAxis.AxisCurve.Dim must equal 2.");
});

// `IfcGridAxis_WR2` (line 7561): `(sizeof(PartOfU) == 1) ^ (sizeof(PartOfV) == 1) ^
// (sizeof(PartOfW) == 1)` -- real Python `^` chained left-to-right (`triXor`, added to
// `runtimeShim.ts` anticipating this exact rule -- see that function's own doc comment).
// **Disclosed subtlety, not a bug**: a 3-way chained XOR is true for an ODD number of true
// operands (1 or 3), not literally "exactly one" -- preserved as real Python computes it,
// though in practice a real `IfcGridAxis` is only ever referenced by one of
// PartOfU/PartOfV/PartOfW, making the "1 vs 3" distinction moot for any realistic model.
const IfcGridAxis_WR2 = entityRule("IfcGridAxis", "WR2", (self) => {
	const partOfU = expressGetAttr(self, "PartOfU", INDETERMINATE);
	const partOfV = expressGetAttr(self, "PartOfV", INDETERMINATE);
	const partOfW = expressGetAttr(self, "PartOfW", INDETERMINATE);
	const uIsOne = triEq(sizeof(partOfU), 1);
	const vIsOne = triEq(sizeof(partOfV), 1);
	const wIsOne = triEq(sizeof(partOfW), 1);
	assertWhereRule(
		triXor(triXor(uIsOne, vIsOne), wIsOne),
		"IfcGridAxis: an odd number of PartOfU/PartOfV/PartOfW must have exactly 1 member (real EXPRESS chained XOR).",
	);
});

// `IfcHeatExchanger_CorrectPredefinedType` (line 7576).
const IfcHeatExchanger_CorrectPredefinedType = entityRule("IfcHeatExchanger", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcHeatExchanger: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcHeatExchanger_CorrectTypeAssigned` (line 7586).
const IfcHeatExchanger_CorrectTypeAssigned = entityRule("IfcHeatExchanger", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcHeatExchangerType"),
		"IfcHeatExchanger: if IsTypedBy is given, its RelatingType must be an IfcHeatExchangerType.",
	);
});

// `IfcHeatExchangerType_CorrectPredefinedType` (line 7596).
const IfcHeatExchangerType_CorrectPredefinedType = entityRule(
	"IfcHeatExchangerType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcHeatExchangerType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcHumidifier_CorrectPredefinedType` (line 7606).
const IfcHumidifier_CorrectPredefinedType = entityRule("IfcHumidifier", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcHumidifier: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcHumidifier_CorrectTypeAssigned` (line 7616).
const IfcHumidifier_CorrectTypeAssigned = entityRule("IfcHumidifier", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcHumidifierType"),
		"IfcHumidifier: if IsTypedBy is given, its RelatingType must be an IfcHumidifierType.",
	);
});

// `IfcHumidifierType_CorrectPredefinedType` (line 7626).
const IfcHumidifierType_CorrectPredefinedType = entityRule("IfcHumidifierType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcHumidifierType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcIShapeProfileDef_ValidFlangeThickness` (line 7636): `2.0 * FlangeThickness < OverallDepth`.
const IfcIShapeProfileDef_ValidFlangeThickness = entityRule("IfcIShapeProfileDef", "ValidFlangeThickness", (self) => {
	const overallDepth = expressGetAttr(self, "OverallDepth", INDETERMINATE);
	const flangeThickness = expressGetAttr(self, "FlangeThickness", INDETERMINATE) as number;
	assertWhereRule(
		triLt(2.0 * flangeThickness, overallDepth),
		"IfcIShapeProfileDef: 2 * FlangeThickness must be less than OverallDepth.",
	);
});

// `IfcIShapeProfileDef_ValidWebThickness` (line 7647): `WebThickness < OverallWidth`.
const IfcIShapeProfileDef_ValidWebThickness = entityRule("IfcIShapeProfileDef", "ValidWebThickness", (self) => {
	const overallWidth = expressGetAttr(self, "OverallWidth", INDETERMINATE);
	const webThickness = expressGetAttr(self, "WebThickness", INDETERMINATE);
	assertWhereRule(
		triLt(webThickness, overallWidth),
		"IfcIShapeProfileDef.WebThickness must be less than OverallWidth.",
	);
});

// `IfcIShapeProfileDef_ValidFilletRadius` (line 7658): `not exists(FilletRadius) or
// (FilletRadius <= (OverallWidth - WebThickness) / 2.0 and FilletRadius <= (OverallDepth -
// 2.0 * FlangeThickness) / 2.0)`.
const IfcIShapeProfileDef_ValidFilletRadius = entityRule("IfcIShapeProfileDef", "ValidFilletRadius", (self) => {
	const overallWidth = expressGetAttr(self, "OverallWidth", INDETERMINATE) as number;
	const overallDepth = expressGetAttr(self, "OverallDepth", INDETERMINATE) as number;
	const webThickness = expressGetAttr(self, "WebThickness", INDETERMINATE) as number;
	const flangeThickness = expressGetAttr(self, "FlangeThickness", INDETERMINATE) as number;
	const filletRadius = expressGetAttr(self, "FilletRadius", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(filletRadius), () =>
			pyAnd(triLe(filletRadius, (overallWidth - webThickness) / 2.0), () =>
				triLe(filletRadius, (overallDepth - 2.0 * flangeThickness) / 2.0),
			),
		),
		"IfcIShapeProfileDef: if FilletRadius is given, it must be at most half of (OverallWidth - WebThickness) and at most half of (OverallDepth - 2*FlangeThickness).",
	);
});

// `IfcIndexedPolyCurve_Consecutive` (line 7672): `sizeof(Segments) == 0 or
// IfcConsecutiveSegments(Segments)`.
const IfcIndexedPolyCurve_Consecutive = entityRule("IfcIndexedPolyCurve", "Consecutive", (self) => {
	const segments = expressGetAttr(self, "Segments", INDETERMINATE);
	assertWhereRule(
		pyOr(triEq(sizeof(segments), 0), () => ifcConsecutiveSegments(segments)),
		"IfcIndexedPolyCurve: if Segments is given (non-empty), consecutive segments must share their common point index.",
	);
});

// `IfcInterceptor_CorrectPredefinedType` (line 7682).
const IfcInterceptor_CorrectPredefinedType = entityRule("IfcInterceptor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcInterceptor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcInterceptor_CorrectTypeAssigned` (line 7692).
const IfcInterceptor_CorrectTypeAssigned = entityRule("IfcInterceptor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcInterceptorType"),
		"IfcInterceptor: if IsTypedBy is given, its RelatingType must be an IfcInterceptorType.",
	);
});

// `IfcInterceptorType_CorrectPredefinedType` (line 7702).
const IfcInterceptorType_CorrectPredefinedType = entityRule("IfcInterceptorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcInterceptorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcIntersectionCurve_TwoPCurves` (line 7712): `sizeof(AssociatedGeometry) == 2`.
const IfcIntersectionCurve_TwoPCurves = entityRule("IfcIntersectionCurve", "TwoPCurves", (self) => {
	assertWhereRule(
		triEq(sizeof(expressGetAttr(self, "AssociatedGeometry", INDETERMINATE)), 2),
		"IfcIntersectionCurve.AssociatedGeometry must have exactly 2 members.",
	);
});

// `IfcIntersectionCurve_DistinctSurfaces` (line 7721):
// `IfcAssociatedSurface(AssociatedGeometry[1]) != IfcAssociatedSurface(AssociatedGeometry[2])`.
const IfcIntersectionCurve_DistinctSurfaces = entityRule("IfcIntersectionCurve", "DistinctSurfaces", (self) => {
	const associatedGeometry = expressGetAttr(self, "AssociatedGeometry", INDETERMINATE);
	const first = expressGetItem(associatedGeometry, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const second = expressGetItem(associatedGeometry, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		triNe(ifcAssociatedSurface(first), ifcAssociatedSurface(second)),
		"IfcIntersectionCurve: the two AssociatedGeometry members' BasisSurface must be distinct.",
	);
});

// `IfcJunctionBox_CorrectPredefinedType` (line 7730).
const IfcJunctionBox_CorrectPredefinedType = entityRule("IfcJunctionBox", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcJunctionBox: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcJunctionBox_CorrectTypeAssigned` (line 7740).
const IfcJunctionBox_CorrectTypeAssigned = entityRule("IfcJunctionBox", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcJunctionBoxType"),
		"IfcJunctionBox: if IsTypedBy is given, its RelatingType must be an IfcJunctionBoxType.",
	);
});

// `IfcJunctionBoxType_CorrectPredefinedType` (line 7750).
const IfcJunctionBoxType_CorrectPredefinedType = entityRule("IfcJunctionBoxType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcJunctionBoxType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcLShapeProfileDef_ValidThickness` (line 7760): `Thickness < Depth and (not exists(Width)
// or Thickness < Width)`.
const IfcLShapeProfileDef_ValidThickness = entityRule("IfcLShapeProfileDef", "ValidThickness", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE);
	const width = expressGetAttr(self, "Width", INDETERMINATE);
	const thickness = expressGetAttr(self, "Thickness", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLt(thickness, depth), () => pyOr(!exists(width), () => triLt(thickness, width))),
		"IfcLShapeProfileDef: Thickness must be less than Depth, and less than Width if Width is given.",
	);
});

// `IfcLaborResource_CorrectPredefinedType` (line 7772).
const IfcLaborResource_CorrectPredefinedType = entityRule("IfcLaborResource", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcLaborResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcLaborResourceType_CorrectPredefinedType` (line 7782).
const IfcLaborResourceType_CorrectPredefinedType = entityRule(
	"IfcLaborResourceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ResourceType", false),
			"IfcLaborResourceType: if PredefinedType is USERDEFINED, ResourceType must be given.",
		);
	},
);

// `IfcLamp_CorrectPredefinedType` (line 7792).
const IfcLamp_CorrectPredefinedType = entityRule("IfcLamp", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcLamp: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcLamp_CorrectTypeAssigned` (line 7802).
const IfcLamp_CorrectTypeAssigned = entityRule("IfcLamp", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcLampType"),
		"IfcLamp: if IsTypedBy is given, its RelatingType must be an IfcLampType.",
	);
});

// `IfcLampType_CorrectPredefinedType` (line 7812).
const IfcLampType_CorrectPredefinedType = entityRule("IfcLampType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcLampType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcLightFixture_CorrectPredefinedType` (line 7822).
const IfcLightFixture_CorrectPredefinedType = entityRule("IfcLightFixture", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcLightFixture: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcLightFixture_CorrectTypeAssigned` (line 7832).
const IfcLightFixture_CorrectTypeAssigned = entityRule("IfcLightFixture", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcLightFixtureType"),
		"IfcLightFixture: if IsTypedBy is given, its RelatingType must be an IfcLightFixtureType.",
	);
});

// `IfcLightFixtureType_CorrectPredefinedType` (line 7842).
const IfcLightFixtureType_CorrectPredefinedType = entityRule("IfcLightFixtureType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcLightFixtureType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcLine_SameDim` (line 7852): `Dir.Dim == Pnt.Dim`.
const IfcLine_SameDim = entityRule("IfcLine", "SameDim", (self) => {
	const pnt = expressGetAttr(self, "Pnt", INDETERMINATE);
	const dir = expressGetAttr(self, "Dir", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(dir, "Dim", INDETERMINATE), expressGetAttr(pnt, "Dim", INDETERMINATE)),
		"IfcLine: Dir.Dim must equal Pnt.Dim.",
	);
});

registerSchemaRules("IFC4", [
	IfcDuctFittingType_CorrectPredefinedType,
	IfcDuctSegment_CorrectPredefinedType,
	IfcDuctSegment_CorrectTypeAssigned,
	IfcDuctSegmentType_CorrectPredefinedType,
	IfcDuctSilencer_CorrectPredefinedType,
	IfcDuctSilencer_CorrectTypeAssigned,
	IfcDuctSilencerType_CorrectPredefinedType,
	IfcEdgeLoop_IsClosed,
	IfcEdgeLoop_IsContinuous,
	IfcElectricAppliance_CorrectPredefinedType,
	IfcElectricAppliance_CorrectTypeAssigned,
	IfcElectricApplianceType_CorrectPredefinedType,
	IfcElectricDistributionBoard_CorrectPredefinedType,
	IfcElectricDistributionBoard_CorrectTypeAssigned,
	IfcElectricDistributionBoardType_CorrectPredefinedType,
	IfcElectricFlowStorageDevice_CorrectPredefinedType,
	IfcElectricFlowStorageDevice_CorrectTypeAssigned,
	IfcElectricFlowStorageDeviceType_CorrectPredefinedType,
	IfcElectricGenerator_CorrectPredefinedType,
	IfcElectricGenerator_CorrectTypeAssigned,
	IfcElectricGeneratorType_CorrectPredefinedType,
	IfcElectricMotor_CorrectPredefinedType,
	IfcElectricMotor_CorrectTypeAssigned,
	IfcElectricMotorType_CorrectPredefinedType,
	IfcElectricTimeControl_CorrectPredefinedType,
	IfcElectricTimeControl_CorrectTypeAssigned,
	IfcElectricTimeControlType_CorrectPredefinedType,
	IfcElementAssembly_CorrectPredefinedType,
	IfcElementAssembly_CorrectTypeAssigned,
	IfcElementAssemblyType_CorrectPredefinedType,
	IfcElementQuantity_UniqueQuantityNames,
	IfcEngine_CorrectPredefinedType,
	IfcEngine_CorrectTypeAssigned,
	IfcEngineType_CorrectPredefinedType,
	IfcEvaporativeCooler_CorrectPredefinedType,
	IfcEvaporativeCooler_CorrectTypeAssigned,
	IfcEvaporativeCoolerType_CorrectPredefinedType,
	IfcEvaporator_CorrectPredefinedType,
	IfcEvaporator_CorrectTypeAssigned,
	IfcEvaporatorType_CorrectPredefinedType,
	IfcEvent_CorrectPredefinedType,
	IfcEvent_CorrectTypeAssigned,
	IfcEventType_CorrectPredefinedType,
	IfcEventType_CorrectEventTriggerType,
	IfcExternalReference_WR1,
	IfcExtrudedAreaSolid_ValidExtrusionDirection,
	IfcExtrudedAreaSolidTapered_CorrectProfileAssignment,
	IfcFace_HasOuterBound,
	IfcFan_CorrectPredefinedType,
	IfcFan_CorrectTypeAssigned,
	IfcFanType_CorrectPredefinedType,
	IfcFastener_CorrectPredefinedType,
	IfcFastener_CorrectTypeAssigned,
	IfcFastenerType_CorrectPredefinedType,
	IfcFeatureElementSubtraction_HasNoSubtraction,
	IfcFeatureElementSubtraction_IsNotFilling,
	IfcFillAreaStyle_MaxOneColour,
	IfcFillAreaStyle_MaxOneExtHatchStyle,
	IfcFillAreaStyle_ConsistentHatchStyleDef,
	IfcFillAreaStyleHatching_PatternStart2D,
	IfcFillAreaStyleHatching_RefHatchLine2D,
	IfcFilter_CorrectPredefinedType,
	IfcFilter_CorrectTypeAssigned,
	IfcFilterType_CorrectPredefinedType,
	IfcFireSuppressionTerminal_CorrectPredefinedType,
	IfcFireSuppressionTerminal_CorrectTypeAssigned,
	IfcFireSuppressionTerminalType_CorrectPredefinedType,
	IfcFixedReferenceSweptAreaSolid_DirectrixBounded,
	IfcFlowInstrument_CorrectPredefinedType,
	IfcFlowInstrument_CorrectTypeAssigned,
	IfcFlowInstrumentType_CorrectPredefinedType,
	IfcFlowMeter_CorrectPredefinedType,
	IfcFlowMeter_CorrectTypeAssigned,
	IfcFlowMeterType_CorrectPredefinedType,
	IfcFooting_CorrectPredefinedType,
	IfcFooting_CorrectTypeAssigned,
	IfcFootingType_CorrectPredefinedType,
	IfcFurniture_CorrectPredefinedType,
	IfcFurniture_CorrectTypeAssigned,
	IfcFurnitureType_CorrectPredefinedType,
	IfcGeographicElement_CorrectPredefinedType,
	IfcGeographicElement_CorrectTypeAssigned,
	IfcGeographicElementType_CorrectPredefinedType,
	IfcGeometricCurveSet_NoSurfaces,
	IfcGeometricRepresentationContext_North2D,
	IfcGeometricRepresentationSubContext_ParentNoSub,
	IfcGeometricRepresentationSubContext_UserTargetProvided,
	IfcGeometricRepresentationSubContext_NoCoordOperation,
	IfcGeometricSet_ConsistentDim,
	IfcGrid_HasPlacement,
	IfcGridAxis_WR1,
	IfcGridAxis_WR2,
	IfcHeatExchanger_CorrectPredefinedType,
	IfcHeatExchanger_CorrectTypeAssigned,
	IfcHeatExchangerType_CorrectPredefinedType,
	IfcHumidifier_CorrectPredefinedType,
	IfcHumidifier_CorrectTypeAssigned,
	IfcHumidifierType_CorrectPredefinedType,
	IfcIShapeProfileDef_ValidFlangeThickness,
	IfcIShapeProfileDef_ValidWebThickness,
	IfcIShapeProfileDef_ValidFilletRadius,
	IfcIndexedPolyCurve_Consecutive,
	IfcInterceptor_CorrectPredefinedType,
	IfcInterceptor_CorrectTypeAssigned,
	IfcInterceptorType_CorrectPredefinedType,
	IfcIntersectionCurve_TwoPCurves,
	IfcIntersectionCurve_DistinctSurfaces,
	IfcJunctionBox_CorrectPredefinedType,
	IfcJunctionBox_CorrectTypeAssigned,
	IfcJunctionBoxType_CorrectPredefinedType,
	IfcLShapeProfileDef_ValidThickness,
	IfcLaborResource_CorrectPredefinedType,
	IfcLaborResourceType_CorrectPredefinedType,
	IfcLamp_CorrectPredefinedType,
	IfcLamp_CorrectTypeAssigned,
	IfcLampType_CorrectPredefinedType,
	IfcLightFixture_CorrectPredefinedType,
	IfcLightFixture_CorrectTypeAssigned,
	IfcLightFixtureType_CorrectPredefinedType,
	IfcLine_SameDim,
]);

// =============================================================================
// Phase EX-4, IFC4 chunk 4 (planning/ifcopenshell-ts/70-express-rules-plan.md): the next
// 120 `SCOPE = 'entity'` rules, real file order, continuing directly from chunk 3's own
// last-ported rule with zero gap or overlap -- `IfcLocalPlacement_WR21` (real source line
// 7863) through `IfcRectangularTrimmedSurface_U1AndU2Different` (line 9093) in
// `src/ifcopenshell-python/ifcopenshell/express/rules/IFC4.py`. Independently re-derived
// (not trusted from the dispatching task brief alone) via the same small Python script
// chunks 1-3 already established (matching `^class (\w+)` + its own `SCOPE = '(\w+)'`
// line): exactly 120 entity-scope classes in this range, confirmed to immediately follow
// chunk 3's own last rule (`IfcLine_SameDim`, line 7852, zero gap) and to immediately
// precede `IfcRectangularTrimmedSurface_V1AndV2Different` (line 9104, reserved for chunk
// 5, zero overlap). IFC4 is now at 460/679 (435/652 entity + 25/25 type) after this chunk.
//
// =============================================================================
// Shape breakdown: existing helpers reused vs. bespoke bodies
// =============================================================================
//
// **`correctPredefinedType`**: 32 occurrences in this chunk (`IfcMechanicalFastener(Type)`,
// `IfcMedicalDevice(Type)`, `IfcMember(Type)`, `IfcMotorConnection(Type)`, `IfcOutlet(Type)`,
// `IfcPile(Type)`, `IfcPipeFitting(Type)`, `IfcPipeSegment(Type)`, `IfcPlate(Type)`,
// `IfcProcedure`/`IfcProcedureType`, `IfcProtectiveDevice(Type)`,
// `IfcProtectiveDeviceTrippingUnit(Type)`, `IfcPump(Type)`, `IfcRailing(Type)`, `IfcRamp`,
// `IfcRampFlight(Type)`, `IfcRampType`) -- 16 "occurrence" entities (`ObjectType`, optional)
// and 16 "*Type" entities (`ElementType`, mandatory) EXCEPT `IfcProcedureType`, whose own
// escape attribute is `ProcessType` (mandatory) -- the SAME 4th escape-attribute value
// chunk 3 first confirmed (`IfcLaborResourceType`), now seen a 2nd time.
//
// **`correctTypeAssigned`**: 15 occurrences, every one the standard `Ifc<Name> ->
// Ifc<Name>Type` shape with no naming quirks this time (unlike chunk 2's own
// `IfcDoor_CorrectStyleAssigned`/chunk 3's own `IfcEvent_CorrectTypeAssigned`).
//
// **Independently re-counted directly against this chunk's own 120 rule definitions**
// (not just estimated while drafting; re-counted again after the code-review-driven
// `optionalAttrUnitTypeEquals` generalization below moved `IfcProjectedCRS_IsLengthUnit`
// from bespoke into this tally): 32 `correctPredefinedType` + 15 `correctTypeAssigned` + 44
// reusing one of the smaller/newer shared helpers below (6 `attrGreaterEqualZero` + 6
// `optionalAttrUnitTypeEquals` + 5 `attrExists` + 4 `attrDimEquals` + 4
// `allShareFirstTypeOf` + 3 `optionalSameUnit` + 2 `hasSoleMaterialUsage` + 2
// `allShareFirstAttr` + 1 each of `ifcCorrectLocalPlacement`/`ifcCorrectDimensions`/
// `ifcUniqueDefinitionNames`/`userDefinedOrHasAttribute`/`ifcPathHeadToTail`/
// `containsSelfReference`/`ifcUniqueQuantityNames`/`attrSizeIsZero`/`ifcUniquePropertyName`/
// `ifcUniquePropertyTemplateNames`/`ifcCurveWeightsPositive`/`ifcSurfaceWeightsPositive`) =
// **29 rules got genuinely bespoke bodies** (32 + 15 + 44 + 29 = 120, exact).
//
// =============================================================================
// New shared helpers factored this chunk (crossed this project's own 3-occurrence
// threshold), plus 2 retrofits of already-shipped call sites
// =============================================================================
//
// **`hasSoleMaterialUsage(self, usageTypeName)`**: this chunk's own
// `IfcMemberStandardCase_HasMaterialProfileSetUsage` (real source line 7987) is the 3RD
// real occurrence of the exact `usedin(self, 'ifc4.ifcrelassociates.relatedobjects')`
// material-usage shape chunk 1's own `IfcBeamStandardCase_HasMaterialProfileSetUsage` and
// chunk 3's own `IfcColumnStandardCase_HasMaterialProfileSetUsage` each explicitly
// disclosed as "not yet a 3rd" -- and this chunk's own
// `IfcPlateStandardCase_HasMaterialLayerSetUsage` (line 8388) is a 4th, parameterized over
// a DIFFERENT usage-entity name (`IfcMaterialLayerSetUsage` instead of
// `IfcMaterialProfileSetUsage`). Factored into one shared helper taking the usage-entity
// `typeof(...)` string as a parameter; BOTH earlier call sites (chunk 1, chunk 3) are
// retrofitted in place to call it too, rather than leaving a 3rd/4th near-duplicate body
// unfactored.
//
// **`attrExists(self, attrName)`**: a bare `exists(X)` shape. Chunk 2's own
// `IfcBuildingElementProxy_HasObjectName` is the 1st occurrence; this chunk adds 4 more
// (`IfcProcedure_HasName`, `IfcProject_HasName`, `IfcPropertySet_ExistsName`,
// `IfcPropertySetTemplate_ExistsName`), for 5 total -- crossing the threshold well past the
// minimum. `IfcBuildingElementProxy_HasObjectName` is retrofitted to use it too.
//
// **`allShareFirstTypeOf(self, listAttrName)`**: `sizeof([temp for temp in X if not
// typeof(X[0]) == typeof(temp)]) == 0` -- every member of a list attribute shares the
// first member's own `typeof(...)`. 4 occurrences, all new to this chunk:
// `IfcPropertyEnumeration_WR01`/`IfcPropertyListValue_WR31` (unguarded -- both attributes
// are schema-mandatory, non-empty lists) and `IfcPropertyTableValue_WR22`/`WR23` (each
// guarded by its own `not exists(X) or ...`, since `DefiningValues`/`DefinedValues` are
// OPTIONAL on `IfcPropertyTableValue`).
//
// **`optionalSameUnit(self, attrA, attrB)`**: `not exists(A) or not exists(B) or typeof(A)
// == typeof(B)` -- 3 occurrences, all new to this chunk:
// `IfcPropertyBoundedValue_SameUnitUpperLower`/`SameUnitUpperSet`/`SameUnitLowerSet`
// (`UpperBoundValue`/`LowerBoundValue`/`SetPointValue`, pairwise).
//
// **`attrGreaterEqualZero(self, attrName)`**: `X >= 0.0`, the `>=` sibling of chunk 2's own
// `attrGreaterThanZero` (`>` only). 6 occurrences, all new to this chunk:
// `IfcQuantityArea_WR22`/`IfcQuantityCount_WR21`/`IfcQuantityLength_WR22`/
// `IfcQuantityTime_WR22`/`IfcQuantityVolume_WR22`/`IfcQuantityWeight_WR22`.
//
// **`optionalAttrUnitTypeEquals(self, attrName, expectedUnitType)`**: `not exists(X) or
// X.UnitType == <IfcUnitEnum member>`. 6 occurrences, all new to this chunk:
// `IfcQuantityArea_WR21`/`IfcQuantityLength_WR21`/`IfcQuantityTime_WR21`/
// `IfcQuantityVolume_WR21`/`IfcQuantityWeight_WR21` (all on `Unit`) plus
// `IfcProjectedCRS_IsLengthUnit` (on `MapUnit`, expecting `LENGTHUNIT`) -- **code-review
// finding, fixed**: originally factored as a `Unit`-only `optionalQuantityUnitTypeEquals`
// (5 occurrences) with `IfcProjectedCRS_IsLengthUnit` left bespoke alongside it despite
// having the exact same shape; generalized to take the attribute name as a parameter so
// both reuse one helper. `IfcQuantityCount` DOES inherit the same `Unit` attribute (from
// `IfcPhysicalSimpleQuantity`) -- confirmed directly against `generated/ifc4.d.ts` -- but
// real `IFC4.py` simply has no corresponding `IfcQuantityCount_WRxx` unit-type-check rule
// at all (only its own `WR21`, `CountValue >= 0.0`, exists for that class), so it's not a
// 7th call site. Byte-identical in shape to `whereRules/ifc2x3.ts`'s own already-ported
// `quantityUnitTypeOrAbsent` (4 occurrences there, `Unit`-only since IFC2X3 has no
// `IfcProjectedCRS`) -- ported fresh here, not imported, same "no cross-schema-file
// dependency" precedent as every other helper in this file.
//
// =============================================================================
// Smaller shapes reused from EXISTING (chunk 1-3) helpers, no new factoring needed
// =============================================================================
//
// `userDefinedOrHasAttribute` (`IfcObjective_WR21`), `attrDimEquals` (`IfcOffsetCurve2D_
// DimIs2D`/`IfcOffsetCurve3D_DimIs2D`/`IfcPcurve_DimIs2D`/`IfcPolygonalBoundedHalfSpace_
// BoundaryDim`), `allShareFirstAttr` (`IfcPolyLoop_AllPointsSameDim`/`IfcPolyline_
// SameDim`), `containsSelfReference` (`IfcPhysicalComplexQuantity_NoSelfReference`),
// `attrSizeIsZero` (`IfcProject_NoDecomposition`), `ifcUniquePropertyName`/
// `ifcUniquePropertyTemplateNames`/`ifcUniqueQuantityNames` (`IfcPropertySet_
// UniquePropertyNames`/`IfcPropertySetTemplate_UniquePropertyNames`/
// `IfcPhysicalComplexQuantity_UniqueQuantityNames`), `asList` (several list-comprehension
// bodies below).
//
// =============================================================================
// New rule-file-local EXPRESS-library helpers ported this chunk
// =============================================================================
//
// **`ifcPathHeadToTail`** (real source line 11928, used by `IfcPath_IsContinuous`) --
// byte-identical in shape to `whereRules/ifc2x3.ts`'s own already-ported version
// (confirmed directly, including that function's own `p = unknown` initial seed, same as
// IFC2X3's -- NOT `p = True` like `ifcLoopHeadToTail`'s own different seed). Ported as a
// fresh local copy per this file family's established "no cross-schema-file dependency"
// precedent, with its own local `EXPRESS_UNKNOWN` constant (mirroring `whereRules/
// ifc2x3.ts`'s own identical constant and identical "why a local constant, not a new
// `runtimeShim.ts` export" rationale -- not repeated here in full).
//
// **`ifcCorrectLocalPlacement`** (real source line 11607, used by `IfcLocalPlacement_
// WR21`) -- byte-identical in shape to `whereRules/ifc2x3.ts`'s own already-ported version
// (only the `'ifc4.'` vs `'ifc2x3.'` namespace prefix differs). Ported as a fresh local
// copy, same rationale.
//
// **`ifcCorrectDimensions`** (real source line 11439, used by `IfcNamedUnit_WR1`) -- the
// SAME 29-branch `IfcUnitEnum`-keyed dispatch table as `whereRules/ifc2x3.ts`'s own
// already-ported version, but **genuinely different in exactly ONE ROW**: the
// `ELECTRICCAPACITANCEUNIT`/`FARAD` branch is `IfcDimensionalExponents(-2, -1, 4, 2, 0, 0,
// 0)` here vs. IFC2X3's `(-2, 1, 4, 1, 0, 0, 0)` -- independently re-confirmed byte-for-byte
// directly against real `IFC4.py` source (line 11505). CORRECTION to this file's own
// cross-referenced source: TWO positional values differ, not one --
// `MassExponent` (`-1` vs. IFC2X3's `1`) AND `ElectricCurrentExponent` (`2` vs. `1`) both
// change. Phase EX-2's own already-merged `rules/ifc4.ts` comment (near its own `FARAD`
// branch) states only the `ElectricCurrentExponent` difference and is itself imprecise in
// the same way -- not fixed here (out of this chunk's own diff/scope, a different phase's
// already-shipped file), flagged for whoever next touches that file. **NOT a new
// finding** -- this is the exact same real schema-evolution difference Phase EX-2 already
// disclosed and independently verified byte-for-byte by the orchestrating session;
// cross-referenced here, not re-disclosed as new, only its own precision corrected. Needs a
// bare 7-arg
// `IfcDimensionalExponents(...)` constructor for its own literal branches -- reused via a
// newly-exported `ifcDimensionalExponents` in `rules/ifc4.ts` (mirroring `rules/ifc2x3.ts`'s
// own identical export, added by that file's own chunk 3), rather than duplicating a
// `getScratchFile().createEntity(...)` call 29 times inline.
//
// **`ifcUniqueDefinitionNames`**/**`ifcUniquePropertySetNames`** (real source lines
// 12124/12146, used by `IfcObject_UniquePropertySetNames`) -- two real, distinct top-level
// Python functions, neither previously ported (chunk 2/3's own `uniquePropertyLikeNames`
// covers `IfcUniquePropertyName`/`IfcUniquePropertyTemplateNames`/`IfcUniqueQuantityNames`
// specifically, all 3 byte-identical to each other, but `IfcUniquePropertySetNames` has a
// GENUINELY DIFFERENT body -- it only accumulates a `Name` for members that are themselves
// `IfcPropertySet`s, counting every other member separately as `unnamed`, then checks
// `names.size + unnamed == properties.length`). `IfcUniqueDefinitionNames` calls it after
// its own flattening pass over `relations` (each an `IfcRelDefinesByProperties`-shaped
// value): direct `IfcPropertySetDefinition`s are collected as-is, `IfcPropertySetDefinitionSet`
// members are flattened element-by-element -- ported faithfully as a genuine `ExpressSet`
// accumulation (`properties = properties + X`, real Python's own `express_set.__add__`),
// not a plain JS array, matching `IfcCorrectUnitAssignment`'s own already-established
// `express_set` accumulation idiom in this same file family.
//
// **`ifcCurveWeightsPositive`** (real source line 11708, used by
// `IfcRationalBSplineCurveWithKnots_WeightsGreaterZero`) -- byte-identical in shape to
// `whereRules/ifc2x3.ts`'s own already-ported version (confirmed directly). Ported as a
// fresh local copy, same "no cross-schema-file dependency" rationale.
//
// **`ifcSurfaceWeightsPositive`** (real source line 12084, used by
// `IfcRationalBSplineSurfaceWithKnots_WeightValuesGreaterZero`) -- genuinely IFC4-only, no
// IFC2X3 equivalent (confirmed: `IfcRationalBSplineSurfaceWithKnots`/`IfcBSplineSurface`
// don't exist in IFC2X3 at all). The straightforward 2D-nested-loop analog of
// `ifcCurveWeightsPositive` above (checks every `Weights[i][j]` over both `UUpper`/`VUpper`
// index ranges, instead of a single `UpperIndexOnControlPoints` range).
//
// =============================================================================
// No new real upstream Python bugs found in this chunk's own 120 rules
// =============================================================================
//
// Every rule in this chunk was read directly against its own real source body. **One
// genuine, disclosed naming quirk, not a bug** (same class of finding as chunk 2's own
// `IfcDoor_CorrectStyleAssigned`/chunk 3's own `IfcEvent_CorrectTypeAssigned`):
// `IfcOffsetCurve3D_DimIs2D`'s own real `RULE_NAME` is `'DimIs2D'`, but its own real body
// checks `BasisCurve.Dim == 3`, not `2` -- confirmed directly against real source (line
// 8088-8096), not a transcription slip on this port's own side; ported faithfully
// (`attrDimEquals(self, "BasisCurve", 3)`), matching the rule's own real, if misleadingly
// named, behavior. **Another genuine, disclosed schema-quirk, not a bug**: `IfcOccupant_
// WR31` (line 8068) has the exact semantic idea of `correctPredefinedType`'s "occurrence"
// sub-shape (an escape-attribute check gated on `PredefinedType == USERDEFINED`), but its
// own real body has NO leading `not exists(predefinedtype) or` guard (unlike every other
// `_CorrectPredefinedType`-shaped rule in this chunk) AND uses `not X == Y` instead of the
// usual `X != Y` -- ported bespoke, matching its own real structure exactly
// (`pyOr(pyNot(triEq(...)), () => exists(...))`) rather than force-fitting it into
// `correctPredefinedType`/`userDefinedOrHasAttribute` (verified the two forms are NOT
// perfectly equivalent under this port's own three-valued `Tri` logic in the
// `PredefinedType == INDETERMINATE` edge case, though both still satisfy `assertWhereRule`
// either way, since `INDETERMINATE` and `true` both count as "not `False`").
//
// **1 cascading consequence of an ALREADY-disclosed Phase EX-2 bug, not a new one**:
// `IfcRationalBSplineSurfaceWithKnots_WeightValuesGreaterZero` reads `self.Weights`, a
// DERIVE attribute whose own real formula (`IfcMakeArrayOfArray`, `rules/ifc4.ts`'s own
// header comment) unconditionally raises for any consistently-shaped input -- see that
// rule's own doc comment below for the full cross-reference (not re-disclosed as new
// here, matching Phase EX-2 chunk 4's own established "explicitly cross-referenced to
// its originating bug rather than re-disclosed as new" precedent).
// =============================================================================

/** Python: `unknown` (a bare module-level constant, `IFC4.py`) -- see this file's own header comment. */
const EXPRESS_UNKNOWN = "UNKNOWN" as unknown as Tri;

/**
 * Python: `IfcPathHeadToTail(apath)` (real source line 11928) -- byte-identical in shape to
 * `whereRules/ifc2x3.ts`'s own already-ported version (including its own `p = unknown`
 * initial seed). See this chunk's own header comment.
 */
function ifcPathHeadToTail(apath: EntityInstance): Tri {
	const edgeList = expressGetAttr(apath, "EdgeList", INDETERMINATE);
	const n = sizeof(edgeList) as number;
	let p: Tri = EXPRESS_UNKNOWN;
	for (const i of expressRange(2, n + 1)) {
		p = pyAnd(p, () =>
			triEq(
				expressGetAttr(
					expressGetItem(edgeList, i - 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
					"EdgeEnd",
					INDETERMINATE,
				),
				expressGetAttr(
					expressGetItem(edgeList, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
					"EdgeStart",
					INDETERMINATE,
				),
			),
		);
	}
	return p;
}

/**
 * Python: `IfcCorrectLocalPlacement(axisplacement, relplacement)` (real source line 11607)
 * -- byte-identical in shape to `whereRules/ifc2x3.ts`'s own already-ported version (only
 * the `'ifc4.'` namespace prefix differs). See this chunk's own header comment.
 */
function ifcCorrectLocalPlacement(axisplacement: unknown, relplacement: unknown): Tri {
	if (exists(relplacement)) {
		if (typeOfAttr(relplacement).has("ifc4.ifcgridplacement")) return INDETERMINATE;
		if (typeOfAttr(relplacement).has("ifc4.ifclocalplacement")) {
			if (typeOfAttr(axisplacement).has("ifc4.ifcaxis2placement2d")) return true;
			if (typeOfAttr(axisplacement).has("ifc4.ifcaxis2placement3d")) {
				const relativePlacement = expressGetAttr(relplacement, "RelativePlacement", INDETERMINATE);
				return triEq(expressGetAttr(relativePlacement, "Dim", INDETERMINATE), 3) === true;
			}
		}
		return true;
	}
	return INDETERMINATE;
}

/**
 * Python: `IfcCorrectDimensions(m, dim)` (real source line 11439) -- a 29-branch
 * `IfcUnitEnum`-keyed dispatch table. See this chunk's own header comment for the single,
 * cross-referenced (not new) `ELECTRICCAPACITANCEUNIT`/`FARAD` difference vs. IFC2X3.
 */
const UNIT_DIMENSIONAL_EXPONENTS: Record<string, readonly [number, number, number, number, number, number, number]> = {
	LENGTHUNIT: [1, 0, 0, 0, 0, 0, 0],
	MASSUNIT: [0, 1, 0, 0, 0, 0, 0],
	TIMEUNIT: [0, 0, 1, 0, 0, 0, 0],
	ELECTRICCURRENTUNIT: [0, 0, 0, 1, 0, 0, 0],
	THERMODYNAMICTEMPERATUREUNIT: [0, 0, 0, 0, 1, 0, 0],
	AMOUNTOFSUBSTANCEUNIT: [0, 0, 0, 0, 0, 1, 0],
	LUMINOUSINTENSITYUNIT: [0, 0, 0, 0, 0, 0, 1],
	PLANEANGLEUNIT: [0, 0, 0, 0, 0, 0, 0],
	SOLIDANGLEUNIT: [0, 0, 0, 0, 0, 0, 0],
	AREAUNIT: [2, 0, 0, 0, 0, 0, 0],
	VOLUMEUNIT: [3, 0, 0, 0, 0, 0, 0],
	ABSORBEDDOSEUNIT: [2, 0, -2, 0, 0, 0, 0],
	RADIOACTIVITYUNIT: [0, 0, -1, 0, 0, 0, 0],
	ELECTRICCAPACITANCEUNIT: [-2, -1, 4, 2, 0, 0, 0],
	DOSEEQUIVALENTUNIT: [2, 0, -2, 0, 0, 0, 0],
	ELECTRICCHARGEUNIT: [0, 0, 1, 1, 0, 0, 0],
	ELECTRICCONDUCTANCEUNIT: [-2, -1, 3, 2, 0, 0, 0],
	ELECTRICVOLTAGEUNIT: [2, 1, -3, -1, 0, 0, 0],
	ELECTRICRESISTANCEUNIT: [2, 1, -3, -2, 0, 0, 0],
	ENERGYUNIT: [2, 1, -2, 0, 0, 0, 0],
	FORCEUNIT: [1, 1, -2, 0, 0, 0, 0],
	FREQUENCYUNIT: [0, 0, -1, 0, 0, 0, 0],
	INDUCTANCEUNIT: [2, 1, -2, -2, 0, 0, 0],
	ILLUMINANCEUNIT: [-2, 0, 0, 0, 0, 0, 1],
	LUMINOUSFLUXUNIT: [0, 0, 0, 0, 0, 0, 1],
	MAGNETICFLUXUNIT: [2, 1, -2, -1, 0, 0, 0],
	MAGNETICFLUXDENSITYUNIT: [0, 1, -2, -1, 0, 0, 0],
	POWERUNIT: [2, 1, -3, 0, 0, 0, 0],
	PRESSUREUNIT: [-1, 1, -2, 0, 0, 0, 0],
};

function ifcCorrectDimensions(m: unknown, dim: unknown): Tri {
	if (typeof m !== "string") return EXPRESS_UNKNOWN;
	const expected = UNIT_DIMENSIONAL_EXPONENTS[m];
	if (expected === undefined) return EXPRESS_UNKNOWN;
	return triEq(dim, ifcDimensionalExponents(...expected)) === true;
}

/**
 * Python: `IfcUniquePropertySetNames(properties)` (real source line 12146) -- a
 * rule-file-local EXPRESS-library helper, called by `IfcUniqueDefinitionNames` below (NOT
 * itself directly called by any WHERE-rule in this chunk). See this chunk's own header
 * comment.
 */
function ifcUniquePropertySetNames(properties: unknown): boolean {
	let names = new ExpressSet<unknown>();
	let unnamed = 0;
	const n = hiIndex(properties) as number;
	for (const i of expressRange(1, n + 1)) {
		const item = expressGetItem(properties, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		if (typeOfAttr(item).has("ifc4.ifcpropertyset")) {
			names = names.plus(expressGetAttr(item, "Name", INDETERMINATE));
		} else {
			unnamed += 1;
		}
	}
	return names.size + unnamed === (sizeof(properties) as number);
}

/**
 * Python: `IfcUniqueDefinitionNames(relations)` (real source line 12124) -- a
 * rule-file-local EXPRESS-library helper used by `IfcObject_UniquePropertySetNames` below.
 * See this chunk's own header comment.
 */
function ifcUniqueDefinitionNames(relations: unknown): boolean {
	if ((sizeof(relations) as number) === 0) return true;
	let properties = new ExpressSet<unknown>();
	const n = hiIndex(relations) as number;
	for (const i of expressRange(1, n + 1)) {
		const rel = expressGetItem(relations, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const definition = expressGetAttr(rel, "RelatingPropertyDefinition", INDETERMINATE);
		if (typeOfAttr(definition).has("ifc4.ifcpropertysetdefinition")) {
			properties = properties.plus(definition);
		} else if (typeOfAttr(definition).has("ifc4.ifcpropertysetdefinitionset")) {
			const definitionSet = definition;
			const m = hiIndex(definitionSet) as number;
			for (const j of expressRange(1, m + 1)) {
				properties = properties.plus(expressGetItem(definitionSet, j - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE));
			}
		}
	}
	return ifcUniquePropertySetNames(properties);
}

/**
 * Python: `IfcCurveWeightsPositive(b)` (real source line 11708) -- byte-identical in shape
 * to `whereRules/ifc2x3.ts`'s own already-ported version. See this chunk's own header
 * comment.
 */
function ifcCurveWeightsPositive(b: EntityInstance): boolean {
	const weights = expressGetAttr(b, "Weights", INDETERMINATE);
	const upperIndex = expressGetAttr(b, "UpperIndexOnControlPoints", INDETERMINATE) as number;
	for (const i of expressRange(0, upperIndex + 1)) {
		if (triLe(expressGetItem(weights, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 0.0) === true) {
			return false;
		}
	}
	return true;
}

/**
 * Python: `IfcSurfaceWeightsPositive(b)` (real source line 12084) -- genuinely IFC4-only,
 * the 2D-nested-loop analog of `ifcCurveWeightsPositive` above. See this chunk's own header
 * comment.
 */
function ifcSurfaceWeightsPositive(b: EntityInstance): boolean {
	const weights = expressGetAttr(b, "Weights", INDETERMINATE);
	const uUpper = expressGetAttr(b, "UUpper", INDETERMINATE) as number;
	const vUpper = expressGetAttr(b, "VUpper", INDETERMINATE) as number;
	for (const i of expressRange(0, uUpper + 1)) {
		const row = expressGetItem(weights, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		for (const j of expressRange(0, vUpper + 1)) {
			if (triLe(expressGetItem(row, j - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 0.0) === true) {
				return false;
			}
		}
	}
	return true;
}

/**
 * Shared shape, now a 3rd/4th occurrence -- see this chunk's own header comment for the
 * full disclosure (crosses this project's own 3-occurrence factoring threshold).
 */
function hasSoleMaterialUsage(self: EntityInstance, usageTypeName: string): boolean {
	const refs = usedIn(self, "ifc4.ifcrelassociates.relatedobjects");
	const count = refs.filter(
		(temp) =>
			typeOfAttr(temp).has("ifc4.ifcrelassociatesmaterial") &&
			typeOfAttr(expressGetAttr(temp, "RelatingMaterial", INDETERMINATE)).has(usageTypeName),
	).length;
	return count === 1;
}

/** New shared shape (5 occurrences, see this chunk's own header comment) -- Python: `exists(X)`. */
function attrExists(self: EntityInstance, attrName: string): boolean {
	return exists(expressGetAttr(self, attrName, INDETERMINATE));
}

/**
 * New shared shape (4 occurrences, see this chunk's own header comment) -- Python:
 * `sizeof([temp for temp in X if not typeof(X[0]) == typeof(temp)]) == 0`.
 */
function allShareFirstTypeOf(self: EntityInstance, listAttrName: string): boolean {
	const list = expressGetAttr(self, listAttrName, INDETERMINATE);
	const items = isIndeterminate(list) ? [] : (list as unknown[]);
	const first = expressGetItem(items, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	// Hoisted out of the loop (code-review finding) -- `first` never changes across
	// iterations, so `typeOfAttr(first)` need only be computed once, matching
	// `allShareFirstAttr`'s own established idiom immediately above.
	const firstType = typeOfAttr(first);
	const violating = items.filter((temp) => !firstType.equals(typeOfAttr(temp))).length;
	return violating === 0;
}

/**
 * New shared shape (3 occurrences, see this chunk's own header comment) -- Python: `not
 * exists(A) or not exists(B) or typeof(A) == typeof(B)`.
 */
function optionalSameUnit(self: EntityInstance, attrA: string, attrB: string): Tri {
	const a = expressGetAttr(self, attrA, INDETERMINATE);
	const b = expressGetAttr(self, attrB, INDETERMINATE);
	return pyOr(!exists(a), () => pyOr(!exists(b), () => typeOfAttr(a).equals(typeOfAttr(b))));
}

/**
 * New shared shape (6 occurrences, see this chunk's own header comment) -- Python: `X >=
 * 0.0`, the `>=` sibling of this file's own chunk 2 `attrGreaterThanZero` (`>` only).
 * **Code-review finding, considered and declined**: folding this and
 * `attrGreaterThanZero` into one `attrCompareZero(self, attrName, cmp)` was considered --
 * declined because `attrGreaterThanZero` already has its own established call sites from
 * chunk 2 that this chunk does not otherwise touch, and unifying the two would mean
 * editing already-shipped, already-reviewed code for a purely cosmetic gain (one
 * one-line comparator function vs. two). Flagged here for whoever next adds a 3rd
 * comparator variant (e.g. a `<=` sibling), at which point the fold pays for itself.
 */
function attrGreaterEqualZero(self: EntityInstance, attrName: string): Tri {
	return triGe(expressGetAttr(self, attrName, INDETERMINATE), 0.0);
}

/**
 * New shared shape (6 occurrences, see this chunk's own header comment) -- Python: `not
 * exists(X) or X.UnitType == <IfcUnitEnum member>`. **Code-review finding, fixed**:
 * originally hardcoded `"Unit"` as the attribute name (under the name
 * `optionalQuantityUnitTypeEquals`) even though this exact shape ALSO appears, in this
 * same chunk, on `IfcProjectedCRS_IsLengthUnit`'s own `MapUnit` attribute -- generalized
 * to take the attribute name as a parameter so both reuse one helper, rather than leaving
 * `IfcProjectedCRS_IsLengthUnit` bespoke. Byte-identical in shape to `whereRules/
 * ifc2x3.ts`'s own already-ported `quantityUnitTypeOrAbsent` (4 occurrences there) --
 * ported fresh here per this file family's own "no cross-schema-file dependency"
 * precedent, not imported.
 */
function optionalAttrUnitTypeEquals(self: EntityInstance, attrName: string, expectedUnitType: string): Tri {
	const unit = expressGetAttr(self, attrName, INDETERMINATE);
	return pyOr(!exists(unit), () => triEq(expressGetAttr(unit, "UnitType", INDETERMINATE), expectedUnitType));
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 7863-9093, this chunk's own 120).
// =============================================================================

// `IfcLocalPlacement_WR21` (line 7863): `IfcCorrectLocalPlacement(RelativePlacement, PlacementRelTo)`.
const IfcLocalPlacement_WR21 = entityRule("IfcLocalPlacement", "WR21", (self) => {
	const placementRelTo = expressGetAttr(self, "PlacementRelTo", INDETERMINATE);
	const relativePlacement = expressGetAttr(self, "RelativePlacement", INDETERMINATE);
	assertWhereRule(
		ifcCorrectLocalPlacement(relativePlacement, placementRelTo),
		"IfcLocalPlacement: RelativePlacement's own dimensionality/kind must be consistent with PlacementRelTo's own kind.",
	);
});

// `IfcMaterialDefinitionRepresentation_OnlyStyledRepresentations` (line 7874): `sizeof([temp
// for temp in Representations if not IfcStyledRepresentation in typeof(temp)]) == 0`.
const IfcMaterialDefinitionRepresentation_OnlyStyledRepresentations = entityRule(
	"IfcMaterialDefinitionRepresentation",
	"OnlyStyledRepresentations",
	(self) => {
		const representations = asList<EntityInstance>(expressGetAttr(self, "Representations", INDETERMINATE));
		const violating = representations.filter((temp) => !typeOfAttr(temp).has("ifc4.ifcstyledrepresentation")).length;
		assertWhereRule(
			violating === 0,
			"IfcMaterialDefinitionRepresentation: every Representations member must be an IfcStyledRepresentation.",
		);
	},
);

// `IfcMaterialLayer_NormalizedPriority` (line 7884): `not exists(Priority) or 0 <= Priority <= 100`.
const IfcMaterialLayer_NormalizedPriority = entityRule("IfcMaterialLayer", "NormalizedPriority", (self) => {
	const priority = expressGetAttr(self, "Priority", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(priority), () => pyAnd(triLe(0, priority), () => triLe(priority, 100))),
		"IfcMaterialLayer: if Priority is given, it must be in [0, 100].",
	);
});

// `IfcMaterialProfile_NormalizedPriority` (line 7897): byte-identical shape to
// `IfcMaterialLayer_NormalizedPriority` above (only the entity name differs).
const IfcMaterialProfile_NormalizedPriority = entityRule("IfcMaterialProfile", "NormalizedPriority", (self) => {
	const priority = expressGetAttr(self, "Priority", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(priority), () => pyAnd(triLe(0, priority), () => triLe(priority, 100))),
		"IfcMaterialProfile: if Priority is given, it must be in [0, 100].",
	);
});

// `IfcMechanicalFastener_CorrectPredefinedType` (line 7907).
const IfcMechanicalFastener_CorrectPredefinedType = entityRule(
	"IfcMechanicalFastener",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcMechanicalFastener: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcMechanicalFastener_CorrectTypeAssigned` (line 7917).
const IfcMechanicalFastener_CorrectTypeAssigned = entityRule("IfcMechanicalFastener", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMechanicalFastenerType"),
		"IfcMechanicalFastener: if IsTypedBy is given, its RelatingType must be an IfcMechanicalFastenerType.",
	);
});

// `IfcMechanicalFastenerType_CorrectPredefinedType` (line 7927).
const IfcMechanicalFastenerType_CorrectPredefinedType = entityRule(
	"IfcMechanicalFastenerType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcMechanicalFastenerType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcMedicalDevice_CorrectPredefinedType` (line 7937).
const IfcMedicalDevice_CorrectPredefinedType = entityRule("IfcMedicalDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMedicalDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMedicalDevice_CorrectTypeAssigned` (line 7947).
const IfcMedicalDevice_CorrectTypeAssigned = entityRule("IfcMedicalDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMedicalDeviceType"),
		"IfcMedicalDevice: if IsTypedBy is given, its RelatingType must be an IfcMedicalDeviceType.",
	);
});

// `IfcMedicalDeviceType_CorrectPredefinedType` (line 7957).
const IfcMedicalDeviceType_CorrectPredefinedType = entityRule(
	"IfcMedicalDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcMedicalDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcMember_CorrectPredefinedType` (line 7967).
const IfcMember_CorrectPredefinedType = entityRule("IfcMember", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMember: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMember_CorrectTypeAssigned` (line 7977).
const IfcMember_CorrectTypeAssigned = entityRule("IfcMember", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMemberType"),
		"IfcMember: if IsTypedBy is given, its RelatingType must be an IfcMemberType.",
	);
});

// `IfcMemberStandardCase_HasMaterialProfileSetUsage` (line 7987): the 3rd real occurrence of
// `hasSoleMaterialUsage`'s own shape -- see this chunk's own header comment.
const IfcMemberStandardCase_HasMaterialProfileSetUsage = entityRule(
	"IfcMemberStandardCase",
	"HasMaterialProfileSetUsage",
	(self) => {
		assertWhereRule(
			hasSoleMaterialUsage(self, "ifc4.ifcmaterialprofilesetusage"),
			"IfcMemberStandardCase: must be associated with exactly one IfcRelAssociatesMaterial whose RelatingMaterial is an IfcMaterialProfileSetUsage.",
		);
	},
);

// `IfcMemberType_CorrectPredefinedType` (line 7996).
const IfcMemberType_CorrectPredefinedType = entityRule("IfcMemberType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcMemberType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcMotorConnection_CorrectPredefinedType` (line 8009).
const IfcMotorConnection_CorrectPredefinedType = entityRule("IfcMotorConnection", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMotorConnection: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMotorConnection_CorrectTypeAssigned` (line 8019).
const IfcMotorConnection_CorrectTypeAssigned = entityRule("IfcMotorConnection", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMotorConnectionType"),
		"IfcMotorConnection: if IsTypedBy is given, its RelatingType must be an IfcMotorConnectionType.",
	);
});

// `IfcMotorConnectionType_CorrectPredefinedType` (line 8029).
const IfcMotorConnectionType_CorrectPredefinedType = entityRule(
	"IfcMotorConnectionType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcMotorConnectionType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcNamedUnit_WR1` (line 8039): `IfcCorrectDimensions(UnitType, Dimensions)`.
const IfcNamedUnit_WR1 = entityRule("IfcNamedUnit", "WR1", (self) => {
	assertWhereRule(
		ifcCorrectDimensions(
			expressGetAttr(self, "UnitType", INDETERMINATE),
			expressGetAttr(self, "Dimensions", INDETERMINATE),
		),
		"IfcNamedUnit: Dimensions must match UnitType's own real-world dimensional exponents.",
	);
});

// `IfcObject_UniquePropertySetNames` (line 8048): `sizeof(IsDefinedBy) == 0 or
// IfcUniqueDefinitionNames(IsDefinedBy)`.
const IfcObject_UniquePropertySetNames = entityRule("IfcObject", "UniquePropertySetNames", (self) => {
	const isDefinedBy = expressGetAttr(self, "IsDefinedBy", INDETERMINATE);
	assertWhereRule(
		pyOr(triEq(sizeof(isDefinedBy), 0), () => ifcUniqueDefinitionNames(isDefinedBy)),
		"IfcObject: every IsDefinedBy relationship's own property/quantity set must have a unique Name.",
	);
});

// `IfcObjective_WR21` (line 8058): `ObjectiveQualifier != USERDEFINED or (ObjectiveQualifier
// == USERDEFINED and exists(UserDefinedQualifier))`.
const IfcObjective_WR21 = entityRule("IfcObjective", "WR21", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "ObjectiveQualifier", "UserDefinedQualifier"),
		"IfcObjective: if ObjectiveQualifier is USERDEFINED, UserDefinedQualifier must be given.",
	);
});

// `IfcOccupant_WR31` (line 8068): `not PredefinedType == USERDEFINED or exists(ObjectType)`
// -- see this chunk's own header comment for why this is NOT force-fit into
// `correctPredefinedType`/`userDefinedOrHasAttribute` (no leading `not exists(...)` guard,
// different logical shape, real schema/naming quirk).
const IfcOccupant_WR31 = entityRule("IfcOccupant", "WR31", (self) => {
	const predefinedType = expressGetAttr(self, "PredefinedType", INDETERMINATE);
	assertWhereRule(
		pyOr(pyNot(triEq(predefinedType, "USERDEFINED")), () => exists(expressGetAttr(self, "ObjectType", INDETERMINATE))),
		"IfcOccupant: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcOffsetCurve2D_DimIs2D` (line 8078): `BasisCurve.Dim == 2`.
const IfcOffsetCurve2D_DimIs2D = entityRule("IfcOffsetCurve2D", "DimIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "BasisCurve", 2), "IfcOffsetCurve2D.BasisCurve.Dim must equal 2.");
});

// `IfcOffsetCurve3D_DimIs2D` (line 8088): `BasisCurve.Dim == 3`. **Naming quirk, not a
// bug** -- see this chunk's own header comment: the real `RULE_NAME` says "DimIs2D" but the
// real body checks `== 3`, confirmed directly against source.
const IfcOffsetCurve3D_DimIs2D = entityRule("IfcOffsetCurve3D", "DimIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "BasisCurve", 3), "IfcOffsetCurve3D.BasisCurve.Dim must equal 3.");
});

// `IfcOrientedEdge_EdgeElementNotOriented` (line 8098): `not IfcOrientedEdge in typeof(EdgeElement)`.
const IfcOrientedEdge_EdgeElementNotOriented = entityRule("IfcOrientedEdge", "EdgeElementNotOriented", (self) => {
	const edgeElement = expressGetAttr(self, "EdgeElement", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(edgeElement).has("ifc4.ifcorientededge"),
		"IfcOrientedEdge.EdgeElement must not itself be an IfcOrientedEdge.",
	);
});

// `IfcOutlet_CorrectPredefinedType` (line 8118).
const IfcOutlet_CorrectPredefinedType = entityRule("IfcOutlet", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcOutlet: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcOutlet_CorrectTypeAssigned` (line 8128).
const IfcOutlet_CorrectTypeAssigned = entityRule("IfcOutlet", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcOutletType"),
		"IfcOutlet: if IsTypedBy is given, its RelatingType must be an IfcOutletType.",
	);
});

// `IfcOutletType_CorrectPredefinedType` (line 8138).
const IfcOutletType_CorrectPredefinedType = entityRule("IfcOutletType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcOutletType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcOwnerHistory_CorrectChangeAction` (line 8148): `exists(LastModifiedDate) or (not
// exists(LastModifiedDate) and not exists(ChangeAction)) or (not exists(LastModifiedDate)
// and exists(ChangeAction) and (ChangeAction == NOTDEFINED or ChangeAction == NOCHANGE))`.
const IfcOwnerHistory_CorrectChangeAction = entityRule("IfcOwnerHistory", "CorrectChangeAction", (self) => {
	const changeAction = expressGetAttr(self, "ChangeAction", INDETERMINATE);
	const lastModifiedDate = expressGetAttr(self, "LastModifiedDate", INDETERMINATE);
	const hasLastModified = exists(lastModifiedDate);
	const hasChangeAction = exists(changeAction);
	assertWhereRule(
		hasLastModified ||
			(!hasLastModified && !hasChangeAction) ||
			(!hasLastModified &&
				hasChangeAction &&
				(triEq(changeAction, "NOTDEFINED") === true || triEq(changeAction, "NOCHANGE") === true)),
		"IfcOwnerHistory: if LastModifiedDate is absent, ChangeAction must be absent or NOTDEFINED/NOCHANGE.",
	);
});

// `IfcPath_IsContinuous` (line 8159): `IfcPathHeadToTail(self)`.
const IfcPath_IsContinuous = entityRule("IfcPath", "IsContinuous", (self) => {
	assertWhereRule(ifcPathHeadToTail(self), "IfcPath: EdgeList must form a connected head-to-tail path.");
});

// `IfcPcurve_DimIs2D` (line 8168): `ReferenceCurve.Dim == 2`.
const IfcPcurve_DimIs2D = entityRule("IfcPcurve", "DimIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "ReferenceCurve", 2), "IfcPcurve.ReferenceCurve.Dim must equal 2.");
});

// `IfcPerson_IdentifiablePerson` (line 8178): `exists(Identification) or exists(FamilyName)
// or exists(GivenName)`.
const IfcPerson_IdentifiablePerson = entityRule("IfcPerson", "IdentifiablePerson", (self) => {
	const identification = expressGetAttr(self, "Identification", INDETERMINATE);
	const familyName = expressGetAttr(self, "FamilyName", INDETERMINATE);
	const givenName = expressGetAttr(self, "GivenName", INDETERMINATE);
	assertWhereRule(
		exists(identification) || exists(familyName) || exists(givenName),
		"IfcPerson: at least one of Identification, FamilyName, GivenName must be given.",
	);
});

// `IfcPerson_ValidSetOfNames` (line 8190): `not exists(MiddleNames) or exists(FamilyName) or
// exists(GivenName)`.
const IfcPerson_ValidSetOfNames = entityRule("IfcPerson", "ValidSetOfNames", (self) => {
	const familyName = expressGetAttr(self, "FamilyName", INDETERMINATE);
	const givenName = expressGetAttr(self, "GivenName", INDETERMINATE);
	const middleNames = expressGetAttr(self, "MiddleNames", INDETERMINATE);
	assertWhereRule(
		!exists(middleNames) || exists(familyName) || exists(givenName),
		"IfcPerson: if MiddleNames is given, FamilyName or GivenName must also be given.",
	);
});

// `IfcPhysicalComplexQuantity_NoSelfReference` (line 8202): `sizeof([temp for temp in
// HasQuantities if self == temp]) == 0`.
const IfcPhysicalComplexQuantity_NoSelfReference = entityRule(
	"IfcPhysicalComplexQuantity",
	"NoSelfReference",
	(self) => {
		assertWhereRule(
			containsSelfReference(self, "HasQuantities"),
			"IfcPhysicalComplexQuantity: HasQuantities must not contain a self-reference.",
		);
	},
);

// `IfcPhysicalComplexQuantity_UniqueQuantityNames` (line 8212): `IfcUniqueQuantityNames(HasQuantities)`.
const IfcPhysicalComplexQuantity_UniqueQuantityNames = entityRule(
	"IfcPhysicalComplexQuantity",
	"UniqueQuantityNames",
	(self) => {
		assertWhereRule(
			ifcUniqueQuantityNames(expressGetAttr(self, "HasQuantities", INDETERMINATE)),
			"IfcPhysicalComplexQuantity: every HasQuantities member must have a unique Name.",
		);
	},
);

// `IfcPile_CorrectPredefinedType` (line 8222).
const IfcPile_CorrectPredefinedType = entityRule("IfcPile", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPile: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPile_CorrectTypeAssigned` (line 8232).
const IfcPile_CorrectTypeAssigned = entityRule("IfcPile", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPileType"),
		"IfcPile: if IsTypedBy is given, its RelatingType must be an IfcPileType.",
	);
});

// `IfcPileType_CorrectPredefinedType` (line 8242).
const IfcPileType_CorrectPredefinedType = entityRule("IfcPileType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPileType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPipeFitting_CorrectPredefinedType` (line 8252).
const IfcPipeFitting_CorrectPredefinedType = entityRule("IfcPipeFitting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPipeFitting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPipeFitting_CorrectTypeAssigned` (line 8262).
const IfcPipeFitting_CorrectTypeAssigned = entityRule("IfcPipeFitting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPipeFittingType"),
		"IfcPipeFitting: if IsTypedBy is given, its RelatingType must be an IfcPipeFittingType.",
	);
});

// `IfcPipeFittingType_CorrectPredefinedType` (line 8272).
const IfcPipeFittingType_CorrectPredefinedType = entityRule("IfcPipeFittingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPipeFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPipeSegment_CorrectPredefinedType` (line 8282).
const IfcPipeSegment_CorrectPredefinedType = entityRule("IfcPipeSegment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPipeSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPipeSegment_CorrectTypeAssigned` (line 8292).
const IfcPipeSegment_CorrectTypeAssigned = entityRule("IfcPipeSegment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPipeSegmentType"),
		"IfcPipeSegment: if IsTypedBy is given, its RelatingType must be an IfcPipeSegmentType.",
	);
});

// `IfcPipeSegmentType_CorrectPredefinedType` (line 8302).
const IfcPipeSegmentType_CorrectPredefinedType = entityRule("IfcPipeSegmentType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPipeSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPixelTexture_MinPixelInS` (line 8312): `Width >= 1`.
const IfcPixelTexture_MinPixelInS = entityRule("IfcPixelTexture", "MinPixelInS", (self) => {
	assertWhereRule(triGe(expressGetAttr(self, "Width", INDETERMINATE), 1), "IfcPixelTexture.Width must be >= 1.");
});

// `IfcPixelTexture_MinPixelInT` (line 8322): `Height >= 1`.
const IfcPixelTexture_MinPixelInT = entityRule("IfcPixelTexture", "MinPixelInT", (self) => {
	assertWhereRule(triGe(expressGetAttr(self, "Height", INDETERMINATE), 1), "IfcPixelTexture.Height must be >= 1.");
});

// `IfcPixelTexture_NumberOfColours` (line 8332): `1 <= ColourComponents <= 4`.
const IfcPixelTexture_NumberOfColours = entityRule("IfcPixelTexture", "NumberOfColours", (self) => {
	const colourComponents = expressGetAttr(self, "ColourComponents", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLe(1, colourComponents), () => triLe(colourComponents, 4)),
		"IfcPixelTexture.ColourComponents must be in [1, 4].",
	);
});

// `IfcPixelTexture_SizeOfPixelList` (line 8342): `sizeof(Pixel) == Width * Height`.
const IfcPixelTexture_SizeOfPixelList = entityRule("IfcPixelTexture", "SizeOfPixelList", (self) => {
	const width = expressGetAttr(self, "Width", INDETERMINATE) as number;
	const height = expressGetAttr(self, "Height", INDETERMINATE) as number;
	const pixel = expressGetAttr(self, "Pixel", INDETERMINATE);
	assertWhereRule(triEq(sizeof(pixel), width * height), "IfcPixelTexture: Pixel size must equal Width * Height.");
});

// `IfcPixelTexture_PixelAsByteAndSameLength` (line 8354): `sizeof([temp for temp in Pixel if
// blength(temp) % 8 == 0 and blength(temp) == blength(Pixel[0])]) == sizeof(Pixel)`.
const IfcPixelTexture_PixelAsByteAndSameLength = entityRule("IfcPixelTexture", "PixelAsByteAndSameLength", (self) => {
	const pixel = expressGetAttr(self, "Pixel", INDETERMINATE);
	const items = asList<unknown>(pixel);
	const first = expressGetItem(items, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const firstLength = bLength(first) as number;
	const matching = items.filter((temp) => {
		const len = bLength(temp) as number;
		return len % 8 === 0 && len === firstLength;
	}).length;
	assertWhereRule(
		matching === items.length,
		"IfcPixelTexture: every Pixel member must be a whole number of bytes and share the first member's own length.",
	);
});

// `IfcPlate_CorrectPredefinedType` (line 8368).
const IfcPlate_CorrectPredefinedType = entityRule("IfcPlate", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPlate: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPlate_CorrectTypeAssigned` (line 8378).
const IfcPlate_CorrectTypeAssigned = entityRule("IfcPlate", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPlateType"),
		"IfcPlate: if IsTypedBy is given, its RelatingType must be an IfcPlateType.",
	);
});

// `IfcPlateStandardCase_HasMaterialLayerSetUsage` (line 8388): the 4th real occurrence of
// `hasSoleMaterialUsage`'s own shape, parameterized over `IfcMaterialLayerSetUsage` instead
// of `IfcMaterialProfileSetUsage` -- see this chunk's own header comment.
const IfcPlateStandardCase_HasMaterialLayerSetUsage = entityRule(
	"IfcPlateStandardCase",
	"HasMaterialLayerSetUsage",
	(self) => {
		assertWhereRule(
			hasSoleMaterialUsage(self, "ifc4.ifcmateriallayersetusage"),
			"IfcPlateStandardCase: must be associated with exactly one IfcRelAssociatesMaterial whose RelatingMaterial is an IfcMaterialLayerSetUsage.",
		);
	},
);

// `IfcPlateType_CorrectPredefinedType` (line 8397).
const IfcPlateType_CorrectPredefinedType = entityRule("IfcPlateType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPlateType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPolyLoop_AllPointsSameDim` (line 8415): every `Polygon` member shares the first
// member's own `Dim`.
const IfcPolyLoop_AllPointsSameDim = entityRule("IfcPolyLoop", "AllPointsSameDim", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "Polygon", "Dim"),
		"IfcPolyLoop: every Polygon member must share the first member's own Dim.",
	);
});

// `IfcPolygonalBoundedHalfSpace_BoundaryDim` (line 8425): `PolygonalBoundary.Dim == 2`.
const IfcPolygonalBoundedHalfSpace_BoundaryDim = entityRule("IfcPolygonalBoundedHalfSpace", "BoundaryDim", (self) => {
	assertWhereRule(
		attrDimEquals(self, "PolygonalBoundary", 2),
		"IfcPolygonalBoundedHalfSpace.PolygonalBoundary.Dim must equal 2.",
	);
});

// `IfcPolygonalBoundedHalfSpace_BoundaryType` (line 8435): `sizeof(typeof(PolygonalBoundary)
// * ['ifc4.ifcpolyline', 'ifc4.ifccompositecurve']) == 1`.
const IfcPolygonalBoundedHalfSpace_BoundaryType = entityRule("IfcPolygonalBoundedHalfSpace", "BoundaryType", (self) => {
	const polygonalBoundary = expressGetAttr(self, "PolygonalBoundary", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(polygonalBoundary).multiply(["ifc4.ifcpolyline", "ifc4.ifccompositecurve"]).size === 1,
		"IfcPolygonalBoundedHalfSpace.PolygonalBoundary must be exactly one of IfcPolyline/IfcCompositeCurve.",
	);
});

// `IfcPolyline_SameDim` (line 8445): every `Points` member shares the first member's own `Dim`.
const IfcPolyline_SameDim = entityRule("IfcPolyline", "SameDim", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "Points", "Dim"),
		"IfcPolyline: every Points member must share the first member's own Dim.",
	);
});

// `IfcPostalAddress_WR1` (line 8455): `exists(InternalLocation) or exists(AddressLines) or
// exists(PostalBox) or exists(PostalCode) or exists(Town) or exists(Region) or exists(Country)`.
const IfcPostalAddress_WR1 = entityRule("IfcPostalAddress", "WR1", (self) => {
	const internalLocation = expressGetAttr(self, "InternalLocation", INDETERMINATE);
	const addressLines = expressGetAttr(self, "AddressLines", INDETERMINATE);
	const postalBox = expressGetAttr(self, "PostalBox", INDETERMINATE);
	const town = expressGetAttr(self, "Town", INDETERMINATE);
	const region = expressGetAttr(self, "Region", INDETERMINATE);
	const postalCode = expressGetAttr(self, "PostalCode", INDETERMINATE);
	const country = expressGetAttr(self, "Country", INDETERMINATE);
	assertWhereRule(
		exists(internalLocation) ||
			exists(addressLines) ||
			exists(postalBox) ||
			exists(postalCode) ||
			exists(town) ||
			exists(region) ||
			exists(country),
		"IfcPostalAddress: at least one address-detail attribute must be given.",
	);
});

// `IfcPresentationLayerAssignment_ApplicableItems` (line 8471): every `AssignedItems` member
// must be exactly one of IfcShapeRepresentation/IfcGeometricRepresentationItem/IfcMappedItem.
const IfcPresentationLayerAssignment_ApplicableItems = entityRule(
	"IfcPresentationLayerAssignment",
	"ApplicableItems",
	(self) => {
		const items = asList<EntityInstance>(expressGetAttr(self, "AssignedItems", INDETERMINATE));
		const matching = items.filter(
			(temp) =>
				typeOfAttr(temp).multiply([
					"ifc4.ifcshaperepresentation",
					"ifc4.ifcgeometricrepresentationitem",
					"ifc4.ifcmappeditem",
				]).size === 1,
		).length;
		assertWhereRule(
			matching === items.length,
			"IfcPresentationLayerAssignment: every AssignedItems member must be exactly one of IfcShapeRepresentation/IfcGeometricRepresentationItem/IfcMappedItem.",
		);
	},
);

// `IfcPresentationLayerWithStyle_ApplicableOnlyToItems` (line 8481): same shape as
// `IfcPresentationLayerAssignment_ApplicableItems` above, but only 2 applicable kinds
// (no `IfcShapeRepresentation`).
const IfcPresentationLayerWithStyle_ApplicableOnlyToItems = entityRule(
	"IfcPresentationLayerWithStyle",
	"ApplicableOnlyToItems",
	(self) => {
		const items = asList<EntityInstance>(expressGetAttr(self, "AssignedItems", INDETERMINATE));
		const matching = items.filter(
			(temp) => typeOfAttr(temp).multiply(["ifc4.ifcgeometricrepresentationitem", "ifc4.ifcmappeditem"]).size === 1,
		).length;
		assertWhereRule(
			matching === items.length,
			"IfcPresentationLayerWithStyle: every AssignedItems member must be exactly one of IfcGeometricRepresentationItem/IfcMappedItem.",
		);
	},
);

// `IfcProcedure_HasName` (line 8491): `exists(Name)`.
const IfcProcedure_HasName = entityRule("IfcProcedure", "HasName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcProcedure.Name must be given.");
});

// `IfcProcedure_CorrectPredefinedType` (line 8500).
const IfcProcedure_CorrectPredefinedType = entityRule("IfcProcedure", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcProcedure: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcProcedureType_CorrectPredefinedType` (line 8510): escape attribute is `ProcessType`,
// the same 4th value chunk 3 first confirmed (`IfcLaborResourceType`).
const IfcProcedureType_CorrectPredefinedType = entityRule("IfcProcedureType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ProcessType", false),
		"IfcProcedureType: if PredefinedType is USERDEFINED, ProcessType must be given.",
	);
});

// `IfcProduct_PlacementForShapeRepresentation` (line 8520): `(exists(Representation) and
// exists(ObjectPlacement)) or (exists(Representation) and sizeof([temp for temp in
// Representation.Representations if IfcShapeRepresentation in typeof(temp)]) == 0) or (not
// exists(Representation))`.
const IfcProduct_PlacementForShapeRepresentation = entityRule(
	"IfcProduct",
	"PlacementForShapeRepresentation",
	(self) => {
		const objectPlacement = expressGetAttr(self, "ObjectPlacement", INDETERMINATE);
		const representation = expressGetAttr(self, "Representation", INDETERMINATE);
		const hasRepresentation = exists(representation);
		let noShapeReps = false;
		if (hasRepresentation) {
			const items = asList<EntityInstance>(expressGetAttr(representation, "Representations", INDETERMINATE));
			noShapeReps = items.filter((temp) => typeOfAttr(temp).has("ifc4.ifcshaperepresentation")).length === 0;
		}
		assertWhereRule(
			(hasRepresentation && exists(objectPlacement)) || (hasRepresentation && noShapeReps) || !hasRepresentation,
			"IfcProduct: if Representation is given and has an IfcShapeRepresentation, ObjectPlacement must also be given.",
		);
	},
);

// `IfcProductDefinitionShape_OnlyShapeModel` (line 8531): `sizeof([temp for temp in
// Representations if not IfcShapeModel in typeof(temp)]) == 0`.
const IfcProductDefinitionShape_OnlyShapeModel = entityRule("IfcProductDefinitionShape", "OnlyShapeModel", (self) => {
	const items = asList<EntityInstance>(expressGetAttr(self, "Representations", INDETERMINATE));
	const violating = items.filter((temp) => !typeOfAttr(temp).has("ifc4.ifcshapemodel")).length;
	assertWhereRule(violating === 0, "IfcProductDefinitionShape: every Representations member must be an IfcShapeModel.");
});

// `IfcProject_HasName` (line 8541): `exists(Name)`.
const IfcProject_HasName = entityRule("IfcProject", "HasName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcProject.Name must be given.");
});

// `IfcProject_CorrectContext` (line 8550): `not exists(RepresentationContexts) or
// sizeof([temp for temp in RepresentationContexts if IfcGeometricRepresentationSubContext in
// typeof(temp)]) == 0`.
const IfcProject_CorrectContext = entityRule("IfcProject", "CorrectContext", (self) => {
	const contexts = expressGetAttr(self, "RepresentationContexts", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(contexts), () => {
			const items = asList<EntityInstance>(contexts);
			return items.filter((temp) => typeOfAttr(temp).has("ifc4.ifcgeometricrepresentationsubcontext")).length === 0;
		}),
		"IfcProject: RepresentationContexts must not contain an IfcGeometricRepresentationSubContext.",
	);
});

// `IfcProject_NoDecomposition` (line 8559): `sizeof(Decomposes) == 0`.
const IfcProject_NoDecomposition = entityRule("IfcProject", "NoDecomposition", (self) => {
	assertWhereRule(attrSizeIsZero(self, "Decomposes"), "IfcProject: Decomposes must be empty.");
});

// `IfcProjectedCRS_IsLengthUnit` (line 8568): `not exists(MapUnit) or MapUnit.UnitType == LENGTHUNIT`.
const IfcProjectedCRS_IsLengthUnit = entityRule("IfcProjectedCRS", "IsLengthUnit", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "MapUnit", "LENGTHUNIT"),
		"IfcProjectedCRS: if MapUnit is given, its UnitType must be LENGTHUNIT.",
	);
});

// `IfcPropertyBoundedValue_SameUnitUpperLower` (line 8578).
const IfcPropertyBoundedValue_SameUnitUpperLower = entityRule(
	"IfcPropertyBoundedValue",
	"SameUnitUpperLower",
	(self) => {
		assertWhereRule(
			optionalSameUnit(self, "UpperBoundValue", "LowerBoundValue"),
			"IfcPropertyBoundedValue: if UpperBoundValue and LowerBoundValue are both given, they must share the same type.",
		);
	},
);

// `IfcPropertyBoundedValue_SameUnitUpperSet` (line 8589).
const IfcPropertyBoundedValue_SameUnitUpperSet = entityRule("IfcPropertyBoundedValue", "SameUnitUpperSet", (self) => {
	assertWhereRule(
		optionalSameUnit(self, "UpperBoundValue", "SetPointValue"),
		"IfcPropertyBoundedValue: if UpperBoundValue and SetPointValue are both given, they must share the same type.",
	);
});

// `IfcPropertyBoundedValue_SameUnitLowerSet` (line 8600).
const IfcPropertyBoundedValue_SameUnitLowerSet = entityRule("IfcPropertyBoundedValue", "SameUnitLowerSet", (self) => {
	assertWhereRule(
		optionalSameUnit(self, "LowerBoundValue", "SetPointValue"),
		"IfcPropertyBoundedValue: if LowerBoundValue and SetPointValue are both given, they must share the same type.",
	);
});

// `IfcPropertyDependencyRelationship_NoSelfReference` (line 8611): `DependingProperty !=
// DependantProperty`.
const IfcPropertyDependencyRelationship_NoSelfReference = entityRule(
	"IfcPropertyDependencyRelationship",
	"NoSelfReference",
	(self) => {
		assertWhereRule(
			triNe(
				expressGetAttr(self, "DependingProperty", INDETERMINATE),
				expressGetAttr(self, "DependantProperty", INDETERMINATE),
			),
			"IfcPropertyDependencyRelationship: DependingProperty must not equal DependantProperty.",
		);
	},
);

// `IfcPropertyEnumeratedValue_WR21` (line 8622): `not exists(EnumerationReference) or not
// exists(EnumerationValues) or sizeof([temp for temp in EnumerationValues if temp in
// EnumerationReference.EnumerationValues]) == sizeof(EnumerationValues)`. **Genuine schema
// evolution vs. IFC2X3's own `IfcPropertyEnumeratedValue_WR1`** (already ported in
// `whereRules/ifc2x3.ts`): IFC4 adds an extra `not exists(EnumerationValues) or` disjunct
// (EnumerationValues became optional). Same disclosed `triEq`-based value-equality
// leniency as `whereRules/ifc2x3.ts`'s own header comment already discloses in full for
// its own byte-identical membership idiom (not re-disclosed here).
const IfcPropertyEnumeratedValue_WR21 = entityRule("IfcPropertyEnumeratedValue", "WR21", (self) => {
	const enumerationValues = expressGetAttr(self, "EnumerationValues", INDETERMINATE);
	const enumerationReference = expressGetAttr(self, "EnumerationReference", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(enumerationReference), () =>
			pyOr(!exists(enumerationValues), () => {
				const values = asList<unknown>(enumerationValues);
				const referenceValues = asList<unknown>(
					expressGetAttr(enumerationReference, "EnumerationValues", INDETERMINATE),
				);
				const matching = values.filter((temp) => referenceValues.some((ref) => triEq(temp, ref) === true)).length;
				return triEq(matching, values.length);
			}),
		),
		"IfcPropertyEnumeratedValue: if EnumerationReference and EnumerationValues are both given, every EnumerationValues member must be one of EnumerationReference's own EnumerationValues.",
	);
});

// `IfcPropertyEnumeration_WR01` (line 8633): every `EnumerationValues` member shares the
// first member's own `typeof(...)`.
const IfcPropertyEnumeration_WR01 = entityRule("IfcPropertyEnumeration", "WR01", (self) => {
	assertWhereRule(
		allShareFirstTypeOf(self, "EnumerationValues"),
		"IfcPropertyEnumeration: every EnumerationValues member must share the first member's own type.",
	);
});

// `IfcPropertyListValue_WR31` (line 8642): every `ListValues` member shares the first
// member's own `typeof(...)`.
const IfcPropertyListValue_WR31 = entityRule("IfcPropertyListValue", "WR31", (self) => {
	assertWhereRule(
		allShareFirstTypeOf(self, "ListValues"),
		"IfcPropertyListValue: every ListValues member must share the first member's own type.",
	);
});

// `IfcPropertySet_ExistsName` (line 8651): `exists(Name)`.
const IfcPropertySet_ExistsName = entityRule("IfcPropertySet", "ExistsName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcPropertySet.Name must be given.");
});

// `IfcPropertySet_UniquePropertyNames` (line 8660): `IfcUniquePropertyName(HasProperties)`.
const IfcPropertySet_UniquePropertyNames = entityRule("IfcPropertySet", "UniquePropertyNames", (self) => {
	assertWhereRule(
		ifcUniquePropertyName(expressGetAttr(self, "HasProperties", INDETERMINATE)),
		"IfcPropertySet: every HasProperties member must have a unique Name.",
	);
});

// `IfcPropertySetTemplate_ExistsName` (line 8808): `exists(Name)`.
const IfcPropertySetTemplate_ExistsName = entityRule("IfcPropertySetTemplate", "ExistsName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcPropertySetTemplate.Name must be given.");
});

// `IfcPropertySetTemplate_UniquePropertyNames` (line 8817):
// `IfcUniquePropertyTemplateNames(HasPropertyTemplates)`.
const IfcPropertySetTemplate_UniquePropertyNames = entityRule(
	"IfcPropertySetTemplate",
	"UniquePropertyNames",
	(self) => {
		assertWhereRule(
			ifcUniquePropertyTemplateNames(expressGetAttr(self, "HasPropertyTemplates", INDETERMINATE)),
			"IfcPropertySetTemplate: every HasPropertyTemplates member must have a unique Name.",
		);
	},
);

// `IfcPropertyTableValue_WR21` (line 8827): `(not exists(DefiningValues) and not
// exists(DefinedValues)) or sizeof(DefiningValues) == sizeof(DefinedValues)`.
const IfcPropertyTableValue_WR21 = entityRule("IfcPropertyTableValue", "WR21", (self) => {
	const definingValues = expressGetAttr(self, "DefiningValues", INDETERMINATE);
	const definedValues = expressGetAttr(self, "DefinedValues", INDETERMINATE);
	assertWhereRule(
		(!exists(definingValues) && !exists(definedValues)) ||
			triEq(sizeof(definingValues), sizeof(definedValues)) === true,
		"IfcPropertyTableValue: DefiningValues and DefinedValues must both be absent, or both present with equal size.",
	);
});

// `IfcPropertyTableValue_WR22` (line 8838): `not exists(DefiningValues) or` every
// `DefiningValues` member shares the first member's own `typeof(...)`.
const IfcPropertyTableValue_WR22 = entityRule("IfcPropertyTableValue", "WR22", (self) => {
	const definingValues = expressGetAttr(self, "DefiningValues", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(definingValues), () => allShareFirstTypeOf(self, "DefiningValues")),
		"IfcPropertyTableValue: if given, every DefiningValues member must share the first member's own type.",
	);
});

// `IfcPropertyTableValue_WR23` (line 8848): same shape as WR22, for `DefinedValues`.
const IfcPropertyTableValue_WR23 = entityRule("IfcPropertyTableValue", "WR23", (self) => {
	const definedValues = expressGetAttr(self, "DefinedValues", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(definedValues), () => allShareFirstTypeOf(self, "DefinedValues")),
		"IfcPropertyTableValue: if given, every DefinedValues member must share the first member's own type.",
	);
});

// `IfcProtectiveDevice_CorrectPredefinedType` (line 8858).
const IfcProtectiveDevice_CorrectPredefinedType = entityRule("IfcProtectiveDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcProtectiveDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcProtectiveDevice_CorrectTypeAssigned` (line 8868).
const IfcProtectiveDevice_CorrectTypeAssigned = entityRule("IfcProtectiveDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcProtectiveDeviceType"),
		"IfcProtectiveDevice: if IsTypedBy is given, its RelatingType must be an IfcProtectiveDeviceType.",
	);
});

// `IfcProtectiveDeviceTrippingUnit_CorrectPredefinedType` (line 8878).
const IfcProtectiveDeviceTrippingUnit_CorrectPredefinedType = entityRule(
	"IfcProtectiveDeviceTrippingUnit",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcProtectiveDeviceTrippingUnit: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcProtectiveDeviceTrippingUnit_CorrectTypeAssigned` (line 8888).
const IfcProtectiveDeviceTrippingUnit_CorrectTypeAssigned = entityRule(
	"IfcProtectiveDeviceTrippingUnit",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcProtectiveDeviceTrippingUnitType"),
			"IfcProtectiveDeviceTrippingUnit: if IsTypedBy is given, its RelatingType must be an IfcProtectiveDeviceTrippingUnitType.",
		);
	},
);

// `IfcProtectiveDeviceTrippingUnitType_CorrectPredefinedType` (line 8898).
const IfcProtectiveDeviceTrippingUnitType_CorrectPredefinedType = entityRule(
	"IfcProtectiveDeviceTrippingUnitType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcProtectiveDeviceTrippingUnitType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcProtectiveDeviceType_CorrectPredefinedType` (line 8908).
const IfcProtectiveDeviceType_CorrectPredefinedType = entityRule(
	"IfcProtectiveDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcProtectiveDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcProxy_WR1` (line 8918): `exists(Name)`.
const IfcProxy_WR1 = entityRule("IfcProxy", "WR1", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcProxy.Name must be given.");
});

// `IfcPump_CorrectPredefinedType` (line 8927).
const IfcPump_CorrectPredefinedType = entityRule("IfcPump", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPump: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPump_CorrectTypeAssigned` (line 8937).
const IfcPump_CorrectTypeAssigned = entityRule("IfcPump", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPumpType"),
		"IfcPump: if IsTypedBy is given, its RelatingType must be an IfcPumpType.",
	);
});

// `IfcPumpType_CorrectPredefinedType` (line 8947).
const IfcPumpType_CorrectPredefinedType = entityRule("IfcPumpType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPumpType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcQuantityArea_WR21` (line 8957): `not exists(Unit) or Unit.UnitType == AREAUNIT`.
const IfcQuantityArea_WR21 = entityRule("IfcQuantityArea", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "AREAUNIT"),
		"IfcQuantityArea: if Unit is given, its UnitType must be AREAUNIT.",
	);
});

// `IfcQuantityArea_WR22` (line 8966): `AreaValue >= 0.0`.
const IfcQuantityArea_WR22 = entityRule("IfcQuantityArea", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "AreaValue"), "IfcQuantityArea.AreaValue must be >= 0.");
});

// `IfcQuantityCount_WR21` (line 8976): `CountValue >= 0.0`.
const IfcQuantityCount_WR21 = entityRule("IfcQuantityCount", "WR21", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "CountValue"), "IfcQuantityCount.CountValue must be >= 0.");
});

// `IfcQuantityLength_WR21` (line 8986): `not exists(Unit) or Unit.UnitType == LENGTHUNIT`.
const IfcQuantityLength_WR21 = entityRule("IfcQuantityLength", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "LENGTHUNIT"),
		"IfcQuantityLength: if Unit is given, its UnitType must be LENGTHUNIT.",
	);
});

// `IfcQuantityLength_WR22` (line 8995): `LengthValue >= 0.0`.
const IfcQuantityLength_WR22 = entityRule("IfcQuantityLength", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "LengthValue"), "IfcQuantityLength.LengthValue must be >= 0.");
});

// `IfcQuantityTime_WR21` (line 9005): `not exists(Unit) or Unit.UnitType == TIMEUNIT`.
const IfcQuantityTime_WR21 = entityRule("IfcQuantityTime", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "TIMEUNIT"),
		"IfcQuantityTime: if Unit is given, its UnitType must be TIMEUNIT.",
	);
});

// `IfcQuantityTime_WR22` (line 9014): `TimeValue >= 0.0`.
const IfcQuantityTime_WR22 = entityRule("IfcQuantityTime", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "TimeValue"), "IfcQuantityTime.TimeValue must be >= 0.");
});

// `IfcQuantityVolume_WR21` (line 9024): `not exists(Unit) or Unit.UnitType == VOLUMEUNIT`.
const IfcQuantityVolume_WR21 = entityRule("IfcQuantityVolume", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "VOLUMEUNIT"),
		"IfcQuantityVolume: if Unit is given, its UnitType must be VOLUMEUNIT.",
	);
});

// `IfcQuantityVolume_WR22` (line 9033): `VolumeValue >= 0.0`.
const IfcQuantityVolume_WR22 = entityRule("IfcQuantityVolume", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "VolumeValue"), "IfcQuantityVolume.VolumeValue must be >= 0.");
});

// `IfcQuantityWeight_WR21` (line 9043): `not exists(Unit) or Unit.UnitType == MASSUNIT`.
const IfcQuantityWeight_WR21 = entityRule("IfcQuantityWeight", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "MASSUNIT"),
		"IfcQuantityWeight: if Unit is given, its UnitType must be MASSUNIT.",
	);
});

// `IfcQuantityWeight_WR22` (line 9052): `WeightValue >= 0.0`.
const IfcQuantityWeight_WR22 = entityRule("IfcQuantityWeight", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "WeightValue"), "IfcQuantityWeight.WeightValue must be >= 0.");
});

// `IfcRailing_CorrectPredefinedType` (line 9062).
const IfcRailing_CorrectPredefinedType = entityRule("IfcRailing", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRailing: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRailing_CorrectTypeAssigned` (line 9072).
const IfcRailing_CorrectTypeAssigned = entityRule("IfcRailing", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRailingType"),
		"IfcRailing: if IsTypedBy is given, its RelatingType must be an IfcRailingType.",
	);
});

// `IfcRailingType_CorrectPredefinedType` (line 9082).
const IfcRailingType_CorrectPredefinedType = entityRule("IfcRailingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRailingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRamp_CorrectPredefinedType` (line 9092).
const IfcRamp_CorrectPredefinedType = entityRule("IfcRamp", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRamp: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRamp_CorrectTypeAssigned` (line 9102).
const IfcRamp_CorrectTypeAssigned = entityRule("IfcRamp", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRampType"),
		"IfcRamp: if IsTypedBy is given, its RelatingType must be an IfcRampType.",
	);
});

// `IfcRampFlight_CorrectPredefinedType` (line 9112).
const IfcRampFlight_CorrectPredefinedType = entityRule("IfcRampFlight", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRampFlight: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRampFlight_CorrectTypeAssigned` (line 9122).
const IfcRampFlight_CorrectTypeAssigned = entityRule("IfcRampFlight", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRampFlightType"),
		"IfcRampFlight: if IsTypedBy is given, its RelatingType must be an IfcRampFlightType.",
	);
});

// `IfcRampFlightType_CorrectPredefinedType` (line 9132).
const IfcRampFlightType_CorrectPredefinedType = entityRule("IfcRampFlightType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRampFlightType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRampType_CorrectPredefinedType` (line 9142).
const IfcRampType_CorrectPredefinedType = entityRule("IfcRampType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRampType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRationalBSplineCurveWithKnots_SameNumOfWeightsAndPoints` (line 9152):
// `sizeof(WeightsData) == sizeof(ControlPointsList)`.
const IfcRationalBSplineCurveWithKnots_SameNumOfWeightsAndPoints = entityRule(
	"IfcRationalBSplineCurveWithKnots",
	"SameNumOfWeightsAndPoints",
	(self) => {
		assertWhereRule(
			triEq(
				sizeof(expressGetAttr(self, "WeightsData", INDETERMINATE)),
				sizeof(expressGetAttr(self, "ControlPointsList", INDETERMINATE)),
			),
			"IfcRationalBSplineCurveWithKnots: WeightsData and ControlPointsList must have equal size.",
		);
	},
);

// `IfcRationalBSplineCurveWithKnots_WeightsGreaterZero` (line 9162): `IfcCurveWeightsPositive(self)`.
const IfcRationalBSplineCurveWithKnots_WeightsGreaterZero = entityRule(
	"IfcRationalBSplineCurveWithKnots",
	"WeightsGreaterZero",
	(self) => {
		assertWhereRule(
			ifcCurveWeightsPositive(self),
			"IfcRationalBSplineCurveWithKnots: every Weights value must be greater than 0.",
		);
	},
);

// `IfcRationalBSplineSurfaceWithKnots_CorrespondingWeightsDataLists` (line 9175):
// `sizeof(WeightsData) == sizeof(ControlPointsList) and sizeof(WeightsData[0]) ==
// sizeof(ControlPointsList[0])`.
const IfcRationalBSplineSurfaceWithKnots_CorrespondingWeightsDataLists = entityRule(
	"IfcRationalBSplineSurfaceWithKnots",
	"CorrespondingWeightsDataLists",
	(self) => {
		const weightsData = expressGetAttr(self, "WeightsData", INDETERMINATE);
		const controlPointsList = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
		assertWhereRule(
			pyAnd(triEq(sizeof(weightsData), sizeof(controlPointsList)), () =>
				triEq(
					sizeof(expressGetItem(weightsData, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE)),
					sizeof(expressGetItem(controlPointsList, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE)),
				),
			),
			"IfcRationalBSplineSurfaceWithKnots: WeightsData and ControlPointsList must have equal size, and their first rows must too.",
		);
	},
);

// `IfcRationalBSplineSurfaceWithKnots_WeightValuesGreaterZero` (line 9185):
// `IfcSurfaceWeightsPositive(self)`. **Not a new bug, but a real, disclosed cascading
// consequence of one**: `self.Weights` is itself a DERIVE attribute
// (`calc_IfcRationalBSplineSurfaceWithKnots_Weights` -> `IfcMakeArrayOfArray`, Phase
// EX-2) whose own real formula unconditionally raises `TypeError` once `WeightsData`/
// `ControlPointsList` are consistently shaped (`rules/ifc4.ts`'s own already-disclosed
// bug, not re-disclosed here) -- meaning this rule can never successfully evaluate for
// any real input, exactly mirroring `calc_IfcRationalBSplineSurfaceWithKnots_Weights`'s
// own already-disclosed "can never succeed in real Python either" finding one level up.
const IfcRationalBSplineSurfaceWithKnots_WeightValuesGreaterZero = entityRule(
	"IfcRationalBSplineSurfaceWithKnots",
	"WeightValuesGreaterZero",
	(self) => {
		assertWhereRule(
			ifcSurfaceWeightsPositive(self),
			"IfcRationalBSplineSurfaceWithKnots: every Weights value must be greater than 0.",
		);
	},
);

// `IfcRectangleHollowProfileDef_ValidWallThickness` (line 9200): `WallThickness < XDim / 2.0
// and WallThickness < YDim / 2.0`.
const IfcRectangleHollowProfileDef_ValidWallThickness = entityRule(
	"IfcRectangleHollowProfileDef",
	"ValidWallThickness",
	(self) => {
		const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE);
		const xDim = expressGetAttr(self, "XDim", INDETERMINATE) as number;
		const yDim = expressGetAttr(self, "YDim", INDETERMINATE) as number;
		assertWhereRule(
			pyAnd(triLt(wallThickness, xDim / 2.0), () => triLt(wallThickness, yDim / 2.0)),
			"IfcRectangleHollowProfileDef.WallThickness must be less than half of both XDim and YDim.",
		);
	},
);

// `IfcRectangleHollowProfileDef_ValidInnerRadius` (line 9210): `not exists(InnerFilletRadius)
// or (InnerFilletRadius <= XDim / 2.0 - WallThickness and InnerFilletRadius <= YDim / 2.0 -
// WallThickness)`.
const IfcRectangleHollowProfileDef_ValidInnerRadius = entityRule(
	"IfcRectangleHollowProfileDef",
	"ValidInnerRadius",
	(self) => {
		const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE) as number;
		const innerFilletRadius = expressGetAttr(self, "InnerFilletRadius", INDETERMINATE);
		const xDim = expressGetAttr(self, "XDim", INDETERMINATE) as number;
		const yDim = expressGetAttr(self, "YDim", INDETERMINATE) as number;
		assertWhereRule(
			pyOr(!exists(innerFilletRadius), () =>
				pyAnd(triLe(innerFilletRadius, xDim / 2.0 - wallThickness), () =>
					triLe(innerFilletRadius, yDim / 2.0 - wallThickness),
				),
			),
			"IfcRectangleHollowProfileDef: if InnerFilletRadius is given, it must fit within both XDim and YDim minus WallThickness.",
		);
	},
);

// `IfcRectangleHollowProfileDef_ValidOuterRadius` (line 9221): `not exists(OuterFilletRadius)
// or (OuterFilletRadius <= XDim / 2.0 and OuterFilletRadius <= YDim / 2.0)`.
const IfcRectangleHollowProfileDef_ValidOuterRadius = entityRule(
	"IfcRectangleHollowProfileDef",
	"ValidOuterRadius",
	(self) => {
		const outerFilletRadius = expressGetAttr(self, "OuterFilletRadius", INDETERMINATE);
		const xDim = expressGetAttr(self, "XDim", INDETERMINATE) as number;
		const yDim = expressGetAttr(self, "YDim", INDETERMINATE) as number;
		assertWhereRule(
			pyOr(!exists(outerFilletRadius), () =>
				pyAnd(triLe(outerFilletRadius, xDim / 2.0), () => triLe(outerFilletRadius, yDim / 2.0)),
			),
			"IfcRectangleHollowProfileDef: if OuterFilletRadius is given, it must fit within both XDim and YDim.",
		);
	},
);

// `IfcRectangularTrimmedSurface_U1AndU2Different` (line 9231): `U1 != U2`.
const IfcRectangularTrimmedSurface_U1AndU2Different = entityRule(
	"IfcRectangularTrimmedSurface",
	"U1AndU2Different",
	(self) => {
		assertWhereRule(
			triNe(expressGetAttr(self, "U1", INDETERMINATE), expressGetAttr(self, "U2", INDETERMINATE)),
			"IfcRectangularTrimmedSurface: U1 must not equal U2.",
		);
	},
);

registerSchemaRules("IFC4", [
	IfcLocalPlacement_WR21,
	IfcMaterialDefinitionRepresentation_OnlyStyledRepresentations,
	IfcMaterialLayer_NormalizedPriority,
	IfcMaterialProfile_NormalizedPriority,
	IfcMechanicalFastener_CorrectPredefinedType,
	IfcMechanicalFastener_CorrectTypeAssigned,
	IfcMechanicalFastenerType_CorrectPredefinedType,
	IfcMedicalDevice_CorrectPredefinedType,
	IfcMedicalDevice_CorrectTypeAssigned,
	IfcMedicalDeviceType_CorrectPredefinedType,
	IfcMember_CorrectPredefinedType,
	IfcMember_CorrectTypeAssigned,
	IfcMemberStandardCase_HasMaterialProfileSetUsage,
	IfcMemberType_CorrectPredefinedType,
	IfcMotorConnection_CorrectPredefinedType,
	IfcMotorConnection_CorrectTypeAssigned,
	IfcMotorConnectionType_CorrectPredefinedType,
	IfcNamedUnit_WR1,
	IfcObject_UniquePropertySetNames,
	IfcObjective_WR21,
	IfcOccupant_WR31,
	IfcOffsetCurve2D_DimIs2D,
	IfcOffsetCurve3D_DimIs2D,
	IfcOrientedEdge_EdgeElementNotOriented,
	IfcOutlet_CorrectPredefinedType,
	IfcOutlet_CorrectTypeAssigned,
	IfcOutletType_CorrectPredefinedType,
	IfcOwnerHistory_CorrectChangeAction,
	IfcPath_IsContinuous,
	IfcPcurve_DimIs2D,
	IfcPerson_IdentifiablePerson,
	IfcPerson_ValidSetOfNames,
	IfcPhysicalComplexQuantity_NoSelfReference,
	IfcPhysicalComplexQuantity_UniqueQuantityNames,
	IfcPile_CorrectPredefinedType,
	IfcPile_CorrectTypeAssigned,
	IfcPileType_CorrectPredefinedType,
	IfcPipeFitting_CorrectPredefinedType,
	IfcPipeFitting_CorrectTypeAssigned,
	IfcPipeFittingType_CorrectPredefinedType,
	IfcPipeSegment_CorrectPredefinedType,
	IfcPipeSegment_CorrectTypeAssigned,
	IfcPipeSegmentType_CorrectPredefinedType,
	IfcPixelTexture_MinPixelInS,
	IfcPixelTexture_MinPixelInT,
	IfcPixelTexture_NumberOfColours,
	IfcPixelTexture_SizeOfPixelList,
	IfcPixelTexture_PixelAsByteAndSameLength,
	IfcPlate_CorrectPredefinedType,
	IfcPlate_CorrectTypeAssigned,
	IfcPlateStandardCase_HasMaterialLayerSetUsage,
	IfcPlateType_CorrectPredefinedType,
	IfcPolyLoop_AllPointsSameDim,
	IfcPolygonalBoundedHalfSpace_BoundaryDim,
	IfcPolygonalBoundedHalfSpace_BoundaryType,
	IfcPolyline_SameDim,
	IfcPostalAddress_WR1,
	IfcPresentationLayerAssignment_ApplicableItems,
	IfcPresentationLayerWithStyle_ApplicableOnlyToItems,
	IfcProcedure_HasName,
	IfcProcedure_CorrectPredefinedType,
	IfcProcedureType_CorrectPredefinedType,
	IfcProduct_PlacementForShapeRepresentation,
	IfcProductDefinitionShape_OnlyShapeModel,
	IfcProject_HasName,
	IfcProject_CorrectContext,
	IfcProject_NoDecomposition,
	IfcProjectedCRS_IsLengthUnit,
	IfcPropertyBoundedValue_SameUnitUpperLower,
	IfcPropertyBoundedValue_SameUnitUpperSet,
	IfcPropertyBoundedValue_SameUnitLowerSet,
	IfcPropertyDependencyRelationship_NoSelfReference,
	IfcPropertyEnumeratedValue_WR21,
	IfcPropertyEnumeration_WR01,
	IfcPropertyListValue_WR31,
	IfcPropertySet_ExistsName,
	IfcPropertySet_UniquePropertyNames,
	IfcPropertySetTemplate_ExistsName,
	IfcPropertySetTemplate_UniquePropertyNames,
	IfcPropertyTableValue_WR21,
	IfcPropertyTableValue_WR22,
	IfcPropertyTableValue_WR23,
	IfcProtectiveDevice_CorrectPredefinedType,
	IfcProtectiveDevice_CorrectTypeAssigned,
	IfcProtectiveDeviceTrippingUnit_CorrectPredefinedType,
	IfcProtectiveDeviceTrippingUnit_CorrectTypeAssigned,
	IfcProtectiveDeviceTrippingUnitType_CorrectPredefinedType,
	IfcProtectiveDeviceType_CorrectPredefinedType,
	IfcProxy_WR1,
	IfcPump_CorrectPredefinedType,
	IfcPump_CorrectTypeAssigned,
	IfcPumpType_CorrectPredefinedType,
	IfcQuantityArea_WR21,
	IfcQuantityArea_WR22,
	IfcQuantityCount_WR21,
	IfcQuantityLength_WR21,
	IfcQuantityLength_WR22,
	IfcQuantityTime_WR21,
	IfcQuantityTime_WR22,
	IfcQuantityVolume_WR21,
	IfcQuantityVolume_WR22,
	IfcQuantityWeight_WR21,
	IfcQuantityWeight_WR22,
	IfcRailing_CorrectPredefinedType,
	IfcRailing_CorrectTypeAssigned,
	IfcRailingType_CorrectPredefinedType,
	IfcRamp_CorrectPredefinedType,
	IfcRamp_CorrectTypeAssigned,
	IfcRampFlight_CorrectPredefinedType,
	IfcRampFlight_CorrectTypeAssigned,
	IfcRampFlightType_CorrectPredefinedType,
	IfcRampType_CorrectPredefinedType,
	IfcRationalBSplineCurveWithKnots_SameNumOfWeightsAndPoints,
	IfcRationalBSplineCurveWithKnots_WeightsGreaterZero,
	IfcRationalBSplineSurfaceWithKnots_CorrespondingWeightsDataLists,
	IfcRationalBSplineSurfaceWithKnots_WeightValuesGreaterZero,
	IfcRectangleHollowProfileDef_ValidWallThickness,
	IfcRectangleHollowProfileDef_ValidInnerRadius,
	IfcRectangleHollowProfileDef_ValidOuterRadius,
	IfcRectangularTrimmedSurface_U1AndU2Different,
]);
