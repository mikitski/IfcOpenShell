// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_unassign_representation.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported. Real Python's
// tests build fixtures via SWIG's keyword-argument convenience constructors (e.g.
// `self.file.createIfcWall(Representation=...)`), which this port's `createEntity` has
// no equivalent for (positional-only, see `file.ts`'s own doc comment) -- `withAttrs`
// below (a small local helper: `file.createEntity(type)` then one `.set()` call per
// keyword) reproduces the same fixture shape without needing to know every involved
// class's real positional attribute order.
//
// Every test also calls `stripProjectBootstrap` (this port's own `createTestFile`
// template pre-populates a default `IfcProject`/`IfcGeometricRepresentationContext`/
// `IfcAxis2Placement3D` chain, unlike real Python's genuinely blank
// `test.bootstrap.IFC4`/`IFC2X3` fixture -- see `bootstrap.ts`'s own doc comment and
// `api.unit`'s established precedent for this exact gap) so `by_type`-based assertions
// on e.g. `IfcAxis2Placement3D` counts match the real Python test's own blank-slate
// expectations.

import { describe, expect, test } from "vitest";
import { unassignRepresentation } from "../../../src/api/geometry/unassignRepresentation";
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

describe.each(AVAILABLE_SCHEMAS)("api.geometry.unassignRepresentation (%s)", (schema) => {
	test("unassigning a product representation", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		const representation2 = withAttrs(file, "IfcShapeRepresentation");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		representation2.set("Items", [item]);
		const wall = withAttrs(file, "IfcWall", {
			Representation: withAttrs(file, "IfcProductDefinitionShape", {
				Representations: [representation, representation2],
			}),
		});

		const shapeAspect = file.createEntity("IfcShapeAspect");
		shapeAspect.set("ShapeRepresentations", [withAttrs(file, "IfcShapeRepresentation", { Items: [item] })]);
		shapeAspect.set("PartOfProductDefinitionShape", wall.get("Representation"));

		unassignRepresentation(file, { product: wall, representation });
		expect(
			((wall.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]).some((r) =>
				r.equals(representation),
			),
		).toBe(false);

		unassignRepresentation(file, { product: wall, representation: representation2 });
		expect(wall.get("Representation")).toBeNull();
		expect(file.byType("IfcShapeRepresentation").length).toBe(2);
		expect(file.byType("IfcProductDefinitionShape").length).toBe(0);
		expect(file.byType("IfcShapeAspect").length).toBe(0);
	});

	test("unassigning a type product representation", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const origin = file.createEntity("IfcAxis2Placement3D");
		const repmap = withAttrs(file, "IfcRepresentationMap", {
			MappedRepresentation: representation,
			MappingOrigin: origin,
		});
		const walltype = withAttrs(file, "IfcWallType", { RepresentationMaps: [repmap] });

		const shapeAspect = file.createEntity("IfcShapeAspect");
		shapeAspect.set("ShapeRepresentations", [withAttrs(file, "IfcShapeRepresentation", { Items: [item] })]);
		shapeAspect.set("PartOfProductDefinitionShape", repmap);

		unassignRepresentation(file, { product: walltype, representation });
		expect((walltype.get("RepresentationMaps") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(file.byType("IfcAxis2Placement3D").length).toBe(0);
		expect(file.byType("IfcRepresentationMap").length).toBe(0);
		expect(file.byType("IfcShapeRepresentation").length).toBe(1);
		expect(file.byType("IfcShapeAspect").length).toBe(0);
	});

	test("unassigning a type product representation used by instances", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		const origin = file.createEntity("IfcAxis2Placement3D");
		const repmap = withAttrs(file, "IfcRepresentationMap", {
			MappedRepresentation: representation,
			MappingOrigin: origin,
		});
		const walltype = withAttrs(file, "IfcWallType", { RepresentationMaps: [repmap] });
		const mappedItem = withAttrs(file, "IfcMappedItem", { MappingSource: repmap });
		const rep = withAttrs(file, "IfcShapeRepresentation", { Items: [mappedItem] });
		const prodrep = withAttrs(file, "IfcProductDefinitionShape", { Representations: [rep] });
		const wall = withAttrs(file, "IfcWall", { Representation: prodrep });

		unassignRepresentation(file, { product: walltype, representation });
		expect((walltype.get("RepresentationMaps") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(file.byType("IfcAxis2Placement3D").length).toBe(0);
		expect(file.byType("IfcRepresentationMap").length).toBe(0);
		expect(file.byType("IfcShapeRepresentation").length).toBe(1);
		expect(wall.get("Representation")).toBeNull();
		expect(file.byType("IfcProductDefinitionShape").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.geometry.unassignRepresentation Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed representation from a still-nonempty product definition shape", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		const representation2 = withAttrs(file, "IfcShapeRepresentation", {
			Items: [file.createEntity("IfcExtrudedAreaSolid")],
		});
		const productDef = withAttrs(file, "IfcProductDefinitionShape", {
			Representations: [representation, representation2],
		});
		const wall = withAttrs(file, "IfcWall", { Representation: productDef });

		file.beginTransaction();
		unassignRepresentation(file, { product: wall, representation });
		file.endTransaction();

		expect(((wall.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(((wall.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]).length).toBe(2);

		file.redo();
		expect(((wall.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]).length).toBe(1);
	});

	test("undo restores the purged representation map (type product path); redo re-purges it -- also pins the disclosed inverse-index workaround (see unassignRepresentation.ts's own doc comment)", () => {
		const file = blankFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const representation = withAttrs(file, "IfcShapeRepresentation", { Items: [item] });
		const origin = file.createEntity("IfcAxis2Placement3D");
		const repmap = withAttrs(file, "IfcRepresentationMap", {
			MappedRepresentation: representation,
			MappingOrigin: origin,
		});
		const walltype = withAttrs(file, "IfcWallType", { RepresentationMaps: [repmap] });
		const repmapId = repmap.id();

		file.beginTransaction();
		unassignRepresentation(file, { product: walltype, representation });
		file.endTransaction();

		// Pins the workaround itself: if the double-`.set()` workaround were removed (or
		// the underlying native bug silently regressed), `repmap` would stay "referenced"
		// forever and never actually get removed here.
		expect((walltype.get("RepresentationMaps") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(() => file.byId(repmapId)).toThrow();

		file.undo();
		expect(file.byId(repmapId).isA("IfcRepresentationMap")).toBe(true);
		expect((walltype.get("RepresentationMaps") as EntityInstance[]).some((m) => m.equals(file.byId(repmapId)))).toBe(
			true,
		);

		file.redo();
		expect((walltype.get("RepresentationMaps") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(() => file.byId(repmapId)).toThrow();
	});

	test("undo restores the purged product definition shape when the last representation is removed", () => {
		const file = blankFile(schema);
		const representation = withAttrs(file, "IfcShapeRepresentation");
		const productDef = withAttrs(file, "IfcProductDefinitionShape", { Representations: [representation] });
		const wall = withAttrs(file, "IfcWall", { Representation: productDef });
		const productDefId = productDef.id();

		file.beginTransaction();
		unassignRepresentation(file, { product: wall, representation });
		file.endTransaction();

		expect(wall.get("Representation")).toBeNull();
		expect(() => file.byId(productDefId)).toThrow();

		file.undo();
		expect((wall.get("Representation") as EntityInstance).id()).toBe(productDefId);

		file.redo();
		expect(wall.get("Representation")).toBeNull();
	});
});
