// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.util.*` (src/ifcopenshell-python's `ifcopenshell/util/`
// package) -- mirrors Python's namespace nesting (`ifcopenshell.util.element.get_pset`)
// as `util.element.getPset` here, rather than flattening every util module's exports
// into one top-level namespace. Re-exports accumulate here as later Phase 3+ chunks
// port more `util` modules; `alignment`/`attribute`/`classification`/`constraint`/`cost`/
// `data`/`date`/`doc`/`element`/`file`/`geolocation`/`migrator`/`mvdInfo`/`placement`/
// `pset`/`representation`/`resource`/`schema`/`selector`/`shape`/`shapeBuilder`/`system`/
// `type`/`unit` are ported so far (planning/ifcopenshell-ts/20-roadmap.md Phases 3-4).
// `data` is a single small dataclass (`Clipping`), not a usecase -- see `data.ts`'s own
// header comment.
// `shapeBuilder` is now `util/shape_builder.py` in full (landed across two PRs given its
// unusual size -- see `shapeBuilder.ts`'s own header comment for the split). `alignment`
// ports only `stationAsString` for real -- its other three functions are genuine,
// disclosed hard blockers (thin throwing stubs), see `alignment.ts`'s own header comment.
// `shape` ports only 4 of `util/shape.py`'s 43 functions for real (`isX`/`getProfiles`/
// `getExtrusions`/`getBaseExtrusions`) -- the other 39 are a genuine, disclosed
// `ifcopenshell.geom` (native geometry-kernel) hard blocker, documented as a single named
// gap rather than 39 near-identical throwing stubs, see `shape.ts`'s own header comment
// and `TODOS.md`.
export * as alignment from "./alignment";
export * as attribute from "./attribute";
export * as classification from "./classification";
export * as constraint from "./constraint";
export * as cost from "./cost";
export * as data from "./data";
export * as date from "./date";
export * as doc from "./doc";
export * as element from "./element";
export * as file from "./file";
export * as geolocation from "./geolocation";
export * as migrator from "./migrator";
export * as mvdInfo from "./mvdInfo";
export * as placement from "./placement";
export * as pset from "./pset";
export * as representation from "./representation";
export * as resource from "./resource";
export * as schema from "./schema";
export * as selector from "./selector";
export * as shape from "./shape";
export * as shapeBuilder from "./shapeBuilder";
export * as system from "./system";
export * as type from "./type";
export * as unit from "./unit";
