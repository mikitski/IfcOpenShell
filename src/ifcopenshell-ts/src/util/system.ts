// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/system.py` (src/ifcopenshell-python, 155
// lines) -- one of Phase 3's four small, independent `util` Tier A chunks (`type.py`,
// `classification.py`, `constraint.py`, `system.py`). Python's own file has a
// self-referential `import ifcopenshell.util.system` and calls
// `ifcopenshell.util.system.get_ports(...)` from within the same module
// (`get_connected_to`/`get_connected_from`) -- a real, harmless Python quirk (a module
// importing itself), ported as plain same-module function calls (`getPorts(...)`), not
// reproduced as a self-import.
//
// Ported in full: `group_types` (as `GROUP_TYPES`), `FLOW_DIRECTION` (as
// `FlowDirection`), `is_assignable`, `get_system_elements`, `get_element_systems`,
// `get_element_zones`, `get_ports`, `get_connected_port`, `get_port_element`,
// `get_connected_to`, `get_connected_from`.
//
// *** Relationship to `util/selector.ts`'s pre-existing narrow re-implementations ***:
// `selector.ts` (landed before this module existed) contains disclosed, narrow, private
// local re-implementations of exactly `get_element_systems`/`get_element_zones`
// (`getElementSystemsNarrow`/`getElementZonesNarrow`) -- see that file's own header
// comment, finding #2, for the full story. `getElementSystems`/`getElementZones` below
// were verified line-by-line against those narrow versions before being written (not
// just assumed identical): both are byte-for-byte the same `HasAssignments`-filter shape
// (down to the disclosed exact-class-name-vs-subtype-inclusive `is_a()` nuance for the
// `IfcStructuralAnalysisModel`/`IfcZone` exclusion), so this chunk's own logic is the
// same as `selector.ts`'s narrow copies, just promoted to a real, exported,
// fully-documented module-level port. This PR also updates `selector.ts` to import and
// call these real functions instead of its own narrow copies, removing
// `getElementSystemsNarrow`/`getElementZonesNarrow` and their now-obsolete disclosure
// comments (see that file's own header comment for the post-cleanup state).
//
// A preserved-verbatim, disclosed Python quirk: `FLOW_DIRECTION`'s fourth literal is
// spelled `"NOTEDEFINED"` in the real Python source (`typing.Literal["SINK", "SOURCE",
// "SOURCEANDSINK", "NOTEDEFINED"]`) -- NOT `"NOTDEFINED"`, the actual
// `IfcFlowDirectionEnum` EXPRESS enumerator name. This looks like a Python-source typo
// (confirmed by reading the schema: every IFC version's `IfcFlowDirectionEnum` declares
// `NOTDEFINED`, no `NOTEDEFINED` variant exists anywhere), but per this project's
// verbatim-translation mandate it is reproduced exactly, not silently corrected -- a
// caller passing the *real* schema enumerator `"NOTDEFINED"` to `getPorts`/
// `getConnectedTo`/`getConnectedFrom`'s `flowDirection` parameter gets the same
// behavior Python does (a `FlowDirection`-typed parameter that structurally accepts the
// real enum value fine at the `!==` comparison call sites below, since none of them
// actually validate against the `FlowDirection` literal union at runtime -- only `?:`
// truthiness and `!==` comparison, both untyped-string-safe).
//
// No disclosed primitive-layer gap: every function here is a direct attribute-graph walk
// (forward `IsGroupedBy`/`HasAssignments`/`IsNestedBy`/`HasPorts`/`ConnectedTo`/
// `ConnectedFrom`/`Nests`/`ContainedIn`/`FlowDirection`), all already-bound primitives.

import type { EntityInstance } from "../entityInstance";

/** Python: `FLOW_DIRECTION = Literal["SINK", "SOURCE", "SOURCEANDSINK",
 * "NOTEDEFINED"]`. See this file's header comment for the `"NOTEDEFINED"`
 * (vs. the real schema's `"NOTDEFINED"`) verbatim-preserved quirk. */
export type FlowDirection = "SINK" | "SOURCE" | "SOURCEANDSINK" | "NOTEDEFINED";

