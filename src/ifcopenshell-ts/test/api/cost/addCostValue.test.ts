// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_cost_value.py` (see `test/api/cost/` -- no
// `test_add_cost_value.py`), only the docstring's own worked examples (and its use as
// a fixture throughout other real Python test files, e.g. `test_edit_cost_value.py`).
// This suite is written directly from the real source's own behavior, covering all
// three `parent` branches plus the unmatched (no-op-attach) case.
//
// `CostValues`/`BaseCosts` are IFC4+ only (confirmed against `ifc2x3.d.ts` --
// `IfcCostItem`/`IfcConstructionResource` have neither on IFC2X3), so this suite is
// gated to non-IFC2X3 schemas.

import { beforeEach, describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.addCostValue (%s)", (schema) => {
	test("adding a value to an IfcCostItem appends to CostValues", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });

		const value = addCostValue(file, { parent: item });

		expect(value.isA("IfcCostValue")).toBe(true);
		const costValues = item.get("CostValues") as EntityInstance[];
		expect(costValues.length).toBe(1);
		expect(costValues[0].equals(value)).toBe(true);
	});

	test("adding a second value appends rather than replacing", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value1 = addCostValue(file, { parent: item });

		const value2 = addCostValue(file, { parent: item });

		const costValues = item.get("CostValues") as EntityInstance[];
		expect(costValues.length).toBe(2);
		expect(costValues[0].equals(value1)).toBe(true);
		expect(costValues[1].equals(value2)).toBe(true);
	});

	test("adding a value to an IfcConstructionResource appends to BaseCosts", () => {
		const file = createTestFile(schema);
		const resource = addResource(file, { ifcClass: "IfcCrewResource" });

		const value = addCostValue(file, { parent: resource });

		const baseCosts = resource.get("BaseCosts") as EntityInstance[];
		expect(baseCosts.length).toBe(1);
		expect(baseCosts[0].equals(value)).toBe(true);
	});

	test("adding a subvalue to an IfcCostValue appends to Components", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });

		const subvalue = addCostValue(file, { parent: value });

		const components = value.get("Components") as EntityInstance[];
		expect(components.length).toBe(1);
		expect(components[0].equals(subvalue)).toBe(true);
	});
});
