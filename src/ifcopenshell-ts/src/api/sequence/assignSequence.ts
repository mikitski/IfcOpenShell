// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/assign_sequence.py` (src/ifcopenshell-python, 132
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Creates an `IfcRelSequence` between two tasks (predecessor/
// successor), deduplicating against an existing match, then cascades the schedule from
// the predecessor.
//
// `api.owner.createOwnerHistory` (already landed), `guid` (already landed), and
// `./cascadeSchedule.ts` (this chunk, ported first -- see that file's own header
// comment) are the only real dependencies -- confirmed by reading the whole real file.
// The real call to `cascade_schedule` at the end (line 130 of the real file) is a REAL
// dependency, distinct from the docstring's own separate example call to
// `cascade_schedule` further down (line 107) -- both happen to exist in this file, only
// one is the actual production code path.
//
// --- DELIBERATE, disclosed match rule: `(RelatingProcess, SequenceType)`, NOT just the
//     `(RelatingProcess, RelatedProcess)` pair -- ported verbatim, per this chunk's own
//     brief ---
//
// Real Python's own dedup loop (`for rel in related_process.IsSuccessorFrom or []: if
// rel.RelatingProcess == relating_process and rel.SequenceType == sequence_type: return
// rel`) matches on BOTH the relating process AND the sequence type -- confirmed by an
// inline comment in the real source explaining this is intentional: two tasks may
// legitimately be sequenced more than once with different types, the classic case being
// a "ladder" relationship (e.g. a START_START lets the follower begin once the leader has
// begun, and a separate FINISH_FINISH stops it ending before the leader ends -- both
// constraints are real and neither implies the other). Matching on the pair alone would
// silently hand back the wrong relationship for a second, different-typed sequence
// between the same two tasks, and editing the type on it would destroy a constraint that
// was already there. Ported verbatim, NOT simplified to a single-field match.
//
// `IfcRelSequence`: `GlobalId`(0), `OwnerHistory`(1), `Name`(2), `Description`(3),
// `RelatingProcess`(4), `RelatedProcess`(5), `TimeLag`(6), `SequenceType`(7) --
// identical positional order across all 3 schemas (confirmed against `ifc2x3.d.ts`/
// `ifc4.d.ts`/`ifc4x3.d.ts`); only `UserDefinedSequenceType`(8, IFC4/IFC4X3-only) and
// `TimeLag`'s own declared type (`number`/`IfcTimeMeasure` on IFC2X3 vs. `IfcLagTime` on
// IFC4+, a genuine, disclosed schema-shape difference not otherwise relevant here since
// this function never populates `TimeLag`) differ -- neither ever populated by this
// function (only `GlobalId`/`OwnerHistory`/`RelatingProcess`/`RelatedProcess`/
// `SequenceType` are, matching real Python's own kwargs-only call), so no schema-
// availability gap for `IfcRelSequence` itself: present, positionally identical up to
// `SequenceType`, on all 3 schemas.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { cascadeSchedule } from "./cascadeSchedule";

export interface AssignSequenceSettings {
	/** The previous / predecessor task. */
	relatingProcess: EntityInstance;
	/** The next / successor task. */
	relatedProcess: EntityInstance;
	/** Choose from FINISH_START, FINISH_FINISH, START_START, or START_FINISH. Python default: `"FINISH_START"`. */
	sequenceType?: string;
}

function assignSequenceUsecase(file: IfcFile, settings: AssignSequenceSettings): EntityInstance {
	const { relatingProcess, relatedProcess } = settings;
	const sequenceType = settings.sequenceType ?? "FINISH_START";

	// See this file's header comment: matched on BOTH `RelatingProcess` AND
	// `SequenceType`, deliberately -- not just the pair.
	const isSuccessorFrom = (relatedProcess.get("IsSuccessorFrom") as EntityInstance[] | null) ?? [];
	for (const rel of isSuccessorFrom) {
		if (
			(rel.get("RelatingProcess") as EntityInstance).equals(relatingProcess) &&
			rel.get("SequenceType") === sequenceType
		) {
			return rel;
		}
	}

	const rel = file.createEntity(
		"IfcRelSequence",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		relatingProcess,
		relatedProcess,
		null, // TimeLag
		sequenceType,
	);
	cascadeSchedule(file, { task: relatingProcess });
	return rel;
}

/**
 * Assign a sequential relationship between tasks (Python:
 * `ifcopenshell.api.sequence.assign_sequence`).
 *
 * Tasks in construction sequencing typically have sequence relationships between them,
 * indicating that one task must happen after another. This is used to automatically
 * compute new start and end dates and cascade changes when dates are changed. This is
 * also used to calculate critical paths and floats.
 *
 * There are four types of sequence relationships, known as finish to start, finish to
 * finish, start to start, and start to finish, sometimes abbreviated as FS, FF, SS, and
 * SF. The most common is the finish to start relationship, indicating that the previous
 * task must finish before the next task can start.
 *
 * You must not create cyclical task sequences. This makes the computer unhappy.
 *
 * Note that "previous" or "next" does not necessarily mean the task chronologically
 * happens before or after. They simply indicate the order of the sequence relationship.
 * For this reason, they are often called predecessor and successor tasks in the planning
 * profession.
 *
 * Two tasks may legitimately be sequenced more than once with a different
 * `sequenceType` each time (see this file's header comment) -- a repeat call with the
 * SAME `sequenceType` for the same pair returns the existing relationship instead of
 * creating a duplicate.
 *
 * @returns The newly created (or matched) `IfcRelSequence`.
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 * const formwork = api.sequence.addTask(model, { workSchedule: schedule, name: "Formwork", identification: "C.1" });
 * const reinforcement = api.sequence.addTask(model, { workSchedule: schedule, name: "Reinforcement", identification: "C.2" });
 * api.sequence.assignSequence(model, { relatingProcess: formwork, relatedProcess: reinforcement });
 * ```
 */
export const assignSequence = wrapUsecase("sequence.assign_sequence", assignSequenceUsecase);
