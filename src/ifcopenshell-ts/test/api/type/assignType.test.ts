// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/type/test_assign_type.py` (src/ifcopenshell-python).
// Real Python's `TestAssignType` runs against IFC4/IFC2X3/IFC4X3 (multiple
// inheritance); `describe.each(AVAILABLE_SCHEMAS)` below reproduces the same coverage
// (computed once at collection time, so it's already CI-safe when only IFC4 is
// registered -- see `../../bootstrap.ts`).
//
// --- One remaining real, load-bearing dependency on an unported module: adapted, not
// silently dropped -- see `../../../src/api/type/assignType.ts`'s own header comment ---
//
// `test_map_representation` is pinned below (in its own "disclosed, currently
// blocked" describe block) as a dedicated "throws the disclosed blocked error"
// regression test, matching this project's established
// `addConversionBasedUnit.test.ts`/`editPset.test.ts` precedent for exactly this
// situation (still blocked on `api.geometry.mapRepresentation`/`.assignRepresentation`,
// neither ported).
//
// `test_do_not_map_representation_if_type_was_assigned_previously` is NOT ported, even
// adapted: it tests a strictly *deeper* behavior (idempotency on a *second* call, once
// an occurrence is already mapped from a *first*, successful call) that is
// fundamentally unreachable while `api.geometry.mapRepresentation` is blocked -- the
// first call itself throws before ever reaching that state, so there is no "already
// mapped" precondition this port could ever construct to pin against. This is a real
// gap, not a silent omission: once `api.geometry.mapRepresentation` lands, this test
// should be ported for real (its assertions are unaffected by anything in this chunk).
//
// `test_map_material_usages`/`test_do_not_reassign_material_if_it_was_assigned_
// previously` USED to be in the same "blocked, can't even construct the precondition"
// situation as the representation-mapping tests above -- `api.material` had no TS
// port of any kind when this file was first written. Both are now ported FOR REAL
// below (in the main `describe.each` block, not the "disclosed, currently blocked"
// one) -- `api.material` chunk 1 landed `assignMaterial`/`unassignMaterial`/
// `copyMaterial` (`../../../src/api/material/index.ts`), and `assignMaterial`'s own
// `"...Usage"` branches (the exact ones `mapMaterialUsages` needs) have no sibling
// blocker of their own (see `assignMaterial.ts`'s own header comment), so both real
// Python assertions -- including the "do not reassign" idempotency one, now
// genuinely reachable -- are ported verbatim.
//
// `test_map_representation_disabled` IS fully portable -- `should_map_representations:
// false` short-circuits both the (still-)blocked representation-mapping path and the
// (now-real) material-usage-mapping path entirely -- and is ported below verbatim,
// doubling as this chunk's concrete demonstration that the non-blocked majority of
// `assign_type` works end to end even when the type actually has a representation and
// a material.

import { describe, expect, test } from "vitest";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { assignType } from "../../../src/api/type/assignType";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getMaterial, getType } from "../../../src/util/element";
import { getRepresentation } from "../../../src/util/representation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

/** Real Python: `ifcopenshell.api.geometry.assign_representation(file, product=<a type>, representation=rep)` -- not ported (see this file's own header comment), so test fixtures build the resulting `RepresentationMaps` entry directly, matching `../geometry/unassignRepresentation.test.ts`'s own established `withAttrs`-based fixture-building precedent. */
function assignTypeRepresentationMap(file: IfcFile, type: EntityInstance, representation: EntityInstance): void {
	const repMap = file.createEntity("IfcRepresentationMap", file.createEntity("IfcAxis2Placement3D"), representation);
	type.set("RepresentationMaps", [repMap]);
}

