// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk"): original, hand-rolled coverage exercising each of the 70 WHERE-rule classes
// ported in `src/express/whereRules/ifc2x3.ts` individually -- matching this project's
// established convention for shim/engine-layer code with no dedicated real test of its
// own (real Python's own WHERE-rule fixture suite, `test/fixtures/rules/`, is explicitly
// out of scope for this chunk -- wiring it up is future integration-chunk work). Each
// rule gets at least one passing case and (where a real, constructible failing case
// exists) one failing case, calling the rule's own `check()` function DIRECTLY (found
// via `findRule`, not `executeRules`) -- this isolates each rule's own pass/fail logic
// from the 3-phase engine's own dispatch mechanics, which `ruleExecutor.test.ts` already
// covers separately with synthetic rules.
//
// **Fixture-construction convention used throughout**: every entity is constructed via
// a zero-argument `file.createEntity("IfcXxx")` (leaving every attribute unset/null)
// followed by explicit Proxy-based dot-assignment for only the attribute(s) a given
// rule actually reads -- deliberately not full, schema-valid positional-argument
// construction (which would require knowing every entity's own complete attribute list
// and order, most of which are irrelevant to the rule under test). This is safe because
// `check()` functions only ever read the specific attributes their own real Python
// source names -- an otherwise-incomplete entity is not a validity problem for a
// unit test calling `check()` directly (as opposed to running it through `validate()`).
//
// Every fixture and expected pass/fail outcome is hand-derived directly from
// `whereRules/ifc2x3.ts`'s own ported rule bodies (which themselves cite the exact real
// Python source line for each rule) -- not from this test file's own assumptions.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { EntityInstance } from "../../../src/entityInstance";
import "../../../src/express/whereRules/ifc2x3";
import { type RuleDefinition, getSchemaRules } from "../../../src/express/ruleDispatch";
import { executeRules } from "../../../src/express/ruleExecutor";
import type { IfcFile } from "../../../src/file";
import { settings } from "../../../src/settings";
import * as template from "../../../src/template";
import { createTestFile } from "../../bootstrap";

/**
 * `createTestFile`'s own default (non-`blank`) template bakes in a starter
 * `IfcProject`/unit-assignment/geometric-context/owner-history chain (see
 * `template.ts`'s own header comment, and `ruleExecutor.test.ts`'s own identical
 * finding) -- genuinely present entities whose own attribute values would otherwise
 * cross-contaminate an end-to-end "zero violations" or "exactly this one violation"
 * assertion. `blank: true` gives a genuinely entity-free starting point.
 */
function blankFile(): IfcFile {
	return template.create({ schemaIdentifier: "IFC2X3", blank: true });
}

function findRule(typeName: string, ruleName: string): RuleDefinition {
	const rule = getSchemaRules("IFC2X3").find((r) => r.typeName === typeName && r.ruleName === ruleName);
	if (!rule) throw new Error(`Rule not found in registry: ${typeName}.${ruleName}`);
	return rule;
}

function expectPass(typeName: string, ruleName: string, target: unknown): void {
	expect(() => findRule(typeName, ruleName).check(target)).not.toThrow();
}

function expectFail(typeName: string, ruleName: string, target: unknown): void {
	expect(() => findRule(typeName, ruleName).check(target)).toThrow();
}

let file: IfcFile;
let originalUnpack: boolean;
let originalCompare: boolean;

// This file calls each rule's own `check()` DIRECTLY, bypassing `executeRules` (whose
// own job -- tested separately, `ruleExecutor.test.ts` -- is exactly to toggle these
// two settings for the duration of a real rule-execution pass, mirroring real Python's
// `rule_executor.run()`, lines 90-97). Several ported rules (e.g. `IfcAsset.WR1`, which
// reads the single-valued inverse `IsGroupedBy`) only behave correctly with
// `unpackNonAggregateInverses` on -- confirmed empirically while building this file's
// own `IfcAsset.WR1` fixture (without this, `IsGroupedBy` reads back as a 1-element
// ARRAY, not the single `EntityInstance` the rule body expects, silently breaking the
// rule). Toggled on for this whole file's duration, matching what a real
// `executeRules(file)` call would already be doing around every one of these rules.
beforeAll(() => {
	file = createTestFile("IFC2X3");
	originalUnpack = settings.unpackNonAggregateInverses;
	originalCompare = settings.compareInstancesByValue;
	settings.unpackNonAggregateInverses = true;
	settings.compareInstancesByValue = true;
});

afterAll(() => {
	settings.unpackNonAggregateInverses = originalUnpack;
	settings.compareInstancesByValue = originalCompare;
});

function create(type: string): EntityInstance {
	return file.createEntity(type);
}

function point(coords: number[]): EntityInstance {
	const pt = create("IfcCartesianPoint");
	(pt as unknown as { Coordinates: number[] }).Coordinates = coords;
	return pt;
}

function direction(ratios: number[]): EntityInstance {
	const dir = create("IfcDirection");
	(dir as unknown as { DirectionRatios: number[] }).DirectionRatios = ratios;
	return dir;
}

function polyline(points: EntityInstance[]): EntityInstance {
	const pl = create("IfcPolyline");
	(pl as unknown as { Points: EntityInstance[] }).Points = points;
	return pl;
}

// =============================================================================
// SCOPE = 'type' rules -- `self` is the raw, already-non-null value, no entity
// construction needed at all.
// =============================================================================

describe("IfcBoxAlignment.WR1", () => {
	test("pass: a documented keyword, any case", () => {
		expectPass("IfcBoxAlignment", "WR1", "top-left");
		expectPass("IfcBoxAlignment", "WR1", "CENTER");
	});
	test("fail: an undocumented keyword", () => {
		expectFail("IfcBoxAlignment", "WR1", "somewhere");
	});
});

