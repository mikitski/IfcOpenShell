// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_boolean.py` (src/ifcopenshell-python, 114
// lines) -- a NEW `api.geometry` chunk (see `./index.ts`'s own header comment for the
// module's overall scope). Verified directly: this file's only import is
// `ifcopenshell.util.element` (`replace_attribute`, already landed) -- no
// kernel/matrix-math dependency, no genuinely new/unported primitive.
//
// Combines `firstItem` with each of `secondItems` (in order) into a chain of
// `IfcBooleanResult` (or, for a real, disclosed special case below,
// `IfcBooleanClippingResult`), reusing an EXISTING boolean chain `firstItem` already
// participates in rather than nesting a brand new one on top -- and skips/dedupes any
// `secondItems` entry already consumed by that existing chain, to protect against
// recursive booleans (see `test_preventing_recursive_booleans`, ported below).
//
// `IfcBooleanResult(Operator, FirstOperand, SecondOperand)` and
// `IfcBooleanClippingResult(Operator, FirstOperand, SecondOperand)` -- confirmed
// identical attribute order across all 3 schemas' generated `.d.ts`s (both entities
// exist on IFC2X3 too, contrary to a first guess that clipping results might be
// IFC4+-only). `Operator` (`IfcBooleanOperator`) is `export type IfcBooleanOperator =
// string` on every schema (a plain STRING-based EXPRESS ENUMERATION-like type in this
// port's generated types, not a closed literal union) -- no schema-specific valid-value
// narrowing needed; `"DIFFERENCE"`/`"INTERSECTION"`/`"UNION"` (this function's own
// accepted values, matching Python's `Literal[...]` parameter hint) are valid on every
// schema. `FirstOperand`/`SecondOperand`'s own declared TS union type gains
// `IfcTessellatedFaceSet` on IFC4/IFC4X3 only (absent on IFC2X3's own union) -- a
// type-level difference only; this port never narrows on that union itself, so it
// doesn't affect behavior here.
//
// Two real Python-source quirks/bugs, preserved verbatim rather than "fixed":
//
// 1. The "walk up the existing boolean chain" `while` loop only ever inspects the
//    FIRST `IfcBooleanResult` inverse it finds on each pass (a plain `for` loop with an
//    unconditional `break` the moment one is found) -- if `firstItem` were somehow
//    referenced by more than one `IfcBooleanResult` (not expected in a well-formed
//    model, but not actually prevented by this function itself), any OTHER such
//    boolean is silently ignored. Ported the same way: the `for...of` loop over
//    `file.getInverse(...)` (a deduped `Set<EntityInstance>`, matching this port's own
//    `getInverse` default shape and Python's own default `get_inverse` iteration)
//    `break`s the instant `inverse.isA("IfcBooleanResult")` is true.
// 2. `first.Closed = True` / `second_item.Closed = True` are set UNCONDITIONALLY
//    whenever the respective operand `isA("IfcTessellatedFaceSet")`, with a real,
//    disclosed "trust the user" comment in the Python source itself (not this port's
//    own finding) -- no check for whether the mesh is ACTUALLY closed. Ported verbatim.
//
// `second_items = [i for i in second_items if i != first_item and is_operand(i)]` (a
// snapshot copy, never mutating the caller's own array) and `second_items.remove(...)`
// (removes exactly the FIRST matching element by value, not every occurrence) are
// ported with a fresh local array plus a dedicated `removeFirstEqual` helper using
// `EntityInstance.equals` (this port's own identity/value-equality method, per
// `entityInstance.ts`'s own header comment on why raw `===` must never be used for
// entity-identity comparisons) rather than reference identity, matching Python's own
// `==`-based `list.remove`/`in` semantics exactly.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

/** See `./removeBoolean.ts`'s own identical helper's doc comment for why this is
 * duplicated per-file rather than shared. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

function isOperand(item: EntityInstance): boolean {
	return (
		item.isA("IfcBooleanResult") ||
		item.isA("IfcCsgPrimitive3D") ||
		item.isA("IfcHalfSpaceSolid") ||
		item.isA("IfcSolidModel") ||
		item.isA("IfcTessellatedFaceSet")
	);
}

/** Python: `second_items.remove(target)` -- removes exactly the first `==`-equal
 * element, not every occurrence. Mutates `items` in place. */
