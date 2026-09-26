// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/assign_flow_control.py` (src/ifcopenshell-python,
// 80 lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own
// header comment). Assigns an `IfcDistributionControlElement` to the
// `IfcDistributionFlowElement` it senses/controls, via `IfcRelFlowControlElements`.
//
// Real Python's own docstring: "Note that control can be assigned only to the one flow
// element" -- i.e. one control -> at most one flow element, checked FIRST via the
// control's own `AssignedToFlowElement` inverse. The mirror direction (one flow
// element controlled by MULTIPLE distinct control elements) IS supported -- see the
// second branch below, which reuses the flow element's own existing
// `IfcRelFlowControlElements` (via `HasControlElements[0]`) and grows its
// `RelatedControlElements` set rather than creating a second rel.
//
// 3 possible outcomes, ported verbatim in the exact real Python order:
// 1. `related_flow_control` is ALREADY assigned to `relating_flow_element` (the
//    SAME pair) -- return the existing assignment, no mutation.
// 2. `related_flow_control` is ALREADY assigned to some OTHER flow element -- return
//    `undefined`/`None`, no mutation at all (real Python's own docstring: "If control
//    is already assigned to some other element method will return None").
// 3. `related_flow_control` has no assignment yet:
//    a. `relating_flow_element` already has a `HasControlElements[0]` rel -- if
//       `related_flow_control` is already IN that rel's `RelatedControlElements`,
//       return it unchanged; otherwise grow the rel's `RelatedControlElements` (a
//       `set()`-deduplicated union in real Python, ported via `EntityInstanceSet`'s
//       established by-identity-set pattern -- see `../group/assignGroup.ts`'s
//       identical local helper) and call `owner.update_owner_history`.
//    b. `relating_flow_element` has no existing rel at all -- create a brand-new
//       `IfcRelFlowControlElements`.
//
// `IfcRelFlowControlElements`'s attribute order (`GlobalId`, `OwnerHistory`, `Name`,
// `Description`, `RelatedControlElements`, `RelatingFlowElement`) is identical across
// all 3 schemas' generated `.d.ts` files (verified directly). Created positionally
// with explicit `null` for the skipped `Name`/`Description` (matching
// `../material/assignMaterial.ts`'s own established "explicit null, named by comment"
// convention for a skipped middle attribute), matching real Python's own kwargs dict,
// which never mentions `Name`/`Description` either.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set -- see `../group/assignGroup.ts`'s identical helper's own doc comment. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	has(instance: EntityInstance | null | undefined): boolean {
		if (!instance) return false;
		return this.byIdentity.has(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface AssignFlowControlSettings {
	/** The `IfcDistributionFlowElement` that is being controlled / sensed. */
	relatingFlowElement: EntityInstance;
	/** The `IfcDistributionControlElement` which may be used to impart control on the flow element. */
	relatedFlowControl: EntityInstance;
}

function assignFlowControlUsecase(
	file: IfcFile,
	settings: AssignFlowControlSettings,
): EntityInstance | null | undefined {
	const { relatingFlowElement, relatedFlowControl } = settings;

	const assignedToFlowElement = relatedFlowControl.get("AssignedToFlowElement") as EntityInstance[] | null;
	if (assignedToFlowElement && assignedToFlowElement.length > 0) {
		// Only 1 control per 1 flow element is possible.
		const assignment = assignedToFlowElement[0];
		if ((assignment.get("RelatingFlowElement") as EntityInstance).equals(relatingFlowElement)) {
			return assignment;
		}
		// Return `undefined` (Python: `None`) if this control is already assigned to
		// another flow element.
		return undefined;
	}

	const hasControlElements = relatingFlowElement.get("HasControlElements") as EntityInstance[] | null;
	if (hasControlElements && hasControlElements.length > 0) {
		const assignment = hasControlElements[0];
		const relatedControlElements = new EntityInstanceSet();
		relatedControlElements.update(assignment.get("RelatedControlElements") as EntityInstance[]);

		if (relatedControlElements.has(relatedFlowControl)) {
			return assignment;
		}

		relatedControlElements.add(relatedFlowControl);
		assignment.set("RelatedControlElements", relatedControlElements.values());
		updateOwnerHistory(file, { element: assignment });
		return assignment;
	}

	return file.createEntity(
		"IfcRelFlowControlElements",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		[relatedFlowControl], // RelatedControlElements
		relatingFlowElement, // RelatingFlowElement
	);
}

/**
 * Assigns to the flow element control element that either sense or control some
 * aspect of the flow element (Python: `ifcopenshell.api.system.assign_flow_control`).
 *
 * Note that control can be assigned only to the one flow element.
 *
 * @returns Matching or newly created `IfcRelFlowControlElements`. If control is
 * already assigned to some other element method will return `undefined`.
 *
 * @example
 * ```ts
 * const flowElement = file.createEntity("IfcFlowSegment");
 * const flowControl = file.createEntity("IfcController");
 * const relation = api.system.assignFlowControl(file, {
 *   relatedFlowControl: flowControl,
 *   relatingFlowElement: flowElement,
 * });
 * ```
 */
export const assignFlowControl = wrapUsecase("system.assign_flow_control", assignFlowControlUsecase);
