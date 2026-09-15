// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/control/unassign_control.py` (src/ifcopenshell-python, 65
// lines) -- part of this project's `api.control` chunk (see `./index.ts`'s own header
// comment). The inverse of `./assignControl.ts`.
//
// Structurally near-identical to `../type/unassignType.ts`'s "collect matching rels,
// then shrink-or-delete each" shape: `rels` is every `IfcRelAssignsToControl` that (a)
// already points at `relating_control` (`control_assignments = set(relating_control.
// Controls)`) AND (b) is one of some candidate object's own `HasAssignments`. For each
// such rel: if removing `related_objects` from it leaves at least one member, the rel
// is shrunk in place (`update_owner_history`); if it would leave none, the whole rel
// (and its `OwnerHistory`, via `removeDeep2`) is deleted instead. Unlike `../type/
// unassignType.ts`'s own disclosed per-iteration-shadowing bug, this function's `remove`
// set is fresh per rel (`set(rel.RelatedObjects) - related_objects_set`, always against
// the ORIGINAL caller-supplied set, never a previous iteration's leftover) -- no
// equivalent quirk here.
//
// Real Python builds `rels` as a `set()` comprehension over `(obj, rel)` pairs from
// EVERY candidate object's `HasAssignments`, so the same rel found via two different
// `related_objects` members is naturally deduplicated by Python's own set semantics.
// Ported via the same `EntityInstanceSet` local identity-set helper `./assignControl.ts`
// already establishes for this module (kept as its own copy per-file, matching
// `../type/unassignType.ts`'s/`../aggregate/unassignObject.ts`'s own established
// "no shared, exported set type" precedent).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set -- see `./assignControl.ts`'s own identical helper's doc comment. */
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

export interface UnassignControlSettings {
	/** The `IfcControl` entity that is creating the control or constraint. */
	relatingControl: EntityInstance;
	/** The list of `IfcObjectDefinition`s that is being controlled. */
	relatedObjects: readonly EntityInstance[];
}

function unassignControlUsecase(file: IfcFile, settings: UnassignControlSettings): void {
	const { relatingControl } = settings;

	const relatedObjectsSet = new EntityInstanceSet();
	relatedObjectsSet.update(settings.relatedObjects);

	const controlAssignments = new EntityInstanceSet();
	controlAssignments.update(relatingControl.get("Controls") as EntityInstance[]);

	const rels = new EntityInstanceSet();
	for (const obj of relatedObjectsSet.values()) {
		const hasAssignments = obj.get("HasAssignments") as EntityInstance[];
		for (const rel of hasAssignments) {
			if (controlAssignments.has(rel)) rels.add(rel);
		}
	}

	for (const rel of rels.values()) {
		const relRelatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		const remaining = new EntityInstanceSet();
		remaining.update(relRelatedObjects.filter((o) => !relatedObjectsSet.has(o)));

		if (remaining.values().length > 0) {
			rel.set("RelatedObjects", remaining.values());
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
}

/**
 * Unassigns a planning control or constraint from an object (Python:
 * `ifcopenshell.api.control.unassign_control`).
 *
 * @example
 * ```ts
 * // Let's relate a cost item and a product
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * const costItem = model.createEntity("IfcCostItem");
 * api.control.assignControl(model, { relatingControl: costItem, relatedObjects: [wall] });
 *
 * // And now let's change our mind
 * api.control.unassignControl(model, { relatingControl: costItem, relatedObjects: [wall] });
 * ```
 */
export const unassignControl = wrapUsecase("control.unassign_control", unassignControlUsecase);
