// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/root/test_reassign_class.py` (src/ifcopenshell-python,
// `TestReassignClass`/`TestReassignClassIFC4X3`/`TestReassignClassIFC2X3`). Every real
// Python test that doesn't depend on `api.geometry.assignRepresentation` is ported for
// real below -- confirmed directly against `../../../src/api/root/reassignClass.ts`'s
// own header comment, `simpleReassignment` and the non-representation half of
// `switchBetweenClassTypes` have no blocked dependency at all.
//
// 2 real Python tests (`test_keeping_representations_switching_from_occurrence_class
// _to_type_class`/`..._from_type_class_to_occurrence_class`) are genuinely blocked --
// both set up their fixture via real Python's own `ifcopenshell.api.geometry
// .assign_representation` (itself not ported here either) and then rely on this
// function's own internal `assign_representation` call to carry the representation
// across the switch. Pinned instead as dedicated "throws the disclosed blocked error"
// regression tests, matching `removeProduct.test.ts`'s established precedent -- not
// silently dropped. The fixture for these 2 pins is built directly (a bare
// `IfcProductDefinitionShape`/`RepresentationMaps` assignment via `.set()`, bypassing
// the unported `assignRepresentation` usecase entirely, matching `removeProduct
// .test.ts`'s own `withAttrs`-based substitution precedent) since the actual behavior
// under test (this function throwing once it discovers a non-empty representations
// list) doesn't depend on how the representation got attached in the first place.

import { describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/aggregate/assignObject";
import { addPset } from "../../../src/api/pset/addPset";
import { reassignClass } from "../../../src/api/root/reassignClass";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import { assignType } from "../../../src/api/type/assignType";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.root.reassignClass (%s)", (schema) => {
	test("reassigning a simple class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const nElements = [...file].length;
		const originalId = element.id();

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlab" });

		expect([...file].length).toBe(nElements);
		expect(newElement.id()).toBe(originalId);
		expect(newElement.isA("IfcSlab")).toBe(true);
	});

	test("reassigning a predefined type", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlab", predefinedType: "FLOOR" });

		expect(newElement.get("PredefinedType")).toBe("FLOOR");
	});

	test("falling back to USERDEFINED if the predefined type cannot be reassigned for an occurrence class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlab", predefinedType: "FOO" });

		expect(newElement.get("PredefinedType")).toBe("USERDEFINED");
		expect(newElement.get("ObjectType")).toBe("FOO");
	});

	test("falling back to USERDEFINED if the predefined type cannot be reassigned for a type class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlabType", predefinedType: "FOO" });

		expect(newElement.get("PredefinedType")).toBe("USERDEFINED");
		expect(newElement.get("ElementType")).toBe("FOO");
	});

	test("reassigning a type's class also reassigns its occurrences' classes", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1], relatingType: elementType });
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element2], relatingType: elementType });

		const newType = reassignClass(file, { product: elementType, ifcClass: "IfcSlabType" });

		const occurrences = elementUtil.getTypes(newType);
		expect(occurrences).toHaveLength(2);
		expect(occurrences.every((o) => o.isA("IfcSlab"))).toBe(true);

		expect(file.byType("IfcWall")).toHaveLength(0);
		expect(file.byType("IfcWallType")).toHaveLength(0);
	});

	test("reassigning an occurrence's class also reassigns its type's class and its type's other occurrences", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1], relatingType: elementType });
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element2], relatingType: elementType });

		const newElement1 = reassignClass(file, { product: element1, ifcClass: "IfcSlab" });

		const newElementType = elementUtil.getType(newElement1);
		expect(newElementType?.isA("IfcSlabType")).toBe(true);

		const occurrences = elementUtil.getTypes(newElementType as EntityInstance);
		expect(occurrences).toHaveLength(2);
		expect(occurrences.every((o) => o.isA("IfcSlab"))).toBe(true);

		expect(file.byType("IfcWall")).toHaveLength(0);
		expect(file.byType("IfcWallType")).toHaveLength(0);
	});

	// Switching between occurrence / type classes.

	test("unassigns the type from occurrences when switching from a type class to an occurrence class", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1], relatingType: elementType });
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element2], relatingType: elementType });

		reassignClass(file, { product: elementType, ifcClass: "IfcSlab" });

		expect(elementUtil.getType(element1)).toBeNull();
		expect(elementUtil.getType(element2)).toBeNull();
		expect(file.byType("IfcRelDefinesByType")).toHaveLength(0);

		expect(file.byType("IfcWall")).toHaveLength(2);
		expect(file.byType("IfcSlab")).toHaveLength(1);
	});

	test("unassigns the type from an element when switching from an occurrence class to a type class", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element], relatingType: elementType });

		reassignClass(file, { product: element, ifcClass: "IfcSlabType" });

		expect(elementUtil.getTypes(elementType)).toEqual([]);
		expect(file.byType("IfcRelDefinesByType")).toHaveLength(0);

		expect(file.byType("IfcWallType")).toHaveLength(1);
		expect(file.byType("IfcSlabType")).toHaveLength(1);
	});

	test("unassigns the container when switching from an occurrence class to a type class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const container = file.createEntity("IfcBuilding");
		assignContainer(file, { products: [element], relatingStructure: container });

		reassignClass(file, { product: element, ifcClass: "IfcSlabType" });

		expect(file.byType("IfcRelContainedInSpatialStructure")).toHaveLength(0);
		expect(file.byType("IfcWall")).toHaveLength(0);
		expect(file.byType("IfcSlabType")).toHaveLength(1);
	});

	test("unassigns the aggregate when switching from an occurrence class to a type class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const aggregate = file.createEntity("IfcSlab");
		assignObject(file, { products: [element], relatingObject: aggregate });

		reassignClass(file, { product: element, ifcClass: "IfcSlabType" });

		expect(file.byType("IfcRelAggregates")).toHaveLength(0);
		expect(file.byType("IfcWall")).toHaveLength(0);
		expect(file.byType("IfcSlabType")).toHaveLength(1);
	});

	test("keeps psets when switching from an occurrence class to a type class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, { product: element, name: "TestPset" });

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlabType" });

		expect((elementUtil.getPset(newElement, "TestPset") as { id: number }).id).toBe(pset.id());
		expect(file.byType("IfcRelDefinesByProperties")).toHaveLength(0);
		expect(file.byType("IfcWall")).toHaveLength(0);
		expect(file.byType("IfcSlabType")).toHaveLength(1);
	});

	test("keeps psets when switching from a type class to an occurrence class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const pset = addPset(file, { product: element, name: "TestPset" });

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlab" });

		expect((elementUtil.getPset(newElement, "TestPset") as { id: number }).id).toBe(pset.id());
		expect(file.byType("IfcRelDefinesByProperties")).toHaveLength(1);
		expect(file.byType("IfcWallType")).toHaveLength(0);
		expect(file.byType("IfcSlab")).toHaveLength(1);
	});
});

