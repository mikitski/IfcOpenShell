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
// Phase EX-4 chunk 2: original, hand-rolled coverage for the NEXT 81 WHERE-rule classes
// ported in `src/express/whereRules/ifc2x3.ts` (real source lines 4285-5148), matching
// this file's own established convention exactly (each rule's own `check()` called
// DIRECTLY via `findRule`, not through `executeRules`; every entity built via a
// zero-argument `create()` plus explicit Proxy-assignment of only the attributes the
// rule under test actually reads). Abstract entity types (`IfcConstraint`,
// `IfcExternalReference`, `IfcProperty`, `IfcCartesianTransformationOperator`, ...) are
// constructed directly via `create()` where convenient -- confirmed empirically (a
// throwaway probe against this chunk's own built native addon) that this port does not
// reject constructing an abstract-flagged entity type, so there is no need to hunt for a
// concrete subtype purely to satisfy an abstractness check this port doesn't enforce.
// =============================================================================

function enumFixture(
	type: string,
	enumAttrName: string,
	enumValue: string,
	otherAttrName: string,
	otherValue: string | null,
): EntityInstance {
	const e = create(type);
	(e as unknown as Record<string, unknown>)[enumAttrName] = enumValue;
	(e as unknown as Record<string, unknown>)[otherAttrName] = otherValue;
	return e;
}

describe("IfcCartesianPoint.WR1", () => {
	test("pass: 2 or 3 coordinates", () => {
		expectPass("IfcCartesianPoint", "WR1", point([0, 0]));
		expectPass("IfcCartesianPoint", "WR1", point([0, 0, 0]));
	});
	test("fail: fewer than 2 coordinates", () => {
		expectFail("IfcCartesianPoint", "WR1", point([0]));
	});
});

describe("IfcCartesianTransformationOperator.WR1", () => {
	test("pass: default Scl (Scale unset, DERIVEs to 1.0)", () => {
		expectPass("IfcCartesianTransformationOperator", "WR1", create("IfcCartesianTransformationOperator"));
	});
	test("fail: Scale set to a non-positive value", () => {
		const fail = create("IfcCartesianTransformationOperator");
		(fail as unknown as { Scale: number }).Scale = 0.0;
		expectFail("IfcCartesianTransformationOperator", "WR1", fail);
	});
});

describe("IfcCartesianTransformationOperator2D.WR1/WR2/WR3", () => {
	function cto2D(localOrigin: EntityInstance, axis1?: EntityInstance, axis2?: EntityInstance): EntityInstance {
		const cto = create("IfcCartesianTransformationOperator2D");
		(cto as unknown as { LocalOrigin: EntityInstance }).LocalOrigin = localOrigin;
		if (axis1) (cto as unknown as { Axis1: EntityInstance }).Axis1 = axis1;
		if (axis2) (cto as unknown as { Axis2: EntityInstance }).Axis2 = axis2;
		return cto;
	}

	test("WR1 pass/fail: LocalOrigin.Dim must equal 2", () => {
		expectPass("IfcCartesianTransformationOperator2D", "WR1", cto2D(point([0, 0])));
		expectFail("IfcCartesianTransformationOperator2D", "WR1", cto2D(point([0, 0, 0])));
	});
	test("WR2 pass: Axis1 unset", () => {
		expectPass("IfcCartesianTransformationOperator2D", "WR2", cto2D(point([0, 0])));
	});
	test("WR2 pass/fail: Axis1.Dim must equal 2 when given", () => {
		expectPass("IfcCartesianTransformationOperator2D", "WR2", cto2D(point([0, 0]), direction([1, 0])));
		expectFail("IfcCartesianTransformationOperator2D", "WR2", cto2D(point([0, 0]), direction([1, 0, 0])));
	});
	test("WR3 pass/fail: Axis2.Dim must equal 2 when given", () => {
		expectPass("IfcCartesianTransformationOperator2D", "WR3", cto2D(point([0, 0]), undefined, direction([0, 1])));
		expectFail("IfcCartesianTransformationOperator2D", "WR3", cto2D(point([0, 0]), undefined, direction([0, 1, 0])));
	});
});

describe("IfcCartesianTransformationOperator2DnonUniform.WR1", () => {
	test("pass: default Scl2", () => {
		expectPass(
			"IfcCartesianTransformationOperator2DnonUniform",
			"WR1",
			create("IfcCartesianTransformationOperator2DnonUniform"),
		);
	});
	test("fail: Scale2 set to a non-positive value", () => {
		const fail = create("IfcCartesianTransformationOperator2DnonUniform");
		(fail as unknown as { Scale2: number }).Scale2 = -1.0;
		expectFail("IfcCartesianTransformationOperator2DnonUniform", "WR1", fail);
	});
});

describe("IfcCartesianTransformationOperator3D.WR1/WR2/WR3/WR4", () => {
	function cto3D(
		localOrigin: EntityInstance,
		axis1?: EntityInstance,
		axis2?: EntityInstance,
		axis3?: EntityInstance,
	): EntityInstance {
		const cto = create("IfcCartesianTransformationOperator3D");
		(cto as unknown as { LocalOrigin: EntityInstance }).LocalOrigin = localOrigin;
		if (axis1) (cto as unknown as { Axis1: EntityInstance }).Axis1 = axis1;
		if (axis2) (cto as unknown as { Axis2: EntityInstance }).Axis2 = axis2;
		if (axis3) (cto as unknown as { Axis3: EntityInstance }).Axis3 = axis3;
		return cto;
	}

	test("WR1 pass/fail: LocalOrigin.Dim must equal 3", () => {
		expectPass("IfcCartesianTransformationOperator3D", "WR1", cto3D(point([0, 0, 0])));
		expectFail("IfcCartesianTransformationOperator3D", "WR1", cto3D(point([0, 0])));
	});
	test("WR2 pass/fail: Axis1.Dim must equal 3 when given", () => {
		expectPass("IfcCartesianTransformationOperator3D", "WR2", cto3D(point([0, 0, 0]), direction([1, 0, 0])));
		expectFail("IfcCartesianTransformationOperator3D", "WR2", cto3D(point([0, 0, 0]), direction([1, 0])));
	});
	test("WR3 pass/fail: Axis2.Dim must equal 3 when given", () => {
		expectPass("IfcCartesianTransformationOperator3D", "WR3", cto3D(point([0, 0, 0]), undefined, direction([0, 1, 0])));
		expectFail("IfcCartesianTransformationOperator3D", "WR3", cto3D(point([0, 0, 0]), undefined, direction([0, 1])));
	});
	test("WR4 pass/fail: Axis3.Dim must equal 3 when given", () => {
		expectPass(
			"IfcCartesianTransformationOperator3D",
			"WR4",
			cto3D(point([0, 0, 0]), undefined, undefined, direction([0, 0, 1])),
		);
		expectFail(
			"IfcCartesianTransformationOperator3D",
			"WR4",
			cto3D(point([0, 0, 0]), undefined, undefined, direction([0, 0])),
		);
	});
});

