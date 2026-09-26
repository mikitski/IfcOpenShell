// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/create_baseline.py` (src/ifcopenshell-python, 104
// lines). LAST of this module's FINAL chunk (see `./index.ts`'s own header comment for
// the full module history) -- this file completes `api.sequence` at 40/40 real files.
// Ported after `duplicateTask` (a real dependency, this chunk's own line 77).
//
// Real dependencies (confirmed by reading the whole real file): already-landed
// `api.control.assignControl`, `api.owner.createOwnerHistory`/`updateOwnerHistory`,
// `guid`, `util.sequence.getRootTasks`, `./addWorkSchedule.ts` (already landed, chunk
// 1), and this SAME chunk's own `./duplicateTask.ts`.
//
// --- Throws if `work_schedule.PredefinedType !== "PLANNED"` (a real Python
//     `ValueError`, ported as a thrown `Error`) -- BUT see the schema finding below for
//     when this check is even reached ---
//
// --- Schema finding: `IfcWorkSchedule.PredefinedType` does NOT exist on IFC2X3 at all
//     -- confirmed against the generated `.d.ts`s (chunk 1's own already-disclosed
//     finding). This function therefore throws EARLIER on IFC2X3 than the `ValueError`
//     check itself -- an undeclared-attribute read (`work_schedule.get("PredefinedType")`
//     throws "has no attribute 'PredefinedType'"), not the documented `ValueError` --
//     confirmed by reading `ifc2x3.d.ts`'s own `IfcWorkSchedule` shape (`WorkControlType`/
//     `UserDefinedControlType` instead of `PredefinedType`, matching real Python's own
//     unguarded behavior: no IFC2X3-specific branch exists there either). IFC4X3 has an
//     identical `PredefinedType` shape to IFC4 (confirmed against `ifc4x3.d.ts`), so this
//     function works identically on IFC4/IFC4X3 and only diverges (via the EARLIER,
//     different throw) on IFC2X3 -- real Python's own test file
//     (`test_create_baseline.py`) is IFC4-only for this same reason, this port's own test
//     widens coverage to IFC4X3 too but still excludes IFC2X3, with a dedicated test
//     pinning the EARLIER, different throw kind (not the `ValueError`).
//
// --- `createBaselineReference`: a near-verbatim copy of `duplicateTask.ts`'s own DEAD
//     `createObjectReference` method -- but THIS one genuinely IS called (twice: once
//     for the schedule itself, once per duplicated root task) -- do not conflate the two ---
//
// See `duplicateTask.ts`'s own header comment for the full disclosure of its sibling,
// dead method. This one is real, live code, exercised directly by real Python's own
// `test_references_the_planned_schedule_and_tasks`/
// `test_reuses_the_existing_reference_for_further_baselines` tests (ported below).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getRootTasks } from "../../util/sequence";
import { assignControl } from "../control/assignControl";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { addWorkSchedule } from "./addWorkSchedule";
import { duplicateTask } from "./duplicateTask";

class CreateBaselineContext {
	constructor(private readonly file: IfcFile) {}

