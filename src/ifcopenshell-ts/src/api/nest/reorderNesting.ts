// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/nest/reorder_nesting.py` (src/ifcopenshell-python, 32
// lines) -- the smallest file of this project's brand-new `api.nest` chunk (see
// `./index.ts`'s own header comment for the module's overall scope). No dependency on
// any other `ifcopenshell.api`/`ifcopenshell.util` module at all -- confirmed by
// reading the whole source: a bare `import ifcopenshell` and nothing else. Reorders
// `item` within its own nesting set's `RelatedObjects` list, in place (no new/removed
// relationship, no `OwnerHistory` touch of any kind -- real Python never calls
// `update_owner_history` here, ported verbatim, not "fixed" to match the sibling
// files' convention of always bumping it on a `RelatedObjects` write).
//
// --- Real, disclosed Python quirk: same unguarded `item.Nests` IFC2X3 gap as
//     `./changeNest.ts` ---
//
// Same finding as `./changeNest.ts`'s own header comment: `reorder_nesting.py` also
// reads `item.Nests` with no `file.schema == "IFC2X3"` branch anywhere in its 32
// lines, so `item.get("Nests")` throws on IFC2X3 exactly like real Python's own
// unguarded `item.Nests` attribute access would (no such inverse attribute registered
// for that schema). No real Python test exists for this function either (see
// `test/api/nest/` -- no `test_reorder_nesting.py`), so this is disclosed from reading
// the source alone, pinned by a dedicated regression test in `reorderNesting.test.ts`.
//
// --- `old_index` falsy-default quirk, ported verbatim ---
//
// Real Python's `if not old_index: old_index = nesting_set.RelatedObjects.index(item)`
// treats `old_index=0` (the function's own default) as "not specified", so calling
// `reorder_nesting(file, item)` with no `old_index` argument at all resolves it to
// `item`'s own current index automatically -- but this ALSO means an explicit
// `old_index=0` call (genuinely wanting to move the item currently at index 0) is
// silently overridden the exact same way, always re-resolving to `item`'s own actual
// index instead of trusting the caller's literal `0`. Ported via the same `!oldIndex`
// falsy check (`settings.oldIndex` defaults to `0` below, matching Python's own
// `old_index: int = 0` default), not "fixed" to distinguish an omitted argument from an
// explicit `0`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface ReorderNestingSettings {
	/** The `IfcObjectDefinition` item to reorder within its nesting set. */
	item: EntityInstance;
	/**
	 * The item's current index in `RelatedObjects`. See this file's header comment for
	 * the falsy-default quirk: `0` (the default) means "resolve `item`'s own actual
	 * index", not "literally index 0".
	 */
	oldIndex?: number;
	/** The new index to move `item` to. */
	newIndex?: number;
}

function reorderNestingUsecase(_file: IfcFile, settings: ReorderNestingSettings): void {
	const { item } = settings;
	let oldIndex = settings.oldIndex ?? 0;
	const newIndex = settings.newIndex ?? 0;

	// See this file's header comment: `item.get("Nests")` throws on IFC2X3, exactly
	// like real Python's unguarded `item.Nests` does.
	const nestsList = item.get("Nests") as EntityInstance[];
	if (nestsList.length === 0) return;
	const nestingSet = nestsList[0];

	if (!oldIndex) {
		oldIndex = (nestingSet.get("RelatedObjects") as EntityInstance[]).findIndex((o) => o.equals(item));
	}
	const items = [...((nestingSet.get("RelatedObjects") as EntityInstance[] | null) ?? [])];
	const [moved] = items.splice(oldIndex, 1);
	items.splice(newIndex, 0, moved);
	nestingSet.set("RelatedObjects", items);
}

/**
 * Reorders an item in a nesting set (Python: `ifcopenshell.api.nest.reorder_nesting`).
 *
 * See this file's header comment for two disclosed, verbatim-preserved Python quirks:
 * an unguarded IFC2X3 throw (no schema branch, like `./changeNest.ts`), and the
 * `oldIndex=0` falsy-default quirk (always re-resolves to `item`'s own actual index,
 * even when the caller explicitly means index 0).
 */
export const reorderNesting = wrapUsecase("nest.reorder_nesting", reorderNestingUsecase);
