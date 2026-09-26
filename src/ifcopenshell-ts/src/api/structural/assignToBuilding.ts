// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/assign_to_building.py` (src/ifcopenshell-
// python, 64 lines, "generated with the assistance of an AI coding tool" per its own
// real Python header comment -- a 2026-dated addition) -- part of this project's
// brand-new `api.structural` chunk (see `./index.ts`'s own header comment). Associates
// a structural analysis model with a building via `IfcRelServicesBuildings` -- the
// separate model-to-building relationship (distinct from `./assignStructuralAnalysisModel.ts`'s
// `IfcRelAssignsToGroup`, which links structural MEMBERS to the analysis model).
//
// Real Python's loop only ever considers the FIRST `IfcRelServicesBuildings` in
// `structuralAnalysisModel.ServicesBuildings` -- it returns unconditionally after its
// first iteration (either the existing match, or after growing `RelatedBuildings`),
// same "assume at most one rel matters" shape as `../group/assignGroup.ts`'s own
// `IsGroupedBy[0]`-only precedent. Ported verbatim.
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcRelServicesBuildings`: `GlobalId`/`OwnerHistory`/`Name`/`Description`/
// `RelatingSystem`/`RelatedBuildings`, identical order across all 3 schemas. Real
// Python constructs it directly via `file.create_entity` (NOT `api.root.createEntity`
// -- `IfcRelServicesBuildings` is rooted, but this function builds it by hand with
// `ifcopenshell.guid.new()` and `ifcopenshell.api.owner.create_owner_history(file)`
// passed as kwargs, skipping `Name`/`Description` entirely), so this port does the
// same: `guid.new()` + `createOwnerHistory(file, {})` positionally, with explicit
// `null` for the skipped `Name`/`Description` slots (matching `../system/connectPort.ts`'s
// own established "explicit null for skipped kwargs-only positional slots" convention).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

export interface AssignToBuildingSettings {
	/** The `IfcStructuralAnalysisModel` to associate with the building. */
	structuralAnalysisModel: EntityInstance;
	/**
	 * The `IfcBuilding` (or other `IfcSpatialStructureElement`) that the structural
	 * analysis model serves.
	 */
	building: EntityInstance;
}

function assignToBuildingUsecase(file: IfcFile, settings: AssignToBuildingSettings): EntityInstance {
	const { structuralAnalysisModel, building } = settings;
	const servicesBuildings = structuralAnalysisModel.get("ServicesBuildings") as EntityInstance[];
	for (const rel of servicesBuildings) {
		const relatedBuildings = rel.get("RelatedBuildings") as EntityInstance[];
		if (relatedBuildings.some((b) => b.equals(building))) {
			return rel;
		}
		rel.set("RelatedBuildings", [...relatedBuildings, building]);
		return rel;
	}

	return file.createEntity(
		"IfcRelServicesBuildings",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		structuralAnalysisModel, // RelatingSystem
		[building], // RelatedBuildings
	);
}

/**
 * Associates a structural analysis model with a building via
 * `IfcRelServicesBuildings` (Python: `ifcopenshell.api.structural.assign_to_building`).
 *
 * The existing `assignStructuralAnalysisModel` (`./assignStructuralAnalysisModel.ts`)
 * handles `IfcRelAssignsToGroup` (linking structural members to the analysis model).
 * This function handles the separate model-to-building relationship, which records
 * which building the structural analysis model serves.
 *
 * @returns The `IfcRelServicesBuildings` relationship.
 *
 * @example
 * ```ts
 * const model = api.structural.addStructuralAnalysisModel(file, {});
 * api.structural.assignToBuilding(file, { structuralAnalysisModel: model, building });
 * ```
 */
export const assignToBuilding = wrapUsecase("structural.assign_to_building", assignToBuildingUsecase);
