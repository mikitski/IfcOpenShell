// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/feature/remove_feature.py` (src/ifcopenshell-python, 70
// lines) -- permanently deletes a feature element (opening/projection/surface
// feature) and its void/projection/adherence relationship, then delegates to
// `api.root.removeProduct` for the generic product-removal cascade. Fillings (doors,
// windows) that occupied the removed opening are explicitly cleaned up first (their
// `IfcRelFillsElement` is removed, but the filling element itself is left alone --
// matching the real docstring: "Any fillings ... become orphaned and must be
// separately deleted via root.remove_product").
//
// --- Real, disclosed Python BUG, preserved verbatim: `IfcSurfaceFeature`'s non-IFC4
// branch reads the WRONG inverse attribute ---
//
// ```python
// elif feature.is_a("IfcSurfaceFeature"):
//     if file.schema == "IFC4":
//         ifcopenshell.api.aggregate.unassign_object(file, products=[feature])
//         rels = []
//     else:
//         rels = feature.ProjectsElements
// ```
//
// On IFC4X3 (the only other schema where `IfcSurfaceFeature` even exists --
// confirmed absent from `generated/ifc2x3.d.ts`), a surface feature adheres to its
// element via `AdheresToElement`/`IfcRelAdheresToElement` (see `addFeature.ts`'s own
// header comment) -- `ProjectsElements` is a DIFFERENT inverse attribute, declared
// only on the sibling class `IfcFeatureElementAddition` (confirmed by reading
// `generated/ifc4x3.d.ts`: `IfcSurfaceFeature`, `IfcFeatureElementAddition`, and
// `IfcFeatureElementSubtraction` are three independent direct subtypes of
// `IfcFeatureElement`, not a subtype chain -- `IfcSurfaceFeature` never declares
// `ProjectsElements` at all). Real Python's own `entity_instance.__getattr__` raises
// `AttributeError: 'IfcSurfaceFeature' object has no attribute 'ProjectsElements'`
// for this, so `remove_feature` on an IFC4X3 `IfcSurfaceFeature` that was added via
// the real `AdheresToElement` relationship (i.e. every genuine IFC4X3 surface
// feature) unconditionally crashes today in real Python too -- this is a real,
// pre-existing upstream bug, not something introduced by this port. Ported verbatim
// (`feature.get("ProjectsElements")`, which throws the equivalent
// `entity instance of type 'IfcSurfaceFeature' has no attribute 'ProjectsElements'`
// error via this port's own `EntityInstance.get()`), not "corrected" to the presumably
// intended `AdheresToElement` -- see this project's own porting discipline (preserve
// real quirks/bugs verbatim, disclose rather than silently fix). Pinned by a dedicated
// regression test in `removeFeature.test.ts` (gated to IFC4X3 only, since the bug is
// only reachable on that schema).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { unassignObject } from "../aggregate/unassignObject";
import { wrapUsecase } from "../hooks";
import { removeProduct } from "../root/removeProduct";

function removeRelWithOwnerHistory(file: IfcFile, rel: EntityInstance): void {
	const history = rel.get("OwnerHistory") as EntityInstance | null;
	file.remove(rel);
	if (history) elementUtil.removeDeep2(file, history);
}

export interface RemoveFeatureSettings {
	/** The `IfcFeatureElement` to remove. */
	feature: EntityInstance;
}

function removeFeatureUsecase(file: IfcFile, settings: RemoveFeatureSettings): void {
	const { feature } = settings;

	let rels: readonly EntityInstance[];

	if (feature.isA("IfcFeatureElementSubtraction")) {
		rels = feature.get("VoidsElements") as EntityInstance[];
	} else if (feature.isA("IfcFeatureElementAddition")) {
		rels = feature.get("ProjectsElements") as EntityInstance[];
	} else if (feature.isA("IfcSurfaceFeature")) {
		if (file.schema === "IFC4") {
			unassignObject(file, { products: [feature] });
			rels = [];
		} else {
			// See this file's header comment: this is a real, disclosed Python bug
			// (reads `ProjectsElements`, not `AdheresToElement`), preserved verbatim --
			// throws for any genuine IFC4X3 `IfcSurfaceFeature`.
			rels = feature.get("ProjectsElements") as EntityInstance[];
		}
	} else {
		// Python: `assert False, feature` -- unreachable for any real `IfcFeatureElement`
		// subtype, ported as a thrown Error.
		throw new Error(`Unexpected feature class: ${feature.isA()}`);
	}

	for (const rel of rels) {
		removeRelWithOwnerHistory(file, rel);
	}

	if (feature.isA("IfcOpeningElement")) {
		for (const rel of feature.get("HasFillings") as EntityInstance[]) {
			removeRelWithOwnerHistory(file, rel);
		}
	}

	removeProduct(file, { product: feature });
}

/**
 * Permanently delete a feature element and its void or projection relationship
 * (Python: `ifcopenshell.api.feature.remove_feature`).
 *
 * The feature entity (e.g. `IfcOpeningElement`) is removed from the model along with
 * its `IfcRelVoidsElement`/`IfcRelProjectsElement`/`IfcRelAdheresToElement`
 * relationship. The host element (wall, slab, etc.) is unaffected. Any fillings
 * (windows, doors) that occupied the opening become orphaned and must be separately
 * deleted via `api.root.removeProduct`.
 *
 * **Disclosed, real upstream Python bug, preserved verbatim** (see this file's own
 * header comment): removing an IFC4X3 `IfcSurfaceFeature` throws, because real
 * Python's own non-IFC4 branch reads the wrong inverse attribute
 * (`ProjectsElements` instead of `AdheresToElement`).
 */
export const removeFeature = wrapUsecase("feature.remove_feature", removeFeatureUsecase);
