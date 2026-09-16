// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/root/test_remove_product.py` (src/ifcopenshell-python,
// `TestRemoveProduct`/`TestRemoveProductIFC2X3`). Real Python's own fixtures lean
// heavily on several sibling `api.*` functions this codebase hasn't ported yet
// (`api.feature.add_feature`/`add_filling`, `api.nest.assign_object`, `api.system
// .add_port`/`assign_port`/`connect_port`/`assign_flow_control`, `api.drawing
// .assign_product`, `api.geometry.edit_object_placement`/`connect_path`/
// `connect_element`, `api.material.add_material`/`assign_material`) -- every such case
// is ported here with its fixture built directly via `file.createEntity`/`withAttrs`
// instead (matching `../group/removeGroup.test.ts`'s and `../geometry
// /unassignRepresentation.test.ts`'s own established precedent for this exact
// substitution; `withAttrs` -- a small local helper reproducing `file.createEntity(type)`
// then one `.set()` call per keyword -- works around this port's positional-only
// `createEntity`, and a "create bare, don't bother filling in every EXPRESS-mandatory
// attribute" fixture is already established as safe: the native layer doesn't enforce
// attribute-cardinality validity at creation time, only real usecases' own logic does).
// Every real Python assertion that depended on an unported dependency's own
// entity-creation shape (e.g. an exact `len(list(self.file))` total-entity snapshot) is
// adapted to specific `file.byType(...)` counts instead, since this port's substituted
// fixture doesn't create the identical set of bookkeeping entities (e.g. `add_filling`
// creates no `OwnerHistory` at all, `add_feature` does) -- the underlying
// relationship-cascade behavior under test is unaffected either way.
//
// Only 1 real Python test is genuinely blocked now (a real, disclosed dependency on
// `api.feature`, which has no TS port at all -- see `../../../src/api/root
// /removeProduct.ts`'s own header comment and `TODOS.md`) and is pinned instead as a
// dedicated "throws the disclosed blocked error" regression test, matching
// `../type/mapTypeRepresentations.test.ts`'s/`../pset/editPset.test.ts`'s established
// precedent -- not silently dropped: `test_removing_all_openings_of_an_element` (needs
// `api.feature.remove_feature`).
//
// 3 more tests USED to be in this blocked group -- `test_removing_all_material_
// relationships_of_an_element` (needed `api.material.unassign_material`),
// `test_removing_axes_of_a_grid` (needed `api.grid.remove_grid_axis`), and
// `test_removing_all_space_boundaries_of_an_element` (needed `api.boundary
// .remove_boundary`) -- but are now all ported for real: see "removing all material
// relationships of an element"/"removing axes of a grid"/"removing all space boundaries
// of an element" below, and the `api.material`/`api.grid`/`api.boundary` chunks that
// landed `unassignMaterial` (`../material/index.ts`), `removeGridAxis`
// (`../grid/index.ts`), and `removeBoundary` (`../boundary/index.ts`) respectively.

import { describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/aggregate/assignObject";
import { createGridAxis } from "../../../src/api/grid/createGridAxis";
import { assignGroup } from "../../../src/api/group/assignGroup";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { addPset } from "../../../src/api/pset/addPset";
import { removeProduct } from "../../../src/api/root/removeProduct";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import { assignType } from "../../../src/api/type/assignType";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

/** See this file's own header comment for why a bare, positionally-underfilled `createEntity` is safe here. */
function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

/** See `../geometry/unassignRepresentation.test.ts`'s identical `blankFile` helper's own doc comment for why geometry/placement-count assertions need a project-free file. */
function blankFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	return file;
}

/**
 * Attaches a single raw `IfcPropertySingleValue` to `pset.HasProperties` directly via
 * `file.createEntity`, instead of `api.pset.editPset` -- `editPset` has a real,
 * pre-existing, already-disclosed blocker (`editPset.ts`'s own header comment: probing
 * a bare `file.createEntity(primaryMeasureType).attributeType(0)` to type-infer a plain
 * JS scalar value throws `"Attribute access is only supported on entity instances"`,
 * the same primitive-layer gap `util/migrator.ts`/`api/unit/addConversionBasedUnit.ts`
 * already independently confirmed) that fires for essentially any plain-value
 * `editPset(..., { properties: { Foo: "Bar" } })` call -- unrelated to anything
 * `removeProduct` itself does. `../group/removeGroup.test.ts`'s own
 * `test_removing_orphaned_property_relationships` established this exact substitution
 * first (raw `IfcPropertySingleValue`/`IfcPropertySet` construction, bypassing `editPset`
 * entirely) since `api.pset` wasn't ported at all yet when it was written; reused here
 * for the same reason, now that `api.pset` exists but `editPset`'s plain-value path is
 * still blocked.
 */
