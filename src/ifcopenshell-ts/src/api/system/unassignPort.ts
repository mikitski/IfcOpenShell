// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/unassign_port.py` (src/ifcopenshell-python, 86
// lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own header
// comment). Real Python structures this as a `Usecase` class with an
// `execute`/`execute_ifc2x3` method pair, dispatching once on `self.file.schema` --
// ported as two plain functions (`unassignPortNonIfc2x3`/`unassignPortIfc2x3`) threading
// `file`/settings through explicitly, matching this project's established "no `class
// Usecase`, plain functions" convention (see e.g. `../material/assignMaterial.ts`).
//
// --- IFC4+ (`execute`): `IfcRelNests` ---
//
// Walks `element.IsNestedBy`, looking for the rel whose `RelatedObjects` actually
// contains `port`. Ported verbatim, including a real, easy-to-miss detail: after
// finding and handling that rel (whether by deleting it outright, when `port` was the
// SOLE nested object, or by rewriting `RelatedObjects` to drop just `port`, when other
// objects remain), real Python's own loop does NOT `break`/`return` early in the
// multi-member case -- it keeps iterating over any REMAINING rels in `IsNestedBy`
// (harmless in practice, since a port is only ever nested under one rel at a time, but
// ported as the exact same non-short-circuiting `for` loop, not "optimized" with an
// early exit that isn't actually in the real source for that branch).
//
// --- IFC2X3 (`execute_ifc2x3`): `IfcRelConnectsPortToElement` ---
//
// `IfcRelNests` doesn't exist on IFC2X3 at all (confirmed absent from `ifc2x3.d.ts`) --
// port-to-element assignment used the dedicated `IfcRelConnectsPortToElement` class
// instead, via the port's own `HasPorts` inverse (confirmed: IFC2X3's `IfcElement`
// declares `HasPorts: IfcRelConnectsPortToElement[]`, a class-specific inverse name,
// not the generic `IsNestedBy`/`Nests` pair IFC4+ uses for nesting in general).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface UnassignPortSettings {
	/** The `IfcDistributionElement` to unassign the port from. */
	element: EntityInstance;
	/** The `IfcDistributionPort` you want to unassign. */
	port: EntityInstance;
}

function unassignPortIfc2x3(file: IfcFile, settings: UnassignPortSettings): void {
	const { element, port } = settings;
	for (const rel of (element.get("HasPorts") as EntityInstance[] | null) ?? []) {
		if ((rel.get("RelatingPort") as EntityInstance).equals(port)) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
			return;
		}
	}
}

function unassignPortNonIfc2x3(file: IfcFile, settings: UnassignPortSettings): void {
	const { element, port } = settings;
	for (const rel of (element.get("IsNestedBy") as EntityInstance[] | null) ?? []) {
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		if (relatedObjects.some((o) => o.equals(port))) {
			if (relatedObjects.length === 1) {
				const history = rel.get("OwnerHistory") as EntityInstance | null;
				file.remove(rel);
				if (history) elementUtil.removeDeep2(file, history);
				return;
			}
			const remaining = relatedObjects.filter((o) => !o.equals(port));
			rel.set("RelatedObjects", remaining);
			updateOwnerHistory(file, { element: rel });
			// No early return here -- see this file's own header comment: real Python's
			// loop keeps iterating over any remaining `IsNestedBy` rels in this branch too.
		}
	}
}

function unassignPortUsecase(file: IfcFile, settings: UnassignPortSettings): void {
	if (file.schema === "IFC2X3") {
		unassignPortIfc2x3(file, settings);
		return;
	}
	unassignPortNonIfc2x3(file, settings);
}

/**
 * Unassigns a port to an element (Python: `ifcopenshell.api.system.unassign_port`).
 *
 * Ports are typically always assigned to a distribution element, but in some edge
 * cases you may want to unassign the port to create an orphaned port for cleaning or
 * patching purposes.
 *
 * @example
 * ```ts
 * // Create a duct
 * const duct = api.root.createEntity(model, { ifcClass: "IfcDuctSegment", predefinedType: "RIGIDSEGMENT" });
 *
 * // Create 2 ports, one for either end.
 * const port1 = api.system.addPort(model, { element: duct });
 * const port2 = api.system.addPort(model, { element: duct });
 *
 * // Unassign one port for some weird reason.
 * api.system.unassignPort(model, { element: duct, port: port1 });
 * ```
 */
export const unassignPort = wrapUsecase("system.unassign_port", unassignPortUsecase);
