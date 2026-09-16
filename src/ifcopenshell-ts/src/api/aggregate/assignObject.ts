// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/aggregate/assign_object.py` (src/ifcopenshell-python, 160
// lines) -- the second and final function of `api.aggregate`, completing that module
// (`unassign_object`, the other half, already landed as `./unassignObject.ts` as a
// dependency of `api.spatial.assignContainer` -- see that file's own header comment).
// Assigns a list of `products` to be aggregated (whole/part hierarchy, an
// `IfcRelAggregates`) under a single `relatingObject`. Structurally near-identical to
// `../spatial/assignContainer.ts` (same "surgery" shape: check the existing
// relationship, unassign from the old one, assign to the new one, merge-into-existing-
// vs-create-new) -- the two Python source files are themselves near-identical for the
// same reason (both manage a single-related-object-set STEP relationship class), not a
// coincidence introduced by this port.
//
// --- Reused dependency: `spatial.unassignContainer` (already landed) ---
//
// Since a product may only occupy one slot in the spatial-decomposition tree at a time
// (aggregation OR containment OR nesting, never more than one), real Python calls
// `ifcopenshell.api.spatial.unassign_container` on every about-to-be-aggregated product
// that doesn't already have an aggregate -- the exact same invariant `assign_container`
// itself enforces from the *other* direction by calling `aggregate.unassign_object`
// (see `../spatial/assignContainer.ts`'s own header comment). `spatial.unassignContainer`
// is already landed (`../spatial/unassignContainer.ts`, PR #71) and reused directly here,
// not reinvented.
//
// --- `hasattr(p, "ContainedInStructure")` guard: verified load-bearing, ported faithfully ---
//
// Real Python filters `possibly_contained_products = [p for p in
// products_without_aggregates if hasattr(p, "ContainedInStructure")]` before calling
// `unassign_container` -- unlike `assign_container`'s own equivalent step (which never
// needs this guard, since its `products` are always physical `IfcElement`s that
// unconditionally declare `ContainedInStructure`), `assign_object`'s `products` are
// explicitly documented as "typically IfcElement or IfcSpatialStructureElement" --
// e.g. aggregating an `IfcBuilding` under an `IfcSite`. Verified directly against this
// port's own native binding (not assumed): `IfcSite`/`IfcBuilding` (spatial structure
// elements) throw `"entity instance of type '...' has no attribute
// 'ContainedInStructure'"` from `EntityInstance.get("ContainedInStructure")`, exactly
// mirroring Python's own `AttributeError` that `hasattr` guards against, while
// `IfcWall`/`IfcElementAssembly` (physical elements) resolve to `[]` without throwing.
// So this guard is genuinely load-bearing in this port too (not a no-op left over from
// Python's own defensiveness) -- ported faithfully below via a small local
// `hasContainedInStructure` helper (try/catch around `.get(...)`, matching
// `util/element.ts`'s own private `attrOrMissing` helper's identical technique, not
// importable from here since it's module-private there).
//
// --- No `is_a("IfcRelAggregates")` filter on `previous_aggregates_rels`: ported verbatim ---
//
// Unlike `unassignObject.ts`'s own loop (which explicitly filters `product.Decomposes`
// down to `rel.isA("IfcRelAggregates")` before touching it), real Python's
// `assign_object` takes `next(iter(product.Decomposes), None)` completely unfiltered --
// whatever the first `IfcRelDecomposes`-subtype relationship is (in practice always an
// `IfcRelAggregates`, since a product may only occupy one decomposition slot at a time,
// but the source itself makes no such assertion). This is ported exactly as written,
// not "corrected" to add a filter Python itself doesn't have -- the later rewrite-or-
// delete loop generically reads/writes `RelatingObject`/`RelatedObjects`, attributes
// `IfcRelDecomposes` itself declares (inherited by every subtype, `IfcRelAggregates`
// included), so this is a real, intentional Python-source generality, not a bug.
//
// --- `geometry.edit_object_placement`: RESOLVED -- now wired in for real, same as `assignContainer.ts` ---
//
// `ifcopenshell.api.geometry.edit_object_placement` landed for real (see
// `../geometry/editObjectPlacement.ts`'s own header comment) -- this function's own
// final loop now calls it exactly as real Python does, identically to
// `assignContainer.ts`'s own now-resolved final loop (see that file's own header
// comment for the full explanation, not duplicated here): for every product actually
// changed, if it currently has an `ObjectPlacement` that `isA("IfcLocalPlacement")`,
// its placement is re-localized against its own current absolute matrix, `isSi:
// false`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { getLocalPlacement } from "../../util/placement";
import { editObjectPlacement } from "../geometry/editObjectPlacement";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { unassignContainer } from "../spatial/unassignContainer";

/** Local by-identity set -- see `./unassignObject.ts`'s identical helper's own doc comment for why this is duplicated per-module rather than shared. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	has(instance: EntityInstance | null | undefined): boolean {
		if (!instance) return false;
		return this.byIdentity.has(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

/** Python's `a == b`/`a != b` for two possibly-`null` `entity_instance`s -- see `util/element.ts`'s identical private `entityEquals` helper. */
function sameRel(a: EntityInstance | null, b: EntityInstance | null): boolean {
	if (!a || !b) return a === b;
	return a.equals(b);
}

