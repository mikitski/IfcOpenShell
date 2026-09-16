// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/nest/unassign_object.py` (src/ifcopenshell-python, 72
// lines) -- part of this project's brand-new `api.nest` chunk (see `./index.ts`'s own
// header comment for the module's overall scope). Structurally near-identical to
// `../aggregate/unassignObject.ts` (same build-a-rels-set / rewrite-or-delete-with-
// `removeDeep2` shape) -- the two Python source files are themselves near-identical
// for the same reason (both manage a single-related-objects-set STEP relationship
// class), not a coincidence introduced by this port.
//
// --- IFC2X3 vs IFC4+ inverse-attribute name difference, ported exactly ---
//
// Same distinction as `./assignObject.ts`'s own header comment: IFC2X3 has no
// `Nests` inverse attribute at all, so that branch filters the generic
// `Decomposes` inverse down to `is_a("IfcRelNests")` by hand; IFC4+'s `Nests`
// inverse is already `IfcRelNests`-only by schema construction, so no filter is
// needed there.
//
// --- Real, disclosed Python quirk: the two schema branches build `rels` from
//     slightly different sources, but the difference is a no-op ---
//
// Real Python's IFC2X3 branch iterates `related_objects_set` (the de-duplicated
// set), while its IFC4+ branch iterates `related_objects` (the raw, possibly-
// duplicate-containing parameter) -- ported verbatim below via the same
// `EntityInstanceSet`-vs-raw-array split, even though both loops populate the same
// kind of de-duplicated `rels` set as their end result (a `set` comprehension
// dedupes on the Python side regardless of which iterable feeds it), so this
// asymmetry has no observable effect on either language's behavior. Not "fixed" to
// use the same source in both branches, since real Python doesn't either.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set -- see `../aggregate/unassignObject.ts`'s identical helper's own doc comment. */
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

/** Python's `next((rel for rel in rel_list if rel.is_a("IfcRelNests")), None)`. */
function findNestsRel(relList: EntityInstance[]): EntityInstance | null {
	return relList.find((rel) => rel.isA("IfcRelNests")) ?? null;
}

export interface UnassignObjectSettings {
	/** The list of children of the nesting relationship, typically `IfcElement`s. */
	relatedObjects: readonly EntityInstance[];
}

function unassignObjectUsecase(file: IfcFile, settings: UnassignObjectSettings): void {
	// NOTE: maintain `.RelatedObjects` order as it has meaning in IFC.
	const relatedObjectsSet = new EntityInstanceSet();
	relatedObjectsSet.update(settings.relatedObjects);

	const ifc2x3 = file.schema === "IFC2X3";
	const rels = new EntityInstanceSet();
	if (ifc2x3) {
		for (const object of relatedObjectsSet.values()) {
			const rel = findNestsRel(object.get("Decomposes") as EntityInstance[]);
			if (rel) rels.add(rel);
		}
	} else {
		for (const object of settings.relatedObjects) {
			const nests = object.get("Nests") as EntityInstance[];
			const rel = nests[0] ?? null;
			if (rel) rels.add(rel);
		}
	}

	for (const rel of rels.values()) {
		const curRelatedObjects = (rel.get("RelatedObjects") as EntityInstance[]).filter((o) => !relatedObjectsSet.has(o));
		if (curRelatedObjects.length > 0) {
			rel.set("RelatedObjects", curRelatedObjects);
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
}

/**
 * Unassigns `relatedObjects` from their nests (Python: `ifcopenshell.api.nest.unassign_object`).
 *
 * An object (the whole within a decomposition) is nested by zero or one more smaller
 * objects. This function will remove this nesting relationship. If the object is not
 * part of a nesting relationship, nothing will happen.
 *
 * @example
 * ```ts
 * const task = api.root.createEntity(model, { ifcClass: "IfcTask" });
 * const subtask1 = api.root.createEntity(model, { ifcClass: "IfcTask" });
 * const subtask2 = api.root.createEntity(model, { ifcClass: "IfcTask" });
 * api.nest.assignObject(model, { relatedObjects: [subtask1], relatingObject: task });
 * api.nest.assignObject(model, { relatedObjects: [subtask2], relatingObject: task });
 * // Nothing is returned, relationship is removed.
 * api.nest.unassignObject(model, { relatedObjects: [subtask1] });
 * api.nest.unassignObject(model, { relatedObjects: [subtask2] });
 * ```
 */
export const unassignObject = wrapUsecase("nest.unassign_object", unassignObjectUsecase);
