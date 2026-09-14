// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/root/remove_product.py` (src/ifcopenshell-python, 223
// lines) -- one of `api.root`'s last 3 remaining functions (`reassign_class`/
// `remove_product`/`copy_class`, see `./index.ts`'s own header comment), a "smart
// delete" that removes a product (or type product) AND every relationship that would
// otherwise dangle: representations, object placement, type-level psets, openings,
// grid axes, and 14 kinds of inverse relationship (properties, material, type,
// space boundaries, fills/voids/services, nesting, aggregation, containment,
// connections, port connections, group/product assignments, flow control).
//
// --- Retires `../owner/internalCascadeHelpers.ts`'s private `removeProductCascade` ---
//
// An earlier chunk (`api.owner`'s person/organisation/application family, then the
// actor/role/address family) needed this function's behavior as a real, load-bearing
// dependency for `removePerson`/`removeOrganisation`/`removePersonAndOrganisation`
// (called only ever on `IfcActor`/`IfcOccupant`/`IfcInventory`, never a genuine
// `IfcProduct`/`IfcTypeProduct`) before this function existed in the port at all. That
// chunk's own `internalCascadeHelpers.ts` created a private, unexported
// `removeProductCascade`, explicitly documented there as "delete once a real, exported
// `api.root.removeProduct` chunk lands" -- reproducing only the GENERIC inverse-cascade
// tail (guarded with an explicit throw if ever called on a genuine `IfcProduct`/
// `IfcTypeProduct`, since it deliberately skipped the representation/placement/
// type-pset preambles those need). That reproduction was independently verified
// line-by-line against the real Python source in an earlier review, and used as a
// strong reference for this port's own generic-tail loop below (re-verified against
// the real Python source directly here too, not blindly trusted). Now that this real,
// exported `removeProduct` exists, `internalCascadeHelpers.ts`'s `removeProductCascade`
// (and its own now-unused local `attrOr`/`removeWithOwnerHistory` helpers) have been
// deleted, and `removePerson.ts`/`removeOrganisation.ts`/`removePersonAndOrganisation.ts`
// updated to import and call this file's `removeProduct` directly instead. Since none
// of those 3 functions' own callers ever pass a genuine `IfcProduct`/`IfcTypeProduct`
// through this path (an `IfcActor`/`IfcOccupant`/`IfcInventory` is never one, in any of
// the 3 schemas), this swap changes no observable behavior for their own test suites --
// confirmed by re-running `removePerson.test.ts`/`removeOrganisation.test.ts`/
// `removePersonAndOrganisation.test.ts` unchanged after the swap.
//
// --- Two preambles the private helper deliberately skipped, now ported in full ---
//
// `product.is_a("IfcProduct")`: strips every representation off `product.Representation
// .Representations` (via `../geometry/unassignRepresentation.ts`/`.removeRepresentation.ts`,
// both already landed) and removes `product.ObjectPlacement` (via `util.element.
// removeDeep2`, already landed) if `product` was its only remaining reference -- the
// placement's own inverse count is checked BEFORE nulling `product.ObjectPlacement`
// (real Python: `if file.get_total_inverses(object_placement) == 1: product
// .ObjectPlacement = None; ...remove_deep2...` -- the assignment to `None` is itself
// what drops the count to 0 so `remove_deep2`'s own inverse check, run on the (now
// already-detached) placement, can actually proceed to delete it).
//
// `product.is_a("IfcTypeProduct")`: strips every representation off `product
// .RepresentationMaps[*].MappedRepresentation`, and removes every `HasPropertySets`
// pset that's solely referenced by this type (via `../pset/removePset.ts`, already
// landed).
//
// --- Two more genuinely new, unported dependencies -- disclosed via a loud throw, not
// silently skipped or reimplemented, per this project's established discipline (see
// `internalCascadeHelpers.ts`'s own header comment and `../type/mapTypeRepresentations
// .ts`'s identical treatment of its own unported dependencies) ---
//
// `getattr(product, "HasOpenings", [])` -> `ifcopenshell.api.feature.remove_feature`:
// `api.feature` has no TS port of any kind. Only reached when `product` actually
// declares a non-empty `HasOpenings` (an `IfcElement` with at least one void
// relationship) -- an occurrence with no openings, or a non-`IfcElement`, is unaffected.
//
// `product.is_a("IfcGrid")` -> `ifcopenshell.api.grid.remove_grid_axis`: `api.grid` has
// no TS port of any kind. Only reached for a genuine `IfcGrid` with at least one axis --
// a non-`IfcGrid`, or an axis-free grid, is unaffected.
//
// Both are new `TODOS.md` entries (a genuinely different pair of blocked call sites
// than the pre-existing `edit_object_placement`/`api.material.assign_material`/
// `api.geometry.map_representation` entries), each thrown up front the moment it's
// clear the blocked path would actually be needed -- matching this project's "throw
// before mutating, don't leave a worse partial state than refusing outright" discipline
// (`../type/mapTypeRepresentations.ts`'s own header comment is the direct precedent).
//
// --- The generic inverse-cascade tail's own unported branch, carried over unchanged
// from `internalCascadeHelpers.ts`'s own `removeProductCascade` ---
//
// `IfcRelSpaceBoundary` -> `ifcopenshell.api.boundary.remove_boundary` (`api.boundary`
// has no TS port at all -- a `TODOS.md` entry) throws a clear, disclosed error rather
// than silently leaving a dangling/incorrect relationship.
//
// `IfcRelAssociatesMaterial` -> `ifcopenshell.api.material.unassign_material` USED to
// be a second disclosed-throw branch here (`api.material` had no TS port at all when
// this file was first written), but is now a real call: `api.material` chunk 1 landed
// `unassignMaterial`/`assignMaterial`/`copyMaterial` (`../material/index.ts`), and
// this branch was updated to call the real, exported `unassignMaterial(file,
// { products: [product] })` -- matching real Python's own exact call shape
// (`ifcopenshell.api.material.unassign_material(file, products=[product])`).
//
// --- Self-recursion and the `element_exists`/id-collect-then-refetch defensive pattern
// -- ported verbatim, matching `internalCascadeHelpers.ts`'s own already-verified
// reproduction ---
//
// Real Python collects every inverse's `.id()` first (`[i.id() for i in
// file.get_inverse(product)]`), THEN loops by id, re-resolving each via `file.by_id(...)`
// wrapped in a bare `try`/`except: continue` -- because entities are being deleted
// *during* the loop (this function's own self-recursion into `IfcRelNests`/
// `IfcRelConnectsPortToElement` subelements/ports can delete an entity that's also a
// later `inverse` in the same set), an id collected up front may no longer resolve to
// anything by the time its turn comes up; Python tolerates that by simply skipping it.
// Ported via `file.byId` wrapped in `try`/`catch { continue }`, matching
// `../group/removeGroup.ts`'s own identical, already-established precedent.
//
// Self-recursion: `IfcRelNests` (when `product` is the whole, i.e. `RelatingObject`)
// recurses into every `IfcDistributionPort` among `RelatedObjects` (never any other
// subelement class); `IfcRelConnectsPortToElement` (when `product` is the
// `RelatedElement`) recurses into `RelatingPort`. Both recursive calls go through this
// file's own exported, wrapped `removeProduct` (not a raw inner call), matching real
// Python's own `ifcopenshell.api.root.remove_product(file, product=...)` call sites --
// which, since `wrap_usecases`' reflection replaces the module's own function with the
// listener-wrapped version, also always recurse through the wrapper, not a raw inner
// function. So pre/post listeners genuinely fire on every recursive call here too, not
// just the outermost one -- intentional, not an oversight.
//
// After the `IfcRelNests` branch's own recursive sub-loop, real Python re-checks
// `element_exists(inverse_id)` before removing the rel itself, since the rel may have
// already been deleted as a side effect of removing one of its own `RelatedObjects`
// (an `IfcRelNests` becomes schema-invalid, and is auto-pruned by the same aggregate-
// reference cleanup `../group/removeGroup.ts`'s header comment documents, once its
// `RelatedObjects` empties out) -- reproduced exactly, not "corrected" to always remove.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { removeRepresentation } from "../geometry/removeRepresentation";
import { unassignRepresentation } from "../geometry/unassignRepresentation";
import { wrapUsecase } from "../hooks";
import { unassignMaterial } from "../material/unassignMaterial";
import { removePset } from "../pset/removePset";
import { unassignType } from "../type/unassignType";

