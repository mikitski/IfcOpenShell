// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/profiler.py` (src/ifcopenshell-python, 35
// lines) -- Phase 10's "Niche `util` modules" chunk (`PROGRESS.md`'s own table entry),
// one of the 3 confirmed-remaining-unported real Python `util` files, confirmed via a
// dedicated audit to have no blocking dependency at all (stdlib `timeit` only). No real
// Python test file exists for this module (confirmed: `src/ifcopenshell-python/test/
// util/` has no `test_profiler.py`), and it has zero real callers anywhere in the real
// Python source tree either (confirmed by grepping `ifcopenshell`/`test` for
// `util.profiler`/`import.*profiler` -- no hits) -- this is a small, standalone,
// unused-but-public timing helper. Original test coverage written directly against
// `profiler.py`'s own source.
//
// *** Language-idiom translation, disclosed rather than silently reshaped ***: Python's
// `Profiler` is a context-manager class (`__enter__`/`__exit__`), used as `with
// Profiler(task): ...`. TS/JS has no direct equivalent statement (`using` declarations,
// TS 5.2+/TC39 stage-3, exist in principle -- `src/file.ts`'s `IfcFile` already
// implements `[Symbol.dispose]()` for exactly this -- but no test or real call site
// anywhere in this port actually exercises a `using` DECLARATION today, so leaning on it
// here for a from-scratch, previously-unused module would be new, unverified surface,
// not a reuse of an established pattern). Ported instead as a plain class with explicit
// `enter()`/`exit()` methods, one-for-one with Python's own `__enter__`/`__exit__`
// (`*args` on `__exit__` is Python's exception-info triple, unused by the real body and
// therefore not given a TS parameter at all) -- callers reproduce `with Profiler(task):
// body()` as `const p = new Profiler(task); p.enter(); try { body(); } finally {
// p.exit(); }`. `[Symbol.dispose]()` is ALSO provided, as a thin alias for `exit()`
// (matching `IfcFile`'s own "real method plus well-known-symbol alias" precedent) so a
// future caller CAN use `using p = new Profiler(task); p.enter(); ...` once `using` is
// established elsewhere in this port -- but `enter()`/`exit()` are the primary,
// Python-parity surface, and are what this file's own tests exercise directly.
//
// Python's `timeit.default_timer` is `time.perf_counter` (a monotonic, sub-millisecond
// clock returning seconds as a float) -- ported as Node's `process.hrtime.bigint()`
// (nanosecond-resolution monotonic clock) divided down to seconds, rather than
// `performance.now()` (millisecond resolution), for the closer resolution match to
// Python's own `perf_counter`; the printed format (`:.6f`, 6 decimal places) doesn't
// distinguish between the two in practice, this is purely a "use the more precise
// primitive available" choice, not a behavior difference.
//
// No disclosed primitive-layer gap: this module has no IFC-domain dependency
// whatsoever, direct or transitive, beyond the host language's own monotonic clock and
// console output.

/**
 * Python: `class Profiler`.
 *
 * A timing utility, useful for measuring function performance. See this file's own
 * header comment for the `with Profiler(task): ...` -> `enter()`/`try`/`finally
 * exit()` translation.
 */
export class Profiler {
	private readonly task: string;
	private start = 0n;

	constructor(task: string) {
		this.task = task;
	}

	/** Python: `Profiler.__enter__`. */
	enter(): void {
		this.start = process.hrtime.bigint();
	}

	/** Python: `Profiler.__exit__(self, *args)` -- the exception-info triple Python
	 * receives here is unused by the real body (never suppresses an exception), so
	 * this takes no parameters. */
	exit(): void {
		const elapsedSeconds = Number(process.hrtime.bigint() - this.start) / 1e9;
		console.log(`${this.task} ${elapsedSeconds.toFixed(6)} s`);
	}

	/** Thin alias for `exit()` -- see this file's own header comment. */
	[Symbol.dispose](): void {
		this.exit();
	}
}
