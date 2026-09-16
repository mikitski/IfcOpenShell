// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.*` (src/ifcopenshell-python's `ifcopenshell/api/`
// package). Unlike `util/index.ts`'s convention of namespacing every submodule
// (`util.element.getPset`), the pre/post-listener hook system (`hooks.ts`) is
// re-exported flat, directly on `api` itself (`api.addPreListener`, not
// `api.hooks.addPreListener`) -- matching real Python, where `pre_listeners`/
// `add_pre_listener`/`wrap_usecase`/etc. live directly in
// `ifcopenshell/api/__init__.py`'s own top-level namespace, not in a submodule.
// Future usecase modules (`api.root`, `api.project`, `api.spatial`, ...) will be
// namespaced normally as they land (`export * as root from "./root"`), matching
// `util/index.ts`'s precedent for its own submodules -- see `hooks.ts`'s own header
// comment for why individual usecase files call `wrapUsecase` directly rather than
// this barrel doing any reflection-based auto-wrapping.
export * from "./hooks";

// Phase 6, `api.root`/`api.owner` chunk: `root.create_entity` (the foundational
// function almost every other `api.*` usecase calls internally, per
// `research/02-python-api-inventory.md` SS3's "root" deep dive) plus its two minimal
// real dependencies, `owner.create_owner_history` and the `owner.settings`
// monkeypatch-replacement hook. Namespaced as `api.root.createEntity`/
// `api.owner.createOwnerHistory`/`api.owner.ownerSettings`, matching `util/index.ts`'s
// per-submodule convention -- see `root/createEntity.ts`'s and `owner/settings.ts`'s
// own header comments for this chunk's exact scope and design decisions.
export * as root from "./root";
export * as owner from "./owner";

// Phase 6, `api.spatial` chunk: all 4 `api.spatial` functions
// (`assign_container`/`unassign_container`/`reference_structure`/
// `dereference_structure`), plus two small direct dependencies this chunk also ports:
// `owner.update_owner_history` (added to the `api.owner` barrel above -- see
// `owner/updateOwnerHistory.ts`) and `aggregate.unassign_object` (a new, minimal
// `api.aggregate` barrel -- see `aggregate/unassignObject.ts` for why only this one
// function, not the full `api.aggregate` module, is in scope here). Namespaced as
// `api.spatial.assignContainer`/etc., `api.aggregate.unassignObject`.
export * as spatial from "./spatial";
export * as aggregate from "./aggregate";

// Phase 6, `api.unit` chunk: all 11 functions of `ifcopenshell.api.unit` (~790 lines
// total) -- a real, self-contained, cohesive module (no geometry-kernel or other
// unported hard dependency anywhere in it). Namespaced as `api.unit.addSiUnit`/etc.
// One real, disclosed, pre-existing primitive-layer gap (first surfaced by
// `util/migrator.ts`) blocks `unit.addConversionBasedUnit` entirely and
// `unit.assignUnit`'s imperial-synthesis branch only -- see `unit/index.ts`'s and
// `unit/addConversionBasedUnit.ts`'s own header comments for the full writeup.
export * as unit from "./unit";

// Phase 6, `api.type` chunk: only `unassign_type`, the one small, well-scoped function
// of this module per `research/02-api-layer.md` SS3's own early-target recommendation --
// `assign_type` (319 lines, the largest file in this group) and
// `map_type_representations` (a fan-out over every occurrence of a type) remain
// future, separate chunks. Namespaced as `api.type.unassignType` -- see
// `type/unassignType.ts`'s own header comment for this chunk's exact scope and a real,
// disclosed upstream bug ported verbatim.
export * as type from "./type";

// Phase 6, `api.context` chunk: all 3 `api.context` functions (`add_context`/
// `edit_context`/`remove_context`), completing that module, plus two small direct
// dependencies this chunk also ports into a new, deliberately partial `api.geometry`
// barrel: `unassign_representation`/`remove_representation` (real Python:
// `remove_context`'s top-level-context branch calls both). `api.geometry` itself is
// NOT fully ported -- `edit_object_placement` (the already-disclosed `api.spatial`/
// `api.aggregate` blocker, see `TODOS.md`) and every other function in that module
// remain future work. Namespaced as `api.context.addContext`/etc.,
// `api.geometry.unassignRepresentation`/`api.geometry.removeRepresentation` -- see
// `context/addContext.ts`'s and `geometry/unassignRepresentation.ts`'s own header
// comments for this chunk's exact scope.
export * as context from "./context";
export * as geometry from "./geometry";

