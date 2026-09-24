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
import { ifcCrossProduct, ifcDirection, ifcDotProduct } from "../rules/ifc4x3";
import {
	EXPRESS_ONE_BASED_INDEXING,
	ExpressSet,
	INDETERMINATE,
	type Tri,
	assertWhereRule,
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
