// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/edit_resource_time.py` (src/ifcopenshell-python,
// 99 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment). The most involved file in this module: resolves
// the owning `IfcResource` via `file.get_inverse`, applies date/duration string
// conversion per-attribute, respects hard metric constraints (skipping a locked
// attribute entirely), and -- only when `ScheduleUsage` is written under a hard
// `Usage.ScheduleWork` constraint -- triggers a task-duration recalculation.
//
// --- BLOCKED (disclosed, narrow): `ifcopenshell.api.sequence.calculate_task_duration`
//     is NOT ported -- `api.sequence` (40 files, ~4257 lines) has no TS port of any
//     kind and is out of scope for this chunk ---
//
// Real Python's own final `if` block: when `name == "ScheduleUsage"` AND
// `get_metric_constraints(resource, "Usage.ScheduleWork")` is non-empty (i.e.
// `ScheduleWork` is under SOME metric constraint, hard or soft -- note this check is
// NOT `is_hard_constraint`-gated the way the earlier per-attribute skip is), it looks
// up the resource's assigned task (`util.resource.getTaskAssignments`, already landed)
// and, if one exists, calls `ifcopenshell.api.sequence.calculate_task_duration(file,
// task=task)`. This port throws a clear, descriptive `Error` ONLY at that exact call
// site (`task` resolved to a real entity, matching real Python's own `if task:` guard)
// -- never proactively, and never before every other attribute in `attributes` has
// already been fully applied up to and including this one (`resourceTime.set(name,
// value)` for `ScheduleUsage` itself has ALREADY happened by this point, matching what
// real Python's own call ordering -- `setattr` before the `calculate_task_duration`
// call -- would also have already committed before reaching the real function).
// Tracked in `TODOS.md`.
//
// --- Real, disclosed Python quirk: `"RemainingTime"` should almost certainly read
//     `"RemainingWork"` -- ported verbatim, NOT "corrected" ---
//
// Real Python's duration-conversion branch: `elif name == "ScheduleWork" or name ==
// "ActualWork" or name == "RemainingTime":` -- but `IfcResourceTime` has no
// `RemainingTime` attribute at all; the real attribute (confirmed against
// `ifc4.d.ts`'s/`ifc4x3.d.ts`'s `IfcResourceTime` interface) is `RemainingWork`. Notably,
// the SIBLING class `IfcTaskTime` (edited by the unported `api.sequence.edit_task_time`)
// genuinely DOES have a `RemainingTime` attribute (confirmed against `ifc4.d.ts`) -- this
// strongly suggests the literal string here is a copy-paste artifact from that sibling
// function, not a deliberate choice. This looks like a genuine upstream typo: passing
// `attributes: { RemainingWork: "P2D" }`
// (a string, already valid `IfcDuration` form) happens to still work by coincidence
// (the string is written as-is, `datetime2ifc` conversion or not), but passing a parsed
// `Duration`/date-like object for `RemainingWork` -- the way `ScheduleWork`/`ActualWork`
// support -- would be written UNCONVERTED into a `string`-typed attribute, which this
// port's own `EntityInstance.setByIndex` (matching the real SWIG-bound `setattr`) would
// reject as a genuine schema type mismatch. Ported exactly as `"RemainingTime"`, not
// silently "fixed" to `"RemainingWork"` -- a dedicated regression test in
// `editResourceTime.test.ts` pins this exact, disclosed, non-obvious behavior (a raw
// `Duration` object passed for `RemainingWork` reaches `.set()` unconverted).
//
// --- Real, disclosed Python quirk: the CALLER's own `attributes` dict is mutated in
//     place (`del attributes[...]`), NOT reproduced here -- same established
//     divergence as `../pset_template/editPropTemplate.ts`'s own precedent ---
//
// Real Python's `del attributes["ScheduleFinish"]`/`del attributes["ActualFinish"]`
// delete keys from whatever dict object the CALLER passed in -- a real, visible side
// effect on the caller's own object. Matching `editPropTemplate.ts`'s own established
// divergence for the identical shape, this port takes a shallow copy of
// `settings.attributes` first, so the CALLER's TS object is left untouched, while the
// FUNCTIONAL behavior (a present-but-superseded `ScheduleFinish`/`ActualFinish` key is
// always excluded from the generic per-attribute loop below) is preserved exactly.
//
// --- `next(e for e in self.file.get_inverse(resource_time) if e.is_a("IfcResource"))`
//     -- StopIteration-on-not-found, ported via a thrown `Error` ---
//
// Real Python's `next(...)` with no default raises `StopIteration` if `resource_time`
// has no owning `IfcResource` inverse (should never happen for a well-formed
// `IfcResourceTime` reached only via `../resource/addResourceTime.ts`'s own
// `resource.Usage = resourceTime` forward assignment, which always keeps the inverse
// consistent) -- ported via a thrown `Error` at the same point, disclosing the
// divergence in exception TYPE (a plain `Error`, not Python's `StopIteration`) rather
// than silently returning `undefined` and continuing.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getMetricConstraints, isHardConstraint } from "../../util/constraint";
import { type Datetime2IfcInput, datetime2ifc } from "../../util/date";
import { getTaskAssignments } from "../../util/resource";
import { wrapUsecase } from "../hooks";

