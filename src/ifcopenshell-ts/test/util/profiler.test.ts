// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `profiler.py` (confirmed: `src/ifcopenshell-
// python/test/util/` has no `test_profiler.py`) -- original coverage written directly
// against `profiler.py`'s own source and `util/profiler.ts`'s own port (see that
// file's own header comment for the `with Profiler(task): ...` -> `enter()`/`exit()`
// translation this exercises). Schema-independent (no IFC-domain dependency at all),
// so no `AVAILABLE_SCHEMAS` gating is needed anywhere in this file.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Profiler } from "../../src/util/profiler";

describe("util.profiler Profiler", () => {
	let logSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
	});

	afterEach(() => {
		logSpy.mockRestore();
	});

	test('enter() then exit() logs "<task> <elapsed:.6f> s" (Python\'s own f-string format)', () => {
		const profiler = new Profiler("my task");
		profiler.enter();
		profiler.exit();

		expect(logSpy).toHaveBeenCalledTimes(1);
		const [message] = logSpy.mock.calls[0] as [string];
		expect(message).toMatch(/^my task \d+\.\d{6} s$/);
	});

	test("elapsed time reflects real time passed between enter() and exit()", () => {
		const profiler = new Profiler("busy task");
		profiler.enter();
		// Busy-wait a small amount of real, wall-clock time (this module's own timer
		// is a monotonic clock, not something fakeable via vitest's fake timers).
		const until = process.hrtime.bigint() + 5_000_000n; // 5ms in nanoseconds
		while (process.hrtime.bigint() < until) {
			// spin
		}
		profiler.exit();

		const [message] = logSpy.mock.calls[0] as [string];
		const elapsedSeconds = Number(message.split(" ")[2]);
		expect(elapsedSeconds).toBeGreaterThan(0);
	});

	test("different task labels are reproduced verbatim in the logged message", () => {
		const profiler = new Profiler("a-very-specific-task-name");
		profiler.enter();
		profiler.exit();

		const [message] = logSpy.mock.calls[0] as [string];
		expect(message.startsWith("a-very-specific-task-name ")).toBe(true);
	});

	test("[Symbol.dispose]() is a thin alias for exit() (Python's __exit__ ignores its *args triple)", () => {
		const profiler = new Profiler("disposed task");
		profiler.enter();
		profiler[Symbol.dispose]();

		expect(logSpy).toHaveBeenCalledTimes(1);
		const [message] = logSpy.mock.calls[0] as [string];
		expect(message).toMatch(/^disposed task \d+\.\d{6} s$/);
	});

	test("exit() without a prior enter() still logs (start defaults to construction-relative zero, matching a bare, mis-used __exit__ call)", () => {
		const profiler = new Profiler("no-enter task");
		profiler.exit();

		expect(logSpy).toHaveBeenCalledTimes(1);
	});
});