describe("IfcCartesianTransformationOperator3DnonUniform.WR1/WR2", () => {
	test("WR1 pass/fail: Scale2 must be positive", () => {
		expectPass(
			"IfcCartesianTransformationOperator3DnonUniform",
			"WR1",
			create("IfcCartesianTransformationOperator3DnonUniform"),
		);
		const fail = create("IfcCartesianTransformationOperator3DnonUniform");
		(fail as unknown as { Scale2: number }).Scale2 = -1.0;
		expectFail("IfcCartesianTransformationOperator3DnonUniform", "WR1", fail);
	});
	test("WR2 pass/fail: Scale3 must be positive", () => {
		expectPass(
			"IfcCartesianTransformationOperator3DnonUniform",
			"WR2",
			create("IfcCartesianTransformationOperator3DnonUniform"),
		);
		const fail = create("IfcCartesianTransformationOperator3DnonUniform");
		(fail as unknown as { Scale3: number }).Scale3 = -1.0;
		expectFail("IfcCartesianTransformationOperator3DnonUniform", "WR2", fail);
	});
});

describe("IfcChillerType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcChillerType", "WR1", userDefinedFixture("IfcChillerType", "AIRCOOLED", null));
		expectPass("IfcChillerType", "WR1", userDefinedFixture("IfcChillerType", "USERDEFINED", "X"));
		expectFail("IfcChillerType", "WR1", userDefinedFixture("IfcChillerType", "USERDEFINED", null));
	});
});

describe("IfcCircleHollowProfileDef.WR1", () => {
	function fixture(wallThickness: number, radius: number): EntityInstance {
		const p = create("IfcCircleHollowProfileDef");
		(p as unknown as { WallThickness: number }).WallThickness = wallThickness;
		(p as unknown as { Radius: number }).Radius = radius;
		return p;
	}
	test("pass/fail: WallThickness must be less than Radius", () => {
		expectPass("IfcCircleHollowProfileDef", "WR1", fixture(2, 10));
		expectFail("IfcCircleHollowProfileDef", "WR1", fixture(10, 10));
	});
});

describe("IfcCoilType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcCoilType", "WR1", userDefinedFixture("IfcCoilType", "DXCOOLINGCOIL", null));
		expectFail("IfcCoilType", "WR1", userDefinedFixture("IfcCoilType", "USERDEFINED", null));
	});
});

describe("IfcComplexProperty.WR21/WR22", () => {
	function namedProperty(name: string): EntityInstance {
		const p = create("IfcComplexProperty");
		(p as unknown as { Name: string }).Name = name;
		return p;
	}

	test("WR21 pass: HasProperties does not contain self", () => {
		const self = create("IfcComplexProperty");
		(self as unknown as { HasProperties: EntityInstance[] }).HasProperties = [namedProperty("A")];
		expectPass("IfcComplexProperty", "WR21", self);
	});
	test("WR21 fail: HasProperties contains self", () => {
		const self = create("IfcComplexProperty");
		(self as unknown as { HasProperties: EntityInstance[] }).HasProperties = [self];
		expectFail("IfcComplexProperty", "WR21", self);
	});

	test("WR22 pass: unique Name values", () => {
		const self = create("IfcComplexProperty");
		(self as unknown as { HasProperties: EntityInstance[] }).HasProperties = [namedProperty("A"), namedProperty("B")];
		expectPass("IfcComplexProperty", "WR22", self);
	});
	test("WR22 fail: duplicate Name values", () => {
		const self = create("IfcComplexProperty");
		(self as unknown as { HasProperties: EntityInstance[] }).HasProperties = [namedProperty("A"), namedProperty("A")];
		expectFail("IfcComplexProperty", "WR22", self);
	});
});

describe("IfcCompositeCurve.WR41/WR42", () => {
	function segmentWithTransition(transition: string): EntityInstance {
		const seg = create("IfcCompositeCurveSegment");
		(seg as unknown as { Transition: string }).Transition = transition;
		return seg;
	}
	function segmentWithParentCurveDim(coords: number[]): EntityInstance {
		const seg = create("IfcCompositeCurveSegment");
		(seg as unknown as { ParentCurve: EntityInstance }).ParentCurve = polyline([point(coords)]);
		return seg;
	}

	test("WR41 pass: open curve with exactly one DISCONTINUOUS segment (the last)", () => {
		const cc = create("IfcCompositeCurve");
		(cc as unknown as { Segments: EntityInstance[] }).Segments = [
			segmentWithTransition("CONTINUOUS"),
			segmentWithTransition("DISCONTINUOUS"),
		];
		expectPass("IfcCompositeCurve", "WR41", cc);
	});
	test("WR41 pass: closed curve with zero DISCONTINUOUS segments", () => {
		const cc = create("IfcCompositeCurve");
		(cc as unknown as { Segments: EntityInstance[] }).Segments = [
			segmentWithTransition("CONTINUOUS"),
			segmentWithTransition("CONTINUOUS"),
		];
		expectPass("IfcCompositeCurve", "WR41", cc);
	});
	test("WR41 fail: open curve with two DISCONTINUOUS segments", () => {
		const cc = create("IfcCompositeCurve");
		(cc as unknown as { Segments: EntityInstance[] }).Segments = [
			segmentWithTransition("DISCONTINUOUS"),
			segmentWithTransition("DISCONTINUOUS"),
		];
		expectFail("IfcCompositeCurve", "WR41", cc);
	});

	test("WR42 pass: every segment shares the first segment's Dim", () => {
		const cc = create("IfcCompositeCurve");
		(cc as unknown as { Segments: EntityInstance[] }).Segments = [
			segmentWithParentCurveDim([0, 0]),
			segmentWithParentCurveDim([1, 1]),
		];
		expectPass("IfcCompositeCurve", "WR42", cc);
	});
	test("WR42 fail: a segment has a different Dim", () => {
		const cc = create("IfcCompositeCurve");
		(cc as unknown as { Segments: EntityInstance[] }).Segments = [
			segmentWithParentCurveDim([0, 0]),
			segmentWithParentCurveDim([1, 1, 1]),
		];
		expectFail("IfcCompositeCurve", "WR42", cc);
	});
});

describe("IfcCompositeCurveSegment.WR1", () => {
	test("pass/fail: ParentCurve must be an IfcBoundedCurve", () => {
		const pass = create("IfcCompositeCurveSegment");
		(pass as unknown as { ParentCurve: EntityInstance }).ParentCurve = polyline([point([0, 0])]);
		expectPass("IfcCompositeCurveSegment", "WR1", pass);

		const fail = create("IfcCompositeCurveSegment");
		(fail as unknown as { ParentCurve: EntityInstance }).ParentCurve = create("IfcLine");
		expectFail("IfcCompositeCurveSegment", "WR1", fail);
	});
});

