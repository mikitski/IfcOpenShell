// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/unassign_product.py` (src/ifcopenshell-python, 72
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). The inverse of `./assignProduct.ts`: removes `relatedObject`
// (typically an `IfcTask`) from whichever `IfcRelAssignsToProduct` currently links it to
// `relatingProduct` -- shrinking the relationship's `RelatedObjects` if other objects
// remain assigned via the same rel, or deleting the rel entirely (deep-purging its
// `OwnerHistory` too) if `relatedObject` was the only one. Structurally near-identical to
// `./unassignProcess.ts` -- see that file's own header comment for the shared
// "single-match loop, shrink-or-delete" shape and dependency list (`api.owner.
// updateOwnerHistory`/`util.element.removeDeep2`, both already landed).
//
// Unlike `./assignProcess.ts`/`./assignProduct.ts`'s own disclosed dedup-return
// asymmetry, `unassign_process.py`/`unassign_product.py` are IDENTICAL in this regard --
// both return the shrunk rel on a partial removal, and `None`/`undefined` when the rel
// is deleted entirely (confirmed by reading both real files side by side).
//
// A real Python test exists for this exact file (`test_unassign_product.py`, run on
// both IFC4 and IFC2X3) -- ported directly below as `unassignProduct.test.ts`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface UnassignProductSettings {
	/** The `IfcProduct` in the relationship. */
	relatingProduct: EntityInstance;
	/** The `IfcTask` in the relationship. */
	relatedObject: EntityInstance;
}

function unassignProductUsecase(file: IfcFile, settings: UnassignProductSettings): EntityInstance | undefined {
	const { relatingProduct, relatedObject } = settings;

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const rel of hasAssignments) {
		if (!rel.isA("IfcRelAssignsToProduct") || !(rel.get("RelatingProduct") as EntityInstance).equals(relatingProduct)) {
			continue;
		}
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		if (relatedObjects.length === 1) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
			return undefined;
		}
		const newRelatedObjects = relatedObjects.filter((o) => !o.equals(relatedObject));
		rel.set("RelatedObjects", newRelatedObjects);
		updateOwnerHistory(file, { element: rel });
		return rel;
	}
	return undefined;
}

/**
 * Unassigns a product and object relationship (Python:
 * `ifcopenshell.api.sequence.unassign_product`).
 *
 * See `api.sequence.assignProduct` for details.
 *
 * @returns The still-alive, shrunk `IfcRelAssignsToProduct` if other objects remain
 * assigned via the same relationship, or `undefined` if the relationship was removed
 * entirely (or no matching relationship was found at all).
 *
 * @example
 * ```ts
 * const task = api.sequence.addTask(model, {
 *   workSchedule: schedule, name: "Build wall", identification: "A", predefinedType: "CONSTRUCTION",
 * });
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * api.sequence.assignProduct(model, { relatingProduct: wall, relatedObject: task });
 * // Change our mind.
 * api.sequence.unassignProduct(model, { relatingProduct: wall, relatedObject: task });
 * ```
 */
export const unassignProduct = wrapUsecase("sequence.unassign_product", unassignProductUsecase);
