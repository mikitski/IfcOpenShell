// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/remove_pset.py` (src/ifcopenshell-python, 81 lines) --
// **NOT this project's own `api.pset` chunk** (that remains a future, much larger
// chunk: 8 files/8 public functions per `research/02-api-layer.md`, with `edit_pset.py`
// alone the single biggest file in the whole `api` package). Ported here, alone, as a
// small, self-contained, direct dependency of `../group/removeGroup.ts` (real Python:
// `ifcopenshell.api.pset.remove_pset(file, product=group, pset=inverse.
// RelatingPropertyDefinition)`, called on every `IfcRelDefinesByProperties` found
// hanging off a group being removed). Confirmed self-contained by reading the real
// source directly: its only import is `ifcopenshell.util.element` (already fully
// ported), no `ifcopenshell.api.*` cross-dependency of any kind -- unlike, say,
// `edit_pset.py`'s own much larger surface. This is the FIRST file in a new `src/api/
// pset/` area; when `api.pset` lands as its own, larger future chunk, this file's
// `removePset` should be treated as already landed (reviewed against the real Python
// source below) rather than re-ported from scratch, matching `../geometry/index.ts`'s
// own established precedent for the identical "small direct dependency of an unrelated
// chunk, ported alone, ahead of its own module" situation.
//
// Removes a property/quantity set (`IfcPropertySet`/`IfcElementQuantity`, or --
// IFC2X3-specific pre-`IfcPreDefinedPropertySet` naming aside -- an `IfcMaterialProperties`/
// `IfcProfileProperties` "extended properties" definition) from a product, deleting the
// `IfcRelDefinesByProperties` that links them if `product` was its only related object
// (or just detaching `product` from that rel's `RelatedObjects` if others remain), then
// deleting the pset/qto itself -- along with any of its own properties/quantities that
// become orphaned as a result (an enumerated property's `IfcPropertyEnumeration`
// included, if it too becomes orphaned) -- unless another `IfcRelDefinesByProperties`
// still points at the same pset for a different product, in which case the pset (and
// its properties) are left alone entirely and only the rel is detached/purged.
//
// `getattr(pset, "OwnerHistory", None)` (real Python's own comment: "IfcMaterialProperties
// and IfcProfileProperties don't have OwnerHistory" -- neither is an `IfcRoot` subtype)
// is ported via the same `try`/`catch`-based `attrOrNull` shape `createEntity.ts`'s
// local `hasAttribute` helper already established for the identical "attribute may not
// be declared on this class at all" `hasattr`/`getattr(..., default)` distinction.
//
// --- Disclosed finding: `IfcQuantitySet` genuinely doesn't exist in IFC2X3 ---
//
// Confirmed directly against the generated `.d.ts`s, not assumed: `IfcQuantitySet` (the
// class this function's `pset.isA("IfcQuantitySet")` branch checks for) was introduced
// in IFC4 and has no IFC2X3 counterpart at all -- `ifc2x3.d.ts` has no such interface,
// while `ifc4.d.ts`/`ifc4x3.d.ts` both do. So on IFC2X3, an `IfcElementQuantity`
// instance's `isA("IfcQuantitySet")` check (this port) / `is_a("IfcQuantitySet")` check
// (real Python -- identical here, both simply resolve against the live schema
// declaration and return `false` for a class name the schema doesn't have, rather than
// throwing) never matches, so `properties` stays `[]` (the "predefined pset has no
// properties" default) and an IFC2X3 quantity set's own quantities are never queued for
// removal by this function at all -- a real, inherent behavior of the real Python
// source on IFC2X3, not something this port introduces, and never exercised by real
// Python's own test suite (`test_remove_pset.py` only ever runs against IFC4 -- see
// `removePset.test.ts`'s own header comment). Reproduced verbatim, pinned by a dedicated
// IFC2X3 branch in that same test.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

/** Python's `getattr(x, name, None)` -- see this file's header comment. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

function removeIfOrphanedHistory(file: IfcFile, instance: EntityInstance): void {
	const history = attrOrNull(instance, "OwnerHistory") as EntityInstance | null;
	file.remove(instance);
	if (history) elementUtil.removeDeep2(file, history);
}

export interface RemovePsetSettings {
	/** The `IfcObject` (or `IfcMaterial`/`IfcProfileDef`) to remove the property set from. */
	product: EntityInstance;
	/** The `IfcPropertySet` or `IfcElementQuantity` (or material/profile properties) to remove. */
	pset: EntityInstance;
}

