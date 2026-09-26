// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/drawing/assign_product.py` (src/ifcopenshell-python, 105
// lines) -- part of this project's `api.drawing` chunk (see `./index.ts`'s own header
// comment). Associates a product and an object (typically `IfcAnnotation`) via
// `IfcRelAssignsToProduct`, for annotation use cases (e.g. a dimension line pointing at
// a wall, a label truncated to a grid axis's extents).
//
// Two structurally different branches, ported verbatim (not unified, matching real
// Python's own shape):
//
// 1. `relating_product.is_a("IfcGridAxis")`: the axis is first resolved to its owning
//    `IfcGrid` via the first non-empty inverse of `PartOfW`/`PartOfV`/`PartOfU` (`grid`).
//    Dedup is checked against `grid.ReferencedBy`, matching BOTH the rel's `Name`
//    (`== axis.AxisTag`) AND `related_object` already being one of its `RelatedObjects`.
//    If no match, a brand-new `IfcRelAssignsToProduct` is created (never reusing/growing
//    an existing rel on the grid) with `Name=axis.AxisTag`.
//
// 2. Any other `relating_product`: dedup is checked against `related_object.
//    HasAssignments` for an existing `IfcRelAssignsToProduct` whose `RelatingProduct`
//    already equals `relating_product` (no `Name` involved at all -- this branch never
//    sets `Name`). If no match, `relating_product.ReferencedBy[0]` (the first existing
//    rel, if any) is grown with `related_object` appended; otherwise a new rel is
//    created.
//
// --- Real, disclosed Python quirk: the grid-axis branch (1) can silently multiply
//     `IfcRelAssignsToProduct` rels for the same grid, unlike branch (2)'s reuse-or-grow
//     shape ---
//
// Branch (2)'s dedup+reuse logic keeps AT MOST ONE `IfcRelAssignsToProduct` per
// `relating_product` (`ReferencedBy[0]` is grown, never duplicated). Branch (1) has no
// such guarantee: its dedup check only matches an EXISTING rel with the exact same
// `Name` (`axis.AxisTag`) that ALREADY contains `related_object`. If a grid has two
// axes with different `AxisTag`s (the common case -- every real `IfcGrid` axis has its
// own tag), calling `assign_product` once per axis (even for the SAME `related_object`)
// creates a SEPARATE `IfcRelAssignsToProduct` per axis, each with `RelatingProduct=grid`
// but a different `Name`. Worse: even for the SAME axis, if a rel with that `Name`
// already exists but does NOT yet contain `related_object` (impossible in practice via
// this function alone, since the only way to add to `grid.ReferencedBy` is this same
// dedup-or-create branch -- but reachable if some other code path created a
// same-`Name`, different-membership rel directly), the dedup check fails and a
// SECOND rel with the identical `Name` is created rather than the existing one being
// grown. Ported verbatim -- not "fixed" to grow the existing same-`Name` rel the way
// branch (2) grows `ReferencedBy[0]` -- and disclosed here plus in `./unassignProduct.ts`
// (whose own remapped-to-`grid` dedup can't tell these separate per-axis rels apart
// either). Confirmed by direct reading, not assumed: `assign_product.py`'s grid branch
// has no `else` growing an existing matched-`Name` rel at all, it always either returns
// early (exact dedup hit) or creates a brand-new entity.
//
// --- Real, disclosed Python quirk: an unguarded `None` dereference if a grid axis
//     belongs to no grid at all ---
//
// If `relating_product.is_a("IfcGridAxis")` but none of `PartOfW`/`PartOfV`/`PartOfU`
// has any value (the axis was created but never added to any `IfcGrid`'s
// `UAxes`/`VAxes`/`WAxes`), `grid` stays `None` and the very next line,
// `grid.ReferencedBy`, raises `AttributeError: 'NoneType' object has no attribute
// 'ReferencedBy'`. Ported verbatim: `grid` is dereferenced here with no null guard,
// throwing the TS equivalent (`TypeError: Cannot read properties of null`) in that
// same situation -- not defensively guarded against, since real Python has no such
// guard either, and no real Python test exercises this case.
//
// `IfcRelAssignsToProduct`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
// RelatedObjects(4), RelatedObjectsType(5), RelatingProduct(6) -- identical order in
// all 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`; only
// `OwnerHistory`'s nullability and `RelatedObjectsType`'s enum-vs-boolean type differ,
// neither ever populated here). Only `GlobalId`/`OwnerHistory`/`Name` (grid branch
// only)/`RelatedObjects`/`RelatingProduct` are ever populated, matching real Python's
// own kwargs-only calls.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface AssignProductSettings {
	/** The `IfcProduct` (or `IfcGridAxis`) the object is related to. */
	relatingProduct: EntityInstance;
	/** The object (typically `IfcAnnotation`) that the product is related to. */
	relatedObject: EntityInstance;
}

