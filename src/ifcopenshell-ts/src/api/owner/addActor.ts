// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/add_actor.py` (src/ifcopenshell-python, 68 lines) --
// creates a new `IfcActor` or `IfcOccupant` wrapping a person/organisation. This chunk
// (chunk 2 of 2, the "actor/role/address" family -- see `./index.ts`'s header comment)
// covers the last 11 real-Python files in `ifcopenshell/api/owner/`.
//
// Real Python's entire body: `actor_ = ifcopenshell.api.root.create_entity(file,
// ifc_class=ifc_class); actor_.TheActor = actor; return actor_` -- a thin wrapper
// around `root.create_entity` (already ported, reused directly below, matching this
// project's established "reuse the real ported exports, don't reinvent" rule). No
// `predefinedType`/`name` is ever passed, so `root.create_entity`'s own predefined-type
// bookkeeping and 2X3/4-defaults passes run with nothing to do for `IfcActor`/
// `IfcOccupant` specifically -- except one real, disclosed quirk:
//
// --- Disclosed quirk: `IfcOccupant.PredefinedType` is mandatory on IFC2X3, never set here ---
//
// `IfcOccupant.PredefinedType` is a MANDATORY (non-optional) attribute on IFC2X3 (`
// PredefinedType: IfcOccupantTypeEnum;`, no `| null`, confirmed against `ifc2x3.d.ts`)
// but OPTIONAL on IFC4+ (`IfcOccupantTypeEnum | null`, confirmed against `ifc4.d.ts`/
// `ifc4x3.d.ts`). `root.create_entity`'s own `handle2x3Defaults`/`handle4Defaults`
// passes only ever default `PredefinedType` for `IfcElementType` subtypes -- `IfcOccupant`
// is an `IfcActor` subtype, not an `IfcElementType`, so neither pass touches it. Real
// Python's `add_actor(file, ifc_class="IfcOccupant", ...)` therefore leaves a freshly
// created IFC2X3 `IfcOccupant` with `PredefinedType` unset -- schema-invalid until the
// caller separately calls `edit_actor`/sets it themselves. Ported verbatim, not "fixed"
// to synthesize a default `PredefinedType` real Python doesn't either.
//
// `IfcActor`/`IfcOccupant`: `GlobalId`(0), `OwnerHistory`(1), `Name`(2), `Description`(3),
// `ObjectType`(4), `TheActor`(5) -- identical order in all 3 schemas, no DERIVE
// attributes (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`). `TheActor` is
// set via a separate `.set()` call below, matching real Python's own separate
// `actor_.TheActor = actor` statement (not folded into the initial positional
// `createEntity` call, matching `root.createEntity.ts`'s own established convention of
// only ever seeding `GlobalId`/`OwnerHistory` positionally and setting everything else
// afterward).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity as rootCreateEntity } from "../root/createEntity";

/** Python: `ACTOR_TYPE = Literal["IfcActor", "IfcOccupant"]`. */
export type ActorType = "IfcActor" | "IfcOccupant";

export interface AddActorSettings {
	/**
	 * Most commonly, an `IfcOrganization` (in compliance with GDPR requirements for
	 * non personally identifiable information), or an `IfcPerson` if it is a sole
	 * individual, or an `IfcPersonAndOrganization` if a specific person is liable
	 * within an organisation and must be legally nominated.
	 */
	actor: EntityInstance;
	/** Either `"IfcActor"` or `"IfcOccupant"`. Python default: `"IfcActor"`. */
	ifcClass?: ActorType;
}

function addActorUsecase(file: IfcFile, settings: AddActorSettings): EntityInstance {
	// Python: `ifc_class = ifc_class or "IfcActor"` -- an explicit falsy override
	// (e.g. an empty string) also falls back to the default, matching real Python's
	// `or` (not just an `undefined` check).
	const ifcClass = settings.ifcClass || "IfcActor";
	const actor = rootCreateEntity(file, { ifcClass });
	actor.set("TheActor", settings.actor);
	return actor;
}

/**
 * Adds a new actor (Python: `ifcopenshell.api.owner.add_actor`).
 *
 * An actor is a person or an organisation who has a responsibility or role to play in
 * a project. Actor roles include design consultants, architects, engineers, cost
 * planners, suppliers, manufacturers, warrantors, owners, subcontractors, etc.
 *
 * Actors may either be project actors, who are responsible for the delivery of the
 * project, or occupants, who are responsible for the consumption of the project.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * api.owner.addRole(model, { assignedObject: organisation, role: "ARCHITECT" });
 * const actor = api.owner.addActor(model, { actor: organisation });
 * ```
 */
export const addActor = wrapUsecase("owner.add_actor", addActorUsecase);
