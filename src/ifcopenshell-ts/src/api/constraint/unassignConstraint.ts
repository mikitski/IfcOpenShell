// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/unassign_constraint.py` (src/ifcopenshell-python,
// 79 lines) -- see `./index.ts`'s own header comment for the module's overall scope, and
// `./assignConstraint.ts`'s own header comment for why this module's rel-lookup is
// `IfcFile.getInverse`-based rather than `util/element.ts`'s `REFERENCE_TYPES`
// machinery (same reasoning applies here symmetrically). Removes `products` from every
// `IfcRelAssociatesConstraint` relating them to `constraint`, deleting each rel entirely
// once it has no `RelatedObjects` left.
//
// Real Python's own `Usecase.get_constraint_rels` local parameter is named `cosntraint`
// (a typo for `constraint`) -- purely cosmetic (an internal method-parameter name with
// no observable effect on behavior), not reproduced here; this port's local
// `getConstraintRels` helper (shared in spirit, independently re-declared, with
// `./assignConstraint.ts`'s identical function) uses the correctly-spelled name
// throughout, matching this project's convention of not carrying over purely
// cosmetic/internal-naming typos that have zero behavioral effect (unlike a genuine
// logic asymmetry, which this project's discipline does preserve and disclose).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
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

	toArray(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}

	toSet(): Set<EntityInstance> {
		return new Set(this.byIdentity.values());
	}
}

/** Python's `set(a) - b`, by identity. */
function differenceByIdentity(a: Iterable<EntityInstance>, b: EntityInstanceSet): EntityInstance[] {
	const bIds = new Set(b.toArray().map((i) => i.identity()));
	const result = new EntityInstanceSet();
	for (const item of a) {
		if (!bIds.has(item.identity())) result.add(item);
	}
	return result.toArray();
}

/** Python's `set(a).intersection(b)` truthiness check, by identity. */
function intersectsByIdentity(a: readonly EntityInstance[], b: Set<EntityInstance>): boolean {
	const bIds = new Set([...b].map((i) => i.identity()));
	return a.some((item) => bIds.has(item.identity()));
}

/** Python: `get_constraint_rels` -- see header comment. */
function getConstraintRels(file: IfcFile, constraint: EntityInstance): EntityInstance[] {
	const rels: EntityInstance[] = [];
	for (const rel of file.getInverse(constraint) as Set<EntityInstance>) {
		if (rel.isA("IfcRelAssociatesConstraint")) rels.push(rel);
	}
	return rels;
}

export interface UnassignConstraintSettings {
	/** The list of products the constraint applies to. */
	products: readonly EntityInstance[];
	/** The `IfcObjective` constraint. */
	constraint: EntityInstance;
}

function unassignConstraintUsecase(file: IfcFile, settings: UnassignConstraintSettings): void {
	const { constraint } = settings;
	if (settings.products.length === 0) return;

	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	const rels = getConstraintRels(file, constraint);
	const relatedObjectsAll = new EntityInstanceSet();
	for (const rel of rels) relatedObjectsAll.update(rel.get("RelatedObjects") as EntityInstance[]);

	if (!intersectsByIdentity(relatedObjectsAll.toArray(), productsSet.toSet())) return;

	for (const rel of rels) {
		const relatedObjects = new EntityInstanceSet();
		relatedObjects.update(rel.get("RelatedObjects") as EntityInstance[]);
		if (!intersectsByIdentity(relatedObjects.toArray(), productsSet.toSet())) continue;

		const remaining = differenceByIdentity(relatedObjects.toArray(), productsSet);
		if (remaining.length > 0) {
			rel.set("RelatedObjects", remaining);
			updateOwnerHistory(file, { element: rel });
			continue;
		}

		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
}

/**
 * Unassigns a constraint from a list of products (Python:
 * `ifcopenshell.api.constraint.unassign_constraint`).
 *
 * The constraint will not be deleted and is available to be assigned to other products.
 *
 * @example
 * ```ts
 * api.constraint.assignConstraint(model, { products: [wall], constraint: objective });
 * api.constraint.unassignConstraint(model, { products: [wall], constraint: objective });
 * ```
 */
export const unassignConstraint = wrapUsecase("constraint.unassign_constraint", unassignConstraintUsecase);
