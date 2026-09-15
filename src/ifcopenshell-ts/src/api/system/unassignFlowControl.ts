// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/unassign_flow_control.py` (src/ifcopenshell-python,
// 67 lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own
// header comment). Unassigns an `IfcDistributionControlElement` from the single
// `IfcRelFlowControlElements` it may be assigned to (real Python's own docstring/
// `./assignFlowControl.ts`'s own header comment: "only 1 control per 1 flow element is
// possible" -- but the mirror direction, one flow element controlled by MULTIPLE
// control elements, is fully supported, hence this function's own multi-member
// `RelatedControlElements` handling below).
//
// Ported verbatim, including 2 early-return guards real Python expresses as bare
// `return` (no value) statements: (1) `related_flow_control` has no
// `AssignedToFlowElement` rel at all; (2) it DOES have one, but it points at a
// DIFFERENT `relating_flow_element` than the one passed in -- this function only ever
// touches the SPECIFIC element/control pair the caller asked about, never blindly
// unassigns whatever the control happens to actually be assigned to.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface UnassignFlowControlSettings {
	/** The `IfcDistributionFlowElement` that is being controlled. */
	relatingFlowElement: EntityInstance;
	/** The `IfcDistributionControlElement` controlling the flow element. */
	relatedFlowControl: EntityInstance;
}

function unassignFlowControlUsecase(file: IfcFile, settings: UnassignFlowControlSettings): void {
	const { relatingFlowElement, relatedFlowControl } = settings;

	const assignedToFlowElement = relatedFlowControl.get("AssignedToFlowElement") as EntityInstance[] | null;
	if (!assignedToFlowElement || assignedToFlowElement.length === 0) {
		return;
	}
	const assignment = assignedToFlowElement[0];
	const assignmentRelatingFlowElement = assignment.get("RelatingFlowElement") as EntityInstance;
	if (!assignmentRelatingFlowElement.equals(relatingFlowElement)) {
		return;
	}

	const relatedControlElements = assignment.get("RelatedControlElements") as EntityInstance[];
	if (relatedControlElements.length === 1) {
		const history = assignment.get("OwnerHistory") as EntityInstance | null;
		file.remove(assignment);
		if (history) elementUtil.removeDeep2(file, history);
		return;
	}

	const remaining = relatedControlElements.filter((e) => !e.equals(relatedFlowControl));
	assignment.set("RelatedControlElements", remaining);
	updateOwnerHistory(file, { element: assignment });
}

/**
 * Unassigns flow control element from the flow element (Python:
 * `ifcopenshell.api.system.unassign_flow_control`).
 *
 * @example
 * ```ts
 * // assign control to the flow element
 * const flowElement = file.createEntity("IfcFlowSegment");
 * const flowControl = file.createEntity("IfcController");
 * const relation = api.system.assignFlowControl(file, {
 *   relatingFlowElement: flowElement,
 *   relatedFlowControl: flowControl,
 * });
 *
 * // und unassign it
 * api.system.unassignFlowControl(file, { relatingFlowElement: flowElement, relatedFlowControl: flowControl });
 * ```
 */
export const unassignFlowControl = wrapUsecase("system.unassign_flow_control", unassignFlowControlUsecase);
