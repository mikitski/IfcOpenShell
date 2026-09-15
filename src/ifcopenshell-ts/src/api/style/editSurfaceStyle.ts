// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/edit_surface_style.py` (src/ifcopenshell-python, 139
// lines) -- chunk 2 of 2 for `api.style` (see `./index.ts`'s own header comment). No
// sibling `api.style` dependency of any kind -- the only import in the real source is
// bare `ifcopenshell`.
//
// Edits the attributes of a single "presentation item" (`IfcSurfaceStyleShading`/
// `IfcSurfaceStyleRendering`/`IfcSurfaceStyleWithTextures`/`IfcSurfaceStyleLighting`/
// `IfcSurfaceStyleRefraction`/`IfcExternallyDefinedSurfaceStyle`) -- a plain
// attribute-setter loop MOST of the time, except for three schema-driven special
// cases real Python resolves by inspecting the target attribute's own declared
// EXPRESS type at runtime (`style.declaration.all_attributes()`), not by hardcoding a
// fixed attribute-name list (so the same three special-case handlers correctly apply
// across every one of the six presentation-item classes above, whichever of them
// happens to declare a same-shaped attribute).
//
// --- `attribute.declaration.all_attributes()`/`type_of_attribute()` type-name
// resolution, ported via this project's already-established `parameter_type`/
// `named_type`/`aggregation_type` primitives (`util/schema.ts`'s `isEnumMember`
// precedent) ---
//
// Real Python's own `attribute_type.as_aggregation_type() is None` / else-branch
// mirrors exactly what `util/schema.ts`'s `isEnumMember` already does with
// `attribute.type_of_attribute().as_named_type()` -- reused here via the same native
// `parameter_type`/`named_type`/`aggregation_type` classes (`as_named_type`/
// `as_aggregation_type`/`declared_type`/`type_of_element`, all already-bound
// primitives, no new native surface). `resolveAttributeTypeName` below returns `null`
// for an aggregation-typed attribute (real Python stores a non-`str`
// `type_of_element()` `parameter_type` object there instead, which can never equal
// either of the two string constants compared against below -- `null` reproduces that
// "never matches" outcome without carrying around an unused `parameter_type` value)
// and also `null` for an attribute whose `type_of_attribute()` isn't a `named_type` at
// all (not expected to occur for any real presentation-item attribute -- every
// forward attribute on these six classes is either a direct entity reference, a
// defined type, or an aggregation, never a raw inline `simple_type` -- so, matching
// real Python's own unguarded `attribute_type.declared_type()` call here, this is not
// proactively guarded beyond the `null` check).
//
// --- Three special-cased attribute-class handlers, ported verbatim ---
//
// 1. `IfcColourRgb`-typed attributes (e.g. `SurfaceColour`) -- `editColourRgb` always
//    creates-or-reuses a real `IfcColourRgb` entity and OVERWRITES its `Name` from
//    `value.Name ?? null` on every call (never left alone, even when omitted from
//    `value`) -- a real, disclosed ASYMMETRY with `editColourOrFactor` below, which
//    never touches `Name` at all. Ported exactly as written, not "fixed" to match.
// 2. The `SpecularHighlight` key (matched by NAME, not by declared attribute
//    type -- real Python's own `elif key == "SpecularHighlight"`, checked BEFORE the
//    `IfcColourOrFactor` class check that would otherwise apply, since
//    `IfcSpecularHighlightSelect` is not `IfcColourOrFactor`) -- creates a fresh
//    `IfcSpecularExponent`/`IfcSpecularRoughness` from `value.IfcSpecularExponent`/
//    `value.IfcSpecularRoughness` (checked in that order, first truthy wins; **BLOCKED,
//    see below**), `null` clears it (works fine), and -- a real, disclosed quirk -- a
//    `value` object with NEITHER key present (nor `null`) silently changes nothing at
//    all (no `else` branch in real Python either).
// 3. `IfcColourOrFactor`-typed attributes (e.g. `DiffuseColour`/`SpecularColour`) --
//    `editColourOrFactor` accepts either a `{Red,Green,Blue}` dict (reuses an existing
//    `IfcColourRgb` in place via `setByIndex(1|2|3, ...)`, matching real Python's own
//    `attribute[1] = ...` index assignment -- `IfcColourRgb`'s attribute order is
//    `Name`(0)/`Red`(1)/`Green`(2)/`Blue`(3) confirmed identical across all three
//    schemas -- or creates a brand new one only when the existing value is absent or
//    not itself an `IfcColourRgb`, works fine) or a plain number (**BLOCKED, see
//    below**) or `null` (clears it, works fine). An existing real entity value (colour
//    OR factor) with a non-zero id is `file.remove`d before being replaced -- ported
//    via the same `.id()`-truthiness check this project already uses elsewhere for
//    "was this really written as its own STEP record" (see `removeSurfaceStyle.ts`'s
//    own header comment for the identical convention this reuses, not reinvents). This
//    case never touches `Name` at all (see quirk 1 above).
//
// --- BLOCKED: real Python's own `file.create_entity("IfcNormalisedRatioMeasure",
// value)`/`createIfcSpecularExponent(value)`/`createIfcSpecularRoughness(value)` need a
// standalone, real-STEP-id-bearing typed value -- a genuine, already-disclosed
// primitive-layer gap, NOT specific to this file ---
//
// `EntityInstance.setByIndex` (called by both `IfcFile.createEntity(type, ...args)`'s
// own initial-attribute-assignment loop and any later `.set()`/`.setByIndex()` call)
// always calls the native `attribute_kind_of` primitive first, which unconditionally
// throws `"Attribute access is only supported on entity instances"` for ANY non-entity
// (simple/defined-type) target instance -- confirmed empirically against this exact
// worktree's own built native addon: `file.createEntity("IfcLabel", "hello")` throws,
// and even a zero-arg `file.createEntity("IfcNormalisedRatioMeasure")` (which succeeds)
// followed by `.setByIndex(0, 0.5)` throws the identical error -- and that zero-arg
// instance's own `.id()` is `0` regardless, so there is no way to obtain a real,
// addressable id for such a value at all without this gap being fixed first. This is
// the SAME gap `TODOS.md`'s "`EntityInstance.setByIndex`/`IfcFile.createEntity` cannot
// write an initial value into a freshly created simple/defined-type instance" entry
// already tracks (4 prior, independent consequences found across `util.migrator`/
// `util.cost`/`api.owner.addApplication`/`api.pset.editPset` -- this is the 5th). Real
// Python's own equivalent calls "work fine there" (per that entry's own wording) only
// because Python's SWIG binding has no such gate. `editColourOrFactor`'s numeric-value
// branch and `editSpecularHighlight`'s two non-`null` branches below throw a clear,
// loud, descriptive error ONLY at the exact point this would actually be needed --
// `editColourOrFactor` still runs its own real, portable "remove the old real-id value
// first" step to completion before throwing (matching real Python's own order of
// operations: the blocked create-and-assign step is the very last thing that branch
// does); `editSpecularHighlight`'s two blocked branches throw immediately, since real
// Python has no prior mutation in that function to preserve first. See `TODOS.md`'s
// own entry (2026-09-15 update) for the full writeup and this file's own regression
// tests for the current, disclosed, blocked behavior.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type {
	attribute as NativeAttribute,
	parameter_type as NativeParameterType,
} from "../../native/ifcopenshell_native";
import { wrapUsecase } from "../hooks";

