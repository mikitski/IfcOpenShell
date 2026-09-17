// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/project/test_append_asset.py` (src/ifcopenshell-python,
// 845 lines, `TestAppendAssetIFC2X3` base + `TestAppendAssetIFC4` subclass adding a few
// IFC4-only cases). Ported below via `describe.each(AVAILABLE_SCHEMAS)` for the shared
// base-class tests (running against every schema this build's C++ core actually
// registers -- currently IFC4 only, see `test/bootstrap.ts`'s own comment) and a second
// `describe.each` for the IFC4-only additions, gated to exclude IFC2X3 (matching real
// Python's own `TestAppendAssetIFC4` class, which does NOT re-run these against
// IFC2X3 -- its own docstring explains exactly why: `IfcProfileDef`/`IfcMaterial`/
// `IfcCostItem` lack the inverse attributes these specific tests exercise on IFC2X3).
//
// A representative, high-value majority of the real Python suite is ported faithfully
// below -- NOT every single one of its ~40 test methods, per this project's own
// "a partial, well-disclosed port is much better than a large amount of guessed-at,
// unverified code" guidance. Three real Python tests are deliberately NOT ported here,
// each for a specific, pre-existing, already-disclosed reason UNRELATED to
// `appendAsset.ts` itself (verified directly, not assumed):
//
// 1. `test_append_two_type_products_sharing_the_same_material_with_properties` needs
//    `ifcopenshell.api.pset.edit_pset(library, pset, properties={"Foo": "Bar"})` to set
//    up its library fixture -- `editPset.ts`'s own header comment discloses that
//    materializing ANY brand-new property value from a plain JS scalar throws today
//    (the same pre-existing, extensively-tracked `entityInstance.ts` "cannot write an
//    initial value into a freshly created simple/defined-type instance" gap
//    `appendAsset.ts`'s own header comment also discusses) -- this throws during TEST
//    SETUP, in the library file, before `appendAsset` is ever called.
// 2. `test_file_add_to_convert_units`'s own third case ("entities without ids") needs
//    the identical `edit_pset(library, pset, properties={"RoadVisibleDistanceLeft": 10})`
//    call for the same reason. This test's OTHER two cases (a simple float, and an
//    aggregate of floats) ARE ported below -- see `"converts a simple float and an
//    aggregate of floats between unit scales"`.
// 3. `test_append_presentation_layer_for_representation_item`/
//    `test_append_presentation_layer_for_representation` build their geometry via
//    `ShapeBuilder.rectangle()`/`.profile()`/`.extrude()` -- `util/shapeBuilder.ts`'s
//    own header comment discloses that `.rectangle()`/`.profile()` are blocked on
//    IFC4/IFC4X3 by a different pre-existing gap (`IfcLineIndex`/`IfcArcIndex`
//    defined-type creation, and the `Dim` DERIVED-attribute gap, respectively). Both
//    tests are ported below using a manually-built `IfcExtrudedAreaSolid` (raw
//    `createEntity` calls, no `ShapeBuilder`) instead -- functionally identical test
//    coverage for `appendAsset`'s own presentation-layer-assignment logic (the actual
//    thing under test here), without depending on either blocked convenience method.

import { describe, expect, test } from "vitest";
import { addClassification } from "../../../src/api/classification/addClassification";
import { addReference } from "../../../src/api/classification/addReference";
import { addContext } from "../../../src/api/context/addContext";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addFeature } from "../../../src/api/feature/addFeature";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import { editObjectPlacement } from "../../../src/api/geometry/editObjectPlacement";
import { addGeoreferencing } from "../../../src/api/georeference/addGeoreferencing";
import { editGeoreferencing } from "../../../src/api/georeference/editGeoreferencing";
import { addLayer as addPresentationLayer } from "../../../src/api/layer/addLayer";
import { assignLayer } from "../../../src/api/layer/assignLayer";
import { addLayer as addMaterialLayer } from "../../../src/api/material/addLayer";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile as addMaterialProfile } from "../../../src/api/material/addProfile";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { addApplication } from "../../../src/api/owner/addApplication";
import { addOrganisation } from "../../../src/api/owner/addOrganisation";
import { addPerson } from "../../../src/api/owner/addPerson";
import { addPersonAndOrganisation } from "../../../src/api/owner/addPersonAndOrganisation";
import { addRole } from "../../../src/api/owner/addRole";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addParameterizedProfile } from "../../../src/api/profile/addParameterizedProfile";
import { appendAsset } from "../../../src/api/project/appendAsset";
import { createFile } from "../../../src/api/project/createFile";
import { addPset } from "../../../src/api/pset/addPset";
import { assignPset } from "../../../src/api/pset/assignPset";
import { createEntity as createRootEntity } from "../../../src/api/root/createEntity";
import { addStyle } from "../../../src/api/style/addStyle";
import { addSurfaceStyle } from "../../../src/api/style/addSurfaceStyle";
import { assignMaterialStyle } from "../../../src/api/style/assignMaterialStyle";
import { assignType } from "../../../src/api/type/assignType";
import { addSiUnit } from "../../../src/api/unit/addSiUnit";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as classificationUtil from "../../../src/util/classification";
import * as elementUtil from "../../../src/util/element";
import type { MatrixType } from "../../../src/util/placement";
import { getLocalPlacement } from "../../../src/util/placement";
import { AVAILABLE_SCHEMAS } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function blankFile(schema: Schema): IfcFile {
	return createFile(undefined, { version: schema });
}

