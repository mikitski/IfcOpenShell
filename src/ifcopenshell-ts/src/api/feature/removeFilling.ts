// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/feature/remove_filling.py` (src/ifcopenshell-python, 59
// lines) -- the smallest file in this module. Removes the `IfcRelFillsElement`
// relationship for an element that fills an opening, WITHOUT deleting either the
// opening or the filling element itself.
//
// --- `file.by_type("IfcRelFillsElement")` scan, not `element.FillsVoids` ---
//
// Unlike `addFilling.ts`'s own lookup (`element.FillsVoids`, the direct inverse), real
// Python's `remove_filling` scans EVERY `IfcRelFillsElement` in the whole file and
// compares each one's `RelatedBuildingElement` to `element`, stopping at the first
// match (`break`). Since a given `element` can only ever fill at most one opening at a
// time in practice (`addFilling` itself enforces this: it always removes any existing
// `element.FillsVoids[0]` before creating a new one), this full-file scan and
// `element.FillsVoids[0]`-then-remove would reach the identical result for every
// reachable real-world state -- but this port reproduces the real, less efficient
// `file.byType("IfcRelFillsElement")` scan verbatim rather than "optimizing" it to the
// more direct inverse lookup, matching this project's "preserve real quirks, even
// inefficient ones" discipline. No real Python test constructs a state where this
// would observably differ (multiple `IfcRelFillsElement`s pointing at the same
// `RelatedBuildingElement`), since nothing in this module ever produces one.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveFillingSettings {
	/** The element filling an opening. */
	element: EntityInstance;
}

function removeFillingUsecase(file: IfcFile, settings: RemoveFillingSettings): void {
	const { element } = settings;

	for (const rel of file.byType("IfcRelFillsElement")) {
		if ((rel.get("RelatedBuildingElement") as EntityInstance).equals(element)) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
			break;
		}
	}
}

/**
 * Remove a filling relationship (Python: `ifcopenshell.api.feature.remove_filling`).
 *
 * If an element is filling an opening, this removes the relationship such that the
 * opening and element both still exist, but the element no longer fills the opening.
 */
export const removeFilling = wrapUsecase("feature.remove_filling", removeFillingUsecase);