function firstNonEmptyGridInverse(axis: EntityInstance): EntityInstance | null {
	for (const attribute of ["PartOfW", "PartOfV", "PartOfU"] as const) {
		const values = axis.get(attribute) as EntityInstance[];
		if (values.length > 0) return values[0];
	}
	return null;
}

function assignProductUsecase(file: IfcFile, settings: AssignProductSettings): EntityInstance | undefined {
	const { relatingProduct, relatedObject } = settings;

	if (relatingProduct.isA("IfcGridAxis")) {
		const axis = relatingProduct;
		// See this file's header comment: `grid` may be `null` here, and is
		// dereferenced unguarded immediately below, matching real Python's own
		// unguarded `grid.ReferencedBy` attribute access.
		const grid = firstNonEmptyGridInverse(axis) as EntityInstance;
		const axisTag = axis.get("AxisTag");

		const referencedBy = grid.get("ReferencedBy") as EntityInstance[];
		for (const rel of referencedBy) {
			const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
			if (rel.get("Name") === axisTag && relatedObjects.some((o) => o.equals(relatedObject))) {
				return undefined;
			}
		}

		return file.createEntity(
			"IfcRelAssignsToProduct",
			guid.new(),
			createOwnerHistory(file, {}),
			axisTag,
			null,
			[relatedObject],
			null,
			grid,
		);
	}

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const rel of hasAssignments) {
		if (rel.isA("IfcRelAssignsToProduct") && (rel.get("RelatingProduct") as EntityInstance).equals(relatingProduct)) {
			return undefined;
		}
	}

	const referencedByList = relatingProduct.get("ReferencedBy") as EntityInstance[];
	const existingReferencedBy = referencedByList.length > 0 ? referencedByList[0] : null;

	let referencedBy: EntityInstance;
	if (existingReferencedBy) {
		referencedBy = existingReferencedBy;
		const relatedObjects = [...(referencedBy.get("RelatedObjects") as EntityInstance[])];
		relatedObjects.push(relatedObject);
		referencedBy.set("RelatedObjects", relatedObjects);
		updateOwnerHistory(file, { element: referencedBy });
	} else {
		referencedBy = file.createEntity(
			"IfcRelAssignsToProduct",
			guid.new(),
			createOwnerHistory(file, {}),
			null,
			null,
			[relatedObject],
			null,
			relatingProduct,
		);
	}
	return referencedBy;
}

/**
 * Associates a product and an object, typically for annotation (Python:
 * `ifcopenshell.api.drawing.assign_product`).
 *
 * Warning: this is an experimental API.
 *
 * When you want to draw attention to a feature or characteristic (such as a dimension,
 * material, or name) of a product (e.g. wall, slab, furniture, etc), an annotation
 * object is created. This annotation is then associated with the product so that it
 * can reference attributes, properties, and relationships.
 *
 * For example, an annotation of a line will be associated with a grid axis, such that
 * when that grid axis moves, the annotation of that grid axis (which is typically
 * truncated to the extents of a drawing) will also move.
 *
 * See this file's own header comment for two disclosed real Python quirks: the
 * grid-axis branch can create more than one `IfcRelAssignsToProduct` per grid (one per
 * distinct axis `Name`), and an axis belonging to no grid at all crashes rather than
 * being guarded against.
 *
 * @returns The created `IfcRelAssignsToProduct` relationship, or `undefined` if the
 * association already existed.
 *
 * @example
 * ```ts
 * const furniture = api.root.createEntity(model, { ifcClass: "IfcFurniture" });
 * const annotation = api.root.createEntity(model, { ifcClass: "IfcAnnotation" });
 * api.drawing.assignProduct(model, { relatingProduct: furniture, relatedObject: annotation });
 * ```
 */
export const assignProduct = wrapUsecase("drawing.assign_product", assignProductUsecase);