describe("IfcCompoundPlaneAngleMeasure.WR1-WR4", () => {
	test("WR1 pass/fail: degrees in [-360, 360)", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "WR1", [10, 0, 0]);
		expectFail("IfcCompoundPlaneAngleMeasure", "WR1", [-361, 0, 0]);
		expectFail("IfcCompoundPlaneAngleMeasure", "WR1", [360, 0, 0]);
	});
	test("WR2 pass/fail: minutes in [-60, 60)", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "WR2", [0, 10, 0]);
		expectFail("IfcCompoundPlaneAngleMeasure", "WR2", [0, -61, 0]);
	});
	test("WR3 pass/fail: seconds in [-60, 60)", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "WR3", [0, 0, 10]);
		expectFail("IfcCompoundPlaneAngleMeasure", "WR3", [0, 0, -61]);
	});
	test("WR4 pass/fail: components must share the same sign", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "WR4", [1, 1, 1]);
		expectPass("IfcCompoundPlaneAngleMeasure", "WR4", [-1, -1, -1]);
		expectPass("IfcCompoundPlaneAngleMeasure", "WR4", [0, 0, 0]);
		expectFail("IfcCompoundPlaneAngleMeasure", "WR4", [1, -1, 1]);
	});
});

describe("IfcDaylightSavingHour.WR1", () => {
	test("pass/fail: [0, 2]", () => {
		expectPass("IfcDaylightSavingHour", "WR1", 1);
		expectFail("IfcDaylightSavingHour", "WR1", 3);
	});
});

describe("IfcDimensionCount.WR1", () => {
	test("pass/fail: (0, 3]", () => {
		expectPass("IfcDimensionCount", "WR1", 2);
		expectFail("IfcDimensionCount", "WR1", 0);
		expectFail("IfcDimensionCount", "WR1", 4);
	});
});

describe("IfcFontStyle.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcFontStyle", "WR1", "Italic");
		expectFail("IfcFontStyle", "WR1", "bold");
	});
});

describe("IfcFontVariant.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcFontVariant", "WR1", "small-caps");
		expectFail("IfcFontVariant", "WR1", "x");
	});
});

describe("IfcFontWeight.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcFontWeight", "WR1", "700");
		expectFail("IfcFontWeight", "WR1", "750");
	});
});

describe("IfcHeatingValueMeasure.WR1", () => {
	test("pass/fail: > 0", () => {
		expectPass("IfcHeatingValueMeasure", "WR1", 5);
		expectFail("IfcHeatingValueMeasure", "WR1", 0);
	});
});

describe("IfcHourInDay.WR1", () => {
	test("pass/fail: [0, 24)", () => {
		expectPass("IfcHourInDay", "WR1", 0);
		expectFail("IfcHourInDay", "WR1", 24);
	});
});

describe("IfcMinuteInHour.WR1", () => {
	test("pass/fail: [0, 59]", () => {
		expectPass("IfcMinuteInHour", "WR1", 59);
		expectFail("IfcMinuteInHour", "WR1", 60);
	});
});

describe("IfcMonthInYearNumber.WR1", () => {
	test("pass/fail: [1, 12]", () => {
		expectPass("IfcMonthInYearNumber", "WR1", 1);
		expectFail("IfcMonthInYearNumber", "WR1", 0);
		expectFail("IfcMonthInYearNumber", "WR1", 13);
	});
});

describe("IfcNormalisedRatioMeasure.WR1", () => {
	test("pass/fail: [0, 1]", () => {
		expectPass("IfcNormalisedRatioMeasure", "WR1", 0.5);
		expectFail("IfcNormalisedRatioMeasure", "WR1", 1.1);
	});
});

describe("IfcPHMeasure.WR21", () => {
	test("pass/fail: [0, 14]", () => {
		expectPass("IfcPHMeasure", "WR21", 7);
		expectFail("IfcPHMeasure", "WR21", 15);
	});
});

describe("IfcPositiveLengthMeasure.WR1", () => {
	test("pass/fail: > 0", () => {
		expectPass("IfcPositiveLengthMeasure", "WR1", 1);
		expectFail("IfcPositiveLengthMeasure", "WR1", 0);
	});
});

describe("IfcPositivePlaneAngleMeasure.WR1", () => {
	test("pass/fail: > 0", () => {
		expectPass("IfcPositivePlaneAngleMeasure", "WR1", 1);
		expectFail("IfcPositivePlaneAngleMeasure", "WR1", 0);
	});
});

describe("IfcPositiveRatioMeasure.WR1", () => {
	test("pass/fail: > 0", () => {
		expectPass("IfcPositiveRatioMeasure", "WR1", 0.5);
		expectFail("IfcPositiveRatioMeasure", "WR1", 0);
	});
});

describe("IfcSecondInMinute.WR1", () => {
	test("pass/fail: [0, 60)", () => {
		expectPass("IfcSecondInMinute", "WR1", 0);
		expectFail("IfcSecondInMinute", "WR1", 60);
	});
});

describe("IfcSpecularRoughness.WR1", () => {
	test("pass/fail: [0, 1]", () => {
		expectPass("IfcSpecularRoughness", "WR1", 0.5);
		expectFail("IfcSpecularRoughness", "WR1", -0.1);
	});
});

describe("IfcTextAlignment.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcTextAlignment", "WR1", "left");
		expectFail("IfcTextAlignment", "WR1", "top");
	});
});

describe("IfcTextDecoration.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcTextDecoration", "WR1", "blink");
		expectFail("IfcTextDecoration", "WR1", "x");
	});
});