// Phase 6, `api.layer` chunk: all 6 `api.layer` functions (`add_layer`/
// `add_layer_with_style`/`assign_layer`/`edit_layer`/`remove_layer`/`unassign_layer`),
// completing that module -- a real, self-contained module with no unported dependency
// of any kind (every file only ever imports bare `ifcopenshell`). Manages
// `IfcPresentationLayerAssignment`/`IfcPresentationLayerWithStyle`. Namespaced as
// `api.layer.addLayer`/etc. -- see `layer/index.ts`'s own header comment for this
// chunk's two disclosed findings (a pre-existing LOGICAL-attribute round-trip gap, and
// a real Python-source bug in `unassign_layer` reproduced verbatim).
export * as layer from "./layer";

// Phase 6, `api.group` chunk: all 6 `api.group` functions (`add_group`/`assign_group`/
// `edit_group`/`remove_group`/`unassign_group`/`update_group_products`), completing
// that module -- manages `IfcGroup` via `IfcRelAssignsToGroup`, a generic non-spatial
// grouping mechanism. Plus one small direct dependency this chunk also ports into a
// new, deliberately partial `api.pset` barrel: `remove_pset` (real Python:
// `remove_group`'s cleanup step calls it on any pset assigned directly to the group
// being removed). `api.pset` itself is NOT fully ported -- `add_pset`/`edit_pset`/etc.
// remain future work. Namespaced as `api.group.addGroup`/etc., `api.pset.removePset`
// -- see `group/index.ts`'s and `pset/index.ts`'s own header comments for this chunk's
// exact scope, including a noteworthy finding about `remove_group`'s reliance on
// `IfcFile.remove`'s own automatic aggregate-reference cleanup.
export * as group from "./group";
export * as pset from "./pset";

// Phase 6, `api.classification` chunk: all 6 `api.classification` functions
// (`add_classification`/`add_reference`/`edit_classification`/`edit_reference`/
// `remove_classification`/`remove_reference`), completing that module -- manages
// `IfcClassification`/`IfcClassificationReference` via `IfcRelAssociatesClassification`
// (rooted objects) / `IfcExternalReferenceRelationship` (non-rooted resource objects,
// IFC4+ only). No unported dependency of any kind, though `util/element.ts`'s
// `get_referenced_elements` (previously deliberately deferred out of that file's own
// 3-chunk port) is added here, in full, as this module's first genuine caller.
// Namespaced as `api.classification.addClassification`/etc. -- see
// `classification/index.ts`'s own header comment for this chunk's exact scope,
// including two real, disclosed IFC2X3-vs-IFC4+ schema differences.
export * as classification from "./classification";

// Phase 6, `api.document` chunk: all 8 `api.document` functions (`add_information`/
// `add_reference`/`assign_document`/`edit_information`/`edit_reference`/
// `remove_information`/`remove_reference`/`unassign_document`), completing that module
// -- manages `IfcDocumentInformation`/`IfcDocumentReference` via
// `IfcRelAssociatesDocument`. No unported dependency of any kind. Namespaced as
// `api.document.addInformation`/etc. -- see `document/index.ts`'s own header comment for
// this chunk's exact scope, including a real, disclosed asymmetry with the structurally
// similar `api.classification` module (`assignDocument`/`unassignDocument` don't support
// non-`IfcRoot` resource objects at all) and 2 disclosed IFC2X3-vs-IFC4+ schema
// differences.
export * as document from "./document";

