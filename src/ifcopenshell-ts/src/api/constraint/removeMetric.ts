// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/remove_metric.py` (src/ifcopenshell-python, 68
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Removes a metric benchmark: first recursively deletes its `ReferencePath` chain of
// `IfcReference`s (if any -- see `./addMetricReference.ts`), then the metric itself,
// then sweeps the whole file for `IfcRelAssociatesConstraint`/
// `IfcResourceConstraintRelationship` instances left dangling by the removal (same
// `IfcFile.remove`-cascade-then-sweep shape as `./removeConstraint.ts`, ported
// verbatim, not collapsed into a shared helper since real Python doesn't share one
// either).
//
// --- Real, disclosed schema limitation: `remove_metric` is effectively UNUSABLE on
//     IFC2X3 -- real Python's own bug, ported verbatim, not "fixed" with a guard ---
//
// Verified directly against the generated `.d.ts`s and real Python source, not assumed:
//
// 1. `ifc2x3.d.ts`'s `IfcMetric` interface has no `ReferencePath` attribute at all (only
//    added on IFC4+ -- see `./addMetricReference.ts`'s own header comment for the
//    matching `IfcReference`-doesn't-exist-on-IFC2X3 finding). Real Python's very first
//    line, `if metric.ReferencePath:`, throws an `AttributeError` immediately on any
//    IFC2X3 `metric` -- there is no schema branch or guard of any kind protecting it.
// 2. Even setting that aside, `ifc2x3.d.ts` has NO `IfcResourceConstraintRelationship`
//    interface at all (present on `ifc4.d.ts`/`ifc4x3.d.ts`) -- real Python's
//    unconditional `self.file.by_type("IfcResourceConstraintRelationship")` call
//    (reached only if step 1 didn't already throw) would ALSO throw on IFC2X3 (querying
//    a class name the schema doesn't declare at all).
//
// This TS port reproduces both verbatim: `metric.get("ReferencePath")` throws via
// `EntityInstance.get`'s "no attribute" path (matching real Python's `AttributeError`),
// and `file.byType("IfcResourceConstraintRelationship")` throws via this port's own
// `resolveDeclaration`/type-name-lookup (matching real Python's "class not found" on an
// undeclared type) -- NOT "fixed" with an IFC2X3 guard real Python itself never had.
// Could not be empirically exercised against a real IFC2X3 file in this sandbox (only
// the IFC4 schema plugin is registered in the locally available native addon build --
// see `./addMetric.ts`'s header comment for the same, already-tracked, pre-existing
// gap), but both throws are direct, mechanical consequences of primitives already
// covered by this port's own existing tests elsewhere, not new code paths this function
// introduces.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

/** Python: `Usecase.delete_reference` -- recursively deletes an `IfcReference` chain, innermost last. */
function deleteReference(file: IfcFile, reference: EntityInstance): void {
	const inner = reference.get("InnerReference") as EntityInstance | null;
	if (inner) deleteReference(file, inner);
	file.remove(reference);
}

export interface RemoveMetricSettings {
	/** The `IfcMetric` you want to remove. */
	metric: EntityInstance;
}

function removeMetricUsecase(file: IfcFile, settings: RemoveMetricSettings): void {
	const { metric } = settings;

	// See header comment: `metric.get("ReferencePath")` throws on IFC2X3 (no such
	// attribute), matching real Python's own unguarded `AttributeError` there.
	const referencePath = metric.get("ReferencePath") as EntityInstance | null;
	if (referencePath) deleteReference(file, referencePath);

	file.remove(metric);

	for (const rel of file.byType("IfcRelAssociatesConstraint")) {
		if (!rel.get("RelatingConstraint")) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	// See header comment: throws on IFC2X3 (no such class), matching real Python's own
	// unguarded behavior there.
	for (const resourceRel of file.byType("IfcResourceConstraintRelationship")) {
		if (!resourceRel.get("RelatingConstraint")) {
			file.remove(resourceRel);
		}
	}
}

/**
 * Remove a metric benchmark (Python: `ifcopenshell.api.constraint.remove_metric`).
 *
 * Removes a metric benchmark and all of its associations to any products and
 * objectives.
 *
 * @throws On IFC2X3, always -- see this file's header comment: `IfcMetric.ReferencePath`
 *   and `IfcResourceConstraintRelationship` both don't exist on that schema, and real
 *   Python's own source has no guard against it.
 *
 * @example
 * ```ts
 * const objective = api.constraint.addObjective(model, {});
 * const metric = api.constraint.addMetric(model, { objective });
 * api.constraint.removeMetric(model, { metric });
 * ```
 */
export const removeMetric = wrapUsecase("constraint.remove_metric", removeMetricUsecase);
