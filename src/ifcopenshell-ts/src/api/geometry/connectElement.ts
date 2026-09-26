// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/connect_element.py` (src/ifcopenshell-python, 61
// lines) -- part of this chunk's 8-file `api.geometry` addition (see `./index.ts`'s own
// header comment). Verified directly: this file's real imports are `ifcopenshell.api.
// owner` (`create_owner_history`, already landed), `ifcopenshell.guid` (already landed
// as `../../guid.ts`), and `ifcopenshell.util.element` (`remove_deep2`, already landed)
// -- no kernel/matrix-math dependency.
//
// Creates (or reuses/updates) an `IfcRelConnectsElements` between two elements. Real
// Python's own 3-step order, ported verbatim:
// 1. Purge any INCOMPATIBLE existing connection -- i.e. one where the two elements are
//    connected in the OPPOSITE direction (`related_element` -> `relating_element`,
//    checked via BOTH `relating_element.ConnectedFrom` and `related_element.ConnectedTo`,
//    matching real Python's own two-loop redundancy exactly rather than collapsing to
//    one -- both loops scan the same underlying inverse index from each element's own
//    side, so in practice they can find the same rel; the identity-keyed `set()` below,
//    same convention as `./disconnectElement.ts`'s own, dedupes it exactly like
//    Python's real `set()` would).
// 2. If a connection ALREADY exists in the requested direction
//    (`relating_element.ConnectedTo`), update its `Description` in place and return it
//    early -- no new entity, no `OwnerHistory` touch (see
//    `test_reconnecting_an_element_changes_the_description`, ported below, which
//    asserts the total element count is unchanged after a reconnect).
// 3. Otherwise, create a brand new `IfcRelConnectsElements`.
//
// **Exact-class match, NOT subtype-inclusive** -- identical, deliberate distinction to
// `./disconnectElement.ts`'s own (see that file's header comment for the full writeup):
// every `is_a()` check here is Python's own no-argument, exact-class-name form
// (`rel.is_a() == "IfcRelConnectsElements"`), ported as `rel.isA() ===
// "IfcRelConnectsElements"` -- NOT the subtype-inclusive `rel.isA("IfcRelConnects
// Elements")` overload.
//
// `IfcRelConnectsElements(GlobalId, OwnerHistory, Name, Description, ConnectionGeometry,
// RelatingElement, RelatedElement)` -- confirmed flat and identical across all 3
// schemas' generated `.d.ts`s (only `OwnerHistory`'s own nullability differs, IFC2X3
// mandatory vs. IFC4+ optional -- irrelevant here since a real one is always supplied).
// Real Python passes `Description`/`RelatingElement`/`RelatedElement` as kwargs and
// leaves `Name`/`ConnectionGeometry` unset (`None`) -- ported with explicit `null`s at
// their positional slots, matching `./connectPort.ts`'s/`../material/assignMaterial.ts`'s
// established convention for "kwargs-only real Python call -> positional TS call with
// explicit `null` gaps".

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

/** See `./disconnectElement.ts`'s own identical helper's doc comment for why this is
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

export interface ConnectElementSettings {
	/** The `IfcElement` the new/updated `IfcRelConnectsElements.RelatingElement` will be. */
	relatingElement: EntityInstance;
	/** The `IfcElement` the new/updated `IfcRelConnectsElements.RelatedElement` will be. */
	relatedElement: EntityInstance;
	/** An optional free-text description of the connection. Python default: `None`. */
	description?: string | null;
}

function connectElementUsecase(file: IfcFile, settings: ConnectElementSettings): EntityInstance {
	const { relatingElement, relatedElement } = settings;
	const description = settings.description ?? null;

	const incompatibleConnections = new EntityInstanceSet();
	for (const rel of (relatingElement.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		if (
			rel.isA() === "IfcRelConnectsElements" &&
			(rel.get("RelatingElement") as EntityInstance).equals(relatedElement)
		) {
			incompatibleConnections.add(rel);
		}
	}
	for (const rel of (relatedElement.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		if (
			rel.isA() === "IfcRelConnectsElements" &&
			(rel.get("RelatedElement") as EntityInstance).equals(relatingElement)
		) {
			incompatibleConnections.add(rel);
		}
	}
	for (const connection of incompatibleConnections.values()) {
		const history = connection.get("OwnerHistory") as EntityInstance | null;
		file.remove(connection);
		if (history) elementUtil.removeDeep2(file, history);
	}

	for (const rel of (relatingElement.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		if (
			rel.isA() === "IfcRelConnectsElements" &&
			(rel.get("RelatedElement") as EntityInstance).equals(relatedElement)
		) {
			rel.set("Description", description);
			return rel;
		}
	}

	return file.createEntity(
		"IfcRelConnectsElements",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		description,
		null, // ConnectionGeometry
		relatingElement,
		relatedElement,
	);
}

/**
 * Connects two elements together (Python: `ifcopenshell.api.geometry.connect_element`).
 *
 * Creates a new `IfcRelConnectsElements`, or updates the `Description` of an existing
 * one if the two elements are already connected in the requested direction. Any
 * existing connection in the OPPOSITE direction is purged first. See this file's own
 * header comment for the full, real Python order of operations and its exact-class
 * (non-subtype-inclusive) matching quirk.
 */
export const connectElement = wrapUsecase("geometry.connect_element", connectElementUsecase);