// Phase 6, `api.library` chunk: all 8 `api.library` functions (`add_library`/
// `add_reference`/`assign_reference`/`edit_library`/`edit_reference`/`remove_library`/
// `remove_reference`/`unassign_reference`), completing that module -- the third sibling
// in the `classification`/`document`/`library` family (all 3 now fully ported). Manages
// `IfcLibraryInformation`/`IfcLibraryReference` via `IfcRelAssociatesLibrary`. No
// unported dependency of any kind. Namespaced as `api.library.addLibrary`/etc. -- see
// `library/index.ts`'s own header comment for this chunk's exact scope, including 3
// disclosed IFC2X3-vs-IFC4+ schema differences (one genuinely new: `VersionDate` is an
// `IfcCalendarDate` entity on IFC2X3 but a plain `IfcDateTime` string on IFC4+) and a
// disclosed asymmetry between `library.removeReference`'s IFC2X3 branch and
// `document.removeReference`'s own (despite both modules otherwise sharing
// `assignReference`/`unassignReference`'s exact shape with `document`'s
// `assignDocument`/`unassignDocument`, per real Python's own cross-referencing comment).
export * as library from "./library";

// Phase 6, `api.constraint` chunk: all 9 `api.constraint` functions (`add_metric`/
// `add_metric_reference`/`add_objective`/`assign_constraint`/`edit_metric`/
// `edit_objective`/`remove_constraint`/`remove_metric`/`unassign_constraint`),
// completing that module and its `classification`/`document`/`library`/`constraint`
// resource-association family. Manages `IfcObjective`/`IfcMetric`, assigned to products
// via `IfcRelAssociatesConstraint`. No unported dependency of any kind. Namespaced as
// `api.constraint.addObjective`/etc. -- see `constraint/index.ts`'s own header comment
// for this chunk's exact scope, including why (despite the family resemblance) this
// module's `assignConstraint`/`unassignConstraint` do NOT use `util/element.ts`'s
// `REFERENCE_TYPES`/`getReferencedElements` machinery at all (neither `IfcObjective` nor
// `IfcMetric` is a `REFERENCE_TYPES` entry), 2 disclosed IFC2X3-vs-IFC4+ schema
// limitations (`add_metric_reference`/`remove_metric` are effectively IFC4+-only --
// `IfcReference`/`IfcMetric.ReferencePath`/`IfcResourceConstraintRelationship` all don't
// exist on IFC2X3, and real Python has no guard against it, ported verbatim), and a
// disclosed `.d.ts`-generation-artifact finding on `IfcObjective.BenchmarkValues`.
export * as constraint from "./constraint";

// Phase 6, `api.project` chunk: 3 of `api.project`'s 4 real files (`create_file`/
// `assign_declaration`/`unassign_declaration`) -- `append_asset.py` (827 lines,
// importing a whole asset from a library file into the active model) is deliberately
// NOT ported, a much larger, separate future chunk (matching the partial-completion
// pattern of `api.type`/`api.pset`/`api.geometry`'s own `PROGRESS.md` rows).
// `createFile` reuses `template.ts`'s `create()` (extended with a new, purely
// additive `blank`/`authorization`/`description` option set, see `template.ts`'s own
// updated header comment) rather than reimplementing STEP-header templating from
// scratch. `assignDeclaration`/`unassignDeclaration` manage `IfcRelDeclares` --
// confirmed IFC4+-only (absent from `ifc2x3.d.ts` entirely), no runtime guard added,
// matching real Python. Namespaced as `api.project.createFile`/`.assignDeclaration`/
// `.unassignDeclaration` -- see `project/createFile.ts`'s and
// `project/assignDeclaration.ts`'s own header comments for the full reuse-decision
// writeup and a real, disclosed Python quirk in `unassign_declaration.py` (its own
// `relatingContext` parameter is accepted but never actually consulted).
export * as project from "./project";