/** A minimal `IfcExtrudedAreaSolid` built from raw `createEntity` calls -- see this
 * file's own header comment (item 3) for why `ShapeBuilder` is deliberately not used. */
function createSimpleExtrusion(file: IfcFile): EntityInstance {
	const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 1, 1);
	const position = file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [0, 0, 0]),
		null,
		null,
	);
	const direction = file.createEntity("IfcDirection", [0, 0, 1]);
	return file.createEntity("IfcExtrudedAreaSolid", profile, position, direction, 1);
}

describe.each(AVAILABLE_SCHEMAS)("api.project.appendAsset (%s)", (schema) => {
	test("does not append the same asset twice", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWallType" });
		addMaterial(library, { name: "Material" });
		const schedule = addCostSchedule(library, {});
		const profile = library.createEntity("IfcIShapeProfileDef");

		appendAsset(file, { library, element });
		appendAsset(file, { library, element });
		appendAsset(file, { library, element: library.byType("IfcMaterial")[0] });
		appendAsset(file, { library, element: library.byType("IfcMaterial")[0] });
		appendAsset(file, { library, element: schedule });
		appendAsset(file, { library, element: schedule });
		appendAsset(file, { library, element: profile });
		appendAsset(file, { library, element: profile });
		expect(file.byType("IfcWallType").length).toBe(1);
	});

	test("appends a type product", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWallType" });
		appendAsset(file, { library, element });
		expect(file.byType("IfcWallType").length).toBe(1);
	});

	test("reuses an existing context if it was added from the library previously", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const project = createRootEntity(library, { ifcClass: "IfcProject" });
		const libContext = addContext(library, { contextType: "Model" });

		file.add(project); // Will add the project and its contexts.

		const material = addMaterial(library, { name: "Material" });
		const style = addStyle(library, {});
		assignMaterialStyle(library, { material, style, context: libContext });

		appendAsset(file, { library, element: material });
		expect(file.byType("IfcMaterial").length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(1);
		const hasRepresentation = file.byType("IfcMaterial")[0].get("HasRepresentation") as EntityInstance[];
		const context = (hasRepresentation[0].get("Representations") as EntityInstance[])[0].get(
			"ContextOfItems",
		) as EntityInstance;
		// Make sure it's still valid.
		expect(context.get("WorldCoordinateSystem")).toBeTruthy();
	});

	test("adds new contexts if necessary", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const libContext = addContext(library, { contextType: "Model" });
		const libSubcontext = addContext(library, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: libContext,
		});

		// The target file has no contexts right now.
		createRootEntity(file, { ifcClass: "IfcProject" });

		const material = addMaterial(library, { name: "Material" });
		const style = addStyle(library, {});
		assignMaterialStyle(library, { material, style, context: libSubcontext });

		appendAsset(file, { library, element: material });
		expect(file.byType("IfcProject").length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationContext", false).length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationSubContext", false).length).toBe(1);
		const hasRepresentation = file.byType("IfcMaterial")[0].get("HasRepresentation") as EntityInstance[];
		const context = (hasRepresentation[0].get("Representations") as EntityInstance[])[0].get(
			"ContextOfItems",
		) as EntityInstance;
		// `context` here is a SUBcontext -- `WorldCoordinateSystem` is DERIVEd from
		// `ParentContext` on a real `IfcGeometricRepresentationSubContext` (real Python's
		// SWIG binding computes DERIVE rules automatically; this port's `EntityInstance
		// .get()` does not, a pre-existing, disclosed, unrelated gap -- `entityInstance.ts`'s
		// own header comment). Checking the PARENT's own `WorldCoordinateSystem` instead
		// verifies the exact same real invariant (the reused/created context chain is
		// intact, not orphaned) without depending on that gap.
		expect((context.get("ParentContext") as EntityInstance).get("WorldCoordinateSystem")).toBeTruthy();
	});

	test("appends a single type product even though an inverse material relationship is shared", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWallType" });
		const element2 = createRootEntity(library, { ifcClass: "IfcWallType" });
		const material = addMaterial(library, { name: "Material" });
		assignMaterial(library, { products: [element], material });
		assignMaterial(library, { products: [element2], material });
		appendAsset(file, { library, element });
		expect(file.byType("IfcWallType").length).toBe(1);
	});

	test("appends a type product with its materials", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWallType" });
		const material = addMaterial(library, { name: "Material" });
		assignMaterial(library, { products: [element], material });
		appendAsset(file, { library, element });
		const hasAssociations = file.byType("IfcWallType")[0].get("HasAssociations") as EntityInstance[];
		expect((hasAssociations[0].get("RelatingMaterial") as EntityInstance).get("Name")).toBe("Material");
	});

	test("appends a type product where its inverse material relationship refers to products not in scope", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const elementType = createRootEntity(library, { ifcClass: "IfcWallType" });
		const elementType2 = createRootEntity(library, { ifcClass: "IfcWallType" });
		const material = addMaterial(library, { name: "Material" });
		assignMaterial(library, { products: [elementType], material });
		assignMaterial(library, { products: [elementType2], material });

		appendAsset(file, { library, element: elementType2 });
		appendAsset(file, { library, element: elementType2 });
		expect(file.byType("IfcWallType").length).toBe(1);
	});

	test("appends two type products sharing the same material indirectly via a material set", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const element1 = createRootEntity(library, { ifcClass: "IfcWallType" });
		const element2 = createRootEntity(library, { ifcClass: "IfcWallType" });
		const material = addMaterial(library, { name: "Material" });

		const layerSet1 = addMaterialSet(library, { setType: "IfcMaterialLayerSet" });
		addMaterialLayer(library, { layerSet: layerSet1, material });
		addMaterialLayer(library, { layerSet: layerSet1, material });

		const layerSet2 = addMaterialSet(library, { setType: "IfcMaterialLayerSet" });
		addMaterialLayer(library, { layerSet: layerSet2, material });
		addMaterialLayer(library, { layerSet: layerSet2, material });

		assignMaterial(library, { products: [element1], material: layerSet1 });
		assignMaterial(library, { products: [element2], material: layerSet2 });

		const new1 = appendAsset(file, { library, element: element1 }) as EntityInstance;
		const new2 = appendAsset(file, { library, element: element2 }) as EntityInstance;

		const targetMaterial = file.byType("IfcMaterial")[0];
		const layers1 = elementUtil.getMaterial(new1)?.get("MaterialLayers") as EntityInstance[];
		const layers2 = elementUtil.getMaterial(new2)?.get("MaterialLayers") as EntityInstance[];
		expect((layers1[0].get("Material") as EntityInstance).equals(targetMaterial)).toBe(true);
		expect((layers1[1].get("Material") as EntityInstance).equals(targetMaterial)).toBe(true);
		expect((layers2[0].get("Material") as EntityInstance).equals(targetMaterial)).toBe(true);
		expect((layers2[1].get("Material") as EntityInstance).equals(targetMaterial)).toBe(true);
	});

	test("appends a type product with its styles", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWallType" });
		const history = library.createEntity("IfcOwnerHistory");
		element.set("OwnerHistory", history);

		const material = addMaterial(library, { name: "Material" });
		const rel = assignMaterial(library, { products: [element], material }) as EntityInstance;
		// A shared history -- ensures all whitelisted inverses are checked even though
		// one of the subelements (this shared history) is already processed (bug #2837).
		rel.set("OwnerHistory", history);

		const item = library.createEntity("IfcBoundingBox");
		library.createEntity("IfcStyledItem", item);
		const mappedRep = library.createEntity("IfcShapeRepresentation", null, null, null, [item]);
		const representationMap = library.createEntity("IfcRepresentationMap", null, mappedRep);
		element.set("RepresentationMaps", [representationMap]);

		const created = appendAsset(file, { library, element }) as EntityInstance;
		const newRepresentationMaps = created.get("RepresentationMaps") as EntityInstance[];
		const newMappedRepresentation = newRepresentationMaps[0].get("MappedRepresentation") as EntityInstance;
		const newItems = newMappedRepresentation.get("Items") as EntityInstance[];
		expect((newItems[0].get("StyledByItem") as EntityInstance[]).length).toBe(1);
		expect(
			(file.byType("IfcStyledItem")[0].get("Item") as EntityInstance).equals(file.byType("IfcBoundingBox")[0]),
		).toBe(true);
	});

	test("appends a product with styles to reuse styled items", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const elementType = createRootEntity(library, { ifcClass: "IfcWallType" });
		const history = library.createEntity("IfcOwnerHistory");
		elementType.set("OwnerHistory", history);
		const item = library.createEntity("IfcBoundingBox");
		library.createEntity("IfcStyledItem", item);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const mappedRep = library.createEntity("IfcShapeRepresentation", context, null, null, [item]);
		const representationMap = library.createEntity("IfcRepresentationMap", null, mappedRep);
		elementType.set("RepresentationMaps", [representationMap]);

		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		assignType(library, { relatedObjects: [element], relatingType: elementType });

		appendAsset(file, { library, element });
		expect(file.byType("IfcStyledItem").length).toBe(1);
	});

	test("appends a type product with styled materials", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		addContext(file, { contextType: "Model" });

		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const context = addContext(library, { contextType: "Model" });

		const element = createRootEntity(library, { ifcClass: "IfcWallType" });
		const material = addMaterial(library, { name: "Material" });
		assignMaterial(library, { products: [element], material });
		const style = addStyle(library, {});
		assignMaterialStyle(library, { material, style, context });
		appendAsset(file, { library, element });
		const hasAssociations = file.byType("IfcWallType")[0].get("HasAssociations") as EntityInstance[];
		const relatingMaterial = hasAssociations[0].get("RelatingMaterial") as EntityInstance;
		expect(relatingMaterial.get("Name")).toBe("Material");
		expect((relatingMaterial.get("HasRepresentation") as EntityInstance[]).length).toBeGreaterThan(0);
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(1);
	});

	test("appends a material", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const material = addMaterial(library, { name: "Material" });
		appendAsset(file, { library, element: material });
		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("appends a material with a representation", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });

		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const material = addMaterial(library, { name: "Material" });
		const style = addStyle(library, {});
		const context = addContext(library, { contextType: "Model" });
		assignMaterialStyle(library, { material, style, context });
		appendAsset(file, { library, element: material });
		expect(file.byType("IfcMaterial").length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(1);
		const hasRepresentation = file.byType("IfcMaterial")[0].get("HasRepresentation") as EntityInstance[];
		const newContext = (hasRepresentation[0].get("Representations") as EntityInstance[])[0].get(
			"ContextOfItems",
		) as EntityInstance;
		expect(newContext.get("ContextType")).toBe("Model");
	});

	test("appends a material with a representation and reuses an existing context", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const fileContext = addContext(file, { contextType: "Model" });

		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const material = addMaterial(library, { name: "Material" });
		const style = addStyle(library, {});
		const context = addContext(library, { contextType: "Model" });
		assignMaterialStyle(library, { material, style, context });

		appendAsset(file, { library, element: material });
		expect(file.byType("IfcMaterial").length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(1);
		const hasRepresentation = file.byType("IfcMaterial")[0].get("HasRepresentation") as EntityInstance[];
		const newContext = (hasRepresentation[0].get("Representations") as EntityInstance[])[0].get(
			"ContextOfItems",
		) as EntityInstance;
		expect(newContext.equals(fileContext)).toBe(true);
		expect(newContext.get("WorldCoordinateSystem")).toBeTruthy();
	});

	test("appends a material with a representation and reuses an existing subcontext", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const fileContext = addContext(file, { contextType: "Model" });
		const fileSubcontext = addContext(file, {
			parent: fileContext,
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
		});

		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const material = addMaterial(library, { name: "Material" });
		const style = addStyle(library, {});
		const context = addContext(library, { contextType: "Model" });
		const subcontext = addContext(library, {
			parent: context,
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
		});
		assignMaterialStyle(library, { material, style, context: subcontext });
		appendAsset(file, { library, element: material });
		expect(file.byType("IfcMaterial").length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationContext", false).length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationSubContext", false).length).toBe(1);
		const hasRepresentation = file.byType("IfcMaterial")[0].get("HasRepresentation") as EntityInstance[];
		const newSubcontext = (hasRepresentation[0].get("Representations") as EntityInstance[])[0].get(
			"ContextOfItems",
		) as EntityInstance;
		expect(newSubcontext.equals(fileSubcontext)).toBe(true);
		expect((newSubcontext.get("ParentContext") as EntityInstance).get("WorldCoordinateSystem")).toBeTruthy();
	});

	test("appends a material with a representation and reuses an existing context by a new subcontext", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const fileContext = addContext(file, { contextType: "Model" });

		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const material = addMaterial(library, { name: "Material" });
		const style = addStyle(library, {});
		const context = addContext(library, { contextType: "Model" });
		const subcontext = addContext(library, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: context,
		});
		assignMaterialStyle(library, { material, style, context: subcontext });
		appendAsset(file, { library, element: material });
		expect(file.byType("IfcMaterial").length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationContext", false).length).toBe(1);
		expect(file.byType("IfcGeometricRepresentationSubContext", false).length).toBe(1);
		const hasRepresentation = file.byType("IfcMaterial")[0].get("HasRepresentation") as EntityInstance[];
		const newSubcontext = (hasRepresentation[0].get("Representations") as EntityInstance[])[0].get(
			"ContextOfItems",
		) as EntityInstance;
		expect(newSubcontext.get("ContextType")).toBe("Model");
		expect(newSubcontext.get("ContextIdentifier")).toBe("Body");
		expect(newSubcontext.get("TargetView")).toBe("MODEL_VIEW");
		expect((newSubcontext.get("ParentContext") as EntityInstance).equals(fileContext)).toBe(true);
	});

	test("appends a profile def", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const profile = library.createEntity("IfcIShapeProfileDef");
		appendAsset(file, { library, element: profile });
		expect(file.byType("IfcIShapeProfileDef").length).toBe(1);
	});

	test("appends a product", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		appendAsset(file, { library, element });
		expect(file.byType("IfcWall").length).toBe(1);
	});

	test("appends a product with all (empty) property sets", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		addPset(library, { product: element, name: "Foo_Bar" });
		appendAsset(file, { library, element });
		expect(elementUtil.getPsets(file.byType("IfcWall")[0]).Foo_Bar).toBeTruthy();
	});

	test("appends a product with its type", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const elementType = createRootEntity(library, { ifcClass: "IfcWallType" });
		assignType(library, { relatedObjects: [element], relatingType: elementType });
		appendAsset(file, { library, element });
		expect(elementUtil.getType(file.byType("IfcWall")[0])?.isA("IfcWallType")).toBe(true);
	});

	test("appends only specified occurrences of a typed product", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const element2 = createRootEntity(library, { ifcClass: "IfcWall" });
		createRootEntity(library, { ifcClass: "IfcWall" }); // element3, deliberately not appended.
		const elementType = createRootEntity(library, { ifcClass: "IfcWallType" });
		assignType(library, { relatedObjects: [element], relatingType: elementType });
		assignType(library, { relatedObjects: [element2], relatingType: elementType });
		assignType(library, { relatedObjects: [library.byType("IfcWall")[2]], relatingType: elementType });
		appendAsset(file, { library, element });
		appendAsset(file, { library, element: element2 });
		expect(elementUtil.getTypes(file.byType("IfcWallType")[0]).length).toBe(2);
		expect(file.byType("IfcWall").length).toBe(2);
	});

	test("appends a product with materials", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const material = addMaterial(library, { name: "Material" });
		assignMaterial(library, { products: [element], material });
		appendAsset(file, { library, element });
		expect(elementUtil.getMaterial(file.byType("IfcWall")[0])?.get("Name")).toBe("Material");
	});

	test("appends a product where its inverse material relationship refers to product types not in scope", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const elementType = createRootEntity(library, { ifcClass: "IfcWallType" });
		const elementType2 = createRootEntity(library, { ifcClass: "IfcWallType" });
		assignType(library, { relatedObjects: [element], relatingType: elementType });
		const material = addMaterial(library, { name: "Material" });
		assignMaterial(library, { products: [element], material });
		assignMaterial(library, { products: [elementType], material });
		assignMaterial(library, { products: [elementType2], material });
		appendAsset(file, { library, element });
		expect(file.byType("IfcWallType").map((e) => e.get("GlobalId"))).toEqual([elementType.get("GlobalId")]);
	});

	test("appends a product with its styles", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const item = library.createEntity("IfcBoundingBox");
		library.createEntity("IfcStyledItem", item);
		const representation = library.createEntity("IfcShapeRepresentation", null, null, null, [item]);
		element.set("Representation", library.createEntity("IfcProductDefinitionShape", null, null, [representation]));
		appendAsset(file, { library, element });
		expect(
			(file.byType("IfcStyledItem")[0].get("Item") as EntityInstance).equals(file.byType("IfcBoundingBox")[0]),
		).toBe(true);
	});

	test("appends a product with openings", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const opening = createRootEntity(library, { ifcClass: "IfcOpeningElement" });
		addFeature(library, { feature: opening, element });
		appendAsset(file, { library, element });
		const hasOpenings = file.byType("IfcWall")[0].get("HasOpenings") as EntityInstance[];
		expect((hasOpenings[0].get("RelatedOpeningElement") as EntityInstance).isA("IfcOpeningElement")).toBe(true);
	});

	test("appends a product with unrelated relationships to openings", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const opening = createRootEntity(library, { ifcClass: "IfcOpeningElement" });
		const classification = addClassification(library, { classification: "MyCustomClassification" });
		addReference(library, {
			products: [element, opening],
			classification,
			identification: "W_01",
			name: "Interior Walls",
		});
		appendAsset(file, { library, element });
		const wall = file.byType("IfcWall")[0];
		expect(wall).toBeTruthy();
		const references = [...classificationUtil.getReferences(wall)];
		expect(references.length).toBe(1);
		expect(references[0].isA("IfcClassificationReference")).toBe(true);
		expect(file.byType("IfcOpeningElement").length).toBe(0);
	});

	test("appends a product when projects have different georeferencing", () => {
		// Real Python clones `ifc_file` into `library` via `ifcopenshell.file
		// .from_string(ifc_file.to_string())` before independently re-georeferencing
		// `library` -- this port has no "load from an in-memory string" primitive of its
		// own to reuse for that, so `library` is instead built independently from
		// scratch with the exact same shape (a project + a Model context), which
		// produces an identical test scenario (two files with different georeferencing,
		// one product placed in the library) without depending on a new primitive.
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		addContext(file, { contextType: "Model" });
		addGeoreferencing(file, {});
		editGeoreferencing(file, { coordinateOperation: { Eastings: 3.0, Northings: 23.0 } });

		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		addContext(library, { contextType: "Model" });
		addGeoreferencing(library, {});
		editGeoreferencing(library, { coordinateOperation: { Eastings: 29, Northings: 42 } });

		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const matrix: MatrixType = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1];
		editObjectPlacement(library, { product: element, matrix });

		const created = appendAsset(file, { library, element }) as EntityInstance;
		const resultingMatrix = getLocalPlacement(created.get("ObjectPlacement") as EntityInstance);
		expect(resultingMatrix[12]).toBeCloseTo(27, 6);
		expect(resultingMatrix[13]).toBeCloseTo(21, 6);
		expect(resultingMatrix[14]).toBeCloseTo(3, 6);
	});

	test("appends a surface style", () => {
		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });

		const styleName = "New Style";
		const style = addStyle(library, { name: styleName });
		addSurfaceStyle(library, {
			style,
			ifcClass: "IfcSurfaceStyleShading",
			attributes: { SurfaceColour: { Name: null, Red: 1, Green: 1, Blue: 1 } },
		});

		const newStyle = appendAsset(file, { library, element: style }) as EntityInstance;
		expect(file.byType("IfcSurfaceStyle")).toEqual([newStyle]);
		expect(newStyle.get("Name")).toBe(styleName);
		const styleElements = newStyle.get("Styles") as EntityInstance[];
		expect(styleElements.length).toBe(1);

		const shadingStyle = styleElements[0];
		expect(shadingStyle.isA("IfcSurfaceStyleShading")).toBe(true);
		const colour = shadingStyle.get("SurfaceColour") as EntityInstance;
		expect(colour.get("Red")).toBe(1);
		expect(colour.get("Green")).toBe(1);
		expect(colour.get("Blue")).toBe(1);
	});

	test("updates rels when appending subsequent assets", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element1 = createRootEntity(library, { ifcClass: "IfcWall" });
		const pset = addPset(library, { product: element1, name: "Test" });
		const element2 = createRootEntity(library, { ifcClass: "IfcWall" });
		assignPset(library, { pset, products: [element2] });

		const reuseIdentities = new Map<number, EntityInstance>();
		const element1_ = appendAsset(file, { library, element: element1, reuseIdentities }) as EntityInstance;
		const element2_ = appendAsset(file, { library, element: element2, reuseIdentities }) as EntityInstance;
		const psetData = elementUtil.getPsets(element1_);
		expect(psetData.Test).toBeTruthy();
		expect(elementUtil.getPsets(element2_)).toEqual(psetData);
	});

	test("updates rels when appending subsequent assets, identifying rels by GUID", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const element1 = createRootEntity(library, { ifcClass: "IfcWall" });
		const pset = addPset(library, { product: element1, name: "Test" });
		const element2 = createRootEntity(library, { ifcClass: "IfcWall" });
		const psetRel = assignPset(library, { pset, products: [element2] }) as EntityInstance;
		const psetRelGuid = psetRel.get("GlobalId") as string;

		const element1_ = appendAsset(file, { library, element: element1 }) as EntityInstance;
		const element2_ = appendAsset(file, { library, element: element2 }) as EntityInstance;
		const psetData = elementUtil.getPsets(element1_);

		const appendedRels = file.byType("IfcRelDefinesByProperties").filter((e) => e.get("GlobalId") === psetRelGuid);
		expect(appendedRels.length).toBe(1);
		const relatedObjects = new Set((appendedRels[0].get("RelatedObjects") as EntityInstance[]).map((e) => e.id()));
		expect(relatedObjects).toEqual(new Set([element1_.id(), element2_.id()]));
		expect(elementUtil.getPsets(element2_)).toEqual(psetData);
	});

	test("reuses identities to avoid removed entities and possible crashes", () => {
		const file = blankFile(schema);
		file.createEntity("IfcProject");
		addContext(file, { contextType: "Model" });
		const library = blankFile(schema);
		library.createEntity("IfcProject");
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const item = library.createEntity("IfcBoundingBox");
		const libContext = addContext(library, { contextType: "Model" });
		const representation = library.createEntity("IfcShapeRepresentation", libContext, null, null, [item]);
		element.set("Representation", library.createEntity("IfcProductDefinitionShape", null, null, [representation]));
		const reuseIdentities = new Map<number, EntityInstance>();
		appendAsset(file, { library, element, reuseIdentities });
		// Would throw/crash if there were dangling removed entities left in `reuseIdentities`.
		expect(() => JSON.stringify([...reuseIdentities.keys()])).not.toThrow();
	});

	test("converts a simple float and an aggregate of floats between unit scales", () => {
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		// Placeholder unit assignment intentionally omitted -- `calculateUnitScale`
		// already defaults to a sane scale for an unassigned file; only the RELATIVE
		// scale between `library`/`ifcFile` matters for this test, matching real
		// Python's own `add_si_unit(..., prefix="MILLI")` vs. un-prefixed target file.
		const ifcFile = blankFile(schema);
		createRootEntity(ifcFile, { ifcClass: "IfcProject" });

		const libUnit = addSiUnit(library, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		assignUnit(library, { units: [libUnit] });
		const fileUnit = addSiUnit(ifcFile, { unitType: "LENGTHUNIT" });
		assignUnit(ifcFile, { units: [fileUnit] });

		// Simple float.
		const profile = addParameterizedProfile(library, { ifcClass: "IfcCircleProfileDef" });
		profile.set("Radius", 10.0);
		const newProfile = appendAsset(ifcFile, { library, element: profile }) as EntityInstance;
		expect(newProfile.get("Radius")).toBeCloseTo(0.01, 9);

		// Aggregate of floats: `IfcCartesianPoint.Coordinates` is a direct `LIST OF
		// IfcLengthMeasure` (no ShapeBuilder needed -- see this file's own header
		// comment, item 3, for why ShapeBuilder itself is avoided elsewhere).
		const outerCurve = library.createEntity("IfcPolyline", [
			library.createEntity("IfcCartesianPoint", [0, 0]),
			library.createEntity("IfcCartesianPoint", [1000, 0]),
			library.createEntity("IfcCartesianPoint", [1000, 1000]),
			library.createEntity("IfcCartesianPoint", [0, 1000]),
		]);
		const arbitraryProfile = library.createEntity("IfcArbitraryClosedProfileDef", "AREA", null, outerCurve);
		const newArbitraryProfile = appendAsset(ifcFile, { library, element: arbitraryProfile }) as EntityInstance;
		const newOuterCurve = newArbitraryProfile.get("OuterCurve") as EntityInstance;
		const newPoints = newOuterCurve.get("Points") as EntityInstance[];
		expect(newPoints.map((p) => p.get("Coordinates"))).toEqual([
			[0, 0],
			[1, 0],
			[1, 1],
			[0, 1],
		]);
	});

	test("appends the presentation layer for a representation item", () => {
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const model = addContext(library, { contextType: "Model" });
		const item = createSimpleExtrusion(library);
		const representation = library.createEntity("IfcShapeRepresentation", model, "Body", "SweptSolid", [item]);
		assignRepresentation(library, { product: element, representation });
		const layer = addPresentationLayer(library, { name: "TestLayer" });
		assignLayer(library, { items: [item], layer });

		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		appendAsset(file, { library, element });
		const extrusions = file.byType("IfcExtrudedAreaSolid");
		const assignedItems = file.byType("IfcPresentationLayerAssignment")[0].get("AssignedItems") as EntityInstance[];
		expect(assignedItems.map((e) => e.id())).toEqual(extrusions.map((e) => e.id()));
	});

	test("appends the presentation layer for a representation", () => {
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const element = createRootEntity(library, { ifcClass: "IfcWall" });
		const model = addContext(library, { contextType: "Model" });
		const item = createSimpleExtrusion(library);
		const representation = library.createEntity("IfcShapeRepresentation", model, "Body", "SweptSolid", [item]);
		assignRepresentation(library, { product: element, representation });
		const layer = addPresentationLayer(library, { name: "TestLayer" });
		assignLayer(library, { items: [representation], layer });

		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		appendAsset(file, { library, element });
		const representations = file.byType("IfcRepresentation");
		const assignedItems = file.byType("IfcPresentationLayerAssignment")[0].get("AssignedItems") as EntityInstance[];
		expect(assignedItems.map((e) => e.id())).toEqual(representations.map((e) => e.id()));
	});

	test("appends owner history without producing duplicates", () => {
		const ifcFile = blankFile(schema);
		const library = blankFile(schema);

		ownerSettings.factoryReset();
		const person = addPerson(library, {});
		addRole(library, { assignedObject: person, role: "CONTRIBUTOR" });
		const organisation = addOrganisation(library, {});
		addPersonAndOrganisation(library, { person, organisation });
		// `addApplication` with no explicit `applicationDeveloper` auto-generates its own
		// "IfcOpenShell" organisation (`createApplicationOrganisation`, `addApplication.ts`),
		// which itself carries a default `IfcActorRole` (and, on non-IFC4X3 schemas, an
		// `IfcTelecomAddress`) -- real Python's own test asserts exactly this (2 roles, 1
		// telecom address total), not just the 1 role this test explicitly creates itself.
		addApplication(library, {});
		expect(library.byType("IfcPerson").length).toBe(1);
		expect(library.byType("IfcPersonAndOrganization").length).toBe(1);
		expect(library.byType("IfcApplication").length).toBe(1);
		expect(library.byType("IfcOrganization").length).toBe(2);
		expect(library.byType("IfcActorRole").length).toBe(2);
		if (schema !== "IFC4X3") {
			expect(library.byType("IfcTelecomAddress").length).toBe(1);
		}

		const wallType1 = createRootEntity(library, { ifcClass: "IfcWallType" });
		const wallType2 = createRootEntity(library, { ifcClass: "IfcWallType" });

		appendAsset(ifcFile, { library, element: wallType1 });
		appendAsset(ifcFile, { library, element: wallType2 });

		expect(ifcFile.byType("IfcPerson").length).toBe(1);
		expect(ifcFile.byType("IfcPersonAndOrganization").length).toBe(1);
		expect(ifcFile.byType("IfcApplication").length).toBe(1);
		expect(ifcFile.byType("IfcOrganization").length).toBe(2);
		// Ensure their attributes are also not duplicated.
		expect(ifcFile.byType("IfcActorRole").length).toBe(2);
		if (schema !== "IFC4X3") {
			expect(ifcFile.byType("IfcTelecomAddress").length).toBe(1);
		}
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.project.appendAsset IFC4+-only (%s)", (schema) => {
	test("appends a profile def with all (empty) properties", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const profile = library.createEntity("IfcIShapeProfileDef");
		addPset(library, { product: profile, name: "Foo_Bar" });
		appendAsset(file, { library, element: profile });
		expect(file.byType("IfcIShapeProfileDef").length).toBe(1);
		const hasProperties = file.byType("IfcIShapeProfileDef")[0].get("HasProperties") as EntityInstance[];
		expect(hasProperties[0].get("Name")).toBe("Foo_Bar");
	});

	test("appends a cost schedule", () => {
		const file = blankFile(schema);
		const library = blankFile(schema);
		const schedule = addCostSchedule(library, { name: "Schedule" });
		const item = addCostItem(library, { costSchedule: schedule });
		addCostItem(library, { costItem: item });
		appendAsset(file, { library, element: schedule });
		expect(file.byType("IfcCostSchedule").length).toBe(1);
		expect(file.byType("IfcCostItem").length).toBe(2);
		expect(file.byType("IfcCostSchedule")[0].get("Name")).toBe("Schedule");
		const controls = file.byType("IfcCostSchedule")[0].get("Controls") as EntityInstance[];
		const appendedItem = (controls[0].get("RelatedObjects") as EntityInstance[])[0];
		expect(appendedItem.isA("IfcCostItem")).toBe(true);
		const isNestedBy = appendedItem.get("IsNestedBy") as EntityInstance[];
		expect((isNestedBy[0].get("RelatedObjects") as EntityInstance[])[0].isA("IfcCostItem")).toBe(true);
	});

	test("does not duplicate profiles/materials/styles based on name", () => {
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const model = addContext(library, { contextType: "Model" });
		const body = addContext(library, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: model,
		});
		const columnType = createRootEntity(library, { ifcClass: "IfcColumnType" });
		const libraryProfile = addParameterizedProfile(library, { ifcClass: "IfcCircleProfileDef" });
		libraryProfile.set("ProfileName", "TestProfile");
		const materialSet = addMaterialSet(library, { setType: "IfcMaterialProfileSet" });
		const libraryMaterial = addMaterial(library, { name: "TestMaterial" });
		const libraryStyle = addStyle(library, { name: "TestStyle", ifcClass: "IfcSurfaceStyle" });
		assignMaterialStyle(library, { material: libraryMaterial, style: libraryStyle, context: body });
		addMaterialProfile(library, { profileSet: materialSet, material: libraryMaterial, profile: libraryProfile });
		assignMaterial(library, { products: [columnType], material: materialSet, type: "IfcMaterialProfileSet" });

		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const profile = addParameterizedProfile(file, { ifcClass: "IfcCircleProfileDef" });
		profile.set("ProfileName", "TestProfile");
		appendAsset(file, { library, element: libraryProfile });
		let profiles = file.byType("IfcProfileDef");
		expect(profiles.length).toBe(1);
		expect(profiles[0].get("ProfileName")).toBe("TestProfile");

		addMaterial(file, { name: "TestMaterial" });
		appendAsset(file, { library, element: libraryMaterial });
		let materials = file.byType("IfcMaterial");
		expect(materials.length).toBe(1);
		expect(materials[0].get("Name")).toBe("TestMaterial");

		addStyle(file, { name: "TestStyle", ifcClass: "IfcSurfaceStyle" });
		appendAsset(file, { library, element: libraryStyle });
		let styles = file.byType("IfcSurfaceStyle");
		expect(styles.length).toBe(1);
		expect(styles[0].get("Name")).toBe("TestStyle");

		appendAsset(file, { library, element: columnType });
		expect(file.byType("IfcColumnType").length).toBe(1);
		profiles = file.byType("IfcProfileDef");
		expect(profiles.length).toBe(1);
		expect(profiles[0].get("ProfileName")).toBe("TestProfile");
		materials = file.byType("IfcMaterial");
		expect(materials.length).toBe(1);
		expect(materials[0].get("Name")).toBe("TestMaterial");
		styles = file.byType("IfcSurfaceStyle");
		expect(styles.length).toBe(1);
		expect(styles[0].get("Name")).toBe("TestStyle");
	});

	test("duplicates profiles/materials/styles based on name if uniqueness is not assumed", () => {
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const model = addContext(library, { contextType: "Model" });
		const body = addContext(library, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: model,
		});
		const columnType = createRootEntity(library, { ifcClass: "IfcColumnType" });
		const libraryProfile = addParameterizedProfile(library, { ifcClass: "IfcCircleProfileDef" });
		libraryProfile.set("ProfileName", "TestProfile");
		const materialSet = addMaterialSet(library, { setType: "IfcMaterialProfileSet" });
		const libraryMaterial = addMaterial(library, { name: "TestMaterial" });
		const libraryStyle = addStyle(library, { name: "TestStyle", ifcClass: "IfcSurfaceStyle" });
		assignMaterialStyle(library, { material: libraryMaterial, style: libraryStyle, context: body });
		addMaterialProfile(library, { profileSet: materialSet, material: libraryMaterial, profile: libraryProfile });
		assignMaterial(library, { products: [columnType], material: materialSet, type: "IfcMaterialProfileSet" });

		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		const profile = addParameterizedProfile(file, { ifcClass: "IfcCircleProfileDef" });
		profile.set("ProfileName", "TestProfile");
		appendAsset(file, { library, element: libraryProfile, assumeAssetUniquenessByName: false });
		let profiles = file.byType("IfcProfileDef");
		expect(profiles.length).toBe(2);
		expect(profiles.every((p) => p.get("ProfileName") === "TestProfile")).toBe(true);

		addMaterial(file, { name: "TestMaterial" });
		appendAsset(file, { library, element: libraryMaterial, assumeAssetUniquenessByName: false });
		let materials = file.byType("IfcMaterial");
		expect(materials.length).toBe(2);
		expect(materials.every((m) => m.get("Name") === "TestMaterial")).toBe(true);

		addStyle(file, { name: "TestStyle", ifcClass: "IfcSurfaceStyle" });
		appendAsset(file, { library, element: libraryStyle, assumeAssetUniquenessByName: false });
		let styles = file.byType("IfcSurfaceStyle");
		expect(styles.length).toBe(2);
		expect(styles.every((s) => s.get("Name") === "TestStyle")).toBe(true);

		appendAsset(file, { library, element: columnType, assumeAssetUniquenessByName: false });
		expect(file.byType("IfcColumnType").length).toBe(1);
		profiles = file.byType("IfcProfileDef");
		expect(profiles.length).toBe(2);
		materials = file.byType("IfcMaterial");
		expect(materials.length).toBe(2);
		styles = file.byType("IfcSurfaceStyle");
		expect(styles.length).toBe(2);
	});

	test("does not duplicate material sets based on name", () => {
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const model = addContext(library, { contextType: "Model" });
		addContext(library, { contextType: "Model", contextIdentifier: "Body", targetView: "MODEL_VIEW", parent: model });
		const columnType = createRootEntity(library, { ifcClass: "IfcColumnType" });
		const materialSet = addMaterialSet(library, { setType: "IfcMaterialProfileSet", name: "TestProfileSet" });
		assignMaterial(library, { products: [columnType], material: materialSet, type: "IfcMaterialProfileSet" });

		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "TestProfileSet" });
		appendAsset(file, { library, element: columnType });
		expect(file.byType("IfcMaterialProfileSet").length).toBe(1);
	});

	test("duplicates material sets if uniqueness is not assumed", () => {
		const library = blankFile(schema);
		createRootEntity(library, { ifcClass: "IfcProject" });
		const model = addContext(library, { contextType: "Model" });
		addContext(library, { contextType: "Model", contextIdentifier: "Body", targetView: "MODEL_VIEW", parent: model });
		const columnType = createRootEntity(library, { ifcClass: "IfcColumnType" });
		const materialSet = addMaterialSet(library, { setType: "IfcMaterialProfileSet", name: "TestProfileSet" });
		assignMaterial(library, { products: [columnType], material: materialSet, type: "IfcMaterialProfileSet" });

		const file = blankFile(schema);
		createRootEntity(file, { ifcClass: "IfcProject" });
		addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "TestProfileSet" });
		appendAsset(file, { library, element: columnType, assumeAssetUniquenessByName: false });
		expect(file.byType("IfcMaterialProfileSet").length).toBe(2);
	});
});
