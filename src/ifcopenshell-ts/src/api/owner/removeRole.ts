// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/remove_role.py` (src/ifcopenshell-python, 47 lines)
// -- the real, exported home for this function. `./internalCascadeHelpers.ts` had a
// private, unexported `removeRoleCascade` reproducing this exact same real Python
// source as a temporary stand-in (needed by `./removePerson.ts`/`./removeOrganisation.ts`
// before this chunk existed -- see that file's own header comment); this file's
// implementation is behaviorally identical (verified line-by-line against the same
// real Python source below), and `internalCascadeHelpers.ts`'s own copy has now been
// deleted in favor of `./removePerson.ts`/`./removeOrganisation.ts` calling this real,
// exported function directly.
//
// Real Python:
// ```python
// def remove_role(file, role):
//     for inverse in file.get_inverse(role):
//         if inverse.is_a() in ("IfcOrganization", "IfcPerson", "IfcPersonAndOrganization"):
//             if inverse.Roles == (role,):
//                 inverse.Roles = None
//         elif inverse.is_a("IfcResourceLevelRelationship"):
//             # IfcResourceConstraintRelationship or other rels with IfcResourceObjectSelect.
//             if inverse.RelatedResourceObjects == (role,):
//                 file.remove(inverse)
//     file.remove(role)
// ```
//
// Note the asymmetry, ported verbatim: on an `IfcOrganization`/`IfcPerson`/
// `IfcPersonAndOrganization` whose `Roles` is EXACTLY `(role,)` (this role, and only
// this role), the attribute is cleared to `None` -- the object itself is left intact.
// On an `IfcResourceLevelRelationship` (IFC4+ only) whose `RelatedResourceObjects` is
// exactly `(role,)`, the WHOLE relationship is removed instead of merely clearing the
// attribute -- because `IfcResourceLevelRelationship.RelatedResourceObjects` is a
// MANDATORY (non-optional) SET, so clearing it to empty/null would be schema-invalid;
// removing the whole rel is the only valid option. Both branches only act when `role`
// is the SOLE element of the respective SET (an exact `(role,)` match) -- a person/
// organisation/rel referencing `role` alongside other roles is left completely
// untouched in either branch, matching real Python's own `== (role,)` (not
// `role in ...`) checks.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveRoleSettings {
	/** The `IfcActorRole` to remove. */
	role: EntityInstance;
}

function removeRoleUsecase(file: IfcFile, settings: RemoveRoleSettings): void {
	const { role } = settings;
	for (const inverse of file.getInverse(role) as Set<EntityInstance>) {
		const type = inverse.isA();
		if (type === "IfcOrganization" || type === "IfcPerson" || type === "IfcPersonAndOrganization") {
			const roles = (inverse.get("Roles") as EntityInstance[] | null) ?? [];
			if (roles.length === 1 && roles[0].equals(role)) {
				inverse.set("Roles", null);
			}
		} else if (inverse.isA("IfcResourceLevelRelationship")) {
			const related = (inverse.get("RelatedResourceObjects") as EntityInstance[] | null) ?? [];
			if (related.length === 1 && related[0].equals(role)) {
				file.remove(inverse);
			}
		}
	}
	file.remove(role);
}

/**
 * Removes a role (Python: `ifcopenshell.api.owner.remove_role`).
 *
 * People and organisations using the role will be untouched. This may leave some of
 * them without roles.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * const role = api.owner.addRole(model, { assignedObject: organisation, role: "ARCHITECT" });
 * api.owner.removeRole(model, { role });
 * ```
 */
export const removeRole = wrapUsecase("owner.remove_role", removeRoleUsecase);
