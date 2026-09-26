// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/remove_structural_boundary_condition.py`
// (src/ifcopenshell-python, 49 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Two independent
// modes, matching real Python's own `if connection: ... else: ...` shape exactly:
// (1) `connection` given -- removes the condition (if any) attached to that
// connection, purging it only if this connection was its sole reference
// (`getTotalInverses(...) === 1`); (2) `connection` omitted -- treats `boundaryCondition`
// as an orphaned condition, clearing `AppliedCondition` on every real `getInverse`
// referencing it (real Python has no `is_a` filter here at all -- ANY inverse gets
// `AppliedCondition = None` set on it unconditionally, which would throw for an
// inverse that doesn't declare that attribute; not a scenario expected in practice
// since only structural connections ever reference an `IfcBoundaryCondition`, but
// ported verbatim with no defensive `is_a` check this port would be adding on its
// own), then removes the condition itself.
//
// Real Python's `assert boundary_condition, "..."` (the `else` branch's guard) is
// ported as a thrown `Error` with the identical message -- the direct TS equivalent
// of an uncaught Python `AssertionError`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveStructuralBoundaryConditionSettings {
	/**
	 * The `IfcStructuralConnection` to remove the condition from. If omitted, it is
	 * assumed to be an orphaned condition.
	 */
	connection?: EntityInstance | null;
	/** The `IfcBoundaryCondition` to remove. */
	boundaryCondition?: EntityInstance | null;
}

function removeStructuralBoundaryConditionUsecase(
	file: IfcFile,
	settings: RemoveStructuralBoundaryConditionSettings,
): void {
	const { connection, boundaryCondition } = settings;

	if (connection) {
		// remove boundary condition from a connection
		const appliedCondition = connection.get("AppliedCondition") as EntityInstance | null;
		if (!appliedCondition) {
			return;
		}
		if (file.getTotalInverses(appliedCondition) === 1) {
			file.remove(appliedCondition);
		}
		connection.set("AppliedCondition", null);
	} else {
		if (!boundaryCondition) {
			throw new Error("Either connection or boundary_condition must be provided.");
		}
		// remove the boundary condition
		for (const conn of file.getInverse(boundaryCondition) as Set<EntityInstance>) {
			conn.set("AppliedCondition", null);
		}
		file.remove(boundaryCondition);
	}
}

/**
 * Removes a condition from a connection, or an orphaned boundary condition (Python:
 * `ifcopenshell.api.structural.remove_structural_boundary_condition`).
 */
export const removeStructuralBoundaryCondition = wrapUsecase(
	"structural.remove_structural_boundary_condition",
	removeStructuralBoundaryConditionUsecase,
);
