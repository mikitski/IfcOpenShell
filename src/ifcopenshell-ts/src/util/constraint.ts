// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/constraint.py` (src/ifcopenshell-python, 111
// lines) -- one of Phase 3's four small, independent `util` Tier A chunks (`type.py`,
// `classification.py`, `constraint.py`, `system.py`). Depends only on `ifcopenshell`
// itself (`entity_instance`/`file`) -- confirmed against the real Python source's own
// imports (just `import ifcopenshell`, no `ifcopenshell.util.*` at all).
//
// Ported in full: `get_constraints`, `get_constrained_elements`, `get_metrics`,
// `get_metric_reference`, `get_metric_constraints`, `is_hard_constraint`,
// `is_attribute_locked`.
//
// No disclosed primitive-layer gap: every function here is a direct attribute-graph
// walk (forward `HasAssociations`/`BenchmarkValues`/`ReferencePath`/`InnerReference`/
// `AttributeIdentifier`/`ConstraintGrade`/`Benchmark`, inverse-via-`file.getInverse`),
// all already-bound primitives with no schema-introspection or native-layer need beyond
// what `EntityInstance`/`IfcFile` already expose. No `test/util/test_constraint.py`
// exists in the real Python source to port from (confirmed: `src/ifcopenshell-python/
// test/util/` has no such file) -- this chunk's own test coverage
// (`test/util/constraint.test.ts`) is original, written directly against this file's
// own ported behavior/Python source, not a port of an existing Python test suite.

import type { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";

// --- internal helpers (mirroring `util/element.ts`'s own `EntityInstanceSet` -- not
// exported from that file, so re-declared here rather than reaching into another
// module's private internals; see that file's own doc comments, and
// `util/selector.ts`/`util/classification.ts`'s identical precedent, for the full
// rationale, not repeated here) ---

class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
	}

	toSet(): Set<EntityInstance> {
		return new Set(this.byIdentity.values());
	}
}

/**
 * Python: `get_constraints(product: entity_instance) -> list[entity_instance]`.
 *
 * Retrieves the constraints assigned to the `product`.
 */
export function getConstraints(product: EntityInstance): EntityInstance[] {
	const constraints: EntityInstance[] = [];
	const hasAssociations = (product.get("HasAssociations") as EntityInstance[] | null) ?? [];
	for (const rel of hasAssociations) {
		if (rel.isA("IfcRelAssociatesConstraint")) {
			constraints.push(rel.get("RelatingConstraint") as EntityInstance);
		}
	}
	return constraints;
}

/**
 * Python: `get_constrained_elements(constraint: entity_instance) ->
 * set[entity_instance]`.
 *
 * Retrieves the elements constrained by a `constraint`.
 */
export function getConstrainedElements(constraint: EntityInstance): Set<EntityInstance> {
	const elements = new EntityInstanceSet();
	const file = constraint.file as IfcFile;
	for (const rel of file.getInverse(constraint) as Set<EntityInstance>) {
		if (rel.isA("IfcRelAssociatesConstraint")) {
			elements.update(rel.get("RelatedObjects") as EntityInstance[]);
		}
	}
	return elements.toSet();
}

/**
 * Python: `get_metrics(constraint: entity_instance) -> list[entity_instance]`.
 *
 * Retrieves the list of nested constraints for an `IfcObjective` `constraint`.
 */
export function getMetrics(constraint: EntityInstance): EntityInstance[] {
	const benchmarkValues = (constraint.get("BenchmarkValues") as EntityInstance[] | null) ?? [];
	return [...benchmarkValues];
}

/**
 * Python: `get_metric_reference(metric: entity_instance, is_deep=True)`.
 *
 * Walks `metric.ReferencePath`'s `InnerReference` chain, accumulating a dotted
 * `AttributeIdentifier` path string (`isDeep=true`), or returns just the outermost
 * `AttributeIdentifier` (`isDeep=false`). Ported verbatim, including a real Python
 * quirk: whenever the accumulated `path` is falsy (empty string, or `null` after a
 * level whose own `AttributeIdentifier` was unset), the next level's identifier
 * *replaces* rather than extends `path` -- not "fixed" here.
 */
export function getMetricReference(metric: EntityInstance, isDeep = true): string | null {
	function getReferenceAttribute(ref: EntityInstance | null, path: string | null): string | null {
		if (ref) {
			if (isDeep) {
				const attributeIdentifier = ref.get("AttributeIdentifier") as string | null;
				const nextPath = !path ? attributeIdentifier : path + (attributeIdentifier ? `.${attributeIdentifier}` : "");
				return getReferenceAttribute(ref.get("InnerReference") as EntityInstance | null, nextPath);
			}
			return ref.get("AttributeIdentifier") as string | null;
		}
		return path;
	}

	const reference = metric.get("ReferencePath") as EntityInstance | null;
	return getReferenceAttribute(reference, "");
}

/**
 * Python: `get_metric_constraints(resource: entity_instance, attribute) ->
 * Union[list[entity_instance], None]`.
 *
 * Retrieves every metric (nested constraint) of every constraint assigned to `resource`
 * whose reference path -- shallow or deep -- resolves to `attribute`. Returns `null`
 * (Python: `None`) rather than an empty list when nothing matches.
 */
export function getMetricConstraints(resource: EntityInstance, attribute: string): EntityInstance[] | null {
	const metrics: EntityInstance[] = [];
	for (const constraint of getConstraints(resource)) {
		for (const metric of getMetrics(constraint)) {
			if (getMetricReference(metric, false) === attribute || getMetricReference(metric, true) === attribute) {
				metrics.push(metric);
			}
		}
	}
	return metrics.length > 0 ? metrics : null;
}

/** Python: `is_hard_constraint(metric: entity_instance) -> bool`. */
export function isHardConstraint(metric: EntityInstance): boolean {
	return metric.get("ConstraintGrade") === "HARD" && metric.get("Benchmark") === "EQUALTO";
}

/**
 * Python: `is_attribute_locked(product: entity_instance, attribute) -> bool`.
 *
 * Whether any of `product`'s metric constraints for `attribute` is a hard, EQUALTO
 * constraint.
 */
export function isAttributeLocked(product: EntityInstance, attribute: string): boolean {
	let isLocked = false;
	const metrics = getMetricConstraints(product, attribute) ?? [];
	for (const metric of metrics) {
		if (isHardConstraint(metric)) isLocked = true;
	}
	return isLocked;
}
