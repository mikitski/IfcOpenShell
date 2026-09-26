// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/disconnect_path.py` (src/ifcopenshell-python, 64
// lines) -- part of this chunk's 8-file `api.geometry` addition (see `./index.ts`'s own
// header comment). Verified directly: this file's only import is
// `ifcopenshell.util.element` (`remove_deep2`, already landed) -- no
// kernel/matrix-math dependency.
//
// Two mutually-exclusive calling conventions, matching real Python's own docstring
// exactly:
// 1. `element` + `connectionType`: disconnects every `IfcRelConnectsPathElements`
//    where `element`'s OWN endpoint slot (`RelatingConnectionType` via `ConnectedTo`,
//    or `RelatedConnectionType` via `ConnectedFrom`) equals `connectionType` --
//    regardless of what's on the OTHER end.
// 2. `relatingElement` + `relatedElement`: disconnects every `IfcRelConnectsPathElements`
//    from `relatingElement` to `relatedElement` specifically (direction matters -- see
//    `test_that_order_matters`, ported below).
// A THIRD case -- neither combination fully supplied -- throws, matching real Python's
// own `raise ValueError(...)` with the identical message shape (interpolating whatever
// was actually passed, `None` included).
//
// **Real, unguarded `null` dereference preserved verbatim**: the `elif related_element:`
// branch checks only `related_element`'s own truthiness, never `relating_element`'s --
// real Python would raise a plain `AttributeError` reading `None.ConnectedTo` if a
// caller passed `related_element` without `relating_element`. This port reproduces the
// identical crash (a `TypeError`/`Cannot read properties of null` calling `.get(...)`
// on a `null` `relatingElement`), rather than adding a defensive guard real Python
// itself doesn't have.
//
// Subtype-INCLUSIVE `isA("IfcRelConnectsPathElements")` checks throughout -- a real,
// deliberate CONTRAST to `./disconnectElement.ts`'s/`./connectElement.ts`'s own
// exact-class-only `isA() === "..."` checks (see those files' own header comments for
// the full writeup of that distinction, verified per-file against each real Python
// source rather than assumed uniform across this whole chunk).
//
// Identity-keyed `set()` (`connections`), matching this project's established
// `EntityInstanceSet` convention (duplicated per-file, not imported -- see
// `./removeRepresentation.ts`'s own identical helper's doc comment for why).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

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

export interface DisconnectPathSettings {
	/** The element whose OWN endpoint connection(s) of `connectionType` should be disconnected. Used together with `connectionType`. */
	element?: EntityInstance | null;
	/** The connection type (e.g. `"ATSTART"`/`"ATEND"`) to disconnect from `element`. Used together with `element`. */
	connectionType?: string | null;
	/** The relating element of the specific connection to disconnect. Used together with `relatedElement`. */
	relatingElement?: EntityInstance | null;
	/** The related element of the specific connection to disconnect. Used together with `relatingElement`. */
	relatedElement?: EntityInstance | null;
}

function disconnectPathUsecase(file: IfcFile, settings: DisconnectPathSettings): void {
	const { element, connectionType, relatingElement, relatedElement } = settings;
	const connections = new EntityInstanceSet();

	if (connectionType && element) {
		for (const r of (element.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
			if (r.isA("IfcRelConnectsPathElements") && r.get("RelatingConnectionType") === connectionType) {
				connections.add(r);
			}
		}
		for (const r of (element.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
			if (r.isA("IfcRelConnectsPathElements") && r.get("RelatedConnectionType") === connectionType) {
				connections.add(r);
			}
		}
	} else if (relatedElement) {
		// Real Python's own unguarded `relating_element.ConnectedTo` -- see this file's
		// header comment for why `relatingElement` being `null`/`undefined` here is
		// deliberately left to crash, matching real Python's own `AttributeError`.
		// biome-ignore lint/style/noNonNullAssertion: matches real Python's own unguarded `relating_element.ConnectedTo` access -- see this file's header comment.
		for (const r of (relatingElement!.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
			if (r.isA("IfcRelConnectsPathElements") && (r.get("RelatedElement") as EntityInstance).equals(relatedElement)) {
				connections.add(r);
			}
		}
	} else {
		throw new Error(
			`Either provide \`element\` and \`connectionType\`, or provide \`relatingElement\` and \`relatedElement\`. Got: element=${element}, connectionType=${connectionType}, relatingElement=${relatingElement}, relatedElement=${relatedElement}.`,
		);
	}

	for (const connection of connections.values()) {
		const history = connection.get("OwnerHistory") as EntityInstance | null;
		file.remove(connection);
		if (history) elementUtil.removeDeep2(file, history);
	}
}

/**
 * Disconnects a path-based connection previously created via `api.geometry.connectPath`
 * (Python: `ifcopenshell.api.geometry.disconnect_path`).
 *
 * There are two ways to use this: provide `element` (connected from) and
 * `connectionType` that should be disconnected, or provide the connected elements to
 * disconnect explicitly (`relatingElement`/`relatedElement`, direction matters). Throws
 * if neither combination is fully supplied.
 */
export const disconnectPath = wrapUsecase("geometry.disconnect_path", disconnectPathUsecase);
