// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/add_structural_load.py` (src/ifcopenshell-
// python, 46 lines) -- part of this project's brand-new `api.structural` chunk (see
// `./index.ts`'s own header comment). `IfcStructuralLoad` subtypes are NOT `IfcRoot`
// subtypes (confirmed against `ifc4.d.ts`'s `IfcStructuralLoadLinearForce`: `Name`
// plus force/moment components only, no `GlobalId`/`OwnerHistory`), so this is a
// direct `file.createEntity(ifcClass, name)` (positional `Name` at index 0), the exact
// equivalent of real Python's `file.create_entity(ifc_class, Name=name)` -- no
// `api.root` dependency at all.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddStructuralLoadSettings {
	/** The name of the load. */
	name?: string | null;
	/**
	 * The subtype of `IfcStructuralLoad` to create. Consult the IFC documentation to
	 * see all the types of loads. Python default: `"IfcStructuralLoadLinearForce"`.
	 */
	ifcClass?: string;
}

function addStructuralLoadUsecase(file: IfcFile, settings: AddStructuralLoadSettings): EntityInstance {
	const ifcClass = settings.ifcClass ?? "IfcStructuralLoadLinearForce";
	const name = settings.name ?? null;
	return file.createEntity(ifcClass, name);
}

/**
 * Adds a new structural load (Python: `ifcopenshell.api.structural.add_structural_load`).
 *
 * Structural loads may be actions or reactions. A simple load might be a static and
 * be linear, planar, or a single point. Alternatively, loads may be defined as a
 * configuration of multiple loads.
 *
 * @returns The newly created load entity, depending on `ifcClass`.
 *
 * @example
 * ```ts
 * // Create a simple linear load
 * api.structural.addStructuralLoad(model, {});
 * ```
 */
export const addStructuralLoad = wrapUsecase("structural.add_structural_load", addStructuralLoadUsecase);
