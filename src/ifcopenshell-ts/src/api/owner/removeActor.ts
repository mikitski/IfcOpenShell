// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/remove_actor.py` (src/ifcopenshell-python, 41 lines)
// -- removes an `IfcActor` (or `IfcOccupant`), cleaning up its `OwnerHistory` if it had
// one (matching `util/element.ts`'s `removeDeep2` cascade-cleanup convention already
// used throughout this codebase, e.g. `../group/removeGroup.ts`). No cascade into
// `TheActor` (the wrapped `IfcPerson`/`IfcOrganization`/`IfcPersonAndOrganization` is
// left untouched -- only the wrapper `IfcActor`/`IfcOccupant` itself is removed), and no
// cascade into `IsActingUpon`/`HasAssignments` relationships this actor may have (real
// Python's own `remove_actor.py` doesn't touch either -- ported verbatim, not "fixed" to
// also clean up any dangling `IfcRelAssignsToActor` this actor is `RelatingActor` of).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveActorSettings {
	/** The `IfcActor` (or `IfcOccupant`) to remove. */
	actor: EntityInstance;
}

function removeActorUsecase(file: IfcFile, settings: RemoveActorSettings): void {
	const { actor } = settings;
	const history = actor.get("OwnerHistory") as EntityInstance | null;
	file.remove(actor);
	if (history) elementUtil.removeDeep2(file, history);
}

/**
 * Removes an actor (Python: `ifcopenshell.api.owner.remove_actor`).
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * const actor = api.owner.addActor(model, { actor: organisation });
 * api.owner.removeActor(model, { actor });
 * ```
 */
export const removeActor = wrapUsecase("owner.remove_actor", removeActorUsecase);
