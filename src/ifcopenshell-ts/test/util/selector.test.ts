// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test_selector.py`'s `TestGetElementValue` **and** `TestFilterElements`
// classes (src/ifcopenshell-python's `test/util/test_selector.py`) -- `TestGetElementValue`
// covers `get_element_value` (the key-path mini-language), matching chunk 1's scope (see
// `src/util/selector.ts`'s header comment); `TestFilterElements` covers `filter_elements`
// (the facet-based element-filtering language), matching chunk 2's scope (see that same
// file's "Chunk 2" header comment further down). `TestFormat`/`TestSetElementValue*` have
// no counterpart here -- `format`/`set_element_value` are separate, later chunks.
//
// Python's own fixtures go through `ifcopenshell.api.*` (`api.root.create_entity`,
// `api.material.add_material`/`add_material_set`/`add_layer`/`assign_material`,
// `api.pset.add_pset`/`edit_pset`, `api.classification.add_classification`/`add_reference`,
// `api.group.add_group`/`assign_group`, `api.spatial.assign_container`,
// `api.aggregate.assign_object`, `api.type.assign_type`), none of which exist yet in this
// TS port (`api` is Phase 6+, planning/ifcopenshell-ts/20-roadmap.md). This file's local
// fixture helpers below build the same underlying entity graphs directly
// (`file.createEntity(...)` + `.set(...)`), matching `test/util/element.test.ts`'s own
// established pattern for this exact same gap (`buildProperties`/`addPset`/`addQto`/
// `assignType`/`assignMaterial`/`containElement`/`assignAggregate`/`assignGroup`/
// `assignClassification` below are the same shapes as that file's/`test/util/
// classification.test.ts`'s, trimmed to what this file's own tests need -- not imported
// from there since neither file exports them).
//
// Additional coverage beyond a direct `test_selector.py` port: `parseKeyPath`/
// `parseFilterQuery` unit tests (no Python counterpart -- Python's grammars are parsed by
// `lark`, this port's hand-rolled scanners have their own edge cases worth covering
// directly), the disclosed positional/geolocated-key blocker (`src/util/selector.ts`'s
// finding #1 -- Python's own suite has a `test_selecting_an_elements_rotation_using_a_query`
// test that exercises the *unblocked* real computation, which this port cannot reproduce;
// the blocker itself has no Python counterpart by definition), the narrow `profiles`/
// `classification`/`system`/`zone`/spatial-parent key re-implementations (`selector.ts`'s
// finding #2), and the `int`-vs-`float`/`Decimal` numeric-comparison findings (chunk 2's
// header comment, findings 1-2) -- none of which have a dedicated Python test case, so
// these are original coverage of documented Python/port behavior, not ports of existing
// Python tests.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as guid from "../../src/guid";
import * as subject from "../../src/util/selector";
import { createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header
// comment; same shapes as `test/util/element.test.ts`'s own, trimmed to this file's
// needs) ---

function buildProperties(file: IfcFile, properties: Record<string, unknown>): EntityInstance[] {
	return Object.entries(properties).map(([key, value]) => {
		const prop = file.createEntity("IfcPropertySingleValue");
		prop.set("Name", key);
		prop.set("NominalValue", value);
		return prop;
	});
}

/** Attaches a bare, raw-primitive `IfcPropertyListValue` to `pset` -- used for the
 * `Status: ["New"]` fixture in `test_selecting_a_pset`'s port below (a list-valued
 * property), matching `util/element.ts`'s already-tested "bare primitive" `ListValues`
 * path (`unwrapSelectValue` passes a raw, non-`EntityInstance` array element through
 * unchanged). */
function addListProperty(file: IfcFile, pset: EntityInstance, name: string, values: unknown[]): void {
	const prop = file.createEntity("IfcPropertyListValue");
	prop.set("Name", name);
	prop.set("ListValues", values);
	const existing = (pset.get("HasProperties") as EntityInstance[] | null) ?? [];
	pset.set("HasProperties", [...existing, prop]);
}

function addPset(
	file: IfcFile,
	product: EntityInstance,
	name: string,
	properties: Record<string, unknown> = {},
): EntityInstance {
	const pset = file.createEntity("IfcPropertySet");
	pset.set("Name", name);
	pset.set("HasProperties", buildProperties(file, properties));
	const rel = file.createEntity("IfcRelDefinesByProperties");
	rel.set("RelatedObjects", [product]);
	rel.set("RelatingPropertyDefinition", pset);
	return pset;
}

function addQto(
	file: IfcFile,
	product: EntityInstance,
	name: string,
	quantities: Record<string, number> = {},
): EntityInstance {
	const qto = file.createEntity("IfcElementQuantity");
	qto.set("Name", name);
	qto.set(
		"Quantities",
		Object.entries(quantities).map(([key, value]) => {
			const quantity = file.createEntity("IfcQuantityCount");
			quantity.set("Name", key);
			quantity.set("CountValue", value);
			return quantity;
		}),
	);
	const rel = file.createEntity("IfcRelDefinesByProperties");
	rel.set("RelatedObjects", [product]);
	rel.set("RelatingPropertyDefinition", qto);
	return qto;
}

function assignType(file: IfcFile, element: EntityInstance, elementType: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelDefinesByType");
	rel.set("RelatedObjects", [element]);
	rel.set("RelatingType", elementType);
	return rel;
}

function assignMaterial(file: IfcFile, elements: EntityInstance[], material: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesMaterial");
	rel.set("RelatedObjects", elements);
	rel.set("RelatingMaterial", material);
	return rel;
}

function buildMaterialLayerSet(
	file: IfcFile,
	name: string,
	layers: readonly { material: EntityInstance; name: string; thickness?: number }[],
): EntityInstance {
	const layerEntities = layers.map(({ material, name: layerName, thickness }) => {
		const layer = file.createEntity("IfcMaterialLayer");
		layer.set("Material", material);
		layer.set("LayerThickness", thickness ?? 1);
		layer.set("Name", layerName);
		return layer;
	});
	const set = file.createEntity("IfcMaterialLayerSet");
	set.set("MaterialLayers", layerEntities);
	set.set("LayerSetName", name);
	return set;
}

function containElement(file: IfcFile, structure: EntityInstance, elements: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelContainedInSpatialStructure");
	rel.set("RelatingStructure", structure);
	rel.set("RelatedElements", elements);
	return rel;
}

function assignAggregate(
	file: IfcFile,
	relatingObject: EntityInstance,
	relatedObjects: EntityInstance[],
): EntityInstance {
	const rel = file.createEntity("IfcRelAggregates");
	rel.set("RelatingObject", relatingObject);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

function assignGroup(file: IfcFile, group: EntityInstance, elements: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToGroup");
	rel.set("RelatingGroup", group);
	rel.set("RelatedObjects", elements);
	return rel;
}

function assignClassification(file: IfcFile, elements: EntityInstance[], reference: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesClassification");
	rel.set("RelatedObjects", elements);
	rel.set("RelatingClassification", reference);
	return rel;
}

// --- `parseKeyPath` -- no Python counterpart (see this file's header comment) ---

describe("selector.parseKeyPath", () => {
	test("splits a dotted key path into plain strings", () => {
		expect(subject.parseKeyPath("type.Name")).toEqual(["type", "Name"]);
		expect(subject.parseKeyPath("Pset_WallCommon.FireRating")).toEqual(["Pset_WallCommon", "FireRating"]);
	});

	test("quoted keys strip quotes and unescape backslashes verbatim (Python's blunt `.replace('\\\\', '')`)", () => {
		expect(subject.parseKeyPath('"material"."item"."Name"')).toEqual(["material", "item", "Name"]);
		expect(subject.parseKeyPath('material."item"."Name"')).toEqual(["material", "item", "Name"]);
		expect(subject.parseKeyPath('"a\\"b"')).toEqual(['a"b']);
	});

	test("regex keys compile to RegExp instances", () => {
		const keys = subject.parseKeyPath("/Foo.*/./F.*/");
		expect(keys).toHaveLength(2);
		expect(keys[0]).toBeInstanceOf(RegExp);
		expect(keys[1]).toBeInstanceOf(RegExp);
		expect((keys[0] as RegExp).source).toBe("Foo.*");
	});

	test("throws on an unterminated quoted or regex key", () => {
		expect(() => subject.parseKeyPath('"unterminated')).toThrow();
		expect(() => subject.parseKeyPath("/unterminated")).toThrow();
	});

	test("throws on an empty key segment (two consecutive dots) or trailing dot", () => {
		expect(() => subject.parseKeyPath("a..b")).toThrow();
		expect(() => subject.parseKeyPath("a.")).toThrow();
	});

	test("throws on an empty query", () => {
		expect(() => subject.parseKeyPath("")).toThrow();
	});

	// Regression test for a real bug found by this chunk's own adversarial review: the
	// grammar's `regex_string` inner class is one-or-more (`+`), so an empty `//` is a
	// parse error in Python, not a pattern that matches everything.
	test("throws on an empty regex key ('//')", () => {
		expect(() => subject.parseKeyPath("//")).toThrow();
		expect(() => subject.parseKeyPath("Foobar.//")).toThrow();
	});
});

// --- `getElementValue` -- port of `test_selector.py`'s `TestGetElementValue`, plus
// original coverage of the narrow re-implementations and the disclosed blocker (see
// this file's header comment) ---

describe("selector.getElementValue", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	// Python: `test_selecting_an_elements_class_or_id_using_a_query`.
	test("plain first-class keys: class, id", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		expect(subject.getElementValue(element, "class")).toBe("IfcWall");
		expect(subject.getElementValue(element, "id")).toBe(element.id());
	});

	// Python: `test_selecting_an_elements_value_using_a_query`.
	test("plain attribute lookup, unquoted and quoted", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("Name", "Foobar");
		expect(subject.getElementValue(element, "Name")).toBe("Foobar");
		expect(subject.getElementValue(element, '"Name"')).toBe("Foobar");
	});

	test("dotted nesting: type.Name and material.Name", () => {
		const file = newFile();
		const wallType = file.createEntity("IfcWallType");
		wallType.set("Name", "MyType");
		const element = file.createEntity("IfcWall");
		assignType(file, element, wallType);
		expect(subject.getElementValue(element, "type.Name")).toBe("MyType");
		expect(subject.getElementValue(element, "type.class")).toBe("IfcWallType");

		const material = file.createEntity("IfcMaterial");
		material.set("Name", "Concrete");
		assignMaterial(file, [element], material);
		expect(subject.getElementValue(element, "material.Name")).toBe("Concrete");
	});

	test("predefined_type and types/occurrences keys", () => {
		const file = newFile();
		const wallType = file.createEntity("IfcWallType");
		wallType.set("PredefinedType", "SOLIDWALL");
		const element = file.createEntity("IfcWall");
		assignType(file, element, wallType);
		expect(subject.getElementValue(element, "predefined_type")).toBe("SOLIDWALL");
		expect((subject.getElementValue(wallType, "types") as EntityInstance[]).map((e) => e.id())).toEqual([element.id()]);
		expect((subject.getElementValue(wallType, "occurrences") as EntityInstance[]).map((e) => e.id())).toEqual([
			element.id(),
		]);
	});

	test("count key over materials (array) and a scalar (non-list) value", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		expect(subject.getElementValue(element, "materials.count")).toBe(0);
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		expect(subject.getElementValue(element, "materials.count")).toBe(1);
		// Python: `else: value = 1` -- a scalar (non-list/tuple/set) value's own "count"
		// is always 1, not an error.
		element.set("Name", "Foobar");
		expect(subject.getElementValue(element, "Name.count")).toBe(1);
	});

	test("classification key returns occurrence classification references as a Set", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Uniclass");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("ReferencedSource", classification);
		reference.set("Name", "Ref1");
		assignClassification(file, [element], reference);

		const result = subject.getElementValue(element, "classification");
		expect(result).toBeInstanceOf(Set);
		expect([...(result as Set<EntityInstance>)].map((r) => r.get("Name"))).toEqual(["Ref1"]);
	});

	// Regression test for a real bug found by this chunk's own adversarial review:
	// `getReferencesNarrow` originally built its result with a plain JS `Set`, which
	// dedupes by reference equality -- but the N-API layer mints a fresh wrapper object
	// per accessor call, so two relationships pointing at the identical underlying
	// `IfcClassificationReference` produced a size-2 result instead of a real
	// Python-`set`-equivalent size-1. Two separate elements, each independently
	// associated with the SAME reference instance, exercises the dedup via
	// `EntityInstanceSet` (identity-keyed, not reference-equality-keyed).
	test("classification key dedupes the same reference reached via multiple relationships", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Uniclass");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("ReferencedSource", classification);
		reference.set("Name", "Ref1");
		// Two separate IfcRelAssociatesClassification relationships, both pointing at the
		// same reference instance -- a realistic pattern (e.g. re-association after an
		// edit without removing the old relationship).
		assignClassification(file, [element], reference);
		assignClassification(file, [element], reference);

		const result = subject.getElementValue(element, "classification") as Set<EntityInstance>;
		expect(result.size).toBe(1);
		expect(subject.getElementValue(element, "classification.count")).toBe(1);
	});

	// Python: `value[int(key)]` against a real `set` raises `TypeError` ("'set' object is
	// not subscriptable"), uncaught by the surrounding `except IndexError` -- a genuine
	// Python crash this port reproduces verbatim rather than smoothing over. Exercises a
	// numeric key applied directly to a Set-valued result (the "classification" key,
	// which always produces a `Set<EntityInstance>`).
	test("a numeric key against a Set-valued result throws (reproducing Python's TypeError)", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const classification = file.createEntity("IfcClassification");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("ReferencedSource", classification);
		assignClassification(file, [element], reference);
		expect(() => subject.getElementValue(element, "classification.0")).toThrow(TypeError);
	});

	test("group/system/zone keys resolve via IfcRelAssignsToGroup", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");

		const group = file.createEntity("IfcGroup");
		group.set("Name", "G1");
		assignGroup(file, group, [element]);
		expect((subject.getElementValue(element, "group") as EntityInstance[]).map((g) => g.get("Name"))).toEqual(["G1"]);

		const system = file.createEntity("IfcDistributionSystem");
		system.set("Name", "S1");
		assignGroup(file, system, [element]);
		expect((subject.getElementValue(element, "system") as EntityInstance[]).map((g) => g.get("Name"))).toEqual(["S1"]);

		const zone = file.createEntity("IfcZone");
		zone.set("Name", "Z1");
		assignGroup(file, zone, [element]);
		expect((subject.getElementValue(element, "zone") as EntityInstance[]).map((g) => g.get("Name"))).toEqual(["Z1"]);
		// The plain `IfcGroup` (G1) and the `IfcZone` (Z1) are both deliberately excluded
		// from `system` (Python's `group.is_a("IfcSystem")` check, plus its
		// `group.is_a() in ("IfcStructuralAnalysisModel", "IfcZone")` exclusion) -- only
		// the `IfcDistributionSystem` (S1) is a match, confirmed by the length-1 result
		// above already, not just its content.
		expect((subject.getElementValue(element, "system") as EntityInstance[]).map((g) => g.get("Name"))).toEqual(["S1"]);
	});

	test("container/space/storey/building/site/parent keys walk the containment/aggregation chain", () => {
		const file = newFile();
		const site = file.createEntity("IfcSite");
		site.set("Name", "Site1");
		const building = file.createEntity("IfcBuilding");
		building.set("Name", "Building1");
		const storey = file.createEntity("IfcBuildingStorey");
		storey.set("Name", "Storey1");
		const element = file.createEntity("IfcWall");

		assignAggregate(file, site, [building]);
		assignAggregate(file, building, [storey]);
		containElement(file, storey, [element]);

		expect((subject.getElementValue(element, "storey") as EntityInstance).get("Name")).toBe("Storey1");
		expect((subject.getElementValue(element, "building") as EntityInstance).get("Name")).toBe("Building1");
		expect((subject.getElementValue(element, "site") as EntityInstance).get("Name")).toBe("Site1");
		expect((subject.getElementValue(element, "parent") as EntityInstance).get("Name")).toBe("Storey1");
		expect((subject.getElementValue(element, "container") as EntityInstance).get("Name")).toBe("Storey1");
		expect(subject.getElementValue(element, "space")).toBeNull();
	});

	test('"profiles" key: material-profile-set path is fully ported', () => {
		const file = newFile();
		const element = file.createEntity("IfcColumn");
		const material = file.createEntity("IfcMaterial");
		const profile = file.createEntity("IfcRectangleProfileDef");
		profile.set("ProfileType", "AREA");
		profile.set("ProfileName", "P1");
		const materialProfile = file.createEntity("IfcMaterialProfile");
		materialProfile.set("Material", material);
		materialProfile.set("Profile", profile);
		const profileSet = file.createEntity("IfcMaterialProfileSet");
		profileSet.set("MaterialProfiles", [materialProfile]);
		assignMaterial(file, [element], profileSet);

		expect(subject.getElementValue(element, "profiles.0.ProfileName")).toBe("P1");
	});

	test('"profiles" key: disclosed util.representation/util.shape blocker when there is no material profile set', () => {
		const file = newFile();
		const element = file.createEntity("IfcColumn");
		expect(() => subject.getElementValue(element, "profiles")).toThrow(/util\.representation/);
	});

	// Python: `test_selecting_using_a_multiple_key_query`.
	test('"item"/"i" key and numeric list-indexing, including quoted-key and shortform-key equivalents', () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		material.set("Name", "CON01");
		const materialSet = buildMaterialLayerSet(file, "FOO", [
			{ material, name: "L1" },
			{ material, name: "L2" },
		]);
		assignMaterial(file, [element], materialSet);

		expect(subject.getElementValue(element, "material.MaterialLayers.Name")).toEqual(["L1", "L2"]);
		// "item" generically selects an item in a material set.
		expect(subject.getElementValue(element, "material.item.Name")).toEqual(["L1", "L2"]);
		expect(subject.getElementValue(element, "material.item.Name.0")).toBe("L1");
		expect(subject.getElementValue(element, "material.item.Name.1")).toBe("L2");
		expect(subject.getElementValue(element, '"material"."item"."Name"')).toEqual(["L1", "L2"]);
		expect(subject.getElementValue(element, 'material."item"."Name"')).toEqual(["L1", "L2"]);
		// Shortform for convenience.
		expect(subject.getElementValue(element, "mat.i.Name")).toEqual(["L1", "L2"]);
	});

	// Python: `test_selecting_a_query_that_fails_silently`.
	test("a query against an element with no material at all fails silently (returns null)", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		expect(subject.getElementValue(element, "material.item.Name.0")).toBeNull();
	});

	// Python: `test_selecting_a_list_item_that_fails_silently`.
	test("an out-of-range list index fails silently (returns null), short-circuiting the whole query", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		const materialSet = buildMaterialLayerSet(file, "FOO", [{ material, name: "L1" }]);
		assignMaterial(file, [element], materialSet);
		expect(subject.getElementValue(element, "material.item.Name.0")).toBe("L1");
		expect(subject.getElementValue(element, "material.item.Name.1")).toBeNull();
	});

	// Python: `test_selecting_a_pset`.
	test("pset/prop lookup by exact name and by regex, including multi-match arrays", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, element, "Foobar", { Foo: "Bar" });
		expect(subject.getElementValue(element, "Foobar.Foo")).toBe("Bar");
		expect(subject.getElementValue(element, "Foobar./F.*/")).toBe("Bar");
		expect(subject.getElementValue(element, "/Foo.*/./F.*/")).toBe("Bar");

		const withBaz = (pset.get("HasProperties") as EntityInstance[] | null) ?? [];
		pset.set("HasProperties", [...withBaz, ...buildProperties(file, { Baz: 123 })]);
		expect(subject.getElementValue(element, "/Foo.*/./B.*/")).toBe(123);
		expect(subject.getElementValue(element, "/Foo.*/./.*/")).toEqual(["Bar", 123]);

		const withBay = (pset.get("HasProperties") as EntityInstance[] | null) ?? [];
		pset.set("HasProperties", [...withBay, ...buildProperties(file, { Bay: 123.3 })]);
		expect(subject.getElementValue(element, "/Foo.*/./B.*/")).toEqual([123, 123.3]);

		const wallCommon = addPset(file, element, "Pset_WallCommon");
		addListProperty(file, wallCommon, "Status", ["New"]);
		expect(subject.getElementValue(element, "/Pset_.*Common/.Status")).toEqual(["New"]);
		expect(subject.getElementValue(element, "/Pset_.*Common/.Status.0")).toBe("New");
	});

	// A pset-name regex matching more than one pset (`matching_psets`, plural -- the
	// non-singleton branch of Python's `result = matching_psets or None; if result and
	// len(result) == 1: result = result[0]`) is not exercised by the multi-match test
	// above (that one only ever matches a single pset by name); this covers it directly.
	test("a pset-name regex matching multiple psets returns an array of pset dicts", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		addPset(file, element, "Pset_WallCommon", { FireRating: "60" });
		addPset(file, element, "Pset_WallOther", { Status: "New" });
		addPset(file, element, "Unrelated", { X: 1 });

		const result = subject.getElementValue(element, "/Pset_Wall.*/") as Record<string, unknown>[];
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({ FireRating: "60" });
		expect(result).toContainEqual({ Status: "New" });
	});

	// Python: `test_selecting_a_nested_complex_quantity`. Round-trip test against a
	// realistically-constructed `IfcElementQuantity`/`IfcPhysicalComplexQuantity` graph
	// built via the file's own real create/set APIs (no `ifcopenshell.api` available
	// yet -- see this file's header comment).
	test("a nested IfcPhysicalComplexQuantity is reachable via the natural dotted path", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const width = file.createEntity("IfcQuantityLength");
		width.set("Name", "Width");
		width.set("LengthValue", 0.1);
		const height = file.createEntity("IfcQuantityLength");
		height.set("Name", "Height");
		height.set("LengthValue", 2.5);
		const complexQuantity = file.createEntity("IfcPhysicalComplexQuantity");
		complexQuantity.set("Name", "Layer1");
		complexQuantity.set("Discrimination", "layer");
		complexQuantity.set("HasQuantities", [width, height]);

		const netArea = file.createEntity("IfcQuantityArea");
		netArea.set("Name", "NetArea");
		netArea.set("AreaValue", 5.0);
		const qto = file.createEntity("IfcElementQuantity");
		qto.set("Name", "Qto_Custom");
		qto.set("Quantities", [complexQuantity, netArea]);
		const rel = file.createEntity("IfcRelDefinesByProperties");
		rel.set("RelatedObjects", [element]);
		rel.set("RelatingPropertyDefinition", qto);

		// A simple quantity in the same set still resolves normally.
		expect(subject.getElementValue(element, "Qto_Custom.NetArea")).toBe(5.0);
		// Nested quantities of a complex quantity are reachable with the natural path.
		expect(subject.getElementValue(element, "Qto_Custom.Layer1.Width")).toBe(0.1);
		expect(subject.getElementValue(element, "Qto_Custom.Layer1.Height")).toBe(2.5);
		// The explicit "properties" path is preserved for backwards compatibility.
		expect(subject.getElementValue(element, "Qto_Custom.Layer1.properties.Width")).toBe(0.1);
	});

	test("a plain (non-complex) quantity is reachable via addQto", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		addQto(file, element, "Qto_WallBaseQuantities", { Count: 3 });
		expect(subject.getElementValue(element, "Qto_WallBaseQuantities.Count")).toBe(3);
	});

	describe("positional/geolocated keys -- disclosed blocker (see src/util/selector.ts's header comment, finding #1)", () => {
		test("throws a clear, descriptive error naming the missing Python modules when ObjectPlacement is actually set", () => {
			const file = newFile();
			const element = file.createEntity("IfcWall");
			const placement = file.createEntity("IfcLocalPlacement");
			element.set("ObjectPlacement", placement);

			for (const key of ["x", "y", "z"]) {
				expect(() => subject.getElementValue(element, key)).toThrow(/util\.placement/);
			}
			for (const key of ["easting", "northing", "elevation"]) {
				expect(() => subject.getElementValue(element, key)).toThrow(/util\.geolocation/);
			}
			for (const key of ["rotation_x", "rotation_y", "rotation_z"]) {
				expect(() => subject.getElementValue(element, key)).toThrow(/util\.shape_builder/);
			}
		});

		// Python: `test_selecting_an_elements_rotation_using_a_query`'s
		// `element_without_placement` assertion (`get_element_value(..., "rotation_z") is
		// None`) -- the only part of that Python test this port can still reproduce; the
		// rest of that test exercises the real placement/geolocation computation this
		// port cannot yet perform (see the blocker above).
		test("returns null, not a throw, when ObjectPlacement is declared but left unset", () => {
			const file = newFile();
			const element = file.createEntity("IfcWall");
			expect(subject.getElementValue(element, "x")).toBeNull();
			expect(subject.getElementValue(element, "rotation_z")).toBeNull();
		});

		test("falls through to ordinary attribute/pset lookup (no throw) when the class has no ObjectPlacement at all", () => {
			const file = newFile();
			const material = file.createEntity("IfcMaterial");
			expect(subject.getElementValue(material, "x")).toBeNull();
		});
	});
});

