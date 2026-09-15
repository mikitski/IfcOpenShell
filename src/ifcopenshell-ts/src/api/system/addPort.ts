// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/add_port.py` (src/ifcopenshell-python, 59 lines) --
// part of this project's `api.system` chunk (see `./index.ts`'s own header comment).
// Creates a bare `IfcDistributionPort` via the already-landed `root.createEntity`,
// then -- only if `element` is supplied -- assigns it via this same module's own
// `./assignPort.ts` (a same-module sibling call, not a genuinely separate dependency;
// real Python's own `import ifcopenshell.api.system` at the top of `add_port.py` is
// this exact self-referential call, `ifcopenshell.api.system.assign_port(...)`).
//
// Note: since `assignPort` may itself throw the disclosed `editObjectPlacement`
// blocker (see `./assignPort.ts`'s own header comment and `TODOS.md`), calling
// `addPort` WITH an `element` can propagate that same throw -- but only in the exact
// scenario `assignPort` itself would already throw (the new port already has an
// `IfcLocalPlacement`, which a just-`createEntity`-d bare port never does -- see
// `./assignPort.ts`'s own disclosure for exactly when this is reachable). Calling
// `addPort` without an `element`, or with an `element` but no orphaned pre-placed
// port, is entirely unaffected.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";
import { assignPort } from "./assignPort";

export interface AddPortSettings {
	/** The `IfcDistributionElement` you want to add a distribution port to. */
	element?: EntityInstance | null;
}

function addPortUsecase(file: IfcFile, settings: AddPortSettings = {}): EntityInstance {
	const port = createEntity(file, { ifcClass: "IfcDistributionPort" });
	if (settings.element) {
		assignPort(file, { element: settings.element, port });
	}
	return port;
}

/**
 * Adds a new distribution port to an element (Python:
 * `ifcopenshell.api.system.add_port`).
 *
 * A distribution port represents a connection point on an element, where a
 * distribution element may be connected to another distribution element. For example,
 * a duct segment will typically have two ports, one at either end, because you can
 * attach another segment or fitting to either end of the duct segment.
 *
 * This will both add a distribution port and automatically assign it to a
 * distribution element.
 *
 * @returns The newly created `IfcDistributionPort`.
 *
 * @example
 * ```ts
 * // Create a duct
 * const duct = api.root.createEntity(model, { ifcClass: "IfcDuctSegment", predefinedType: "RIGIDSEGMENT" });
 *
 * // Create 2 ports, one for either end.
 * const port1 = api.system.addPort(model, { element: duct });
 * const port2 = api.system.addPort(model, { element: duct });
 * ```
 */
export const addPort = wrapUsecase("system.add_port", addPortUsecase);
