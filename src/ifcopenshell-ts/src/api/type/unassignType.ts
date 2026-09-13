// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/type/unassign_type.py` (src/ifcopenshell-python, 71 lines)
// -- the one small, well-scoped function of `api.type`, per
// `research/02-api-layer.md` SS3's own explicit early-target recommendation.
// `assign_type` (319 lines, the largest file in this group, per-docstring propagates
// property sets/representation mapping) and `map_type_representations` (a fan-out
// operation over every occurrence of a type) are genuinely out of scope here -- both
// are separate, future `api.type` chunks. `unassignType` doesn't depend on either.
//
// Structurally near-identical to `../aggregate/unassignObject.ts`/
// `../spatial/unassignContainer.ts` (same build-a-rels-set /
// rewrite-or-delete-with-`removeDeep2` shape, over the same kind of single-
// `RelatedObjects`-array relationship class), with one genuine addition: a real
// schema-version branch. Verified directly against the generated `.d.ts` files (not
// assumed from the Python source alone) -- `util/element.ts`'s own `getType` already
// established and relies on the identical branch: IFC2X3's `IfcObject` has no
// `IsTypedBy` inverse attribute at all (confirmed absent from
// `ifcopenshell-python/ifcopenshell/util/schema/ifc2x3_entities.json`'s `IfcObject`
// entry, which only documents `IsDefinedBy`), so on IFC2X3 an object's type-assignment
// rel must be found by filtering `IsDefinedBy` down to `IfcRelDefinesByType`; IFC4/
// IFC4X3 add the dedicated `IsTypedBy` inverse attribute (confirmed present in
// `ifc4_entities.json`/`ifc4x3_entities.json`), a set that (per real Python's own
// `next(iter(object.IsTypedBy), None)`, at most one element in practice) needs no
// `is_a` filtering.
//
// --- Real, disclosed upstream bug, ported verbatim (not silently fixed) ---
//
// Real Python (lines 62-65) reuses (shadows) a single `related_objects_set` variable
// across the `for rel in rels` loop, rebinding it every iteration to
// `set(rel.RelatedObjects) - related_objects_set` -- i.e. each iteration after the
// first subtracts the *previous* iteration's leftover-members result, not the
// original caller-supplied `related_objects` set. Contrast `unassignObject.ts`'s and
// `unassignContainer.ts`'s own loops, whose Python sources (`aggregate/
// unassign_object.py`, `spatial/unassign_container.py`) both introduce a genuinely
// fresh per-iteration variable name (`related_objects`) instead -- this shadowing is
// specific to `unassign_type.py`, not a shape shared by its siblings.
//
// Confirmed as a real behavioral bug (not just an unusual-but-equivalent rewrite) by
// direct simulation: when `related_objects` spans elements typed by *different*
// `IfcRelDefinesByType` rels, every rel processed after the first is filtered against
// the previous rel's already-shrunk leftover set rather than the original target set,
// so an object that should be detached from a later-processed rel is silently left
// typed. E.g. two rels rel1=[e1,e3] (unassigning
// e1) and rel2=[e2,e4] (unassigning e2), processed in that order: rel1 correctly
// becomes `[e3]`, but rel2 is then filtered against `{e3}` (rel1's leftover) instead
// of the original `{e1,e2}`, so rel2 stays `[e2,e4]` -- e2's type assignment is never
// removed. Ported faithfully (see `unassignTypeUsecase`'s own local comment for where
// the shadowing is reproduced) and pinned by a dedicated regression test in
// `unassignType.test.ts` rather than silently corrected to a fresh-per-iteration
// filter, per this project's disclose-don't-silently-fix convention.

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

export interface UnassignTypeSettings {
	/** List of `IfcElement` occurrences to unassign a type from. */
	relatedObjects: readonly EntityInstance[];
}

function unassignTypeUsecase(file: IfcFile, settings: UnassignTypeSettings): void {
	const relatedObjects = new EntityInstanceSet();
	relatedObjects.update(settings.relatedObjects);

	const rels = new EntityInstanceSet();
	if (file.schema === "IFC2X3") {
		for (const object of relatedObjects.values()) {
			const isDefinedBy = object.get("IsDefinedBy") as EntityInstance[];
			const rel = isDefinedBy.find((r) => r.isA("IfcRelDefinesByType")) ?? null;
			if (rel) rels.add(rel);
		}
	} else {
		for (const object of relatedObjects.values()) {
			const isTypedBy = object.get("IsTypedBy") as EntityInstance[];
			const rel = isTypedBy[0] ?? null;
			if (rel) rels.add(rel);
		}
	}

	// See this file's own header comment ("real, disclosed upstream bug") -- `remaining`
	// is deliberately a single mutable binding reassigned every iteration (matching real
	// Python's `related_objects_set = set(rel.RelatedObjects) - related_objects_set`
	// shadowing), NOT reset to `relatedObjects` per rel the way `unassignObject.ts`/
	// `unassignContainer.ts`'s own loops filter against their untouched outer set.
	let remaining = relatedObjects;
	for (const rel of rels.values()) {
		const relRelatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		const next = new EntityInstanceSet();
		next.update(relRelatedObjects.filter((o) => !remaining.has(o)));
		remaining = next;

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
 * Unassigns a type from occurrences (Python: `ifcopenshell.api.type.unassign_type`).
 *
 * Note that unassigning a type doesn't automatically remove mapped representations and
 * material usages associated with the previously assigned type.
 */
export const unassignType = wrapUsecase("type.unassign_type", unassignTypeUsecase);
