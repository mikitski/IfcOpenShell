// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/remove_structural_analysis_model.py`
// (src/ifcopenshell-python, 42 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Removes every
// `IfcRelAssignsToGroup` in the model's `IsGroupedBy` (its own `OwnerHistory` cascaded
// via the already-landed `util.element.removeDeep2`), then the model itself (same
// cascade). Real Python's own comment: "the contents of an analysis model are
// currently preserved" -- no deep purge of the grouped structural members/loads/etc.
// themselves, only the grouping rels. Both `if history:` guards are present in real
// Python (unlike `./removeStructuralLoadCase.ts`'s own disclosed missing-guard quirk
// on its structurally-identical final block -- see that file's header comment).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveStructuralAnalysisModelSettings {
	/** The `IfcStructuralAnalysisModel` to remove. */
	structuralAnalysisModel: EntityInstance;
}

function removeStructuralAnalysisModelUsecase(file: IfcFile, settings: RemoveStructuralAnalysisModelSettings): void {
	const { structuralAnalysisModel } = settings;
	for (const rel of structuralAnalysisModel.get("IsGroupedBy") as EntityInstance[]) {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
	const history = structuralAnalysisModel.get("OwnerHistory") as EntityInstance | null;
	file.remove(structuralAnalysisModel);
	if (history) elementUtil.removeDeep2(file, history);
}

/**
 * Removes an analysis model (Python:
 * `ifcopenshell.api.structural.remove_structural_analysis_model`).
 *
 * Note that the contents of an analysis model are currently preserved.
 */
export const removeStructuralAnalysisModel = wrapUsecase(
	"structural.remove_structural_analysis_model",
	removeStructuralAnalysisModelUsecase,
);
