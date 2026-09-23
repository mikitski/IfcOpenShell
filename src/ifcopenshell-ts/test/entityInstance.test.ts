// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/test_entity_instance.py` (src/ifcopenshell-python).

import { describe, expect, test } from "vitest";
import { EntityInstance } from "../src/entityInstance";
import type { IfcFile } from "../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "./bootstrap";

describe.each(AVAILABLE_SCHEMAS)("EntityInstance (%s)", (schema) => {
	function newFile(): IfcFile {
		return createTestFile(schema);
	}

	test("identity()/id()/isA() on a freshly created entity", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(wall.id()).toBeGreaterThan(0);
		expect(typeof wall.identity()).toBe("number");
		expect(wall.isA()).toBe("IfcWall");
		expect(wall.isA("IfcWall")).toBe(true);
		expect(wall.isA("IfcElement")).toBe(true); // supertype
		expect(wall.isA("IfcDoor")).toBe(false);
		expect(wall.isA(true)).toBe(`${schema === "IFC4X3" ? "IFC4X3_ADD2" : schema}.IfcWall`);
		expect(wall.isEntity()).toBe(true);
	});

	test("toString()/toStepString(): SPF entity-text serialization -- ports real Python's " +
		"test_instance_string_formatting.py assertions exactly", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		// A non-ASCII character (astral-plane codepoint, matching Python's `chr(0x1F37A)`)
		// in the `Name` attribute.
		wall.set("Name", String.fromCodePoint(0x1f37a));

		// 0x1F37A should be encoded using \X4\.
		expect(wall.toStepString()).toContain("\\X4\\");
		// to_string()/toStepString() should use upper case entity names.
		expect(wall.toStepString()).toContain("IFCWALL");
		// toString() uses camel case entity names.
		expect(wall.toString()).toContain("IfcWall");
		// in fact, toString() is equal to toStepString(false).
		expect(wall.toString()).toBe(wall.toStepString(false));
	});

	test("equals(): two separately-fetched wrappers of the same instance compare equal via " +
		"identity, never via JS reference equality (research/07-fresh-wrapper-per-access.md's " +
		"regression case)", () => {
		const file = newFile();
		const created = file.createEntity("IfcWall");

		// Fetch the *same* underlying instance twice, independently, via two
		// different query paths -- each mints a fresh native wrapper struct
		// (research/07), so these must never be JS-`===` to each other or to `created`.
		const viaById = file.byId(created.id());
		const viaByType = file.byType("IfcWall")[0];

		expect(viaById).not.toBe(created);
		expect(viaByType).not.toBe(created);
		expect(viaById).not.toBe(viaByType);
		// ... but they are the same underlying instance, and must compare equal.
		expect(viaById.equals(created)).toBe(true);
		expect(viaByType.equals(created)).toBe(true);
		expect(created.equals(viaById)).toBe(true);
		expect(viaById.identity()).toBe(created.identity());

		// A different instance of the same type must not compare equal.
		const other = file.createEntity("IfcWall");
		expect(other.equals(created)).toBe(false);
		expect(created.notEquals(other)).toBe(true);
	});

	test("equals(): different types never compare equal even with identical attributes", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const slab = file.createEntity("IfcSlab");
		expect(wall.equals(slab)).toBe(false);
	});

	test(".get()/.set() round-trip: STRING forward attribute (GlobalId)", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", "3xhrZ$4XvA0v3iZQ8gGvOa");
		expect(wall.get("GlobalId")).toBe("3xhrZ$4XvA0v3iZQ8gGvOa");
	});

	test(".get()/.set() round-trip: ENTITY_INSTANCE forward attribute (OwnerHistory)", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		wall.set("OwnerHistory", ownerHistory);
		const readBack = wall.get("OwnerHistory");
		expect(readBack).toBeInstanceOf(EntityInstance);
		expect((readBack as EntityInstance).equals(ownerHistory)).toBe(true);
	});

	test(".get()/.set() round-trip: unsetting an attribute via null", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		wall.set("Name", "My Wall");
		expect(wall.get("Name")).toBe("My Wall");
		wall.set("Name", null);
		expect(wall.get("Name")).toBeNull();
	});

	test(".get() forward/inverse category dispatch: IsGroupedBy inverse attribute", () => {
		const file = newFile();
		const group = file.createEntity("IfcGroup");
		const wall = file.createEntity("IfcWall");
		const rel = file.createEntity("IfcRelAssignsToGroup");
		rel.set("RelatingGroup", group);
		rel.set("RelatedObjects", [wall]);

		const inverse = group.get("IsGroupedBy") as EntityInstance[];
		expect(inverse).toHaveLength(1);
		expect(inverse[0].equals(rel)).toBe(true);
	});

	test(".get() inverse attribute resolution is scoped by declared entity_reference type, not just attribute name (regression, found by /code-review)", () => {
		// "RelatedObjects" is independently declared (same name, unrelated types) on
		// both IfcRelAggregates and IfcRelDefinesByProperties -- IfcObject.IsDefinedBy
		// is declared with entity_reference scoped to IfcRelDefinesByType/
		// IfcRelDefinesByProperties only, so a wall aggregated into an assembly AND
		// defined by a property set must resolve IsDefinedBy to just the latter, not
		// both. An earlier implementation matched inverse candidates by attribute name
		// alone and incorrectly included the IfcRelAggregates too.
		const file = newFile();
		const wall = file.createEntity("IfcWall");

		const parent = file.createEntity("IfcElementAssembly");
		const agg = file.createEntity("IfcRelAggregates");
		agg.set("RelatingObject", parent);
		agg.set("RelatedObjects", [wall]);

		const pset = file.createEntity("IfcPropertySet");
		const rel = file.createEntity("IfcRelDefinesByProperties");
		rel.set("RelatingPropertyDefinition", pset);
		rel.set("RelatedObjects", [wall]);

		const isDefinedBy = wall.get("IsDefinedBy") as EntityInstance[];
		expect(isDefinedBy).toHaveLength(1);
		expect(isDefinedBy[0].equals(rel)).toBe(true);

		// Meanwhile Decomposes (IfcObjectDefinition's inverse for IfcRelAggregates
		// specifically) must resolve to the aggregation relationship only.
		const decomposes = wall.get("Decomposes") as EntityInstance[];
		expect(decomposes).toHaveLength(1);
		expect(decomposes[0].equals(agg)).toBe(true);
	});

	test(".get() throws for an unknown attribute name", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(() => wall.get("NoSuchAttribute")).toThrow();
	});

	// IfcSIUnit.Dimensions is redeclared DERIVE in every schema version (category 3)
	// -- must not be read as an ordinary forward attribute (it has no stored value at
	// that positional slot). **Updated by Phase EX-2's IFC2X3 chunk 5
	// (planning/ifcopenshell-ts/70-express-rules-plan.md §4,
	// `src/express/rules/ifc2x3.ts`), which closes out IFC2X3 at 55/55 ported
	// `calc_*` functions, `calc_IfcSIUnit_Dimensions` included**: this test's own
	// original claim ("EXPRESS rule execution is out of scope") is no longer true for
	// IFC2X3 specifically, so `.get("Dimensions")` now genuinely resolves there
	// instead of throwing -- split into 2 schema-scoped cases (matching this
	// project's own established `test.skipIf(schema === ...)` precedent, e.g.
	// `test/api/project/appendAsset.test.ts`) rather than silently keeping a
	// now-false assertion for IFC2X3.
	test.skipIf(schema === "IFC2X3")(
		".get() throws for a DERIVED attribute on a schema with no ported EXPRESS calc_* rules yet",
		() => {
			// IFC4/IFC4X3 have no `rules/ifc4.ts`/`rules/ifc4x3.ts` module yet (Phase
			// EX-2 has so far only ported IFC2X3) -- `dispatch.ts`'s per-schema
			// registry has zero entries for either, so this still throws exactly as
			// it always has.
			const file = newFile();
			const unit = file.createEntity("IfcSIUnit");
			expect(() => unit.get("Dimensions")).toThrow();
		},
	);

	test.skipIf(schema !== "IFC2X3")(
		".get() resolves a DERIVED attribute via ported EXPRESS calc_* dispatch (IFC2X3, Phase EX-2)",
		() => {
			// Leading `null` placeholder for the derived `Dimensions` slot -- see
			// `getInfo()`'s own interleaved-DERIVE-attribute test below for the full
			// citation. `calc_IfcSIUnit_Dimensions("METRE")` ->
			// `IfcDimensionsForSiUnit("METRE")` -> `IfcDimensionalExponents(1, 0, 0,
			// 0, 0, 0, 0)` (`src/express/rules/ifc2x3.ts`'s own chunk-5 header
			// comment).
			const file = newFile();
			const unit = file.createEntity("IfcSIUnit", null, "LENGTHUNIT", null, "METRE");
			const dimensions = unit.get("Dimensions") as EntityInstance;
			expect(dimensions.isA()).toBe("IfcDimensionalExponents");
			expect(dimensions.get("LengthExponent")).toBe(1);
		},
	);

	test("getByIndex()/setByIndex() index-based access", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		wall.setByIndex(2, "By Index");
		expect(wall.getByIndex(2)).toBe("By Index");
		expect(wall.get("Name")).toBe("By Index");
	});

	test("attributeCount() matches the schema declaration", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(wall.attributeCount()).toBeGreaterThan(0);
	});

	test("getInfo(): non-recursive includes id/type/attributes", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall", "3xhrZ$4XvA0v3iZQ8gGvOa");
		const info = wall.getInfo();
		expect(info.id).toBe(wall.id());
		expect(info.type).toBe("IfcWall");
		expect(info.GlobalId).toBe("3xhrZ$4XvA0v3iZQ8gGvOa");
	});

	test("getInfo(): recursive inlines referenced entities as nested dicts", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		wall.set("OwnerHistory", ownerHistory);

		const shallow = wall.getInfo();
		expect(shallow.OwnerHistory).toBeInstanceOf(EntityInstance);

		const deep = wall.getInfo(true);
		expect(deep.OwnerHistory).not.toBeInstanceOf(EntityInstance);
		expect((deep.OwnerHistory as Record<string, unknown>).id).toBe(ownerHistory.id());
		expect((deep.OwnerHistory as Record<string, unknown>).type).toBe("IfcOwnerHistory");
	});

	test("getInfo(): includeIdentifier=false omits id", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const info = wall.getInfo(false, false);
		expect(info.id).toBeUndefined();
	});

	test("getInfo(): ignore list omits named attributes", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		wall.set("Name", "My Wall");
		const info = wall.getInfo(false, true, ["Name"]);
		expect(info.Name).toBeUndefined();
		expect("GlobalId" in info).toBe(true);
	});

	// Real, disclosed bug found and fixed while building the `api.unit` Phase 6 chunk
	// (`planning/ifcopenshell-ts/PROGRESS.md`) -- see `getInfo()`'s own updated header
	// comment for the full root-cause writeup. `IfcSIUnit` re-declares its inherited
	// `IfcNamedUnit.Dimensions` (attribute index 0) as EXPRESS `DERIVE`, so the real
	// STEP-level attribute list still reserves index 0 for it even though it's
	// excluded from `.get()`/`.set()`'s FORWARD-attribute name resolution -- a real
	// class with a non-FORWARD attribute interleaved among its FORWARD ones, which the
	// previous `getInfo()` implementation zipped incorrectly (see the header comment
	// for the exact wrong output it used to produce).
	test("getInfo(): a class with an interleaved DERIVE attribute (IfcSIUnit.Dimensions) maps names to the correct real indices", () => {
		const file = newFile();
		// Leading `null` placeholder for the derived `Dimensions` slot -- positional
		// creation matches `src/api/unit/addSiUnit.ts`'s own documented layout.
		const unit = file.createEntity("IfcSIUnit", null, "LENGTHUNIT", "MILLI", "METRE");
		const info = unit.getInfo();
		expect(info.UnitType).toBe("LENGTHUNIT");
		expect(info.Prefix).toBe("MILLI");
		expect(info.Name).toBe("METRE");
		expect("undefined" in info).toBe(false);
		expect(Object.keys(info).sort()).toEqual(["Name", "Prefix", "UnitType", "id", "type"].sort());
	});

	test("walk(): pure tree-transform helper", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const other = file.createEntity("IfcWall");
		const value = [wall, "unchanged", [other]];
		const result = EntityInstance.walk(
			(v) => v instanceof EntityInstance,
			(v) => (v as EntityInstance).id(),
			value,
		);
		expect(result).toEqual([wall.id(), "unchanged", [other.id()]]);
	});
});