/**
 * Python's `hasattr(p, "ContainedInStructure")` -- see this file's header comment for
 * why this guard is genuinely load-bearing in this port (verified against the native
 * binding, not assumed), matching `util/element.ts`'s own private `attrOrMissing`
 * try/catch technique (not importable from here, so duplicated -- same convention as
 * this file's `EntityInstanceSet`).
 */
function hasContainedInStructure(product: EntityInstance): boolean {
	try {
		product.get("ContainedInStructure");
		return true;
	} catch {
		return false;
	}
}

export interface AssignObjectSettings {
	/** The list of parts of the aggregate, typically `IfcElement`s or `IfcSpatialStructureElement` subtypes. */
	products: readonly EntityInstance[];
	/** The whole of the aggregate, typically an `IfcElement` or `IfcSpatialStructureElement` subtype. */
	relatingObject: EntityInstance;
}

function assignObjectUsecase(file: IfcFile, settings: AssignObjectSettings): EntityInstance | undefined {
	if (!settings.products.length) {
		return undefined;
	}

	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	const isDecomposedByList = settings.relatingObject.get("IsDecomposedBy") as EntityInstance[];
	let isDecomposedBy: EntityInstance | null = isDecomposedByList.find((i) => i.isA("IfcRelAggregates")) ?? null;

	const previousAggregatesRels = new EntityInstanceSet();
	const productsWithoutAggregates: EntityInstance[] = [];
	const productsWithAggregates: EntityInstance[] = [];

	// Check if there is anything to change.
	for (const product of productsSet.values()) {
		const decomposes = product.get("Decomposes") as EntityInstance[];
		const productRel = decomposes[0] ?? null;

		if (!productRel) {
			productsWithoutAggregates.push(product);
			continue;
		}

		// Either `isDecomposedBy` is null, or the product is part of a different rel.
		if (!sameRel(productRel, isDecomposedBy)) {
			previousAggregatesRels.add(productRel);
			productsWithAggregates.push(product);
		}
		// Products with an already-assigned matching aggregate are skipped.
	}

	const productsToChange = [...productsWithoutAggregates, ...productsWithAggregates];
	// Nothing to change.
	if (productsToChange.length === 0) {
		return isDecomposedBy ?? undefined;
	}

	// A product can be either only aggregated or only contained at the same time.
	// Some products might not be able to have a container at all (e.g. a spatial
	// structure element being aggregated) -- see this file's header comment for why
	// this guard is genuinely load-bearing in this port.
	const possiblyContainedProducts = productsWithoutAggregates.filter(hasContainedInStructure);
	unassignContainer(file, { products: possiblyContainedProducts });

	// Unassign elements from previous aggregates.
	for (const rel of previousAggregatesRels.values()) {
		const relatedObjects = (rel.get("RelatedObjects") as EntityInstance[]).filter((o) => !productsSet.has(o));
		if (relatedObjects.length > 0) {
			rel.set("RelatedObjects", relatedObjects);
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	// Assign elements to a new aggregate.
	if (isDecomposedBy) {
		const merged = new EntityInstanceSet();
		merged.update(isDecomposedBy.get("RelatedObjects") as EntityInstance[]);
		merged.update(productsSet.values());
		isDecomposedBy.set("RelatedObjects", merged.values());
		updateOwnerHistory(file, { element: isDecomposedBy });
	} else {
		isDecomposedBy = file.createEntity(
			"IfcRelAggregates",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			settings.relatingObject, // RelatingObject
			productsSet.values(), // RelatedObjects
		);
	}

	// Localize placement relative to a new aggregate for affected products -- see this
	// file's header comment (now resolved).
	for (const product of productsToChange) {
		const placement = product.get("ObjectPlacement") as EntityInstance | null;
		if (placement?.isA("IfcLocalPlacement")) {
			editObjectPlacement(file, {
				product,
				matrix: getLocalPlacement(placement),
				isSi: false,
			});
		}
	}

	return isDecomposedBy;
}

/**
 * Assigns object as an aggregate to the products (Python: `ifcopenshell.api.aggregate.assign_object`).
 *
 * All physical IFC model elements must be part of a hierarchical tree called the
 * "spatial decomposition", where large things are made up of smaller things. This tree
 * always begins at an `IfcProject` and is then broken down using "decomposition"
 * relationships, of which aggregation is the first relationship you will use.
 *
 * Typically used when you want to describe how large spaces are made up of smaller
 * spaces. For example large spatial elements (e.g. sites, buildings) can be made out of
 * smaller spatial elements (e.g. storeys, spaces).
 *
 * The largest space (typically the `IfcSite`) can then be aggregated in a project. It is
 * a requirement for all spatial structures to be directly or indirectly aggregated back
 * to the `IfcProject` to create a hierarchy of spaces.
 *
 * The other common usecase is when larger physical products are made up of smaller
 * physical products. For example, a stair might be made out of a flight, a landing, a
 * railing and so on. Or a wall might be made out of stud members, and coverings.
 *
 * As a product may only have a single location in the "spatial decomposition" tree,
 * assigning an aggregate relationship will remove any previous aggregation, containment,
 * or nesting relationships it may have.
 *
 * @returns The `IfcRelAggregates` relationship instance, or `undefined` if `products`
 * was an empty list.
 */
export const assignObject = wrapUsecase("aggregate.assign_object", assignObjectUsecase);