describe.each(AVAILABLE_SCHEMAS)("api.type.assignType (%s)", (schema) => {
	test("assigning a type", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");

		const rel = assignType(file, { relatedObjects: [element1, element2], relatingType: elementType });

		expect(getType(element1)?.equals(elementType)).toBe(true);
		expect(getType(element2)?.equals(elementType)).toBe(true);
		expect(rel?.isA("IfcRelDefinesByType")).toBe(true);
	});

	test("doing nothing if type is already assigned", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, { relatedObjects: [element], relatingType: elementType });
		const totalBefore = [...file].length;

		assignType(file, { relatedObjects: [element], relatingType: elementType });

		expect([...file].length).toBe(totalBefore);
	});

	test("old typing relationships are updated if they still have elements", () => {
		const file = createTestFile(schema);
		const elementType1 = file.createEntity("IfcWallType");
		const elementType2 = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1, element2], relatingType: elementType1 });
		const rel =
			schema === "IFC2X3"
				? ((element1.get("IsDefinedBy") as EntityInstance[]).find((r) =>
						r.isA("IfcRelDefinesByType"),
					) as EntityInstance)
				: (element1.get("IsTypedBy") as EntityInstance[])[0];
		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		assignType(file, { relatedObjects: [element1], relatingType: elementType2 });

		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	test("old typing relationships are purged if no more elements are nested", () => {
		const file = createTestFile(schema);
		const elementType1 = file.createEntity("IfcWallType");
		const elementType2 = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1], relatingType: elementType1 });
		const relId = (
			schema === "IFC2X3"
				? ((element1.get("IsDefinedBy") as EntityInstance[]).find((r) =>
						r.isA("IfcRelDefinesByType"),
					) as EntityInstance)
				: (element1.get("IsTypedBy") as EntityInstance[])[0]
		).id();

		assignType(file, { relatedObjects: [element1], relatingType: elementType2 });

		expect(() => file.byId(relId)).toThrow();
	});

	test("map representation disabled (should_map_representations: false avoids the blocked geometry dependency and material-usage mapping)", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = withAttrs(file, "IfcShapeRepresentation", { ContextOfItems: context });
		assignTypeRepresentationMap(file, elementType, rep);
		assignMaterial(file, { products: [elementType], type: "IfcMaterialLayerSet" });

		const element = file.createEntity("IfcWall");
		expect(() =>
			assignType(file, {
				relatedObjects: [element],
				relatingType: elementType,
				shouldMapRepresentations: false,
			}),
		).not.toThrow();

		// No representation mapping and no material usage.
		expect(getRepresentation(element, context)).toBeNull();
		expect(getMaterial(element, false, false)).toBeNull();
	});

	// Real Python: `test_map_material_usages`. Ported for real now that
	// `api.material.assignMaterial` exists (this used to be one of this file's
	// disclosed-blocker tests -- see this file's own header comment). IFC2X3 only
	// covers `IfcMaterialLayerSet` (`IfcMaterialProfileSet`/`IfcMaterialProfileSetUsage`
	// don't exist on IFC2X3 at all), matching real Python's own schema branch.
	test("mapping material usages when the type has a material set assigns a matching Usage", () => {
		const file = createTestFile(schema);
		const materialTypes =
			schema === "IFC2X3"
				? (["IfcMaterialLayerSet"] as const)
				: (["IfcMaterialLayerSet", "IfcMaterialProfileSet"] as const);
		for (const materialType of materialTypes) {
			const elementType = file.createEntity("IfcWallType");
			assignMaterial(file, { products: [elementType], type: materialType });
			const element = file.createEntity("IfcWall");

			assignType(file, { relatedObjects: [element], relatingType: elementType });

			const material = getMaterial(element);
			expect(material).not.toBeNull();
			expect(material?.isA(`${materialType}Usage`)).toBe(true);
		}
	});

	// Real Python: `test_do_not_reassign_material_if_it_was_assigned_previously` --
	// genuinely unreachable while `api.material.assignMaterial` was blocked (see this
	// file's own header comment), now ported for real.
	test("does not reassign material usage if it was assigned previously", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignMaterial(file, { products: [elementType], type: "IfcMaterialLayerSet" });
		assignType(file, { relatedObjects: [element1], relatingType: elementType });
		const material1 = getMaterial(element1);
		expect(material1).not.toBeNull();
		const materialId = (material1 as EntityInstance).id();

		// Use 2 elements to trigger the material-assignment code block.
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1, element2], relatingType: elementType });
		const material2 = getMaterial(element1);
		expect(material2).not.toBeNull();
		expect((material2 as EntityInstance).id()).toBe(materialId);
	});

	test("remove predefined type if type assignment (see real GitHub issue #7006)", () => {
		const file = createTestFile(schema);
		const isIfc2x3 = schema === "IFC2X3";
		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "POLYGONAL");

		const element = file.createEntity("IfcWall");
		if (!isIfc2x3) {
			// In IFC2X3, there seems to be no example when both type and occurrence have
			// PredefinedType, so it's ignored (matches real Python's own comment).
			element.set("PredefinedType", "USERDEFINED");
		}
		element.set("ObjectType", "Test");

		assignType(file, { relatedObjects: [element], relatingType: elementType });

		if (!isIfc2x3) {
			expect(element.get("PredefinedType")).toBeNull();
		}
		expect(element.get("ObjectType")).toBeNull();
	});

	test("keep predefined type if type assignment is NOTDEFINED (see real GitHub issue #7011)", () => {
		const file = createTestFile(schema);
		const isIfc2x3 = schema === "IFC2X3";
		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "NOTDEFINED");

		const element = file.createEntity("IfcWall");
		if (!isIfc2x3) {
			element.set("PredefinedType", "USERDEFINED");
		}
		element.set("ObjectType", "Test");

		assignType(file, { relatedObjects: [element], relatingType: elementType });

		if (!isIfc2x3) {
			expect(element.get("PredefinedType")).toBe("USERDEFINED");
		}
		expect(element.get("ObjectType")).toBe("Test");
	});

	test("class mismatched pair raises", () => {
		const file = createTestFile(schema);
		const door = file.createEntity("IfcDoor");
		const wallType = file.createEntity("IfcWallType");

		expect(() => assignType(file, { relatedObjects: [door], relatingType: wallType })).toThrow(
			/IfcWallType cannot type IfcDoor/,
		);
		expect(getType(door)).toBeNull();
	});

	test("class mismatched pair does not mutate", () => {
		const file = createTestFile(schema);
		const door = file.createEntity("IfcDoor");
		const wallType = file.createEntity("IfcWallType");
		const relsBefore = file.byType("IfcRelDefinesByType");

		expect(() => assignType(file, { relatedObjects: [door], relatingType: wallType })).toThrow(TypeError);

		expect(file.byType("IfcRelDefinesByType")).toEqual(relsBefore);
	});

	test("partial mismatch in selection rejects whole call", () => {
		const file = createTestFile(schema);
		const door = file.createEntity("IfcDoor");
		const wall = file.createEntity("IfcWall");
		const wallType = file.createEntity("IfcWallType");

		expect(() => assignType(file, { relatedObjects: [door, wall], relatingType: wallType })).toThrow(TypeError);

		// The good occurrence must NOT have been typed -- partial mutation is the bug
		// class this guard exists to prevent.
		expect(getType(wall)).toBeNull();
		expect(getType(door)).toBeNull();
	});

	test("untypable occurrence rejected", () => {
		const file = createTestFile(schema);
		const opening = file.createEntity("IfcOpeningElement");
		const anyType = file.createEntity("IfcWallType");

		expect(() => assignType(file, { relatedObjects: [opening], relatingType: anyType })).toThrow(TypeError);
	});
});

