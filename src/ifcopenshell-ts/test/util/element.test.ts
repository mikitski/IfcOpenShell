// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_element.py` (src/ifcopenshell-python), covering
// all three chunks' scope (see `src/util/element.ts`'s own header comment): chunk 1's
// pset/qto and type/material/style query functions, chunk 2's spatial/structural-graph
// query functions (container/decomposition/aggregation/nesting/grouping/void
// relationships), and chunk 3's structural-editing helpers (`copy`/`copyDeep`/
// `removeDeep`/`removeDeep2`/`batchRemoveDeep2`/`unbatchRemoveDeep2`/
// `replaceElement`/`replaceAttribute`). `get_shape_aspects`/`get_referenced_elements`
// remain unported (see `element.ts`'s own header comment for why) and have no tests
// here.
//
// Python's own test suite builds its fixtures via `ifcopenshell.api.*` (`api.root
// .create_entity`, `api.pset.add_pset`, `api.material.assign_material`,
// `api.spatial.assign_container`, `api.aggregate.assign_object`, ...) -- none of which
// exist yet in this TS port (`api` is Phase 6+, planning/ifcopenshell-ts/
// 20-roadmap.md). This file's `test/bootstrap.ts`-style local helpers below build the
// same underlying entity graphs directly (`file.createEntity(...)` + `.set(...)`,
// matching `test/file.test.ts`'s own established pattern for this codebase), matching
// Python's test *coverage* (the same behaviors/edge cases), not its exact fixture code.
//
// Several of chunk 2's own functions have no dedicated Python test class at all
// (`get_grouped_by`, `get_filled_void`, `get_voided_element`, `get_adhered_element`,
// `get_openings`/`has_openings` -- confirmed by grepping `test_element.py` for each
// name) -- for those, the tests below are original coverage of the documented Python
// behavior (`element.py`'s own docstrings/source), not a port of an existing Python
// test. Same for chunk 3's `replace_element` (also has no dedicated Python test class
// -- `replaceElement` is a thin wrapper around `replaceAttribute`, which does have
// Python coverage, ported below) and the dedicated Transaction/undo-redo integration
// test against `removeDeep2` (this chunk's own load-bearing correctness property, not
// something Python's suite -- which has no undo/redo system at all in its own
// `file.py` at the time this was ported -- would test the same way).
//
// One deliberate, disclosed test substitution: Python's `TestCopyDeepIFC4
// .test_copying_primitive_entities` builds its fixture via
// `self.file.createIfcLineIndex((1, 2))` -- constructing a standalone instance of a
// non-entity EXPRESS defined type (`IfcLineIndex = LIST [2:2] OF IfcPositiveInteger`).
// Confirmed directly against this port's own primitive layer (not assumed): this
// throws ("Attribute access is only supported on entity instances"), a real,
// *pre-existing* Phase 2 gap (`entityInstance.ts`'s own header comment already
// discloses this: attribute access on a standalone non-entity/simple-type instance
// isn't supported), unrelated to this chunk's own scope. `copyDeep`'s
// `test_copying_and_reusing_element_references`/exclude-filter tests below already
// exercise `copyDeep` against a `tuple`-of-`entity_instance` aggregate; this file
// substitutes an equivalent-spirit fixture for the primitive-value case using an
// ordinary entity's plain-number aggregate attribute (`IfcCartesianPoint.Coordinates`)
// instead of a standalone defined-type instance, covering the same `copyDeep` code
// path (a non-entity, non-entity-list attribute value is copied through unchanged)
// without depending on the pre-existing gap.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/element";
import { AVAILABLE_SCHEMAS, type Schema, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment) ---

function buildProperties(file: IfcFile, properties: Record<string, unknown>): EntityInstance[] {
	return Object.entries(properties).map(([key, value]) => {
		const prop = file.createEntity("IfcPropertySingleValue");
		prop.set("Name", key);
		prop.set("NominalValue", value);
		return prop;
	});
}

/** `entity.set(name, value)`, silently ignoring "no such attribute" -- used only for
 * `Name`/`Properties` on `IfcMaterialProperties`/`IfcProfileProperties`, which IFC2X3
 * declares as a near-empty abstract entity (only `Material`/`ProfileDefinition`; `Name`/
 * `Properties` are IFC4+ additions on those two specific classes) -- IFC2X3 support for
 * material/profile psets is itself deliberately limited to `IfcExtendedMaterialProperties`
 * (see `get_pset`/`get_psets`' own IFC2X3 branch), not this generic construction path;
 * this fixture helper is reused for `getElementsByPset`'s IFC2X3-parameterized tests too,
 * which only need `Material`/`ProfileDefinition` set, not `Name`/`Properties`. */
function trySet(entity: EntityInstance, name: string, value: unknown): void {
	try {
		entity.set(name, value);
	} catch {
		// Not declared on this class/schema version -- fine, see the doc comment above.
	}
}

/** Attaches a new property-set-like `definition` entity to `product`, dispatching to
 * whichever of `get_pset`/`get_psets`' "where do psets live" branches applies to
 * `product`'s class -- an `IfcPropertySet` (or `IfcElementQuantity`) via
 * `HasPropertySets` for an `IfcTypeObject`, via `IfcRelDefinesByProperties` for any other
 * `IfcObject`, or (for materials/profiles) a purpose-built `IfcMaterialProperties`/
 * `IfcProfileProperties` instance whose own forward `Material`/`ProfileDefinition`
 * attribute points back at `product` -- materials/profiles have no *forward*
 * `HasProperties` attribute to attach into (it's the inverse of that same forward
 * attribute), unlike `IfcTypeObject.HasPropertySets`. */
function addPset(
	file: IfcFile,
	product: EntityInstance,
	name: string,
	properties: Record<string, unknown> = {},
): EntityInstance {
	if (product.isA("IfcTypeObject")) {
		const pset = file.createEntity("IfcPropertySet");
		pset.set("Name", name);
		pset.set("HasProperties", buildProperties(file, properties));
		const existing = (product.get("HasPropertySets") as EntityInstance[] | null) ?? [];
		product.set("HasPropertySets", [...existing, pset]);
		return pset;
	}
	if (product.isA("IfcMaterial") || product.isA("IfcMaterialDefinition")) {
		const pset = file.createEntity("IfcMaterialProperties");
		trySet(pset, "Name", name);
		trySet(pset, "Properties", buildProperties(file, properties));
		pset.set("Material", product);
		return pset;
	}
	if (product.isA("IfcProfileDef")) {
		const pset = file.createEntity("IfcProfileProperties");
		trySet(pset, "Name", name);
		trySet(pset, "Properties", buildProperties(file, properties));
		pset.set("ProfileDefinition", product);
		return pset;
	}
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
			// IfcQuantityCount is a generic IfcPhysicalSimpleQuantity subtype (unitless
			// CountValue) -- get_quantity/get_quantities only ever read index 0 (Name) and
			// index 3 (the "XXXValue" slot), the same position across every
			// IfcPhysicalSimpleQuantity subtype, so a single subtype suffices for these
			// fixtures regardless of what the property name suggests semantically.
			const quantity = file.createEntity("IfcQuantityCount");
			quantity.set("Name", key);
			quantity.set("CountValue", value);
			return quantity;
		}),
	);
	if (product.isA("IfcTypeObject")) {
		const existing = (product.get("HasPropertySets") as EntityInstance[] | null) ?? [];
		product.set("HasPropertySets", [...existing, qto]);
	} else {
		const rel = file.createEntity("IfcRelDefinesByProperties");
		rel.set("RelatedObjects", [product]);
		rel.set("RelatingPropertyDefinition", qto);
	}
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

function ids(instances: Iterable<EntityInstance>): number[] {
	return [...instances].map((i) => i.id()).sort((a, b) => a - b);
}

// --- chunk 2 fixture helpers (spatial/structural-graph relationships -- see this
// file's header comment; no Python/api counterpart, matching this file's existing
// `assignType`/`assignMaterial` pattern above) ---

function containElement(file: IfcFile, structure: EntityInstance, elements: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelContainedInSpatialStructure");
	rel.set("RelatingStructure", structure);
	rel.set("RelatedElements", elements);
	return rel;
}

