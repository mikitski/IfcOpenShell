// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.grid` (src/ifcopenshell-python's `ifcopenshell/api/grid/`
// package) -- a brand-new module, all 3 real files ported in one chunk (216 lines
// total, no TS port of any kind before this chunk). Manages `IfcGrid`'s axes
// (`IfcGridAxis`): creating them, giving them curve geometry (localized into the
// grid's own coordinate system via real 4x4 matrix math), and removing them.
//
// No unported dependency of any kind -- confirmed by reading every real file's own
// imports: `util.element.removeDeep2`, `util.placement.getLocalPlacement`,
// `util.unit.calculateUnitScale`, `util.shapeBuilder.V`/`ifcSafeVectorType`/
// `npApplyMatrix`, all already landed (the last three already reused by
// `../profile/`/`../structural/`; `npApplyMatrix` in particular is an existing,
// general-purpose `vec3.transformMat4`-based helper, not something this chunk had to
// add). `create_axis_curve.py`'s `np.linalg.inv(get_local_placement(...))` reuses the
// exact `mat4.invert` convention `../geometry/editObjectPlacement.ts` already verified
// (empirically, against both a disposable script and numpy directly) -- see
// `createAxisCurve.ts`'s own header comment for the full writeup, not re-derived here.
//
// No schema divergence found: `IfcGridAxis`/`IfcGrid`/`IfcPolyline`/`IfcCartesianPoint`
// are identical in shape/attribute order across `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`
// (confirmed directly; `IfcGrid`'s own `PredefinedType` -- an IFC4+-only addition -- is
// never touched by any function in this module).
//
// One disclosed real Python bug, ported verbatim (this project's established
// discipline) -- see `removeGridAxis.ts`'s own header comment for the full writeup:
// `remove_grid_axis` unconditionally calls `remove_deep2(file, axis.AxisCurve)` with no
// `if axis_curve:` guard, which crashes for an axis whose `AxisCurve` was never set (a
// real, reachable, if unusual, input shape -- never exercised by real Python's own test
// suite either).

export * from "./createAxisCurve";
export * from "./createGridAxis";
export * from "./removeGridAxis";
