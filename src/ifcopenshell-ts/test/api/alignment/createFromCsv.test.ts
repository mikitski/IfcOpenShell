// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file is reusable here -- real Python's own
// `test_create_from_csv.py` presumes a fully functional `create()`, unconditionally
// blocked in this port (see `../../../src/api/alignment/create.ts`'s own header
// comment). Original test coverage written here, pinning the real, portable CSV-parsing
// logic (hand-rolled, matching this project's "no new npm dependency for small
// hand-rollable parsing" convention -- see `../../../src/api/alignment/createFromCsv.ts`'s
// own header comment) that runs up to the exact point the first row's `create()` call
// throws.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { createFromCsv } from "../../../src/api/alignment/createFromCsv";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function writeCsv(content: string): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-createFromCsv-test-"));
	const filepath = path.join(dir, "alignment.csv");
	fs.writeFileSync(filepath, content, "utf-8");
	return filepath;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createFromCsv (IFC4X3)", () => {
	test("CONFIRMED unconditionally blocked on the very first CSV row, via create()", () => {
		const file = createTestFile("IFC4X3");
		const filepath = writeCsv("0,0,0,100,0,50,200,100\n");

		expect(() => createFromCsv(file, filepath)).toThrow();

		// `create()`'s own real, portable prefix ran before the throw (see
		// `create.test.ts`).
		expect(file.byType("IfcAlignment").length).toBe(1);
	});

	test("real, portable second-row parsing never runs -- create() throws before the loop's second iteration", () => {
		const file = createTestFile("IFC4X3");
		// A second row would describe a vertical alignment via `addVerticalLayout`, but
		// `create()` throws unconditionally on the FIRST row, before this row is ever read.
		const filepath = writeCsv("0,0,0,100,0,50,200,100\n0,0,0,100,10,40,200,10\n");

		expect(() => createFromCsv(file, filepath)).toThrow();

		// Only the first row's alignment exists -- no vertical layout was ever added.
		expect(file.byType("IfcAlignment").length).toBe(1);
		expect(file.byType("IfcAlignmentVertical").length).toBe(0);
	});
});