// --- One remaining real, load-bearing dependency on an unported module: disclosed,
// pinned. (`test_map_material_usages` USED to be a second one here, but is now ported
// for real above, in the main describe block -- see this file's own header comment.) ---
//
// See this file's own header comment and `../../../src/api/type/assignType.ts`'s own
// header comment for the full writeup, and `TODOS.md` for the tracked entry.

describe.each(AVAILABLE_SCHEMAS)("api.type.assignType (%s) -- disclosed, currently blocked", (schema) => {
	test("mapping representations when the type has RepresentationMaps -- blocked on " +
		"api.geometry.mapRepresentation/assignRepresentation (real Python: test_map_representation)", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = withAttrs(file, "IfcShapeRepresentation", { ContextOfItems: context });
		assignTypeRepresentationMap(file, elementType, rep);
		const element = file.createEntity("IfcWall");

		expect(() => assignType(file, { relatedObjects: [element], relatingType: elementType })).toThrow(
			/needs api\.geometry\.mapRepresentation\/api\.geometry\.assignRepresentation/,
		);

		// Disclosed, real-Python-matching partial mutation: the `IfcRelDefinesByType`
		// surgery (this function's own non-blocked majority) always runs BEFORE the
		// blocked representation-mapping call, so it's already committed by the time
		// the throw happens -- exactly what would happen if the real
		// `api.geometry.map_representation` call itself raised partway through, not a
		// TS-specific regression. See `assignType.ts`'s own header comment.
		expect(file.byType("IfcRelDefinesByType").length).toBe(1);
		expect(getType(element)?.equals(elementType)).toBe(true);
	});
});

// --- Occurrence/type class-pairing validation: three layered fallbacks, not one ---
//
// See `../../../src/api/type/assignType.ts`'s own header comment for the full
// writeup. No direct Python test counterpart -- these isolate each of the three
// layers individually, which no single real Python test does on its own.

