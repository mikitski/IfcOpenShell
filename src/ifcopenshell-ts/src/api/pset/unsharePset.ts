// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/unshare_pset.py` (src/ifcopenshell-python, 93
// lines). The opposite direction of "sharing" from `./assignPset.ts`: given a pset
// currently shared by multiple elements, this makes it unique again by copying it once
// per given product, unassigning the original from those products, and assigning each
// product its own fresh copy.
//
// --- Genuinely different from `assignPset`/`unassignPset`'s own "occurrence vs type"
// split: it doesn't need one at all ---
//
// This function delegates the occurrence-vs-type distinction entirely to
// `./unassignPset.ts`/`./assignPset.ts` (both called with plain product lists, no
// pre-partitioning of its own) -- read closely enough to notice that real Python
// itself computes `products_occurrences`/`products_types` locally (the exact same
// `is_a("IfcTypeProduct")` partition those two functions perform internally) but NEVER
// ACTUALLY USES either set afterward: the rest of the function only ever iterates
// `products` (the plain list) and calls `unassign_pset`/`assign_pset`, which redo
// their own partitioning regardless. This is genuine, inert dead code in real
// Python's source (confirmed by reading the whole function body -- neither set is
// referenced again after being built), not something this port introduces. Disclosed
// here rather than silently reproduced: porting two unused local variables would add
// literal dead code with zero observable effect, so this port omits them rather than
// copying an artifact that does nothing either way.
//
// --- The "skip the first product" self-orphaning guard ---
//
// If `products` (the exact set requested, by identity) equals THE ENTIRE set of
// elements the pset is currently assigned to (`util.element.getElementsByPset`), then
// copying every single one of them would leave the ORIGINAL `pset` linked to nothing
// at all -- an orphaned pset no product references anymore. Real Python avoids this by
// dropping just the first product from the list (`products = products[1:]`) so that
// one element keeps the original `pset` and only the rest get fresh copies. If that
// leaves nothing to do (a single product was the pset's only element), it raises.
// Reproduced verbatim, including which element is chosen to "keep" the original (the
// first, by list order, not any other selection rule).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { assignPset } from "./assignPset";
import { unassignPset } from "./unassignPset";

/** Python's `set(products) == pset_elements` -- by-identity set equality. */
function identitySetEquals(products: readonly EntityInstance[], other: ReadonlySet<EntityInstance>): boolean {
	const byIdentity = new Map<number, EntityInstance>();
	for (const product of products) byIdentity.set(product.identity(), product);
	if (byIdentity.size !== other.size) return false;
	const otherByIdentity = new Set<number>();
	for (const instance of other) otherByIdentity.add(instance.identity());
	for (const identity of byIdentity.keys()) {
		if (!otherByIdentity.has(identity)) return false;
	}
	return true;
}

export interface UnsharePsetSettings {
	/** Elements (or element types) to link the (copied) pset to. */
	products: readonly EntityInstance[];
	/** The shared property set (or quantity set) to unshare. */
	pset: EntityInstance;
}

function unsharePsetUsecase(file: IfcFile, settings: UnsharePsetSettings): EntityInstance[] {
	const { pset } = settings;
	if (!settings.products.length) {
		throw new Error("No products provided.");
	}

	// If pset has no other elements besides the provided products, then we skip the
	// first product, so it won't get additional pset copy leaving the original pset
	// orphaned.
	const psetElements = elementUtil.getElementsByPset(pset);
	const productsOriginal = settings.products;

	let products = settings.products;
	if (identitySetEquals(products, psetElements)) {
		products = products.slice(1);
	}

	if (!products.length) {
		const firstProduct = productsOriginal[0];
		throw new Error(
			`Provided product is the only element to which pset is assigned: entity instance of type '${firstProduct.isA()}' (#${firstProduct.id()}).`,
		);
	}

	unassignPset(file, { products, pset });

	const psetCopies: EntityInstance[] = [];
	for (const product of products) {
		// No need to consider profile/material properties since they are assigned to 1
		// element directly and therefore cannot be shared. Don't copyDeep to keep it
		// light -- editPset supports unsharing shared props (a future chunk).
		const psetCopy = elementUtil.copy(file, pset);
		psetCopies.push(psetCopy);
		assignPset(file, { products: [product], pset: psetCopy });
	}

	return psetCopies;
}

/**
 * Copies a shared pset as linked only to the provided elements (Python:
 * `ifcopenshell.api.pset.unshare_pset`).
 *
 * Note that this creates a copy of the pset for each element provided.
 *
 * @returns The list of copied property sets.
 *
 * @example
 * ```ts
 * api.pset.assignPset(model, { products: [element1, element2], pset });
 * // Pset is now shared by 2 elements.
 *
 * const newPsets = api.pset.unsharePset(model, { products: [element2], pset });
 * // element2 was unassigned from the original pset.
 * // newPsets[0] is a brand new pset, assigned only to element2.
 * ```
 */
export const unsharePset = wrapUsecase("pset.unshare_pset", unsharePsetUsecase);
