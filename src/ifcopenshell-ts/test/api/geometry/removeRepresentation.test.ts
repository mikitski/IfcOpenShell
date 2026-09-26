// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_remove_representation.py`
// (src/ifcopenshell-python) -- all 14 real Python test methods ported. Same
// `withAttrs` local helper as `unassignRepresentation.test.ts` (see that file's own
// header comment for why), and the same `blankFile` (`stripProjectBootstrap`) adaptation
// for `by_type`-based assertions to match real Python's genuinely blank fixture.
//
// **Real Python's own `test_remove_representation.py` has no IFC2X3 test class at
// all** (`class TestRemoveRepresentation(test.bootstrap.IFC4):` only -- confirmed by
// reading the whole file directly, unlike `test_unassign_representation.py`'s own
// `TestUnassignRepresentationIFC2X3`), so this file's own real Python test scope is
// IFC4-only, not multi-schema. The 3 tessellated-faceset-colour/texture tests
// (`IfcTriangulatedFaceSet`/`IfcIndexedColourMap`/`IfcIndexedTriangleTextureMap`/
// `IfcTextureVertexList`/`IfcImageTexture`, all genuinely absent from IFC2X3's schema)
// are `test.skipIf(schema === "IFC2X3")`-guarded below, matching
// `createEntity.test.ts`'s own established precedent for this exact "real Python test
// file's own scope is narrower than `describe.each(AVAILABLE_SCHEMAS)`" situation. The
// other 11 tests use no IFC4+-only class and are genuinely schema-agnostic, so they run
// against every `AVAILABLE_SCHEMAS` entry -- a real, deliberate widening of coverage
// beyond real Python's own IFC4-only scope, not a narrowing, since nothing about their
// own logic is IFC4-specific.

