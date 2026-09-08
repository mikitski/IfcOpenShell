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

	test(".get() throws for a DERIVED attribute (EXPRESS rule execution is out of scope)", () => {
		// IfcSIUnit.Dimensions is redeclared DERIVE in every schema version (category 3)
		// -- must not be read as an ordinary forward attribute (it has no stored value
		// at that positional slot; Python falls through to EXPRESS rule execution
		// instead, which this chunk deliberately doesn't implement, see EntityInstance's
		// own header comment).
		const file = newFile();
		const unit = file.createEntity("IfcSIUnit");
		expect(() => unit.get("Dimensions")).toThrow();
	});

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
