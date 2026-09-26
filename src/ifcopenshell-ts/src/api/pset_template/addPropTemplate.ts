// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset_template/add_prop_template.py` (src/ifcopenshell-
// python, 116 lines) -- part of this project's `api.pset_template` chunk (see
// `./index.ts`'s own header comment). Adds a new `IfcSimplePropertyTemplate` to an
// existing `IfcPropertySetTemplate`'s `HasPropertyTemplates`.
//
// Uses the already-landed `util.pset.getPsetTemplateType` (`../../util/pset.ts`) to
// infer whether `pset_template` is a property set (`"PSET"`) or quantity set
// (`"QTO"`) template, defaulting to `"PSET"` if that returns `null` (mixed/undefined --
// Python's `get_pset_template_type(pset_template) or "PSET"`).
//
// --- Real, disclosed Python quirk: an explicitly-supplied `primary_measure_type` is
//     silently DISCARDED for a QTO template, even though the parameter itself is
//     never documented as PSET-only ---
//
// Confirmed by reading the real source directly: `primary_measure_type` is a caller-
// supplied parameter with NO qualifying comment about QTO-vs-PSET applicability in the
// signature itself, yet the function body unconditionally overwrites it to `None`
// whenever `assumed_pset_type != "PSET"` (i.e. `"QTO"`) -- `else: primary_measure_type
// = None` -- regardless of whether the caller passed an explicit value. So calling
// `add_prop_template(file, qtoTemplate, primary_measure_type="IfcLengthMeasure")`
// silently produces a property template with `PrimaryMeasureType=None`, not
// `"IfcLengthMeasure"` -- the caller's value is thrown away with no warning. Ported
// verbatim (not "fixed" to only apply the default when `primary_measure_type` is
// `undefined`), matching real Python's own docstring, which does say "doesn't used for
// quantity set templates" for this parameter, but doesn't distinguish "defaulted" from
// "explicitly overridden and discarded".
//
// --- Real Python quirk, ported verbatim: appending mutates via a full re-sort, not a
//     simple append ---
//
// `has_property_templates.append(prop_template); has_property_templates.sort(key=lambda
// pt: pt.Name)` re-sorts the ENTIRE `HasPropertyTemplates` list alphabetically by `Name`
// on every single call, not just inserting the new template in its sorted position --
// behaviorally equivalent to an insertion sort for the common case, but a real, visible
// side effect if `HasPropertyTemplates` was previously in some other explicit order
// (e.g. manually reordered by a caller) -- that ordering is silently discarded. Ported
// via a plain ordinal string comparator (`<`/`>`, matching Python's own default
// code-point string ordering -- not `localeCompare`, which applies locale-aware
// collation rules Python's plain `sort()` does not).
//
// --- No `OwnerHistory` set -- see `./addPsetTemplate.ts`'s own header comment for the
//     identical, verified-deliberate omission (no `ifcopenshell.api.owner` import in
//     the real source at all) ---
//
// `IfcSimplePropertyTemplate`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
// TemplateType(4), PrimaryMeasureType(5), SecondaryMeasureType(6), Enumerators(7),
// PrimaryUnit(8), SecondaryUnit(9), Expression(10), AccessState(11) -- identical order
// in both IFC4/IFC4X3 (confirmed against `ifc4.d.ts`/`ifc4x3.d.ts`; this class doesn't
// exist on IFC2X3 at all -- see `./addPsetTemplate.ts`'s own header comment). Only
// `GlobalId`/`Name`/`Description`/`TemplateType`/`PrimaryMeasureType`/`AccessState` are
// ever populated, matching real Python's own kwargs-only call (`Enumerators` is
// explicitly passed as `None`, which is also this attribute's own default, so it's a
// no-op either way).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as psetUtil from "../../util/pset";
import { wrapUsecase } from "../hooks";

export interface AddPropTemplateSettings {
	/** The `IfcPropertySetTemplate` to add the property template to. */
	psetTemplate: EntityInstance;
	/** The name of the property. Defaults to `"NewProperty"`. */
	name?: string;
	/** A few words describing what the property stores. */
	description?: string | null;
	/**
	 * The type of the property. If not provided, `"P_SINGLEVALUE"` or `"Q_LENGTH"`
	 * will be assumed (depending on the pset type).
	 */
	templateType?: string | null;
	/**
	 * The data type of the property, doesn't used for quantity set templates. Consult
	 * the IFC documentation for the full list of data types.
	 */
	primaryMeasureType?: string | null;
}