describe("IfcCompositeProfileDef.WR1/WR2", () => {
	function profileWithType(profileType: string): EntityInstance {
		const p = create("IfcArbitraryClosedProfileDef");
		(p as unknown as { ProfileType: string }).ProfileType = profileType;
		return p;
	}

	test("WR1 pass: every profile shares the first profile's ProfileType", () => {
		const cp = create("IfcCompositeProfileDef");
		(cp as unknown as { Profiles: EntityInstance[] }).Profiles = [profileWithType("AREA"), profileWithType("AREA")];
		expectPass("IfcCompositeProfileDef", "WR1", cp);
	});
	test("WR1 fail: a profile has a different ProfileType", () => {
		const cp = create("IfcCompositeProfileDef");
		(cp as unknown as { Profiles: EntityInstance[] }).Profiles = [profileWithType("AREA"), profileWithType("CURVE")];
		expectFail("IfcCompositeProfileDef", "WR1", cp);
	});

	test("WR2 pass: no nested IfcCompositeProfileDef", () => {
		const cp = create("IfcCompositeProfileDef");
		(cp as unknown as { Profiles: EntityInstance[] }).Profiles = [profileWithType("AREA")];
		expectPass("IfcCompositeProfileDef", "WR2", cp);
	});
	test("WR2 fail: a Profiles member is itself an IfcCompositeProfileDef", () => {
		const cp = create("IfcCompositeProfileDef");
		(cp as unknown as { Profiles: EntityInstance[] }).Profiles = [create("IfcCompositeProfileDef")];
		expectFail("IfcCompositeProfileDef", "WR2", cp);
	});
});

describe("IfcCompressorType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcCompressorType", "WR1", userDefinedFixture("IfcCompressorType", "DYNAMIC", null));
		expectFail("IfcCompressorType", "WR1", userDefinedFixture("IfcCompressorType", "USERDEFINED", null));
	});
});

describe("IfcCondenserType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcCondenserType", "WR1", userDefinedFixture("IfcCondenserType", "AIRCOOLED", null));
		expectFail("IfcCondenserType", "WR1", userDefinedFixture("IfcCondenserType", "USERDEFINED", null));
	});
});

describe("IfcConditionCriterion.WR1", () => {
	test("pass/fail: Name must be given", () => {
		const pass = create("IfcConditionCriterion");
		(pass as unknown as { Name: string }).Name = "Criterion";
		expectPass("IfcConditionCriterion", "WR1", pass);
		expectFail("IfcConditionCriterion", "WR1", create("IfcConditionCriterion"));
	});
});

describe("IfcConstraint.WR11", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcConstraint",
			"WR11",
			enumFixture("IfcConstraint", "ConstraintGrade", "SOFT", "UserDefinedGrade", null),
		);
		expectPass(
			"IfcConstraint",
			"WR11",
			enumFixture("IfcConstraint", "ConstraintGrade", "USERDEFINED", "UserDefinedGrade", "X"),
		);
		expectFail(
			"IfcConstraint",
			"WR11",
			enumFixture("IfcConstraint", "ConstraintGrade", "USERDEFINED", "UserDefinedGrade", null),
		);
	});
});

describe("IfcConstraintAggregationRelationship.WR11 / IfcConstraintRelationship.WR11", () => {
	// `settings.compareInstancesByValue` is toggled `true` for this whole test file (see
	// `beforeAll` above), so `triEq`/`.equals()` compares two `IfcConstraint` instances
	// STRUCTURALLY, not by identity -- two otherwise-blank `IfcConstraint`s would compare
	// EQUAL even though they are distinct instances. `relating`/`other` are therefore
	// given distinct `ConstraintGrade` values here specifically so the "not the same
	// constraint" pass case is genuinely, structurally distinguishable.
	test("pass: RelatedConstraints does not contain RelatingConstraint", () => {
		const relating = enumFixture("IfcConstraint", "ConstraintGrade", "HARD", "UserDefinedGrade", null);
		const other = enumFixture("IfcConstraint", "ConstraintGrade", "SOFT", "UserDefinedGrade", null);

		const car = create("IfcConstraintAggregationRelationship");
		(car as unknown as { RelatingConstraint: EntityInstance }).RelatingConstraint = relating;
		(car as unknown as { RelatedConstraints: EntityInstance[] }).RelatedConstraints = [other];
		expectPass("IfcConstraintAggregationRelationship", "WR11", car);

		const cr = create("IfcConstraintRelationship");
		(cr as unknown as { RelatingConstraint: EntityInstance }).RelatingConstraint = relating;
		(cr as unknown as { RelatedConstraints: EntityInstance[] }).RelatedConstraints = [other];
		expectPass("IfcConstraintRelationship", "WR11", cr);
	});
	test("fail: RelatedConstraints contains RelatingConstraint", () => {
		const relating = create("IfcConstraint");

		const car = create("IfcConstraintAggregationRelationship");
		(car as unknown as { RelatingConstraint: EntityInstance }).RelatingConstraint = relating;
		(car as unknown as { RelatedConstraints: EntityInstance[] }).RelatedConstraints = [relating];
		expectFail("IfcConstraintAggregationRelationship", "WR11", car);

		const cr = create("IfcConstraintRelationship");
		(cr as unknown as { RelatingConstraint: EntityInstance }).RelatingConstraint = relating;
		(cr as unknown as { RelatedConstraints: EntityInstance[] }).RelatedConstraints = [relating];
		expectFail("IfcConstraintRelationship", "WR11", cr);
	});
});

describe("IfcConstructionMaterialResource.WR1/WR2 / IfcConstructionProductResource.WR1/WR2", () => {
	// `ResourceOf` is an INVERSE attribute (confirmed via `entity_type.all_inverse_
	// attributes()` against this port's own native schema introspection, not assumed) --
	// it cannot be assigned directly (this port's `.set()` throws "has no attribute" for
	// an inverse name, matching real Python's own forward/inverse distinction). To
	// populate it, a real `IfcRelAssignsToResource` relationship is created with its own
	// `RelatingResource` forward attribute pointing at the resource; `ResourceOf` then
	// reflects it automatically as the computed inverse.
	function relationship(resource: EntityInstance, relatedObjectsType: string | null): EntityInstance {
		const rel = create("IfcRelAssignsToResource");
		(rel as unknown as { RelatingResource: EntityInstance }).RelatingResource = resource;
		if (relatedObjectsType !== null) {
			(rel as unknown as { RelatedObjectsType: string }).RelatedObjectsType = relatedObjectsType;
		}
		return rel;
	}

	test("WR1 pass: ResourceOf has zero or one relationship", () => {
		expectPass("IfcConstructionMaterialResource", "WR1", create("IfcConstructionMaterialResource"));
		expectPass("IfcConstructionProductResource", "WR1", create("IfcConstructionProductResource"));

		const matResource = create("IfcConstructionMaterialResource");
		relationship(matResource, null);
		expectPass("IfcConstructionMaterialResource", "WR1", matResource);
	});
	test("WR1 fail: ResourceOf has more than one relationship", () => {
		const matResource = create("IfcConstructionMaterialResource");
		relationship(matResource, null);
		relationship(matResource, null);
		expectFail("IfcConstructionMaterialResource", "WR1", matResource);
	});

	test("WR2 pass: ResourceOf empty", () => {
		expectPass("IfcConstructionMaterialResource", "WR2", create("IfcConstructionMaterialResource"));
		expectPass("IfcConstructionProductResource", "WR2", create("IfcConstructionProductResource"));
	});
	test("WR2 pass: ResourceOf's first relationship has RelatedObjectsType PRODUCT", () => {
		const matResource = create("IfcConstructionMaterialResource");
		relationship(matResource, "PRODUCT");
		expectPass("IfcConstructionMaterialResource", "WR2", matResource);
	});
	test("WR2 fail: ResourceOf's first relationship has a different RelatedObjectsType", () => {
		const matResource = create("IfcConstructionMaterialResource");
		relationship(matResource, "PROCESS");
		expectFail("IfcConstructionMaterialResource", "WR2", matResource);

		const prodResource = create("IfcConstructionProductResource");
		relationship(prodResource, "PROCESS");
		expectFail("IfcConstructionProductResource", "WR2", prodResource);
	});
});

