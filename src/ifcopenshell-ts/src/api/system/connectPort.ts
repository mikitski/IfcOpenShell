// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/connect_port.py` (src/ifcopenshell-python, 218
// lines, the largest file in this module) -- part of this project's `api.system`
// chunk (see `./index.ts`'s own header comment). No unported dependency of any kind --
// only `owner.create_owner_history`/`util.element.removeDeep2`, both already landed.
//
// Real Python structures this as a `Usecase` class holding a `self.settings` dict and
// 6 helper methods, each reading/mutating that shared dict -- ported as plain
// functions all threading `file`/`settings: ConnectPortSettings` through explicitly
// (matching this project's established "no `class Usecase`" convention, e.g.
// `../material/assignMaterial.ts`), rather than a class with instance state.
//
// --- Real Python's own topology model, verbatim from its own `execute()` comment ---
//
// "there are a number of ambiguities with port connectivity. We assume system
// topology is represented by a directed graph. In other words, SOURCEANDSINK and
// NOTDEFINED implies a two way connection, with two IfcRelConnectsPorts. SOURCE or
// SINK by itself implies a one way connection. NOTDEFINED semantically implies that
// although you may traverse the graph either direction, the direction has not been
// determined yet by the engineer. None is not allowed as a direction as we assume None
// means that no connection is made." -- reproduced here for the same reason it's in
// the real source: none of this is obvious from the code alone.
//
// --- `execute`'s exact order of operations, ported verbatim ---
//
// 1. `port1 == port2` -- no-op, return immediately (a port can't connect to itself).
// 2. `purgeExistingConnectionsToOtherPorts` -- ALWAYS runs next, unconditionally,
//    regardless of `direction`: strips away any pre-existing `ConnectedTo`/
//    `ConnectedFrom` rel on EITHER port that points at some OTHER port (not the one
//    just requested) -- a port may only ever be connected to ONE other port at a time
//    (see `./disconnectPort.ts`'s own header comment).
// 3. `FlowDirection` is set on both ports next -- `"SOURCE"`/`"SINK"` swap the two
//    ports' directions relative to each other (`port1=SOURCE`⇒`port2=SINK` and vice
//    versa); any other `direction` value (`"NOTDEFINED"`/`"SOURCEANDSINK"`, or in
//    principle any caller-supplied string at all -- there is no runtime validation
//    against a fixed enum here, matching real Python's own untyped `str` parameter) is
//    set identically on BOTH ports.
// 4. `ConnectedTo` (the `port1 -> port2` `IfcRelConnectsPorts`) is either created (if
//    missing) or left alone, for `"SOURCE"`/`"SOURCEANDSINK"`/`"NOTDEFINED"` -- or
//    purged entirely for `"SINK"` (and, per the untyped-string caveat above, for any
//    OTHER value too -- `else: purge_connected_to()` is Python's actual final
//    `else`, not `elif direction == "SINK"`).
// 5. Symmetrically, `ConnectedFrom` (the `port2 -> port1` rel) is created/left alone
//    for `"SINK"`/`"SOURCEANDSINK"`/`"NOTDEFINED"`, purged otherwise.
// 6. `setRealisingElement` -- ALWAYS runs last, unconditionally: sets `RealizingElement`
//    on every rel found via `port1.ConnectedTo`/`port1.ConnectedFrom` (both, not just
//    whichever direction was actually just created/kept) to `settings.element` --
//    including overwriting it back to `undefined`/`null` if `element` wasn't supplied
//    this call (see `test_connecting_ports_with_a_realising_element`'s own second
//    assertion, which relies on exactly this "always overwrites, even to `None`"
//    behavior).
//
// Note `setRealisingElement` (and steps 4/5's "already exists" checks) only ever look
// at `port1`'s own `ConnectedTo`/`ConnectedFrom` -- never `port2`'s -- matching real
// Python exactly; this is not an oversight; by this point in `execute()`,
// `port1`/`port2` are necessarily each other's sole connection (step 2 already purged
// anything else), so `port1.ConnectedTo`/`ConnectedFrom` fully covers both directions
// of the `port1`<->`port2` pair.
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcRelConnectsPorts`: `GlobalId`/`OwnerHistory`/`Name`/`Description`/
// `RelatingPort`/`RelatedPort`/`RealizingElement`, identical order across all 3
// schemas. `setConnectedTo`/`setConnectedFrom` create it with only the first 6
// positional args (explicit `null` for `Name`/`Description`, matching
// `../material/assignMaterial.ts`'s established convention) -- `RealizingElement` is
// deliberately left unset at creation time, matching real Python's own kwargs dict
// (which never mentions it there), always assigned afterward by `setRealisingElement`
// instead.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

export interface ConnectPortSettings {
	/** The port of the first distribution element to connect. */
	port1: EntityInstance;
	/** The port of the second distribution element to connect. */
	port2: EntityInstance;
	/**
	 * The directionality of distribution flow through the port connection.
	 * `"NOTDEFINED"` means that the direction has not yet been determined. This is
	 * useful during preliminary system design. `"SOURCE"` means that the flow is from
	 * the first element to the second element. `"SINK"` means that the flow is from
	 * the second element to the first element. `"SOURCEANDSINK"` means that flow is
	 * bi-directional between the first and second element. `SOURCEANDSINK` is a
	 * relatively rare scenario. Python default: `"NOTDEFINED"`.
	 */
	direction?: string;
	/**
	 * Optionally set an element through which the port connectivity is made, such as a
	 * segment or fitting. This is only to be used for implicit port connectivity where
	 * the segments and fittings are less important.
	 */
	element?: EntityInstance | null;
}

function removeRelWithHistory(file: IfcFile, rel: EntityInstance): void {
	const history = rel.get("OwnerHistory") as EntityInstance | null;
	file.remove(rel);
	if (history) elementUtil.removeDeep2(file, history);
}

/** Python: `Usecase.purge_existing_connections_to_other_ports`. */
function purgeExistingConnectionsToOtherPorts(file: IfcFile, port1: EntityInstance, port2: EntityInstance): void {
	for (const rel of (port1.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		if (!(rel.get("RelatedPort") as EntityInstance).equals(port2)) removeRelWithHistory(file, rel);
	}
	for (const rel of (port1.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		if (!(rel.get("RelatingPort") as EntityInstance).equals(port2)) removeRelWithHistory(file, rel);
	}
	for (const rel of (port2.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		if (!(rel.get("RelatedPort") as EntityInstance).equals(port1)) removeRelWithHistory(file, rel);
	}
	for (const rel of (port2.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		if (!(rel.get("RelatingPort") as EntityInstance).equals(port1)) removeRelWithHistory(file, rel);
	}
}

/** Python: `Usecase.set_connected_to`. */
function setConnectedTo(file: IfcFile, port1: EntityInstance, port2: EntityInstance): void {
	if ((port1.get("ConnectedTo") as EntityInstance[] | null)?.length) return;

	file.createEntity(
		"IfcRelConnectsPorts",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		port1, // RelatingPort
		port2, // RelatedPort
	);
}

/** Python: `Usecase.set_connected_from`. */
function setConnectedFrom(file: IfcFile, port1: EntityInstance, port2: EntityInstance): void {
	if ((port1.get("ConnectedFrom") as EntityInstance[] | null)?.length) return;

	file.createEntity(
		"IfcRelConnectsPorts",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		port2, // RelatingPort
		port1, // RelatedPort
	);
}

/** Python: `Usecase.purge_connected_to`. */
function purgeConnectedTo(file: IfcFile, port1: EntityInstance): void {
	for (const rel of (port1.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		removeRelWithHistory(file, rel);
	}
}

/** Python: `Usecase.purge_connected_from`. */
function purgeConnectedFrom(file: IfcFile, port1: EntityInstance): void {
	for (const rel of (port1.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		removeRelWithHistory(file, rel);
	}
}

/** Python: `Usecase.set_realising_element`. */
function setRealisingElement(port1: EntityInstance, element: EntityInstance | null | undefined): void {
	for (const rel of (port1.get("ConnectedTo") as EntityInstance[] | null) ?? []) {
		rel.set("RealizingElement", element ?? null);
	}
	for (const rel of (port1.get("ConnectedFrom") as EntityInstance[] | null) ?? []) {
		rel.set("RealizingElement", element ?? null);
	}
}

function connectPortUsecase(file: IfcFile, settings: ConnectPortSettings): void {
	const { port1, port2 } = settings;
	const direction = settings.direction ?? "NOTDEFINED";

	if (port1.equals(port2)) return;

	purgeExistingConnectionsToOtherPorts(file, port1, port2);

	if (direction === "SOURCE") {
		port1.set("FlowDirection", "SOURCE");
		port2.set("FlowDirection", "SINK");
	} else if (direction === "SINK") {
		port1.set("FlowDirection", "SINK");
		port2.set("FlowDirection", "SOURCE");
	} else {
		port1.set("FlowDirection", direction);
		port2.set("FlowDirection", direction);
	}

	if (direction === "SOURCE" || direction === "SOURCEANDSINK" || direction === "NOTDEFINED") {
		setConnectedTo(file, port1, port2);
	} else {
		purgeConnectedTo(file, port1);
	}

	if (direction === "SINK" || direction === "SOURCEANDSINK" || direction === "NOTDEFINED") {
		setConnectedFrom(file, port1, port2);
	} else {
		purgeConnectedFrom(file, port1);
	}

	setRealisingElement(port1, settings.element);
}

/**
 * Connects two ports together (Python: `ifcopenshell.api.system.connect_port`).
 *
 * A distribution element (e.g. a duct) may be connected to another distribution
 * element (e.g. a fitting) by connecting a port at one of the duct to a port at the
 * same end of the fitting.
 *
 * Ports may only have one connection, so you cannot have multiple things connected to
 * the same port. Nor can you have incompatible port connections, such as an
 * electrical port connected to an airflow port.
 *
 * Port connectivity may be explicit or implicit. Explicit connections are where the
 * port connectivity is described for every single distribution element in detail. For
 * example, a duct segment would have port connections to a duct fitting, which would
 * have port connections to another duct segment, all the way from a fan to an air
 * terminal exactly as constructed on site. Implicit connections only consider the key
 * distribution control elements (e.g. the fan and the terminal) and ignore all of the
 * details of the duct segments and fittings in between. Generally, explicit
 * connectivity is preferred for later detailed design, and implicit connectivity is
 * preferred for early phase design.
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
 * // Connect the duct and fitting together. At this point, we have not yet determined
 * // the direction of the flow, so we leave direction as NOTDEFINED.
 * api.system.connectPort(model, { port1: ductPort2, port2: fittingPort1 });
 * ```
 */
export const connectPort = wrapUsecase("system.connect_port", connectPortUsecase);