// Phase 6, `api.material` chunk 1 of several: 3 of `api.material`'s 26 real files
// (`assign_material`/`unassign_material`/`copy_material`) -- a brand-new module (no
// TS port of any kind existed before this chunk), prioritized because 3 separate,
// already-merged chunks (`api.type.assignType`, `api.root.removeProduct`,
// `api.root.copyClass`) each disclosed a real, loud-throw blocker citing this exact
// module. Landing this chunk retroactively unblocks all three call sites (`copyClass`
// only once PR #92, which adds `api.root.copyClass`/`.reassignClass`, actually lands
// -- see `material/index.ts`'s own header comment for the exact per-call-site status).
// Every other `api.material` file (`add_material`/`add_layer`/`add_profile`/
// `add_constituent`/`add_material_set`/every `edit_*`/`remove_*`/etc.) remains future
// work. Namespaced as `api.material.assignMaterial`/`.unassignMaterial`/
// `.copyMaterial` -- see `material/index.ts`'s and each function's own header comment
// for this chunk's exact scope and several disclosed real Python quirks (a dead
// "type -> material set" cache bug relied upon by a real passing Python test, a subtle
// material-vs-type dispatch-order edge case, and an early-`return`-not-`continue`
// representation-patching quirk).
export * as material from "./material";

// Phase 6, `api.style` chunk 1 of 2: 7 of `api.style`'s 13 real files (`add_style`/
// `remove_style`/`remove_surface_style`/`remove_styled_representation`/
// `edit_presentation_style`/`unassign_material_style`/
// `unassign_representation_styles`) -- a brand-new module (no TS port of any kind
// existed before this chunk), prioritized because `api.material.
// setShapeAspectConstituents` (chunk 4 of `api.material`) disclosed a real, loud-throw
// blocker citing this exact module's `assign_item_style` by name. `assign_item_style`
// itself is a chunk 2 file (NOT ported here, alongside `add_surface_style`/
// `edit_surface_style`/`add_surface_textures`/`assign_material_style`/
// `assign_representation_styles`), so that specific blocker remains open until chunk 2
// lands. Namespaced as `api.style.addStyle`/etc. -- see `style/index.ts`'s own header
// comment for this chunk's exact scope, a remaining genuinely-unported dependency
// (`util.element.getShapeAspects`, disclosed in `style/unassignMaterialStyle.ts`'s own
// header comment and `TODOS.md`), and several disclosed real Python quirks/schema
// differences (an unconditional Revit-compatibility `Side = "BOTH"` force, a mutual
// `IfcFillAreaStyle`/`IfcFillAreaStyleHatching` removal recursion, and
// `IfcPresentationStyleAssignment`'s IFC4X3 removal).
export * as style from "./style";

// Phase 6, `api.system` chunk: all 12 `api.system` functions (`add_port`/`add_system`/
// `assign_flow_control`/`assign_port`/`assign_system`/`connect_port`/`disconnect_port`/
// `edit_system`/`remove_system`/`unassign_flow_control`/`unassign_port`/
// `unassign_system`), completing that module -- a brand-new module (no TS port of any
// kind existed before this chunk), prioritized because `../root/copyClass.ts`
// disclosed a real, loud-throw blocker citing this exact module by name
// (`unassignPort`/`.disconnectPort`). Manages `IfcSystem` (via `IfcRelAssignsToGroup`,
// reusing `api.group`) and `IfcDistributionPort` connectivity/flow-control assignment.
// One remaining genuinely-unported dependency, `api.geometry.editObjectPlacement`,
// blocks only `assign_port`'s own placement-relocalization step (thrown only at that
// exact point, never proactively) -- this also means `copyClass.ts`'s own blocker is
// NARROWED (its `api.system` half is resolved), not fully resolved, since it also
// needs `editObjectPlacement`. Namespaced as `api.system.addSystem`/etc. -- see
// `system/index.ts`'s own header comment for this chunk's exact scope and the full
// disclosure of both the `editObjectPlacement` gap and the `copyClass.ts` narrowing.
export * as system from "./system";