/**
 * See this file's own header comment -- resolves an attribute's declared EXPRESS type
 * name (e.g. `"IfcColourRgb"`), or `null` for an aggregation-typed attribute (real
 * Python stores a non-`str` `parameter_type` there instead, which never matches either
 * of the two string constants compared against below) or an attribute whose
 * `type_of_attribute()` isn't itself a `named_type` (not expected to occur here, not
 * proactively guarded beyond this `null` check -- matching real Python's own unguarded
 * `.declared_type()` call).
 */
function resolveAttributeTypeName(paramType: NativeParameterType): string | null {
	if (paramType.as_aggregation_type() !== null) return null;
	const named = paramType.as_named_type();
	return named === null ? null : named.declared_type().name();
}

function buildAttributeTypeNames(style: EntityInstance): Map<string, string | null> {
	const result = new Map<string, string | null>();
	const entityDeclaration = style.declaration().as_entity();
	if (entityDeclaration === null) return result;
	for (const attribute of entityDeclaration.all_attributes() as NativeAttribute[]) {
		result.set(attribute.name(), resolveAttributeTypeName(attribute.type_of_attribute()));
	}
	return result;
}

/** See this file's own header comment, quirk 1 -- always overwrites `Name`, unlike `editColourOrFactor`. */
function editColourRgb(file: IfcFile, style: EntityInstance, name: string, value: Record<string, unknown>): void {
	let colour = style.get(name) as EntityInstance | null;
	if (colour === null) {
		colour = file.createEntity("IfcColourRgb");
		style.set(name, colour);
	}
	colour.set("Name", value.Name ?? null);
	colour.set("Red", value.Red);
	colour.set("Green", value.Green);
	colour.set("Blue", value.Blue);
}