describe("IfcCooledBeamType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcCooledBeamType", "WR1", userDefinedFixture("IfcCooledBeamType", "ACTIVE", null));
		expectFail("IfcCooledBeamType", "WR1", userDefinedFixture("IfcCooledBeamType", "USERDEFINED", null));
	});
});

describe("IfcCoolingTowerType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcCoolingTowerType", "WR1", userDefinedFixture("IfcCoolingTowerType", "NATURALDRAFT", null));
		expectFail("IfcCoolingTowerType", "WR1", userDefinedFixture("IfcCoolingTowerType", "USERDEFINED", null));
	});
});

describe("IfcCovering.WR61", () => {
	function covering(predefinedType: string | null, objectType: string | null): EntityInstance {
		const c = create("IfcCovering");
		(c as unknown as { PredefinedType: string | null }).PredefinedType = predefinedType;
		(c as unknown as { ObjectType: string | null }).ObjectType = objectType;
		return c;
	}
	test("pass: PredefinedType unset", () => {
		expectPass("IfcCovering", "WR61", covering(null, null));
	});
	test("pass: PredefinedType is not USERDEFINED", () => {
		expectPass("IfcCovering", "WR61", covering("CEILING", null));
	});
	test("pass: PredefinedType is USERDEFINED and ObjectType is given", () => {
		expectPass("IfcCovering", "WR61", covering("USERDEFINED", "Custom"));
	});
	test("fail: PredefinedType is USERDEFINED but ObjectType is missing", () => {
		expectFail("IfcCovering", "WR61", covering("USERDEFINED", null));
	});
});

describe("IfcCurveStyle.WR11", () => {
	function styleWithCurveWidth(curveWidth: EntityInstance | null): EntityInstance {
		const style = create("IfcCurveStyle");
		(style as unknown as { CurveWidth: EntityInstance | null }).CurveWidth = curveWidth;
		return style;
	}
	// `CurveWidth`'s declared type is `IfcSizeSelect`, a SELECT of two DEFINED (non-entity)
	// types -- real Python (and this port, confirmed empirically, see `whereRules/
	// ifc2x3.ts`'s own chunk 2 header comment) requires an explicit, pre-wrapped
	// standalone `entity_instance` here, not a bare JS primitive.
	function lengthMeasure(value: number): EntityInstance {
		return file.createEntity("IfcPositiveLengthMeasure", value as unknown as never);
	}
	function descriptiveMeasure(value: string): EntityInstance {
		return file.createEntity("IfcDescriptiveMeasure", value as unknown as never);
	}

	test("pass: CurveWidth unset", () => {
		expectPass("IfcCurveStyle", "WR11", styleWithCurveWidth(null));
	});
	test("pass: CurveWidth is an IfcPositiveLengthMeasure", () => {
		expectPass("IfcCurveStyle", "WR11", styleWithCurveWidth(lengthMeasure(5.0)));
	});
	test("pass: CurveWidth is an IfcDescriptiveMeasure equal to 'by layer'", () => {
		expectPass("IfcCurveStyle", "WR11", styleWithCurveWidth(descriptiveMeasure("by layer")));
	});
	test("fail: CurveWidth is an IfcDescriptiveMeasure not equal to 'by layer'", () => {
		expectFail("IfcCurveStyle", "WR11", styleWithCurveWidth(descriptiveMeasure("solid")));
	});
});

describe("IfcCurveStyleFontPattern.WR01", () => {
	test("pass/fail: VisibleSegmentLength must be at least 0", () => {
		const pass = create("IfcCurveStyleFontPattern");
		(pass as unknown as { VisibleSegmentLength: number }).VisibleSegmentLength = 0;
		expectPass("IfcCurveStyleFontPattern", "WR01", pass);

		const fail = create("IfcCurveStyleFontPattern");
		(fail as unknown as { VisibleSegmentLength: number }).VisibleSegmentLength = -1;
		expectFail("IfcCurveStyleFontPattern", "WR01", fail);
	});
});

describe("IfcDamperType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcDamperType", "WR1", userDefinedFixture("IfcDamperType", "CONTROLDAMPER", null));
		expectFail("IfcDamperType", "WR1", userDefinedFixture("IfcDamperType", "USERDEFINED", null));
	});
});

describe("IfcDerivedProfileDef.WR1", () => {
	function fixture(profileType: string, parentProfileType: string): EntityInstance {
		const parent = create("IfcArbitraryClosedProfileDef");
		(parent as unknown as { ProfileType: string }).ProfileType = parentProfileType;
		const d = create("IfcDerivedProfileDef");
		(d as unknown as { ProfileType: string }).ProfileType = profileType;
		(d as unknown as { ParentProfile: EntityInstance }).ParentProfile = parent;
		return d;
	}
	test("pass/fail: ProfileType must equal ParentProfile.ProfileType", () => {
		expectPass("IfcDerivedProfileDef", "WR1", fixture("AREA", "AREA"));
		expectFail("IfcDerivedProfileDef", "WR1", fixture("AREA", "CURVE"));
	});
});

describe("IfcDerivedUnit.WR1/WR2", () => {
	function derivedUnitElement(exponent: number): EntityInstance {
		const e = create("IfcDerivedUnitElement");
		(e as unknown as { Exponent: number }).Exponent = exponent;
		return e;
	}

	test("WR1 pass: more than one Element", () => {
		const du = create("IfcDerivedUnit");
		(du as unknown as { Elements: EntityInstance[] }).Elements = [derivedUnitElement(1), derivedUnitElement(1)];
		expectPass("IfcDerivedUnit", "WR1", du);
	});
	test("WR1 pass: exactly one Element whose Exponent is not 1", () => {
		const du = create("IfcDerivedUnit");
		(du as unknown as { Elements: EntityInstance[] }).Elements = [derivedUnitElement(2)];
		expectPass("IfcDerivedUnit", "WR1", du);
	});
	test("WR1 fail: exactly one Element whose Exponent is 1", () => {
		const du = create("IfcDerivedUnit");
		(du as unknown as { Elements: EntityInstance[] }).Elements = [derivedUnitElement(1)];
		expectFail("IfcDerivedUnit", "WR1", du);
	});

	test("WR2 pass/fail", () => {
		expectPass(
			"IfcDerivedUnit",
			"WR2",
			enumFixture("IfcDerivedUnit", "UnitType", "MASSDENSITYUNIT", "UserDefinedType", null),
		);
		expectFail(
			"IfcDerivedUnit",
			"WR2",
			enumFixture("IfcDerivedUnit", "UnitType", "USERDEFINED", "UserDefinedType", null),
		);
	});
});

