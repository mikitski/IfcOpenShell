// This file was generated with the assistance of an AI coding tool.
//
// Side-effect-only barrel: statically imports every ported per-schema WHERE-rules
// module purely for its `registerSchemaRules(...)` module-top-level call, mirroring
// `rules/index.ts`'s own identical convention for `calc_*` functions (see that file's
// own header comment, and `ruleDispatch.ts`'s own header comment, for why static
// registration -- not real Python's dynamic `exec()` of generated source text -- is
// this port's schema-scoped substitute). `express/index.ts` imports this module for its
// side effect alone, so that running `executeRules(f)` always has every ported schema's
// WHERE-rules available, regardless of which module a particular caller happened to
// import first.
//
// Additive by design, exactly like `rules/index.ts`: a future chunk porting more of
// IFC2X3's own remaining WHERE-rules adds to `whereRules/ifc2x3.ts` directly, not here;
// a future chunk starting IFC4/IFC4X3 adds `import "./ifc4";`/`import "./ifc4x3";`
// below -- nothing else in this barrel, `ruleDispatch.ts`, or `ruleExecutor.ts` needs to
// change for it.
import "./ifc2x3";
import "./ifc4";
import "./ifc4x3";
