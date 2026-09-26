// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_structural_activity.py` (confirmed: no
// `test_add_structural_activity.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralActivity } from "../../../src/api/structural/addStructuralActivity";
import { addStructuralLoad } from "../../../src/api/structural/addStructuralLoad";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.addStructuralActivity (%s)", (schema) => {
	test("adding a structural activity with defaults", () => {
		const file = createTestFile(schema);
		const load = addStructuralLoad(file, {});
		const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });

		const activity = addStructuralActivity(file, { appliedLoad: load, structuralMember: member });

		expect(activity.isA("IfcStructuralPlanarAction")).toBe(true);
		expect((activity.get("AppliedLoad") as EntityInstance).equals(load)).toBe(true);
		expect(activity.get("GlobalOrLocal")).toBe("GLOBAL_COORDS");
		// Real schema divergence: IFC2X3's `IfcStructuralPlanarAction` has no
		// `PredefinedType` attribute at all (confirmed against `ifc2x3.d.ts`) -- IFC4+
		// added it. `api.root.createEntity`'s own `hasAttribute` guard silently skips
		// setting it there, matching real Python's own `hasattr` check exactly.
		if (file.schema !== "IFC2X3") {
			expect(activity.get("PredefinedType")).toBe("CONST");
		}

		const rels = file.byType("IfcRelConnectsStructuralActivity");
		expect(rels.length).toBe(1);
		expect((rels[0].get("RelatingElement") as EntityInstance).equals(member)).toBe(true);
		expect((rels[0].get("RelatedStructuralActivity") as EntityInstance).equals(activity)).toBe(true);
	});

	test("a custom ifcClass/predefinedType/globalOrLocal is honoured", () => {
		const file = createTestFile(schema);
		const load = addStructuralLoad(file, {});
		const member = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

		const activity = addStructuralActivity(file, {
			appliedLoad: load,
			structuralMember: member,
			ifcClass: "IfcStructuralPointAction",
			predefinedType: "CONST",
			globalOrLocal: "LOCAL_COORDS",
		});

		expect(activity.isA("IfcStructuralPointAction")).toBe(true);
		expect(activity.get("GlobalOrLocal")).toBe("LOCAL_COORDS");
	});
});
