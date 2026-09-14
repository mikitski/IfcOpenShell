// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/add_objective.py` (src/ifcopenshell-python, 47
// lines) -- see `./index.ts`'s own header comment for the module's overall scope. A
// trivial, single `create_entity` call with no dependencies at all -- no `OwnerHistory`,
// no `guid.new()`: `IfcObjective` is not an `IfcRoot` subtype (it's an `IfcConstraint`,
// a plain non-rooted resource-level entity), so it has neither a `GlobalId` nor an
// `OwnerHistory` attribute to populate in the first place.
//
// --- `IfcObjective`'s attribute order, verified across all 3 schemas, not assumed ---
//
// `Name`(0)/`Description`(1)/`ConstraintGrade`(2)/`ConstraintSource`(3)/
// `CreatingActor`(4)/`CreationTime`(5)/`UserDefinedGrade`(6)/`BenchmarkValues`(7) are
// identical and contiguous across all 3 schemas' generated `.d.ts` files. Position 8
// diverges (IFC2X3: `ResultValues`; IFC4+: `LogicalAggregator`), but -- verified
// directly, not assumed -- `ObjectiveQualifier` lands back on the SAME position (9) on
// every schema regardless, so the single positional `createEntity` call below (which
// only ever sets `Name`/`ConstraintGrade`/`ObjectiveQualifier`, matching real Python's
// own kwargs, and leaves position 8 as `null` either way) works unbranched on all 3
// schemas. No DERIVE attribute anywhere in `IfcObjective`'s hierarchy on any schema.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/**
 * Real Python's `add_objective(file)` takes no parameters at all beyond `file` -- unlike
 * every other `api.constraint` "add" function (and unlike sibling modules'
 * `add_classification`/`add_library`, which at least default `name`/etc.), there is
 * nothing to configure. Kept as an explicit (empty) settings type rather than dropping
 * the parameter entirely, matching this project's established "every usecase takes a
 * `(file, settings)` pair" `wrapUsecase` convention (see e.g. `../group/addGroup.ts`'s
 * own all-optional `AddGroupSettings`) -- call sites pass `{}`.
 */
export type AddObjectiveSettings = Record<string, never>;

function addObjectiveUsecase(file: IfcFile, _settings: AddObjectiveSettings): EntityInstance {
	// Name(0)="Unnamed", Description(1)=null, ConstraintGrade(2)="NOTDEFINED",
	// ConstraintSource(3)=null, CreatingActor(4)=null, CreationTime(5)=null,
	// UserDefinedGrade(6)=null, BenchmarkValues(7)=null, position 8 (ResultValues on
	// IFC2X3 / LogicalAggregator on IFC4+)=null, ObjectiveQualifier(9)="NOTDEFINED" --
	// see header comment.
	return file.createEntity(
		"IfcObjective",
		"Unnamed",
		null,
		"NOTDEFINED",
		null,
		null,
		null,
		null,
		null,
		null,
		"NOTDEFINED",
	);
}

/**
 * Add a new objective constraint (Python: `ifcopenshell.api.constraint.add_objective`).
 *
 * Parametric constraints may be defined by the user. The constraint is defined by first
 * creating an objective describing the purpose of the constraint and whether it is a
 * hard or soft constraint. Later on, metrics may be added to check whether the
 * constraint has been met by connecting it to properties and quantities. See
 * `api.constraint.addMetric` for more information.
 *
 * @returns The newly created `IfcObjective` entity.
 *
 * @example
 * ```ts
 * // Create a new objective for code compliance requirements
 * const objective = api.constraint.addObjective(model, {});
 * api.constraint.editObjective(model, {
 *   objective,
 *   attributes: { ConstraintGrade: "ADVISORY", ObjectiveQualifier: "CODECOMPLIANCE" },
 * });
 * // Note: the objective right now is purely qualitative and for information purposes.
 * // You may wish to add quantitative metrics.
 * ```
 */
export const addObjective = wrapUsecase("constraint.add_objective", addObjectiveUsecase);
