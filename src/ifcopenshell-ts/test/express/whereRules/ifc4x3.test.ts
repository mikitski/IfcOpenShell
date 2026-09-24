// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4, IFC4X3_ADD2 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md):
// original, hand-rolled coverage exercising each of the 100 WHERE-rule classes ported
// in `src/express/whereRules/ifc4x3.ts` -- matching `ifc2x3.test.ts`'s/`ifc4.test.ts`'s
// own established convention for this file family exactly: every rule gets at least
// one passing case and (where a real, constructible failing case exists) one failing
// case, calling the rule's own `check()` function DIRECTLY (found via `findRule`, not
// `executeRules`), plus a small block of genuine end-to-end `executeRules(file)` tests
// wiring the real registered rules together.
//
// **92 of this chunk's 100 rules are byte-identical to `whereRules/ifc4.ts`'s own IFC4
// chunk 1 bodies** (see `ifc4x3.ts`'s own header comment for the full disclosure) --
// their test fixtures are correspondingly identical to `ifc4.test.ts`'s own (same pass/
// fail values), just re-targeted at the `IFC4X3_ADD2` schema/registry. The 8 genuinely
// new rules (`_LocationIsCP` x3, `IfcAxis2PlacementLinear` x2,
// `IfcBearing`/`IfcBearingType` x3) get fresh, original fixtures.
//
// **Gated with `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`** (the whole
// file, one top-level describe) matching `test/express/rules/ifc4x3.test.ts`'s own
// established precedent for this exact schema -- `bootstrap.ts`'s own disclosure that
// IFC4X3 is not guaranteed to be registered in every build this suite runs in.
//
// **Fixture-construction convention, identical to IFC2X3's/IFC4's own**: every entity
// is constructed via a zero-argument `file.createEntity("IfcXxx")` (leaving every
// attribute unset/null) followed by explicit Proxy-based dot-assignment for only the
// attribute(s) a given rule actually reads.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { EntityInstance } from "../../../src/entityInstance";
import { type RuleDefinition, getSchemaRules } from "../../../src/express/ruleDispatch";
import { executeRules } from "../../../src/express/ruleExecutor";
import "../../../src/express/whereRules/ifc4x3";
import type { IfcFile } from "../../../src/file";
import { settings } from "../../../src/settings";
import * as template from "../../../src/template";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("express/whereRules/ifc4x3 -- WHERE-rule classes", () => {
	function blankFile(): IfcFile {
		return template.create({ schemaIdentifier: "IFC4X3_ADD2", blank: true });
	}

	function findRule(typeName: string, ruleName: string): RuleDefinition {
		const rule = getSchemaRules("IFC4X3_ADD2").find((r) => r.typeName === typeName && r.ruleName === ruleName);
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

	// Same rationale as `ifc2x3.test.ts`'s/`ifc4.test.ts`'s own identical `beforeAll` --
	// several ported rules (e.g. every `_CorrectTypeAssigned` rule, which reads the
	// single-cardinality `IsTypedBy` inverse) only behave correctly with
	// `unpackNonAggregateInverses`/`compareInstancesByValue` on, matching what a real
	// `executeRules(file)` call would already be doing around every one of these rules.
	beforeAll(() => {
		file = createTestFile("IFC4X3");
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
	// SCOPE = 'type' rules (25) -- byte-identical bodies to `ifc4.ts`'s own, so the same
	// fixture values apply unchanged.
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
	// tables first, then every remaining rule individually (including the 5 genuinely
	// new non-Bearing rules: 3x `_LocationIsCP`, 2x `IfcAxis2PlacementLinear`).
	// =============================================================================

	interface CorrectPredefinedTypeCase {
		readonly typeName: string;
		readonly escapeAttr: string;
		readonly optional: boolean;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own 18 `correctPredefinedType(...)`
	// call sites (real source lines 5378-6165) -- identical entity set to `ifc4.test.ts`'s
	// own IFC4 chunk 1 table EXCEPT `IfcBuildingElementPart`/`IfcBuildingElementPartType`
	// (past this chunk's own ADD2 boundary) are replaced by `IfcBearing`/`IfcBearingType`
	// (genuinely new in ADD2).
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
		{ typeName: "IfcBearing", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcBearingType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcBoiler", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcBoilerType", escapeAttr: "ElementType", optional: false },
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

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own 9 `correctTypeAssigned(...)`
	// call sites in this chunk -- same entity set as `ifc4.test.ts`'s own table, minus
	// `IfcBuildingElementPart`, plus the genuinely new `IfcBearing`.
	const correctTypeAssignedCases: readonly CorrectTypeAssignedCase[] = [
		{ typeName: "IfcActuator", expectedTypeName: "IfcActuatorType" },
		{ typeName: "IfcAirTerminal", expectedTypeName: "IfcAirTerminalType" },
		{ typeName: "IfcAirTerminalBox", expectedTypeName: "IfcAirTerminalBoxType" },
		{ typeName: "IfcAirToAirHeatRecovery", expectedTypeName: "IfcAirToAirHeatRecoveryType" },
		{ typeName: "IfcAlarm", expectedTypeName: "IfcAlarmType" },
		{ typeName: "IfcAudioVisualAppliance", expectedTypeName: "IfcAudioVisualApplianceType" },
		{ typeName: "IfcBeam", expectedTypeName: "IfcBeamType" },
		{ typeName: "IfcBearing", expectedTypeName: "IfcBearingType" },
		{ typeName: "IfcBoiler", expectedTypeName: "IfcBoilerType" },
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
			// `IfcBuildingElementProxyType` is a real, always-available *Type entity not
			// equal to any `expectedTypeName` this chunk's own cases use.
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
		// Genuinely new in IFC4X3_ADD2 -- see `whereRules/ifc4x3.ts`'s own
		// `locationIsCartesianPoint` doc comment.
		test("LocationIsCP pass/fail", () => {
			const placement = create("IfcAxis1Placement");
			set(placement, "Location", point3D([0, 0, 0]));
			expectPass("IfcAxis1Placement", "LocationIsCP", placement);

			const badPlacement = create("IfcAxis1Placement");
			set(badPlacement, "Location", create("IfcPointByDistanceExpression"));
			expectFail("IfcAxis1Placement", "LocationIsCP", badPlacement);
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
		test("LocationIsCP pass/fail", () => {
			const placement = create("IfcAxis2Placement2D");
			set(placement, "Location", point2D([0, 0]));
			expectPass("IfcAxis2Placement2D", "LocationIsCP", placement);

			const badPlacement = create("IfcAxis2Placement2D");
			set(badPlacement, "Location", create("IfcPointByDistanceExpression"));
			expectFail("IfcAxis2Placement2D", "LocationIsCP", badPlacement);
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
		test("LocationIsCP pass/fail", () => {
			const placement = create("IfcAxis2Placement3D");
			set(placement, "Location", point3D([0, 0, 0]));
			expectPass("IfcAxis2Placement3D", "LocationIsCP", placement);

			const badPlacement = create("IfcAxis2Placement3D");
			set(badPlacement, "Location", create("IfcPointByDistanceExpression"));
			expectFail("IfcAxis2Placement3D", "LocationIsCP", badPlacement);
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

	// Wholly new entity in IFC4X3_ADD2.
	describe("IfcAxis2PlacementLinear", () => {
		test("WR1 pass/fail: Location must be an IfcPointByDistanceExpression", () => {
			const placement = create("IfcAxis2PlacementLinear");
			set(placement, "Location", create("IfcPointByDistanceExpression"));
			expectPass("IfcAxis2PlacementLinear", "WR1", placement);

			const badPlacement = create("IfcAxis2PlacementLinear");
			set(badPlacement, "Location", point3D([0, 0, 0]));
			expectFail("IfcAxis2PlacementLinear", "WR1", badPlacement);
		});
		test("WR2 pass/fail: Axis/RefDirection cross product must be non-degenerate", () => {
			const placement = create("IfcAxis2PlacementLinear");
			set(placement, "Location", create("IfcPointByDistanceExpression"));
			expectPass("IfcAxis2PlacementLinear", "WR2", placement); // neither Axis nor RefDirection given -- passes

			set(placement, "Axis", direction3D([0, 0, 1]));
			set(placement, "RefDirection", direction3D([1, 0, 0]));
			expectPass("IfcAxis2PlacementLinear", "WR2", placement); // perpendicular -- non-zero cross product

			const badPlacement = create("IfcAxis2PlacementLinear");
			set(badPlacement, "Location", create("IfcPointByDistanceExpression"));
			set(badPlacement, "Axis", direction3D([0, 0, 1]));
			set(badPlacement, "RefDirection", direction3D([0, 0, 1])); // parallel -- zero cross product
			expectFail("IfcAxis2PlacementLinear", "WR2", badPlacement);
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
	});

	// =============================================================================
	// Phase EX-4, IFC4X3_ADD2 chunk 2: original, hand-rolled coverage for the 120
	// WHERE-rule classes this chunk adds to `src/express/whereRules/ifc4x3.ts` (real source
	// lines 6176-7421, `IfcBooleanResult_SecondOperandClosed` through `IfcDerivedUnit_WR1`)
	// -- same conventions as chunk 1's own tests above: data-driven `describe.each` blocks
	// for the two dominant shapes (`correctPredefinedType`/`correctTypeAssigned`, 58/24
	// call sites respectively), individual `describe` blocks for every other rule.
	// `create`/`set`/`typeAssign`/`point2D`/`point3D`/`direction3D`/`polyline2D`/
	// `polyline3D`/`planeSurface` are all reused directly from chunk 1's own module-scope
	// helpers above (this file is one shared module, not per-chunk).
	//
	// 104 of this chunk's 120 rules are byte-identical to `whereRules/ifc4.ts`'s own IFC4
	// chunk 2 bodies (see `ifc4x3.ts`'s own header comment for the full disclosure) --
	// their test fixtures are correspondingly identical to `ifc4.test.ts`'s own (same
	// pass/fail values), just re-targeted at the `IFC4X3_ADD2` schema/registry. The 16
	// genuinely-no-IFC4-counterpart rules (14 ordinary `_CorrectPredefinedType`/
	// `_CorrectTypeAssigned` shapes on new-in-ADD2 entities, already covered by the two
	// data tables below; `IfcBuiltElement.MaxOneMaterialAssociation`, IFC4's own renamed
	// `IfcBuildingElement` rule; `IfcCoordinateReferenceSystem.NameOrWKT`, a genuinely
	// bespoke new shape) get fresh, original fixtures below.
	// =============================================================================

	interface CorrectPredefinedTypeCaseChunk2 {
		readonly typeName: string;
		readonly escapeAttr: string;
		readonly optional: boolean;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 2 `correctPredefinedType(...)`
	// call sites (real source lines 6176-7421) -- `optional` matches that file's own
	// `predefinedTypeOptional` argument at each site exactly (independently re-derived via a
	// small script scanning the real ADD2 rule bodies directly, not hand-transcribed).
	const correctPredefinedTypeCasesChunk2: readonly CorrectPredefinedTypeCaseChunk2[] = [
		{ typeName: "IfcBridge", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcBridgePart", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcBuildingElementPart", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcBuildingElementPartType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcBuildingElementProxy", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcBuildingElementProxyType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcBuildingSystem", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcBuiltSystem", escapeAttr: "ObjectType", optional: true },
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
		{ typeName: "IfcCaissonFoundation", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcCaissonFoundationType", escapeAttr: "ElementType", optional: false },
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
		{ typeName: "IfcConveyorSegment", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcConveyorSegmentType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcCooledBeam", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcCooledBeamType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcCoolingTower", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcCoolingTowerType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcCourse", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcCourseType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcCovering", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcCoveringType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcCrewResource", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcCrewResourceType", escapeAttr: "ResourceType", optional: false },
		{ typeName: "IfcCurtainWall", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcCurtainWallType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcDamper", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDamperType", escapeAttr: "ElementType", optional: false },
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
		readonly expectedTypeName: string;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 2 `correctTypeAssigned(...)`
	// call sites (real source lines 6176-7421).
	const correctTypeAssignedCasesChunk2: readonly CorrectTypeAssignedCaseChunk2[] = [
		{ typeName: "IfcBuildingElementPart", expectedTypeName: "IfcBuildingElementPartType" },
		{ typeName: "IfcBuildingElementProxy", expectedTypeName: "IfcBuildingElementProxyType" },
		{ typeName: "IfcBurner", expectedTypeName: "IfcBurnerType" },
		{ typeName: "IfcCableCarrierFitting", expectedTypeName: "IfcCableCarrierFittingType" },
		{ typeName: "IfcCableCarrierSegment", expectedTypeName: "IfcCableCarrierSegmentType" },
		{ typeName: "IfcCableFitting", expectedTypeName: "IfcCableFittingType" },
		{ typeName: "IfcCableSegment", expectedTypeName: "IfcCableSegmentType" },
		{ typeName: "IfcCaissonFoundation", expectedTypeName: "IfcCaissonFoundationType" },
		{ typeName: "IfcChiller", expectedTypeName: "IfcChillerType" },
		{ typeName: "IfcChimney", expectedTypeName: "IfcChimneyType" },
		{ typeName: "IfcCoil", expectedTypeName: "IfcCoilType" },
		{ typeName: "IfcColumn", expectedTypeName: "IfcColumnType" },
		{ typeName: "IfcCommunicationsAppliance", expectedTypeName: "IfcCommunicationsApplianceType" },
		{ typeName: "IfcCompressor", expectedTypeName: "IfcCompressorType" },
		{ typeName: "IfcCondenser", expectedTypeName: "IfcCondenserType" },
		{ typeName: "IfcController", expectedTypeName: "IfcControllerType" },
		{ typeName: "IfcConveyorSegment", expectedTypeName: "IfcConveyorSegmentType" },
		{ typeName: "IfcCooledBeam", expectedTypeName: "IfcCooledBeamType" },
		{ typeName: "IfcCoolingTower", expectedTypeName: "IfcCoolingTowerType" },
		{ typeName: "IfcCourse", expectedTypeName: "IfcCourseType" },
		{ typeName: "IfcCovering", expectedTypeName: "IfcCoveringType" },
		{ typeName: "IfcCurtainWall", expectedTypeName: "IfcCurtainWallType" },
		{ typeName: "IfcDamper", expectedTypeName: "IfcDamperType" },
		{ typeName: "IfcDeepFoundation", expectedTypeName: "IfcDeepFoundationType" },
	];

	describe.each(correctTypeAssignedCasesChunk2)(
		"$typeName.CorrectTypeAssigned (chunk 2)",
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
				// `IfcActuatorType` (chunk 1) is a real, always-available *Type entity not equal
				// to any `expectedTypeName` this chunk's own cases use.
				typeAssign(inst, create("IfcActuatorType"));
				expectFail(typeName, "CorrectTypeAssigned", inst);
			});
		},
	);
	describe("IfcBooleanResult.SecondOperandClosed", () => {
		test("pass: SecondOperand is not an IfcTessellatedFaceSet", () => {
			const result = create("IfcBooleanResult");
			set(result, "SecondOperand", create("IfcBlock")); // vacuously passes
			expectPass("IfcBooleanResult", "SecondOperandClosed", result);
		});
		test("pass: SecondOperand is a closed IfcTessellatedFaceSet", () => {
			const closedFaceSet = create("IfcPolygonalFaceSet");
			set(closedFaceSet, "Closed", true);
			const result = create("IfcBooleanResult");
			set(result, "SecondOperand", closedFaceSet);
			expectPass("IfcBooleanResult", "SecondOperandClosed", result);
		});
		test("fail: SecondOperand is an open IfcTessellatedFaceSet", () => {
			const openFaceSet = create("IfcPolygonalFaceSet");
			set(openFaceSet, "Closed", false);
			const result = create("IfcBooleanResult");
			set(result, "SecondOperand", openFaceSet);
			expectFail("IfcBooleanResult", "SecondOperandClosed", result);
		});
	});

	describe("IfcBoundaryCurve.IsClosed", () => {
		test("pass: ClosedCurve reads back INDETERMINATE for an empty Segments list (not treated as failure)", () => {
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

	// `IfcBuiltElement` is IFC4X3_ADD2's own rename of IFC4's `IfcBuildingElement` (see
	// `whereRules/ifc4x3.ts`'s own header comment) -- `IfcBuildingElementProxy` (also this
	// chunk) is a real, concrete, always-available `IfcBuiltElement` subtype fixture.
	describe("IfcBuiltElement.MaxOneMaterialAssociation", () => {
		function relAssociatesMaterial(relatedObject: EntityInstance): void {
			const rel = create("IfcRelAssociatesMaterial");
			set(rel, "RelatedObjects", [relatedObject]);
			set(rel, "RelatingMaterial", create("IfcMaterial"));
		}

		test("pass: zero or one material association", () => {
			expectPass("IfcBuiltElement", "MaxOneMaterialAssociation", create("IfcBuildingElementProxy"));

			const singleAssociated = create("IfcBuildingElementProxy");
			relAssociatesMaterial(singleAssociated);
			expectPass("IfcBuiltElement", "MaxOneMaterialAssociation", singleAssociated);
		});
		test("fail: two material associations", () => {
			const doubleAssociated = create("IfcBuildingElementProxy");
			relAssociatesMaterial(doubleAssociated);
			relAssociatesMaterial(doubleAssociated);
			expectFail("IfcBuiltElement", "MaxOneMaterialAssociation", doubleAssociated);
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
			// `Scl` is a DERIVE attribute (`nvl(Scale, 1.0)`) -- the forward `Scale` attribute
			// is set instead.
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
			// `Scl2` is a DERIVE attribute (`nvl(Scale2, Scl)`) -- the forward `Scale2`
			// attribute is set instead.
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
			const op = create("IfcCartesianTransformationOperator3DnonUniform");
			set(op, "Scale2", 1.0);
			expectPass("IfcCartesianTransformationOperator3DnonUniform", "Scale2GreaterZero", op);

			const badOp = create("IfcCartesianTransformationOperator3DnonUniform");
			set(badOp, "Scale2", 0.0);
			expectFail("IfcCartesianTransformationOperator3DnonUniform", "Scale2GreaterZero", badOp);
		});
		test("Scale3GreaterZero pass/fail", () => {
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
			// -> `IfcGetBasisSurface`, Phase EX-2). A single segment whose own `ParentCurve` is
			// an `IfcPcurve` is the one path that resolves without throwing (recurses into the
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

	// `IfcCoordinateReferenceSystem` itself already exists in IFC4 but carries no WHERE-rule
	// there -- see `whereRules/ifc4x3.ts`'s own header comment ("genuinely bespoke shape").
	// `WellKnownText` is a genuine INVERSE attribute on `IfcCoordinateReferenceSystem`
	// (`SET [0:1] OF IfcWellKnownText`, confirmed directly against the real compiled native
	// schema, `src/ifcparse/schemas/Ifc4x3_add2-schema.cpp`, not settable via a plain
	// `set(...)` the way a forward attribute is) -- built the same way this file's own
	// `typeAssign` helper builds `IsTypedBy` for `_CorrectTypeAssigned` tests: construct the
	// real referencing `IfcWellKnownText` instance whose own forward `CoordinateReferenceSystem`
	// attribute points back at the CRS under test.
	function wellKnownTextFor(crs: EntityInstance, text: string): void {
		const wkt = create("IfcWellKnownText");
		set(wkt, "WellKnownText", text);
		set(wkt, "CoordinateReferenceSystem", crs);
	}

	describe("IfcCoordinateReferenceSystem.NameOrWKT", () => {
		test("pass: WellKnownText has exactly one element", () => {
			const crs = create("IfcCoordinateReferenceSystem");
			wellKnownTextFor(crs, "PROJCS[...]");
			expectPass("IfcCoordinateReferenceSystem", "NameOrWKT", crs);
		});
		test("pass: Name is given (WellKnownText empty)", () => {
			const crs = create("IfcCoordinateReferenceSystem");
			set(crs, "Name", "EPSG:4326");
			expectPass("IfcCoordinateReferenceSystem", "NameOrWKT", crs);
		});
		test("fail: neither a 1-element WellKnownText nor a Name", () => {
			expectFail("IfcCoordinateReferenceSystem", "NameOrWKT", create("IfcCoordinateReferenceSystem"));
		});
	});

	describe("IfcCurveStyle", () => {
		function lengthMeasure(value: number): EntityInstance {
			return file.createEntity("IfcPositiveLengthMeasure", value as unknown as never);
		}
		function descriptiveMeasure(value: string): EntityInstance {
			return file.createEntity("IfcDescriptiveMeasure", value as unknown as never);
		}

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

	describe("IfcDerivedUnit.WR1", () => {
		function derivedUnitElement(exponent: number): EntityInstance {
			const el = create("IfcDerivedUnitElement");
			set(el, "Unit", create("IfcSIUnit"));
			set(el, "Exponent", exponent);
			return el;
		}

		test("pass/fail", () => {
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
	});

	// =============================================================================
	// Phase EX-4, IFC4X3_ADD2 chunk 3: original, hand-rolled coverage for the 120
	// WHERE-rule classes this chunk adds to `src/express/whereRules/ifc4x3.ts` (real source
	// lines 7431-8642, `IfcDerivedUnit_WR2` through `IfcGeometricRepresentationContext_
	// North2D`) -- same conventions as chunks 1/2's own tests above: data-driven
	// `describe.each` blocks for the two dominant shapes (`correctPredefinedType`/
	// `correctTypeAssigned`, 60/27 call sites respectively), individual `describe` blocks
	// for every other rule. `create`/`set`/`typeAssign`/`point2D`/`point3D`/`direction3D`/
	// `polyline2D`/`polyline3D`/`planeSurface` are all reused directly from chunk 1's own
	// module-scope helpers above (this file is one shared module, not per-chunk).
	//
	// 101 of this chunk's 120 rules are byte-identical to `whereRules/ifc4.ts`'s own IFC4
	// bodies (see `ifc4x3.ts`'s own header comment for the full disclosure) -- their test
	// fixtures are correspondingly identical to `ifc4.test.ts`'s own (same pass/fail
	// values), just re-targeted at the `IFC4X3_ADD2` schema/registry, with ONE deliberate
	// exception: `IfcDoorLiningProperties.WR35`/`IfcDoorPanelProperties.ApplicableToType`
	// drop `ifc4.test.ts`'s own `IfcDoorStyle` pass case entirely, since `IfcDoorStyle` was
	// genuinely removed from this schema (see `ifc4x3.ts`'s own header comment). The 19
	// non-byte-identical rules (2 real divergences, 16 genuinely-no-IFC4-counterpart rules,
	// 1 rename) get fresh, original fixtures below (14 of the 16 "new" ones are ordinary
	// `_CorrectPredefinedType`/`_CorrectTypeAssigned` shapes already covered by the two data
	// tables).
	// =============================================================================

	interface CorrectPredefinedTypeCaseChunk3 {
		readonly typeName: string;
		readonly escapeAttr: string;
		readonly optional: boolean;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 3 `correctPredefinedType(...)`
	// call sites (real source lines 7431-8642). `IfcFurnitureType`'s own `optional: true` is
	// this chunk's own disclosed schema-evolution finding (mandatory in IFC4, optional in ADD2).
	const correctPredefinedTypeCasesChunk3: readonly CorrectPredefinedTypeCaseChunk3[] = [
		{ typeName: "IfcDiscreteAccessory", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDiscreteAccessoryType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcDistributionBoard", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDistributionBoardType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcDistributionChamberElement", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDistributionChamberElementType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcDistributionSystem", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDoor", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDoorType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcDuctFitting", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDuctFittingType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcDuctSegment", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDuctSegmentType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcDuctSilencer", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcDuctSilencerType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcEarthworksCut", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcEarthworksFill", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcElectricAppliance", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcElectricApplianceType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcElectricDistributionBoard", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcElectricDistributionBoardType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcElectricFlowStorageDevice", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcElectricFlowStorageDeviceType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcElectricFlowTreatmentDevice", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcElectricFlowTreatmentDeviceType", escapeAttr: "ElementType", optional: false },
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
		{ typeName: "IfcFacilityPartCommon", escapeAttr: "ObjectType", optional: true },
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
		{ typeName: "IfcFurnitureType", escapeAttr: "ElementType", optional: true },
		{ typeName: "IfcGeographicElement", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcGeographicElementType", escapeAttr: "ElementType", optional: false },
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

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 3 `correctTypeAssigned(...)`
	// call sites (real source lines 7431-8642), including the renamed `IfcDoor` (IFC4's own
	// `IfcDoor_CorrectStyleAssigned`, see this chunk's own header comment).
	const correctTypeAssignedCasesChunk3: readonly CorrectTypeAssignedCaseChunk3[] = [
		{ typeName: "IfcDiscreteAccessory", expectedTypeName: "IfcDiscreteAccessoryType" },
		{ typeName: "IfcDistributionBoard", expectedTypeName: "IfcDistributionBoardType" },
		{ typeName: "IfcDistributionChamberElement", expectedTypeName: "IfcDistributionChamberElementType" },
		{ typeName: "IfcDoor", expectedTypeName: "IfcDoorType" },
		{ typeName: "IfcDuctFitting", expectedTypeName: "IfcDuctFittingType" },
		{ typeName: "IfcDuctSegment", expectedTypeName: "IfcDuctSegmentType" },
		{ typeName: "IfcDuctSilencer", expectedTypeName: "IfcDuctSilencerType" },
		{ typeName: "IfcElectricAppliance", expectedTypeName: "IfcElectricApplianceType" },
		{ typeName: "IfcElectricDistributionBoard", expectedTypeName: "IfcElectricDistributionBoardType" },
		{ typeName: "IfcElectricFlowStorageDevice", expectedTypeName: "IfcElectricFlowStorageDeviceType" },
		{ typeName: "IfcElectricFlowTreatmentDevice", expectedTypeName: "IfcElectricFlowTreatmentDeviceType" },
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
				// `IfcActuatorType` (chunk 1) is a real, always-available *Type entity not equal
				// to any `expectedTypeName` this chunk's own cases use.
				typeAssign(inst, create("IfcActuatorType"));
				expectFail(typeName, "CorrectTypeAssigned", inst);
			});
		},
	);

	describe("IfcDerivedUnit.WR2", () => {
		test("pass: UnitType is a non-USERDEFINED enum value", () => {
			const unit = create("IfcDerivedUnit");
			set(unit, "UnitType", "LINEARVELOCITYUNIT");
			expectPass("IfcDerivedUnit", "WR2", unit);
		});
		test("pass: UnitType is USERDEFINED and UserDefinedType is given", () => {
			const unit = create("IfcDerivedUnit");
			set(unit, "UnitType", "USERDEFINED");
			set(unit, "UserDefinedType", "a custom unit");
			expectPass("IfcDerivedUnit", "WR2", unit);
		});
		test("fail: UnitType is USERDEFINED but UserDefinedType is missing", () => {
			const unit = create("IfcDerivedUnit");
			set(unit, "UnitType", "USERDEFINED");
			expectFail("IfcDerivedUnit", "WR2", unit);
		});
	});

	describe("IfcDirection.MagnitudeGreaterZero", () => {
		test("pass/fail", () => {
			expectPass("IfcDirection", "MagnitudeGreaterZero", direction3D([0, 0, 1]));
			expectFail("IfcDirection", "MagnitudeGreaterZero", direction3D([0, 0, 0]));
		});
	});

	describe("IfcDirectrixCurveSweptAreaSolid.DirectrixBounded", () => {
		// `IfcDirectrixCurveSweptAreaSolid` is itself abstract -- `IfcFixedReferenceSweptAreaSolid`
		// is a real, concrete subtype fixture (the rule's own `check()` only reads attributes off
		// `self`, so a concrete subtype instance works identically to the abstract TYPE_NAME).
		test("pass: StartParam and EndParam both given", () => {
			const solid = create("IfcFixedReferenceSweptAreaSolid");
			set(solid, "Directrix", create("IfcLine"));
			set(solid, "StartParam", 0);
			set(solid, "EndParam", 1);
			expectPass("IfcDirectrixCurveSweptAreaSolid", "DirectrixBounded", solid);
		});
		test("pass: Directrix is an IfcBoundedCurve, even without StartParam/EndParam", () => {
			const solid = create("IfcFixedReferenceSweptAreaSolid");
			set(solid, "Directrix", polyline3D());
			expectPass("IfcDirectrixCurveSweptAreaSolid", "DirectrixBounded", solid);
		});
		test("fail: neither StartParam/EndParam nor a bounded Directrix", () => {
			const solid = create("IfcFixedReferenceSweptAreaSolid");
			set(solid, "Directrix", create("IfcLine"));
			expectFail("IfcDirectrixCurveSweptAreaSolid", "DirectrixBounded", solid);
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

	// `IfcDoorType` is the ONLY value `definesTypeIsDoorType` accepts in this schema --
	// `whereRules/ifc4.ts`'s own equivalent tests also cover an `IfcDoorStyle` pass case,
	// but `IfcDoorStyle` was genuinely removed from IFC4X3_ADD2 (see `ifc4x3.ts`'s own
	// header comment's vanished-entity finding), so that case is intentionally absent here.
	function definesTypeVia(propsOrPanel: EntityInstance, typeObject: EntityInstance): void {
		set(typeObject, "HasPropertySets", [propsOrPanel]);
	}

	describe("IfcDoorLiningProperties.WR35 / IfcDoorPanelProperties.ApplicableToType", () => {
		test("IfcDoorLiningProperties.WR35 pass: DefinesType[1] is an IfcDoorType", () => {
			const lining = create("IfcDoorLiningProperties");
			definesTypeVia(lining, create("IfcDoorType"));
			expectPass("IfcDoorLiningProperties", "WR35", lining);
		});
		test("IfcDoorLiningProperties.WR35 fail: DefinesType[1] is not an IfcDoorType", () => {
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
		// DERIVE attributes that swap `EdgeElement.EdgeStart`/`EdgeEnd` when `Orientation` is
		// `false` -- leaving it unset would silently reverse every edge's own endpoints.
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
		test("pass: no bounds at all", () => {
			const face = create("IfcFace");
			set(face, "Bounds", []);
			expectPass("IfcFace", "HasOuterBound", face);
		});
		test("pass: exactly one IfcFaceOuterBound", () => {
			const face = create("IfcFace");
			set(face, "Bounds", [create("IfcFaceOuterBound"), create("IfcFaceBound")]);
			expectPass("IfcFace", "HasOuterBound", face);
		});
		test("fail: two IfcFaceOuterBound members", () => {
			const face = create("IfcFace");
			set(face, "Bounds", [create("IfcFaceOuterBound"), create("IfcFaceOuterBound")]);
			expectFail("IfcFace", "HasOuterBound", face);
		});
	});

	describe("IfcFeatureElement.NotContained", () => {
		// `IfcFeatureElement` and its own subtype `IfcFeatureElementSubtraction` are both
		// abstract -- `IfcOpeningElement` (already used as this file's own concrete
		// `IfcFeatureElementSubtraction` fixture above) is a real, concrete subtype of both.
		test("pass: not contained in any structure", () => {
			expectPass("IfcFeatureElement", "NotContained", create("IfcOpeningElement"));
		});
		test("fail: contained in a structure", () => {
			const feature = create("IfcOpeningElement");
			const rel = create("IfcRelContainedInSpatialStructure");
			set(rel, "RelatedElements", [feature]);
			expectFail("IfcFeatureElement", "NotContained", feature);
		});
	});

	describe("IfcFeatureElementSubtraction", () => {
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
		test("MaxOneColour: always passes (IfcColour is a SELECT type -- see this file's own header comment / whereRules/ifc4x3.ts's ifcCorrectFillAreaStyle doc comment)", () => {
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

	describe("IfcGeographicCRS", () => {
		test("AngleUnitIsPlaneAngle pass/fail", () => {
			const crs = create("IfcGeographicCRS");
			expectPass("IfcGeographicCRS", "AngleUnitIsPlaneAngle", crs); // not given -- passes

			const okCrs = create("IfcGeographicCRS");
			const angleUnit = create("IfcSIUnit");
			set(angleUnit, "UnitType", "PLANEANGLEUNIT");
			set(okCrs, "AngleUnit", angleUnit);
			expectPass("IfcGeographicCRS", "AngleUnitIsPlaneAngle", okCrs);

			const badCrs = create("IfcGeographicCRS");
			const wrongUnit = create("IfcSIUnit");
			set(wrongUnit, "UnitType", "LENGTHUNIT");
			set(badCrs, "AngleUnit", wrongUnit);
			expectFail("IfcGeographicCRS", "AngleUnitIsPlaneAngle", badCrs);
		});
		test("HeightUnitIsLength pass/fail", () => {
			const crs = create("IfcGeographicCRS");
			expectPass("IfcGeographicCRS", "HeightUnitIsLength", crs); // not given -- passes

			const okCrs = create("IfcGeographicCRS");
			const heightUnit = create("IfcSIUnit");
			set(heightUnit, "UnitType", "LENGTHUNIT");
			set(okCrs, "HeightUnit", heightUnit);
			expectPass("IfcGeographicCRS", "HeightUnitIsLength", okCrs);

			const badCrs = create("IfcGeographicCRS");
			const wrongUnit = create("IfcSIUnit");
			set(wrongUnit, "UnitType", "PLANEANGLEUNIT");
			set(badCrs, "HeightUnit", wrongUnit);
			expectFail("IfcGeographicCRS", "HeightUnitIsLength", badCrs);
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

	// =============================================================================
	// Phase EX-4, IFC4X3_ADD2 chunk 4: original, hand-rolled coverage for the 120 rules
	// ported in `whereRules/ifc4x3.ts`'s own 4th `registerSchemaRules("IFC4X3_ADD2", [...])`
	// call (`IfcGeometricRepresentationSubContext_NoCoordOperation` through
	// `IfcPositioningElement_HasPlacement`). Same data-driven `describe.each` pattern
	// established by chunks 2/3 for the 72 ordinary `_CorrectPredefinedType`/
	// `_CorrectTypeAssigned` rules, plus individual `describe` blocks for the 48 bespoke
	// rules, in real ADD2 file order.
	// =============================================================================

	interface CorrectPredefinedTypeCaseChunk4 {
		readonly typeName: string;
		readonly escapeAttr: string;
		readonly optional: boolean;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 4 `correctPredefinedType(...)`
	// call sites (real source lines 8643-9897). `IfcLaborResourceType`'s own `escapeAttr:
	// "ResourceType"` (not the usual `"ElementType"`) matches `correctPredefinedType`'s
	// already-existing `escapeAttrName` parameter -- no new shape.
	const correctPredefinedTypeCasesChunk4: readonly CorrectPredefinedTypeCaseChunk4[] = [
		{ typeName: "IfcGeotechnicalStratum", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcHeatExchanger", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcHeatExchangerType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcHumidifier", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcHumidifierType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcImpactProtectionDevice", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcImpactProtectionDeviceType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcInterceptor", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcInterceptorType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcJunctionBox", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcJunctionBoxType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcKerb", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcKerbType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcLaborResource", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcLaborResourceType", escapeAttr: "ResourceType", optional: false },
		{ typeName: "IfcLamp", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcLampType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcLightFixture", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcLightFixtureType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcLiquidTerminal", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcLiquidTerminalType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcMarineFacility", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMarinePart", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMechanicalFastener", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMechanicalFastenerType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcMedicalDevice", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMedicalDeviceType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcMember", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMemberType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcMobileTelecommunicationsAppliance", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMobileTelecommunicationsApplianceType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcMooringDevice", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMooringDeviceType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcMotorConnection", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcMotorConnectionType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcNavigationElement", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcNavigationElementType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcOpeningElement", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcOutlet", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcOutletType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcPavement", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcPavementType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcPile", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcPileType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcPipeFitting", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcPipeFittingType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcPipeSegment", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcPipeSegmentType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcPlate", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcPlateType", escapeAttr: "ElementType", optional: false },
	];

	describe.each(correctPredefinedTypeCasesChunk4)(
		"$typeName.CorrectPredefinedType (chunk 4)",
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

	interface CorrectTypeAssignedCaseChunk4 {
		readonly typeName: string;
		readonly expectedTypeName: string;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 4 `correctTypeAssigned(...)`
	// call sites (real source lines 8643-9897).
	const correctTypeAssignedCasesChunk4: readonly CorrectTypeAssignedCaseChunk4[] = [
		{ typeName: "IfcHeatExchanger", expectedTypeName: "IfcHeatExchangerType" },
		{ typeName: "IfcHumidifier", expectedTypeName: "IfcHumidifierType" },
		{ typeName: "IfcImpactProtectionDevice", expectedTypeName: "IfcImpactProtectionDeviceType" },
		{ typeName: "IfcInterceptor", expectedTypeName: "IfcInterceptorType" },
		{ typeName: "IfcJunctionBox", expectedTypeName: "IfcJunctionBoxType" },
		{ typeName: "IfcKerb", expectedTypeName: "IfcKerbType" },
		{ typeName: "IfcLamp", expectedTypeName: "IfcLampType" },
		{ typeName: "IfcLightFixture", expectedTypeName: "IfcLightFixtureType" },
		{ typeName: "IfcLiquidTerminal", expectedTypeName: "IfcLiquidTerminalType" },
		{ typeName: "IfcMechanicalFastener", expectedTypeName: "IfcMechanicalFastenerType" },
		{ typeName: "IfcMedicalDevice", expectedTypeName: "IfcMedicalDeviceType" },
		{ typeName: "IfcMember", expectedTypeName: "IfcMemberType" },
		{ typeName: "IfcMobileTelecommunicationsAppliance", expectedTypeName: "IfcMobileTelecommunicationsApplianceType" },
		{ typeName: "IfcMooringDevice", expectedTypeName: "IfcMooringDeviceType" },
		{ typeName: "IfcMotorConnection", expectedTypeName: "IfcMotorConnectionType" },
		{ typeName: "IfcNavigationElement", expectedTypeName: "IfcNavigationElementType" },
		{ typeName: "IfcOutlet", expectedTypeName: "IfcOutletType" },
		{ typeName: "IfcPavement", expectedTypeName: "IfcPavementType" },
		{ typeName: "IfcPile", expectedTypeName: "IfcPileType" },
		{ typeName: "IfcPipeFitting", expectedTypeName: "IfcPipeFittingType" },
		{ typeName: "IfcPipeSegment", expectedTypeName: "IfcPipeSegmentType" },
		{ typeName: "IfcPlate", expectedTypeName: "IfcPlateType" },
	];

	describe.each(correctTypeAssignedCasesChunk4)(
		"$typeName.CorrectTypeAssigned (chunk 4)",
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
				// `IfcActuatorType` (chunk 1) is a real, always-available *Type entity not equal
				// to any `expectedTypeName` this chunk's own cases use.
				typeAssign(inst, create("IfcActuatorType"));
				expectFail(typeName, "CorrectTypeAssigned", inst);
			});
		},
	);

	describe("IfcGeometricRepresentationSubContext (chunk 4 additions)", () => {
		test("NoCoordOperation pass/fail", () => {
			// `HasCoordinateOperation` is an INVERSE attribute (of `IfcMapConversion.SourceCRS`)
			// -- not settable directly; populate it the real way via an actual `IfcMapConversion`.
			const sub = create("IfcGeometricRepresentationSubContext");
			expectPass("IfcGeometricRepresentationSubContext", "NoCoordOperation", sub);

			const badSub = create("IfcGeometricRepresentationSubContext");
			const mapConversion = create("IfcMapConversion");
			set(mapConversion, "SourceCRS", badSub);
			expectFail("IfcGeometricRepresentationSubContext", "NoCoordOperation", badSub);
		});
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
	});

	describe("IfcGeometricSet.ConsistentDim", () => {
		test("pass: every Elements member shares the first's Dim", () => {
			const gs = create("IfcGeometricSet");
			set(gs, "Elements", [point3D([0, 0, 0]), point3D([1, 1, 1])]);
			expectPass("IfcGeometricSet", "ConsistentDim", gs);
		});
		test("fail: an Elements member has a different Dim", () => {
			const gs = create("IfcGeometricSet");
			set(gs, "Elements", [point3D([0, 0, 0]), point2D([1, 1])]);
			expectFail("IfcGeometricSet", "ConsistentDim", gs);
		});
	});

	describe("IfcGridAxis (chunk 4)", () => {
		test("WR1 pass/fail", () => {
			const axis = create("IfcGridAxis");
			set(axis, "AxisCurve", polyline2D());
			expectPass("IfcGridAxis", "WR1", axis);

			const badAxis = create("IfcGridAxis");
			set(badAxis, "AxisCurve", polyline3D());
			expectFail("IfcGridAxis", "WR1", badAxis);
		});
		// `PartOfU`/`PartOfV`/`PartOfW` are INVERSE attributes (of `IfcGrid.UAxes`/`VAxes`/
		// `WAxes`) -- not settable directly; populate them via an actual `IfcGrid` instance.
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

	describe("IfcIShapeProfileDef (chunk 4)", () => {
		function baseProfile(): EntityInstance {
			const p = create("IfcIShapeProfileDef");
			set(p, "ProfileType", "AREA");
			set(p, "OverallWidth", 100);
			set(p, "OverallDepth", 200);
			set(p, "WebThickness", 10);
			set(p, "FlangeThickness", 20);
			return p;
		}

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
	});

	describe("IfcIndexedPolyCurve.Consecutive (chunk 4 -- ADD2's own `not exists` guard, see whereRules/ifc4x3.ts's own header comment)", () => {
		test("pass: Segments not set at all (the ADD2-specific short-circuit)", () => {
			const curve = create("IfcIndexedPolyCurve");
			expectPass("IfcIndexedPolyCurve", "Consecutive", curve);
		});
		test("pass: an empty Segments list", () => {
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

	describe("IfcIntersectionCurve (chunk 4)", () => {
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
		test("TwoPCurves pass/fail", () => {
			const curve = create("IfcIntersectionCurve");
			set(curve, "AssociatedGeometry", [pcurveOn(planeSurface()), pcurveOn(planeSurface())]);
			expectPass("IfcIntersectionCurve", "TwoPCurves", curve);

			const badCurve = create("IfcIntersectionCurve");
			set(badCurve, "AssociatedGeometry", [pcurveOn(planeSurface())]);
			expectFail("IfcIntersectionCurve", "TwoPCurves", badCurve);
		});
	});

	describe("IfcLShapeProfileDef.ValidThickness (chunk 4)", () => {
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
			set(line, "Dir", direction3D([1, 0, 0]));
			expectPass("IfcLine", "SameDim", line);
		});
		test("fail: Dir.Dim differs from Pnt.Dim", () => {
			const line = create("IfcLine");
			set(line, "Pnt", point3D([0, 0, 0]));
			set(line, "Dir", direction3D([1, 0]));
			expectFail("IfcLine", "SameDim", line);
		});
	});

	describe("IfcLocalPlacement.WR21 (chunk 4)", () => {
		test("pass: no PlacementRelTo at all", () => {
			const placement = create("IfcLocalPlacement");
			set(placement, "RelativePlacement", create("IfcAxis2Placement3D"));
			expectPass("IfcLocalPlacement", "WR21", placement);
		});
		test("pass: PlacementRelTo is an IfcGridPlacement (always passes)", () => {
			const placement = create("IfcLocalPlacement");
			set(placement, "RelativePlacement", create("IfcAxis2Placement3D"));
			set(placement, "PlacementRelTo", create("IfcGridPlacement"));
			expectPass("IfcLocalPlacement", "WR21", placement);
		});
		test("pass: PlacementRelTo is an IfcLocalPlacement with a 2D RelativePlacement", () => {
			const relTo = create("IfcLocalPlacement");
			set(relTo, "RelativePlacement", create("IfcAxis2Placement2D"));
			const placement = create("IfcLocalPlacement");
			set(placement, "RelativePlacement", create("IfcAxis2Placement2D"));
			set(placement, "PlacementRelTo", relTo);
			expectPass("IfcLocalPlacement", "WR21", placement);
		});
		test("pass: PlacementRelTo is an IfcLocalPlacement whose own RelativePlacement.Dim is 3, and this placement's own RelativePlacement is 3D", () => {
			const relTo = create("IfcLocalPlacement");
			const relToPlacement = create("IfcAxis2Placement3D");
			set(relToPlacement, "Location", point3D([0, 0, 0]));
			set(relTo, "RelativePlacement", relToPlacement);
			const placement = create("IfcLocalPlacement");
			set(placement, "RelativePlacement", create("IfcAxis2Placement3D"));
			set(placement, "PlacementRelTo", relTo);
			expectPass("IfcLocalPlacement", "WR21", placement);
		});
		test("fail: PlacementRelTo is an IfcLocalPlacement whose own RelativePlacement.Dim is 2, but this placement's own RelativePlacement is 3D", () => {
			const relTo = create("IfcLocalPlacement");
			const relToPlacement = create("IfcAxis2Placement2D");
			set(relToPlacement, "Location", point2D([0, 0]));
			set(relTo, "RelativePlacement", relToPlacement);
			const placement = create("IfcLocalPlacement");
			set(placement, "RelativePlacement", create("IfcAxis2Placement3D"));
			set(placement, "PlacementRelTo", relTo);
			expectFail("IfcLocalPlacement", "WR21", placement);
		});
	});

	describe("IfcMapConversion.TargetCRSOnlyProjected (chunk 4 -- a genuinely new rule on a pre-existing IFC4 entity)", () => {
		test("pass: TargetCRS is an IfcProjectedCRS", () => {
			const mapConversion = create("IfcMapConversion");
			set(mapConversion, "TargetCRS", create("IfcProjectedCRS"));
			expectPass("IfcMapConversion", "TargetCRSOnlyProjected", mapConversion);
		});
		test("fail: TargetCRS is a plain IfcCoordinateReferenceSystem, not an IfcProjectedCRS", () => {
			const mapConversion = create("IfcMapConversion");
			set(mapConversion, "TargetCRS", create("IfcCoordinateReferenceSystem"));
			expectFail("IfcMapConversion", "TargetCRSOnlyProjected", mapConversion);
		});
	});

	describe("IfcMaterialDefinitionRepresentation.OnlyStyledRepresentations (chunk 4)", () => {
		test("pass: every Representations member is an IfcStyledRepresentation", () => {
			const rep = create("IfcMaterialDefinitionRepresentation");
			set(rep, "Representations", [create("IfcStyledRepresentation")]);
			expectPass("IfcMaterialDefinitionRepresentation", "OnlyStyledRepresentations", rep);
		});
		test("fail: a Representations member is a plain IfcShapeRepresentation", () => {
			const rep = create("IfcMaterialDefinitionRepresentation");
			set(rep, "Representations", [create("IfcShapeRepresentation")]);
			expectFail("IfcMaterialDefinitionRepresentation", "OnlyStyledRepresentations", rep);
		});
	});

	describe("IfcMaterialLayer.NormalizedPriority (chunk 4)", () => {
		test("pass: Priority not given", () => {
			expectPass("IfcMaterialLayer", "NormalizedPriority", create("IfcMaterialLayer"));
		});
		test("pass: Priority in [0, 100]", () => {
			const layer = create("IfcMaterialLayer");
			set(layer, "Priority", 50);
			expectPass("IfcMaterialLayer", "NormalizedPriority", layer);
		});
		test("fail: Priority out of range", () => {
			const layer = create("IfcMaterialLayer");
			set(layer, "Priority", 150);
			expectFail("IfcMaterialLayer", "NormalizedPriority", layer);
		});
	});

	describe("IfcMaterialProfile.NormalizedPriority (chunk 4)", () => {
		test("pass: Priority not given", () => {
			expectPass("IfcMaterialProfile", "NormalizedPriority", create("IfcMaterialProfile"));
		});
		test("fail: Priority out of range", () => {
			const profile = create("IfcMaterialProfile");
			set(profile, "Priority", -1);
			expectFail("IfcMaterialProfile", "NormalizedPriority", profile);
		});
	});

	describe("IfcNamedUnit.WR1 (chunk 4)", () => {
		// `IfcConversionBasedUnit`, not `IfcSIUnit`, deliberately -- `IfcSIUnit.Dimensions`
		// is itself a DERIVE-overridden attribute, so directly `set()`-ing it is silently
		// ignored. `IfcConversionBasedUnit` inherits `Dimensions` as a genuine, directly-
		// stored `IfcNamedUnit` attribute with no such override.
		function dimensions(length: number, mass: number): EntityInstance {
			const dims = create("IfcDimensionalExponents");
			set(dims, "LengthExponent", length);
			set(dims, "MassExponent", mass);
			set(dims, "TimeExponent", 0);
			set(dims, "ElectricCurrentExponent", 0);
			set(dims, "ThermodynamicTemperatureExponent", 0);
			set(dims, "AmountOfSubstanceExponent", 0);
			set(dims, "LuminousIntensityExponent", 0);
			return dims;
		}
		test("pass: UnitType/Dimensions are dimensionally consistent (LENGTHUNIT)", () => {
			const unit = create("IfcConversionBasedUnit");
			set(unit, "UnitType", "LENGTHUNIT");
			set(unit, "Dimensions", dimensions(1, 0));
			expectPass("IfcNamedUnit", "WR1", unit);
		});
		test("fail: UnitType/Dimensions are NOT dimensionally consistent", () => {
			const unit = create("IfcConversionBasedUnit");
			set(unit, "UnitType", "LENGTHUNIT");
			set(unit, "Dimensions", dimensions(0, 1));
			expectFail("IfcNamedUnit", "WR1", unit);
		});
	});

	// `IsDefinedBy` is an INVERSE attribute (computed from every `IfcRelDefinesByProperties`
	// whose own `RelatedObjects` includes this object) -- like `typeAssign` above, it can
	// never be `set()` directly; the real forward relationship is built instead.
	function propertySetRel(target: EntityInstance, propertySet: EntityInstance): EntityInstance {
		const rel = create("IfcRelDefinesByProperties");
		set(rel, "RelatedObjects", [target]);
		set(rel, "RelatingPropertyDefinition", propertySet);
		return rel;
	}

	describe("IfcObject.UniquePropertySetNames (chunk 4)", () => {
		test("pass: no IsDefinedBy at all", () => {
			expectPass("IfcObject", "UniquePropertySetNames", create("IfcWall"));
		});
		test("pass: every attached IfcPropertySet has a distinct Name", () => {
			const wall = create("IfcWall");
			const ps1 = create("IfcPropertySet");
			set(ps1, "Name", "Pset_A");
			propertySetRel(wall, ps1);
			const ps2 = create("IfcPropertySet");
			set(ps2, "Name", "Pset_B");
			propertySetRel(wall, ps2);
			expectPass("IfcObject", "UniquePropertySetNames", wall);
		});
		test("fail: two attached IfcPropertySets share the same Name", () => {
			const wall = create("IfcWall");
			const ps1 = create("IfcPropertySet");
			set(ps1, "Name", "Pset_A");
			propertySetRel(wall, ps1);
			const ps2 = create("IfcPropertySet");
			set(ps2, "Name", "Pset_A");
			propertySetRel(wall, ps2);
			expectFail("IfcObject", "UniquePropertySetNames", wall);
		});
	});

	describe("IfcObjective.WR21 (chunk 4)", () => {
		test("pass: ObjectiveQualifier is not USERDEFINED", () => {
			const objective = create("IfcObjective");
			set(objective, "ObjectiveQualifier", "REQUIREMENT");
			expectPass("IfcObjective", "WR21", objective);
		});
		test("pass: ObjectiveQualifier is USERDEFINED and UserDefinedQualifier is given", () => {
			const objective = create("IfcObjective");
			set(objective, "ObjectiveQualifier", "USERDEFINED");
			set(objective, "UserDefinedQualifier", "Something");
			expectPass("IfcObjective", "WR21", objective);
		});
		test("fail: ObjectiveQualifier is USERDEFINED but UserDefinedQualifier is missing", () => {
			const objective = create("IfcObjective");
			set(objective, "ObjectiveQualifier", "USERDEFINED");
			expectFail("IfcObjective", "WR21", objective);
		});
	});

	describe("IfcOccupant.WR31 (chunk 4)", () => {
		test("pass: PredefinedType is not USERDEFINED", () => {
			const occupant = create("IfcOccupant");
			set(occupant, "PredefinedType", "ASSIGNEE");
			expectPass("IfcOccupant", "WR31", occupant);
		});
		test("pass: PredefinedType is USERDEFINED and ObjectType is given", () => {
			const occupant = create("IfcOccupant");
			set(occupant, "PredefinedType", "USERDEFINED");
			set(occupant, "ObjectType", "Something");
			expectPass("IfcOccupant", "WR31", occupant);
		});
		test("fail: PredefinedType is USERDEFINED but ObjectType is missing", () => {
			const occupant = create("IfcOccupant");
			set(occupant, "PredefinedType", "USERDEFINED");
			expectFail("IfcOccupant", "WR31", occupant);
		});
	});

	describe("IfcOffsetCurve2D.DimIs2D (chunk 4)", () => {
		test("pass/fail: BasisCurve.Dim must equal 2", () => {
			const curve2D = create("IfcOffsetCurve2D");
			set(curve2D, "BasisCurve", polyline2D());
			expectPass("IfcOffsetCurve2D", "DimIs2D", curve2D);

			const curve3D = create("IfcOffsetCurve2D");
			set(curve3D, "BasisCurve", polyline3D());
			expectFail("IfcOffsetCurve2D", "DimIs2D", curve3D);
		});
	});

	describe("IfcOffsetCurve3D.DimIs2D (chunk 4 -- real body checks Dim == 3, a naming quirk reconfirmed from IFC4's own disclosure)", () => {
		test("pass/fail: BasisCurve.Dim must equal 3", () => {
			const curve3D = create("IfcOffsetCurve3D");
			set(curve3D, "BasisCurve", polyline3D());
			expectPass("IfcOffsetCurve3D", "DimIs2D", curve3D);

			const curve2D = create("IfcOffsetCurve3D");
			set(curve2D, "BasisCurve", polyline2D());
			expectFail("IfcOffsetCurve3D", "DimIs2D", curve2D);
		});
	});

	describe("IfcOpenCrossProfileDef (chunk 4, genuinely new in ADD2)", () => {
		test("CorrectProfileType pass/fail", () => {
			const profile = create("IfcOpenCrossProfileDef");
			set(profile, "ProfileType", "CURVE");
			expectPass("IfcOpenCrossProfileDef", "CorrectProfileType", profile);

			const badProfile = create("IfcOpenCrossProfileDef");
			set(badProfile, "ProfileType", "AREA");
			expectFail("IfcOpenCrossProfileDef", "CorrectProfileType", badProfile);
		});
		test("CorrespondingSlopeWidths pass/fail", () => {
			const profile = create("IfcOpenCrossProfileDef");
			set(profile, "Slopes", [0.1, 0.2]);
			set(profile, "Widths", [1, 2]);
			expectPass("IfcOpenCrossProfileDef", "CorrespondingSlopeWidths", profile);

			const badProfile = create("IfcOpenCrossProfileDef");
			set(badProfile, "Slopes", [0.1, 0.2]);
			set(badProfile, "Widths", [1]);
			expectFail("IfcOpenCrossProfileDef", "CorrespondingSlopeWidths", badProfile);
		});
		test("CorrespondingTags pass/fail", () => {
			const profile = create("IfcOpenCrossProfileDef");
			set(profile, "Slopes", [0.1, 0.2]);
			expectPass("IfcOpenCrossProfileDef", "CorrespondingTags", profile); // Tags not given

			const okProfile = create("IfcOpenCrossProfileDef");
			set(okProfile, "Slopes", [0.1, 0.2]);
			set(okProfile, "Tags", ["a", "b", "c"]);
			expectPass("IfcOpenCrossProfileDef", "CorrespondingTags", okProfile);

			const badProfile = create("IfcOpenCrossProfileDef");
			set(badProfile, "Slopes", [0.1, 0.2]);
			set(badProfile, "Tags", ["a", "b"]);
			expectFail("IfcOpenCrossProfileDef", "CorrespondingTags", badProfile);
		});
	});

	describe("IfcOrientedEdge.EdgeElementNotOriented (chunk 4)", () => {
		test("pass: EdgeElement is a plain IfcEdge", () => {
			const oe = create("IfcOrientedEdge");
			set(oe, "EdgeElement", create("IfcEdge"));
			expectPass("IfcOrientedEdge", "EdgeElementNotOriented", oe);
		});
		test("fail: EdgeElement is itself an IfcOrientedEdge", () => {
			const oe = create("IfcOrientedEdge");
			set(oe, "EdgeElement", create("IfcOrientedEdge"));
			expectFail("IfcOrientedEdge", "EdgeElementNotOriented", oe);
		});
	});

	describe("IfcOwnerHistory.CorrectChangeAction (chunk 4)", () => {
		test("pass: LastModifiedDate is given", () => {
			const oh = create("IfcOwnerHistory");
			set(oh, "LastModifiedDate", 12345);
			expectPass("IfcOwnerHistory", "CorrectChangeAction", oh);
		});
		test("pass: LastModifiedDate absent, ChangeAction absent", () => {
			expectPass("IfcOwnerHistory", "CorrectChangeAction", create("IfcOwnerHistory"));
		});
		test("pass: LastModifiedDate absent, ChangeAction is NOCHANGE", () => {
			const oh = create("IfcOwnerHistory");
			set(oh, "ChangeAction", "NOCHANGE");
			expectPass("IfcOwnerHistory", "CorrectChangeAction", oh);
		});
		test("fail: LastModifiedDate absent, ChangeAction is MODIFIED", () => {
			const oh = create("IfcOwnerHistory");
			set(oh, "ChangeAction", "MODIFIED");
			expectFail("IfcOwnerHistory", "CorrectChangeAction", oh);
		});
	});

	function edgeCurve(edgeStart: EntityInstance, edgeEnd: EntityInstance): EntityInstance {
		const ec = create("IfcEdgeCurve");
		set(ec, "EdgeStart", edgeStart);
		set(ec, "EdgeEnd", edgeEnd);
		return ec;
	}

	describe("IfcPath.IsContinuous (chunk 4)", () => {
		test("pass: fewer than 2 edges (nothing to check)", () => {
			const path = create("IfcPath");
			const oe = create("IfcOrientedEdge");
			set(oe, "EdgeElement", edgeCurve(create("IfcVertexPoint"), create("IfcVertexPoint")));
			set(path, "EdgeList", [oe]);
			expectPass("IfcPath", "IsContinuous", path);
		});
		test("pass: consecutive edges share EdgeEnd/EdgeStart", () => {
			const shared = create("IfcVertexPoint");
			const oe1 = create("IfcOrientedEdge");
			set(oe1, "EdgeElement", edgeCurve(create("IfcVertexPoint"), shared));
			const oe2 = create("IfcOrientedEdge");
			set(oe2, "EdgeElement", edgeCurve(shared, create("IfcVertexPoint")));
			const path = create("IfcPath");
			set(path, "EdgeList", [oe1, oe2]);
			expectPass("IfcPath", "IsContinuous", path);
		});
		test("fail: consecutive edges do NOT share EdgeEnd/EdgeStart", () => {
			// Each vertex is given a distinct `VertexGeometry` -- `settings.compareInstancesByValue`
			// is on for this whole file, so two bare, all-null `IfcVertexPoint` instances would
			// otherwise compare structurally EQUAL to each other and defeat this fail case.
			function vertex(coords: number[]): EntityInstance {
				const v = create("IfcVertexPoint");
				set(v, "VertexGeometry", point3D(coords));
				return v;
			}
			const oe1 = create("IfcOrientedEdge");
			set(oe1, "EdgeElement", edgeCurve(vertex([0, 0, 0]), vertex([1, 0, 0])));
			const oe2 = create("IfcOrientedEdge");
			set(oe2, "EdgeElement", edgeCurve(vertex([2, 0, 0]), vertex([3, 0, 0])));
			const path = create("IfcPath");
			set(path, "EdgeList", [oe1, oe2]);
			expectFail("IfcPath", "IsContinuous", path);
		});
	});

	describe("IfcPcurve.DimIs2D (chunk 4)", () => {
		test("pass/fail: ReferenceCurve.Dim must equal 2", () => {
			const pcurve2D = create("IfcPcurve");
			set(pcurve2D, "ReferenceCurve", polyline2D());
			expectPass("IfcPcurve", "DimIs2D", pcurve2D);

			const pcurve3D = create("IfcPcurve");
			set(pcurve3D, "ReferenceCurve", polyline3D());
			expectFail("IfcPcurve", "DimIs2D", pcurve3D);
		});
	});

	describe("IfcPerson.IdentifiablePerson (chunk 4)", () => {
		test("pass: Identification given", () => {
			const person = create("IfcPerson");
			set(person, "Identification", "ID1");
			expectPass("IfcPerson", "IdentifiablePerson", person);
		});
		test("pass: FamilyName given", () => {
			const person = create("IfcPerson");
			set(person, "FamilyName", "Smith");
			expectPass("IfcPerson", "IdentifiablePerson", person);
		});
		test("fail: none given", () => {
			expectFail("IfcPerson", "IdentifiablePerson", create("IfcPerson"));
		});
	});

	describe("IfcPerson.ValidSetOfNames (chunk 4)", () => {
		test("pass: MiddleNames not given", () => {
			expectPass("IfcPerson", "ValidSetOfNames", create("IfcPerson"));
		});
		test("pass: MiddleNames given and FamilyName also given", () => {
			const person = create("IfcPerson");
			set(person, "MiddleNames", ["A."]);
			set(person, "FamilyName", "Smith");
			expectPass("IfcPerson", "ValidSetOfNames", person);
		});
		test("fail: MiddleNames given but neither FamilyName nor GivenName given", () => {
			const person = create("IfcPerson");
			set(person, "MiddleNames", ["A."]);
			expectFail("IfcPerson", "ValidSetOfNames", person);
		});
	});

	describe("IfcPhysicalComplexQuantity.NoSelfReference (chunk 4)", () => {
		test("pass: HasQuantities does not contain self", () => {
			const complex = create("IfcPhysicalComplexQuantity");
			set(complex, "HasQuantities", [create("IfcQuantityCount")]);
			expectPass("IfcPhysicalComplexQuantity", "NoSelfReference", complex);
		});
		test("fail: HasQuantities contains self", () => {
			const complex = create("IfcPhysicalComplexQuantity");
			set(complex, "HasQuantities", [complex]);
			expectFail("IfcPhysicalComplexQuantity", "NoSelfReference", complex);
		});
	});

	describe("IfcPhysicalComplexQuantity.UniqueQuantityNames (chunk 4)", () => {
		test("pass: every HasQuantities member has a distinct Name", () => {
			const q1 = create("IfcQuantityCount");
			set(q1, "Name", "Count1");
			const q2 = create("IfcQuantityCount");
			set(q2, "Name", "Count2");
			const complex = create("IfcPhysicalComplexQuantity");
			set(complex, "HasQuantities", [q1, q2]);
			expectPass("IfcPhysicalComplexQuantity", "UniqueQuantityNames", complex);
		});
		test("fail: two HasQuantities members share the same Name", () => {
			const q1 = create("IfcQuantityCount");
			set(q1, "Name", "Count1");
			const q2 = create("IfcQuantityCount");
			set(q2, "Name", "Count1");
			const complex = create("IfcPhysicalComplexQuantity");
			set(complex, "HasQuantities", [q1, q2]);
			expectFail("IfcPhysicalComplexQuantity", "UniqueQuantityNames", complex);
		});
	});

	describe("IfcPixelTexture (chunk 4)", () => {
		function pixelTexture(width: number, height: number, colourComponents: number, pixel: string[]): EntityInstance {
			const t = create("IfcPixelTexture");
			set(t, "Width", width);
			set(t, "Height", height);
			set(t, "ColourComponents", colourComponents);
			set(t, "Pixel", pixel);
			return t;
		}
		test("MinPixelInS pass/fail: Width >= 1", () => {
			expectPass("IfcPixelTexture", "MinPixelInS", pixelTexture(1, 1, 1, ["a"]));
			expectFail("IfcPixelTexture", "MinPixelInS", pixelTexture(0, 1, 1, []));
		});
		test("MinPixelInT pass/fail: Height >= 1", () => {
			expectPass("IfcPixelTexture", "MinPixelInT", pixelTexture(1, 1, 1, ["a"]));
			expectFail("IfcPixelTexture", "MinPixelInT", pixelTexture(1, 0, 1, []));
		});
		test("NumberOfColours pass/fail: ColourComponents in [1, 4]", () => {
			expectPass("IfcPixelTexture", "NumberOfColours", pixelTexture(1, 1, 4, ["a", "b", "c", "d"]));
			expectFail("IfcPixelTexture", "NumberOfColours", pixelTexture(1, 1, 5, []));
		});
		test("SizeOfPixelList pass/fail: Pixel size must equal Width * Height", () => {
			expectPass("IfcPixelTexture", "SizeOfPixelList", pixelTexture(2, 2, 1, ["a", "b", "c", "d"]));
			expectFail("IfcPixelTexture", "SizeOfPixelList", pixelTexture(2, 2, 1, ["a"]));
		});
		test("PixelAsByteAndSameLength pass: every Pixel member is 8 bits and shares the first member's own length", () => {
			expectPass("IfcPixelTexture", "PixelAsByteAndSameLength", pixelTexture(1, 2, 1, ["00000000", "11111111"]));
		});
		test("PixelAsByteAndSameLength fail: a Pixel member's length is not a multiple of 8", () => {
			expectFail("IfcPixelTexture", "PixelAsByteAndSameLength", pixelTexture(1, 1, 1, ["0000000"]));
		});
		test("PixelAsByteAndSameLength fail: Pixel members have mismatched lengths", () => {
			expectFail(
				"IfcPixelTexture",
				"PixelAsByteAndSameLength",
				pixelTexture(1, 2, 1, ["00000000", "1111111100000000"]),
			);
		});
	});

	describe("IfcPolyLoop.AllPointsSameDim (chunk 4)", () => {
		test("pass: every Polygon member shares the same Dim", () => {
			const loop = create("IfcPolyLoop");
			set(loop, "Polygon", [point2D([0, 0]), point2D([1, 0]), point2D([1, 1])]);
			expectPass("IfcPolyLoop", "AllPointsSameDim", loop);
		});
		test("fail: a Polygon member has a different Dim", () => {
			const loop = create("IfcPolyLoop");
			set(loop, "Polygon", [point2D([0, 0]), point3D([1, 0, 0])]);
			expectFail("IfcPolyLoop", "AllPointsSameDim", loop);
		});
	});

	describe("IfcPolygonalBoundedHalfSpace (chunk 4)", () => {
		test("BoundaryDim pass/fail: PolygonalBoundary.Dim must equal 2", () => {
			const half2D = create("IfcPolygonalBoundedHalfSpace");
			set(half2D, "PolygonalBoundary", polyline2D());
			expectPass("IfcPolygonalBoundedHalfSpace", "BoundaryDim", half2D);

			const half3D = create("IfcPolygonalBoundedHalfSpace");
			set(half3D, "PolygonalBoundary", polyline3D());
			expectFail("IfcPolygonalBoundedHalfSpace", "BoundaryDim", half3D);
		});
		test("BoundaryType pass/fail: PolygonalBoundary must be IfcPolyline/IfcCompositeCurve/IfcIndexedPolyCurve", () => {
			const halfPoly = create("IfcPolygonalBoundedHalfSpace");
			set(halfPoly, "PolygonalBoundary", polyline2D());
			expectPass("IfcPolygonalBoundedHalfSpace", "BoundaryType", halfPoly);

			// The genuinely new-in-ADD2 case (see whereRules/ifc4x3.ts's own header comment):
			// IFC4's own version does NOT accept an IfcIndexedPolyCurve here.
			const halfIndexed = create("IfcPolygonalBoundedHalfSpace");
			set(halfIndexed, "PolygonalBoundary", create("IfcIndexedPolyCurve"));
			expectPass("IfcPolygonalBoundedHalfSpace", "BoundaryType", halfIndexed);

			const halfBad = create("IfcPolygonalBoundedHalfSpace");
			set(halfBad, "PolygonalBoundary", create("IfcCartesianPoint"));
			expectFail("IfcPolygonalBoundedHalfSpace", "BoundaryType", halfBad);
		});
	});

	describe("IfcPolyline.SameDim (chunk 4)", () => {
		test("pass: every Points member shares the same Dim", () => {
			expectPass("IfcPolyline", "SameDim", polyline2D());
		});
		test("fail: a Points member has a different Dim", () => {
			const pl = create("IfcPolyline");
			set(pl, "Points", [point2D([0, 0]), point3D([1, 0, 0])]);
			expectFail("IfcPolyline", "SameDim", pl);
		});
	});

	describe("IfcPolynomialCurve (chunk 4, genuinely new in ADD2)", () => {
		test("CorrectPositionDim pass: 2D position with no CoefficientsZ", () => {
			const curve = create("IfcPolynomialCurve");
			const placement2D = create("IfcAxis2Placement2D");
			set(placement2D, "Location", point2D([0, 0]));
			set(curve, "Position", placement2D);
			expectPass("IfcPolynomialCurve", "CorrectPositionDim", curve);
		});
		test("CorrectPositionDim pass: 3D position (CoefficientsZ irrelevant)", () => {
			const curve = create("IfcPolynomialCurve");
			const placement = create("IfcAxis2Placement3D");
			set(placement, "Location", point3D([0, 0, 0]));
			set(curve, "Position", placement);
			expectPass("IfcPolynomialCurve", "CorrectPositionDim", curve);
		});
		test("CorrectPositionDim fail: 2D position WITH CoefficientsZ", () => {
			const curve = create("IfcPolynomialCurve");
			const placement = create("IfcAxis2Placement2D");
			set(placement, "Location", point2D([0, 0]));
			set(curve, "Position", placement);
			set(curve, "CoefficientsZ", [0, 1]);
			expectFail("IfcPolynomialCurve", "CorrectPositionDim", curve);
		});
		test("ValidCoefficients pass: at least two of X/Y/Z given", () => {
			const curve = create("IfcPolynomialCurve");
			set(curve, "CoefficientsX", [0, 1]);
			set(curve, "CoefficientsY", [0, 1]);
			expectPass("IfcPolynomialCurve", "ValidCoefficients", curve);
		});
		test("ValidCoefficients fail: only one of X/Y/Z given", () => {
			const curve = create("IfcPolynomialCurve");
			set(curve, "CoefficientsX", [0, 1]);
			expectFail("IfcPolynomialCurve", "ValidCoefficients", curve);
		});
	});

	describe("IfcPositioningElement.HasPlacement (chunk 4, genuinely new in ADD2)", () => {
		test("pass: ObjectPlacement is given", () => {
			const posEl = create("IfcPositioningElement");
			set(posEl, "ObjectPlacement", create("IfcLocalPlacement"));
			expectPass("IfcPositioningElement", "HasPlacement", posEl);
		});
		test("fail: ObjectPlacement is not given", () => {
			expectFail("IfcPositioningElement", "HasPlacement", create("IfcPositioningElement"));
		});
	});

	// =============================================================================
	// End-to-end wiring: `executeRules(file)` against the REAL registered rules above,
	// on a dedicated, freshly-constructed file -- mirrors `ifc2x3.test.ts`'s/
	// `ifc4.test.ts`'s own identical end-to-end block, closing the same "registry ->
	// engine -> real rule body" gap.
	// =============================================================================

	// =============================================================================
	// Phase EX-4, IFC4X3_ADD2 chunk 5: original, hand-rolled coverage for the 120 rules
	// ported in `whereRules/ifc4x3.ts`'s own 5th `registerSchemaRules("IFC4X3_ADD2", [...])`
	// call (`IfcPostalAddress_WR1` through `IfcSeamCurve_SameSurface`). Same data-driven
	// `describe.each` pattern established by chunks 2-4 for the ordinary
	// `_CorrectPredefinedType`/`_CorrectTypeAssigned` rules, the same data-driven-loop
	// pattern IFC4's own chunk 5 tests established for `valueNotAmongList`/`attrsDiffer`
	// call sites, plus individual `describe` blocks for the remaining bespoke rules, in
	// real ADD2 file order.
	// =============================================================================

	interface CorrectPredefinedTypeCaseChunk5 {
		readonly typeName: string;
		readonly escapeAttr: string;
		readonly optional: boolean;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 5 `correctPredefinedType(...)`
	// call sites (real source lines 9942-11117). `IfcProcedureType`'s own `escapeAttr:
	// "ProcessType"` matches `correctPredefinedType`'s already-existing `escapeAttrName`
	// parameter -- no new shape.
	const correctPredefinedTypeCasesChunk5: readonly CorrectPredefinedTypeCaseChunk5[] = [
		{ typeName: "IfcProcedure", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcProcedureType", escapeAttr: "ProcessType", optional: false },
		{ typeName: "IfcProjectionElement", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcProtectiveDevice", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcProtectiveDeviceTrippingUnit", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcProtectiveDeviceTrippingUnitType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcProtectiveDeviceType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcPump", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcPumpType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcRail", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRailType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcRailing", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRailingType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcRailway", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRailwayPart", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRamp", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRampFlight", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRampFlightType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcRampType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcReinforcedSoil", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcReinforcingBar", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcReinforcingBarType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcReinforcingMesh", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcReinforcingMeshType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcRoad", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRoadPart", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRoof", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcRoofType", escapeAttr: "ElementType", optional: false },
		{ typeName: "IfcSanitaryTerminal", escapeAttr: "ObjectType", optional: true },
		{ typeName: "IfcSanitaryTerminalType", escapeAttr: "ElementType", optional: false },
	];

	describe.each(correctPredefinedTypeCasesChunk5)(
		"$typeName.CorrectPredefinedType (chunk 5)",
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

	interface CorrectTypeAssignedCaseChunk5 {
		readonly typeName: string;
		readonly expectedTypeName: string;
	}

	// Hand-derived directly from `whereRules/ifc4x3.ts`'s own chunk 5 `correctTypeAssigned(...)`
	// call sites (real source lines 9942-11117).
	const correctTypeAssignedCasesChunk5: readonly CorrectTypeAssignedCaseChunk5[] = [
		{ typeName: "IfcProtectiveDevice", expectedTypeName: "IfcProtectiveDeviceType" },
		{ typeName: "IfcProtectiveDeviceTrippingUnit", expectedTypeName: "IfcProtectiveDeviceTrippingUnitType" },
		{ typeName: "IfcPump", expectedTypeName: "IfcPumpType" },
		{ typeName: "IfcRail", expectedTypeName: "IfcRailType" },
		{ typeName: "IfcRailing", expectedTypeName: "IfcRailingType" },
		{ typeName: "IfcRamp", expectedTypeName: "IfcRampType" },
		{ typeName: "IfcRampFlight", expectedTypeName: "IfcRampFlightType" },
		{ typeName: "IfcReinforcingBar", expectedTypeName: "IfcReinforcingBarType" },
		{ typeName: "IfcReinforcingMesh", expectedTypeName: "IfcReinforcingMeshType" },
		{ typeName: "IfcRoof", expectedTypeName: "IfcRoofType" },
		{ typeName: "IfcSanitaryTerminal", expectedTypeName: "IfcSanitaryTerminalType" },
	];

	describe.each(correctTypeAssignedCasesChunk5)(
		"$typeName.CorrectTypeAssigned (chunk 5)",
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
				// `IfcActuatorType` (chunk 1) is a real, always-available *Type entity not equal
				// to any `expectedTypeName` this chunk's own cases use.
				typeAssign(inst, create("IfcActuatorType"));
				expectFail(typeName, "CorrectTypeAssigned", inst);
			});
		},
	);

	describe("IfcPostalAddress.WR1", () => {
		test("pass: Town given", () => {
			const address = create("IfcPostalAddress");
			set(address, "Town", "Springfield");
			expectPass("IfcPostalAddress", "WR1", address);
		});
		test("fail: no address-detail attribute given", () => {
			expectFail("IfcPostalAddress", "WR1", create("IfcPostalAddress"));
		});
	});

	describe("IfcPresentationLayerAssignment.ApplicableItems", () => {
		test("pass: every AssignedItems member is an applicable kind", () => {
			const assignment = create("IfcPresentationLayerAssignment");
			set(assignment, "AssignedItems", [create("IfcShapeRepresentation"), create("IfcCartesianPoint")]);
			expectPass("IfcPresentationLayerAssignment", "ApplicableItems", assignment);
		});
		test("fail: an AssignedItems member is not an applicable kind", () => {
			const assignment = create("IfcPresentationLayerAssignment");
			set(assignment, "AssignedItems", [create("IfcPostalAddress")]);
			expectFail("IfcPresentationLayerAssignment", "ApplicableItems", assignment);
		});
	});

	// **Genuine ADD2-vs-IFC4 behavior difference exercised here** -- IFC4's own
	// byte-identical-named rule requires EXACTLY ONE of IfcGeometricRepresentationItem/
	// IfcMappedItem; ADD2 relaxes to AT LEAST ONE. Both a plain `IfcCartesianPoint` (an
	// `IfcGeometricRepresentationItem`) and an `IfcMappedItem` pass either version; the
	// pass/fail fixtures below don't happen to distinguish the two versions (no real
	// instance is simultaneously both kinds), matching this rule's own doc comment
	// disclosure that the relaxation is not expected to change real-world outcomes.
	describe("IfcPresentationLayerWithStyle.ApplicableOnlyToItems", () => {
		test("pass: every AssignedItems member is an applicable kind", () => {
			const assignment = create("IfcPresentationLayerWithStyle");
			set(assignment, "AssignedItems", [create("IfcCartesianPoint")]);
			expectPass("IfcPresentationLayerWithStyle", "ApplicableOnlyToItems", assignment);
		});
		test("pass: an IfcMappedItem member (also applicable)", () => {
			const assignment = create("IfcPresentationLayerWithStyle");
			set(assignment, "AssignedItems", [create("IfcMappedItem")]);
			expectPass("IfcPresentationLayerWithStyle", "ApplicableOnlyToItems", assignment);
		});
		test("fail: an AssignedItems member is an IfcShapeRepresentation (not applicable here)", () => {
			const assignment = create("IfcPresentationLayerWithStyle");
			set(assignment, "AssignedItems", [create("IfcShapeRepresentation")]);
			expectFail("IfcPresentationLayerWithStyle", "ApplicableOnlyToItems", assignment);
		});
	});

	describe("IfcProcedure.HasName", () => {
		test("pass/fail", () => {
			const procedure = create("IfcProcedure");
			set(procedure, "Name", "Inspect");
			expectPass("IfcProcedure", "HasName", procedure);
			expectFail("IfcProcedure", "HasName", create("IfcProcedure"));
		});
	});

	describe("IfcProduct.PlacementForShapeRepresentation", () => {
		function productDefinitionShape(shapeReps: EntityInstance[]): EntityInstance {
			const pds = create("IfcProductDefinitionShape");
			set(pds, "Representations", shapeReps);
			return pds;
		}
		test("pass: no Representation at all", () => {
			expectPass("IfcProduct", "PlacementForShapeRepresentation", create("IfcAnnotation"));
		});
		test("pass: Representation given with an ObjectPlacement", () => {
			const product = create("IfcAnnotation");
			set(product, "Representation", productDefinitionShape([create("IfcShapeRepresentation")]));
			set(product, "ObjectPlacement", create("IfcLocalPlacement"));
			expectPass("IfcProduct", "PlacementForShapeRepresentation", product);
		});
		test("pass: Representation given with no IfcShapeRepresentation at all, no ObjectPlacement", () => {
			const product = create("IfcAnnotation");
			set(product, "Representation", productDefinitionShape([create("IfcTopologyRepresentation")]));
			expectPass("IfcProduct", "PlacementForShapeRepresentation", product);
		});
		test("fail: Representation has an IfcShapeRepresentation but no ObjectPlacement", () => {
			const product = create("IfcAnnotation");
			set(product, "Representation", productDefinitionShape([create("IfcShapeRepresentation")]));
			expectFail("IfcProduct", "PlacementForShapeRepresentation", product);
		});
	});

	describe("IfcProductDefinitionShape.OnlyShapeModel", () => {
		test("pass: every Representations member is an IfcShapeModel", () => {
			const pds = create("IfcProductDefinitionShape");
			set(pds, "Representations", [create("IfcShapeRepresentation")]);
			expectPass("IfcProductDefinitionShape", "OnlyShapeModel", pds);
		});
		test("fail: a Representations member is not an IfcShapeModel", () => {
			const pds = create("IfcProductDefinitionShape");
			set(pds, "Representations", [create("IfcStyleModel")]);
			expectFail("IfcProductDefinitionShape", "OnlyShapeModel", pds);
		});
	});

	describe("IfcProject.HasName", () => {
		test("pass/fail", () => {
			const project = create("IfcProject");
			set(project, "Name", "My Project");
			expectPass("IfcProject", "HasName", project);
			expectFail("IfcProject", "HasName", create("IfcProject"));
		});
	});

	describe("IfcProject.CorrectContext", () => {
		test("pass: RepresentationContexts not given", () => {
			expectPass("IfcProject", "CorrectContext", create("IfcProject"));
		});
		test("pass: RepresentationContexts has no sub-context", () => {
			const project = create("IfcProject");
			set(project, "RepresentationContexts", [create("IfcGeometricRepresentationContext")]);
			expectPass("IfcProject", "CorrectContext", project);
		});
		test("fail: RepresentationContexts contains an IfcGeometricRepresentationSubContext", () => {
			const project = create("IfcProject");
			set(project, "RepresentationContexts", [create("IfcGeometricRepresentationSubContext")]);
			expectFail("IfcProject", "CorrectContext", project);
		});
	});

	describe("IfcProject.NoDecomposition", () => {
		test("pass/fail", () => {
			expectPass("IfcProject", "NoDecomposition", create("IfcProject"));
		});
	});

	// **Genuine RULE_NAME rename** -- see this rule's own doc comment in `whereRules/
	// ifc4x3.ts`: byte-identical logic to IFC4's own `IfcProjectedCRS.IsLengthUnit`.
	describe("IfcProjectedCRS.MapUnitIsLength", () => {
		test("pass: MapUnit not given", () => {
			expectPass("IfcProjectedCRS", "MapUnitIsLength", create("IfcProjectedCRS"));
		});
		test("pass: MapUnit's UnitType is LENGTHUNIT", () => {
			const crs = create("IfcProjectedCRS");
			const unit = create("IfcSIUnit");
			set(unit, "UnitType", "LENGTHUNIT");
			set(crs, "MapUnit", unit);
			expectPass("IfcProjectedCRS", "MapUnitIsLength", crs);
		});
		test("fail: MapUnit's UnitType is not LENGTHUNIT", () => {
			const crs = create("IfcProjectedCRS");
			const unit = create("IfcSIUnit");
			set(unit, "UnitType", "MASSUNIT");
			set(crs, "MapUnit", unit);
			expectFail("IfcProjectedCRS", "MapUnitIsLength", crs);
		});
	});

	describe("IfcPropertyBoundedValue", () => {
		// `optionalSameUnit` only ever compares `typeof(...)`, never the actual wrapped
		// value -- bare, valueless `create("IfcLengthMeasure")`-style defined-type
		// instances are sufficient fixtures (matching `ifc4.test.ts`'s own identical
		// convention for this exact rule).
		function boundedValue(upper?: EntityInstance, lower?: EntityInstance, setPoint?: EntityInstance): EntityInstance {
			const pv = create("IfcPropertyBoundedValue");
			if (upper !== undefined) set(pv, "UpperBoundValue", upper);
			if (lower !== undefined) set(pv, "LowerBoundValue", lower);
			if (setPoint !== undefined) set(pv, "SetPointValue", setPoint);
			return pv;
		}
		test("SameUnitUpperLower pass/fail", () => {
			expectPass(
				"IfcPropertyBoundedValue",
				"SameUnitUpperLower",
				boundedValue(create("IfcLengthMeasure"), create("IfcLengthMeasure")),
			);
			const bad = create("IfcPropertyBoundedValue");
			set(bad, "UpperBoundValue", create("IfcLengthMeasure"));
			set(bad, "LowerBoundValue", create("IfcLabel"));
			expectFail("IfcPropertyBoundedValue", "SameUnitUpperLower", bad);
		});
		// **Code-review finding, fixed**: this test originally exercised only the passing
		// case, unlike its `SameUnitUpperLower` sibling immediately above -- added the
		// missing `expectFail` case for parity.
		test("SameUnitUpperSet pass/fail", () => {
			expectPass(
				"IfcPropertyBoundedValue",
				"SameUnitUpperSet",
				boundedValue(create("IfcLengthMeasure"), undefined, create("IfcLengthMeasure")),
			);
			const bad = create("IfcPropertyBoundedValue");
			set(bad, "UpperBoundValue", create("IfcLengthMeasure"));
			set(bad, "SetPointValue", create("IfcLabel"));
			expectFail("IfcPropertyBoundedValue", "SameUnitUpperSet", bad);
		});
		// **Code-review finding, fixed**: same missing-`expectFail` gap as `SameUnitUpperSet`
		// immediately above.
		test("SameUnitLowerSet pass/fail", () => {
			expectPass(
				"IfcPropertyBoundedValue",
				"SameUnitLowerSet",
				boundedValue(undefined, create("IfcLengthMeasure"), create("IfcLengthMeasure")),
			);
			const bad = create("IfcPropertyBoundedValue");
			set(bad, "LowerBoundValue", create("IfcLengthMeasure"));
			set(bad, "SetPointValue", create("IfcLabel"));
			expectFail("IfcPropertyBoundedValue", "SameUnitLowerSet", bad);
		});
	});

	describe("IfcPropertyDependencyRelationship.NoSelfReference", () => {
		test("pass/fail", () => {
			const p1 = create("IfcPropertySingleValue");
			set(p1, "Name", "A");
			const p2 = create("IfcPropertySingleValue");
			set(p2, "Name", "B");
			const rel = create("IfcPropertyDependencyRelationship");
			set(rel, "DependingProperty", p1);
			set(rel, "DependantProperty", p2);
			expectPass("IfcPropertyDependencyRelationship", "NoSelfReference", rel);

			const badRel = create("IfcPropertyDependencyRelationship");
			set(badRel, "DependingProperty", p1);
			set(badRel, "DependantProperty", p1);
			expectFail("IfcPropertyDependencyRelationship", "NoSelfReference", badRel);
		});
	});

	describe("IfcPropertyEnumeratedValue.WR21", () => {
		function enumeration(values: unknown[]): EntityInstance {
			const en = create("IfcPropertyEnumeration");
			set(en, "EnumerationValues", values);
			return en;
		}
		test("pass: EnumerationReference not given", () => {
			expectPass("IfcPropertyEnumeratedValue", "WR21", create("IfcPropertyEnumeratedValue"));
		});
		test("pass: EnumerationValues not given", () => {
			const pv = create("IfcPropertyEnumeratedValue");
			set(pv, "EnumerationReference", enumeration([create("IfcLabel")]));
			expectPass("IfcPropertyEnumeratedValue", "WR21", pv);
		});
		test("fail: an EnumerationValues member is not in EnumerationReference's own list (different type)", () => {
			const pv = create("IfcPropertyEnumeratedValue");
			set(pv, "EnumerationValues", [create("IfcLabel")]);
			set(pv, "EnumerationReference", enumeration([create("IfcIdentifier")]));
			expectFail("IfcPropertyEnumeratedValue", "WR21", pv);
		});
	});

	describe("IfcPropertyEnumeration.WR01", () => {
		test("pass: every EnumerationValues member shares the first member's own type", () => {
			const en = create("IfcPropertyEnumeration");
			set(en, "EnumerationValues", [create("IfcLabel"), create("IfcLabel")]);
			expectPass("IfcPropertyEnumeration", "WR01", en);
		});
		test("fail: an EnumerationValues member has a different type", () => {
			const en = create("IfcPropertyEnumeration");
			set(en, "EnumerationValues", [create("IfcLabel"), create("IfcIdentifier")]);
			expectFail("IfcPropertyEnumeration", "WR01", en);
		});
	});

	describe("IfcPropertyListValue.WR31", () => {
		test("pass: every ListValues member shares the first member's own type", () => {
			const lv = create("IfcPropertyListValue");
			set(lv, "ListValues", [create("IfcLabel"), create("IfcLabel")]);
			expectPass("IfcPropertyListValue", "WR31", lv);
		});
		test("fail: a ListValues member has a different type", () => {
			const lv = create("IfcPropertyListValue");
			set(lv, "ListValues", [create("IfcLabel"), create("IfcIdentifier")]);
			expectFail("IfcPropertyListValue", "WR31", lv);
		});
	});

	describe("IfcPropertySet.ExistsName", () => {
		test("pass/fail", () => {
			const ps = create("IfcPropertySet");
			set(ps, "Name", "Pset_A");
			expectPass("IfcPropertySet", "ExistsName", ps);
			expectFail("IfcPropertySet", "ExistsName", create("IfcPropertySet"));
		});
	});

	describe("IfcPropertySet.UniquePropertyNames", () => {
		test("pass: every HasProperties member has a distinct Name", () => {
			const p1 = create("IfcPropertySingleValue");
			set(p1, "Name", "A");
			const p2 = create("IfcPropertySingleValue");
			set(p2, "Name", "B");
			const ps = create("IfcPropertySet");
			set(ps, "HasProperties", [p1, p2]);
			expectPass("IfcPropertySet", "UniquePropertyNames", ps);
		});
		test("fail: two HasProperties members share the same Name", () => {
			const p1 = create("IfcPropertySingleValue");
			set(p1, "Name", "A");
			const p2 = create("IfcPropertySingleValue");
			set(p2, "Name", "A");
			const ps = create("IfcPropertySet");
			set(ps, "HasProperties", [p1, p2]);
			expectFail("IfcPropertySet", "UniquePropertyNames", ps);
		});
	});

	describe("IfcPropertySetTemplate.ExistsName", () => {
		test("pass/fail", () => {
			const pst = create("IfcPropertySetTemplate");
			set(pst, "Name", "Pset_A");
			expectPass("IfcPropertySetTemplate", "ExistsName", pst);
			expectFail("IfcPropertySetTemplate", "ExistsName", create("IfcPropertySetTemplate"));
		});
	});

	describe("IfcPropertySetTemplate.UniquePropertyNames", () => {
		test("pass: every HasPropertyTemplates member has a distinct Name", () => {
			const t1 = create("IfcSimplePropertyTemplate");
			set(t1, "Name", "A");
			const t2 = create("IfcSimplePropertyTemplate");
			set(t2, "Name", "B");
			const pst = create("IfcPropertySetTemplate");
			set(pst, "HasPropertyTemplates", [t1, t2]);
			expectPass("IfcPropertySetTemplate", "UniquePropertyNames", pst);
		});
		test("fail: two HasPropertyTemplates members share the same Name", () => {
			const t1 = create("IfcSimplePropertyTemplate");
			set(t1, "Name", "A");
			const t2 = create("IfcSimplePropertyTemplate");
			set(t2, "Name", "A");
			const pst = create("IfcPropertySetTemplate");
			set(pst, "HasPropertyTemplates", [t1, t2]);
			expectFail("IfcPropertySetTemplate", "UniquePropertyNames", pst);
		});
	});

	describe("IfcPropertyTableValue", () => {
		test("WR21 pass/fail: DefiningValues/DefinedValues must both be absent, or both present with equal size", () => {
			expectPass("IfcPropertyTableValue", "WR21", create("IfcPropertyTableValue"));
			const equalSizes = create("IfcPropertyTableValue");
			set(equalSizes, "DefiningValues", [create("IfcLabel")]);
			set(equalSizes, "DefinedValues", [create("IfcLabel")]);
			expectPass("IfcPropertyTableValue", "WR21", equalSizes);

			const mismatched = create("IfcPropertyTableValue");
			set(mismatched, "DefiningValues", [create("IfcLabel")]);
			set(mismatched, "DefinedValues", [create("IfcLabel"), create("IfcLabel")]);
			expectFail("IfcPropertyTableValue", "WR21", mismatched);
		});
		// **Code-review regression test**: exactly ONE of DefiningValues/DefinedValues given
		// (the other genuinely absent, not empty) must PASS, not fail -- `sizeof()` of the
		// absent one is `INDETERMINATE`, so `triEq(...)` is itself `INDETERMINATE`, and real
		// Python's own `assert (...) is not False` treats that as satisfied. An earlier
		// version of this rule collapsed that `INDETERMINATE` to a hard `false` via a bare
		// `=== true` comparison before its own `||`, which would have wrongly failed this
		// exact case -- see this rule's own doc comment in `whereRules/ifc4x3.ts`.
		test("WR21 pass: exactly one of DefiningValues/DefinedValues given (the other genuinely absent)", () => {
			const onlyDefining = create("IfcPropertyTableValue");
			set(onlyDefining, "DefiningValues", [create("IfcLabel")]);
			expectPass("IfcPropertyTableValue", "WR21", onlyDefining);

			const onlyDefined = create("IfcPropertyTableValue");
			set(onlyDefined, "DefinedValues", [create("IfcLabel")]);
			expectPass("IfcPropertyTableValue", "WR21", onlyDefined);
		});
		test("WR22 pass/fail: if given, every DefiningValues member must share the first member's own type", () => {
			const tv = create("IfcPropertyTableValue");
			set(tv, "DefiningValues", [create("IfcLabel"), create("IfcLabel")]);
			expectPass("IfcPropertyTableValue", "WR22", tv);

			const badTv = create("IfcPropertyTableValue");
			set(badTv, "DefiningValues", [create("IfcLabel"), create("IfcIdentifier")]);
			expectFail("IfcPropertyTableValue", "WR22", badTv);
		});
		test("WR23 pass/fail: if given, every DefinedValues member must share the first member's own type", () => {
			const tv = create("IfcPropertyTableValue");
			set(tv, "DefinedValues", [create("IfcLabel"), create("IfcLabel")]);
			expectPass("IfcPropertyTableValue", "WR23", tv);

			const badTv = create("IfcPropertyTableValue");
			set(badTv, "DefinedValues", [create("IfcLabel"), create("IfcIdentifier")]);
			expectFail("IfcPropertyTableValue", "WR23", badTv);
		});
	});

	describe("IfcQuantityArea", () => {
		test("WR21 pass/fail: Unit's UnitType must be AREAUNIT", () => {
			expectPass("IfcQuantityArea", "WR21", create("IfcQuantityArea"));
			const area = create("IfcQuantityArea");
			const unit = create("IfcSIUnit");
			set(unit, "UnitType", "AREAUNIT");
			set(area, "Unit", unit);
			expectPass("IfcQuantityArea", "WR21", area);

			const badArea = create("IfcQuantityArea");
			const badUnit = create("IfcSIUnit");
			set(badUnit, "UnitType", "VOLUMEUNIT");
			set(badArea, "Unit", badUnit);
			expectFail("IfcQuantityArea", "WR21", badArea);
		});
		test("WR22 pass/fail: AreaValue must be >= 0", () => {
			const area = create("IfcQuantityArea");
			set(area, "AreaValue", 0);
			expectPass("IfcQuantityArea", "WR22", area);
			const badArea = create("IfcQuantityArea");
			set(badArea, "AreaValue", -1);
			expectFail("IfcQuantityArea", "WR22", badArea);
		});
	});

	// **Cosmetic-only difference from IFC4's own byte-identical-named rule** -- see this
	// rule's own doc comment in `whereRules/ifc4x3.ts` (`>= 0` vs. `>= 0.0`, no real
	// behavior change).
	describe("IfcQuantityCount.WR21", () => {
		test("pass/fail: CountValue must be >= 0", () => {
			const count = create("IfcQuantityCount");
			set(count, "CountValue", 0);
			expectPass("IfcQuantityCount", "WR21", count);
			const badCount = create("IfcQuantityCount");
			set(badCount, "CountValue", -1);
			expectFail("IfcQuantityCount", "WR21", badCount);
		});
	});

	describe("IfcQuantityLength", () => {
		test("WR21 pass/fail: Unit's UnitType must be LENGTHUNIT", () => {
			const length = create("IfcQuantityLength");
			const unit = create("IfcSIUnit");
			set(unit, "UnitType", "LENGTHUNIT");
			set(length, "Unit", unit);
			expectPass("IfcQuantityLength", "WR21", length);

			const badLength = create("IfcQuantityLength");
			const badUnit = create("IfcSIUnit");
			set(badUnit, "UnitType", "MASSUNIT");
			set(badLength, "Unit", badUnit);
			expectFail("IfcQuantityLength", "WR21", badLength);
		});
		test("WR22 pass/fail: LengthValue must be >= 0", () => {
			const length = create("IfcQuantityLength");
			set(length, "LengthValue", 0);
			expectPass("IfcQuantityLength", "WR22", length);
			const badLength = create("IfcQuantityLength");
			set(badLength, "LengthValue", -1);
			expectFail("IfcQuantityLength", "WR22", badLength);
		});
	});

	describe("IfcQuantityTime", () => {
		test("WR21 pass/fail: Unit's UnitType must be TIMEUNIT", () => {
			const time = create("IfcQuantityTime");
			const unit = create("IfcSIUnit");
			set(unit, "UnitType", "TIMEUNIT");
			set(time, "Unit", unit);
			expectPass("IfcQuantityTime", "WR21", time);

			const badTime = create("IfcQuantityTime");
			const badUnit = create("IfcSIUnit");
			set(badUnit, "UnitType", "MASSUNIT");
			set(badTime, "Unit", badUnit);
			expectFail("IfcQuantityTime", "WR21", badTime);
		});
		test("WR22 pass/fail: TimeValue must be >= 0", () => {
			const time = create("IfcQuantityTime");
			set(time, "TimeValue", 0);
			expectPass("IfcQuantityTime", "WR22", time);
			const badTime = create("IfcQuantityTime");
			set(badTime, "TimeValue", -1);
			expectFail("IfcQuantityTime", "WR22", badTime);
		});
	});

	describe("IfcQuantityVolume", () => {
		test("WR21 pass/fail: Unit's UnitType must be VOLUMEUNIT", () => {
			const volume = create("IfcQuantityVolume");
			const unit = create("IfcSIUnit");
			set(unit, "UnitType", "VOLUMEUNIT");
			set(volume, "Unit", unit);
			expectPass("IfcQuantityVolume", "WR21", volume);

			const badVolume = create("IfcQuantityVolume");
			const badUnit = create("IfcSIUnit");
			set(badUnit, "UnitType", "MASSUNIT");
			set(badVolume, "Unit", badUnit);
			expectFail("IfcQuantityVolume", "WR21", badVolume);
		});
		test("WR22 pass/fail: VolumeValue must be >= 0", () => {
			const volume = create("IfcQuantityVolume");
			set(volume, "VolumeValue", 0);
			expectPass("IfcQuantityVolume", "WR22", volume);
			const badVolume = create("IfcQuantityVolume");
			set(badVolume, "VolumeValue", -1);
			expectFail("IfcQuantityVolume", "WR22", badVolume);
		});
	});

	describe("IfcQuantityWeight", () => {
		test("WR21 pass/fail: Unit's UnitType must be MASSUNIT", () => {
			const weight = create("IfcQuantityWeight");
			const unit = create("IfcSIUnit");
			set(unit, "UnitType", "MASSUNIT");
			set(weight, "Unit", unit);
			expectPass("IfcQuantityWeight", "WR21", weight);

			const badWeight = create("IfcQuantityWeight");
			const badUnit = create("IfcSIUnit");
			set(badUnit, "UnitType", "TIMEUNIT");
			set(badWeight, "Unit", badUnit);
			expectFail("IfcQuantityWeight", "WR21", badWeight);
		});
		test("WR22 pass/fail: WeightValue must be >= 0", () => {
			const weight = create("IfcQuantityWeight");
			set(weight, "WeightValue", 0);
			expectPass("IfcQuantityWeight", "WR22", weight);
			const badWeight = create("IfcQuantityWeight");
			set(badWeight, "WeightValue", -1);
			expectFail("IfcQuantityWeight", "WR22", badWeight);
		});
	});

	describe("IfcRationalBSplineCurveWithKnots", () => {
		function rationalBSplineCurveWithKnots(weightsData: number[]): EntityInstance {
			const curve = create("IfcRationalBSplineCurveWithKnots");
			set(curve, "WeightsData", weightsData);
			set(
				curve,
				"ControlPointsList",
				weightsData.map((_, i) => point3D([i, 0, 0])),
			);
			return curve;
		}
		test("SameNumOfWeightsAndPoints pass/fail", () => {
			const curve = create("IfcRationalBSplineCurveWithKnots");
			set(curve, "WeightsData", [1, 1, 1]);
			set(curve, "ControlPointsList", [point3D([0, 0, 0]), point3D([1, 0, 0]), point3D([1, 1, 0])]);
			expectPass("IfcRationalBSplineCurveWithKnots", "SameNumOfWeightsAndPoints", curve);

			const badCurve = create("IfcRationalBSplineCurveWithKnots");
			set(badCurve, "WeightsData", [1, 1]);
			set(badCurve, "ControlPointsList", [point3D([0, 0, 0]), point3D([1, 0, 0]), point3D([1, 1, 0])]);
			expectFail("IfcRationalBSplineCurveWithKnots", "SameNumOfWeightsAndPoints", badCurve);
		});
		test("WeightsGreaterZero pass/fail", () => {
			expectPass("IfcRationalBSplineCurveWithKnots", "WeightsGreaterZero", rationalBSplineCurveWithKnots([1, 2, 1]));
			expectFail("IfcRationalBSplineCurveWithKnots", "WeightsGreaterZero", rationalBSplineCurveWithKnots([1, 0, 1]));
		});
	});

	describe("IfcRationalBSplineSurfaceWithKnots", () => {
		test("CorrespondingWeightsDataLists pass/fail", () => {
			const surface = create("IfcRationalBSplineSurfaceWithKnots");
			set(surface, "WeightsData", [
				[1, 1],
				[1, 1],
			]);
			set(surface, "ControlPointsList", [
				[point3D([0, 0, 0]), point3D([1, 0, 0])],
				[point3D([0, 1, 0]), point3D([1, 1, 0])],
			]);
			expectPass("IfcRationalBSplineSurfaceWithKnots", "CorrespondingWeightsDataLists", surface);

			const badSurface = create("IfcRationalBSplineSurfaceWithKnots");
			set(badSurface, "WeightsData", [
				[1, 1, 1],
				[1, 1],
			]);
			set(badSurface, "ControlPointsList", [
				[point3D([0, 0, 0]), point3D([1, 0, 0])],
				[point3D([0, 1, 0]), point3D([1, 1, 0])],
			]);
			expectFail("IfcRationalBSplineSurfaceWithKnots", "CorrespondingWeightsDataLists", badSurface);
		});
		// `WeightValuesGreaterZero` reads `self.Weights` directly, itself a DERIVE attribute
		// (Phase EX-2, `calc_IfcRationalBSplineSurfaceWithKnots_Weights` -> `IfcMakeArrayOfArray`,
		// already re-ported and re-disclosed for IFC4X3_ADD2 in `rules/ifc4x3.ts`, confirmed
		// byte-identical to IFC4's own already-disclosed version) -- the same real,
		// verbatim-preserved upstream Python bug (`[...] * u1 - low1 + 1`, a `list`-minus-`int`
		// `TypeError` by Python's own operator precedence) that fires UNCONDITIONALLY once
		// `WeightsData`/`ControlPointsList` are consistently shaped, matching `ifc4.test.ts`'s
		// own identical pinned regression for this identical rule -- cross-referenced, not
		// re-disclosed.
		test("throws for any well-formed surface -- Weights is unconditionally blocked by the already-disclosed IfcMakeArrayOfArray bug", () => {
			const surface = create("IfcRationalBSplineSurfaceWithKnots");
			set(surface, "ControlPointsList", [
				[point3D([0, 0, 0]), point3D([1, 0, 0])],
				[point3D([0, 1, 0]), point3D([1, 1, 0])],
			]);
			set(surface, "WeightsData", [
				[1, 1],
				[1, 1],
			]);
			expectFail("IfcRationalBSplineSurfaceWithKnots", "WeightValuesGreaterZero", surface);
		});
	});

	describe("IfcRectangleHollowProfileDef", () => {
		function hollowProfile(xDim: number, yDim: number, wallThickness: number): EntityInstance {
			const profile = create("IfcRectangleHollowProfileDef");
			set(profile, "XDim", xDim);
			set(profile, "YDim", yDim);
			set(profile, "WallThickness", wallThickness);
			return profile;
		}
		test("ValidWallThickness pass/fail", () => {
			expectPass("IfcRectangleHollowProfileDef", "ValidWallThickness", hollowProfile(100, 100, 10));
			expectFail("IfcRectangleHollowProfileDef", "ValidWallThickness", hollowProfile(100, 100, 60));
		});
		test("ValidInnerRadius pass/fail", () => {
			const profile = hollowProfile(100, 100, 10);
			set(profile, "InnerFilletRadius", 5);
			expectPass("IfcRectangleHollowProfileDef", "ValidInnerRadius", profile);

			const badProfile = hollowProfile(100, 100, 10);
			set(badProfile, "InnerFilletRadius", 1000);
			expectFail("IfcRectangleHollowProfileDef", "ValidInnerRadius", badProfile);
		});
		test("ValidOuterRadius pass/fail", () => {
			const profile = hollowProfile(100, 100, 10);
			set(profile, "OuterFilletRadius", 10);
			expectPass("IfcRectangleHollowProfileDef", "ValidOuterRadius", profile);

			const badProfile = hollowProfile(100, 100, 10);
			set(badProfile, "OuterFilletRadius", 1000);
			expectFail("IfcRectangleHollowProfileDef", "ValidOuterRadius", badProfile);
		});
	});

	describe("IfcRectangularTrimmedSurface", () => {
		test("U1AndU2Different pass/fail", () => {
			const surface = create("IfcRectangularTrimmedSurface");
			set(surface, "U1", 0);
			set(surface, "U2", 1);
			expectPass("IfcRectangularTrimmedSurface", "U1AndU2Different", surface);

			const badSurface = create("IfcRectangularTrimmedSurface");
			set(badSurface, "U1", 1);
			set(badSurface, "U2", 1);
			expectFail("IfcRectangularTrimmedSurface", "U1AndU2Different", badSurface);
		});
		test("V1AndV2Different pass/fail", () => {
			const surface = create("IfcRectangularTrimmedSurface");
			set(surface, "V1", 0);
			set(surface, "V2", 1);
			expectPass("IfcRectangularTrimmedSurface", "V1AndV2Different", surface);

			const badSurface = create("IfcRectangularTrimmedSurface");
			set(badSurface, "V1", 1);
			set(badSurface, "V2", 1);
			expectFail("IfcRectangularTrimmedSurface", "V1AndV2Different", badSurface);
		});
		test("UsenseCompatible pass/fail", () => {
			function surface(basisSurfaceType: string, usense: boolean, u1: number, u2: number): EntityInstance {
				const s = create("IfcRectangularTrimmedSurface");
				set(s, "BasisSurface", create(basisSurfaceType));
				set(s, "Usense", usense);
				set(s, "U1", u1);
				set(s, "U2", u2);
				return s;
			}
			// `IfcSphericalSurface` is a concrete `IfcElementarySurface` subtype that is not
			// `IfcPlane` -- always passes regardless of Usense.
			expectPass("IfcRectangularTrimmedSurface", "UsenseCompatible", surface("IfcSphericalSurface", false, 5, 1));
			expectPass("IfcRectangularTrimmedSurface", "UsenseCompatible", surface("IfcSurfaceOfRevolution", false, 5, 1));
			expectPass("IfcRectangularTrimmedSurface", "UsenseCompatible", surface("IfcPlane", true, 0, 1));
			expectFail("IfcRectangularTrimmedSurface", "UsenseCompatible", surface("IfcPlane", false, 0, 1));
		});
		test("VsenseCompatible pass/fail", () => {
			function surface(vsense: boolean, v1: number, v2: number): EntityInstance {
				const s = create("IfcRectangularTrimmedSurface");
				set(s, "Vsense", vsense);
				set(s, "V1", v1);
				set(s, "V2", v2);
				return s;
			}
			expectPass("IfcRectangularTrimmedSurface", "VsenseCompatible", surface(true, 0, 1));
			expectFail("IfcRectangularTrimmedSurface", "VsenseCompatible", surface(false, 0, 1));
		});
	});

	describe("IfcReinforcingBarType.BendingShapeCodeProvided / IfcReinforcingMeshType.BendingShapeCodeProvided", () => {
		test("pass: no BendingParameters at all", () => {
			expectPass("IfcReinforcingBarType", "BendingShapeCodeProvided", create("IfcReinforcingBarType"));
			expectPass("IfcReinforcingMeshType", "BendingShapeCodeProvided", create("IfcReinforcingMeshType"));
		});
		test("pass: BendingParameters given, BendingShapeCode also given", () => {
			const bar = create("IfcReinforcingBarType");
			set(bar, "BendingParameters", "1,2,3");
			set(bar, "BendingShapeCode", "A99");
			expectPass("IfcReinforcingBarType", "BendingShapeCodeProvided", bar);

			const mesh = create("IfcReinforcingMeshType");
			set(mesh, "BendingParameters", "1,2,3");
			set(mesh, "BendingShapeCode", "A99");
			expectPass("IfcReinforcingMeshType", "BendingShapeCodeProvided", mesh);
		});
		test("fail: BendingParameters given but BendingShapeCode missing", () => {
			const bar = create("IfcReinforcingBarType");
			set(bar, "BendingParameters", "1,2,3");
			expectFail("IfcReinforcingBarType", "BendingShapeCodeProvided", bar);

			const mesh = create("IfcReinforcingMeshType");
			set(mesh, "BendingParameters", "1,2,3");
			expectFail("IfcReinforcingMeshType", "BendingShapeCodeProvided", mesh);
		});
	});

	// `valueNotAmongList` call sites (10 occurrences this chunk -- the 9 byte-identical
	// `_NoSelfReference` rules plus this chunk's own new `IfcRelPositions`), exercised via
	// a single data-driven loop, mirroring `ifc4.test.ts`'s own identical convention for
	// its own chunk 5.
	describe("valueNotAmongList call sites (chunk 5)", () => {
		const cases: ReadonlyArray<{
			readonly typeName: string;
			readonly valueAttr: string;
			readonly listAttr: string;
			readonly ruleName: string;
			readonly valueType: string;
			readonly listMemberType: string;
		}> = [
			{
				typeName: "IfcRelAggregates",
				valueAttr: "RelatingObject",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcWall",
				listMemberType: "IfcWall",
			},
			{
				typeName: "IfcRelAssignsToActor",
				valueAttr: "RelatingActor",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcActor",
				listMemberType: "IfcOrganization",
			},
			{
				typeName: "IfcRelAssignsToControl",
				valueAttr: "RelatingControl",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcWorkPlan",
				listMemberType: "IfcTask",
			},
			{
				typeName: "IfcRelAssignsToGroup",
				valueAttr: "RelatingGroup",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcGroup",
				listMemberType: "IfcWall",
			},
			{
				typeName: "IfcRelAssignsToProcess",
				valueAttr: "RelatingProcess",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcTask",
				listMemberType: "IfcWall",
			},
			{
				typeName: "IfcRelAssignsToProduct",
				valueAttr: "RelatingProduct",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcWall",
				listMemberType: "IfcOrganization",
			},
			{
				typeName: "IfcRelAssignsToResource",
				valueAttr: "RelatingResource",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcLaborResource",
				listMemberType: "IfcWall",
			},
			{
				typeName: "IfcRelDeclares",
				valueAttr: "RelatingContext",
				listAttr: "RelatedDefinitions",
				ruleName: "NoSelfReference",
				valueType: "IfcProject",
				listMemberType: "IfcWall",
			},
			{
				typeName: "IfcRelNests",
				valueAttr: "RelatingObject",
				listAttr: "RelatedObjects",
				ruleName: "NoSelfReference",
				valueType: "IfcWall",
				listMemberType: "IfcWall",
			},
			{
				typeName: "IfcRelPositions",
				valueAttr: "RelatingPositioningElement",
				listAttr: "RelatedProducts",
				ruleName: "NoSelfReference",
				valueType: "IfcGrid",
				listMemberType: "IfcWall",
			},
		];

		test("pass: value not among the list", () => {
			// `Name` given distinct values below -- otherwise, since this suite runs with
			// `settings.compareInstancesByValue = true` (matching real rule-execution
			// semantics), two bare, all-attributes-unset instances of the SAME entity type
			// compare EQUAL by value, which would make this "pass" fixture accidentally
			// collide with the rule's own self-reference check.
			for (const { typeName, valueAttr, listAttr, ruleName, valueType, listMemberType } of cases) {
				const rel = create(typeName);
				const value = create(valueType);
				set(value, "Name", "value");
				set(rel, valueAttr, value);
				const listMember = create(listMemberType);
				set(listMember, "Name", "list-member");
				set(rel, listAttr, [listMember]);
				expectPass(typeName, ruleName, rel);
			}
		});
		test("fail: value also appears in the list", () => {
			for (const { typeName, valueAttr, listAttr, ruleName, valueType } of cases) {
				const rel = create(typeName);
				const shared = create(valueType);
				set(rel, valueAttr, shared);
				set(rel, listAttr, [shared]);
				expectFail(typeName, ruleName, rel);
			}
		});
	});

	describe("IfcRelAssociatesMaterial.NoVoidElement", () => {
		function rel(members: EntityInstance[]): EntityInstance {
			const r = create("IfcRelAssociatesMaterial");
			set(r, "RelatedObjects", members);
			return r;
		}
		test("pass: no void/virtual members", () => {
			expectPass("IfcRelAssociatesMaterial", "NoVoidElement", rel([create("IfcWall")]));
		});
		test("fail: a member is an IfcFeatureElementSubtraction", () => {
			expectFail("IfcRelAssociatesMaterial", "NoVoidElement", rel([create("IfcOpeningElement")]));
		});
		test("fail: a member is an IfcVirtualElement", () => {
			expectFail("IfcRelAssociatesMaterial", "NoVoidElement", rel([create("IfcVirtualElement")]));
		});
	});

	// **Genuine schema-evolution finding exercised here** -- see this rule's own doc
	// comment in `whereRules/ifc4x3.ts`: ADD2's own allow-list drops `IfcWindowStyle`/
	// `IfcDoorStyle` (both removed from the schema) relative to IFC4's own 6-member list.
	describe("IfcRelAssociatesMaterial.AllowedElements", () => {
		function rel(members: EntityInstance[]): EntityInstance {
			const r = create("IfcRelAssociatesMaterial");
			set(r, "RelatedObjects", members);
			return r;
		}
		test("pass: every member is an IfcElement/IfcElementType/IfcStructuralMember/IfcPort", () => {
			expectPass("IfcRelAssociatesMaterial", "AllowedElements", rel([create("IfcWall")]));
			expectPass("IfcRelAssociatesMaterial", "AllowedElements", rel([create("IfcWallType")]));
			expectPass("IfcRelAssociatesMaterial", "AllowedElements", rel([create("IfcDistributionPort")]));
		});
		test("fail: a member is none of the 4 allowed kinds", () => {
			expectFail("IfcRelAssociatesMaterial", "AllowedElements", rel([create("IfcActor")]));
		});
	});

	// `attrsDiffer` call sites (4 occurrences this chunk -- the 3 byte-identical rules plus
	// this chunk's own genuinely-renamed `IfcRelInterferesElements`), exercised via a
	// single data-driven loop, mirroring `ifc4.test.ts`'s own identical convention.
	describe("attrsDiffer call sites (chunk 5)", () => {
		const cases: ReadonlyArray<{
			readonly typeName: string;
			readonly attrA: string;
			readonly attrB: string;
			readonly ruleName: string;
			readonly memberType: string;
		}> = [
			{
				typeName: "IfcRelConnectsElements",
				attrA: "RelatingElement",
				attrB: "RelatedElement",
				ruleName: "NoSelfReference",
				memberType: "IfcWall",
			},
			{
				typeName: "IfcRelConnectsPorts",
				attrA: "RelatingPort",
				attrB: "RelatedPort",
				ruleName: "NoSelfReference",
				memberType: "IfcDistributionPort",
			},
			{
				typeName: "IfcRelInterferesElements",
				attrA: "RelatingElement",
				attrB: "RelatedElement",
				ruleName: "NoSelfReference",
				memberType: "IfcWall",
			},
			{
				typeName: "IfcRelSequence",
				attrA: "RelatingProcess",
				attrB: "RelatedProcess",
				ruleName: "AvoidInconsistentSequence",
				memberType: "IfcTask",
			},
		];
		test("pass: the 2 attributes differ", () => {
			// `Name` given distinct values below -- same `compareInstancesByValue`-driven
			// rationale as `valueNotAmongList`'s own identical fixture note above.
			for (const { typeName, attrA, attrB, ruleName, memberType } of cases) {
				const rel = create(typeName);
				const a = create(memberType);
				set(a, "Name", "a");
				const b = create(memberType);
				set(b, "Name", "b");
				set(rel, attrA, a);
				set(rel, attrB, b);
				expectPass(typeName, ruleName, rel);
			}
		});
		test("fail: the 2 attributes are the same instance", () => {
			for (const { typeName, attrA, attrB, ruleName, memberType } of cases) {
				const rel = create(typeName);
				const shared = create(memberType);
				set(rel, attrA, shared);
				set(rel, attrB, shared);
				expectFail(typeName, ruleName, rel);
			}
		});
	});

	describe("IfcRelConnectsPathElements.NormalizedRelatingPriorities / NormalizedRelatedPriorities", () => {
		test("pass: empty lists", () => {
			expectPass("IfcRelConnectsPathElements", "NormalizedRelatingPriorities", create("IfcRelConnectsPathElements"));
			expectPass("IfcRelConnectsPathElements", "NormalizedRelatedPriorities", create("IfcRelConnectsPathElements"));
		});
		test("pass: every value is in [0, 100]", () => {
			const rel = create("IfcRelConnectsPathElements");
			set(rel, "RelatingPriorities", [0, 50, 100]);
			set(rel, "RelatedPriorities", [0, 50, 100]);
			expectPass("IfcRelConnectsPathElements", "NormalizedRelatingPriorities", rel);
			expectPass("IfcRelConnectsPathElements", "NormalizedRelatedPriorities", rel);
		});
		test("fail: a value is out of [0, 100]", () => {
			const relatingBad = create("IfcRelConnectsPathElements");
			set(relatingBad, "RelatingPriorities", [0, 150]);
			expectFail("IfcRelConnectsPathElements", "NormalizedRelatingPriorities", relatingBad);

			const relatedBad = create("IfcRelConnectsPathElements");
			set(relatedBad, "RelatedPriorities", [-1, 50]);
			expectFail("IfcRelConnectsPathElements", "NormalizedRelatedPriorities", relatedBad);
		});
	});

	describe("IfcRelContainedInSpatialStructure.WR31", () => {
		function rel(members: EntityInstance[]): EntityInstance {
			const r = create("IfcRelContainedInSpatialStructure");
			set(r, "RelatedElements", members);
			return r;
		}
		test("pass: no RelatedElements member is an IfcSpatialStructureElement", () => {
			expectPass("IfcRelContainedInSpatialStructure", "WR31", rel([create("IfcWall")]));
		});
		test("fail: a RelatedElements member is an IfcSpatialStructureElement", () => {
			expectFail("IfcRelContainedInSpatialStructure", "WR31", rel([create("IfcSpace")]));
		});
	});

	describe("IfcRelDefinesByProperties.NoRelatedTypeObject", () => {
		function rel(members: EntityInstance[]): EntityInstance {
			const r = create("IfcRelDefinesByProperties");
			set(r, "RelatedObjects", members);
			return r;
		}
		test("pass: no RelatedObjects member is an IfcTypeObject", () => {
			expectPass("IfcRelDefinesByProperties", "NoRelatedTypeObject", rel([create("IfcWall")]));
		});
		test("fail: a RelatedObjects member is an IfcTypeObject", () => {
			expectFail("IfcRelDefinesByProperties", "NoRelatedTypeObject", rel([create("IfcWallType")]));
		});
	});

	describe("IfcRelReferencedInSpatialStructure.AllowedRelatedElements", () => {
		function rel(members: EntityInstance[]): EntityInstance {
			const r = create("IfcRelReferencedInSpatialStructure");
			set(r, "RelatedElements", members);
			return r;
		}
		test("pass: an IfcSpace member (explicitly excepted)", () => {
			expectPass("IfcRelReferencedInSpatialStructure", "AllowedRelatedElements", rel([create("IfcSpace")]));
		});
		test("pass: a non-spatial-structure member", () => {
			expectPass("IfcRelReferencedInSpatialStructure", "AllowedRelatedElements", rel([create("IfcWall")]));
		});
		test("fail: a spatial structure element OTHER than IfcSpace", () => {
			expectFail("IfcRelReferencedInSpatialStructure", "AllowedRelatedElements", rel([create("IfcBuildingStorey")]));
		});
	});

	describe("IfcRelSequence.CorrectSequenceType", () => {
		function rel(sequenceType: string, userDefinedSequenceType: string | null): EntityInstance {
			const r = create("IfcRelSequence");
			set(r, "SequenceType", sequenceType);
			if (userDefinedSequenceType !== null) set(r, "UserDefinedSequenceType", userDefinedSequenceType);
			return r;
		}
		test("pass: SequenceType is not USERDEFINED", () => {
			expectPass("IfcRelSequence", "CorrectSequenceType", rel("NOTDEFINED", null));
		});
		test("pass: SequenceType is USERDEFINED and UserDefinedSequenceType is given", () => {
			expectPass("IfcRelSequence", "CorrectSequenceType", rel("USERDEFINED", "custom"));
		});
		test("fail: SequenceType is USERDEFINED but UserDefinedSequenceType is missing", () => {
			expectFail("IfcRelSequence", "CorrectSequenceType", rel("USERDEFINED", null));
		});
	});

	describe("IfcRelSpaceBoundary.CorrectPhysOrVirt", () => {
		function rel(physicalOrVirtualBoundary: string, relatedBuildingElementType: string): EntityInstance {
			const r = create("IfcRelSpaceBoundary");
			set(r, "PhysicalOrVirtualBoundary", physicalOrVirtualBoundary);
			set(r, "RelatedBuildingElement", create(relatedBuildingElementType));
			return r;
		}
		test("pass: PHYSICAL and a non-virtual element", () => {
			expectPass("IfcRelSpaceBoundary", "CorrectPhysOrVirt", rel("PHYSICAL", "IfcWall"));
		});
		test("fail: PHYSICAL but an IfcVirtualElement", () => {
			expectFail("IfcRelSpaceBoundary", "CorrectPhysOrVirt", rel("PHYSICAL", "IfcVirtualElement"));
		});
		test("pass: VIRTUAL and an IfcVirtualElement", () => {
			expectPass("IfcRelSpaceBoundary", "CorrectPhysOrVirt", rel("VIRTUAL", "IfcVirtualElement"));
		});
		test("pass: VIRTUAL and an IfcOpeningElement", () => {
			expectPass("IfcRelSpaceBoundary", "CorrectPhysOrVirt", rel("VIRTUAL", "IfcOpeningElement"));
		});
		test("fail: VIRTUAL but neither an IfcVirtualElement nor an IfcOpeningElement", () => {
			expectFail("IfcRelSpaceBoundary", "CorrectPhysOrVirt", rel("VIRTUAL", "IfcWall"));
		});
		test("pass: NOTDEFINED (always passes regardless of RelatedBuildingElement)", () => {
			expectPass("IfcRelSpaceBoundary", "CorrectPhysOrVirt", rel("NOTDEFINED", "IfcWall"));
		});
	});

	describe("IfcReparametrisedCompositeCurveSegment.PositiveLengthParameter", () => {
		test("pass/fail", () => {
			const good = create("IfcReparametrisedCompositeCurveSegment");
			set(good, "ParamLength", 1.5);
			expectPass("IfcReparametrisedCompositeCurveSegment", "PositiveLengthParameter", good);

			const bad = create("IfcReparametrisedCompositeCurveSegment");
			set(bad, "ParamLength", 0);
			expectFail("IfcReparametrisedCompositeCurveSegment", "PositiveLengthParameter", bad);
		});
	});

	describe("IfcRepresentationMap.ApplicableMappedRepr", () => {
		test("pass: MappedRepresentation is an IfcShapeModel subtype", () => {
			const map = create("IfcRepresentationMap");
			set(map, "MappedRepresentation", create("IfcShapeRepresentation"));
			expectPass("IfcRepresentationMap", "ApplicableMappedRepr", map);
		});
		test("fail: MappedRepresentation is not an IfcShapeModel", () => {
			const map = create("IfcRepresentationMap");
			set(map, "MappedRepresentation", create("IfcStyledRepresentation"));
			expectFail("IfcRepresentationMap", "ApplicableMappedRepr", map);
		});
	});

	describe("IfcRevolvedAreaSolid", () => {
		function revolvedSolid(locationZ: number, axisDirection?: number[]): EntityInstance {
			const location = point3D([0, 0, locationZ]);
			const axis = create("IfcAxis1Placement");
			set(axis, "Location", location);
			if (axisDirection) set(axis, "Axis", direction3D(axisDirection));
			const solid = create("IfcRevolvedAreaSolid");
			set(solid, "Axis", axis);
			return solid;
		}
		test("AxisStartInXY pass/fail", () => {
			expectPass("IfcRevolvedAreaSolid", "AxisStartInXY", revolvedSolid(0));
			expectFail("IfcRevolvedAreaSolid", "AxisStartInXY", revolvedSolid(5));
		});
		// **Genuine ADD2-only conjunct exercised here** -- see this rule's own doc comment
		// in `whereRules/ifc4x3.ts`: ADD2 additionally requires `Axis.Location` to literally
		// be an `IfcCartesianPoint` (a real consequence of `IfcAxis1Placement.Location`'s
		// own widened SELECT type in ADD2). IFC4's own byte-identical-named rule has no such
		// requirement and would pass here regardless.
		test("AxisStartInXY fail: Location is not literally an IfcCartesianPoint (ADD2-only conjunct)", () => {
			const axis = create("IfcAxis1Placement");
			set(axis, "Location", create("IfcPointByDistanceExpression"));
			const solid = create("IfcRevolvedAreaSolid");
			set(solid, "Axis", axis);
			expectFail("IfcRevolvedAreaSolid", "AxisStartInXY", solid);
		});
		test("AxisDirectionInXY pass/fail", () => {
			// `Axis.Z` is DERIVE (`calc_IfcAxis1Placement_Z`, Phase EX-2): defaults to
			// (0, 0, 1) when `Axis.Axis` is unset, so an unset direction always FAILS this
			// rule (its 3rd component is 1, not 0); an explicit in-XY-plane direction passes.
			expectFail("IfcRevolvedAreaSolid", "AxisDirectionInXY", revolvedSolid(0));
			expectPass("IfcRevolvedAreaSolid", "AxisDirectionInXY", revolvedSolid(0, [1, 0, 0]));
		});
	});

	describe("IfcRevolvedAreaSolidTapered.CorrectProfileAssignment", () => {
		test("pass: both sides are the same kind of IfcParameterizedProfileDef", () => {
			const solid = create("IfcRevolvedAreaSolidTapered");
			const start = create("IfcCircleProfileDef");
			set(start, "ProfileType", "AREA");
			set(start, "Radius", 1);
			const end = create("IfcCircleProfileDef");
			set(end, "ProfileType", "AREA");
			set(end, "Radius", 2);
			set(solid, "SweptArea", start);
			set(solid, "EndSweptArea", end);
			expectPass("IfcRevolvedAreaSolidTapered", "CorrectProfileAssignment", solid);
		});
		test("fail: mismatched, unrelated profile kinds", () => {
			const solid = create("IfcRevolvedAreaSolidTapered");
			const start = create("IfcCircleProfileDef");
			set(start, "ProfileType", "AREA");
			set(start, "Radius", 1);
			const end = create("IfcRectangleProfileDef");
			set(end, "ProfileType", "AREA");
			set(end, "XDim", 1);
			set(end, "YDim", 1);
			set(solid, "SweptArea", start);
			set(solid, "EndSweptArea", end);
			expectFail("IfcRevolvedAreaSolidTapered", "CorrectProfileAssignment", solid);
		});
	});

	// Bespoke, wholly new ADD2 entity -- see this rule's own doc comment in
	// `whereRules/ifc4x3.ts`.
	describe("IfcRigidOperation.SameCoordinateType", () => {
		test("pass: both coordinates are IfcLengthMeasure", () => {
			const op = create("IfcRigidOperation");
			set(op, "FirstCoordinate", create("IfcLengthMeasure"));
			set(op, "SecondCoordinate", create("IfcLengthMeasure"));
			expectPass("IfcRigidOperation", "SameCoordinateType", op);
		});
		test("pass: both coordinates are IfcPlaneAngleMeasure", () => {
			const op = create("IfcRigidOperation");
			set(op, "FirstCoordinate", create("IfcPlaneAngleMeasure"));
			set(op, "SecondCoordinate", create("IfcPlaneAngleMeasure"));
			expectPass("IfcRigidOperation", "SameCoordinateType", op);
		});
		test("fail: mismatched coordinate kinds", () => {
			const op = create("IfcRigidOperation");
			set(op, "FirstCoordinate", create("IfcLengthMeasure"));
			set(op, "SecondCoordinate", create("IfcPlaneAngleMeasure"));
			expectFail("IfcRigidOperation", "SameCoordinateType", op);
		});
	});

	describe("IfcRoundedRectangleProfileDef.ValidRadius", () => {
		function profile(xDim: number, yDim: number, roundingRadius: number): EntityInstance {
			const p = create("IfcRoundedRectangleProfileDef");
			set(p, "XDim", xDim);
			set(p, "YDim", yDim);
			set(p, "RoundingRadius", roundingRadius);
			return p;
		}
		test("pass/fail", () => {
			expectPass("IfcRoundedRectangleProfileDef", "ValidRadius", profile(100, 100, 10));
			expectFail("IfcRoundedRectangleProfileDef", "ValidRadius", profile(100, 100, 60));
		});
		// Regression test mirroring `ifc4.test.ts`'s own identical one for this
		// byte-identical rule (already reusing IFC4's own already-`triDiv`-fixed version --
		// see this file's own header comment): an unset `XDim`/`YDim` must degrade to
		// `INDETERMINATE` (a graceful pass) via `triDiv`, not throw a raw `TypeError:
		// Cannot convert a Symbol value to a number` the way a bare `xDim / 2.0` division
		// would on the `INDETERMINATE` sentinel `expressGetAttr` returns for a genuinely
		// missing attribute.
		test("pass: XDim/YDim unset degrades to INDETERMINATE rather than throwing", () => {
			const noDims = create("IfcRoundedRectangleProfileDef");
			set(noDims, "RoundingRadius", 10);
			expectPass("IfcRoundedRectangleProfileDef", "ValidRadius", noDims);
		});
	});

	describe("IfcSeamCurve.SameSurface", () => {
		test("pass/fail", () => {
			const basisSurface = create("IfcPlane");
			const pc1 = create("IfcPcurve");
			set(pc1, "BasisSurface", basisSurface);
			const pc2 = create("IfcPcurve");
			set(pc2, "BasisSurface", basisSurface);
			const good = create("IfcSeamCurve");
			set(good, "AssociatedGeometry", [pc1, pc2]);
			expectPass("IfcSeamCurve", "SameSurface", good);

			// A genuinely DIFFERENT `IfcPlane` (distinct `Position`) -- an all-attributes-unset
			// second `IfcPlane` would compare EQUAL by value under this suite's own
			// `compareInstancesByValue = true` setting, defeating this "different surface"
			// fixture.
			const otherPlane = create("IfcPlane");
			const otherPosition = create("IfcAxis2Placement3D");
			set(otherPosition, "Location", point3D([5, 5, 5]));
			set(otherPlane, "Position", otherPosition);
			const pc3 = create("IfcPcurve");
			set(pc3, "BasisSurface", otherPlane);
			const bad = create("IfcSeamCurve");
			set(bad, "AssociatedGeometry", [pc1, pc3]);
			expectFail("IfcSeamCurve", "SameSurface", bad);
		});
	});

	describe("executeRules -- end-to-end wiring against the real registered IFC4X3_ADD2 rules", () => {
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

		test("a genuinely-new-in-ADD2 rule violation (IfcBearingType.CorrectPredefinedType) is detected", () => {
			const wiringFile = blankFile();
			const bearingType = wiringFile.createEntity("IfcBearingType");
			(bearingType as unknown as Record<string, unknown>).PredefinedType = "USERDEFINED";

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcBearingType.CorrectPredefinedType"))).toBe(true);
		});

		test("a chunk-2 genuinely-new-in-ADD2 rule violation (IfcCaissonFoundationType.CorrectPredefinedType) is detected", () => {
			const wiringFile = blankFile();
			const caissonType = wiringFile.createEntity("IfcCaissonFoundationType");
			(caissonType as unknown as Record<string, unknown>).PredefinedType = "USERDEFINED";

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcCaissonFoundationType.CorrectPredefinedType"))).toBe(true);
		});

		test("a chunk-2 bespoke-shape rule violation (IfcCoordinateReferenceSystem.NameOrWKT) is detected", () => {
			const wiringFile = blankFile();
			wiringFile.createEntity("IfcCoordinateReferenceSystem");

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcCoordinateReferenceSystem.NameOrWKT"))).toBe(true);
		});

		test("a chunk-3 genuinely-new-in-ADD2 rule violation (IfcDistributionBoardType.CorrectPredefinedType) is detected", () => {
			const wiringFile = blankFile();
			const distributionBoardType = wiringFile.createEntity("IfcDistributionBoardType");
			(distributionBoardType as unknown as Record<string, unknown>).PredefinedType = "USERDEFINED";

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcDistributionBoardType.CorrectPredefinedType"))).toBe(true);
		});

		test("a chunk-3 rule-name-rename violation (IfcDoor.CorrectTypeAssigned, IFC4's own IfcDoor.CorrectStyleAssigned) is detected", () => {
			const wiringFile = blankFile();
			const door = wiringFile.createEntity("IfcDoor");
			const mismatchedType = wiringFile.createEntity("IfcWindowType");
			const rel = wiringFile.createEntity("IfcRelDefinesByType");
			(rel as unknown as Record<string, unknown>).RelatedObjects = [door];
			(rel as unknown as Record<string, unknown>).RelatingType = mismatchedType;

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcDoor.CorrectTypeAssigned"))).toBe(true);
		});

		test("a chunk-4 genuinely-new-in-ADD2 rule violation (IfcKerbType.CorrectPredefinedType) is detected", () => {
			const wiringFile = blankFile();
			const kerbType = wiringFile.createEntity("IfcKerbType");
			(kerbType as unknown as Record<string, unknown>).PredefinedType = "USERDEFINED";

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcKerbType.CorrectPredefinedType"))).toBe(true);
		});

		test("a chunk-4 genuinely-new-rule-on-a-pre-existing-entity violation (IfcMapConversion.TargetCRSOnlyProjected) is detected", () => {
			const wiringFile = blankFile();
			const mapConversion = wiringFile.createEntity("IfcMapConversion");
			(mapConversion as unknown as Record<string, unknown>).TargetCRS =
				wiringFile.createEntity("IfcCoordinateReferenceSystem");

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcMapConversion.TargetCRSOnlyProjected"))).toBe(true);
		});

		test("a chunk-4 removed-rule finding, CONFIRMED (not just hypothesized) by this very test: IfcGrid_HasPlacement no longer exists in ADD2, but IfcGrid is dispatched against IfcPositioningElement.HasPlacement instead -- proving IfcGrid is now a real subtype of the new IfcPositioningElement entity, not merely a coincidental field-layout match", () => {
			const wiringFile = blankFile();
			const grid = wiringFile.createEntity("IfcGrid");
			(grid as unknown as Record<string, unknown>).UAxes = [];
			(grid as unknown as Record<string, unknown>).VAxes = [];

			// No ObjectPlacement given -- no `IfcGrid`-named rule exists any more (confirmed:
			// no violation message contains "IfcGrid_HasPlacement"), but the engine's own
			// real by_type/subtype dispatch still catches this via the NEW supertype rule.
			const violationsWithoutPlacement = executeRules(wiringFile);
			expect(violationsWithoutPlacement.some((v) => v.message.includes("IfcGrid_HasPlacement"))).toBe(false);
			expect(violationsWithoutPlacement.some((v) => v.message.includes("IfcPositioningElement.HasPlacement"))).toBe(
				true,
			);

			// Giving it a real ObjectPlacement clears the violation.
			(grid as unknown as Record<string, unknown>).ObjectPlacement = wiringFile.createEntity("IfcLocalPlacement");
			const violationsWithPlacement = executeRules(wiringFile);
			expect(violationsWithPlacement.some((v) => v.message.includes("IfcPositioningElement.HasPlacement"))).toBe(false);
		});

		test("a chunk-5 genuinely-new-in-ADD2 rule violation (IfcRoadPart.CorrectPredefinedType) is detected", () => {
			const wiringFile = blankFile();
			const roadPart = wiringFile.createEntity("IfcRoadPart");
			(roadPart as unknown as Record<string, unknown>).PredefinedType = "USERDEFINED";

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcRoadPart.CorrectPredefinedType"))).toBe(true);
		});

		test("a chunk-5 rule-name-rename violation (IfcProjectedCRS.MapUnitIsLength, IFC4's own IfcProjectedCRS.IsLengthUnit) is detected under its real ADD2 name", () => {
			const wiringFile = blankFile();
			const crs = wiringFile.createEntity("IfcProjectedCRS");
			const unit = wiringFile.createEntity("IfcSIUnit");
			(unit as unknown as Record<string, unknown>).UnitType = "MASSUNIT";
			(crs as unknown as Record<string, unknown>).MapUnit = unit;

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcProjectedCRS.MapUnitIsLength"))).toBe(true);
			expect(violations.some((v) => v.message.includes("IfcProjectedCRS.IsLengthUnit"))).toBe(false);
		});

		test("a chunk-5 genuine schema-evolution finding (IfcRelAssociatesMaterial.AllowedElements no longer accepts IfcWindowStyle/IfcDoorStyle) is detected", () => {
			const wiringFile = blankFile();
			const rel = wiringFile.createEntity("IfcRelAssociatesMaterial");
			// Neither `IfcWindowStyle` nor `IfcDoorStyle` exist in ADD2's own schema any more
			// (see this rule's own doc comment in `whereRules/ifc4x3.ts`) -- an ordinary
			// `IfcActor`, none of the 4 real ADD2 allowed kinds, demonstrates the same
			// "disallowed member" pass/fail shape the removed types used to hit too.
			(rel as unknown as Record<string, unknown>).RelatedObjects = [wiringFile.createEntity("IfcActor")];

			const violations = executeRules(wiringFile);
			expect(violations.some((v) => v.message.includes("IfcRelAssociatesMaterial.AllowedElements"))).toBe(true);
		});

		test("a well-formed instance produces zero violations from any of the 580 registered rules", () => {
			const wiringFile = blankFile();
			const approval = wiringFile.createEntity("IfcApproval");
			(approval as unknown as Record<string, unknown>).Name = "A well-formed approval";

			const violations = executeRules(wiringFile);
			expect(violations).toEqual([]);
		});
	});
});
