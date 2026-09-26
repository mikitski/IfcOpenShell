// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_connect_element.py` (src/ifcopenshell-
// python, `TestConnectElement`/`TestConnectElementIFC2X3`). Every real Python test is
// ported below, run against every schema this build has registered (`AVAILABLE_
// SCHEMAS`, see `../../bootstrap.ts`'s own header comment for why CI's IFC4-only
// native build gates this). `len([e for e in self.file])` ports directly as
// `[...file].length` (`IfcFile` is iterable, matching every other already-landed
// chunk's own "total element count unchanged" assertion convention, e.g.
// `test/api/type/assignType.test.ts`).

import { describe, expect, test } from "vitest";
import { connectElement } from "../../../src/api/geometry/connectElement";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.geometry.connectElement (%s)", (schema) => {
	test("connecting an element", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");

		const rel = connectElement(file, { relatingElement: wall1, relatedElement: wall2, description: "FOOBAR" });

		expect(rel.isA()).toBe("IfcRelConnectsElements");
		expect((rel.get("RelatingElement") as EntityInstance).equals(wall1)).toBe(true);
		expect((rel.get("RelatedElement") as EntityInstance).equals(wall2)).toBe(true);
		expect(rel.get("Description")).toBe("FOOBAR");
	});

	test("reconnecting an element changes the description", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");

		const rel = connectElement(file, { relatingElement: wall1, relatedElement: wall2, description: "FOOBAR" });
		expect(rel.isA()).toBe("IfcRelConnectsElements");
		expect((rel.get("RelatingElement") as EntityInstance).equals(wall1)).toBe(true);
		expect((rel.get("RelatedElement") as EntityInstance).equals(wall2)).toBe(true);
		expect(rel.get("Description")).toBe("FOOBAR");

		const totalElements = [...file].length;
		const rel2 = connectElement(file, { relatingElement: wall1, relatedElement: wall2, description: "FOOBAZ" });
		expect([...file].length).toBe(totalElements);
		expect(rel2.get("Description")).toBe("FOOBAZ");
	});

	test("reconnecting and changing the order", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");

		const rel = connectElement(file, { relatingElement: wall1, relatedElement: wall2, description: "FOOBAR" });
		expect((rel.get("RelatingElement") as EntityInstance).equals(wall1)).toBe(true);
		expect((rel.get("RelatedElement") as EntityInstance).equals(wall2)).toBe(true);

		const rel2 = connectElement(file, { relatingElement: wall2, relatedElement: wall1, description: "FOOBAZ" });
		expect((rel2.get("RelatingElement") as EntityInstance).equals(wall2)).toBe(true);
		expect((rel2.get("RelatedElement") as EntityInstance).equals(wall1)).toBe(true);
	});
});
