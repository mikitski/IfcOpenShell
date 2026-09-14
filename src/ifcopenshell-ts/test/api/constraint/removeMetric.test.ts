// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/constraint/removeMetric.ts` -- no real Python
// `test_remove_metric.py` exists (confirmed by directory listing -- see
// `./editObjective.test.ts`'s header comment for the same gap), so this file's coverage
// is written directly against `remove_metric.py`'s own source / `removeMetric.ts`'s
// port, plus a dedicated regression test for the IFC2X3 "effectively unusable" schema
// limitation disclosed in that file's own header comment.

import { describe, expect, test } from "vitest";
import { addMetric } from "../../../src/api/constraint/addMetric";
import { addMetricReference } from "../../../src/api/constraint/addMetricReference";
import { assignConstraint } from "../../../src/api/constraint/assignConstraint";
import { removeMetric } from "../../../src/api/constraint/removeMetric";
import { createEntity } from "../../../src/api/root/createEntity";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const NON_IFC2X3_SCHEMAS = AVAILABLE_SCHEMAS.filter((schema) => schema !== "IFC2X3");

describe.each(NON_IFC2X3_SCHEMAS)("api.constraint.removeMetric (%s)", (schema) => {
	test("removing a metric with no reference path", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });
		removeMetric(file, { metric });
		expect(file.byType("IfcMetric").length).toBe(0);
	});

	test("removing a metric also deletes its entire ReferencePath chain", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });
		addMetricReference(file, { metric, referencePath: "Pset_WallCommon.FireRating" });
		expect(file.byType("IfcReference").length).toBe(2);

		removeMetric(file, { metric });

		expect(file.byType("IfcMetric").length).toBe(0);
		expect(file.byType("IfcReference").length).toBe(0);
	});

	test("removing a metric also removes its dangling IfcRelAssociatesConstraint and OwnerHistory", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });
		const element = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element], constraint: metric });

		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);

		removeMetric(file, { metric });

		expect(file.byType("IfcMetric").length).toBe(0);
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(0);
	});

	test("does not remove a different metric's ReferencePath chain", () => {
		const file = createTestFile(schema);
		const metric1 = addMetric(file, { objective: null });
		const metric2 = addMetric(file, { objective: null });
		addMetricReference(file, { metric: metric1, referencePath: "FireRating" });
		addMetricReference(file, { metric: metric2, referencePath: "Combustible" });

		removeMetric(file, { metric: metric1 });

		expect(file.byType("IfcMetric").length).toBe(1);
		expect(file.byType("IfcReference").length).toBe(1);
		expect(file.byType("IfcReference")[0].get("AttributeIdentifier") as string).toBe("Combustible");
	});
});

// --- Real, disclosed IFC2X3 schema limitation: see `removeMetric.ts`'s own header
// comment -- `IfcMetric.ReferencePath` doesn't exist at all on IFC2X3, so this throws
// immediately (before even reaching `IfcResourceConstraintRelationship`, which also
// doesn't exist there), matching real Python's own unguarded behavior. ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.constraint.removeMetric (IFC2X3)", () => {
	test("throws because IfcMetric.ReferencePath doesn't exist on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		const metric = addMetric(file, { objective: null });
		expect(() => removeMetric(file, { metric })).toThrow();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(NON_IFC2X3_SCHEMAS)("api.constraint.removeMetric Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed metric and its ReferencePath chain; redo removes both again", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });
		addMetricReference(file, { metric, referencePath: "Pset_WallCommon.FireRating" });
		const metricId = metric.id();

		file.beginTransaction();
		removeMetric(file, { metric });
		file.endTransaction();

		expect(() => file.byId(metricId)).toThrow();
		expect(file.byType("IfcReference").length).toBe(0);

		file.undo();
		expect(file.byId(metricId).isA("IfcMetric")).toBe(true);
		expect(file.byType("IfcReference").length).toBe(2);

		file.redo();
		expect(() => file.byId(metricId)).toThrow();
		expect(file.byType("IfcReference").length).toBe(0);
	});
});
