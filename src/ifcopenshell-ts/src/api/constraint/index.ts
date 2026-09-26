// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.constraint` (src/ifcopenshell-python's `ifcopenshell/api/
// constraint/` package, 10 files, ~566 lines total including `__init__.py`) -- all 9
// functions ported in one chunk, completing that module. Manages `IfcObjective` (a
// qualitative, parametric constraint) and `IfcMetric` (a quantitative benchmark linked
// to an objective), assigned to arbitrary products via `IfcRelAssociatesConstraint`.
//
// Real Python's own module docstring carries a warning, reproduced here verbatim rather
// than silently dropped: "usage of constraints are mostly untested in real life
// applications."
//
// Despite superficially resembling the `classification`/`document`/`library` family
// (an `add_*`/`assign_*`/`edit_*`/`remove_*`/`unassign_*` split), this module's shape is
// genuinely its own -- confirmed directly against the real Python source, not assumed
// from that family's precedent (per the task brief's own explicit warning):
//
// 1. `add_metric_reference`'s dotted "attribute.attribute.attribute" reference-path
//    parsing (a linked chain of `IfcReference` entities via `InnerReference`) has no
//    analogue anywhere in `classification`/`document`/`library` -- see
//    `addMetricReference.ts`'s own header comment.
// 2. `assign_constraint`/`unassign_constraint` look up existing rels via
//    `IfcFile.getInverse(constraint)` (a generic, schema-agnostic "who references this"
//    query), NOT via `util/element.ts`'s `REFERENCE_TYPES`/`getReferencedElements`
//    machinery the `classification`/`document`/`library` family's own
//    `assign*`/`unassign*` functions all share -- confirmed directly: neither
//    `IfcObjective` nor `IfcMetric` appears in `REFERENCE_TYPES` at all.
//    `getReferencedElements` is genuinely NOT relevant to this module. See
//    `assignConstraint.ts`'s own header comment.
// 3. `IfcObjective`/`IfcMetric` are not `IfcRoot` subtypes at all (no `GlobalId`, no
//    `OwnerHistory`) -- `add_objective`/`add_metric`/`edit_objective`/`edit_metric` have
//    no `owner.create_owner_history`/`update_owner_history` dependency whatsoever,
//    unlike every sibling module's own `add_*`/`edit_*` functions.
//
// No unported dependency of any kind: every file only imports `ifcopenshell.api.owner`
// (`assign_constraint`/`unassign_constraint` only, for `create_owner_history`/
// `update_owner_history`, both already landed) and `ifcopenshell.util.element`
// (`remove_constraint`/`remove_metric`/`unassign_constraint`, for `remove_deep2`,
// already fully ported) -- confirmed directly against each file's own imports, not
// assumed.
//
// Two real, disclosed IFC2X3-vs-IFC4+ schema differences/limitations, investigated
// directly against the real Python source and the generated `.d.ts`s, not assumed:
// 1. `IfcReference` doesn't exist at all on IFC2X3, and `IfcMetric.ReferencePath`
//    doesn't exist there either (only added on IFC4+) -- `add_metric_reference` is
//    IFC4+-only in practice; real Python itself has no IFC2X3 guard, so this port
//    reproduces the resulting throw verbatim. See `addMetricReference.ts`'s header
//    comment.
// 2. `IfcResourceConstraintRelationship` doesn't exist at all on IFC2X3 either --
//    combined with finding 1, `remove_metric` is effectively unusable on IFC2X3: real
//    Python's own unguarded `metric.ReferencePath`/`file.by_type(
//    "IfcResourceConstraintRelationship")` calls both throw there. See
//    `removeMetric.ts`'s header comment.
//
// One more disclosed finding, narrower than a schema difference: `IfcObjective
// .BenchmarkValues` appears as a bare, non-array `IfcMetric | null` in `ifc2x3.d.ts` but
// as `IfcConstraint[] | null` in `ifc4.d.ts`/`ifc4x3.d.ts` -- almost certainly a
// `.d.ts`-generation artifact for LIST attributes declared through IFC2X3's own
// indirect `IfcMetricValue` defined-type alias, not a genuine scalar attribute; this
// port follows the already-landed `util/constraint.ts`'s `getMetrics` (this exact
// attribute's other real caller), which already reads it as an array unbranched across
// all 3 schemas. See `addMetric.ts`'s header comment for the full writeup.
//
// None of the above 3 findings could be empirically verified against a real IFC2X3 file
// in this sandbox: the locally available native addon build only has the IFC4 schema
// plugin registered (`AVAILABLE_SCHEMAS` resolves to `["IFC4"]`), matching this
// project's own already-tracked, pre-existing build gap (see `api.library`'s landed
// `PROGRESS.md` row) -- not a regression introduced by this chunk.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.constraint.addObjective`/`api.constraint.addMetric`/etc.
export { addMetric } from "./addMetric";
export type { AddMetricSettings } from "./addMetric";
export { addMetricReference } from "./addMetricReference";
export type { AddMetricReferenceSettings } from "./addMetricReference";
export { addObjective } from "./addObjective";
export type { AddObjectiveSettings } from "./addObjective";
export { assignConstraint } from "./assignConstraint";
export type { AssignConstraintSettings } from "./assignConstraint";
export { editMetric } from "./editMetric";
export type { EditMetricSettings } from "./editMetric";
export { editObjective } from "./editObjective";
export type { EditObjectiveSettings } from "./editObjective";
export { removeConstraint } from "./removeConstraint";
export type { RemoveConstraintSettings } from "./removeConstraint";
export { removeMetric } from "./removeMetric";
export type { RemoveMetricSettings } from "./removeMetric";
export { unassignConstraint } from "./unassignConstraint";
export type { UnassignConstraintSettings } from "./unassignConstraint";
