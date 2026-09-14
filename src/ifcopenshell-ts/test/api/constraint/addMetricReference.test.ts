// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/constraint/addMetricReference.ts` -- no
// `test/api/constraint/test_add_metric_reference.py` exists in the real Python source
// to port from (confirmed by directory listing -- see `./addObjective.test.ts`'s header
// comment for the same gap), so this file's coverage is written directly against
// `add_metric_reference.py`'s own source / `addMetricReference.ts`'s port, plus a
// dedicated regression test for the IFC2X3 "`IfcReference` doesn't exist" schema
// limitation disclosed in that file's own header comment.

import { describe, expect, test } from "vitest";
import { addMetric } from "../../../src/api/constraint/addMetric";
import { addMetricReference } from "../../../src/api/constraint/addMetricReference";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const NON_IFC2X3_SCHEMAS = AVAILABLE_SCHEMAS.filter((schema) => schema !== "IFC2X3");

describe.each(NON_IFC2X3_SCHEMAS)("api.constraint.addMetricReference (%s)", (schema) => {
	test("a single-segment path creates one IfcReference wired onto metric.ReferencePath", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });

		const references = addMetricReference(file, { metric, referencePath: "FireRating" });

		expect(references).toHaveLength(1);
		expect(references[0].get("AttributeIdentifier")).toBe("FireRating");
		expect((metric.get("ReferencePath") as EntityInstance).equals(references[0])).toBe(true);
		expect(references[0].get("InnerReference")).toBeNull();
	});

	test("a multi-segment path chains IfcReferences via InnerReference, outermost first", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });

		const references = addMetricReference(file, { metric, referencePath: "Pset_WallCommon.FireRating" });

		expect(references).toHaveLength(2);
		expect(references[0].get("AttributeIdentifier")).toBe("Pset_WallCommon");
		expect(references[1].get("AttributeIdentifier")).toBe("FireRating");
		expect((references[0].get("InnerReference") as EntityInstance).equals(references[1])).toBe(true);
		expect(metric.get("ReferencePath")).not.toBeNull();
	});

	test("an empty reference path is a no-op (Python's `if reference_path:` guard)", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });

		const references = addMetricReference(file, { metric, referencePath: "" });

		expect(references).toEqual([]);
		expect(metric.get("ReferencePath")).toBeNull();
		expect(file.byType("IfcReference").length).toBe(0);
	});
});

// --- Real, disclosed IFC2X3 schema limitation: see `addMetricReference.ts`'s own header
// comment -- `IfcReference` doesn't exist at all on IFC2X3, so this throws immediately,
// matching real Python's own unguarded behavior there. ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.constraint.addMetricReference (IFC2X3)", () => {
	test("throws because IfcReference doesn't exist on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		const metric = addMetric(file, { objective: null });
		expect(() => addMetricReference(file, { metric, referencePath: "FireRating" })).toThrow();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(NON_IFC2X3_SCHEMAS)("api.constraint.addMetricReference Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created references and restores metric.ReferencePath; redo reapplies both", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });

		file.beginTransaction();
		addMetricReference(file, { metric, referencePath: "Pset_WallCommon.FireRating" });
		file.endTransaction();

		expect(file.byType("IfcReference").length).toBe(2);
		expect(metric.get("ReferencePath")).not.toBeNull();

		file.undo();
		expect(file.byType("IfcReference").length).toBe(0);
		expect(metric.get("ReferencePath")).toBeNull();

		file.redo();
		expect(file.byType("IfcReference").length).toBe(2);
		expect(metric.get("ReferencePath")).not.toBeNull();
	});
});
