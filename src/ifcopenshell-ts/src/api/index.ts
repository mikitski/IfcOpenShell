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
