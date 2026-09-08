// This file was generated with the assistance of an AI coding tool.
//
// The differential test `planning/ifcopenshell-ts/40-testing-strategy.md` SS5.5
// explicitly requires as this chunk's own exit criterion, quoted there in full:
//
//   "Required: a differential test that, for every entity class in all three schema
//   versions, asserts the cached attribute-category/index lookup agrees with a
//   direct, uncached primitive call. This guards against the optimization silently
//   diverging from ground truth -- a bug class that would otherwise surface only as
//   downstream `wall.Name`-returns-garbage symptoms, not as a cache-layer test
//   failure."
//
// "Every entity class" includes abstract ones (`ABSTRACT SUPERTYPE`, never directly
// instantiable) -- `tools/schemaIntrospection.ts`'s `buildRepresentatives` resolves
// each to a concrete representative instance (itself if concrete, else a concrete
// descendant found via `isA`); see that module's header comment for why this is
// correct, not just convenient.

import { describe, expect, test } from "vitest";
import { AttributeCategory, getClassAttributeMeta } from "../src/attributeCache";
import {
	declaration as NativeDeclaration,
	entity_instance as NativeEntityInstance,
} from "../src/native/ifcopenshell_native";
import { buildEntityCatalog, buildRepresentatives } from "../tools/schemaIntrospection";
import { AVAILABLE_SCHEMAS, createTestFile } from "./bootstrap";

describe.each(AVAILABLE_SCHEMAS)("Attribute-metadata cache differential correctness (%s)", (schema) => {
	test("cached category/index/inverse-metadata agrees with a direct, uncached primitive call, for every entity class", () => {
		const file = createTestFile(schema);
		const catalog = buildEntityCatalog(file);
		const { representatives, unresolved } = buildRepresentatives(file, catalog);
		const schemaIdentifier = file.schemaIdentifier;

		// Every abstract entity class in a real IFC schema has at least one concrete
		// descendant -- an unresolved class would mean the representative-finding
		// strategy itself is broken, not a cache bug, so fail loudly and specifically
		// rather than silently skipping those classes below.
		expect(unresolved, "entity classes with no reachable concrete representative").toEqual([]);

		let checkedClasses = 0;
		let checkedAttributes = 0;

		for (const entry of catalog.entries) {
			const representative = representatives.get(entry.name);
			if (!representative) continue; // already asserted empty above; keeps this loop total below honest if it's ever not
			checkedClasses++;

			const nativeRepresentative = new NativeEntityInstance(representative._handle);
			const cache = getClassAttributeMeta(schemaIdentifier, entry.name, entry.entity, nativeRepresentative);
			const groundTruthInverses = entry.entity.all_inverse_attributes();

			for (const meta of cache.list) {
				checkedAttributes++;
				const uncachedCategory = nativeRepresentative.get_attribute_category(meta.name);
				expect(uncachedCategory, `${entry.name}.${meta.name} category`).toBe(meta.category);

				if (meta.category === AttributeCategory.FORWARD) {
					const uncachedIndex = nativeRepresentative.get_argument_index(meta.name);
					expect(uncachedIndex, `${entry.name}.${meta.name} index`).toBe(meta.index);
				} else {
					const groundTruthInverse = groundTruthInverses.find((i) => i.name() === meta.name);
					expect(groundTruthInverse, `${entry.name}.${meta.name} ground-truth inverse declaration`).toBeDefined();
					const groundTruthEntityReference = groundTruthInverse?.entity_reference();
					const groundTruthAttributeReference = groundTruthInverse?.attribute_reference();
					expect(meta.attributeReferenceName, `${entry.name}.${meta.name} attributeReferenceName`).toBe(
						groundTruthAttributeReference?.name(),
					);
					expect(meta.bound1, `${entry.name}.${meta.name} bound1`).toBe(groundTruthInverse?.bound1());
					expect(meta.bound2, `${entry.name}.${meta.name} bound2`).toBe(groundTruthInverse?.bound2());
					// `entityReferenceHandle`/`referenceAttributeIndex` are the fields
					// `getInverseAttribute`'s `file.get_inverse(...)` call actually depends
					// on for correctness (the /code-review-found bug fix) -- verified here
					// by applying the *same* entity->declaration reinterpretation
					// independently to the ground-truth `entity_reference()` and comparing
					// names, rather than trusting the cached handle blindly.
					const groundTruthReferenceIndex = groundTruthEntityReference
						?.all_attributes()
						.findIndex((attribute) => attribute.name() === groundTruthAttributeReference?.name());
					expect(meta.referenceAttributeIndex, `${entry.name}.${meta.name} referenceAttributeIndex`).toBe(
						groundTruthReferenceIndex,
					);
					const cachedReferenceName = new NativeDeclaration(meta.entityReferenceHandle).name();
					const groundTruthReferenceName = new NativeDeclaration(groundTruthEntityReference?._handle).name();
					expect(cachedReferenceName, `${entry.name}.${meta.name} entityReferenceHandle -> name`).toBe(
						groundTruthReferenceName,
					);
				}
			}

			// Completeness in the other direction: every name the *uncached* primitive
			// reports as FORWARD (excluding DERIVED slots, which `all_attributes()`
			// also lists but the cache deliberately excludes -- see attributeCache.ts's
			// header comment) or INVERSE is present in the cache, nothing more, nothing
			// less, in the same order.
			const expectedForwardNames = entry.entity
				.all_attributes()
				.map((attribute) => attribute.name())
				.filter((name) => nativeRepresentative.get_attribute_category(name) === AttributeCategory.FORWARD);
			const expectedInverseNames = groundTruthInverses.map((inverse) => inverse.name());
			const cachedForwardNames = cache.list
				.filter((meta) => meta.category === AttributeCategory.FORWARD)
				.map((meta) => meta.name);
			const cachedInverseNames = cache.list
				.filter((meta) => meta.category === AttributeCategory.INVERSE)
				.map((meta) => meta.name);
			expect(cachedForwardNames, `${entry.name} forward attribute names`).toEqual(expectedForwardNames);
			expect(cachedInverseNames, `${entry.name} inverse attribute names`).toEqual(expectedInverseNames);
		}

		expect(checkedClasses).toBeGreaterThan(0);
		expect(checkedAttributes).toBeGreaterThan(0);

		file.dispose();
	});
});
