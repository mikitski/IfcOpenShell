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
// Phase EX-4 chunk 3: original, hand-rolled coverage for the NEXT 85 WHERE-rule classes
// ported in `src/express/whereRules/ifc2x3.ts` (real source lines 5149-6051), matching
// this file's own established convention exactly (each rule's own `check()` called
// DIRECTLY via `findRule`, not through `executeRules`; every entity built via a
// zero-argument `create()` plus explicit Proxy-assignment of only the attributes the
// rule under test actually reads). Abstract entity types (`IfcNamedUnit`, `IfcProduct`,
// `IfcActor`, ...) are constructed directly via `create()` where convenient -- same
// already-established, empirically-confirmed precedent as chunk 2.
//
// **INVERSE-attribute fixtures** (`IfcMove.OperatesOn`, `IfcInventory.IsGroupedBy`,
// `IfcObject.IsDefinedBy`, `IfcProcedure.Decomposes`/`IsDecomposedBy`,
// `IfcProject.Decomposes`, `IfcGridAxis.PartOfU`/`PartOfV`/`PartOfW`) are populated the
// same way chunk 1's own `IfcAsset.WR1` fixture already established: construct the real
// FORWARD relationship entity (`IfcRelAssignsToProcess`, `IfcRelAssignsToGroup`,
// `IfcRelDefinesByType`, `IfcRelNests`/`IfcRelAggregates`, `IfcGrid`) and set its own
// forward attributes -- the file's own inverse-index machinery makes the corresponding
// INVERSE attribute readable from there, no direct assignment needed or possible.
// `IfcGridAxis.PartOfU`/`PartOfV`/`PartOfW` were empirically confirmed (a throwaway
// probe against this chunk's own built native addon, discarded after use) to read back
// as an ordinary array (`[]`/`[axis]`), NOT unpacked to a bare object by
// `unpackNonAggregateInverses` -- despite their own `SET [0:1]` cardinality, that
// setting's own unpacking only applies to a strictly-`[1:1]`-cardinality inverse (e.g.
// `IfcAsset.IsGroupedBy`), confirmed empirically rather than assumed from the setting's
// own name alone.
//
// **Wrapped standalone defined-type values** (`IfcPropertyEnumeratedValue.
// EnumerationValues`, `IfcPropertyListValue.ListValues`, `IfcPropertyTableValue.
// DefiningValues`/`DefinedValues`, `IfcPropertyBoundedValue.UpperBoundValue`/
// `LowerBoundValue`) reuse chunk 2's own already-established `IfcCurveStyle.WR11`
// precedent (`file.createEntity("IfcPositiveLengthMeasure", value)`/
// `file.createEntity("IfcDescriptiveMeasure", value)`) via this section's own
// `wrappedLength`/`wrappedText` helpers -- a bare JS primitive would not carry a real
// `.declaration()` for `typeOf()`/`ExpressSet.equals()` to compare.
// =============================================================================

function wrappedLength(value: number): EntityInstance {
	return file.createEntity("IfcPositiveLengthMeasure", value as unknown as never);
}

function wrappedText(value: string): EntityInstance {
	return file.createEntity("IfcDescriptiveMeasure", value as unknown as never);
}

describe("IfcFillAreaStyleHatching.WR21/WR22/WR23", () => {
	test("WR21 pass: StartOfNextHatchLine is an IfcOneDirectionRepeatFactor", () => {
		const h = create("IfcFillAreaStyleHatching");
		const factor = create("IfcOneDirectionRepeatFactor");
		(factor as unknown as { RepeatFactor: EntityInstance }).RepeatFactor = direction([1, 0]);
		(h as unknown as { StartOfNextHatchLine: EntityInstance }).StartOfNextHatchLine = factor;
		expectPass("IfcFillAreaStyleHatching", "WR21", h);
	});
	test("WR21 fail: StartOfNextHatchLine is an IfcTwoDirectionRepeatFactor", () => {
		const h = create("IfcFillAreaStyleHatching");
		(h as unknown as { StartOfNextHatchLine: EntityInstance }).StartOfNextHatchLine =
			create("IfcTwoDirectionRepeatFactor");
		expectFail("IfcFillAreaStyleHatching", "WR21", h);
	});
	test("WR22 pass/fail: PatternStart.Dim must equal 2 when given", () => {
		const pass = create("IfcFillAreaStyleHatching");
		expectPass("IfcFillAreaStyleHatching", "WR22", pass);
		const passSet = create("IfcFillAreaStyleHatching");
		(passSet as unknown as { PatternStart: EntityInstance }).PatternStart = point([0, 0]);
		expectPass("IfcFillAreaStyleHatching", "WR22", passSet);
		const fail = create("IfcFillAreaStyleHatching");
		(fail as unknown as { PatternStart: EntityInstance }).PatternStart = point([0, 0, 0]);
		expectFail("IfcFillAreaStyleHatching", "WR22", fail);
	});
	test("WR23 pass/fail: PointOfReferenceHatchLine.Dim must equal 2 when given", () => {
		const pass = create("IfcFillAreaStyleHatching");
		expectPass("IfcFillAreaStyleHatching", "WR23", pass);
		const fail = create("IfcFillAreaStyleHatching");
		(fail as unknown as { PointOfReferenceHatchLine: EntityInstance }).PointOfReferenceHatchLine = point([0, 0, 0]);
		expectFail("IfcFillAreaStyleHatching", "WR23", fail);
	});
});

describe("IfcFilterType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcFilterType", "WR1", userDefinedFixture("IfcFilterType", "AIRPARTICLEFILTER", null));
		expectFail("IfcFilterType", "WR1", userDefinedFixture("IfcFilterType", "USERDEFINED", null));
	});
});

describe("IfcFlowMeterType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcFlowMeterType", "WR1", userDefinedFixture("IfcFlowMeterType", "ENERGYMETER", null));
		expectFail("IfcFlowMeterType", "WR1", userDefinedFixture("IfcFlowMeterType", "USERDEFINED", null));
	});
});

describe("IfcFooting.WR1", () => {
	test("pass/fail: note ObjectType, not ElementType", () => {
		expectPass("IfcFooting", "WR1", enumFixture("IfcFooting", "PredefinedType", "PAD_FOOTING", "ObjectType", null));
		expectFail("IfcFooting", "WR1", enumFixture("IfcFooting", "PredefinedType", "USERDEFINED", "ObjectType", null));
	});
});

describe("IfcGasTerminalType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcGasTerminalType", "WR1", userDefinedFixture("IfcGasTerminalType", "GASAPPLIANCE", null));
		expectFail("IfcGasTerminalType", "WR1", userDefinedFixture("IfcGasTerminalType", "USERDEFINED", null));
	});
});

describe("IfcGeneralProfileProperties.WR1", () => {
	function profileProps(crossSectionArea: number | null): EntityInstance {
		const p = create("IfcGeneralProfileProperties");
		(p as unknown as { CrossSectionArea: number | null }).CrossSectionArea = crossSectionArea;
		return p;
	}
	test("pass: CrossSectionArea unset", () => {
		expectPass("IfcGeneralProfileProperties", "WR1", profileProps(null));
	});
	test("pass: CrossSectionArea is positive", () => {
		expectPass("IfcGeneralProfileProperties", "WR1", profileProps(1.0));
	});
	test("fail: CrossSectionArea is non-positive", () => {
		expectFail("IfcGeneralProfileProperties", "WR1", profileProps(0.0));
	});
});

describe("IfcGeometricCurveSet.WR1", () => {
	function curveSet(elements: EntityInstance[]): EntityInstance {
		const cs = create("IfcGeometricCurveSet");
		(cs as unknown as { Elements: EntityInstance[] }).Elements = elements;
		return cs;
	}
	test("pass: no Elements member is an IfcSurface", () => {
		expectPass("IfcGeometricCurveSet", "WR1", curveSet([polyline([point([0, 0]), point([1, 1])])]));
	});
	test("fail: an Elements member is an IfcSurface", () => {
		expectFail("IfcGeometricCurveSet", "WR1", curveSet([create("IfcPlane")]));
	});
});

describe("IfcGeometricRepresentationSubContext.WR31/WR32", () => {
	function subContext(parentContext: EntityInstance): EntityInstance {
		const sc = create("IfcGeometricRepresentationSubContext");
		(sc as unknown as { ParentContext: EntityInstance }).ParentContext = parentContext;
		return sc;
	}
	test("WR31 pass: ParentContext is an ordinary IfcGeometricRepresentationContext", () => {
		expectPass("IfcGeometricRepresentationSubContext", "WR31", subContext(create("IfcGeometricRepresentationContext")));
	});
	test("WR31 fail: ParentContext is itself an IfcGeometricRepresentationSubContext", () => {
		expectFail(
			"IfcGeometricRepresentationSubContext",
			"WR31",
			subContext(create("IfcGeometricRepresentationSubContext")),
		);
	});
	test("WR32 pass/fail", () => {
		expectPass(
			"IfcGeometricRepresentationSubContext",
			"WR32",
			enumFixture("IfcGeometricRepresentationSubContext", "TargetView", "MODEL_VIEW", "UserDefinedTargetView", null),
		);
		expectFail(
			"IfcGeometricRepresentationSubContext",
			"WR32",
			enumFixture("IfcGeometricRepresentationSubContext", "TargetView", "USERDEFINED", "UserDefinedTargetView", null),
		);
	});
});

describe("IfcGeometricSet.WR21", () => {
	function geometricSet(elements: EntityInstance[]): EntityInstance {
		const gs = create("IfcGeometricSet");
		(gs as unknown as { Elements: EntityInstance[] }).Elements = elements;
		return gs;
	}
	test("pass: every Elements member shares the first member's Dim", () => {
		expectPass("IfcGeometricSet", "WR21", geometricSet([point([0, 0]), point([1, 1])]));
	});
	test("fail: a later Elements member has a different Dim than the first", () => {
		expectFail("IfcGeometricSet", "WR21", geometricSet([point([0, 0]), point([1, 1, 1])]));
	});
});

describe("IfcGrid.WR41", () => {
	test("pass/fail: ObjectPlacement must be given", () => {
		const withPlacement = create("IfcGrid");
		(withPlacement as unknown as { ObjectPlacement: EntityInstance }).ObjectPlacement = create("IfcLocalPlacement");
		expectPass("IfcGrid", "WR41", withPlacement);
		expectFail("IfcGrid", "WR41", create("IfcGrid"));
	});
});

describe("IfcGridAxis.WR1/WR2", () => {
	function axis2D(): EntityInstance {
		const a = create("IfcGridAxis");
		(a as unknown as { AxisCurve: EntityInstance }).AxisCurve = polyline([point([0, 0]), point([1, 1])]);
		return a;
	}
	test("WR1 pass/fail: AxisCurve.Dim must equal 2", () => {
		expectPass("IfcGridAxis", "WR1", axis2D());
		const a3d = create("IfcGridAxis");
		(a3d as unknown as { AxisCurve: EntityInstance }).AxisCurve = polyline([point([0, 0, 0]), point([1, 1, 1])]);
		expectFail("IfcGridAxis", "WR1", a3d);
	});
	test("WR2 pass: exactly one of PartOfU/PartOfV/PartOfW", () => {
		const a = axis2D();
		const grid = create("IfcGrid");
		(grid as unknown as { UAxes: EntityInstance[] }).UAxes = [a];
		expectPass("IfcGridAxis", "WR2", a);
	});
	test("WR2 fail: none of PartOfU/PartOfV/PartOfW", () => {
		expectFail("IfcGridAxis", "WR2", axis2D());
	});
	test("WR2 fail: more than one of PartOfU/PartOfV/PartOfW (both U and V)", () => {
		const a = axis2D();
		const grid = create("IfcGrid");
		(grid as unknown as { UAxes: EntityInstance[] }).UAxes = [a];
		(grid as unknown as { VAxes: EntityInstance[] }).VAxes = [a];
		expectFail("IfcGridAxis", "WR2", a);
	});
});

describe("IfcHeatExchangerType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcHeatExchangerType", "WR1", userDefinedFixture("IfcHeatExchangerType", "PLATE", null));
		expectFail("IfcHeatExchangerType", "WR1", userDefinedFixture("IfcHeatExchangerType", "USERDEFINED", null));
	});
});

describe("IfcHumidifierType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcHumidifierType", "WR1", userDefinedFixture("IfcHumidifierType", "STEAMINJECTION", null));
		expectFail("IfcHumidifierType", "WR1", userDefinedFixture("IfcHumidifierType", "USERDEFINED", null));
	});
});

describe("IfcIShapeProfileDef.WR1/WR2/WR3", () => {
	function iShape(
		overallWidth: number,
		overallDepth: number,
		webThickness: number,
		flangeThickness: number,
		filletRadius: number | null,
	): EntityInstance {
		const p = create("IfcIShapeProfileDef");
		(p as unknown as { OverallWidth: number }).OverallWidth = overallWidth;
		(p as unknown as { OverallDepth: number }).OverallDepth = overallDepth;
		(p as unknown as { WebThickness: number }).WebThickness = webThickness;
		(p as unknown as { FlangeThickness: number }).FlangeThickness = flangeThickness;
		(p as unknown as { FilletRadius: number | null }).FilletRadius = filletRadius;
		return p;
	}
	test("WR1 pass/fail: FlangeThickness must be less than half of OverallDepth", () => {
		expectPass("IfcIShapeProfileDef", "WR1", iShape(100, 200, 5, 10, null));
		expectFail("IfcIShapeProfileDef", "WR1", iShape(100, 200, 5, 100, null));
	});
	test("WR2 pass/fail: WebThickness must be less than OverallWidth", () => {
		expectPass("IfcIShapeProfileDef", "WR2", iShape(100, 200, 5, 10, null));
		expectFail("IfcIShapeProfileDef", "WR2", iShape(100, 200, 100, 10, null));
	});
	test("WR3 pass: FilletRadius unset", () => {
		expectPass("IfcIShapeProfileDef", "WR3", iShape(100, 200, 5, 10, null));
	});
	test("WR3 pass: FilletRadius within both halves", () => {
		expectPass("IfcIShapeProfileDef", "WR3", iShape(100, 200, 5, 10, 10));
	});
	test("WR3 fail: FilletRadius exceeds half of (OverallWidth - WebThickness)", () => {
		expectFail("IfcIShapeProfileDef", "WR3", iShape(100, 200, 5, 10, 1000));
	});
});

