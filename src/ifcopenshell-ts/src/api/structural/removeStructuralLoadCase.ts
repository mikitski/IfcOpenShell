// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/remove_structural_load_case.py`
// (src/ifcopenshell-python, 37 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Real Python's own
// `# TODO: do a deep purge` self-flagged comment, ported verbatim (no deeper purge is
// attempted here than real Python's own).
//
// --- A real, disclosed, verbatim-preserved missing-`if history:`-guard bug ---
//
// Every OTHER `remove_structural_*` function in this module that cascades an
// `OwnerHistory` via `remove_deep2` guards that call with `if history:` -- both in
// this SAME function's own first loop (over `IsGroupedBy`) AND in every sibling
// function (`./removeStructuralAnalysisModel.ts`, `./removeStructuralLoadGroup.ts`,
// `./removeStructuralConnectionCondition.ts`). This function's OWN final block is the
// one exception: `history = load_case.OwnerHistory; file.remove(load_case);
// ifcopenshell.util.element.remove_deep2(file, history)` -- no `if history:` guard at
// all, unlike the identically-shaped block immediately above it in this same
// function's own source. `OwnerHistory` is genuinely `None`/`null` whenever
// `../owner/createOwnerHistory.ts`'s own `getUser`/`getApplication` return falsy (the
// normal case on IFC4+ with no `IfcPersonAndOrganization`/`IfcApplication` configured
// -- NOT the case for this port's own `createTestFile` fixture, which -- like real
// Python's own `test.bootstrap` -- pre-populates both by default; only a file that has
// deliberately stripped or never had that owner chain hits this). When that happens,
// `elementUtil.removeDeep2(file, null)` reproduces the exact same crash real Python's
// own `remove_deep2(file, None)` would hit: `ifc_file.get_total_inverses(element)`
// (Python) / `file.getTotalInverses(element)` (this port's own `util/element.ts`)
// requires a real, non-`None`/non-`null` entity argument -- confirmed against this
// port's own `IfcFile.getTotalInverses`, which calls `inst.id()` unconditionally on
// its argument, throwing a plain JS `TypeError` for `null`. Ported verbatim, NOT
// "fixed" with an added guard that would diverge from real Python's own asymmetric
// behavior here -- pinned by this file's own dedicated regression test
// (`test/api/structural/removeStructuralLoadCase.test.ts`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveStructuralLoadCaseSettings {
	/** The `IfcStructuralLoadCase` to remove. */
	loadCase: EntityInstance;
}

function removeStructuralLoadCaseUsecase(file: IfcFile, settings: RemoveStructuralLoadCaseSettings): void {
	const { loadCase } = settings;
	// TODO: do a deep purge
	for (const rel of loadCase.get("IsGroupedBy") as EntityInstance[]) {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
	const history = loadCase.get("OwnerHistory") as EntityInstance | null;
	file.remove(loadCase);
	// Real Python's own unconditional `remove_deep2(file, history)` call here, unlike
	// the `if history:` guard immediately above -- see this file's own header comment.
	elementUtil.removeDeep2(file, history as EntityInstance);
}

/**
 * Removes a structural load case (Python:
 * `ifcopenshell.api.structural.remove_structural_load_case`).
 */
export const removeStructuralLoadCase = wrapUsecase(
	"structural.remove_structural_load_case",
	removeStructuralLoadCaseUsecase,
);
