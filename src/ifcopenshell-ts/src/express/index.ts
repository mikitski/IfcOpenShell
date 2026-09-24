// This file was generated with the assistance of an AI coding tool.
//
// Barrel for the new `express/` directory (mirrors real Python's `ifcopenshell.express`
// package location, not any single file in it -- see `runtimeShim.ts`'s own header
// comment for why). Flattened (`export *`) rather than namespaced per-file
// (`export * as runtimeShim from "./runtimeShim"`), matching how the generated Python
// rules call these helpers bare (`nvl(...)`, `usedin(...)`) in the same module scope
// they're defined in -- Phase EX-2/EX-4's own `express/rules/*.ts` files (not yet
// ported) are expected to import from here the same way.
export * from "./runtimeShim";

// Phase EX-2, first chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the
// schema-scoped `calc_*` DERIVE dispatch mechanism (`dispatch.ts`) `entityInstance.ts`'s
// `.get()` now calls, re-exported here for the same reason `runtimeShim.ts`'s own
// helpers are (direct access for tests/advanced callers, e.g. `express.
// resolveDerivedAttribute(...)`). `./rules` (the per-schema `calc_*` registrations,
// starting with `./rules/ifc2x3`) is side-effect-only -- imported here too (in addition
// to `entityInstance.ts`'s own direct side-effect import) purely so anyone importing
// this package's top-level `express` namespace also gets every ported schema's
// functions registered, without depending on import order between the two.
export * from "./dispatch";
import "./rules";

// Phase EX-4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md): the WHERE-
// rule registry (`ruleDispatch.ts`) and 3-phase execution engine (`ruleExecutor.ts`),
// re-exported here for the same reason `dispatch.ts`/`runtimeShim.ts` are above --
// direct access for tests/advanced callers. `./whereRules` (the per-schema WHERE-rule
// registrations, starting with `./whereRules/ifc2x3`) is side-effect-only, imported
// here too (in addition to whatever future orchestrator eventually imports it directly)
// so anyone importing this package's top-level `express` namespace also gets every
// ported schema's WHERE-rules registered, without depending on import order.
export * from "./ruleDispatch";
export * from "./ruleExecutor";
import "./whereRules";