// IFC2X3-specific: providing an explicit `occurrenceClass` (real Python's own
// `TestReassignClassIFC2X3.test_providing_occurrence_class`).
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.root.reassignClass -- IFC2X3-specific", () => {
	test("providing an explicit occurrence class", () => {
		const file = createTestFile("IFC2X3");
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1], relatingType: elementType });
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element2], relatingType: elementType });

		const newElementType = reassignClass(file, {
			product: elementType,
			ifcClass: "IfcBuildingElementProxyType",
			occurrenceClass: "IfcRoof",
		});

		expect(newElementType.isA("IfcBuildingElementProxyType")).toBe(true);
		const occurrences = elementUtil.getTypes(newElementType);
		expect(occurrences).toHaveLength(2);
		expect(occurrences.every((o) => o.isA("IfcRoof"))).toBe(true);

		expect(file.byType("IfcWall")).toHaveLength(0);
		expect(file.byType("IfcWallType")).toHaveLength(0);
	});
});

// --- Disclosed blocker: reassigning between occurrence/type classes when the element
// has at least one representation needs `api.geometry.assignRepresentation`/
// `.editObjectPlacement`, neither ported. See `../../../src/api/root/reassignClass.ts`'s
// own header comment and `TODOS.md`. ---

describe.each(AVAILABLE_SCHEMAS)("api.root.reassignClass -- disclosed blocker (%s)", (schema) => {
	test("switching from an occurrence class to a type class with a representation throws (api.geometry.assignRepresentation not ported)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation");
		representation.set("ContextOfItems", context);
		element.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [representation]));

		expect(() => reassignClass(file, { product: element, ifcClass: "IfcSlabType" })).toThrow(
			/api\.geometry\.assignRepresentation/,
		);
	});

	test("switching from a type class to an occurrence class with a representation throws (api.geometry.assignRepresentation not ported)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation");
		representation.set("ContextOfItems", context);
		representation.set("Items", [file.createEntity("IfcExtrudedAreaSolid")]);
		const mappingOrigin = file.createEntity("IfcAxis2Placement3D");
		element.set("RepresentationMaps", [file.createEntity("IfcRepresentationMap", mappingOrigin, representation)]);

		expect(() => reassignClass(file, { product: element, ifcClass: "IfcSlab" })).toThrow(
			/api\.geometry\.assignRepresentation/,
		);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.root.reassignClass Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the original class; redo re-applies the reassignment", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const id = element.id();

		file.beginTransaction();
		reassignClass(file, { product: element, ifcClass: "IfcSlab" });
		file.endTransaction();

		expect(file.byId(id).isA("IfcSlab")).toBe(true);

		file.undo();
		expect(file.byId(id).isA("IfcWall")).toBe(true);

		file.redo();
		expect(file.byId(id).isA("IfcSlab")).toBe(true);
	});

	test("undo restores the type-to-occurrence switch's unwired container/pset state", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const container = file.createEntity("IfcBuilding");
		assignContainer(file, { products: [element], relatingStructure: container });
		const pset = addPset(file, { product: element, name: "TestPset" });
		const elementId = element.id();
		const psetId = pset.id();

		file.beginTransaction();
		reassignClass(file, { product: element, ifcClass: "IfcSlabType" });
		file.endTransaction();

		expect(file.byId(elementId).isA("IfcSlabType")).toBe(true);
		expect(file.byType("IfcRelContainedInSpatialStructure")).toHaveLength(0);

		file.undo();
		expect(file.byId(elementId).isA("IfcWall")).toBe(true);
		expect(file.byType("IfcRelContainedInSpatialStructure")).toHaveLength(1);
		expect((elementUtil.getPset(file.byId(elementId), "TestPset") as { id: number }).id).toBe(psetId);

		file.redo();
		expect(file.byId(elementId).isA("IfcSlabType")).toBe(true);
		expect(file.byType("IfcRelContainedInSpatialStructure")).toHaveLength(0);
	});
});
