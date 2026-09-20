// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/duplicate_task.py` (src/ifcopenshell-python, 195
// lines) -- the first of this module's FINAL chunk (4 files: `duplicate_task`,
// `recalculate_schedule`, `copy_work_schedule`, `create_baseline` -- see `./index.ts`'s
// own header comment for the full module history). Ported FIRST within this chunk, per
// this chunk's own brief: `copy_work_schedule`/`create_baseline` both have a REAL
// dependency on it. Recursively duplicates a task (and its nested subtasks), copying
// property sets and re-pointing "indirect" (inverse) attributes at the duplicate.
//
// Real dependencies (confirmed by reading the whole real file): already-landed
// `api.nest.unassignObject`/`assignObject`, `util.element.copy`/`copyDeep`, and --
// critically -- this SAME module's already-landed `assignSequence` (chunk 3, real call
// at line 155 of the real file, inside `copy_sequence_relationship`) and `assignLagTime`
// (chunk 1, real call at line 162, itself fully blocked -- see that file's own header
// comment). An older dependency-mapping pass had classified this file as having zero
// real sibling dependency -- a false positive from the file's own docstring `.. code::
// python` example block (lines 50/56), which references `assign_sequence`-shaped API
// but isn't a real call; both real dependencies are landed, so this file is portable.
//
// --- `copy_indirect_attributes`'s generic by-INDEX attribute scan: `EntityInstance
//     .attributeCount()`/`.getByIndex()`/`.setByIndex()` already exist and are already
//     used exactly this way (`util/element.ts`'s own `copy`/`copyDeep`) -- NO new
//     primitive needed ---
//
// Real Python's `for i, value in enumerate(inverse): ... inverse[i] = new_value` relies
// on `entity_instance_mixin.__iter__`/`__getitem__`/`__setitem__` to scan every FORWARD
// attribute of `inverse` generically, by index, regardless of name. This port's
// `EntityInstance` class already exposes the exact equivalent (`attributeCount()`,
// `getByIndex(i)`, `setByIndex(i, value)` -- `entityInstance.ts`'s own ported
// `__getitem__`/`__setitem__`), and `util/element.ts`'s `copy`/`copyDeep` already
// consume it this same generic way. No new primitive or local helper was needed here.
//
// --- The single-value vs. list-value sub-branches below use genuinely DIFFERENT
//     strategies (clone-and-redirect vs. append-in-place) -- deliberate, not a bug,
//     even though the "never touch the local variable named `new_inverse`/`inverse`
//     again" shape looks suspicious at first glance ---
//
// Real Python's generic by-index scan (the final `else` arm, lines 119-127):
//
//   if value == from_element:
//       new_inverse = ifcopenshell.util.element.copy(self.file, inverse)
//       new_inverse[i] = to_element
//   elif isinstance(value, (tuple, list)) and from_element in value:
//       new_value = list(value)
//       new_value.append(to_element)
//       inverse[i] = new_value
//
// An earlier pass of this file's own analysis flagged the first sub-branch as a
// "confirmed bug" (an orphaned entity, since the local Python variable `new_inverse` is
// never read again) -- that was WRONG, corrected here after tracing it through more
// carefully: `copy()` clones EVERY attribute of `inverse` (not just the one matching
// `from_element`), so `new_inverse` ends up a fully valid, independent relationship --
// same `RelatedObjects`/`Name`/etc. as the original, just with the ONE single-valued
// attribute that pointed at `from_element` (e.g. `IfcRelAssignsToProcess
// .RelatingProcess`, which cannot hold two values at once) redirected to `to_element`
// instead. Once that attribute is set, `to_element` genuinely references `new_inverse`
// at the STEP level -- discoverable via `file.getInverse(toElement)`/real Python's
// `get_inverse` -- regardless of whether any Python/JS variable still points at it. This
// is the ONLY way to give a duplicate a same-shaped relationship when the attribute
// connecting it can't hold more than one value; the SECOND sub-branch (a list/tuple-
// valued attribute, which CAN hold multiple values, e.g. `IfcRelAssignsToProduct
// .RelatedObjects`) instead appends `to_element` into the SAME existing list on the
// ORIGINAL `inverse`, avoiding a redundant near-duplicate entity where one isn't
// needed. Both are correct, complementary strategies for the same underlying goal
// ("give `to_element` an equivalent relationship to whatever `from_element` had"),
// dictated entirely by whether the attribute's own cardinality allows appending or
// requires cloning. Ported verbatim either way. Verified empirically (not just by
// re-reading the source) via `duplicateTask.test.ts`'s own dedicated pins for both
// branches.
//
// --- Real Python's own docstring OVER-claims what this function does for a ROOT
//     (work-schedule-controlled) task -- confirmed by reading the actual code, not
//     assumed from the docstring alone ---
//
// The docstring says: "The copy will be assigned to the parent task or work schedule."
// True for the "parent task" half (the `IfcRelNests` branch above genuinely re-nests a
// duplicated subtask under its own parent's duplicate) -- but FALSE for the "work
// schedule" half: `copy_indirect_attributes`'s own `elif inverse.is_a
// ("IfcRelAssignsToControl") and inverse.RelatingControl.is_a("IfcWorkSchedule"):
// continue` explicitly SKIPS re-assigning a duplicated ROOT task to its own work
// schedule. Calling `duplicateTask` directly on a root, schedule-controlled task
// produces a duplicate that is NOT connected to any work schedule at all -- confirmed
// by a dedicated test. This is exactly why `./copyWorkSchedule.ts`'s own real Python
// source makes its own explicit `assign_control` call after `duplicate_task` returns
// (see that file's own header comment) -- the docstring's claim only holds true when
// `duplicateTask` is used THROUGH `copyWorkSchedule`, not standalone.
//
// --- `createObjectReference`: a CONFIRMED, PROVABLY DEAD method -- ported anyway,
//     disclosed, not silently dropped ---
//
// Defined on the real `Usecase` class but never called anywhere within it: `execute`
// only ever calls `self.duplicate_task(task)` and `self.copy_sequence_relationship()`
// (confirmed by reading the whole real file). It's a near-verbatim copy of
// `./createBaseline.ts`'s own `createBaselineReference` private method -- which IS
// genuinely called there (twice) -- do not conflate the two: this one is dead, that one
// is live. Ported here anyway, per this project's "preserve verbatim" discipline for
// real Python source that exists but is unreachable, matching `removeTask.ts`'s own
// precedent for a provably-dead branch in this same module.
//
// --- `copy_sequence_relationship`: the `relating_process`/`related_process`
//     initialization (lines 139-143) is PROVABLY INERT -- read in full, not guessed from
//     the ambiguous "thus the ... process is not part of the duplicated tasks" comments
//     alone ---
//
// For each `original_task`/its matching `IfcRelSequence` inverse, real Python:
//   1. Initializes `relating_process, related_process = None, None`.
//   2. Sets ONE of them to `duplicated_task` (the current `original_task`'s own
//      duplicate), based on which side of the rel `original_task` is on.
//   3. THEN unconditionally recomputes and overwrites BOTH variables via two
//      independent, generic `original_tasks`-membership checks (lines 144-153) -- each
//      one checks whether `inverse.RelatedProcess`/`inverse.RelatingProcess` (not
//      `original_task` specifically) is anywhere in the whole `original_tasks` list,
//      and either substitutes its own duplicate or falls back to the original,
//      untouched entity ("thus the ... process is not part of the duplicated tasks").
// Step 3's own two checks are a superset of step 2's: whichever variable step 2 set is
// ALWAYS one of the two sides checked again in step 3 (since `original_task` IS either
// `inverse.RelatingProcess` or `inverse.RelatedProcess`, by the outer `if` that reached
// this branch at all), so step 3 always recomputes the identical value step 2 already
// assigned, then unconditionally overwrites it anyway. Step 2's assignment is therefore
// NEVER actually read before being replaced -- inert, not a functional bug (the final
// values are correct either way), but genuinely redundant. Ported verbatim below
// (cheap, zero risk of diverging from the real source), with this note in place of
// re-deriving the logic from the comments alone.
//
// Also note: real Python's own `for i, original_task in enumerate(original_tasks):`
// never actually uses `i` (the redundant `original_tasks.index(original_task)` a few
// lines later always evaluates to the same value as the discarded `i`) -- ported here
// via a plain `for...of` with no index, and `indexOfEntity` standing in for the
// `.index()` lookups (which, unlike the outer one, are NOT redundant: they scope over
// the WHOLE list, not just the current task).
//
// --- `TimeLag`/`LagValue` branch: no `is_a("IfcDuration")` vs `"IfcRatioMeasure")`
//     check, unlike `cascadeSchedule.ts`'s own careful branching -- a THIRD confirmed
//     instance of the same real Python quirk `recalculateSchedule.ts`'s own header
//     comment discloses ---
//
// `ifcopenshell.util.date.ifc2datetime(inverse.TimeLag.LagValue.wrappedValue)` is called
// unconditionally, with no check for whether `LagValue` is an `IfcDuration` (a string) or
// an `IfcRatioMeasure` (a plain float, e.g. "150% of the predecessor's own duration").
// `util/date.ts`'s own `ifc2datetime` treats a plain `number` input as an `IfcTimeStamp`
// (epoch seconds) -- so a ratio-typed `LagValue` here would be silently misinterpreted as
// a moment in time near the Unix epoch, not a ratio. Moot in practice: this whole branch
// is reached only when `inverse.TimeLag` is truthy, and nothing in this port can ever
// populate a real, valued `IfcLagTime.TimeLag` in the first place (`assignLagTime`,
// chunk 1, is fully blocked -- see below), so this specific misinterpretation is
// currently unreachable via any code path this port can construct. Disclosed for
// completeness, matching `recalculateSchedule.ts`'s own identical finding.
//
// --- `assignLagTime` call: FULLY BLOCKED (chunk 1's already-tracked primitive-layer
//     gap), a further confirmed consequence -- ported faithfully, not guarded around ---
//
// `copy_sequence_relationship`'s own call to `assign_lag_time` (real line 162, only
// reached when a matched `IfcRelSequence`'s `TimeLag` is truthy) hits the exact same
// `TODOS.md` "cannot write an initial value into a freshly created simple/defined-type
// instance" gap `assignLagTime.ts`'s own header comment already documents in full.
// Since nothing in this port can construct a populated `IfcLagTime.TimeLag` on an
// `IfcRelSequence` in the first place (the only way to populate `TimeLag` at all is
// `assignLagTime`/`editLagTime`, BOTH already fully blocked), this call site is not
// reachable via any fixture this port's own test suite can build -- disclosed here,
// consistent with `cascadeSchedule.ts`'s own precedent for the identical situation
// (ported completely and faithfully, disclosed, no dedicated blocked-path test forced
// since the path can't be reached without the primitive-layer fix landing first). Also
// note: real Python passes `ifc2datetime(...)`'s own PARSED return value (a `Duration`)
// as `lag_value`, not a raw string, even though `assign_lag_time`'s own declared
// parameter type is `str` -- this "works" in real Python only because
// `datetime2ifc` duck-types its input; this port's own `AssignLagTimeSettings.lagValue`
// is typed strictly as `string`, so the call below needs a type assertion to satisfy the
// stricter TS signature -- moot at runtime either way, since `assignLagTime` throws
// before ever consulting this value's runtime shape.
//
// Schema availability: unaffected by this file's own logic (no schema-specific
// branching in real Python here) -- inherits whichever of `IfcRelNests`/
// `IfcRelDefinesByProperties`/`IfcRelSequence`/`IfcRelAssignsToControl`/
// `IfcRelDefinesByObject`/`IfcLagTime` each already-disclosed sibling file's own
// schema-availability finding applies (all exist on IFC2X3 except `IfcLagTime`, per
// `./index.ts`'s own chunk 1/3 findings).

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { ifc2datetime } from "../../util/date";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { assignObject as assignNestObject } from "../nest/assignObject";
import { unassignObject as unassignNestObject } from "../nest/unassignObject";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { assignLagTime } from "./assignLagTime";
import { assignSequence } from "./assignSequence";

