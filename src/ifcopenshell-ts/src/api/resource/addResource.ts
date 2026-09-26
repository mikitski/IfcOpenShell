// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/add_resource.py` (src/ifcopenshell-python, 89
// lines) -- part of this project's brand-new `api.resource` chunk (see `./index.ts`'s
// own header comment). Creates a new `IfcConstructionResource` subtype via the
// already-landed `api.root.createEntity`, then either nests it under `parentResource`
// (via THIS SAME CHUNK's own newly-landed `api.nest.assignObject` -- ported first, per
// this chunk's own dependency ordering) or, on IFC4+ with no parent, declares it
// root-level against the file's sole `IfcContext` via the already-landed
// `api.project.assignDeclaration`.
//
// --- Real Python's own unresolved ambiguity, preserved verbatim (not "fixed") ---
//
// Real Python's own inline `TODO` comment: "this is an ambiguity by buildingSMART: Can
// we nest an IfcCrewResource under an IfcCrewResource ?" (linking a buildingSMART forum
// thread) -- `assignObject` is called unconditionally whenever `parentResource` is
// truthy, with no `ifc_class`-compatibility check of any kind between parent and
// child. Ported as-is: this function makes no attempt to validate that pairing either.
//
// --- `elif file.schema != "IFC2X3":` -- IFC2X3 resources are silently left
//     undeclared, no error, ported verbatim ---
//
// On IFC2X3 with no `parentResource`, real Python does nothing further (no
// `IfcRelDeclares`/`IfcRelDefinesByProperties`-style declaration exists for IFC2X3
// resources at all -- `IfcRelDeclares`/`assign_declaration` are themselves IFC4+-only,
// confirmed absent from `ifc2x3.d.ts`). The newly-created resource is simply left
// dangling from the spatial/declaration hierarchy on IFC2X3 unless the caller supplies
// a `parentResource` explicitly -- not a bug this port introduces, matching real
// Python's own `elif` shape exactly (no `else` branch, no IFC2X3-specific handling).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { assignObject } from "../nest/assignObject";
import { assignDeclaration } from "../project/assignDeclaration";
import { createEntity } from "../root/createEntity";

export interface AddResourceSettings {
	/**
	 * If this is a child resource (typically to a crew resource), then nominate the
	 * parent `IfcConstructionResource` here.
	 */
	parentResource?: EntityInstance | null;
	/**
	 * The class of resource chosen from `IfcConstructionEquipmentResource`,
	 * `IfcConstructionMaterialResource`, `IfcConstructionProductResource`,
	 * `IfcCrewResource`, `IfcLaborResource`, or `IfcSubContractResource`. Python
	 * default: `"IfcCrewResource"`.
	 */
	ifcClass?: string;
	/** The name of the resource. */
	name?: string | null;
	/** Consult the IFC documentation for the valid predefined types for each resource class. Python default: `"NOTDEFINED"`. */
	predefinedType?: string;
}

function addResourceUsecase(file: IfcFile, settings: AddResourceSettings): EntityInstance {
	const ifcClass = settings.ifcClass ?? "IfcCrewResource";
	const predefinedType = settings.predefinedType ?? "NOTDEFINED";

	const resource = createEntity(file, {
		ifcClass,
		predefinedType,
		name: settings.name || "Unnamed",
	});

	// TODO: this is an ambiguity by buildingSMART: Can we nest an IfcCrewResource under
	// an IfcCrewResource ?
	// https://forums.buildingsmart.org/t/what-are-allowed-to-be-root-level-construction-resources/3550
	if (settings.parentResource) {
		assignObject(file, { relatedObjects: [resource], relatingObject: settings.parentResource });
	} else if (file.schema !== "IFC2X3") {
		const context = file.byType("IfcContext")[0];
		assignDeclaration(file, { definitions: [resource], relatingContext: context });
	}
	return resource;
}

/**
 * Adds a new construction resource (Python: `ifcopenshell.api.resource.add_resource`).
 *
 * Construction resources may be managed and connected to cost schedules and
 * construction schedules. This allows calculations to be done on resource utilisation,
 * cost optimisation (e.g. labour rates), and optioneering on build strategies.
 *
 * There are typically two types of resources. Crew resources are resources where you
 * manage your own crew and you have full control over the equipment, labour, products,
 * and materials used by your crew. Alternatively, there are subcontractor resources,
 * where you simply delegate all the details to a subcontractor and it is not
 * decomposed into further levels of detail.
 *
 * This means when adding resources, you'd first either add a crew or subcontract
 * resource. If it is a crew resource, you'd then add child resources to that crew,
 * such as equipment (cranes, excavators, hoists, etc), material (wood, concrete, etc),
 * and labour (rigging crews, formworkers, etc).
 *
 * @returns The newly created resource, depending on the nominated IFC class.
 *
 * @example
 * ```ts
 * // Add our own crew.
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * // Add some labour to our crew.
 * api.resource.addResource(model, { parentResource: crew, ifcClass: "IfcLaborResource" });
 * ```
 */
export const addResource = wrapUsecase("resource.add_resource", addResourceUsecase);