/** See this file's own header comment, quirk 3 -- never touches `Name`. */
function editColourOrFactor(
	file: IfcFile,
	style: EntityInstance,
	name: string,
	value: Record<string, unknown> | number | null,
): void {
	if (value !== null && typeof value === "object") {
		let colour = style.get(name) as EntityInstance | null;
		if (colour === null || !colour.isA("IfcColourRgb")) {
			colour = file.createEntity("IfcColourRgb", null, 0, 0, 0);
			style.set(name, colour);
		}
		colour.setByIndex(1, value.Red);
		colour.setByIndex(2, value.Green);
		colour.setByIndex(3, value.Blue);
		return;
	}

	const existingValue = style.get(name) as EntityInstance | null;
	if (existingValue?.id()) {
		file.remove(existingValue);
	}
	if (value === null) {
		style.set(name, null);
		return;
	}
	// See this file's own header comment ("BLOCKED" section) and TODOS.md -- a real,
	// addressable `IfcNormalisedRatioMeasure(value)` cannot be created by the current
	// primitive layer. The "remove the old real-id value" step above already ran to
	// completion (matching real Python's own order of operations).
	throw new Error(
		`editSurfaceStyle: setting '${name}' to a numeric factor needs a standalone, addressable IfcNormalisedRatioMeasure value, which the current primitive layer cannot create -- see TODOS.md.`,
	);
}

/** See this file's own header comment, quirk 2 -- no `else` branch, matching real Python. */
function editSpecularHighlight(file: IfcFile, style: EntityInstance, value: Record<string, unknown> | null): void {
	if (value === null) {
		style.set("SpecularHighlight", null);
	} else if (value.IfcSpecularExponent) {
		// See this file's own header comment ("BLOCKED" section) and TODOS.md.
		throw new Error(
			"editSurfaceStyle: setting SpecularHighlight to an IfcSpecularExponent needs a standalone, addressable value entity, which the current primitive layer cannot create -- see TODOS.md.",
		);
	} else if (value.IfcSpecularRoughness) {
		// See this file's own header comment ("BLOCKED" section) and TODOS.md.
		throw new Error(
			"editSurfaceStyle: setting SpecularHighlight to an IfcSpecularRoughness needs a standalone, addressable value entity, which the current primitive layer cannot create -- see TODOS.md.",
		);
	}
}

