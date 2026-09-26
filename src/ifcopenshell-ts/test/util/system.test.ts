// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_system.py` (src/ifcopenshell-python) -- covers
// `TestValidateGroupTypes`, `TestIsAssignable`, `TestGetSystemElements`,
// `TestGetElementSystems` (both cases), `TestGetPorts`/`TestGetPortsIFC2X3`,
// `TestGetConnectedPort`, `TestGetConnectedToFrom`/`TestGetConnectedToFromIFC2X3`.
// `get_element_zones` has no dedicated Python test class in `test_system.py` at all
// (confirmed by reading the whole file) -- the coverage for it below is original,
// mirroring `TestGetElementSystems`'s own shape, matching `util/element.ts`'s
// established precedent for functions Python itself doesn't directly test.
//
// Python's own fixtures go through `ifcopenshell.api.root.create_entity`/
// `ifcopenshell.api.system.add_system`/`assign_system`/`assign_port`/`connect_port`,
// none of which exist yet in this TS port (`api` is Phase 6+). Local fixture helpers
// below build the same underlying entity graphs directly (`file.createEntity(...)` +
// `.set(...)`), matching `test/util/element.test.ts`/`test/util/selector.test.ts`'s own
// established pattern for this exact same gap. Two real, schema-dependent findings
// confirmed empirically against the real built addon (not assumed from the Python
// source's naming alone) while building `nestOrConnectPort` below:
// - `IfcDistributionPort`/`IfcFlowSegment` declare NO `Nests`/`IsNestedBy` inverse
//   attribute at all in IFC2X3 (`IfcRelNests` itself is an IFC4+ concept) -- so
//   `get_ports`'s primary path (`IsNestedBy`) is unreachable there by construction, not
//   merely unused; the `HasPorts`/`ContainedIn` (`IfcRelConnectsPortToElement`) fallback
//   is IFC2X3's only route, matching Python's own "IFC2X3 only, deprecated in IFC4"
//   comment on that fallback.
// - Conversely, `HasPorts`/`ContainedIn` remain declared in IFC4 *and* IFC4X3 too (not
//   actually removed from the schema, despite being "deprecated") -- this port's own
//   fixture helper uses schema-appropriate wiring per `AVAILABLE_SCHEMAS` entry to match
//   Python's real usage convention per schema, not because IFC4/IFC4X3 structurally
//   reject the legacy relationship.
//
// `TestGetConnectedToFrom`'s Python original reuses one `connect_port(..., direction=)`
// call to mutate an existing connection between two ports and re-asserts the reversed
// direction's results -- this port instead builds two independent fixtures (one per
// direction), which exercises the exact same `getConnectedTo`/`getConnectedFrom` logic
// without needing to model `connect_port`'s own (not-yet-ported) "replace the existing
// IfcRelConnectsPorts" mutation semantics.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import {
	declaration as NativeDeclarationCtor,
	type entity as NativeEntity,
} from "../../src/native/ifcopenshell_native";
import * as schema from "../../src/util/schema";
import * as subject from "../../src/util/system";
import { AVAILABLE_SCHEMAS, type Schema, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header
// comment) ---

function assignGroup(file: IfcFile, group: EntityInstance, elements: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToGroup");
	rel.set("RelatingGroup", group);
	rel.set("RelatedObjects", elements);
	return rel;
}

function nestPort(file: IfcFile, element: EntityInstance, ports: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelNests");
	rel.set("RelatingObject", element);
	rel.set("RelatedObjects", ports);
	return rel;
}

function connectPortToElement(file: IfcFile, port: EntityInstance, element: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelConnectsPortToElement");
	rel.set("RelatingPort", port);
	rel.set("RelatedElement", element);
	return rel;
}

/** IFC2X3 has no `IfcRelNests`-based port nesting at all (see this file's header
 * comment) -- use the legacy `IfcRelConnectsPortToElement` wiring there, and the modern
 * `IfcRelNests` wiring for IFC4/IFC4X3, matching Python's own real per-schema usage
 * convention. */
function nestOrConnectPort(file: IfcFile, schemaName: Schema, element: EntityInstance, port: EntityInstance): void {
	if (schemaName === "IFC2X3") {
		connectPortToElement(file, port, element);
	} else {
		nestPort(file, element, [port]);
	}
}

function connectPorts(file: IfcFile, relatingPort: EntityInstance, relatedPort: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelConnectsPorts");
	rel.set("RelatingPort", relatingPort);
	rel.set("RelatedPort", relatedPort);
	return rel;
}

/** Same verified, disclosed pointer-reinterpret technique `src/util/schema.ts`'s own
 * (non-exported) `entityName` uses, and `test/util/schema.test.ts`'s own duplicate of
 * it -- `entity`'s TS class has no public `.name()`. */
function entityName(entity: NativeEntity): string {
	return new NativeDeclarationCtor(entity._handle).name();
}

function ids(instances: Iterable<EntityInstance>): number[] {
	return [...instances].map((i) => i.id()).sort((a, b) => a - b);
}

// --- TestValidateGroupTypes ---

describe("util.system GROUP_TYPES covers every real IfcSystem subtype", () => {
	test.each(AVAILABLE_SCHEMAS)("%s", (schemaName) => {
		const file = createTestFile(schemaName);
		const systemDeclaration = file.nativeFile.schema().declaration_by_name_with_name("IfcSystem").as_entity();
		expect(systemDeclaration).not.toBeNull();
		const subtypes = schema.getSubtypes(systemDeclaration as NonNullable<typeof systemDeclaration>);
		const missing = subtypes.map(entityName).filter((name) => !(name in subject.GROUP_TYPES));
		expect(missing).toEqual([]);
	});
});

// --- TestIsAssignable ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.system isAssignable", () => {
	test("a system-assignable class is assignable to a system, and vice versa isn't", () => {
		const file = createTestFile("IFC4");
		const project = file.createEntity("IfcProject");
		const system = file.createEntity("IfcSystem");
		const pump = file.createEntity("IfcPump");
		expect(subject.isAssignable(pump, system)).toBe(true);
		expect(subject.isAssignable(project, system)).toBe(false);
		expect(subject.isAssignable(pump, project)).toBe(false);
	});
});

