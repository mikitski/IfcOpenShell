// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_schema.py` (src/ifcopenshell-python), covering
// this chunk's scope only (everything in `schema.py` up to, but NOT including,
// `class Migrator:` -- see `src/util/schema.ts`'s own header comment). `Migrator`
// itself and `TestEnumValueOutsideTarget` (the `Migrator`-only private helper, not
// ported here -- see that file's header comment for why) have no counterpart below.
//
// `getDeclaration`/`isA`/`getSupertypes`/`getSubtypes`/`reassignClass`/
// `BatchReassignClass` have no dedicated Python test class in `test_schema.py` at all
// (confirmed by reading the whole file -- only `TestGetFallbackSchema`,
// `TestIfc4OnlyGeometryClasses`, `TestGeometryClassesIntroducedAfter`, and the
// `Migrator`/`_enum_value_outside_target` tests exist there) -- the tests below for
// those functions are original coverage of the documented Python behavior
// (`schema.py`'s own docstrings/source), not a port of an existing Python test,
// matching `util/element.ts`'s own established precedent for functions Python itself
// doesn't directly test (see that file's test header comment).
//
// `getFallbackSchema`/`ifc4OnlyGeometryClasses`/`geometryClassesIntroducedAfter` ARE
// directly ported from real Python test classes below.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import {
	declaration as NativeDeclarationCtor,
	type entity as NativeEntity,
} from "../../src/native/ifcopenshell_native";
import * as subject from "../../src/util/schema";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

function guid(seed: string): string {
	return seed.repeat(22).slice(0, 22);
}

/** Same verified, disclosed pointer-reinterpret technique `src/util/schema.ts`'s own
 * (non-exported) `entityName` uses -- `entity`'s TS class has no public `.name()`.
 * Duplicated here rather than exported from production code purely to make test
 * assertions readable; not itself part of this chunk's ported public API. */
function entityName(entity: NativeEntity): string {
	return new NativeDeclarationCtor(entity._handle).name();
}

// --- TestGetFallbackSchema (direct port -- no file/schema needed at all) ---

describe("util.schema getFallbackSchema", () => {
	test("IFC4X3 variants collapse to IFC4X3 -- longest-prefix-first, checked before IFC4", () => {
		expect(subject.getFallbackSchema("IFC4X3")).toBe("IFC4X3");
		expect(subject.getFallbackSchema("IFC4X3_ADD1")).toBe("IFC4X3");
		expect(subject.getFallbackSchema("IFC4X3_ADD2")).toBe("IFC4X3");
		expect(subject.getFallbackSchema("IFC4X3_RC1")).toBe("IFC4X3");
	});

	test("IFC4 variants collapse to IFC4 -- IFC4X1/IFC4X2 are draft schemas, collapse to IFC4 by design", () => {
		expect(subject.getFallbackSchema("IFC4")).toBe("IFC4");
		expect(subject.getFallbackSchema("IFC4_ADD1")).toBe("IFC4");
		expect(subject.getFallbackSchema("IFC4_ADD2")).toBe("IFC4");
		expect(subject.getFallbackSchema("IFC4X1")).toBe("IFC4");
		expect(subject.getFallbackSchema("IFC4X2")).toBe("IFC4");
	});

	test("IFC2X3 variants collapse to IFC2X3", () => {
		expect(subject.getFallbackSchema("IFC2X3")).toBe("IFC2X3");
		expect(subject.getFallbackSchema("IFC2X3_TC1")).toBe("IFC2X3");
		expect(subject.getFallbackSchema("IFC2X3_FINAL")).toBe("IFC2X3");
	});

	test("unknown version throws", () => {
		expect(() => subject.getFallbackSchema("IFC10")).toThrow(/Unexpected schema version/);
	});
});