describe("IfcInventory.WR41", () => {
	function groupedWith(inv: EntityInstance, members: EntityInstance[]): void {
		const rel = create("IfcRelAssignsToGroup");
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = members;
		(rel as unknown as { RelatingGroup: EntityInstance }).RelatingGroup = inv;
	}
	test("pass: every grouped member is an IfcSpace/IfcAsset/IfcFurnishingElement", () => {
		const inv = create("IfcInventory");
		groupedWith(inv, [create("IfcSpace")]);
		expectPass("IfcInventory", "WR41", inv);
	});
	test("fail: a grouped member is none of those types", () => {
		const inv = create("IfcInventory");
		groupedWith(inv, [create("IfcBuildingElementProxy")]);
		expectFail("IfcInventory", "WR41", inv);
	});
});

describe("IfcLShapeProfileDef.WR21/WR22", () => {
	function lShape(depth: number, thickness: number, width: number | null): EntityInstance {
		const p = create("IfcLShapeProfileDef");
		(p as unknown as { Depth: number }).Depth = depth;
		(p as unknown as { Thickness: number }).Thickness = thickness;
		(p as unknown as { Width: number | null }).Width = width;
		return p;
	}
	test("WR21 pass/fail: Thickness must be less than Depth", () => {
		expectPass("IfcLShapeProfileDef", "WR21", lShape(100, 5, null));
		expectFail("IfcLShapeProfileDef", "WR21", lShape(100, 100, null));
	});
	test("WR22 pass: Width unset", () => {
		expectPass("IfcLShapeProfileDef", "WR22", lShape(100, 5, null));
	});
	test("WR22 pass: Thickness less than Width", () => {
		expectPass("IfcLShapeProfileDef", "WR22", lShape(100, 5, 50));
	});
	test("WR22 fail: Thickness not less than Width", () => {
		expectFail("IfcLShapeProfileDef", "WR22", lShape(100, 50, 50));
	});
});

describe("IfcLine.WR1", () => {
	function line(pntDim: 2 | 3, dirDim: 2 | 3): EntityInstance {
		const l = create("IfcLine");
		(l as unknown as { Pnt: EntityInstance }).Pnt = point(pntDim === 2 ? [0, 0] : [0, 0, 0]);
		(l as unknown as { Dir: EntityInstance }).Dir = direction(dirDim === 2 ? [1, 0] : [1, 0, 0]);
		return l;
	}
	test("pass/fail: Dir.Dim must equal Pnt.Dim", () => {
		expectPass("IfcLine", "WR1", line(2, 2));
		expectFail("IfcLine", "WR1", line(2, 3));
	});
});

describe("IfcLocalPlacement.WR21", () => {
	function localPlacement(relativePlacement: EntityInstance, placementRelTo: EntityInstance | null): EntityInstance {
		const lp = create("IfcLocalPlacement");
		(lp as unknown as { RelativePlacement: EntityInstance }).RelativePlacement = relativePlacement;
		(lp as unknown as { PlacementRelTo: EntityInstance | null }).PlacementRelTo = placementRelTo;
		return lp;
	}
	function axisPlacement(kind: "2D" | "3D", locationDim: number): EntityInstance {
		const a = create(kind === "2D" ? "IfcAxis2Placement2D" : "IfcAxis2Placement3D");
		(a as unknown as { Location: EntityInstance }).Location = point(new Array(locationDim).fill(0));
		return a;
	}
	test("pass: PlacementRelTo unset", () => {
		expectPass("IfcLocalPlacement", "WR21", localPlacement(axisPlacement("2D", 2), null));
	});
	test("pass: PlacementRelTo is an IfcGridPlacement", () => {
		expectPass("IfcLocalPlacement", "WR21", localPlacement(axisPlacement("3D", 3), create("IfcGridPlacement")));
	});
	test("pass: own RelativePlacement is an IfcAxis2Placement2D (PlacementRelTo's own Dim never checked)", () => {
		const relTo = localPlacement(axisPlacement("3D", 2), null);
		expectPass("IfcLocalPlacement", "WR21", localPlacement(axisPlacement("2D", 2), relTo));
	});
	test("pass: own RelativePlacement is an IfcAxis2Placement3D and PlacementRelTo's own RelativePlacement.Dim == 3", () => {
		const relTo = localPlacement(axisPlacement("3D", 3), null);
		expectPass("IfcLocalPlacement", "WR21", localPlacement(axisPlacement("3D", 3), relTo));
	});
	test("fail: own RelativePlacement is an IfcAxis2Placement3D but PlacementRelTo's own RelativePlacement.Dim != 3", () => {
		const relTo = localPlacement(axisPlacement("3D", 2), null);
		expectFail("IfcLocalPlacement", "WR21", localPlacement(axisPlacement("3D", 3), relTo));
	});
	// Regression test for a real boolean-collapse bug caught in code review:
	// `ifcCorrectLocalPlacement` must return a DEFINITE `false` (not let `triEq`'s own
	// `INDETERMINATE` propagate through unchanged) when PlacementRelTo's own nested
	// `RelativePlacement.Dim` cannot be resolved -- mirroring real Python's own `if
	// (...) == 3: return True else: return False`, which always coerces via `bool()`.
	test("fail: PlacementRelTo's own RelativePlacement.Location is unset (indeterminate Dim) does not vacuously pass", () => {
		const relTo = localPlacement(create("IfcAxis2Placement3D"), null);
		expectFail("IfcLocalPlacement", "WR21", localPlacement(axisPlacement("3D", 3), relTo));
	});
});

describe("IfcLocalTime.WR21", () => {
	function localTime(second: number | null, minute: number | null): EntityInstance {
		const lt = create("IfcLocalTime");
		(lt as unknown as { HourComponent: number }).HourComponent = 12;
		(lt as unknown as { SecondComponent: number | null }).SecondComponent = second;
		(lt as unknown as { MinuteComponent: number | null }).MinuteComponent = minute;
		return lt;
	}
	test("pass: SecondComponent unset", () => {
		expectPass("IfcLocalTime", "WR21", localTime(null, null));
	});
	test("pass: SecondComponent and MinuteComponent both given", () => {
		expectPass("IfcLocalTime", "WR21", localTime(30, 15));
	});
	test("fail: SecondComponent given but MinuteComponent missing", () => {
		expectFail("IfcLocalTime", "WR21", localTime(30, null));
	});
});

describe("IfcMaterialDefinitionRepresentation.WR11", () => {
	function materialRep(representations: EntityInstance[]): EntityInstance {
		const m = create("IfcMaterialDefinitionRepresentation");
		(m as unknown as { Representations: EntityInstance[] }).Representations = representations;
		return m;
	}
	test("pass: every Representations member is an IfcStyledRepresentation", () => {
		expectPass("IfcMaterialDefinitionRepresentation", "WR11", materialRep([create("IfcStyledRepresentation")]));
	});
	test("fail: a Representations member is not an IfcStyledRepresentation", () => {
		expectFail("IfcMaterialDefinitionRepresentation", "WR11", materialRep([create("IfcShapeRepresentation")]));
	});
});

describe("IfcMechanicalMaterialProperties.WR21/WR22", () => {
	function props(youngModulus: number | null, shearModulus: number | null): EntityInstance {
		const p = create("IfcMechanicalMaterialProperties");
		(p as unknown as { YoungModulus: number | null }).YoungModulus = youngModulus;
		(p as unknown as { ShearModulus: number | null }).ShearModulus = shearModulus;
		return p;
	}
	test("WR21 pass/fail: YoungModulus must be >= 0 when given", () => {
		expectPass("IfcMechanicalMaterialProperties", "WR21", props(null, null));
		expectPass("IfcMechanicalMaterialProperties", "WR21", props(0.0, null));
		expectFail("IfcMechanicalMaterialProperties", "WR21", props(-1.0, null));
	});
	test("WR22 pass/fail: ShearModulus must be >= 0 when given", () => {
		expectPass("IfcMechanicalMaterialProperties", "WR22", props(null, null));
		expectPass("IfcMechanicalMaterialProperties", "WR22", props(null, 0.0));
		expectFail("IfcMechanicalMaterialProperties", "WR22", props(null, -1.0));
	});
});

describe("IfcMechanicalSteelMaterialProperties.WR31/WR32/WR33/WR34", () => {
	function steelProps(field: string, value: number | null): EntityInstance {
		const p = create("IfcMechanicalSteelMaterialProperties");
		(p as unknown as Record<string, unknown>)[field] = value;
		return p;
	}
	test("WR31 pass/fail: YieldStress must be >= 0 when given", () => {
		expectPass("IfcMechanicalSteelMaterialProperties", "WR31", steelProps("YieldStress", null));
		expectPass("IfcMechanicalSteelMaterialProperties", "WR31", steelProps("YieldStress", 0.0));
		expectFail("IfcMechanicalSteelMaterialProperties", "WR31", steelProps("YieldStress", -1.0));
	});
	test("WR32 pass/fail: UltimateStress must be >= 0 when given", () => {
		expectPass("IfcMechanicalSteelMaterialProperties", "WR32", steelProps("UltimateStress", null));
		expectFail("IfcMechanicalSteelMaterialProperties", "WR32", steelProps("UltimateStress", -1.0));
	});
	test("WR33 pass/fail: HardeningModule must be >= 0 when given", () => {
		expectPass("IfcMechanicalSteelMaterialProperties", "WR33", steelProps("HardeningModule", null));
		expectFail("IfcMechanicalSteelMaterialProperties", "WR33", steelProps("HardeningModule", -1.0));
	});
	test("WR34 pass/fail: ProportionalStress must be >= 0 when given", () => {
		expectPass("IfcMechanicalSteelMaterialProperties", "WR34", steelProps("ProportionalStress", null));
		expectFail("IfcMechanicalSteelMaterialProperties", "WR34", steelProps("ProportionalStress", -1.0));
	});
});

describe("IfcMove.WR1/WR2/WR3", () => {
	function assignProcess(target: EntityInstance, relatedObjects: EntityInstance[]): void {
		const rel = create("IfcRelAssignsToProcess");
		(rel as unknown as { RelatingProcess: EntityInstance }).RelatingProcess = target;
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = relatedObjects;
	}
	test("WR1 pass/fail: OperatesOn must have at least one member", () => {
		const withRel = create("IfcMove");
		assignProcess(withRel, [create("IfcActor")]);
		expectPass("IfcMove", "WR1", withRel);
		expectFail("IfcMove", "WR1", create("IfcMove"));
	});
	test("WR2 pass: at least one OperatesOn relationship relates an IfcActor/IfcEquipmentElement/IfcFurnishingElement", () => {
		const m = create("IfcMove");
		assignProcess(m, [create("IfcActor")]);
		expectPass("IfcMove", "WR2", m);
	});
	test("WR2 fail: no OperatesOn relationship relates any of those types", () => {
		const m = create("IfcMove");
		assignProcess(m, [create("IfcBuildingElementProxy")]);
		expectFail("IfcMove", "WR2", m);
	});
	test("WR3 pass/fail: Name must be given", () => {
		const withName = create("IfcMove");
		(withName as unknown as { Name: string }).Name = "Move";
		expectPass("IfcMove", "WR3", withName);
		expectFail("IfcMove", "WR3", create("IfcMove"));
	});
});

describe("IfcNamedUnit.WR1", () => {
	function namedUnit(unitType: string, dims: [number, number, number, number, number, number, number]): EntityInstance {
		const u = create("IfcNamedUnit");
		(u as unknown as { UnitType: string }).UnitType = unitType;
		(u as unknown as { Dimensions: EntityInstance }).Dimensions = file.createEntity("IfcDimensionalExponents", ...dims);
		return u;
	}
	test("pass: LENGTHUNIT with matching dimensional exponents", () => {
		expectPass("IfcNamedUnit", "WR1", namedUnit("LENGTHUNIT", [1, 0, 0, 0, 0, 0, 0]));
	});
	test("fail: LENGTHUNIT with mismatched dimensional exponents", () => {
		expectFail("IfcNamedUnit", "WR1", namedUnit("LENGTHUNIT", [0, 0, 0, 0, 0, 0, 0]));
	});
	test("pass: AREAUNIT with matching dimensional exponents", () => {
		expectPass("IfcNamedUnit", "WR1", namedUnit("AREAUNIT", [2, 0, 0, 0, 0, 0, 0]));
	});
	test("pass: an unrecognized UnitType always passes (IfcCorrectDimensions falls through to its own UNKNOWN branch)", () => {
		expectPass("IfcNamedUnit", "WR1", namedUnit("USERDEFINED", [9, 9, 9, 9, 9, 9, 9]));
	});
	// Regression test for a real transcription bug caught in code review:
	// ELECTRICCAPACITANCEUNIT's own real-source exponents (`IFC2X3.py` line 7506) are
	// `(-2, 1, 4, 1, 0, 0, 0)` -- this port's own `UNIT_DIMENSIONAL_EXPONENTS` table
	// briefly had `MassExponent = -1` instead of `+1`, which this exact pass/fail pair
	// would have caught immediately (the "pass" fixture uses the real, spec-correct
	// exponents; the "fail" fixture uses the bug's own wrong value).
	test("pass/fail: ELECTRICCAPACITANCEUNIT dimensional exponents (real transcription bug regression)", () => {
		expectPass("IfcNamedUnit", "WR1", namedUnit("ELECTRICCAPACITANCEUNIT", [-2, 1, 4, 1, 0, 0, 0]));
		expectFail("IfcNamedUnit", "WR1", namedUnit("ELECTRICCAPACITANCEUNIT", [-2, -1, 4, 1, 0, 0, 0]));
	});
	// Regression test for a real boolean-collapse bug caught in code review:
	// `ifcCorrectDimensions` must return a DEFINITE `false` for an indeterminate `dim`
	// (mirroring real Python's own `if dim == X: return True else: return False`,
	// which always coerces via `bool()`), not let `triEq`'s own `INDETERMINATE`
	// propagate through unchanged and vacuously pass.
	test("fail: Dimensions unset (indeterminate) does not vacuously pass", () => {
		const u = create("IfcNamedUnit");
		(u as unknown as { UnitType: string }).UnitType = "LENGTHUNIT";
		expectFail("IfcNamedUnit", "WR1", u);
	});
});

describe("IfcObject.WR1", () => {
	function definedByType(obj: EntityInstance): void {
		const rel = create("IfcRelDefinesByType");
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [obj];
		(rel as unknown as { RelatingType: EntityInstance }).RelatingType = create("IfcTypeObject");
	}
	test("pass: zero IfcRelDefinesByType", () => {
		expectPass("IfcObject", "WR1", create("IfcBuildingElementProxy"));
	});
	test("pass: exactly one IfcRelDefinesByType", () => {
		const obj = create("IfcBuildingElementProxy");
		definedByType(obj);
		expectPass("IfcObject", "WR1", obj);
	});
	test("fail: more than one IfcRelDefinesByType", () => {
		const obj = create("IfcBuildingElementProxy");
		definedByType(obj);
		definedByType(obj);
		expectFail("IfcObject", "WR1", obj);
	});
});

