// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/remove_structural_load_group.py`
// (src/ifcopenshell-python, 39 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Real Python's own
// `# TODO: do a deep purge` self-flagged comment, ported verbatim.
//
// --- Multi-member rels are left alone, NOT a dangling-reference bug ---
//
// The `IfcRelAssignsToGroup`-removal loop only removes an inverse rel entirely when
// `load_group` is its SOLE `RelatedObjects` member (`len(inverse.RelatedObjects) ==
// 1`); a rel grouping `load_group` alongside OTHER objects too is left alone in this
// loop. This is NOT a dangling-reference bug, though it looks like one at first
// glance: `file.remove(load_group)` (both real Python's native core and this port's
// own `IfcFile.remove`, confirmed by reading `src/ifcparse/parse.cpp`'s
// `process_deletion_`) unconditionally scans every inverse of the entity being
// removed and splices it out of any `AGGREGATE_OF_ENTITY_INSTANCE`-typed attribute it
// appears in -- so a surviving multi-member rel's `RelatedObjects` is automatically
// shortened by one, with no dangling reference left at all. Confirmed empirically
// (see `test/api/structural/removeStructuralLoadGroup.test.ts`'s own regression test):
// removing one of two members of a shared rel leaves that rel alive with the OTHER
// member still correctly in `RelatedObjects` (length 1, not 2) -- so removing that
// remaining member next correctly hits the `len(inverse.RelatedObjects) == 1` branch
// and cleans up the rel too. Real Python's own `# TODO: do a deep purge` comment
// refers to `load_group`'s own CONTENTS (loads/etc. it groups) never being purged
// here, not to this reference-cleanup mechanism.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveStructuralLoadGroupSettings {
	/** The `IfcStructuralLoadGroup` to remove. */
	loadGroup: EntityInstance;
}

function removeStructuralLoadGroupUsecase(file: IfcFile, settings: RemoveStructuralLoadGroupSettings): void {
	const { loadGroup } = settings;
	// TODO: do a deep purge
	for (const inverse of file.getInverse(loadGroup) as Set<EntityInstance>) {
		if (inverse.isA("IfcRelAssignsToGroup") && (inverse.get("RelatedObjects") as EntityInstance[]).length === 1) {
			const history = inverse.get("OwnerHistory") as EntityInstance | null;
			file.remove(inverse);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
	const history = loadGroup.get("OwnerHistory") as EntityInstance | null;
	file.remove(loadGroup);
	if (history) elementUtil.removeDeep2(file, history);
}

/**
 * Removes a structural load group (Python:
 * `ifcopenshell.api.structural.remove_structural_load_group`).
 */
export const removeStructuralLoadGroup = wrapUsecase(
	"structural.remove_structural_load_group",
	removeStructuralLoadGroupUsecase,
);
