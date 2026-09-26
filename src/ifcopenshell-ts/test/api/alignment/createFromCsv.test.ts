// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file is reusable here -- real Python's own
// `test_create_from_csv.py` presumes a fully functional `create_layout_segment()`
// (`create()` itself now succeeds -- see `../../../src/api/alignment/create.ts`'s own
// header comment). Original test coverage written here, pinning the real, portable
// CSV-parsing logic (hand-rolled, matching this project's "no new npm dependency for
// small hand-rollable parsing" convention -- see
// `../../../src/api/alignment/createFromCsv.ts`'s own header comment) that runs up to
// the exact point the first row's `layoutHorizontalAlignmentByPiMethod` call throws (the
// still-open, real-geometry-kernel-needing `_getSegmentEndpoint` gap -- not `create()`'s
// own gap, which has since been fixed).
//
// --- Upstream sync, chunk 3 of 4 (real upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`) ---
//
// `startStation` is a new optional parameter (default `null`) -- see
// `../../../src/api/alignment/createFromCsv.ts`'s own header comment. Its own
// `addStationingReferent` call is never reached by any real invocation of this function
// today (the function always throws earlier, at `layoutHorizontalAlignmentByPiMethod`'s
// own unconditional kernel gap) -- added a dedicated test below pinning this.

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
	test("still unconditionally blocked on the very first CSV row, now via layoutHorizontalAlignmentByPiMethod's kernel gap (not create())", () => {
		const file = createTestFile("IFC4X3");
		const filepath = writeCsv("0,0,0,100,0,50,200,100\n");

		expect(() => createFromCsv(file, filepath)).toThrow();

		// `create()`'s own real, portable prefix now succeeds completely before the throw
		// (see `create.test.ts`).
		expect(file.byType("IfcAlignment").length).toBe(1);
	});

	test("startStation, when given, is never reached -- the function still throws at the same kernel gap first, no referent is created", () => {
		const file = createTestFile("IFC4X3");
		const filepath = writeCsv("0,0,0,100,0,50,200,100\n");

		expect(() => createFromCsv(file, filepath, 10000.0)).toThrow();

		expect(file.byType("IfcReferent")).toHaveLength(0);
	});

	test("real, portable second-row parsing never runs -- the same kernel gap throws before the loop's second iteration", () => {
		const file = createTestFile("IFC4X3");
		// A second row would describe a vertical alignment via `addVerticalLayout`, but
		// `layoutHorizontalAlignmentByPiMethod` throws unconditionally while processing
		// the FIRST row, before this row is ever read.
		const filepath = writeCsv("0,0,0,100,0,50,200,100\n0,0,0,100,10,40,200,10\n");

		expect(() => createFromCsv(file, filepath)).toThrow();

		// Only the first row's alignment exists -- no vertical layout was ever added.
		expect(file.byType("IfcAlignment").length).toBe(1);
		expect(file.byType("IfcAlignmentVertical").length).toBe(0);
	});
});
