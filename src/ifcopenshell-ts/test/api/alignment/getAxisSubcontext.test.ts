// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_axis_subcontext.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here. NOT gated to IFC4X3 (unlike every other file in this chunk) --
// `get_axis_subcontext` only touches `IfcGeometricRepresentationContext`/
// `IfcGeometricRepresentationSubContext`, both schema-generic classes with no
// IFC4X3-only dependency of their own; tested across every `AVAILABLE_SCHEMAS` entry,
// matching `api.context.addContext.test.ts`'s own established `describe.each`
// convention for this same pair of classes.
//
// Real Python's fixture is `test.bootstrap`'s own project-and-unit-free starting
// point (`stripProjectBootstrap`, matching `api.context.addContext.test.ts`'s own
// `blankProjectFile` helper, duplicated here per this project's established
// per-file-local-helper convention).

import { describe, expect, test } from "vitest";
import { getAxisSubcontext } from "../../../src/api/alignment/getAxisSubcontext";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

describe.each(AVAILABLE_SCHEMAS)("api.alignment.getAxisSubcontext (%s)", (schema) => {
	test("creates the Model/Axis/MODEL_VIEW subcontext when none exists", () => {
		const file = blankProjectFile(schema);
		expect(file.byType("IfcGeometricRepresentationSubContext")).toHaveLength(0);

		const subcontext = getAxisSubcontext(file);

		expect(subcontext.isA()).toBe("IfcGeometricRepresentationSubContext");
		expect(subcontext.get("ContextType")).toBe("Model");
		expect(subcontext.get("ContextIdentifier")).toBe("Axis");
		expect(subcontext.get("TargetView")).toBe("MODEL_VIEW");
		expect(file.byType("IfcGeometricRepresentationSubContext")).toHaveLength(1);
		expect(file.byType("IfcGeometricRepresentationContext", false)).toHaveLength(1);
	});

	test("returns the existing subcontext, without creating a duplicate, on a second call", () => {
		const file = blankProjectFile(schema);
		const first = getAxisSubcontext(file);
		const second = getAxisSubcontext(file);

		expect(second.equals(first)).toBe(true);
		expect(file.byType("IfcGeometricRepresentationSubContext")).toHaveLength(1);
	});
});
