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
