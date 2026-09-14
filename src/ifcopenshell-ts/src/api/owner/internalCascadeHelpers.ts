// This file was generated with the assistance of an AI coding tool.
//
// *** NOT a port of any single real-Python file. Internal-only helpers, private to
// this `owner` "person/organisation/application" chunk, never exported from
// `./index.ts`. Read this header before touching `./removePerson.ts`/
// `./removeOrganisation.ts`/`./removePersonAndOrganisation.ts`, which all depend on
// this file. ***
//
// Real `remove_person.py`/`remove_organisation.py`/`remove_person_and_organisation.py`
// each call three functions this chunk (chunk 1 of 2, the "person/organisation/
// application family") was explicitly told NOT to port: `ifcopenshell.api.owner.
// remove_role`/`.remove_address` (both real files in `ifcopenshell/api/owner/`,
// assigned to chunk 2, the "actor/role/address family") and `ifcopenshell.api.root.
// remove_product` (a real, 223-line file in `ifcopenshell/api/root/`, itself a future,
// much larger chunk of its own: it fans out into `api.boundary`/`api.feature`/
// `api.grid`/`api.material`, none of which are ported at all yet, plus `api.pset`/
// `api.type`/`api.geometry`, which are only ever PARTIALLY ported so far).
//
// UPDATE (chunk 2 landed): `remove_role`/`remove_address` are now real, exported ports
// -- `./removeRole.ts`/`./removeAddress.ts` -- verified line-by-line identical to this
// file's own former `removeRoleCascade`/`removeAddressCascade` helpers, which have been
// deleted; `./removePerson.ts`/`./removeOrganisation.ts` now call the real exports
// directly instead. `root.remove_product` is STILL a future, unported chunk -- this
// file's own `removeProductCascade` (below) remains the disclosed, narrow, private
// reproduction described in its own doc comment, to be deleted in favor of the real,
// exported `root.removeProduct` once that future chunk lands.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { removePset } from "../pset/removePset";
import { unassignType } from "../type/unassignType";

/**
 * Python's `getattr(x, name, default)` for a possibly-undeclared-on-this-class
 * attribute -- matches `../root/createEntity.ts`'s own `hasAttribute` local helper's
 * underlying mechanism (an undeclared attribute's `.get()` throws; this catches that
 * and substitutes `fallback` instead), independently re-declared here since that one
 * is `root/createEntity.ts`-local, not exported.
 */
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

/**
 * Python: `ifcopenshell.api.root.remove_product` (`ifcopenshell/api/root/
 * remove_product.py`, 223 lines) -- **NOT a full port** (see this file's own header
 * comment). `remove_person`/`remove_organisation`/`remove_person_and_organisation` only
 * ever call the real function on an `IfcActor`/`IfcOccupant` (both always `TheActor`-
 * wrapping, never `IfcProduct`/`IfcTypeProduct`), or -- `remove_person`'s IFC2X3-only
 * `IfcInventory` branch -- an `IfcInventory` (`IfcControl`, likewise never `IfcProduct`/
 * `IfcTypeProduct` in any of the 3 schemas). Real Python's own `remove_product` has two
 * large preambles gated behind `product.is_a("IfcProduct")`/`product.is_a(
 * "IfcTypeProduct")` (representation/placement cleanup; type-level pset cleanup) that
 * can therefore never fire for either of this chunk's two call sites -- this port
 * checks both `isA` guards explicitly (not merely assumed false) and throws a clear,
 * loud error rather than silently skipping real cleanup logic on the off chance a
 * caller ever does pass a genuine `IfcProduct`/`IfcTypeProduct` through this exact path
 * (which would require a future, wider `IfcInventory` or `IfcActor`-like class to
 * become a `IfcProduct` subtype in some future schema -- not the case in IFC2X3/IFC4/
 * IFC4X3 today).
 *
 * The generic inverse-cascade tail (the part that DOES apply) is ported in full below,
 * covering every branch of the real `is_a` dispatch chain except two that would need
 * entirely unported sibling modules (`IfcRelAssociatesMaterial` -> `api.material.
 * unassign_material`; `IfcRelSpaceBoundary` -> `api.boundary.remove_boundary`) -- both
 * throw a clear, disclosed "not supported" error if actually encountered, rather than
 * silently leaving a dangling/incorrect relationship. Neither branch is exercised by
 * this chunk's own ported tests (a bare actor/occupant/inventory has neither a material
 * association nor a space boundary in practice).
 *
 * Real Python collects every inverse's `.id()` first (`[i.id() for i in
 * file.get_inverse(product)]`), THEN loops by id, re-resolving each via `file.by_id(...)`
 * wrapped in a bare `try`/`except: continue` -- because entities are being deleted
 * *during* the loop (this function's own self-recursion into `IfcRelNests`/
 * `IfcRelConnectsPortToElement` subelements/ports can delete an entity that's also a
 * later `inverse` in the same set), an id collected up front may no longer resolve to
 * anything by the time its turn comes up; Python tolerates that by simply skipping it.
 * Ported verbatim via `file.byId` wrapped in `try`/`catch { continue }`, matching
 * `../group/removeGroup.ts`'s own identical, already-established precedent for this
 * exact defensive pattern.
 */
