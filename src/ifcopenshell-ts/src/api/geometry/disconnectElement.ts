// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/disconnect_element.py` (src/ifcopenshell-python, 55
// lines) -- part of this chunk's 8-file `api.geometry` addition (see `./index.ts`'s own
// header comment). Verified directly: this file's only import is
// `ifcopenshell.util.element` (`remove_deep2`, already landed) -- no kernel/matrix-math
// dependency.
//
// Purges every `IfcRelConnectsElements` connecting `relatingElement`/`relatedElement`
// (in EITHER direction) via `IfcElement`'s own `ConnectedTo`/`ConnectedFrom` inverse
// attributes. Real Python's own top-of-file comment, ported verbatim: "arguments
// relating_element, related_element probably should be renamed to element1, element2
// as api call doesn't really treat them as 'relating' and 'related' and just purging
// all connections between them" -- i.e. despite the parameter names, this is a fully
// symmetric, order-independent disconnect (see `test_order_does_not_matter` below).
//
// **Exact-class match, NOT subtype-inclusive -- a real, load-bearing distinction from
// `./connectPath.ts`/`./disconnectPath.ts`'s own `isA("IfcRelConnectsPathElements")`
// checks, verified against the real Python source rather than assumed uniform.** Real
// Python checks `rel.is_a() == "IfcRelConnectsElements"` (a no-argument `is_a()` call,
// returning the exact class name, compared with `==`) -- NOT `rel.is_a("IfcRelConnects
// Elements")` (Python's own subtype-inclusive form). This means a real subtype like
// `IfcRelConnectsWithRealizingElements` (an `IfcRelConnectsElements` subtype in real
// IFC schemas) is deliberately NOT matched/purged here, even though it would satisfy a
// subtype-inclusive `isA(...)` check. Ported with `rel.isA() === "IfcRelConnectsElements"`
// (this port's own zero-argument `isA()` overload, matching Python's `is_a()` with no
// arguments exactly per `entityInstance.ts`'s own `isA` overload set) -- NOT
// `rel.isA("IfcRelConnectsElements")`, which would be a real behavior change.
//
// Identity-keyed `set()` (`incompatible_connections`), matching this project's
// established `EntityInstanceSet` convention (duplicated per-file, not imported -- see
// `./removeRepresentation.ts`'s own identical helper's doc comment for why).

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

export interface DisconnectElementSettings {
	/** One of the two connected `IfcElement`s. Despite the name, treated symmetrically -- see this file's header comment. */
	relatingElement: EntityInstance;
	/** The other connected `IfcElement`. */
	relatedElement: EntityInstance;
}

function disconnectElementUsecase(file: IfcFile, settings: DisconnectElementSettings): void {
	const { relatingElement, relatedElement } = settings;
	const incompatibleConnections = new EntityInstanceSet();

	for (const rel of (relatingElement.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		if (
			rel.isA() === "IfcRelConnectsElements" &&
			(rel.get("RelatedElement") as EntityInstance).equals(relatedElement)
		) {
			incompatibleConnections.add(rel);
		}
	}
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
	for (const rel of (relatedElement.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		if (
			rel.isA() === "IfcRelConnectsElements" &&
			(rel.get("RelatingElement") as EntityInstance).equals(relatingElement)
		) {
			incompatibleConnections.add(rel);
		}
	}

	for (const connection of incompatibleConnections.values()) {
		const history = connection.get("OwnerHistory") as EntityInstance | null;
		file.remove(connection);
		if (history) elementUtil.removeDeep2(file, history);
	}
}

/**
 * Disconnects two elements previously connected via `api.geometry.connectElement`
 * (Python: `ifcopenshell.api.geometry.disconnect_element`).
 *
 * Removes every exact `IfcRelConnectsElements` relationship between the two elements,
 * in either direction -- a real subtype like `IfcRelConnectsWithRealizingElements` is
 * NOT matched (see this file's header comment). A no-op if the two elements aren't
 * connected.
 */
export const disconnectElement = wrapUsecase("geometry.disconnect_element", disconnectElementUsecase);
