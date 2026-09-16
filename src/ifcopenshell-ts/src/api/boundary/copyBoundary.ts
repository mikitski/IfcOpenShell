// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/boundary/copy_boundary.py` (src/ifcopenshell-python, 40
// lines) -- part of this project's brand-new `api.boundary` module (see `./index.ts`'s
// own header comment). Copies an `IfcRelSpaceBoundary` via `util.element.copy` (a
// shallow, attribute-for-attribute copy that regenerates `GlobalId`), then deep-copies
// its `ConnectionGeometry` (if any) so the copy doesn't share the same geometry
// instance as the original -- `util.element.copy`'s own shallow copy would otherwise
// leave `result.ConnectionGeometry` pointing at the exact same entity as
// `boundary.ConnectionGeometry`.
//
// No unported dependency: `util.element.copy`/`copyDeep`, both already landed.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface CopyBoundarySettings {
	/** The `IfcRelSpaceBoundary` you want to copy. */
	boundary: EntityInstance;
}

function copyBoundaryUsecase(file: IfcFile, settings: CopyBoundarySettings): EntityInstance {
	const result = elementUtil.copy(file, settings.boundary);
	const connectionGeometry = result.get("ConnectionGeometry") as EntityInstance | null;
	if (connectionGeometry) {
		result.set("ConnectionGeometry", elementUtil.copyDeep(file, connectionGeometry));
	}
	return result;
}

/**
 * Copies a space boundary (Python: `ifcopenshell.api.boundary.copy_boundary`).
 *
 * @returns Duplicate of the `IfcRelSpaceBoundary`.
 *
 * @example
 * ```ts
 * // A boring boundary with no geometry. Note that this boundary is invalid and does
 * // not relate to any space or building element.
 * const boundary = api.root.createEntity(model, { ifcClass: "IfcRelSpaceBoundary" });
 *
 * // And now we have two
 * const boundaryCopy = api.boundary.copyBoundary(model, { boundary });
 * ```
 */
export const copyBoundary = wrapUsecase("boundary.copy_boundary", copyBoundaryUsecase);
