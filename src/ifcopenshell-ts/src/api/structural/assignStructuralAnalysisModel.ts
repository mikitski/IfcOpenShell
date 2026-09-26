// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/assign_structural_analysis_model.py`
// (src/ifcopenshell-python, 37 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). A one-line
// delegation to the already-landed `api.group.assignGroup` (Python: `ifcopenshell.
// api.group.assign_group(file, products, structural_analysis_model)`) -- an
// `IfcStructuralAnalysisModel` is itself an `IfcGroup` subtype, so assigning
// structural elements to it is exactly the generic group-assignment mechanism.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignGroup } from "../group/assignGroup";
import { wrapUsecase } from "../hooks";

export interface AssignStructuralAnalysisModelSettings {
	/** The structural elements that are part of the analysis. */
	products: readonly EntityInstance[];
	/** The `IfcStructuralAnalysisModel` that the structural element is related to. */
	structuralAnalysisModel: EntityInstance;
}

function assignStructuralAnalysisModelUsecase(
	file: IfcFile,
	settings: AssignStructuralAnalysisModelSettings,
): EntityInstance | undefined {
	return assignGroup(file, { products: settings.products, group: settings.structuralAnalysisModel });
}

/**
 * Assigns a load or structural member to an analysis model (Python:
 * `ifcopenshell.api.structural.assign_structural_analysis_model`).
 *
 * @returns The `IfcRelAssignsToGroup` relationship, or `undefined` if `products` was
 * an empty list.
 */
export const assignStructuralAnalysisModel = wrapUsecase(
	"structural.assign_structural_analysis_model",
	assignStructuralAnalysisModelUsecase,
);
