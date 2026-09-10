// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_schema.py`'s `TestMigrator`/
// `TestExtendedMaterialProperties` classes (src/ifcopenshell-python), covering
// `util/migrator.ts` -- the `class Migrator` port `util/schema.ts` chunk 1
// deliberately excluded (see that file's own header comment) and this chunk ports in
// full (see `util/migrator.ts`'s own header comment for scope and disclosed findings).
//
// *** CI schema-availability note (this matters a lot for this file specifically) ***:
// `Migrator`'s entire purpose is cross-schema migration, so almost every realistic
// scenario needs two schema versions loaded at once. `ci-ifcopenshell-ts.yml`'s
// current core build is `SCHEMA_VERSIONS=4` (IFC4-only, `test/bootstrap.ts`'s own
// header comment) -- every cross-schema test below is therefore guarded by
// `describe.skipIf(!AVAILABLE_SCHEMAS.includes(...))` (the established project
// pattern, never a hard-coded schema-version string literal) and will be SKIPPED, not
// run, in that CI build. Verified passing locally against a real, manually-built
// three-schema addon (IFC4 + IFC2X3 + IFC4X3, all three statically linked and
// force-registered -- this chunk's own local build, see the final report for how) --
// every cross-schema test in this file passed against that real build, not just
// type-checked. The "same-schema graph walk" `describe` block below keeps this file
// from being *entirely* CI-skipped, though: recursive entity/list migration +
// `migratedIds` caching, an undo/redo regression, and the disclosed-primitive-gap
// test all run IFC4 -> IFC4 -- `Migrator`'s core graph-walk doesn't actually require
// two *different* schemas, only `migrateAttribute`'s four cross-schema-name-mapping
// branches do -- so these run unconditionally (still `describe.skipIf`-guarded on
// plain `AVAILABLE_SCHEMAS.includes("IFC4")`, per this project's "never hard-code a
// schema-version string literal" rule, but that's always true in practice).
//
// Python has no dedicated test for `preprocess`'s `IfcPresentationStyleAssignment`
// (IFC4 -> IFC4X3) handling either (confirmed by reading the whole of
// `test_schema.py`) -- not ported here for the same reason chunk 1's own test file
// didn't invent coverage Python itself doesn't have; `preprocess`'s `IfcCalendarDate`
// (IFC2X3 -> IFC4) handling IS covered below as original coverage (Python's own
// `Migrate` ifcpatch recipe exercises it, but `test_schema.py` itself has no direct
// unit test for `preprocess`), verified against a real repro (not assumed) that
// `IfcFile.remove` nulls out inverse references (confirmed empirically -- see the
// test's own comment).

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import { IfcFile } from "../../src/file";
import { native } from "../../src/native/native_loader";
import { Migrator } from "../../src/util/migrator";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

function parseIfc(text: string): IfcFile {
	const buffer = Buffer.from(text, "utf-8");
	const handle = native.file_new_with_data_data_size(buffer, buffer.length);
	return new IfcFile(handle);
}

function exists(file: IfcFile, id: number): boolean {
	try {
		file.byId(id);
		return true;
	} catch {
		return false;
	}
}

