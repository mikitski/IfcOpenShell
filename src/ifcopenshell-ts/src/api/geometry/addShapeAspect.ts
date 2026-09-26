// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_shape_aspect.py` (src/ifcopenshell-python, 89
// lines) -- a NEW `api.geometry` chunk (see `./index.ts`'s own header comment for the
// module's overall scope). Verified directly: this file's only import is
// `ifcopenshell` itself (no `util`/kernel dependency at all).
//
// `IfcShapeAspect(ShapeRepresentations, Name, Description, ProductDefinitional,
// PartOfProductDefinitionShape)` -- attribute ORDER confirmed identical across all 3
// schemas' generated `.d.ts`s, but `PartOfProductDefinitionShape`'s own TYPE genuinely
// differs: IFC2X3 declares it as a plain, non-nullable `IfcProductDefinitionShape`,
// while IFC4/IFC4X3 widen it to `(IfcProductDefinitionShape | IfcRepresentationMap) |
// null` -- this is the real schema-level backing for the Python docstring's own
// warning ("it is not possible to add a shape aspect to types (i.e.
// IfcRepresentationMap) in IFC2X3"), reproduced verbatim below; this port does not add
// its own extra validation for it (neither does real Python -- passing an
// `IfcRepresentationMap` on IFC2X3 fails downstream, at `createIfcShapeAspect`'s own
// schema-conformance check, not inside this function). `IfcShapeRepresentation
// (ContextOfItems, RepresentationIdentifier, RepresentationType, Items)` -- already
// verified flat/identical across all 3 schemas by `./mapRepresentation.ts`'s own header
// comment.
//
// `part_of_product.HasShapeAspects` is the real EXPRESS INVERSE side of
// `IfcShapeAspect.PartOfProductDefinitionShape` -- absent from the generated `.d.ts`s
// (which only enumerate FORWARD/creatable attributes, per this project's own established
// convention -- see any other `.get("Has...")` call site, e.g.
// `api/pset/addPset.ts`'s `product.get("HasPropertySets")`), read here the same way:
// `.get("HasShapeAspects")` (typed `EntityInstance[] | null`, defaulting to `[]` via
// `?? []`, matching Python's own `part_of_product.HasShapeAspects or []`).
//
// Real Python-source quirks, preserved verbatim rather than "fixed":
//
// 1. **`result` is a single, function-scoped flag, not scoped to the current
//    `aspect`.** Once ANY iteration of the `for aspect in ...HasShapeAspects` loop sets
//    `result` (because it found an existing `aspect`+matching-context `aspectRep`), a
//    LATER `aspect` in the same loop that also happens to share `name` but has no
//    matching-context `aspectRep` of its own will skip its own
//    `if not result: <create a new aspectRep for THIS aspect>` branch too -- because
//    `result` is already truthy from the earlier, unrelated `aspect`. This only matters
//    for a pathological model with two DIFFERENT `IfcShapeAspect`s sharing the same
//    `Name` under the same `part_of_product`; ported with the exact same single,
//    function-scoped `let result` rather than a per-aspect-scoped one.
// 2. The inner "matching context" loop (`for aspect_rep in aspect.ShapeRepresentations:
//    if aspect_rep.ContextOfItems == representation.ContextOfItems: ...`) never
//    `break`s -- if an aspect somehow has more than one `ShapeRepresentations` entry
//    under the SAME context (not expected, but not prevented either), `aspect
//    .Description` is reassigned and `aspectRep.Items` unioned again for every such
//    entry, and `result` is (redundantly) reassigned each time. Ported the same way,
//    with a plain `for...of`, no early exit.
// 3. `file.remove(aspectRep)` / `file.remove(aspect)` rely on the underlying native
//    `remove_entity` primitive (the same C++ engine Python's own `file.remove()` calls)
//    to patch every OTHER entity's references to the removed instance -- in particular,
//    re-reading `aspect.get("ShapeRepresentations")` immediately after removing one of
//    its `aspectRep` entries is expected to already reflect the removal, exactly like
//    Python's own `if not aspect.ShapeRepresentations:` check right after the loop
//    (this project's `file.remove` -- `file.ts`'s own doc comment -- is a thin wrapper
//    over that same native primitive, no extra reference-patching needed here).
//
// Set operations (`items_set`, `set(aspect_rep.Items) | items_set`, `set(aspect_rep
// .Items) & items_set`, `set(aspect_rep.Items) - items_set`) are ported with a small
// identity-keyed `EntityInstanceSet` helper (this port's own established convention --
// see `./removeBoolean.ts`'s identical helper's doc comment for why it's duplicated
// per-file rather than shared) plus plain `Array.prototype.some`/`filter` for the
// intersection/difference checks, using `EntityInstance.equals` throughout (never raw
// `===`, per `entityInstance.ts`'s own header comment).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** See `./removeBoolean.ts`'s own identical helper's doc comment for why this is
 * duplicated per-file rather than shared. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	constructor(items: readonly EntityInstance[] = []) {
		for (const item of items) this.add(item);
	}
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	has(instance: EntityInstance): boolean {
		return this.byIdentity.has(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface AddShapeAspectSettings {
	/** The name of the shape aspect. This is case sensitive. */
	name: string;
	/** `IfcRepresentationItem`s that will be assigned to this aspect. */
	items: readonly EntityInstance[];
	/** The `IfcShapeRepresentation` that `items` are in. */
	representation: EntityInstance;
	/**
	 * The `IfcRepresentationMap` or `IfcProductDefinitionShape` that `representation`
	 * is in.
	 */
	partOfProduct: EntityInstance;
	/** A description to set for the shape aspect. It's usually not necessary. */
	description?: string | null;
}

function addShapeAspectUsecase(file: IfcFile, settings: AddShapeAspectSettings): EntityInstance {
	const { name, items, representation, partOfProduct, description = null } = settings;

	let result: EntityInstance | null = null;
	const itemsSet = new EntityInstanceSet(items);
	const contextOfItems = representation.get("ContextOfItems") as EntityInstance;
	const representationIdentifier = representation.get("RepresentationIdentifier") as string | null;
	const representationType = representation.get("RepresentationType") as string | null;

	const hasShapeAspects = (partOfProduct.get("HasShapeAspects") as EntityInstance[] | null) ?? [];
	for (const aspect of hasShapeAspects) {
		if (aspect.get("Name") === name) {
			const shapeRepresentations = aspect.get("ShapeRepresentations") as EntityInstance[];
			for (const aspectRep of shapeRepresentations) {
				if ((aspectRep.get("ContextOfItems") as EntityInstance).equals(contextOfItems)) {
					aspect.set("Description", description);
					const union = new EntityInstanceSet(aspectRep.get("Items") as EntityInstance[]);
					for (const item of items) union.add(item);
					aspectRep.set("Items", union.values());
					result = aspect;
				}
			}
			if (!result) {
				const aspectRep = file.createEntity(
					"IfcShapeRepresentation",
					contextOfItems,
					representationIdentifier,
					representationType,
					items,
				);
				aspect.set("ShapeRepresentations", [...(aspect.get("ShapeRepresentations") as EntityInstance[]), aspectRep]);
				result = aspect;
			}
		} else {
			const shapeRepresentations = aspect.get("ShapeRepresentations") as EntityInstance[];
			for (const aspectRep of shapeRepresentations) {
				if (!(aspectRep.get("ContextOfItems") as EntityInstance).equals(contextOfItems)) continue;
				const aspectRepItems = aspectRep.get("Items") as EntityInstance[];
				if (aspectRepItems.some((i) => itemsSet.has(i))) {
					const newItems = aspectRepItems.filter((i) => !itemsSet.has(i));
					if (newItems.length > 0) {
						aspectRep.set("Items", newItems);
					} else {
						file.remove(aspectRep);
					}
				}
			}
			if ((aspect.get("ShapeRepresentations") as EntityInstance[]).length === 0) {
				file.remove(aspect);
			}
		}
	}

	if (result) return result;

	const aspectRep = file.createEntity(
		"IfcShapeRepresentation",
		contextOfItems,
		representationIdentifier,
		representationType,
		items,
	);
	return file.createEntity("IfcShapeAspect", [aspectRep], name, description, true, partOfProduct);
}

/**
 * Adds a shape aspect to items that are part of a representation and product (Python:
 * `ifcopenshell.api.geometry.add_shape_aspect`).
 *
 * Existing shape aspects will be reused where possible. If the items already belong
 * to another shape aspect with a different name, this relationship will be purged.
 *
 * Warning: it is not possible to add a shape aspect to types (i.e.
 * `IfcRepresentationMap`) in IFC2X3.
 *
 * @returns The `IfcShapeAspect`.
 */
export const addShapeAspect = wrapUsecase("geometry.add_shape_aspect", addShapeAspectUsecase);