describe("IfcObjective.WR21", () => {
	test("pass/fail", () => {
		expectPass(
			"IfcObjective",
			"WR21",
			enumFixture("IfcObjective", "ObjectiveQualifier", "REQUIREMENT", "UserDefinedQualifier", null),
		);
		expectFail(
			"IfcObjective",
			"WR21",
			enumFixture("IfcObjective", "ObjectiveQualifier", "USERDEFINED", "UserDefinedQualifier", null),
		);
	});
});

describe("IfcOccupant.WR31", () => {
	test("pass/fail: note the distinct literal shape (see whereRules/ifc2x3.ts's own doc comment)", () => {
		expectPass("IfcOccupant", "WR31", enumFixture("IfcOccupant", "PredefinedType", "ASSIGNEE", "ObjectType", null));
		expectPass(
			"IfcOccupant",
			"WR31",
			enumFixture("IfcOccupant", "PredefinedType", "USERDEFINED", "ObjectType", "Custom"),
		);
		expectFail("IfcOccupant", "WR31", enumFixture("IfcOccupant", "PredefinedType", "USERDEFINED", "ObjectType", null));
	});
});

describe("IfcOffsetCurve2D.WR1", () => {
	test("pass/fail: BasisCurve.Dim must equal 2", () => {
		const pass = create("IfcOffsetCurve2D");
		(pass as unknown as { BasisCurve: EntityInstance }).BasisCurve = polyline([point([0, 0]), point([1, 1])]);
		expectPass("IfcOffsetCurve2D", "WR1", pass);
		const fail = create("IfcOffsetCurve2D");
		(fail as unknown as { BasisCurve: EntityInstance }).BasisCurve = polyline([point([0, 0, 0]), point([1, 1, 1])]);
		expectFail("IfcOffsetCurve2D", "WR1", fail);
	});
});

describe("IfcOffsetCurve3D.WR1", () => {
	test("pass/fail: BasisCurve.Dim must equal 3", () => {
		const pass = create("IfcOffsetCurve3D");
		(pass as unknown as { BasisCurve: EntityInstance }).BasisCurve = polyline([point([0, 0, 0]), point([1, 1, 1])]);
		expectPass("IfcOffsetCurve3D", "WR1", pass);
		const fail = create("IfcOffsetCurve3D");
		(fail as unknown as { BasisCurve: EntityInstance }).BasisCurve = polyline([point([0, 0]), point([1, 1])]);
		expectFail("IfcOffsetCurve3D", "WR1", fail);
	});
});

describe("IfcOrientedEdge.WR1", () => {
	function orientedEdge(edgeElement: EntityInstance): EntityInstance {
		const oe = create("IfcOrientedEdge");
		(oe as unknown as { EdgeElement: EntityInstance }).EdgeElement = edgeElement;
		(oe as unknown as { Orientation: boolean }).Orientation = true;
		return oe;
	}
	test("pass: EdgeElement is an ordinary IfcEdge", () => {
		const edge = create("IfcEdge");
		(edge as unknown as { EdgeStart: EntityInstance }).EdgeStart = create("IfcVertex");
		(edge as unknown as { EdgeEnd: EntityInstance }).EdgeEnd = create("IfcVertex");
		expectPass("IfcOrientedEdge", "WR1", orientedEdge(edge));
	});
	test("fail: EdgeElement is itself an IfcOrientedEdge", () => {
		const inner = create("IfcEdge");
		(inner as unknown as { EdgeStart: EntityInstance }).EdgeStart = create("IfcVertex");
		(inner as unknown as { EdgeEnd: EntityInstance }).EdgeEnd = create("IfcVertex");
		expectFail("IfcOrientedEdge", "WR1", orientedEdge(orientedEdge(inner)));
	});
});

describe("IfcPath.WR1", () => {
	// A bare `IfcVertex` has ZERO attributes of its own (`export interface IfcVertex
	// {}`) -- any two distinct `IfcVertex` instances are therefore structurally
	// INDISTINGUISHABLE under `settings.compareInstancesByValue` (genuinely, in real
	// Python too: `entity_instance.__eq__`'s deep comparison has nothing to compare).
	// `IfcVertexPoint` (a concrete subtype carrying a real `VertexGeometry` coordinate)
	// is used instead so the "not connected" fixture's two distinct vertices are
	// actually distinguishable by value.
	function vertexAt(coords: number[]): EntityInstance {
		const v = create("IfcVertexPoint");
		(v as unknown as { VertexGeometry: EntityInstance }).VertexGeometry = point(coords);
		return v;
	}
	function orientedEdge(start: EntityInstance, end: EntityInstance): EntityInstance {
		const edge = create("IfcEdge");
		(edge as unknown as { EdgeStart: EntityInstance }).EdgeStart = start;
		(edge as unknown as { EdgeEnd: EntityInstance }).EdgeEnd = end;
		const oe = create("IfcOrientedEdge");
		(oe as unknown as { EdgeElement: EntityInstance }).EdgeElement = edge;
		(oe as unknown as { Orientation: boolean }).Orientation = true;
		return oe;
	}
	test("pass: EdgeList forms a connected head-to-tail path", () => {
		const a = vertexAt([0, 0, 0]);
		const b = vertexAt([1, 1, 1]);
		const c = vertexAt([2, 2, 2]);
		const path = create("IfcPath");
		(path as unknown as { EdgeList: EntityInstance[] }).EdgeList = [orientedEdge(a, b), orientedEdge(b, c)];
		expectPass("IfcPath", "WR1", path);
	});
	test("fail: EdgeList is not connected head-to-tail", () => {
		const a = vertexAt([0, 0, 0]);
		const b = vertexAt([1, 1, 1]);
		const c = vertexAt([8, 8, 8]);
		const d = vertexAt([9, 9, 9]);
		const path = create("IfcPath");
		(path as unknown as { EdgeList: EntityInstance[] }).EdgeList = [orientedEdge(a, b), orientedEdge(c, d)];
		expectFail("IfcPath", "WR1", path);
	});
});

describe("IfcPerson.WR1", () => {
	function person(familyName: string | null, givenName: string | null): EntityInstance {
		const p = create("IfcPerson");
		(p as unknown as { FamilyName: string | null }).FamilyName = familyName;
		(p as unknown as { GivenName: string | null }).GivenName = givenName;
		return p;
	}
	test("pass: either FamilyName or GivenName is given", () => {
		expectPass("IfcPerson", "WR1", person("Smith", null));
		expectPass("IfcPerson", "WR1", person(null, "Jane"));
	});
	test("fail: neither is given", () => {
		expectFail("IfcPerson", "WR1", person(null, null));
	});
});

describe("IfcPhysicalComplexQuantity.WR21", () => {
	function quantity(name: string): EntityInstance {
		const q = create("IfcPhysicalComplexQuantity");
		(q as unknown as { Name: string }).Name = name;
		return q;
	}
	test("pass: HasQuantities does not contain the instance itself", () => {
		const complex = quantity("Total");
		(complex as unknown as { HasQuantities: EntityInstance[] }).HasQuantities = [quantity("Part")];
		expectPass("IfcPhysicalComplexQuantity", "WR21", complex);
	});
	test("fail: HasQuantities contains the instance itself", () => {
		const complex = quantity("Total");
		(complex as unknown as { HasQuantities: EntityInstance[] }).HasQuantities = [complex];
		expectFail("IfcPhysicalComplexQuantity", "WR21", complex);
	});
});

describe("IfcPile.WR1", () => {
	test("pass/fail: note ObjectType, not ElementType", () => {
		expectPass("IfcPile", "WR1", enumFixture("IfcPile", "PredefinedType", "COHESION", "ObjectType", null));
		expectFail("IfcPile", "WR1", enumFixture("IfcPile", "PredefinedType", "USERDEFINED", "ObjectType", null));
	});
});

describe("IfcPipeFittingType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcPipeFittingType", "WR1", userDefinedFixture("IfcPipeFittingType", "BEND", null));
		expectFail("IfcPipeFittingType", "WR1", userDefinedFixture("IfcPipeFittingType", "USERDEFINED", null));
	});
});

describe("IfcPipeSegmentType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcPipeSegmentType", "WR1", userDefinedFixture("IfcPipeSegmentType", "RIGIDSEGMENT", null));
		expectFail("IfcPipeSegmentType", "WR1", userDefinedFixture("IfcPipeSegmentType", "USERDEFINED", null));
	});
});

describe("IfcPixelTexture.WR21/WR22/WR23/WR24", () => {
	function pixelTexture(width: number, height: number, colourComponents: number, pixel: string[]): EntityInstance {
		const t = create("IfcPixelTexture");
		(t as unknown as { Width: number }).Width = width;
		(t as unknown as { Height: number }).Height = height;
		(t as unknown as { ColourComponents: number }).ColourComponents = colourComponents;
		(t as unknown as { Pixel: string[] }).Pixel = pixel;
		return t;
	}
	test("WR21 pass/fail: Width >= 1", () => {
		expectPass("IfcPixelTexture", "WR21", pixelTexture(1, 1, 1, ["a"]));
		expectFail("IfcPixelTexture", "WR21", pixelTexture(0, 1, 1, []));
	});
	test("WR22 pass/fail: Height >= 1", () => {
		expectPass("IfcPixelTexture", "WR22", pixelTexture(1, 1, 1, ["a"]));
		expectFail("IfcPixelTexture", "WR22", pixelTexture(1, 0, 1, []));
	});
	test("WR23 pass/fail: ColourComponents in [1, 4]", () => {
		expectPass("IfcPixelTexture", "WR23", pixelTexture(1, 1, 4, ["a", "b", "c", "d"]));
		expectFail("IfcPixelTexture", "WR23", pixelTexture(1, 1, 5, []));
	});
	test("WR24 pass/fail: Pixel size must equal Width * Height", () => {
		expectPass("IfcPixelTexture", "WR24", pixelTexture(2, 2, 1, ["a", "b", "c", "d"]));
		expectFail("IfcPixelTexture", "WR24", pixelTexture(2, 2, 1, ["a"]));
	});
});

describe("IfcPolyLoop.WR21", () => {
	function loop(points: EntityInstance[]): EntityInstance {
		const l = create("IfcPolyLoop");
		(l as unknown as { Polygon: EntityInstance[] }).Polygon = points;
		return l;
	}
	test("pass: every Polygon member shares the first member's Dim", () => {
		expectPass("IfcPolyLoop", "WR21", loop([point([0, 0]), point([1, 1]), point([2, 2])]));
	});
	test("fail: a later Polygon member has a different Dim than the first", () => {
		expectFail("IfcPolyLoop", "WR21", loop([point([0, 0]), point([1, 1, 1])]));
	});
});

describe("IfcPolygonalBoundedHalfSpace.WR41/WR42", () => {
	function halfSpace(boundary: EntityInstance): EntityInstance {
		const h = create("IfcPolygonalBoundedHalfSpace");
		(h as unknown as { PolygonalBoundary: EntityInstance }).PolygonalBoundary = boundary;
		return h;
	}
	test("WR41 pass/fail: PolygonalBoundary.Dim must equal 2", () => {
		expectPass("IfcPolygonalBoundedHalfSpace", "WR41", halfSpace(polyline([point([0, 0]), point([1, 1])])));
		expectFail("IfcPolygonalBoundedHalfSpace", "WR41", halfSpace(polyline([point([0, 0, 0]), point([1, 1, 1])])));
	});
	test("WR42 pass: PolygonalBoundary is an IfcPolyline", () => {
		expectPass("IfcPolygonalBoundedHalfSpace", "WR42", halfSpace(polyline([point([0, 0]), point([1, 1])])));
	});
	test("WR42 fail: PolygonalBoundary is neither IfcPolyline nor IfcCompositeCurve", () => {
		expectFail("IfcPolygonalBoundedHalfSpace", "WR42", halfSpace(create("IfcTrimmedCurve")));
	});
});

describe("IfcPolyline.WR41", () => {
	test("pass/fail: every Points member shares the first member's Dim", () => {
		expectPass("IfcPolyline", "WR41", polyline([point([0, 0]), point([1, 1])]));
		expectFail("IfcPolyline", "WR41", polyline([point([0, 0]), point([1, 1, 1])]));
	});
});

describe("IfcPostalAddress.WR1", () => {
	function address(field: string | null, value: string | string[] | null): EntityInstance {
		const a = create("IfcPostalAddress");
		if (field) (a as unknown as Record<string, unknown>)[field] = value;
		return a;
	}
	test("pass: at least one of the 7 fields is given", () => {
		expectPass("IfcPostalAddress", "WR1", address("Town", "Springfield"));
		expectPass("IfcPostalAddress", "WR1", address("AddressLines", ["Line 1"]));
	});
	test("fail: none of the 7 fields is given", () => {
		expectFail("IfcPostalAddress", "WR1", address(null, null));
	});
});

describe("IfcPreDefinedDimensionSymbol.WR31", () => {
	test("pass/fail", () => {
		const pass = create("IfcPreDefinedDimensionSymbol");
		(pass as unknown as { Name: string }).Name = "RADIUS";
		expectPass("IfcPreDefinedDimensionSymbol", "WR31", pass);
		const fail = create("IfcPreDefinedDimensionSymbol");
		(fail as unknown as { Name: string }).Name = "unknown-symbol";
		expectFail("IfcPreDefinedDimensionSymbol", "WR31", fail);
	});
});

describe("IfcPreDefinedPointMarkerSymbol.WR31", () => {
	test("pass/fail", () => {
		const pass = create("IfcPreDefinedPointMarkerSymbol");
		(pass as unknown as { Name: string }).Name = "Circle";
		expectPass("IfcPreDefinedPointMarkerSymbol", "WR31", pass);
		const fail = create("IfcPreDefinedPointMarkerSymbol");
		(fail as unknown as { Name: string }).Name = "unknown-symbol";
		expectFail("IfcPreDefinedPointMarkerSymbol", "WR31", fail);
	});
});

describe("IfcPreDefinedTerminatorSymbol.WR31", () => {
	test("pass/fail", () => {
		const pass = create("IfcPreDefinedTerminatorSymbol");
		(pass as unknown as { Name: string }).Name = "Filled Arrow";
		expectPass("IfcPreDefinedTerminatorSymbol", "WR31", pass);
		const fail = create("IfcPreDefinedTerminatorSymbol");
		(fail as unknown as { Name: string }).Name = "unknown-symbol";
		expectFail("IfcPreDefinedTerminatorSymbol", "WR31", fail);
	});
});

