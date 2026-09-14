// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/root/reassign_class.py` (src/ifcopenshell-python, 236
// lines) -- one of `api.root`'s last 2 remaining real functions (`copy_class` is the
// other, see `./copyClass.ts`), completing `api.root` (Phase 6). Changes the IFC class
// of an existing product (e.g. a wall reclassified as a column) while retaining
// geometry/relationships.
//
// --- Two distinct code paths, dispatched on "did `IfcTypeProduct`-ness change" ---
//
// `execute` mirrors real Python exactly: `was_type_product_before = product.is_a
// ("IfcTypeProduct")`, `is_type_product_after = <declaration-for-ifc_class>._is
// ("IfcTypeProduct")` (using `util/schema.ts`'s own already-landed `isA` free function
// against a declaration looked up BY NAME via the same `declaration_by_name_with_name`
// native call `util/schema.ts`'s own `reassignClass` already uses -- not by instance,
// since `ifc_class` is a bare string that may not correspond to any existing entity).
// If both booleans agree ("simple" reassignment, e.g. `IfcWindow` -> `IfcWall`, or
// `IfcWindowType` -> `IfcWallType`), `simpleReassignment` handles it; otherwise
// (switching between an occurrence class and a type class, e.g. `IfcWindowType` ->
// `IfcWindow`), the considerably more involved `switchBetweenClassTypes` does.
//
// --- `simpleReassignment`: fully portable, no blocked dependency at all ---
//
// Every dependency this path needs (`util/schema.ts`'s `reassignClass`, `util/type.ts`'s
// `getApplicableEntities`/`getApplicableTypes`, `util/element.ts`'s `getTypes`/
// `getType`) is already fully landed -- confirmed directly, not assumed from the import
// list (per this chunk's own task brief, which flagged that most of this function's
// real API-level dependencies are now landed). If reassigning a TYPE, every occurrence
// of that type also has its class reassigned (via `occurrence_class`, explicit or
// auto-derived from `util.type.getApplicableEntities`) to keep the file schema-valid --
// real Python's own docstring: "if you are reassigning a type, the occurrence classes
// are also reassigned to maintain validity." Vice versa for an occurrence with a type.
//
// **Disclosed, deliberate divergence from Python's own error shape**: Python's
// `next(iter(get_applicable_entities(...)))`/`next(iter(get_applicable_types(...)))`
// raise a bare `StopIteration` if the returned list is empty (an unhandled, fairly
// unfriendly exception in real Python too -- not a case real Python guards against
// either). This port throws a descriptive `Error` instead of attempting to reproduce
// `StopIteration` (which has no real TS/JS equivalent, matching this project's
// established "no narrower exception-type fidelity than JS actually offers" precedent,
// e.g. `createEntity.ts`'s own header comment on the bare-`except:` mechanism) -- not a
// behavior-changing fix (both are unhandled errors for a genuinely unreachable-in-
// practice input; every real schema class this could be called with has at least one
// applicable occurrence/type class).
//
// --- `switchBetweenClassTypes`: mostly portable, ONE real, disclosed blocker ---
//
// Real Python's flow: (1) unassign every one of `element`'s representations (fully
// portable -- `api.geometry.unassignRepresentation`, already landed); (2) do the actual
// type<->occurrence unwiring/reassignment (fully portable -- `api.type.unassignType`,
// `api.spatial.unassignContainer`, `api.aggregate.unassignObject`, `api.pset
// .unassignPset`, all already landed); (3) reassign the same psets back (`api.pset
// .assignPset`, already landed); (4) reassign the SAME representations back onto the
// now-reclassified element, via `ifcopenshell.api.geometry.assign_representation` --
// **not ported, `api.geometry` still only has `unassignRepresentation`/
// `removeRepresentation` landed** (see `TODOS.md`'s existing "`api.type.assignType`/
// `mapTypeRepresentations` skip representation mapping" entry, extended below rather
// than duplicated); (5), only for a type-to-occurrence switch with representations,
// `ifcopenshell.api.geometry.edit_object_placement` (also unported, `TODOS.md`'s
// pre-existing entry).
//
// Since step (4) unconditionally needs the blocked `assignRepresentation` call for
// EVERY element in `representations` (a non-empty list guarantees the blocked call is
// reached), and doing steps (1)-(3) first would leave the element with its
// representations stripped, its type/container/aggregate/psets unwired, and NO way to
// restore any of it (a strictly worse, silently broken half-state than refusing the
// call outright) -- this port checks `representations.length > 0` immediately after
// building that list and throws right there, matching this project's now well-worn
// "throw before mutating, don't leave a worse partial state" discipline (see
// `../type/mapTypeRepresentations.ts`'s own header comment, and `../root/removeProduct
// .ts`'s `HasOpenings`/`IfcGrid` checks for the identical "check the condition, throw
// immediately, no partial work" shape). An element/type with NO representations at all
// hits none of this and completes the full occurrence<->type switch correctly and
// independently -- confirmed by re-reading every remaining line of `switch_between_class
// _types` once representations is empty: every other call it makes is to an
// already-landed function.
//
// --- The `Usecase.reassign_class` helper (this file's own private `reassignClassAttrs`,
// NOT the same as this file's own exported `reassignClass`) ---
//
// A thin wrapper around `util/schema.ts`'s own `reassignClass` (which does the actual
// STEP-id-preserving class swap and inverse rewiring) plus the same
// `PredefinedType`/`USERDEFINED`/`ElementType`-or-`ObjectType` fallback dance
// `../root/createEntity.ts`'s own `handle2x3Defaults`-adjacent logic already
// established -- ported here as its own small local helper (not shared/exported)
// since `create_entity.py`'s own version operates on a freshly-created blank element,
// this one on an already-populated one being reclassified; the two Python functions
// keep separate, near-identical copies too, not a shared helper.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import * as representationUtil from "../../util/representation";
import * as schemaUtil from "../../util/schema";
import * as typeUtil from "../../util/type";
import { unassignObject } from "../aggregate/unassignObject";
import { wrapUsecase } from "../hooks";
import { assignPset } from "../pset/assignPset";
import { unassignPset } from "../pset/unassignPset";
import { unassignContainer } from "../spatial/unassignContainer";
import { unassignType } from "../type/unassignType";

