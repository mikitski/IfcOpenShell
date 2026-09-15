// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/assign_material_style.py` (src/ifcopenshell-python,
// 247 lines, the largest file in this chunk) -- chunk 2 of 2 for `api.style` (see
// `./index.ts`'s own header comment). One sibling `api.style` dependency,
// `assign_representation_styles` (this same chunk, see `./assignRepresentationStyles
// .ts`), wired up directly below -- no ordering blocker. `ifcopenshell.util.element
// .get_elements_by_material` is already ported (`../../util/element.ts`'s
// `getElementsByMaterial`). The ONE genuinely unported dependency is
// `ifcopenshell.util.element.get_shape_aspects` -- confirmed absent from
// `../../util/element.ts` (that file's own header comment explicitly lists it as out
// of scope) -- the EXACT SAME blocked dependency `./unassignMaterialStyle.ts` (chunk 1)
// already disclosed for its own, symmetric "handle material constituents and shape
// aspects" tail -- see that file's own header comment and the shared `TODOS.md` entry
// (updated in this chunk to cover both call sites).
//
// This is `./unassignMaterialStyle.ts`'s exact inverse (see that file's own header
// comment): assigns a style to every `IfcStyledRepresentation` associated with a
// material (via `IfcMaterialDefinitionRepresentation`) at a given context, creating
// that whole chain from scratch the first time, reusing/updating it on subsequent
// calls, and propagating the assignment to any `IfcShapeAspect`-tagged representation
// item whose aspect name matches a material constituent built from this exact
// material.
//
// --- Real Python's `self.style` mutable field, ported as an explicit, re-assignable
// `effectiveStyle` local threaded through every helper (this project's own
// established convention for a Python `Usecase` class's mutable `self.x` state --
// see `../material/assignMaterial.ts`'s own plain-function-plus-explicit-threading
// precedent, not a re-derivation) ---
//
// `self.style` starts as the caller's raw `style` (`originalStyle`/`settings.style`
// below), OR a freshly-created `IfcPresentationStyleAssignment` wrapping it on IFC2X3
// or when `shouldUsePresentationStyleAssignment` is set (mirroring
// `./assignItemStyle.ts`'s/`./assignRepresentationStyles.ts`'s identical
// Revit-compatibility wrapping) -- then potentially reassigned AGAIN inside
// `create_styled_item`'s reuse branch (see the disclosed bug below). Every downstream
// helper that needs "whichever style object should actually end up referenced" reads
// and returns this value explicitly (`{ item, style }` / `{ representation, style }`
// tuples below) rather than relying on implicit class-instance mutation.
//
// --- Real, disclosed, TEST-CONFIRMED upstream bug: `create_styled_item`'s
// `IfcPresentationStyleAssignment` reuse branch is permanently unreachable, silently
// orphaning the freshly-created assignment AND writing the raw, unwrapped style back
// even on IFC2X3 ---
//
// `create_styled_item(reuse_item=None)` is called from exactly two places: (1)
// `create_styled_representation` (always `reuse_item=None`), and (2)
// `modify_existing_definition_representation`'s own `same_style_items.pop(0)` result --
// which, by construction, is ALWAYS an actual `IfcStyledItem` (`same_style_items` is
// only ever populated from `for item in items: if not item.is_a("IfcStyledItem"):
// continue`, i.e. every candidate is pre-filtered to genuinely be an `IfcStyledItem`).
// So `reuse_item.is_a("IfcPresentationStyleAssignment")` -- checked at the TOP of the
// reuse branch -- is unconditionally `False` for every real call: `IfcStyledItem` and
// `IfcPresentationStyleAssignment` are unrelated EXPRESS classes, never the same
// instance. The guarded `self.file.remove(self.style); self.style = reuse_item` swap
// therefore NEVER executes, and the branch instead always falls through to
// `reuse_item.Styles = (self.settings["style"],)` -- note `self.settings["style"]`,
// the RAW, un-wrapped, original caller-supplied style, NOT `self.style` (which may by
// then be a freshly-created `IfcPresentationStyleAssignment` on IFC2X3/`should_use_...`)
// -- silently orphaning that assignment (never referenced by anything, a real, shipped,
// wasted-but-harmless STEP id) and writing the BARE style directly into a REUSED
// styled item's `Styles`, even on IFC2X3, where `IfcStyledItem.Styles`'s own declared
// type is `IfcPresentationStyleAssignment[]` (confirmed against `ifc2x3.d.ts`) -- so a
// bare `IfcSurfaceStyle` ends up in an attribute typed to only ever hold
// `IfcPresentationStyleAssignment`s. This is CONFIRMED by real Python's own shipped
// test suite, not just static analysis: `test_assign_material_style.py`'s
// `TestAssignMaterialStyleIFC2X3.test_run`'s own SECOND `assign_material_style` call
// (a REUSE -- the same material/context is styled a second time with `style2`) has an
// `else: # IfcPresentationStyleAssignment` comment immediately followed by
// `assert representation.Items[0].Styles == (style2,)` -- asserting the BARE, unwrapped
// `style2`, contradicting its own comment, on IFC2X3, exactly matching this dead-code
// analysis. Ported verbatim below (`createStyledItem`'s reuse branch always writes
// `originalStyle`, never `effectiveStyle`/`assignment`, into the reused item's
// `Styles`) -- not "fixed" to wrap it, since that would silently diverge from real,
// currently-shipped (if buggy) upstream behavior this port's own test suite pins.
//
// --- `has_proposed_style`/`has_same_style_type`, ported using the RAW
// (`settings.style`/`originalStyle`), never the wrapped `effectiveStyle` ---
//
// Both helpers compare against `self.settings["style"]` (never `self.style`) -- the
// caller's own original style object/class, regardless of whatever wrapping
// `effectiveStyle` may carry. `has_proposed_style` additionally unwraps one level of
// `IfcPresentationStyleAssignment` when scanning an existing item's own `Styles` (only
// on non-IFC4X3 schemas, where that class still exists) to catch "already wrapped and
// already correct" as well as "already bare and already correct".
//
// --- `IfcStyledRepresentation.Items: IfcRepresentationItem[]` (not narrowed to
// `IfcStyledItem[]` at the type level -- only a WHERE-rule, per the EXPRESS schema,
// confirmed against `ifc4.d.ts`/`ifc2x3.d.ts`/`ifc4x3.d.ts`), so
// `modify_existing_definition_representation`'s own `if not item.is_a("IfcStyledItem"):
// continue` is a real (if schema-rule-only, not hard-type-enforced) defensive guard,
// not dead code -- ported verbatim: a non-`IfcStyledItem` entry silently drops out of
// `new_items` when `representation.Items` is reassigned at the end, matching real
// Python exactly (this would only matter for a malformed/non-compliant source file).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getElementsByMaterial } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { assignRepresentationStyles } from "./assignRepresentationStyles";