// --- attribute-mapping migration (direct port of test_schema.py's TestMigrator) ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4") || !AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"util.migrator Migrator.migrate -- IFC4 <-> IFC4X3 attribute mapping",
	() => {
		test("IFC4 -> IFC4X3: IfcWorkTime.Start/Finish -> StartDate/FinishDate", () => {
			const ifc4File = createTestFile("IFC4");
			const original = ifc4File.createEntity("IfcWorkTime");
			original.as<{ Start: string; Finish: string }>().Start = "2024-01-01";
			original.as<{ Start: string; Finish: string }>().Finish = "2024-01-01";
			const ifc4x3File = createTestFile("IFC4X3");

			const migrator = new Migrator();
			const newElement = migrator.migrate(original, ifc4x3File);

			expect(newElement.get("StartDate")).toBe("2024-01-01");
			expect(newElement.get("FinishDate")).toBe("2024-01-01");
			ifc4File.dispose();
			ifc4x3File.dispose();
		});

		test("IFC4X3 -> IFC4: IfcWorkTime.StartDate/FinishDate -> Start/Finish", () => {
			const ifc4x3File = createTestFile("IFC4X3");
			const original = ifc4x3File.createEntity("IfcWorkTime");
			original.set("StartDate", "2024-01-01");
			original.set("FinishDate", "2024-01-01");
			const ifc4File = createTestFile("IFC4");

			const migrator = new Migrator();
			const newElement = migrator.migrate(original, ifc4File);

			expect(newElement.get("Start")).toBe("2024-01-01");
			expect(newElement.get("Finish")).toBe("2024-01-01");
			ifc4x3File.dispose();
			ifc4File.dispose();
		});
	},
);

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3") || !AVAILABLE_SCHEMAS.includes("IFC4"))(
	"util.migrator Migrator.migrate -- IFC2X3 <-> IFC4 attribute mapping",
	() => {
		test("IFC2X3 -> IFC4: IfcImageTexture.TextureType -> Mode", () => {
			const ifc2x3File = createTestFile("IFC2X3");
			const original = ifc2x3File.createEntity("IfcImageTexture", true, true);
			original.set("TextureType", "SPECULAR");
			const ifc4File = createTestFile("IFC4");

			const migrator = new Migrator();
			const newElement = migrator.migrate(original, ifc4File);

			expect(newElement.get("Mode")).toBe("SPECULAR");
			ifc2x3File.dispose();
			ifc4File.dispose();
		});

		test("IFC4 -> IFC2X3: IfcImageTexture.Mode -> TextureType", () => {
			const ifc4File = createTestFile("IFC4");
			const original = ifc4File.createEntity("IfcImageTexture", true, true);
			original.set("Mode", "SPECULAR");
			const ifc2x3File = createTestFile("IFC2X3");

			const migrator = new Migrator();
			const newElement = migrator.migrate(original, ifc2x3File);

			expect(newElement.get("TextureType")).toBe("SPECULAR");
			ifc4File.dispose();
			ifc2x3File.dispose();
		});

		test("class-equivalence table + recursive migration: IfcExtendedMaterialProperties -> IfcMaterialProperties", () => {
			// Direct port of test_schema.py's TestExtendedMaterialProperties.
			const ifc2x3File = createTestFile("IFC2X3");
			const material = ifc2x3File.createEntity("IfcMaterial", "Material");
			const prop = ifc2x3File.createEntity("IfcPropertySingleValue", "Foo");
			const original = ifc2x3File.createEntity("IfcExtendedMaterialProperties", material, [prop]);
			const ifc4File = createTestFile("IFC4");

			const migrator = new Migrator();
			const newElement = migrator.migrate(original, ifc4File);

			expect(newElement.isA()).toBe("IfcMaterialProperties");
			const info = newElement.getInfo() as { Material: EntityInstance; Properties: EntityInstance[] };
			expect(info.Material.isA()).toBe("IfcMaterial");
			expect(info.Material.get("Name")).toBe("Material");
			expect(info.Properties[0].isA()).toBe("IfcPropertySingleValue");
			expect(info.Properties[0].get("Name")).toBe("Foo");
			ifc2x3File.dispose();
			ifc4File.dispose();
		});

		test("migrateClass throws a clear, class-naming error for an IFC4-only non-element class with no IFC2X3 equivalent", () => {
			const ifc4File = createTestFile("IFC4");
			const pointList = ifc4File.createEntity("IfcCartesianPointList2D", [
				[0.0, 0.0],
				[1.0, 0.0],
			]);
			const ifc2x3File = createTestFile("IFC2X3");

			const migrator = new Migrator();
			expect(() => migrator.migrate(pointList, ifc2x3File)).toThrow(/IfcCartesianPointList2D/);
			expect(() => migrator.migrate(pointList, ifc2x3File)).toThrow(/IFC2X3/);
			ifc4File.dispose();
			ifc2x3File.dispose();
		});

		test("fallbackElementToProxy: default strict Migrator throws; opt-in falls back to IfcBuildingElementProxy", () => {
			const ifc4File = createTestFile("IFC4");
			const lamp = ifc4File.createEntity("IfcLamp");
			lamp.set("GlobalId", "2K6Z3DR8X37AS9XFvX8GcW");

			const strictTarget = createTestFile("IFC2X3");
			expect(() => new Migrator().migrate(lamp, strictTarget)).toThrow(/IfcLamp/);

			const optInTarget = createTestFile("IFC2X3");
			const newLamp = new Migrator({ fallbackElementToProxy: true }).migrate(lamp, optInTarget);
			expect(newLamp.isA()).toBe("IfcBuildingElementProxy");

			ifc4File.dispose();
			strictTarget.dispose();
			optInTarget.dispose();
		});

		test("preprocess: IfcCalendarDate is removed and its formatted value survives onto the migrated referencing entity via attributeOverrides", () => {
			// IfcClassification.EditionDate is IfcCalendarDate-typed in IFC2X3, a plain
			// string-based IfcDate in IFC4 -- exercises `preprocess`'s
			// `attribute_overrides` mechanism precisely (real, empirically-verified
			// behavior, not assumed: `IfcFile.remove` nulls out the inverse reference,
			// so the *normal* per-attribute migration loop -- which does find a direct
			// "EditionDate" name match on both schemas -- ends up reading `null` off
			// the now-cleared source attribute and therefore never overwrites the
			// override `migrateAttributes` already wrote via `setByIndex`, since
			// `migrateAttribute`'s final `if (value !== null)` guard skips the
			// `.set()` call entirely for a null value).
			const oldFile = parseIfc(
				"ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION((''),'2;1');\n" +
					"FILE_NAME('','',(''),(''),'','','');\nFILE_SCHEMA(('IFC2X3'));\nENDSEC;\nDATA;\n" +
					"#1=IFCCALENDARDATE(15,6,2020);\n" +
					"#2=IFCCLASSIFICATION('Src','Ed1',#1,'MyClassification');\n" +
					"ENDSEC;\nEND-ISO-10303-21;\n",
			);
			const newFile = createTestFile("IFC4");

			const migrator = new Migrator();
			migrator.preprocess(oldFile, newFile);

			expect(exists(oldFile, 1)).toBe(false); // IfcCalendarDate removed
			expect(oldFile.byId(2).isA()).toBe("IfcClassification"); // referencing entity untouched otherwise

			const newElement = migrator.migrate(oldFile.byId(2), newFile);
			expect(newElement.isA()).toBe("IfcClassification");
			expect(newElement.get("EditionDate")).toBe("2020-6-15"); // YYYY-M-D, Python's own f"{Year}-{Month}-{Day}"
			expect(newElement.get("Source")).toBe("Src");
			expect(newElement.get("Name")).toBe("MyClassification");

			oldFile.dispose();
			newFile.dispose();
		});

		test("preprocess: assign_header_from (spf_header.assign) does not throw across schemas", () => {
			// `spf_header` has no field-level accessors bound (`util/migrator.ts`'s own
			// header comment -- a real, disclosed, pre-existing gap), so the copied
			// values can't be asserted directly here; this is a smoke test that the
			// call itself (routed through the one bound primitive, `spf_header.assign`)
			// doesn't throw across a real cross-schema pair.
			const oldFile = createTestFile("IFC2X3");
			const newFile = createTestFile("IFC4");
			expect(() => new Migrator().preprocess(oldFile, newFile)).not.toThrow();
			oldFile.dispose();
			newFile.dispose();
		});

		test("undo/redo regression: a cross-schema migrate() inside a transaction is fully undoable and redoable", () => {
			const ifc2x3File = createTestFile("IFC2X3");
			const original = ifc2x3File.createEntity("IfcImageTexture", true, true);
			original.set("TextureType", "SPECULAR");
			const ifc4File = createTestFile("IFC4");

			const migrator = new Migrator();
			ifc4File.beginTransaction();
			const newElement = migrator.migrate(original, ifc4File);
			ifc4File.endTransaction();
			const id = newElement.id();

			expect(exists(ifc4File, id)).toBe(true);

			ifc4File.undo();
			expect(exists(ifc4File, id)).toBe(false);

			ifc4File.redo();
			const restored = ifc4File.byId(id);
			expect(restored.isA()).toBe("IfcImageTexture");
			expect(restored.get("Mode")).toBe("SPECULAR");

			ifc2x3File.dispose();
			ifc4File.dispose();
		});
	},
);

