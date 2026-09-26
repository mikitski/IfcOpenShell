// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/edit_structural_analysis_model.py`
// (src/ifcopenshell-python, 36 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). A plain generic
// attribute-setter loop (Python: `for name, value in attributes.items(): setattr(...)`),
// structurally identical to `./editStructuralLoad.ts`/`./editStructuralLoadCase.ts`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditStructuralAnalysisModelSettings {
	/** The `IfcStructuralAnalysisModel` entity you want to edit. */
	structuralAnalysisModel: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editStructuralAnalysisModelUsecase(_file: IfcFile, settings: EditStructuralAnalysisModelSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.structuralAnalysisModel.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcStructuralAnalysisModel` (Python:
 * `ifcopenshell.api.structural.edit_structural_analysis_model`).
 *
 * For more information about the attributes and data types of an
 * `IfcStructuralAnalysisModel`, consult the IFC documentation.
 */
export const editStructuralAnalysisModel = wrapUsecase(
	"structural.edit_structural_analysis_model",
	editStructuralAnalysisModelUsecase,
);
