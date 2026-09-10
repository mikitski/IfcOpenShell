// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_type.py` (src/ifcopenshell-python) -- a direct port
// of all four test classes (`TestGetApplicableTypes`, `TestGetApplicableTypesIFC2X3`,
// `TestGetApplicableEntities`, `TestGetApplicableEntitiesIFC2X3`).
//
// Unlike most other `util` test files in this port, these tests need NO native
// `IfcFile`/`EntityInstance` at all -- `getApplicableTypes`/`getApplicableEntities` are
// pure lookups against the module's own bundled JSON data
// (`data/type-map/entity_to_type_map_*.json`), entirely independent of what schemas the
// built C++ core/native addon actually has registered. Passing `schema: "IFC2X3"` here
// therefore does NOT need this project's `AVAILABLE_SCHEMAS` skip-guard (that guard
// exists specifically because CI's `SCHEMA_VERSIONS=4` build leaves the native addon
// without IFC2X3/IFC4X3 registered -- irrelevant here, since no native file is ever
// opened) -- disclosed here rather than silently deviating from this project's usual
// schema-parameterized-test convention without explanation.

import { describe, expect, test } from "vitest";
import * as subject from "../../src/util/type";

describe("util.type getApplicableTypes", () => {
	test("IFC4 (default schema)", () => {
		expect(subject.getApplicableTypes("IfcWall")).toEqual(["IfcWallType"]);
		expect(subject.getApplicableTypes("IfcWallStandardCase")).toEqual(["IfcWallType"]);
		expect(subject.getApplicableTypes("IfcFlowSegment")).toEqual(["IfcDistributionElementType"]);
		expect(subject.getApplicableTypes("IfcDuctSegment")).toEqual(["IfcDuctSegmentType"]);
		expect(subject.getApplicableTypes("IfcTask")).toEqual([]);
	});

	test("IFC2X3", () => {
		expect(subject.getApplicableTypes("IfcWall", "IFC2X3")).toEqual(["IfcWallType"]);
		expect(subject.getApplicableTypes("IfcWallStandardCase", "IFC2X3")).toEqual(["IfcWallType"]);
		expect(subject.getApplicableTypes("IfcBuildingElementProxy", "IFC2X3")).toEqual(["IfcBuildingElementProxyType"]);
	});
});

describe("util.type getApplicableEntities", () => {
	test("IFC4 (default schema)", () => {
		expect(new Set(subject.getApplicableEntities("IfcWallType"))).toEqual(
			new Set(["IfcWall", "IfcWallElementedCase", "IfcWallStandardCase"]),
		);
	});

	test("IFC2X3", () => {
		expect(new Set(subject.getApplicableEntities("IfcWallType", "IFC2X3"))).toEqual(
			new Set(["IfcWall", "IfcWallStandardCase"]),
		);
		expect(subject.getApplicableEntities("IfcBuildingElementProxyType", "IFC2X3")).toEqual(["IfcBuildingElementProxy"]);
	});
});

describe("util.type IFC2X3's IfcBuildingElementProxyType prioritisation and 'guessed element' narrowing", () => {
	test("IfcBuildingElementProxyType is sorted first whenever it's one of the applicable types", () => {
		// IfcRoof has no dedicated type class in IFC2X3, so it falls back to a list of
		// generic occurrence types with IfcBuildingElementProxyType prioritised first
		// (this file's own header comment / `type.ts`'s own header comment for the
		// verbatim-ported Python quirk this exercises).
		const types = subject.getApplicableTypes("IfcRoof", "IFC2X3");
		expect(types.length).toBeGreaterThan(0);
		expect(types[0]).toBe("IfcBuildingElementProxyType");
	});

	test("guessed-element narrowing: IfcBuildingElementProxyType's applicable entities are narrowed to just the proxy class itself, not every class that also has it as a fallback type", () => {
		// Documented directly in `type.py`'s own module-level comment (reproduced
		// verbatim in `type.ts`'s header): `get_applicable_types(IfcRoof)` includes
		// IfcBuildingElementProxyType, but `get_applicable_entities
		// (IfcBuildingElementProxyType)` does NOT include IfcRoof back -- confirmed
		// above by the "IFC2X3" test case already, restated here as its own dedicated,
		// explicit regression test for this specific asymmetry.
		const entities = subject.getApplicableEntities("IfcBuildingElementProxyType", "IFC2X3");
		expect(entities).toEqual(["IfcBuildingElementProxy"]);
		expect(entities).not.toContain("IfcRoof");
	});
});