// --- getDeclaration / isA / getSupertypes / getSubtypes ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.schema getDeclaration / isA / getSupertypes", () => {
	test("getDeclaration returns the schema declaration matching the docstring example", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const declaration = subject.getDeclaration(wall);
		expect(declaration.name()).toBe("IfcWall");
		expect(declaration.as_entity()?.is_abstract()).toBe(false);
	});

	test("isA checks a declaration against a case-insensitive-in-Python, real class name here", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const declaration = subject.getDeclaration(wall);
		expect(subject.isA(declaration, "IfcRoot")).toBe(true);
		expect(subject.isA(declaration, "IfcWall")).toBe(true);
		expect(subject.isA(declaration, "IfcDoor")).toBe(false);
	});

	test("getSupertypes walks from parent to grandparent, ending at the schema root", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const entityDeclaration = subject.getDeclaration(wall).as_entity();
		expect(entityDeclaration).not.toBeNull();
		const supertypes = subject.getSupertypes(entityDeclaration as NonNullable<typeof entityDeclaration>);
		// IfcWall -> IfcBuildingElement -> IfcElement -> ... -> IfcRoot (4+ levels in
		// IFC4); the wall's own declaration is NOT included (unlike `getSubtypes`'s
		// own documented "includes itself" quirk), and the last entry's own
		// `.supertype()` is `null` (IfcRoot has no supertype).
		expect(supertypes.length).toBeGreaterThan(3);
		const last = supertypes[supertypes.length - 1];
		expect(last.supertype()).toBeNull();
	});

	test("getSubtypes includes the starting declaration itself (Python's own documented 'inconsistent' quirk, ported faithfully)", () => {
		const file = createTestFile("IFC4");
		const wallEntity = file.nativeFile.schema().declaration_by_name_with_name("IfcWall").as_entity();
		expect(wallEntity).not.toBeNull();
		expect((wallEntity as NonNullable<typeof wallEntity>).is_abstract()).toBe(false);
		const subtypes = subject.getSubtypes(wallEntity as NonNullable<typeof wallEntity>);
		// IfcWall is concrete (not abstract), so -- per the documented "inconsistent"
		// quirk -- it's included in its own result, alongside its two real IFC4
		// subtypes (IfcWallElementedCase, IfcWallStandardCase).
		expect(subtypes.map(entityName).sort()).toEqual(["IfcWall", "IfcWallElementedCase", "IfcWallStandardCase"].sort());
	});

	test("getSubtypes skips abstract classes but includes concrete descendants (docstring's IfcFlowSegment example)", () => {
		const file = createTestFile("IFC4");
		const flowSegmentEntity = file.nativeFile.schema().declaration_by_name_with_name("IfcFlowSegment").as_entity();
		expect(flowSegmentEntity).not.toBeNull();
		const subtypes = subject.getSubtypes(flowSegmentEntity as NonNullable<typeof flowSegmentEntity>);
		// IfcFlowSegment itself is concrete in IFC4 (matches the Python docstring's
		// own example output, which lists IfcFlowSegment first), so it IS included,
		// alongside its concrete descendants (IfcPipeSegment among them).
		expect(subtypes.map(entityName)).toEqual(
			expect.arrayContaining(["IfcFlowSegment", "IfcPipeSegment", "IfcCableCarrierSegment"]),
		);
		expect(subtypes.every((e) => !e.is_abstract())).toBe(true);
	});
});

