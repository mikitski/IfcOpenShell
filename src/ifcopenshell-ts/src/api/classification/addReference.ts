// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/classification/add_reference.py` (src/ifcopenshell-python,
// 259 lines) -- the largest and most involved file in this chunk (see `index.ts`'s own
// header comment for the module's overall scope). Adds a new `IfcClassificationReference`
// (a single entry within a classification system, e.g. `"Pr_12_23_34"`) and assigns it
// to a list of products/resources, via `IfcRelAssociatesClassification` for `IfcRoot`
// products and `IfcExternalReferenceRelationship` for non-rooted "resource" objects
// (materials, cost values, profiles, etc. -- only reachable on IFC4+, since IFC2X3 has
// no such relationship at all and this function raises `TypeError` for a non-`IfcRoot`
// product there).
//
// --- `IfcClassificationReference`'s attribute order, verified not assumed ---
//
// `Location`(0)/`Identification`|`ItemReference`(1)/`Name`(2)/`ReferencedSource`(3) are
// identical and contiguous across all 3 schemas -- `IFC4`/`IFC4X3` additionally append
// `Description`(4)/`Sort`(5), never touched here. No DERIVE-attribute-interleaving
// gotcha (verified directly): no DERIVE attributes on this class in any of the 3
// schemas.
//
// --- Real IFC2X3-vs-IFC4+ schema difference, investigated not assumed ---
//
// IFC2X3's `IfcClassificationReference` has no `Identification` attribute at all --
// its equivalent field is named `ItemReference` (confirmed directly against
// `ifc2x3.d.ts` vs. `ifc4.d.ts`/`ifc4x3.d.ts`). Every read/write of this field below
// branches on `file.schema === "IFC2X3"` to use the right attribute name, matching the
// real Python source's own identical branching (not a gap this port introduces).
// `getExistingReference`'s branch additionally can't be collapsed into one generic
// `.get(...)` call because which name is even *declared* differs by schema (calling
// `.get("Identification")` against an IFC2X3 instance throws -- "attribute not declared
// on this class" -- rather than returning `undefined`).
//
// --- `create_entity(..., Name=..., ReferencedSource=...)` then a separate `setattr` ---
//
// Real Python's `add_from_identification`/`add_from_library` create a brand-new
// `IfcClassificationReference` via `self.file.createIfcClassificationReference(Name=...,
// ReferencedSource=...)` -- filling only 2 of the 4 leading positions, leaving
// `Location`/`Identification`|`ItemReference` unset -- then immediately follows with a
// SEPARATE `reference.ItemReference = ...` / `reference.Identification = ...` statement.
// This is genuinely 2 ops in real Python (one create, one edit), not 1 -- ported here as
// `file.createEntity("IfcClassificationReference", null, null, name, classification)`
// (filling `Location`=null, `Identification`/`ItemReference`=null, `Name`, then
// `ReferencedSource`) followed by a separate `.set(...)` call, matching that same 2-op
// shape exactly rather than collapsing to one positional call (which this project's
// other chunks do ONLY when Python itself performs the whole construction in one call).
//
// --- `hasattr(reference, "ItemReference")`, ported via try/catch ---
//
// `add_from_library`'s `hasattr(self.settings["reference"], "ItemReference")` check
// (on the LIBRARY reference, which may be from any schema, independent of `file`'s own
// target schema) is ported via a `try`/`catch` around `.get("ItemReference")`, falling
// back to `.get("Identification")` on failure -- matching this port's own established
// `getattr`-with-implicit-`AttributeError` idiom (see `util/classification.ts`'s
// `attrOrMissing`).
//
// --- Real Python quirk, disclosed not "fixed": `is_lightweight=False` assumes a
//     non-null `classification` ---
//
// `add_from_library`'s non-lightweight branch reads `self.settings["classification"].Name`
// unconditionally -- if `classification` is left `null`/`undefined` (a valid TS-typed
// call per this function's own optional `classification` parameter) while
// `isLightweight` is explicitly `false`, this throws (reading `.get(...)` off `null`)
// exactly as Python's `None.Name` would raise `AttributeError`. Ported verbatim, not
// defensively guarded -- a real Python-source assumption baked into the non-lightweight
// path, not a gap this port introduces.
//
// --- `file.traverse(reference)` walking a single-linked-list-shaped subgraph ---
//
// The non-lightweight, "merge with an existing same-name classification" branch walks
// `file.traverse(reference)` looking for the first traversed entity whose
// `ReferencedSource` is-a `IfcClassification`, then rewrites that one link and deletes
// the now-orphaned classification. This relies on `ReferencedSource`'s chain being
// effectively a singly-linked list (each `IfcClassificationReference` has at most one
// entity-typed forward attribute pointing further up the chain) -- so `traverse`'s
// default depth-first order (Python: `breadth_first=False`, same default here) always
// reaches the reference immediately pointing AT the terminal `IfcClassification` before
// it would ever reach that `IfcClassification` entity itself in the loop body (which
// doesn't declare `ReferencedSource` at all, and so `.get("ReferencedSource")` would
// throw if ever reached) -- the loop always `break`s one step earlier. Ported with no
// defensive `isA` guard, matching Python's own unguarded `traversed_reference.
// ReferencedSource.is_a(...)`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { Migrator } from "../../util/migrator";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/**
 * Python's `set()`/dedup-by-identity idiom -- see `util/element.ts`'s own (not exported)
 * `EntityInstanceSet` for the full rationale (a fresh N-API wrapper is minted per
 * accessor call, so `===` never works as an entity-identity check).
 */
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