function referenceStructure(file: IfcFile, structure: EntityInstance, elements: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelReferencedInSpatialStructure");
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

function assignNest(file: IfcFile, relatingObject: EntityInstance, relatedObjects: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelNests");
	rel.set("RelatingObject", relatingObject);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

function addOpening(file: IfcFile, element: EntityInstance, opening: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelVoidsElement");
	rel.set("RelatingBuildingElement", element);
	rel.set("RelatedOpeningElement", opening);
	return rel;
}

function addFilling(file: IfcFile, opening: EntityInstance, element: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelFillsElement");
	rel.set("RelatingOpeningElement", opening);
	rel.set("RelatedBuildingElement", element);
	return rel;
}

function assignGroup(file: IfcFile, group: EntityInstance, elements: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToGroup");
	rel.set("RelatingGroup", group);
	rel.set("RelatedObjects", elements);
	return rel;
}

function assignControl(file: IfcFile, control: EntityInstance, elements: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToControl");
	rel.set("RelatingControl", control);
	rel.set("RelatedObjects", elements);
	return rel;
}

// --- Psets / Qtos ---

// Python: `TestGetPsetIFC4`/`TestGetPsetsIFC4` (`test.bootstrap.IFC4`) -- not
// version-parameterized in Python's own suite, so not parameterized here either
// (`TestIFC2X3MaterialProfilePsets`, ported separately below, covers IFC2X3's
// deliberately-different material/profile pset support).
describe("util.element getPset/getPsets (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting the psets of a product as a dictionary", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		expect(subject.getPset(element, "name")).toBeNull();
		expect(subject.getPset(element, "name", "a")).toBeNull();
		const pset = addPset(file, element, "name", { a: "b" });
		expect(subject.getPset(element, "name")).toEqual({ a: "b", id: pset.id() });
		expect(subject.getPset(element, "name", "a")).toBe("b");
	});

	test("getting the psets of a product type as a dictionary", () => {
		const file = newFile();
		const typeElement = file.createEntity("IfcWallType");
		const pset = addPset(file, typeElement, "name", { x: "y" });
		expect(subject.getPset(typeElement, "name")).toEqual({ x: "y", id: pset.id() });
	});

	test("getting inherited psets", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const typeElement = file.createEntity("IfcWallType");
		assignType(file, element, typeElement);
		addPset(file, typeElement, "name", { a: 1, x: 1 });
		const pset = addPset(file, element, "name", { a: 2, b: 3 });

		const result = subject.getPset(element, "name") as Record<string, unknown>;
		expect(result.id).toBe(pset.id());
		expect(result.a).toBe(2);
		expect(result.x).toBe(1);
		expect(result.b).toBe(3);
		expect(subject.getPset(element, "name", "a")).toBe(2);
		expect(subject.getPset(element, "name", "x")).toBe(1);
		expect(subject.getPset(element, "name", "b")).toBe(3);

		addPset(file, typeElement, "name2", { z: false });
		expect(subject.getPset(element, "name2", "z")).toBe(false);

		expect(subject.getPset(element, "name", undefined, true)).toEqual(result);
		expect(subject.getPset(element, "name", undefined, false, true)).toBeNull();
	});

	test("excluding inherited psets", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const typeElement = file.createEntity("IfcWallType");
		assignType(file, element, typeElement);
		addPset(file, typeElement, "name", { a: 1, x: 1 });
		const pset = addPset(file, element, "name", { a: 2, b: 3 });

		const result = subject.getPset(element, "name", undefined, false, false, false) as Record<string, unknown>;
		expect(result.id).toBe(pset.id());
		expect(result.a).toBe(2);
		expect(result.b).toBe(3);
		expect("x" in result).toBe(false);
		expect(subject.getPset(element, "name", "a")).toBe(2);
		expect(subject.getPset(element, "name", "b")).toBe(3);
	});

	test("getting the psets of a material as a dictionary", () => {
		const file = newFile();
		const material = file.createEntity("IfcMaterial");
		expect(subject.getPset(material, "name")).toBeNull();
		expect(subject.getPset(material, "name", "x")).toBeNull();
		const pset = addPset(file, material, "name", { x: "y" });
		expect(subject.getPset(material, "name")).toEqual({ x: "y", id: pset.id() });
		expect(subject.getPset(material, "name", "x")).toBe("y");
	});

	test("getting the psets of a profile as a dictionary", () => {
		const file = newFile();
		const profile = file.createEntity("IfcCircleProfileDef");
		expect(subject.getPset(profile, "name")).toBeNull();
		expect(subject.getPset(profile, "name", "x")).toBeNull();
		const pset = addPset(file, profile, "name", { x: "y" });
		expect(subject.getPset(profile, "name")).toEqual({ x: "y", id: pset.id() });
		expect(subject.getPset(profile, "name", "x")).toBe("y");
	});

	test("getting psets from an element which cannot have psets", () => {
		const file = newFile();
		expect(subject.getPset(file.createEntity("IfcPerson"), "name")).toBeNull();
		expect(subject.getPset(file.createEntity("IfcPerson"), "name", "a")).toBeNull();
	});

	test("getting predefined psets", () => {
		const file = newFile();
		const element = file.createEntity("IfcDoorType");
		const pset = file.createEntity("IfcDoorLiningProperties");
		pset.set("Name", "My Lining");
		pset.set("LiningDepth", 42);
		element.set("HasPropertySets", [pset]);
		expect(subject.getPset(element, "My Lining")).toEqual({ LiningDepth: 42, id: pset.id() });
		expect(subject.getPset(element, "My Lining", undefined, true)).toEqual({ LiningDepth: 42, id: pset.id() });
	});

	// --- getPsets ---

	test("getPsets: getting the psets of a product as a dictionary", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		expect(subject.getPsets(element)).toEqual({});
		const pset = addPset(file, element, "name", { a: "b" });
		expect(subject.getPsets(element)).toEqual({ name: { a: "b", id: pset.id() } });
	});

	test("getPsets: getting the psets of a product type as a dictionary", () => {
		const file = newFile();
		const typeElement = file.createEntity("IfcWallType");
		expect(subject.getPsets(typeElement)).toEqual({});
		const pset = addPset(file, typeElement, "name", { x: "y" });
		expect(subject.getPsets(typeElement)).toEqual({ name: { x: "y", id: pset.id() } });
	});

	test("getPsets: getting inherited psets", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const typeElement = file.createEntity("IfcWallType");
		assignType(file, element, typeElement);
		addPset(file, typeElement, "name", { a: 1, x: 1 });
		const pset = addPset(file, element, "name", { a: 2, b: 3 });

		const psets = subject.getPsets(element);
		expect(psets.name.id).toBe(pset.id());
		expect(psets.name.a).toBe(2);
		expect(psets.name.x).toBe(1);
		expect(psets.name.b).toBe(3);
	});

	test("getPsets: getting the psets of a material as a dictionary", () => {
		const file = newFile();
		const material = file.createEntity("IfcMaterial");
		expect(subject.getPsets(material)).toEqual({});
		const pset = addPset(file, material, "name", { x: "y" });
		expect(subject.getPsets(material)).toEqual({ name: { x: "y", id: pset.id() } });
	});

	test("getPsets: getting the psets of a profile as a dictionary", () => {
		const file = newFile();
		const profile = file.createEntity("IfcCircleProfileDef");
		expect(subject.getPsets(profile)).toEqual({});
		const pset = addPset(file, profile, "name", { x: "y" });
		expect(subject.getPsets(profile)).toEqual({ name: { x: "y", id: pset.id() } });
	});

	test("getPsets: getting psets from an element which cannot have psets", () => {
		const file = newFile();
		expect(subject.getPsets(file.createEntity("IfcPerson"))).toEqual({});
	});

	test("getPsets: only getting psets and not qtos", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, element, "pset", { a: "b" });
		addQto(file, element, "qto", { x: 42 });
		expect(subject.getPsets(element, true)).toEqual({ pset: { a: "b", id: pset.id() } });
	});

	test("getPsets: only getting qtos and not psets", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		addPset(file, element, "pset", { a: "b" });
		const qto = addQto(file, element, "qto", { x: 42 });
		expect(subject.getPsets(element, false, true)).toEqual({ qto: { x: 42, id: qto.id() } });
	});

	test("getPsets: getting predefined psets", () => {
		const file = newFile();
		const element = file.createEntity("IfcDoorType");
		const pset = file.createEntity("IfcDoorLiningProperties");
		pset.set("Name", "My Lining");
		pset.set("LiningDepth", 42);
		element.set("HasPropertySets", [pset]);
		expect(subject.getPsets(element)).toEqual({ "My Lining": { LiningDepth: 42, id: pset.id() } });
		expect(subject.getPsets(element, true)).toEqual({ "My Lining": { LiningDepth: 42, id: pset.id() } });
	});
});

// `describe.skipIf` (not a bare `describe`) -- IFC2X3 isn't necessarily built into
// this environment's addon (`bootstrap.ts`'s own documented gap: CI currently builds
// the C++ core with `-DSCHEMA_VERSIONS=4`, IFC4 only). Mirrors every other
// schema-parameterized suite in this file, which drives off `AVAILABLE_SCHEMAS`
// rather than a literal `createTestFile("IFC2X3")` for exactly this reason.
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
	"util.element getPset/getPsets material/profile psets (IFC2X3)",
	() => {
		test("getting a profile pset is a no-op (unsupported in IFC2X3)", () => {
			const file = createTestFile("IFC2X3");
			const profile = file.createEntity("IfcRectangleProfileDef");
			const pset = file.createEntity("IfcProfileProperties");
			pset.set("ProfileDefinition", profile);
			// We don't support them (IFC2X3 profiles have no name), just making sure there
			// are no errors.
			expect(subject.getPset(profile, "Test")).toBeNull();
			expect(subject.getPsets(profile)).toEqual({});
		});

		test("getting a material's extended-properties pset", () => {
			const file = createTestFile("IFC2X3");
			const material = file.createEntity("IfcMaterial");
			const extended = file.createEntity("IfcExtendedMaterialProperties");
			extended.set("Material", material);
			extended.set("Name", "Test");
			const prop = file.createEntity("IfcPropertySingleValue");
			prop.set("Name", "GassPressure");
			prop.set("NominalValue", 25.0);
			extended.set("ExtendedProperties", [prop]);

			const psetData = subject.getPset(material, "Test") as Record<string, unknown>;
			expect(psetData.GassPressure).toBe(25.0);
			const psetsData = subject.getPsets(material);
			expect(psetsData.Test.GassPressure).toBe(25.0);
		});
	},
);

