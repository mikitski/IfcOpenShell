// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-3 chunk 2 (planning/ifcopenshell-ts/70-express-rules-plan.md): hand-rolled
// coverage for `src/validate.ts`'s core type-checking engine (`ValidationError`,
// `formatValue`, `assertValid`, `assertValidInverse`, `getSelectMembers`,
// `getEntityAttributes`). Real `validate.py` has no dedicated test exercising these
// functions in isolation -- they're only exercised indirectly through `test_validate.py`'s
// own full `validate()` fixture suite, which lands in a later chunk once `validate()`
// itself is wired up (this chunk deliberately does not wire anything into an
// orchestrator yet). Original, hand-rolled coverage instead, matching this project's
// established convention for such cases (`runtimeShim.ts`'s own 85 hand-rolled tests,
// `test/native/header.test.ts`'s own Phase EX-3 chunk 1 precedent).
//
// Every concrete attribute/select/enum/inverse fixture referenced below was verified
// directly against the real, built IFC4 schema (via a throwaway exploration script
// against the actual native addon, not assumed) before being hardcoded here, so this
// suite is pinned to real EXPRESS schema facts, not guesses:
// - `IfcRelAssociatesMaterial.RelatingMaterial` : `IfcMaterialSelect` (a pure-entity
//   select: `IfcMaterialDefinition` (abstract) | `IfcMaterialList` | `IfcMaterial
//   UsageDefinition` (abstract), 15 total flattened members including entity subtypes).
// - `IfcRelAggregates.RelatingObject` : `IfcObjectDefinition` (entity branch),
//   `.Name` : `IfcLabel` (type_declaration -> simple_type "string" branch),
//   `.RelatedObjects` : `SET [1:?] OF IfcObjectDefinition` (aggregation branch).
// - `IfcWall.PredefinedType` : an enumeration type (real values include `NOTDEFINED`).
// - `IfcMaterialLayer.ToMaterialLayerSet` : a single-valued (`bound1=bound2=-1`)
//   inverse to `IfcMaterialLayerSet.MaterialLayers`.
// - `IfcObjectDefinition.Decomposes` : an aggregate-bounded (`bound1=0, bound2=1`)
//   inverse to `IfcRelAggregates.RelatedObjects`.

import { describe, expect, test } from "vitest";
import * as subject from "../src/validate";
import { AVAILABLE_SCHEMAS, createTestFile } from "./bootstrap";

/**
 * `.find(...)`/`.as_entity()`/`.as_select_type()` return `T | undefined`/`T | null` --
 * this asserts non-null/defined (failing the test with a clear message if it ever
 * isn't) and narrows the type, matching `test/util/doc.test.ts`'s own `assertNotNull`
 * convention for the same "assert-then-narrow" situation (biome's `noNonNullAssertion`
 * forbids the bare `!` operator this file would otherwise need repeatedly).
 */
function assertNotNull<T>(value: T | null | undefined): T {
	expect(value).not.toBeNull();
	expect(value).not.toBeUndefined();
	return value as NonNullable<T>;
}

describe("validate.ts ValidationError", () => {
	test("is a real Error subclass carrying an optional attribute name", () => {
		const withAttr = new subject.ValidationError("boom", "MyAttr");
		expect(withAttr).toBeInstanceOf(Error);
		expect(withAttr.name).toBe("ValidationError");
		expect(withAttr.message).toBe("boom");
		expect(withAttr.attribute).toBe("MyAttr");

		const withoutAttr = new subject.ValidationError("boom2");
		expect(withoutAttr.attribute).toBeUndefined();
	});
});