// --- `parseFilterQuery` -- no Python counterpart (see this file's header comment) ---

describe("selector.parseFilterQuery", () => {
	test("instance/entity facets, negation, and comparisons parse as expected", () => {
		expect(subject.parseFilterQuery("IfcWall")).toEqual([[{ kind: "entity", negate: false, ifcClass: "IfcWall" }]]);
		expect(subject.parseFilterQuery("! IfcWall")).toEqual([[{ kind: "entity", negate: true, ifcClass: "IfcWall" }]]);
		expect(subject.parseFilterQuery("Name=Foo")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "=", value: "Foo" }],
		]);
		expect(subject.parseFilterQuery("Name!=Foo")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "!=", value: "Foo" }],
		]);
		expect(subject.parseFilterQuery("Name*=Foo")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "*=", value: "Foo" }],
		]);
		expect(subject.parseFilterQuery("Name!*=Foo")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "!*=", value: "Foo" }],
		]);
		expect(subject.parseFilterQuery("OverallHeight>=3000")).toEqual([
			[{ kind: "attribute", name: "OverallHeight", comparison: ">=", value: "3000" }],
		]);
	});

	test("special values NULL/TRUE/FALSE, quoted string, and regex", () => {
		expect(subject.parseFilterQuery("Name=NULL")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "=", value: null }],
		]);
		expect(subject.parseFilterQuery("Name=TRUE")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "=", value: true }],
		]);
		expect(subject.parseFilterQuery("Name=FALSE")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "=", value: false }],
		]);
		// A keyword-looking prefix that isn't an exact, delimited match is just a
		// bare unquoted string, not the `special` token (see this file's own
		// disclosed lark-approximation, `parseFilterQuery`'s header comment).
		expect(subject.parseFilterQuery("Name=NULLABLE")).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "=", value: "NULLABLE" }],
		]);

		const quoted = subject.parseFilterQuery('Name="Foo\\"Bar"');
		expect(quoted).toEqual([[{ kind: "attribute", name: "Name", comparison: "=", value: 'Foo"Bar' }]]);

		const regex = subject.parseFilterQuery("Name=/Fo.*/");
		const value = (regex[0][0] as { kind: "attribute"; value: unknown }).value;
		expect(value).toBeInstanceOf(RegExp);
		expect((value as RegExp).source).toBe("Fo.*");
	});

	test("property facet: pset.prop, quoted/regex pset and prop names", () => {
		expect(subject.parseFilterQuery("Pset_WallCommon.FireRating=120")).toEqual([
			[{ kind: "property", pset: "Pset_WallCommon", prop: "FireRating", comparison: "=", value: "120" }],
		]);
		expect(subject.parseFilterQuery('Foobar."Foo"=Bar')).toEqual([
			[{ kind: "property", pset: "Foobar", prop: "Foo", comparison: "=", value: "Bar" }],
		]);
		const parsed = subject.parseFilterQuery("Foobar./Fo.*/=Bar")[0][0] as { kind: "property"; prop: unknown };
		expect(parsed.prop).toBeInstanceOf(RegExp);
	});

	test("keyword facets (type/material/classification/location/group/parent) and query:", () => {
		for (const kind of ["type", "material", "classification", "location", "group", "parent"] as const) {
			expect(subject.parseFilterQuery(`${kind}=Foo`)).toEqual([[{ kind, comparison: "=", value: "Foo" }]]);
		}
		// `query:`'s `keys` production is `quoted_string | unquoted_string` (no
		// `regex_string`), and `unquoted_string` itself excludes `.` -- so a *dotted*
		// key path (as this port's own `parseKeyPath`/`getElementValue` would then
		// re-parse) must be quoted here; an unquoted `query:type.Name=Foo` cannot
		// express a dotted path at all in the real grammar (verified directly against
		// the grammar text, not assumed).
		expect(subject.parseFilterQuery('query:"type.Name"=Foo')).toEqual([
			[{ kind: "query", keys: "type.Name", comparison: "=", value: "Foo" }],
		]);
		expect(subject.parseFilterQuery("query:Name=Foo")).toEqual([
			[{ kind: "query", keys: "Name", comparison: "=", value: "Foo" }],
		]);
	});

	test("',' (OR/union within a group) and '+' (AND across groups)", () => {
		expect(subject.parseFilterQuery("IfcWall, IfcSlab")).toEqual([
			[
				{ kind: "entity", negate: false, ifcClass: "IfcWall" },
				{ kind: "entity", negate: false, ifcClass: "IfcSlab" },
			],
		]);
		expect(subject.parseFilterQuery("IfcWall + IfcSlab")).toEqual([
			[{ kind: "entity", negate: false, ifcClass: "IfcWall" }],
			[{ kind: "entity", negate: false, ifcClass: "IfcSlab" }],
		]);
	});

	test("block comments are stripped between tokens but not inside quoted strings", () => {
		expect(subject.parseFilterQuery("IfcWall /* comment */")).toEqual([
			[{ kind: "entity", negate: false, ifcClass: "IfcWall" }],
		]);
		expect(subject.parseFilterQuery('Name="a/*b"')).toEqual([
			[{ kind: "attribute", name: "Name", comparison: "=", value: "a/*b" }],
		]);
	});

	test("a dangling trailing '+' (e.g. left by a stripped comment) is valid", () => {
		expect(subject.parseFilterQuery("IfcWall + /* IfcSlab */")).toEqual([
			[{ kind: "entity", negate: false, ifcClass: "IfcWall" }],
		]);
	});

	test("throws on malformed input", () => {
		expect(() => subject.parseFilterQuery("!")).toThrow();
		expect(() => subject.parseFilterQuery("lowercase=Foo")).toThrow();
		expect(() => subject.parseFilterQuery("IfcWall +")).not.toThrow();
		expect(() => subject.parseFilterQuery("IfcWall ,")).toThrow();
		expect(() => subject.parseFilterQuery('Name="unterminated')).toThrow();
		expect(() => subject.parseFilterQuery("Name=/unterminated")).toThrow();
		expect(() => subject.parseFilterQuery("Name=//")).toThrow();
		expect(() => subject.parseFilterQuery("IfcWall /* unterminated")).toThrow();
	});
});