/** Python's `original_tasks.index(x)` (a value-equality lookup, not `===`), returning
 * `-1` (not raising) when absent -- callers below check for `-1` themselves, matching
 * each real call site's own `in`-guarded or `in`-then-`.index()` usage. */
function indexOfEntity(list: readonly EntityInstance[], target: EntityInstance): number {
	return list.findIndex((e) => e.equals(target));
}

class DuplicateTaskContext {
	private readonly current: EntityInstance[] = [];
	private readonly duplicate: EntityInstance[] = [];

	constructor(private readonly file: IfcFile) {}

	execute(task: EntityInstance): [EntityInstance[], EntityInstance[]] {
		this.duplicateTask(task);
		this.copySequenceRelationship();
		return [this.current, this.duplicate];
	}

	private duplicateTask(task: EntityInstance): EntityInstance {
		const newTask = elementUtil.copyDeep(this.file, task);
		this.current.push(task);
		this.duplicate.push(newTask);
		this.copyIndirectAttributes(task, newTask);
		return newTask;
	}

	private copyIndirectAttributes(fromElement: EntityInstance, toElement: EntityInstance): void {
		for (const inverse of this.file.getInverse(fromElement) as Set<EntityInstance>) {
			if (inverse.isA("IfcRelDefinesByProperties")) {
				const newInverse = elementUtil.copy(this.file, inverse);
				newInverse.set("RelatedObjects", [toElement]);
				const pset = elementUtil.copyDeep(this.file, newInverse.get("RelatingPropertyDefinition") as EntityInstance);
				newInverse.set("RelatingPropertyDefinition", pset);
			} else if (inverse.isA("IfcRelNests") && (inverse.get("RelatingObject") as EntityInstance).equals(fromElement)) {
				const nestedTasks = inverse.get("RelatedObjects") as EntityInstance[];
				if (nestedTasks.length > 0) {
					const newTasks: EntityInstance[] = [];
					for (const t of nestedTasks) {
						newTasks.push(this.duplicateTask(t));
					}
					const newInverse = elementUtil.copy(this.file, inverse);
					newInverse.set("RelatingObject", toElement);
					newInverse.set("RelatedObjects", newTasks);
					unassignNestObject(this.file, { relatedObjects: newTasks });
					assignNestObject(this.file, { relatedObjects: newTasks, relatingObject: toElement });
				}
			} else if (
				inverse.isA("IfcRelSequence") &&
				((inverse.get("RelatingProcess") as EntityInstance).equals(fromElement) ||
					(inverse.get("RelatedProcess") as EntityInstance).equals(fromElement))
			) {
				// Python: bare `continue` -- handled entirely by `copySequenceRelationship`.
			} else if (
				inverse.isA("IfcRelAssignsToControl") &&
				(inverse.get("RelatingControl") as EntityInstance).isA("IfcWorkSchedule")
			) {
				// Python: bare `continue`.
			} else if (inverse.isA("IfcRelDefinesByObject")) {
				// Python: bare `continue`.
			} else {
				// See this file's header comment: generic by-index scan, already supported
				// directly by `EntityInstance.attributeCount()`/`getByIndex()`/`setByIndex()` --
				// no new primitive needed.
				const count = inverse.attributeCount();
				for (let i = 0; i < count; i++) {
					const value = inverse.getByIndex(i);
					if (value instanceof EntityInstance && value.equals(fromElement)) {
						// See this file's header comment: clones `inverse` (every attribute,
						// not just this one) and redirects ONLY this single-valued attribute to
						// `toElement` -- genuinely wired into the graph via that attribute value
						// (discoverable via `file.getInverse(toElement)`), not an orphan, even
						// though no variable here keeps a reference to `newInverse` afterward.
						const newInverse = elementUtil.copy(this.file, inverse);
						newInverse.setByIndex(i, toElement);
					} else if (Array.isArray(value) && value.some((v) => v instanceof EntityInstance && v.equals(fromElement))) {
						const newValue = [...(value as unknown[]), toElement];
						inverse.setByIndex(i, newValue);
					}
				}
			}
		}
	}

