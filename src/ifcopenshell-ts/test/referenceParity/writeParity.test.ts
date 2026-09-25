// This file was generated with the assistance of an AI coding tool.
//
// Chunk 2's own verification test suite
// (planning/ifcopenshell-ts/80-reference-parity-testing-plan.md, chunk 2 "Round-trip
// write-back parity"): for each of the 30 vendored buildingSMART `Simple-Scene`
// reference fixtures (`test/fixtures/reference/<schema>/<domain>.ifc`), this:
//   1. opens the fixture via this port's own `open()`,
//   2. writes it back out via `IfcFile.write(path)` (the only write primitive this port
//      exposes -- `file.ts`'s own doc comment: path-based only, no in-memory
//      buffer/string-returning variant) to a fresh temp file,
//   3. re-opens the newly-written temp file via `open()` again,
//   4. dumps the re-parsed file via `dump.ts`'s existing `dumpFile`,
//   5. diffs the result against the SAME chunk-1 golden JSON already checked in for that
//      fixture (`diff.ts`'s existing `diffFileDumps`) -- NOT a fresh Python re-dump of
//      the newly-written file.
//
// If `dumpFile(reparse(write(read(fixture))))` matches the golden that was generated
// from the ORIGINAL file, the write path round-trips faithfully without needing Python
// at verification time (plan doc §5, chunk 2's own ASCII diagram). Cheap and
// Python-free by construction, same as chunk 1's `readParity.test.ts` -- safe for
// normal `npm test`/PR CI.
//
// Result (investigated in full, not just run-and-hope, per this chunk's own task
// brief): all 30 fixtures pass with ZERO mismatches -- the write path round-trips every
// instance/attribute in every file faithfully. No `KNOWN_DIVERGENCES`/pinning section is
// needed for chunk 2. The LOGICAL-typed attribute native marshaling gap flagged by
// chunk 1 (`dump.ts`'s own header comment, `validate.ts`'s header comment #2 -- reads a
// LOGICAL attribute back as a raw JS `number` `0`/`1`/`2` instead of Python's
// `false`/`true`/`"UNKNOWN"`) was re-confirmed NOT relevant here for the same reason as
// chunk 1: none of these 30 fixtures contain a real instance of any LOGICAL-attribute-
// bearing declaration (checked directly against every golden, not assumed) -- so it
// cannot surface as either a read-parity OR a write-round-trip mismatch in this corpus,
// though it remains a real, disclosed gap for whenever a fixture that does exercise it
// shows up (chunk 3's mutation battery, or a future corpus addition).

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { open } from "../../src/open";
import { AVAILABLE_SCHEMAS, type Schema } from "../bootstrap";
import { type DumpMismatch, diffFileDumps } from "./diff";
import { type FileDump, dumpFile } from "./dump";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures", "reference");

const SCHEMA_DIR_TO_SCHEMA: Record<string, Schema> = {
	ifc2x3: "IFC2X3",
	ifc4: "IFC4",
	ifc4x3: "IFC4X3",
};

interface ReferenceFixture {
	readonly schemaDir: string;
	readonly schema: Schema;
	readonly domain: string;
	readonly ifcPath: string;
	readonly goldenPath: string;
}

const referenceFixtures: ReferenceFixture[] = Object.keys(SCHEMA_DIR_TO_SCHEMA)
	.flatMap((schemaDir) => {
		const dir = path.join(FIXTURES_ROOT, schemaDir);
		return fs
			.readdirSync(dir)
			.filter((name) => name.endsWith(".ifc"))
			.sort()
			.map((name) => {
				const domain = name.replace(/\.ifc$/, "");
				return {
					schemaDir,
					schema: SCHEMA_DIR_TO_SCHEMA[schemaDir],
					domain,
					ifcPath: path.join(dir, name),
					goldenPath: path.join(dir, `${domain}.golden.json`),
				};
			});
	})
	.sort((a, b) =>
		a.schemaDir === b.schemaDir ? a.domain.localeCompare(b.domain) : a.schemaDir.localeCompare(b.schemaDir),
	);

// Temp files created by the in-flight test, cleaned up in `afterEach` even on a thrown
// assertion/exception mid-test -- matches `file.ts`'s own `toSpfTextViaTempFile`
// best-effort-cleanup precedent (a leftover temp file isn't a correctness problem, but
// there's no reason to leave one behind on every run).
let pendingTempPaths: string[] = [];

function makeTempIfcPath(domain: string): string {
	const tempPath = path.join(
		os.tmpdir(),
		`ifcopenshell-ts-write-parity-${domain}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.ifc`,
	);
	pendingTempPaths.push(tempPath);
	return tempPath;
}

afterEach(() => {
	for (const tempPath of pendingTempPaths) {
		try {
			fs.unlinkSync(tempPath);
		} catch {
			// Best-effort cleanup, same rationale as `file.ts`'s `toSpfTextViaTempFile`.
		}
	}
	pendingTempPaths = [];
});

describe("reference parity fixture bookkeeping", () => {
	test("all 30 real, vendored reference fixtures are present with a checked-in golden", () => {
		expect(referenceFixtures).toHaveLength(30);
		for (const fixture of referenceFixtures) {
			expect(fs.existsSync(fixture.ifcPath)).toBe(true);
			expect(fs.existsSync(fixture.goldenPath)).toBe(true);
		}
	});
});

describe("reference parity: write-back round trip (TS write -> TS reparse -> TS dump) vs. chunk 1's golden", () => {
	for (const fixture of referenceFixtures) {
		test.skipIf(!AVAILABLE_SCHEMAS.includes(fixture.schema))(`${fixture.schemaDir}/${fixture.domain}`, () => {
			const golden = JSON.parse(fs.readFileSync(fixture.goldenPath, "utf8")) as FileDump;

			const original = open(fixture.ifcPath);
			const tempPath = makeTempIfcPath(`${fixture.schemaDir}-${fixture.domain}`);
			let mismatches: DumpMismatch[];
			try {
				original.write(tempPath);
				const reparsed = open(tempPath);
				try {
					const actual = dumpFile(reparsed);
					mismatches = diffFileDumps(golden, actual);
				} finally {
					reparsed.dispose();
				}
			} finally {
				original.dispose();
			}

			if (mismatches.length > 0) {
				console.log(
					`${fixture.schemaDir}/${fixture.domain}: ${mismatches.length} mismatch(es)`,
					mismatches.slice(0, 20),
				);
			}
			expect(mismatches).toEqual([]);
		});
	}
});
