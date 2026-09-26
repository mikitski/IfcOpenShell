// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_disconnect_path.py` (src/ifcopenshell-
// python, `TestDisconnectPath`/`TestDisconnectPathIFC2X3`). Every real Python test is
// ported below, run against every schema this build has registered (`AVAILABLE_
// SCHEMAS`, see `../../bootstrap.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { connectPath } from "../../../src/api/geometry/connectPath";
import { disconnectPath } from "../../../src/api/geometry/disconnectPath";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.geometry.disconnectPath (%s)", (schema) => {
	test("disconnecting a path", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectPath(file, { relatingElement: wall1, relatedElement: wall2 });

		disconnectPath(file, { relatingElement: wall1, relatedElement: wall2 });

		expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(0);
	});

	test("disconnecting by connection type", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectPath(file, {
			relatingElement: wall1,
			relatedElement: wall2,
			relatingConnection: "ATSTART",
			relatedConnection: "ATEND",
		});

		disconnectPath(file, { element: wall1, connectionType: "ATEND" });
		expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(1);

		disconnectPath(file, { element: wall1, connectionType: "ATSTART" });
		expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(0);

		connectPath(file, {
			relatingElement: wall1,
			relatedElement: wall2,
			relatingConnection: "ATSTART",
			relatedConnection: "ATEND",
		});
		disconnectPath(file, { element: wall2, connectionType: "ATEND" });
		expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(0);
	});

	test("doing nothing if there is no connection", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const totalElements = [...file].length;

		disconnectPath(file, { relatingElement: wall1, relatedElement: wall2 });

		expect([...file].length).toBe(totalElements);
	});

	test("that order matters", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectPath(file, { relatingElement: wall1, relatedElement: wall2 });
		const totalElements = [...file].length;

		disconnectPath(file, { relatingElement: wall2, relatedElement: wall1 });

		expect([...file].length).toBe(totalElements);
	});
});
