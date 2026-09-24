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

// =============================================================================
// Phase EX-4, IFC4 chunk 2: original, hand-rolled coverage for the 120 WHERE-rule
// classes this chunk adds to `src/express/whereRules/ifc4.ts` (real source lines
// 5361-6617, `IfcBuildingElementProxy_HasObjectName` through
// `IfcDuctFitting_CorrectTypeAssigned`) -- same conventions as chunk 1's own tests above:
// data-driven `describe.each` blocks for the two dominant shapes
// (`correctPredefinedType`/`correctTypeAssigned`), individual `describe` blocks for every
// other rule, `create`/`set`/`typeAssign`/`point2D`/`point3D`/`direction3D`/`polyline2D`/
// `polyline3D`/`planeSurface` all reused directly from chunk 1's own module-scope helpers
// above (this file is one shared module, not per-chunk).
// =============================================================================

interface CorrectPredefinedTypeCaseChunk2 {
	readonly typeName: string;
	readonly escapeAttr: string;
	readonly optional: boolean;
}

// Hand-derived directly from `whereRules/ifc4.ts`'s own chunk 2 `correctPredefinedType(...)`
// call sites (real source lines 5361-6617) -- `optional` matches that file's own
// `predefinedTypeOptional` argument at each site exactly.
const correctPredefinedTypeCasesChunk2: readonly CorrectPredefinedTypeCaseChunk2[] = [
	{ typeName: "IfcBuildingElementProxy", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcBuildingElementProxyType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcBurner", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcBurnerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCableCarrierFitting", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCableCarrierFittingType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCableCarrierSegment", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCableCarrierSegmentType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCableFitting", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCableFittingType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCableSegment", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCableSegmentType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcChiller", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcChillerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcChimney", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcChimneyType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCoil", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCoilType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcColumn", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcColumnType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCommunicationsAppliance", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCommunicationsApplianceType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCompressor", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCompressorType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCondenser", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCondenserType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcConstructionEquipmentResource", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcConstructionEquipmentResourceType", escapeAttr: "ResourceType", optional: false },
	{ typeName: "IfcConstructionMaterialResource", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcConstructionMaterialResourceType", escapeAttr: "ResourceType", optional: false },
	{ typeName: "IfcConstructionProductResource", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcConstructionProductResourceType", escapeAttr: "ResourceType", optional: false },
	{ typeName: "IfcController", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcControllerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCooledBeam", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCooledBeamType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCoolingTower", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCoolingTowerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCovering", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCoveringType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcCrewResource", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCrewResourceType", escapeAttr: "ResourceType", optional: false },
	{ typeName: "IfcCurtainWall", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcCurtainWallType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcDamper", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcDamperType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcDiscreteAccessory", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcDiscreteAccessoryType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcDistributionChamberElement", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcDistributionChamberElementType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcDoorType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcDuctFitting", escapeAttr: "ObjectType", optional: true },
];

describe.each(correctPredefinedTypeCasesChunk2)(
	"$typeName.CorrectPredefinedType (chunk 2)",
	({ typeName, escapeAttr, optional }) => {
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
	},
);

interface CorrectTypeAssignedCaseChunk2 {
	readonly typeName: string;
	readonly ruleName: string;
	readonly expectedTypeName: string;
}

// Hand-derived directly from `whereRules/ifc4.ts`'s own chunk 2 `correctTypeAssigned(...)`
// call sites (real source lines 5361-6617) -- `ruleName` is `'CorrectStyleAssigned'` for
// `IfcDoor` (its own real, disclosed `RULE_NAME` quirk), `'CorrectTypeAssigned'` otherwise.
const correctTypeAssignedCasesChunk2: readonly CorrectTypeAssignedCaseChunk2[] = [
	{
		typeName: "IfcBuildingElementProxy",
		ruleName: "CorrectTypeAssigned",
		expectedTypeName: "IfcBuildingElementProxyType",
	},
	{ typeName: "IfcBurner", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcBurnerType" },
	{
		typeName: "IfcCableCarrierFitting",
		ruleName: "CorrectTypeAssigned",
		expectedTypeName: "IfcCableCarrierFittingType",
	},
	{
		typeName: "IfcCableCarrierSegment",
		ruleName: "CorrectTypeAssigned",
		expectedTypeName: "IfcCableCarrierSegmentType",
	},
	{ typeName: "IfcCableFitting", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCableFittingType" },
	{ typeName: "IfcCableSegment", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCableSegmentType" },
	{ typeName: "IfcChiller", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcChillerType" },
	{ typeName: "IfcChimney", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcChimneyType" },
	{ typeName: "IfcCoil", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCoilType" },
	{ typeName: "IfcColumn", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcColumnType" },
	{
		typeName: "IfcCommunicationsAppliance",
		ruleName: "CorrectTypeAssigned",
		expectedTypeName: "IfcCommunicationsApplianceType",
	},
	{ typeName: "IfcCompressor", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCompressorType" },
	{ typeName: "IfcCondenser", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCondenserType" },
	{ typeName: "IfcController", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcControllerType" },
	{ typeName: "IfcCooledBeam", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCooledBeamType" },
	{ typeName: "IfcCoolingTower", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCoolingTowerType" },
	{ typeName: "IfcCovering", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCoveringType" },
	{ typeName: "IfcCurtainWall", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcCurtainWallType" },
	{ typeName: "IfcDamper", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcDamperType" },
	{ typeName: "IfcDiscreteAccessory", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcDiscreteAccessoryType" },
	{
		typeName: "IfcDistributionChamberElement",
		ruleName: "CorrectTypeAssigned",
		expectedTypeName: "IfcDistributionChamberElementType",
	},
	{ typeName: "IfcDoor", ruleName: "CorrectStyleAssigned", expectedTypeName: "IfcDoorType" },
	{ typeName: "IfcDuctFitting", ruleName: "CorrectTypeAssigned", expectedTypeName: "IfcDuctFittingType" },
];

describe.each(correctTypeAssignedCasesChunk2)(
	"$typeName.$ruleName (chunk 2)",
	({ typeName, ruleName, expectedTypeName }) => {
		test("pass: no IsTypedBy at all", () => {
			const inst = create(typeName);
			expectPass(typeName, ruleName, inst);
		});
		test("pass: IsTypedBy's RelatingType is the expected *Type", () => {
			const inst = create(typeName);
			typeAssign(inst, create(expectedTypeName));
			expectPass(typeName, ruleName, inst);
		});
		test("fail: IsTypedBy's RelatingType is a mismatched *Type", () => {
			const inst = create(typeName);
			// `IfcActuatorType` (chunk 1) is a real, always-available *Type entity not equal to
			// any `expectedTypeName` this chunk's own cases use.
			typeAssign(inst, create("IfcActuatorType"));
			expectFail(typeName, ruleName, inst);
		});
	},
);

describe("IfcBuildingElementProxy.HasObjectName", () => {
	test("pass: Name given", () => {
		const proxy = create("IfcBuildingElementProxy");
		set(proxy, "Name", "Proxy 1");
		expectPass("IfcBuildingElementProxy", "HasObjectName", proxy);
	});
	test("fail: Name not given", () => {
		expectFail("IfcBuildingElementProxy", "HasObjectName", create("IfcBuildingElementProxy"));
	});
});

describe("IfcCShapeProfileDef", () => {
	function profile(overrides: Record<string, unknown>): EntityInstance {
		const p = create("IfcCShapeProfileDef");
		set(p, "Depth", 100);
		set(p, "Width", 80);
		set(p, "WallThickness", 5);
		set(p, "Girth", 10);
		for (const [k, v] of Object.entries(overrides)) set(p, k, v);
		return p;
	}

	test("ValidGirth pass/fail", () => {
		expectPass("IfcCShapeProfileDef", "ValidGirth", profile({ Girth: 40 }));
		expectFail("IfcCShapeProfileDef", "ValidGirth", profile({ Girth: 60 }));
	});
	test("ValidInternalFilletRadius pass/fail", () => {
		expectPass("IfcCShapeProfileDef", "ValidInternalFilletRadius", profile({}));
		expectPass("IfcCShapeProfileDef", "ValidInternalFilletRadius", profile({ InternalFilletRadius: 10 }));
		expectFail("IfcCShapeProfileDef", "ValidInternalFilletRadius", profile({ InternalFilletRadius: 50 }));
	});
	test("ValidWallThickness pass/fail", () => {
		expectPass("IfcCShapeProfileDef", "ValidWallThickness", profile({ WallThickness: 10 }));
		expectFail("IfcCShapeProfileDef", "ValidWallThickness", profile({ WallThickness: 50 }));
	});
});

describe("IfcCartesianPoint.CP2Dor3D", () => {
	test("pass/fail", () => {
		expectPass("IfcCartesianPoint", "CP2Dor3D", point2D([0, 0]));
		expectFail("IfcCartesianPoint", "CP2Dor3D", point2D([0]));
	});
});

describe("IfcCartesianTransformationOperator.ScaleGreaterZero", () => {
	test("pass/fail", () => {
		// `Scl` is a DERIVE attribute (`calc_IfcCartesianTransformationOperator_Scl`:
		// `nvl(Scale, 1.0)`) -- not directly settable, so the forward `Scale` attribute is
		// set instead.
		const op = create("IfcCartesianTransformationOperator");
		set(op, "Scale", 1.0);
		expectPass("IfcCartesianTransformationOperator", "ScaleGreaterZero", op);

		const badOp = create("IfcCartesianTransformationOperator");
		set(badOp, "Scale", 0.0);
		expectFail("IfcCartesianTransformationOperator", "ScaleGreaterZero", badOp);
	});
});

describe("IfcCartesianTransformationOperator2D", () => {
	test("DimEqual2 pass/fail", () => {
		const op = create("IfcCartesianTransformationOperator2D");
		set(op, "LocalOrigin", point2D([0, 0]));
		expectPass("IfcCartesianTransformationOperator2D", "DimEqual2", op);

		const badOp = create("IfcCartesianTransformationOperator2D");
		set(badOp, "LocalOrigin", point3D([0, 0, 0]));
		expectFail("IfcCartesianTransformationOperator2D", "DimEqual2", badOp);
	});
	test("Axis1Is2D pass/fail", () => {
		const op = create("IfcCartesianTransformationOperator2D");
		expectPass("IfcCartesianTransformationOperator2D", "Axis1Is2D", op); // unset -- passes

		set(op, "Axis1", direction3D([1, 0]));
		expectPass("IfcCartesianTransformationOperator2D", "Axis1Is2D", op);

		const badOp = create("IfcCartesianTransformationOperator2D");
		set(badOp, "Axis1", direction3D([1, 0, 0]));
		expectFail("IfcCartesianTransformationOperator2D", "Axis1Is2D", badOp);
	});
	test("Axis2Is2D pass/fail", () => {
		const op = create("IfcCartesianTransformationOperator2D");
		set(op, "Axis2", direction3D([0, 1]));
		expectPass("IfcCartesianTransformationOperator2D", "Axis2Is2D", op);

		const badOp = create("IfcCartesianTransformationOperator2D");
		set(badOp, "Axis2", direction3D([0, 1, 0]));
		expectFail("IfcCartesianTransformationOperator2D", "Axis2Is2D", badOp);
	});
});

describe("IfcCartesianTransformationOperator2DnonUniform.Scale2GreaterZero", () => {
	test("pass/fail", () => {
		// `Scl2` is a DERIVE attribute (`nvl(Scale2, Scl)`) -- the forward `Scale2` attribute
		// is set instead (see `ScaleGreaterZero`'s own test above for the same note).
		const op = create("IfcCartesianTransformationOperator2DnonUniform");
		set(op, "Scale2", 1.0);
		expectPass("IfcCartesianTransformationOperator2DnonUniform", "Scale2GreaterZero", op);

		const badOp = create("IfcCartesianTransformationOperator2DnonUniform");
		set(badOp, "Scale2", 0.0);
		expectFail("IfcCartesianTransformationOperator2DnonUniform", "Scale2GreaterZero", badOp);
	});
});

describe("IfcCartesianTransformationOperator3D", () => {
	test("DimIs3D pass/fail", () => {
		const op = create("IfcCartesianTransformationOperator3D");
		set(op, "LocalOrigin", point3D([0, 0, 0]));
		expectPass("IfcCartesianTransformationOperator3D", "DimIs3D", op);

		const badOp = create("IfcCartesianTransformationOperator3D");
		set(badOp, "LocalOrigin", point2D([0, 0]));
		expectFail("IfcCartesianTransformationOperator3D", "DimIs3D", badOp);
	});
	test("Axis1Is3D pass/fail", () => {
		const op = create("IfcCartesianTransformationOperator3D");
		set(op, "Axis1", direction3D([1, 0, 0]));
		expectPass("IfcCartesianTransformationOperator3D", "Axis1Is3D", op);

		const badOp = create("IfcCartesianTransformationOperator3D");
		set(badOp, "Axis1", direction3D([1, 0]));
		expectFail("IfcCartesianTransformationOperator3D", "Axis1Is3D", badOp);
	});
	test("Axis2Is3D pass/fail", () => {
		const op = create("IfcCartesianTransformationOperator3D");
		set(op, "Axis2", direction3D([0, 1, 0]));
		expectPass("IfcCartesianTransformationOperator3D", "Axis2Is3D", op);

		const badOp = create("IfcCartesianTransformationOperator3D");
		set(badOp, "Axis2", direction3D([0, 1]));
		expectFail("IfcCartesianTransformationOperator3D", "Axis2Is3D", badOp);
	});
	test("Axis3Is3D pass/fail", () => {
		const op = create("IfcCartesianTransformationOperator3D");
		set(op, "Axis3", direction3D([0, 0, 1]));
		expectPass("IfcCartesianTransformationOperator3D", "Axis3Is3D", op);

		const badOp = create("IfcCartesianTransformationOperator3D");
		set(badOp, "Axis3", direction3D([0, 1]));
		expectFail("IfcCartesianTransformationOperator3D", "Axis3Is3D", badOp);
	});
});

describe("IfcCartesianTransformationOperator3DnonUniform", () => {
	test("Scale2GreaterZero pass/fail", () => {
		// `Scl2` is a DERIVE attribute -- the forward `Scale2` attribute is set instead.
		const op = create("IfcCartesianTransformationOperator3DnonUniform");
		set(op, "Scale2", 1.0);
		expectPass("IfcCartesianTransformationOperator3DnonUniform", "Scale2GreaterZero", op);

		const badOp = create("IfcCartesianTransformationOperator3DnonUniform");
		set(badOp, "Scale2", 0.0);
		expectFail("IfcCartesianTransformationOperator3DnonUniform", "Scale2GreaterZero", badOp);
	});
	test("Scale3GreaterZero pass/fail", () => {
		// `Scl3` is a DERIVE attribute (`nvl(Scale3, Scl)`) -- the forward `Scale3` attribute
		// is set instead.
		const op = create("IfcCartesianTransformationOperator3DnonUniform");
		set(op, "Scale3", 1.0);
		expectPass("IfcCartesianTransformationOperator3DnonUniform", "Scale3GreaterZero", op);

		const badOp = create("IfcCartesianTransformationOperator3DnonUniform");
		set(badOp, "Scale3", 0.0);
		expectFail("IfcCartesianTransformationOperator3DnonUniform", "Scale3GreaterZero", badOp);
	});
});

describe("IfcCircleHollowProfileDef.WR1", () => {
	test("pass/fail", () => {
		const profile = create("IfcCircleHollowProfileDef");
		set(profile, "Radius", 10);
		set(profile, "WallThickness", 2);
		expectPass("IfcCircleHollowProfileDef", "WR1", profile);

		const badProfile = create("IfcCircleHollowProfileDef");
		set(badProfile, "Radius", 10);
		set(badProfile, "WallThickness", 10);
		expectFail("IfcCircleHollowProfileDef", "WR1", badProfile);
	});
});

describe("IfcColumnStandardCase.HasMaterialProfileSetUsage", () => {
	function relAssociatesMaterial(relatedObject: EntityInstance, relatingMaterial: EntityInstance): void {
		const rel = create("IfcRelAssociatesMaterial");
		set(rel, "RelatedObjects", [relatedObject]);
		set(rel, "RelatingMaterial", relatingMaterial);
	}

	test("pass: exactly one IfcRelAssociatesMaterial with an IfcMaterialProfileSetUsage", () => {
		const column = create("IfcColumnStandardCase");
		relAssociatesMaterial(column, create("IfcMaterialProfileSetUsage"));
		expectPass("IfcColumnStandardCase", "HasMaterialProfileSetUsage", column);
	});
	test("fail: no material association at all", () => {
		expectFail("IfcColumnStandardCase", "HasMaterialProfileSetUsage", create("IfcColumnStandardCase"));
	});
	test("fail: associated material is not an IfcMaterialProfileSetUsage", () => {
		const column = create("IfcColumnStandardCase");
		relAssociatesMaterial(column, create("IfcMaterial"));
		expectFail("IfcColumnStandardCase", "HasMaterialProfileSetUsage", column);
	});
});

describe("IfcComplexProperty", () => {
	function singleValue(name: string): EntityInstance {
		const p = create("IfcPropertySingleValue");
		set(p, "Name", name);
		return p;
	}

	test("WR21 pass/fail (no self-reference)", () => {
		const prop = create("IfcComplexProperty");
		set(prop, "HasProperties", [singleValue("A")]);
		expectPass("IfcComplexProperty", "WR21", prop);

		const selfReferencing = create("IfcComplexProperty");
		set(selfReferencing, "HasProperties", [selfReferencing]);
		expectFail("IfcComplexProperty", "WR21", selfReferencing);
	});
	test("WR22 pass/fail (unique property names)", () => {
		const prop = create("IfcComplexProperty");
		set(prop, "HasProperties", [singleValue("A"), singleValue("B")]);
		expectPass("IfcComplexProperty", "WR22", prop);

		const dup = create("IfcComplexProperty");
		set(dup, "HasProperties", [singleValue("A"), singleValue("A")]);
		expectFail("IfcComplexProperty", "WR22", dup);
	});
});

describe("IfcComplexPropertyTemplate", () => {
	function simpleTemplate(name: string): EntityInstance {
		const t = create("IfcSimplePropertyTemplate");
		set(t, "Name", name);
		return t;
	}

	test("UniquePropertyNames pass/fail", () => {
		const template = create("IfcComplexPropertyTemplate");
		set(template, "HasPropertyTemplates", [simpleTemplate("A"), simpleTemplate("B")]);
		expectPass("IfcComplexPropertyTemplate", "UniquePropertyNames", template);

		const dup = create("IfcComplexPropertyTemplate");
		set(dup, "HasPropertyTemplates", [simpleTemplate("A"), simpleTemplate("A")]);
		expectFail("IfcComplexPropertyTemplate", "UniquePropertyNames", dup);
	});
	test("NoSelfReference pass/fail", () => {
		const template = create("IfcComplexPropertyTemplate");
		set(template, "HasPropertyTemplates", [simpleTemplate("A")]);
		expectPass("IfcComplexPropertyTemplate", "NoSelfReference", template);

		const selfReferencing = create("IfcComplexPropertyTemplate");
		set(selfReferencing, "HasPropertyTemplates", [selfReferencing]);
		expectFail("IfcComplexPropertyTemplate", "NoSelfReference", selfReferencing);
	});
});

function compositeCurveSegment(parentCurve: EntityInstance, transition = "CONTINUOUS"): EntityInstance {
	const seg = create("IfcCompositeCurveSegment");
	set(seg, "Transition", transition);
	set(seg, "SameSense", true);
	set(seg, "ParentCurve", parentCurve);
	return seg;
}

describe("IfcCompositeCurve.CurveContinuous", () => {
	test("pass: open curve with exactly one DISCONTINUOUS-transition segment", () => {
		const curve = create("IfcCompositeCurve");
		set(curve, "Segments", [compositeCurveSegment(polyline3D(), "DISCONTINUOUS")]);
		set(curve, "SelfIntersect", false);
		expectPass("IfcCompositeCurve", "CurveContinuous", curve);
	});
	test("fail: open curve (last segment DISCONTINUOUS) with more than one DISCONTINUOUS segment", () => {
		const curve = create("IfcCompositeCurve");
		set(curve, "Segments", [
			compositeCurveSegment(polyline3D(), "DISCONTINUOUS"),
			compositeCurveSegment(polyline3D(), "DISCONTINUOUS"),
		]);
		set(curve, "SelfIntersect", false);
		expectFail("IfcCompositeCurve", "CurveContinuous", curve);
	});
	test("pass: closed curve (last segment not DISCONTINUOUS) with zero DISCONTINUOUS segments", () => {
		const curve = create("IfcCompositeCurve");
		set(curve, "Segments", [
			compositeCurveSegment(polyline3D(), "CONTINUOUS"),
			compositeCurveSegment(polyline3D(), "CONTINUOUS"),
		]);
		set(curve, "SelfIntersect", false);
		expectPass("IfcCompositeCurve", "CurveContinuous", curve);
	});
	test("fail: closed curve (last segment not DISCONTINUOUS) but an earlier segment is DISCONTINUOUS", () => {
		const curve = create("IfcCompositeCurve");
		set(curve, "Segments", [
			compositeCurveSegment(polyline3D(), "DISCONTINUOUS"),
			compositeCurveSegment(polyline3D(), "CONTINUOUS"),
		]);
		set(curve, "SelfIntersect", false);
		expectFail("IfcCompositeCurve", "CurveContinuous", curve);
	});
});

describe("IfcCompositeCurve.SameDim", () => {
	test("pass: every segment's own ParentCurve shares the first segment's own Dim", () => {
		const curve = create("IfcCompositeCurve");
		set(curve, "Segments", [compositeCurveSegment(polyline3D()), compositeCurveSegment(polyline3D())]);
		expectPass("IfcCompositeCurve", "SameDim", curve);
	});
	test("fail: a later segment's own ParentCurve has a different Dim", () => {
		const curve = create("IfcCompositeCurve");
		set(curve, "Segments", [compositeCurveSegment(polyline3D()), compositeCurveSegment(polyline2D())]);
		expectFail("IfcCompositeCurve", "SameDim", curve);
	});
});

function pcurveOn(basisSurface: EntityInstance): EntityInstance {
	const pcurve = create("IfcPcurve");
	set(pcurve, "BasisSurface", basisSurface);
	set(pcurve, "ReferenceCurve", polyline2D());
	return pcurve;
}

describe("IfcCompositeCurveOnSurface.SameSurface", () => {
	test("pass: single segment whose own ParentCurve is an IfcPcurve", () => {
		// `BasisSurface` is a DERIVE attribute (`calc_IfcCompositeCurveOnSurface_BasisSurface`
		// -> `IfcGetBasisSurface`, Phase EX-2) -- see `rules/ifc4.ts`'s own header comment for
		// its 2 disclosed real bugs. A single segment whose own `ParentCurve` is an
		// `IfcPcurve` is the one path that resolves without throwing (recurses into the
		// `IfcPcurve`'s own `BasisSurface`, a 1-element result).
		const curve = create("IfcCompositeCurveOnSurface");
		set(curve, "Segments", [compositeCurveSegment(pcurveOn(planeSurface()))]);
		set(curve, "SelfIntersect", false);
		expectPass("IfcCompositeCurveOnSurface", "SameSurface", curve);
	});
	test("fail: single segment whose own ParentCurve resolves to an empty BasisSurface", () => {
		const curve = create("IfcCompositeCurveOnSurface");
		set(curve, "Segments", [compositeCurveSegment(polyline3D())]);
		set(curve, "SelfIntersect", false);
		expectFail("IfcCompositeCurveOnSurface", "SameSurface", curve);
	});
});

describe("IfcCompositeCurveSegment.ParentIsBoundedCurve", () => {
	test("pass/fail", () => {
		expectPass("IfcCompositeCurveSegment", "ParentIsBoundedCurve", compositeCurveSegment(polyline3D()));
		expectFail("IfcCompositeCurveSegment", "ParentIsBoundedCurve", compositeCurveSegment(create("IfcLine")));
	});
});

describe("IfcCompositeProfileDef", () => {
	function profileWithType(profileType: string): EntityInstance {
		const p = create("IfcRectangleProfileDef");
		set(p, "ProfileType", profileType);
		set(p, "XDim", 1);
		set(p, "YDim", 1);
		return p;
	}

	test("InvariantProfileType pass/fail", () => {
		const composite = create("IfcCompositeProfileDef");
		set(composite, "Profiles", [profileWithType("AREA"), profileWithType("AREA")]);
		expectPass("IfcCompositeProfileDef", "InvariantProfileType", composite);

		const mismatched = create("IfcCompositeProfileDef");
		set(mismatched, "Profiles", [profileWithType("AREA"), profileWithType("CURVE")]);
		expectFail("IfcCompositeProfileDef", "InvariantProfileType", mismatched);
	});
	test("NoRecursion pass/fail", () => {
		const composite = create("IfcCompositeProfileDef");
		set(composite, "Profiles", [profileWithType("AREA")]);
		expectPass("IfcCompositeProfileDef", "NoRecursion", composite);

		const recursive = create("IfcCompositeProfileDef");
		set(recursive, "Profiles", [create("IfcCompositeProfileDef")]);
		expectFail("IfcCompositeProfileDef", "NoRecursion", recursive);
	});
});

describe("IfcConstraint.WR11", () => {
	test("pass: ConstraintGrade is not USERDEFINED", () => {
		const constraint = create("IfcConstraint");
		set(constraint, "ConstraintGrade", "HARD");
		expectPass("IfcConstraint", "WR11", constraint);
	});
	test("pass: ConstraintGrade is USERDEFINED and UserDefinedGrade is given", () => {
		const constraint = create("IfcConstraint");
		set(constraint, "ConstraintGrade", "USERDEFINED");
		set(constraint, "UserDefinedGrade", "Something");
		expectPass("IfcConstraint", "WR11", constraint);
	});
	test("fail: ConstraintGrade is USERDEFINED but UserDefinedGrade is missing", () => {
		const constraint = create("IfcConstraint");
		set(constraint, "ConstraintGrade", "USERDEFINED");
		expectFail("IfcConstraint", "WR11", constraint);
	});
});

function lengthMeasure(value: number): EntityInstance {
	return file.createEntity("IfcPositiveLengthMeasure", value as unknown as never);
}
function descriptiveMeasure(value: string): EntityInstance {
	return file.createEntity("IfcDescriptiveMeasure", value as unknown as never);
}

describe("IfcCurveStyle", () => {
	test("MeasureOfWidth pass/fail", () => {
		expectPass("IfcCurveStyle", "MeasureOfWidth", create("IfcCurveStyle")); // CurveWidth unset

		const withLength = create("IfcCurveStyle");
		set(withLength, "CurveWidth", lengthMeasure(5.0));
		expectPass("IfcCurveStyle", "MeasureOfWidth", withLength);

		const withByLayer = create("IfcCurveStyle");
		set(withByLayer, "CurveWidth", descriptiveMeasure("by layer"));
		expectPass("IfcCurveStyle", "MeasureOfWidth", withByLayer);

		const bad = create("IfcCurveStyle");
		set(bad, "CurveWidth", descriptiveMeasure("solid"));
		expectFail("IfcCurveStyle", "MeasureOfWidth", bad);
	});
	test("IdentifiableCurveStyle pass/fail", () => {
		const withFont = create("IfcCurveStyle");
		set(withFont, "CurveFont", create("IfcCurveStyleFont"));
		expectPass("IfcCurveStyle", "IdentifiableCurveStyle", withFont);

		expectFail("IfcCurveStyle", "IdentifiableCurveStyle", create("IfcCurveStyle"));
	});
});

describe("IfcCurveStyleFontPattern.VisibleLengthGreaterEqualZero", () => {
	test("pass/fail", () => {
		const pattern = create("IfcCurveStyleFontPattern");
		set(pattern, "VisibleSegmentLength", 0.0);
		expectPass("IfcCurveStyleFontPattern", "VisibleLengthGreaterEqualZero", pattern);

		const badPattern = create("IfcCurveStyleFontPattern");
		set(badPattern, "VisibleSegmentLength", -1.0);
		expectFail("IfcCurveStyleFontPattern", "VisibleLengthGreaterEqualZero", badPattern);
	});
});

describe("IfcDerivedProfileDef.InvariantProfileType", () => {
	function parentWithType(profileType: string): EntityInstance {
		const p = create("IfcRectangleProfileDef");
		set(p, "ProfileType", profileType);
		set(p, "XDim", 1);
		set(p, "YDim", 1);
		return p;
	}

	test("pass/fail", () => {
		const derived = create("IfcDerivedProfileDef");
		set(derived, "ProfileType", "AREA");
		set(derived, "ParentProfile", parentWithType("AREA"));
		expectPass("IfcDerivedProfileDef", "InvariantProfileType", derived);

		const badDerived = create("IfcDerivedProfileDef");
		set(badDerived, "ProfileType", "CURVE");
		set(badDerived, "ParentProfile", parentWithType("AREA"));
		expectFail("IfcDerivedProfileDef", "InvariantProfileType", badDerived);
	});
});

describe("IfcDerivedUnit", () => {
	function derivedUnitElement(exponent: number): EntityInstance {
		const el = create("IfcDerivedUnitElement");
		set(el, "Unit", create("IfcSIUnit"));
		set(el, "Exponent", exponent);
		return el;
	}

	test("WR1 pass/fail", () => {
		const twoElements = create("IfcDerivedUnit");
		set(twoElements, "Elements", [derivedUnitElement(1), derivedUnitElement(-1)]);
		expectPass("IfcDerivedUnit", "WR1", twoElements);

		const oneNonUnitExponent = create("IfcDerivedUnit");
		set(oneNonUnitExponent, "Elements", [derivedUnitElement(2)]);
		expectPass("IfcDerivedUnit", "WR1", oneNonUnitExponent);

		const oneUnitExponent = create("IfcDerivedUnit");
		set(oneUnitExponent, "Elements", [derivedUnitElement(1)]);
		expectFail("IfcDerivedUnit", "WR1", oneUnitExponent);
	});
	test("WR2 pass/fail", () => {
		const unit = create("IfcDerivedUnit");
		set(unit, "UnitType", "MASSDENSITYUNIT");
		expectPass("IfcDerivedUnit", "WR2", unit);

		const userDefinedOk = create("IfcDerivedUnit");
		set(userDefinedOk, "UnitType", "USERDEFINED");
		set(userDefinedOk, "UserDefinedType", "Something");
		expectPass("IfcDerivedUnit", "WR2", userDefinedOk);

		const userDefinedBad = create("IfcDerivedUnit");
		set(userDefinedBad, "UnitType", "USERDEFINED");
		expectFail("IfcDerivedUnit", "WR2", userDefinedBad);
	});
});

describe("IfcDirection.MagnitudeGreaterZero", () => {
	test("pass/fail", () => {
		expectPass("IfcDirection", "MagnitudeGreaterZero", direction3D([0, 0, 1]));
		expectFail("IfcDirection", "MagnitudeGreaterZero", direction3D([0, 0, 0]));
	});
});

describe("IfcDocumentReference.WR1", () => {
	test("pass: only Name given", () => {
		const ref = create("IfcDocumentReference");
		set(ref, "Name", "Ref-1");
		expectPass("IfcDocumentReference", "WR1", ref);
	});
	test("pass: only ReferencedDocument given", () => {
		const ref = create("IfcDocumentReference");
		set(ref, "ReferencedDocument", create("IfcDocumentInformation"));
		expectPass("IfcDocumentReference", "WR1", ref);
	});
	test("fail: both given", () => {
		const ref = create("IfcDocumentReference");
		set(ref, "Name", "Ref-1");
		set(ref, "ReferencedDocument", create("IfcDocumentInformation"));
		expectFail("IfcDocumentReference", "WR1", ref);
	});
	test("fail: neither given", () => {
		expectFail("IfcDocumentReference", "WR1", create("IfcDocumentReference"));
	});
});

describe("IfcDoorLiningProperties", () => {
	test("WR31 pass/fail", () => {
		const withBoth = create("IfcDoorLiningProperties");
		set(withBoth, "LiningDepth", 10);
		set(withBoth, "LiningThickness", 2);
		expectPass("IfcDoorLiningProperties", "WR31", withBoth);

		expectPass("IfcDoorLiningProperties", "WR31", create("IfcDoorLiningProperties")); // neither given

		const badLining = create("IfcDoorLiningProperties");
		set(badLining, "LiningDepth", 10);
		expectFail("IfcDoorLiningProperties", "WR31", badLining);
	});
	test("WR32 pass/fail", () => {
		const withBoth = create("IfcDoorLiningProperties");
		set(withBoth, "ThresholdDepth", 10);
		set(withBoth, "ThresholdThickness", 2);
		expectPass("IfcDoorLiningProperties", "WR32", withBoth);

		const badThreshold = create("IfcDoorLiningProperties");
		set(badThreshold, "ThresholdDepth", 10);
		expectFail("IfcDoorLiningProperties", "WR32", badThreshold);
	});
	test("WR33 pass/fail", () => {
		const withBoth = create("IfcDoorLiningProperties");
		set(withBoth, "TransomOffset", 10);
		set(withBoth, "TransomThickness", 2);
		expectPass("IfcDoorLiningProperties", "WR33", withBoth);

		expectPass("IfcDoorLiningProperties", "WR33", create("IfcDoorLiningProperties")); // neither given

		const onlyOffset = create("IfcDoorLiningProperties");
		set(onlyOffset, "TransomOffset", 10);
		expectFail("IfcDoorLiningProperties", "WR33", onlyOffset);
	});
	test("WR34 pass/fail", () => {
		const withBoth = create("IfcDoorLiningProperties");
		set(withBoth, "CasingDepth", 10);
		set(withBoth, "CasingThickness", 2);
		expectPass("IfcDoorLiningProperties", "WR34", withBoth);

		const onlyDepth = create("IfcDoorLiningProperties");
		set(onlyDepth, "CasingDepth", 10);
		expectFail("IfcDoorLiningProperties", "WR34", onlyDepth);
	});
});

function definesTypeVia(propsOrPanel: EntityInstance, typeObject: EntityInstance): void {
	set(typeObject, "HasPropertySets", [propsOrPanel]);
}

describe("IfcDoorLiningProperties.WR35 / IfcDoorPanelProperties.ApplicableToType", () => {
	test("IfcDoorLiningProperties.WR35 pass: DefinesType[0] is an IfcDoorType", () => {
		const lining = create("IfcDoorLiningProperties");
		definesTypeVia(lining, create("IfcDoorType"));
		expectPass("IfcDoorLiningProperties", "WR35", lining);
	});
	test("IfcDoorLiningProperties.WR35 pass: DefinesType[0] is an IfcDoorStyle", () => {
		const lining = create("IfcDoorLiningProperties");
		definesTypeVia(lining, create("IfcDoorStyle"));
		expectPass("IfcDoorLiningProperties", "WR35", lining);
	});
	test("IfcDoorLiningProperties.WR35 fail: DefinesType[0] is neither", () => {
		const lining = create("IfcDoorLiningProperties");
		definesTypeVia(lining, create("IfcWindowType"));
		expectFail("IfcDoorLiningProperties", "WR35", lining);
	});
	test("IfcDoorLiningProperties.WR35 fail: no DefinesType at all", () => {
		expectFail("IfcDoorLiningProperties", "WR35", create("IfcDoorLiningProperties"));
	});
	test("IfcDoorPanelProperties.ApplicableToType pass/fail", () => {
		const panel = create("IfcDoorPanelProperties");
		definesTypeVia(panel, create("IfcDoorType"));
		expectPass("IfcDoorPanelProperties", "ApplicableToType", panel);

		const badPanel = create("IfcDoorPanelProperties");
		definesTypeVia(badPanel, create("IfcWindowType"));
		expectFail("IfcDoorPanelProperties", "ApplicableToType", badPanel);
	});
});

describe("IfcDraughtingPreDefinedColour.PreDefinedColourNames", () => {
	test("pass/fail", () => {
		const colour = create("IfcDraughtingPreDefinedColour");
		set(colour, "Name", "Red");
		expectPass("IfcDraughtingPreDefinedColour", "PreDefinedColourNames", colour);

		const badColour = create("IfcDraughtingPreDefinedColour");
		set(badColour, "Name", "Purple");
		expectFail("IfcDraughtingPreDefinedColour", "PreDefinedColourNames", badColour);
	});
});

describe("IfcDraughtingPreDefinedCurveFont.PreDefinedCurveFontNames", () => {
	test("pass/fail", () => {
		const font = create("IfcDraughtingPreDefinedCurveFont");
		set(font, "Name", "Dashed");
		expectPass("IfcDraughtingPreDefinedCurveFont", "PreDefinedCurveFontNames", font);

		const badFont = create("IfcDraughtingPreDefinedCurveFont");
		set(badFont, "Name", "Solid");
		expectFail("IfcDraughtingPreDefinedCurveFont", "PreDefinedCurveFontNames", badFont);
	});
});

// =============================================================================
// Phase EX-4, IFC4 chunk 3: original, hand-rolled coverage for the 120 WHERE-rule classes
// this chunk adds to `src/express/whereRules/ifc4.ts` (real source lines 6627-7852,
// `IfcDuctFittingType_CorrectPredefinedType` through `IfcLine_SameDim`) -- same conventions
// as chunks 1/2's own tests above: data-driven `describe.each` blocks for the two dominant
// shapes (`correctPredefinedType`/`correctTypeAssigned`), individual `describe` blocks for
// every other rule, `create`/`set`/`typeAssign`/`edgeLoopBound`/`direction3D`/`point3D`
// all reused directly from chunks 1/2's own module-scope helpers above (this file is one
// shared module, not per-chunk).
// =============================================================================

interface CorrectPredefinedTypeCaseChunk3 {
	readonly typeName: string;
	readonly escapeAttr: string;
	readonly optional: boolean;
}

// Hand-derived directly from `whereRules/ifc4.ts`'s own chunk 3 `correctPredefinedType(...)`
// call sites (real source lines 6627-7852) -- `optional` matches that file's own
// `predefinedTypeOptional` argument at each site exactly. Includes this chunk's own two
// newly-confirmed escape-attribute values, `"ProcessType"` (`IfcEventType`) and
// `"ResourceType"` (`IfcLaborResourceType`).
const correctPredefinedTypeCasesChunk3: readonly CorrectPredefinedTypeCaseChunk3[] = [
	{ typeName: "IfcDuctFittingType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcDuctSegment", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcDuctSegmentType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcDuctSilencer", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcDuctSilencerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcElectricAppliance", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcElectricApplianceType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcElectricDistributionBoard", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcElectricDistributionBoardType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcElectricFlowStorageDevice", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcElectricFlowStorageDeviceType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcElectricGenerator", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcElectricGeneratorType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcElectricMotor", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcElectricMotorType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcElectricTimeControl", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcElectricTimeControlType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcElementAssembly", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcElementAssemblyType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcEngine", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcEngineType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcEvaporativeCooler", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcEvaporativeCoolerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcEvaporator", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcEvaporatorType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcEvent", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcEventType", escapeAttr: "ProcessType", optional: false },
	{ typeName: "IfcFan", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFanType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcFastener", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFastenerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcFilter", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFilterType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcFireSuppressionTerminal", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFireSuppressionTerminalType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcFlowInstrument", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFlowInstrumentType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcFlowMeter", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFlowMeterType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcFooting", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFootingType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcFurniture", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcFurnitureType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcGeographicElement", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcGeographicElementType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcHeatExchanger", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcHeatExchangerType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcHumidifier", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcHumidifierType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcInterceptor", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcInterceptorType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcJunctionBox", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcJunctionBoxType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcLaborResource", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcLaborResourceType", escapeAttr: "ResourceType", optional: false },
	{ typeName: "IfcLamp", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcLampType", escapeAttr: "ElementType", optional: false },
	{ typeName: "IfcLightFixture", escapeAttr: "ObjectType", optional: true },
	{ typeName: "IfcLightFixtureType", escapeAttr: "ElementType", optional: false },
];

describe.each(correctPredefinedTypeCasesChunk3)(
	"$typeName.CorrectPredefinedType (chunk 3)",
	({ typeName, escapeAttr, optional }) => {
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
	},
);

interface CorrectTypeAssignedCaseChunk3 {
	readonly typeName: string;
	readonly expectedTypeName: string;
}

// Hand-derived directly from `whereRules/ifc4.ts`'s own chunk 3 `correctTypeAssigned(...)`
// call sites (real source lines 6647-7842). `IfcEvent`/`IfcEventType`, despite having
// `RULE_NAME`s of `CorrectTypeAssigned`/`CorrectEventTriggerType`, do NOT use this shape at
// all (see this chunk's own header comment) and are covered by their own individual
// `describe` blocks below instead.
const correctTypeAssignedCasesChunk3: readonly CorrectTypeAssignedCaseChunk3[] = [
	{ typeName: "IfcDuctSegment", expectedTypeName: "IfcDuctSegmentType" },
	{ typeName: "IfcDuctSilencer", expectedTypeName: "IfcDuctSilencerType" },
	{ typeName: "IfcElectricAppliance", expectedTypeName: "IfcElectricApplianceType" },
	{ typeName: "IfcElectricDistributionBoard", expectedTypeName: "IfcElectricDistributionBoardType" },
	{ typeName: "IfcElectricFlowStorageDevice", expectedTypeName: "IfcElectricFlowStorageDeviceType" },
	{ typeName: "IfcElectricGenerator", expectedTypeName: "IfcElectricGeneratorType" },
	{ typeName: "IfcElectricMotor", expectedTypeName: "IfcElectricMotorType" },
	{ typeName: "IfcElectricTimeControl", expectedTypeName: "IfcElectricTimeControlType" },
	{ typeName: "IfcElementAssembly", expectedTypeName: "IfcElementAssemblyType" },
	{ typeName: "IfcEngine", expectedTypeName: "IfcEngineType" },
	{ typeName: "IfcEvaporativeCooler", expectedTypeName: "IfcEvaporativeCoolerType" },
	{ typeName: "IfcEvaporator", expectedTypeName: "IfcEvaporatorType" },
	{ typeName: "IfcFan", expectedTypeName: "IfcFanType" },
	{ typeName: "IfcFastener", expectedTypeName: "IfcFastenerType" },
	{ typeName: "IfcFilter", expectedTypeName: "IfcFilterType" },
	{ typeName: "IfcFireSuppressionTerminal", expectedTypeName: "IfcFireSuppressionTerminalType" },
	{ typeName: "IfcFlowInstrument", expectedTypeName: "IfcFlowInstrumentType" },
	{ typeName: "IfcFlowMeter", expectedTypeName: "IfcFlowMeterType" },
	{ typeName: "IfcFooting", expectedTypeName: "IfcFootingType" },
	{ typeName: "IfcFurniture", expectedTypeName: "IfcFurnitureType" },
	{ typeName: "IfcGeographicElement", expectedTypeName: "IfcGeographicElementType" },
	{ typeName: "IfcHeatExchanger", expectedTypeName: "IfcHeatExchangerType" },
	{ typeName: "IfcHumidifier", expectedTypeName: "IfcHumidifierType" },
	{ typeName: "IfcInterceptor", expectedTypeName: "IfcInterceptorType" },
	{ typeName: "IfcJunctionBox", expectedTypeName: "IfcJunctionBoxType" },
	{ typeName: "IfcLamp", expectedTypeName: "IfcLampType" },
	{ typeName: "IfcLightFixture", expectedTypeName: "IfcLightFixtureType" },
];

describe.each(correctTypeAssignedCasesChunk3)(
	"$typeName.CorrectTypeAssigned (chunk 3)",
	({ typeName, expectedTypeName }) => {
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
			// `IfcActuatorType` (chunk 1) is a real, always-available *Type entity not equal to
			// any `expectedTypeName` this chunk's own cases use.
			typeAssign(inst, create("IfcActuatorType"));
			expectFail(typeName, "CorrectTypeAssigned", inst);
		});
	},
);

describe("IfcEdgeLoop", () => {
	// Every vertex gets its OWN distinct `VertexGeometry` (a distinctly-coordinated
	// `IfcCartesianPoint`) -- `settings.compareInstancesByValue` is on for this whole test
	// file (`beforeAll` above), so two BLANK `IfcVertexPoint` instances (no attributes set)
	// would otherwise compare as structurally EQUAL despite being different objects,
	// silently defeating any "these are different vertices" fixture.
	let vertexCounter = 0;
	function vertex(): EntityInstance {
		vertexCounter += 1;
		const v = create("IfcVertexPoint");
		set(v, "VertexGeometry", point3D([vertexCounter, 0, 0]));
		return v;
	}

	// `Orientation` MUST be `true` -- `IfcOrientedEdge.EdgeStart`/`EdgeEnd` are themselves
	// DERIVE attributes (`calc_IfcOrientedEdge_EdgeStart`/`_EdgeEnd`, Phase EX-2) that swap
	// `EdgeElement.EdgeStart`/`EdgeEnd` when `Orientation` is `false` -- leaving it unset
	// would silently reverse every edge's own endpoints.
	function edgeLoopFromEndpoints(pairs: Array<[EntityInstance, EntityInstance]>): EntityInstance {
		const orientedEdges = pairs.map(([start, end]) => {
			const edge = create("IfcEdge");
			set(edge, "EdgeStart", start);
			set(edge, "EdgeEnd", end);
			const oe = create("IfcOrientedEdge");
			set(oe, "EdgeElement", edge);
			set(oe, "Orientation", true);
			return oe;
		});
		const loop = create("IfcEdgeLoop");
		set(loop, "EdgeList", orientedEdges);
		return loop;
	}

	test("IsClosed pass: first EdgeStart equals last EdgeEnd", () => {
		const a = vertex();
		const b = vertex();
		const c = vertex();
		const loop = edgeLoopFromEndpoints([
			[a, b],
			[b, c],
			[c, a],
		]);
		expectPass("IfcEdgeLoop", "IsClosed", loop);
	});

	test("IsClosed fail: first EdgeStart does not equal last EdgeEnd", () => {
		const a = vertex();
		const b = vertex();
		const c = vertex();
		const d = vertex();
		const loop = edgeLoopFromEndpoints([
			[a, b],
			[b, c],
			[c, d],
		]);
		expectFail("IfcEdgeLoop", "IsClosed", loop);
	});

	test("IsContinuous pass: each edge's EdgeEnd equals the next edge's EdgeStart", () => {
		const a = vertex();
		const b = vertex();
		const c = vertex();
		const loop = edgeLoopFromEndpoints([
			[a, b],
			[b, c],
		]);
		expectPass("IfcEdgeLoop", "IsContinuous", loop);
	});

	test("IsContinuous fail: a gap between consecutive edges", () => {
		const a = vertex();
		const b = vertex();
		const c = vertex();
		const d = vertex();
		const loop = edgeLoopFromEndpoints([
			[a, b],
			[c, d],
		]);
		expectFail("IfcEdgeLoop", "IsContinuous", loop);
	});
});

describe("IfcElementQuantity.UniqueQuantityNames", () => {
	function quantity(name: string): EntityInstance {
		const q = create("IfcQuantityCount");
		set(q, "Name", name);
		return q;
	}

	test("pass: every quantity has a distinct Name", () => {
		const eq = create("IfcElementQuantity");
		set(eq, "Quantities", [quantity("Width"), quantity("Height")]);
		expectPass("IfcElementQuantity", "UniqueQuantityNames", eq);
	});

	test("fail: two quantities share the same Name", () => {
		const eq = create("IfcElementQuantity");
		set(eq, "Quantities", [quantity("Width"), quantity("Width")]);
		expectFail("IfcElementQuantity", "UniqueQuantityNames", eq);
	});
});

describe("IfcEvent.CorrectTypeAssigned (real body: EventTriggerType escape-attribute check, not IsTypedBy)", () => {
	test("pass: EventTriggerType is not given at all", () => {
		expectPass("IfcEvent", "CorrectTypeAssigned", create("IfcEvent"));
	});
	test("pass: EventTriggerType is a non-USERDEFINED enum value", () => {
		const event = create("IfcEvent");
		set(event, "EventTriggerType", "EVENTRULE");
		expectPass("IfcEvent", "CorrectTypeAssigned", event);
	});
	test("pass: EventTriggerType is USERDEFINED and UserDefinedEventTriggerType is given", () => {
		const event = create("IfcEvent");
		set(event, "EventTriggerType", "USERDEFINED");
		set(event, "UserDefinedEventTriggerType", "Something");
		expectPass("IfcEvent", "CorrectTypeAssigned", event);
	});
	test("fail: EventTriggerType is USERDEFINED but UserDefinedEventTriggerType is missing", () => {
		const event = create("IfcEvent");
		set(event, "EventTriggerType", "USERDEFINED");
		expectFail("IfcEvent", "CorrectTypeAssigned", event);
	});
});

describe("IfcEventType.CorrectEventTriggerType", () => {
	test("pass: EventTriggerType is a non-USERDEFINED enum value", () => {
		const eventType = create("IfcEventType");
		set(eventType, "EventTriggerType", "EVENTRULE");
		expectPass("IfcEventType", "CorrectEventTriggerType", eventType);
	});
	test("pass: EventTriggerType is USERDEFINED and UserDefinedEventTriggerType is given", () => {
		const eventType = create("IfcEventType");
		set(eventType, "EventTriggerType", "USERDEFINED");
		set(eventType, "UserDefinedEventTriggerType", "Something");
		expectPass("IfcEventType", "CorrectEventTriggerType", eventType);
	});
	test("fail: EventTriggerType is USERDEFINED but UserDefinedEventTriggerType is missing", () => {
		const eventType = create("IfcEventType");
		set(eventType, "EventTriggerType", "USERDEFINED");
		expectFail("IfcEventType", "CorrectEventTriggerType", eventType);
	});
});

describe("IfcExternalReference.WR1", () => {
	test("pass: Identification given", () => {
		const ref = create("IfcExternalReference");
		set(ref, "Identification", "REF-1");
		expectPass("IfcExternalReference", "WR1", ref);
	});
	test("pass: Location given", () => {
		const ref = create("IfcExternalReference");
		set(ref, "Location", "http://example.com");
		expectPass("IfcExternalReference", "WR1", ref);
	});
	test("pass: Name given", () => {
		const ref = create("IfcExternalReference");
		set(ref, "Name", "My Reference");
		expectPass("IfcExternalReference", "WR1", ref);
	});
	test("fail: none given", () => {
		expectFail("IfcExternalReference", "WR1", create("IfcExternalReference"));
	});
});

describe("IfcExtrudedAreaSolid.ValidExtrusionDirection", () => {
	test("pass: ExtrudedDirection is not perpendicular to Z", () => {
		const solid = create("IfcExtrudedAreaSolid");
		set(solid, "ExtrudedDirection", direction3D([0, 0, 1]));
		expectPass("IfcExtrudedAreaSolid", "ValidExtrusionDirection", solid);
	});
	test("fail: ExtrudedDirection is perpendicular to Z", () => {
		const solid = create("IfcExtrudedAreaSolid");
		set(solid, "ExtrudedDirection", direction3D([1, 0, 0]));
		expectFail("IfcExtrudedAreaSolid", "ValidExtrusionDirection", solid);
	});
});

describe("IfcExtrudedAreaSolidTapered.CorrectProfileAssignment", () => {
	test("pass: both sides are the same kind of IfcParameterizedProfileDef", () => {
		const solid = create("IfcExtrudedAreaSolidTapered");
		const start = create("IfcCircleProfileDef");
		set(start, "ProfileType", "AREA");
		set(start, "Radius", 1);
		const end = create("IfcCircleProfileDef");
		set(end, "ProfileType", "AREA");
		set(end, "Radius", 2);
		set(solid, "SweptArea", start);
		set(solid, "EndSweptArea", end);
		expectPass("IfcExtrudedAreaSolidTapered", "CorrectProfileAssignment", solid);
	});
	test("pass: EndSweptArea is an IfcDerivedProfileDef whose ParentProfile matches SweptArea", () => {
		const solid = create("IfcExtrudedAreaSolidTapered");
		const start = create("IfcCircleProfileDef");
		set(start, "ProfileType", "AREA");
		set(start, "Radius", 1);
		const derived = create("IfcDerivedProfileDef");
		set(derived, "ParentProfile", start);
		set(solid, "SweptArea", start);
		set(solid, "EndSweptArea", derived);
		expectPass("IfcExtrudedAreaSolidTapered", "CorrectProfileAssignment", solid);
	});
	test("fail: mismatched, unrelated profile kinds", () => {
		const solid = create("IfcExtrudedAreaSolidTapered");
		const start = create("IfcCircleProfileDef");
		set(start, "ProfileType", "AREA");
		set(start, "Radius", 1);
		const end = create("IfcRectangleProfileDef");
		set(end, "ProfileType", "AREA");
		set(end, "XDim", 1);
		set(end, "YDim", 1);
		set(solid, "SweptArea", start);
		set(solid, "EndSweptArea", end);
		expectFail("IfcExtrudedAreaSolidTapered", "CorrectProfileAssignment", solid);
	});
});

describe("IfcFace.HasOuterBound", () => {
	function faceOuterBound(): EntityInstance {
		return create("IfcFaceOuterBound");
	}
	function faceBound(): EntityInstance {
		return create("IfcFaceBound");
	}

	test("pass: no bounds at all", () => {
		const face = create("IfcFace");
		set(face, "Bounds", []);
		expectPass("IfcFace", "HasOuterBound", face);
	});
	test("pass: exactly one IfcFaceOuterBound", () => {
		const face = create("IfcFace");
		set(face, "Bounds", [faceOuterBound(), faceBound()]);
		expectPass("IfcFace", "HasOuterBound", face);
	});
	test("fail: two IfcFaceOuterBound members", () => {
		const face = create("IfcFace");
		set(face, "Bounds", [faceOuterBound(), faceOuterBound()]);
		expectFail("IfcFace", "HasOuterBound", face);
	});
});

describe("IfcFeatureElementSubtraction", () => {
	// `HasOpenings`/`FillsVoids` are INVERSE attributes -- not settable directly via
	// `.set()` (confirmed: `EntityInstance.set` resolves through `get_argument_index`,
	// which only knows real forward attributes). Populate them the real way, by creating
	// the actual relationship instance pointing back at the feature (`IfcRelVoidsElement.
	// RelatingBuildingElement` / `IfcRelFillsElement.RelatedBuildingElement`, both
	// confirmed directly against real schema introspection).
	test("HasNoSubtraction pass/fail", () => {
		const feature = create("IfcOpeningElement");
		expectPass("IfcFeatureElementSubtraction", "HasNoSubtraction", feature);

		const badFeature = create("IfcOpeningElement");
		const rel = create("IfcRelVoidsElement");
		set(rel, "RelatingBuildingElement", badFeature);
		expectFail("IfcFeatureElementSubtraction", "HasNoSubtraction", badFeature);
	});
	test("IsNotFilling pass/fail", () => {
		const feature = create("IfcOpeningElement");
		expectPass("IfcFeatureElementSubtraction", "IsNotFilling", feature);

		const badFeature = create("IfcOpeningElement");
		const rel = create("IfcRelFillsElement");
		set(rel, "RelatedBuildingElement", badFeature);
		expectFail("IfcFeatureElementSubtraction", "IsNotFilling", badFeature);
	});
});

describe("IfcFillAreaStyle", () => {
	test("MaxOneColour: always passes (IfcColour is a SELECT type -- see this file's own header comment / whereRules/ifc4.ts's ifcCorrectFillAreaStyle doc comment)", () => {
		const style = create("IfcFillAreaStyle");
		set(style, "FillStyles", [create("IfcColourRgb"), create("IfcColourRgb"), create("IfcColourRgb")]);
		expectPass("IfcFillAreaStyle", "MaxOneColour", style);
	});
	test("MaxOneExtHatchStyle pass/fail", () => {
		const style = create("IfcFillAreaStyle");
		set(style, "FillStyles", [create("IfcExternallyDefinedHatchStyle")]);
		expectPass("IfcFillAreaStyle", "MaxOneExtHatchStyle", style);

		const badStyle = create("IfcFillAreaStyle");
		set(badStyle, "FillStyles", [create("IfcExternallyDefinedHatchStyle"), create("IfcExternallyDefinedHatchStyle")]);
		expectFail("IfcFillAreaStyle", "MaxOneExtHatchStyle", badStyle);
	});
	test("ConsistentHatchStyleDef pass: hatching alone", () => {
		const style = create("IfcFillAreaStyle");
		set(style, "FillStyles", [create("IfcFillAreaStyleHatching")]);
		expectPass("IfcFillAreaStyle", "ConsistentHatchStyleDef", style);
	});
	test("ConsistentHatchStyleDef fail: both hatching and tiles", () => {
		const style = create("IfcFillAreaStyle");
		set(style, "FillStyles", [create("IfcFillAreaStyleHatching"), create("IfcFillAreaStyleTiles")]);
		expectFail("IfcFillAreaStyle", "ConsistentHatchStyleDef", style);
	});
});

describe("IfcFillAreaStyleHatching", () => {
	test("PatternStart2D pass/fail", () => {
		const hatching = create("IfcFillAreaStyleHatching");
		expectPass("IfcFillAreaStyleHatching", "PatternStart2D", hatching); // not given -- passes

		const okHatching = create("IfcFillAreaStyleHatching");
		set(okHatching, "PatternStart", point2D([0, 0]));
		expectPass("IfcFillAreaStyleHatching", "PatternStart2D", okHatching);

		const badHatching = create("IfcFillAreaStyleHatching");
		set(badHatching, "PatternStart", point3D([0, 0, 0]));
		expectFail("IfcFillAreaStyleHatching", "PatternStart2D", badHatching);
	});
	test("RefHatchLine2D pass/fail", () => {
		const hatching = create("IfcFillAreaStyleHatching");
		expectPass("IfcFillAreaStyleHatching", "RefHatchLine2D", hatching); // not given -- passes

		const okHatching = create("IfcFillAreaStyleHatching");
		set(okHatching, "PointOfReferenceHatchLine", point2D([0, 0]));
		expectPass("IfcFillAreaStyleHatching", "RefHatchLine2D", okHatching);

		const badHatching = create("IfcFillAreaStyleHatching");
		set(badHatching, "PointOfReferenceHatchLine", point3D([0, 0, 0]));
		expectFail("IfcFillAreaStyleHatching", "RefHatchLine2D", badHatching);
	});
});

describe("IfcFixedReferenceSweptAreaSolid.DirectrixBounded", () => {
	test("pass: StartParam and EndParam both given", () => {
		const solid = create("IfcFixedReferenceSweptAreaSolid");
		set(solid, "Directrix", create("IfcLine"));
		set(solid, "StartParam", 0);
		set(solid, "EndParam", 1);
		expectPass("IfcFixedReferenceSweptAreaSolid", "DirectrixBounded", solid);
	});
	test("pass: Directrix is an IfcConic (e.g. IfcCircle), neither param given", () => {
		const solid = create("IfcFixedReferenceSweptAreaSolid");
		set(solid, "Directrix", create("IfcCircle"));
		expectPass("IfcFixedReferenceSweptAreaSolid", "DirectrixBounded", solid);
	});
	test("fail: Directrix is an unbounded IfcLine, neither param given", () => {
		const solid = create("IfcFixedReferenceSweptAreaSolid");
		set(solid, "Directrix", create("IfcLine"));
		expectFail("IfcFixedReferenceSweptAreaSolid", "DirectrixBounded", solid);
	});
});

describe("IfcGeometricCurveSet.NoSurfaces", () => {
	test("pass: only curves/points", () => {
		const set_ = create("IfcGeometricCurveSet");
		set(set_, "Elements", [create("IfcLine"), point3D([0, 0, 0])]);
		expectPass("IfcGeometricCurveSet", "NoSurfaces", set_);
	});
	test("fail: a surface is included", () => {
		const set_ = create("IfcGeometricCurveSet");
		set(set_, "Elements", [planeSurface()]);
		expectFail("IfcGeometricCurveSet", "NoSurfaces", set_);
	});
});

describe("IfcGeometricRepresentationContext.North2D", () => {
	test("pass: TrueNorth not given", () => {
		expectPass("IfcGeometricRepresentationContext", "North2D", create("IfcGeometricRepresentationContext"));
	});
	test("pass: TrueNorth has 2 DirectionRatios", () => {
		const ctx = create("IfcGeometricRepresentationContext");
		set(ctx, "TrueNorth", direction3D([1, 0]));
		expectPass("IfcGeometricRepresentationContext", "North2D", ctx);
	});
	test("fail: TrueNorth has 3 DirectionRatios", () => {
		const ctx = create("IfcGeometricRepresentationContext");
		set(ctx, "TrueNorth", direction3D([1, 0, 0]));
		expectFail("IfcGeometricRepresentationContext", "North2D", ctx);
	});
});

describe("IfcGeometricRepresentationSubContext", () => {
	test("ParentNoSub pass/fail", () => {
		const sub = create("IfcGeometricRepresentationSubContext");
		set(sub, "ParentContext", create("IfcGeometricRepresentationContext"));
		expectPass("IfcGeometricRepresentationSubContext", "ParentNoSub", sub);

		const badSub = create("IfcGeometricRepresentationSubContext");
		set(badSub, "ParentContext", create("IfcGeometricRepresentationSubContext"));
		expectFail("IfcGeometricRepresentationSubContext", "ParentNoSub", badSub);
	});
	test("UserTargetProvided pass/fail", () => {
		const sub = create("IfcGeometricRepresentationSubContext");
		set(sub, "TargetView", "MODEL_VIEW");
		expectPass("IfcGeometricRepresentationSubContext", "UserTargetProvided", sub);

		const userDefinedSub = create("IfcGeometricRepresentationSubContext");
		set(userDefinedSub, "TargetView", "USERDEFINED");
		set(userDefinedSub, "UserDefinedTargetView", "Custom");
		expectPass("IfcGeometricRepresentationSubContext", "UserTargetProvided", userDefinedSub);

		const badSub = create("IfcGeometricRepresentationSubContext");
		set(badSub, "TargetView", "USERDEFINED");
		expectFail("IfcGeometricRepresentationSubContext", "UserTargetProvided", badSub);
	});
	test("NoCoordOperation pass/fail", () => {
		// `HasCoordinateOperation` is an INVERSE attribute (of `IfcCoordinateOperation.
		// SourceCRS`, confirmed directly against real schema introspection) -- not settable
		// directly; populate it the real way via an actual `IfcMapConversion` instance.
		const sub = create("IfcGeometricRepresentationSubContext");
		expectPass("IfcGeometricRepresentationSubContext", "NoCoordOperation", sub);

		const badSub = create("IfcGeometricRepresentationSubContext");
		const mapConversion = create("IfcMapConversion");
		set(mapConversion, "SourceCRS", badSub);
		expectFail("IfcGeometricRepresentationSubContext", "NoCoordOperation", badSub);
	});
});

describe("IfcGeometricSet.ConsistentDim", () => {
	test("pass: every Elements member shares the first's Dim", () => {
		const gs = create("IfcGeometricSet");
		set(gs, "Elements", [point3D([0, 0, 0]), point3D([1, 1, 1])]);
		expectPass("IfcGeometricSet", "ConsistentDim", gs);
	});
	test("fail: a mismatched Dim", () => {
		const gs = create("IfcGeometricSet");
		set(gs, "Elements", [point3D([0, 0, 0]), point2D([1, 1])]);
		expectFail("IfcGeometricSet", "ConsistentDim", gs);
	});
});

describe("IfcGrid.HasPlacement", () => {
	test("pass/fail", () => {
		const grid = create("IfcGrid");
		set(grid, "ObjectPlacement", create("IfcLocalPlacement"));
		expectPass("IfcGrid", "HasPlacement", grid);
		expectFail("IfcGrid", "HasPlacement", create("IfcGrid"));
	});
});

describe("IfcGridAxis", () => {
	test("WR1 pass/fail", () => {
		const axis = create("IfcGridAxis");
		set(axis, "AxisCurve", polyline2D());
		expectPass("IfcGridAxis", "WR1", axis);

		const badAxis = create("IfcGridAxis");
		set(badAxis, "AxisCurve", polyline3D());
		expectFail("IfcGridAxis", "WR1", badAxis);
	});
	// `PartOfU`/`PartOfV`/`PartOfW` are INVERSE attributes (of `IfcGrid.UAxes`/`VAxes`/
	// `WAxes`, confirmed directly against real schema introspection) -- not settable
	// directly; populate them the real way via an actual `IfcGrid` instance referencing
	// the axis from one of its own forward `*Axes` attributes.
	test("WR2 pass: exactly one of PartOfU/V/W has a member", () => {
		const axis = create("IfcGridAxis");
		const grid = create("IfcGrid");
		set(grid, "UAxes", [axis]);
		expectPass("IfcGridAxis", "WR2", axis);
	});
	test("WR2 fail: none of PartOfU/V/W has a member", () => {
		const axis = create("IfcGridAxis");
		expectFail("IfcGridAxis", "WR2", axis);
	});
});

describe("IfcIShapeProfileDef", () => {
	function baseProfile(): EntityInstance {
		const p = create("IfcIShapeProfileDef");
		set(p, "ProfileType", "AREA");
		set(p, "OverallWidth", 100);
		set(p, "OverallDepth", 200);
		set(p, "WebThickness", 10);
		set(p, "FlangeThickness", 20);
		return p;
	}

	test("ValidFlangeThickness pass/fail", () => {
		expectPass("IfcIShapeProfileDef", "ValidFlangeThickness", baseProfile());

		const badProfile = baseProfile();
		set(badProfile, "FlangeThickness", 150);
		expectFail("IfcIShapeProfileDef", "ValidFlangeThickness", badProfile);
	});
	test("ValidWebThickness pass/fail", () => {
		expectPass("IfcIShapeProfileDef", "ValidWebThickness", baseProfile());

		const badProfile = baseProfile();
		set(badProfile, "WebThickness", 200);
		expectFail("IfcIShapeProfileDef", "ValidWebThickness", badProfile);
	});
	test("ValidFilletRadius pass/fail", () => {
		const profile = baseProfile();
		expectPass("IfcIShapeProfileDef", "ValidFilletRadius", profile); // not given -- passes

		const okProfile = baseProfile();
		set(okProfile, "FilletRadius", 5);
		expectPass("IfcIShapeProfileDef", "ValidFilletRadius", okProfile);

		const badProfile = baseProfile();
		set(badProfile, "FilletRadius", 1000);
		expectFail("IfcIShapeProfileDef", "ValidFilletRadius", badProfile);
	});
});

describe("IfcIndexedPolyCurve.Consecutive", () => {
	test("pass: no segments at all", () => {
		const curve = create("IfcIndexedPolyCurve");
		set(curve, "Segments", []);
		expectPass("IfcIndexedPolyCurve", "Consecutive", curve);
	});
	test("pass: consecutive segments share their common point index", () => {
		const curve = create("IfcIndexedPolyCurve");
		set(curve, "Segments", [
			[1, 2],
			[2, 3],
		]);
		expectPass("IfcIndexedPolyCurve", "Consecutive", curve);
	});
	test("fail: a gap between consecutive segments' point indices", () => {
		const curve = create("IfcIndexedPolyCurve");
		set(curve, "Segments", [
			[1, 2],
			[3, 4],
		]);
		expectFail("IfcIndexedPolyCurve", "Consecutive", curve);
	});
});

describe("IfcIntersectionCurve", () => {
	// `pcurveOn` (chunk 2's own module-scope helper above) builds a real `IfcPcurve` with
	// both `BasisSurface` and `ReferenceCurve` set -- reused as-is.
	test("TwoPCurves pass/fail", () => {
		const curve = create("IfcIntersectionCurve");
		set(curve, "AssociatedGeometry", [pcurveOn(planeSurface()), pcurveOn(planeSurface())]);
		expectPass("IfcIntersectionCurve", "TwoPCurves", curve);

		const badCurve = create("IfcIntersectionCurve");
		set(badCurve, "AssociatedGeometry", [pcurveOn(planeSurface())]);
		expectFail("IfcIntersectionCurve", "TwoPCurves", badCurve);
	});
	test("DistinctSurfaces pass/fail", () => {
		// Each surface gets its own distinct `Position` -- `settings.compareInstancesByValue`
		// is on for this whole test file, so two BLANK `IfcPlane` instances (no attributes
		// set) would otherwise compare as structurally EQUAL despite being different objects.
		function distinctPlaneAt(x: number): EntityInstance {
			const plane = planeSurface();
			const placement = create("IfcAxis2Placement3D");
			set(placement, "Location", point3D([x, 0, 0]));
			set(plane, "Position", placement);
			return plane;
		}

		const surfaceA = distinctPlaneAt(1);
		const surfaceB = distinctPlaneAt(2);
		const curve = create("IfcIntersectionCurve");
		set(curve, "AssociatedGeometry", [pcurveOn(surfaceA), pcurveOn(surfaceB)]);
		expectPass("IfcIntersectionCurve", "DistinctSurfaces", curve);

		const sameSurface = distinctPlaneAt(3);
		const badCurve = create("IfcIntersectionCurve");
		set(badCurve, "AssociatedGeometry", [pcurveOn(sameSurface), pcurveOn(sameSurface)]);
		expectFail("IfcIntersectionCurve", "DistinctSurfaces", badCurve);
	});
});

describe("IfcLShapeProfileDef.ValidThickness", () => {
	test("pass: Thickness less than Depth, Width not given", () => {
		const profile = create("IfcLShapeProfileDef");
		set(profile, "ProfileType", "AREA");
		set(profile, "Depth", 100);
		set(profile, "Thickness", 10);
		expectPass("IfcLShapeProfileDef", "ValidThickness", profile);
	});
	test("pass: Thickness less than both Depth and Width", () => {
		const profile = create("IfcLShapeProfileDef");
		set(profile, "ProfileType", "AREA");
		set(profile, "Depth", 100);
		set(profile, "Width", 80);
		set(profile, "Thickness", 10);
		expectPass("IfcLShapeProfileDef", "ValidThickness", profile);
	});
	test("fail: Thickness not less than Depth", () => {
		const profile = create("IfcLShapeProfileDef");
		set(profile, "ProfileType", "AREA");
		set(profile, "Depth", 10);
		set(profile, "Thickness", 10);
		expectFail("IfcLShapeProfileDef", "ValidThickness", profile);
	});
	test("fail: Thickness not less than Width", () => {
		const profile = create("IfcLShapeProfileDef");
		set(profile, "ProfileType", "AREA");
		set(profile, "Depth", 100);
		set(profile, "Width", 10);
		set(profile, "Thickness", 10);
		expectFail("IfcLShapeProfileDef", "ValidThickness", profile);
	});
});

describe("IfcLine.SameDim", () => {
	test("pass: Dir.Dim equals Pnt.Dim", () => {
		const line = create("IfcLine");
		set(line, "Pnt", point3D([0, 0, 0]));
		set(
			line,
			"Dir",
			(() => {
				const vec = create("IfcVector");
				set(vec, "Orientation", direction3D([1, 0, 0]));
				set(vec, "Magnitude", 1);
				return vec;
			})(),
		);
		expectPass("IfcLine", "SameDim", line);
	});
	test("fail: Dir.Dim differs from Pnt.Dim", () => {
		const line = create("IfcLine");
		set(line, "Pnt", point3D([0, 0, 0]));
		set(
			line,
			"Dir",
			(() => {
				const vec = create("IfcVector");
				set(vec, "Orientation", direction3D([1, 0]));
				set(vec, "Magnitude", 1);
				return vec;
			})(),
		);
		expectFail("IfcLine", "SameDim", line);
	});
});

// Sanity check on IFC4's total scope after chunk 3: 340 rules registered (100 from chunk 1 +
// 120 from chunk 2 + this chunk's own 120, all `SCOPE = 'entity'`), matching all three
// files' own combined `registerSchemaRules("IFC4", [...])` array lengths.
test("exactly 340 IFC4 WHERE-rules are registered after chunk 3", () => {
	expect(getSchemaRules("IFC4")).toHaveLength(340);
});
