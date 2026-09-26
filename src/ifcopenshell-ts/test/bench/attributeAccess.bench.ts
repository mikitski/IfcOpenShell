// This file was generated with the assistance of an AI coding tool.
//
// Phase 2.5's "attribute access in a tight loop, with vs. without the cache" benchmark
// (planning/ifcopenshell-ts/20-roadmap.md's "Phase 2.5 -- Alpha checkpoint";
// 10-architecture.md SS6, "Attribute access design"). Directly *proves* SS6's own
// claim -- "the Proxy must NOT call the native get_attribute_category/
// get_argument_index primitives on every access" -- rather than just asserting it:
// this measures the cached Proxy `get` trap (`wall.Name`, entityInstance.ts's
// ENTITY_INSTANCE_PROXY_HANDLER, which consults attributeCache.ts's per-(schema,class)
// cache) against the uncached `.get(name)` escape hatch (entityInstance.ts's own
// `get()` method, which calls the native `get_attribute_category`/`get_argument_index`
// primitives on every single call, by design -- see that method's own doc comment)
// over the same WALL_COUNT-entity fixture. test/attributeCache.test.ts and
// test/entityInstanceProxy.test.ts already cover both paths' *correctness*; this file
// is the first to measure the cache's actual real-world speedup.
//
// No new "benchmark-only" cache-bypass code was needed: `.get(name)` already *is* the
// correctly-scoped, always-available uncached comparison path -- entityInstance.ts's
// own header comment already describes it as "the always-correct, uncached escape
// hatch... used directly by the Proxy itself as the fallback for a cache miss" -- so
// using it here isn't new public API surface, only exercising surface Phase 2 already
// shipped, for a new purpose.
//
// Not written with vitest's own `bench()` API (Vitest's built-in benchmarking mode):
// `bench()` reports timing results but has no built-in pass/fail-against-a-threshold
// concept of its own, so a `bench()` suite alone can't gate CI -- this is deliberately
// hand-rolled timing plus an ordinary `test()`/`expect()` assertion against a
// documented threshold instead, so a real regression actually fails this job, not just
// prints a number nobody reads (this project's other benchmarks in this directory make
// the same choice, for the same reason).
//
// Threshold reasoning: could not be measured locally (no `cmake`/working Boost
// install in this sandbox to build the real addon against the real C++ core -- see
// this PR's own final report for the full disclosed gap), so CACHE_SPEEDUP_MIN is
// derived from counting native-primitive calls per access instead of a real
// measurement, then set with real headroom below that estimate. Per access, once the
// cache is warm (both `_typeInfo` on the instance and attributeCache.ts's
// per-(schema,class) cache -- see the warm-up pass below): the cached path
// (`wall.Name` -> Proxy trap -> `getByIndex`) makes 4 native calls
// (`getByIndex`'s own `attributeCount()` helper always calls `declaration()` +
// `as_entity()` + `attribute_count()`, shared by both paths, plus
// `get_attribute_value`); the uncached path (`.get("Name")`) makes those same 4 plus
// `get_attribute_category` + `get_argument_index` = 6. That's a 6:4 = 1.5x
// native-call-count ratio -- if per-call N-API marshaling overhead dominates (the
// premise 10-architecture.md SS6 is built on), wall-clock speedup should land at or
// above that. CACHE_SPEEDUP_MIN=1.15 sits well below the 1.5x estimate (real headroom
// for CI noise, and for that estimate simply being wrong in some direction this PR
// couldn't verify) while still comfortably separating "cache works" from "cache
// silently broken" (a full regression back to always calling
// `get_attribute_category`/`get_argument_index` would show a ratio at or near 1.0,
// not 1.15+) -- the goal here is "catch a regression that silently reintroduces
// per-attribute native crossings the caching design exists to avoid" (the roadmap's
// own framing), not to pin down the exact multiple. CI runners are typically
// slower/noisier than local dev machines, and this project has already hit real CI
// timing flakiness on a different test (test/native/event_loop.test.ts's
// MAX_ALLOWED_TICK_GAP_MS, see that file's own comment), hence erring generous.
// Loosen further (with a comment explaining why, matching this project's own
// established practice) if this flakes in CI -- that would mean the threshold, not
// the cache design, is wrong.

