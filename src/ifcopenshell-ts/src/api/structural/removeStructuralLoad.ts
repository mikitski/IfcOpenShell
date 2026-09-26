// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/remove_structural_load.py`
// (src/ifcopenshell-python, 27 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Trivial: a bare
// `file.remove(structural_load)`, no history/cascade handling at all -- matching real
// Python exactly (`IfcStructuralLoad` subtypes are not `IfcRoot` subtypes, so there is
// no `OwnerHistory` to cascade-remove in the first place).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveStructuralLoadSettings {
	/** The `IfcStructuralLoad` to remove. */
	structuralLoad: EntityInstance;
}

function removeStructuralLoadUsecase(file: IfcFile, settings: RemoveStructuralLoadSettings): void {
	file.remove(settings.structuralLoad);
}

/**
 * Removes a structural load (Python:
 * `ifcopenshell.api.structural.remove_structural_load`).
 */
export const removeStructuralLoad = wrapUsecase("structural.remove_structural_load", removeStructuralLoadUsecase);
