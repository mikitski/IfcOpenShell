// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/context/remove_context.py` (src/ifcopenshell-python, 67
// lines) -- removes a context, recursively removing its subcontexts first. Two real
// branches, both ported verbatim:
//
// 1. **The context has a `ParentContext` (i.e. it's a subcontext).** Any inverse
//    reference to the subcontext is reassigned to its parent first (an
//    `IfcCoordinateOperation`'s `SourceCRS` is instead nulled out via a
//    self-swap-then-`removeDeep2` trick, so the coordinate operation can be safely
//    deep-removed without also destroying the still-wanted parent context it would
//    otherwise transitively reference), then the subcontext itself is removed. No
//    `api.geometry` dependency in this branch at all.
// 2. **The context has NO `ParentContext` (i.e. it's a top-level context).** Every
//    representation that was in this context gets unassigned from whatever
//    product/type used it (`geometry.unassignRepresentation`) and then removed
//    (`geometry.removeRepresentation`) -- this is the one branch that needs
//    `api.geometry`, ported alongside as a minimal dependency (see
//    `../geometry/unassignRepresentation.ts`'s own header comment for the full
//    disclosure of what's ported vs. still missing from that module).
//
// `getattr(context, "ParentContext", None)` is a real, load-bearing soft attribute
// read: a top-level `IfcGeometricRepresentationContext` doesn't declare `ParentContext`
// at all (only `IfcGeometricRepresentationSubContext` does), so a direct, unguarded
// `.get("ParentContext")` would throw "has no attribute" for exactly the class this
// branch needs to distinguish -- reproduced below via a small local `attrOrNull`
// try/catch helper, matching `util/representation.ts`'s identical private helper's own
// technique (duplicated per module, not imported, per this project's established
// per-module-private-helper convention).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { removeRepresentation } from "../geometry/removeRepresentation";
import { unassignRepresentation } from "../geometry/unassignRepresentation";
import { wrapUsecase } from "../hooks";

/** Python's `getattr(instance, name, None)` -- soft attribute access for a class that may not declare `name` at all. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

export interface RemoveContextSettings {
	/** The `IfcGeometricRepresentationContext` (or SubContext) entity to remove. */
	context: EntityInstance;
}

function removeContextUsecase(file: IfcFile, settings: RemoveContextSettings): void {
	const { context } = settings;

	for (const subcontext of context.get("HasSubContexts") as EntityInstance[]) {
		// Recurses through the wrapped, exported `removeContext` below (not this plain
		// `removeContextUsecase`) -- matching real Python's own recursive call
		// (`ifcopenshell.api.context.remove_context(file, context=subcontext)`, the
		// module-level, listener-wrapped name), so pre/post-listeners genuinely fire once
		// per subcontext removed, not just once for the top-level call.
		removeContext(file, { context: subcontext });
	}

	const parentContext = attrOrNull(context, "ParentContext") as EntityInstance | null;
	if (parentContext) {
		const newContext = parentContext;
		for (const inverse of file.getInverse(context) as Set<EntityInstance>) {
			if (inverse.isA("IfcCoordinateOperation")) {
				// Trick to make sure the coordinate operation is not referenced by a
				// context so we can delete it safely.
				inverse.set("SourceCRS", inverse.get("TargetCRS"));
				elementUtil.removeDeep2(file, inverse);
			} else {
				elementUtil.replaceAttribute(inverse, context, newContext);
			}
		}
		file.remove(context);
	} else {
		const representationsInContext = [...(context.get("RepresentationsInContext") as EntityInstance[])];
		file.remove(context);
		for (const rep of representationsInContext) {
			for (const element of elementUtil.getElementsByRepresentation(file, rep)) {
				unassignRepresentation(file, { product: element, representation: rep });
			}
			removeRepresentation(file, { representation: rep });
		}
	}
}

/**
 * Removes an `IfcGeometricRepresentationContext` (Python:
 * `ifcopenshell.api.context.remove_context`).
 *
 * Any representation geometry that is assigned to the context is also removed. If a
 * context is removed, then any subcontexts are also removed.
 */
export const removeContext = wrapUsecase("context.remove_context", removeContextUsecase);
