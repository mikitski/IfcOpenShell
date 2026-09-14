// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/add_metric_reference.py` (src/ifcopenshell-
// python, 43 lines) -- see `./index.ts`'s own header comment for the module's overall
// scope, and its own real docstring's warning ("usage of constraints are mostly
// untested in real life applications"). The most structurally distinct function in this
// module (per the task brief): given a dotted `"attribute.attribute.attribute"` path
// string, builds a linked chain of `IfcReference` entities (one per dot-separated
// segment), each pointing at the next via `InnerReference`, with the OUTERMOST one
// wired onto `metric.ReferencePath`.
//
// Real Python's own two-branch `if i == 0 / else` loop body is collapsed here into one
// loop with an `i === 0` check controlling which forward link gets wired up
// (`metric.ReferencePath` vs. the PREVIOUS reference's `InnerReference`) -- behaviorally
// identical (both branches otherwise do the exact same
// `create_entity`/`AttributeIdentifier`/`references_created.append` work), not a
// divergence.
//
// --- Real, disclosed schema limitation: `IfcReference` doesn't exist at all on
//     IFC2X3, and neither does `IfcMetric.ReferencePath` -- this function is IFC4+-only
//     in practice, and real Python itself never guards against calling it on IFC2X3 ---
//
// Verified directly against the generated `.d.ts`s, not assumed: `ifc2x3.d.ts` has no
// `IfcReference` interface at all (present in both `ifc4.d.ts`/`ifc4x3.d.ts`, with
// `TypeIdentifier`/`AttributeIdentifier`/`InstanceName`/`ListPositions`/
// `InnerReference`), and `ifc2x3.d.ts`'s `IfcMetric` interface stops at `DataValue` --
// no `ReferencePath` attribute at all (only added on IFC4+). Real Python's own
// `add_metric_reference` has no IFC2X3 branch or guard whatsoever: on an IFC2X3 `file`,
// `file.create_entity("IfcReference")` itself throws immediately (unknown class for that
// schema) before `metric.ReferencePath = reference` is even reached (which would ALSO
// throw -- undeclared attribute). This TS port reproduces that verbatim: `file
// .createEntity("IfcReference")` throws the same way via this port's own
// `resolveDeclaration`, and `metric.set("ReferencePath", ...)` throws via
// `EntityInstance.set`'s identical "no attribute" path -- not "fixed" with an IFC2X3
// guard real Python itself never had. Could not be empirically exercised against a real
// IFC2X3 file in this sandbox (only the IFC4 schema plugin is registered in the locally
// available native addon build -- see `./addMetric.ts`'s header comment for the same,
// already-tracked, pre-existing gap), but the throw is a direct, mechanical consequence
// of `resolveDeclaration`/`EntityInstance.set` on an unregistered class/attribute name,
// already covered by this port's own existing primitive-layer tests elsewhere -- not a
// new code path introduced by this function.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddMetricReferenceSettings {
	/** The `IfcMetric` to attach the reference chain to. */
	metric: EntityInstance;
	/**
	 * A dotted path of the form `"attribute.attribute.attribute"`, used to reference a
	 * value of an attribute of an instance through the metric's objective entity. A
	 * falsy value (empty string) is a no-op, matching Python's own `if reference_path:`
	 * guard.
	 */
	referencePath: string;
}

function addMetricReferenceUsecase(file: IfcFile, settings: AddMetricReferenceSettings): EntityInstance[] {
	const { metric, referencePath } = settings;
	const referencesCreated: EntityInstance[] = [];

	if (referencePath) {
		const attributes = referencePath.split(".");
		for (let i = 0; i < attributes.length; i++) {
			// IfcReference is created bare (no positional attributes), matching real
			// Python's own `file.create_entity("IfcReference")` -- attributes are set
			// individually afterward, not folded into the creation call.
			const reference = file.createEntity("IfcReference");
			reference.set("AttributeIdentifier", attributes[i]);
			if (i === 0) {
				metric.set("ReferencePath", reference);
			} else {
				referencesCreated[i - 1].set("InnerReference", reference);
			}
			referencesCreated.push(reference);
		}
	}

	return referencesCreated;
}

/**
 * Adds a chain of references to a metric (Python:
 * `ifcopenshell.api.constraint.add_metric_reference`).
 *
 * The reference path is a string of the form `"attribute.attribute.attribute"`. Used to
 * reference a value of an attribute of an instance through a metric objective entity.
 *
 * @returns The list of `IfcReference` entities created, outermost first.
 *
 * @example
 * ```ts
 * const objective = api.constraint.addObjective(model, {});
 * const metric = api.constraint.addMetric(model, { objective });
 * api.constraint.addMetricReference(model, { metric, referencePath: "Pset_WallCommon.FireRating" });
 * ```
 */
export const addMetricReference = wrapUsecase("constraint.add_metric_reference", addMetricReferenceUsecase);
