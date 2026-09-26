// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/add_structural_boundary_condition.py`
// (src/ifcopenshell-python, 72 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). No `api.root`
// dependency here: `IfcBoundaryCondition` subtypes are NOT `IfcRoot` subtypes (no
// `GlobalId`/`OwnerHistory` -- confirmed against `ifc4.d.ts`'s
// `IfcBoundaryNodeCondition`/`IfcBoundaryEdgeCondition`/`IfcBoundaryFaceCondition`
// interfaces: `Name` plus a handful of `unknown`-typed stiffness SELECT attributes
// only), so a plain `file.createEntity(boundaryClass, name)` (positional `Name` at
// index 0) is the correct, direct equivalent of real Python's own
// `file.create_entity(boundary_class, Name=name)`.
//
// When a `connection` is supplied, the boundary class is derived from whichever
// concrete `IfcStructuralConnection` subtype the connection resolves to (unwrapping
// an `IfcRelConnectsStructuralMember` to its `RelatedStructuralConnection` first, if
// that's what was passed) -- point/curve/surface connections get node/edge/face
// conditions respectively. Note the resulting `AppliedCondition` is always assigned
// onto the ORIGINAL `connection` argument passed in -- both `IfcStructuralConnection`
// and `IfcRelConnectsStructuralMember` independently declare their own
// `AppliedCondition` attribute (confirmed against the generated `.d.ts`s), so passing
// a rel sets the condition on the REL, not on the unwrapped connection the boundary
// class itself was derived from. Ported verbatim -- this is real Python's own
// `connection.AppliedCondition = condition` (never `related_connection.
// AppliedCondition = ...`), not a bug this port introduces.
//
// Real Python's final `else: assert False, related_connection`
// (unreachable for any of the three real `IfcStructuralConnection` subtypes, only
// reachable if the abstract `IfcStructuralConnection` base -- or some future subtype --
// is passed directly) is ported as a thrown `Error` naming the offending class, the
// direct TS equivalent of an uncaught Python `AssertionError`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddStructuralBoundaryConditionSettings {
	/** The name of the boundary condition. */
	name?: string | null;
	/**
	 * The `IfcStructuralConnection` (or `IfcRelConnectsStructuralMember`) to apply the
	 * boundary condition to. This will determine the type of condition that is
	 * created. If omitted, an orphan boundary condition will be created using
	 * `ifcClass`.
	 */
	connection?: EntityInstance | null;
	/**
	 * The class of `IfcBoundaryCondition` to create, only relevant if you do not
	 * specify a connection and want to create an orphaned boundary condition. Python
	 * default: `"IfcBoundaryNodeCondition"`.
	 */
	ifcClass?: string;
}

function addStructuralBoundaryConditionUsecase(
	file: IfcFile,
	settings: AddStructuralBoundaryConditionSettings,
): EntityInstance {
	const name = settings.name ?? null;
	const connection = settings.connection;

	if (connection) {
		// assign boundary condition to a connection
		const relatedConnection = connection.isA("IfcRelConnectsStructuralMember")
			? (connection.get("RelatedStructuralConnection") as EntityInstance)
			: connection;

		let boundaryClass: string;
		if (relatedConnection.isA("IfcStructuralPointConnection")) {
			boundaryClass = "IfcBoundaryNodeCondition";
		} else if (relatedConnection.isA("IfcStructuralCurveConnection")) {
			boundaryClass = "IfcBoundaryEdgeCondition";
		} else if (relatedConnection.isA("IfcStructuralSurfaceConnection")) {
			boundaryClass = "IfcBoundaryFaceCondition";
		} else {
			// Python: `assert False, related_connection` -- unreachable for any real
			// `IfcStructuralConnection` subtype, ported as a thrown Error.
			throw new Error(`Unexpected structural connection class: ${relatedConnection.isA()}`);
		}

		const condition = file.createEntity(boundaryClass, name);
		connection.set("AppliedCondition", condition);
		return condition;
	}
	// add an orphan boundary condition
	return file.createEntity(settings.ifcClass ?? "IfcBoundaryNodeCondition", name);
}

/**
 * Adds a new structural boundary condition to a structural connection (Python:
 * `ifcopenshell.api.structural.add_structural_boundary_condition`).
 *
 * The type of boundary condition depends on the connection. Point connections will
 * have a node condition, curve connections will have an edge condition, and surface
 * connections will have a face condition.
 *
 * @returns The newly created `IfcBoundaryCondition`.
 *
 * @example
 * ```ts
 * api.structural.addStructuralBoundaryCondition(model, { connection });
 * ```
 */
export const addStructuralBoundaryCondition = wrapUsecase(
	"structural.add_structural_boundary_condition",
	addStructuralBoundaryConditionUsecase,
);
