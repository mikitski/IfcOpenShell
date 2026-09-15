// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.pset_template` (src/ifcopenshell-python's `ifcopenshell/
// api/pset_template/` package, 6 real files, 424 lines total) -- a brand-new module (no
// TS port of any kind existed before this chunk), all 6 functions ported in one chunk
// together with the also brand-new `api.drawing`/`api.control` modules -- see the
// sibling `../drawing/index.ts`/`../control/index.ts` for those.
//
// Manages `IfcPropertySetTemplate`/`IfcSimplePropertyTemplate` -- reusable templates
// (project/company/buildingSMART-standard) defining a property set's name,
// applicability, and the properties/quantities it should contain, WITHOUT creating any
// actual property set on any real object. Distinct from (and a dependency of) `api.pset`
// (already partially landed -- see `../pset/index.ts`), which creates/edits actual
// `IfcPropertySet`s using these templates as a guide.
//
// --- Dependencies confirmed already landed (verified by reading each, not assumed) ---
//
// `guid`, `util.element` (`removeDeep2`), `util.pset` (`getPsetTemplateType`, used by
// `addPropTemplate`). No `ifcopenshell.api.owner` import anywhere in this module
// (confirmed by reading all 6 real files) -- see `./addPsetTemplate.ts`'s own header
// comment for the real, verified-deliberate finding that no function in this module
// ever sets `OwnerHistory` at all. No `numpy`/`shape_builder`/`ifcopenshell.geom`
// import anywhere either -- no geometry-kernel blocker.
//
// --- Real, disclosed schema finding: this whole module is effectively IFC4+-only ---
//
// `IfcPropertySetTemplate`/`IfcSimplePropertyTemplate` don't exist on IFC2X3 at all
// (confirmed directly against the generated `.d.ts`s -- absent from `ifc2x3.d.ts`,
// present in both `ifc4.d.ts`/`ifc4x3.d.ts`) -- property set TEMPLATES (as opposed to
// property sets themselves) are an IFC4 addition. Real Python's own test suite for this
// module never runs any test against IFC2X3 either (none of its 3 real test files
// extend an IFC2X3 variant, unlike most other `api.*` test modules) -- consistent with
// this being a genuine IFC4+-only feature, not merely untested on IFC2X3. This port's
// own tests are scoped the same way -- see `test/api/pset_template/*.test.ts`'s own
// header comments.
//
// Real Python's own test suite only covers 3 of these 6 functions directly
// (`edit_prop_template`/`remove_prop_template`/`remove_pset_template`) -- no
// `test_add_pset_template.py`/`test_add_prop_template.py`/`test_edit_pset_template.py`
// exist at all (confirmed by listing `test/api/pset_template/`). This port still adds
// original test coverage for those 3 (matching `test/util/cost.test.ts`'s own
// established precedent for a function Python itself doesn't directly test), written
// directly against each function's own docstring/source rather than a Python fixture.
//
// Namespaced per this project's `util/index.ts` per-submodule convention, as
// `psetTemplate` (camelCase for the multi-word module name, matching this barrel's own
// `export * as psetTemplate from "./pset_template"` line in `../index.ts`):
// `api.psetTemplate.addPsetTemplate`/`.addPropTemplate`/`.editPsetTemplate`/
// `.editPropTemplate`/`.removePsetTemplate`/`.removePropTemplate`.
export { addPropTemplate } from "./addPropTemplate";
export type { AddPropTemplateSettings } from "./addPropTemplate";
export { addPsetTemplate } from "./addPsetTemplate";
export type { AddPsetTemplateSettings } from "./addPsetTemplate";
export { editPropTemplate } from "./editPropTemplate";
export type { EditPropTemplateSettings } from "./editPropTemplate";
export { editPsetTemplate } from "./editPsetTemplate";
export type { EditPsetTemplateSettings } from "./editPsetTemplate";
export { removePropTemplate } from "./removePropTemplate";
export type { RemovePropTemplateSettings } from "./removePropTemplate";
export { removePsetTemplate } from "./removePsetTemplate";
export type { RemovePsetTemplateSettings } from "./removePsetTemplate";