/** Python's `hasattr(element, "PredefinedType")` -- see `../root/createEntity.ts`'s identical `hasAttribute` helper's own doc comment for why this is duplicated per-module rather than shared. */
function hasAttribute(element: EntityInstance, name: string): boolean {
	try {
		element.get(name);
		return true;
	} catch {
		return false;
	}
}

export interface ReassignClassSettings {
	/** The `IfcProduct`/`IfcTypeProduct` (or any other rooted element) to change the class of. */
	product: EntityInstance;
	/** The new IFC class to change it to. Python default: `"IfcBuildingElementProxy"`. */
	ifcClass?: string;
	/**
	 * In case you want to change the predefined type too. User-defined types are also
	 * allowed, just type what you want.
	 */
	predefinedType?: string | null;
	/**
	 * IFC class to assign to occurrences in case the provided `ifcClass` is an
	 * `IfcTypeProduct`. If omitted, the class is deduced automatically from the type.
	 * Only really needed in IFC2X3, since in IFC4+ there's no ambiguity on what class
	 * to assign to occurrences.
	 */
	occurrenceClass?: string | null;
}

/** Python: `Usecase.reassign_class(element, ifc_class, predefined_type)`. See this file's own header comment for why this is NOT the same function as this file's own exported `reassignClass`. */
function reassignClassAttrs(
	file: IfcFile,
	element: EntityInstance,
	ifcClass: string,
	predefinedType: string | null,
): EntityInstance {
	const result = schemaUtil.reassignClass(file, element, ifcClass);
	if (predefinedType && hasAttribute(result, "PredefinedType")) {
		try {
			result.set("PredefinedType", predefinedType);
		} catch {
			// PredefinedType wasn't in the respective enum, assume it's actually USERDEFINED
			// and set .ElementType / .ObjectType to the provided predefined type.
			result.set("PredefinedType", "USERDEFINED");
			if (result.isA("IfcTypeProduct")) {
				result.set("ElementType", predefinedType);
			} else {
				result.set("ObjectType", predefinedType);
			}
		}
	}
	return result;
}

/** Whether `ifcClass` (a bare class name, not an instance) is a subtype of `IfcTypeProduct` in `file`'s schema. */
function isTypeProductClass(file: IfcFile, ifcClass: string): boolean {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(ifcClass);
	return schemaUtil.isA(declaration, "IfcTypeProduct");
}

