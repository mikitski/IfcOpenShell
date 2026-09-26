// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/add_structural_member_connection.py`
// (src/ifcopenshell-python, 43 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Reuse-or-create
// shape: scans the connection's own `ConnectsStructuralMembers` inverse (an
// `IfcRelConnectsStructuralMember[]`, read via `.get()` even though it has no forward
// declaration in the generated `.d.ts`s -- inverse attributes never do, matching
// `../group/assignGroup.ts`'s own `IsGroupedBy` precedent) for an existing rel already
// linking the same `relatingStructuralMember`; if none is found, creates a new
// `IfcRelConnectsStructuralMember` (an `IfcRoot` subtype, confirmed identical across
// all 3 schemas) via the already-landed `api.root.createEntity`.
//
// Real Python's `related_structural_connection.ConnectsStructuralMembers or []` is a
// no-op defensive fallback (an empty tuple is already falsy but also already iterable
// the same way `[]` would be) -- not ported as a separate `?? []`, since `.get()`
// already returns `[]` (never `null`/`undefined`) for an empty SET-typed inverse,
// matching every other already-landed inverse-attribute read in this codebase.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";

export interface AddStructuralMemberConnectionSettings {
	/** The `IfcStructuralMember` to have a connection added to it. */
	relatingStructuralMember: EntityInstance;
	/** The `IfcStructuralConnection` to add to the `IfcStructuralMember`. */
	relatedStructuralConnection: EntityInstance;
}

function addStructuralMemberConnectionUsecase(
	file: IfcFile,
	settings: AddStructuralMemberConnectionSettings,
): EntityInstance {
	const { relatingStructuralMember, relatedStructuralConnection } = settings;
	const connectsStructuralMembers = relatedStructuralConnection.get("ConnectsStructuralMembers") as EntityInstance[];
	for (const connection of connectsStructuralMembers) {
		const existingMember = connection.get("RelatingStructuralMember") as EntityInstance;
		if (existingMember.equals(relatingStructuralMember)) {
			return connection;
		}
	}
	const rel = createEntity(file, { ifcClass: "IfcRelConnectsStructuralMember" });
	rel.set("RelatingStructuralMember", relatingStructuralMember);
	rel.set("RelatedStructuralConnection", relatedStructuralConnection);
	return rel;
}

/**
 * Relates a structural member and a structural connection (Python:
 * `ifcopenshell.api.structural.add_structural_member_connection`).
 *
 * @returns The `IfcRelConnectsStructuralMember` relationship.
 */
export const addStructuralMemberConnection = wrapUsecase(
	"structural.add_structural_member_connection",
	addStructuralMemberConnectionUsecase,
);
