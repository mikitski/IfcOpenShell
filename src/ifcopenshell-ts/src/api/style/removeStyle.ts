// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/remove_style.py` (src/ifcopenshell-python, 94 lines)
// -- chunk 1 of 2 for `api.style` (see `./index.ts`'s own header comment). One sibling
// `api.style` dependency, `remove_surface_style` (this same chunk, see
// `./removeSurfaceStyle.ts`), already landed alongside this file -- no cross-chunk
// ordering blocker. Otherwise only bare `ifcopenshell`/`ifcopenshell.util.element`
// (`remove_deep2`, already ported -- `../../util/element.ts`) are imported by the real
// source.
//
// Removes a presentation style (`IfcPresentationStyle` -- typically `IfcSurfaceStyle`/
// `IfcCurveStyle`/`IfcFillAreaStyle`/`IfcTextStyle`) and cascades into every "inverse"
// relationship that would otherwise dangle or become orphaned: any `IfcStyledItem`
// that referenced ONLY this style (plus, transitively, the `IfcStyledRepresentation`/
// `IfcMaterialDefinitionRepresentation` that would in turn become empty), any
// `IfcFillAreaStyleHatching` whose `HatchLineAppearance` is an `IfcCurveStyle` being
// removed (recursing back into any `IfcFillAreaStyle` that itself references that
// hatching -- an `IfcFillAreaStyle` can be BOTH a caller into this recursion and a
// target being removed by it), and (for the removed style's OWN presentation items,
// when it's an `IfcSurfaceStyle`/`IfcFillAreaStyle`) every item it directly owns.
//
// Real Python's recursive `Usecase` class (`execute`/`purge_inverses`/
// `purge_styled_representations`/`purge_material_definition_representations`/
// `purge_fill_area_style_hatching`, each a `self.file`-bound method) is ported as a set
// of plain functions threading `file` through explicitly as their own first parameter
// -- matching this project's established convention for a recursive/multi-method
// Python `Usecase` class (see `../material/unassignMaterial.ts`'s own
// `removeMaterialUsagesFromTypes`/`unassignMaterials` precedent) rather than a TS
// class. `executeRemoveStyle`'s own `doNotDelete` parameter (Python: `execute(self,
// style, do_not_delete=())`) is NOT exposed on the public `RemoveStyleSettings` --
// real Python's own public `remove_style` entry point always calls
// `usecase.execute(style)` with the implicit `do_not_delete=()` default; only the
// internal `purge_fill_area_style_hatching` recursion ever passes a non-empty value,
// exactly mirrored here by `executeRemoveStyle`'s own internal recursive call.
//
// --- Real, disclosed self-referential recursion: `IfcFillAreaStyle` <->
// `IfcFillAreaStyleHatching`, ported verbatim ---
//
// `purge_fill_area_style_hatching(hatching, style)` (reached only when removing an
// `IfcCurveStyle` that some `IfcFillAreaStyleHatching.HatchLineAppearance` points at)
// walks every `IfcFillAreaStyle` that references that hatching via `FillStyles`, and
// recursively calls `execute` (i.e. a full, real `remove_style`-style removal) on EACH
// one, passing `do_not_delete=(hatching, style)` so that inner recursive removal
// doesn't re-delete the very hatching/curve-style objects this outer call is already
// in the middle of handling. After that recursive fan-out, it unconditionally calls
// `remove_deep2(file, hatching, do_not_delete=[style])` on the hatching itself (no
// `also_consider` this time -- a different call shape than `execute`'s own
// `IfcFillAreaStyle`-branch call to `remove_deep2`, which passes `also_consider=[style]`
// and forwards its own `do_not_delete` through). Ported with the exact same two
// distinct `removeDeep2` call shapes, not unified into one helper -- unifying them
// would risk silently changing which entities each call is allowed to also delete.
//
// --- Positional/by-name attribute access, verified against generated `.d.ts`s ---
//
// `IfcStyledItem.Styles`, `IfcStyledRepresentation.Items`,
// `IfcMaterialDefinitionRepresentation.Representations`,
// `IfcSurfaceStyle.Styles`/`IfcFillAreaStyle.FillStyles` are all read by name
// (`.get(...)`), matching this project's established convention -- this file only ever
// reads/removes existing entities, never constructs new ones (no `createEntity` calls
// at all).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removeSurfaceStyle } from "./removeSurfaceStyle";

function purgeMaterialDefinitionRepresentations(file: IfcFile, styledRepresentation: EntityInstance): void {
	for (const inverse of file.getInverse(styledRepresentation) as Set<EntityInstance>) {
		if (
			inverse.isA("IfcMaterialDefinitionRepresentation") &&
			(inverse.get("Representations") as EntityInstance[]).length === 1
		) {
			file.remove(inverse);
		}
	}
}

function purgeStyledRepresentations(file: IfcFile, styledItem: EntityInstance): void {
	for (const inverse of file.getInverse(styledItem) as Set<EntityInstance>) {
		if (inverse.isA("IfcStyledRepresentation") && (inverse.get("Items") as EntityInstance[]).length === 1) {
			purgeMaterialDefinitionRepresentations(file, inverse);
			file.remove(inverse);
		}
	}
}

function purgeFillAreaStyleHatching(file: IfcFile, fillAreaStyleHatching: EntityInstance, style: EntityInstance): void {
	for (const inverse of file.getInverse(fillAreaStyleHatching) as Set<EntityInstance>) {
		if (inverse.isA("IfcFillAreaStyle")) {
			executeRemoveStyle(file, inverse, [fillAreaStyleHatching, style]);
		}
	}
	removeDeep2(file, fillAreaStyleHatching, [], [style]);
}

function purgeInverses(file: IfcFile, style: EntityInstance): void {
	for (const inverse of file.getInverse(style) as Set<EntityInstance>) {
		if (inverse.isA("IfcStyledItem")) {
			if ((inverse.get("Styles") as EntityInstance[]).length === 1) {
				purgeStyledRepresentations(file, inverse);
				file.remove(inverse);
			}
			// IfcCurveStyle -> IfcFillAreaStyleHatching.
		} else if (inverse.isA("IfcFillAreaStyleHatching")) {
			purgeFillAreaStyleHatching(file, inverse, style);
		}
	}
}

function executeRemoveStyle(file: IfcFile, style: EntityInstance, doNotDelete: readonly EntityInstance[] = []): void {
	purgeInverses(file, style);
	const ifcClass = style.isA();
	if (ifcClass === "IfcSurfaceStyle") {
		for (const style_ of style.get("Styles") as EntityInstance[]) {
			removeSurfaceStyle(file, { style: style_ });
		}
	} else if (ifcClass === "IfcFillAreaStyle") {
		for (const style_ of style.get("FillStyles") as EntityInstance[]) {
			removeDeep2(file, style_, [style], doNotDelete);
		}
	}
	file.remove(style);
}

export interface RemoveStyleSettings {
	/** The `IfcPresentationStyle` to remove. */
	style: EntityInstance;
}

function removeStyleUsecase(file: IfcFile, settings: RemoveStyleSettings): void {
	executeRemoveStyle(file, settings.style);
}

/**
 * Removes a presentation style (Python: `ifcopenshell.api.style.remove_style`).
 *
 * All of the presentation items of the style will also be removed.
 *
 * @example
 * ```ts
 * // Create a new surface style
 * const style = api.style.addStyle(model, {});
 *
 * // Not anymore!
 * api.style.removeStyle(model, { style });
 * ```
 */
export const removeStyle = wrapUsecase("style.remove_style", removeStyleUsecase);
