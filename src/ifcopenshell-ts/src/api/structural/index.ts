// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.structural` (src/ifcopenshell-python's
// `ifcopenshell/api/structural/` package) -- a brand-new module, all 23 real files
// ported in one chunk (1113 lines total). Manages analytical properties for
// structural simulation: `IfcStructuralAnalysisModel` (a group of loads, reactions,
// members, and connections), `IfcStructuralLoadCase`/`IfcStructuralLoadGroup`
// (collections of related loads), `IfcStructuralLoad*` subtypes (actions/reactions),
// `IfcStructuralActivity` (an applied load on a structural member), and
// `IfcBoundaryCondition` subtypes (node/edge/face conditions on structural
// connections) -- real Python's own module docstring: "This only handles authoring
// the analytical model, and does not actually perform any structural simulation. To
// perform the simulation, see IFC2CA."
//
// No unported dependency of any kind -- confirmed by reading every real file's own
// imports: `api.group.assignGroup`/`.unassignGroup`, `api.owner.createOwnerHistory`,
// `api.root.createEntity`, `guid`, `util.element.removeDeep2`, all already landed. The
// `ifcopenshell.util.shape_builder.VectorType`/`ifc_safe_vector_type` import in
// `edit_structural_connection_cs.py`/`edit_structural_item_axis.py` is NOT a blocker
// either (verified by reading `shape_builder.py`'s real source: a trivial
// float-conversion helper, no real numpy math) -- this project already has a direct
// TS port of it, `../../util/shapeBuilder.ts`'s own `ifcSafeVectorType`/`VectorType`,
// reused directly rather than reinvented.
//
// One call site is genuinely blocked by a real, pre-existing, already 6-times-
// confirmed primitive-layer gap (`TODOS.md`'s "`EntityInstance.setByIndex`/
// `IfcFile.createEntity` cannot write an initial value into a freshly created
// simple/defined-type instance" entry): `./editStructuralBoundaryCondition.ts`'s
// `"IfcBoolean"`/generic-measure-class branches, which need to materialize a
// freestanding, valued simple/defined-type instance the same way
// `../unit/addConversionBasedUnit.ts`/`../pset/editPset.ts`/`../style/editSurfaceStyle.ts`/
// `../pset_template/editPropTemplate.ts`/`../owner/addApplication.ts` already do --
// ported completely and faithfully anyway, throwing this same pre-existing error only
// at that exact point, never proactively. See that file's own header comment and
// `TODOS.md`'s "UPDATE" for the full disclosure.
//
// Several real, disclosed Python quirks/bugs, ported verbatim rather than "fixed" --
// see each file's own header comment for the full writeup: `add_structural_boundary_
// condition.py`'s unreachable `assert False, related_connection` (ported as a thrown
// `Error`); `remove_structural_boundary_condition.py`'s unguarded, `is_a`-unchecked
// `AppliedCondition = None` assignment on every real inverse of an orphaned condition;
// `edit_structural_item_axis.py`'s crash-on-unset-`Axis` quirk (no truthy pre-check,
// unlike its sibling `edit_structural_connection_cs.py`); `remove_structural_load_
// case.py`'s missing `if history:` guard on its own final `remove_deep2` call (unlike
// every sibling remove function in this module, including its own first loop);
// `remove_structural_connection_condition.py`'s orphan-condition bug -- it checks the
// REL's own `AppliedCondition` to decide whether to delegate, but the delegated call
// checks/clears the UNWRAPPED CONNECTION's separate `AppliedCondition` instead, so a
// condition attached via a rel (see `add_structural_boundary_condition.py`'s own
// rel-vs-connection nuance below) is never actually purged, only left as an orphan.
// `remove_structural_load_group.py`'s multi-member `IfcRelAssignsToGroup` handling
// looked like a dangling-reference bug at first glance but isn't -- confirmed by
// reading `src/ifcparse/parse.cpp`'s `process_deletion_`: `file.remove`'s native
// reference-cleanup automatically splices a removed entity out of every aggregate
// attribute it appears in, so a surviving multi-member rel is left correctly
// shortened, not dangling (see that file's own header comment and its dedicated
// regression test). `add_structural_boundary_condition.py` also has a subtle, real
// (not a bug) nuance: passing an `IfcRelConnectsStructuralMember` derives the boundary
// CLASS from its unwrapped `RelatedStructuralConnection`, but sets `AppliedCondition`
// on the REL itself -- both classes independently declare that attribute.
//
// Several real, confirmed schema divergences (all confirmed against the generated
// `.d.ts`s, not `.d.ts`-generation artifacts): `IfcStructuralLoadCase` doesn't exist
// on IFC2X3 at all (only `IfcStructuralLoadGroup`, distinguished by `PredefinedType`);
// `IfcStructuralPointConnection.ConditionCoordinateSystem` and
// `IfcStructuralCurveMember`/`IfcStructuralCurveConnection.Axis` don't exist on IFC2X3
// either; `IfcStructuralPlanarAction`/other `IfcStructuralActivity` subtypes have no
// `PredefinedType` attribute on IFC2X3 (`api.root.createEntity`'s own `hasAttribute`
// guard silently skips it there, no error). `add_structural_load_case.py`/
// `edit_structural_load_case.py`/`remove_structural_load_case.py`/
// `edit_structural_connection_cs.py`/`edit_structural_item_axis.py` are therefore
// IFC4+-only in practice, matching real Python's own unguarded behavior exactly (no
// IFC2X3-specific branch exists in real Python either).
//
// Namespaced as `api.structural.addStructuralActivity`/etc., matching `util/index.ts`'s
// per-submodule convention. Real Python test coverage exists only for
// `add_structural_analysis_model`/`assign_product`/`assign_structural_analysis_model`/
// `assign_to_building`/`edit_structural_analysis_model`/`remove_structural_analysis_
// model`/`unassign_structural_analysis_model` (`test/api/structural/test_*.py`, all
// ported verbatim, extended from real Python's own IFC4/IFC2X3-only coverage to all of
// `AVAILABLE_SCHEMAS` including IFC4X3 where the underlying entities are schema-
// identical); every other function (16 of 23) has no real Python test at all
// (confirmed by listing `test/api/structural/` -- no other `test_*.py` file exists),
// so their own coverage is written directly from source/docstrings, including
// dedicated pins for every disclosed quirk/bug and the `editStructuralBoundaryCondition`
// blocker above.
export { addStructuralActivity } from "./addStructuralActivity";
export type { AddStructuralActivitySettings } from "./addStructuralActivity";
export { addStructuralAnalysisModel } from "./addStructuralAnalysisModel";
export type { AddStructuralAnalysisModelSettings } from "./addStructuralAnalysisModel";
export { addStructuralBoundaryCondition } from "./addStructuralBoundaryCondition";
export type { AddStructuralBoundaryConditionSettings } from "./addStructuralBoundaryCondition";
export { addStructuralLoad } from "./addStructuralLoad";
export type { AddStructuralLoadSettings } from "./addStructuralLoad";
export { addStructuralLoadCase } from "./addStructuralLoadCase";
export type { AddStructuralLoadCaseSettings } from "./addStructuralLoadCase";
export { addStructuralLoadGroup } from "./addStructuralLoadGroup";
export type { AddStructuralLoadGroupSettings } from "./addStructuralLoadGroup";
export { addStructuralMemberConnection } from "./addStructuralMemberConnection";
export type { AddStructuralMemberConnectionSettings } from "./addStructuralMemberConnection";
export { assignProduct } from "./assignProduct";
export type { AssignProductSettings } from "./assignProduct";
export { assignStructuralAnalysisModel } from "./assignStructuralAnalysisModel";
export type { AssignStructuralAnalysisModelSettings } from "./assignStructuralAnalysisModel";
export { assignToBuilding } from "./assignToBuilding";
export type { AssignToBuildingSettings } from "./assignToBuilding";
export { editStructuralAnalysisModel } from "./editStructuralAnalysisModel";
export type { EditStructuralAnalysisModelSettings } from "./editStructuralAnalysisModel";
export { editStructuralBoundaryCondition } from "./editStructuralBoundaryCondition";
export type {
	EditStructuralBoundaryConditionSettings,
	StructuralBoundaryConditionAttributeValue,
} from "./editStructuralBoundaryCondition";
export { editStructuralConnectionCs } from "./editStructuralConnectionCs";
export type { EditStructuralConnectionCsSettings } from "./editStructuralConnectionCs";
export { editStructuralItemAxis } from "./editStructuralItemAxis";
export type { EditStructuralItemAxisSettings } from "./editStructuralItemAxis";
export { editStructuralLoad } from "./editStructuralLoad";
export type { EditStructuralLoadSettings } from "./editStructuralLoad";
export { editStructuralLoadCase } from "./editStructuralLoadCase";
export type { EditStructuralLoadCaseSettings } from "./editStructuralLoadCase";
export { removeStructuralAnalysisModel } from "./removeStructuralAnalysisModel";
export type { RemoveStructuralAnalysisModelSettings } from "./removeStructuralAnalysisModel";
export { removeStructuralBoundaryCondition } from "./removeStructuralBoundaryCondition";
export type { RemoveStructuralBoundaryConditionSettings } from "./removeStructuralBoundaryCondition";
export { removeStructuralConnectionCondition } from "./removeStructuralConnectionCondition";
export type { RemoveStructuralConnectionConditionSettings } from "./removeStructuralConnectionCondition";
export { removeStructuralLoad } from "./removeStructuralLoad";
export type { RemoveStructuralLoadSettings } from "./removeStructuralLoad";
export { removeStructuralLoadCase } from "./removeStructuralLoadCase";
export type { RemoveStructuralLoadCaseSettings } from "./removeStructuralLoadCase";
export { removeStructuralLoadGroup } from "./removeStructuralLoadGroup";
export type { RemoveStructuralLoadGroupSettings } from "./removeStructuralLoadGroup";
export { unassignStructuralAnalysisModel } from "./unassignStructuralAnalysisModel";
export type { UnassignStructuralAnalysisModelSettings } from "./unassignStructuralAnalysisModel";
