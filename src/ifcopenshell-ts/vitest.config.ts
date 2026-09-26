import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		// `--expose-gc` (Phase 1's native memory-accounting chunk,
		// planning/ifcopenshell-ts/10-architecture.md's "Native object lifetime" section):
		// test/native/memory.test.ts calls `global.gc()` directly to force collection of
		// dropped native-handle wrappers, verifying `napi_adjust_external_memory`
		// accounting and dispose()/finalizer interaction don't crash or corrupt memory
		// under real GC pressure -- `global.gc` is `undefined` without this flag.
		pool: "forks",
		poolOptions: {
			forks: {
				execArgv: ["--expose-gc"],
			},
		},
	},
});