// --- `filterElements` -- port of `test_selector.py`'s `TestFilterElements` class ---

describe("selector.filterElements", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	function ids(instances: Iterable<EntityInstance>): number[] {
		return [...instances].map((i) => i.id()).sort((a, b) => a - b);
	}

	function expectElements(actual: Set<EntityInstance>, expected: readonly EntityInstance[]): void {
		expect(ids(actual)).toEqual(ids(expected));
	}

	/** Local fixture helper (no Python/api counterpart): replaces (rather than
	 * `addListProperty`'s append) any existing same-named property on `pset`, letting
	 * a test simulate the effect of Python's `api.pset.edit_pset` without needing that
	 * not-yet-ported `api` layer. */
	function setListProperty(file: IfcFile, pset: EntityInstance, name: string, values: unknown[]): void {
		const prop = file.createEntity("IfcPropertyListValue");
		prop.set("Name", name);
		prop.set("ListValues", values);
		const existing = ((pset.get("HasProperties") as EntityInstance[] | null) ?? []).filter(
			(p) => (p.get("Name") as string | null) !== name,
		);
		pset.set("HasProperties", [...existing, prop]);
	}

	// Python: `test_selecting_by_globalid`.
	test("selecting by GlobalId: union and negation", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", guid.new());
		const element2 = file.createEntity("IfcSlab");
		element2.set("GlobalId", guid.new());
		const guid1 = element.get("GlobalId") as string;
		const guid2 = element2.get("GlobalId") as string;
		expectElements(subject.filterElements(file, guid1), [element]);
		expectElements(subject.filterElements(file, `${guid1}, ${guid2}`), [element, element2]);
		expectElements(subject.filterElements(file, `${guid1}, ${guid2}, ! ${guid2}`), [element]);
		expectElements(subject.filterElements(file, `IfcElement, ! ${guid2}`), [element]);
	});

	// Python: `test_selecting_by_class`.
	test("selecting by class: literal and negation", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("Name", "Foo");
		const element2 = file.createEntity("IfcSlab");
		expectElements(subject.filterElements(file, "IfcWall"), [element]);
		expectElements(subject.filterElements(file, "IfcElement, ! IfcWall"), [element2]);
	});

	// Python: `test_select_without_elements_token`.
	test("an attribute filter with no leading class defaults to all IfcProduct/IfcTypeProduct", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("Name", "Foo");
		const element2 = file.createEntity("IfcWall");
		element2.set("Name", "Bar");
		file.createEntity("IfcSlab");
		expectElements(subject.filterElements(file, "Name=Foo"), [element]);
	});

	// Python: `test_selecting_by_attribute`.
	test("selecting by attribute: literal, quoted, regex, NULL, multiple attributes, PredefinedType", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("Name", "Foo");
		const element2 = file.createEntity("IfcWall");
		element2.set("Name", "Bar");
		file.createEntity("IfcSlab");
		expectElements(subject.filterElements(file, "IfcWall, Name=Foo"), [element]);

		element.set("Name", 'Foo\'s "quoted" name...');
		expectElements(subject.filterElements(file, 'IfcWall, Name="Foo\'s \\"quoted\\" name..."'), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Name=/Fo.*/"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Description=NULL"), [element, element2]);

		element.set("Name", "Foo");
		element.set("Description", "Foobar");
		expectElements(subject.filterElements(file, "IfcWall, Name=Foo, Description=Foobar"), [element]);

		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "SOLIDWALL");
		assignType(file, element, elementType);
		expectElements(subject.filterElements(file, "IfcWall, PredefinedType=SOLIDWALL"), [element]);
	});

	// Python: `test_selecting_by_type`.
	test("selecting by type facet: Name, quoted, regex, GlobalId", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		expectElements(subject.filterElements(file, "IfcWall, type=Foo"), []);
		elementType.set("Name", "Foo");
		expectElements(subject.filterElements(file, "IfcWall, type=Foo"), [element]);
		expectElements(subject.filterElements(file, 'IfcWall, type="Foo"'), [element]);
		expectElements(subject.filterElements(file, "IfcWall, type=/Fo.*/"), [element]);
		elementType.set("GlobalId", guid.new());
		expectElements(subject.filterElements(file, `IfcWall, type=${elementType.get("GlobalId")}`), [element]);
	});

	// Python: `test_selecting_by_material`.
	test("selecting by material: NULL, Name, negation", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		expectElements(subject.filterElements(file, "IfcWall, material=NULL"), [element, element2]);
		const material = file.createEntity("IfcMaterial");
		material.set("Name", "CON01");
		assignMaterial(file, [element], material);
		expectElements(subject.filterElements(file, "IfcWall, material=CON01"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, material!=CON01"), [element2]);
	});

	// Python: `test_selecting_by_property`.
	test("selecting by property: literal/quoted/regex prop names, boolean, numeric, enum list", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		addPset(file, element, "Foobar", { Foo: "Bar", Bar: false, Baz: 123 });
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Foo=Bar"), [element]);
		expectElements(subject.filterElements(file, 'IfcWall, Foobar."Foo"=Bar'), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar./Fo.*/=Bar"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar./Fo.*/!=Bar"), [element2]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Bar=FALSE"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Baz=123"), [element]);

		const wallCommon = addPset(file, element, "Pset_WallCommon");
		setListProperty(file, wallCommon, "Status", ["New"]);
		expectElements(subject.filterElements(file, "IfcWall, Pset_WallCommon.Status=New"), [element]);

		// On multi-valued properties, != means "no value equals" and stays the
		// complement of = (#8129).
		setListProperty(file, wallCommon, "Status", ["New", "Demolish"]);
		expectElements(subject.filterElements(file, "IfcWall, Pset_WallCommon.Status=New"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Pset_WallCommon.Status!=New"), [element2]);
		expectElements(subject.filterElements(file, "IfcWall, Pset_WallCommon.Status!=Temporary"), [element, element2]);
	});

	// Python: `test_selecting_by_property_with_comparisons`.
	test("selecting by property with comparisons: >, <, >=, <=, *=, !*=", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		addPset(file, element, "Foobar", { Baz: 123, Foo: "Bar" });
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Baz>100"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Baz<100"), []);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Baz>=100"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Baz<=100"), []);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Foo*=ar"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Foo!*=ar"), [element2]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Foo*=Foo"), []);
	});

	// Python: `test_selecting_by_classification`.
	test("selecting by classification: NULL, Identification, Name, negation", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		expectElements(subject.filterElements(file, "IfcWall, classification=NULL"), [element, element2]);
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("Identification", "X");
		reference.set("Name", "Foobar");
		reference.set("ReferencedSource", classification);
		assignClassification(file, [element], reference);
		expectElements(subject.filterElements(file, "IfcWall, classification=NULL"), [element2]);
		expectElements(subject.filterElements(file, "IfcWall, classification=X"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, classification=Foobar"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, classification!=X"), [element2]);
	});

	// Python: `test_selecting_by_location`.
	test("selecting by location: spatial container ancestry, NULL, negation, GlobalId", () => {
		const file = newFile();
		// `element2` (whose *direct* container, `storey`, is also an *ancestor* of
		// `element`'s direct container `space`) is created -- and therefore, via
		// `file.byType("IfcWall")`'s creation-order result, processed by
		// `FacetRunner.applyLocation` -- *before* `element`. See
		// `FacetRunner.getContainerTree`'s own comment and this module's "Chunk 2"
		// header comment (finding 6) for why this order matters: querying `storey`
		// directly first (a cache miss, freshly walking and including `storey` itself)
		// before it's ever visited as a *mid-walk ancestor* of `space`'s own query
		// avoids a real, faithfully-reproduced Python caching quirk where a cache *hit*
		// excludes the queried node from its own result.
		const element2 = file.createEntity("IfcWall");
		const element = file.createEntity("IfcWall");
		const space = file.createEntity("IfcSpace");
		space.set("Name", "Space");
		space.set("GlobalId", guid.new());
		const storey = file.createEntity("IfcBuildingStorey");
		storey.set("Name", "G");
		// GlobalId must be a real, non-null value on every container in the ancestry
		// chain here -- an unset `GlobalId` is `null`, which would otherwise spuriously
		// match `location=NULL` below (Python's fixtures always get one, via
		// `ifcopenshell.api.root.create_entity`'s auto-generation; this file's own
		// bare `file.createEntity(...)` doesn't, per this file's header comment).
		storey.set("GlobalId", guid.new());
		const building = file.createEntity("IfcBuilding");
		building.set("Name", "Building");
		building.set("GlobalId", guid.new());
		const project = file.createEntity("IfcProject");
		project.set("Name", "Project");
		containElement(file, space, [element]);
		containElement(file, storey, [element2]);
		assignAggregate(file, storey, [space]);
		assignAggregate(file, building, [storey]);
		assignAggregate(file, project, [building]);
		expectElements(subject.filterElements(file, "IfcWall, location=NULL"), []);
		expectElements(subject.filterElements(file, "IfcWall, location=Space"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, location=G"), [element, element2]);
		expectElements(subject.filterElements(file, "IfcWall, location=Building"), [element, element2]);
		expectElements(subject.filterElements(file, "IfcWall, location!=Space"), [element2]);
		expectElements(subject.filterElements(file, `IfcWall, location=${space.get("GlobalId")}`), [element]);
	});

	// No Python counterpart -- a regression/documentation test for a real,
	// faithfully-reproduced Python quirk found by this chunk's own adversarial review
	// (this module's "Chunk 2" header comment, finding 6, and `getContainerTree`'s own
	// comment): `get_container_tree`'s memoization caches each visited ancestor's
	// *remaining* tree (excluding the node itself), so a later direct query for that
	// same node (a cache *hit*) silently omits it from its own result -- here,
	// processing `space` (whose ancestry walk passes through `storey` and caches
	// `storey`'s entry) *before* `storey` is ever queried directly makes the *later*
	// direct `location=G` query against `storey`'s own element wrongly exclude
	// `storey`/"G" itself. Deliberately reproduced (not "fixed") to match upstream; the
	// test above avoids it by choosing a safe creation order, this test demonstrates it.
	test("getContainerTree's cache quirk: a node visited as a mid-walk ancestor before being queried directly loses itself from its own cached tree", () => {
		const file = newFile();
		// Creation order here matters: `element` (space-direct) is processed first,
		// populating `storey`'s cache entry (`[building]`, excluding `storey` itself)
		// as a side effect of walking `space`'s full ancestry -- then `element2`
		// (storey-direct) hits that same, now-incomplete cache entry.
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const space = file.createEntity("IfcSpace");
		space.set("Name", "Space");
		const storey = file.createEntity("IfcBuildingStorey");
		storey.set("Name", "G");
		const building = file.createEntity("IfcBuilding");
		building.set("Name", "Building");
		const project = file.createEntity("IfcProject");
		containElement(file, space, [element]);
		containElement(file, storey, [element2]);
		assignAggregate(file, storey, [space]);
		assignAggregate(file, building, [storey]);
		assignAggregate(file, project, [building]);

		// `element` (queried via a fresh walk starting at `space`) correctly matches.
		// `element2` (queried directly against the now-cached, self-excluding `storey`
		// entry) does *not* -- even though `storey` genuinely is its direct container.
		expectElements(subject.filterElements(file, "IfcWall, location=G"), [element]);
		// A second call reuses the (still-incomplete) cache identically -- this isn't a
		// one-off transient effect, it persists on the `FacetRunner` for the query's
		// lifetime (a fresh `filter_elements` call gets a fresh `FacetTransformer`/
		// `FacetRunner`, so it doesn't leak across separate top-level calls).
		expectElements(subject.filterElements(file, "IfcWall, location=G"), [element]);
	});

	// Python: `test_selecting_by_group`.
	test("selecting by group: Name, negation, GlobalId", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		group.set("Name", "Foo");
		group.set("GlobalId", guid.new());
		assignGroup(file, group, [element]);
		expectElements(subject.filterElements(file, "IfcWall, group=Foo"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, group!=Foo"), [element2]);
		expectElements(subject.filterElements(file, `IfcWall, group=${group.get("GlobalId")}`), [element]);
	});

	// Python: `test_selecting_by_parent`.
	test("selecting by parent: aggregation ancestry, containment, decomposition children", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("Name", "Element1");
		const element2 = file.createEntity("IfcWall");
		element2.set("Name", "Element2");
		const element3 = file.createEntity("IfcWall");
		element3.set("Name", "Element3");
		const space = file.createEntity("IfcSpace");
		space.set("Name", "Space");
		const storey = file.createEntity("IfcBuildingStorey");
		storey.set("Name", "G");
		const building = file.createEntity("IfcBuilding");
		building.set("Name", "Building");
		const project = file.createEntity("IfcProject");
		project.set("Name", "Project");
		containElement(file, space, [element]);
		containElement(file, storey, [element2]);
		assignAggregate(file, element2, [element3]);
		assignAggregate(file, storey, [space]);
		assignAggregate(file, building, [storey]);
		assignAggregate(file, project, [building]);
		expectElements(subject.filterElements(file, "IfcWall, parent=Project"), [element, element2, element3]);
		expectElements(subject.filterElements(file, "IfcWall, parent=Space"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, parent=G"), [element, element2, element3]);
		expectElements(subject.filterElements(file, "IfcWall, parent=Element2"), [element2, element3]);
	});

	// Python: `test_selecting_multiple_filter_groups`.
	test("multiple filter groups joined by '+' union together, each internally narrowed", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("Name", "Foo");
		const element2 = file.createEntity("IfcSlab");
		element2.set("Name", "Bar");
		expectElements(subject.filterElements(file, "IfcWall + IfcSlab"), [element, element2]);
		expectElements(subject.filterElements(file, "IfcWall, IfcSlab, Name=Foo"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Name=Foo + IfcSlab"), [element, element2]);
		expectElements(subject.filterElements(file, "IfcWall, Name=Foo + IfcSlab, Name=Bar"), [element, element2]);
	});

	// Python: `test_block_comments_are_ignored`.
	test("block comments are ignored, including one that leaves a dangling trailing '+'", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("Name", "Foo");
		const element2 = file.createEntity("IfcSlab");
		element2.set("Name", "Bar");
		expectElements(subject.filterElements(file, "IfcWall /* + IfcSlab */"), [element]);
		expectElements(subject.filterElements(file, "IfcWall + /* IfcSlab */"), [element]);
		expectElements(subject.filterElements(file, "/* IfcWall + */ IfcSlab"), [element2]);
		expectElements(subject.filterElements(file, "IfcWall /* commented */ + IfcSlab"), [element, element2]);
		expectElements(subject.filterElements(file, "IfcWall + /* multi\nline\ncomment */ IfcSlab"), [element, element2]);
		element.set("Name", "a/*b");
		expectElements(subject.filterElements(file, 'IfcWall, Name="a/*b"'), [element]);
	});

	// Python: `test_using_elements_argument`.
	test("a seeded `elements` set narrows/unions within that set only, not the whole file", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const slab = file.createEntity("IfcSlab");
		const door = file.createEntity("IfcDoor");
		const seed = new Set([wall, slab]);
		const results = subject.filterElements(file, "IfcWall", seed);
		expect(ids(results)).not.toEqual(ids(seed));
		expectElements(results, [wall]);
		const seed2 = new Set([wall, slab, door]);
		expectElements(subject.filterElements(file, "IfcWall, IfcSlab", seed2), [wall, slab]);
	});

	// Python: `test_editing_in_place`. `editInPlace` currently has no observable effect
	// on the result -- see this module's "Chunk 2" header comment, finding 4 -- so this
	// only re-confirms content equality, matching what the real Python test itself
	// actually asserts (`==`, not `is`).
	test("editInPlace=true produces an equivalent-content result", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const originalSet = new Set([wall]);
		const newSet = subject.filterElements(file, "IfcWall", originalSet, true);
		expectElements(newSet, [wall]);
	});

	// No Python counterpart in `test_selector.py`'s `TestFilterElements` (the `query:`
	// facet has no dedicated test there), but confirms it reuses `getElementValue`
	// directly (this module's "Chunk 2" header comment says so, and this exercises
	// that end-to-end via a dotted key path, which -- per the `query:` grammar's own
	// `keys` production -- must be quoted to include a `.`).
	test("selecting via the query: facet reuses the key-path mini-language", () => {
		const file = newFile();
		const wallType = file.createEntity("IfcWallType");
		wallType.set("Name", "Foo");
		const element = file.createEntity("IfcWall");
		assignType(file, element, wallType);
		const element2 = file.createEntity("IfcWall");
		expectElements(subject.filterElements(file, 'IfcWall, query:"type.Name"=Foo'), [element]);
		expectElements(subject.filterElements(file, "IfcWall, query:class=IfcWall"), [element, element2]);
	});

	// No Python counterpart -- `filter_elements(file, "")` returns `elements` (or a
	// fresh empty set) directly, without invoking the grammar at all.
	test("an empty query returns the seed elements unchanged, or an empty set with no seed", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(subject.filterElements(file, "").size).toBe(0);
		const seed = new Set([wall]);
		expect(subject.filterElements(file, "", seed)).toBe(seed);
	});

	// No Python counterpart -- documents this port's disclosed `int`-vs-`float`
	// divergence (this module's "Chunk 2" header comment, finding 2): plain numeric
	// comparisons behave identically to Python either way.
	test("numeric attribute/property comparisons work the same whether the value looks like an int or a float", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		addPset(file, element, "Qty", { Count: 5 });
		expectElements(subject.filterElements(file, "IfcWall, Qty.Count=5"), [element]);
		expectElements(subject.filterElements(file, 'IfcWall, Qty.Count="5.0"'), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Qty.Count>4"), [element]);
		expectElements(subject.filterElements(file, 'IfcWall, Qty.Count>"4.5"'), [element]);
	});

	// No Python counterpart -- regression test for a bug found and fixed during code
	// review of this port: Python's `isinstance(element_value, int)` in `compare()` is
	// also true for `bool` (`bool` subclasses `int` in Python), so a boolean property
	// compared against a numeric-style string value takes the *numeric* comparison
	// branch there (`True == int("1")`), not the final `element_value == value`
	// fallback. `compareValues` must coerce `true`/`false` to `1`/`0` before the
	// numeric branch to match.
	test("boolean property/attribute values compare correctly against numeric-style string values (Python bool-is-int)", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		addPset(file, element, "Foobar", { Bar: true });
		addPset(file, element2, "Foobar", { Bar: false });
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Bar=1"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Bar=0"), [element2]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Bar!=1"), [element2]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Bar>=1"), [element]);
		expectElements(subject.filterElements(file, "IfcWall, Foobar.Bar<1"), [element2]);
	});

	// No Python counterpart -- documents `compareValues`'s faithfully-reproduced
	// `TypeError` crash for a `/regex/` value compared against a non-string element
	// value (selector.py's own `compare()` has no `try`/`except` around this specific
	// branch, unlike the numeric-parsing branch).
	test("a regex value against a non-string element value throws (matches Python's uncaught TypeError)", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		addPset(file, element, "Qty", { Count: 5 });
		expect(() => subject.filterElements(file, "IfcWall, Qty.Count=/5/")).toThrow(TypeError);
	});
});