import { describe, expect, test } from "vitest";
import { removeRepresentation } from "../../../src/api/geometry/removeRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function blankFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	return file;
}

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.removeRepresentation (%s)", (schema) => {
	test("removing a single unused shape representation", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		removeRepresentation(file, { representation });
		expect(file.byType("IfcShapeRepresentation").length).toBe(0);
	});

	test("not removing a shape representation in use", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		withAttrs(file, "IfcProductRepresentation", { Representations: [representation] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcShapeRepresentation").length).toBe(1);
	});

	test("removing a mapped representation fully", () => {
		const file = blankFile(schema);
		const mappedItem = withAttrs(file, "IfcMappedItem", {
			MappingTarget: withAttrs(file, "IfcRepresentationMap", {
				MappedRepresentation: withAttrs(file, "IfcShapeRepresentation"),
			}),
		});
		const representation = withAttrs(file, "IfcShapeRepresentation", {
			RepresentationType: "MappedRepresentation",
			Items: [mappedItem],
		});
		expect(file.byType("IfcShapeRepresentation").length).toBe(2);
		removeRepresentation(file, { representation });
		expect(file.byType("IfcShapeRepresentation").length).toBe(0);
	});

	test("removing only the representation mapping if the map has other users", () => {
		const file = blankFile(schema);
		const representationMap = withAttrs(file, "IfcRepresentationMap", {
			MappedRepresentation: withAttrs(file, "IfcShapeRepresentation"),
		});
		withAttrs(file, "IfcWallType", { RepresentationMaps: [representationMap] });
		const representation = withAttrs(file, "IfcShapeRepresentation", {
			RepresentationType: "MappedRepresentation",
			Items: [withAttrs(file, "IfcMappedItem", { MappingTarget: representationMap })],
		});
		expect(file.byType("IfcShapeRepresentation").length).toBe(2);
		removeRepresentation(file, { representation });
		expect(file.byType("IfcShapeRepresentation").length).toBe(1);
		expect(file.byType("IfcShapeRepresentation")[0].get("RepresentationType")).not.toBe("MappedRepresentation");
		expect(file.byType("IfcRepresentationMap").length).toBe(1);
	});

	test("purging styled items assignments but keeping the surface style", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const surfaceStyle = file.createEntity("IfcSurfaceStyle");
		withAttrs(file, "IfcStyledItem", { Item: item, Styles: [surfaceStyle] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcStyledItem").length).toBe(0);
		expect(file.byType("IfcSurfaceStyle").length).toBe(1);
	});

	test("not purging styled items if used elsewhere", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		withAttrs(file, "IfcStyledItem", { Item: item });
		withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcStyledItem").length).toBe(1);
	});

	test("purging representation presentation layers", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		withAttrs(file, "IfcPresentationLayerAssignment", { AssignedItems: [representation] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcPresentationLayerAssignment").length).toBe(0);
		expect(file.byType("IfcShapeRepresentation").length).toBe(0);
	});

	test("not purging representation presentation layers still in use", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		const representation2 = withAttrs(file, "IfcShapeRepresentation");
		withAttrs(file, "IfcPresentationLayerAssignment", { AssignedItems: [representation, representation2] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcPresentationLayerAssignment").length).toBe(1);
		expect(file.byType("IfcShapeRepresentation").length).toBe(1);
	});

	test("purging representation item presentation layers", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		withAttrs(file, "IfcPresentationLayerAssignment", { AssignedItems: [item] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcPresentationLayerAssignment").length).toBe(0);
		expect(file.byType("IfcExtrudedAreaSolid").length).toBe(0);
	});

	test("not purging representation item presentation layers still in use", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const item2 = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		withAttrs(file, "IfcShapeRepresentation", { Items: [item2] });
		withAttrs(file, "IfcPresentationLayerAssignment", { AssignedItems: [item, item2] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcPresentationLayerAssignment").length).toBe(1);
		expect(file.byType("IfcExtrudedAreaSolid").length).toBe(1);
	});

	test("not purging geometric representation contexts", () => {
		const file = blankFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationSubContext");
		const representation = withAttrs(file, "IfcShapeRepresentation", { ContextOfItems: context });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(1);
	});

	test.skipIf(schema === "IFC2X3")("purging colour map", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcTriangulatedFaceSet");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		withAttrs(file, "IfcIndexedColourMap", { Colours: file.createEntity("IfcColourRgbList"), MappedTo: item });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcIndexedColourMap").length).toBe(0);
		expect(file.byType("IfcColourRgbList").length).toBe(0);
	});

	test.skipIf(schema === "IFC2X3")("purging texture coordinates", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcTriangulatedFaceSet");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const image = file.createEntity("IfcImageTexture");
		withAttrs(file, "IfcIndexedTriangleTextureMap", {
			TexCoords: file.createEntity("IfcTextureVertexList"),
			MappedTo: item,
			Maps: [image],
		});
		removeRepresentation(file, { representation });
		expect(file.byType("IfcIndexedTriangleTextureMap").length).toBe(0);
		expect(file.byType("IfcTextureVertexList").length).toBe(0);
		expect(file.byType("IfcImageTexture").length).toBe(0);
	});

	test.skipIf(schema === "IFC2X3")("purging texture coordinates but not images used in other styles", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcTriangulatedFaceSet");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const image = file.createEntity("IfcImageTexture");
		withAttrs(file, "IfcIndexedTriangleTextureMap", {
			TexCoords: file.createEntity("IfcTextureVertexList"),
			MappedTo: item,
			Maps: [image],
		});
		withAttrs(file, "IfcIndexedTriangleTextureMap", { Maps: [image] });
		removeRepresentation(file, { representation });
		expect(file.byType("IfcIndexedTriangleTextureMap").length).toBe(1);
		expect(file.byType("IfcTextureVertexList").length).toBe(0);
		expect(file.byType("IfcImageTexture").length).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.geometry.removeRepresentation Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a fully-removed representation; redo removes it again", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		const representationId = representation.id();

		file.beginTransaction();
		removeRepresentation(file, { representation });
		file.endTransaction();

		expect(() => file.byId(representationId)).toThrow();

		file.undo();
		expect(file.byId(representationId).isA("IfcShapeRepresentation")).toBe(true);

		file.redo();
		expect(() => file.byId(representationId)).toThrow();
	});

	test("undo restores a purged styled item and its representation item; redo removes them again", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const styledItem = withAttrs(file, "IfcStyledItem", { Item: item, Styles: [file.createEntity("IfcSurfaceStyle")] });
		const styledItemId = styledItem.id();
		const itemId = item.id();

		file.beginTransaction();
		removeRepresentation(file, { representation });
		file.endTransaction();

		expect(() => file.byId(styledItemId)).toThrow();
		expect(() => file.byId(itemId)).toThrow();
		expect(file.byType("IfcSurfaceStyle").length).toBe(1);

		file.undo();
		expect(file.byId(styledItemId).isA("IfcStyledItem")).toBe(true);
		expect(file.byId(itemId).isA("IfcExtrudedAreaSolid")).toBe(true);

		file.redo();
		expect(() => file.byId(styledItemId)).toThrow();
		expect(() => file.byId(itemId)).toThrow();
	});
});
