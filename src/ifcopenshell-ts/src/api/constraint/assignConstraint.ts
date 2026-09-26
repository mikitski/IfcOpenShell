// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/assign_constraint.py` (src/ifcopenshell-python,
// 93 lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Assigns `constraint` (an `IfcObjective`, typically) to a list of `products`, reusing
// an existing `IfcRelAssociatesConstraint` if one already relates `constraint` to
// *some* products, or creating a new one otherwise.
//
// --- NOT structurally identical to `../document/assignDocument.ts`/`../library/
//     assignReference.ts`, despite the family resemblance -- confirmed directly, not
//     assumed (the task brief specifically flagged this as needing verification) ---
//
// `document.assign_document`/`library.assign_reference` both look for an existing rel
// via the REFERENCE-side (`document.DocumentRefForObjects`/`reference
// .LibraryRefForObjects`, or an `IfcRelAssociates*` file-wide scan on IFC2X3) --
// `util/element.ts`'s `REFERENCE_TYPES` table machinery. `assign_constraint` does
// something genuinely simpler and schema-agnostic instead: `self.file.get_inverse
// (constraint)` -- a generic "who references this instance at all" primitive query,
// filtered down to `IfcRelAssociatesConstraint` instances in Python -- with NO IFC2X3
// branch of its own at all (`IfcRelAssociatesConstraint` has always been queryable this
// way; there is no separate `ConstraintForObjects`-style inverse attribute or
// `REFERENCE_TYPES` entry for `IfcObjective`/`IfcMetric` in this codebase, confirmed
// directly: neither class appears in `util/element.ts`'s `REFERENCE_TYPES` table at
// all -- `getReferencedElements` is genuinely NOT relevant to this module, contrary to
// what the `classification`/`document`/`library` family's shape might suggest). This
// file therefore reimplements `get_constraint_rels` locally via `IfcFile.getInverse`
// rather than reaching into `util/element.ts`'s reference-association machinery.
//
// --- `IfcRelAssociatesConstraint`'s attribute order, verified across all 3 schemas ---
//
// `GlobalId`(0)/`OwnerHistory`(1)/`Name`(2)/`Description`(3)/`RelatedObjects`(4)/
// `Intent`(5)/`RelatingConstraint`(6) are identical and contiguous across all 3
// schemas' generated `.d.ts` files (only `RelatedObjects`'s own element type differs --
// `IfcRoot[]` on IFC2X3 vs. `(IfcObjectDefinition | IfcPropertyDefinition)[]` on IFC4+,
// which doesn't affect this port's positional-index reasoning). No DERIVE attribute
// anywhere in this class's hierarchy on any schema. `Intent` is left `null`, matching
// real Python's own kwargs call, which never mentions it.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Python's `set()`/dedup-by-identity idiom -- see `../classification/addReference.ts`'s identical, independently re-declared local helper for the full rationale. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
	}

	get size(): number {
		return this.byIdentity.size;
	}

	toArray(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}

	toSet(): Set<EntityInstance> {
		return new Set(this.byIdentity.values());
	}
}

/** Python's `set(a) - b`, by identity. */
function differenceByIdentity(a: Iterable<EntityInstance>, b: Set<EntityInstance>): EntityInstance[] {
	const bIds = new Set([...b].map((i) => i.identity()));
	const result = new EntityInstanceSet();
	for (const item of a) {
		if (!bIds.has(item.identity())) result.add(item);
	}
	return result.toArray();
}

/** Python: `get_constraint_rels` -- see header comment on why this is `IfcFile.getInverse`-based, not `util/element.ts`'s `REFERENCE_TYPES` machinery. */
function getConstraintRels(file: IfcFile, constraint: EntityInstance): EntityInstance[] {
	const rels: EntityInstance[] = [];
	for (const rel of file.getInverse(constraint) as Set<EntityInstance>) {
		if (rel.isA("IfcRelAssociatesConstraint")) rels.push(rel);
	}
	return rels;
}

export interface AssignConstraintSettings {
	/** The list of products the constraint applies to. This is anything which can have properties or quantities. */
	products: readonly EntityInstance[];
	/** The `IfcObjective` constraint. */
	constraint: EntityInstance;
}

function assignConstraintUsecase(file: IfcFile, settings: AssignConstraintSettings): EntityInstance | undefined {
	const { constraint } = settings;
	if (settings.products.length === 0) return undefined;

	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	const rels = getConstraintRels(file, constraint);
	const relatedObjects = new EntityInstanceSet();
	for (const rel of rels) relatedObjects.update(rel.get("RelatedObjects") as EntityInstance[]);

	const productsToAssign = differenceByIdentity(productsSet.toArray(), relatedObjects.toSet());
	if (productsToAssign.length === 0) return rels[0];

	// Python: `rel = next(iter(rels), None)` -- the first pre-existing rel, if any.
	const rel = rels[0] ?? null;

	if (rel) {
		const merged = new EntityInstanceSet();
		merged.update(rel.get("RelatedObjects") as EntityInstance[]);
		merged.update(productsToAssign);
		rel.set("RelatedObjects", merged.toArray());
		updateOwnerHistory(file, { element: rel });
		return rel;
	}

	// IfcRelAssociatesConstraint: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
	// RelatedObjects(4), Intent(5), RelatingConstraint(6) -- see header comment.
	return file.createEntity(
		"IfcRelAssociatesConstraint",
		guid.new(),
		createOwnerHistory(file, {}),
		null,
		null,
		productsToAssign,
		null,
		constraint,
	);
}

/**
 * Assigns a constraint to a list of products (Python:
 * `ifcopenshell.api.constraint.assign_constraint`).
 *
 * This assigns a relationship between a product and a constraint, so that when a
 * product's properties and quantities do not match the requirements of the constraint's
 * metrics, results can be flagged.
 *
 * It is assumed (but not explicit in the IFC documentation) that constraints are
 * inherited from the type. This way, it is not necessary to create lots of constraint
 * assignments.
 *
 * @returns The new or updated `IfcRelAssociatesConstraint` relationship, or `undefined`
 *   if `products` was empty.
 *
 * @example
 * ```ts
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * const objective = api.constraint.addObjective(model, {});
 * api.constraint.assignConstraint(model, { products: [wall], constraint: objective });
 * ```
 */
export const assignConstraint = wrapUsecase("constraint.assign_constraint", assignConstraintUsecase);
