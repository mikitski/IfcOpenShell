// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/root/test_copy_class.py` (src/ifcopenshell-python,
// `TestCopyClass`/`TestCopyClassIFC2X3`). Real Python's own fixtures lean on several
// sibling `api.*` functions this codebase hasn't ported yet (`api.feature.add_feature`/
// `add_filling`, `api.geometry.edit_object_placement`/`connect_path`,
// `api.unit.assign_unit`) -- every such case is ported here with its fixture built
// directly via `file.createEntity`/`withAttrs` instead, matching `removeProduct
// .test.ts`'s own established precedent for this exact substitution. `api.system.add_port`/
// `assign_port`/`connect_port` are no longer in that list -- `api.system` landed for
// real and the one test that needs them (`test_copying_distribution_ports`, below) now
// uses the real functions directly, matching the fixture real Python itself uses.
//
// 1 real Python test is genuinely blocked (a disclosed dependency on
// `api.geometry.editObjectPlacement`, which has no TS port at all -- see
// `../../../src/api/root/copyClass.ts`'s own header comment and `TODOS.md`) and is
// pinned instead as a dedicated "throws the disclosed blocked error" regression test,
// not silently dropped: `test_copying_distribution_ports`.
//
// `test_copying_material_sets_for_type_elements_only` (needs `api.material.copyMaterial`)
// was ALSO blocked originally, but `api.material` chunk 1 landed `copyMaterial` for real
// before this PR merged -- that test now runs with its real assertions instead.
//
// `test_copying_distribution_ports` itself was ALSO originally blocked on a second,
// now-resolved dependency: `api.system` (`unassignPort`/`disconnectPort`) had no TS
// port of any kind at all. The `api.system` chunk landed those for real, so
// `copyClass.ts`'s ports branch now performs the ENTIRE real port-copying/cleanup
// sequence (recursive port copy, new nest/connection relationship, `unassignPort`,
// `disconnectPort`) -- it throws only at the one step that's still genuinely blocked,
// `api.geometry.editObjectPlacement`'s own placement-relocalization call, which real
// Python calls UNCONDITIONALLY for every copied port (unlike `api.system.assignPort`'s
// own placement-guarded call site) -- so this test still can't run with its real
// assertions, but the disclosed-throw regression test below is updated to assert the
// real partial-mutation state up to that exact point (matching this project's
// "throw only at the exact blocked point, after every mutation real Python would
// already have made" discipline), not just a bare "it throws".
//
// The 2 pset-copying tests below don't use `api.pset.editPset` to populate their
// property's value -- `editPset.ts`'s own header comment discloses a real,
// pre-existing, already-confirmed primitive-layer gap (`"Attribute access is only
// supported on entity instances"`) that fires for essentially any plain-JS-scalar
// property value, unrelated to anything `copyClass` itself does. Instead, a raw
// `IfcPropertySingleValue` is created directly with a plain string `NominalValue`
// (matching `removeProduct.test.ts`'s own `addRawProperty` helper's identical,
// already-established substitution).

import { describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/aggregate/assignObject";
import { addGroup } from "../../../src/api/group/addGroup";
import { assignGroup } from "../../../src/api/group/assignGroup";
import { addPset } from "../../../src/api/pset/addPset";
import { copyClass } from "../../../src/api/root/copyClass";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import { addPort } from "../../../src/api/system/addPort";
import { connectPort } from "../../../src/api/system/connectPort";
import { assignType } from "../../../src/api/type/assignType";
import { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import * as elementUtil from "../../../src/util/element";
import * as systemUtil from "../../../src/util/system";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Unwraps a possibly entity-wrapped scalar value -- see this file's own header comment (`.get()` returns a fresh, non-identity-stable wrapper per call, so a wrapped value's own underlying scalar, not the wrapper object, is what's actually comparable across two separate reads). */
function rawValue(value: unknown): unknown {
	return value instanceof EntityInstance ? value.getByIndex(0) : value;
}

/** See `removeProduct.test.ts`'s identical `withAttrs` helper's own doc comment. */
function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

/** See this file's own header comment for why a bare, positionally-underfilled `createEntity` (matching `removeProduct.test.ts`'s `addRawProperty`) is used instead of `api.pset.editPset`. */
function addRawProperty(pset: EntityInstance, file: IfcFile): EntityInstance {
	const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
	pset.set("HasProperties", [prop]);
	return prop;
}

describe.each(AVAILABLE_SCHEMAS)("api.root.copyClass (%s)", (schema) => {
	test("copying a simple element", () => {
		const file = createTestFile(schema);
		// A real `GlobalId` (not a bare bogus positional-underfilled `createEntity`) --
		// `util.element.copy`'s own `GlobalId` regeneration only fires for a non-null old
		// value (a null attribute is skipped entirely, matching real Python's `if
		// attribute is None: continue`), so this fixture needs a real one to meaningfully
		// exercise "the copy gets its own new GlobalId".
		const element = file.createEntity("IfcWall", guid.new());

		const newElement = copyClass(file, { product: element });

		expect(newElement.equals(element)).toBe(false);
		expect(newElement.get("GlobalId")).not.toBe(element.get("GlobalId"));
		expect(newElement.isA("IfcWall")).toBe(true);
	});

	test("copying object placements so children of the original element don't reference the new element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });
		const elementPlacement = withAttrs(file, "IfcLocalPlacement", {
			RelativePlacement: file.createEntity("IfcAxis2Placement3D"),
		});
		element.set("ObjectPlacement", elementPlacement);
		const subelementPlacement = withAttrs(file, "IfcLocalPlacement", {
			RelativePlacement: file.createEntity("IfcAxis2Placement3D"),
			PlacementRelTo: elementPlacement,
		});
		subelement.set("ObjectPlacement", subelementPlacement);

		const newElement = copyClass(file, { product: element });

		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				elementPlacement,
			),
		).toBe(true);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				newElement.get("ObjectPlacement") as EntityInstance,
			),
		).toBe(false);
		expect(
			((element.get("ObjectPlacement") as EntityInstance).get("RelativePlacement") as EntityInstance).equals(
				(newElement.get("ObjectPlacement") as EntityInstance).get("RelativePlacement") as EntityInstance,
			),
		).toBe(false);
	});

	test("copying psets so changing properties of the new element does not affect the old", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, { product: element, name: "Foobar" });
		addRawProperty(pset, file);

		const newElement = copyClass(file, { product: element });

		const oldPset = (element.get("IsDefinedBy") as EntityInstance[])[0]?.get(
			"RelatingPropertyDefinition",
		) as EntityInstance;
		const newPset = (newElement.get("IsDefinedBy") as EntityInstance[])[0]?.get(
			"RelatingPropertyDefinition",
		) as EntityInstance;
		expect(
			((element.get("IsDefinedBy") as EntityInstance[])[0] as EntityInstance).equals(
				(newElement.get("IsDefinedBy") as EntityInstance[])[0] as EntityInstance,
			),
		).toBe(false);
		expect(oldPset.equals(newPset)).toBe(false);
		expect(oldPset.get("Name")).toBe(newPset.get("Name"));
		const oldProp = (oldPset.get("HasProperties") as EntityInstance[])[0] as EntityInstance;
		const newProp = (newPset.get("HasProperties") as EntityInstance[])[0] as EntityInstance;
		expect(oldProp.equals(newProp)).toBe(false);
		expect(oldProp.get("Name")).toBe(newProp.get("Name"));
		expect(rawValue(oldProp.get("NominalValue"))).toBe(rawValue(newProp.get("NominalValue")));
	});

	test("copying type psets so changing properties of the new type does not affect the old", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const pset = addPset(file, { product: element, name: "Foobar" });
		addRawProperty(pset, file);

		const newElement = copyClass(file, { product: element });

		const oldPset = (element.get("HasPropertySets") as EntityInstance[])[0] as EntityInstance;
		const newPset = (newElement.get("HasPropertySets") as EntityInstance[])[0] as EntityInstance;
		expect(oldPset.equals(newPset)).toBe(false);
		expect(oldPset.get("Name")).toBe(newPset.get("Name"));
		const oldProp = (oldPset.get("HasProperties") as EntityInstance[])[0] as EntityInstance;
		const newProp = (newPset.get("HasProperties") as EntityInstance[])[0] as EntityInstance;
		expect(oldProp.equals(newProp)).toBe(false);
		expect(oldProp.get("Name")).toBe(newProp.get("Name"));
		expect(rawValue(oldProp.get("NominalValue"))).toBe(rawValue(newProp.get("NominalValue")));
	});

	test("copying a container only and not its contents", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		const newElement = copyClass(file, { product: element });

		expect((element.get("ContainsElements") as EntityInstance[] | null) ?? []).not.toHaveLength(0);
		expect((newElement.get("ContainsElements") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("copying contents of a container and maintaining the containment relationship", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		const newElement = copyClass(file, { product: subelement });

		expect(
			(
				((newElement.get("ContainedInStructure") as EntityInstance[])[0] as EntityInstance).get(
					"RelatingStructure",
				) as EntityInstance
			).equals(element),
		).toBe(true);
	});

	test("copying a container only and not its decomposition", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcBuildingStorey");
		assignObject(file, { products: [subelement], relatingObject: element });

		const newElement = copyClass(file, { product: element });

		expect((element.get("IsDecomposedBy") as EntityInstance[] | null) ?? []).not.toHaveLength(0);
		expect((newElement.get("IsDecomposedBy") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("copying an aggregate only and not its decomposition", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcBeam");
		assignObject(file, { products: [subelement], relatingObject: element });

		const newElement = copyClass(file, { product: element });

		expect((element.get("IsDecomposedBy") as EntityInstance[] | null) ?? []).not.toHaveLength(0);
		expect((newElement.get("IsDecomposedBy") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("copying an aggregate decomposition and maintaining the aggregate relationship", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcBeam");
		assignObject(file, { products: [subelement], relatingObject: element });

		const newElement = copyClass(file, { product: subelement });

		expect(
			(
				((newElement.get("Decomposes") as EntityInstance[])[0] as EntityInstance).get(
					"RelatingObject",
				) as EntityInstance
			).equals(element),
		).toBe(true);
	});

	test("not copying any representations because life is hard", () => {
		const file = createTestFile(schema);
		const element = withAttrs(file, "IfcWall", {
			Representation: file.createEntity("IfcProductDefinitionShape", null, null, []),
		});
		const newElement = copyClass(file, { product: element });
		expect(newElement.get("Representation")).toBeNull();

		const elementType = withAttrs(file, "IfcWallType", {
			RepresentationMaps: [
				file.createEntity(
					"IfcRepresentationMap",
					file.createEntity("IfcAxis2Placement3D"),
					file.createEntity("IfcShapeRepresentation"),
				),
			],
		});
		const newType = copyClass(file, { product: elementType });
		expect(newType.get("RepresentationMaps")).toBeNull();
	});

	test("copying an element with an opening", () => {
		// IfcOpeningElement opening.
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: wall, RelatedOpeningElement: opening });
		const newWall = copyClass(file, { product: wall });
		const wallOpenings = wall.get("HasOpenings") as EntityInstance[];
		const newWallOpenings = newWall.get("HasOpenings") as EntityInstance[];
		expect((wallOpenings[0] as EntityInstance).equals(newWallOpenings[0] as EntityInstance)).toBe(false);
		expect(((wallOpenings[0] as EntityInstance).get("RelatedOpeningElement") as EntityInstance).equals(opening)).toBe(
			true,
		);
		expect(
			((newWallOpenings[0] as EntityInstance).get("RelatedOpeningElement") as EntityInstance).equals(opening),
		).toBe(false);
		expect(
			((newWallOpenings[0] as EntityInstance).get("RelatedOpeningElement") as EntityInstance).isA("IfcOpeningElement"),
		).toBe(true);

		// IfcVoidingFeature opening (IFC4+ only class -- skip on IFC2X3).
		if (schema !== "IFC2X3") {
			const plate = file.createEntity("IfcPlate");
			const voidingFeature = file.createEntity("IfcVoidingFeature");
			withAttrs(file, "IfcRelVoidsElement", {
				RelatingBuildingElement: plate,
				RelatedOpeningElement: voidingFeature,
			});
			const newPlate = copyClass(file, { product: plate });
			const plateOpenings = plate.get("HasOpenings") as EntityInstance[];
			const newPlateOpenings = newPlate.get("HasOpenings") as EntityInstance[];
			expect((plateOpenings[0] as EntityInstance).equals(newPlateOpenings[0] as EntityInstance)).toBe(false);
			expect(
				((plateOpenings[0] as EntityInstance).get("RelatedOpeningElement") as EntityInstance).equals(voidingFeature),
			).toBe(true);
			expect(
				((newPlateOpenings[0] as EntityInstance).get("RelatedOpeningElement") as EntityInstance).equals(voidingFeature),
			).toBe(false);
			expect(
				((newPlateOpenings[0] as EntityInstance).get("RelatedOpeningElement") as EntityInstance).isA(
					"IfcVoidingFeature",
				),
			).toBe(true);
		}
	});

	test("copying an element with a filled opening should not copy the opening nor the fill", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		const window = file.createEntity("IfcWindow");
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: wall, RelatedOpeningElement: opening });
		withAttrs(file, "IfcRelFillsElement", { RelatingOpeningElement: opening, RelatedBuildingElement: window });

		const newWall = copyClass(file, { product: wall });

		expect((newWall.get("HasOpenings") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("copying an opening voiding an element", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: wall, RelatedOpeningElement: opening });

		const newOpening = copyClass(file, { product: opening });

		const openingVoids = opening.get("VoidsElements") as EntityInstance[];
		const newOpeningVoids = newOpening.get("VoidsElements") as EntityInstance[];
		expect((openingVoids[0] as EntityInstance).equals(newOpeningVoids[0] as EntityInstance)).toBe(false);
		expect(((newOpeningVoids[0] as EntityInstance).get("RelatingBuildingElement") as EntityInstance).equals(wall)).toBe(
			true,
		);
	});

	test("copying an opening with a filling", () => {
		const file = createTestFile(schema);
		const door = file.createEntity("IfcDoor");
		const opening = file.createEntity("IfcOpeningElement");
		withAttrs(file, "IfcRelFillsElement", { RelatingOpeningElement: opening, RelatedBuildingElement: door });

		const newOpening = copyClass(file, { product: opening });

		expect((newOpening.get("HasFillings") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("copying a filling", () => {
		const file = createTestFile(schema);
		const door = file.createEntity("IfcDoor");
		const opening = file.createEntity("IfcOpeningElement");
		withAttrs(file, "IfcRelFillsElement", { RelatingOpeningElement: opening, RelatedBuildingElement: door });

		const newDoor = copyClass(file, { product: door });

		expect((newDoor.get("FillsVoids") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("retaining a single material", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "Foo" });
		withAttrs(file, "IfcRelAssociatesMaterial", { RelatedObjects: [element], RelatingMaterial: material });

		const newElement = copyClass(file, { product: element });

		const oldAssoc = (element.get("HasAssociations") as EntityInstance[])[0] as EntityInstance;
		const newAssoc = (newElement.get("HasAssociations") as EntityInstance[])[0] as EntityInstance;
		expect(
			(newAssoc.get("RelatingMaterial") as EntityInstance).equals(oldAssoc.get("RelatingMaterial") as EntityInstance),
		).toBe(true);
		expect((newAssoc.get("RelatingMaterial") as EntityInstance).isA("IfcMaterial")).toBe(true);
	});

	test("copying material set usages", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const layerSet = withAttrs(file, "IfcMaterialLayerSet", { MaterialLayers: [] });
		const material = withAttrs(file, "IfcMaterialLayerSetUsage", {
			ForLayerSet: layerSet,
			LayerSetDirection: "AXIS2",
			DirectionSense: "POSITIVE",
			OffsetFromReferenceLine: 0,
		});
		withAttrs(file, "IfcRelAssociatesMaterial", { RelatedObjects: [element], RelatingMaterial: material });

		const newElement = copyClass(file, { product: element });

		const oldAssoc = (element.get("HasAssociations") as EntityInstance[])[0] as EntityInstance;
		const newAssoc = (newElement.get("HasAssociations") as EntityInstance[])[0] as EntityInstance;
		expect(
			(newAssoc.get("RelatingMaterial") as EntityInstance).equals(oldAssoc.get("RelatingMaterial") as EntityInstance),
		).toBe(false);
		expect((newAssoc.get("RelatingMaterial") as EntityInstance).isA("IfcMaterialLayerSetUsage")).toBe(true);
	});

	test("copying a type and purging type relationships", () => {
		const file = createTestFile(schema);
		const type = file.createEntity("IfcWallType");
		const element = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element], relatingType: type });

		const newType = copyClass(file, { product: type });

		// `util.element.getTypes` (not a raw `.get("Types")`) -- IFC2X3 has no `Types`
		// inverse attribute at all (it uses `ObjectTypeOf` instead), matching this
		// project's other schema-portable assertions elsewhere in this file.
		expect(elementUtil.getTypes(newType)).toHaveLength(0);
	});

	test("not copying path connections", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		withAttrs(file, "IfcRelConnectsPathElements", {
			RelatingElement: element1,
			RelatedElement: element2,
			RelatingPriorities: [],
			RelatedPriorities: [],
			RelatedConnectionType: "NOTDEFINED",
			RelatingConnectionType: "NOTDEFINED",
		});

		const newElement1 = copyClass(file, { product: element1 });

		expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(1);
		expect((element1.get("ConnectedTo") as EntityInstance[] | null) ?? []).not.toHaveLength(0);
		expect((element2.get("ConnectedFrom") as EntityInstance[] | null) ?? []).not.toHaveLength(0);
		expect((newElement1.get("ConnectedTo") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect((newElement1.get("ConnectedFrom") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("maintaining group relationships", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = addGroup(file, {});
		assignGroup(file, { group, products: [element] });

		const newElement = copyClass(file, { product: element });

		expect(file.byType("IfcRelAssignsToGroup")).toHaveLength(1);
		expect(
			(
				((newElement.get("HasAssignments") as EntityInstance[])[0] as EntityInstance).get(
					"RelatingGroup",
				) as EntityInstance
			).equals(group),
		).toBe(true);
	});
});

// --- Disclosed blockers: real, load-bearing dependencies on `api.system`/`api.material`,
// neither of which has any TS port at all. See
// `../../../src/api/root/copyClass.ts`'s own header comment and `TODOS.md`. ---

describe.each(AVAILABLE_SCHEMAS)("api.root.copyClass -- disclosed blockers (%s)", (schema) => {
	test("copying distribution ports performs the real port-copy/cleanup sequence, then throws at the still-blocked editObjectPlacement step (api.geometry.editObjectPlacement not ported)", () => {
		// Python: `test_copying_distribution_ports` -- adapted per this file's own header
		// comment: `api.system.addPort`/`connectPort` are real now, used directly (no
		// substitution needed for those); the fixture is otherwise identical to real
		// Python's own `TestCopyClass.test_copying_distribution_ports`.
		const file = createTestFile(schema);
		const element = file.createEntity("IfcFlowTerminal");
		const port = addPort(file, { element });
		const element2 = file.createEntity("IfcFlowTerminal");
		const port2 = addPort(file, { element2 });
		connectPort(file, { port1: port, port2: port2, direction: "NOTDEFINED" });

		expect(() => copyClass(file, { product: element })).toThrow(/api\.geometry\.editObjectPlacement/);

		// Real Python's own assertions, verified up to the exact point this now throws:
		// the port itself WAS recursively copied (a 3rd `IfcDistributionPort` now exists)...
		const allPorts = file.byType("IfcDistributionPort");
		expect(allPorts.length).toBe(3);
		const newPort = allPorts.find((p) => !p.equals(port) && !p.equals(port2)) as EntityInstance;
		expect(newPort).toBeDefined();

		// ...and the ORIGINAL element's own ports are unaffected -- `unassignPort`'s
		// cleanup already stripped the recursive copy's own side effect back out (Python:
		// `assert ifcopenshell.util.system.get_ports(element) == [port]`).
		const elementPorts = systemUtil.getPorts(element);
		expect(elementPorts.length).toBe(1);
		expect(elementPorts[0].equals(port)).toBe(true);

		// ...and the new port is disconnected from whatever the original was connected to
		// -- `disconnectPort`'s cleanup already ran (Python: `assert not ifcopenshell
		// .util.system.get_connected_port(new_ports[0])`).
		expect(systemUtil.getConnectedPort(newPort)).toBeNull();
	});

	// Python: `test_copying_material_sets_for_type_elements_only` -- now real, since
	// `api.material.copyMaterial` landed for real (api.material chunk 1), matching this
	// project's established "replace a disclosed-throw test with the real assertions
	// once the blocker resolves" precedent.
	test("copying an IfcMaterialLayerSet material association duplicates the whole set", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const singleMaterial = withAttrs(file, "IfcMaterial", { Name: "Foo" });
		const layer = withAttrs(file, "IfcMaterialLayer", { Material: singleMaterial, LayerThickness: 0.1 });
		const materialSet = withAttrs(file, "IfcMaterialLayerSet", { MaterialLayers: [layer] });
		withAttrs(file, "IfcRelAssociatesMaterial", { RelatedObjects: [element], RelatingMaterial: materialSet });

		const newElement = copyClass(file, { product: element });

		const originalRel = (element.get("HasAssociations") as EntityInstance[])[0];
		const newRel = (newElement.get("HasAssociations") as EntityInstance[])[0];
		const newMaterialSet = newRel.get("RelatingMaterial") as EntityInstance;
		const originalMaterialSet = originalRel.get("RelatingMaterial") as EntityInstance;

		expect(newMaterialSet.isA("IfcMaterialLayerSet")).toBe(true);
		// The set itself is a fresh, independent duplicate...
		expect(newMaterialSet.equals(originalMaterialSet)).toBe(false);
		const newLayer = (newMaterialSet.get("MaterialLayers") as EntityInstance[])[0];
		const originalLayer = (originalMaterialSet.get("MaterialLayers") as EntityInstance[])[0];
		// ...and so is each layer within it...
		expect(newLayer.equals(originalLayer)).toBe(false);
		// ...but the underlying single IfcMaterial each layer references is reused, not copied.
		expect((newLayer.get("Material") as EntityInstance).equals(singleMaterial)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.root.copyClass Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the copy; redo re-creates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		element.set("Name", "Wall 1");
		const nBefore = [...file].length;

		file.beginTransaction();
		const newElement = copyClass(file, { product: element });
		file.endTransaction();
		const newId = newElement.id();

		expect([...file].length).toBe(nBefore + 1);
		expect(file.byId(newId).get("Name")).toBe("Wall 1");

		file.undo();
		expect(() => file.byId(newId)).toThrow();
		expect([...file].length).toBe(nBefore);

		file.redo();
		expect(file.byId(newId).get("Name")).toBe("Wall 1");
	});
});
