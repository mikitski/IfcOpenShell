// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4, IFC4X3_ADD2 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md,
// "the large chunk" -- WHERE-rule classes + `rule_executor.py`): the START of
// IFC4X3_ADD2, the THIRD and FINAL schema, and the largest -- ALL 25 `SCOPE = 'type'`
// rules (real source lines 5143-5359, `IfcBoxAlignment_WR1` through
// `IfcTextTransformation_WR1`) PLUS the FIRST 75 `SCOPE = 'entity'` rules (real source
// lines 5368-6165, `IfcActorRole_WR1` through `IfcBooleanResult_SameDim`) in
// `src/ifcopenshell-python/ifcopenshell/express/rules/IFC4X3_ADD2.py` -- 100 rules
// total, real ADD2 file order (NOT copied from IFC4's own order -- see "real file order
// has shifted" below), both boundaries independently re-verified against real source
// with the same small Python script this project's prior chunks used, matching
// `^class (\w+)` followed by its own `SCOPE = '(\w+)'` line. Registered under
// `"IFC4X3_ADD2"`, this port's own confirmed-correct schema identifier for this schema
// (`test/bootstrap.ts`'s `SCHEMA_IDENTIFIERS.IFC4X3 === "IFC4X3_ADD2"`, confirmed
// directly, matching the same wrinkle already disclosed for Phase EX-2's own
// `rules/ifc4x3.ts`).
//
// **Independently re-verified totals** (re-derived directly, not trusted from the
// dispatching task brief alone): `IFC4X3_ADD2.py` has exactly 779 classes carrying
// their own `SCOPE = '...'` class attribute (782 total top-level classes minus the 3
// non-rule boilerplate ones -- `express_set`/`indeterminate_type`/`enum_namespace`,
// already ported in Phase EX-1) -- **752 `SCOPE = 'entity'`, 25 `SCOPE = 'type'`, 2
// `SCOPE = 'file'`** -- matching `PROGRESS.md`'s own already-corrected Phase EX-4
// IFC4X3_ADD2 figures exactly.
//
// **Deliberately EXCLUDES the 2 `SCOPE = 'file'` rules** for IFC4X3_ADD2 (expected to be
// `IfcRepresentationContextSameWCS`/`IfcSingleProjectInstance`, matching both IFC2X3's
// and IFC4's own already-ported file-scope rules by name -- not yet read directly, far
// later in the file) -- matches IFC2X3's and IFC4's own chunk 1 precedent of not going
// out of file-order sequence to grab them early; a later chunk handles all 6 file-scope
// rules (2 per schema) together, exactly as already done for IFC2X3/IFC4.
//
// =============================================================================
// This chunk's own central finding: IFC4X3_ADD2 really is a superset-like evolution of
// IFC4's own schema, confirmed by direct, exhaustive diffing (not sampling) of all 100
// rules in this chunk's own range against IFC4's real source
// =============================================================================
//
// Every one of this chunk's 100 target rule NAMES was cross-checked against
// `IFC4.py`'s own real source directly (not assumed from name overlap):
//
// - **92 of the 100 rules exist in `IFC4.py` under the exact same class name, and their
//   real compiled bodies are BYTE-IDENTICAL once the schema-namespace string embedded in
//   every `typeof(...)` membership check is normalized (`'ifc4.ifcxxx'` ->
//   `'ifc4x3_add2.ifcxxx'`)** -- confirmed by a dedicated diff script comparing every one
//   of the 92 real class bodies character-for-character after that one substitution,
//   zero remaining differences found. This includes `correctTypeAssigned`'s 9 real call
//   sites, `correctPredefinedType`'s 18, and `IfcAdvancedBrepWithVoids_
//   VoidsHaveAdvancedFaces`'s own already-disclosed-in-IFC4-chunk-1 inverted-logic bug
//   (see "verbatim-preserved upstream bug" below) -- all reused/re-ported as fresh local
//   copies below (never imported cross-schema, matching this file family's own
//   established "no cross-schema-file dependency" precedent).
// - **8 of the 100 rules are genuinely NEW, with no `IFC4.py` counterpart at all**:
//   `IfcAxis1Placement_LocationIsCP`, `IfcAxis2Placement2D_LocationIsCP`,
//   `IfcAxis2Placement3D_LocationIsCP` (3 new WHERE-rules on 3 pre-existing IFC4
//   entities -- ADD2 widened each entity's own `Location` attribute type to a broader
//   SELECT that now also admits `IfcPointByDistanceExpression`, consistent with
//   `PROGRESS.md`'s own already-recorded Phase EX-2 correction note describing ADD2's
//   `IfcPoint`/`IfcSegment` DERIVE-formula consolidation across several point/segment
//   entities -- these 3 new rules claw the constraint back down to "must literally be an
//   `IfcCartesianPoint`" for these 3 "plain" placement entities), `IfcAxis2PlacementLinear`
//   (a wholly new ADD2 entity -- an alignment-linear-referencing placement -- 2 rules,
//   `WR1`/`WR2`), and `IfcBearing`/`IfcBearingType` (a wholly new ADD2 entity --
//   structural bearing -- 3 rules, the ordinary `_CorrectPredefinedType`/
//   `_CorrectTypeAssigned` shapes this chunk's own helpers already cover).
// - **Zero rules found with a genuine subtle divergence beyond the schema-prefix
//   rename** -- every rule that exists under the same name in both schemas is
//   byte-identical modulo that one substitution. This chunk's own task brief flagged
//   that "some WILL differ" as a real possibility to check for, not assume away -- this
//   chunk's own 100-rule range happens to have none, which is itself a real, checked
//   finding (not merely an absence of investigation), consistent with this file's own
//   "central finding" above. Future IFC4X3_ADD2 chunks are NOT assumed to share this
//   property -- each rule is still checked individually, per this project's own
//   established methodology.
// - **One IFC4 chunk-1 rule (`IfcBeamStandardCase_HasMaterialProfileSetUsage`, real
//   IFC4.py line 5168) has NO counterpart anywhere in `IFC4X3_ADD2.py` at all** --
//   confirmed via `grep -n "class IfcBeamStandardCase"` against both real files (found
//   in `IFC4.py`, zero matches in `IFC4X3_ADD2.py`). Not a boundary-exclusion artifact:
//   this rule simply does not exist in ADD2's own real source, so it is neither ported
//   here nor deferred to a later IFC4X3_ADD2 chunk -- disclosed for completeness, not a
//   gap in this port.
//
// **Real file order has shifted relative to IFC4's own**, even among the 92
// byte-identical rules -- confirmed directly (not assumed), and preserved AS ADD2's OWN
// real order below, NOT copied from `whereRules/ifc4.ts`'s own IFC4 chunk 1 ordering.
// Concrete examples, each independently re-verified against real `IFC4X3_ADD2.py` line
// numbers: `IfcAsymmetricIShapeProfileDef`'s 4 rules reorder from IFC4's own
// Flange/Web/Bottom/Top to ADD2's alphabetical-looking Bottom/Flange/Top/Web;
// `IfcAxis2Placement2D`'s `RefDirIs2D`/`LocationIs2D` pair swaps to `LocationIs2D`/
// `RefDirIs2D`; `IfcBSplineSurfaceWithKnots`'s `UDirectionConstraints`/
// `VDirectionConstraints` pair moves BEFORE `CorrespondingULists`/`CorrespondingVLists`
// (IFC4 has the Corresponding* pair first); `IfcBooleanClippingResult`'s 3 rules reorder
// from FirstOperandType/SecondOperandType/OperatorType to
// FirstOperandType/OperatorType/SecondOperandType; `IfcBooleanResult`'s reorders from
// SameDim/FirstOperandClosed/SecondOperandClosed to
// FirstOperandClosed/SameDim/(SecondOperandClosed, excluded from this chunk). Most
// plausibly explained by ADD2's own EXPRESS-schema regeneration re-sorting declarations
// after inserting new entities/attributes elsewhere in the schema, though the exact
// cause was not investigated further (out of scope -- the ordering itself is faithfully
// preserved either way, which is what matters for a byte-for-byte-behavior port).
//
// =============================================================================
// A real, verbatim-preserved upstream Python bug in this chunk (re-confirmed, not new)
// =============================================================================
//
// **`IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces` (real source line 5427) has the
// exact same inverted pass/fail logic `whereRules/ifc4.ts`'s own IFC4 chunk 1 already
// found and disclosed for this identical rule name -- independently re-confirmed to be
// genuinely present in `IFC4X3_ADD2.py`'s own real source too** (read directly at its
// own line 5427, not assumed from the name match -- and independently re-confirmed
// byte-identical to `IFC4.py`'s own version modulo only the schema-prefix string, per
// this chunk's own "central finding" above). See `whereRules/ifc4.ts`'s own header
// comment for the full from-first-principles derivation (inner comprehension collects
// each void's own COMPLIANT status via a double negative, outer `sizeof(...) == 0`
// then asserts the count of COMPLIANT voids is zero -- backwards from the rule's own
// evident "voids have advanced faces" intent). Ported verbatim below, bug included, NOT
// "fixed" -- per this project's established verbatim-translation mandate, citing the
// IFC4 chunk 1 precedent directly rather than re-deriving it from scratch (mirrors IFC4
// chunk 6's own precedent of citing IFC2X3 chunk 5 for the unrelated
// `IfcSameAxis2Placement` bug rather than re-deriving that one either).
//
// =============================================================================
// Shared helpers established/reused in this chunk
// =============================================================================
//
// `correctTypeAssigned`/`correctPredefinedType`/`userDefinedOrHasAttribute`/
// `optionalUserDefinedOrHasAttribute`/`optionalAttrDimEquals`/`attrDimEquals`/
// `ifcEdgeLoopBounds`/`ifcConstraintsParamBSpline`: fresh local copies of
// `whereRules/ifc4.ts`'s own already-established helpers of the exact same shapes (only
// `correctTypeAssigned`'s embedded schema-prefix string differs -- `ifc4x3_add2.`, not
// `ifc4.`) -- same disclosed, deliberate small duplication IFC4's own chunk 1 already
// made relative to IFC2X3's unexported equivalents, now this file family's THIRD
// schema-local copy. Occurrence counts in THIS chunk's own 100 rules: `correctTypeAssigned`
// 9x, `correctPredefinedType` 18x (12 "occurrence"-shape + 6 "*Type"-shape, escape
// attribute `ObjectType`/`ElementType` respectively, matching IFC4 chunk 1's own exact
// counts, coincidentally -- a different entity set, `IfcBearing`/`IfcBearingType`
// replacing IFC4 chunk 1's own `IfcBuildingElementPart`/`IfcBuildingElementPartType`,
// which fall just past this chunk's own ADD2 boundary), `optionalAttrDimEquals` 4x,
// `attrDimEquals` 3x, `ifcEdgeLoopBounds` 2x, `ifcConstraintsParamBSpline` 3x
// (`IfcBSplineCurveWithKnots_ConsistentBSpline` plus `IfcBSplineSurfaceWithKnots_
// UDirectionConstraints`/`VDirectionConstraints`) -- `ifcConstraintsParamBSpline` itself
// independently re-confirmed BYTE-IDENTICAL between `IFC4.py` (line 11404) and
// `IFC4X3_ADD2.py` (line 13221) via direct `diff`, so it is safe to port as a plain
// fresh copy with zero logic changes.
//
// **One new shared helper established this chunk**: `locationIsCartesianPoint` (3
// occurrences: the 3 genuinely-new `_LocationIsCP` rules) -- see that function's own doc
// comment, above the type-scope rules below, for the full writeup of why ADD2 needs it.
//
// **`ifcCrossProduct` reused from `rules/ifc4x3.ts`** (that file's own already-ported,
// already-tested, byte-identical-to-IFC4 helper -- now `export`ed there, exactly
// mirroring `whereRules/ifc4.ts`'s own identical precedent for `rules/ifc4.ts`'s
// `ifcCrossProduct`) -- 2 call sites in this chunk (`IfcAxis2Placement3D_
// AxisToRefDirPosition`, and the new `IfcAxis2PlacementLinear_WR2`).
//
// **`ruleExecutor.ts`/`ruleDispatch.ts` needed zero changes** -- confirmed empirically
// (`git diff` against both files is empty for this PR): the engine's existing
// type/entity-scope dispatch already works correctly for a third schema with no
// modification, exactly as already confirmed true when IFC4 started.
//
// =============================================================================
// Registration-helper duplication (same disclosure IFC2X3's and IFC4's own chunk 1s
// already made)
// =============================================================================
//
// `entityRule`/`typeRule` below are unexported local functions in both `whereRules/
// ifc2x3.ts` and `whereRules/ifc4.ts` (checked directly) -- this file needs its own
// copies for the same reason `userDefinedOrHasAttribute` and friends do (no existing
// shared, schema-agnostic home for this file family's own small registration
// wrappers). Same disclosed, small duplication; same "reasonable future factoring
// target, not this chunk's job" call.
//
// **How to read a rule below**: identical strategy to `whereRules/ifc2x3.ts`'s and
// `whereRules/ifc4.ts`'s own header comments (`Tri`, `pyAnd`/`pyOr`/`pyNot`,
// `triEq`/`triNe`/`triLt`/etc., `assertWhereRule`) -- not re-explained here. A MANDATORY
// attribute is read via `expressGetAttr` and used directly, while an OPTIONAL one is
// always guarded by `exists(...)`/`pyOr(!exists(...), ...)` before use, matching both
// prior schemas' own established convention exactly.

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type RuleDefinition, registerSchemaRules } from "../ruleDispatch";
import { ifcCrossProduct, ifcDimensionalExponents, ifcDirection, ifcDotProduct } from "../rules/ifc4x3";
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
	isEntity,
	isIndeterminate,
	nvl,
	pyAnd,
	pyNot,
	pyOr,
	sizeof,
	triDiv,
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
 * `entityRule`/`typeRule` above -- now this file family's THIRD schema-local copy,
 * after IFC2X3 and IFC4).
 */
function typeOfAttr(value: unknown) {
	return isIndeterminate(value) ? typeOf(null) : typeOf(value as EntityInstance);
}

/**
 * Shared shape across `IfcActorRole_WR1` and the `_CorrectPredefinedType` "occurrence"
 * sub-shape (via `correctPredefinedType` below) -- Python: `X != USERDEFINED or (X ==
 * USERDEFINED and exists(Y))`. See this file's own header comment ("Registration-helper
 * duplication") for why this is a fresh local copy, not an import of IFC2X3's/IFC4's own
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
 * MANDATORY, e.g. `IfcActuatorType`). Byte-identical shape to `whereRules/ifc4.ts`'s own
 * (only the schema-prefix string embedded in `correctTypeAssigned` below differs).
 */
function correctPredefinedType(self: EntityInstance, escapeAttrName: string, predefinedTypeOptional: boolean): Tri {
	return predefinedTypeOptional
		? optionalUserDefinedOrHasAttribute(self, "PredefinedType", escapeAttrName)
		: userDefinedOrHasAttribute(self, "PredefinedType", escapeAttrName);
}

/**
 * The `_CorrectTypeAssigned` shared shape -- see this file's own header comment for
 * the cardinality verification (`IsTypedBy` is a genuine `SET [0:1]`, never unpacked
 * by `settings.unpackNonAggregateInverses`, re-confirmed for IFC4X3_ADD2 directly, same
 * as IFC4). `expectedTypeName` is the bare `Ifc*Type` class name (e.g.
 * `"IfcActuatorType"`) -- this function lowercases and prefixes it with THIS schema's
 * own real registered identifier, `ifc4x3_add2.` (confirmed against real
 * `IFC4X3_ADD2.py`'s own `typeof(...)` membership checks -- e.g.
 * `'ifc4x3_add2.ifcactuatortype'`, NOT `'ifc4.ifcactuatortype'` -- this is the ONLY
 * textual difference from `whereRules/ifc4.ts`'s own byte-identical function).
 */
function correctTypeAssigned(self: EntityInstance, expectedTypeName: string): Tri {
	const isTypedBy = expressGetAttr(self, "IsTypedBy", INDETERMINATE);
	return pyOr(triEq(sizeof(isTypedBy), 0), () => {
		const relDefinesByType = expressGetItem(isTypedBy, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const relatingType = expressGetAttr(relDefinesByType, "RelatingType", INDETERMINATE);
		return typeOfAttr(relatingType).has(`ifc4x3_add2.${expectedTypeName.toLowerCase()}`);
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
 * open with -- `[bnds for bnds in Bounds if 'ifc4x3_add2.ifcedgeloop' in
 * typeof(bnds.Bound)]`. See this file's own header comment.
 */
function ifcEdgeLoopBounds(self: EntityInstance): EntityInstance[] {
	const bounds = expressGetAttr(self, "Bounds", INDETERMINATE);
	const boundItems = isIndeterminate(bounds) ? [] : (bounds as EntityInstance[]);
	return boundItems.filter((bnds) =>
		typeOfAttr(expressGetAttr(bnds, "Bound", INDETERMINATE)).has("ifc4x3_add2.ifcedgeloop"),
	);
}

/**
 * Python: `IfcConstraintsParamBSpline(degree, upknots, upcp, knotmult, knots)`
 * (`IFC4X3_ADD2.py` line 13221) -- a rule-file-local EXPRESS-library helper, confirmed
 * BYTE-IDENTICAL to `IFC4.py`'s own version (line 11404, direct `diff`) -- see this
 * file's own header comment for why it's ported fresh here rather than imported from
 * `whereRules/ifc4.ts`. All 5 parameters are mandatory, always-defined
 * numeric/aggregate attributes on every real call site in this chunk -- ported with
 * plain JS arithmetic/loops, no `Tri`/indeterminacy handling needed.
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

/**
 * Shared shape (3 occurrences: `IfcAxis1Placement_LocationIsCP`,
 * `IfcAxis2Placement2D_LocationIsCP`, `IfcAxis2Placement3D_LocationIsCP`) -- Python:
 * `'ifc4x3_add2.ifccartesianpoint' in typeof(Location)`. **Genuinely NEW in
 * IFC4X3_ADD2, not present in IFC4 at all** -- see this file's own header comment
 * ("8 genuinely new rules") for the full writeup: ADD2 widened these 3 entities' own
 * `Location` attribute type to a broader SELECT that now also admits
 * `IfcPointByDistanceExpression` (consistent with `PROGRESS.md`'s own already-recorded
 * Phase EX-2 correction note describing ADD2's `IfcPoint`/`IfcSegment` DERIVE-formula
 * consolidation across several point/segment entities), so these 3 new WHERE-rules
 * claw the constraint back down to "must literally be an `IfcCartesianPoint`" for the
 * 3 "plain" placement entities. `IfcAxis2PlacementLinear` (also new in ADD2, below) is
 * the one placement entity instead constrained to `IfcPointByDistanceExpression`
 * specifically (its own `WR1`), not this shape.
 */
function locationIsCartesianPoint(self: EntityInstance): Tri {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	return typeOfAttr(location).has("ifc4x3_add2.ifccartesianpoint");
}

// =============================================================================
// SCOPE = 'type' rules (real source lines 5143-5359, all 25 in this schema).
// =============================================================================

// `IfcBoxAlignment_WR1` (line 5143).
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

// `IfcCardinalPointReference_GreaterThanZero` (line 5152).
const IfcCardinalPointReference_GreaterThanZero = typeRule(
	"IfcCardinalPointReference",
	"GreaterThanZero",
	(self: number) => {
		assertWhereRule(self > 0, "IfcCardinalPointReference must be greater than 0.");
	},
);

// `IfcCompoundPlaneAngleMeasure_MinutesInRange` (line 5161): `self` is the raw `LIST
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

// `IfcCompoundPlaneAngleMeasure_SecondsInRange` (line 5170).
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

// `IfcCompoundPlaneAngleMeasure_MicrosecondsInRange` (line 5179): `sizeof(self) == 3 or
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

// `IfcCompoundPlaneAngleMeasure_ConsistentSign` (line 5188): all present components
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

// `IfcDayInMonthNumber_ValidRange` (line 5197).
const IfcDayInMonthNumber_ValidRange = typeRule("IfcDayInMonthNumber", "ValidRange", (self: number) => {
	assertWhereRule(1 <= self && self <= 31, "IfcDayInMonthNumber must be in [1, 31].");
});

// `IfcDayInWeekNumber_ValidRange` (line 5206).
const IfcDayInWeekNumber_ValidRange = typeRule("IfcDayInWeekNumber", "ValidRange", (self: number) => {
	assertWhereRule(1 <= self && self <= 7, "IfcDayInWeekNumber must be in [1, 7].");
});

// `IfcDimensionCount_WR1` (line 5215).
const IfcDimensionCount_WR1 = typeRule("IfcDimensionCount", "WR1", (self: number) => {
	assertWhereRule(0 < self && self <= 3, "IfcDimensionCount must be in (0, 3].");
});

// `IfcFontStyle_WR1` (line 5224).
const IfcFontStyle_WR1 = typeRule("IfcFontStyle", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "italic", "oblique"].includes(self.toLowerCase()),
		"IfcFontStyle must be one of 'normal', 'italic', 'oblique' (case-insensitive).",
	);
});

// `IfcFontVariant_WR1` (line 5233).
const IfcFontVariant_WR1 = typeRule("IfcFontVariant", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "small-caps"].includes(self.toLowerCase()),
		"IfcFontVariant must be one of 'normal', 'small-caps' (case-insensitive).",
	);
});

// `IfcFontWeight_WR1` (line 5242).
const IfcFontWeight_WR1 = typeRule("IfcFontWeight", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "small-caps", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(
			self.toLowerCase(),
		),
		"IfcFontWeight must be one of the documented keyword/numeric-weight values (case-insensitive).",
	);
});

// `IfcHeatingValueMeasure_WR1` (line 5251).
const IfcHeatingValueMeasure_WR1 = typeRule("IfcHeatingValueMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcHeatingValueMeasure must be greater than 0.");
});

// `IfcMonthInYearNumber_ValidRange` (line 5260).
const IfcMonthInYearNumber_ValidRange = typeRule("IfcMonthInYearNumber", "ValidRange", (self: number) => {
	assertWhereRule(1 <= self && self <= 12, "IfcMonthInYearNumber must be in [1, 12].");
});

// `IfcNonNegativeLengthMeasure_NotNegative` (line 5269).
const IfcNonNegativeLengthMeasure_NotNegative = typeRule(
	"IfcNonNegativeLengthMeasure",
	"NotNegative",
	(self: number) => {
		assertWhereRule(self >= 0.0, "IfcNonNegativeLengthMeasure must be greater than or equal to 0.");
	},
);

// `IfcNormalisedRatioMeasure_WR1` (line 5278).
const IfcNormalisedRatioMeasure_WR1 = typeRule("IfcNormalisedRatioMeasure", "WR1", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 1.0, "IfcNormalisedRatioMeasure must be in [0, 1].");
});

// `IfcPHMeasure_WR21` (line 5287).
const IfcPHMeasure_WR21 = typeRule("IfcPHMeasure", "WR21", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 14.0, "IfcPHMeasure must be in [0, 14].");
});

// `IfcPositiveInteger_WR1` (line 5296).
const IfcPositiveInteger_WR1 = typeRule("IfcPositiveInteger", "WR1", (self: number) => {
	assertWhereRule(self > 0, "IfcPositiveInteger must be greater than 0.");
});

// `IfcPositiveLengthMeasure_WR1` (line 5305).
const IfcPositiveLengthMeasure_WR1 = typeRule("IfcPositiveLengthMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositiveLengthMeasure must be greater than 0.");
});

// `IfcPositivePlaneAngleMeasure_WR1` (line 5314).
const IfcPositivePlaneAngleMeasure_WR1 = typeRule("IfcPositivePlaneAngleMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositivePlaneAngleMeasure must be greater than 0.");
});

// `IfcPositiveRatioMeasure_WR1` (line 5323).
const IfcPositiveRatioMeasure_WR1 = typeRule("IfcPositiveRatioMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositiveRatioMeasure must be greater than 0.");
});

// `IfcSpecularRoughness_WR1` (line 5332).
const IfcSpecularRoughness_WR1 = typeRule("IfcSpecularRoughness", "WR1", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 1.0, "IfcSpecularRoughness must be in [0, 1].");
});

// `IfcTextAlignment_WR1` (line 5341).
const IfcTextAlignment_WR1 = typeRule("IfcTextAlignment", "WR1", (self: string) => {
	assertWhereRule(
		["left", "right", "center", "justify"].includes(self.toLowerCase()),
		"IfcTextAlignment must be one of 'left', 'right', 'center', 'justify' (case-insensitive).",
	);
});

// `IfcTextDecoration_WR1` (line 5350).
const IfcTextDecoration_WR1 = typeRule("IfcTextDecoration", "WR1", (self: string) => {
	assertWhereRule(
		["none", "underline", "overline", "line-through", "blink"].includes(self.toLowerCase()),
		"IfcTextDecoration must be one of the 5 documented decoration keywords (case-insensitive).",
	);
});

// `IfcTextTransformation_WR1` (line 5359).
const IfcTextTransformation_WR1 = typeRule("IfcTextTransformation", "WR1", (self: string) => {
	assertWhereRule(
		["capitalize", "uppercase", "lowercase", "none"].includes(self.toLowerCase()),
		"IfcTextTransformation must be one of 'capitalize', 'uppercase', 'lowercase', 'none' (case-insensitive).",
	);
});

// =============================================================================
// SCOPE = 'entity' rules (real source lines 5368-6165, the first 75 in this schema).
// =============================================================================

// `IfcActorRole_WR1` (line 5368): `Role != USERDEFINED or (Role == USERDEFINED and
// exists(UserDefinedRole))`.
const IfcActorRole_WR1 = entityRule("IfcActorRole", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "Role", "UserDefinedRole"),
		"IfcActorRole: if Role is USERDEFINED, UserDefinedRole must be given.",
	);
});

// `IfcActuator_CorrectPredefinedType` (line 5378).
const IfcActuator_CorrectPredefinedType = entityRule("IfcActuator", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcActuator: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcActuator_CorrectTypeAssigned` (line 5388).
const IfcActuator_CorrectTypeAssigned = entityRule("IfcActuator", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcActuatorType"),
		"IfcActuator: if IsTypedBy is given, its RelatingType must be an IfcActuatorType.",
	);
});

// `IfcActuatorType_CorrectPredefinedType` (line 5398).
const IfcActuatorType_CorrectPredefinedType = entityRule("IfcActuatorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcActuatorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcAddress_WR1` (line 5408): `not exists(Purpose) or (Purpose != USERDEFINED or
// (Purpose == USERDEFINED and exists(UserDefinedPurpose)))`.
const IfcAddress_WR1 = entityRule("IfcAddress", "WR1", (self) => {
	assertWhereRule(
		optionalUserDefinedOrHasAttribute(self, "Purpose", "UserDefinedPurpose"),
		"IfcAddress: if Purpose is given and USERDEFINED, UserDefinedPurpose must be given.",
	);
});

// `IfcAdvancedBrep_HasAdvancedFaces` (line 5418): `sizeof([afs for afs in
// Outer.CfsFaces if not IfcAdvancedFace in typeof(afs)]) == 0`.
const IfcAdvancedBrep_HasAdvancedFaces = entityRule("IfcAdvancedBrep", "HasAdvancedFaces", (self) => {
	const outer = expressGetAttr(self, "Outer", INDETERMINATE);
	const cfsFaces = expressGetAttr(outer, "CfsFaces", INDETERMINATE);
	const items = isIndeterminate(cfsFaces) ? [] : (cfsFaces as EntityInstance[]);
	const violating = items.filter((afs) => !typeOfAttr(afs).has("ifc4x3_add2.ifcadvancedface")).length;
	assertWhereRule(violating === 0, "IfcAdvancedBrep: every Outer.CfsFaces member must be an IfcAdvancedFace.");
});

// `IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces` (line 5427): **the same real,
// verbatim-preserved upstream Python bug `whereRules/ifc4.ts`'s own IFC4 chunk 1
// already found and disclosed for this exact rule name, independently re-confirmed
// to be genuinely present in IFC4X3_ADD2.py's own real source too (line 5427, read
// directly, not assumed from the name match) -- see this file's own header comment
// for the full derivation.** The real, checked-in body literally requires the COUNT
// OF FULLY-COMPLIANT VOIDS (every `CfsFaces` member an `IfcAdvancedFace`) to be ZERO
// -- inverted from the rule's own evident intent.
const IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces = entityRule(
	"IfcAdvancedBrepWithVoids",
	"VoidsHaveAdvancedFaces",
	(self) => {
		const voids = expressGetAttr(self, "Voids", INDETERMINATE);
		const voidItems = isIndeterminate(voids) ? [] : (voids as EntityInstance[]);
		const compliantVoidCount = voidItems.filter((vsh) => {
			const cfsFaces = expressGetAttr(vsh, "CfsFaces", INDETERMINATE);
			const faceItems = isIndeterminate(cfsFaces) ? [] : (cfsFaces as EntityInstance[]);
			const nonAdvancedCount = faceItems.filter((afs) => !typeOfAttr(afs).has("ifc4x3_add2.ifcadvancedface")).length;
			return nonAdvancedCount === 0;
		}).length;
		assertWhereRule(
			compliantVoidCount === 0,
			"IfcAdvancedBrepWithVoids: [verbatim upstream bug, preserved -- see this file's header comment] real IFC4X3_ADD2.py literally requires that NO void have all-IfcAdvancedFace CfsFaces.",
		);
	},
);

// `IfcAdvancedFace_ApplicableEdgeCurves` (line 5437): for every `Bounds` member whose
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
				typeOfAttr(edgeGeometry).multiply([
					"ifc4x3_add2.ifcline",
					"ifc4x3_add2.ifcconic",
					"ifc4x3_add2.ifcpolyline",
					"ifc4x3_add2.ifcbsplinecurve",
				]).size !== 1
			);
		}).length;
		return badEdgeCount !== 0;
	}).length;
	assertWhereRule(
		violating === 0,
		"IfcAdvancedFace: every IfcEdgeLoop bound's every oriented edge's EdgeGeometry must be exactly one of IfcLine/IfcConic/IfcPolyline/IfcBSplineCurve.",
	);
});

// `IfcAdvancedFace_ApplicableSurface` (line 5446): `sizeof(['ifc4x3_add2.ifcelementarysurface',
// 'ifc4x3_add2.ifcsweptsurface', 'ifc4x3_add2.ifcbsplinesurface'] * typeof(FaceSurface)) == 1`.
const IfcAdvancedFace_ApplicableSurface = entityRule("IfcAdvancedFace", "ApplicableSurface", (self) => {
	const faceSurface = expressGetAttr(self, "FaceSurface", INDETERMINATE);
	const count = typeOfAttr(faceSurface).multiply([
		"ifc4x3_add2.ifcelementarysurface",
		"ifc4x3_add2.ifcsweptsurface",
		"ifc4x3_add2.ifcbsplinesurface",
	]).size;
	assertWhereRule(
		count === 1,
		"IfcAdvancedFace.FaceSurface must be exactly one of IfcElementarySurface/IfcSweptSurface/IfcBSplineSurface.",
	);
});

// `IfcAdvancedFace_RequiresEdgeCurve` (line 5455): for every `Bounds` member whose
// `Bound` is an `IfcEdgeLoop`, every oriented edge in that loop's `EdgeList` must have
// an `EdgeElement` that is an `IfcEdgeCurve`.
const IfcAdvancedFace_RequiresEdgeCurve = entityRule("IfcAdvancedFace", "RequiresEdgeCurve", (self) => {
	const violating = ifcEdgeLoopBounds(self).filter((elpfbnds) => {
		const loop = expressGetAttr(elpfbnds, "Bound", INDETERMINATE);
		const edgeList = expressGetAttr(loop, "EdgeList", INDETERMINATE);
		const edgeListItems = isIndeterminate(edgeList) ? [] : (edgeList as EntityInstance[]);
		const badEdgeCount = edgeListItems.filter(
			(oe) => !typeOfAttr(expressGetAttr(oe, "EdgeElement", INDETERMINATE)).has("ifc4x3_add2.ifcedgecurve"),
		).length;
		return badEdgeCount !== 0;
	}).length;
	assertWhereRule(
		violating === 0,
		"IfcAdvancedFace: every IfcEdgeLoop bound's every oriented edge must reference an IfcEdgeCurve.",
	);
});

// `IfcAirTerminal_CorrectPredefinedType` (line 5464).
const IfcAirTerminal_CorrectPredefinedType = entityRule("IfcAirTerminal", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcAirTerminal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcAirTerminal_CorrectTypeAssigned` (line 5474).
const IfcAirTerminal_CorrectTypeAssigned = entityRule("IfcAirTerminal", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcAirTerminalType"),
		"IfcAirTerminal: if IsTypedBy is given, its RelatingType must be an IfcAirTerminalType.",
	);
});

// `IfcAirTerminalBox_CorrectPredefinedType` (line 5484).
const IfcAirTerminalBox_CorrectPredefinedType = entityRule("IfcAirTerminalBox", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcAirTerminalBox: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcAirTerminalBox_CorrectTypeAssigned` (line 5494).
const IfcAirTerminalBox_CorrectTypeAssigned = entityRule("IfcAirTerminalBox", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcAirTerminalBoxType"),
		"IfcAirTerminalBox: if IsTypedBy is given, its RelatingType must be an IfcAirTerminalBoxType.",
	);
});

// `IfcAirTerminalBoxType_CorrectPredefinedType` (line 5504).
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

// `IfcAirTerminalType_CorrectPredefinedType` (line 5514).
const IfcAirTerminalType_CorrectPredefinedType = entityRule("IfcAirTerminalType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcAirTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcAirToAirHeatRecovery_CorrectPredefinedType` (line 5524).
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

// `IfcAirToAirHeatRecovery_CorrectTypeAssigned` (line 5534).
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

// `IfcAirToAirHeatRecoveryType_CorrectPredefinedType` (line 5544).
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

// `IfcAlarm_CorrectPredefinedType` (line 5554).
const IfcAlarm_CorrectPredefinedType = entityRule("IfcAlarm", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcAlarm: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcAlarm_CorrectTypeAssigned` (line 5564).
const IfcAlarm_CorrectTypeAssigned = entityRule("IfcAlarm", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcAlarmType"),
		"IfcAlarm: if IsTypedBy is given, its RelatingType must be an IfcAlarmType.",
	);
});

// `IfcAlarmType_CorrectPredefinedType` (line 5574).
const IfcAlarmType_CorrectPredefinedType = entityRule("IfcAlarmType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcAlarmType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcApproval_HasIdentifierOrName` (line 5584): `exists(Identifier) or exists(Name)`.
const IfcApproval_HasIdentifierOrName = entityRule("IfcApproval", "HasIdentifierOrName", (self) => {
	const identifier = expressGetAttr(self, "Identifier", INDETERMINATE);
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	assertWhereRule(exists(identifier) || exists(name), "IfcApproval: at least one of Identifier or Name must be given.");
});

// `IfcArbitraryClosedProfileDef_WR1` (line 5595): `OuterCurve.Dim == 2`.
const IfcArbitraryClosedProfileDef_WR1 = entityRule("IfcArbitraryClosedProfileDef", "WR1", (self) => {
	assertWhereRule(attrDimEquals(self, "OuterCurve", 2), "IfcArbitraryClosedProfileDef.OuterCurve.Dim must equal 2.");
});

// `IfcArbitraryClosedProfileDef_WR2` (line 5605): `not IfcLine in typeof(OuterCurve)`.
const IfcArbitraryClosedProfileDef_WR2 = entityRule("IfcArbitraryClosedProfileDef", "WR2", (self) => {
	const outerCurve = expressGetAttr(self, "OuterCurve", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(outerCurve).has("ifc4x3_add2.ifcline"),
		"IfcArbitraryClosedProfileDef.OuterCurve must not be an IfcLine.",
	);
});

// `IfcArbitraryClosedProfileDef_WR3` (line 5615): `not IfcOffsetCurve2D in typeof(OuterCurve)`.
const IfcArbitraryClosedProfileDef_WR3 = entityRule("IfcArbitraryClosedProfileDef", "WR3", (self) => {
	const outerCurve = expressGetAttr(self, "OuterCurve", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(outerCurve).has("ifc4x3_add2.ifcoffsetcurve2d"),
		"IfcArbitraryClosedProfileDef.OuterCurve must not be an IfcOffsetCurve2D.",
	);
});

// `IfcArbitraryOpenProfileDef_WR11` (line 5625): `IfcCenterLineProfileDef in typeof(self)
// or ProfileType == CURVE`.
const IfcArbitraryOpenProfileDef_WR11 = entityRule("IfcArbitraryOpenProfileDef", "WR11", (self) => {
	const profileType = expressGetAttr(self, "ProfileType", INDETERMINATE);
	assertWhereRule(
		pyOr(typeOfAttr(self).has("ifc4x3_add2.ifccenterlineprofiledef"), () => triEq(profileType, "CURVE")),
		"IfcArbitraryOpenProfileDef: must be an IfcCenterLineProfileDef, or ProfileType must be CURVE.",
	);
});

// `IfcArbitraryOpenProfileDef_WR12` (line 5634): `Curve.Dim == 2`.
const IfcArbitraryOpenProfileDef_WR12 = entityRule("IfcArbitraryOpenProfileDef", "WR12", (self) => {
	assertWhereRule(attrDimEquals(self, "Curve", 2), "IfcArbitraryOpenProfileDef.Curve.Dim must equal 2.");
});

// `IfcArbitraryProfileDefWithVoids_WR1` (line 5644): `ProfileType == AREA`.
const IfcArbitraryProfileDefWithVoids_WR1 = entityRule("IfcArbitraryProfileDefWithVoids", "WR1", (self) => {
	const profileType = expressGetAttr(self, "ProfileType", INDETERMINATE);
	assertWhereRule(triEq(profileType, "AREA"), "IfcArbitraryProfileDefWithVoids.ProfileType must be AREA.");
});

// `IfcArbitraryProfileDefWithVoids_WR2` (line 5653): `sizeof([temp for temp in
// InnerCurves if temp.Dim != 2]) == 0`.
const IfcArbitraryProfileDefWithVoids_WR2 = entityRule("IfcArbitraryProfileDefWithVoids", "WR2", (self) => {
	const innerCurves = expressGetAttr(self, "InnerCurves", INDETERMINATE);
	const items = isIndeterminate(innerCurves) ? [] : (innerCurves as EntityInstance[]);
	const violating = items.filter((temp) => triNe(expressGetAttr(temp, "Dim", INDETERMINATE), 2) === true).length;
	assertWhereRule(violating === 0, "IfcArbitraryProfileDefWithVoids: every InnerCurves member must have Dim == 2.");
});

// `IfcArbitraryProfileDefWithVoids_WR3` (line 5663): `sizeof([temp for temp in
// InnerCurves if IfcLine in typeof(temp)]) == 0`.
const IfcArbitraryProfileDefWithVoids_WR3 = entityRule("IfcArbitraryProfileDefWithVoids", "WR3", (self) => {
	const innerCurves = expressGetAttr(self, "InnerCurves", INDETERMINATE);
	const items = isIndeterminate(innerCurves) ? [] : (innerCurves as EntityInstance[]);
	const violating = items.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcline")).length;
	assertWhereRule(violating === 0, "IfcArbitraryProfileDefWithVoids: no InnerCurves member may be an IfcLine.");
});

// `IfcAsymmetricIShapeProfileDef_ValidBottomFilletRadius` (line 5673): `not
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

// `IfcAsymmetricIShapeProfileDef_ValidFlangeThickness` (line 5685): `not
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

// `IfcAsymmetricIShapeProfileDef_ValidTopFilletRadius` (line 5697): `not
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

// `IfcAsymmetricIShapeProfileDef_ValidWebThickness` (line 5709): `WebThickness <
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

// `IfcAudioVisualAppliance_CorrectPredefinedType` (line 5721).
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

// `IfcAudioVisualAppliance_CorrectTypeAssigned` (line 5731).
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

// `IfcAudioVisualApplianceType_CorrectPredefinedType` (line 5741).
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

// `IfcAxis1Placement_AxisIs3D` (line 5751): `not exists(Axis) or Axis.Dim == 3`.
const IfcAxis1Placement_AxisIs3D = entityRule("IfcAxis1Placement", "AxisIs3D", (self) => {
	assertWhereRule(optionalAttrDimEquals(self, "Axis", 3), "IfcAxis1Placement: if Axis is given, its Dim must equal 3.");
});

// `IfcAxis1Placement_LocationIs3D` (line 5761): `Location.Dim == 3`.
const IfcAxis1Placement_LocationIs3D = entityRule("IfcAxis1Placement", "LocationIs3D", (self) => {
	assertWhereRule(attrDimEquals(self, "Location", 3), "IfcAxis1Placement.Location.Dim must equal 3.");
});

// `IfcAxis1Placement_LocationIsCP` (line 5770): `'ifc4x3_add2.ifccartesianpoint' in
// typeof(Location)`. **Genuinely new in IFC4X3_ADD2** -- see `locationIsCartesianPoint`'s
// own doc comment above.
const IfcAxis1Placement_LocationIsCP = entityRule("IfcAxis1Placement", "LocationIsCP", (self) => {
	assertWhereRule(locationIsCartesianPoint(self), "IfcAxis1Placement.Location must be an IfcCartesianPoint.");
});

// `IfcAxis2Placement2D_LocationIs2D` (line 5783): `Location.Dim == 2`.
const IfcAxis2Placement2D_LocationIs2D = entityRule("IfcAxis2Placement2D", "LocationIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "Location", 2), "IfcAxis2Placement2D.Location.Dim must equal 2.");
});

// `IfcAxis2Placement2D_LocationIsCP` (line 5792): same shape as
// `IfcAxis1Placement_LocationIsCP` above. **Genuinely new in IFC4X3_ADD2.**
const IfcAxis2Placement2D_LocationIsCP = entityRule("IfcAxis2Placement2D", "LocationIsCP", (self) => {
	assertWhereRule(locationIsCartesianPoint(self), "IfcAxis2Placement2D.Location must be an IfcCartesianPoint.");
});

// `IfcAxis2Placement2D_RefDirIs2D` (line 5801): `not exists(RefDirection) or
// RefDirection.Dim == 2`.
const IfcAxis2Placement2D_RefDirIs2D = entityRule("IfcAxis2Placement2D", "RefDirIs2D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "RefDirection", 2),
		"IfcAxis2Placement2D: if RefDirection is given, its Dim must equal 2.",
	);
});

// `IfcAxis2Placement3D_AxisAndRefDirProvision` (line 5815): `not exists(Axis) ^
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

// `IfcAxis2Placement3D_AxisIs3D` (line 5826): `not exists(Axis) or Axis.Dim == 3`.
const IfcAxis2Placement3D_AxisIs3D = entityRule("IfcAxis2Placement3D", "AxisIs3D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "Axis", 3),
		"IfcAxis2Placement3D: if Axis is given, its Dim must equal 3.",
	);
});

// `IfcAxis2Placement3D_AxisToRefDirPosition` (line 5836): `not exists(Axis) or not
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

// `IfcAxis2Placement3D_LocationIs3D` (line 5847): `Location.Dim == 3`.
const IfcAxis2Placement3D_LocationIs3D = entityRule("IfcAxis2Placement3D", "LocationIs3D", (self) => {
	assertWhereRule(attrDimEquals(self, "Location", 3), "IfcAxis2Placement3D.Location.Dim must equal 3.");
});

// `IfcAxis2Placement3D_LocationIsCP` (line 5856): same shape as
// `IfcAxis1Placement_LocationIsCP` above. **Genuinely new in IFC4X3_ADD2.**
const IfcAxis2Placement3D_LocationIsCP = entityRule("IfcAxis2Placement3D", "LocationIsCP", (self) => {
	assertWhereRule(locationIsCartesianPoint(self), "IfcAxis2Placement3D.Location must be an IfcCartesianPoint.");
});

// `IfcAxis2Placement3D_RefDirIs3D` (line 5865): `not exists(RefDirection) or
// RefDirection.Dim == 3`.
const IfcAxis2Placement3D_RefDirIs3D = entityRule("IfcAxis2Placement3D", "RefDirIs3D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "RefDirection", 3),
		"IfcAxis2Placement3D: if RefDirection is given, its Dim must equal 3.",
	);
});

// `IfcAxis2PlacementLinear_WR1` (line 5880): `'ifc4x3_add2.ifcpointbydistanceexpression'
// in typeof(Location)`. **`IfcAxis2PlacementLinear` is itself wholly new in
// IFC4X3_ADD2** (an alignment-linear-referencing placement entity, real source lines
// 5875-5910ish per `rules/ifc4x3.ts`'s own already-ported `calc_IfcAxis2Placement3D_P`-
// adjacent DERIVE functions) -- unlike the 3 `_LocationIsCP` rules above, its own
// `Location` must be an `IfcPointByDistanceExpression`, not a plain `IfcCartesianPoint`.
const IfcAxis2PlacementLinear_WR1 = entityRule("IfcAxis2PlacementLinear", "WR1", (self) => {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(location).has("ifc4x3_add2.ifcpointbydistanceexpression"),
		"IfcAxis2PlacementLinear.Location must be an IfcPointByDistanceExpression.",
	);
});

// `IfcAxis2PlacementLinear_WR2` (line 5889): `not exists(Axis) or not
// exists(RefDirection) or IfcCrossProduct(Axis, RefDirection).Magnitude > 0.0`. New
// entity, but the exact same shape as `IfcAxis2Placement3D_AxisToRefDirPosition` above
// -- only 2 occurrences in this chunk, below this file family's own established
// 3-occurrence factoring threshold, so left inline (matching that rule's own body)
// rather than sharing a new helper for just 2 call sites.
const IfcAxis2PlacementLinear_WR2 = entityRule("IfcAxis2PlacementLinear", "WR2", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	const refDirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis), () =>
			pyOr(!exists(refDirection), () =>
				triGt(expressGetAttr(ifcCrossProduct(axis, refDirection), "Magnitude", INDETERMINATE), 0.0),
			),
		),
		"IfcAxis2PlacementLinear: if both Axis and RefDirection are given, their cross product's Magnitude must be greater than 0.",
	);
});

// `IfcBSplineCurve_SameDim` (line 5900): `sizeof([temp for temp in ControlPointsList
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

// `IfcBSplineCurveWithKnots_ConsistentBSpline` (line 5919):
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

// `IfcBSplineCurveWithKnots_CorrespondingKnotLists` (line 5933):
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

// `IfcBSplineSurfaceWithKnots_CorrespondingULists` (line 5962):
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

// `IfcBSplineSurfaceWithKnots_CorrespondingVLists` (line 5973):
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

// `IfcBSplineSurfaceWithKnots_UDirectionConstraints` (line 5984):
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

// `IfcBSplineSurfaceWithKnots_VDirectionConstraints` (line 5996):
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

// `IfcBeam_CorrectPredefinedType` (line 6016).
const IfcBeam_CorrectPredefinedType = entityRule("IfcBeam", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBeam: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBeam_CorrectTypeAssigned` (line 6026).
const IfcBeam_CorrectTypeAssigned = entityRule("IfcBeam", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcBeamType"),
		"IfcBeam: if IsTypedBy is given, its RelatingType must be an IfcBeamType.",
	);
});

// `IfcBeamType_CorrectPredefinedType` (line 6036).
const IfcBeamType_CorrectPredefinedType = entityRule("IfcBeamType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcBeamType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcBearing_CorrectPredefinedType` (line 6046). `IfcBearing`/`IfcBearingType` are
// themselves wholly new in IFC4X3_ADD2 (a structural bearing element) -- standard
// "occurrence" `_CorrectPredefinedType` shape, same as every other one in this chunk.
const IfcBearing_CorrectPredefinedType = entityRule("IfcBearing", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBearing: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBearing_CorrectTypeAssigned` (line 6056). New entity, standard
// `_CorrectTypeAssigned` shape.
const IfcBearing_CorrectTypeAssigned = entityRule("IfcBearing", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcBearingType"),
		"IfcBearing: if IsTypedBy is given, its RelatingType must be an IfcBearingType.",
	);
});

// `IfcBearingType_CorrectPredefinedType` (line 6066). New entity, standard "*Type"
// (mandatory PredefinedType) `_CorrectPredefinedType` shape.
const IfcBearingType_CorrectPredefinedType = entityRule("IfcBearingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcBearingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcBlobTexture_RasterCodeByteStream` (line 6076): `blength(RasterCode) % 8 == 0`.
const IfcBlobTexture_RasterCodeByteStream = entityRule("IfcBlobTexture", "RasterCodeByteStream", (self) => {
	const rasterCode = expressGetAttr(self, "RasterCode", INDETERMINATE);
	const bitLength = sizeof(rasterCode) as number;
	assertWhereRule(bitLength % 8 === 0, "IfcBlobTexture.RasterCode's bit length must be a multiple of 8.");
});

// `IfcBlobTexture_SupportedRasterFormat` (line 6086): `RasterFormat.lower() in
// ['bmp', 'jpg', 'gif', 'png']`.
const IfcBlobTexture_SupportedRasterFormat = entityRule("IfcBlobTexture", "SupportedRasterFormat", (self) => {
	const rasterFormat = expressGetAttr(self, "RasterFormat", INDETERMINATE) as string;
	assertWhereRule(
		["bmp", "jpg", "gif", "png"].includes(rasterFormat.toLowerCase()),
		"IfcBlobTexture.RasterFormat must be one of 'bmp', 'jpg', 'gif', 'png' (case-insensitive).",
	);
});

// `IfcBoiler_CorrectPredefinedType` (line 6095).
const IfcBoiler_CorrectPredefinedType = entityRule("IfcBoiler", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBoiler: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBoiler_CorrectTypeAssigned` (line 6105).
const IfcBoiler_CorrectTypeAssigned = entityRule("IfcBoiler", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcBoilerType"),
		"IfcBoiler: if IsTypedBy is given, its RelatingType must be an IfcBoilerType.",
	);
});

// `IfcBoilerType_CorrectPredefinedType` (line 6115).
const IfcBoilerType_CorrectPredefinedType = entityRule("IfcBoilerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcBoilerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcBooleanClippingResult_FirstOperandType` (line 6125): `IfcSweptAreaSolid in
// typeof(FirstOperand) or IfcSweptDiscSolid in typeof(FirstOperand) or
// IfcBooleanClippingResult in typeof(FirstOperand)`.
const IfcBooleanClippingResult_FirstOperandType = entityRule("IfcBooleanClippingResult", "FirstOperandType", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	const types = typeOfAttr(firstOperand);
	assertWhereRule(
		types.has("ifc4x3_add2.ifcsweptareasolid") ||
			types.has("ifc4x3_add2.ifcsweptdiscsolid") ||
			types.has("ifc4x3_add2.ifcbooleanclippingresult"),
		"IfcBooleanClippingResult.FirstOperand must be an IfcSweptAreaSolid, IfcSweptDiscSolid, or IfcBooleanClippingResult.",
	);
});

// `IfcBooleanClippingResult_OperatorType` (line 6135): `Operator == DIFFERENCE`.
const IfcBooleanClippingResult_OperatorType = entityRule("IfcBooleanClippingResult", "OperatorType", (self) => {
	const operator = expressGetAttr(self, "Operator", INDETERMINATE);
	assertWhereRule(triEq(operator, "DIFFERENCE"), "IfcBooleanClippingResult.Operator must be DIFFERENCE.");
});

// `IfcBooleanClippingResult_SecondOperandType` (line 6145): `IfcHalfSpaceSolid in
// typeof(SecondOperand)`.
const IfcBooleanClippingResult_SecondOperandType = entityRule(
	"IfcBooleanClippingResult",
	"SecondOperandType",
	(self) => {
		const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
		assertWhereRule(
			typeOfAttr(secondOperand).has("ifc4x3_add2.ifchalfspacesolid"),
			"IfcBooleanClippingResult.SecondOperand must be an IfcHalfSpaceSolid.",
		);
	},
);

// `IfcBooleanResult_FirstOperandClosed` (line 6155): `not IfcTessellatedFaceSet in
// typeof(FirstOperand) or (exists(FirstOperand.Closed) and FirstOperand.Closed)`.
const IfcBooleanResult_FirstOperandClosed = entityRule("IfcBooleanResult", "FirstOperandClosed", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	assertWhereRule(
		pyOr(!typeOfAttr(firstOperand).has("ifc4x3_add2.ifctessellatedfaceset"), () => {
			const closed = expressGetAttr(firstOperand, "Closed", INDETERMINATE);
			return pyAnd(exists(closed), () => closed as Tri);
		}),
		"IfcBooleanResult: if FirstOperand is an IfcTessellatedFaceSet, its Closed must be TRUE.",
	);
});

// `IfcBooleanResult_SameDim` (line 6165): `FirstOperand.Dim == SecondOperand.Dim`.
const IfcBooleanResult_SameDim = entityRule("IfcBooleanResult", "SameDim", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(firstOperand, "Dim", INDETERMINATE), expressGetAttr(secondOperand, "Dim", INDETERMINATE)),
		"IfcBooleanResult: FirstOperand.Dim must equal SecondOperand.Dim.",
	);
});

registerSchemaRules("IFC4X3_ADD2", [
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
	IfcActorRole_WR1,
	IfcActuator_CorrectPredefinedType,
	IfcActuator_CorrectTypeAssigned,
	IfcActuatorType_CorrectPredefinedType,
	IfcAddress_WR1,
	IfcAdvancedBrep_HasAdvancedFaces,
	IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces,
	IfcAdvancedFace_ApplicableEdgeCurves,
	IfcAdvancedFace_ApplicableSurface,
	IfcAdvancedFace_RequiresEdgeCurve,
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
	IfcAsymmetricIShapeProfileDef_ValidBottomFilletRadius,
	IfcAsymmetricIShapeProfileDef_ValidFlangeThickness,
	IfcAsymmetricIShapeProfileDef_ValidTopFilletRadius,
	IfcAsymmetricIShapeProfileDef_ValidWebThickness,
	IfcAudioVisualAppliance_CorrectPredefinedType,
	IfcAudioVisualAppliance_CorrectTypeAssigned,
	IfcAudioVisualApplianceType_CorrectPredefinedType,
	IfcAxis1Placement_AxisIs3D,
	IfcAxis1Placement_LocationIs3D,
	IfcAxis1Placement_LocationIsCP,
	IfcAxis2Placement2D_LocationIs2D,
	IfcAxis2Placement2D_LocationIsCP,
	IfcAxis2Placement2D_RefDirIs2D,
	IfcAxis2Placement3D_AxisAndRefDirProvision,
	IfcAxis2Placement3D_AxisIs3D,
	IfcAxis2Placement3D_AxisToRefDirPosition,
	IfcAxis2Placement3D_LocationIs3D,
	IfcAxis2Placement3D_LocationIsCP,
	IfcAxis2Placement3D_RefDirIs3D,
	IfcAxis2PlacementLinear_WR1,
	IfcAxis2PlacementLinear_WR2,
	IfcBSplineCurve_SameDim,
	IfcBSplineCurveWithKnots_ConsistentBSpline,
	IfcBSplineCurveWithKnots_CorrespondingKnotLists,
	IfcBSplineSurfaceWithKnots_CorrespondingULists,
	IfcBSplineSurfaceWithKnots_CorrespondingVLists,
	IfcBSplineSurfaceWithKnots_UDirectionConstraints,
	IfcBSplineSurfaceWithKnots_VDirectionConstraints,
	IfcBeam_CorrectPredefinedType,
	IfcBeam_CorrectTypeAssigned,
	IfcBeamType_CorrectPredefinedType,
	IfcBearing_CorrectPredefinedType,
	IfcBearing_CorrectTypeAssigned,
	IfcBearingType_CorrectPredefinedType,
	IfcBlobTexture_RasterCodeByteStream,
	IfcBlobTexture_SupportedRasterFormat,
	IfcBoiler_CorrectPredefinedType,
	IfcBoiler_CorrectTypeAssigned,
	IfcBoilerType_CorrectPredefinedType,
	IfcBooleanClippingResult_FirstOperandType,
	IfcBooleanClippingResult_OperatorType,
	IfcBooleanClippingResult_SecondOperandType,
	IfcBooleanResult_FirstOperandClosed,
	IfcBooleanResult_SameDim,
]);

// =============================================================================
// Phase EX-4, IFC4X3_ADD2 chunk 2 (planning/ifcopenshell-ts/70-express-rules-plan.md,
// "the large chunk" -- WHERE-rule classes + `rule_executor.py`): the NEXT 120
// `SCOPE = 'entity'` rules, continuing directly from chunk 1's own last-ported rule with
// zero gap or overlap -- `IfcBooleanResult_SecondOperandClosed` (real source line 6176)
// through `IfcDerivedUnit_WR1` (line 7421) in `src/ifcopenshell-python/ifcopenshell/
// express/rules/IFC4X3_ADD2.py`. **Independently re-verified, not trusted from the
// dispatching task brief's own citation alone**: re-ran the same `^class (\w+)` +
// `SCOPE = '(\w+)'`-matching script chunk 1's own header comment describes, confirmed
// exactly 120 `SCOPE = 'entity'` classes in this range, all 120 with no gap/overlap
// against chunk 1's own last rule (`IfcBooleanResult_SameDim`, line 6165) or chunk 3's
// first rule (`IfcDerivedUnit_WR2`, line 7431, confirmed excluded). IFC4X3_ADD2 now
// stands at 220 of 779 total WHERE-rule classes (100 from chunk 1 + this chunk's own
// 120), 195/752 of its own entity-scope rules.
//
// Unlike IFC4's own chunk 2 (real IFC4.py lines 5361-6617, ending at
// `IfcDuctFitting_CorrectTypeAssigned`), this chunk's own ADD2 range ends much earlier in
// the alphabet (`IfcDerivedUnit_WR1`, not even reaching `Ifc[DE]...Fitting`) despite the
// same 120-rule budget -- consistent with this chunk's own "16 genuinely new rules"
// finding below: ADD2 inserts enough new entities/rules in this stretch of the schema
// that the same rule count covers less alphabetical ground than IFC4's own equivalent
// chunk did.
//
// =============================================================================
// This chunk's own central finding: exhaustive diffing (not sampling) of all 120 rules
// against IFC4's real source, using the same dedicated diff script as chunk 1
// =============================================================================
//
// Every one of this chunk's 120 target rule NAMES was cross-checked against `IFC4.py`'s
// own real source directly:
//
// - **104 of the 120 rules exist in `IFC4.py` under the exact same class name, and their
//   real compiled bodies are BYTE-IDENTICAL once the schema-namespace string embedded in
//   every `typeof(...)`/membership check is normalized (`'ifc4.ifcxxx'` ->
//   `'ifc4x3_add2.ifcxxx'`)** -- confirmed by the same dedicated diff script chunk 1 used,
//   comparing every one of the 104 real class bodies character-for-character after that
//   one substitution (with the script itself corrected mid-investigation to stop each
//   body's own comparison at the first non-indented line, since real Python's own
//   generated file interleaves trailing `calc_*` DERIVE functions between adjacent WHERE-
//   rule classes -- an artifact of the source file's own layout, not a real difference; the
//   naive version of the script had falsely flagged 6 rules as "different" purely because
//   of this trailing DERIVE-function text before the fix). Each of these 104 rules'
//   already-ported IFC4 TS implementation (`whereRules/ifc4.ts`) was located by its own
//   exact variable name and reused as a fresh local copy below (schema-prefix string
//   substituted, message text otherwise unchanged) -- not retranslated from Python by
//   hand, since the underlying logic is provably identical.
// - **16 of the 120 rules have NO `IFC4.py` class of the exact same name** -- each
//   investigated individually, not assumed genuinely new from the name-mismatch alone:
//   - **14 are ordinary `_CorrectPredefinedType`/`_CorrectTypeAssigned` rules on entities
//     that are themselves wholly new in IFC4X3_ADD2** (confirmed via `grep` for each
//     entity's own convenience-constructor wrapper, `def IfcXxx(*args, **kwargs)`, across
//     all of `IFC4.py` -- zero matches for any of them): `IfcBridge`/`IfcBridgePart`
//     (infrastructure bridge + its own constituent part, 1 rule each),
//     `IfcBuiltSystem` (1 rule, a general-system supertype sibling of `IfcBuiltElement`
//     below), `IfcCaissonFoundation`/`IfcCaissonFoundationType` (a deep-foundation
//     element, 3 rules), `IfcConveyorSegment`/`IfcConveyorSegmentType` (a conveying-system
//     segment, 3 rules), `IfcCourse`/`IfcCourseType` (a masonry course element, 3 rules),
//     `IfcDeepFoundation` (1 rule, an abstract supertype for `IfcCaissonFoundation` and
//     similar entities) -- every one of these 14 reuses this file's own already-ported
//     `correctPredefinedType`/`correctTypeAssigned` helpers directly, same as chunk 1's own
//     `IfcBearing`/`IfcBearingType` finding.
//   - **1 is a new RULE on a pre-existing IFC4 entity, not a new entity**:
//     `IfcBuildingSystem_CorrectPredefinedType` -- `IfcBuildingSystem` itself already
//     exists in `IFC4.py` (confirmed via its own convenience-constructor wrapper, real
//     source line 2186) but carries NO WHERE-rule there at all; ADD2 adds this one.
//   - **1 is a genuine schema-level entity RENAME, not a new rule shape**:
//     `IfcBuiltElement_MaxOneMaterialAssociation` is byte-identical (modulo schema prefix)
//     to IFC4's own `IfcBuildingElement_MaxOneMaterialAssociation` (real IFC4.py line
//     5322) -- confirmed directly: `IfcBuildingElement` itself has zero matches anywhere
//     in real `IFC4X3_ADD2.py` (neither as a rule's own `TYPE_NAME` nor as a convenience-
//     constructor wrapper), while `IfcBuiltElement`'s own rule body is otherwise identical
//     to the old `IfcBuildingElement` one. Reused as a fresh local copy of IFC4's own
//     already-ported TS implementation, renamed to its real ADD2 `TYPE_NAME`.
//   - **1 is a new RULE on a pre-existing IFC4 entity, genuinely bespoke shape**:
//     `IfcCoordinateReferenceSystem_NameOrWKT` -- `IfcCoordinateReferenceSystem` itself
//     already exists in `IFC4.py` (convenience-constructor wrapper confirmed, real source
//     line 2435) with no WHERE-rule there; ADD2 adds this one, a new shape not previously
//     ported (see `IfcCoordinateReferenceSystem_NameOrWKT`'s own doc comment below).
// - **A second, genuinely-vanished-entity finding, of the exact same shape as chunk 1's
//   own `IfcBeamStandardCase_HasMaterialProfileSetUsage` disclosure**: `IfcColumnStandardCase_
//   HasMaterialProfileSetUsage` (real IFC4.py line 5854) and `IfcBuildingElement_
//   MaxOneMaterialAssociation` (line 5322, see the rename finding immediately above) both
//   have zero matches anywhere in real `IFC4X3_ADD2.py`'s own source -- `IfcColumnStandardCase`
//   itself (unlike `IfcWallStandardCase`, confirmed still present in ADD2 at real source
//   line 12969) was removed from the schema entirely in ADD2, not merely relocated outside
//   this chunk's own boundary range; confirmed via a `grep` across the WHOLE real
//   `IFC4X3_ADD2.py` file, not just this chunk's own 120-rule slice.
// - **Zero rules found with a genuine subtle divergence beyond the schema-prefix rename**
//   among the 104 identically-named rules -- every one of them is byte-identical modulo
//   that one substitution, re-confirming chunk 1's own "central finding" continues to hold
//   for this chunk's own range too (not assumed to hold for future chunks, per chunk 1's
//   own disclosed caveat).
//
// =============================================================================
// No real upstream Python bugs found in this chunk's own 120 rules
// =============================================================================
//
// Every rule in this chunk was read directly against its own real source body; none
// exhibit chunk 1's own `IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces`-style inverted
// logic or any other confirmed defect. `IfcCompositeCurve_CurveContinuous`'s own
// `discontinuous` bare-name enum reference is ported the same way IFC4's own chunk 2
// already disclosed for this identical rule (the plain uppercase member-name string
// `"DISCONTINUOUS"`, not real Python's `enum_namespace` mechanism) -- cited here as the
// same disclosed, mechanical substitution, not re-derived.
//
// =============================================================================
// Shared helper shapes reused from `whereRules/ifc4.ts` as fresh local copies (all
// already-established reference shapes there, per this project's own "verify against an
// existing shape before writing a local copy" policy -- not new discoveries)
// =============================================================================
//
// **`attrGreaterThanZero`** (4 occurrences: `IfcCartesianTransformationOperator_
// ScaleGreaterZero`'s own `Scl`, `IfcCartesianTransformationOperator2DnonUniform_
// Scale2GreaterZero`'s own `Scl2`, `IfcCartesianTransformationOperator3DnonUniform_
// Scale2GreaterZero`/`Scale3GreaterZero`'s own `Scl2`/`Scl3`) -- Python: `X > 0.0`.
//
// **`allShareFirstAttr`** (2 new call sites here: `IfcCompositeCurve_SameDim`,
// `IfcCompositeProfileDef_InvariantProfileType` -- plus chunk 1's own already-inlined,
// not-retrofitted `IfcBSplineCurve_SameDim`, making 3 occurrences across this file family
// too, mirroring IFC4's own identical 3-occurrence provenance for the same helper).
//
// **`containsSelfReference`** (2 occurrences: `IfcComplexProperty_WR21`,
// `IfcComplexPropertyTemplate_NoSelfReference`).
//
// **`attrExists`** (1 occurrence: `IfcBuildingElementProxy_HasObjectName`'s own `Name`).
//
// **`uniquePropertyLikeNames`, plus its two real-named thin wrappers `ifcUniquePropertyName`/
// `ifcUniquePropertyTemplateNames`** (1 occurrence each: `IfcComplexProperty_WR22`/
// `IfcComplexPropertyTemplate_UniquePropertyNames`) -- rule-file-local EXPRESS-library
// helpers, real source lines 13968/13984 in `IFC4X3_ADD2.py`, independently confirmed
// BYTE-IDENTICAL to `IFC4.py`'s own versions (lines 12139/12155) via direct `diff`.
//
// `correctTypeAssigned`/`correctPredefinedType`/`optionalAttrDimEquals`/
// `userDefinedOrHasAttribute` (all already established in chunk 1, no new logic): 24/58/5/1
// more occurrences respectively in this chunk (`correctPredefinedType`'s own 58 splits as
// 31 `"ObjectType"` + 23 `"ElementType"` + 4 `"ResourceType"` -- the last confirming chunk
// 1's already-flagged-as-expected `"ResourceType"` escape-attribute shape, same 4 entities
// as IFC4's own chunk 2: `IfcConstructionEquipmentResourceType`/
// `IfcConstructionMaterialResourceType`/`IfcConstructionProductResourceType`/
// `IfcCrewResourceType`). `triGe` (2 occurrences, `IfcCartesianPoint_CP2Dor3D`/
// `IfcCurveStyleFontPattern_VisibleLengthGreaterEqualZero`) and `pyNot`
// (`IfcCompositeCurve_CurveContinuous`) are plain `runtimeShim` imports, not rule-file-local
// helpers -- both newly imported into this file in this chunk (not previously needed by
// chunk 1's own 100 rules).
//
// =============================================================================
// Registration-helper duplication -- see chunk 1's own header comment; no new disclosure
// needed here.
// =============================================================================

/**
 * New shared shape (1 occurrence this chunk: `IfcBuildingElementProxy_HasObjectName`'s own
 * `Name`) -- Python: `exists(X)`. Fresh local copy of `whereRules/ifc4.ts`'s own
 * already-established helper of the exact same shape.
 */
function attrExists(self: EntityInstance, attrName: string): boolean {
	return exists(expressGetAttr(self, attrName, INDETERMINATE));
}

/**
 * New shared shape (4 occurrences this chunk, see this file's own header comment) --
 * Python: `X > 0.0`, `X` a mandatory REAL attribute read directly off `self`. Fresh local
 * copy of `whereRules/ifc4.ts`'s own already-established helper of the exact same shape.
 */
function attrGreaterThanZero(self: EntityInstance, attrName: string): Tri {
	return triGt(expressGetAttr(self, attrName, INDETERMINATE), 0.0);
}

/**
 * New shared shape -- Python: `sizeof([temp for temp in X if temp.Y != X[0].Y]) == 0`
 * (every member of list attribute `listAttrName` shares the first member's own `attrName`
 * value). Fresh local copy of `whereRules/ifc4.ts`'s own already-established helper of the
 * exact same shape -- see this file's own header comment for the 3-occurrence provenance
 * (chunk 1's own `IfcBSplineCurve_SameDim`, not retrofitted, plus this chunk's own 2 new
 * call sites).
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
 * New shared shape (2 occurrences this chunk, see this file's own header comment) --
 * Python: `sizeof([temp for temp in X if self == temp]) == 0`. `self == temp` is a genuine
 * entity-instance comparison (`triEq`, not a bare `===`). Fresh local copy of
 * `whereRules/ifc4.ts`'s own already-established helper of the exact same shape.
 */
function containsSelfReference(self: EntityInstance, listAttrName: string): boolean {
	const list = expressGetAttr(self, listAttrName, INDETERMINATE);
	const items = isIndeterminate(list) ? [] : (list as EntityInstance[]);
	const count = items.filter((temp) => triEq(self, temp) === true).length;
	return count === 0;
}

/**
 * Python: `IfcUniquePropertyName(properties)` (real `IFC4X3_ADD2.py` source line 13968) /
 * `IfcUniquePropertyTemplateNames(properties)` (line 13984) -- two real, distinct
 * top-level EXPRESS-library helper functions with byte-identical bodies, independently
 * confirmed BYTE-IDENTICAL to `IFC4.py`'s own versions (lines 12139/12155) via direct
 * `diff`. Build an `express_set` union of every member's own `Name`, then check that set's
 * size equals the list's own length (every member has a distinct Name). Fresh local copy
 * of `whereRules/ifc4.ts`'s own already-established helper of the exact same shape.
 */
function uniquePropertyLikeNames(properties: unknown): boolean {
	const items = isIndeterminate(properties) ? [] : (properties as EntityInstance[]);
	let names = new ExpressSet<unknown>();
	for (const item of items) {
		names = names.plus(expressGetAttr(item, "Name", INDETERMINATE));
	}
	return names.size === items.length;
}

/** Python: `IfcUniquePropertyName` (line 13968) -- see `uniquePropertyLikeNames` above. */
function ifcUniquePropertyName(properties: unknown): boolean {
	return uniquePropertyLikeNames(properties);
}

/** Python: `IfcUniquePropertyTemplateNames` (line 13984) -- see `uniquePropertyLikeNames` above. */
function ifcUniquePropertyTemplateNames(properties: unknown): boolean {
	return uniquePropertyLikeNames(properties);
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 6176-7421, this chunk's own 120).
// =============================================================================

// `IfcBooleanResult_SecondOperandClosed` (ADD2 line 6176) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcBooleanResult_SecondOperandClosed = entityRule("IfcBooleanResult", "SecondOperandClosed", (self) => {
	const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
	assertWhereRule(
		pyOr(!typeOfAttr(secondOperand).has("ifc4x3_add2.ifctessellatedfaceset"), () => {
			const closed = expressGetAttr(secondOperand, "Closed", INDETERMINATE);
			return pyAnd(exists(closed), () => closed as Tri);
		}),
		"IfcBooleanResult: if SecondOperand is an IfcTessellatedFaceSet, its Closed must be TRUE.",
	);
});

// `IfcBoundaryCurve_IsClosed` (ADD2 line 6190) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcBoundaryCurve_IsClosed = entityRule("IfcBoundaryCurve", "IsClosed", (self) => {
	const closedCurve = expressGetAttr(self, "ClosedCurve", INDETERMINATE);
	assertWhereRule(closedCurve as Tri, "IfcBoundaryCurve.ClosedCurve must not be FALSE.");
});

// `IfcBoxedHalfSpace_UnboundedSurface` (ADD2 line 6202) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcBoxedHalfSpace_UnboundedSurface = entityRule("IfcBoxedHalfSpace", "UnboundedSurface", (self) => {
	const baseSurface = expressGetAttr(self, "BaseSurface", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(baseSurface).has("ifc4x3_add2.ifccurveboundedplane"),
		"IfcBoxedHalfSpace.BaseSurface must not be an IfcCurveBoundedPlane.",
	);
});

// `IfcBridge_CorrectPredefinedType` (line 6211). `IfcBridge` is wholly new in
// IFC4X3_ADD2 (an infrastructure bridge element, no IFC4 counterpart -- confirmed via
// `grep` for its own convenience-constructor wrapper across all of `IFC4.py`, zero
// matches), standard "occurrence" `_CorrectPredefinedType` shape.
const IfcBridge_CorrectPredefinedType = entityRule("IfcBridge", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBridge: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBridgePart_CorrectPredefinedType` (line 6221). New entity (a bridge's own
// constituent part, e.g. deck/pier/abutment), same shape as `IfcBridge` above.
const IfcBridgePart_CorrectPredefinedType = entityRule("IfcBridgePart", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBridgePart: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBuildingElementPart_CorrectPredefinedType` (ADD2 line 6231) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcBuildingElementPart_CorrectTypeAssigned` (ADD2 line 6241) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcBuildingElementPartType_CorrectPredefinedType` (ADD2 line 6251) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcBuildingElementProxy_CorrectPredefinedType` (ADD2 line 6261) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcBuildingElementProxy_CorrectTypeAssigned` (ADD2 line 6271) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcBuildingElementProxy_HasObjectName` (ADD2 line 6281) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcBuildingElementProxy_HasObjectName = entityRule("IfcBuildingElementProxy", "HasObjectName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcBuildingElementProxy.Name must be given.");
});

// `IfcBuildingElementProxyType_CorrectPredefinedType` (ADD2 line 6290) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcBuildingSystem_CorrectPredefinedType` (line 6300). `IfcBuildingSystem` itself
// already exists in IFC4 (confirmed via its own convenience-constructor wrapper, real
// `IFC4.py` line 2186) but carries NO WHERE-rule there at all -- ADD2 adds this new
// "occurrence" `_CorrectPredefinedType` rule for it (a new RULE on a pre-existing entity,
// not a wholly new entity).
const IfcBuildingSystem_CorrectPredefinedType = entityRule("IfcBuildingSystem", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBuildingSystem: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBuiltElement_MaxOneMaterialAssociation` (line 6310): byte-identical (modulo schema
// prefix) to IFC4's own `IfcBuildingElement_MaxOneMaterialAssociation` (real `IFC4.py`
// line 5322) -- **`IfcBuildingElement` was renamed to `IfcBuiltElement` in
// IFC4X3_ADD2** (confirmed: `IfcBuildingElement`/`IfcColumnStandardCase_
// HasMaterialProfileSetUsage` both have zero matches anywhere in real
// `IFC4X3_ADD2.py`, while this rule's own body -- `sizeof([temp for temp in
// HasAssociations if 'ifc4x3_add2.ifcrelassociatesmaterial' in typeof(temp)]) <= 1` -- is
// otherwise identical to IFC4's `IfcBuildingElement` version; a schema-level entity
// supertype rename, not a new rule shape -- see this file's own header comment for the
// full disclosure, including the 2nd confirmed-vanished-entity finding
// (`IfcColumnStandardCase`, unlike `IfcWallStandardCase` which is confirmed still present
// in ADD2). Reused as a fresh local copy of IFC4's own already-ported TS implementation,
// renamed to its real ADD2 `TYPE_NAME`.
const IfcBuiltElement_MaxOneMaterialAssociation = entityRule("IfcBuiltElement", "MaxOneMaterialAssociation", (self) => {
	const hasAssociations = expressGetAttr(self, "HasAssociations", INDETERMINATE);
	const items = isIndeterminate(hasAssociations) ? [] : (hasAssociations as EntityInstance[]);
	const count = items.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcrelassociatesmaterial")).length;
	assertWhereRule(
		count <= 1,
		"IfcBuiltElement: at most one HasAssociations member may be an IfcRelAssociatesMaterial.",
	);
});

// `IfcBuiltSystem_CorrectPredefinedType` (line 6319). `IfcBuiltSystem` is wholly new in
// IFC4X3_ADD2 (a general-system supertype sibling of `IfcBuiltElement` above), standard
// "occurrence" shape.
const IfcBuiltSystem_CorrectPredefinedType = entityRule("IfcBuiltSystem", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBuiltSystem: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBurner_CorrectPredefinedType` (ADD2 line 6329) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcBurner_CorrectPredefinedType = entityRule("IfcBurner", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcBurner: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcBurner_CorrectTypeAssigned` (ADD2 line 6339) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcBurner_CorrectTypeAssigned = entityRule("IfcBurner", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcBurnerType"),
		"IfcBurner: if IsTypedBy is given, its RelatingType must be an IfcBurnerType.",
	);
});

// `IfcBurnerType_CorrectPredefinedType` (ADD2 line 6349) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcBurnerType_CorrectPredefinedType = entityRule("IfcBurnerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcBurnerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCShapeProfileDef_ValidGirth` (ADD2 line 6359) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCShapeProfileDef_ValidGirth = entityRule("IfcCShapeProfileDef", "ValidGirth", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE) as number;
	const girth = expressGetAttr(self, "Girth", INDETERMINATE);
	assertWhereRule(triLt(girth, depth / 2.0), "IfcCShapeProfileDef.Girth must be less than half of Depth.");
});

// `IfcCShapeProfileDef_ValidInternalFilletRadius` (ADD2 line 6370) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCShapeProfileDef_ValidWallThickness` (ADD2 line 6383) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCShapeProfileDef_ValidWallThickness = entityRule("IfcCShapeProfileDef", "ValidWallThickness", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE) as number;
	const width = expressGetAttr(self, "Width", INDETERMINATE) as number;
	const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLt(wallThickness, width / 2.0), () => triLt(wallThickness, depth / 2.0)),
		"IfcCShapeProfileDef.WallThickness must be less than half of both Width and Depth.",
	);
});

// `IfcCableCarrierFitting_CorrectPredefinedType` (ADD2 line 6395) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCableCarrierFitting_CorrectTypeAssigned` (ADD2 line 6405) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCableCarrierFittingType_CorrectPredefinedType` (ADD2 line 6415) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCableCarrierSegment_CorrectPredefinedType` (ADD2 line 6425) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCableCarrierSegment_CorrectTypeAssigned` (ADD2 line 6435) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCableCarrierSegmentType_CorrectPredefinedType` (ADD2 line 6445) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCableFitting_CorrectPredefinedType` (ADD2 line 6455) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCableFitting_CorrectPredefinedType = entityRule("IfcCableFitting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCableFitting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCableFitting_CorrectTypeAssigned` (ADD2 line 6465) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCableFitting_CorrectTypeAssigned = entityRule("IfcCableFitting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCableFittingType"),
		"IfcCableFitting: if IsTypedBy is given, its RelatingType must be an IfcCableFittingType.",
	);
});

// `IfcCableFittingType_CorrectPredefinedType` (ADD2 line 6475) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCableFittingType_CorrectPredefinedType = entityRule("IfcCableFittingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCableFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCableSegment_CorrectPredefinedType` (ADD2 line 6485) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCableSegment_CorrectPredefinedType = entityRule("IfcCableSegment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCableSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCableSegment_CorrectTypeAssigned` (ADD2 line 6495) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCableSegment_CorrectTypeAssigned = entityRule("IfcCableSegment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCableSegmentType"),
		"IfcCableSegment: if IsTypedBy is given, its RelatingType must be an IfcCableSegmentType.",
	);
});

// `IfcCableSegmentType_CorrectPredefinedType` (ADD2 line 6505) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCableSegmentType_CorrectPredefinedType = entityRule("IfcCableSegmentType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCableSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCaissonFoundation_CorrectPredefinedType` (line 6515). `IfcCaissonFoundation` is
// wholly new in IFC4X3_ADD2 (a deep-foundation element), standard "occurrence" shape.
const IfcCaissonFoundation_CorrectPredefinedType = entityRule(
	"IfcCaissonFoundation",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcCaissonFoundation: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcCaissonFoundation_CorrectTypeAssigned` (line 6525). New entity, standard
// `_CorrectTypeAssigned` shape.
const IfcCaissonFoundation_CorrectTypeAssigned = entityRule("IfcCaissonFoundation", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCaissonFoundationType"),
		"IfcCaissonFoundation: if IsTypedBy is given, its RelatingType must be an IfcCaissonFoundationType.",
	);
});

// `IfcCaissonFoundationType_CorrectPredefinedType` (line 6535). New entity, standard
// "*Type" (mandatory PredefinedType) shape.
const IfcCaissonFoundationType_CorrectPredefinedType = entityRule(
	"IfcCaissonFoundationType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcCaissonFoundationType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcCartesianPoint_CP2Dor3D` (ADD2 line 6545) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCartesianPoint_CP2Dor3D = entityRule("IfcCartesianPoint", "CP2Dor3D", (self) => {
	const coordinates = expressGetAttr(self, "Coordinates", INDETERMINATE);
	assertWhereRule(triGe(sizeof(coordinates), 2), "IfcCartesianPoint.Coordinates must have at least 2 elements.");
});

// `IfcCartesianTransformationOperator_ScaleGreaterZero` (ADD2 line 6558) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCartesianTransformationOperator_ScaleGreaterZero = entityRule(
	"IfcCartesianTransformationOperator",
	"ScaleGreaterZero",
	(self) => {
		assertWhereRule(attrGreaterThanZero(self, "Scl"), "IfcCartesianTransformationOperator.Scl must be greater than 0.");
	},
);

// `IfcCartesianTransformationOperator2D_Axis1Is2D` (ADD2 line 6576) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator2D_Axis2Is2D` (ADD2 line 6585) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator2D_DimEqual2` (ADD2 line 6594) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator2DnonUniform_Scale2GreaterZero` (ADD2 line 6606) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator3D_Axis1Is3D` (ADD2 line 6620) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator3D_Axis2Is3D` (ADD2 line 6629) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator3D_Axis3Is3D` (ADD2 line 6638) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator3D_DimIs3D` (ADD2 line 6648) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator3DnonUniform_Scale2GreaterZero` (ADD2 line 6661) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCartesianTransformationOperator3DnonUniform_Scale3GreaterZero` (ADD2 line 6671) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcChiller_CorrectPredefinedType` (ADD2 line 6689) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcChiller_CorrectPredefinedType = entityRule("IfcChiller", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcChiller: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcChiller_CorrectTypeAssigned` (ADD2 line 6699) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcChiller_CorrectTypeAssigned = entityRule("IfcChiller", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcChillerType"),
		"IfcChiller: if IsTypedBy is given, its RelatingType must be an IfcChillerType.",
	);
});

// `IfcChillerType_CorrectPredefinedType` (ADD2 line 6709) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcChillerType_CorrectPredefinedType = entityRule("IfcChillerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcChillerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcChimney_CorrectPredefinedType` (ADD2 line 6719) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcChimney_CorrectPredefinedType = entityRule("IfcChimney", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcChimney: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcChimney_CorrectTypeAssigned` (ADD2 line 6729) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcChimney_CorrectTypeAssigned = entityRule("IfcChimney", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcChimneyType"),
		"IfcChimney: if IsTypedBy is given, its RelatingType must be an IfcChimneyType.",
	);
});

// `IfcChimneyType_CorrectPredefinedType` (ADD2 line 6739) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcChimneyType_CorrectPredefinedType = entityRule("IfcChimneyType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcChimneyType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCircleHollowProfileDef_WR1` (ADD2 line 6749) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCircleHollowProfileDef_WR1 = entityRule("IfcCircleHollowProfileDef", "WR1", (self) => {
	const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE);
	const radius = expressGetAttr(self, "Radius", INDETERMINATE);
	assertWhereRule(triLt(wallThickness, radius), "IfcCircleHollowProfileDef.WallThickness must be less than Radius.");
});

// `IfcCoil_CorrectPredefinedType` (ADD2 line 6759) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCoil_CorrectPredefinedType = entityRule("IfcCoil", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCoil: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCoil_CorrectTypeAssigned` (ADD2 line 6769) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCoil_CorrectTypeAssigned = entityRule("IfcCoil", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCoilType"),
		"IfcCoil: if IsTypedBy is given, its RelatingType must be an IfcCoilType.",
	);
});

// `IfcCoilType_CorrectPredefinedType` (ADD2 line 6779) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCoilType_CorrectPredefinedType = entityRule("IfcCoilType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCoilType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcColumn_CorrectPredefinedType` (ADD2 line 6789) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcColumn_CorrectPredefinedType = entityRule("IfcColumn", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcColumn: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcColumn_CorrectTypeAssigned` (ADD2 line 6799) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcColumn_CorrectTypeAssigned = entityRule("IfcColumn", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcColumnType"),
		"IfcColumn: if IsTypedBy is given, its RelatingType must be an IfcColumnType.",
	);
});

// `IfcColumnType_CorrectPredefinedType` (ADD2 line 6809) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcColumnType_CorrectPredefinedType = entityRule("IfcColumnType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcColumnType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCommunicationsAppliance_CorrectPredefinedType` (ADD2 line 6819) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCommunicationsAppliance_CorrectTypeAssigned` (ADD2 line 6829) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCommunicationsApplianceType_CorrectPredefinedType` (ADD2 line 6839) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcComplexProperty_WR21` (ADD2 line 6849) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcComplexProperty_WR21 = entityRule("IfcComplexProperty", "WR21", (self) => {
	assertWhereRule(
		containsSelfReference(self, "HasProperties"),
		"IfcComplexProperty.HasProperties must not contain self.",
	);
});

// `IfcComplexProperty_WR22` (ADD2 line 6859) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcComplexProperty_WR22 = entityRule("IfcComplexProperty", "WR22", (self) => {
	const hasProperties = expressGetAttr(self, "HasProperties", INDETERMINATE);
	assertWhereRule(
		ifcUniquePropertyName(hasProperties),
		"IfcComplexProperty.HasProperties: every member must have a distinct Name.",
	);
});

// `IfcComplexPropertyTemplate_NoSelfReference` (ADD2 line 6869) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcComplexPropertyTemplate_UniquePropertyNames` (ADD2 line 6879) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCompositeCurve_CurveContinuous` (ADD2 line 6889) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCompositeCurve_SameDim` (ADD2 line 6900) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCompositeCurve_SameDim = entityRule("IfcCompositeCurve", "SameDim", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "Segments", "Dim"),
		"IfcCompositeCurve: every Segments member must share the first member's Dim.",
	);
});

// `IfcCompositeCurveOnSurface_SameSurface` (ADD2 line 6919) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCompositeCurveOnSurface_SameSurface = entityRule("IfcCompositeCurveOnSurface", "SameSurface", (self) => {
	const basisSurface = expressGetAttr(self, "BasisSurface", INDETERMINATE);
	assertWhereRule(triGt(sizeof(basisSurface), 0), "IfcCompositeCurveOnSurface.BasisSurface must be non-empty.");
});

// `IfcCompositeCurveSegment_ParentIsBoundedCurve` (ADD2 line 6932) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCompositeCurveSegment_ParentIsBoundedCurve = entityRule(
	"IfcCompositeCurveSegment",
	"ParentIsBoundedCurve",
	(self) => {
		const parentCurve = expressGetAttr(self, "ParentCurve", INDETERMINATE);
		assertWhereRule(
			typeOfAttr(parentCurve).has("ifc4x3_add2.ifcboundedcurve"),
			"IfcCompositeCurveSegment.ParentCurve must be an IfcBoundedCurve.",
		);
	},
);

// `IfcCompositeProfileDef_InvariantProfileType` (ADD2 line 6942) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcCompositeProfileDef_NoRecursion` (ADD2 line 6952) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCompositeProfileDef_NoRecursion = entityRule("IfcCompositeProfileDef", "NoRecursion", (self) => {
	const profiles = expressGetAttr(self, "Profiles", INDETERMINATE);
	const items = isIndeterminate(profiles) ? [] : (profiles as EntityInstance[]);
	const violating = items.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifccompositeprofiledef")).length;
	assertWhereRule(violating === 0, "IfcCompositeProfileDef.Profiles must not contain another IfcCompositeProfileDef.");
});

// `IfcCompressor_CorrectPredefinedType` (ADD2 line 6962) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCompressor_CorrectPredefinedType = entityRule("IfcCompressor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCompressor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCompressor_CorrectTypeAssigned` (ADD2 line 6972) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCompressor_CorrectTypeAssigned = entityRule("IfcCompressor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCompressorType"),
		"IfcCompressor: if IsTypedBy is given, its RelatingType must be an IfcCompressorType.",
	);
});

// `IfcCompressorType_CorrectPredefinedType` (ADD2 line 6982) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCompressorType_CorrectPredefinedType = entityRule("IfcCompressorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCompressorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCondenser_CorrectPredefinedType` (ADD2 line 6992) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCondenser_CorrectPredefinedType = entityRule("IfcCondenser", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCondenser: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCondenser_CorrectTypeAssigned` (ADD2 line 7002) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCondenser_CorrectTypeAssigned = entityRule("IfcCondenser", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCondenserType"),
		"IfcCondenser: if IsTypedBy is given, its RelatingType must be an IfcCondenserType.",
	);
});

// `IfcCondenserType_CorrectPredefinedType` (ADD2 line 7012) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCondenserType_CorrectPredefinedType = entityRule("IfcCondenserType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCondenserType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcConstraint_WR11` (ADD2 line 7022) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcConstraint_WR11 = entityRule("IfcConstraint", "WR11", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "ConstraintGrade", "UserDefinedGrade"),
		"IfcConstraint: if ConstraintGrade is USERDEFINED, UserDefinedGrade must be given.",
	);
});

// `IfcConstructionEquipmentResource_CorrectPredefinedType` (ADD2 line 7032) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcConstructionEquipmentResourceType_CorrectPredefinedType` (ADD2 line 7042) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcConstructionMaterialResource_CorrectPredefinedType` (ADD2 line 7052) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcConstructionMaterialResourceType_CorrectPredefinedType` (ADD2 line 7062) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcConstructionProductResource_CorrectPredefinedType` (ADD2 line 7072) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcConstructionProductResourceType_CorrectPredefinedType` (ADD2 line 7082) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcController_CorrectPredefinedType` (ADD2 line 7092) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcController_CorrectPredefinedType = entityRule("IfcController", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcController: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcController_CorrectTypeAssigned` (ADD2 line 7102) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcController_CorrectTypeAssigned = entityRule("IfcController", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcControllerType"),
		"IfcController: if IsTypedBy is given, its RelatingType must be an IfcControllerType.",
	);
});

// `IfcControllerType_CorrectPredefinedType` (ADD2 line 7112) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcControllerType_CorrectPredefinedType = entityRule("IfcControllerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcControllerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcConveyorSegment_CorrectPredefinedType` (line 7122). `IfcConveyorSegment` is wholly
// new in IFC4X3_ADD2 (a conveying-system segment element), standard "occurrence" shape.
const IfcConveyorSegment_CorrectPredefinedType = entityRule("IfcConveyorSegment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcConveyorSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcConveyorSegment_CorrectTypeAssigned` (line 7132). New entity, standard
// `_CorrectTypeAssigned` shape.
const IfcConveyorSegment_CorrectTypeAssigned = entityRule("IfcConveyorSegment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcConveyorSegmentType"),
		"IfcConveyorSegment: if IsTypedBy is given, its RelatingType must be an IfcConveyorSegmentType.",
	);
});

// `IfcConveyorSegmentType_CorrectPredefinedType` (line 7142). New entity, standard
// "*Type" shape.
const IfcConveyorSegmentType_CorrectPredefinedType = entityRule(
	"IfcConveyorSegmentType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcConveyorSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcCooledBeam_CorrectPredefinedType` (ADD2 line 7152) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCooledBeam_CorrectPredefinedType = entityRule("IfcCooledBeam", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCooledBeam: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCooledBeam_CorrectTypeAssigned` (ADD2 line 7162) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCooledBeam_CorrectTypeAssigned = entityRule("IfcCooledBeam", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCooledBeamType"),
		"IfcCooledBeam: if IsTypedBy is given, its RelatingType must be an IfcCooledBeamType.",
	);
});

// `IfcCooledBeamType_CorrectPredefinedType` (ADD2 line 7172) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCooledBeamType_CorrectPredefinedType = entityRule("IfcCooledBeamType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCooledBeamType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCoolingTower_CorrectPredefinedType` (ADD2 line 7182) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCoolingTower_CorrectPredefinedType = entityRule("IfcCoolingTower", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCoolingTower: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCoolingTower_CorrectTypeAssigned` (ADD2 line 7192) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCoolingTower_CorrectTypeAssigned = entityRule("IfcCoolingTower", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCoolingTowerType"),
		"IfcCoolingTower: if IsTypedBy is given, its RelatingType must be an IfcCoolingTowerType.",
	);
});

// `IfcCoolingTowerType_CorrectPredefinedType` (ADD2 line 7202) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCoolingTowerType_CorrectPredefinedType = entityRule("IfcCoolingTowerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCoolingTowerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCoordinateReferenceSystem_NameOrWKT` (line 7212): `hiindex(WellKnownText) == 1 or
// exists(Name)`. `IfcCoordinateReferenceSystem` itself already exists in IFC4 (confirmed
// via its own convenience-constructor wrapper, real `IFC4.py` line 2435) but carries NO
// WHERE-rule there at all -- ADD2 adds this new rule (on a pre-existing entity, not a
// wholly new one), a genuinely bespoke shape with no precedent in this file family.
// `hiindex` is this runtime's own `sizeof` alias (same substitution `IfcCartesianPoint_
// CP2Dor3D` above already makes for its own `hiindex` call).
//
// **Real finding, confirmed directly against the compiled native schema** (`src/ifcparse/
// schemas/Ifc4x3_add2-schema.cpp`, not assumed): `WellKnownText` is a genuine INVERSE
// attribute on `IfcCoordinateReferenceSystem` (`SET [0:1] OF IfcWellKnownText`, the
// inverse side of `IfcWellKnownText`'s own forward `CoordinateReferenceSystem` attribute)
// -- NOT a forward one, despite reading identically to a forward attribute through
// `expressGetAttr`/real Python's own `express_getattr` (exactly the same already-disclosed
// shape `correctTypeAssigned`'s own `IsTypedBy` relies on throughout this file family).
// No code-shape difference from an ordinary forward attribute read results -- disclosed
// here because it means a test fixture must build the real referencing `IfcWellKnownText`
// instance (see `ifc4x3.test.ts`'s own `wellKnownTextFor` helper), not a plain `set(...)`.
const IfcCoordinateReferenceSystem_NameOrWKT = entityRule("IfcCoordinateReferenceSystem", "NameOrWKT", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	const wellKnownText = expressGetAttr(self, "WellKnownText", INDETERMINATE);
	assertWhereRule(
		pyOr(triEq(sizeof(wellKnownText), 1), () => exists(name)),
		"IfcCoordinateReferenceSystem: WellKnownText must have exactly one element, or Name must be given.",
	);
});

// `IfcCourse_CorrectPredefinedType` (line 7223). `IfcCourse` is wholly new in
// IFC4X3_ADD2 (a masonry course element), standard "occurrence" shape.
const IfcCourse_CorrectPredefinedType = entityRule("IfcCourse", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCourse: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCourse_CorrectTypeAssigned` (line 7233). New entity, standard `_CorrectTypeAssigned`
// shape.
const IfcCourse_CorrectTypeAssigned = entityRule("IfcCourse", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCourseType"),
		"IfcCourse: if IsTypedBy is given, its RelatingType must be an IfcCourseType.",
	);
});

// `IfcCourseType_CorrectPredefinedType` (line 7243). New entity, standard "*Type" shape.
const IfcCourseType_CorrectPredefinedType = entityRule("IfcCourseType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCourseType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCovering_CorrectPredefinedType` (ADD2 line 7253) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCovering_CorrectPredefinedType = entityRule("IfcCovering", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCovering: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCovering_CorrectTypeAssigned` (ADD2 line 7263) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCovering_CorrectTypeAssigned = entityRule("IfcCovering", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCoveringType"),
		"IfcCovering: if IsTypedBy is given, its RelatingType must be an IfcCoveringType.",
	);
});

// `IfcCoveringType_CorrectPredefinedType` (ADD2 line 7273) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCoveringType_CorrectPredefinedType = entityRule("IfcCoveringType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCoveringType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCrewResource_CorrectPredefinedType` (ADD2 line 7283) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCrewResource_CorrectPredefinedType = entityRule("IfcCrewResource", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCrewResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCrewResourceType_CorrectPredefinedType` (ADD2 line 7293) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCrewResourceType_CorrectPredefinedType = entityRule("IfcCrewResourceType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ResourceType", false),
		"IfcCrewResourceType: if PredefinedType is USERDEFINED, ResourceType must be given.",
	);
});

// `IfcCurtainWall_CorrectPredefinedType` (ADD2 line 7306) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCurtainWall_CorrectPredefinedType = entityRule("IfcCurtainWall", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcCurtainWall: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCurtainWall_CorrectTypeAssigned` (ADD2 line 7316) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCurtainWall_CorrectTypeAssigned = entityRule("IfcCurtainWall", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcCurtainWallType"),
		"IfcCurtainWall: if IsTypedBy is given, its RelatingType must be an IfcCurtainWallType.",
	);
});

// `IfcCurtainWallType_CorrectPredefinedType` (ADD2 line 7326) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCurtainWallType_CorrectPredefinedType = entityRule("IfcCurtainWallType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcCurtainWallType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCurveStyle_IdentifiableCurveStyle` (ADD2 line 7339) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCurveStyle_IdentifiableCurveStyle = entityRule("IfcCurveStyle", "IdentifiableCurveStyle", (self) => {
	const curveFont = expressGetAttr(self, "CurveFont", INDETERMINATE);
	const curveWidth = expressGetAttr(self, "CurveWidth", INDETERMINATE);
	const curveColour = expressGetAttr(self, "CurveColour", INDETERMINATE);
	assertWhereRule(
		exists(curveFont) || exists(curveWidth) || exists(curveColour),
		"IfcCurveStyle: at least one of CurveFont, CurveWidth, CurveColour must be given.",
	);
});

// `IfcCurveStyle_MeasureOfWidth` (ADD2 line 7351) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcCurveStyle_MeasureOfWidth = entityRule("IfcCurveStyle", "MeasureOfWidth", (self) => {
	const curveWidth = expressGetAttr(self, "CurveWidth", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(curveWidth), () =>
			pyOr(typeOfAttr(curveWidth).has("ifc4x3_add2.ifcpositivelengthmeasure"), () =>
				pyAnd(typeOfAttr(curveWidth).has("ifc4x3_add2.ifcdescriptivemeasure"), () => triEq(curveWidth, "by layer")),
			),
		),
		"IfcCurveStyle: if CurveWidth is given, it must be an IfcPositiveLengthMeasure, or an IfcDescriptiveMeasure equal to 'by layer'.",
	);
});

// `IfcCurveStyleFontPattern_VisibleLengthGreaterEqualZero` (ADD2 line 7361) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDamper_CorrectPredefinedType` (ADD2 line 7371) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDamper_CorrectPredefinedType = entityRule("IfcDamper", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDamper: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDamper_CorrectTypeAssigned` (ADD2 line 7381) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDamper_CorrectTypeAssigned = entityRule("IfcDamper", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDamperType"),
		"IfcDamper: if IsTypedBy is given, its RelatingType must be an IfcDamperType.",
	);
});

// `IfcDamperType_CorrectPredefinedType` (ADD2 line 7391) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDamperType_CorrectPredefinedType = entityRule("IfcDamperType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDamperType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDeepFoundation_CorrectTypeAssigned` (line 7401). `IfcDeepFoundation` itself has no
// IFC4 rule counterpart and no convenience-constructor wrapper in `IFC4.py` either
// (likely an ADD2-new abstract supertype for `IfcCaissonFoundation`/`IfcPile`-like deep
// foundations), standard `_CorrectTypeAssigned` shape.
const IfcDeepFoundation_CorrectTypeAssigned = entityRule("IfcDeepFoundation", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDeepFoundationType"),
		"IfcDeepFoundation: if IsTypedBy is given, its RelatingType must be an IfcDeepFoundationType.",
	);
});

// `IfcDerivedProfileDef_InvariantProfileType` (ADD2 line 7411) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDerivedUnit_WR1` (ADD2 line 7421) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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
registerSchemaRules("IFC4X3_ADD2", [
	IfcBooleanResult_SecondOperandClosed,
	IfcBoundaryCurve_IsClosed,
	IfcBoxedHalfSpace_UnboundedSurface,
	IfcBridge_CorrectPredefinedType,
	IfcBridgePart_CorrectPredefinedType,
	IfcBuildingElementPart_CorrectPredefinedType,
	IfcBuildingElementPart_CorrectTypeAssigned,
	IfcBuildingElementPartType_CorrectPredefinedType,
	IfcBuildingElementProxy_CorrectPredefinedType,
	IfcBuildingElementProxy_CorrectTypeAssigned,
	IfcBuildingElementProxy_HasObjectName,
	IfcBuildingElementProxyType_CorrectPredefinedType,
	IfcBuildingSystem_CorrectPredefinedType,
	IfcBuiltElement_MaxOneMaterialAssociation,
	IfcBuiltSystem_CorrectPredefinedType,
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
	IfcCaissonFoundation_CorrectPredefinedType,
	IfcCaissonFoundation_CorrectTypeAssigned,
	IfcCaissonFoundationType_CorrectPredefinedType,
	IfcCartesianPoint_CP2Dor3D,
	IfcCartesianTransformationOperator_ScaleGreaterZero,
	IfcCartesianTransformationOperator2D_Axis1Is2D,
	IfcCartesianTransformationOperator2D_Axis2Is2D,
	IfcCartesianTransformationOperator2D_DimEqual2,
	IfcCartesianTransformationOperator2DnonUniform_Scale2GreaterZero,
	IfcCartesianTransformationOperator3D_Axis1Is3D,
	IfcCartesianTransformationOperator3D_Axis2Is3D,
	IfcCartesianTransformationOperator3D_Axis3Is3D,
	IfcCartesianTransformationOperator3D_DimIs3D,
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
	IfcColumnType_CorrectPredefinedType,
	IfcCommunicationsAppliance_CorrectPredefinedType,
	IfcCommunicationsAppliance_CorrectTypeAssigned,
	IfcCommunicationsApplianceType_CorrectPredefinedType,
	IfcComplexProperty_WR21,
	IfcComplexProperty_WR22,
	IfcComplexPropertyTemplate_NoSelfReference,
	IfcComplexPropertyTemplate_UniquePropertyNames,
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
	IfcConveyorSegment_CorrectPredefinedType,
	IfcConveyorSegment_CorrectTypeAssigned,
	IfcConveyorSegmentType_CorrectPredefinedType,
	IfcCooledBeam_CorrectPredefinedType,
	IfcCooledBeam_CorrectTypeAssigned,
	IfcCooledBeamType_CorrectPredefinedType,
	IfcCoolingTower_CorrectPredefinedType,
	IfcCoolingTower_CorrectTypeAssigned,
	IfcCoolingTowerType_CorrectPredefinedType,
	IfcCoordinateReferenceSystem_NameOrWKT,
	IfcCourse_CorrectPredefinedType,
	IfcCourse_CorrectTypeAssigned,
	IfcCourseType_CorrectPredefinedType,
	IfcCovering_CorrectPredefinedType,
	IfcCovering_CorrectTypeAssigned,
	IfcCoveringType_CorrectPredefinedType,
	IfcCrewResource_CorrectPredefinedType,
	IfcCrewResourceType_CorrectPredefinedType,
	IfcCurtainWall_CorrectPredefinedType,
	IfcCurtainWall_CorrectTypeAssigned,
	IfcCurtainWallType_CorrectPredefinedType,
	IfcCurveStyle_IdentifiableCurveStyle,
	IfcCurveStyle_MeasureOfWidth,
	IfcCurveStyleFontPattern_VisibleLengthGreaterEqualZero,
	IfcDamper_CorrectPredefinedType,
	IfcDamper_CorrectTypeAssigned,
	IfcDamperType_CorrectPredefinedType,
	IfcDeepFoundation_CorrectTypeAssigned,
	IfcDerivedProfileDef_InvariantProfileType,
	IfcDerivedUnit_WR1,
]);

// =============================================================================
// Phase EX-4, IFC4X3_ADD2 chunk 3 (planning/ifcopenshell-ts/70-express-rules-plan.md,
// "the large chunk" -- WHERE-rule classes + `rule_executor.py`): the NEXT 120
// `SCOPE = 'entity'` rules, continuing directly from chunk 2's own last-ported rule with
// zero gap or overlap -- `IfcDerivedUnit_WR2` (real source line 7431) through
// `IfcGeometricRepresentationContext_North2D` (line 8633) in `src/ifcopenshell-python/
// ifcopenshell/express/rules/IFC4X3_ADD2.py`. **Independently re-verified, not trusted
// from the dispatching task brief's own citation alone**: re-ran the same `^class (\w+)`
// + `SCOPE = '(\w+)'`-matching script chunks 1/2's own header comments describe,
// confirmed exactly 120 `SCOPE = 'entity'` classes in this range, all 120 with no
// gap/overlap against chunk 2's own last rule (`IfcDerivedUnit_WR1`, line 7421) or chunk
// 4's first rule (`IfcGeometricRepresentationSubContext_NoCoordOperation`, line 8643,
// confirmed excluded). IFC4X3_ADD2 now stands at 340 of 779 total WHERE-rule classes (220
// from chunks 1-2 + this chunk's own 120), 315/752 of its own entity-scope rules.
//
// =============================================================================
// This chunk's own central finding: exhaustive diffing (not sampling) of all 120 rules
// against IFC4's real source, using the same dedicated diff script as chunks 1/2 (a
// Python script comparing bodies character-for-character after normalizing the schema
// prefix, extracting each class's own body up to its first unindented line so a trailing
// `calc_*` DERIVE function interleaved before the next class is never accidentally
// included -- chunk 2's own already-disclosed fix, reused verbatim here, not
// re-discovered)
// =============================================================================
//
// Every one of this chunk's 120 target rule NAMES was cross-checked against `IFC4.py`'s
// own real source directly:
//
// - **101 of the 120 rules exist in `IFC4.py` under the exact same class name, and their
//   real compiled bodies are BYTE-IDENTICAL once the schema-namespace string embedded in
//   every `typeof(...)`/membership check is normalized (`'ifc4.ifcxxx'` ->
//   `'ifc4x3_add2.ifcxxx'`)** -- confirmed by the same dedicated diff script chunks 1/2
//   used, comparing every one of the 101 real class bodies character-for-character after
//   that one substitution. Each of these 101 rules' already-ported IFC4 TS implementation
//   (`whereRules/ifc4.ts`) was located by its own exact variable name and reused as a
//   fresh local copy below (schema-prefix string substituted, message text otherwise
//   unchanged) -- not retranslated from Python by hand, since the underlying logic is
//   provably identical.
// - **3 of the 120 rules exist in `IFC4.py` under the exact same class name, but their real
//   bodies genuinely DIFFER beyond the schema-prefix substitution** -- each investigated
//   individually, both explained by 2 real schema-evolution findings, not independent bugs:
//   - **`IfcDoorLiningProperties_WR35`** and **`IfcDoorPanelProperties_ApplicableToType`**:
//     IFC4's own versions (lines 6829/6912) check `DefinesType[1]` is an `IfcDoorType` OR an
//     `IfcDoorStyle`; ADD2's real bodies only check `IfcDoorType`, the `IfcDoorStyle` branch
//     entirely gone. Direct consequence of `IfcDoorStyle`'s own genuine removal from the
//     schema (see the vanished-entity finding below), not an independent divergence. Ported
//     via a new ADD2-specific `definesTypeIsDoorType` helper (see its own doc comment) --
//     the single-branch sibling of `whereRules/ifc4.ts`'s own `definesTypeIsDoorTypeOrStyle`.
//   - **`IfcFurnitureType_CorrectPredefinedType`**: IFC4's own version (line 7647) uses the
//     mandatory "*Type" shape (no leading `exists` guard on `PredefinedType`); ADD2's real
//     body adds a leading `not exists(predefinedtype) or`, meaning
//     `IfcFurnitureType.PredefinedType` became OPTIONAL in ADD2 (was mandatory in IFC4) --
//     a genuine schema-evolution finding, not a new shape: this file's own
//     `correctPredefinedType(self, escapeAttrName, predefinedTypeOptional)` helper already
//     parameterizes both independently (established chunk 1), so this needed only
//     `predefinedTypeOptional = true` with the usual `"ElementType"` escape attribute -- the
//     first occurrence across all 3 schemas' own already-ported chunks of a "*Type" entity
//     with an optional PredefinedType.
// - **16 of the 120 rules have NO `IFC4.py` class of the exact same name** -- each
//   investigated individually, not assumed genuinely new from the name-mismatch alone:
//   - **12 are ordinary `_CorrectPredefinedType`/`_CorrectTypeAssigned` rules on entities
//     that are themselves wholly new in IFC4X3_ADD2** (confirmed via `grep` for each
//     entity's own convenience-constructor wrapper, `def IfcXxx(*args, **kwargs)`, across
//     all of `IFC4.py` -- zero matches for any of them): `IfcDirectrixCurveSweptAreaSolid`
//     (an alignment/infrastructure swept-solid supertype, 1 rule), `IfcDistributionBoard`/
//     `IfcDistributionBoardType` (a distribution-board flow controller, 3 rules),
//     `IfcEarthworksCut`/`IfcEarthworksFill` (infrastructure earthworks elements, 1 rule
//     each), `IfcElectricFlowTreatmentDevice`/`IfcElectricFlowTreatmentDeviceType` (3
//     rules), `IfcFacilityPartCommon` (an infrastructure facility-part supertype, 1 rule),
//     `IfcGeographicCRS` (a geographic coordinate-reference-system entity, 2 rules, its own
//     bespoke shape -- see below) -- every "occurrence"/"*Type" one of these reuses this
//     file's own already-ported `correctPredefinedType`/`correctTypeAssigned` helpers
//     directly, same as chunks 1/2's own analogous new-entity findings.
//   - **1 is a new RULE on a pre-existing IFC4 entity, not a new entity**:
//     `IfcDistributionSystem_CorrectPredefinedType` -- `IfcDistributionSystem` itself
//     already exists in `IFC4.py` (confirmed via its own convenience-constructor wrapper,
//     real source line 2555) but carries no WHERE-rule there at all; ADD2 adds this one.
//   - **1 is a new RULE on a pre-existing IFC4 entity, genuinely bespoke shape**:
//     `IfcFeatureElement_NotContained` -- `IfcFeatureElement` itself already exists in
//     `IFC4.py` (real source line 2786, only its own subtype `IfcFeatureElementSubtraction`
//     had rules there); ADD2 adds this one directly on the supertype. Its own body
//     (`sizeof(ContainedInStructure) == 0`) is exactly `attrSizeIsZero`'s own shape --
//     reused, not bespoke code, just a bespoke (new) call site.
//   - **1 is a new RULE on a pre-existing IFC4 entity, PLUS an entity gaining a rule for
//     the first time**: `IfcDoor_CorrectPredefinedType` -- `IfcDoor` is a long-established
//     entity, but IFC4's own version only ever had a single WHERE-rule (see the rename
//     finding immediately below); ADD2 adds this PredefinedType check as a brand-new
//     second rule.
//   - **1 is a genuine RULE-NAME rename, not a new shape**: `IfcDoor_CorrectTypeAssigned`
//     is byte-identical (modulo schema prefix) to IFC4's own `IfcDoor_
//     CorrectStyleAssigned` (real IFC4.py line 6509, confirmed directly) -- ADD2 renamed
//     the rule to match every other entity's own `_CorrectTypeAssigned` naming convention
//     (`IfcDoor` was seemingly the one holdout in IFC4 still using the older "Style" name).
//     Reused as a fresh local copy of IFC4's own already-ported TS implementation, renamed
//     to its real ADD2 `RULE_NAME`. Same disclosed shape as chunk 2's own analogous
//     `IfcBuildingElement` -> `IfcBuiltElement` ENTITY rename finding, just at the
//     rule-name level instead of the entity-name level.
// - **A THIRD genuinely-vanished-entity finding, of the exact same shape as chunk 1's own
//   `IfcBeamStandardCase_HasMaterialProfileSetUsage` and chunk 2's own
//   `IfcColumnStandardCase` disclosures**: `IfcDoorStyle` (real IFC4.py line 2579's own
//   convenience-constructor wrapper) has **zero matches anywhere in real `IFC4X3_ADD2.py`
//   at all** -- confirmed via `grep -c "IfcDoorStyle"` returning `0` against the whole real
//   file (not merely this chunk's own 120-rule slice), an even more complete removal than
//   chunk 2's own `IfcColumnStandardCase` finding (that one still needed a targeted
//   `class`/`def` grep; `IfcDoorStyle` has no textual trace whatsoever, including as a
//   membership-check string literal). Explains both of this chunk's own "different" rules
//   above (the vanished `IfcDoorStyle` OR-branch).
// - **Zero rules found with a genuine subtle divergence beyond the 2 schema-evolution
//   findings and 1 rule-name rename above** -- every other identically-named rule is
//   byte-identical modulo the schema-prefix substitution, re-confirming chunks 1/2's own
//   "central finding" continues to hold for the overwhelming majority of this chunk's own
//   range too (not assumed to hold for future chunks).
//
// =============================================================================
// No real upstream Python bugs found in this chunk's own 120 rules
// =============================================================================
//
// Every rule in this chunk was read directly against its own real source body (not assumed
// from name/shape alone); none exhibit chunk 1's own `IfcAdvancedBrepWithVoids_
// VoidsHaveAdvancedFaces`-style inverted logic or any other confirmed defect. The 3
// "different" rules and the rule-name rename above are disclosed schema-evolution
// findings, not logic bugs -- each real body is internally consistent and behaves exactly
// as its own real source dictates.
//
// =============================================================================
// Shared helper shapes reused from `whereRules/ifc4.ts` as fresh local copies (all
// already-established reference shapes there, per this project's own "verify against an
// existing shape before writing a local copy" policy -- not new discoveries), plus 1
// genuinely new ADD2-specific helper
// =============================================================================
//
// `correctPredefinedType`/`correctTypeAssigned` (already established chunk 1, no new
// logic): 60/27 occurrences respectively in this chunk (`correctPredefinedType`'s own 60
// splits as 32 `"ObjectType"` + 26 `"ElementType"` (mandatory) + 1 `"ProcessType"`
// (mandatory, `IfcEventType` -- a new escape-attribute name, consistent with process-type
// entities using a process-shaped escape attribute instead of `"ElementType"`) + 1
// `"ElementType"` (OPTIONAL, `IfcFurnitureType`'s own schema-evolution finding above)).
//
// **`asList`** (4 occurrences: `IfcFace_HasOuterBound`'s own `Bounds`,
// `IfcFillAreaStyle_MaxOneColour`/`MaxOneExtHatchStyle`'s own `FillStyles`,
// `IfcGeometricCurveSet_NoSurfaces`'s own `Elements`).
//
// **`userDefinedOrHasAttribute`/`optionalUserDefinedOrHasAttribute`** (already established
// chunk 1): 2/1 occurrences (`IfcDerivedUnit_WR2`/`IfcEventType_
// CorrectEventTriggerType`'s own `UnitType`/`EventTriggerType`, and `IfcEvent_
// CorrectTypeAssigned`'s own optional `EventTriggerType` -- a real, RECONFIRMED (not new)
// name/shape mismatch: despite its own `_CorrectTypeAssigned` name, `IfcEvent_
// CorrectTypeAssigned`'s real body is the `userDefinedOrHasAttribute` shape, not
// `correctTypeAssigned` -- already disclosed for this identical rule name by
// `whereRules/ifc4.ts`'s own chunk 3 (real IFC4.py line 7041), independently reconfirmed
// present in IFC4X3_ADD2's own real source too, byte-identical modulo schema prefix, part
// of this chunk's own 101-rule byte-identical set).
//
// **`impliesExists`** (2 occurrences: `IfcDoorLiningProperties_WR31`/`WR32`).
//
// **`attrSizeIsZero`** (3 occurrences, crossing this file's own 3-occurrence factoring
// threshold: `IfcFeatureElementSubtraction_HasNoSubtraction`/`IsNotFilling`'s own
// `HasOpenings`/`FillsVoids`, plus `IfcFeatureElement_NotContained`'s own new
// `ContainedInStructure` call site above).
//
// **`optionalAttrDimEquals`** (already established chunk 1): 2 more occurrences
// (`IfcFillAreaStyleHatching_PatternStart2D`/`RefHatchLine2D`).
//
// **4 new rule-file-local EXPRESS-library helpers** (real functions from `IFC4X3_ADD2.py`'s
// own shared-helper section, none a WHERE-rule class or a `calc_*` DERIVE function, each
// independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own version via direct `diff`, each
// ported with a full doc comment citing its own real ADD2 source line): `ifcLoopHeadToTail`
// (line 13662, `IfcEdgeLoop_IsContinuous`'s only caller), `ifcCorrectFillAreaStyle` (line
// 13405, byte-identical shape to `whereRules/ifc4.ts`'s own already-ported version --
// including that file's own already-disclosed `IfcColour`-is-a-SELECT-type dead-code
// finding, reconfirmed present in ADD2 too), `ifcTaperedSweptAreaProfiles` (line 13922),
// and `ifcUniqueQuantityNames` (line 13990 -- a thin wrapper reusing chunk 2's own
// `uniquePropertyLikeNames`, matching that helper's own "one thin wrapper per real function
// name" precedent).
//
// **`optionalAttrUnitTypeEquals`/`directrixIsBoundedOrHasParams`**: fresh local copies of
// `whereRules/ifc4.ts`'s own already-established shapes (2 and 1 occurrences respectively
// in this chunk -- reused shapes, not new discoveries, even though below the 3-occurrence
// bar on their own in this file, matching this file's own "verify against an existing
// shape" policy rather than the "new helper" 3-occurrence threshold, which only applies to
// shapes with no prior established home).
//
// **One new shared helper established this chunk**: `definesTypeIsDoorType` (2
// occurrences: `IfcDoorLiningProperties_WR35`, `IfcDoorPanelProperties_ApplicableToType`) --
// the ADD2-specific, single-branch sibling of `whereRules/ifc4.ts`'s own
// `definesTypeIsDoorTypeOrStyle`, needed because `IfcDoorStyle` was genuinely removed from
// the schema (see the vanished-entity finding above). Factored at 2 occurrences (not
// waiting for a 3rd), matching `definesTypeIsDoorTypeOrStyle`'s own identical 2-occurrence
// factoring precedent in `whereRules/ifc4.ts` for these same 2 rule names.
//
// **`ifcDirection`/`ifcDotProduct`** (`rules/ifc4x3.ts`, both newly `export`ed this chunk,
// alongside the already-exported `ifcCrossProduct`) -- 1 call site each
// (`IfcExtrudedAreaSolid_ValidExtrusionDirection`), exactly mirroring `rules/ifc4.ts`'s own
// identical `ifcDirection`/`ifcDotProduct` export precedent for `whereRules/ifc4.ts`.
// `hiIndex` (1 occurrence, `IfcGeometricRepresentationContext_North2D`) and `expressRange`
// (consumed by `ifcLoopHeadToTail` above) are plain `runtimeShim` imports, newly imported
// into this file in this chunk (not previously needed by chunks 1-2's own 220 rules).
//
// **8 rules got genuinely bespoke bodies (fully inline, no shared helper at all) --
// byte-identical to `IFC4.py`'s own equally bespoke versions**: `IfcDirection_
// MagnitudeGreaterZero`, `IfcDocumentReference_WR1`, `IfcDoorLiningProperties_WR33`/`WR34`,
// `IfcDraughtingPreDefinedColour_PreDefinedColourNames`,
// `IfcDraughtingPreDefinedCurveFont_PreDefinedCurveFontNames`, `IfcEdgeLoop_IsClosed`,
// `IfcExternalReference_WR1`.
//
// =============================================================================
// Registration-helper duplication -- see chunk 1's own header comment; no new disclosure
// needed here.
// =============================================================================

/**
 * Shared shape (4 occurrences in this chunk: `IfcFace_HasOuterBound`'s own `Bounds`,
 * `IfcFillAreaStyle_MaxOneColour`/`MaxOneExtHatchStyle`'s own `FillStyles`,
 * `IfcGeometricCurveSet_NoSurfaces`'s own `Elements`) -- an aggregate attribute read that
 * must degrade to an empty array rather than propagate `INDETERMINATE` into a `.filter()`
 * call. Fresh local copy of `whereRules/ifc4.ts`'s own already-established `asList` (that
 * file's own header comment already justifies this file family's "no cross-schema-file
 * dependency" precedent).
 */
function asList<T = EntityInstance>(value: unknown): T[] {
	return isIndeterminate(value) ? [] : (value as T[]);
}

/**
 * Shared shape (2 occurrences: `IfcDoorLiningProperties_WR31`'s own
 * `LiningDepth`/`LiningThickness`, `WR32`'s own `ThresholdDepth`/`ThresholdThickness`) --
 * Python: `not (exists(A) and not exists(B))` / `not (not exists(A) and exists(B))`, both
 * reducible to "if A is given, B must be given too". Fresh local copy of
 * `whereRules/ifc4.ts`'s own already-established `impliesExists` (reuses this file's own
 * already-established `attrExists`, from chunk 2).
 */
function impliesExists(self: EntityInstance, condAttrName: string, requiredAttrName: string): boolean {
	return !attrExists(self, condAttrName) || attrExists(self, requiredAttrName);
}

/**
 * Shared shape (3 occurrences: `IfcFeatureElementSubtraction_HasNoSubtraction`'s own
 * `HasOpenings`, `IfcFeatureElementSubtraction_IsNotFilling`'s own `FillsVoids`,
 * `IfcFeatureElement_NotContained`'s own `ContainedInStructure`) -- Python: `sizeof(X) ==
 * 0`, `X` a mandatory (never `exists`-guarded) inverse SET attribute that must be empty.
 * Crosses this file's own 3-occurrence factoring threshold. Fresh local copy of
 * `whereRules/ifc4.ts`'s own already-established `attrSizeIsZero`.
 */
function attrSizeIsZero(self: EntityInstance, attrName: string): Tri {
	return triEq(sizeof(expressGetAttr(self, attrName, INDETERMINATE)), 0);
}

/**
 * Python: `IfcLoopHeadToTail(aloop)` (real `IFC4X3_ADD2.py` source line 13662,
 * independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own version at line 11855 via
 * direct `diff`). `IfcEdgeLoop_IsContinuous`'s only caller in this chunk. `p = p and
 * (...)` is Python's own short-circuit chain -- ported via `pyAnd`'s own lazy-thunk
 * semantics. Fresh local copy of `whereRules/ifc4.ts`'s own already-established
 * `ifcLoopHeadToTail`.
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
 * Python: `IfcCorrectFillAreaStyle(styles)` (real `IFC4X3_ADD2.py` source line 13405,
 * independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own version at line 11588 via
 * direct `diff`, including that file's own already-disclosed dead-code finding: `IfcColour`
 * is a real `select_type` in this schema too, so `typeOf()` never matches it and `colour`
 * is always `0` -- ported faithfully, not "fixed"). Fresh local copy of
 * `whereRules/ifc4.ts`'s own already-established `ifcCorrectFillAreaStyle`.
 */
function ifcCorrectFillAreaStyle(styles: unknown): boolean {
	const items = asList(styles);
	const external = items.filter((style) => typeOfAttr(style).has("ifc4x3_add2.ifcexternallydefinedhatchstyle")).length;
	const hatching = items.filter((style) => typeOfAttr(style).has("ifc4x3_add2.ifcfillareastylehatching")).length;
	const tiles = items.filter((style) => typeOfAttr(style).has("ifc4x3_add2.ifcfillareastyletiles")).length;
	const colour = items.filter((style) => typeOfAttr(style).has("ifc4x3_add2.ifccolour")).length;
	if (external > 1) return false;
	if (external === 1 && (hatching > 0 || tiles > 0 || colour > 0)) return false;
	if (colour > 1) return false;
	if (hatching > 0 && tiles > 0) return false;
	return true;
}

/**
 * Python: `IfcTaperedSweptAreaProfiles(startarea, endarea)` (real `IFC4X3_ADD2.py`
 * source line 13922, independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own version at
 * line 12093 via direct `diff`). `typeof(startarea) == typeof(endarea)` is genuine
 * `express_set` structural equality (`ExpressSet.equals()`), not a bare `===`. Fresh
 * local copy of `whereRules/ifc4.ts`'s own already-established `ifcTaperedSweptAreaProfiles`.
 */
function ifcTaperedSweptAreaProfiles(startArea: unknown, endArea: unknown): Tri {
	if (typeOfAttr(startArea).has("ifc4x3_add2.ifcparameterizedprofiledef")) {
		if (typeOfAttr(endArea).has("ifc4x3_add2.ifcderivedprofiledef")) {
			return triEq(startArea, expressGetAttr(endArea, "ParentProfile", INDETERMINATE));
		}
		return typeOfAttr(startArea).equals(typeOfAttr(endArea));
	}
	if (typeOfAttr(endArea).has("ifc4x3_add2.ifcderivedprofiledef")) {
		return triEq(startArea, expressGetAttr(endArea, "ParentProfile", INDETERMINATE));
	}
	return false;
}

/**
 * Python: `IfcUniqueQuantityNames(properties)` (real `IFC4X3_ADD2.py` source line 13990,
 * independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own version at line 12161 via
 * direct `diff`) -- a third real, distinct top-level Python function with the same
 * byte-identical body as `IfcUniquePropertyName`/`IfcUniquePropertyTemplateNames` (chunk
 * 2's own `uniquePropertyLikeNames`): build an `express_set` union of every member's own
 * `Name`, then check that set's size equals the list's own length. Reuses chunk 2's own
 * `uniquePropertyLikeNames` via its own thin, real-named wrapper, exactly matching that
 * chunk's own "each real Python function gets its own thin wrapper for literal fidelity"
 * precedent.
 */
function ifcUniqueQuantityNames(quantities: unknown): boolean {
	return uniquePropertyLikeNames(quantities);
}

/**
 * Shared shape (2 occurrences, both on the new `IfcGeographicCRS` entity:
 * `AngleUnitIsPlaneAngle`'s own `AngleUnit`/`"PLANEANGLEUNIT"`, `HeightUnitIsLength`'s own
 * `HeightUnit`/`"LENGTHUNIT"`) -- Python: `not exists(X) or X.UnitType ==
 * <IfcUnitEnum member>`. Fresh local copy of `whereRules/ifc4.ts`'s own already-established
 * `optionalAttrUnitTypeEquals` (that file's own chunk 3 header comment already covers this
 * shape's own provenance and the `IfcProjectedCRS_IsLengthUnit` generalization finding
 * that produced it).
 */
function optionalAttrUnitTypeEquals(self: EntityInstance, attrName: string, expectedUnitType: string): Tri {
	const unit = expressGetAttr(self, attrName, INDETERMINATE);
	return pyOr(!exists(unit), () => triEq(expressGetAttr(unit, "UnitType", INDETERMINATE), expectedUnitType));
}

/**
 * Shared shape (1 occurrence this chunk: `IfcDirectrixCurveSweptAreaSolid_
 * DirectrixBounded`) -- Python: `(exists(StartParam) and exists(EndParam)) or
 * sizeof(['ifc4x3_add2.ifcconic', 'ifc4x3_add2.ifcboundedcurve'] * typeof(Directrix)) ==
 * 1`. Fresh local copy of `whereRules/ifc4.ts`'s own already-established
 * `directrixIsBoundedOrHasParams` -- only 1 call site in this chunk (the entity's own
 * `DirectrixBounded` rule is its only WHERE-rule in this chunk's range), but it's an
 * already-established shape reused fresh, not a new discovery, per this file's own
 * "verify against an existing shape before writing a local copy" policy.
 */
function directrixIsBoundedOrHasParams(self: EntityInstance): Tri {
	const directrix = expressGetAttr(self, "Directrix", INDETERMINATE);
	const startParam = expressGetAttr(self, "StartParam", INDETERMINATE);
	const endParam = expressGetAttr(self, "EndParam", INDETERMINATE);
	return pyOr(
		pyAnd(exists(startParam), () => exists(endParam)),
		() => triEq(typeOfAttr(directrix).multiply(["ifc4x3_add2.ifcconic", "ifc4x3_add2.ifcboundedcurve"]).size, 1),
	);
}

/**
 * New shared shape this chunk (2 occurrences, byte-identical real bodies:
 * `IfcDoorLiningProperties_WR35`, `IfcDoorPanelProperties_ApplicableToType`) -- Python:
 * `exists(lambda: express_getitem(DefinesType, 0, INDETERMINATE)) and
 * 'ifc4x3_add2.ifcdoortype' in typeof(...)`. **The ADD2-specific, single-branch sibling of
 * `whereRules/ifc4.ts`'s own `definesTypeIsDoorTypeOrStyle`** -- IFC4's own version also
 * ORs in an `IfcDoorStyle` branch, but `IfcDoorStyle` was genuinely removed from the
 * schema in ADD2 (see this file's own header comment's "vanished entity" finding), so
 * that branch is gone from both real call sites here. Factored at 2 occurrences (not
 * waiting for a 3rd), matching `definesTypeIsDoorTypeOrStyle`'s own identical
 * 2-occurrence factoring precedent in `whereRules/ifc4.ts` for these same 2 rule names.
 * `DefinesType[0]` is re-evaluated multiple times in the real generated body (never
 * cached) -- ported the same way (`first()` called multiple times) for literal fidelity.
 */
function definesTypeIsDoorType(self: EntityInstance): boolean {
	const first = () =>
		expressGetItem(expressGetAttr(self, "DefinesType", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	return exists(first) && typeOfAttr(first()).has("ifc4x3_add2.ifcdoortype");
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 7431-8642, this chunk's own 120).
// =============================================================================

// `IfcDerivedUnit_WR2` (ADD2 line 7431) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDerivedUnit_WR2 = entityRule("IfcDerivedUnit", "WR2", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "UnitType", "UserDefinedType"),
		"IfcDerivedUnit: if UnitType is USERDEFINED, UserDefinedType must be given.",
	);
});

// `IfcDirection_MagnitudeGreaterZero` (ADD2 line 7445) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDirection_MagnitudeGreaterZero = entityRule("IfcDirection", "MagnitudeGreaterZero", (self) => {
	const directionRatios = expressGetAttr(self, "DirectionRatios", INDETERMINATE);
	const items = isIndeterminate(directionRatios) ? [] : (directionRatios as number[]);
	const nonZeroCount = items.filter((tmp) => tmp !== 0.0).length;
	assertWhereRule(nonZeroCount > 0, "IfcDirection.DirectionRatios must have at least one non-zero component.");
});

// `IfcDirectrixCurveSweptAreaSolid_DirectrixBounded` (ADD2 line 7459) -- byte-identical
// to IFC4.py's own version (modulo schema prefix); fresh local copy of
// `whereRules/ifc4.ts`'s own already-established `directrixIsBoundedOrHasParams` shape.
const IfcDirectrixCurveSweptAreaSolid_DirectrixBounded = entityRule(
	"IfcDirectrixCurveSweptAreaSolid",
	"DirectrixBounded",
	(self) => {
		assertWhereRule(
			directrixIsBoundedOrHasParams(self),
			"IfcDirectrixCurveSweptAreaSolid: StartParam and EndParam must both be given, or Directrix must be exactly one of IfcConic/IfcBoundedCurve.",
		);
	},
);

// `IfcDiscreteAccessory_CorrectPredefinedType` (ADD2 line 7471) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDiscreteAccessory_CorrectTypeAssigned` (ADD2 line 7481) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDiscreteAccessory_CorrectTypeAssigned = entityRule("IfcDiscreteAccessory", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDiscreteAccessoryType"),
		"IfcDiscreteAccessory: if IsTypedBy is given, its RelatingType must be an IfcDiscreteAccessoryType.",
	);
});

// `IfcDiscreteAccessoryType_CorrectPredefinedType` (ADD2 line 7491) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDistributionBoard_CorrectPredefinedType` (line 7501). `IfcDistributionBoard` is
// wholly new in IFC4X3_ADD2 (a distribution-board flow-controller element, no IFC4
// counterpart -- confirmed via `grep` for its own convenience-constructor wrapper across
// all of `IFC4.py`, zero matches), standard "occurrence" shape.
const IfcDistributionBoard_CorrectPredefinedType = entityRule(
	"IfcDistributionBoard",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcDistributionBoard: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcDistributionBoard_CorrectTypeAssigned` (line 7511). New entity, standard
// `_CorrectTypeAssigned` shape.
const IfcDistributionBoard_CorrectTypeAssigned = entityRule("IfcDistributionBoard", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDistributionBoardType"),
		"IfcDistributionBoard: if IsTypedBy is given, its RelatingType must be an IfcDistributionBoardType.",
	);
});

// `IfcDistributionBoardType_CorrectPredefinedType` (line 7521). New entity, standard
// "*Type" (mandatory PredefinedType) shape.
const IfcDistributionBoardType_CorrectPredefinedType = entityRule(
	"IfcDistributionBoardType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcDistributionBoardType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcDistributionChamberElement_CorrectPredefinedType` (ADD2 line 7531) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDistributionChamberElement_CorrectTypeAssigned` (ADD2 line 7541) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDistributionChamberElementType_CorrectPredefinedType` (ADD2 line 7551) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDistributionSystem_CorrectPredefinedType` (line 7561). **A new RULE on a
// pre-existing IFC4 entity, not a new entity**: `IfcDistributionSystem` itself already
// exists in `IFC4.py` (convenience-constructor wrapper confirmed, real source line 2555)
// but carries no WHERE-rule there at all; ADD2 adds this one. Standard "occurrence" shape.
const IfcDistributionSystem_CorrectPredefinedType = entityRule(
	"IfcDistributionSystem",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcDistributionSystem: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcDocumentReference_WR1` (ADD2 line 7571) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDocumentReference_WR1 = entityRule("IfcDocumentReference", "WR1", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	const referencedDocument = expressGetAttr(self, "ReferencedDocument", INDETERMINATE);
	assertWhereRule(
		exists(name) !== exists(referencedDocument),
		"IfcDocumentReference: exactly one of Name or ReferencedDocument must be given.",
	);
});

// `IfcDoor_CorrectPredefinedType` (line 7582). **Genuinely new rule** -- `IfcDoor` itself
// is a long-established IFC4 entity, but IFC4's own `IfcDoor` carries only a single
// WHERE-rule (`IfcDoor_CorrectStyleAssigned`, see `IfcDoor_CorrectTypeAssigned` below);
// ADD2 adds this PredefinedType check as a brand-new second rule. Standard "occurrence"
// shape.
const IfcDoor_CorrectPredefinedType = entityRule("IfcDoor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDoor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDoor_CorrectTypeAssigned` (line 7592). **A genuine RULE-NAME rename, not a new
// shape**: byte-identical (modulo schema prefix) to IFC4's own `IfcDoor_
// CorrectStyleAssigned` (real IFC4.py line 6509, confirmed directly) -- same
// `correctTypeAssigned` call shape, ADD2 just renamed the rule from
// `CorrectStyleAssigned` to `CorrectTypeAssigned` (consistent with every other entity's
// own naming convention in this file family; `IfcDoor` was seemingly the one holdout in
// IFC4 that used the older "Style" name). Reused as a fresh local copy of IFC4's own
// already-ported TS implementation, renamed to its real ADD2 `RULE_NAME`.
const IfcDoor_CorrectTypeAssigned = entityRule("IfcDoor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDoorType"),
		"IfcDoor: if IsTypedBy is given, its RelatingType must be an IfcDoorType.",
	);
});

// `IfcDoorLiningProperties_WR31` (ADD2 line 7602) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDoorLiningProperties_WR31 = entityRule("IfcDoorLiningProperties", "WR31", (self) => {
	assertWhereRule(
		impliesExists(self, "LiningDepth", "LiningThickness"),
		"IfcDoorLiningProperties: if LiningDepth is given, LiningThickness must be given.",
	);
});

// `IfcDoorLiningProperties_WR32` (ADD2 line 7613) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDoorLiningProperties_WR32 = entityRule("IfcDoorLiningProperties", "WR32", (self) => {
	assertWhereRule(
		impliesExists(self, "ThresholdDepth", "ThresholdThickness"),
		"IfcDoorLiningProperties: if ThresholdDepth is given, ThresholdThickness must be given.",
	);
});

// `IfcDoorLiningProperties_WR33` (ADD2 line 7624) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDoorLiningProperties_WR33 = entityRule("IfcDoorLiningProperties", "WR33", (self) => {
	const transomOffset = expressGetAttr(self, "TransomOffset", INDETERMINATE);
	const transomThickness = expressGetAttr(self, "TransomThickness", INDETERMINATE);
	assertWhereRule(
		exists(transomOffset) === exists(transomThickness),
		"IfcDoorLiningProperties: TransomOffset and TransomThickness must either both be given or both be omitted.",
	);
});

// `IfcDoorLiningProperties_WR34` (ADD2 line 7635) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDoorLiningProperties_WR34 = entityRule("IfcDoorLiningProperties", "WR34", (self) => {
	const casingDepth = expressGetAttr(self, "CasingDepth", INDETERMINATE);
	const casingThickness = expressGetAttr(self, "CasingThickness", INDETERMINATE);
	assertWhereRule(
		exists(casingDepth) === exists(casingThickness),
		"IfcDoorLiningProperties: CasingDepth and CasingThickness must either both be given or both be omitted.",
	);
});

// `IfcDoorLiningProperties_WR35` (ADD2 line 7646). **One of this chunk's 2 real
// divergences from IFC4.py beyond the schema-prefix rename**: IFC4's own version (line
// 6829) checks `DefinesType[0]` is an `IfcDoorType` OR an `IfcDoorStyle` -- ADD2's real
// body only checks `IfcDoorType`, the `IfcDoorStyle` branch entirely removed. Direct
// consequence of `IfcDoorStyle`'s own genuine removal from the schema (see this file's
// own header comment's "vanished entity" finding) -- not an independent divergence.
// Uses this chunk's own new `definesTypeIsDoorType` helper, the ADD2-specific
// single-branch sibling of `whereRules/ifc4.ts`'s own `definesTypeIsDoorTypeOrStyle`.
const IfcDoorLiningProperties_WR35 = entityRule("IfcDoorLiningProperties", "WR35", (self) => {
	assertWhereRule(definesTypeIsDoorType(self), "IfcDoorLiningProperties: DefinesType[1] must be an IfcDoorType.");
});

// `IfcDoorPanelProperties_ApplicableToType` (ADD2 line 7655). Same real divergence as
// `IfcDoorLiningProperties_WR35` immediately above (IFC4.py line 6912 also allows
// `IfcDoorStyle`, ADD2 does not) -- same `definesTypeIsDoorType` helper, second and last
// occurrence in this chunk.
const IfcDoorPanelProperties_ApplicableToType = entityRule("IfcDoorPanelProperties", "ApplicableToType", (self) => {
	assertWhereRule(definesTypeIsDoorType(self), "IfcDoorPanelProperties: DefinesType[1] must be an IfcDoorType.");
});

// `IfcDoorType_CorrectPredefinedType` (ADD2 line 7664) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDoorType_CorrectPredefinedType = entityRule("IfcDoorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDoorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDraughtingPreDefinedColour_PreDefinedColourNames` (ADD2 line 7674) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDraughtingPreDefinedCurveFont_PreDefinedCurveFontNames` (ADD2 line 7683) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcDuctFitting_CorrectPredefinedType` (ADD2 line 7692) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctFitting_CorrectPredefinedType = entityRule("IfcDuctFitting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDuctFitting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDuctFitting_CorrectTypeAssigned` (ADD2 line 7702) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctFitting_CorrectTypeAssigned = entityRule("IfcDuctFitting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDuctFittingType"),
		"IfcDuctFitting: if IsTypedBy is given, its RelatingType must be an IfcDuctFittingType.",
	);
});

// `IfcDuctFittingType_CorrectPredefinedType` (ADD2 line 7712) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctFittingType_CorrectPredefinedType = entityRule("IfcDuctFittingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDuctFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDuctSegment_CorrectPredefinedType` (ADD2 line 7722) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctSegment_CorrectPredefinedType = entityRule("IfcDuctSegment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDuctSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDuctSegment_CorrectTypeAssigned` (ADD2 line 7732) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctSegment_CorrectTypeAssigned = entityRule("IfcDuctSegment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDuctSegmentType"),
		"IfcDuctSegment: if IsTypedBy is given, its RelatingType must be an IfcDuctSegmentType.",
	);
});

// `IfcDuctSegmentType_CorrectPredefinedType` (ADD2 line 7742) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctSegmentType_CorrectPredefinedType = entityRule("IfcDuctSegmentType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDuctSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDuctSilencer_CorrectPredefinedType` (ADD2 line 7752) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctSilencer_CorrectPredefinedType = entityRule("IfcDuctSilencer", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcDuctSilencer: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcDuctSilencer_CorrectTypeAssigned` (ADD2 line 7762) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctSilencer_CorrectTypeAssigned = entityRule("IfcDuctSilencer", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcDuctSilencerType"),
		"IfcDuctSilencer: if IsTypedBy is given, its RelatingType must be an IfcDuctSilencerType.",
	);
});

// `IfcDuctSilencerType_CorrectPredefinedType` (ADD2 line 7772) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcDuctSilencerType_CorrectPredefinedType = entityRule("IfcDuctSilencerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcDuctSilencerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEarthworksCut_CorrectPredefinedType` (line 7782). `IfcEarthworksCut` is wholly new
// in IFC4X3_ADD2 (an infrastructure earthworks-cut element, no IFC4 counterpart --
// confirmed via `grep`, zero matches), standard "occurrence" shape.
const IfcEarthworksCut_CorrectPredefinedType = entityRule("IfcEarthworksCut", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEarthworksCut: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEarthworksFill_CorrectPredefinedType` (line 7792). `IfcEarthworksFill` is wholly
// new in IFC4X3_ADD2 (an infrastructure earthworks-fill element, no IFC4 counterpart --
// confirmed via `grep`, zero matches), standard "occurrence" shape.
const IfcEarthworksFill_CorrectPredefinedType = entityRule("IfcEarthworksFill", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEarthworksFill: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEdgeLoop_IsClosed` (ADD2 line 7802) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcEdgeLoop_IsContinuous` (ADD2 line 7813) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEdgeLoop_IsContinuous = entityRule("IfcEdgeLoop", "IsContinuous", (self) => {
	assertWhereRule(
		ifcLoopHeadToTail(self),
		"IfcEdgeLoop: EdgeList must be head-to-tail continuous (each edge's EdgeEnd must equal the next edge's EdgeStart).",
	);
});

// `IfcElectricAppliance_CorrectPredefinedType` (ADD2 line 7826) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricAppliance_CorrectTypeAssigned` (ADD2 line 7836) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcElectricAppliance_CorrectTypeAssigned = entityRule("IfcElectricAppliance", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElectricApplianceType"),
		"IfcElectricAppliance: if IsTypedBy is given, its RelatingType must be an IfcElectricApplianceType.",
	);
});

// `IfcElectricApplianceType_CorrectPredefinedType` (ADD2 line 7846) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricDistributionBoard_CorrectPredefinedType` (ADD2 line 7856) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricDistributionBoard_CorrectTypeAssigned` (ADD2 line 7866) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricDistributionBoardType_CorrectPredefinedType` (ADD2 line 7876) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricFlowStorageDevice_CorrectPredefinedType` (ADD2 line 7886) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricFlowStorageDevice_CorrectTypeAssigned` (ADD2 line 7896) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricFlowStorageDeviceType_CorrectPredefinedType` (ADD2 line 7906) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricFlowTreatmentDevice_CorrectPredefinedType` (line 7916).
// `IfcElectricFlowTreatmentDevice`/`IfcElectricFlowTreatmentDeviceType` are wholly new in
// IFC4X3_ADD2 (a flow-treatment-device element, no IFC4 counterpart -- confirmed via
// `grep`, zero matches), standard "occurrence" shape.
const IfcElectricFlowTreatmentDevice_CorrectPredefinedType = entityRule(
	"IfcElectricFlowTreatmentDevice",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcElectricFlowTreatmentDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcElectricFlowTreatmentDevice_CorrectTypeAssigned` (line 7926). New entity,
// standard `_CorrectTypeAssigned` shape.
const IfcElectricFlowTreatmentDevice_CorrectTypeAssigned = entityRule(
	"IfcElectricFlowTreatmentDevice",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcElectricFlowTreatmentDeviceType"),
			"IfcElectricFlowTreatmentDevice: if IsTypedBy is given, its RelatingType must be an IfcElectricFlowTreatmentDeviceType.",
		);
	},
);

// `IfcElectricFlowTreatmentDeviceType_CorrectPredefinedType` (line 7936). New entity,
// standard "*Type" (mandatory PredefinedType) shape.
const IfcElectricFlowTreatmentDeviceType_CorrectPredefinedType = entityRule(
	"IfcElectricFlowTreatmentDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcElectricFlowTreatmentDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcElectricGenerator_CorrectPredefinedType` (ADD2 line 7946) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricGenerator_CorrectTypeAssigned` (ADD2 line 7956) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcElectricGenerator_CorrectTypeAssigned = entityRule("IfcElectricGenerator", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElectricGeneratorType"),
		"IfcElectricGenerator: if IsTypedBy is given, its RelatingType must be an IfcElectricGeneratorType.",
	);
});

// `IfcElectricGeneratorType_CorrectPredefinedType` (ADD2 line 7966) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricMotor_CorrectPredefinedType` (ADD2 line 7976) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcElectricMotor_CorrectPredefinedType = entityRule("IfcElectricMotor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcElectricMotor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcElectricMotor_CorrectTypeAssigned` (ADD2 line 7986) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcElectricMotor_CorrectTypeAssigned = entityRule("IfcElectricMotor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElectricMotorType"),
		"IfcElectricMotor: if IsTypedBy is given, its RelatingType must be an IfcElectricMotorType.",
	);
});

// `IfcElectricMotorType_CorrectPredefinedType` (ADD2 line 7996) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricTimeControl_CorrectPredefinedType` (ADD2 line 8006) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricTimeControl_CorrectTypeAssigned` (ADD2 line 8016) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElectricTimeControlType_CorrectPredefinedType` (ADD2 line 8026) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElementAssembly_CorrectPredefinedType` (ADD2 line 8036) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcElementAssembly_CorrectPredefinedType = entityRule("IfcElementAssembly", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcElementAssembly: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcElementAssembly_CorrectTypeAssigned` (ADD2 line 8046) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcElementAssembly_CorrectTypeAssigned = entityRule("IfcElementAssembly", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcElementAssemblyType"),
		"IfcElementAssembly: if IsTypedBy is given, its RelatingType must be an IfcElementAssemblyType.",
	);
});

// `IfcElementAssemblyType_CorrectPredefinedType` (ADD2 line 8056) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcElementQuantity_UniqueQuantityNames` (ADD2 line 8066) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcElementQuantity_UniqueQuantityNames = entityRule("IfcElementQuantity", "UniqueQuantityNames", (self) => {
	const quantities = expressGetAttr(self, "Quantities", INDETERMINATE);
	assertWhereRule(
		ifcUniqueQuantityNames(quantities),
		"IfcElementQuantity: every Quantities member must have a distinct Name.",
	);
});

// `IfcEngine_CorrectPredefinedType` (ADD2 line 8076) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEngine_CorrectPredefinedType = entityRule("IfcEngine", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEngine: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEngine_CorrectTypeAssigned` (ADD2 line 8086) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEngine_CorrectTypeAssigned = entityRule("IfcEngine", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcEngineType"),
		"IfcEngine: if IsTypedBy is given, its RelatingType must be an IfcEngineType.",
	);
});

// `IfcEngineType_CorrectPredefinedType` (ADD2 line 8096) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEngineType_CorrectPredefinedType = entityRule("IfcEngineType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcEngineType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEvaporativeCooler_CorrectPredefinedType` (ADD2 line 8106) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcEvaporativeCooler_CorrectTypeAssigned` (ADD2 line 8116) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEvaporativeCooler_CorrectTypeAssigned = entityRule("IfcEvaporativeCooler", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcEvaporativeCoolerType"),
		"IfcEvaporativeCooler: if IsTypedBy is given, its RelatingType must be an IfcEvaporativeCoolerType.",
	);
});

// `IfcEvaporativeCoolerType_CorrectPredefinedType` (ADD2 line 8126) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcEvaporator_CorrectPredefinedType` (ADD2 line 8136) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEvaporator_CorrectPredefinedType = entityRule("IfcEvaporator", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEvaporator: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEvaporator_CorrectTypeAssigned` (ADD2 line 8146) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEvaporator_CorrectTypeAssigned = entityRule("IfcEvaporator", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcEvaporatorType"),
		"IfcEvaporator: if IsTypedBy is given, its RelatingType must be an IfcEvaporatorType.",
	);
});

// `IfcEvaporatorType_CorrectPredefinedType` (ADD2 line 8156) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEvaporatorType_CorrectPredefinedType = entityRule("IfcEvaporatorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcEvaporatorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEvent_CorrectPredefinedType` (ADD2 line 8166) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEvent_CorrectPredefinedType = entityRule("IfcEvent", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcEvent: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEvent_CorrectTypeAssigned` (ADD2 line 8176) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEvent_CorrectTypeAssigned = entityRule("IfcEvent", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		optionalUserDefinedOrHasAttribute(self, "EventTriggerType", "UserDefinedEventTriggerType"),
		"IfcEvent: if EventTriggerType is given and USERDEFINED, UserDefinedEventTriggerType must be given.",
	);
});

// `IfcEventType_CorrectEventTriggerType` (ADD2 line 8187) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEventType_CorrectEventTriggerType = entityRule("IfcEventType", "CorrectEventTriggerType", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "EventTriggerType", "UserDefinedEventTriggerType"),
		"IfcEventType: if EventTriggerType is USERDEFINED, UserDefinedEventTriggerType must be given.",
	);
});

// `IfcEventType_CorrectPredefinedType` (ADD2 line 8198) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcEventType_CorrectPredefinedType = entityRule("IfcEventType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ProcessType", false),
		"IfcEventType: if PredefinedType is USERDEFINED, ProcessType must be given.",
	);
});

// `IfcExternalReference_WR1` (ADD2 line 8208) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcExternalReference_WR1 = entityRule("IfcExternalReference", "WR1", (self) => {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	const identification = expressGetAttr(self, "Identification", INDETERMINATE);
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	assertWhereRule(
		exists(identification) || exists(location) || exists(name),
		"IfcExternalReference: at least one of Identification, Location, or Name must be given.",
	);
});

// `IfcExtrudedAreaSolid_ValidExtrusionDirection` (ADD2 line 8220) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcExtrudedAreaSolidTapered_CorrectProfileAssignment` (ADD2 line 8229) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcFace_HasOuterBound` (ADD2 line 8238) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFace_HasOuterBound = entityRule("IfcFace", "HasOuterBound", (self) => {
	const bounds = asList(expressGetAttr(self, "Bounds", INDETERMINATE));
	const outerBoundCount = bounds.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcfaceouterbound")).length;
	assertWhereRule(outerBoundCount <= 1, "IfcFace: at most one Bounds member may be an IfcFaceOuterBound.");
});

// `IfcFacilityPartCommon_CorrectPredefinedType` (line 8251). `IfcFacilityPartCommon` is
// wholly new in IFC4X3_ADD2 (an infrastructure-facility-part common supertype, no IFC4
// counterpart -- confirmed via `grep`, zero matches), standard "occurrence" shape.
const IfcFacilityPartCommon_CorrectPredefinedType = entityRule(
	"IfcFacilityPartCommon",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcFacilityPartCommon: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcFan_CorrectPredefinedType` (ADD2 line 8261) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFan_CorrectPredefinedType = entityRule("IfcFan", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFan: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFan_CorrectTypeAssigned` (ADD2 line 8271) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFan_CorrectTypeAssigned = entityRule("IfcFan", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFanType"),
		"IfcFan: if IsTypedBy is given, its RelatingType must be an IfcFanType.",
	);
});

// `IfcFanType_CorrectPredefinedType` (ADD2 line 8281) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFanType_CorrectPredefinedType = entityRule("IfcFanType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFanType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFastener_CorrectPredefinedType` (ADD2 line 8291) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFastener_CorrectPredefinedType = entityRule("IfcFastener", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFastener: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFastener_CorrectTypeAssigned` (ADD2 line 8301) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFastener_CorrectTypeAssigned = entityRule("IfcFastener", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFastenerType"),
		"IfcFastener: if IsTypedBy is given, its RelatingType must be an IfcFastenerType.",
	);
});

// `IfcFastenerType_CorrectPredefinedType` (ADD2 line 8311) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFastenerType_CorrectPredefinedType = entityRule("IfcFastenerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFastenerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFeatureElement_NotContained` (line 8321). **A new RULE on a pre-existing IFC4
// entity, genuinely bespoke shape**: `IfcFeatureElement` itself already exists in
// `IFC4.py` (convenience-constructor wrapper confirmed, real source line 2786) with no
// WHERE-rule of its own there (only its own subtype `IfcFeatureElementSubtraction` has
// rules, already ported above as part of this chunk's byte-identical set); ADD2 adds
// this one directly on the supertype. Python: `sizeof(ContainedInStructure) == 0` --
// exactly `attrSizeIsZero`'s own shape (this chunk's 3rd occurrence, crossing this file
// family's own factoring threshold together with the 2 byte-identical
// `IfcFeatureElementSubtraction` rules above).
const IfcFeatureElement_NotContained = entityRule("IfcFeatureElement", "NotContained", (self) => {
	assertWhereRule(
		attrSizeIsZero(self, "ContainedInStructure"),
		"IfcFeatureElement.ContainedInStructure must be empty.",
	);
});

// `IfcFeatureElementSubtraction_HasNoSubtraction` (ADD2 line 8331) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcFeatureElementSubtraction_IsNotFilling` (ADD2 line 8340) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFeatureElementSubtraction_IsNotFilling = entityRule("IfcFeatureElementSubtraction", "IsNotFilling", (self) => {
	assertWhereRule(
		attrSizeIsZero(self, "FillsVoids"),
		"IfcFeatureElementSubtraction.FillsVoids must be empty (a feature-element-subtraction may not itself fill a void).",
	);
});

// `IfcFillAreaStyle_ConsistentHatchStyleDef` (ADD2 line 8349) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFillAreaStyle_ConsistentHatchStyleDef = entityRule("IfcFillAreaStyle", "ConsistentHatchStyleDef", (self) => {
	const fillStyles = expressGetAttr(self, "FillStyles", INDETERMINATE);
	assertWhereRule(
		ifcCorrectFillAreaStyle(fillStyles),
		"IfcFillAreaStyle: FillStyles must be a consistent combination (at most one IfcExternallyDefinedHatchStyle, not mixed with hatching/tiles/colour; at most one colour; not both hatching and tiles).",
	);
});

// `IfcFillAreaStyle_MaxOneColour` (ADD2 line 8358) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFillAreaStyle_MaxOneColour = entityRule("IfcFillAreaStyle", "MaxOneColour", (self) => {
	const fillStyles = asList(expressGetAttr(self, "FillStyles", INDETERMINATE));
	const colourCount = fillStyles.filter((style) => typeOfAttr(style).has("ifc4x3_add2.ifccolour")).length;
	assertWhereRule(colourCount <= 1, "IfcFillAreaStyle: at most one FillStyles member may be an IfcColour.");
});

// `IfcFillAreaStyle_MaxOneExtHatchStyle` (ADD2 line 8367) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFillAreaStyle_MaxOneExtHatchStyle = entityRule("IfcFillAreaStyle", "MaxOneExtHatchStyle", (self) => {
	const fillStyles = asList(expressGetAttr(self, "FillStyles", INDETERMINATE));
	const extHatchCount = fillStyles.filter((style) =>
		typeOfAttr(style).has("ifc4x3_add2.ifcexternallydefinedhatchstyle"),
	).length;
	assertWhereRule(
		extHatchCount <= 1,
		"IfcFillAreaStyle: at most one FillStyles member may be an IfcExternallyDefinedHatchStyle.",
	);
});

// `IfcFillAreaStyleHatching_PatternStart2D` (ADD2 line 8376) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFillAreaStyleHatching_PatternStart2D = entityRule("IfcFillAreaStyleHatching", "PatternStart2D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "PatternStart", 2),
		"IfcFillAreaStyleHatching: if PatternStart is given, its Dim must equal 2.",
	);
});

// `IfcFillAreaStyleHatching_RefHatchLine2D` (ADD2 line 8386) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFillAreaStyleHatching_RefHatchLine2D = entityRule("IfcFillAreaStyleHatching", "RefHatchLine2D", (self) => {
	assertWhereRule(
		optionalAttrDimEquals(self, "PointOfReferenceHatchLine", 2),
		"IfcFillAreaStyleHatching: if PointOfReferenceHatchLine is given, its Dim must equal 2.",
	);
});

// `IfcFilter_CorrectPredefinedType` (ADD2 line 8396) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFilter_CorrectPredefinedType = entityRule("IfcFilter", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFilter: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFilter_CorrectTypeAssigned` (ADD2 line 8406) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFilter_CorrectTypeAssigned = entityRule("IfcFilter", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFilterType"),
		"IfcFilter: if IsTypedBy is given, its RelatingType must be an IfcFilterType.",
	);
});

// `IfcFilterType_CorrectPredefinedType` (ADD2 line 8416) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFilterType_CorrectPredefinedType = entityRule("IfcFilterType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFilterType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFireSuppressionTerminal_CorrectPredefinedType` (ADD2 line 8426) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcFireSuppressionTerminal_CorrectTypeAssigned` (ADD2 line 8436) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcFireSuppressionTerminalType_CorrectPredefinedType` (ADD2 line 8446) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcFlowInstrument_CorrectPredefinedType` (ADD2 line 8456) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFlowInstrument_CorrectPredefinedType = entityRule("IfcFlowInstrument", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFlowInstrument: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFlowInstrument_CorrectTypeAssigned` (ADD2 line 8466) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFlowInstrument_CorrectTypeAssigned = entityRule("IfcFlowInstrument", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFlowInstrumentType"),
		"IfcFlowInstrument: if IsTypedBy is given, its RelatingType must be an IfcFlowInstrumentType.",
	);
});

// `IfcFlowInstrumentType_CorrectPredefinedType` (ADD2 line 8476) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcFlowMeter_CorrectPredefinedType` (ADD2 line 8486) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFlowMeter_CorrectPredefinedType = entityRule("IfcFlowMeter", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFlowMeter: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFlowMeter_CorrectTypeAssigned` (ADD2 line 8496) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFlowMeter_CorrectTypeAssigned = entityRule("IfcFlowMeter", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFlowMeterType"),
		"IfcFlowMeter: if IsTypedBy is given, its RelatingType must be an IfcFlowMeterType.",
	);
});

// `IfcFlowMeterType_CorrectPredefinedType` (ADD2 line 8506) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFlowMeterType_CorrectPredefinedType = entityRule("IfcFlowMeterType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFlowMeterType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFooting_CorrectPredefinedType` (ADD2 line 8516) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFooting_CorrectPredefinedType = entityRule("IfcFooting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFooting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFooting_CorrectTypeAssigned` (ADD2 line 8526) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFooting_CorrectTypeAssigned = entityRule("IfcFooting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFootingType"),
		"IfcFooting: if IsTypedBy is given, its RelatingType must be an IfcFootingType.",
	);
});

// `IfcFootingType_CorrectPredefinedType` (ADD2 line 8536) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFootingType_CorrectPredefinedType = entityRule("IfcFootingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcFootingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFurniture_CorrectPredefinedType` (ADD2 line 8546) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFurniture_CorrectPredefinedType = entityRule("IfcFurniture", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcFurniture: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcFurniture_CorrectTypeAssigned` (ADD2 line 8556) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcFurniture_CorrectTypeAssigned = entityRule("IfcFurniture", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcFurnitureType"),
		"IfcFurniture: if IsTypedBy is given, its RelatingType must be an IfcFurnitureType.",
	);
});

// `IfcFurnitureType_CorrectPredefinedType` (line 8566). **A genuine schema-evolution
// finding, not a new shape**: real IFC4.py's own version (line 7647) uses the mandatory
// "*Type" shape (`predefinedtype != USERDEFINED or ...`, no leading `exists` guard) --
// ADD2's real body adds a leading `not exists(predefinedtype) or`, meaning
// `IfcFurnitureType.PredefinedType` became OPTIONAL in ADD2 (was mandatory in IFC4).
// **The first occurrence across all 3 schemas' own already-ported chunks of a "*Type"
// entity whose own PredefinedType attribute is optional** -- this file's own
// `correctPredefinedType(self, escapeAttrName, predefinedTypeOptional)` helper already
// parameterizes escape-attribute name and optionality independently (established chunk
// 1), so this needs no new helper or shape, just `predefinedTypeOptional = true` with
// the "*Type" entity's own usual `"ElementType"` escape attribute -- a combination no
// prior chunk's own rules happened to need.
const IfcFurnitureType_CorrectPredefinedType = entityRule("IfcFurnitureType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", true),
		"IfcFurnitureType: if PredefinedType is given and USERDEFINED, ElementType must be given.",
	);
});

// `IfcGeographicCRS_AngleUnitIsPlaneAngle` (line 8576). **A new RULE on a wholly new
// ADD2 entity** (`IfcGeographicCRS` -- a geographic coordinate-reference-system entity,
// no IFC4 counterpart at all, confirmed via `grep` across all of `IFC4.py`, zero
// matches). Fresh local copy of `whereRules/ifc4.ts`'s own already-established
// `optionalAttrUnitTypeEquals` shape (2 occurrences in this chunk, both on this same new
// entity -- below the 3-occurrence "new helper" threshold on its own, but it's an
// already-established shape reused fresh, not a new discovery, per this file's own
// "verify against an existing shape before writing a local copy" policy).
const IfcGeographicCRS_AngleUnitIsPlaneAngle = entityRule("IfcGeographicCRS", "AngleUnitIsPlaneAngle", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "AngleUnit", "PLANEANGLEUNIT"),
		"IfcGeographicCRS: if AngleUnit is given, its UnitType must be PLANEANGLEUNIT.",
	);
});

// `IfcGeographicCRS_HeightUnitIsLength` (line 8585). Same new entity as
// `IfcGeographicCRS_AngleUnitIsPlaneAngle` immediately above, same
// `optionalAttrUnitTypeEquals` shape, second and last occurrence in this chunk.
const IfcGeographicCRS_HeightUnitIsLength = entityRule("IfcGeographicCRS", "HeightUnitIsLength", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "HeightUnit", "LENGTHUNIT"),
		"IfcGeographicCRS: if HeightUnit is given, its UnitType must be LENGTHUNIT.",
	);
});

// `IfcGeographicElement_CorrectPredefinedType` (ADD2 line 8594) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcGeographicElement_CorrectTypeAssigned` (ADD2 line 8604) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcGeographicElement_CorrectTypeAssigned = entityRule("IfcGeographicElement", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcGeographicElementType"),
		"IfcGeographicElement: if IsTypedBy is given, its RelatingType must be an IfcGeographicElementType.",
	);
});

// `IfcGeographicElementType_CorrectPredefinedType` (ADD2 line 8614) -- byte-identical to IFC4.py's own version (modulo schema prefix).
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

// `IfcGeometricCurveSet_NoSurfaces` (ADD2 line 8624) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcGeometricCurveSet_NoSurfaces = entityRule("IfcGeometricCurveSet", "NoSurfaces", (self) => {
	const elements = asList(expressGetAttr(self, "Elements", INDETERMINATE));
	const surfaceCount = elements.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcsurface")).length;
	assertWhereRule(surfaceCount === 0, "IfcGeometricCurveSet: no Elements member may be an IfcSurface.");
});

// `IfcGeometricRepresentationContext_North2D` (ADD2 line 8633) -- byte-identical to IFC4.py's own version (modulo schema prefix).
const IfcGeometricRepresentationContext_North2D = entityRule("IfcGeometricRepresentationContext", "North2D", (self) => {
	const trueNorth = expressGetAttr(self, "TrueNorth", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(trueNorth), () => triEq(hiIndex(expressGetAttr(trueNorth, "DirectionRatios", INDETERMINATE)), 2)),
		"IfcGeometricRepresentationContext: if TrueNorth is given, its DirectionRatios must have exactly 2 elements.",
	);
});
registerSchemaRules("IFC4X3_ADD2", [
	IfcDerivedUnit_WR2,
	IfcDirection_MagnitudeGreaterZero,
	IfcDirectrixCurveSweptAreaSolid_DirectrixBounded,
	IfcDiscreteAccessory_CorrectPredefinedType,
	IfcDiscreteAccessory_CorrectTypeAssigned,
	IfcDiscreteAccessoryType_CorrectPredefinedType,
	IfcDistributionBoard_CorrectPredefinedType,
	IfcDistributionBoard_CorrectTypeAssigned,
	IfcDistributionBoardType_CorrectPredefinedType,
	IfcDistributionChamberElement_CorrectPredefinedType,
	IfcDistributionChamberElement_CorrectTypeAssigned,
	IfcDistributionChamberElementType_CorrectPredefinedType,
	IfcDistributionSystem_CorrectPredefinedType,
	IfcDocumentReference_WR1,
	IfcDoor_CorrectPredefinedType,
	IfcDoor_CorrectTypeAssigned,
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
	IfcDuctFittingType_CorrectPredefinedType,
	IfcDuctSegment_CorrectPredefinedType,
	IfcDuctSegment_CorrectTypeAssigned,
	IfcDuctSegmentType_CorrectPredefinedType,
	IfcDuctSilencer_CorrectPredefinedType,
	IfcDuctSilencer_CorrectTypeAssigned,
	IfcDuctSilencerType_CorrectPredefinedType,
	IfcEarthworksCut_CorrectPredefinedType,
	IfcEarthworksFill_CorrectPredefinedType,
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
	IfcElectricFlowTreatmentDevice_CorrectPredefinedType,
	IfcElectricFlowTreatmentDevice_CorrectTypeAssigned,
	IfcElectricFlowTreatmentDeviceType_CorrectPredefinedType,
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
	IfcEventType_CorrectEventTriggerType,
	IfcEventType_CorrectPredefinedType,
	IfcExternalReference_WR1,
	IfcExtrudedAreaSolid_ValidExtrusionDirection,
	IfcExtrudedAreaSolidTapered_CorrectProfileAssignment,
	IfcFace_HasOuterBound,
	IfcFacilityPartCommon_CorrectPredefinedType,
	IfcFan_CorrectPredefinedType,
	IfcFan_CorrectTypeAssigned,
	IfcFanType_CorrectPredefinedType,
	IfcFastener_CorrectPredefinedType,
	IfcFastener_CorrectTypeAssigned,
	IfcFastenerType_CorrectPredefinedType,
	IfcFeatureElement_NotContained,
	IfcFeatureElementSubtraction_HasNoSubtraction,
	IfcFeatureElementSubtraction_IsNotFilling,
	IfcFillAreaStyle_ConsistentHatchStyleDef,
	IfcFillAreaStyle_MaxOneColour,
	IfcFillAreaStyle_MaxOneExtHatchStyle,
	IfcFillAreaStyleHatching_PatternStart2D,
	IfcFillAreaStyleHatching_RefHatchLine2D,
	IfcFilter_CorrectPredefinedType,
	IfcFilter_CorrectTypeAssigned,
	IfcFilterType_CorrectPredefinedType,
	IfcFireSuppressionTerminal_CorrectPredefinedType,
	IfcFireSuppressionTerminal_CorrectTypeAssigned,
	IfcFireSuppressionTerminalType_CorrectPredefinedType,
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
	IfcGeographicCRS_AngleUnitIsPlaneAngle,
	IfcGeographicCRS_HeightUnitIsLength,
	IfcGeographicElement_CorrectPredefinedType,
	IfcGeographicElement_CorrectTypeAssigned,
	IfcGeographicElementType_CorrectPredefinedType,
	IfcGeometricCurveSet_NoSurfaces,
	IfcGeometricRepresentationContext_North2D,
]);

// =============================================================================
// Phase EX-4, IFC4X3_ADD2 chunk 4 (planning/ifcopenshell-ts/70-express-rules-plan.md):
// the next 120 `SCOPE = 'entity'` rules, real ADD2 file order, continuing directly from
// chunk 3's own last-ported rule with zero gap or overlap -- `IfcGeometricRepresentationSubContext_
// NoCoordOperation` (real source line 8643) through `IfcPositioningElement_HasPlacement`
// (line 9897), independently re-verified with the same small Python script prior chunks
// used (matching `^class (\w+)` followed by its own `SCOPE = '(\w+)'` line): exactly 120
// entity-scope rules in this range, zero gap/overlap with chunk 3's own last rule
// (`IfcGeometricRepresentationContext_North2D`, line 8633) or chunk 5's first
// (`IfcPostalAddress_WR1`, line 9906, deliberately excluded from this chunk).
// IFC4X3_ADD2 now at 460/779 (435/752 entity + 25/25 type) once this chunk lands.
//
// =============================================================================
// Byte-identical-vs-different breakdown, exhaustively diffed against `IFC4.py` (a Python
// script comparing every one of this chunk's 120 real bodies character-for-character
// after normalizing the schema-namespace prefix, matching chunk 2's own already-fixed
// methodology -- extracting each class's body up to but NOT INCLUDING a trailing
// unindented `def calc_*`/`class` line sitting between adjacent classes, avoiding chunk
// 2's own originally-caught false-"different" bug)
// =============================================================================
//
// **86/120 byte-identical** to `whereRules/ifc4.ts`'s own already-ported IFC4 bodies
// (modulo only the embedded schema-namespace string). **2/120 have the same class name
// but a genuinely different body** (both real, individually investigated schema-evolution
// findings, not extraction artifacts -- see below). **32/120 have no same-named `IFC4.py`
// counterpart at all**, each individually investigated (not assumed new from a name
// mismatch alone): **30 are ordinary `_CorrectPredefinedType`/`_CorrectTypeAssigned` rules
// on 13 wholly-new-in-ADD2 entities** -- confirmed via `grep`/`.d.ts` cross-check, zero
// matches anywhere in `IFC4.py` or `generated/ifc4.d.ts` for any of: `IfcGeotechnicalStratum`
// (1 rule), `IfcImpactProtectionDevice`/`Type` (3), `IfcKerb`/`Type` (3),
// `IfcLiquidTerminal`/`Type` (3), `IfcMarineFacility` (1), `IfcMarinePart` (1),
// `IfcMobileTelecommunicationsAppliance`/`Type` (3), `IfcMooringDevice`/`Type` (3),
// `IfcNavigationElement`/`Type` (3), `IfcOpenCrossProfileDef` (3, bespoke, not the
// `_CorrectPredefinedType` shape -- a new alignment/road-cross-section profile entity),
// `IfcPavement`/`Type` (3), `IfcPolynomialCurve` (2, bespoke, a new alignment curve
// entity), `IfcPositioningElement` (1, bespoke -- see its own "removed `IfcGrid_
// HasPlacement`" writeup below); **2 are genuinely NEW RULES on entities that already
// existed in IFC4** -- `IfcMapConversion_TargetCRSOnlyProjected` (`IfcMapConversion`
// itself unchanged between schemas, confirmed via `.d.ts` diff -- ADD2 simply adds a new
// constraint narrowing `TargetCRS` to `IfcProjectedCRS` specifically) and
// `IfcOpeningElement_CorrectPredefinedType` (`IfcOpeningElement` itself unchanged, ADD2
// adds the ordinary occurrence-shape `_CorrectPredefinedType` check IFC4 never had for
// this entity -- reuses the existing `correctPredefinedType` helper unchanged, not a new
// shape).
//
// =============================================================================
// Two genuine schema-evolution findings among the "2/120 different" bucket
// =============================================================================
//
// (1) **`IfcIndexedPolyCurve_Consecutive` (line 8864) changed its own guard from `sizeof(
// Segments) == 0 or ...` (IFC4, line 7672) to `not exists(Segments) or ...` (ADD2)** --
// `Segments` is optional on both schemas (`unknown[] | null` in both `generated/ifc4.d.ts`
// and `generated/ifc4x3.d.ts`, confirmed directly), so this is a real behavioral fix, not
// a cosmetic rename: under this port's own `Tri` semantics, `sizeof(INDETERMINATE)` is
// itself `INDETERMINATE` (`runtimeShim.ts`'s own `expressLen`), so IFC4's own `sizeof(
// Segments) == 0` guard does NOT short-circuit to `true` when `Segments` is altogether
// absent (`triEq(INDETERMINATE, 0)` is `INDETERMINATE`, which is `!== true`, so `pyOr`
// still evaluates the second operand, `IfcConsecutiveSegments(INDETERMINATE)`) -- ADD2's
// own `not exists(Segments)` guard DOES correctly short-circuit in that case. Ported
// verbatim per-schema: IFC4's own already-ported version keeps its own `sizeof(...) == 0`
// guard unchanged (matching real `IFC4.py`, not "fixed" retroactively), and this chunk's
// own `IfcIndexedPolyCurve_Consecutive` uses the real ADD2 `not exists(...)` guard.
// (2) **`IfcPolygonalBoundedHalfSpace_BoundaryType` (line 9854) widened its own
// `PolygonalBoundary` SELECT-membership list** from `['ifc4.ifcpolyline',
// 'ifc4.ifccompositecurve']` (IFC4, line 8435) to `['ifc4x3_add2.ifcpolyline',
// 'ifc4x3_add2.ifccompositecurve', 'ifc4x3_add2.ifcindexedpolycurve']` (ADD2) -- ADD2 now
// also accepts an `IfcIndexedPolyCurve` as a valid `PolygonalBoundary`, consistent with
// `IfcIndexedPolyCurve` being a real, established ADD2/IFC4 profile-boundary curve type.
//
// =============================================================================
// A real, disclosed rule-NAME quirk, RECONFIRMED from IFC4's own already-disclosed
// finding for this identical rule (not re-derived) -- one of the "86 byte-identical" rules
// =============================================================================
//
// **`IfcOffsetCurve3D_DimIs2D` (line 8808) has the exact same misleading `RULE_NAME` IFC4's
// own already-ported version already disclosed** (`whereRules/ifc4.ts`'s own header
// comment, IFC4 chunk 4): its own real `RULE_NAME` says `"DimIs2D"` but its own real body
// checks `BasisCurve.Dim == 3`, not `2` -- independently re-confirmed present in
// `IFC4X3_ADD2.py`'s own real source too (byte-identical to `IFC4.py`'s own version modulo
// only the schema-prefix string, per this chunk's own "86 byte-identical" finding above).
// Ported faithfully (`attrDimEquals(self, "BasisCurve", 3)`), citing the IFC4 chunk 4
// precedent directly rather than re-deriving it.
//
// =============================================================================
// Two genuine "entity/rule vanished" schema-evolution findings, continuing the pattern
// already established by chunks 1-3 (`IfcBeamStandardCase`/`IfcColumnStandardCase`/
// `IfcDoorStyle`)
// =============================================================================
//
// **`IfcMemberStandardCase` and `IfcPlateStandardCase` have both been removed from the
// schema entirely** (real `IFC4.py` has `IfcMemberStandardCase_HasMaterialProfileSetUsage`,
// line 7987, and `IfcPlateStandardCase_HasMaterialLayerSetUsage`, line 8388 -- confirmed
// via `grep -n "class IfcMemberStandardCase\|class IfcPlateStandardCase"` against both real
// files: found in `IFC4.py`, ZERO matches in `IFC4X3_ADD2.py`) -- the 4th and 5th such
// vanished-entity finding after chunk 1's own `IfcBeamStandardCase` and chunk 2's own
// `IfcColumnStandardCase` disclosures, continuing the exact same "*StandardCase" removal
// pattern (every "*StandardCase" entity whose own sibling `_CorrectPredefinedType`/
// `_CorrectTypeAssigned` rules fall inside this chunk's own range -- `IfcMember`/
// `IfcPlate` -- has now been checked and found removed; `IfcWallStandardCase`/
// `IfcSlabStandardCase` fall outside this chunk's own range and are left for whichever
// later chunk reaches them). Not a boundary-exclusion artifact: neither rule is ported
// here or deferred to a later chunk, since neither exists in ADD2's own real source at
// all.
//
// **A genuinely NEW finding this chunk: `IfcGrid_HasPlacement` (real `IFC4.py` line 7542,
// `exists(ObjectPlacement)`) has been removed from `IFC4X3_ADD2.py` entirely** -- confirmed
// via `grep -n "class IfcGrid_HasPlacement"` against both real files (found in `IFC4.py`,
// zero matches in `IFC4X3_ADD2.py`), and NOT a boundary artifact: this chunk's own range
// runs directly from `IfcGeometricSet_ConsistentDim` to `IfcGeotechnicalStratum_
// CorrectPredefinedType` to `IfcGridAxis_WR1` with no `IfcGrid_HasPlacement` in between,
// squarely inside this chunk's own real range (not excluded by either boundary). `IfcGrid`
// the entity itself still exists in ADD2 (`generated/ifc4x3.d.ts` confirmed), with
// `ObjectPlacement` still declared optional on both schemas (`| null` on both) -- so the
// attribute's own optionality did not change, only this specific WHERE-rule vanished.
// **CONFIRMED, not just hypothesized** (upgraded from an initial "well-evidenced
// hypothesis" reached from `.d.ts` field-layout evidence alone, since the raw `.exp`
// schema text isn't in this repo and its exact `SUBTYPE OF` declaration can't be read
// directly): `test/express/whereRules/ifc4x3.test.ts`'s own dedicated end-to-end
// `executeRules(file)` test constructs a real `IfcGrid` instance with no `ObjectPlacement`
// and observes it IS caught by `IfcPositioningElement.HasPlacement` (not by any
// `IfcGrid`-named rule, which no longer exists) -- this is only possible if this port's own
// rule-dispatch engine's real `by_type("IfcPositioningElement")`-equivalent instance walk
// (`ruleExecutor.ts`, itself driven by this port's real native schema/subtype
// introspection, not a guess) genuinely resolves `IfcGrid` as an `IfcPositioningElement`
// instance -- i.e. `IfcGrid` really is now declared as a subtype of the new
// `IfcPositioningElement` entity in ADD2's own real schema (superseding its own former
// direct `IfcProduct` subtyping), and ADD2 moved the placement-mandatory constraint up to
// that new common supertype rather than keeping it duplicated per-subtype. The `.d.ts`
// field-layout match (`IfcPositioningElement`'s own fields identical to `IfcProduct`'s
// base fields) was the original clue; the end-to-end test is the actual confirmation.
//
// =============================================================================
// Existing shared helpers reused (fresh local copies already established by earlier
// chunks in THIS file -- no new logic, just new call sites)
// =============================================================================
//
// `correctPredefinedType`/`correctTypeAssigned`: 50 and 22 occurrences respectively in
// this chunk alone (72 of the 120 rules, 60%) -- independently re-counted directly against
// this chunk's own real source (`grep`-counted the shared `predefinedtype == ... USERDEFINED
// ... and exists(...)`/`istypedby = express_getattr` idioms). One occurrence uses a
// non-default escape attribute name: `IfcLaborResourceType_CorrectPredefinedType` escapes
// to `ResourceType`, not `ElementType` -- already supported by `correctPredefinedType`'s
// own existing `escapeAttrName` parameter, no new shape. `attrDimEquals`: 5 occurrences
// (`IfcGridAxis_WR1`, `IfcOffsetCurve2D_DimIs2D`/`IfcOffsetCurve3D_DimIs2D`,
// `IfcPcurve_DimIs2D`, `IfcPolygonalBoundedHalfSpace_BoundaryDim`). `attrSizeIsZero`: 1
// occurrence (`IfcGeometricRepresentationSubContext_NoCoordOperation`). `allShareFirstAttr`:
// 3 occurrences this chunk (`IfcGeometricSet_ConsistentDim`, `IfcPolyLoop_
// AllPointsSameDim`, `IfcPolyline_SameDim`) -- all 3 are the exact same "every list member
// shares the first member's own attribute value" shape `allShareFirstAttr` already
// covers, reused directly rather than hand-rolled (matching this file's own "verify
// against an existing shape before writing a local copy" policy; `whereRules/ifc4.ts`'s
// own version of `IfcGeometricSet_ConsistentDim` predates `allShareFirstAttr`'s own
// establishment and is bespoke there, not a discrepancy to flag). `containsSelfReference`:
// 1 occurrence (`IfcPhysicalComplexQuantity_NoSelfReference`). `ifcUniqueQuantityNames`: 1
// occurrence (`IfcPhysicalComplexQuantity_UniqueQuantityNames`). `userDefinedOrHasAttribute`:
// 2 occurrences (`IfcGeometricRepresentationSubContext_UserTargetProvided`'s own
// `TargetView`/`UserDefinedTargetView`, `IfcObjective_WR21`'s own `ObjectiveQualifier`/
// `UserDefinedQualifier`). `asList`: 1 occurrence (`IfcMaterialDefinitionRepresentation_
// OnlyStyledRepresentations`). `triXor` (imported directly from `runtimeShim.ts`, not a
// whereRules-file-local helper -- already used by `whereRules/ifc4.ts`'s own `IfcGridAxis_
// WR2`): 1 occurrence, same rule name, same chained-XOR subtlety already disclosed there
// (true for an ODD number of true operands, not literally "exactly one" -- preserved
// as-is, not a bug).
//
// =============================================================================
// New rule-file-local EXPRESS-library helpers ported this chunk (real functions from
// `IFC4X3_ADD2.py`'s own shared-helper section, none a WHERE-rule class or a `calc_*`
// DERIVE function -- each independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own
// version via direct `diff` after schema-prefix normalization, so ported as plain fresh
// copies with zero logic changes)
// =============================================================================
//
// `ifcConsecutiveSegments` (line 13213, `IfcIndexedPolyCurve_Consecutive`'s only caller),
// `ifcAssociatedSurface` (line 13172, `IfcIntersectionCurve_DistinctSurfaces`'s only
// caller), `ifcCorrectLocalPlacement` (line 13424, `IfcLocalPlacement_WR21`'s only
// caller), `ifcPathHeadToTail` (line 13734, `IfcPath_IsContinuous`'s only caller),
// `ifcUniqueDefinitionNames`/`ifcUniquePropertySetNames` (lines 13953/13974, together
// implementing `IfcObject_UniquePropertySetNames` -- two real, distinct top-level
// functions, `IfcUniqueDefinitionNames` calling `IfcUniquePropertySetNames` after its own
// `IfcPropertySetDefinition`/`IfcPropertySetDefinitionSet`-flattening pass over
// `IsDefinedBy`, ported as a genuine `ExpressSet` accumulation matching this file family's
// own established `express_set` idiom), and `ifcCorrectDimensions` (line 13256, used by
// `IfcNamedUnit_WR1`) -- a 29-branch `IfcUnitEnum`-keyed dispatch table, independently
// confirmed BYTE-IDENTICAL to `IFC4.py`'s own version (line 11439) via direct `diff`, with
// NO further ADD2-vs-IFC4 divergence this time (`whereRules/ifc4.ts`'s own version already
// disclosed the ONE real difference from IFC2X3, cross-referenced there, not repeated
// here since IFC4-vs-ADD2 has none). `ifcCorrectDimensions` needs a bare 7-arg
// `IfcDimensionalExponents(...)` constructor for its own 29 literal branches -- reused via
// a newly-exported `ifcDimensionalExponents` in `rules/ifc4x3.ts` (mirroring `rules/
// ifc4.ts`'s own identical export precedent for `whereRules/ifc4.ts`'s IFC4 chunk 4),
// rather than duplicating a `getScratchFile().createEntity(...)` call 29 times inline.
//
// =============================================================================
// No new shared-helper-worthy repeated bespoke shape found this chunk (nothing crosses
// the 3-occurrence factoring threshold beyond what's already covered above)
// =============================================================================
//
// `IfcMaterialLayer_NormalizedPriority`/`IfcMaterialProfile_NormalizedPriority` (2
// occurrences of `not exists(Priority) or 0 <= Priority <= 100`) stay bespoke, matching
// `whereRules/ifc4.ts`'s own identical precedent of leaving this exact 2-occurrence shape
// unfactored. The 5 `IfcPixelTexture_*` rules are each a genuinely different check (no
// repeated shape among them). No new upstream Python bugs found in this chunk's own 120
// rules beyond the already-cross-referenced `IfcOffsetCurve3D_DimIs2D` naming quirk above
// (a disclosed quirk, not a logic bug either way).
// =============================================================================

/**
 * Python: `IfcConsecutiveSegments(segments)` (real source line 13213):
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
 * Each `segments` member is itself a small point-index aggregate -- checks that
 * consecutive segments share their common point index (the last index of segment `i`
 * equals the first index of segment `i + 1`). Byte-identical to `whereRules/ifc4.ts`'s own
 * already-ported version (confirmed via direct `diff`, see this chunk's own header
 * comment).
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
 * Python: `IfcAssociatedSurface(arg)` (real source line 13172):
 * ```python
 * def IfcAssociatedSurface(arg):
 *     surf = express_getattr(arg, 'BasisSurface', INDETERMINATE)
 *     return surf
 * ```
 * Byte-identical to `whereRules/ifc4.ts`'s own already-ported version.
 */
function ifcAssociatedSurface(arg: unknown): unknown {
	return expressGetAttr(arg, "BasisSurface", INDETERMINATE);
}

/**
 * Python: `IfcCorrectLocalPlacement(axisplacement, relplacement)` (real source line
 * 13424) -- byte-identical to `whereRules/ifc4.ts`'s own already-ported version (only the
 * `'ifc4x3_add2.'` namespace prefix differs). See this chunk's own header comment.
 */
function ifcCorrectLocalPlacement(axisplacement: unknown, relplacement: unknown): Tri {
	if (exists(relplacement)) {
		if (typeOfAttr(relplacement).has("ifc4x3_add2.ifcgridplacement")) return INDETERMINATE;
		if (typeOfAttr(relplacement).has("ifc4x3_add2.ifclocalplacement")) {
			if (typeOfAttr(axisplacement).has("ifc4x3_add2.ifcaxis2placement2d")) return true;
			if (typeOfAttr(axisplacement).has("ifc4x3_add2.ifcaxis2placement3d")) {
				const relativePlacement = expressGetAttr(relplacement, "RelativePlacement", INDETERMINATE);
				return triEq(expressGetAttr(relativePlacement, "Dim", INDETERMINATE), 3) === true;
			}
		}
		return true;
	}
	return INDETERMINATE;
}

/** Python: `unknown` (a bare module-level constant, `IFC4X3_ADD2.py`) -- see this chunk's own header comment. */
const EXPRESS_UNKNOWN = "UNKNOWN" as unknown as Tri;

/**
 * Python: `IfcPathHeadToTail(apath)` (real source line 13734) -- byte-identical in shape
 * to `whereRules/ifc4.ts`'s own already-ported version (including its own `p = unknown`
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
 * Python: `IfcUniquePropertySetNames(properties)` (real source line 13974) -- a
 * rule-file-local EXPRESS-library helper, called by `ifcUniqueDefinitionNames` below (NOT
 * itself directly called by any WHERE-rule in this chunk). See this chunk's own header
 * comment.
 */
function ifcUniquePropertySetNames(properties: unknown): boolean {
	let names = new ExpressSet<unknown>();
	let unnamed = 0;
	const n = hiIndex(properties) as number;
	for (const i of expressRange(1, n + 1)) {
		const item = expressGetItem(properties, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		if (typeOfAttr(item).has("ifc4x3_add2.ifcpropertyset")) {
			names = names.plus(expressGetAttr(item, "Name", INDETERMINATE));
		} else {
			unnamed += 1;
		}
	}
	return names.size + unnamed === (sizeof(properties) as number);
}

/**
 * Python: `IfcUniqueDefinitionNames(relations)` (real source line 13953) -- a
 * rule-file-local EXPRESS-library helper used by `IfcObject_UniquePropertySetNames`
 * below. See this chunk's own header comment.
 */
function ifcUniqueDefinitionNames(relations: unknown): boolean {
	if ((sizeof(relations) as number) === 0) return true;
	let properties = new ExpressSet<unknown>();
	const n = hiIndex(relations) as number;
	for (const i of expressRange(1, n + 1)) {
		const rel = expressGetItem(relations, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		const definition = expressGetAttr(rel, "RelatingPropertyDefinition", INDETERMINATE);
		if (typeOfAttr(definition).has("ifc4x3_add2.ifcpropertysetdefinition")) {
			properties = properties.plus(definition);
		} else if (typeOfAttr(definition).has("ifc4x3_add2.ifcpropertysetdefinitionset")) {
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
 * Python: `IfcCorrectDimensions(m, dim)` (real source line 13256) -- a 29-branch
 * `IfcUnitEnum`-keyed dispatch table, independently confirmed BYTE-IDENTICAL to
 * `IFC4.py`'s own version (line 11439) via direct `diff`. See this chunk's own header
 * comment.
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

// =============================================================================
// SCOPE = 'entity' rules, real ADD2 file order.
// =============================================================================

// `IfcGeometricRepresentationSubContext_NoCoordOperation` (line 8643): `sizeof(
// HasCoordinateOperation) == 0`.
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

// `IfcGeometricRepresentationSubContext_ParentNoSub` (line 8652): `not
// IfcGeometricRepresentationSubContext in typeof(ParentContext)`.
const IfcGeometricRepresentationSubContext_ParentNoSub = entityRule(
	"IfcGeometricRepresentationSubContext",
	"ParentNoSub",
	(self) => {
		const parentContext = expressGetAttr(self, "ParentContext", INDETERMINATE);
		assertWhereRule(
			!typeOfAttr(parentContext).has("ifc4x3_add2.ifcgeometricrepresentationsubcontext"),
			"IfcGeometricRepresentationSubContext.ParentContext must not itself be an IfcGeometricRepresentationSubContext.",
		);
	},
);

// `IfcGeometricRepresentationSubContext_UserTargetProvided` (line 8662): `TargetView !=
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

// `IfcGeometricSet_ConsistentDim` (line 8689): every `Elements` member shares the first
// member's own `Dim`.
const IfcGeometricSet_ConsistentDim = entityRule("IfcGeometricSet", "ConsistentDim", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "Elements", "Dim"),
		"IfcGeometricSet: every Elements member must share the same Dim as the first.",
	);
});

// `IfcGeotechnicalStratum_CorrectPredefinedType` (line 8703). **Genuinely new in ADD2** --
// see this chunk's own header comment: `IfcGeotechnicalStratum` is a wholly new entity,
// confirmed absent from `IFC4.py`/`generated/ifc4.d.ts`.
const IfcGeotechnicalStratum_CorrectPredefinedType = entityRule(
	"IfcGeotechnicalStratum",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcGeotechnicalStratum: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcGridAxis_WR1` (line 8712): `AxisCurve.Dim == 2` -- the `attrDimEquals` shape.
const IfcGridAxis_WR1 = entityRule("IfcGridAxis", "WR1", (self) => {
	assertWhereRule(attrDimEquals(self, "AxisCurve", 2), "IfcGridAxis.AxisCurve.Dim must equal 2.");
});

// `IfcGridAxis_WR2` (line 8722): `(sizeof(PartOfU) == 1) ^ (sizeof(PartOfV) == 1) ^
// (sizeof(PartOfW) == 1)` -- real EXPRESS `^` chained left-to-right (`triXor`, imported
// directly from `runtimeShim.ts`). **Disclosed subtlety, not a bug, reconfirmed from
// `whereRules/ifc4.ts`'s own identical `IfcGridAxis_WR2` disclosure**: a 3-way chained XOR
// is true for an ODD number of true operands (1 or 3), not literally "exactly one".
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

// `IfcHeatExchanger_CorrectPredefinedType` (line 8731).
const IfcHeatExchanger_CorrectPredefinedType = entityRule("IfcHeatExchanger", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcHeatExchanger: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcHeatExchanger_CorrectTypeAssigned` (line 8741).
const IfcHeatExchanger_CorrectTypeAssigned = entityRule("IfcHeatExchanger", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcHeatExchangerType"),
		"IfcHeatExchanger: if IsTypedBy is given, its RelatingType must be an IfcHeatExchangerType.",
	);
});

// `IfcHeatExchangerType_CorrectPredefinedType` (line 8751).
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

// `IfcHumidifier_CorrectPredefinedType` (line 8761).
const IfcHumidifier_CorrectPredefinedType = entityRule("IfcHumidifier", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcHumidifier: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcHumidifier_CorrectTypeAssigned` (line 8771).
const IfcHumidifier_CorrectTypeAssigned = entityRule("IfcHumidifier", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcHumidifierType"),
		"IfcHumidifier: if IsTypedBy is given, its RelatingType must be an IfcHumidifierType.",
	);
});

// `IfcHumidifierType_CorrectPredefinedType` (line 8781).
const IfcHumidifierType_CorrectPredefinedType = entityRule("IfcHumidifierType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcHumidifierType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcIShapeProfileDef_ValidFilletRadius` (line 8791): `not exists(FilletRadius) or
// (FilletRadius <= (OverallWidth - WebThickness) / 2.0 and FilletRadius <= (OverallDepth -
// 2.0 * FlangeThickness) / 2.0)`. **Real ADD2 file order differs from IFC4's own** (ADD2:
// FilletRadius, FlangeThickness, WebThickness; IFC4: FlangeThickness, WebThickness,
// FilletRadius) -- preserved as ADD2's own real order, matching this file's own
// established "real file order has shifted" precedent (chunk 1's own header comment).
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

// `IfcIShapeProfileDef_ValidFlangeThickness` (line 8802): `2.0 * FlangeThickness < OverallDepth`.
const IfcIShapeProfileDef_ValidFlangeThickness = entityRule("IfcIShapeProfileDef", "ValidFlangeThickness", (self) => {
	const overallDepth = expressGetAttr(self, "OverallDepth", INDETERMINATE);
	const flangeThickness = expressGetAttr(self, "FlangeThickness", INDETERMINATE) as number;
	assertWhereRule(
		triLt(2.0 * flangeThickness, overallDepth),
		"IfcIShapeProfileDef: 2 * FlangeThickness must be less than OverallDepth.",
	);
});

// `IfcIShapeProfileDef_ValidWebThickness` (line 8812): `WebThickness < OverallWidth`.
const IfcIShapeProfileDef_ValidWebThickness = entityRule("IfcIShapeProfileDef", "ValidWebThickness", (self) => {
	const overallWidth = expressGetAttr(self, "OverallWidth", INDETERMINATE);
	const webThickness = expressGetAttr(self, "WebThickness", INDETERMINATE);
	assertWhereRule(
		triLt(webThickness, overallWidth),
		"IfcIShapeProfileDef.WebThickness must be less than OverallWidth.",
	);
});

// `IfcImpactProtectionDevice_CorrectPredefinedType` (line 8822). **Genuinely new in ADD2**
// -- `IfcImpactProtectionDevice` is a wholly new entity (confirmed absent from `IFC4.py`/
// `generated/ifc4.d.ts`).
const IfcImpactProtectionDevice_CorrectPredefinedType = entityRule(
	"IfcImpactProtectionDevice",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcImpactProtectionDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcImpactProtectionDevice_CorrectTypeAssigned` (line 8832).
const IfcImpactProtectionDevice_CorrectTypeAssigned = entityRule(
	"IfcImpactProtectionDevice",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcImpactProtectionDeviceType"),
			"IfcImpactProtectionDevice: if IsTypedBy is given, its RelatingType must be an IfcImpactProtectionDeviceType.",
		);
	},
);

// `IfcImpactProtectionDeviceType_CorrectPredefinedType` (line 8842).
const IfcImpactProtectionDeviceType_CorrectPredefinedType = entityRule(
	"IfcImpactProtectionDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcImpactProtectionDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcIndexedPolyCurve_Consecutive` (line 8864): `not exists(Segments) or
// IfcConsecutiveSegments(Segments)`. **Genuine schema-evolution finding** -- see this
// chunk's own header comment: ADD2 changed the guard from IFC4's own `sizeof(Segments) ==
// 0 or ...` to `not exists(Segments) or ...`, a real behavioral fix for the
// altogether-absent case.
const IfcIndexedPolyCurve_Consecutive = entityRule("IfcIndexedPolyCurve", "Consecutive", (self) => {
	const segments = expressGetAttr(self, "Segments", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(segments), () => ifcConsecutiveSegments(segments)),
		"IfcIndexedPolyCurve: if Segments is given (non-empty), consecutive segments must share their common point index.",
	);
});

// `IfcInterceptor_CorrectPredefinedType` (line 8874).
const IfcInterceptor_CorrectPredefinedType = entityRule("IfcInterceptor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcInterceptor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcInterceptor_CorrectTypeAssigned` (line 8884).
const IfcInterceptor_CorrectTypeAssigned = entityRule("IfcInterceptor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcInterceptorType"),
		"IfcInterceptor: if IsTypedBy is given, its RelatingType must be an IfcInterceptorType.",
	);
});

// `IfcInterceptorType_CorrectPredefinedType` (line 8894).
const IfcInterceptorType_CorrectPredefinedType = entityRule("IfcInterceptorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcInterceptorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcIntersectionCurve_DistinctSurfaces` (line 8904): `IfcAssociatedSurface(
// AssociatedGeometry[1]) != IfcAssociatedSurface(AssociatedGeometry[2])`. **Real ADD2 file
// order differs from IFC4's own** (ADD2: DistinctSurfaces before TwoPCurves; IFC4:
// TwoPCurves before DistinctSurfaces) -- preserved as ADD2's own real order.
const IfcIntersectionCurve_DistinctSurfaces = entityRule("IfcIntersectionCurve", "DistinctSurfaces", (self) => {
	const associatedGeometry = expressGetAttr(self, "AssociatedGeometry", INDETERMINATE);
	const first = expressGetItem(associatedGeometry, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const second = expressGetItem(associatedGeometry, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		triNe(ifcAssociatedSurface(first), ifcAssociatedSurface(second)),
		"IfcIntersectionCurve: the two AssociatedGeometry members' BasisSurface must be distinct.",
	);
});

// `IfcIntersectionCurve_TwoPCurves` (line 8913): `sizeof(AssociatedGeometry) == 2`.
const IfcIntersectionCurve_TwoPCurves = entityRule("IfcIntersectionCurve", "TwoPCurves", (self) => {
	assertWhereRule(
		triEq(sizeof(expressGetAttr(self, "AssociatedGeometry", INDETERMINATE)), 2),
		"IfcIntersectionCurve.AssociatedGeometry must have exactly 2 members.",
	);
});

// `IfcJunctionBox_CorrectPredefinedType` (line 8922).
const IfcJunctionBox_CorrectPredefinedType = entityRule("IfcJunctionBox", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcJunctionBox: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcJunctionBox_CorrectTypeAssigned` (line 8932).
const IfcJunctionBox_CorrectTypeAssigned = entityRule("IfcJunctionBox", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcJunctionBoxType"),
		"IfcJunctionBox: if IsTypedBy is given, its RelatingType must be an IfcJunctionBoxType.",
	);
});

// `IfcJunctionBoxType_CorrectPredefinedType` (line 8942).
const IfcJunctionBoxType_CorrectPredefinedType = entityRule("IfcJunctionBoxType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcJunctionBoxType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcKerb_CorrectPredefinedType` (line 8952). **Genuinely new in ADD2** -- `IfcKerb` is a
// wholly new entity (confirmed absent from `IFC4.py`/`generated/ifc4.d.ts`).
const IfcKerb_CorrectPredefinedType = entityRule("IfcKerb", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcKerb: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcKerb_CorrectTypeAssigned` (line 8962).
const IfcKerb_CorrectTypeAssigned = entityRule("IfcKerb", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcKerbType"),
		"IfcKerb: if IsTypedBy is given, its RelatingType must be an IfcKerbType.",
	);
});

// `IfcKerbType_CorrectPredefinedType` (line 8972).
const IfcKerbType_CorrectPredefinedType = entityRule("IfcKerbType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcKerbType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcLShapeProfileDef_ValidThickness` (line 8982): `Thickness < Depth and (not
// exists(Width) or Thickness < Width)`.
const IfcLShapeProfileDef_ValidThickness = entityRule("IfcLShapeProfileDef", "ValidThickness", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE);
	const width = expressGetAttr(self, "Width", INDETERMINATE);
	const thickness = expressGetAttr(self, "Thickness", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLt(thickness, depth), () => pyOr(!exists(width), () => triLt(thickness, width))),
		"IfcLShapeProfileDef: Thickness must be less than Depth, and less than Width if Width is given.",
	);
});

// `IfcLaborResource_CorrectPredefinedType` (line 8993).
const IfcLaborResource_CorrectPredefinedType = entityRule("IfcLaborResource", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcLaborResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcLaborResourceType_CorrectPredefinedType` (line 9003). Escapes to `ResourceType`, not
// `ElementType` -- already supported by `correctPredefinedType`'s own existing
// `escapeAttrName` parameter, no new shape.
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

// `IfcLamp_CorrectPredefinedType` (line 9013).
const IfcLamp_CorrectPredefinedType = entityRule("IfcLamp", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcLamp: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcLamp_CorrectTypeAssigned` (line 9023).
const IfcLamp_CorrectTypeAssigned = entityRule("IfcLamp", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcLampType"),
		"IfcLamp: if IsTypedBy is given, its RelatingType must be an IfcLampType.",
	);
});

// `IfcLampType_CorrectPredefinedType` (line 9033).
const IfcLampType_CorrectPredefinedType = entityRule("IfcLampType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcLampType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcLightFixture_CorrectPredefinedType` (line 9043).
const IfcLightFixture_CorrectPredefinedType = entityRule("IfcLightFixture", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcLightFixture: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcLightFixture_CorrectTypeAssigned` (line 9053).
const IfcLightFixture_CorrectTypeAssigned = entityRule("IfcLightFixture", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcLightFixtureType"),
		"IfcLightFixture: if IsTypedBy is given, its RelatingType must be an IfcLightFixtureType.",
	);
});

// `IfcLightFixtureType_CorrectPredefinedType` (line 9063).
const IfcLightFixtureType_CorrectPredefinedType = entityRule("IfcLightFixtureType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcLightFixtureType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcLine_SameDim` (line 9073): `Dir.Dim == Pnt.Dim`.
const IfcLine_SameDim = entityRule("IfcLine", "SameDim", (self) => {
	const pnt = expressGetAttr(self, "Pnt", INDETERMINATE);
	const dir = expressGetAttr(self, "Dir", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(dir, "Dim", INDETERMINATE), expressGetAttr(pnt, "Dim", INDETERMINATE)),
		"IfcLine: Dir.Dim must equal Pnt.Dim.",
	);
});

// `IfcLiquidTerminal_CorrectPredefinedType` (line 9082). **Genuinely new in ADD2** --
// `IfcLiquidTerminal` is a wholly new entity (confirmed absent from `IFC4.py`/
// `generated/ifc4.d.ts`).
const IfcLiquidTerminal_CorrectPredefinedType = entityRule("IfcLiquidTerminal", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcLiquidTerminal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcLiquidTerminal_CorrectTypeAssigned` (line 9092).
const IfcLiquidTerminal_CorrectTypeAssigned = entityRule("IfcLiquidTerminal", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcLiquidTerminalType"),
		"IfcLiquidTerminal: if IsTypedBy is given, its RelatingType must be an IfcLiquidTerminalType.",
	);
});

// `IfcLiquidTerminalType_CorrectPredefinedType` (line 9102).
const IfcLiquidTerminalType_CorrectPredefinedType = entityRule(
	"IfcLiquidTerminalType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcLiquidTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcLocalPlacement_WR21` (line 9112): `IfcCorrectLocalPlacement(RelativePlacement, PlacementRelTo)`.
const IfcLocalPlacement_WR21 = entityRule("IfcLocalPlacement", "WR21", (self) => {
	const placementRelTo = expressGetAttr(self, "PlacementRelTo", INDETERMINATE);
	const relativePlacement = expressGetAttr(self, "RelativePlacement", INDETERMINATE);
	assertWhereRule(
		ifcCorrectLocalPlacement(relativePlacement, placementRelTo),
		"IfcLocalPlacement: RelativePlacement must be consistent with PlacementRelTo (see IfcCorrectLocalPlacement).",
	);
});

// `IfcMapConversion_TargetCRSOnlyProjected` (line 9122): `IfcProjectedCRS in
// typeof(TargetCRS)`. **A genuinely NEW rule on a pre-existing IFC4 entity** -- see this
// chunk's own header comment: `IfcMapConversion` itself is unchanged between schemas
// (`generated/ifc4.d.ts`/`generated/ifc4x3.d.ts` confirmed identical), ADD2 simply adds
// this new constraint.
const IfcMapConversion_TargetCRSOnlyProjected = entityRule("IfcMapConversion", "TargetCRSOnlyProjected", (self) => {
	assertWhereRule(
		typeOfAttr(expressGetAttr(self, "TargetCRS", INDETERMINATE)).has("ifc4x3_add2.ifcprojectedcrs"),
		"IfcMapConversion.TargetCRS must be an IfcProjectedCRS.",
	);
});

// `IfcMarineFacility_CorrectPredefinedType` (line 9131). **Genuinely new in ADD2** --
// `IfcMarineFacility` is a wholly new entity (confirmed absent from `IFC4.py`/
// `generated/ifc4.d.ts`). No `_CorrectTypeAssigned`/`*Type` sibling rule exists for this
// entity in this chunk's own range (a plain occurrence-only check).
const IfcMarineFacility_CorrectPredefinedType = entityRule("IfcMarineFacility", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMarineFacility: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMarinePart_CorrectPredefinedType` (line 9141). **Genuinely new in ADD2** --
// `IfcMarinePart` is a wholly new entity, same shape as `IfcMarineFacility` immediately
// above.
const IfcMarinePart_CorrectPredefinedType = entityRule("IfcMarinePart", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMarinePart: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMaterialDefinitionRepresentation_OnlyStyledRepresentations` (line 9151): `sizeof([
// temp for temp in Representations if not IfcStyledRepresentation in typeof(temp)]) == 0`.
const IfcMaterialDefinitionRepresentation_OnlyStyledRepresentations = entityRule(
	"IfcMaterialDefinitionRepresentation",
	"OnlyStyledRepresentations",
	(self) => {
		const representations = asList<EntityInstance>(expressGetAttr(self, "Representations", INDETERMINATE));
		const violating = representations.filter(
			(temp) => !typeOfAttr(temp).has("ifc4x3_add2.ifcstyledrepresentation"),
		).length;
		assertWhereRule(
			violating === 0,
			"IfcMaterialDefinitionRepresentation: every Representations member must be an IfcStyledRepresentation.",
		);
	},
);

// `IfcMaterialLayer_NormalizedPriority` (line 9161): `not exists(Priority) or 0 <= Priority <= 100`.
const IfcMaterialLayer_NormalizedPriority = entityRule("IfcMaterialLayer", "NormalizedPriority", (self) => {
	const priority = expressGetAttr(self, "Priority", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(priority), () => pyAnd(triLe(0, priority), () => triLe(priority, 100))),
		"IfcMaterialLayer: if Priority is given, it must be in [0, 100].",
	);
});

// `IfcMaterialProfile_NormalizedPriority` (line 9174): byte-identical shape to
// `IfcMaterialLayer_NormalizedPriority` above (only the entity name differs).
const IfcMaterialProfile_NormalizedPriority = entityRule("IfcMaterialProfile", "NormalizedPriority", (self) => {
	const priority = expressGetAttr(self, "Priority", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(priority), () => pyAnd(triLe(0, priority), () => triLe(priority, 100))),
		"IfcMaterialProfile: if Priority is given, it must be in [0, 100].",
	);
});

// `IfcMechanicalFastener_CorrectPredefinedType` (line 9187).
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

// `IfcMechanicalFastener_CorrectTypeAssigned` (line 9197).
const IfcMechanicalFastener_CorrectTypeAssigned = entityRule("IfcMechanicalFastener", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMechanicalFastenerType"),
		"IfcMechanicalFastener: if IsTypedBy is given, its RelatingType must be an IfcMechanicalFastenerType.",
	);
});

// `IfcMechanicalFastenerType_CorrectPredefinedType` (line 9207).
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

// `IfcMedicalDevice_CorrectPredefinedType` (line 9217).
const IfcMedicalDevice_CorrectPredefinedType = entityRule("IfcMedicalDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMedicalDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMedicalDevice_CorrectTypeAssigned` (line 9227).
const IfcMedicalDevice_CorrectTypeAssigned = entityRule("IfcMedicalDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMedicalDeviceType"),
		"IfcMedicalDevice: if IsTypedBy is given, its RelatingType must be an IfcMedicalDeviceType.",
	);
});

// `IfcMedicalDeviceType_CorrectPredefinedType` (line 9237).
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

// `IfcMember_CorrectPredefinedType` (line 9247). **`IfcMemberStandardCase` (real IFC4
// line 7987) has been REMOVED from ADD2 entirely** -- see this chunk's own header comment
// (the 4th such vanished-entity finding).
const IfcMember_CorrectPredefinedType = entityRule("IfcMember", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMember: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMember_CorrectTypeAssigned` (line 9257).
const IfcMember_CorrectTypeAssigned = entityRule("IfcMember", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMemberType"),
		"IfcMember: if IsTypedBy is given, its RelatingType must be an IfcMemberType.",
	);
});

// `IfcMemberType_CorrectPredefinedType` (line 9267).
const IfcMemberType_CorrectPredefinedType = entityRule("IfcMemberType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcMemberType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcMobileTelecommunicationsAppliance_CorrectPredefinedType` (line 9280). **Genuinely
// new in ADD2** -- `IfcMobileTelecommunicationsAppliance` is a wholly new entity
// (confirmed absent from `IFC4.py`/`generated/ifc4.d.ts`).
const IfcMobileTelecommunicationsAppliance_CorrectPredefinedType = entityRule(
	"IfcMobileTelecommunicationsAppliance",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcMobileTelecommunicationsAppliance: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcMobileTelecommunicationsAppliance_CorrectTypeAssigned` (line 9290).
const IfcMobileTelecommunicationsAppliance_CorrectTypeAssigned = entityRule(
	"IfcMobileTelecommunicationsAppliance",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcMobileTelecommunicationsApplianceType"),
			"IfcMobileTelecommunicationsAppliance: if IsTypedBy is given, its RelatingType must be an IfcMobileTelecommunicationsApplianceType.",
		);
	},
);

// `IfcMobileTelecommunicationsApplianceType_CorrectPredefinedType` (line 9300).
const IfcMobileTelecommunicationsApplianceType_CorrectPredefinedType = entityRule(
	"IfcMobileTelecommunicationsApplianceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcMobileTelecommunicationsApplianceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcMooringDevice_CorrectPredefinedType` (line 9310). **Genuinely new in ADD2** --
// `IfcMooringDevice` is a wholly new entity (confirmed absent from `IFC4.py`/
// `generated/ifc4.d.ts`).
const IfcMooringDevice_CorrectPredefinedType = entityRule("IfcMooringDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMooringDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMooringDevice_CorrectTypeAssigned` (line 9320).
const IfcMooringDevice_CorrectTypeAssigned = entityRule("IfcMooringDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMooringDeviceType"),
		"IfcMooringDevice: if IsTypedBy is given, its RelatingType must be an IfcMooringDeviceType.",
	);
});

// `IfcMooringDeviceType_CorrectPredefinedType` (line 9330).
const IfcMooringDeviceType_CorrectPredefinedType = entityRule(
	"IfcMooringDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcMooringDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcMotorConnection_CorrectPredefinedType` (line 9340).
const IfcMotorConnection_CorrectPredefinedType = entityRule("IfcMotorConnection", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcMotorConnection: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcMotorConnection_CorrectTypeAssigned` (line 9350).
const IfcMotorConnection_CorrectTypeAssigned = entityRule("IfcMotorConnection", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcMotorConnectionType"),
		"IfcMotorConnection: if IsTypedBy is given, its RelatingType must be an IfcMotorConnectionType.",
	);
});

// `IfcMotorConnectionType_CorrectPredefinedType` (line 9360).
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

// `IfcNamedUnit_WR1` (line 9370): `IfcCorrectDimensions(UnitType, Dimensions)`.
const IfcNamedUnit_WR1 = entityRule("IfcNamedUnit", "WR1", (self) => {
	assertWhereRule(
		ifcCorrectDimensions(
			expressGetAttr(self, "UnitType", INDETERMINATE),
			expressGetAttr(self, "Dimensions", INDETERMINATE),
		),
		"IfcNamedUnit: Dimensions must match the real-world dimensional exponents of UnitType (see IfcCorrectDimensions).",
	);
});

// `IfcNavigationElement_CorrectPredefinedType` (line 9380). **Genuinely new in ADD2** --
// `IfcNavigationElement` is a wholly new entity (confirmed absent from `IFC4.py`/
// `generated/ifc4.d.ts`).
const IfcNavigationElement_CorrectPredefinedType = entityRule(
	"IfcNavigationElement",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcNavigationElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcNavigationElement_CorrectTypeAssigned` (line 9390).
const IfcNavigationElement_CorrectTypeAssigned = entityRule("IfcNavigationElement", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcNavigationElementType"),
		"IfcNavigationElement: if IsTypedBy is given, its RelatingType must be an IfcNavigationElementType.",
	);
});

// `IfcNavigationElementType_CorrectPredefinedType` (line 9400).
const IfcNavigationElementType_CorrectPredefinedType = entityRule(
	"IfcNavigationElementType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcNavigationElementType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcObject_UniquePropertySetNames` (line 9410): `sizeof(IsDefinedBy) == 0 or
// IfcUniqueDefinitionNames(IsDefinedBy)`.
const IfcObject_UniquePropertySetNames = entityRule("IfcObject", "UniquePropertySetNames", (self) => {
	const isDefinedBy = expressGetAttr(self, "IsDefinedBy", INDETERMINATE);
	assertWhereRule(
		pyOr(triEq(sizeof(isDefinedBy), 0), () => ifcUniqueDefinitionNames(isDefinedBy)),
		"IfcObject: every IsDefinedBy relationship's own property/quantity set must have a unique Name.",
	);
});

// `IfcObjective_WR21` (line 9420): `ObjectiveQualifier != USERDEFINED or (ObjectiveQualifier
// == USERDEFINED and exists(UserDefinedQualifier))`.
const IfcObjective_WR21 = entityRule("IfcObjective", "WR21", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "ObjectiveQualifier", "UserDefinedQualifier"),
		"IfcObjective: if ObjectiveQualifier is USERDEFINED, UserDefinedQualifier must be given.",
	);
});

// `IfcOccupant_WR31` (line 9430): `not PredefinedType == USERDEFINED or exists(ObjectType)`
// -- see `whereRules/ifc4.ts`'s own header comment for why this is NOT force-fit into
// `correctPredefinedType`/`userDefinedOrHasAttribute` (no leading `not exists(...)` guard,
// different logical shape, real schema/naming quirk).
const IfcOccupant_WR31 = entityRule("IfcOccupant", "WR31", (self) => {
	const predefinedType = expressGetAttr(self, "PredefinedType", INDETERMINATE);
	assertWhereRule(
		pyOr(pyNot(triEq(predefinedType, "USERDEFINED")), () => exists(expressGetAttr(self, "ObjectType", INDETERMINATE))),
		"IfcOccupant: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcOffsetCurve2D_DimIs2D` (line 9440): `BasisCurve.Dim == 2`.
const IfcOffsetCurve2D_DimIs2D = entityRule("IfcOffsetCurve2D", "DimIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "BasisCurve", 2), "IfcOffsetCurve2D.BasisCurve.Dim must equal 2.");
});

// `IfcOffsetCurve3D_DimIs2D` (line 9450): `BasisCurve.Dim == 3`. **Naming quirk,
// RECONFIRMED from `whereRules/ifc4.ts`'s own already-disclosed finding for this identical
// rule (not a bug)** -- see this chunk's own header comment: the real `RULE_NAME` says
// "DimIs2D" but the real body checks `== 3`, confirmed directly against this chunk's own
// real ADD2 source, byte-identical to `IFC4.py`'s own version.
const IfcOffsetCurve3D_DimIs2D = entityRule("IfcOffsetCurve3D", "DimIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "BasisCurve", 3), "IfcOffsetCurve3D.BasisCurve.Dim must equal 3.");
});

// `IfcOpenCrossProfileDef_CorrectProfileType` (line 9460): `ProfileType == CURVE`.
// **Genuinely new in ADD2** -- `IfcOpenCrossProfileDef` is a wholly new entity (an
// alignment/road cross-section profile, confirmed absent from `IFC4.py`/
// `generated/ifc4.d.ts`).
const IfcOpenCrossProfileDef_CorrectProfileType = entityRule("IfcOpenCrossProfileDef", "CorrectProfileType", (self) => {
	assertWhereRule(
		triEq(expressGetAttr(self, "ProfileType", INDETERMINATE), "CURVE"),
		"IfcOpenCrossProfileDef.ProfileType must be CURVE.",
	);
});

// `IfcOpenCrossProfileDef_CorrespondingSlopeWidths` (line 9470): `sizeof(Slopes) == sizeof(Widths)`.
const IfcOpenCrossProfileDef_CorrespondingSlopeWidths = entityRule(
	"IfcOpenCrossProfileDef",
	"CorrespondingSlopeWidths",
	(self) => {
		const widths = expressGetAttr(self, "Widths", INDETERMINATE);
		const slopes = expressGetAttr(self, "Slopes", INDETERMINATE);
		assertWhereRule(
			triEq(sizeof(slopes), sizeof(widths)),
			"IfcOpenCrossProfileDef: Slopes and Widths must have the same number of members.",
		);
	},
);

// `IfcOpenCrossProfileDef_CorrespondingTags` (line 9480): `not exists(Tags) or sizeof(Tags)
// == sizeof(Slopes) + 1`.
const IfcOpenCrossProfileDef_CorrespondingTags = entityRule("IfcOpenCrossProfileDef", "CorrespondingTags", (self) => {
	const slopes = expressGetAttr(self, "Slopes", INDETERMINATE);
	const tags = expressGetAttr(self, "Tags", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(tags), () => triEq(sizeof(tags), (sizeof(slopes) as number) + 1)),
		"IfcOpenCrossProfileDef: if Tags is given, it must have exactly one more member than Slopes.",
	);
});

// `IfcOpeningElement_CorrectPredefinedType` (line 9491). **A genuinely NEW rule on a
// pre-existing IFC4 entity** -- see this chunk's own header comment: `IfcOpeningElement`
// itself is unchanged between schemas, ADD2 simply adds this ordinary occurrence-shape
// check IFC4 never had.
const IfcOpeningElement_CorrectPredefinedType = entityRule("IfcOpeningElement", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcOpeningElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcOrientedEdge_EdgeElementNotOriented` (line 9501): `not IfcOrientedEdge in typeof(EdgeElement)`.
const IfcOrientedEdge_EdgeElementNotOriented = entityRule("IfcOrientedEdge", "EdgeElementNotOriented", (self) => {
	const edgeElement = expressGetAttr(self, "EdgeElement", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(edgeElement).has("ifc4x3_add2.ifcorientededge"),
		"IfcOrientedEdge.EdgeElement must not itself be an IfcOrientedEdge.",
	);
});

// `IfcOutlet_CorrectPredefinedType` (line 9511).
const IfcOutlet_CorrectPredefinedType = entityRule("IfcOutlet", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcOutlet: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcOutlet_CorrectTypeAssigned` (line 9521).
const IfcOutlet_CorrectTypeAssigned = entityRule("IfcOutlet", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcOutletType"),
		"IfcOutlet: if IsTypedBy is given, its RelatingType must be an IfcOutletType.",
	);
});

// `IfcOutletType_CorrectPredefinedType` (line 9531).
const IfcOutletType_CorrectPredefinedType = entityRule("IfcOutletType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcOutletType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcOwnerHistory_CorrectChangeAction` (line 9541): `exists(LastModifiedDate) or (not
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

// `IfcPath_IsContinuous` (line 9552): `IfcPathHeadToTail(self)`.
const IfcPath_IsContinuous = entityRule("IfcPath", "IsContinuous", (self) => {
	assertWhereRule(ifcPathHeadToTail(self), "IfcPath: EdgeList must form a connected head-to-tail path.");
});

// `IfcPavement_CorrectPredefinedType` (line 9562). **Genuinely new in ADD2** --
// `IfcPavement` is a wholly new entity (confirmed absent from `IFC4.py`/
// `generated/ifc4.d.ts`).
const IfcPavement_CorrectPredefinedType = entityRule("IfcPavement", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPavement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPavement_CorrectTypeAssigned` (line 9572).
const IfcPavement_CorrectTypeAssigned = entityRule("IfcPavement", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPavementType"),
		"IfcPavement: if IsTypedBy is given, its RelatingType must be an IfcPavementType.",
	);
});

// `IfcPavementType_CorrectPredefinedType` (line 9582).
const IfcPavementType_CorrectPredefinedType = entityRule("IfcPavementType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPavementType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPcurve_DimIs2D` (line 9592): `ReferenceCurve.Dim == 2`.
const IfcPcurve_DimIs2D = entityRule("IfcPcurve", "DimIs2D", (self) => {
	assertWhereRule(attrDimEquals(self, "ReferenceCurve", 2), "IfcPcurve.ReferenceCurve.Dim must equal 2.");
});

// `IfcPerson_IdentifiablePerson` (line 9601): `exists(Identification) or
// exists(FamilyName) or exists(GivenName)`.
const IfcPerson_IdentifiablePerson = entityRule("IfcPerson", "IdentifiablePerson", (self) => {
	const identification = expressGetAttr(self, "Identification", INDETERMINATE);
	const familyName = expressGetAttr(self, "FamilyName", INDETERMINATE);
	const givenName = expressGetAttr(self, "GivenName", INDETERMINATE);
	assertWhereRule(
		exists(identification) || exists(familyName) || exists(givenName),
		"IfcPerson: at least one of Identification, FamilyName, GivenName must be given.",
	);
});

// `IfcPerson_ValidSetOfNames` (line 9611): `not exists(MiddleNames) or exists(FamilyName) or
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

// `IfcPhysicalComplexQuantity_NoSelfReference` (line 9623): `sizeof([temp for temp in
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

// `IfcPhysicalComplexQuantity_UniqueQuantityNames` (line 9633): `IfcUniqueQuantityNames(HasQuantities)`.
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

// `IfcPile_CorrectPredefinedType` (line 9643).
const IfcPile_CorrectPredefinedType = entityRule("IfcPile", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPile: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPile_CorrectTypeAssigned` (line 9653).
const IfcPile_CorrectTypeAssigned = entityRule("IfcPile", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPileType"),
		"IfcPile: if IsTypedBy is given, its RelatingType must be an IfcPileType.",
	);
});

// `IfcPileType_CorrectPredefinedType` (line 9663).
const IfcPileType_CorrectPredefinedType = entityRule("IfcPileType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPileType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPipeFitting_CorrectPredefinedType` (line 9673).
const IfcPipeFitting_CorrectPredefinedType = entityRule("IfcPipeFitting", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPipeFitting: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPipeFitting_CorrectTypeAssigned` (line 9683).
const IfcPipeFitting_CorrectTypeAssigned = entityRule("IfcPipeFitting", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPipeFittingType"),
		"IfcPipeFitting: if IsTypedBy is given, its RelatingType must be an IfcPipeFittingType.",
	);
});

// `IfcPipeFittingType_CorrectPredefinedType` (line 9693).
const IfcPipeFittingType_CorrectPredefinedType = entityRule("IfcPipeFittingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPipeFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPipeSegment_CorrectPredefinedType` (line 9703).
const IfcPipeSegment_CorrectPredefinedType = entityRule("IfcPipeSegment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPipeSegment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPipeSegment_CorrectTypeAssigned` (line 9713).
const IfcPipeSegment_CorrectTypeAssigned = entityRule("IfcPipeSegment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPipeSegmentType"),
		"IfcPipeSegment: if IsTypedBy is given, its RelatingType must be an IfcPipeSegmentType.",
	);
});

// `IfcPipeSegmentType_CorrectPredefinedType` (line 9723).
const IfcPipeSegmentType_CorrectPredefinedType = entityRule("IfcPipeSegmentType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPipeSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPixelTexture_MinPixelInS` (line 9733): `Width >= 1`.
const IfcPixelTexture_MinPixelInS = entityRule("IfcPixelTexture", "MinPixelInS", (self) => {
	assertWhereRule(triGe(expressGetAttr(self, "Width", INDETERMINATE), 1), "IfcPixelTexture.Width must be >= 1.");
});

// `IfcPixelTexture_MinPixelInT` (line 9743): `Height >= 1`.
const IfcPixelTexture_MinPixelInT = entityRule("IfcPixelTexture", "MinPixelInT", (self) => {
	assertWhereRule(triGe(expressGetAttr(self, "Height", INDETERMINATE), 1), "IfcPixelTexture.Height must be >= 1.");
});

// `IfcPixelTexture_NumberOfColours` (line 9753): `1 <= ColourComponents <= 4`.
const IfcPixelTexture_NumberOfColours = entityRule("IfcPixelTexture", "NumberOfColours", (self) => {
	const colourComponents = expressGetAttr(self, "ColourComponents", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLe(1, colourComponents), () => triLe(colourComponents, 4)),
		"IfcPixelTexture.ColourComponents must be in [1, 4].",
	);
});

// `IfcPixelTexture_PixelAsByteAndSameLength` (line 9763): `sizeof([temp for temp in Pixel if
// blength(temp) % 8 == 0 and blength(temp) == blength(Pixel[0])]) == sizeof(Pixel)`. **Real
// ADD2 file order differs from IFC4's own** (ADD2: PixelAsByteAndSameLength before
// SizeOfPixelList; IFC4: SizeOfPixelList before PixelAsByteAndSameLength).
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

// `IfcPixelTexture_SizeOfPixelList` (line 9775): `sizeof(Pixel) == Width * Height`.
const IfcPixelTexture_SizeOfPixelList = entityRule("IfcPixelTexture", "SizeOfPixelList", (self) => {
	const width = expressGetAttr(self, "Width", INDETERMINATE) as number;
	const height = expressGetAttr(self, "Height", INDETERMINATE) as number;
	const pixel = expressGetAttr(self, "Pixel", INDETERMINATE);
	assertWhereRule(triEq(sizeof(pixel), width * height), "IfcPixelTexture: Pixel size must equal Width * Height.");
});

// `IfcPlate_CorrectPredefinedType` (line 9785). **`IfcPlateStandardCase` (real IFC4 line
// 8388) has been REMOVED from ADD2 entirely** -- see this chunk's own header comment (the
// 5th such vanished-entity finding).
const IfcPlate_CorrectPredefinedType = entityRule("IfcPlate", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPlate: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPlate_CorrectTypeAssigned` (line 9795).
const IfcPlate_CorrectTypeAssigned = entityRule("IfcPlate", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPlateType"),
		"IfcPlate: if IsTypedBy is given, its RelatingType must be an IfcPlateType.",
	);
});

// `IfcPlateType_CorrectPredefinedType` (line 9805).
const IfcPlateType_CorrectPredefinedType = entityRule("IfcPlateType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPlateType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcPolyLoop_AllPointsSameDim` (line 9815): every `Polygon` member shares the first
// member's own `Dim`.
const IfcPolyLoop_AllPointsSameDim = entityRule("IfcPolyLoop", "AllPointsSameDim", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "Polygon", "Dim"),
		"IfcPolyLoop: every Polygon member must share the first member's own Dim.",
	);
});

// `IfcPolygonalBoundedHalfSpace_BoundaryDim` (line 9825): `PolygonalBoundary.Dim == 2`.
const IfcPolygonalBoundedHalfSpace_BoundaryDim = entityRule("IfcPolygonalBoundedHalfSpace", "BoundaryDim", (self) => {
	assertWhereRule(
		attrDimEquals(self, "PolygonalBoundary", 2),
		"IfcPolygonalBoundedHalfSpace.PolygonalBoundary.Dim must equal 2.",
	);
});

// `IfcPolygonalBoundedHalfSpace_BoundaryType` (line 9854): `sizeof(typeof(PolygonalBoundary)
// * ['ifc4x3_add2.ifcpolyline', 'ifc4x3_add2.ifccompositecurve',
// 'ifc4x3_add2.ifcindexedpolycurve']) == 1`. **Genuine schema-evolution finding** -- see
// this chunk's own header comment: ADD2 widened this list to also admit
// `IfcIndexedPolyCurve` (IFC4's own version only admits `IfcPolyline`/`IfcCompositeCurve`).
const IfcPolygonalBoundedHalfSpace_BoundaryType = entityRule("IfcPolygonalBoundedHalfSpace", "BoundaryType", (self) => {
	const polygonalBoundary = expressGetAttr(self, "PolygonalBoundary", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(polygonalBoundary).multiply([
			"ifc4x3_add2.ifcpolyline",
			"ifc4x3_add2.ifccompositecurve",
			"ifc4x3_add2.ifcindexedpolycurve",
		]).size === 1,
		"IfcPolygonalBoundedHalfSpace.PolygonalBoundary must be exactly one of IfcPolyline/IfcCompositeCurve/IfcIndexedPolyCurve.",
	);
});

// `IfcPolyline_SameDim` (line 9864): every `Points` member shares the first member's own `Dim`.
const IfcPolyline_SameDim = entityRule("IfcPolyline", "SameDim", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "Points", "Dim"),
		"IfcPolyline: every Points member must share the first member's own Dim.",
	);
});

// `IfcPolynomialCurve_CorrectPositionDim` (line 9874): `(Position.Dim == 2 and not
// exists(CoefficientsZ)) or Position.Dim == 3`. **Genuinely new in ADD2** --
// `IfcPolynomialCurve` is a wholly new entity (a new alignment curve type, confirmed
// absent from `IFC4.py`/`generated/ifc4.d.ts`).
const IfcPolynomialCurve_CorrectPositionDim = entityRule("IfcPolynomialCurve", "CorrectPositionDim", (self) => {
	const position = expressGetAttr(self, "Position", INDETERMINATE);
	const coefficientsZ = expressGetAttr(self, "CoefficientsZ", INDETERMINATE);
	const positionDim = expressGetAttr(position, "Dim", INDETERMINATE);
	assertWhereRule(
		(triEq(positionDim, 2) === true && !exists(coefficientsZ)) || triEq(positionDim, 3) === true,
		"IfcPolynomialCurve: Position.Dim must be 2 (with no CoefficientsZ) or 3.",
	);
});

// `IfcPolynomialCurve_ValidCoefficients` (line 9885): `(exists(CoefficientsX) and
// exists(CoefficientsY)) or (exists(CoefficientsX) and exists(CoefficientsZ)) or
// (exists(CoefficientsY) and exists(CoefficientsZ)) or (exists(CoefficientsX) and
// exists(CoefficientsY) and exists(CoefficientsZ))`.
const IfcPolynomialCurve_ValidCoefficients = entityRule("IfcPolynomialCurve", "ValidCoefficients", (self) => {
	const coefficientsX = expressGetAttr(self, "CoefficientsX", INDETERMINATE);
	const coefficientsY = expressGetAttr(self, "CoefficientsY", INDETERMINATE);
	const coefficientsZ = expressGetAttr(self, "CoefficientsZ", INDETERMINATE);
	const hasX = exists(coefficientsX);
	const hasY = exists(coefficientsY);
	const hasZ = exists(coefficientsZ);
	assertWhereRule(
		(hasX && hasY) || (hasX && hasZ) || (hasY && hasZ) || (hasX && hasY && hasZ),
		"IfcPolynomialCurve: at least two of CoefficientsX/CoefficientsY/CoefficientsZ must be given.",
	);
});

// `IfcPositioningElement_HasPlacement` (line 9897): `exists(ObjectPlacement)`. **Genuinely
// new in ADD2** -- `IfcPositioningElement` is a wholly new entity. See this chunk's own
// header comment for the well-evidenced (not confirmed) hypothesis that this supersedes
// `IfcGrid_HasPlacement`'s own now-removed identical constraint.
const IfcPositioningElement_HasPlacement = entityRule("IfcPositioningElement", "HasPlacement", (self) => {
	assertWhereRule(
		exists(expressGetAttr(self, "ObjectPlacement", INDETERMINATE)),
		"IfcPositioningElement.ObjectPlacement must be given.",
	);
});

registerSchemaRules("IFC4X3_ADD2", [
	IfcGeometricRepresentationSubContext_NoCoordOperation,
	IfcGeometricRepresentationSubContext_ParentNoSub,
	IfcGeometricRepresentationSubContext_UserTargetProvided,
	IfcGeometricSet_ConsistentDim,
	IfcGeotechnicalStratum_CorrectPredefinedType,
	IfcGridAxis_WR1,
	IfcGridAxis_WR2,
	IfcHeatExchanger_CorrectPredefinedType,
	IfcHeatExchanger_CorrectTypeAssigned,
	IfcHeatExchangerType_CorrectPredefinedType,
	IfcHumidifier_CorrectPredefinedType,
	IfcHumidifier_CorrectTypeAssigned,
	IfcHumidifierType_CorrectPredefinedType,
	IfcIShapeProfileDef_ValidFilletRadius,
	IfcIShapeProfileDef_ValidFlangeThickness,
	IfcIShapeProfileDef_ValidWebThickness,
	IfcImpactProtectionDevice_CorrectPredefinedType,
	IfcImpactProtectionDevice_CorrectTypeAssigned,
	IfcImpactProtectionDeviceType_CorrectPredefinedType,
	IfcIndexedPolyCurve_Consecutive,
	IfcInterceptor_CorrectPredefinedType,
	IfcInterceptor_CorrectTypeAssigned,
	IfcInterceptorType_CorrectPredefinedType,
	IfcIntersectionCurve_DistinctSurfaces,
	IfcIntersectionCurve_TwoPCurves,
	IfcJunctionBox_CorrectPredefinedType,
	IfcJunctionBox_CorrectTypeAssigned,
	IfcJunctionBoxType_CorrectPredefinedType,
	IfcKerb_CorrectPredefinedType,
	IfcKerb_CorrectTypeAssigned,
	IfcKerbType_CorrectPredefinedType,
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
	IfcLiquidTerminal_CorrectPredefinedType,
	IfcLiquidTerminal_CorrectTypeAssigned,
	IfcLiquidTerminalType_CorrectPredefinedType,
	IfcLocalPlacement_WR21,
	IfcMapConversion_TargetCRSOnlyProjected,
	IfcMarineFacility_CorrectPredefinedType,
	IfcMarinePart_CorrectPredefinedType,
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
	IfcMemberType_CorrectPredefinedType,
	IfcMobileTelecommunicationsAppliance_CorrectPredefinedType,
	IfcMobileTelecommunicationsAppliance_CorrectTypeAssigned,
	IfcMobileTelecommunicationsApplianceType_CorrectPredefinedType,
	IfcMooringDevice_CorrectPredefinedType,
	IfcMooringDevice_CorrectTypeAssigned,
	IfcMooringDeviceType_CorrectPredefinedType,
	IfcMotorConnection_CorrectPredefinedType,
	IfcMotorConnection_CorrectTypeAssigned,
	IfcMotorConnectionType_CorrectPredefinedType,
	IfcNamedUnit_WR1,
	IfcNavigationElement_CorrectPredefinedType,
	IfcNavigationElement_CorrectTypeAssigned,
	IfcNavigationElementType_CorrectPredefinedType,
	IfcObject_UniquePropertySetNames,
	IfcObjective_WR21,
	IfcOccupant_WR31,
	IfcOffsetCurve2D_DimIs2D,
	IfcOffsetCurve3D_DimIs2D,
	IfcOpenCrossProfileDef_CorrectProfileType,
	IfcOpenCrossProfileDef_CorrespondingSlopeWidths,
	IfcOpenCrossProfileDef_CorrespondingTags,
	IfcOpeningElement_CorrectPredefinedType,
	IfcOrientedEdge_EdgeElementNotOriented,
	IfcOutlet_CorrectPredefinedType,
	IfcOutlet_CorrectTypeAssigned,
	IfcOutletType_CorrectPredefinedType,
	IfcOwnerHistory_CorrectChangeAction,
	IfcPath_IsContinuous,
	IfcPavement_CorrectPredefinedType,
	IfcPavement_CorrectTypeAssigned,
	IfcPavementType_CorrectPredefinedType,
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
	IfcPixelTexture_PixelAsByteAndSameLength,
	IfcPixelTexture_SizeOfPixelList,
	IfcPlate_CorrectPredefinedType,
	IfcPlate_CorrectTypeAssigned,
	IfcPlateType_CorrectPredefinedType,
	IfcPolyLoop_AllPointsSameDim,
	IfcPolygonalBoundedHalfSpace_BoundaryDim,
	IfcPolygonalBoundedHalfSpace_BoundaryType,
	IfcPolyline_SameDim,
	IfcPolynomialCurve_CorrectPositionDim,
	IfcPolynomialCurve_ValidCoefficients,
	IfcPositioningElement_HasPlacement,
]);

// =============================================================================
// Phase EX-4, IFC4X3_ADD2 chunk 5 (planning/ifcopenshell-ts/70-express-rules-plan.md,
// "the large chunk" -- WHERE-rule classes + `rule_executor.py`): the NEXT 120
// `SCOPE = 'entity'` rules, continuing directly from chunk 4's own last-ported rule with
// zero gap or overlap -- `IfcPostalAddress_WR1` (real source line 9906) through
// `IfcSeamCurve_SameSurface` (line 11127) in `src/ifcopenshell-python/ifcopenshell/
// express/rules/IFC4X3_ADD2.py`. **Independently re-verified, not trusted from the
// dispatching task brief's own citation alone**: re-ran the same `^class (\w+)` +
// `SCOPE = '(\w+)'`-matching script prior chunks' own header comments describe, confirmed
// exactly 120 `SCOPE = 'entity'` classes in this range, all 120 with no gap/overlap
// against chunk 4's own last rule (`IfcPositioningElement_HasPlacement`, line 9897) or
// chunk 6's first rule (`IfcSeamCurve_TwoPCurves`, line 11136, confirmed excluded).
// IFC4X3_ADD2 now stands at 580 of 779 total WHERE-rule classes (460 from chunks 1-4 +
// this chunk's own 120), 555/752 of its own entity-scope rules.
//
// =============================================================================
// This chunk's own central finding: exhaustive diffing (not sampling) of all 120 rules
// against IFC4's real source, using the same dedicated diff script as prior chunks
// =============================================================================
//
// Every one of this chunk's 120 target rule NAMES was cross-checked against `IFC4.py`'s
// own real source directly (a Python script comparing each real class body
// character-for-character after normalizing the schema-namespace string embedded in
// every `typeof(...)`/membership check, `'ifc4.ifcxxx'` -> `'ifc4x3_add2.ifcxxx'`, and
// stopping each body's own comparison at the first non-indented line to avoid the
// trailing-`calc_*`-DERIVE-function interleaving artifact chunk 2's own header comment
// already disclosed and fixed):
//
// - **103 of the 120 rules exist in `IFC4.py` under the exact same class name, with
//   BYTE-IDENTICAL real bodies** (modulo only that one schema-prefix substitution) --
//   each one's already-ported IFC4 TS implementation (`whereRules/ifc4.ts`) was located
//   by its own exact variable name and reused as a fresh local copy below (schema-prefix
//   string substituted, message text otherwise unchanged), not retranslated from Python
//   by hand, since the underlying logic is provably identical.
// - **4 of the 120 rules exist in `IFC4.py` under the exact same class name, but their
//   real bodies genuinely DIFFER beyond the schema-prefix substitution** -- each
//   investigated and disclosed individually, at its own call site below:
//   - `IfcPresentationLayerWithStyle_ApplicableOnlyToItems`: IFC4 requires `sizeof(typeof(temp)
//     * [...]) == 1`; ADD2 relaxes to `>= 1`. Not expected to change real-world outcomes
//     (the two candidate types are disjoint), but a genuine, verbatim-preserved textual
//     relaxation.
//   - `IfcQuantityCount_WR21`: a cosmetic-only Python-literal difference (`>= 0` vs.
//     `>= 0.0`) -- no real behavior change, still reuses `attrGreaterEqualZero`.
//   - `IfcRelAssociatesMaterial_AllowedElements`: **a genuine schema-evolution finding**
//     -- ADD2's own allow-list drops `IfcWindowStyle`/`IfcDoorStyle` entirely (IFC4's own
//     list has 6 members, ADD2's has 4), confirming both style entities were removed from
//     the schema -- `IfcDoorStyle`'s removal was already disclosed by chunk 3 (via a
//     whole-file `grep` finding zero matches anywhere in real `IFC4X3_ADD2.py`);
//     `IfcWindowStyle`'s removal is a new, independently confirmed finding here (also zero
//     matches anywhere in the whole real file, not just this chunk's own slice).
//   - `IfcRevolvedAreaSolid_AxisStartInXY`: **a genuine schema-evolution finding,
//     consistent with chunk 1's own `_LocationIsCP` finding** -- ADD2 adds a leading `and`
//     conjunct requiring `Axis.Location` to literally be an `IfcCartesianPoint` before
//     checking its 3rd coordinate is 0, a direct consequence of `IfcAxis1Placement`'s own
//     `Location` attribute type having been widened to a broader SELECT (see
//     `locationIsCartesianPoint`'s own doc comment) -- `IfcRevolvedAreaSolid.Axis` is
//     itself typed as `IfcAxis1Placement`, so this rule has to claw the constraint back
//     down inline before it can safely index into `.Coordinates`.
// - **13 of the 120 rules have NO `IFC4.py` class of the exact same name** -- each
//   investigated individually, not assumed genuinely new from the name-mismatch alone:
//   - **2 are genuine RULE_NAME renames, not new rules** -- both initially mis-flagged as
//     "new" by the automated diff script's own exact-class-name matching, corrected by
//     individually investigating each one's real IFC4.py source directly rather than
//     trusting the name-mismatch alone (per this project's own established methodology):
//     `IfcProjectedCRS_MapUnitIsLength` is byte-identical (modulo schema prefix) to IFC4's
//     own `IfcProjectedCRS_IsLengthUnit` (real `IFC4.py` line 8568) -- `RULE_NAME` changed
//     from `IsLengthUnit` to `MapUnitIsLength`; `IfcRelInterferesElements_NoSelfReference`
//     is byte-identical to IFC4's own `IfcRelInterferesElements_NotSelfReference` (real
//     `IFC4.py` line 9394) -- `RULE_NAME` changed from `NotSelfReference` to
//     `NoSelfReference` (matching every other `_NoSelfReference`-named rule's own
//     convention elsewhere in this file). Both the same shape as chunk 3's own
//     already-disclosed `IfcDoor` rule-name rename (`_CorrectStyleAssigned` ->
//     `_CorrectTypeAssigned`) -- a 3rd and 4th instance of this pattern overall.
//   - **1 is a new RULE on a pre-existing IFC4 entity, not a new entity**: `IfcProjectionElement`
//     already exists in `IFC4.py` (convenience-constructor wrapper confirmed at real source
//     line 3380) but carries no WHERE-rule there at all (confirmed via `grep` for
//     `class IfcProjectionElement_` across the whole real file -- zero matches, unlike
//     `IfcRelInterferesElements` above); ADD2 adds `IfcProjectionElement_
//     CorrectPredefinedType`, an ordinary already-established shape.
//   - **9 are ordinary `_CorrectPredefinedType`/`_CorrectTypeAssigned`/`_NoSelfReference`
//     rules on entities that are themselves wholly new in IFC4X3_ADD2** (confirmed via
//     `grep` for each entity name across all of `IFC4.py` -- zero matches for any of
//     them): `IfcRail`/`IfcRailType` (a rail-transport element + its type, 3 rules),
//     `IfcRailway`/`IfcRailwayPart` (rail-infrastructure spatial elements, 2 rules, no
//     `_CorrectTypeAssigned` sibling for either in this chunk's own real source range),
//     `IfcReinforcedSoil` (a ground-improvement element, 1 rule), `IfcRelPositions` (the
//     relationship entity behind chunk 4's own already-ported `IfcPositioningElement_
//     HasPlacement`, 1 rule, reusing `valueNotAmongList`), `IfcRoad`/`IfcRoadPart`
//     (road-infrastructure spatial elements, 2 rules, same "no `_CorrectTypeAssigned`
//     sibling" shape as `IfcRailway`).
//   - **1 is a bespoke rule on a wholly new ADD2 entity**: `IfcRigidOperation_
//     SameCoordinateType` (an alignment/linear-referencing rigid-transform entity) --
//     checks that its own `FirstCoordinate`/`SecondCoordinate` SELECT-typed measure
//     attributes are both `IfcLengthMeasure` or both `IfcPlaneAngleMeasure`, the same
//     `typeOfAttr(...).has(...)`-on-a-raw-measure-value pattern `whereRules/ifc4.ts`'s own
//     `IfcTextStyleFontModel_MeasureOfFontSize` already established (no `unwrapMeasure`
//     needed here, since this rule only checks type membership, never arithmetic).
//
// =============================================================================
// No real upstream Python bugs found in this chunk's own 120 rules
// =============================================================================
//
// Every rule in this chunk was read directly against its own real source body; none
// exhibit chunk 1's own `IfcAdvancedBrepWithVoids_VoidsHaveAdvancedFaces`-style inverted
// logic or any other confirmed defect.
//
// =============================================================================
// Shared helper shapes reused from `whereRules/ifc4.ts` as fresh local copies (all
// already-established reference shapes there, per this project's own "verify against an
// existing shape before writing a local copy" policy -- not new discoveries)
// =============================================================================
//
// This chunk is the first in this file to need several of `whereRules/ifc4.ts`'s own
// chunk-4/chunk-6-era helpers, none previously needed by this file's own chunks 1-4:
// **`attrGreaterEqualZero`** (6 occurrences: the `Quantity*_WR22` family's own
// `AreaValue`/`LengthValue`/`TimeValue`/`VolumeValue`/`WeightValue`, plus `IfcQuantityCount_
// WR21`'s own `CountValue` -- see the "4 differ" writeup above for why that last one is
// listed as "different" rather than "identical"), **`optionalSameUnit`** (3 occurrences:
// `IfcPropertyBoundedValue`'s own `SameUnitLowerSet`/`SameUnitUpperLower`/
// `SameUnitUpperSet`), **`allShareFirstTypeOf`** (4 occurrences: `IfcPropertyEnumeration_
// WR01`, `IfcPropertyListValue_WR31`, `IfcPropertyTableValue_WR22`/`WR23`),
// **`valueNotAmongList`** (10 occurrences: the `_NoSelfReference` "value not among sibling
// list" family -- `IfcRelAggregates`/`IfcRelAssignsToActor`/`ToControl`/`ToGroup`/
// `ToProcess`/`ToProduct`/`ToResource`/`IfcRelDeclares`/`IfcRelNests`, plus this chunk's
// own new `IfcRelPositions`), and **`attrsDiffer`** (4 occurrences: `IfcRelConnectsElements`/
// `IfcRelConnectsPorts`/`IfcRelSequence_AvoidInconsistentSequence`, plus this chunk's own
// new `IfcRelInterferesElements`). `correctPredefinedType`/`correctTypeAssigned`/
// `optionalAttrUnitTypeEquals`/`attrExists`/`attrGreaterThanZero`/`ifcTaperedSweptAreaProfiles`/
// `ifcAssociatedSurface`/`ifcUniquePropertyName`/`ifcUniquePropertyTemplateNames` (all already
// established in this file since chunk 1 or 4) get more occurrences here, no new logic.
// `triDiv` (1 occurrence, `IfcRoundedRectangleProfileDef_ValidRadius`, reusing IFC4's own
// already-code-review-fixed version that guards against a raw `/` on a possibly-
// `INDETERMINATE` value) is a plain new `runtimeShim` import for this file, not a
// rule-file-local helper.
//
// **Two new rule-file-local EXPRESS-library helpers ported**: `ifcCurveWeightsPositive`/
// `ifcSurfaceWeightsPositive` (`IfcRationalBSplineCurveWithKnots_WeightsGreaterZero`/
// `IfcRationalBSplineSurfaceWithKnots_WeightValuesGreaterZero`'s own real Python helpers,
// `IFC4X3_ADD2.py` lines 13508/13912 respectively) -- both independently confirmed
// BYTE-IDENTICAL to `IFC4.py`'s own versions (lines 11707/12083) via direct `diff`, so
// ported as plain fresh copies of `whereRules/ifc4.ts`'s own already-established
// implementations, zero logic changes.
//
// =============================================================================
// Registration-helper duplication -- see chunk 1's own header comment; no new disclosure
// needed here.
// =============================================================================

/**
 * Python: `IfcCurveWeightsPositive(b)` (real `IFC4X3_ADD2.py` source line 13508,
 * independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own version at line 11707 via
 * direct `diff`) -- fresh local copy of `whereRules/ifc4.ts`'s own already-established
 * helper of the exact same shape. See this file's own header comment.
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
 * Python: `IfcSurfaceWeightsPositive(b)` (real `IFC4X3_ADD2.py` source line 13912,
 * independently confirmed BYTE-IDENTICAL to `IFC4.py`'s own version at line 12083 via
 * direct `diff`) -- the 2D-nested-loop analog of `ifcCurveWeightsPositive` above. Fresh
 * local copy of `whereRules/ifc4.ts`'s own already-established helper of the exact same
 * shape. See this file's own header comment.
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
 * New shared shape (4 occurrences this chunk, see this file's own header comment) --
 * Python: `sizeof([temp for temp in X if not typeof(X[0]) == typeof(temp)]) == 0`. Fresh
 * local copy of `whereRules/ifc4.ts`'s own already-established helper of the exact same
 * shape.
 */
function allShareFirstTypeOf(self: EntityInstance, listAttrName: string): boolean {
	const list = expressGetAttr(self, listAttrName, INDETERMINATE);
	const items = isIndeterminate(list) ? [] : (list as unknown[]);
	const first = expressGetItem(items, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const firstType = typeOfAttr(first);
	const violating = items.filter((temp) => !firstType.equals(typeOfAttr(temp))).length;
	return violating === 0;
}

/**
 * New shared shape (3 occurrences this chunk, see this file's own header comment) --
 * Python: `not exists(A) or not exists(B) or typeof(A) == typeof(B)`. Fresh local copy of
 * `whereRules/ifc4.ts`'s own already-established helper of the exact same shape.
 */
function optionalSameUnit(self: EntityInstance, attrA: string, attrB: string): Tri {
	const a = expressGetAttr(self, attrA, INDETERMINATE);
	const b = expressGetAttr(self, attrB, INDETERMINATE);
	return pyOr(!exists(a), () => pyOr(!exists(b), () => typeOfAttr(a).equals(typeOfAttr(b))));
}

/**
 * New shared shape (6 occurrences this chunk, see this file's own header comment) --
 * Python: `X >= 0.0`, the `>=` sibling of this file's own `attrGreaterThanZero` (`>`
 * only). Fresh local copy of `whereRules/ifc4.ts`'s own already-established helper of the
 * exact same shape.
 */
function attrGreaterEqualZero(self: EntityInstance, attrName: string): Tri {
	return triGe(expressGetAttr(self, attrName, INDETERMINATE), 0.0);
}

/**
 * New shared shape (10 occurrences this chunk, see this file's own header comment) --
 * Python: `sizeof([temp for temp in LIST if VALUE == temp]) == 0` -- a named attribute's
 * value must not appear among another (list) attribute's own members. Fresh local copy of
 * `whereRules/ifc4.ts`'s own already-established helper of the exact same shape.
 */
function valueNotAmongList(self: EntityInstance, valueAttrName: string, listAttrName: string): boolean {
	const value = expressGetAttr(self, valueAttrName, INDETERMINATE);
	const list = expressGetAttr(self, listAttrName, INDETERMINATE);
	const items = isIndeterminate(list) ? [] : (list as EntityInstance[]);
	const count = items.filter((temp) => triEq(value, temp) === true).length;
	return count === 0;
}

/**
 * New shared shape (4 occurrences this chunk, see this file's own header comment) --
 * Python: `AttrA != AttrB`, both mandatory attributes read directly off `self`. Fresh
 * local copy of `whereRules/ifc4.ts`'s own already-established helper of the exact same
 * shape.
 */
function attrsDiffer(self: EntityInstance, attrNameA: string, attrNameB: string): Tri {
	return triNe(expressGetAttr(self, attrNameA, INDETERMINATE), expressGetAttr(self, attrNameB, INDETERMINATE));
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 9906-11127, this chunk's own 120).
// =============================================================================

// `IfcPostalAddress_WR1` (line 9906).
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

// `IfcPresentationLayerAssignment_ApplicableItems` (line 9922).
const IfcPresentationLayerAssignment_ApplicableItems = entityRule(
	"IfcPresentationLayerAssignment",
	"ApplicableItems",
	(self) => {
		const items = asList<EntityInstance>(expressGetAttr(self, "AssignedItems", INDETERMINATE));
		const matching = items.filter(
			(temp) =>
				typeOfAttr(temp).multiply([
					"ifc4x3_add2.ifcshaperepresentation",
					"ifc4x3_add2.ifcgeometricrepresentationitem",
					"ifc4x3_add2.ifcmappeditem",
				]).size === 1,
		).length;
		assertWhereRule(
			matching === items.length,
			"IfcPresentationLayerAssignment: every AssignedItems member must be exactly one of IfcShapeRepresentation/IfcGeometricRepresentationItem/IfcMappedItem.",
		);
	},
);

// `IfcPresentationLayerWithStyle_ApplicableOnlyToItems` (line 9932): **genuinely differs from
// IFC4's own byte-identical-named rule beyond the schema prefix** -- IFC4 requires
// `sizeof(typeof(temp) * [...]) == 1` (exactly one of IfcGeometricRepresentationItem/
// IfcMappedItem); ADD2 relaxes this to `>= 1` (at least one). Since the two candidate types
// are disjoint in practice, this is not expected to change real-world pass/fail outcomes, but
// it is a genuine, verbatim-preserved schema-level relaxation, ported as-is.
const IfcPresentationLayerWithStyle_ApplicableOnlyToItems = entityRule(
	"IfcPresentationLayerWithStyle",
	"ApplicableOnlyToItems",
	(self) => {
		const items = asList<EntityInstance>(expressGetAttr(self, "AssignedItems", INDETERMINATE));
		const matching = items.filter(
			(temp) =>
				typeOfAttr(temp).multiply(["ifc4x3_add2.ifcgeometricrepresentationitem", "ifc4x3_add2.ifcmappeditem"]).size >=
				1,
		).length;
		assertWhereRule(
			matching === items.length,
			"IfcPresentationLayerWithStyle: every AssignedItems member must be an IfcGeometricRepresentationItem or an IfcMappedItem.",
		);
	},
);

// `IfcProcedure_CorrectPredefinedType` (line 9942).
const IfcProcedure_CorrectPredefinedType = entityRule("IfcProcedure", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcProcedure: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcProcedure_HasName` (line 9952).
const IfcProcedure_HasName = entityRule("IfcProcedure", "HasName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcProcedure.Name must be given.");
});

// `IfcProcedureType_CorrectPredefinedType` (line 9961).
const IfcProcedureType_CorrectPredefinedType = entityRule("IfcProcedureType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ProcessType", false),
		"IfcProcedureType: if PredefinedType is USERDEFINED, ProcessType must be given.",
	);
});

// `IfcProduct_PlacementForShapeRepresentation` (line 9971).
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
			noShapeReps = items.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcshaperepresentation")).length === 0;
		}
		assertWhereRule(
			(hasRepresentation && exists(objectPlacement)) || (hasRepresentation && noShapeReps) || !hasRepresentation,
			"IfcProduct: if Representation is given and has an IfcShapeRepresentation, ObjectPlacement must also be given.",
		);
	},
);

// `IfcProductDefinitionShape_OnlyShapeModel` (line 9982).
const IfcProductDefinitionShape_OnlyShapeModel = entityRule("IfcProductDefinitionShape", "OnlyShapeModel", (self) => {
	const items = asList<EntityInstance>(expressGetAttr(self, "Representations", INDETERMINATE));
	const violating = items.filter((temp) => !typeOfAttr(temp).has("ifc4x3_add2.ifcshapemodel")).length;
	assertWhereRule(violating === 0, "IfcProductDefinitionShape: every Representations member must be an IfcShapeModel.");
});

// `IfcProject_CorrectContext` (line 9992).
const IfcProject_CorrectContext = entityRule("IfcProject", "CorrectContext", (self) => {
	const contexts = expressGetAttr(self, "RepresentationContexts", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(contexts), () => {
			const items = asList<EntityInstance>(contexts);
			return (
				items.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcgeometricrepresentationsubcontext")).length === 0
			);
		}),
		"IfcProject: RepresentationContexts must not contain an IfcGeometricRepresentationSubContext.",
	);
});

// `IfcProject_HasName` (line 10001).
const IfcProject_HasName = entityRule("IfcProject", "HasName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcProject.Name must be given.");
});

// `IfcProject_NoDecomposition` (line 10010).
const IfcProject_NoDecomposition = entityRule("IfcProject", "NoDecomposition", (self) => {
	assertWhereRule(attrSizeIsZero(self, "Decomposes"), "IfcProject: Decomposes must be empty.");
});

// `IfcProjectedCRS_MapUnitIsLength` (line 10019): **genuine RULE_NAME rename, not a new rule** --
// byte-identical body (modulo schema prefix) to IFC4's own `IfcProjectedCRS_IsLengthUnit`
// (real `IFC4.py` line 8568, confirmed directly) -- ADD2 renamed `RULE_NAME` from `IsLengthUnit`
// to `MapUnitIsLength`, same shape as chunk 3's own already-disclosed `IfcDoor` rule-name-rename
// finding (`_CorrectStyleAssigned` -> `_CorrectTypeAssigned`). Reuses `optionalAttrUnitTypeEquals`,
// the exact helper IFC4's own chunk 4 already generalized to cover this identical rule's own
// `MapUnit` attribute.
const IfcProjectedCRS_MapUnitIsLength = entityRule("IfcProjectedCRS", "MapUnitIsLength", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "MapUnit", "LENGTHUNIT"),
		"IfcProjectedCRS: if MapUnit is given, its UnitType must be LENGTHUNIT.",
	);
});

// `IfcProjectionElement_CorrectPredefinedType` (line 10028): **new rule on a pre-existing IFC4
// entity, not a new entity** -- `IfcProjectionElement` itself already exists in `IFC4.py`
// (convenience-constructor wrapper confirmed, real source line 3380) but carries no WHERE-rule
// there at all; ADD2 adds this one. Ordinary "occurrence" `_CorrectPredefinedType` shape.
const IfcProjectionElement_CorrectPredefinedType = entityRule(
	"IfcProjectionElement",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcProjectionElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcPropertyBoundedValue_SameUnitLowerSet` (line 10038).
const IfcPropertyBoundedValue_SameUnitLowerSet = entityRule("IfcPropertyBoundedValue", "SameUnitLowerSet", (self) => {
	assertWhereRule(
		optionalSameUnit(self, "LowerBoundValue", "SetPointValue"),
		"IfcPropertyBoundedValue: if LowerBoundValue and SetPointValue are both given, they must share the same type.",
	);
});

// `IfcPropertyBoundedValue_SameUnitUpperLower` (line 10049).
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

// `IfcPropertyBoundedValue_SameUnitUpperSet` (line 10060).
const IfcPropertyBoundedValue_SameUnitUpperSet = entityRule("IfcPropertyBoundedValue", "SameUnitUpperSet", (self) => {
	assertWhereRule(
		optionalSameUnit(self, "UpperBoundValue", "SetPointValue"),
		"IfcPropertyBoundedValue: if UpperBoundValue and SetPointValue are both given, they must share the same type.",
	);
});

// `IfcPropertyDependencyRelationship_NoSelfReference` (line 10071).
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

// `IfcPropertyEnumeratedValue_WR21` (line 10082).
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

// `IfcPropertyEnumeration_WR01` (line 10093).
const IfcPropertyEnumeration_WR01 = entityRule("IfcPropertyEnumeration", "WR01", (self) => {
	assertWhereRule(
		allShareFirstTypeOf(self, "EnumerationValues"),
		"IfcPropertyEnumeration: every EnumerationValues member must share the first member's own type.",
	);
});

// `IfcPropertyListValue_WR31` (line 10102).
const IfcPropertyListValue_WR31 = entityRule("IfcPropertyListValue", "WR31", (self) => {
	assertWhereRule(
		allShareFirstTypeOf(self, "ListValues"),
		"IfcPropertyListValue: every ListValues member must share the first member's own type.",
	);
});

// `IfcPropertySet_ExistsName` (line 10111).
const IfcPropertySet_ExistsName = entityRule("IfcPropertySet", "ExistsName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcPropertySet.Name must be given.");
});

// `IfcPropertySet_UniquePropertyNames` (line 10120).
const IfcPropertySet_UniquePropertyNames = entityRule("IfcPropertySet", "UniquePropertyNames", (self) => {
	assertWhereRule(
		ifcUniquePropertyName(expressGetAttr(self, "HasProperties", INDETERMINATE)),
		"IfcPropertySet: every HasProperties member must have a unique Name.",
	);
});

// `IfcPropertySetTemplate_ExistsName` (line 10130).
const IfcPropertySetTemplate_ExistsName = entityRule("IfcPropertySetTemplate", "ExistsName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcPropertySetTemplate.Name must be given.");
});

// `IfcPropertySetTemplate_UniquePropertyNames` (line 10139).
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

// `IfcPropertyTableValue_WR21` (line 10149). **Code-review finding, fixed**: this rule was
// initially reused verbatim from `whereRules/ifc4.ts`'s own byte-identical-named
// implementation, which itself collapses `triEq(...)`'s own tri-valued result to a plain
// JS boolean via `=== true` before OR-ing it with the both-absent guard -- discarding
// `INDETERMINATE` (e.g. when exactly one of `DefiningValues`/`DefinedValues` is given,
// `sizeof()` of the missing one is `INDETERMINATE`, so `triEq` itself correctly returns
// `INDETERMINATE`, but `INDETERMINATE === true` hardens that to `false`, wrongly turning
// an indeterminate result into a hard violation `assertWhereRule` then throws on -- real
// Python's own `assert (...) is not False` treats `INDETERMINATE` as satisfied, per this
// file's own established `assertWhereRule` contract, `value === false` only). Fixed here by
// routing the second disjunct through `pyOr`'s own lazy-thunk form instead of forcing it to
// a boolean first, letting `INDETERMINATE` propagate through exactly like every other rule
// in this file already does. **The identical bug is still present in the already-merged
// `whereRules/ifc4.ts`'s own `IfcPropertyTableValue_WR21`** -- out of scope to fix there in
// this chunk's own PR, flagged for a follow-up.
const IfcPropertyTableValue_WR21 = entityRule("IfcPropertyTableValue", "WR21", (self) => {
	const definingValues = expressGetAttr(self, "DefiningValues", INDETERMINATE);
	const definedValues = expressGetAttr(self, "DefinedValues", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(definingValues) && !exists(definedValues), () => triEq(sizeof(definingValues), sizeof(definedValues))),
		"IfcPropertyTableValue: DefiningValues and DefinedValues must both be absent, or both present with equal size.",
	);
});

// `IfcPropertyTableValue_WR22` (line 10160).
const IfcPropertyTableValue_WR22 = entityRule("IfcPropertyTableValue", "WR22", (self) => {
	const definingValues = expressGetAttr(self, "DefiningValues", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(definingValues), () => allShareFirstTypeOf(self, "DefiningValues")),
		"IfcPropertyTableValue: if given, every DefiningValues member must share the first member's own type.",
	);
});

// `IfcPropertyTableValue_WR23` (line 10170).
const IfcPropertyTableValue_WR23 = entityRule("IfcPropertyTableValue", "WR23", (self) => {
	const definedValues = expressGetAttr(self, "DefinedValues", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(definedValues), () => allShareFirstTypeOf(self, "DefinedValues")),
		"IfcPropertyTableValue: if given, every DefinedValues member must share the first member's own type.",
	);
});

// `IfcProtectiveDevice_CorrectPredefinedType` (line 10180).
const IfcProtectiveDevice_CorrectPredefinedType = entityRule("IfcProtectiveDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcProtectiveDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcProtectiveDevice_CorrectTypeAssigned` (line 10190).
const IfcProtectiveDevice_CorrectTypeAssigned = entityRule("IfcProtectiveDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcProtectiveDeviceType"),
		"IfcProtectiveDevice: if IsTypedBy is given, its RelatingType must be an IfcProtectiveDeviceType.",
	);
});

// `IfcProtectiveDeviceTrippingUnit_CorrectPredefinedType` (line 10200).
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

// `IfcProtectiveDeviceTrippingUnit_CorrectTypeAssigned` (line 10210).
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

// `IfcProtectiveDeviceTrippingUnitType_CorrectPredefinedType` (line 10220).
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

// `IfcProtectiveDeviceType_CorrectPredefinedType` (line 10230).
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

// `IfcPump_CorrectPredefinedType` (line 10240).
const IfcPump_CorrectPredefinedType = entityRule("IfcPump", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcPump: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcPump_CorrectTypeAssigned` (line 10250).
const IfcPump_CorrectTypeAssigned = entityRule("IfcPump", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcPumpType"),
		"IfcPump: if IsTypedBy is given, its RelatingType must be an IfcPumpType.",
	);
});

// `IfcPumpType_CorrectPredefinedType` (line 10260).
const IfcPumpType_CorrectPredefinedType = entityRule("IfcPumpType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcPumpType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcQuantityArea_WR21` (line 10270).
const IfcQuantityArea_WR21 = entityRule("IfcQuantityArea", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "AREAUNIT"),
		"IfcQuantityArea: if Unit is given, its UnitType must be AREAUNIT.",
	);
});

// `IfcQuantityArea_WR22` (line 10279).
const IfcQuantityArea_WR22 = entityRule("IfcQuantityArea", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "AreaValue"), "IfcQuantityArea.AreaValue must be >= 0.");
});

// `IfcQuantityCount_WR21` (line 10289): differs from IFC4's own byte-identical-named rule only
// in a Python literal (`countvalue >= 0`, not `>= 0.0`) -- functionally identical (JS/Python
// both treat int/float `0`/`0.0` the same in a `>=` comparison), not a real behavior change.
// Reuses `attrGreaterEqualZero` exactly like its sibling `Quantity*_WR22` rules below.
const IfcQuantityCount_WR21 = entityRule("IfcQuantityCount", "WR21", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "CountValue"), "IfcQuantityCount.CountValue must be >= 0.");
});

// `IfcQuantityLength_WR21` (line 10299).
const IfcQuantityLength_WR21 = entityRule("IfcQuantityLength", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "LENGTHUNIT"),
		"IfcQuantityLength: if Unit is given, its UnitType must be LENGTHUNIT.",
	);
});

// `IfcQuantityLength_WR22` (line 10308).
const IfcQuantityLength_WR22 = entityRule("IfcQuantityLength", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "LengthValue"), "IfcQuantityLength.LengthValue must be >= 0.");
});

// `IfcQuantityTime_WR21` (line 10318).
const IfcQuantityTime_WR21 = entityRule("IfcQuantityTime", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "TIMEUNIT"),
		"IfcQuantityTime: if Unit is given, its UnitType must be TIMEUNIT.",
	);
});

// `IfcQuantityTime_WR22` (line 10327).
const IfcQuantityTime_WR22 = entityRule("IfcQuantityTime", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "TimeValue"), "IfcQuantityTime.TimeValue must be >= 0.");
});

// `IfcQuantityVolume_WR21` (line 10337).
const IfcQuantityVolume_WR21 = entityRule("IfcQuantityVolume", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "VOLUMEUNIT"),
		"IfcQuantityVolume: if Unit is given, its UnitType must be VOLUMEUNIT.",
	);
});

// `IfcQuantityVolume_WR22` (line 10346).
const IfcQuantityVolume_WR22 = entityRule("IfcQuantityVolume", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "VolumeValue"), "IfcQuantityVolume.VolumeValue must be >= 0.");
});

// `IfcQuantityWeight_WR21` (line 10356).
const IfcQuantityWeight_WR21 = entityRule("IfcQuantityWeight", "WR21", (self) => {
	assertWhereRule(
		optionalAttrUnitTypeEquals(self, "Unit", "MASSUNIT"),
		"IfcQuantityWeight: if Unit is given, its UnitType must be MASSUNIT.",
	);
});

// `IfcQuantityWeight_WR22` (line 10365).
const IfcQuantityWeight_WR22 = entityRule("IfcQuantityWeight", "WR22", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "WeightValue"), "IfcQuantityWeight.WeightValue must be >= 0.");
});

// `IfcRail_CorrectPredefinedType` (line 10375). `IfcRail` is wholly new in IFC4X3_ADD2 (zero
// matches anywhere in real `IFC4.py`) -- standard "occurrence" `_CorrectPredefinedType` shape.
const IfcRail_CorrectPredefinedType = entityRule("IfcRail", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRail: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRail_CorrectTypeAssigned` (line 10385). New entity, standard `_CorrectTypeAssigned` shape.
const IfcRail_CorrectTypeAssigned = entityRule("IfcRail", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRailType"),
		"IfcRail: if IsTypedBy is given, its RelatingType must be an IfcRailType.",
	);
});

// `IfcRailType_CorrectPredefinedType` (line 10395). New entity, standard "*Type" (mandatory
// PredefinedType) `_CorrectPredefinedType` shape.
const IfcRailType_CorrectPredefinedType = entityRule("IfcRailType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRailType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRailing_CorrectPredefinedType` (line 10405).
const IfcRailing_CorrectPredefinedType = entityRule("IfcRailing", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRailing: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRailing_CorrectTypeAssigned` (line 10415).
const IfcRailing_CorrectTypeAssigned = entityRule("IfcRailing", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRailingType"),
		"IfcRailing: if IsTypedBy is given, its RelatingType must be an IfcRailingType.",
	);
});

// `IfcRailingType_CorrectPredefinedType` (line 10425).
const IfcRailingType_CorrectPredefinedType = entityRule("IfcRailingType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRailingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRailway_CorrectPredefinedType` (line 10435). `IfcRailway` is wholly new in IFC4X3_ADD2
// (zero matches anywhere in real `IFC4.py`) -- standard "occurrence" shape; no
// `_CorrectTypeAssigned` sibling exists for it in this chunk's own real source range.
const IfcRailway_CorrectPredefinedType = entityRule("IfcRailway", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRailway: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRailwayPart_CorrectPredefinedType` (line 10445). New entity, standard "occurrence" shape.
const IfcRailwayPart_CorrectPredefinedType = entityRule("IfcRailwayPart", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRailwayPart: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRamp_CorrectPredefinedType` (line 10455).
const IfcRamp_CorrectPredefinedType = entityRule("IfcRamp", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRamp: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRamp_CorrectTypeAssigned` (line 10465).
const IfcRamp_CorrectTypeAssigned = entityRule("IfcRamp", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRampType"),
		"IfcRamp: if IsTypedBy is given, its RelatingType must be an IfcRampType.",
	);
});

// `IfcRampFlight_CorrectPredefinedType` (line 10475).
const IfcRampFlight_CorrectPredefinedType = entityRule("IfcRampFlight", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRampFlight: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRampFlight_CorrectTypeAssigned` (line 10485).
const IfcRampFlight_CorrectTypeAssigned = entityRule("IfcRampFlight", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRampFlightType"),
		"IfcRampFlight: if IsTypedBy is given, its RelatingType must be an IfcRampFlightType.",
	);
});

// `IfcRampFlightType_CorrectPredefinedType` (line 10495).
const IfcRampFlightType_CorrectPredefinedType = entityRule("IfcRampFlightType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRampFlightType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRampType_CorrectPredefinedType` (line 10505).
const IfcRampType_CorrectPredefinedType = entityRule("IfcRampType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRampType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRationalBSplineCurveWithKnots_SameNumOfWeightsAndPoints` (line 10515).
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

// `IfcRationalBSplineCurveWithKnots_WeightsGreaterZero` (line 10525).
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

// `IfcRationalBSplineSurfaceWithKnots_CorrespondingWeightsDataLists` (line 10538).
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

// `IfcRationalBSplineSurfaceWithKnots_WeightValuesGreaterZero` (line 10548).
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

// `IfcRectangleHollowProfileDef_ValidInnerRadius` (line 10563).
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

// `IfcRectangleHollowProfileDef_ValidOuterRadius` (line 10574).
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

// `IfcRectangleHollowProfileDef_ValidWallThickness` (line 10584).
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

// `IfcRectangularTrimmedSurface_U1AndU2Different` (line 10594).
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

// `IfcRectangularTrimmedSurface_UsenseCompatible` (line 10605).
const IfcRectangularTrimmedSurface_UsenseCompatible = entityRule(
	"IfcRectangularTrimmedSurface",
	"UsenseCompatible",
	(self) => {
		const basisSurface = expressGetAttr(self, "BasisSurface", INDETERMINATE);
		const u1 = expressGetAttr(self, "U1", INDETERMINATE);
		const u2 = expressGetAttr(self, "U2", INDETERMINATE);
		const usense = expressGetAttr(self, "Usense", INDETERMINATE);
		const isElementaryNonPlane =
			typeOfAttr(basisSurface).has("ifc4x3_add2.ifcelementarysurface") &&
			!typeOfAttr(basisSurface).has("ifc4x3_add2.ifcplane");
		const isSurfaceOfRevolution = typeOfAttr(basisSurface).has("ifc4x3_add2.ifcsurfaceofrevolution");
		assertWhereRule(
			pyOr(isElementaryNonPlane || isSurfaceOfRevolution, () => triEq(usense, triGt(u2, u1))),
			"IfcRectangularTrimmedSurface: Usense must be consistent with U2 > U1 unless BasisSurface is a non-plane IfcElementarySurface or an IfcSurfaceOfRevolution.",
		);
	},
);

// `IfcRectangularTrimmedSurface_V1AndV2Different` (line 10618).
const IfcRectangularTrimmedSurface_V1AndV2Different = entityRule(
	"IfcRectangularTrimmedSurface",
	"V1AndV2Different",
	(self) => {
		assertWhereRule(
			triNe(expressGetAttr(self, "V1", INDETERMINATE), expressGetAttr(self, "V2", INDETERMINATE)),
			"IfcRectangularTrimmedSurface: V1 must not equal V2.",
		);
	},
);

// `IfcRectangularTrimmedSurface_VsenseCompatible` (line 10629).
const IfcRectangularTrimmedSurface_VsenseCompatible = entityRule(
	"IfcRectangularTrimmedSurface",
	"VsenseCompatible",
	(self) => {
		const v1 = expressGetAttr(self, "V1", INDETERMINATE);
		const v2 = expressGetAttr(self, "V2", INDETERMINATE);
		const vsense = expressGetAttr(self, "Vsense", INDETERMINATE);
		assertWhereRule(
			triEq(vsense, triGt(v2, v1)),
			"IfcRectangularTrimmedSurface.Vsense must be consistent with V2 > V1.",
		);
	},
);

// `IfcReinforcedSoil_CorrectPredefinedType` (line 10641). New entity, standard "occurrence" shape.
const IfcReinforcedSoil_CorrectPredefinedType = entityRule("IfcReinforcedSoil", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcReinforcedSoil: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcReinforcingBar_CorrectPredefinedType` (line 10651).
const IfcReinforcingBar_CorrectPredefinedType = entityRule("IfcReinforcingBar", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcReinforcingBar: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcReinforcingBar_CorrectTypeAssigned` (line 10661).
const IfcReinforcingBar_CorrectTypeAssigned = entityRule("IfcReinforcingBar", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcReinforcingBarType"),
		"IfcReinforcingBar: if IsTypedBy is given, its RelatingType must be an IfcReinforcingBarType.",
	);
});

// `IfcReinforcingBarType_BendingShapeCodeProvided` (line 10671).
const IfcReinforcingBarType_BendingShapeCodeProvided = entityRule(
	"IfcReinforcingBarType",
	"BendingShapeCodeProvided",
	(self) => {
		const bendingShapeCode = expressGetAttr(self, "BendingShapeCode", INDETERMINATE);
		const bendingParameters = expressGetAttr(self, "BendingParameters", INDETERMINATE);
		assertWhereRule(
			!exists(bendingParameters) || exists(bendingShapeCode),
			"IfcReinforcingBarType: if BendingParameters is given, BendingShapeCode must be given too.",
		);
	},
);

// `IfcReinforcingBarType_CorrectPredefinedType` (line 10682).
const IfcReinforcingBarType_CorrectPredefinedType = entityRule(
	"IfcReinforcingBarType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcReinforcingBarType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcReinforcingMesh_CorrectPredefinedType` (line 10692).
const IfcReinforcingMesh_CorrectPredefinedType = entityRule("IfcReinforcingMesh", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcReinforcingMesh: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcReinforcingMesh_CorrectTypeAssigned` (line 10702).
const IfcReinforcingMesh_CorrectTypeAssigned = entityRule("IfcReinforcingMesh", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcReinforcingMeshType"),
		"IfcReinforcingMesh: if IsTypedBy is given, its RelatingType must be an IfcReinforcingMeshType.",
	);
});

// `IfcReinforcingMeshType_BendingShapeCodeProvided` (line 10712).
const IfcReinforcingMeshType_BendingShapeCodeProvided = entityRule(
	"IfcReinforcingMeshType",
	"BendingShapeCodeProvided",
	(self) => {
		const bendingShapeCode = expressGetAttr(self, "BendingShapeCode", INDETERMINATE);
		const bendingParameters = expressGetAttr(self, "BendingParameters", INDETERMINATE);
		assertWhereRule(
			!exists(bendingParameters) || exists(bendingShapeCode),
			"IfcReinforcingMeshType: if BendingParameters is given, BendingShapeCode must be given too.",
		);
	},
);

// `IfcReinforcingMeshType_CorrectPredefinedType` (line 10723).
const IfcReinforcingMeshType_CorrectPredefinedType = entityRule(
	"IfcReinforcingMeshType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcReinforcingMeshType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcRelAggregates_NoSelfReference` (line 10733).
const IfcRelAggregates_NoSelfReference = entityRule("IfcRelAggregates", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingObject", "RelatedObjects"),
		"IfcRelAggregates: RelatingObject must not appear among RelatedObjects.",
	);
});

// `IfcRelAssignsToActor_NoSelfReference` (line 10744).
const IfcRelAssignsToActor_NoSelfReference = entityRule("IfcRelAssignsToActor", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingActor", "RelatedObjects"),
		"IfcRelAssignsToActor: RelatingActor must not appear among RelatedObjects.",
	);
});

// `IfcRelAssignsToControl_NoSelfReference` (line 10754).
const IfcRelAssignsToControl_NoSelfReference = entityRule("IfcRelAssignsToControl", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingControl", "RelatedObjects"),
		"IfcRelAssignsToControl: RelatingControl must not appear among RelatedObjects.",
	);
});

// `IfcRelAssignsToGroup_NoSelfReference` (line 10764).
const IfcRelAssignsToGroup_NoSelfReference = entityRule("IfcRelAssignsToGroup", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingGroup", "RelatedObjects"),
		"IfcRelAssignsToGroup: RelatingGroup must not appear among RelatedObjects.",
	);
});

// `IfcRelAssignsToProcess_NoSelfReference` (line 10774).
const IfcRelAssignsToProcess_NoSelfReference = entityRule("IfcRelAssignsToProcess", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingProcess", "RelatedObjects"),
		"IfcRelAssignsToProcess: RelatingProcess must not appear among RelatedObjects.",
	);
});

// `IfcRelAssignsToProduct_NoSelfReference` (line 10784).
const IfcRelAssignsToProduct_NoSelfReference = entityRule("IfcRelAssignsToProduct", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingProduct", "RelatedObjects"),
		"IfcRelAssignsToProduct: RelatingProduct must not appear among RelatedObjects.",
	);
});

// `IfcRelAssignsToResource_NoSelfReference` (line 10794).
const IfcRelAssignsToResource_NoSelfReference = entityRule("IfcRelAssignsToResource", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingResource", "RelatedObjects"),
		"IfcRelAssignsToResource: RelatingResource must not appear among RelatedObjects.",
	);
});

// `IfcRelAssociatesMaterial_AllowedElements` (line 10804): **genuine schema-evolution finding**
// -- IFC4's own byte-identical-named rule's allow-list is `['ifcelement', 'ifcelementtype',
// 'ifcwindowstyle', 'ifcdoorstyle', 'ifcstructuralmember', 'ifcport']`; ADD2's own real source
// drops `IfcWindowStyle`/`IfcDoorStyle` from the list entirely -- consistent with chunk 3's own
// already-disclosed finding that `IfcDoorStyle` was removed from the schema (confirmed there via
// a whole-file `grep`), and independently confirming `IfcWindowStyle` was removed too (zero
// matches anywhere in real `IFC4X3_ADD2.py`). Ported with ADD2's own real 4-member list, not
// IFC4's 6-member one.
const IfcRelAssociatesMaterial_AllowedElements = entityRule("IfcRelAssociatesMaterial", "AllowedElements", (self) => {
	const relatedObjects = asList<EntityInstance>(expressGetAttr(self, "RelatedObjects", INDETERMINATE));
	const violating = relatedObjects.filter(
		(temp) =>
			typeOfAttr(temp).multiply([
				"ifc4x3_add2.ifcelement",
				"ifc4x3_add2.ifcelementtype",
				"ifc4x3_add2.ifcstructuralmember",
				"ifc4x3_add2.ifcport",
			]).size === 0,
	).length;
	assertWhereRule(
		violating === 0,
		"IfcRelAssociatesMaterial: every RelatedObjects member must be an IfcElement, IfcElementType, IfcStructuralMember, or IfcPort.",
	);
});

// `IfcRelAssociatesMaterial_NoVoidElement` (line 10813).
const IfcRelAssociatesMaterial_NoVoidElement = entityRule("IfcRelAssociatesMaterial", "NoVoidElement", (self) => {
	const relatedObjects = asList<EntityInstance>(expressGetAttr(self, "RelatedObjects", INDETERMINATE));
	const violating = relatedObjects.filter(
		(temp) =>
			typeOfAttr(temp).has("ifc4x3_add2.ifcfeatureelementsubtraction") ||
			typeOfAttr(temp).has("ifc4x3_add2.ifcvirtualelement"),
	).length;
	assertWhereRule(
		violating === 0,
		"IfcRelAssociatesMaterial: no RelatedObjects member may be an IfcFeatureElementSubtraction or IfcVirtualElement.",
	);
});

// `IfcRelConnectsElements_NoSelfReference` (line 10822).
const IfcRelConnectsElements_NoSelfReference = entityRule("IfcRelConnectsElements", "NoSelfReference", (self) => {
	assertWhereRule(
		attrsDiffer(self, "RelatingElement", "RelatedElement"),
		"IfcRelConnectsElements: RelatingElement must not equal RelatedElement.",
	);
});

// `IfcRelConnectsPathElements_NormalizedRelatedPriorities` (line 10833).
const IfcRelConnectsPathElements_NormalizedRelatedPriorities = entityRule(
	"IfcRelConnectsPathElements",
	"NormalizedRelatedPriorities",
	(self) => {
		const relatedPriorities = expressGetAttr(self, "RelatedPriorities", INDETERMINATE);
		const items = isIndeterminate(relatedPriorities) ? [] : (relatedPriorities as number[]);
		const size = sizeof(relatedPriorities);
		assertWhereRule(
			pyOr(triEq(size, 0), () => triEq(items.filter((temp) => 0 <= temp && temp <= 100).length, size)),
			"IfcRelConnectsPathElements: every RelatedPriorities value must be in [0, 100].",
		);
	},
);

// `IfcRelConnectsPathElements_NormalizedRelatingPriorities` (line 10843).
const IfcRelConnectsPathElements_NormalizedRelatingPriorities = entityRule(
	"IfcRelConnectsPathElements",
	"NormalizedRelatingPriorities",
	(self) => {
		const relatingPriorities = expressGetAttr(self, "RelatingPriorities", INDETERMINATE);
		const items = isIndeterminate(relatingPriorities) ? [] : (relatingPriorities as number[]);
		const size = sizeof(relatingPriorities);
		assertWhereRule(
			pyOr(triEq(size, 0), () => triEq(items.filter((temp) => 0 <= temp && temp <= 100).length, size)),
			"IfcRelConnectsPathElements: every RelatingPriorities value must be in [0, 100].",
		);
	},
);

// `IfcRelConnectsPorts_NoSelfReference` (line 10853).
const IfcRelConnectsPorts_NoSelfReference = entityRule("IfcRelConnectsPorts", "NoSelfReference", (self) => {
	assertWhereRule(
		attrsDiffer(self, "RelatingPort", "RelatedPort"),
		"IfcRelConnectsPorts: RelatingPort must not equal RelatedPort.",
	);
});

// `IfcRelContainedInSpatialStructure_WR31` (line 10864).
const IfcRelContainedInSpatialStructure_WR31 = entityRule("IfcRelContainedInSpatialStructure", "WR31", (self) => {
	const relatedElements = asList<EntityInstance>(expressGetAttr(self, "RelatedElements", INDETERMINATE));
	const violating = relatedElements.filter((temp) =>
		typeOfAttr(temp).has("ifc4x3_add2.ifcspatialstructureelement"),
	).length;
	assertWhereRule(
		violating === 0,
		"IfcRelContainedInSpatialStructure: no RelatedElements member may be an IfcSpatialStructureElement.",
	);
});

// `IfcRelDeclares_NoSelfReference` (line 10874).
const IfcRelDeclares_NoSelfReference = entityRule("IfcRelDeclares", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingContext", "RelatedDefinitions"),
		"IfcRelDeclares: RelatingContext must not appear among RelatedDefinitions.",
	);
});

// `IfcRelDefinesByProperties_NoRelatedTypeObject` (line 10885).
const IfcRelDefinesByProperties_NoRelatedTypeObject = entityRule(
	"IfcRelDefinesByProperties",
	"NoRelatedTypeObject",
	(self) => {
		const relatedObjects = asList<EntityInstance>(expressGetAttr(self, "RelatedObjects", INDETERMINATE));
		const violating = relatedObjects.filter((types) => typeOfAttr(types).has("ifc4x3_add2.ifctypeobject")).length;
		assertWhereRule(violating === 0, "IfcRelDefinesByProperties: no RelatedObjects member may be an IfcTypeObject.");
	},
);

// `IfcRelInterferesElements_NoSelfReference` (line 10894): **genuine RULE_NAME rename, not
// a new rule** -- byte-identical body (modulo schema prefix -- trivially, since this body
// has no schema-prefix string at all) to IFC4's own `IfcRelInterferesElements_
// NotSelfReference` (real `IFC4.py` line 9394, confirmed directly) -- ADD2 renamed
// `RULE_NAME` from `NotSelfReference` to `NoSelfReference`, matching every other
// `_NoSelfReference`-named rule's own convention elsewhere in this file (the automated
// diff script's exact-class-name matching initially mis-flagged this as "new" -- caught by
// individually investigating this rule's own real IFC4.py source rather than trusting that
// alone, per this project's own established methodology; a 3rd rule-name rename overall,
// after chunk 3's `IfcDoor` and this chunk's own `IfcProjectedCRS` finding below -- sorted
// here in the earlier `IfcProjectedCRS` writeup by discovery order, not file order).
// Reuses `attrsDiffer`, the same shape as `IfcRelConnectsElements_NoSelfReference`/
// `IfcRelSequence_AvoidInconsistentSequence` above.
const IfcRelInterferesElements_NoSelfReference = entityRule("IfcRelInterferesElements", "NoSelfReference", (self) => {
	assertWhereRule(
		attrsDiffer(self, "RelatingElement", "RelatedElement"),
		"IfcRelInterferesElements: RelatingElement must not equal RelatedElement.",
	);
});

// `IfcRelNests_NoSelfReference` (line 10905).
const IfcRelNests_NoSelfReference = entityRule("IfcRelNests", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingObject", "RelatedObjects"),
		"IfcRelNests: RelatingObject must not appear among RelatedObjects.",
	);
});

// `IfcRelPositions_NoSelfReference` (line 10916). `IfcRelPositions` is wholly new in
// IFC4X3_ADD2 (the relationship entity behind chunk 4's own already-ported
// `IfcPositioningElement_HasPlacement`) -- reuses `valueNotAmongList`, the same shape as the
// other `_NoSelfReference` rules above.
const IfcRelPositions_NoSelfReference = entityRule("IfcRelPositions", "NoSelfReference", (self) => {
	assertWhereRule(
		valueNotAmongList(self, "RelatingPositioningElement", "RelatedProducts"),
		"IfcRelPositions: RelatingPositioningElement must not appear among RelatedProducts.",
	);
});

// `IfcRelReferencedInSpatialStructure_AllowedRelatedElements` (line 10927).
const IfcRelReferencedInSpatialStructure_AllowedRelatedElements = entityRule(
	"IfcRelReferencedInSpatialStructure",
	"AllowedRelatedElements",
	(self) => {
		const relatedElements = asList<EntityInstance>(expressGetAttr(self, "RelatedElements", INDETERMINATE));
		const violating = relatedElements.filter(
			(temp) =>
				typeOfAttr(temp).has("ifc4x3_add2.ifcspatialstructureelement") && !typeOfAttr(temp).has("ifc4x3_add2.ifcspace"),
		).length;
		assertWhereRule(
			violating === 0,
			"IfcRelReferencedInSpatialStructure: no RelatedElements member may be an IfcSpatialStructureElement other than IfcSpace.",
		);
	},
);

// `IfcRelSequence_AvoidInconsistentSequence` (line 10937).
const IfcRelSequence_AvoidInconsistentSequence = entityRule("IfcRelSequence", "AvoidInconsistentSequence", (self) => {
	assertWhereRule(
		attrsDiffer(self, "RelatingProcess", "RelatedProcess"),
		"IfcRelSequence: RelatingProcess must not equal RelatedProcess.",
	);
});

// `IfcRelSequence_CorrectSequenceType` (line 10948).
const IfcRelSequence_CorrectSequenceType = entityRule("IfcRelSequence", "CorrectSequenceType", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "SequenceType", "UserDefinedSequenceType"),
		"IfcRelSequence: if SequenceType is USERDEFINED, UserDefinedSequenceType must be given.",
	);
});

// `IfcRelSpaceBoundary_CorrectPhysOrVirt` (line 10959). **Code-review finding, fixed**:
// `typeOfAttr(relatedBuildingElement).has("ifc4x3_add2.ifcvirtualelement")` was computed
// twice (once directly for `isNotVirtual`, again inside `isVirtualOrOpening`'s own `||`) --
// hoisted into a single `isVirtualElement` computed once and reused (same pre-existing
// duplicate-computation pattern already present in the already-merged `whereRules/
// ifc4.ts`'s own byte-identical-named rule -- out of scope to fix there in this chunk's own
// PR).
const IfcRelSpaceBoundary_CorrectPhysOrVirt = entityRule("IfcRelSpaceBoundary", "CorrectPhysOrVirt", (self) => {
	const relatedBuildingElement = expressGetAttr(self, "RelatedBuildingElement", INDETERMINATE);
	const physicalOrVirtualBoundary = expressGetAttr(self, "PhysicalOrVirtualBoundary", INDETERMINATE);
	const isVirtualElement = typeOfAttr(relatedBuildingElement).has("ifc4x3_add2.ifcvirtualelement");
	const isNotVirtual = !isVirtualElement;
	const isVirtualOrOpening =
		isVirtualElement || typeOfAttr(relatedBuildingElement).has("ifc4x3_add2.ifcopeningelement");
	assertWhereRule(
		pyOr(
			pyAnd(triEq(physicalOrVirtualBoundary, "PHYSICAL"), () => isNotVirtual),
			() =>
				pyOr(
					pyAnd(triEq(physicalOrVirtualBoundary, "VIRTUAL"), () => isVirtualOrOpening),
					() => triEq(physicalOrVirtualBoundary, "NOTDEFINED"),
				),
		),
		"IfcRelSpaceBoundary: PhysicalOrVirtualBoundary must be consistent with RelatedBuildingElement's own kind.",
	);
});

// `IfcReparametrisedCompositeCurveSegment_PositiveLengthParameter` (line 10970).
const IfcReparametrisedCompositeCurveSegment_PositiveLengthParameter = entityRule(
	"IfcReparametrisedCompositeCurveSegment",
	"PositiveLengthParameter",
	(self) => {
		assertWhereRule(
			attrGreaterThanZero(self, "ParamLength"),
			"IfcReparametrisedCompositeCurveSegment.ParamLength must be greater than 0.",
		);
	},
);

// `IfcRepresentationMap_ApplicableMappedRepr` (line 10980).
const IfcRepresentationMap_ApplicableMappedRepr = entityRule("IfcRepresentationMap", "ApplicableMappedRepr", (self) => {
	const mappedRepresentation = expressGetAttr(self, "MappedRepresentation", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(mappedRepresentation).has("ifc4x3_add2.ifcshapemodel"),
		"IfcRepresentationMap.MappedRepresentation must be an IfcShapeModel.",
	);
});

// `IfcRevolvedAreaSolid_AxisDirectionInXY` (line 10990).
const IfcRevolvedAreaSolid_AxisDirectionInXY = entityRule("IfcRevolvedAreaSolid", "AxisDirectionInXY", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	const z = expressGetAttr(axis, "Z", INDETERMINATE);
	const directionRatios = expressGetAttr(z, "DirectionRatios", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetItem(directionRatios, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 0.0),
		"IfcRevolvedAreaSolid: Axis.Z's own 3rd direction ratio must be 0 (the axis direction must lie in the XY plane).",
	);
});

// `IfcRevolvedAreaSolid_AxisStartInXY` (line 11000): **genuine schema-evolution finding** --
// IFC4's own byte-identical-named rule body is just `Axis.Location.Coordinates[3] == 0.0`;
// ADD2's own real source ADDS a leading `'ifc4x3_add2.ifccartesianpoint' in typeof(Axis.Location)`
// conjunct (a genuine `and`, not `or`) before the same coordinate check -- consistent with this
// file's own chunk 1 finding that `IfcAxis1Placement`/`IfcAxis2Placement2D`/`IfcAxis2Placement3D`
// all widened their own `Location` attribute's declared type to a broader SELECT that now also
// admits `IfcPointByDistanceExpression` (see `locationIsCartesianPoint`'s own doc comment) --
// `IfcAxis1Placement` is exactly what `IfcRevolvedAreaSolid.Axis` is typed as, so this rule now
// has to claw the constraint back down to "must literally be an IfcCartesianPoint" itself,
// inline, before it can even index into `.Coordinates`. Ported with both real ADD2 conjuncts.
// **Code-review finding, fixed**: the first conjunct re-derived
// `typeOfAttr(location).has("ifc4x3_add2.ifccartesianpoint")` inline instead of calling this
// file's own `locationIsCartesianPoint` helper (which performs the exact same check,
// against `self.Location`) -- calling it with `axis` as its own `self` avoids the
// duplicated logic and keeps this rule automatically in sync with that helper.
const IfcRevolvedAreaSolid_AxisStartInXY = entityRule("IfcRevolvedAreaSolid", "AxisStartInXY", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE) as EntityInstance;
	assertWhereRule(
		pyAnd(locationIsCartesianPoint(axis), () => {
			const location = expressGetAttr(axis, "Location", INDETERMINATE);
			const coordinates = expressGetAttr(location, "Coordinates", INDETERMINATE);
			return triEq(expressGetItem(coordinates, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 0.0);
		}),
		"IfcRevolvedAreaSolid: Axis.Location must be an IfcCartesianPoint, and its 3rd coordinate must equal 0.",
	);
});

// `IfcRevolvedAreaSolidTapered_CorrectProfileAssignment` (line 11014).
const IfcRevolvedAreaSolidTapered_CorrectProfileAssignment = entityRule(
	"IfcRevolvedAreaSolidTapered",
	"CorrectProfileAssignment",
	(self) => {
		const sweptArea = expressGetAttr(self, "SweptArea", INDETERMINATE);
		const endSweptArea = expressGetAttr(self, "EndSweptArea", INDETERMINATE);
		assertWhereRule(
			ifcTaperedSweptAreaProfiles(sweptArea, endSweptArea),
			"IfcRevolvedAreaSolidTapered: SweptArea and EndSweptArea must be a valid tapered-profile pair.",
		);
	},
);

// `IfcRigidOperation_SameCoordinateType` (line 11023): **bespoke, wholly new ADD2 entity**
// (an alignment/linear-referencing rigid-transform entity; zero matches anywhere in real
// `IFC4.py`) -- `FirstCoordinate`/`SecondCoordinate` are SELECT-typed measure attributes, not
// entity instances; `typeOfAttr(...).has(...)` still works directly on them (same pattern as
// `whereRules/ifc4.ts`'s own `IfcTextStyleFontModel_MeasureOfFontSize`), no `unwrapMeasure`
// needed since this rule only checks type membership, never does arithmetic on the values.
const IfcRigidOperation_SameCoordinateType = entityRule("IfcRigidOperation", "SameCoordinateType", (self) => {
	const firstCoordinate = expressGetAttr(self, "FirstCoordinate", INDETERMINATE);
	const secondCoordinate = expressGetAttr(self, "SecondCoordinate", INDETERMINATE);
	assertWhereRule(
		pyOr(
			pyAnd(typeOfAttr(firstCoordinate).has("ifc4x3_add2.ifclengthmeasure"), () =>
				typeOfAttr(secondCoordinate).has("ifc4x3_add2.ifclengthmeasure"),
			),
			() =>
				pyAnd(typeOfAttr(firstCoordinate).has("ifc4x3_add2.ifcplaneanglemeasure"), () =>
					typeOfAttr(secondCoordinate).has("ifc4x3_add2.ifcplaneanglemeasure"),
				),
		),
		"IfcRigidOperation: FirstCoordinate and SecondCoordinate must both be IfcLengthMeasure, or both IfcPlaneAngleMeasure.",
	);
});

// `IfcRoad_CorrectPredefinedType` (line 11034). New entity, standard "occurrence" shape; no
// `_CorrectTypeAssigned` sibling exists for it in this chunk's own real source range.
const IfcRoad_CorrectPredefinedType = entityRule("IfcRoad", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRoad: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRoadPart_CorrectPredefinedType` (line 11044). New entity, standard "occurrence" shape.
const IfcRoadPart_CorrectPredefinedType = entityRule("IfcRoadPart", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRoadPart: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRoof_CorrectPredefinedType` (line 11054).
const IfcRoof_CorrectPredefinedType = entityRule("IfcRoof", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcRoof: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcRoof_CorrectTypeAssigned` (line 11064).
const IfcRoof_CorrectTypeAssigned = entityRule("IfcRoof", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcRoofType"),
		"IfcRoof: if IsTypedBy is given, its RelatingType must be an IfcRoofType.",
	);
});

// `IfcRoofType_CorrectPredefinedType` (line 11074).
const IfcRoofType_CorrectPredefinedType = entityRule("IfcRoofType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcRoofType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcRoundedRectangleProfileDef_ValidRadius` (line 11084).
const IfcRoundedRectangleProfileDef_ValidRadius = entityRule("IfcRoundedRectangleProfileDef", "ValidRadius", (self) => {
	const roundingRadius = expressGetAttr(self, "RoundingRadius", INDETERMINATE);
	const xDim = expressGetAttr(self, "XDim", INDETERMINATE);
	const yDim = expressGetAttr(self, "YDim", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLe(roundingRadius, triDiv(xDim, 2.0)), () => triLe(roundingRadius, triDiv(yDim, 2.0))),
		"IfcRoundedRectangleProfileDef.RoundingRadius must be at most half of both XDim and YDim.",
	);
});

// `IfcSanitaryTerminal_CorrectPredefinedType` (line 11097).
const IfcSanitaryTerminal_CorrectPredefinedType = entityRule("IfcSanitaryTerminal", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSanitaryTerminal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSanitaryTerminal_CorrectTypeAssigned` (line 11107).
const IfcSanitaryTerminal_CorrectTypeAssigned = entityRule("IfcSanitaryTerminal", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSanitaryTerminalType"),
		"IfcSanitaryTerminal: if IsTypedBy is given, its RelatingType must be an IfcSanitaryTerminalType.",
	);
});

// `IfcSanitaryTerminalType_CorrectPredefinedType` (line 11117).
const IfcSanitaryTerminalType_CorrectPredefinedType = entityRule(
	"IfcSanitaryTerminalType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcSanitaryTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcSeamCurve_SameSurface` (line 11127).
const IfcSeamCurve_SameSurface = entityRule("IfcSeamCurve", "SameSurface", (self) => {
	const associatedGeometry = expressGetAttr(self, "AssociatedGeometry", INDETERMINATE);
	const first = expressGetItem(associatedGeometry, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const second = expressGetItem(associatedGeometry, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		triEq(ifcAssociatedSurface(first), ifcAssociatedSurface(second)),
		"IfcSeamCurve: both AssociatedGeometry members must share the same BasisSurface.",
	);
});
registerSchemaRules("IFC4X3_ADD2", [
	IfcPostalAddress_WR1,
	IfcPresentationLayerAssignment_ApplicableItems,
	IfcPresentationLayerWithStyle_ApplicableOnlyToItems,
	IfcProcedure_CorrectPredefinedType,
	IfcProcedure_HasName,
	IfcProcedureType_CorrectPredefinedType,
	IfcProduct_PlacementForShapeRepresentation,
	IfcProductDefinitionShape_OnlyShapeModel,
	IfcProject_CorrectContext,
	IfcProject_HasName,
	IfcProject_NoDecomposition,
	IfcProjectedCRS_MapUnitIsLength,
	IfcProjectionElement_CorrectPredefinedType,
	IfcPropertyBoundedValue_SameUnitLowerSet,
	IfcPropertyBoundedValue_SameUnitUpperLower,
	IfcPropertyBoundedValue_SameUnitUpperSet,
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
	IfcRail_CorrectPredefinedType,
	IfcRail_CorrectTypeAssigned,
	IfcRailType_CorrectPredefinedType,
	IfcRailing_CorrectPredefinedType,
	IfcRailing_CorrectTypeAssigned,
	IfcRailingType_CorrectPredefinedType,
	IfcRailway_CorrectPredefinedType,
	IfcRailwayPart_CorrectPredefinedType,
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
	IfcRectangleHollowProfileDef_ValidInnerRadius,
	IfcRectangleHollowProfileDef_ValidOuterRadius,
	IfcRectangleHollowProfileDef_ValidWallThickness,
	IfcRectangularTrimmedSurface_U1AndU2Different,
	IfcRectangularTrimmedSurface_UsenseCompatible,
	IfcRectangularTrimmedSurface_V1AndV2Different,
	IfcRectangularTrimmedSurface_VsenseCompatible,
	IfcReinforcedSoil_CorrectPredefinedType,
	IfcReinforcingBar_CorrectPredefinedType,
	IfcReinforcingBar_CorrectTypeAssigned,
	IfcReinforcingBarType_BendingShapeCodeProvided,
	IfcReinforcingBarType_CorrectPredefinedType,
	IfcReinforcingMesh_CorrectPredefinedType,
	IfcReinforcingMesh_CorrectTypeAssigned,
	IfcReinforcingMeshType_BendingShapeCodeProvided,
	IfcReinforcingMeshType_CorrectPredefinedType,
	IfcRelAggregates_NoSelfReference,
	IfcRelAssignsToActor_NoSelfReference,
	IfcRelAssignsToControl_NoSelfReference,
	IfcRelAssignsToGroup_NoSelfReference,
	IfcRelAssignsToProcess_NoSelfReference,
	IfcRelAssignsToProduct_NoSelfReference,
	IfcRelAssignsToResource_NoSelfReference,
	IfcRelAssociatesMaterial_AllowedElements,
	IfcRelAssociatesMaterial_NoVoidElement,
	IfcRelConnectsElements_NoSelfReference,
	IfcRelConnectsPathElements_NormalizedRelatedPriorities,
	IfcRelConnectsPathElements_NormalizedRelatingPriorities,
	IfcRelConnectsPorts_NoSelfReference,
	IfcRelContainedInSpatialStructure_WR31,
	IfcRelDeclares_NoSelfReference,
	IfcRelDefinesByProperties_NoRelatedTypeObject,
	IfcRelInterferesElements_NoSelfReference,
	IfcRelNests_NoSelfReference,
	IfcRelPositions_NoSelfReference,
	IfcRelReferencedInSpatialStructure_AllowedRelatedElements,
	IfcRelSequence_AvoidInconsistentSequence,
	IfcRelSequence_CorrectSequenceType,
	IfcRelSpaceBoundary_CorrectPhysOrVirt,
	IfcReparametrisedCompositeCurveSegment_PositiveLengthParameter,
	IfcRepresentationMap_ApplicableMappedRepr,
	IfcRevolvedAreaSolid_AxisDirectionInXY,
	IfcRevolvedAreaSolid_AxisStartInXY,
	IfcRevolvedAreaSolidTapered_CorrectProfileAssignment,
	IfcRigidOperation_SameCoordinateType,
	IfcRoad_CorrectPredefinedType,
	IfcRoadPart_CorrectPredefinedType,
	IfcRoof_CorrectPredefinedType,
	IfcRoof_CorrectTypeAssigned,
	IfcRoofType_CorrectPredefinedType,
	IfcRoundedRectangleProfileDef_ValidRadius,
	IfcSanitaryTerminal_CorrectPredefinedType,
	IfcSanitaryTerminal_CorrectTypeAssigned,
	IfcSanitaryTerminalType_CorrectPredefinedType,
	IfcSeamCurve_SameSurface,
]);

// =============================================================================
// Phase EX-4, IFC4X3_ADD2 chunk 6 (planning/ifcopenshell-ts/70-express-rules-plan.md):
// the next 120 `SCOPE = 'entity'` rules, real ADD2 file order, `IfcSeamCurve_TwoPCurves`
// (real source line 11136) through `IfcTendon_CorrectPredefinedType` (line 12362),
// continuing directly from chunk 5's own last-ported rule (`IfcSeamCurve_SameSurface`,
// line 11127) with zero gap or overlap -- independently re-verified with the same
// `^class (\w+)` + `SCOPE = '(\w+)'`-matching script every prior chunk has used (120
// entity-scope classes in this range, confirmed -- `IfcSeamCurve_TwoPCurves` is real
// source entity position 556 of 752, `IfcTendon_CorrectPredefinedType` is position 675).
// `IfcTendon_CorrectTypeAssigned` (line 12372) and everything after is reserved for
// chunk 7. IFC4X3_ADD2 now at 700/779 (675/752 entity-scope + 25/25 type-scope).
//
// =============================================================================
// Byte-identical-vs-different breakdown vs. `IFC4.py` (schema-prefix-normalized,
// character-for-character, via a dedicated diff script matching prior chunks' own
// methodology)
// =============================================================================
//
// **101 of 120 rules are byte-identical** to `IFC4.py`'s own same-named rule bodies once
// the schema-prefix string (`'ifc4.'` -> `'ifc4x3_add2.'`) is normalized.
//
// **1 of 120 genuinely differs**: `IfcSystemFurnitureElementType_CorrectPredefinedType`
// -- ADD2 adds a leading `not exists(PredefinedType) or` guard IFC4's own version lacks,
// i.e. `PredefinedType` became OPTIONAL on `IfcSystemFurnitureElementType` in ADD2
// (mandatory in IFC4). The SAME shape of finding IFC4X3_ADD2 chunk 3 already made for
// `IfcFurnitureType_CorrectPredefinedType` -- `correctPredefinedType`'s own existing
// `predefinedTypeOptional` parameter already covers it, no new helper logic needed.
//
// **18 of 120 have no same-named `IFC4.py` counterpart**, each individually
// investigated (not assumed "new" from a name mismatch alone):
// - **16 are ordinary rules on 5 wholly-new-in-ADD2 entities** (confirmed via
//   `ifc4_entities.json`/`ifc4x3_entities.json`, not merely absent rule names):
//   `IfcSectionedSolid` (3: `ConsistentProfileTypes`/`DirectrixIs3D`/`SectionsSameType`),
//   `IfcSectionedSolidHorizontal` (2: `CorrespondingSectionPositions`/
//   `NoLongitudinalOffsets`), `IfcSectionedSurface` (5: `AreaProfileTypes`/
//   `CorrespondingSectionPositions`/`DirectrixIs3D`/`NoOffsets`/`SectionsSameType`),
//   `IfcSign`/`IfcSignType` (2: `CorrectPredefinedType`/`CorrectTypeAssigned` on
//   `IfcSign`, `CorrectPredefinedType` on `IfcSignType`), `IfcSignal`/`IfcSignalType`
//   (same 3-rule shape). `IfcSectionedSpine` (also new-looking by name) is NOT among
//   these -- confirmed already present in `IFC4.py` (its own 3 rules,
//   `ConsistentProfileTypes`/`CorrespondingSectionPositions`/`SpineCurveDim`, are
//   byte-identical, part of the 101 above).
// - **2 are genuine RULE_NAME renames on pre-existing IFC4 entities, each confirmed by
//   directly comparing the OLD (IFC4) and NEW (ADD2) rule bodies, not just noting the
//   name change**: `IfcStructuralAnalysisModel_HasObjectType` -> `_CorrectPredefinedType`
//   (body ALSO changed shape: IFC4's own `predefinedtype != USERDEFINED or
//   exists(ObjectType)` becomes ADD2's `predefinedtype != USERDEFINED or (predefinedtype
//   == USERDEFINED and exists(ObjectType))` -- logically equivalent, but now matches this
//   file's own standard `correctPredefinedType`/`userDefinedOrHasAttribute` shape exactly
//   instead of the `simpleUserDefinedOrHasAttribute` shape IFC4's own version used);
//   `IfcSurfaceFeature_HasObjectType` -> `_CorrectPredefinedType` (the SAME rename +
//   shape-standardization, but this one ALSO gains a `not exists(PredefinedType) or`
//   leading guard IFC4's own version already had -- i.e. `PredefinedType` was already
//   optional on `IfcSurfaceFeature` in IFC4, and stays optional in ADD2, so this one is a
//   pure rename + shape-standardization with no optionality change).
//
// **Real, checked, individually-investigated finding: `IfcShapeRepresentation_
// CorrectItemsForType`'s own rule-file-local EXPRESS helper, `IfcShapeRepresentationTypes`,
// genuinely differs between schemas even though the RULE's own class body (a single
// `IfcShapeRepresentationTypes(RepresentationType, Items)` call) is byte-identical** --
// this is NOT caught by a rule-class-body-only diff, and was found by separately diffing
// every rule-file-local EXPRESS-library helper this chunk's own rules call. ADD2's
// version (real source line 13840) adds: (1) the `'point'` branch now ALSO admits
// `IfcCartesianPointList` (an abstract new-in-ADD2 supertype of
// `IfcCartesianPointList2D`/`3D`), not just `IfcPoint`; (2) a wholly new `'segment'`
// branch (checks `IfcSegment` membership -- consistent with Phase EX-2's own already-
// recorded `IfcSegment`/`IfcPoint` DERIVE-formula-consolidation finding); (3) a wholly
// new `'sectionedsurface'` branch (checks `IfcSectionedSurface` membership -- the same
// wholly-new-in-ADD2 entity this chunk's own range ports 5 rules for, see above); (4) the
// `'advancedsweptsolid'` branch's own multi-type membership list gains
// `IfcSectionedSolidHorizontal` (also wholly new in ADD2, see above) alongside IFC4's own
// `IfcSweptAreaSolid`/`IfcSweptDiskSolid`. Ported as a genuinely NEW ADD2-specific
// `ifcShapeRepresentationTypes` (NOT a fresh unmodified copy of `whereRules/ifc4.ts`'s own
// version) -- see that function's own doc comment below for the full branch-by-branch
// citation.
//
// =============================================================================
// A real, verbatim-preserved upstream Python bug in this chunk (RECONFIRMED, not new --
// already found and disclosed for this identical rule name by `whereRules/ifc4.ts`'s own
// IFC4 chunk 5)
// =============================================================================
//
// **`IfcSurfaceReinforcementArea_NonnegativeArea1`/`_NonnegativeArea2` (real ADD2 source
// lines 12015/12025) never actually validate their own list's optional 3rd (shear)
// component's non-negativity, despite very plausibly intending to** -- independently
// re-confirmed genuinely present in `IFC4X3_ADD2.py`'s own real source (read directly,
// not assumed from the name match), and independently re-confirmed byte-identical to
// `IFC4.py`'s own version (lines 10350/10360) modulo only the schema-prefix string, per
// this chunk's own byte-identical-breakdown above. `SurfaceReinforcement1`/
// `SurfaceReinforcement2` are each a genuine `LIST [2:3] OF IfcLengthMeasure` (a
// 2-or-3-element `[x-direction, y-direction, optional xy-shear]` triple); the real body
// is `not exists(X) or (X[1] >= 0.0 and X[2] >= 0.0 and (sizeof(X) == 1 or X[1] >=
// 0.0))`. The trailing disjunct's own `sizeof(X) == 1` can NEVER be true (the schema's
// own `[2:3]` bound guarantees `sizeof(X)` is always 2 or 3), and its own `X[1] >= 0.0`
// re-reads the FIRST element again, not `X[3]` (the actual 3rd/shear element) -- the
// list's genuine optional 3rd element is never read or validated by this rule at all.
// Ported AS-IS below (`surfaceReinforcementNonnegative`), NOT "fixed", citing IFC4 chunk
// 5's own precedent directly (see `whereRules/ifc4.ts`'s own header comment for the full
// from-first-principles derivation and empirical confirmation) rather than re-deriving it
// from scratch.
//
// =============================================================================
// New shared helpers established this chunk (fresh local copies of `whereRules/ifc4.ts`'s
// own already-established helpers of the exact same shape, per this file family's own
// "no cross-schema-file dependency" precedent, EXCEPT `ifcShapeRepresentationTypes`,
// which is genuinely ADD2-specific -- see above)
// =============================================================================
//
// `simpleUserDefinedOrHasAttribute` (7 occurrences: `IfcStructuralCurveAction/
// CurveMember/CurveReaction_HasObjectType`, `IfcStructuralSurfaceAction/
// SurfaceMember_HasObjectType`, `IfcStructuralSurfaceReaction_HasPredefinedType`,
// `IfcStructuralResultGroup_HasObjectType`'s own `TheoryType` -- ONE FEWER than IFC4's own
// 8 direct occurrences, since `IfcStructuralAnalysisModel_HasObjectType`'s own rename +
// shape-standardization above moved it OUT of this shape and into the ordinary
// `correctPredefinedType` shape instead). `appliedLoadIsExactlyOneOf` (4 occurrences:
// `IfcStructuralLinearAction/PlanarAction_SuitableLoadType`,
// `IfcStructuralPointAction/PointReaction_SuitableLoadType`). `attrLessThan` (2
// occurrences: `IfcTShapeProfileDef_ValidFlangeThickness`/`ValidWebThickness`).
// `stylesCountAtMostOne` (5 occurrences, all `IfcSurfaceStyle_MaxOne*`).
// `sweptItemProfileTypeEquals` (2 occurrences: `IfcSweptAreaSolid_SweptAreaType`'s own
// `SweptArea`/`AREA`, `IfcSweptSurface_SweptCurveType`'s own `SweptCurve`/`CURVE`) --
// below this project's own 3-occurrence threshold in isolation, but an already-established
// IFC4 shape reused fresh, not a new discovery. `surfaceReinforcementNonnegative` (2
// occurrences, see "real upstream Python bug" above). `ifcTableUniformRowCells` (1
// occurrence: `IfcTable_WR1`, kept as its own named helper purely for readability, mirroring
// `whereRules/ifc4.ts`'s own identical choice).
//
// Also reused, already established earlier in THIS file (no changes needed):
// `correctPredefinedType`/`correctTypeAssigned` (37 + 15 occurrences respectively --
// `IfcSubContractResourceType`'s own `ResourceType` escape attribute and `IfcTaskType`'s
// own `ProcessType` escape attribute are both already-confirmed distinct
// escape-attribute values from earlier chunks, not new finds), `allShareFirstAttr` (1:
// `IfcSectionedSolid_ConsistentProfileTypes`), `allShareFirstTypeOf` (2:
// `IfcSectionedSolid_SectionsSameType`/`IfcSectionedSurface_SectionsSameType`),
// `attrDimEquals` (4: `IfcSectionedSolid_DirectrixIs3D`/`IfcSectionedSurface_DirectrixIs3D`/
// `IfcSurfaceCurve_CurveIs3D`/`IfcSweptDiskSolid_DirectrixDim`), `attrExists` (2:
// `IfcShapeRepresentation_HasRepresentationIdentifier`/`HasRepresentationType`,
// `IfcTask_HasName`), `attrGreaterThanZero` (1: `IfcSurfaceOfLinearExtrusion_
// DepthGreaterZero`), `directrixIsBoundedOrHasParams` (1: `IfcSweptDiskSolid_
// DirectrixBounded`).
//
// No new rule-file-local EXPRESS-library helpers ported this chunk (beyond the
// ADD2-specific `ifcShapeRepresentationTypes` rewrite above, which replaces rather than
// adds to this file's existing helper set).
// =============================================================================

/**
 * New shared shape (7 occurrences this chunk, see this file's own header comment) --
 * Python: `X != USERDEFINED or exists(Y)`. Fresh local copy of `whereRules/ifc4.ts`'s own
 * already-established helper of the exact same shape. Genuinely DIFFERENT from
 * `userDefinedOrHasAttribute` above (that helper's own second disjunct is additionally
 * gated by `X == USERDEFINED and ...`) -- NOT force-fit into it.
 */
function simpleUserDefinedOrHasAttribute(self: EntityInstance, enumAttrName: string, escapeAttrName: string): Tri {
	const value = expressGetAttr(self, enumAttrName, INDETERMINATE);
	return pyOr(triNe(value, "USERDEFINED"), () => exists(expressGetAttr(self, escapeAttrName, INDETERMINATE)));
}

/**
 * New shared shape (4 occurrences this chunk, see this file's own header comment) --
 * Python: `sizeof([type1, type2] * typeof(AppliedLoad)) == 1`. Fresh local copy of
 * `whereRules/ifc4.ts`'s own already-established helper of the exact same shape.
 */
function appliedLoadIsExactlyOneOf(self: EntityInstance, typeNames: readonly string[]): Tri {
	const appliedLoad = expressGetAttr(self, "AppliedLoad", INDETERMINATE);
	return triEq(typeOfAttr(appliedLoad).multiply(typeNames).size, 1);
}

/**
 * New shared shape (2 occurrences this chunk, see this file's own header comment) --
 * Python: `AttrA < AttrB`, both mandatory attributes read directly off `self`. Fresh
 * local copy of `whereRules/ifc4.ts`'s own already-established helper of the exact same
 * shape.
 */
function attrLessThan(self: EntityInstance, attrNameA: string, attrNameB: string): Tri {
	return triLt(expressGetAttr(self, attrNameA, INDETERMINATE), expressGetAttr(self, attrNameB, INDETERMINATE));
}

/**
 * New shared shape (5 occurrences this chunk, all `IfcSurfaceStyle_MaxOne*`, see this
 * file's own header comment) -- Python: `sizeof([style for style in Styles if TYPE in
 * typeof(style)]) <= 1`. Fresh local copy of `whereRules/ifc4.ts`'s own already-
 * established helper of the exact same shape.
 */
function stylesCountAtMostOne(self: EntityInstance, typeName: string): boolean {
	const styles = expressGetAttr(self, "Styles", INDETERMINATE);
	const items = isIndeterminate(styles) ? [] : (styles as EntityInstance[]);
	return items.filter((style) => typeOfAttr(style).has(typeName)).length <= 1;
}

/**
 * New shared shape (2 occurrences this chunk: `IfcSweptAreaSolid_SweptAreaType`'s own
 * `SweptArea`/`AREA`, `IfcSweptSurface_SweptCurveType`'s own `SweptCurve`/`CURVE`, see
 * this file's own header comment) -- Python: `X.ProfileType == IfcProfileTypeEnum.Y`.
 * Fresh local copy of `whereRules/ifc4.ts`'s own already-established helper of the exact
 * same shape.
 */
function sweptItemProfileTypeEquals(self: EntityInstance, attrName: string, expected: string): Tri {
	const value = expressGetAttr(self, attrName, INDETERMINATE);
	return triEq(expressGetAttr(value, "ProfileType", INDETERMINATE), expected);
}

/**
 * **Real upstream Python bug, verbatim-preserved -- see this chunk's own header comment
 * for the full derivation, RECONFIRMED (not new) from `whereRules/ifc4.ts`'s own IFC4
 * chunk 5 disclosure for this identical rule name.** Python
 * (`IfcSurfaceReinforcementArea_NonnegativeArea1`/`_NonnegativeArea2`, real ADD2 source
 * lines 12015/12025, byte-identical apart from the attribute name): `not exists(X) or
 * (X[1] >= 0.0 and X[2] >= 0.0 and (sizeof(X) == 1 or X[1] >= 0.0))`. The trailing
 * `sizeof(X) == 1 or X[1] >= 0.0` disjunct is dead code -- ported AS-IS, not "fixed" to
 * check the list's genuine optional 3rd (shear) element.
 */
function surfaceReinforcementNonnegative(self: EntityInstance, attrName: string): Tri {
	const value = expressGetAttr(self, attrName, INDETERMINATE);
	return pyOr(!exists(value), () =>
		pyAnd(triGe(expressGetItem(value, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 0.0), () =>
			pyAnd(triGe(expressGetItem(value, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 0.0), () =>
				pyOr(triEq(sizeof(value), 1), () =>
					triGe(expressGetItem(value, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 0.0),
				),
			),
		),
	);
}

/**
 * Python: `IfcTable_WR1`/`IfcTable_WR2`'s own shared `Rows` uniformity check (real ADD2
 * source line 12256) -- Python: `sizeof([temp for temp in Rows if hiindex(temp.RowCells)
 * != hiindex(Rows[1].RowCells)]) == 0`. `Rows[1]` is re-read via `expressGetItem` each
 * time it's needed (never cached), matching the real compiled body's own literal
 * repetition. Fresh local copy of `whereRules/ifc4.ts`'s own already-established helper
 * of the exact same shape.
 */
function ifcTableUniformRowCells(self: EntityInstance): boolean {
	const rows = expressGetAttr(self, "Rows", INDETERMINATE);
	const rowsList = asList<EntityInstance>(rows);
	const firstRowCells = expressGetAttr(
		expressGetItem(rows, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
		"RowCells",
		INDETERMINATE,
	);
	const mismatched = rowsList.filter(
		(temp) => triNe(hiIndex(expressGetAttr(temp, "RowCells", INDETERMINATE)), hiIndex(firstRowCells)) === true,
	).length;
	return mismatched === 0;
}

/**
 * Python: `IfcShapeRepresentationTypes(reptype, items)` (real ADD2 source line 13840) --
 * a rule-file-local EXPRESS-library helper, used by `IfcShapeRepresentation_
 * CorrectItemsForType` below. **Genuinely ADD2-specific, NOT a fresh unmodified copy of
 * `whereRules/ifc4.ts`'s own version** -- see this chunk's own header comment for the
 * full disclosure of all 4 real differences: the `'point'` branch also admits
 * `IfcCartesianPointList`; a new `'segment'` branch; a new `'sectionedsurface'` branch;
 * the `'advancedsweptsolid'` branch's own multi-type list gains
 * `IfcSectionedSolidHorizontal`. Every other branch is byte-identical to `whereRules/
 * ifc4.ts`'s own version (confirmed via direct diff of the real Python source), including
 * the `'geometriccurveset'` branch's own genuinely distinct second pass (decrementing the
 * running count once per `IfcGeometricSet` member that itself contains any `IfcSurface`
 * element) and the `'boundingbox'` branch's own post-count override (`items.length > 1`
 * forces `count = 0`), both ported literally, matching real control flow exactly.
 * `express_getattr(reptype, 'lower', INDETERMINATE)()` is ported as a plain
 * `.toLowerCase()`, not a new runtime-shim primitive (same as `ifc4.ts`'s own
 * established convention). An unrecognized `RepresentationType` value falls through to
 * Python's own `return None` (`INDETERMINATE`).
 */
function ifcShapeRepresentationTypes(reptype: unknown, items: unknown): Tri {
	const itemList = asList<EntityInstance>(items);
	const kind = typeof reptype === "string" ? reptype.toLowerCase() : undefined;
	let count: number;
	switch (kind) {
		case "point":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).has("ifc4x3_add2.ifcpoint") || typeOfAttr(temp).has("ifc4x3_add2.ifccartesianpointlist"),
			).length;
			break;
		case "pointcloud":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifccartesianpointlist3d")).length;
			break;
		case "curve":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifccurve")).length;
			break;
		case "curve2d":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).has("ifc4x3_add2.ifccurve") && triEq(expressGetAttr(temp, "Dim", INDETERMINATE), 2) === true,
			).length;
			break;
		case "curve3d":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).has("ifc4x3_add2.ifccurve") && triEq(expressGetAttr(temp, "Dim", INDETERMINATE), 3) === true,
			).length;
			break;
		case "segment":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcsegment")).length;
			break;
		case "surface":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcsurface")).length;
			break;
		case "surface2d":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).has("ifc4x3_add2.ifcsurface") &&
					triEq(expressGetAttr(temp, "Dim", INDETERMINATE), 2) === true,
			).length;
			break;
		case "surface3d":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).has("ifc4x3_add2.ifcsurface") &&
					triEq(expressGetAttr(temp, "Dim", INDETERMINATE), 3) === true,
			).length;
			break;
		case "sectionedsurface":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcsectionedsurface")).length;
			break;
		case "fillarea":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcannotationfillarea")).length;
			break;
		case "text":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifctextliteral")).length;
			break;
		case "advancedsurface":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcbsplinesurface")).length;
			break;
		case "annotation2d":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifcpoint",
						"ifc4x3_add2.ifccurve",
						"ifc4x3_add2.ifcgeometriccurveset",
						"ifc4x3_add2.ifcannotationfillarea",
						"ifc4x3_add2.ifctextliteral",
					]).size === 1,
			).length;
			break;
		case "geometricset":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifcgeometricset",
						"ifc4x3_add2.ifcpoint",
						"ifc4x3_add2.ifccurve",
						"ifc4x3_add2.ifcsurface",
					]).size >= 1,
			).length;
			break;
		case "geometriccurveset": {
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifcgeometriccurveset",
						"ifc4x3_add2.ifcgeometricset",
						"ifc4x3_add2.ifcpoint",
						"ifc4x3_add2.ifccurve",
					]).size >= 1,
			).length;
			for (const temp of itemList) {
				if (typeOfAttr(temp).has("ifc4x3_add2.ifcgeometricset")) {
					const elements = asList<EntityInstance>(expressGetAttr(temp, "Elements", INDETERMINATE));
					if (elements.filter((el) => typeOfAttr(el).has("ifc4x3_add2.ifcsurface")).length > 0) {
						count -= 1;
					}
				}
			}
			break;
		}
		case "tessellation":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifctessellateditem")).length;
			break;
		case "surfaceorsolidmodel":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifctessellateditem",
						"ifc4x3_add2.ifcshellbasedsurfacemodel",
						"ifc4x3_add2.ifcfacebasedsurfacemodel",
						"ifc4x3_add2.ifcsolidmodel",
					]).size >= 1,
			).length;
			break;
		case "surfacemodel":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifctessellateditem",
						"ifc4x3_add2.ifcshellbasedsurfacemodel",
						"ifc4x3_add2.ifcfacebasedsurfacemodel",
					]).size >= 1,
			).length;
			break;
		case "solidmodel":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcsolidmodel")).length;
			break;
		case "sweptsolid":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply(["ifc4x3_add2.ifcextrudedareasolid", "ifc4x3_add2.ifcrevolvedareasolid"]).size >=
						1 &&
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifcextrudedareasolidtapered",
						"ifc4x3_add2.ifcrevolvedareasolidtapered",
					]).size === 0,
			).length;
			break;
		case "advancedsweptsolid":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifcsweptareasolid",
						"ifc4x3_add2.ifcsweptdisksolid",
						"ifc4x3_add2.ifcsectionedsolidhorizontal",
					]).size >= 1,
			).length;
			break;
		case "csg":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply([
						"ifc4x3_add2.ifcbooleanresult",
						"ifc4x3_add2.ifccsgprimitive3d",
						"ifc4x3_add2.ifccsgsolid",
					]).size >= 1,
			).length;
			break;
		case "clipping":
			count = itemList.filter(
				(temp) =>
					typeOfAttr(temp).multiply(["ifc4x3_add2.ifccsgsolid", "ifc4x3_add2.ifcbooleanclippingresult"]).size >= 1,
			).length;
			break;
		case "brep":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcfacetedbrep")).length;
			break;
		case "advancedbrep":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcmanifoldsolidbrep")).length;
			break;
		case "boundingbox":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcboundingbox")).length;
			if (itemList.length > 1) count = 0;
			break;
		case "sectionedspine":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcsectionedspine")).length;
			break;
		case "lightsource":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifclightsource")).length;
			break;
		case "mappedrepresentation":
			count = itemList.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcmappeditem")).length;
			break;
		default:
			return INDETERMINATE;
	}
	return count === itemList.length;
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 11136-12362, this chunk's own 120).
// =============================================================================

// `IfcSeamCurve_TwoPCurves` (line 11136): `sizeof(AssociatedGeometry) == 2`.
const IfcSeamCurve_TwoPCurves = entityRule("IfcSeamCurve", "TwoPCurves", (self) => {
	assertWhereRule(
		triEq(sizeof(expressGetAttr(self, "AssociatedGeometry", INDETERMINATE)), 2),
		"IfcSeamCurve: AssociatedGeometry must have exactly 2 members.",
	);
});

// `IfcSectionedSolid_ConsistentProfileTypes` (line 11145): every CrossSections member
// shares the first member's own ProfileType.
const IfcSectionedSolid_ConsistentProfileTypes = entityRule("IfcSectionedSolid", "ConsistentProfileTypes", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "CrossSections", "ProfileType"),
		"IfcSectionedSolid: every CrossSections member must share the first member's own ProfileType.",
	);
});

// `IfcSectionedSolid_DirectrixIs3D` (line 11155): `Directrix.Dim == 3`.
const IfcSectionedSolid_DirectrixIs3D = entityRule("IfcSectionedSolid", "DirectrixIs3D", (self) => {
	assertWhereRule(attrDimEquals(self, "Directrix", 3), "IfcSectionedSolid.Directrix.Dim must equal 3.");
});

// `IfcSectionedSolid_SectionsSameType` (line 11165): every CrossSections member shares
// the first member's own type.
const IfcSectionedSolid_SectionsSameType = entityRule("IfcSectionedSolid", "SectionsSameType", (self) => {
	assertWhereRule(
		allShareFirstTypeOf(self, "CrossSections"),
		"IfcSectionedSolid: every CrossSections member must share the first member's own type.",
	);
});

// `IfcSectionedSolidHorizontal_CorrespondingSectionPositions` (line 11175):
// `sizeof(CrossSections) == sizeof(CrossSectionPositions)`.
const IfcSectionedSolidHorizontal_CorrespondingSectionPositions = entityRule(
	"IfcSectionedSolidHorizontal",
	"CorrespondingSectionPositions",
	(self) => {
		const crossSections = expressGetAttr(self, "CrossSections", INDETERMINATE);
		const crossSectionPositions = expressGetAttr(self, "CrossSectionPositions", INDETERMINATE);
		assertWhereRule(
			triEq(sizeof(crossSections), sizeof(crossSectionPositions)),
			"IfcSectionedSolidHorizontal: CrossSections and CrossSectionPositions must have equal size.",
		);
	},
);

// `IfcSectionedSolidHorizontal_NoLongitudinalOffsets` (line 11186): no
// CrossSectionPositions member's own Location has an OffsetLongitudinal.
const IfcSectionedSolidHorizontal_NoLongitudinalOffsets = entityRule(
	"IfcSectionedSolidHorizontal",
	"NoLongitudinalOffsets",
	(self) => {
		const crossSectionPositions = asList<EntityInstance>(expressGetAttr(self, "CrossSectionPositions", INDETERMINATE));
		const violating = crossSectionPositions.filter((temp) =>
			exists(expressGetAttr(expressGetAttr(temp, "Location", INDETERMINATE), "OffsetLongitudinal", INDETERMINATE)),
		).length;
		assertWhereRule(
			violating === 0,
			"IfcSectionedSolidHorizontal: no CrossSectionPositions member's own Location may have an OffsetLongitudinal.",
		);
	},
);

// `IfcSectionedSpine_ConsistentProfileTypes` (line 11196): byte-identical to
// `IFC4.py`'s own version.
const IfcSectionedSpine_ConsistentProfileTypes = entityRule("IfcSectionedSpine", "ConsistentProfileTypes", (self) => {
	assertWhereRule(
		allShareFirstAttr(self, "CrossSections", "ProfileType"),
		"IfcSectionedSpine: every CrossSections member must share the first member's own ProfileType.",
	);
});

// `IfcSectionedSpine_CorrespondingSectionPositions` (line 11206): byte-identical to
// `IFC4.py`'s own version.
const IfcSectionedSpine_CorrespondingSectionPositions = entityRule(
	"IfcSectionedSpine",
	"CorrespondingSectionPositions",
	(self) => {
		const crossSections = expressGetAttr(self, "CrossSections", INDETERMINATE);
		const crossSectionPositions = expressGetAttr(self, "CrossSectionPositions", INDETERMINATE);
		assertWhereRule(
			triEq(sizeof(crossSections), sizeof(crossSectionPositions)),
			"IfcSectionedSpine: CrossSections and CrossSectionPositions must have equal size.",
		);
	},
);

// `IfcSectionedSpine_SpineCurveDim` (line 11217): byte-identical to `IFC4.py`'s own
// version.
const IfcSectionedSpine_SpineCurveDim = entityRule("IfcSectionedSpine", "SpineCurveDim", (self) => {
	assertWhereRule(attrDimEquals(self, "SpineCurve", 3), "IfcSectionedSpine.SpineCurve.Dim must equal 3.");
});

// `IfcSectionedSurface_AreaProfileTypes` (line 11230): at least one CrossSections
// member's own ProfileType is CURVE.
const IfcSectionedSurface_AreaProfileTypes = entityRule("IfcSectionedSurface", "AreaProfileTypes", (self) => {
	const crossSections = asList<EntityInstance>(expressGetAttr(self, "CrossSections", INDETERMINATE));
	const matching = crossSections.filter(
		(temp) => triEq(expressGetAttr(temp, "ProfileType", INDETERMINATE), "CURVE") === true,
	).length;
	assertWhereRule(
		matching !== 0,
		"IfcSectionedSurface: at least one CrossSections member's own ProfileType must be CURVE.",
	);
});

// `IfcSectionedSurface_CorrespondingSectionPositions` (line 11240):
// `sizeof(CrossSections) == sizeof(CrossSectionPositions)`.
const IfcSectionedSurface_CorrespondingSectionPositions = entityRule(
	"IfcSectionedSurface",
	"CorrespondingSectionPositions",
	(self) => {
		const crossSectionPositions = expressGetAttr(self, "CrossSectionPositions", INDETERMINATE);
		const crossSections = expressGetAttr(self, "CrossSections", INDETERMINATE);
		assertWhereRule(
			triEq(sizeof(crossSections), sizeof(crossSectionPositions)),
			"IfcSectionedSurface: CrossSections and CrossSectionPositions must have equal size.",
		);
	},
);

// `IfcSectionedSurface_DirectrixIs3D` (line 11251): `Directrix.Dim == 3`.
const IfcSectionedSurface_DirectrixIs3D = entityRule("IfcSectionedSurface", "DirectrixIs3D", (self) => {
	assertWhereRule(attrDimEquals(self, "Directrix", 3), "IfcSectionedSurface.Directrix.Dim must equal 3.");
});

// `IfcSectionedSurface_NoOffsets` (line 11261): no CrossSectionPositions member's own
// Location has an OffsetLateral, OffsetVertical, or OffsetLongitudinal.
const IfcSectionedSurface_NoOffsets = entityRule("IfcSectionedSurface", "NoOffsets", (self) => {
	const crossSectionPositions = asList<EntityInstance>(expressGetAttr(self, "CrossSectionPositions", INDETERMINATE));
	const violating = crossSectionPositions.filter((temp) => {
		const location = expressGetAttr(temp, "Location", INDETERMINATE);
		return (
			exists(expressGetAttr(location, "OffsetLateral", INDETERMINATE)) ||
			exists(expressGetAttr(location, "OffsetVertical", INDETERMINATE)) ||
			exists(expressGetAttr(location, "OffsetLongitudinal", INDETERMINATE))
		);
	}).length;
	assertWhereRule(
		violating === 0,
		"IfcSectionedSurface: no CrossSectionPositions member's own Location may have an OffsetLateral/OffsetVertical/OffsetLongitudinal.",
	);
});

// `IfcSectionedSurface_SectionsSameType` (line 11271): every CrossSections member shares
// the first member's own type.
const IfcSectionedSurface_SectionsSameType = entityRule("IfcSectionedSurface", "SectionsSameType", (self) => {
	assertWhereRule(
		allShareFirstTypeOf(self, "CrossSections"),
		"IfcSectionedSurface: every CrossSections member must share the first member's own type.",
	);
});

// `IfcSensor_CorrectPredefinedType` (line 11284).
const IfcSensor_CorrectPredefinedType = entityRule("IfcSensor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSensor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSensor_CorrectTypeAssigned` (line 11294).
const IfcSensor_CorrectTypeAssigned = entityRule("IfcSensor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSensorType"),
		"IfcSensor: if IsTypedBy is given, its RelatingType must be an IfcSensorType.",
	);
});

// `IfcSensorType_CorrectPredefinedType` (line 11304).
const IfcSensorType_CorrectPredefinedType = entityRule("IfcSensorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSensorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcShadingDevice_CorrectPredefinedType` (line 11314).
const IfcShadingDevice_CorrectPredefinedType = entityRule("IfcShadingDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcShadingDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcShadingDevice_CorrectTypeAssigned` (line 11324).
const IfcShadingDevice_CorrectTypeAssigned = entityRule("IfcShadingDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcShadingDeviceType"),
		"IfcShadingDevice: if IsTypedBy is given, its RelatingType must be an IfcShadingDeviceType.",
	);
});

// `IfcShadingDeviceType_CorrectPredefinedType` (line 11334).
const IfcShadingDeviceType_CorrectPredefinedType = entityRule(
	"IfcShadingDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcShadingDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcShapeModel_WR11` (line 11344): exactly one of
// OfProductRepresentation/RepresentationMap/OfShapeAspect has exactly one member.
const IfcShapeModel_WR11 = entityRule("IfcShapeModel", "WR11", (self) => {
	const ofProductRepresentation = expressGetAttr(self, "OfProductRepresentation", INDETERMINATE);
	const representationMap = expressGetAttr(self, "RepresentationMap", INDETERMINATE);
	const ofShapeAspect = expressGetAttr(self, "OfShapeAspect", INDETERMINATE);
	assertWhereRule(
		triXor(
			triXor(triEq(sizeof(ofProductRepresentation), 1), triEq(sizeof(representationMap), 1)),
			triEq(sizeof(ofShapeAspect), 1),
		),
		"IfcShapeModel: exactly one of OfProductRepresentation/RepresentationMap/OfShapeAspect must have exactly one member.",
	);
});

// `IfcShapeRepresentation_CorrectContext` (line 11354):
// `'ifc4x3_add2.ifcgeometricrepresentationcontext' in typeof(ContextOfItems)`.
const IfcShapeRepresentation_CorrectContext = entityRule("IfcShapeRepresentation", "CorrectContext", (self) => {
	const contextOfItems = expressGetAttr(self, "ContextOfItems", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(contextOfItems).has("ifc4x3_add2.ifcgeometricrepresentationcontext"),
		"IfcShapeRepresentation.ContextOfItems must be an IfcGeometricRepresentationContext.",
	);
});

// `IfcShapeRepresentation_CorrectItemsForType` (line 11363):
// `IfcShapeRepresentationTypes(RepresentationType, Items)` -- see this chunk's own header
// comment for the ADD2-specific helper differences.
const IfcShapeRepresentation_CorrectItemsForType = entityRule(
	"IfcShapeRepresentation",
	"CorrectItemsForType",
	(self) => {
		const representationType = expressGetAttr(self, "RepresentationType", INDETERMINATE);
		const items = expressGetAttr(self, "Items", INDETERMINATE);
		assertWhereRule(
			ifcShapeRepresentationTypes(representationType, items),
			"IfcShapeRepresentation: every Items member must match RepresentationType's own constraint.",
		);
	},
);

// `IfcShapeRepresentation_HasRepresentationIdentifier` (line 11372):
// `exists(RepresentationIdentifier)`.
const IfcShapeRepresentation_HasRepresentationIdentifier = entityRule(
	"IfcShapeRepresentation",
	"HasRepresentationIdentifier",
	(self) => {
		assertWhereRule(
			attrExists(self, "RepresentationIdentifier"),
			"IfcShapeRepresentation.RepresentationIdentifier must be given.",
		);
	},
);

// `IfcShapeRepresentation_HasRepresentationType` (line 11381): `exists(RepresentationType)`.
const IfcShapeRepresentation_HasRepresentationType = entityRule(
	"IfcShapeRepresentation",
	"HasRepresentationType",
	(self) => {
		assertWhereRule(attrExists(self, "RepresentationType"), "IfcShapeRepresentation.RepresentationType must be given.");
	},
);

// `IfcShapeRepresentation_NoTopologicalItem` (line 11390): `sizeof([temp for temp in
// Items if 'ifctopologicalrepresentationitem' in typeof(temp) and (not sizeof([3 types] *
// typeof(temp)) == 1)]) == 0`.
const IfcShapeRepresentation_NoTopologicalItem = entityRule("IfcShapeRepresentation", "NoTopologicalItem", (self) => {
	const items = asList<EntityInstance>(expressGetAttr(self, "Items", INDETERMINATE));
	const violating = items.filter((temp) => {
		const isTopological = typeOfAttr(temp).has("ifc4x3_add2.ifctopologicalrepresentationitem");
		const matchesExactlyOne =
			typeOfAttr(temp).multiply([
				"ifc4x3_add2.ifcvertexpoint",
				"ifc4x3_add2.ifcedgecurve",
				"ifc4x3_add2.ifcfacesurface",
			]).size === 1;
		return isTopological && !matchesExactlyOne;
	}).length;
	assertWhereRule(
		violating === 0,
		"IfcShapeRepresentation: every IfcTopologicalRepresentationItem member must be exactly one of IfcVertexPoint/IfcEdgeCurve/IfcFaceSurface.",
	);
});

// `IfcSign_CorrectPredefinedType` (line 11403): genuinely new in ADD2 (`IfcSign` does not
// exist in IFC4).
const IfcSign_CorrectPredefinedType = entityRule("IfcSign", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSign: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSign_CorrectTypeAssigned` (line 11413): genuinely new in ADD2.
const IfcSign_CorrectTypeAssigned = entityRule("IfcSign", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSignType"),
		"IfcSign: if IsTypedBy is given, its RelatingType must be an IfcSignType.",
	);
});

// `IfcSignType_CorrectPredefinedType` (line 11423): genuinely new in ADD2.
const IfcSignType_CorrectPredefinedType = entityRule("IfcSignType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSignType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcSignal_CorrectPredefinedType` (line 11433): genuinely new in ADD2 (`IfcSignal` does
// not exist in IFC4).
const IfcSignal_CorrectPredefinedType = entityRule("IfcSignal", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSignal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSignal_CorrectTypeAssigned` (line 11443): genuinely new in ADD2.
const IfcSignal_CorrectTypeAssigned = entityRule("IfcSignal", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSignalType"),
		"IfcSignal: if IsTypedBy is given, its RelatingType must be an IfcSignalType.",
	);
});

// `IfcSignalType_CorrectPredefinedType` (line 11453): genuinely new in ADD2.
const IfcSignalType_CorrectPredefinedType = entityRule("IfcSignalType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSignalType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcSlab_CorrectPredefinedType` (line 11463).
const IfcSlab_CorrectPredefinedType = entityRule("IfcSlab", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSlab: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSlab_CorrectTypeAssigned` (line 11473).
const IfcSlab_CorrectTypeAssigned = entityRule("IfcSlab", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSlabType"),
		"IfcSlab: if IsTypedBy is given, its RelatingType must be an IfcSlabType.",
	);
});

// `IfcSlabType_CorrectPredefinedType` (line 11483).
const IfcSlabType_CorrectPredefinedType = entityRule("IfcSlabType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSlabType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcSolarDevice_CorrectPredefinedType` (line 11493).
const IfcSolarDevice_CorrectPredefinedType = entityRule("IfcSolarDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSolarDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSolarDevice_CorrectTypeAssigned` (line 11503).
const IfcSolarDevice_CorrectTypeAssigned = entityRule("IfcSolarDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSolarDeviceType"),
		"IfcSolarDevice: if IsTypedBy is given, its RelatingType must be an IfcSolarDeviceType.",
	);
});

// `IfcSolarDeviceType_CorrectPredefinedType` (line 11513).
const IfcSolarDeviceType_CorrectPredefinedType = entityRule("IfcSolarDeviceType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSolarDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcSpace_CorrectPredefinedType` (line 11526).
const IfcSpace_CorrectPredefinedType = entityRule("IfcSpace", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSpace: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSpace_CorrectTypeAssigned` (line 11536).
const IfcSpace_CorrectTypeAssigned = entityRule("IfcSpace", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSpaceType"),
		"IfcSpace: if IsTypedBy is given, its RelatingType must be an IfcSpaceType.",
	);
});

// `IfcSpaceHeater_CorrectPredefinedType` (line 11546).
const IfcSpaceHeater_CorrectPredefinedType = entityRule("IfcSpaceHeater", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSpaceHeater: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSpaceHeater_CorrectTypeAssigned` (line 11556).
const IfcSpaceHeater_CorrectTypeAssigned = entityRule("IfcSpaceHeater", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSpaceHeaterType"),
		"IfcSpaceHeater: if IsTypedBy is given, its RelatingType must be an IfcSpaceHeaterType.",
	);
});

// `IfcSpaceHeaterType_CorrectPredefinedType` (line 11566).
const IfcSpaceHeaterType_CorrectPredefinedType = entityRule("IfcSpaceHeaterType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSpaceHeaterType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcSpaceType_CorrectPredefinedType` (line 11576).
const IfcSpaceType_CorrectPredefinedType = entityRule("IfcSpaceType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSpaceType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcSpatialStructureElement_WR41` (line 11586): byte-identical to `IFC4.py`'s own
// version -- `hiindex(Decomposes) == 1 and 'ifcrelaggregates' in typeof(Decomposes[0])
// and ('ifcproject' in typeof(Decomposes[0].RelatingObject) or
// 'ifcspatialstructureelement' in typeof(Decomposes[0].RelatingObject))`.
const IfcSpatialStructureElement_WR41 = entityRule("IfcSpatialStructureElement", "WR41", (self) => {
	const decomposes = expressGetAttr(self, "Decomposes", INDETERMINATE);
	const first = expressGetItem(decomposes, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const relatingObject = expressGetAttr(first, "RelatingObject", INDETERMINATE);
	assertWhereRule(
		pyAnd(triEq(hiIndex(decomposes), 1), () =>
			pyAnd(
				typeOfAttr(first).has("ifc4x3_add2.ifcrelaggregates"),
				() =>
					typeOfAttr(relatingObject).has("ifc4x3_add2.ifcproject") ||
					typeOfAttr(relatingObject).has("ifc4x3_add2.ifcspatialstructureelement"),
			),
		),
		"IfcSpatialStructureElement: must be decomposed by exactly one IfcRelAggregates whose own RelatingObject is an IfcProject or IfcSpatialStructureElement.",
	);
});

// `IfcSpatialZone_CorrectPredefinedType` (line 11595).
const IfcSpatialZone_CorrectPredefinedType = entityRule("IfcSpatialZone", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSpatialZone: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSpatialZone_CorrectTypeAssigned` (line 11605).
const IfcSpatialZone_CorrectTypeAssigned = entityRule("IfcSpatialZone", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSpatialZoneType"),
		"IfcSpatialZone: if IsTypedBy is given, its RelatingType must be an IfcSpatialZoneType.",
	);
});

// `IfcSpatialZoneType_CorrectPredefinedType` (line 11615).
const IfcSpatialZoneType_CorrectPredefinedType = entityRule("IfcSpatialZoneType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcSpatialZoneType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcStackTerminal_CorrectPredefinedType` (line 11625).
const IfcStackTerminal_CorrectPredefinedType = entityRule("IfcStackTerminal", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcStackTerminal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStackTerminal_CorrectTypeAssigned` (line 11635).
const IfcStackTerminal_CorrectTypeAssigned = entityRule("IfcStackTerminal", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcStackTerminalType"),
		"IfcStackTerminal: if IsTypedBy is given, its RelatingType must be an IfcStackTerminalType.",
	);
});

// `IfcStackTerminalType_CorrectPredefinedType` (line 11645).
const IfcStackTerminalType_CorrectPredefinedType = entityRule(
	"IfcStackTerminalType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcStackTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcStair_CorrectPredefinedType` (line 11655).
const IfcStair_CorrectPredefinedType = entityRule("IfcStair", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcStair: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStair_CorrectTypeAssigned` (line 11665).
const IfcStair_CorrectTypeAssigned = entityRule("IfcStair", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcStairType"),
		"IfcStair: if IsTypedBy is given, its RelatingType must be an IfcStairType.",
	);
});

// `IfcStairFlight_CorrectPredefinedType` (line 11675).
const IfcStairFlight_CorrectPredefinedType = entityRule("IfcStairFlight", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcStairFlight: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStairFlight_CorrectTypeAssigned` (line 11685).
const IfcStairFlight_CorrectTypeAssigned = entityRule("IfcStairFlight", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcStairFlightType"),
		"IfcStairFlight: if IsTypedBy is given, its RelatingType must be an IfcStairFlightType.",
	);
});

// `IfcStairFlightType_CorrectPredefinedType` (line 11695).
const IfcStairFlightType_CorrectPredefinedType = entityRule("IfcStairFlightType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcStairFlightType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcStairType_CorrectPredefinedType` (line 11705).
const IfcStairType_CorrectPredefinedType = entityRule("IfcStairType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcStairType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcStructuralAnalysisModel_CorrectPredefinedType` (line 11715): **genuine rename +
// shape-standardization from IFC4's own `_HasObjectType`** -- see this chunk's own header
// comment. Now matches the ordinary `correctPredefinedType` shape (mandatory
// PredefinedType, no leading `not exists` guard).
const IfcStructuralAnalysisModel_CorrectPredefinedType = entityRule(
	"IfcStructuralAnalysisModel",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", false),
			"IfcStructuralAnalysisModel: if PredefinedType is USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcStructuralCurveAction_HasObjectType` (line 11725): see `simpleUserDefinedOrHasAttribute`.
const IfcStructuralCurveAction_HasObjectType = entityRule("IfcStructuralCurveAction", "HasObjectType", (self) => {
	assertWhereRule(
		simpleUserDefinedOrHasAttribute(self, "PredefinedType", "ObjectType"),
		"IfcStructuralCurveAction: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStructuralCurveAction_ProjectedIsGlobal` (line 11735): `not exists(ProjectedOrTrue)
// or (ProjectedOrTrue != PROJECTED_LENGTH or GlobalOrLocal == GLOBAL_COORDS)`. Shares this
// exact shape with `IfcStructuralSurfaceAction_ProjectedIsGlobal` below (2 occurrences
// total in this chunk -- below this project's own 3-occurrence factoring threshold, kept
// bespoke, matching `whereRules/ifc4.ts`'s own identical decision for this identical
// rule).
const IfcStructuralCurveAction_ProjectedIsGlobal = entityRule(
	"IfcStructuralCurveAction",
	"ProjectedIsGlobal",
	(self) => {
		const projectedOrTrue = expressGetAttr(self, "ProjectedOrTrue", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(projectedOrTrue), () =>
				pyOr(triNe(projectedOrTrue, "PROJECTED_LENGTH"), () =>
					triEq(expressGetAttr(self, "GlobalOrLocal", INDETERMINATE), "GLOBAL_COORDS"),
				),
			),
			"IfcStructuralCurveAction: if ProjectedOrTrue is PROJECTED_LENGTH, GlobalOrLocal must be GLOBAL_COORDS.",
		);
	},
);

// `IfcStructuralCurveAction_SuitablePredefinedType` (line 11745): `PredefinedType !=
// EQUIDISTANT`.
const IfcStructuralCurveAction_SuitablePredefinedType = entityRule(
	"IfcStructuralCurveAction",
	"SuitablePredefinedType",
	(self) => {
		assertWhereRule(
			triNe(expressGetAttr(self, "PredefinedType", INDETERMINATE), "EQUIDISTANT"),
			"IfcStructuralCurveAction: PredefinedType must not be EQUIDISTANT.",
		);
	},
);

// `IfcStructuralCurveMember_HasObjectType` (line 11755): see `simpleUserDefinedOrHasAttribute`.
const IfcStructuralCurveMember_HasObjectType = entityRule("IfcStructuralCurveMember", "HasObjectType", (self) => {
	assertWhereRule(
		simpleUserDefinedOrHasAttribute(self, "PredefinedType", "ObjectType"),
		"IfcStructuralCurveMember: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStructuralCurveReaction_HasObjectType` (line 11765): see `simpleUserDefinedOrHasAttribute`.
const IfcStructuralCurveReaction_HasObjectType = entityRule("IfcStructuralCurveReaction", "HasObjectType", (self) => {
	assertWhereRule(
		simpleUserDefinedOrHasAttribute(self, "PredefinedType", "ObjectType"),
		"IfcStructuralCurveReaction: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStructuralCurveReaction_SuitablePredefinedType` (line 11775): `PredefinedType !=
// SINUS and PredefinedType != PARABOLA`.
const IfcStructuralCurveReaction_SuitablePredefinedType = entityRule(
	"IfcStructuralCurveReaction",
	"SuitablePredefinedType",
	(self) => {
		const predefinedType = expressGetAttr(self, "PredefinedType", INDETERMINATE);
		assertWhereRule(
			pyAnd(triNe(predefinedType, "SINUS"), () => triNe(predefinedType, "PARABOLA")),
			"IfcStructuralCurveReaction: PredefinedType must not be SINUS or PARABOLA.",
		);
	},
);

// `IfcStructuralLinearAction_ConstPredefinedType` (line 11785): `PredefinedType == CONST`.
const IfcStructuralLinearAction_ConstPredefinedType = entityRule(
	"IfcStructuralLinearAction",
	"ConstPredefinedType",
	(self) => {
		assertWhereRule(
			triEq(expressGetAttr(self, "PredefinedType", INDETERMINATE), "CONST"),
			"IfcStructuralLinearAction.PredefinedType must be CONST.",
		);
	},
);

// `IfcStructuralLinearAction_SuitableLoadType` (line 11794): see `appliedLoadIsExactlyOneOf`.
const IfcStructuralLinearAction_SuitableLoadType = entityRule(
	"IfcStructuralLinearAction",
	"SuitableLoadType",
	(self) => {
		assertWhereRule(
			appliedLoadIsExactlyOneOf(self, [
				"ifc4x3_add2.ifcstructuralloadlinearforce",
				"ifc4x3_add2.ifcstructuralloadtemperature",
			]),
			"IfcStructuralLinearAction.AppliedLoad must be exactly one of IfcStructuralLoadLinearForce/IfcStructuralLoadTemperature.",
		);
	},
);

// `IfcStructuralLoadCase_IsLoadCasePredefinedType` (line 11803): `PredefinedType ==
// LOAD_CASE`.
const IfcStructuralLoadCase_IsLoadCasePredefinedType = entityRule(
	"IfcStructuralLoadCase",
	"IsLoadCasePredefinedType",
	(self) => {
		assertWhereRule(
			triEq(expressGetAttr(self, "PredefinedType", INDETERMINATE), "LOAD_CASE"),
			"IfcStructuralLoadCase.PredefinedType must be LOAD_CASE.",
		);
	},
);

// `IfcStructuralLoadConfiguration_ValidListSize` (line 11812): `not exists(Locations) or
// sizeof(Locations) == sizeof(Values)`.
const IfcStructuralLoadConfiguration_ValidListSize = entityRule(
	"IfcStructuralLoadConfiguration",
	"ValidListSize",
	(self) => {
		const values = expressGetAttr(self, "Values", INDETERMINATE);
		const locations = expressGetAttr(self, "Locations", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(locations), () => triEq(sizeof(locations), sizeof(values))),
			"IfcStructuralLoadConfiguration: if Locations is given, it must have the same size as Values.",
		);
	},
);

// `IfcStructuralLoadGroup_HasObjectType` (line 11823): `(PredefinedType != USERDEFINED and
// ActionType != USERDEFINED and ActionSource != USERDEFINED) or exists(ObjectType)`. A
// 3-condition AND gating the escape attribute -- superficially similar to, but NOT an
// instance of, `simpleUserDefinedOrHasAttribute` above; ported bespoke, matching
// `whereRules/ifc4.ts`'s own identical decision for this byte-identical rule.
const IfcStructuralLoadGroup_HasObjectType = entityRule("IfcStructuralLoadGroup", "HasObjectType", (self) => {
	const predefinedType = expressGetAttr(self, "PredefinedType", INDETERMINATE);
	const actionType = expressGetAttr(self, "ActionType", INDETERMINATE);
	const actionSource = expressGetAttr(self, "ActionSource", INDETERMINATE);
	assertWhereRule(
		pyOr(
			pyAnd(triNe(predefinedType, "USERDEFINED"), () =>
				pyAnd(triNe(actionType, "USERDEFINED"), () => triNe(actionSource, "USERDEFINED")),
			),
			() => exists(expressGetAttr(self, "ObjectType", INDETERMINATE)),
		),
		"IfcStructuralLoadGroup: if PredefinedType/ActionType/ActionSource are all USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStructuralPlanarAction_ConstPredefinedType` (line 11835): `PredefinedType == CONST`.
const IfcStructuralPlanarAction_ConstPredefinedType = entityRule(
	"IfcStructuralPlanarAction",
	"ConstPredefinedType",
	(self) => {
		assertWhereRule(
			triEq(expressGetAttr(self, "PredefinedType", INDETERMINATE), "CONST"),
			"IfcStructuralPlanarAction.PredefinedType must be CONST.",
		);
	},
);

// `IfcStructuralPlanarAction_SuitableLoadType` (line 11844): see `appliedLoadIsExactlyOneOf`.
const IfcStructuralPlanarAction_SuitableLoadType = entityRule(
	"IfcStructuralPlanarAction",
	"SuitableLoadType",
	(self) => {
		assertWhereRule(
			appliedLoadIsExactlyOneOf(self, [
				"ifc4x3_add2.ifcstructuralloadplanarforce",
				"ifc4x3_add2.ifcstructuralloadtemperature",
			]),
			"IfcStructuralPlanarAction.AppliedLoad must be exactly one of IfcStructuralLoadPlanarForce/IfcStructuralLoadTemperature.",
		);
	},
);

// `IfcStructuralPointAction_SuitableLoadType` (line 11853): see `appliedLoadIsExactlyOneOf`.
const IfcStructuralPointAction_SuitableLoadType = entityRule("IfcStructuralPointAction", "SuitableLoadType", (self) => {
	assertWhereRule(
		appliedLoadIsExactlyOneOf(self, [
			"ifc4x3_add2.ifcstructuralloadsingleforce",
			"ifc4x3_add2.ifcstructuralloadsingledisplacement",
		]),
		"IfcStructuralPointAction.AppliedLoad must be exactly one of IfcStructuralLoadSingleForce/IfcStructuralLoadSingleDisplacement.",
	);
});

// `IfcStructuralPointReaction_SuitableLoadType` (line 11862): see `appliedLoadIsExactlyOneOf`.
const IfcStructuralPointReaction_SuitableLoadType = entityRule(
	"IfcStructuralPointReaction",
	"SuitableLoadType",
	(self) => {
		assertWhereRule(
			appliedLoadIsExactlyOneOf(self, [
				"ifc4x3_add2.ifcstructuralloadsingleforce",
				"ifc4x3_add2.ifcstructuralloadsingledisplacement",
			]),
			"IfcStructuralPointReaction.AppliedLoad must be exactly one of IfcStructuralLoadSingleForce/IfcStructuralLoadSingleDisplacement.",
		);
	},
);

// `IfcStructuralResultGroup_HasObjectType` (line 11871): see
// `simpleUserDefinedOrHasAttribute` (its own `TheoryType`, not `PredefinedType`).
const IfcStructuralResultGroup_HasObjectType = entityRule("IfcStructuralResultGroup", "HasObjectType", (self) => {
	assertWhereRule(
		simpleUserDefinedOrHasAttribute(self, "TheoryType", "ObjectType"),
		"IfcStructuralResultGroup: if TheoryType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStructuralSurfaceAction_HasObjectType` (line 11881): see `simpleUserDefinedOrHasAttribute`.
const IfcStructuralSurfaceAction_HasObjectType = entityRule("IfcStructuralSurfaceAction", "HasObjectType", (self) => {
	assertWhereRule(
		simpleUserDefinedOrHasAttribute(self, "PredefinedType", "ObjectType"),
		"IfcStructuralSurfaceAction: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStructuralSurfaceAction_ProjectedIsGlobal` (line 11891): identical shape to
// `IfcStructuralCurveAction_ProjectedIsGlobal` above.
const IfcStructuralSurfaceAction_ProjectedIsGlobal = entityRule(
	"IfcStructuralSurfaceAction",
	"ProjectedIsGlobal",
	(self) => {
		const projectedOrTrue = expressGetAttr(self, "ProjectedOrTrue", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(projectedOrTrue), () =>
				pyOr(triNe(projectedOrTrue, "PROJECTED_LENGTH"), () =>
					triEq(expressGetAttr(self, "GlobalOrLocal", INDETERMINATE), "GLOBAL_COORDS"),
				),
			),
			"IfcStructuralSurfaceAction: if ProjectedOrTrue is PROJECTED_LENGTH, GlobalOrLocal must be GLOBAL_COORDS.",
		);
	},
);

// `IfcStructuralSurfaceMember_HasObjectType` (line 11901): see `simpleUserDefinedOrHasAttribute`.
const IfcStructuralSurfaceMember_HasObjectType = entityRule("IfcStructuralSurfaceMember", "HasObjectType", (self) => {
	assertWhereRule(
		simpleUserDefinedOrHasAttribute(self, "PredefinedType", "ObjectType"),
		"IfcStructuralSurfaceMember: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcStructuralSurfaceReaction_HasPredefinedType` (line 11911): see
// `simpleUserDefinedOrHasAttribute` (rule name is `HasPredefinedType`, but the body's own
// shape is identical to every other `_HasObjectType` sibling above).
const IfcStructuralSurfaceReaction_HasPredefinedType = entityRule(
	"IfcStructuralSurfaceReaction",
	"HasPredefinedType",
	(self) => {
		assertWhereRule(
			simpleUserDefinedOrHasAttribute(self, "PredefinedType", "ObjectType"),
			"IfcStructuralSurfaceReaction: if PredefinedType is USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcStyledItem_ApplicableItem` (line 11921): `not 'ifcstyleditem' in typeof(Item)`.
const IfcStyledItem_ApplicableItem = entityRule("IfcStyledItem", "ApplicableItem", (self) => {
	const item = expressGetAttr(self, "Item", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(item).has("ifc4x3_add2.ifcstyleditem"),
		"IfcStyledItem.Item must not itself be an IfcStyledItem.",
	);
});

// `IfcStyledRepresentation_OnlyStyledItems` (line 11931): `sizeof([temp for temp in Items
// if not 'ifcstyleditem' in typeof(temp)]) == 0`.
const IfcStyledRepresentation_OnlyStyledItems = entityRule("IfcStyledRepresentation", "OnlyStyledItems", (self) => {
	const items = asList<EntityInstance>(expressGetAttr(self, "Items", INDETERMINATE));
	const violating = items.filter((temp) => !typeOfAttr(temp).has("ifc4x3_add2.ifcstyleditem")).length;
	assertWhereRule(violating === 0, "IfcStyledRepresentation: every Items member must be an IfcStyledItem.");
});

// `IfcSubContractResource_CorrectPredefinedType` (line 11940).
const IfcSubContractResource_CorrectPredefinedType = entityRule(
	"IfcSubContractResource",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcSubContractResource: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcSubContractResourceType_CorrectPredefinedType` (line 11950): escape attribute is
// `ResourceType`, not `ElementType`.
const IfcSubContractResourceType_CorrectPredefinedType = entityRule(
	"IfcSubContractResourceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ResourceType", false),
			"IfcSubContractResourceType: if PredefinedType is USERDEFINED, ResourceType must be given.",
		);
	},
);

// `IfcSurfaceCurve_CurveIs3D` (line 11963): `Curve3D.Dim == 3`.
const IfcSurfaceCurve_CurveIs3D = entityRule("IfcSurfaceCurve", "CurveIs3D", (self) => {
	assertWhereRule(attrDimEquals(self, "Curve3D", 3), "IfcSurfaceCurve.Curve3D.Dim must equal 3.");
});

// `IfcSurfaceCurve_CurveIsNotPcurve` (line 11973): `not 'ifcpcurve' in typeof(Curve3D)`.
const IfcSurfaceCurve_CurveIsNotPcurve = entityRule("IfcSurfaceCurve", "CurveIsNotPcurve", (self) => {
	const curve3d = expressGetAttr(self, "Curve3D", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(curve3d).has("ifc4x3_add2.ifcpcurve"),
		"IfcSurfaceCurve.Curve3D must not be an IfcPcurve.",
	);
});

// `IfcSurfaceFeature_CorrectPredefinedType` (line 11986): **genuine rename +
// shape-standardization from IFC4's own `_HasObjectType`** -- see this chunk's own header
// comment. Unlike `IfcStructuralAnalysisModel` above, `PredefinedType` was already
// optional on `IfcSurfaceFeature` in IFC4 and stays optional here (pure rename +
// shape-standardization, no optionality change).
const IfcSurfaceFeature_CorrectPredefinedType = entityRule("IfcSurfaceFeature", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSurfaceFeature: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSurfaceOfLinearExtrusion_DepthGreaterZero` (line 11996): `Depth > 0.0`.
const IfcSurfaceOfLinearExtrusion_DepthGreaterZero = entityRule(
	"IfcSurfaceOfLinearExtrusion",
	"DepthGreaterZero",
	(self) => {
		assertWhereRule(attrGreaterThanZero(self, "Depth"), "IfcSurfaceOfLinearExtrusion.Depth must be greater than 0.");
	},
);

// `IfcSurfaceReinforcementArea_NonnegativeArea1` (line 12015): **real upstream Python
// bug, verbatim-preserved, RECONFIRMED from `whereRules/ifc4.ts`'s own IFC4 chunk 5
// disclosure for this identical rule name** -- see `surfaceReinforcementNonnegative`'s
// own doc comment and this chunk's own header comment.
const IfcSurfaceReinforcementArea_NonnegativeArea1 = entityRule(
	"IfcSurfaceReinforcementArea",
	"NonnegativeArea1",
	(self) => {
		assertWhereRule(
			surfaceReinforcementNonnegative(self, "SurfaceReinforcement1"),
			"IfcSurfaceReinforcementArea: [verbatim upstream bug, preserved -- see this chunk's own header comment] SurfaceReinforcement1's own optional 3rd (shear) component is never actually validated by this rule.",
		);
	},
);

// `IfcSurfaceReinforcementArea_NonnegativeArea2` (line 12025): see
// `surfaceReinforcementNonnegative`.
const IfcSurfaceReinforcementArea_NonnegativeArea2 = entityRule(
	"IfcSurfaceReinforcementArea",
	"NonnegativeArea2",
	(self) => {
		assertWhereRule(
			surfaceReinforcementNonnegative(self, "SurfaceReinforcement2"),
			"IfcSurfaceReinforcementArea: [verbatim upstream bug, preserved -- see this chunk's own header comment] SurfaceReinforcement2's own optional 3rd (shear) component is never actually validated by this rule.",
		);
	},
);

// `IfcSurfaceReinforcementArea_NonnegativeArea3` (line 12035): `not
// exists(ShearReinforcement) or ShearReinforcement >= 0.0`.
const IfcSurfaceReinforcementArea_NonnegativeArea3 = entityRule(
	"IfcSurfaceReinforcementArea",
	"NonnegativeArea3",
	(self) => {
		const shearReinforcement = expressGetAttr(self, "ShearReinforcement", INDETERMINATE);
		assertWhereRule(
			pyOr(!exists(shearReinforcement), () => triGe(shearReinforcement, 0.0)),
			"IfcSurfaceReinforcementArea: if ShearReinforcement is given, it must be >= 0.",
		);
	},
);

// `IfcSurfaceReinforcementArea_SurfaceAndOrShearAreaSpecified` (line 12045): `exists(
// SurfaceReinforcement1) or exists(SurfaceReinforcement2) or exists(ShearReinforcement)`.
const IfcSurfaceReinforcementArea_SurfaceAndOrShearAreaSpecified = entityRule(
	"IfcSurfaceReinforcementArea",
	"SurfaceAndOrShearAreaSpecified",
	(self) => {
		const surfaceReinforcement1 = expressGetAttr(self, "SurfaceReinforcement1", INDETERMINATE);
		const surfaceReinforcement2 = expressGetAttr(self, "SurfaceReinforcement2", INDETERMINATE);
		const shearReinforcement = expressGetAttr(self, "ShearReinforcement", INDETERMINATE);
		assertWhereRule(
			exists(surfaceReinforcement1) || exists(surfaceReinforcement2) || exists(shearReinforcement),
			"IfcSurfaceReinforcementArea: at least one of SurfaceReinforcement1/SurfaceReinforcement2/ShearReinforcement must be given.",
		);
	},
);

// `IfcSurfaceStyle_MaxOneExtDefined` (line 12057).
const IfcSurfaceStyle_MaxOneExtDefined = entityRule("IfcSurfaceStyle", "MaxOneExtDefined", (self) => {
	assertWhereRule(
		stylesCountAtMostOne(self, "ifc4x3_add2.ifcexternallydefinedsurfacestyle"),
		"IfcSurfaceStyle: at most one Styles member may be an IfcExternallyDefinedSurfaceStyle.",
	);
});

// `IfcSurfaceStyle_MaxOneLighting` (line 12066).
const IfcSurfaceStyle_MaxOneLighting = entityRule("IfcSurfaceStyle", "MaxOneLighting", (self) => {
	assertWhereRule(
		stylesCountAtMostOne(self, "ifc4x3_add2.ifcsurfacestylelighting"),
		"IfcSurfaceStyle: at most one Styles member may be an IfcSurfaceStyleLighting.",
	);
});

// `IfcSurfaceStyle_MaxOneRefraction` (line 12075).
const IfcSurfaceStyle_MaxOneRefraction = entityRule("IfcSurfaceStyle", "MaxOneRefraction", (self) => {
	assertWhereRule(
		stylesCountAtMostOne(self, "ifc4x3_add2.ifcsurfacestylerefraction"),
		"IfcSurfaceStyle: at most one Styles member may be an IfcSurfaceStyleRefraction.",
	);
});

// `IfcSurfaceStyle_MaxOneShading` (line 12084).
const IfcSurfaceStyle_MaxOneShading = entityRule("IfcSurfaceStyle", "MaxOneShading", (self) => {
	assertWhereRule(
		stylesCountAtMostOne(self, "ifc4x3_add2.ifcsurfacestyleshading"),
		"IfcSurfaceStyle: at most one Styles member may be an IfcSurfaceStyleShading.",
	);
});

// `IfcSurfaceStyle_MaxOneTextures` (line 12093).
const IfcSurfaceStyle_MaxOneTextures = entityRule("IfcSurfaceStyle", "MaxOneTextures", (self) => {
	assertWhereRule(
		stylesCountAtMostOne(self, "ifc4x3_add2.ifcsurfacestylewithtextures"),
		"IfcSurfaceStyle: at most one Styles member may be an IfcSurfaceStyleWithTextures.",
	);
});

// `IfcSweptAreaSolid_SweptAreaType` (line 12102): see `sweptItemProfileTypeEquals`.
const IfcSweptAreaSolid_SweptAreaType = entityRule("IfcSweptAreaSolid", "SweptAreaType", (self) => {
	assertWhereRule(
		sweptItemProfileTypeEquals(self, "SweptArea", "AREA"),
		"IfcSweptAreaSolid: SweptArea.ProfileType must be AREA.",
	);
});

// `IfcSweptDiskSolid_DirectrixBounded` (line 12112): see `directrixIsBoundedOrHasParams`.
const IfcSweptDiskSolid_DirectrixBounded = entityRule("IfcSweptDiskSolid", "DirectrixBounded", (self) => {
	assertWhereRule(
		directrixIsBoundedOrHasParams(self),
		"IfcSweptDiskSolid: StartParam and EndParam must both be given, or Directrix must be exactly one of IfcConic/IfcBoundedCurve.",
	);
});

// `IfcSweptDiskSolid_DirectrixDim` (line 12124): `Directrix.Dim == 3`.
const IfcSweptDiskSolid_DirectrixDim = entityRule("IfcSweptDiskSolid", "DirectrixDim", (self) => {
	assertWhereRule(attrDimEquals(self, "Directrix", 3), "IfcSweptDiskSolid.Directrix.Dim must equal 3.");
});

// `IfcSweptDiskSolid_InnerRadiusSize` (line 12134): `not exists(InnerRadius) or Radius >
// InnerRadius`.
const IfcSweptDiskSolid_InnerRadiusSize = entityRule("IfcSweptDiskSolid", "InnerRadiusSize", (self) => {
	const radius = expressGetAttr(self, "Radius", INDETERMINATE);
	const innerRadius = expressGetAttr(self, "InnerRadius", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(innerRadius), () => triGt(radius, innerRadius)),
		"IfcSweptDiskSolid: if InnerRadius is given, Radius must be greater than it.",
	);
});

// `IfcSweptDiskSolidPolygonal_CorrectRadii` (line 12145): `not exists(FilletRadius) or
// FilletRadius >= Radius`.
const IfcSweptDiskSolidPolygonal_CorrectRadii = entityRule("IfcSweptDiskSolidPolygonal", "CorrectRadii", (self) => {
	const filletRadius = expressGetAttr(self, "FilletRadius", INDETERMINATE);
	const radius = expressGetAttr(self, "Radius", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(filletRadius), () => triGe(filletRadius, radius)),
		"IfcSweptDiskSolidPolygonal: if FilletRadius is given, it must be >= Radius.",
	);
});

// `IfcSweptDiskSolidPolygonal_DirectrixIsPolyline` (line 12155): `IfcPolyline in
// typeof(Directrix) or (IfcIndexedPolyCurve in typeof(Directrix) and not
// exists(Directrix.Segments))`.
const IfcSweptDiskSolidPolygonal_DirectrixIsPolyline = entityRule(
	"IfcSweptDiskSolidPolygonal",
	"DirectrixIsPolyline",
	(self) => {
		const directrix = expressGetAttr(self, "Directrix", INDETERMINATE);
		assertWhereRule(
			pyOr(typeOfAttr(directrix).has("ifc4x3_add2.ifcpolyline"), () =>
				pyAnd(
					typeOfAttr(directrix).has("ifc4x3_add2.ifcindexedpolycurve"),
					() => !exists(expressGetAttr(directrix, "Segments", INDETERMINATE)),
				),
			),
			"IfcSweptDiskSolidPolygonal: Directrix must be an IfcPolyline, or an IfcIndexedPolyCurve with no Segments.",
		);
	},
);

// `IfcSweptSurface_SweptCurveType` (line 12164): see `sweptItemProfileTypeEquals`.
const IfcSweptSurface_SweptCurveType = entityRule("IfcSweptSurface", "SweptCurveType", (self) => {
	assertWhereRule(
		sweptItemProfileTypeEquals(self, "SweptCurve", "CURVE"),
		"IfcSweptSurface: SweptCurve.ProfileType must be CURVE.",
	);
});

// `IfcSwitchingDevice_CorrectPredefinedType` (line 12174).
const IfcSwitchingDevice_CorrectPredefinedType = entityRule("IfcSwitchingDevice", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcSwitchingDevice: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcSwitchingDevice_CorrectTypeAssigned` (line 12184).
const IfcSwitchingDevice_CorrectTypeAssigned = entityRule("IfcSwitchingDevice", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcSwitchingDeviceType"),
		"IfcSwitchingDevice: if IsTypedBy is given, its RelatingType must be an IfcSwitchingDeviceType.",
	);
});

// `IfcSwitchingDeviceType_CorrectPredefinedType` (line 12194).
const IfcSwitchingDeviceType_CorrectPredefinedType = entityRule(
	"IfcSwitchingDeviceType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcSwitchingDeviceType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcSystemFurnitureElement_CorrectPredefinedType` (line 12204).
const IfcSystemFurnitureElement_CorrectPredefinedType = entityRule(
	"IfcSystemFurnitureElement",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcSystemFurnitureElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcSystemFurnitureElement_CorrectTypeAssigned` (line 12214).
const IfcSystemFurnitureElement_CorrectTypeAssigned = entityRule(
	"IfcSystemFurnitureElement",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcSystemFurnitureElementType"),
			"IfcSystemFurnitureElement: if IsTypedBy is given, its RelatingType must be an IfcSystemFurnitureElementType.",
		);
	},
);

// `IfcSystemFurnitureElementType_CorrectPredefinedType` (line 12224): **genuine
// schema-evolution finding** -- `PredefinedType` became OPTIONAL in ADD2 (mandatory in
// IFC4, see this chunk's own header comment), the same shape of finding IFC4X3_ADD2
// chunk 3 already made for `IfcFurnitureType_CorrectPredefinedType`.
const IfcSystemFurnitureElementType_CorrectPredefinedType = entityRule(
	"IfcSystemFurnitureElementType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", true),
			"IfcSystemFurnitureElementType: if PredefinedType is given and USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcTShapeProfileDef_ValidFlangeThickness` (line 12234): `FlangeThickness < Depth`.
const IfcTShapeProfileDef_ValidFlangeThickness = entityRule("IfcTShapeProfileDef", "ValidFlangeThickness", (self) => {
	assertWhereRule(
		attrLessThan(self, "FlangeThickness", "Depth"),
		"IfcTShapeProfileDef.FlangeThickness must be less than Depth.",
	);
});

// `IfcTShapeProfileDef_ValidWebThickness` (line 12245): `WebThickness < FlangeWidth`.
const IfcTShapeProfileDef_ValidWebThickness = entityRule("IfcTShapeProfileDef", "ValidWebThickness", (self) => {
	assertWhereRule(
		attrLessThan(self, "WebThickness", "FlangeWidth"),
		"IfcTShapeProfileDef.WebThickness must be less than FlangeWidth.",
	);
});

// `IfcTable_WR1` (line 12256): see `ifcTableUniformRowCells`.
const IfcTable_WR1 = entityRule("IfcTable", "WR1", (self) => {
	assertWhereRule(
		ifcTableUniformRowCells(self),
		"IfcTable: every Rows member must have the same number of RowCells as the first row.",
	);
});

// `IfcTable_WR2` (line 12266): `0 <= NumberOfHeadings <= 1`.
const IfcTable_WR2 = entityRule("IfcTable", "WR2", (self) => {
	const numberOfHeadings = expressGetAttr(self, "NumberOfHeadings", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLe(0, numberOfHeadings), () => triLe(numberOfHeadings, 1)),
		"IfcTable.NumberOfHeadings must be in [0, 1].",
	);
});

// `IfcTank_CorrectPredefinedType` (line 12288).
const IfcTank_CorrectPredefinedType = entityRule("IfcTank", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTank: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTank_CorrectTypeAssigned` (line 12298).
const IfcTank_CorrectTypeAssigned = entityRule("IfcTank", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTankType"),
		"IfcTank: if IsTypedBy is given, its RelatingType must be an IfcTankType.",
	);
});

// `IfcTankType_CorrectPredefinedType` (line 12308).
const IfcTankType_CorrectPredefinedType = entityRule("IfcTankType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcTankType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcTask_CorrectPredefinedType` (line 12318).
const IfcTask_CorrectPredefinedType = entityRule("IfcTask", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTask: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTask_HasName` (line 12328): `exists(Name)`.
const IfcTask_HasName = entityRule("IfcTask", "HasName", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcTask.Name must be given.");
});

// `IfcTaskType_CorrectPredefinedType` (line 12337): escape attribute is `ProcessType`.
const IfcTaskType_CorrectPredefinedType = entityRule("IfcTaskType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ProcessType", false),
		"IfcTaskType: if PredefinedType is USERDEFINED, ProcessType must be given.",
	);
});

// `IfcTelecomAddress_MinimumDataProvided` (line 12347): at least one of 6 attributes must
// be given.
const IfcTelecomAddress_MinimumDataProvided = entityRule("IfcTelecomAddress", "MinimumDataProvided", (self) => {
	const telephoneNumbers = expressGetAttr(self, "TelephoneNumbers", INDETERMINATE);
	const facsimileNumbers = expressGetAttr(self, "FacsimileNumbers", INDETERMINATE);
	const pagerNumber = expressGetAttr(self, "PagerNumber", INDETERMINATE);
	const electronicMailAddresses = expressGetAttr(self, "ElectronicMailAddresses", INDETERMINATE);
	const wwwHomePageUrl = expressGetAttr(self, "WWWHomePageURL", INDETERMINATE);
	const messagingIds = expressGetAttr(self, "MessagingIDs", INDETERMINATE);
	assertWhereRule(
		exists(telephoneNumbers) ||
			exists(facsimileNumbers) ||
			exists(pagerNumber) ||
			exists(electronicMailAddresses) ||
			exists(wwwHomePageUrl) ||
			exists(messagingIds),
		"IfcTelecomAddress: at least one of TelephoneNumbers/FacsimileNumbers/PagerNumber/ElectronicMailAddresses/WWWHomePageURL/MessagingIDs must be given.",
	);
});

// `IfcTendon_CorrectPredefinedType` (line 12362).
const IfcTendon_CorrectPredefinedType = entityRule("IfcTendon", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTendon: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

registerSchemaRules("IFC4X3_ADD2", [
	IfcSeamCurve_TwoPCurves,
	IfcSectionedSolid_ConsistentProfileTypes,
	IfcSectionedSolid_DirectrixIs3D,
	IfcSectionedSolid_SectionsSameType,
	IfcSectionedSolidHorizontal_CorrespondingSectionPositions,
	IfcSectionedSolidHorizontal_NoLongitudinalOffsets,
	IfcSectionedSpine_ConsistentProfileTypes,
	IfcSectionedSpine_CorrespondingSectionPositions,
	IfcSectionedSpine_SpineCurveDim,
	IfcSectionedSurface_AreaProfileTypes,
	IfcSectionedSurface_CorrespondingSectionPositions,
	IfcSectionedSurface_DirectrixIs3D,
	IfcSectionedSurface_NoOffsets,
	IfcSectionedSurface_SectionsSameType,
	IfcSensor_CorrectPredefinedType,
	IfcSensor_CorrectTypeAssigned,
	IfcSensorType_CorrectPredefinedType,
	IfcShadingDevice_CorrectPredefinedType,
	IfcShadingDevice_CorrectTypeAssigned,
	IfcShadingDeviceType_CorrectPredefinedType,
	IfcShapeModel_WR11,
	IfcShapeRepresentation_CorrectContext,
	IfcShapeRepresentation_CorrectItemsForType,
	IfcShapeRepresentation_HasRepresentationIdentifier,
	IfcShapeRepresentation_HasRepresentationType,
	IfcShapeRepresentation_NoTopologicalItem,
	IfcSign_CorrectPredefinedType,
	IfcSign_CorrectTypeAssigned,
	IfcSignType_CorrectPredefinedType,
	IfcSignal_CorrectPredefinedType,
	IfcSignal_CorrectTypeAssigned,
	IfcSignalType_CorrectPredefinedType,
	IfcSlab_CorrectPredefinedType,
	IfcSlab_CorrectTypeAssigned,
	IfcSlabType_CorrectPredefinedType,
	IfcSolarDevice_CorrectPredefinedType,
	IfcSolarDevice_CorrectTypeAssigned,
	IfcSolarDeviceType_CorrectPredefinedType,
	IfcSpace_CorrectPredefinedType,
	IfcSpace_CorrectTypeAssigned,
	IfcSpaceHeater_CorrectPredefinedType,
	IfcSpaceHeater_CorrectTypeAssigned,
	IfcSpaceHeaterType_CorrectPredefinedType,
	IfcSpaceType_CorrectPredefinedType,
	IfcSpatialStructureElement_WR41,
	IfcSpatialZone_CorrectPredefinedType,
	IfcSpatialZone_CorrectTypeAssigned,
	IfcSpatialZoneType_CorrectPredefinedType,
	IfcStackTerminal_CorrectPredefinedType,
	IfcStackTerminal_CorrectTypeAssigned,
	IfcStackTerminalType_CorrectPredefinedType,
	IfcStair_CorrectPredefinedType,
	IfcStair_CorrectTypeAssigned,
	IfcStairFlight_CorrectPredefinedType,
	IfcStairFlight_CorrectTypeAssigned,
	IfcStairFlightType_CorrectPredefinedType,
	IfcStairType_CorrectPredefinedType,
	IfcStructuralAnalysisModel_CorrectPredefinedType,
	IfcStructuralCurveAction_HasObjectType,
	IfcStructuralCurveAction_ProjectedIsGlobal,
	IfcStructuralCurveAction_SuitablePredefinedType,
	IfcStructuralCurveMember_HasObjectType,
	IfcStructuralCurveReaction_HasObjectType,
	IfcStructuralCurveReaction_SuitablePredefinedType,
	IfcStructuralLinearAction_ConstPredefinedType,
	IfcStructuralLinearAction_SuitableLoadType,
	IfcStructuralLoadCase_IsLoadCasePredefinedType,
	IfcStructuralLoadConfiguration_ValidListSize,
	IfcStructuralLoadGroup_HasObjectType,
	IfcStructuralPlanarAction_ConstPredefinedType,
	IfcStructuralPlanarAction_SuitableLoadType,
	IfcStructuralPointAction_SuitableLoadType,
	IfcStructuralPointReaction_SuitableLoadType,
	IfcStructuralResultGroup_HasObjectType,
	IfcStructuralSurfaceAction_HasObjectType,
	IfcStructuralSurfaceAction_ProjectedIsGlobal,
	IfcStructuralSurfaceMember_HasObjectType,
	IfcStructuralSurfaceReaction_HasPredefinedType,
	IfcStyledItem_ApplicableItem,
	IfcStyledRepresentation_OnlyStyledItems,
	IfcSubContractResource_CorrectPredefinedType,
	IfcSubContractResourceType_CorrectPredefinedType,
	IfcSurfaceCurve_CurveIs3D,
	IfcSurfaceCurve_CurveIsNotPcurve,
	IfcSurfaceFeature_CorrectPredefinedType,
	IfcSurfaceOfLinearExtrusion_DepthGreaterZero,
	IfcSurfaceReinforcementArea_NonnegativeArea1,
	IfcSurfaceReinforcementArea_NonnegativeArea2,
	IfcSurfaceReinforcementArea_NonnegativeArea3,
	IfcSurfaceReinforcementArea_SurfaceAndOrShearAreaSpecified,
	IfcSurfaceStyle_MaxOneExtDefined,
	IfcSurfaceStyle_MaxOneLighting,
	IfcSurfaceStyle_MaxOneRefraction,
	IfcSurfaceStyle_MaxOneShading,
	IfcSurfaceStyle_MaxOneTextures,
	IfcSweptAreaSolid_SweptAreaType,
	IfcSweptDiskSolid_DirectrixBounded,
	IfcSweptDiskSolid_DirectrixDim,
	IfcSweptDiskSolid_InnerRadiusSize,
	IfcSweptDiskSolidPolygonal_CorrectRadii,
	IfcSweptDiskSolidPolygonal_DirectrixIsPolyline,
	IfcSweptSurface_SweptCurveType,
	IfcSwitchingDevice_CorrectPredefinedType,
	IfcSwitchingDevice_CorrectTypeAssigned,
	IfcSwitchingDeviceType_CorrectPredefinedType,
	IfcSystemFurnitureElement_CorrectPredefinedType,
	IfcSystemFurnitureElement_CorrectTypeAssigned,
	IfcSystemFurnitureElementType_CorrectPredefinedType,
	IfcTShapeProfileDef_ValidFlangeThickness,
	IfcTShapeProfileDef_ValidWebThickness,
	IfcTable_WR1,
	IfcTable_WR2,
	IfcTank_CorrectPredefinedType,
	IfcTank_CorrectTypeAssigned,
	IfcTankType_CorrectPredefinedType,
	IfcTask_CorrectPredefinedType,
	IfcTask_HasName,
	IfcTaskType_CorrectPredefinedType,
	IfcTelecomAddress_MinimumDataProvided,
	IfcTendon_CorrectPredefinedType,
]);

// =============================================================================
// Phase EX-4, IFC4X3_ADD2 FINAL chunk (planning/ifcopenshell-ts/70-express-rules-plan.md,
// "the large chunk"): Part A -- the LAST 77 `SCOPE = 'entity'` rules in the entire file
// (real source lines 12372-13140, `IfcTendon_CorrectTypeAssigned` through `IfcZone_WR1`,
// the LAST entity-scope class in `IFC4X3_ADD2.py`), continuing directly from chunk 6's
// own last-ported rule (`IfcTendon_CorrectPredefinedType`, line 12362) with ZERO gap or
// overlap (independently re-verified: `IfcTendon_CorrectTypeAssigned` is entity-rule
// index 676/752 by the same `^class (\w+)` + `SCOPE = '(\w+)'` counting script every
// prior chunk used, i.e. immediately after chunk 6's own cumulative 675). Part B (the
// LAST 2 `SCOPE = 'file'` classes) follows in its own section further below, with its own
// header comment and its own `registerSchemaRules` call, matching IFC2X3's/IFC4's own
// final-chunk precedent.
//
// **Landing this chunk completes ALL 779 IFC4X3_ADD2 WHERE-rule classes (752 entity + 25
// type + 2 file) -- IFC4X3_ADD2 is now schema-complete, AND ALL OF PHASE EX-4 IS NOW
// COMPLETE: 1,823 WHERE-rule classes across IFC2X3 (365), IFC4 (679), and IFC4X3_ADD2
// (779).**
//
// =============================================================================
// Part A byte-identical-vs-different breakdown against `IFC4.py` (exhaustive, all 77
// target rule NAMES individually cross-checked, not sampled)
// =============================================================================
//
// - **57 of the 77 rules exist in `IFC4.py` under the exact same class name, with
//   BYTE-IDENTICAL real compiled bodies once the embedded schema-namespace string is
//   normalized (`'ifc4.ifcxxx'` -> `'ifc4x3_add2.ifcxxx'`)** -- confirmed by a dedicated
//   diff script comparing all 77 real class bodies character-for-character. These are
//   ported below via this file's own already-established shared helpers
//   (`correctTypeAssigned`/`correctPredefinedType`, 52 of the 57) or fresh local bespoke
//   bodies matching `whereRules/ifc4.ts`'s own already-ported shapes exactly (the
//   remaining 5: `IfcTextLiteralWithExtent_WR31`, `IfcTrimmedCurve_NoTrimOfBoundedCurves`/
//   `_Trim1ValuesConsistent`/`_Trim2ValuesConsistent`, `IfcTypeObject_NameRequired` -- the
//   other 17 "bespoke-shaped" rules below are covered by shared helpers new to THIS
//   chunk, see "New shared helpers" below).
// - **3 of the 77 rules genuinely DIFFER from `IFC4.py`'s own same-named body**, each
//   individually investigated:
//   1. **`IfcTransformer_CorrectTypeAssigned`**: `IFC4.py`'s own real body (line 10815)
//      has a genuine upstream TYPO -- it misspells the membership string as
//      `'ifc4.ifctranformertype'` (missing the "s" in "Transformer"), meaning that rule
//      NEVER actually matches any real `IfcTransformerType` and is ALSO ported bespoke
//      in `whereRules/ifc4.ts` (its own "Bug 1", disclosed there). **`IFC4X3_ADD2.py`'s
//      own real body (line 12372) has this typo FIXED** -- it correctly reads
//      `'ifc4x3_add2.ifctransformertype'` (confirmed via direct diff, not assumed). This
//      is therefore ported via the ordinary `correctTypeAssigned(self, "IfcTransformerType")`
//      helper below, NOT bespoke and NOT bug-preserving -- `correctTypeAssigned` already
//      generates the correctly-spelled string from its own `expectedTypeName` parameter,
//      which is exactly what ADD2's own real, fixed source now expects. A second real,
//      genuine upstream-Python-bug-FIX finding this chunk (the first being
//      `IfcSameAxis2Placement` in Part B below) -- disclosed prominently since it is the
//      OPPOSITE of the "preserve verbatim" precedent this project otherwise follows: there
//      is no bug left in ADD2's own real source to preserve.
//   2. **`IfcWindowLiningProperties_WR34`** and 3. **`IfcWindowPanelProperties_
//      ApplicableToType`**: IFC4 accepts `IfcWindowType` OR `IfcWindowStyle`
//      (`definesTypeIsWindowTypeOrStyle`); ADD2 only accepts `IfcWindowType` -- a direct
//      consequence of `IfcWindowStyle`'s own removal from the schema (already confirmed
//      in chunk 5's own header comment while diffing `IfcRelAssociatesMaterial_
//      AllowedElements`), and the exact same narrowing chunk 3 already found for
//      `IfcDoorLiningProperties_WR35`/`IfcDoorPanelProperties_ApplicableToType` and
//      `IfcDoorStyle`. Needs a new, ADD2-specific single-branch `definesTypeIsWindowType`
//      helper (see its own doc comment below), the exact same-shaped sibling
//      `definesTypeIsDoorType` chunk 3 already established for the Door case.
// - **17 of the 77 rules have NO `IFC4.py` class of the exact same name** -- each
//   investigated individually, not assumed new from the name mismatch alone:
//   - **13 are ordinary rules on 5 entities wholly new in ADD2** (confirmed via
//     `grep -c "^def EntityName("` against `IFC4.py`: zero matches for every one of these
//     5 entity names) -- `IfcTendonConduit`/`IfcTendonConduitType` (3 rules: the ordinary
//     `_CorrectPredefinedType` "occurrence"/"*Type" pair plus `_CorrectTypeAssigned`),
//     `IfcTrackElement`/`IfcTrackElementType` (3, same shape -- rail infrastructure),
//     `IfcTriangulatedIrregularNetwork` (1, a bespoke `NotClosed` rule -- a terrain/TIN
//     mesh entity), `IfcVehicle`/`IfcVehicleType` (3, same shape), `IfcVibrationDamper`/
//     `IfcVibrationDamperType` (3, same shape) -- 3+3+1+3+3 = 13.
//   - **1 is a genuinely NEW rule on a PRE-EXISTING IFC4 entity**:
//     `IfcVirtualElement_CorrectPredefinedType` -- `IfcVirtualElement` itself already
//     exists in IFC4 (confirmed: its own entity-constructor helper function is present in
//     `IFC4.py`), but IFC4 has NO WHERE-rule class for it at all; ADD2 adds one, the
//     ordinary "occurrence" `correctPredefinedType` shape.
//   - **1 is a genuine RULE_NAME rename + shape upgrade**: `IfcVoidingFeature_
//     CorrectPredefinedType` (ADD2) renames IFC4's own `IfcVoidingFeature_HasObjectType`
//     (line 11123) AND upgrades its shape from the abbreviated
//     `simpleUserDefinedOrHasAttribute` form (`not exists(X) or X != USERDEFINED or
//     exists(Y)`, no middle conjunct) to the FULL, standard `optionalUserDefinedOrHasAttribute`
//     form (`not exists(X) or X != USERDEFINED or (X == USERDEFINED and exists(Y))`) --
//     confirmed by direct body comparison; ported below via the ordinary
//     `correctPredefinedType(self, "ObjectType", true)` helper, which already produces
//     the full/standard form.
//   - **2 are `IfcWindow`'s own genuine finding, mirroring `IfcDoor`'s chunk-3
//     precedent exactly**: `IfcWindow_CorrectTypeAssigned` is a RULE_NAME rename of
//     IFC4's own `IfcWindow_CorrectStyleAssigned` (line 11211, byte-identical body modulo
//     prefix -- confirmed directly), and `IfcWindow_CorrectPredefinedType` is a genuinely
//     NEW rule (IFC4 has no `PredefinedType` rule on plain `IfcWindow` at all) -- the
//     ordinary "occurrence" `correctPredefinedType` shape. 1+1 = 2.
//   13 + 1 + 1 + 2 = 17, matching the "missing" count exactly.
//
// **A 6th vanished-"*StandardCase"-entity finding, independently re-checked here**:
// `IfcSlabStandardCase` (which chunk 6's own header comment explicitly flagged as
// "left for whichever later chunk reaches them", alongside `IfcWallStandardCase`) has
// been confirmed REMOVED from the schema entirely (zero matches for
// `class IfcSlabStandardCase` anywhere in `IFC4X3_ADD2.py`) -- following the exact same
// pattern as `IfcBeamStandardCase`/`IfcColumnStandardCase`/`IfcMemberStandardCase`/
// `IfcPlateStandardCase` (chunks 1/2/4). `IfcSlabStandardCase`'s own rule sorts
// alphabetically before this chunk's own `IfcTendon`-`IfcZone` range (it belongs to
// chunk 6's own already-landed range), so this is disclosed for completeness only, not a
// gap in this chunk. `IfcWallStandardCase` itself IS in this chunk's own range and is
// still present, byte-identical to `IFC4.py`'s own version.
//
// =============================================================================
// New shared helpers factored in Part A
// =============================================================================
//
// **`attrLessThanHalf`** (2 occurrences: `IfcUShapeProfileDef_ValidFlangeThickness`,
// `IfcZShapeProfileDef_ValidFlangeThickness`) -- fresh local copy of `whereRules/ifc4.ts`'s
// own already-established helper of the exact same shape (Python: `AttrA < AttrB / 2.0`).
//
// **`hasSoleMaterialUsage`** (1 occurrence this chunk: `IfcWallStandardCase_
// HasMaterialLayerSetUsage`) -- fresh local copy of `whereRules/ifc4.ts`'s own
// already-established helper (Python: `sizeof([temp for temp in usedin(self,
// 'ifcrelassociates.relatedobjects') if IfcRelAssociatesMaterial in typeof(temp) and
// usageTypeName in typeof(temp.RelatingMaterial)]) == 1`); needs the `usedIn` runtime-shim
// import, newly added to this file in this chunk.
//
// **`trimValuesConsistent`** (2 occurrences: `IfcTrimmedCurve_Trim1ValuesConsistent`/
// `_Trim2ValuesConsistent`) -- fresh local copy of `whereRules/ifc4.ts`'s own
// already-established helper (Python: `hiindex(X) == 1 or typeof(X[1]) != typeof(X[2])`).
//
// **`ifcTopologyRepresentationTypes`** (1 occurrence: `IfcTopologyRepresentation_WR23`) --
// the rule-file-local EXPRESS-library helper `IfcTopologyRepresentationTypes` (real
// `IFC4X3_ADD2.py` line 13381) -- independently re-confirmed BYTE-IDENTICAL to `IFC4.py`'s
// own version (line 12106) via direct diff (no `ifcShapeRepresentationTypes`-style hidden
// divergence found here), so ported as a plain fresh copy of `whereRules/ifc4.ts`'s own
// version.
//
// **`ifcCorrectUnitAssignment`** (1 occurrence: `IfcUnitAssignment_WR01`) -- the
// rule-file-local EXPRESS-library helper `IfcCorrectUnitAssignment` (real
// `IFC4X3_ADD2.py` line 13366) -- independently re-confirmed BYTE-IDENTICAL to `IFC4.py`'s
// own version (line 11652) via direct diff, ported as a fresh copy.
//
// **`unwrapMeasure`** (1 occurrence: `IfcTextStyleFontModel_MeasureOfFontSize`) -- fresh
// local copy of `whereRules/ifc4.ts`'s own already-established gap-fix helper (see that
// function's own doc comment for the full "`EntityInstance` has no numeric-coercion
// dunders" writeup) -- needs the `isEntity` runtime-shim import and a value (not
// type-only) import of `EntityInstance`, both newly added to this file in this chunk.
//
// **`definesTypeIsWindowType`** (2 occurrences: `IfcWindowLiningProperties_WR34`,
// `IfcWindowPanelProperties_ApplicableToType`) -- NEW this chunk: the ADD2-specific,
// single-branch sibling of `whereRules/ifc4.ts`'s own `definesTypeIsWindowTypeOrStyle`,
// needed because `IfcWindowStyle` was genuinely removed from the schema (see above) --
// structurally identical to this file's own already-established `definesTypeIsDoorType`
// (chunk 3), just `IfcWindowType` instead of `IfcDoorType`. Factored at 2 occurrences,
// matching `definesTypeIsDoorType`'s own identical 2-occurrence factoring precedent.
//
// `ruleExecutor.ts`/`ruleDispatch.ts` confirmed to need zero changes (`git diff` against
// both files is empty for this PR), exactly as every prior chunk across all 3 schemas
// already confirmed.
//
// **How to read a rule below**: identical strategy to this file's own chunk 1-6 header
// comments (`Tri`, `pyAnd`/`pyOr`/`pyNot`, `triEq`/`triNe`/`triLt`/etc., `assertWhereRule`)
// -- not re-explained here.
// =============================================================================
/**
 * New shared shape (2 occurrences, see this chunk's own header comment) -- Python:
 * `AttrA < AttrB / 2.0`.
 */
function attrLessThanHalf(self: EntityInstance, attrNameA: string, attrNameB: string): Tri {
	const half = triDiv(expressGetAttr(self, attrNameB, INDETERMINATE), 2.0);
	return triLt(expressGetAttr(self, attrNameA, INDETERMINATE), half);
}

/**
 * Shared shape, see this chunk's own header comment -- Python: `sizeof([temp for temp in
 * usedin(self, 'ifc4x3_add2.ifcrelassociates.relatedobjects') if
 * 'ifc4x3_add2.ifcrelassociatesmaterial' in typeof(temp) and usageTypeName in
 * typeof(temp.RelatingMaterial)]) == 1`.
 */
function hasSoleMaterialUsage(self: EntityInstance, usageTypeName: string): boolean {
	const refs = usedIn(self, "ifc4x3_add2.ifcrelassociates.relatedobjects");
	const count = refs.filter(
		(temp) =>
			typeOfAttr(temp).has("ifc4x3_add2.ifcrelassociatesmaterial") &&
			typeOfAttr(expressGetAttr(temp, "RelatingMaterial", INDETERMINATE)).has(usageTypeName),
	).length;
	return count === 1;
}

/**
 * Shared shape (2 occurrences: `IfcTrimmedCurve_Trim1ValuesConsistent`/
 * `_Trim2ValuesConsistent`, real source lines 12625/12635, byte-identical apart from the
 * attribute name) -- Python: `hiindex(X) == 1 or typeof(X[1]) != typeof(X[2])`.
 */
function trimValuesConsistent(self: EntityInstance, attrName: string): Tri {
	const trim = expressGetAttr(self, attrName, INDETERMINATE);
	return pyOr(triEq(hiIndex(trim), 1), () => {
		const first = typeOfAttr(expressGetItem(trim, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE));
		const second = typeOfAttr(expressGetItem(trim, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE));
		return !first.equals(second);
	});
}

/**
 * Python: `IfcCorrectUnitAssignment(units)` (`IFC4X3_ADD2.py` line 13366) --
 * independently re-confirmed BYTE-IDENTICAL to `IFC4.py`'s own version (line 11652) via
 * direct diff (see this chunk's own header comment) -- a fresh local copy here, not an
 * import, per this file family's own established "no cross-schema-file dependency"
 * precedent.
 */
function ifcCorrectUnitAssignment(units: unknown): boolean {
	const list = asList<EntityInstance>(units);
	const namedUnitNumber = list.filter(
		(temp) =>
			typeOfAttr(temp).has("ifc4x3_add2.ifcnamedunit") &&
			pyNot(triEq(expressGetAttr(temp, "UnitType", INDETERMINATE), "USERDEFINED")),
	).length;
	const derivedUnitNumber = list.filter(
		(temp) =>
			typeOfAttr(temp).has("ifc4x3_add2.ifcderivedunit") &&
			pyNot(triEq(expressGetAttr(temp, "UnitType", INDETERMINATE), "USERDEFINED")),
	).length;
	const monetaryUnitNumber = list.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcmonetaryunit")).length;
	let namedUnitNames = new ExpressSet<unknown>();
	let derivedUnitNames = new ExpressSet<unknown>();
	for (const temp of list) {
		const unitType = expressGetAttr(temp, "UnitType", INDETERMINATE);
		if (typeOfAttr(temp).has("ifc4x3_add2.ifcnamedunit") && pyNot(triEq(unitType, "USERDEFINED"))) {
			namedUnitNames = namedUnitNames.plus(unitType);
		}
		if (typeOfAttr(temp).has("ifc4x3_add2.ifcderivedunit") && pyNot(triEq(unitType, "USERDEFINED"))) {
			derivedUnitNames = derivedUnitNames.plus(unitType);
		}
	}
	return (
		namedUnitNames.size === namedUnitNumber && derivedUnitNames.size === derivedUnitNumber && monetaryUnitNumber <= 1
	);
}

/**
 * Python: `IfcTopologyRepresentationTypes(reptype, items)` (`IFC4X3_ADD2.py` line 13381)
 * -- independently re-confirmed BYTE-IDENTICAL to `IFC4.py`'s own version (line 12106) via
 * direct diff (see this chunk's own header comment: no `ifcShapeRepresentationTypes`-style
 * hidden divergence found here) -- a fresh local copy, not an import.
 */
function ifcTopologyRepresentationTypes(reptype: unknown, items: unknown): Tri {
	const list = asList<EntityInstance>(items);
	const kind = typeof reptype === "string" ? reptype.toLowerCase() : undefined;
	let count: number;
	switch (kind) {
		case "vertex":
			count = list.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcvertex")).length;
			break;
		case "edge":
			count = list.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcedge")).length;
			break;
		case "path":
			count = list.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcpath")).length;
			break;
		case "face":
			count = list.filter((temp) => typeOfAttr(temp).has("ifc4x3_add2.ifcface")).length;
			break;
		case "shell":
			count = list.filter((temp) => {
				const types = typeOfAttr(temp);
				return types.has("ifc4x3_add2.ifcopenshell") || types.has("ifc4x3_add2.ifcclosedshell");
			}).length;
			break;
		case "undefined":
			return true;
		default:
			return INDETERMINATE;
	}
	return count === list.length;
}

/**
 * Real Python's `entity_instance` wrapping a standalone defined type (e.g. `FontSize`
 * resolved to an `IfcLengthMeasure`) supports direct arithmetic comparison against a bare
 * number because its own dunders unwrap to the underlying value automatically. This
 * port's `EntityInstance` has no such magic -- the exact same genuine gap
 * `whereRules/ifc2x3.ts`'s/`whereRules/ifc4.ts`'s own already-shipped `unwrapMeasure`
 * fixed for the byte-identical `IfcTextStyleFontModel_WR31`/`_MeasureOfFontSize` rule in
 * those schemas; a fresh local copy here per this file family's own established "no
 * cross-schema-file dependency" precedent.
 */
function unwrapMeasure(value: unknown): unknown {
	return value instanceof EntityInstance && !isEntity(value) ? value.getByIndex(0) : value;
}

/**
 * NEW this chunk (see this chunk's own header comment) -- the ADD2-specific, single-branch
 * sibling of `whereRules/ifc4.ts`'s own `definesTypeIsWindowTypeOrStyle`. IFC4's own
 * version also ORs in an `IfcWindowStyle` branch, but `IfcWindowStyle` was genuinely
 * removed from the schema in ADD2 (see this chunk's own header comment's "narrowed" entry
 * for `IfcWindowLiningProperties_WR34`), so that branch is gone from both real call sites
 * here. Factored at 2 occurrences (not waiting for a 3rd), matching
 * `definesTypeIsWindowTypeOrStyle`'s own identical 2-occurrence factoring precedent in
 * `whereRules/ifc4.ts`, and this file's own already-established `definesTypeIsDoorType`
 * (chunk 3) exactly. Python: `exists(lambda: DefinesType[1]) and
 * 'ifc4x3_add2.ifcwindowtype' in typeof(DefinesType[1])`.
 */
function definesTypeIsWindowType(self: EntityInstance): boolean {
	const first = () =>
		expressGetItem(expressGetAttr(self, "DefinesType", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	return exists(first) && typeOfAttr(first()).has("ifc4x3_add2.ifcwindowtype");
}

// =============================================================================
// SCOPE = 'entity' rules (real source lines 12372-13140, this chunk's own final 77,
// `IfcTendon_CorrectTypeAssigned` through `IfcZone_WR1` -- the LAST entity-scope class in
// the entire file).
// =============================================================================

// `IfcTendon_CorrectTypeAssigned` (line 12372).
const IfcTendon_CorrectTypeAssigned = entityRule("IfcTendon", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTendonType"),
		"IfcTendon: if IsTypedBy is given, its RelatingType must be an IfcTendonType.",
	);
});

// `IfcTendonAnchor_CorrectPredefinedType` (line 12382).
const IfcTendonAnchor_CorrectPredefinedType = entityRule("IfcTendonAnchor", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTendonAnchor: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTendonAnchor_CorrectTypeAssigned` (line 12392).
const IfcTendonAnchor_CorrectTypeAssigned = entityRule("IfcTendonAnchor", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTendonAnchorType"),
		"IfcTendonAnchor: if IsTypedBy is given, its RelatingType must be an IfcTendonAnchorType.",
	);
});

// `IfcTendonAnchorType_CorrectPredefinedType` (line 12402).
const IfcTendonAnchorType_CorrectPredefinedType = entityRule("IfcTendonAnchorType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcTendonAnchorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcTendonConduit_CorrectPredefinedType` (line 12412).
const IfcTendonConduit_CorrectPredefinedType = entityRule("IfcTendonConduit", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTendonConduit: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTendonConduit_CorrectTypeAssigned` (line 12422).
const IfcTendonConduit_CorrectTypeAssigned = entityRule("IfcTendonConduit", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTendonConduitType"),
		"IfcTendonConduit: if IsTypedBy is given, its RelatingType must be an IfcTendonConduitType.",
	);
});

// `IfcTendonConduitType_CorrectPredefinedType` (line 12432).
const IfcTendonConduitType_CorrectPredefinedType = entityRule(
	"IfcTendonConduitType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcTendonConduitType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcTendonType_CorrectPredefinedType` (line 12442).
const IfcTendonType_CorrectPredefinedType = entityRule("IfcTendonType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcTendonType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcTextLiteralWithExtent_WR31` (line 12455): `not IfcPlanarBox in typeof(Extent)`.
const IfcTextLiteralWithExtent_WR31 = entityRule("IfcTextLiteralWithExtent", "WR31", (self) => {
	const extent = expressGetAttr(self, "Extent", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(extent).has("ifc4x3_add2.ifcplanarbox"),
		"IfcTextLiteralWithExtent.Extent must not be an IfcPlanarBox.",
	);
});

// `IfcTextStyleFontModel_MeasureOfFontSize` (line 12465): `IfcLengthMeasure in
// typeof(FontSize) and FontSize > 0.0`. See `unwrapMeasure`.
const IfcTextStyleFontModel_MeasureOfFontSize = entityRule("IfcTextStyleFontModel", "MeasureOfFontSize", (self) => {
	const fontSize = expressGetAttr(self, "FontSize", INDETERMINATE);
	assertWhereRule(
		pyAnd(typeOfAttr(fontSize).has("ifc4x3_add2.ifclengthmeasure"), () => triGt(unwrapMeasure(fontSize), 0.0)),
		"IfcTextStyleFontModel: FontSize must be an IfcLengthMeasure greater than 0.",
	);
});

// `IfcTopologyRepresentation_WR21` (line 12474): every Items member must be an
// IfcTopologicalRepresentationItem.
const IfcTopologyRepresentation_WR21 = entityRule("IfcTopologyRepresentation", "WR21", (self) => {
	const items = asList<EntityInstance>(expressGetAttr(self, "Items", INDETERMINATE));
	const violating = items.filter(
		(temp) => !typeOfAttr(temp).has("ifc4x3_add2.ifctopologicalrepresentationitem"),
	).length;
	assertWhereRule(
		violating === 0,
		"IfcTopologyRepresentation: every Items member must be an IfcTopologicalRepresentationItem.",
	);
});

// `IfcTopologyRepresentation_WR22` (line 12483): `exists(RepresentationType)`.
const IfcTopologyRepresentation_WR22 = entityRule("IfcTopologyRepresentation", "WR22", (self) => {
	assertWhereRule(
		attrExists(self, "RepresentationType"),
		"IfcTopologyRepresentation: RepresentationType must be given.",
	);
});

// `IfcTopologyRepresentation_WR23` (line 12492): see `ifcTopologyRepresentationTypes`.
const IfcTopologyRepresentation_WR23 = entityRule("IfcTopologyRepresentation", "WR23", (self) => {
	const representationType = expressGetAttr(self, "RepresentationType", INDETERMINATE);
	const items = expressGetAttr(self, "Items", INDETERMINATE);
	assertWhereRule(
		ifcTopologyRepresentationTypes(representationType, items),
		"IfcTopologyRepresentation: RepresentationType must be consistent with the kind of Items given.",
	);
});

// `IfcToroidalSurface_MajorLargerMinor` (line 12501): `MinorRadius < MajorRadius`.
const IfcToroidalSurface_MajorLargerMinor = entityRule("IfcToroidalSurface", "MajorLargerMinor", (self) => {
	assertWhereRule(
		attrLessThan(self, "MinorRadius", "MajorRadius"),
		"IfcToroidalSurface.MinorRadius must be less than MajorRadius.",
	);
});

// `IfcTrackElement_CorrectPredefinedType` (line 12512).
const IfcTrackElement_CorrectPredefinedType = entityRule("IfcTrackElement", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTrackElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTrackElement_CorrectTypeAssigned` (line 12522).
const IfcTrackElement_CorrectTypeAssigned = entityRule("IfcTrackElement", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTrackElementType"),
		"IfcTrackElement: if IsTypedBy is given, its RelatingType must be an IfcTrackElementType.",
	);
});

// `IfcTrackElementType_CorrectPredefinedType` (line 12532).
const IfcTrackElementType_CorrectPredefinedType = entityRule("IfcTrackElementType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcTrackElementType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcTransformer_CorrectPredefinedType` (line 12542).
const IfcTransformer_CorrectPredefinedType = entityRule("IfcTransformer", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTransformer: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTransformer_CorrectTypeAssigned` (line 12552).
const IfcTransformer_CorrectTypeAssigned = entityRule("IfcTransformer", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTransformerType"),
		"IfcTransformer: if IsTypedBy is given, its RelatingType must be an IfcTransformerType.",
	);
});

// `IfcTransformerType_CorrectPredefinedType` (line 12562).
const IfcTransformerType_CorrectPredefinedType = entityRule("IfcTransformerType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcTransformerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcTransportElement_CorrectPredefinedType` (line 12572).
const IfcTransportElement_CorrectPredefinedType = entityRule("IfcTransportElement", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTransportElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTransportElement_CorrectTypeAssigned` (line 12582).
const IfcTransportElement_CorrectTypeAssigned = entityRule("IfcTransportElement", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTransportElementType"),
		"IfcTransportElement: if IsTypedBy is given, its RelatingType must be an IfcTransportElementType.",
	);
});

// `IfcTransportElementType_CorrectPredefinedType` (line 12592).
const IfcTransportElementType_CorrectPredefinedType = entityRule(
	"IfcTransportElementType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcTransportElementType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

/**
 * `IfcTriangulatedIrregularNetwork_NotClosed` (line 12606): `Closed == False`.
 * **Genuinely NEW in IFC4X3_ADD2** -- `IfcTriangulatedIrregularNetwork` (a terrain/TIN
 * mesh entity, part of ADD2's own infrastructure/alignment domain additions) has no
 * `IFC4.py` counterpart at all (confirmed directly: zero matches for
 * `^def IfcTriangulatedIrregularNetwork\(` in `IFC4.py`). `Closed` is a mandatory
 * `BOOLEAN` here (unlike the many OPTIONAL enum attributes elsewhere in this file), so the
 * real `== False` comparison is ported via `triEq(..., false)`, matching this file's own
 * `IfcRepresentationContextSameWCS`'s identical `isdifferent == False` shape (Part B,
 * below).
 */
const IfcTriangulatedIrregularNetwork_NotClosed = entityRule("IfcTriangulatedIrregularNetwork", "NotClosed", (self) => {
	assertWhereRule(
		triEq(expressGetAttr(self, "Closed", INDETERMINATE), false),
		"IfcTriangulatedIrregularNetwork.Closed must be FALSE.",
	);
});

// `IfcTrimmedCurve_NoTrimOfBoundedCurves` (line 12615): `not IfcBoundedCurve in
// typeof(BasisCurve)`.
const IfcTrimmedCurve_NoTrimOfBoundedCurves = entityRule("IfcTrimmedCurve", "NoTrimOfBoundedCurves", (self) => {
	const basisCurve = expressGetAttr(self, "BasisCurve", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(basisCurve).has("ifc4x3_add2.ifcboundedcurve"),
		"IfcTrimmedCurve.BasisCurve must not be an IfcBoundedCurve.",
	);
});

// `IfcTrimmedCurve_Trim1ValuesConsistent` (line 12625): see `trimValuesConsistent`.
const IfcTrimmedCurve_Trim1ValuesConsistent = entityRule("IfcTrimmedCurve", "Trim1ValuesConsistent", (self) => {
	assertWhereRule(
		trimValuesConsistent(self, "Trim1"),
		"IfcTrimmedCurve: Trim1 must either have exactly one member, or its two members must have different types.",
	);
});

// `IfcTrimmedCurve_Trim2ValuesConsistent` (line 12635): see `trimValuesConsistent`.
const IfcTrimmedCurve_Trim2ValuesConsistent = entityRule("IfcTrimmedCurve", "Trim2ValuesConsistent", (self) => {
	assertWhereRule(
		trimValuesConsistent(self, "Trim2"),
		"IfcTrimmedCurve: Trim2 must either have exactly one member, or its two members must have different types.",
	);
});

// `IfcTubeBundle_CorrectPredefinedType` (line 12645).
const IfcTubeBundle_CorrectPredefinedType = entityRule("IfcTubeBundle", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcTubeBundle: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcTubeBundle_CorrectTypeAssigned` (line 12655).
const IfcTubeBundle_CorrectTypeAssigned = entityRule("IfcTubeBundle", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcTubeBundleType"),
		"IfcTubeBundle: if IsTypedBy is given, its RelatingType must be an IfcTubeBundleType.",
	);
});

// `IfcTubeBundleType_CorrectPredefinedType` (line 12665).
const IfcTubeBundleType_CorrectPredefinedType = entityRule("IfcTubeBundleType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcTubeBundleType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcTypeObject_NameRequired` (line 12675): `exists(Name)`.
const IfcTypeObject_NameRequired = entityRule("IfcTypeObject", "NameRequired", (self) => {
	assertWhereRule(attrExists(self, "Name"), "IfcTypeObject: Name must be given.");
});

// `IfcTypeObject_UniquePropertySetNames` (line 12684): `not exists(HasPropertySets) or
// IfcUniquePropertySetNames(HasPropertySets)`. Reuses the already-ported
// `ifcUniquePropertySetNames`.
const IfcTypeObject_UniquePropertySetNames = entityRule("IfcTypeObject", "UniquePropertySetNames", (self) => {
	const hasPropertySets = expressGetAttr(self, "HasPropertySets", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(hasPropertySets), () => ifcUniquePropertySetNames(hasPropertySets)),
		"IfcTypeObject: every HasPropertySets member must have a distinct Name.",
	);
});

// `IfcTypeProduct_ApplicableOccurrence` (line 12694): `not exists(lambda: Types[1]) or
// sizeof([temp for temp in Types[1].RelatedObjects if not IfcProduct in typeof(temp)])
// == 0`.
const IfcTypeProduct_ApplicableOccurrence = entityRule("IfcTypeProduct", "ApplicableOccurrence", (self) => {
	const firstType = () =>
		expressGetItem(expressGetAttr(self, "Types", INDETERMINATE), 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(firstType), () => {
			const relatedObjects = expressGetAttr(firstType(), "RelatedObjects", INDETERMINATE);
			const items = isIndeterminate(relatedObjects) ? [] : (relatedObjects as EntityInstance[]);
			return items.filter((temp) => !typeOfAttr(temp).has("ifc4x3_add2.ifcproduct")).length === 0;
		}),
		"IfcTypeProduct: if Types[1] is given, every one of its RelatedObjects must be an IfcProduct.",
	);
});

// `IfcUShapeProfileDef_ValidFlangeThickness` (line 12703): `FlangeThickness < Depth / 2.0`.
const IfcUShapeProfileDef_ValidFlangeThickness = entityRule("IfcUShapeProfileDef", "ValidFlangeThickness", (self) => {
	assertWhereRule(
		attrLessThanHalf(self, "FlangeThickness", "Depth"),
		"IfcUShapeProfileDef.FlangeThickness must be less than Depth / 2.",
	);
});

// `IfcUShapeProfileDef_ValidWebThickness` (line 12714): `WebThickness < FlangeWidth`.
const IfcUShapeProfileDef_ValidWebThickness = entityRule("IfcUShapeProfileDef", "ValidWebThickness", (self) => {
	assertWhereRule(
		attrLessThan(self, "WebThickness", "FlangeWidth"),
		"IfcUShapeProfileDef.WebThickness must be less than FlangeWidth.",
	);
});

// `IfcUnitAssignment_WR01` (line 12725): see `ifcCorrectUnitAssignment`.
const IfcUnitAssignment_WR01 = entityRule("IfcUnitAssignment", "WR01", (self) => {
	const units = expressGetAttr(self, "Units", INDETERMINATE);
	assertWhereRule(
		ifcCorrectUnitAssignment(units),
		"IfcUnitAssignment: Units must satisfy IfcCorrectUnitAssignment (unique non-USERDEFINED UnitTypes, at most one monetary unit).",
	);
});

// `IfcUnitaryControlElement_CorrectPredefinedType` (line 12735).
const IfcUnitaryControlElement_CorrectPredefinedType = entityRule(
	"IfcUnitaryControlElement",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcUnitaryControlElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcUnitaryControlElement_CorrectTypeAssigned` (line 12745).
const IfcUnitaryControlElement_CorrectTypeAssigned = entityRule(
	"IfcUnitaryControlElement",
	"CorrectTypeAssigned",
	(self) => {
		assertWhereRule(
			correctTypeAssigned(self, "IfcUnitaryControlElementType"),
			"IfcUnitaryControlElement: if IsTypedBy is given, its RelatingType must be an IfcUnitaryControlElementType.",
		);
	},
);

// `IfcUnitaryControlElementType_CorrectPredefinedType` (line 12755).
const IfcUnitaryControlElementType_CorrectPredefinedType = entityRule(
	"IfcUnitaryControlElementType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcUnitaryControlElementType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcUnitaryEquipment_CorrectPredefinedType` (line 12765).
const IfcUnitaryEquipment_CorrectPredefinedType = entityRule("IfcUnitaryEquipment", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcUnitaryEquipment: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcUnitaryEquipment_CorrectTypeAssigned` (line 12775).
const IfcUnitaryEquipment_CorrectTypeAssigned = entityRule("IfcUnitaryEquipment", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcUnitaryEquipmentType"),
		"IfcUnitaryEquipment: if IsTypedBy is given, its RelatingType must be an IfcUnitaryEquipmentType.",
	);
});

// `IfcUnitaryEquipmentType_CorrectPredefinedType` (line 12785).
const IfcUnitaryEquipmentType_CorrectPredefinedType = entityRule(
	"IfcUnitaryEquipmentType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcUnitaryEquipmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcValve_CorrectPredefinedType` (line 12795).
const IfcValve_CorrectPredefinedType = entityRule("IfcValve", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcValve: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcValve_CorrectTypeAssigned` (line 12805).
const IfcValve_CorrectTypeAssigned = entityRule("IfcValve", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcValveType"),
		"IfcValve: if IsTypedBy is given, its RelatingType must be an IfcValveType.",
	);
});

// `IfcValveType_CorrectPredefinedType` (line 12815).
const IfcValveType_CorrectPredefinedType = entityRule("IfcValveType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcValveType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcVector_MagGreaterOrEqualZero` (line 12825): `Magnitude >= 0.0`.
const IfcVector_MagGreaterOrEqualZero = entityRule("IfcVector", "MagGreaterOrEqualZero", (self) => {
	assertWhereRule(attrGreaterEqualZero(self, "Magnitude"), "IfcVector.Magnitude must be >= 0.");
});

// `IfcVehicle_CorrectPredefinedType` (line 12839).
const IfcVehicle_CorrectPredefinedType = entityRule("IfcVehicle", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcVehicle: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcVehicle_CorrectTypeAssigned` (line 12849).
const IfcVehicle_CorrectTypeAssigned = entityRule("IfcVehicle", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcVehicleType"),
		"IfcVehicle: if IsTypedBy is given, its RelatingType must be an IfcVehicleType.",
	);
});

// `IfcVehicleType_CorrectPredefinedType` (line 12859).
const IfcVehicleType_CorrectPredefinedType = entityRule("IfcVehicleType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcVehicleType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcVibrationDamper_CorrectPredefinedType` (line 12869).
const IfcVibrationDamper_CorrectPredefinedType = entityRule("IfcVibrationDamper", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcVibrationDamper: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcVibrationDamper_CorrectTypeAssigned` (line 12879).
const IfcVibrationDamper_CorrectTypeAssigned = entityRule("IfcVibrationDamper", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcVibrationDamperType"),
		"IfcVibrationDamper: if IsTypedBy is given, its RelatingType must be an IfcVibrationDamperType.",
	);
});

// `IfcVibrationDamperType_CorrectPredefinedType` (line 12889).
const IfcVibrationDamperType_CorrectPredefinedType = entityRule(
	"IfcVibrationDamperType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcVibrationDamperType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcVibrationIsolator_CorrectPredefinedType` (line 12899).
const IfcVibrationIsolator_CorrectPredefinedType = entityRule(
	"IfcVibrationIsolator",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ObjectType", true),
			"IfcVibrationIsolator: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
		);
	},
);

// `IfcVibrationIsolator_CorrectTypeAssigned` (line 12909).
const IfcVibrationIsolator_CorrectTypeAssigned = entityRule("IfcVibrationIsolator", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcVibrationIsolatorType"),
		"IfcVibrationIsolator: if IsTypedBy is given, its RelatingType must be an IfcVibrationIsolatorType.",
	);
});

// `IfcVibrationIsolatorType_CorrectPredefinedType` (line 12919).
const IfcVibrationIsolatorType_CorrectPredefinedType = entityRule(
	"IfcVibrationIsolatorType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcVibrationIsolatorType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcVirtualElement_CorrectPredefinedType` (line 12929).
const IfcVirtualElement_CorrectPredefinedType = entityRule("IfcVirtualElement", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcVirtualElement: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcVoidingFeature_CorrectPredefinedType` (line 12939).
const IfcVoidingFeature_CorrectPredefinedType = entityRule("IfcVoidingFeature", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcVoidingFeature: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcWall_CorrectPredefinedType` (line 12949).
const IfcWall_CorrectPredefinedType = entityRule("IfcWall", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcWall: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcWall_CorrectTypeAssigned` (line 12959).
const IfcWall_CorrectTypeAssigned = entityRule("IfcWall", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcWallType"),
		"IfcWall: if IsTypedBy is given, its RelatingType must be an IfcWallType.",
	);
});

// `IfcWallStandardCase_HasMaterialLayerSetUsage` (line 12969): see `hasSoleMaterialUsage`.
// **`IfcSlabStandardCase` (which chunk 6's own header comment already flagged as left for
// "whichever later chunk reaches them") has been independently re-checked here and found
// REMOVED from the schema entirely** (zero matches for `class IfcSlabStandardCase` in
// `IFC4X3_ADD2.py`, confirmed directly) -- the 6th such vanished-"*StandardCase"-entity
// finding after chunks 1/2/4's own disclosures. `IfcSlabStandardCase`'s own rule falls
// alphabetically before this chunk's own `IfcTendon`-`IfcZone` range, so it is neither
// ported here nor deferred further -- disclosed for completeness only, not this chunk's
// own gap. `IfcWallStandardCase` itself is still present and its rule is byte-identical
// to `IFC4.py`'s own version modulo schema prefix.
const IfcWallStandardCase_HasMaterialLayerSetUsage = entityRule(
	"IfcWallStandardCase",
	"HasMaterialLayerSetUsage",
	(self) => {
		assertWhereRule(
			hasSoleMaterialUsage(self, "ifc4x3_add2.ifcmateriallayersetusage"),
			"IfcWallStandardCase: must be associated with exactly one IfcRelAssociatesMaterial whose RelatingMaterial is an IfcMaterialLayerSetUsage.",
		);
	},
);

// `IfcWallType_CorrectPredefinedType` (line 12978).
const IfcWallType_CorrectPredefinedType = entityRule("IfcWallType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcWallType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcWasteTerminal_CorrectPredefinedType` (line 12988).
const IfcWasteTerminal_CorrectPredefinedType = entityRule("IfcWasteTerminal", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcWasteTerminal: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcWasteTerminal_CorrectTypeAssigned` (line 12998).
const IfcWasteTerminal_CorrectTypeAssigned = entityRule("IfcWasteTerminal", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcWasteTerminalType"),
		"IfcWasteTerminal: if IsTypedBy is given, its RelatingType must be an IfcWasteTerminalType.",
	);
});

// `IfcWasteTerminalType_CorrectPredefinedType` (line 13008).
const IfcWasteTerminalType_CorrectPredefinedType = entityRule(
	"IfcWasteTerminalType",
	"CorrectPredefinedType",
	(self) => {
		assertWhereRule(
			correctPredefinedType(self, "ElementType", false),
			"IfcWasteTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
		);
	},
);

// `IfcWindow_CorrectPredefinedType` (line 13018).
const IfcWindow_CorrectPredefinedType = entityRule("IfcWindow", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcWindow: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcWindow_CorrectTypeAssigned` (line 13028).
const IfcWindow_CorrectTypeAssigned = entityRule("IfcWindow", "CorrectTypeAssigned", (self) => {
	assertWhereRule(
		correctTypeAssigned(self, "IfcWindowType"),
		"IfcWindow: if IsTypedBy is given, its RelatingType must be an IfcWindowType.",
	);
});

// `IfcWindowLiningProperties_WR31` (line 13038): see `impliesExists`.
const IfcWindowLiningProperties_WR31 = entityRule("IfcWindowLiningProperties", "WR31", (self) => {
	assertWhereRule(
		impliesExists(self, "LiningDepth", "LiningThickness"),
		"IfcWindowLiningProperties: if LiningDepth is given, LiningThickness must be given.",
	);
});

// `IfcWindowLiningProperties_WR32` (line 13049): see `impliesExists`.
const IfcWindowLiningProperties_WR32 = entityRule("IfcWindowLiningProperties", "WR32", (self) => {
	assertWhereRule(
		impliesExists(self, "SecondTransomOffset", "FirstTransomOffset"),
		"IfcWindowLiningProperties: if SecondTransomOffset is given, FirstTransomOffset must be given.",
	);
});

// `IfcWindowLiningProperties_WR33` (line 13060): see `impliesExists`.
const IfcWindowLiningProperties_WR33 = entityRule("IfcWindowLiningProperties", "WR33", (self) => {
	assertWhereRule(
		impliesExists(self, "SecondMullionOffset", "FirstMullionOffset"),
		"IfcWindowLiningProperties: if SecondMullionOffset is given, FirstMullionOffset must be given.",
	);
});

// `IfcWindowLiningProperties_WR34` (line 13071): see `definesTypeIsWindowType`.
// **Narrowed from IFC4's own `definesTypeIsWindowTypeOrStyle` shape** (which also
// accepted `IfcWindowStyle`) -- `IfcWindowStyle` was genuinely removed from the schema in
// ADD2 (already confirmed in chunk 5's own header comment: zero matches anywhere in the
// file), so only the `IfcWindowType` branch remains here -- the exact same narrowing
// chunk 3 already found for `IfcDoorLiningProperties_WR35`/`IfcDoorStyle`.
const IfcWindowLiningProperties_WR34 = entityRule("IfcWindowLiningProperties", "WR34", (self) => {
	assertWhereRule(
		definesTypeIsWindowType(self),
		"IfcWindowLiningProperties: DefinesType[1] must be given and be an IfcWindowType.",
	);
});

// `IfcWindowPanelProperties_ApplicableToType` (line 13080): see
// `definesTypeIsWindowType` -- same narrowing as `IfcWindowLiningProperties_WR34` above.
const IfcWindowPanelProperties_ApplicableToType = entityRule("IfcWindowPanelProperties", "ApplicableToType", (self) => {
	assertWhereRule(
		definesTypeIsWindowType(self),
		"IfcWindowPanelProperties: DefinesType[1] must be given and be an IfcWindowType.",
	);
});

// `IfcWindowType_CorrectPredefinedType` (line 13089).
const IfcWindowType_CorrectPredefinedType = entityRule("IfcWindowType", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ElementType", false),
		"IfcWindowType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcWorkCalendar_CorrectPredefinedType` (line 13099).
const IfcWorkCalendar_CorrectPredefinedType = entityRule("IfcWorkCalendar", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcWorkCalendar: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcWorkPlan_CorrectPredefinedType` (line 13109).
const IfcWorkPlan_CorrectPredefinedType = entityRule("IfcWorkPlan", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcWorkPlan: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcWorkSchedule_CorrectPredefinedType` (line 13119).
const IfcWorkSchedule_CorrectPredefinedType = entityRule("IfcWorkSchedule", "CorrectPredefinedType", (self) => {
	assertWhereRule(
		correctPredefinedType(self, "ObjectType", true),
		"IfcWorkSchedule: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcZShapeProfileDef_ValidFlangeThickness` (line 13129): `FlangeThickness < Depth / 2.0`.
const IfcZShapeProfileDef_ValidFlangeThickness = entityRule("IfcZShapeProfileDef", "ValidFlangeThickness", (self) => {
	assertWhereRule(
		attrLessThanHalf(self, "FlangeThickness", "Depth"),
		"IfcZShapeProfileDef.FlangeThickness must be less than Depth / 2.",
	);
});

// `IfcZone_WR1` (line 13140, the LAST entity-scope class in the entire file): `sizeof(
// IsGroupedBy) == 0 or sizeof([temp for temp in IsGroupedBy[1].RelatedObjects if not
// (IfcZone in typeof(temp) or IfcSpace in typeof(temp) or IfcSpatialZone in
// typeof(temp))]) == 0`.
const IfcZone_WR1 = entityRule("IfcZone", "WR1", (self) => {
	const isGroupedBy = expressGetAttr(self, "IsGroupedBy", INDETERMINATE);
	assertWhereRule(
		pyOr(triEq(sizeof(isGroupedBy), 0), () => {
			const rel = expressGetItem(isGroupedBy, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
			const relatedObjects = expressGetAttr(rel, "RelatedObjects", INDETERMINATE);
			const items = isIndeterminate(relatedObjects) ? [] : (relatedObjects as EntityInstance[]);
			const violating = items.filter((temp) => {
				const types = typeOfAttr(temp);
				return !(
					types.has("ifc4x3_add2.ifczone") ||
					types.has("ifc4x3_add2.ifcspace") ||
					types.has("ifc4x3_add2.ifcspatialzone")
				);
			}).length;
			return violating === 0;
		}),
		"IfcZone: every RelatedObjects member of IsGroupedBy[1] must be an IfcZone, IfcSpace, or IfcSpatialZone.",
	);
});

registerSchemaRules("IFC4X3_ADD2", [
	IfcTendon_CorrectTypeAssigned,
	IfcTendonAnchor_CorrectPredefinedType,
	IfcTendonAnchor_CorrectTypeAssigned,
	IfcTendonAnchorType_CorrectPredefinedType,
	IfcTendonConduit_CorrectPredefinedType,
	IfcTendonConduit_CorrectTypeAssigned,
	IfcTendonConduitType_CorrectPredefinedType,
	IfcTendonType_CorrectPredefinedType,
	IfcTextLiteralWithExtent_WR31,
	IfcTextStyleFontModel_MeasureOfFontSize,
	IfcTopologyRepresentation_WR21,
	IfcTopologyRepresentation_WR22,
	IfcTopologyRepresentation_WR23,
	IfcToroidalSurface_MajorLargerMinor,
	IfcTrackElement_CorrectPredefinedType,
	IfcTrackElement_CorrectTypeAssigned,
	IfcTrackElementType_CorrectPredefinedType,
	IfcTransformer_CorrectPredefinedType,
	IfcTransformer_CorrectTypeAssigned,
	IfcTransformerType_CorrectPredefinedType,
	IfcTransportElement_CorrectPredefinedType,
	IfcTransportElement_CorrectTypeAssigned,
	IfcTransportElementType_CorrectPredefinedType,
	IfcTriangulatedIrregularNetwork_NotClosed,
	IfcTrimmedCurve_NoTrimOfBoundedCurves,
	IfcTrimmedCurve_Trim1ValuesConsistent,
	IfcTrimmedCurve_Trim2ValuesConsistent,
	IfcTubeBundle_CorrectPredefinedType,
	IfcTubeBundle_CorrectTypeAssigned,
	IfcTubeBundleType_CorrectPredefinedType,
	IfcTypeObject_NameRequired,
	IfcTypeObject_UniquePropertySetNames,
	IfcTypeProduct_ApplicableOccurrence,
	IfcUShapeProfileDef_ValidFlangeThickness,
	IfcUShapeProfileDef_ValidWebThickness,
	IfcUnitAssignment_WR01,
	IfcUnitaryControlElement_CorrectPredefinedType,
	IfcUnitaryControlElement_CorrectTypeAssigned,
	IfcUnitaryControlElementType_CorrectPredefinedType,
	IfcUnitaryEquipment_CorrectPredefinedType,
	IfcUnitaryEquipment_CorrectTypeAssigned,
	IfcUnitaryEquipmentType_CorrectPredefinedType,
	IfcValve_CorrectPredefinedType,
	IfcValve_CorrectTypeAssigned,
	IfcValveType_CorrectPredefinedType,
	IfcVector_MagGreaterOrEqualZero,
	IfcVehicle_CorrectPredefinedType,
	IfcVehicle_CorrectTypeAssigned,
	IfcVehicleType_CorrectPredefinedType,
	IfcVibrationDamper_CorrectPredefinedType,
	IfcVibrationDamper_CorrectTypeAssigned,
	IfcVibrationDamperType_CorrectPredefinedType,
	IfcVibrationIsolator_CorrectPredefinedType,
	IfcVibrationIsolator_CorrectTypeAssigned,
	IfcVibrationIsolatorType_CorrectPredefinedType,
	IfcVirtualElement_CorrectPredefinedType,
	IfcVoidingFeature_CorrectPredefinedType,
	IfcWall_CorrectPredefinedType,
	IfcWall_CorrectTypeAssigned,
	IfcWallStandardCase_HasMaterialLayerSetUsage,
	IfcWallType_CorrectPredefinedType,
	IfcWasteTerminal_CorrectPredefinedType,
	IfcWasteTerminal_CorrectTypeAssigned,
	IfcWasteTerminalType_CorrectPredefinedType,
	IfcWindow_CorrectPredefinedType,
	IfcWindow_CorrectTypeAssigned,
	IfcWindowLiningProperties_WR31,
	IfcWindowLiningProperties_WR32,
	IfcWindowLiningProperties_WR33,
	IfcWindowLiningProperties_WR34,
	IfcWindowPanelProperties_ApplicableToType,
	IfcWindowType_CorrectPredefinedType,
	IfcWorkCalendar_CorrectPredefinedType,
	IfcWorkPlan_CorrectPredefinedType,
	IfcWorkSchedule_CorrectPredefinedType,
	IfcZShapeProfileDef_ValidFlangeThickness,
	IfcZone_WR1,
]);

// =============================================================================
// Part B -- the LAST 2 `SCOPE = 'file'` classes in the entire file
// (`IfcRepresentationContextSameWCS`/`IfcSingleProjectInstance`, real source lines
// 13149/13164). Landing these 2 rules completes ALL 779 IFC4X3_ADD2 WHERE-rule classes
// (752 entity + 25 type + 2 file) -- IFC4X3_ADD2 IS NOW SCHEMA-COMPLETE, AND ALL OF PHASE
// EX-4 IS NOW COMPLETE (1,823 WHERE-rule classes across IFC2X3/IFC4/IFC4X3_ADD2).
//
// Mirrors `whereRules/ifc2x3.ts`'s own chunk 5 precedent and `whereRules/ifc4.ts`'s own
// chunk 6 precedent exactly -- `ruleDispatch.ts`/`ruleExecutor.ts` already fully support
// `SCOPE = 'file'` dispatch (confirmed directly, re-read before writing any of the below,
// not assumed) -- only a new `fileRule(ruleName, check)` registration helper is needed,
// mirroring the existing `typeRule`/`entityRule` pattern (this file's own local copy, per
// this file family's established "no cross-schema-file dependency" precedent).
//
// **5 rule-file-local, non-`calc_*`, non-WHERE-rule EXPRESS-library helpers ported below**,
// all transitively reached from `IfcRepresentationContextSameWCS`'s own call to
// `IfcSameValidPrecision`/`IfcSameAxis2Placement`: `ifcSameValidPrecision` (`IFC4X3_ADD2.py`
// line 13789), `ifcSameAxis2Placement` (line 13760, itself calling
// `ifcSameDirection`/`ifcSameCartesianPoint`), `ifcSameDirection` (line 13776),
// `ifcSameCartesianPoint` (line 13763), and `ifcSameValue` (line 13797). Each body
// independently re-read directly against `IFC4X3_ADD2.py`'s own real source (not assumed
// from IFC2X3's/IFC4's own already-ported versions alone) and diffed byte-for-byte.
//
// **4 of these 5 helpers (`ifcSameValidPrecision`/`ifcSameDirection`/
// `ifcSameCartesianPoint`/`ifcSameValue`) are confirmed BYTE-IDENTICAL to `IFC4.py`'s own
// versions** (these functions take no schema-prefixed strings at all, so there is nothing
// even to normalize) -- ported as plain fresh copies.
//
// =============================================================================
// MAJOR FINDING, independently verified, NOT the expected outcome: `IfcSameAxis2Placement`'s
// real upstream bug from IFC2X3/IFC4 has been FIXED in IFC4X3_ADD2's own real source
// =============================================================================
//
// Both IFC2X3 (`IFC2X3.py` line 7906) and IFC4 (`IFC4.py` line 11942) have the SAME real,
// verbatim-preserved upstream bug in `IfcSameAxis2Placement`: its own final conjunct calls
// `IfcSameCartesianPoint(ap1.Location, ap1.Location, epsilon)` -- BOTH arguments are
// `ap1`'s own `Location`, so `ap2` is never referenced in that conjunct at all, making it
// unconditionally `True` regardless of the two placements' actual `Location`s. This
// chunk's own task brief, following that established 2-schema precedent, EXPECTED this
// same bug to be present in `IFC4X3_ADD2.py` too and instructed porting it verbatim if so.
//
// **Direct re-reading of `IFC4X3_ADD2.py`'s own real source (line 13760-13761), NOT
// assumed from the 2-schema precedent alone, shows the bug has been FIXED**:
// ```python
// def IfcSameAxis2Placement(ap1, ap2, epsilon):
//     return IfcSameDirection(ap1.P[1], ap2.P[1], epsilon) and IfcSameDirection(ap1.P[2], ap2.P[2], epsilon) and IfcSameCartesianPoint(ap1.Location, ap2.Location, epsilon)
// ```
// The final conjunct now correctly reads `ap2.Location` (confirmed via direct `diff`
// against `IFC4.py`'s own body: the ONLY textual difference between the two functions is
// this single `ap1` -> `ap2` change in the very last argument). This means
// `IfcRepresentationContextSameWCS` genuinely behaves DIFFERENTLY across schemas: in
// IFC2X3/IFC4, two `IfcGeometricRepresentationContext`s with different
// `WorldCoordinateSystem.Location`s but the same axis directions incorrectly PASS (the
// bug); in IFC4X3_ADD2, the same scenario correctly FAILS. Ported AS-IS below (the real,
// FIXED ADD2 behavior) -- NOT artificially re-introducing the bug the task brief expected,
// since this project's own verbatim-translation mandate means porting the REAL source
// exactly, whichever way that cuts. Test fixtures below demonstrate the fix directly
// (contrast with `ifc4.test.ts`'s own "pass (bug-demonstrating)" test for the same
// scenario).
// =============================================================================
//
// **A related, smaller upstream-fix finding, already disclosed above (Part A's own
// `IfcTransformer_CorrectTypeAssigned`)**: `IFC4.py`'s own misspelled
// `'ifc4.ifctranformertype'` membership string has likewise been corrected in
// `IFC4X3_ADD2.py`. Between the two, this chunk finds ADD2 has fixed 2 distinct real
// upstream Python defects relative to IFC4 -- disclosed prominently since "the schema
// fixes its own predecessor's bugs" is a new category of finding for this project (every
// prior chunk across all 3 schemas either found a bug freshly PRESENT or freshly ABSENT,
// never a same-named bug present in an EARLIER schema and fixed in a LATER one).
// =============================================================================

/**
 * Mirrors `typeRule`/`entityRule` above exactly and `whereRules/ifc2x3.ts`'s/
 * `whereRules/ifc4.ts`'s own identical `fileRule` -- see this section's own header
 * comment. `check` receives the whole `IfcFile` (real Python: `R()(f)`,
 * `rule_executor.py` line 143), NOT a single `EntityInstance`, matching `ruleExecutor.ts`'s
 * own file-scope loop (`rule.check(f)`, no per-instance dispatch at all).
 */
function fileRule(ruleName: string, check: (file: IfcFile) => void): RuleDefinition {
	return { scope: "file", typeName: undefined, ruleName, check };
}

/**
 * Python: `IfcSameValue(value1, value2, epsilon)` (`IFC4X3_ADD2.py` line 13797),
 * byte-identical to `IFC4.py`'s own version (line 11979):
 * ```python
 * def IfcSameValue(value1, value2, epsilon):
 *     defaulteps = 1e-06
 *     valideps = nvl(epsilon, defaulteps)
 *     return value1 + valideps > value2 and value1 < value2 + valideps
 * ```
 * An epsilon-tolerant fuzzy equality: `value1`/`value2` are "the same" iff they're within
 * `valideps` of each other (`nvl`'d to `1e-6` when `epsilon` itself is absent).
 */
function ifcSameValue(value1: unknown, value2: unknown, epsilon: unknown): Tri {
	const defaultEps = 1e-6;
	const validEps = nvl(epsilon, defaultEps) as number;
	return pyAnd(triGt((value1 as number) + validEps, value2), () => triLt(value1, (value2 as number) + validEps));
}

/**
 * Python: `IfcSameCartesianPoint(cp1, cp2, epsilon)` (`IFC4X3_ADD2.py` line 13763),
 * byte-identical to `IFC4.py`'s own version (line 11945). Compares two `IfcCartesianPoint`s
 * component-wise (X/Y always present, Z defaulted to `0` for a 2D point) via
 * `ifcSameValue`.
 */
function ifcSameCartesianPoint(cp1: unknown, cp2: unknown, epsilon: unknown): Tri {
	const cp1Coordinates = expressGetAttr(cp1, "Coordinates", INDETERMINATE);
	const cp2Coordinates = expressGetAttr(cp2, "Coordinates", INDETERMINATE);
	const cp1x = expressGetItem(cp1Coordinates, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const cp1y = expressGetItem(cp1Coordinates, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	let cp1z: unknown = 0;
	const cp2x = expressGetItem(cp2Coordinates, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const cp2y = expressGetItem(cp2Coordinates, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	let cp2z: unknown = 0;
	if ((sizeof(cp1Coordinates) as number) > 2) {
		cp1z = expressGetItem(cp1Coordinates, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	}
	if ((sizeof(cp2Coordinates) as number) > 2) {
		cp2z = expressGetItem(cp2Coordinates, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	}
	return pyAnd(ifcSameValue(cp1x, cp2x, epsilon), () =>
		pyAnd(ifcSameValue(cp1y, cp2y, epsilon), () => ifcSameValue(cp1z, cp2z, epsilon)),
	);
}

/**
 * Python: `IfcSameDirection(dir1, dir2, epsilon)` (`IFC4X3_ADD2.py` line 13776),
 * byte-identical to `IFC4.py`'s own version (line 11958) -- identical shape to
 * `ifcSameCartesianPoint` above, over `DirectionRatios` instead of `Coordinates`.
 */
function ifcSameDirection(dir1: unknown, dir2: unknown, epsilon: unknown): Tri {
	const dir1Ratios = expressGetAttr(dir1, "DirectionRatios", INDETERMINATE);
	const dir2Ratios = expressGetAttr(dir2, "DirectionRatios", INDETERMINATE);
	const dir1x = expressGetItem(dir1Ratios, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const dir1y = expressGetItem(dir1Ratios, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	let dir1z: unknown = 0;
	const dir2x = expressGetItem(dir2Ratios, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const dir2y = expressGetItem(dir2Ratios, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	let dir2z: unknown = 0;
	if ((sizeof(dir1Ratios) as number) > 2) {
		dir1z = expressGetItem(dir1Ratios, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	}
	if ((sizeof(dir2Ratios) as number) > 2) {
		dir2z = expressGetItem(dir2Ratios, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	}
	return pyAnd(ifcSameValue(dir1x, dir2x, epsilon), () =>
		pyAnd(ifcSameValue(dir1y, dir2y, epsilon), () => ifcSameValue(dir1z, dir2z, epsilon)),
	);
}

/**
 * Python: `IfcSameAxis2Placement(ap1, ap2, epsilon)` (`IFC4X3_ADD2.py` line 13760):
 * ```python
 * def IfcSameAxis2Placement(ap1, ap2, epsilon):
 *     return IfcSameDirection(ap1.P[1], ap2.P[1], epsilon) and IfcSameDirection(ap1.P[2], ap2.P[2], epsilon) and IfcSameCartesianPoint(ap1.Location, ap2.Location, epsilon)
 * ```
 *
 * **UPSTREAM BUG FIX, independently verified, genuinely DIFFERENT from IFC2X3's/IFC4's
 * own still-buggy versions -- see this section's own header comment for the full
 * derivation.** Unlike IFC2X3 (`IFC2X3.py` line 7906-7907) and IFC4 (`IFC4.py` line
 * 11942-11943), whose own final conjunct passes `ap1.Location` as BOTH arguments to
 * `IfcSameCartesianPoint` (so `ap2` is never actually compared), ADD2's own real source
 * correctly passes `ap2.Location` as the second argument. This function therefore
 * genuinely compares BOTH placements' `Location`s here -- ported faithfully as ADD2's own
 * real, FIXED behavior, NOT re-introducing the other 2 schemas' bug.
 */
function ifcSameAxis2Placement(ap1: unknown, ap2: unknown, epsilon: unknown): Tri {
	const ap1P = expressGetAttr(ap1, "P", INDETERMINATE);
	const ap2P = expressGetAttr(ap2, "P", INDETERMINATE);
	const ap1Location = expressGetAttr(ap1, "Location", INDETERMINATE);
	const ap2Location = expressGetAttr(ap2, "Location", INDETERMINATE);
	return pyAnd(
		ifcSameDirection(
			expressGetItem(ap1P, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			expressGetItem(ap2P, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
			epsilon,
		),
		() =>
			pyAnd(
				ifcSameDirection(
					expressGetItem(ap1P, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
					expressGetItem(ap2P, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
					epsilon,
				),
				// Fixed in ADD2's own real source (see this function's own doc comment above):
				// `ap2Location`, NOT `ap1Location` again.
				() => ifcSameCartesianPoint(ap1Location, ap2Location, epsilon),
			),
	);
}

/**
 * Python: `IfcSameValidPrecision(epsilon1, epsilon2)` (`IFC4X3_ADD2.py` line 13789),
 * byte-identical to `IFC4.py`'s own version (line 11971). Checks that two `Precision`
 * values are both positive, within 0.1% of each other (`derivationofeps = 1.001`), and
 * below the upper bound `1.0` -- each missing `epsilon` defaults to `1e-6` via `nvl`.
 */
function ifcSameValidPrecision(epsilon1: unknown, epsilon2: unknown): Tri {
	const defaultEps = 1e-6;
	const derivationOfEps = 1.001;
	const upperEps = 1.0;
	const validEps1 = nvl(epsilon1, defaultEps) as number;
	const validEps2 = nvl(epsilon2, defaultEps) as number;
	return pyAnd(triLt(0.0, validEps1), () =>
		pyAnd(triLe(validEps1, derivationOfEps * validEps2), () =>
			pyAnd(triLe(validEps2, derivationOfEps * validEps1), () => triLt(validEps2, upperEps)),
		),
	);
}

// `IfcRepresentationContextSameWCS` (line 13149): every `IfcGeometricRepresentationContext`
// in the file must share the same `WorldCoordinateSystem` as the first one found (within
// precision) -- byte-identical body to `IFC4.py`'s own version (see this section's own
// header comment for the full "class identical(norm)" confirmation); only the
// TRANSITIVELY-called `IfcSameAxis2Placement` differs (the fix above). Only compares every
// OTHER context against the FIRST one found (not all pairs) -- ported faithfully, not
// "improved" to an all-pairs check. `contexts[1].Precision` (the FIRST context's own
// `Precision`, not `contexts[i]`'s) is reused as the `epsilon` for the
// `IfcSameAxis2Placement` call too, exactly matching real source's own asymmetric argument
// choice.
const IfcRepresentationContextSameWCS = fileRule("IfcRepresentationContextSameWCS", (file) => {
	const contexts = file.byType("IfcGeometricRepresentationContext");
	let isDifferent: Tri = false;
	if (contexts.length > 1) {
		const first = contexts[1 - EXPRESS_ONE_BASED_INDEXING];
		const firstWcs = expressGetAttr(first, "WorldCoordinateSystem", INDETERMINATE);
		const firstPrecision = expressGetAttr(first, "Precision", INDETERMINATE);
		for (const i of expressRange(2, contexts.length + 1)) {
			const other = contexts[i - EXPRESS_ONE_BASED_INDEXING];
			const otherWcs = expressGetAttr(other, "WorldCoordinateSystem", INDETERMINATE);
			if (triNe(firstWcs, otherWcs) === true) {
				const otherPrecision = expressGetAttr(other, "Precision", INDETERMINATE);
				isDifferent = pyOr(pyNot(ifcSameValidPrecision(firstPrecision, otherPrecision)), () =>
					pyNot(ifcSameAxis2Placement(firstWcs, otherWcs, firstPrecision)),
				);
				if (isDifferent === true) break;
			}
		}
	}
	assertWhereRule(
		triEq(isDifferent, false),
		"IfcRepresentationContextSameWCS: every IfcGeometricRepresentationContext must share the same WorldCoordinateSystem (within precision) as the first one found.",
	);
});

// `IfcSingleProjectInstance` (line 13164): `sizeof(file.by_type('IfcProject')) <= 1` --
// byte-identical body to `IFC4.py`'s own version.
const IfcSingleProjectInstance = fileRule("IfcSingleProjectInstance", (file) => {
	const projects = file.byType("IfcProject");
	assertWhereRule(projects.length <= 1, "IfcSingleProjectInstance: a file must contain at most one IfcProject.");
});

registerSchemaRules("IFC4X3_ADD2", [IfcRepresentationContextSameWCS, IfcSingleProjectInstance]);
