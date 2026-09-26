// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/assign_resource.py` (src/ifcopenshell-python, 106
// lines) -- part of this project's brand-new `api.resource` chunk (see `./index.ts`'s
// own header comment). Assigns an object (typically an `IfcProduct` or `IfcActor`) to
// a resource via `IfcRelAssignsToResource`, merging into any existing rel with the
// same `RelatingResource` rather than creating a duplicate. Structurally the
// "assign one object into a single-relating-resource rel" shape, distinct from
// `../nest/assignObject.ts`'s/`../aggregate/assignObject.ts`'s own "detach from any
// previous single-slot relationship" shape -- a product/actor may be assigned to
// MULTIPLE resources at once (no "unassign from previous" step here at all, matching
// real Python: no `previous_*_rels` handling of any kind in this 106-line source).
//
// --- Duplicate-guard, verified against the real upstream bug-fix history ---
//
// Real Python's own duplicate guard (`if assignment.is_a("IfcRelAssignsToResource") and
// assignment.RelatingResource == relating_resource: return assignment`) is exactly
// correct in the source read for this port -- confirmed against
// `test_assigning_the_same_object_twice_does_not_duplicate_related_objects`'s own
// regression-test comment ("Regression test for #8203: a typo in the duplicate guard
// ('IfclRelAssignsToResource') meant the guard never matched..."), i.e. that bug has
// ALREADY been fixed upstream in the exact source version this port reads from -- there
// is no typo to reproduce here. Ported as the correctly-spelled `isA("IfcRelAssignsToResource")`
// check, not the historical buggy spelling.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface AssignResourceSettings {
	/** The `IfcResource` to assign the object to. */
	relatingResource: EntityInstance;
	/** The `IfcProduct` or `IfcActor` to assign to the resource. */
	relatedObject: EntityInstance;
}

function assignResourceUsecase(file: IfcFile, settings: AssignResourceSettings): EntityInstance {
	const { relatingResource, relatedObject } = settings;

	const hasAssignments = (relatedObject.get("HasAssignments") as EntityInstance[] | null) ?? [];
	for (const assignment of hasAssignments) {
		if (
			assignment.isA("IfcRelAssignsToResource") &&
			(assignment.get("RelatingResource") as EntityInstance).equals(relatingResource)
		) {
			return assignment;
		}
	}

	const resourceOfList = (relatingResource.get("ResourceOf") as EntityInstance[] | null) ?? [];
	let resourceOf: EntityInstance | null = resourceOfList[0] ?? null;

	if (resourceOf) {
		const relatedObjects = [...(resourceOf.get("RelatedObjects") as EntityInstance[]), relatedObject];
		resourceOf.set("RelatedObjects", relatedObjects);
		updateOwnerHistory(file, { element: resourceOf });
	} else {
		resourceOf = file.createEntity(
			"IfcRelAssignsToResource",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			[relatedObject], // RelatedObjects
			null, // RelatedObjectsType
			relatingResource, // RelatingResource
		);
	}
	return resourceOf;
}

/**
 * Assigns a resource to an object (Python: `ifcopenshell.api.resource.assign_resource`).
 *
 * Two types of objects are typically assigned to resources: products and actors.
 *
 * If a product is assigned to a resource, that means that the product represents the
 * resource on site. This may be represented via material handling zones on a
 * construction site, or equipment like cranes and their physical locations.
 *
 * If an actor is assigned to a resource, that means that the actor (person or
 * organisation) is the actor consuming the resource (e.g. if the resource is material
 * or equipment) or the actor performing the work (e.g. if the resource is a labour
 * resource).
 *
 * @returns The newly created (or reused) `IfcRelAssignsToResource`.
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
 * // Let's assign our crane to the resource. The crane now represents the resource.
 * api.resource.assignResource(model, { relatingResource: crane, relatedObject: product });
 * ```
 */
export const assignResource = wrapUsecase("resource.assign_resource", assignResourceUsecase);