	private copySequenceRelationship(): void {
		const originalTasks = this.current;
		const duplicatedTasks = this.duplicate;
		// Python: `for i, original_task in enumerate(original_tasks):` -- `i` itself is
		// never used (see this file's header comment); a plain iteration is equivalent.
		for (const originalTask of originalTasks) {
			for (const inverse of this.file.getInverse(originalTask) as Set<EntityInstance>) {
				// `isA` must be checked FIRST (matching Python's own short-circuiting
				// `and`) -- `RelatingProcess`/`RelatedProcess` don't exist on every
				// inverse type `getInverse` can return (e.g. `IfcRelNests`,
				// `IfcRelDefinesByProperties`), so reading them unconditionally would
				// throw for every non-`IfcRelSequence` inverse.
				if (!inverse.isA("IfcRelSequence")) continue;
				const relatingProcessAttr = inverse.get("RelatingProcess") as EntityInstance;
				const relatedProcessAttr = inverse.get("RelatedProcess") as EntityInstance;
				if (relatingProcessAttr.equals(originalTask) || relatedProcessAttr.equals(originalTask)) {
					const originalTaskIndex = indexOfEntity(originalTasks, originalTask);
					const duplicatedTask = duplicatedTasks[originalTaskIndex];

					// See this file's header comment: this initial assignment is PROVABLY
					// INERT -- both checks below unconditionally recompute and overwrite
					// both variables regardless of what's assigned here. Ported verbatim.
					let relatingProcess: EntityInstance | null = null;
					let relatedProcess: EntityInstance | null = null;
					if (relatingProcessAttr.equals(originalTask)) {
						relatingProcess = duplicatedTask;
					} else {
						relatedProcess = duplicatedTask;
					}

					const relatedProcessIndex = indexOfEntity(originalTasks, relatedProcessAttr);
					if (relatedProcessIndex !== -1) {
						relatedProcess = duplicatedTasks[relatedProcessIndex];
					} else {
						// thus the related process is not part of the duplicated tasks
						relatedProcess = relatedProcessAttr;
					}

					const relatingProcessIndex = indexOfEntity(originalTasks, relatingProcessAttr);
					if (relatingProcessIndex !== -1) {
						relatingProcess = duplicatedTasks[relatingProcessIndex];
					} else {
						// thus the relating process is not part of the duplicated tasks
						relatingProcess = relatingProcessAttr;
					}

					if (relatingProcess && relatedProcess) {
						const rel = assignSequence(this.file, {
							relatingProcess,
							relatedProcess,
							sequenceType: inverse.get("SequenceType") as string,
						});
						const timeLag = inverse.get("TimeLag") as EntityInstance | null;
						if (timeLag) {
							// See this file's header comment: FULLY BLOCKED (chunk 1's already-
							// tracked primitive-layer gap) -- not reachable via any fixture this
							// port can build (nothing can populate a real `TimeLag` in the first
							// place). Ported faithfully anyway.
							const lagValueEntity = timeLag.get("LagValue") as EntityInstance | null;
							const lagValue = lagValueEntity ? ifc2datetime(lagValueEntity.getByIndex(0) as string | number) : null;
							assignLagTime(this.file, {
								relSequence: rel,
								// See this file's header comment: real Python passes a parsed
								// value, not a raw string -- moot since `assignLagTime` throws
								// before ever consulting it. Cast to satisfy this port's own
								// stricter `lagValue: string` signature.
								lagValue: lagValue as unknown as string,
								durationType: timeLag.get("DurationType") as string,
							});
						}
					}
				}
			}
		}
	}