export interface EditSurfaceStyleSettings {
	/**
	 * The `IfcPresentationItem` entity you want to edit -- expected to be one of
	 * `IfcSurfaceStyleShading`, `IfcSurfaceStyleRendering`, `IfcSurfaceStyleWithTextures`,
	 * `IfcSurfaceStyleLighting`, `IfcSurfaceStyleRefraction`, or
	 * `IfcExternallyDefinedSurfaceStyle`.
	 */
	style: EntityInstance;
	/** A dictionary of attribute names and values. To represent a colour, a nested object should be used -- see this file's own header comment / `@example`. */
	attributes: Record<string, unknown>;
}

function editSurfaceStyleUsecase(file: IfcFile, settings: EditSurfaceStyleSettings): void {
	const { style, attributes } = settings;
	const attributeTypes = buildAttributeTypeNames(style);

	for (const [key, value] of Object.entries(attributes)) {
		const attributeClass = attributeTypes.get(key) ?? null;
		if (attributeClass === "IfcColourRgb") {
			editColourRgb(file, style, key, value as Record<string, unknown>);
		} else if (key === "SpecularHighlight") {
			editSpecularHighlight(file, style, value as Record<string, unknown> | null);
		} else if (attributeClass === "IfcColourOrFactor") {
			editColourOrFactor(file, style, key, value as Record<string, unknown> | number | null);
		} else {
			style.set(key, value);
		}
	}
}

/**
 * Edits the attributes of an `IfcPresentationItem` (Python:
 * `ifcopenshell.api.style.edit_surface_style`).
 *
 * For more information about the attributes and data types of an
 * `IfcPresentationItem`, consult the IFC documentation.
 *
 * The `IfcPresentationItem` is expected to be one of `IfcSurfaceStyleShading`,
 * `IfcSurfaceStyleRendering`, `IfcSurfaceStyleWithTextures`, `IfcSurfaceStyleLighting`,
 * `IfcSurfaceStyleRefraction`, or `IfcExternallyDefinedSurfaceStyle`.
 *
 * To represent a colour, a nested object should be used. See the example below.
 *
 * **Known gap:** setting a `IfcColourOrFactor`-typed attribute (e.g. `DiffuseColour`/
 * `SpecularColour`) to a plain NUMBER (a factor, as opposed to a `{Red,Green,Blue}`
 * colour), or setting `SpecularHighlight` to a `{IfcSpecularExponent: ...}`/
 * `{IfcSpecularRoughness: ...}` object, always throws -- both need a standalone,
 * addressable typed value (`IfcNormalisedRatioMeasure`/`IfcSpecularExponent`/
 * `IfcSpecularRoughness`) that the current primitive layer cannot create (see this
 * file's own header comment and `TODOS.md`). Every other attribute shape (a colour
 * dict, a plain scalar for a non-`IfcColourOrFactor` attribute, `null` to clear
 * anything) works correctly today.
 *
 * @example
 * ```ts
 * // Create a new surface style
 * const style = api.style.addStyle(model, {});
 *
 * // Create a blank rendering style (api.style.addSurfaceStyle builds this normally --
 * // built directly here for illustration).
 * const rendering = model.createEntity("IfcSurfaceStyleRendering");
 * style.set("Styles", [rendering]);
 *
 * // Edit the attributes of the rendering style.
 * api.style.editSurfaceStyle(model, {
 *   style: rendering,
 *   attributes: {
 *     SurfaceColour: { Name: null, Red: 1.0, Green: 0.8, Blue: 0.8 },
 *     Transparency: 0.0,
 *     ReflectanceMethod: "NOTDEFINED",
 *     // A colour dict works; a plain number (a factor) currently throws -- see
 *     // "Known gap" above.
 *     DiffuseColour: { Name: null, Red: 0.9, Green: 0.8, Blue: 0.8 },
 *   },
 * });
 * ```
 */
export const editSurfaceStyle = wrapUsecase("style.edit_surface_style", editSurfaceStyleUsecase);