describe("IfcTextTransformation.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcTextTransformation", "WR1", "none");
		expectFail("IfcTextTransformation", "WR1", "x");
	});
});

// =============================================================================
// SCOPE = 'entity' rules -- `self` is a real `EntityInstance`.
// =============================================================================

describe("Ifc2DCompositeCurve.WR1/WR2", () => {
	function curveWithTransitionAndDim(transition: string, dim: 2 | 3): EntityInstance {
		const coords = dim === 2 ? [0, 0] : [0, 0, 0];
		const pl = polyline([point(coords)]);
		const segment = create("IfcCompositeCurveSegment");
		(segment as unknown as { Transition: string; SameSense: boolean; ParentCurve: EntityInstance }).Transition =
			transition;
		(segment as unknown as { SameSense: boolean }).SameSense = true;
		(segment as unknown as { ParentCurve: EntityInstance }).ParentCurve = pl;
		const curve = create("Ifc2DCompositeCurve");
		(curve as unknown as { Segments: EntityInstance[] }).Segments = [segment];
		return curve;
	}

	test("WR1 pass: last segment's Transition is not DISCONTINUOUS -> ClosedCurve is true", () => {
		expectPass("Ifc2DCompositeCurve", "WR1", curveWithTransitionAndDim("CONTINUOUS", 2));
	});

	test("WR1 fail: last segment's Transition is DISCONTINUOUS -> ClosedCurve is false", () => {
		expectFail("Ifc2DCompositeCurve", "WR1", curveWithTransitionAndDim("DISCONTINUOUS", 2));
	});

	test("WR2 pass/fail: Dim must equal 2", () => {
		expectPass("Ifc2DCompositeCurve", "WR2", curveWithTransitionAndDim("CONTINUOUS", 2));
		expectFail("Ifc2DCompositeCurve", "WR2", curveWithTransitionAndDim("CONTINUOUS", 3));
	});
});

describe("IfcActorRole.WR1", () => {
	function role(roleValue: string, userDefinedRole: string | null): EntityInstance {
		const r = create("IfcActorRole");
		(r as unknown as { Role: string }).Role = roleValue;
		(r as unknown as { UserDefinedRole: string | null }).UserDefinedRole = userDefinedRole;
		return r;
	}

	test("pass: Role is not USERDEFINED", () => {
		expectPass("IfcActorRole", "WR1", role("SUPPLIER", null));
	});
	test("pass: Role is USERDEFINED and UserDefinedRole is given", () => {
		expectPass("IfcActorRole", "WR1", role("USERDEFINED", "Custom"));
	});
	test("fail: Role is USERDEFINED but UserDefinedRole is missing", () => {
		expectFail("IfcActorRole", "WR1", role("USERDEFINED", null));
	});
});

describe("IfcAddress.WR1", () => {
	function address(purpose: string | null, userDefinedPurpose: string | null): EntityInstance {
		const a = create("IfcPostalAddress");
		(a as unknown as { Purpose: string | null }).Purpose = purpose;
		(a as unknown as { UserDefinedPurpose: string | null }).UserDefinedPurpose = userDefinedPurpose;
		return a;
	}

	test("pass: Purpose is unset", () => {
		expectPass("IfcAddress", "WR1", address(null, null));
	});
	test("pass: Purpose is a non-USERDEFINED value", () => {
		expectPass("IfcAddress", "WR1", address("OFFICE", null));
	});
	test("pass: Purpose is USERDEFINED and UserDefinedPurpose is given", () => {
		expectPass("IfcAddress", "WR1", address("USERDEFINED", "Custom"));
	});
	test("fail: Purpose is USERDEFINED but UserDefinedPurpose is missing", () => {
		expectFail("IfcAddress", "WR1", address("USERDEFINED", null));
	});
});

function userDefinedFixture(type: string, predefinedType: string, elementType: string | null): EntityInstance {
	const e = create(type);
	(e as unknown as { PredefinedType: string }).PredefinedType = predefinedType;
	(e as unknown as { ElementType: string | null }).ElementType = elementType;
	return e;
}

describe("IfcAirTerminalBoxType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcAirTerminalBoxType", "WR1", userDefinedFixture("IfcAirTerminalBoxType", "CONSTANTFLOW", null));
		expectPass("IfcAirTerminalBoxType", "WR1", userDefinedFixture("IfcAirTerminalBoxType", "USERDEFINED", "X"));
		expectFail("IfcAirTerminalBoxType", "WR1", userDefinedFixture("IfcAirTerminalBoxType", "USERDEFINED", null));
	});
});

describe("IfcAirTerminalType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcAirTerminalType", "WR1", userDefinedFixture("IfcAirTerminalType", "GRILLE", null));
		expectFail("IfcAirTerminalType", "WR1", userDefinedFixture("IfcAirTerminalType", "USERDEFINED", null));
	});
});

describe("IfcAirToAirHeatRecoveryType.WR1", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcAirToAirHeatRecoveryType",
			"WR1",
			userDefinedFixture("IfcAirToAirHeatRecoveryType", "FIXEDPLATECOUNTERFLOWEXCHANGER", null),
		);
		expectFail(
			"IfcAirToAirHeatRecoveryType",
			"WR1",
			userDefinedFixture("IfcAirToAirHeatRecoveryType", "USERDEFINED", null),
		);
	});
});

