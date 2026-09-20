// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_brick.py` (src/ifcopenshell-python, 41 lines) --
// ports both real test classes: `TestGetBrickTypeIFC4` (bare `PredefinedType`-based
// lookups, plus the generic `IfcDistributionElement` -> "Equipment" fallback) and
// `TestGetBrickTypeIFC2X3` (a real `api.root.createEntity`/`api.type.assignType`-typed
// occurrence, exercising `getBrickType`'s own `getType(element)`/`IsDefinedBy` fallback
// path). Both `api.root.create_entity`/`api.type.assign_type` are already landed in
// this port (Phase 6), unlike several earlier `util` test files' own documented
// "no `api` port yet" gap -- reused directly, matching real Python's own fixture.
//
// `test_brick.py` covers `get_brick_type` only -- it has no test class for
// `get_brick_type`'s own "Brick" `IfcClassification`-reference branch (the very first
// branch in the function, checked before any JSON-table lookup) or for
// `get_element_feeds` at all. Original coverage for both, written directly against
// `brick.py`'s own source, follows below (`util/element.ts`'s/`util/system.ts`'s own
// established "no real Python test for this branch/function -- write original
// coverage" precedent).
//
// Schema-gating: `TestGetBrickTypeIFC4`'s own cases are ported unconditionally (IFC4
// is always available, matching `test/util/type.test.ts`'s/`test/util/doc.test.ts`'s
// own established precedent); `TestGetBrickTypeIFC2X3`'s case, and the original
// `getElementFeeds`/classification-branch coverage below (which needs real port
// wiring, not a specific schema concept), are gated via `AVAILABLE_SCHEMAS`/
// `describe.each`, never a hardcoded schema list.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../src/api/root/createEntity";
import { assignType } from "../../src/api/type/assignType";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/brick";
import { AVAILABLE_SCHEMAS, type Schema, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart for classification/port
// wiring -- matching `test/util/classification.test.ts`'s/`test/util/system.test.ts`'s
// own established pattern for this exact same gap) ---

function assignClassification(file: IfcFile, element: EntityInstance, reference: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesClassification");
	rel.set("RelatedObjects", [element]);
	rel.set("RelatingClassification", reference);
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

/** IFC2X3 has no `IfcRelNests`-based port nesting at all -- see `test/util/
 * system.test.ts`'s own identical helper/header-comment finding, reused verbatim. */
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

function sourcePort(file: IfcFile, schemaName: Schema, element: EntityInstance): EntityInstance {
	const port = file.createEntity("IfcDistributionPort");
	port.set("FlowDirection", "SOURCE");
	nestOrConnectPort(file, schemaName, element, port);
	return port;
}

// --- TestGetBrickTypeIFC4 ---

describe("util.brick getBrickType (IFC4)", () => {
	test("bare PredefinedType lookup, then a PredefinedType-specific override, then the generic IfcDistributionElement fallback", () => {
		const file = createTestFile("IFC4");
		let element = file.createEntity("IfcAirTerminalBox");
		expect(subject.getBrickType(element)).toBe("https://brickschema.org/schema/Brick#TerminalUnit");

		element.set("PredefinedType", "CONSTANTFLOW");
		expect(subject.getBrickType(element)).toBe("https://brickschema.org/schema/Brick#CAV");

		element = file.createEntity("IfcEngine");
		expect(subject.getBrickType(element)).toBe("https://brickschema.org/schema/Brick#Equipment");
	});
});

// --- TestGetBrickTypeIFC2X3 ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("util.brick getBrickType (IFC2X3)", () => {
	test("falls back to the element's own TYPE's bare-class lookup when the occurrence itself has no JSON-table entry", () => {
		const file = createTestFile("IFC2X3");
		const element = createEntity(file, { ifcClass: "IfcFlowController" });
		const typeElement = createEntity(file, { ifcClass: "IfcAirTerminalBoxType" });
		assignType(file, { relatedObjects: [element], relatingType: typeElement });

		expect(subject.getBrickType(element)).toBe("https://brickschema.org/schema/Brick#TerminalUnit");
	});
});

// --- Original coverage: the "Brick" IfcClassification-reference branch (no real
// Python test class covers this -- see this file's own header comment) ---

