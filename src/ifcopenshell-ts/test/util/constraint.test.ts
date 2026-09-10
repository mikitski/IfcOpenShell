// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/util/constraint.ts` -- no `test/util/test_constraint
// .py` exists in the real Python source to port from (confirmed: `src/ifcopenshell-
// python/test/util/` has no such file at all), so this file's coverage is written
// directly against `constraint.py`'s own source / `constraint.ts`'s port, matching
// `util/element.ts`'s established precedent for functions Python itself doesn't
// directly test.
//
// No `ifcopenshell.api.*` fixtures exist to port from either (same reason). Local
// fixture helpers below build the underlying `IfcRelAssociatesConstraint`/
// `IfcObjective`/`IfcMetric`/`IfcReference` entity graphs directly
// (`file.createEntity(...)` + `.set(...)`), matching `test/util/element.test.ts`'s own
// established pattern for this exact same gap.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/constraint";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header
// comment) ---

function associateConstraint(file: IfcFile, products: EntityInstance[], constraint: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesConstraint");
	rel.set("RelatedObjects", products);
	rel.set("RelatingConstraint", constraint);
	return rel;
}

function createObjective(
	file: IfcFile,
	name: string,
	benchmarkValues: EntityInstance[] = [],
	constraintGrade = "NOTDEFINED",
): EntityInstance {
	const objective = file.createEntity("IfcObjective");
	objective.set("Name", name);
	objective.set("ConstraintGrade", constraintGrade);
	objective.set("ObjectiveQualifier", "NOTDEFINED");
	if (benchmarkValues.length > 0) objective.set("BenchmarkValues", benchmarkValues);
	return objective;
}

function createMetric(
	file: IfcFile,
	name: string,
	constraintGrade: string,
	benchmark: string,
	referencePath: EntityInstance | null = null,
): EntityInstance {
	const metric = file.createEntity("IfcMetric");
	metric.set("Name", name);
	metric.set("ConstraintGrade", constraintGrade);
	metric.set("Benchmark", benchmark);
	if (referencePath) metric.set("ReferencePath", referencePath);
	return metric;
}

function createReference(
	file: IfcFile,
	attributeIdentifier: string | null,
	innerReference: EntityInstance | null = null,
): EntityInstance {
	const reference = file.createEntity("IfcReference");
	if (attributeIdentifier !== null) reference.set("AttributeIdentifier", attributeIdentifier);
	if (innerReference) reference.set("InnerReference", innerReference);
	return reference;
}

