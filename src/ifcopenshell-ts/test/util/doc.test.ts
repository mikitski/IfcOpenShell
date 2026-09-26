// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_doc.py` -- except that file doesn't exist (checked
// `src/ifcopenshell-python/test/util/` in full before writing this: `doc.py` has no
// dedicated Python test module at all). Written directly against `doc.py`'s own source
// and the real bundled JSON data instead, following the "real lookups against the real
// bundled data for well-known classes/psets/properties across all three schemas"
// approach `util/doc.ts`'s own header comment/this chunk's task brief calls for.
//
// Schema-gating: most of this module (`getDb`/`getClassSuggestions`/
// `getPredefinedTypeDoc`/`getPropertySetDoc`/`getPropertyDoc`/`getTypeDoc`, and
// `getEntityDoc`/`getAttributeDoc` when called with `recursive=false`) is a pure JSON
// lookup against the bundled `data/doc/*.json` files -- entirely independent of what
// schemas the built native addon actually has registered, exactly like
// `test/util/type.test.ts`'s own documented rationale for the same situation. Those
// tests below need NO `AVAILABLE_SCHEMAS` guard, and are run for IFC2X3/IFC4/IFC4X3
// unconditionally.
//
// Only `getSchemaByName` and `getInverseAttributes` (both touch a real, native
// `schema_definition`/`entity` handle) -- and `getEntityDoc`/`getAttributeDoc`'s
// *recursive* (default) path, which internally calls `getSchemaByName` to walk
// `.supertype()` -- actually need a real schema registered in the built addon. Those
// are guarded with this project's own `AVAILABLE_SCHEMAS` skip-guard (CI's core build
// is `SCHEMA_VERSIONS=4`, IFC4-only) for the IFC2X3/IFC4X3 cases; the IFC4 cases run
// unconditionally since IFC4 is always available.

import { describe, expect, test } from "vitest";
import * as doc from "../../src/util/doc";
import { AVAILABLE_SCHEMAS } from "../bootstrap";

/**
 * `declaration.as_entity()` returns `entity | null` -- this asserts non-null (failing
 * the test with a clear message if it ever isn't) and narrows the type, matching
 * `test/util/schema.test.ts`'s own `as NonNullable<typeof x>` convention for the same
 * "assert-then-narrow" situation, centralized here since this file does it repeatedly.
 */
function assertNotNull<T>(value: T | null): T {
	expect(value).not.toBeNull();
	return value as NonNullable<T>;
}

describe("util.doc getDb", () => {
	test("loads and caches all three schemas' documentation databases", () => {
		for (const schema of ["IFC2X3", "IFC4", "IFC4X3"] as const) {
			const db = doc.getDb(schema);
			expect(db).toBeDefined();
			expect(Object.keys(db?.entities ?? {}).length).toBeGreaterThan(100);
			expect(Object.keys(db?.types ?? {}).length).toBeGreaterThan(50);
			expect(Object.keys(db?.properties ?? {}).length).toBeGreaterThan(50);
			expect(Object.keys(db?.classesSuggestions ?? {}).length).toBeGreaterThan(0);
		}
	});

	test("resolves fallback schema versions (e.g. IFC4X3_ADD2) to the same database as their canonical name", () => {
		expect(doc.getDb("IFC4X3_ADD2")).toBe(doc.getDb("IFC4X3"));
		expect(doc.getDb("IFC4X1")).toBe(doc.getDb("IFC4"));
	});
});