/**
 * `ifcopenshell.util.element.get_shape_aspects` -- has no TS port of any kind (see this
 * file's own header comment and `TODOS.md`). Throws loudly, only when actually
 * reached (a real element using `material` was found) -- never proactively. Identical
 * to `./unassignMaterialStyle.ts`'s own `getShapeAspectsBlocked` (duplicated, not
 * shared, matching this project's own per-module small-helper-duplication precedent
 * elsewhere, e.g. `EntityInstanceIdSet`/`EntityInstanceSet`).
 */
function getShapeAspectsBlocked(element: EntityInstance): never {
	throw new Error(
		`assignMaterialStyle: matching material constituents to shape aspects for element #${element.id()} needs util.element.getShapeAspects, not ported yet -- see TODOS.md.`,
	);
}

/** Real Python: `has_proposed_style` -- always compares against the RAW `originalStyle`, never `effectiveStyle`. */
function hasProposedStyle(file: IfcFile, originalStyle: EntityInstance, styledItem: EntityInstance): boolean {
	const styles = styledItem.get("Styles") as EntityInstance[];
	if (styles.some((s) => s.equals(originalStyle))) return true;
	if (file.schema !== "IFC4X3") {
		// IfcPresentationStyleAssignment is removed in IFC4X3.
		for (const s of styles) {
			if (s.isA("IfcPresentationStyleAssignment")) {
				const inner = s.get("Styles") as EntityInstance[];
				if (inner.some((ss) => ss.equals(originalStyle))) return true;
			}
		}
	}
	return false;
}

/** Real Python: `has_same_style_type` -- always compares against the RAW `originalStyle`'s own class. */
function hasSameStyleType(originalStyle: EntityInstance, styledItem: EntityInstance): boolean {
	const styleClass = originalStyle.isA();
	for (const s of styledItem.get("Styles") as EntityInstance[]) {
		const sClass = s.isA();
		if (sClass === styleClass) return true;
		if (sClass === "IfcPresentationStyleAssignment") {
			for (const ss of s.get("Styles") as EntityInstance[]) {
				if (ss.isA() === styleClass) return true;
			}
		}
	}
	return false;
}

/**
 * Real Python: `create_styled_item`. See this file's own header comment for the
 * disclosed, test-confirmed reuse-branch bug ported verbatim below.
 */
