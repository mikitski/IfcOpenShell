// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/unassign_representation.py` (src/ifcopenshell-
// python, 113 lines) -- NOT the whole `ifcopenshell.api.geometry` module (which has no
// TS port of any kind yet, and includes `edit_object_placement`, a genuine, already-
// disclosed blocker for `api.spatial`/`api.aggregate`, see `TODOS.md`). Ported here,
// alongside `./removeRepresentation.ts`, as a direct, minimal, self-contained
// dependency of `api.context.removeContext`'s top-level-context branch (real Python:
// `ifcopenshell.api.context.remove_context` calls both `geometry.unassign_representation`
// and `geometry.remove_representation` on every representation left behind by a removed
// context). Verified directly (not assumed) that this file's own imports are small and
// self-contained: `ifcopenshell.api.geometry` (itself, recursively -- only for
// `remove_representation`, ported alongside) and `ifcopenshell.util.element` (already
// fully ported) -- no kernel/matrix-math dependency of any kind, unlike
// `edit_object_placement`. When `api.geometry` lands as its own, larger future chunk,
// `unassignRepresentation`/`removeRepresentation` (this file and `./removeRepresentation.ts`)
// should be treated as already landed (reviewed against the real Python source below)
// rather than re-ported from scratch -- see `planning/ifcopenshell-ts/PROGRESS.md`'s
// Phase 6 table and `TODOS.md`'s existing `edit_object_placement` entry for the exact
// scope split.
//
// --- Structure: product (IfcProduct) vs. type (IfcTypeProduct) dispatch ---
//
// Real Python's `Usecase.execute` dispatches on `product.is_a("IfcProduct")` vs.
// `product.is_a("IfcTypeProduct")` (anything else is silently a no-op, ported verbatim
// -- no `else` branch in the real source either). The `IfcProduct` branch
// (`unassign_product_representation`) removes `representation` from
// `product.Representation.Representations`, purging the whole `IfcProductDefinitionShape`
// (plus any shape aspects) once the list is empty. The `IfcTypeProduct` branch
// (`unassign_type_representation`) is the more involved one: it finds the
// `IfcRepresentationMap` whose `MappedRepresentation` matches, detaches every real
// `IfcProduct` using that map via an `IfcMappedItem` (`unassign_products_using_mapped_
// representation` -- a real, reachable recursive sub-case, not a theoretical one, see
// `test_unassigning_a_type_product_representation_used_by_instances`, ported below),
// then purges the map itself (`remove_representation_map_only`, which swaps in a
// throwaway blank `IfcShapeRepresentation` before deep-removing the map, so the real,
// still-wanted `representation` argument itself is never touched by that
// `removeDeep2` call -- only the disposable placeholder is).
//
// --- `process_shape_aspects`'s real IFC2X3-vs-IFC4+ branch, ported verbatim ---
//
// `IfcShapeAspect.PartOfProductDefinitionShape` is IFC2X3-only (a direct forward
// attribute there); IFC4+ instead has the inverse `HasShapeAspects` declared directly on
// `IfcProductRepresentation`/`IfcRepresentationMap`. Real Python branches on
// `file.schema == "IFC2X3" and product_representation.is_a("IfcRepresentationMap")` --
// note this guard is narrower than "is IFC2X3": on IFC2X3 itself,
// `unassign_product_representation`'s own call passes an `IfcProductDefinitionShape`
// (not an `IfcRepresentationMap`), so that call always takes the `else` (inverse)
// branch regardless of schema -- the `by_type` scan only ever fires for IFC2X3's
// `IfcTypeProduct` branch (`remove_representation_map_only`'s own `IfcRepresentationMap`
// argument). Ported exactly as written, not simplified to a plain schema check.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removeRepresentation } from "./removeRepresentation";

export interface UnassignRepresentationSettings {
	/** The `IfcProduct` or `IfcTypeProduct` the representation is currently assigned to. */
	product: EntityInstance;
	/** The `IfcRepresentation` to unassign. */
	representation: EntityInstance;
}

/**
 * Python: `Usecase.process_shape_aspects(product_representation)`. See this file's
 * header comment for the real IFC2X3-vs-IFC4+ branch this reproduces verbatim.
 */
