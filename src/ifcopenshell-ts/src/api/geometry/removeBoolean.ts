// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/remove_boolean.py` (src/ifcopenshell-python, 61
// lines) -- part of this chunk's 8-file `api.geometry` addition (see `./index.ts`'s own
// header comment). Verified directly: this file's only import is
// `ifcopenshell.util.element` (`replace_attribute`, already landed) -- no
// kernel/matrix-math dependency.
//
// Removes a single `IfcBooleanResult` (or, given a non-boolean operand item, every
// `IfcBooleanResult` it directly participates in) WITHOUT deleting either operand: the
// removed boolean's `FirstOperand` takes its place wherever the boolean itself was
// referenced (a representation's own `Items`, or a PARENT `IfcBooleanResult`'s own
// `FirstOperand`/`SecondOperand`), and its `SecondOperand` is appended as a fresh,
// independent top-level item onto every `IfcShapeRepresentation` reached by walking
// UP the boolean/CSG-solid chain from the removed boolean.
//
// **Real Python-level recursion, NOT re-entering the wrapped export** -- matching
// `./editObjectPlacement.ts`'s own established precedent (see that file's header
// comment for the general reasoning) for a DIFFERENT, but equally real, reason here:
// real Python's own recursive call (`remove_boolean(file, inverse)`, in the
// non-`IfcBooleanResult` branch) resolves via `remove_boolean.py`'s OWN module
// `__globals__`, which `ifcopenshell.api.wrap_usecases` never touches (it only
// `setattr`s the wrapped version onto the PACKAGE module, `ifcopenshell.api.geometry`,
// a distinct module object from `ifcopenshell.api.geometry.remove_boolean`'s own
// submodule) -- so real Python's own recursive call is provably to the raw, unwrapped
// function, never re-triggering pre/post listeners. Ported the same way: `runRemove
// Boolean` is a raw recursive helper: the wrapped export calls it once, and it calls
// itself directly, never through the wrapped export.
//
// Identity-keyed `set()`s (`representations`), matching this project's established
// `EntityInstanceSet` convention (duplicated per-file, not imported -- see
// `./removeRepresentation.ts`'s own identical helper's doc comment for why).
//
// `IfcBooleanResult.FirstOperand`/`SecondOperand` -- a real, disclosed, verbatim-
// preserved Python quirk: real Python reads BOTH via plain attribute access
// (`item.FirstOperand`/`item.SecondOperand`) with no `is_a("IfcBooleanResult")` re-guard
// at that point -- safe only because this branch is only ever reached once the function
// has already confirmed `item.is_a("IfcBooleanResult")` at its own top (either directly,
// or via the non-boolean branch's own `inverse.is_a("IfcBooleanResult")` filter before
// recursing).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

/** See this file's header comment and `./removeRepresentation.ts`'s own identical
 * helper's doc comment for why this is duplicated per-file rather than shared. */
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

/**
 * Python: `remove_boolean(file, item)`. Raw, unwrapped recursive helper -- see this
 * file's header comment for why real Python's own recursion never re-triggers
 * listeners, ported the same way here.
 */
function runRemoveBoolean(file: IfcFile, item: EntityInstance): void {
	if (!item.isA("IfcBooleanResult")) {
		// Python: `for inverse in file.get_inverse(item):` -- a plain iteration (default
		// `allow_duplicate=False`), matching this port's own default `getInverse` shape
		// (a deduped `Set<EntityInstance>`).
		for (const inverse of file.getInverse(item) as Set<EntityInstance>) {
			if (inverse.isA("IfcBooleanResult")) {
				runRemoveBoolean(file, inverse);
			}
		}
		return;
	}

	const representations = new EntityInstanceSet();
	// Python: `queue = list(file.get_inverse(item))` then `queue.pop()` (pops from the
	// END, i.e. LIFO/stack order) -- ported with `Array.prototype.pop()` for the exact
	// same order, not `shift()`.
	const queue: EntityInstance[] = [...(file.getInverse(item) as Set<EntityInstance>)];
	while (queue.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: `queue.length > 0` just checked.
		const inverse = queue.pop()!;
		if (inverse.isA("IfcShapeRepresentation")) {
			representations.add(inverse);
		} else if (inverse.isA("IfcBooleanResult")) {
			queue.push(...(file.getInverse(inverse) as Set<EntityInstance>));
		} else if (inverse.isA("IfcCsgSolid")) {
			queue.push(...(file.getInverse(inverse) as Set<EntityInstance>));
		}
	}

	const first = item.get("FirstOperand") as EntityInstance;
	const second = item.get("SecondOperand") as EntityInstance;
	for (const inverse of file.getInverse(item) as Set<EntityInstance>) {
		elementUtil.replaceAttribute(inverse, item, first);
	}

	for (const representation of representations.values()) {
		representation.set("Items", [...(representation.get("Items") as EntityInstance[]), second]);
	}

	file.remove(item);
}

export interface RemoveBooleanSettings {
	/**
	 * Either an `IfcBooleanResult` to remove, or an `IfcRepresentationItem` participating
	 * in one or more boolean results (in which case all of them are removed).
	 */
	item: EntityInstance;
}

function removeBooleanUsecase(file: IfcFile, settings: RemoveBooleanSettings): void {
	runRemoveBoolean(file, settings.item);
}

/**
 * Removes a boolean operation without deleting the operands (Python:
 * `ifcopenshell.api.geometry.remove_boolean`).
 *
 * The first operand takes the boolean result's own place (in a representation's
 * `Items`, or a parent boolean's own operand slot); the second operand is reset as a
 * fresh, independent top-level representation item on every `IfcShapeRepresentation`
 * reached by walking up the boolean/CSG-solid chain.
 *
 * This may affect a representation's own `RepresentationType` validity -- it's
 * recommended to run `api.geometry.validateType`/`validateCsg` (not yet ported) after
 * all boolean modifications are complete, matching real Python's own docstring
 * recommendation.
 */
export const removeBoolean = wrapUsecase("geometry.remove_boolean", removeBooleanUsecase);