function createStyledItem(
	file: IfcFile,
	originalStyle: EntityInstance,
	effectiveStyle: EntityInstance,
	reuseItem: EntityInstance | null,
): { item: EntityInstance; style: EntityInstance } {
	if (reuseItem === null) {
		const item = file.createEntity("IfcStyledItem", null, [effectiveStyle], originalStyle.get("Name") as string | null);
		return { item, style: effectiveStyle };
	}

	// See this file's own header comment -- permanently unreachable (`reuseItem` is
	// always an `IfcStyledItem`, never an `IfcPresentationStyleAssignment`), ported
	// verbatim rather than removed, matching real Python's own dead branch exactly.
	let style = effectiveStyle;
	if (reuseItem.isA("IfcPresentationStyleAssignment") && style.isA("IfcPresentationStyleAssignment")) {
		file.remove(style);
		style = reuseItem;
	}

	// See this file's own header comment -- `originalStyle` (RAW), not `style`/
	// `effectiveStyle`, matching real Python's own `self.settings["style"]` reference
	// here (the source of the disclosed IFC2X3 bug).
	reuseItem.set("Styles", [originalStyle]);
	reuseItem.set("Name", originalStyle.get("Name"));
	return { item: reuseItem, style };
}

function getStyledRepresentation(
	context: EntityInstance,
	definitionRepresentation: EntityInstance,
): EntityInstance | null {
	const representations = (definitionRepresentation.get("Representations") as EntityInstance[]).filter(
		(r) => r.isA("IfcStyledRepresentation") && (r.get("ContextOfItems") as EntityInstance).equals(context),
	);
	return representations.length > 0 ? representations[0] : null;
}

function createStyledRepresentation(
	file: IfcFile,
	context: EntityInstance,
	originalStyle: EntityInstance,
	effectiveStyle: EntityInstance,
): { representation: EntityInstance; style: EntityInstance } {
	const { item, style } = createStyledItem(file, originalStyle, effectiveStyle, null);
	const representation = file.createEntity(
		"IfcStyledRepresentation",
		context,
		context.get("ContextIdentifier") as string | null,
		null, // RepresentationType
		[item],
	);
	return { representation, style };
}

function createNewDefinitionRepresentation(
	file: IfcFile,
	material: EntityInstance,
	context: EntityInstance,
	originalStyle: EntityInstance,
	effectiveStyle: EntityInstance,
): EntityInstance {
	const { representation, style } = createStyledRepresentation(file, context, originalStyle, effectiveStyle);
	file.createEntity("IfcMaterialDefinitionRepresentation", null, null, [representation], material);
	return style;
}

function modifyExistingDefinitionRepresentation(
	file: IfcFile,
	context: EntityInstance,
	originalStyle: EntityInstance,
	effectiveStyle: EntityInstance,
	definitionRepresentation: EntityInstance,
): EntityInstance {
	const representation = getStyledRepresentation(context, definitionRepresentation);
	if (representation !== null) {
		const items = representation.get("Items") as EntityInstance[];
		const newItems: EntityInstance[] = [];
		const sameStyleItems: EntityInstance[] = [];
		for (const item of items) {
			// See this file's own header comment -- a schema-WHERE-rule-only guard, not
			// dead code (`Items` is typed `IfcRepresentationItem[]`, not narrowed to
			// `IfcStyledItem[]`).
			if (!item.isA("IfcStyledItem")) continue;
			if (hasProposedStyle(file, originalStyle, item)) return effectiveStyle;
			if (hasSameStyleType(originalStyle, item)) {
				sameStyleItems.push(item);
			} else {
				newItems.push(item);
			}
		}
		const itemToReuse = sameStyleItems.length > 0 ? (sameStyleItems.shift() as EntityInstance) : null;
		const { item: newStyledItem, style: updatedStyle } = createStyledItem(
			file,
			originalStyle,
			effectiveStyle,
			itemToReuse,
		);
		newItems.push(newStyledItem);
		representation.set("Items", newItems);
		for (const item of sameStyleItems) {
			if (file.getTotalInverses(item) === 0) {
				file.remove(item);
			}
		}
		return updatedStyle;
	}

	const representations = [...(definitionRepresentation.get("Representations") as EntityInstance[])];
	const { representation: newRepresentation, style: updatedStyle } = createStyledRepresentation(
		file,
		context,
		originalStyle,
		effectiveStyle,
	);
	representations.push(newRepresentation);
	definitionRepresentation.set("Representations", representations);
	return updatedStyle;
}

