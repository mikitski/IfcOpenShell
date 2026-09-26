// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/remove_system.py` (src/ifcopenshell-python, 67
// lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own header
// comment). Structurally near-identical to `../group/removeGroup.ts` (`IfcSystem` is
// an `IfcGroup` subtype; both walk every inverse of the entity being removed, cleaning
// up any directly-assigned `IfcRelDefinesByProperties` via the already-landed
// `pset.removePset`, and any `IfcRelAssignsToGroup` where `system` is either the
// `RelatingGroup` or the SOLE `RelatedObjects` member) -- verified line-by-line against
// the real Python source, not assumed identical from the class-name resemblance alone.
//
// One real, disclosed difference from `removeGroup.ts`: real Python's own
// `remove_system.py` handles the "`system` nested alongside other members in another
// group's rel" case with an explicit `elif len(inverse.RelatedObjects) == 1`
// check -- structurally the SAME "only explicitly handle the sole-member case, rely on
// `IfcFile.remove`'s own automatic aggregate-splice for the multi-member case" pattern
// `removeGroup.ts`'s own header comment already fully disclosed for `remove_group.py`
// -- not a new finding, just confirming the sibling function shares it.
//
// Real Python collects every inverse's `.id()` up front, then re-resolves each by id
// inside a bare `try`/`except: continue` -- ported via `file.byId` wrapped in
// `try`/`catch { continue }`, matching `removeGroup.ts`'s own established pattern for
// this exact "entities may be deleted mid-loop" tolerance.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removePset } from "../pset/removePset";

function removeWithOwnerHistory(file: IfcFile, instance: EntityInstance): void {
	const history = instance.get("OwnerHistory") as EntityInstance | null;
	file.remove(instance);
	if (history) elementUtil.removeDeep2(file, history);
}

export interface RemoveSystemSettings {
	/** The `IfcSystem` to remove. */
	system: EntityInstance;
}

function removeSystemUsecase(file: IfcFile, settings: RemoveSystemSettings): void {
	const { system } = settings;

	// Collect ids up front -- see this file's header comment (and `removeGroup.ts`'s
	// own identical precedent) for why re-resolving by id, tolerating a since-deleted
	// id, is load-bearing here, not merely a style choice.
	const inverseIds = [...(file.getInverse(system) as Set<EntityInstance>)].map((i) => i.id());

	for (const inverseId of inverseIds) {
		let inverse: EntityInstance;
		try {
			inverse = file.byId(inverseId);
		} catch {
			continue;
		}

		if (inverse.isA("IfcRelDefinesByProperties")) {
			removePset(file, { product: system, pset: inverse.get("RelatingPropertyDefinition") as EntityInstance });
		} else if (inverse.isA("IfcRelAssignsToGroup")) {
			const relatingGroup = inverse.get("RelatingGroup") as EntityInstance;
			if (relatingGroup.equals(system)) {
				removeWithOwnerHistory(file, inverse);
			} else if ((inverse.get("RelatedObjects") as EntityInstance[]).length === 1) {
				removeWithOwnerHistory(file, inverse);
			}
			// else: `system` is nested alongside other members in another group's rel --
			// no explicit cleanup needed here; the final `removeWithOwnerHistory(file,
			// system)` call below already splices `system` out of that rel's
			// `RelatedObjects` automatically. See this file's own header comment (and
			// `removeGroup.ts`'s identical precedent).
		}
	}

	removeWithOwnerHistory(file, system);
}

/**
 * Removes a distribution system (Python: `ifcopenshell.api.system.remove_system`).
 *
 * All the distribution elements within the system are retained.
 *
 * @example
 * ```ts
 * // A completely empty distribution system
 * const system = api.system.addSystem(model, {});
 *
 * // Delete it.
 * api.system.removeSystem(model, { system });
 * ```
 */
export const removeSystem = wrapUsecase("system.remove_system", removeSystemUsecase);
