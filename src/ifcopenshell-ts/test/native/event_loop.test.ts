// This file was generated with the assistance of an AI coding tool.
//
// Closes a real, verified gap (not already covered by test/native/primitives.test.ts's
// "Phase 1 async primitive layer" suite): `planning/ifcopenshell-ts/40-testing-strategy.md`
// SS7's "Event-loop liveness under load" requirement, one of the two native-layer
// robustness requirements gating Phase 1's close. The existing async tests all confirm
// "the Promise eventually resolves with the right value" -- none of them prove the async
// primitives (`napi_create_async_work`-based) actually run off the main thread rather than
// blocking it. Without a test like this one, an async primitive accidentally implemented as
// "synchronous work wrapped in a resolved Promise" (a real, easy-to-make mistake) would pass
// every one of those functional tests while still fully blocking the event loop in
// production -- exactly the failure mode the async work was added to prevent, silently
// unverified.
//
// Technique: start `open_path_async()` on a large, generated-on-the-fly fixture (large
// enough that the native parse takes a measurable amount of wall time), and keep a
// `setInterval` ticking on the main thread throughout. A worker-thread-backed async
// primitive lets that interval keep firing on roughly its scheduled cadence the whole time.
// A secretly-synchronous one -- whether the blocking work runs directly inside the N-API
// call before the Promise is even returned, or is deferred onto a same-thread
// micro/macrotask that then blocks when it runs -- starves the interval's callbacks, which
// then queue up and fire in one late burst once the blocking work finally yields: visible as
// one large gap between consecutive tick timestamps (on the order of the whole parse
// duration), instead of many small ones close to the configured interval period.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { performance } from "node:perf_hooks";
import { describe, expect, test } from "vitest";
import { file as File } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";

function openBlankIfc4File(): File {
	return new File(native.file_new());
}

// Large enough that the native SPF parse this test awaits takes long enough (comfortably
// more than a handful of the timer's 5ms ticks, even on a fast/loaded CI runner) for a
// blocked event loop to show up unambiguously as one large gap in the tick record, rather
// than being indistinguishable from ordinary scheduler jitter.
const WALL_COUNT = 60_000;
const TICK_INTERVAL_MS = 5;
// Generous absolute cap on any single gap between ticks: far above TICK_INTERVAL_MS (to
// absorb normal Node timer/CI scheduling jitter) but far below what a genuinely blocked
// event loop would produce for a 60k-entity parse (expected to run at least tens of
// milliseconds; a synchronous block for that long would blow well past this cap).
const MAX_ALLOWED_TICK_GAP_MS = 250;

function buildLargeFixture(): string {
	const file = openBlankIfc4File();
	const schema = file.schema();
	const wallDeclaration = schema.declaration_by_name_with_name("IfcWall");
	for (let i = 0; i < WALL_COUNT; i++) {
		const wall = file.create_with_declaration_instance_id(wallDeclaration, -1);
		wall.set_attribute_value(0, {
			kind: native.STRING,
			string_value: `3xhrZ$4XvA0v3iZQ8gGv${String(i).padStart(6, "0")}`,
		});
	}
	const targetPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-")), "large.ifc");
	file.write(targetPath);
	return targetPath;
}

describe("Phase 1 async primitive layer: event-loop liveness under load", () => {
	test("an in-flight open_path_async() of a large file does not block a concurrent timer", async () => {
		const largePath = buildLargeFixture();

		const tickGaps: number[] = [];
		let lastTick = performance.now();
		const interval = setInterval(() => {
			const now = performance.now();
			tickGaps.push(now - lastTick);
			lastTick = now;
		}, TICK_INTERVAL_MS);

		const parseStart = performance.now();
		const reopened = await File.open_path_async(largePath);
		const parseDuration = performance.now() - parseStart;
		clearInterval(interval);

		// Correctness sanity check, not the point of this test (already covered by
		// primitives.test.ts): confirm the large file actually round-tripped.
		expect(reopened.schema().name()).toBe("IFC4");
		expect(reopened.get_max_id()).toBe(WALL_COUNT);

		// The actual liveness assertion: no single gap between timer ticks approached
		// the parse's own duration -- if the event loop had been blocked for the parse's
		// duration, every tick due during that window would have queued up and fired
		// together the instant it unblocked, producing one gap close to `parseDuration`
		// instead of many small ones.
		expect(tickGaps.length).toBeGreaterThan(0);
		const maxGap = Math.max(...tickGaps);
		expect(maxGap).toBeLessThan(MAX_ALLOWED_TICK_GAP_MS);
		// Complementary assertion scaled to this run's own measured parse duration
		// instead of the fixed constant above -- written against `parseDuration` alone
		// (not wrapped in a max() with MAX_ALLOWED_TICK_GAP_MS, which would make this
		// always true whenever the assertion above already passed, and so add no real
		// coverage): the largest gap must stay a small fraction of the parse's own
		// duration, not comparable to it, independent of whatever the fixed constant is
		// currently tuned to.
		expect(maxGap).toBeLessThan(parseDuration * 0.5);
	}, 30_000);
});