describe("IfcDimensionCalloutRelationship.WR11/WR12/WR13", () => {
	function dimensionEntity(type: string): EntityInstance {
		return create(type);
	}

	test("WR11 pass/fail: Name must be 'primary' or 'secondary'", () => {
		const pass = create("IfcDimensionCalloutRelationship");
		(pass as unknown as { Name: string }).Name = "Primary";
		expectPass("IfcDimensionCalloutRelationship", "WR11", pass);

		const fail = create("IfcDimensionCalloutRelationship");
		(fail as unknown as { Name: string }).Name = "tertiary";
		expectFail("IfcDimensionCalloutRelationship", "WR11", fail);
	});

	test("WR12 pass/fail: RelatingDraughtingCallout must be exactly one dimension type", () => {
		const pass = create("IfcDimensionCalloutRelationship");
		(pass as unknown as { RelatingDraughtingCallout: EntityInstance }).RelatingDraughtingCallout =
			dimensionEntity("IfcLinearDimension");
		expectPass("IfcDimensionCalloutRelationship", "WR12", pass);

		const fail = create("IfcDimensionCalloutRelationship");
		(fail as unknown as { RelatingDraughtingCallout: EntityInstance }).RelatingDraughtingCallout =
			dimensionEntity("IfcDraughtingCallout");
		expectFail("IfcDimensionCalloutRelationship", "WR12", fail);
	});

	// `IfcAngularDimension`/`IfcDiameterDimension`/`IfcLinearDimension`/`IfcRadiusDimension`
	// are all themselves SUBTYPES of `IfcDimensionCurveDirectedCallout` (confirmed via
	// this port's own native schema introspection) -- so a plain `IfcDraughtingCallout`
	// (their common, unrelated ancestor, not itself a directed callout) is the correct
	// PASSING fixture here, and any of the 4 concrete dimension types (or the base
	// `IfcDimensionCurveDirectedCallout` itself) is a genuine FAILING one.
	test("WR13 pass/fail: RelatedDraughtingCallout must not be an IfcDimensionCurveDirectedCallout", () => {
		const pass = create("IfcDimensionCalloutRelationship");
		(pass as unknown as { RelatedDraughtingCallout: EntityInstance }).RelatedDraughtingCallout =
			dimensionEntity("IfcDraughtingCallout");
		expectPass("IfcDimensionCalloutRelationship", "WR13", pass);

		const fail = create("IfcDimensionCalloutRelationship");
		(fail as unknown as { RelatedDraughtingCallout: EntityInstance }).RelatedDraughtingCallout =
			dimensionEntity("IfcLinearDimension");
		expectFail("IfcDimensionCalloutRelationship", "WR13", fail);
	});
});

describe("IfcDimensionCurve.WR51/WR52/WR53", () => {
	test("WR51 pass: used in an IfcDraughtingCallout.Contents", () => {
		const dimCurve = create("IfcDimensionCurve");
		const callout = create("IfcDraughtingCallout");
		(callout as unknown as { Contents: EntityInstance[] }).Contents = [dimCurve];
		expectPass("IfcDimensionCurve", "WR51", dimCurve);
	});
	test("WR51 fail: not used anywhere", () => {
		expectFail("IfcDimensionCurve", "WR51", create("IfcDimensionCurve"));
	});

	function terminatorWithRole(role: string, annotatedCurve: EntityInstance): EntityInstance {
		const term = create("IfcDimensionCurveTerminator");
		(term as unknown as { Role: string }).Role = role;
		(term as unknown as { AnnotatedCurve: EntityInstance }).AnnotatedCurve = annotatedCurve;
		return term;
	}

	test("WR52 pass: at most one ORIGIN and one TARGET terminator", () => {
		const dimCurve = create("IfcDimensionCurve");
		terminatorWithRole("ORIGIN", dimCurve);
		terminatorWithRole("TARGET", dimCurve);
		expectPass("IfcDimensionCurve", "WR52", dimCurve);
	});
	test("WR52 fail: two ORIGIN terminators", () => {
		const dimCurve = create("IfcDimensionCurve");
		terminatorWithRole("ORIGIN", dimCurve);
		terminatorWithRole("ORIGIN", dimCurve);
		expectFail("IfcDimensionCurve", "WR52", dimCurve);
	});

	test("WR53 pass: every AnnotatedBySymbols member is an IfcDimensionCurveTerminator", () => {
		const dimCurve = create("IfcDimensionCurve");
		terminatorWithRole("ORIGIN", dimCurve);
		expectPass("IfcDimensionCurve", "WR53", dimCurve);
	});
	test("WR53 fail: an AnnotatedBySymbols member is not an IfcDimensionCurveTerminator", () => {
		const dimCurve = create("IfcDimensionCurve");
		const notTerminator = create("IfcTerminatorSymbol");
		(notTerminator as unknown as { AnnotatedCurve: EntityInstance }).AnnotatedCurve = dimCurve;
		expectFail("IfcDimensionCurve", "WR53", dimCurve);
	});
});

describe("IfcDimensionCurveDirectedCallout.WR41/WR42", () => {
	test("WR41 pass/fail: Contents must contain exactly one IfcDimensionCurve", () => {
		const pass = create("IfcDimensionCurveDirectedCallout");
		(pass as unknown as { Contents: EntityInstance[] }).Contents = [create("IfcDimensionCurve")];
		expectPass("IfcDimensionCurveDirectedCallout", "WR41", pass);

		const fail = create("IfcDimensionCurveDirectedCallout");
		(fail as unknown as { Contents: EntityInstance[] }).Contents = [];
		expectFail("IfcDimensionCurveDirectedCallout", "WR41", fail);
	});

	// **Confirmed, always-passing dead rule in both real Python and this port** (see
	// `whereRules/ifc2x3.ts`'s own chunk 2 header comment for the full empirical
	// writeup): the real source's own case-sensitive lowercase `'contents'` attribute
	// lookup never resolves, so `Contents` is never actually consulted here -- this test
	// documents that finding directly rather than attempting a doomed failing-case test.
	test("WR42 always passes regardless of Contents (confirmed dead rule, real-source lowercase 'contents' typo never resolves)", () => {
		const manyProjectionCurves = create("IfcDimensionCurveDirectedCallout");
		(manyProjectionCurves as unknown as { Contents: EntityInstance[] }).Contents = [
			create("IfcProjectionCurve"),
			create("IfcProjectionCurve"),
			create("IfcProjectionCurve"),
			create("IfcProjectionCurve"),
		];
		expectPass("IfcDimensionCurveDirectedCallout", "WR42", manyProjectionCurves);
	});
});

describe("IfcDimensionCurveTerminator.WR61", () => {
	test("pass/fail: AnnotatedCurve must be an IfcDimensionCurve", () => {
		const pass = create("IfcDimensionCurveTerminator");
		(pass as unknown as { AnnotatedCurve: EntityInstance }).AnnotatedCurve = create("IfcDimensionCurve");
		expectPass("IfcDimensionCurveTerminator", "WR61", pass);

		const fail = create("IfcDimensionCurveTerminator");
		(fail as unknown as { AnnotatedCurve: EntityInstance }).AnnotatedCurve = polyline([point([0, 0])]);
		expectFail("IfcDimensionCurveTerminator", "WR61", fail);
	});
});

