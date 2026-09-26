// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_structural_member_connection.py` (confirmed: no
// `test_add_structural_member_connection.py` under `test/api/structural/`). This
// suite is written directly from the real source's own behavior/docstring.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralMemberConnection } from "../../../src/api/structural/addStructuralMemberConnection";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.addStructuralMemberConnection (%s)", (schema) => {
	test("creating a new relationship", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

		const rel = addStructuralMemberConnection(file, {
			relatingStructuralMember: member,
			relatedStructuralConnection: connection,
		});

		expect(rel.isA("IfcRelConnectsStructuralMember")).toBe(true);
		expect((rel.get("RelatingStructuralMember") as EntityInstance).equals(member)).toBe(true);
		expect((rel.get("RelatedStructuralConnection") as EntityInstance).equals(connection)).toBe(true);
		expect(file.byType("IfcRelConnectsStructuralMember").length).toBe(1);
	});

	test("does not duplicate an existing connection between the same member and connection", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

		const rel1 = addStructuralMemberConnection(file, {
			relatingStructuralMember: member,
			relatedStructuralConnection: connection,
		});
		const rel2 = addStructuralMemberConnection(file, {
			relatingStructuralMember: member,
			relatedStructuralConnection: connection,
		});

		expect(rel1.equals(rel2)).toBe(true);
		expect(file.byType("IfcRelConnectsStructuralMember").length).toBe(1);
	});

	test("a second member gets its own new relationship to the same connection", () => {
		const file = createTestFile(schema);
		const member1 = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
		const member2 = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

		const rel1 = addStructuralMemberConnection(file, {
			relatingStructuralMember: member1,
			relatedStructuralConnection: connection,
		});
		const rel2 = addStructuralMemberConnection(file, {
			relatingStructuralMember: member2,
			relatedStructuralConnection: connection,
		});

		expect(rel1.equals(rel2)).toBe(false);
		expect(file.byType("IfcRelConnectsStructuralMember").length).toBe(2);
	});
});
