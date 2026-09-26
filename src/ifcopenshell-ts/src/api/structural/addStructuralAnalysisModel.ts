// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/add_structural_analysis_model.py`
// (src/ifcopenshell-python, 43 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). A trivial
// one-liner: a single `IfcStructuralAnalysisModel` created via the already-landed
// `api.root.createEntity`, with a fixed `predefinedType: "LOADING_3D"` (real Python's
// own comment: "A 3D analytical model is assumed" -- no other predefined type is ever
// produced by this function).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";

// biome-ignore lint/complexity/noBannedTypes: an intentionally-empty settings object, matching this project's "every wrapped usecase takes (file, settings)" convention even where Python's own signature has no settings kwargs (see `../owner/createOwnerHistory.ts`'s identical precedent).
export type AddStructuralAnalysisModelSettings = {};

function addStructuralAnalysisModelUsecase(
	file: IfcFile,
	_settings: AddStructuralAnalysisModelSettings = {},
): EntityInstance {
	return createEntity(file, { ifcClass: "IfcStructuralAnalysisModel", predefinedType: "LOADING_3D" });
}

/**
 * Add a new structural analysis model (Python:
 * `ifcopenshell.api.structural.add_structural_analysis_model`).
 *
 * A structural analysis model is a group of all the loads, reactions, structural
 * members, and structural connections required to describe a structural analysis
 * model.
 *
 * A 3D analytical model is assumed.
 *
 * @returns The newly created `IfcStructuralAnalysisModel`.
 *
 * @example
 * ```ts
 * // Create a fresh blank structural analysis
 * const analysis = api.structural.addStructuralAnalysisModel(model, {});
 * ```
 */
export const addStructuralAnalysisModel = wrapUsecase(
	"structural.add_structural_analysis_model",
	addStructuralAnalysisModelUsecase,
);