describe("IfcAnnotationCurveOccurrence.WR31", () => {
	test("pass: Item unset", () => {
		expectPass("IfcAnnotationCurveOccurrence", "WR31", create("IfcAnnotationCurveOccurrence"));
	});
	test("pass: Item is an IfcCurve", () => {
		const occ = create("IfcAnnotationCurveOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = polyline([point([0, 0])]);
		expectPass("IfcAnnotationCurveOccurrence", "WR31", occ);
	});
	test("fail: Item is not an IfcCurve", () => {
		const occ = create("IfcAnnotationCurveOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = point([0, 0]);
		expectFail("IfcAnnotationCurveOccurrence", "WR31", occ);
	});
});

describe("IfcAnnotationFillAreaOccurrence.WR31", () => {
	test("pass: Item unset", () => {
		expectPass("IfcAnnotationFillAreaOccurrence", "WR31", create("IfcAnnotationFillAreaOccurrence"));
	});
	test("pass: Item is an IfcAnnotationFillArea", () => {
		const occ = create("IfcAnnotationFillAreaOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = create("IfcAnnotationFillArea");
		expectPass("IfcAnnotationFillAreaOccurrence", "WR31", occ);
	});
	test("fail: Item is not an IfcAnnotationFillArea", () => {
		const occ = create("IfcAnnotationFillAreaOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = point([0, 0]);
		expectFail("IfcAnnotationFillAreaOccurrence", "WR31", occ);
	});
});

describe("IfcAnnotationSurface.WR01", () => {
	test("pass: Item is one of the 6 named surface/solid types", () => {
		const surf = create("IfcAnnotationSurface");
		(surf as unknown as { Item: EntityInstance }).Item = create("IfcBlock");
		expectPass("IfcAnnotationSurface", "WR01", surf);
	});
	test("fail: Item is none of the 6 named types", () => {
		const surf = create("IfcAnnotationSurface");
		(surf as unknown as { Item: EntityInstance }).Item = point([0, 0]);
		expectFail("IfcAnnotationSurface", "WR01", surf);
	});
});

describe("IfcAnnotationSurfaceOccurrence.WR31", () => {
	test("pass: Item unset", () => {
		expectPass("IfcAnnotationSurfaceOccurrence", "WR31", create("IfcAnnotationSurfaceOccurrence"));
	});
	test("pass: Item is an IfcSurface", () => {
		const occ = create("IfcAnnotationSurfaceOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = create("IfcPlane");
		expectPass("IfcAnnotationSurfaceOccurrence", "WR31", occ);
	});
	test("fail: Item is none of the 4 named types", () => {
		const occ = create("IfcAnnotationSurfaceOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = point([0, 0]);
		expectFail("IfcAnnotationSurfaceOccurrence", "WR31", occ);
	});
});

describe("IfcAnnotationSymbolOccurrence.WR31", () => {
	test("pass: Item unset", () => {
		expectPass("IfcAnnotationSymbolOccurrence", "WR31", create("IfcAnnotationSymbolOccurrence"));
	});
	test("pass: Item is an IfcDefinedSymbol", () => {
		const occ = create("IfcAnnotationSymbolOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = create("IfcDefinedSymbol");
		expectPass("IfcAnnotationSymbolOccurrence", "WR31", occ);
	});
	test("fail: Item is not an IfcDefinedSymbol", () => {
		const occ = create("IfcAnnotationSymbolOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = point([0, 0]);
		expectFail("IfcAnnotationSymbolOccurrence", "WR31", occ);
	});
});

describe("IfcAnnotationTextOccurrence.WR31", () => {
	test("pass: Item unset", () => {
		expectPass("IfcAnnotationTextOccurrence", "WR31", create("IfcAnnotationTextOccurrence"));
	});
	test("pass: Item is an IfcTextLiteral", () => {
		const occ = create("IfcAnnotationTextOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = create("IfcTextLiteral");
		expectPass("IfcAnnotationTextOccurrence", "WR31", occ);
	});
	test("fail: Item is not an IfcTextLiteral", () => {
		const occ = create("IfcAnnotationTextOccurrence");
		(occ as unknown as { Item: EntityInstance }).Item = point([0, 0]);
		expectFail("IfcAnnotationTextOccurrence", "WR31", occ);
	});
});

describe("IfcAppliedValue.WR1", () => {
	test("pass: AppliedValue is given", () => {
		const v = create("IfcCostValue");
		(v as unknown as { AppliedValue: number }).AppliedValue = 5;
		expectPass("IfcAppliedValue", "WR1", v);
	});

	// **A real, disclosed finding, confirmed empirically**: `ValueOfComponents` is NOT a
	// forward attribute of `IfcAppliedValue` at all (confirmed: absent from
	// `generated/ifc2x3.d.ts`'s own `IfcAppliedValue` interface) -- it is the INVERSE
	// side of `IfcAppliedValueRelationship.ComponentOfTotal`. A never-related instance's
	// own `ValueOfComponents` therefore reads back as an EMPTY ARRAY, not `null` --
	// confirmed directly via a throwaway probe against the built addon -- and
	// `exists([])` is `true` (an empty aggregate is still "given", matching EXPRESS's own
	// `EXISTS()` semantics: "is this attribute present at all", not "is it non-empty").
	// This is not a porting bug: real Python's own SWIG binding represents an empty
	// INVERSE aggregate identically (an empty tuple, not `None`), so `exists(())` is
	// `True` there too -- `IfcAppliedValue_WR1`'s own `exists(AppliedValue) or
	// exists(ValueOfComponents)` is therefore, in BOTH implementations, only ever
	// violated when `AppliedValue` is unset AND the entity has literally never been
	// related via any `IfcAppliedValueRelationship` in a way this port's own inverse
	// read could observe as anything OTHER than an empty array -- which, per the above,
	// still counts as "exists". A genuine failing case is therefore NOT constructible
	// for this rule as written (in either implementation) -- disclosed here rather than
	// asserting a fail case that would misrepresent the rule's real, verified behavior.
	test("pass: an unrelated instance's ValueOfComponents (an INVERSE) reads back as an empty array, which still counts as 'exists' -- see comment above", () => {
		expectPass("IfcAppliedValue", "WR1", create("IfcCostValue"));
	});
});

describe("IfcArbitraryClosedProfileDef.WR1/WR2/WR3", () => {
	function profileWithOuterCurve(outerCurve: EntityInstance): EntityInstance {
		const p = create("IfcArbitraryClosedProfileDef");
		(p as unknown as { OuterCurve: EntityInstance }).OuterCurve = outerCurve;
		return p;
	}

	test("WR1 pass/fail: OuterCurve.Dim must equal 2", () => {
		expectPass("IfcArbitraryClosedProfileDef", "WR1", profileWithOuterCurve(polyline([point([0, 0])])));
		expectFail("IfcArbitraryClosedProfileDef", "WR1", profileWithOuterCurve(polyline([point([0, 0, 0])])));
	});

	test("WR2 pass/fail: OuterCurve must not be an IfcLine", () => {
		expectPass("IfcArbitraryClosedProfileDef", "WR2", profileWithOuterCurve(polyline([point([0, 0])])));
		const line = create("IfcLine");
		(line as unknown as { Pnt: EntityInstance }).Pnt = point([0, 0]);
		expectFail("IfcArbitraryClosedProfileDef", "WR2", profileWithOuterCurve(line));
	});

	test("WR3 pass/fail: OuterCurve must not be an IfcOffsetCurve2D", () => {
		expectPass("IfcArbitraryClosedProfileDef", "WR3", profileWithOuterCurve(polyline([point([0, 0])])));
		const offset = create("IfcOffsetCurve2D");
		expectFail("IfcArbitraryClosedProfileDef", "WR3", profileWithOuterCurve(offset));
	});
});

describe("IfcArbitraryOpenProfileDef.WR11/WR12", () => {
	test("WR11 pass: ProfileType is CURVE", () => {
		const p = create("IfcArbitraryOpenProfileDef");
		(p as unknown as { ProfileType: string }).ProfileType = "CURVE";
		expectPass("IfcArbitraryOpenProfileDef", "WR11", p);
	});
	test("WR11 fail: ProfileType is not CURVE and self is not an IfcCenterLineProfileDef", () => {
		const p = create("IfcArbitraryOpenProfileDef");
		(p as unknown as { ProfileType: string }).ProfileType = "AREA";
		expectFail("IfcArbitraryOpenProfileDef", "WR11", p);
	});

	test("WR12 pass/fail: Curve.Dim must equal 2", () => {
		const pass = create("IfcArbitraryOpenProfileDef");
		(pass as unknown as { Curve: EntityInstance }).Curve = polyline([point([0, 0])]);
		expectPass("IfcArbitraryOpenProfileDef", "WR12", pass);

		const fail = create("IfcArbitraryOpenProfileDef");
		(fail as unknown as { Curve: EntityInstance }).Curve = polyline([point([0, 0, 0])]);
		expectFail("IfcArbitraryOpenProfileDef", "WR12", fail);
	});
});

describe("IfcArbitraryProfileDefWithVoids.WR1/WR2/WR3", () => {
	test("WR1 pass/fail: ProfileType must be AREA", () => {
		const pass = create("IfcArbitraryProfileDefWithVoids");
		(pass as unknown as { ProfileType: string }).ProfileType = "AREA";
		expectPass("IfcArbitraryProfileDefWithVoids", "WR1", pass);

		const fail = create("IfcArbitraryProfileDefWithVoids");
		(fail as unknown as { ProfileType: string }).ProfileType = "CURVE";
		expectFail("IfcArbitraryProfileDefWithVoids", "WR1", fail);
	});

	test("WR2 pass/fail: every InnerCurves member must have Dim == 2", () => {
		const pass = create("IfcArbitraryProfileDefWithVoids");
		(pass as unknown as { InnerCurves: EntityInstance[] }).InnerCurves = [polyline([point([0, 0])])];
		expectPass("IfcArbitraryProfileDefWithVoids", "WR2", pass);

		const fail = create("IfcArbitraryProfileDefWithVoids");
		(fail as unknown as { InnerCurves: EntityInstance[] }).InnerCurves = [polyline([point([0, 0, 0])])];
		expectFail("IfcArbitraryProfileDefWithVoids", "WR2", fail);
	});

	test("WR3 pass/fail: no InnerCurves member may be an IfcLine", () => {
		const pass = create("IfcArbitraryProfileDefWithVoids");
		(pass as unknown as { InnerCurves: EntityInstance[] }).InnerCurves = [polyline([point([0, 0])])];
		expectPass("IfcArbitraryProfileDefWithVoids", "WR3", pass);

		const line = create("IfcLine");
		(line as unknown as { Pnt: EntityInstance }).Pnt = point([0, 0]);
		const fail = create("IfcArbitraryProfileDefWithVoids");
		(fail as unknown as { InnerCurves: EntityInstance[] }).InnerCurves = [line];
		expectFail("IfcArbitraryProfileDefWithVoids", "WR3", fail);
	});
});

describe("IfcAsset.WR1", () => {
	function assetGroupedWith(members: EntityInstance[]): EntityInstance {
		const asset = create("IfcAsset");
		const rel = create("IfcRelAssignsToGroup");
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = members;
		(rel as unknown as { RelatingGroup: EntityInstance }).RelatingGroup = asset;
		return asset;
	}

	test("pass: every grouped member is an IfcElement", () => {
		expectPass("IfcAsset", "WR1", assetGroupedWith([create("IfcBuildingElementProxy")]));
	});
	test("fail: a grouped member is not an IfcElement", () => {
		expectFail("IfcAsset", "WR1", assetGroupedWith([create("IfcCostValue")]));
	});
});

describe("IfcAxis1Placement.WR1/WR2", () => {
	test("WR1 pass: Axis unset", () => {
		expectPass("IfcAxis1Placement", "WR1", create("IfcAxis1Placement"));
	});
	test("WR1 pass/fail: Axis.Dim must equal 3 when given", () => {
		const pass = create("IfcAxis1Placement");
		(pass as unknown as { Axis: EntityInstance }).Axis = direction([0, 0, 1]);
		expectPass("IfcAxis1Placement", "WR1", pass);

		const fail = create("IfcAxis1Placement");
		(fail as unknown as { Axis: EntityInstance }).Axis = direction([0, 1]);
		expectFail("IfcAxis1Placement", "WR1", fail);
	});

	test("WR2 pass/fail: Location.Dim must equal 3", () => {
		const pass = create("IfcAxis1Placement");
		(pass as unknown as { Location: EntityInstance }).Location = point([0, 0, 0]);
		expectPass("IfcAxis1Placement", "WR2", pass);

		const fail = create("IfcAxis1Placement");
		(fail as unknown as { Location: EntityInstance }).Location = point([0, 0]);
		expectFail("IfcAxis1Placement", "WR2", fail);
	});
});

describe("IfcAxis2Placement2D.WR1/WR2", () => {
	test("WR1 pass: RefDirection unset", () => {
		expectPass("IfcAxis2Placement2D", "WR1", create("IfcAxis2Placement2D"));
	});
	test("WR1 pass/fail: RefDirection.Dim must equal 2 when given", () => {
		const pass = create("IfcAxis2Placement2D");
		(pass as unknown as { RefDirection: EntityInstance }).RefDirection = direction([1, 0]);
		expectPass("IfcAxis2Placement2D", "WR1", pass);

		const fail = create("IfcAxis2Placement2D");
		(fail as unknown as { RefDirection: EntityInstance }).RefDirection = direction([1, 0, 0]);
		expectFail("IfcAxis2Placement2D", "WR1", fail);
	});

	test("WR2 pass/fail: Location.Dim must equal 2", () => {
		const pass = create("IfcAxis2Placement2D");
		(pass as unknown as { Location: EntityInstance }).Location = point([0, 0]);
		expectPass("IfcAxis2Placement2D", "WR2", pass);

		const fail = create("IfcAxis2Placement2D");
		(fail as unknown as { Location: EntityInstance }).Location = point([0, 0, 0]);
		expectFail("IfcAxis2Placement2D", "WR2", fail);
	});
});

describe("IfcAxis2Placement3D.WR1-WR5", () => {
	test("WR1 pass/fail: Location.Dim must equal 3", () => {
		const pass = create("IfcAxis2Placement3D");
		(pass as unknown as { Location: EntityInstance }).Location = point([0, 0, 0]);
		expectPass("IfcAxis2Placement3D", "WR1", pass);

		const fail = create("IfcAxis2Placement3D");
		(fail as unknown as { Location: EntityInstance }).Location = point([0, 0]);
		expectFail("IfcAxis2Placement3D", "WR1", fail);
	});

	test("WR2 pass/fail: Axis.Dim must equal 3 when given", () => {
		expectPass("IfcAxis2Placement3D", "WR2", create("IfcAxis2Placement3D"));
		const fail = create("IfcAxis2Placement3D");
		(fail as unknown as { Axis: EntityInstance }).Axis = direction([0, 1]);
		expectFail("IfcAxis2Placement3D", "WR2", fail);
	});

	test("WR3 pass/fail: RefDirection.Dim must equal 3 when given", () => {
		expectPass("IfcAxis2Placement3D", "WR3", create("IfcAxis2Placement3D"));
		const fail = create("IfcAxis2Placement3D");
		(fail as unknown as { RefDirection: EntityInstance }).RefDirection = direction([0, 1]);
		expectFail("IfcAxis2Placement3D", "WR3", fail);
	});

	test("WR4 pass: Axis/RefDirection not given at all", () => {
		expectPass("IfcAxis2Placement3D", "WR4", create("IfcAxis2Placement3D"));
	});
	test("WR4 pass: Axis and RefDirection are not parallel", () => {
		const p = create("IfcAxis2Placement3D");
		(p as unknown as { Axis: EntityInstance }).Axis = direction([0, 0, 1]);
		(p as unknown as { RefDirection: EntityInstance }).RefDirection = direction([1, 0, 0]);
		expectPass("IfcAxis2Placement3D", "WR4", p);
	});
	test("WR4 fail: Axis and RefDirection are parallel (zero cross-product magnitude)", () => {
		const p = create("IfcAxis2Placement3D");
		(p as unknown as { Axis: EntityInstance }).Axis = direction([0, 0, 1]);
		(p as unknown as { RefDirection: EntityInstance }).RefDirection = direction([0, 0, 2]);
		expectFail("IfcAxis2Placement3D", "WR4", p);
	});

	test("WR5 pass: both Axis and RefDirection given", () => {
		const p = create("IfcAxis2Placement3D");
		(p as unknown as { Axis: EntityInstance }).Axis = direction([0, 0, 1]);
		(p as unknown as { RefDirection: EntityInstance }).RefDirection = direction([1, 0, 0]);
		expectPass("IfcAxis2Placement3D", "WR5", p);
	});
	test("WR5 pass: neither Axis nor RefDirection given", () => {
		expectPass("IfcAxis2Placement3D", "WR5", create("IfcAxis2Placement3D"));
	});
	test("WR5 fail: only one of Axis/RefDirection given", () => {
		const p = create("IfcAxis2Placement3D");
		(p as unknown as { Axis: EntityInstance }).Axis = direction([0, 0, 1]);
		expectFail("IfcAxis2Placement3D", "WR5", p);
	});
});

describe("IfcBSplineCurve.WR41", () => {
	function bezier(points: EntityInstance[]): EntityInstance {
		const curve = create("IfcBezierCurve");
		(curve as unknown as { ControlPointsList: EntityInstance[] }).ControlPointsList = points;
		return curve;
	}

	test("pass: every control point shares the first point's Dim", () => {
		expectPass("IfcBSplineCurve", "WR41", bezier([point([0, 0]), point([1, 1])]));
	});
	test("fail: a control point has a different Dim than the first", () => {
		expectFail("IfcBSplineCurve", "WR41", bezier([point([0, 0]), point([1, 1, 1])]));
	});
});

describe("IfcBlobTexture.WR11", () => {
	test("pass/fail", () => {
		const pass = create("IfcBlobTexture");
		(pass as unknown as { RasterFormat: string }).RasterFormat = "PNG";
		expectPass("IfcBlobTexture", "WR11", pass);

		const fail = create("IfcBlobTexture");
		(fail as unknown as { RasterFormat: string }).RasterFormat = "TIFF";
		expectFail("IfcBlobTexture", "WR11", fail);
	});
});

describe("IfcBoilerType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcBoilerType", "WR1", userDefinedFixture("IfcBoilerType", "STEAM", null));
		expectFail("IfcBoilerType", "WR1", userDefinedFixture("IfcBoilerType", "USERDEFINED", null));
	});
});

describe("IfcBooleanClippingResult.WR1/WR2/WR3", () => {
	test("WR1 pass: FirstOperand is an IfcSweptAreaSolid", () => {
		const r = create("IfcBooleanClippingResult");
		(r as unknown as { FirstOperand: EntityInstance }).FirstOperand = create("IfcExtrudedAreaSolid");
		expectPass("IfcBooleanClippingResult", "WR1", r);
	});
	test("WR1 pass: FirstOperand is an IfcBooleanClippingResult", () => {
		const r = create("IfcBooleanClippingResult");
		(r as unknown as { FirstOperand: EntityInstance }).FirstOperand = create("IfcBooleanClippingResult");
		expectPass("IfcBooleanClippingResult", "WR1", r);
	});
	test("WR1 fail: FirstOperand is neither", () => {
		const r = create("IfcBooleanClippingResult");
		(r as unknown as { FirstOperand: EntityInstance }).FirstOperand = create("IfcPlane");
		expectFail("IfcBooleanClippingResult", "WR1", r);
	});

	test("WR2 pass/fail: SecondOperand must be an IfcHalfSpaceSolid", () => {
		const pass = create("IfcBooleanClippingResult");
		(pass as unknown as { SecondOperand: EntityInstance }).SecondOperand = create("IfcHalfSpaceSolid");
		expectPass("IfcBooleanClippingResult", "WR2", pass);

		const fail = create("IfcBooleanClippingResult");
		(fail as unknown as { SecondOperand: EntityInstance }).SecondOperand = create("IfcPlane");
		expectFail("IfcBooleanClippingResult", "WR2", fail);
	});

	test("WR3 pass/fail: Operator must be DIFFERENCE", () => {
		const pass = create("IfcBooleanClippingResult");
		(pass as unknown as { Operator: string }).Operator = "DIFFERENCE";
		expectPass("IfcBooleanClippingResult", "WR3", pass);

		const fail = create("IfcBooleanClippingResult");
		(fail as unknown as { Operator: string }).Operator = "UNION";
		expectFail("IfcBooleanClippingResult", "WR3", fail);
	});
});

describe("IfcBooleanResult.WR1", () => {
	test("pass/fail: FirstOperand.Dim must equal SecondOperand.Dim", () => {
		const pass = create("IfcBooleanResult");
		(pass as unknown as { FirstOperand: EntityInstance }).FirstOperand = create("IfcBlock");
		(pass as unknown as { SecondOperand: EntityInstance }).SecondOperand = create("IfcHalfSpaceSolid");
		expectPass("IfcBooleanResult", "WR1", pass);

		const fail = create("IfcBooleanResult");
		(fail as unknown as { FirstOperand: EntityInstance }).FirstOperand = create("IfcBlock");
		(fail as unknown as { SecondOperand: EntityInstance }).SecondOperand = polyline([point([0, 0])]);
		expectFail("IfcBooleanResult", "WR1", fail);
	});
});

describe("IfcBoxedHalfSpace.WR1", () => {
	test("pass/fail: BaseSurface must not be an IfcCurveBoundedPlane", () => {
		const pass = create("IfcBoxedHalfSpace");
		(pass as unknown as { BaseSurface: EntityInstance }).BaseSurface = create("IfcPlane");
		expectPass("IfcBoxedHalfSpace", "WR1", pass);

		const fail = create("IfcBoxedHalfSpace");
		(fail as unknown as { BaseSurface: EntityInstance }).BaseSurface = create("IfcCurveBoundedPlane");
		expectFail("IfcBoxedHalfSpace", "WR1", fail);
	});
});

describe("IfcBuildingElementProxy.WR1", () => {
	test("pass/fail: Name must be given", () => {
		const pass = create("IfcBuildingElementProxy");
		(pass as unknown as { Name: string }).Name = "Proxy 1";
		expectPass("IfcBuildingElementProxy", "WR1", pass);

		expectFail("IfcBuildingElementProxy", "WR1", create("IfcBuildingElementProxy"));
	});
});

describe("IfcCShapeProfileDef.WR1/WR2/WR3", () => {
	function cShape(fields: Record<string, number | null>): EntityInstance {
		const p = create("IfcCShapeProfileDef");
		for (const [key, value] of Object.entries(fields)) {
			(p as unknown as Record<string, number | null>)[key] = value;
		}
		return p;
	}

	test("WR1 pass/fail: Girth < Depth / 2", () => {
		expectPass("IfcCShapeProfileDef", "WR1", cShape({ Depth: 10, Girth: 4 }));
		expectFail("IfcCShapeProfileDef", "WR1", cShape({ Depth: 10, Girth: 6 }));
	});

	test("WR2 pass: InternalFilletRadius unset", () => {
		expectPass("IfcCShapeProfileDef", "WR2", cShape({ Depth: 10, Width: 10, InternalFilletRadius: null }));
	});
	test("WR2 pass/fail: InternalFilletRadius must be at most half of Width and Depth", () => {
		expectPass("IfcCShapeProfileDef", "WR2", cShape({ Depth: 10, Width: 10, InternalFilletRadius: 4 }));
		expectFail("IfcCShapeProfileDef", "WR2", cShape({ Depth: 10, Width: 10, InternalFilletRadius: 6 }));
	});

	test("WR3 pass/fail: WallThickness must be less than half of Width and Depth", () => {
		expectPass("IfcCShapeProfileDef", "WR3", cShape({ Depth: 10, Width: 10, WallThickness: 4 }));
		expectFail("IfcCShapeProfileDef", "WR3", cShape({ Depth: 10, Width: 10, WallThickness: 6 }));
	});
});

describe("IfcCableCarrierFittingType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcCableCarrierFittingType", "WR1", userDefinedFixture("IfcCableCarrierFittingType", "BEND", null));
		expectFail(
			"IfcCableCarrierFittingType",
			"WR1",
			userDefinedFixture("IfcCableCarrierFittingType", "USERDEFINED", null),
		);
	});
});

describe("IfcCalendarDate.WR21", () => {
	function date(day: number, month: number, year: number): EntityInstance {
		const d = create("IfcCalendarDate");
		(d as unknown as { DayComponent: number }).DayComponent = day;
		(d as unknown as { MonthComponent: number }).MonthComponent = month;
		(d as unknown as { YearComponent: number }).YearComponent = year;
		return d;
	}

	test("pass: an ordinary valid date", () => {
		expectPass("IfcCalendarDate", "WR21", date(15, 6, 2024));
	});
	test("pass: 29 February on a leap year", () => {
		expectPass("IfcCalendarDate", "WR21", date(29, 2, 2024));
	});
	test("fail: 29 February on a non-leap year", () => {
		expectFail("IfcCalendarDate", "WR21", date(29, 2, 2023));
	});
	test("fail: 31 April (April has only 30 days)", () => {
		expectFail("IfcCalendarDate", "WR21", date(31, 4, 2024));
	});
	test("fail: day out of the [1, 31] range entirely", () => {
		expectFail("IfcCalendarDate", "WR21", date(32, 1, 2024));
	});
});

// =============================================================================
// End-to-end wiring: `executeRules(file)` against the REAL registered rules above,
// on a dedicated, freshly-constructed file (never the shared `file`/`create()` used by
// every test above, whose accumulated fixtures -- many deliberately invalid, for the
// per-rule `expectFail` cases -- would otherwise cross-contaminate an end-to-end
// violation count). `/code-review` found that neither this file (which calls `check()`
// directly, bypassing the executor) nor `ruleExecutor.test.ts` (synthetic rules only,
// deliberately isolated from these real 70) proves the full registry -> engine -> real
// rule body wiring actually works together -- this block closes that gap.
// =============================================================================

describe("executeRules -- end-to-end wiring against the real registered IFC2X3 rules", () => {
	test("an entity-scope violation (IfcBuildingElementProxy.WR1, missing Name) is detected", () => {
		const wiringFile = blankFile();
		wiringFile.createEntity("IfcBuildingElementProxy");

		const violations = executeRules(wiringFile);
		expect(violations.some((v) => v.message.includes("IfcBuildingElementProxy.WR1"))).toBe(true);
	});

	test("a type-scope violation (IfcPositiveLengthMeasure.WR1, a non-positive Depth) is detected via the per-instance attribute walk", () => {
		const wiringFile = blankFile();
		const profile = wiringFile.createEntity("IfcCShapeProfileDef");
		// `Depth`/`Girth`/`Width`/`WallThickness` are all declared `IfcPositiveLengthMeasure`
		// -- a negative `Depth` should be caught by the TYPE-scope rule (fired while
		// walking this instance's own forward attributes), not the entity-scope
		// `IfcCShapeProfileDef.WR1`/`WR3` rules (which would themselves also fire here,
		// since they read `Depth` too -- both are legitimately expected).
		(profile as unknown as { Depth: number }).Depth = -5;

		const violations = executeRules(wiringFile);
		expect(violations.some((v) => v.message.includes("IfcPositiveLengthMeasure.WR1"))).toBe(true);
	});

	test("a well-formed instance produces zero violations from any of the 70 registered rules", () => {
		const wiringFile = blankFile();
		const proxy = wiringFile.createEntity("IfcBuildingElementProxy");
		(proxy as unknown as { Name: string }).Name = "A well-formed proxy";

		const violations = executeRules(wiringFile);
		expect(violations).toEqual([]);
	});
});
