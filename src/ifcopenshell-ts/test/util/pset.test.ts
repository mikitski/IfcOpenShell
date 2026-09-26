// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_pset.py` (src/ifcopenshell-python) -- ports
// `TestPsetQto`, `TestParseApplicableEntity`, `TestConvertApplicableEntitiesToQuery` in
// full, plus original coverage for `getPsetTemplateType` (no dedicated Python test file
// exists for that function -- confirmed by reading the whole of `test_pset.py`, which has
// none -- so this is genuinely new coverage, not a port) and for `get_template`/
// `getTemplate`'s schema-fallback caching behavior (likewise no direct Python test).
//
// `TestPsetQto` constructs a real `PsetQto("IFC4")`, which parses the bundled
// `Pset_IFC4_ADD2.ifc` STEP template file via the native addon (see `util/pset.ts`'s own
// header comment for why this needs no new native primitive) -- this genuinely needs the
// real, CI-built native addon, unlike `util/type.test.ts`'s pure-JSON-lookup tests. Gated
// with this project's standard `AVAILABLE_SCHEMAS.includes("IFC4")` skip-guard (never a
// hard-coded schema-version string literal per this project's own rule) -- always true in
// CI's `SCHEMA_VERSIONS=4` core build, so this suite always runs there.
//
// *** Local-verification note (disclosed, not new -- the same recurring, pre-existing
// sandbox limitation nearly every prior Phase 1-3 chunk's own PR has already documented):
// *** this chunk's own development sandbox has no `cmake`/C++ toolchain and no network
// access to fetch one (`brew install cmake` fails on pre-existing root-owned Homebrew
// directories requiring `sudo`, which this sandbox's permission policy blocks; `pip
// install cmake`/an npm `cmake` package both fail -- no working PyPI/generic-binary
// network route, only npm's own registry is reachable), so the native addon could not be
// built and this suite could not be executed locally. Verified instead by: (1) `tsc
// --noEmit` passing clean against the whole package; (2) careful manual cross-checking of
// this suite's own key assertion (`get_applicable_names("IfcMaterial")` == 9) directly
// against `data/pset-templates/Pset_IFC4_ADD2.ifc`'s real STEP text (grepped every
// `IFCPROPERTYSETTEMPLATE` whose `ApplicableEntity` mentions `IfcMaterial`: 14 total, 5
// carry a `/PredefinedType` suffix -- `Concrete`/`Steel`/`Wood` (x3) -- leaving exactly 9
// with no predefined-type qualifier, matching this test's own expected count and
// confirming `is_applicable`'s predefined-type-filtering branch is ported correctly, the
// most novel piece of this module's logic); (3) reasoning through the remaining ported
// logic (`is_a`/`getApplicableTypes`/`by_type`/attribute reads), all of which are
// already-tested, already-shipped primitives/functions this chunk only orchestrates, not
// new native surface. Real, full-addon verification is deferred to CI, which does have a
// working `cmake` build per `ci-ifcopenshell-ts.yml`.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import * as pset from "../../src/util/pset";
import { AVAILABLE_SCHEMAS } from "../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.pset PsetQto", () => {
	const psetQto = new pset.PsetQto("IFC4");

	test("get_applicable returns the same count as Python on repeated calls (cache exercised)", () => {
		for (let i = 0; i < 25; i++) {
			expect(psetQto.getApplicable("IfcMaterial")).toHaveLength(9);
		}
	});

	test("get_applicable_names returns the same count as Python on repeated calls (cache exercised)", () => {
		for (let i = 0; i < 25; i++) {
			expect(psetQto.getApplicableNames("IfcMaterial")).toHaveLength(9);
		}
	});

	test("getting applicables for a specific predefined type", () => {
		let names = psetQto.getApplicableNames("IfcAudioVisualAppliance");
		expect(names).toHaveLength(12);
		expect(names).not.toContain("Pset_AudioVisualApplianceTypeAmplifier");

		names = psetQto.getApplicableNames("IfcAudioVisualAppliance", "AMPLIFIER");
		expect(names).toContain("Pset_AudioVisualApplianceTypeAmplifier");
		expect(names).toHaveLength(13);
	});

	test("getting a pset of a type where the type class is not explicitly applicable (IFC4 QTO backport, bug 3583)", () => {
		let names = psetQto.getApplicableNames("IfcWall");
		expect(names).toContain("Pset_WallCommon");

		names = psetQto.getApplicableNames("IfcWallType");
		expect(names).toHaveLength(12);
		expect(names).toContain("Pset_WallCommon");
		// Backported fix for IFC4: `PsetQto`'s constructor rewrites
		// `QTO_OCCURRENCEDRIVEN` -> `QTO_TYPEDRIVENOVERRIDE` on `Qto_WallBaseQuantities`
		// so it becomes applicable to `IfcWallType` (a type class) too, matching
		// IFC4X3's own behavior.
		expect(names).toContain("Qto_WallBaseQuantities");
	});

	test("getting applicable names by predefined type", () => {
		let names = psetQto.getApplicableNames("IfcFurniture");
		expect(names).not.toContain("Pset_FurnitureTypeTable");

		names = psetQto.getApplicableNames("IfcFurniture", "TABLE");
		expect(names).toContain("Pset_FurnitureTypeTable");

		names = psetQto.getApplicableNames("IfcFurnitureType", "TABLE");
		expect(names).toContain("Pset_FurnitureTypeTable");

		names = psetQto.getApplicableNames("IfcFurnitureType");
		const names2 = psetQto.getApplicableNames("IfcFurnitureType", "CUSTOM");
		expect(names2).toEqual(names);
	});

	test("getting applicables for a material category (case-insensitive predefined type)", () => {
		let names = psetQto.getApplicableNames("IfcMaterial");
		expect(names).not.toContain("Pset_MaterialConcrete");

		names = psetQto.getApplicableNames("IfcMaterial", "concrete");
		expect(names).toContain("Pset_MaterialConcrete");
	});

	test("get_by_name / is_templated", () => {
		const found = psetQto.getByName("Pset_WallCommon");
		expect(found).not.toBeNull();
		expect((found as EntityInstance).get("Name")).toBe("Pset_WallCommon");

		expect(psetQto.isTemplated("Pset_WallCommon")).toBe(true);
		expect(psetQto.isTemplated("Pset_DoesNotExist")).toBe(false);
		expect(psetQto.getByName("Pset_DoesNotExist")).toBeNull();
	});

	test("get_applicable throws for an unknown ifc_class, matching Python's own declaration_by_name error", () => {
		expect(() => psetQto.getApplicable("NotARealIfcClass")).toThrow();
	});

	test("get_applicable throws for a class name that exists but is not an entity (a defined type), matching Python's own assert entity", () => {
		// "IfcLabel" is a real IFC4 declaration, but a defined type, not an entity --
		// `declaration_by_name_with_name("IfcLabel").as_entity()` resolves to `null`,
		// exercising the second, distinct error branch (as opposed to the "class doesn't
		// exist at all" branch covered by the test above).
		expect(() => psetQto.getApplicable("IfcLabel")).toThrow();
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.pset getTemplate", () => {
	test("caches one PsetQto per fallback schema", () => {
		const a = pset.getTemplate("IFC4");
		const b = pset.getTemplate("IFC4");
		expect(a).toBe(b);

		// A non-canonical identifier (e.g. what `file.schemaIdentifier` reports for a
		// real IFC4 ADD2 TC1 file) falls back to the same cached "IFC4" instance, via
		// `getFallbackSchema`.
		const c = pset.getTemplate("IFC4X1_ADD2_TC1");
		expect(c).toBe(a);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.pset getPsetTemplateType", () => {
	test("PSET-prefixed TemplateType", () => {
		const psetQto = pset.getTemplate("IFC4");
		const template = psetQto.getByName("Pset_WallCommon");
		expect(template).not.toBeNull();
		expect(pset.getPsetTemplateType(template as EntityInstance)).toBe("PSET");
	});

	test("QTO-prefixed TemplateType", () => {
		const psetQto = pset.getTemplate("IFC4");
		const template = psetQto.getByName("Qto_WallBaseQuantities");
		expect(template).not.toBeNull();
		expect(pset.getPsetTemplateType(template as EntityInstance)).toBe("QTO");
	});
});

describe("util.pset parseApplicableEntity", () => {
	test("a single entity", () => {
		expect(pset.parseApplicableEntity("IfcBoilerType")).toEqual([
			{ value: "IfcBoilerType", ifcClass: "IfcBoilerType", predefinedType: null, performanceHistory: false },
		]);
	});

	test("two entities", () => {
		expect(pset.parseApplicableEntity("IfcBoilerType,IfcWallType")).toEqual([
			{ value: "IfcBoilerType", ifcClass: "IfcBoilerType", predefinedType: null, performanceHistory: false },
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		]);
	});

	test("two entities with performance history", () => {
		expect(pset.parseApplicableEntity("IfcBoilerType[PerformanceHistory],IfcWallType")).toEqual([
			{
				value: "IfcBoilerType[PerformanceHistory]",
				ifcClass: "IfcBoilerType",
				predefinedType: null,
				performanceHistory: true,
			},
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		]);
	});

	test("two entities with predefined type", () => {
		expect(pset.parseApplicableEntity("IfcBoilerType/STEAM,IfcWallType")).toEqual([
			{ value: "IfcBoilerType/STEAM", ifcClass: "IfcBoilerType", predefinedType: "STEAM", performanceHistory: false },
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		]);
	});

	test("two entities with predefined type and performance history", () => {
		expect(pset.parseApplicableEntity("IfcBoilerType[PerformanceHistory]/STEAM,IfcWallType")).toEqual([
			{
				value: "IfcBoilerType[PerformanceHistory]/STEAM",
				ifcClass: "IfcBoilerType",
				predefinedType: "STEAM",
				performanceHistory: true,
			},
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		]);
	});
});

describe("util.pset convertApplicableEntitiesToQuery", () => {
	test("a single entity", () => {
		const entities: pset.ApplicableEntity[] = [
			{ value: "IfcBoilerType", ifcClass: "IfcBoilerType", predefinedType: null, performanceHistory: false },
		];
		expect(pset.convertApplicableEntitiesToQuery(entities)).toBe("IfcBoilerType");
	});

	test("two entities", () => {
		const entities: pset.ApplicableEntity[] = [
			{ value: "IfcBoilerType", ifcClass: "IfcBoilerType", predefinedType: null, performanceHistory: false },
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		];
		expect(pset.convertApplicableEntitiesToQuery(entities)).toBe("IfcBoilerType + IfcWallType");
	});

	test("two entities with performance history (no query effect)", () => {
		const entities: pset.ApplicableEntity[] = [
			{
				value: "IfcBoilerType[PerformanceHistory]",
				ifcClass: "IfcBoilerType",
				predefinedType: null,
				performanceHistory: true,
			},
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		];
		expect(pset.convertApplicableEntitiesToQuery(entities)).toBe("IfcBoilerType + IfcWallType");
	});

	test("two entities with predefined type", () => {
		const entities: pset.ApplicableEntity[] = [
			{ value: "IfcBoilerType/STEAM", ifcClass: "IfcBoilerType", predefinedType: "STEAM", performanceHistory: false },
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		];
		expect(pset.convertApplicableEntitiesToQuery(entities)).toBe('IfcBoilerType, PredefinedType="STEAM" + IfcWallType');
	});

	test("two entities with predefined type and performance history", () => {
		const entities: pset.ApplicableEntity[] = [
			{
				value: "IfcBoilerType[PerformanceHistory]/STEAM",
				ifcClass: "IfcBoilerType",
				predefinedType: "STEAM",
				performanceHistory: true,
			},
			{ value: "IfcWallType", ifcClass: "IfcWallType", predefinedType: null, performanceHistory: false },
		];
		expect(pset.convertApplicableEntitiesToQuery(entities)).toBe('IfcBoilerType, PredefinedType="STEAM" + IfcWallType');
	});
});
