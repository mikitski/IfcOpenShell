// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/nest/assign_object.py` (src/ifcopenshell-python, 181
// lines) -- the largest and most complex file of this project's brand-new `api.nest`
// chunk (4 files, 327 lines total; see `./index.ts`'s own header comment for the
// module's overall scope). Structurally near-identical to
// `../aggregate/assignObject.ts` (same "surgery" shape: check the existing
// relationship, unassign from the old one, assign to the new one, merge-into-existing-
// vs-create-new) -- the two Python source files are themselves near-identical for the
// same reason (both manage a single-related-objects-set STEP relationship class
// derived from `IfcRelDecomposes`), not a coincidence introduced by this port.
//
// --- IFC2X3 vs IFC4+ inverse-attribute name difference, ported exactly ---
//
// Real Python branches on `file.schema == "IFC2X3"` for BOTH the relating object's own
// "what nests it" lookup and each candidate object's "what nests this" lookup:
// - IFC2X3: `IfcObjectDefinition` has no `IsNestedBy`/`Nests` inverse attribute at
//   all (confirmed against `ifc2x3.d.ts`/the real IFC2X3 EXPRESS schema -- `IfcRelNests`
//   itself is IFC2X3-valid, but the object side only exposes the generic
//   `IsDecomposedBy`/`Decomposes` inverses shared by every `IfcRelDecomposes` subtype,
//   `IfcRelAggregates` included), so this branch filters `IsDecomposedBy`/`Decomposes`
//   down to `is_a("IfcRelNests")` by hand.
// - IFC4+: `IsNestedBy`/`Nests` exist as their own dedicated inverse attributes,
//   pre-filtered to `IfcRelNests` by the schema itself -- no `is_a` filter needed (and
//   real Python's `next(iter(object.Nests), None)`/`next((i for i in
//   relating_object.IsNestedBy), None)` don't apply one).
//
// --- Reused dependencies: `spatial.unassignContainer`/`aggregate.unassignObject`
//     (both already landed) ---
//
// Since a product may only occupy one slot in the spatial-decomposition tree at a time
// (aggregation OR containment OR nesting, never more than one), real Python calls both
// `ifcopenshell.api.spatial.unassign_container` (guarded by the same
// `hasattr(o, "ContainedInStructure")` check `../aggregate/assignObject.ts` already
// disclosed and verified against this port's own native binding -- see that file's
// header comment for the full investigation, not re-litigated here) and
// `ifcopenshell.api.aggregate.unassign_object` (UNguarded -- every `IfcObjectDefinition`
// declares `Decomposes`, so no `hasattr`-style check is needed there, matching real
// Python's own unconditional call) on every about-to-be-nested object that doesn't
// already have a nesting relationship. Both dependencies are already landed and reused
// directly here, not reinvented.
//
// --- No `is_a("IfcRelNests")` filter on the per-object nest-check for IFC4+: matches
//     real Python's own schema-level pre-filtering, not a missing guard ---
//
// Unlike the IFC2X3 branch (which must filter `Decomposes` down to `IfcRelNests` by
// hand, since `Decomposes` mixes every `IfcRelDecomposes` subtype together), the IFC4+
// branch's `object.Nests` inverse is already `IfcRelNests`-only by construction (a
// schema-level EXPRESS `INVERSE` declaration scoped to that one entity type) -- so
// `next(iter(object.Nests), None)` needs no additional filter, and none is added here.
//
// --- NOTE (Python docstring, not a blocker -- this function deliberately does NOT
//     call `geometry.edit_object_placement`) ---
//
// Real Python's own docstring says it plainly: "IFC placements follow a convention
// where the placement is relative to its parent in the spatial hierarchy... Creating a
// nesting relationship doesn't localize the object's placement, unlike assigning it to
// an aggregate or a container." -- confirmed directly against the real source: there is
// no `ifcopenshell.api.geometry` import anywhere in `assign_object.py`. This is
// genuinely different from `../aggregate/assignObject.ts`'s/`../spatial/
// assignContainer.ts`'s own disclosed `edit_object_placement` gap (an unported real
// call site) -- here, real Python itself never calls it, so there is nothing to skip
// or disclose as a blocker.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { unassignObject as unassignAggregateObject } from "../aggregate/unassignObject";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { unassignContainer } from "../spatial/unassignContainer";

/** Local by-identity set -- see `../aggregate/unassignObject.ts`'s identical helper's own doc comment for why this is duplicated per-module rather than shared. */
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

/**
 * Python's `hasattr(p, "ContainedInStructure")` -- see `../aggregate/assignObject.ts`'s
 * header comment for why this guard is genuinely load-bearing (verified against the
 * native binding, not assumed), matching `util/element.ts`'s own private
 * `attrOrMissing` try/catch technique (not importable from here, so duplicated).
 */
function hasContainedInStructure(product: EntityInstance): boolean {
	try {
		product.get("ContainedInStructure");
		return true;
	} catch {
		return false;
	}
}

/** Python's `next((i for i in rel_list if i.is_a("IfcRelNests")), None)`. */
function findNestsRel(relList: EntityInstance[]): EntityInstance | null {
	return relList.find((i) => i.isA("IfcRelNests")) ?? null;
}

export interface AssignObjectSettings {
	/** The list of children of the nesting relationship, typically `IfcElement`s. */
	relatedObjects: readonly EntityInstance[];
	/** The host parent of the nesting relationship, typically an `IfcElement`. */
	relatingObject: EntityInstance;
}