/** Python: `group_types: dict[str, tuple[str, ...]]`. Built as a plain object plus two
 * post-literal alias assignments (`IfcDistributionCircuit`/`IfcElectricalCircuit`,
 * aliasing the same array reference as their respective base entries), matching
 * Python's own `group_types["X"] = group_types["Y"]` aliasing exactly (both entries
 * share one underlying array; harmless since every array here is only ever read, never
 * mutated after construction). */
const baseGroupTypes: Record<string, readonly string[]> = {
	IfcZone: ["IfcZone", "IfcSpace", "IfcSpatialZone"],
	IfcBuiltSystem: ["IfcBuiltElement", "IfcFurnishingElement", "IfcElementAssembly", "IfcTransportElement"],
	IfcBuildingSystem: ["IfcBuildingElement", "IfcFurnishingElement", "IfcElementAssembly", "IfcTransportElement"],
	IfcDistributionSystem: ["IfcDistributionElement"],
	IfcStructuralAnalysisModel: ["IfcStructuralMember", "IfcStructuralConnection"],
	IfcSystem: ["IfcProduct"],
	IfcGroup: ["IfcObjectDefinition"],
};
// Subclasses.
baseGroupTypes.IfcDistributionCircuit = baseGroupTypes.IfcDistributionSystem;
// Replaced by IfcDistributionCircuit in IFC4, though it wasn't limited to
// IfcDistributionElements: "Usage of IfcElectricalCircuit is as for the supertype
// IfcSystem".
baseGroupTypes.IfcElectricalCircuit = baseGroupTypes.IfcSystem;

export const GROUP_TYPES: Readonly<Record<string, readonly string[]>> = baseGroupTypes;

/** Python: `is_assignable(product: entity_instance, system: entity_instance) -> bool`. */
export function isAssignable(product: EntityInstance, system: EntityInstance): boolean {
	for (const assignable of GROUP_TYPES[system.isA()] ?? []) {
		if (product.isA(assignable)) return true;
	}
	return false;
}

/** Python: `get_system_elements(system: entity_instance) -> list[entity_instance]`. */
export function getSystemElements(system: EntityInstance): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const rel of system.get("IsGroupedBy") as EntityInstance[]) {
		results.push(...(rel.get("RelatedObjects") as EntityInstance[]));
	}
	return results;
}

/** Python: `get_element_systems(element: entity_instance) -> list[entity_instance]`. */
export function getElementSystems(element: EntityInstance): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const rel of element.get("HasAssignments") as EntityInstance[]) {
		if (!rel.isA("IfcRelAssignsToGroup")) continue;
		const group = rel.get("RelatingGroup") as EntityInstance;
		if (!group.isA("IfcSystem")) continue;
		// Python: `group.is_a() in ("IfcStructuralAnalysisModel", "IfcZone")` -- a
		// no-argument `is_a()` call compared by exact class name, deliberately NOT the
		// subtype-inclusive `is_a(name)` form used for the `IfcSystem` check above
		// (which also matches subtypes). No subtype of `IfcStructuralAnalysisModel`/
		// `IfcZone` exists in the current schema, so this distinction is latent today,
		// but ported exactly rather than approximated with `group.isA("IfcZone")`
		// (which would silently start over-excluding if such a subtype were ever
		// introduced).
		const exactClass = group.isA();
		if (exactClass === "IfcStructuralAnalysisModel" || exactClass === "IfcZone") continue;
		results.push(group);
	}
	return results;
}

/** Python: `get_element_zones(element: entity_instance) -> list[entity_instance]`. */
export function getElementZones(element: EntityInstance): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const rel of element.get("HasAssignments") as EntityInstance[]) {
		if (!rel.isA("IfcRelAssignsToGroup")) continue;
		const group = rel.get("RelatingGroup") as EntityInstance;
		if (!group.isA("IfcZone")) continue;
		results.push(group);
	}
	return results;
}

// --- internal helper (mirroring `util/element.ts`'s own `attrList` -- not exported
// from that file, so re-declared here; see that file's own doc comments for the full
// rationale, not repeated here) ---

function attrList(element: EntityInstance, name: string): EntityInstance[] {
	try {
		const value = element.get(name);
		return (value as EntityInstance[] | null) ?? [];
	} catch {
		return [];
	}
}

