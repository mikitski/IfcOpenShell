// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_classification.py` (src/ifcopenshell-python) --
// covers `getReferences`/`getClassification`/`getInheritedReferences` (all three real
// Python test classes: `TestGetReferences`, `TestGetClassification`,
// `TestGetInheritedReferences`). `getClassificationData` has no Python test counterpart
// (confirmed: `test_classification.py` has no `TestGetClassificationData` class at
// all) -- the coverage for it below is original, written directly against
// `classification.py`'s own source/`classification.ts`'s port, matching
// `util/element.ts`'s established precedent for functions Python itself doesn't
// directly test.
//
// Python's own fixtures go through `ifcopenshell.api.root.create_entity`/
// `ifcopenshell.api.classification.add_classification`/`add_reference`/
// `ifcopenshell.api.type.assign_type`, none of which exist yet in this TS port (`api`
// is Phase 6+). This file's local fixture helpers build the same underlying entity
// graphs directly (`file.createEntity(...)` + `.set(...)`), matching
// `test/util/element.test.ts`/`test/util/selector.test.ts`'s own established pattern
// for this exact same gap. `assignExternalReference` (`IfcExternalReferenceRelationship`,
// `RelatingReference`/`RelatedResourceObjects`) has no precedent in either of those
// files -- its inverse attribute name on the "resource" side was confirmed empirically
// against the real built addon (`IfcMaterial.all_inverse_attributes()` ->
// `HasExternalReferences`, matching `classification.py`'s own plural-then-singular
// `getattr` fallback exactly), not assumed from the Python source's naming alone.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/classification";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header
// comment) ---

function assignClassification(file: IfcFile, elements: EntityInstance[], reference: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesClassification");
	rel.set("RelatedObjects", elements);
	rel.set("RelatingClassification", reference);
	return rel;
}

function assignExternalReference(
	file: IfcFile,
	resourceObjects: EntityInstance[],
	reference: EntityInstance,
): EntityInstance {
	const rel = file.createEntity("IfcExternalReferenceRelationship");
	rel.set("RelatingReference", reference);
	rel.set("RelatedResourceObjects", resourceObjects);
	return rel;
}

function assignType(file: IfcFile, element: EntityInstance, elementType: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelDefinesByType");
	rel.set("RelatedObjects", [element]);
	rel.set("RelatingType", elementType);
	return rel;
}