describe.each(AVAILABLE_SCHEMAS)("util.brick getBrickType -- Brick classification reference (%s)", (schemaName) => {
	test("returns the reference's own Location verbatim (NOT prefixed with the Brick schema URL) when a real 'Brick' IfcClassification reference exists", () => {
		const file = createTestFile(schemaName);
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Brick");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("ReferencedSource", classification);
		reference.set("Location", "https://brickschema.org/schema/Brick#SomeVeryCustomThing");
		const element = file.createEntity("IfcAirTerminalBox");
		assignClassification(file, element, reference);

		// Confirms this branch is checked, and wins, BEFORE the JSON-table lookup
		// that would otherwise return "...#TerminalUnit" for a bare IfcAirTerminalBox.
		expect(subject.getBrickType(element)).toBe("https://brickschema.org/schema/Brick#SomeVeryCustomThing");
	});

	test("a non-'Brick' classification system is ignored, falling through to the JSON-table lookup", () => {
		const file = createTestFile(schemaName);
		const classification = file.createEntity("IfcClassification");
		classification.set("Name", "Uniclass");
		const reference = file.createEntity("IfcClassificationReference");
		reference.set("ReferencedSource", classification);
		reference.set("Location", "Pr_70_70_66");
		const element = file.createEntity("IfcAirTerminalBox");
		assignClassification(file, element, reference);

		expect(subject.getBrickType(element)).toBe("https://brickschema.org/schema/Brick#TerminalUnit");
	});
});

// --- Original coverage: getElementFeeds (no real Python test class at all -- see
// this file's own header comment) ---

describe.each(AVAILABLE_SCHEMAS)("util.brick getElementFeeds (%s)", (schemaName) => {
	test("walks through an IfcFlowFitting, collecting downstream non-fitting/non-segment equipment", () => {
		const file = createTestFile(schemaName);
		const pumpA = file.createEntity("IfcPump");
		const portA = sourcePort(file, schemaName, pumpA);

		const fittingB = file.createEntity("IfcFlowFitting");
		const portB1 = sourcePort(file, schemaName, fittingB);
		const portB2 = sourcePort(file, schemaName, fittingB);
		connectPorts(file, portA, portB1);

		const pumpC = file.createEntity("IfcPump");
		const portC = sourcePort(file, schemaName, pumpC);
		connectPorts(file, portB2, portC);

		const feeds = subject.getElementFeeds(pumpA);
		expect(feeds.size).toBe(1);
		expect([...feeds][0]?.equals(pumpC)).toBe(true);
	});

	test("an IfcFlowSegment is also walked through, not just IfcFlowFitting", () => {
		const file = createTestFile(schemaName);
		const pumpA = file.createEntity("IfcPump");
		const portA = sourcePort(file, schemaName, pumpA);

		const segmentB = file.createEntity("IfcFlowSegment");
		const portB1 = sourcePort(file, schemaName, segmentB);
		const portB2 = sourcePort(file, schemaName, segmentB);
		connectPorts(file, portA, portB1);

		const pumpC = file.createEntity("IfcPump");
		const portC = sourcePort(file, schemaName, pumpC);
		connectPorts(file, portB2, portC);

		const feeds = subject.getElementFeeds(pumpA);
		expect(feeds.size).toBe(1);
		expect([...feeds][0]?.equals(pumpC)).toBe(true);
	});

	test("an element with no SOURCE-direction connections returns an empty set", () => {
		const file = createTestFile(schemaName);
		const pump = file.createEntity("IfcPump");
		sourcePort(file, schemaName, pump);

		expect(subject.getElementFeeds(pump).size).toBe(0);
	});

	test("branches: a fitting feeding two separate downstream equipment", () => {
		const file = createTestFile(schemaName);
		const pumpA = file.createEntity("IfcPump");
		const portA = sourcePort(file, schemaName, pumpA);

		const fittingB = file.createEntity("IfcFlowFitting");
		const portB1 = sourcePort(file, schemaName, fittingB);
		const portB2 = sourcePort(file, schemaName, fittingB);
		const portB3 = sourcePort(file, schemaName, fittingB);
		connectPorts(file, portA, portB1);

		const pumpC = file.createEntity("IfcPump");
		const portC = sourcePort(file, schemaName, pumpC);
		connectPorts(file, portB2, portC);

		const pumpD = file.createEntity("IfcPump");
		const portD = sourcePort(file, schemaName, pumpD);
		connectPorts(file, portB3, portD);

		const feeds = subject.getElementFeeds(pumpA);
		const feedIds = new Set([...feeds].map((e) => e.id()));
		expect(feedIds).toEqual(new Set([pumpC.id(), pumpD.id()]));
	});
});