/** Python's `getattr(x, name, default)` -- see `../pset/removePset.ts`'s identical `attrOrNull` helper's own doc comment for why this is duplicated per-module rather than shared. */
function attrOr<T>(instance: EntityInstance, name: string, fallback: T): T {
	try {
		return instance.get(name) as T;
	} catch {
		return fallback;
	}
}

function removeWithOwnerHistory(file: IfcFile, instance: EntityInstance): void {
	const history = attrOr<EntityInstance | null>(instance, "OwnerHistory", null);
	file.remove(instance);
	if (history) elementUtil.removeDeep2(file, history);
}

export interface RemoveProductSettings {
	/** The `IfcProduct`/`IfcTypeProduct` (or any other rooted element -- see this file's own header comment) to remove. */
	product: EntityInstance;
}

function removeProductUsecase(file: IfcFile, settings: RemoveProductSettings): void {
	const { product } = settings;

	let representations: readonly EntityInstance[] = [];

	if (product.isA("IfcProduct")) {
		// Python: `if product.Representation: representations = product.Representation
		// .Representations or [] else: representations = []` -- an explicitly guarded
		// `None`-check, unlike `../geometry/unassignRepresentation.ts`'s own
		// `unassignProductRepresentation` (which crashes on a `None` `Representation`,
		// since it's never called with one from its own real call sites).
		const productDef = product.get("Representation") as EntityInstance | null;
		representations = productDef ? ((productDef.get("Representations") as EntityInstance[] | null) ?? []) : [];

		// Remove object placement. Real Python: `product.ObjectPlacement = None;
		// ifcopenshell.util.element.remove_deep2(file, object_placement)` -- nulling the
		// attribute first is real Python's own way of dropping `object_placement`'s
		// inverse count to 0 so `remove_deep2`'s own `total_inverses(element) > 0` guard
		// doesn't refuse to remove it (`product` itself is the only real remaining
		// reference at this point, confirmed by the `getTotalInverses(...) === 1` check
		// just before).
		//
		// This port does NOT null the attribute directly: `EntityInstance.set(name,
		// null)` for an entity-typed attribute has a real, disclosed, TS-port-specific
		// native primitive-layer bug (`TODOS.md`'s "clearing an entity/aggregate-of-entity
		// attribute to `null` via `.set()` leaves a stale (unregistered-but-still-counted)
		// inverse-index entry") that would leave `objectPlacement` wrongly reporting 1
		// inverse forever, causing `removeDeep2`'s own guard to silently refuse to remove
		// it -- confirmed empirically against this worktree's own built native addon, the
		// same category of gap `../geometry/unassignRepresentation.ts`'s own
		// `unassignTypeRepresentation` already worked around for an aggregate attribute
		// (that fix doesn't apply here: there's no "assign `[]` first" equivalent for a
		// single-entity-typed attribute like `ObjectPlacement`). Instead, `removeDeep2`'s
		// own `alsoConsider` parameter is used to reach the exact same correct end state
		// via a different, unaffected code path: passing `[product]` tells `removeDeep2`
		// to treat `objectPlacement`'s one real inverse (`product.ObjectPlacement`, a
		// forward reference reachable from `product` within one level) as "also being
		// removed", satisfying its own inverse-containment check without ever touching the
		// buggy null-assignment path. `IfcFile.remove`'s own doc comment (quoted in
		// `../group/removeGroup.ts`'s header comment: "Attribute values in other entity
		// instances that reference the deleted object will be set to null") then
		// automatically nulls `product.ObjectPlacement` as a side effect of deleting
		// `objectPlacement` itself -- confirmed empirically (not assumed) to reach the
		// identical final state real Python's own working `null`-assignment achieves,
		// moments before `product` itself is deleted anyway at the end of this function.
		const objectPlacement = product.get("ObjectPlacement") as EntityInstance | null;
		if (objectPlacement) {
			if (file.getTotalInverses(objectPlacement) === 1) {
				elementUtil.removeDeep2(file, objectPlacement, [product]);
			}
		}
	} else if (product.isA("IfcTypeProduct")) {
		const representationMaps = (product.get("RepresentationMaps") as EntityInstance[] | null) ?? [];
		representations = representationMaps.map((rm) => rm.get("MappedRepresentation") as EntityInstance);

		// Remove psets.
		const psets = (product.get("HasPropertySets") as EntityInstance[] | null) ?? [];
		for (const pset of psets) {
			if (file.getTotalInverses(pset) !== 1) continue;
			removePset(file, { product, pset });
		}
	}

	for (const representation of representations) {
		unassignRepresentation(file, { product, representation });
		removeRepresentation(file, { representation });
	}

	// See this file's own header comment -- `api.feature` has no TS port of any kind.
	// Only reached when `product` genuinely declares a non-empty `HasOpenings`.
	const openings = attrOr<EntityInstance[] | null>(product, "HasOpenings", null) ?? [];
	if (openings.length > 0) {
		throw new Error(
			"removeProduct: removing an element's HasOpenings needs api.feature.removeFeature, not ported yet -- see TODOS.md.",
		);
	}

	// See this file's own header comment -- `api.grid` has no TS port of any kind. Only
	// reached for a genuine IfcGrid with at least one axis.
	if (product.isA("IfcGrid")) {
		const uAxes = (product.get("UAxes") as EntityInstance[] | null) ?? [];
		const vAxes = (product.get("VAxes") as EntityInstance[] | null) ?? [];
		const wAxes = (product.get("WAxes") as EntityInstance[] | null) ?? [];
		if (uAxes.length + vAxes.length + wAxes.length > 0) {
			throw new Error(
				"removeProduct: removing an IfcGrid's axes needs api.grid.removeGridAxis, not ported yet -- see TODOS.md.",
			);
		}
	}

	function elementExists(elementId: number): boolean {
		try {
			file.byId(elementId);
			return true;
		} catch {
			return false;
		}
	}

	// TODO: remove object placement and other relationships (Python's own TODO comment,
	// ported verbatim -- object placement is in fact handled above, this comment is a
	// real, harmless leftover in the real source, not acted upon further here either).
	//
	// Collect ids up front -- see this file's own header comment for why re-resolving by
	// id (tolerating a since-deleted id) is load-bearing here, not merely a style choice.
	const inverseIds = [...(file.getInverse(product) as Set<EntityInstance>)].map((i) => i.id());

	for (const inverseId of inverseIds) {
		let inverse: EntityInstance;
		try {
			inverse = file.byId(inverseId);
		} catch {
			continue;
		}

		if (inverse.isA("IfcRelDefinesByProperties")) {
			removePset(file, { product, pset: inverse.get("RelatingPropertyDefinition") as EntityInstance });
		} else if (inverse.isA("IfcRelAssociatesMaterial")) {
			unassignMaterial(file, { products: [product] });
		} else if (inverse.isA("IfcRelDefinesByType")) {
			const relatingType = inverse.get("RelatingType") as EntityInstance | null;
			if (relatingType?.equals(product)) {
				unassignType(file, { relatedObjects: inverse.get("RelatedObjects") as EntityInstance[] });
			} else {
				unassignType(file, { relatedObjects: [product] });
			}
		} else if (inverse.isA("IfcRelSpaceBoundary")) {
			throw new Error(
				"removeProduct: IfcRelSpaceBoundary cleanup needs api.boundary.removeBoundary, not ported yet -- see TODOS.md.",
			);
		} else if (
			inverse.isA("IfcRelFillsElement") ||
			inverse.isA("IfcRelVoidsElement") ||
			inverse.isA("IfcRelServicesBuildings")
		) {
			removeWithOwnerHistory(file, inverse);
		} else if (inverse.isA("IfcRelNests")) {
			const relatingObject = inverse.get("RelatingObject") as EntityInstance | null;
			if (relatingObject?.equals(product)) {
				const nestsId = inverse.id();
				for (const subelement of inverse.get("RelatedObjects") as EntityInstance[]) {
					if (subelement.isA("IfcDistributionPort")) {
						removeProduct(file, { product: subelement });
					}
				}
				// IfcRelNests could have already been deleted after removing one of the
				// products -- matching real Python's own `element_exists(inverse_id)` re-check.
				if (elementExists(nestsId)) {
					removeWithOwnerHistory(file, inverse);
				}
			} else {
				const related = (inverse.get("RelatedObjects") as EntityInstance[] | null) ?? [];
				if (related.length === 1 && related[0].equals(product)) {
					removeWithOwnerHistory(file, inverse);
				}
			}
		} else if (inverse.isA("IfcRelAggregates")) {
			const relatingObject = inverse.get("RelatingObject") as EntityInstance | null;
			const related = inverse.get("RelatedObjects") as EntityInstance[];
			if (relatingObject?.equals(product) || related.length === 1) {
				removeWithOwnerHistory(file, inverse);
			}
		} else if (inverse.isA("IfcRelContainedInSpatialStructure")) {
			const relatingStructure = inverse.get("RelatingStructure") as EntityInstance | null;
			const relatedElements = inverse.get("RelatedElements") as EntityInstance[];
			if (relatingStructure?.equals(product) || relatedElements.length === 1) {
				removeWithOwnerHistory(file, inverse);
			}
		} else if (inverse.isA("IfcRelConnectsElements")) {
			if (inverse.isA("IfcRelConnectsWithRealizingElements")) {
				const relatingElement = inverse.get("RelatingElement") as EntityInstance;
				const relatedElement = inverse.get("RelatedElement") as EntityInstance;
				const realizingElements = (inverse.get("RealizingElements") as EntityInstance[] | null) ?? [];
				const productIsEndpoint = relatingElement.equals(product) || relatedElement.equals(product);
				const otherRealizingElementExists = realizingElements.some((el) => !el.equals(product));
				if (!productIsEndpoint && otherRealizingElementExists) {
					continue;
				}
			}
			removeWithOwnerHistory(file, inverse);
		} else if (inverse.isA("IfcRelConnectsPortToElement")) {
			const relatedElement = inverse.get("RelatedElement") as EntityInstance;
			const relatingPort = inverse.get("RelatingPort") as EntityInstance;
			if (relatedElement.equals(product)) {
				removeProduct(file, { product: relatingPort });
			} else if (relatingPort.equals(product)) {
				removeWithOwnerHistory(file, inverse);
			}
		} else if (inverse.isA("IfcRelConnectsPorts")) {
			const relatingPort = inverse.get("RelatingPort") as EntityInstance;
			const relatedPort = inverse.get("RelatedPort") as EntityInstance;
			if (!relatingPort.equals(product) && !relatedPort.equals(product)) {
				// Not RelatingPort/RelatedPort -- it's the optional RealizingElement, so
				// keep the relationship.
				continue;
			}
			removeWithOwnerHistory(file, inverse);
		} else if (inverse.isA("IfcRelAssignsToGroup")) {
			const related = inverse.get("RelatedObjects") as EntityInstance[];
			if (related.length === 1) {
				removeWithOwnerHistory(file, inverse);
			}
		} else if (inverse.isA("IfcRelAssignsToProduct")) {
			const relatingProduct = inverse.get("RelatingProduct") as EntityInstance | null;
			const related = inverse.get("RelatedObjects") as EntityInstance[];
			if (relatingProduct?.equals(product) || related.length === 1) {
				removeWithOwnerHistory(file, inverse);
			}
		} else if (inverse.isA("IfcRelFlowControlElements")) {
			const relatingFlowElement = inverse.get("RelatingFlowElement") as EntityInstance | null;
			const relatedControlElements = (inverse.get("RelatedControlElements") as EntityInstance[] | null) ?? [];
			if (
				relatingFlowElement?.equals(product) ||
				(relatedControlElements.length === 1 && relatedControlElements[0].equals(product))
			) {
				removeWithOwnerHistory(file, inverse);
			}
		}
	}

	removeWithOwnerHistory(file, product);
}