/**
 * Python: `Usecase.simple_reassignment(element, ifc_class, predefined_type)`.
 *
 * Simple class reassignment doesn't involve changing class type. E.g. `IfcWindow`
 * (`IfcProduct` class) -> `IfcWall` (other `IfcProduct` class). Changing class type
 * (e.g. `IfcWindowType` -> `IfcWindow`) is more complex, see `switchBetweenClassTypes`.
 *
 * Fully portable -- see this file's own header comment.
 */
function simpleReassignment(
	file: IfcFile,
	originalElement: EntityInstance,
	ifcClass: string,
	predefinedType: string | null,
	occurrenceClassSetting: string | null,
): EntityInstance {
	const element = reassignClassAttrs(file, originalElement, ifcClass, predefinedType);

	if (element.isA("IfcTypeProduct")) {
		let occurrenceClass: string;
		if (occurrenceClassSetting) {
			occurrenceClass = occurrenceClassSetting;
		} else {
			// NOTE (Python's own comment, ported verbatim): in theory we can skip
			// reassignment in IFC2X3 in some cases -- e.g. if occurrence is IfcRoof and
			// we're reassigning to IfcBuildingElementProxyType -- but currently
			// type_to_entity_map doesn't completely match entity_to_type_map, see type.ts
			// for more details.
			const applicable = typeUtil.getApplicableEntities(ifcClass, file.schema);
			// See this file's own header comment -- Python's `next(iter([]))` raises a
			// bare `StopIteration` here; this throws a descriptive `Error` instead.
			if (applicable.length === 0) {
				throw new Error(
					`reassignClass: no applicable occurrence class found for type class '${ifcClass}' in schema ${file.schema}.`,
				);
			}
			occurrenceClass = applicable[0] as string;
		}
		if (isTypeProductClass(file, occurrenceClass)) {
			throw new Error(
				`reassignClass: Unexpected occurrence_class: '${occurrenceClass}' / '${occurrenceClassSetting}'.`,
			);
		}

		for (const occurrence of elementUtil.getTypes(element)) {
			reassignClassAttrs(file, occurrence, occurrenceClass, predefinedType);
		}
	} else {
		const elementType = elementUtil.getType(element);
		if (elementType) {
			const applicableTypes = typeUtil.getApplicableTypes(ifcClass, file.schema);
			if (applicableTypes.length === 0) {
				throw new Error(
					`reassignClass: no applicable type class found for occurrence class '${ifcClass}' in schema ${file.schema}.`,
				);
			}
			const newType = reassignClassAttrs(file, elementType, applicableTypes[0] as string, predefinedType);
			const newIfcClass = element.isA();
			for (const occurrence of elementUtil.getTypes(newType)) {
				if (occurrence.equals(element)) continue;
				reassignClassAttrs(file, occurrence, newIfcClass, predefinedType);
			}
		}
	}
	return element;
}

/**
 * Python: `Usecase.switch_between_class_types(element, switch_type, ifc_class,
 * predefined_type)`. See this file's own header comment for the full disclosure of the
 * one real, disclosed blocker this path has.
 */
