// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/unassign_pset.py` (src/ifcopenshell-python, 78
// lines). Reverses `./assignPset.ts` -- unassigns a property/quantity set from the
// provided elements (or element types).
//
// --- Occurrence vs type, and where this function's shape genuinely diverges from
// `assignPset`'s (not a copy-paste of that file's structure) ---
//
// Unlike `assignPset` (which only ever looks at the FIRST `PropertyDefinitionOf`/
// `DefinesOccurrence` rel), this function iterates EVERY such rel and, for each one
// that actually references at least one of the given occurrences, either shrinks its
// `RelatedObjects` or -- if that would leave it empty -- removes the rel entirely
// (purging its `OwnerHistory` too, mirroring `./removePset.ts`'s own orphan-history
// cleanup). Confirmed directly against `unassign_pset.py`'s source, not assumed to
// mirror `assign_pset.py`'s "first rel only" shape -- real Python's own comment
// ("Check occurrences using pset") is the same one-liner in both files, but the loop
// body underneath is genuinely different in each.
//
// A rel that references NONE of the given occurrences is left completely untouched
// (real Python: `if not any(p in objs for p in products_occurrences): continue`) --
// this matters when a pset has multiple independent `IfcRelDefinesByProperties`
// pointing at it (a real, if unusual, IFC4+ possibility) and only some of them overlap
// with the products being unassigned.
//
// For types: `psets.remove(pset)` is Python's `list.remove(x)` -- removes only the
// FIRST element equal to `pset` and raises `ValueError` if `pset` isn't a member at
// all. Reproduced via the same explicit `findIndex`/`splice`/throw shape
// `./removePset.ts`'s own header comment already established for the identical
// "Python `list.remove()` semantics" situation (that file's `RelatedObjects.remove
// (product)`), including that same simplified (not literal Python `ValueError` text)
// error message convention.
//
// --- Hits a real, disclosed native primitive-layer bug (worked around below, not
// fixed at the source) ---
//
// When the last pset is removed from a type (`psets` becomes `[]`), real Python sets
// `product.HasPropertySets = psets or None` -- i.e. `None`. Setting an aggregate-of-
// entity attribute directly to `null` via this port's `.set()` bypasses the native
// inverse-index unregister bookkeeping entirely (confirmed empirically against this
// worktree's own built addon, and against the real C++ source: see `TODOS.md`'s
// "clearing an entity/aggregate-of-entity attribute to `null` via `.set()` leaves a
// stale ... inverse-index entry" entry for the full root-cause writeup) -- `pset`'s
// own `DefinesType` inverse would keep reporting `product` as still referencing it
// forever, even though `product.HasPropertySets` itself correctly reads back as
// `null`. Worked around exactly as `../geometry/unassignRepresentation.ts`'s own
// identical situation: assign `[]` first (routes through the real, bookkeeping-bearing
// code path), then immediately assign the real final `null` value.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

/** Local by-identity set -- see `../group/unassignGroup.ts`'s identical helper's own doc comment. */
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
	delete(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.delete(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
	get size(): number {
		return this.byIdentity.size;
	}
}

export interface UnassignPsetSettings {
	/** Elements (or element types) to unassign the pset from. */
	products: readonly EntityInstance[];
	/** The property set (or quantity set) to unassign. */
	pset: EntityInstance;
}

function unassignPsetUsecase(file: IfcFile, settings: UnassignPsetSettings): void {
	const { pset } = settings;
	const isIfc2x3 = file.schema === "IFC2X3";

	const productsOccurrences = new EntityInstanceSet();
	const productsTypes = new EntityInstanceSet();
	for (const product of settings.products) {
		if (product.isA("IfcTypeProduct")) {
			productsTypes.add(product);
		} else {
			productsOccurrences.add(product);
		}
	}

	// Check occurrences using pset.
	if (productsOccurrences.size) {
		const rels = pset.get(isIfc2x3 ? "PropertyDefinitionOf" : "DefinesOccurrence") as EntityInstance[];
		for (const rel of rels) {
			const objs = new EntityInstanceSet();
			objs.update(rel.get("RelatedObjects") as EntityInstance[]);

			const overlaps = productsOccurrences.values().some((p) => objs.has(p));
			if (!overlaps) continue;

			for (const product of productsOccurrences.values()) {
				objs.delete(product);
			}

			if (objs.size) {
				rel.set("RelatedObjects", objs.values());
			} else {
				const history = rel.get("OwnerHistory") as EntityInstance | null;
				file.remove(rel);
				if (history) elementUtil.removeDeep2(file, history);
			}
		}
	}

	for (const product of productsTypes.values()) {
		const psets = [...((product.get("HasPropertySets") as EntityInstance[] | null) ?? [])];
		const index = psets.findIndex((p) => p.equals(pset));
		if (index === -1) {
			throw new Error(`entity instance of type '${pset.isA()}' (#${pset.id()}) is not in list`);
		}
		psets.splice(index, 1);
		if (psets.length) {
			product.set("HasPropertySets", psets);
		} else {
			// Python: `product.HasPropertySets = psets or None` -- `psets` is now `[]`, so
			// this sets the attribute to `None`. Setting an aggregate-of-entity attribute
			// directly to `null` is a real, disclosed native primitive-layer bug in this
			// port (see `TODOS.md`'s "clearing an entity/aggregate-of-entity attribute to
			// `null` via `.set()` leaves a stale ... inverse-index entry" entry, and
			// `../geometry/unassignRepresentation.ts`'s own identical workaround): it
			// bypasses the inverse-index unregister bookkeeping, so `pset`'s own
			// `DefinesType` inverse would keep reporting `product` as still referencing it
			// even after this call. Assigning `[]` FIRST (which correctly routes through
			// the bookkeeping-bearing code path) and only then the real final `null` value
			// works around it, matching real Python's persisted end value exactly while
			// leaving a correctly-updated inverse index.
			product.set("HasPropertySets", []);
			product.set("HasPropertySets", null);
		}
	}
}

/**
 * Unassigns a property set from the provided elements (Python: `ifcopenshell.api.pset.unassign_pset`).
 *
 * @example
 * ```ts
 * api.pset.assignPset(model, { products: [element1, element2], pset });
 * // Pset is now shared by 2 elements.
 *
 * api.pset.unassignPset(model, { products: [element2], pset });
 * // Pset was unassigned from element2.
 * ```
 */
export const unassignPset = wrapUsecase("pset.unassign_pset", unassignPsetUsecase);
