// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/add_role.py` (src/ifcopenshell-python, 51 lines) --
// creates a new `IfcActorRole` and appends it to `assignedObject.Roles` (an
// `IfcPerson`/`IfcOrganization`/`IfcPersonAndOrganization`).
//
// Real Python:
// ```python
// def add_role(file, assigned_object, role="ARCHITECT"):
//     element = file.create_entity("IfcActorRole", Role="ARCHITECT")
//     if role:
//         try:
//             element.Role = role
//         except:
//             element.Role = "USERDEFINED"
//             element.UserDefinedRole = role
//     roles = list(assigned_object.Roles) if assigned_object.Roles else []
//     roles.append(element)
//     assigned_object.Roles = roles
//     return element
// ```
//
// The `IfcActorRole` is ALWAYS first constructed with `Role="ARCHITECT"` regardless of
// the `role` argument -- then, only if `role` is truthy, an attempt is made to overwrite
// it with the actual requested value, falling back to `"USERDEFINED"`+`UserDefinedRole`
// if `role` isn't one of `IfcRoleEnum`'s built-in values. A falsy `role` (e.g. an
// explicit empty string) is therefore a real, ported-verbatim way to end up with an
// `IfcActorRole` whose `Role` is `"ARCHITECT"` even though the caller didn't ask for
// that default -- not "fixed" to skip the initial `"ARCHITECT"` construction in that
// case.
//
// `IfcActorRole`: `Role`(0), `UserDefinedRole`(1), `Description`(2) -- identical order
// in all 3 schemas, no DERIVE attributes (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts`).
//
// The `try`/`except` around `element.Role = role` relies on the same schema-validated
// enum-write-throws mechanism `../root/createEntity.ts`'s own header comment already
// investigated and confirmed (not merely assumed) for `PredefinedType`-style writes --
// reused here via a plain `try`/`catch` around `.set("Role", role)`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddRoleSettings {
	/** The `IfcPerson` or `IfcOrganization` the role should be assigned to. */
	assignedObject: EntityInstance;
	/**
	 * The type of role, taken from the IFC documentation for `IfcActorRole`, or a
	 * custom name. Python default: `"ARCHITECT"`.
	 */
	role?: string;
}

function addRoleUsecase(file: IfcFile, settings: AddRoleSettings): EntityInstance {
	const role = settings.role ?? "ARCHITECT";
	const { assignedObject } = settings;

	const element = file.createEntity("IfcActorRole", "ARCHITECT");
	if (role) {
		try {
			element.set("Role", role);
		} catch {
			element.set("Role", "USERDEFINED");
			element.set("UserDefinedRole", role);
		}
	}

	const roles = (assignedObject.get("Roles") as EntityInstance[] | null) ?? [];
	assignedObject.set("Roles", [...roles, element]);
	return element;
}

/**
 * Adds and assigns a new role (Python: `ifcopenshell.api.owner.add_role`).
 *
 * People and organisations must play one or more roles on a project. Roles include
 * architects, engineers, subcontractors, clients, manufacturers, etc. Typically these
 * roles and their corresponding responsibilities will be outlined in contractual
 * documents.
 *
 * This function will both add and assign the role to the person or organisation.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * api.owner.addRole(model, { assignedObject: organisation, role: "ARCHITECT" });
 * ```
 */
export const addRole = wrapUsecase("owner.add_role", addRoleUsecase);
