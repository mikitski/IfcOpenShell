// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/group/add_group.py` (src/ifcopenshell-python, 57 lines) --
// the first of this project's `api.group` chunk (6 files; see `index.ts`'s own header
// comment for the module's overall scope). Trivially self-contained, structurally
// near-identical to `../layer/addLayer.ts`: a single `create_entity` call plus an
// `owner.create_owner_history` dependency (already landed).
//
// `IfcGroup`'s attribute order (`GlobalId`, `OwnerHistory`, `Name`, `Description`,
// `ObjectType`) is identical and contiguous across all 3 schemas' generated `.d.ts`
// files (`ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`) -- no
// `IfcGeometricRepresentationSubContext`-style DERIVE-attribute-interleaving gotcha
// here (verified directly against all three, not assumed): `IfcGroup` declares no
// DERIVE attributes at all. `GlobalId`/`OwnerHistory`/`Name`/`Description` are created
// positionally (matching `createEntity.ts`'s established "one `Transaction` create op,
// not N create+edit ops" convention) -- `ObjectType` is left unset entirely, matching
// real Python's own kwargs call, which never mentions it.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

export interface AddGroupSettings {
	/** The name of the group. Python default: `"Unnamed"`. */
	name?: string;
	/** The description of the purpose of the group. Python default: `null`. */
	description?: string | null;
}

function addGroupUsecase(file: IfcFile, settings: AddGroupSettings = {}): EntityInstance {
	const name = settings.name ?? "Unnamed";
	const description = settings.description ?? null;
	return file.createEntity("IfcGroup", guid.new(), createOwnerHistory(file, {}), name, description);
}

/**
 * Adds a new group (Python: `ifcopenshell.api.group.add_group`).
 *
 * An IFC group is an arbitrary collection of products, which are typically physical.
 * It may be used when there is no other more specific group which may be used. Other
 * types of groups include distribution systems, which group together products that are
 * connected and circulate a medium (such as fluid or electricity), or zones, which
 * group together spaces, or structural load groups, which group together loads for
 * structural analysis, or inventories, which are groups of assets.
 *
 * @example
 * ```ts
 * api.group.addGroup(model, { name: "Unit 1A" });
 * ```
 */
export const addGroup = wrapUsecase("group.add_group", addGroupUsecase);
