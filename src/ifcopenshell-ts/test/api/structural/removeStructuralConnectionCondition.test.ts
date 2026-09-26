// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_structural_connection_condition.py`
// (confirmed: no `test_remove_structural_connection_condition.py` under
// `test/api/structural/`). This suite is written directly from the real source's own
// behavior/docstring, including a dedicated pin for the disclosed orphan-condition
// bug -- see `../../../src/api/structural/removeStructuralConnectionCondition.ts`'s
// own header comment.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralBoundaryCondition } from "../../../src/api/structural/addStructuralBoundaryCondition";
import { addStructuralMemberConnection } from "../../../src/api/structural/addStructuralMemberConnection";
import { removeStructuralConnectionCondition } from "../../../src/api/structural/removeStructuralConnectionCondition";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.removeStructuralConnectionCondition (%s)", (schema) => {
	test("DISCLOSED BUG: a condition added via the REL is never actually removed -- only the rel is, leaving an orphan", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });
		const rel = addStructuralMemberConnection(file, {
			relatingStructuralMember: member,
			relatedStructuralConnection: connection,
		});
		// `addStructuralBoundaryCondition` with a REL sets `AppliedCondition` on the
		// REL, not on `connection` (see that file's own header comment).
		const condition = addStructuralBoundaryCondition(file, { connection: rel });
		expect(rel.get("AppliedCondition")).not.toBeNull();
		expect(connection.get("AppliedCondition")).toBeNull();

		removeStructuralConnectionCondition(file, { relation: rel });

		expect(() => file.byId(rel.id())).toThrow();
		// The condition survives as an orphan -- ported verbatim, not "fixed" by this
		// port to also purge it.
		expect(() => file.byId(condition.id())).not.toThrow();
		expect(file.getTotalInverses(condition)).toBe(0);
		// The member and connection themselves are preserved either way.
		expect(() => file.byId(member.id())).not.toThrow();
		expect(() => file.byId(connection.id())).not.toThrow();
	});

	test("removes the relation even when it has no AppliedCondition", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });
		const rel = addStructuralMemberConnection(file, {
			relatingStructuralMember: member,
			relatedStructuralConnection: connection,
		});

		expect(() => removeStructuralConnectionCondition(file, { relation: rel })).not.toThrow();
		expect(() => file.byId(rel.id())).toThrow();
	});
});