// --- `format` -- port of `test_selector.py`'s `TestFormat`, plus original coverage of
// the hand-rolled parser's own structure (operator precedence, nested calls, malformed
// input) and every disclosed Python/JS semantic divergence noted in `src/util/
// selector.ts`'s own "format()" section header comment. ---

describe("selector.format", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	// Python: `test_no_formatting`.
	test("bare literals pass through unchanged", () => {
		expect(subject.format("123")).toBe("123");
		expect(subject.format('"123"')).toBe("123");
		expect(subject.format('"foo"')).toBe("foo");
	});

	// Python: `test_string_formatting`.
	test("string functions: upper, lower, title, concat, substr", () => {
		expect(subject.format('upper("fOo")')).toBe("FOO");
		expect(subject.format('lower("fOo")')).toBe("foo");
		expect(subject.format('title("fOo")')).toBe("Foo");
		expect(subject.format('concat("fOo", "bar")')).toBe("fOobar");
		expect(subject.format('upper(concat("fOo", "bar"))')).toBe("FOOBAR");
		expect(subject.format('substr("foobar", 3)')).toBe("bar");
		expect(subject.format('substr("foobar", 1, 2)')).toBe("o");
		expect(subject.format('substr("foobar", 1, -1)')).toBe("ooba");
	});

	// Python: `test_number_formatting`.
	test("numeric functions: round, int, number, metric_length, imperial_length", () => {
		expect(subject.format("round(123, 5)")).toBe("125");
		expect(subject.format('round("123", 5)')).toBe("125");
		expect(subject.format("round(-123, 5)")).toBe("-125");
		// Non-numeric values must pass through unchanged instead of crashing (#6776).
		expect(subject.format('round("Level 1", 0.01)')).toBe("Level 1");
		expect(subject.format('round("12.5 m", 0.01)')).toBe("12.5 m");
		expect(subject.format("int(123.123)")).toBe("123");
		expect(subject.format("int(123)")).toBe("123");
		expect(subject.format("number(123)")).toBe("123");
		expect(subject.format("number(1234.56)")).toBe("1,234.56");
		expect(subject.format('number(123, ".")')).toBe("123");
		expect(subject.format('number("123", ".")')).toBe("123");
		expect(subject.format('number(123.12, ".")')).toBe("123.12");
		expect(subject.format('number(123.12, ",")')).toBe("123,12");
		expect(subject.format('number(1234.12, ",", ".")')).toBe("1.234,12");
		expect(subject.format("metric_length(123, 5, 2)")).toBe("125.00");
		expect(subject.format("metric_length(123.123, 0.1, 2)")).toBe("123.10");
		expect(subject.format('metric_length("123", 5, 2)')).toBe("125.00");
		expect(subject.format("imperial_length(1, 1)")).toBe("1'");
		expect(subject.format("imperial_length(3.123, 1)")).toBe("3' - 1\"");
		expect(subject.format("imperial_length(3.123, 2)")).toBe("3' - 1 1/2\"");
		expect(subject.format('imperial_length("3.123", 2)')).toBe("3' - 1 1/2\"");
		expect(subject.format('imperial_length("123.123", 2, "inch", "foot")')).toBe("10' - 3\"");
		expect(subject.format('imperial_length("123.123", 2, "inch", "inch")')).toBe('123"');
		expect(subject.format('imperial_length(3.0, 4, "foot", "foot", true)')).toBe("3'");
		expect(subject.format('imperial_length(3.0, 4, "foot", "foot", True)')).toBe("3'");
		expect(subject.format('imperial_length(3.0, 4, "foot", "foot", false)')).toBe("3' - 0\"");
		expect(subject.format('imperial_length(3.0, 4, "foot", "foot", False)')).toBe("3' - 0\"");
	});

	// Python: `test_variable_formatting`.
	test("{{query_path}} variable interpolation", () => {
		expect(subject.format("{{undefined}}")).toBeNull();
		expect(subject.format("upper({{undefined}})")).toBe("NONE");
		expect(subject.format("int({{undefined}})")).toBe("0");
		const file = newFile();
		const element = file.createEntity("IfcWall");
		expect(subject.format("{{undefined}}", element)).toBeNull();
		expect(subject.format("{{class}}", element)).toBe("IfcWall");
		expect(subject.format("{{ class }}", element)).toBe("IfcWall");
		expect(subject.format("upper({{ class }})", element)).toBe("IFCWALL");
	});

	// Python: `test_list_formatting`.
	test("list functions over a {{...}} result: sort, reverse, join, and bare auto-join", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		material.set("Name", "CON01");
		const material2 = file.createEntity("IfcMaterial");
		material2.set("Name", "CON03");
		const material3 = file.createEntity("IfcMaterial");
		material3.set("Name", "CON02");
		const materialSet = buildMaterialLayerSet(file, "FOO", [
			{ material, name: "L1" },
			{ material: material2, name: "L2" },
			{ material: material3, name: "L3" },
		]);
		assignMaterial(file, [element], materialSet);

		expect(subject.format("{{materials.Name}}", element)).toBe("CON01, CON03, CON02");
		expect(subject.format("sort({{materials.Name}})", element)).toBe("CON01, CON02, CON03");
		expect(subject.format("reverse({{materials.Name}})", element)).toBe("CON02, CON03, CON01");
		expect(subject.format('join("-", {{materials.Name}})', element)).toBe("CON01-CON03-CON02");
	});

	// Python: `test_expressions`.
	test("arithmetic expressions with operator precedence", () => {
		expect(subject.format("2+3")).toBe("5");
		expect(subject.format("-2+3")).toBe("1");
		expect(subject.format("2-3")).toBe("-1");
		expect(subject.format("3*2")).toBe("6");
		expect(subject.format("3/2")).toBe("1.5");
	});

	// Original coverage: operator precedence (`*`/`/` bind tighter than `+`/`-`) and
	// parenthesized grouping -- no dedicated Python test for this specific shape, but
	// directly implied by the grammar (`?mul_div` nests inside `?add_sub`).
	describe("operator precedence and grouping (no direct Python counterpart)", () => {
		test("multiplication/division bind tighter than addition/subtraction", () => {
			expect(subject.format("2+3*2")).toBe("8");
			expect(subject.format("2*3+2")).toBe("8");
			expect(subject.format("10-4/2")).toBe("8");
		});

		test("parentheses override precedence", () => {
			expect(subject.format("(2+3)*2")).toBe("10");
			expect(subject.format("2*(3+2)")).toBe("10");
		});

		test("left-associativity of subtraction and division", () => {
			expect(subject.format("10-3-2")).toBe("5");
			expect(subject.format("100/10/2")).toBe("5");
		});

		test("nested function calls with arithmetic sub-expressions", () => {
			expect(subject.format('concat(upper("a"), lower("B"), "c")')).toBe("Abc");
			expect(subject.format("round(2+3*4, 1)")).toBe("14");
		});
	});

	// Original coverage: divide()'s two divergences from the other three arithmetic ops
	// (right-operand default of 1.0, and the "inf" short-circuit for a zero divisor) --
	// no direct Python test exercises these specifically, but both are explicit branches
	// in `FormatTransformer.divide`'s own source.
	test("divide()'s zero-divisor short-circuit returns the literal string 'inf'", () => {
		expect(subject.format("5/0")).toBe("inf");
	});

	// Regression tests for two real bugs found by this chunk's own adversarial
	// `/code-review` (fixed, not shipped and deferred) -- see `src/util/selector.ts`'s
	// "format()" section header comment for the full writeup of each.
	describe("real bugs found by /code-review (regression coverage)", () => {
		test("round() with a zero rounding increment throws instead of silently returning the string 'NaN'", () => {
			expect(() => subject.format("round(5, 0)")).toThrow();
			expect(() => subject.format('round("123", 0)')).toThrow();
		});

		test("sort()/reverse() handle a list of booleans (Python's bool is an int subtype)", () => {
			// `join`/the top-level auto-join both require every element to already be a
			// `string` (matching Python's own `str.join()`), so a raw boolean list can't
			// be observed through those -- routed through `concat()` instead, whose
			// `pyStr` rendering of a list falls back to a bracketed `repr()`-style
			// rendering (see `pyStr`'s own doc comment), which is enough to observe both
			// that `sort()`/`reverse()` didn't throw and that the ordering is correct.
			//
			// Three separate `IfcPropertySingleValue` booleans (not an
			// `IfcPropertyListValue.ListValues` aggregate -- that path coerces a raw JS
			// `boolean` to a `0`/`1` number somewhere in this port's native attribute
			// serialization, an unrelated, pre-existing quirk this test isn't about)
			// collected into an array via a regex property-name key, matching how
			// `getElementValueForKeys`'s own regex-over-a-pset-dict path already works
			// (see that function's `isPlainRecord` branch above).
			const file = newFile();
			const element = file.createEntity("IfcWall");
			addPset(file, element, "Custom_Flags", { Flag1: true, Flag2: false, Flag3: true });

			expect(subject.format("concat(sort({{Custom_Flags./Flag.*/}}))", element)).toBe("[False, True, True]");
			expect(subject.format("concat(reverse({{Custom_Flags./Flag.*/}}))", element)).toBe("[True, False, True]");
		});
	});

	// Original coverage: malformed expressions should throw, not silently produce a
	// wrong answer -- exercises the hand-rolled parser's own error paths (no Python
	// counterpart; Python's `lark` grammar rejects the same inputs with its own parser
	// errors, but `test_selector.py` doesn't specifically assert on malformed input).
	describe("malformed input throws (no direct Python counterpart)", () => {
		test("unterminated function call", () => {
			expect(() => subject.format('upper("foo"')).toThrow();
		});

		test("unterminated quoted string", () => {
			expect(() => subject.format('"unterminated')).toThrow();
		});

		test("unterminated variable interpolation", () => {
			expect(() => subject.format("{{foo")).toThrow();
			expect(() => subject.format("{{foo}")).toThrow();
		});

		test("empty variable interpolation", () => {
			expect(() => subject.format("{{}}")).toThrow();
		});

		test("trailing garbage after a complete expression", () => {
			expect(() => subject.format("123 456")).toThrow();
		});

		test("a fractional imperial_length precision (grammar types it as plain NUMBER, not usable with int())", () => {
			expect(() => subject.format('imperial_length(3.0, 2.5, "foot", "foot")')).toThrow();
		});
	});
});
