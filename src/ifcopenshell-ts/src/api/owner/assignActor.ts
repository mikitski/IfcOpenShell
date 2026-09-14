// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/assign_actor.py` (src/ifcopenshell-python, 99 lines)
// -- assigns an `IfcActor` to an object via `IfcRelAssignsToActor`.
//
// --- A real, non-obvious quirk, verified by reading the source closely rather than
// assuming this mirrors `../group/assignGroup.ts`/`../library/assignReference.ts`'s
// shape ---
//
// Real Python's dedup check and its reuse-existing-rel check look at TWO DIFFERENT
// entities' inverse attributes, not the same one:
//
// ```python
// def assign_actor(file, relating_actor, related_object):
//     if related_object.HasAssignments:
//         for rel in related_object.HasAssignments:
//             if rel.is_a("IfcRelAssignsToActor") and rel.RelatingActor == relating_actor:
//                 return rel
//     rel = None
//     if relating_actor.IsActingUpon:
//         rel = relating_actor.IsActingUpon[0]
//     if rel:
//         related_objects = list(rel.RelatedObjects)
//         related_objects.append(related_object)
//         rel.RelatedObjects = related_objects
//         ifcopenshell.api.owner.update_owner_history(file, element=rel)
//     else:
//         rel = file.create_entity(...)
//     return rel
// ```
//
// 1. Dedup check: scans `related_object`'s own `HasAssignments` (every
//    `IfcRelAssigns*`-family rel pointing AT this object) for an existing
//    `IfcRelAssignsToActor` whose `RelatingActor` already equals `relating_actor` --
//    if found, return it unchanged (no duplicate assignment).
// 2. Reuse-or-create: if no dedup hit, looks at `relating_actor.IsActingUpon` (the
//    INVERSE of `IfcRelAssignsToActor.RelatingActor` -- every rel this actor is
//    RESPONSIBLE FOR, across ALL related objects) and takes its FIRST entry
//    (`[0]`) -- NOT scoped to `related_object` at all. Unlike `assignGroup.ts`'s
//    `group.IsGroupedBy[0]` (scoped to the single group being assigned to) or
//    `assignReference.ts`'s per-target-object rel lookup, this reuses whichever
//    `IfcRelAssignsToActor` rel this SAME ACTOR already has -- growing it with
//    `related_object` appended -- rather than creating one rel per distinct set of
//    related objects. A single `IfcActor` therefore only ever accumulates AT MOST
//    ONE `IfcRelAssignsToActor` rel across its entire lifetime (once one exists,
//    every future `assign_actor` call for that same actor reuses and grows it,
//    regardless of which `related_object` is being assigned) -- this is real
//    Python's own behavior, ported verbatim, not "fixed" to scope the reuse check
//    to `related_object` like the sibling `assign_group`/`assign_reference`
//    functions do.
// 2b. The reused rel's `RelatedObjects` is grown via a plain `list.append` with NO
//    dedup check against the existing list -- safe in practice only because step 1's
//    dedup check already ruled out `related_object` already being one of this rel's
//    `RelatedObjects` (since if it were, step 1 would have found this exact rel via
//    `related_object.HasAssignments` and returned early) -- not a redundant
//    safety net, a genuinely necessary precondition ported faithfully (no extra
//    dedup added here that real Python doesn't have either).
//
// `IfcRelAssignsToActor`: `GlobalId`(0), `OwnerHistory`(1), `Name`(2), `Description`(3),
// `RelatedObjects`(4), `RelatedObjectsType`(5), `RelatingActor`(6), `ActingRole`(7) --
// identical order in all 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts`; IFC2X3's `RelatedObjectsType` is `IfcObjectTypeEnum | null` and
// IFC4X3's is `boolean | null` -- a real, unrelated-to-this-port schema quirk, since
// neither is ever populated here). Only `GlobalId`/`OwnerHistory`/`RelatedObjects`/
// `RelatingActor` are ever populated, matching real Python's own kwargs-only call
// (`Name`/`Description`/`RelatedObjectsType`/`ActingRole` all left unset).
//
// --- Real Python's own docstring example is broken; not reproduced verbatim here ---
//
// Real `assign_actor.py`'s example passes `relating_actor=manufacturer` where
// `manufacturer` is the raw `IfcOrganization` returned by `add_organisation` -- never
// wrapped via `add_actor` into an actual `IfcActor` first, even though
// `IfcRelAssignsToActor.RelatingActor` is schema-typed as `IfcActor`, not
// `IfcOrganization`; the same example also references an undefined `organisation`
// variable in its `add_address` call (clearly meant to say `manufacturer`) -- both
// harmless copy-paste docstring mistakes with zero effect on this function's actual
// behavior, matching `./removeApplication.ts`'s own precedent for not reproducing a
// plainly-broken Python docstring example verbatim. This port's own example below
// wraps `manufacturer` in a real `IfcActor` first (via `addActor`), which is the
// schema-correct usage the docstring's prose (not its example) actually describes.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "./createOwnerHistory";
import { updateOwnerHistory } from "./updateOwnerHistory";