// --- TestGetSystemElements ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.system getSystemElements", () => {
	test("returns every element grouped by the system's IsGroupedBy", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcPump");
		const system = file.createEntity("IfcSystem");
		assignGroup(file, system, [element]);
		const results = subject.getSystemElements(system);
		expect(results).toHaveLength(1);
		expect(results[0].equals(element)).toBe(true);
	});
});

// --- TestGetElementSystems ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.system getElementSystems", () => {
	test("returns the IfcSystem the element is assigned to", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcPump");
		const system = file.createEntity("IfcSystem");
		assignGroup(file, system, [element]);
		const results = subject.getElementSystems(element);
		expect(results).toHaveLength(1);
		expect(results[0].equals(system)).toBe(true);
	});

	test("excludes a plain IfcGroup, and IfcZone/IfcStructuralAnalysisModel despite being IfcSystem subtypes", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcPump");
		assignGroup(file, file.createEntity("IfcGroup"), [element]);
		assignGroup(file, file.createEntity("IfcZone"), [element]);
		assignGroup(file, file.createEntity("IfcStructuralAnalysisModel"), [element]);
		expect(subject.getElementSystems(element)).toEqual([]);
	});
});

// --- getElementZones -- original coverage, no Python test counterpart (see this file's
// header comment) ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.system getElementZones", () => {
	test("returns the IfcZone the element is assigned to", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcSpace");
		const zone = file.createEntity("IfcZone");
		assignGroup(file, zone, [element]);
		const results = subject.getElementZones(element);
		expect(results).toHaveLength(1);
		expect(results[0].equals(zone)).toBe(true);
	});

	test("excludes a plain IfcGroup and an IfcSystem", () => {
		const file = createTestFile("IFC4");
		const element = file.createEntity("IfcSpace");
		assignGroup(file, file.createEntity("IfcGroup"), [element]);
		assignGroup(file, file.createEntity("IfcSystem"), [element]);
		expect(subject.getElementZones(element)).toEqual([]);
	});
});