function assignObjectUsecase(file: IfcFile, settings: AssignObjectSettings): EntityInstance | undefined {
	if (!settings.relatedObjects.length) {
		return undefined;
	}

	const ifc2x3 = file.schema === "IFC2X3";
	const relatedObjectsSet = new EntityInstanceSet();
	relatedObjectsSet.update(settings.relatedObjects);

	let isNestedBy: EntityInstance | null;
	if (ifc2x3) {
		isNestedBy = findNestsRel(settings.relatingObject.get("IsDecomposedBy") as EntityInstance[]);
	} else {
		const nests = settings.relatingObject.get("IsNestedBy") as EntityInstance[];
		isNestedBy = nests[0] ?? null;
	}

	// NOTE: maintain `.RelatedObjects` order as it has meaning in IFC.
	const previousNestsRels = new EntityInstanceSet();
	const objectsWithoutNests: EntityInstance[] = [];
	const objectsWithNests: EntityInstance[] = [];

	// Check if there is anything to change.
	for (const object of relatedObjectsSet.values()) {
		let objectRel: EntityInstance | null;
		if (ifc2x3) {
			objectRel = findNestsRel(object.get("Decomposes") as EntityInstance[]);
		} else {
			const nests = object.get("Nests") as EntityInstance[];
			objectRel = nests[0] ?? null;
		}

		if (!objectRel) {
			objectsWithoutNests.push(object);
			continue;
		}

		// Either `isNestedBy` is null, or the object is part of a different rel.
		if (!sameRel(objectRel, isNestedBy)) {
			previousNestsRels.add(objectRel);
			objectsWithNests.push(object);
		}
		// Objects with an already-assigned matching nesting are skipped.
	}

	const objectsToChange = [...objectsWithoutNests, ...objectsWithNests];
	// Nothing to change.
	if (objectsToChange.length === 0) {
		return isNestedBy ?? undefined;
	}

	// Can be either only nested, aggregated, or contained at the same time.
	const possiblyContained = objectsWithoutNests.filter(hasContainedInStructure);
	unassignContainer(file, { products: possiblyContained });
	unassignAggregateObject(file, { products: objectsWithoutNests });

	// Unassign elements from previous nests.
	for (const nests of previousNestsRels.values()) {
		const curRelatedObjects = (nests.get("RelatedObjects") as EntityInstance[]).filter(
			(o) => !relatedObjectsSet.has(o),
		);
		if (curRelatedObjects.length > 0) {
			nests.set("RelatedObjects", curRelatedObjects);
			updateOwnerHistory(file, { element: nests });
		} else {
			const history = nests.get("OwnerHistory") as EntityInstance | null;
			file.remove(nests);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	// Assign elements to a new nesting.
	if (isNestedBy) {
		const curRelatedObjects = new EntityInstanceSet();
		curRelatedObjects.update(isNestedBy.get("RelatedObjects") as EntityInstance[]);
		curRelatedObjects.update(relatedObjectsSet.values());
		isNestedBy.set("RelatedObjects", curRelatedObjects.values());
		updateOwnerHistory(file, { element: isNestedBy });
	} else {
		isNestedBy = file.createEntity(
			"IfcRelNests",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			settings.relatingObject, // RelatingObject
			relatedObjectsSet.values(), // RelatedObjects
		);
	}

	// NOTE (Python docstring, not a blocker -- see this file's header comment): unlike
	// aggregation/containment, real Python does not re-localize any changed object's
	// placement here. Creating a nesting relationship doesn't localize the object's
	// placement, unlike assigning it to an aggregate or a container.

	return isNestedBy;
}

/**
 * Assigns objects as nested children to a parent host (Python: `ifcopenshell.api.nest.assign_object`).
 *
 * All physical IFC model elements must be part of a hierarchical tree called the
 * "spatial decomposition", where large things are made up of smaller things. This tree
 * always begins at an `IfcProject` and is then broken down using "decomposition"
 * relationships, of which aggregation is the first relationship you will use.
 *
 * Another type of "decomposition" relationship is known as "nesting". Nesting is used
 * when a child object is physically attached to a parent host object, through a
 * physical predetermined connection point. The child object must be specifically
 * designed to attach to other objects at specific positions with a particular form
 * factor. Examples include faucets which must always be attached through a predrilled
 * hole in a basin. Alternatively, it could be a modular attachment with a correlating
 * male and female joint that must join at a particular point. Because there is a strict
 * connection point, when the parent moves, all nested children must move with the
 * parent.
 *
 * Nesting relationships are not very commonly used in most design and construction
 * models. Its main usecase is in modular construction, kit of parts, or fabrication
 * models.
 *
 * As a product may only have a single location in the "spatial decomposition" tree,
 * assigning a nesting relationship will remove any previous aggregation, containment,
 * or nesting relationships it may have.
 *
 * For physical connections which are part of a distribution system, such as a plug
 * connecting into a GPO, or a duct connecting to an AHU, or two pipe segments
 * connecting with a bend, tee, or wye fitting, you should not nest the two objects
 * directly. Instead, you should nest a connection port -- use the more specific
 * functions in `api.system` instead.
 *
 * Note that nesting relationships may also be used by non-physical elements, such as
 * cost items or tasks. In this context, nesting means that there is an implied order to
 * the child cost items or tasks (i.e. task 1 should be shown before task 2).
 *
 * @returns The `IfcRelNests` relationship instance, or `undefined` if `relatedObjects`
 * was an empty list.
 *
 * @example
 * ```ts
 * // Faucets are designed to attach onto a sink through a predrilled hole.
 * const sink = api.root.createEntity(model, { ifcClass: "IfcSanitaryTerminal", predefinedType: "SINK" });
 * const faucet = api.root.createEntity(model, { ifcClass: "IfcValve", predefinedType: "FAUCET" });
 * api.nest.assignObject(model, { relatedObjects: [faucet], relatingObject: sink });
 * ```
 */
export const assignObject = wrapUsecase("nest.assign_object", assignObjectUsecase);
