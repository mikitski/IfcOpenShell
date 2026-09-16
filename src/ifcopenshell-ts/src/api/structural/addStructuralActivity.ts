// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/add_structural_activity.py` (src/ifcopenshell-
// python, 67 lines) -- part of this project's brand-new `api.structural` chunk (see
// `./index.ts`'s own header comment). Creates a new `IfcStructuralActivity` subtype
// (any structural action or reaction -- point/curve/surface, constant/linear/etc.) via
// the already-landed `api.root.createEntity`, sets its `AppliedLoad`/`GlobalOrLocal`
// attributes, then creates an `IfcRelConnectsStructuralActivity` (itself an `IfcRoot`
// subtype -- `GlobalId`/`OwnerHistory`/`Name`/`Description`/`RelatingElement`/
// `RelatedStructuralActivity`, confirmed identical across all 3 schemas -- also created
// via `createEntity`, matching real Python's own `root.create_entity` call for it)
// linking the activity to the given `structuralMember`.
//
// Real Python discards the rel entirely -- only the created `activity` is returned,
// matching this port exactly (the rel exists purely as a side effect).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";

export interface AddStructuralActivitySettings {
	/** The `IfcStructuralLoad` that is applied in this activity. */
	appliedLoad: EntityInstance;
	/** The `IfcStructuralMember` that the load is applied to. */
	structuralMember: EntityInstance;
	/** Choose from any subtype of `IfcStructuralActivity`. Python default: `"IfcStructuralPlanarAction"`. */
	ifcClass?: string;
	/**
	 * View the IFC documentation for what valid predefined types may be chosen.
	 * Python default: `"CONST"`.
	 */
	predefinedType?: string;
	/**
	 * The location coordinates of the load is always defined locally relative to the
	 * structural member the activity is assigned to. However, the directions of the
	 * applied load may either be specified globally or locally depending on how this
	 * argument is set. Choose from `"GLOBAL_COORDS"` or `"LOCAL_COORDS"`. Python
	 * default: `"GLOBAL_COORDS"`.
	 */
	globalOrLocal?: "GLOBAL_COORDS" | "LOCAL_COORDS";
}

function addStructuralActivityUsecase(file: IfcFile, settings: AddStructuralActivitySettings): EntityInstance {
	const ifcClass = settings.ifcClass ?? "IfcStructuralPlanarAction";
	const predefinedType = settings.predefinedType ?? "CONST";
	const globalOrLocal = settings.globalOrLocal ?? "GLOBAL_COORDS";

	const activity = createEntity(file, { ifcClass, predefinedType });
	activity.set("AppliedLoad", settings.appliedLoad);
	activity.set("GlobalOrLocal", globalOrLocal);

	const rel = createEntity(file, { ifcClass: "IfcRelConnectsStructuralActivity" });
	rel.set("RelatingElement", settings.structuralMember);
	rel.set("RelatedStructuralActivity", activity);
	return activity;
}

/**
 * Adds a new structural activity (Python: `ifcopenshell.api.structural.add_structural_activity`).
 *
 * A structural activity is either a structural action or a reaction. It may be
 * applied to a point, a curve, or a planar surface, and may be a constant load,
 * linear, etc.
 *
 * The activity must be defined using an applied load, and associated with a
 * structural member.
 *
 * @returns The newly created entity based on `ifcClass`.
 */
export const addStructuralActivity = wrapUsecase("structural.add_structural_activity", addStructuralActivityUsecase);
