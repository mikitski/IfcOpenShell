// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/georeference/test_edit_true_north.py`'s `TestEditTrueNorth`
// (IFC4-only, run against every `AVAILABLE_SCHEMAS` entry -- no schema divergence
// exists for `IfcGeometricRepresentationContext.TrueNorth`/`IfcDirection`, confirmed
// against all 3 generated `.d.ts`s, see
// `../../../src/api/georeference/editTrueNorth.ts`'s own header comment). Plus original
// coverage for the "unset true north" branch and its own disclosed native inverse-index
// bug workaround (real Python's own test file never exercises `true_north=None` at all
// -- confirmed by reading it in full).
//
// Real Python's fixture is genuinely blank -- see `./addGeoreferencing.test.ts`'s own
// header comment for why every test below calls `stripProjectBootstrap` first (so each
// test's own `addContext` calls are the ONLY `IfcGeometricRepresentationContext`
// instances in the file, not muddied by `createTestFile`'s own pre-populated "Model"
// context).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { editTrueNorth } from "../../../src/api/georeference/editTrueNorth";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getTrueNorth } from "../../../src/util/geolocation";
import type { Schema } from "../../bootstrap";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

describe.each(AVAILABLE_SCHEMAS)("api.georeference.editTrueNorth (%s)", (schema) => {
	test("edits true north as a vector or an angle, for every context", () => {
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });
		const plan = addContext(file, { contextType: "Plan" });

		editTrueNorth(file, { trueNorth: [0.0, 1.0] });
		expect((model.get("TrueNorth") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 1.0]);
		expect((plan.get("TrueNorth") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 1.0]);

		editTrueNorth(file, { trueNorth: [-0.5, 0.8660254] });
		expect(getTrueNorth(file)).toBeCloseTo(30, 5);

		editTrueNorth(file, { trueNorth: 30 });
		expect(getTrueNorth(file)).toBeCloseTo(30, 5);
	});

	test("defaults to 0.0 (an unrotated Y axis)", () => {
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });
		editTrueNorth(file, {});
		const ratios = (model.get("TrueNorth") as EntityInstance).get("DirectionRatios") as number[];
		// `angle2yaxis(0)` is `[-Math.sin(0), Math.cos(0)]` -- `-Math.sin(0)` is IEEE-754
		// negative zero, not positive zero (already-established, pre-existing behavior of
		// `util/geolocation.ts`'s own `angle2yaxis`, not a new finding here) -- compared
		// by value, not by `Object.is`/`toEqual`'s own `-0`-vs-`0` distinction.
		expect(Math.abs(ratios[0])).toBe(0);
		expect(ratios[1]).toBe(1);
	});

	test("reuses the existing TrueNorth entity when it is not shared", () => {
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });
		editTrueNorth(file, { trueNorth: 10 });
		const firstDirection = model.get("TrueNorth") as EntityInstance;
		editTrueNorth(file, { trueNorth: 20 });
		expect((model.get("TrueNorth") as EntityInstance).identity()).toBe(firstDirection.identity());
	});

	test("creates a new TrueNorth entity for (at least) one context when the existing one is shared, and correctly updates both", () => {
		// Real Python's own loop checks `get_total_inverses` freshly on EACH context in
		// turn, so which of the two contexts ends up keeping the ORIGINAL shared entity's
		// identity (vs. getting a freshly created one) is itself iteration-order
		// dependent -- a real, if subtle, property of the real Python source, not
		// something this port should pin to one specific `file.byType` return order.
		// What must hold regardless of order: exactly one of the two keeps the original
		// identity, the other gets a different one, and BOTH end up with the correct,
		// final `DirectionRatios`.
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });
		const plan = addContext(file, { contextType: "Plan" });
		editTrueNorth(file, { trueNorth: 10 });
		const sharedDirection = file.createEntity("IfcDirection", [0, 1]);
		plan.set("TrueNorth", sharedDirection);
		model.set("TrueNorth", sharedDirection);
		expect(file.getTotalInverses(sharedDirection)).toBe(2);
		const sharedId = sharedDirection.identity();

		editTrueNorth(file, { trueNorth: 20 });

		const modelId = (model.get("TrueNorth") as EntityInstance).identity();
		const planId = (plan.get("TrueNorth") as EntityInstance).identity();
		expect(modelId).not.toBe(planId);
		expect([modelId, planId]).toContain(sharedId);
		expect((model.get("TrueNorth") as EntityInstance).get("DirectionRatios") as number[]).toEqual(
			(plan.get("TrueNorth") as EntityInstance).get("DirectionRatios") as number[],
		);
	});

	test("unsets true north, genuinely removing an orphaned TrueNorth entity (not just detaching it with a stale inverse)", () => {
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });
		editTrueNorth(file, { trueNorth: 10 });
		const direction = model.get("TrueNorth") as EntityInstance;
		expect(file.getTotalInverses(direction)).toBe(1);

		editTrueNorth(file, { trueNorth: null });

		expect(model.get("TrueNorth")).toBeNull();
		// This is the load-bearing assertion for the disclosed native inverse-index bug
		// workaround -- see `../../../src/api/georeference/editTrueNorth.ts`'s own header
		// comment: a regression back to a literal `context.TrueNorth = null` port would
		// leave `direction` permanently orphaned instead of genuinely removed.
		expect(file.byType("IfcDirection").some((d) => d.identity() === direction.identity())).toBe(false);
	});

	test("unsetting true north detaches (but does not delete) a TrueNorth entity that is ALSO referenced from outside any context's TrueNorth", () => {
		// A genuinely shared `IfcDirection` between TWO contexts' own `TrueNorth` would
		// still end up fully deleted by the end of a single call that unsets EVERY
		// context (whichever context is processed last always finds it orphaned by
		// then) -- a real, correct property of real Python's own per-context check, not
		// something this test should pin to a specific `file.byType` order. To
		// genuinely exercise the "still referenced elsewhere, must not be deleted"
		// branch, this reuses the same `IfcDirection` instance as an unrelated entity's
		// `Axis` attribute (a real, independent forward reference having nothing to do
		// with this module).
		const file = blankProjectFile(schema);
		const model = addContext(file, { contextType: "Model" });
		const shared = file.createEntity("IfcDirection", [0, 1]);
		model.set("TrueNorth", shared);
		const placement = file.createEntity(
			"IfcAxis2Placement3D",
			file.createEntity("IfcCartesianPoint", [0, 0, 0]),
			shared,
			file.createEntity("IfcDirection", [1, 0, 0]),
		);
		expect(file.getTotalInverses(shared)).toBe(2);

		editTrueNorth(file, { trueNorth: null });

		expect(model.get("TrueNorth")).toBeNull();
		// Still referenced by `placement.Axis` -- not deleted.
		expect((placement.get("Axis") as EntityInstance).identity()).toBe(shared.identity());
		expect(file.byType("IfcDirection").some((d) => d.identity() === shared.identity())).toBe(true);
	});
});