describe("util.element getPropertyDefinition (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting the properties of a pset", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, element, "name", { a: "b" });
		expect(subject.getPropertyDefinition(pset)).toEqual({ a: "b", id: pset.id() });
	});

	test("getting the properties of a qto", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, element, "name", { x: 42 });
		expect(subject.getPropertyDefinition(qto)).toEqual({ x: 42, id: qto.id() });
	});

	test("getting the properties of a material property", () => {
		const file = newFile();
		const pset = file.createEntity("IfcMaterialProperties");
		const prop = file.createEntity("IfcPropertySingleValue");
		prop.set("Name", "a");
		prop.set("NominalValue", "b");
		pset.set("Properties", [prop]);
		expect(subject.getPropertyDefinition(pset)).toEqual({ a: "b", id: pset.id() });
	});

	test("getting the properties of a profile property", () => {
		const file = newFile();
		const pset = file.createEntity("IfcProfileProperties");
		const prop = file.createEntity("IfcPropertySingleValue");
		prop.set("Name", "a");
		prop.set("NominalValue", "b");
		pset.set("Properties", [prop]);
		expect(subject.getPropertyDefinition(pset)).toEqual({ a: "b", id: pset.id() });
	});

	test("getting the properties of a predefined pset", () => {
		const file = newFile();
		const pset = file.createEntity("IfcDoorLiningProperties");
		pset.set("LiningDepth", 42);
		expect(subject.getPropertyDefinition(pset)).toEqual({ LiningDepth: 42, id: pset.id() });
	});

	test("getPropertyDefinition(null) returns null", () => {
		expect(subject.getPropertyDefinition(null)).toBeNull();
	});
});

describe("util.element getQuantities (IFC4)", () => {
	test("getting quantities from a qto", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, element, "name", { x: 42 });
		expect(subject.getQuantities(qto.get("Quantities") as EntityInstance[])).toEqual({ x: 42 });
	});
});

describe("util.element getProperties (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting no properties when none are available", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, element, "name");
		expect(subject.getProperties(pset.get("HasProperties") as EntityInstance[] | null)).toEqual({});
	});

	test("getting single properties from a list of properties", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, element, "name", { a: "b" });
		expect(subject.getProperties(pset.get("HasProperties") as EntityInstance[])).toEqual({ a: "b" });
	});

	test("getting complex properties from a list of properties", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, element, "pset");
		const complexProperty = file.createEntity("IfcComplexProperty");
		complexProperty.set("Name", "prop");
		complexProperty.set("UsageName", "usage_name");
		const nested = file.createEntity("IfcPropertySingleValue");
		nested.set("Name", "a");
		nested.set("NominalValue", "b");
		complexProperty.set("HasProperties", [nested]);
		pset.set("HasProperties", [complexProperty]);

		expect(subject.getProperties(pset.get("HasProperties") as EntityInstance[])).toEqual({
			prop: {
				UsageName: "usage_name",
				id: complexProperty.id(),
				type: "IfcComplexProperty",
				properties: { a: "b" },
			},
		});
	});

	test("getting complex properties verbose", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, element, "pset");
		const complexProperty = file.createEntity("IfcComplexProperty");
		complexProperty.set("Name", "prop");
		complexProperty.set("UsageName", "usage_name");
		const nested = file.createEntity("IfcPropertySingleValue");
		nested.set("Name", "a");
		nested.set("NominalValue", "b");
		complexProperty.set("HasProperties", [nested]);
		pset.set("HasProperties", [complexProperty]);

		const properties = subject.getProperties(pset.get("HasProperties") as EntityInstance[], true);
		const propValue = (properties.prop as Record<string, unknown>).value as Record<string, unknown>;
		const nestedProps = propValue.properties as Record<string, unknown>;
		const nestedProp = nestedProps.a as Record<string, unknown>;
		expect(properties).toEqual({
			prop: {
				id: complexProperty.id(),
				class: "IfcComplexProperty",
				value: {
					UsageName: "usage_name",
					id: complexProperty.id(),
					type: "IfcComplexProperty",
					properties: {
						a: {
							id: nestedProp.id,
							class: "IfcPropertySingleValue",
							value: "b",
							// Python's own test asserts `"value_type": "IfcLabel"` here --
							// see `src/util/element.ts`'s header comment (finding #2) on why
							// this port can't recover the EXPRESS type name of an
							// already-shim-unwrapped `NominalValue` and always returns
							// `null` instead. A disclosed, necessary divergence, not an
							// oversight.
							value_type: null,
						},
					},
				},
			},
		});
	});
});

// Python: parameterized IFC4 + IFC2X3 (`TestGetElementsUsingPset`/
// `TestGetElementsUsingPsetIFC2X3`) -- filtered through `AVAILABLE_SCHEMAS` rather
// than a literal `["IFC4", "IFC2X3"]` list, same reasoning as the `describe.skipIf`
// above: IFC2X3 isn't guaranteed built into this environment's addon.
describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4" || s === "IFC2X3"))(
	"util.element getElementsByPset (%s)",
	(schema) => {
		test("elements and element types using a pset", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");
			const elementType = file.createEntity("IfcWallType");
			const pset = file.createEntity("IfcPropertySet");
			const rel = file.createEntity("IfcRelDefinesByProperties");
			rel.set("RelatedObjects", [element]);
			rel.set("RelatingPropertyDefinition", pset);
			elementType.set("HasPropertySets", [pset]);

			expect(ids(subject.getElementsByPset(pset))).toEqual(ids([element, elementType]));
		});

		test("material using a pset", () => {
			const file = createTestFile(schema);
			const material = file.createEntity("IfcMaterial");
			const pset = addPset(file, material, "FooBar");
			expect(ids(subject.getElementsByPset(pset))).toEqual(ids([material]));
		});

		test("profile using a pset", () => {
			const file = createTestFile(schema);
			const profile = file.createEntity("IfcRectangleProfileDef");
			const pset = addPset(file, profile, "FooBar");
			expect(ids(subject.getElementsByPset(pset))).toEqual(ids([profile]));
		});

		// Regression test for a real bug found by this chunk's `/code-review` pass (see
		// `EntityInstanceSet`'s own doc comment above, in the "internal helpers" section):
		// `IfcMaterialProperties`/`IfcProfileProperties`' mandatory `Material`/
		// `ProfileDefinition` attribute not yet being set (e.g. mid-construction) used to
		// crash here with "Cannot read properties of null (reading 'identity')" --
		// Python's own `set().add(None)` never raises.
		test("does not crash when the pset's Material/ProfileDefinition isn't set yet", () => {
			const file = createTestFile(schema);
			const materialPset = file.createEntity("IfcMaterialProperties");
			expect(subject.getElementsByPset(materialPset)).toEqual(new Set());
			if (schema !== "IFC2X3") {
				const profilePset = file.createEntity("IfcProfileProperties");
				expect(subject.getElementsByPset(profilePset)).toEqual(new Set());
			}
		});
	},
);

// --- Type / material / style ---

describe("util.element getPredefinedType (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting an element predefined type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("PredefinedType", "PARTITIONING");
		expect(subject.getPredefinedType(element)).toBe("PARTITIONING");
	});

	test("getting an element userdefined type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("PredefinedType", "USERDEFINED");
		element.set("ObjectType", "FOOBAR");
		expect(subject.getPredefinedType(element)).toBe("FOOBAR");
	});

	test("getting an element type without a predefined type attribute", () => {
		const file = newFile();
		const element = file.createEntity("IfcAnnotation");
		element.set("ObjectType", "FOOBAR");
		expect(subject.getPredefinedType(element)).toBe("FOOBAR");
	});

	test("getting an inherited predefined type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "PARTITIONING");
		expect(subject.getPredefinedType(element)).toBe("PARTITIONING");
	});

	test("getting an inherited userdefined type for an element type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "USERDEFINED");
		elementType.set("ElementType", "FOOBAR");
		expect(subject.getPredefinedType(element)).toBe("FOOBAR");
	});

	test("getting an overridden predefined type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "NOTDEFINED");
		element.set("PredefinedType", "PARTITIONING");
		expect(subject.getPredefinedType(element)).toBe("PARTITIONING");
	});

	test("getting an inherited userdefined type for a process type", () => {
		const file = newFile();
		const element = file.createEntity("IfcTask");
		const elementType = file.createEntity("IfcTaskType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "USERDEFINED");
		elementType.set("ProcessType", "FOOBAR");
		expect(subject.getPredefinedType(element)).toBe("FOOBAR");
	});

	test("getting an element type predefined type", () => {
		const file = newFile();
		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "PARTITIONING");
		expect(subject.getPredefinedType(elementType)).toBe("PARTITIONING");
	});

	test("getting an element type null predefined type", () => {
		const file = newFile();
		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "NOTDEFINED");
		expect(subject.getPredefinedType(elementType)).toBe("NOTDEFINED");
	});
});

