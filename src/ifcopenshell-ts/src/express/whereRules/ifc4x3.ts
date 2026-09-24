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
