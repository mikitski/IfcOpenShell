// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_lag_time.py` (src/ifcopenshell-python, 85
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Attribute-setter loop over `attributes`, with a special case
// for `LagValue` (converted to a real `IfcRatioMeasure`/`IfcDuration` value first), then
// cascades the schedule for every `IfcRelSequence` this lag time is attached to.
//
// `util.date.datetime2ifc` and `./cascadeSchedule.ts` (this chunk, ported first) are the
// only real dependencies -- confirmed by reading the whole real file.
//
// --- The `LagValue` branch is BLOCKED by the already-tracked `TODOS.md` primitive-layer
//     gap whenever it's actually exercised -- this is that gap's SIXTEENTH independent
//     confirmed consequence (the fifteenth was `./assignLagTime.ts`, chunk 1) ---
//
// Real Python's `file.createIfcRatioMeasure(value)`/`file.createIfcDuration(...)` are
// the dynamic `f.createIfcWall(...)`-style shortcut methods `file.ts`'s own header
// comment (`createEntity`'s doc comment) explicitly says are "deliberately deferred" in
// this port -- their direct TS equivalent is a bare `file.createEntity("IfcRatioMeasure"/
// "IfcDuration", value)` call, which constructs a brand-new, standalone, VALUED
// simple/defined-type instance -- the exact operation the `TODOS.md` primitive-layer gap
// documents as blocked. Confirmed empirically against this exact worktree's own built
// native addon before writing this file (same underlying `attribute_kind_of` throw
// `./assignLagTime.ts`'s own header comment already documents in detail, not repeated
// here). This means calling `editLagTime` with a non-null `LagValue` in `attributes`
// throws unconditionally, on every schema -- but editing ANY OTHER attribute (e.g.
// `Name`, `DurationType`, or even `LagValue: null`) is fully portable and works fine,
// since those paths never touch the blocked construction at all. Ported completely and
// faithfully either way, no proactive guard added.
// `test/api/sequence/editLagTime.test.ts` pins both the working non-`LagValue` path and
// the blocked `LagValue` path with dedicated tests, matching `assignLagTime.test.ts`'s
// own established precedent for this exact gap.
//
// --- `isinstance(value, float)` -- Python's own float/duration-string disambiguation,
//     ported as `typeof value === "number"` ---
//
// A `LagValue` may be supplied either as a plain number (interpreted as an
// `IfcRatioMeasure`, e.g. "150% of the predecessor's duration") or as an ISO 8601
// duration string (interpreted as an `IfcDuration`, converted via `datetime2ifc`) --
// ported as the direct TS equivalent type check, `typeof value === "number"`.
//
// --- `[r for r in file.get_inverse(lag_time) if r.is_a("IfcRelSequence")]` -- cascades
//     from EVERY matching rel's `RelatedProcess`, not just the first ---
//
// Unlike some sibling functions in this module that only ever touch the first match,
// this loop genuinely iterates every `IfcRelSequence` referencing `lag_time` (in
// practice, per `./assignLagTime.ts`'s own docstring, "a sequence may only have a single
// lag time defined" -- so this realistically only ever matches 0 or 1 rel, but ported as
// a full loop, not simplified to a single lookup).
//
// Schema availability: `IfcLagTime`/`IfcDuration` do NOT exist on IFC2X3 at all
// (confirmed against `src/generated/ifc2x3.d.ts`/empirically against the native addon,
// matching `./assignLagTime.ts`'s own identical finding) -- unreachable on IFC2X3 in
// practice, moot alongside the primitive-layer block above.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { datetime2ifc } from "../../util/date";
import { wrapUsecase } from "../hooks";
import { cascadeSchedule } from "./cascadeSchedule";

export interface EditLagTimeSettings {
	/** The `IfcLagTime` entity you want to edit. */
	lagTime: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editLagTimeUsecase(file: IfcFile, settings: EditLagTimeSettings): void {
	const { lagTime } = settings;
	for (const [name, rawValue] of Object.entries(settings.attributes)) {
		let value = rawValue;
		if (name === "LagValue" && value !== null && value !== undefined) {
			// See this file's header comment: BLOCKED by the already-tracked `TODOS.md`
			// primitive-layer gap on every schema. Left to fail naturally here.
			if (typeof value === "number") {
				value = file.createEntity("IfcRatioMeasure", value);
			} else {
				value = file.createEntity("IfcDuration", datetime2ifc(value as string, "IfcDuration"));
			}
		}
		lagTime.set(name, value);
	}
	const inverses = file.getInverse(lagTime) as Set<EntityInstance>;
	for (const rel of inverses) {
		if (rel.isA("IfcRelSequence")) {
			cascadeSchedule(file, {
				task: rel.get("RelatedProcess") as EntityInstance,
			});
		}
	}
}

/**
 * Edits the attributes of an `IfcLagTime` (Python:
 * `ifcopenshell.api.sequence.edit_lag_time`).
 *
 * For more information about the attributes and data types of an `IfcLagTime`, consult
 * the IFC documentation.
 *
 * See this file's header comment: setting `LagValue` to a non-null value is CURRENTLY
 * BLOCKED on every schema by an already-tracked `TODOS.md` primitive-layer gap -- editing
 * any other attribute (or setting `LagValue` to `null`) works normally.
 *
 * @example
 * ```ts
 * // Change the name/duration type -- works normally.
 * api.sequence.editLagTime(model, { lagTime, attributes: { DurationType: "ELAPSEDTIME" } });
 * ```
 */
export const editLagTime = wrapUsecase("sequence.edit_lag_time", editLagTimeUsecase);
