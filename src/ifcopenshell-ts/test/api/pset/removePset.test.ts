// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset/test_remove_pset.py` (src/ifcopenshell-python). All
// 8 real Python test methods are ported, each adapted the same way: real Python's setup
// calls `ifcopenshell.api.pset.add_pset`/`edit_pset`/`add_qto`/`edit_qto` (none ported
// yet -- `api.pset` remains a future, larger chunk; see `../../../src/api/pset/
// removePset.ts`'s own header comment), so every fixture here builds the equivalent
// `IfcPropertySet`/`IfcPropertySingleValue`/`IfcPropertyEnumeratedValue`/
// `IfcPropertyEnumeration`/`IfcElementQuantity`/`IfcQuantityLength`/
// `IfcRelDefinesByProperties`/`IfcMaterialProperties`/`IfcProfileProperties` graph
// directly via `file.createEntity(...)` instead -- matching this project's established
// "construct the precondition directly" substitution for an unported sibling
// dependency (e.g. `../group/assignGroup.test.ts`'s own `IfcWall`-via-`createEntity`
// substitution for the unported `root.create_entity`).
//
// Real `test_remove_pset.py` has no IFC2X3 test class at all (confirmed by reading the
// whole file directly -- unlike most other ported test files, `TestRemovePset` extends
// only `test.bootstrap.IFC4`, with no `TestRemovePsetIFC2X3` sibling). This isn't an
// oversight: IFC2X3's `IfcMaterialProperties`/`IfcProfileProperties` are schema-shaped
// completely differently from IFC4's -- confirmed directly against the generated
// `.d.ts`s, not assumed. IFC2X3's `IfcMaterialProperties` is an ABSTRACT supertype with
// only a bare `Material` attribute (the real concrete class, `IfcExtendedMaterialProperties`,
// adds `ExtendedProperties`/`Description`/`Name` but is a DIFFERENT `is_a()` string);
// `remove_pset.py`'s own `pset.is_a() in ("IfcMaterialProperties", "IfcProfileProperties")`
// check is an exact-string match, not a subtype check, so it never actually matches an
// IFC2X3 `IfcExtendedMaterialProperties` instance at all. IFC2X3's `IfcProfileProperties`
// is likewise a completely different shape (`ProfileName`/`ProfileDefinition`, no
// `Name`/`Description`/`Properties`). `removePset.ts` ports this exact-match distinction
// faithfully -- see that file's own header comment on its `pset.isA() ===
// "IfcMaterialProperties"` check (no argument, an exact-class match, NOT this port's
// usual `.isA("X")` subtype-check form) for the full writeup. The two tests below that
// exercise this branch (`"removing material psets"`/`"removing profile psets"`) are
// still `test.skipIf(schema === "IFC2X3")`-guarded, matching
// `../geometry/removeRepresentation.test.ts`'s own established precedent for a real
// Python test file's own narrower-than-`AVAILABLE_SCHEMAS` scope.