	/**
	 * Python: `create_object_reference` -- see this file's header comment: a CONFIRMED,
	 * PROVABLY DEAD method. `execute` above only ever calls `duplicateTask`/
	 * `copySequenceRelationship` -- this method is never invoked anywhere in this class.
	 * Near-verbatim copy of `./createBaseline.ts`'s own `createBaselineReference`
	 * private method, which IS genuinely called there (do not conflate the two). Ported
	 * anyway, per this project's "preserve verbatim" discipline for real, unreachable
	 * Python source -- not exercised by any test (there is nothing to call it with).
	 */
	private createObjectReference(relatingObject: EntityInstance, relatedObject: EntityInstance): EntityInstance {
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

export interface DuplicateTaskSettings {
	/** The `IfcTask` to duplicate. */
	task: EntityInstance;
}

/**
 * Python's tuple return: `(current, duplicate)` -- `current[0]` is the original `task`
 * passed in (plus every one of its own original nested subtasks); `duplicate[i]` is
 * `current[i]`'s own corresponding duplicate, at the same index.
 */
export type DuplicateTaskResult = [current: EntityInstance[], duplicate: EntityInstance[]];

function duplicateTaskUsecase(file: IfcFile, settings: DuplicateTaskSettings): DuplicateTaskResult {
	return new DuplicateTaskContext(file).execute(settings.task);
}

/**
 * Duplicates a task in the project (Python: `ifcopenshell.api.sequence.duplicate_task`).
 *
 * The following relationships are also duplicated:
 *
 * - The copy will have the same attributes and property sets as the original task.
 * - The copy will be assigned to the parent task or work schedule.
 * - The copy will have duplicated nested tasks.
 *
 * @returns A tuple of two lists of tasks: the original task and its nested tasks, and
 * their corresponding duplicated tasks (same order, same index).
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 * const original = api.sequence.addTask(model, { workSchedule: schedule, name: "Design new feature" });
 * const [originalTasks, duplicatedTasks] = api.sequence.duplicateTask(model, { task: original });
 * console.log(duplicatedTasks[0]); // A copy of `original`.
 * ```
 */
export const duplicateTask = wrapUsecase("sequence.duplicate_task", duplicateTaskUsecase);
