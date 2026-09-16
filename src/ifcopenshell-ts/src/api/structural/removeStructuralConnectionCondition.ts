// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/remove_structural_connection_condition.py`
// (src/ifcopenshell-python, 40 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Removes an
// `IfcRelConnectsStructuralMember` relation, first delegating to this same module's
// own `./removeStructuralBoundaryCondition.ts` (matching real Python's own
// self-import: `ifcopenshell.api.structural` importing back into itself) if the
// relation has an `AppliedCondition`, then removing the relation itself with the usual
// `if history:`-guarded `removeDeep2` cascade. Real Python's own comment: "the
// condition and the member itself is preserved" -- only the rel and (via the
// delegated call) its condition are removed, never the structural member/connection
// themselves.
//
// --- A real, disclosed, verbatim-preserved orphan-condition bug ---
//
// The `if relation.AppliedCondition:` guard checks the REL's own `AppliedCondition`
// attribute, but the delegated call passes `connection=relation.
// RelatedStructuralConnection` (the UNWRAPPED connection) to `remove_structural_
// boundary_condition` -- which in turn checks/clears `connection.AppliedCondition`
// (the CONNECTION's own, separate attribute), NOT the rel's. If a condition was
// attached via `./addStructuralBoundaryCondition.ts` with a REL as `connection` (which
// itself sets `AppliedCondition` on the rel, not the unwrapped connection -- see that
// file's own header comment for this same asymmetry from the other direction), this
// mismatch means the delegated call's own `if not connection.AppliedCondition: return`
// guard fires immediately (the unwrapped connection's `AppliedCondition` was never
// set), so the condition entity is never actually removed -- only `relation` itself is,
// a few lines later. The condition is left as a genuine ORPHAN in the file (zero
// remaining inverses, but never `file.remove()`d) rather than being purged. Ported
// verbatim -- this is real Python's own mismatch, not a bug this port introduces --
// confirmed by this file's own dedicated regression test
// (`test/api/structural/removeStructuralConnectionCondition.test.ts`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removeStructuralBoundaryCondition } from "./removeStructuralBoundaryCondition";

export interface RemoveStructuralConnectionConditionSettings {
	/** The `IfcRelConnectsStructuralMember` to remove. */
	relation: EntityInstance;
}

function removeStructuralConnectionConditionUsecase(
	file: IfcFile,
	settings: RemoveStructuralConnectionConditionSettings,
): void {
	const { relation } = settings;
	if (relation.get("AppliedCondition")) {
		removeStructuralBoundaryCondition(file, {
			connection: relation.get("RelatedStructuralConnection") as EntityInstance,
		});
	}
	const history = relation.get("OwnerHistory") as EntityInstance | null;
	file.remove(relation);
	if (history) elementUtil.removeDeep2(file, history);
}

/**
 * Removes a relationship between a connection and a condition (Python:
 * `ifcopenshell.api.structural.remove_structural_connection_condition`).
 *
 * The condition and the member itself is preserved.
 */
export const removeStructuralConnectionCondition = wrapUsecase(
	"structural.remove_structural_connection_condition",
	removeStructuralConnectionConditionUsecase,
);
