// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.profile` (src/ifcopenshell-python's
// `ifcopenshell/api/profile/` package) -- a brand-new module, all 6 real files ported
// in one chunk (441 lines total, no TS port of any kind before this chunk). Manages
// the definition of cross sectional profiles (`IfcProfileDef` subtypes) -- real
// Python's own module docstring: "Maintaining a clean profile library is important
// for structural simulations and identification of standardised profiles for
// fabrication and carbon counting."
//
// No unported dependency of any kind -- confirmed by reading every real file's own
// imports: `api.pset.removePset` (`../pset/removePset.ts`), `util.element.copy`/
// `copyDeep`/`removeDeep2` (`../../util/element.ts`), `util.unit.calculateUnitScale`
// (`../../util/unit.ts`), all already landed. The `numpy`/`ifcopenshell.util.shape_builder`
// import in `add_arbitrary_profile.py`/`add_arbitrary_profile_with_voids.py` is NOT a
// blocker either (verified by reading both real files' source directly, not assumed):
// the only actual numpy operation used anywhere in this module is `co / self.unit_scale`,
// a plain elementwise scalar division of a list of 2D/3D coordinate tuples -- no
// matrix/vector math of any kind. This project already has a direct TS port of
// `ifc_safe_vector_type`/`V` (`../../util/shapeBuilder.ts`'s own `ifcSafeVectorType`/`V`,
// already reused by `../structural/editStructuralConnectionCs.ts`/
// `editStructuralItemAxis.ts` for the identical situation), reused here directly
// rather than reinvented; `convert_si_to_unit` itself is ported as a tiny local
// `convertSiToUnit` helper in each of the two files that need it.
//
// --- Real schema divergences confirmed against the generated `.d.ts`s ---
//
// - `IfcIndexedPolyCurve`/`IfcCartesianPointList2D`/`IfcCartesianPointList3D` don't
//   exist on IFC2X3 at all (IFC4+ additions) -- both `addArbitraryProfile`/
//   `addArbitraryProfileWithVoids` have a real, explicit IFC2X3-vs-IFC4+ branch
//   (`IfcPolyline` of individual `IfcCartesianPoint`s vs. a compact
//   `IfcIndexedPolyCurve` over a single point-list entity), ported faithfully. See
//   each file's own header comment for the full positional-attribute writeup.
// - `IfcProfileDef` has no `HasProperties` inverse attribute usable the same way on
//   IFC2X3 as on IFC4+ -- `removeProfile`/`copyProfile` (via `../pset/removePset.ts`'s
//   own already-disclosed IFC2X3 quirks) both branch on `file.schema === "IFC2X3"`
//   accordingly; see `removeProfile.ts`'s own header comment for the exact
//   `by_type("IfcProfileProperties")`-scan-and-filter vs. direct `HasProperties`
//   inverse-attribute distinction.
//
// --- One disclosed, real Python bug found while reading the exact source lines,
// preserved verbatim (this project's established discipline) ---
//
// `addArbitraryProfileWithVoids`'s outer curve is NEVER dimension-checked on IFC4+ --
// always built as `IfcCartesianPointList3D`, even when the outer profile's own
// coordinates are 2D (unlike this same function's own inner-profile loop three lines
// below, which DOES branch on dimensionality, and unlike `addArbitraryProfile`'s own
// single-profile path, which also does). Confirmed by reading
// `add_arbitrary_profile_with_voids.py:97-101` directly -- this means real Python's
// own docstring example (2D outer-profile coordinates) produces a schema-invalid
// `IfcCartesianPointList3D.CoordList` (2-element rows in a `LIST [3:3]`-typed
// attribute), though `ifcopenshell` doesn't validate this at entity-creation time so
// it doesn't throw. See `addArbitraryProfileWithVoids.ts`'s own header comment for the
// full writeup and a dedicated regression test pinning this exact asymmetry.
//
// Not to be confused with the unrelated, already-landed `../material/removeProfile.ts`
// (Python: `ifcopenshell.api.material.remove_profile`, a completely different
// function operating on `IfcMaterialProfile` set items, not `IfcProfileDef`) -- the
// two are namespaced separately (`api.material.removeProfile` vs.
// `api.profile.removeProfile`), matching real Python's own separate modules.

export * from "./addArbitraryProfile";
export * from "./addArbitraryProfileWithVoids";
export * from "./addParameterizedProfile";
export * from "./copyProfile";
export * from "./editProfile";
export * from "./removeProfile";