import { describe, expect, test } from "vitest";
import { removePset } from "../../../src/api/pset/removePset";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { getPsets } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.pset.removePset (%s)", (schema) => {
	test("removing a pset", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, []);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element], pset);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);

		removePset(file, { product: element, pset });

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
		expect(file.byType("IfcPropertySet").length).toBe(0);
	});

	test.skipIf(schema === "IFC2X3")("removing material psets", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcMaterial", "Steel");
		const pset = file.createEntity("IfcMaterialProperties", "Foo_Bar", null, [], element);
		expect((element.get("HasProperties") as EntityInstance[]).length).toBe(1);

		removePset(file, { product: element, pset });

		expect((element.get("HasProperties") as EntityInstance[]).length).toBe(0);
		expect(file.byType("IfcMaterialProperties").length).toBe(0);
	});

	test.skipIf(schema === "IFC2X3")("removing profile psets", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcProfileDef", "AREA", null);
		const pset = file.createEntity("IfcProfileProperties", "Foo_Bar", null, [], element);
		expect((element.get("HasProperties") as EntityInstance[]).length).toBe(1);

		removePset(file, { product: element, pset });

		expect((element.get("HasProperties") as EntityInstance[]).length).toBe(0);
		expect(file.byType("IfcProfileProperties").length).toBe(0);
	});

	test("only unassigning if the pset is used by other elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, []);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element, element2], pset);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);

		removePset(file, { product: element, pset });

		expect(getPsets(element)).toEqual({});
		expect("Foo_Bar" in getPsets(element2)).toBe(true);
		expect(file.byType("IfcPropertySet").length).toBe(1);
	});

	test("removing a pset with properties", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, [prop]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element], pset);

		removePset(file, { product: element, pset });

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
		expect(file.byType("IfcPropertySet").length).toBe(0);
		expect(file.byType("IfcPropertySingleValue").length).toBe(0);
	});

	test("removing a qto with quantities", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		// IFC2X3's `IfcQuantityLength` has no `Formula` attribute (4 attrs vs. IFC4/4X3's
		// 5: `Name`/`Description`/`Unit`/`LengthValue`[/`Formula`]) -- confirmed against
		// the generated `.d.ts`s, not assumed.
		const quantity =
			schema === "IFC2X3"
				? file.createEntity("IfcQuantityLength", "Foo", null, null, 42)
				: file.createEntity("IfcQuantityLength", "Foo", null, null, 42, null);
		const qto = file.createEntity("IfcElementQuantity", guid.new(), null, "Foo_Bar", null, null, [quantity]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element], qto);

		removePset(file, { product: element, pset: qto });

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
		if (schema === "IFC2X3") {
			// Disclosed, real (not TS-port-introduced) IFC2X3 behavior: `IfcQuantitySet`
			// doesn't exist as a schema entity in IFC2X3 at all (introduced in IFC4;
			// confirmed absent from `ifc2x3.d.ts`), so `removePset.ts`'s own
			// `pset.isA("IfcQuantitySet")` check -- ported verbatim from real Python's
			// identical `pset.is_a("IfcQuantitySet")` -- never matches an IFC2X3
			// `IfcElementQuantity` at all. `properties` therefore stays `[]` (the
			// "predefined pset has no properties" default), and the quantity itself is
			// never queued for removal -- real `remove_pset.py`'s own inherent IFC2X3
			// behavior, never exercised by its own test suite (which only ever runs
			// against IFC4), not a bug this port introduces.
			expect(file.byType("IfcElementQuantity").length).toBe(0);
			expect(file.byType("IfcPhysicalSimpleQuantity").length).toBe(1);
		} else {
			expect(file.byType("IfcQuantitySet").length).toBe(0);
			expect(file.byType("IfcPhysicalSimpleQuantity").length).toBe(0);
		}
	});

	test("removing a pset with shared properties", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, [prop]);
		const pset2 = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, [prop]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element], pset);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element2], pset2);

		removePset(file, { product: element, pset });

		expect((pset2.get("HasProperties") as EntityInstance[]).length).toBe(1);
		expect(file.byType("IfcPropertySingleValue").length).toBe(1);
	});

	test("removing a pset with an enumerated property", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const enumeration = file.createEntity("IfcPropertyEnumeration", "Status", ["NEW"], null);
		const prop = file.createEntity("IfcPropertyEnumeratedValue", "Status", null, ["NEW"], enumeration);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Pset_WallCommon", null, [prop]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element], pset);

		removePset(file, { product: element, pset });

		expect(file.byType("IfcPropertyEnumeration").length).toBe(0);
	});

	test("removing a pset with a shared enumeration", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const enumeration1 = file.createEntity("IfcPropertyEnumeration", "Status", ["NEW"], null);
		const prop1 = file.createEntity("IfcPropertyEnumeratedValue", "Status", null, ["NEW"], enumeration1);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Pset_WallCommon", null, [prop1]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element], pset);

		const element2 = file.createEntity("IfcWall");
		const prop2 = file.createEntity("IfcPropertyEnumeratedValue", "Status", null, ["NEW"], enumeration1);
		const pset2 = file.createEntity("IfcPropertySet", guid.new(), null, "Pset_WallCommon", null, [prop2]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element2], pset2);

		removePset(file, { product: element, pset });

		expect(file.byType("IfcPropertyEnumeration").length).toBe(1);
		expect((file.byType("IfcPropertyEnumeration")[0] as EntityInstance).equals(enumeration1)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.pset.removePset Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed rel/pset/property; redo removes them again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, [prop]);
		const rel = file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element], pset);
		const propId = prop.id();
		const psetId = pset.id();
		const relId = rel.id();

		file.beginTransaction();
		removePset(file, { product: element, pset });
		file.endTransaction();

		expect(() => file.byId(propId)).toThrow();
		expect(() => file.byId(psetId)).toThrow();
		expect(() => file.byId(relId)).toThrow();

		file.undo();
		expect(file.byId(propId).isA("IfcPropertySingleValue")).toBe(true);
		expect(file.byId(psetId).isA("IfcPropertySet")).toBe(true);
		expect(file.byId(relId).isA("IfcRelDefinesByProperties")).toBe(true);

		file.redo();
		expect(() => file.byId(propId)).toThrow();
		expect(() => file.byId(psetId)).toThrow();
		expect(() => file.byId(relId)).toThrow();
	});

	test("undo restores RelatedObjects when only unassigning a shared pset", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, []);
		const rel = file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [element, element2], pset);
		const relId = rel.id();
		const psetId = pset.id();

		file.beginTransaction();
		removePset(file, { product: element, pset });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
		expect(file.byId(psetId).isA("IfcPropertySet")).toBe(true);

		file.undo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.redo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});
});