describe("IfcDimensionPair.WR11/WR12/WR13", () => {
	test("WR11 pass/fail: Name must be 'chained' or 'parallel'", () => {
		const pass = create("IfcDimensionPair");
		(pass as unknown as { Name: string }).Name = "Chained";
		expectPass("IfcDimensionPair", "WR11", pass);

		const fail = create("IfcDimensionPair");
		(fail as unknown as { Name: string }).Name = "linked";
		expectFail("IfcDimensionPair", "WR11", fail);
	});

	test("WR12 pass/fail: RelatingDraughtingCallout must be exactly one dimension type", () => {
		const pass = create("IfcDimensionPair");
		(pass as unknown as { RelatingDraughtingCallout: EntityInstance }).RelatingDraughtingCallout =
			create("IfcRadiusDimension");
		expectPass("IfcDimensionPair", "WR12", pass);

		const fail = create("IfcDimensionPair");
		(fail as unknown as { RelatingDraughtingCallout: EntityInstance }).RelatingDraughtingCallout =
			create("IfcDraughtingCallout");
		expectFail("IfcDimensionPair", "WR12", fail);
	});

	test("WR13 pass/fail: RelatedDraughtingCallout must be exactly one dimension type", () => {
		const pass = create("IfcDimensionPair");
		(pass as unknown as { RelatedDraughtingCallout: EntityInstance }).RelatedDraughtingCallout =
			create("IfcDiameterDimension");
		expectPass("IfcDimensionPair", "WR13", pass);

		const fail = create("IfcDimensionPair");
		(fail as unknown as { RelatedDraughtingCallout: EntityInstance }).RelatedDraughtingCallout =
			create("IfcDraughtingCallout");
		expectFail("IfcDimensionPair", "WR13", fail);
	});
});

describe("IfcDocumentElectronicFormat.WR1", () => {
	test("pass/fail: either FileExtension or MimeContentType must be given", () => {
		const pass = create("IfcDocumentElectronicFormat");
		(pass as unknown as { FileExtension: string }).FileExtension = "pdf";
		expectPass("IfcDocumentElectronicFormat", "WR1", pass);
		expectFail("IfcDocumentElectronicFormat", "WR1", create("IfcDocumentElectronicFormat"));
	});
});

describe("IfcDocumentReference.WR1", () => {
	// `ReferenceToDocument` is an INVERSE attribute (of `IfcDocumentInformation.
	// DocumentReferences`, confirmed via this port's own native schema introspection) --
	// populated by setting the FORWARD side on a real `IfcDocumentInformation`, not by
	// direct assignment.
	function withDocument(docRef: EntityInstance): void {
		const doc = create("IfcDocumentInformation");
		(doc as unknown as { DocumentReferences: EntityInstance[] }).DocumentReferences = [docRef];
	}

	test("pass/fail: exactly one of Name/ReferenceToDocument must be given", () => {
		const passName = create("IfcDocumentReference");
		(passName as unknown as { Name: string }).Name = "Ref A";
		expectPass("IfcDocumentReference", "WR1", passName);

		const passDoc = create("IfcDocumentReference");
		withDocument(passDoc);
		expectPass("IfcDocumentReference", "WR1", passDoc);

		expectFail("IfcDocumentReference", "WR1", create("IfcDocumentReference"));

		const failBoth = create("IfcDocumentReference");
		(failBoth as unknown as { Name: string }).Name = "Ref A";
		withDocument(failBoth);
		expectFail("IfcDocumentReference", "WR1", failBoth);
	});
});

describe("IfcDoorLiningProperties.WR31/WR32/WR33/WR34/WR35", () => {
	test("WR31 pass/fail: LiningThickness must not be given without LiningDepth", () => {
		const pass = create("IfcDoorLiningProperties");
		(pass as unknown as { LiningDepth: number }).LiningDepth = 5;
		(pass as unknown as { LiningThickness: number }).LiningThickness = 1;
		expectPass("IfcDoorLiningProperties", "WR31", pass);

		const fail = create("IfcDoorLiningProperties");
		(fail as unknown as { LiningThickness: number }).LiningThickness = 1;
		expectFail("IfcDoorLiningProperties", "WR31", fail);
	});

	test("WR32 pass/fail: ThresholdThickness must not be given without ThresholdDepth", () => {
		const pass = create("IfcDoorLiningProperties");
		(pass as unknown as { ThresholdDepth: number }).ThresholdDepth = 5;
		(pass as unknown as { ThresholdThickness: number }).ThresholdThickness = 1;
		expectPass("IfcDoorLiningProperties", "WR32", pass);

		const fail = create("IfcDoorLiningProperties");
		(fail as unknown as { ThresholdThickness: number }).ThresholdThickness = 1;
		expectFail("IfcDoorLiningProperties", "WR32", fail);
	});

	test("WR33 pass/fail: TransomOffset and TransomThickness must both be given or both omitted", () => {
		expectPass("IfcDoorLiningProperties", "WR33", create("IfcDoorLiningProperties"));

		const passBoth = create("IfcDoorLiningProperties");
		(passBoth as unknown as { TransomOffset: number }).TransomOffset = 2;
		(passBoth as unknown as { TransomThickness: number }).TransomThickness = 1;
		expectPass("IfcDoorLiningProperties", "WR33", passBoth);

		const fail = create("IfcDoorLiningProperties");
		(fail as unknown as { TransomOffset: number }).TransomOffset = 2;
		expectFail("IfcDoorLiningProperties", "WR33", fail);
	});

	test("WR34 pass/fail: CasingDepth and CasingThickness must both be given or both omitted", () => {
		expectPass("IfcDoorLiningProperties", "WR34", create("IfcDoorLiningProperties"));

		const fail = create("IfcDoorLiningProperties");
		(fail as unknown as { CasingThickness: number }).CasingThickness = 1;
		expectFail("IfcDoorLiningProperties", "WR34", fail);
	});

	// `DefinesType` is an INVERSE attribute (of `IfcTypeObject.HasPropertySets`, confirmed
	// via this port's own native schema introspection) -- populated by setting the
	// FORWARD side on a real `IfcDoorStyle` (an `IfcTypeProduct`), not by direct
	// assignment.
	test("WR35 pass/fail: must be associated (via DefinesType) with exactly one IfcDoorStyle", () => {
		const pass = create("IfcDoorLiningProperties");
		const doorStyle = create("IfcDoorStyle");
		(doorStyle as unknown as { HasPropertySets: EntityInstance[] }).HasPropertySets = [pass];
		expectPass("IfcDoorLiningProperties", "WR35", pass);

		expectFail("IfcDoorLiningProperties", "WR35", create("IfcDoorLiningProperties"));
	});
});

