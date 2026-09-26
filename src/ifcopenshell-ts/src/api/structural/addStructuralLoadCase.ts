// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/add_structural_load_case.py` (src/ifcopenshell-
// python, 41 lines) -- part of this project's brand-new `api.structural` chunk (see
// `./index.ts`'s own header comment). Creates a new `IfcStructuralLoadCase` via the
// already-landed `api.root.createEntity`, then sets `ActionType`/`ActionSource`.
//
// --- Real schema divergence: `IfcStructuralLoadCase` doesn't exist on IFC2X3 ---
//
// Confirmed directly against the generated `.d.ts`s: `ifc4.d.ts`/`ifc4x3.d.ts` both
// declare `IfcStructuralLoadCase`, but `ifc2x3.d.ts` has no such interface at all --
// IFC2X3 only has `IfcStructuralLoadGroup` (with a `PredefinedType` of `"LOAD_CASE"`
// or `"LOAD_GROUP"` distinguishing the two concepts); IFC4 split "load case" out into
// its own dedicated entity. Real Python's `add_structural_load_case` unconditionally
// creates `ifc_class="IfcStructuralLoadCase"` regardless of schema -- so real Python
// itself fails on IFC2X3 too (a real, unguarded schema-validity error from
// `create_entity`, not a bug this port introduces or a gap this port needs to work
// around). Ported verbatim: no IFC2X3-specific branch exists here, matching real
// Python exactly; this function is IFC4+-only in practice.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";

export interface AddStructuralLoadCaseSettings {
	/** The name of the load case. Python default: `"Unnamed"`. */
	name?: string;
	/**
	 * Choose from `EXTRAORDINARY_A`, `PERMANENT_G`, or `VARIABLE_Q`, taken from the
	 * Eurocode standard. Python default: `"NOTDEFINED"`.
	 */
	actionType?: string;
	/**
	 * The source of the load case, such as `DEAD_LOAD_G`, `LIVE_LOAD_Q`, `TRANSPORT`,
	 * `ICE`, etc. For the full list consult `IfcActionSourceTypeEnum` in the IFC
	 * documentation. Python default: `"NOTDEFINED"`.
	 */
	actionSource?: string;
}

function addStructuralLoadCaseUsecase(file: IfcFile, settings: AddStructuralLoadCaseSettings): EntityInstance {
	const name = settings.name ?? "Unnamed";
	const actionType = settings.actionType ?? "NOTDEFINED";
	const actionSource = settings.actionSource ?? "NOTDEFINED";

	const loadCase = createEntity(file, { ifcClass: "IfcStructuralLoadCase", predefinedType: "LOAD_CASE", name });
	loadCase.set("ActionType", actionType);
	loadCase.set("ActionSource", actionSource);
	return loadCase;
}

/**
 * Adds a new load case, which is a collection of related load groups (Python:
 * `ifcopenshell.api.structural.add_structural_load_case`).
 *
 * @returns The new `IfcStructuralLoadCase`.
 */
export const addStructuralLoadCase = wrapUsecase("structural.add_structural_load_case", addStructuralLoadCaseUsecase);