describe("api.type.assignType occurrence/type validation -- three-layer fallback (no direct Python counterpart)", () => {
	test("layer 1 (buildingSMART implementer-agreement map): IfcWallType accepts IfcWall", () => {
		const file = createTestFile("IFC4");
		const wallType = file.createEntity("IfcWallType");
		const wall = file.createEntity("IfcWall");

		expect(() => assignType(file, { relatedObjects: [wall], relatingType: wallType })).not.toThrow();
	});

	test("layer 2 (ApplicableOccurrence): a class pair the map doesn't cover at all is accepted when ApplicableOccurrence names a valid schema class", () => {
		// `IfcTypeProduct` (the abstract-in-spirit-but-instantiable base class Bonsai uses
		// for annotation types) has no entry at all in the implementer-agreement map, and
		// its own class name doesn't end in "Type" either (so the layer-3 fallback can't
		// help) -- isolating layer 2 cleanly.
		const file = createTestFile("IFC4");
		const typeProduct = file.createEntity("IfcTypeProduct");
		typeProduct.set("ApplicableOccurrence", "IfcAnnotation");
		const annotation = file.createEntity("IfcAnnotation");

		const rel = assignType(file, { relatedObjects: [annotation], relatingType: typeProduct });

		expect(rel?.isA("IfcRelDefinesByType")).toBe(true);
		expect(getType(annotation)?.equals(typeProduct)).toBe(true);
	});

	test("layer 2 negative control: without ApplicableOccurrence set, the same pairing is rejected", () => {
		const file = createTestFile("IFC4");
		const typeProduct = file.createEntity("IfcTypeProduct");
		const annotation = file.createEntity("IfcAnnotation");

		expect(() => assignType(file, { relatedObjects: [annotation], relatingType: typeProduct })).toThrow(
			/allowed occurrence classes: <none>/,
		);
	});

	// IFC2X3 has no `IfcTaskType` at all (confirmed against `src/generated/ifc2x3.d.ts`)
	// -- this layer-3-only fallback is IFC4+-specific, so this describe is scoped to
	// IFC4 alone (per this project's schema-availability test-gating convention, see
	// `test/util/doc.test.ts`) rather than looped over every `AVAILABLE_SCHEMAS` entry.
	describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("layer 3 (IFC4-only)", () => {
		test("Type-suffix stripping fallback: a process type the map doesn't cover (IfcTaskType) still accepts its Type-stripped occurrence class (IfcTask)", () => {
			const file = createTestFile("IFC4");
			const taskType = file.createEntity("IfcTaskType");
			const task = file.createEntity("IfcTask");

			const rel = assignType(file, { relatedObjects: [task], relatingType: taskType });

			expect(rel?.isA("IfcRelDefinesByType")).toBe(true);
			expect(getType(task)?.equals(taskType)).toBe(true);
		});
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.type.assignType Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the pre-assignment state; redo re-applies the new IfcRelDefinesByType", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element = file.createEntity("IfcWall");

		file.beginTransaction();
		const rel = assignType(file, { relatedObjects: [element], relatingType: elementType }) as EntityInstance;
		file.endTransaction();
		const relId = rel.id();

		expect(file.byType("IfcRelDefinesByType").length).toBe(1);
		expect(getType(element)?.equals(elementType)).toBe(true);

		file.undo();
		expect(file.byType("IfcRelDefinesByType").length).toBe(0);
		expect(getType(element)).toBeNull();

		file.redo();
		expect(file.byId(relId).isA("IfcRelDefinesByType")).toBe(true);
		expect(getType(element)?.equals(elementType)).toBe(true);
	});

	test("undo restores PredefinedType/ObjectType cleared by the double-typing guard; redo clears them again", () => {
		const file = createTestFile(schema);
		const isIfc2x3 = schema === "IFC2X3";
		const elementType = file.createEntity("IfcWallType");
		elementType.set("PredefinedType", "POLYGONAL");
		const element = file.createEntity("IfcWall");
		if (!isIfc2x3) {
			element.set("PredefinedType", "USERDEFINED");
		}
		element.set("ObjectType", "Test");

		file.beginTransaction();
		assignType(file, { relatedObjects: [element], relatingType: elementType });
		file.endTransaction();

		expect(element.get("ObjectType")).toBeNull();
		if (!isIfc2x3) expect(element.get("PredefinedType")).toBeNull();

		file.undo();
		expect(element.get("ObjectType")).toBe("Test");
		if (!isIfc2x3) expect(element.get("PredefinedType")).toBe("USERDEFINED");

		file.redo();
		expect(element.get("ObjectType")).toBeNull();
		if (!isIfc2x3) expect(element.get("PredefinedType")).toBeNull();
	});
});
