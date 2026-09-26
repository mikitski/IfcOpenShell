// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/root/test_reassign_class.py` (src/ifcopenshell-python,
// `TestReassignClass`/`TestReassignClassIFC4X3`/`TestReassignClassIFC2X3`). Every real
// Python test is now ported for real below -- confirmed directly against
// `../../../src/api/root/reassignClass.ts`'s own header comment, `simpleReassignment`
// and BOTH directions of `switchBetweenClassTypes` are now fully portable:
// `api.geometry.assignRepresentation` (landed earlier) unblocked
// `test_keeping_representations_switching_from_occurrence_class_to_type_class`
// (`occurrence_to_type`), and `api.geometry.editObjectPlacement` (landed in this
// chunk) retroactively unblocks the last remaining case,
// `test_keeping_representations_switching_from_type_class_to_occurrence_class`
// (`type_to_occurrence`) -- both are now ported with their real Python assertions, no
// disclosed-throw pin left in this file.

import { describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/aggregate/assignObject";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import { addPset } from "../../../src/api/pset/addPset";
import { reassignClass } from "../../../src/api/root/reassignClass";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import { assignType } from "../../../src/api/type/assignType";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import * as representationUtil from "../../../src/util/representation";
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

	// Real Python: `test_keeping_representations_switching_from_occurrence_class_to_type_class`.
	test("keeps representations when switching from an occurrence class to a type class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation", context);
		assignRepresentation(file, { product: element, representation });

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlabType" });

		expect(representationUtil.getRepresentation(newElement, context)?.equals(representation)).toBe(true);
		expect(file.byType("IfcWall")).toHaveLength(0);
		expect(file.byType("IfcSlabType")).toHaveLength(1);
	});

	// Real Python: `test_keeping_representations_switching_from_type_class_to_occurrence_class`
	// -- now fully portable (`api.geometry.editObjectPlacement` has landed). See
	// `../../../src/api/root/reassignClass.ts`'s own header comment.
	test("keeps representations when switching from a type class to an occurrence class", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation", context);
		representation.set("Items", [file.createEntity("IfcExtrudedAreaSolid")]);
		assignRepresentation(file, { product: element, representation });

		const newElement = reassignClass(file, { product: element, ifcClass: "IfcSlab" });

		expect(file.byType("IfcRepresentationMap")).toHaveLength(0);
		expect(representationUtil.getRepresentation(newElement, context)?.equals(representation)).toBe(true);
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

	// New real behavior this chunk enables (`occurrence_to_type` now carries
	// representations across the switch via the real `api.geometry.assignRepresentation`
	// -- see `../../../src/api/root/reassignClass.ts`'s own header comment).
	test("undo restores the occurrence's representation; redo re-applies the type's carried-over representation", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation", context);
		assignRepresentation(file, { product: element, representation });
		const elementId = element.id();
		const representationId = representation.id();

		file.beginTransaction();
		reassignClass(file, { product: element, ifcClass: "IfcSlabType" });
		file.endTransaction();

		expect(file.byId(elementId).isA("IfcSlabType")).toBe(true);
		expect(
			representationUtil.getRepresentation(file.byId(elementId), context)?.equals(file.byId(representationId)),
		).toBe(true);

		file.undo();
		expect(file.byId(elementId).isA("IfcWall")).toBe(true);
		expect(
			representationUtil.getRepresentation(file.byId(elementId), context)?.equals(file.byId(representationId)),
		).toBe(true);

		file.redo();
		expect(file.byId(elementId).isA("IfcSlabType")).toBe(true);
		expect(
			representationUtil.getRepresentation(file.byId(elementId), context)?.equals(file.byId(representationId)),
		).toBe(true);
	});
});
