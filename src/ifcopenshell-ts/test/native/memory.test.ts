// This file was generated with the assistance of an AI coding tool.
//
// Phase 1's native memory-accounting chunk (planning/ifcopenshell-ts/10-architecture.md's
// "Native object lifetime" section, `20-roadmap.md`'s "Native memory accounting" task):
// every native allocation reports itself to V8 via `napi_adjust_external_memory`, and
// `file` gets a `dispose()`/`Symbol.dispose` method for deterministic early release.
//
// This exercises things `emit.py`'s generated code can't be verified correct by
// TypeScript's type system or by inspecting the generated source alone: (a) `dispose()`
// actually releases the underlying native handle early and makes the wrapper safely
// inert afterward (a second `dispose()` call, or any other method call, throws cleanly
// instead of crashing on a use-after-free), (b) `dispose()` correctly refuses to run
// while an async op on the same handle is in flight (a real data race otherwise -- see
// that test's own comment), and (c) forced-GC pressure across many created-and-dropped
// handles -- disposed and undisposed alike -- doesn't crash or corrupt memory, following
// the same real-Node, `--expose-gc`/`global.gc()`-based verification approach the prior
// async-primitives chunk already used successfully to validate its own `napi_ref`-pinning
// design (see vitest.config.ts's `--expose-gc`).

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { file as File } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";

function openBlankIfc4File(): File {
	return new File(native.file_new());
}

// `@types/node`'s `global.gc` is typed `(() => void) | undefined` (only actually defined
// at runtime under `--expose-gc`, see vitest.config.ts) -- a local, narrowed accessor
// keeps every call site below from having to repeat the non-null assertion.
function forceGc(): () => void {
	const gc = global.gc;
	if (typeof gc !== "function") {
		throw new Error("run with --expose-gc (see vitest.config.ts's poolOptions.forks.execArgv)");
	}
	return gc;
}

describe("Phase 1 native memory accounting", () => {
	test("dispose() releases the file early: a second dispose() call throws cleanly", () => {
		const file = openBlankIfc4File();
		// Sanity: the file is usable before disposal.
		expect(file.schema().name()).toBe("IFC4");

		file.dispose();

		expect(() => file.dispose()).toThrow();
	});

	test("dispose() makes the wrapper safely inert: any other method call throws cleanly, not crashes", () => {
		const file = openBlankIfc4File();
		file.dispose();

		// A representative sample of the primitive surface a disposed `file` might still
		// be called through -- every one of these must throw a catchable JS `Error`
		// (the disposed-guard `emit.py` adds to every method/free_function call on a
		// `"shared_ptr"`-kind class), never crash the process via a use-after-free on the
		// native handle `dispose()` already released.
		expect(() => file.schema()).toThrow();
		expect(() => native.file_write(file._handle, "/tmp/should-not-be-reached.ifc")).toThrow();
	});

	test("[Symbol.dispose] delegates to dispose(), enabling `using` declarations", () => {
		const file = openBlankIfc4File();
		expect(typeof file[Symbol.dispose]).toBe("function");
		file[Symbol.dispose]();
		expect(() => file.dispose()).toThrow();
	});

	test("forced GC pressure across many created-and-dropped file handles doesn't crash or corrupt memory", () => {
		const gc = forceGc();

		const before = process.memoryUsage().external;
		for (let i = 0; i < 200; i++) {
			// Deliberately not retained past this iteration -- eligible for collection
			// immediately, forcing `ifcopenshell_file_finalize` to run under GC pressure
			// rather than relying on the process exiting to reclaim it.
			const file = openBlankIfc4File();
			const schema = file.schema();
			expect(schema.name()).toBe("IFC4");
		}
		gc();
		gc();
		const after = process.memoryUsage().external;

		// Each dropped `file` wrapper represented 1 MiB of reported external memory
		// (napi_binding.py's `class_native_size_hints`); if the finalizer's
		// `napi_adjust_external_memory` accounting were wrong (e.g. never firing, or
		// double-firing against already-freed memory), this would either stay pinned
		// near 200 MiB above `before` or go implausibly negative. A generous bound (well
		// under the 200 MiB these handles would represent if never reclaimed) confirms
		// the accounting is actually tracking real collection, not just not-crashing.
		expect(after - before).toBeLessThan(50 * 1024 * 1024);
	});

	test("dispose() refuses to run while an async op on the same handle is in flight, then succeeds once it completes", async () => {
		// Found by self-review, not by the initial implementation: `dispose()`'s
		// `handle->value.reset()` runs on the main thread, while `write_async`'s
		// worker-thread `execute` callback dereferences that exact same `shared_ptr`
		// instance (`ifcopenshell_file_write`'s `handle->value->write(...)`) --
		// concurrent read+write of one `shared_ptr` instance (as opposed to two
		// different instances referring to the same object) is a real data race.
		// `emit.py`'s generated `async_refcount` guard (incremented before the work is
		// queued, decremented once the worker thread has fully returned) is what makes
		// this test observe a clean thrown error instead of racing.
		const file = openBlankIfc4File();
		const targetPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-")), "model.ifc");

		const writePromise = file.write_async(targetPath);
		expect(() => file.dispose()).toThrow(/async work/);

		await writePromise;
		expect(fs.existsSync(targetPath)).toBe(true);

		// Now that the async op has completed, dispose() is unblocked again.
		expect(() => file.dispose()).not.toThrow();
		expect(() => file.dispose()).toThrow();
	});

	test("forced GC pressure with a mix of disposed and GC-reclaimed handles doesn't crash or corrupt memory", () => {
		const gc = forceGc();

		for (let round = 0; round < 10; round++) {
			const handles: File[] = [];
			for (let i = 0; i < 50; i++) {
				handles.push(openBlankIfc4File());
			}
			// Dispose half deterministically; the other half is left for the finalizer.
			// Exercises both release paths interacting with the same GC pass without
			// double-freeing or double-decrementing the external-memory accounting for
			// either half.
			for (let i = 0; i < handles.length; i += 2) {
				handles[i].dispose();
			}
			gc();
		}
		gc();

		// Reaching here (rather than the process segfaulting) is the actual assertion --
		// still confirm the addon is otherwise in a sane, still-usable state afterward.
		const file = openBlankIfc4File();
		expect(file.schema().name()).toBe("IFC4");
	});
});