// Phase 6, `api.drawing`/`api.control`/`api.pset_template` chunk: THREE small,
// brand-new modules ported together in one chunk (11 real files, ~821 lines total --
// none had any TS port of any kind before this chunk). `api.drawing` (3 files, 223
// lines): associates products/grid axes with annotation objects via
// `IfcRelAssignsToProduct`, plus editing `IfcTextLiteral`. `api.control` (2 files, 174
// lines): assigns/unassigns planning controls/constraints (`IfcControl`) via
// `IfcRelAssignsToControl`. `api.pset_template` (6 files, 424 lines): manages
// `IfcPropertySetTemplate`/`IfcSimplePropertyTemplate` (property set/property
// TEMPLATES, distinct from and a dependency of `api.pset`'s actual property sets;
// effectively IFC4+-only -- see `pset_template/index.ts`'s own header comment). No
// unported dependency of any kind in any of the three (confirmed by reading all 11
// real files -- `api.owner`/`guid`/`util.element`/`util.pset` are each already
// landed). Namespaced as `api.drawing.assignProduct`/etc., `api.control.assignControl`/
// etc., `api.psetTemplate.addPsetTemplate`/etc. (camelCase for the multi-word module
// name) -- see each submodule's own `index.ts` header comment for the full scope and
// several disclosed real Python quirks (a grid-axis rel-multiplication quirk in
// `drawing.assignProduct`/`.unassignProduct`, a silently-discarded
// `primaryMeasureType` for QTO templates in `pset_template.addPropTemplate`, and more).
export * as drawing from "./drawing";
export * as control from "./control";
export * as psetTemplate from "./pset_template";

// Phase 6, `api.nest`/`api.resource` chunk: TWO small, brand-new modules ported
// together in one chunk (16 real files, ~1232 lines total -- neither had any TS port
// of any kind before this chunk). `api.nest` (4 files, 327 lines): manages
// `IfcRelNests` (physical parent/child attachment through a predetermined connection
// point), structurally near-identical to the already-landed `api.aggregate`/
// `api.spatial` containment pair -- ported FIRST in this chunk, since `api.resource`'s
// own `add_resource` depends on it directly. `api.resource` (12 files, 905 lines):
// manages `IfcConstructionResource` (crew/labour/equipment/material/product resources)
// and its quantity/time/usage sub-objects, via `api.nest` (parent/child resource
// hierarchy), `api.project.assignDeclaration` (root-level resource declaration),
// `api.root.createEntity`, `util.constraint`/`util.date`/`util.resource` (all already
// landed). One remaining genuinely-unported dependency: `resource.editResourceTime`'s
// `ScheduleUsage`-with-a-hard-`ScheduleWork`-constraint branch needs
// `api.sequence.calculate_task_duration` -- `api.sequence` (40 files, ~4257 lines) has
// no TS port of any kind and is out of scope for this chunk; a clear, disclosed error
// is thrown only at the exact point that call would happen, never proactively. See
// `nest/index.ts`'s and `resource/index.ts`'s own header comments for the full scope
// and several disclosed real Python quirks/bugs (an unguarded IFC2X3 throw in
// `nest.changeNest`/`.reorderNesting`, `resource.editResourceTime`'s literal
// `"RemainingTime"` typo that should be `"RemainingWork"`, and more).
export * as nest from "./nest";
export * as resource from "./resource";

// Phase 6, `api.structural` chunk: one brand-new module, all 23 real files ported in
// one chunk (1113 lines total -- no TS port of any kind before this chunk). Manages
// analytical properties for structural simulation -- `IfcStructuralAnalysisModel`,
// `IfcStructuralLoadCase`/`IfcStructuralLoadGroup`, `IfcStructuralLoad*`/
// `IfcStructuralActivity` subtypes, `IfcBoundaryCondition` subtypes -- via the
// already-landed `api.group.assignGroup`/`.unassignGroup`, `api.owner.
// createOwnerHistory`, `api.root.createEntity`, `guid`, `util.element.removeDeep2`,
// plus this project's own already-landed `util/shapeBuilder.ts` port of
// `ifcopenshell.util.shape_builder.ifc_safe_vector_type`/`VectorType` (confirmed NOT a
// numpy blocker -- a trivial float-conversion helper). One call site
// (`editStructuralBoundaryCondition`'s `"IfcBoolean"`/generic-measure-class branches)
// is genuinely blocked by the same, already 6-times-confirmed primitive-layer gap
// `TODOS.md` already tracks (`EntityInstance.setByIndex`/`IfcFile.createEntity` can't
// write an initial value into a freshly created simple/defined-type instance) --
// ported completely and faithfully anyway, throwing only at that exact point. Several
// disclosed real Python quirks/bugs ported verbatim (an unreachable `assert False`, an
// unguarded orphan-condition `AppliedCondition` clear, an asymmetric crash-on-unset-
// `Axis` quirk, a missing `if history:` guard) and several confirmed real schema
// divergences (`IfcStructuralLoadCase`/`IfcStructuralPointConnection.
// ConditionCoordinateSystem`/`IfcStructuralCurveMember.Axis` don't exist on IFC2X3 at
// all; `IfcStructuralActivity` subtypes have no `PredefinedType` there either). See
// `structural/index.ts`'s own header comment for the full scope and disclosures.
export * as structural from "./structural";

