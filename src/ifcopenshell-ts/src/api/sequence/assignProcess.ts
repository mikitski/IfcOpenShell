// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/assign_process.py` (src/ifcopenshell-python, 130
// lines) -- part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for
// this chunk's full scope). Assigns `relatedObject` as an INPUT (or control, or resource
// -- the ICOM "Input" role) of `relatingProcess` (typically an `IfcTask`) via
// `IfcRelAssignsToProcess`, reusing/growing `relatingProcess.OperatesOn[0]` if one already
// exists.
//
// Structurally near-identical to `./assignProduct.ts` (both dedup against the RELATED
// object's own `HasAssignments`, then reuse-or-grow-or-create a single rel keyed off the
// RELATING entity's own inverse) -- the two real Python source files are themselves
// near-identical for the same reason (`IfcRelAssignsToProcess`/`IfcRelAssignsToProduct`
// are sibling `IfcRelAssigns` subtypes with the same shape), not a coincidence introduced
// by this port.
//
// --- REAL, CONFIRMED ASYMMETRY vs. `assignProduct`: the dedup-hit branch returns
//     `undefined`, not the existing assignment ---
//
// Read closely, not assumed from the surrounding docstring: this function's own dedup
// loop (`if assignment.is_a("IfcRelAssignsToProcess") and assignment.RelatingProcess ==
// relating_process: return`) is a BARE `return` -- Python's implicit `None`. `./
// assignProduct.ts`'s own analogous branch (`return assignment`) returns the existing
// relationship instead. These are two independently-written, near-identical functions in
// the same real Python file family that genuinely disagree on this one point -- ported
// verbatim here (`undefined`), not "fixed" to match its sibling's more useful behavior.
//
// `api.owner.updateOwnerHistory`/`guid` (already landed) are the only real dependencies
// besides the bare `file.create_entity` call -- confirmed by reading the whole real file.
// (`ifcopenshell.api.owner` is imported for both `update_owner_history` AND `create_owner_
// history`, the latter used inline at entity-creation time, matching this port's own
// `createOwnerHistory` import below.)
//
// `IfcRelAssignsToProcess`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
// RelatedObjects(4), RelatedObjectsType(5), RelatingProcess(6), QuantityInProcess(7) --
// identical order in all 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts`; only `OwnerHistory`'s nullability and `RelatedObjectsType`'s enum-vs-
// boolean type differ, neither ever populated here). Only `GlobalId`/`OwnerHistory`/
// `RelatedObjects`/`RelatingProcess` are ever populated, matching real Python's own
// kwargs-only call. No schema-availability gap for `IfcRelAssignsToProcess` itself --
// present identically in IFC2X3 too.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface AssignProcessSettings {
	/** The `IfcProcess` (typically `IfcTask`) that the input, control, or resource is related to. */
	relatingProcess: EntityInstance;
	/** The `IfcProduct` (for input), `IfcCostItem` (for control) or `IfcConstructionResource` (for resource). */
	relatedObject: EntityInstance;
}

function assignProcessUsecase(file: IfcFile, settings: AssignProcessSettings): EntityInstance | undefined {
	const { relatingProcess, relatedObject } = settings;

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const assignment of hasAssignments) {
		if (
			assignment.isA("IfcRelAssignsToProcess") &&
			(assignment.get("RelatingProcess") as EntityInstance).equals(relatingProcess)
		) {
			// See this file's header comment: real Python's own bare `return` here yields
			// `None`/`undefined` -- unlike `./assignProduct.ts`'s own analogous dedup
			// branch, which returns the existing `assignment` instead. Ported verbatim.
			return undefined;
		}
	}

	const operatesOnList = relatingProcess.get("OperatesOn") as EntityInstance[];
	let operatesOn: EntityInstance | null = operatesOnList.length > 0 ? operatesOnList[0] : null;

	if (operatesOn) {
		const relatedObjects = [...(operatesOn.get("RelatedObjects") as EntityInstance[]), relatedObject];
		operatesOn.set("RelatedObjects", relatedObjects);
		updateOwnerHistory(file, { element: operatesOn });
	} else {
		operatesOn = file.createEntity(
			"IfcRelAssignsToProcess",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			[relatedObject], // RelatedObjects
			null, // RelatedObjectsType
			relatingProcess, // RelatingProcess
		);
	}
	return operatesOn;
}

/**
 * Assigns an object as an input, control, or resource of a process (Python:
 * `ifcopenshell.api.sequence.assign_process`).
 *
 * Processes work using the ICOM (Input, Controls, Outputs, Mechanisms) paradigm in IFC.
 * This process model is commonly used in modeling manufacturing functions.
 *
 * For example, processes (such as tasks) consume Inputs and transform them into Outputs.
 * The process may only occur within the limits of Controls (e.g. cost items) and may
 * require Mechanisms (ISO9000 calls them Mechanisms, whereas IFC calls them resources,
 * such as raw materials, labour, or equipment).
 *
 * There are three main scenarios where an object may be related to a task: defining
 * inputs, controls, and resources of a process. For inputs, a product (i.e. wall) may be
 * defined as an input to a task, such as when the task is to demolish the wall.
 *
 * **Warning**: this function creates an **Input** relationship
 * (`IfcRelAssignsToProcess`), meaning the product is *consumed* or *operated on* by the
 * task -- the typical case is demolition or maintenance. If the task *constructs or
 * installs* a product, use `api.sequence.assignProduct` instead, which creates an
 * **Output** relationship (`IfcRelAssignsToProduct`).
 *
 * @returns The newly created (or grown) `IfcRelAssignsToProcess`, or `undefined` if
 * `relatedObject` was already assigned to `relatingProcess` (see this file's header
 * comment for a disclosed asymmetry vs. `assignProduct` here).
 *
 * @example
 * ```ts
 * const task = api.sequence.addTask(model, {
 *   workSchedule: schedule, name: "Demolish existing", predefinedType: "DEMOLITION",
 * });
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * // The wall is an INPUT to the demolition task (it will be consumed).
 * api.sequence.assignProcess(model, { relatingProcess: task, relatedObject: wall });
 * ```
 */
export const assignProcess = wrapUsecase("sequence.assign_process", assignProcessUsecase);