describe("IfcProcedure.WR1/WR2/WR3/WR4", () => {
	test("WR1 pass: Decomposes is empty", () => {
		expectPass("IfcProcedure", "WR1", create("IfcProcedure"));
	});
	test("WR1 pass: the Decomposes relationship is an IfcRelNests", () => {
		const proc = create("IfcProcedure");
		const nest = create("IfcRelNests");
		(nest as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [proc];
		(nest as unknown as { RelatingObject: EntityInstance }).RelatingObject = create("IfcProcedure");
		expectPass("IfcProcedure", "WR1", proc);
	});
	test("WR1 fail: the Decomposes relationship is not an IfcRelNests", () => {
		const proc = create("IfcProcedure");
		const agg = create("IfcRelAggregates");
		(agg as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [proc];
		(agg as unknown as { RelatingObject: EntityInstance }).RelatingObject = create("IfcProcedure");
		expectFail("IfcProcedure", "WR1", proc);
	});
	test("WR2 pass/fail: same shape for IsDecomposedBy", () => {
		const procPass = create("IfcProcedure");
		const nest = create("IfcRelNests");
		(nest as unknown as { RelatingObject: EntityInstance }).RelatingObject = procPass;
		(nest as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcProcedure")];
		expectPass("IfcProcedure", "WR2", procPass);

		const procFail = create("IfcProcedure");
		const agg = create("IfcRelAggregates");
		(agg as unknown as { RelatingObject: EntityInstance }).RelatingObject = procFail;
		(agg as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcProcedure")];
		expectFail("IfcProcedure", "WR2", procFail);
	});
	test("WR3 pass/fail: Name must be given", () => {
		const withName = create("IfcProcedure");
		(withName as unknown as { Name: string }).Name = "Proc";
		expectPass("IfcProcedure", "WR3", withName);
		expectFail("IfcProcedure", "WR3", create("IfcProcedure"));
	});
	test("WR4 pass/fail", () => {
		expectPass(
			"IfcProcedure",
			"WR4",
			enumFixture("IfcProcedure", "ProcedureType", "ADVICE_CAUTION", "UserDefinedProcedureType", null),
		);
		expectFail(
			"IfcProcedure",
			"WR4",
			enumFixture("IfcProcedure", "ProcedureType", "USERDEFINED", "UserDefinedProcedureType", null),
		);
	});
});

describe("IfcProduct.WR1", () => {
	function product(representation: EntityInstance | null, objectPlacement: EntityInstance | null): EntityInstance {
		const p = create("IfcProduct");
		(p as unknown as { Representation: EntityInstance | null }).Representation = representation;
		(p as unknown as { ObjectPlacement: EntityInstance | null }).ObjectPlacement = objectPlacement;
		return p;
	}
	test("pass: Representation unset", () => {
		expectPass("IfcProduct", "WR1", product(null, null));
	});
	test("pass: Representation given, ObjectPlacement given", () => {
		expectPass("IfcProduct", "WR1", product(create("IfcShapeRepresentation"), create("IfcLocalPlacement")));
	});
	test("pass: Representation given but not an IfcProductDefinitionShape, ObjectPlacement unset", () => {
		expectPass("IfcProduct", "WR1", product(create("IfcShapeRepresentation"), null));
	});
	test("fail: Representation is an IfcProductDefinitionShape and ObjectPlacement is unset", () => {
		expectFail("IfcProduct", "WR1", product(create("IfcProductDefinitionShape"), null));
	});
});

describe("IfcProductDefinitionShape.WR11", () => {
	function productDefShape(representations: EntityInstance[]): EntityInstance {
		const p = create("IfcProductDefinitionShape");
		(p as unknown as { Representations: EntityInstance[] }).Representations = representations;
		return p;
	}
	test("pass: every Representations member is an IfcShapeModel", () => {
		expectPass("IfcProductDefinitionShape", "WR11", productDefShape([create("IfcShapeRepresentation")]));
	});
	test("fail: a Representations member is not an IfcShapeModel", () => {
		expectFail("IfcProductDefinitionShape", "WR11", productDefShape([create("IfcStyledRepresentation")]));
	});
});

describe("IfcProject.WR31/WR32/WR33", () => {
	test("WR31 pass/fail: Name must be given", () => {
		const withName = create("IfcProject");
		(withName as unknown as { Name: string }).Name = "My Project";
		expectPass("IfcProject", "WR31", withName);
		expectFail("IfcProject", "WR31", create("IfcProject"));
	});
	test("WR32 pass/fail: RepresentationContexts must not contain an IfcGeometricRepresentationSubContext", () => {
		const pass = create("IfcProject");
		(pass as unknown as { RepresentationContexts: EntityInstance[] }).RepresentationContexts = [
			create("IfcGeometricRepresentationContext"),
		];
		expectPass("IfcProject", "WR32", pass);
		const fail = create("IfcProject");
		(fail as unknown as { RepresentationContexts: EntityInstance[] }).RepresentationContexts = [
			create("IfcGeometricRepresentationSubContext"),
		];
		expectFail("IfcProject", "WR32", fail);
	});
	test("WR33 pass/fail: Decomposes must be empty", () => {
		expectPass("IfcProject", "WR33", create("IfcProject"));
		const project = create("IfcProject");
		const agg = create("IfcRelAggregates");
		(agg as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [project];
		(agg as unknown as { RelatingObject: EntityInstance }).RelatingObject = create("IfcProject");
		expectFail("IfcProject", "WR33", project);
	});
});

describe("IfcPropertyBoundedValue.WR21/WR22", () => {
	function boundedValue(upper: EntityInstance | null, lower: EntityInstance | null): EntityInstance {
		const p = create("IfcPropertyBoundedValue");
		(p as unknown as { UpperBoundValue: EntityInstance | null }).UpperBoundValue = upper;
		(p as unknown as { LowerBoundValue: EntityInstance | null }).LowerBoundValue = lower;
		return p;
	}
	test("WR21 pass: UpperBoundValue unset", () => {
		expectPass("IfcPropertyBoundedValue", "WR21", boundedValue(null, wrappedLength(1)));
	});
	test("WR21 pass: LowerBoundValue unset", () => {
		expectPass("IfcPropertyBoundedValue", "WR21", boundedValue(wrappedLength(1), null));
	});
	test("WR21 pass: both given, same type", () => {
		expectPass("IfcPropertyBoundedValue", "WR21", boundedValue(wrappedLength(1), wrappedLength(2)));
	});
	test("WR21 fail: both given, different types", () => {
		expectFail("IfcPropertyBoundedValue", "WR21", boundedValue(wrappedLength(1), wrappedText("x")));
	});
	test("WR22 pass/fail: at least one of UpperBoundValue/LowerBoundValue must be given", () => {
		expectPass("IfcPropertyBoundedValue", "WR22", boundedValue(wrappedLength(1), null));
		expectFail("IfcPropertyBoundedValue", "WR22", boundedValue(null, null));
	});
});

describe("IfcPropertyDependencyRelationship.WR1", () => {
	function dependency(depending: EntityInstance, dependant: EntityInstance): EntityInstance {
		const d = create("IfcPropertyDependencyRelationship");
		(d as unknown as { DependingProperty: EntityInstance }).DependingProperty = depending;
		(d as unknown as { DependantProperty: EntityInstance }).DependantProperty = dependant;
		return d;
	}
	function namedProperty(name: string): EntityInstance {
		const p = create("IfcPropertySingleValue");
		(p as unknown as { Name: string }).Name = name;
		return p;
	}
	test("pass: DependingProperty and DependantProperty are different", () => {
		expectPass("IfcPropertyDependencyRelationship", "WR1", dependency(namedProperty("A"), namedProperty("B")));
	});
	test("fail: DependingProperty and DependantProperty are the same instance", () => {
		const p = namedProperty("A");
		expectFail("IfcPropertyDependencyRelationship", "WR1", dependency(p, p));
	});
});

describe("IfcPropertyEnumeratedValue.WR1", () => {
	function enumeratedValue(values: EntityInstance[], reference: EntityInstance | null): EntityInstance {
		const p = create("IfcPropertyEnumeratedValue");
		(p as unknown as { EnumerationValues: EntityInstance[] }).EnumerationValues = values;
		(p as unknown as { EnumerationReference: EntityInstance | null }).EnumerationReference = reference;
		return p;
	}
	function enumeration(values: EntityInstance[]): EntityInstance {
		const e = create("IfcPropertyEnumeration");
		(e as unknown as { EnumerationValues: EntityInstance[] }).EnumerationValues = values;
		return e;
	}
	test("pass: EnumerationReference unset", () => {
		expectPass("IfcPropertyEnumeratedValue", "WR1", enumeratedValue([wrappedText("a")], null));
	});
	test("pass: every EnumerationValues member is present in EnumerationReference's own values", () => {
		const a = wrappedText("a");
		expectPass("IfcPropertyEnumeratedValue", "WR1", enumeratedValue([a], enumeration([a, wrappedText("b")])));
	});
	// Uses a different-TYPE (not just different-value) member to guarantee a real
	// `EntityInstance.equals()` mismatch -- see this section's own header comment's new
	// disclosed finding: two standalone defined-type instances of the SAME type (e.g.
	// two different `IfcDescriptiveMeasure`s) currently compare as EQUAL regardless of
	// their own wrapped values (`EntityInstance.getInfo()`'s own early-return for a
	// non-entity instance omits the wrapped value entirely), so a same-type/
	// different-value fixture could not actually exercise this rule's real fail path.
	test("fail: an EnumerationValues member is not present in EnumerationReference's own values", () => {
		expectFail(
			"IfcPropertyEnumeratedValue",
			"WR1",
			enumeratedValue([wrappedLength(1)], enumeration([wrappedText("a")])),
		);
	});
});

describe("IfcPropertyEnumeration.WR01", () => {
	function enumeration(values: EntityInstance[]): EntityInstance {
		const e = create("IfcPropertyEnumeration");
		(e as unknown as { EnumerationValues: EntityInstance[] }).EnumerationValues = values;
		return e;
	}
	test("pass: every EnumerationValues member shares the first member's type", () => {
		expectPass("IfcPropertyEnumeration", "WR01", enumeration([wrappedLength(1), wrappedLength(2)]));
	});
	test("fail: a later EnumerationValues member has a different type than the first", () => {
		expectFail("IfcPropertyEnumeration", "WR01", enumeration([wrappedLength(1), wrappedText("x")]));
	});
});

describe("IfcPropertyListValue.WR31", () => {
	function listValue(values: EntityInstance[]): EntityInstance {
		const p = create("IfcPropertyListValue");
		(p as unknown as { ListValues: EntityInstance[] }).ListValues = values;
		return p;
	}
	test("pass: every ListValues member shares the first member's type", () => {
		expectPass("IfcPropertyListValue", "WR31", listValue([wrappedLength(1), wrappedLength(2)]));
	});
	test("fail: a later ListValues member has a different type than the first", () => {
		expectFail("IfcPropertyListValue", "WR31", listValue([wrappedLength(1), wrappedText("x")]));
	});
});

describe("IfcPropertySet.WR31/WR32", () => {
	function propertySet(name: string | null, properties: EntityInstance[]): EntityInstance {
		const ps = create("IfcPropertySet");
		(ps as unknown as { Name: string | null }).Name = name;
		(ps as unknown as { HasProperties: EntityInstance[] }).HasProperties = properties;
		return ps;
	}
	function namedProperty(name: string): EntityInstance {
		const p = create("IfcPropertySingleValue");
		(p as unknown as { Name: string }).Name = name;
		return p;
	}
	test("WR31 pass/fail: Name must be given", () => {
		expectPass("IfcPropertySet", "WR31", propertySet("Pset", [namedProperty("A")]));
		expectFail("IfcPropertySet", "WR31", propertySet(null, [namedProperty("A")]));
	});
	test("WR32 pass: HasProperties Name values are unique", () => {
		expectPass("IfcPropertySet", "WR32", propertySet("Pset", [namedProperty("A"), namedProperty("B")]));
	});
	test("WR32 fail: HasProperties has duplicate Name values", () => {
		expectFail("IfcPropertySet", "WR32", propertySet("Pset", [namedProperty("A"), namedProperty("A")]));
	});
});

describe("IfcPropertyTableValue.WR1/WR2/WR3", () => {
	function tableValue(defining: EntityInstance[], defined: EntityInstance[]): EntityInstance {
		const p = create("IfcPropertyTableValue");
		(p as unknown as { DefiningValues: EntityInstance[] }).DefiningValues = defining;
		(p as unknown as { DefinedValues: EntityInstance[] }).DefinedValues = defined;
		return p;
	}
	test("WR1 pass/fail: DefiningValues and DefinedValues must have equal size", () => {
		expectPass("IfcPropertyTableValue", "WR1", tableValue([wrappedLength(1)], [wrappedLength(2)]));
		expectFail("IfcPropertyTableValue", "WR1", tableValue([wrappedLength(1), wrappedLength(2)], [wrappedLength(3)]));
	});
	test("WR2 pass/fail: every DefiningValues member shares the first member's type", () => {
		expectPass("IfcPropertyTableValue", "WR2", tableValue([wrappedLength(1), wrappedLength(2)], [wrappedLength(9)]));
		expectFail("IfcPropertyTableValue", "WR2", tableValue([wrappedLength(1), wrappedText("x")], [wrappedLength(9)]));
	});
	test("WR3 pass/fail: every DefinedValues member shares the first member's type", () => {
		expectPass("IfcPropertyTableValue", "WR3", tableValue([wrappedLength(9)], [wrappedLength(1), wrappedLength(2)]));
		expectFail("IfcPropertyTableValue", "WR3", tableValue([wrappedLength(9)], [wrappedLength(1), wrappedText("x")]));
	});
});

describe("IfcProxy.WR1", () => {
	test("pass/fail: Name must be given", () => {
		const withName = create("IfcProxy");
		(withName as unknown as { Name: string }).Name = "A proxy";
		expectPass("IfcProxy", "WR1", withName);
		expectFail("IfcProxy", "WR1", create("IfcProxy"));
	});
});

describe("IfcPumpType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcPumpType", "WR1", userDefinedFixture("IfcPumpType", "CIRCULATOR", null));
		expectFail("IfcPumpType", "WR1", userDefinedFixture("IfcPumpType", "USERDEFINED", null));
	});
});

describe("IfcQuantityArea.WR21/WR22", () => {
	function quantityArea(unit: EntityInstance | null, areaValue: number): EntityInstance {
		const q = create("IfcQuantityArea");
		(q as unknown as { Name: string }).Name = "Area";
		(q as unknown as { Unit: EntityInstance | null }).Unit = unit;
		(q as unknown as { AreaValue: number }).AreaValue = areaValue;
		return q;
	}
	function siUnit(unitType: string, name: string): EntityInstance {
		const u = create("IfcSIUnit");
		(u as unknown as { UnitType: string }).UnitType = unitType;
		(u as unknown as { Name: string }).Name = name;
		return u;
	}
	test("WR21 pass: Unit unset", () => {
		expectPass("IfcQuantityArea", "WR21", quantityArea(null, 1.0));
	});
	test("WR21 pass: Unit.UnitType is AREAUNIT", () => {
		expectPass("IfcQuantityArea", "WR21", quantityArea(siUnit("AREAUNIT", "SQUARE_METRE"), 1.0));
	});
	test("WR21 fail: Unit.UnitType is not AREAUNIT", () => {
		expectFail("IfcQuantityArea", "WR21", quantityArea(siUnit("LENGTHUNIT", "METRE"), 1.0));
	});
	test("WR22 pass/fail: AreaValue >= 0", () => {
		expectPass("IfcQuantityArea", "WR22", quantityArea(null, 0.0));
		expectFail("IfcQuantityArea", "WR22", quantityArea(null, -1.0));
	});
});

// =============================================================================
// Phase EX-4 chunk 4: original, hand-rolled coverage for the 85 WHERE-rule classes
// ported in `src/express/whereRules/ifc2x3.ts`'s own chunk 4 section (`IfcQuantityCount.
// WR21` through `IfcSweptDiskSolid.WR2`), matching this file's own established style and
// depth exactly -- at least one pass case and (where a real, constructible failing case
// exists) one fail case per rule, more where a rule has multiple distinct branches.
// =============================================================================

function siUnitFor(unitType: string, name: string): EntityInstance {
	const u = create("IfcSIUnit");
	(u as unknown as { UnitType: string }).UnitType = unitType;
	(u as unknown as { Name: string }).Name = name;
	return u;
}

function quantityFixture(
	type: string,
	valueAttrName: string,
	value: number,
	unit: EntityInstance | null = null,
): EntityInstance {
	const q = create(type);
	(q as unknown as Record<string, unknown>).Name = "Q";
	(q as unknown as Record<string, unknown>)[valueAttrName] = value;
	(q as unknown as Record<string, unknown>).Unit = unit;
	return q;
}

/**
 * Populates the INVERSE `IsDecomposedBy`/`Decomposes` pair by creating a real forward
 * `IfcRelAggregates` (or, for one deliberately-wrong-type test case, a different
 * `IfcRelDecomposes` subtype) relationship -- same established technique as this file's
 * own pre-existing `IfcConstructionMaterialResource.WR1/WR2` describe block (`ResourceOf`
 * via a real `IfcRelAssignsToResource`), since neither `IsDecomposedBy` nor `Decomposes`
 * can be assigned directly (both are computed INVERSE attributes).
 */
function decomposeRelationship(
	relatingObject: EntityInstance,
	relatedObjects: EntityInstance[],
	relType = "IfcRelAggregates",
): EntityInstance {
	const rel = create(relType);
	(rel as unknown as { RelatingObject: EntityInstance }).RelatingObject = relatingObject;
	(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = relatedObjects;
	return rel;
}

describe("IfcQuantityCount.WR21", () => {
	test("pass/fail: CountValue >= 0", () => {
		expectPass("IfcQuantityCount", "WR21", quantityFixture("IfcQuantityCount", "CountValue", 0));
		expectFail("IfcQuantityCount", "WR21", quantityFixture("IfcQuantityCount", "CountValue", -1));
	});
});

describe("IfcQuantityLength.WR21/WR22", () => {
	test("WR21 pass: Unit unset", () => {
		expectPass("IfcQuantityLength", "WR21", quantityFixture("IfcQuantityLength", "LengthValue", 1.0));
	});
	test("WR21 pass: Unit.UnitType is LENGTHUNIT", () => {
		expectPass(
			"IfcQuantityLength",
			"WR21",
			quantityFixture("IfcQuantityLength", "LengthValue", 1.0, siUnitFor("LENGTHUNIT", "METRE")),
		);
	});
	test("WR21 fail: Unit.UnitType is not LENGTHUNIT", () => {
		expectFail(
			"IfcQuantityLength",
			"WR21",
			quantityFixture("IfcQuantityLength", "LengthValue", 1.0, siUnitFor("MASSUNIT", "GRAM")),
		);
	});
	test("WR22 pass/fail: LengthValue >= 0", () => {
		expectPass("IfcQuantityLength", "WR22", quantityFixture("IfcQuantityLength", "LengthValue", 0));
		expectFail("IfcQuantityLength", "WR22", quantityFixture("IfcQuantityLength", "LengthValue", -1));
	});
});

describe("IfcQuantityTime.WR21/WR22", () => {
	test("WR21 pass: Unit unset", () => {
		expectPass("IfcQuantityTime", "WR21", quantityFixture("IfcQuantityTime", "TimeValue", 1.0));
	});
	test("WR21 pass: Unit.UnitType is TIMEUNIT", () => {
		expectPass(
			"IfcQuantityTime",
			"WR21",
			quantityFixture("IfcQuantityTime", "TimeValue", 1.0, siUnitFor("TIMEUNIT", "SECOND")),
		);
	});
	test("WR21 fail: Unit.UnitType is not TIMEUNIT", () => {
		expectFail(
			"IfcQuantityTime",
			"WR21",
			quantityFixture("IfcQuantityTime", "TimeValue", 1.0, siUnitFor("LENGTHUNIT", "METRE")),
		);
	});
	test("WR22 pass/fail: TimeValue >= 0", () => {
		expectPass("IfcQuantityTime", "WR22", quantityFixture("IfcQuantityTime", "TimeValue", 0));
		expectFail("IfcQuantityTime", "WR22", quantityFixture("IfcQuantityTime", "TimeValue", -1));
	});
});

describe("IfcQuantityVolume.WR21/WR22", () => {
	test("WR21 pass: Unit unset", () => {
		expectPass("IfcQuantityVolume", "WR21", quantityFixture("IfcQuantityVolume", "VolumeValue", 1.0));
	});
	test("WR21 pass: Unit.UnitType is VOLUMEUNIT", () => {
		expectPass(
			"IfcQuantityVolume",
			"WR21",
			quantityFixture("IfcQuantityVolume", "VolumeValue", 1.0, siUnitFor("VOLUMEUNIT", "CUBIC_METRE")),
		);
	});
	test("WR21 fail: Unit.UnitType is not VOLUMEUNIT", () => {
		expectFail(
			"IfcQuantityVolume",
			"WR21",
			quantityFixture("IfcQuantityVolume", "VolumeValue", 1.0, siUnitFor("LENGTHUNIT", "METRE")),
		);
	});
	test("WR22 pass/fail: VolumeValue >= 0", () => {
		expectPass("IfcQuantityVolume", "WR22", quantityFixture("IfcQuantityVolume", "VolumeValue", 0));
		expectFail("IfcQuantityVolume", "WR22", quantityFixture("IfcQuantityVolume", "VolumeValue", -1));
	});
});

describe("IfcQuantityWeight.WR21/WR22", () => {
	test("WR21 pass: Unit unset", () => {
		expectPass("IfcQuantityWeight", "WR21", quantityFixture("IfcQuantityWeight", "WeightValue", 1.0));
	});
	test("WR21 pass: Unit.UnitType is MASSUNIT", () => {
		expectPass(
			"IfcQuantityWeight",
			"WR21",
			quantityFixture("IfcQuantityWeight", "WeightValue", 1.0, siUnitFor("MASSUNIT", "GRAM")),
		);
	});
	test("WR21 fail: Unit.UnitType is not MASSUNIT", () => {
		expectFail(
			"IfcQuantityWeight",
			"WR21",
			quantityFixture("IfcQuantityWeight", "WeightValue", 1.0, siUnitFor("LENGTHUNIT", "METRE")),
		);
	});
	test("WR22 pass/fail: WeightValue >= 0", () => {
		expectPass("IfcQuantityWeight", "WR22", quantityFixture("IfcQuantityWeight", "WeightValue", 0));
		expectFail("IfcQuantityWeight", "WR22", quantityFixture("IfcQuantityWeight", "WeightValue", -1));
	});
});

describe("IfcRailing.WR61", () => {
	test("pass: PredefinedType unset", () => {
		expectPass("IfcRailing", "WR61", create("IfcRailing"));
	});
	test("pass: PredefinedType is not USERDEFINED", () => {
		expectPass("IfcRailing", "WR61", enumFixture("IfcRailing", "PredefinedType", "HANDRAIL", "ObjectType", null));
	});
	test("pass: PredefinedType USERDEFINED with ObjectType given", () => {
		expectPass("IfcRailing", "WR61", enumFixture("IfcRailing", "PredefinedType", "USERDEFINED", "ObjectType", "X"));
	});
	test("fail: PredefinedType USERDEFINED without ObjectType", () => {
		expectFail("IfcRailing", "WR61", enumFixture("IfcRailing", "PredefinedType", "USERDEFINED", "ObjectType", null));
	});
});

describe("IfcRamp.WR1 / IfcRoof.WR1 / IfcStair.WR1", () => {
	test("pass: not decomposed", () => {
		expectPass("IfcRamp", "WR1", create("IfcRamp"));
		expectPass("IfcRoof", "WR1", create("IfcRoof"));
		expectPass("IfcStair", "WR1", create("IfcStair"));
	});
	test("pass: decomposed into exactly 1 part, no own Representation", () => {
		const ramp = create("IfcRamp");
		decomposeRelationship(ramp, [create("IfcWall")]);
		expectPass("IfcRamp", "WR1", ramp);
	});
	test("fail: decomposed into exactly 1 part, but has its own Representation", () => {
		const ramp = create("IfcRamp");
		decomposeRelationship(ramp, [create("IfcWall")]);
		(ramp as unknown as { Representation: EntityInstance }).Representation = create("IfcProductDefinitionShape");
		expectFail("IfcRamp", "WR1", ramp);
	});
	test("fail: has more than 1 IsDecomposedBy relationship (not '> 1 decomposed part')", () => {
		// `IsDecomposedBy` counts RELATIONSHIP instances where self is `RelatingObject`,
		// not the number of decomposed parts inside a single relationship's own
		// `RelatedObjects` -- confirmed empirically while writing this fixture (a single
		// `IfcRelAggregates` with 2 `RelatedObjects` members still gives `hiindex(IsDecomposedBy)
		// == 1`), so this fail case creates 2 SEPARATE relationships instead.
		const ramp = create("IfcRamp");
		decomposeRelationship(ramp, [create("IfcWall")]);
		decomposeRelationship(ramp, [create("IfcSlab")]);
		expectFail("IfcRamp", "WR1", ramp);
	});
});

describe("IfcRationalBezierCurve.WR1/WR2", () => {
	test("WR1 pass/fail: WeightsData and ControlPointsList have the same size", () => {
		const curve1 = create("IfcRationalBezierCurve");
		(curve1 as unknown as { WeightsData: number[] }).WeightsData = [1, 1, 1];
		(curve1 as unknown as { ControlPointsList: EntityInstance[] }).ControlPointsList = [
			point([0, 0]),
			point([1, 0]),
			point([2, 0]),
		];
		expectPass("IfcRationalBezierCurve", "WR1", curve1);

		const curve2 = create("IfcRationalBezierCurve");
		(curve2 as unknown as { WeightsData: number[] }).WeightsData = [1, 1];
		(curve2 as unknown as { ControlPointsList: EntityInstance[] }).ControlPointsList = [
			point([0, 0]),
			point([1, 0]),
			point([2, 0]),
		];
		expectFail("IfcRationalBezierCurve", "WR1", curve2);
	});
	test("WR2 pass/fail: every (derived) Weights value is greater than 0", () => {
		// `UpperIndexOnControlPoints` is itself a DERIVE attribute (`calc_IfcBSplineCurve_
		// UpperIndexOnControlPoints`, `hiindex(ControlPointsList) - 1`), not directly
		// settable -- confirmed empirically (this port's own `.set()` throws "has no
		// attribute" for it, matching a genuine DERIVE not being part of the settable
		// positional-argument list). Populating `ControlPointsList` with 4 members makes it
		// resolve to 3 automatically.
		const curve1 = create("IfcRationalBezierCurve");
		(curve1 as unknown as { ControlPointsList: EntityInstance[] }).ControlPointsList = [
			point([0, 0]),
			point([1, 0]),
			point([2, 0]),
			point([3, 0]),
		];
		(curve1 as unknown as { WeightsData: number[] }).WeightsData = [1, 1, 1, 1];
		expectPass("IfcRationalBezierCurve", "WR2", curve1);

		const curve2 = create("IfcRationalBezierCurve");
		(curve2 as unknown as { ControlPointsList: EntityInstance[] }).ControlPointsList = [
			point([0, 0]),
			point([1, 0]),
			point([2, 0]),
			point([3, 0]),
		];
		(curve2 as unknown as { WeightsData: number[] }).WeightsData = [1, 1, 0, 1];
		expectFail("IfcRationalBezierCurve", "WR2", curve2);
	});
});

describe("IfcRectangleHollowProfileDef.WR31/WR32/WR33", () => {
	function profile(
		xDim: number,
		yDim: number,
		wallThickness: number,
		outerFilletRadius: number | null,
		innerFilletRadius: number | null,
	): EntityInstance {
		const p = create("IfcRectangleHollowProfileDef");
		(p as unknown as { XDim: number }).XDim = xDim;
		(p as unknown as { YDim: number }).YDim = yDim;
		(p as unknown as { WallThickness: number }).WallThickness = wallThickness;
		(p as unknown as { OuterFilletRadius: number | null }).OuterFilletRadius = outerFilletRadius;
		(p as unknown as { InnerFilletRadius: number | null }).InnerFilletRadius = innerFilletRadius;
		return p;
	}
	test("WR31 pass/fail: WallThickness < half of both XDim and YDim", () => {
		expectPass("IfcRectangleHollowProfileDef", "WR31", profile(10, 10, 2, null, null));
		expectFail("IfcRectangleHollowProfileDef", "WR31", profile(10, 10, 6, null, null));
	});
	test("WR32 pass/fail: OuterFilletRadius (if given) at most half of both XDim and YDim", () => {
		expectPass("IfcRectangleHollowProfileDef", "WR32", profile(10, 10, 2, null, null));
		expectPass("IfcRectangleHollowProfileDef", "WR32", profile(10, 10, 2, 5, null));
		expectFail("IfcRectangleHollowProfileDef", "WR32", profile(10, 10, 2, 6, null));
	});
	test("WR33 pass/fail: InnerFilletRadius (if given) at most half of XDim/YDim minus WallThickness", () => {
		expectPass("IfcRectangleHollowProfileDef", "WR33", profile(10, 10, 2, null, null));
		expectPass("IfcRectangleHollowProfileDef", "WR33", profile(10, 10, 2, null, 3));
		expectFail("IfcRectangleHollowProfileDef", "WR33", profile(10, 10, 2, null, 4));
	});
});

describe("IfcRectangularTrimmedSurface.WR1/WR2/WR3/WR4", () => {
	function surface(
		basisSurface: EntityInstance,
		u1: number,
		u2: number,
		v1: number,
		v2: number,
		usense: boolean,
		vsense: boolean,
	): EntityInstance {
		const s = create("IfcRectangularTrimmedSurface");
		(s as unknown as { BasisSurface: EntityInstance }).BasisSurface = basisSurface;
		(s as unknown as { U1: number }).U1 = u1;
		(s as unknown as { U2: number }).U2 = u2;
		(s as unknown as { V1: number }).V1 = v1;
		(s as unknown as { V2: number }).V2 = v2;
		(s as unknown as { Usense: boolean }).Usense = usense;
		(s as unknown as { Vsense: boolean }).Vsense = vsense;
		return s;
	}
	test("WR1 pass/fail: U1 != U2", () => {
		expectPass("IfcRectangularTrimmedSurface", "WR1", surface(create("IfcPlane"), 0, 1, 0, 1, true, true));
		expectFail("IfcRectangularTrimmedSurface", "WR1", surface(create("IfcPlane"), 1, 1, 0, 1, true, true));
	});
	test("WR2 pass/fail: V1 != V2", () => {
		expectPass("IfcRectangularTrimmedSurface", "WR2", surface(create("IfcPlane"), 0, 1, 0, 1, true, true));
		expectFail("IfcRectangularTrimmedSurface", "WR2", surface(create("IfcPlane"), 0, 1, 1, 1, true, true));
	});
	test("WR3 pass: BasisSurface is an elementary surface but not a plane", () => {
		expectPass("IfcRectangularTrimmedSurface", "WR3", surface(create("IfcElementarySurface"), 0, 1, 0, 1, false, true));
	});
	test("WR3 pass: BasisSurface is an IfcSurfaceOfRevolution", () => {
		expectPass(
			"IfcRectangularTrimmedSurface",
			"WR3",
			surface(create("IfcSurfaceOfRevolution"), 0, 1, 0, 1, false, true),
		);
	});
	test("WR3 pass: BasisSurface is a plane, Usense matches (U2 > U1)", () => {
		expectPass("IfcRectangularTrimmedSurface", "WR3", surface(create("IfcPlane"), 0, 1, 0, 1, true, true));
	});
	test("WR3 fail: BasisSurface is a plane, Usense does not match (U2 > U1)", () => {
		expectFail("IfcRectangularTrimmedSurface", "WR3", surface(create("IfcPlane"), 0, 1, 0, 1, false, true));
	});
	test("WR4 pass/fail: Vsense == (V2 > V1)", () => {
		expectPass("IfcRectangularTrimmedSurface", "WR4", surface(create("IfcPlane"), 0, 1, 0, 1, true, true));
		expectFail("IfcRectangularTrimmedSurface", "WR4", surface(create("IfcPlane"), 0, 1, 0, 1, true, false));
	});
});

describe("IfcReinforcingBar.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcReinforcingBar", "WR1", enumFixture("IfcReinforcingBar", "BarRole", "MAIN", "ObjectType", null));
		expectPass(
			"IfcReinforcingBar",
			"WR1",
			enumFixture("IfcReinforcingBar", "BarRole", "USERDEFINED", "ObjectType", "X"),
		);
		expectFail(
			"IfcReinforcingBar",
			"WR1",
			enumFixture("IfcReinforcingBar", "BarRole", "USERDEFINED", "ObjectType", null),
		);
	});
});