/**
 * Python: `get_ports(element: entity_instance, flow_direction: Optional[FLOW_DIRECTION]
 * = None) -> list[entity_instance]`.
 */
export function getPorts(element: EntityInstance, flowDirection: FlowDirection | null = null): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const rel of attrList(element, "IsNestedBy")) {
		for (const port of rel.get("RelatedObjects") as EntityInstance[]) {
			if (!port.isA("IfcDistributionPort")) continue;
			if (flowDirection && (port.get("FlowDirection") as string | null) !== flowDirection) continue;
			results.push(port);
		}
	}
	// IFC2X3 only, deprecated in IFC4.
	for (const rel of attrList(element, "HasPorts")) {
		const port = rel.get("RelatingPort") as EntityInstance;
		if (flowDirection && (port.get("FlowDirection") as string | null) !== flowDirection) continue;
		results.push(port);
	}
	return results;
}

/** Python: `get_connected_port(port: entity_instance) -> Union[entity_instance,
 * None]`. */
export function getConnectedPort(port: EntityInstance): EntityInstance | null {
	for (const rel of port.get("ConnectedTo") as EntityInstance[]) {
		return rel.get("RelatedPort") as EntityInstance;
	}
	for (const rel of port.get("ConnectedFrom") as EntityInstance[]) {
		return rel.get("RelatingPort") as EntityInstance;
	}
	return null;
}

const MISSING: unique symbol = Symbol("ifcopenshell.util.system: attribute not declared on this class");

/**
 * Python: `get_port_element(port: entity_instance) -> entity_instance`.
 *
 * Python's `hasattr(port, "Nests")`/`hasattr(port, "ContainedIn")` test whether the
 * attribute is *declared on the class*, independent of its value -- distinct from a
 * `getattr(x, name, default)` truthiness/None check. Ported via `attrOrMissing`-style
 * declared-on-class detection (catch-on-throw), not `attrList`'s "collapse to `[]`"
 * shape, to preserve that same declared-vs-not distinction.
 */
export function getPortElement(port: EntityInstance): EntityInstance | null {
	let nests: EntityInstance[] | typeof MISSING;
	try {
		nests = port.get("Nests") as EntityInstance[];
	} catch {
		nests = MISSING;
	}
	if (nests !== MISSING) {
		for (const rel of nests) {
			return rel.get("RelatingObject") as EntityInstance;
		}
		return null;
	}

	let containedIn: EntityInstance[] | typeof MISSING;
	try {
		containedIn = port.get("ContainedIn") as EntityInstance[];
	} catch {
		containedIn = MISSING;
	}
	if (containedIn !== MISSING) {
		for (const rel of containedIn) {
			return rel.get("RelatedElement") as EntityInstance;
		}
	}
	return null;
}

/**
 * Python: `get_connected_to(element: entity_instance, flow_direction:
 * Optional[FLOW_DIRECTION] = None) -> list[entity_instance]`.
 */
export function getConnectedTo(element: EntityInstance, flowDirection: FlowDirection | null = null): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const port of getPorts(element, flowDirection)) {
		for (const rel of port.get("ConnectedTo") as EntityInstance[]) {
			for (const otherPort of [rel.get("RelatedPort") as EntityInstance, rel.get("RelatingPort") as EntityInstance]) {
				if (otherPort.equals(port)) continue;
				const otherElement = getPortElement(otherPort);
				if (otherElement) results.push(otherElement);
			}
		}
	}
	return results;
}

/**
 * Python: `get_connected_from(element: entity_instance, flow_direction:
 * Optional[FLOW_DIRECTION] = None) -> list[entity_instance]`.
 */
export function getConnectedFrom(
	element: EntityInstance,
	flowDirection: FlowDirection | null = null,
): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const port of getPorts(element, flowDirection)) {
		for (const rel of port.get("ConnectedFrom") as EntityInstance[]) {
			for (const otherPort of [rel.get("RelatedPort") as EntityInstance, rel.get("RelatingPort") as EntityInstance]) {
				if (otherPort.equals(port)) continue;
				const otherElement = getPortElement(otherPort);
				if (otherElement) results.push(otherElement);
			}
		}
	}
	return results;
}