// --- ifc4OnlyGeometryClasses / geometryClassesIntroducedAfter (direct ports) ---
//
// These need real IFC2X3 AND IFC4 schema access independent of any open file --
// gated on `AVAILABLE_SCHEMAS` including both, per this project's established rule
// (CI's core build is `SCHEMA_VERSIONS=4`-only, so these are silently skipped there
// today, a disclosed, tracked coverage gap -- see `PROGRESS.md`'s "Current focus").

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3") || !AVAILABLE_SCHEMAS.includes("IFC4"))(
	"util.schema ifc4OnlyGeometryClasses",
	() => {
		test("known IFC4-only geometry classes are present", () => {
			const result = subject.ifc4OnlyGeometryClasses();
			for (const name of [
				"IfcPolygonalFaceSet",
				"IfcTriangulatedFaceSet",
				"IfcIndexedPolyCurve",
				"IfcCartesianPointList3D",
				"IfcAdvancedBrep",
			]) {
				expect(result.has(name), `${name} should be classified as IFC4-only geometry`).toBe(true);
			}
		});

		test("classes that exist in both schemas are absent", () => {
			const result = subject.ifc4OnlyGeometryClasses();
			for (const name of ["IfcPolyline", "IfcFacetedBrep", "IfcCartesianPoint", "IfcExtrudedAreaSolid"]) {
				expect(result.has(name), `${name} exists in IFC2X3, should not be IFC4-only`).toBe(false);
			}
		});

		test("IFC4-only non-IfcRepresentationItem classes are absent", () => {
			const result = subject.ifc4OnlyGeometryClasses();
			for (const name of ["IfcEvent", "IfcWorkCalendar", "IfcLamp"]) {
				expect(result.has(name), `${name} is not an IfcRepresentationItem subclass`).toBe(false);
			}
		});

		test("result is cached -- same Set object on repeated calls", () => {
			const first = subject.ifc4OnlyGeometryClasses();
			const second = subject.ifc4OnlyGeometryClasses();
			expect(first).toBe(second);
		});
	},
);

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3") || !AVAILABLE_SCHEMAS.includes("IFC4"))(
	"util.schema geometryClassesIntroducedAfter",
	() => {
		test("IFC4 -> IFC2X3 matches the legacy helper (thin alias)", () => {
			expect(subject.geometryClassesIntroducedAfter("IFC2X3", "IFC4")).toBe(subject.ifc4OnlyGeometryClasses());
		});

		test("IFC4 -> IFC4X3 is empty -- IFC4X3 is a superset of IFC4's own IfcRepresentationItem subclasses", () => {
			if (!AVAILABLE_SCHEMAS.includes("IFC4X3")) return;
			expect(subject.geometryClassesIntroducedAfter("IFC4X3", "IFC4").size).toBe(0);
		});
	},
);

