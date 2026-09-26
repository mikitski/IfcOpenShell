// This file was generated with the assistance of an AI coding tool.
//
// Phase 2.5's "file open/parse time" benchmark (planning/ifcopenshell-ts/20-roadmap.md's
// "Phase 2.5 -- Alpha checkpoint"). Times both the sync path (`native.file_new_with_path`,
// the minimal-arity raw primitive -- test/native/primitives.test.ts's own precedent for
// synchronous path-based open, since the `file` class-level facade has no synchronous
// class-level convenience method for this arity, see that test's own comment) and the
// async path (`file.open_path_async`, test/native/event_loop.test.ts's own established
// path) opening the same WALL_COUNT-entity fixture, written to disk as real IFC-SPF
// text (fixture.ts's writeFixtureToPath). Covers both because both are primary paths a
// real caller would use (a synchronous CLI tool vs. a server not wanting to block its
// event loop, e.g. the exact scenario test/native/event_loop.test.ts's own liveness
// test exists for) -- this chunk's task brief leaves the sync/async choice open ("your
// call, but at minimum cover the primary path a real caller would use"); covering both
// costs little extra given the fixture-build/write is shared.
//
// See attributeAccess.bench.ts's header comment for why this is hand-rolled timing +
// expect() rather than vitest's own bench() API.
//
// Threshold reasoning: could not be measured locally (no cmake/working Boost install
// in this sandbox to build the real addon -- see this PR's own final report).
// test/native/event_loop.test.ts's own comment on this exact same WALL_COUNT/fixture
// size ("expected to run at least tens of milliseconds" for a full parse) is the only
// real reference point available to this PR; FILE_OPEN_MAX_MS is set roughly two
// orders of magnitude above that "tens of milliseconds" figure to absorb CI-runner
// slowness/noise while still catching a genuine parse-time regression (a real
// regression that made parsing e.g. 100x slower would still be well within a human
// generation of catching, long before it grew large enough to threaten this
// threshold). Loosen (with a comment, matching this project's established practice)
// if this flakes in CI.

import { performance } from "node:perf_hooks";
import { describe, expect, test } from "vitest";
import { file as NativeFile } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import { WALL_COUNT, buildLargeFixtureFile, writeFixtureToPath } from "./fixture";
import { recordResult } from "./reporter";

/** See this file's header comment for why this is deliberately generous. */
const FILE_OPEN_MAX_MS = 10_000;

describe("Phase 2.5 benchmark: file open/parse time on a large fixture", () => {
	test(`sync open of a ${WALL_COUNT}-entity file completes within ${FILE_OPEN_MAX_MS}ms`, () => {
		const fixture = buildLargeFixtureFile();
		const targetPath = writeFixtureToPath(fixture);
		// See attributeAccess.bench.ts's own disposal comment -- not strictly
		// load-bearing; only the on-disk file (already written above) is needed
		// past this point.
		fixture.dispose();

		const start = performance.now();
		// The minimal-arity raw native function (no class-level sync convenience
		// method exists for this arity -- see this file's header comment).
		const reopened = new NativeFile(native.file_new_with_path(targetPath));
		const durationMs = performance.now() - start;

		try {
			expect(reopened.get_max_id()).toBe(WALL_COUNT);

			recordResult({ name: "fileOpen.sync", wallCount: WALL_COUNT, durationMs });
			expect(durationMs).toBeLessThan(FILE_OPEN_MAX_MS);
		} finally {
			reopened.dispose();
		}
	}, 60_000);

	test(`async open (open_path_async) of a ${WALL_COUNT}-entity file completes within ${FILE_OPEN_MAX_MS}ms`, async () => {
		const fixture = buildLargeFixtureFile();
		const targetPath = writeFixtureToPath(fixture);
		fixture.dispose();

		const start = performance.now();
		const reopened = await NativeFile.open_path_async(targetPath);
		const durationMs = performance.now() - start;

		try {
			expect(reopened.get_max_id()).toBe(WALL_COUNT);

			recordResult({ name: "fileOpen.async", wallCount: WALL_COUNT, durationMs });
			expect(durationMs).toBeLessThan(FILE_OPEN_MAX_MS);
		} finally {
			reopened.dispose();
		}
	}, 60_000);
});