function addPropTemplateUsecase(file: IfcFile, settings: AddPropTemplateSettings): EntityInstance {
	const { psetTemplate, description = null } = settings;
	const name = settings.name ?? "NewProperty";

	const assumedPsetType = psetUtil.getPsetTemplateType(psetTemplate) ?? "PSET";

	let templateType = settings.templateType ?? null;
	if (templateType === null) {
		templateType = assumedPsetType === "QTO" ? "Q_LENGTH" : "P_SINGLEVALUE";
	}

	// See this file's header comment: an explicitly-supplied `primaryMeasureType` is
	// silently discarded for a QTO template, matching real Python verbatim.
	let primaryMeasureType = settings.primaryMeasureType ?? null;
	if (assumedPsetType === "PSET") {
		if (primaryMeasureType === null) primaryMeasureType = "IfcLabel";
	} else {
		primaryMeasureType = null;
	}

	// `IfcSimplePropertyTemplate`: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
	// TemplateType(4), PrimaryMeasureType(5), SecondaryMeasureType(6), Enumerators(7),
	// PrimaryUnit(8), SecondaryUnit(9), Expression(10), AccessState(11) -- see this
	// file's header comment.
	const propTemplate = file.createEntity(
		"IfcSimplePropertyTemplate",
		guid.new(),
		null,
		name,
		description,
		templateType,
		primaryMeasureType,
		null,
		null,
		null,
		null,
		null,
		"READWRITE",
	);

	// See this file's header comment: a full re-sort by `Name`, not a simple append.
	const hasPropertyTemplates = [...((psetTemplate.get("HasPropertyTemplates") as EntityInstance[]) ?? [])];
	hasPropertyTemplates.push(propTemplate);
	hasPropertyTemplates.sort((a, b) => {
		const nameA = (a.get("Name") as string | null) ?? "";
		const nameB = (b.get("Name") as string | null) ?? "";
		return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
	});
	psetTemplate.set("HasPropertyTemplates", hasPropertyTemplates);
	return propTemplate;
}

/**
 * Adds new property templates to a property set template (Python:
 * `ifcopenshell.api.pset_template.add_prop_template`).
 *
 * Assuming you first have a property set template, this allows you to add templates
 * for properties within that property set. A property template lets you specify the
 * name, description, and data type of a property. When the template is provided to a
 * model author, this gives them clear instructions about the intention of the property
 * and exactly which data type to use.
 *
 * Types of properties and quantities include:
 *
 * - `P_SINGLEVALUE` - a single value, the most common type of property.
 * - `P_ENUMERATEDVALUE` - the property value may one or more values chosen from a
 *   preset list of values.
 * - `P_BOUNDEDVALUE` - the property has a minimum, maximum, and set value.
 * - `P_LISTVALUE` - the property has a list of values.
 * - `P_TABLEVALUE` - the property has a table of values.
 * - `P_REFERENCEVALUE` - the property is a parametric reference to another value. This
 *   is only for advanced users.
 * - `Q_LENGTH` - the quantity is a length.
 * - `Q_AREA` - the quantity is an area.
 * - `Q_VOLUME` - the quantity is a volume.
 * - `Q_COUNT` - the quantity is counting a item.
 * - `Q_WEIGHT` - the quantity is a weight.
 * - `Q_TIME` - the quantity is a time duration.
 *
 * See this file's own header comment for a real, disclosed Python quirk: an explicit
 * `primaryMeasureType` is silently discarded for a QTO (quantity set) template.
 *
 * @returns The newly created `IfcSimplePropertyTemplate`.
 *
 * @example
 * ```ts
 * // Create a simple template that may be applied to all types
 * const template = api.psetTemplate.addPsetTemplate(model, { name: "ABC_RiskFactors" });
 *
 * // Here's one example property
 * api.psetTemplate.addPropTemplate(model, {
 *   psetTemplate: template,
 *   name: "HighVoltage",
 *   description: "Whether there is a risk of high voltage.",
 *   primaryMeasureType: "IfcBoolean",
 * });
 *
 * // Here's another
 * api.psetTemplate.addPropTemplate(model, {
 *   psetTemplate: template,
 *   name: "ChemicalType",
 *   description: "The class of chemical spillage.",
 *   primaryMeasureType: "IfcLabel",
 * });
 * ```
 */
export const addPropTemplate = wrapUsecase("pset_template.add_prop_template", addPropTemplateUsecase);
