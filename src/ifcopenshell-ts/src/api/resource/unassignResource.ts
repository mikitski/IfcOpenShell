// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/unassign_resource.py` (src/ifcopenshell-python,
// 72 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment). Removes `relatedObject` from whichever
// `IfcRelAssignsToResource` rel (if any) links it to `relatingResource` specifically --
// matching `./assignResource.ts`'s own "a related object may be assigned to multiple
// resources at once" model (this only touches the ONE rel matching BOTH
// `relatedObject` AND `relatingResource`, not every rel `relatedObject` happens to be
// in).
//
// Real Python's own `for rel in related_object.HasAssignments or []:` loop uses
// `continue` (not `break`) after finding a non-matching rel, but the FIRST matching
// rel found triggers an unconditional `return` -- since `IfcRelAssignsToResource` never
// duplicates the same `(relatingResource, relatedObject)` pair (per `./assignResource
// .ts`'s own duplicate guard), there is at most one matching rel to find in practice;
// ported verbatim via a plain `for...of` loop with an early `return`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface UnassignResourceSettings {
	/** The `IfcResource` to unassign the object from. */
	relatingResource: EntityInstance;
	/** The `IfcProduct` or `IfcActor` to unassign. */
	relatedObject: EntityInstance;
}

function unassignResourceUsecase(file: IfcFile, settings: UnassignResourceSettings): void {
	const { relatingResource, relatedObject } = settings;

	const hasAssignments = (relatedObject.get("HasAssignments") as EntityInstance[] | null) ?? [];
	for (const rel of hasAssignments) {
		if (
			!rel.isA("IfcRelAssignsToResource") ||
			!(rel.get("RelatingResource") as EntityInstance).equals(relatingResource)
		) {
			continue;
		}
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
 * Removes the relationship between a resource and object (Python: `ifcopenshell.api.resource.unassign_resource`).
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * const crane = api.resource.addResource(model, {
 * 	parentResource: crew,
 * 	ifcClass: "IfcConstructionEquipmentResource",
 * 	name: "Tower Crane 01",
 * });
 * const product = api.root.createEntity(model, { ifcClass: "IfcBuildingElementProxy", predefinedType: "CRANE" });
 * api.resource.assignResource(model, { relatingResource: crane, relatedObject: product });
 * // Undo it.
 * api.resource.unassignResource(model, { relatingResource: crane, relatedObject: product });
 * ```
 */
export const unassignResource = wrapUsecase("resource.unassign_resource", unassignResourceUsecase);