export interface AssignMaterialStyleSettings {
	/** The `IfcMaterial` which you want to assign the style to. */
	material: EntityInstance;
	/**
	 * The `IfcPresentationStyle` (typically `IfcSurfaceStyle`) that you want to assign to
	 * `material`. This will then be applied to all objects that have that material.
	 */
	style: EntityInstance;
	/**
	 * The `IfcGeometricRepresentationSubContext` at which this style should be used.
	 * Typically this is the Model BODY context.
	 */
	context: EntityInstance;
	/**
	 * This is a technical detail to accommodate a bug in Revit. This should always be
	 * left as the default of `false`, unless you are finding that colours aren't showing
	 * up in Revit. In that case, set it to `true`, but keep in mind that this is no
	 * longer a valid IFC. Blame Autodesk.
	 */
	shouldUsePresentationStyleAssignment?: boolean;
}

function assignMaterialStyleUsecase(file: IfcFile, settings: AssignMaterialStyleSettings): void {
	const { material, context } = settings;
	const originalStyle = settings.style;
	let effectiveStyle = originalStyle;
	if (file.schema === "IFC2X3" || (settings.shouldUsePresentationStyleAssignment ?? false)) {
		effectiveStyle = file.createEntity("IfcPresentationStyleAssignment", [originalStyle]);
	}

	const hasRepresentation = (material.get("HasRepresentation") as EntityInstance[] | null) ?? [];
	if (hasRepresentation.length > 0) {
		effectiveStyle = modifyExistingDefinitionRepresentation(
			file,
			context,
			originalStyle,
			effectiveStyle,
			hasRepresentation[0],
		);
	} else {
		effectiveStyle = createNewDefinitionRepresentation(file, material, context, originalStyle, effectiveStyle);
	}

	// handle material constituents and shape aspects
	const materialConstituentsNames: string[] = [];
	for (const inverse of file.getInverse(material) as Set<EntityInstance>) {
		if (inverse.isA("IfcMaterialConstituent")) {
			const name = inverse.get("Name") as string | null;
			if (name) materialConstituentsNames.push(name);
		}
	}
	if (materialConstituentsNames.length === 0) return;

	const elements = getElementsByMaterial(file, material);
	const shapeAspects: EntityInstance[] = [];
	for (const element of elements) {
		// See this file's own header comment and `TODOS.md`: `util.element.getShapeAspects`
		// has no TS port of any kind yet. `getShapeAspectsBlocked` always throws, so the
		// (unreachable) `shapeAspects.push` below exists only to keep the real Python
		// `shape_aspects += get_shape_aspects(element)` shape visible for a future fix.
		const aspectsForElement: EntityInstance[] = getShapeAspectsBlocked(element);
		shapeAspects.push(...aspectsForElement);
	}

	for (const shapeAspect of shapeAspects) {
		const aspectName = shapeAspect.get("Name") as string | null;
		if (aspectName === null || !materialConstituentsNames.includes(aspectName)) continue;
		for (const rep of shapeAspect.get("ShapeRepresentations") as EntityInstance[]) {
			assignRepresentationStyles(file, { shapeRepresentation: rep, styles: [effectiveStyle] });
		}
	}
}

/**
 * Assigns a style to a material (Python: `ifcopenshell.api.style.assign_material_style`).
 *
 * A style may either be assigned directly to an object's representation, or to a
 * material which is then associated with the object. If both exist, then the style
 * assigned directly to the object's representation takes precedence. It is recommended
 * to use materials and assign styles to materials. This API function provides that
 * capability.
 *
 * See this file's own header comment for a real, disclosed, test-confirmed upstream
 * bug: reusing an existing styled item (a second call assigning a different style to
 * the same material/context) always writes the RAW, unwrapped style directly, even on
 * IFC2X3 (whose `IfcStyledItem.Styles` is otherwise always wrapped in an
 * `IfcPresentationStyleAssignment`), silently orphaning the assignment this function
 * itself just created.
 *
 * **Known gap:** propagating the assignment to shape-aspect-tagged representation
 * items needs `util.element.getShapeAspects`, which has no TS port of any kind yet --
 * this throws only if `material` is used by at least one named material constituent
 * AND at least one element actually uses `material` (see this file's own header
 * comment and `TODOS.md`). The direct material-style assignment (this function's
 * primary behavior) is unaffected and always completes first.
 *
 * @example
 * ```ts
 * const concrete = api.material.addMaterial(model, { name: "CON01", category: "concrete" });
 * const style = api.style.addStyle(model, {});
 * api.style.addSurfaceStyle(model, {
 *   style,
 *   attributes: { SurfaceColour: { Name: null, Red: 0.5, Green: 0.5, Blue: 0.5 }, Transparency: 0.0 },
 * });
 * api.style.assignMaterialStyle(model, { material: concrete, style, context: body });
 * ```
 */
export const assignMaterialStyle = wrapUsecase("style.assign_material_style", assignMaterialStyleUsecase);
