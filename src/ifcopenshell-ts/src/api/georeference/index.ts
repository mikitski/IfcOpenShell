// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.georeference` (src/ifcopenshell-python's
// `ifcopenshell/api/georeference/` package) -- a brand-new module, all 5 real files
// ported in one chunk (489 lines total -- no TS port of any kind before this chunk).
// Manages georeferencing metadata: an IFC model's geometry may have a coordinate
// reference system (CRS) assigned to it, and may optionally have a map conversion
// defined to transform to and from map coordinates and project local engineering
// coordinates, plus true north (a reference direction for solar analysis, distinct from
// georeferencing itself) and the WCS (World Coordinate System) translation/rotation.
//
// No unported dependency of any kind -- confirmed by reading every real file's own
// imports: `api.pset` (`add_pset`/`edit_pset`/`remove_pset`, all already landed),
// `util.element` (`get_pset`/`remove_deep2`, already landed), `util.geolocation`
// (`angle2yaxis`, already landed -- reused directly, no re-derivation of its trig),
// `util.unit` (`calculate_unit_scale`, already landed). `edit_wcs.py`'s `numpy`/
// `shape_builder` import is NOT a blocker either (confirmed by reading the file in
// full): two simple `np.isclose`/`np.allclose` tolerance checks (ported as a small
// local `allClose` helper, the same numpy-default-tolerance formula this project's
// established per-module-private-helper convention already uses in
// `../boundary/assignConnectionGeometry.ts`) and one `ShapeBuilder` method
// (`create_axis2_placement_3d`, already ported once as a small local helper in
// `../geometry/editObjectPlacement.ts`'s own `createAxis2Placement3d` -- duplicated here
// verbatim per that same convention, not imported).
//
// --- Real, disclosed, CONFIRMED-BY-READING schema divergences ---
//
// `IfcProjectedCRS`/`IfcCoordinateOperation`/`IfcMapConversion` don't exist on IFC2X3 at
// all (confirmed directly against `ifc2x3.d.ts` -- none of the three interfaces exist
// there) -- real Python's own `add_georeferencing`/`edit_georeferencing`/
// `remove_georeferencing` all have a dedicated IFC2X3 branch storing the equivalent data
// as `ePSet_ProjectedCRS`/`ePSet_MapConversion` psets on the `IfcProject` instead, ported
// faithfully. `IfcMapConversionScaled`/`IfcRigidOperation` (both optional `ifc_class`
// values for `add_georeferencing`) are IFC4X3-only -- the same finding
// `util/geolocation.ts`'s own header comment already independently made for
// `getHelmertTransformationParameters`'s reader-side counterpart of these two classes.
// `IfcGeometricRepresentationContext.TrueNorth`/`.WorldCoordinateSystem`/
// `.CoordinateSpaceDimension`, `IfcAxis2Placement3D`/`IfcAxis2Placement2D`,
// `IfcCartesianPoint`/`IfcDirection` are all identical in shape across
// `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` -- `edit_true_north`/`edit_wcs` run unmodified
// against every schema, with no IFC2X3-specific branching of their own.
//
// --- The ninth (and tenth) documented consequences of the already-disclosed
// `EntityInstance.setByIndex`/`IfcFile.createEntity` "cannot write an initial value into
// a freshly created simple/defined-type instance" primitive-layer gap (`TODOS.md`) ---
//
// Blocks `add_georeferencing`'s entire IFC2X3 branch (a plain-string `editPset` call,
// immediately followed by three `file.createIfcLengthMeasure(0)`-equivalent calls) and
// its optional `ifc_class: "IfcRigidOperation"` IFC4+ branch (`FirstCoordinate`/
// `SecondCoordinate`); and `edit_georeferencing`'s entire IFC2X3 branch (which ALSO
// carries a real, independently-confirmed dead-code bug of its own -- a computed
// wrapped value is silently discarded, see `./editGeoreferencing.ts`'s own header
// comment). Ported completely and faithfully anyway, per this project's established
// discipline: every code path up to the exact blocked call runs to completion, then
// throws naturally with no proactive guard, matching every other confirmed consequence
// of this same gap across the codebase (`../pset/editPset.ts`,
// `../style/editSurfaceStyle.ts`, `../pset_template/editPropTemplate.ts`,
// `../structural/editStructuralBoundaryCondition.ts`, `../cost/editCostValue.ts`, and
// more -- see `TODOS.md`'s own entry for the full, growing list). See
// `./addGeoreferencing.ts`'s and `./editGeoreferencing.ts`'s own header comments for the
// full writeup of each. Every other function in this module (`edit_true_north`,
// `edit_wcs`, `remove_georeferencing`, and `add_georeferencing`/`edit_georeferencing`'s
// own IFC4+ default paths) is fully functional.
//
// --- Two real, confirmed hits of the already-disclosed native inverse-index bug
// (`TODOS.md`'s "clearing an entity attribute to null via `.set()` leaves a stale
// inverse-index entry"), each worked around the SAME way `../boundary/removeBoundary.ts`/
// `../grid/removeGridAxis.ts`/`../geometry/editObjectPlacement.ts` already do, not a new
// pattern ---
//
// `edit_true_north`'s "unset true north" branch (`context.TrueNorth = None`) and
// `remove_georeferencing`'s `MapUnit` cleanup (`projected_crs.MapUnit = None`) both null
// a single-entity-typed attribute whose old value is then expected to be purged if
// orphaned -- both reordered to call `removeDeep2` with an `alsoConsider` argument
// WHILE the forward reference is still live, sidestepping the disclosed bug entirely.
// See `./editTrueNorth.ts`'s and `./removeGeoreferencing.ts`'s own header comments for
// the full writeup of each. `edit_wcs`'s own `WorldCoordinateSystem` replacement needs no
// such workaround -- it's a direct, non-null entity-to-entity reassignment, the SAME
// bug-free shape `../geometry/editObjectPlacement.ts`'s own header comment already
// verified.

export * from "./addGeoreferencing";
export * from "./editGeoreferencing";
export * from "./editTrueNorth";
export * from "./editWcs";
export * from "./removeGeoreferencing";
