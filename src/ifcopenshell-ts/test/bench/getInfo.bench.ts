// This file was generated with the assistance of an AI coding tool.
//
// Phase 2.5's "bulk get_info on a large fixture model" benchmark
// (planning/ifcopenshell-ts/20-roadmap.md's "Phase 2.5 -- Alpha checkpoint": "the plan
// makes several performance claims with nothing verifying them (bulk get_info_cpp
// serializer...)"). Calls EntityInstance.getInfo(recursive) on every entity in the
// WALL_COUNT-entity fixture (fixture.ts, reusing test/native/event_loop.test.ts's
// established fixture pattern) and asserts the total wall time stays under a
// documented threshold.
//
// entityInstance.ts's own header comment already discloses that there is no real C++
// `get_info_cpp` function to bind (it's SWIG/Python-only glue) -- this exercises the
// TS port's actual bulk-serialization path instead: one `get_all_attribute_values()`
// native call per instance (not one native call per attribute), plus TS-side
// wrapValue()/recursion. That "one native call per instance, not per attribute" shape
// is exactly the design property this benchmark is meant to keep honest going forward.
//
// See attributeAccess.bench.ts's header comment for why this is hand-rolled timing +
// expect() rather than vitest's own bench() API -- same reasoning, not repeated here.
//
// Threshold reasoning: could not be measured locally (no cmake/working Boost install
// in this sandbox to build the real addon -- see this PR's own final report), so
// GET_INFO_MAX_MS is a deliberately generous order-of-magnitude estimate, not a tuned
// number. getInfo(true) per entity does one bulk get_all_attribute_values() native
// call plus a handful of JS-side wrapValue()/recursion steps -- fixture.ts's fixture
// deliberately leaves OwnerHistory/ObjectPlacement/Representation unset (null) on
// every wall specifically so the recursive walk terminates immediately for those and
// this benchmark measures WALL_COUNT flat get_info calls, not an arbitrarily-deep
// reference graph. Loosen (with a comment, matching this project's established
// practice) if this flakes in CI.

import { performance } from "node:perf_hooks";
import { describe, expect, test } from "vitest";
import { WALL_COUNT, buildLargeFixtureFile } from "./fixture";
import { recordResult } from "./reporter";

/** See this file's header comment for why this is deliberately generous. */
const GET_INFO_MAX_MS = 15_000;

describe("Phase 2.5 benchmark: bulk getInfo(recursive) on a large fixture", () => {
	test(`getInfo(true) on all ${WALL_COUNT} entities completes within ${GET_INFO_MAX_MS}ms`, () => {
		const file = buildLargeFixtureFile();
		try {
			const walls = file.byType("IfcWall");
			expect(walls.length).toBe(WALL_COUNT);

			const start = performance.now();
			for (const wall of walls) {
				wall.getInfo(true);
			}
			const durationMs = performance.now() - start;

			recordResult({
				name: "getInfo.bulkRecursive",
				wallCount: WALL_COUNT,
				durationMs,
				avgMsPerEntity: durationMs / WALL_COUNT,
			});

			expect(durationMs).toBeLessThan(GET_INFO_MAX_MS);
		} finally {
			// See attributeAccess.bench.ts's own disposal comment -- not strictly
			// load-bearing, just no reason to hold this open past the test.
			file.dispose();
		}
	}, 60_000);
});