function removePsetUsecase(file: IfcFile, settings: RemovePsetSettings): void {
	const { product, pset } = settings;

	const toPurge: EntityInstance[] = [];
	let shouldRemovePset = true;

	for (const inverse of file.getInverse(pset) as Set<EntityInstance>) {
		if (!inverse.isA("IfcRelDefinesByProperties")) continue;
		const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[] | null;
		if (!relatedObjects || relatedObjects.length === 1) {
			toPurge.push(inverse);
		} else {
			// Python: `related_objects.remove(product)` -- removes only the FIRST element
			// equal to `product` (not every equal element, unlike a naive `.filter()`), and
			// raises `ValueError` if `product` isn't actually a member at all. Reproduced
			// faithfully rather than silently widened to "remove every matching element" /
			// silently tolerating a no-op when `product` isn't present.
			const remaining = [...relatedObjects];
			const index = remaining.findIndex((o) => o.equals(product));
			if (index === -1) {
				throw new Error(`entity instance of type '${product.isA()}' (#${product.id()}) is not in list`);
			}
			remaining.splice(index, 1);
			inverse.set("RelatedObjects", remaining);
			shouldRemovePset = false;
		}
	}

	if (shouldRemovePset) {
		// Predefined psets have no properties.
		let properties: readonly EntityInstance[] = [];
		if (pset.isA("IfcPropertySet")) {
			properties = (pset.get("HasProperties") as EntityInstance[] | null) ?? [];
		} else if (pset.isA("IfcQuantitySet")) {
			properties = (pset.get("Quantities") as EntityInstance[] | null) ?? [];
		} else if (pset.isA() === "IfcMaterialProperties" || pset.isA() === "IfcProfileProperties") {
			// Python: `pset.is_a() in ("IfcMaterialProperties", "IfcProfileProperties")` --
			// unlike the two branches above (which call `is_a("X")` WITH an argument, a
			// subtype check), this is `is_a()` with NO argument compared against an exact
			// string tuple -- an EXACT-class match, not a subtype check. This is load-
			// bearing on IFC2X3: `IfcMaterialProperties` there is an ABSTRACT supertype
			// whose only concrete subtype, `IfcExtendedMaterialProperties`, has a
			// different `is_a()` string and so never actually matches this branch in real
			// Python either (its own `properties` stays `[]`, the "predefined pset" default
			// two lines above) -- confirmed directly against `ifc2x3.d.ts`, not assumed;
			// see this file's own test suite header comment for the full writeup. Ported
			// via `.isA()` (no argument, this port's own exact-class-name accessor) rather
			// than `.isA("IfcMaterialProperties")`/`.isA("IfcProfileProperties")` (which,
			// per this port's `isA(type)` subtype-check semantics, WOULD wrongly match an
			// IFC2X3 `IfcExtendedMaterialProperties` instance) specifically to preserve
			// this exact-match distinction, not merely for style.
			properties = (pset.get("Properties") as EntityInstance[] | null) ?? [];
		}
		for (const prop of properties) {
			if (file.getTotalInverses(prop) !== 1) continue;
			if (prop.isA("IfcPropertyEnumeratedValue")) {
				const enumeration = prop.get("EnumerationReference") as EntityInstance | null;
				if (enumeration && file.getTotalInverses(enumeration) === 1) {
					file.remove(enumeration);
				}
			}
			file.remove(prop);
		}
		// IfcMaterialProperties and IfcProfileProperties don't have OwnerHistory.
		removeIfOrphanedHistory(file, pset);
	}

	for (const element of toPurge) {
		removeIfOrphanedHistory(file, element);
	}
}

/**
 * Removes a property set from a product (Python: `ifcopenshell.api.pset.remove_pset`).
 *
 * All properties that are part of this property set are also removed.
 *
 * Note: `api.pset.addPset`/`api.pset.editPset` (Python's own docstring example) are not
 * yet ported in this codebase (a future, larger `api.pset` chunk) -- `pset` here would
 * come from a construction path such as `../group/removeGroup.ts`'s own caller (a
 * pre-existing `IfcPropertySet`/`IfcElementQuantity` found via `IfcRelDefinesByProperties
 * .RelatingPropertyDefinition`).
 *
 * @example
 * ```ts
 * api.pset.removePset(model, { product: wallType, pset });
 * ```
 */
export const removePset = wrapUsecase("pset.remove_pset", removePsetUsecase);
