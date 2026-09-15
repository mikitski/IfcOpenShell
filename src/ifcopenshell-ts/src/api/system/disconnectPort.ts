// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/disconnect_port.py` (src/ifcopenshell-python, 73
// lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own header
// comment). A port may only be connected to one other port at a time (see
// `./connectPort.ts`'s own header comment), so no "other port" argument is needed here
// -- this simply removes every `IfcRelConnectsPorts` referencing `port` (as either
// `RelatingPort`, via `ConnectedTo`, or `RelatedPort`, via `ConnectedFrom`), clearing
// BOTH ends' `FlowDirection` back to `null` first.
//
// Real Python: `rels = port.ConnectedTo or (); rels += port.ConnectedFrom or ()` --
// concatenates both inverse tuples into one combined loop (in practice at most one of
// the two is ever non-empty for a given port at a time, per `./connectPort.ts`'s own
// "ports may only have one connection" invariant, but this loops over both regardless,
// matching real Python exactly rather than assuming which one is populated).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface DisconnectPortSettings {
	/** The `IfcDistributionPort` to disconnect. */
	port: EntityInstance;
}

function disconnectPortUsecase(file: IfcFile, settings: DisconnectPortSettings): void {
	const { port } = settings;
	const rels: EntityInstance[] = [
		...((port.get("ConnectedTo") as EntityInstance[] | null) ?? []),
		...((port.get("ConnectedFrom") as EntityInstance[] | null) ?? []),
	];

	for (const rel of rels) {
		(rel.get("RelatingPort") as EntityInstance).set("FlowDirection", null);
		(rel.get("RelatedPort") as EntityInstance).set("FlowDirection", null);
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
}

/**
 * Disconnects a port from any other port (Python:
 * `ifcopenshell.api.system.disconnect_port`).
 *
 * A port may only be connected to one other port, so the other port is not needed to
 * be specified.
 *
 * @example
 * ```ts
 * // A completely empty distribution system
 * const system = api.system.addSystem(model, {});
 *
 * // Create a duct and a 90 degree bend fitting
 * const duct = api.root.createEntity(model, { ifcClass: "IfcDuctSegment", predefinedType: "RIGIDSEGMENT" });
 * const fitting = api.root.createEntity(model, { ifcClass: "IfcDuctFitting", predefinedType: "BEND" });
 *
 * // The duct and fitting is part of the system
 * api.system.assignSystem(model, { products: [duct], system });
 * api.system.assignSystem(model, { products: [fitting], system });
 *
 * // Create 2 ports, one for either end of both the duct and fitting.
 * const ductPort1 = api.system.addPort(model, { element: duct });
 * const ductPort2 = api.system.addPort(model, { element: duct });
 * const fittingPort1 = api.system.addPort(model, { element: fitting });
 * const fittingPort2 = api.system.addPort(model, { element: fitting });
 *
 * // Connect the duct and fitting together. At this point, we have not yet
 * // determined the direction of the flow, so we leave direction as NOTDEFINED.
 * api.system.connectPort(model, { port1: ductPort2, port2: fittingPort1 });
 *
 * // Disconnect the port. note we could've equally disconnected fittingPort1 instead
 * // of ductPort2
 * api.system.disconnectPort(model, { port: ductPort2 });
 * ```
 */
export const disconnectPort = wrapUsecase("system.disconnect_port", disconnectPortUsecase);
