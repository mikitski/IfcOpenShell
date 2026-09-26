// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/connect_path.py` (src/ifcopenshell-python, 84
// lines) -- part of this chunk's 8-file `api.geometry` addition (see `./index.ts`'s own
// header comment). Verified directly: this file's real imports are `ifcopenshell.api.
// owner` (`create_owner_history`, already landed), `ifcopenshell.guid` (already landed),
// and `ifcopenshell.util.element` (`remove_deep2`, already landed) -- no
// kernel/matrix-math dependency. `./connectWall.ts` calls this file's own wrapped
// export directly (real Python: `ifcopenshell.api.geometry.connect_path(...)`, a
// top-level call, not a `self.`-method call -- see that file's own header comment).
//
// **All 4 real Python "incompatible connection" loops, ported with their exact,
// individually-different conditions -- NOT simplified/unified.** Despite looking
// superficially symmetric, each loop's condition is subtly different from the others:
// - Loop 1 (`relating_element.ConnectedTo`): matches if the SAME two elements are
//   already connected in the SAME direction (`RelatedElement == related_element`,
//   unconditional on connection type) OR if `relating_element`'s own
//   `RelatingConnectionType` is a real start/end value that collides with the NEW
//   `relating_connection` (an element may only have ONE "ATSTART"/"ATEND" connection at
//   a time on a given side -- `"ATPATH"` never collides with anything, matching real
//   IFC's own "along the path" semantics for a non-endpoint connection).
// - Loop 2 (`relating_element.ConnectedFrom`): only the connection-type-collision
//   check (against `RelatedConnectionType`, the OTHER side's slot on a rel where
//   `relating_element` is itself the `RelatedElement`) -- no "same pair" check here
//   (that's Loop 4's job, from the opposite element's perspective).
// - Loop 3 (`related_element.ConnectedFrom`): symmetric to Loop 2, checking
//   `related_connection` instead.
// - Loop 4 (`related_element.ConnectedTo`): symmetric to Loop 1, checking
//   `related_connection` instead, and matching a REVERSED same-pair connection
//   (`RelatedElement == relating_element` -- i.e. an existing `related_element` ->
//   `relating_element` rel, the "cyclical connection" case; see
//   `test_preventing_cyclical_connections`, ported below).
// A real, non-obvious consequence, verified by hand-tracing the ported real Python
// tests below (not assumed): calling this twice with identical arguments does NOT
// leave the original rel alone -- Loop 1's own unconditional `RelatedElement ==
// related_element` branch always matches an existing same-pair/same-direction
// connection, so it gets PURGED and a brand new one created in its place. Real Python's
// own `test_doing_nothing_if_the_element_is_already_connected` only asserts the TOTAL
// element count is unchanged (one purged, one created), never that the original entity
// survives -- ported with that exact, narrower assertion.
//
// Identity-keyed `set()` (`incompatible_connections`), matching this project's
// established `EntityInstanceSet` convention (duplicated per-file, not imported -- see
// `./removeRepresentation.ts`'s own identical helper's doc comment for why).
//
// `IfcRelConnectsPathElements(GlobalId, OwnerHistory, Name, Description,
// ConnectionGeometry, RelatingElement, RelatedElement, RelatingPriorities,
// RelatedPriorities, RelatedConnectionType, RelatingConnectionType)` -- confirmed flat
// and identical across all 3 schemas' generated `.d.ts`s (only `OwnerHistory`'s own
// nullability differs, IFC2X3 mandatory vs. IFC4+ optional). Real Python passes
// `Description`/`ConnectionGeometry`/`RelatingElement`/`RelatedElement`/
// `RelatingConnectionType`/`RelatedConnectionType`/`RelatingPriorities`/
// `RelatedPriorities` as kwargs and leaves `Name` unset (`None`) -- ported with an
// explicit `null` at that positional slot, matching this project's established
// "kwargs-only real Python call -> positional TS call with explicit `null` gaps"
// convention (`./connectElement.ts`/`../system/connectPort.ts`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

/** See `./removeRepresentation.ts`'s own identical helper's doc comment for why this is
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

/** The real `IfcConnectionTypeEnum` values treated as "occupies an endpoint slot"
 * (`"ATPATH"`/`"NOTDEFINED"`/`"USERDEFINED"` never collide with anything here) --
 * matches real Python's own inline `["ATSTART", "ATEND"]` list literal, hoisted to a
 * module constant rather than re-allocated per loop iteration. */