	execute(workSchedule: EntityInstance, name: string | null | undefined): EntityInstance {
		// See this file's header comment: on IFC2X3, `PredefinedType` is undeclared, so
		// this `.get()` itself throws BEFORE the `ValueError` check below is ever
		// reached -- ported as an unguarded read, matching real Python's own
		// unconditional attribute access exactly.
		if (workSchedule.get("PredefinedType") !== "PLANNED") {
			throw new Error("Only a PLANNED work schedule can be baselined.");
		}
		// See this file's header comment: `./addWorkSchedule.ts`'s own settings type
		// (`name?: string`, chunk 1) has no way to distinguish "omitted, use the
		// `'Unnamed'` default" from "explicitly `null`/falsy, keep it `null`" -- none of
		// its own callers needed that distinction before this file. Real Python's
		// `name=name or work_schedule.Name` genuinely can (and, per
		// `test_leaves_the_name_null_when_both_names_are_omitted`, must) evaluate to
		// `None` and stay `None`, not silently fall back to "Unnamed". Computed here,
		// then corrected below with a direct `.set()` when both names are falsy, rather
		// than widening the already-landed sibling's own interface (out of scope for
		// this chunk) or accepting the wrong default value.
		// Python: `name or work_schedule.Name` -- `or`, not a `None`-only coalesce, so
		// an explicitly-empty-string `name` also falls through to `work_schedule.Name`
		// (JS's `||` has the same falsy-string semantics as Python's `or` here).
		const computedName = name || (workSchedule.get("Name") as string | null) || null;
		const baselineWorkSchedule = addWorkSchedule(this.file, {
			name: computedName ?? undefined,
			predefinedType: "BASELINE",
		});
		if (!computedName) {
			baselineWorkSchedule.set("Name", null);
		}
		this.createBaselineReference(workSchedule, baselineWorkSchedule);
		for (const summaryTask of getRootTasks(workSchedule)) {
			const [current, duplicate] = duplicateTask(this.file, { task: summaryTask });
			assignControl(this.file, { relatingControl: baselineWorkSchedule, relatedObjects: [duplicate[0]] });
			for (let i = 0; i < current.length; i++) {
				this.createBaselineReference(current[i], duplicate[i]);
			}
		}
		return baselineWorkSchedule;
	}

	/**
	 * Python: `create_baseline_reference` -- see this file's header comment: near-
	 * verbatim copy of `duplicateTask.ts`'s own DEAD `createObjectReference`, but this
	 * one is genuinely live/called.
	 */
	private createBaselineReference(relatingObject: EntityInstance, relatedObject: EntityInstance): EntityInstance {
		let referencedBy: EntityInstance | null = null;
		const declares = relatingObject.get("Declares") as EntityInstance[];
		if (declares.length > 0) {
			referencedBy = declares[0];
		}
		if (referencedBy) {
			const relatedObjects = [...(referencedBy.get("RelatedObjects") as EntityInstance[])];
			relatedObjects.push(relatedObject);
			referencedBy.set("RelatedObjects", relatedObjects);
			updateOwnerHistory(this.file, { element: referencedBy });
		} else {
			referencedBy = this.file.createEntity(
				"IfcRelDefinesByObject",
				guid.new(),
				createOwnerHistory(this.file, {}),
				null, // Name
				null, // Description
				[relatedObject], // RelatedObjects
				relatingObject, // RelatingObject
			);
		}
		return referencedBy;
	}
}

export interface CreateBaselineSettings {
	/** The planned `IfcWorkSchedule` to baseline. Must have `predefinedType === "PLANNED"`. */
	workSchedule: EntityInstance;
	/** The baseline work schedule name. Falls back to `workSchedule`'s own `Name` when omitted. */
	name?: string | null;
}

function createBaselineUsecase(file: IfcFile, settings: CreateBaselineSettings): EntityInstance {
	return new CreateBaselineContext(file).execute(settings.workSchedule, settings.name);
}

/**
 * Creates a baseline for a work schedule (Python: `ifcopenshell.api.sequence.create_baseline`).
 *
 * Using a work schedule with `predefinedType === "PLANNED"`, a baseline can be created.
 * The new `IfcWorkSchedule` will have `predefinedType === "BASELINE"`, and its
 * `CreationDate` indicates the date of the baseline creation, and `Name` indicates the
 * name of the baseline.
 *
 * The following relationships are also baselined:
 *
 * - Same tasks and attributes.
 * - Same task relationships.
 * - Same construction resources.
 * - Same resource relationships.
 *
 * @returns The new baseline `IfcWorkSchedule`.
 *
 * @example
 * ```ts
 * const planned = api.sequence.addWorkSchedule(model, { name: "Planned Construction Schedule", predefinedType: "PLANNED" });
 * const baseline = api.sequence.createBaseline(model, { workSchedule: planned, name: "Baseline 1" });
 * ```
 */
export const createBaseline = wrapUsecase("sequence.create_baseline", createBaselineUsecase);
