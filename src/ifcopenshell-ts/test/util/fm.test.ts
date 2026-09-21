// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `fm.py` (confirmed: `src/ifcopenshell-python/
// test/util/` has no `test_fm.py`) -- original coverage written directly against
// `fm.py`'s own source and `util/fm.ts`'s own port (see that file's own header comment
// for the full disclosed `getFmhemClasses`/`getEnumItems` primitive-layer-gap finding
// this pins with a dedicated regression test, and the `directSubtypesOf`/
// `entity::subtypes()` workaround it reuses from `util/schema.ts`).
//
// `getCobieTypes`/`getCobieComponents`/`getFmhemTypes` are schema-generic (gated via
// `AVAILABLE_SCHEMAS`, never a hardcoded schema list, per this chunk's own task
// brief); `getFmhemClasses` is tested for `"IFC4"` unconditionally (always available,
// matching `test/util/type.test.ts`'s/`test/util/doc.test.ts`'s own established
// "IFC4 is always available" precedent) and for `"IFC2X3"` gated behind
// `AVAILABLE_SCHEMAS.includes("IFC2X3")`, since it needs a real `schema_definition`
// registered in the built addon (`util/schema.ts`'s own `getSchemaDefinition`), not
// just JSON-lookup data.

import { describe, expect, test } from "vitest";
import * as subject from "../../src/util/fm";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("util.fm getCobieTypes / getCobieComponents (%s)", (schemaName) => {
	test("getCobieTypes finds only the schema-valid classes from cobieTypeClasses, silently skipping the rest", () => {
		const file = createTestFile(schemaName);
		// `IfcDoorType` (IFC4-only) and `IfcDoorStyle` (IFC2X3-only) are BOTH in the
		// real Python `cobie_type_classes` list -- only one is ever valid for a given
		// schema (see `fm.ts`'s own header comment on this list).
		const doorTypeClass = schemaName === "IFC2X3" ? "IfcDoorStyle" : "IfcDoorType";
		const door = file.createEntity(doorTypeClass);
		const notCobie = file.createEntity("IfcWallType");

		const types = subject.getCobieTypes(file);
		expect(types.some((e) => e.equals(door))).toBe(true);
		expect(types.some((e) => e.equals(notCobie))).toBe(false);
	});

	test("getCobieComponents finds only the schema-valid classes from cobieComponentClasses", () => {
		const file = createTestFile(schemaName);
		const door = file.createEntity("IfcDoor");
		const notCobie = file.createEntity("IfcWall");

		const components = subject.getCobieComponents(file);
		expect(components.some((e) => e.equals(door))).toBe(true);
		expect(components.some((e) => e.equals(notCobie))).toBe(false);
	});

	test("neither function throws when a listed class doesn't exist in the file's own schema", () => {
		const file = createTestFile(schemaName);
		expect(() => subject.getCobieTypes(file)).not.toThrow();
		expect(() => subject.getCobieComponents(file)).not.toThrow();
	});
});

describe.each(AVAILABLE_SCHEMAS)("util.fm getFmhemTypes (%s)", (schemaName) => {
	test("finds schema-appropriate FMHEM classes, gated on ifcFile.schema (not a per-class try/catch)", () => {
		const file = createTestFile(schemaName);
		const doorTypeClass = schemaName === "IFC2X3" ? "IfcDoorStyle" : "IfcDoorType";
		const door = file.createEntity(doorTypeClass);

		const types = subject.getFmhemTypes(file);
		expect(types.some((e) => e.equals(door))).toBe(true);
	});

	test("excludes elements whose OWN concrete class is in fmhemExcludedClasses, even though by_type includes subtypes", () => {
		const file = createTestFile(schemaName);
		// `IfcBurnerType`/`IfcBoilerType` are both real subtypes of
		// `IfcEnergyConversionDeviceType` (confirmed empirically against this chunk's
		// own built addon: `IfcBurnerType.isA("IfcEnergyConversionDeviceType") ===
		// true`) -- `IfcEnergyConversionDeviceType` is itself in both
		// `fmhemClassesIfc4`/`fmhemClassesIfc2x3`, so `by_type` (which includes
		// subtypes) would return BOTH, but `IfcBurnerType` is one of the 4 names in
		// `fmhemExcludedClasses` and `IfcBoilerType` isn't.
		//
		// `IfcBurnerType` itself doesn't exist on IFC2X3 at all (confirmed against
		// `ifc2x3.d.ts` -- absent entirely, a genuine IFC4+ addition), so IFC2X3 uses
		// `IfcCoilType` instead -- another `fmhemExcludedClasses` entry, confirmed
		// empirically (against this same locally-built multi-schema addon) to be a
		// real IFC2X3 `IfcEnergyConversionDeviceType` subtype too, exercising the
		// identical exclusion behavior this test targets.
		const excludedClass = schemaName === "IFC2X3" ? "IfcCoilType" : "IfcBurnerType";
		const excluded = file.createEntity(excludedClass);
		const boiler = file.createEntity("IfcBoilerType");

		const types = subject.getFmhemTypes(file);
		expect(types.some((e) => e.equals(excluded))).toBe(false);
		expect(types.some((e) => e.equals(boiler))).toBe(true);
	});
});

describe("util.fm getFmhemClasses", () => {
	test("throws for IFC4 (default) -- pre-existing getEnumItems primitive-layer gap, see fm.ts's own header comment", () => {
		expect(() => subject.getFmhemClasses()).toThrow(/enumeration_items/);
		expect(() => subject.getFmhemClasses("IFC4")).toThrow(/enumeration_items/);
	});

	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
		"throws for IFC2X3 too -- but via a DIFFERENT, earlier error than IFC4's getEnumItems gap",
		() => {
			// See `fm.ts`'s own header comment for the full trace: `fmhemClassesIfc2x3`'s
			// first 2 entries, `IfcDoorStyle`/`IfcWindowStyle`, have NO `PredefinedType`
			// attribute at all on IFC2X3 (confirmed against `ifc2x3.d.ts` -- they only have
			// `OperationType`/`ConstructionType` there), so `getFmhemClass` never reaches
			// the `getEnumItems` call for them; the loop moves on to the list's 3rd entry,
			// `IfcShadingDeviceType`, which doesn't exist on IFC2X3 AT ALL (confirmed absent
			// from `ifc2x3.d.ts` entirely -- a real, pre-existing Python bug too:
			// `fmhem_classes_ifc2x3` includes it verbatim even though it doesn't exist on
			// IFC2X3). `declaration_by_name_with_name("IfcShadingDeviceType")` throws first,
			// before `getEnumItems` is ever reached -- verified empirically against BOTH
			// this port's own locally-built multi-schema native addon AND a real installed
			// `ifcopenshell` Python package (`ifcopenshell.util.fm.get_fmhem_classes
			// ("IFC2X3")` raises the identical `RuntimeError: Entity with name
			// 'IfcShadingDeviceType' not found in schema 'IFC2X3'`), confirming this port's
			// behavior matches real Python's own exactly, including WHICH error fires
			// first.
			expect(() => subject.getFmhemClasses("IFC2X3")).toThrow(
				/Entity with name 'IfcShadingDeviceType' not found in schema 'IFC2X3'/,
			);
		},
	);
});