// --- TestGetPorts / TestGetPortsIFC2X3 ---

describe.each(AVAILABLE_SCHEMAS)("util.system getPorts (%s)", (schemaName) => {
	test("returns the port nested under (or connected to) the element", () => {
		const file = createTestFile(schemaName);
		const port = file.createEntity("IfcDistributionPort");
		const element = file.createEntity("IfcFlowSegment");
		nestOrConnectPort(file, schemaName, element, port);
		const results = subject.getPorts(element);
		expect(results).toHaveLength(1);
		expect(results[0].equals(port)).toBe(true);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.system getPorts flow-direction filter", () => {
	test("filters by FlowDirection when given", () => {
		const file = createTestFile("IFC4");
		const source = file.createEntity("IfcDistributionPort");
		source.set("FlowDirection", "SOURCE");
		const sink = file.createEntity("IfcDistributionPort");
		sink.set("FlowDirection", "SINK");
		const element = file.createEntity("IfcFlowSegment");
		nestPort(file, element, [source, sink]);

		expect(
			subject
				.getPorts(element)
				.map((p) => p.id())
				.sort(),
		).toEqual([sink.id(), source.id()].sort());
		const filtered = subject.getPorts(element, "SOURCE");
		expect(filtered).toHaveLength(1);
		expect(filtered[0].equals(source)).toBe(true);
	});
});

// --- TestGetConnectedPort ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.system getConnectedPort", () => {
	test("resolves the other port from either side of an IfcRelConnectsPorts", () => {
		const file = createTestFile("IFC4");
		const port1 = file.createEntity("IfcDistributionPort");
		const port2 = file.createEntity("IfcDistributionPort");
		connectPorts(file, port1, port2);

		expect(subject.getConnectedPort(port1)?.equals(port2)).toBe(true);
		expect(subject.getConnectedPort(port2)?.equals(port1)).toBe(true);
	});

	test("returns null when the port has no connection", () => {
		const file = createTestFile("IFC4");
		const port = file.createEntity("IfcDistributionPort");
		expect(subject.getConnectedPort(port)).toBeNull();
	});
});

// --- TestGetConnectedToFrom / TestGetConnectedToFromIFC2X3 ---

describe.each(AVAILABLE_SCHEMAS)("util.system getConnectedTo / getConnectedFrom (%s)", (schemaName) => {
	test("a SOURCE-direction connection: connected-to resolves downstream, connected-from resolves upstream", () => {
		const file = createTestFile(schemaName);
		const port1 = file.createEntity("IfcDistributionPort");
		const element1 = file.createEntity("IfcFlowSegment");
		nestOrConnectPort(file, schemaName, element1, port1);
		const port2 = file.createEntity("IfcDistributionPort");
		const element2 = file.createEntity("IfcFlowSegment");
		nestOrConnectPort(file, schemaName, element2, port2);
		connectPorts(file, port1, port2);

		expect(ids(subject.getConnectedTo(element1))).toEqual([element2.id()]);
		expect(subject.getConnectedFrom(element1)).toEqual([]);
		expect(subject.getConnectedTo(element2)).toEqual([]);
		expect(ids(subject.getConnectedFrom(element2))).toEqual([element1.id()]);
	});

	test("the reverse (SINK-direction) connection swaps which side is upstream/downstream", () => {
		const file = createTestFile(schemaName);
		const port1 = file.createEntity("IfcDistributionPort");
		const element1 = file.createEntity("IfcFlowSegment");
		nestOrConnectPort(file, schemaName, element1, port1);
		const port2 = file.createEntity("IfcDistributionPort");
		const element2 = file.createEntity("IfcFlowSegment");
		nestOrConnectPort(file, schemaName, element2, port2);
		// Reversed relative to the SOURCE-direction test above: port2 is now RelatingPort.
		connectPorts(file, port2, port1);

		expect(subject.getConnectedTo(element1)).toEqual([]);
		expect(ids(subject.getConnectedFrom(element1))).toEqual([element2.id()]);
		expect(ids(subject.getConnectedTo(element2))).toEqual([element1.id()]);
		expect(subject.getConnectedFrom(element2)).toEqual([]);
	});
});
