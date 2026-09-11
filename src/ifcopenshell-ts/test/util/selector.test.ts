// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test_selector.py`'s `TestGetElementValue` class (src/
// ifcopenshell-python's `test/util/test_selector.py`, grep for
// `class TestGetElementValue(test.bootstrap.IFC4)`) -- covers only `get_element_value`
// (the key-path mini-language), matching `src/util/selector.ts`'s own scope (see that
// file's header comment). `TestFormat`/`TestFilterElements`/`TestSetElementValue*` have
// no counterpart here -- `filter_elements`/`format`/`set_element_value` are separate,
// later chunks.
//
// Python's own fixtures go through `ifcopenshell.api.*` (`api.root.create_entity`,
// `api.material.add_material`/`add_material_set`/`add_layer`/`assign_material`,
// `api.pset.add_pset`/`edit_pset`), none of which exist yet in this TS port (`api` is
// Phase 6+, planning/ifcopenshell-ts/20-roadmap.md). This file's local fixture helpers
// below build the same underlying entity graphs directly (`file.createEntity(...)` +
// `.set(...)`), matching `test/util/element.test.ts`'s own established pattern for this
// exact same gap (`buildProperties`/`addPset`/`addQto`/`assignType`/`assignMaterial`/
// `containElement`/`assignAggregate`/`assignGroup` below are the same shapes as that
// file's, trimmed to what this file's own tests need -- not imported from there since
// that file doesn't export them).
//
// Additional coverage beyond a direct `test_selector.py` port: `parseKeyPath` unit
// tests (no Python counterpart -- Python's grammar is parsed by `lark`, this port's
// hand-rolled scanner has its own edge cases worth covering directly), the disclosed
// positional/geolocated-key blocker (`src/util/selector.ts`'s finding #1 -- UPDATED by
// Phase 4's `util.placement` chunk: `x`/`y`/`z` are now real, covered by a new test
// below reading an actual computed translation, not just the blocker firing; `easting`/
// `northing`/`elevation`/`rotation_x`/`rotation_y`/`rotation_z` remain blocked. Python's
// own suite has a `test_selecting_an_elements_rotation_using_a_query` test that
// exercises the *still-unblocked* `rotation_*` computation, which this port cannot yet
// reproduce; the blocker itself has no Python counterpart by definition), and the narrow
// `profiles`/`classification`/`system`/`zone`/spatial-parent key re-implementations
// (`selector.ts`'s finding #2) --
// none of which have a dedicated `TestGetElementValue` case in the real Python source
// either (that class only exercises `class`/`id`/`Name`/`rotation_*`/material-set
// item/indexing/pset/nested-complex-quantity paths), so these are original coverage of
// documented Python behavior (`_get_element_value`'s own source), not ports of existing
// Python tests.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
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

	describe("positional/geolocated keys -- x/y/z now real, easting/northing/elevation/rotation_* still a disclosed blocker (see src/util/selector.ts's header comment, finding #1)", () => {
		// `x`/`y`/`z` are now fully computed via the real, landed `util.placement
		// .getLocalPlacement` -- needs a real, fully-formed `RelativePlacement` (unlike
		// the still-blocked keys below, which throw before ever touching the matrix).
		test("x/y/z read the real translation off the element's world-space placement matrix", () => {
			const file = newFile();
			const element = file.createEntity("IfcWall");
			const point = file.createEntity("IfcCartesianPoint", [1, 2, 3]);
			const axis2Placement = file.createEntity("IfcAxis2Placement3D", point);
			const localPlacement = file.createEntity("IfcLocalPlacement");
			localPlacement.set("RelativePlacement", axis2Placement);
			element.set("ObjectPlacement", localPlacement);

			expect(subject.getElementValue(element, "x")).toBe(1);
			expect(subject.getElementValue(element, "y")).toBe(2);
			expect(subject.getElementValue(element, "z")).toBe(3);
		});

		test("easting/northing/elevation/rotation_x/y/z still throw a clear, descriptive error naming the missing Python module when ObjectPlacement is actually set", () => {
			const file = newFile();
			const element = file.createEntity("IfcWall");
			const placement = file.createEntity("IfcLocalPlacement");
			element.set("ObjectPlacement", placement);

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
		// rest of that test exercises the real rotation-decomposition computation this
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