const ENDPOINT_CONNECTION_TYPES: ReadonlySet<string> = new Set(["ATSTART", "ATEND"]);

export interface ConnectPathSettings {
	/** The `IfcElement` the new/updated `IfcRelConnectsPathElements.RelatingElement` will be. */
	relatingElement: EntityInstance;
	/** The `IfcElement` the new/updated `IfcRelConnectsPathElements.RelatedElement` will be. */
	relatedElement: EntityInstance;
	/** Where along `relatingElement`'s path the connection occurs. Python default: `"NOTDEFINED"`. */
	relatingConnection?: string;
	/** Where along `relatedElement`'s path the connection occurs. Python default: `"NOTDEFINED"`. */
	relatedConnection?: string;
	/** An optional free-text description of the connection. Python default: `None`. */
	description?: string | null;
	/** An optional `IfcConnectionGeometry` describing the connection in more detail. Python default: `None`. */
	connectionGeometry?: EntityInstance | null;
}

function connectPathUsecase(file: IfcFile, settings: ConnectPathSettings): EntityInstance {
	const { relatingElement, relatedElement } = settings;
	const relatingConnection = settings.relatingConnection ?? "NOTDEFINED";
	const relatedConnection = settings.relatedConnection ?? "NOTDEFINED";
	const description = settings.description ?? null;
	const connectionGeometry = settings.connectionGeometry ?? null;

	const incompatibleConnections = new EntityInstanceSet();

	for (const rel of (relatingElement.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		if (!rel.isA("IfcRelConnectsPathElements")) continue;
		if ((rel.get("RelatedElement") as EntityInstance).equals(relatedElement)) {
			incompatibleConnections.add(rel);
		} else {
			const relatingConnectionType = rel.get("RelatingConnectionType") as string;
			if (ENDPOINT_CONNECTION_TYPES.has(relatingConnectionType) && relatingConnectionType === relatingConnection) {
				incompatibleConnections.add(rel);
			}
		}
	}

	for (const rel of (relatingElement.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		if (!rel.isA("IfcRelConnectsPathElements")) continue;
		const relatedConnectionType = rel.get("RelatedConnectionType") as string;
		if (ENDPOINT_CONNECTION_TYPES.has(relatedConnectionType) && relatedConnectionType === relatingConnection) {
			incompatibleConnections.add(rel);
		}
	}

	for (const rel of (relatedElement.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		if (!rel.isA("IfcRelConnectsPathElements")) continue;
		const relatedConnectionType = rel.get("RelatedConnectionType") as string;
		if (ENDPOINT_CONNECTION_TYPES.has(relatedConnectionType) && relatedConnectionType === relatedConnection) {
			incompatibleConnections.add(rel);
		}
	}

	for (const rel of (relatedElement.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		if (!rel.isA("IfcRelConnectsPathElements")) continue;
		if ((rel.get("RelatedElement") as EntityInstance).equals(relatingElement)) {
			incompatibleConnections.add(rel);
		} else {
			const relatingConnectionType = rel.get("RelatingConnectionType") as string;
			if (ENDPOINT_CONNECTION_TYPES.has(relatingConnectionType) && relatingConnectionType === relatedConnection) {
				incompatibleConnections.add(rel);
			}
		}
	}

	for (const connection of incompatibleConnections.values()) {
		const history = connection.get("OwnerHistory") as EntityInstance | null;
		file.remove(connection);
		if (history) elementUtil.removeDeep2(file, history);
	}

	return file.createEntity(
		"IfcRelConnectsPathElements",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		description,
		connectionGeometry,
		relatingElement,
		relatedElement,
		[], // RelatingPriorities
		[], // RelatedPriorities
		relatedConnection,
		relatingConnection,
	);
}

/**
 * Connects two path-based elements (e.g. two walls, or a wall and a beam) together
 * (Python: `ifcopenshell.api.geometry.connect_path`).
 *
 * Always creates a brand new `IfcRelConnectsPathElements` -- any existing connection
 * that would become incompatible (the same pair, a colliding "ATSTART"/"ATEND" slot on
 * either side, or the exact reverse pair) is purged first. See this file's own header
 * comment for the full, real Python 4-loop incompatibility check and its non-obvious
 * "always purge-and-recreate, never update-in-place" consequence.
 */
export const connectPath = wrapUsecase("geometry.connect_path", connectPathUsecase);