describe("validate.ts formatValue", () => {
	test("plain scalar values get a Python-repr-alike rendering", () => {
		expect(subject.formatValue(null)).toBe("None");
		expect(subject.formatValue(undefined)).toBe("None");
		expect(subject.formatValue(true)).toBe("True");
		expect(subject.formatValue(false)).toBe("False");
		expect(subject.formatValue(42)).toBe("42");
		expect(subject.formatValue("x")).toBe("'x'");
	});

	test("an empty array (Python's `()`  falsy-tuple case) reprs as '()'", () => {
		expect(subject.formatValue([])).toBe("()");
	});

	test("a non-empty array of entity_instance gets Python's own numbered-list rendering", () => {
		const file = createTestFile("IFC4");
		const layer = file.createEntity("IfcMaterialLayer");
		const rendered = subject.formatValue([layer]);
		expect(rendered).toBe(`[\n      1. ${layer.toString()}\n    ]`);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("validate.ts assertValid", () => {
	test("entity-type branch: accepts a matching subtype, rejects a non-entity value", () => {
		const file = createTestFile("IFC4");
		const relAgg = file.createEntity("IfcRelAggregates");
		const wall = file.createEntity("IfcWall");
		const relatingObjectAttr = assertNotNull(
			relAgg
				.declaration()
				.as_entity()
				?.all_attributes()
				.find((a) => a.name() === "RelatingObject"),
		);
		const attrType = relatingObjectAttr.type_of_attribute();

		// IfcWall is-a IfcObjectDefinition -- valid.
		expect(subject.assertValid(attrType, wall, file.nativeFile.schema(), true)).toBe(true);
		// A plain string is never a valid entity-typed value.
		expect(subject.assertValid(attrType, "not an entity", file.nativeFile.schema(), true)).toBe(false);
		expect(() =>
			subject.assertValid(attrType, "not an entity", file.nativeFile.schema(), false, relatingObjectAttr),
		).toThrow(subject.ValidationError);
	});

	test("type_declaration branch (val IS an entity_instance): always invalid, matching real Python's own short-circuit", () => {
		const file = createTestFile("IFC4");
		const relAgg = file.createEntity("IfcRelAggregates");
		const wall = file.createEntity("IfcWall");
		const nameAttr = assertNotNull(
			relAgg
				.declaration()
				.as_entity()
				?.all_attributes()
				.find((a) => a.name() === "Name"),
		);
		const attrType = nameAttr.type_of_attribute();

		// `.Name` is declared IfcLabel (a type_declaration wrapping a raw "string"
		// simple_type); passing an entity_instance for it can never be valid.
		expect(subject.assertValid(attrType, wall, file.nativeFile.schema(), true)).toBe(false);
	});

	test("simple-type branch: a real string value is valid; a disclosed permissive gap accepts other scalars too", () => {
		const file = createTestFile("IFC4");
		const relAgg = file.createEntity("IfcRelAggregates");
		const nameAttr = assertNotNull(
			relAgg
				.declaration()
				.as_entity()
				?.all_attributes()
				.find((a) => a.name() === "Name"),
		);
		const attrType = nameAttr.type_of_attribute();
		const schema = file.nativeFile.schema();

		expect(subject.assertValid(attrType, "Aggregate 1", schema, true)).toBe(true);

		// Disclosed gap (`src/validate.ts`'s own header comment, finding 2):
		// `simple_type.declared_type()` has no N-API binding, so this port cannot
		// distinguish "string" from the other 6 EXPRESS primitive kinds here -- a
		// number or boolean is (permissively, incorrectly-lenient by design) also
		// accepted for a STRING-declared attribute, unlike real Python which would
		// correctly reject it (`type(42) != str`). Pinned here as a known, disclosed
		// divergence, not an oversight.
		expect(subject.assertValid(attrType, 42, schema, true)).toBe(true);
		expect(subject.assertValid(attrType, true, schema, true)).toBe(true);

		// Structurally wrong shapes (entity/array/null) are still correctly rejected.
		const wall = file.createEntity("IfcWall");
		expect(subject.assertValid(attrType, wall, schema, true)).toBe(false);
		expect(subject.assertValid(attrType, [1, 2], schema, true)).toBe(false);
		expect(subject.assertValid(attrType, null, schema, true)).toBe(false);
	});

	test("select-type branch: accepts every real leaf of IfcMaterialSelect, rejects an unrelated entity", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const relAssoc = file.createEntity("IfcRelAssociatesMaterial");
		const relatingMaterialAttr = assertNotNull(
			relAssoc
				.declaration()
				.as_entity()
				?.all_attributes()
				.find((a) => a.name() === "RelatingMaterial"),
		);
		const attrType = relatingMaterialAttr.type_of_attribute();

		const materialList = file.createEntity("IfcMaterialList");
		expect(subject.assertValid(attrType, materialList, schema, true)).toBe(true);

		const material = file.createEntity("IfcMaterial");
		expect(subject.assertValid(attrType, material, schema, true)).toBe(true);

		const wall = file.createEntity("IfcWall");
		expect(subject.assertValid(attrType, wall, schema, true)).toBe(false);
		expect(() => subject.assertValid(attrType, wall, schema, false, relatingMaterialAttr)).toThrow(
			subject.ValidationError,
		);
		try {
			subject.assertValid(attrType, wall, schema, false, relatingMaterialAttr);
			expect.unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(subject.ValidationError);
			expect((e as subject.ValidationError).attribute).toBe("RelatingMaterial");
		}
	});

	test("enumeration branch: accepts a real enum item, rejects an unknown string", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const wall = file.createEntity("IfcWall");
		const predefinedTypeAttr = assertNotNull(
			wall
				.declaration()
				.as_entity()
				?.all_attributes()
				.find((a) => a.name() === "PredefinedType"),
		);
		const attrType = predefinedTypeAttr.type_of_attribute();

		expect(subject.assertValid(attrType, "NOTDEFINED", schema, true)).toBe(true);
		expect(subject.assertValid(attrType, "NOT_A_REAL_ENUM_VALUE", schema, true)).toBe(false);
		// Non-string values can never be enum members.
		expect(subject.assertValid(attrType, 5, schema, true)).toBe(false);
	});

	test("aggregation branch: enforces bound1/bound2 and validates every element", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const relAgg = file.createEntity("IfcRelAggregates");
		const relatedObjectsAttr = assertNotNull(
			relAgg
				.declaration()
				.as_entity()
				?.all_attributes()
				.find((a) => a.name() === "RelatedObjects"),
		);
		// `RelatedObjects` is declared `SET [1:?] OF IfcObjectDefinition`.
		const attrType = relatedObjectsAttr.type_of_attribute();

		const wall = file.createEntity("IfcWall");
		expect(subject.assertValid(attrType, [wall], schema, true)).toBe(true);
		// bound1 = 1: an empty array violates the lower bound.
		expect(subject.assertValid(attrType, [], schema, true)).toBe(false);
		// Not an array at all.
		expect(subject.assertValid(attrType, "not an array", schema, true)).toBe(false);

		// Faithfully-preserved Python quirk (`src/validate.ts`'s own header comment,
		// finding 6): the per-element recursive `assertValid` call never forwards
		// `noThrow`, so a single invalid element always throws -- even though this
		// outer call itself passed `noThrow = true` and would otherwise be expected to
		// return `false` instead of throwing.
		expect(() => subject.assertValid(attrType, [wall, "not an entity"], schema, true)).toThrow(subject.ValidationError);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("validate.ts assertValidInverse", () => {
	function toMaterialLayerSetInverse(file: ReturnType<typeof createTestFile>) {
		const layerDecl = file.nativeFile.schema().declaration_by_name_with_name("IfcMaterialLayer").as_entity();
		return assertNotNull(layerDecl?.all_inverse_attributes().find((a) => a.name() === "ToMaterialLayerSet"));
	}

	test("single-valued inverse (bound1=bound2=-1): exactly one related instance is valid", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const inverse = toMaterialLayerSetInverse(file);
		const layerSet = file.createEntity("IfcMaterialLayerSet");

		expect(subject.assertValidInverse(inverse, [layerSet], schema)).toBe(true);
	});

	test("single-valued inverse: zero or two related instances are both invalid", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const inverse = toMaterialLayerSetInverse(file);
		const layerSet = file.createEntity("IfcMaterialLayerSet");

		expect(() => subject.assertValidInverse(inverse, [], schema)).toThrow(subject.ValidationError);
		expect(() => subject.assertValidInverse(inverse, [layerSet, layerSet], schema)).toThrow(subject.ValidationError);
	});

	test("single-valued inverse violation message has no AGGREGATE prefix (disclosed placeholder only applies to real aggregations)", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const inverse = toMaterialLayerSetInverse(file);
		try {
			subject.assertValidInverse(inverse, [], schema);
			expect.unreachable();
		} catch (e) {
			const message = (e as subject.ValidationError).message;
			expect(message).toContain("ToMaterialLayerSet : IfcMaterialLayerSet FOR MaterialLayers");
			expect(message).not.toContain("AGGREGATE");
			expect((e as subject.ValidationError).attribute).toBe("ToMaterialLayerSet");
		}
	});

	test("aggregate-bounded inverse (bound1=0, bound2=1): 0 or 1 related instances are valid, 2 is not", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const objDefDecl = schema.declaration_by_name_with_name("IfcObjectDefinition").as_entity();
		const decomposes = assertNotNull(objDefDecl?.all_inverse_attributes().find((a) => a.name() === "Decomposes"));
		const relAgg1 = file.createEntity("IfcRelAggregates");
		const relAgg2 = file.createEntity("IfcRelAggregates");

		expect(subject.assertValidInverse(decomposes, [], schema)).toBe(true);
		expect(subject.assertValidInverse(decomposes, [relAgg1], schema)).toBe(true);
		expect(() => subject.assertValidInverse(decomposes, [relAgg1, relAgg2], schema)).toThrow(subject.ValidationError);
	});

	test("aggregate-bounded inverse violation message uses the disclosed generic AGGREGATE placeholder keyword", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const objDefDecl = schema.declaration_by_name_with_name("IfcObjectDefinition").as_entity();
		const decomposes = assertNotNull(objDefDecl?.all_inverse_attributes().find((a) => a.name() === "Decomposes"));
		const relAgg1 = file.createEntity("IfcRelAggregates");
		const relAgg2 = file.createEntity("IfcRelAggregates");
		try {
			subject.assertValidInverse(decomposes, [relAgg1, relAgg2], schema);
			expect.unreachable();
		} catch (e) {
			const message = (e as subject.ValidationError).message;
			// See src/validate.ts's own header comment, finding 3:
			// `type_of_aggregation_string()` has no binding, so the real "SET"/"LIST"/
			// "BAG" keyword is replaced by a generic "AGGREGATE" placeholder.
			expect(message).toContain("Decomposes : AGGREGATE [0:1] OF IfcRelAggregates FOR RelatedObjects");
		}
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("validate.ts getSelectMembers", () => {
	function materialSelect(file: ReturnType<typeof createTestFile>) {
		return assertNotNull(file.nativeFile.schema().declaration_by_name_with_name("IfcMaterialSelect").as_select_type());
	}

	test("flattens a pure-entity select into every leaf, including abstract members and entity subtypes", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const members = subject.getSelectMembers(schema, materialSelect(file));

		// Direct, concrete leaf.
		expect(members.has("IfcMaterialList")).toBe(true);
		// Direct, ABSTRACT leaf -- still included (real Python's own entity branch
		// always yields the entity's own name before recursing into subtypes,
		// unconditionally, unlike `getSubtypes`'s own different abstract-skipping rule).
		expect(members.has("IfcMaterialDefinition")).toBe(true);
		expect(members.has("IfcMaterialUsageDefinition")).toBe(true);
		// A real subtype of the abstract IfcMaterialDefinition leaf, reached only via
		// the entity-subtype-walk recursion (`util/schema.ts`'s `directSubtypesOf`).
		expect(members.has("IfcMaterial")).toBe(true);
		expect(members.has("IfcMaterialLayerSetUsage")).toBe(true);
		// Not a member of this select at all.
		expect(members.has("IfcWall")).toBe(false);
	});

	test("flattens nested selects and type declarations (IfcValue -> IfcSimpleValue/IfcMeasureValue/... -> leaf type_declarations)", () => {
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const sel = assertNotNull(schema.declaration_by_name_with_name("IfcValue").as_select_type());
		const members = subject.getSelectMembers(schema, sel);

		expect(members.has("IfcLabel")).toBe(true);
		expect(members.has("IfcLengthMeasure")).toBe(true);
		expect(members.has("IfcVolumeMeasure")).toBe(true);
		// The intermediate select types themselves are never members of the flattened
		// result -- only their own recursively-flattened leaves are.
		expect(members.has("IfcSimpleValue")).toBe(false);
		expect(members.has("IfcMeasureValue")).toBe(false);
	});

	test("is cached: repeated calls for the same (schema, select type) return the identical Set object", () => {
		subject._clearSelectMembersCacheForTests();
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();
		const sel = materialSelect(file);

		const first = subject.getSelectMembers(schema, sel);
		const second = subject.getSelectMembers(schema, sel);
		expect(first).toBe(second);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("validate.ts getEntityAttributes", () => {
	test("returns the entity declaration and its full forward-attribute list", () => {
		subject._clearEntityAttributeMapForTests();
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();

		const [entity, attributes] = subject.getEntityAttributes(schema, "IfcWall");
		expect(entity.is_abstract()).toBe(false);
		expect(attributes.map((a) => a.name())).toEqual(
			expect.arrayContaining(["GlobalId", "OwnerHistory", "Name", "PredefinedType"]),
		);
	});

	test("is cached: repeated calls for the same (schema, entity name) return the identical tuple", () => {
		subject._clearEntityAttributeMapForTests();
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();

		const first = subject.getEntityAttributes(schema, "IfcWall");
		const second = subject.getEntityAttributes(schema, "IfcWall");
		expect(first).toBe(second);
	});

	test("throws a clear error for a non-entity or unknown declaration name", () => {
		subject._clearEntityAttributeMapForTests();
		const file = createTestFile("IFC4");
		const schema = file.nativeFile.schema();

		// IfcLabel is a real declaration but not an entity.
		expect(() => subject.getEntityAttributes(schema, "IfcLabel")).toThrow(/not an entity declaration/);
	});
});
