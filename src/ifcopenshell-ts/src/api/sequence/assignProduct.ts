// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/assign_product.py` (src/ifcopenshell-python, 91
// lines) -- part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for
// this chunk's full scope). Assigns `relatedObject` (typically an `IfcTask`) as the
// OUTPUT of `relatingProduct` (typically an `IfcProduct` that was constructed) via
// `IfcRelAssignsToProduct`, reusing/growing `relatingProduct.ReferencedBy[0]` if one
// already exists.
//
// Structurally near-identical to `./assignProcess.ts` (both dedup against the RELATED
// object's own `HasAssignments`, then reuse-or-grow-or-create a single rel keyed off the
// RELATING entity's own inverse) -- see that file's own header comment for the disclosed
// asymmetry between the two (this function's own dedup-hit branch returns the existing
// `assignment`, unlike `assignProcess`'s bare-`return`/`undefined`). Also structurally
// near-identical to the already-landed `api.drawing.assignProduct` (`../drawing/
// assignProduct.ts`'s own "any other `relatingProduct`" branch is this exact same
// reuse-or-grow-`ReferencedBy[0]` shape) -- confirmed by reading both real Python source
// files side by side, not assumed from the shared function name; THIS function has no
// `IfcGridAxis` special case at all (real `sequence.assign_product.py` has no such
// branch), so it is simpler than its `api.drawing` namesake, not a subset/duplicate of it.
//
// `api.owner.updateOwnerHistory`/`guid` (already landed) are the only real dependencies
// besides the bare `file.create_entity` call -- confirmed by reading the whole real file.
//
// `IfcRelAssignsToProduct`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
// RelatedObjects(4), RelatedObjectsType(5), RelatingProduct(6) -- identical order in all
// 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`; only
// `OwnerHistory`'s nullability and `RelatedObjectsType`'s enum-vs-boolean type differ,
// neither ever populated here). Only `GlobalId`/`OwnerHistory`/`RelatedObjects`/
// `RelatingProduct` are ever populated, matching real Python's own kwargs-only call. No
// schema-availability gap for `IfcRelAssignsToProduct` itself -- present identically in
// IFC2X3 too.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface AssignProductSettings {
	/** The `IfcProduct` that was constructed as a result of the task. */
	relatingProduct: EntityInstance;
	/** The `IfcProcess` (typically `IfcTask`) of the construction task. */
	relatedObject: EntityInstance;
}

function assignProductUsecase(file: IfcFile, settings: AssignProductSettings): EntityInstance {
	const { relatingProduct, relatedObject } = settings;

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const assignment of hasAssignments) {
		if (
			assignment.isA("IfcRelAssignsToProduct") &&
			(assignment.get("RelatingProduct") as EntityInstance).equals(relatingProduct)
		) {
			// Unlike `./assignProcess.ts`'s own analogous dedup branch -- see this file's
			// header comment -- real Python returns the existing `assignment` here.
			return assignment;
		}
	}

	const referencedByList = relatingProduct.get("ReferencedBy") as EntityInstance[];
	let referencedBy: EntityInstance | null = referencedByList.length > 0 ? referencedByList[0] : null;

	if (referencedBy) {
		const relatedObjects = [...(referencedBy.get("RelatedObjects") as EntityInstance[]), relatedObject];
		referencedBy.set("RelatedObjects", relatedObjects);
		updateOwnerHistory(file, { element: referencedBy });
	} else {
		referencedBy = file.createEntity(
			"IfcRelAssignsToProduct",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			[relatedObject], // RelatedObjects
			null, // RelatedObjectsType
			relatingProduct, // RelatingProduct
		);
	}
	return referencedBy;
}

/**
 * Assigns a product to be produced as a result of a process (Python:
 * `ifcopenshell.api.sequence.assign_product`).
 *
 * A construction task may result in products (e.g. a wall) being constructed. These task
 * "Outputs" are defined in IFC through product relationships.
 *
 * Not all tasks have Outputs. For example, maintenance tasks will typically not have any
 * outputs.
 *
 * See `api.sequence.assignProcess` for Inputs and other types of process relationships
 * that can be described in manufacturing process modeling.
 *
 * @returns The newly created (or grown, or already-existing) `IfcRelAssignsToProduct`
 * relationship.
 *
 * @example
 * ```ts
 * const task = api.sequence.addTask(model, {
 *   workSchedule: schedule, name: "Build wall", predefinedType: "CONSTRUCTION",
 * });
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * api.sequence.assignProduct(model, { relatingProduct: wall, relatedObject: task });
 * ```
 */
export const assignProduct = wrapUsecase("sequence.assign_product", assignProductUsecase);
