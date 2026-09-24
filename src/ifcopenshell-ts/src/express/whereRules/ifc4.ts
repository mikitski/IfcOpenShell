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
import { ifcCrossProduct } from "../rules/ifc4";
import {
	EXPRESS_ONE_BASED_INDEXING,
	ExpressSet,
	INDETERMINATE,
	type Tri,
	assertWhereRule,
	exists,
	expressGetAttr,
	expressGetItem,
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
// typeof(temp.RelatingMaterial)]) == 1`.
const IfcBeamStandardCase_HasMaterialProfileSetUsage = entityRule(
	"IfcBeamStandardCase",
	"HasMaterialProfileSetUsage",
	(self) => {
		const refs = usedIn(self, "ifc4.ifcrelassociates.relatedobjects");
		const count = refs.filter(
			(temp) =>
				typeOfAttr(temp).has("ifc4.ifcrelassociatesmaterial") &&
				typeOfAttr(expressGetAttr(temp, "RelatingMaterial", INDETERMINATE)).has("ifc4.ifcmaterialprofilesetusage"),
		).length;
		assertWhereRule(
			count === 1,
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

// `IfcBuildingElementProxy_HasObjectName` (line 5361): `exists(Name)`.
const IfcBuildingElementProxy_HasObjectName = entityRule("IfcBuildingElementProxy", "HasObjectName", (self) => {
	assertWhereRule(exists(expressGetAttr(self, "Name", INDETERMINATE)), "IfcBuildingElementProxy.Name must be given.");
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
// chunk 1's own `IfcBeamStandardCase_HasMaterialProfileSetUsage` (not retrofitted into a
// shared helper there or here -- a 2nd, disclosed occurrence, not yet a 3rd).
const IfcColumnStandardCase_HasMaterialProfileSetUsage = entityRule(
	"IfcColumnStandardCase",
	"HasMaterialProfileSetUsage",
	(self) => {
		const refs = usedIn(self, "ifc4.ifcrelassociates.relatedobjects");
		const count = refs.filter(
			(temp) =>
				typeOfAttr(temp).has("ifc4.ifcrelassociatesmaterial") &&
				typeOfAttr(expressGetAttr(temp, "RelatingMaterial", INDETERMINATE)).has("ifc4.ifcmaterialprofilesetusage"),
		).length;
		assertWhereRule(
			count === 1,
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
