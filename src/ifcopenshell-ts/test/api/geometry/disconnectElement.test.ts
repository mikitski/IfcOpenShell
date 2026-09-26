// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_disconnect_element.py` (src/ifcopenshell-
// python, `TestDisconnectElement`/`TestDisconnectElementIFC2X3`). Every real Python
// test is ported below, run against every schema this build has registered
// (`AVAILABLE_SCHEMAS`, see `../../bootstrap.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { connectElement } from "../../../src/api/geometry/connectElement";
import { disconnectElement } from "../../../src/api/geometry/disconnectElement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.geometry.disconnectElement (%s)", (schema) => {
	test("disconnecting an element", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectElement(file, { relatingElement: wall1, relatedElement: wall2 });

		disconnectElement(file, { relatingElement: wall1, relatedElement: wall2 });

		expect(file.byType("IfcRelConnectsElements")).toHaveLength(0);
	});

	test("order does not matter", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectElement(file, { relatingElement: wall1, relatedElement: wall2 });

		disconnectElement(file, { relatingElement: wall2, relatedElement: wall1 });

		expect(file.byType("IfcRelConnectsElements")).toHaveLength(0);
	});
});
