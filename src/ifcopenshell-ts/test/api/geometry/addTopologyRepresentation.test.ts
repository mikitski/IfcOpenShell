// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_add_topology_representation.py`
// (src/ifcopenshell-python, `TestAddTopologyRepresentation`/
// `TestAddTopologyRepresentationIFC2X3`, itself an "AI-generated" real Python test
// file per its own header comment), run against every schema this build has
// registered (`AVAILABLE_SCHEMAS`) -- `TestAddTopologyRepresentationIFC2X3` runs the
// exact same test bodies against IFC2X3 with no overrides, so `describe.each
// (AVAILABLE_SCHEMAS)` reproduces that coverage directly.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addTopologyRepresentation } from "../../../src/api/geometry/addTopologyRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python: `TestAddTopologyRepresentation.setup_context`. */
function setupContext(file: IfcFile): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Reference",
		targetView: "GRAPH_VIEW",
		parent: model,
	});
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addTopologyRepresentation (%s)", (schema) => {
	test("creates topology representation", () => {
		const file = createTestFile(schema);
		const context = setupContext(file);
		const face = file.createEntity("IfcFaceSurface");
		const rep = addTopologyRepresentation(file, { context, item: face });
		expect(rep.isA("IfcTopologyRepresentation")).toBe(true);
		expect((rep.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);
		expect((rep.get("Items") as EntityInstance[]).some((i) => i.equals(face))).toBe(true);
	});

	test("infers face representation type", () => {
		const file = createTestFile(schema);
		const context = setupContext(file);
		const face = file.createEntity("IfcFaceSurface");
		const rep = addTopologyRepresentation(file, { context, item: face });
		expect(rep.get("RepresentationType")).toBe("Face");
	});

	test("infers edge representation type", () => {
		const file = createTestFile(schema);
		const context = setupContext(file);
		const edge = file.createEntity("IfcEdge");
		const rep = addTopologyRepresentation(file, { context, item: edge });
		expect(rep.get("RepresentationType")).toBe("Edge");
	});

	test("defaults representation identifier to context identifier", () => {
		const file = createTestFile(schema);
		const context = setupContext(file);
		const face = file.createEntity("IfcFaceSurface");
		const rep = addTopologyRepresentation(file, { context, item: face });
		expect(rep.get("RepresentationIdentifier")).toBe(context.get("ContextIdentifier"));
	});

	test("custom representation identifier", () => {
		const file = createTestFile(schema);
		const context = setupContext(file);
		const face = file.createEntity("IfcFaceSurface");
		const rep = addTopologyRepresentation(file, {
			context,
			item: face,
			representationIdentifier: "Body",
		});
		expect(rep.get("RepresentationIdentifier")).toBe("Body");
	});

	test("custom representation type overrides inferred", () => {
		const file = createTestFile(schema);
		const context = setupContext(file);
		const face = file.createEntity("IfcFaceSurface");
		const rep = addTopologyRepresentation(file, {
			context,
			item: face,
			representationType: "Undefined",
		});
		expect(rep.get("RepresentationType")).toBe("Undefined");
	});
});