/** Python's `some_set.issubset(other_set)`, by identity. */
function isSubsetByIdentity(items: readonly EntityInstance[], of: Set<EntityInstance>): boolean {
	const ids = new Set([...of].map((i) => i.identity()));
	return items.every((item) => ids.has(item.identity()));
}

/** Python's `set(a) | b`, by identity. */
function unionByIdentity(a: Iterable<EntityInstance>, b: EntityInstanceSet): EntityInstance[] {
	const result = new EntityInstanceSet();
	result.update(a);
	result.update(b.toArray());
	return result.toArray();
}

export interface AddReferenceSettings {
	/** The list of IFC objects, properties, or resources to associate the reference to. */
	products: readonly EntityInstance[];
	/** The classification reference entity taken from an IFC classification library. */
	reference?: EntityInstance | null;
	/** A manually-specified identification code (option 1, no `reference`). */
	identification?: string | null;
	/** A manually-specified, human-readable name (option 1, no `reference`). */
	name?: string | null;
	/** The `IfcClassification` entity in `file` that the reference is part of. */
	classification?: EntityInstance | null;
	/** Whether to add only `reference` itself, or also its parent references. Python default: `true`. */
	isLightweight?: boolean;
}

function getExistingReference(file: IfcFile, identification: string | null | undefined): EntityInstance | undefined {
	const isIfc2x3 = file.schema === "IFC2X3";
	for (const reference of file.byType("IfcClassificationReference")) {
		const value = isIfc2x3 ? reference.get("ItemReference") : reference.get("Identification");
		if (value === identification) return reference;
	}
	return undefined;
}

function updateRelationships(
	file: IfcFile,
	reference: EntityInstance,
	rootedProducts: EntityInstanceSet,
	nonRootedProducts: EntityInstanceSet,
): void {
	if (rootedProducts.size > 0) {
		let rootRel: EntityInstance | null = null;
		if (file.schema === "IFC2X3") {
			for (const rel of file.byType("IfcRelAssociatesClassification")) {
				if ((rel.get("RelatingClassification") as EntityInstance | null)?.equals(reference)) {
					rootRel = rel;
					break;
				}
			}
		} else {
			rootRel = (reference.get("ClassificationRefForObjects") as EntityInstance[])[0] ?? null;
		}

		if (rootRel) {
			const relatedObjects = unionByIdentity(rootRel.get("RelatedObjects") as EntityInstance[], rootedProducts);
			rootRel.set("RelatedObjects", relatedObjects);
			updateOwnerHistory(file, { element: rootRel });
		} else {
			// `IfcRelAssociatesClassification`: GlobalId(0), OwnerHistory(1), Name(2),
			// Description(3), RelatedObjects(4), RelatingClassification(5).
			file.createEntity(
				"IfcRelAssociatesClassification",
				guid.new(),
				createOwnerHistory(file, {}),
				null,
				null,
				rootedProducts.toArray(),
				reference,
			);
		}
	}

	if (nonRootedProducts.size > 0) {
		// NOTE: Only IFC4+ -- IFC2X3 is already handled by raising `TypeError` before this
		// function is ever reached with non-rooted products.
		const nonRootRel = (reference.get("ExternalReferenceForResources") as EntityInstance[])[0] ?? null;
		if (nonRootRel) {
			const relatedObjects = unionByIdentity(
				nonRootRel.get("RelatedResourceObjects") as EntityInstance[],
				nonRootedProducts,
			);
			nonRootRel.set("RelatedResourceObjects", relatedObjects);
		} else {
			// `IfcExternalReferenceRelationship`: Name(0), Description(1),
			// RelatingReference(2), RelatedResourceObjects(3).
			file.createEntity("IfcExternalReferenceRelationship", null, null, reference, nonRootedProducts.toArray());
		}
	}
}

function addFromIdentification(
	file: IfcFile,
	settings: AddReferenceSettings,
	rootedProducts: EntityInstanceSet,
	nonRootedProducts: EntityInstanceSet,
): EntityInstance {
	let reference = getExistingReference(file, settings.identification);
	if (!reference) {
		// `IfcClassificationReference`: Location(0), Identification|ItemReference(1),
		// Name(2), ReferencedSource(3) -- see this file's header comment on the
		// create-then-setattr 2-op shape.
		reference = file.createEntity(
			"IfcClassificationReference",
			null,
			null,
			settings.name ?? null,
			settings.classification ?? null,
		);
		if (file.schema === "IFC2X3") {
			reference.set("ItemReference", settings.identification ?? null);
		} else {
			reference.set("Identification", settings.identification ?? null);
		}
	}

	updateRelationships(file, reference, rootedProducts, nonRootedProducts);
	return reference;
}