function switchBetweenClassTypes(
	file: IfcFile,
	originalElement: EntityInstance,
	switchType: "occurrence_to_type" | "type_to_occurrence",
	ifcClass: string,
	predefinedType: string | null,
): EntityInstance {
	let psetsToReassign: EntityInstance[] = [];

	const representations = representationUtil.getRepresentationsIter(originalElement);

	// See this file's own header comment ("throw before mutating") -- the "reassign
	// representations" loop below unconditionally needs the still-unported
	// `api.geometry.assignRepresentation` for every entry in a non-empty
	// `representations`, so this is checked -- and thrown -- BEFORE any of this
	// function's own mutations (unassigning the representations, unwiring/rewiring the
	// type/container/aggregate/psets), rather than after, to avoid leaving `originalElement`
	// in a silently worse half-switched state than refusing the call outright.
	if (representations.length > 0) {
		throw new Error(
			`reassignClass: switching ${originalElement.isA()}#${originalElement.id()} between occurrence/type classes needs to re-assign ${representations.length} representation(s) via api.geometry.assignRepresentation (and, for a type-to-occurrence switch, api.geometry.editObjectPlacement) -- neither is ported yet, see TODOS.md. Unassign the representation(s) first (api.geometry.unassignRepresentation) if you don't need them preserved across the switch.`,
		);
	}

	let element: EntityInstance;
	if (switchType === "type_to_occurrence") {
		const occurrences = elementUtil.getTypes(originalElement);
		// Don't need to reassign as psets are linked to type directly, without rel.
		psetsToReassign = (originalElement.get("HasPropertySets") as EntityInstance[] | null) ?? [];

		element = reassignClassAttrs(file, originalElement, ifcClass, predefinedType);
		unassignType(file, { relatedObjects: occurrences });
	} else {
		// occurrence_to_type
		const elementType = elementUtil.getType(originalElement);
		if (elementType) {
			unassignType(file, { relatedObjects: [originalElement] });
		}

		// Handle containers and aggregates.
		if (elementUtil.getContainer(originalElement)) {
			unassignContainer(file, { products: [originalElement] });
		} else if (elementUtil.getAggregate(originalElement)) {
			unassignObject(file, { products: [originalElement] });
		}

		const psets = elementUtil.getPsets(originalElement);
		for (const psetName of Object.keys(psets)) {
			const pset = file.byId(psets[psetName]?.id as number);
			psetsToReassign.push(pset);
			unassignPset(file, { products: [originalElement], pset });
		}

		element = reassignClassAttrs(file, originalElement, ifcClass, predefinedType);
	}

	// Reassign psets.
	for (const pset of psetsToReassign) {
		assignPset(file, { products: [element], pset });
	}

	// Real Python's remaining 2 steps here -- "reassign representations" (`for rep in
	// representations: ifcopenshell.api.geometry.assign_representation(...)`) and,
	// for a type-to-occurrence switch, `ifcopenshell.api.geometry.edit_object_placement`
	// -- are both unreachable at this point: `representations` is always `[]` here, the
	// throw above already returned for any non-empty case. Omitted rather than kept as
	// literal dead code referencing a function this file doesn't otherwise need to
	// import.

	return element;
}

function reassignClassUsecase(file: IfcFile, settings: ReassignClassSettings): EntityInstance {
	const product = settings.product;
	const ifcClass = settings.ifcClass ?? "IfcBuildingElementProxy";
	const predefinedType = settings.predefinedType ?? null;
	const occurrenceClass = settings.occurrenceClass ?? null;

	const wasTypeProductBefore = product.isA("IfcTypeProduct");
	const isTypeProductAfter = isTypeProductClass(file, ifcClass);

	if (wasTypeProductBefore === isTypeProductAfter) {
		return simpleReassignment(file, product, ifcClass, predefinedType, occurrenceClass);
	}

	const switchType: "occurrence_to_type" | "type_to_occurrence" = isTypeProductAfter
		? "occurrence_to_type"
		: "type_to_occurrence";

	return switchBetweenClassTypes(file, product, switchType, ifcClass, predefinedType);
}

/**
 * Changes the class of a product (Python: `ifcopenshell.api.root.reassign_class`).
 *
 * If you ever created a wall then realised it's meant to be something else, this
 * function lets you change the IFC class whilst retaining all other geometry and
 * relationships.
 *
 * This is especially useful when dealing with poorly classified data from proprietary
 * software with limited IFC capabilities.
 *
 * If you are reassigning a type, the occurrence classes are also reassigned to
 * maintain validity.
 *
 * Vice versa, if you are reassigning an occurrence, the type is also reassigned in
 * IFC4 and up. In IFC2X3, this may not occur if the type cannot be unambiguously
 * derived, so you are required to manually check this.
 *
 * Reassigning type class to occurrence (and vice versa) is supported -- **except**
 * when the element/type being switched has at least one representation, in which case
 * this throws (see this file's own header comment and `TODOS.md`: needs
 * `api.geometry.assignRepresentation`/`.editObjectPlacement`, neither ported yet).
 *
 * @example
 * ```ts
 * // We have a wall.
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 *
 * // Oh, did I say wall? I meant slab.
 * const slab = api.root.reassignClass(model, { product: wall, ifcClass: "IfcSlab" });
 * ```
 */
export const reassignClass = wrapUsecase("root.reassign_class", reassignClassUsecase);
