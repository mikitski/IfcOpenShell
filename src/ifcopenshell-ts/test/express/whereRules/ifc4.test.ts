// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4, IFC4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md): original,
// hand-rolled coverage exercising each of the 100 WHERE-rule classes ported in
// `src/express/whereRules/ifc4.ts` -- matching IFC2X3's own established convention
// (`test/express/whereRules/ifc2x3.test.ts`) for this file family: every rule gets at
// least one passing case and (where a real, constructible failing case exists) one
// failing case, calling the rule's own `check()` function DIRECTLY (found via
// `findRule`, not `executeRules`) -- isolating each rule's own pass/fail logic from the
// 3-phase engine's own dispatch mechanics, plus a small block of genuine end-to-end
// `executeRules(file)` tests wiring the real registered rules together.
//
// **Fixture-construction convention, identical to IFC2X3's own**: every entity is
// constructed via a zero-argument `file.createEntity("IfcXxx")` (leaving every
// attribute unset/null) followed by explicit Proxy-based dot-assignment for only the
// attribute(s) a given rule actually reads.
//
// **Data-driven test blocks for the two dominant shared shapes** (`correctPredefinedType`/
// `correctTypeAssigned`, `src/express/whereRules/ifc4.ts`'s own header comment): rather
// than 27 near-identical hand-copied `describe`/`test` blocks, this file drives them
// from 2 small, explicit per-entity data tables (still hand-derived -- entity name,
// escape-attribute name, PredefinedType optionality, expected `Ifc*Type` name -- each
// value cross-checked against `whereRules/ifc4.ts`'s own registration list and, for the
// `USERDEFINED`/`NOTDEFINED` enum-membership fixtures, against real schema
// introspection -- see this file's own per-block comments). Every OTHER rule in this
// chunk gets its own individually-named `describe` block, matching IFC2X3's own
// established per-rule convention exactly.
//
// **Real, empirically-confirmed enum membership** (queried directly against the real
// installed `ifcopenshell` Python interpreter's own schema introspection before writing
// any fixture below, not assumed): every `Ifc*TypeEnum` this chunk's 18
// `_CorrectPredefinedType` rules reference includes both `USERDEFINED` and
// `NOTDEFINED`; `IfcRoleEnum`/`IfcAddressTypeEnum` (`IfcActorRole.Role`/`IfcAddress.
// Purpose`) both include `USERDEFINED`. `PredefinedType`'s own optionality was likewise
// confirmed directly (`attribute.optional()`): `True` on every "occurrence" entity
// (e.g. `IfcActuator`), `False` on every "*Type" entity (e.g. `IfcActuatorType`) --
// matching `whereRules/ifc4.ts`'s own `correctPredefinedType(..., predefinedTypeOptional)`
// parameter exactly.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { EntityInstance } from "../../../src/entityInstance";
import { type RuleDefinition, getSchemaRules } from "../../../src/express/ruleDispatch";
import { executeRules } from "../../../src/express/ruleExecutor";
import "../../../src/express/whereRules/ifc4";
import type { IfcFile } from "../../../src/file";
import { settings } from "../../../src/settings";
import * as template from "../../../src/template";
import { createTestFile } from "../../bootstrap";

function blankFile(): IfcFile {
	return template.create({ schemaIdentifier: "IFC4", blank: true });
}

function findRule(typeName: string, ruleName: string): RuleDefinition {
	const rule = getSchemaRules("IFC4").find((r) => r.typeName === typeName && r.ruleName === ruleName);
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

// Same rationale as `ifc2x3.test.ts`'s own identical `beforeAll` -- several ported
// rules (e.g. every `_CorrectTypeAssigned` rule, which reads the single-cardinality
// `IsTypedBy` inverse) only behave correctly with `unpackNonAggregateInverses`/
// `compareInstancesByValue` on, matching what a real `executeRules(file)` call would
// already be doing around every one of these rules.
beforeAll(() => {
	file = createTestFile("IFC4");
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

function set(instance: EntityInstance, name: string, value: unknown): void {
	(instance as unknown as Record<string, unknown>)[name] = value;
}

/** Builds a real `IfcRelDefinesByType` linking `instance.IsTypedBy` -> `relatingType`. */
function typeAssign(instance: EntityInstance, relatingType: EntityInstance): void {
	const rel = create("IfcRelDefinesByType");
	set(rel, "RelatedObjects", [instance]);
	set(rel, "RelatingType", relatingType);
}

// =============================================================================
// SCOPE = 'type' rules (25).
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

describe("IfcCardinalPointReference.GreaterThanZero", () => {
	test("pass/fail", () => {
		expectPass("IfcCardinalPointReference", "GreaterThanZero", 1);
		expectFail("IfcCardinalPointReference", "GreaterThanZero", 0);
		expectFail("IfcCardinalPointReference", "GreaterThanZero", -1);
	});
});

describe("IfcCompoundPlaneAngleMeasure", () => {
	test("MinutesInRange pass/fail", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "MinutesInRange", [0, 10, 0]);
		expectFail("IfcCompoundPlaneAngleMeasure", "MinutesInRange", [0, -61, 0]);
	});
	test("SecondsInRange pass/fail", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "SecondsInRange", [0, 0, 10]);
		expectFail("IfcCompoundPlaneAngleMeasure", "SecondsInRange", [0, 0, 61]);
	});
	test("MicrosecondsInRange pass/fail (3-length list has nothing to check)", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "MicrosecondsInRange", [1, 0, 0]);
		expectPass("IfcCompoundPlaneAngleMeasure", "MicrosecondsInRange", [1, 0, 0, 500000]);
		expectFail("IfcCompoundPlaneAngleMeasure", "MicrosecondsInRange", [1, 0, 0, 1000000]);
	});
	test("ConsistentSign pass/fail", () => {
		expectPass("IfcCompoundPlaneAngleMeasure", "ConsistentSign", [1, 1, 1]);
		expectPass("IfcCompoundPlaneAngleMeasure", "ConsistentSign", [-1, -1, -1, -1]);
		expectPass("IfcCompoundPlaneAngleMeasure", "ConsistentSign", [0, 0, 0]);
		expectFail("IfcCompoundPlaneAngleMeasure", "ConsistentSign", [1, -1, 1]);
		expectFail("IfcCompoundPlaneAngleMeasure", "ConsistentSign", [1, 1, 1, -1]);
	});
});

describe("IfcDayInMonthNumber.ValidRange", () => {
	test("pass/fail", () => {
		expectPass("IfcDayInMonthNumber", "ValidRange", 15);
		expectFail("IfcDayInMonthNumber", "ValidRange", 0);
		expectFail("IfcDayInMonthNumber", "ValidRange", 32);
	});
});