function removeFirstEqual(items: EntityInstance[], target: EntityInstance): void {
	const index = items.findIndex((i) => i.equals(target));
	if (index !== -1) items.splice(index, 1);
}

export interface AddBooleanSettings {
	/** The `IfcBooleanOperand` that the operation is performed upon. */
	firstItem: EntityInstance;
	/**
	 * The `IfcBooleanOperand`s that the operation will be performed with, in the order
	 * given of the list.
	 */
	secondItems: readonly EntityInstance[];
	/** The type of boolean operation to perform. */
	operator?: "DIFFERENCE" | "INTERSECTION" | "UNION";
}

function addBooleanUsecase(file: IfcFile, settings: AddBooleanSettings): EntityInstance[] {
	const { firstItem, secondItems, operator = "DIFFERENCE" } = settings;

	if (!isOperand(firstItem)) return [];

	const originalFirstItem = firstItem;
	let currentFirstItem = firstItem;

	const remainingSecondItems = secondItems.filter((i) => !i.equals(currentFirstItem) && isOperand(i));

	while (true) {
		let isPartOfBoolean = false;
		for (const inverse of file.getInverse(currentFirstItem) as Set<EntityInstance>) {
			if (inverse.isA("IfcBooleanResult")) {
				isPartOfBoolean = true;
				currentFirstItem = inverse;
				const invFirst = inverse.get("FirstOperand") as EntityInstance;
				const invSecond = inverse.get("SecondOperand") as EntityInstance;
				if (invFirst.equals(originalFirstItem) && remainingSecondItems.some((i) => i.equals(invSecond))) {
					removeFirstEqual(remainingSecondItems, invSecond);
				} else if (invSecond.equals(originalFirstItem) && remainingSecondItems.some((i) => i.equals(invFirst))) {
					removeFirstEqual(remainingSecondItems, invFirst);
				}
				break;
			}
		}
		if (!isPartOfBoolean) break;
	}

	if (remainingSecondItems.length === 0) return [];

	// Don't replace style or aspect relationships.
	const toReplace = new EntityInstanceSet();
	for (const inverse of file.getInverse(currentFirstItem) as Set<EntityInstance>) {
		if (inverse.isA("IfcShapeRepresentation") || inverse.isA("IfcBooleanResult")) {
			toReplace.add(inverse);
		}
	}

	let first = currentFirstItem;
	const booleans: EntityInstance[] = [];
	for (const secondItem of remainingSecondItems) {
		if (first.isA("IfcTessellatedFaceSet")) first.set("Closed", true); // For now, trust the user to do the right thing.
		if (secondItem.isA("IfcTessellatedFaceSet")) secondItem.set("Closed", true); // For now, trust the user to do the right thing.
		if (
			operator === "DIFFERENCE" &&
			secondItem.isA("IfcHalfSpaceSolid") &&
			(first.isA("IfcSweptAreaSolid") || first.isA("IfcSweptDiskSolid") || first.isA("IfcBooleanClippingResult"))
		) {
			first = file.createEntity("IfcBooleanClippingResult", operator, first, secondItem);
		} else {
			first = file.createEntity("IfcBooleanResult", operator, first, secondItem);
		}
		booleans.push(first);
	}

	for (const inverse of toReplace.values()) {
		elementUtil.replaceAttribute(inverse, currentFirstItem, first);
	}

	return booleans;
}

/**
 * Adds a boolean operation to two or more representation items (Python:
 * `ifcopenshell.api.geometry.add_boolean`).
 *
 * This function protects against recursive booleans.
 *
 * After a boolean operation is made, since the items of `IfcShapeRepresentation` may
 * be modified, it is not guaranteed that the `RepresentationType` is still valid.
 * After performing all your booleans, it is recommended to run
 * `api.geometry.validateType`/`validateCsg` to ensure correctness (Python:
 * `ifcopenshell.api.geometry.validate_csg`, not yet ported; `validateType` is landed
 * in this same chunk).
 *
 * @returns A list of newly created `IfcBooleanResult`/`IfcBooleanClippingResult` in
 * the order of boolean operations (based on the order of `secondItems`). If nothing
 * was created, the list will be empty.
 */
export const addBoolean = wrapUsecase("geometry.add_boolean", addBooleanUsecase);
