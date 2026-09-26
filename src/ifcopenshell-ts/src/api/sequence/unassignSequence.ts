// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/unassign_sequence.py` (src/ifcopenshell-python, 82
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Removes the sequence relationship(s) between two tasks
// (optionally scoped to one `sequenceType`), then cascades the schedule from the
// successor.
//
// `util.element.removeDeep2` (already landed) and `./cascadeSchedule.ts` (this chunk,
// ported first) are the only real dependencies -- confirmed by reading the whole real
// file.
//
// --- `sequence_type: Optional[str] = None` -- a genuinely later addition to the real
//     source (its own docstring cross-references `assign_sequence`'s own "ladder"
//     disclosure), NOT a simplification made by this port ---
//
// Two tasks may legitimately be sequenced more than once with different types (see
// `./assignSequence.ts`'s own header comment) -- removing "the" relationship between a
// pair is ambiguous, so the real source added this optional parameter: left unspecified,
// EVERY sequence between the two is removed (matching this function's own pre-existing
// behavior before the parameter existed); naming a type removes only that one sequence
// and leaves any others between the same pair in place.
//
// --- The removal loop does NOT `continue`/`return` early once one match is
//     found -- it removes EVERY matching rel, ported verbatim ---
//
// Unlike some sibling functions in this module (`./unassignProcess.ts`/
// `./unassignProduct.ts`) that stop at the first match, this loop has no early exit --
// realistically at most one rel matches a given `(relatingProcess, sequenceType)` pair
// (or, with `sequenceType` unspecified, one rel per distinct sequence type between the
// pair), but ported as a full, non-short-circuiting loop over `IsSuccessorFrom`, exactly
// matching the real Python `for`/`continue` structure.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { cascadeSchedule } from "./cascadeSchedule";

export interface UnassignSequenceSettings {
	/** The previous / predecessor task. */
	relatingProcess: EntityInstance;
	/** The next / successor task. */
	relatedProcess: EntityInstance;
	/** Optionally, remove only the sequence of this type. Choose from FINISH_START, FINISH_FINISH, START_START, or START_FINISH. */
	sequenceType?: string | null;
}

function unassignSequenceUsecase(file: IfcFile, settings: UnassignSequenceSettings): void {
	const { relatingProcess, relatedProcess, sequenceType } = settings;
	const isSuccessorFrom = (relatedProcess.get("IsSuccessorFrom") as EntityInstance[] | null) ?? [];
	for (const rel of isSuccessorFrom) {
		if (!(rel.get("RelatingProcess") as EntityInstance).equals(relatingProcess)) continue;
		if (sequenceType != null && rel.get("SequenceType") !== sequenceType) continue;
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) removeDeep2(file, history);
	}
	cascadeSchedule(file, { task: relatedProcess });
}

/**
 * Removes a sequence relationship between tasks (Python:
 * `ifcopenshell.api.sequence.unassign_sequence`).
 *
 * Two tasks may be sequenced more than once with different types -- see
 * `api.sequence.assignSequence` -- so removing "the" relationship between a pair is
 * ambiguous. Left unspecified, every sequence between the two is removed, which is what
 * "make them unrelated" means and what this did before the parameter existed. Name a
 * type to remove only that one and leave any others in place.
 *
 * @example
 * ```ts
 * api.sequence.assignSequence(model, { relatingProcess: zone1, relatedProcess: zone2 });
 * // Let's make them unrelated.
 * api.sequence.unassignSequence(model, { relatingProcess: zone1, relatedProcess: zone2 });
 * ```
 */
export const unassignSequence = wrapUsecase("sequence.unassign_sequence", unassignSequenceUsecase);