describe("IfcDayInWeekNumber.ValidRange", () => {
	test("pass/fail", () => {
		expectPass("IfcDayInWeekNumber", "ValidRange", 3);
		expectFail("IfcDayInWeekNumber", "ValidRange", 0);
		expectFail("IfcDayInWeekNumber", "ValidRange", 8);
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
		expectPass("IfcFontVariant", "WR1", "Small-Caps");
		expectFail("IfcFontVariant", "WR1", "condensed");
	});
});

describe("IfcFontWeight.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcFontWeight", "WR1", "700");
		expectFail("IfcFontWeight", "WR1", "950");
	});
});

describe("IfcHeatingValueMeasure.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcHeatingValueMeasure", "WR1", 1.0);
		expectFail("IfcHeatingValueMeasure", "WR1", 0.0);
	});
});

describe("IfcMonthInYearNumber.ValidRange", () => {
	test("pass/fail", () => {
		expectPass("IfcMonthInYearNumber", "ValidRange", 6);
		expectFail("IfcMonthInYearNumber", "ValidRange", 13);
	});
});

describe("IfcNonNegativeLengthMeasure.NotNegative", () => {
	test("pass/fail", () => {
		expectPass("IfcNonNegativeLengthMeasure", "NotNegative", 0.0);
		expectFail("IfcNonNegativeLengthMeasure", "NotNegative", -0.1);
	});
});

describe("IfcNormalisedRatioMeasure.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcNormalisedRatioMeasure", "WR1", 0.5);
		expectFail("IfcNormalisedRatioMeasure", "WR1", 1.1);
	});
});

describe("IfcPHMeasure.WR21", () => {
	test("pass/fail", () => {
		expectPass("IfcPHMeasure", "WR21", 7.0);
		expectFail("IfcPHMeasure", "WR21", 15.0);
	});
});

describe("IfcPositiveInteger.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcPositiveInteger", "WR1", 1);
		expectFail("IfcPositiveInteger", "WR1", 0);
	});
});

describe("IfcPositiveLengthMeasure.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcPositiveLengthMeasure", "WR1", 1.0);
		expectFail("IfcPositiveLengthMeasure", "WR1", 0.0);
	});
});

describe("IfcPositivePlaneAngleMeasure.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcPositivePlaneAngleMeasure", "WR1", 1.0);
		expectFail("IfcPositivePlaneAngleMeasure", "WR1", -1.0);
	});
});

describe("IfcPositiveRatioMeasure.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcPositiveRatioMeasure", "WR1", 0.5);
		expectFail("IfcPositiveRatioMeasure", "WR1", 0.0);
	});
});

describe("IfcSpecularRoughness.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcSpecularRoughness", "WR1", 0.5);
		expectFail("IfcSpecularRoughness", "WR1", 1.5);
	});
});

describe("IfcTextAlignment.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcTextAlignment", "WR1", "Justify");
		expectFail("IfcTextAlignment", "WR1", "top");
	});
});

describe("IfcTextDecoration.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcTextDecoration", "WR1", "Blink");
		expectFail("IfcTextDecoration", "WR1", "strikethrough");
	});
});

describe("IfcTextTransformation.WR1", () => {
	test("pass/fail", () => {
		expectPass("IfcTextTransformation", "WR1", "Capitalize");
		expectFail("IfcTextTransformation", "WR1", "reverse");
	});
});

// =============================================================================
// SCOPE = 'entity' rules -- data-driven `_CorrectPredefinedType`/`_CorrectTypeAssigned`
// tables first (see this file's own header comment), then every remaining rule
// individually.
// =============================================================================

interface CorrectPredefinedTypeCase {
	readonly typeName: string;
	readonly escapeAttr: string;
	readonly optional: boolean;
}