// --- same-schema tests: exercise the graph-walk/caching core without needing two
// schemas loaded, so these run unconditionally (not skip-guarded) even under CI's
// current IFC4-only build. Original coverage (Python has no same-schema Migrator
// test -- there's no reason to call Migrator that way in Python, since `is_a`-name
// matching alone handles it trivially there; this project's own `migratedIds`
// caching and recursive-migration mechanics are still worth verifying directly). ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.migrator Migrator.migrate -- same-schema graph walk", () => {
	test("recursive entity + list migration, and migratedIds caches a repeated reference to the same target instance", () => {
		const source = createTestFile("IFC4");
		const material = source.createEntity("IfcMaterial", "Shared Material");
		const propsA = source.createEntity(
			"IfcMaterialProperties",
			null,
			null,
			[source.createEntity("IfcPropertySingleValue", "Foo")],
			material,
		);
		const propsB = source.createEntity(
			"IfcMaterialProperties",
			null,
			null,
			[source.createEntity("IfcPropertySingleValue", "Bar")],
			material,
		);
		const target = createTestFile("IFC4");

		const migrator = new Migrator();
		const newA = migrator.migrate(propsA, target);
		const newB = migrator.migrate(propsB, target);

		const infoA = newA.getInfo() as { Material: EntityInstance };
		const infoB = newB.getInfo() as { Material: EntityInstance };
		expect(infoA.Material.id()).toBe(infoB.Material.id()); // same target instance, not a duplicate
		expect(infoA.Material.get("Name")).toBe("Shared Material");
		expect(target.byType("IfcMaterial").length).toBe(1);

		source.dispose();
		target.dispose();
	});

	test("undo/redo regression (same-schema): migrate() inside a transaction is fully undoable and redoable", () => {
		const source = createTestFile("IFC4");
		const original = source.createEntity("IfcImageTexture", true, true);
		original.set("Mode", "SPECULAR");
		const target = createTestFile("IFC4");

		const migrator = new Migrator();
		target.beginTransaction();
		const newElement = migrator.migrate(original, target);
		target.endTransaction();
		const id = newElement.id();

		expect(exists(target, id)).toBe(true);

		target.undo();
		expect(exists(target, id)).toBe(false);

		target.redo();
		const restored = target.byId(id);
		expect(restored.isA()).toBe("IfcImageTexture");
		expect(restored.get("Mode")).toBe("SPECULAR");

		source.dispose();
		target.dispose();
	});

	test("disclosed primitive-layer gap (util/migrator.ts's own header comment, finding 1): migrating a SELECT-typed " +
		"attribute value (e.g. IfcMeasureWithUnit.ValueComponent) throws the pre-existing entityInstance.ts " +
		"'Attribute access is only supported on entity instances' error, because creating a loose simple-type " +
		"value WITH an initial value goes through EntityInstance.setByIndex's entity-only-gated attribute_kind_of " +
		"call. Asserts the CURRENT, disclosed, blocked behavior -- not silently skipped -- so this test starts " +
		"failing (and needs updating, a good thing) the moment that foundational gap is ever closed.", () => {
		const source = parseIfc(
			"ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION((''),'2;1');\n" +
				"FILE_NAME('','',(''),(''),'','','');\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n" +
				"#1=IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);\n" +
				"#2=IFCMEASUREWITHUNIT(IFCPLANEANGLEMEASURE(0.5),#1);\n" +
				"ENDSEC;\nEND-ISO-10303-21;\n",
		);
		const measureWithUnit = source.byId(2);
		const target = createTestFile("IFC4");

		const migrator = new Migrator();
		expect(() => migrator.migrate(measureWithUnit, target)).toThrow(
			/Attribute access is only supported on entity instances/,
		);

		source.dispose();
		target.dispose();
	});
});
