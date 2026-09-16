// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/edit_structural_load.py` (src/ifcopenshell-
// python, 36 lines) -- part of this project's brand-new `api.structural` chunk (see
// `./index.ts`'s own header comment). Same plain generic attribute-setter loop shape
// as `./editStructuralAnalysisModel.ts`/`./editStructuralLoadCase.ts`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditStructuralLoadSettings {
	/** The `IfcStructuralLoad` entity you want to edit. */
	structuralLoad: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editStructuralLoadUsecase(_file: IfcFile, settings: EditStructuralLoadSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.structuralLoad.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcStructuralLoad` (Python:
 * `ifcopenshell.api.structural.edit_structural_load`).
 *
 * For more information about the attributes and data types of an `IfcStructuralLoad`,
 * consult the IFC documentation.
 */
export const editStructuralLoad = wrapUsecase("structural.edit_structural_load", editStructuralLoadUsecase);
