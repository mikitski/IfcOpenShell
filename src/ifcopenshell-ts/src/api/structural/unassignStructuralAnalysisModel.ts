// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/unassign_structural_analysis_model.py`
// (src/ifcopenshell-python, 35 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). The mirror image of
// `./assignStructuralAnalysisModel.ts`: a one-line delegation to the already-landed
// `api.group.unassignGroup`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { unassignGroup } from "../group/unassignGroup";
import { wrapUsecase } from "../hooks";

export interface UnassignStructuralAnalysisModelSettings {
	/** The structural elements that are part of the analysis. */
	products: readonly EntityInstance[];
	/** The `IfcStructuralAnalysisModel` that the structural element is related to. */
	structuralAnalysisModel: EntityInstance;
}

function unassignStructuralAnalysisModelUsecase(
	file: IfcFile,
	settings: UnassignStructuralAnalysisModelSettings,
): void {
	unassignGroup(file, { products: settings.products, group: settings.structuralAnalysisModel });
}

/**
 * Removes a relationship between a structural element and the analysis model (Python:
 * `ifcopenshell.api.structural.unassign_structural_analysis_model`).
 */
export const unassignStructuralAnalysisModel = wrapUsecase(
	"structural.unassign_structural_analysis_model",
	unassignStructuralAnalysisModelUsecase,
);