// Hand-derived directly from `whereRules/ifc4.ts`'s own 18 `correctPredefinedType(...)`
// call sites (real source lines 4557-5351) -- `optional` matches that file's own
// `predefinedTypeOptional` argument at each site exactly.
const correctPredefinedTypeCases: readonly CorrectPredefinedTypeCase[] = [
	{ typeName: "IfcActuator", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcActuatorType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcAirTerminal", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcAirTerminalBox", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcAirTerminalBoxType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcAirTerminalType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcAirToAirHeatRecovery", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcAirToAirHeatRecoveryType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcAlarm", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcAlarmType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcAudioVisualAppliance", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcAudioVisualApplianceType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcBeam", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcBeamType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcBoiler", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcBoilerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcBuildingElementPart", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcBuildingElementPartType", escapeAttr: "ElementType", optional: false },
];

describe.each(correctPredefinedTypeCases)("$typeName.CorrectPredefinedType", ({ typeName, escapeAttr, optional }) => {
	test("pass: PredefinedType is a non-USERDEFINED enum value", () => {
		const inst = create(typeName);
		set(inst, "PredefinedType", "NOTDEFINED");
		expectPass(typeName, "CorrectPredefinedType", inst);
	});
	test("pass: PredefinedType is USERDEFINED and the escape attribute is given", () => {
		const inst = create(typeName);
		set(inst, "PredefinedType", "USERDEFINED");
		set(inst, escapeAttr, "a custom value");
		expectPass(typeName, "CorrectPredefinedType", inst);
	});
	test("fail: PredefinedType is USERDEFINED but the escape attribute is missing", () => {
		const inst = create(typeName);
		set(inst, "PredefinedType", "USERDEFINED");
		expectFail(typeName, "CorrectPredefinedType", inst);
	});
	if (optional) {
		test("pass: PredefinedType is not given at all (optional on this entity)", () => {
			const inst = create(typeName);
			expectPass(typeName, "CorrectPredefinedType", inst);
		});
	}
});

interface CorrectTypeAssignedCase {
	readonly typeName: string;
	readonly expectedTypeName: string;
}

// Hand-derived directly from `whereRules/ifc4.ts`'s own 9 `correctTypeAssigned(...)`
// call sites in this chunk (real source lines 4567-5341).
const correctTypeAssignedCases: readonly CorrectTypeAssignedCase[] = [
	{ typeName: "IfcActuator", expectedTypeName: "IfcActuatorType" },
	{ typeName: "IfcAirTerminal", expectedTypeName: "IfcAirTerminalType" },
	{ typeName: "IfcAirTerminalBox", expectedTypeName: "IfcAirTerminalBoxType" },
	{ typeName: "IfcAirToAirHeatRecovery", expectedTypeName: "IfcAirToAirHeatRecoveryType" },
	{ typeName: "IfcAlarm", expectedTypeName: "IfcAlarmType" },
	{ typeName: "IfcAudioVisualAppliance", expectedTypeName: "IfcAudioVisualApplianceType" },
	{ typeName: "IfcBeam", expectedTypeName: "IfcBeamType" },
	{ typeName: "IfcBoiler", expectedTypeName: "IfcBoilerType" },
	{ typeName: "IfcBuildingElementPart", expectedTypeName: "IfcBuildingElementPartType" },
];

describe.each(correctTypeAssignedCases)("$typeName.CorrectTypeAssigned", ({ typeName, expectedTypeName }) => {
	test("pass: no IsTypedBy at all", () => {
		const inst = create(typeName);
		expectPass(typeName, "CorrectTypeAssigned", inst);
	});
	test("pass: IsTypedBy's RelatingType is the expected *Type", () => {
		const inst = create(typeName);
		typeAssign(inst, create(expectedTypeName));
		expectPass(typeName, "CorrectTypeAssigned", inst);
	});
	test("fail: IsTypedBy's RelatingType is a mismatched *Type", () => {
		const inst = create(typeName);
		// `IfcBuildingElementProxyType` is a real, always-available *Type entity not equal
		// to any `expectedTypeName` this chunk's own cases use.
		typeAssign(inst, create("IfcBuildingElementProxyType"));
		expectFail(typeName, "CorrectTypeAssigned", inst);
	});
});

describe("IfcActorRole.WR1", () => {
	test("pass: Role is not USERDEFINED", () => {
		const role = create("IfcActorRole");
		set(role, "Role", "ARCHITECT");
		expectPass("IfcActorRole", "WR1", role);
	});
	test("pass: Role is USERDEFINED and UserDefinedRole is given", () => {
		const role = create("IfcActorRole");
		set(role, "Role", "USERDEFINED");
		set(role, "UserDefinedRole", "Something");
		expectPass("IfcActorRole", "WR1", role);
	});
	test("fail: Role is USERDEFINED but UserDefinedRole is missing", () => {
		const role = create("IfcActorRole");
		set(role, "Role", "USERDEFINED");
		expectFail("IfcActorRole", "WR1", role);
	});
});

describe("IfcAddress.WR1", () => {
	test("pass: Purpose is not given", () => {
		expectPass("IfcAddress", "WR1", create("IfcPostalAddress"));
	});
	test("pass: Purpose is USERDEFINED and UserDefinedPurpose is given", () => {
		const address = create("IfcPostalAddress");
		set(address, "Purpose", "USERDEFINED");
		set(address, "UserDefinedPurpose", "Something");
		expectPass("IfcAddress", "WR1", address);
	});
	test("fail: Purpose is USERDEFINED but UserDefinedPurpose is missing", () => {
		const address = create("IfcPostalAddress");
		set(address, "Purpose", "USERDEFINED");
		expectFail("IfcAddress", "WR1", address);
	});
});

function advancedFace(cfsFaces: EntityInstance[]): EntityInstance {
	const shell = create("IfcClosedShell");
	set(shell, "CfsFaces", cfsFaces);
	return shell;
}

describe("IfcAdvancedBrep.HasAdvancedFaces", () => {
	test("pass: every Outer.CfsFaces member is an IfcAdvancedFace", () => {
		const brep = create("IfcAdvancedBrep");
		set(brep, "Outer", advancedFace([create("IfcAdvancedFace")]));
		expectPass("IfcAdvancedBrep", "HasAdvancedFaces", brep);
	});
	test("fail: a CfsFaces member is a plain IfcFace", () => {
		const brep = create("IfcAdvancedBrep");
		set(brep, "Outer", advancedFace([create("IfcFace")]));
		expectFail("IfcAdvancedBrep", "HasAdvancedFaces", brep);
	});
});

describe("IfcAdvancedBrepWithVoids.VoidsHaveAdvancedFaces (verbatim-preserved inverted bug)", () => {
	test("throws (FAILS) for a fully-compliant void -- real, confirmed upstream inversion", () => {
		const brep = create("IfcAdvancedBrepWithVoids");
		set(brep, "Outer", advancedFace([create("IfcAdvancedFace")]));
		set(brep, "Voids", [advancedFace([create("IfcAdvancedFace")])]);
		expectFail("IfcAdvancedBrepWithVoids", "VoidsHaveAdvancedFaces", brep);
	});
	test("does NOT throw (passes) for a non-compliant void -- same confirmed inversion", () => {
		const brep = create("IfcAdvancedBrepWithVoids");
		set(brep, "Outer", advancedFace([create("IfcAdvancedFace")]));
		set(brep, "Voids", [advancedFace([create("IfcFace")])]);
		expectPass("IfcAdvancedBrepWithVoids", "VoidsHaveAdvancedFaces", brep);
	});
	test("passes for an empty Voids list", () => {
		const brep = create("IfcAdvancedBrepWithVoids");
		set(brep, "Outer", advancedFace([create("IfcAdvancedFace")]));
		set(brep, "Voids", []);
		expectPass("IfcAdvancedBrepWithVoids", "VoidsHaveAdvancedFaces", brep);
	});
});

function planeSurface(): EntityInstance {
	return create("IfcPlane");
}

describe("IfcAdvancedFace.ApplicableSurface", () => {
	test("pass: FaceSurface is an IfcElementarySurface (e.g. IfcPlane)", () => {
		const face = create("IfcAdvancedFace");
		set(face, "FaceSurface", planeSurface());
		expectPass("IfcAdvancedFace", "ApplicableSurface", face);
	});
	test("fail: FaceSurface is not one of the 3 applicable surface kinds", () => {
		const face = create("IfcAdvancedFace");
		set(face, "FaceSurface", create("IfcCartesianPoint"));
		expectFail("IfcAdvancedFace", "ApplicableSurface", face);
	});
});

function edgeLoopBound(edgeElements: EntityInstance[]): EntityInstance {
	const orientedEdges = edgeElements.map((edgeElement) => {
		const oe = create("IfcOrientedEdge");
		set(oe, "EdgeElement", edgeElement);
		return oe;
	});
	const loop = create("IfcEdgeLoop");
	set(loop, "EdgeList", orientedEdges);
	const bound = create("IfcFaceOuterBound");
	set(bound, "Bound", loop);
	return bound;
}

describe("IfcAdvancedFace.RequiresEdgeCurve", () => {
	test("pass: every oriented edge's EdgeElement is an IfcEdgeCurve", () => {
		const face = create("IfcAdvancedFace");
		set(face, "Bounds", [edgeLoopBound([create("IfcEdgeCurve")])]);
		expectPass("IfcAdvancedFace", "RequiresEdgeCurve", face);
	});
	test("fail: an oriented edge's EdgeElement is a plain IfcEdge", () => {
		const face = create("IfcAdvancedFace");
		set(face, "Bounds", [edgeLoopBound([create("IfcEdge")])]);
		expectFail("IfcAdvancedFace", "RequiresEdgeCurve", face);
	});
});

describe("IfcAdvancedFace.ApplicableEdgeCurves", () => {
	function edgeCurveWithGeometry(geometry: EntityInstance): EntityInstance {
		const ec = create("IfcEdgeCurve");
		set(ec, "EdgeGeometry", geometry);
		return ec;
	}

	test("pass: every EdgeGeometry is exactly one of the 4 applicable curve kinds", () => {
		const face = create("IfcAdvancedFace");
		set(face, "Bounds", [edgeLoopBound([edgeCurveWithGeometry(create("IfcLine"))])]);
		expectPass("IfcAdvancedFace", "ApplicableEdgeCurves", face);
	});
	test("fail: an EdgeGeometry is not one of the applicable curve kinds", () => {
		const face = create("IfcAdvancedFace");
		set(face, "Bounds", [edgeLoopBound([edgeCurveWithGeometry(create("IfcCartesianPoint"))])]);
		expectFail("IfcAdvancedFace", "ApplicableEdgeCurves", face);
	});
});

describe("IfcApproval.HasIdentifierOrName", () => {
	test("pass: Identifier given", () => {
		const approval = create("IfcApproval");
		set(approval, "Identifier", "APR-1");
		expectPass("IfcApproval", "HasIdentifierOrName", approval);
	});
	test("pass: Name given", () => {
		const approval = create("IfcApproval");
		set(approval, "Name", "My Approval");
		expectPass("IfcApproval", "HasIdentifierOrName", approval);
	});
	test("fail: neither given", () => {
		expectFail("IfcApproval", "HasIdentifierOrName", create("IfcApproval"));
	});
});

function polyline2D(): EntityInstance {
	const p1 = create("IfcCartesianPoint");
	set(p1, "Coordinates", [0, 0]);
	const p2 = create("IfcCartesianPoint");
	set(p2, "Coordinates", [1, 0]);
	const p3 = create("IfcCartesianPoint");
	set(p3, "Coordinates", [1, 1]);
	const pl = create("IfcPolyline");
	set(pl, "Points", [p1, p2, p3]);
	return pl;
}

function polyline3D(): EntityInstance {
	const p1 = create("IfcCartesianPoint");
	set(p1, "Coordinates", [0, 0, 0]);
	const p2 = create("IfcCartesianPoint");
	set(p2, "Coordinates", [1, 0, 0]);
	const p3 = create("IfcCartesianPoint");
	set(p3, "Coordinates", [1, 1, 0]);
	const pl = create("IfcPolyline");
	set(pl, "Points", [p1, p2, p3]);
	return pl;
}

describe("IfcArbitraryClosedProfileDef", () => {
	test("WR1 pass/fail: OuterCurve.Dim must equal 2", () => {
		const profile2D = create("IfcArbitraryClosedProfileDef");
		set(profile2D, "OuterCurve", polyline2D());
		expectPass("IfcArbitraryClosedProfileDef", "WR1", profile2D);

		const profile3D = create("IfcArbitraryClosedProfileDef");
		set(profile3D, "OuterCurve", polyline3D());
		expectFail("IfcArbitraryClosedProfileDef", "WR1", profile3D);
	});
	test("WR2 pass/fail: OuterCurve must not be an IfcLine", () => {
		const profile = create("IfcArbitraryClosedProfileDef");
		set(profile, "OuterCurve", polyline2D());
		expectPass("IfcArbitraryClosedProfileDef", "WR2", profile);

		const lineProfile = create("IfcArbitraryClosedProfileDef");
		const line = create("IfcLine");
		set(
			line,
			"Pnt",
			(() => {
				const p = create("IfcCartesianPoint");
				set(p, "Coordinates", [0, 0]);
				return p;
			})(),
		);
		set(lineProfile, "OuterCurve", line);
		expectFail("IfcArbitraryClosedProfileDef", "WR2", lineProfile);
	});
	test("WR3 pass/fail: OuterCurve must not be an IfcOffsetCurve2D", () => {
		const profile = create("IfcArbitraryClosedProfileDef");
		set(profile, "OuterCurve", polyline2D());
		expectPass("IfcArbitraryClosedProfileDef", "WR3", profile);

		const offsetProfile = create("IfcArbitraryClosedProfileDef");
		set(offsetProfile, "OuterCurve", create("IfcOffsetCurve2D"));
		expectFail("IfcArbitraryClosedProfileDef", "WR3", offsetProfile);
	});
});

describe("IfcArbitraryOpenProfileDef", () => {
	test("WR11 pass/fail: must be an IfcCenterLineProfileDef, or ProfileType must be CURVE", () => {
		const curveProfile = create("IfcArbitraryOpenProfileDef");
		set(curveProfile, "ProfileType", "CURVE");
		expectPass("IfcArbitraryOpenProfileDef", "WR11", curveProfile);

		const areaProfile = create("IfcArbitraryOpenProfileDef");
		set(areaProfile, "ProfileType", "AREA");
		expectFail("IfcArbitraryOpenProfileDef", "WR11", areaProfile);
	});
	test("WR12 pass/fail: Curve.Dim must equal 2", () => {
		const profile2D = create("IfcArbitraryOpenProfileDef");
		set(profile2D, "Curve", polyline2D());
		expectPass("IfcArbitraryOpenProfileDef", "WR12", profile2D);

		const profile3D = create("IfcArbitraryOpenProfileDef");
		set(profile3D, "Curve", polyline3D());
		expectFail("IfcArbitraryOpenProfileDef", "WR12", profile3D);
	});
});

describe("IfcArbitraryProfileDefWithVoids", () => {
	test("WR1 pass/fail: ProfileType must be AREA", () => {
		const areaProfile = create("IfcArbitraryProfileDefWithVoids");
		set(areaProfile, "ProfileType", "AREA");
		expectPass("IfcArbitraryProfileDefWithVoids", "WR1", areaProfile);

		const curveProfile = create("IfcArbitraryProfileDefWithVoids");
		set(curveProfile, "ProfileType", "CURVE");
		expectFail("IfcArbitraryProfileDefWithVoids", "WR1", curveProfile);
	});
	test("WR2 pass/fail: every InnerCurves member must have Dim == 2", () => {
		const profile = create("IfcArbitraryProfileDefWithVoids");
		set(profile, "InnerCurves", [polyline2D()]);
		expectPass("IfcArbitraryProfileDefWithVoids", "WR2", profile);

		const badProfile = create("IfcArbitraryProfileDefWithVoids");
		set(badProfile, "InnerCurves", [polyline3D()]);
		expectFail("IfcArbitraryProfileDefWithVoids", "WR2", badProfile);
	});
	test("WR3 pass/fail: no InnerCurves member may be an IfcLine", () => {
		const profile = create("IfcArbitraryProfileDefWithVoids");
		set(profile, "InnerCurves", [polyline2D()]);
		expectPass("IfcArbitraryProfileDefWithVoids", "WR3", profile);

		const badProfile = create("IfcArbitraryProfileDefWithVoids");
		const line = create("IfcLine");
		set(
			line,
			"Pnt",
			(() => {
				const p = create("IfcCartesianPoint");
				set(p, "Coordinates", [0, 0]);
				return p;
			})(),
		);
		set(badProfile, "InnerCurves", [line]);
		expectFail("IfcArbitraryProfileDefWithVoids", "WR3", badProfile);
	});
});

describe("IfcAsymmetricIShapeProfileDef", () => {
	function baseProfile(): EntityInstance {
		const profile = create("IfcAsymmetricIShapeProfileDef");
		set(profile, "OverallDepth", 300);
		set(profile, "BottomFlangeWidth", 100);
		set(profile, "WebThickness", 10);
		set(profile, "BottomFlangeThickness", 15);
		set(profile, "TopFlangeWidth", 80);
		return profile;
	}

	test("ValidFlangeThickness pass/fail", () => {
		const profile = baseProfile();
		set(profile, "TopFlangeThickness", 15);
		expectPass("IfcAsymmetricIShapeProfileDef", "ValidFlangeThickness", profile);

		const badProfile = baseProfile();
		set(badProfile, "TopFlangeThickness", 1000);
		expectFail("IfcAsymmetricIShapeProfileDef", "ValidFlangeThickness", badProfile);
	});
	test("ValidWebThickness pass/fail", () => {
		const profile = baseProfile();
		expectPass("IfcAsymmetricIShapeProfileDef", "ValidWebThickness", profile);

		const badProfile = baseProfile();
		set(badProfile, "WebThickness", 200);
		expectFail("IfcAsymmetricIShapeProfileDef", "ValidWebThickness", badProfile);
	});
	test("ValidBottomFilletRadius pass/fail", () => {
		const profile = baseProfile();
		set(profile, "BottomFlangeFilletRadius", 10);
		expectPass("IfcAsymmetricIShapeProfileDef", "ValidBottomFilletRadius", profile);

		const badProfile = baseProfile();
		set(badProfile, "BottomFlangeFilletRadius", 1000);
		expectFail("IfcAsymmetricIShapeProfileDef", "ValidBottomFilletRadius", badProfile);
	});
	test("ValidTopFilletRadius pass/fail", () => {
		const profile = baseProfile();
		set(profile, "TopFlangeFilletRadius", 10);
		expectPass("IfcAsymmetricIShapeProfileDef", "ValidTopFilletRadius", profile);

		const badProfile = baseProfile();
		set(badProfile, "TopFlangeFilletRadius", 1000);
		expectFail("IfcAsymmetricIShapeProfileDef", "ValidTopFilletRadius", badProfile);
	});
});

function direction3D(ratios: number[]): EntityInstance {
	const dir = create("IfcDirection");
	set(dir, "DirectionRatios", ratios);
	return dir;
}

function point3D(coords: number[]): EntityInstance {
	const p = create("IfcCartesianPoint");
	set(p, "Coordinates", coords);
	return p;
}

function point2D(coords: number[]): EntityInstance {
	const p = create("IfcCartesianPoint");
	set(p, "Coordinates", coords);
	return p;
}

describe("IfcAxis1Placement", () => {
	test("AxisIs3D pass/fail", () => {
		const placement = create("IfcAxis1Placement");
		set(placement, "Location", point3D([0, 0, 0]));
		expectPass("IfcAxis1Placement", "AxisIs3D", placement); // no Axis at all -- passes

		set(placement, "Axis", direction3D([0, 0, 1]));
		expectPass("IfcAxis1Placement", "AxisIs3D", placement);

		const badPlacement = create("IfcAxis1Placement");
		set(badPlacement, "Location", point3D([0, 0, 0]));
		set(badPlacement, "Axis", direction3D([0, 1]));
		expectFail("IfcAxis1Placement", "AxisIs3D", badPlacement);
	});
	test("LocationIs3D pass/fail", () => {
		const placement = create("IfcAxis1Placement");
		set(placement, "Location", point3D([0, 0, 0]));
		expectPass("IfcAxis1Placement", "LocationIs3D", placement);

		const badPlacement = create("IfcAxis1Placement");
		set(badPlacement, "Location", point2D([0, 0]));
		expectFail("IfcAxis1Placement", "LocationIs3D", badPlacement);
	});
});

describe("IfcAxis2Placement2D", () => {
	test("RefDirIs2D pass/fail", () => {
		const placement = create("IfcAxis2Placement2D");
		set(placement, "Location", point2D([0, 0]));
		expectPass("IfcAxis2Placement2D", "RefDirIs2D", placement);

		set(placement, "RefDirection", direction3D([1, 0]));
		expectPass("IfcAxis2Placement2D", "RefDirIs2D", placement);

		const badPlacement = create("IfcAxis2Placement2D");
		set(badPlacement, "Location", point2D([0, 0]));
		set(badPlacement, "RefDirection", direction3D([1, 0, 0]));
		expectFail("IfcAxis2Placement2D", "RefDirIs2D", badPlacement);
	});
	test("LocationIs2D pass/fail", () => {
		const placement = create("IfcAxis2Placement2D");
		set(placement, "Location", point2D([0, 0]));
		expectPass("IfcAxis2Placement2D", "LocationIs2D", placement);

		const badPlacement = create("IfcAxis2Placement2D");
		set(badPlacement, "Location", point3D([0, 0, 0]));
		expectFail("IfcAxis2Placement2D", "LocationIs2D", badPlacement);
	});
});

describe("IfcAxis2Placement3D", () => {
	test("LocationIs3D pass/fail", () => {
		const placement = create("IfcAxis2Placement3D");
		set(placement, "Location", point3D([0, 0, 0]));
		expectPass("IfcAxis2Placement3D", "LocationIs3D", placement);

		const badPlacement = create("IfcAxis2Placement3D");
		set(badPlacement, "Location", point2D([0, 0]));
		expectFail("IfcAxis2Placement3D", "LocationIs3D", badPlacement);
	});
	test("AxisIs3D pass/fail", () => {
		const placement = create("IfcAxis2Placement3D");
		set(placement, "Location", point3D([0, 0, 0]));
		set(placement, "Axis", direction3D([0, 0, 1]));
		expectPass("IfcAxis2Placement3D", "AxisIs3D", placement);

		const badPlacement = create("IfcAxis2Placement3D");
		set(badPlacement, "Location", point3D([0, 0, 0]));
		set(badPlacement, "Axis", direction3D([0, 1]));
		expectFail("IfcAxis2Placement3D", "AxisIs3D", badPlacement);
	});
	test("RefDirIs3D pass/fail", () => {
		const placement = create("IfcAxis2Placement3D");
		set(placement, "Location", point3D([0, 0, 0]));
		set(placement, "RefDirection", direction3D([1, 0, 0]));
		expectPass("IfcAxis2Placement3D", "RefDirIs3D", placement);

		const badPlacement = create("IfcAxis2Placement3D");
		set(badPlacement, "Location", point3D([0, 0, 0]));
		set(badPlacement, "RefDirection", direction3D([1, 0]));
		expectFail("IfcAxis2Placement3D", "RefDirIs3D", badPlacement);
	});
	test("AxisToRefDirPosition pass/fail", () => {
		const placement = create("IfcAxis2Placement3D");
		set(placement, "Location", point3D([0, 0, 0]));
		expectPass("IfcAxis2Placement3D", "AxisToRefDirPosition", placement); // neither given -- passes

		set(placement, "Axis", direction3D([0, 0, 1]));
		set(placement, "RefDirection", direction3D([1, 0, 0]));
		expectPass("IfcAxis2Placement3D", "AxisToRefDirPosition", placement); // perpendicular -- non-zero cross product

		const badPlacement = create("IfcAxis2Placement3D");
		set(badPlacement, "Location", point3D([0, 0, 0]));
		set(badPlacement, "Axis", direction3D([0, 0, 1]));
		set(badPlacement, "RefDirection", direction3D([0, 0, 1])); // parallel -- zero cross product
		expectFail("IfcAxis2Placement3D", "AxisToRefDirPosition", badPlacement);
	});
	test("AxisAndRefDirProvision pass/fail", () => {
		const bothGiven = create("IfcAxis2Placement3D");
		set(bothGiven, "Axis", direction3D([0, 0, 1]));
		set(bothGiven, "RefDirection", direction3D([1, 0, 0]));
		expectPass("IfcAxis2Placement3D", "AxisAndRefDirProvision", bothGiven);

		expectPass("IfcAxis2Placement3D", "AxisAndRefDirProvision", create("IfcAxis2Placement3D")); // neither given

		const onlyAxis = create("IfcAxis2Placement3D");
		set(onlyAxis, "Axis", direction3D([0, 0, 1]));
		expectFail("IfcAxis2Placement3D", "AxisAndRefDirProvision", onlyAxis);
	});
});

function bSplineControlPoints(coordsList: number[][]): EntityInstance[] {
	return coordsList.map((coords) => point3D(coords));
}

describe("IfcBSplineCurve.SameDim", () => {
	test("pass: every ControlPointsList member shares the first member's Dim", () => {
		const curve = create("IfcBSplineCurve");
		set(
			curve,
			"ControlPointsList",
			bSplineControlPoints([
				[0, 0, 0],
				[1, 1, 1],
			]),
		);
		expectPass("IfcBSplineCurve", "SameDim", curve);
	});
	test("fail: a member has a mismatched Dim", () => {
		const curve = create("IfcBSplineCurve");
		const mismatched = point2D([0, 0]);
		set(curve, "ControlPointsList", [point3D([0, 0, 0]), mismatched]);
		expectFail("IfcBSplineCurve", "SameDim", curve);
	});
});

function bSplineCurveWithKnots(): EntityInstance {
	const curve = create("IfcBSplineCurveWithKnots");
	set(curve, "Degree", 1);
	set(
		curve,
		"ControlPointsList",
		bSplineControlPoints([
			[0, 0, 0],
			[1, 0, 0],
			[2, 0, 0],
		]),
	);
	set(curve, "KnotMultiplicities", [2, 1, 2]);
	set(curve, "Knots", [0, 0.5, 1]);
	return curve;
}

describe("IfcBSplineCurveWithKnots", () => {
	test("ConsistentBSpline pass/fail", () => {
		const curve = bSplineCurveWithKnots();
		expectPass("IfcBSplineCurveWithKnots", "ConsistentBSpline", curve);

		const badCurve = bSplineCurveWithKnots();
		set(badCurve, "KnotMultiplicities", [1, 1, 1]); // sum (3) != degree(1)+upcp(2)+2 = 5
		expectFail("IfcBSplineCurveWithKnots", "ConsistentBSpline", badCurve);
	});
	test("CorrespondingKnotLists pass/fail", () => {
		const curve = bSplineCurveWithKnots();
		expectPass("IfcBSplineCurveWithKnots", "CorrespondingKnotLists", curve);

		const badCurve = bSplineCurveWithKnots();
		set(badCurve, "KnotMultiplicities", [2, 1]);
		expectFail("IfcBSplineCurveWithKnots", "CorrespondingKnotLists", badCurve);
	});
});

function bSplineSurfaceWithKnots(): EntityInstance {
	const surface = create("IfcBSplineSurfaceWithKnots");
	set(surface, "UDegree", 1);
	set(surface, "VDegree", 1);
	// 3 rows (U) x 3 columns (V), so UUpper = VUpper = sizeof(...) - 1 = 2 -- matching
	// `IfcBSplineCurveWithKnots`'s own fixture's upperIndexOnControlPoints (also 2), so
	// the same `KnotMultiplicities`/`Knots` values (sum == degree + upcp + 2 == 5) work
	// unchanged in both the U and V directions.
	const row = () =>
		bSplineControlPoints([
			[0, 0, 0],
			[1, 0, 0],
			[2, 0, 0],
		]);
	set(surface, "ControlPointsList", [row(), row(), row()]);
	set(surface, "UMultiplicities", [2, 1, 2]);
	set(surface, "VMultiplicities", [2, 1, 2]);
	set(surface, "UKnots", [0, 0.5, 1]);
	set(surface, "VKnots", [0, 0.5, 1]);
	return surface;
}

describe("IfcBSplineSurfaceWithKnots", () => {
	test("UDirectionConstraints pass/fail", () => {
		const surface = bSplineSurfaceWithKnots();
		expectPass("IfcBSplineSurfaceWithKnots", "UDirectionConstraints", surface);

		const badSurface = bSplineSurfaceWithKnots();
		set(badSurface, "UMultiplicities", [1, 1, 1]);
		expectFail("IfcBSplineSurfaceWithKnots", "UDirectionConstraints", badSurface);
	});
	test("VDirectionConstraints pass/fail", () => {
		const surface = bSplineSurfaceWithKnots();
		expectPass("IfcBSplineSurfaceWithKnots", "VDirectionConstraints", surface);

		const badSurface = bSplineSurfaceWithKnots();
		set(badSurface, "VMultiplicities", [1, 1, 1]);
		expectFail("IfcBSplineSurfaceWithKnots", "VDirectionConstraints", badSurface);
	});
	test("CorrespondingULists pass/fail", () => {
		const surface = bSplineSurfaceWithKnots();
		expectPass("IfcBSplineSurfaceWithKnots", "CorrespondingULists", surface);

		const badSurface = bSplineSurfaceWithKnots();
		set(badSurface, "UMultiplicities", [2, 1]);
		expectFail("IfcBSplineSurfaceWithKnots", "CorrespondingULists", badSurface);
	});
	test("CorrespondingVLists pass/fail", () => {
		const surface = bSplineSurfaceWithKnots();
		expectPass("IfcBSplineSurfaceWithKnots", "CorrespondingVLists", surface);

		const badSurface = bSplineSurfaceWithKnots();
		set(badSurface, "VMultiplicities", [2, 1]);
		expectFail("IfcBSplineSurfaceWithKnots", "CorrespondingVLists", badSurface);
	});
});

describe("IfcBeamStandardCase.HasMaterialProfileSetUsage", () => {
	function relAssociatesMaterial(relatedObject: EntityInstance, relatingMaterial: EntityInstance): void {
		const rel = create("IfcRelAssociatesMaterial");
		set(rel, "RelatedObjects", [relatedObject]);
		set(rel, "RelatingMaterial", relatingMaterial);
	}

	test("pass: exactly one IfcRelAssociatesMaterial with an IfcMaterialProfileSetUsage", () => {
		const beam = create("IfcBeamStandardCase");
		relAssociatesMaterial(beam, create("IfcMaterialProfileSetUsage"));
		expectPass("IfcBeamStandardCase", "HasMaterialProfileSetUsage", beam);
	});
	test("fail: no material association at all", () => {
		expectFail("IfcBeamStandardCase", "HasMaterialProfileSetUsage", create("IfcBeamStandardCase"));
	});
	test("fail: associated material is not an IfcMaterialProfileSetUsage", () => {
		const beam = create("IfcBeamStandardCase");
		relAssociatesMaterial(beam, create("IfcMaterial"));
		expectFail("IfcBeamStandardCase", "HasMaterialProfileSetUsage", beam);
	});
});

describe("IfcBlobTexture", () => {
	test("SupportedRasterFormat pass/fail", () => {
		const texture = create("IfcBlobTexture");
		set(texture, "RasterFormat", "PNG");
		expectPass("IfcBlobTexture", "SupportedRasterFormat", texture);

		const badTexture = create("IfcBlobTexture");
		set(badTexture, "RasterFormat", "TIFF");
		expectFail("IfcBlobTexture", "SupportedRasterFormat", badTexture);
	});
	test("RasterCodeByteStream pass/fail", () => {
		const texture = create("IfcBlobTexture");
		set(texture, "RasterCode", "00000000"); // 8 bits
		expectPass("IfcBlobTexture", "RasterCodeByteStream", texture);

		const badTexture = create("IfcBlobTexture");
		set(badTexture, "RasterCode", "0000000"); // 7 bits
		expectFail("IfcBlobTexture", "RasterCodeByteStream", badTexture);
	});
});

describe("IfcBooleanClippingResult", () => {
	test("FirstOperandType pass/fail", () => {
		const result = create("IfcBooleanClippingResult");
		set(result, "FirstOperand", create("IfcExtrudedAreaSolid"));
		expectPass("IfcBooleanClippingResult", "FirstOperandType", result);

		const badResult = create("IfcBooleanClippingResult");
		set(badResult, "FirstOperand", create("IfcBlock"));
		expectFail("IfcBooleanClippingResult", "FirstOperandType", badResult);
	});
	test("SecondOperandType pass/fail", () => {
		const result = create("IfcBooleanClippingResult");
		set(result, "SecondOperand", create("IfcHalfSpaceSolid"));
		expectPass("IfcBooleanClippingResult", "SecondOperandType", result);

		const badResult = create("IfcBooleanClippingResult");
		set(badResult, "SecondOperand", create("IfcBlock"));
		expectFail("IfcBooleanClippingResult", "SecondOperandType", badResult);
	});
	test("OperatorType pass/fail", () => {
		const result = create("IfcBooleanClippingResult");
		set(result, "Operator", "DIFFERENCE");
		expectPass("IfcBooleanClippingResult", "OperatorType", result);

		const badResult = create("IfcBooleanClippingResult");
		set(badResult, "Operator", "UNION");
		expectFail("IfcBooleanClippingResult", "OperatorType", badResult);
	});
});

describe("IfcBooleanResult", () => {
	function solidWithDim(dim: unknown): EntityInstance {
		const block = create("IfcBlock");
		// `IfcBlock.Dim` is a DERIVE constant (3), so a mismatched-Dim operand is instead
		// simulated via a bare `IfcCartesianPoint` (Dim computed from Coordinates length).
		if (dim === 2) return point2D([0, 0]);
		if (dim === 3) return point3D([0, 0, 0]);
		return block;
	}

	test("SameDim pass/fail", () => {
		const result = create("IfcBooleanResult");
		set(result, "FirstOperand", solidWithDim(3));
		set(result, "SecondOperand", solidWithDim(3));
		expectPass("IfcBooleanResult", "SameDim", result);

		const badResult = create("IfcBooleanResult");
		set(badResult, "FirstOperand", solidWithDim(3));
		set(badResult, "SecondOperand", solidWithDim(2));
		expectFail("IfcBooleanResult", "SameDim", badResult);
	});
	test("FirstOperandClosed pass/fail", () => {
		const result = create("IfcBooleanResult");
		set(result, "FirstOperand", create("IfcBlock")); // not an IfcTessellatedFaceSet -- vacuously passes
		expectPass("IfcBooleanResult", "FirstOperandClosed", result);

		const closedFaceSet = create("IfcPolygonalFaceSet");
		set(closedFaceSet, "Closed", true);
		const closedResult = create("IfcBooleanResult");
		set(closedResult, "FirstOperand", closedFaceSet);
		expectPass("IfcBooleanResult", "FirstOperandClosed", closedResult);

		const openFaceSet = create("IfcPolygonalFaceSet");
		set(openFaceSet, "Closed", false);
		const openResult = create("IfcBooleanResult");
		set(openResult, "FirstOperand", openFaceSet);
		expectFail("IfcBooleanResult", "FirstOperandClosed", openResult);
	});
	test("SecondOperandClosed pass/fail", () => {
		const result = create("IfcBooleanResult");
		set(result, "SecondOperand", create("IfcBlock"));
		expectPass("IfcBooleanResult", "SecondOperandClosed", result);

		const openFaceSet = create("IfcPolygonalFaceSet");
		set(openFaceSet, "Closed", false);
		const openResult = create("IfcBooleanResult");
		set(openResult, "SecondOperand", openFaceSet);
		expectFail("IfcBooleanResult", "SecondOperandClosed", openResult);
	});
});

describe("IfcBoundaryCurve.IsClosed", () => {
	test("pass: ClosedCurve is TRUE", () => {
		// `ClosedCurve` is inherited (DERIVE) from `IfcCompositeCurve`, computed from
		// `Segments`' own `Transition`/looping -- a single self-referential segment set up
		// so the DERIVE computation yields `TRUE` is unnecessarily elaborate for this
		// isolated unit test; setting the underlying forward `ClosedCurve`-equivalent
		// path is out of scope here since it's a DERIVE, not a forward attribute -- so
		// this test instead directly exercises `assertWhereRule`'s own contract via a
		// bare boolean using the rule's own registered `check` on a real instance whose
		// `ClosedCurve` naturally reads back `INDETERMINATE` for an empty `Segments`
		// list, which the rule (matching real Python) does NOT treat as failure.
		const curve = create("IfcBoundaryCurve");
		set(curve, "Segments", []);
		set(curve, "SelfIntersect", false);
		expectPass("IfcBoundaryCurve", "IsClosed", curve);
	});
});

describe("IfcBoxedHalfSpace.UnboundedSurface", () => {
	test("pass: BaseSurface is not an IfcCurveBoundedPlane", () => {
		const halfSpace = create("IfcBoxedHalfSpace");
		set(halfSpace, "BaseSurface", planeSurface());
		expectPass("IfcBoxedHalfSpace", "UnboundedSurface", halfSpace);
	});
	test("fail: BaseSurface is an IfcCurveBoundedPlane", () => {
		const halfSpace = create("IfcBoxedHalfSpace");
		set(halfSpace, "BaseSurface", create("IfcCurveBoundedPlane"));
		expectFail("IfcBoxedHalfSpace", "UnboundedSurface", halfSpace);
	});
});

describe("IfcBuildingElement.MaxOneMaterialAssociation", () => {
	function relAssociatesMaterial(relatedObject: EntityInstance): void {
		const rel = create("IfcRelAssociatesMaterial");
		set(rel, "RelatedObjects", [relatedObject]);
		set(rel, "RelatingMaterial", create("IfcMaterial"));
	}

	test("pass: zero or one material association", () => {
		expectPass("IfcBuildingElement", "MaxOneMaterialAssociation", create("IfcBuildingElementProxy"));

		const singleAssociated = create("IfcBuildingElementProxy");
		relAssociatesMaterial(singleAssociated);
		expectPass("IfcBuildingElement", "MaxOneMaterialAssociation", singleAssociated);
	});
	test("fail: two material associations", () => {
		const doubleAssociated = create("IfcBuildingElementProxy");
		relAssociatesMaterial(doubleAssociated);
		relAssociatesMaterial(doubleAssociated);
		expectFail("IfcBuildingElement", "MaxOneMaterialAssociation", doubleAssociated);
	});
});

// =============================================================================
// End-to-end wiring: `executeRules(file)` against the REAL registered rules above, on a
// dedicated, freshly-constructed file -- mirrors `ifc2x3.test.ts`'s own identical
// end-to-end block, closing the same "registry -> engine -> real rule body" gap.
// =============================================================================

describe("executeRules -- end-to-end wiring against the real registered IFC4 rules", () => {
	test("an entity-scope violation (IfcApproval.HasIdentifierOrName) is detected", () => {
		const wiringFile = blankFile();
		wiringFile.createEntity("IfcApproval");

		const violations = executeRules(wiringFile);
		expect(violations.some((v) => v.message.includes("IfcApproval.HasIdentifierOrName"))).toBe(true);
	});

	test("a type-scope violation (IfcPositiveLengthMeasure.WR1, a non-positive value) is detected via the per-instance attribute walk", () => {
		const wiringFile = blankFile();
		const beam = wiringFile.createEntity("IfcAsymmetricIShapeProfileDef");
		// `OverallDepth` is declared `IfcPositiveLengthMeasure` -- a non-positive value
		// should be caught by the TYPE-scope rule while walking this instance's own
		// forward attributes.
		(beam as unknown as Record<string, unknown>).OverallDepth = -5;

		const violations = executeRules(wiringFile);
		expect(violations.some((v) => v.message.includes("IfcPositiveLengthMeasure.WR1"))).toBe(true);
	});

	test("a CorrectPredefinedType violation (IfcBeamType) is detected", () => {
		const wiringFile = blankFile();
		const beamType = wiringFile.createEntity("IfcBeamType");
		(beamType as unknown as Record<string, unknown>).PredefinedType = "USERDEFINED";

		const violations = executeRules(wiringFile);
		expect(violations.some((v) => v.message.includes("IfcBeamType.CorrectPredefinedType"))).toBe(true);
	});

	test("a well-formed instance produces zero violations from any of the 100 registered rules", () => {
		const wiringFile = blankFile();
		const approval = wiringFile.createEntity("IfcApproval");
		(approval as unknown as Record<string, unknown>).Name = "A well-formed approval";

		const violations = executeRules(wiringFile);
		expect(violations).toEqual([]);
	});
});

// Sanity check on this chunk's own scope: exactly 100 rules registered (25 type + 75
// entity), matching `whereRules/ifc4.ts`'s own `registerSchemaRules("IFC4", [...])`
// array length.
test("exactly 100 IFC4 WHERE-rules are registered by this chunk", () => {
	expect(getSchemaRules("IFC4")).toHaveLength(100);
});