describe("util.doc getEntityDoc / getAttributeDoc / getPredefinedTypeDoc", () => {
	test("IfcWall (non-recursive): description, specUrl, predefined type docs", () => {
		const wall = doc.getEntityDoc("IFC4", "IfcWall", false);
		expect(wall).toBeDefined();
		expect(wall?.description).toContain("wall represents a vertical construction");
		expect(wall?.specUrl).toContain("ifcwall.htm");
		expect(wall?.predefinedTypes?.ELEMENTEDWALL).toContain("stud wall framed with studs");
	});

	test("getPredefinedTypeDoc is a direct shortcut to the same predefined-type lookup", () => {
		expect(doc.getPredefinedTypeDoc("IFC4", "IfcWall", "ELEMENTEDWALL")).toBe(
			doc.getEntityDoc("IFC4", "IfcWall", false)?.predefinedTypes?.ELEMENTEDWALL,
		);
		expect(doc.getPredefinedTypeDoc("IFC4", "IfcWall", "NOT_A_REAL_PREDEFINED_TYPE")).toBeUndefined();
	});

	test("entity with no documented own attributes (IfcActuator) has attributes undefined, non-recursively", () => {
		const actuator = doc.getEntityDoc("IFC4", "IfcActuator", false);
		expect(actuator).toBeDefined();
		expect(actuator?.attributes).toBeUndefined();
	});

	test("unknown entity/attribute/predefined-type/pset/property all resolve to undefined, not throw", () => {
		expect(doc.getEntityDoc("IFC4", "IfcThisDoesNotExist", false)).toBeUndefined();
		expect(doc.getAttributeDoc("IFC4", "IfcWall", "ThisAttributeDoesNotExist", false)).toBeUndefined();
		expect(doc.getPredefinedTypeDoc("IFC4", "IfcWall", "NOTAREALTYPE")).toBeUndefined();
		expect(doc.getPropertySetDoc("IFC4", "Pset_ThisDoesNotExist")).toBeUndefined();
		expect(doc.getPropertyDoc("IFC4", "Pset_WallCommon", "ThisPropertyDoesNotExist")).toBeUndefined();
		expect(doc.getTypeDoc("IFC4", "IfcThisTypeDoesNotExist")).toBeUndefined();
	});

	describe.each(AVAILABLE_SCHEMAS.map((schema) => [schema]))(
		"recursive attribute-doc inheritance merge (%s)",
		(schema) => {
			test("IfcWallStandardCase inherits OwnerHistory's doc from its supertype chain only when recursive", () => {
				const nonRecursive = doc.getEntityDoc(schema, "IfcWallStandardCase", false);
				expect(nonRecursive?.attributes?.OwnerHistory).toBeUndefined();

				const recursive = doc.getEntityDoc(schema, "IfcWallStandardCase", true);
				expect(recursive?.attributes?.OwnerHistory).toBeDefined();
				expect(recursive?.attributes?.OwnerHistory).toContain("ownership");

				// `getAttributeDoc` defaults to `recursive=True`, matching Python.
				expect(doc.getAttributeDoc(schema, "IfcWallStandardCase", "OwnerHistory")).toBe(
					recursive?.attributes?.OwnerHistory,
				);
				expect(doc.getAttributeDoc(schema, "IfcWallStandardCase", "OwnerHistory", false)).toBeUndefined();
			});
		},
	);
});

describe("util.doc getPropertySetDoc / getPropertyDoc", () => {
	test("Pset_WallCommon.FireRating (IFC4): a plain, non-complex property", () => {
		const pset = doc.getPropertySetDoc("IFC4", "Pset_WallCommon");
		expect(pset).toBeDefined();
		expect(Object.keys(pset?.properties ?? {})).toContain("FireRating");

		const fireRating = doc.getPropertyDoc("IFC4", "Pset_WallCommon", "FireRating");
		expect(fireRating).toBeDefined();
		expect(fireRating?.description).toContain("fire safety classification");
		expect(fireRating?.children).toBeUndefined();
	});

	test("a complex property with nested children (Pset_MaterialWoodBasedBeam.InPlane, IFC4)", () => {
		const inPlane = doc.getPropertyDoc("IFC4", "Pset_MaterialWoodBasedBeam", "InPlane");
		expect(inPlane).toBeDefined();
		expect(inPlane?.children).toBeDefined();
		expect(Object.keys(inPlane?.children ?? {})).toContain("BendingStrength");
		expect(inPlane?.children?.BendingStrength.description).toBe("Bending strength.");
	});

	test("PsetData.description/specUrl are genuinely optional -- real IFC4 psets missing one or the other", () => {
		// Verified directly against the real bundled `ifc4_properties.json` (see
		// `util/doc.ts`'s own header comment, disclosed discrepancy #2).
		const bothMissing = doc.getPropertySetDoc("IFC4", "Pset_BuildingElementCommon");
		expect(bothMissing?.description).toBeUndefined();
		expect(bothMissing?.specUrl).toBeUndefined();
		expect(bothMissing?.properties).toBeDefined();

		const descriptionOnly = doc.getPropertySetDoc("IFC4", "Pset_SpatialZoneCommon");
		expect(descriptionOnly?.description).toBeUndefined();
		expect(descriptionOnly?.specUrl).toBeDefined();

		const specUrlOnly = doc.getPropertySetDoc("IFC4", "Pset_ElementCommon");
		expect(specUrlOnly?.description).toBeDefined();
		expect(specUrlOnly?.specUrl).toBeUndefined();
	});
});

