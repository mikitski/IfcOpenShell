// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.cogo` (src/ifcopenshell-python's `ifcopenshell/api/
// cogo/` package) -- a brand-new module, all 4 real files ported in one chunk (246
// lines total, no TS port of any kind before this chunk). "COGO" (coordinate
// geometry) functions are primarily for survey points and control monuments used in
// site layout, parcels, etc. -- see the real package's own `__init__.py` docstring.
//
// None of the 4 functions is registered with `ifcopenshell.api.run`/an internal
// `Usecase` class (confirmed: "cogo" appears nowhere else in `ifcopenshell-python`
// outside this one package -- no caller, no usecase-runner entry) -- all 4 are
// exported here as plain functions, matching real Python's own plain-function shape
// exactly (2 of the 4, `assignSurveyPoint`/`editSurveyPoint`, don't even take a
// `file` parameter).
//
// No unported DEPENDENCY of any kind for any of the 4 files -- every real dependency
// (`util.representation.get_context`, `api.spatial.assign_container`,
// `util.geolocation.dms2dd`) is already landed and reused directly. BUT 2 of the 4
// functions (`addSurveyPoint`, `editSurveyPoint`) ARE blocked at runtime, each by a
// DIFFERENT confirmed consequence of the SAME pre-existing, already-disclosed,
// cross-cutting `entityInstance.ts` gap this chunk doesn't introduce (EXPRESS
// DERIVED-attribute resolution -- `.get()` has no DERIVED-category fallback at all,
// so it unconditionally throws for any derived attribute): `addSurveyPoint` throws
// reading `IfcGeometricRepresentationSubContext.WorldCoordinateSystem` (derived from
// `ParentContext`); `editSurveyPoint` throws reading `IfcCartesianPoint.Dim` (derived
// from `Coordinates`'s own length). Both are ported completely and faithfully anyway,
// confirmed EMPIRICALLY against a locally-built multi-schema native addon, not just
// reasoned about -- see each file's own header comment and the `TODOS.md` entry this
// chunk adds. `assignSurveyPoint`/`bearing2dd` are fully unblocked and functional
// today -- neither touches a DERIVED attribute at all.
//
// --- Schema-availability constraint: this whole module is effectively IFC4X3-only ---
//
// `addSurveyPoint` positionally creates an `IfcAnnotation` with a `PredefinedType`
// ("SURVEY") -- confirmed by reading all 3 generated `.d.ts`s directly that
// `IfcAnnotation.PredefinedType` doesn't exist at all on IFC2X3/IFC4, only gaining
// its 8th attribute on IFC4X3. This is a real SCHEMA constraint (the alignment/cogo
// modules are genuine IFC4X3-era additions), not a TS-port gap -- matching the real
// Python test suite itself, which gates all 3 entity-touching tests
// (`test_add_survey_point`/`test_assign_survey_point`/`test_edit_survey_point`) on
// `IFC4X3_AVAILABLE`. `bearing2dd` is pure string/number math with no schema
// dependency at all, and is tested unconditionally.

export { addSurveyPoint } from "./addSurveyPoint";
export { assignSurveyPoint } from "./assignSurveyPoint";
export { bearing2dd } from "./bearing2dd";
export { editSurveyPoint } from "./editSurveyPoint";
