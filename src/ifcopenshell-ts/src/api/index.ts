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