describe("util.element isUserdefinedType (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("a predefined element", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("PredefinedType", "PARTITIONING");
		expect(subject.isUserdefinedType(element)).toBe(false);
	});

	test("an element userdefined type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		element.set("PredefinedType", "USERDEFINED");
		element.set("ObjectType", "FOOBAR");
		expect(subject.isUserdefinedType(element)).toBe(true);
	});

	test("an element type without a predefined type attribute", () => {
		const file = newFile();
		const element = file.createEntity("IfcAnnotation");
		element.set("ObjectType", "FOOBAR");
		expect(subject.isUserdefinedType(element)).toBe(true);
	});

	test("an inherited predefined type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "PARTITIONING");
		expect(subject.isUserdefinedType(element)).toBe(false);
	});

	test("an inherited userdefined type for an element type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "USERDEFINED");
		elementType.set("ElementType", "FOOBAR");
		expect(subject.isUserdefinedType(element)).toBe(true);
	});

	test("an overridden predefined type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "NOTDEFINED");
		element.set("PredefinedType", "PARTITIONING");
		expect(subject.isUserdefinedType(element)).toBe(false);
	});

	test("an inherited userdefined type for a process type", () => {
		const file = newFile();
		const element = file.createEntity("IfcTask");
		const elementType = file.createEntity("IfcTaskType");
		assignType(file, element, elementType);
		elementType.set("PredefinedType", "USERDEFINED");
		elementType.set("ProcessType", "FOOBAR");
		expect(subject.isUserdefinedType(element)).toBe(true);
	});

	test("an element type predefined type", () => {
		const file = newFile();
		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "PARTITIONING");
		expect(subject.isUserdefinedType(elementType)).toBe(false);
	});

	test("an element type null predefined type", () => {
		const file = newFile();
		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "NOTDEFINED");
		expect(subject.isUserdefinedType(elementType)).toBe(false);
	});
});

describe.each(AVAILABLE_SCHEMAS)("util.element getType (%s)", (schema) => {
	test("getting the type of a product", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		expect(subject.getType(element)?.equals(elementType)).toBe(true);
		expect(subject.getType(elementType)?.equals(elementType)).toBe(true);
	});
});

describe.each(AVAILABLE_SCHEMAS)("util.element getTypes (%s)", (schema) => {
	test("getting the occurrences of a type", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		const types = subject.getTypes(elementType);
		expect(types).toHaveLength(1);
		expect(types[0].equals(element)).toBe(true);
	});
});

describe("util.element getMaterial (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting the material of a product", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		expect(subject.getMaterial(element)?.equals(material)).toBe(true);
	});

	test("getting a material list of a product", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		const materialList = file.createEntity("IfcMaterialList");
		materialList.set("Materials", [material]);
		const rel = assignMaterial(file, [element], materialList);
		expect(subject.getMaterial(element)?.equals(rel.get("RelatingMaterial") as EntityInstance)).toBe(true);
	});

	test("getting a material layer set of a product", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const layerSet = file.createEntity("IfcMaterialLayerSet");
		const rel = assignMaterial(file, [element], layerSet);
		expect(subject.getMaterial(element)?.equals(rel.get("RelatingMaterial") as EntityInstance)).toBe(true);
	});

	test("getting a material profile set of a product", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const profileSet = file.createEntity("IfcMaterialProfileSet");
		const rel = assignMaterial(file, [element], profileSet);
		expect(subject.getMaterial(element)?.equals(rel.get("RelatingMaterial") as EntityInstance)).toBe(true);
	});

	test("getting a material layer set usage of a product", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const usage = file.createEntity("IfcMaterialLayerSetUsage");
		usage.set("ForLayerSet", file.createEntity("IfcMaterialLayerSet"));
		const rel = assignMaterial(file, [element], usage);
		expect(subject.getMaterial(element)?.equals(rel.get("RelatingMaterial") as EntityInstance)).toBe(true);
	});

	test("getting a material profile set usage of a product", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const usage = file.createEntity("IfcMaterialProfileSetUsage");
		usage.set("ForProfileSet", file.createEntity("IfcMaterialProfileSet"));
		const rel = assignMaterial(file, [element], usage);
		expect(subject.getMaterial(element)?.equals(rel.get("RelatingMaterial") as EntityInstance)).toBe(true);
	});

	test("getting a material layer set indirectly from an assigned usage", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const layerSet = file.createEntity("IfcMaterialLayerSet");
		const usage = file.createEntity("IfcMaterialLayerSetUsage");
		usage.set("ForLayerSet", layerSet);
		assignMaterial(file, [element], usage);
		expect(subject.getMaterial(element, true)?.equals(layerSet)).toBe(true);
	});

	test("getting a material profile set indirectly from an assigned usage", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const profileSet = file.createEntity("IfcMaterialProfileSet");
		const usage = file.createEntity("IfcMaterialProfileSetUsage");
		usage.set("ForProfileSet", profileSet);
		assignMaterial(file, [element], usage);
		expect(subject.getMaterial(element, true)?.equals(profileSet)).toBe(true);
	});

	test("getting an inherited material from the element's type", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [elementType], material);
		expect(subject.getMaterial(element)?.equals(material)).toBe(true);
	});

	test("getting an overridden material from the element's occurrence", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		assignMaterial(file, [elementType], file.createEntity("IfcMaterial"));
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		expect(subject.getMaterial(element)?.equals(material)).toBe(true);
	});

	test("getting direct materials without checking inheritance", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		assignMaterial(file, [elementType], file.createEntity("IfcMaterial"));
		expect(subject.getMaterial(element, false, false)).toBeNull();
	});
});

describe("util.element getMaterials (IFC4)", () => {
	test("getting the materials of a product", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		const materials = subject.getMaterials(element);
		expect(materials).toHaveLength(1);
		expect(materials[0].equals(material)).toBe(true);
	});
});

describe("util.element getMaterialLayers / getMaterialProfiles (IFC4)", () => {
	test("getting material layers of an element with a layer set", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const layerSet = file.createEntity("IfcMaterialLayerSet");
		const material = file.createEntity("IfcMaterial");
		const layer = file.createEntity("IfcMaterialLayer");
		layer.set("Material", material);
		layer.set("LayerThickness", 100);
		layerSet.set("MaterialLayers", [layer]);
		assignMaterial(file, [element], layerSet);

		const layers = subject.getMaterialLayers(element);
		expect(layers).toHaveLength(1);
		expect(layers[0].priority).toBe(0);
		expect(layers[0].material?.equals(material)).toBe(true);
		expect(layers[0].thickness).toBe(100);
	});

	test("getting material layers of an element without a layer set", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		expect(subject.getMaterialLayers(element)).toEqual([]);
	});

	test("getting material profiles of an element with a profile set", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcBeam");
		const profileSet = file.createEntity("IfcMaterialProfileSet");
		const material = file.createEntity("IfcMaterial");
		const profile = file.createEntity("IfcRectangleProfileDef");
		const materialProfile = file.createEntity("IfcMaterialProfile");
		materialProfile.set("Material", material);
		materialProfile.set("Profile", profile);
		profileSet.set("MaterialProfiles", [materialProfile]);
		assignMaterial(file, [element], profileSet);

		const profiles = subject.getMaterialProfiles(element);
		expect(profiles).toHaveLength(1);
		expect(profiles[0].priority).toBe(0);
		expect(profiles[0].material?.equals(material)).toBe(true);
		expect(profiles[0].profile?.equals(profile)).toBe(true);
	});

	test("getting material profiles of an element without a profile set", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcBeam");
		expect(subject.getMaterialProfiles(element)).toEqual([]);
	});
});

describe("util.element getStyles (IFC4)", () => {
	test("getting the styles of a product (material style and representation-item style)", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		expect(subject.getStyles(element)).toEqual([]);

		const model = file.createEntity("IfcGeometricRepresentationContext");
		model.set("ContextType", "Model");
		const body = file.createEntity("IfcGeometricRepresentationSubContext");
		body.set("ContextType", "Model");
		body.set("ContextIdentifier", "Body");
		body.set("TargetView", "MODEL_VIEW");
		body.set("ParentContext", model);

		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);

		const style = file.createEntity("IfcSurfaceStyle");
		const styledItemForMaterial = file.createEntity("IfcStyledItem");
		styledItemForMaterial.set("Styles", [style]);
		const styledRepresentation = file.createEntity("IfcStyledRepresentation");
		styledRepresentation.set("ContextOfItems", body);
		styledRepresentation.set("Items", [styledItemForMaterial]);
		const materialDefinitionRepresentation = file.createEntity("IfcMaterialDefinitionRepresentation");
		materialDefinitionRepresentation.set("RepresentedMaterial", material);
		materialDefinitionRepresentation.set("Representations", [styledRepresentation]);
		// `IfcMaterial.HasRepresentation` is the *inverse* of
		// `IfcMaterialDefinitionRepresentation.RepresentedMaterial` (just set above) -- not
		// itself settable.

		expect(subject.getStyles(element).some((s) => s.equals(style))).toBe(true);

		const style2 = file.createEntity("IfcSurfaceStyle");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const styledItemForRepresentation = file.createEntity("IfcStyledItem");
		styledItemForRepresentation.set("Item", item);
		styledItemForRepresentation.set("Styles", [style2]);
		const shapeRepresentation = file.createEntity("IfcShapeRepresentation");
		shapeRepresentation.set("ContextOfItems", body);
		shapeRepresentation.set("Items", [item]);
		element.set(
			"Representation",
			(() => {
				const productShape = file.createEntity("IfcProductDefinitionShape");
				productShape.set("Representations", [shapeRepresentation]);
				return productShape;
			})(),
		);

		const styles = subject.getStyles(element);
		expect(styles.some((s) => s.equals(style))).toBe(true);
		expect(styles.some((s) => s.equals(style2))).toBe(true);
		expect(styles).toHaveLength(2);
	});
});

