// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_structural_load_group.py` (confirmed: no
// `test_remove_structural_load_group.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring, including a
// dedicated regression test confirming a multi-member group-assignment rel is left
// alive with no dangling reference (the native `IfcFile.remove`/`process_deletion_`
// reference-cleanup mechanism handles it) -- see
// `../../../src/api/structural/removeStructuralLoadGroup.ts`'s own header comment.

import { describe, expect, test } from "vitest";
import { addStructuralAnalysisModel } from "../../../src/api/structural/addStructuralAnalysisModel";
import { addStructuralLoadGroup } from "../../../src/api/structural/addStructuralLoadGroup";
import { assignStructuralAnalysisModel } from "../../../src/api/structural/assignStructuralAnalysisModel";
import { removeStructuralLoadGroup } from "../../../src/api/structural/removeStructuralLoadGroup";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.removeStructuralLoadGroup (%s)", (schema) => {
	test("removing a sole-member group-assignment rel removes it along with the load group", () => {
		const file = createTestFile(schema);
		const loadGroup = addStructuralLoadGroup(file, {});
		const model = addStructuralAnalysisModel(file, {});
		assignStructuralAnalysisModel(file, { products: [loadGroup], structuralAnalysisModel: model });
		expect(file.byType("IfcRelAssignsToGroup").length).toBe(1);

		removeStructuralLoadGroup(file, { loadGroup });

		expect(file.byType("IfcStructuralLoadGroup").length).toBe(0);
		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
	});

	test("removing one of a multi-member group-assignment rel's members leaves the rel alive, correctly shortened -- not dangling", () => {
		const file = createTestFile(schema);
		const loadGroup1 = addStructuralLoadGroup(file, { name: "Group 1" });
		const loadGroup2 = addStructuralLoadGroup(file, { name: "Group 2" });
		const model = addStructuralAnalysisModel(file, {});
		// Both load groups share the SAME `IfcRelAssignsToGroup` (real Python's own
		// `group.assign_group` only ever grows `IsGroupedBy[0]`, see `../group/
		// assignGroup.ts`'s own header comment).
		assignStructuralAnalysisModel(file, { products: [loadGroup1, loadGroup2], structuralAnalysisModel: model });
		const rels = file.byType("IfcRelAssignsToGroup");
		expect(rels.length).toBe(1);
		const relId = rels[0].id();

		removeStructuralLoadGroup(file, { loadGroup: loadGroup1 });

		// `loadGroup1` itself is gone...
		expect(() => file.byId(loadGroup1.id())).toThrow();
		// ...the rel survives (it had 2 members, not the removal-triggering 1)...
		const survivingRel = file.byId(relId);
		// ...and the native reference-cleanup (`IfcFile.remove`/`process_deletion_`,
		// see this function's own header comment) already spliced `loadGroup1` out of
		// it automatically -- no dangling reference, `loadGroup2` remains correctly
		// grouped.
		const remaining = survivingRel.get("RelatedObjects") as EntityInstance[];
		expect(remaining.length).toBe(1);
		expect(remaining[0].equals(loadGroup2)).toBe(true);

		// Removing the now-sole remaining member correctly cleans up the rel too.
		removeStructuralLoadGroup(file, { loadGroup: loadGroup2 });
		expect(() => file.byId(relId)).toThrow();
		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
	});
});