// Phase 6, `api.cost` chunk: one brand-new module, all 20 real files ported in one
// chunk (~1720 lines total -- no TS port of any kind before this chunk), plus ONE file
// from the otherwise entirely-unported `api.sequence` module (`add_date_time`, a real
// dependency of `cost.addCostSchedule`, ported into a new, deliberately minimal
// `api.sequence` barrel of its own -- see `sequence/index.ts`'s own header comment).
// Manages cost schedules/items/values (`IfcCostSchedule`/`IfcCostItem`/`IfcCostValue`)
// and parametric quantity take-off, via the already-landed `api.control`/`api.nest`/
// `api.root`, `util.cost`/`util.element`/`util.resource`/`util.unit`. The largest and
// most complex file (`assignCostItemQuantity`, 300 lines) uses a small, hand-rolled
// recursive-descent arithmetic-formula parser/evaluator in place of real Python's
// `ast`/`operator` modules -- investigated in full and determined NOT to be a blocker,
// matching `util/cost.ts`'s own established "hand-roll a small grammar rather than
// reach for a library" precedent for a different, unrelated formula mini-language in
// this same API family. See `cost/index.ts`'s own header comment for the full
// dependency confirmation, schema-difference findings, and several disclosed real
// Python quirks/bugs (a copy-paste `source`-vs-`destination` bug in
// `copyCostItemValues`, a throwaway-then-immediately-deleted `IfcRelNests` in
// `copyCostItem`, an intentional-but-non-obvious `CostValues` aliasing in
// `assignCostValue`, and more).
export * as cost from "./cost";
export * as sequence from "./sequence";

// Phase 6, `api.profile` chunk: a brand-new module, all 6 real files ported in one
// chunk (441 lines total -- no TS port of any kind before this chunk). Manages the
// definition of cross-sectional profiles (`IfcProfileDef` subtypes) for structural
// simulation and fabrication/carbon-counting purposes. No unported dependency of any
// kind (`api.pset.removePset`, `util.element.copy`/`copyDeep`/`removeDeep2`,
// `util.unit.calculateUnitScale`, all already landed); the `numpy`/`shape_builder`
// import in `addArbitraryProfile`/`addArbitraryProfileWithVoids` is NOT a blocker
// either (a trivial elementwise scalar division, no real numpy math -- reuses
// `../../util/shapeBuilder.ts`'s already-landed `ifcSafeVectorType`/`V` directly).
// Confirmed real schema divergences (`IfcIndexedPolyCurve`/`IfcCartesianPointList2D`/
// `3D` don't exist on IFC2X3) and one disclosed real Python bug ported verbatim (
// `addArbitraryProfileWithVoids`'s outer curve is never dimension-checked on IFC4+,
// unlike its own inner-profile loop) -- see `profile/index.ts`'s own header comment
// for the full writeup.
export * as profile from "./profile";