describe("IfcDoorPanelProperties.WR31", () => {
	test("pass/fail: must be associated (via DefinesType) with exactly one IfcDoorStyle", () => {
		const pass = create("IfcDoorPanelProperties");
		const doorStyle = create("IfcDoorStyle");
		(doorStyle as unknown as { HasPropertySets: EntityInstance[] }).HasPropertySets = [pass];
		expectPass("IfcDoorPanelProperties", "WR31", pass);

		expectFail("IfcDoorPanelProperties", "WR31", create("IfcDoorPanelProperties"));
	});
});

describe("IfcDraughtingPreDefinedColour.WR31", () => {
	test("pass/fail", () => {
		const pass = create("IfcDraughtingPreDefinedColour");
		(pass as unknown as { Name: string }).Name = "Red";
		expectPass("IfcDraughtingPreDefinedColour", "WR31", pass);

		const fail = create("IfcDraughtingPreDefinedColour");
		(fail as unknown as { Name: string }).Name = "orange";
		expectFail("IfcDraughtingPreDefinedColour", "WR31", fail);
	});
});

describe("IfcDraughtingPreDefinedCurveFont.WR31", () => {
	test("pass/fail", () => {
		const pass = create("IfcDraughtingPreDefinedCurveFont");
		(pass as unknown as { Name: string }).Name = "Dashed";
		expectPass("IfcDraughtingPreDefinedCurveFont", "WR31", pass);

		const fail = create("IfcDraughtingPreDefinedCurveFont");
		(fail as unknown as { Name: string }).Name = "dotted-dash";
		expectFail("IfcDraughtingPreDefinedCurveFont", "WR31", fail);
	});
});

describe("IfcDraughtingPreDefinedTextFont.WR31", () => {
	test("pass/fail", () => {
		const pass = create("IfcDraughtingPreDefinedTextFont");
		(pass as unknown as { Name: string }).Name = "ISO 3098-1 Font A";
		expectPass("IfcDraughtingPreDefinedTextFont", "WR31", pass);

		const fail = create("IfcDraughtingPreDefinedTextFont");
		(fail as unknown as { Name: string }).Name = "Arial";
		expectFail("IfcDraughtingPreDefinedTextFont", "WR31", fail);
	});
});

describe("IfcDuctFittingType.WR2", () => {
	test("pass/fail", () => {
		expectPass("IfcDuctFittingType", "WR2", userDefinedFixture("IfcDuctFittingType", "TRANSITION", null));
		expectFail("IfcDuctFittingType", "WR2", userDefinedFixture("IfcDuctFittingType", "USERDEFINED", null));
	});
});

describe("IfcDuctSegmentType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcDuctSegmentType", "WR1", userDefinedFixture("IfcDuctSegmentType", "RIGIDSEGMENT", null));
		expectFail("IfcDuctSegmentType", "WR1", userDefinedFixture("IfcDuctSegmentType", "USERDEFINED", null));
	});
});

describe("IfcDuctSilencerType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcDuctSilencerType", "WR1", userDefinedFixture("IfcDuctSilencerType", "FLATOVAL", null));
		expectFail("IfcDuctSilencerType", "WR1", userDefinedFixture("IfcDuctSilencerType", "USERDEFINED", null));
	});
});

describe("IfcEdgeLoop.WR1/WR2", () => {
	// `IfcOrientedEdge.EdgeStart`/`EdgeEnd` are DERIVED (from `EdgeElement`'s own
	// `EdgeStart`/`EdgeEnd`, chosen by `Orientation`) -- real Python REJECTS a direct
	// assignment to a DERIVED attribute (`TypeError: ... expecting value of type
	// 'DERIVED'`, confirmed directly against a real ifcopenshell Python install), so the
	// correct fixture sets the underlying `EdgeElement` (a plain `IfcEdge`, whose own
	// `EdgeStart`/`EdgeEnd` ARE genuine forward attributes) and `Orientation: true`
	// (selecting `EdgeElement`'s own `EdgeStart`/`EdgeEnd` unmodified, matching
	// `calc_IfcOrientedEdge_EdgeStart`/`_EdgeEnd`'s own `IfcBooleanChoose` formula).
	function orientedEdge(edgeStart: EntityInstance, edgeEnd: EntityInstance): EntityInstance {
		const edgeElement = create("IfcEdge");
		(edgeElement as unknown as { EdgeStart: EntityInstance }).EdgeStart = edgeStart;
		(edgeElement as unknown as { EdgeEnd: EntityInstance }).EdgeEnd = edgeEnd;
		const edge = create("IfcOrientedEdge");
		(edge as unknown as { EdgeElement: EntityInstance }).EdgeElement = edgeElement;
		(edge as unknown as { Orientation: boolean }).Orientation = true;
		return edge;
	}
	function vertexPoint(coords: number[]): EntityInstance {
		const v = create("IfcVertexPoint");
		(v as unknown as { VertexGeometry: EntityInstance }).VertexGeometry = point(coords);
		return v;
	}

	test("WR1 pass: first edge's EdgeStart equals last edge's EdgeEnd", () => {
		const v1 = vertexPoint([0, 0]);
		const v2 = vertexPoint([1, 0]);
		const loop = create("IfcEdgeLoop");
		(loop as unknown as { EdgeList: EntityInstance[] }).EdgeList = [orientedEdge(v1, v2), orientedEdge(v2, v1)];
		expectPass("IfcEdgeLoop", "WR1", loop);
	});
	test("WR1 fail: first edge's EdgeStart differs from last edge's EdgeEnd", () => {
		const v1 = vertexPoint([0, 0]);
		const v2 = vertexPoint([1, 0]);
		const v3 = vertexPoint([2, 0]);
		const loop = create("IfcEdgeLoop");
		(loop as unknown as { EdgeList: EntityInstance[] }).EdgeList = [orientedEdge(v1, v2), orientedEdge(v2, v3)];
		expectFail("IfcEdgeLoop", "WR1", loop);
	});

	test("WR2 pass: consecutive edges are head-to-tail connected", () => {
		const v1 = vertexPoint([0, 0]);
		const v2 = vertexPoint([1, 0]);
		const v3 = vertexPoint([2, 0]);
		const loop = create("IfcEdgeLoop");
		(loop as unknown as { EdgeList: EntityInstance[] }).EdgeList = [
			orientedEdge(v1, v2),
			orientedEdge(v2, v3),
			orientedEdge(v3, v1),
		];
		expectPass("IfcEdgeLoop", "WR2", loop);
	});
	test("WR2 fail: a break in the head-to-tail chain", () => {
		const v1 = vertexPoint([0, 0]);
		const v2 = vertexPoint([1, 0]);
		const v3 = vertexPoint([2, 0]);
		const v4 = vertexPoint([3, 0]);
		const loop = create("IfcEdgeLoop");
		(loop as unknown as { EdgeList: EntityInstance[] }).EdgeList = [orientedEdge(v1, v2), orientedEdge(v3, v4)];
		expectFail("IfcEdgeLoop", "WR2", loop);
	});
});