/**
 * Removes a product (Python: `ifcopenshell.api.root.remove_product`).
 *
 * This is effectively a smart delete function that not only removes a product, but
 * also all of its relationships. It is always recommended to use this function to
 * prevent orphaned data in your IFC model.
 *
 * This is intended to be used for removing:
 * - `IfcAnnotation`
 * - `IfcElement`
 * - `IfcElementType`
 * - `IfcSpatialElement`
 * - `IfcSpatialElementType`
 *
 * For example, geometric representations are removed. Placement coordinates are also
 * removed. Properties are removed. Material, type, containment, aggregation, and
 * nesting relationships are removed (but naturally, the materials, types, containers,
 * etc themselves remain).
 *
 * **Disclosed, real blockers** (throws, see this file's own header comment and
 * `TODOS.md`): removing an element with `HasOpenings` (needs `api.feature`), removing
 * an `IfcGrid` with axes (needs `api.grid`), or a space boundary (needs `api.boundary
 * .removeBoundary`) -- none of those 3 modules have any TS port yet. A material
 * association is no longer one of these -- `api.material.unassignMaterial` is real
 * (see `../material/index.ts`). Every other relationship this function cleans up is
 * fully ported.
 *
 * @example
 * ```ts
 * // We have a wall.
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 *
 * // No we don't.
 * api.root.removeProduct(model, { product: wall });
 * ```
 */
export const removeProduct = wrapUsecase("root.remove_product", removeProductUsecase);