// --- reassignClass ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.schema reassignClass", () => {
	function makeWall(file: IfcFile): EntityInstance {
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("1"));
		wall.set("Name", "Wall 1");
		return wall;
	}

	test("returns the same element unchanged when already the target class", () => {
		const file = createTestFile("IFC4");
		const wall = makeWall(file);
		const result = subject.reassignClass(file, wall, "IfcWall");
		expect(result.identity()).toBe(wall.identity());
	});

	test("throws a clear error for a class that doesn't exist in the file's schema", () => {
		const file = createTestFile("IFC4");
		const wall = makeWall(file);
		expect(() => subject.reassignClass(file, wall, "IfcNotARealClass")).toThrow(/could not be changed/);
	});

	test("preserves the same STEP id and compatible attribute values, changes the class", () => {
		const file = createTestFile("IFC4");
		const wall = makeWall(file);
		const originalId = wall.id();
		const newElement = subject.reassignClass(file, wall, "IfcBuildingElementProxy");
		expect(newElement.isA()).toBe("IfcBuildingElementProxy");
		expect(newElement.id()).toBe(originalId);
		expect(newElement.get("GlobalId")).toBe(guid("1"));
		expect(newElement.get("Name")).toBe("Wall 1");
	});

	test("rewires a singular (non-aggregate) inverse reference from the old element to the new one", () => {
		const file = createTestFile("IFC4");
		const wall = makeWall(file);
		const opening = file.createEntity("IfcOpeningElement");
		opening.set("GlobalId", guid("2"));
		const voidsRel = file.createEntity("IfcRelVoidsElement");
		voidsRel.set("GlobalId", guid("3"));
		voidsRel.set("RelatingBuildingElement", wall);
		voidsRel.set("RelatedOpeningElement", opening);

		const newElement = subject.reassignClass(file, wall, "IfcBuildingElementProxy");

		const relating = voidsRel.get("RelatingBuildingElement") as EntityInstance;
		expect(relating.identity()).toBe(newElement.identity());
	});

	test("rewires an aggregate inverse reference, appending the new element", () => {
		const file = createTestFile("IFC4");
		const wall = makeWall(file);
		const storey = file.createEntity("IfcBuildingStorey");
		storey.set("GlobalId", guid("4"));
		const aggRel = file.createEntity("IfcRelAggregates");
		aggRel.set("GlobalId", guid("5"));
		aggRel.set("RelatingObject", storey);
		aggRel.set("RelatedObjects", [wall]);

		const newElement = subject.reassignClass(file, wall, "IfcBuildingElementProxy");

		const related = aggRel.get("RelatedObjects") as EntityInstance[];
		expect(related).toHaveLength(1);
		expect(related[0].identity()).toBe(newElement.identity());
	});

	test("drops an enum attribute value that isn't a legal member of the new class's enum", () => {
		const file = createTestFile("IFC4");
		const covering = file.createEntity("IfcCovering");
		covering.set("GlobalId", guid("6"));
		// CEILING is a legal IfcCoveringTypeEnum value but not a legal
		// IfcSlabTypeEnum value -- the new class's PredefinedType must NOT carry it
		// over (matches Python's own enum-membership guard in reassign_class).
		covering.set("PredefinedType", "CEILING");

		const newElement = subject.reassignClass(file, covering, "IfcSlab");
		expect(newElement.isA()).toBe("IfcSlab");
		expect(newElement.get("PredefinedType")).toBeNull();
	});

	test("preserves an enum attribute value that IS a legal member of the new class's enum", () => {
		const file = createTestFile("IFC4");
		const slab1 = file.createEntity("IfcSlab");
		slab1.set("GlobalId", guid("7"));
		slab1.set("PredefinedType", "FLOOR");

		const newElement = subject.reassignClass(file, slab1, "IfcSlabStandardCase");
		expect(newElement.isA()).toBe("IfcSlabStandardCase");
		expect(newElement.get("PredefinedType")).toBe("FLOOR");
	});

	test("uses an existing IfcFile mutation transaction -- undo restores the original class", () => {
		const file = createTestFile("IFC4");
		const wall = makeWall(file);
		const originalId = wall.id();
		file.beginTransaction();
		const newElement = subject.reassignClass(file, wall, "IfcBuildingElementProxy");
		file.endTransaction();
		expect(newElement.isA()).toBe("IfcBuildingElementProxy");
		file.undo();
		const restored = file.byId(originalId);
		expect(restored.isA()).toBe("IfcWall");
		expect(restored.get("Name")).toBe("Wall 1");
	});
});

// --- BatchReassignClass ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.schema BatchReassignClass", () => {
	test("reassign returns a fresh instance immediately; unbatch rewires inverses and deletes the originals", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("8"));
		wall.set("Name", "Batch Wall");

		const storey = file.createEntity("IfcBuildingStorey");
		storey.set("GlobalId", guid("9"));
		const aggRel = file.createEntity("IfcRelAggregates");
		aggRel.set("GlobalId", guid("a"));
		aggRel.set("RelatingObject", storey);
		aggRel.set("RelatedObjects", [wall]);

		const batch = new subject.BatchReassignClass(file);
		const newElement = batch.reassign(wall, "IfcBuildingElementProxy");
		expect(newElement.isA()).toBe("IfcBuildingElementProxy");
		// Name-matching attribute copy already happened synchronously.
		expect(newElement.get("Name")).toBe("Batch Wall");
		// The old wall is NOT deleted yet, and inverses are NOT rewired yet.
		expect(file.byId(wall.id()).isA()).toBe("IfcWall");

		batch.unbatch();

		const related = aggRel.get("RelatedObjects") as EntityInstance[];
		expect(related).toHaveLength(1);
		expect(related[0].identity()).toBe(newElement.identity());
		expect(() => file.byId(wall.id())).toThrow();
	});

	test("purge resets state without touching the file", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("b"));

		const batch = new subject.BatchReassignClass(file);
		batch.reassign(wall, "IfcBuildingElementProxy");
		batch.purge();
		batch.unbatch();

		// Nothing pending after purge -- the original wall is untouched.
		expect(file.byId(wall.id()).isA()).toBe("IfcWall");
	});
});