/** Python: `next(e for e in self.file.get_inverse(resource_time) if e.is_a("IfcResource"))`.
 * See this file's header comment for the disclosed StopIteration-vs-Error divergence. */
function getResource(file: IfcFile, resourceTime: EntityInstance): EntityInstance {
	for (const inverse of file.getInverse(resourceTime) as Set<EntityInstance>) {
		if (inverse.isA("IfcResource")) return inverse;
	}
	throw new Error("editResourceTime: no owning IfcResource found for this IfcResourceTime.");
}

export interface EditResourceTimeSettings {
	/** The `IfcResourceTime` entity you want to edit. */
	resourceTime: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editResourceTimeUsecase(file: IfcFile, settings: EditResourceTimeSettings): void {
	const { resourceTime } = settings;
	const resource = getResource(file, resourceTime);

	// See this file's header comment: a shallow copy, not a mutation of the caller's
	// own object.
	const attributes = { ...settings.attributes };

	// If the user specifies both an end date and a duration, the duration takes
	// priority. `delete` (not an `undefined` assignment -- biome's own suggested fix)
	// is required here: the key must be fully absent from the loop below
	// (`Object.entries`), not merely present with an `undefined` value, which would
	// still call `resourceTime.set("ScheduleFinish", undefined)`, a real, incorrect
	// write real Python's own `del` never makes.
	if (attributes.ScheduleWork && "ScheduleFinish" in attributes) {
		// biome-ignore lint/performance/noDelete: see the comment above this `if`.
		delete attributes.ScheduleFinish;
	}
	if (attributes.ActualWork && "ActualFinish" in attributes) {
		// biome-ignore lint/performance/noDelete: see the comment above the `ScheduleFinish` `if`.
		delete attributes.ActualFinish;
	}

	for (const [name, rawValue] of Object.entries(attributes)) {
		const metrics = getMetricConstraints(resource, `Usage.${name}`);
		if (metrics && isHardConstraint(metrics[0])) continue;

		let value = rawValue;
		if (value) {
			if (name.includes("Start") || name.includes("Finish") || name === "StatusTime") {
				value = datetime2ifc(value as Datetime2IfcInput, "IfcDateTime");
			} else if (name === "ScheduleWork" || name === "ActualWork" || name === "RemainingTime") {
				// NOTE (disclosed Python quirk, see this file's header comment): real
				// Python literally checks `"RemainingTime"`, not the actual
				// `IfcResourceTime.RemainingWork` attribute name. Ported verbatim.
				value = datetime2ifc(value as Datetime2IfcInput, "IfcDuration");
			}
		}
		resourceTime.set(name, value);

		if (name === "ScheduleUsage" && getMetricConstraints(resource, "Usage.ScheduleWork")) {
			const task = getTaskAssignments(resource);
			if (task) {
				// BLOCKED (disclosed, see this file's header comment and `TODOS.md`):
				// `ifcopenshell.api.sequence.calculate_task_duration` is not ported.
				// Everything up to and including this exact point (all attributes
				// processed so far, `ScheduleUsage` itself already written) has been
				// applied, matching what real Python's own call ordering would also
				// have already committed before reaching this call.
				throw new Error(
					"editResourceTime: api.sequence.calculateTaskDuration is not ported yet -- see TODOS.md. " +
						"This is only reached when editing ScheduleUsage on a resource whose Usage.ScheduleWork " +
						"has a metric constraint AND the resource is assigned to a task.",
				);
			}
		}
	}
}

/**
 * Edits the attributes of an `IfcResourceTime` (Python: `ifcopenshell.api.resource.edit_resource_time`).
 *
 * For more information about the attributes and data types of an `IfcResourceTime`,
 * consult the IFC documentation.
 *
 * See this file's header comment for a disclosed, narrow blocker
 * (`api.sequence.calculateTaskDuration` is not ported) and two disclosed, verbatim-
 * preserved Python quirks (a literal `"RemainingTime"` typo that should read
 * `"RemainingWork"`, and the resolved-owning-resource lookup's StopIteration-vs-Error
 * divergence).
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * const labour = api.resource.addResource(model, { parentResource: crew, ifcClass: "IfcLaborResource" });
 * const time = api.resource.addResourceTime(model, { resource: labour });
 * api.resource.editResourceTime(model, { resourceTime: time, attributes: { ScheduleWork: "P16H" } });
 * ```
 */
export const editResourceTime = wrapUsecase("resource.edit_resource_time", editResourceTimeUsecase);
