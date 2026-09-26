// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/feature/add_filling.py` (src/ifcopenshell-python, 117
// lines) -- fills an `IfcOpeningElement` with an `IfcElement` (e.g. a door/window
// filling an opening) via `IfcRelFillsElement`.
//
// --- Real, disclosed quirk: NO `IfcOwnerHistory` is ever recorded on the created rel
// ---
//
// Unlike literally every other relationship this project's `api.*` ports create
// (including this module's own `addFeature.ts`, `IfcRelVoidsElement`/
// `IfcRelProjectsElement`/`IfcRelAdheresToElement` all get a real
// `ifcopenshell.api.owner.create_owner_history(file)`), real Python's own
// `add_filling` constructs `IfcRelFillsElement` via KEYWORD arguments that skip
// `OwnerHistory` entirely:
//
// ```python
// return file.create_entity(
//     "IfcRelFillsElement",
//     GlobalId=ifcopenshell.guid.new(),
//     RelatingOpeningElement=opening,
//     RelatedBuildingElement=element,
// )
// ```
//
// `OwnerHistory`/`Name`/`Description` are simply never assigned, so they keep their
// EXPRESS-default unset (`$`/`None`) values -- this is a genuine, real Python quirk
// (arguably a bug, since every other `IfcRelFillsElement`-adjacent rel in this
// codebase does get an owner history), preserved verbatim here rather than "fixed" by
// calling `createOwnerHistory` anyway. This port's `IfcFile.createEntity` only accepts
// positional args (no kwargs), so the identical final state (only `GlobalId`,
// `RelatingOpeningElement`, `RelatedBuildingElement` set) is reached by passing `null`
// for the skipped `OwnerHistory`/`Name`/`Description` positions instead -- confirmed
// this is exactly what real Python's kwargs-only call leaves those 3 attributes as
// (verified against `generated/ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`'s identical
// `IfcRelFillsElement` attribute order: `GlobalId`, `OwnerHistory`, `Name`,
// `Description`, `RelatingOpeningElement`, `RelatedBuildingElement`, in all 3 schemas).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface AddFillingSettings {
	/** The `IfcOpeningElement` to fill with the element. */
	opening: EntityInstance;
	/** The `IfcElement` to be inserted into the opening. */
	element: EntityInstance;
}

function addFillingUsecase(file: IfcFile, settings: AddFillingSettings): EntityInstance {
	const { opening, element } = settings;

	const fillsVoids = element.get("FillsVoids") as EntityInstance[];

	if (fillsVoids.length > 0) {
		if ((fillsVoids[0].get("RelatingOpeningElement") as EntityInstance).equals(opening)) {
			return fillsVoids[0];
		}
		const history = fillsVoids[0].get("OwnerHistory") as EntityInstance | null;
		file.remove(fillsVoids[0]);
		if (history) elementUtil.removeDeep2(file, history);
	}

	// See this file's header comment: `OwnerHistory`/`Name`/`Description` are
	// deliberately left `null` -- a real, disclosed Python quirk (no owner history is
	// ever recorded for a filling relationship), not an oversight in this port.
	return file.createEntity("IfcRelFillsElement", guid.new(), null, null, null, opening, element);
}

/**
 * Fill an opening with an element (Python: `ifcopenshell.api.feature.add_filling`).
 *
 * Physical elements may have openings in them. For example, a wall might have an
 * opening for a door. That opening is then filled by the door. This indicates that
 * when the door moves, the opening will move with it. Or if the door is removed, then
 * the opening may remain and need to be filled.
 *
 * @returns The new (or, when `element` is already filling `opening`, existing)
 * `IfcRelFillsElement` relationship. Note: unlike most `api.*`-created relationships,
 * this rel is never given an `IfcOwnerHistory` -- see this file's header comment.
 */
export const addFilling = wrapUsecase("feature.add_filling", addFillingUsecase);
