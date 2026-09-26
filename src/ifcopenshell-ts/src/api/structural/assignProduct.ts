// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/assign_product.py` (src/ifcopenshell-python, 64
// lines, "generated with the assistance of an AI coding tool" per its own real Python
// header comment -- a 2026-dated addition) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Links a physical
// building element (e.g. `IfcWall`) to a structural analysis member (e.g.
// `IfcStructuralSurfaceMember`/`IfcStructuralCurveMember`) via `IfcRelAssignsToProduct`
// so analysis results can be traced back to the physical model.
//
// Real Python's loop scans EVERY rel in `relatingProduct.ReferencedBy`, `continue`-ing
// past any that aren't `IfcRelAssignsToProduct` -- but returns unconditionally on the
// FIRST `IfcRelAssignsToProduct` it finds (either the existing match, or after growing
// `RelatedObjects`), never considering a second one even if it exists. Ported verbatim.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";

export interface AssignProductSettings {
	/**
	 * The `IfcProduct` that the object is assigned to, typically an
	 * `IfcStructuralMember`.
	 */
	relatingProduct: EntityInstance;
	/**
	 * The `IfcObjectDefinition` being assigned, typically a physical building element
	 * such as an `IfcWall` or `IfcSlab`.
	 */
	relatedObject: EntityInstance;
}

function assignProductUsecase(file: IfcFile, settings: AssignProductSettings): EntityInstance {
	const { relatingProduct, relatedObject } = settings;
	const referencedBy = relatingProduct.get("ReferencedBy") as EntityInstance[];
	for (const rel of referencedBy) {
		if (!rel.isA("IfcRelAssignsToProduct")) continue;
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		if (relatedObjects.some((object) => object.equals(relatedObject))) {
			return rel;
		}
		rel.set("RelatedObjects", [...relatedObjects, relatedObject]);
		return rel;
	}

	const rel = createEntity(file, { ifcClass: "IfcRelAssignsToProduct" });
	rel.set("RelatingProduct", relatingProduct);
	rel.set("RelatedObjects", [relatedObject]);
	return rel;
}

/**
 * Links an object to a product via `IfcRelAssignsToProduct` (Python:
 * `ifcopenshell.api.structural.assign_product`).
 *
 * Typically used to associate a physical building element with a structural analysis
 * member (`IfcStructuralSurfaceMember`, `IfcStructuralCurveMember`) so that analysis
 * results can be traced back to the physical model.
 *
 * @returns The `IfcRelAssignsToProduct` relationship.
 *
 * @example
 * ```ts
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * const member = api.root.createEntity(model, { ifcClass: "IfcStructuralSurfaceMember" });
 * api.structural.assignProduct(model, { relatingProduct: member, relatedObject: wall });
 * ```
 */
export const assignProduct = wrapUsecase("structural.assign_product", assignProductUsecase);