export function removeProductCascade(file: IfcFile, product: EntityInstance): void {
	if (product.isA("IfcProduct") || product.isA("IfcTypeProduct")) {
		throw new Error(
			`removeProductCascade: '${product.isA()}' is an IfcProduct/IfcTypeProduct -- this narrow, internal reproduction of api.root.remove_product only covers the generic inverse-cascade tail used by api.owner's remove_person/remove_organisation/remove_person_and_organisation, not the representation/placement/type-pset preambles a real product needs. See internalCascadeHelpers.ts's own header comment.`,
		);
	}

	// Real Python: `for opening in getattr(product, "HasOpenings", []) or []:
	// ifcopenshell.api.feature.remove_feature(file, feature=opening.RelatedOpeningElement)`.
	// Neither IfcActor/IfcOccupant nor IfcInventory declares `HasOpenings`, so this is
	// always `[]` for every real call site -- included for structural fidelity, throws
	// (rather than silently doing nothing) if that assumption is ever violated, since
	// `api.feature` isn't ported at all.
	const openings = attrOr<EntityInstance[] | null>(product, "HasOpenings", null) ?? [];
	if (openings.length > 0) {
		throw new Error("removeProductCascade: HasOpenings cleanup needs api.feature.remove_feature, not ported yet.");
	}

	// Real Python: `if product.is_a("IfcGrid"): for axis in ...: remove_grid_axis(...)`.
	// Never true for this chunk's call sites; `api.grid` isn't ported at all.
	if (product.isA("IfcGrid")) {
		throw new Error("removeProductCascade: IfcGrid axis cleanup needs api.grid.remove_grid_axis, not ported yet.");
	}

	// Collect ids up front -- see this function's own doc comment for why re-resolving
	// by id (tolerating a since-deleted id) is load-bearing here, not merely a style
	// choice.
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
			throw new Error(
				"removeProductCascade: IfcRelAssociatesMaterial cleanup needs api.material.unassign_material, not ported yet.",
			);
		} else if (inverse.isA("IfcRelDefinesByType")) {
			const relatingType = inverse.get("RelatingType") as EntityInstance | null;
			if (relatingType?.equals(product)) {
				unassignType(file, { relatedObjects: inverse.get("RelatedObjects") as EntityInstance[] });
			} else {
				unassignType(file, { relatedObjects: [product] });
			}
		} else if (inverse.isA("IfcRelSpaceBoundary")) {
			throw new Error(
				"removeProductCascade: IfcRelSpaceBoundary cleanup needs api.boundary.remove_boundary, not ported yet.",
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
				const inverseId = inverse.id();
				for (const subelement of inverse.get("RelatedObjects") as EntityInstance[]) {
					if (subelement.isA("IfcDistributionPort")) {
						removeProductCascade(file, subelement);
					}
				}
				// IfcRelNests could have already been deleted after removing one of the
				// products (self-recursion above may cascade into it) -- matching real
				// Python's own `element_exists(inverse_id)` re-check.
				let stillExists = true;
				try {
					file.byId(inverseId);
				} catch {
					stillExists = false;
				}
				if (stillExists) removeWithOwnerHistory(file, inverse);
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
				removeProductCascade(file, relatingPort);
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
