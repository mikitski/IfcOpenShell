// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_connect_path.py` (src/ifcopenshell-python,
// `TestConnectPath`/`TestConnectPathIFC2X3`). Every real Python test is ported below,
// run against every schema this build has registered (`AVAILABLE_SCHEMAS`, see
// `../../bootstrap.ts`'s own header comment). `self.connect_path(...)` (the real
// Python test class's own small positional-args helper) ports as this file's own
// `connectPathHelper` below, matching the same positional shape.

import { describe, expect, test } from "vitest";
import { connectPath } from "../../../src/api/geometry/connectPath";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python: `TestConnectPath.connect_path` (the real test class's own helper). */
function connectPathHelper(
	file: IfcFile,
	relatingElement: EntityInstance,
	relatedElement: EntityInstance,
	relatingConnection = "NOTDEFINED",
	relatedConnection = "NOTDEFINED",
	description: string | null = null,
): EntityInstance {
	return connectPath(file, { relatingElement, relatedElement, relatingConnection, relatedConnection, description });
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.connectPath (%s)", (schema) => {
	test("connecting a path", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");

		const rel = connectPathHelper(file, wall1, wall2, "ATSTART", "ATEND", "MITRE");

		expect(rel.isA("IfcRelConnectsPathElements")).toBe(true);
		expect((rel.get("RelatingElement") as EntityInstance).equals(wall1)).toBe(true);
		expect((rel.get("RelatedElement") as EntityInstance).equals(wall2)).toBe(true);
		expect(rel.get("RelatingConnectionType")).toBe("ATSTART");
		expect(rel.get("RelatedConnectionType")).toBe("ATEND");
		expect(rel.get("Description")).toBe("MITRE");
	});

	test("storing connection geometry", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const geometry = file.createEntity("IfcConnectionPointGeometry");

		const rel = connectPath(file, {
			relatingElement: wall1,
			relatedElement: wall2,
			connectionGeometry: geometry,
		});

		expect((rel.get("ConnectionGeometry") as EntityInstance).equals(geometry)).toBe(true);
	});

	test("doing nothing if the element is already connected", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectPathHelper(file, wall1, wall2);

		const totalElements = [...file].length;
		connectPathHelper(file, wall1, wall2);

		expect([...file].length).toBe(totalElements);
	});

	test("updating the connection type if already connected", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectPath(file, { relatingElement: wall1, relatedElement: wall2 });

		const totalElements = [...file].length;
		const rel = connectPathHelper(file, wall1, wall2, "ATSTART");

		expect([...file].length).toBe(totalElements);
		expect(rel.get("RelatingConnectionType")).toBe("ATSTART");
		expect(rel.get("RelatedConnectionType")).toBe("NOTDEFINED");
	});

	test("preventing cyclical connections", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		connectPath(file, { relatingElement: wall1, relatedElement: wall2 });

		const totalElements = [...file].length;
		connectPath(file, { relatingElement: wall2, relatedElement: wall1 });

		expect([...file].length).toBe(totalElements);
	});

	test("a relating element can have multiple path connections", () => {
		const file = createTestFile(schema);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const wall3 = file.createEntity("IfcWall");

		const rel1 = connectPathHelper(file, wall1, wall2, "ATPATH", "ATEND");
		const rel2 = connectPathHelper(file, wall1, wall3, "ATPATH", "ATSTART");

		expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(2);
		expect((rel1.get("RelatingElement") as EntityInstance).equals(wall1)).toBe(true);
		expect((rel1.get("RelatedElement") as EntityInstance).equals(wall2)).toBe(true);
		expect(rel1.get("RelatingConnectionType")).toBe("ATPATH");
		expect(rel1.get("RelatedConnectionType")).toBe("ATEND");
		expect((rel2.get("RelatingElement") as EntityInstance).equals(wall1)).toBe(true);
		expect((rel2.get("RelatedElement") as EntityInstance).equals(wall3)).toBe(true);
		expect(rel2.get("RelatingConnectionType")).toBe("ATPATH");
		expect(rel2.get("RelatedConnectionType")).toBe("ATSTART");
	});

	test("an element can only have up to one start or end connection", () => {
		// Case 1: differing endpoint slots on both sides -- no collision, both survive.
		{
			const file = createTestFile(schema);
			const wall1 = file.createEntity("IfcWall");
			const wall2 = file.createEntity("IfcWall");
			const wall3 = file.createEntity("IfcWall");
			connectPathHelper(file, wall1, wall2, "ATSTART", "ATEND");
			connectPathHelper(file, wall1, wall3, "ATEND", "ATSTART");
			expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(2);
		}
		// Case 2: same `relatingConnection` ("ATSTART") on `wall1` for both -- collides.
		{
			const file = createTestFile(schema);
			const wall1 = file.createEntity("IfcWall");
			const wall2 = file.createEntity("IfcWall");
			const wall3 = file.createEntity("IfcWall");
			connectPathHelper(file, wall1, wall2, "ATSTART", "ATEND");
			connectPathHelper(file, wall1, wall3, "ATSTART", "ATSTART");
			expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(1);
		}
		// Case 3: same `relatingConnection` ("ATEND") on `wall1` for both -- collides.
		{
			const file = createTestFile(schema);
			const wall1 = file.createEntity("IfcWall");
			const wall2 = file.createEntity("IfcWall");
			const wall3 = file.createEntity("IfcWall");
			connectPathHelper(file, wall1, wall2, "ATEND", "ATEND");
			connectPathHelper(file, wall1, wall3, "ATEND", "ATSTART");
			expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(1);
		}
		// Case 4: "ATPATH" never collides with anything.
		{
			const file = createTestFile(schema);
			const wall1 = file.createEntity("IfcWall");
			const wall2 = file.createEntity("IfcWall");
			const wall3 = file.createEntity("IfcWall");
			connectPathHelper(file, wall1, wall2, "ATPATH", "ATEND");
			connectPathHelper(file, wall1, wall3, "ATPATH", "ATSTART");
			expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(2);
		}
		// Case 5: differing `relatedConnection` on the shared `related_element` side.
		{
			const file = createTestFile(schema);
			const wall1 = file.createEntity("IfcWall");
			const wall2 = file.createEntity("IfcWall");
			const wall3 = file.createEntity("IfcWall");
			connectPathHelper(file, wall2, wall1, "ATPATH", "ATEND");
			connectPathHelper(file, wall3, wall1, "ATPATH", "ATSTART");
			expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(2);
		}
		// Case 6: same `relatedConnection` ("ATSTART") on the shared `related_element` side.
		{
			const file = createTestFile(schema);
			const wall1 = file.createEntity("IfcWall");
			const wall2 = file.createEntity("IfcWall");
			const wall3 = file.createEntity("IfcWall");
			connectPathHelper(file, wall2, wall1, "ATPATH", "ATSTART");
			connectPathHelper(file, wall3, wall1, "ATPATH", "ATSTART");
			expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(1);
		}
		// Case 7: same `relatedConnection` ("ATEND") on the shared `related_element` side.
		{
			const file = createTestFile(schema);
			const wall1 = file.createEntity("IfcWall");
			const wall2 = file.createEntity("IfcWall");
			const wall3 = file.createEntity("IfcWall");
			connectPathHelper(file, wall2, wall1, "ATPATH", "ATEND");
			connectPathHelper(file, wall3, wall1, "ATPATH", "ATEND");
			expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(1);
		}
	});
});
