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
// --- RESOLVED: both real dependencies are now landed (`api.geometry` chunk 2,
// `assignRepresentation`/`mapRepresentation`) ---
//
// Previously blocked (see this file's own git history / `TODOS.md`'s now-resolved
// entry): real Python's own body is two loops. The FIRST (lines 85-94: strip every
// representation currently on `related_object.Representation.Representations`, via
// `ifcopenshell.api.geometry.unassign_representation`/`.remove_representation`) was
// already portable. The SECOND (lines 95-102: for every one of the type's own
// `RepresentationMaps`, create a fresh `IfcMappedItem`-based representation via
// `ifcopenshell.api.geometry.map_representation` and assign it back onto the occurrence
// via `ifcopenshell.api.geometry.assign_representation`) needed both of those functions,
// neither of which had a TS port at the time. Both are now real, exported functions
// (`../geometry/index.ts`) -- this file now ports the full real function, not just its
// no-op guard.
//
// Ported in full: `test_doing_nothing_if_the_type_has_no_representation_maps` (the
// early-return guard) AND `test_removing_existing_element_representations_and_mapping_
// type_representations` (the real two-loop body), both in `mapTypeRepresentations.test.ts`
// -- replacing the previous "throws the disclosed blocked error" pin now that the real
// behavior is exercisable.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignRepresentation } from "../geometry/assignRepresentation";
import { mapRepresentation } from "../geometry/mapRepresentation";
import { removeRepresentation } from "../geometry/removeRepresentation";
import { unassignRepresentation } from "../geometry/unassignRepresentation";
import { wrapUsecase } from "../hooks";

export interface MapTypeRepresentationsSettings {
	/** The `IfcElement` occurrence. */
	relatedObject: EntityInstance;
	/** The `IfcElementType` type. */
	relatingType: EntityInstance;
}

function mapTypeRepresentationsUsecase(file: IfcFile, settings: MapTypeRepresentationsSettings): void {
	const { relatedObject, relatingType } = settings;

	// Python: `if not relating_type.RepresentationMaps: return`.
	const representationMaps = relatingType.get("RepresentationMaps") as EntityInstance[] | null;
	if (!representationMaps || representationMaps.length === 0) return;

	// Python: `representations = []` / `if related_object.Representation: representations
	// = related_object.Representation.Representations` -- a snapshot copy (real Python's
	// own attribute read already returns a fresh tuple), taken BEFORE the loop below
	// mutates `related_object.Representation.Representations` out from under it.
	let representations: EntityInstance[] = [];
	const definition = relatedObject.get("Representation") as EntityInstance | null;
	if (definition) {
		representations = [...((definition.get("Representations") as EntityInstance[] | null) ?? [])];
	}
	for (const representation of representations) {
		unassignRepresentation(file, { product: relatedObject, representation });
		removeRepresentation(file, { representation });
	}

	for (const representationMap of representationMaps) {
		const representation = representationMap.get("MappedRepresentation") as EntityInstance;
		const mappedRepresentation = mapRepresentation(file, { representation });
		assignRepresentation(file, { product: relatedObject, representation: mappedRepresentation });
	}
}

/**
 * Ensures that all occurrences have the same representation as the type (Python:
 * `ifcopenshell.api.type.map_type_representations`).
 *
 * If a type has a representation, all occurrences must have the same representation.
 * If the type's representation changes, this function may be used to ensure
 * consistency of the occurrence's representations.
 *
 * A type with no `RepresentationMaps` at all is a real, correct no-op.
 */
export const mapTypeRepresentations = wrapUsecase("type.map_type_representations", mapTypeRepresentationsUsecase);