describe("util.element getElementsByMaterial (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting elements of a material", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		expect(ids(subject.getElementsByMaterial(file, material))).toEqual(ids([element]));
	});

	test("getting elements of a material layer set (via type and usage)", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		const material = file.createEntity("IfcMaterial");
		const layer = file.createEntity("IfcMaterialLayer");
		layer.set("Material", material);
		const materialSet = file.createEntity("IfcMaterialLayerSet");
		materialSet.set("MaterialLayers", [layer]);
		assignMaterial(file, [elementType], materialSet);
		const usage = file.createEntity("IfcMaterialLayerSetUsage");
		usage.set("ForLayerSet", materialSet);
		assignMaterial(file, [element], usage);

		expect(ids(subject.getElementsByMaterial(file, material))).toEqual(ids([element, elementType]));
		expect(ids(subject.getElementsByMaterial(file, materialSet))).toEqual(ids([element, elementType]));
		expect(ids(subject.getElementsByMaterial(file, usage))).toEqual(ids([element]));
	});

	test("getting elements of a material profile set (via type and usage)", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		const material = file.createEntity("IfcMaterial");
		const materialProfile = file.createEntity("IfcMaterialProfile");
		materialProfile.set("Material", material);
		const materialSet = file.createEntity("IfcMaterialProfileSet");
		materialSet.set("MaterialProfiles", [materialProfile]);
		assignMaterial(file, [elementType], materialSet);
		const usage = file.createEntity("IfcMaterialProfileSetUsage");
		usage.set("ForProfileSet", materialSet);
		assignMaterial(file, [element], usage);

		expect(ids(subject.getElementsByMaterial(file, material))).toEqual(ids([element, elementType]));
		expect(ids(subject.getElementsByMaterial(file, materialSet))).toEqual(ids([element, elementType]));
		expect(ids(subject.getElementsByMaterial(file, usage))).toEqual(ids([element]));
	});

	test("getting elements of a material constituent set", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		const constituent = file.createEntity("IfcMaterialConstituent");
		constituent.set("Material", material);
		const materialSet = file.createEntity("IfcMaterialConstituentSet");
		materialSet.set("MaterialConstituents", [constituent]);
		assignMaterial(file, [element], materialSet);

		expect(ids(subject.getElementsByMaterial(file, material))).toEqual(ids([element]));
		expect(ids(subject.getElementsByMaterial(file, materialSet))).toEqual(ids([element]));
	});

	test("getting elements of a material list", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		const materialSet = file.createEntity("IfcMaterialList");
		materialSet.set("Materials", [material]);
		assignMaterial(file, [element], materialSet);

		expect(ids(subject.getElementsByMaterial(file, material))).toEqual(ids([element]));
		expect(ids(subject.getElementsByMaterial(file, materialSet))).toEqual(ids([element]));
	});

	test("ifcFile=null falls back to material.file", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		expect(ids(subject.getElementsByMaterial(null, material))).toEqual(ids([element]));
	});
});

describe("util.element getElementsByStyle (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting elements of a styled representation item", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const style = file.createEntity("IfcSurfaceStyle");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Item", item);
		styledItem.set("Styles", [style]);
		const shapeRepresentation = file.createEntity("IfcShapeRepresentation");
		shapeRepresentation.set("Items", [item]);
		const productShape = file.createEntity("IfcProductDefinitionShape");
		productShape.set("Representations", [shapeRepresentation]);
		element.set("Representation", productShape);

		expect(ids(subject.getElementsByStyle(file, style))).toEqual(ids([element]));
	});

	test("getting elements of a styled mapped representation item", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const style = file.createEntity("IfcSurfaceStyle");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Item", item);
		styledItem.set("Styles", [style]);
		const innerRep = file.createEntity("IfcShapeRepresentation");
		innerRep.set("Items", [item]);
		const repMap = file.createEntity("IfcRepresentationMap");
		repMap.set("MappedRepresentation", innerRep);
		const mappedItem = file.createEntity("IfcMappedItem");
		mappedItem.set("MappingSource", repMap);
		const outerRep = file.createEntity("IfcShapeRepresentation");
		outerRep.set("Items", [mappedItem]);
		const productShape = file.createEntity("IfcProductDefinitionShape");
		productShape.set("Representations", [outerRep]);
		element.set("Representation", productShape);

		expect(ids(subject.getElementsByStyle(file, style))).toEqual(ids([element]));
	});

	test("getting type elements of a styled mapped representation item", () => {
		const file = newFile();
		const elementType = file.createEntity("IfcWallType");
		const style = file.createEntity("IfcSurfaceStyle");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Item", item);
		styledItem.set("Styles", [style]);
		const rep = file.createEntity("IfcShapeRepresentation");
		rep.set("Items", [item]);
		const repMap = file.createEntity("IfcRepresentationMap");
		repMap.set("MappedRepresentation", rep);
		elementType.set("RepresentationMaps", [repMap]);

		expect(ids(subject.getElementsByStyle(file, style))).toEqual(ids([elementType]));
	});

	test("getting elements of a styled material", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Styles", [style]);
		const styledRep = file.createEntity("IfcStyledRepresentation");
		styledRep.set("Items", [styledItem]);
		const materialDefRep = file.createEntity("IfcMaterialDefinitionRepresentation");
		materialDefRep.set("RepresentedMaterial", material);
		materialDefRep.set("Representations", [styledRep]);

		expect(ids(subject.getElementsByStyle(file, style))).toEqual(ids([element]));
	});

	test("getting elements of a styled material with curve style hatching", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		const curveStyle = file.createEntity("IfcCurveStyle");
		const fillStyle = file.createEntity("IfcFillAreaStyleHatching");
		fillStyle.set("HatchLineAppearance", curveStyle);
		const style = file.createEntity("IfcFillAreaStyle");
		style.set("FillStyles", [fillStyle]);
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Styles", [style]);
		const styledRep = file.createEntity("IfcStyledRepresentation");
		styledRep.set("Items", [styledItem]);
		const materialDefRep = file.createEntity("IfcMaterialDefinitionRepresentation");
		materialDefRep.set("RepresentedMaterial", material);
		materialDefRep.set("Representations", [styledRep]);

		expect(ids(subject.getElementsByStyle(file, curveStyle))).toEqual(ids([element]));
	});

	test("getting elements of a styled material with fill area style tiles", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const material = file.createEntity("IfcMaterial");
		assignMaterial(file, [element], material);
		const tileStyle = file.createEntity("IfcCurveStyle");
		const tileCurve = file.createEntity("IfcGeometricSet");
		const innerStyledItem = file.createEntity("IfcStyledItem");
		innerStyledItem.set("Styles", [tileStyle]);
		innerStyledItem.set("Item", tileCurve);
		const fillStyle = file.createEntity("IfcFillAreaStyleTiles");
		fillStyle.set("Tiles", [innerStyledItem]);
		const style = file.createEntity("IfcFillAreaStyle");
		style.set("FillStyles", [fillStyle]);
		const outerStyledItem = file.createEntity("IfcStyledItem");
		outerStyledItem.set("Styles", [style]);
		const styledRep = file.createEntity("IfcStyledRepresentation");
		styledRep.set("Items", [outerStyledItem]);
		const materialDefRep = file.createEntity("IfcMaterialDefinitionRepresentation");
		materialDefRep.set("RepresentedMaterial", material);
		materialDefRep.set("Representations", [styledRep]);

		expect(ids(subject.getElementsByStyle(file, tileStyle))).toEqual(ids([element]));
	});
});

describe("util.element getElementsByRepresentation (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting elements of a shape representation", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const representation = file.createEntity("IfcShapeRepresentation");
		const productShape = file.createEntity("IfcProductDefinitionShape");
		productShape.set("Representations", [representation]);
		element.set("Representation", productShape);

		expect(ids(subject.getElementsByRepresentation(file, representation))).toEqual(ids([element]));
	});

	test("getting elements of a mapped representation item", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const representation = file.createEntity("IfcShapeRepresentation");
		const repMap = file.createEntity("IfcRepresentationMap");
		repMap.set("MappedRepresentation", representation);
		const mappedItem = file.createEntity("IfcMappedItem");
		mappedItem.set("MappingSource", repMap);
		const outerRep = file.createEntity("IfcShapeRepresentation");
		outerRep.set("Items", [mappedItem]);
		const productShape = file.createEntity("IfcProductDefinitionShape");
		productShape.set("Representations", [outerRep]);
		element.set("Representation", productShape);

		expect(ids(subject.getElementsByRepresentation(file, representation))).toEqual(ids([element]));
	});

	test("getting type elements of a mapped representation item", () => {
		const file = newFile();
		const elementType = file.createEntity("IfcWallType");
		const representation = file.createEntity("IfcShapeRepresentation");
		const repMap = file.createEntity("IfcRepresentationMap");
		repMap.set("MappedRepresentation", representation);
		elementType.set("RepresentationMaps", [repMap]);

		expect(ids(subject.getElementsByRepresentation(file, representation))).toEqual(ids([elementType]));
	});
});

describe("util.element hasProperty", () => {
	test("empty property name is always true", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		expect(subject.hasProperty(product, "")).toBe(true);
	});

	test("true when a quantity with that name exists", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		addQto(file, product, "Qto_WallBaseQuantities", { NetArea: 12 });
		expect(subject.hasProperty(product, "NetArea")).toBe(true);
		expect(subject.hasProperty(product, "GrossArea")).toBe(false);
	});

	test("false when the product has no quantities at all", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		expect(subject.hasProperty(product, "NetArea")).toBe(false);
	});
});

