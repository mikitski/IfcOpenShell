// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/bootstrap.py`'s fixture pattern
// (planning/ifcopenshell-ts/40-testing-strategy.md SS3) -- `createTestFile(schema)`
// is the foundation every later phase's tests build on. Python achieves "run the same
// test body against IFC2X3/IFC4/IFC4X3" via multiple inheritance
// (`class TestXIFC2X3(test.bootstrap.IFC2X3, TestX): pass`); this reproduces the same
// effect with Vitest's `describe.each`, per the testing-strategy doc's own
// recommendation, rather than attempting a TS equivalent of Python's mixin trick.

import type { IfcFile } from "../src/file";
import * as template from "../src/template";

export type Schema = "IFC2X3" | "IFC4" | "IFC4X3";

// `template.create`'s `schemaIdentifier` needs the real, C++-core-registered
// identifier (`file_mixin._determine_schema_identifier`'s own IFC4X3 -> IFC4X3_ADD2
// alias, `research/01-python-core-and-lowlevel.md` SS2.2) -- this repo's IFC4X3
// build currently registers the schema as `IFC4X3_ADD2`, see `IfcFile.schema`'s own
// parsing of whatever the core actually reports.
const SCHEMA_IDENTIFIERS: Record<Schema, string> = {
	IFC2X3: "IFC2X3",
	IFC4: "IFC4",
	IFC4X3: "IFC4X3_ADD2",
};

export function createTestFile(schema: Schema): IfcFile {
	return template.create({ schemaIdentifier: SCHEMA_IDENTIFIERS[schema] });
}
