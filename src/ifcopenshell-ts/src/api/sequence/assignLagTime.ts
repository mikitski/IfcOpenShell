// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/assign_lag_time.py` (src/ifcopenshell-python, 89
// lines) -- part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for
// this chunk's full scope). Assigns a lag time (`IfcLagTime`) to an `IfcRelSequence`
// (a task-to-task sequence relationship, e.g. finish-to-start), first freeing up any
// previous, now-orphaned `IfcLagTime` the same rel already carried.
//
// --- FULLY BLOCKED on every schema by the already-tracked `TODOS.md` primitive-layer
//     gap -- this is this gap's FIFTEENTH independent confirmed consequence ---
//
// The very first real statement (`duration = file.create_entity("IfcDuration",
// util.date.datetime2ifc(lag_value, "IfcDuration"))`) constructs a brand-new, standalone,
// VALUED simple/defined-type instance -- the exact operation `TODOS.md`'s "`EntityInstance
// .setByIndex`/`IfcFile.createEntity` cannot write an initial value into a freshly
// created simple/defined-type instance" entry documents as blocked (`file.createEntity
// (type, value)` -> `setByIndex(0, value)` -> the native `attribute_kind_of` primitive
// throws `"Attribute access is only supported on entity instances"` for any non-entity
// target). Confirmed empirically against this exact worktree's own built native addon
// before writing this file. This throws on EVERY schema, not just one -- unlike most of
// this gap's earlier-confirmed consequences, there is no schema on which this function
// currently works end-to-end. `TODOS.md`'s existing entry has been updated with this as a
// further confirmed instance, not filed as a new entry (matching this project's own
// established convention for this recurring gap).
//
// Ported completely and faithfully anyway, all the way through both real statements
// (`IfcDuration` creation, then `IfcLagTime` creation) -- left to fail naturally at the
// very first line, no proactive guard added. `test/api/sequence/assignLagTime.test.ts`
// pins this CURRENT, disclosed, blocked behavior with a dedicated test, matching
// `addApplication.test.ts`'s/`util/cost.test.ts`'s own established precedent for this
// exact gap.
//
// --- Schema availability: on IFC2X3, `IfcDuration` itself doesn't exist (confirmed
//     empirically, not just from the generated `.d.ts`s) -- an INDEPENDENT throw, reached
//     BEFORE the primitive-layer block above would even matter ---
//
// `IfcDuration` is an IFC4+-only defined type (IFC2X3 has no equivalent named type at
// all for a plain ISO 8601 duration string) -- confirmed empirically against this
// worktree's own built native addon: `file.createEntity("IfcDuration", ...)` on IFC2X3
// throws `"Entity with name 'IfcDuration' not found in schema 'IFC2X3'"` (a schema-
// declaration lookup failure, NOT the `attribute_kind_of` primitive-layer gate the rest
// of this file's header comment documents) -- confirming this function is unusable on
// IFC2X3 for TWO independent reasons, not just one. `IfcLagTime` also doesn't exist on
// IFC2X3 (confirmed against `src/generated/ifc2x3.d.ts`, zero matches, vs. `ifc4.d.ts`/
// `ifc4x3.d.ts`'s identical 5-attribute shape: `Name`/`DataOrigin`/
// `UserDefinedDataOrigin`/`LagValue`/`DurationType`) -- moot in practice, since the
// `IfcDuration` failure above happens first, but disclosed for completeness.
// `test/api/sequence/assignLagTime.test.ts` pins BOTH throws with dedicated,
// schema-appropriate assertions.
//
// --- The `is_a("IfcRelSequence")` guard only wraps the CLEANUP step, not the final
//     assignment -- ported verbatim, not "fixed" to guard both ---
//
// Real Python's `if rel_sequence.is_a("IfcRelSequence"):` (line 85) only guards the
// "remove the old, now-orphaned `TimeLag`" cleanup block -- the actual `rel_sequence.
// TimeLag = lag_time` assignment on the next line runs UNCONDITIONALLY, regardless of
// whether `rel_sequence` is really an `IfcRelSequence` at all. In practice this has no
// further observable consequence beyond the primitive-layer block above (nothing else in
// the schema declares a `TimeLag` attribute, so a non-`IfcRelSequence` argument would
// simply throw `"...has no attribute 'TimeLag'"` at that same final line) -- ported
// verbatim, disclosed rather than "corrected" to guard the whole function body.
//
// `util.date.datetime2ifc` (already landed) is the only real dependency besides the two
// bare `file.create_entity` calls -- confirmed by reading the whole real file.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { datetime2ifc } from "../../util/date";
import { wrapUsecase } from "../hooks";

export interface AssignLagTimeSettings {
	/** The `IfcRelSequence` to assign the lag time to. */
	relSequence: EntityInstance;
	/** An ISO standardised duration string, e.g. `"P1D"`. */
	lagValue: string;
	/**
	 * Choose from WORKTIME for the associated calendar-based lag times (recommended
	 * default), or ELAPSEDTIME to not follow the calendar. NOTDEFINED is also accepted
	 * but real Python's own docstring notes its behaviour is unclear. Python default:
	 * `"WORKTIME"`.
	 */
	durationType?: string;
}

function assignLagTimeUsecase(file: IfcFile, settings: AssignLagTimeSettings): EntityInstance {
	const durationType = settings.durationType ?? "WORKTIME";

	// See this file's header comment: blocked by the already-tracked `TODOS.md`
	// primitive-layer gap, on every schema. Left to fail naturally here.
	const duration = file.createEntity("IfcDuration", datetime2ifc(settings.lagValue, "IfcDuration"));
	// `IfcLagTime`: Name(0), DataOrigin(1), UserDefinedDataOrigin(2), LagValue(3),
	// DurationType(4) -- identical order on IFC4/IFC4X3 (confirmed against both
	// generated `.d.ts`s; absent from IFC2X3 entirely, see this file's header comment).
	// Only LagValue/DurationType are ever populated, matching real Python's own
	// kwargs-only call.
	const lagTime = file.createEntity("IfcLagTime", null, null, null, duration, durationType);

	if (settings.relSequence.isA("IfcRelSequence")) {
		const currentLagTime = settings.relSequence.get("TimeLag") as EntityInstance | null;
		if (currentLagTime && file.getTotalInverses(currentLagTime) === 1) {
			file.remove(currentLagTime);
		}
	}
	// Python: unconditional, NOT guarded by the `is_a` check above -- see this file's
	// header comment.
	settings.relSequence.set("TimeLag", lagTime);
	return lagTime;
}

/**
 * Assign a lag time to a sequence relationship between tasks (Python:
 * `ifcopenshell.api.sequence.assign_lag_time`).
 *
 * A task sequence (e.g. finish to start) may optionally have a lag time defined. This is
 * a fundamental concept in construction scheduling. The lag is defined as a duration, and
 * the duration is typically either calendar based (i.e. follows the working times and
 * holidays of the calendar) or elapsed time based (i.e. 24/7).
 *
 * A sequence may only have a single lag time defined. Negative lag times are allowed.
 *
 * See this file's header comment: CURRENTLY BLOCKED on every schema by an already-tracked
 * `TODOS.md` primitive-layer gap -- calling this always throws today.
 *
 * @returns The newly created `IfcLagTime`.
 */
export const assignLagTime = wrapUsecase("sequence.assign_lag_time", assignLagTimeUsecase);