// --- Spatial / structural-graph queries (chunk 2) ---
// Python: `TestGetContainerIFC4` (test.bootstrap.IFC4 only, no IFC2X3 variant).

describe("util.element getContainer (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting the spatial container of an element", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const building = file.createEntity("IfcBuilding");
		containElement(file, building, [element]);
		expect(subject.getContainer(element)?.id()).toBe(building.id());
	});

	test("getting an indirect spatial container of an element", () => {
		const file = newFile();
		const subelement = file.createEntity("IfcWall");
		const element = file.createEntity("IfcElementAssembly");
		const building = file.createEntity("IfcBuilding");
		containElement(file, building, [element]);
		assignAggregate(file, element, [subelement]);
		expect(subject.getContainer(subelement)?.id()).toBe(building.id());
	});

	test("getting nothing if we enforce only getting direct spatial containers", () => {
		const file = newFile();
		const subelement = file.createEntity("IfcWall");
		const element = file.createEntity("IfcElementAssembly");
		const building = file.createEntity("IfcBuilding");
		containElement(file, building, [element]);
		assignAggregate(file, element, [subelement]);
		expect(subject.getContainer(subelement, true)).toBeNull();
	});

	test("getting the specific spatial container of an element", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const building = file.createEntity("IfcBuilding");
		const storey = file.createEntity("IfcBuildingStorey");
		assignAggregate(file, building, [storey]);
		containElement(file, storey, [element]);
		expect(subject.getContainer(element, false, "IfcBuilding")?.id()).toBe(building.id());
		expect(subject.getContainer(element, false, "IfcSite")).toBeNull();
	});

	test("getting the specific spatial container of an element indirectly", () => {
		const file = newFile();
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcWall");
		assignAggregate(file, element, [subelement]);
		const building = file.createEntity("IfcBuilding");
		const storey = file.createEntity("IfcBuildingStorey");
		assignAggregate(file, building, [storey]);
		containElement(file, storey, [element]);
		expect(subject.getContainer(subelement, false, "IfcBuilding")?.id()).toBe(building.id());
		expect(subject.getContainer(subelement, false, "IfcSite")).toBeNull();
	});
});

// Python: `TestGetReferencedStructures`/`TestGetReferencedStructuresIFC2X3`.
describe.each(AVAILABLE_SCHEMAS)("util.element getReferencedStructures (%s)", (schema) => {
	test("getting references of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		expect(subject.getReferencedStructures(element)).toEqual([]);
		const building = file.createEntity("IfcBuilding");
		referenceStructure(file, building, [element]);
		expect(ids(subject.getReferencedStructures(element))).toEqual(ids([building]));
		const building2 = file.createEntity("IfcBuilding");
		referenceStructure(file, building2, [element]);
		expect(ids(subject.getReferencedStructures(element))).toEqual(ids([building, building2]));
	});
});

// Python: `TestGetStructureReferencedElements`/`TestGetStructureReferencedElementsIFC2X3`.
describe.each(AVAILABLE_SCHEMAS)("util.element getStructureReferencedElements (%s)", (schema) => {
	test("getting references of an element", () => {
		const file = createTestFile(schema);
		const building = file.createEntity("IfcBuilding");
		expect(subject.getStructureReferencedElements(building)).toEqual(new Set());
		const element = file.createEntity("IfcWall");
		referenceStructure(file, building, [element]);
		expect(ids(subject.getStructureReferencedElements(building))).toEqual(ids([element]));
		const element2 = file.createEntity("IfcWall");
		referenceStructure(file, building, [element2]);
		expect(ids(subject.getStructureReferencedElements(building))).toEqual(ids([element, element2]));
	});
});

// Python: `TestGetDecompositionIFC4` (IFC4 only, no IFC2X3 variant).
describe("util.element getDecomposition (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting decomposed subelements of an element", () => {
		const file = newFile();
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcBeam");
		const building = file.createEntity("IfcBuilding");
		containElement(file, building, [element]);
		assignAggregate(file, element, [subelement]);
		expect(ids(subject.getDecomposition(building))).toEqual(ids([element, subelement]));
	});

	test("getting openings and fills of an element", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcOpeningElement");
		const subsubelement = file.createEntity("IfcWindow");
		addOpening(file, element, subelement);
		addFilling(file, subelement, subsubelement);
		expect(ids(subject.getDecomposition(element))).toEqual(ids([subelement, subsubelement]));
	});
});

// No Python test class exists for `get_grouped_by` -- original coverage of the
// documented behavior (see this file's header comment).
describe("util.element getGroupedBy (IFC4)", () => {
	test("recursively collecting grouped elements", () => {
		const file = createTestFile("IFC4");
		const topGroup = file.createEntity("IfcGroup");
		const subGroup = file.createEntity("IfcGroup");
		const element = file.createEntity("IfcWall");
		assignGroup(file, topGroup, [subGroup]);
		assignGroup(file, subGroup, [element]);
		expect(ids(subject.getGroupedBy(topGroup))).toEqual(ids([subGroup, element]));
	});

	test("is_recursive=false only collects the direct level", () => {
		const file = createTestFile("IFC4");
		const topGroup = file.createEntity("IfcGroup");
		const subGroup = file.createEntity("IfcGroup");
		const element = file.createEntity("IfcWall");
		assignGroup(file, topGroup, [subGroup]);
		assignGroup(file, subGroup, [element]);
		expect(ids(subject.getGroupedBy(topGroup, false))).toEqual(ids([subGroup]));
	});
});

// Python: `TestGetGroupsIFC4`/`TestGetGroupsIFC2X3`.
describe.each(AVAILABLE_SCHEMAS)("util.element getGroups (%s)", (schema) => {
	test("getting the groups an element is assigned to", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group1 = file.createEntity("IfcGroup");
		const group2 = file.createEntity("IfcGroup");
		assignGroup(file, group1, [element]);
		assignGroup(file, group2, [element]);
		expect(ids(subject.getGroups(element))).toEqual(ids([group1, group2]));
	});
});

// Python: `TestGetControls`/`TestGetControlsIFC4`/`TestGetControlsIFC4X3` -- see
// `src/util/element.ts`'s chunk 2 header comment for why `get_controls` is included in
// this chunk's scope.
describe.each(AVAILABLE_SCHEMAS)("util.element getControls (%s)", (schema) => {
	test("getting the controls assigned to an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const control = file.createEntity("IfcCostSchedule");
		assignControl(file, control, [element]);
		expect(ids(subject.getControls(element))).toEqual(ids([control]));
	});
});

// Python: `TestGetParentIFC4` (IFC4 only, no IFC2X3 variant).
describe("util.element getParent (IFC4)", () => {
	function newFile(): IfcFile {
		return createTestFile("IFC4");
	}

	test("getting the parent of an element", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const building = file.createEntity("IfcBuilding");
		containElement(file, building, [element]);
		expect(subject.getParent(element)?.id()).toBe(building.id());
	});

	test("getting the specific parent of an element", () => {
		const file = newFile();
		const element = file.createEntity("IfcWall");
		const building = file.createEntity("IfcBuilding");
		const storey = file.createEntity("IfcBuildingStorey");
		assignAggregate(file, building, [storey]);
		containElement(file, storey, [element]);
		expect(subject.getParent(element, "IfcBuilding")?.id()).toBe(building.id());
		expect(subject.getParent(element, "IfcSite")).toBeNull();
	});

	test("getting the specific parent of an element via voiding", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const building = file.createEntity("IfcBuilding");
		containElement(file, building, [wall]);
		const opening = file.createEntity("IfcOpeningElement");
		addOpening(file, wall, opening);
		const window = file.createEntity("IfcWindow");
		addFilling(file, opening, window);
		expect(subject.getParent(window, "IfcWall")?.id()).toBe(wall.id());
		expect(subject.getParent(window, "IfcBuilding")?.id()).toBe(building.id());
		expect(subject.getParent(window, "IfcSite")).toBeNull();
	});
});

// No Python test class exists for `get_filled_void`/`get_voided_element` -- original
// coverage of the documented behavior.
describe("util.element getFilledVoid / getVoidedElement (IFC4)", () => {
	test("getting the void an element fills, and the element a void is voiding", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		addOpening(file, wall, opening);
		const window = file.createEntity("IfcWindow");
		addFilling(file, opening, window);

		expect(subject.getFilledVoid(window)?.id()).toBe(opening.id());
		expect(subject.getVoidedElement(opening)?.id()).toBe(wall.id());
	});

	test("returns null when there is no relationship", () => {
		const file = createTestFile("IFC4");
		const window = file.createEntity("IfcWindow");
		const opening = file.createEntity("IfcOpeningElement");
		expect(subject.getFilledVoid(window)).toBeNull();
		expect(subject.getVoidedElement(opening)).toBeNull();
	});
});