function addRawProperty(file: IfcFile, pset: EntityInstance): EntityInstance {
	const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
	pset.set("HasProperties", [prop]);
	return prop;
}

describe.each(AVAILABLE_SCHEMAS)("api.root.removeProduct (%s)", (schema) => {
	test("removing an element by itself", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");

		removeProduct(file, { product: element });

		expect(file.byType("IfcWall").length).toBe(0);
	});

	test("removing an element's local placement", () => {
		// Just removing the product with the placement.
		let file = blankFile(schema);
		let element = file.createEntity("IfcWall");
		element.set(
			"ObjectPlacement",
			withAttrs(file, "IfcLocalPlacement", { RelativePlacement: file.createEntity("IfcAxis2Placement3D") }),
		);

		removeProduct(file, { product: element });

		expect(file.byType("IfcLocalPlacement").length).toBe(0);
		expect(file.byType("IfcAxis2Placement3D").length).toBe(0);

		// Removing the product that shares the placement with another product.
		file = blankFile(schema);
		element = file.createEntity("IfcWall");
		const placement = withAttrs(file, "IfcLocalPlacement", {
			RelativePlacement: file.createEntity("IfcAxis2Placement3D"),
		});
		element.set("ObjectPlacement", placement);
		const element1 = file.createEntity("IfcWall");
		element1.set("ObjectPlacement", placement);

		removeProduct(file, { product: element });
		expect(file.byType("IfcLocalPlacement").length).toBe(1);
		removeProduct(file, { product: element1 });
		expect(file.byType("IfcLocalPlacement").length).toBe(0);

		// Removing the product whose placement is used as a reference point for another placement.
		file = blankFile(schema);
		element = file.createEntity("IfcWall");
		const placementA = withAttrs(file, "IfcLocalPlacement", {
			RelativePlacement: file.createEntity("IfcAxis2Placement3D"),
		});
		element.set("ObjectPlacement", placementA);
		const element1b = file.createEntity("IfcWall");
		const placementB = withAttrs(file, "IfcLocalPlacement", {
			RelativePlacement: file.createEntity("IfcAxis2Placement3D"),
		});
		element1b.set("ObjectPlacement", placementB);
		placementA.set("PlacementRelTo", placementB);

		removeProduct(file, { product: element });
		expect(file.byType("IfcLocalPlacement").length).toBe(1);
		removeProduct(file, { product: element1b });
		expect(file.byType("IfcLocalPlacement").length).toBe(0);
	});

	test("removing element type psets", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const pset = addPset(file, { product: element, name: "Foo_Bar" });
		addRawProperty(file, pset);

		const element2 = file.createEntity("IfcWallType");
		element2.set("HasPropertySets", [pset]);

		// Make sure it won't remove the pset if it's connected elsewhere.
		removeProduct(file, { product: element2 });
		expect(file.byType("IfcPropertySet").length).toBe(1);
		expect(file.byType("IfcPropertySingleValue").length).toBe(1);

		// If the product is the only inverse for the pset, it should remove the pset.
		removeProduct(file, { product: element });
		expect(file.byType("IfcPropertySet").length).toBe(0);
		expect(file.byType("IfcPropertySingleValue").length).toBe(0);
	});

	test("removing all representations of an element", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const element = withAttrs(file, "IfcWall", {
			Representation: withAttrs(file, "IfcProductDefinitionShape", { Representations: [representation] }),
		});

		removeProduct(file, { product: element });

		expect(file.byType("IfcProductDefinitionShape").length).toBe(0);
		expect(file.byType("IfcShapeRepresentation").length).toBe(0);
		expect(file.byType("IfcExtrudedAreaSolid").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(0);
	});

	test("unassigning but not removing mapped representations of an element", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const mappedRep = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const origin = file.createEntity("IfcAxis2Placement3D");
		const repmap = withAttrs(file, "IfcRepresentationMap", { MappedRepresentation: mappedRep, MappingOrigin: origin });
		const elementType = withAttrs(file, "IfcWallType", { RepresentationMaps: [repmap] });
		const transformOp = file.createEntity("IfcCartesianTransformationOperator3D");
		const mappedItem = withAttrs(file, "IfcMappedItem", { MappingSource: repmap, MappingTarget: transformOp });
		const occurrenceRep = withAttrs(file, "IfcShapeRepresentation", {
			RepresentationType: "MappedRepresentation",
			Items: [mappedItem],
		});
		const element = withAttrs(file, "IfcWall", {
			Representation: withAttrs(file, "IfcProductDefinitionShape", { Representations: [occurrenceRep] }),
		});
		expect(file.byType("IfcShapeRepresentation").length).toBe(2);

		removeProduct(file, { product: element });

		expect(file.byType("IfcProductDefinitionShape").length).toBe(0);
		expect(file.byType("IfcShapeRepresentation").length).toBe(1);
		expect(file.byType("IfcMappedItem").length).toBe(0);
		expect(file.byType("IfcCartesianTransformationOperator3D").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(0);
		expect((elementType.get("RepresentationMaps") as EntityInstance[] | null) ?? []).toHaveLength(1);
	});

	test("removing an element type by itself", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");

		removeProduct(file, { product: element });

		expect(file.byType("IfcWallType").length).toBe(0);
	});

	// Real Python: `test_removing_axes_of_a_grid`. Ported for real now that
	// `api.grid.removeGridAxis` exists (this used to be one of this file's disclosed-
	// blocker tests -- see this file's own header comment). `blankFile` (not
	// `createTestFile`) matches this test's own `len(list(self.file)) == 0` assertion --
	// with the default project bootstrap still present, removing the grid and its axes
	// alone would never bring the file down to zero entities.
	test("removing axes of a grid", () => {
		const file = blankFile(schema);
		const grid = file.createEntity("IfcGrid");
		const axisA = createGridAxis(file, { axisTag: "A", uvwAxes: "UAxes", grid });
		axisA.set("AxisCurve", file.createEntity("IfcPolyline", [file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])]));
		const axis1 = createGridAxis(file, { axisTag: "1", uvwAxes: "VAxes", grid });
		axis1.set("AxisCurve", file.createEntity("IfcPolyline", [file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])]));

		removeProduct(file, { product: grid });

		expect([...file]).toHaveLength(0);
	});

	test("removing all void relationships of an opening", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: element, RelatedOpeningElement: opening });

		removeProduct(file, { product: opening });

		expect(file.byType("IfcOpeningElement").length).toBe(0);
		expect(file.byType("IfcRelVoidsElement").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(1);
	});

	test("removing all fill relationships of a filling", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		const filling = file.createEntity("IfcDoor");
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: element, RelatedOpeningElement: opening });
		withAttrs(file, "IfcRelFillsElement", { RelatingOpeningElement: opening, RelatedBuildingElement: filling });

		removeProduct(file, { product: filling });

		expect(file.byType("IfcDoor").length).toBe(0);
		expect(file.byType("IfcRelFillsElement").length).toBe(0);
		expect(file.byType("IfcOpeningElement").length).toBe(1);
		expect(file.byType("IfcRelVoidsElement").length).toBe(1);
	});

	test("removing all distribution ports (self-recursion into IfcDistributionPort)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcFlowSegment");
		const port = file.createEntity("IfcDistributionPort");
		withAttrs(file, "IfcRelNests", { RelatingObject: element, RelatedObjects: [port] });

		removeProduct(file, { product: element });

		expect(file.byType("IfcFlowSegment").length).toBe(0);
		expect(file.byType("IfcRelNests").length).toBe(0);
		expect(file.byType("IfcDistributionPort").length).toBe(0);
	});

	test("removing all nesting relationships of a whole (non-port subelement, no recursion)", () => {
		const file = createTestFile(schema);
		const subelement = file.createEntity("IfcBeam");
		const element = file.createEntity("IfcWall");
		withAttrs(file, "IfcRelNests", { RelatingObject: element, RelatedObjects: [subelement] });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelNests").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(0);
		expect(file.byType("IfcBeam").length).toBe(1);
	});

	test("removing all nesting relationships of a part", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcBeam");
		withAttrs(file, "IfcRelNests", { RelatingObject: element, RelatedObjects: [subelement] });

		removeProduct(file, { product: subelement });

		expect(file.byType("IfcRelNests").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(1);
		expect(file.byType("IfcBeam").length).toBe(0);
	});

	test("removing all aggregate relationships of a whole", () => {
		const file = createTestFile(schema);
		const subelement = file.createEntity("IfcBeam");
		const element = file.createEntity("IfcElementAssembly");
		assignObject(file, { products: [subelement], relatingObject: element });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelAggregates").length).toBe(0);
		expect(file.byType("IfcElementAssembly").length).toBe(0);
		expect(file.byType("IfcBeam").length).toBe(1);
	});

	test("removing all aggregate relationships of a part", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcBeam");
		assignObject(file, { products: [subelement], relatingObject: element });

		removeProduct(file, { product: subelement });

		expect(file.byType("IfcRelAggregates").length).toBe(0);
		expect(file.byType("IfcElementAssembly").length).toBe(1);
		expect(file.byType("IfcBeam").length).toBe(0);
	});

	test("removing all containment relationships of a container", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSpace");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelContainedInSpatialStructure").length).toBe(0);
		expect(file.byType("IfcSpace").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(1);
	});

	test("removing all containment relationships of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSpace");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		removeProduct(file, { product: subelement });

		expect(file.byType("IfcRelContainedInSpatialStructure").length).toBe(0);
		expect(file.byType("IfcSpace").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(0);
	});

	test("removing path connection relationships of an element", () => {
		const file = createTestFile(schema);
		const element2 = file.createEntity("IfcColumn");
		const element1 = file.createEntity("IfcBeam");
		withAttrs(file, "IfcRelConnectsPathElements", {
			RelatingElement: element1,
			RelatedElement: element2,
			RelatingPriorities: [],
			RelatedPriorities: [],
			RelatedConnectionType: "NOTDEFINED",
			RelatingConnectionType: "NOTDEFINED",
		});

		removeProduct(file, { product: element1 });

		expect(file.byType("IfcRelConnectsPathElements").length).toBe(0);
		expect(file.byType("IfcColumn").length).toBe(1);
		expect(file.byType("IfcBeam").length).toBe(0);
	});

	test("removing connection relationships of an element", () => {
		const file = createTestFile(schema);
		const element2 = file.createEntity("IfcSlab");
		const element1 = file.createEntity("IfcWall");
		withAttrs(file, "IfcRelConnectsElements", { RelatingElement: element2, RelatedElement: element1 });

		removeProduct(file, { product: element1 });

		expect(file.byType("IfcRelConnectsElements").length).toBe(0);
		expect(file.byType("IfcSlab").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(0);
	});

	test("removing connection relationships of an element with additional realizing element", () => {
		const file = createTestFile(schema);
		const slab1 = file.createEntity("IfcSlab");
		const slab2 = file.createEntity("IfcSlab");
		const wall = file.createEntity("IfcWall");
		withAttrs(file, "IfcRelConnectsWithRealizingElements", {
			RelatingElement: wall,
			RelatedElement: slab1,
			RealizingElements: [wall, slab1, slab2],
		});

		removeProduct(file, { product: wall });

		expect(file.byType("IfcRelConnectsElements").length).toBe(0);
		expect(file.byType("IfcSlab").length).toBe(2);
		expect(file.byType("IfcWall").length).toBe(0);
	});

	test("removing connection relationships of an element -- element is a (non-sole) realizing element", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const slab1 = file.createEntity("IfcSlab");
		const slab2 = file.createEntity("IfcSlab");
		withAttrs(file, "IfcRelConnectsWithRealizingElements", {
			RelatingElement: wall,
			RelatedElement: slab1,
			RealizingElements: [wall, slab1, slab2],
		});

		removeProduct(file, { product: slab2 });

		expect(file.byType("IfcRelConnectsElements").length).toBe(1);
		expect(file.byType("IfcSlab").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(1);
	});

	test("removing connection relationships of an element -- element is the only realizing element", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const slab1 = file.createEntity("IfcSlab");
		const slab2 = file.createEntity("IfcSlab");
		withAttrs(file, "IfcRelConnectsWithRealizingElements", {
			RelatingElement: wall,
			RelatedElement: slab1,
			RealizingElements: [slab2],
		});

		removeProduct(file, { product: slab2 });

		expect(file.byType("IfcRelConnectsElements").length).toBe(0);
		expect(file.byType("IfcSlab").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(1);
	});

	test("removing ports connection relationship", () => {
		const file = createTestFile(schema);
		const port1 = file.createEntity("IfcDistributionPort");
		const element1 = file.createEntity("IfcFlowSegment");
		withAttrs(file, "IfcRelConnectsPortToElement", { RelatingPort: port1, RelatedElement: element1 });

		const port2 = file.createEntity("IfcDistributionPort");
		const element2 = file.createEntity("IfcFlowSegment");
		withAttrs(file, "IfcRelConnectsPortToElement", { RelatingPort: port2, RelatedElement: element2 });

		const connection = withAttrs(file, "IfcRelConnectsPorts", { RelatingPort: port1, RelatedPort: port2 });

		// Making sure removing the realizing element won't remove the entire connection,
		// since it's optional.
		const element3 = file.createEntity("IfcFlowSegment");
		connection.set("RealizingElement", element3);
		removeProduct(file, { product: element3 });
		expect(file.byType("IfcRelConnectsPorts").length).toBe(1);

		removeProduct(file, { product: element1 });

		expect(file.byType("IfcRelConnectsPorts").length).toBe(0);
		expect(file.byType("IfcFlowSegment").length).toBe(1);
		expect(file.byType("IfcDistributionPort").length).toBe(1);
	});

	test("removing all property relationships of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, { product: element, name: "Foo_Bar" });
		addRawProperty(file, pset);

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
		expect(file.byType("IfcPropertySet").length).toBe(0);
		expect(file.byType("IfcPropertySingleValue").length).toBe(0);
	});

	// Real Python: `test_removing_all_material_relationships_of_an_element`. Ported for
	// real now that `api.material.unassignMaterial` exists (this used to be one of this
	// file's 4 disclosed-blocker tests -- see this file's own header comment).
	// `add_material` itself isn't ported (a future `api.material` chunk), so the
	// fixture builds the material directly, matching this file's own established
	// `withAttrs`-substitution precedent for other unported fixture dependencies.
	test("removing all material relationships of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "Foo" });
		assignMaterial(file, { products: [element], material });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("removing all type relationships of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, { relatedObjects: [element], relatingType: elementType });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelDefinesByType").length).toBe(0);
		expect(file.byType("IfcWallType").length).toBe(1);
	});

	test("removing all type relationships of an element type", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, { relatedObjects: [element1], relatingType: elementType });
		assignType(file, { relatedObjects: [element2], relatingType: elementType });

		removeProduct(file, { product: elementType });

		expect(file.byType("IfcRelDefinesByType").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(2);
	});

	// Real Python: `test_removing_all_space_boundaries_of_an_element`. Ported for real
	// now that `api.boundary.removeBoundary` exists (this used to be one of this file's
	// disclosed-blocker tests -- see this file's own header comment).
	test("removing all space boundaries of an element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		withAttrs(file, "IfcRelSpaceBoundary", { RelatedBuildingElement: element });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelSpaceBoundary").length).toBe(0);
	});

	test("removing orphaned group relationships", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element], group });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
	});

	test("removing product assignments", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const annotation = file.createEntity("IfcAnnotation");
		withAttrs(file, "IfcRelAssignsToProduct", { RelatingProduct: element, RelatedObjects: [annotation] });

		removeProduct(file, { product: element });

		expect(file.byType("IfcRelAssignsToProduct").length).toBe(0);
	});

	test("removing flow control elements", () => {
		const file = createTestFile(schema);
		const flowElement = file.createEntity("IfcFlowSegment");
		const flowControl = file.createEntity("IfcDistributionControlElement");
		const flowControl1 = file.createEntity("IfcDistributionControlElement");
		withAttrs(file, "IfcRelFlowControlElements", {
			RelatingFlowElement: flowElement,
			RelatedControlElements: [flowControl, flowControl1],
		});

		removeProduct(file, { product: flowControl });
		expect(file.byType("IfcRelFlowControlElements").length).toBe(1);

		removeProduct(file, { product: flowControl1 });
		expect(file.byType("IfcRelFlowControlElements").length).toBe(0);
	});

	test("removing a flow element with flow controls", () => {
		const file = createTestFile(schema);
		const flowElement = file.createEntity("IfcFlowSegment");
		const flowControl = file.createEntity("IfcDistributionControlElement");
		const flowControl1 = file.createEntity("IfcDistributionControlElement");
		withAttrs(file, "IfcRelFlowControlElements", {
			RelatingFlowElement: flowElement,
			RelatedControlElements: [flowControl, flowControl1],
		});

		removeProduct(file, { product: flowElement });

		expect(file.byType("IfcRelFlowControlElements").length).toBe(0);
	});
});

