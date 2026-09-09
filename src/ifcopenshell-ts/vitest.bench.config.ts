// This file was generated with the assistance of an AI coding tool.
//
// Separate Vitest config for Phase 2.5's benchmark suite (test/bench/*.bench.ts), run
// via `npm run bench`. Deliberately its own config/`npm` script rather than folding
// `test/bench/**` into vitest.config.ts's default `test.include` -- these are large
// (WALL_COUNT-entity), timing-sensitive suites that would slow down and add timing
// noise to every regular `npm test` invocation across all 6 build-and-test OS/arch
// legs and the asan-ubsan job (whose sanitizer instrumentation would badly skew any
// timing threshold), none of which should run or gate on these benchmarks. Only the
// new, dedicated `benchmark` CI job (Linux x64 only -- see
// .github/workflows/ci-ifcopenshell-ts.yml's own comment on that job for why) runs
// `npm run bench`.
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/bench/**/*.bench.ts"],
		// Matches vitest.config.ts's own reasoning (that file's comment): not strictly
		// needed by anything in this directory today, kept for consistency in case a
		// future benchmark here wants to force a GC pass between timed sections to
		// reduce noise from an in-flight collection.
		pool: "forks",
		poolOptions: {
			forks: {
				execArgv: ["--expose-gc"],
			},
		},
		// Critical for this directory specifically (found by review, not present in
		// vitest.config.ts's own default): Vitest's default is to run test *files* in
		// parallel across separate fork processes. Two independent problems that
		// causes here, neither present for ordinary correctness tests: (1)
		// reporter.ts's recordResult() does an unguarded read-modify-write
		// (readFileSync -> JSON.parse -> push -> writeFileSync) on one shared
		// bench-results.json at the package root -- concurrent bench files racing on
		// that file can silently clobber each other's entries; (2) these benchmarks
		// are *measuring wall-clock time*, and letting 3 separate processes fight for
		// CPU on a (typically 2-core) CI runner while each tries to time itself
		// directly undermines the low-noise, single-leg design this whole job exists
		// for (see the `benchmark` CI job's own comment in
		// .github/workflows/ci-ifcopenshell-ts.yml). `fileParallelism: false` runs
		// the bench files sequentially, fixing both at once.
		fileParallelism: false,
	},
});