import { performance } from "node:perf_hooks";
import { describe, expect, test } from "vitest";
import { _clearAttributeMetaCacheForTests } from "../../src/attributeCache";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { WALL_COUNT, buildLargeFixtureFile } from "./fixture";
import { recordResult } from "./reporter";

/** See this file's header comment for why this is deliberately conservative. */
const CACHE_SPEEDUP_MIN = 1.15;

function timeCachedAccess(walls: readonly EntityInstance[]): number {
	const start = performance.now();
	for (const wall of walls) {
		// The Proxy `get` trap (entityInstance.ts's ENTITY_INSTANCE_PROXY_HANDLER):
		// resolves via attributeCache.ts's per-(schema,class) cache -- no
		// `get_attribute_category`/`get_argument_index` native call once the cache is
		// warm (primed below, before timing starts).
		void wall.Name;
	}
	return performance.now() - start;
}

function timeUncachedAccess(walls: readonly EntityInstance[]): number {
	const start = performance.now();
	for (const wall of walls) {
		// The always-correct escape hatch (entityInstance.ts's `.get()`): a real
		// `get_attribute_category` + `get_argument_index` native call on every single
		// iteration, by design -- never consults or populates the cache.
		void wall.get("Name");
	}
	return performance.now() - start;
}

function runCachedVsUncachedBenchmark(file: IfcFile): void {
	const walls = file.byType("IfcWall");
	expect(walls.length).toBe(WALL_COUNT);

	// Prime the per-(schema,class) attribute-metadata cache (attributeCache.ts)
	// once, up front -- a real caller's first access to a class already pays
	// this one-time population cost, so excluding it from the timed loop
	// measures the cache's *steady-state* benefit (the actual claim under
	// test: "since [attribute access] runs on every single attribute access
	// ... the Proxy must NOT call the native primitives on every access"), not
	// the one-time cost every class pays exactly once regardless of entity
	// count.
	_clearAttributeMetaCacheForTests();
	void walls[0].Name;

	// Warm-up pass over both paths (results discarded), for two independent
	// reasons: (1) V8 JIT/inline caches get hot for both before the timed
	// measurement below -- otherwise whichever loop happens to run first would
	// unfairly absorb JIT warm-up cost the other loop wouldn't pay; (2) this
	// cached-path call also populates each *instance's own* `_typeInfo` memo
	// (entityInstance.ts's `_resolveTypeInfo()`, distinct from
	// attributeCache.ts's per-(schema,class) cache primed above) -- every
	// `EntityInstance` object in `walls` gets its first-ever property access
	// here, so without this warm-up pass the *measured* timeCachedAccess() call
	// below would still be paying each instance's one-time `_typeInfo`
	// population cost (a `native.declaration()`/`.schema()`/`.as_entity()`
	// call chain), not the pure steady-state cache-hit cost this benchmark is
	// meant to isolate. `.get()` (the uncached path) never touches
	// `_typeInfo`, so it has no equivalent per-instance warm-up to worry
	// about.
	timeCachedAccess(walls);
	timeUncachedAccess(walls);

	const cachedMs = timeCachedAccess(walls);
	const uncachedMs = timeUncachedAccess(walls);
	const speedup = uncachedMs / cachedMs;

	recordResult({
		name: "attributeAccess.cachedVsUncached",
		wallCount: WALL_COUNT,
		cachedMs,
		uncachedMs,
		speedup,
	});

	expect(speedup).toBeGreaterThan(CACHE_SPEEDUP_MIN);
}

describe("Phase 2.5 benchmark: attribute access, cached (Proxy) vs. uncached (.get())", () => {
	test(`reading .Name on ${WALL_COUNT} entities is meaningfully faster via the cached Proxy path than via the uncached .get() escape hatch`, () => {
		const file = buildLargeFixtureFile();
		try {
			runCachedVsUncachedBenchmark(file);
		} finally {
			// Not strictly load-bearing (a short-lived `npm run bench` process
			// reclaims this on exit either way, matching file.ts's own
			// documented GC/exit fallback for an un-disposed `IfcFile`), but
			// this benchmark builds a fresh WALL_COUNT-entity native file and
			// there's no reason to hold it open past this test.
			file.dispose();
		}
	}, 60_000);
});
