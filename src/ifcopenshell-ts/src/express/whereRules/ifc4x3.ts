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

import type { EntityInstance } from "../../entityInstance";
import { type RuleDefinition, registerSchemaRules } from "../ruleDispatch";
import { ifcCrossProduct } from "../rules/ifc4x3";
import {
	EXPRESS_ONE_BASED_INDEXING,
	INDETERMINATE,
	type Tri,
	assertWhereRule,
	exists,
	expressGetAttr,
	expressGetItem,
	isIndeterminate,
	pyAnd,
	pyOr,
	sizeof,
	triEq,
	triGt,
	triLe,
	triLt,
	triNe,
	typeOf,
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