function ids(instances: Iterable<EntityInstance>): number[] {
	return [...instances].map((i) => i.id()).sort((a, b) => a - b);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.classification getReferences", () => {
	test("gets occurrence classification references of a rooted element", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference1 = file.createEntity("IfcClassificationReference");
		reference1.set("Identification", "1");
		reference1.set("ReferencedSource", classification);
		const reference2 = file.createEntity("IfcClassificationReference");
		reference2.set("Identification", "2");
		reference2.set("ReferencedSource", classification);
		const element = file.createEntity("IfcWall");
		assignClassification(file, [element], reference1);
		assignClassification(file, [element], reference2);

		expect(ids(subject.getReferences(element))).toEqual(ids(file.byType("IfcClassificationReference")));
	});

	test("gets references of a non-rooted element via HasExternalReferences", () => {
		const file = createTestFile("IFC4");
		const material = file.createEntity("IfcMaterial");
		material.set("Name", "Mat1");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("Identification", "X");
		reference.set("Name", "Foobar");
		reference.set("ReferencedSource", classification);
		assignExternalReference(file, [material], reference);

		expect(ids(subject.getReferences(material))).toEqual(ids(file.byType("IfcClassificationReference")));
	});

	test("an occurrence's own classification overrides an inherited type-level one under the same system", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference1 = file.createEntity("IfcClassificationReference");
		reference1.set("Identification", "1");
		reference1.set("ReferencedSource", classification);
		const reference2 = file.createEntity("IfcClassificationReference");
		reference2.set("Identification", "2");
		reference2.set("ReferencedSource", classification);
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		assignClassification(file, [element], reference1);
		assignClassification(file, [elementType], reference2);

		expect(ids(subject.getReferences(elementType))).toEqual([reference2.id()]);
		expect(ids(subject.getReferences(element))).toEqual([reference1.id()]);
	});

	test("shouldInherit=false returns only the element's own direct classification", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference1 = file.createEntity("IfcClassificationReference");
		reference1.set("Identification", "1");
		reference1.set("ReferencedSource", classification);
		const reference2 = file.createEntity("IfcClassificationReference");
		reference2.set("Identification", "2");
		reference2.set("ReferencedSource", classification);
		const element = file.createEntity("IfcWall");
		const elementType = file.createEntity("IfcWallType");
		assignType(file, element, elementType);
		assignClassification(file, [element], reference1);
		assignClassification(file, [elementType], reference2);

		const results = [...subject.getReferences(element, false)];
		expect(results).toHaveLength(1);
		expect(results[0].get("Identification")).toBe("1");
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.classification getClassification", () => {
	test("a reference directly under an IfcClassification returns that classification", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("ReferencedSource", classification);

		expect(subject.getClassification(reference)?.equals(classification)).toBe(true);
	});

	test("walks a multi-level ReferencedSource chain up to the owning IfcClassification", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference1 = file.createEntity("IfcClassificationReference");
		reference1.set("ReferencedSource", classification);
		const reference2 = file.createEntity("IfcClassificationReference");
		reference2.set("ReferencedSource", reference1);

		expect(subject.getClassification(reference2)?.equals(classification)).toBe(true);
	});

	test("returns null when ReferencedSource is unset", () => {
		const file = createTestFile("IFC4");
		const reference = file.createEntity("IfcClassificationReference");
		expect(subject.getClassification(reference)).toBeNull();
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.classification getInheritedReferences", () => {
	test("a single-level reference returns just itself", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("ReferencedSource", classification);

		const results = subject.getInheritedReferences(reference);
		expect(results).toHaveLength(1);
		expect(results[0].equals(reference)).toBe(true);
	});

	test("a multi-level chain returns every reference, nearest first, excluding the IfcClassification", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Name");
		const reference1 = file.createEntity("IfcClassificationReference");
		reference1.set("ReferencedSource", classification);
		const reference2 = file.createEntity("IfcClassificationReference");
		reference2.set("ReferencedSource", reference1);

		const results = subject.getInheritedReferences(reference2);
		expect(results).toHaveLength(2);
		expect(results[0].equals(reference2)).toBe(true);
		expect(results[1].equals(reference1)).toBe(true);
	});

	test("null reference returns an empty list", () => {
		expect(subject.getInheritedReferences(null)).toEqual([]);
	});
});

// --- getClassificationData -- original coverage, no Python test counterpart (see this
// file's header comment) ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.classification getClassificationData", () => {
	test("a null/falsy file returns ([], '')", () => {
		expect(subject.getClassificationData(null)).toEqual([[], ""]);
	});

	test("a file with no IfcClassification returns ([], '')", () => {
		const file = createTestFile("IFC4");
		file.createEntity("IfcWall");
		expect(subject.getClassificationData(file)).toEqual([[], ""]);
	});

	test("builds a nested tree of the first classification's HasReferences graph, plus its Name", () => {
		const file = createTestFile("IFC4");
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Uniclass");
		const reference1 = file.createEntity("IfcClassificationReference");
		reference1.set("Identification", "1");
		reference1.set("ReferencedSource", classification);
		const reference2 = file.createEntity("IfcClassificationReference");
		reference2.set("Identification", "1.1");
		reference2.set("ReferencedSource", reference1);

		const [data, name] = subject.getClassificationData(file);
		expect(name).toBe("Uniclass");
		expect(data).toHaveLength(1);
		const top = data[0];
		expect(top.Identification).toBe("1");
		expect(top.referenced_source).toBe(classification.id());
		expect(top.has_references).toBe(true);
		expect(Object.prototype.hasOwnProperty.call(top, "ReferencedSource")).toBe(false);
		const nested = top.references as Record<string, unknown>[];
		expect(nested).toHaveLength(1);
		expect(nested[0].Identification).toBe("1.1");
		expect(nested[0].referenced_source).toBe(reference1.id());
		expect(nested[0].has_references).toBe(false);
		expect(nested[0].references).toEqual([]);
	});
});
