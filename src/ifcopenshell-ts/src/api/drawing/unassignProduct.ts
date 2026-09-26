// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/drawing/unassign_product.py` (src/ifcopenshell-python, 74
// lines) -- part of this project's `api.drawing` chunk (see `./index.ts`'s own header
// comment). The inverse of `./assignProduct.ts`: removes the `IfcRelAssignsToProduct`
// association between `relating_product` (or, for an `IfcGridAxis`, its owning
// `IfcGrid`) and `related_object`.
//
// For an `IfcGridAxis`, `relating_product` is first REMAPPED to the axis's owning
// `IfcGrid` (same `PartOfW`/`PartOfV`/`PartOfU`-inverse lookup as `./assignProduct.ts`'s
// own `firstNonEmptyGridInverse`), reused here rather than duplicated. Unlike
// `assignProduct`'s unguarded `None` dereference on a grid-less axis, this function
// only ever COMPARES the remapped `relating_product` (possibly `None`/`null`) for
// equality -- comparing an entity to `None` is simply "not equal" in Python, so a
// grid-less axis makes every rel fail the match and the function becomes a safe no-op,
// not a crash (a real, disclosed asymmetry with `assignProduct`'s own equivalent
// situation).
//
// The loop iterates `related_object.HasAssignments` (every `IfcRelAssigns*`-family rel
// pointing AT this specific object), filtered to `IfcRelAssignsToProduct` rels whose
// `RelatingProduct` matches the (possibly grid-remapped) `relating_product`. For each
// match: if `related_object` is the ONLY member of that rel's `RelatedObjects`, the
// whole rel (and its `OwnerHistory`, via `removeDeep2`) is deleted and the function
// `return`s IMMEDIATELY -- stopping the loop, even if more matching rels remain.
// Otherwise, `related_object` alone is stripped from that rel's `RelatedObjects` (via
// `update_owner_history`, not deleted) and the loop CONTINUES to the next matching rel.
//
// --- Real, disclosed Python quirk: the early `return` on a singleton match can leave
//     other matching rels unprocessed -- specific to the grid-axis remapping ---
//
// Because the grid-axis remap collapses `relating_product` down to the shared `IfcGrid`
// (not the specific axis), `related_object.HasAssignments` can contain MORE THAN ONE
// rel with `RelatingProduct == grid` if `related_object` was separately assigned via
// two different axes of the same grid (see `./assignProduct.ts`'s own header comment on
// how its grid branch can create one rel per distinct axis `Name`, all sharing the same
// `RelatingProduct=grid`). In that scenario, `unassign_product` for ONE of those axes
// still matches BOTH rels (the remap loses which specific axis was requested), and if
// the FIRST one encountered (iteration order of `HasAssignments`, not necessarily the
// one for the requested axis) happens to be a singleton, the function deletes that rel
// and returns immediately -- potentially the wrong axis's rel, and definitely without
// ever touching the other still-matching rel. Ported verbatim (the early `return` is
// exactly what real Python does inside the `if len(rel.RelatedObjects) == 1:` branch,
// not something this port introduces) and disclosed here rather than "fixed" to keep
// looping -- not exercised by any real Python test either.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface UnassignProductSettings {
	/** The `IfcProduct` (or `IfcGridAxis`) the object is related to. */
	relatingProduct: EntityInstance;
	/** The object (typically `IfcAnnotation`) that the product is related to. */
	relatedObject: EntityInstance;
}

function firstNonEmptyGridInverse(axis: EntityInstance): EntityInstance | null {
	for (const attribute of ["PartOfW", "PartOfV", "PartOfU"] as const) {
		const values = axis.get(attribute) as EntityInstance[];
		if (values.length > 0) return values[0];
	}
	return null;
}

function unassignProductUsecase(file: IfcFile, settings: UnassignProductSettings): void {
	const { relatedObject } = settings;
	let relatingProduct: EntityInstance | null = settings.relatingProduct;

	if (relatingProduct.isA("IfcGridAxis")) {
		relatingProduct = firstNonEmptyGridInverse(relatingProduct);
	}

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const rel of hasAssignments) {
		if (!rel.isA("IfcRelAssignsToProduct")) continue;
		const relRelatingProduct = rel.get("RelatingProduct") as EntityInstance | null;
		if (!relatingProduct || !relRelatingProduct || !relRelatingProduct.equals(relatingProduct)) continue;

		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		if (relatedObjects.length === 1) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
			return;
		}
		const remaining = relatedObjects.filter((o) => !o.equals(relatedObject));
		rel.set("RelatedObjects", remaining);
		updateOwnerHistory(file, { element: rel });
	}
}

/**
 * Unassigns a product and an object (typically an annotation) (Python:
 * `ifcopenshell.api.drawing.unassign_product`).
 *
 * Smart annotation objects can be associated with products so that they can annotate
 * attributes and properties. This function lets you remove the association, so that
 * you may change the association with another object later or leave the annotation as
 * a "dumb" annotation.
 *
 * See this file's own header comment for a real, disclosed Python quirk: unassigning
 * one grid axis's association can, in rare multi-axis-on-the-same-grid situations,
 * stop after affecting a different axis's relationship than the one requested.
 *
 * @example
 * ```ts
 * const furniture = api.root.createEntity(model, { ifcClass: "IfcFurniture" });
 * const annotation = api.root.createEntity(model, { ifcClass: "IfcAnnotation" });
 * api.drawing.assignProduct(model, { relatingProduct: furniture, relatedObject: annotation });
 *
 * // Let's change our mind and remove the relationship
 * api.drawing.unassignProduct(model, { relatingProduct: furniture, relatedObject: annotation });
 * ```
 */
export const unassignProduct = wrapUsecase("drawing.unassign_product", unassignProductUsecase);
