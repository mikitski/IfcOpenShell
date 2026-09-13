// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/layer/unassign_layer.py` (src/ifcopenshell-python, 67
// lines) -- removes representations/representation items from a layer's own
// `AssignedItems` attribute (again, a plain attribute rewrite, not a rel entity --
// see `./assignLayer.ts`'s own header comment for why this differs from
// `api.spatial`/`api.aggregate`'s rel-based precedent). If, after removal, the layer
// has no items left, the layer itself is deleted to keep the IFC valid (a genuinely
// destructive branch, ported verbatim, with its own dedicated Transaction test below).
//
// --- Disclosed finding: a real Python-source bug, preserved verbatim, not silently
// fixed ---
//
// Real Python: `assigned_items = set(layer.AssignedItems) or set()`. This looks like
// a defensive "fall back to an empty set" guard, but it isn't one: `set(None)` raises
// `TypeError: 'NoneType' object is not iterable` *before* the `or` ever gets a chance
// to run (`or` only ever sees the already-evaluated left-hand side, and evaluating
// `set(None)` is what throws) -- unlike `assign_layer.py`'s own, actually-safe
// `set(layer.AssignedItems or [])` (guards `None` before constructing the `set`, not
// after). So real `unassign_layer` genuinely crashes with a `TypeError` if called on
// a layer whose `AssignedItems` was never set (confirmed empirically: a fresh
// `IfcPresentationLayerAssignment`'s `AssignedItems` reads back as Python `None`, the
// same "support AssignedItems == None since layer might just got created" case
// `assign_layer.py`'s own comment calls out -- `unassign_layer.py` just doesn't
// actually handle it, despite looking like it does).
//
// This port reproduces the same crash rather than silently guarding it away: `.update()`
// below iterates its argument directly (no `?? []` fallback), so passing the raw
// `layer.get("AssignedItems")` result (`null` for a never-assigned layer) throws a
// JS `TypeError` ("... is not iterable") at the same call site real Python throws its
// own `TypeError` -- see `unassignLayer.test.ts`'s dedicated regression test pinning
// this exact crash. (This isn't a case of JS's `new Set(null)` failing to reproduce
// the bug for free, either -- JS's own `Set` constructor deliberately treats
// `null`/`undefined` as an empty iterable and would NOT crash, which is exactly why
// this port needs its own explicit, non-`Set`-based `EntityInstanceSet.update()` to
// preserve the real crash rather than accidentally fixing it.)

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/**
 * Local by-identity set -- see `../aggregate/unassignObject.ts`'s identical helper's
 * own doc comment. `update()` deliberately does NOT tolerate a `null`/`undefined`
 * *iterable itself* (only individual `null`/`undefined` elements within it) -- see
 * this file's header comment for why that's load-bearing here.
 */
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
	isSubsetOf(other: EntityInstanceSet): boolean {
		for (const identity of this.byIdentity.keys()) {
			if (!other.byIdentity.has(identity)) return false;
		}
		return true;
	}
	difference(other: EntityInstanceSet): EntityInstance[] {
		return this.values().filter((instance) => !other.has(instance));
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface UnassignLayerSettings {
	/** A list of `IfcRepresentationItem` / `IfcRepresentation` elements to unassign. */
	items: readonly EntityInstance[];
	/** The `IfcPresentationLayerAssignment` to unassign from. */
	layer: EntityInstance;
}

function unassignLayerUsecase(file: IfcFile, settings: UnassignLayerSettings): void {
	const { layer } = settings;

	// Real Python: `set(layer.AssignedItems) or set()` -- genuinely crashes on a
	// never-assigned layer rather than defaulting to empty; see this file's header
	// comment. Reproduced verbatim: no `?? []` guard here.
	const assignedItems = new EntityInstanceSet();
	assignedItems.update(layer.get("AssignedItems") as EntityInstance[]);

	const itemsSet = new EntityInstanceSet();
	itemsSet.update(settings.items);

	if (!itemsSet.isSubsetOf(assignedItems)) return;

	const remaining = assignedItems.difference(itemsSet);

	// keep IFC valid in case if there are no items left
	if (remaining.length > 0) {
		layer.set("AssignedItems", remaining);
	} else {
		file.remove(layer);
	}
}

/**
 * Unassigns representation items or representations from a layer (Python:
 * `ifcopenshell.api.layer.unassign_layer`).
 *
 * If the element isn't assigned to the layer, nothing will happen. If after
 * unassignment the layer won't have any assigned items, it will be removed to keep
 * IFC valid.
 *
 * @example
 * ```ts
 * const layer = api.layer.addLayer(model, { name: "AI-WALL" });
 * api.layer.assignLayer(model, { items: [item], layer });
 *
 * // Let's undo it!
 * api.layer.unassignLayer(model, { items: [item], layer });
 * ```
 */
export const unassignLayer = wrapUsecase("layer.unassign_layer", unassignLayerUsecase);