// No Python test class exists for `get_adhered_element` -- original coverage.
// `IfcRelAdheresToElement`/`IfcSurfaceFeature` are IFC4.3-and-above additions, so this
// is gated on `AVAILABLE_SCHEMAS` (not a hard-coded `"IFC4X3"` literal in a `describe`
// call, per this file's own established convention -- see this chunk's task brief).
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("util.element getAdheredElement (IFC4X3)", () => {
	test("getting the element a surface feature adheres to", () => {
		const file = createTestFile("IFC4X3");
		const course = file.createEntity("IfcCourse");
		const marking = file.createEntity("IfcSurfaceFeature");
		const rel = file.createEntity("IfcRelAdheresToElement");
		rel.set("RelatingElement", course);
		rel.set("RelatedSurfaceFeatures", [marking]);
		expect(subject.getAdheredElement(marking)?.id()).toBe(course.id());
	});

	test("returns null when the element does not adhere to anything", () => {
		const file = createTestFile("IFC4X3");
		const marking = file.createEntity("IfcSurfaceFeature");
		expect(subject.getAdheredElement(marking)).toBeNull();
	});
});

// Python: `TestGetAggregateIFC4` (IFC4 only, no IFC2X3 variant).
describe("util.element getAggregate (IFC4)", () => {
	test("getting the containing aggregate of a subelement", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcCovering");
		assignAggregate(file, element, [subelement]);
		expect(subject.getAggregate(subelement)?.id()).toBe(element.id());
	});

	test("returns null when the element has no aggregate parent", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		expect(subject.getAggregate(element)).toBeNull();
	});
});

// Python: `TestGetNestIFC4`/`TestGetNestIFC2X3`.
describe.each(AVAILABLE_SCHEMAS)("util.element getNest (%s)", (schema) => {
	test("getting the nest parent of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelement = file.createEntity("IfcTask");
		assignNest(file, element, [subelement]);
		expect(subject.getNest(subelement)?.id()).toBe(element.id());
	});
});

// Python: `TestGetPartsIFC4`/`TestGetPartsIFC2X3`.
describe.each(AVAILABLE_SCHEMAS)("util.element getParts (%s)", (schema) => {
	test("getting the aggregated parts of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcWindow");
		assignAggregate(file, element, [subelement]);

		// Test two separate rels.
		const rel = file.createEntity("IfcRelAggregates");
		const subelement2 = file.createEntity("IfcWindow");
		rel.set("RelatingObject", element);
		rel.set("RelatedObjects", [subelement2]);

		expect(ids(subject.getParts(element))).toEqual(ids([subelement, subelement2]));
	});
});

// Python: `TestGetContainedIFC4`/`TestGetContainedIFC2X3`.
describe.each(AVAILABLE_SCHEMAS)("util.element getContained (%s)", (schema) => {
	test("getting the contained elements of a spatial element", () => {
		const file = createTestFile(schema);
		const container = file.createEntity("IfcBuildingStorey");
		const element = file.createEntity("IfcWindow");
		containElement(file, container, [element]);

		// Test two separate rels.
		const rel = file.createEntity("IfcRelContainedInSpatialStructure");
		const element2 = file.createEntity("IfcWindow");
		rel.set("RelatingStructure", container);
		rel.set("RelatedElements", [element2]);

		expect(ids(subject.getContained(container))).toEqual(ids([element, element2]));
	});
});

// Python: `TestGetComponentsIFC4`/`TestGetComponentsIFC2X3`.
describe.each(AVAILABLE_SCHEMAS)("util.element getComponents (%s)", (schema) => {
	test("getting the nested components of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcWindow");
		assignNest(file, element, [subelement]);

		// Test two separate rels.
		const rel = file.createEntity("IfcRelNests");
		const subelement2 = file.createEntity("IfcWindow");
		rel.set("RelatingObject", element);
		rel.set("RelatedObjects", [subelement2]);

		expect(ids(subject.getComponents(element))).toEqual(ids([subelement, subelement2]));
	});

	test("include_ports controls whether IfcPort components are returned", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcFlowSegment");
		const port = file.createEntity("IfcDistributionPort");
		const subelement = file.createEntity("IfcFlowSegment");
		assignNest(file, element, [port, subelement]);

		expect(ids(subject.getComponents(element))).toEqual(ids([subelement]));
		expect(ids(subject.getComponents(element, true))).toEqual(ids([port, subelement]));
	});
});

// No Python test class exists for `get_openings`/`has_openings` -- original coverage.
describe("util.element getOpenings / hasOpenings (IFC4)", () => {
	test("getting an element's own openings as IfcRelVoidsElement", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		const rel = addOpening(file, wall, opening);

		const openings = subject.getOpenings(wall);
		expect(openings).toHaveLength(1);
		expect(openings[0].id()).toBe(rel.id());
		expect((openings[0].get("RelatedOpeningElement") as EntityInstance).id()).toBe(opening.id());
		expect(subject.hasOpenings(wall)).toBe(true);
	});

	test("recursing into the aggregate for openings", () => {
		const file = createTestFile("IFC4");
		const assembly = file.createEntity("IfcElementAssembly");
		const wall = file.createEntity("IfcWall");
		assignAggregate(file, assembly, [wall]);
		const opening = file.createEntity("IfcOpeningElement");
		addOpening(file, assembly, opening);

		expect(subject.getOpenings(wall)).toHaveLength(1);
		expect(subject.hasOpenings(wall)).toBe(true);
	});

	test("no openings", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		expect(subject.getOpenings(wall)).toEqual([]);
		expect(subject.hasOpenings(wall)).toBe(false);
	});
});

// --- Structural editing helpers (chunk 3 of 3) ---

// Python: `TestCopyIFC4`.
describe("util.element copy (IFC4)", () => {
	test("copying an element", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id");
		element.set("Name", "name");

		const element2 = subject.copy(file, element);

		expect(element2.isA()).toBe(element.isA());
		expect(element2.get("GlobalId")).not.toBe(element.get("GlobalId"));
		expect(element2.get("Name")).toBe(element.get("Name"));
	});

	// Original coverage: Python's own test always passes the real file; this exercises
	// `copy`'s `if not ifc_file: ifc_file = element.file` fallback branch (`ifcFile ??
	// element.file` in this port).
	test("a null ifcFile falls back to element.file", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		const element2 = subject.copy(null, element);
		expect(element2.isA()).toBe("IfcWall");
	});
});

// Python: `TestCopyDeepIFC4`.
describe("util.element copyDeep (IFC4)", () => {
	test("copying an element recursively", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		owner.set("State", "READWRITE");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id");
		element.set("Name", "name");
		element.set("OwnerHistory", owner);

		const element2 = subject.copyDeep(file, element);
		const copiedOwner = element2.get("OwnerHistory") as EntityInstance;

		expect(copiedOwner.id()).not.toBe(owner.id());
		expect(element2.get("GlobalId")).not.toBe(element.get("GlobalId"));
		expect(copiedOwner.get("State")).toBe(owner.get("State"));
	});

	test("copying an element recursively even if references are aggregated", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		element.set("Name", "name");
		const rel = file.createEntity("IfcRelAggregates");
		rel.set("RelatedObjects", [element]);

		const rel2 = subject.copyDeep(file, rel);
		const related = rel.get("RelatedObjects") as EntityInstance[];
		const related2 = rel2.get("RelatedObjects") as EntityInstance[];

		expect(related2[0].id()).not.toBe(related[0].id());
		expect(related2[0].get("Name")).toBe(related[0].get("Name"));
	});

	test("copying an element recursively with an exclude filter", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		owner.set("State", "READWRITE");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id");
		element.set("Name", "name");
		element.set("OwnerHistory", owner);

		const element2 = subject.copyDeep(file, element, ["IfcOwnerHistory"]);

		expect((element2.get("OwnerHistory") as EntityInstance).id()).toBe(owner.id());
	});

	test("copying an element recursively with aggregates with an exclude filter", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		element.set("Name", "name");
		const rel = file.createEntity("IfcRelAggregates");
		rel.set("RelatedObjects", [element]);

		const rel2 = subject.copyDeep(file, rel, ["IfcWall"]);
		const related = rel.get("RelatedObjects") as EntityInstance[];
		const related2 = rel2.get("RelatedObjects") as EntityInstance[];

		expect(related2[0].id()).toBe(related[0].id());
	});

	test("copying an element recursively with aggregates with an exclude callback", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		element.set("Name", "name");
		const rel = file.createEntity("IfcRelAggregates");
		rel.set("RelatedObjects", [element]);

		const rel2 = subject.copyDeep(file, rel, null, (x) => x.isA("IfcWall"));
		const related = rel.get("RelatedObjects") as EntityInstance[];
		const related2 = rel2.get("RelatedObjects") as EntityInstance[];

		expect(related2[0].id()).toBe(related[0].id());
	});

	test("copying and reusing element references", () => {
		const file = createTestFile("IFC4");
		const points = file.createEntity("IfcCartesianPointList2D");
		const subelement1 = file.createEntity("IfcIndexedPolyCurve", points);
		const subelement2 = file.createEntity("IfcIndexedPolyCurve", points);
		const element = file.createEntity("IfcGeometricCurveSet", [subelement1, subelement2]);

		const element2 = subject.copyDeep(file, element);
		const elements2 = element2.get("Elements") as EntityInstance[];

		expect((elements2[0].get("Points") as EntityInstance).id()).toBe(
			(elements2[1].get("Points") as EntityInstance).id(),
		);
	});

	// Substituted for Python's `test_copying_primitive_entities` -- see this file's
	// header comment for why (a pre-existing, unrelated primitive-layer gap blocks
	// constructing a standalone defined-type instance like `IfcLineIndex`). This
	// exercises the same `copyDeep` code path -- a non-entity, non-entity-list
	// attribute value is copied through unchanged -- via an ordinary entity's plain
	// numeric aggregate attribute instead.
	test("copying a plain (non-entity) aggregate attribute value unchanged", () => {
		const file = createTestFile("IFC4");
		const point = file.createEntity("IfcCartesianPoint", [1, 2, 3]);

		const point2 = subject.copyDeep(file, point);

		expect(point2.getByIndex(0)).toEqual([1, 2, 3]);
	});
});

