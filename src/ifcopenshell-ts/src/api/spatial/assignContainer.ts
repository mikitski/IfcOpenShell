// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/spatial/assign_container.py` (src/ifcopenshell-python, 176
// lines) -- the largest and most involved of `api.spatial`'s 4 functions per
// `planning/ifcopenshell-ts/research/02-python-api-inventory.md` §3's "spatial" deep
// dive. Assigns a list of products to be contained in a single `IfcSpatialStructureElement`
// via `IfcRelContainedInSpatialStructure`. Since a product may only occupy one
// containment slot at a time, this does the module's one piece of real "surgery": for
// each product, if it's already in a *different* container, that old
// `IfcRelContainedInSpatialStructure` is found and either rewritten (dropping just this
// product from `RelatedElements`, if other elements remain) or deleted (via
// `util/element.ts`'s `removeDeep2`, if this was the only element left in it) --
// exactly mirroring `unassignContainer.ts`'s own delete-or-rewrite shape, since it's the
// same underlying relationship class.
//
// --- Correcting this project's own research doc against the real source ---
//
// `research/02-python-api-inventory.md` §3's "spatial" deep dive (quoted verbatim in
// this chunk's own task brief) states spatial has "No geometry, no numpy" and is
// therefore a "Good porting target." Read directly, this is not accurate:
// `assign_container.py` imports `ifcopenshell.api.aggregate` AND
// `ifcopenshell.api.geometry`/`ifcopenshell.util.placement`, and calls into both --
// `ifcopenshell.api.aggregate.unassign_object` (to strip any pre-existing aggregation
// from a product with no existing container, before it becomes newly contained -- see
// this file's "aggregate" section below) and `ifcopenshell.api.geometry.
// edit_object_placement` (to re-localize a moved product's placement so its absolute
// world position doesn't visually shift when reparented -- see this file's "geometry"
// section below, a genuine, disclosed blocker). This correction is disclosed here
// rather than silently ported around, matching this project's own established
// precedent for correcting the roadmap/research docs' own framing against the real
// source when they disagree (see `hooks.ts`'s header comment correcting
// `20-roadmap.md`'s "dict-of-list" framing). `unassign_container.py`/
// `reference_structure.py`/`dereference_structure.py` (the other 3 `api.spatial`
// functions) genuinely have no geometry/numpy dependency -- the research doc's "no
// geometry, no numpy" framing is accurate for 3 of 4 functions, just not this one.
//
// --- `aggregate.unassign_object`: ported, as a small standalone dependency ---
//
// `ifcopenshell.api.aggregate` was, at the time this file was written, a separate,
// not-yet-started Phase 6 chunk (2 functions: `assign_object`/`unassign_object`) --
// since landed in full as its own chunk, `../aggregate/assignObject.ts` completing
// `../aggregate/unassignObject.ts` below. Rather than leave this call
// unported (which would silently break this function's own "a product may only be in
// one hierarchical relation -- aggregation OR containment -- at a time" invariant,
// the one non-containment invariant `assign_container` itself is responsible for
// enforcing per the research doc's own "aggregation and containment are mutually
// exclusive for the same object" framing) or reinvent its logic inline (this
// project's "reuse the real ported exports, don't reinvent" rule), `aggregate.
// unassign_object` (75 LOC, self-contained, no further unported dependencies) is
// ported as its own small module, `../aggregate/unassignObject.ts` -- see that file's
// own header comment for why only this one function, not the full `api.aggregate`
// module, is ported here. `test_removing_aggregation_if_it_exists` (this chunk's own
// ported test suite, `assignContainer.test.ts`) exercises this path for real.
//
// --- `geometry.edit_object_placement`: NOT ported, a genuine disclosed blocker ---
//
// `ifcopenshell.api.geometry.edit_object_placement` (201 LOC: 4x4 matrix math via
// numpy, `ShapeBuilder.create_axis2_placement_3d`, a recursive "move my children too"
// traversal, `util.unit.calculate_unit_scale` unit conversion) is a substantially
// larger, independent piece of work -- per the research doc's own §3 framing,
// `geometry` is one of the seven subpackages "where real design decisions are
// needed," not a small CRUD dependency like `aggregate.unassign_object` above. This
// port does NOT inline a partial/simplified reimplementation of it (risking a subtly
// wrong matrix-math port reviewed under this chunk's much narrower "spatial" scope)
// nor invoke a stub that throws (which would make `assignContainer` itself throw on
// every call moving an `IfcLocalPlacement`-having product between containers --
// a correctness regression far worse than the placement simply not being
// re-localized). Instead: **the placement-relocalization step is simply not invoked**.
// This is a real, observable behavior gap versus Python: after calling `assignContainer`
// to move a product with an `IfcLocalPlacement` between two containers whose own
// placements differ, the product's raw `ObjectPlacement` matrix is left exactly as it
// was (still expressed relative to whatever `PlacementRelTo` it already had) -- the
// product does NOT visually shift in its `PlacementRelTo`'s own frame, but IS
// visually shifted in absolute world space if the old and new containers sit at
// different absolute locations, exactly the regression `edit_object_placement` exists
// to prevent. Tracked as a `TODOS.md` entry (see that file) for whenever `api.geometry.
// edit_object_placement` lands as its own chunk. The containment *relationship*
// surgery above -- the actual point of this function -- is fully implemented and
// correct independent of this gap; `ObjectPlacement` is a wholly separate IFC
// attribute with no schema-level linkage to `IfcRelContainedInSpatialStructure`.
// `test_not_updating_placement_if_placement_is_not_relative` (ported, in
// `assignContainer.test.ts`) is unaffected by this gap -- Python's own guard
// (`placement.is_a("IfcLocalPlacement")`) already skips non-local placements
// regardless, so its assertion (`subelement.ObjectPlacement == placement`, unchanged)
// holds whether or not `edit_object_placement` exists.
// `test_assigning_a_container_does_not_shift_object_placements` (the one Python test
// this gap genuinely blocks -- its own setup calls `ifcopenshell.api.geometry.
// edit_object_placement` directly) is NOT ported here for that reason.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { unassignObject } from "../aggregate/unassignObject";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set -- see `../aggregate/unassignObject.ts`'s identical helper's own doc comment for why this is duplicated per-module rather than shared (matching `util/element.ts`'s own private-per-module `EntityInstanceSet` precedent). */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	has(instance: EntityInstance | null | undefined): boolean {
		if (!instance) return false;
		return this.byIdentity.has(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

/** Python's `a == b`/`a != b` for two possibly-`null` `entity_instance`s -- see `util/element.ts`'s identical private `entityEquals` helper. */
function sameRel(a: EntityInstance | null, b: EntityInstance | null): boolean {
	if (!a || !b) return a === b;
	return a.equals(b);
}

export interface AssignContainerSettings {
	/** A list of physical `IfcElement`s existing in the space. */
	products: readonly EntityInstance[];
	/** The `IfcSpatialStructureElement` (e.g. `IfcBuilding`, `IfcBuildingStorey`, `IfcSpace`) the products exist in. */
	relatingStructure: EntityInstance;
}

function assignContainerUsecase(file: IfcFile, settings: AssignContainerSettings): EntityInstance | undefined {
	if (!settings.products.length) {
		return undefined;
	}

	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	const containsElements = settings.relatingStructure.get("ContainsElements") as EntityInstance[];
	let structureRel: EntityInstance | null = containsElements[0] ?? null;

	const previousContainersRels = new EntityInstanceSet();
	const productsWithoutContainers: EntityInstance[] = [];
	const productsWithContainers: EntityInstance[] = [];

	// Check if there is anything to change.
	for (const product of productsSet.values()) {
		const containedInStructure = product.get("ContainedInStructure") as EntityInstance[];
		const productRel = containedInStructure[0] ?? null;

		if (!productRel) {
			productsWithoutContainers.push(product);
			continue;
		}

		// Either `structureRel` is null, or the product is part of a different rel.
		if (!sameRel(productRel, structureRel)) {
			previousContainersRels.add(productRel);
			productsWithContainers.push(product);
		}
		// Products with an already-assigned matching container are skipped.
	}

	const productsToChange = [...productsWithoutContainers, ...productsWithContainers];
	// Nothing to change.
	if (productsToChange.length === 0) {
		return structureRel ?? undefined;
	}

	// A product can be either only aggregated or only contained at the same time.
	// Called unconditionally (even with an empty `productsWithoutContainers` list),
	// matching Python's own unconditional call -- an empty-list call is a real no-op
	// call, not skipped, so any registered `aggregate.unassign_object` listeners still
	// fire exactly as they would in real Python.
	unassignObject(file, { products: productsWithoutContainers });

	// Unassign elements from previous containers.
	for (const rel of previousContainersRels.values()) {
		const relatedElements = (rel.get("RelatedElements") as EntityInstance[]).filter((e) => !productsSet.has(e));
		if (relatedElements.length > 0) {
			rel.set("RelatedElements", relatedElements);
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	// Assign elements to a new container.
	if (structureRel) {
		const merged = new EntityInstanceSet();
		merged.update(structureRel.get("RelatedElements") as EntityInstance[]);
		merged.update(productsSet.values());
		structureRel.set("RelatedElements", merged.values());
		updateOwnerHistory(file, { element: structureRel });
	} else {
		structureRel = file.createEntity(
			"IfcRelContainedInSpatialStructure",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			productsSet.values(), // RelatedElements
			settings.relatingStructure, // RelatingStructure
		);
	}

	// NOTE (disclosed blocker, see this file's header comment): real Python now
	// re-localizes each changed product's placement here, via
	// `ifcopenshell.api.geometry.edit_object_placement`, so its absolute world
	// position doesn't shift when moved between containers. `api.geometry` is not
	// yet ported in this TS codebase -- this step is skipped, not stubbed/faked.

	return structureRel;
}

/**
 * Assigns products to be contained hierarchically in a space (Python:
 * `ifcopenshell.api.spatial.assign_container`).
 *
 * All physical IFC model elements must be part of a hierarchical tree called the
 * "spatial decomposition", where large things are made up of smaller things. This
 * tree always begins at an `IfcProject` and is then broken down using "decomposition"
 * relationships, of which aggregation is the first relationship you will use.
 *
 * The `IfcProject` will be "decomposed" into spatial structure elements. These are
 * virtual spaces like sites, buildings, storeys, and spaces (i.e. rooms). You can't
 * physically touch these spaces, but you can touch the products contained within
 * these spaces.
 *
 * To state that a product is contained in a space, you will use a "containment"
 * relationship. The distinguishing factor between aggregation and containment is that
 * aggregation occurs between objects of the same type, whereas containment is between
 * two different types: explicitly saying that a physical product exists within a
 * virtual space.
 *
 * As a product may only have a single location in the "spatial decomposition" tree,
 * assigning a containment relationship will remove any previous aggregation,
 * containment, or nesting relationships it may have.
 *
 * @returns The `IfcRelContainedInSpatialStructure` relationship instance, or
 * `undefined` if `products` was an empty list.
 */
export const assignContainer = wrapUsecase("spatial.assign_container", assignContainerUsecase);