function ids(instances: Iterable<EntityInstance>): number[] {
	return [...instances].map((i) => i.id()).sort((a, b) => a - b);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.constraint getConstraints", () => {
	test("collects RelatingConstraint from every IfcRelAssociatesConstraint on the product", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		const objective = createObjective(file, "Objective1");
		associateConstraint(file, [product], objective);

		const results = subject.getConstraints(product);
		expect(results).toHaveLength(1);
		expect(results[0].equals(objective)).toBe(true);
	});

	test("returns an empty list when the product has no associations", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		expect(subject.getConstraints(product)).toEqual([]);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.constraint getConstrainedElements", () => {
	test("collects RelatedObjects from every IfcRelAssociatesConstraint pointing at the constraint", () => {
		const file = createTestFile("IFC4");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcSlab");
		const objective = createObjective(file, "Objective1");
		associateConstraint(file, [element1, element2], objective);

		expect(ids(subject.getConstrainedElements(objective))).toEqual(ids([element1, element2]));
	});

	test("returns an empty set when nothing is associated with the constraint", () => {
		const file = createTestFile("IFC4");
		const objective = createObjective(file, "Objective1");
		expect(subject.getConstrainedElements(objective).size).toBe(0);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.constraint getMetrics", () => {
	test("returns the objective's BenchmarkValues", () => {
		const file = createTestFile("IFC4");
		const metric1 = createMetric(file, "Metric1", "SOFT", "EQUALTO");
		const metric2 = createMetric(file, "Metric2", "SOFT", "EQUALTO");
		const objective = createObjective(file, "Objective1", [metric1, metric2]);

		const results = subject.getMetrics(objective);
		expect(ids(results)).toEqual(ids([metric1, metric2]));
	});

	test("returns an empty list when BenchmarkValues is unset", () => {
		const file = createTestFile("IFC4");
		const objective = createObjective(file, "Objective1");
		expect(subject.getMetrics(objective)).toEqual([]);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.constraint getMetricReference", () => {
	test("isDeep=false returns just the outermost AttributeIdentifier", () => {
		const file = createTestFile("IFC4");
		const reference = createReference(file, "FireRating");
		const metric = createMetric(file, "Metric1", "SOFT", "EQUALTO", reference);
		expect(subject.getMetricReference(metric, false)).toBe("FireRating");
	});

	test("isDeep=true (default) with a single-level reference returns just that identifier", () => {
		const file = createTestFile("IFC4");
		const reference = createReference(file, "FireRating");
		const metric = createMetric(file, "Metric1", "SOFT", "EQUALTO", reference);
		expect(subject.getMetricReference(metric)).toBe("FireRating");
	});

	test("isDeep=true walks InnerReference, accumulating a dotted path", () => {
		const file = createTestFile("IFC4");
		const inner = createReference(file, "FireRating");
		const outer = createReference(file, "Pset_WallCommon", inner);
		const metric = createMetric(file, "Metric1", "SOFT", "EQUALTO", outer);
		expect(subject.getMetricReference(metric, true)).toBe("Pset_WallCommon.FireRating");
	});

	test("an unset ReferencePath returns the initial empty-string path, not null (Python's own `return path` fallthrough)", () => {
		const file = createTestFile("IFC4");
		const metric = createMetric(file, "Metric1", "SOFT", "EQUALTO");
		expect(subject.getMetricReference(metric, true)).toBe("");
		expect(subject.getMetricReference(metric, false)).toBe("");
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.constraint getMetricConstraints", () => {
	test("matches a metric whose reference resolves to the given attribute, shallow or deep", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		const reference = createReference(file, "FireRating");
		const metric = createMetric(file, "Metric1", "HARD", "EQUALTO", reference);
		const objective = createObjective(file, "Objective1", [metric]);
		associateConstraint(file, [product], objective);

		const results = subject.getMetricConstraints(product, "FireRating");
		expect(results).not.toBeNull();
		expect(ids(results ?? [])).toEqual([metric.id()]);
	});

	test("returns null when nothing matches the given attribute", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		const reference = createReference(file, "FireRating");
		const metric = createMetric(file, "Metric1", "HARD", "EQUALTO", reference);
		const objective = createObjective(file, "Objective1", [metric]);
		associateConstraint(file, [product], objective);

		expect(subject.getMetricConstraints(product, "Nonexistent")).toBeNull();
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.constraint isHardConstraint / isAttributeLocked", () => {
	test("isHardConstraint requires both ConstraintGrade=HARD and Benchmark=EQUALTO", () => {
		const file = createTestFile("IFC4");
		expect(subject.isHardConstraint(createMetric(file, "M1", "HARD", "EQUALTO"))).toBe(true);
		expect(subject.isHardConstraint(createMetric(file, "M2", "SOFT", "EQUALTO"))).toBe(false);
		expect(subject.isHardConstraint(createMetric(file, "M3", "HARD", "GREATERTHAN"))).toBe(false);
	});

	test("isAttributeLocked is true when a matching metric constraint is hard", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		const reference = createReference(file, "FireRating");
		const metric = createMetric(file, "Metric1", "HARD", "EQUALTO", reference);
		const objective = createObjective(file, "Objective1", [metric]);
		associateConstraint(file, [product], objective);

		expect(subject.isAttributeLocked(product, "FireRating")).toBe(true);
	});

	test("isAttributeLocked is false when the matching metric constraint is not hard", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		const reference = createReference(file, "FireRating");
		const metric = createMetric(file, "Metric1", "SOFT", "EQUALTO", reference);
		const objective = createObjective(file, "Objective1", [metric]);
		associateConstraint(file, [product], objective);

		expect(subject.isAttributeLocked(product, "FireRating")).toBe(false);
	});

	test("isAttributeLocked is false when no constraint at all references the attribute", () => {
		const file = createTestFile("IFC4");
		const product = file.createEntity("IfcWall");
		expect(subject.isAttributeLocked(product, "FireRating")).toBe(false);
	});
});