export interface AssignActorSettings {
	/** The `IfcActor` who is responsible for the object. */
	relatingActor: EntityInstance;
	/** The object the actor is responsible for. */
	relatedObject: EntityInstance;
}

function assignActorUsecase(file: IfcFile, settings: AssignActorSettings): EntityInstance {
	const { relatingActor, relatedObject } = settings;

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const rel of hasAssignments) {
		if (rel.isA("IfcRelAssignsToActor") && (rel.get("RelatingActor") as EntityInstance).equals(relatingActor)) {
			return rel;
		}
	}

	const isActingUpon = relatingActor.get("IsActingUpon") as EntityInstance[];
	let rel: EntityInstance | null = isActingUpon.length ? isActingUpon[0] : null;

	if (rel) {
		const relatedObjects = [...(rel.get("RelatedObjects") as EntityInstance[])];
		relatedObjects.push(relatedObject);
		rel.set("RelatedObjects", relatedObjects);
		updateOwnerHistory(file, { element: rel });
	} else {
		// `IfcRelAssignsToActor`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
		// RelatedObjects(4), RelatedObjectsType(5), RelatingActor(6), ActingRole(7) --
		// see header comment.
		rel = file.createEntity(
			"IfcRelAssignsToActor",
			guid.new(),
			createOwnerHistory(file, {}),
			null,
			null,
			[relatedObject],
			null,
			relatingActor,
		);
	}
	return rel;
}

/**
 * Assigns an actor to an object (Python: `ifcopenshell.api.owner.assign_actor`).
 *
 * An actor may be assigned to objects which implies that the actor is responsible for.
 * This is most commonly used in facility management for indicating the manufacturers,
 * suppliers, and warrantors for product types.
 *
 * See this file's own header comment for a real, disclosed Python quirk: a single
 * `IfcActor` only ever accumulates at most one `IfcRelAssignsToActor` relationship
 * across its entire lifetime -- every subsequent `assignActor` call for the same
 * `relatingActor` reuses and grows that same rel, regardless of which `relatedObject`
 * is being assigned.
 *
 * @returns The `IfcRelAssignsToActor` relationship.
 *
 * @example
 * ```ts
 * const pumpType = api.root.createEntity(model, { ifcClass: "IfcPumpType" });
 * const manufacturer = api.owner.addOrganisation(model, { identification: "PWP", name: "Pumps With Power" });
 * api.owner.addRole(model, { assignedObject: manufacturer, role: "MANUFACTURER" });
 * const actor = api.owner.addActor(model, { actor: manufacturer });
 * api.owner.assignActor(model, { relatingActor: actor, relatedObject: pumpType });
 * ```
 */
export const assignActor = wrapUsecase("owner.assign_actor", assignActorUsecase);
