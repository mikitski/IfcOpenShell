// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/unassign_lag_time.py` (src/ifcopenshell-python, 62
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Removes a sequence's lag time (deleting the `IfcLagTime`
// entirely if nothing else references it, otherwise just nulling the reference), then
// cascades the schedule from the successor task.
//
// `./cascadeSchedule.ts` (this chunk, ported first) is the only real dependency --
// confirmed by reading the whole real file.
//
// --- `file.get_total_inverses(current_lag_time := rel_sequence.TimeLag)` called
//     UNCONDITIONALLY, even when `TimeLag` is falsy -- ported verbatim, no guard added ---
//
// Real Python's walrus assignment reads `rel_sequence.TimeLag` and immediately passes
// whatever it is (including `None`, if the sequence has no lag time at all) straight
// into `file.get_total_inverses(...)` with no truthiness check first -- this throws in
// real Python (`get_total_inverses(None)` has no meaningful "id" to look up) whenever
// `rel_sequence` has no `TimeLag` set. Ported verbatim: `file.getTotalInverses(null)`
// below is expected to throw the same way against this port's own native primitive
// layer (not proactively guarded with an `if (currentLagTime)` check real Python itself
// doesn't have).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { cascadeSchedule } from "./cascadeSchedule";

export interface UnassignLagTimeSettings {
	/** The sequence to remove the lag time from. */
	relSequence: EntityInstance;
}

function unassignLagTimeUsecase(file: IfcFile, settings: UnassignLagTimeSettings): void {
	const { relSequence } = settings;
	const currentLagTime = relSequence.get("TimeLag") as EntityInstance | null;
	// See this file's header comment: unconditional, no guard for a falsy `TimeLag`,
	// matching real Python's own unguarded walrus-then-lookup.
	if (file.getTotalInverses(currentLagTime as EntityInstance) === 1) {
		file.remove(currentLagTime as EntityInstance);
	} else {
		relSequence.set("TimeLag", null);
	}
	cascadeSchedule(file, {
		task: relSequence.get("RelatedProcess") as EntityInstance,
	});
}

/**
 * Removes any lag time in a sequence (Python:
 * `ifcopenshell.api.sequence.unassign_lag_time`).
 *
 * The schedule is cascaded afterwards.
 *
 * See this file's header comment: real Python (and this port) reads and immediately
 * looks up `rel_sequence.TimeLag`'s total inverses with no truthiness guard, so calling
 * this on a sequence with no lag time set throws.
 *
 * @example
 * ```ts
 * const sequence = api.sequence.assignSequence(model, { relatingProcess: zone1, relatedProcess: zone2 });
 * // ... some lag time was assigned to `sequence` ...
 * api.sequence.unassignLagTime(model, { relSequence: sequence });
 * ```
 */
export const unassignLagTime = wrapUsecase("sequence.unassign_lag_time", unassignLagTimeUsecase);