function processShapeAspects(file: IfcFile, productRepresentation: EntityInstance): void {
	let shapeAspects: EntityInstance[];
	if (file.schema === "IFC2X3" && productRepresentation.isA("IfcRepresentationMap")) {
		shapeAspects = file
			.byType("IfcShapeAspect")
			.filter(
				(a) => (a.get("PartOfProductDefinitionShape") as EntityInstance | null)?.equals(productRepresentation) ?? false,
			);
	} else {
		shapeAspects = (productRepresentation.get("HasShapeAspects") as EntityInstance[] | null) ?? [];
	}
	for (const shapeAspect of shapeAspects) {
		const representations = [...(shapeAspect.get("ShapeRepresentations") as EntityInstance[])];
		file.remove(shapeAspect);
		for (const rep of representations) {
			removeRepresentation(file, { representation: rep });
		}
	}
}

/** Python: `Usecase.unassign_product_representation(product, representation)`. */
function unassignProductRepresentation(file: IfcFile, product: EntityInstance, representation: EntityInstance): void {
	// Python: `list(product.Representation.Representations or [])` -- an unguarded
	// `product.Representation` access, crashing (`AttributeError` on `None`) if the
	// product has no representation assigned at all; `.get(...)` on `null` below throws
	// the TS/JS equivalent (`TypeError`), reproducing the crash rather than silently
	// avoiding it.
	const productDef = product.get("Representation") as EntityInstance;
	const representations = [...((productDef.get("Representations") as EntityInstance[] | null) ?? [])];
	const index = representations.findIndex((r) => r.equals(representation));
	if (index === -1) return;
	representations.splice(index, 1);

	if (representations.length === 0) {
		// TODO (Python's own comment, ported verbatim): should somehow find matching
		// shape aspect and remove it even before the last representation is removed.
		processShapeAspects(file, productDef);
		file.remove(productDef);
	} else {
		productDef.set("Representations", representations);
	}
}

/** Python: `Usecase.remove_representation_map_only(representation_map)`. */
function removeRepresentationMapOnly(file: IfcFile, representationMap: EntityInstance): void {
	representationMap.set("MappedRepresentation", file.createEntity("IfcShapeRepresentation"));
	elementUtil.removeDeep2(file, representationMap);
}

/** Python: `Usecase.unassign_products_using_mapped_representation(representation_map)`. */
function unassignProductsUsingMappedRepresentation(file: IfcFile, representationMap: EntityInstance): void {
	const mappedRepresentations: Array<{ product: EntityInstance; representation: EntityInstance }> = [];
	const justRepresentations: EntityInstance[] = [];

	const mapUsage = (representationMap.get("MapUsage") as EntityInstance[] | null) ?? [];
	for (const usage of mapUsage) {
		for (const inverse of file.getInverse(usage) as Set<EntityInstance>) {
			if (!inverse.isA("IfcShapeRepresentation")) continue;
			const ofProductRepresentation = (inverse.get("OfProductRepresentation") as EntityInstance[] | null) ?? [];
			for (const definition of ofProductRepresentation) {
				const shapeOfProduct = (definition.get("ShapeOfProduct") as EntityInstance[] | null) ?? [];
				for (const product of shapeOfProduct) {
					mappedRepresentations.push({ product, representation: inverse });
					justRepresentations.push(inverse);
				}
			}
		}
	}

	for (const item of mappedRepresentations) {
		unassignProductRepresentation(file, item.product, item.representation);
	}
	for (const representation of justRepresentations) {
		removeRepresentation(file, { representation });
	}
}

