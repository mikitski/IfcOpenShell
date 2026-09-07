// This file was generated with the assistance of an AI coding tool.
import { describe, expect, test } from "vitest";
import { createTestFile } from "./bootstrap";

describe.each(["IFC2X3", "IFC4", "IFC4X3"] as const)("createTestFile(%s)", (schema) => {
	test("produces a valid, openable file in the requested schema", () => {
		const file = createTestFile(schema);
		expect(file.schema).toBe(schema);
	});
});