// Phase 6, `api.grid` chunk: a brand-new module, all 3 real files ported in one chunk
// (216 lines total -- no TS port of any kind before this chunk). Manages `IfcGrid`'s
// axes (`IfcGridAxis`) -- creating them, giving them curve geometry localized into the
// grid's own coordinate system via real 4x4 matrix math, and removing them. No
// unported dependency of any kind (`util.element.removeDeep2`, `util.placement.
// getLocalPlacement`, `util.unit.calculateUnitScale`, `util.shapeBuilder.V`/
// `ifcSafeVectorType`/`npApplyMatrix`, all already landed); `createAxisCurve`'s
// `np.linalg.inv` reuses the exact `mat4.invert` convention `../geometry/
// editObjectPlacement.ts` already verified, not re-derived. No schema divergence found
// across `IfcGridAxis`/`IfcGrid`/`IfcPolyline`/`IfcCartesianPoint`. One disclosed real
// Python bug ported verbatim (an unguarded `remove_deep2(file, None)` call in
// `remove_grid_axis` when `AxisCurve` was never set) -- see `grid/index.ts`'s own
// header comment for the full writeup.
export * as grid from "./grid";

// Phase 6, `api.boundary` chunk: a brand-new module, all 4 real files ported in one
// chunk (281 lines total -- no TS port of any kind before this chunk). Manages
// `IfcRelSpaceBoundary` -- virtual interfaces between spaces (used for energy
// analysis), optionally including a bounded-plane connection geometry. No unported
// dependency of any kind (`util.element.copy`/`copyDeep`/`removeDeep2`,
// `util.unit.calculateUnitScale`, `util.shapeBuilder.V`/`ifcSafeVectorType`, all
// already landed); `assignConnectionGeometry`'s `numpy`/`shape_builder` import is NOT
// a blocker either (an elementwise scalar division plus a small `np.allclose` ported
// as a local helper -- no matrix/linear-algebra work of any kind, unlike
// `../grid/`/`../geometry/editObjectPlacement.ts`'s own real 4x4 matrix math). No
// schema divergence found for the geometry entities involved; one real,
// per-SUBTYPE (not per-schema) attribute-availability difference confirmed and
// ported verbatim (`ParentBoundary`/`CorrespondingBoundary` don't exist on plain
// `IfcRelSpaceBoundary` on any schema). One confirmed hit of the already-disclosed
// native inverse-index bug (`ConnectionGeometry` nulling in `removeBoundary`),
// worked around via `removeDeep2`'s own `alsoConsider` parameter, verified
// empirically for this specific case. See `boundary/index.ts`'s own header comment
// for the full scope and disclosures.
export * as boundary from "./boundary";

// Phase 6, `api.georeference` chunk: a brand-new module, all 5 real files ported in one
// chunk (489 lines total -- no TS port of any kind before this chunk). Manages
// georeferencing metadata -- an IFC model's coordinate reference system (CRS), map
// conversion, true north, and WCS (World Coordinate System). No unported dependency of
// any kind (`api.pset.addPset`/`.editPset`/`.removePset`, `util.element.getPset`/
// `.removeDeep2`, `util.geolocation.angle2yaxis`, `util.unit.calculateUnitScale`, all
// already landed); `editWcs`'s `numpy`/`shape_builder` import is NOT a blocker either (two
// small `np.isclose`/`np.allclose` tolerance checks and one already-ported `ShapeBuilder`
// method, both duplicated as small per-module private helpers per this project's
// established convention). Confirmed real schema divergences (`IfcProjectedCRS`/
// `IfcCoordinateOperation`/`IfcMapConversion` don't exist on IFC2X3 at all;
// `IfcMapConversionScaled`/`IfcRigidOperation` are IFC4X3-only) and two categories of
// disclosed findings: the ninth/tenth confirmed consequences of the already-disclosed
// `EntityInstance.setByIndex`/`IfcFile.createEntity` primitive-layer gap (blocking
// `addGeoreferencing`'s/`editGeoreferencing`'s IFC2X3 branches and one optional IFC4X3
// `ifcClass` branch -- `editGeoreferencing`'s IFC2X3 branch also carries a real,
// independently-confirmed dead-code Python bug of its own, a computed wrapped value that
// is silently discarded), and two more confirmed hits of the already-disclosed native
// inverse-index bug (`editTrueNorth`'s "unset true north" branch, `removeGeoreferencing`'s
// `MapUnit` cleanup), each worked around the same established `removeDeep2`-with-
// `alsoConsider` technique. See `georeference/index.ts`'s own header comment for the full
// scope and disclosures.
export * as georeference from "./georeference";
