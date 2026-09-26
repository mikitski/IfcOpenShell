// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_clip_solid.py` (src/ifcopenshell-python,
// `TestClipSolid`/`TestClipSolidIFC2X3`), run against every schema this build has
// registered (`AVAILABLE_SCHEMAS`, see `../../bootstrap.ts`'s own header comment) --
// the real Python `TestClipSolidIFC2X3` subclass runs the exact same test bodies
// against IFC2X3, so `describe.each(AVAILABLE_SCHEMAS)` reproduces that coverage
// directly rather than needing a separate IFC2X3-only `describe` block.
//
// `make_extrusion` (real Python: `ShapeBuilder(self.file).extrude(builder.rectangle(...))`)
// is reproduced as a bare `file.createEntity("IfcExtrudedAreaSolid")` -- `clip_solid`
// itself never inspects the extrusion's own attributes (`Clipping.apply` only ever reads
// `firstOperand.file` when `ifcFile` is falsy, and passes `firstOperand` straight through
// as `FirstOperand`), so a fully-populated real extrusion isn't needed to exercise this
// function's own logic, matching `removeBoolean.test.ts`'s own established "minimal
// stand-in operand" precedent for an unrelated reason (there, a missing dependency;
// here, genuine irrelevance).
//
// **Reference-parity chunk 4 of 5 update (2026-09-25):** `TODOS.md`'s "EntityInstance
// .setByIndex/IfcFile.createEntity ..." gate (PR #179) is now fixed, and the
// `editPset`-new-property gate (`api.pset` chunk) was already flipped in chunk 2 of 5.
// `test_element_registers_result_in_bbim_boolean`/
// `test_element_appends_to_existing_bbim_boolean` are now flipped to their real,
// verified assertions -- confirmed against this chunk's own freshly-built native addon
// on all 3 schemas (the `element`-provided branch is byte-for-byte identical whether
// `pset` is brand-new or pre-existing, per `clipSolid.ts`'s own header comment, so both
// tests exercise the exact same, now-working, `editPset` call).

import { describe, expect, test } from "vitest";
import { clipSolid } from "../../../src/api/geometry/clipSolid";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function makeExtrusion(file: IfcFile): EntityInstance {
	return file.createEntity("IfcExtrudedAreaSolid");
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.clipSolid (%s)", (schema) => {
	test("returns an IfcBooleanClippingResult", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);

		const result = clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1] });

		expect(result.isA("IfcBooleanClippingResult")).toBe(true);
		expect(result.get("Operator")).toBe("DIFFERENCE");

		file.dispose();
	});

	test("first operand is the item", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);

		const result = clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1] });

		expect((result.get("FirstOperand") as EntityInstance).equals(extrusion)).toBe(true);

		file.dispose();
	});

	test("second operand is a half-space solid", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);

		const result = clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1] });

		expect((result.get("SecondOperand") as EntityInstance).isA("IfcHalfSpaceSolid")).toBe(true);

		file.dispose();
	});

	test("clip plane location matches", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);

		const result = clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1] });

		const plane = (result.get("SecondOperand") as EntityInstance).get("BaseSurface") as EntityInstance;
		const coords = (plane.get("Position") as EntityInstance).get("Location") as EntityInstance;
		expect(coords.get("Coordinates")).toEqual([0, 0, 3]);

		file.dispose();
	});

	test("chaining two clips", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);

		const firstClip = clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1] });
		const secondClip = clipSolid(file, { item: firstClip, location: [0, 0, 1], normal: [0, 0, -1] });

		expect(secondClip.isA("IfcBooleanClippingResult")).toBe(true);
		expect((secondClip.get("FirstOperand") as EntityInstance).equals(firstClip)).toBe(true);
		expect((firstClip.get("FirstOperand") as EntityInstance).equals(extrusion)).toBe(true);

		file.dispose();
	});

	test("an angled clip plane", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);

		const result = clipSolid(file, { item: extrusion, location: [0, 0, 3.26], normal: [0.419, 0.0, 0.908] });

		expect(result.isA("IfcBooleanClippingResult")).toBe(true);
		expect((result.get("SecondOperand") as EntityInstance).isA("IfcHalfSpaceSolid")).toBe(true);

		file.dispose();
	});

	// Real Python: `test_element_registers_result_in_bbim_boolean`.
	test("element registers the clipping result in the BBIM_Boolean pset", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);
		const wall = file.createEntity("IfcWall");

		const result = clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1], element: wall });

		const pset = elementUtil.getPset(wall, "BBIM_Boolean") as Record<string, unknown>;
		expect(pset).not.toBeNull();
		expect(JSON.parse(pset.Data as string)).toContain(result.id());

		file.dispose();
	});

	// Real Python: `test_element_appends_to_existing_bbim_boolean` -- confirms the
	// SAME `editPset` call works identically on the "pre-existing pset" path (not just
	// the "brand new pset" path above).
	test("element appends to an existing BBIM_Boolean pset", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);
		const wall = file.createEntity("IfcWall");

		const first = clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1], element: wall });
		const second = clipSolid(file, { item: first, location: [0, 0, 1], normal: [0, 0, -1], element: wall });

		const pset = elementUtil.getPset(wall, "BBIM_Boolean") as Record<string, unknown>;
		const ids = JSON.parse(pset.Data as string);
		expect(ids).toContain(first.id());
		expect(ids).toContain(second.id());

		file.dispose();
	});

	test("no element does not create a pset", () => {
		const file = createTestFile(schema);
		const extrusion = makeExtrusion(file);
		const wall = file.createEntity("IfcWall");

		clipSolid(file, { item: extrusion, location: [0, 0, 3], normal: [0, 0, 1] });

		expect(elementUtil.getPset(wall, "BBIM_Boolean")).toBeNull();

		file.dispose();
	});
});
