// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset_template/add_pset_template.py` (src/ifcopenshell-
// python, 104 lines) -- part of this project's `api.pset_template` chunk (see
// `./index.ts`'s own header comment). Creates a new `IfcPropertySetTemplate` -- a
// template defining a property set's name, applicable entities, type/occurrence-driven
// behaviour, and (via `./addPropTemplate.ts`) the property templates it should contain.
//
// --- Real, disclosed finding: NO `OwnerHistory` is ever set, unlike almost every other
//     `IfcRoot`-creating usecase in this project ---
//
// Confirmed by reading the real source directly (not assumed): `add_pset_template.py`
// imports only bare `ifcopenshell`/`ifcopenshell.guid` -- no `ifcopenshell.api.owner`
// import at all, and no `OwnerHistory` kwarg in its `file.create_entity(...)` call.
// This is a genuine, deliberate omission in real Python (property set TEMPLATES are
// project/company/standards-body metadata, arguably not "authored" content the same
// way a model element is), not a porting gap -- ported verbatim: `OwnerHistory` is left
// `null` here (index 1, skipped) rather than synthesizing one via `createOwnerHistory`
// the way essentially every sibling `add_*` usecase in this project does. Same
// verified-absent pattern in `./addPropTemplate.ts`.
//
// --- Real, disclosed finding: `IfcPropertySetTemplate` doesn't exist on IFC2X3 at all
//     ---
//
// Confirmed directly against the generated `.d.ts`s, not assumed: `ifc2x3.d.ts` has no
// `IfcPropertySetTemplate`/`IfcSimplePropertyTemplate` interface at all (property set
// TEMPLATES -- as opposed to property sets themselves -- are an IFC4 addition);
// `ifc4.d.ts`/`ifc4x3.d.ts` both do. Real Python's own test suite for this whole module
// (`test/api/pset_template/`) only ever runs against `test.bootstrap.IFC4` -- none of
// its 3 test files extend an IFC2X3 variant the way most other `api.*` test modules do
// -- consistent with this being an IFC4+-only feature with no IFC2X3 fallback of any
// kind, not merely untested. This port's own tests are scoped the same way (see
// `test/api/pset_template/*.test.ts`'s own header comments).
//
// `IfcPropertySetTemplate`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
// TemplateType(4), ApplicableEntity(5), HasPropertyTemplates(6) -- identical order in
// both IFC4/IFC4X3 (confirmed against `ifc4.d.ts`/`ifc4x3.d.ts`). Only `GlobalId`/
// `Name`/`TemplateType`/`ApplicableEntity` are ever populated, matching real Python's
// own kwargs-only call (`OwnerHistory`/`Description`/`HasPropertyTemplates` all left
// unset).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";

export interface AddPsetTemplateSettings {
	/** The name of the property set. Defaults to `"New_Pset"`. */
	name?: string;
	/**
	 * Choose from one of `PSET_TYPEDRIVENONLY`, `PSET_TYPEDRIVENOVERRIDE`,
	 * `PSET_OCCURRENCEDRIVEN`, `PSET_PERFORMANCEDRIVEN`, `QTO_TYPEDRIVENONLY`,
	 * `QTO_TYPEDRIVENOVERRIDE`, `QTO_OCCURRENCEDRIVEN`, `NOTDEFINED`. Defaults to
	 * `"PSET_TYPEDRIVENOVERRIDE"`.
	 */
	templateType?: string;
	/**
	 * The entity that this template is allowed to be applied to. For example,
	 * `"IfcWall"` means that the property set may be assigned to walls only.
	 * `"IfcTypeObject"`, the default, means that the property set may be assigned to
	 * any type.
	 */
	applicableEntity?: string;
}

function addPsetTemplateUsecase(file: IfcFile, settings: AddPsetTemplateSettings = {}): EntityInstance {
	const name = settings.name ?? "New_Pset";
	const templateType = settings.templateType ?? "PSET_TYPEDRIVENOVERRIDE";
	const applicableEntity = settings.applicableEntity ?? "IfcObject,IfcTypeObject";

	// `IfcPropertySetTemplate`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
	// TemplateType(4), ApplicableEntity(5) -- see this file's header comment.
	return file.createEntity("IfcPropertySetTemplate", guid.new(), null, name, null, templateType, applicableEntity);
}

/**
 * Adds a new property set template (Python:
 * `ifcopenshell.api.pset_template.add_pset_template`).
 *
 * This creates a new template for property sets. A template defines what the name of
 * the property set should be, what properties it can have, what entities (e.g. wall)
 * the property set can be assigned to, whether it should be assigned at a type or
 * occurrence level, the data types of the properties, and descriptions of the
 * properties. This template can then be used as a project, company, or local
 * government standard.
 *
 * buildingSMART itself ships a catalogue of property sets using these templates,
 * ensuring that internationally common properties (e.g. fire rating of a wall) are all
 * implemented exactly the same way across all vendors and projects. Naturally, not
 * everything can be standardised internationally, so this allows you to create your
 * own templates.
 *
 * You may either create a property template to store properties, or a quantity
 * template to store quantities. For convenience, we will always call them "property
 * templates" as they are conceptually very similar.
 *
 * This function only creates a template for the property set, not the properties
 * themselves within the property set. At this level, you are allowed to define the
 * name of the property set, whether it is type or occurrence based, and which entities
 * it applies to.
 *
 * See this file's own header comment for two disclosed real Python findings: no
 * `OwnerHistory` is ever set on this template, and `IfcPropertySetTemplate` doesn't
 * exist on IFC2X3 at all.
 *
 * @returns The newly created `IfcPropertySetTemplate`.
 *
 * @example
 * ```ts
 * // Create a simple template that may be applied to all types
 * const template = api.psetTemplate.addPsetTemplate(model, { name: "ABC_RiskFactors" });
 *
 * // Note that we aren't finished yet. Our property set template doesn't have any
 * // properties in it. Let's add a minimum of one property.
 * api.psetTemplate.addPropTemplate(model, {
 *   psetTemplate: template,
 *   name: "HighVoltage",
 *   description: "Whether there is a risk of high voltage.",
 *   primaryMeasureType: "IfcBoolean",
 * });
 * ```
 */
export const addPsetTemplate = wrapUsecase("pset_template.add_pset_template", addPsetTemplateUsecase);