describe("util.doc getTypeDoc", () => {
	test("IfcLabel across all three schemas, each with its own spec_url domain", () => {
		const ifc4 = doc.getTypeDoc("IFC4", "IfcLabel");
		expect(ifc4?.description).toContain("human-interpretable name");
		expect(ifc4?.specUrl).toContain("standards.buildingsmart.org");

		const ifc2x3 = doc.getTypeDoc("IFC2X3", "IfcLabel");
		expect(ifc2x3?.description).toBeDefined();

		const ifc4x3 = doc.getTypeDoc("IFC4X3", "IfcLabel");
		expect(ifc4x3?.specUrl).toContain("ifc43-docs.standards.buildingsmart.org");
	});
});

describe("util.doc getClassSuggestions", () => {
	test("IfcActuator has a real suggestion list (a list of ClassesSuggestions, not a single object)", () => {
		const suggestions = doc.getClassSuggestions("IFC4", "IfcActuator");
		expect(suggestions).toBeDefined();
		expect(Array.isArray(suggestions)).toBe(true);
		expect(suggestions).toEqual(expect.arrayContaining([{ name: "Electric Strike", predefinedType: "NOTDEFINED" }]));
	});

	test("a class with no suggestions returns undefined", () => {
		expect(doc.getClassSuggestions("IFC4", "IfcThisClassHasNoSuggestions")).toBeUndefined();
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.doc getSchemaByName / getInverseAttributes (IFC4)", () => {
	test("getSchemaByName returns a real schema_definition", () => {
		const schema = doc.getSchemaByName("IFC4");
		expect(schema.name()).toBe("IFC4");
		// `util/schema.ts`'s own `getSchemaDefinition` caches the underlying `IfcFile`
		// per schema (confirmed by `schema.test.ts`), so this doesn't reopen/reparse the
		// IFC4 template file on a second call -- but `schema_definition.schema()` itself
		// still hands back a fresh JS wrapper object per call around that same
		// underlying native handle, so a second call is only guaranteed to be
		// *equivalent*, not reference-identical.
		expect(doc.getSchemaByName("IFC4").name()).toBe(schema.name());
	});

	test("getInverseAttributes(IfcElement) includes the well-known element-level inverse attributes", () => {
		const schema = doc.getSchemaByName("IFC4");
		const ifcElement = assertNotNull(schema.declaration_by_name_with_name("IfcElement").as_entity());
		const names = new Set(doc.getInverseAttributes(ifcElement).map((a) => a.name()));
		expect(names).toEqual(
			new Set([
				"FillsVoids",
				"ConnectedTo",
				"IsInterferedByElements",
				"InterferesElements",
				"HasProjections",
				"HasOpenings",
				"IsConnectionRealization",
				"ProvidesBoundaries",
				"ConnectedFrom",
				"HasCoverings",
			]),
		);
	});

	test("getInverseAttributes(IfcTypeObject) == ['Types'] (the occurrence-typing relationship, resolved through the IfcObjectTypeSelect select)", () => {
		const schema = doc.getSchemaByName("IFC4");
		const typeObject = assertNotNull(schema.declaration_by_name_with_name("IfcTypeObject").as_entity());
		const names = doc.getInverseAttributes(typeObject).map((a) => a.name());
		expect(names).toEqual(["Types"]);
	});

	test("getInverseAttributes(IfcObjectDefinition) includes the well-known decomposition/association inverses", () => {
		const schema = doc.getSchemaByName("IFC4");
		const objectDefinition = assertNotNull(schema.declaration_by_name_with_name("IfcObjectDefinition").as_entity());
		const names = new Set(doc.getInverseAttributes(objectDefinition).map((a) => a.name()));
		expect(names).toEqual(
			new Set([
				"HasAssignments",
				"Nests",
				"IsNestedBy",
				"HasContext",
				"IsDecomposedBy",
				"Decomposes",
				"HasAssociations",
			]),
		);
	});

	test("getInverseAttributes never includes an attribute belonging to an unrelated entity", () => {
		const schema = doc.getSchemaByName("IFC4");
		const ifcElement = assertNotNull(schema.declaration_by_name_with_name("IfcElement").as_entity());
		const names = new Set(doc.getInverseAttributes(ifcElement).map((a) => a.name()));
		// "Types" is IfcTypeObject's own inverse attribute (IfcElement is an occurrence,
		// never a type), and "Decomposes"/"IsDecomposedBy" belong at the
		// IfcObjectDefinition level, not re-declared on IfcElement's own inverse set.
		expect(names.has("Types")).toBe(false);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
	"util.doc getSchemaByName / getInverseAttributes (IFC2X3)",
	() => {
		test("getSchemaByName resolves IFC2X3's own registered schema name", () => {
			expect(doc.getSchemaByName("IFC2X3").name()).toBe("IFC2X3");
		});

		test("getInverseAttributes(IfcElement) reflects IFC2X3's own (pre-IFC4) inverse-attribute set", () => {
			const schema = doc.getSchemaByName("IFC2X3");
			const ifcElement = assertNotNull(schema.declaration_by_name_with_name("IfcElement").as_entity());
			const names = new Set(doc.getInverseAttributes(ifcElement).map((a) => a.name()));
			// IFC2X3 has no "IsInterferedByElements"/"InterferesElements" (added in IFC4) but
			// does have "HasStructuralMember"/"HasPorts" (later reshuffled in IFC4).
			expect(names).toEqual(
				new Set([
					"HasStructuralMember",
					"FillsVoids",
					"ConnectedTo",
					"HasCoverings",
					"HasProjections",
					"HasPorts",
					"HasOpenings",
					"IsConnectionRealization",
					"ProvidesBoundaries",
					"ConnectedFrom",
				]),
			);
		});

		test("recursive getEntityDoc merges inherited attribute docs using IFC2X3's own schema", () => {
			const recursive = doc.getEntityDoc("IFC2X3", "IfcWallStandardCase", true);
			expect(recursive?.attributes?.OwnerHistory).toBeDefined();
		});
	},
);

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"util.doc getSchemaByName / getInverseAttributes (IFC4X3)",
	() => {
		test("getSchemaByName resolves IFC4X3's registered core identifier (IFC4X3_ADD2)", () => {
			// `test/bootstrap.ts`'s own `SCHEMA_IDENTIFIERS.IFC4X3 = "IFC4X3_ADD2"` -- this
			// build's core registers IFC4X3 under that exact identifier.
			expect(doc.getSchemaByName("IFC4X3").name()).toBe("IFC4X3_ADD2");
		});

		test("getInverseAttributes(IfcElement) reflects IFC4X3's own inverse-attribute set", () => {
			const schema = doc.getSchemaByName("IFC4X3");
			const ifcElement = assertNotNull(schema.declaration_by_name_with_name("IfcElement").as_entity());
			const names = new Set(doc.getInverseAttributes(ifcElement).map((a) => a.name()));
			expect(names.has("HasSurfaceFeatures")).toBe(true);
			expect(names.has("HasOpenings")).toBe(true);
		});
	},
);