/**
 * Python: `Usecase.unassign_type_representation()`.
 *
 * **Works around a real, disclosed native primitive-layer bug (see `TODOS.md`'s new
 * entry for the full writeup) in the one place this chunk's own logic depends on it**:
 * when `remaining` is empty, real Python assigns `product.RepresentationMaps = None`
 * (`[...] or None`), and expects `matchingMap` to become fully unreferenced (0
 * inverses) as a result -- `removeRepresentationMapOnly` immediately below depends on
 * exactly that, via `removeDeep2`'s own `getTotalInverses` check. Empirically confirmed
 * against this worktree's own built native addon (not assumed): assigning `null`
 * directly to an aggregate-of-entity attribute routes through this port's N-API shim's
 * `ATTRIBUTE_VALUE_KIND_NULL` case, which calls `express::base::unset_attribute_value`
 * -- a thin wrapper that writes the new value directly on the underlying storage,
 * bypassing `express::base::set_attribute_value`'s own inverse-index register/
 * unregister bookkeeping entirely (confirmed by reading `src/ifcparse/parse.cpp`
 * directly). Real Python's own `entity_instance.__setattr__` for `value = None`
 * (`src/ifcwrap/IfcParseWrapper.i`'s `set_attribute_value_py`) does NOT hit this gap --
 * it calls `self->set_attribute_value(i, blank{})` directly, the exact overload WITH
 * the bookkeeping, so real Python never leaves a stale inverse here. The result before
 * this workaround: `matchingMap`'s inverse count silently stayed at 1 (still
 * "referenced" by `product`, even though `product.RepresentationMaps` itself correctly
 * read back as `null`), so `removeRepresentationMapOnly`'s `removeDeep2` call silently
 * refused to remove it at all -- not a crash, a silent no-op.
 *
 * The workaround: assign an empty array first (routes through the shim's
 * `ATTRIBUTE_VALUE_KIND_AGGREGATE` case instead, which *does* go through the real
 * `set_attribute_value` overload and correctly unregisters every old member), then
 * immediately assign the real final value (`null`, matching Python's own persisted
 * value exactly) -- confirmed empirically to leave a correctly-updated (empty) inverse
 * index while still ending on the same `null` value Python itself would persist.
 */
function unassignTypeRepresentation(file: IfcFile, product: EntityInstance, representation: EntityInstance): void {
	const initialMaps = (product.get("RepresentationMaps") as EntityInstance[] | null) ?? [];
	const matchingMap =
		initialMaps.find((rm) => (rm.get("MappedRepresentation") as EntityInstance).equals(representation)) ?? null;
	if (!matchingMap) return;

	unassignProductsUsingMappedRepresentation(file, matchingMap);

	// Python re-reads `self.settings["product"].RepresentationMaps` fresh here (a
	// second, separate attribute read, not a reuse of the list captured above) --
	// reproduced exactly, in case `unassign_products_using_mapped_representation`'s own
	// side effects changed it (they shouldn't, for any real product/type pairing, but
	// this isn't "corrected" to reuse the earlier snapshot either).
	const currentMaps = (product.get("RepresentationMaps") as EntityInstance[] | null) ?? [];
	const remaining = currentMaps.filter((rm) => !rm.equals(matchingMap));
	if (remaining.length > 0) {
		product.set("RepresentationMaps", remaining);
	} else {
		// Python: `[...] or None` -- an empty list is replaced with `None`, not left as
		// `[]`. See this function's own doc comment for why the empty-array assignment
		// below is required first, as a workaround for a real, disclosed native
		// primitive-layer bug (only reachable in this exact branch, where the final
		// value being assigned is `null`).
		product.set("RepresentationMaps", []);
		product.set("RepresentationMaps", null);
	}

	processShapeAspects(file, matchingMap);
	removeRepresentationMapOnly(file, matchingMap);
}

function unassignRepresentationUsecase(file: IfcFile, settings: UnassignRepresentationSettings): void {
	const { product, representation } = settings;
	if (product.isA("IfcProduct")) {
		unassignProductRepresentation(file, product, representation);
	} else if (product.isA("IfcTypeProduct")) {
		unassignTypeRepresentation(file, product, representation);
	}
}

/**
 * Unassigns a representation from a product or type product (Python:
 * `ifcopenshell.api.geometry.unassign_representation`).
 *
 * Removes `representation` from `product`'s `Representation`/`RepresentationMaps`,
 * cleaning up the containing `IfcProductDefinitionShape`/`IfcRepresentationMap` and any
 * `IfcShapeAspect`s once nothing else references it. If `product` is a type, every
 * real `IfcProduct` occurrence created via an `IfcMappedItem` referencing the type's
 * representation map is also detached first.
 */
export const unassignRepresentation = wrapUsecase("geometry.unassign_representation", unassignRepresentationUsecase);
