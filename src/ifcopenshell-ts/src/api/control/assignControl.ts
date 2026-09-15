// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/control/assign_control.py` (src/ifcopenshell-python, 109
// lines) -- part of this project's `api.control` chunk (see `./index.ts`'s own header
// comment). Assigns a planning control or constraint (`IfcControl`, e.g.
// `IfcWorkCalendar`, `IfcCostItem`) to a list of `IfcObjectDefinition`s via
// `IfcRelAssignsToControl`.
//
// Structurally near-identical to `../owner/assignActor.ts`'s "reuse-or-grow the single
// existing rel for this relating entity" shape (`relating_control.Controls`, the
// inverse of `IfcRelAssignsToControl.RelatingControl`, mirrors `assignActor.ts`'s own
// `relating_actor.IsActingUpon`), but with an EXTRA per-object dedup step `assignActor`
// doesn't have: before deciding what to assign, every candidate in `related_objects` is
// checked against `relating_control`'s own existing assignment rel(s)
// (`control_assignments = set(relating_control.Controls)`) via that OBJECT's own
// `HasAssignments` -- any object already controlled by this exact `relating_control` is
// silently dropped from the batch (`objects_to_assign`), not re-added. If EVERY
// candidate is already assigned, the whole call is a no-op returning `None`/`undefined`
// (ported as `undefined` -- see `assignControlUsecase`'s own return type).
//
// Real Python builds two `set()`s from list inputs (`related_objects_set`,
// `control_assignments`) and iterates a THIRD (`objects_to_assign`) -- Python's own
// hash-based sets have no guaranteed iteration order, so which "arbitrary" element
// `next(iter(relating_control.Controls), None)` picks (when, hypothetically, more than
// one `IfcRelAssignsToControl` already points at this `relating_control` -- never
// actually produced by this function itself, which always reuses/grows the one it
// finds rather than creating a second) is itself non-deterministic in real Python. This
// port uses `EntityInstanceSet` (a local identity-keyed `Map`, matching `../type/
// unassignType.ts`'s/`../aggregate/unassignObject.ts`'s own established per-file
// precedent for "no shared, exported set-of-`EntityInstance` type exists yet") and
// simply takes the FIRST element of the (insertion-ordered) array `.get("Controls")`
// returns -- a deterministic stand-in for Python's own non-deterministic "arbitrary"
// pick, matching `../owner/assignActor.ts`'s identical `isActingUpon[0]` precedent for
// the structurally same situation.
//
// `IfcRelAssignsToControl`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
// RelatedObjects(4), RelatedObjectsType(5), RelatingControl(6) -- identical order in
// all 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`; only
// `RelatedObjectsType`'s enum-vs-boolean type differs across schemas, never populated
// here). Only `GlobalId`/`OwnerHistory`/`RelatedObjects`/`RelatingControl` are ever
// populated, matching real Python's own kwargs-only call.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set, matching `../type/unassignType.ts`'s own identical precedent for this exact per-file pattern. */
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

export interface AssignControlSettings {
	/** The `IfcControl` entity that is creating the control or constraint. */
	relatingControl: EntityInstance;
	/** The list of `IfcObjectDefinition`s that is being controlled. */
	relatedObjects: readonly EntityInstance[];
}

function assignControlUsecase(file: IfcFile, settings: AssignControlSettings): EntityInstance | undefined {
	const { relatingControl } = settings;

	const relatedObjectsSet = new EntityInstanceSet();
	relatedObjectsSet.update(settings.relatedObjects);

	const controlAssignments = new EntityInstanceSet();
	controlAssignments.update(relatingControl.get("Controls") as EntityInstance[]);

	let objectsToAssign = new EntityInstanceSet();
	if (controlAssignments.values().length > 0) {
		for (const obj of relatedObjectsSet.values()) {
			const hasAssignments = obj.get("HasAssignments") as EntityInstance[];
			const existingAssignment = hasAssignments.some((a) => controlAssignments.has(a));
			if (existingAssignment) continue;
			objectsToAssign.add(obj);
		}
	} else {
		objectsToAssign = relatedObjectsSet;
	}

	if (objectsToAssign.values().length === 0) {
		return undefined;
	}

	const controlsList = relatingControl.get("Controls") as EntityInstance[];
	const existingControls = controlsList.length > 0 ? controlsList[0] : null;

	let controls: EntityInstance;
	if (existingControls) {
		controls = existingControls;
		const relatedObjectsNew = [...(controls.get("RelatedObjects") as EntityInstance[]), ...objectsToAssign.values()];
		controls.set("RelatedObjects", relatedObjectsNew);
		updateOwnerHistory(file, { element: controls });
	} else {
		controls = file.createEntity(
			"IfcRelAssignsToControl",
			guid.new(),
			createOwnerHistory(file, {}),
			null,
			null,
			objectsToAssign.values(),
			null,
			relatingControl,
		);
	}
	return controls;
}

/**
 * Assigns a planning control or constraint to a list of objects (Python:
 * `ifcopenshell.api.control.assign_control`).
 *
 * IFC can describe concepts that control other objects. For example, a planning
 * calendar controls the availability of working days for construction planning. As
 * another example, a cost item might constrain or limit the ability to procure and
 * build a product.
 *
 * This usecase lets you assign controls following the rules of the IFC specification.
 * This is an advanced topic and assumes knowledge of the IFC concepts to determine what
 * is allowed to control what. In the future, this API will likely be deprecated in
 * favour of multiple usecase specific APIs.
 *
 * @returns The newly created (or grown) `IfcRelAssignsToControl`. If every
 * `relatedObjects` was already assigned and nothing changed, returns `undefined`.
 *
 * @example
 * ```ts
 * // A cost item constraining a wall (real usage typically goes via `api.cost`/
 * // `api.sequence`, neither ported yet -- see this module's own `index.ts` header
 * // comment -- so this example builds the `IfcControl`/`IfcObjectDefinition` fixtures
 * // directly).
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * const costItem = model.createEntity("IfcCostItem");
 * api.control.assignControl(model, { relatingControl: costItem, relatedObjects: [wall] });
 * ```
 */
export const assignControl = wrapUsecase("control.assign_control", assignControlUsecase);
