// This file was generated with the assistance of an AI coding tool.
//
// Small shared helper backing Phase 2.5's benchmark suite (see fixture.ts / the
// individual *.bench.ts files). Each benchmark's real CI gate is its own
// `expect(...).toBeLessThan(...)`/`toBeGreaterThan(...)` assertion against a
// documented threshold (see each file's own header comment for why hand-rolled timing
// + assertions was chosen over vitest's `bench()` API) -- this module's only job is
// making the actual measured numbers *visible* alongside that pass/fail outcome
// (planning/ifcopenshell-ts/20-roadmap.md's own framing for the separate,
// non-gating Python-baseline comparison: "visible and tracked", which only means
// something if the TS-side numbers it's compared against are themselves visible
// somewhere, not just implicit in whether an assertion passed).
//
// Writes one JSON-lines-shaped array to `bench-results.json` at the package root
// (gitignored -- see .gitignore) so a CI step can upload it as a build artifact for a
// maintainer to inspect trends over time, in addition to the immediate console output
// every CI log already shows.

import * as fs from "node:fs";
import * as path from "node:path";

export interface BenchResult {
	name: string;
	[key: string]: unknown;
}

const RESULTS_PATH = path.join(__dirname, "..", "..", "bench-results.json");

export function recordResult(result: BenchResult): void {
	console.log(`[bench] ${result.name}: ${JSON.stringify(result)}`);

	let existing: BenchResult[] = [];
	try {
		const raw = fs.readFileSync(RESULTS_PATH, "utf-8");
		existing = JSON.parse(raw) as BenchResult[];
	} catch {
		existing = [];
	}
	existing.push({ ...result, recordedAt: new Date().toISOString() });
	fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(existing, null, 2)}\n`);
}