// --- Disclosed blocker: a real, load-bearing dependency on `api.feature`, which has no
// TS port at all. See `../../../src/api/root/removeProduct.ts`'s own header comment and
// `TODOS.md`. (`api.material`/`api.grid`/`api.boundary` are no longer among these --
// `unassignMaterial`/`removeGridAxis`/`removeBoundary` all now exist, see the real
// "removing all material relationships of an element"/"removing axes of a grid"/
// "removing all space boundaries of an element" tests above, and `TODOS.md`'s updated
// entries.) ---

describe.each(AVAILABLE_SCHEMAS)("api.root.removeProduct -- disclosed blockers (%s)", (schema) => {
	test("removing an element with openings throws (api.feature.removeFeature not ported)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: element, RelatedOpeningElement: opening });

		expect(() => removeProduct(file, { product: element })).toThrow(/api\.feature\.removeFeature/);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.root.removeProduct Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed element; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		element.set("Name", "Wall 1");
		const id = element.id();

		file.beginTransaction();
		removeProduct(file, { product: element });
		file.endTransaction();

		expect(() => file.byId(id)).toThrow();

		file.undo();
		expect(file.byId(id).get("Name")).toBe("Wall 1");

		file.redo();
		expect(() => file.byId(id)).toThrow();
	});

	test("undo restores cascaded representation/placement/pset/type cleanup", () => {
		// Not `blankFile` -- `addPset` below needs `owner.createOwnerHistory`, which on
		// IFC2X3 requires an existing `IfcPerson`/`IfcOrganization`/`IfcApplication`
		// chain (mandatory owner tracking there, see `owner/settings.ts`'s own doc
		// comment); `blankFile`'s `stripProjectBootstrap` removes that whole chain along
		// with the project (its only reference). This test asserts on specific entity
		// ids, not `byType` totals, so the template's own pre-populated entities don't
		// interfere either way.
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const productDef = withAttrs(file, "IfcProductDefinitionShape", { Representations: [representation] });
		const placement = withAttrs(file, "IfcLocalPlacement", {
			RelativePlacement: file.createEntity("IfcAxis2Placement3D"),
		});
		const element = withAttrs(file, "IfcWall", { Representation: productDef, ObjectPlacement: placement });
		const pset = addPset(file, { product: element, name: "Foo_Bar" });
		addRawProperty(file, pset);
		const elementType = file.createEntity("IfcWallType");
		assignType(file, { relatedObjects: [element], relatingType: elementType });

		const elementId = element.id();
		const productDefId = productDef.id();
		const representationId = representation.id();
		const placementId = placement.id();
		const psetId = pset.id();
		const relDefinesByTypeId = (file.byType("IfcRelDefinesByType")[0] as EntityInstance).id();

		file.beginTransaction();
		removeProduct(file, { product: element });
		file.endTransaction();

		expect(() => file.byId(elementId)).toThrow();
		expect(() => file.byId(productDefId)).toThrow();
		expect(() => file.byId(representationId)).toThrow();
		expect(() => file.byId(placementId)).toThrow();
		expect(() => file.byId(psetId)).toThrow();
		expect(() => file.byId(relDefinesByTypeId)).toThrow();
		expect(file.byType("IfcWallType").length).toBe(1);

		file.undo();
		expect(file.byId(elementId).isA("IfcWall")).toBe(true);
		expect(file.byId(productDefId).isA("IfcProductDefinitionShape")).toBe(true);
		expect(file.byId(representationId).isA("IfcShapeRepresentation")).toBe(true);
		expect(file.byId(placementId).isA("IfcLocalPlacement")).toBe(true);
		expect(file.byId(psetId).isA("IfcPropertySet")).toBe(true);
		expect(file.byId(relDefinesByTypeId).isA("IfcRelDefinesByType")).toBe(true);

		file.redo();
		expect(() => file.byId(elementId)).toThrow();
		expect(() => file.byId(productDefId)).toThrow();
		expect(() => file.byId(representationId)).toThrow();
		expect(() => file.byId(placementId)).toThrow();
		expect(() => file.byId(psetId)).toThrow();
		expect(() => file.byId(relDefinesByTypeId)).toThrow();
	});
});
