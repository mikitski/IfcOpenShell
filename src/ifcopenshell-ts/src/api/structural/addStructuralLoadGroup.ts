// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/add_structural_load_group.py`
// (src/ifcopenshell-python, 44 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Structurally
// identical to `./addStructuralLoadCase.ts` (same `api.root.createEntity` ->
// `ActionType`/`ActionSource` shape), just `predefinedType: "LOAD_GROUP"` and
// `ifcClass: "IfcStructuralLoadGroup"` instead -- and, unlike `IfcStructuralLoadCase`,
// `IfcStructuralLoadGroup` exists identically on all 3 schemas (confirmed against the
// generated `.d.ts`s), so this function has no IFC2X3 caveat.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";

export interface AddStructuralLoadGroupSettings {
	/** The name of the load group. Python default: `"Unnamed"`. */
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

function addStructuralLoadGroupUsecase(file: IfcFile, settings: AddStructuralLoadGroupSettings): EntityInstance {
	const name = settings.name ?? "Unnamed";
	const actionType = settings.actionType ?? "NOTDEFINED";
	const actionSource = settings.actionSource ?? "NOTDEFINED";

	const loadGroup = createEntity(file, { ifcClass: "IfcStructuralLoadGroup", predefinedType: "LOAD_GROUP", name });
	loadGroup.set("ActionType", actionType);
	loadGroup.set("ActionSource", actionSource);
	return loadGroup;
}

/**
 * Adds a new load group, which is a collection of related loads (Python:
 * `ifcopenshell.api.structural.add_structural_load_group`).
 *
 * @returns The new `IfcStructuralLoadGroup`.
 */
export const addStructuralLoadGroup = wrapUsecase(
	"structural.add_structural_load_group",
	addStructuralLoadGroupUsecase,
);
