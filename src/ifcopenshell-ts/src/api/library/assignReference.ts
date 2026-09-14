// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/assign_reference.py` (src/ifcopenshell-python, 84
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Associates a list of `products` with a library `reference`, reusing an existing
// `IfcRelAssociatesLibrary` if one already relates `reference` to *some* products, or
// creating a new one otherwise.
//
// --- `../document/assignDocument.ts`, not `../classification/addReference.ts`, is this
//     function's real structural sibling -- confirmed directly, not assumed ---
//
// `../document/assignDocument.ts`'s own header comment already calls this out ("NOTE:
// reuses the same shape as `library.assign_reference`") because real Python's own
// `assign_reference.py` carries the identical `# TODO: do we need to support non-ifcroot
// elements like we do in classification.add_reference?` comment as
// `assign_document.py` -- confirmed directly against the real Python source, not assumed
// from the task brief's own prediction. Every product, rooted or not, goes through a
// single `IfcRelAssociatesLibrary`/`RelatedObjects` list regardless of schema; there is
// no `IfcExternalReferenceRelationship` branch anywhere in this file. Ported verbatim,
// not "fixed" to add the non-rooted branch `classification` has.
//
// --- Simpler than `assignDocument`, not just a rename: no `is_a()` dispatch needed ---
//
// `document.assign_document`'s `document` parameter may be either an
// `IfcDocumentReference` OR (discouraged but permitted) an `IfcDocumentInformation`, so
// it dispatches on `document.is_a(...)` to pick the right IFC4+ inverse attribute name.
// `library.assign_reference`'s `reference` parameter, by contrast, is ALWAYS an
// `IfcLibraryReference` -- real Python reads `reference.LibraryRefForObjects`
// unconditionally on IFC4+, with no dispatch of any kind (confirmed directly: passing an
// `IfcLibraryInformation` here would raise `AttributeError` in real Python, since that
// class's own inverse is separately named `LibraryInfoForObjects` -- see
// `util/element.ts`'s `REFERENCE_TYPES` table). Ported the same way: a single,
// unconditional `.get("LibraryRefForObjects")` read on IFC4+, not a dispatch.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Python's `set()`/dedup-by-identity idiom -- see `../classification/addReference.ts`'s identical, independently re-declared local helper for the full rationale. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
	}

	get size(): number {
		return this.byIdentity.size;
	}

	toArray(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

/** Python's `set(a) - b`, by identity. */
function differenceByIdentity(a: Iterable<EntityInstance>, b: Set<EntityInstance>): EntityInstance[] {
	const bIds = new Set([...b].map((i) => i.identity()));
	const result = new EntityInstanceSet();
	for (const item of a) {
		if (!bIds.has(item.identity())) result.add(item);
	}
	return result.toArray();
}

export interface AssignReferenceSettings {
	/** The list of `IfcProduct`s you want to associate with the reference. */
	products: readonly EntityInstance[];
	/** The `IfcLibraryReference` you want the products to be associated with. */
	reference: EntityInstance;
}

function assignReferenceUsecase(file: IfcFile, settings: AssignReferenceSettings): EntityInstance | undefined {
	const { reference } = settings;

	const referencedElements = elementUtil.getReferencedElements(reference);
	const productsSet = differenceByIdentity(settings.products, referencedElements);

	if (productsSet.length === 0) return undefined;

	let rel: EntityInstance | null;
	if (file.schema === "IFC2X3") {
		rel =
			file
				.byType("IfcRelAssociatesLibrary")
				.find((r) => (r.get("RelatingLibrary") as EntityInstance | null)?.equals(reference)) ?? null;
	} else {
		rel = (reference.get("LibraryRefForObjects") as EntityInstance[])[0] ?? null;
	}

	if (!rel) {
		// IfcRelAssociatesLibrary: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
		// RelatedObjects(4), RelatingLibrary(5) -- identical across all 3 schemas (confirmed
		// against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`; only `OwnerHistory`'s
		// nullability and `RelatedObjects`'s element type differ by schema, not the
		// positions themselves). No DERIVE-attribute-interleaving gotcha (verified
		// directly): `IfcRelAssociatesLibrary` declares no DERIVE attributes in any of the
		// 3 schemas.
		return file.createEntity(
			"IfcRelAssociatesLibrary",
			guid.new(),
			createOwnerHistory(file, {}),
			null,
			null,
			productsSet,
			reference,
		);
	}

	const relatedObjects = new EntityInstanceSet();
	relatedObjects.update(rel.get("RelatedObjects") as EntityInstance[]);
	relatedObjects.update(productsSet);
	rel.set("RelatedObjects", relatedObjects.toArray());
	updateOwnerHistory(file, { element: rel });
	return rel;
}

/**
 * Associates a list of products with a library reference (Python:
 * `ifcopenshell.api.library.assign_reference`).
 *
 * A product may be associated with zero, one, or many references across multiple
 * libraries. See {@link import("./addReference").addReference} for more detail about how
 * references work.
 *
 * @returns The `IfcRelAssociatesLibrary` relationship, or `undefined` if `products` was
 *   empty or all products were already assigned to `reference`.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 * const reference = api.library.addReference(model, { library });
 * api.library.editReference(model, {
 *   reference,
 *   attributes: { Identification: "http://example.org/digitaltwin#AHU01" },
 * });
 *
 * // Let's assume we have an AHU in our model.
 * const ahu = api.root.createEntity(model, { ifcClass: "IfcUnitaryEquipment", predefinedType: "AIRHANDLER" });
 *
 * // And now assign the IFC model's AHU with its Brickschema counterpart
 * api.library.assignReference(model, { reference, products: [ahu] });
 * ```
 */
export const assignReference = wrapUsecase("library.assign_reference", assignReferenceUsecase);
