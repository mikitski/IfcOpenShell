// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/boundary/edit_attributes.py` (src/ifcopenshell-python, 60
// lines) -- part of this project's brand-new `api.boundary` module (see `./index.ts`'s
// own header comment). Sets `IfcRelSpaceBoundary`'s relationship/enum attributes.
//
// --- `hasattr(entity, "ParentBoundary")`/`"CorrespondingBoundary")`, verified against
// all 3 generated `.d.ts`s -- these are REAL per-subtype (not per-schema) differences ---
//
// Confirmed directly: plain `IfcRelSpaceBoundary` has NEITHER `ParentBoundary` nor
// `CorrespondingBoundary` on ANY of the 3 schemas (`ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts`) -- these attributes only exist on the IFC4+-only subtypes
// `IfcRelSpaceBoundary1stLevel` (`ParentBoundary`) and `IfcRelSpaceBoundary2ndLevel`
// (`ParentBoundary` + `CorrespondingBoundary`). So real Python's `hasattr` guards are
// not merely an IFC2X3-vs-IFC4+ schema check (as the task brief's own initial
// suspicion put it) -- they matter on EVERY schema, for the plain, non-subtyped
// `IfcRelSpaceBoundary` class specifically. Ported below as `hasAttribute`, the same
// try/catch `.get()` probe this project's established convention already uses
// elsewhere (e.g. `../geometry/editObjectPlacement.ts`'s own
// `hasObjectPlacementAttribute`) for "does this class declare the attribute at all"
// (distinct from "declared but unset", which reads back as `null`/throws identically
// for a *value* read and can't be used to distinguish the two cases).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python's `hasattr(instance, name)` -- see this file's own header comment for why
 * this genuinely matters per-subtype here, not just per-schema. */
function hasAttribute(instance: EntityInstance, name: string): boolean {
	try {
		instance.get(name);
		return true;
	} catch {
		return false;
	}
}

export interface EditAttributesSettings {
	/** The `IfcRelSpaceBoundary` to modify. */
	entity: EntityInstance;
	/**
	 * The `IfcSpace` or `IfcExternalSpatialElement` that the space boundary is related
	 * to.
	 */
	relatingSpace: EntityInstance;
	/** The `IfcElement` that defines the boundary, typically an `IfcWall`. */
	relatedBuildingElement: EntityInstance;
	/**
	 * A parent `IfcRelSpaceBoundary`, only provided if this is an inner boundary. This
	 * can apply to 1st and 2nd level boundaries.
	 */
	parentBoundary?: EntityInstance | null;
	/**
	 * The other `IfcRelSpaceBoundary` on the other side of the related element. The
	 * pair together represents a thermal boundary. This only applies to 2nd level
	 * boundaries.
	 */
	correspondingBoundary?: EntityInstance | null;
	/**
	 * `IfcPhysicalOrVirtualEnum` value: `"PHYSICAL"`, `"VIRTUAL"`, or `"NOTDEFINED"`.
	 * Defaults to `"NOTDEFINED"`.
	 */
	physicalOrVirtual?: string;
	/**
	 * `IfcInternalOrExternalEnum` value: `"INTERNAL"`, `"EXTERNAL"`,
	 * `"EXTERNAL_EARTH"`, `"EXTERNAL_WATER"`, `"EXTERNAL_FIRE"`, or `"NOTDEFINED"`.
	 * Defaults to `"NOTDEFINED"`.
	 */
	internalOrExternal?: string;
}

function editAttributesUsecase(file: IfcFile, settings: EditAttributesSettings): void {
	const { entity } = settings;
	entity.set("RelatingSpace", settings.relatingSpace);
	entity.set("RelatedBuildingElement", settings.relatedBuildingElement);
	if (hasAttribute(entity, "ParentBoundary")) {
		entity.set("ParentBoundary", settings.parentBoundary ?? null);
	}
	if (hasAttribute(entity, "CorrespondingBoundary")) {
		entity.set("CorrespondingBoundary", settings.correspondingBoundary ?? null);
	}
	entity.set("PhysicalOrVirtualBoundary", settings.physicalOrVirtual ?? "NOTDEFINED");
	entity.set("InternalOrExternalBoundary", settings.internalOrExternal ?? "NOTDEFINED");
}

/**
 * Modify the relationships of a space boundary relationship (Python:
 * `ifcopenshell.api.boundary.edit_attributes`).
 */
export const editAttributes = wrapUsecase("boundary.edit_attributes", editAttributesUsecase);
