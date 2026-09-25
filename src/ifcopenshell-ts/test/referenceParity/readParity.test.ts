// This file was generated with the assistance of an AI coding tool.
//
// Chunk 1's own verification test suite
// (planning/ifcopenshell-ts/80-reference-parity-testing-plan.md): for each of the 30
// vendored buildingSMART `Simple-Scene` reference fixtures
// (`test/fixtures/reference/<schema>/<domain>.ifc`), opens it via this port's own
// `open()`, dumps it via `dump.ts`'s `dumpFile`, loads the fixture's own already
// checked-in `<domain>.golden.json` (generated once, offline, by the orchestrating
// session's real `ifcopenshell-python` install via `tools/reference_dump_python.py` --
// never regenerated here, no Python needed), and diffs them with `diff.ts`'s
// `diffFileDumps`. Cheap and Python-free by construction (per the plan doc's §3): pure
// JSON-load + native-addon-backed read + in-memory diff, safe for normal `npm test`/PR
// CI.
//
// Result (investigated in full, not just run-and-hope, per this chunk's own task
// brief): all 30 fixtures pass with ZERO mismatches across every instance/attribute in
// every file -- no `KNOWN_DIVERGENCES`/pinning section is needed for chunk 1. Several
// already-disclosed primitive-layer gaps that looked like plausible candidates for a
// read-parity mismatch (`TODOS.md`'s "collapse EXPRESS INTEGER vs. REAL into one JS
// `number`" -- doesn't surface here because this diff compares already-`JSON.parse`d
// in-memory values, see `diff.ts`'s own header comment; and the LOGICAL-attribute
// `true`/`false`/`"UNKNOWN"` vs. raw `0`/`1`/`2` read-path divergence newly found while
// building this suite, `ifcopenshell_native.cpp`'s `IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_
// LOGICAL` case) were independently confirmed NOT to manifest in this specific 30-file
// corpus (no vendored fixture contains a real instance of any of the ~20-30
// LOGICAL-attribute-bearing declarations across the three schemas, e.g.
// `IfcMaterialLayer`/`IfcPresentationLayerWithStyle`/`IfcShapeAspect` -- checked
// directly against every golden, not assumed) -- see this dispatch's own final report
// for the full investigation and why the LOGICAL gap is still worth a dedicated
// `TODOS.md` entry despite not tripping any of these 30 fixtures.

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
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

describe("reference parity fixture bookkeeping", () => {
	test("all 30 real, vendored reference fixtures are present with a checked-in golden", () => {
		expect(referenceFixtures).toHaveLength(30);
		for (const fixture of referenceFixtures) {
			expect(fs.existsSync(fixture.ifcPath)).toBe(true);
			expect(fs.existsSync(fixture.goldenPath)).toBe(true);
		}
	});
});

describe("reference parity: TS dump() vs. real ifcopenshell-python golden", () => {
	for (const fixture of referenceFixtures) {
		test.skipIf(!AVAILABLE_SCHEMAS.includes(fixture.schema))(`${fixture.schemaDir}/${fixture.domain}`, () => {
			const golden = JSON.parse(fs.readFileSync(fixture.goldenPath, "utf8")) as FileDump;
			const file = open(fixture.ifcPath);
			let mismatches: DumpMismatch[];
			try {
				const actual = dumpFile(file);
				mismatches = diffFileDumps(golden, actual);
			} finally {
				file.dispose();
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
