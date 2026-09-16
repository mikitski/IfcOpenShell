// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.boundary` (src/ifcopenshell-python's
// `ifcopenshell/api/boundary/` package) -- a brand-new module, all 4 real files ported
// in one chunk (281 lines total, no TS port of any kind before this chunk). Boundaries
// (`IfcRelSpaceBoundary`) are primarily used for representing virtual interfaces
// between spaces for energy analysis; they may be associated with spaces or physical
// elements that enclose spaces such as walls, doors, and windows.
//
// No unported dependency of any kind -- confirmed by reading every real file's own
// imports: `util.element.copy`/`copyDeep`/`removeDeep2` and `util.unit.calculateUnitScale`
// (both already landed), plus `util.shape_builder`'s `V`/`ifc_safe_vector_type`
// (`../../util/shapeBuilder.ts`, already landed and already reused by
// `../profile/`/`../structural/`/`../grid/` for the identical "elementwise scalar
// division, not a numpy blocker" situation -- see `assignConnectionGeometry.ts`'s own
// header comment for the full confirmation, including its one additional real numpy
// call, `np.allclose`, ported as a small local helper).
//
// No schema divergence found for `IfcCurveBoundedPlane`/`IfcConnectionSurfaceGeometry`/
// `IfcPlane`/`IfcAxis2Placement3D`/`IfcPolyline`/`IfcCartesianPoint`/`IfcDirection`
// (identical shape/attribute order across `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`,
// confirmed directly). One real, per-SUBTYPE (not per-schema) attribute-availability
// difference confirmed and ported verbatim via `hasattr`-equivalent guards: plain
// `IfcRelSpaceBoundary` has neither `ParentBoundary` nor `CorrespondingBoundary` on ANY
// of the 3 schemas -- both only exist on the IFC4+-only subtypes
// `IfcRelSpaceBoundary1stLevel`/`IfcRelSpaceBoundary2ndLevel` -- see `editAttributes.ts`'s
// own header comment for the full writeup.
//
// One confirmed hit of this project's already-disclosed native inverse-index bug
// (`TODOS.md`'s "clearing an entity/aggregate-of-entity attribute to null via .set()
// leaves a stale inverse-index entry"), worked around the exact same
// `removeDeep2`-with-`alsoConsider` way `../resource/removeResourceQuantity.ts`/
// `../geometry/editObjectPlacement.ts`/`../root/removeProduct.ts` already do for their
// own structurally-identical cases -- verified EMPIRICALLY against this worktree's own
// built native addon for this specific case, not assumed to carry over unmodified; see
// `removeBoundary.ts`'s own header comment for the full writeup and verification.

export * from "./assignConnectionGeometry";
export * from "./copyBoundary";
export * from "./editAttributes";
export * from "./removeBoundary";
