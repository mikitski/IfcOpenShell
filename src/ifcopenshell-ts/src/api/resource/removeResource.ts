// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/remove_resource.py` (src/ifcopenshell-python, 78
// lines) -- part of this project's brand-new `api.resource` chunk (see `./index.ts`'s
// own header comment). Real Python itself flags this function with a `# TODO: review
// deep purge` comment -- ported exactly as-is, quirks included, not "cleaned up"
// beyond what the real source already does.
//
// Walks every inverse of `resource` (`file.get_inverse`, matching `../system/
// removeSystem.ts`'s own established pattern for this shape), branching on 3 possible
// inverse rel classes:
// - `IfcRelNests`: if `resource` is the rel's `RelatingObject` (i.e. `resource` is
//   itself a PARENT nesting other resources), the rel is removed and each former child
//   is recursively removed too (`removeResource` calling its own wrapped export --
//   matching `../root/removeProduct.ts`'s own established self-recursion precedent).
//   If `resource` is instead the SOLE `RelatedObjects` member of some other rel (i.e.
//   `resource` is a nested CHILD, alone), that rel is removed directly. If `resource`
//   is nested alongside OTHER objects in some rel, no explicit cleanup happens here --
//   `IfcFile.remove`'s own automatic aggregate-splice (triggered by this function's
//   own final `removeConsiderHistory(resource)` call) handles that case, exactly the
//   same reliance `removeSystem.ts`'s own header comment already discloses for its
//   structurally-identical `IfcRelAssignsToGroup` branch.
// - `IfcRelAssignsToControl`: if `resource` is the SOLE `RelatedObjects` member, the
//   rel is removed. Otherwise, `resource` is explicitly spliced out of
//   `RelatedObjects` -- ***with NO `update_owner_history` call***, a real, disclosed
//   Python inconsistency (every OTHER `RelatedObjects`-splice-in-place branch in this
//   entire `api.resource` module, e.g. `./unassignResource.ts`'s own multi-member
//   branch, bumps owner history; this one doesn't). Ported verbatim, not "fixed" to
//   match the sibling convention -- consistent with the function's own `# TODO: review
//   deep purge` self-flag.
// - `IfcRelAssignsToResource`: if `resource` is the rel's `RelatingResource` (i.e.
//   `resource` OWNS assignments to other objects), each currently-assigned related
//   object is unassigned one at a time via `./unassignResource.ts` (which itself
//   incrementally splices/removes the SAME rel -- reused directly, not reinvented). If
//   `resource` is instead the SOLE `RelatedObjects` member of some OTHER resource's
//   assignment rel, that rel is removed directly (bypassing `unassignResource`
//   entirely, matching real Python's own `remove_consider_history(inverse)` call
//   there, not `unassign_resource`).
//
// After the inverse loop: `resource.Usage` (an `IfcResourceTime`, IFC4+ only -- absent
// from `IfcConstructionResource` entirely on IFC2X3, confirmed against `ifc2x3.d.ts`)
// is removed with a bare `file.remove(...)`, NOT `removeConsiderHistory` -- correctly
// so, since `IfcResourceTime` is not an `IfcRoot` subtype and has no `OwnerHistory` of
// its own (confirmed against `ifc4.d.ts`'s `IfcResourceTime` interface: no
// `GlobalId`/`OwnerHistory` fields at all), so there is nothing to purge. Ported via
// `readAttributeOrUndefined` (this file's own `getattr(x, "Usage", None)` equivalent --
// IFC2X3 has no `Usage` attribute registered at all, so a direct `.get("Usage")` would
// throw there, exactly like Python's own unguarded `settings["resource"].Usage` would).
// Then `resource.BaseQuantity`, if any, is cleared via the already-landed
// `./removeResourceQuantity.ts`. Finally `resource` itself is removed
// (`removeConsiderHistory`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removeResourceQuantity } from "./removeResourceQuantity";
import { unassignResource } from "./unassignResource";

function removeConsiderHistory(file: IfcFile, root: EntityInstance): void {
	const history = root.get("OwnerHistory") as EntityInstance | null;
	file.remove(root);
	if (history) elementUtil.removeDeep2(file, history);
}

/** Python's `getattr(x, name, None)` -- returns `undefined` instead of throwing when
 * `name` isn't a registered attribute for `x`'s schema (e.g. `Usage` on IFC2X3). */
function readAttributeOrUndefined(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return undefined;
	}
}

/** Python's `a == (b,)` -- `RelatedObjects` is exactly the single-element tuple `(b,)`. */
function isSoleMember(list: EntityInstance[], item: EntityInstance): boolean {
	return list.length === 1 && list[0].equals(item);
}

export interface RemoveResourceSettings {
	/** The `IfcConstructionResource` to remove, along with all its relationships. */
	resource: EntityInstance;
}

function removeResourceUsecase(file: IfcFile, settings: RemoveResourceSettings): void {
	const { resource } = settings;

	// TODO: review deep purge (matching real Python's own self-flag).
	for (const inverse of file.getInverse(resource) as Set<EntityInstance>) {
		if (inverse.isA("IfcRelNests")) {
			if ((inverse.get("RelatingObject") as EntityInstance).equals(resource)) {
				// Remove rel before iterating over objects to simplify removal of
				// nested resources and avoid crashes.
				const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
				removeConsiderHistory(file, inverse);
				for (const relatedObject of relatedObjects) {
					removeResource(file, { resource: relatedObject });
				}
			} else if (isSoleMember(inverse.get("RelatedObjects") as EntityInstance[], resource)) {
				removeConsiderHistory(file, inverse);
			}
		} else if (inverse.isA("IfcRelAssignsToControl")) {
			const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
			if (relatedObjects.length === 1) {
				removeConsiderHistory(file, inverse);
			} else {
				// NOTE (disclosed Python quirk, see this file's header comment): no
				// `updateOwnerHistory` call here, unlike every sibling
				// `RelatedObjects`-splice branch in this module.
				const remaining = relatedObjects.filter((o) => !o.equals(resource));
				inverse.set("RelatedObjects", remaining);
			}
		} else if (inverse.isA("IfcRelAssignsToResource")) {
			if ((inverse.get("RelatingResource") as EntityInstance).equals(resource)) {
				for (const relatedObject of inverse.get("RelatedObjects") as EntityInstance[]) {
					unassignResource(file, { relatedObject, relatingResource: resource });
				}
			} else if (isSoleMember(inverse.get("RelatedObjects") as EntityInstance[], resource)) {
				removeConsiderHistory(file, inverse);
			}
		}
	}

	// Usage was added in IFC4.
	const usage = readAttributeOrUndefined(resource, "Usage") as EntityInstance | null | undefined;
	if (usage) file.remove(usage);
	if (resource.get("BaseQuantity")) {
		removeResourceQuantity(file, { resource });
	}
	removeConsiderHistory(file, resource);
}

/**
 * Removes a resource and all relationships (Python: `ifcopenshell.api.resource.remove_resource`).
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * // Fire our crew.
 * api.resource.removeResource(model, { resource: crew });
 * ```
 */
export const removeResource = wrapUsecase("resource.remove_resource", removeResourceUsecase);
