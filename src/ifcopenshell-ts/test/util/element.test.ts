// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_element.py` (src/ifcopenshell-python), covering
// exactly this chunk's scope (see `src/util/element.ts`'s own header comment): the
// pset/qto and type/material/style query functions. Test classes for functions outside
// this chunk (spatial/structural-graph queries, structural-editing helpers,
// `get_shape_aspects`) are skipped here -- they land with the chunks that port those
// functions.
//
// Python's own test suite builds its fixtures via `ifcopenshell.api.*` (`api.root
// .create_entity`, `api.pset.add_pset`, `api.material.assign_material`, ...) -- none of
// which exist yet in this TS port (`api` is Phase 6+, planning/ifcopenshell-ts/
// 20-roadmap.md). This file's `test/bootstrap.ts`-style local helpers below build the
// same underlying entity graphs directly (`file.createEntity(...)` + `.set(...)`,
// matching `test/file.test.ts`'s own established pattern for this codebase), matching
// Python's test *coverage* (the same behaviors/edge cases), not its exact fixture code.

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
