// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/layer/add_layer_with_style.py` (src/ifcopenshell-python, 58
// lines) -- another single-`create_entity`-call function, no other dependency.
//
// `IfcPresentationLayerWithStyle`'s attribute order (`Name`, `Description`,
// `AssignedItems`, `Identifier`, `LayerOn`, `LayerFrozen`, `LayerBlocked`,
// `LayerStyles`) is identical and contiguous across all 3 schemas' generated `.d.ts`
// files -- verified directly, not assumed. `IfcPresentationLayerWithStyle` is a
// subtype of `IfcPresentationLayerAssignment` with 4 further explicit attributes of
// its own and no DERIVE attributes anywhere in the hierarchy, so a positional
// `createEntity` call needs `null` placeholders only for the 3 inherited attributes
// this function's real Python source leaves unset (`Description`/`AssignedItems`/
// `Identifier`), not for any hidden derived slot.
//
// --- Disclosed finding: this port's LOGICAL round-trip doesn't yet match Python's
// bool-like semantics -- confirmed empirically against this exact worktree's own
// built native addon, not assumed ---
//
// `LayerOn`/`LayerFrozen`/`LayerBlocked` are all EXPRESS `LOGICAL` (tri-state:
// TRUE/FALSE/UNKNOWN) attributes, and real Python's `IfcLogical` type alias
// (`Union[bool, Literal["UNKNOWN"]]`, reproduced below) reflects that. Setting one to
// the JS boolean `true`/`false` and reading it back via `EntityInstance.get()`
// currently returns the raw numbers `1`/`0` -- NOT the JS booleans `true`/`false` --
// because `entityInstance.ts`'s `get()` -> `wrapValue()` path performs no LOGICAL-
// specific unwrapping (only `valueToVariant()`, on the *write* side, special-cases
// `declaredKind === kinds.LOGICAL` for a `boolean` input; there is no symmetric
// read-side conversion at all). Setting the string `"UNKNOWN"` does correctly round-
// trip as the string `"UNKNOWN"` (LOGICAL's third state has no native JS
// representation to begin with, so this half already matches Python). This is a real,
// pre-existing primitive-layer gap -- not introduced by this file, not fixed by it
// (fixing `entityInstance.ts`'s generic `get()`/`wrapValue()` is out of this chunk's
// scope, and could affect every other LOGICAL-typed attribute across the whole port,
// not just this module) -- so this file's own test (`addLayerWithStyle.test.ts`)
// asserts the actual `1`/`0` round-trip rather than masking it with a `Boolean(...)`
// coercion. Real Python's own test (`test_add_layer_with_style.py`) reads fine either
// way only because Python's `bool` is an `int` subclass, so `1 == True` is already
// `True` there -- a language-level coincidence this TS port doesn't get for free
// (`1 === true` is `false` in JS).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python: `IfcLogical = Union[bool, Literal["UNKNOWN"]]`. */
export type IfcLogical = boolean | "UNKNOWN";

export interface AddLayerWithStyleSettings {
	/** The name of the layer. Python default: `"Unnamed"`. */
	name?: string;
	/** Whether layer is visible. Python default: `"UNKNOWN"`. */
	on?: IfcLogical;
	/** Python default: `"UNKNOWN"`. */
	frozen?: IfcLogical;
	/** Whether layer elements are blocked from manipulation. Python default: `"UNKNOWN"`. */
	blocked?: IfcLogical;
	/** Styles to be used as default for representation item. Python default: `()`. */
	styles?: readonly EntityInstance[];
}

function addLayerWithStyleUsecase(file: IfcFile, settings: AddLayerWithStyleSettings = {}): EntityInstance {
	const name = settings.name ?? "Unnamed";
	const on = settings.on ?? "UNKNOWN";
	const frozen = settings.frozen ?? "UNKNOWN";
	const blocked = settings.blocked ?? "UNKNOWN";
	const styles = settings.styles ?? [];

	return file.createEntity(
		"IfcPresentationLayerWithStyle",
		name,
		// Leading `null`s for the 3 inherited attributes this function's real Python
		// source leaves unset -- see this file's header comment.
		null,
		null,
		null,
		on,
		frozen,
		blocked,
		[...styles],
	);
}

/**
 * Adds a new layer with style (Python: `ifcopenshell.api.layer.add_layer_with_style`).
 *
 * @example
 * ```ts
 * api.layer.addLayerWithStyle(model, {
 *   name: "AI-WALL-FULL-DIMS-N",
 *   on: true,
 *   frozen: false,
 *   blocked: false,
 *   styles: [curveStyle],
 * });
 * ```
 */
export const addLayerWithStyle = wrapUsecase("layer.add_layer_with_style", addLayerWithStyleUsecase);