// Python: `TestReplaceAttributeIFC4`. `TestHasElementReferenceIFC4` has no dedicated
// test here -- `hasElementReference` is a non-exported private helper per this chunk's
// own scope (see `element.ts`'s doc comment on it), exercised indirectly by every test
// below (it gates whether `replaceAttribute` touches a given attribute at all).
describe("util.element replaceAttribute (IFC4)", () => {
	test("replacing an element's attribute", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "foo");

		subject.replaceAttribute(element, "foo", "bar");

		expect(element.get("GlobalId")).toBe("bar");
	});

	test("replacing a value in a list", () => {
		const file = createTestFile("IFC4");
		const oldWall = file.createEntity("IfcWall");
		const newWall = file.createEntity("IfcWall");
		const rel = file.createEntity("IfcRelAggregates");
		rel.set("RelatedObjects", [oldWall]);

		subject.replaceAttribute(rel, oldWall, newWall);

		const related = rel.get("RelatedObjects") as EntityInstance[];
		expect(related.map((e) => e.id())).toEqual([newWall.id()]);
	});

	// A real, disclosed divergence from Python -- see `isSetAttribute`'s own doc
	// comment in `src/util/element.ts` (this chunk's header comment, finding 1): the
	// primitive layer can't currently distinguish `IfcRelAggregates.RelatedObjects` (a
	// real EXPRESS SET) from a LIST/BAG attribute, so `replaceAttribute` never
	// deduplicates. Python's own `test_replacing_into_a_set_deduplicates_the_survivor`
	// asserts `rel.RelatedObjects == (new,)` (deduplicated to one survivor); this
	// port's actual, disclosed behavior leaves both entries -- asserted here directly,
	// not silently passed over.
	test("replacing into a SET-typed attribute does not deduplicate the survivor (disclosed divergence from Python)", () => {
		const file = createTestFile("IFC4");
		const oldWall = file.createEntity("IfcWall");
		const newWall = file.createEntity("IfcWall");
		const rel = file.createEntity("IfcRelAggregates");
		rel.set("RelatedObjects", [oldWall, newWall]);

		subject.replaceAttribute(rel, oldWall, newWall);

		const related = rel.get("RelatedObjects") as EntityInstance[];
		expect(related.map((e) => e.id())).toEqual([newWall.id(), newWall.id()]);
	});

	test("replacing into a list keeps legitimate duplicates", () => {
		const file = createTestFile("IFC4");
		const p1 = file.createEntity("IfcCartesianPoint", [0, 0, 0]);
		const p2 = file.createEntity("IfcCartesianPoint", [1, 0, 0]);
		const p3 = file.createEntity("IfcCartesianPoint", [2, 0, 0]);
		const polyline = file.createEntity("IfcPolyline", [p1, p2, p3, p1]);

		subject.replaceAttribute(polyline, p2, p3);

		const points = polyline.get("Points") as EntityInstance[];
		expect(points.map((p) => p.id())).toEqual([p1.id(), p3.id(), p3.id(), p1.id()]);
	});
});

// No dedicated Python test class -- `replace_element` is a thin wrapper around
// `replace_attribute` (walks every inverse and delegates); original coverage.
describe("util.element replaceElement (IFC4)", () => {
	test("replacing every inverse reference to an element", () => {
		const file = createTestFile("IFC4");
		const oldWall = file.createEntity("IfcWall");
		const newWall = file.createEntity("IfcWall");
		const rel1 = file.createEntity("IfcRelAggregates");
		rel1.set("RelatedObjects", [oldWall]);
		const rel2 = file.createEntity("IfcRelContainedInSpatialStructure");
		rel2.set("RelatedElements", [oldWall]);

		subject.replaceElement(oldWall, newWall);

		expect((rel1.get("RelatedObjects") as EntityInstance[]).map((e) => e.id())).toEqual([newWall.id()]);
		expect((rel2.get("RelatedElements") as EntityInstance[]).map((e) => e.id())).toEqual([newWall.id()]);
	});
});

// Python: `TestRemoveDeepIFC4`.
describe("util.element removeDeep (IFC4)", () => {
	test("removing an element along with all direct attributes recursively", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id");
		element.set("OwnerHistory", owner);
		const ownerId = owner.id();
		const elementId = element.id();

		subject.removeDeep(file, element);

		expect(() => file.byId(elementId)).toThrow();
		expect(() => file.byId(ownerId)).toThrow();
	});

	test("removing an element recursively except if an element is referenced elsewhere", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id1");
		element.set("OwnerHistory", owner);
		const element2 = file.createEntity("IfcWall");
		element2.set("GlobalId", "id2");
		element2.set("OwnerHistory", owner);

		subject.removeDeep(file, element);

		expect(() => file.byGuid("id1")).toThrow();
		expect(() => file.byId(owner.id())).not.toThrow();
		expect(() => file.byGuid("id2")).not.toThrow();
	});
});

// Python: `TestRemoveDeep2IFC4`.
describe("util.element removeDeep2 (IFC4)", () => {
	test("removing an element along with all direct attributes recursively", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id");
		element.set("OwnerHistory", owner);
		const ownerId = owner.id();
		const elementId = element.id();

		subject.removeDeep2(file, element);

		expect(() => file.byId(elementId)).toThrow();
		expect(() => file.byId(ownerId)).toThrow();
	});

	test("removing an element recursively except if an element is referenced elsewhere", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id1");
		element.set("OwnerHistory", owner);
		const element2 = file.createEntity("IfcWall");
		element2.set("GlobalId", "id2");
		element2.set("OwnerHistory", owner);

		subject.removeDeep2(file, element);

		expect(() => file.byGuid("id1")).toThrow();
		expect(() => file.byId(owner.id())).not.toThrow();
		expect(() => file.byGuid("id2")).not.toThrow();
	});

	test("not removing an element still referenced somewhere", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id1");
		element.set("OwnerHistory", owner);

		subject.removeDeep2(file, owner);

		expect(() => file.byId(owner.id())).not.toThrow();
		expect(() => file.byGuid("id1")).not.toThrow();
	});

	// This chunk's own load-bearing correctness property (see `element.ts`'s section
	// header comment): `removeDeep2` must call the *existing* `IfcFile.remove` (which
	// records `Transaction.storeDelete` when a transaction is active) rather than
	// reimplement deletion, so undo/redo works the same as it already does for any
	// other mutation. Proven here directly, not just assumed.
	test("Transaction/undo-redo: removeDeep2 -> undo restores the whole subgraph -> redo removes it again", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		owner.set("State", "READWRITE");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id");
		element.set("OwnerHistory", owner);
		const ownerId = owner.id();
		const elementId = element.id();

		file.beginTransaction();
		subject.removeDeep2(file, element);
		file.endTransaction();

		expect(() => file.byId(elementId)).toThrow();
		expect(() => file.byId(ownerId)).toThrow();

		file.undo();

		const restoredElement = file.byId(elementId);
		const restoredOwner = file.byId(ownerId);
		expect(restoredElement.get("GlobalId")).toBe("id");
		expect((restoredElement.get("OwnerHistory") as EntityInstance).id()).toBe(ownerId);
		expect(restoredOwner.get("State")).toBe("READWRITE");

		file.redo();

		expect(() => file.byId(elementId)).toThrow();
		expect(() => file.byId(ownerId)).toThrow();
	});
});

// Python: `TestBatchRemoveDeep2IFC4`.
describe("util.element batchRemoveDeep2 / unbatchRemoveDeep2 (IFC4)", () => {
	test("batching remove_deep2 across a reload", () => {
		const file = createTestFile("IFC4");
		const owner = file.createEntity("IfcOwnerHistory");
		const element = file.createEntity("IfcWall");
		element.set("GlobalId", "id");
		element.set("OwnerHistory", owner);
		const elementId = element.id();
		const ownerId = owner.id();

		subject.batchRemoveDeep2(file);
		subject.removeDeep2(file, element);
		// Nothing is actually removed from `file` yet -- matches Python's own
		// docstring: the deletion is only realized in the reloaded file `unbatch
		// RemoveDeep2` returns.
		expect(() => file.byId(elementId)).not.toThrow();
		expect(() => file.byId(ownerId)).not.toThrow();

		const reloaded = subject.unbatchRemoveDeep2(file);

		expect(() => reloaded.byId(elementId)).toThrow();
		expect(() => reloaded.byId(ownerId)).toThrow();
		// The original `file` object is still usable (its own `toDelete` accumulator
		// is cleared, but its own entities were never touched) -- disclosed as a
		// footgun in `unbatchRemoveDeep2`'s own doc comment: the caller is expected
		// to discard `file` and its minted `EntityInstance`s, not keep using it.
		expect(() => file.byId(elementId)).not.toThrow();
	});

	test("unbatchRemoveDeep2 throws if batchRemoveDeep2 was never called", () => {
		const file = createTestFile("IFC4");
		expect(() => subject.unbatchRemoveDeep2(file)).toThrow();
	});
});