function addFromLibrary(
	file: IfcFile,
	settings: AddReferenceSettings,
	rootedProducts: EntityInstanceSet,
	nonRootedProducts: EntityInstanceSet,
): EntityInstance {
	const sourceReference = settings.reference as EntityInstance;
	// Python: `hasattr(reference, "ItemReference")` -- an attribute access attempted and
	// discarded on failure (`AttributeError`, "not declared on this class"), NOT a
	// nullish-value fallback: if `ItemReference` IS declared (IFC2X3) but happens to be
	// unset (`null`), Python still uses that `None`, never falling through to
	// `Identification` (which IFC2X3 doesn't declare at all).
	let sourceIdentification: unknown;
	try {
		sourceIdentification = sourceReference.get("ItemReference"); // IFC2X3
	} catch {
		sourceIdentification = sourceReference.get("Identification");
	}

	let reference = getExistingReference(file, sourceIdentification as string | null);
	if (!reference) {
		const migrator = new Migrator();

		if (settings.isLightweight ?? true) {
			// Real Python temporarily mutates the CALLER-SUPPLIED library reference itself
			// (a different `IfcFile` than `file`, e.g. an opened Uniclass library) --
			// nulling its `ReferencedSource` so `Migrator.migrate` doesn't also drag the
			// whole parent-classification chain along for a "lightweight" reference, then
			// restoring it immediately after. A real, if surprising, side effect on the
			// caller's own library file, ported verbatim (not copied-then-mutated).
			const oldReferencedSource = sourceReference.get("ReferencedSource") as EntityInstance | null;
			sourceReference.set("ReferencedSource", null);

			reference = migrator.migrate(sourceReference, file);

			reference.set("ReferencedSource", settings.classification ?? null);
			sourceReference.set("ReferencedSource", oldReferencedSource);
		} else {
			const classificationName = (settings.classification as EntityInstance).get("Name") as string;
			const existingClassification = file
				.byType("IfcClassification")
				.filter((c) => (c.get("Name") as string) === classificationName);

			reference = migrator.migrate(sourceReference, file);

			if (existingClassification.length > 0) {
				const toDelete = new EntityInstanceSet();
				for (const traversedReference of file.traverse(reference)) {
					const referencedSource = traversedReference.get("ReferencedSource") as EntityInstance;
					if (referencedSource.isA("IfcClassification")) {
						toDelete.add(referencedSource);
						traversedReference.set("ReferencedSource", existingClassification[0]);
						break;
					}
				}
				for (const element of toDelete.toArray()) {
					file.remove(element);
				}
			}
		}
	}

	updateRelationships(file, reference, rootedProducts, nonRootedProducts);
	return reference;
}

function addReferenceUsecase(file: IfcFile, settings: AddReferenceSettings): EntityInstance | undefined {
	if (!settings.products || settings.products.length === 0) return undefined;

	if (settings.reference) {
		const referenced = elementUtil.getReferencedElements(settings.reference);
		if (isSubsetByIdentity(settings.products, referenced)) {
			// Nothing to do, all elements already have this reference assigned.
			return settings.reference;
		}
	}

	const rootedProducts = new EntityInstanceSet();
	const nonRootedProducts = new EntityInstanceSet();
	for (const product of settings.products) {
		if (product.isA("IfcRoot")) {
			rootedProducts.add(product);
		} else {
			nonRootedProducts.add(product);
		}
	}

	if (nonRootedProducts.size > 0 && file.schema === "IFC2X3") {
		throw new TypeError(`Cannot add reference to non-IfcRoot element in IFC2X3: ${nonRootedProducts.toArray()}.`);
	}

	if (settings.reference) {
		return addFromLibrary(file, settings, rootedProducts, nonRootedProducts);
	}
	return addFromIdentification(file, settings, rootedProducts, nonRootedProducts);
}

/**
 * Adds a new classification reference and assigns it to the list of products (Python:
 * `ifcopenshell.api.classification.add_reference`).
 *
 * A classification reference is a single entry such as `"Pr_12_23_34"` that is part of
 * an external classification system (such as Uniclass or Omniclass). References can be
 * added to almost any object in IFC, including physical objects, object types,
 * properties, tasks, costs, or resources.
 *
 * @throws {TypeError} If `file` is IFC2X3 and `products` has non-`IfcRoot` elements.
 *
 * @example
 * ```ts
 * // Option 1: adding and assigning a new reference from scratch
 * const classification = api.classification.addClassification(model, { classification: "MyCustomClassification" });
 * api.classification.addReference(model, {
 *   products: [wallType],
 *   classification,
 *   identification: "W_01",
 *   name: "Interior Walls",
 * });
 * ```
 */
export const addReference = wrapUsecase("classification.add_reference", addReferenceUsecase);
