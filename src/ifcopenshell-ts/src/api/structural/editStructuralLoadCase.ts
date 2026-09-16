// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/edit_structural_load_case.py`
// (src/ifcopenshell-python, 36 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Same plain generic
// attribute-setter loop shape as `./editStructuralAnalysisModel.ts`/`./editStructuralLoad.ts`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditStructuralLoadCaseSettings {
	/** The `IfcStructuralLoadCase` entity you want to edit. */
	loadCase: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editStructuralLoadCaseUsecase(_file: IfcFile, settings: EditStructuralLoadCaseSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.loadCase.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcStructuralLoadCase` (Python:
 * `ifcopenshell.api.structural.edit_structural_load_case`).
 *
 * For more information about the attributes and data types of an
 * `IfcStructuralLoadCase`, consult the IFC documentation.
 */
export const editStructuralLoadCase = wrapUsecase(
	"structural.edit_structural_load_case",
	editStructuralLoadCaseUsecase,
);