describe("IfcRelAssigns.WR1", () => {
	function rel(relatedObjectsType: string | null, relatedObjects: EntityInstance[]): EntityInstance {
		const r = create("IfcRelAssigns");
		(r as unknown as { RelatedObjectsType: string | null }).RelatedObjectsType = relatedObjectsType;
		(r as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = relatedObjects;
		return r;
	}
	test("pass: RelatedObjectsType unset", () => {
		expectPass("IfcRelAssigns", "WR1", rel(null, [create("IfcWall")]));
	});
	test("pass: RelatedObjectsType NOTDEFINED", () => {
		expectPass("IfcRelAssigns", "WR1", rel("NOTDEFINED", [create("IfcActor")]));
	});
	test("pass/fail: RelatedObjectsType PRODUCT", () => {
		expectPass("IfcRelAssigns", "WR1", rel("PRODUCT", [create("IfcWall")]));
		expectFail("IfcRelAssigns", "WR1", rel("PRODUCT", [create("IfcActor")]));
	});
	test("pass: RelatedObjectsType ACTOR, all members are IfcActor", () => {
		expectPass("IfcRelAssigns", "WR1", rel("ACTOR", [create("IfcActor")]));
	});
	test("pass: RelatedObjectsType GROUP, all members are IfcGroup", () => {
		expectPass("IfcRelAssigns", "WR1", rel("GROUP", [create("IfcGroup")]));
	});
	test("pass: RelatedObjectsType PROJECT, all members are IfcProject", () => {
		expectPass("IfcRelAssigns", "WR1", rel("PROJECT", [create("IfcProject")]));
	});
});

describe("IfcRelAssignsTasks.WR1/WR2/WR3", () => {
	function rel(relatedObjects: EntityInstance[], relatingControl: EntityInstance | null): EntityInstance {
		const r = create("IfcRelAssignsTasks");
		(r as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = relatedObjects;
		(r as unknown as { RelatingControl: EntityInstance | null }).RelatingControl = relatingControl;
		return r;
	}
	test("WR1 pass/fail: RelatedObjects has exactly 1 member", () => {
		expectPass("IfcRelAssignsTasks", "WR1", rel([create("IfcTask")], null));
		expectFail("IfcRelAssignsTasks", "WR1", rel([create("IfcTask"), create("IfcTask")], null));
	});
	test("WR2 pass/fail: RelatedObjects[1] is an IfcTask", () => {
		expectPass("IfcRelAssignsTasks", "WR2", rel([create("IfcTask")], null));
		expectFail("IfcRelAssignsTasks", "WR2", rel([create("IfcActor")], null));
	});
	test("WR3 pass/fail: RelatingControl is an IfcWorkControl", () => {
		expectPass("IfcRelAssignsTasks", "WR3", rel([], create("IfcWorkPlan")));
		expectFail("IfcRelAssignsTasks", "WR3", rel([], create("IfcActor")));
	});
});

// `relatingObjectNotInRelatedObjects` (whereRules/ifc2x3.ts's own new shared helper) is
// exercised via all 6 `IfcRelAssignsTo*` entities at once, in a loop, mirroring that
// helper's own "shared shape" grouping -- an evolution of this file's own pre-existing
// "IfcConstraintAggregationRelationship.WR11 / IfcConstraintRelationship.WR11" grouping
// precedent (2 entities sharing 1 body) scaled up to 6.
describe("IfcRelAssignsToActor.WR1 / IfcRelAssignsToControl.WR1 / IfcRelAssignsToGroup.WR1 / IfcRelAssignsToProcess.WR1 / IfcRelAssignsToProduct.WR1 / IfcRelAssignsToResource.WR1", () => {
	const cases: Array<[string, string]> = [
		["IfcRelAssignsToActor", "RelatingActor"],
		["IfcRelAssignsToControl", "RelatingControl"],
		["IfcRelAssignsToGroup", "RelatingGroup"],
		["IfcRelAssignsToProcess", "RelatingProcess"],
		["IfcRelAssignsToProduct", "RelatingProduct"],
		["IfcRelAssignsToResource", "RelatingResource"],
	];
	test("pass: relating object not in RelatedObjects", () => {
		for (const [type, relatingAttr] of cases) {
			const relating = create("IfcActor");
			const rel = create(type);
			(rel as unknown as Record<string, unknown>)[relatingAttr] = relating;
			(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcOrganization")];
			expectPass(type, "WR1", rel);
		}
	});
	test("fail: relating object also appears in RelatedObjects", () => {
		for (const [type, relatingAttr] of cases) {
			const relating = create("IfcActor");
			const rel = create(type);
			(rel as unknown as Record<string, unknown>)[relatingAttr] = relating;
			(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [relating];
			expectFail(type, "WR1", rel);
		}
	});
});

describe("IfcRelAssociates.WR21", () => {
	test("pass: every member is an IfcObjectDefinition or IfcPropertyDefinition", () => {
		const rel = create("IfcRelAssociates");
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [
			create("IfcProject"),
			create("IfcPropertySet"),
		];
		expectPass("IfcRelAssociates", "WR21", rel);
	});
	test("fail: a member is neither", () => {
		const rel = create("IfcRelAssociates");
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcRelAggregates")];
		expectFail("IfcRelAssociates", "WR21", rel);
	});
});

describe("IfcRelAssociatesMaterial.WR21/WR22", () => {
	function rel(relatedObjects: EntityInstance[]): EntityInstance {
		const r = create("IfcRelAssociatesMaterial");
		(r as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = relatedObjects;
		return r;
	}
	test("WR21 pass: no member is an IfcFeatureElementSubtraction or IfcVirtualElement", () => {
		expectPass("IfcRelAssociatesMaterial", "WR21", rel([create("IfcWall")]));
	});
	test("WR21 fail: a member is an IfcVirtualElement", () => {
		expectFail("IfcRelAssociatesMaterial", "WR21", rel([create("IfcVirtualElement")]));
	});
	test("WR21 fail: a member is an IfcFeatureElementSubtraction", () => {
		expectFail("IfcRelAssociatesMaterial", "WR21", rel([create("IfcOpeningElement")]));
	});
	test("WR22 pass: every member is an IfcProduct or IfcTypeProduct", () => {
		expectPass("IfcRelAssociatesMaterial", "WR22", rel([create("IfcWall"), create("IfcWallType")]));
	});
	test("WR22 fail: a member is neither", () => {
		expectFail("IfcRelAssociatesMaterial", "WR22", rel([create("IfcActor")]));
	});
});

describe("IfcRelConnectsElements.WR31", () => {
	test("pass/fail: RelatingElement != RelatedElement", () => {
		const rel1 = create("IfcRelConnectsElements");
		(rel1 as unknown as { RelatingElement: EntityInstance }).RelatingElement = create("IfcWall");
		(rel1 as unknown as { RelatedElement: EntityInstance }).RelatedElement = create("IfcSlab");
		expectPass("IfcRelConnectsElements", "WR31", rel1);

		const shared = create("IfcWall");
		const rel2 = create("IfcRelConnectsElements");
		(rel2 as unknown as { RelatingElement: EntityInstance }).RelatingElement = shared;
		(rel2 as unknown as { RelatedElement: EntityInstance }).RelatedElement = shared;
		expectFail("IfcRelConnectsElements", "WR31", rel2);
	});
});

describe("IfcRelContainedInSpatialStructure.WR31 / IfcRelReferencedInSpatialStructure.WR31", () => {
	test("pass: no RelatedElements member is an IfcSpatialStructureElement", () => {
		const rel1 = create("IfcRelContainedInSpatialStructure");
		(rel1 as unknown as { RelatedElements: EntityInstance[] }).RelatedElements = [create("IfcWall")];
		expectPass("IfcRelContainedInSpatialStructure", "WR31", rel1);

		const rel2 = create("IfcRelReferencedInSpatialStructure");
		(rel2 as unknown as { RelatedElements: EntityInstance[] }).RelatedElements = [create("IfcWall")];
		expectPass("IfcRelReferencedInSpatialStructure", "WR31", rel2);
	});
	test("fail: a RelatedElements member is an IfcSpatialStructureElement", () => {
		const rel1 = create("IfcRelContainedInSpatialStructure");
		(rel1 as unknown as { RelatedElements: EntityInstance[] }).RelatedElements = [create("IfcBuildingStorey")];
		expectFail("IfcRelContainedInSpatialStructure", "WR31", rel1);

		const rel2 = create("IfcRelReferencedInSpatialStructure");
		(rel2 as unknown as { RelatedElements: EntityInstance[] }).RelatedElements = [create("IfcSite")];
		expectFail("IfcRelReferencedInSpatialStructure", "WR31", rel2);
	});
});

describe("IfcRelDecomposes.WR31", () => {
	test("pass/fail: RelatingObject not in RelatedObjects", () => {
		const rel1 = create("IfcRelDecomposes");
		const relating = create("IfcActor");
		(rel1 as unknown as { RelatingObject: EntityInstance }).RelatingObject = relating;
		(rel1 as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcOrganization")];
		expectPass("IfcRelDecomposes", "WR31", rel1);

		const shared = create("IfcActor");
		const rel2 = create("IfcRelDecomposes");
		(rel2 as unknown as { RelatingObject: EntityInstance }).RelatingObject = shared;
		(rel2 as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [shared];
		expectFail("IfcRelDecomposes", "WR31", rel2);
	});
});

describe("IfcRelNests.WR1", () => {
	test("pass: every RelatedObjects member shares RelatingObject's declared type set", () => {
		const rel = create("IfcRelNests");
		(rel as unknown as { RelatingObject: EntityInstance }).RelatingObject = create("IfcWall");
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcWall")];
		expectPass("IfcRelNests", "WR1", rel);
	});
	test("fail: a RelatedObjects member has a different declared type set", () => {
		const rel = create("IfcRelNests");
		(rel as unknown as { RelatingObject: EntityInstance }).RelatingObject = create("IfcWall");
		(rel as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcSlab")];
		expectFail("IfcRelNests", "WR1", rel);
	});
});

describe("IfcRelOverridesProperties.WR1", () => {
	test("pass/fail: RelatedObjects has exactly 1 member", () => {
		const rel1 = create("IfcRelOverridesProperties");
		(rel1 as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [create("IfcWall")];
		expectPass("IfcRelOverridesProperties", "WR1", rel1);

		const rel2 = create("IfcRelOverridesProperties");
		(rel2 as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = [];
		expectFail("IfcRelOverridesProperties", "WR1", rel2);
	});
});

describe("IfcRelSchedulesCostItems.WR11/WR12", () => {
	function rel(relatedObjects: EntityInstance[], relatingControl: EntityInstance | null): EntityInstance {
		const r = create("IfcRelSchedulesCostItems");
		(r as unknown as { RelatedObjects: EntityInstance[] }).RelatedObjects = relatedObjects;
		(r as unknown as { RelatingControl: EntityInstance | null }).RelatingControl = relatingControl;
		return r;
	}
	test("WR11 pass/fail: every RelatedObjects member is an IfcCostItem", () => {
		expectPass("IfcRelSchedulesCostItems", "WR11", rel([create("IfcCostItem")], null));
		expectFail("IfcRelSchedulesCostItems", "WR11", rel([create("IfcActor")], null));
	});
	test("WR12 pass/fail: RelatingControl is an IfcCostSchedule", () => {
		expectPass("IfcRelSchedulesCostItems", "WR12", rel([], create("IfcCostSchedule")));
		expectFail("IfcRelSchedulesCostItems", "WR12", rel([], create("IfcWorkPlan")));
	});
});

describe("IfcRelSequence.WR1", () => {
	test("pass/fail: RelatingProcess != RelatedProcess", () => {
		const rel1 = create("IfcRelSequence");
		(rel1 as unknown as { RelatingProcess: EntityInstance }).RelatingProcess = create("IfcTask");
		(rel1 as unknown as { RelatedProcess: EntityInstance }).RelatedProcess = create("IfcProcedure");
		expectPass("IfcRelSequence", "WR1", rel1);

		const shared = create("IfcTask");
		const rel2 = create("IfcRelSequence");
		(rel2 as unknown as { RelatingProcess: EntityInstance }).RelatingProcess = shared;
		(rel2 as unknown as { RelatedProcess: EntityInstance }).RelatedProcess = shared;
		expectFail("IfcRelSequence", "WR1", rel2);
	});
});

describe("IfcRelSpaceBoundary.WR1", () => {
	function boundary(physicalOrVirtual: string, relatedBuildingElement: EntityInstance | null): EntityInstance {
		const b = create("IfcRelSpaceBoundary");
		(b as unknown as { PhysicalOrVirtualBoundary: string }).PhysicalOrVirtualBoundary = physicalOrVirtual;
		(b as unknown as { RelatedBuildingElement: EntityInstance | null }).RelatedBuildingElement = relatedBuildingElement;
		return b;
	}
	test("pass: Physical with a non-virtual RelatedBuildingElement", () => {
		expectPass("IfcRelSpaceBoundary", "WR1", boundary("PHYSICAL", create("IfcWall")));
	});
	test("fail: Physical with no RelatedBuildingElement", () => {
		expectFail("IfcRelSpaceBoundary", "WR1", boundary("PHYSICAL", null));
	});
	test("fail: Physical with a virtual RelatedBuildingElement", () => {
		expectFail("IfcRelSpaceBoundary", "WR1", boundary("PHYSICAL", create("IfcVirtualElement")));
	});
	test("pass: Virtual with no RelatedBuildingElement", () => {
		expectPass("IfcRelSpaceBoundary", "WR1", boundary("VIRTUAL", null));
	});
	test("pass: Virtual with an IfcVirtualElement", () => {
		expectPass("IfcRelSpaceBoundary", "WR1", boundary("VIRTUAL", create("IfcVirtualElement")));
	});
	test("fail: Virtual with a non-virtual RelatedBuildingElement", () => {
		expectFail("IfcRelSpaceBoundary", "WR1", boundary("VIRTUAL", create("IfcWall")));
	});
	test("pass: NotDefined regardless of RelatedBuildingElement", () => {
		expectPass("IfcRelSpaceBoundary", "WR1", boundary("NOTDEFINED", null));
	});
});

describe("IfcRevolvedAreaSolid.WR31/WR32", () => {
	function axis1(coords: number[], ratios: number[]): EntityInstance {
		const a = create("IfcAxis1Placement");
		(a as unknown as { Location: EntityInstance }).Location = point(coords);
		(a as unknown as { Axis: EntityInstance }).Axis = direction(ratios);
		return a;
	}
	test("WR31 pass/fail: Axis.Location's 3rd coordinate must equal 0", () => {
		const solid1 = create("IfcRevolvedAreaSolid");
		(solid1 as unknown as { Axis: EntityInstance }).Axis = axis1([0, 0, 0], [0, 0, 1]);
		expectPass("IfcRevolvedAreaSolid", "WR31", solid1);

		const solid2 = create("IfcRevolvedAreaSolid");
		(solid2 as unknown as { Axis: EntityInstance }).Axis = axis1([0, 0, 5], [0, 0, 1]);
		expectFail("IfcRevolvedAreaSolid", "WR31", solid2);
	});
	test("WR32 pass/fail: Axis.Z's (derived) 3rd direction ratio must equal 0", () => {
		const solid1 = create("IfcRevolvedAreaSolid");
		(solid1 as unknown as { Axis: EntityInstance }).Axis = axis1([0, 0, 0], [1, 0, 0]);
		expectPass("IfcRevolvedAreaSolid", "WR32", solid1);

		const solid2 = create("IfcRevolvedAreaSolid");
		(solid2 as unknown as { Axis: EntityInstance }).Axis = axis1([0, 0, 0], [0, 0, 1]);
		expectFail("IfcRevolvedAreaSolid", "WR32", solid2);
	});
});

describe("IfcRoundedRectangleProfileDef.WR31", () => {
	test("pass/fail: RoundingRadius <= half of both XDim and YDim", () => {
		const p1 = create("IfcRoundedRectangleProfileDef");
		(p1 as unknown as { XDim: number }).XDim = 10;
		(p1 as unknown as { YDim: number }).YDim = 10;
		(p1 as unknown as { RoundingRadius: number }).RoundingRadius = 5;
		expectPass("IfcRoundedRectangleProfileDef", "WR31", p1);

		const p2 = create("IfcRoundedRectangleProfileDef");
		(p2 as unknown as { XDim: number }).XDim = 10;
		(p2 as unknown as { YDim: number }).YDim = 10;
		(p2 as unknown as { RoundingRadius: number }).RoundingRadius = 6;
		expectFail("IfcRoundedRectangleProfileDef", "WR31", p2);
	});
});

describe("IfcSectionedSpine.WR1/WR2/WR3", () => {
	function crossSection(profileType: string): EntityInstance {
		const cs = create("IfcArbitraryClosedProfileDef");
		(cs as unknown as { ProfileType: string }).ProfileType = profileType;
		return cs;
	}
	test("WR1 pass/fail: CrossSections and CrossSectionPositions have the same size", () => {
		const spine1 = create("IfcSectionedSpine");
		(spine1 as unknown as { CrossSections: EntityInstance[] }).CrossSections = [
			crossSection("AREA"),
			crossSection("AREA"),
		];
		(spine1 as unknown as { CrossSectionPositions: EntityInstance[] }).CrossSectionPositions = [
			create("IfcAxis2Placement3D"),
			create("IfcAxis2Placement3D"),
		];
		expectPass("IfcSectionedSpine", "WR1", spine1);

		const spine2 = create("IfcSectionedSpine");
		(spine2 as unknown as { CrossSections: EntityInstance[] }).CrossSections = [crossSection("AREA")];
		(spine2 as unknown as { CrossSectionPositions: EntityInstance[] }).CrossSectionPositions = [
			create("IfcAxis2Placement3D"),
			create("IfcAxis2Placement3D"),
		];
		expectFail("IfcSectionedSpine", "WR1", spine2);
	});
	test("WR2 pass/fail: every CrossSections member shares the first member's ProfileType", () => {
		const spine1 = create("IfcSectionedSpine");
		(spine1 as unknown as { CrossSections: EntityInstance[] }).CrossSections = [
			crossSection("AREA"),
			crossSection("AREA"),
		];
		expectPass("IfcSectionedSpine", "WR2", spine1);

		const spine2 = create("IfcSectionedSpine");
		(spine2 as unknown as { CrossSections: EntityInstance[] }).CrossSections = [
			crossSection("AREA"),
			crossSection("CURVE"),
		];
		expectFail("IfcSectionedSpine", "WR2", spine2);
	});
	test("WR3 pass/fail: SpineCurve.Dim must equal 3", () => {
		const spine1 = create("IfcSectionedSpine");
		(spine1 as unknown as { SpineCurve: EntityInstance }).SpineCurve = polyline([point([0, 0, 0]), point([1, 0, 0])]);
		expectPass("IfcSectionedSpine", "WR3", spine1);

		const spine2 = create("IfcSectionedSpine");
		(spine2 as unknown as { SpineCurve: EntityInstance }).SpineCurve = polyline([point([0, 0]), point([1, 0])]);
		expectFail("IfcSectionedSpine", "WR3", spine2);
	});
});

describe("IfcServiceLifeFactor.WR31", () => {
	// A genuine, confirmed real-schema finding (not a Python bug, an inherent schema
	// fact): real `IfcServiceLifeFactor` is a subtype of `IfcResourceLevelInformation`
	// (`GlobalId`/`OwnerHistory`/`Name`/`Description`/`PredefinedType`/`UpperValue`/
	// `MostUsedValue`/`LowerValue`, confirmed directly against this port's own native
	// schema introspection -- NOT a subtype of `IfcObject`), so it has NO `ObjectType`
	// attribute at all. `express_getattr(self, 'ObjectType', INDETERMINATE)` therefore
	// always resolves to `INDETERMINATE` in both real Python (`getattr(obj, name,
	// default)`'s own 3-arg form silently catches the `AttributeError` a genuinely
	// undeclared attribute name raises) and this port (`expressGetAttr`'s own try/catch,
	// see its doc comment) -- meaning `exists(ObjectType)` can never be `true`, and this
	// rule's own `... or exists(ObjectType)` escape hatch is PERMANENTLY unreachable for
	// any real instance. This port's `.set()` throws immediately for a genuinely
	// undeclared attribute name (unlike the read path's graceful catch), so a
	// "USERDEFINED with ObjectType given" pass fixture cannot even be constructed --
	// only the 2 fixtures below are real, reachable cases.
	test("pass/fail", () => {
		const p1 = create("IfcServiceLifeFactor");
		(p1 as unknown as { PredefinedType: string }).PredefinedType = "A_QUALITYOFCOMPONENTS";
		expectPass("IfcServiceLifeFactor", "WR31", p1);

		const p2 = create("IfcServiceLifeFactor");
		(p2 as unknown as { PredefinedType: string }).PredefinedType = "USERDEFINED";
		expectFail("IfcServiceLifeFactor", "WR31", p2);
	});
});

describe("IfcShapeModel.WR11", () => {
	function shapeAspectFor(target: EntityInstance): void {
		const aspect = create("IfcShapeAspect");
		(aspect as unknown as { ShapeRepresentations: EntityInstance[] }).ShapeRepresentations = [target];
	}
	function productRepresentationFor(target: EntityInstance): void {
		const pr = create("IfcProductDefinitionShape");
		(pr as unknown as { Representations: EntityInstance[] }).Representations = [target];
	}
	test("pass: exactly one of OfProductRepresentation/RepresentationMap/OfShapeAspect is set", () => {
		const model = create("IfcShapeModel");
		shapeAspectFor(model);
		expectPass("IfcShapeModel", "WR11", model);
	});
	test("fail: none of the three is set", () => {
		expectFail("IfcShapeModel", "WR11", create("IfcShapeModel"));
	});
	test("fail: two of the three are set", () => {
		const model = create("IfcShapeModel");
		shapeAspectFor(model);
		productRepresentationFor(model);
		expectFail("IfcShapeModel", "WR11", model);
	});
});

describe("IfcShapeRepresentation.WR21/WR22/WR23/WR24", () => {
	test("WR21 pass/fail: ContextOfItems must be an IfcGeometricRepresentationContext", () => {
		const rep1 = create("IfcShapeRepresentation");
		(rep1 as unknown as { ContextOfItems: EntityInstance }).ContextOfItems = create(
			"IfcGeometricRepresentationContext",
		);
		expectPass("IfcShapeRepresentation", "WR21", rep1);

		const rep2 = create("IfcShapeRepresentation");
		(rep2 as unknown as { ContextOfItems: EntityInstance }).ContextOfItems = create("IfcProject");
		expectFail("IfcShapeRepresentation", "WR21", rep2);
	});
	test("WR22 pass/fail: every IfcTopologicalRepresentationItem member of Items is exactly one of IfcVertexPoint/IfcEdgeCurve/IfcFaceSurface", () => {
		const rep1 = create("IfcShapeRepresentation");
		(rep1 as unknown as { Items: EntityInstance[] }).Items = [create("IfcVertexPoint")];
		expectPass("IfcShapeRepresentation", "WR22", rep1);

		const rep2 = create("IfcShapeRepresentation");
		(rep2 as unknown as { Items: EntityInstance[] }).Items = [create("IfcEdgeLoop")];
		expectFail("IfcShapeRepresentation", "WR22", rep2);
	});
	test("WR23 pass/fail: RepresentationType must be given", () => {
		const rep1 = create("IfcShapeRepresentation");
		(rep1 as unknown as { RepresentationType: string }).RepresentationType = "Curve2D";
		expectPass("IfcShapeRepresentation", "WR23", rep1);
		expectFail("IfcShapeRepresentation", "WR23", create("IfcShapeRepresentation"));
	});
	test("WR24 pass/fail: Items must match the declared RepresentationType (Curve2D branch)", () => {
		const rep1 = create("IfcShapeRepresentation");
		(rep1 as unknown as { RepresentationType: string }).RepresentationType = "Curve2D";
		(rep1 as unknown as { Items: EntityInstance[] }).Items = [polyline([point([0, 0]), point([1, 0])])];
		expectPass("IfcShapeRepresentation", "WR24", rep1);

		const rep2 = create("IfcShapeRepresentation");
		(rep2 as unknown as { RepresentationType: string }).RepresentationType = "Curve2D";
		(rep2 as unknown as { Items: EntityInstance[] }).Items = [polyline([point([0, 0, 0]), point([1, 0, 0])])];
		expectFail("IfcShapeRepresentation", "WR24", rep2);
	});
	test("WR24 pass: an undocumented RepresentationType keyword always passes (INDETERMINATE fallthrough)", () => {
		const rep = create("IfcShapeRepresentation");
		(rep as unknown as { RepresentationType: string }).RepresentationType = "SomeUndocumentedKeyword";
		(rep as unknown as { Items: EntityInstance[] }).Items = [];
		expectPass("IfcShapeRepresentation", "WR24", rep);
	});
});

describe("IfcSlab.WR61", () => {
	test("pass/fail", () => {
		expectPass("IfcSlab", "WR61", create("IfcSlab"));
		expectPass("IfcSlab", "WR61", enumFixture("IfcSlab", "PredefinedType", "FLOOR", "ObjectType", null));
		expectPass("IfcSlab", "WR61", enumFixture("IfcSlab", "PredefinedType", "USERDEFINED", "ObjectType", "X"));
		expectFail("IfcSlab", "WR61", enumFixture("IfcSlab", "PredefinedType", "USERDEFINED", "ObjectType", null));
	});
});

describe("IfcSpaceHeaterType.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcSpaceHeaterType", "WR1", userDefinedFixture("IfcSpaceHeaterType", "CONVECTOR", null));
		expectFail("IfcSpaceHeaterType", "WR1", userDefinedFixture("IfcSpaceHeaterType", "USERDEFINED", null));
	});
});

describe("IfcSpatialStructureElement.WR41", () => {
	test("pass: decomposed by exactly 1 IfcRelAggregates whose RelatingObject is an IfcProject", () => {
		const storey = create("IfcBuildingStorey");
		decomposeRelationship(create("IfcProject"), [storey]);
		expectPass("IfcSpatialStructureElement", "WR41", storey);
	});
	test("pass: decomposed by exactly 1 IfcRelAggregates whose RelatingObject is an IfcSpatialStructureElement", () => {
		const storey = create("IfcBuildingStorey");
		decomposeRelationship(create("IfcBuilding"), [storey]);
		expectPass("IfcSpatialStructureElement", "WR41", storey);
	});
	test("fail: not decomposed at all", () => {
		expectFail("IfcSpatialStructureElement", "WR41", create("IfcBuildingStorey"));
	});
	test("fail: decomposed by something other than IfcRelAggregates", () => {
		const storey = create("IfcBuildingStorey");
		decomposeRelationship(create("IfcProject"), [storey], "IfcRelNests");
		expectFail("IfcSpatialStructureElement", "WR41", storey);
	});
	test("fail: RelatingObject is neither an IfcProject nor an IfcSpatialStructureElement", () => {
		const storey = create("IfcBuildingStorey");
		decomposeRelationship(create("IfcWall"), [storey]);
		expectFail("IfcSpatialStructureElement", "WR41", storey);
	});
});

describe("IfcStructuralLinearAction.WR61 / IfcStructuralPlanarAction.WR61 / IfcStructuralPointAction.WR61 / IfcStructuralPointReaction.WR61", () => {
	function withAppliedLoad(type: string, appliedLoad: EntityInstance | null): EntityInstance {
		const e = create(type);
		(e as unknown as { AppliedLoad: EntityInstance | null }).AppliedLoad = appliedLoad;
		return e;
	}
	test("pass: AppliedLoad is exactly one of the 2 named types", () => {
		expectPass(
			"IfcStructuralLinearAction",
			"WR61",
			withAppliedLoad("IfcStructuralLinearAction", create("IfcStructuralLoadLinearForce")),
		);
		expectPass(
			"IfcStructuralPlanarAction",
			"WR61",
			withAppliedLoad("IfcStructuralPlanarAction", create("IfcStructuralLoadPlanarForce")),
		);
		expectPass(
			"IfcStructuralPointAction",
			"WR61",
			withAppliedLoad("IfcStructuralPointAction", create("IfcStructuralLoadSingleForce")),
		);
		expectPass(
			"IfcStructuralPointReaction",
			"WR61",
			withAppliedLoad("IfcStructuralPointReaction", create("IfcStructuralLoadSingleDisplacement")),
		);
	});
	test("fail: AppliedLoad is not one of the 2 named types", () => {
		expectFail("IfcStructuralLinearAction", "WR61", withAppliedLoad("IfcStructuralLinearAction", create("IfcActor")));
		expectFail("IfcStructuralPlanarAction", "WR61", withAppliedLoad("IfcStructuralPlanarAction", create("IfcActor")));
		expectFail("IfcStructuralPointAction", "WR61", withAppliedLoad("IfcStructuralPointAction", create("IfcActor")));
		expectFail("IfcStructuralPointReaction", "WR61", withAppliedLoad("IfcStructuralPointReaction", create("IfcActor")));
	});
});

describe("IfcStructuralProfileProperties.WR21/WR22", () => {
	test("WR21 pass/fail: not exists(ShearDeformationAreaY) or >= 0", () => {
		expectPass("IfcStructuralProfileProperties", "WR21", create("IfcStructuralProfileProperties"));
		const bad = create("IfcStructuralProfileProperties");
		(bad as unknown as { ShearDeformationAreaY: number }).ShearDeformationAreaY = -1;
		expectFail("IfcStructuralProfileProperties", "WR21", bad);
	});
	test("WR22 pass/fail: not exists(ShearDeformationAreaZ) or >= 0", () => {
		expectPass("IfcStructuralProfileProperties", "WR22", create("IfcStructuralProfileProperties"));
		const bad = create("IfcStructuralProfileProperties");
		(bad as unknown as { ShearDeformationAreaZ: number }).ShearDeformationAreaZ = -1;
		expectFail("IfcStructuralProfileProperties", "WR22", bad);
	});
});

describe("IfcStructuralSteelProfileProperties.WR31/WR32", () => {
	test("WR31 pass/fail: not exists(ShearAreaY) or >= 0", () => {
		expectPass("IfcStructuralSteelProfileProperties", "WR31", create("IfcStructuralSteelProfileProperties"));
		const bad = create("IfcStructuralSteelProfileProperties");
		(bad as unknown as { ShearAreaY: number }).ShearAreaY = -1;
		expectFail("IfcStructuralSteelProfileProperties", "WR31", bad);
	});
	test("WR32 pass/fail: not exists(ShearAreaZ) or >= 0", () => {
		expectPass("IfcStructuralSteelProfileProperties", "WR32", create("IfcStructuralSteelProfileProperties"));
		const bad = create("IfcStructuralSteelProfileProperties");
		(bad as unknown as { ShearAreaZ: number }).ShearAreaZ = -1;
		expectFail("IfcStructuralSteelProfileProperties", "WR32", bad);
	});
});

describe("IfcStructuralSurfaceMemberVarying.WR61/WR62/WR63", () => {
	function shapeAspectWith(shapeReps: EntityInstance[]): EntityInstance {
		const aspect = create("IfcShapeAspect");
		(aspect as unknown as { ShapeRepresentations: EntityInstance[] }).ShapeRepresentations = shapeReps;
		return aspect;
	}
	function shapeRepWithItems(items: EntityInstance[]): EntityInstance {
		const rep = create("IfcShapeRepresentation");
		(rep as unknown as { Items: EntityInstance[] }).Items = items;
		return rep;
	}
	test("WR61 pass/fail: Thickness must be given", () => {
		const m1 = create("IfcStructuralSurfaceMemberVarying");
		(m1 as unknown as { Thickness: number }).Thickness = 5;
		expectPass("IfcStructuralSurfaceMemberVarying", "WR61", m1);
		expectFail("IfcStructuralSurfaceMemberVarying", "WR61", create("IfcStructuralSurfaceMemberVarying"));
	});
	test("WR62 pass/fail: every VaryingThicknessLocation.ShapeRepresentations member has exactly 1 Items member", () => {
		const m1 = create("IfcStructuralSurfaceMemberVarying");
		(m1 as unknown as { VaryingThicknessLocation: EntityInstance }).VaryingThicknessLocation = shapeAspectWith([
			shapeRepWithItems([point([0, 0, 0])]),
		]);
		expectPass("IfcStructuralSurfaceMemberVarying", "WR62", m1);

		const m2 = create("IfcStructuralSurfaceMemberVarying");
		(m2 as unknown as { VaryingThicknessLocation: EntityInstance }).VaryingThicknessLocation = shapeAspectWith([
			shapeRepWithItems([point([0, 0, 0]), point([1, 0, 0])]),
		]);
		expectFail("IfcStructuralSurfaceMemberVarying", "WR62", m2);
	});
	test("WR63 pass/fail: every VaryingThicknessLocation.ShapeRepresentations member's Items[1] is an IfcCartesianPoint or IfcPointOnSurface", () => {
		const m1 = create("IfcStructuralSurfaceMemberVarying");
		(m1 as unknown as { VaryingThicknessLocation: EntityInstance }).VaryingThicknessLocation = shapeAspectWith([
			shapeRepWithItems([point([0, 0, 0])]),
		]);
		expectPass("IfcStructuralSurfaceMemberVarying", "WR63", m1);

		const m2 = create("IfcStructuralSurfaceMemberVarying");
		(m2 as unknown as { VaryingThicknessLocation: EntityInstance }).VaryingThicknessLocation = shapeAspectWith([
			shapeRepWithItems([create("IfcPolyLoop")]),
		]);
		expectFail("IfcStructuralSurfaceMemberVarying", "WR63", m2);
	});
});

describe("IfcStructuredDimensionCallout.WR31", () => {
	test("pass: a confirmed always-passing dead rule (real upstream lowercase-attribute typo, see whereRules/ifc2x3.ts's own header comment) -- passes regardless of Contents", () => {
		expectPass("IfcStructuredDimensionCallout", "WR31", create("IfcStructuredDimensionCallout"));

		const callout = create("IfcStructuredDimensionCallout");
		(callout as unknown as { Contents: EntityInstance[] }).Contents = [create("IfcAnnotationTextOccurrence")];
		expectPass("IfcStructuredDimensionCallout", "WR31", callout);
	});
});

describe("IfcStyledItem.WR11/WR12", () => {
	test("WR11 pass/fail: Styles must have exactly 1 member", () => {
		const s1 = create("IfcStyledItem");
		(s1 as unknown as { Styles: EntityInstance[] }).Styles = [create("IfcActor")];
		expectPass("IfcStyledItem", "WR11", s1);
		const s2 = create("IfcStyledItem");
		(s2 as unknown as { Styles: EntityInstance[] }).Styles = [];
		expectFail("IfcStyledItem", "WR11", s2);
	});
	test("WR12 pass/fail: Item must not itself be an IfcStyledItem", () => {
		const s1 = create("IfcStyledItem");
		(s1 as unknown as { Item: EntityInstance }).Item = point([0, 0]);
		expectPass("IfcStyledItem", "WR12", s1);
		const s2 = create("IfcStyledItem");
		(s2 as unknown as { Item: EntityInstance }).Item = create("IfcStyledItem");
		expectFail("IfcStyledItem", "WR12", s2);
	});
});

describe("IfcStyledRepresentation.WR21", () => {
	test("pass/fail: every Items member must be an IfcStyledItem", () => {
		const rep1 = create("IfcStyledRepresentation");
		(rep1 as unknown as { Items: EntityInstance[] }).Items = [create("IfcStyledItem")];
		expectPass("IfcStyledRepresentation", "WR21", rep1);
		const rep2 = create("IfcStyledRepresentation");
		(rep2 as unknown as { Items: EntityInstance[] }).Items = [point([0, 0])];
		expectFail("IfcStyledRepresentation", "WR21", rep2);
	});
});

describe("IfcSurfaceOfLinearExtrusion.WR41", () => {
	test("pass/fail: Depth > 0", () => {
		const s1 = create("IfcSurfaceOfLinearExtrusion");
		(s1 as unknown as { Depth: number }).Depth = 1;
		expectPass("IfcSurfaceOfLinearExtrusion", "WR41", s1);
		const s2 = create("IfcSurfaceOfLinearExtrusion");
		(s2 as unknown as { Depth: number }).Depth = 0;
		expectFail("IfcSurfaceOfLinearExtrusion", "WR41", s2);
	});
});

describe("IfcSurfaceStyle.WR11/WR12/WR13/WR14/WR15", () => {
	function surfaceStyleWith(styles: EntityInstance[]): EntityInstance {
		const s = create("IfcSurfaceStyle");
		(s as unknown as { Styles: EntityInstance[] }).Styles = styles;
		return s;
	}
	test("pass: at most 1 of each named style kind", () => {
		expectPass("IfcSurfaceStyle", "WR11", surfaceStyleWith([create("IfcSurfaceStyleShading")]));
		expectPass("IfcSurfaceStyle", "WR12", surfaceStyleWith([create("IfcSurfaceStyleLighting")]));
		expectPass("IfcSurfaceStyle", "WR13", surfaceStyleWith([create("IfcSurfaceStyleRefraction")]));
		expectPass("IfcSurfaceStyle", "WR14", surfaceStyleWith([create("IfcSurfaceStyleWithTextures")]));
		expectPass("IfcSurfaceStyle", "WR15", surfaceStyleWith([create("IfcExternallyDefinedSurfaceStyle")]));
	});
	test("fail: more than 1 of the same named style kind", () => {
		expectFail(
			"IfcSurfaceStyle",
			"WR11",
			surfaceStyleWith([create("IfcSurfaceStyleShading"), create("IfcSurfaceStyleShading")]),
		);
		expectFail(
			"IfcSurfaceStyle",
			"WR12",
			surfaceStyleWith([create("IfcSurfaceStyleLighting"), create("IfcSurfaceStyleLighting")]),
		);
		expectFail(
			"IfcSurfaceStyle",
			"WR13",
			surfaceStyleWith([create("IfcSurfaceStyleRefraction"), create("IfcSurfaceStyleRefraction")]),
		);
		expectFail(
			"IfcSurfaceStyle",
			"WR14",
			surfaceStyleWith([create("IfcSurfaceStyleWithTextures"), create("IfcSurfaceStyleWithTextures")]),
		);
		expectFail(
			"IfcSurfaceStyle",
			"WR15",
			surfaceStyleWith([create("IfcExternallyDefinedSurfaceStyle"), create("IfcExternallyDefinedSurfaceStyle")]),
		);
	});
});

describe("IfcSweptAreaSolid.WR22", () => {
	test("pass/fail: SweptArea.ProfileType must be AREA", () => {
		const s1 = create("IfcSweptAreaSolid");
		const profile1 = create("IfcArbitraryClosedProfileDef");
		(profile1 as unknown as { ProfileType: string }).ProfileType = "AREA";
		(s1 as unknown as { SweptArea: EntityInstance }).SweptArea = profile1;
		expectPass("IfcSweptAreaSolid", "WR22", s1);

		const s2 = create("IfcSweptAreaSolid");
		const profile2 = create("IfcArbitraryClosedProfileDef");
		(profile2 as unknown as { ProfileType: string }).ProfileType = "CURVE";
		(s2 as unknown as { SweptArea: EntityInstance }).SweptArea = profile2;
		expectFail("IfcSweptAreaSolid", "WR22", s2);
	});
});

describe("IfcSweptDiskSolid.WR1/WR2", () => {
	test("WR1 pass/fail: Directrix.Dim must equal 3", () => {
		const s1 = create("IfcSweptDiskSolid");
		(s1 as unknown as { Directrix: EntityInstance }).Directrix = polyline([point([0, 0, 0]), point([1, 0, 0])]);
		expectPass("IfcSweptDiskSolid", "WR1", s1);

		const s2 = create("IfcSweptDiskSolid");
		(s2 as unknown as { Directrix: EntityInstance }).Directrix = polyline([point([0, 0]), point([1, 0])]);
		expectFail("IfcSweptDiskSolid", "WR1", s2);
	});
	test("WR2 pass/fail: not exists(InnerRadius) or Radius > InnerRadius", () => {
		const s1 = create("IfcSweptDiskSolid");
		(s1 as unknown as { Radius: number }).Radius = 5;
		expectPass("IfcSweptDiskSolid", "WR2", s1);

		const s2 = create("IfcSweptDiskSolid");
		(s2 as unknown as { Radius: number }).Radius = 5;
		(s2 as unknown as { InnerRadius: number }).InnerRadius = 6;
		expectFail("IfcSweptDiskSolid", "WR2", s2);
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