describe("IfcElectricDistributionPoint.WR31", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcElectricDistributionPoint",
			"WR31",
			enumFixture(
				"IfcElectricDistributionPoint",
				"DistributionPointFunction",
				"CONSUMERUNIT",
				"UserDefinedFunction",
				null,
			),
		);
		expectFail(
			"IfcElectricDistributionPoint",
			"WR31",
			enumFixture(
				"IfcElectricDistributionPoint",
				"DistributionPointFunction",
				"USERDEFINED",
				"UserDefinedFunction",
				null,
			),
		);
	});
});

describe("IfcElementAssembly.WR1", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcElementAssembly",
			"WR1",
			enumFixture("IfcElementAssembly", "PredefinedType", "ACCESSORY_ASSEMBLY", "ObjectType", null),
		);
		expectFail(
			"IfcElementAssembly",
			"WR1",
			enumFixture("IfcElementAssembly", "PredefinedType", "USERDEFINED", "ObjectType", null),
		);
	});
});

describe("IfcEnvironmentalImpactValue.WR1", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcEnvironmentalImpactValue",
			"WR1",
			enumFixture("IfcEnvironmentalImpactValue", "Category", "DISPOSAL", "UserDefinedCategory", null),
		);
		expectFail(
			"IfcEnvironmentalImpactValue",
			"WR1",
			enumFixture("IfcEnvironmentalImpactValue", "Category", "USERDEFINED", "UserDefinedCategory", null),
		);
	});
});

describe("IfcEvaporativeCoolerType.WR1", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcEvaporativeCoolerType",
			"WR1",
			userDefinedFixture("IfcEvaporativeCoolerType", "DIRECTEVAPORATIVEAIRWASHER", null),
		);
		expectFail("IfcEvaporativeCoolerType", "WR1", userDefinedFixture("IfcEvaporativeCoolerType", "USERDEFINED", null));
	});
});

describe("IfcEvaporatorType.WR1", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcEvaporatorType",
			"WR1",
			userDefinedFixture("IfcEvaporatorType", "DIRECTEXPANSIONSHELLANDTUBE", null),
		);
		expectFail("IfcEvaporatorType", "WR1", userDefinedFixture("IfcEvaporatorType", "USERDEFINED", null));
	});
});

describe("IfcExternalReference.WR1", () => {
	test("pass/fail: at least one of ItemReference/Location/Name", () => {
		const pass = create("IfcExternalReference");
		(pass as unknown as { Name: string }).Name = "Ref";
		expectPass("IfcExternalReference", "WR1", pass);
		expectFail("IfcExternalReference", "WR1", create("IfcExternalReference"));
	});
});

describe("IfcExtrudedAreaSolid.WR31", () => {
	test("pass/fail: ExtrudedDirection must not be perpendicular to the global Z axis", () => {
		const pass = create("IfcExtrudedAreaSolid");
		(pass as unknown as { ExtrudedDirection: EntityInstance }).ExtrudedDirection = direction([0, 0, 1]);
		expectPass("IfcExtrudedAreaSolid", "WR31", pass);

		const fail = create("IfcExtrudedAreaSolid");
		(fail as unknown as { ExtrudedDirection: EntityInstance }).ExtrudedDirection = direction([1, 0, 0]);
		expectFail("IfcExtrudedAreaSolid", "WR31", fail);
	});
});

describe("IfcFace.WR1", () => {
	test("pass/fail: Bounds must contain at most one IfcFaceOuterBound", () => {
		const pass = create("IfcFace");
		(pass as unknown as { Bounds: EntityInstance[] }).Bounds = [create("IfcFaceBound"), create("IfcFaceOuterBound")];
		expectPass("IfcFace", "WR1", pass);

		const fail = create("IfcFace");
		(fail as unknown as { Bounds: EntityInstance[] }).Bounds = [
			create("IfcFaceOuterBound"),
			create("IfcFaceOuterBound"),
		];
		expectFail("IfcFace", "WR1", fail);
	});
});

describe("IfcFanType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcFanType", "WR1", userDefinedFixture("IfcFanType", "TUBEAXIAL", null));
		expectFail("IfcFanType", "WR1", userDefinedFixture("IfcFanType", "USERDEFINED", null));
	});
});

describe("IfcFillAreaStyle.WR11/WR12/WR13", () => {
	// **Confirmed, always-passing dead rule in both real Python and this port** (see
	// `whereRules/ifc2x3.ts`'s own chunk 2 header comment for the full empirical
	// writeup): `IfcColour` is a SELECT type, not an entity (confirmed directly against a
	// real ifcopenshell Python install: `schema.declaration_by_name("IfcColour")` is a
	// `select_type`) -- `typeof()` only walks ENTITY supertype chains / `type_declaration`
	// chains, never SELECT membership, so `'ifc2x3.ifccolour' in typeof(style)` is
	// unconditionally `False` for every real `IfcColourRgb`/`IfcColourSpecification`
	// instance, making this rule's own `<= 1` check vacuously true regardless of how many
	// colour-shaped `FillStyles` members are present. This test documents that finding
	// directly (2+ colours still passes) rather than attempting a doomed failing-case test.
	test("WR11 always passes regardless of how many IfcColourRgb members FillStyles has (confirmed dead rule, IfcColour is a SELECT, never matched by typeof())", () => {
		const many = create("IfcFillAreaStyle");
		(many as unknown as { FillStyles: EntityInstance[] }).FillStyles = [
			create("IfcColourRgb"),
			create("IfcColourRgb"),
			create("IfcColourRgb"),
		];
		expectPass("IfcFillAreaStyle", "WR11", many);
	});

	test("WR12 pass/fail: FillStyles must contain at most one IfcExternallyDefinedHatchStyle", () => {
		const pass = create("IfcFillAreaStyle");
		(pass as unknown as { FillStyles: EntityInstance[] }).FillStyles = [create("IfcExternallyDefinedHatchStyle")];
		expectPass("IfcFillAreaStyle", "WR12", pass);

		const fail = create("IfcFillAreaStyle");
		(fail as unknown as { FillStyles: EntityInstance[] }).FillStyles = [
			create("IfcExternallyDefinedHatchStyle"),
			create("IfcExternallyDefinedHatchStyle"),
		];
		expectFail("IfcFillAreaStyle", "WR12", fail);
	});

	test("WR13 pass: a single IfcFillAreaStyleHatching (no conflicting styles)", () => {
		const pass = create("IfcFillAreaStyle");
		(pass as unknown as { FillStyles: EntityInstance[] }).FillStyles = [create("IfcFillAreaStyleHatching")];
		expectPass("IfcFillAreaStyle", "WR13", pass);
	});
	test("WR13 fail: both hatching and tiles present", () => {
		const fail = create("IfcFillAreaStyle");
		(fail as unknown as { FillStyles: EntityInstance[] }).FillStyles = [
			create("IfcFillAreaStyleHatching"),
			create("IfcFillAreaStyleTiles"),
		];
		expectFail("IfcFillAreaStyle", "WR13", fail);
	});
	test("WR13 fail: more than one external style", () => {
		const fail = create("IfcFillAreaStyle");
		(fail as unknown as { FillStyles: EntityInstance[] }).FillStyles = [
			create("IfcExternallyDefinedHatchStyle"),
			create("IfcExternallyDefinedHatchStyle"),
		];
		expectFail("IfcFillAreaStyle", "WR13", fail);
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
