// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/type/map_type_representations.py` (src/ifcopenshell-python,
// 102 lines) -- completes `api.type` alongside `./assignType.ts` (its own primary,
// load-bearing caller: real `assign_type.py`'s own final section calls this directly,
// once per newly-typed occurrence, whenever `should_map_representations` is true (the
// default) AND `relating_type.RepresentationMaps` is non-empty -- see `assignType.ts`'s
// own header comment for the full call-site wiring; this is NOT an optional side
// chunk).
//
// --- Real, load-bearing dependency on an entirely unported module: disclosed, not
// silently skipped or reimplemented (new `TODOS.md` entry) ---
//
// Real Python's own body is two loops. The FIRST (lines 85-94: strip every
// representation currently on `related_object.Representation.Representations`, via
// `ifcopenshell.api.geometry.unassign_representation`/`.remove_representation`) is
// fully portable -- both of those are already landed (`../geometry/index.ts`, a direct
// dependency of `api.context.removeContext`). The SECOND (lines 95-102: for every one
// of the type's own `RepresentationMaps`, create a fresh `IfcMappedItem`-based
// representation via `ifcopenshell.api.geometry.map_representation` and assign it back
// onto the occurrence via `ifcopenshell.api.geometry.assign_representation`) is NOT --
// neither of those two functions has any TS port at all yet (`api/geometry/index.ts`'s
// own header comment confirms only `unassign_representation`/`remove_representation`
// have landed, as a minimal, unrelated dependency of `api.context.removeContext`). This
// is a genuinely different pair of blocked functions than the ones `TODOS.md` already
// tracks for `api.spatial.assignContainer`/`api.aggregate.assignObject`'s
// `edit_object_placement` gap -- documented as its own new `TODOS.md` entry.
//
// Rather than run the first (safe) loop and only then throw once the second (blocked)
// loop is reached -- which would leave the occurrence's existing representations
// already stripped with nothing to replace them, a strictly WORSE silent-partial-state
// outcome than refusing the call outright -- this throws a clear, loud, descriptive
// error up front, before performing any mutation at all, the moment it's clear the
// blocked path would be needed (i.e. `RepresentationMaps` is non-empty). Matches this
// project's established "throw rather than silently skip real cleanup logic, and don't
// leave a worse partial state than refusing outright" discipline --
// `../owner/internalCascadeHelpers.ts`'s own `removeProductCascade` header comment is
// the direct precedent cited by this chunk's own task brief.
//
// The one real, non-blocked behavior -- "a type with no `RepresentationMaps` is a
// correct, total no-op" (real Python's own `if not relating_type.RepresentationMaps:
// return`) -- is ported in full and pinned by
// `test_doing_nothing_if_the_type_has_no_representation_maps` in
// `mapTypeRepresentations.test.ts`. The blocked path (real Python's own
// `test_removing_existing_element_representations_and_mapping_type_representations`)
// is pinned instead as a dedicated "throws the disclosed blocked error" regression test,
// matching this project's established `addConversionBasedUnit.test.ts`/
// `editPset.test.ts` "pin the disclosed blocked behavior with a dedicated test"
// precedent -- not silently omitted.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface MapTypeRepresentationsSettings {
	/** The `IfcElement` occurrence. */
	relatedObject: EntityInstance;
	/** The `IfcElementType` type. */
	relatingType: EntityInstance;
}

function mapTypeRepresentationsUsecase(_file: IfcFile, settings: MapTypeRepresentationsSettings): void {
	// Python: `if not relating_type.RepresentationMaps: return`.
	const representationMaps = settings.relatingType.get("RepresentationMaps") as EntityInstance[] | null;
	if (!representationMaps || representationMaps.length === 0) return;

	// See this file's own header comment: the rest of real Python's body needs
	// `ifcopenshell.api.geometry.map_representation`/`.assign_representation`, neither
	// ported yet. Thrown up front (before the otherwise-safe representation-stripping
	// loop) so a blocked call never leaves the occurrence with its old representations
	// removed and nothing to replace them.
	throw new Error(
		"mapTypeRepresentations: mapping an occurrence to its type's own RepresentationMaps needs " +
			"api.geometry.mapRepresentation/api.geometry.assignRepresentation, neither ported yet -- see TODOS.md.",
	);
}

/**
 * Ensures that all occurrences have the same representation as the type (Python:
 * `ifcopenshell.api.type.map_type_representations`).
 *
 * If a type has a representation, all occurrences must have the same representation.
 * If the type's representation changes, this function may be used to ensure
 * consistency of the occurrence's representations.
 *
 * **Blocked** (throws) whenever `relatingType.RepresentationMaps` is non-empty -- see
 * this file's own header comment and `TODOS.md` for why. A type with no
 * `RepresentationMaps` at all remains a real, correct no-op.
 */
export const mapTypeRepresentations = wrapUsecase("type.map_type_representations", mapTypeRepresentationsUsecase);
