// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/aggregate/unassign_object.py` (src/ifcopenshell-python, 75
// lines) -- not this project's own `api.aggregate` chunk (that's a future, separate
// chunk per `planning/ifcopenshell-ts/PROGRESS.md`'s Phase 6 table and
// `research/02-python-api-inventory.md` §3's "aggregate (2 functions, smallest
// subpackage)" deep dive, which covers both `assign_object`/`unassign_object`
// together). Ported here, alone, as a direct dependency of `api.spatial.assign_container`
// (real Python: `ifcopenshell.api.aggregate.unassign_object(file,
// products=products_without_containers)`, called to strip any pre-existing aggregation
// before a product becomes newly contained -- a product may only occupy one slot in the
// spatial-decomposition tree at a time, per `research/02-python-api-inventory.md` §3's
// "aggregation and containment are mutually exclusive for the same object" framing).
// `assign_object` (the other half of this module, 160 LOC, its own "detach from old
// parent / cycle-adjacent invariant" complexity per the same deep dive) is genuinely
// out of scope here and NOT ported -- `assign_container` never calls it, so porting it
// would be scope creep beyond what `api.spatial` needs. When `api.aggregate` lands as
// its own chunk, this file's `unassignObject` should be treated as already landed
// (reviewed against the real Python source below) rather than re-ported from scratch.
//
// Structurally near-identical to `../spatial/unassignContainer.ts` (same
// build-a-rels-set / rewrite-or-delete-with-`removeDeep2` shape) -- the two Python
// source files are themselves near-identical for the same reason (both manage a
// single-related-element STEP relationship class), not a coincidence introduced by
// this port.
//
// Update: `assign_object` has since landed too, as `./assignObject.ts` -- `api.aggregate`
// is now fully ported. See that file's own header comment for its own porting notes.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set, matching `util/element.ts`'s own private `EntityInstanceSet` precedent (not exported, so each module that needs set-of-`EntityInstance` semantics keeps its own small copy -- see `util/classification.ts`/`util/constraint.ts` for the same pattern). */
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

export interface UnassignObjectSettings {
	/** The list of parts of the aggregate, typically `IfcElement`s or `IfcSpatialStructureElement` subtypes. */
	products: readonly EntityInstance[];
}

function unassignObjectUsecase(file: IfcFile, settings: UnassignObjectSettings): void {
	const products = new EntityInstanceSet();
	products.update(settings.products);

	const rels = new EntityInstanceSet();
	for (const product of products.values()) {
		const decomposes = product.get("Decomposes") as EntityInstance[];
		const rel = decomposes.find((r) => r.isA("IfcRelAggregates")) ?? null;
		if (rel) rels.add(rel);
	}

	for (const rel of rels.values()) {
		const relatedObjects = (rel.get("RelatedObjects") as EntityInstance[]).filter((o) => !products.has(o));
		if (relatedObjects.length > 0) {
			rel.set("RelatedObjects", relatedObjects);
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
}

/**
 * Unassigns products from their aggregate (Python: `ifcopenshell.api.aggregate.unassign_object`).
 *
 * A product (i.e. a smaller part of a whole) may be aggregated into zero or one larger
 * space or element. This function removes that aggregation relationship. If the
 * product is not part of an aggregation relationship, nothing happens.
 */
export const unassignObject = wrapUsecase("aggregate.unassign_object", unassignObjectUsecase);
